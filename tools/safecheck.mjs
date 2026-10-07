// Comprueba que la información esencial de la versión vertical queda dentro de la zona segura
// (x 80–920, y 180–1600) en el momento de lectura de cada escena.
import { createRequire } from "module"; const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
import path from "path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + root + "/rumbo-motion-vertical.html?controls=0&autoplay=0"); await p.waitForFunction(() => window.__ready);
const checks = { 2.2:".cap", 5.0:".cap,.form .ttl,.inp,.btn,.chip", 6.05:".card .lbl,.card .amt", 9.5:".cap,.valLbl,.axisLbl", 11.2:".cap,.brk", 12.6:".cap,.brk", 13.6:".cap,#eq",
  18.0:".cap,.g-eye,.g-pct,.g-big,.g-l,.g-r,.g-chip", 21.3:".cap,.logo,.greet,.s-eye,.s-amt,.g-pct,.g-big", 24.8:"#brand .l,#tagline,#cta,#url" };
let bad = 0;
for (const [t, sel] of Object.entries(checks)) {
  await p.evaluate(t => window.rumbo.seek(+t), t);
  // mide el texto real (Range) y descarta lo que es fondo: opacidad efectiva < 0.5 (tarjetas fantasma desenfocadas)
  const out = await p.evaluate(sel => [...document.querySelectorAll(sel)].map(e => {
      let o=1, n=e; while(n && n.id!=="stage"){ const c=getComputedStyle(n); if(c.visibility==="hidden") o=0; o*=+c.opacity; n=n.parentElement; }
      const rg=document.createRange(); rg.selectNodeContents(e); const r=rg.getBoundingClientRect();
      return { o, el:(e.className||e.id)+":"+e.textContent.trim().slice(0,22), x0:r.left, x1:r.right, y0:r.top, y1:r.bottom, w:r.width }; })
    .filter(r => r.o>=0.5 && r.w>0 && (r.x0 < 79 || r.x1 > 921 || r.y0 < 179 || r.y1 > 1601)), sel);
  console.log(`t=${t}s ${out.length ? "FUERA: " + out.map(o => `${o.el} [${o.x0|0},${o.y0|0}–${o.x1|0},${o.y1|0}]`).join(" | ") : "ok"}`); bad += out.length;
}
console.log(bad ? `${bad} elementos fuera de la zona segura` : "Toda la información esencial está dentro de la zona segura"); await b.close();
