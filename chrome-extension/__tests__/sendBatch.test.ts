import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AppState } from '../src/types';
import * as sendBatchModule from '../src/sendBatch';

function createState(overrides: Partial<AppState> = {}): AppState {
  return {
    screen: 'CONFIRM',
    patients: [
      {
        age: 75,
        gender: '男性',
        diagnoses: ['腰痛'],
        rehab: true,
        remarks: '',
      },
    ],
    currentBatchId: 'batch-123',
    mode: 'prod',
    selectedDate: '2026-02-28',
    submitError: null,
    isSubmitting: false,
    lastSubmitResult: null,
    ...overrides,
  };
}

describe('sendBatch', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('正常送信で success:true を返す', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 1, skipped: 0 }) }));

    // When
    const result = await fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    expect(result.success).toBe(true);
  });

  test('batchId なしでエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState({ currentBatchId: null });

    // When
    const action = fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('batchId');
  });

  test('patients 空配列でエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState({ patients: [] });

    // When
    const action = fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('患者データ');
  });

  test('GAS URLが空ならエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');

    // When
    const action = fn(createState(), '', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('GAS URLが未設定');
  });

  test('GAS URLが許可ドメイン外ならエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');

    // When
    const action = fn(createState(), 'https://example.com/exec', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('許可ドメイン外');
  });

  test('apiSecretが空ならエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', '', '12345');

    // Then
    await expect(action).rejects.toThrow('API_SECRET');
  });

  test('doctorIdが空ならエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '');

    // Then
    await expect(action).rejects.toThrow('医師ID');
  });

  test('diagnoses は6要素に補完される', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState();
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 1, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.records[0].diagnoses).toHaveLength(6);
  });

  test('clientRecordId は batchId_index で生成される', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState({
      patients: [
        { age: 10, gender: '男性', diagnoses: ['A'], rehab: true, remarks: '' },
        { age: 20, gender: '女性', diagnoses: ['B'], rehab: false, remarks: '' },
        { age: 30, gender: '男性', diagnoses: ['C'], rehab: true, remarks: '' },
        { age: 40, gender: '女性', diagnoses: ['D'], rehab: false, remarks: '' },
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 4, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.records[3].clientRecordId).toBe('batch-123_3');
  });

  test('timestamp は1秒ずつオフセットされる', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-02-28T09:00:00').getTime());
    const state = createState({
      patients: [
        { age: 10, gender: '男性', diagnoses: ['A'], rehab: true, remarks: '' },
        { age: 20, gender: '女性', diagnoses: ['B'], rehab: false, remarks: '' },
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 2, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.records[0].timestamp.endsWith(':00')).toBe(true);
    expect(payload.records[1].timestamp.endsWith(':01')).toBe(true);
  });

  test('selectedDate を使ってローカル日付で送信する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const state = createState({ selectedDate: '2026-03-01' });
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 1, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(state, 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.records[0].timestamp.startsWith('2026-03-01')).toBe(true);
  });

  test('apiSecret/doctorIdはtrimして送信する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 1, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(createState(), 'https://script.google.com/macros/s/xxx', '  secret  ', '  12345  ');

    // Then
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload.secret).toBe('secret');
    expect(payload.doctorId).toBe('12345');
  });

  test('30秒タイムアウトで AbortError を throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        (init.signal as AbortSignal).addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }));

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');
    await vi.advanceTimersByTimeAsync(30000);

    // Then
    await expect(action).rejects.toThrow('AbortError');
  });

  test('GASがHTMLを返した場合は意味のあるエラーを throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: async () => '<html>error</html>' }));

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('JSON以外');
  });

  test('GAS success:false はそのまま返す', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: false, error: 'NG' }) }));

    // When
    const result = await fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('NG');
  });

  test('fetchオプションに redirect:follow を設定する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => JSON.stringify({ success: true, written: 1, skipped: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    // When
    await fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    expect(fetchMock.mock.calls[0][1].redirect).toBe('follow');
  });

  test('res.ok=false のHTTPエラーは throw する', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502, text: async () => 'bad gateway' }),
    );

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('HTTP 502');
  });

  test('ok未定義でもstatus>=400ならHTTPエラーをthrowする', async () => {
    // Given
    const fn = (sendBatchModule as any).sendBatch;
    expect(fn).toBeTypeOf('function');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 500, text: async () => 'server error' }),
    );

    // When
    const action = fn(createState(), 'https://script.google.com/macros/s/xxx', 'secret', '12345');

    // Then
    await expect(action).rejects.toThrow('HTTP 500');
  });
});
