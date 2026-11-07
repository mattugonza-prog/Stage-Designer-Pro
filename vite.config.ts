import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  // A single artifact works at the origin root and in a GitHub Pages project path.
  base: './',
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
  server: { port: 5173, strictPort: true },
});
