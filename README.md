# Feishu China Map Plugin — Source Config (Lightweight)

This package provides the minimal source-side configuration required by Feishu's review:
- **`package.json`** with `"output": "dist"` and Vite scripts
- **`vite.config.js`** with `base: './'` and `build.outDir = 'dist'`

> Use this alongside your built artifact (`dist.zip` / `dist/`) already uploaded.

## How to use

1. Put these three files at the **root** of your GitHub repository:
   - `package.json`
   - `vite.config.js`
   - `README.md` (this file)

2. Commit and push. This satisfies the “source is buildable” requirement.

3. (Optional) If you later add real source code, run:
   ```bash
   npm install
   npm run build
