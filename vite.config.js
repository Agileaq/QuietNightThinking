import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base URL allows hosting from any subpath on GitHub Pages, e.g. https://<user>.github.io/QuietNightThinking/
  base: process.env.BASE_URL || './',
  build: {
    outDir: 'dist',
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
