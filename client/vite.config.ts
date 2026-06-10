import react from '@vitejs/plugin-react';
import macros from 'unplugin-parcel-macros';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    macros.vite(), // Must be first for S2 style macros
    react(),
  ],
  server: {
    port: 55588,
  },
  build: {
    target: ['es2022'],
  },
});
