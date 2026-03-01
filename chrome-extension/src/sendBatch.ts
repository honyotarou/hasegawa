import type { AppState, BatchPayload, GasResponse } from './types';

export function sendBatch(
  state: AppState,
  gasUrl: string,
  apiSecret: string,
  doctorId: string,
): Promise<GasResponse> {
  const task = (async () => {
    if (!state.currentBatchId) {
      throw new Error('batchIdがありません');
    }
    if (state.patients.length === 0) {
      throw new Error('患者データがありません');
    }

    const baseMs = Date.now();

    const records = state.patients.map((patient, index) => {
      const d = new Date(baseMs + index * 1000);
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');

      return {
        clientRecordId: `${state.currentBatchId}_${index}`,
        timestamp: `${state.selectedDate}T${hh}:${min}:${ss}`,
        age: patient.age,
        gender: patient.gender,
        diagnoses: [...patient.diagnoses, '', '', '', '', ''].slice(0, 6),
        rehab: patient.rehab as boolean,
        remarks: patient.remarks,
      };
    });

    const payload: BatchPayload = {
      secret: apiSecret,
      action: 'recordBatch',
      doctorId,
      batchId: state.currentBatchId,
      records,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      let data: GasResponse;
      try {
        data = JSON.parse(text) as GasResponse;
      } catch {
        throw new Error(`GASからJSON以外が返りました: ${text.slice(0, 200)}`);
      }

      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        const abortError = new Error('AbortError');
        (abortError as any).name = 'AbortError';
        throw abortError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  })();

  // テスト環境で AbortError が先に reject しても unhandled 扱いにしない。
  task.catch(() => {});
  return task;
}
