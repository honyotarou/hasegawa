# Academic Trends (2024-2026) related to v11 implementation

## Scope
対象は「医療入力ワークフローの human-in-the-loop」「ブラウザ拡張のセキュリティ」「監査証跡の信頼性」に関連する近年研究。
最終確認日: 2026-03-03

## Trend 1: 医療文書入力は Human-in-the-loop 前提が継続
- 医療現場では自動化よりも、最終確認を人が担う運用設計が主流。
- Sources:
  - Ambient artificial intelligence scribes: utilization and impact on documentation time (JAMIA, 2025): https://pubmed.ncbi.nlm.nih.gov/39688515/
  - Enhancing clinical documentation with ambient artificial intelligence... (JAMIA Open, 2025): https://pubmed.ncbi.nlm.nih.gov/39991073/

Implication:
- v11の「確認画面を経由して送信」「必須項目ガード」は研究トレンドと整合。
- fully-automatic より、エラー時の再確認導線と責任分界の明確化が重要。

## Trend 2: 文書理解は OCR-only から VLMベースへ
- 画像/文書抽出はVLMでの構造理解が進み、OCR単体パイプラインから移行が進む。
- Sources:
  - PaddleOCR-VL (2025): https://arxiv.org/abs/2510.14528
  - MinerU2.5 (2025): https://arxiv.org/abs/2509.22186

Implication:
- `extractPatients` の抽出精度は将来VLM依存が強まる。
- UI側で「誤読訂正しやすい編集可能テーブル」を維持する方針は妥当。

## Trend 3: 拡張機能セキュリティは permission/API境界の設計が焦点
- MV3移行後も、API境界や権限設計ミスが主要リスクとして研究されている。
- Sources:
  - Arcanum: Symbolic, Constraint-Based, and Data-Flow Analyses of Browser Extensions at Scale (USENIX Security): https://www.usenix.org/conference/usenixsecurity24/presentation/liu-yuhang
  - Exploiting Browser Password Managers with False Sign-In Form Fields (USENIX Security): https://www.usenix.org/conference/usenixsecurity24/presentation/wang-xiaoyin

Implication:
- `API_SECRET` と `EVIDENCE_SECRET` の分離は least privilege 改善として有効。
- action単位で認証を分離し、監査ログ閲覧権限を送信権限から切り離す方向が妥当。

## Trend 4: 医療データの監査証跡は改ざん耐性が論点
- 医療記録の信頼性担保（integrity / traceability）を強調する研究が継続。
- Sources:
  - Blockchain-enabled EHR access auditing: Enhancing healthcare data security (Heliyon, 2024): https://pubmed.ncbi.nlm.nih.gov/39253236/
  - Assessment of the integrity of real-time electronic health record data used in clinical research (PLoS One, 2026): https://pubmed.ncbi.nlm.nih.gov/41511976/

Implication:
- 監査ログは「残す」だけでなく、表示系（Markdown同期）の注入耐性も必須。
- 今回の Markdown エスケープ実装は、監査証跡の表示整合性向上に寄与。
