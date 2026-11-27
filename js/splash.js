/* Automata: ArcForge — the title screen.
   A studio card, then the ArcForge logo slams in over a living forge-night scene: drifting embers, turning
   gears, foundry chimneys, and your pilot walking with their automaton. The logo itself is animated
   (light sweep, pulsing arc crystals, arcs of lightning). Tap or press a key to open the title menu. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);
  const SP = (AF.Splash = { stage: 'studio', t0: 0, logoAt: 0 });
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- assets ----------
  const logo = new Image(); logo.src = 'assets/logo.png?v=0.17.0';
  let botImg = null;
  function makeBot() {
    try {
      const svg = AF.robotSVG({ arc: 3, frame: 3, legs: 2, arms: 2, weapon: 3, shield: 2 }, { core: '#3ad0ff', bot: { paint: 11, trim: 10, chassis: 'round', head: 'dome', eyes: 'happy', antenna: 'bolt', decal: 'bolt' } });
      const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg', svg.includes('xmlns=') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"')); botImg = im;
    } catch (e) {}
  }
  const pilotLook = () => Object.assign(AF.defaultLook ? AF.defaultLook('f') : {}, { hair: 4, hairColor: 2, skin: 2, eyes: 3, outfit: { hat: 'aviator_cap', top: 'ranger_jacket', bottom: 'cargo_pants', shoes: 'trail_boots', cape: 'traveler_cloak', gloves: 'work_gloves' } });

  // ---------- background scene ----------
  const R = (a) => { let s = a; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296; };
  const rnd = R(77);
  const stars = Array.from({ length: 120 }, () => ({ x: rnd(), y: rnd() * 0.55, r: rnd() * 1.3 + 0.3, p: rnd() * 6 }));
  const ridge = (seed, n) => { const r = R(seed); return Array.from({ length: n + 1 }, (_, i) => 0.5 + 0.5 * Math.sin(i * 0.7 + r() * 2) * r()); };
  const R1 = ridge(3, 24), R2 = ridge(9, 18);
  let embers = [];
  function gearPath(g, cx, cy, r, teeth, rot) {
    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = rot + (i / (teeth * 2)) * Math.PI * 2, a1 = rot + ((i + 1) / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.84 : r;
      g.lineTo(cx + Math.cos(a0 + 0.04) * rr, cy + Math.sin(a0 + 0.04) * rr); g.lineTo(cx + Math.cos(a1 - 0.04) * rr, cy + Math.sin(a1 - 0.04) * rr);
    }
    g.closePath(); g.moveTo(cx + r * 0.4, cy); g.arc(cx, cy, r * 0.4, 0, Math.PI * 2, true);
  }
  function drawBg(c, t) {
    const g = c.getContext('2d'), W = c.width, H = c.height, k = W / c.clientWidth || 1;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#070a12'); sky.addColorStop(0.55, '#16141e'); sky.addColorStop(0.8, '#3a1e12'); sky.addColorStop(1, '#120a06');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // stars
    stars.forEach((s) => { g.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); g.fillStyle = '#cfe8ff'; g.beginPath(); g.arc(s.x * W, s.y * H, s.r * k, 0, 7); g.fill(); }); g.globalAlpha = 1;
    // big faint gears turning behind everything
    g.save(); g.globalAlpha = 0.07; g.fillStyle = '#ffb060';
    gearPath(g, W * 0.12, H * 0.3, H * 0.26, 14, t / 9000); g.fill('evenodd');
    gearPath(g, W * 0.9, H * 0.22, H * 0.18, 10, -t / 6500); g.fill('evenodd');
    gearPath(g, W * 0.78, H * 0.62, H * 0.12, 9, t / 5000); g.fill('evenodd');
    g.restore();
    // forge glow on the horizon
    const hz = H * 0.74, glow = g.createRadialGradient(W * 0.5, hz, 0, W * 0.5, hz, W * 0.6); glow.addColorStop(0, 'rgba(255,120,40,.35)'); glow.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    // far ridge, near ridge with chimneys (slow parallax)
    const ridgeFill = (pts, base, amp, col, speed) => {
      const off = ((t * speed) % (W / (pts.length - 1))), step = W / (pts.length - 2);
      g.fillStyle = col; g.beginPath(); g.moveTo(-step, H);
      for (let i = 0; i < pts.length; i++) g.lineTo(i * step - off - step * 0.5, base - pts[(i + Math.floor((t * speed) / step)) % pts.length] * amp);
      g.lineTo(W + step, H); g.closePath(); g.fill();
    };
    ridgeFill(R1, H * 0.72, H * 0.18, '#1c1620', 0.004);
    ridgeFill(R2, H * 0.8, H * 0.12, '#140f12', 0.009);
    // foundry silhouettes with lit windows and smoke
    const fx = [0.18, 0.32, 0.66, 0.84];
    fx.forEach((x, i) => {
      const bx = W * x, bw = H * (0.07 + (i % 2) * 0.03), bh = H * (0.12 + (i % 3) * 0.04), by = H * 0.83;
      g.fillStyle = '#0e0a0c'; g.fillRect(bx - bw / 2, by - bh, bw, bh + H * 0.2);
      g.fillRect(bx + bw * 0.15, by - bh - H * 0.08, bw * 0.18, H * 0.08);
      for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 2; wx++) { const on = Math.sin(t / 700 + i * 3 + wx + wy * 2) > -0.6; g.fillStyle = on ? 'rgba(255,170,70,.85)' : 'rgba(255,170,70,.25)'; g.fillRect(bx - bw * 0.3 + wx * bw * 0.36, by - bh + bh * 0.2 + wy * bh * 0.25, bw * 0.16, bh * 0.12); }
      for (let p = 0; p < 4; p++) { const ph = ((t / 2600 + p / 4 + i * 0.37) % 1); g.fillStyle = `rgba(120,110,120,${0.22 * (1 - ph)})`; g.beginPath(); g.arc(bx + bw * 0.24 + ph * H * 0.08 + Math.sin(ph * 6) * 6 * k, by - bh - H * 0.08 - ph * H * 0.22, H * (0.02 + ph * 0.05), 0, 7); g.fill(); }
    });
    // ground
    const gy = H * 0.9; const gr = g.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, '#2a1c14'); gr.addColorStop(1, '#0c0806'); g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
    g.fillStyle = 'rgba(255,150,60,.25)'; g.fillRect(0, gy, W, Math.max(1, 2 * k));
    // the pilot and their automaton walk the road
    const span = W + H * 0.6, pos = ((t / 14000) % 1) * span - H * 0.3, ph = t / 170;
    if (botImg && botImg.complete && botImg.naturalWidth) { const bh = H * 0.15, bw = bh * (botImg.naturalWidth / botImg.naturalHeight); g.save(); g.translate(pos - H * 0.1 - bw / 2, gy - bh + Math.abs(Math.sin(ph)) * -H * 0.006); g.drawImage(botImg, 0, 0, bw, bh); g.restore(); }
    if (AF.drawPilotAt) { try { AF.drawPilotAt(g, pos + H * 0.05, gy + H * 0.002, H * 0.15, SP.look || (SP.look = pilotLook()), 'right', ph, { moving: true, t, blink: (t % 3400) < 140 }); } catch (e) {} }
    // embers rising
    if (!reduce && embers.length < 90) embers.push({ x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 0.3 * k, vy: -(0.4 + Math.random() * 1.1) * k, r: (0.6 + Math.random() * 1.8) * k, life: 1, hue: 20 + Math.random() * 30 });
    g.save(); g.globalCompositeOperation = 'lighter';
    embers.forEach((e) => { e.x += e.vx + Math.sin((t + e.y) / 600) * 0.3 * k; e.y += e.vy; e.life -= 0.0035; g.fillStyle = `hsla(${e.hue},100%,60%,${Math.max(0, e.life) * 0.9})`; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); });
    embers = embers.filter((e) => e.life > 0 && e.y > -10);
    g.restore();
  }

  // ---------- animated logo ----------
  const CORE = [0.553, 0.535], TOPC = [0.5, 0.15], BOTC = [0.502, 0.8];
  let bolts = [], nextBolt = 0, sparks = [];
  function bolt(x0, y0, x1, y1, dev) {
    const pts = [[x0, y0]], n = 9;
    for (let i = 1; i < n; i++) { const f = i / n; pts.push([x0 + (x1 - x0) * f + (Math.random() - 0.5) * dev, y0 + (y1 - y0) * f + (Math.random() - 0.5) * dev * 0.4]); }
    pts.push([x1, y1]); return pts;
  }
  function drawLogo(c, t) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    if (!logo.complete || !logo.naturalWidth) return;
    const since = SP.logoAt ? t - SP.logoAt : -1; if (since < 0) return;
    // fit the logo
    const ar = logo.naturalWidth / logo.naturalHeight; let lw = W * 0.86, lh = lw / ar; if (lh > H * 0.86) { lh = H * 0.86; lw = lh * ar; }
    const drop = reduce ? 1 : Math.min(1, since / 700), ease = 1 - Math.pow(1 - drop, 3);
    const sc = reduce ? 1 : 1.35 - 0.35 * ease + (since > 700 && since < 950 ? Math.sin(((since - 700) / 250) * Math.PI) * 0.03 : 0);
    const fl = Math.sin(t / 1400) * H * 0.012;
    const cx = W / 2, cy = H / 2 + fl, x = cx - (lw * sc) / 2, y = cy - (lh * sc) / 2, w = lw * sc, h = lh * sc;
    const P = (p) => [x + p[0] * w, y + p[1] * h];
    // halo + slow gear ring behind
    g.save(); g.globalAlpha = 0.5 * ease;
    const halo = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55); halo.addColorStop(0, 'rgba(58,208,255,.28)'); halo.addColorStop(0.6, 'rgba(255,150,60,.08)'); halo.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.12 * ease; g.fillStyle = '#ffcf80'; gearPath(g, cx, cy, h * 0.62, 24, t / 12000); g.fill('evenodd');
    g.restore();
    // the logo itself
    g.save(); g.globalAlpha = ease; g.drawImage(logo, x, y, w, h); g.restore();
    // light sweep, only over the logo's own pixels
    const per = 5200, sw = ((since - 900) % per) / per;
    if (since > 900 && sw < 0.32 && !reduce) {
      const off = SP.off || (SP.off = document.createElement('canvas')); if (off.width !== W || off.height !== H) { off.width = W; off.height = H; } const o = off.getContext('2d'); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
      o.drawImage(logo, x, y, w, h); o.globalCompositeOperation = 'source-atop';
      const bx = x - w * 0.3 + (sw / 0.32) * w * 1.6, gr = o.createLinearGradient(bx - w * 0.12, y, bx + w * 0.12, y + h * 0.3);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,250,220,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      o.fillStyle = gr; o.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.8; g.drawImage(off, 0, 0); g.restore();
    }
    // pulsing arc crystals
    g.save(); g.globalCompositeOperation = 'lighter';
    [[CORE, 0.11, 0], [TOPC, 0.08, 1.7], [BOTC, 0.07, 3.1]].forEach(([p, r, ph]) => {
      const [px, py] = P(p), pulse = 0.55 + 0.45 * Math.sin(t / 420 + ph), rr = w * r * (0.85 + pulse * 0.3);
      const gr = g.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, `rgba(190,245,255,${0.75 * pulse * ease})`); gr.addColorStop(0.35, `rgba(58,208,255,${0.35 * pulse * ease})`); gr.addColorStop(1, 'rgba(58,208,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, rr, 0, 7); g.fill();
    });
    // lightning between the crystals
    if (since > 1000 && t > nextBolt && !reduce) { const [a, b] = Math.random() < 0.5 ? [TOPC, CORE] : [CORE, BOTC]; const p0 = P(a), p1 = P(b); bolts.push({ pts: bolt(p0[0], p0[1], p1[0], p1[1], w * 0.06), until: t + 160 }); if (Math.random() < 0.5) bolts.push({ pts: bolt(p0[0], p0[1], p1[0], p1[1], w * 0.05), until: t + 110 }); nextBolt = t + 1400 + Math.random() * 2600; }
    bolts = bolts.filter((bb) => bb.until > t);
    bolts.forEach((bb) => { [[6, 'rgba(58,208,255,.35)'], [2.2, 'rgba(220,250,255,.95)']].forEach(([lw2, col]) => { g.strokeStyle = col; g.lineWidth = lw2 * (W / c.clientWidth || 1); g.lineJoin = 'round'; g.beginPath(); bb.pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); }); });
    // impact: flash + shock ring + sparks when the logo lands
    if (!reduce && since > 650 && since < 1500) {
      const k2 = (since - 650) / 850, [px, py] = P(CORE);
      g.strokeStyle = `rgba(255,220,160,${0.8 * (1 - k2)})`; g.lineWidth = 6 * (1 - k2) * (W / c.clientWidth || 1); g.beginPath(); g.ellipse(px, py, w * 0.7 * k2, h * 0.5 * k2, 0, 0, 7); g.stroke();
      if (since < 760) { g.fillStyle = `rgba(255,240,210,${0.5 * (1 - (since - 650) / 110)})`; g.fillRect(0, 0, W, H); }
    }
    if (!reduce && since > 650 && !SP.burst) { SP.burst = true; const [px, py] = P(CORE); for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 7) * (W / c.clientWidth || 1); sparks.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1 }); } }
    sparks.forEach((s) => { s.x += s.vx; s.y += s.vy; s.vy += 0.18; s.life -= 0.02; g.fillStyle = `rgba(255,${180 + Math.random() * 60},90,${Math.max(0, s.life)})`; g.fillRect(s.x, s.y, 3, 3); });
    sparks = sparks.filter((s) => s.life > 0);
    g.restore();
  }

  // ---------- flow ----------
  function fit(c) { const r = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); const w = Math.round(r.width * d), h = Math.round(r.height * d); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } }
  function loop(t) {
    const el = $('#splash'); if (!el || el.hidden) { SP.raf = 0; return; }
    const bg = $('#splash-bg'), lg = $('#splash-logo');
    fit(bg); fit(lg);
    drawBg(bg, t);
    if (SP.stage !== 'studio') { if (!SP.logoAt) SP.logoAt = t; drawLogo(lg, t); }
    SP.raf = requestAnimationFrame(loop);
  }
  function stage(s) {
    SP.stage = s; const el = $('#splash'); el.dataset.stage = s;
    if (s === 'logo') { SP.logoAt = 0; SP.burst = false; setTimeout(() => { if (SP.stage === 'logo') el.classList.add('ready'); }, reduce ? 50 : 1300); }
    if (s === 'menu') { el.classList.add('ready'); const b = el.querySelector('[data-sp="play"]'); b && b.focus({ preventScroll: true }); }
  }
  SP.show = function (skipStudio) {
    const el = $('#splash'); if (!el) return;
    el.hidden = false; $('#title').hidden = true;
    el.classList.remove('ready'); stage(skipStudio ? 'logo' : 'studio');
    if (!skipStudio) { clearTimeout(SP.st); SP.st = setTimeout(() => { if (SP.stage === 'studio') stage('logo'); }, reduce ? 400 : 2600); }
    if (!SP.raf) SP.raf = requestAnimationFrame(loop);
  };
  function advance() {
    if (SP.stage === 'studio') { stage('logo'); return; }
    if (SP.stage === 'logo') { if (AF.Music) AF.Music.sting('start'); stage('menu'); }
  }
  function toSlots() {
    $('#splash').hidden = true; $('#title').hidden = false;
    AF.sfx && AF.sfx('click');
  }
  SP.settings = function (back) {
    const m = $('#menu'); m.hidden = false;
    const A = AF.Audio || {}, pct = (v) => Math.round((v || 0) * 100);
    m.querySelector('.sheet').innerHTML = `
      <header class="ph"><h2>Settings</h2><button class="btn ghost x" data-sp="close-set">Close</button></header>
      <div class="pbody menu settings">
        <label class="slider"><span>Music <b id="mv">${pct(A.music)}%</b></span><input type="range" min="0" max="100" step="5" value="${pct(A.music)}" data-vol="music" aria-label="Music volume"></label>
        <label class="slider"><span>Sound effects <b id="sv">${pct(A.sfxVol)}%</b></span><input type="range" min="0" max="100" step="5" value="${pct(A.sfxVol)}" data-vol="sfx" aria-label="Sound effects volume"></label>
        <button class="btn" data-sp="mute">All sound: ${AF.muted ? 'off' : 'on'}</button>
        ${back ? '' : '<button class="btn" data-sp="controls">Controls</button>'}
        ${back ? '' : '<p class="hint">Every town, region and battle has its own music.</p>'}
      </div>`;
  };
  document.addEventListener('input', (e) => {
    const v = e.target.dataset && e.target.dataset.vol; if (!v || !AF.Audio) return;
    const x = +e.target.value / 100; if (v === 'music') AF.Audio.music = x; else AF.Audio.sfxVol = x;
    const lab = document.getElementById(v === 'music' ? 'mv' : 'sv'); if (lab) lab.textContent = Math.round(x * 100) + '%';
    AF.Audio.saveSettings(); if (v === 'sfx') AF.sfx('click');
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sp]');
    const el = $('#splash');
    if (!b) { if (el && !el.hidden && SP.stage !== 'menu' && e.target.closest('#splash')) advance(); return; }
    const k = b.dataset.sp;
    if (k === 'play') toSlots();
    else if (k === 'help') AF.UI.help();
    else if (k === 'settings') SP.settings();
    else if (k === 'credits') $('#sp-credits').hidden = !$('#sp-credits').hidden;
    else if (k === 'close-set') $('#menu').hidden = true;
    else if (k === 'controls') AF.Controls.render(true);
    else if (k === 'mute') { AF.muted = !AF.muted; try { localStorage.setItem('arcforge.muted', AF.muted ? '1' : '0'); } catch (er) {} AF.Audio && AF.Audio.levels(); b.textContent = `All sound: ${AF.muted ? 'off' : 'on'}`; }
    else if (k === 'to-splash') { $('#title').hidden = true; SP.show(true); stage('menu'); }
  });
  // keys: any key moves the intro along; arrows and Enter work the menu
  window.addEventListener('keydown', (e) => {
    const el = $('#splash'); if (!el || el.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#menu').hidden || !$('#panel').hidden) { if (e.key === 'Escape') { $('#menu').hidden = true; } return; }
    if (SP.stage !== 'menu') { e.preventDefault(); e.stopPropagation(); advance(); return; }
    const btns = [...el.querySelectorAll('.sp-menu button')], i = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); AF.sfx('click'); }
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); AF.sfx('click'); }
    e.stopPropagation();
  }, true);

  SP.boot = function () { makeBot(); if (/skip/.test(location.hash)) { $('#title').hidden = false; return; } SP.show(false); };
})();
