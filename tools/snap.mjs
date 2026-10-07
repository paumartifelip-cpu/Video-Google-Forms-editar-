// Uso: node tools/snap.mjs <outDir> t1 t2 ...  → PNG 1920×1080 de cada instante (seek determinista)
import { createRequire } from "module"; const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
import path from "path"; import fs from "fs";
const [out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const V = process.env.VERTICAL === "1", FILE = V ? "rumbo-motion-vertical.html" : "rumbo-motion.html";
const VP = process.env.VW ? { width:+process.env.VW, height:+process.env.VH } : (V ? { width:1080, height:1920 } : { width:1920, height:1080 });
const file = "file://" + path.resolve(path.dirname(new URL(import.meta.url).pathname), "../" + FILE) + "?controls=0&autoplay=0" + (process.env.Q||"");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: VP, deviceScaleFactor: +(process.env.DPR||1) });
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" || m.type()==="assert") errs.push(m.text()); });
await p.goto(file); await p.waitForFunction(() => window.__ready);
for (const t of ts) { await p.evaluate(t => window.rumbo.seek(+t), t); await p.screenshot({ path: `${out}/t${(+t).toFixed(2).padStart(5,"0")}.png` }); }
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors"); await b.close();
