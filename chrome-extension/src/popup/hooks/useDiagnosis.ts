import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiagnosisCount } from '../../types';

function normalizeDiagnosisCountKey(name: string): string {
  return name.trim().replace(/（(?:右|左)）$/, '').trim();
}

function normalizeDiagnosisCounts(source: DiagnosisCount): DiagnosisCount {
  const next: DiagnosisCount = {};
  for (const [name, count] of Object.entries(source || {})) {
    const key = normalizeDiagnosisCountKey(name);
    if (!key) continue;
    next[key] = (next[key] || 0) + count;
  }
  return next;
}

export function useDiagnosis(diagnosisMaster: string[]) {
  const [counts, setCounts] = useState<DiagnosisCount>({});
  const countsRef = useRef<DiagnosisCount>({});

  useEffect(() => {
    chrome.storage.local
      .get('diagnosisCount')
      .then((res: any) => {
        const loaded = normalizeDiagnosisCounts(res.diagnosisCount || {});
        countsRef.current = loaded;
        setCounts(loaded);
      })
      .catch((err) => {
        console.error('Failed to load diagnosis counts:', err);
      });
  }, []);

  const top5 = useMemo(() => {
    return diagnosisMaster
      .slice()
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 5);
  }, [diagnosisMaster, counts]);

  const rest = useMemo(() => {
    return diagnosisMaster.filter((name) => !top5.includes(name));
  }, [diagnosisMaster, top5]);

  const incrementCounts = useCallback(async (diagNames: string[]) => {
    const next = { ...countsRef.current };
    for (const name of diagNames) {
      const key = normalizeDiagnosisCountKey(name);
      if (!key) continue;
      next[key] = (next[key] || 0) + 1;
    }
    countsRef.current = next;
    setCounts(next);
    try {
      await chrome.storage.local.set({ diagnosisCount: next });
    } catch (err) {
      console.error('Failed to persist diagnosis counts:', err);
    }
  }, []);

  return { top5, rest, counts, incrementCounts };
}
