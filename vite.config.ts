import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from "vite-plugin-pwa";
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: "prompt",
    devOptions: {
      enabled: true
    }
  })],
  resolve: {
    alias: {
      // Matches the "@/*" import alias used in the Next.js project, so
      // code you copy between the two projects doesn't need import
      // rewrites (e.g. `import { apiFetch } from "@/lib/api"` works in both).
      '@': path.resolve(__dirname, './src'),
    },
  },
})