import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

async function renderWithScreen(screenName: 'CONFIRM' | 'DONE' | 'SETTINGS') {
  vi.resetModules();

  vi.doMock('../src/popup/hooks/useAppState', () => ({
    useAppState: () => ({
      state: {
        screen: screenName,
        patients: [],
        currentBatchId: null,
        mode: 'prod',
        selectedDate: '2026-02-28',
        submitError: null,
        isSubmitting: false,
        lastSubmitResult: { written: 1, skipped: 0, submittedAt: '2026/02/28', batchId: 'b1' },
      },
      dispatch: vi.fn(),
      goToScreen: vi.fn(),
      pendingCount: 0,
      pendingRehab: 0,
      pendingDiag: 0,
      canSubmit: true,
    }),
  }));

  vi.doMock('../src/popup/hooks/useStorage', () => ({
    useStorage: () => ({
      settings: { gasUrlProd: 'https://prod', gasUrlDev: '', doctorId: '1', diagnosisMaster: ['腰痛'] },
      apiSecret: 'secret',
      isLoaded: true,
      isConfigured: true,
      saveSettings: vi.fn(),
    }),
  }));

  vi.doMock('../src/popup/hooks/useDiagnosis', () => ({
    useDiagnosis: () => ({ top5: [], rest: [], counts: {}, incrementCounts: vi.fn() }),
  }));

  vi.doMock('../src/popup/screens/ConfirmScreen', () => ({
    ConfirmScreen: () => <div>CONFIRM-SCREEN</div>,
  }));
  vi.doMock('../src/popup/screens/DoneScreen', () => ({
    DoneScreen: () => <div>DONE-SCREEN</div>,
  }));
  vi.doMock('../src/popup/screens/SettingsScreen', () => ({
    SettingsScreen: () => <div>SETTINGS-SCREEN</div>,
  }));

  const mod = await import('../src/popup/App');
  render(React.createElement(mod.App));
}

describe('App routing branches', () => {
  test('screen=CONFIRMでConfirmScreenを表示する', async () => {
    // Given

    // When
    await renderWithScreen('CONFIRM');

    // Then
    expect(screen.getByText('CONFIRM-SCREEN')).toBeInTheDocument();
  });

  test('screen=DONEでDoneScreenを表示する', async () => {
    // Given

    // When
    await renderWithScreen('DONE');

    // Then
    expect(screen.getByText('DONE-SCREEN')).toBeInTheDocument();
  });

  test('screen=SETTINGSでSettingsScreenを表示する', async () => {
    // Given

    // When
    await renderWithScreen('SETTINGS');

    // Then
    expect(screen.getByText('SETTINGS-SCREEN')).toBeInTheDocument();
  });
});
