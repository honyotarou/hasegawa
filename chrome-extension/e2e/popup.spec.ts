import { test, expect, Page } from '@playwright/test';

type KV = Record<string, any>;

async function mountChromeMock(page: Page, localData: KV, sessionData: KV, executeResult?: any) {
  await page.addInitScript(
    ({ localDataArg, sessionDataArg, executeResultArg }) => {
      const localStore: KV = { ...localDataArg };
      const sessionStore: KV = { ...sessionDataArg };

      const pick = (store: KV, keys?: string | string[] | KV) => {
        if (!keys) return { ...store };
        if (Array.isArray(keys)) {
          return keys.reduce((acc: KV, key) => {
            acc[key] = store[key];
            return acc;
          }, {});
        }
        if (typeof keys === 'string') {
          return { [keys]: store[keys] };
        }
        return Object.keys(keys).reduce((acc: KV, key) => {
          acc[key] = key in store ? store[key] : (keys as KV)[key];
          return acc;
        }, {});
      };

      const removeKeys = (store: KV, keys: string | string[]) => {
        if (Array.isArray(keys)) {
          keys.forEach((k) => delete store[k]);
          return;
        }
        delete store[keys];
      };

      (window as any).fetch = async () => {
        return new Response(JSON.stringify({ success: true, written: 1, skipped: 0 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      };

      (window as any).chrome = {
        storage: {
          local: {
            get: async (keys?: string | string[] | KV) => pick(localStore, keys),
            set: async (items: KV) => {
              Object.assign(localStore, items);
            },
            remove: async (keys: string | string[]) => removeKeys(localStore, keys),
          },
          session: {
            get: async (keys?: string | string[] | KV) => pick(sessionStore, keys),
            set: async (items: KV) => {
              Object.assign(sessionStore, items);
            },
            remove: async (keys: string | string[]) => removeKeys(sessionStore, keys),
          },
        },
        tabs: {
          query: async () => [{ id: 1 }],
        },
        scripting: {
          executeScript: async () => [{ result: executeResultArg ?? { success: false, error: 'no mock result' } }],
        },
      };
    },
    {
      localDataArg: localData,
      sessionDataArg: sessionData,
      executeResultArg: executeResult,
    },
  );
}

test('setup validation and transition to main screen', async ({ page }) => {
  // Given
  await mountChromeMock(page, {}, {});

  // When
  await page.goto('/popup.html');

  // Then
  await expect(page.getByText('GAS URL（本番）*')).toBeVisible();
  await expect(page.getByText('シークレットキー*')).toBeVisible();
  await expect(page.getByText('社員番号（医師ID）*')).toBeVisible();
  await expect(page.getByText('診断名マスタ（1行1件）*')).toBeVisible();

  // When
  await page.getByRole('button', { name: '表示' }).click();
  await page.getByRole('button', { name: '設定を保存して始める' }).click();

  // Then
  await expect(page.getByText('GAS URL（本番）は必須です')).toBeVisible();

  // Given
  await page.getByLabel('gasUrlProd').fill('https://script.google.com/macros/s/xxx/exec');
  await page.getByLabel('doctorId').fill('12345');
  await page.getByLabel('apiSecret').fill('secret-value');
  await page.getByLabel('diagnosisMaster').fill('腰痛\n肩痛');

  // When
  await page.getByRole('button', { name: '設定を保存して始める' }).click();

  // Then
  await expect(page.getByRole('button', { name: 'ChatGPTから取得' })).toBeVisible();
});

test('main -> confirm -> done happy path', async ({ page }) => {
  // Given
  await mountChromeMock(
    page,
    {
      gasUrlProd: 'https://script.google.com/macros/s/xxx/exec',
      gasUrlDev: '',
      doctorId: '12345',
      diagnosisMaster: ['腰痛', '肩痛'],
    },
    { apiSecret: 'secret-value' },
    {
      success: true,
      patients: [
        { age: 70, gender: '男性' },
      ],
    },
  );

  // When
  await page.goto('/popup.html');
  await page.getByRole('button', { name: 'ChatGPTから取得' }).click();
  await page.getByLabel('diag-trigger').click();
  await page.getByRole('button', { name: /★\s*腰痛/ }).click();
  await page.getByRole('button', { name: 'あり' }).click();
  await page.getByRole('button', { name: /全件送信/ }).click();
  await page.getByRole('button', { name: '送信する' }).click();

  // Then
  await expect(page.getByText('1件を送信しました')).toBeVisible();
});
