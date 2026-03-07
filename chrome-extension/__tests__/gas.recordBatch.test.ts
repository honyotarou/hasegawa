import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

type SheetRange = {
  getValues: () => any[][];
  setValues: (values: any[][]) => void;
};

type FakeSheet = {
  rows: any[][];
  getLastRow: () => number;
  getRange: (row: number, col: number, numRows: number, numCols: number) => SheetRange;
};

function createFakeSheet(initialRows: any[][]): FakeSheet {
  const rows = initialRows.map((row) => [...row]);
  return {
    rows,
    getLastRow() {
      return rows.length;
    },
    getRange(row: number, col: number, numRows: number, numCols: number) {
      return {
        getValues() {
          const result: any[][] = [];
          for (let r = 0; r < numRows; r += 1) {
            const sourceRow = rows[row - 1 + r] || [];
            result.push(sourceRow.slice(col - 1, col - 1 + numCols));
          }
          return result;
        },
        setValues(values: any[][]) {
          values.forEach((valueRow, index) => {
            const rowIndex = row - 1 + index;
            if (!rows[rowIndex]) rows[rowIndex] = [];
            for (let c = 0; c < numCols; c += 1) {
              rows[rowIndex][col - 1 + c] = valueRow[c];
            }
          });
        },
      };
    },
  };
}

function createGasContext(sheetRows: any[][]) {
  const masterSheet = createFakeSheet(sheetRows);
  const scriptProperties = new Map<string, string>();
  const context = {
    console,
    JSON,
    Math,
    Date,
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key: string) {
            return scriptProperties.get(key) ?? null;
          },
          setProperty(key: string, value: string) {
            scriptProperties.set(key, value);
          },
          deleteProperty(key: string) {
            scriptProperties.delete(key);
          },
        };
      },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text: string) {
        return {
          text,
          mimeType: null as string | null,
          setMimeType(mimeType: string) {
            this.mimeType = mimeType;
            return this;
          },
        };
      },
    },
    SpreadsheetApp: {
      openById() {
        return {
          getSheetByName(name: string) {
            if (name === 'RehaTrueFalse') return masterSheet;
            return null;
          },
        };
      },
      flush() {},
    },
    LockService: {
      getScriptLock() {
        return {
          waitLock() {},
          releaseLock() {},
        };
      },
    },
    Session: {
      getScriptTimeZone() {
        return 'Asia/Tokyo';
      },
    },
    Utilities: {
      formatDate(date: Date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      },
      getUuid() {
        return 'uuid-fixed';
      },
    },
    Logger: {
      log() {},
    },
    DriveApp: {
      getFolderById() {
        return {};
      },
    },
    ScriptApp: {
      getProjectTriggers() {
        return [];
      },
      deleteTrigger() {},
      newTrigger() {
        return {
          timeBased() {
            return {
              everyDays() {
                return {
                  atHour() {
                    return {
                      create() {},
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
  };

  vm.createContext(context);
  const validationCode = fs.readFileSync(
    path.resolve(__dirname, '../../gas/Validation.gs'),
    'utf8',
  );
  const codeGs = fs.readFileSync(path.resolve(__dirname, '../../gas/Code.gs'), 'utf8');
  vm.runInContext(validationCode, context);
  vm.runInContext(codeGs, context);

  return {
    context: context as any,
    masterSheet,
  };
}

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
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
