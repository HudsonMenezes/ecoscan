import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Com 6+ navegadores em paralelo, o Chromium às vezes deixa sem resposta a
  // requisição de um chunk lazy (o servidor responde normalmente). Com 3 fica estável.
  workers: process.env.CI ? undefined : 3,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // O precache do service worker concorre com as requisições do teste e deixa
    // a navegação instável. O PWA é validado pelo Lighthouse no Checkpoint A.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
