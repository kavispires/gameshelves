import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/gameshelves/',
  server: {
    port: 3009,
    strictPort: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: Object.fromEntries(
      ['assets', 'components', 'hooks', 'pages', 'services', 'utils'].map((name) => [
        name,
        fileURLToPath(new URL(`./src/${name}`, import.meta.url)),
      ]),
    ),
  },
  build: { outDir: 'build' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    clearMocks: true,
  },
});
