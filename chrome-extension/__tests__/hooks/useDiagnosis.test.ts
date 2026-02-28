import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useDiagnosis } from '../../src/popup/hooks/useDiagnosis';

describe('useDiagnosis', () => {
  test('diagnosisCountからtop5を使用回数順で計算する', async () => {
    // Given
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.local.get = vi.fn().mockResolvedValue({
      diagnosisCount: { 腰痛: 20, 肩痛: 10, 捻挫: 3 },
    });

    // When
    const { result } = renderHook(() => useDiagnosis(['肩痛', '腰痛', '捻挫', '骨折']));

    // Then
    await waitFor(() => {
      expect(result.current.counts.腰痛).toBe(20);
    });
    expect(result.current.top5[0]).toBe('腰痛');
    expect(result.current.rest).toEqual([]);
  });

  test('incrementCountsで空白を除外してカウントを保存する', async () => {
    // Given
    const chromeAny = (globalThis as any).chrome;
    chromeAny.storage.local.get = vi.fn().mockResolvedValue({ diagnosisCount: { 腰痛: 1 } });
    chromeAny.storage.local.set = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useDiagnosis(['腰痛', '肩痛']));
    await waitFor(() => {
      expect(result.current.counts.腰痛).toBe(1);
    });

    // When
    await act(async () => {
      await result.current.incrementCounts(['腰痛', '  ', '肩痛']);
    });

    // Then
    expect(chromeAny.storage.local.set).toHaveBeenCalledWith({
      diagnosisCount: { 腰痛: 2, 肩痛: 1 },
    });
  });
});
