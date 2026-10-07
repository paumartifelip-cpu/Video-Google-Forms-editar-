// Comprueba que la información esencial del vídeo vertical de suscripciones queda dentro de la zona segura
// (x 80–920, y 180–1600) en el momento de lectura de cada escena.
import { createRequire } from "module"; const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
import path from "path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + root + "/rumbo-suscripciones-vertical.html?controls=0&autoplay=0"); await p.waitForFunction(() => window.__ready);
const checks = { 1.0:".cap,.k .nm,.k .pr", 3.4:".cap,.k .nm,.k .pr", 5.3:".form .ttl,.inp,.tog,.btn", 8.5:".cap,.p-ttl,.p-sub,.p-tot,.k .nm,.k .pr", 11.0:".cap,.form .ttl,.inp,.tog,.btn",
  14.5:".cap,.p-ttl,.p-sub,.p-tot,.k .nm,.k .pr", 17.2:".cap,#sub4,.p-ttl,.cur .cd,.cur .cn", 20.0:".cap,#sub4,.cur .cd,.cur .cn", 22.0:".cap,.cur .cd,.k .mn", 24.8:"#brand .l,#tagline,#url" };
let bad = 0;
for (const [t, sel] of Object.entries(checks)) {
  await p.evaluate(t => window.rumbo.seek(+t), t);
  // mide el texto real (Range) y descarta lo que es fondo: opacidad efectiva < 0.5 (tarjetas fantasma desenfocadas)
  const dims = await p.evaluate(() => { const r=document.querySelector("#stage").getBoundingClientRect(); return [r.width,r.height]; });
  if(t==="1") console.log("lienzo:", dims.join("×"), dims[1]>dims[0]?"(vertical ✓)":"(¡no es vertical!)");
  const out = await p.evaluate(sel => [...document.querySelectorAll(sel)].map(e => {
      let o=1, n=e; while(n && n.id!=="stage"){ const c=getComputedStyle(n); if(c.visibility==="hidden") o=0; o*=+c.opacity; n=n.parentElement; }
      const rg=document.createRange(); rg.selectNodeContents(e); const r=rg.getBoundingClientRect();
      return { o, el:(e.className||e.id)+":"+e.textContent.trim().slice(0,22), x0:r.left, x1:r.right, y0:r.top, y1:r.bottom, w:r.width }; })
    .filter(r => r.o>=0.5 && r.w>0 && (r.x0 < 79 || r.x1 > 921 || r.y0 < 179 || r.y1 > 1601)), sel);
  console.log(`t=${t}s ${out.length ? "FUERA: " + out.map(o => `${o.el} [${o.x0|0},${o.y0|0}–${o.x1|0},${o.y1|0}]`).join(" | ") : "ok"}`); bad += out.length;
}
console.log(bad ? `${bad} elementos fuera de la zona segura` : "Toda la información esencial está dentro de la zona segura"); await b.close();
