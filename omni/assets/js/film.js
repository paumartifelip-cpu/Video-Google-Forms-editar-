// The film: one continuous shot. Every world is born inside the previous one.
(function () {
  const { W, H, CX, CY, C, GC, clamp, lerp, expo, sine, outExpo, os, tw, bell, kick, mulberry, rgba, mixc, lighten, darken,
    glass, caustic, P, textSprite, drawSprite, samplePoints, morph, zoomIn, zoomOut, pan } = K;

  // ---------------------------------------------------------------- background: white light + parallax glass layers
  const rnd = mulberry(42);
  const BLOBS = [];
  for (let i = 0; i < 18; i++) {
    BLOBS.push({ x: rnd() * 1400 - 160, y: rnd() * 2300 - 190, r: 70 + rnd() * 190, d: [0.25, 0.5, 0.85][i % 3], col: GC[i % 4],
      shape: i % 3, ph: rnd() * 6.28, rot: rnd() * 6.28 });
  }
  // camera drift used for parallax: each seam pushes the glass layers a bit
  const DRIFT = [[3.6, 0.9, 0, -500], [7.6, 0.9, 220, 300], [11.6, 0.8, 0, 900], [17.6, 0.8, -300, 0], [19.65, 0.45, 700, 0],
    [21.6, 0.8, -200, -300], [23.7, 0.9, 0, 400], [29.6, 0.8, 250, 250], [31.6, 0.8, 0, -400], [33.6, 0.8, -250, 0],
    [37.6, 0.7, 0, -700], [40.6, 0.8, 300, 200], [46.0, 1.9, -150, -300], [54.0, 0.8, 0, 300], [58.0, 1.2, 0, -400]];
  function drift(t) {
    let x = 0, y = 0;
    for (const [t0, d, dx, dy] of DRIFT) { const p = expo((t - t0) / d); x += dx * p; y += dy * p; }
    return [x, y];
  }
  function bg(c, t, o = {}) {
    c.save();
    c.fillStyle = "#ffffff"; c.fillRect(-3000, -3000, 7080, 7920);
    const g = c.createRadialGradient(540, 760, 80, 540, 960, 1400);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, o.tint || "#eaf1fd");
    c.fillStyle = g; c.fillRect(-3000, -3000, 7080, 7920);
    const [dx, dy] = drift(t);
    for (const b of BLOBS) {
      const wrapW = 1400, wrapH = 2300;
      let x = (((b.x + dx * b.d + Math.sin(t * 0.4 + b.ph) * 30) % wrapW) + wrapW) % wrapW - 160;
      let y = (((b.y + dy * b.d + Math.cos(t * 0.33 + b.ph) * 40) % wrapH) + wrapH) % wrapH - 190;
      c.save(); c.translate(x, y); c.rotate(b.rot + t * 0.05 * (b.d - 0.5));
      const r = b.r * (0.55 + b.d * 0.4);
      const path = b.shape === 0 ? P.circle(0, 0, r) : b.shape === 1 ? P.rr(-r, -r * 0.6, r * 2, r * 1.2, r * 0.6) : P.rr(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.35);
      glass(c, path, b.col, { bb: [-r, -r, r * 2, r * 2], noShadow: true, alpha: 0.035 + b.d * 0.035, lw: 1.5, rimA: 0.1 });
      c.restore();
    }
    c.restore();
  }
  function black(c) { c.fillStyle = "#000"; c.fillRect(-3000, -3000, 7080, 7920); }

  // ---------------------------------------------------------------- W0: the sock falls, 1987 cracks, the dove takes it
  const sockPos = (t) => ({ x: 540 + 70 * Math.sin(t * 1.1 + 0.4), y: 430 + 250 * t, r: -0.25 + 0.55 * t });
  const DIGITS = ["1", "9", "8", "7"];
  const CRACKS = (() => {
    const r = mulberry(1987), out = [];
    for (let k = 0; k < 7; k++) {
      let x = 540 + (r() - 0.5) * 120, y = 960 + (r() - 0.5) * 60, a = r() * 6.28;
      const pts = [[x, y]];
      for (let s = 0; s < 9; s++) { a += (r() - 0.5) * 1.1; x += Math.cos(a) * 55; y += Math.sin(a) * 30; pts.push([x, y]); }
      out.push(pts);
    }
    return out;
  })();
  function w0(c, t, o = {}) {
    bg(c, t);
    // 1987: four glass digits; cracked at 1.0 s, then the pieces drift apart
    const alpha1987 = o.alpha1987 ?? 1;
    const crk = t >= 0 ? tw(t, 1.0, 0.35) : 0;
    const sep = t >= 0 ? tw(t, 1.25, 1.6, sine) : 0;
    const fall = t >= 0 ? tw(t, 2.2, 1.6, expo) : 0;
    const appear = o.scale1987 ?? 1;
    if (alpha1987 > 0) {
      const sizes = 330;
      const spr = DIGITS.map((d, i) => textSprite(d, sizes, GC[i]));
      const total = spr.reduce((s, x) => s + x.tw, 0) + 3 * 10;
      let x = 540 - total / 2;
      spr.forEach((s, i) => {
        const cx = x + s.tw / 2; x += s.tw + 10;
        const dir = i - 1.5;
        const px = cx + dir * 46 * sep + dir * 260 * fall;
        const py = 960 + (i % 2 ? 1 : -1) * 18 * sep + 900 * fall * fall * (0.6 + 0.2 * i);
        drawSprite(c, s, px, py, appear, dir * 0.07 * sep + dir * 0.5 * fall, alpha1987 * (1 - fall * 0.6));
      });
      // crack lines
      if (crk > 0 && fall < 0.5) {
        c.save(); c.globalAlpha = 1 - fall * 2; c.lineCap = "round"; c.lineJoin = "round";
        CRACKS.forEach((pts, k) => {
          const n = Math.max(2, Math.floor(pts.length * clamp(crk * 1.4 - k * 0.06)));
          c.beginPath(); for (let i = 0; i < n; i++) { const [x0, y0] = pts[i]; const off = (x0 - 540) * 0.09 * sep; i ? c.lineTo(x0 + off, y0) : c.moveTo(x0 + off, y0); }
          c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 7; c.stroke();
          c.strokeStyle = "rgba(32,33,36,0.55)"; c.lineWidth = 2.2; c.stroke();
        });
        c.restore();
      }
    }
    // the dove: rappels down 2.0-3.0, grabs at 3.15, flies up with the sock
    const down = tw(t, 2.0, 1.0, os);
    const up = tw(t, 3.3, 0.75, expo);
    const grabbed = t >= 3.15;
    const sp = sockPos(Math.min(t, 3.15));
    const dx = lerp(sp.x - 260, sp.x - 230, up) + 380 * up;
    const dy = lerp(-420, sp.y - 330, down) - 1700 * up;
    if (t > 1.9) {
      c.strokeStyle = rgba(C.K, 0.6); c.lineWidth = 5;
      c.beginPath(); c.moveTo(dx + 20, -200); c.lineTo(dx + 20, dy - 60); c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 2; c.stroke();
    }
    // sock
    if (o.sock !== false) {
      c.save();
      if (!grabbed) { c.translate(sp.x, sp.y); c.rotate(sp.r); }
      else {
        const sw = Math.sin((t - 3.15) * 9) * 0.35 * Math.exp(-(t - 3.15) * 1.5);
        c.translate(dx + 140, dy - 40); c.rotate(-1.35 + sw); c.translate(0, 205);
      }
      c.scale(0.95, 0.95);
      CH.sock(c, { knit: o.knit ?? 1 });
      c.restore();
    }
    if (t > 1.9 && dy > -700) { c.save(); c.translate(dx, dy); c.scale(0.85, 0.85); CH.dove(c, t, { flapHz: grabbed ? 9 : 4 }); c.restore(); }
  }

  // ---------------------------------------------------------------- W1: cow, sneeze, OMNI 1.2 FLASH
  const OMNI = (() => {
    const rows = [["O", "M", "N", "I", " ", "1", ".", "2"], ["F", "L", "A", "S", "H"]];
    const out = [];
    const size = 178;
    rows.forEach((row, ri) => {
      const spr = row.map((ch, i) => (ch === " " ? null : textSprite(ch, size, GC[(i + ri * 2) % 4])));
      const widths = row.map((ch, i) => (ch === " " ? 40 : spr[i].tw + 6));
      const total = widths.reduce((a, b) => a + b, 0);
      let x = 540 - total / 2;
      row.forEach((ch, i) => {
        if (ch !== " ") out.push({ ch, s: spr[i], x: x + widths[i] / 2, y: ri ? 560 : 360, rot: ((i * 7 + ri * 3) % 5 - 2) * 0.035 });
        x += widths[i];
      });
    });
    return out;
  })();
  function w1(c, t) {
    bg(c, t, { tint: "#eef6ee" });
    // sneeze: inhale 5.5-6.0, snap at 6.05
    const inh = tw(t, 5.45, 0.55, sine) * (1 - tw(t, 6.0, 0.12, expo));
    const snap = kick(t, 6.05, 3.2, 5);
    const shake = t > 6.05 && t < 7.3 ? Math.sin(t * 90) * 10 * Math.exp(-(t - 6.05) * 3.5) : 0;
    c.save();
    c.translate(540 + shake, 1500);
    c.rotate(-0.12 * inh + 0.1 * snap);
    c.scale(1 - 0.03 * inh + 0.04 * snap, 1 + 0.05 * inh - 0.06 * snap);
    c.translate(-540, -1500);
    c.save(); c.translate(230, 340); c.rotate(0.5 + Math.sin(t * 3) * 0.15); c.scale(0.24, 0.24); CH.sock(c, { sb: 8 }); c.restore();
    CH.cow(c, t, { nostril: 1 + 0.45 * inh, squint: clamp(inh * 1.2 + (t > 6.0 && t < 6.25 ? 0.6 : 0), 0, 0.85), look: Math.sin(t * 1.3) });
    c.restore();
    // snot-mist burst from the nostrils
    if (t > 6.05 && t < 6.9) {
      const q = (t - 6.05) / 0.85;
      c.save(); c.globalAlpha = 0.5 * (1 - q);
      for (let i = 0; i < 14; i++) {
        const a = -Math.PI / 2 + (i - 7) * 0.2;
        const r = 40 + 500 * outExpo(q);
        glass(c, P.circle(540 + Math.cos(a) * r, 1150 + Math.sin(a) * r, 14 + 20 * q), "#cfe0ff", { bb: [0, 0, 1, 1], noShadow: true, lw: 2 });
      }
      c.restore();
    }
    // letters fly out of the nose and stick
    OMNI.forEach((L, i) => {
      const t0 = 6.08 + i * 0.035;
      if (t < t0) return;
      const q = tw(t, t0, 0.55, os);
      const sx = i % 2 ? 650 : 430, sy = 1150;
      const x = lerp(sx, L.x, q), y = lerp(sy, L.y, q) - bell(clamp((t - t0) / 0.62)) * 120;
      const spin = (1 - clamp((t - t0) / 0.5)) * (i % 2 ? 6 : -6);
      const hit = kick(t, t0 + 0.5, 4, 8);
      drawSprite(c, L.s, x, y, (0.3 + 0.7 * clamp(q)) * (1 + 0.12 * hit), L.rot + spin, 1, 1 - 0.1 * hit, 1 + 0.1 * hit);
    });
  }
  const O_ANCHOR = { x: OMNI[0].x, y: OMNI[0].y, r: 34 };

  // ---------------------------------------------------------------- W2: cactus types, the typewriter blooms, a lighthouse dances salsa
  const KEY_T = Array.from({ length: 11 }, (_, i) => 8.3 + i * 0.13 + (i % 3 === 0 ? 0.03 : 0));
  const PAPER_TXT = "un faro bailando salsa";
  function w2(c, t) {
    bg(c, t, { tint: "#fdf6e3" });
    const open = tw(t, 9.95, 0.7, os);
    const typed = KEY_T.filter((k) => t >= k).length;
    let arm = 0, press = -1;
    for (let i = 0; i < KEY_T.length; i++) { const d = t - KEY_T[i]; if (d > -0.07 && d < 0.08) { arm = Math.max(arm, 1 - Math.abs(d) / 0.08); if (d >= 0) press = (i * 5) % 24; } }
    // paper rising, flies away on the bloom
    const ph = 120 + typed * 22;
    const pfly = tw(t, 9.95, 0.6, expo);
    if (pfly < 1) {
      c.save(); c.translate(0, -900 * pfly); c.rotate(-0.3 * pfly);
      CH.paper(c, 540, 960, ph, PAPER_TXT.slice(0, Math.round((typed / KEY_T.length) * PAPER_TXT.length)), 1 - pfly);
      c.restore();
    }
    CH.typewriter(c, t, { open, pressKey: press });
    // lighthouse grows out of the flower
    const rise = tw(t, 10.15, 0.65, os);
    if (rise > 0) {
      const beat = (t - 10.5) * 2; // half-beat clock (120 BPM)
      const salsa = Math.sin(beat * Math.PI) * (1 - 0.3 * Math.cos(beat * Math.PI * 2));
      c.save(); c.translate(540, 1180 + (1 - rise) * 400); c.scale(rise, rise);
      CH.lighthouse(c, t, { sway: salsa * 0.35 * clamp((t - 10.6) / 0.3), hip: Math.sin(beat * Math.PI * 0.5) * clamp((t - 10.6) / 0.3), arms: 0.5 + 0.5 * Math.sin(t * 8), beam: -2.6 + Math.sin(t * 1.6) * 0.5 });
      c.restore();
    }
    // the cactus slides away as the flower opens
    const out = tw(t, 9.9, 0.55, expo);
    c.save(); c.translate(250 - 700 * out, 880); c.rotate(-0.4 * out); CH.cactus(c, t, { arm }); c.restore();
  }

  // ---------------------------------------------------------------- W3: the lift arrives from the sky, empty but for the sock
  function w3(c, t) {
    bg(c, t, { tint: "#e8f4ec" });
    const arrive = tw(t, 12.0, 0.75, os);
    const y = lerp(-900, 930, arrive);
    const open = tw(t, 12.8, 0.45, expo);
    c.save(); c.translate(540, y);
    CH.elevator(c, t, { open, ding: t > 12.75, inner: (cc) => {
      if (open <= 0) return;
      const wave = Math.sin((t - 12.9) * 2 * Math.PI * 2.2) * 0.3 * clamp((t - 13.0) / 0.2);
      cc.save(); cc.translate(-40, 230); cc.rotate(wave); cc.translate(0, -120); cc.scale(0.62, 0.62);
      CH.sock(cc, {}); cc.restore();
    } });
    c.restore();
  }
  function w3dark(c, t) { black(c); }

  // ---------------------------------------------------------------- W4: black hit, the 3 beats like a heart
  function heart(t) { let s = 0; for (const b of [14.5, 15.0, 15.5]) if (t >= b) s += Math.exp(-(t - b) * 9) * 0.13 * (t - b < 0.06 ? (t - b) / 0.06 : 1); return s; }
  function draw3(c, t, alpha = 1) {
    const s3 = textSprite("3", 760, "#ffffff");
    const inS = tw(t, 13.95, 0.5, os);
    drawSprite(c, s3, 540, 960, (0.6 + 0.4 * inS) * (1 + heart(t)), 0, alpha * clamp(inS * 2));
  }
  function w4(c, t) { black(c); draw3(c, t); }

  // ---------------------------------------------------------------- W5: the 1 is a glass flamingo on one leg
  function w5(c, t, o = {}) {
    bg(c, t, { tint: "#fdecea" });
    if (o.noFlamingo) return;
    c.save(); c.translate(560, 820); c.rotate(Math.sin(t * 2.2) * 0.03); CH.flamingo(c, t); c.restore();
  }
  // ---------------------------------------------------------------- W6: a giant 10; a turtle eats it; the 15 bus brakes
  const BITES = [18.75, 19.15, 19.55];
  let zeroBitten = null;
  function bittenZero(n) {
    if (!zeroBitten) {
      const base = textSprite("0", 640, C.R);
      zeroBitten = [0, 1, 2, 3].map((k) => {
        const cv = document.createElement("canvas"); cv.width = base.w; cv.height = base.h;
        const c = cv.getContext("2d"); c.drawImage(base.cv, 0, 0);
        c.globalCompositeOperation = "destination-out";
        const pts = [[0.86, 0.72], [0.74, 0.86], [0.92, 0.55]];
        for (let i = 0; i < k; i++) { const [px, py] = pts[i]; for (const [ox, oy, r] of [[0, 0, 58], [34, -30, 40], [-36, 30, 40]]) { c.beginPath(); c.arc(base.w * px + ox, base.h * py + oy, r, 0, 7); c.fill(); } }
        return { cv, w: base.w, h: base.h, ax: base.ax, ay: base.ay, tw: base.tw };
      });
    }
    return zeroBitten[n];
  }
  function draw10(c, t, a = 1) {
    const one = textSprite("1", 640, C.B);
    const nb = BITES.filter((b) => t >= b + 0.05).length;
    drawSprite(c, one, 330, 860, 1, 0, a);
    drawSprite(c, bittenZero(nb), 700, 860, 1, 0, a);
    // crumbs
    for (const b of BITES) {
      if (t < b || t > b + 1.2) continue;
      const q = (t - b) / 1.2;
      for (let i = 0; i < 6; i++) {
        const ang = -0.4 + i * 0.35;
        glass(c, P.circle(880 + Math.cos(ang) * 200 * q, 1060 + 400 * q * q + Math.sin(ang) * 60 * q, 10), C.R, { bb: [0, 0, 1, 1], noShadow: true, lw: 2, alpha: 0.8 * (1 - q) });
      }
    }
  }
  function w6(c, t) {
    bg(c, t, { tint: "#e9f0fd" });
    const busIn = tw(t, 19.65, 0.45, os);
    if (busIn < 1 || t < 20.2) {
      draw10(c, t);
      // turtle walks in and bites
      const wk = tw(t, 18.15, 0.5, os);
      let lunge = 0, chew = 0;
      for (const b of BITES) { const d = t - b; if (d > -0.12 && d < 0.2) lunge = Math.max(lunge, d < 0 ? 1 + d / 0.12 : 1 - d / 0.2); if (d > 0 && d < 0.4) chew = Math.abs(Math.sin(d * 30)); }
      c.save(); c.translate(lerp(1450, 880, wk), 1100); c.scale(0.8, 0.8); CH.turtle(c, t, { walk: t * (1 - wk), lunge, chew }); c.restore();
    }
    // the bus slams in from the left
    if (t >= 19.6) {
      const x = lerp(-1100, 540, busIn);
      const brake = kick(t, 20.08, 2.2, 6);
      c.save(); c.translate(x, 1010); c.translate(0, 250); c.rotate(-0.06 * brake); c.translate(0, -250);
      c.scale(1 + 0.03 * brake, 1 - 0.03 * brake);
      const door = tw(t, 20.8, 0.3, expo);
      CH.bus(c, t, { sheep: true, door, pop: tw(t, 21.0, 0.3, os), bleat: t > 21.05 && t < 21.7 ? 1 : 0, wheel: busIn * 9 });
      c.restore();
    }
  }
  const BUS_WIN = { x: 540 - 20, y: 1010 - 115, r: 62 };

  // ---------------------------------------------------------------- W8: the 2 is a swan; it dives into a bathtub; the water writes Flow
  function w8(c, t) {
    bg(c, t, { tint: "#e7f0fe" });
    const dive = tw(t, 22.15, 0.42, (p) => p * p);
    const splash = t >= 22.55 ? (t - 22.55) : -1;
    const level = tw(t, 22.55, 0.5, os);
    c.save(); c.translate(540, 1330); CH.tub(c, t, { level }); c.restore();
    if (t < 22.6) {
      c.save();
      const sx = lerp(540, 560, dive), sy = lerp(640, 1250, dive);
      c.beginPath(); c.rect(-1000, -3000, 3080, 1280 + 3000); c.clip();
      c.translate(sx, sy); c.rotate(lerp(0, 2.3, dive)); c.scale(lerp(1, 0.55, dive), lerp(1, 0.55, dive));
      CH.swan(c, t); c.restore();
    }
    // splash droplets
    if (splash >= 0 && splash < 1.2) {
      const r = mulberry(22);
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 500 + r() * 900;
        const x = 540 + Math.cos(a) * v * splash, y = 1260 + Math.sin(a) * v * splash + 1400 * splash * splash;
        glass(c, P.circle(x, y, 12 + r() * 16), C.B, { bb: [x - 20, y - 20, 40, 40], noShadow: true, lw: 2, alpha: 0.8 * (1 - splash / 1.2) });
      }
    }
    // overflow into a river that writes "Flow"
    const flow = tw(t, 22.8, 1.0, expo);
    if (flow > 0) {
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      const pts = [[860, 1270], [960, 1150], [980, 980], [880, 880], [760, 860]];
      const n = 40, k = Math.floor(n * clamp(flow * 1.6));
      c.beginPath();
      for (let i = 0; i <= k; i++) {
        const u = i / n * (pts.length - 1), j = Math.min(pts.length - 2, Math.floor(u)), f = u - j;
        const x = lerp(pts[j][0], pts[j + 1][0], f) + Math.sin(i * 0.7 + t * 8) * 6, y = lerp(pts[j][1], pts[j + 1][1], f);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.strokeStyle = rgba(C.B, 0.75); c.lineWidth = 46; c.stroke();
      c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 6; c.stroke();
      c.restore();
      // Flow written by the water front
      const fs = textSprite("Flow", 300, C.B);
      const front = clamp((flow - 0.25) / 0.75);
      if (front > 0) {
        const left = 540 - fs.tw / 2, x = left + fs.tw * front;
        c.save(); c.beginPath(); c.rect(-100, 0, x + 20, 1920); c.clip();
        drawSprite(c, fs, 540, 720, 1, 0, 1, 1, 1 + 0.03 * Math.sin(t * 9));
        c.restore();
        if (front < 1) glass(c, P.circle(x, 720 + Math.sin(t * 20) * 10, 70), C.B, { bb: [x - 70, 650, 140, 140], noShadow: true, alpha: 0.6 });
      }
    }
  }

  // ---------------------------------------------------------------- W9: the river pours out of a phone held by the sock (now in a tie)
  const PHONE = { x: 770, y: 760, w: 300, h: 560, rot: -0.1 };
  const PHONE_ANCHOR = { x: PHONE.x, y: PHONE.y, r: 130 };
  const SOCK9 = { x: 470, y: 1180, s: 1.6 };
  const TIE_KNOT = { x: SOCK9.x, y: SOCK9.y + -173 * SOCK9.s, r: 22 };
  function w9(c, t, o = {}) {
    bg(c, t, { tint: "#eef3fd" });
    const bob = Math.sin(t * Math.PI * 2) * 10;
    // the river pours out of the screen down the frame
    c.save(); c.lineCap = "round";
    c.beginPath();
    for (let i = 0; i <= 30; i++) { const u = i / 30; const x = PHONE.x + 60 + Math.sin(u * 6 + t * 6) * 30 * u + 200 * u * u; const y = PHONE.y + 160 + u * 1100; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.strokeStyle = rgba(C.B, 0.7); c.lineWidth = 60; c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 6; c.stroke(); c.restore();
    c.save(); c.translate(SOCK9.x, SOCK9.y + bob); c.scale(SOCK9.s, SOCK9.s); CH.sock(c, { tie: true }); c.restore();
    // the toe curls around the phone
    c.save(); c.translate(PHONE.x, PHONE.y + bob * 0.5); c.rotate(PHONE.rot);
    CH.phone(c, PHONE.w, PHONE.h);
    c.save(); c.beginPath(); c.roundRect(-PHONE.w / 2 + 16, -PHONE.h / 2 + 16, PHONE.w - 32, PHONE.h - 32, 34); c.clip();
    if (o.screen) o.screen(c); else {
      c.fillStyle = lighten(C.B, 0.6); c.fillRect(-200, -300, 400, 600);
      const fs = textSprite("Flow", 110, C.B); drawSprite(c, fs, 0, -60, 1);
      c.fillStyle = rgba(C.B, 0.7); c.fillRect(-200, 120, 400, 200);
    }
    c.restore(); c.restore();
  }

  // ---------------------------------------------------------------- W10: a pineapple in a tuxedo conducts an orchestra of microwaves
  const MW = [[200, 1260], [540, 1290], [880, 1260], [290, 1480], [790, 1480]];
  const MW_T = [30.4, 30.58, 30.76, 30.94, 31.12, 31.3, 31.48];
  function w10(c, t) {
    bg(c, t, { tint: "#fff8e1" });
    // stage spotlights
    c.save(); c.globalCompositeOperation = "multiply";
    c.restore();
    const beatPh = ((t - 30.0) * 2) % 1;
    const baton = Math.sin(((t - 30.0) * 2) * Math.PI);
    MW.forEach(([x, y], i) => {
      let on = 0; MW_T.forEach((mt, k) => { if (k % MW.length === i && t >= mt) on = Math.max(on, Math.exp(-(t - mt) * 5)); });
      c.save(); c.translate(x, y + kick(t, MW_T[i] || 0, 3, 8) * -20); c.scale(0.95, 0.95); CH.microwave(c, t, { on, door: on * 0.6, sock: i === 1 }); c.restore();
    });
    c.save(); c.translate(540, 760 + Math.abs(Math.sin(t * Math.PI * 2)) * -12); c.rotate(baton * 0.05); CH.pineapple(c, t, { baton }); c.restore();
  }
  const CROWN = { x: 540, y: 760 - 380, r: 60 };

  // ---------------------------------------------------------------- W11: inside the crown, a forest; a deer talks on the phone
  const TREES = (() => { const r = mulberry(5), a = []; for (let i = 0; i < 12; i++) a.push({ x: r() * 1300 - 110, y: 900 + r() * 500, h: 380 + r() * 420, d: 0.4 + r() * 0.8, col: [C.G, darken(C.G, 0.15), lighten(C.G, 0.25), C.B][i % 4] }); return a.sort((p, q) => p.d - q.d); })();
  function w11(c, t) {
    bg(c, t, { tint: "#e6f4ea" });
    const g = c.createLinearGradient(0, 1200, 0, 1920); g.addColorStop(0, rgba(C.G, 0.15)); g.addColorStop(1, rgba(C.G, 0.35));
    c.fillStyle = g; c.fillRect(-2000, 1200, 5080, 3000);
    TREES.forEach((tr) => {
      const x = tr.x + Math.sin(t * 0.8) * 20 * tr.d;
      for (let k = 0; k < 3; k++) {
        const w = tr.h * (0.42 - k * 0.09), y0 = tr.y - k * tr.h * 0.25;
        glass(c, P.poly([[x - w, y0], [x + w, y0], [x, y0 - tr.h * 0.45]]), tr.col, { bb: [x - w, y0 - tr.h * 0.45, w * 2, tr.h * 0.45], noShadow: k > 0, alpha: 0.55 + 0.2 * tr.d, lw: 2 });
      }
    });
    c.save(); c.translate(905, 760); c.rotate(Math.sin(t * 2.5) * 0.25); c.translate(0, 70); c.scale(0.28, 0.28); CH.sock(c, { sb: 8 }); c.restore();
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 3; c.beginPath(); c.moveTo(905, 700); c.lineTo(905, 760); c.stroke();
    const talk = t > 32.3 && t < 33.5 ? Math.abs(Math.sin(t * 22)) : 0;
    c.save(); c.translate(470, 1100); CH.deer(c, t, { talk }); c.restore();
    // speech bubble
    const bub = tw(t, 32.4, 0.4, os);
    if (bub > 0) {
      c.save(); c.translate(BUBBLE.x, BUBBLE.y); c.scale(bub, bub);
      const p = new Path2D(); p.roundRect(-150, -100, 300, 200, 70); p.moveTo(-60, 90); p.lineTo(-110, 170); p.lineTo(10, 95); p.closePath();
      glass(c, p, "#ffffff", { bb: [-150, -100, 300, 270], sb: 20 });
      c.strokeStyle = C.B; c.lineWidth = 9; c.lineCap = "round";
      for (let i = 0; i < 3; i++) { const a = 0.5 + 0.5 * Math.sin(t * 12 - i); c.globalAlpha = 0.4 + 0.6 * a; c.beginPath(); c.arc(-40, 0, 30 + i * 30, -0.7, 0.7); c.stroke(); }
      c.restore();
    }
  }
  const BUBBLE = { x: 760, y: 520, r: 70 };

  // ---------------------------------------------------------------- W12: the moon gets a moustache, sneezes stars; stars become rain going up
  const STARS = (() => { const r = mulberry(36), a = []; for (let i = 0; i < 46; i++) a.push({ a: (i / 46) * Math.PI * 2 + r() * 0.2, d: 280 + r() * 820, s: 0.4 + r() * 0.7, col: GC[i % 4], spin: (r() - 0.5) * 8, rise: 900 + r() * 900 }); return a; })();
  function w12(c, t) {
    bg(c, t, { tint: "#e8eefc" });
    const leave = tw(t, 37.6, 0.7, expo);
    const inh = tw(t, 35.55, 0.5, sine) * (1 - tw(t, 36.05, 0.1, expo));
    const snap = kick(t, 36.1, 3, 6);
    const hit = kick(t, 34.8, 3.5, 7);
    c.save(); c.translate(540, 820 - 1300 * leave);
    c.scale(1 + 0.06 * inh + 0.05 * snap - 0.04 * hit, 1 + 0.06 * inh - 0.05 * snap + 0.05 * hit);
    CH.moon(c, t, { eyesOpen: t > 34.85 && t < 35.5 ? 1 : 0, squint: inh });
    // mustache flies in and sticks
    const m = tw(t, 34.35, 0.45, os);
    if (t > 34.3) {
      c.save(); c.translate(lerp(-900, 0, m), lerp(-500, 70, m)); c.rotate((1 - clamp((t - 34.35) / 0.45)) * 9);
      c.scale(0.75 * (1 + 0.15 * hit), 0.75 * (1 - 0.1 * hit)); CH.mustache(c); c.restore();
    }
    c.restore();
    // stars burst out with the sneeze, then stretch into drops and rise
    if (t >= 36.1) {
      const q = outExpo((t - 36.1) / 1.0);
      const toDrop = tw(t, 37.6, 0.6, expo);
      STARS.forEach((s, i) => {
        const x = 540 + Math.cos(s.a) * s.d * q + Math.sin(t + i) * 8;
        const y = 820 + Math.sin(s.a) * s.d * q * 1.25 - s.rise * toDrop * toDrop - (1 - leave) * 0;
        c.save(); c.translate(x, y); c.rotate(s.spin * (1 - q * 0.8) * (t - 36.1) * (1 - toDrop));
        if (toDrop < 0.5) { c.globalAlpha = 1 - toDrop * 2; if (i === 7) { c.scale(0.3, 0.3); CH.sock(c, { sb: 6 }); } else CH.star(c, s.col, s.s * (0.4 + 0.6 * q)); }
        if (toDrop > 0) { c.globalAlpha = clamp(toDrop * 2); c.scale(1, 1 + toDrop); c.rotate(Math.PI); CH.drop(c, s.s * 0.8); }
        c.restore();
      });
    }
  }

  // ---------------------------------------------------------------- W13: rain falls up, umbrellas fall down; one lands and opens
  const RAIN = (() => { const r = mulberry(38), a = []; for (let i = 0; i < 60; i++) a.push({ x: r() * 1080, y: r() * 2400, v: 900 + r() * 900, s: 0.35 + r() * 0.5 }); return a; })();
  const UMB = [{ x: 200, t0: 37.9, col: C.B, v: 900, rot: 3 }, { x: 860, t0: 38.2, col: C.Y, v: 1100, rot: -2.5 }, { x: 420, t0: 38.7, col: C.G, v: 1000, rot: 2 }];
  function w13(c, t) {
    bg(c, t, { tint: "#e6eefc" });
    RAIN.forEach((d) => {
      const y = ((d.y - d.v * (t - 37.5)) % 2400 + 2400) % 2400 - 240;
      c.save(); c.translate(d.x, y); c.rotate(Math.PI); c.scale(d.s, d.s * 1.8); CH.drop(c, 1); c.restore();
    });
    UMB.forEach((u) => {
      if (t < u.t0) return;
      const y = -400 + u.v * (t - u.t0) + 300 * (t - u.t0) ** 2;
      if (y > 2300) return;
      c.save(); c.translate(u.x, y); c.rotate(u.rot * (t - u.t0)); c.scale(0.8, 0.8); CH.umbrella(c, u.col, 0.15); c.restore();
    });
    if (t > 38.5) { const yy = -300 + 700 * (t - 38.5); c.save(); c.translate(760, yy); c.rotate((t - 38.5) * 4); c.scale(0.3, 0.3); CH.sock(c, { sb: 6 }); c.restore(); }
    // the hero umbrella lands at 40.0 and opens
    const fallP = clamp((t - 38.9) / 1.1);
    const y = lerp(-500, 1250, fallP * fallP);
    const land = kick(t, 40.0, 2.5, 6);
    const open = tw(t, 40.08, 0.45, os);
    if (t > 38.9) {
      c.save(); c.translate(540, y - 120); c.rotate((1 - fallP) * 5);
      c.scale(1.1 * (1 + 0.08 * land), 1.1 * (1 - 0.08 * land)); CH.umbrella(c, C.R, 0.15 + 0.85 * open); c.restore();
    }
  }
  const UMB_ANCHOR = { x: 540, y: 1250 - 120 - 100, r: 110 };

  // ---------------------------------------------------------------- W14/15: grandpa's living room; lamp off (black); lights on
  function w14(c, t) {
    const flick = t > 41.82 && t < 42.0 ? (Math.sin(t * 160) > 0 ? 1 : 0.3) : 1;
    CH.livingRoom(c, t, { lamp: flick });
    if (t >= 43.98) drawGrandpa(c, t);
  }
  function trophySock(c, t, ex, ey) {
    const un = tw(t, 54.25, 1.8, sine); // unravel progress
    if (un >= 1) return;
    c.save(); c.translate(ex + 10, ey - 150); c.rotate(-0.15 + Math.sin(t * 3) * 0.05); c.scale(0.62, 0.62);
    c.beginPath(); c.rect(-200, -260 + 480 * un, 520, 520); c.clip();
    CH.sock(c, {}); c.restore();
  }
  // where the trophy sock sits in world coordinates (used for the thread)
  function trophyPoint(t) { const raise = 1; const ang = lerp(0.4, -1.25, raise); return { x: 560 + 180 + Math.cos(ang) * 230 + 10, y: 1050 - 270 + Math.sin(ang) * 230 - 150 }; }
  function drawGrandpa(c, t) {
    const raise = tw(t, 44.02, 0.6, os);
    c.save(); c.translate(560, 1050);
    CH.grandpa(c, t, { raise, trophy: (cc, ex, ey) => trophySock(cc, t, ex, ey) });
    // padlock above the bare foot
    const pl = tw(t, 46.75, 0.45, os);
    if (pl > 0) {
      let shake = 0;
      if (t > 48) shake = Math.sin(t * 70) * clamp((t - 48) / 4) * 7;
      if (t > 52) shake = 0; // freeze
      c.save(); c.translate(CH.FOOT_BARE.x + shake, CH.FOOT_BARE.y - 175 - (1 - pl) * 300); c.scale(0.5 * pl, 0.5 * pl);
      const ct = Math.min(t, 52);
      CH.padlock(c, ct, { crack: clamp((ct - 48.2) / 3.4), reveal: clamp((ct - 49) / 3), rays: 1 });
      c.restore();
    }
    c.restore();
  }
  const FOOT_WORLD = { x: 560 + CH.FOOT_BARE.x, y: 1050 + CH.FOOT_BARE.y - 100 };

  // ---------------------------------------------------------------- end: the sock unravels into YOUTUBE, then re-knits into frame 1
  const YT = (() => {
    const letters = "YOUTUBE".split("");
    const spr = letters.map((ch, i) => textSprite(ch, 172, [C.R, C.B, C.Y, C.G, C.R, C.B, C.G][i]));
    const total = spr.reduce((s, x) => s + x.tw + 4, 0);
    let x = 540 - total / 2;
    return letters.map((ch, i) => { const cx = x + spr[i].tw / 2; x += spr[i].tw + 4; return { s: spr[i], x: cx, y: 760, t0: 54.55 + i * 0.22 }; });
  })();
  function threadPath(c, pts, w = 7) {
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = rgba(C.R, 0.95); c.lineWidth = w; c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = w * 0.3; c.stroke();
    c.restore();
  }
  function ending(c, t) {
    // thread from the trophy sock to the pen tip
    const tp = trophyPoint(t);
    const dissolve = tw(t, 57.95, 0.6, expo);
    const pts = [];
    const n = YT.filter((L) => t >= L.t0).length;
    if (t >= 54.3) {
      pts.push([tp.x, tp.y + 120], [tp.x - 120, tp.y + 150], [70, 610], [55, YT[0].y + 112]);
      for (let i = 0; i < n; i++) {
        const L = YT[i];
        const q = clamp((t - L.t0) / 0.22);
        const nx = L.x - 50 + 100 * q, ny = L.y + 80 - 40 * Math.sin(q * Math.PI);
        if (i < n - 1 || q >= 1) pts.push([L.x - 40, L.y + 112], [L.x + 40, L.y + 112]); else pts.push([nx, ny + 15]);
      }
      
    }
    // dove crosses the background
    if (t > 56.1 && t < 58.2) {
      const q = (t - 56.1) / 2.0;
      c.save(); c.translate(lerp(1250, -250, q), 300 + Math.sin(q * 9) * 30); c.scale(-0.42, 0.42); CH.dove(c, t, { lamp: true }); c.restore();
    }
    if (pts.length > 1 && dissolve < 1) {
      // on dissolve the thread pulls back toward the knitting point
      const kp = sockPos(-1.2);
      const pp = pts.map(([x, y], i) => [lerp(x, kp.x, dissolve * (1 - i / pts.length * 0.3)), lerp(y, kp.y, dissolve)]);
      threadPath(c, pp, 7);
    }
    YT.forEach((L, i) => {
      if (t < L.t0) return;
      const q = tw(t, L.t0, 0.4, os);
      const d = clamp(dissolve * 1.6 - i * 0.08);
      drawSprite(c, L.s, L.x, L.y + (1 - clamp(q)) * 40, q * (1 - d), (1 - clamp(q)) * 0.4, 1 - d);
    });
    // comment icon pulses with the beat
    const ci = tw(t, 55.9, 0.4, os);
    if (ci > 0 && dissolve < 1) {
      let pulse = 0; for (let b = 56.0; b <= 57.6; b += 0.5) if (t >= b) pulse = Math.max(pulse, Math.exp(-(t - b) * 8) * 0.14);
      c.save(); c.translate(540, 1030); c.scale(ci * (1 + pulse) * (1 - dissolve), ci * (1 + pulse) * (1 - dissolve)); CH.comment(c); c.restore();
    }
  }

  // ---------------------------------------------------------------- the camera: one continuous shot
  function world(c, t) {
    if (t < 3.6) return w0(c, t);
    if (t < 4.5) return zoomOut(c, t, 3.6, 0.9, w0, w1, CH.COW_EYE_L);
    if (t < 7.6) return w1(c, t);
    if (t < 8.5) return zoomIn(c, t, 7.6, 0.9, w1, w2, O_ANCHOR);
    if (t < 11.6) return w2(c, t);
    if (t < 12.4) return pan(c, t, 11.6, 0.8, w2, w3, 0, 1920);
    if (t < 13.7) return w3(c, t);
    if (t < 14.4) return zoomIn(c, t, 13.7, 0.7, (cc, tt) => { cc.save(); cc.translate(540, 930); cc.restore(); w3(cc, tt); }, w4, { x: 540, y: 950, r: 190 });
    if (t < 15.8) return w4(c, t);
    if (t < 16.4) {
      // the 3 liquefies into the flamingo while white floods back from its centre
      const p = clamp((t - 15.8) / 0.55);
      black(c);
      const fl = tw(t, 15.95, 0.4, expo);
      c.save(); c.beginPath(); c.arc(540, 960, 1150 * fl, 0, 7); c.clip(); w5(c, t, { noFlamingo: true }); c.restore();
      morph(c, M3, MF, p, "#ffffff", mixc(C.R, "#ffffff", 0.28));
      return;
    }
    if (t < 17.7) return w5(c, t);
    if (t < 18.15) { w5(c, t, { noFlamingo: true }); morph(c, MF, M10, clamp((t - 17.7) / 0.45), mixc(C.R, "#ffffff", 0.28), C.B, { swirl: 80 }); return; }
    if (t < 21.6) return w6(c, t);
    if (t < 22.4) return zoomIn(c, t, 21.6, 0.8, w6, w8, BUS_WIN);
    if (t < 23.7) return w8(c, t);
    if (t < 24.6) return zoomOut(c, t, 23.7, 0.9, w8, w9, PHONE_ANCHOR);
    if (t < 29.6) return w9(c, t);
    if (t < 30.4) return zoomIn(c, t, 29.6, 0.8, w9, w10, TIE_KNOT);
    if (t < 31.6) return w10(c, t);
    if (t < 32.4) return zoomIn(c, t, 31.6, 0.8, w10, w11, CROWN);
    if (t < 33.6) return w11(c, t);
    if (t < 34.4) return zoomIn(c, t, 33.6, 0.8, w11, w12, BUBBLE);
    if (t < 37.6) return w12(c, t);
    if (t < 38.4) { bg(c, t); w13(c, t); c.save(); c.globalAlpha = 1 - clamp((t - 37.6) / 0.8); w12(c, t); c.restore(); return; }
    if (t < 40.6) return w13(c, t);
    if (t < 41.4) return zoomIn(c, t, 40.6, 0.8, w13, w14, UMB_ANCHOR);
    if (t < 42.0) return w14(c, t);
    if (t < 43.98) return black(c);
    if (t < 46.0) return w14(c, t);
    // slow push to the bare foot, then the padlock; freeze; pull back
    const push = tw(t, 46.0, 1.9, expo), push2 = tw(t, 48.0, 4.0, sine), back = tw(t, 54.0, 0.85, os);
    const s = (1 + 1.5 * push + 0.35 * push2) * (1 - back) + back * 1;
    const fx = lerp(540, FOOT_WORLD.x, (push) * (1 - back)), fy = lerp(960, FOOT_WORLD.y, (push) * (1 - back));
    const dim = tw(t, 54.2, 0.6, expo) * (1 - tw(t, 58.0, 0.6, expo));
    c.save();
    c.translate(540, 960 - 120 * push * (1 - back)); c.scale(s, s); c.translate(-fx, -fy);
    w14(c, t);
    c.restore();
    if (t >= 54.0) {
      // the world steps back in depth while the thread writes
      c.save(); c.fillStyle = `rgba(255,255,255,${0.72 * dim})`; c.fillRect(0, 0, W, H); c.restore();
      if (t >= 58.0) {
        const wh = tw(t, 58.0, 0.65, expo);
        c.save(); c.globalAlpha = wh; bg(c, t); c.restore();
        // the thread re-knits the sock and 1987 comes back: exactly frame 1 at 60 s
        const tl = t - 60;
        const knit = tw(t, 58.45, 0.85, sine);
        const a87 = tw(t, 58.7, 0.9, expo);
        w0(c, tl, { alpha1987: a87, scale1987: 1 + 0.05 * (1 - a87), knit: Math.max(0.0001, knit), sock: knit > 0 });
      }
      ending(c, t);
    }
  }

  // ---------------------------------------------------------------- frost (freeze 52-54)
  function frost(c, t) {
    const f = tw(t, 52.0, 0.25, expo) * (1 - tw(t, 54.0, 0.5, expo));
    if (f <= 0) return;
    c.save();
    c.globalAlpha = f;
    c.fillStyle = "rgba(210,228,255,0.22)"; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(540, 960, 500, 540, 960, 1150);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0.85)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const r = mulberry(52);
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 3; c.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const edge = i % 4, u = r();
      let x = edge === 0 ? u * W : edge === 1 ? W : edge === 2 ? u * W : 0;
      let y = edge === 0 ? 0 : edge === 1 ? u * H : edge === 2 ? H : u * H;
      let a = Math.atan2(960 - y, 540 - x) + (r() - 0.5) * 0.8;
      const len = (120 + r() * 220) * tw(t, 52.0, 0.5, expo);
      c.beginPath(); c.moveTo(x, y); const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; c.lineTo(x2, y2);
      for (const s of [-1, 1]) { c.moveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5); c.lineTo(x + Math.cos(a) * len * 0.5 + Math.cos(a + s * 0.6) * len * 0.3, y + Math.sin(a) * len * 0.5 + Math.sin(a + s * 0.6) * len * 0.3); }
      c.stroke();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- foreground glass passing the lens on every seam (depth)
  const SEAMS = [[3.6, 0.9], [7.6, 0.9], [11.6, 0.8], [13.7, 0.7], [15.8, 0.55], [17.7, 0.45], [19.65, 0.45], [21.6, 0.8], [23.7, 0.9],
    [26.0, 0.8], [28.0, 0.6], [29.6, 0.8], [31.6, 0.8], [33.6, 0.8], [37.6, 0.8], [40.6, 0.8], [46.0, 1.9], [54.0, 0.85], [58.0, 1.2]];
  let bokeh = null;
  function fgGlass(c, t) {
    if (!bokeh) bokeh = GC.map((col) => K.bake(400, 400, (cc) => { cc.filter = "blur(18px)"; glass(cc, P.circle(200, 200, 150), col, { bb: [50, 50, 300, 300], noShadow: true, alpha: 0.5 }); }));
    for (let k = 0; k < SEAMS.length; k++) {
      const [t0, d] = SEAMS[k];
      const q = (t - t0) / d;
      if (q <= 0.15 || q >= 1) continue;
      const r = mulberry(100 + k);
      for (let i = 0; i < 3; i++) {
        const a = r() * 6.28, sp = 300 + r() * 500;
        const u = expo((q - 0.15) / 0.85);
        const x = 540 + Math.cos(a) * sp * u * 2.2, y = 960 + Math.sin(a) * sp * u * 2.2;
        const s = 0.4 + 3.5 * u;
        drawSprite(c, bokeh[(k + i) % 4], x, y, s, 0, 0.55 * bell(q));
      }
    }
  }

  // ---------------------------------------------------------------- camera roll (26-28 upside down, 28 back)
  function roll(t) { return Math.PI * tw(t, 26.0, 0.8, os) + Math.PI * tw(t, 28.0, 0.6, os); }

  // ---------------------------------------------------------------- kinetic subtitles, word by word
  const GROUPS = [];
  (function buildGroups() {
    const m = document.createElement("canvas").getContext("2d");
    for (const L of window.WORDS) {
      let cur = [];
      const flush = () => { if (cur.length) GROUPS.push({ line: L.line, words: cur }); cur = []; };
      L.words.forEach((w, i) => {
        cur.push({ ...w, gi: i });
        const brk = /[.,?!…]$/.test(w.w) || cur.length >= 3;
        if (brk) flush();
      });
      flush();
    }
    GROUPS.forEach((g) => { g.s = g.words[0].s; g.e = g.words[g.words.length - 1].e; });
    GROUPS.forEach((g, i) => {
      const nx = GROUPS[i + 1];
      g.out = nx && nx.s - g.e < 0.6 ? nx.s - 0.02 : g.e + 0.35;
      g.style = ["fall", "melt", "break", "squash"][i % 4];
    });
  })();
  const FS = 96;
  function wordColor(i) { return GC[i % 4]; }
  function drawWord(c, text, x, y, size, ink, acc, act) {
    c.font = `900 ${size}px ${K.FONT}`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round";
    if (ink === "#ffffff") {
      c.fillStyle = act ? acc : "#ffffff"; c.fillText(text, x, y);
      return;
    }
    c.lineWidth = size * 0.2; c.strokeStyle = "rgba(255,255,255,0.92)"; c.strokeText(text, x, y);
    const g = c.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.45);
    const base = act ? acc : ink;
    g.addColorStop(0, lighten(base, 0.25)); g.addColorStop(1, base);
    c.fillStyle = g; c.fillText(text, x, y);
    c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(0, 0, 0, 0);
  }
  function subtitles(c, t, R) {
    const dark = (t >= 13.95 && t < 16.0) || (t >= 42.0 && t < 43.98);
    for (let gi = 0; gi < GROUPS.length; gi++) {
      const g = GROUPS[gi];
      // line 13 (the whisper) also stays for the fall + climb back
      const special = g.line === 13;
      const end = special ? 29.75 : g.out;
      if (t < g.s - 0.02 || t >= end) continue;
      const big = g.line === 21; // "¿Y el abuelo?" alone in the black
      const size = big ? 128 : FS;
      c.save(); c.font = `900 ${size}px ${K.FONT}`;
      const sp = size * 0.28;
      const widths = g.words.map((w) => c.measureText(w.w).width);
      let total = widths.reduce((a, b) => a + b, 0) + sp * (widths.length - 1);
      let sc = Math.min(1, 960 / total);
      let x = 540 - (total * sc) / 2;
      let baseY = big ? 960 : 1225;
      if (g.line === 14) baseY = 470;
      const prompt = g.line === 17 || g.line === 19;
      if (prompt) {
        const pw = Math.min(1000, total * sc + 90), ph = size * 1.5;
        const pin = tw(t, g.s - 0.15, 0.35, os);
        c.save(); c.translate(540, baseY); c.scale(pin, pin);
        glass(c, P.rr(-pw / 2, -ph / 2, pw, ph, ph / 2), "#ffffff", { bb: [-pw / 2, -ph / 2, pw, ph], sb: 24, alpha: 0.9 });
        c.strokeStyle = rgba(C.B, 0.6); c.lineWidth = 4; c.stroke(P.rr(-pw / 2, -ph / 2, pw, ph, ph / 2));
        c.restore();
      }
      g.words.forEach((w, i) => {
        const ww = widths[i] * sc;
        const cx = x + ww / 2; x += ww + sp * sc;
        if (t < w.s - 0.02) return;
        const q = clamp((t - (w.s - 0.02)) / 0.32);
        const e = os(q, 0.06);
        const act = t >= w.s && t < Math.max(w.e, w.s + 0.18);
        let px = cx, py = baseY, rot = 0, sx = 1, sy = 1, al = 1;
        // entry: the word stretches tall and snaps into place
        sy = lerp(1.9, 1, e); sx = lerp(0.6, 1, e); py += (1 - e) * 40;
        al = clamp(q * 4);
        // exits
        if (!special && t > g.out - 0.2) {
          const xq = clamp((t - (g.out - 0.2)) / 0.2);
          const xe = expo(xq);
          if (g.style === "fall") { py += 700 * xq * xq; rot = (i - 1) * 0.6 * xq; al *= 1 - xq; }
          else if (g.style === "melt") { sy *= 1 + 1.6 * xe; py += 60 * xe; sx *= 1 - 0.3 * xe; al *= 1 - xe; }
          else if (g.style === "break") { px += (i - (g.words.length - 1) / 2) * 260 * xe; rot = (i % 2 ? 1 : -1) * 0.5 * xe; al *= 1 - xe; }
          else { sy *= 1 - xe; sx *= 1 + 0.4 * xe; al *= 1 - xe * 0.5; }
        }
        // the whisper line: falls off the bottom edge after the camera turns, then climbs back up a rope
        let rope = null;
        if (special) {
          const fallQ = clamp((t - 27.5 - i * 0.07) / 0.55);
          const climb = clamp((t - 28.65 - i * 0.16) / 0.6);
          const downScreen = 1100 * fallQ * fallQ * (1 - os(climb, 0.05));
          // screen-down while the camera is rolled
          py += downScreen * Math.cos(R);
          px += Math.sin(t * 9 + i) * 10 * bell(climb);
          if (climb > 0 && climb < 1) rope = cx;
          if (t > 29.45) al *= 1 - clamp((t - 29.45) / 0.3);
        }
        if (rope !== null) {
          c.save(); c.strokeStyle = rgba(darken(C.Y, 0.3), 0.9); c.lineWidth = 6; c.setLineDash([14, 8]);
          c.beginPath(); c.moveTo(rope, baseY - 70); c.lineTo(rope, 2100); c.stroke(); c.restore();
        }
        c.save(); c.globalAlpha *= al; c.translate(px, py); c.rotate(rot); c.scale(sx * sc, sy * sc);
        if (g.style === "break" && t > g.out - 0.2 && !special) {
          const xq = expo(clamp((t - (g.out - 0.2)) / 0.2));
          c.save(); c.beginPath(); c.rect(-600, -300, 1200, 300); c.clip(); c.translate(0, -40 * xq); drawWord(c, w.w, 0, 0, size, dark ? "#ffffff" : C.K, wordColor(w.gi), act); c.restore();
          c.save(); c.beginPath(); c.rect(-600, 0, 1200, 300); c.clip(); c.translate(0, 60 * xq); c.rotate(0.2 * xq); drawWord(c, w.w, 0, 0, size, dark ? "#ffffff" : C.K, wordColor(w.gi), act); c.restore();
        } else drawWord(c, w.w, 0, 0, size, dark ? "#ffffff" : C.K, wordColor(w.gi), act);
        c.restore();
      });
      c.restore();
    }
  }

  // ---------------------------------------------------------------- frame assembly + motion blur on the fast frames
  let M3, MF, M10;
  function init() {
    M3 = samplePoints((c) => { const s = textSprite("3", 760, "#ffffff"); drawSprite(c, s, 540, 960, 1); }, 360, 3);
    MF = samplePoints((c) => { c.save(); c.translate(560, 820); CH.flamingo(c, 16.5); c.restore(); }, 360, 4);
    M10 = samplePoints((c) => { const one = textSprite("1", 640, C.B); drawSprite(c, one, 330, 860, 1); drawSprite(c, textSprite("0", 640, C.R), 700, 860, 1); }, 360, 5);
    bittenZero(0);
  }
  function frame(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    const R = roll(t);
    c.save();
    if (R) { c.translate(CX, CY); c.rotate(R); c.translate(-CX, -CY); }
    world(c, t);
    c.restore();
    fgGlass(c, t);
    frost(c, t);
    // flash when the lights come back
    if (t >= 43.98 && t < 44.4) { c.fillStyle = `rgba(255,255,255,${0.6 * (1 - (t - 43.98) / 0.42)})`; c.fillRect(0, 0, W, H); }
    c.save();
    if (R) { c.translate(CX, CY); c.rotate(R); c.translate(-CX, -CY); }
    subtitles(c, t, R);
    c.restore();
  }
  // camera speed: derivative of the expo seams; the faster, the longer the shutter
  function speed(t) {
    let v = 0;
    for (const [t0, d] of SEAMS) { const q = (t - t0) / d; if (q > 0 && q < 1) { const h = 0.004; v = Math.max(v, (expo(q + h) - expo(q - h)) / (2 * h) / d); } }
    for (const b of [19.65, 34.35, 36.1, 6.08]) { const q = (t - b) / 0.5; if (q > 0 && q < 1) v = Math.max(v, 3 * bell(q)); }
    return v;
  }
  let off = null, offc = null;
  function renderAt(main, t) {
    const v = speed(t);
    if (v < 1.6) { frame(main, t); return; }
    if (!off) { off = document.createElement("canvas"); off.width = W; off.height = H; offc = off.getContext("2d"); }
    const n = v > 5 ? 6 : 4;
    const shutter = (1 / 60) * 0.75;
    main.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < n; i++) {
      const tt = t + (i / (n - 1) - 0.5) * shutter;
      frame(offc, tt);
      main.globalAlpha = 1 / (i + 1);
      main.drawImage(off, 0, 0);
    }
    main.globalAlpha = 1;
  }
  window.FILM = { init, renderAt, frame, GROUPS };
})();
