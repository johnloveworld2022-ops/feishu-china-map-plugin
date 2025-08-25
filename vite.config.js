import { defineConfig } from 'vite'

export default defineConfig({
  base: './',        // 关键：相对路径，避免在飞书 iframe 中 /assets 404
  build: {
    outDir: 'dist'   // 产物目录
  }
})

