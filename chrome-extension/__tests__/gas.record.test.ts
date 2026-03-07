import { describe, expect, test } from 'vitest';
import { createGasContext } from './helpers/gasHarness';

function createRecordBody(overrides: Record<string, unknown> = {}) {
  return {
    action: 'record',
    doctorId: '12345',
    batchId: 'legacy-batch',
    clientRecordId: 'legacy-batch_0',
    timestamp: '2026-03-07T10:00:00',
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

describe('GAS legacy record compatibility contract', () => {
  test('record は recordBatch と同じ重複判定で skipped を返す', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);

    // When
    const first = JSON.parse(context.handleRecord(createRecordBody()).text);
    const second = JSON.parse(context.handleRecord(createRecordBody()).text);

    // Then
    expect(first).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(second).toMatchObject({ success: true, written: 0, skipped: 1 });
    expect(masterSheet.rows).toHaveLength(2);
  });

  test('record は clientRecordId未指定なら強いハッシュを生成して15列で書き込む', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);

    // When
    const result = JSON.parse(
      context.handleRecord(createRecordBody({ clientRecordId: '', batchId: '' })).text,
    );

    // Then
    expect(result).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(result.hash).toMatch(/^\d+$/);
    expect(masterSheet.rows[1]).toHaveLength(15);
    expect(String(masterSheet.rows[1][4])).toMatch(/^[0-9a-f]{64}$/);
  });

  test('record は doctorId必須とシートサニタイズを batch と同じ境界で扱う', () => {
    // Given
    const { context, masterSheet, getSheet } = createGasContext([new Array(15).fill('header')]);

    // When
    const invalid = JSON.parse(context.handleRecord(createRecordBody({ doctorId: '   ' })).text);
    const valid = JSON.parse(
      context.handleRecord(
        createRecordBody({
          doctorId: '=doctor',
          batchId: '@legacy',
          clientRecordId: '+legacy',
          timestamp: '-2026-03-07T10:00:00',
          answer: {
            age: 42,
            gender: 'female',
            diagnoses: ['腰痛'],
            rehab: true,
            remarks: '',
          },
        }),
      ).text,
    );
    const auditSheet = getSheet('AuditEvidence');

    // Then
    expect(invalid).toMatchObject({ success: false });
    expect(invalid.error).toContain('doctorId');
    expect(valid).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(masterSheet.rows[1][0]).toBe("'-2026-03-07T10:00:00");
    expect(masterSheet.rows[1][2]).toBe("'=doctor");
    expect(masterSheet.rows[1][3]).toBe("'@legacy");
    expect(masterSheet.rows[1][4]).toBe("'+legacy");
    expect(masterSheet.rows[1][6]).toBe('女性');
    expect(auditSheet?.rows[1][2]).toBe('record');
  });
});
