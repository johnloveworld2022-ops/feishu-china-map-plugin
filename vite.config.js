import { defineConfig } from 'vite'

// Feishu/Lark Multi-dimensional Sheet plugin requirements:
// 1) Use relative base path to avoid absolute /assets in iframe
// 2) Output to 'dist' so you can upload the dist folder directly
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist'
  }
})
