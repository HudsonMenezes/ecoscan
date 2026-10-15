import { expect, test } from '@playwright/test';

const routes = [
  { button: 'Escanear', path: '/escanear', heading: 'Escanear' },
  { button: 'Descartar (QR)', path: '/descartar', heading: 'Descartar' },
  { button: 'Minha carteira', path: '/carteira', heading: 'Minha carteira' },
];

test('a home mostra os 3 botões e não tem scroll horizontal em 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');

  await expect(page).toHaveTitle('EcoScan');
  await expect(page.getByRole('heading', { name: 'EcoScan' })).toBeVisible();
  for (const { button } of routes) {
    const link = page.getByRole('link', { name: button });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(64);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

for (const { button, path, heading } of routes) {
  test(`navega da home até ${path} e volta`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: button }).click();

    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();

    await page.getByRole('link', { name: 'Voltar para o início' }).click();
    await expect(page).toHaveURL('/');
  });
}

test('link direto (como o do QR impresso) abre a tela sem passar pela home', async ({ page }) => {
  await page.goto('/descartar?ponto=escola-demo');

  await expect(page.getByRole('heading', { name: 'Descartar' })).toBeVisible();
});

test('o manifest do PWA tem ícones PNG de 192 e 512 (incluindo maskable)', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);

  const manifest = (await response.json()) as {
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
  };
  const pngs = manifest.icons.filter((icon) => icon.type === 'image/png');
  expect(pngs.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(pngs.some((icon) => icon.purpose === 'maskable')).toBe(true);

  for (const icon of pngs) {
    const file = await request.get(icon.src);
    expect(file.ok(), icon.src).toBe(true);
  }
});
