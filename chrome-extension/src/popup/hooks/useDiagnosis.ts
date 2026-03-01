import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiagnosisCount } from '../../types';

export function useDiagnosis(diagnosisMaster: string[]) {
  const [counts, setCounts] = useState<DiagnosisCount>({});
  const countsRef = useRef<DiagnosisCount>({});

  useEffect(() => {
    chrome.storage.local
      .get('diagnosisCount')
      .then((res: any) => {
        const loaded = res.diagnosisCount || {};
        countsRef.current = loaded;
        setCounts(loaded);
      })
      .catch((err) => {
        console.error('Failed to load diagnosis counts:', err);
      });
  }, []);

  const top5 = diagnosisMaster
    .slice()
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    .slice(0, 5);

  const rest = diagnosisMaster.filter((name) => !top5.includes(name));

  const incrementCounts = useCallback(async (diagNames: string[]) => {
    const next = { ...countsRef.current };
    for (const name of diagNames) {
      const key = name.trim();
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
