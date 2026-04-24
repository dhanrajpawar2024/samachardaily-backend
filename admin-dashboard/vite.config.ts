import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          icons:    ['lucide-react'],
          utils:    ['date-fns', 'clsx'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api':     { target: 'http://localhost:3001', changeOrigin: true },
      '/scraper': { target: 'http://localhost:3007', changeOrigin: true, rewrite: (p) => p.replace(/^\/scraper/, '') },
    },
  },
});

