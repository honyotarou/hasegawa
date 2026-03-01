# Academic Trends (2024-2026) related to v11 implementation

## Scope
対象は「画像/文書から構造化データ抽出」「人手確認を伴う医療文書入力」「実運用での堅牢化」に関連する近年研究。
最終確認日: 2026-03-01

## Trend 1: OCR-only から VLMベース文書理解へのシフト
- Recent work emphasizes end-to-end visual-language extraction rather than classic OCR + rules.
- Examples:
  - PaddleOCR-VL (2025): compact VLM for multilingual document parsing.
    - https://arxiv.org/abs/2408.14539
  - MinerU2.5 (2025): decoupled high-resolution parsing approach for document intelligence.
    - https://arxiv.org/abs/2509.22186

Implication for this project:
- `extractPatients` は現在 JSONブロック抽出に依存。将来的には「OCR出力信頼度」や「候補複数提示」を扱えるUIに進化余地。
- 2025後半には RL ベース OCR 改善（unit-test reward）研究が進んでおり、テーブル/多段レイアウトへの耐性強化がトレンド。
  - olmOCR 2 (2025): https://huggingface.co/papers/2510.19817

## Trend 2: Multimodal OCR/recognition 全体の再整理
- Surveys indicate rapid convergence of text detection + recognition + reasoning into unified multimodal models.
- Example:
  - Multi-modal LLMs for text detection and recognition: A survey (2024).
    - https://arxiv.org/abs/2412.01534

Implication:
- clinic workflowでは、LLM出力に誤読が混在する前提で「編集可能UI」「必須入力ガード」は妥当な設計。
- OCR-free document understanding (CVPRW 2025) では、少量データ適応の改善が進展。
  - QID (CVPRW 2025): https://openaccess.thecvf.com/content/CVPR2025W/MULA2025/html/Le_QID_Efficient_Query-Informed_ViTs_in_Data-Scarce_Regimes_for_OCR-free_Document_CVPRW_2025_paper.html

## Trend 3: 医療領域では Human-in-the-loop 継続が主流
- 医療AIの現場適用では、人間の最終確認・修正工程が安全性の中核。
- Example (human factors in health AI context):
  - JAMIA 2024 (PubMed): Human factors & implementation focus for AI-enabled healthcare workflows.
    - https://pubmed.ncbi.nlm.nih.gov/39191626/

Implication:
- v11の確認画面（CONFIRM）と必須入力チェックは、研究潮流に沿う。
- 2025年レビューでも「実運用でのワークフロー整合」「人間中心設計」が主要論点として継続。
  - PubMed review (2025): https://pubmed.ncbi.nlm.nih.gov/41247638/

## Trend 4: 運用堅牢性（再送・冪等性・監査性）重視
- 実サービス文脈ではモデル精度だけでなく、再送制御・追跡可能性・監査証跡を含むシステム設計が重視される。

Implication:
- `batchId + clientRecordId` の冪等設計、15列監査情報（doctorId/batchId/clientRecordId）は実運用トレンドと整合。
