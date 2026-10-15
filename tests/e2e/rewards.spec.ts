import { expect, test, type Page } from '@playwright/test';
import { interceptScan } from './helpers/scan.ts';

// Fluxo de recompensas: descarte pelo link do QR (como a câmera nativa abre), depois de um scan real com
// a câmera falsa e /api/scan interceptado.
const PET = {
  identified: true,
  itemName: 'Garrafa PET',
  material: 'Plástico PET',
  category: 'plastico',
  confidence: 'alta',
  isComposite: false,
  disposal: 'Esvazie e coloque na coleta seletiva.',
  categoryReason: 'PET é plástico reciclável.',
  consequence: 'Leva centenas de anos para se decompor.',
  benefit: 'Reciclando, o material vira um produto novo e o ambiente fica mais limpo.',
  spokenSummary: 'É uma garrafa PET. Vai para a lixeira vermelha.',
};
const QR_LINK = '/descartar?ponto=escola-demo';

async function scanPet(page: Page) {
  await page.goto('/escanear');
  await page.waitForFunction(() => document.querySelector('video')?.videoWidth);
  await page.getByRole('button', { name: 'Tirar foto' }).click();
  await expect(page.getByRole('heading', { name: PET.itemName })).toBeVisible();
}

const ledgerSize = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('ecoscan:ledger') ?? '[]').length);

test.use({ permissions: ['camera'] });

test('escanear → link do QR → comemoração; repetir o link → "já foi contado"; novo scan → conta de novo', async ({
  page,
}) => {
  await interceptScan(page, PET);
  await scanPet(page);

  await page.goto(QR_LINK);
  await expect(page.getByRole('heading', { name: 'Parabéns!' })).toBeVisible();
  await expect(page.getByText('+10 XP e +5 moedas')).toBeVisible();
  expect(await ledgerSize(page)).toBe(1);

  await page.goto(QR_LINK);
  await expect(page.getByRole('alert')).toContainText('Esse item já foi contado!');
  expect(await ledgerSize(page)).toBe(1);

  await page.getByRole('button', { name: 'Escanear próximo' }).click();
  await expect(page).toHaveURL(/\/escanear$/);

  await scanPet(page); // outra garrafa PET
  await page.goto(QR_LINK);
  await expect(page.getByRole('heading', { name: 'Parabéns!' })).toBeVisible();
  expect(await ledgerSize(page)).toBe(2);

  // A carteira reflete o ledger: 2 garrafas PET = 20 XP e 10 moedas.
  await page.getByRole('link', { name: 'Minha carteira' }).click();
  await expect(page).toHaveURL(/\/carteira$/);
  await expect(page.getByRole('heading', { name: 'Semente' })).toBeVisible();
  await expect(page.locator('.wallet-totals dd')).toHaveText(['20', '10']);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  await expect(page.locator('.wallet-history__item')).toHaveCount(2);
});

test('link do QR sem ter escaneado → pede para escanear primeiro', async ({ page }) => {
  await page.goto(QR_LINK);

  await expect(page.getByRole('alert')).toContainText('Primeiro escaneie o item');
  await page.getByRole('button', { name: 'Escanear item' }).click();
  await expect(page).toHaveURL(/\/escanear$/);
});

test('QR de outro ponto → "não é um ponto do EcoScan"', async ({ page }) => {
  await page.goto('/descartar?ponto=nao-existe');

  await expect(page.getByRole('alert')).toContainText('Esse QR não é um ponto do EcoScan.');
});
