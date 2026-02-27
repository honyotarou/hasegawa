# Refactor / Overfitting Check (Step 4)

## 結果

過剰適合の主なリスクを確認し、以下を満たすことを確認した。

1. 固定値に依存した実装を避け、入力値（URL/date/mode/batchId）で動作する。
2. content抽出は複数候補を順次評価し、壊れたJSON時に次候補へフォールバックする。
3. sendRecordはHTTP失敗・業務失敗・network・timeoutを分岐して扱う。
4. popup送信フローは状態遷移（MAIN/CONFIRM/DONE）を明示し、失敗時にbatchIdを保持する。

## 追加修正

- `content.js` の候補探索を `pre>code` 失敗時に `code` / `pre` へ遷移するよう修正。

