import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
          lines: 95,
          functions: 95,
          statements: 95,
          branches: 95,
      },
      include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['src/**/*.d.ts', 'src/manifest.ts', 'src/popup/main.tsx', 'src/sidebar/main.tsx', 'src/shared/types.ts'],
    },
  },
});
