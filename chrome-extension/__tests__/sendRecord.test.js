import { describe, expect, test, vi } from "vitest";
import { buildRecordBatchPayload, sendRecordBatch } from "../sendRecord.js";

describe("sendRecord.js", () => {
  test("payload整形で clientRecordId を保持して action=recordBatch を付与する", () => {
    // Given
    const records = [
      {
        clientRecordId: "batch_0",
        timestamp: "2026-02-27T09:00:00",
        age: 75,
        gender: "男性",
        diagnoses: ["腰痛", "", "", "", "", ""],
        rehab: true,
        remarks: "",
      },
    ];

    // When
    const payload = buildRecordBatchPayload({
      secret: "secret",
      doctorId: "12345",
      batchId: "batch",
      records,
    });

    // Then
    expect(payload.action).toBe("recordBatch");
    expect(payload.records[0].clientRecordId).toBe("batch_0");
  });

  test("正常POST時は success:true を返す", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, written: 2, skipped: 0 }),
    });

    // When
    const result = await sendRecordBatch({
      url: "https://example.com",
      payload: { hello: "world" },
      fetchImpl,
      timeoutMs: 30000,
    });

    // Then
    expect(result.success).toBe(true);
    expect(result.data.written).toBe(2);
  });

  test("HTTP失敗時はエラーを返す", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Error",
    });

    // When
    const result = await sendRecordBatch({
      url: "https://example.com",
      payload: { hello: "world" },
      fetchImpl,
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP 500");
  });

  test("GAS success:false 応答時はエラーを返す", async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: "認証失敗" }),
    });

    // When
    const result = await sendRecordBatch({
      url: "https://example.com",
      payload: { hello: "world" },
      fetchImpl,
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("認証失敗");
  });

  test("network error 時はエラーを返す", async () => {
    // Given
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    // When
    const result = await sendRecordBatch({
      url: "https://example.com",
      payload: { hello: "world" },
      fetchImpl,
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("network down");
  });

  test("timeout 時は abort してタイムアウトエラーを返す", async () => {
    // Given
    const fetchImpl = vi.fn(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("should abort first"));
          }, 1000);
        }),
    );

    // When
    const result = await sendRecordBatch({
      url: "https://example.com",
      payload: { hello: "world" },
      fetchImpl,
      timeoutMs: 1,
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("タイムアウト");
  });
});
