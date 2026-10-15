import { expect, test, type Page } from '@playwright/test';
import { BATTERY_RESULT, interceptScan } from './helpers/scan.ts';

// Fluxo completo do scanner com a câmera falsa do Chromium e /api/scan interceptado (sem IA).
const CARTON_RESULT = {
  ...BATTERY_RESULT,
  itemName: 'Caixa de papelão',
  material: 'Papelão',
  category: 'papel',
  disposal: 'Desmonte a caixa e coloque na coleta seletiva.',
  categoryReason: 'Papelão é feito de fibras de papel, que viram papel novo.',
  spokenSummary: 'É uma caixa de papelão. Vai para a lixeira azul.',
};

async function scanWithCamera(page: Page) {
  await page.goto('/escanear');
  await page.getByRole('button', { name: 'Abrir câmera' }).click();
  await page.waitForFunction(() => document.querySelector('video')?.videoWidth);
  await page.getByRole('button', { name: 'Tirar foto' }).click();
}

test.describe('scanner', () => {
  test.use({ permissions: ['camera'] });

  test('reciclável: cor da lixeira, bloco "Em Duque de Caxias" e Descartar leva a /descartar', async ({
    page,
  }) => {
    await interceptScan(page, CARTON_RESULT);
    await scanWithCamera(page);

    await expect(page.getByRole('heading', { name: CARTON_RESULT.itemName })).toBeVisible();
    const header = page.locator('[data-category="papel"]');
    await expect(header).toHaveCSS('background-color', 'rgb(31, 95, 174)'); // azul
    await expect(header).toContainText('Lixeira azul');

    const local = page.getByTestId('local-guidance');
    await expect(local.getByRole('heading', { name: 'Em Duque de Caxias' })).toBeVisible();
    await expect(local).toContainText('Ecoponto');
    await expect(
      local.getByRole('link', { name: 'Prefeitura de Duque de Caxias' }),
    ).toHaveAttribute('href', /^https:\/\/portal\.duquedecaxias\.rj\.gov\.br\//);

    await page.getByRole('link', { name: 'Descartar' }).click();
    await expect(page).toHaveURL(/\/descartar$/);
    await expect(page.getByRole('heading', { name: 'Descartar', level: 1 })).toBeVisible();
  });

  test('perigoso sem fonte local: cor laranja, destino especial e sem bloco local', async ({
    page,
  }) => {
    await interceptScan(page, BATTERY_RESULT);
    await scanWithCamera(page);

    const header = page.locator('[data-category="pilhas_baterias"]');
    await expect(header).toHaveCSS('background-color', 'rgb(239, 108, 0)'); // laranja
    await expect(header).toContainText('Ponto de coleta específico');
    await expect(page.getByTestId('local-guidance')).toHaveCount(0);
  });

  test('"Escanear outro" volta para a captura', async ({ page }) => {
    await interceptScan(page, CARTON_RESULT);
    await scanWithCamera(page);
    await expect(page.getByRole('heading', { name: CARTON_RESULT.itemName })).toBeVisible();

    await page.getByRole('button', { name: 'Escanear outro' }).click();

    await expect(page.getByRole('button', { name: 'Abrir câmera' })).toBeVisible();
  });
});
