import { describe, expect, test } from 'vitest';
import { createGasContext } from './helpers/gasHarness';

function createBatchBody(overrides: Record<string, unknown> = {}) {
  const baseRecord = {
    clientRecordId: 'batch-1_0',
    timestamp: '2026-03-07T10:00:00',
    age: 42,
    gender: '男性',
    diagnoses: ['腰痛'],
    rehab: true,
    remarks: '',
  };

  return {
    secret: 'api-secret',
    action: 'recordBatch',
    doctorId: '12345',
    batchId: 'batch-1',
    records: [baseRecord],
    ...overrides,
  };
}

describe('GAS recordBatch contract', () => {
  test('doctorId/batchId/clientRecordId不足はエラーになる', () => {
    // Given
    const { context } = createGasContext([new Array(15).fill('header')]);
    const baseRecord = createBatchBody().records[0];

    // When
    const noDoctor = JSON.parse(context.handleRecordBatch(createBatchBody({ doctorId: '' })).text);
    const noBatch = JSON.parse(context.handleRecordBatch(createBatchBody({ batchId: '' })).text);
    const noClientRecordId = JSON.parse(
      context.handleRecordBatch(
        createBatchBody({
          records: [{ ...baseRecord, clientRecordId: '' }],
        }),
      ).text,
    );

    // Then
    expect(noDoctor).toMatchObject({ success: false });
    expect(noDoctor.error).toContain('doctorId');
    expect(noBatch).toMatchObject({ success: false });
    expect(noBatch.error).toContain('batchId');
    expect(noClientRecordId).toMatchObject({ success: false });
    expect(noClientRecordId.error).toContain('clientRecordId');
  });

  test('doctorId/batchId/clientRecordIdが空白だけならエラーになる', () => {
    // Given
    const { context } = createGasContext([new Array(15).fill('header')]);
    const baseRecord = createBatchBody().records[0];

    // When
    const blankDoctor = JSON.parse(context.handleRecordBatch(createBatchBody({ doctorId: '   ' })).text);
    const blankBatch = JSON.parse(context.handleRecordBatch(createBatchBody({ batchId: '   ' })).text);
    const blankClientRecordId = JSON.parse(
      context.handleRecordBatch(
        createBatchBody({
          records: [{ ...baseRecord, clientRecordId: '   ' }],
        }),
      ).text,
    );

    // Then
    expect(blankDoctor).toMatchObject({ success: false });
    expect(blankDoctor.error).toContain('doctorId');
    expect(blankBatch).toMatchObject({ success: false });
    expect(blankBatch.error).toContain('batchId');
    expect(blankClientRecordId).toMatchObject({ success: false });
    expect(blankClientRecordId.error).toContain('clientRecordId');
  });

  test('同一clientRecordId再送はskippedになり15列で書き込まれる', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);
    const existingHash = String(context.simpleHash('batch-1_0'));
    const existing = [
      '2026-03-07T09:00:00',
      existingHash,
      '12345',
      'batch-1',
      'batch-1_0',
      42,
      '男性',
      '腰痛',
      '',
      '',
      '',
      '',
      '',
      true,
      '',
    ];
    masterSheet.rows.push(existing);

    // When
    const response = JSON.parse(context.handleRecordBatch(createBatchBody()).text);

    // Then
    expect(response).toMatchObject({ success: true, written: 0, skipped: 1 });
    expect(masterSheet.rows).toHaveLength(2);
    expect(masterSheet.rows[1]).toHaveLength(15);
  });

  test('新規recordBatchは15列で1行追記する', () => {
    // Given
    const { context, masterSheet } = createGasContext([new Array(15).fill('header')]);

    // When
    const response = JSON.parse(context.handleRecordBatch(createBatchBody()).text);

    // Then
    expect(response).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(masterSheet.rows).toHaveLength(2);
    expect(masterSheet.rows[1]).toHaveLength(15);
    expect(masterSheet.rows[1][4]).toBe('batch-1_0');
  });

  test('recordBatchはシート書き込み前にdoctorId/batchId/clientRecordId/timestampをサニタイズする', () => {
    // Given
    const { context, masterSheet, getSheet } = createGasContext([new Array(15).fill('header')]);

    // When
    const response = JSON.parse(
      context.handleRecordBatch(
        createBatchBody({
          doctorId: '=doctor',
          batchId: '@batch',
          records: [
            {
              ...createBatchBody().records[0],
              clientRecordId: '+client',
              timestamp: '-2026-03-07T10:00:00',
            },
          ],
        }),
      ).text,
    );
    const auditSheet = getSheet('AuditEvidence');

    // Then
    expect(response).toMatchObject({ success: true, written: 1, skipped: 0 });
    expect(masterSheet.rows[1][0]).toBe("'-2026-03-07T10:00:00");
    expect(masterSheet.rows[1][2]).toBe("'=doctor");
    expect(masterSheet.rows[1][3]).toBe("'@batch");
    expect(masterSheet.rows[1][4]).toBe("'+client");
    expect(auditSheet?.rows[1][4]).toBe("'=doctor");
    expect(auditSheet?.rows[1][5]).toBe("'@batch");
  });
});
