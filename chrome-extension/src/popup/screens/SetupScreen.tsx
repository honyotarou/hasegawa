import React, { useState } from 'react';
import type { AppSettings, Screen } from '../../types';
<<<<<<< HEAD
import styles from '../app.module.css';
=======
>>>>>>> 78dec51c3837c6746b173220be5829c4cfb9873b

type SetupScreenProps = {
  storage: {
    settings?: AppSettings;
    apiSecret?: string;
    saveSettings: (next: AppSettings, secret: string) => Promise<void>;
  };
  goToScreen: (screen: Screen) => void;
};

export function SetupScreen({ storage, goToScreen }: SetupScreenProps) {
  const [gasUrlProd, setGasUrlProd] = useState(storage.settings?.gasUrlProd || '');
  const [gasUrlDev, setGasUrlDev] = useState(storage.settings?.gasUrlDev || '');
  const [doctorId, setDoctorId] = useState(storage.settings?.doctorId || '');
  const [masterText, setMasterText] = useState((storage.settings?.diagnosisMaster || []).join('\n'));
  const [secret, setSecret] = useState(storage.apiSecret || '');
<<<<<<< HEAD
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

=======
  const [error, setError] = useState('');

>>>>>>> 78dec51c3837c6746b173220be5829c4cfb9873b
  async function handleSave() {
    const diagnosisMaster = masterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

<<<<<<< HEAD
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
      setError('シークレットキーは必須です');
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

    setError('');
    await storage.saveSettings(
      {
        gasUrlProd: prod,
        gasUrlDev: dev,
        doctorId: doc,
        diagnosisMaster,
      },
      sec,
=======
    if (!gasUrlProd.trim() || !doctorId.trim() || !secret.trim() || diagnosisMaster.length === 0) {
      setError('必須項目を入力してください');
      return;
    }

    await storage.saveSettings(
      {
        gasUrlProd: gasUrlProd.trim(),
        gasUrlDev: gasUrlDev.trim(),
        doctorId: doctorId.trim(),
        diagnosisMaster,
      },
      secret.trim(),
>>>>>>> 78dec51c3837c6746b173220be5829c4cfb9873b
    );

    goToScreen('MAIN');
  }

  return (
<<<<<<< HEAD
    <section className={styles['setup-screen']}>
      <h2 className={styles['setup-title']}>初回設定</h2>
      <p className={styles['setup-subtitle']}>診療記録くんを利用するための設定を入力してください。</p>

      {error ? (
        <p role="alert" className={styles['setup-error']}>
          {error}
        </p>
      ) : null}

      <label className={styles['setup-label']} htmlFor="gas-url-prod">
        GAS URL（本番）*
      </label>
      <input
        id="gas-url-prod"
        className={styles['setup-input']}
        aria-label="gasUrlProd"
        placeholder="https://script.google.com/macros/s/.../exec"
        value={gasUrlProd}
        onChange={(e) => setGasUrlProd(e.target.value)}
      />

      <label className={styles['setup-label']} htmlFor="gas-url-dev">
        GAS URL（開発・任意）
      </label>
      <input
        id="gas-url-dev"
        className={styles['setup-input']}
        aria-label="gasUrlDev"
        placeholder="https://script.google.com/macros/s/.../exec"
        value={gasUrlDev}
        onChange={(e) => setGasUrlDev(e.target.value)}
      />

      <label className={styles['setup-label']} htmlFor="api-secret">
        シークレットキー*
      </label>
      <div className={styles['setup-secret-row']}>
        <input
          id="api-secret"
          className={`${styles['setup-input']} ${styles['setup-input-secret']}`}
          aria-label="apiSecret"
          type={showSecret ? 'text' : 'password'}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          type="button"
          className={styles['setup-secondary-btn']}
          onClick={() => setShowSecret((v) => !v)}
        >
          {showSecret ? '非表示' : '表示'}
        </button>
      </div>

      <label className={styles['setup-label']} htmlFor="doctor-id">
        社員番号（医師ID）*
      </label>
      <input
        id="doctor-id"
        className={styles['setup-input']}
        aria-label="doctorId"
        value={doctorId}
        onChange={(e) => setDoctorId(e.target.value)}
      />

      <label className={styles['setup-label']} htmlFor="diagnosis-master">
        診断名マスタ（1行1件）*
      </label>
      <textarea
        id="diagnosis-master"
        className={styles['setup-textarea']}
        aria-label="diagnosisMaster"
        placeholder={'変形性膝関節症\n腰椎椎間板ヘルニア\n肩関節周囲炎'}
        value={masterText}
        onChange={(e) => setMasterText(e.target.value)}
      />

      <p className={styles['setup-note']}>
        セキュリティのため、シークレットキーはブラウザ再起動後に再入力が必要です。
      </p>

      <button className={styles['setup-primary-btn']} type="button" onClick={handleSave}>
=======
    <section>
      <h2>初回設定</h2>
      {error ? <p>{error}</p> : null}
      <input aria-label="gasUrlProd" value={gasUrlProd} onChange={(e) => setGasUrlProd(e.target.value)} />
      <input aria-label="gasUrlDev" value={gasUrlDev} onChange={(e) => setGasUrlDev(e.target.value)} />
      <input aria-label="doctorId" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
      <input aria-label="apiSecret" value={secret} onChange={(e) => setSecret(e.target.value)} />
      <textarea aria-label="diagnosisMaster" value={masterText} onChange={(e) => setMasterText(e.target.value)} />
      <button type="button" onClick={handleSave}>
>>>>>>> 78dec51c3837c6746b173220be5829c4cfb9873b
        設定を保存して始める
      </button>
    </section>
  );
}
