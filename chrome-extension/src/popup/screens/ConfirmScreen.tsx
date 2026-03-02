import React from 'react';
import { sendBatch } from '../../sendBatch';
import type { AppState } from '../../types';
import styles from '../app.module.css';
import { Header } from '../components/Header';

type ConfirmScreenProps = {
  state: Pick<AppState, 'patients' | 'currentBatchId' | 'mode'> & AppState;
  dispatch: React.Dispatch<any>;
  storage: {
    settings: { gasUrlProd: string; gasUrlDev: string; doctorId?: string };
    apiSecret: string;
  };
  diagnosis: {
    incrementCounts: (diagNames: string[]) => Promise<void>;
  };
};

export function ConfirmScreen({ state, dispatch, storage, diagnosis }: ConfirmScreenProps) {
  const total = state.patients.length;
  const yesCount = state.patients.filter((p) => p.rehab === true).length;
  const noCount = state.patients.filter((p) => p.rehab === false).length;
  const displayDate = (state.selectedDate || '').replace(/-/g, '/');

  function isAllowedGasUrl(urlStr: string): boolean {
    if (!urlStr) return false;
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:') return false;
      return url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com';
    } catch {
      return false;
    }
  }

  async function handleSubmit() {
    const gasUrl = state.mode === 'prod' ? storage.settings.gasUrlProd : storage.settings.gasUrlDev;
    if (!gasUrl) {
      dispatch({ type: 'SUBMIT_ERROR', error: 'GAS URLが未設定です。設定画面を確認してください。' });
      return;
    }
    if (!isAllowedGasUrl(gasUrl)) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: 'GAS URLは script.google.com / script.googleusercontent.com のHTTPS URLを指定してください。',
      });
      return;
    }
    if (!storage.apiSecret?.trim()) {
      dispatch({ type: 'SUBMIT_ERROR', error: '送信用シークレット(API_SECRET)を再入力してください。' });
      return;
    }
    if (!storage.settings.doctorId?.trim()) {
      dispatch({ type: 'SUBMIT_ERROR', error: '社員番号（医師ID）が未設定です。' });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const response = await sendBatch(
        state,
        gasUrl,
        storage.apiSecret,
        storage.settings.doctorId || '',
      );

      if (!response.success) {
        dispatch({ type: 'SUBMIT_ERROR', error: response.error });
        return;
      }

      const sentDiagNames = state.patients.flatMap((p) => p.diagnoses);
      await diagnosis.incrementCounts(sentDiagNames);

      dispatch({
        type: 'SUBMIT_SUCCESS',
        result: {
          written: response.written,
          skipped: response.skipped,
          submittedAt: new Date().toLocaleString('ja-JP'),
          batchId: state.currentBatchId!,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error:
          error?.name === 'AbortError'
            ? '通信タイムアウト（30秒）。再送するには「送信する」を押してください。'
            : `ネットワークエラー: ${error?.message || String(error)}`,
      });
    }
  }

  return (
    <section className={styles.screen}>
      <Header
        dateText={displayDate}
        onSettings={() => dispatch({ type: 'GOTO_SCREEN', screen: 'SETTINGS' })}
      />

      <div className={styles.content}>
        <h2>送信内容を確認してください</h2>
        <div className={styles.panel}>
          <div className={styles['table-head']}>
            <span>No</span>
            <span>年齢</span>
            <span>性別</span>
            <span>診断名</span>
            <span>リハ</span>
          </div>
          <div className={styles.rows}>
            {state.patients.map((p, index) => (
              <div key={`${index}-${p.age}`} className={styles['patient-row']}>
                <span className={styles['row-no']}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles['row-no']}>{p.age}歳</span>
                <span className={styles['row-no']}>{p.gender}</span>
                <span className={styles['row-no']}>{p.diagnoses[0] || '未入力'}</span>
                <span className={styles['row-no']}>{p.rehab ? '✅ あり' : '❌ なし'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles['confirm-summary']}>
          合計 {total}件 / リハあり {yesCount}件 なし {noCount}件
          <br />
          日付: {displayDate || '-'} / 医師ID: {storage.settings.doctorId || '-'}
        </div>

        <div className={styles.footer}>
          <button
            className={styles['secondary-btn']}
            type="button"
            onClick={() => dispatch({ type: 'GOTO_SCREEN', screen: 'MAIN' })}
          >
            戻って修正
          </button>
          <button
            className={styles['primary-btn']}
            type="button"
            onClick={() => void handleSubmit()}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? '送信中...' : '送信する'}
          </button>
        </div>

        {state.submitError ? <div className={styles['status-error']}>{state.submitError}</div> : null}
      </div>
    </section>
  );
}
