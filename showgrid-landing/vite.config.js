import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ShowGrid - Dance Battle Platform',
        short_name: 'ShowGrid',
        description: "Join India's biggest dance challenge.",
        theme_color: '#000000',
        background_color: '#000000',
        icons: [
          {
            src: 'pwa/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
