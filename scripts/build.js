// scripts/build.js
// 解压根目录的 dist_patched_by_guide.zip 到 dist/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ZIP_CANDIDATES = [
  'dist_patched_by_guide.zip',
  'dist.zip'
];

const zipPath = ZIP_CANDIDATES
  .map(name => path.join(ROOT, name))
  .find(p => fs.existsSync(p));

if (!zipPath) {
  console.error('❌ 没有找到 dist_patched_by_guide.zip 或 dist.zip');
  process.exit(1);
}

const distDir = path.join(ROOT, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

const zip = new AdmZip(zipPath);
zip.extractAllTo(distDir, true);

console.log(`✅ 解压完成：${path.basename(zipPath)} -> dist/`);
