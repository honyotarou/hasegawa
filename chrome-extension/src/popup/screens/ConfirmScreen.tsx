import { sendBatch } from '../../sendBatch';
import type { AppState } from '../../types';
import { DOCTOR_ID_FORMAT_ERROR, getDoctorIdError, normalizeDoctorId } from '../../doctorId';
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

function getBlockingReasons(
  state: Pick<AppState, 'currentBatchId' | 'patients' | 'mode'>,
  storage: ConfirmScreenProps['storage'],
  gasUrl: string,
): string[] {
  const reasons: string[] = [];
  if (!state.currentBatchId) reasons.push('batchId未生成');
  if (state.patients.length === 0) reasons.push('患者データ0件');
  if (!gasUrl) reasons.push('GAS URL未設定');
  if (gasUrl && !isAllowedGasUrl(gasUrl)) reasons.push('GAS URLが許可ドメイン外');
  if (!storage.apiSecret?.trim()) reasons.push('API_SECRET未設定');
  const doctorId = normalizeDoctorId(storage.settings.doctorId || '');
  const doctorIdError = getDoctorIdError(doctorId);
  if (doctorIdError === '社員番号は必須です') reasons.push('医師ID未設定');
  else if (doctorIdError) reasons.push('医師ID形式不正');
  return reasons;
}

function blockingReasonToError(reason: string): string {
  switch (reason) {
    case 'batchId未生成':
      return 'batchIdがありません。患者データを再取得してください。';
    case '患者データ0件':
      return '患者データがありません。患者データを再取得してください。';
    case 'GAS URL未設定':
      return 'GAS URLが未設定です。設定画面を確認してください。';
    case 'GAS URLが許可ドメイン外':
      return 'GAS URLは script.google.com / script.googleusercontent.com のHTTPS URLを指定してください。';
    case 'API_SECRET未設定':
      return '送信用シークレット(API_SECRET)を再入力してください。';
    case '医師ID未設定':
      return '社員番号（医師ID）が未設定です。';
    case '医師ID形式不正':
      return DOCTOR_ID_FORMAT_ERROR;
    default:
      return reason;
  }
}

export function ConfirmScreen({ state, dispatch, storage, diagnosis }: ConfirmScreenProps) {
  const total = state.patients.length;
  const yesCount = state.patients.filter((p) => p.rehab === true).length;
  const noCount = state.patients.filter((p) => p.rehab === false).length;
  const displayDate = (state.selectedDate || '').replace(/-/g, '/');
  const doctorId = normalizeDoctorId(storage.settings.doctorId || '') || '-';

  const gasUrl = state.mode === 'prod' ? storage.settings.gasUrlProd : storage.settings.gasUrlDev;
  const blockingReasons = getBlockingReasons(state, storage, gasUrl);
  const canSubmit = blockingReasons.length === 0;
  const shortBatchId = state.currentBatchId ? `${state.currentBatchId.slice(0, 8)}...` : '-';
  const modeLabel = state.mode === 'prod' ? '本番' : '開発';

  async function handleSubmit() {
    if (blockingReasons.length > 0) {
      dispatch({ type: 'SUBMIT_ERROR', error: blockingReasonToError(blockingReasons[0]) });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const response = await sendBatch(
        state,
        gasUrl,
        storage.apiSecret,
        normalizeDoctorId(storage.settings.doctorId || ''),
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
        <div className={styles['screen-heading-wrap']}>
          <h2 className={styles['screen-heading']}>送信承認</h2>
          <p className={styles['screen-subheading']}>
            送信先・担当者・件数・batchIdを確認してから送信してください。
          </p>
        </div>

        <div className={styles['summary-grid']}>
          <div className={styles['summary-card']}>
            <div className={styles['summary-label']}>送信先</div>
            <div className={styles['summary-value']}>{modeLabel}</div>
            <div className={styles['summary-note']}>{gasUrl || '-'}</div>
          </div>
          <div className={styles['summary-card']}>
            <div className={styles['summary-label']}>担当者</div>
            <div className={styles['summary-value']}>{doctorId}</div>
            <div className={styles['summary-note']}>送信日: {displayDate || '-'}</div>
          </div>
          <div className={styles['summary-card']}>
            <div className={styles['summary-label']}>対象件数</div>
            <div className={styles['summary-value']}>{total}件</div>
            <div className={styles['summary-note']}>リハあり {yesCount}件 / なし {noCount}件</div>
          </div>
          <div className={styles['summary-card']}>
            <div className={styles['summary-label']}>batchId</div>
            <div className={styles['summary-value']}>{shortBatchId}</div>
            <div className={styles['summary-note']}>batchId: {shortBatchId}</div>
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
            {state.patients.map((p, index) => (
              <div key={`${index}-${p.age}`} className={styles['patient-row']}>
                <span className={styles['row-no']}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles['row-no']}>{p.age}歳</span>
                <span className={styles['row-no']}>{p.gender}</span>
                <span className={styles['row-no']}>{p.diagnoses[0] || '未入力'}</span>
                <span className={styles['row-no']}>
                  {p.rehab === null ? '未入力' : p.rehab ? '✅ あり' : '❌ なし'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles['confirm-summary']} ${styles['decision-block']}`}>
          <div className={styles['decision-title']}>送信前チェック</div>
          {blockingReasons.length === 0 ? (
            <span className={styles['status-good']}>送信判定: 送信可能</span>
          ) : (
            <>
              <span className={styles['status-error']}>送信判定: 送信不可</span>
              <div className={styles['decision-reasons']}>
                理由: {blockingReasons.join(' / ')}
              </div>
            </>
          )}
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
            disabled={state.isSubmitting || !canSubmit}
          >
            {state.isSubmitting ? '送信中...' : '送信する'}
          </button>
        </div>

        {state.submitError ? <div className={styles['status-error']}>{state.submitError}</div> : null}
      </div>
    </section>
  );
}
