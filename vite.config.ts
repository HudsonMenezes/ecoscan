import { fileURLToPath, URL } from 'node:url';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    // HTTPS local só no `npm run dev`: câmera e microfone exigem contexto seguro no celular.
    command === 'serve' && !isPreview ? basicSsl() : null,
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'EcoScan',
        short_name: 'EcoScan',
        description: 'Descubra como descartar cada objeto corretamente.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1b7f3b',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}));
