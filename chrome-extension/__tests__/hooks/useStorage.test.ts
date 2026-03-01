import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useStorage } from '../../src/popup/hooks/useStorage';

describe('useStorage', () => {
  test('初期ロードで設定とsecretを復元する', async () => {
    // Given
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.local.get = vi.fn().mockResolvedValue({
      gasUrlProd: 'https://prod',
      gasUrlDev: 'https://dev',
      doctorId: '12345',
      diagnosisMaster: ['腰痛'],
    });
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({ apiSecret: 'secret' });

    // When
    const { result } = renderHook(() => useStorage());

    // Then
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
    expect(result.current.settings.gasUrlProd).toBe('https://prod');
    expect(result.current.apiSecret).toBe('secret');
    expect(result.current.isConfigured).toBe(true);
  });

  test('saveSettingsでlocal/sessionへ保存する', async () => {
    // Given
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.local.get = vi.fn().mockResolvedValue({});
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({});
    chromeAny.storage.local.set = vi.fn().mockResolvedValue(undefined);
    chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useStorage());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // When
    await act(async () => {
      await result.current.saveSettings(
        {
          gasUrlProd: 'https://prod',
          gasUrlDev: '',
          doctorId: '99999',
          diagnosisMaster: ['腰痛', '肩痛'],
        },
        'secret2',
      );
    });

    // Then
    expect(chromeAny.storage.local.set).toHaveBeenCalledWith({
      gasUrlProd: 'https://prod',
      gasUrlDev: '',
      doctorId: '99999',
      diagnosisMaster: ['腰痛', '肩痛'],
    });
    expect(chromeAny.storage.session.set).toHaveBeenCalledWith({ apiSecret: 'secret2' });
  });

  test('初期ロード失敗時もisLoaded=trueでフォールバックする', async () => {
    // Given
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.local.get = vi.fn().mockRejectedValue(new Error('load failed'));
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    const { result } = renderHook(() => useStorage());

    // Then
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
    expect(result.current.isConfigured).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
