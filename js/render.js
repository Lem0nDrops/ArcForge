/* ArcForge — modern HD renderer.
   Draws the world at full screen resolution: smooth-shaded terrain with organic edges,
   soft shadows, animated water, glowing lights, particles and interaction prompts.
   Terrain is cached in 8×8-tile chunks; characters animate every frame. */
(function () {
  const AF = (window.AF = window.AF || {});
  const R = (AF.Render = { stepDur: 190 });
  const CHK = 8;
  const mixHex = (a, b, t) => {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), m = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t);
    return `rgb(${m(16)},${m(8)},${m(0)})`;
  };
  const sh = (c, a) => AF.shadeHex(c, a);
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2246822519) ^ 0x5bf03635; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rng = (x, y) => AF.rng((x * 73856093) ^ (y * 19349663) ^ 0x2f1);

  // Terrain look. p = layering priority (higher terrain overlaps lower with rounded edges).
  const TERR = {
    water:    { p: 0, a: '#4a9be0', b: '#3a86d0' },
    sand:     { p: 1, a: '#f0dcaa', b: '#e3c995' },
    grass:    { p: 2, a: '#86c95e', b: '#6fb44f' },
    lawn:     { p: 2.1, a: '#8fd26a', b: '#7ac25a' },
    forest:   { p: 3, a: '#55a24a', b: '#468f3f' },
    path:     { p: 4, a: '#ead8aa', b: '#dcc593' },
    rubble:   { p: 5, a: '#b2a38c', b: '#9c8d77' },
    mountain: { p: 6, a: '#c39d6c', b: '#ab875a' },
  };
  let noise = null;
  function smoothNoise(x, y) {
    if (!noise) { const r = AF.rng(AF.WORLD_SEED + 7); noise = Array.from({ length: 30 * 30 }, () => r()); }
    const s = 5, fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const v = (i, j) => noise[((iy + j) % 30) * 30 + ((ix + i) % 30)];
    const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx, b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
    return a + (b - a) * ty;
  }

  // ---------- Sizing ----------
  let S = 64, rs = 1, cache = {}, chunkOrder = [];
  function resize(canvas) {
    const cw = canvas.clientWidth, chh = canvas.clientHeight;
    const T = Math.max(40, Math.min(76, Math.round(Math.min(cw / 15, chh / 10))));
    rs = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(cw * rs), h = Math.round(chh * rs);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const nS = Math.round(T * rs);
    if (nS !== S) { S = nS; cache = {}; chunkOrder = []; imgs = {}; }
  }

  // ---------- Terrain chunks ----------
  function terrainChunk(cx, cy) {
    const k = cx + ',' + cy;
    if (cache[k]) return cache[k];
    const mp = AF.World.map(), W = mp.w, H = mp.h;
    const cv = document.createElement('canvas'); cv.width = CHK * S; cv.height = CHK * S;
    const g = cv.getContext('2d');
    const x0 = cx * CHK, y0 = cy * CHK;
    g.translate(-x0 * S, -y0 * S);
    const t = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'water' : AF.World.terrainAt(null, x, y);
    const pr = (x, y) => TERR[t(x, y)].p;
    const col = (x, y) => { const d = TERR[t(x, y)]; return mixHex(d.a, d.b, smoothNoise(x, y) * 0.9); };
    const xs = [x0 - 1, x0 + CHK], ys = [y0 - 1, y0 + CHK];
    const each = (fn) => { for (let y = ys[0]; y <= ys[1]; y++) for (let x = xs[0]; x <= xs[1]; x++) fn(x, y); };
    // 1) base colour per tile
    each((x, y) => { g.fillStyle = col(x, y); g.fillRect(x * S, y * S, S + 1, S + 1); });
    // 2) higher terrain spills over lower neighbours with rounded edges (+ shoreline foam)
    const E = S * 0.22, RAD = S * 0.32;
    const shape = (x, y, n, s, w, e, grow) => {
      const eN = n ? E + grow : 0, eS = s ? E + grow : 0, eW = w ? E + grow : 0, eE = e ? E + grow : 0;
      g.beginPath();
      g.roundRect(x * S - eW, y * S - eN, S + eW + eE, S + eN + eS, [n && w ? RAD : 0, n && e ? RAD : 0, s && e ? RAD : 0, s && w ? RAD : 0]);
    };
    const levels = [...new Set(Object.values(TERR).map((d) => d.p))].sort((a, b) => a - b).slice(1);
    for (const lv of levels) {
      each((x, y) => {
        const me = pr(x, y); if (me !== lv) return;
        const n = pr(x, y - 1) < me, s = pr(x, y + 1) < me, w = pr(x - 1, y) < me, e = pr(x + 1, y) < me;
        if (!(n || s || w || e)) return;
        const wet = t(x, y - 1) === 'water' || t(x, y + 1) === 'water' || t(x - 1, y) === 'water' || t(x + 1, y) === 'water';
        if (wet && me < 6) { shape(x, y, n, s, w, e, S * 0.08); g.fillStyle = 'rgba(232,246,255,.9)'; g.fill(); }
        shape(x, y, n, s, w, e, 0); g.fillStyle = col(x, y); g.fill();
      });
    }
    // 3) surface details
    each((x, y) => {
      const c = t(x, y), r = rng(x, y), X = x * S, Y = y * S, d = TERR[c];
      if (c === 'grass' || c === 'lawn') {
        for (let i = 0; i < 3; i++) {
          const bx = X + S * (0.15 + r() * 0.7), by = Y + S * (0.3 + r() * 0.6);
          g.strokeStyle = sh(d.b, -22); g.lineWidth = Math.max(1, S * 0.025); g.lineCap = 'round';
          for (let j = -1; j <= 1; j++) { g.beginPath(); g.moveTo(bx + j * S * 0.04, by); g.quadraticCurveTo(bx + j * S * 0.06, by - S * 0.08, bx + j * S * 0.09, by - S * 0.12); g.stroke(); }
        }
        if (mp.deco[y * W + x] === 'flowers' || (c === 'grass' && r() < 0.05)) {
          for (let i = 0; i < 4; i++) {
            const fx = X + S * (0.15 + r() * 0.7), fy = Y + S * (0.15 + r() * 0.7), fc = ['#ff7a8a', '#ffd84a', '#ffffff', '#b98cff'][Math.floor(r() * 4)];
            g.fillStyle = fc; for (let p = 0; p < 5; p++) { const a = p * 1.2566; g.beginPath(); g.arc(fx + Math.cos(a) * S * 0.035, fy + Math.sin(a) * S * 0.035, S * 0.03, 0, 7); g.fill(); }
            g.fillStyle = '#f6b030'; g.beginPath(); g.arc(fx, fy, S * 0.022, 0, 7); g.fill();
          }
        }
      } else if (c === 'forest') {
        for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
          const bx = X + S * (0.18 + i * 0.32 + (row % 2) * 0.12), by = Y + S * (0.38 + row * 0.28);
          const gr = g.createLinearGradient(0, by - S * 0.3, 0, by); gr.addColorStop(0, '#9ee07a'); gr.addColorStop(1, '#2e7a34');
          g.fillStyle = gr; g.beginPath(); g.moveTo(bx - S * 0.13, by);
          g.quadraticCurveTo(bx - S * 0.1, by - S * 0.2, bx - S * 0.06, by - S * 0.28); g.quadraticCurveTo(bx - S * 0.03, by - S * 0.12, bx, by - S * 0.32);
          g.quadraticCurveTo(bx + S * 0.03, by - S * 0.12, bx + S * 0.07, by - S * 0.27); g.quadraticCurveTo(bx + S * 0.1, by - S * 0.18, bx + S * 0.13, by); g.closePath(); g.fill();
        }
      } else if (c === 'sand') {
        g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = Math.max(1, S * 0.02);
        g.beginPath(); const yy = Y + S * (0.3 + r() * 0.4); g.moveTo(X + S * 0.15, yy); g.quadraticCurveTo(X + S * 0.35, yy - S * 0.06, X + S * 0.55, yy); g.stroke();
        g.fillStyle = sh(d.b, -25); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(X + S * r(), Y + S * r(), S * 0.018, 0, 7); g.fill(); }
      } else if (c === 'path') {
        for (let i = 0; i < 3; i++) {
          const px = X + S * (0.1 + r() * 0.6), py = Y + S * (0.1 + r() * 0.6), pw = S * (0.18 + r() * 0.12);
          g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(150,110,60,.12)'; g.beginPath(); g.roundRect(px, py, pw, pw * 0.7, S * 0.06); g.fill();
        }
      } else if (c === 'rubble') {
        for (let i = 0; i < 3; i++) {
          const rx = X + S * (0.2 + r() * 0.6), ry = Y + S * (0.25 + r() * 0.55), rw = S * (0.09 + r() * 0.08);
          g.fillStyle = 'rgba(40,30,20,.25)'; g.beginPath(); g.ellipse(rx + rw * 0.2, ry + rw * 0.5, rw, rw * 0.45, 0, 0, 7); g.fill();
          const gr = g.createLinearGradient(0, ry - rw, 0, ry + rw); gr.addColorStop(0, '#c9bba6'); gr.addColorStop(1, '#7e705f');
          g.fillStyle = gr; g.beginPath(); g.ellipse(rx, ry, rw, rw * 0.75, 0, 0, 7); g.fill();
        }
      } else if (c === 'mountain') {
        g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = Math.max(1, S * 0.02);
        g.beginPath(); g.moveTo(X + S * r(), Y + S * 0.3); g.lineTo(X + S * r(), Y + S * 0.55); g.stroke();
        if (r() > 0.6) { g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(X + S * 0.5, Y + S * 0.4, S * 0.18, S * 0.08, 0, 0, 7); g.fill(); }
      } else if (c === 'water') {
        const deep = t(x, y - 1) === 'water' && t(x, y + 1) === 'water' && t(x - 1, y) === 'water' && t(x + 1, y) === 'water';
        if (deep) { g.fillStyle = 'rgba(20,60,140,.12)'; g.fillRect(X, Y, S + 1, S + 1); }
      }
    });
    // 4) cliffs: mountains get a shaded face where they drop to lower ground
    each((x, y) => {
      if (t(x, y) !== 'mountain' || t(x, y + 1) === 'mountain') return;
      const X = x * S, Y = (y + 1) * S - S * 0.08, hgt = S * 0.5;
      const gr = g.createLinearGradient(0, Y, 0, Y + hgt); gr.addColorStop(0, '#9a7448'); gr.addColorStop(1, '#6c4f30');
      g.fillStyle = gr; g.beginPath(); g.roundRect(X - (t(x - 1, y) === 'mountain' ? 0 : S * 0.06), Y, S + (t(x - 1, y) === 'mountain' ? 0 : S * 0.06) + (t(x + 1, y) === 'mountain' ? 1 : S * 0.06), hgt, [0, 0, S * 0.12, S * 0.12]); g.fill();
      g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = Math.max(1, S * 0.02);
      for (let i = 0.2; i < 1; i += 0.3) { g.beginPath(); g.moveTo(X + S * i, Y + S * 0.08); g.lineTo(X + S * i - S * 0.04, Y + hgt - S * 0.06); g.stroke(); }
      g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(X, Y - S * 0.02, S, Math.max(1, S * 0.035));
    });
    cache[k] = cv; chunkOrder.push(k);
    if (chunkOrder.length > 60) delete cache[chunkOrder.shift()];
    return cv;
  }

  // ---------- Prop images (cached at the current size) ----------
  let imgs = {};
  function img(key, w, h, paint) {
    if (imgs[key]) return imgs[key];
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    paint(cv.getContext('2d'), cv.width, cv.height);
    return (imgs[key] = cv);
  }
  const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  const rad = (g, x, y, r, c0, c1) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };

  const treeImg = (v) => img('tree' + v, S * 1.5, S * 2.1, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.12;
    ell(g, cx + S * 0.08, by, S * 0.55, S * 0.17, 'rgba(20,40,20,.28)');
    const tg = g.createLinearGradient(cx - S * 0.1, 0, cx + S * 0.1, 0); tg.addColorStop(0, '#9a6638'); tg.addColorStop(1, '#6a4222');
    g.fillStyle = tg; g.beginPath(); g.roundRect(cx - S * 0.1, by - S * 0.55, S * 0.2, S * 0.55, S * 0.05); g.fill();
    const hue = v ? ['#3f9a46', '#2a7535', '#78c867'] : ['#4aa64c', '#2f7c38', '#86d470'];
    [[0, -1.05, 0.55], [-0.28, -0.82, 0.4], [0.28, -0.8, 0.42], [0, -0.7, 0.45]].forEach(([dx, dy, r]) => {
      g.fillStyle = rad(g, cx + dx * S, by + dy * S, r * S, hue[0], hue[1]); g.beginPath(); g.arc(cx + dx * S, by + dy * S, r * S, 0, 7); g.fill();
    });
    g.fillStyle = 'rgba(255,255,255,.18)'; [[-0.15, -1.25, 0.14], [0.12, -1.18, 0.09], [-0.32, -0.95, 0.08]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(cx + dx * S, by + dy * S, r * S, 0, 7); g.fill(); });
  });
  const lampImg = () => img('lamp', S, S * 1.9, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    ell(g, cx, by, S * 0.2, S * 0.07, 'rgba(0,0,0,.25)');
    g.fillStyle = '#3c4656'; g.beginPath(); g.roundRect(cx - S * 0.045, by - S * 1.35, S * 0.09, S * 1.35, S * 0.03); g.fill();
    g.fillStyle = '#2e3746'; g.beginPath(); g.roundRect(cx - S * 0.14, by - S * 0.1, S * 0.28, S * 0.1, S * 0.04); g.fill();
    g.fillStyle = '#ffe9a0'; g.beginPath(); g.roundRect(cx - S * 0.13, by - S * 1.6, S * 0.26, S * 0.3, S * 0.07); g.fill();
    g.fillStyle = '#2e3746'; g.beginPath(); g.roundRect(cx - S * 0.17, by - S * 1.66, S * 0.34, S * 0.08, S * 0.04); g.fill();
  });
  const signImg = () => img('sign', S, S * 1.1, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    ell(g, cx, by, S * 0.3, S * 0.07, 'rgba(0,0,0,.22)');
    g.fillStyle = '#8a5a30'; g.fillRect(cx - S * 0.25, by - S * 0.45, S * 0.07, S * 0.45); g.fillRect(cx + S * 0.18, by - S * 0.45, S * 0.07, S * 0.45);
    const gr = g.createLinearGradient(0, by - S * 0.9, 0, by - S * 0.4); gr.addColorStop(0, '#e9b878'); gr.addColorStop(1, '#c58a4c');
    g.fillStyle = gr; g.beginPath(); g.roundRect(cx - S * 0.4, by - S * 0.92, S * 0.8, S * 0.48, S * 0.08); g.fill();
    g.fillStyle = 'rgba(90,50,20,.45)'; g.fillRect(cx - S * 0.28, by - S * 0.77, S * 0.56, S * 0.04); g.fillRect(cx - S * 0.28, by - S * 0.65, S * 0.4, S * 0.04);
  });
  const fenceImg = () => img('fence', S, S, (g) => {
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, S * 0.82, S, S * 0.08);
    const wood = (x, y, w, h) => { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#f0c88c'); gr.addColorStop(1, '#c08a50'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, S * 0.03); g.fill(); };
    wood(0, S * 0.38, S, S * 0.1); wood(0, S * 0.6, S, S * 0.1); wood(S * 0.1, S * 0.25, S * 0.12, S * 0.62); wood(S * 0.78, S * 0.25, S * 0.12, S * 0.62);
  });
  function nodeImg(n) {
    return img('node' + n, S, S, (g) => {
      const cx = S / 2, by = S * 0.82;
      ell(g, cx, by, S * 0.36, S * 0.1, 'rgba(0,0,0,.25)');
      if (n === 'scrap') {
        g.fillStyle = rad(g, cx, by - S * 0.18, S * 0.35, '#c6cdd4', '#6c757e'); g.beginPath(); g.roundRect(cx - S * 0.32, by - S * 0.3, S * 0.64, S * 0.3, S * 0.1); g.fill();
        g.fillStyle = '#9aa3ad'; g.beginPath(); g.roundRect(cx - S * 0.12, by - S * 0.5, S * 0.3, S * 0.24, S * 0.04); g.fill();
        g.save(); g.translate(cx - S * 0.15, by - S * 0.32); g.fillStyle = '#e0894a';
        for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-S * 0.025, -S * 0.15, S * 0.05, S * 0.06); }
        g.beginPath(); g.arc(0, 0, S * 0.11, 0, 7); g.fill(); g.fillStyle = '#5a6068'; g.beginPath(); g.arc(0, 0, S * 0.045, 0, 7); g.fill(); g.restore();
      } else if (n === 'copper') {
        g.fillStyle = rad(g, cx, by - S * 0.25, S * 0.4, '#a89882', '#5e5040'); g.beginPath(); g.moveTo(cx - S * 0.35, by); g.quadraticCurveTo(cx - S * 0.35, by - S * 0.45, cx, by - S * 0.5); g.quadraticCurveTo(cx + S * 0.38, by - S * 0.42, cx + S * 0.36, by); g.closePath(); g.fill();
        [[-0.12, -0.28, 0.08], [0.1, -0.2, 0.07], [0.02, -0.38, 0.05]].forEach(([dx, dy, r]) => { g.fillStyle = rad(g, cx + dx * S, by + dy * S, r * S, '#ffc28a', '#c8682c'); g.beginPath(); g.arc(cx + dx * S, by + dy * S, r * S, 0, 7); g.fill(); });
      } else {
        const [c0, c1] = n === 'silicon' ? ['#e6f8ff', '#6ab8e0'] : ['#f2dcff', '#8e48d8'];
        [[-0.17, 0.55, -0.25], [0.15, 0.5, 0.25], [0, 0.72, 0]].forEach(([dx, hgt, rot]) => {
          g.save(); g.translate(cx + dx * S, by - S * 0.04); g.rotate(rot);
          const gr = g.createLinearGradient(-S * 0.1, 0, S * 0.1, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
          g.fillStyle = gr; g.beginPath(); g.moveTo(-S * 0.09, 0); g.lineTo(-S * 0.09, -hgt * S * 0.75); g.lineTo(0, -hgt * S); g.lineTo(S * 0.09, -hgt * S * 0.75); g.lineTo(S * 0.09, 0); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-S * 0.05, -hgt * S * 0.7, S * 0.025, hgt * S * 0.5); g.restore();
        });
      }
    });
  }
  const ruinImg = () => img('ruin', S * 1.2, S * 1.4, (g, w, h) => {
    const by = h - S * 0.15;
    ell(g, w / 2, by, S * 0.5, S * 0.12, 'rgba(0,0,0,.22)');
    const stone = (x, y, ww, hh) => { const gr = g.createLinearGradient(x, 0, x + ww, 0); gr.addColorStop(0, '#d8d2c4'); gr.addColorStop(1, '#9a9282'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, ww, hh, S * 0.04); g.fill(); };
    stone(w * 0.16, by - S * 0.95, S * 0.24, S * 0.95); stone(w * 0.62, by - S * 0.6, S * 0.24, S * 0.6); stone(w * 0.1, by - S * 1.08, S * 0.62, S * 0.18);
    g.fillStyle = '#6fae55'; g.beginPath(); g.ellipse(w * 0.3, by - S * 1.07, S * 0.14, S * 0.05, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.7, by - S * 0.6, S * 0.1, S * 0.04, 0, 0, 7); g.fill();
  });
  const fountainImg = () => img('fountain', S * 2, S * 2.4, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.25;
    ell(g, cx, by + S * 0.05, S * 0.98, S * 0.42, 'rgba(0,0,0,.2)');
    ell(g, cx, by - S * 0.08, S * 0.95, S * 0.48, '#9aa4b0'); ell(g, cx, by - S * 0.14, S * 0.92, S * 0.44, '#d8dee6');
    const wg = g.createRadialGradient(cx, by - S * 0.18, S * 0.1, cx, by - S * 0.14, S * 0.8); wg.addColorStop(0, '#9fdcff'); wg.addColorStop(1, '#3d8fd8');
    ell(g, cx, by - S * 0.14, S * 0.78, S * 0.34, wg);
    const pg = g.createLinearGradient(cx - S * 0.12, 0, cx + S * 0.12, 0); pg.addColorStop(0, '#eef2f6'); pg.addColorStop(1, '#a8b2be');
    g.fillStyle = pg; g.beginPath(); g.roundRect(cx - S * 0.12, by - S * 1.25, S * 0.24, S * 1.1, S * 0.06); g.fill();
    ell(g, cx, by - S * 1.25, S * 0.3, S * 0.1, '#c8d0da');
  });

  function buildingImg(b) {
    const def = AF.BUILDINGS[b.id], W = b.w * S, H = b.h * S, top = S * 0.75;
    return img('bld' + b.id, W + S * 0.3, H + top + S * 0.1, (g) => {
      g.translate(S * 0.15, 0);
      const wallTop = top + H * 0.42, base = top + H, roof = def.roof;
      // walls
      const wg = g.createLinearGradient(0, wallTop, 0, base); wg.addColorStop(0, '#fbf4e4'); wg.addColorStop(1, '#e6d8bc');
      g.fillStyle = wg; g.beginPath(); g.roundRect(S * 0.06, wallTop, W - S * 0.12, base - wallTop, [0, 0, S * 0.08, S * 0.08]); g.fill();
      g.fillStyle = '#b89c78'; g.fillRect(S * 0.06, base - S * 0.14, W - S * 0.12, S * 0.14);
      const beam = (x) => { const bg = g.createLinearGradient(x, 0, x + S * 0.12, 0); bg.addColorStop(0, '#9a6a42'); bg.addColorStop(1, '#6e4628'); g.fillStyle = bg; g.fillRect(x, wallTop, S * 0.12, base - wallTop); };
      beam(S * 0.06); beam(W - S * 0.18);
      // door
      const shop = AF.SHOPS.includes(b.id) && b.id !== 'home';
      const dx = (Math.floor(b.w / 2) + 0.5) * S, dw = S * 0.56, dh = S * 0.78;
      g.fillStyle = '#6e4628'; g.beginPath(); g.roundRect(dx - dw / 2 - S * 0.05, base - dh - S * 0.05, dw + S * 0.1, dh + S * 0.05, [S * 0.3, S * 0.3, 0, 0]); g.fill();
      if (shop) { const dg = g.createLinearGradient(0, base - dh, 0, base); dg.addColorStop(0, '#d8f2ff'); dg.addColorStop(1, '#78b8dc'); g.fillStyle = dg; }
      else { const dg = g.createLinearGradient(dx - dw / 2, 0, dx + dw / 2, 0); dg.addColorStop(0, '#b07040'); dg.addColorStop(1, '#8a5430'); g.fillStyle = dg; }
      g.beginPath(); g.roundRect(dx - dw / 2, base - dh, dw, dh, [S * 0.26, S * 0.26, 0, 0]); g.fill();
      if (shop) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(dx - dw / 2 + S * 0.07, base - dh + S * 0.15, S * 0.06, dh * 0.5); g.fillStyle = '#5a88a8'; g.fillRect(dx - 1, base - dh + S * 0.05, 2, dh); }
      else { g.fillStyle = '#ffd860'; g.beginPath(); g.arc(dx + dw * 0.3, base - dh * 0.45, S * 0.035, 0, 7); g.fill(); }
      // windows with warm light
      const wy = wallTop + (base - wallTop) * 0.2, wh = (base - wallTop) * 0.36, ww = S * 0.5;
      for (let x = S * 0.35; x + ww < W - S * 0.3; x += S * 0.95) {
        if (x + ww > dx - dw / 2 - S * 0.15 && x < dx + dw / 2 + S * 0.15) continue;
        g.fillStyle = '#6e4628'; g.beginPath(); g.roundRect(x - S * 0.05, wy - S * 0.05, ww + S * 0.1, wh + S * 0.1, S * 0.06); g.fill();
        const lg = g.createLinearGradient(0, wy, 0, wy + wh); lg.addColorStop(0, '#fff6c8'); lg.addColorStop(1, '#ffc860'); g.fillStyle = lg;
        g.beginPath(); g.roundRect(x, wy, ww, wh, S * 0.04); g.fill();
        g.fillStyle = 'rgba(110,70,40,.8)'; g.fillRect(x + ww / 2 - 1, wy, 2, wh); g.fillRect(x, wy + wh / 2 - 1, ww, 2);
        g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + S * 0.05, wy + S * 0.04, S * 0.08, wh * 0.3);
        g.fillStyle = '#5e9a48'; g.beginPath(); g.roundRect(x - S * 0.06, wy + wh + S * 0.05, ww + S * 0.12, S * 0.1, S * 0.04); g.fill();
        ['#ff7a8a', '#ffd84a', '#ff7a8a'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + ww * (0.2 + i * 0.3), wy + wh + S * 0.05, S * 0.045, 0, 7); g.fill(); });
      }
      // roof
      const rg = g.createLinearGradient(0, 0, 0, wallTop + S * 0.2); rg.addColorStop(0, sh(roof, 35)); rg.addColorStop(1, sh(roof, -30));
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.roundRect(S * 0.06, wallTop, W - S * 0.12, S * 0.22, 0); g.fill();
      g.fillStyle = rg; g.beginPath();
      g.moveTo(-S * 0.1, wallTop + S * 0.14); g.lineTo(S * 0.22, S * 0.1); g.quadraticCurveTo(W / 2, -S * 0.02, W - S * 0.22, S * 0.1); g.lineTo(W + S * 0.1, wallTop + S * 0.14); g.closePath(); g.fill();
      g.save(); g.clip();
      g.strokeStyle = sh(roof, -45); g.lineWidth = Math.max(1, S * 0.03);
      for (let y = S * 0.3, row = 0; y < wallTop + S * 0.1; y += S * 0.24, row++) {
        g.beginPath(); for (let x = -S * 0.3 + (row % 2) * S * 0.15; x < W + S * 0.3; x += S * 0.3) g.arc(x + S * 0.15, y, S * 0.15, 0.1, Math.PI - 0.1); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, S * 0.06, W, S * 0.08);
      g.restore();
      g.fillStyle = sh(roof, -50); g.fillRect(-S * 0.1, wallTop + S * 0.1, W + S * 0.2, S * 0.07);
      if (b.id === 'forge') { g.fillStyle = '#6a6e78'; g.beginPath(); g.roundRect(W - S * 0.9, -S * 0.25, S * 0.3, S * 0.6, S * 0.04); g.fill(); g.fillStyle = '#ff9a40'; g.fillRect(W - S * 0.86, -S * 0.25, S * 0.22, S * 0.06); }
      if (b.id === 'hall') { g.fillStyle = '#8a6a48'; g.fillRect(W / 2 - 1, -S * 0.55, 3, S * 0.6); g.fillStyle = '#e8584a'; g.beginPath(); g.moveTo(W / 2 + 2, -S * 0.55); g.lineTo(W / 2 + S * 0.4, -S * 0.42); g.lineTo(W / 2 + 2, -S * 0.3); g.fill(); }
      // sign plate
      if (def.sign) {
        g.font = `700 ${Math.round(S * 0.24)}px Fredoka, Nunito, system-ui, sans-serif`;
        const tw = g.measureText(def.sign).width + S * 0.36, sy = wallTop - S * 0.05;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.roundRect(dx - tw / 2 + S * 0.03, sy + S * 0.04, tw, S * 0.38, S * 0.12); g.fill();
        const sg = g.createLinearGradient(0, sy, 0, sy + S * 0.38); sg.addColorStop(0, sh(roof, 25)); sg.addColorStop(1, sh(roof, -20));
        g.fillStyle = sg; g.beginPath(); g.roundRect(dx - tw / 2, sy, tw, S * 0.38, S * 0.12); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(def.sign, dx, sy + S * 0.2);
      }
    });
  }

  // SVG art (enemies, robot) rasterised once per size.
  const svgs = {};
  R.svgImage = function (key, svg, px) {
    const k = key + '@' + px;
    if (svgs[k]) return svgs[k].ready ? svgs[k].img : null;
    const im = new Image(), rec = { img: im, ready: false };
    svgs[k] = rec;
    im.onload = () => { rec.ready = true; if (rec.cb) rec.cb(im); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" `));
    return null;
  };
  R.whenImage = function (key, svg, px, cb) {
    const ready = R.svgImage(key, svg, px);
    if (ready) cb(ready); else svgs[key + '@' + px].cb = cb;
  };

  // ---------- Smooth movement tweens ----------
  const tw = {};
  function tween(id, x, y, now, dur) {
    let e = tw[id];
    if (!e) e = tw[id] = { fx: x, fy: y, tx: x, ty: y, t0: now, dur };
    if (e.tx !== x || e.ty !== y) {
      const cur = pos(e, now);
      if (Math.abs(cur.x - x) + Math.abs(cur.y - y) > 2.5) { e.fx = x; e.fy = y; } else { e.fx = cur.x; e.fy = cur.y; }
      e.tx = x; e.ty = y; e.t0 = now; e.dur = dur;
    }
    return pos(e, now);
  }
  function pos(e, now) { const k = Math.min(1, (now - e.t0) / e.dur); return { x: e.fx + (e.tx - e.fx) * k, y: e.fy + (e.ty - e.fy) * k, moving: k < 1 }; }
  R.snap = function () { for (const k in tw) delete tw[k]; cam = null; };

  // ---------- Particles ----------
  const parts = [];
  R.burst = function (x, y, kind, n) {
    const cols = { dust: ['#e8dcc0', '#d6c8a8'], leaf: ['#7cc85a', '#a4e07a'], sparkle: ['#fff6a0', '#ffffff', '#ffd84a'], scrap: ['#c6cdd4', '#e0894a'], copper: ['#ffb070', '#e0894a'], silicon: ['#d8f4ff', '#9fd8f0'], arcite: ['#e2a6ff', '#c27bff'], circuits: ['#7ee08a'] };
    const c = cols[kind] || cols.sparkle;
    for (let i = 0; i < (n || 8); i++) {
      const a = Math.random() * Math.PI * 2, sp = kind === 'dust' ? 0.6 : 1.6;
      parts.push({ x, y, vx: Math.cos(a) * sp * Math.random(), vy: (kind === 'dust' ? -0.3 : -1.8) * Math.random() - 0.3, life: 1, c: c[i % c.length], kind, r: kind === 'dust' ? 0.06 : 0.045 });
    }
  };

  // ---------- Main draw ----------
  let cam = null, last = 0, phase = 0, blinkAt = 0;
  R.draw = function (canvas, state, now) {
    resize(canvas);
    const g = canvas.getContext('2d'), mp = AF.World.map(), w = state.world, Wd = canvas.width, Hd = canvas.height;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    const P = tween('pilot', w.px, w.py, now, R.stepDur);
    const Rb = tween('robot', w.rx, w.ry, now, R.stepDur);
    if (P.moving) phase += dt * Math.PI * (1000 / R.stepDur);
    // camera eases toward the pilot
    const tx = P.x + 0.5, ty = P.y + 0.5;
    if (!cam) cam = { x: tx, y: ty };
    const kk = 1 - Math.pow(0.0005, dt); cam.x += (tx - cam.x) * kk; cam.y += (ty - cam.y) * kk;
    const ox = Wd / 2 - cam.x * S, oy = Hd / 2 - cam.y * S;
    const sx = (x) => x * S + ox, sy = (y) => y * S + oy;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = TERR.water.b; g.fillRect(0, 0, Wd, Hd);
    // terrain chunks
    const cx0 = Math.floor((-ox) / (CHK * S)), cy0 = Math.floor((-oy) / (CHK * S));
    const cx1 = Math.floor((Wd - ox) / (CHK * S)), cy1 = Math.floor((Hd - oy) / (CHK * S));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHK >= mp.w || cy * CHK >= mp.h) continue;
      g.drawImage(terrainChunk(cx, cy), Math.round(cx * CHK * S + ox), Math.round(cy * CHK * S + oy));
    }
    const tx0 = Math.floor(-ox / S) - 2, ty0 = Math.floor(-oy / S) - 2, tx1 = Math.ceil((Wd - ox) / S) + 2, ty1 = Math.ceil((Hd - oy) / S) + 3;
    const inView = (x, y) => x >= tx0 && x <= tx1 && y >= ty0 && y <= ty1;
    // animated water shimmer
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, S * 0.03); g.lineCap = 'round';
    for (let y = Math.max(0, ty0); y <= Math.min(mp.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(mp.w - 1, tx1); x++) {
      if (mp.t[y * mp.w + x] !== 'w') continue;
      const h = hash(x, y), ph = now / 900 + h * 6.28, a = (Math.sin(ph) + 1) / 2;
      if (a < 0.3) continue;
      g.globalAlpha = (a - 0.3) * 0.9;
      const X = sx(x) + S * (0.2 + h * 0.4), Y = sy(y) + S * (0.3 + hash(y, x) * 0.4);
      g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + S * 0.12, Y - S * 0.06, X + S * 0.24, Y); g.stroke();
    }
    g.globalAlpha = 1;

    // ----- sprites (sorted by their ground line) -----
    const sprites = [], lights = [];
    const at = (im, x, y, ax, ay) => g.drawImage(im, Math.round(sx(x) - ax), Math.round(sy(y) - ay));
    for (let y = Math.max(0, ty0); y <= Math.min(mp.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(mp.w - 1, tx1); x++) {
      const d = mp.deco[y * mp.w + x];
      if (d === 'tree') { const im = treeImg(hash(x, y) > 0.5 ? 1 : 0); sprites.push([y + 0.9, () => at(im, x + 0.5, y + 1, im.width / 2, im.height - S * 0.12)]); }
      else if (d === 'lamp') { const im = lampImg(); sprites.push([y + 0.9, () => at(im, x + 0.5, y + 1, im.width / 2, im.height - S * 0.1)]); lights.push([x + 0.5, y - 0.6, 1.1, '255,220,140', 0.16]); }
      else if (d === 'sign') { const im = signImg(); sprites.push([y + 0.9, () => at(im, x + 0.5, y + 1, im.width / 2, im.height - S * 0.1)]); }
      else if (d === 'fence') { const im = fenceImg(); sprites.push([y + 0.8, () => at(im, x, y, 0, 0)]); }
      else if (d === 'fountain') {
        const im = fountainImg();
        sprites.push([y + 1.9, () => {
          at(im, x + 1, y + 2, im.width / 2, im.height - S * 0.25);
          const ox2 = sx(x + 1), oy2 = sy(y + 2) - S * 1.5 + Math.sin(now / 300) * S * 0.04;
          const gl = g.createRadialGradient(ox2, oy2, 0, ox2, oy2, S * 0.24); gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.4, '#9ffcf0'); gl.addColorStop(1, 'rgba(94,242,225,0)');
          g.fillStyle = gl; g.beginPath(); g.arc(ox2, oy2, S * 0.24, 0, 7); g.fill();
          for (let i = 0; i < 6; i++) { const a = (now / 700 + i / 6) % 1, ang = i * 1.05; g.fillStyle = `rgba(200,240,255,${1 - a})`; g.beginPath(); g.arc(ox2 + Math.cos(ang) * a * S * 0.6, oy2 + S * 0.3 + a * a * S * 0.9 - a * S * 0.5, S * 0.035, 0, 7); g.fill(); }
        }]);
        lights.push([x + 1, y + 0.6, 1.6, '120,240,230', 0.16]);
      }
    }
    for (const b of mp.buildings) {
      if (b.x + b.w < tx0 || b.x > tx1 || b.y + b.h < ty0 || b.y - 2 > ty1) continue;
      const im = buildingImg(b);
      sprites.push([b.y + b.h - 0.05, () => {
        g.fillStyle = 'rgba(20,30,20,.18)'; g.beginPath(); g.roundRect(sx(b.x) + S * 0.2, sy(b.y + b.h) - S * 0.25, b.w * S, S * 0.4, S * 0.2); g.fill();
        g.drawImage(im, Math.round(sx(b.x) - S * 0.15), Math.round(sy(b.y) - S * 0.75));
      }]);
      if (b.id === 'forge' && Math.random() < 0.06) R.burst(b.x + b.w - 0.6, b.y - 0.6, 'dust', 1);
    }
    for (const [k, n] of Object.entries(mp.nodes)) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y)) continue;
      const ready = (w.ready[k] || 0) <= state.steps, im = nodeImg(n);
      sprites.push([y + 0.8, () => { g.globalAlpha = ready ? 1 : 0.35; at(im, x + 0.5, y + 1, im.width / 2, im.height); g.globalAlpha = 1; }]);
      if (ready && n === 'arcite') lights.push([x + 0.5, y + 0.4, 1.1, '200,140,255', 0.18 + Math.sin(now / 400 + x) * 0.06]);
      if (ready && n === 'silicon') lights.push([x + 0.5, y + 0.5, 0.8, '180,230,255', 0.1]);
    }
    for (const k of mp.ruins) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y)) continue;
      const im = ruinImg(), open = !!w.opened[k];
      sprites.push([y + 0.85, () => {
        at(im, x + 0.5, y + 1, im.width / 2, im.height - S * 0.15);
        if (!open) { const gx = sx(x + 0.5), gy = sy(y + 0.45), p = 0.6 + Math.sin(now / 350) * 0.4; g.fillStyle = `rgba(94,242,225,${p})`; g.beginPath(); g.arc(gx, gy, S * 0.07, 0, 7); g.fill(); }
      }]);
      if (!open) lights.push([x + 0.5, y + 0.45, 0.9, '94,242,225', 0.18]);
    }
    // enemies
    for (const e of w.enemies) {
      const p = tween('e' + e.id, e.x, e.y, now, 260);
      if (!inView(p.x, p.y)) continue;
      const def = AF.ENEMIES[e.type], size = Math.round(S * (e.boss ? 2 : 0.95)), im = R.svgImage('e' + e.type, AF.enemySVG(e.type), size);
      sprites.push([p.y + 0.7, () => {
        const bx = sx(p.x + 0.5), by = sy(p.y + 1) - S * 0.08, hop = Math.abs(Math.sin(now / 260 + e.id)) * S * 0.06;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(bx, by, size * 0.32, size * 0.09, 0, 0, 7); g.fill();
        if (im) g.drawImage(im, Math.round(bx - size / 2), Math.round(by - size * 0.95 - hop));
        const tc = ['#5ed46a', '#ffd34a', '#ff8a3a', '#ff3b5c'][def.tier - 1];
        g.fillStyle = tc; g.beginPath(); const ty2 = by - size * 1.02 - hop; g.moveTo(bx, ty2 - S * 0.1); g.lineTo(bx + S * 0.07, ty2); g.lineTo(bx, ty2 + S * 0.08); g.lineTo(bx - S * 0.07, ty2); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = Math.max(1, S * 0.015); g.stroke();
      }]);
      if (e.boss) lights.push([p.x + 0.5, p.y, 3, '255,80,90', 0.25]);
    }
    // townsfolk
    if (blinkAt < now) blinkAt = now + 2500 + Math.random() * 2500;
    const blink = blinkAt - now < 130;
    for (const n of AF.World.npcList()) {
      const p = tween('n' + n.id, n.x, n.y, now, 320);
      if (!inView(p.x, p.y)) continue;
      sprites.push([p.y + 0.75, () => AF.drawPilotAt(g, sx(p.x + 0.5), sy(p.y + 1) - S * 0.06, S * 1.22, AF.NPCS[n.id].look, n.dir, now / 320, { moving: p.moving, t: now + n.hx * 300, blink: blink && n.hx % 2 === 0 })]);
    }
    // robot
    if (state.flags.robot) {
      const core = AF.coreColor(state.look), size = Math.round(S * 1.0);
      const im = R.svgImage('rob' + JSON.stringify(state.parts) + core, AF.robotSVG(state.parts, { core }), size);
      if (w.rx !== w.px) R.robotFace = w.rx < w.px ? 1 : -1;
      if (Rb.moving && Math.random() < 0.25) R.burst(Rb.x + 0.5, Rb.y + 0.95, 'dust', 1);
      sprites.push([Rb.y + 0.72, () => {
        const bx = sx(Rb.x + 0.5), by = sy(Rb.y + 1) - S * 0.06, hov = Math.sin(now / 300) * S * 0.03 + (Rb.moving ? Math.abs(Math.sin(now / 90)) * S * 0.03 : 0);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(bx, by, S * 0.3, S * 0.08, 0, 0, 7); g.fill();
        if (im) { g.save(); g.translate(bx, by - size * 0.92 - hov); g.scale(R.robotFace || 1, 1); g.drawImage(im, -size / 2, 0); g.restore(); }
      }]);
      lights.push([Rb.x + 0.5, Rb.y + 0.45, 0.8, hexRGB(core), 0.16]);
    }
    // pilot (+ tall grass in front of the legs)
    const inGrass = AF.World.terrainAt(null, w.px, w.py) === 'forest';
    if (P.moving && Math.random() < (inGrass ? 0.5 : 0.18)) R.burst(P.x + 0.5, P.y + 0.95, inGrass ? 'leaf' : 'dust', 1);
    sprites.push([P.y + 0.76, () => {
      AF.drawPilotAt(g, sx(P.x + 0.5), sy(P.y + 1) - S * 0.06, S * 1.25, state.look, w.dir, phase, { moving: P.moving, t: now, blink });
      if (inGrass && !P.moving) {
        const bx = sx(P.x + 0.5), by = sy(P.y + 1);
        for (let i = -2; i <= 2; i++) {
          const gr = g.createLinearGradient(0, by - S * 0.35, 0, by); gr.addColorStop(0, '#9ee07a'); gr.addColorStop(1, '#3a8a3e'); g.fillStyle = gr;
          const x = bx + i * S * 0.12; g.beginPath(); g.moveTo(x - S * 0.07, by); g.quadraticCurveTo(x - S * 0.02, by - S * 0.2, x, by - S * 0.36 + Math.abs(i) * S * 0.04); g.quadraticCurveTo(x + S * 0.02, by - S * 0.2, x + S * 0.07, by); g.fill();
        }
      }
    }]);
    sprites.sort((a, b) => a[0] - b[0]).forEach((s) => s[1]());

    // ----- particles -----
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt * (p.kind === 'dust' ? 1.6 : 1.1); if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'dust' ? 0.2 : 3) * dt;
      g.globalAlpha = Math.min(1, p.life * 1.5); g.fillStyle = p.c;
      g.beginPath(); g.arc(sx(p.x), sy(p.y), S * p.r * (p.kind === 'dust' ? 2 - p.life : 1), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // ----- lights -----
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, c, a] of lights) {
      const X = sx(x), Y = sy(y), gr = g.createRadialGradient(X, Y, 0, X, Y, r * S);
      gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(X - r * S, Y - r * S, r * S * 2, r * S * 2);
    }
    g.globalCompositeOperation = 'source-over';
    // ----- soft vignette -----
    const vg = g.createRadialGradient(Wd / 2, Hd / 2, Math.min(Wd, Hd) * 0.35, Wd / 2, Hd / 2, Math.max(Wd, Hd) * 0.75);
    vg.addColorStop(0, 'rgba(20,30,60,0)'); vg.addColorStop(1, 'rgba(20,30,60,.28)');
    g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
    // ----- interaction prompt -----
    const f = AF.World.facing(state);
    if (f && !P.moving && !AF.Dialog.open) {
      const label = f.label, key = AF.input && AF.input.touch ? 'A' : 'E';
      const X = sx(f.x + 0.5), Y = sy(f.y) - S * (f.tall ? 1.05 : 0.35) + Math.sin(now / 250) * S * 0.04;
      g.font = `600 ${Math.round(S * 0.24)}px Fredoka, Nunito, system-ui, sans-serif`;
      const tw2 = g.measureText(label).width, bw = tw2 + S * 0.62, bh = S * 0.42;
      g.fillStyle = 'rgba(20,28,48,.85)'; g.beginPath(); g.roundRect(X - bw / 2, Y - bh, bw, bh, bh / 2); g.fill();
      g.beginPath(); g.moveTo(X - S * 0.08, Y); g.lineTo(X, Y + S * 0.08); g.lineTo(X + S * 0.08, Y); g.fill();
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(X - bw / 2 + bh / 2, Y - bh / 2, bh * 0.36, 0, 7); g.fill();
      g.fillStyle = '#1a2238'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(key, X - bw / 2 + bh / 2, Y - bh / 2 + 1);
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(label, X - bw / 2 + bh * 0.95, Y - bh / 2 + 1);
    }
  };
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; }

  // Screen point → world tile (for tap-to-interact).
  R.screenToTile = function (canvas, px, py) {
    if (!cam) return null;
    const ox = canvas.width / 2 - cam.x * S, oy = canvas.height / 2 - cam.y * S;
    return { x: Math.floor((px * rs - ox) / S), y: Math.floor((py * rs - oy) / S) };
  };
  R.tileToScreen = function (canvas, x, y) {
    if (!cam) return null;
    return { x: (x * S + canvas.width / 2 - cam.x * S) / rs, y: (y * S + canvas.height / 2 - cam.y * S) / rs };
  };

  // ---------- Fill <canvas data-spr> elements in menus and battles ----------
  AF.Pixel = {
    paint(root, state) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      root.querySelectorAll('canvas[data-spr]').forEach((cv) => {
        const [kind, arg] = cv.dataset.spr.split(':');
        const size = Math.max(96, Math.round((cv.clientWidth || 160) * dpr));
        const put = (im) => { cv.width = size; cv.height = size; const g = cv.getContext('2d'); g.clearRect(0, 0, size, size); g.drawImage(im, 0, 0, size, size); };
        if (kind === 'enemy') R.whenImage('E' + arg, AF.enemySVG(arg), size, put);
        if (kind === 'robot') { const core = AF.coreColor(state.look); R.whenImage('R' + JSON.stringify(state.parts) + core, AF.robotSVG(state.parts, { core }), size, put); }
        if (kind === 'pilot') { cv.width = size; cv.height = Math.round(size / 0.7); const g = cv.getContext('2d'); AF.drawPilotAt(g, size / 2, cv.height * 0.99, cv.height * 0.95, state.look, arg || 'down', 0, {}); }
      });
    },
  };
})();
