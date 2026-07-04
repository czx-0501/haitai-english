import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/azure-stt': {
        target: 'https://eastasia.stt.speech.microsoft.com',
        changeOrigin: true,
        rewrite: (_path) => '/speech/recognition/conversation/cognitiveservices/v1?language=en-US',
      },
      '/api': {
        target: 'http://localhost:5188',
        changeOrigin: true,
      }
    }
  }
})
