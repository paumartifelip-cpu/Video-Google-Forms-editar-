// Fast frame preview: node tools/preview.js out_dir t1 t2 ...   (or a range: --range a b step)
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
(async () => {
  const [out, ...rest] = process.argv.slice(2);
  let ts = rest.map(Number);
  if (rest[0] === '--range') { const [a, b, s] = rest.slice(1).map(Number); ts = []; for (let t = a; t <= b + 1e-9; t += s) ts.push(+t.toFixed(3)); }
  fs.mkdirSync(out, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.__timelines = {}; });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => window.__hf.buildReady.film);
  for (const t of ts) {
    const t0 = Date.now();
    await p.evaluate((t) => window.renderAt(t), t);
    const ms = Date.now() - t0;
    await p.locator('#film').screenshot({ path: `${out}/f_${t.toFixed(2).padStart(6, '0')}.png`, scale: 'css' });
    process.stdout.write(`${t}:${ms}ms `);
  }
  console.log('\n' + (errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors'));
  await b.close(); srv.kill();
})();
