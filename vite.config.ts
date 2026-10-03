import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate',
  manifest: { name: 'Salteñería', short_name: 'Salteñería', start_url: '/', display: 'standalone',
    background_color: '#F6F7F4', theme_color: '#1F5F4A', icons: [] } })] })
