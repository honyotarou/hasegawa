const DOCTOR_ID_PATTERN = /^(?:[A-Za-z0-9_-]{3,32}|[=+\-@][A-Za-z0-9_-]{2,31})$/;

export const DOCTOR_ID_REQUIRED_ERROR = '社員番号は必須です';
export const DOCTOR_ID_FORMAT_ERROR =
  '社員番号（医師ID）は英数字・ハイフン・アンダースコアのみ3〜32文字で入力してください';

export function normalizeDoctorId(value: unknown): string {
  return String(value ?? '').trim();
}

export function getDoctorIdError(value: unknown): string | null {
  const doctorId = normalizeDoctorId(value);
  if (!doctorId) return DOCTOR_ID_REQUIRED_ERROR;
  if (!DOCTOR_ID_PATTERN.test(doctorId)) return DOCTOR_ID_FORMAT_ERROR;
  return null;
}

export function isDoctorIdValid(value: unknown): boolean {
  return getDoctorIdError(value) === null;
}
