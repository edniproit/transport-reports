import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        // Сервер друкує PDF з клієнта за цією адресою, тож передаємо йому хост Vite.
        configure: (proxy) => proxy.on('proxyReq', (proxyReq, req) => proxyReq.setHeader('x-forwarded-host', req.headers.host)),
      },
    },
  },
});
