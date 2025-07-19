import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const viteConfig = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  esbuild: {
    drop: ['console', 'debugger'] as ('console' | 'debugger')[]
  }
};

export default defineConfig({
  ...viteConfig,
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '__tests__/e2e/**'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json'
    },
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        '__tests__/**/*.test.{ts,tsx}',
        'src/components/ui/**/*',
        'src/constants/**/*',
        'src/types/**/*'
      ]
    }
  }
});
