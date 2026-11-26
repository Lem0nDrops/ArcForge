/* Automata: ArcForge — world renderer.
   Dark medieval steampunk: weathered moorland, timber-and-stone towns, brass pipes and old magic.
   Terrain is cached in 8×8-tile chunks per area; props and characters are drawn every frame,
   then a darkness layer is cut open by lamps, torches, crystals and your automaton's core. */
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
  const SERIF = 'Cinzel, Georgia, "Times New Roman", serif';

  // Terrain look. p = layering priority (higher terrain overlaps lower with rounded edges).
  const TERR = {
    water:    { p: 0, a: '#2e4c5a', b: '#253f4c' },
    sand:     { p: 1, a: '#8a7a58', b: '#7c6c4c' },
    grass:    { p: 2, a: '#4f6a3a', b: '#465f34' },
    lawn:     { p: 2.1, a: '#56703f', b: '#4c6638' },
    forest:   { p: 3, a: '#36502c', b: '#2d4527' },
    path:     { p: 4, a: '#7a6a52', b: '#6c5e48' },
    rubble:   { p: 5, a: '#5f574b', b: '#544c42' },
    mountain: { p: 6, a: '#59524b', b: '#4d4741' },
    dfloor:   { p: 1, a: '#433c37', b: '#3a3430' },
    dwall:    { p: 7, a: '#221d1b', b: '#1c1816' },
  };
  let noise = null;
  function smoothNoise(x, y) {
    if (!noise) { const r = AF.rng(AF.WORLD_SEED + 7); noise = Array.from({ length: 30 * 30 }, () => r()); }
    const s = 5, fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const v = (i, j) => noise[(((iy + j) % 30) + 30) % 30 * 30 + ((((ix + i) % 30) + 30) % 30)];
    const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx, b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
    return a + (b - a) * ty;
  }

  // ---------- Sizing ----------
  let S = 64, rs = 1, cache = {}, chunkOrder = [];
  function resize(canvas) {
    const cw = canvas.clientWidth, chh = canvas.clientHeight;
    const T = Math.max(34, Math.min(62, Math.round(Math.min(cw / 19, chh / 12.5))));
    rs = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(cw * rs), h = Math.round(chh * rs);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const nS = Math.round(T * rs);
    if (nS !== S) { S = nS; cache = {}; chunkOrder = []; imgs = {}; }
  }
  const areaOf = () => (AF.game && AF.game.state && AF.game.state.world && AF.game.state.world.area) || 'over';
  const inTownTile = (x, y) => areaOf() === 'over' && (AF.World.TOWNS || []).some((T) => x >= T.x && y >= T.y && x < T.x + T.w && y < T.y + T.h);

  // ---------- Terrain chunks ----------
  function terrainChunk(cx, cy) {
    const area = areaOf(), k = area + ':' + cx + ',' + cy;
    if (cache[k]) return cache[k];
    const mp = AF.World.map(), W = mp.w, H = mp.h;
    const cv = document.createElement('canvas'); cv.width = CHK * S; cv.height = CHK * S;
    const g = cv.getContext('2d');
    const x0 = cx * CHK, y0 = cy * CHK;
    g.translate(-x0 * S, -y0 * S);
    const edge = area === 'foundry' ? 'dwall' : 'water';
    const t = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? edge : AF.World.terrainAt(null, x, y);
    const pr = (x, y) => TERR[t(x, y)].p;
    const col = (x, y) => { const d = TERR[t(x, y)]; return mixHex(d.a, d.b, smoothNoise(x, y) * 0.9); };
    const xs = [x0 - 1, x0 + CHK], ys = [y0 - 1, y0 + CHK];
    const each = (fn) => { for (let y = ys[0]; y <= ys[1]; y++) for (let x = xs[0]; x <= xs[1]; x++) fn(x, y); };
    each((x, y) => { g.fillStyle = col(x, y); g.fillRect(x * S, y * S, S + 1, S + 1); });
    // higher terrain spills over lower neighbours with rounded, inked edges
    const E = S * 0.2, RAD = S * 0.28;
    const shape = (x, y, n, s, w, e, grow) => {
      const eN = n ? E + grow : 0, eS = s ? E + grow : 0, eW = w ? E + grow : 0, eE = e ? E + grow : 0;
      g.beginPath();
      g.roundRect(x * S - eW, y * S - eN, S + eW + eE, S + eN + eS, [n && w ? RAD : 0, n && e ? RAD : 0, s && e ? RAD : 0, s && w ? RAD : 0]);
    };
    const levels = [...new Set(Object.values(TERR).map((d) => d.p))].sort((a, b) => a - b).slice(1);
    for (const lv of levels) {
      if (lv === 7) continue; // dungeon walls are drawn as blocks below
      each((x, y) => {
        const me = pr(x, y); if (me !== lv) return;
        const n = pr(x, y - 1) < me, s = pr(x, y + 1) < me, w = pr(x - 1, y) < me, e = pr(x + 1, y) < me;
        if (!(n || s || w || e)) return;
        const wet = t(x, y - 1) === 'water' || t(x, y + 1) === 'water' || t(x - 1, y) === 'water' || t(x + 1, y) === 'water';
        if (wet && me < 6) { shape(x, y, n, s, w, e, S * 0.07); g.fillStyle = 'rgba(150,170,160,.35)'; g.fill(); }
        shape(x, y, n, s, w, e, S * 0.045); g.fillStyle = sh(TERR[t(x, y)].b, -45); g.fill();
        shape(x, y, n, s, w, e, 0); g.fillStyle = col(x, y); g.fill();
        if (n) { g.fillStyle = 'rgba(255,240,200,.07)'; g.fillRect(x * S, y * S - E + S * 0.03, S, S * 0.04); }
      });
    }
    // surface details
    each((x, y) => {
      const c = t(x, y), r = rng(x, y), X = x * S, Y = y * S, d = TERR[c];
      if (c === 'grass' || c === 'lawn') {
        g.strokeStyle = sh(d.b, -26); g.lineWidth = Math.max(1, S * 0.022); g.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const bx = X + S * (0.1 + r() * 0.8), by = Y + S * (0.25 + r() * 0.7);
          for (let j = -1; j <= 1; j++) { g.beginPath(); g.moveTo(bx + j * S * 0.035, by); g.quadraticCurveTo(bx + j * S * 0.05, by - S * 0.07, bx + j * S * 0.08, by - S * 0.13); g.stroke(); }
        }
        if (r() < 0.2) { g.fillStyle = 'rgba(30,26,20,.35)'; g.beginPath(); g.ellipse(X + S * r(), Y + S * r(), S * 0.05, S * 0.03, 0, 0, 7); g.fill(); }
        if (mp.deco[y * W + x] === 'flowers' || (c === 'grass' && r() < 0.04)) {
          for (let i = 0; i < 4; i++) {
            const fx = X + S * (0.15 + r() * 0.7), fy = Y + S * (0.15 + r() * 0.7), fc = ['#9a5a6a', '#b8a05a', '#c8c0a8', '#7a6a9a'][Math.floor(r() * 4)];
            g.fillStyle = fc; for (let p = 0; p < 5; p++) { const a = p * 1.2566; g.beginPath(); g.arc(fx + Math.cos(a) * S * 0.03, fy + Math.sin(a) * S * 0.03, S * 0.024, 0, 7); g.fill(); }
            g.fillStyle = '#c89a3a'; g.beginPath(); g.arc(fx, fy, S * 0.018, 0, 7); g.fill();
          }
        }
      } else if (c === 'forest') {
        for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
          const bx = X + S * (0.16 + i * 0.32 + (row % 2) * 0.12), by = Y + S * (0.4 + row * 0.28);
          const gr = g.createLinearGradient(0, by - S * 0.3, 0, by); gr.addColorStop(0, '#5e7a48'); gr.addColorStop(1, '#1e3018');
          g.fillStyle = gr; g.beginPath(); g.moveTo(bx - S * 0.13, by);
          g.quadraticCurveTo(bx - S * 0.12, by - S * 0.18, bx - S * 0.08, by - S * 0.27); g.quadraticCurveTo(bx - S * 0.03, by - S * 0.12, bx, by - S * 0.33);
          g.quadraticCurveTo(bx + S * 0.03, by - S * 0.12, bx + S * 0.08, by - S * 0.26); g.quadraticCurveTo(bx + S * 0.12, by - S * 0.17, bx + S * 0.13, by); g.closePath(); g.fill();
        }
      } else if (c === 'sand') {
        g.strokeStyle = 'rgba(40,30,20,.22)'; g.lineWidth = Math.max(1, S * 0.018);
        for (let i = 0; i < 2; i++) { g.beginPath(); const xx = X + S * r(), yy = Y + S * r(); g.moveTo(xx, yy); g.lineTo(xx + S * 0.12, yy + S * (r() - 0.5) * 0.15); g.lineTo(xx + S * 0.2, yy + S * (r() - 0.5) * 0.15); g.stroke(); }
        g.fillStyle = 'rgba(30,24,16,.3)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(X + S * r(), Y + S * r(), S * 0.02, 0, 7); g.fill(); }
        if (r() < 0.12) { g.strokeStyle = '#6a6040'; g.lineWidth = Math.max(1, S * 0.02); const bx = X + S * r(), by = Y + S * (0.4 + r() * 0.5); for (let j = -2; j <= 2; j++) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + j * S * 0.05, by - S * 0.14); g.stroke(); } }
      } else if (c === 'path') {
        if (inTownTile(x, y)) { // cobblestones
          for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
            const px = X + S * (0.05 + i * 0.32 + (row % 2) * 0.12) + r() * S * 0.03, py = Y + S * (0.05 + row * 0.32), pw = S * 0.27, ph = S * 0.24;
            g.fillStyle = sh(d.a, Math.round((r() - 0.5) * 22)); g.beginPath(); g.roundRect(px, py, pw, ph, S * 0.07); g.fill();
            g.strokeStyle = 'rgba(20,16,12,.45)'; g.lineWidth = Math.max(1, S * 0.018); g.stroke();
          }
        } else {
          g.strokeStyle = 'rgba(30,24,16,.25)'; g.lineWidth = Math.max(1, S * 0.03);
          g.beginPath(); g.moveTo(X, Y + S * 0.3); g.lineTo(X + S, Y + S * 0.3); g.moveTo(X, Y + S * 0.7); g.lineTo(X + S, Y + S * 0.7); g.stroke();
          g.fillStyle = 'rgba(30,24,16,.3)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(X + S * r(), Y + S * r(), S * 0.025, 0, 7); g.fill(); }
        }
      } else if (c === 'rubble') {
        for (let i = 0; i < 4; i++) {
          const rx = X + S * (0.15 + r() * 0.7), ry = Y + S * (0.2 + r() * 0.65), rw = S * (0.06 + r() * 0.08);
          g.fillStyle = 'rgba(10,8,6,.35)'; g.beginPath(); g.ellipse(rx + rw * 0.2, ry + rw * 0.5, rw, rw * 0.45, 0, 0, 7); g.fill();
          const rust = r() < 0.35;
          const gr = g.createLinearGradient(0, ry - rw, 0, ry + rw); gr.addColorStop(0, rust ? '#8a5a3a' : '#8a8274'); gr.addColorStop(1, rust ? '#4a2e1e' : '#3e3830');
          g.fillStyle = gr; g.beginPath(); if (rust) g.roundRect(rx - rw, ry - rw * 0.5, rw * 2, rw, S * 0.01); else g.ellipse(rx, ry, rw, rw * 0.75, 0, 0, 7); g.fill();
        }
      } else if (c === 'mountain') {
        g.strokeStyle = 'rgba(20,16,12,.35)'; g.lineWidth = Math.max(1, S * 0.02);
        g.beginPath(); g.moveTo(X + S * r(), Y + S * 0.2); g.lineTo(X + S * r(), Y + S * 0.5); g.lineTo(X + S * r(), Y + S * 0.7); g.stroke();
        if (r() > 0.6) { g.fillStyle = 'rgba(200,190,170,.08)'; g.beginPath(); g.ellipse(X + S * 0.5, Y + S * 0.4, S * 0.2, S * 0.08, 0, 0, 7); g.fill(); }
      } else if (c === 'water') {
        const deep = t(x, y - 1) === 'water' && t(x, y + 1) === 'water' && t(x - 1, y) === 'water' && t(x + 1, y) === 'water';
        if (deep) { g.fillStyle = 'rgba(8,20,30,.25)'; g.fillRect(X, Y, S + 1, S + 1); }
        if (mp.bridges && mp.bridges[x + ',' + y]) { // plank bridge
          g.fillStyle = '#5a4430'; g.fillRect(X, Y, S + 1, S + 1);
          g.strokeStyle = '#2a1e14'; g.lineWidth = Math.max(1, S * 0.03); for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(X, Y + i * S / 4); g.lineTo(X + S, Y + i * S / 4); g.stroke(); }
        }
      } else if (c === 'dfloor') {
        g.strokeStyle = 'rgba(10,8,6,.55)'; g.lineWidth = Math.max(1, S * 0.025);
        g.strokeRect(X + 1, Y + 1, S / 2 - 1, S / 2 - 1); g.strokeRect(X + S / 2, Y + 1, S / 2 - 1, S / 2 - 1);
        g.strokeRect(X + S / 4, Y + S / 2, S / 2, S / 2 - 1);
        if (r() < 0.25) { g.fillStyle = 'rgba(90,70,40,.25)'; g.beginPath(); g.ellipse(X + S * r(), Y + S * r(), S * 0.15, S * 0.08, 0, 0, 7); g.fill(); }
      }
    });
    // cliffs: crags get a shaded face where they drop to lower ground
    each((x, y) => {
      if (t(x, y) !== 'mountain' || t(x, y + 1) === 'mountain') return;
      const X = x * S, Y = (y + 1) * S - S * 0.08, hgt = S * 0.5;
      const gr = g.createLinearGradient(0, Y, 0, Y + hgt); gr.addColorStop(0, '#4a443e'); gr.addColorStop(1, '#2a2420');
      g.fillStyle = gr; g.beginPath(); g.roundRect(X - (t(x - 1, y) === 'mountain' ? 0 : S * 0.06), Y, S + (t(x - 1, y) === 'mountain' ? 0 : S * 0.06) + (t(x + 1, y) === 'mountain' ? 1 : S * 0.06), hgt, [0, 0, S * 0.1, S * 0.1]); g.fill();
      g.strokeStyle = 'rgba(10,8,6,.45)'; g.lineWidth = Math.max(1, S * 0.02);
      for (let i = 0.2; i < 1; i += 0.3) { g.beginPath(); g.moveTo(X + S * i, Y + S * 0.08); g.lineTo(X + S * i - S * 0.04, Y + hgt - S * 0.06); g.stroke(); }
    });
    // dungeon walls: dark block tops with a brick face toward the floor below
    each((x, y) => {
      if (t(x, y) !== 'dwall') return;
      const X = x * S, Y = y * S;
      g.fillStyle = '#16120f'; g.fillRect(X, Y, S + 1, S + 1);
      if (t(x, y + 1) === 'dfloor') {
        const fy = Y + S * 0.3, fh = S * 0.7;
        const gr = g.createLinearGradient(0, fy, 0, fy + fh); gr.addColorStop(0, '#4a403a'); gr.addColorStop(1, '#2e2622');
        g.fillStyle = gr; g.fillRect(X, fy, S + 1, fh);
        g.strokeStyle = 'rgba(10,8,6,.7)'; g.lineWidth = Math.max(1, S * 0.025);
        for (let row = 0; row < 3; row++) { const yy = fy + row * fh / 3; g.beginPath(); g.moveTo(X, yy); g.lineTo(X + S, yy); g.stroke();
          for (let i = 0; i < 2; i++) { const xx = X + S * (row % 2 ? 0.25 : 0.5) + i * S * 0.5; if (xx < X + S) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + fh / 3); g.stroke(); } } }
        g.fillStyle = '#5a4e44'; g.fillRect(X, fy - S * 0.04, S + 1, S * 0.05);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X, Y + S, S + 1, S * 0.12);
      } else {
        g.fillStyle = 'rgba(80,66,56,.25)'; if (t(x, y - 1) !== 'dwall') g.fillRect(X, Y, S, S * 0.05);
      }
    });
    cache[k] = cv; chunkOrder.push(k);
    if (chunkOrder.length > 60) delete cache[chunkOrder.shift()];
    return cv;
  }

  // ---------- Prop images (cached at the current size) ----------
  let imgs = {};
  const OUT = '#120e0b';
  function outline(src, px) {
    px = Math.max(1, Math.round(px || S * 0.025));
    const c = document.createElement('canvas'); c.width = src.width + px * 2; c.height = src.height + px * 2;
    const sil = document.createElement('canvas'); sil.width = src.width; sil.height = src.height;
    const sg = sil.getContext('2d'); sg.drawImage(src, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = OUT; sg.fillRect(0, 0, sil.width, sil.height);
    const g = c.getContext('2d');
    for (let a = 0; a < 12; a++) g.drawImage(sil, px + Math.round(Math.cos(a * Math.PI / 6) * px), px + Math.round(Math.sin(a * Math.PI / 6) * px));
    g.drawImage(src, px, px);
    return c;
  }
  R.outline = outline;
  function img(key, w, h, paint, noLine) {
    if (imgs[key]) return imgs[key];
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    paint(cv.getContext('2d'), cv.width, cv.height);
    return (imgs[key] = noLine ? cv : outline(cv));
  }
  const ell = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
  const lin = (g, y0, y1, c0, c1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
  const box = (g, x, y, w, h, c, r) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r || 0); g.fill(); };
  const line = (g, c, w, pts) => { g.strokeStyle = c; g.lineWidth = Math.max(1, w); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  const shadow = (g, x, y, rx, ry) => ell(g, x, y, rx, ry, 'rgba(0,0,0,.35)');

  // trees: dark oaks and pines
  const treeImg = (v) => img('tree' + v, S * 1.5, S * 2.3, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.14;
    shadow(g, cx, by, S * 0.45, S * 0.12);
    g.fillStyle = lin(g, by - S * 0.7, by, '#4a3626', '#2a1e14');
    g.beginPath(); g.moveTo(cx - S * 0.14, by); g.quadraticCurveTo(cx - S * 0.06, by - S * 0.35, cx - S * 0.08, by - S * 0.7); g.lineTo(cx + S * 0.08, by - S * 0.7); g.quadraticCurveTo(cx + S * 0.06, by - S * 0.35, cx + S * 0.14, by); g.fill();
    if (v) { // pine
      for (let i = 0; i < 4; i++) {
        const y0 = by - S * (0.55 + i * 0.34), half = S * (0.6 - i * 0.12);
        g.fillStyle = lin(g, y0 - S * 0.45, y0, ['#4a6a3e', '#40603a', '#3a5836', '#345232'][i], '#1a2a16');
        g.beginPath(); g.moveTo(cx - half, y0); g.quadraticCurveTo(cx - half * 0.3, y0 - S * 0.2, cx, y0 - S * 0.5); g.quadraticCurveTo(cx + half * 0.3, y0 - S * 0.2, cx + half, y0); g.quadraticCurveTo(cx, y0 + S * 0.06, cx - half, y0); g.fill();
      }
    } else { // oak
      const puff = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx + x * S, by + y * S, r * S, 0, 7); g.fill(); };
      [[-0.34, -0.82, 0.34], [0.34, -0.84, 0.34], [0, -0.86, 0.4], [-0.22, -1.2, 0.33], [0.22, -1.22, 0.32], [0, -1.5, 0.3]].forEach(([x, y, r]) => puff(x, y, r, '#223a1e'));
      [[-0.3, -0.9, 0.26], [0.3, -0.92, 0.26], [0, -0.95, 0.32], [-0.18, -1.27, 0.25], [0.2, -1.29, 0.24], [0, -1.55, 0.22]].forEach(([x, y, r]) => puff(x - 0.04, y - 0.05, r, '#36502c'));
      [[-0.22, -1.38, 0.1], [0.06, -1.64, 0.08], [-0.36, -1.0, 0.08], [0.16, -1.04, 0.07]].forEach(([x, y, r]) => puff(x, y, r, '#56703e'));
    }
  });
  // iron gas lamp with a brass cap
  const lampImg = () => img('lamp', S, S * 2, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    shadow(g, cx, by, S * 0.2, S * 0.06);
    box(g, cx - S * 0.045, by - S * 1.4, S * 0.09, S * 1.4, lin(g, 0, 1, '#2a2826', '#2a2826'));
    box(g, cx - S * 0.15, by - S * 0.12, S * 0.3, S * 0.12, '#1e1c1a', S * 0.03);
    line(g, '#2a2826', S * 0.04, [[cx, by - S * 1.38], [cx + S * 0.16, by - S * 1.45]]);
    box(g, cx - S * 0.13, by - S * 1.68, S * 0.26, S * 0.32, '#f2c070', S * 0.05);
    line(g, '#2a2826', S * 0.03, [[cx, by - S * 1.68], [cx, by - S * 1.36]]);
    g.fillStyle = '#8a6a32'; g.beginPath(); g.moveTo(cx - S * 0.19, by - S * 1.66); g.lineTo(cx, by - S * 1.86); g.lineTo(cx + S * 0.19, by - S * 1.66); g.closePath(); g.fill();
    box(g, cx - S * 0.15, by - S * 1.39, S * 0.3, S * 0.05, '#8a6a32', S * 0.02);
  });
  const signImg = () => img('sign', S, S * 1.15, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    shadow(g, cx, by, S * 0.28, S * 0.06);
    box(g, cx - S * 0.04, by - S * 0.95, S * 0.08, S * 0.95, '#3a2a1c');
    box(g, cx - S * 0.4, by - S * 0.92, S * 0.8, S * 0.42, lin(g, by - S * 0.92, by - S * 0.5, '#6a5038', '#4a3624'), S * 0.04);
    g.fillStyle = 'rgba(230,210,170,.35)'; g.fillRect(cx - S * 0.28, by - S * 0.8, S * 0.56, S * 0.04); g.fillRect(cx - S * 0.28, by - S * 0.68, S * 0.4, S * 0.04);
    [[-0.34, -0.86], [0.34, -0.86], [-0.34, -0.56], [0.34, -0.56]].forEach(([a, b]) => ell(g, cx + a * S, by + b * S, S * 0.022, S * 0.022, '#9a8a6a'));
  });
  const boardImg = () => img('bounty', S * 1.3, S * 1.5, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.08;
    shadow(g, cx, by, S * 0.5, S * 0.08);
    box(g, cx - S * 0.5, by - S * 1.05, S * 0.08, S * 1.05, '#3a2a1c'); box(g, cx + S * 0.42, by - S * 1.05, S * 0.08, S * 1.05, '#3a2a1c');
    box(g, cx - S * 0.56, by - S * 1.3, S * 1.12, S * 0.7, lin(g, by - S * 1.3, by - S * 0.6, '#7a5a3a', '#4e3824'), S * 0.05);
    box(g, cx - S * 0.62, by - S * 1.38, S * 1.24, S * 0.12, '#2e2016', S * 0.03);
    [[-0.42, -1.2, '#e8dcbc'], [-0.08, -1.24, '#f0e4c4'], [0.24, -1.18, '#e4d4b0']].forEach(([a, b, c], i) => {
      g.save(); g.translate(cx + a * S + S * 0.14, by + b * S + S * 0.2); g.rotate((i - 1) * 0.08); box(g, -S * 0.14, -S * 0.2, S * 0.28, S * 0.4, c, S * 0.02);
      g.fillStyle = '#a83a2a'; g.font = `bold ${Math.round(S * 0.12)}px serif`; g.textAlign = 'center'; g.fillText('!', 0, -S * 0.04);
      g.fillStyle = 'rgba(60,40,20,.5)'; g.fillRect(-S * 0.09, S * 0.02, S * 0.18, S * 0.025); g.fillRect(-S * 0.09, S * 0.08, S * 0.12, S * 0.025); g.restore();
    });
    ell(g, cx, by - S * 1.36, S * 0.05, S * 0.05, '#c8a050');
  });
  const fenceImg = () => img('fence', S, S, (g) => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, S * 0.82, S, S * 0.08);
    const wood = (x, y, w, h) => box(g, x, y, w, h, lin(g, y, y + h, '#6a5038', '#3a2a1c'), S * 0.02);
    wood(0, S * 0.38, S, S * 0.09); wood(0, S * 0.6, S, S * 0.09); wood(S * 0.1, S * 0.22, S * 0.11, S * 0.66); wood(S * 0.79, S * 0.22, S * 0.11, S * 0.66);
  });
  const barrelImg = () => img('barrel', S, S * 1.15, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    shadow(g, cx, by, S * 0.3, S * 0.08);
    g.fillStyle = lin(g, 0, 0, '#5a4028', '#5a4028'); g.beginPath(); g.moveTo(cx - S * 0.26, by - S * 0.05); g.quadraticCurveTo(cx - S * 0.34, by - S * 0.4, cx - S * 0.26, by - S * 0.8); g.lineTo(cx + S * 0.26, by - S * 0.8); g.quadraticCurveTo(cx + S * 0.34, by - S * 0.4, cx + S * 0.26, by - S * 0.05); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx + S * 0.08, by - S * 0.8, S * 0.18, S * 0.75);
    [0.18, 0.62].forEach((k) => box(g, cx - S * 0.31, by - S * (0.05 + k * 0.75) - S * 0.03, S * 0.62, S * 0.06, '#3a3836'));
    ell(g, cx, by - S * 0.8, S * 0.26, S * 0.08, '#6a5038');
  });
  const crateImg = () => img('crate', S, S * 1.05, (g, w, h) => {
    const x = S * 0.1, y = h - S * 0.9;
    shadow(g, w / 2, h - S * 0.08, S * 0.4, S * 0.08);
    box(g, x, y, S * 0.8, S * 0.8, lin(g, y, y + S * 0.8, '#6a5038', '#45321f'));
    line(g, '#2a1e14', S * 0.05, [[x + S * 0.06, y + S * 0.06], [x + S * 0.74, y + S * 0.74]]);
    g.strokeStyle = '#2a1e14'; g.lineWidth = S * 0.04; g.strokeRect(x + S * 0.04, y + S * 0.04, S * 0.72, S * 0.72);
    [[0.08, 0.08], [0.72, 0.08], [0.08, 0.72], [0.72, 0.72]].forEach(([a, b]) => ell(g, x + a * S, y + b * S, S * 0.025, S * 0.025, '#8a7a5a'));
  });
  function nodeImg(n) {
    return img('node' + n, S, S, (g) => {
      const cx = S / 2, by = S * 0.82;
      shadow(g, cx, by, S * 0.36, S * 0.1);
      if (n === 'scrap') {
        box(g, cx - S * 0.32, by - S * 0.3, S * 0.64, S * 0.3, lin(g, by - S * 0.3, by, '#8a8680', '#4a4640'), S * 0.08);
        box(g, cx - S * 0.12, by - S * 0.5, S * 0.3, S * 0.24, '#6a5a4a', S * 0.03);
        g.save(); g.translate(cx - S * 0.15, by - S * 0.32); g.fillStyle = '#8a5a34';
        for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-S * 0.025, -S * 0.15, S * 0.05, S * 0.06); }
        g.beginPath(); g.arc(0, 0, S * 0.11, 0, 7); g.fill(); g.fillStyle = '#2a2622'; g.beginPath(); g.arc(0, 0, S * 0.045, 0, 7); g.fill(); g.restore();
      } else if (n === 'copper') {
        g.fillStyle = lin(g, by - S * 0.5, by, '#6a645a', '#3a342c'); g.beginPath(); g.moveTo(cx - S * 0.35, by); g.quadraticCurveTo(cx - S * 0.35, by - S * 0.45, cx, by - S * 0.5); g.quadraticCurveTo(cx + S * 0.38, by - S * 0.42, cx + S * 0.36, by); g.closePath(); g.fill();
        [[-0.12, -0.28, 0.08], [0.1, -0.2, 0.07], [0.02, -0.38, 0.05]].forEach(([dx, dy, r]) => ell(g, cx + dx * S, by + dy * S, r * S, r * S, '#c87a3a'));
      } else {
        const [c0, c1] = n === 'silicon' ? ['#d8eaf0', '#5a8aa0'] : ['#e8c8ff', '#6a3aa8'];
        [[-0.17, 0.55, -0.25], [0.15, 0.5, 0.25], [0, 0.72, 0]].forEach(([dx, hgt, rot]) => {
          g.save(); g.translate(cx + dx * S, by - S * 0.04); g.rotate(rot);
          const gr = g.createLinearGradient(-S * 0.1, 0, S * 0.1, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
          g.fillStyle = gr; g.beginPath(); g.moveTo(-S * 0.09, 0); g.lineTo(-S * 0.09, -hgt * S * 0.75); g.lineTo(0, -hgt * S); g.lineTo(S * 0.09, -hgt * S * 0.75); g.lineTo(S * 0.09, 0); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-S * 0.05, -hgt * S * 0.7, S * 0.022, hgt * S * 0.5); g.restore();
        });
      }
    });
  }
  // ruined standing stones with a rune
  const ruinImg = () => img('ruin', S * 1.2, S * 1.5, (g, w, h) => {
    const by = h - S * 0.15;
    shadow(g, w / 2, by, S * 0.5, S * 0.12);
    const stone = (x, y, ww, hh) => { const gr = g.createLinearGradient(x, 0, x + ww, 0); gr.addColorStop(0, '#7a746a'); gr.addColorStop(1, '#3e3a34'); box(g, x, y, ww, hh, gr, S * 0.04); };
    stone(w * 0.14, by - S * 1.05, S * 0.26, S * 1.05); stone(w * 0.62, by - S * 0.66, S * 0.26, S * 0.66); stone(w * 0.08, by - S * 1.18, S * 0.66, S * 0.17);
    g.fillStyle = '#3a5030'; g.beginPath(); g.ellipse(w * 0.3, by - S * 1.17, S * 0.14, S * 0.05, 0, 0, 7); g.fill();
    line(g, '#7ad0e0', S * 0.025, [[w * 0.25, by - S * 0.8], [w * 0.29, by - S * 0.62], [w * 0.23, by - S * 0.5], [w * 0.29, by - S * 0.38]]);
  });
  // the Arc Well: a stone well with a rune pillar
  const fountainImg = () => img('fountain', S * 2, S * 2.5, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.25;
    shadow(g, cx, by + S * 0.05, S * 0.98, S * 0.4);
    ell(g, cx, by - S * 0.08, S * 0.95, S * 0.46, '#3e3a34'); ell(g, cx, by - S * 0.16, S * 0.92, S * 0.42, '#6a645a');
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; line(g, 'rgba(20,16,12,.5)', S * 0.02, [[cx + Math.cos(a) * S * 0.78, by - S * 0.16 + Math.sin(a) * S * 0.34], [cx + Math.cos(a) * S * 0.92, by - S * 0.16 + Math.sin(a) * S * 0.42]]); }
    const wg = g.createRadialGradient(cx, by - S * 0.18, S * 0.1, cx, by - S * 0.14, S * 0.8); wg.addColorStop(0, '#5ab8c8'); wg.addColorStop(1, '#1a3a48');
    ell(g, cx, by - S * 0.16, S * 0.76, S * 0.32, wg);
    const pg = g.createLinearGradient(cx - S * 0.14, 0, cx + S * 0.14, 0); pg.addColorStop(0, '#8a847a'); pg.addColorStop(1, '#45403a');
    box(g, cx - S * 0.14, by - S * 1.35, S * 0.28, S * 1.2, pg, S * 0.04);
    ell(g, cx, by - S * 1.35, S * 0.3, S * 0.1, '#6a645a');
    line(g, '#8ae8f0', S * 0.03, [[cx - S * 0.05, by - S * 1.15], [cx + S * 0.05, by - S * 0.95], [cx - S * 0.05, by - S * 0.75], [cx + S * 0.05, by - S * 0.55]]);
  });
  // Brasshaven's Great Clock (2×2 tower)
  const clockImg = () => img('clock', S * 2.2, S * 4.4, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.2, tw = S * 1.7;
    shadow(g, cx, by, S * 1.0, S * 0.3);
    box(g, cx - tw / 2, by - S * 3.2, tw, S * 3.2, lin(g, 0, 0, '#5a544c', '#5a544c'));
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(cx + tw * 0.2, by - S * 3.2, tw * 0.3, S * 3.2);
    g.strokeStyle = 'rgba(15,12,10,.55)'; g.lineWidth = Math.max(1, S * 0.02);
    for (let y = by - S * 3.2; y < by; y += S * 0.3) { g.beginPath(); g.moveTo(cx - tw / 2, y); g.lineTo(cx + tw / 2, y); g.stroke(); }
    box(g, cx - S * 0.3, by - S * 0.8, S * 0.6, S * 0.8, '#2a1e14', [S * 0.3, S * 0.3, 0, 0]);
    // clock face
    ell(g, cx, by - S * 2.4, S * 0.62, S * 0.62, '#8a6a32'); ell(g, cx, by - S * 2.4, S * 0.52, S * 0.52, '#e8dcb8');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ell(g, cx + Math.cos(a) * S * 0.43, by - S * 2.4 + Math.sin(a) * S * 0.43, S * 0.03, S * 0.03, '#2a2018'); }
    // roof
    g.fillStyle = lin(g, by - S * 4.3, by - S * 3.1, '#5a4a6a', '#2a2234'); g.beginPath(); g.moveTo(cx - tw / 2 - S * 0.15, by - S * 3.15); g.lineTo(cx, by - S * 4.3); g.lineTo(cx + tw / 2 + S * 0.15, by - S * 3.15); g.closePath(); g.fill();
    box(g, cx - S * 0.04, by - S * 4.45, S * 0.08, S * 0.22, '#8a6a32');
    // side pipes
    box(g, cx + tw / 2 - S * 0.05, by - S * 2.0, S * 0.14, S * 2.0, lin(g, 0, 0, '#a07a3a', '#a07a3a'), S * 0.04);
    box(g, cx + tw / 2 - S * 0.1, by - S * 2.1, S * 0.24, S * 0.12, '#6a5028', S * 0.03);
  });
  // brass steam pipes
  const pipesImg = () => img('pipes', S, S * 1.9, (g, w, h) => {
    const by = h - S * 0.08;
    shadow(g, w / 2, by, S * 0.34, S * 0.08);
    const pipe = (x, top, wd) => { const gr = g.createLinearGradient(x, 0, x + wd, 0); gr.addColorStop(0, '#c89a4a'); gr.addColorStop(0.5, '#a07a3a'); gr.addColorStop(1, '#5a4020'); box(g, x, top, wd, by - top, gr, wd / 2); };
    pipe(S * 0.18, by - S * 1.5, S * 0.2); pipe(S * 0.48, by - S * 1.15, S * 0.26);
    box(g, S * 0.12, by - S * 0.25, S * 0.74, S * 0.25, '#3a3632', S * 0.04);
    ell(g, S * 0.61, by - S * 0.7, S * 0.14, S * 0.14, '#7a2a1e'); line(g, '#c8a060', S * 0.03, [[S * 0.5, by - S * 0.7], [S * 0.72, by - S * 0.7]]);
    box(g, S * 0.14, by - S * 1.55, S * 0.28, S * 0.08, '#6a5028', S * 0.02);
  });
  const stonewallImg = () => img('stonewall', S, S * 1.5, (g, w, h) => {
    const by = h, top = h - S * 1.3;
    box(g, 0, top, S, S * 1.3, lin(g, top, by, '#5e5850', '#3a3530'));
    g.strokeStyle = 'rgba(12,10,8,.6)'; g.lineWidth = Math.max(1, S * 0.02);
    for (let r = 0; r < 4; r++) { const y = top + S * 0.2 + r * S * 0.27; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); const off = r % 2 ? 0.25 : 0.55; g.beginPath(); g.moveTo(S * off, y); g.lineTo(S * off, y + S * 0.27); g.stroke(); }
    box(g, 0, top - S * 0.12, S * 0.32, S * 0.2, '#6a645a'); box(g, S * 0.68, top - S * 0.12, S * 0.32, S * 0.2, '#6a645a');
    g.fillStyle = 'rgba(255,240,200,.08)'; g.fillRect(0, top, S, S * 0.05);
  });
  // the way into the Sunken Foundry
  const caveImg = () => img('cave', S * 3, S * 2.8, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.15;
    shadow(g, cx, by, S * 1.3, S * 0.3);
    g.fillStyle = lin(g, by - S * 2.4, by, '#5a544c', '#2a2622'); g.beginPath(); g.moveTo(cx - S * 1.4, by); g.lineTo(cx - S * 1.3, by - S * 1.6); g.quadraticCurveTo(cx, by - S * 2.7, cx + S * 1.3, by - S * 1.6); g.lineTo(cx + S * 1.4, by); g.closePath(); g.fill();
    g.fillStyle = '#060404'; g.beginPath(); g.moveTo(cx - S * 0.75, by); g.lineTo(cx - S * 0.75, by - S * 1.1); g.quadraticCurveTo(cx, by - S * 1.95, cx + S * 0.75, by - S * 1.1); g.lineTo(cx + S * 0.75, by); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(10,8,6,.7)'; g.lineWidth = Math.max(1, S * 0.03);
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * S * 0.78, by - S * 1.1 + Math.sin(a) * S * 0.85); g.lineTo(cx + Math.cos(a) * S * 1.25, by - S * 1.1 + Math.sin(a) * S * 1.35); g.stroke(); }
    box(g, cx - S * 0.25, by - S * 2.15, S * 0.5, S * 0.3, '#8a6a32', S * 0.04);
    line(g, '#d8a8ff', S * 0.03, [[cx - S * 0.12, by - S * 2.05], [cx, by - S * 1.92], [cx + S * 0.12, by - S * 2.05]]);
    // iron gate pushed aside
    g.strokeStyle = '#2a2826'; g.lineWidth = S * 0.06; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx + S * 0.85 + i * S * 0.12, by); g.lineTo(cx + S * 0.85 + i * S * 0.12, by - S * 1.0); g.stroke(); }
  });
  const stairsImg = () => img('stairs', S, S * 1.2, (g, w, h) => {
    const by = h;
    for (let i = 0; i < 4; i++) box(g, S * (0.05 + i * 0.05), by - S * (0.25 + i * 0.22), S * (0.9 - i * 0.1), S * 0.22, i % 2 ? '#5a524a' : '#6a625a');
    g.fillStyle = 'rgba(255,230,170,.25)'; g.fillRect(S * 0.2, 0, S * 0.6, by - S * 0.9);
  });
  const crystalImg = () => img('crystal', S, S * 1.6, (g, w, h) => {
    const cx = w / 2, by = h - S * 0.1;
    shadow(g, cx, by, S * 0.32, S * 0.08);
    box(g, cx - S * 0.3, by - S * 0.18, S * 0.6, S * 0.18, '#3a3430', S * 0.05);
    [[-0.16, 0.8, -0.3], [0.16, 0.7, 0.3], [0, 1.25, 0]].forEach(([dx, hgt, rot]) => {
      g.save(); g.translate(cx + dx * S, by - S * 0.12); g.rotate(rot);
      const gr = g.createLinearGradient(-S * 0.12, 0, S * 0.12, 0); gr.addColorStop(0, '#d8b8ff'); gr.addColorStop(1, '#5a2a9a');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-S * 0.11, 0); g.lineTo(-S * 0.11, -hgt * S * 0.8); g.lineTo(0, -hgt * S); g.lineTo(S * 0.11, -hgt * S * 0.8); g.lineTo(S * 0.11, 0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-S * 0.06, -hgt * S * 0.75, S * 0.025, hgt * S * 0.55); g.restore();
    });
  });
  const chestImg = (open) => img('chest' + (open ? 1 : 0), S, S * 1.1, (g, w, h) => {
    const x = S * 0.12, by = h - S * 0.12, cw = S * 0.76;
    shadow(g, w / 2, by, S * 0.42, S * 0.09);
    box(g, x, by - S * 0.45, cw, S * 0.45, lin(g, by - S * 0.45, by, '#6a4a2a', '#3a2614'), S * 0.04);
    if (open) { box(g, x, by - S * 0.78, cw, S * 0.3, '#4a3018', S * 0.06); box(g, x + S * 0.06, by - S * 0.5, cw - S * 0.12, S * 0.1, '#140c06'); }
    else box(g, x - S * 0.02, by - S * 0.66, cw + S * 0.04, S * 0.26, lin(g, by - S * 0.66, by - S * 0.4, '#7a5432', '#4a3018'), [S * 0.14, S * 0.14, S * 0.02, S * 0.02]);
    [0.18, 0.78].forEach((k) => box(g, x + cw * k - S * 0.04, by - (open ? S * 0.45 : S * 0.66), S * 0.08, open ? S * 0.45 : S * 0.66, '#3a3632'));
    if (!open) box(g, x + cw / 2 - S * 0.07, by - S * 0.46, S * 0.14, S * 0.16, '#c8a050', S * 0.03);
  });
  const forgepitImg = () => img('forgepit', S, S, (g) => {
    box(g, 0, 0, S, S, '#2a1e18');
    box(g, S * 0.08, S * 0.08, S * 0.84, S * 0.84, lin(g, 0, S, '#ff9a30', '#a8300a'), S * 0.2);
    for (let i = 0; i < 4; i++) ell(g, S * (0.25 + (i % 2) * 0.45), S * (0.3 + Math.floor(i / 2) * 0.4), S * 0.1, S * 0.06, 'rgba(255,230,140,.6)');
  }, true);
  const plaqueImg = () => img('plaque', S, S, (g) => { box(g, S * 0.18, S * 0.35, S * 0.64, S * 0.4, '#8a6a32', S * 0.05); box(g, S * 0.24, S * 0.41, S * 0.52, S * 0.28, '#b8944a', S * 0.03); [0.48, 0.58].forEach((y) => box(g, S * 0.3, S * y, S * 0.4, S * 0.03, '#5a4020')); });
  const wallPropImg = (k) => img('wp' + k, S, S, (g) => {
    if (k === 'torch') { box(g, S * 0.44, S * 0.45, S * 0.12, S * 0.35, '#3a2a1c', S * 0.03); box(g, S * 0.36, S * 0.42, S * 0.28, S * 0.08, '#3a3632', S * 0.02); }
    if (k === 'wallpipe') { const gr = g.createLinearGradient(0, S * 0.45, 0, S * 0.65); gr.addColorStop(0, '#c89a4a'); gr.addColorStop(1, '#5a4020'); box(g, 0, S * 0.48, S, S * 0.16, gr); box(g, S * 0.4, S * 0.44, S * 0.2, S * 0.24, '#6a5028', S * 0.03); ell(g, S * 0.5, S * 0.42, S * 0.09, S * 0.04, '#7a2a1e'); }
    if (k === 'gearwall') { g.save(); g.translate(S * 0.5, S * 0.62); g.fillStyle = '#6a5a3a'; for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.fillRect(-S * 0.04, -S * 0.3, S * 0.08, S * 0.1); } g.beginPath(); g.arc(0, 0, S * 0.23, 0, 7); g.fill(); g.fillStyle = '#2a2622'; g.beginPath(); g.arc(0, 0, S * 0.08, 0, 7); g.fill(); g.restore(); }
  });

  // ---------- Buildings: timber-frame cottages (Rivet Hollow) and stone-and-brass halls (Brasshaven) ----------
  function buildingImg(b) {
    const def = AF.BUILDINGS[b.id], W = b.w * S, H = b.h * S, top = S * 1.0, stone = b.town === 2;
    return img('bld' + b.id, W + S * 0.6, H + top + S * 0.1, (g) => {
      g.translate(S * 0.3, 0);
      const base = top + H, roof = AF.mute ? AF.mute(def.roof, 0.35) : def.roof, eave = top + H * 0.5, dx = (Math.floor(b.w / 2) + 0.5) * S;
      const r = rng(b.x, b.y);
      // walls
      if (stone) {
        box(g, S * 0.15, eave - S * 0.1, W - S * 0.3, base - eave + S * 0.1, lin(g, eave, base, '#6a6258', '#45403a'));
        g.strokeStyle = 'rgba(12,10,8,.5)'; g.lineWidth = Math.max(1, S * 0.02);
        for (let y = eave + S * 0.15, row = 0; y < base; y += S * 0.26, row++) { g.beginPath(); g.moveTo(S * 0.15, y); g.lineTo(W - S * 0.15, y); g.stroke(); for (let x = S * (0.35 + (row % 2) * 0.25); x < W - S * 0.2; x += S * 0.5) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + S * 0.26); g.stroke(); } }
        box(g, S * 0.1, eave - S * 0.12, W - S * 0.2, S * 0.1, '#a07a3a');
      } else {
        box(g, S * 0.15, eave - S * 0.1, W - S * 0.3, base - eave + S * 0.1, lin(g, eave, base, '#b8a888', '#8a7a5e'));
        g.fillStyle = '#3a2a1e';
        const posts = Math.max(2, b.w);
        for (let i = 0; i <= posts; i++) g.fillRect(S * 0.15 + (i * (W - S * 0.42)) / posts, eave - S * 0.1, S * 0.12, base - eave);
        g.fillRect(S * 0.15, eave + (base - eave) * 0.45, W - S * 0.3, S * 0.09);
        g.strokeStyle = '#3a2a1e'; g.lineWidth = S * 0.07;
        for (let i = 0; i < posts; i++) { const x0 = S * 0.21 + (i * (W - S * 0.42)) / posts, x1 = S * 0.21 + ((i + 1) * (W - S * 0.42)) / posts; if (r() < 0.5) { g.beginPath(); g.moveTo(x0, eave + (base - eave) * 0.45); g.lineTo(x1, eave); g.stroke(); } }
      }
      // stone footing
      box(g, S * 0.1, base - S * 0.28, W - S * 0.2, S * 0.28, lin(g, base - S * 0.28, base, '#5a544c', '#34302a'));
      for (let x = S * 0.15; x < W - S * 0.2; x += S * 0.3) line(g, 'rgba(12,10,8,.5)', S * 0.02, [[x, base - S * 0.28], [x, base]]);
      // windows: warm lamplight
      const wy = eave + (base - eave) * 0.18, ww = S * 0.42, wh = S * 0.5;
      for (const x of [S * 0.85, W - S * 0.85, W / 2 > S * 2.5 ? S * 1.9 : -9, W / 2 > S * 2.5 ? W - S * 1.9 : -9]) {
        if (x < 0 || Math.abs(x - dx) < S * 0.8) continue;
        box(g, x - ww / 2 - S * 0.05, wy - S * 0.05, ww + S * 0.1, wh + S * 0.1, '#2a1e14', stone ? [ww / 2, ww / 2, 0, 0] : 0);
        const lg = g.createLinearGradient(0, wy, 0, wy + wh); lg.addColorStop(0, '#ffd890'); lg.addColorStop(1, '#c87830');
        box(g, x - ww / 2, wy, ww, wh, lg, stone ? [ww / 2, ww / 2, 0, 0] : 0);
        g.fillStyle = '#2a1e14'; g.fillRect(x - S * 0.02, wy, S * 0.04, wh); g.fillRect(x - ww / 2, wy + wh * 0.5, ww, S * 0.035);
        if (!stone) { box(g, x - ww / 2 - S * 0.17, wy, S * 0.13, wh, '#4a3a2a'); box(g, x + ww / 2 + S * 0.04, wy, S * 0.13, wh, '#4a3a2a'); }
      }
      // door: arched oak with iron straps
      const dw = S * 0.62, dh = S * 0.86;
      box(g, dx - dw / 2 - S * 0.07, base - dh - S * 0.07, dw + S * 0.14, dh + S * 0.07, stone ? '#6a6258' : '#3a2a1e', [dw, dw, 0, 0]);
      box(g, dx - dw / 2, base - dh, dw, dh, lin(g, base - dh, base, '#5a3e24', '#3a2614'), [dw / 2, dw / 2, 0, 0]);
      [0.35, 0.72].forEach((k) => box(g, dx - dw / 2, base - dh * k, dw, S * 0.05, '#2a2826'));
      ell(g, dx + dw * 0.28, base - dh * 0.45, S * 0.035, S * 0.035, '#c8a050');
      // roof
      const rg = g.createLinearGradient(0, 0, 0, eave); rg.addColorStop(0, sh(roof, 18)); rg.addColorStop(1, sh(roof, -28));
      g.fillStyle = sh(roof, -50); g.beginPath(); g.moveTo(-S * 0.25, eave + S * 0.1); g.lineTo(W + S * 0.25, eave + S * 0.1); g.lineTo(W + S * 0.2, eave - S * 0.05); g.lineTo(-S * 0.2, eave - S * 0.05); g.fill();
      g.fillStyle = rg; g.beginPath(); g.moveTo(-S * 0.25, eave); g.lineTo(S * 0.35, S * 0.08); g.lineTo(W - S * 0.35, S * 0.08); g.lineTo(W + S * 0.25, eave); g.closePath(); g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(10,8,6,.35)'; g.lineWidth = Math.max(1, S * 0.025);
      for (let y = S * 0.25; y < eave; y += S * 0.2) { g.beginPath(); g.moveTo(-S, y); g.lineTo(W + S, y); g.stroke(); for (let x = ((y / (S * 0.2)) % 2) * S * 0.14; x < W + S; x += S * 0.28) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + S * 0.2); g.stroke(); } }
      g.fillStyle = 'rgba(255,240,210,.08)'; g.fillRect(-S, S * 0.08, W + S * 2, S * 0.1);
      g.restore();
      box(g, S * 0.3, S * 0.02, W - S * 0.6, S * 0.1, sh(roof, -40));
      // chimney or brass stack
      const chx = W - S * (0.9 + r() * 0.6);
      if (stone || b.id === 'forge' || b.id === 'salvage') {
        box(g, chx, -S * 0.5, S * 0.26, S * 0.9, lin(g, 0, 0, '#a07a3a', '#a07a3a'), S * 0.05);
        box(g, chx - S * 0.05, -S * 0.55, S * 0.36, S * 0.1, '#6a5028', S * 0.03);
        box(g, chx + S * 0.04, -S * 0.1, S * 0.18, S * 0.06, '#5a4020');
      } else {
        box(g, chx, -S * 0.35, S * 0.3, S * 0.7, lin(g, 0, 0, '#5a524a', '#5a524a'));
        box(g, chx - S * 0.04, -S * 0.4, S * 0.38, S * 0.1, '#3a3530');
      }
      // hanging sign on an iron bracket
      if (def.sign) {
        g.font = `700 ${Math.round(S * 0.2)}px ${SERIF}`;
        const tw = g.measureText(def.sign).width + S * 0.34, sy2 = eave + S * 0.16, sx2 = dx;
        line(g, '#2a2826', S * 0.035, [[sx2 - tw / 2 + S * 0.1, sy2 - S * 0.12], [sx2 - tw / 2 + S * 0.1, sy2]]); line(g, '#2a2826', S * 0.035, [[sx2 + tw / 2 - S * 0.1, sy2 - S * 0.12], [sx2 + tw / 2 - S * 0.1, sy2]]);
        box(g, sx2 - tw / 2, sy2, tw, S * 0.34, lin(g, sy2, sy2 + S * 0.34, '#4a3624', '#2e2014'), S * 0.04);
        g.strokeStyle = '#8a6a32'; g.lineWidth = Math.max(1, S * 0.02); g.strokeRect(sx2 - tw / 2 + S * 0.03, sy2 + S * 0.03, tw - S * 0.06, S * 0.28);
        g.fillStyle = '#e8d2a0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(def.sign, sx2, sy2 + S * 0.18);
      }
      if (b.id === 'hall' || b.id === 'guild') { box(g, W / 2 - 2, -S * 0.6, 4, S * 0.66, '#3a2a1e'); g.fillStyle = b.id === 'guild' ? '#5a3a6a' : '#7a2a24'; g.beginPath(); g.moveTo(W / 2 + 2, -S * 0.6); g.lineTo(W / 2 + S * 0.45, -S * 0.48); g.lineTo(W / 2 + 2, -S * 0.34); g.fill(); }
    });
  }

  // SVG art (enemies, automaton) rasterised once per size.
  const svgs = {};
  R.svgImage = function (key, svg, px) {
    const k = key + '@' + px;
    if (svgs[k]) return svgs[k].ready ? svgs[k].img : null;
    const im = new Image(), rec = { img: null, ready: false };
    svgs[k] = rec;
    im.onload = () => { const c = document.createElement('canvas'); c.width = px; c.height = px; c.getContext('2d').drawImage(im, 0, 0, px, px); rec.img = outline(c, Math.max(1, Math.min(S * 0.025, px * 0.008))); rec.ready = true; if (rec.cb) rec.cb(rec.img); };
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
    const cols = { dust: ['#8a7a5e', '#6a5e48'], leaf: ['#4a6a3a', '#5e7a48'], sparkle: ['#f2d890', '#ffffff', '#c8a050'], scrap: ['#8a8680', '#8a5a34'], copper: ['#c87a3a', '#8a5a34'], silicon: ['#c8dce4', '#7aa0b0'], arcite: ['#d8b8ff', '#9a6ad8'], circuits: ['#6ab87a'], steam: ['#c8c4bc', '#a8a49c'], ember: ['#ffb050', '#ff7a20'] };
    const c = cols[kind] || cols.sparkle;
    for (let i = 0; i < (n || 8); i++) {
      const a = Math.random() * Math.PI * 2, slow = kind === 'dust' || kind === 'steam', sp = slow ? 0.5 : 1.6;
      parts.push({ x, y, vx: Math.cos(a) * sp * Math.random() * (kind === 'steam' ? 0.4 : 1), vy: (kind === 'steam' ? -0.9 : kind === 'ember' ? -1.2 : slow ? -0.3 : -1.8) * Math.random() - 0.3, life: 1, c: c[i % c.length], kind, r: slow ? 0.06 : 0.04 });
    }
  };

  // ---------- Darkness and light ----------
  let dark = null;
  function lightPass(g, Wd, Hd, lights, sx, sy, amb) {
    if (!dark) dark = document.createElement('canvas');
    if (dark.width !== Wd || dark.height !== Hd) { dark.width = Wd; dark.height = Hd; }
    const d = dark.getContext('2d');
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, Wd, Hd);
    d.fillStyle = `rgba(${amb[0]},${amb[1]},${amb[2]},${amb[3]})`; d.fillRect(0, 0, Wd, Hd);
    d.globalCompositeOperation = 'destination-out';
    for (const [x, y, r, , a, cut] of lights) {
      const X = sx(x), Y = sy(y), rr = r * S * (cut || 1.6), gr = d.createRadialGradient(X, Y, 0, X, Y, rr);
      gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.5 + a * 2.5)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = gr; d.fillRect(X - rr, Y - rr, rr * 2, rr * 2);
    }
    g.drawImage(dark, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, c, a] of lights) {
      const X = sx(x), Y = sy(y), gr = g.createRadialGradient(X, Y, 0, X, Y, r * S);
      gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(X - r * S, Y - r * S, r * S * 2, r * S * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }

  // ---------- Main draw ----------
  let cam = null, last = 0, phase = 0, blinkAt = 0;
  R.draw = function (canvas, state, now) {
    resize(canvas);
    const g = canvas.getContext('2d'), mp = AF.World.map(), w = state.world, Wd = canvas.width, Hd = canvas.height, dungeon = mp.area === 'foundry';
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (w.inside) return drawInterior(canvas, g, state, now, dt);
    const P = tween('pilot', w.px, w.py, now, R.stepDur);
    const Rb = tween('robot', w.rx, w.ry, now, R.stepDur);
    if (P.moving) phase += dt * Math.PI * (1000 / R.stepDur);
    const tx = P.x + 0.5, ty = P.y + 0.5;
    if (!cam) cam = { x: tx, y: ty };
    const kk = 1 - Math.pow(0.0005, dt); cam.x += (tx - cam.x) * kk; cam.y += (ty - cam.y) * kk;
    const ox = Wd / 2 - cam.x * S, oy = Hd / 2 - cam.y * S;
    const sx = (x) => x * S + ox, sy = (y) => y * S + oy;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = dungeon ? '#0e0b0a' : TERR.water.b; g.fillRect(0, 0, Wd, Hd);
    const cx0 = Math.floor((-ox) / (CHK * S)), cy0 = Math.floor((-oy) / (CHK * S));
    const cx1 = Math.floor((Wd - ox) / (CHK * S)), cy1 = Math.floor((Hd - oy) / (CHK * S));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      if (cx < 0 || cy < 0 || cx * CHK >= mp.w || cy * CHK >= mp.h) continue;
      g.drawImage(terrainChunk(cx, cy), Math.round(cx * CHK * S + ox), Math.round(cy * CHK * S + oy));
    }
    const tx0 = Math.floor(-ox / S) - 2, ty0 = Math.floor(-oy / S) - 2, tx1 = Math.ceil((Wd - ox) / S) + 2, ty1 = Math.ceil((Hd - oy) / S) + 4;
    const inView = (x, y) => x >= tx0 && x <= tx1 && y >= ty0 && y <= ty1;
    // water shimmer
    if (!dungeon) {
      g.strokeStyle = 'rgba(180,200,200,.22)'; g.lineWidth = Math.max(1, S * 0.025); g.lineCap = 'round';
      for (let y = Math.max(0, ty0); y <= Math.min(mp.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(mp.w - 1, tx1); x++) {
        if (mp.t[y * mp.w + x] !== 'w' || (mp.bridges && mp.bridges[x + ',' + y])) continue;
        const h = hash(x, y), ph = now / 1100 + h * 6.28, a = (Math.sin(ph) + 1) / 2;
        if (a < 0.35) continue;
        g.globalAlpha = (a - 0.35) * 0.9;
        const X = sx(x) + S * (0.2 + h * 0.4), Y = sy(y) + S * (0.3 + hash(y, x) * 0.4);
        g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + S * 0.12, Y - S * 0.05, X + S * 0.24, Y); g.stroke();
      }
      g.globalAlpha = 1;
    }

    // ----- sprites (sorted by their ground line) -----
    const sprites = [], lights = [];
    const at = (im, x, y, ax, ay) => g.drawImage(im, Math.round(sx(x) - ax), Math.round(sy(y) - ay));
    const flick = (x, y) => 0.85 + Math.sin(now / 90 + x * 7 + y * 3) * 0.08 + Math.sin(now / 37 + x) * 0.05;
    for (let y = Math.max(0, ty0); y <= Math.min(mp.h - 1, ty1); y++) for (let x = Math.max(0, tx0); x <= Math.min(mp.w - 1, tx1); x++) {
      const d = mp.deco[y * mp.w + x]; if (!d) continue;
      const bottom = (im, sink) => sprites.push([y + 0.9, () => at(im, x + 0.5, y + 1, im.width / 2, im.height - S * (sink || 0.1))]);
      switch (d) {
        case 'tree': bottom(treeImg(hash(x, y) > 0.55 ? 1 : 0), 0.12); break;
        case 'lamp': bottom(lampImg()); lights.push([x + 0.5, y - 0.6, 1.6, '255,190,110', 0.22 * flick(x, y)]); break;
        case 'sign': bottom(signImg()); break;
        case 'bounty': bottom(boardImg(), 0.08); lights.push([x + 0.5, y - 0.4, 1.4, '255,200,110', 0.16]); break;
        case 'fence': { const im = fenceImg(); sprites.push([y + 0.8, () => at(im, x, y, 0, 0)]); break; }
        case 'barrel': bottom(barrelImg()); break;
        case 'crate': bottom(crateImg(), 0.08); break;
        case 'pipes': bottom(pipesImg(), 0.08); if (Math.random() < 0.05) R.burst(x + 0.3, y - 0.6, 'steam', 1); break;
        case 'stonewall': { const im = stonewallImg(); sprites.push([y + 0.95, () => at(im, x, y + 1, 0, im.height)]); break; }
        case 'crystal': bottom(crystalImg()); lights.push([x + 0.5, y + 0.2, 2.0, '190,130,255', 0.26 + Math.sin(now / 500 + x) * 0.06]); break;
        case 'chest': { const k = x + ',' + y; bottom(chestImg(!!w.opened[k]), 0.12); if (!w.opened[k]) lights.push([x + 0.5, y + 0.5, 0.9, '240,200,110', 0.14]); break; }
        case 'stairsup': { const im = stairsImg(); sprites.push([y + 0.1, () => at(im, x, y + 1, 0, im.height)]); lights.push([x + 0.5, y + 0.3, 2.2, '255,230,170', 0.25]); break; }
        case 'forgepit': { const im = forgepitImg(); sprites.push([y - 5, () => { at(im, x, y, 0, 0); g.fillStyle = `rgba(255,210,120,${0.15 + Math.sin(now / 200 + x + y) * 0.1})`; g.fillRect(sx(x), sy(y), S, S); }]); lights.push([x + 0.5, y + 0.5, 1.8, '255,120,40', 0.22 * flick(x, y)]); if (Math.random() < 0.04) R.burst(x + 0.5, y + 0.5, 'ember', 1); break; }
        case 'plaque': { const im = plaqueImg(); sprites.push([y + 0.2, () => at(im, x, y, 0, 0)]); break; }
        case 'torch': case 'wallpipe': case 'gearwall': {
          const im = wallPropImg(d); sprites.push([y + 0.3, () => {
            at(im, x, y, 0, 0);
            if (d === 'torch') { const fx = sx(x + 0.5), fy = sy(y + 0.38), f = flick(x, y); g.fillStyle = '#ff9a30'; g.beginPath(); g.ellipse(fx, fy, S * 0.09 * f, S * 0.15 * f, 0, 0, 7); g.fill(); g.fillStyle = '#ffe8a0'; g.beginPath(); g.ellipse(fx, fy + S * 0.03, S * 0.045, S * 0.08, 0, 0, 7); g.fill(); }
          }]);
          if (d === 'torch') lights.push([x + 0.5, y + 0.6, 2.4, '255,150,60', 0.26 * flick(x, y)]);
          break;
        }
        case 'fountain': {
          const im = fountainImg();
          sprites.push([y + 1.9, () => {
            at(im, x + 1, y + 2, im.width / 2, im.height - S * 0.25);
            const ox2 = sx(x + 1), oy2 = sy(y + 2) - S * 1.6 + Math.sin(now / 400) * S * 0.05;
            const gl = g.createRadialGradient(ox2, oy2, 0, ox2, oy2, S * 0.22); gl.addColorStop(0, '#e8ffff'); gl.addColorStop(0.4, '#6ad8e8'); gl.addColorStop(1, 'rgba(60,200,220,0)');
            g.fillStyle = gl; g.beginPath(); g.arc(ox2, oy2, S * 0.22, 0, 7); g.fill();
            for (let i = 0; i < 5; i++) { const a = (now / 1400 + i / 5) % 1, ang = i * 1.25; g.fillStyle = `rgba(140,230,240,${(1 - a) * 0.8})`; g.beginPath(); g.arc(ox2 + Math.cos(ang) * a * S * 0.4, oy2 - a * S * 0.6, S * 0.025, 0, 7); g.fill(); }
          }]);
          lights.push([x + 1, y + 0.6, 2.4, '90,210,230', 0.22]);
          break;
        }
        case 'clock': { const im = clockImg(); sprites.push([y + 1.9, () => at(im, x + 1, y + 2, im.width / 2, im.height - S * 0.2)]); lights.push([x + 1, y - 1.4, 1.4, '240,210,150', 0.14]); if (Math.random() < 0.03) R.burst(x + 1.8, y - 1, 'steam', 1); break; }
        case 'cave': { const im = caveImg(); sprites.push([y + 0.95, () => at(im, x + 1, y + 1, im.width / 2, im.height - S * 0.15)]); lights.push([x + 1, y - 1, 1.4, '190,140,255', 0.16 + Math.sin(now / 600) * 0.05]); break; }
      }
    }
    for (const b of mp.buildings) {
      if (b.x + b.w < tx0 || b.x > tx1 || b.y + b.h < ty0 || b.y - 2 > ty1) continue;
      const im = buildingImg(b);
      sprites.push([b.y + b.h - 0.05, () => {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.roundRect(sx(b.x) + S * 0.2, sy(b.y + b.h) - S * 0.25, b.w * S, S * 0.4, S * 0.2); g.fill();
        const op = (im.width - (b.w * S + S * 0.6)) / 2;
        g.drawImage(im, Math.round(sx(b.x) - S * 0.3 - op), Math.round(sy(b.y) - S * 1.0 - op));
      }]);
      // windows glow at night
      lights.push([b.x + 0.9, b.y + b.h - 0.7, 1.0, '255,180,90', 0.12]); lights.push([b.x + b.w - 0.9, b.y + b.h - 0.7, 1.0, '255,180,90', 0.12]);
      if (Math.random() < 0.035) R.burst(b.x + b.w - 1.0, b.y - 1.3, b.town === 2 ? 'steam' : 'dust', 1);
    }
    for (const [k, n] of Object.entries(mp.nodes)) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y)) continue;
      const ready = (w.ready[k] || 0) <= state.steps, im = nodeImg(n);
      sprites.push([y + 0.8, () => { g.globalAlpha = ready ? 1 : 0.35; at(im, x + 0.5, y + 1, im.width / 2, im.height); g.globalAlpha = 1; }]);
      if (ready && n === 'arcite') lights.push([x + 0.5, y + 0.4, 1.3, '190,130,255', 0.2 + Math.sin(now / 400 + x) * 0.06]);
      if (ready && n === 'silicon') lights.push([x + 0.5, y + 0.5, 0.9, '170,220,240', 0.12]);
    }
    for (const k of mp.ruins) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y)) continue;
      const im = ruinImg(), open = !!w.opened[k];
      sprites.push([y + 0.85, () => {
        at(im, x + 0.5, y + 1, im.width / 2, im.height - S * 0.15);
        if (!open) { const gx = sx(x + 0.5), gy = sy(y + 0.4), p = 0.6 + Math.sin(now / 350) * 0.4; g.fillStyle = `rgba(120,230,240,${p})`; g.beginPath(); g.arc(gx, gy, S * 0.06, 0, 7); g.fill(); }
      }]);
      if (!open) lights.push([x + 0.5, y + 0.4, 1.3, '100,220,235', 0.2]);
    }
    // disturbances (step in to start a fight)
    if (mp.hotspots) for (const [k, kind] of Object.entries(mp.hotspots)) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y) || !AF.World.hotReady(state, k)) continue;
      const ph = now / 260 + x * 1.7 + y;
      sprites.push([y + 0.2, () => {
        const cx = sx(x + 0.5), cy = sy(y + 0.72), pulse = 0.5 + Math.sin(ph) * 0.5;
        g.save();
        const glow = g.createRadialGradient(cx, cy, 0, cx, cy, S * 0.5); glow.addColorStop(0, `rgba(255,190,90,${0.28 + pulse * 0.2})`); glow.addColorStop(1, 'rgba(255,190,90,0)');
        g.fillStyle = glow; g.beginPath(); g.ellipse(cx, cy, S * 0.5, S * 0.2, 0, 0, 7); g.fill();
        g.strokeStyle = `rgba(255,180,80,${0.45 + pulse * 0.45})`; g.lineWidth = Math.max(2, S * 0.05);
        g.beginPath(); g.ellipse(cx, cy, S * (0.36 + pulse * 0.08), S * (0.13 + pulse * 0.03), 0, 0, 7); g.stroke();
        g.setLineDash([S * 0.06, S * 0.06]); g.lineDashOffset = -now / 40; g.strokeStyle = 'rgba(255,230,160,.7)'; g.lineWidth = Math.max(1, S * 0.02);
        g.beginPath(); g.ellipse(cx, cy, S * 0.46, S * 0.17, 0, 0, 7); g.stroke(); g.setLineDash([]);
        for (let i = 0; i < 4; i++) { const tt = ((now / 1400 + i / 4 + x * 0.13) % 1), mx = cx + Math.sin(i * 2.1 + x) * S * 0.25, my = cy - tt * S * 0.7;
          g.fillStyle = `rgba(255,${200 + i * 10},120,${(1 - tt) * 0.9})`; g.beginPath(); g.arc(mx, my, S * 0.025 * (1 - tt * 0.5), 0, 7); g.fill(); }
        if (kind === 'rustle') {
          for (let i = -2; i <= 2; i++) {
            const bx = cx + i * S * 0.11, sw = Math.sin(now / 90 + i * 1.3 + x) * S * 0.07;
            g.strokeStyle = i % 2 ? '#4e6a34' : '#6a8a44'; g.lineWidth = Math.max(1.5, S * 0.05); g.lineCap = 'round';
            g.beginPath(); g.moveTo(bx, cy); g.quadraticCurveTo(bx + sw * 0.4, cy - S * 0.2, bx + sw, cy - S * (0.34 + (i & 1) * 0.08)); g.stroke();
          }
          if (Math.random() < 0.04) R.burst(x + 0.5, y + 0.5, 'leaf', 1);
        } else if (kind === 'dust') {
          for (let i = 0; i < 6; i++) { const a = now / 400 + i * 1.05; g.fillStyle = `rgba(200,180,140,${0.35 + 0.2 * Math.sin(a * 2)})`; g.beginPath(); g.ellipse(cx + Math.cos(a) * S * 0.24, cy - S * 0.12 + Math.sin(a) * S * 0.07, S * 0.07, S * 0.05, 0, 0, 7); g.fill(); }
        } else {
          g.fillStyle = '#6e6456'; g.beginPath(); g.ellipse(cx, cy - S * 0.06, S * 0.26, S * 0.12, 0, 0, 7); g.fill();
          if (Math.sin(now / 70 + x * 3) > 0.6) { g.strokeStyle = '#9ae8ff'; g.lineWidth = Math.max(1, S * 0.025); g.beginPath(); const zx = cx + Math.sin(now / 50) * S * 0.1; g.moveTo(zx, cy - S * 0.1); g.lineTo(zx + S * 0.06, cy - S * 0.22); g.lineTo(zx - S * 0.02, cy - S * 0.26); g.lineTo(zx + S * 0.05, cy - S * 0.38); g.stroke(); }
        }
        g.restore();
      }]);
      lights.push([x + 0.5, y + 0.5, 1.5, kind === 'sparks' ? '140,220,255' : '255,170,80', 0.2 + Math.sin(ph) * 0.06]);
    }
    // enemies
    for (const e of w.enemies) {
      const p = tween('e' + e.id, e.x, e.y, now, 260);
      if (!inView(p.x, p.y)) continue;
      const def = AF.ENEMIES[e.type], size = Math.round(S * (e.boss ? 2 : 0.95)), im = R.svgImage('e' + e.type, AF.enemySVG(e.type), size);
      sprites.push([p.y + 0.7, () => {
        const bx = sx(p.x + 0.5), by = sy(p.y + 1) - S * 0.08, hop = Math.abs(Math.sin(now / 260 + e.id)) * S * 0.05;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx, by, size * 0.32, size * 0.09, 0, 0, 7); g.fill();
        if (im) g.drawImage(im, Math.round(bx - size / 2), Math.round(by - size * 0.95 - hop));
        const tc = ['#7aa860', '#c8a840', '#c87a3a', '#c83a3a'][def.tier - 1];
        g.fillStyle = tc; g.beginPath(); const ty2 = by - size * 1.02 - hop; g.moveTo(bx, ty2 - S * 0.09); g.lineTo(bx + S * 0.06, ty2); g.lineTo(bx, ty2 + S * 0.07); g.lineTo(bx - S * 0.06, ty2); g.closePath(); g.fill();
        g.strokeStyle = '#120e0b'; g.lineWidth = Math.max(1, S * 0.015); g.stroke();
        if (e.bounty) {
          const my = ty2 - S * 0.32 - Math.abs(Math.sin(now / 300)) * S * 0.08;
          g.fillStyle = '#ffd24a'; g.strokeStyle = '#2a1806'; g.lineWidth = Math.max(1.5, S * 0.03);
          g.beginPath(); g.arc(bx, my, S * 0.16, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#2a1806'; g.font = `bold ${Math.round(S * 0.24)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', bx, my + S * 0.01); g.textBaseline = 'alphabetic';
        }
      }]);
      lights.push([p.x + 0.5, p.y + 0.4, e.boss ? 3 : e.bounty ? 1.6 : 0.7, e.boss ? '255,70,60' : e.bounty ? '255,210,90' : '255,120,80', e.boss ? 0.25 : e.bounty ? 0.22 : 0.06]);
    }
    // townsfolk
    if (blinkAt < now) blinkAt = now + 2500 + Math.random() * 2500;
    const blink = blinkAt - now < 130;
    if (!dungeon) for (const n of AF.World.npcList()) {
      const p = tween('n' + n.id, n.x, n.y, now, 320);
      if (!inView(p.x, p.y)) continue;
      sprites.push([p.y + 0.75, () => AF.drawPilotAt(g, sx(p.x + 0.5), sy(p.y + 1) - S * 0.06, S * 1.3, AF.NPCS[n.id].look, n.dir, now / 320, { moving: p.moving, t: now + n.hx * 300, blink: blink && n.hx % 2 === 0 })]);
    }
    // automaton
    if (state.flags.robot) {
      const size = Math.round(S * 1.0);
      const im = R.svgImage('rob' + AF.botKey(state), AF.botSVG(state), size);
      if (w.rx !== w.px) R.robotFace = w.rx < w.px ? 1 : -1;
      if (Rb.moving && Math.random() < 0.25) R.burst(Rb.x + 0.5, Rb.y + 0.95, 'dust', 1);
      sprites.push([Rb.y + 0.72, () => {
        const bx = sx(Rb.x + 0.5), by = sy(Rb.y + 1) - S * 0.06, hov = Math.sin(now / 300) * S * 0.03 + (Rb.moving ? Math.abs(Math.sin(now / 90)) * S * 0.03 : 0);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx, by, S * 0.3, S * 0.08, 0, 0, 7); g.fill();
        if (im) { g.save(); g.translate(bx, by - size * 0.92 - hov); g.scale(R.robotFace || 1, 1); g.drawImage(im, -size / 2, 0); g.restore(); }
      }]);
      lights.push([Rb.x + 0.5, Rb.y + 0.45, dungeon ? 2.6 : 1.4, hexRGB(AF.coreColor(state.look)), dungeon ? 0.2 : 0.14, dungeon ? 1.5 : 1.4]);
    }
    // pilot (+ thicket in front of the legs)
    const inGrass = AF.World.terrainAt(null, w.px, w.py) === 'forest';
    if (P.moving && Math.random() < (inGrass ? 0.5 : 0.18)) R.burst(P.x + 0.5, P.y + 0.95, inGrass ? 'leaf' : 'dust', 1);
    sprites.push([P.y + 0.76, () => {
      AF.drawPilotAt(g, sx(P.x + 0.5), sy(P.y + 1) - S * 0.06, S * 1.35, AF.appearance(state), w.dir, phase, { moving: P.moving, t: now, blink });
      if (inGrass && !P.moving) {
        const bx = sx(P.x + 0.5), by = sy(P.y + 1);
        for (let i = -2; i <= 2; i++) {
          g.fillStyle = lin(g, by - S * 0.35, by, '#5e7a48', '#1e3018');
          const x = bx + i * S * 0.12; g.beginPath(); g.moveTo(x - S * 0.07, by); g.quadraticCurveTo(x - S * 0.02, by - S * 0.2, x, by - S * 0.36 + Math.abs(i) * S * 0.04); g.quadraticCurveTo(x + S * 0.02, by - S * 0.2, x + S * 0.07, by); g.fill();
        }
      }
    }]);
    // the pilot carries a little lantern-light of their own
    lights.push([P.x + 0.5, P.y + 0.3, dungeon ? 3.0 : 2.2, '255,220,170', dungeon ? 0.1 : 0.05, dungeon ? 1.45 : 1.5]);
    sprites.sort((a, b) => a[0] - b[0]).forEach((s) => s[1]());

    // ----- particles -----
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], slow = p.kind === 'dust' || p.kind === 'steam';
      p.life -= dt * (p.kind === 'steam' ? 0.7 : slow ? 1.6 : 1.1); if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'steam' ? -0.1 : slow ? 0.2 : p.kind === 'ember' ? 0.4 : 3) * dt;
      g.globalAlpha = Math.min(1, p.life * (p.kind === 'steam' ? 0.6 : 1.5)); g.fillStyle = p.c;
      g.beginPath(); g.arc(sx(p.x), sy(p.y), S * p.r * (slow ? 2.2 - p.life : 1), 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // ----- dusk / dungeon darkness, cut open by lights -----
    lightPass(g, Wd, Hd, lights, sx, sy, dungeon ? [6, 4, 4, 0.9] : [16, 14, 30, 0.34]);
    // vignette and a touch of fog at the edges
    const vg = g.createRadialGradient(Wd / 2, Hd / 2, Math.min(Wd, Hd) * 0.3, Wd / 2, Hd / 2, Math.max(Wd, Hd) * 0.72);
    vg.addColorStop(0, 'rgba(8,6,10,0)'); vg.addColorStop(1, dungeon ? 'rgba(4,2,2,.7)' : 'rgba(10,8,16,.5)');
    g.fillStyle = vg; g.fillRect(0, 0, Wd, Hd);
    drawPrompt(g, AF.World.facing(state), sx, sy, P.moving, now);
  };

  // ---------- Interiors ----------
  function furniture(g, it, room) {
    const X = it.x * S, Y = it.y * S, W = (it.w || 1) * S, H = (it.h || 1) * S, k = it.k;
    const bx = (x, y, w, h, c, r) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r == null ? S * 0.05 : r); g.fill(); g.strokeStyle = OUT; g.lineWidth = Math.max(1, S * 0.025); g.stroke(); };
    const wood = '#5a4028', woodD = '#3a2818', woodL = '#7a5a3a', iron = '#3a3836', brass = '#a07a3a';
    switch (k) {
      case 'rug': bx(X, Y + S * 0.1, W, S * 0.8, '#5a2a24', S * 0.1); bx(X + S * 0.12, Y + S * 0.22, W - S * 0.24, S * 0.56, '#8a6a32', S * 0.06); bx(X + S * 0.22, Y + S * 0.32, W - S * 0.44, S * 0.36, '#4a2420', S * 0.04); break;
      case 'bed': bx(X + S * 0.05, Y - S * 0.4, W - S * 0.1, S * 0.6, woodD); bx(X + S * 0.05, Y, W - S * 0.1, H - S * 0.1, '#c8bca0'); bx(X + S * 0.05, Y + S * 0.55, W - S * 0.1, H - S * 0.65, '#5a3a4a'); bx(X + S * 0.2, Y + S * 0.08, S * 0.6, S * 0.35, '#e0d4b8', S * 0.12); break;
      case 'wardrobe': bx(X + S * 0.05, Y - S * 0.8, S * 0.9, S * 1.7, wood); bx(X + S * 0.12, Y - S * 0.7, S * 0.36, S * 1.5, woodL); bx(X + S * 0.52, Y - S * 0.7, S * 0.36, S * 1.5, woodL); bx(X + S * 0.42, Y - S * 0.1, S * 0.05, S * 0.15, brass); bx(X + S * 0.53, Y - S * 0.1, S * 0.05, S * 0.15, brass); break;
      case 'chest': bx(X + S * 0.1, Y + S * 0.25, S * 0.8, S * 0.6, wood); bx(X + S * 0.1, Y + S * 0.15, S * 0.8, S * 0.3, woodL, S * 0.12); bx(X + S * 0.44, Y + S * 0.4, S * 0.12, S * 0.14, brass); break;
      case 'table': case 'desk': case 'dtable': bx(X + S * 0.08, Y + S * 0.15, W - S * 0.16, S * 0.55, woodL); bx(X + S * 0.15, Y + S * 0.65, S * 0.1, S * 0.28, woodD, 2); bx(X + W - S * 0.25, Y + S * 0.65, S * 0.1, S * 0.28, woodD, 2);
        if (k === 'dtable') { bx(X + S * 0.25, Y + S * 0.28, S * 0.22, S * 0.22, '#c8c0a8', S * 0.11); bx(X + S * 0.55, Y + S * 0.24, S * 0.12, S * 0.22, '#7a5a3a', 2); }
        if (k === 'desk') { bx(X + S * 0.2, Y + S * 0.25, S * 0.32, S * 0.22, '#d8ccaa', 2); g.fillStyle = '#ffcf7a'; g.beginPath(); g.arc(X + W - S * 0.35, Y + S * 0.28, S * 0.07, 0, 7); g.fill(); } break;
      case 'plant': bx(X + S * 0.3, Y + S * 0.55, S * 0.4, S * 0.38, '#6a3a24', S * 0.04); g.fillStyle = '#3a5030'; [[0.5, 0.35, 0.25], [0.32, 0.45, 0.18], [0.68, 0.45, 0.18], [0.5, 0.15, 0.17]].forEach(([a, b, r]) => { g.beginPath(); g.arc(X + a * S, Y + b * S, r * S, 0, 7); g.fill(); }); break;
      case 'anvil': bx(X + S * 0.3, Y + S * 0.5, S * 0.4, S * 0.4, '#2a2826', 2); bx(X + S * 0.08, Y + S * 0.25, S * 0.84, S * 0.3, '#4a4846', S * 0.08); bx(X + S * 0.1, Y + S * 0.25, S * 0.6, S * 0.07, '#7a7874', 2); break;
      case 'furnace': bx(X + S * 0.05, Y - S * 0.7, S * 0.9, S * 1.6, '#5a4a40'); bx(X + S * 0.2, Y + S * 0.1, S * 0.6, S * 0.5, '#140a06', S * 0.25); bx(X + S * 0.27, Y + S * 0.25, S * 0.46, S * 0.32, '#ff8a20', S * 0.2); break;
      case 'barrel': bx(X + S * 0.18, Y + S * 0.1, S * 0.64, S * 0.82, wood, S * 0.18); bx(X + S * 0.18, Y + S * 0.3, S * 0.64, S * 0.07, iron, 1); bx(X + S * 0.18, Y + S * 0.65, S * 0.64, S * 0.07, iron, 1); break;
      case 'shelf': case 'bookshelf': bx(X + S * 0.05, Y - S * 0.8, S * 0.9, S * 1.7, woodD); for (let r = 0; r < 3; r++) { bx(X + S * 0.12, Y - S * 0.7 + r * S * 0.52, S * 0.76, S * 0.4, '#2a1e14', 2);
          for (let i = 0; i < 4; i++) bx(X + S * (0.15 + i * 0.18), Y - S * (k === 'shelf' ? 0.6 : 0.66) + r * S * 0.52, S * 0.13, S * (k === 'shelf' ? 0.24 : 0.32), ['#6a2a24', '#2a3a5a', '#8a6a32', '#3a4a2a'][(i + r) % 4], 2); } break;
      case 'display': bx(X + S * 0.08, Y + S * 0.2, S * 0.84, S * 0.6, '#3a2a1e'); ['#7a2a24', '#2a4a6a', '#3a5a30'].forEach((c, i) => bx(X + S * (0.16 + i * 0.24), Y + S * 0.28, S * 0.18, S * 0.26, c, 3)); break;
      case 'crate': bx(X + S * 0.1, Y + S * 0.1, S * 0.8, S * 0.8, woodL); g.strokeStyle = woodD; g.lineWidth = S * 0.05; g.beginPath(); g.moveTo(X + S * 0.15, Y + S * 0.15); g.lineTo(X + S * 0.85, Y + S * 0.85); g.stroke(); break;
      case 'heap': g.fillStyle = '#4a4640'; g.beginPath(); g.ellipse(X + S * 0.5, Y + S * 0.6, S * 0.45, S * 0.32, 0, 0, 7); g.fill(); bx(X + S * 0.25, Y + S * 0.3, S * 0.3, S * 0.25, '#6a645a'); bx(X + S * 0.55, Y + S * 0.4, S * 0.2, S * 0.2, '#8a5a34'); break;
      case 'lift': bx(X + S * 0.05, Y + S * 0.3, W - S * 0.1, S * 0.5, '#8a6a32'); for (let i = 0; i < 5; i++) bx(X + S * 0.1 + i * W / 5, Y + S * 0.35, S * 0.18, S * 0.4, '#1e1c1a', 2); break;
      case 'toolboard': bx(X + S * 0.05, Y - S * 0.8, S * 0.9, S * 1.3, '#4a3624'); ['#7a7874', '#5a4028', '#a07a3a'].forEach((c, i) => bx(X + S * (0.18 + i * 0.24), Y - S * 0.6, S * 0.12, S * 0.6, c, 2)); break;
      case 'tires': [0, 1].forEach((i) => { g.fillStyle = '#1e1c1a'; g.beginPath(); g.ellipse(X + S * 0.5, Y + S * (0.75 - i * 0.3), S * 0.38, S * 0.18, 0, 0, 7); g.fill(); g.fillStyle = brass; g.beginPath(); g.ellipse(X + S * 0.5, Y + S * (0.75 - i * 0.3), S * 0.15, S * 0.07, 0, 0, 7); g.fill(); }); break;
      case 'vault': bx(X - S * 0.1, Y - S * 0.85, S * 1.1, S * 1.8, '#4a4846'); g.fillStyle = '#6a6864'; g.beginPath(); g.arc(X + S * 0.45, Y - S * 0.05, S * 0.42, 0, 7); g.fill(); g.strokeStyle = brass; g.lineWidth = S * 0.06; g.beginPath(); for (let a = 0; a < 6; a++) { g.moveTo(X + S * 0.45, Y - S * 0.05); g.lineTo(X + S * 0.45 + Math.cos(a) * S * 0.3, Y - S * 0.05 + Math.sin(a) * S * 0.3); } g.stroke(); break;
      case 'bench': bx(X + S * 0.05, Y + S * 0.3, W - S * 0.1, S * 0.35, woodL); bx(X + S * 0.05, Y + S * 0.05, W - S * 0.1, S * 0.2, wood); break;
      case 'jukebox': bx(X + S * 0.1, Y - S * 0.6, S * 0.8, S * 1.5, '#5a3a24', S * 0.3); bx(X + S * 0.22, Y - S * 0.35, S * 0.56, S * 0.5, '#c8944a', S * 0.22); [0.3, 0.5, 0.7].forEach((k2) => bx(X + S * k2 - S * 0.04, Y + S * 0.3, S * 0.08, S * 0.4, brass, 2)); break;
      case 'fridge': bx(X + S * 0.1, Y - S * 0.7, S * 0.8, S * 1.6, '#4a4038'); bx(X + S * 0.2, Y - S * 0.5, S * 0.6, S * 0.5, '#2a2018'); bx(X + S * 0.2, Y + S * 0.15, S * 0.6, S * 0.5, '#2a2018'); break;
      case 'rack': bx(X + S * 0.1, Y + S * 0.05, S * 0.8, S * 0.08, iron, 2); ['#6a2a24', '#5a3a5a', '#2a3a5a', '#5a4a2a'].forEach((c, i) => bx(X + S * (0.12 + i * 0.19), Y + S * 0.12, S * 0.16, S * 0.7, c, S * 0.04)); break;
      case 'mirror': bx(X + S * 0.1, Y - S * 0.8, S * 0.8, S * 1.6, brass, S * 0.4); bx(X + S * 0.2, Y - S * 0.7, S * 0.6, S * 1.4, '#7a8a90', S * 0.3); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(X + S * 0.3, Y - S * 0.5, S * 0.08, S * 0.6); break;
      case 'banner': bx(X + S * 0.2, Y - S * 0.9, S * 0.6, S * 1.3, room.trim); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(X + S * 0.5, Y - S * 0.45, S * 0.14, 0, 7); g.fill(); break;
      case 'hearth': bx(X + S * 0.02, Y - S * 0.8, W - S * 0.04, S * 1.7, '#4a443e'); bx(X + S * 0.25, Y - S * 0.1, W - S * 0.5, S * 0.9, '#140a06', [S * 0.4, S * 0.4, 0, 0]); g.fillStyle = '#ff8a20'; g.beginPath(); g.ellipse(X + W / 2, Y + S * 0.65, W * 0.25, S * 0.18, 0, 0, 7); g.fill(); g.fillStyle = '#ffd070'; g.beginPath(); g.ellipse(X + W / 2, Y + S * 0.6, W * 0.12, S * 0.12, 0, 0, 7); g.fill(); break;
      case 'orb': bx(X + S * 0.3, Y + S * 0.45, S * 0.4, S * 0.45, '#3a2a1e', S * 0.05); { const gr = g.createRadialGradient(X + S * 0.45, Y + S * 0.2, 1, X + S * 0.5, Y + S * 0.3, S * 0.25); gr.addColorStop(0, '#f0e0ff'); gr.addColorStop(1, '#5a2a9a'); g.fillStyle = gr; g.beginPath(); g.arc(X + S * 0.5, Y + S * 0.3, S * 0.22, 0, 7); g.fill(); } break;
      case 'map': bx(X + S * 0.05, Y - S * 0.75, W - S * 0.1, S * 1.1, '#c8b48a'); g.strokeStyle = '#6a4a2a'; g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(X + S * 0.3, Y - S * 0.5); g.quadraticCurveTo(X + W / 2, Y - S * 0.1, X + W - S * 0.3, Y - S * 0.4); g.stroke(); g.fillStyle = '#7a2a24'; g.beginPath(); g.arc(X + W - S * 0.3, Y - S * 0.4, S * 0.06, 0, 7); g.fill(); break;
      case 'pipes': [0.2, 0.55].forEach((k2) => bx(X + S * k2, Y - S * 0.8, S * 0.22, S * 1.7, brass, S * 0.1)); bx(X + S * 0.1, Y - S * 0.1, S * 0.8, S * 0.14, '#6a5028', 2); break;
    }
  }
  function roomImg(id) {
    const room = AF.INTERIORS[id], RW = AF.Interiors.W, RH = AF.Interiors.H;
    return img('room' + id, RW * S, (RH + 0.3) * S, (g) => {
      const fl = { wood: ['#5a4028', '#4e3822'], planks: ['#5e4a34', '#54422e'], stone: ['#4a4540', '#423d38'], carpet: [AF.mute ? AF.mute(room.carpet || '#7a3a4a', 0.3) : '#5a2a34', sh(AF.mute ? AF.mute(room.carpet || '#7a3a4a', 0.3) : '#5a2a34', -14)], concrete: ['#4a4846', '#42403e'], marble: ['#6a645c', '#5a554e'], checker: ['#6a645c', '#3a3430'] }[room.floor] || ['#5a4028', '#4e3822'];
      for (let y = 2; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
        g.fillStyle = room.floor === 'checker' || room.floor === 'marble' || room.floor === 'stone' ? fl[(x + y) % 2] : fl[(y % 2)];
        g.fillRect(x * S, y * S, S, S);
        g.fillStyle = 'rgba(0,0,0,.18)';
        if (room.floor === 'wood' || room.floor === 'planks') { g.fillRect(x * S + ((y % 2) ? S * 0.5 : 0), y * S, 2, S); g.fillRect(x * S, y * S + S - 2, S, 2); }
        else { g.fillRect(x * S, y * S, S, 1.5); g.fillRect(x * S, y * S, 1.5, S); }
      }
      g.fillStyle = fl[0]; g.fillRect(AF.Interiors.DOOR[0] * S, (RH - 1) * S, S, S);
      // back wall: plaster over dark timber, or stone for Brasshaven
      const wall = AF.mute ? AF.mute(room.wall, 0.5) : room.wall, trim = AF.mute ? AF.mute(room.trim, 0.4) : room.trim;
      g.fillStyle = sh(wall, -30); g.fillRect(0, 0, RW * S, 2 * S);
      g.fillStyle = '#2a1e14'; for (let x = 0; x < RW * S; x += S * 1.25) g.fillRect(x, 0, S * 0.14, S * 1.4);
      g.fillRect(0, S * 0.12, RW * S, S * 0.1);
      g.fillStyle = trim; g.fillRect(0, S * 1.4, RW * S, S * 0.6); g.fillStyle = 'rgba(255,240,200,.1)'; g.fillRect(0, S * 1.4, RW * S, S * 0.06);
      for (const wx of [3.2, 6.8]) {
        g.fillStyle = '#2a1e14'; g.beginPath(); g.roundRect(wx * S - S * 0.05, S * 0.28, S * 1.0, S * 0.95, [S * 0.5, S * 0.5, 0, 0]); g.fill();
        const lg = g.createLinearGradient(0, S * 0.35, 0, S * 1.15); lg.addColorStop(0, '#3a4a6a'); lg.addColorStop(1, '#1a2034');
        g.fillStyle = lg; g.beginPath(); g.roundRect(wx * S + S * 0.04, S * 0.36, S * 0.82, S * 0.8, [S * 0.41, S * 0.41, 0, 0]); g.fill();
        g.fillStyle = '#2a1e14'; g.fillRect(wx * S + S * 0.43, S * 0.36, S * 0.04, S * 0.8); g.fillRect(wx * S + S * 0.04, S * 0.75, S * 0.82, S * 0.04);
        g.fillStyle = 'rgba(230,230,255,.6)'; g.beginPath(); g.arc(wx * S + S * 0.65, S * 0.55, S * 0.06, 0, 7); g.fill();
      }
      g.fillStyle = '#1e1812'; g.fillRect(0, 0, S * 0.55, RH * S); g.fillRect(RW * S - S * 0.55, 0, S * 0.55, RH * S);
      g.fillRect(0, (RH - 1) * S + S * 0.35, AF.Interiors.DOOR[0] * S, S * 0.95); g.fillRect((AF.Interiors.DOOR[0] + 1) * S, (RH - 1) * S + S * 0.35, (RW - AF.Interiors.DOOR[0] - 1) * S, S * 0.95);
      g.fillStyle = '#5a2a24'; g.beginPath(); g.roundRect(AF.Interiors.DOOR[0] * S + S * 0.1, (RH - 1) * S + S * 0.2, S * 0.8, S * 0.55, S * 0.06); g.fill();
      g.fillStyle = '#a07a3a'; g.fillRect(AF.Interiors.DOOR[0] * S + S * 0.2, (RH - 1) * S + S * 0.42, S * 0.6, S * 0.06);
      room.items.filter((it) => it.flat).forEach((it) => furniture(g, it, room));
      if (room.counter !== false && room.keeper) {
        g.strokeStyle = OUT; g.lineWidth = Math.max(1, S * 0.03);
        g.fillStyle = '#3a2818'; g.beginPath(); g.roundRect(3 * S, 3 * S + S * 0.1, 5 * S, S * 0.85, S * 0.05); g.fill(); g.stroke();
        g.fillStyle = '#6a4a2e'; g.beginPath(); g.roundRect(3 * S - S * 0.05, 3 * S, 5 * S + S * 0.1, S * 0.3, S * 0.05); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,230,180,.12)'; g.fillRect(3 * S + S * 0.1, 3 * S + S * 0.05, 5 * S - S * 0.2, S * 0.05);
      }
      room.items.filter((it) => !it.flat).forEach((it) => furniture(g, it, room));
    }, true);
  }
  function drawInterior(canvas, g, state, now, dt) {
    const w = state.world, id = w.inside, room = AF.INTERIORS[id], RW = AF.Interiors.W, RH = AF.Interiors.H, Wd = canvas.width, Hd = canvas.height;
    const P = tween('pilot', w.px, w.py, now, R.stepDur), Rb = tween('robot', w.rx, w.ry, now, R.stepDur);
    if (P.moving) phase += dt * Math.PI * (1000 / R.stepDur);
    const fitsX = RW * S <= Wd, fitsY = (RH + 0.3) * S <= Hd;
    const tx = fitsX ? RW / 2 : P.x + 0.5, ty = fitsY ? RH / 2 : P.y + 0.5;
    if (!cam) cam = { x: tx, y: ty };
    const kk = 1 - Math.pow(0.0005, dt); cam.x += (tx - cam.x) * kk; cam.y += (ty - cam.y) * kk;
    const ox = Wd / 2 - cam.x * S, oy = Hd / 2 - cam.y * S, sx = (x) => x * S + ox, sy = (y) => y * S + oy;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#0c0a08'; g.fillRect(0, 0, Wd, Hd);
    g.drawImage(roomImg(id), Math.round(ox), Math.round(oy));
    const sprites = [];
    if (blinkAt < now) blinkAt = now + 2500 + Math.random() * 2500;
    const blink = blinkAt - now < 130;
    const kp = AF.Interiors.keeperPos(id);
    if (kp) sprites.push([kp[1] + 0.7, () => AF.drawPilotAt(g, sx(kp[0] + 0.5), sy(kp[1] + 1) - S * 0.08, S * 1.35, room.keeper.look, 'down', 0, { t: now + 900, blink })]);
    if (state.flags.robot) {
      const size = Math.round(S), im = R.svgImage('rob' + AF.botKey(state), AF.botSVG(state), size);
      if (w.rx !== w.px) R.robotFace = w.rx < w.px ? 1 : -1;
      sprites.push([Rb.y + 0.72, () => { const bx2 = sx(Rb.x + 0.5), by = sy(Rb.y + 1) - S * 0.06, hov = Math.sin(now / 300) * S * 0.03;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(bx2, by, S * 0.3, S * 0.08, 0, 0, 7); g.fill();
        if (im) { g.save(); g.translate(bx2, by - im.height * 0.92 - hov); g.scale(R.robotFace || 1, 1); g.drawImage(im, -im.width / 2, 0); g.restore(); } }]);
    }
    sprites.push([P.y + 0.76, () => AF.drawPilotAt(g, sx(P.x + 0.5), sy(P.y + 1) - S * 0.06, S * 1.35, AF.appearance(state), w.dir, phase, { moving: P.moving, t: now, blink })]);
    sprites.sort((a, b) => a[0] - b[0]).forEach((s2) => s2[1]());
    // candle-lit room
    const lights = [[RW / 2, 3.2, RW * 0.55, '255,190,110', 0.12, 1.5], [3.7, 0.9, 1.3, '120,140,200', 0.06], [7.3, 0.9, 1.3, '120,140,200', 0.06]];
    room.items.forEach((it) => { if (it.k === 'furnace' || it.k === 'hearth') lights.push([it.x + (it.w || 1) / 2, it.y + 0.5, 2.6, '255,130,50', 0.22]); if (it.k === 'orb') lights.push([it.x + 0.5, it.y + 0.3, 1.8, '190,130,255', 0.2]); });
    lightPass(g, Wd, Hd, lights, sx, sy, [12, 8, 6, 0.42]);
    drawPrompt(g, AF.World.facing(state), sx, sy, P.moving, now);
  }
  function drawPrompt(g, f, sx, sy, moving, now) {
    if (!f || moving || AF.Dialog.open) return;
    const label = f.label, key = AF.input && AF.input.touch ? 'A' : 'E';
    const X = sx(f.x + 0.5), Y = sy(f.y) - S * (f.tall ? 1.25 : 0.35) + Math.sin(now / 250) * S * 0.04;
    g.font = `700 ${Math.round(S * 0.22)}px ${SERIF}`;
    const tw2 = g.measureText(label).width, bw = tw2 + S * 0.62, bh = S * 0.42;
    g.fillStyle = 'rgba(24,18,14,.92)'; g.strokeStyle = '#a07a3a'; g.lineWidth = Math.max(1, S * 0.03);
    g.beginPath(); g.roundRect(X - bw / 2, Y - bh, bw, bh, S * 0.08); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(X - S * 0.08, Y); g.lineTo(X, Y + S * 0.09); g.lineTo(X + S * 0.08, Y); g.fill();
    g.fillStyle = '#c8944a'; g.beginPath(); g.arc(X - bw / 2 + bh / 2, Y - bh / 2, bh * 0.32, 0, 7); g.fill();
    g.fillStyle = '#1a120c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(key, X - bw / 2 + bh / 2, Y - bh / 2 + 1);
    g.fillStyle = '#ead8b0'; g.textAlign = 'left'; g.fillText(label, X - bw / 2 + bh * 0.95, Y - bh / 2 + 1);
  }

  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; }

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
        if (kind === 'robot') { R.whenImage('R' + AF.botKey(state), AF.botSVG(state), size, put); }
        if (kind === 'pilot') { cv.width = size; cv.height = Math.round(size / 0.7); const g = cv.getContext('2d'); AF.drawPilotAt(g, size / 2, cv.height * 0.99, cv.height * 0.95, AF.appearance(state), arg || 'down', 0, {}); }
      });
    },
  };
})();
