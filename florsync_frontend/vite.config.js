import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    proxy: {
      '/api': 'https://florsync-2-0-1.onrender.com/api/',
    },
  },
})