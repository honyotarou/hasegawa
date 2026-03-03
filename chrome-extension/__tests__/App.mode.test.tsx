import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

async function renderAppWithMode(mode: 'prod' | 'dev', gasUrlDev: string) {
  vi.resetModules();
  const dispatch = vi.fn();

  vi.doMock('../src/popup/hooks/useAppState', () => ({
    useAppState: () => ({
      state: {
        screen: 'MAIN',
        patients: [],
        currentBatchId: 'b1',
        mode,
        selectedDate: '2026-03-02',
        submitError: null,
        isSubmitting: false,
        lastSubmitResult: null,
      },
      dispatch,
      goToScreen: vi.fn(),
      pendingCount: 0,
      pendingRehab: 0,
      pendingDiag: 0,
      canSubmit: false,
    }),
  }));

  vi.doMock('../src/popup/hooks/useStorage', () => ({
    useStorage: () => ({
      settings: {
        gasUrlProd: 'https://script.google.com/macros/s/prod/exec',
        gasUrlDev,
        doctorId: '12345',
        diagnosisMaster: ['腰痛'],
      },
      apiSecret: 'secret',
      isLoaded: true,
      isConfigured: true,
      saveSettings: vi.fn(),
    }),
  }));

  vi.doMock('../src/popup/hooks/useDiagnosis', () => ({
    useDiagnosis: () => ({
      top5: [],
      rest: [],
      counts: {},
      incrementCounts: vi.fn(),
    }),
  }));

  const mod = await import('../src/popup/App');
  render(React.createElement(mod.App));
  return { dispatch };
}

describe('App mode fallback', () => {
  test('gasUrlDev未設定でmode=devならprodに戻す', async () => {
    // Given
    const { dispatch } = await renderAppWithMode('dev', '');

    // When
    await waitFor(() => {
      // Then
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'prod' });
    });
  });

  test('gasUrlDev設定済みならmode=devを維持する', async () => {
    // Given
    const { dispatch } = await renderAppWithMode('dev', 'https://script.google.com/macros/s/dev/exec');

    // When
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Then
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'SET_MODE', mode: 'prod' });
  });
});
