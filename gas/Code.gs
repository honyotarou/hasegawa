const CONFIG = {
  SPREADSHEET_ID: '1ECE1pPn58spv-Q5TVvkF_9fFhcBp5CcCf-qBTeHHwA8',
  MASTER_SHEET_NAME: 'RehaTrueFalse',
  JSON_FOLDER_ID: '135AjBdyPjlPfMzpZurJJM1B3_6wXQa7k',
  RECENT_HASH_LIMIT: 200,
};

function setupSecret() {
  PropertiesService.getScriptProperties().setProperty('API_SECRET', 'YOUR_SECRET_HERE');
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
    if (body.secret !== secret) {
      return jsonResponse({ success: false, error: '認証失敗' });
    }

    switch (body.action) {
      case 'record':
        return handleRecord(body);
      case 'recordBatch':
        return handleRecordBatch(body);
      case 'dailyReport':
        return handleDailyReport(body.date);
      default:
        return jsonResponse({ success: false, error: '不正なactionです' });
    }
  } catch (err) {
    Logger.log('doPostエラー: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function handleRecordBatch(body) {
  if (!Array.isArray(body.records) || body.records.length === 0) {
    return jsonResponse({ success: false, error: 'recordsが空配列です' });
  }
  if (!body.batchId) {
    return jsonResponse({ success: false, error: 'batchIdが必須です' });
  }
  if (!body.doctorId) {
    return jsonResponse({ success: false, error: 'doctorIdが必須です' });
  }

  const validated = [];
  for (let i = 0; i < body.records.length; i++) {
    const rec = body.records[i];
    if (!rec.clientRecordId) {
      return jsonResponse({ success: false, error: 'records[' + i + ']: clientRecordIdが必須です' });
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
      return jsonResponse({ success: false, error: 'records[' + i + ']: ' + v.error });
    }

    validated.push({ entry: rec, normalized: v.normalized });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return appendRecordBatch(body.doctorId, body.batchId, validated);
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function appendRecordBatch(doctorId, batchId, validatedList) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error('マスターシートが見つかりません');

  const lastRow = sheet.getLastRow();
  let existingHashes = [];
  if (lastRow > 1) {
    const checkFrom = Math.max(2, lastRow - CONFIG.RECENT_HASH_LIMIT + 1);
    const checkCount = lastRow - checkFrom + 1;
    existingHashes = sheet
      .getRange(checkFrom, 2, checkCount, 1)
      .getValues()
      .flat()
      .map(String);
  }

  const rowsToWrite = [];
  const skipped = [];

  validatedList.forEach(function (item, index) {
    const entry = item.entry;
    const normalized = item.normalized;
    const hashKey = simpleHash(entry.clientRecordId).toString();

    if (existingHashes.includes(hashKey)) {
      skipped.push(index);
      return;
    }

    rowsToWrite.push([
      entry.timestamp || new Date().toISOString(), // A
      hashKey, // B
      doctorId, // C
      batchId, // D
      entry.clientRecordId, // E
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
    ]);
    existingHashes.push(hashKey);
  });

  if (rowsToWrite.length > 0) {
    sheet.getRange(lastRow + 1, 1, rowsToWrite.length, 15).setValues(rowsToWrite);
  }

  return jsonResponse({ success: true, written: rowsToWrite.length, skipped: skipped.length });
}

function handleRecord(body) {
  const obj = typeof body.answer === 'string' ? JSON.parse(body.answer) : body.answer;
  const v = validateAndNormalize(obj);
  if (!v.valid) return jsonResponse({ success: false, error: v.error });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return appendRecord(body, v.normalized);
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function appendRecord(body, normalized) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error('マスターシートが見つかりません');

  const rawAnswer = typeof body.answer === 'string' ? body.answer : JSON.stringify(body.answer);
  const hashKey = simpleHash((body.doctorId || '') + '_' + rawAnswer).toString();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const checkFrom = Math.max(2, lastRow - CONFIG.RECENT_HASH_LIMIT + 1);
    const checkCount = lastRow - checkFrom + 1;
    const hashes = sheet
      .getRange(checkFrom, 2, checkCount, 1)
      .getValues()
      .flat()
      .map(String);
    if (hashes.includes(hashKey)) {
      return jsonResponse({ success: false, error: '重複データのためスキップ' });
    }
  }

  const rowData = [
    body.timestamp || new Date().toISOString(), // A
    hashKey, // B
    body.doctorId || '', // C
    body.batchId || '', // D
    body.clientRecordId || '', // E
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

  sheet.getRange(lastRow + 1, 1, 1, 15).setValues([rowData]);
  return jsonResponse({ success: true, hash: hashKey });
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
  return jsonResponse({
    success: true,
    date: date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    overall: calcOverallRehabRateForNewPatients(),
    byDiagnosis: calcRehabRateByDiagnosis(),
    daily: calcDailyRehabRateForNewPatients(date),
    bySymptom: calcRehabRateByDiagnosisToRehaSymptom(),
    byAgeAndSex: calcRehabRateByAgeAndSex(),
  });
}

function getOrCreateReportFolder() {
  return DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
}

function mainFlow() {
  return handleDailyReport();
}

function calcOverallRehabRateForNewPatients() {
  const rows = readMasterRows_();
  const total = rows.length;
  const rehabTrue = rows.filter(function (row) {
    return row[13] === true; // N列
  }).length;
  return {
    total: total,
    rehabTrue: rehabTrue,
    rate: total ? rehabTrue / total : 0,
  };
}

function calcRehabRateByDiagnosis() {
  const rows = readMasterRows_();
  const map = {};

  rows.forEach(function (row) {
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

function calcDailyRehabRateForNewPatients(date) {
  const rows = readMasterRows_();
  const key = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const target = rows.filter(function (row) {
    return String(row[0] || '').slice(0, 10) === key; // A列
  });

  const total = target.length;
  const rehabTrue = target.filter(function (row) {
    return row[13] === true; // N列
  }).length;

  return { date: key, total: total, rehabTrue: rehabTrue, rate: total ? rehabTrue / total : 0 };
}

function calcRehabRateByDiagnosisToRehaSymptom() {
  return calcRehabRateByDiagnosis();
}

function calcRehabRateByAgeAndSex() {
  const rows = readMasterRows_();
  const map = {};

  rows.forEach(function (row) {
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
  const ym = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMM');
  return prefix + '_' + ym;
}

function createDailyTrigger() {
  // atHour(14) は 14:00〜15:00 のどこかで実行（分はランダム）
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

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
