const fs = require('fs');
const path = require('path');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
for (const file of ['index.html', 'about.html']) {
  fs.copyFileSync(file, path.join('dist', file));
}
for (const dir of ['assets', 'public']) {
  fs.cpSync(dir, path.join('dist', dir), { recursive: true });
}
console.log('Built to dist/');
