# Academic Trends (2024-2026) related to v11 implementation

最終確認日: 2026-03-08

## Scope
対象は次の3領域。
- clinical documentation workflow の human-in-the-loop 設計
- browser extension の security / privacy 設計
- document parsing と EHR audit integrity

## Trend 1: 臨床文書入力は「完全自動化」より human-in-the-loop 強化が主流
- Sources:
  - Ambient artificial intelligence scribes: utilization and impact on documentation time, burnout, and cognitive load in ambulatory care. JAMIA, 2025.
    - https://pubmed.ncbi.nlm.nih.gov/39688515/
  - Enhancing clinical documentation with ambient artificial intelligence: a quality improvement initiative at an urban academic safety net institution. JAMIA Open, 2025.
    - https://pubmed.ncbi.nlm.nih.gov/39991073/
- Inference:
  - 近年の論点は「AIが全部書く」より、documentation time と cognitive load を下げつつ、人が最終確認する設計へ寄っている。
  - v11 の Confirm 画面、必須入力ガード、送信前レビューはこの方向と整合する。

## Trend 2: ブラウザ拡張の主要論点は、権限の最小化だけでなく開発者運用まで含めた security practice へ移っている
- Sources:
  - Arcanum Dynamic Taint Tracking for Browser Extensions. USENIX Security 2024.
    - https://www.usenix.org/conference/usenixsecurity24/presentation/liu-yuhang
  - Lessons from the Chrome Web Store: Developer Mindsets and Practices for Secure and Private Browser Extensions. USENIX Security 2025.
    - https://www.usenix.org/conference/usenixsecurity25/presentation/pauli
- Inference:
  - 拡張機能の安全性は API 境界だけでは閉じず、manifest 設計、権限最小化、secret 運用、開発者の誤設定耐性まで含めて評価される。
  - 本 repo の `activeTab` 採用、固定 host permission、`storage.session` での secret 保持は良いが、shared secret 運用はまだ改善余地がある。

## Trend 3: 文書抽出は OCR-only から軽量 VLM を使った構造理解へ寄っている
- Sources:
  - MinerU2.5: A Decoupled Vision-Language Model for Efficient High-Resolution Document Parsing. arXiv, 2025.
    - https://arxiv.org/abs/2509.22186
  - PaddleOCR-VL: Boosting Multilingual Document Parsing via a 0.9B Ultra-Compact Vision-Language Model. arXiv, 2026.
    - https://arxiv.org/abs/2601.21957
- Inference:
  - 画像や複雑なレイアウトの抽出は、軽量でも layout-aware な VLM が中心になりつつある。
  - ただし clinical workflow では抽出精度だけでなく訂正容易性が重要なので、v11 の「抽出後に編集できるテーブルUI」は今でも妥当。

## Trend 4: EHR の監査と整合性は、保存するだけでなく integrity の担保が重視されている
- Sources:
  - Blockchain-enabled EHR access auditing: Enhancing healthcare data security. Heliyon, 2024.
    - https://pubmed.ncbi.nlm.nih.gov/39253236/
  - Assessment of the integrity of real-time electronic health record data used in clinical research. PLoS One, 2026.
    - https://pubmed.ncbi.nlm.nih.gov/41511976/
- Inference:
  - 監査ログは「ある」だけでは足りず、改ざん耐性、整合性、再現可能性が論点になっている。
  - 本 repo では audit sheet と evidence sync が整ってきた一方、shared secret による doctorId 自称問題は監査真正性の観点で今後の課題。

## What This Means for v11
1. Confirm 画面と入力ガードは維持すべきで、削る方向ではない
2. 画像抽出精度向上を狙うなら、将来は content script 抽出を VLM 前提に置き換える余地がある
3. 監査ログは件数取得だけでなく、利用者真正性と rotation 運用まで含めて設計する必要がある
