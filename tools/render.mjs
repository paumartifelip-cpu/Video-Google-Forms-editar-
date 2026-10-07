// Renderiza rumbo-motion.html a MP4 1920×1080 recorriendo el reloj maestro fotograma a fotograma.
// Uso: node tools/render.mjs [fps=60] [salida=rumbo-motion.mp4]
import { createRequire } from "module"; const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
import path from "path"; import { spawn } from "child_process";
const fps = +(process.argv[2] || 60), root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.resolve(root, process.argv[3] || "rumbo-motion.mp4");
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto("file://" + root + "/rumbo-motion.html?controls=0&autoplay=0"); await p.waitForFunction(() => window.__ready);
const dur = await p.evaluate(() => window.rumbo.duration), N = Math.round(dur * fps);
const ff = spawn("ffmpeg", ["-loglevel","error","-y","-f","image2pipe","-framerate",String(fps),"-i","-",
  "-c:v","libx264","-preset","slow","-crf","16","-pix_fmt","yuv420p","-movflags","+faststart", out], { stdio: ["pipe","inherit","inherit"] });
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await p.evaluate(t => window.rumbo.seek(t), i / fps);
  const buf = await p.screenshot({ type: "png" });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 150 === 0) console.log(`frame ${i}/${N} · ${((Date.now()-t0)/1000).toFixed(0)}s`);
}
ff.stdin.end(); await new Promise(r => ff.on("close", r)); await b.close();
console.log("OK", out, N, "frames");
