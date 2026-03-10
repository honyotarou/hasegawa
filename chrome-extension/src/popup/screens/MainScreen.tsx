import { useCallback, useRef } from 'react';
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
  pendingAge: number;
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

function removePatient(dispatch: React.Dispatch<any>, index: number): void {
  dispatch({ type: 'REMOVE_PATIENT', index });
}

const RESTRICTED_TAB_ERROR =
  'このページでは取得できません。ChatGPTの会話ページかJSON表示ページを開いてください。';

function isRestrictedTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^(about:|chrome:\/\/|chrome-extension:\/\/|edge:\/\/)/i.test(url);
}

function getExtractionErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /Cannot access a chrome:\/\/ URL/i.test(message) ||
    /Cannot access contents of url/i.test(message) ||
    /extensions gallery cannot be scripted/i.test(message)
  ) {
    return RESTRICTED_TAB_ERROR;
  }
  return message;
}

export function MainScreen({
  state,
  dispatch,
  storage,
  pendingCount,
  pendingRehab,
  pendingDiag,
  pendingAge,
  canSubmit,
  diagnosis,
}: MainScreenProps) {
  const patientCount = state.patients.length;
  const rowKeyMapRef = useRef<WeakMap<Patient, string>>(new WeakMap());
  const rowKeySeqRef = useRef(0);
  const handlePatientPatch = useCallback((index: number, patch: Partial<Patient>) => {
    patchPatient(dispatch, index, patch);
  }, [dispatch]);
  const handlePatientRemove = useCallback((index: number) => {
    removePatient(dispatch, index);
  }, [dispatch]);

  const getRowKey = useCallback((patient: Patient, index: number) => {
    const current = rowKeyMapRef.current.get(patient);
    if (current) {
      return current;
    }
    rowKeySeqRef.current += 1;
    const next = `patient-row-${rowKeySeqRef.current}-${index}`;
    rowKeyMapRef.current.set(patient, next);
    return next;
  }, []);

  const handleFetch = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        dispatch({ type: 'SUBMIT_ERROR', error: 'アクティブなタブが見つかりません' });
        return;
      }
      if (isRestrictedTabUrl(tab.url)) {
        dispatch({ type: 'SUBMIT_ERROR', error: RESTRICTED_TAB_ERROR });
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
        error: getExtractionErrorMessage(err),
      });
    }
  }, [dispatch]);

  const jumpToPending = useCallback(() => {
    const pending = document.querySelector('[data-pending="true"]');
    const target = pending || document.body;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function dateForDisplay(dateText: string): string {
    return dateText.replace(/-/g, '/');
  }

  function renderPendingStatus(): React.ReactNode {
    if (patientCount === 0) {
      return (
        <div className={`${styles['risk-banner']} ${styles['risk-banner-neutral']}`}>
          <div className={styles['risk-heading']}>準備待ち</div>
          <div className={styles['risk-breakdown']}>患者データを取得してください</div>
        </div>
      );
    }
    if (pendingCount === 0) {
      return (
        <div className={`${styles['risk-banner']} ${styles['risk-banner-ok']}`}>
          <div className={styles['risk-heading']}>✅ 全員入力済み</div>
          <div className={styles['risk-breakdown']}>確認画面へ進んで送信できます</div>
        </div>
      );
    }
    return (
      <div className={`${styles['risk-banner']} ${styles['risk-banner-warn']}`}>
        <div className={styles['risk-heading']}>未解決リスク: {pendingCount}件</div>
        <div className={styles['risk-breakdown']}>
          リハ未選択: {pendingRehab}件 / 診断名未入力: {pendingDiag}件 / 年齢エラー: {pendingAge}件
        </div>
      </div>
    );
  }

  return (
    <section className={styles.screen}>
      <Header
        dateText={dateForDisplay(state.selectedDate)}
        onSettings={() => dispatch({ type: 'GOTO_SCREEN', screen: 'SETTINGS' })}
      />

      <div className={styles.content}>
        <div className={styles['screen-heading-wrap']}>
          <h2 className={styles['screen-heading']}>入力画面</h2>
          <p className={styles['screen-subheading']}>
            未解決リスクを0件にしてから送信してください。
          </p>
        </div>

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
              次の未解決へ↓
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
            <span>削除</span>
          </div>
          <div className={styles.rows}>
            {state.patients.map((patient, index) => (
              <PatientRow
                key={getRowKey(patient, index)}
                index={index}
                patient={patient}
                top5={diagnosis.top5}
                rest={diagnosis.rest}
                onPatch={handlePatientPatch}
                onRemove={handlePatientRemove}
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

        <p className={styles['action-note']}>
          送信前に「未解決リスク」「日付」「診断名」を最終確認してください。
        </p>

        {state.submitError ? <div className={styles['status-error']}>{state.submitError}</div> : null}
      </div>
    </section>
  );
}
