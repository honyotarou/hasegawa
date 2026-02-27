function assertTrue_(value, message) {
  if (!value) throw new Error(message || "assertTrue failed");
}

function assertFalse_(value, message) {
  if (value) throw new Error(message || "assertFalse failed");
}

function assertEquals_(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || "assertEquals failed") + " actual=" + actual + " expected=" + expected);
  }
}

function baseValidObj_() {
  return {
    age: 40,
    gender: "男性",
    diagnoses: ["腰痛"],
    rehab: true,
    remarks: "",
  };
}

function testValidation_normal_ok() {
  // Given
  var obj = baseValidObj_();
  // When
  var res = validateAndNormalize(obj);
  // Then
  assertTrue_(res.valid, "normal should be valid");
}

function testValidation_age_range_and_integer() {
  // Given
  var a = baseValidObj_();
  var b = baseValidObj_();
  var c = baseValidObj_();
  a.age = 0;
  b.age = 150;
  c.age = 1.5;
  // When
  var ra = validateAndNormalize(a);
  var rb = validateAndNormalize(b);
  var rc = validateAndNormalize(c);
  // Then
  assertFalse_(ra.valid, "age 0 should be invalid");
  assertTrue_(rb.valid, "age 150 should be valid");
  assertFalse_(rc.valid, "decimal age should be invalid");
}

function testValidation_rehab_and_diagnoses_type() {
  // Given
  var a = baseValidObj_();
  var b = baseValidObj_();
  a.rehab = null;
  b.diagnoses = "腰痛";
  // When
  var ra = validateAndNormalize(a);
  var rb = validateAndNormalize(b);
  // Then
  assertFalse_(ra.valid, "rehab null should be invalid");
  assertFalse_(rb.valid, "diagnoses string should be invalid");
}

function testValidation_gender_and_diagnoses_length() {
  // Given
  var a = baseValidObj_();
  var b = baseValidObj_();
  a.gender = "男";
  b.gender = "X";
  b.diagnoses = ["a", "b", "c", "d", "e", "f", "g"];
  // When
  var ra = validateAndNormalize(a);
  var rb = validateAndNormalize(b);
  // Then
  assertEquals_(ra.normalized.gender, "男性", "男 should normalize to 男性");
  assertEquals_(rb.normalized.gender, "その他", "unknown should normalize to その他");
  assertEquals_(rb.normalized.diagnoses.length, 6, "diagnoses should be trimmed to 6");
}

function testNormalizeGender_cases() {
  // Given / When
  var male = normalizeGender("男");
  var female = normalizeGender("女性");
  var other = normalizeGender("female");
  // Then
  assertEquals_(male, "男性");
  assertEquals_(female, "女性");
  assertEquals_(other, "その他");
}
