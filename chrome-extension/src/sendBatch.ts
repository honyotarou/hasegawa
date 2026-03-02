import type { AppState, BatchPayload, GasResponse } from './types';

export function sendBatch(
  state: AppState,
  gasUrl: string,
  apiSecret: string,
  doctorId: string,
): Promise<GasResponse> {
  function isAllowedGasUrl(urlStr: string): boolean {
    if (!urlStr) return false;
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:') return false;
      return url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com';
    } catch {
      return false;
    }
  }

  const task = (async () => {
    if (!state.currentBatchId) {
      throw new Error('batchIdがありません');
    }
    if (state.patients.length === 0) {
      throw new Error('患者データがありません');
    }
    if (!gasUrl) {
      throw new Error('GAS URLが未設定です');
    }
    if (!isAllowedGasUrl(gasUrl)) {
      throw new Error('GAS URLが許可ドメイン外です');
    }
    const trimmedApiSecret = apiSecret?.trim();
    if (!trimmedApiSecret) {
      throw new Error('送信用シークレット(API_SECRET)が未設定です');
    }
    const trimmedDoctorId = doctorId?.trim();
    if (!trimmedDoctorId) {
      throw new Error('医師IDが未設定です');
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
      secret: trimmedApiSecret,
      action: 'recordBatch',
      doctorId: trimmedDoctorId,
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
      const hasOkFlag = typeof (res as any).ok === 'boolean';
      const hasStatusCode = typeof (res as any).status === 'number';
      const isHttpError = hasOkFlag
        ? !(res as any).ok
        : hasStatusCode
          ? (res as any).status >= 400
          : false;
      if (isHttpError) {
        throw new Error(`HTTP ${(res as any).status}: ${text.slice(0, 200)}`);
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
