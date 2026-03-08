import { describe, expect, test } from 'vitest';
import { createGasContext } from './helpers/gasHarness';

function createRecordBatchPostBody(overrides: Record<string, unknown> = {}) {
  return {
    secret: 'doctor-secret-12345',
    action: 'recordBatch',
    doctorId: '12345',
    batchId: 'batch-auth',
    records: [
      {
        clientRecordId: 'batch-auth_0',
        timestamp: '2026-03-08T10:00:00',
        age: 42,
        gender: '男性',
        diagnoses: ['腰痛'],
        rehab: true,
        remarks: '',
      },
    ],
    ...overrides,
  };
}

function createLegacyRecordPostBody(overrides: Record<string, unknown> = {}) {
  return {
    secret: 'doctor-secret-12345',
    action: 'record',
    doctorId: '12345',
    batchId: 'legacy-auth',
    clientRecordId: 'legacy-auth_0',
    timestamp: '2026-03-08T10:00:00',
    answer: {
      age: 42,
      gender: '男性',
      diagnoses: ['腰痛'],
      rehab: true,
      remarks: '',
    },
    ...overrides,
  };
}

function doPost(context: any, body: Record<string, unknown>) {
  return JSON.parse(
    context.doPost({
      postData: {
        contents: JSON.stringify(body),
      },
    }).text,
  );
}

describe('GAS auth contract', () => {
  test('DOCTOR_SECRET_MAP がある場合は doctorId ごとの secret hash で recordBatch を認証する', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);
    context.PropertiesService.getScriptProperties().setProperty(
      'DOCTOR_SECRET_MAP',
      JSON.stringify({
        '12345': context.strongHash_('doctor-secret-12345'),
      }),
    );

    // When
    const result = doPost(context, createRecordBatchPostBody());

    // Then
    expect(result).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(masterSheet.rows).toHaveLength(2);
  });

  test('DOCTOR_SECRET_MAP 設定後は shared API_SECRET では recordBatch を認証しない', () => {
    // Given
    const { context, masterSheet, getSheet } = createGasContext([new Array(15).fill('header')]);
    const props = context.PropertiesService.getScriptProperties();
    props.setProperty('API_SECRET', 'shared-secret');
    props.setProperty(
      'DOCTOR_SECRET_MAP',
      JSON.stringify({
        '12345': context.strongHash_('doctor-secret-12345'),
      }),
    );

    // When
    const result = doPost(
      context,
      createRecordBatchPostBody({
        secret: 'shared-secret',
      }),
    );
    const auditSheet = getSheet('AuditEvidence');

    // Then
    expect(result).toMatchObject({ success: false, error: '認証失敗' });
    expect(masterSheet.rows).toHaveLength(1);
    expect(auditSheet?.rows[1][3]).toBe('auth_error');
  });

  test('DOCTOR_SECRET_MAP は doctorId の組み合わせが違うと recordBatch を拒否する', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);
    context.PropertiesService.getScriptProperties().setProperty(
      'DOCTOR_SECRET_MAP',
      JSON.stringify({
        '12345': context.strongHash_('doctor-secret-12345'),
        '67890': context.strongHash_('doctor-secret-67890'),
      }),
    );

    // When
    const wrongSecret = doPost(
      context,
      createRecordBatchPostBody({
        secret: 'doctor-secret-67890',
      }),
    );
    const unknownDoctor = doPost(
      context,
      createRecordBatchPostBody({
        doctorId: '99999',
        secret: 'doctor-secret-12345',
      }),
    );

    // Then
    expect(wrongSecret).toMatchObject({ success: false, error: '認証失敗' });
    expect(unknownDoctor).toMatchObject({ success: false, error: '認証失敗' });
    expect(masterSheet.rows).toHaveLength(1);
  });

  test('DOCTOR_SECRET_MAP 未設定時だけ migration fallback の API_SECRET を許可する', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);
    context.PropertiesService.getScriptProperties().setProperty('API_SECRET', 'shared-secret');

    // When
    const result = doPost(
      context,
      createRecordBatchPostBody({
        secret: 'shared-secret',
      }),
    );

    // Then
    expect(result).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(masterSheet.rows).toHaveLength(2);
  });

  test('legacy record も DOCTOR_SECRET_MAP の doctorId ごとの認証境界を使う', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);
    context.PropertiesService.getScriptProperties().setProperty(
      'DOCTOR_SECRET_MAP',
      JSON.stringify({
        '12345': context.strongHash_('doctor-secret-12345'),
      }),
    );

    // When
    const ok = doPost(context, createLegacyRecordPostBody());
    const ng = doPost(
      context,
      createLegacyRecordPostBody({
        secret: 'wrong-secret',
      }),
    );

    // Then
    expect(ok).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(ng).toMatchObject({ success: false, error: '認証失敗' });
    expect(masterSheet.rows).toHaveLength(2);
  });
});
