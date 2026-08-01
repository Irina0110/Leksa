import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function googleTtsProxy() {
  return {
    target: 'https://translate.googleapis.com',
    changeOrigin: true,
    rewrite: (path: string) => {
      const incoming = new URL(path, 'http://localhost')
      const q = incoming.searchParams.get('q') || ''
      const tl = incoming.searchParams.get('tl') || 'en'
      const out = new URL('https://translate.googleapis.com/translate_tts')
      out.searchParams.set('ie', 'UTF-8')
      out.searchParams.set('client', 'gtx')
      out.searchParams.set('tl', tl)
      out.searchParams.set('q', q)
      return out.pathname + out.search
    },
  }
}

export default defineConfig({
  base: '/Leksa/',
  server: {
    proxy: {
      // Локально и с телефона в LAN: blob-озвучка через same-origin proxy
      '/Leksa/api/tts': googleTtsProxy(),
    },
  },
  preview: {
    proxy: {
      '/Leksa/api/tts': googleTtsProxy(),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Лекса — карточки слов',
        short_name: 'Лекса',
        description: 'Изучение иностранных слов с карточками',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Leksa/',
        scope: '/Leksa/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/translate\.(googleapis|google)\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\/tts.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/.*\.workers\.dev\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
