var CONFIG = {
  SPREADSHEET_ID: "1ECE1pPn58spv-Q5TVvkF_9fFhcBp5CcCf-qBTeHHwA8",
  MASTER_SHEET_NAME: "RehaTrueFalse",
  JSON_FOLDER_ID: "135AjBdyPjlPfMzpZurJJM1B3_6wXQa7k",
  RECENT_HASH_LIMIT: 200,
};

function setupSecret() {
  PropertiesService.getScriptProperties().setProperty("API_SECRET", "YOUR_SECRET_HERE");
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty("API_SECRET");
    if (body.secret !== secret) {
      return jsonResponse({ success: false, error: "認証失敗" });
    }

    switch (body.action) {
      case "record":
        return handleRecord(body);
      case "recordBatch":
        return handleRecordBatch(body);
      case "dailyReport":
        return handleDailyReport(body.date);
      default:
        return jsonResponse({ success: false, error: "不正なactionです" });
    }
  } catch (err) {
    Logger.log("doPostエラー: " + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

function handleRecordBatch(body) {
  if (!Array.isArray(body.records) || body.records.length === 0) {
    return jsonResponse({ success: false, error: "recordsが空配列です" });
  }
  if (!body.batchId) {
    return jsonResponse({ success: false, error: "batchIdが必須です" });
  }

  var validated = [];
  for (var i = 0; i < body.records.length; i++) {
    var rec = body.records[i];
    if (!rec.clientRecordId) {
      return jsonResponse({ success: false, error: "records[" + i + "]: clientRecordIdが必須です" });
    }

    var obj = {
      age: rec.age,
      gender: rec.gender,
      diagnoses: rec.diagnoses || [],
      rehab: rec.rehab,
      remarks: rec.remarks || "",
    };
    var res = validateAndNormalize(obj);
    if (!res.valid) {
      return jsonResponse({ success: false, error: "records[" + i + "]: " + res.error });
    }
    validated.push({ entry: rec, normalized: res.normalized });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return appendRecordBatch(body.doctorId, validated);
  } finally {
    lock.releaseLock();
  }
}

function appendRecordBatch(_doctorId, validatedList) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error("マスターシートが見つかりません");

  var lastRow = sheet.getLastRow();
  var existingSet = {};
  if (lastRow > 1) {
    var checkFrom = Math.max(2, lastRow - CONFIG.RECENT_HASH_LIMIT + 1);
    var checkCount = lastRow - checkFrom + 1;
    var hashes = sheet
      .getRange(checkFrom, 2, checkCount, 1)
      .getValues()
      .flat()
      .map(String);
    for (var h = 0; h < hashes.length; h++) existingSet[hashes[h]] = true;
  }

  var rowsToWrite = [];
  var skipped = [];

  validatedList.forEach(function (item, index) {
    var entry = item.entry;
    var normalized = item.normalized;
    var hashKey = simpleHash(entry.clientRecordId).toString();

    if (existingSet[hashKey]) {
      skipped.push(index);
      return;
    }

    rowsToWrite.push([
      entry.timestamp || new Date().toISOString(),
      hashKey,
      normalized.age,
      normalized.gender,
      normalized.diagnoses[0],
      normalized.diagnoses[1],
      normalized.diagnoses[2],
      normalized.diagnoses[3],
      normalized.diagnoses[4],
      normalized.diagnoses[5],
      normalized.rehab,
      normalized.remarks,
    ]);
    existingSet[hashKey] = true;
  });

  if (rowsToWrite.length > 0) {
    sheet.getRange(lastRow + 1, 1, rowsToWrite.length, 12).setValues(rowsToWrite);
  }

  return jsonResponse({
    success: true,
    written: rowsToWrite.length,
    skipped: skipped.length,
  });
}

function handleRecord(body) {
  var obj = typeof body.answer === "string" ? JSON.parse(body.answer) : body.answer;
  var res = validateAndNormalize(obj);
  if (!res.valid) return jsonResponse({ success: false, error: res.error });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return appendRecord(body, res.normalized);
  } finally {
    lock.releaseLock();
  }
}

function appendRecord(body, normalized) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error("マスターシートが見つかりません");

  var rawAnswer = typeof body.answer === "string" ? body.answer : JSON.stringify(body.answer);
  var hashKey = simpleHash((body.doctorId || "") + "_" + rawAnswer).toString();
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var checkFrom = Math.max(2, lastRow - CONFIG.RECENT_HASH_LIMIT + 1);
    var checkCount = lastRow - checkFrom + 1;
    var hashes = sheet
      .getRange(checkFrom, 2, checkCount, 1)
      .getValues()
      .flat()
      .map(String);
    if (hashes.indexOf(hashKey) >= 0) {
      return jsonResponse({ success: false, error: "重複データのためスキップ" });
    }
  }

  var rowData = [
    body.timestamp || new Date().toISOString(),
    hashKey,
    normalized.age,
    normalized.gender,
    normalized.diagnoses[0],
    normalized.diagnoses[1],
    normalized.diagnoses[2],
    normalized.diagnoses[3],
    normalized.diagnoses[4],
    normalized.diagnoses[5],
    normalized.rehab,
    normalized.remarks,
  ];
  sheet.getRange(lastRow + 1, 1, 1, 12).setValues([rowData]);
  return jsonResponse({ success: true, hash: hashKey });
}

function getMasterRows_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.MASTER_SHEET_NAME);
  if (!sheet) throw new Error("マスターシートが見つかりません");

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, 12).getValues();
}

function handleDailyReport(date) {
  var targetDate = date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var report = {
    date: targetDate,
    overall: calcOverallRehabRateForNewPatients(targetDate),
    byDiagnosis: calcRehabRateByDiagnosis(targetDate),
    daily: calcDailyRehabRateForNewPatients(targetDate),
    bySymptom: calcRehabRateByDiagnosisToRehaSymptom(targetDate),
    byAgeSex: calcRehabRateByAgeAndSex(targetDate),
  };
  return jsonResponse({ success: true, report: report });
}

function getOrCreateReportFolder() {
  try {
    return DriveApp.getFolderById(CONFIG.JSON_FOLDER_ID);
  } catch (_e) {
    var root = DriveApp.getRootFolder();
    var iter = root.getFoldersByName("診療記録くん-レポート");
    if (iter.hasNext()) return iter.next();
    return root.createFolder("診療記録くん-レポート");
  }
}

function mainFlow() {
  return handleDailyReport(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));
}

function calcOverallRehabRateForNewPatients(_date) {
  var rows = getMasterRows_();
  var total = rows.length;
  var rehabTrue = rows.filter(function (r) {
    return r[10] === true;
  }).length;
  return {
    total: total,
    rehabTrue: rehabTrue,
    rate: total ? rehabTrue / total : 0,
  };
}

function calcRehabRateByDiagnosis(_date) {
  var rows = getMasterRows_();
  var map = {};
  rows.forEach(function (row) {
    var diagnosis = normalizeDiagnosis(row[4]);
    if (!diagnosis) return;
    if (!map[diagnosis]) map[diagnosis] = { total: 0, rehabTrue: 0 };
    map[diagnosis].total += 1;
    if (row[10] === true) map[diagnosis].rehabTrue += 1;
  });

  return Object.keys(map)
    .sort()
    .map(function (key) {
      var item = map[key];
      return {
        diagnosis: key,
        total: item.total,
        rehabTrue: item.rehabTrue,
        rate: item.total ? item.rehabTrue / item.total : 0,
      };
    });
}

function calcDailyRehabRateForNewPatients(date) {
  var rows = getMasterRows_();
  var target = String(date || "");
  var filtered = rows.filter(function (row) {
    return String(row[0] || "").slice(0, 10) === target;
  });
  var total = filtered.length;
  var rehabTrue = filtered.filter(function (r) {
    return r[10] === true;
  }).length;
  return { date: target, total: total, rehabTrue: rehabTrue, rate: total ? rehabTrue / total : 0 };
}

function calcRehabRateByDiagnosisToRehaSymptom(_date) {
  // Diagnosis別のrehab率と同義のため既存関数を再利用
  return calcRehabRateByDiagnosis(_date);
}

function calcRehabRateByAgeAndSex(_date) {
  var rows = getMasterRows_();
  var map = {};
  rows.forEach(function (row) {
    var age = Number(row[2]);
    var sex = normalizeSex(row[3]);
    var band = getAgeBand(age);
    var key = band + "|" + sex;
    if (!map[key]) {
      map[key] = { ageBand: band, sex: sex, total: 0, rehabTrue: 0 };
    }
    map[key].total += 1;
    if (row[10] === true) map[key].rehabTrue += 1;
  });

  return Object.keys(map)
    .map(function (k) {
      var item = map[k];
      return {
        ageBand: item.ageBand,
        sex: item.sex,
        total: item.total,
        rehabTrue: item.rehabTrue,
        rate: item.total ? item.rehabTrue / item.total : 0,
      };
    })
    .sort(function (a, b) {
      var ageOrder = ageBandSortKey(a.ageBand) - ageBandSortKey(b.ageBand);
      if (ageOrder !== 0) return ageOrder;
      return a.sex.localeCompare(b.sex);
    });
}

function normalizeDiagnosis(str) {
  return (str || "").toString().trim().replace(/\s+/g, " ");
}

function normalizeSex(str) {
  var s = (str || "").toString().trim();
  if (/^(男|男性)$/.test(s)) return "男性";
  if (/^(女|女性)$/.test(s)) return "女性";
  return "その他";
}

function getAgeBand(age) {
  if (isNaN(age) || age < 0) return "不明";
  var lower = Math.floor(age / 10) * 10;
  if (lower >= 90) return "90代+";
  return lower + "代";
}

function ageBandSortKey(label) {
  if (label === "不明") return 999;
  if (label === "90代+") return 90;
  var num = parseInt(label, 10);
  return isNaN(num) ? 999 : num;
}

function getMonthlySheetName(prefix) {
  var month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMM");
  return prefix + "_" + month;
}

function createDailyTrigger() {
  // atHour(14) は 14:00〜15:00 のどこかで実行される（分はランダム）。
  ScriptApp.newTrigger("mainFlow")
    .timeBased()
    .everyDays(1)
    .atHour(14)
    .create();
}

function simpleHash(str) {
  var s = String(str || "");
  var hash = 0;
  for (var i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
