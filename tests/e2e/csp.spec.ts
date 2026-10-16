import { expect, test, type Page } from '@playwright/test';
import { interceptScan } from './helpers/scan.ts';

// O `npm run preview` serve os cabeçalhos do vercel.json (ver vite.config.ts). Este teste percorre as
// telas, incluindo as que usam `style={{}}` (resultado, comemoração, carteira), e falha em qualquer
// violação da CSP.
async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const violations: string[] = [];
    (window as unknown as { __cspViolations: string[] }).__cspViolations = violations;
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(
        `${event.effectiveDirective}: ${event.blockedURI || 'inline'} @ ${event.sourceFile}:${event.lineNumber}:${event.columnNumber}`,
      );
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);

test.use({ permissions: ['camera'], storageState: { cookies: [], origins: [] } });

test('a CSP de produção vale no preview e nenhuma tela a viola', async ({ page }) => {
  await recordViolations(page);
  await interceptScan(page);

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");

  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.goto('/escanear');
  await page.waitForFunction(() => document.querySelector('video')?.videoWidth);
  await page.getByRole('button', { name: 'Tirar foto' }).click();
  await expect(page.getByRole('heading', { name: 'Pilha alcalina AA' })).toBeVisible();

  await page.goto('/descartar?ponto=escola-demo');
  await expect(page.getByRole('heading', { name: 'Parabéns!' })).toBeVisible();

  await page.goto('/carteira');
  await expect(page.locator('.wallet-history__item')).toHaveCount(1);

  await page.goto('/sobre');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  expect(await violations(page)).toEqual([]);
});
