import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/projects': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/reports': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/users': {
        target: 'http://localhost:5050',
        changeOrigin: true
      },
      '/ai': {
        target: 'http://localhost:5050',
        changeOrigin: true
      }
    }
  }
})
