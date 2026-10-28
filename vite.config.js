import { fileURLToPath, URL } from 'node:url';
import esbuild from 'esbuild';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';

const cubejsEntry = fileURLToPath(new URL('./src/vendor/cubejs/index.js', import.meta.url));

// The vendored solver is CommonJS. Node loads it through the nested
// package.json; the browser needs one ESM bundle of the same entry.
function cubejsBundle() {
  return {
    name: 'cubejs-bundle',
    enforce: 'pre',
    async load(id) {
      if (id.split('?')[0] !== cubejsEntry) return null;
      const result = await esbuild.build({
        absWorkingDir: fileURLToPath(new URL('./src/vendor/cubejs', import.meta.url)),
        entryPoints: [cubejsEntry],
        bundle: true,
        format: 'esm',
        platform: 'neutral',
        write: false,
        logLevel: 'silent',
      });
      return result.outputFiles[0].text;
    },
  };
}

// `npm run dev:https` : HTTPS avec un certificat de dev, pour la caméra du
// scan sur un téléphone du réseau local
export default defineConfig(({ mode }) => ({
  plugins: [cubejsBundle(), react(), ...(mode === 'https' ? [basicSsl()] : [])],
  // Les workers ont leur propre pipeline : le solveur y est importé aussi.
  worker: {
    format: 'es',
    plugins: () => [cubejsBundle()],
  },
  build: {
    // three seul pèse ~690 kB minifié : incompressible pour une scène 3D, isolé dans son chunk
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Bibliothèques à part : elles changent rarement, le cache navigateur les garde
        manualChunks(id) {
          // L’aide de préchargement de Vite va avec react, que l’entrée charge de
          // toute façon. Laissée libre, elle suit drei dans r3f : l’entrée
          // importerait r3f, donc three, avant même le premier rendu.
          if (id.includes('vite/preload-helper')) return 'react';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/three\//.test(id)) return 'three';
          if (/node_modules\/(postprocessing|@react-three\/postprocessing)\//.test(id)) return 'postfx';
          if (/node_modules\/@react-three\//.test(id)) return 'r3f';
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}));
