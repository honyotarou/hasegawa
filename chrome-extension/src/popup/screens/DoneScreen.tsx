import React from 'react';
import type { SubmitResult } from '../../types';

type DoneScreenProps = {
  result: SubmitResult | null;
  dispatch: React.Dispatch<any>;
};

export function DoneScreen({ result }: DoneScreenProps) {
  return (
    <section>
      <div>✅</div>
      <div>{result ? `${result.written}件を送信しました` : '送信完了'}</div>
      {result && result.skipped > 0 ? (
        <div>※ {result.skipped}件は重複のためスキップされました</div>
      ) : null}
      <div>次の患者リストを取得するには「ChatGPTから取得」を押してください</div>
      <div>
        {result?.submittedAt} batchId: {result?.batchId?.slice(0, 8)}...
      </div>
    </section>
  );
}
