// Core: easing, colour, liquid-glass drawing, sprites, metaball morph, camera moves.
(function () {
  const W = 1080, H = 1920, CX = 540, CY = 960;
  const C = { B: "#4285F4", R: "#EA4335", Y: "#FBBC05", G: "#34A853", K: "#202124", W: "#ffffff" };
  const GC = [C.B, C.R, C.Y, C.G];

  // ---------------------------------------------------------------- math & easing
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  // easeInOutExpo == cubic-bezier(0.87, 0, 0.13, 1) family: almost still, a brutal shot, a soft brake
  const expo = (p) => { p = clamp(p); return p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2; };
  const sine = (p) => -(Math.cos(Math.PI * clamp(p)) - 1) / 2;
  const outExpo = (p) => { p = clamp(p); return p === 1 ? 1 : 1 - Math.pow(2, -10 * p); };
  // expo with a 4.5 % overshoot that settles back: every arrival
  const os = (p, a = 0.045) => { p = clamp(p); if (p < 0.82) return expo(p / 0.82) * (1 + a); return 1 + a - a * sine((p - 0.82) / 0.18); };
  const tw = (t, t0, d, f = expo) => f((t - t0) / d);
  const bell = (p) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p));
  // closed-form decaying spring kick (for squash / wobble after an impact)
  const kick = (t, t0, freq = 6, damp = 7) => (t < t0 ? 0 : Math.exp(-(t - t0) * damp) * Math.sin((t - t0) * freq * 2 * Math.PI));
  function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------------------------------------------------------- colour
  const hex2 = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hex2(h); return `rgba(${r},${g},${b},${a})`; };
  const mixc = (h1, h2, p) => { const a = hex2(h1), b = hex2(h2); return "#" + a.map((v, i) => Math.round(lerp(v, b[i], p)).toString(16).padStart(2, "0")).join(""); };
  const lighten = (h, p) => mixc(h, "#ffffff", p);
  const darken = (h, p) => mixc(h, "#000000", p);

  // ---------------------------------------------------------------- liquid glass
  // Translucent body, refraction-ish gradient, top sheen, specular streak, caustic glow, white rim.
  function glass(c, path, col, o = {}) {
    const bb = o.bb || [-100, -100, 200, 200];
    const [x, y, w, h] = bb;
    const a = o.alpha ?? 0.84;
    c.save();
    if (!o.noShadow) {
      c.shadowColor = rgba(darken(col, 0.1), o.shadowA ?? 0.3);
      c.shadowBlur = o.sb ?? 30;
      c.shadowOffsetY = o.so ?? 16;
    }
    const g = c.createLinearGradient(x, y, x + w * 0.55, y + h);
    g.addColorStop(0, rgba(lighten(col, 0.5), a * 0.85));
    g.addColorStop(0.5, rgba(col, a * 0.86));
    g.addColorStop(1, rgba(darken(col, 0.14), a));
    c.fillStyle = g;
    c.fill(path);
    c.shadowColor = "transparent";
    c.clip(path);
    // refraction band: a darker diagonal where the glass is thickest
    const g4 = c.createLinearGradient(x, y + h, x + w, y);
    g4.addColorStop(0.0, "rgba(0,0,0,0)");
    g4.addColorStop(0.62, "rgba(0,0,0,0)");
    g4.addColorStop(0.72, rgba(darken(col, 0.35), 0.18));
    g4.addColorStop(0.8, "rgba(0,0,0,0)");
    c.fillStyle = g4; c.fillRect(x, y, w, h);
    const g2 = c.createLinearGradient(0, y, 0, y + h * 0.5);
    g2.addColorStop(0, "rgba(255,255,255,0.62)");
    g2.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g2; c.fillRect(x, y, w, h * 0.5);
    c.fillStyle = "rgba(255,255,255,0.55)";
    c.beginPath(); c.ellipse(x + w * 0.27, y + h * 0.16, w * 0.17, Math.max(2, h * 0.045), -0.45, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.beginPath(); c.ellipse(x + w * 0.42, y + h * 0.24, w * 0.05, Math.max(1.5, h * 0.02), -0.45, 0, 7); c.fill();
    const g3 = c.createRadialGradient(x + w * 0.62, y + h * 0.98, 0, x + w * 0.62, y + h * 0.98, Math.max(w, h) * 0.55);
    g3.addColorStop(0, rgba(lighten(col, 0.65), 0.6));
    g3.addColorStop(1, rgba(col, 0));
    c.fillStyle = g3; c.fillRect(x, y, w, h);
    c.restore();
    c.save();
    c.lineJoin = "round";
    c.lineWidth = o.lw ?? 4;
    c.strokeStyle = "rgba(255,255,255,0.92)";
    c.stroke(path);
    c.lineWidth = (o.lw ?? 4) * 0.45;
    c.strokeStyle = rgba(darken(col, 0.3), o.rimA ?? 0.5);
    c.stroke(path);
    c.restore();
  }
  // soft colour light thrown on the ground by a glass object
  function caustic(c, x, y, rx, ry, col, a = 0.35) {
    c.save();
    c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(lighten(col, 0.2), a));
    g.addColorStop(0.5, rgba(col, a * 0.35));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 7); c.fill();
    c.restore();
  }
  const P = {
    rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; },
    circle(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; },
    ellipse(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; },
    poly(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; },
    star(r1, r2, n = 5) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n; const r = i % 2 ? r2 : r1; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return P.poly(pts); },
  };

  // ---------------------------------------------------------------- glass text sprites
  const FONT = "InterX";
  const spriteCache = new Map();
  function textSprite(text, size, col, o = {}) {
    const key = [text, size, col, o.ink || "", o.weight || 900].join("|");
    if (spriteCache.has(key)) return spriteCache.get(key);
    const pad = Math.round(size * 0.35);
    const m = document.createElement("canvas").getContext("2d");
    m.font = `${o.weight || 900} ${size}px ${FONT}`;
    const tw_ = Math.ceil(m.measureText(text).width);
    const cv = document.createElement("canvas");
    cv.width = tw_ + pad * 2; cv.height = Math.ceil(size * 1.25) + pad * 2;
    const c = cv.getContext("2d");
    c.font = `${o.weight || 900} ${size}px ${FONT}`;
    c.textBaseline = "alphabetic";
    const bx = pad, by = pad + size * 0.98;
    const top = by - size * 0.75, hgt = size * 0.78;
    c.save();
    c.shadowColor = rgba(darken(col, 0.15), 0.35); c.shadowBlur = size * 0.12; c.shadowOffsetY = size * 0.06;
    const g = c.createLinearGradient(bx, top, bx + tw_ * 0.4, top + hgt);
    g.addColorStop(0, rgba(lighten(col, 0.45), 0.92));
    g.addColorStop(0.55, rgba(col, 0.9));
    g.addColorStop(1, rgba(darken(col, 0.18), 0.96));
    c.fillStyle = g; c.fillText(text, bx, by);
    c.restore();
    c.save();
    c.globalCompositeOperation = "source-atop";
    const g2 = c.createLinearGradient(0, top - size * 0.05, 0, top + hgt * 0.5);
    g2.addColorStop(0, "rgba(255,255,255,0.6)"); g2.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g2; c.fillRect(0, 0, cv.width, top + hgt * 0.5);
    const g3 = c.createRadialGradient(bx + tw_ * 0.7, top + hgt, 0, bx + tw_ * 0.7, top + hgt, tw_ * 0.5);
    g3.addColorStop(0, rgba(lighten(col, 0.7), 0.55)); g3.addColorStop(1, rgba(col, 0));
    c.fillStyle = g3; c.fillRect(0, 0, cv.width, cv.height);
    c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = size * 0.035; c.lineCap = "round";
    c.beginPath(); c.moveTo(bx + tw_ * 0.08, top + hgt * 0.12); c.lineTo(bx + tw_ * 0.3, top + hgt * 0.06); c.stroke();
    c.restore();
    c.lineJoin = "round";
    c.lineWidth = Math.max(2, size * 0.022); c.strokeStyle = "rgba(255,255,255,0.95)"; c.strokeText(text, bx, by);
    c.lineWidth = Math.max(1, size * 0.008); c.strokeStyle = rgba(darken(col, 0.35), 0.6); c.strokeText(text, bx, by);
    const s = { cv, w: cv.width, h: cv.height, ax: bx + tw_ / 2, ay: by - size * 0.36, tw: tw_ };
    spriteCache.set(key, s);
    return s;
  }
  // draw a sprite centred on (x, y)
  function drawSprite(c, s, x, y, sc = 1, rot = 0, alpha = 1, sx = 1, sy = 1) {
    if (alpha <= 0) return;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(rot); c.scale(sc * sx, sc * sy);
    c.drawImage(s.cv, -s.ax, -s.ay); c.restore();
  }
  // render any draw function into a sprite (for caching heavy static glass)
  function bake(w, h, fn) { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d"); fn(c); return { cv, w, h, ax: w / 2, ay: h / 2 }; }

  // ---------------------------------------------------------------- metaball morph
  // Sample a sprite's filled pixels into circles; morph two samplings through a gooey threshold.
  function samplePoints(drawFn, n, seed = 3) {
    const cv = document.createElement("canvas"); cv.width = W / 4; cv.height = H / 4;
    const c = cv.getContext("2d"); c.scale(0.25, 0.25); drawFn(c);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    const pts = [];
    for (let y = 0; y < cv.height; y += 3) for (let x = 0; x < cv.width; x += 3) if (d[(y * cv.width + x) * 4 + 3] > 140) pts.push([x * 4 + 6, y * 4 + 6]);
    const rnd = mulberry(seed);
    while (pts.length > n) pts.splice(Math.floor(rnd() * pts.length), 1);
    while (pts.length < n && pts.length) pts.push(pts[Math.floor(rnd() * pts.length)]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    pts.sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
    return { pts, cx, cy };
  }
  const gooCv = document.createElement("canvas"); gooCv.width = W / 2; gooCv.height = H / 2;
  const goo = gooCv.getContext("2d", { willReadFrequently: true });
  const gooOut = document.createElement("canvas"); gooOut.width = W / 2; gooOut.height = H / 2;
  const gooOc = gooOut.getContext("2d");
  function morph(c, A, B, p, colA, colB, o = {}) {
    const n = A.pts.length;
    const r = o.r ?? 26;
    goo.setTransform(1, 0, 0, 1, 0, 0);
    goo.clearRect(0, 0, W / 2, H / 2);
    goo.scale(0.5, 0.5);
    goo.fillStyle = "#000";
    for (let i = 0; i < n; i++) {
      const stag = (i / n) * 0.35;
      const q = expo(clamp((p - stag) / 0.65));
      const a = A.pts[i], b = B.pts[i];
      // swirl the droplets through the middle of the move
      const sw = bell(q) * (o.swirl ?? 120);
      const ang = i * 2.399;
      const x = lerp(a[0], b[0], q) + Math.cos(ang) * sw;
      const y = lerp(a[1], b[1], q) + Math.sin(ang) * sw;
      const rr = r * (1 + 0.5 * bell(q));
      goo.beginPath(); goo.arc(x, y, rr, 0, 7); goo.fill();
    }
    goo.setTransform(1, 0, 0, 1, 0, 0);
    // gooey threshold: blur then hard alpha cut
    gooOc.clearRect(0, 0, W / 2, H / 2);
    gooOc.filter = "blur(7px)"; gooOc.drawImage(gooCv, 0, 0); gooOc.filter = "none";
    const img = gooOc.getImageData(0, 0, W / 2, H / 2), d = img.data;
    for (let i = 3; i < d.length; i += 4) { const v = d[i]; d[i] = v > 110 ? 255 : v > 80 ? (v - 80) * 8 : 0; }
    gooOc.putImageData(img, 0, 0);
    // tint as glass
    gooOc.globalCompositeOperation = "source-in";
    const col = mixc(colA, colB, sine(p));
    const g = gooOc.createLinearGradient(0, 0, W / 4, H / 2);
    g.addColorStop(0, rgba(lighten(col, 0.5), 0.92)); g.addColorStop(1, rgba(darken(col, 0.12), 0.95));
    gooOc.fillStyle = g; gooOc.fillRect(0, 0, W / 2, H / 2);
    gooOc.globalCompositeOperation = "source-atop";
    const g2 = gooOc.createLinearGradient(0, 0, 0, H / 2);
    g2.addColorStop(0, "rgba(255,255,255,0.45)"); g2.addColorStop(0.5, "rgba(255,255,255,0)");
    gooOc.fillStyle = g2; gooOc.fillRect(0, 0, W / 2, H / 2);
    gooOc.globalCompositeOperation = "source-over";
    c.save(); c.imageSmoothingQuality = "high";
    c.shadowColor = rgba(col, 0.3); c.shadowBlur = 30; c.shadowOffsetY = 14;
    c.drawImage(gooOut, 0, 0, W, H); c.restore();
  }

  // ---------------------------------------------------------------- camera moves
  // Zoom THROUGH an anchor of world A into world B (B is born inside A), or the reverse pull-back.
  function blobClip(c, x, y, r, t) {
    c.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (1 + 0.035 * Math.sin(a * 5 + t * 9) + 0.02 * Math.sin(a * 9 - t * 13));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }
  function zoomIn(c, t, t0, d, A, B, an) {
    const raw = (t - t0) / d;
    const p = os(raw, 0.04);
    const pe = expo(raw);
    const K = 1150 / an.r;
    const sA = Math.pow(K, p);
    const Sx = lerp(an.x, CX, pe), Sy = lerp(an.y, CY, pe);
    const R = an.r * sA;
    if (R < 1300) {
      c.save(); c.translate(Sx, Sy); c.scale(sA, sA); c.translate(-an.x, -an.y); A(c, t); c.restore();
    }
    c.save();
    if (R < 1300) { blobClip(c, Sx, Sy, R, t); c.clip(); }
    c.translate(Sx, Sy); c.scale(sA / K, sA / K); c.translate(-CX, -CY); B(c, t);
    c.restore();
    if (R < 1300 && R > 4) {
      c.save(); blobClip(c, Sx, Sy, R, t);
      c.lineWidth = 6 + R * 0.02; c.strokeStyle = "rgba(255,255,255,0.8)"; c.stroke();
      c.lineWidth = 2; c.strokeStyle = "rgba(66,133,244,0.35)"; c.stroke(); c.restore();
    }
  }
  function zoomOut(c, t, t0, d, A, B, an, innerFade = true) {
    const raw = (t - t0) / d;
    const p = os(raw, 0.04);
    const pe = expo(raw);
    const K = 1150 / an.r;
    const sB = Math.pow(K, 1 - p);
    const Sx = lerp(CX, an.x, pe), Sy = lerp(CY, an.y, pe);
    const R = an.r * sB;
    c.save(); c.translate(Sx, Sy); c.scale(sB, sB); c.translate(-an.x, -an.y); B(c, t); c.restore();
    const fa = innerFade ? 1 - clamp((raw - 0.7) / 0.3) : 1;
    if (fa > 0) {
      c.save(); blobClip(c, Sx, Sy, R, t); c.clip();
      c.globalAlpha = fa;
      c.translate(Sx, Sy); c.scale(sB / K, sB / K); c.translate(-CX, -CY); A(c, t);
      c.restore();
      c.save(); blobClip(c, Sx, Sy, R, t); c.lineWidth = 6; c.strokeStyle = rgba("#ffffff", 0.8 * fa); c.stroke(); c.restore();
    }
  }
  function pan(c, t, t0, d, A, B, dx, dy) {
    const p = os((t - t0) / d, 0.03);
    c.save(); c.translate(dx * p, dy * p); A(c, t); c.restore();
    c.save(); c.translate(-dx * (1 - p), -dy * (1 - p)); B(c, t); c.restore();
  }

  window.K = { W, H, CX, CY, C, GC, clamp, lerp, expo, sine, outExpo, os, tw, bell, kick, mulberry, rgba, mixc, lighten, darken,
    glass, caustic, P, textSprite, drawSprite, bake, samplePoints, morph, zoomIn, zoomOut, pan, FONT };
})();
