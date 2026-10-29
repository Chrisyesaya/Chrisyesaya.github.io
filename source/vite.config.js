import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` writes the production site to the repo root (served by GitHub Pages).
// `npm run build:single` writes one self-contained HTML file to dist-single/.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'single'
    ? { outDir: 'dist-single' }
    : { outDir: '..', emptyOutDir: false, assetsDir: 'assets' },
}))
