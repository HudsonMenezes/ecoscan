import { expect, test } from '@playwright/test';
import { installFakeSpeech, sayCommand, spokenTexts } from './fakes/speech.ts';
import { BATTERY_RESULT, interceptScan } from './helpers/scan.ts';

test.use({ permissions: ['camera'] });

test('só por voz: "escanear" → "capturar" → "repetir" fala o resultado → "descartar"', async ({
  page,
}) => {
  await installFakeSpeech(page);
  await interceptScan(page);
  await page.goto('/');

  await sayCommand(page, 'escanear');
  await expect(page).toHaveURL(/\/escanear$/);

  // A câmera liga sozinha; "capturar" tira a foto.
  await page.waitForFunction(() => document.querySelector('video')?.videoWidth);
  await sayCommand(page, 'capturar');
  await expect(page.getByRole('heading', { name: BATTERY_RESULT.itemName })).toBeVisible();

  const before = (await spokenTexts(page)).length;
  await sayCommand(page, 'repetir');
  await expect
    .poll(async () => (await spokenTexts(page)).slice(before))
    .toEqual([BATTERY_RESULT.spokenSummary]);

  await sayCommand(page, 'descartar');
  await expect(page).toHaveURL(/\/descartar$/);
});

test('🔊 lê a tela, e o Modo voz faz cada tela falar ao abrir', async ({ page }) => {
  await installFakeSpeech(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Ouvir esta tela' }).click();
  expect((await spokenTexts(page))[0]).toMatch(/^Bem-vindo ao EcoScan\./);

  await page.getByRole('button', { name: /Modo voz/ }).click();
  await sayCommand(page, 'minhas moedas');

  await expect(page).toHaveURL(/\/carteira$/);
  await expect.poll(async () => (await spokenTexts(page)).at(-1)).toMatch(/^Você está no nível/);
});

test('frase desconhecida → "Não entendi" com sugestões, sem sair da tela', async ({ page }) => {
  await installFakeSpeech(page);
  await page.goto('/');

  await sayCommand(page, 'qual é a previsão do tempo');

  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(async () => (await spokenTexts(page)).at(-1))
    .toMatch(/^Não entendi\. Você pode dizer: escanear, /);
});

test('sem reconhecimento de voz (como no Firefox), o 🎤 não aparece e não há erro no console', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Ouvir esta tela' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Falar um comando' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
