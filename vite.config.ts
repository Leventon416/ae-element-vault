import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Helper plugin to ensure CEP configuration files (CSXS, host, .debug) are mirrored to dist
function cepPlugin() {
  return {
    name: 'vite-plugin-cep-bundler',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      // Copy CSXS folder to dist
      const csxsSrc = path.resolve(__dirname, 'CSXS');
      const csxsDist = path.join(distDir, 'CSXS');
      if (fs.existsSync(csxsSrc)) {
        fs.mkdirSync(csxsDist, { recursive: true });
        for (const file of fs.readdirSync(csxsSrc)) {
          fs.copyFileSync(path.join(csxsSrc, file), path.join(csxsDist, file));
        }
      }

      // Copy host folder to dist (including syncEngine.jsx, inserter.jsx, essentialProps.jsx, controlsInspector.jsx, textInspector.jsx, previewRenderer.jsx, scanner.jsx, reducer.jsx, exporter.jsx, thumbnail.jsx)
      const hostSrc = path.resolve(__dirname, 'host');
      const hostDist = path.join(distDir, 'host');
      if (fs.existsSync(hostSrc)) {
        fs.mkdirSync(hostDist, { recursive: true });
        for (const file of fs.readdirSync(hostSrc)) {
          const srcFile = path.join(hostSrc, file);
          const distFile = path.join(hostDist, file);
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, distFile);
          }
        }
      }


      // Copy .debug to dist
      const debugSrc = path.resolve(__dirname, '.debug');
      const debugDist = path.join(distDir, '.debug');
      if (fs.existsSync(debugSrc)) {
        fs.copyFileSync(debugSrc, debugDist);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cepPlugin()
  ],
  // CEP uses file:// or relative paths in production
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Modern CEF (Chromium 88+) compatibility for AE CC 2019 - 2025+
    target: 'chrome88',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
