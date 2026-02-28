import type { ExtractResult, RawPatient } from '../types';

function normalizeGender(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (/^(男|男性)$/.test(value)) return '男性';
  if (/^(女|女性)$/.test(value)) return '女性';
  return 'その他';
}

function validateAge(age: unknown): age is number {
  return typeof age === 'number' && Number.isInteger(age) && age >= 1 && age <= 150;
}

function tryParsePatients(text: string): ExtractResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  if (parsed.length === 0) {
    return { success: false, error: '患者データが空です' };
  }

  const patients: RawPatient[] = [];
  for (const item of parsed) {
    const age = (item as any)?.age;
    if (!validateAge(age)) {
      return { success: false, error: `不正なage: ${age}` };
    }

    patients.push({
      age,
      gender: normalizeGender((item as any)?.gender),
    });
  }

  return { success: true, patients };
}

export function extractPatientsFromDOM(): ExtractResult {
  const groups: NodeListOf<Element>[] = [
    document.querySelectorAll('pre > code'),
    document.querySelectorAll('code:not(pre > code)'),
    document.querySelectorAll('pre:not(:has(code))'),
  ];

  for (const group of groups) {
    for (let i = group.length - 1; i >= 0; i -= 1) {
      const text = group[i].textContent || '';
      const result = tryParsePatients(text);
      if (result) {
        return result;
      }
    }
  }

  return { success: false, error: 'JSONが見つかりません' };
}
