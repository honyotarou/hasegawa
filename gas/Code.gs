const CONFIG = {
  SPREADSHEET_ID: '1ECE1pPn58spv-Q5TVvkF_9fFhcBp5CcCf-qBTeHHwA8',
  MASTER_SHEET_NAME: 'RehaTrueFalse',
  AUDIT_SHEET_NAME: 'AuditEvidence',
  JSON_FOLDER_ID: '135AjBdyPjlPfMzpZurJJM1B3_6wXQa7k',
  RECENT_HASH_LIMIT: 200,
};

// validateAndNormalize / normalizeGender / normalizeRequiredText / sanitizeForSheetText are defined in Validation.gs.

function requireNonBlankText_(value, fieldName) {
  const normalized = normalizeRequiredText(value);
  if (!normalized) {
    throw new Error(fieldName + 'が必須です');
  }
  return normalized;
}

function sanitizeSheetCellText_(value, limit) {
  const text = sanitizeForSheetText(value);
  return typeof limit === 'number' ? text.slice(0, limit) : text;
}

function buildAuditRow_(event) {
  return [
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss',
    ),
    Utilities.getUuid(),
    sanitizeSheetCellText_(event.action || '', 50),
    sanitizeSheetCellText_(event.status || '', 50),
    sanitizeSheetCellText_(event.doctorId || '', 100),
    sanitizeSheetCellText_(event.batchId || '', 100),
    Number(event.written || 0),
    Number(event.skipped || 0),
    sanitizeSheetCellText_(event.error || '', 500),
    event.meta ? sanitizeSheetCellText_(JSON.stringify(event.meta), 1000) : '',
  ];
}

function buildMasterRow_(entry, doctorId, batchId, hashKey, normalized) {
  return [
    sanitizeSheetCellText_(entry.timestamp || new Date().toISOString(), 100), // A
    hashKey, // B
    sanitizeSheetCellText_(doctorId, 100), // C
    sanitizeSheetCellText_(batchId, 100), // D
    sanitizeSheetCellText_(entry.clientRecordId, 100), // E
    normalized.age, // F
    normalized.gender, // G
    normalized.diagnoses[0], // H
    normalized.diagnoses[1], // I
    normalized.diagnoses[2], // J
    normalized.diagnoses[3], // K
    normalized.diagnoses[4], // L
    normalized.diagnoses[5], // M
    normalized.rehab, // N
    normalized.remarks, // O
  ];
}

function batchErrorResult_(auditAction, body, errorMessage) {
  appendAuditEvent_({
    action: auditAction,
    status: 'error',
    doctorId: (body && body.doctorId) || '',
    batchId: (body && body.batchId) || '',
    error: errorMessage,
  });
  return { success: false, error: errorMessage };
}

function setupSecret() {
  const secret = 'YOUR_SECRET_HERE';
  if (secret === 'YOUR_SECRET_HERE') {
    throw new Error('API_SECRET must be changed from the placeholder before setup');
  }
  PropertiesService.getScriptProperties().setProperty('API_SECRET', secret);
}

function setupEvidenceSecret() {
  const secret = 'YOUR_EVIDENCE_SECRET_HERE';
  if (secret === 'YOUR_EVIDENCE_SECRET_HERE') {
    throw new Error('EVIDENCE_SECRET must be changed from the placeholder before setup');
  }
  PropertiesService.getScriptProperties().setProperty('EVIDENCE_SECRET', secret);
}

function verifyRequestSecret_(body) {
  const action = (body && body.action ? String(body.action) : '').trim();
  const provided = (body && body.secret ? String(body.secret) : '').trim();
  const props = PropertiesService.getScriptProperties();

  if (action === 'getEvidenceEvents') {
    const expectedEvidenceSecret = (props.getProperty('EVIDENCE_SECRET') || '').trim();
    if (!expectedEvidenceSecret) {
      return { valid: false, reason: 'EVIDENCE_SECRETが未設定です' };
    }
    return { valid: provided === expectedEvidenceSecret, reason: '認証失敗' };
  }

  const expectedApiSecret = (props.getProperty('API_SECRET') || '').trim();
  if (!expectedApiSecret) {
    return { valid: false, reason: 'API_SECRETが未設定です' };
  }
  return { valid: provided === expectedApiSecret, reason: '認証失敗' };
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
    const auth = verifyRequestSecret_(body);
    if (!auth.valid) {
      appendAuditEvent_({
        action: body.action || 'unknown',
        status: 'auth_error',
        doctorId: body.doctorId || '',
        batchId: body.batchId || '',
        error: auth.reason,
      });
      return jsonResponse({ success: false, error: '認証失敗' });
    }

    switch (body.action) {
      case 'record':
        return handleRecord(body);
      case 'recordBatch':
        return handleRecordBatch(body);
      case 'dailyReport':
        return handleDailyReport(body.date);
      case 'getEvidenceEvents':
        return handleGetEvidenceEvents(body);
      default:
        appendAuditEvent_({
          action: body.action || 'unknown',
          status: 'error',
          doctorId: body.doctorId || '',
          batchId: body.batchId || '',
          error: '不正なactionです',
        });
        return jsonResponse({ success: false, error: '不正なactionです' });
    }
  } catch (err) {
    appendAuditEvent_({
      action: body.action || 'unknown',
      status: 'exception',
      doctorId: body.doctorId || '',
      batchId: body.batchId || '',
      error: err.message,
    });
    Logger.log('doPostエラー: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function processRecordBatch_(body, auditAction) {
  if (!Array.isArray(body.records) || body.records.length === 0) {
    return batchErrorResult_(auditAction, body, 'recordsが空配列です');
  }

  let batchId;
  let doctorId;
  try {
    batchId = requireNonBlankText_(body.batchId, 'batchId');
    doctorId = requireNonBlankText_(body.doctorId, 'doctorId');
  } catch (err) {
    return batchErrorResult_(auditAction, body, err.message);
  }

  const validated = [];
  for (let i = 0; i < body.records.length; i++) {
    const rec = body.records[i];
    let clientRecordId;
    try {
      clientRecordId = requireNonBlankText_(rec.clientRecordId, 'clientRecordId');
    } catch (err) {
      return batchErrorResult_(auditAction, body, 'records[' + i + ']: ' + err.message);
    }

    const obj = {
      age: rec.age,
      gender: rec.gender,
      diagnoses: rec.diagnoses || [],
      rehab: rec.rehab,
      remarks: rec.remarks || '',
    };

    const v = validateAndNormalize(obj);
    if (!v.valid) {
      return batchErrorResult_(auditAction, body, 'records[' + i + ']: ' + v.error);
    }

    validated.push({
      entry: {
        timestamp: rec.timestamp,
        clientRecordId: clientRecordId,
      },
      normalized: v.normalized,
    });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return appendRecordBatch_(doctorId, batchId, validated, auditAction);
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function handleRecordBatch(body) {
  return jsonResponse(processRecordBatch_(body, 'recordBatch'));
}

function appendRecordBatch_(doctorId, batchId, validatedList, auditAction) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error('マスターシートが見つかりません');

  const lastRow = sheet.getLastRow();
  const existingHashToClientIds = {};
  if (lastRow > 1) {
    const checkFrom = Math.max(2, lastRow - CONFIG.RECENT_HASH_LIMIT + 1);
    const checkCount = lastRow - checkFrom + 1;
    // B:hashKey 〜 E:clientRecordId を一括取得し、hash衝突時は clientRecordId で厳密判定する。
    const recentRows = sheet.getRange(checkFrom, 2, checkCount, 4).getValues();
    recentRows.forEach(function (row) {
      const hash = String(row[0] || '');
      const clientRecordId = String(row[3] || '');
      if (!hash) return;
      if (!existingHashToClientIds[hash]) {
        existingHashToClientIds[hash] = {};
      }
      if (clientRecordId) {
        existingHashToClientIds[hash][clientRecordId] = true;
      }
    });
  }

  const rowsToWrite = [];
  const skipped = [];

  validatedList.forEach(function (item, index) {
    const entry = item.entry;
    const normalized = item.normalized;
    const hashKey = simpleHash(entry.clientRecordId).toString();
    if (!existingHashToClientIds[hashKey]) {
      existingHashToClientIds[hashKey] = {};
    }
    if (existingHashToClientIds[hashKey][entry.clientRecordId]) {
      skipped.push(index);
      return;
    }

    rowsToWrite.push(buildMasterRow_(entry, doctorId, batchId, hashKey, normalized));
    existingHashToClientIds[hashKey][entry.clientRecordId] = true;
  });

  if (rowsToWrite.length > 0) {
    sheet.getRange(lastRow + 1, 1, rowsToWrite.length, 15).setValues(rowsToWrite);
  }

  const auditLogged = appendAuditEvent_({
    action: auditAction,
    status: 'success',
    doctorId: doctorId,
    batchId: batchId,
    written: rowsToWrite.length,
    skipped: skipped.length,
    error: '',
  });

  return {
    success: true,
    written: rowsToWrite.length,
    skipped: skipped.length,
    auditLogged: auditLogged,
  };
}

function buildLegacyRecordBatchBody_(body) {
  const answer = typeof body.answer === 'string' ? JSON.parse(body.answer) : body.answer;
  const rawAnswer = typeof body.answer === 'string' ? body.answer : JSON.stringify(body.answer);
  const trimmedClientRecordId = normalizeRequiredText(body.clientRecordId);
  const clientRecordId =
    trimmedClientRecordId || strongHash_((body.doctorId || '') + '_' + rawAnswer);
  const batchId = normalizeRequiredText(body.batchId) || 'legacy-record';

  return {
    action: 'recordBatch',
    doctorId: body.doctorId,
    batchId: batchId,
    records: [{
      clientRecordId: clientRecordId,
      timestamp: body.timestamp,
      age: answer.age,
      gender: answer.gender,
      diagnoses: answer.diagnoses || [],
      rehab: answer.rehab,
      remarks: answer.remarks || '',
    }],
  };
}

function handleRecord(body) {
  try {
    const batchBody = buildLegacyRecordBatchBody_(body);
    const clientRecordId = batchBody.records[0].clientRecordId;
    const result = processRecordBatch_(batchBody, 'record');
    if (result.success) {
      result.hash = simpleHash(clientRecordId).toString();
    }
    return jsonResponse(result);
  } catch (err) {
    appendAuditEvent_({
      action: 'record',
      status: 'error',
      doctorId: body.doctorId || '',
      batchId: body.batchId || '',
      error: err.message,
    });
    return jsonResponse({ success: false, error: err.message });
  }
}

function handleGetEvidenceEvents(body) {
  const parsedLimit = Number(body.limit);
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(500, Math.floor(parsedLimit)))
    : 100;
  const events = listEvidenceEvents_(limit);
  return jsonResponse({ success: true, events: events });
}

function listEvidenceEvents_(limit) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const startRow = Math.max(2, lastRow - limit + 1);
  const count = lastRow - startRow + 1;
  const rows = sheet.getRange(startRow, 1, count, 10).getValues();

  const events = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    events.push({
      timestamp: row[0] || '',
      eventId: row[1] || '',
      action: row[2] || '',
      status: row[3] || '',
      doctorId: row[4] || '',
      batchId: row[5] || '',
      written: Number(row[6] || 0),
      skipped: Number(row[7] || 0),
      error: row[8] || '',
      meta: row[9] || '',
    });
  }
  return events;
}

function appendAuditEvent_(event) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.AUDIT_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.AUDIT_SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 10).setValues([[
        'timestamp',
        'eventId',
        'action',
        'status',
        'doctorId',
        'batchId',
        'written',
        'skipped',
        'error',
        'meta',
      ]]);
    }

    const row = buildAuditRow_(event);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues([row]);
    return true;
  } catch (err) {
    Logger.log('監査ログ書き込み失敗: ' + err.message);
    appendAuditFallback_(event, err);
    return false;
  }
}

function appendAuditFallback_(event, err) {
  try {
    const props = PropertiesService.getScriptProperties();
    const key = 'AUDIT_FALLBACK_BUFFER';
    let list = [];
    try {
      const raw = props.getProperty(key);
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch (_) {
      list = [];
    }
    list.push({
      timestamp: new Date().toISOString(),
      action: event.action || '',
      status: event.status || '',
      doctorId: event.doctorId || '',
      batchId: event.batchId || '',
      error: (err && err.message ? err.message : String(err || '')).slice(0, 500),
    });
    if (list.length > 30) {
      list = list.slice(list.length - 30);
    }
    let serialized = JSON.stringify(list);
    while (serialized.length > 8000 && list.length > 1) {
      list.shift();
      serialized = JSON.stringify(list);
    }
    props.setProperty(key, serialized);
  } catch (fallbackErr) {
    Logger.log('監査fallback書き込み失敗: ' + fallbackErr.message);
  }
}

function readMasterRows_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error('マスターシートが見つかりません');

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, 15).getValues();
}

function handleDailyReport(date) {
  const rows = readMasterRows_();
  return jsonResponse({
    success: true,
    date: date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    overall: calcOverallRehabRateForNewPatients(rows),
    byDiagnosis: calcRehabRateByDiagnosis(rows),
    daily: calcDailyRehabRateForNewPatients(date, rows),
    bySymptom: calcRehabRateByDiagnosisToRehaSymptom(rows),
    byAgeAndSex: calcRehabRateByAgeAndSex(rows),
  });
}

function getOrCreateReportFolder() {
  return DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
}

function mainFlow() {
  return handleDailyReport();
}

function calcOverallRehabRateForNewPatients(rows) {
  const sourceRows = rows || readMasterRows_();
  const total = sourceRows.length;
  const rehabTrue = sourceRows.filter(function (row) {
    return row[13] === true; // N列
  }).length;
  return {
    total: total,
    rehabTrue: rehabTrue,
    rate: total ? rehabTrue / total : 0,
  };
}

function calcRehabRateByDiagnosis(rows) {
  const sourceRows = rows || readMasterRows_();
  const map = {};

  sourceRows.forEach(function (row) {
    const diagnosis = normalizeDiagnosis(row[7]); // H列
    if (!diagnosis) return;

    if (!map[diagnosis]) {
      map[diagnosis] = { total: 0, rehabTrue: 0 };
    }
    map[diagnosis].total += 1;
    if (row[13] === true) map[diagnosis].rehabTrue += 1; // N列
  });

  return Object.keys(map).map(function (name) {
    const s = map[name];
    return {
      diagnosis: name,
      total: s.total,
      rehabTrue: s.rehabTrue,
      rate: s.total ? s.rehabTrue / s.total : 0,
    };
  });
}

function calcDailyRehabRateForNewPatients(date, rows) {
  const sourceRows = rows || readMasterRows_();
  const key = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const target = sourceRows.filter(function (row) {
    return String(row[0] || '').slice(0, 10) === key; // A列
  });

  const total = target.length;
  const rehabTrue = target.filter(function (row) {
    return row[13] === true; // N列
  }).length;

  return { date: key, total: total, rehabTrue: rehabTrue, rate: total ? rehabTrue / total : 0 };
}

function calcRehabRateByDiagnosisToRehaSymptom(rows) {
  return calcRehabRateByDiagnosis(rows);
}

function calcRehabRateByAgeAndSex(rows) {
  const sourceRows = rows || readMasterRows_();
  const map = {};

  sourceRows.forEach(function (row) {
    const age = Number(row[5]); // F列
    const sex = normalizeSex(row[6]); // G列
    const ageBand = getAgeBand(age);
    const key = ageBand + ':' + sex;

    if (!map[key]) {
      map[key] = { ageBand: ageBand, sex: sex, total: 0, rehabTrue: 0 };
    }
    map[key].total += 1;
    if (row[13] === true) map[key].rehabTrue += 1; // N列
  });

  return Object.keys(map)
    .map(function (k) {
      const v = map[k];
      return {
        ageBand: v.ageBand,
        sex: v.sex,
        total: v.total,
        rehabTrue: v.rehabTrue,
        rate: v.total ? v.rehabTrue / v.total : 0,
      };
    })
    .sort(function (a, b) {
      return ageBandSortKey(a.ageBand) - ageBandSortKey(b.ageBand);
    });
}

function normalizeDiagnosis(str) {
  return (str || '').toString().trim().replace(/\s+/g, ' ');
}

function normalizeSex(str) {
  const s = (str || '').toString().trim();
  if (/^(男|男性)$/.test(s)) return '男性';
  if (/^(女|女性)$/.test(s)) return '女性';
  return 'その他';
}

function getAgeBand(age) {
  if (!Number.isFinite(age)) return '不明';
  if (age < 0) return '不明';
  if (age >= 90) return '90代+';
  const low = Math.floor(age / 10) * 10;
  return low + '代';
}

function ageBandSortKey(label) {
  if (label === '不明') return 999;
  if (label === '90代+') return 90;
  const num = parseInt(label, 10);
  return Number.isNaN(num) ? 999 : num;
}

function getMonthlySheetName(prefix) {
  const yyyymm = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMM');
  return prefix + '_' + yyyymm;
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'mainFlow') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  // atHour(14) は 14:00〜15:00 のどこかで実行（分はランダム）。固定したい場合は nearMinute() を追加する。
  ScriptApp.newTrigger('mainFlow').timeBased().everyDays(1).atHour(14).create();
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function strongHash_(str) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(str || ''),
    Utilities.Charset.UTF_8,
  );
  return digest
    .map(function (b) {
      const n = b < 0 ? b + 256 : b;
      return ('0' + n.toString(16)).slice(-2);
    })
    .join('');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
