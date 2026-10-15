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
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png', 'fonts/*.woff2'],
      manifest: {
        name: 'EcoScan',
        short_name: 'EcoScan',
        description: 'Descubra como descartar cada objeto corretamente.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f3ea',
        theme_color: '#0e5f3a',
        // Gerados por `npm run icons`. O Lighthouse exige PNG 192/512 para considerar instalável.
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}));
