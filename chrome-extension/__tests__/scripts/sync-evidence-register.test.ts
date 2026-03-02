import { describe, expect, test, vi } from 'vitest';
import {
  resolveSyncOptions,
  runSyncEvidenceRegister,
} from '../../scripts/sync-evidence-register.mjs';
import { syncEvidenceRegisterContent } from '../../scripts/evidence-sync-lib.mjs';

function responseOf(body: string) {
  return { text: async () => body };
}

describe('sync-evidence-register', () => {
  test('CLI引数からオプションを解決できる', () => {
    // Given
    const prevArgv = [...process.argv];
    process.argv = [
      'node',
      'sync-evidence-register.mjs',
      '--gas-url',
      'https://script.google.com/macros/s/x/exec',
      '--evidence-secret',
      'evidence-secret',
      '--limit',
      '50',
      '--out',
      '/tmp/custom-evidence.md',
    ];

    // When
    const options = resolveSyncOptions();

    // Then
    expect(options.gasUrl).toBe('https://script.google.com/macros/s/x/exec');
    expect(options.evidenceSecret).toBe('evidence-secret');
    expect(options.limit).toBe(50);
    expect(options.outPath).toContain('/tmp/custom-evidence.md');
    process.argv = prevArgv;
  });

  test('limitが異常値なら1〜500に丸める', () => {
    // Given
    const prevArgv = [...process.argv];
    process.argv = ['node', 'sync-evidence-register.mjs', '--limit', '99999'];

    // When
    const options = resolveSyncOptions();

    // Then
    expect(options.limit).toBe(500);
    process.argv = prevArgv;
  });

  test('GAS URL未指定ならエラー', async () => {
    // Given
    const readFileImpl = vi.fn();

    // When / Then
    await expect(
      runSyncEvidenceRegister({
        gasUrl: '',
        evidenceSecret: 'ev',
        outPath: '/tmp/evidence.md',
        fetchImpl: vi.fn(),
        readFileImpl,
        writeFileImpl: vi.fn(),
      }),
    ).rejects.toThrow('Missing GAS URL');
  });

  test('evidence secret未指定ならエラー', async () => {
    // Given
    const readFileImpl = vi.fn();

    // When / Then
    await expect(
      runSyncEvidenceRegister({
        gasUrl: 'https://script.google.com/macros/s/x/exec',
        evidenceSecret: '',
        outPath: '/tmp/evidence.md',
        fetchImpl: vi.fn(),
        readFileImpl,
        writeFileImpl: vi.fn(),
      }),
    ).rejects.toThrow('Missing GAS evidence secret');
  });

  test('GAS応答がJSONでない場合はエラー', async () => {
    // Given
    const fetchImpl = vi.fn().mockResolvedValue(responseOf('<html>bad</html>'));

    // When / Then
    await expect(
      runSyncEvidenceRegister({
        gasUrl: 'https://script.google.com/macros/s/x/exec',
        evidenceSecret: 'ev',
        outPath: '/tmp/evidence.md',
        fetchImpl,
        readFileImpl: vi.fn(),
        writeFileImpl: vi.fn(),
      }),
    ).rejects.toThrow('Invalid JSON response from GAS');
  });

  test('GAS success:false をエラーとして返す', async () => {
    // Given
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(responseOf(JSON.stringify({ success: false, error: 'ng' })));

    // When / Then
    await expect(
      runSyncEvidenceRegister({
        gasUrl: 'https://script.google.com/macros/s/x/exec',
        evidenceSecret: 'ev',
        outPath: '/tmp/evidence.md',
        fetchImpl,
        readFileImpl: vi.fn(),
        writeFileImpl: vi.fn(),
      }),
    ).rejects.toThrow('GAS error: ng');
  });

  test('変更なしの場合はwriteしない', async () => {
    // Given
    const template = [
      '# Evidence Register',
      '',
      '## AUDIT',
      '## BACKUP/DR',
      '| keep |',
      '',
    ].join('\n');
    const events = [
      {
        timestamp: '2026-03-02 10:00:00',
        action: 'recordBatch',
        status: 'success',
        doctorId: 'dr1',
        eventId: 'evt1',
      },
    ];
    const markdown = syncEvidenceRegisterContent(template, events);
    const fetchImpl = vi.fn().mockResolvedValue(
      responseOf(
        JSON.stringify({
          success: true,
          events,
        }),
      ),
    );
    const readFileImpl = vi.fn().mockResolvedValue(markdown);
    const writeFileImpl = vi.fn();

    // When
    const result = await runSyncEvidenceRegister({
      gasUrl: 'https://script.google.com/macros/s/x/exec',
      evidenceSecret: 'ev',
      outPath: '/tmp/evidence.md',
      fetchImpl,
      readFileImpl,
      writeFileImpl,
    });

    // Then
    expect(result.changed).toBe(false);
    expect(writeFileImpl).not.toHaveBeenCalled();
  });

  test('変更ありの場合はwriteする', async () => {
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
    const fetchImpl = vi.fn().mockResolvedValue(
      responseOf(
        JSON.stringify({
          success: true,
          events: [
            {
              timestamp: '2026-03-02 10:00:00',
              action: 'recordBatch',
              status: 'success',
              doctorId: 'dr1',
              eventId: 'evt2',
            },
          ],
        }),
      ),
    );
    const readFileImpl = vi.fn().mockResolvedValue(markdown);
    const writeFileImpl = vi.fn().mockResolvedValue(undefined);

    // When
    const result = await runSyncEvidenceRegister({
      gasUrl: 'https://script.google.com/macros/s/x/exec',
      evidenceSecret: 'ev',
      outPath: '/tmp/evidence.md',
      fetchImpl,
      readFileImpl,
      writeFileImpl,
    });

    // Then
    expect(result.changed).toBe(true);
    expect(writeFileImpl).toHaveBeenCalledTimes(1);
    expect(String(writeFileImpl.mock.calls[0][1])).toContain('recordBatch / success');
  });
});
