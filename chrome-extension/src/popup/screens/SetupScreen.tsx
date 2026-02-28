import React, { useState } from 'react';
import type { AppSettings, Screen } from '../../types';

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
  const [error, setError] = useState('');

  async function handleSave() {
    const diagnosisMaster = masterText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

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
    );

    goToScreen('MAIN');
  }

  return (
    <section>
      <h2>初回設定</h2>
      {error ? <p>{error}</p> : null}
      <input aria-label="gasUrlProd" value={gasUrlProd} onChange={(e) => setGasUrlProd(e.target.value)} />
      <input aria-label="gasUrlDev" value={gasUrlDev} onChange={(e) => setGasUrlDev(e.target.value)} />
      <input aria-label="doctorId" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
      <input aria-label="apiSecret" value={secret} onChange={(e) => setSecret(e.target.value)} />
      <textarea aria-label="diagnosisMaster" value={masterText} onChange={(e) => setMasterText(e.target.value)} />
      <button type="button" onClick={handleSave}>
        設定を保存して始める
      </button>
    </section>
  );
}
