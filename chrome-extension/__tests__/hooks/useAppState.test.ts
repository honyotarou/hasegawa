import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import * as appStateModule from '../../src/popup/hooks/useAppState';

describe('useAppState', () => {
  test('session snapshot を復元できる', async () => {
    // Given
    const hook = (appStateModule as any).useAppState;
    expect(hook).toBeTypeOf('function');
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({
      inputSnapshot: {
        batchId: 'b1',
        patients: [{ age: 40, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }],
        selectedDate: '2026-02-28',
        mode: 'dev',
      },
    });
    chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
    chromeAny.storage.session.remove = vi.fn().mockResolvedValue(undefined);

    // When
    const { result } = renderHook(() => hook());

    // Then
    await waitFor(() => {
      expect(result.current.state.currentBatchId).toBe('b1');
      expect(result.current.state.mode).toBe('dev');
      expect(result.current.state.screen).toBe('MAIN');
    });
  });

  test('diagnosis 未入力がある場合 canSubmit=false', async () => {
    // Given
    const hook = (appStateModule as any).useAppState;
    expect(hook).toBeTypeOf('function');
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({});
    chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
    chromeAny.storage.session.remove = vi.fn().mockResolvedValue(undefined);

    // When
    const { result } = renderHook(() => hook());
    act(() => {
      result.current.dispatch({
        type: 'SET_PATIENTS',
        batchId: 'b1',
        patients: [{ age: 40, gender: '男性', diagnoses: [''], rehab: true, remarks: '' }],
      });
    });

    // Then
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.pendingDiag).toBe(1);
  });

  test('SUBMIT_SUCCESSでDONE遷移しsnapshotを削除する', async () => {
    // Given
    const hook = (appStateModule as any).useAppState;
    expect(hook).toBeTypeOf('function');
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.session.get = vi.fn().mockResolvedValue({});
    chromeAny.storage.session.set = vi.fn().mockResolvedValue(undefined);
    chromeAny.storage.session.remove = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => hook());

    // When
    act(() => {
      result.current.dispatch({
        type: 'SUBMIT_SUCCESS',
        result: {
          written: 1,
          skipped: 0,
          submittedAt: '2026/02/28',
          batchId: 'b1',
        },
      });
    });

    // Then
    await waitFor(() => {
      expect(result.current.state.screen).toBe('DONE');
    });
    expect(chromeAny.storage.session.remove).toHaveBeenCalledWith('inputSnapshot');
  });
});
