import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    // No Docker em Windows/macOS os eventos nativos de filesystem não atravessam
    // o bind mount; o polling garante que o Vite detecte as mudanças de arquivo.
    watch: {
      usePolling: true
    }
  }
})
