// vite.config.ts - Fixed with Backend Proxy for Development
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://finance-tracker-backend-f7fh.onrender.com/api/health',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 Backend proxy error:', err.message);
            console.log('💡 Make sure your backend is running on https://finance-tracker-backend-f7fh.onrender.com/api/health');
            console.log('💡 Start backend with: cd backend && npm run dev');
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🚀 Proxying request:', req.method, req.url, '→', proxyReq.getHeader('host') + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (proxyRes.statusCode >= 400) {
              console.log('❌ Backend error:', proxyRes.statusCode, req.url);
            } else {
              console.log('✅ Backend response:', proxyRes.statusCode, req.url);
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast'],
          charts: ['recharts'],
          forms: ['react-hook-form']
        }
      }
    }
  },
  define: {
    // Replace env variables at build time
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://finance-tracker-backend-f7fh.onrender.com/api/health/api')
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'framer-motion',
      'react-hot-toast',
      'recharts',
      'react-hook-form'
    ]
  }
})