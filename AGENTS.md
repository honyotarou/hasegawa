# AGENTS.md - 診療記録くん v11 実行ガイド

このリポジトリは「診療記録くん（v11・確定版）」を漏れなく実装するための実行ドキュメントを管理する。

## 1. 必読順序

1. `AGENTS.md`
2. `.agent/spec.md`
3. `.agent/execution-plan.md`
4. `.agent/tdd-checklist.md`
5. `.agent/traceability.md`

## 2. 目的

整形外科クリニック向けに、次を実現する。

1. 電子カルテ一覧スクリーンショットから年齢/性別を抽出
2. Chrome拡張（React + TypeScript）で診断名/リハ有無を入力
3. GASへ `recordBatch` 送信してスプレッドシートへ追記
4. 日次14時台にGASで集計処理を実行

## 3. 実装の前提

1. Manifest V3
2. popup UI は React 18 + TypeScript + Vite
3. CSS Modules を使う
4. content script は TypeScriptのみ（React/外部モジュール不可）
5. GAS は JavaScript

## 4. 非交渉ルール

1. TDD順序を固定する（Red -> テストのみコミット -> Green -> 過剰適合チェック）。
2. Step1ではプロダクション実装を変更しない。
3. Step3ではテストを変更しない。
4. 各テストに Given/When/Then コメントを入れる。
5. 失敗系テスト数は正常系以上を目標にする。
6. 分岐網羅100%を目標にする。
7. 契約による設計（事前条件・事後条件・不変条件）を守る。

## 5. 重要不変条件

1. `diagnoses[0]`（主診断）は必須。
2. `rehab` は Boolean 必須（`null` 送信禁止）。
3. 年齢は `1..150` の整数必須（クライアント/サーバ二重防衛）。
4. 冪等性キーは `clientRecordId`（`batchId_index`）。
5. 重複判定は直近200件（ベストエフォート）。
6. `apiSecret` は `chrome.storage.session` 保管（再起動後再入力）。
7. `session AccessLevel` は変更しない（trusted-only維持）。

## 6. セキュリティ・運用要件

1. 画像には氏名/患者IDが写らないようにトリミング（院内規程順守）。
2. `doGet` は実装しない。`doPost` のみ。
3. 拡張権限は最小化（`tabs` permission 不使用）。
4. `minimum_chrome_version` は `105`。

## 7. 成果物ルート

1. `chrome-extension/`（Vite/React/TS一式）
2. `gas/`（`Code.gs`, `Validation.gs`, `Code.test.gs`）

詳細なファイル構成と仕様は `.agent/spec.md` を正とする。

## 8. 完了定義

1. `.agent/traceability.md` の全Req IDが「完了」または「実環境確認待ち」に分類済み。
2. Unit/UI test が全件PASS。
3. Step1失敗ログとStep3成功ログが残っている。
4. GASの15列構成を前提に `recordBatch` が実装されている。
5. 送信成功後のみ診断名カウントが更新される。

