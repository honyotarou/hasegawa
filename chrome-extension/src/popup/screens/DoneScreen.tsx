import type { Dispatch } from 'react';
import type { SubmitResult } from '../../types';
import styles from '../app.module.css';
import { Header } from '../components/Header';

type DoneScreenProps = {
  result: SubmitResult | null;
  dispatch: Dispatch<any>;
};

export function DoneScreen({ result, dispatch }: DoneScreenProps) {
  return (
    <section className={styles.screen}>
      <Header onSettings={() => dispatch({ type: 'GOTO_SCREEN', screen: 'SETTINGS' })} />
      <div className={styles.content}>
        <div className={styles['screen-heading-wrap']}>
          <h2 className={styles['screen-heading']}>送信完了</h2>
          <p className={styles['screen-subheading']}>
            送信結果を確認し、次の患者リスト取得へ進んでください。
          </p>
        </div>
        <div className={styles['done-card']}>
          <div className={styles['done-icon']}>✅</div>
          <div className={styles['done-title']}>{result ? `${result.written}件を送信しました` : '送信完了'}</div>
          {result && result.skipped > 0 ? (
            <div className={styles['done-sub']}>※ {result.skipped}件は重複のためスキップされました</div>
          ) : null}
          <div className={styles['done-sub']}>
            次の患者リストを取得するには「ChatGPTから取得」を押してください
          </div>
          {result ? (
            <>
              <div className={styles['done-meta']}>書き込み件数: {result.written}</div>
              <div className={styles['done-meta']}>重複スキップ: {result.skipped}</div>
              <div className={styles['done-meta']}>送信時刻: {result.submittedAt}</div>
              <div className={styles['done-meta']}>
                batchId: {result.batchId ? `${result.batchId.slice(0, 8)}...` : '-'}
              </div>
            </>
          ) : null}
          <div className={styles['done-actions']}>
            <button
              className={styles['primary-btn']}
              type="button"
              onClick={() => dispatch({ type: 'GOTO_SCREEN', screen: 'MAIN' })}
            >
              ChatGPTから取得
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
