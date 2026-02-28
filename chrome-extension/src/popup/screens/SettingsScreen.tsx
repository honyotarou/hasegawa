import React, { useState } from 'react';
import type { AppSettings, Screen } from '../../types';

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

  async function handleSave() {
    await storage.saveSettings(
      {
        gasUrlProd,
        gasUrlDev,
        doctorId,
        diagnosisMaster: diagnosisMasterText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      },
      secret,
    );
    goToScreen('MAIN');
  }

  return (
    <section>
      <h2>設定</h2>
      <input value={gasUrlProd} onChange={(e) => setGasUrlProd(e.target.value)} />
      <input value={gasUrlDev} onChange={(e) => setGasUrlDev(e.target.value)} />
      <input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
      <textarea value={diagnosisMasterText} onChange={(e) => setDiagnosisMasterText(e.target.value)} />
      <input value={secret} onChange={(e) => setSecret(e.target.value)} />
      <p>apiSecret はブラウザ再起動後に消えます。再入力が必要です。</p>
      <button type="button" onClick={() => void handleSave()}>
        保存
      </button>
    </section>
  );
}
