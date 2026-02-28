import React from 'react';
import { extractPatientsFromDOM } from '../../content/extractPatients';
import type { AppState, Patient } from '../../types';
import { PatientRow } from '../components/PatientRow';
import { ModeToggle } from '../components/ModeToggle';

type MainScreenProps = {
  state: Pick<AppState, 'patients' | 'mode' | 'selectedDate'>;
  dispatch: React.Dispatch<any>;
  storage: {
    settings: {
      gasUrlProd: string;
      gasUrlDev: string;
      diagnosisMaster: string[];
    };
  };
  pendingCount: number;
  pendingRehab: number;
  pendingDiag: number;
  canSubmit: boolean;
  diagnosis: {
    top5: string[];
    rest: string[];
    counts: Record<string, number>;
    incrementCounts: (names: string[]) => Promise<void>;
  };
};

function patchPatient(
  dispatch: React.Dispatch<any>,
  index: number,
  patch: Partial<Patient>,
): void {
  dispatch({ type: 'UPDATE_PATIENT', index, patch });
}

export function MainScreen({
  state,
  dispatch,
  storage,
  pendingCount,
  pendingRehab,
  pendingDiag,
  canSubmit,
  diagnosis,
}: MainScreenProps) {
  async function handleFetch() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id!, allFrames: false },
      func: extractPatientsFromDOM,
    });

    const result = results[0].result as any;
    if (!result.success) {
      dispatch({ type: 'SUBMIT_ERROR', error: result.error });
      return;
    }

    const batchId = crypto.randomUUID();
    await chrome.storage.session.set({ currentBatchId: batchId });
    const patients = result.patients.map((p: any) => ({
      age: p.age,
      gender: p.gender,
      diagnoses: [''],
      rehab: null,
      remarks: '',
    }));
    dispatch({ type: 'SET_PATIENTS', patients, batchId });
  }

  function jumpToPending() {
    const pending = document.querySelector('[data-pending="true"]');
    const target = pending || document.body;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <section>
      <h2>入力画面</h2>
      <button type="button" onClick={() => void handleFetch()}>
        ChatGPTから取得
      </button>
      <input
        aria-label="selected-date"
        type="date"
        value={state.selectedDate}
        onChange={(e) => dispatch({ type: 'SET_DATE', date: e.target.value })}
      />

      {pendingCount === 0 ? (
        <p>✅ 全員入力済み</p>
      ) : (
        <p>
          リハ未選択: {pendingRehab}件 / 診断名未入力: {pendingDiag}件
        </p>
      )}

      <button type="button" onClick={jumpToPending}>
        次の未選択へ↓
      </button>

      <div>
        {state.patients.map((patient, index) => (
          <PatientRow
            key={`${index}-${patient.age}`}
            index={index}
            patient={patient}
            top5={diagnosis.top5}
            rest={diagnosis.rest}
            onPatch={(idx, patch) => patchPatient(dispatch, idx, patch)}
          />
        ))}
      </div>

      {storage.settings.gasUrlDev ? (
        <ModeToggle
          mode={state.mode}
          onToggle={(mode) => dispatch({ type: 'SET_MODE', mode })}
        />
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => dispatch({ type: 'GOTO_SCREEN', screen: 'CONFIRM' })}
      >
        全件送信
      </button>
    </section>
  );
}
