import type { ExtractResult, RawPatient } from '../types';

export function extractPatientsFromDOM(): ExtractResult {
  // NOTE:
  // This function is injected via chrome.scripting.executeScript(func: ...).
  // Keep all helpers inside this function so it is self-contained at runtime.
  function normalizeGender(raw: unknown): string {
    const value = String(raw ?? '').trim();
    if (/^(男|男性|male)$/i.test(value)) return '男性';
    if (/^(女|女性|female)$/i.test(value)) return '女性';
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

  function looksLikePatientObject(item: unknown): boolean {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return 'age' in obj && 'gender' in obj;
  }

  function tryParsePatientsCandidate(text: string): ExtractResult | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      return null;
    }
    if (!Array.isArray(parsed)) return null;
    if (parsed.length === 0) return { success: false, error: '患者データが空です' };
    if (!parsed.every(looksLikePatientObject)) return null;
    return tryParsePatients(text);
  }

  function extractJsonArrayCandidates(text: string): string[] {
    const candidates: string[] = [];
    const source = text || '';
    let start = 0;

    while (start < source.length) {
      const arrayStart = source.indexOf('[', start);
      if (arrayStart === -1) break;

      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = arrayStart; i < source.length; i += 1) {
        const ch = source[i];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (ch === '\\') {
            escaped = true;
          } else if (ch === '"') {
            inString = false;
          }
          continue;
        }

        if (ch === '"') {
          inString = true;
          continue;
        }
        if (ch === '[') {
          depth += 1;
          continue;
        }
        if (ch === ']') {
          depth -= 1;
          if (depth === 0) {
            candidates.push(source.slice(arrayStart, i + 1));
            start = i + 1;
            break;
          }
        }
      }

      if (depth !== 0) break;
    }

    return candidates;
  }

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

  // Fallback for pages where JSON is rendered as plain text instead of pre/code blocks.
  const fallbackRoots = Array.from(
    document.querySelectorAll('[data-message-author-role="assistant"], article, main'),
  );
  for (let i = fallbackRoots.length - 1; i >= 0; i -= 1) {
    const text = fallbackRoots[i].textContent || '';
    const candidates = extractJsonArrayCandidates(text);
    for (let j = candidates.length - 1; j >= 0; j -= 1) {
      const result = tryParsePatientsCandidate(candidates[j]);
      if (result) return result;
    }
  }

  return { success: false, error: 'JSONが見つかりません' };
}
