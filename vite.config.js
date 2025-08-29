import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173
  },
  preview: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'chart-vendor': ['recharts'],
          'http-vendor': ['axios']
        }
      }
    }
  }
})
