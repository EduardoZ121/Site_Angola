import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'prebuilt', 'web-out');
const dest = path.join(root, 'dist');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === 'CNAME') continue;
    const sp = path.join(from, entry.name);
    const dp = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
}

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('Missing prebuilt/web-out/index.html — run scripts/build-static-web.sh first');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log('Static publish ready at ./dist (node copy from prebuilt/web-out)');
console.log(fs.readdirSync(dest).join(', '));
