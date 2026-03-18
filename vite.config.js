import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        basicTerrain: resolve(__dirname, 'demos/basic-terrain/index.html'),
        infiniteTerrain: resolve(__dirname, 'demos/infinite-terrain/index.html'),
        fogLandscape: resolve(__dirname, 'demos/fog-landscape/index.html'),
        alienWorld: resolve(__dirname, 'demos/alien-world/index.html')
      }
    }
  }
});
