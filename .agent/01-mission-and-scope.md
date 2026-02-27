# 01 Mission And Scope

## ミッション

- Chrome 拡張（MV3）と GAS により、診療記録を安全に登録・集計する
- v5 仕様に対する差分ゼロを目標にする
- TDD（Red -> Green -> Refactor）と契約設計で品質を担保する

## 対象範囲（In Scope）

- `chrome-extension/` の実装と単体テスト
- `gas/` の実装とテスト関数
- secret 管理・重複抑止・日次集計・レポート生成
- SW 停止条件を前提とした状態管理

## 非対象（Out Of Scope）

- 医療判断ロジックそのもの
- 患者IDベースの完全重複排除
- 全DOM走査ベース抽出への回帰

## 実装原則

- セキュリティ優先: secret を URL へ露出しない
- 可観測性優先: 失敗ログと実行証跡を残す
- 互換性維持: 旧フロー互換の設定項目は保持する
- 副作用分離: 検証ロジックは純粋関数化する

## 成果物チェック

- [ ] `chrome-extension/manifest.json`
- [ ] `chrome-extension/content.js`
- [ ] `chrome-extension/popup.html`
- [ ] `chrome-extension/popup.js`
- [ ] `chrome-extension/sendRecord.js`
- [ ] `chrome-extension/__tests__/content.test.js`
- [ ] `chrome-extension/__tests__/popup.test.js`
- [ ] `chrome-extension/__tests__/sendRecord.test.js`
- [ ] `gas/Code.gs`
- [ ] `gas/Validation.gs`
- [ ] `gas/Code.test.gs`
