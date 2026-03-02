function assertTrue_(v, msg) {
  if (!v) throw new Error(msg || 'assertTrue failed');
}

function assertFalse_(v, msg) {
  if (v) throw new Error(msg || 'assertFalse failed');
}

function assertEquals_(a, b, msg) {
  if (a !== b) throw new Error((msg || 'assertEquals failed') + ': ' + a + ' !== ' + b);
}

function testValidation_diagnosis_required() {
  // Given
  const obj = {
    age: 40,
    gender: '男性',
    diagnoses: [''],
    rehab: true,
    remarks: '',
  };

  // When
  const res = validateAndNormalize(obj);

  // Then
  assertFalse_(res.valid, 'diagnoses[0] should be required');
}

function testValidation_normal_ok() {
  // Given
  const obj = {
    age: 40,
    gender: '男',
    diagnoses: ['腰痛'],
    rehab: true,
    remarks: '',
  };

  // When
  const res = validateAndNormalize(obj);

  // Then
  assertTrue_(res.valid, 'normal data should be valid');
  assertEquals_(res.normalized.gender, '男性', 'gender normalized');
  assertEquals_(res.normalized.diagnoses.length, 6, 'diagnosis padded to 6');
}

function testValidation_formula_injection_sanitized() {
  // Given
  const obj = {
    age: 42,
    gender: '女性',
    diagnoses: ['=SUM(1,1)', '+cmd'],
    rehab: false,
    remarks: '@malicious',
  };

  // When
  const res = validateAndNormalize(obj);

  // Then
  assertTrue_(res.valid, 'formula-like values should still be accepted after sanitization');
  assertEquals_(res.normalized.diagnoses[0].charAt(0), "'", 'diagnosis[0] must be escaped');
  assertEquals_(res.normalized.diagnoses[1].charAt(0), "'", 'diagnosis[1] must be escaped');
  assertEquals_(res.normalized.remarks.charAt(0), "'", 'remarks must be escaped');
}

function testValidation_invalid_object_guard() {
  // Given
  const obj = null;

  // When
  const res = validateAndNormalize(obj);

  // Then
  assertFalse_(res.valid, 'null object should be invalid');
}

function testVerifyRequestSecret_action_separation() {
  // Given
  const props = PropertiesService.getScriptProperties();
  props.setProperty('API_SECRET', 'api-secret-test');
  props.setProperty('EVIDENCE_SECRET', 'evidence-secret-test');

  // When
  const writeOk = verifyRequestSecret_({ action: 'recordBatch', secret: 'api-secret-test' });
  const evidenceNg = verifyRequestSecret_({ action: 'getEvidenceEvents', secret: 'api-secret-test' });
  const evidenceOk = verifyRequestSecret_({
    action: 'getEvidenceEvents',
    secret: 'evidence-secret-test',
  });

  // Then
  assertTrue_(writeOk.valid, 'recordBatch must use API_SECRET');
  assertFalse_(evidenceNg.valid, 'evidence action must reject API_SECRET');
  assertTrue_(evidenceOk.valid, 'evidence action must use EVIDENCE_SECRET');
}
