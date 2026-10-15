import { expect, test } from '@playwright/test';

test('a home carrega com o nome do app', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('EcoScan');
  await expect(page.getByRole('heading', { name: 'EcoScan' })).toBeVisible();
});
