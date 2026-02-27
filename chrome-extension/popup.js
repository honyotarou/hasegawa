import { buildRecordBatchPayload, sendRecordBatch as defaultSendRecordBatch } from "./sendRecord.js";

export const SCREENS = Object.freeze({
  SETUP: "SETUP",
  MAIN: "MAIN",
  CONFIRM: "CONFIRM",
  DONE: "DONE",
  SETTINGS: "SETTINGS",
});

export function parseDiagnosisMasterText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ensureDiagnosisArray(input) {
  const arr = Array.isArray(input) ? input : [String(input || "")];
  const normalized = arr.map((d) => String(d || "").slice(0, 100));
  while (normalized.length < 6) {
    normalized.push("");
  }
  return normalized.slice(0, 6);
}

function getTodayString(nowFn) {
  const now = nowFn();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeTimestamp(dateStr, index) {
  const totalSeconds = index;
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${dateStr}T${hh}:${mm}:${ss}`;
}

async function defaultExecuteExtract() {
  if (
    typeof chrome === "undefined" ||
    !chrome.tabs?.query ||
    !chrome.scripting?.executeScript
  ) {
    return { success: false, error: "Chrome APIが利用できません" };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { success: false, error: "アクティブタブを取得できません" };
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    func: () => {
      const normalizeGender = (value) => {
        const v = String(value || "").trim();
        if (/^(男|男性)$/.test(v)) return "男性";
        if (/^(女|女性)$/.test(v)) return "女性";
        return "その他";
      };

      const validatePatient = (patient, index) => {
        if (
          typeof patient?.age !== "number" ||
          !Number.isInteger(patient.age) ||
          patient.age < 1 ||
          patient.age > 150
        ) {
          return { valid: false, error: `patients[${index}]: age は1〜150の整数である必要があります` };
        }
        return { valid: true, normalized: { age: patient.age, gender: normalizeGender(patient.gender) } };
      };

      const preCodeTexts = Array.from(document.querySelectorAll("pre > code"))
        .map((n) => n.textContent || "")
        .reverse();
      const codeTexts = Array.from(document.querySelectorAll("code"))
        .filter((n) => n.parentElement?.tagName !== "PRE")
        .map((n) => n.textContent || "");
      const preTexts = Array.from(document.querySelectorAll("pre"))
        .filter((n) => !n.querySelector("code"))
        .map((n) => n.textContent || "");

      const groups = [preCodeTexts, codeTexts, preTexts];
      let sawEmptyArray = false;
      let sawSchemaError = null;

      for (const group of groups) {
        if (group.length === 0) continue;
        for (const rawText of group) {
          try {
            const parsed = JSON.parse(rawText);
            if (!Array.isArray(parsed)) continue;
            if (parsed.length === 0) {
              sawEmptyArray = true;
              continue;
            }
            const patients = [];
            let invalid = false;
            for (let i = 0; i < parsed.length; i += 1) {
              const res = validatePatient(parsed[i], i);
              if (!res.valid) {
                invalid = true;
                sawSchemaError = res.error;
                break;
              }
              patients.push(res.normalized);
            }
            if (!invalid) return { success: true, patients };
          } catch (_e) {
            // ignore and continue next candidate
          }
        }
      }

      if (sawSchemaError) return { success: false, error: sawSchemaError };
      if (sawEmptyArray) return { success: false, error: "患者データが空です" };
      return { success: false, error: "JSONが見つかりません" };
    },
  });

  return result;
}

function createDefaultState(nowFn) {
  return {
    patients: [],
    currentBatchId: null,
    currentScreen: SCREENS.SETUP,
    currentMode: "prod",
    inputDate: getTodayString(nowFn),
    isSending: false,
    statusMessage: "",
    todayCount: 0,
    settings: {
      gasUrlProd: "",
      gasUrlDev: "",
      doctorId: "",
      diagnosisMaster: [],
      diagnosisCount: {},
      apiSecret: "",
    },
  };
}

function setupValidation(input, diagnosisMaster) {
  if (!String(input.gasUrlProd || "").trim()) {
    return "GAS URL（本番）は必須です";
  }
  if (!String(input.apiSecret || "").trim()) {
    return "シークレットキーは必須です";
  }
  if (!String(input.doctorId || "").trim()) {
    return "社員番号は必須です";
  }
  if (!diagnosisMaster.length) {
    return "診断名を1件以上入力してください";
  }
  return null;
}

export function createPopupController(customDeps = {}) {
  const deps = {
    storageLocal:
      customDeps.storageLocal ||
      (typeof chrome !== "undefined" ? chrome.storage?.local : null),
    storageSession:
      customDeps.storageSession ||
      (typeof chrome !== "undefined" ? chrome.storage?.session : null),
    executeExtract: customDeps.executeExtract || defaultExecuteExtract,
    sendRecordBatch: customDeps.sendRecordBatch || defaultSendRecordBatch,
    uuid: customDeps.uuid || (() => crypto.randomUUID()),
    now: customDeps.now || (() => new Date()),
  };

  const state = createDefaultState(deps.now);

  async function init() {
    const local = await deps.storageLocal.get({
      gasUrlProd: "",
      gasUrlDev: "",
      doctorId: "",
      diagnosisMaster: [],
      diagnosisCount: {},
      todayCount: 0,
    });
    const session = await deps.storageSession.get({
      apiSecret: "",
      currentBatchId: null,
    });

    state.settings.gasUrlProd = local.gasUrlProd || "";
    state.settings.gasUrlDev = local.gasUrlDev || "";
    state.settings.doctorId = local.doctorId || "";
    state.settings.diagnosisMaster = Array.isArray(local.diagnosisMaster)
      ? local.diagnosisMaster
      : [];
    state.settings.diagnosisCount = local.diagnosisCount || {};
    state.settings.apiSecret = session.apiSecret || "";
    state.currentBatchId = session.currentBatchId || null;
    state.todayCount = Number(local.todayCount || 0);
    state.inputDate = getTodayString(deps.now);

    const setupReady =
      Boolean(state.settings.gasUrlProd) &&
      Boolean(state.settings.apiSecret) &&
      Boolean(state.settings.doctorId) &&
      state.settings.diagnosisMaster.length > 0;

    state.currentScreen = setupReady ? SCREENS.MAIN : SCREENS.SETUP;
    return { success: true, screen: state.currentScreen };
  }

  async function saveSetup(input) {
    const diagnosisMaster = parseDiagnosisMasterText(input.diagnosisMasterText);
    const error = setupValidation(input, diagnosisMaster);
    if (error) {
      state.statusMessage = error;
      return { success: false, error };
    }

    await deps.storageLocal.set({
      gasUrlProd: input.gasUrlProd.trim(),
      gasUrlDev: String(input.gasUrlDev || "").trim(),
      doctorId: input.doctorId.trim(),
      diagnosisMaster,
    });
    await deps.storageSession.set({ apiSecret: input.apiSecret.trim() });

    state.settings.gasUrlProd = input.gasUrlProd.trim();
    state.settings.gasUrlDev = String(input.gasUrlDev || "").trim();
    state.settings.doctorId = input.doctorId.trim();
    state.settings.diagnosisMaster = diagnosisMaster;
    state.settings.apiSecret = input.apiSecret.trim();
    state.currentScreen = SCREENS.MAIN;
    state.statusMessage = "設定を保存しました";
    return { success: true };
  }

  async function fetchFromChatGPT() {
    try {
      const extracted = await deps.executeExtract();
      if (!extracted?.success) {
        const error = extracted?.error || "患者データの取得に失敗しました";
        state.statusMessage = error;
        return { success: false, error };
      }

      const batchId = deps.uuid();
      state.currentBatchId = batchId;
      await deps.storageSession.set({ currentBatchId: batchId });

      state.patients = extracted.patients.map((p) => ({
        age: p.age,
        gender: p.gender,
        diagnoses: [""],
        rehab: null,
        remarks: "",
      }));
      state.currentScreen = SCREENS.MAIN;
      state.statusMessage = `${state.patients.length}件を読み取りました`;
      return { success: true, count: state.patients.length };
    } catch (error) {
      state.statusMessage = error?.message || String(error);
      return { success: false, error: state.statusMessage };
    }
  }

  function isSendEnabled() {
    if (!state.patients.length) return false;
    return state.patients.every((p) => typeof p.rehab === "boolean");
  }

  function getNextUnselectedIndex() {
    return state.patients.findIndex((p) => p.rehab === null);
  }

  function goToConfirm() {
    if (!state.patients.length) {
      state.statusMessage = "患者がいません";
      return false;
    }
    if (!isSendEnabled()) {
      state.statusMessage = "リハ未選択があります";
      return false;
    }
    state.currentScreen = SCREENS.CONFIRM;
    return true;
  }

  function backToMain() {
    state.currentScreen = SCREENS.MAIN;
  }

  function setMode(mode) {
    if (mode === "prod" || mode === "dev") {
      state.currentMode = mode;
    }
  }

  function setInputDate(date) {
    state.inputDate = date;
  }

  async function incrementDiagnosisUsage(name) {
    const key = String(name || "").trim();
    if (!key) return;
    const { diagnosisCount = {} } = await deps.storageLocal.get({ diagnosisCount: {} });
    diagnosisCount[key] = (diagnosisCount[key] || 0) + 1;
    await deps.storageLocal.set({ diagnosisCount });
    state.settings.diagnosisCount = diagnosisCount;
  }

  async function getTopDiagnoses(limit = 5) {
    const local = await deps.storageLocal.get({
      diagnosisMaster: state.settings.diagnosisMaster,
      diagnosisCount: state.settings.diagnosisCount,
    });
    const diagnosisMaster = Array.isArray(local.diagnosisMaster) ? local.diagnosisMaster : [];
    const diagnosisCount = local.diagnosisCount || {};

    return [...diagnosisMaster]
      .sort((a, b) => {
        const ca = diagnosisCount[a] || 0;
        const cb = diagnosisCount[b] || 0;
        if (cb !== ca) return cb - ca;
        return a.localeCompare(b);
      })
      .slice(0, limit);
  }

  function buildRecords() {
    const dateStr = state.inputDate || getTodayString(deps.now);
    return state.patients.map((patient, index) => ({
      clientRecordId: `${state.currentBatchId}_${index}`,
      timestamp: makeTimestamp(dateStr, index),
      age: Number(patient.age),
      gender: patient.gender,
      diagnoses: ensureDiagnosisArray(patient.diagnoses),
      rehab: patient.rehab,
      remarks: String(patient.remarks || ""),
    }));
  }

  async function sendFromConfirm() {
    if (state.isSending) {
      return { success: false, error: "送信中です" };
    }
    if (!state.currentBatchId) {
      return { success: false, error: "batchIdがありません" };
    }
    if (!isSendEnabled()) {
      return { success: false, error: "リハ未選択があります" };
    }

    const url =
      state.currentMode === "dev" && state.settings.gasUrlDev
        ? state.settings.gasUrlDev
        : state.settings.gasUrlProd;
    if (!url) {
      state.statusMessage = "GAS URLを設定してください";
      return { success: false, error: state.statusMessage };
    }

    const records = buildRecords();
    const payload = buildRecordBatchPayload({
      secret: state.settings.apiSecret,
      doctorId: state.settings.doctorId,
      batchId: state.currentBatchId,
      records,
    });

    const request = {
      url,
      payload,
      batchId: state.currentBatchId,
      records,
    };

    state.isSending = true;
    try {
      const result = await deps.sendRecordBatch(request);
      if (!result?.success) {
        const error = result?.error || "送信に失敗しました";
        state.statusMessage = error;
        return { success: false, error };
      }

      const completedBatchId = state.currentBatchId;
      state.currentBatchId = null;
      await deps.storageSession.remove("currentBatchId");
      state.currentScreen = SCREENS.DONE;
      state.statusMessage = `${records.length}件を送信しました`;

      const currentTodayCount = Number((await deps.storageLocal.get({ todayCount: 0 })).todayCount || 0);
      const nextTodayCount = currentTodayCount + records.length;
      state.todayCount = nextTodayCount;
      await deps.storageLocal.set({ todayCount: nextTodayCount });

      return { success: true, batchId: completedBatchId, data: result.data };
    } catch (error) {
      state.statusMessage = error?.message || String(error);
      return { success: false, error: state.statusMessage };
    } finally {
      state.isSending = false;
    }
  }

  return {
    state,
    init,
    saveSetup,
    fetchFromChatGPT,
    isSendEnabled,
    getNextUnselectedIndex,
    goToConfirm,
    backToMain,
    sendFromConfirm,
    setMode,
    setInputDate,
    incrementDiagnosisUsage,
    getTopDiagnoses,
  };
}

function wirePopupUI() {
  if (typeof document === "undefined") return;
  const root = document.getElementById("app");
  if (!root) return;

  const controller = createPopupController();
  controller.init().then(() => {
    root.dataset.screen = controller.state.currentScreen;
  });
}

if (typeof window !== "undefined") {
  window.popupApp = {
    createPopupController,
    parseDiagnosisMasterText,
    SCREENS,
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wirePopupUI);
  } else {
    wirePopupUI();
  }
}
