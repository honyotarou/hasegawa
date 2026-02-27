import { describe, expect, test, vi } from "vitest";
import { SCREENS, createPopupController, parseDiagnosisMasterText } from "../popup.js";

function createMemoryStorage(initial = {}) {
  const store = { ...initial };
  return {
    _store: store,
    async get(keys) {
      if (!keys) return { ...store };
      if (typeof keys === "string") return { [keys]: store[keys] };
      if (Array.isArray(keys)) {
        const out = {};
        keys.forEach((k) => {
          out[k] = store[k];
        });
        return out;
      }
      if (typeof keys === "object") {
        const out = {};
        Object.keys(keys).forEach((k) => {
          out[k] = store[k] ?? keys[k];
        });
        return out;
      }
      return {};
    },
    async set(obj) {
      Object.assign(store, obj);
    },
    async remove(keys) {
      const arr = Array.isArray(keys) ? keys : [keys];
      arr.forEach((k) => {
        delete store[k];
      });
    },
  };
}

function createDeps({
  local = {},
  session = {},
  executeExtract = vi.fn(),
  sendRecordBatch = vi.fn(),
} = {}) {
  return {
    storageLocal: createMemoryStorage(local),
    storageSession: createMemoryStorage(session),
    executeExtract,
    sendRecordBatch,
    uuid: vi.fn(() => "batch-fixed-uuid"),
    now: vi.fn(() => new Date("2026-02-27T09:00:00Z")),
  };
}

function seedPatients(count = 3) {
  return Array.from({ length: count }).map((_, i) => ({
    age: 40 + i,
    gender: "男性",
    diagnoses: [""],
    rehab: null,
    remarks: "",
  }));
}

describe("popup.js controller", () => {
  test("初回起動（未設定）では SCREEN_SETUP を表示する", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);

    // When
    await controller.init();

    // Then
    expect(controller.state.currentScreen).toBe(SCREENS.SETUP);
  });

  test("初回起動（設定済み）では SCREEN_MAIN を表示する", async () => {
    // Given
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret" },
    });
    const controller = createPopupController(deps);

    // When
    await controller.init();

    // Then
    expect(controller.state.currentScreen).toBe(SCREENS.MAIN);
  });

  test("セットアップ保存成功で storage 保存後に SCREEN_MAIN へ遷移する", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    await controller.init();

    // When
    const result = await controller.saveSetup({
      gasUrlProd: "https://example.com/prod",
      gasUrlDev: "https://example.com/dev",
      apiSecret: "secret",
      doctorId: "12345",
      diagnosisMasterText: "変形性膝関節症\n腰椎椎間板ヘルニア",
    });

    // Then
    expect(result.success).toBe(true);
    expect(controller.state.currentScreen).toBe(SCREENS.MAIN);
    expect((await deps.storageLocal.get("gasUrlProd")).gasUrlProd).toBe("https://example.com/prod");
    expect((await deps.storageSession.get("apiSecret")).apiSecret).toBe("secret");
  });

  test("セットアップ保存失敗（gasUrlProd 空）ではエラーで遷移しない", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    await controller.init();

    // When
    const result = await controller.saveSetup({
      gasUrlProd: "",
      gasUrlDev: "",
      apiSecret: "secret",
      doctorId: "12345",
      diagnosisMasterText: "腰痛",
    });

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain("GAS URL");
    expect(controller.state.currentScreen).toBe(SCREENS.SETUP);
  });

  test("JSON取得成功で患者を取り込み batchId を生成する", async () => {
    // Given
    const executeExtract = vi.fn().mockResolvedValue({
      success: true,
      patients: seedPatients(10).map((p, i) => ({ age: 20 + i, gender: "男性" })),
    });
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret" },
      executeExtract,
    });
    const controller = createPopupController(deps);
    await controller.init();

    // When
    const result = await controller.fetchFromChatGPT();

    // Then
    expect(result.success).toBe(true);
    expect(controller.state.patients).toHaveLength(10);
    expect(controller.state.currentBatchId).toBe("batch-fixed-uuid");
  });

  test("JSON取得失敗ではエラーを表示する", async () => {
    // Given
    const executeExtract = vi.fn().mockResolvedValue({ success: false, error: "JSONが見つかりません" });
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret" },
      executeExtract,
    });
    const controller = createPopupController(deps);
    await controller.init();

    // When
    const result = await controller.fetchFromChatGPT();

    // Then
    expect(result.success).toBe(false);
    expect(controller.state.statusMessage).toContain("JSON");
  });

  test("全件リハ選択済みなら送信ボタン有効", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    controller.state.patients = seedPatients(2).map((p, i) => ({ ...p, rehab: i % 2 === 0 }));

    // When
    const enabled = controller.isSendEnabled();

    // Then
    expect(enabled).toBe(true);
  });

  test("リハ未選択が含まれる場合は送信ボタン無効", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    controller.state.patients = seedPatients(2);
    controller.state.patients[0].rehab = true;
    controller.state.patients[1].rehab = null;

    // When
    const enabled = controller.isSendEnabled();

    // Then
    expect(enabled).toBe(false);
  });

  test("次の未選択へで最初の null 行を返す", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    controller.state.patients = seedPatients(4);
    controller.state.patients[0].rehab = true;
    controller.state.patients[1].rehab = false;

    // When
    const idx = controller.getNextUnselectedIndex();

    // Then
    expect(idx).toBe(2);
  });

  test("全件送信押下で SCREEN_CONFIRM に遷移する", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    controller.state.currentScreen = SCREENS.MAIN;
    controller.state.patients = seedPatients(2).map((p) => ({ ...p, rehab: true }));

    // When
    const ok = controller.goToConfirm();

    // Then
    expect(ok).toBe(true);
    expect(controller.state.currentScreen).toBe(SCREENS.CONFIRM);
  });

  test("確認画面で戻ると SCREEN_MAIN に戻り状態保持する", async () => {
    // Given
    const deps = createDeps();
    const controller = createPopupController(deps);
    controller.state.currentScreen = SCREENS.CONFIRM;
    controller.state.patients = seedPatients(2);

    // When
    controller.backToMain();

    // Then
    expect(controller.state.currentScreen).toBe(SCREENS.MAIN);
    expect(controller.state.patients).toHaveLength(2);
  });

  test("確認画面で送信成功すると SCREEN_DONE に遷移する", async () => {
    // Given
    const sendRecordBatch = vi.fn().mockResolvedValue({ success: true, written: 2, skipped: 0 });
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.state.inputDate = "2026-02-27";
    controller.state.patients = seedPatients(2).map((p, i) => ({ ...p, diagnoses: [`D${i}`], rehab: i % 2 === 0 }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    const result = await controller.sendFromConfirm();

    // Then
    expect(result.success).toBe(true);
    expect(controller.state.currentScreen).toBe(SCREENS.DONE);
  });

  test("送信失敗時はエラー表示し batchId を保持する", async () => {
    // Given
    const sendRecordBatch = vi.fn().mockRejectedValue(new Error("network error"));
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.state.inputDate = "2026-02-27";
    controller.state.patients = seedPatients(2).map((p) => ({ ...p, rehab: true, diagnoses: ["腰痛"] }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    const result = await controller.sendFromConfirm();

    // Then
    expect(result.success).toBe(false);
    expect(controller.state.currentBatchId).toBe("batch-fixed-uuid");
    expect(controller.state.currentScreen).toBe(SCREENS.CONFIRM);
  });

  test("再送時の batchId は同一値を使う", async () => {
    // Given
    const sendRecordBatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ success: true, written: 2, skipped: 0 });
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.state.inputDate = "2026-02-27";
    controller.state.patients = seedPatients(2).map((p) => ({ ...p, rehab: true, diagnoses: ["腰痛"] }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    await controller.sendFromConfirm();
    await controller.sendFromConfirm();

    // Then
    const firstPayload = sendRecordBatch.mock.calls[0][0];
    const secondPayload = sendRecordBatch.mock.calls[1][0];
    expect(firstPayload.batchId).toBe("batch-fixed-uuid");
    expect(secondPayload.batchId).toBe("batch-fixed-uuid");
  });

  test("30秒タイムアウトエラー時は disabled解除して再送可能", async () => {
    // Given
    const sendRecordBatch = vi.fn().mockRejectedValue(new Error("timeout"));
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.state.inputDate = "2026-02-27";
    controller.state.patients = seedPatients(1).map((p) => ({ ...p, rehab: true, diagnoses: ["腰痛"] }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    const result = await controller.sendFromConfirm();

    // Then
    expect(result.success).toBe(false);
    expect(controller.state.isSending).toBe(false);
    expect(controller.state.currentBatchId).toBe("batch-fixed-uuid");
  });

  test("開発/本番トグルをdevにすると gasUrlDev で送信する", async () => {
    // Given
    const sendRecordBatch = vi.fn().mockResolvedValue({ success: true, written: 1, skipped: 0 });
    const deps = createDeps({
      local: {
        gasUrlProd: "https://example.com/prod",
        gasUrlDev: "https://example.com/dev",
        doctorId: "12345",
        diagnosisMaster: ["腰痛"],
      },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.setMode("dev");
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.state.inputDate = "2026-02-27";
    controller.state.patients = seedPatients(1).map((p) => ({ ...p, rehab: true, diagnoses: ["腰痛"] }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    await controller.sendFromConfirm();

    // Then
    expect(sendRecordBatch).toHaveBeenCalledTimes(1);
    expect(sendRecordBatch.mock.calls[0][0].url).toBe("https://example.com/dev");
  });

  test("日付変更で timestamp の日付部分が変わる", async () => {
    // Given
    const sendRecordBatch = vi.fn().mockResolvedValue({ success: true, written: 1, skipped: 0 });
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
      sendRecordBatch,
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.currentBatchId = "batch-fixed-uuid";
    controller.setInputDate("2026-02-26");
    controller.state.patients = seedPatients(1).map((p) => ({ ...p, rehab: true, diagnoses: ["腰痛"] }));
    controller.state.currentScreen = SCREENS.CONFIRM;

    // When
    await controller.sendFromConfirm();

    // Then
    const payload = sendRecordBatch.mock.calls[0][0];
    expect(payload.records[0].timestamp.startsWith("2026-02-26")).toBe(true);
  });

  test("診断名選択で diagnosisCount をインクリメントする", async () => {
    // Given
    const deps = createDeps({
      local: { diagnosisCount: { 腰痛: 2 } },
    });
    const controller = createPopupController(deps);

    // When
    await controller.incrementDiagnosisUsage("腰痛");

    // Then
    const stored = await deps.storageLocal.get("diagnosisCount");
    expect(stored.diagnosisCount.腰痛).toBe(3);
  });

  test("上位5件は使用回数順で返す", async () => {
    // Given
    const deps = createDeps({
      local: {
        diagnosisMaster: ["A", "B", "C", "D", "E", "F"],
        diagnosisCount: { A: 1, B: 10, C: 4, D: 9, E: 2, F: 3 },
      },
    });
    const controller = createPopupController(deps);

    // When
    const top = await controller.getTopDiagnoses();

    // Then
    expect(top).toEqual(["B", "D", "C", "F", "E"]);
  });

  test("SW再起動後に currentBatchId を session から復元する", async () => {
    // Given
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
    });
    const controller = createPopupController(deps);

    // When
    await controller.init();

    // Then
    expect(controller.state.currentBatchId).toBe("batch-fixed-uuid");
  });

  test("診断名マスタ一括貼り付けテキストを配列化する", () => {
    // Given
    const text = "変形性膝関節症\n腰椎椎間板ヘルニア\n\n肩関節周囲炎";

    // When
    const arr = parseDiagnosisMasterText(text);

    // Then
    expect(arr).toEqual(["変形性膝関節症", "腰椎椎間板ヘルニア", "肩関節周囲炎"]);
  });

  test("患者0件で送信しようとするとエラー", async () => {
    // Given
    const deps = createDeps({
      local: { gasUrlProd: "https://example.com/prod", doctorId: "12345", diagnosisMaster: ["腰痛"] },
      session: { apiSecret: "secret", currentBatchId: "batch-fixed-uuid" },
    });
    const controller = createPopupController(deps);
    await controller.init();
    controller.state.patients = [];

    // When
    const ok = controller.goToConfirm();

    // Then
    expect(ok).toBe(false);
    expect(controller.state.statusMessage).toContain("患者");
  });
});
