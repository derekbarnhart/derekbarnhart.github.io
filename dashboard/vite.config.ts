import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/dashboard/dist/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('open-meteo.com'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'weather', expiration: { maxAgeSeconds: 60 * 10 } },
          },
          {
            urlPattern: ({ url }) => url.origin.includes('quotable.io'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'quotes', expiration: { maxAgeSeconds: 60 * 60 } },
          },
        ],
      },
      manifest: {
        name: 'Desk Dashboard',
        short_name: 'Dashboard',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        scope: '/dashboard/',
        start_url: '/dashboard/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ],
      },
    }),
  ],
});
