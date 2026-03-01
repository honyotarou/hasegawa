import { useCallback, useEffect, useReducer } from 'react';
import type {
  AppState,
  Mode,
  Patient,
  Screen,
  SessionSnapshot,
  SubmitResult,
} from '../../types';

type Action =
  | { type: 'GOTO_SCREEN'; screen: Screen }
  | { type: 'SET_PATIENTS'; patients: Patient[]; batchId: string }
  | { type: 'UPDATE_PATIENT'; index: number; patch: Partial<Patient> }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; result: SubmitResult }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESTORE_SESSION'; snapshot: SessionSnapshot };

function localToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const INITIAL_STATE: AppState = {
  screen: 'SETUP',
  patients: [],
  currentBatchId: null,
  mode: 'prod',
  selectedDate: localToday(),
  submitError: null,
  isSubmitting: false,
  lastSubmitResult: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'GOTO_SCREEN':
      return { ...state, screen: action.screen, submitError: null };

    case 'SET_PATIENTS':
      return {
        ...state,
        patients: action.patients,
        currentBatchId: action.batchId,
        screen: 'MAIN',
      };

    case 'UPDATE_PATIENT': {
      const patients = state.patients.map((patient, idx) =>
        idx === action.index ? { ...patient, ...action.patch } : patient,
      );
      return { ...state, patients };
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_DATE':
      return { ...state, selectedDate: action.date };

    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, submitError: null };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        currentBatchId: null,
        patients: [],
        screen: 'DONE',
        lastSubmitResult: action.result,
      };

    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, submitError: action.error };

    case 'RESTORE_SESSION':
      return {
        ...state,
        patients: action.snapshot.patients,
        currentBatchId: action.snapshot.batchId,
        selectedDate: action.snapshot.selectedDate,
        mode: action.snapshot.mode,
        screen: 'MAIN',
      };

    default:
      return state;
  }
}

async function saveSnapshot(state: AppState): Promise<void> {
  if (!state.currentBatchId) return;
  const snapshot: SessionSnapshot = {
    batchId: state.currentBatchId,
    patients: state.patients,
    selectedDate: state.selectedDate,
    mode: state.mode,
  };
  await chrome.storage.session.set({ inputSnapshot: snapshot });
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    chrome.storage.session
      .get('inputSnapshot')
      .then((res: any) => {
        const snap = res.inputSnapshot as SessionSnapshot | undefined;
        if (snap?.batchId && snap.patients?.length > 0) {
          dispatch({ type: 'RESTORE_SESSION', snapshot: snap });
        }
      })
      .catch((err) => {
        console.error('Failed to restore session snapshot:', err);
      });
  }, []);

  useEffect(() => {
    saveSnapshot(state).catch((err) => {
      console.error('Failed to save session snapshot:', err);
    });
  }, [state.patients, state.currentBatchId, state.selectedDate, state.mode]);

  useEffect(() => {
    if (state.screen === 'DONE') {
      chrome.storage.session.remove('inputSnapshot').catch((err) => {
        console.error('Failed to clear session snapshot:', err);
      });
    }
  }, [state.screen]);

  const pendingRehab = state.patients.filter((p) => p.rehab === null).length;
  const pendingDiag = state.patients.filter((p) => !p.diagnoses[0]?.trim()).length;
  const hasAgeError = state.patients.some(
    (p) => !Number.isInteger(p.age) || p.age < 1 || p.age > 150,
  );
  const pendingCount = pendingRehab + pendingDiag;
  const canSubmit =
    state.patients.length > 0 &&
    pendingRehab === 0 &&
    pendingDiag === 0 &&
    !hasAgeError;

  const goToScreen = useCallback((screen: Screen) => {
    dispatch({ type: 'GOTO_SCREEN', screen });
  }, []);

  return {
    state,
    dispatch,
    goToScreen,
    pendingCount,
    pendingRehab,
    pendingDiag,
    canSubmit,
  };
}
