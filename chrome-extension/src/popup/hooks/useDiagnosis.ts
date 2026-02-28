import { useCallback, useEffect, useState } from 'react';
import type { DiagnosisCount } from '../../types';

export function useDiagnosis(diagnosisMaster: string[]) {
  const [counts, setCounts] = useState<DiagnosisCount>({});

  useEffect(() => {
    chrome.storage.local.get('diagnosisCount').then((res: any) => {
      setCounts(res.diagnosisCount || {});
    });
  }, []);

  const top5 = diagnosisMaster
    .slice()
    .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    .slice(0, 5);

  const rest = diagnosisMaster.filter((name) => !top5.includes(name));

  const incrementCounts = useCallback(
    async (diagNames: string[]) => {
      const next = { ...counts };
      for (const name of diagNames) {
        const key = name.trim();
        if (!key) continue;
        next[key] = (next[key] || 0) + 1;
      }
      setCounts(next);
      await chrome.storage.local.set({ diagnosisCount: next });
    },
    [counts],
  );

  return { top5, rest, counts, incrementCounts };
}
