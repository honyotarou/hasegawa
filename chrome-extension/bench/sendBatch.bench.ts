import { bench, describe } from 'vitest';
import { sendBatch } from '../src/sendBatch';
import type { AppState } from '../src/types';

const state40: AppState = {
  screen: 'CONFIRM',
  patients: Array.from({ length: 40 }, (_, i) => ({
    age: 20 + (i % 70),
    gender: i % 2 === 0 ? '男性' : '女性',
    diagnoses: ['腰痛'],
    rehab: i % 2 === 0,
    remarks: '',
  })),
  currentBatchId: 'bench-batch',
  mode: 'prod',
  selectedDate: '2026-02-28',
  submitError: null,
  isSubmitting: false,
  lastSubmitResult: null,
};

describe('sendBatch benchmarks', () => {
  bench('build payload and parse gas response (40 records)', async () => {
    const fetchMock = async () =>
      new Response(JSON.stringify({ success: true, written: 40, skipped: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    Object.defineProperty(globalThis, 'fetch', {
      value: fetchMock,
      configurable: true,
      writable: true,
    });

    await sendBatch(state40, 'https://example.com', 'secret', 'doctor');
  });
});
