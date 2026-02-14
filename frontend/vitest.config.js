import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#test-utils': path.resolve(__dirname, './tests/test-utils.jsx'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
