import { extractPatientsFromDOM } from '../../content/extractPatients';
import type { AppState, Patient } from '../../types';
import styles from '../app.module.css';
import { Header } from '../components/Header';
import { PatientRow } from '../components/PatientRow';
import { ModeToggle } from '../components/ModeToggle';

type MainScreenProps = {
  state: Pick<AppState, 'patients' | 'mode' | 'selectedDate' | 'submitError'>;
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
  const patientCount = state.patients.length;

  async function handleFetch() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        dispatch({ type: 'SUBMIT_ERROR', error: 'アクティブなタブが見つかりません' });
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: false },
        func: extractPatientsFromDOM,
      });

      const result = results?.[0]?.result as any;
      if (!result?.success) {
        dispatch({
          type: 'SUBMIT_ERROR',
          error: result?.error || 'データ取得に失敗しました',
        });
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
    } catch (err: any) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: err?.message || String(err),
      });
    }
  }

  function jumpToPending() {
    const pending = document.querySelector('[data-pending="true"]');
    const target = pending || document.body;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function dateForDisplay(dateText: string): string {
    return dateText.replace(/-/g, '/');
  }

  function renderPendingStatus(): React.ReactNode {
    if (patientCount === 0) {
      return <span className={styles['status-pill']}>患者データを取得してください</span>;
    }
    if (pendingCount === 0) {
      return <span className={`${styles['status-pill']} ${styles['status-good']}`}>✅ 全員入力済み</span>;
    }
    return (
      <span className={styles['status-pill']}>
        リハ未選択: {pendingRehab}件 / 診断名未入力: {pendingDiag}件
      </span>
    );
  }

  return (
    <section className={styles.screen}>
      <Header
        dateText={dateForDisplay(state.selectedDate)}
        onSettings={() => dispatch({ type: 'GOTO_SCREEN', screen: 'SETTINGS' })}
      />

      <div className={styles.content}>
        <h2>入力画面</h2>

        <div className={styles.toolbar}>
          <div className={styles['toolbar-top']}>
            <button className={styles['primary-btn']} type="button" onClick={() => void handleFetch()}>
              ChatGPTから取得
            </button>
            <input
              aria-label="selected-date"
              className={styles['date-input']}
              type="date"
              value={state.selectedDate}
              onChange={(e) => dispatch({ type: 'SET_DATE', date: e.target.value })}
            />
          </div>
          <div className={styles['toolbar-bottom']}>
            {renderPendingStatus()}
            <button
              className={styles['secondary-btn']}
              type="button"
              disabled={patientCount === 0 || pendingCount === 0}
              onClick={jumpToPending}
            >
              次の未選択へ↓
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles['table-head']}>
            <span>No</span>
            <span>年齢</span>
            <span>性別</span>
            <span>診断名</span>
            <span>リハ</span>
          </div>
          <div className={styles.rows}>
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
        </div>

        <div className={styles.footer}>
          {storage.settings.gasUrlDev ? (
            <ModeToggle
              mode={state.mode}
              onToggle={(mode) => dispatch({ type: 'SET_MODE', mode })}
            />
          ) : (
            <span />
          )}
          <button
            className={styles['primary-btn']}
            type="button"
            disabled={!canSubmit}
            onClick={() => dispatch({ type: 'GOTO_SCREEN', screen: 'CONFIRM' })}
          >
            全件送信（{patientCount}件）
          </button>
        </div>

        {state.submitError ? <div className={styles['status-error']}>{state.submitError}</div> : null}
      </div>
    </section>
  );
}
