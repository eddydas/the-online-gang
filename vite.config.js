import { defineConfig } from 'vite'

export default defineConfig({
  base: '/theeddygang2/',
  build: {
    outDir: 'dist'
  },
  server: {
    host: '127.0.0.1',
    port: 3000
  }
})
