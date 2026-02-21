import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const githubBase = env.VITE_GITHUB_BASE || '/Pogoda/'
  const isSecondaryBuild = ['secondary', 'netlify'].includes(mode) || ['secondary', 'netlify', 'cloudflare'].includes(env.VITE_DEPLOY_TARGET)
  const base = isSecondaryBuild ? '/' : githubBase

  return {
    base,
    plugins: [
      react(),
      tailwindcss()
    ],
    build: {
      // Code splitting оптимизация
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.split('\\').join('/');

            if (!normalizedId.includes('node_modules')) {
              return;
            }

            if (
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (normalizedId.includes('/recharts/')) {
              return 'charts-vendor';
            }

            if (normalizedId.includes('/three/examples/')) {
              return 'three-examples-vendor';
            }

            if (normalizedId.includes('/three/')) {
              return 'three-core-vendor';
            }

            if (normalizedId.includes('/@react-three/fiber/')) {
              return 'r3f-vendor';
            }

            if (normalizedId.includes('/@react-three/drei/')) {
              return 'drei-vendor';
            }

            if (normalizedId.includes('/framer-motion/')) {
              return 'motion-vendor';
            }

            if (normalizedId.includes('/lucide-react/')) {
              return 'icons-vendor';
            }

            if (normalizedId.includes('/suncalc/')) {
              return 'utils-vendor';
            }
          }
        }
      },
      // Разделение чанков
      chunkSizeWarningLimit: 750,
      // Минификация
      minify: 'esbuild',
      // Sourcemap для отладки
      sourcemap: false
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
})
