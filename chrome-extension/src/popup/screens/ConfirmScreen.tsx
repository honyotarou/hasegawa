import React from 'react';
import { sendBatch } from '../../sendBatch';
import type { AppState } from '../../types';

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

  async function handleSubmit() {
    dispatch({ type: 'SUBMIT_START' });

    const gasUrl = state.mode === 'prod' ? storage.settings.gasUrlProd : storage.settings.gasUrlDev;

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
    <section>
      <h2>送信内容を確認してください</h2>
      <p>
        合計 {total}件 / リハあり {yesCount}件 なし {noCount}件
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'GOTO_SCREEN', screen: 'MAIN' })}
      >
        戻って修正
      </button>
      <button type="button" onClick={() => void handleSubmit()} disabled={state.isSubmitting}>
        {state.isSubmitting ? '送信中...' : '送信する'}
      </button>
    </section>
  );
}
