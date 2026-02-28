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
