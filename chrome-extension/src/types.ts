export type RawPatient = {
  age: number;
  gender: string;
};

export type Patient = {
  age: number;
  gender: string;
  diagnoses: string[];
  rehab: boolean | null;
  remarks: string;
};

export type Screen = 'SETUP' | 'MAIN' | 'CONFIRM' | 'DONE' | 'SETTINGS';

export type Mode = 'prod' | 'dev';

export type AppSettings = {
  gasUrlProd: string;
  gasUrlDev: string;
  doctorId: string;
  diagnosisMaster: string[];
};

export type DiagnosisCount = Record<string, number>;

export type SubmitResult = {
  written: number;
  skipped: number;
  submittedAt: string;
  batchId: string;
};

export type AppState = {
  screen: Screen;
  patients: Patient[];
  currentBatchId: string | null;
  mode: Mode;
  selectedDate: string;
  submitError: string | null;
  isSubmitting: boolean;
  lastSubmitResult: SubmitResult | null;
};

export type SessionSnapshot = {
  batchId: string;
  patients: Patient[];
  selectedDate: string;
  mode: Mode;
};

export type BatchRecord = {
  clientRecordId: string;
  timestamp: string;
  age: number;
  gender: string;
  diagnoses: string[];
  rehab: boolean;
  remarks: string;
};

export type BatchPayload = {
  secret: string;
  action: 'recordBatch';
  doctorId: string;
  batchId: string;
  records: BatchRecord[];
};

export type ExtractResult =
  | { success: true; patients: RawPatient[] }
  | { success: false; error: string };

export type GasResponse =
  | { success: true; written: number; skipped: number }
  | { success: false; error: string };
