import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SYSTEM',
        short_name: 'SYSTEM',
        description: 'Gamified Life OS',
        theme_color: '#00BFFF',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,gif}'],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /supabase.*rest/i,
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 3,
              cacheName: 'supabase-api',
            },
          },
          {
            urlPattern: /supabase.*auth/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
