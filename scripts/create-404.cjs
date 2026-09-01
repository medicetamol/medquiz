const fs = require('fs');
const path = require('path');

const dist = path.join(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');
const fallback = path.join(dist, '404.html');

if (!fs.existsSync(index)) {
  console.error('dist/index.html not found.');
  process.exit(1);
}

fs.copyFileSync(index, fallback);
console.log('Created dist/404.html for GitHub Pages SPA fallback.');
