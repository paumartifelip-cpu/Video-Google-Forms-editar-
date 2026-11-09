// Characters and props, all built from liquid glass. Each draws around its own origin.
(function () {
  const { C, glass, caustic, P, rgba, lighten, darken, mixc, clamp, lerp, textSprite, drawSprite } = K;

  // ---------------------------------------------------------------- the sock (always #EA4335 + white stripes)
  const SOCK = (() => {
    const p = new Path2D();
    p.moveTo(-72, -205); p.lineTo(72, -205); p.lineTo(72, 55);
    p.quadraticCurveTo(74, 112, 128, 118); p.lineTo(185, 118);
    p.quadraticCurveTo(252, 122, 252, 172); p.quadraticCurveTo(252, 226, 186, 226);
    p.lineTo(-6, 226); p.quadraticCurveTo(-72, 226, -72, 158); p.closePath();
    return p;
  })();
  const SOCK_BB = [-80, -210, 340, 440];
  // knit: 0..1 reveals the sock from the cuff down (used when the thread re-knits it)
  function sock(c, o = {}) {
    const knit = o.knit ?? 1;
    c.save();
    if (knit < 1) { c.beginPath(); c.rect(-200, -260, 520, 30 + 470 * knit); c.clip(); }
    glass(c, SOCK, C.R, { bb: SOCK_BB, sb: o.sb ?? 34, so: 18, alpha: o.alpha ?? 0.9 });
    c.save(); c.clip(SOCK);
    // white stripes on the leg
    for (const y of [-150, -96, -42]) {
      c.fillStyle = "rgba(255,255,255,0.88)";
      c.beginPath(); c.roundRect(-90, y, 360, 24, 6); c.fill();
      c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-90, y + 24, 360, 4);
    }
    // ribbed cuff
    c.fillStyle = "rgba(255,255,255,0.28)"; c.fillRect(-90, -205, 360, 34);
    c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 3;
    for (let x = -60; x <= 60; x += 16) { c.beginPath(); c.moveTo(x, -205); c.lineTo(x, -172); c.stroke(); }
    // heel and toe patches
    c.fillStyle = rgba(darken(C.R, 0.2), 0.35);
    c.beginPath(); c.arc(-60, 210, 70, 0, 7); c.fill();
    c.beginPath(); c.arc(250, 172, 68, 0, 7); c.fill();
    c.restore();
    if (o.tie) {
      const tp = new Path2D();
      tp.moveTo(-16, -168); tp.lineTo(16, -168); tp.lineTo(10, -146); tp.lineTo(26, -40); tp.lineTo(0, -10); tp.lineTo(-26, -40); tp.lineTo(-10, -146); tp.closePath();
      glass(c, tp, C.B, { bb: [-28, -170, 56, 160], sb: 10, so: 6, lw: 3 });
      glass(c, P.rr(-20, -186, 40, 26, 8), darken(C.B, 0.15), { bb: [-20, -186, 40, 26], noShadow: true, lw: 3 });
    }
    c.restore();
  }

  // ---------------------------------------------------------------- dove with a miner's helmet
  function dove(c, t, o = {}) {
    const flap = Math.sin(t * (o.flapHz ?? 9) * Math.PI * 2);
    caustic(c, 0, 150, 130, 22, C.B, 0.12);
    // tail
    glass(c, P.poly([[-120, 10], [-210, -20], [-205, 40]]), "#dfe6f2", { bb: [-210, -20, 100, 60], sb: 10 });
    // back wing
    c.save(); c.translate(-10, -20); c.rotate(-0.4 - flap * 0.5);
    glass(c, P.ellipse(-30, -60, 50, 95, 0.3), "#cfd9ec", { bb: [-80, -155, 100, 190], sb: 8 }); c.restore();
    glass(c, P.ellipse(0, 10, 125, 80), "#eef2fa", { bb: [-125, -70, 250, 160] });
    glass(c, P.circle(105, -55, 55), "#eef2fa", { bb: [50, -110, 110, 110], sb: 14 });
    // beak
    glass(c, P.poly([[150, -55], [205, -40], [150, -30]]), C.Y, { bb: [150, -55, 55, 25], sb: 6, lw: 2 });
    c.fillStyle = C.K; c.beginPath(); c.arc(118, -64, 8, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(121, -67, 3, 0, 7); c.fill();
    // front wing
    c.save(); c.translate(0, -10); c.rotate(0.25 + flap * 0.6);
    glass(c, P.ellipse(-20, -70, 55, 105, 0.15), "#f4f7fd", { bb: [-75, -175, 110, 210], sb: 10 }); c.restore();
    // miner helmet + lamp
    c.save(); c.translate(100, -100); c.rotate(-0.15);
    const hp = new Path2D(); hp.arc(0, 10, 62, Math.PI, 0); hp.lineTo(72, 14); hp.lineTo(-72, 14); hp.closePath();
    glass(c, hp, C.Y, { bb: [-72, -52, 144, 66], sb: 10 });
    glass(c, P.circle(0, -18, 18), "#ffffff", { bb: [-18, -36, 36, 36], noShadow: true, lw: 3 });
    if (o.lamp !== false) {
      c.globalCompositeOperation = "lighter";
      const g = c.createLinearGradient(0, -18, 260, -60);
      g.addColorStop(0, "rgba(251,188,5,0.45)"); g.addColorStop(1, "rgba(251,188,5,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -18); c.lineTo(280, -110); c.lineTo(280, 30); c.closePath(); c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- cow (one eye holds a universe)
  const COW_EYE_L = { x: 365, y: 830, r: 104 };
  function galaxy(c, x, y, r, t) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); c.clip();
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "#2a2f6b"); g.addColorStop(0.6, "#0d1033"); g.addColorStop(1, "#05061a");
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalCompositeOperation = "lighter";
    const cols = [C.B, C.R, C.Y, C.G];
    for (let i = 0; i < 160; i++) {
      const arm = i % 4;
      const k = i / 160;
      const a = k * 9 + arm * (Math.PI / 2) + t * 0.6;
      const rr = r * (0.05 + 0.9 * k);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
      c.fillStyle = rgba(cols[arm], 0.55 * (1 - k * 0.6));
      c.beginPath(); c.arc(px, py, r * 0.018 + r * 0.03 * (1 - k), 0, 7); c.fill();
    }
    const core = c.createRadialGradient(x, y, 0, x, y, r * 0.35);
    core.addColorStop(0, "rgba(255,255,255,0.9)"); core.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = core; c.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 40; i++) {
      const a = i * 2.4, rr = r * ((i * 37) % 100) / 100;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i));
      c.fillStyle = `rgba(255,255,255,${0.7 * tw})`;
      c.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 2.5);
    }
    c.restore();
  }
  function cow(c, t, o = {}) {
    const nos = o.nostril ?? 1;
    // horns
    for (const s of [-1, 1]) {
      const hp = new Path2D();
      hp.moveTo(540 + s * 200, 470); hp.quadraticCurveTo(540 + s * 330, 430, 540 + s * 360, 300);
      hp.quadraticCurveTo(540 + s * 300, 400, 540 + s * 170, 420); hp.closePath();
      glass(c, hp, C.Y, { bb: [540 + Math.min(s * 170, s * 360), 300, 190, 170], sb: 16 });
    }
    // ears
    for (const s of [-1, 1]) {
      glass(c, P.ellipse(540 + s * 400, 600, 150, 70, s * 0.35), "#e8eef8", { bb: [540 + s * 400 - 150, 530, 300, 140] });
      glass(c, P.ellipse(540 + s * 410, 600, 95, 38, s * 0.35), lighten(C.R, 0.45), { bb: [540 + s * 410 - 95, 562, 190, 76], noShadow: true, lw: 2 });
    }
    // head
    const head = new Path2D();
    head.moveTo(240, 520); head.quadraticCurveTo(540, 380, 840, 520);
    head.quadraticCurveTo(930, 900, 820, 1250); head.lineTo(260, 1250);
    head.quadraticCurveTo(150, 900, 240, 520); head.closePath();
    glass(c, head, "#e3eaf6", { bb: [180, 420, 720, 830], sb: 50, so: 26 });
    c.save(); c.clip(head);
    glass(c, P.ellipse(300, 600, 150, 120, 0.4), C.B, { bb: [150, 480, 300, 240], noShadow: true, alpha: 0.75 });
    glass(c, P.ellipse(820, 760, 120, 170, -0.3), C.G, { bb: [700, 590, 240, 340], noShadow: true, alpha: 0.75 });
    glass(c, P.ellipse(560, 470, 90, 50, 0.1), C.B, { bb: [470, 420, 180, 100], noShadow: true, alpha: 0.6 });
    c.restore();
    // eyes
    const L = COW_EYE_L;
    glass(c, P.circle(L.x, L.y, 140), "#ffffff", { bb: [L.x - 140, L.y - 140, 280, 280], sb: 20 });
    galaxy(c, L.x, L.y, L.r, t);
    c.save(); c.globalAlpha = 0.6; c.fillStyle = "#fff"; c.beginPath(); c.ellipse(L.x - 40, L.y - 50, 26, 14, -0.6, 0, 7); c.fill(); c.restore();
    const blink = o.squint ?? 0;
    glass(c, P.circle(715, 830, 120), "#ffffff", { bb: [595, 710, 240, 240], sb: 20 });
    glass(c, P.circle(715 + (o.look ?? 0) * 20, 840, 62), C.B, { bb: [653, 778, 124, 124], noShadow: true });
    c.fillStyle = C.K; c.beginPath(); c.arc(715 + (o.look ?? 0) * 20, 840, 30, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(700, 822, 11, 0, 7); c.fill();
    if (blink > 0) {
      for (const [ex, ey, er] of [[L.x, L.y, 142], [715, 830, 122]]) {
        c.save(); c.beginPath(); c.arc(ex, ey, er, 0, 7); c.clip();
        const lid = P.rr(ex - er, ey - er, er * 2, er * 2 * blink, 4);
        glass(c, lid, "#cdd8ec", { bb: [ex - er, ey - er, er * 2, er * 2 * blink], noShadow: true, alpha: 0.97, lw: 3 });
        c.restore();
      }
    }
    // muzzle with nostrils
    const mz = P.rr(300, 1020, 480, 300, 150);
    glass(c, mz, lighten(C.R, 0.5), { bb: [300, 1020, 480, 300], sb: 26 });
    for (const x of [430, 650]) {
      c.fillStyle = rgba(darken(C.R, 0.55), 0.85);
      c.beginPath(); c.ellipse(x, 1150, 34 * nos, 46 * nos, 0, 0, 7); c.fill();
    }
    c.strokeStyle = rgba(darken(C.R, 0.4), 0.6); c.lineWidth = 7; c.lineCap = "round";
    c.beginPath(); c.moveTo(470, 1255); c.quadraticCurveTo(540, 1285, 610, 1255); c.stroke();
  }

  // ---------------------------------------------------------------- typewriter & cactus
  function typewriter(c, t, o = {}) {
    const open = o.open ?? 0; // 0 closed .. 1 fully bloomed into petals
    // petals bloom behind
    if (open > 0) {
      const cols = [C.B, C.R, C.Y, C.G, C.B, C.R, C.Y];
      for (let i = 0; i < 7; i++) {
        const a = lerp(0, (i - 3) * 0.42, open);
        c.save(); c.translate(540, 1180); c.rotate(a); c.scale(open, open);
        const pp = new Path2D(); pp.moveTo(0, 0); pp.quadraticCurveTo(-150, -260, 0, -520); pp.quadraticCurveTo(150, -260, 0, 0);
        glass(c, pp, cols[i], { bb: [-150, -520, 300, 520], sb: 20, alpha: 0.7 });
        c.restore();
      }
    }
    for (const s of [-1, 1]) {
      c.save(); c.translate(540 + s * 330, 1240); c.rotate(s * open * 1.25); c.globalAlpha *= 1 - open * 0.9;
      c.translate(-(540 + s * 330), -1240);
      c.save(); c.beginPath(); s < 0 ? c.rect(0, 0, 540, 2000) : c.rect(540, 0, 600, 2000); c.clip();
      const body = new Path2D();
      body.moveTo(230, 1240); body.lineTo(850, 1240); body.lineTo(800, 1010); body.lineTo(280, 1010); body.closePath();
      glass(c, body, C.B, { bb: [230, 1010, 620, 230], sb: 40 });
      glass(c, P.rr(250, 930, 580, 100, 40), darken(C.B, 0.25), { bb: [250, 930, 580, 100], sb: 20 });
      for (let r = 0; r < 3; r++) for (let k = 0; k < 9 - r; k++) {
        const kx = 330 + r * 22 + k * 52, ky = 1060 + r * 52;
        const pressed = o.pressKey === r * 9 + k ? 6 : 0;
        glass(c, P.circle(kx, ky + pressed, 20), "#ffffff", { bb: [kx - 20, ky - 20 + pressed, 40, 40], noShadow: true, lw: 2 });
      }
      c.restore(); c.restore();
    }
  }
  function paper(c, x, y, h, text, a = 1) {
    c.save(); c.globalAlpha *= a;
    glass(c, P.rr(x - 210, y - h, 420, h, 10), "#ffffff", { bb: [x - 210, y - h, 420, h], sb: 18, alpha: 0.95 });
    c.font = `800 38px ${K.FONT}`; c.fillStyle = K.C.K; c.textAlign = "left";
    const words = text.split(" ");
    let line = "", ly = y - h + 70;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (c.measureText(test).width > 340) { c.fillText(line, x - 180, ly); line = w; ly += 52; } else line = test;
    }
    if (line) c.fillText(line, x - 180, ly);
    c.restore();
  }
  function cactus(c, t, o = {}) {
    const arm = o.arm ?? 0; // 0 up .. 1 striking down
    caustic(c, 0, 360, 170, 30, C.G, 0.3);
    glass(c, P.rr(-80, 260, 160, 110, 24), C.Y, { bb: [-80, 260, 160, 110], sb: 14 });
    const body = P.rr(-85, -260, 170, 540, 85);
    glass(c, body, C.G, { bb: [-85, -260, 170, 540], sb: 26 });
    // left arm
    glass(c, P.rr(-185, -90, 70, 170, 35), C.G, { bb: [-185, -90, 70, 170], sb: 10 });
    glass(c, P.rr(-160, 20, 110, 60, 30), C.G, { bb: [-160, 20, 110, 60], noShadow: true });
    // striking arm (right) with spines as fingers
    c.save(); c.translate(70, -40); c.rotate(-0.9 + arm * 1.05);
    glass(c, P.rr(0, -40, 230, 80, 40), C.G, { bb: [0, -40, 230, 80], sb: 12 });
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 5; c.lineCap = "round";
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(225, -24 + i * 16); c.lineTo(262, -30 + i * 20); c.stroke(); }
    c.restore();
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 4; c.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const sx = -60 + (i % 4) * 40, sy = -220 + Math.floor(i / 4) * 120 + (i % 2) * 40;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (i % 2 ? 16 : -16), sy - 12); c.stroke();
    }
    // face
    c.fillStyle = K.C.K;
    c.beginPath(); c.arc(-28, -140, 9, 0, 7); c.arc(28, -140, 9, 0, 7); c.fill();
    c.strokeStyle = K.C.K; c.lineWidth = 5;
    c.beginPath(); c.arc(0, -112, 18, 0.2, Math.PI - 0.2); c.stroke();
  }

  // ---------------------------------------------------------------- dancing lighthouse
  function lighthouse(c, t, o = {}) {
    const sway = o.sway ?? 0, hip = o.hip ?? 0;
    caustic(c, 0, 10, 220, 34, C.R, 0.35);
    c.save(); c.translate(hip * 50, 0);
    c.transform(1, 0, sway * 0.35, 1, 0, 0);
    // tower: tapered, red with white bands
    const tower = P.poly([[-120, 0], [120, 0], [80, -520], [-80, -520]]);
    glass(c, tower, C.R, { bb: [-120, -520, 240, 520], sb: 34 });
    c.save(); c.clip(tower);
    for (const y of [-120, -300]) { c.fillStyle = "rgba(255,255,255,0.85)"; c.fillRect(-130, y - 45, 260, 70); }
    c.restore();
    glass(c, P.rr(-35, -110, 70, 110, 30), darken(C.B, 0.2), { bb: [-35, -110, 70, 110], noShadow: true, lw: 3 });
    glass(c, P.rr(-115, -545, 230, 34, 12), C.K, { bb: [-115, -545, 230, 34], sb: 10 });
    // lantern
    glass(c, P.rr(-70, -680, 140, 140, 24), C.Y, { bb: [-70, -680, 140, 140], sb: 30, shadowA: 0.6 });
    const roof = P.poly([[-95, -675], [95, -675], [0, -770]]);
    glass(c, roof, C.R, { bb: [-95, -770, 190, 95], sb: 12 });
    // beam
    c.save(); c.translate(0, -610); c.rotate(o.beam ?? 0);
    c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(0, 0, 900, 0);
    g.addColorStop(0, "rgba(251,188,5,0.55)"); g.addColorStop(1, "rgba(251,188,5,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(950, -170); c.lineTo(950, 170); c.closePath(); c.fill();
    c.restore();
    // arms with maracas
    for (const s of [-1, 1]) {
      const sh = Math.sin(t * 16 + (s > 0 ? 1 : 0)) * 0.25;
      c.save(); c.translate(s * 95, -330); c.rotate(s * (-0.5 + (o.arms ?? 0) * 0.6) + sh);
      c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 16; c.lineCap = "round";
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 70, -40, s * 120, -120); c.stroke();
      c.strokeStyle = rgba(C.K, 0.25); c.lineWidth = 3; c.stroke();
      glass(c, P.ellipse(s * 132, -155, 32, 42, s * 0.4), s > 0 ? C.G : C.Y, { bb: [s * 132 - 32, -197, 64, 84], sb: 10 });
      c.restore();
    }
    // smiling face on the tower
    c.fillStyle = K.C.K;
    c.beginPath(); c.arc(-28, -420, 8, 0, 7); c.arc(28, -420, 8, 0, 7); c.fill();
    c.strokeStyle = K.C.K; c.lineWidth = 5; c.beginPath(); c.arc(0, -400, 20, 0.15, Math.PI - 0.15); c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- elevator
  function elevator(c, t, o = {}) {
    const open = o.open ?? 0;
    c.strokeStyle = rgba(C.K, 0.5); c.lineWidth = 5;
    c.beginPath(); c.moveTo(-40, -380); c.lineTo(-40, -3000); c.moveTo(40, -380); c.lineTo(40, -3000); c.stroke();
    const box = P.rr(-270, -380, 540, 760, 36);
    glass(c, box, C.G, { bb: [-270, -380, 540, 760], sb: 50, so: 26 });
    // interior
    const inner = P.rr(-200, -260, 400, 600, 20);
    c.save(); c.clip(inner);
    const g = c.createLinearGradient(0, -260, 0, 340);
    g.addColorStop(0, "#0e1a3a"); g.addColorStop(1, "#050914");
    c.fillStyle = g; c.fillRect(-200, -260, 400, 600);
    const spot = c.createRadialGradient(0, -240, 0, 0, -100, 380);
    spot.addColorStop(0, "rgba(255,240,200,0.4)"); spot.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = spot; c.fillRect(-200, -260, 400, 600);
    if (o.inner) o.inner(c);
    // doors
    const dw = 200 * (1 - open);
    if (dw > 1) {
      glass(c, P.rr(-200, -260, dw, 600, 4), lighten(C.G, 0.3), { bb: [-200, -260, dw, 600], noShadow: true, alpha: 0.95, lw: 3 });
      glass(c, P.rr(200 - dw, -260, dw, 600, 4), lighten(C.G, 0.3), { bb: [200 - dw, -260, dw, 600], noShadow: true, alpha: 0.95, lw: 3 });
    }
    c.restore();
    c.lineWidth = 4; c.strokeStyle = "rgba(255,255,255,0.9)"; c.stroke(inner);
    // floor indicator
    glass(c, P.rr(-60, -350, 120, 70, 20), C.K, { bb: [-60, -350, 120, 70], noShadow: true, lw: 3 });
    c.fillStyle = o.ding ? C.Y : rgba(C.Y, 0.4);
    c.beginPath(); c.moveTo(-18, -330); c.lineTo(18, -330); c.lineTo(0, -300); c.closePath(); c.fill();
  }

  // ---------------------------------------------------------------- flamingo shaped like a "1"
  function flamingo(c, t, o = {}) {
    const pink = mixc(C.R, "#ffffff", 0.28);
    const bob = Math.sin(t * 5) * 6;
    // the standing leg (the "1" foot)
    c.strokeStyle = rgba(darken(pink, 0.15), 0.95); c.lineWidth = 16; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(0, 130); c.lineTo(0, 420); c.lineTo(-10, 560); c.stroke();
    c.beginPath(); c.moveTo(-10, 560); c.lineTo(-80, 575); c.moveTo(-10, 560); c.lineTo(60, 572); c.stroke();
    // tucked leg
    c.beginPath(); c.moveTo(10, 150); c.lineTo(70, 290); c.lineTo(10, 330); c.stroke();
    caustic(c, -10, 585, 150, 24, C.R, 0.3);
    // body
    glass(c, P.ellipse(-30, 70, 170, 105, -0.15), pink, { bb: [-200, -35, 340, 210], sb: 30 });
    glass(c, P.ellipse(-60, 50, 110, 60, -0.3), lighten(pink, 0.25), { bb: [-170, -10, 220, 120], noShadow: true });
    // neck: the stroke of the "1"
    const neck = new Path2D();
    neck.moveTo(60, 20); neck.quadraticCurveTo(110, -150, 60, -330);
    neck.quadraticCurveTo(30, -430, 0, -470 + bob);
    neck.lineTo(-50, -430 + bob); neck.quadraticCurveTo(10, -400, 15, -330);
    neck.quadraticCurveTo(50, -150, 10, 30); neck.closePath();
    glass(c, neck, pink, { bb: [-50, -470, 160, 500], sb: 20 });
    // head + beak (the flag of the "1")
    c.save(); c.translate(-40, -470 + bob);
    glass(c, P.circle(0, 0, 52), pink, { bb: [-52, -52, 104, 104], sb: 14 });
    const beak = P.poly([[-40, -10], [-150, 30], [-120, 60], [-30, 30]]);
    glass(c, beak, "#ffffff", { bb: [-150, -10, 120, 70], sb: 8, lw: 3 });
    c.fillStyle = C.K; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-120, 60); c.lineTo(-108, 38); c.closePath(); c.fill();
    c.beginPath(); c.arc(8, -10, 9, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(11, -13, 3, 0, 7); c.fill();
    c.restore();
    // tail feathers
    glass(c, P.poly([[-180, 60], [-260, 20], [-240, 110]]), lighten(pink, 0.2), { bb: [-260, 20, 80, 90], sb: 8 });
  }

  // ---------------------------------------------------------------- turtle with fork and napkin
  function turtle(c, t, o = {}) {
    const walk = o.walk ?? 0;
    const lunge = o.lunge ?? 0;
    caustic(c, 0, 95, 230, 30, C.G, 0.3);
    for (let i = 0; i < 4; i++) {
      const lx = -120 + i * 80, ph = Math.sin(walk * 14 + i * Math.PI);
      glass(c, P.rr(lx - 24, 40 + Math.max(0, ph) * -14, 48, 70, 20), lighten(C.G, 0.35), { bb: [lx - 24, 40, 48, 70], sb: 8 });
    }
    // head and neck reaching up for a bite
    c.save(); c.translate(-150, 0); c.rotate(-0.5 * lunge);
    glass(c, P.rr(-110 - 60 * lunge, -40, 140 + 60 * lunge, 70, 35), lighten(C.G, 0.35), { bb: [-170, -40, 200, 70], sb: 10 });
    const hx = -150 - 60 * lunge;
    glass(c, P.circle(hx, -10, 62), lighten(C.G, 0.35), { bb: [hx - 62, -72, 124, 124], sb: 12 });
    c.fillStyle = C.K; c.beginPath(); c.arc(hx - 20, -32, 9, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(hx - 18, -35, 3, 0, 7); c.fill();
    c.strokeStyle = C.K; c.lineWidth = 5; c.beginPath();
    if (o.chew) { c.arc(hx - 40, 18, 12 + 8 * o.chew, 0, Math.PI); } else { c.moveTo(hx - 58, 18); c.lineTo(hx - 25, 22); }
    c.stroke();
    // napkin tied at the neck
    glass(c, P.poly([[hx + 30, 30], [hx + 90, 30], [hx + 60, 120]]), "#ffffff", { bb: [hx + 30, 30, 60, 90], sb: 8, lw: 3 });
    c.restore();
    // shell
    const shell = new Path2D(); shell.ellipse(0, 20, 190, 140, 0, Math.PI, 0); shell.closePath();
    glass(c, shell, C.G, { bb: [-190, -120, 380, 140], sb: 30 });
    c.save(); c.clip(shell); c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 5;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 70, 20); c.lineTo(i * 50, -100); c.stroke(); }
    c.beginPath(); c.ellipse(0, 20, 120, 80, 0, Math.PI, 0); c.stroke(); c.restore();
    // fork held up on the back
    c.save(); c.translate(40, -110); c.rotate(0.35 + Math.sin(t * 6) * 0.08);
    c.strokeStyle = "#d9dee8"; c.lineWidth = 10; c.lineCap = "round";
    c.beginPath(); c.moveTo(0, 60); c.lineTo(0, -60); c.stroke();
    c.lineWidth = 6; for (const x of [-16, 0, 16]) { c.beginPath(); c.moveTo(x, -60); c.lineTo(x, -110); c.stroke(); }
    c.beginPath(); c.moveTo(-16, -60); c.lineTo(16, -60); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-3, 50); c.lineTo(-3, -50); c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- sheep head
  function sheep(c, t, o = {}) {
    const cols = ["#ffffff"];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      glass(c, P.circle(Math.cos(a) * 52, Math.sin(a) * 44 - 10, 40), "#f3f5fa", { bb: [Math.cos(a) * 52 - 40, Math.sin(a) * 44 - 50, 80, 80], sb: 6, lw: 2 });
    }
    glass(c, P.ellipse(0, 12, 46, 56), "#3c4043", { bb: [-46, -44, 92, 112], sb: 8, lw: 2 });
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-16, 0, 8, 0, 7); c.arc(16, 0, 8, 0, 7); c.fill();
    c.fillStyle = C.K; c.beginPath(); c.arc(-15, 2, 4, 0, 7); c.arc(17, 2, 4, 0, 7); c.fill();
    if (o.bleat) { c.fillStyle = lighten(C.R, 0.3); c.beginPath(); c.ellipse(0, 42, 14, 12 * o.bleat, 0, 0, 7); c.fill(); }
    for (const s of [-1, 1]) glass(c, P.ellipse(s * 52, 0, 26, 12, s * 0.4), "#3c4043", { bb: [s * 52 - 26, -12, 52, 24], noShadow: true, lw: 2 });
  }

  // ---------------------------------------------------------------- bus 15
  function bus(c, t, o = {}) {
    caustic(c, 0, 300, 520, 50, C.Y, 0.35);
    const body = P.rr(-470, -250, 940, 500, 70);
    glass(c, body, C.Y, { bb: [-470, -250, 940, 500], sb: 50, so: 24 });
    // windows with sheep
    const wins = [-360, -190, -20, 150];
    wins.forEach((x, i) => {
      const wp = P.rr(x - 70, -190, 140, 150, 22);
      c.save(); c.clip(wp);
      c.fillStyle = rgba(lighten(C.B, 0.55), 0.9); c.fillRect(x - 70, -190, 140, 150);
      if (o.sheep && i !== 2) { c.save(); c.translate(x, -100 + Math.sin(t * 10 + i) * 8); c.scale(0.7, 0.7); sheep(c, t); c.restore(); }
      c.restore();
      glass(c, wp, C.B, { bb: [x - 70, -190, 140, 150], noShadow: true, alpha: 0.25, lw: 4 });
    });
    // front door (right) opening
    const dOpen = o.door ?? 0;
    c.save(); c.clip(P.rr(270, -190, 150, 360, 16));
    c.fillStyle = "#1c2440"; c.fillRect(270, -190, 150, 360);
    if (dOpen > 0.2 && o.sheep) { c.save(); c.translate(345, -40 - 40 * (o.pop ?? 0)); c.scale(0.85, 0.85); sheep(c, t, { bleat: o.bleat }); c.restore(); }
    glass(c, P.rr(270 + 140 * dOpen, -190, 150 * (1 - dOpen) + 1, 360, 6), lighten(C.B, 0.4), { bb: [270, -190, 150, 360], noShadow: true, alpha: 0.6, lw: 3 });
    c.restore();
    // the 15
    const s15 = textSprite("15", 190, C.R);
    drawSprite(c, s15, -240, 120, 1);
    glass(c, P.rr(300, -240, 140, 46, 12), C.K, { bb: [300, -240, 140, 46], noShadow: true, lw: 2 });
    c.fillStyle = C.Y; c.font = `900 34px ${K.FONT}`; c.textAlign = "center"; c.fillText("15", 370, -205);
    // headlight
    glass(c, P.circle(440, 150, 26), "#ffffff", { bb: [414, 124, 52, 52], noShadow: true, lw: 3 });
    // wheels
    for (const x of [-290, 290]) {
      c.save(); c.translate(x, 250); c.rotate(o.wheel ?? 0);
      glass(c, P.circle(0, 0, 82), C.K, { bb: [-82, -82, 164, 164], sb: 16 });
      glass(c, P.circle(0, 0, 34), "#c9d2e3", { bb: [-34, -34, 68, 68], noShadow: true, lw: 3 });
      c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4; c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.stroke();
      c.restore();
    }
  }

  // ---------------------------------------------------------------- bathtub & swan
  function tub(c, t, o = {}) {
    for (const x of [-250, 250]) glass(c, P.ellipse(x, 150, 40, 52), C.Y, { bb: [x - 40, 98, 80, 104], sb: 10 });
    const tb = new Path2D(); tb.moveTo(-340, -60); tb.lineTo(340, -60); tb.quadraticCurveTo(330, 170, 200, 170); tb.lineTo(-200, 170); tb.quadraticCurveTo(-330, 170, -340, -60); tb.closePath();
    // water surface inside
    const lvl = o.level ?? 0;
    glass(c, P.rr(-320, -80 - lvl * 40, 640, 60 + lvl * 40, 24), C.B, { bb: [-320, -120, 640, 100], noShadow: true, alpha: 0.75 });
    glass(c, tb, "#f2f5fb", { bb: [-340, -60, 680, 230], sb: 40 });
    glass(c, P.rr(-360, -78, 720, 34, 17), "#ffffff", { bb: [-360, -78, 720, 34], noShadow: true, lw: 3 });
  }
  function swan(c, t, o = {}) {
    // the "2": neck curve + body base
    const two = textSprite("2", 640, mixc(C.B, "#ffffff", 0.45));
    drawSprite(c, two, 0, 0, 1);
    // head on top of the curve
    c.save(); c.translate(-120, -250);
    glass(c, P.circle(0, 0, 50), "#f5f8ff", { bb: [-50, -50, 100, 100], sb: 10 });
    glass(c, P.poly([[-40, 0], [-120, 20], [-40, 28]]), "#F9AB00", { bb: [-120, 0, 80, 28], sb: 6, lw: 2 });
    c.fillStyle = C.K; c.beginPath(); c.arc(-14, -10, 8, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-11, -13, 3, 0, 7); c.fill();
    c.restore();
    // wing on the base
    glass(c, P.ellipse(60, 190, 130, 60, -0.2), "#dfe8fb", { bb: [-70, 130, 260, 120], sb: 10 });
  }

  // ---------------------------------------------------------------- phone
  function phone(c, w = 300, h = 560) {
    glass(c, P.rr(-w / 2, -h / 2, w, h, 46), C.K, { bb: [-w / 2, -h / 2, w, h], sb: 40 });
  }

  // ---------------------------------------------------------------- pineapple conductor + microwaves
  function pineapple(c, t, o = {}) {
    // crown
    const leaves = [[-0.7, 170], [-0.35, 230], [0, 270], [0.35, 230], [0.7, 170]];
    leaves.forEach(([a, l], i) => {
      c.save(); c.translate(0, -230); c.rotate(a + Math.sin(t * 3 + i) * 0.04);
      const lp = new Path2D(); lp.moveTo(-34, 0); lp.quadraticCurveTo(0, -l * 1.2, 0, -l); lp.quadraticCurveTo(10, -l * 0.5, 34, 0); lp.closePath();
      glass(c, lp, i % 2 ? C.G : darken(C.G, 0.1), { bb: [-34, -l, 68, l], sb: 12 });
      c.restore();
    });
    // body
    const body = P.ellipse(0, 0, 190, 260);
    glass(c, body, C.Y, { bb: [-190, -260, 380, 520], sb: 40 });
    c.save(); c.clip(body); c.strokeStyle = rgba(darken(C.Y, 0.35), 0.45); c.lineWidth = 5;
    for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 60 - 300, -300); c.lineTo(i * 60 + 300, 300); c.stroke(); c.beginPath(); c.moveTo(i * 60 + 300, -300); c.lineTo(i * 60 - 300, 300); c.stroke(); }
    // tuxedo
    const jacket = new Path2D(); jacket.moveTo(-200, 20); jacket.lineTo(-30, 20); jacket.lineTo(0, 120); jacket.lineTo(30, 20); jacket.lineTo(200, 20); jacket.lineTo(200, 300); jacket.lineTo(-200, 300); jacket.closePath();
    glass(c, jacket, C.K, { bb: [-200, 20, 400, 280], noShadow: true, alpha: 0.95 });
    glass(c, P.poly([[-30, 20], [30, 20], [0, 120]]), "#ffffff", { bb: [-30, 20, 60, 100], noShadow: true, lw: 2 });
    c.fillStyle = "#fff"; for (const y of [160, 210]) { c.beginPath(); c.arc(0, y, 8, 0, 7); c.fill(); }
    c.restore();
    glass(c, P.poly([[-55, -5], [0, 22], [-55, 50]]), C.R, { bb: [-55, -5, 55, 55], sb: 6, lw: 2 });
    glass(c, P.poly([[55, -5], [0, 22], [55, 50]]), C.R, { bb: [0, -5, 55, 55], sb: 6, lw: 2 });
    glass(c, P.circle(0, 22, 13), darken(C.R, 0.15), { bb: [-13, 9, 26, 26], noShadow: true, lw: 2 });
    // face
    c.fillStyle = C.K; c.beginPath(); c.arc(-50, -90, 11, 0, 7); c.arc(50, -90, 11, 0, 7); c.fill();
    c.strokeStyle = C.K; c.lineWidth = 6; c.beginPath(); c.arc(0, -60, 26, 0.15, Math.PI - 0.15); c.stroke();
    // arms: baton follows the beat
    const ba = o.baton ?? 0;
    c.strokeStyle = C.K; c.lineWidth = 22; c.lineCap = "round";
    c.beginPath(); c.moveTo(170, 60); c.quadraticCurveTo(260, -10 + ba * 60, 300, -120 + ba * 140); c.stroke();
    c.beginPath(); c.moveTo(-170, 60); c.quadraticCurveTo(-250, 0 - ba * 40, -290, -90 - ba * 60); c.stroke();
    glass(c, P.circle(300, -120 + ba * 140, 26), "#ffffff", { bb: [274, -146 + ba * 140, 52, 52], noShadow: true, lw: 2 });
    glass(c, P.circle(-290, -90 - ba * 60, 26), "#ffffff", { bb: [-316, -116 - ba * 60, 52, 52], noShadow: true, lw: 2 });
    c.save(); c.translate(300, -120 + ba * 140); c.rotate(-0.9 + ba * 0.9);
    c.strokeStyle = "#ffffff"; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -170); c.stroke();
    c.strokeStyle = rgba(C.K, 0.3); c.lineWidth = 2; c.stroke(); c.restore();
  }
  function microwave(c, t, o = {}) {
    const on = o.on ?? 0;
    const body = P.rr(-130, -85, 260, 170, 22);
    glass(c, body, "#dfe5ef", { bb: [-130, -85, 260, 170], sb: 20 });
    c.save(); c.translate(-115, 0); c.rotate(-(o.door ?? 0) * 0.5); c.translate(115, 0);
    const win = P.rr(-110, -65, 170, 130, 14);
    glass(c, win, on > 0 ? mixc(C.B, C.Y, on) : C.B, { bb: [-110, -65, 170, 130], noShadow: true, alpha: 0.85 });
    if (o.sock) { c.save(); c.clip(win); c.translate(-25, 0); c.rotate(t * 4); c.scale(0.2, 0.2); sock(c, { sb: 4 }); c.restore(); }
    if (on > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = rgba(C.Y, 0.5 * on); c.fill(win); c.restore(); }
    c.restore();
    glass(c, P.rr(72, -65, 42, 130, 10), C.K, { bb: [72, -65, 42, 130], noShadow: true, lw: 2 });
    c.fillStyle = on > 0.5 ? C.G : rgba(C.G, 0.5); c.fillRect(80, -55, 26, 14);
    // music note of each microwave
    if (on > 0.05) { c.save(); c.globalAlpha *= on; c.fillStyle = C.K; c.font = `900 60px ${K.FONT}`; c.textAlign = "center"; c.fillText("♪", 0, -110 - on * 30); c.restore(); }
  }

  // ---------------------------------------------------------------- deer on the phone
  function deer(c, t, o = {}) {
    const talk = o.talk ?? 0;
    caustic(c, 0, 330, 260, 34, C.Y, 0.3);
    for (const x of [-120, -60, 90]) glass(c, P.rr(x - 18, 120, 36, 210, 16), darken(C.Y, 0.08), { bb: [x - 18, 120, 36, 210], sb: 8 });
    glass(c, P.ellipse(-20, 80, 210, 120), C.Y, { bb: [-230, -40, 420, 240], sb: 30 });
    // neck & head
    const nk = P.poly([[60, 40], [150, 40], [170, -230], [100, -240]]);
    glass(c, nk, C.Y, { bb: [60, -240, 110, 280], sb: 14 });
    c.save(); c.translate(150, -280);
    // antlers
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 16; c.lineCap = "round";
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(s * 20, -50); c.lineTo(s * 60, -170); c.moveTo(s * 45, -120); c.lineTo(s * 105, -150); c.moveTo(s * 55, -150); c.lineTo(s * 20, -210); c.stroke();
    }
    c.strokeStyle = rgba(C.K, 0.2); c.lineWidth = 3;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 20, -50); c.lineTo(s * 60, -170); c.stroke(); }
    glass(c, P.ellipse(0, 0, 80, 70), C.Y, { bb: [-80, -70, 160, 140], sb: 14 });
    glass(c, P.ellipse(70, 30, 55, 40), lighten(C.Y, 0.3), { bb: [15, -10, 110, 80], noShadow: true });
    c.fillStyle = C.K; c.beginPath(); c.arc(115, 22, 12, 0, 7); c.fill();
    c.beginPath(); c.arc(10, -15, 10, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(13, -18, 3.5, 0, 7); c.fill();
    c.fillStyle = darken(C.R, 0.3); c.beginPath(); c.ellipse(80, 58, 20, 4 + 10 * talk, 0, 0, 7); c.fill();
    glass(c, P.ellipse(-70, -50, 22, 50, -0.8), C.Y, { bb: [-92, -100, 44, 100], sb: 6 });
    // phone held to the ear by the raised front leg
    c.save(); c.translate(-60, 10); c.rotate(-0.3); phone(c, 80, 150);
    c.fillStyle = rgba(C.B, 0.8); c.fillRect(-30, -60, 60, 110); c.restore();
    c.restore();
    c.strokeStyle = darken(C.Y, 0.08); c.lineWidth = 34; c.lineCap = "round";
    c.beginPath(); c.moveTo(110, 120); c.quadraticCurveTo(170, 20, 100, -250); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 3; c.stroke();
  }

  // ---------------------------------------------------------------- moon, mustache, star, drop
  function moon(c, t, o = {}) {
    const m = P.circle(0, 0, 300);
    glass(c, m, C.Y, { bb: [-300, -300, 600, 600], sb: 60, so: 30, shadowA: 0.45 });
    c.save(); c.clip(m);
    for (const [x, y, r] of [[-150, -120, 50], [140, -160, 34], [160, 120, 60], [-90, 170, 30]]) glass(c, P.circle(x, y, r), lighten(C.Y, 0.35), { bb: [x - r, y - r, r * 2, r * 2], noShadow: true, alpha: 0.7, lw: 2 });
    c.restore();
    const eo = o.eyesOpen ?? 0, sq = o.squint ?? 0;
    c.strokeStyle = C.K; c.lineWidth = 9; c.lineCap = "round";
    for (const s of [-1, 1]) {
      if (eo > 0.5) { c.fillStyle = "#fff"; c.beginPath(); c.arc(s * 90, -40, 34, 0, 7); c.fill(); c.fillStyle = C.K; c.beginPath(); c.arc(s * 90, -36, 16, 0, 7); c.fill(); }
      else { c.beginPath(); c.arc(s * 90, -40 + sq * 10, 30, Math.PI + 0.3, -0.3, false); c.stroke(); }
    }
    glass(c, P.ellipse(0, 20, 30, 40), darken(C.Y, 0.1), { bb: [-30, -20, 60, 80], noShadow: true, lw: 2 });
    c.beginPath(); c.arc(0, 110, 60, 0.25, Math.PI - 0.25); c.stroke();
  }
  const MUSTACHE = (() => {
    const p = new Path2D();
    p.moveTo(0, 0);
    p.bezierCurveTo(40, -40, 120, -40, 170, 0); p.bezierCurveTo(210, 30, 250, 10, 260, -30);
    p.bezierCurveTo(270, 30, 210, 80, 150, 60); p.bezierCurveTo(90, 40, 40, 30, 0, 50);
    p.bezierCurveTo(-40, 30, -90, 40, -150, 60); p.bezierCurveTo(-210, 80, -270, 30, -260, -30);
    p.bezierCurveTo(-250, 10, -210, 30, -170, 0); p.bezierCurveTo(-120, -40, -40, -40, 0, 0); p.closePath();
    return p;
  })();
  function mustache(c, white = false) {
    glass(c, MUSTACHE, white ? "#f4f6fb" : C.K, { bb: [-270, -40, 540, 120], sb: 16, alpha: 0.92 });
  }
  const STAR = P.star(60, 26);
  function star(c, col, s = 1) {
    c.save(); c.scale(s, s); glass(c, STAR, col, { bb: [-60, -60, 120, 120], sb: 10, lw: 3 / s }); c.restore();
  }
  const DROP = (() => { const p = new Path2D(); p.moveTo(0, -70); p.bezierCurveTo(30, -20, 40, 10, 40, 30); p.arc(0, 30, 40, 0, Math.PI); p.bezierCurveTo(-40, 10, -30, -20, 0, -70); p.closePath(); return p; })();
  function drop(c, s = 1) { c.save(); c.scale(s, s); glass(c, DROP, C.B, { bb: [-40, -70, 80, 140], sb: 8, lw: 3 / s, alpha: 0.75 }); c.restore(); }

  // ---------------------------------------------------------------- umbrella
  function umbrella(c, col, open = 1) {
    c.strokeStyle = "#5f6368"; c.lineWidth = 10; c.lineCap = "round";
    c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 230); c.arc(-26, 230, 26, 0, Math.PI); c.stroke();
    const w = lerp(50, 300, open), h = lerp(260, 150, open);
    const cp = new Path2D(); cp.moveTo(-w, 0);
    const n = 5;
    for (let i = 0; i < n; i++) { const x0 = -w + (2 * w * i) / n, x1 = -w + (2 * w * (i + 1)) / n; cp.quadraticCurveTo((x0 + x1) / 2, -30 * open, x1, 0); }
    cp.quadraticCurveTo(w * 0.9, -h, 0, -h - 10); cp.quadraticCurveTo(-w * 0.9, -h, -w, 0); cp.closePath();
    glass(c, cp, col, { bb: [-w, -h - 10, w * 2, h + 10], sb: 20 });
    c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 3;
    for (let i = 1; i < n; i++) { const x = -w + (2 * w * i) / n; c.beginPath(); c.moveTo(0, -h - 5); c.quadraticCurveTo(x * 0.6, -h * 0.6, x, -2); c.stroke(); }
  }

  // ---------------------------------------------------------------- living room
  function livingRoom(c, t, o = {}) {
    const wall = c.createLinearGradient(0, 0, 0, 1920);
    wall.addColorStop(0, "#fff8e6"); wall.addColorStop(1, "#fdeec7");
    c.fillStyle = wall; c.fillRect(-2000, -2000, 5080, 5920);
    for (let i = 0; i < 6; i++) glass(c, P.rr(60 + i * 170, 260, 130, 980, 30), "#fff3d1", { bb: [60 + i * 170, 260, 130, 980], noShadow: true, alpha: 0.45, lw: 2 });
    const floor = c.createLinearGradient(0, 1250, 0, 1920);
    floor.addColorStop(0, "#e8d5b0"); floor.addColorStop(1, "#d8bf92");
    c.fillStyle = floor; c.fillRect(-2000, 1250, 5080, 3000);
    glass(c, P.ellipse(540, 1520, 470, 120), C.B, { bb: [70, 1400, 940, 240], noShadow: true, alpha: 0.55 });
    // window
    glass(c, P.rr(120, 330, 300, 380, 30), lighten(C.B, 0.4), { bb: [120, 330, 300, 380], sb: 20, alpha: 0.6 });
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 10; c.beginPath(); c.moveTo(270, 330); c.lineTo(270, 710); c.moveTo(120, 520); c.lineTo(420, 520); c.stroke();
    // framed portrait of a sock
    glass(c, P.rr(700, 380, 240, 290, 18), C.Y, { bb: [700, 380, 240, 290], sb: 16 });
    c.fillStyle = "#fff"; c.fillRect(725, 405, 190, 240);
    c.save(); c.translate(800, 525); c.scale(0.38, 0.38); sock(c, { sb: 6 }); c.restore();
    // armchair
    glass(c, P.rr(170, 860, 440, 520, 90), C.R, { bb: [170, 860, 440, 520], sb: 40 });
    glass(c, P.rr(120, 1080, 110, 320, 50), darken(C.R, 0.05), { bb: [120, 1080, 110, 320], sb: 20 });
    glass(c, P.rr(550, 1080, 110, 320, 50), darken(C.R, 0.05), { bb: [550, 1080, 110, 320], sb: 20 });
    glass(c, P.rr(220, 1180, 340, 150, 40), lighten(C.R, 0.2), { bb: [220, 1180, 340, 150], sb: 16 });
    for (const x of [190, 590]) glass(c, P.rr(x - 15, 1390, 30, 70, 10), "#8d6e63", { bb: [x - 15, 1390, 30, 70], noShadow: true, lw: 2 });
    // side table and lamp
    glass(c, P.rr(760, 1140, 220, 40, 12), C.G, { bb: [760, 1140, 220, 40], sb: 16 });
    glass(c, P.rr(855, 1180, 30, 260, 10), C.G, { bb: [855, 1180, 30, 260], sb: 10 });
    glass(c, P.rr(845, 900, 50, 240, 14), "#5f6368", { bb: [845, 900, 50, 240], sb: 10 });
    const shade = P.poly([[780, 900], [960, 900], [920, 740], [820, 740]]);
    glass(c, shade, C.Y, { bb: [780, 740, 180, 160], sb: 30, shadowA: 0.6 });
    if (o.lamp !== 0) {
      c.save(); c.globalCompositeOperation = "lighter";
      const g = c.createRadialGradient(870, 900, 10, 870, 1100, 700);
      g.addColorStop(0, rgba(C.Y, 0.35 * (o.lamp ?? 1))); g.addColorStop(1, rgba(C.Y, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(790, 900); c.lineTo(950, 900); c.lineTo(1300, 1700); c.lineTo(400, 1700); c.closePath(); c.fill();
      c.restore();
    }
  }

  // ---------------------------------------------------------------- grandpa
  function grandpa(c, t, o = {}) {
    const raise = o.raise ?? 1;
    const skin = "#f6c9a0";
    caustic(c, 0, 470, 330, 40, C.B, 0.3);
    // legs
    for (const s of [-1, 1]) glass(c, P.rr(s * 70 - 50, 120, 100, 300, 40), "#5f6368", { bb: [s * 70 - 50, 120, 100, 300], sb: 16 });
    // left foot: wearing the red sock
    c.save(); c.translate(-80, 400); c.scale(-0.55, 0.55); c.rotate(0.0); sock(c, { sb: 10 }); c.restore();
    // right foot: bare, with toes
    c.save(); c.translate(90, 455);
    glass(c, P.rr(-50, -40, 170, 80, 40), skin, { bb: [-50, -40, 170, 80], sb: 12 });
    for (let i = 0; i < 5; i++) glass(c, P.circle(108 - i * 4, -22 + i * 13, 13 - i * 1.4), skin, { bb: [95 - i * 4, -35 + i * 13, 26, 26], noShadow: true, lw: 2 });
    c.restore();
    // body / cardigan
    const body = P.rr(-210, -330, 420, 500, 140);
    glass(c, body, C.B, { bb: [-210, -330, 420, 500], sb: 40 });
    glass(c, P.poly([[-40, -320], [40, -320], [0, -170]]), "#ffffff", { bb: [-40, -320, 80, 150], noShadow: true, lw: 2 });
    c.fillStyle = "rgba(255,255,255,0.85)"; for (const y of [-120, -40, 40]) { c.beginPath(); c.arc(0, y, 10, 0, 7); c.fill(); }
    // left arm on hip
    c.strokeStyle = C.B; c.lineWidth = 70; c.lineCap = "round";
    c.beginPath(); c.moveTo(-180, -260); c.quadraticCurveTo(-320, -120, -200, -20); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4; c.stroke();
    // right arm raises the trophy sock
    const ang = lerp(0.4, -1.25, raise);
    const ex = 180 + Math.cos(ang) * 230, ey = -270 + Math.sin(ang) * 230;
    c.strokeStyle = darken(C.B, 0.05); c.lineWidth = 70;
    c.beginPath(); c.moveTo(180, -270); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 4; c.stroke();
    glass(c, P.circle(ex, ey, 40), skin, { bb: [ex - 40, ey - 40, 80, 80], sb: 10 });
    if (o.trophy) o.trophy(c, ex, ey);
    // head
    glass(c, P.ellipse(0, -460, 150, 165), skin, { bb: [-150, -625, 300, 330], sb: 30 });
    for (const s of [-1, 1]) glass(c, P.ellipse(s * 140, -470, 50, 66, s * 0.3), "#f4f6fb", { bb: [s * 140 - 50, -536, 100, 132], sb: 10 });
    for (const s of [-1, 1]) glass(c, P.ellipse(s * 150, -455, 28, 40), skin, { bb: [s * 150 - 28, -495, 56, 80], noShadow: true, lw: 2 });
    // round glasses + happy eyes
    c.strokeStyle = C.K; c.lineWidth = 7; c.lineCap = "round";
    for (const s of [-1, 1]) {
      c.beginPath(); c.arc(s * 58, -485, 46, 0, 7); c.stroke();
      c.beginPath(); c.arc(s * 58, -478, 18, Math.PI + 0.4, -0.4); c.stroke();
    }
    c.beginPath(); c.moveTo(-12, -490); c.lineTo(12, -490); c.stroke();
    glass(c, P.ellipse(0, -420, 30, 34), darken(skin, 0.06), { bb: [-30, -454, 60, 68], noShadow: true, lw: 2 });
    c.save(); c.translate(0, -375); c.scale(0.42, 0.42); mustache(c, true); c.restore();
    c.strokeStyle = darken(C.R, 0.3); c.lineWidth = 7; c.beginPath(); c.arc(0, -350, 34, 0.3, Math.PI - 0.3); c.stroke();
    // hair tufts
    for (const s of [-1, 1]) glass(c, P.ellipse(s * 95, -570, 46, 30, s * 0.5), "#f4f6fb", { bb: [s * 95 - 46, -600, 92, 60], sb: 8 });
  }
  const FOOT_BARE = { x: 150, y: 455 };

  // ---------------------------------------------------------------- padlock
  function padlock(c, t, o = {}) {
    const cr = o.crack ?? 0;
    const sh = new Path2D(); sh.arc(0, -70, 90, Math.PI, 0); sh.lineTo(60, -70); sh.arc(0, -70, 60, 0, Math.PI, true); sh.closePath();
    glass(c, sh, "#dfe5ef", { bb: [-90, -160, 180, 90], sb: 16 });
    const body = P.rr(-140, -80, 280, 240, 40);
    // silhouette of the second sock behind the glass
    c.save(); c.clip(body);
    c.globalAlpha = 0.2 + 0.45 * (o.reveal ?? 0);
    c.translate(-10, 40); c.scale(0.42, 0.42); c.fillStyle = darken(C.R, 0.25); c.fill(SOCK);
    c.restore();
    glass(c, body, C.B, { bb: [-140, -80, 280, 240], sb: 40, alpha: 0.72 });
    glass(c, P.circle(0, 20, 22), C.K, { bb: [-22, -2, 44, 44], noShadow: true, lw: 2 });
    c.fillStyle = C.K; c.fillRect(-8, 30, 16, 50);
    // cracks with light leaking through
    if (cr > 0) {
      const rnd = K.mulberry(11);
      c.save(); c.clip(body);
      const cracks = [];
      for (let k = 0; k < 6; k++) {
        const pts = [[0, 20]]; let a = k * 1.05 + rnd(); let x = 0, y = 20;
        for (let s = 0; s < 6; s++) { a += (rnd() - 0.5) * 0.9; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); }
        cracks.push(pts);
      }
      const cols = [C.B, C.R, C.Y, C.G, C.B, C.Y];
      cracks.forEach((pts, k) => {
        const show = clamp(cr * 6 - k);
        if (show <= 0) return;
        const n = Math.max(2, Math.floor(pts.length * show));
        c.globalCompositeOperation = "lighter";
        c.strokeStyle = rgba(cols[k], 0.7); c.lineWidth = 14; c.lineCap = "round";
        c.beginPath(); for (let i = 0; i < n; i++) i ? c.lineTo(...pts[i]) : c.moveTo(...pts[i]); c.stroke();
        c.globalCompositeOperation = "source-over";
        c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 3; c.stroke();
      });
      c.restore();
      // rays out through the cracks
      c.save(); c.globalCompositeOperation = "lighter";
      cracks.forEach((pts, k) => {
        const show = clamp(cr * 6 - k);
        if (show < 0.6) return;
        const [x, y] = pts[pts.length - 1];
        const a = Math.atan2(y - 20, x);
        const len = 600 * (show - 0.5) * (o.rays ?? 1);
        const g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
        g.addColorStop(0, rgba(cols[k], 0.55)); g.addColorStop(1, rgba(cols[k], 0));
        c.fillStyle = g;
        c.beginPath(); c.moveTo(x, y);
        c.lineTo(x + Math.cos(a - 0.12) * len, y + Math.sin(a - 0.12) * len);
        c.lineTo(x + Math.cos(a + 0.12) * len, y + Math.sin(a + 0.12) * len); c.closePath(); c.fill();
      });
      c.restore();
    }
  }

  // ---------------------------------------------------------------- comment icon
  function comment(c) {
    const p = new Path2D(); p.roundRect(-120, -90, 240, 160, 50); p.moveTo(-50, 68); p.lineTo(-80, 130); p.lineTo(10, 68); p.closePath();
    glass(c, p, C.B, { bb: [-120, -90, 240, 220], sb: 30 });
    c.fillStyle = "#fff"; for (const x of [-55, 0, 55]) { c.beginPath(); c.arc(x, -10, 14, 0, 7); c.fill(); }
  }

  window.CH = { sock, SOCK, dove, cow, COW_EYE_L, galaxy, typewriter, paper, cactus, lighthouse, elevator, flamingo, turtle, sheep, bus, tub, swan, phone, pineapple, microwave, deer, moon, mustache, star, drop, umbrella, livingRoom, grandpa, FOOT_BARE, padlock, comment };
})();
