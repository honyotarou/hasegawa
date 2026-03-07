import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

type SheetRange = {
  getValues: () => any[][];
  setValues: (values: any[][]) => void;
};

type FakeSheet = {
  rows: any[][];
  getLastRow: () => number;
  getRange: (row: number, col: number, numRows: number, numCols: number) => SheetRange;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function createGasContext(sheetRows: any[][]) {
  const masterSheet = createFakeSheet(sheetRows);
  const sheets: Record<string, FakeSheet> = {
    RehaTrueFalse: masterSheet,
  };
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
            return sheets[name] || null;
          },
          insertSheet(name: string) {
            const sheet = createFakeSheet([]);
            sheets[name] = sheet;
            return sheet;
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
      formatDate(date: Date, _timezone?: string, format?: string) {
        if (format === 'yyyy-MM-dd') return date.toISOString().slice(0, 10);
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
    path.resolve(__dirname, '../../../gas/Validation.gs'),
    'utf8',
  );
  const codeGs = fs.readFileSync(path.resolve(__dirname, '../../../gas/Code.gs'), 'utf8');
  vm.runInContext(validationCode, context);
  vm.runInContext(codeGs, context);

  return {
    context: context as any,
    masterSheet,
    getSheet(name: string) {
      return sheets[name] || null;
    },
  };
}
