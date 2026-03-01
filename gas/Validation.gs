function validateAndNormalize(obj) {
  if (!obj || typeof obj !== 'object') {
    return { valid: false, error: '入力オブジェクトが不正です', normalized: null };
  }

  if (
    typeof obj.age !== 'number' ||
    !Number.isInteger(obj.age) ||
    obj.age < 1 ||
    obj.age > 150
  ) {
    return { valid: false, error: 'age は1〜150の整数であること', normalized: null };
  }

  if (typeof obj.rehab !== 'boolean') {
    return { valid: false, error: 'rehab は Boolean であること', normalized: null };
  }

  if (!Array.isArray(obj.diagnoses)) {
    return { valid: false, error: 'diagnoses は配列であること', normalized: null };
  }

  if (!obj.diagnoses[0] || !obj.diagnoses[0].toString().trim()) {
    return { valid: false, error: 'diagnoses[0]（主診断）は必須です', normalized: null };
  }

  const gender = normalizeGender(obj.gender);
  let diag = obj.diagnoses.map(function (d) {
    return (d || '').toString().slice(0, 100);
  });
  while (diag.length < 6) diag.push('');
  diag = diag.slice(0, 6);

  return {
    valid: true,
    error: null,
    normalized: {
      age: obj.age,
      gender: gender,
      diagnoses: diag,
      rehab: obj.rehab,
      remarks: (obj.remarks || '').toString().slice(0, 200),
    },
  };
}

function normalizeGender(str) {
  const s = (str || '').toString().trim();
  if (/^(男|男性)$/.test(s)) return '男性';
  if (/^(女|女性)$/.test(s)) return '女性';
  return 'その他';
}
