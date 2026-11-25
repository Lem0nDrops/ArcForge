/* ArcForge — pixel art engine.
   Everything is painted at native resolution (16×16 tiles) with code, outlined,
   and scaled up with crisp nearest-neighbour pixels for a handheld-era look.
   All art here is original. Swap any function for PNG sprites later if you like. */
(function () {
  const AF = (window.AF = window.AF || {});
  const P = (AF.Pixel = {});
  const TS = (P.TS = 16);

  P.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = (P.R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); });
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  P.shade = function (c, amt) {
    const [r, g, b] = hex(c), f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  const rnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // Adds a 1px outline around every solid pixel. Leave a 1px empty margin when painting.
  P.outline = function (c, col) {
    const g = c.getContext('2d'), W = c.width, H = c.height, d = g.getImageData(0, 0, W, H), a = d.data;
    const src = new Uint8ClampedArray(a), [r, gg, b] = hex(col || '#282030');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (src[i + 3] > 127) { a[i + 3] = 255; continue; }
      const solid = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && src[(yy * W + xx) * 4 + 3] > 127;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) { a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255; }
      else a[i + 3] = 0;
    }
    g.putImageData(d, 0, 0);
    return c;
  };
  P.flip = function (c) { const o = P.canvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; };

  // ---------- Tiny 3×5 pixel font ----------
  const GL = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111', "'": '010010000000000', '&': '010101010101011', ' ': '000000000000000',
  };
  P.textWidth = (s) => s.length * 4 - 1;
  P.text = function (g, s, x, y, col) {
    g.fillStyle = col;
    [...s.toUpperCase()].forEach((ch, i) => {
      const gl = GL[ch] || GL[' '];
      for (let k = 0; k < 15; k++) if (gl[k] === '1') g.fillRect(x + i * 4 + (k % 3), y + Math.floor(k / 3), 1, 1);
    });
  };

  // ---------- Palette ----------
  const C = (P.COL = {
    g1: '#88d068', g2: '#68b450', g3: '#b0e490', l1: '#98dc78', l2: '#78c058',
    p1: '#ecdcaa', p2: '#d4bc84', p3: '#f8f0cc',
    w1: '#5898f0', w2: '#7cb8f8', w3: '#d0ecff', w4: '#3c70d0',
    s1: '#f4e0a0', s2: '#dcc47c', s3: '#fcf0c4',
    t1: '#3c9a3c', t2: '#2c7a30', t3: '#74c85c',
    r1: '#bcae94', r2: '#8c7c68', r3: '#d8ccb4', r4: '#625444',
    m1: '#c0945c', m2: '#8c6438', m3: '#dcb478', m4: '#6a4a28',
    ol: '#283028',
  });

  // ---------- Tiles (16×16, cached by type+variant) ----------
  const tileCache = {};
  P.tile = function (type, v) {
    const k = type + v; if (tileCache[k]) return tileCache[k];
    const c = P.canvas(TS, TS), g = c.getContext('2d'), r = rnd(v * 7919 + type.length * 131);
    const tuft = (x, y, dark, light) => { R(g, x, y + 1, 1, 1, dark); R(g, x + 2, y + 1, 1, 1, dark); R(g, x + 1, y + 2, 1, 1, dark); if (light) R(g, x + 1, y, 1, 1, light); };
    switch (type) {
      case 'grass': case 'lawn': {
        const [a, b] = type === 'grass' ? [C.g1, C.g2] : [C.l1, C.l2];
        R(g, 0, 0, 16, 16, a);
        for (let i = 0; i < (type === 'grass' ? 3 : 2); i++) tuft(Math.floor(r() * 13), Math.floor(r() * 13), b, C.g3);
        break;
      }
      case 'path': {
        R(g, 0, 0, 16, 16, C.p1);
        for (let i = 0; i < 5; i++) R(g, Math.floor(r() * 15), Math.floor(r() * 15), 1 + (r() > 0.6), 1, r() > 0.5 ? C.p2 : C.p3);
        break;
      }
      case 'sand': {
        R(g, 0, 0, 16, 16, C.s1);
        for (let i = 0; i < 6; i++) R(g, Math.floor(r() * 16), Math.floor(r() * 16), 1, 1, r() > 0.4 ? C.s2 : C.s3);
        break;
      }
      case 'forest': { // tall grass
        R(g, 0, 0, 16, 16, C.g2);
        for (const [qx, qy] of [[0, 0], [8, 0], [0, 8], [8, 8]]) {
          R(g, qx + 1, qy + 3, 2, 5, C.t2); R(g, qx + 3, qy + 1, 2, 7, C.t1); R(g, qx + 5, qy + 3, 2, 5, C.t2);
          R(g, qx + 3, qy + 1, 1, 1, C.t3); R(g, qx + 1, qy + 3, 1, 1, C.t3); R(g, qx + 5, qy + 3, 1, 1, C.t3);
          R(g, qx, qy + 7, 8, 1, C.t2);
        }
        break;
      }
      case 'water': {
        R(g, 0, 0, 16, 16, C.w1);
        for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 10), y = 2 + Math.floor(r() * 11); R(g, x, y, 4, 1, C.w2); R(g, x + 1, y - 1, 2, 1, C.w2); }
        if (r() > 0.6) R(g, Math.floor(r() * 14), Math.floor(r() * 14), 1, 1, C.w3);
        break;
      }
      case 'rubble': {
        R(g, 0, 0, 16, 16, C.r1);
        for (let i = 0; i < 3; i++) {
          const x = 1 + Math.floor(r() * 10), y = 1 + Math.floor(r() * 10), w = 3 + Math.floor(r() * 3);
          R(g, x, y + 1, w, 3, C.r4); R(g, x + 1, y, w - 2, 1, C.r4); R(g, x + 1, y + 1, w - 2, 2, C.r2); R(g, x + 1, y + 1, 1, 1, C.r3);
        }
        break;
      }
      case 'mountain': {
        R(g, 0, 0, 16, 16, C.m1);
        for (let y = 3; y < 16; y += 6) { R(g, 0, y, 16, 1, C.m2); R(g, 0, y + 1, 16, 1, C.m3); }
        for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); R(g, x, y, 1, 2, C.m2); R(g, x + 1, y + 1, 1, 1, C.m3); }
        break;
      }
    }
    return (tileCache[k] = c);
  };

  // Decorations painted on top of a lawn tile.
  const decoCache = {};
  P.deco = function (kind) {
    if (decoCache[kind]) return decoCache[kind];
    const c = P.canvas(18, 18), g = c.getContext('2d');
    g.translate(1, 1);
    if (kind === 'tree') {
      R(g, 6, 12, 4, 4, '#8a5a30'); R(g, 7, 12, 1, 4, '#a87040');
      g.fillStyle = C.t2; g.beginPath(); g.ellipse(8, 7, 7.5, 6.5, 0, 0, 7); g.fill();
      g.fillStyle = C.t1; g.beginPath(); g.ellipse(8, 6, 6.5, 5, 0, 0, 7); g.fill();
      R(g, 4, 3, 3, 2, C.t3); R(g, 9, 2, 2, 1, C.t3); R(g, 3, 6, 1, 1, C.t3);
    } else if (kind === 'flowers') {
      [[2, 3, '#f05868'], [9, 2, '#f8e058'], [5, 9, '#ffffff'], [12, 10, '#f05868'], [11, 5, '#ffffff']].forEach(([x, y, col]) => {
        R(g, x, y, 1, 1, col); R(g, x + 2, y, 1, 1, col); R(g, x + 1, y - 1, 1, 1, col); R(g, x + 1, y + 1, 1, 1, col); R(g, x + 1, y, 1, 1, '#f8c030'); R(g, x + 1, y + 2, 1, 2, C.g2);
      });
      decoCache[kind] = c; return c; // flowers aren't outlined
    } else if (kind === 'fence') {
      R(g, 0, 5, 16, 2, '#d8a868'); R(g, 0, 10, 16, 2, '#d8a868'); R(g, 1, 3, 3, 12, '#c08848'); R(g, 12, 3, 3, 12, '#c08848'); R(g, 1, 3, 3, 1, '#e8c088'); R(g, 12, 3, 3, 1, '#e8c088');
    } else if (kind === 'lamp') {
      R(g, 7, 5, 2, 11, '#505868'); R(g, 5, 15, 6, 1, '#505868'); R(g, 5, 0, 6, 5, '#f8e070'); R(g, 6, 1, 4, 3, '#fff8c0'); R(g, 4, 0, 8, 1, '#404858');
    } else if (kind === 'sign') {
      R(g, 7, 9, 2, 7, '#8a5a30'); R(g, 1, 2, 14, 8, '#d8a060'); R(g, 1, 2, 14, 1, '#f0c080'); R(g, 3, 4, 10, 1, '#8a5a30'); R(g, 3, 6, 7, 1, '#8a5a30');
    } else if (kind === 'fountain') { // 2×2 tiles: drawn separately in P.fountain
    }
    P.outline(c, C.ol);
    return (decoCache[kind] = c);
  };

  P.fountain = function () {
    if (decoCache.fountain) return decoCache.fountain;
    const c = P.canvas(34, 34), g = c.getContext('2d'); g.translate(1, 1);
    g.fillStyle = '#a8b0b8'; g.beginPath(); g.ellipse(16, 20, 15, 11, 0, 0, 7); g.fill();
    g.fillStyle = '#d0d8e0'; g.beginPath(); g.ellipse(16, 19, 15, 10, 0, 0, 7); g.fill();
    g.fillStyle = C.w1; g.beginPath(); g.ellipse(16, 19, 12, 7, 0, 0, 7); g.fill();
    R(g, 8, 18, 4, 1, C.w2); R(g, 19, 21, 5, 1, C.w2);
    R(g, 14, 6, 4, 13, '#c0c8d0'); R(g, 15, 6, 1, 13, '#e0e8f0');
    R(g, 12, 2, 8, 5, '#5ef2e1'); R(g, 13, 1, 6, 1, '#5ef2e1'); R(g, 14, 3, 3, 2, '#d8fffa');
    P.outline(c, C.ol);
    return (decoCache.fountain = c);
  };

  // ---------- Buildings (3/4 view, roof + front wall) ----------
  const bCache = {};
  P.building = function (id) {
    if (bCache[id]) return bCache[id];
    const b = AF.BUILDINGS[id], W = b.w * TS, H = b.h * TS;
    const c = P.canvas(W + 2, H + 2), g = c.getContext('2d'); g.translate(1, 1);
    const roofH = Math.round(H * 0.52), roof = b.roof, rd = P.shade(roof, -40), rl = P.shade(roof, 40);
    const wall = '#f4ecd8', wd = '#d4c8a8', trim = '#8a6a48';
    // roof
    R(g, 0, 0, W, roofH, roof);
    for (let y = 3; y < roofH - 2; y += 4) {
      R(g, 0, y, W, 1, rd);
      for (let x = (y / 4) % 2 ? 4 : 0; x < W; x += 8) R(g, x, y - 3, 1, 3, P.shade(roof, -18));
    }
    R(g, 0, 0, W, 2, rl); R(g, 0, roofH - 2, W, 2, rd);
    // walls
    R(g, 1, roofH, W - 2, H - roofH, wall); R(g, 1, H - 2, W - 2, 2, wd); R(g, 1, roofH, W - 2, 1, '#c8bca0');
    R(g, 1, roofH, 2, H - roofH, trim); R(g, W - 3, roofH, 2, H - roofH, trim);
    const doorX = Math.floor(b.w / 2) * TS + 3, doorW = 10, doorH = 13;
    const shop = AF.SHOPS.includes(id) && id !== 'home';
    // windows
    const winY = roofH + 4, wins = [];
    for (let x = 6; x + 10 < W - 4; x += 16) if (x + 10 < doorX - 2 || x > doorX + doorW + 2) wins.push(x);
    wins.forEach((x) => { R(g, x, winY, 10, 8, trim); R(g, x + 1, winY + 1, 8, 6, '#9ad8f8'); R(g, x + 1, winY + 1, 3, 2, '#e0f6ff'); R(g, x + 1, winY + 4, 8, 1, trim); });
    // door
    const dy = H - doorH;
    R(g, doorX - 1, dy - 1, doorW + 2, doorH + 1, trim);
    if (shop) { R(g, doorX, dy, doorW, doorH, '#8ad0f0'); R(g, doorX + doorW / 2 - 1, dy, 1, doorH, '#5aa0c8'); R(g, doorX + 1, dy + 1, 2, 4, '#e0f6ff'); }
    else { R(g, doorX, dy, doorW, doorH, '#8a5432'); R(g, doorX + 1, dy + 1, doorW - 2, 4, '#a06840'); R(g, doorX + doorW - 3, dy + 7, 1, 1, '#f8d048'); }
    // sign
    if (b.sign) {
      const tw = P.textWidth(b.sign) + 4, sx = Math.round(doorX + doorW / 2 - tw / 2), sy = Math.max(roofH + 1, dy - 9);
      R(g, sx - 1, sy - 1, tw + 2, 9, trim); R(g, sx, sy, tw, 7, roof); P.text(g, b.sign, sx + 2, sy + 1, '#ffffff');
    }
    // extras
    if (id === 'forge') { R(g, W - 14, -1, 7, 8, '#6a6a72'); R(g, W - 13, -1, 5, 2, '#ff9a40'); }
    if (id === 'hall') { R(g, W / 2 - 1, -1, 1, 1, '#ffffff'); R(g, 3, 1, 2, 1, rl); }
    P.outline(c, '#303038');
    return (bCache[id] = c);
  };

  // ---------- Resource nodes & ruins ----------
  const nCache = {};
  P.node = function (t) {
    if (nCache[t]) return nCache[t];
    const c = P.canvas(18, 18), g = c.getContext('2d'); g.translate(1, 1);
    if (t === 'scrap') { R(g, 2, 9, 12, 5, '#7c848c'); R(g, 4, 6, 5, 4, '#a8b0b8'); R(g, 9, 5, 4, 5, '#c8d0d8'); R(g, 6, 11, 3, 2, '#e0894a'); R(g, 10, 6, 2, 1, '#ffffff'); }
    else if (t === 'copper') { R(g, 2, 7, 12, 8, '#8c7c68'); R(g, 3, 5, 9, 3, '#8c7c68'); R(g, 4, 6, 3, 2, '#e8904c'); R(g, 9, 9, 3, 2, '#e8904c'); R(g, 5, 11, 2, 2, '#ffb070'); }
    else if (t === 'silicon') { R(g, 6, 2, 4, 12, '#a8e0f8'); R(g, 3, 7, 3, 7, '#88c8e8'); R(g, 10, 6, 3, 8, '#88c8e8'); R(g, 7, 3, 1, 6, '#ffffff'); R(g, 2, 13, 12, 2, '#d8c080'); }
    else { R(g, 6, 1, 4, 13, '#c27bff'); R(g, 3, 6, 3, 8, '#9a58e0'); R(g, 10, 5, 3, 9, '#9a58e0'); R(g, 7, 2, 1, 7, '#f0d8ff'); R(g, 2, 13, 12, 2, '#7a6a88'); }
    P.outline(c, C.ol);
    return (nCache[t] = c);
  };
  P.ruin = function (open) {
    const k = 'ruin' + open; if (nCache[k]) return nCache[k];
    const c = P.canvas(18, 18), g = c.getContext('2d'); g.translate(1, 1);
    R(g, 2, 4, 4, 11, '#a8a090'); R(g, 10, 7, 4, 8, '#a8a090'); R(g, 1, 3, 14, 3, '#c8c0b0'); R(g, 2, 4, 1, 11, '#d8d0c0'); R(g, 8, 13, 3, 2, '#8a8070');
    if (!open) { R(g, 7, 9, 2, 2, '#5ef2e1'); R(g, 6, 10, 4, 1, '#5ef2e1'); }
    P.outline(c, C.ol);
    return (nCache[k] = c);
  };

  // ---------- Overworld bots ----------
  const eCache = {};
  P.enemy = function (type, frame) {
    const k = type + frame; if (eCache[k]) return eCache[k];
    const e = AF.ENEMIES[type], boss = e.boss, S = boss ? 30 : 16;
    const c = P.canvas(S + 2, S + 2), g = c.getContext('2d'); g.translate(1, 1);
    const body = e.body, bd = P.shade(body, -40), bl = P.shade(body, 40), f = frame ? 1 : 0;
    if (boss) {
      g.fillStyle = bd; g.beginPath(); g.arc(15, 15, 14, 0, 7); g.fill();
      g.fillStyle = body; g.beginPath(); g.arc(15, 14, 12, 0, 7); g.fill();
      R(g, 11, 10, 8, 8, '#ffcf5e'); R(g, 13, 12, 4, 4, '#ffffff'); R(g, 6, 6, 3, 3, '#ff3b3b'); R(g, 21, 6, 3, 3, '#ff3b3b');
    } else {
      const tier = e.tier;
      R(g, 3, 13 - f, 2, 3 + f, '#383840'); R(g, 11, 13 - f, 2, 3 + f, '#383840');
      R(g, 2, 4 - f, 12, 10, body); R(g, 2, 12 - f, 12, 2, bd); R(g, 3, 4 - f, 10, 1, bl);
      R(g, 5, 7 - f, 2, 2, '#ff3b3b'); R(g, 9, 7 - f, 2, 2, '#ff3b3b');
      if (tier >= 2) { R(g, 7, 1 - f, 2, 3, '#505060'); R(g, 6, 0 - f, 4, 1, '#ff3b3b'); }
      if (tier >= 3) { R(g, 0, 6 - f, 2, 5, bd); R(g, 14, 6 - f, 2, 5, bd); }
    }
    P.outline(c, C.ol);
    return (eCache[k] = c);
  };

  // ---------- Companion robot (4 directions) ----------
  const robCache = {};
  P.robot = function (parts, core, dir, frame) {
    const k = [parts.frame, parts.legs, core, dir, frame].join(); if (robCache[k]) return robCache[k];
    const FR = ['#a86a44', '#8c9aa8', '#68aab8', '#d0d8e0', '#40d0c8'][parts.frame - 1], FD = P.shade(FR, -45);
    const c = P.canvas(16, 16), g = c.getContext('2d'); g.translate(1, 1);
    const bob = frame ? 1 : 0, L = parts.legs;
    // locomotion
    if (L === 1) { R(g, 2, 11, 3, 3, '#303038'); R(g, 9, 11, 3, 3, '#303038'); R(g, 3, 12, 1, 1, '#9098a0'); R(g, 10, 12, 1, 1, '#9098a0'); }
    else if (L === 2) { R(g, 1, 11, 12, 3, '#303038'); for (let x = 2 + bob; x < 12; x += 3) R(g, x, 12, 1, 1, '#9098a0'); }
    else if (L === 3) { R(g, 3, 13, 8, 1, core); R(g, 2, 11, 10, 2, FD); }
    else { R(g, 2, 10, 2, 4 - bob, FD); R(g, 10, 10, 2, 3 + bob, FD); R(g, 6, 11, 2, 3, FD); if (L === 5) R(g, 1, 13, 12, 1, core); }
    // body + head
    R(g, 2, 5 - bob, 10, 6, FR); R(g, 2, 10 - bob, 10, 1, FD);
    R(g, 4, 0 - bob, 6, 5, FR); R(g, 4, 4 - bob, 6, 1, FD);
    if (dir === 'down') { R(g, 5, 1 - bob, 4, 2, '#182830'); R(g, 6, 1 - bob, 2, 1, core); R(g, 6, 7 - bob, 2, 2, core); }
    else if (dir === 'up') { R(g, 5, 6 - bob, 4, 1, FD); R(g, 5, 8 - bob, 4, 1, FD); }
    else { R(g, 4, 1 - bob, 3, 2, '#182830'); R(g, 4, 1 - bob, 1, 1, core); R(g, 3, 7 - bob, 2, 2, core); R(g, 11, 6 - bob, 3, 2, '#505860'); }
    P.outline(c, C.ol);
    const out = dir === 'right' ? P.flip(c) : c;
    return (robCache[k] = out);
  };

  // ---------- Big battle sprites from the vector art ----------
  // Renders an SVG small, hardens the edges and outlines it so it reads as pixel art.
  const svgCache = {};
  P.fromSVG = function (key, svg, size) {
    if (svgCache[key]) return svgCache[key];
    svgCache[key] = new Promise((resolve) => {
      const img = new Image();
      const src = svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `);
      img.onload = () => {
        const c = P.canvas(size + 2, size + 2), g = c.getContext('2d');
        g.drawImage(img, 1, 1, size, size);
        const d = g.getImageData(0, 0, c.width, c.height);
        for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
        g.putImageData(d, 0, 0);
        resolve(P.outline(c, '#202028'));
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
    });
    return svgCache[key];
  };

  // Paint every <canvas data-spr="..."> inside root.
  P.paint = function (root, state) {
    root.querySelectorAll('canvas[data-spr]').forEach((cv) => {
      const [kind, arg] = cv.dataset.spr.split(':');
      const put = (src) => { if (!src) return; cv.width = src.width; cv.height = src.height; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0); };
      if (kind === 'enemy') P.fromSVG('e' + arg, AF.enemySVG(arg), 46).then(put);
      if (kind === 'robot') { const core = AF.coreColor(state.look); P.fromSVG('r' + JSON.stringify(state.parts) + core, AF.robotSVG(state.parts, { core }), 46).then(put); }
      if (kind === 'pilot') put(AF.pilotSprite(state.look, arg || 'down', 0));
    });
  };
})();
