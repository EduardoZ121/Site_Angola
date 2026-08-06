import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json paths ("@/*": ["./*"]) so unit tests can import
      // value exports (not just types) through the `@/` alias used across the app.
      '@': path.resolve(__dirname, '.'),
    },
  },
});
