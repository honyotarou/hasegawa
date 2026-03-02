import { useState } from 'react';
import type { AppSettings, Screen } from '../../types';
import styles from '../app.module.css';
import { Header } from '../components/Header';

type SettingsScreenProps = {
  storage: {
    settings: AppSettings;
    apiSecret: string;
    saveSettings: (next: AppSettings, secret: string) => Promise<void>;
  };
  goToScreen: (screen: Screen) => void;
};

export function SettingsScreen({ storage, goToScreen }: SettingsScreenProps) {
  const [gasUrlProd, setGasUrlProd] = useState(storage.settings.gasUrlProd);
  const [gasUrlDev, setGasUrlDev] = useState(storage.settings.gasUrlDev);
  const [doctorId, setDoctorId] = useState(storage.settings.doctorId);
  const [diagnosisMasterText, setDiagnosisMasterText] = useState(
    storage.settings.diagnosisMaster.join('\n'),
  );
  const [secret, setSecret] = useState(storage.apiSecret);
  const [showSecret, setShowSecret] = useState(false);

  const [error, setError] = useState('');

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

  async function handleSave() {
    const diagnosisMaster = diagnosisMasterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const prod = gasUrlProd.trim();
    const dev = gasUrlDev.trim();
    const doc = doctorId.trim();
    const sec = secret.trim();

    if (!prod) {
      setError('GAS URL（本番）は必須です');
      return;
    }
    if (!isAllowedGasUrl(prod)) {
      setError('GAS URL（本番）は script.google.com / script.googleusercontent.com のHTTPS URLを入力してください');
      return;
    }
    if (dev && !isAllowedGasUrl(dev)) {
      setError('GAS URL（開発）は script.google.com / script.googleusercontent.com のHTTPS URLを入力してください');
      return;
    }
    if (!sec) {
      setError('送信用シークレット（API_SECRET）は必須です');
      return;
    }
    if (!doc) {
      setError('社員番号は必須です');
      return;
    }
    if (diagnosisMaster.length === 0) {
      setError('診断名を1件以上入力してください');
      return;
    }

    try {
      setError('');
      await storage.saveSettings(
        {
          gasUrlProd: prod,
          gasUrlDev: dev,
          doctorId: doc,
          diagnosisMaster,
        },
        sec,
      );
      goToScreen('MAIN');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    }
  }

  return (
    <section className={styles.screen}>
      <Header onSettings={() => goToScreen('MAIN')} />
      <div className={styles['settings-screen']}>
        <h2 className={styles['settings-title']}>設定</h2>
        <div className={styles['settings-grid']}>
          {error ? <p className={styles['status-error']}>{error}</p> : null}

          <label className={styles['settings-label']} htmlFor="settings-gas-url-prod">
            GAS URL（本番）
          </label>
          <input
            id="settings-gas-url-prod"
            aria-label="settings-gas-url-prod"
            className={styles['settings-input']}
            value={gasUrlProd}
            onChange={(e) => setGasUrlProd(e.target.value)}
          />

          <label className={styles['settings-label']} htmlFor="settings-gas-url-dev">
            GAS URL（開発）
          </label>
          <input
            id="settings-gas-url-dev"
            aria-label="settings-gas-url-dev"
            className={styles['settings-input']}
            value={gasUrlDev}
            onChange={(e) => setGasUrlDev(e.target.value)}
          />

          <label className={styles['settings-label']} htmlFor="settings-doctor-id">
            社員番号（医師ID）
          </label>
          <input
            id="settings-doctor-id"
            aria-label="settings-doctor-id"
            className={styles['settings-input']}
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          />

          <label className={styles['settings-label']} htmlFor="settings-master">
            診断名マスタ（1行1件）
          </label>
          <textarea
            id="settings-master"
            aria-label="settings-master"
            className={styles['settings-textarea']}
            value={diagnosisMasterText}
            onChange={(e) => setDiagnosisMasterText(e.target.value)}
          />

          <label className={styles['settings-label']} htmlFor="settings-secret">
            送信用シークレット（API_SECRET）
          </label>
          <div className={styles['setup-secret-row']}>
            <input
              id="settings-secret"
              aria-label="settings-secret"
              className={`${styles['settings-input']} ${styles['setup-input-secret']}`}
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <button
              className={styles['secondary-btn']}
              type="button"
              onClick={() => setShowSecret((v) => !v)}
            >
              {showSecret ? '非表示' : '表示'}
            </button>
          </div>

          <p className={styles['settings-note']}>
            API_SECRET はブラウザ再起動後に消えます。再入力が必要です。
            EVIDENCE_SECRET は監査同期スクリプト側で管理します。
          </p>
          <div className={styles.panel}>
            <div className={styles.content}>
              <p className={styles['settings-note']}>
                ── 誤送信について ──
                <br />
                送信後に間違いに気づいた場合は、Googleスプレッドシートを直接編集してください。
                集計は翌日14時台に再計算されます。
              </p>
              <p className={styles['settings-note']}>
                ── シークレット変更手順 ──
                <br />
                1. 新しい secret を決める（英数字16文字以上）
                <br />
                2. GAS側の API_SECRET を更新
                <br />
                3. この画面のシークレット欄を更新
                <br />
                4. 監査同期を使う場合は EVIDENCE_SECRET も別途更新
                <br />
                5. 他端末も同様に更新
              </p>
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles['secondary-btn']} type="button" onClick={() => goToScreen('MAIN')}>
              戻る
            </button>
            <button className={styles['primary-btn']} type="button" onClick={() => void handleSave()}>
              保存
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
