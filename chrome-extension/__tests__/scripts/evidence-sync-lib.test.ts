import { describe, expect, test } from 'vitest';
import {
  renderAuditTable,
  replaceMarkdownSection,
  syncEvidenceRegisterContent,
} from '../../scripts/evidence-sync-lib.mjs';

describe('evidence-sync-lib', () => {
  test('イベントが空の場合はAUDITテンプレート行を返す', () => {
    // Given
    const events: any[] = [];

    // When
    const result = renderAuditTable(events);

    // Then
    expect(result).toContain('| Date | 項目 | 実施者 | 証跡ID | 判定 |');
    expect(result).toContain('| YYYY-MM-DD | 週次ログレビュー |  |  |  |');
  });

  test('イベント一覧から監査テーブル行を生成する', () => {
    // Given
    const events = [
      {
        timestamp: '2026-03-02 11:22:33',
        action: 'recordBatch',
        status: 'success',
        doctorId: '12345',
        eventId: 'evt-1',
      },
      {
        timestamp: '2026-03-02 11:23:33',
        action: 'recordBatch',
        status: 'error',
        doctorId: '12345',
        eventId: 'evt-2',
        error: 'recordsが空配列です',
      },
    ];

    // When
    const result = renderAuditTable(events);

    // Then
    expect(result).toContain('| 2026-03-02 | recordBatch / success | 12345 | evt-1 | OK |');
    expect(result).toContain('| 2026-03-02 | recordBatch / error (recordsが空配列です) | 12345 | evt-2 | 要確認 |');
  });

  test('AUDITセクションのみ置換し他セクションは維持する', () => {
    // Given
    const markdown = [
      '# Evidence Register',
      '',
      '## ACCESS',
      '| A |',
      '',
      '## AUDIT',
      '| old |',
      '',
      '## BACKUP/DR',
      '| keep |',
      '',
    ].join('\n');
    const table = [
      '| Date | 項目 | 実施者 | 証跡ID | 判定 |',
      '|---|---|---|---|---|',
      '| 2026-03-02 | recordBatch / success | 12345 | evt-1 | OK |',
    ].join('\n');

    // When
    const replaced = replaceMarkdownSection(markdown, '## AUDIT', '## BACKUP/DR', table);

    // Then
    expect(replaced).toContain('| 2026-03-02 | recordBatch / success | 12345 | evt-1 | OK |');
    expect(replaced).toContain('## BACKUP/DR');
    expect(replaced).not.toContain('| old |');
  });

  test('evidence register全体にAUDIT同期を適用できる', () => {
    // Given
    const markdown = [
      '# Evidence Register',
      '',
      '## AUDIT',
      '| old |',
      '',
      '## BACKUP/DR',
      '| keep |',
      '',
    ].join('\n');
    const events = [{ timestamp: '2026-03-02 11:22:33', action: 'record', status: 'success' }];

    // When
    const result = syncEvidenceRegisterContent(markdown, events);

    // Then
    expect(result).toContain('record / success');
    expect(result).toContain('## BACKUP/DR');
  });
});
