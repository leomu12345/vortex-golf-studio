import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = 8731;
const W = 3200, H = 2000;  // high-res CAD output (client: "as high resolution as possible")

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(PORT, r));
console.log('server on', PORT);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
  protocolTimeout: 180000,
  timeout: 120000,
  args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    '--ignore-gpu-blocklist', '--enable-webgl', '--enable-unsafe-swiftshader',
    `--window-size=${W},${H}`,
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('console', (m) => { const t = m.text(); if (m.type()==='error' || /error|fail/i.test(t)) console.log('PAGE>', t); });
page.on('pageerror', (e) => console.log('PAGEERR>', e.message));

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
await page.evaluate(() => { for (const id of ['bar','label','hint']) { const e=document.getElementById(id); if(e) e.style.display='none'; } });
await page.evaluate((w,h)=>window.__studio.setSize(w,h), W, H);

const names = await page.evaluate(() => window.__studio.views);
const outDir = path.join(ROOT, 'renders');
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < names.length; i++) {
  await page.evaluate((idx) => { window.__studio.setView(idx); }, i);
  // let damping settle + textures/reflector update over several frames
  await page.evaluate(() => new Promise((res) => {
    let n = 0; const tick = () => { window.__studio.renderNow(); if (++n > 12) res(); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  const file = path.join(outDir, `view-${String(i+1).padStart(2,'0')}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('saved', path.basename(file), '—', names[i]);
}

// export GLB model
try {
  const b64 = await page.evaluate(() => window.__studio.exportGLB());
  fs.writeFileSync(path.join(ROOT, 'vortex-golf-studio.glb'), Buffer.from(b64, 'base64'));
  console.log('saved vortex-golf-studio.glb');
} catch (e) { console.log('GLB export failed:', e.message); }

await browser.close();
server.close();
console.log('done');
