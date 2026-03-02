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
    expect(chromeAny.storage.session.remove).toHaveBeenCalledWith([
      'inputSnapshot',
      'currentBatchId',
    ]);
  });

  test('連続編集時のsnapshot保存はデバウンスされる', async () => {
    // Given
    vi.useFakeTimers();
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
        type: 'SET_PATIENTS',
        batchId: 'b1',
        patients: [{ age: 40, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }],
      });
      result.current.dispatch({
        type: 'UPDATE_PATIENT',
        index: 0,
        patch: { age: 41 },
      });
      result.current.dispatch({
        type: 'UPDATE_PATIENT',
        index: 0,
        patch: { age: 42 },
      });
    });
    await vi.advanceTimersByTimeAsync(300);

    // Then
    expect(chromeAny.storage.session.set).toHaveBeenCalled();
    const lastCall = chromeAny.storage.session.set.mock.calls.at(-1);
    expect(lastCall[0].inputSnapshot.patients[0].age).toBe(42);
    vi.useRealTimers();
  });

  test('session操作失敗時は例外を握りつぶしてエラーログする', async () => {
    // Given
    const hook = (appStateModule as any).useAppState;
    expect(hook).toBeTypeOf('function');
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.session.get = vi.fn().mockRejectedValue(new Error('restore failed'));
    chromeAny.storage.session.set = vi.fn().mockRejectedValue(new Error('save failed'));
    chromeAny.storage.session.remove = vi.fn().mockRejectedValue(new Error('remove failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    const { result } = renderHook(() => hook());
    act(() => {
      result.current.dispatch({
        type: 'SET_PATIENTS',
        batchId: 'b1',
        patients: [{ age: 40, gender: '男性', diagnoses: ['腰痛'], rehab: true, remarks: '' }],
      });
    });
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
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });
});
