import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import * as appModule from '../src/popup/App';

function setupChromeStorage(localValue: any, sessionValue: any) {
  const chromeAny = (globalThis as any).chrome;
  chromeAny.storage.local.get = vi.fn().mockResolvedValue(localValue);
  chromeAny.storage.session.get = vi.fn().mockResolvedValue(sessionValue);
  chromeAny.storage.local.set = vi.fn().mockResolvedValue(undefined);
  chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
  chromeAny.storage.session.remove = vi.fn().mockResolvedValue(undefined);
}

describe('App', () => {
  test('未設定時は SETUP 画面を表示する', async () => {
    // Given
    setupChromeStorage({}, {});
    const App = (appModule as any).App;
    expect(App).toBeTypeOf('function');

    // When
    render(React.createElement(App));

    // Then
    await waitFor(() => {
      expect(screen.getByText(/セットアップ|初回設定/)).toBeInTheDocument();
    });
  });

  test('設定済み時は MAIN 画面を表示する', async () => {
    // Given
    setupChromeStorage(
      { gasUrlProd: 'https://prod', doctorId: '123', diagnosisMaster: ['腰痛'] },
      { apiSecret: 'secret' },
    );
    const App = (appModule as any).App;
    expect(App).toBeTypeOf('function');

    // When
    render(React.createElement(App));

    // Then
    await waitFor(() => {
      expect(screen.getByText(/ChatGPTから取得|メイン/)).toBeInTheDocument();
    });
  });
});
