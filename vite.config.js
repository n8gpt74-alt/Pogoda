import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = mode === 'github' || env.VITE_DEPLOY_TARGET === 'github' ? '/Wehtrer/' : '/'

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
          manualChunks: {
            // React и зависимости
            'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
            // Графики
            'charts-vendor': ['recharts'],
            // Иконки
            'icons-vendor': ['lucide-react'],
            // Утилиты
            'utils-vendor': ['suncalc']
          }
        }
      },
      // Разделение чанков
      chunkSizeWarningLimit: 600,
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
