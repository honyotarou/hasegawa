# 診療記録くん UX再設計計画（Risk-First）

最終更新: 2026-03-03  
対象: Chrome拡張 popup（Setup/Main/Confirm/Done/Settings）  
方針: 実装は行わず、設計と検証計画のみ定義する

## 1. 再設計の狙い
1. 無難な入力UIから、責任とリスクを扱う業務UIへ転換する。  
2. 「入力のしやすさ」だけでなく「誤送信しにくさ」と「追跡可能性」を主目的に置く。  
3. 医師が短時間で判断し、監査担当が後追い検証できる情報構造にする。  

## 2. デザイン原則（SHIG観点の適用）
1. シンプルにする: 1画面1目的、主アクションは1つ。  
2. 簡単にする: 迷う分岐を減らし、未解決項目へ自動誘導する。  
3. 主導権を渡す: 戻る、取り消し、再送を常に可能にする。  
4. 制約で守る: 入力不備は事前にブロックし、危険操作の余地を減らす。  
5. 情報の優先順位を固定する: 「リスク件数 > 進捗 > 見栄え」。  

## 3. 成功指標（リリース後に観測するKPI）
1. 送信完了までの中央値: 120秒以内。  
2. 送信時バリデーションエラー率: 3%未満。  
3. 再送成功率: 99%以上。  
4. 監査追跡可能率（doctorId/batchId/clientRecordIdが揃う率）: 100%。  
5. 未入力のままConfirm遷移するケース: 0%。  

## 4. 画面別ワイヤー仕様

### 4.1 Setup Screen
| 項目 | 仕様 |
|---|---|
| 目的 | 初期設定と責務境界の明確化 |
| 主アクション | `設定を保存して始める` |
| 入力項目 | GAS URL（本番）, GAS URL（開発 任意）, API_SECRET, doctorId, 診断名マスタ |
| 補助情報 | `API_SECRET` と `EVIDENCE_SECRET` は用途が異なることを明示 |
| 必須制約 | 本番URL/secret/doctorId/診断名1件以上が未入力なら保存不可 |
| 失敗時表示 | 「原因 + 次アクション」を1行で表示（例: URLはGoogle Apps ScriptのHTTPS URLを入力） |
| 完了条件 | 保存成功でMainへ遷移 |

### 4.2 Main Screen（入力）
| 項目 | 仕様 |
|---|---|
| 目的 | 患者データ編集と未解決リスクの解消 |
| 主アクション | `全件送信（N件）`（条件を満たすまでdisabled） |
| 第1指標 | `未解決リスク件数`（rehab未選択 + 診断未入力 + age異常） |
| 第2指標 | 全件数、選択日、モード |
| 表構造 | No, 年齢, 性別, 診断名, rehab |
| 行状態 | `normal`, `pending`, `error` を視覚差分で明示 |
| ジャンプ導線 | `次の未解決へ` で最初の `data-pending=true` 行へスクロール |
| 入力制約 | ageは1〜150整数、diagnoses[0]必須、rehab必須 |
| モード表示 | gasUrlDevが空ならトグル非表示 |
| 取得導線 | `ChatGPTから取得` 実行で batchId再生成・行差し替え |

### 4.3 Confirm Screen（意思決定）
| 項目 | 仕様 |
|---|---|
| 目的 | 送信前の責任確認と監査可能性の確保 |
| 主アクション | `送信する` |
| 二次アクション | `戻って修正` |
| 必須表示 | 合計件数, rehab内訳, doctorId, 選択日, batchId短縮表示 |
| 判定表示 | 送信可否と阻害条件（URL不正/secret未設定等） |
| 送信中 | ボタン文言を `送信中...` に変更し二度押し防止 |
| 成功時 | Doneへ遷移し `written/skipped/submittedAt/batchId` を保存 |
| 失敗時 | 同画面に留まり再送可能、batchIdは保持 |

### 4.4 Done Screen（完了）
| 項目 | 仕様 |
|---|---|
| 目的 | 送信結果の確定表示と次行動の提示 |
| 主アクション | `ChatGPTから取得` |
| 必須表示 | `written`, `skipped`, `submittedAt`, `batchId`短縮 |
| 注意表示 | `skipped>0` の場合に重複スキップ注意文を表示 |
| 完了後処理 | inputSnapshot/currentBatchIdをsessionから削除 |

### 4.5 Settings Screen
| 項目 | 仕様 |
|---|---|
| 目的 | 運用変更（URL/secret/doctorId/診断マスタ）の安全更新 |
| 主アクション | `保存` |
| セキュリティ文言 | API_SECRETは再起動後に消える仕様を明記 |
| 運用文言 | 誤送信時の対処、secretローテ手順を固定表示 |
| 制約 | Setupと同じバリデーションを適用 |

## 5. 状態遷移設計
1. 起動時: `isConfigured=false` なら Setup、trueなら Main。  
2. Main: `canSubmit=true` のときのみ Confirmへ遷移。  
3. Confirm: 成功時 Done、失敗時 Confirm維持。  
4. Done: `ChatGPTから取得` で Mainへ戻り新batch開始。  
5. 任意画面: Settingsへ遷移し、保存後 Mainへ復帰。  

## 6. 文言設計ルール
1. 口語や抽象語を避ける。  
2. エラーは `原因 / 影響 / 次アクション` の順で短文化する。  
3. secret関連は必ず正式語彙で統一する。  
4. `API_SECRET` と `EVIDENCE_SECRET` を混同させない。  

## 7. テスト計画（実装前定義）
1. Unit: `canSubmit` 条件の全分岐（age, diag, rehab, patients empty）。  
2. Unit: `sendBatch` のURL/secret/doctorIdトリムと禁止URL拒否。  
3. Unit: `extractPatients` の優先順・末尾優先・壊れJSON遷移。  
4. E2E: Setup必須エラー、本番URL保存、Main→Confirm→Done、再送導線。  
5. E2E: 未解決項目がある間は送信不可。  
6. E2E: タイムアウト後の再送（同一batchId維持）。  

## 8. 実装フェーズ計画（次段階）
1. Phase A: 文言・情報優先順位の反映（UI構造は維持）。  
2. Phase B: Mainのリスク指標表示と未解決ジャンプ強化。  
3. Phase C: Confirmの責任情報表示と送信ゲート明確化。  
4. Phase D: Doneの監査表示強化。  
5. Phase E: 回帰テストと実環境スモーク。  

### 8.1 実行状況（2026-03-03）
1. Phase A: 完了
2. Phase B: 完了
3. Phase C: 完了
4. Phase D: 完了
5. Phase E: 自動ゲート完了（unit/e2e/coverage/bench/build）、実環境スモークは手動確認待ち

## 9. リリース判定条件
1. 自動ゲート: unit/e2e/coverage/bench/build がすべて通る。  
2. 手動ゲート: 本番GAS送信、実ChatGPT抽出、運用証跡入力が完了する。  
3. タグゲート: preflightログを保存し、リリースタグを固定する。  
