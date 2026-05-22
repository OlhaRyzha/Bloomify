import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '.vitest/cache',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 90,
        statements: 90,
      },
    },
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
