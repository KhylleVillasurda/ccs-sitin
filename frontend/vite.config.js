import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: /\.(js|jsx|ts|tsx)$/,
    })
  ],
  oxc: {
    include: /\.(js|jsx|ts|tsx)$/,
  },
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 5173,
    // Set to '0.0.0.0' to expose on your local network IP
    // Then access via http://YOUR_IP:5173 from other devices
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Change this to your machine's IP if accessing from another device
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
