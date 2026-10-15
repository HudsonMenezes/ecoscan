import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('primeira visita: boas-vindas com aviso de privacidade; "Começar" liga o Modo voz e não volta', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { spoken: string[] }).spoken = spoken;
    window.speechSynthesis.speak = (utterance) => void spoken.push(utterance.text);
  });
  await page.goto('/');

  const dialog = page.getByRole('dialog', { name: 'Bem-vindo ao EcoScan!' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('o navegador envia sua fala para ser transformada em texto');

  await page.getByRole('button', { name: 'Começar' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Modo voz/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const spoken = await page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);
  expect(spoken[0]).toMatch(/^Olá! Eu sou o EcoScan\..*Bem-vindo ao EcoScan\./);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'O que vamos descartar hoje?' })).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test('a página Sobre tem o aviso de privacidade e é acessível pelo Início', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('ecoscan:welcome', JSON.stringify({ seen: true })),
  );
  await page.goto('/');

  await page.getByRole('link', { name: 'Sobre o EcoScan e privacidade' }).click();

  await expect(page).toHaveURL(/\/sobre$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sobre o EcoScan' })).toBeVisible();
  await expect(page.getByText(/o navegador envia sua fala/)).toBeVisible();
});
