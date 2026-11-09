// v2: characters are GPT Image 2.6 liquid-glass renders (cut out in tools/cutout.py), animated here in code.
// Each function keeps the vector version's API and footprint, so the camera choreography stays the same.
(function () {
  const { C, glass, P, rgba, lighten, darken, mixc, clamp, lerp } = K;
  const IMG = (window.IMG = {});
  const NAMES = ["sock", "dove", "cow", "cactus", "typewriter", "lighthouse", "flamingo", "bus", "swan", "tub", "pineapple", "microwave",
    "deer", "moon", "mustache", "umbrella", "grandpa", "turtle", "elevator", "padlock", "room"];
  window.IMG_READY = Promise.all(NAMES.map((n) => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = rej; im.src = `assets/img/${n}.png`;
  })));
  // draw image n centred on (x, y) at scale s
  function im(c, n, x, y, s, alpha = 1) {
    const i = IMG[n]; if (!i) return;
    c.save(); c.globalAlpha *= alpha; c.drawImage(i, x - (i.width * s) / 2, y - (i.height * s) / 2, i.width * s, i.height * s); c.restore();
  }
  const V = Object.assign({}, CH); // keep the vector versions for the bits that need geometry

  CH.sock = function (c, o = {}) {
    const knit = o.knit ?? 1;
    c.save();
    if (knit < 1) { c.beginPath(); c.rect(-260, -280, 640, 50 + 520 * knit); c.clip(); }
    im(c, "sock", 90, 10, 0.46, o.alpha ?? 1);
    if (o.tie) {
      c.save(); c.translate(36, -10);
      const tp = new Path2D();
      tp.moveTo(-16, -168); tp.lineTo(16, -168); tp.lineTo(10, -146); tp.lineTo(26, -40); tp.lineTo(0, -10); tp.lineTo(-26, -40); tp.lineTo(-10, -146); tp.closePath();
      glass(c, tp, C.B, { bb: [-28, -170, 56, 160], sb: 10, so: 6, lw: 3 });
      glass(c, P.rr(-20, -186, 40, 26, 8), darken(C.B, 0.15), { bb: [-20, -186, 40, 26], noShadow: true, lw: 3 });
      c.restore();
    }
    c.restore();
  };
  CH.dove = function (c, t, o = {}) {
    const flap = Math.sin(t * (o.flapHz ?? 9) * Math.PI * 2);
    c.save(); c.scale(1, 1 - 0.08 * flap); c.rotate(0.04 * flap);
    if (o.lamp !== false) {
      c.save(); c.globalCompositeOperation = "lighter";
      const g = c.createLinearGradient(130, -150, 420, -210);
      g.addColorStop(0, "rgba(251,188,5,0.5)"); g.addColorStop(1, "rgba(251,188,5,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(130, -150); c.lineTo(440, -260); c.lineTo(440, -90); c.closePath(); c.fill(); c.restore();
    }
    im(c, "dove", 0, -20, 0.42);
    c.restore();
  };
  CH.COW_EYE_L.x = 540 + (0.3274 - 0.5) * 760; CH.COW_EYE_L.y = 870 + (0.4624 - 0.5) * 880; CH.COW_EYE_L.r = 78;
  CH.cow = function (c, t, o = {}) {
    const sq = o.squint ?? 0;
    c.save(); c.translate(540, 870); c.scale(1 + 0.02 * sq, 1 - 0.04 * sq);
    im(c, "cow", 0, 0, 760 / 880);
    c.restore();
    // the universe in the eye keeps turning: a soft additive swirl over the painted galaxy
    const L = CH.COW_EYE_L;
    c.save(); c.beginPath(); c.arc(L.x, L.y, L.r * 0.95, 0, 7); c.clip(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 60; i++) {
      const k = i / 60, a = k * 8 + t * 1.2, rr = L.r * (0.1 + 0.85 * k);
      c.fillStyle = rgba(K.GC[i % 4], 0.35 * (1 - k));
      c.beginPath(); c.arc(L.x + Math.cos(a) * rr, L.y + Math.sin(a) * rr * 0.85, 2 + 4 * (1 - k), 0, 7); c.fill();
    }
    c.restore();
    // nostrils flare on the inhale
    if ((o.nostril ?? 1) > 1.05) {
      for (const x of [478, 602]) { c.fillStyle = rgba(darken(C.R, 0.6), 0.5 * ((o.nostril - 1) / 0.45)); c.beginPath(); c.ellipse(x, 1092, 30 * o.nostril, 22 * o.nostril, 0, 0, 7); c.fill(); }
    }
  };
  CH.cactus = function (c, t, o = {}) {
    const arm = o.arm ?? 0;
    c.save(); c.translate(0, 370); c.rotate(0.14 * arm); c.scale(1 + 0.03 * arm, 1 - 0.04 * arm); c.translate(0, -370);
    im(c, "cactus", 0, 50, 0.625); c.restore();
  };
  CH.typewriter = function (c, t, o = {}) {
    const open = o.open ?? 0;
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
    const press = o.pressKey >= 0 ? 1 : 0;
    for (const s of [-1, 1]) {
      c.save(); c.translate(540 + s * 330, 1360); c.rotate(s * open * 1.25); c.translate(-(540 + s * 330), -1360);
      c.globalAlpha *= 1 - open * 0.9;
      c.beginPath(); s < 0 ? c.rect(-200, 0, 740, 2000) : c.rect(540, 0, 800, 2000); c.clip();
      c.translate(0, press * 4);
      im(c, "typewriter", 540, 1050, 0.6275);
      c.restore();
    }
  };
  CH.lighthouse = function (c, t, o = {}) {
    const sway = o.sway ?? 0, hip = o.hip ?? 0;
    K.caustic(c, 0, 10, 220, 34, C.R, 0.35);
    c.save(); c.translate(hip * 50, 0); c.transform(1, 0, sway * 0.35, 1, 0, 0);
    c.save(); c.translate(0, -770); c.rotate(o.beam ?? 0); c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, "rgba(251,188,5,0.5)"); g.addColorStop(1, "rgba(251,188,5,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(950, -170); c.lineTo(950, 170); c.closePath(); c.fill(); c.restore();
    c.translate(0, -460); c.rotate(Math.sin(t * 16) * 0.02); im(c, "lighthouse", 0, 0, 0.788);
    c.restore();
  };
  CH.elevator = function (c, t, o = {}) {
    const open = o.open ?? 0;
    c.strokeStyle = rgba(C.K, 0.45); c.lineWidth = 5;
    c.beginPath(); c.moveTo(-60, -420); c.lineTo(-60, -3000); c.moveTo(60, -420); c.lineTo(60, -3000); c.stroke();
    im(c, "elevator", 0, 0, 0.7437);
    const x0 = -168, x1 = 168, y0 = -199, y1 = 319;
    c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
    if (o.inner) o.inner(c);
    const dw = 168 * (1 - open);
    if (dw > 1) {
      glass(c, P.rr(x0, y0, dw, y1 - y0, 4), lighten(C.G, 0.35), { bb: [x0, y0, dw, y1 - y0], noShadow: true, alpha: 0.95, lw: 3 });
      glass(c, P.rr(x1 - dw, y0, dw, y1 - y0, 4), lighten(C.G, 0.35), { bb: [x1 - dw, y0, dw, y1 - y0], noShadow: true, alpha: 0.95, lw: 3 });
    }
    c.restore();
  };
  CH.flamingo = function (c, t) { im(c, "flamingo", 0, 30 + Math.sin(t * 5) * 4, 0.942); };
  CH.turtle = function (c, t, o = {}) {
    const lunge = o.lunge ?? 0, walk = o.walk ?? 0, chew = o.chew ?? 0;
    K.caustic(c, 0, 220, 260, 30, C.G, 0.3);
    c.save(); c.translate(-80 * lunge, -50 * lunge + Math.abs(Math.sin(walk * 14)) * -10); c.rotate(-0.15 * lunge);
    c.scale(1, 1 - 0.04 * chew); im(c, "turtle", 0, 0, 0.5); c.restore();
  };
  CH.bus = function (c, t, o = {}) {
    K.caustic(c, 0, 280, 520, 50, C.Y, 0.35);
    c.save(); c.translate(0, 20);
    // wheels spin: a rotating glint over each wheel
    im(c, "bus", 0, 0, 0.75);
    for (const x of [-0.3, 0.3]) { c.save(); c.translate(x * 1000 * 0.95, 190); c.rotate(o.wheel ?? 0); c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, 0); c.lineTo(40, 0); c.stroke(); c.restore(); }
    c.restore();
    if ((o.pop ?? 0) > 0) { c.save(); c.translate(395, -210 - 90 * o.pop); c.scale(0.8 * o.pop, 0.8 * o.pop); V.sheep(c, t, { bleat: o.bleat }); c.restore(); }
  };
  CH.swan = function (c) { im(c, "swan", 0, 0, 0.679); };
  CH.tub = function (c, t, o = {}) { im(c, "tub", 0, 30, 0.571); };
  CH.pineapple = function (c, t, o = {}) {
    c.save(); c.translate(0, 380); c.rotate((o.baton ?? 0) * 0.06); c.translate(0, -380);
    im(c, "pineapple", 0, -60, 0.77); c.restore();
  };
  CH.microwave = function (c, t, o = {}) {
    const on = o.on ?? 0;
    c.save(); c.translate(0, -(o.door ?? 0) * 6);
    im(c, "microwave", 0, 0, 0.2567);
    if (o.sock) { c.save(); c.beginPath(); c.rect(-105, -70, 150, 120); c.clip(); c.translate(-30, 0); c.rotate(t * 4); c.scale(0.2, 0.2); CH.sock(c, {}); c.restore(); }
    if (on > 0) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = rgba(C.Y, 0.55 * on); c.beginPath(); c.roundRect(-108, -74, 156, 128, 14); c.fill(); c.restore(); }
    if (on > 0.05) { c.save(); c.globalAlpha *= on; c.fillStyle = C.K; c.font = `900 60px ${K.FONT}`; c.textAlign = "center"; c.fillText("♪", 0, -120 - on * 30); c.restore(); }
    c.restore();
  };
  CH.deer = function (c, t, o = {}) {
    const talk = o.talk ?? 0;
    K.caustic(c, 0, 330, 260, 34, C.Y, 0.3);
    c.save(); c.translate(0, 330); c.scale(1, 1 + 0.015 * talk); c.rotate(Math.sin(t * 2) * 0.015); c.translate(0, -330);
    im(c, "deer", 0, -80, 0.8); c.restore();
  };
  CH.moon = function (c, t, o = {}) {
    im(c, "moon", 0, 0, 0.62);
    if ((o.eyesOpen ?? 0) > 0.5) {
      for (const s of [-1, 1]) {
        glass(c, P.circle(s * 80, -30, 40), "#ffffff", { bb: [s * 80 - 40, -70, 80, 80], sb: 8, lw: 3 });
        c.fillStyle = C.K; c.beginPath(); c.arc(s * 80, -26, 18, 0, 7); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(s * 80 - 6, -32, 6, 0, 7); c.fill();
      }
    }
  };
  CH.mustache = function (c, white = false) {
    if (white) return V.mustache(c, true);
    im(c, "mustache", 0, 10, 0.404);
  };
  CH.umbrella = function (c, col, open = 1) {
    if (col !== C.R || open < 0.35) return V.umbrella(c, col, open);
    c.save(); c.scale(clamp((open - 0.35) / 0.65 * 1.2, 0.2, 1), 1);
    im(c, "umbrella", 0, 103, 0.606); c.restore();
  };
  CH.livingRoom = function (c, t, o = {}) {
    c.fillStyle = "#f6ecd8"; c.fillRect(-2000, -2000, 5080, 5920);
    const i = IMG.room; c.drawImage(i, 0, -5, 1080, 1930);
    const lamp = o.lamp ?? 1;
    if (lamp < 1) { c.fillStyle = `rgba(0,0,0,${(1 - lamp) * 0.55})`; c.fillRect(-2000, -2000, 5080, 5920); }
  };
  // grandpa: fist raised (the trophy sock sits on it), left sock on, right foot bare
  const GS = 1100 / 1168;
  CH.FOOT_BARE.x = (0.3007 - 0.5) * 698 * GS; CH.FOOT_BARE.y = -75 + (0.9205 - 0.5) * 1100;
  CH.FIST = { x: (0.159 - 0.5) * 698 * GS + 18, y: -75 + (0.013 - 0.5) * 1100 + 40 };
  CH.grandpa = function (c, t, o = {}) {
    const raise = o.raise ?? 1;
    K.caustic(c, 0, 470, 330, 40, C.B, 0.3);
    const hop = -50 * K.bell(clamp(raise)) ;
    c.save(); c.translate(0, hop);
    im(c, "grandpa", 0, -75, GS);
    if (o.trophy) o.trophy(c, CH.FIST.x, CH.FIST.y, raise);
    c.restore();
  };
  CH.padlock = function (c, t, o = {}) {
    im(c, "padlock", 0, -5, 0.296);
    // silhouette of the second sock behind the glass
    c.save(); c.beginPath(); c.roundRect(-110, -10, 220, 150, 30); c.clip();
    c.globalAlpha = 0.12 + 0.4 * (o.reveal ?? 0); c.globalCompositeOperation = "multiply";
    c.translate(-10, 70); c.scale(0.32, 0.32); c.fillStyle = darken(C.R, 0.2); c.fill(CH.SOCK); c.restore();
    V.padlock(c, t, Object.assign({}, o, { cracksOnly: true }));
  };
})();
