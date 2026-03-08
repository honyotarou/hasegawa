import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

describe('gas manifest contract', () => {
  test('appsscript.json は anonymous web app として公開設定を持つ', () => {
    // Given
    const manifestPath = path.resolve(__dirname, '../../../gas/appsscript.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // When
    const webapp = manifest.webapp;

    // Then
    expect(webapp).toMatchObject({
      access: 'ANYONE_ANONYMOUS',
      executeAs: 'USER_DEPLOYING',
    });
  });
});
