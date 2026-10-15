import { expect, test } from '@playwright/test';

test.describe('computador', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
    permissions: ['camera'],
  });

  test('mostra o banner "Melhor no celular" com o QR, e dispensar persiste', async ({ page }) => {
    await page.goto('/');

    const hint = page.getByRole('complementary');
    await expect(hint).toContainText('Melhor no celular');
    const qr = page.getByAltText('QR code que abre o EcoScan no celular');
    await expect(qr).toBeVisible();
    expect(await qr.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Fechar aviso' }).click();
    await expect(hint).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'EcoScan' })).toBeVisible();
    await expect(page.getByText('Melhor no celular')).toHaveCount(0);
  });

  test('câmera e envio ficam lado a lado; webcam com preview espelhado', async ({ page }) => {
    await page.goto('/escanear');

    const open = page.getByRole('button', { name: 'Abrir câmera' });
    const drop = page.getByText('Arraste uma foto para cá ou clique para escolher');
    await expect(open).toBeVisible();
    await expect(drop).toBeVisible();
    const [openBox, dropBox] = [await open.boundingBox(), await drop.boundingBox()];
    expect(dropBox!.x).toBeGreaterThan(openBox!.x + openBox!.width);

    await open.click();
    await expect(page.locator('video')).toHaveClass(/camera__video--mirrored/);
  });

  test('arrastar e soltar uma foto gera o JPEG reduzido', async ({ page }) => {
    await page.goto('/escanear');

    const dataTransfer = await page.evaluateHandle(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1500;
      canvas.getContext('2d')!.fillRect(0, 0, 2000, 1500);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png'),
      );
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], 'foto.png', { type: 'image/png' }));
      return transfer;
    });
    const zone = page.locator('label.dropzone');
    await zone.dispatchEvent('dragover', { dataTransfer });
    await zone.dispatchEvent('drop', { dataTransfer });

    await expect(page.getByTestId('photo-info')).toContainText('1024×768');
    await expect(page.getByTestId('photo-info')).toContainText('image/jpeg');
  });
});

test('no celular o banner não aparece e não há área de arrastar', async ({ page }) => {
  await page.goto('/escanear');

  await expect(page.getByRole('button', { name: 'Abrir câmera' })).toBeVisible();
  await expect(page.getByText('Melhor no celular')).toHaveCount(0);
  await expect(page.locator('label.dropzone')).toHaveCount(0);
});
