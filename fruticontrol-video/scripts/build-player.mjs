// Genera dist/FrutiControl-25s.html: la composición HyperFrames (index.html) + un reproductor
// con controles, todo en un único archivo sin dependencias externas (GSAP, fuentes y logo incrustados).
// Uso: node scripts/build-player.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p));
const b64 = (p, mime) => `data:${mime};base64,${read(p).toString("base64")}`;

let html = read("index.html").toString("utf8");

const gsap = read("vendor/gsap.min.js").toString("utf8").replace(/<\/script/gi, "<\\/script");
html = html.replace('<script src="vendor/gsap.min.js"></script>', () => `<script>${gsap}</script>`);
html = html.replace(/url\("(assets\/fonts\/[^"]+\.woff2)"\)/g, (_, p) => `url("${b64(p, "font/woff2")}")`);
html = html.replaceAll('src="assets/fruticontrol-logo.png"', `src="${b64("assets/fruticontrol-logo.png", "image/png")}"`);

const playerCss = `
<style id="player-css">
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0f2419; }
  #pl-stage { position: fixed; left: 0; top: 0; right: 0; bottom: 64px; display: flex; align-items: center; justify-content: center; }
  body.pl-hidden #pl-stage { bottom: 0; }
  #pl-box { position: relative; width: 1920px; height: 1080px; transform-origin: 0 0; flex: none; }
  #pl-box #root { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #pl-bar { position: fixed; left: 0; right: 0; bottom: 0; height: 64px; display: flex; align-items: center; gap: 14px; padding: 0 18px;
    background: #102a1c; color: #e6f4ec; font: 600 14px/1 system-ui, sans-serif; user-select: none; }
  body.pl-hidden #pl-bar { display: none; }
  #pl-bar button { height: 38px; min-width: 38px; padding: 0 14px; border: 0; border-radius: 6px; background: #2c9a5e; color: #fff;
    font: 700 14px/1 system-ui, sans-serif; cursor: pointer; }
  #pl-bar button.sec { background: #1f4a33; }
  #pl-bar button:focus-visible { outline: 2px solid #b1e1c3; outline-offset: 2px; }
  #pl-seek { flex: 1; accent-color: #2c9a5e; }
  #pl-time { width: 120px; text-align: right; font-variant-numeric: tabular-nums; }
  #pl-hint { position: fixed; right: 14px; bottom: 12px; font: 600 12px system-ui, sans-serif; color: rgba(255,255,255,.0); pointer-events: none; transition: color .4s; }
  body.pl-hidden #pl-hint.show { color: rgba(255,255,255,.55); }
  #pl-load { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; color: #b1e1c3; font: 600 18px system-ui, sans-serif; background: #0f2419; z-index: 9; }
</style>`;

const playerHtml = `
<div id="pl-load">Cargando FrutiControl…</div>
<div id="pl-stage"><div id="pl-box"></div></div>
<div id="pl-bar">
  <button id="pl-play" aria-label="Reproducir o pausar">▶ Reproducir</button>
  <button id="pl-restart" class="sec" aria-label="Reiniciar">⟲ Reiniciar</button>
  <input id="pl-seek" type="range" min="0" max="25" step="0.001" value="0" aria-label="Línea de tiempo" />
  <span id="pl-time">0.00 / 25.00 s</span>
  <button id="pl-hide" class="sec" aria-label="Ocultar controles">Ocultar controles (H)</button>
</div>
<div id="pl-hint">Pulsa H para mostrar los controles</div>
<script id="player-js">
(function () {
  const DURATION = 25;
  const tl = window.__timelines && window.__timelines.main;
  const box = document.getElementById("pl-box");
  box.appendChild(document.getElementById("root"));
  const stage = document.getElementById("pl-stage");
  const playBtn = document.getElementById("pl-play");
  const seek = document.getElementById("pl-seek");
  const timeEl = document.getElementById("pl-time");
  const hint = document.getElementById("pl-hint");
  let time = 0, playing = false, last = 0, scrubbing = false;

  function fit() {
    const r = stage.getBoundingClientRect();
    const k = Math.min(r.width / 1920, r.height / 1080);
    box.style.transform = "scale(" + k + ")";
    box.style.width = 1920 * k + "px"; box.style.height = 1080 * k + "px";
  }
  function render() {
    tl.time(time, false);
    if (!scrubbing) seek.value = time;
    timeEl.textContent = time.toFixed(2) + " / " + DURATION.toFixed(2) + " s";
  }
  function setPlaying(p) {
    playing = p;
    playBtn.textContent = p ? "❚❚ Pausa" : "▶ Reproducir";
    if (p) { if (time >= DURATION) time = 0; last = performance.now(); requestAnimationFrame(tick); }
  }
  function tick(now) {
    if (!playing) return;
    time = Math.min(DURATION, time + (now - last) / 1000);
    last = now;
    render();
    if (time >= DURATION) { setPlaying(false); return; }
    requestAnimationFrame(tick);
  }
  function toggleControls() {
    document.body.classList.toggle("pl-hidden");
    hint.classList.add("show");
    setTimeout(() => hint.classList.remove("show"), 1800);
    fit();
  }
  playBtn.onclick = () => setPlaying(!playing);
  document.getElementById("pl-restart").onclick = () => { time = 0; render(); setPlaying(true); };
  document.getElementById("pl-hide").onclick = toggleControls;
  seek.addEventListener("input", () => { scrubbing = true; time = parseFloat(seek.value); render(); });
  seek.addEventListener("change", () => { scrubbing = false; });
  seek.addEventListener("pointerdown", () => { if (playing) setPlaying(false); });
  window.addEventListener("keydown", (e) => {
    if (e.key === "h" || e.key === "H") toggleControls();
    else if (e.code === "Space") { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === "ArrowRight") { setPlaying(false); time = Math.min(DURATION, time + 1 / 60); render(); }
    else if (e.key === "ArrowLeft") { setPlaying(false); time = Math.max(0, time - 1 / 60); render(); }
    else if (e.key === "r" || e.key === "R") { time = 0; render(); setPlaying(true); }
  });
  window.addEventListener("resize", fit);

  // Espera a fuentes e imágenes antes de arrancar
  const imgs = Array.from(document.images).map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()));
  Promise.all([document.fonts.ready, ...imgs]).then(() => {
    fit(); render();
    document.getElementById("pl-load").remove();
    const auto = new URLSearchParams(location.search).get("autoplay") !== "0";
    if (auto) setPlaying(true);
  });
  // API para grabar o automatizar: window.FrutiPlayer.seek(segundos)
  window.FrutiPlayer = { seek: (s) => { setPlaying(false); time = Math.max(0, Math.min(DURATION, s)); render(); }, play: () => setPlaying(true), pause: () => setPlaying(false), duration: DURATION };
})();
</script>`;

html = html.replace("</head>", playerCss + "\n</head>");
html = html.replace(/<\/body>\s*<\/html>\s*$/, playerHtml + "\n</body>\n</html>\n");

mkdirSync(join(root, "dist"), { recursive: true });
const out = join(root, "dist", "FrutiControl-25s.html");
writeFileSync(out, html);
console.log("OK", out, (html.length / 1024).toFixed(0) + " KB");
