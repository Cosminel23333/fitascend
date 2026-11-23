import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // relative paths so the build works under the GitHub Pages sub-folder
  base: './',
  server: { host: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // webp: the splash logo must show offline too (og-image.jpg stays out on purpose)
      workbox: { globPatterns: ['**/*.{js,css,html,webp,png,svg,ico}'] },
      includeAssets: ['logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'FitAscend',
        short_name: 'FitAscend',
        description: 'Antrenamente, nutriție și sănătate într-un singur loc',
        lang: 'ro',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        theme_color: '#0c0309',
        background_color: '#0c0309',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
