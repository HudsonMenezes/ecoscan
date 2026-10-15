import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((env) =>
  mergeConfig(
    viteConfig(env),
    defineConfig({
      test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
        coverage: {
          provider: 'v8',
          include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
          exclude: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
        },
      },
    }),
  ),
);
