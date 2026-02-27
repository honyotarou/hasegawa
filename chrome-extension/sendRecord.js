export function buildRecordBatchPayload({ secret, doctorId, batchId, records }) {
  return {
    secret,
    action: "recordBatch",
    doctorId,
    batchId,
    records,
  };
}

export async function sendRecordBatch({
  url,
  payload,
  fetchImpl = fetch,
  timeoutMs = 30000,
}) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const bodyText = typeof response.text === "function" ? await response.text() : "";
      return {
        success: false,
        error: `HTTP ${response.status || "error"}: ${bodyText}`,
      };
    }

    const data = await response.json();
    if (!data.success) {
      return {
        success: false,
        error: data.error || "送信に失敗しました",
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (abortController.signal.aborted) {
      return {
        success: false,
        error: "リクエストがタイムアウトしました",
      };
    }
    return {
      success: false,
      error: error?.message || String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
