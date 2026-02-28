import { useEffect, useState } from 'react';
import type { AppSettings } from '../../types';

const DEFAULTS: AppSettings = {
  gasUrlProd: '',
  gasUrlDev: '',
  doctorId: '',
  diagnosisMaster: [],
};

export function useStorage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiSecret, setApiSecret] = useState('');

  useEffect(() => {
    Promise.all([
      chrome.storage.local.get(['gasUrlProd', 'gasUrlDev', 'doctorId', 'diagnosisMaster']),
      chrome.storage.session.get('apiSecret'),
    ]).then(([local, session]: [any, any]) => {
      setSettings({
        gasUrlProd: local.gasUrlProd || '',
        gasUrlDev: local.gasUrlDev || '',
        doctorId: local.doctorId || '',
        diagnosisMaster: local.diagnosisMaster || [],
      });
      setApiSecret(session.apiSecret || '');
      setIsLoaded(true);
    });
  }, []);

  const isConfigured = Boolean(settings.gasUrlProd && apiSecret && settings.doctorId);

  async function saveSettings(next: AppSettings, secret: string): Promise<void> {
    await Promise.all([
      chrome.storage.local.set({
        gasUrlProd: next.gasUrlProd,
        gasUrlDev: next.gasUrlDev,
        doctorId: next.doctorId,
        diagnosisMaster: next.diagnosisMaster,
      }),
      chrome.storage.session.set({ apiSecret: secret }),
    ]);

    setSettings(next);
    setApiSecret(secret);
  }

  return { settings, apiSecret, isLoaded, isConfigured, saveSettings };
}
