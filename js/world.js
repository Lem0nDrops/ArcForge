/* ArcForge — the open world: generation, movement, gathering, fog, drawing. */
(function () {
  const AF = (window.AF = window.AF || {});
  const W = 72, H = 72, VISION = 5, SAFE = 3;
  const CH = { w: 'water', s: 'sand', g: 'grass', f: 'forest', r: 'rubble', m: 'mountain' };
  const key = (x, y) => x + ',' + y;

  // ---------- Generation ----------
  function valueNoise(r, scale) {
    const gw = Math.ceil(W / scale) + 2, gh = Math.ceil(H / scale) + 2;
    const g = Array.from({ length: gw * gh }, () => r());
    const sm = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = sm(fx - ix), ty = sm(fy - iy);
      const v = (i, j) => g[(iy + j) * gw + (ix + i)];
      const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx, b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
      return a + (b - a) * ty;
    };
  }

  // Retry seeds until the starting region is big enough to explore on Wheels.
  function generate(seed) {
    let w = null;
    for (let k = 0; k < 25; k++) { w = build(seed + k * 101); if (w.reach >= 900) break; }
    delete w.reach;
    return w;
  }

  function build(seed) {
    const r = AF.rng(seed);
    const n1 = valueNoise(r, 14), n2 = valueNoise(r, 6), m1 = valueNoise(r, 12);
    const cx = W >> 1, cy = H >> 1;
    let tiles = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy) / (W / 2);
      let e = n1(x, y) * 0.75 + n2(x, y) * 0.25 + 0.2 - d * d * 0.6;
      const m = m1(x, y);
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= 4) e = Math.min(Math.max(e, 0.45), 0.6);
      let t;
      if (e < 0.3) t = 'w'; else if (e < 0.34) t = 's';
      else if (e > 0.72) t = 'm'; else if (e > 0.63) t = 'r';
      else if (m > 0.62) t = 'f'; else if (m < 0.3) t = 's'; else t = 'g';
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= 4) t = (t === 'f' || t === 'g') ? t : 'g';
      tiles += t;
    }
    const world = { w: W, h: H, tiles, nodes: {}, ruins: {}, enemies: [], fog: '', px: cx, py: cy,
      base: { x: cx, y: cy }, lair: null, nextId: 1 };
    const tAt = (x, y) => CH[tiles[y * W + x]];
    const dist = (x, y) => Math.hypot(x - cx, y - cy);
    const land = (x, y) => tAt(x, y) !== 'water';

    // Titan's lair: farthest land tile, ringed by mountains (needs Spider Legs).
    let best = null;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++)
      if (land(x, y) && (!best || dist(x, y) > best.d)) best = { x, y, d: dist(x, y) };
    const arr = tiles.split('');
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = best.x + dx, y = best.y + dy, ring = Math.max(Math.abs(dx), Math.abs(dy));
      arr[y * W + x] = ring === 2 ? 'm' : 'r';
    }
    world.tiles = tiles = arr.join('');
    world.lair = { x: best.x, y: best.y };

    // Tiles reachable from base on starting Wheels.
    const reach = new Set([key(cx, cy)]), q = [[cx, cy]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, t = nx >= 0 && ny >= 0 && nx < W && ny < H && tAt(nx, ny);
        if (t && AF.TERRAIN[t].legs <= 1 && !reach.has(key(nx, ny))) { reach.add(key(nx, ny)); q.push([nx, ny]); }
      }
    }
    world.reach = reach.size;

    const free = (x, y) => !world.nodes[key(x, y)] && !world.ruins[key(x, y)] && !(x === cx && y === cy)
      && !(Math.abs(x - best.x) <= 2 && Math.abs(y - best.y) <= 2);

    // Resource nodes
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!free(x, y)) continue;
      const t = tAt(x, y), roll = r(), far = dist(x, y) > 8;
      let n = null;
      if ((t === 'grass' || t === 'forest') && roll < 0.035 && far) n = 'scrap';
      else if (t === 'rubble') n = roll < 0.07 ? 'copper' : roll < 0.1 ? 'scrap' : null;
      else if (t === 'sand' && roll < 0.06) n = 'silicon';
      else if (t === 'mountain' && roll < 0.07) n = 'arcite';
      else if (t === 'forest' && roll < 0.008 && dist(x, y) > 16) n = 'arcite';
      if (n) world.nodes[key(x, y)] = { t: n, ready: 0 };
    }
    // Starter nodes near base so the first upgrade is reachable on Wheels.
    const starter = ['scrap', 'scrap', 'scrap', 'scrap', 'copper', 'copper', 'copper', 'silicon'];
    let guard = 0;
    while (starter.length && guard++ < 2000) {
      const x = cx + AF.randInt(r, -9, 9), y = cy + AF.randInt(r, -9, 9);
      const t = tAt(x, y);
      if (dist(x, y) > 4 && reach.has(key(x, y)) && (t === 'grass' || t === 'sand' || t === 'forest') && free(x, y))
        world.nodes[key(x, y)] = { t: starter.pop(), ready: 0 };
    }
    // Ruins hold blueprints.
    let ruins = 0; guard = 0;
    while (ruins < 14 && guard++ < 5000) {
      const x = AF.randInt(r, 2, W - 3), y = AF.randInt(r, 2, H - 3);
      if (land(x, y) && dist(x, y) > 7 && free(x, y)) { world.ruins[key(x, y)] = { open: false }; ruins++; }
    }
    // Enemies
    for (let i = 0; i < 46; i++) spawnEnemy(world, r, 7);
    world.enemies.push({ id: world.nextId++, type: 'titan', x: best.x, y: best.y, boss: true });
    world.fog = '0'.repeat(W * H);
    reveal(world);
    return world;
  }

  function tierFor(d, r) {
    if (d < 12) return 1;
    if (d < 16) return r() < 0.7 ? 1 : 2;
    if (d < 24) return r() < 0.25 ? 1 : r() < 0.85 ? 2 : 3;
    return r() < 0.35 ? 2 : 3;
  }

  function spawnEnemy(world, r, minDist, avoid) {
    for (let tries = 0; tries < 300; tries++) {
      const x = AF.randInt(r, 1, W - 2), y = AF.randInt(r, 1, H - 2);
      const d = Math.hypot(x - world.base.x, y - world.base.y);
      if (d < minDist || !enemyCanEnter(world, x, y)) continue;
      if (avoid && Math.abs(x - avoid.x) + Math.abs(y - avoid.y) < 10) continue;
      const pool = AF.TIERS[tierFor(d, r)];
      world.enemies.push({ id: world.nextId++, type: pool[Math.floor(r() * pool.length)], x, y });
      return;
    }
  }

  // ---------- Queries ----------
  const terrainAt = (w, x, y) => (x < 0 || y < 0 || x >= w.w || y >= w.h) ? null : CH[w.tiles[y * w.w + x]];
  const inSafe = (w, x, y) => Math.max(Math.abs(x - w.base.x), Math.abs(y - w.base.y)) <= SAFE;
  const enemyAt = (w, x, y) => w.enemies.find((e) => e.x === x && e.y === y);
  function enemyCanEnter(w, x, y) {
    const t = terrainAt(w, x, y);
    return t && AF.TERRAIN[t].legs <= 2 && !inSafe(w, x, y) && !enemyAt(w, x, y)
      && !(w.lair && Math.abs(x - w.lair.x) <= 2 && Math.abs(y - w.lair.y) <= 2);
  }
  function reveal(w) {
    const f = w.fog.split('');
    for (let dy = -VISION; dy <= VISION; dy++) for (let dx = -VISION; dx <= VISION; dx++) {
      const x = w.px + dx, y = w.py + dy;
      if (x >= 0 && y >= 0 && x < w.w && y < w.h && dx * dx + dy * dy <= VISION * VISION + 2) f[y * w.w + x] = '1';
    }
    w.fog = f.join('');
  }
  const seen = (w, x, y) => w.fog[y * w.w + x] === '1';
  const visible = (w, x, y) => (x - w.px) ** 2 + (y - w.py) ** 2 <= VISION * VISION + 2;

  // ---------- Turn: player moves, world reacts ----------
  // Returns an event: {type:'battle', enemy} | {type:'msg', text} | null
  function move(state, dx, dy) {
    const w = state.world, nx = w.px + dx, ny = w.py + dy, st = AF.stats(state.parts);
    const t = terrainAt(w, nx, ny);
    if (!t) return { type: 'blocked', text: 'The edge of the known world.' };
    const need = AF.TERRAIN[t].legs;
    if (st.legs < need)
      return { type: 'blocked', text: `Your ${AF.PARTS.legs.tiers[st.legs - 1]} can't cross ${AF.TERRAIN[t].name}. Upgrade Locomotion to ${AF.PARTS.legs.tiers[need - 1]}.` };
    const foe = enemyAt(w, nx, ny);
    if (foe) return { type: 'battle', enemy: foe };

    w.px = nx; w.py = ny; state.steps++;
    reveal(w);
    const msgs = [];
    const k = key(nx, ny);

    const node = w.nodes[k];
    if (node) {
      const def = AF.NODES[node.t];
      if (node.ready > state.steps) msgs.push(`${def.label} is depleted. It regrows in ${node.ready - state.steps} steps.`);
      else if (def.arms && state.parts.arms < def.arms) msgs.push(`${def.label}: too hard for Grabbers. Upgrade Arms to Drill Arms.`);
      else {
        const r = AF.rng(state.seed + state.steps * 7);
        const amt = AF.randInt(r, def.amount[0], def.amount[1]) + (st.gather - 1);
        AF.gain(state.res, { [def.res]: amt });
        node.ready = state.steps + def.respawn;
        msgs.push(`Gathered ${amt} ${AF.RES[def.res].name}.`);
        AF.sfx('gather');
      }
    }
    const ruin = w.ruins[k];
    if (ruin && !ruin.open) {
      ruin.open = true;
      const locked = Object.keys(AF.CARDS).filter((id) => !state.known.includes(id));
      if (locked.length) {
        const r = AF.rng(state.seed + state.steps * 13);
        const id = locked[Math.floor(r() * locked.length)];
        state.known.push(id);
        msgs.push(`Ruin searched: blueprint found for ${AF.CARDS[id].name}! Forge it at base.`);
      } else {
        AF.gain(state.res, { circuits: 2, copper: 4 });
        msgs.push('Ruin searched: 2 Circuits and 4 Copper salvaged.');
      }
      AF.sfx('forge');
    }
    if (nx === w.base.x && ny === w.base.y) {
      state.hp = st.maxHp;
      msgs.push('Home Forge: fully repaired. Open the Workshop to craft and upgrade.');
      AF.sfx('heal');
    }

    // Enemies take their turn.
    const r = AF.rng(state.seed ^ (state.steps * 2654435761));
    let ambush = null;
    for (const e of w.enemies) {
      if (e.boss) continue;
      const d = Math.abs(e.x - w.px) + Math.abs(e.y - w.py);
      let step = null;
      if (d <= 6 && r() < 0.55) {
        const sx = Math.sign(w.px - e.x), sy = Math.sign(w.py - e.y);
        step = Math.abs(w.px - e.x) >= Math.abs(w.py - e.y) ? [sx, 0] : [0, sy];
      } else if (r() < 0.25) {
        step = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
      }
      if (!step) continue;
      const tx = e.x + step[0], ty = e.y + step[1];
      if (tx === w.px && ty === w.py && !inSafe(w, tx, ty)) { ambush = e; continue; }
      if (enemyCanEnter(w, tx, ty)) { e.x = tx; e.y = ty; }
    }
    if (state.steps % 40 === 0 && w.enemies.length < 40) spawnEnemy(w, r, 10, { x: w.px, y: w.py });
    if (ambush) return { type: 'battle', enemy: ambush, ambush: true, text: msgs.join(' ') };
    return msgs.length ? { type: 'msg', text: msgs.join(' ') } : null;
  }

  function removeEnemy(state, id) { state.world.enemies = state.world.enemies.filter((e) => e.id !== id); }
  function sendHome(state) { state.world.px = state.world.base.x; state.world.py = state.world.base.y; reveal(state.world); }
  const atBase = (state) => state.world.px === state.world.base.x && state.world.py === state.world.base.y;

  function describeHere(state) {
    const w = state.world, k = key(w.px, w.py), t = terrainAt(w, w.px, w.py);
    if (atBase(state)) return 'Home Forge';
    if (w.nodes[k]) return AF.NODES[w.nodes[k].t].label;
    if (w.ruins[k]) return 'Searched ruin';
    return AF.TERRAIN[t].name;
  }

  // ---------- Drawing ----------
  function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (s) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  }

  function drawTile(g, t, x, y, s, wx, wy, time) {
    const h = hash(wx, wy), base = AF.TERRAIN[t].color;
    g.fillStyle = shade(base, Math.round((h - 0.5) * 14));
    g.fillRect(x, y, s + 1, s + 1);
    if (t === 'water') {
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(1, s / 20);
      const o = Math.sin(time / 600 + h * 6) * s * 0.08;
      g.beginPath(); g.moveTo(x + s * 0.2 + o, y + s * 0.4); g.quadraticCurveTo(x + s * 0.35 + o, y + s * 0.3, x + s * 0.5 + o, y + s * 0.4); g.stroke();
    } else if (t === 'forest') {
      for (const [ox, oy, rr] of [[0.3, 0.38, 0.22], [0.68, 0.6, 0.2], [0.35, 0.75, 0.15]]) {
        g.fillStyle = '#1f4a28'; g.beginPath(); g.arc(x + s * ox, y + s * oy + s * 0.04, s * rr, 0, 7); g.fill();
        g.fillStyle = h > 0.5 ? '#3d8a48' : '#367a40'; g.beginPath(); g.arc(x + s * ox, y + s * oy, s * rr * 0.9, 0, 7); g.fill();
      }
    } else if (t === 'mountain') {
      g.fillStyle = '#5d6168'; g.beginPath(); g.moveTo(x + s * 0.08, y + s * 0.9); g.lineTo(x + s * 0.5, y + s * 0.12); g.lineTo(x + s * 0.92, y + s * 0.9); g.fill();
      g.fillStyle = '#e8edf2'; g.beginPath(); g.moveTo(x + s * 0.38, y + s * 0.34); g.lineTo(x + s * 0.5, y + s * 0.12); g.lineTo(x + s * 0.62, y + s * 0.34); g.fill();
    } else if (t === 'rubble') {
      g.fillStyle = '#4e4a45';
      for (let i = 0; i < 4; i++) { const hx = hash(wx * 3 + i, wy * 5 - i); g.fillRect(x + s * (0.1 + hx * 0.7), y + s * (0.15 + hash(wx + i, wy * 2) * 0.65), s * 0.16, s * 0.12); }
    } else if (t === 'sand' && h > 0.6) {
      g.fillStyle = 'rgba(120,90,40,.25)'; g.fillRect(x + s * 0.2, y + s * 0.6, s * 0.3, s * 0.05);
    } else if (t === 'grass' && h > 0.55) {
      g.strokeStyle = '#6fae63'; g.lineWidth = Math.max(1, s / 22);
      g.beginPath(); g.moveTo(x + s * 0.3, y + s * 0.7); g.lineTo(x + s * 0.34, y + s * 0.55); g.moveTo(x + s * 0.4, y + s * 0.7); g.lineTo(x + s * 0.42, y + s * 0.58); g.stroke();
    }
  }

  function drawNode(g, n, x, y, s, ready) {
    g.globalAlpha = ready ? 1 : 0.35;
    const c = AF.RES[AF.NODES[n].res].color;
    if (n === 'scrap') {
      g.fillStyle = '#5b636b'; g.fillRect(x + s * 0.22, y + s * 0.55, s * 0.56, s * 0.22);
      g.fillStyle = c; g.beginPath(); g.arc(x + s * 0.4, y + s * 0.5, s * 0.14, 0, 7); g.fill();
      g.fillStyle = '#cfd6dc'; g.fillRect(x + s * 0.52, y + s * 0.38, s * 0.18, s * 0.18);
    } else if (n === 'copper') {
      g.fillStyle = '#5a4a3e'; g.beginPath(); g.arc(x + s * 0.5, y + s * 0.6, s * 0.3, Math.PI, 0); g.fill();
      g.fillStyle = c; [[0.4, 0.5], [0.56, 0.44], [0.6, 0.58]].forEach(([a, b]) => g.fillRect(x + s * a, y + s * b, s * 0.1, s * 0.1));
    } else if (n === 'silicon') {
      g.fillStyle = c; g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.2); g.lineTo(x + s * 0.68, y + s * 0.6); g.lineTo(x + s * 0.32, y + s * 0.6); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha *= 0.6; g.fillRect(x + s * 0.46, y + s * 0.34, s * 0.05, s * 0.16);
    } else {
      g.shadowColor = c; g.shadowBlur = ready ? s * 0.4 : 0;
      g.fillStyle = c; g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.12); g.lineTo(x + s * 0.66, y + s * 0.5); g.lineTo(x + s * 0.5, y + s * 0.8); g.lineTo(x + s * 0.34, y + s * 0.5); g.fill();
      g.shadowBlur = 0;
    }
    g.globalAlpha = 1;
  }

  function drawBot(g, x, y, s, body, eyeCol, boss) {
    const k = boss ? 1.25 : 1, o = (1 - 0.6 * k) / 2;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + s / 2, y + s * 0.85, s * 0.3 * k, s * 0.08, 0, 0, 7); g.fill();
    g.fillStyle = '#222'; g.fillRect(x + s * o - s * 0.04, y + s * 0.3, s * 0.08, s * 0.5); g.fillRect(x + s * (1 - o) - s * 0.04, y + s * 0.3, s * 0.08, s * 0.5);
    g.fillStyle = body; g.beginPath(); g.roundRect(x + s * o, y + s * (0.22 - (k - 1) * 0.2), s * 0.6 * k, s * 0.55 * k, s * 0.12); g.fill();
    g.fillStyle = eyeCol; g.beginPath(); g.arc(x + s * 0.5, y + s * 0.42, s * 0.09 * k, 0, 7); g.fill();
  }

  function draw(canvas, state, time) {
    const w = state.world, g = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1, cw = canvas.clientWidth, chh = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(chh * dpr)) {
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = Math.max(30, Math.min(52, Math.round(Math.min(cw, chh) / 11)));
    const ox = cw / 2 - (w.px + 0.5) * s, oy = chh / 2 - (w.py + 0.5) * s;
    g.fillStyle = '#081014'; g.fillRect(0, 0, cw, chh);
    const x0 = Math.max(0, Math.floor(-ox / s)), y0 = Math.max(0, Math.floor(-oy / s));
    const x1 = Math.min(w.w - 1, Math.ceil((cw - ox) / s)), y1 = Math.min(w.h - 1, Math.ceil((chh - oy) / s));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!seen(w, x, y)) continue;
      const sx = ox + x * s, sy = oy + y * s, t = terrainAt(w, x, y);
      drawTile(g, t, sx, sy, s, x, y, time);
      if (inSafe(w, x, y)) { g.fillStyle = 'rgba(94,242,225,.07)'; g.fillRect(sx, sy, s, s); }
      const k = key(x, y);
      if (w.nodes[k]) drawNode(g, w.nodes[k].t, sx, sy, s, w.nodes[k].ready <= state.steps);
      if (w.ruins[k]) {
        g.fillStyle = '#7a6a58'; g.fillRect(sx + s * 0.2, sy + s * 0.3, s * 0.18, s * 0.5); g.fillRect(sx + s * 0.6, sy + s * 0.4, s * 0.18, s * 0.4);
        g.fillRect(sx + s * 0.16, sy + s * 0.26, s * 0.66, s * 0.1);
        if (!w.ruins[k].open) { g.fillStyle = '#5ef2e1'; g.beginPath(); g.arc(sx + s * 0.5, sy + s * 0.6, s * 0.08, 0, 7); g.fill(); }
      }
    }
    { // Home Forge building (drawn after tiles so neighbours don't cover it)
      const sx = ox + w.base.x * s, sy = oy + w.base.y * s;
      g.fillStyle = '#2b3a40'; g.fillRect(sx - s * 0.2, sy + s * 0.1, s * 1.4, s * 0.85);
      g.fillStyle = '#3d5058'; g.beginPath(); g.moveTo(sx - s * 0.3, sy + s * 0.15); g.lineTo(sx + s * 0.5, sy - s * 0.35); g.lineTo(sx + s * 1.3, sy + s * 0.15); g.fill();
      g.fillStyle = '#e0894a'; g.shadowColor = '#e0894a'; g.shadowBlur = s * 0.5;
      g.fillRect(sx + s * 0.32, sy + s * 0.45, s * 0.36, s * 0.5); g.shadowBlur = 0;
    }
    // Fog edge: dim tiles that are remembered but not currently in sight.
    g.fillStyle = 'rgba(8,16,20,.45)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (seen(w, x, y) && !visible(w, x, y)) g.fillRect(ox + x * s, oy + y * s, s + 1, s + 1);
    // Enemies (only those in sight, plus the lair boss once discovered)
    for (const e of w.enemies) {
      if (!(visible(w, e.x, e.y) || (e.boss && seen(w, e.x, e.y)))) continue;
      const def = AF.ENEMIES[e.type];
      drawBot(g, ox + e.x * s, oy + e.y * s + Math.sin(time / 300 + e.id) * s * 0.03, s, def.body, '#ff3b3b', e.boss);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(ox + e.x * s + s * 0.15, oy + e.y * s - s * 0.02, s * 0.7, s * 0.14);
      g.fillStyle = ['#7ee08a', '#ffd75e', '#ff8a4a', '#ff3b5c'][def.tier - 1];
      g.fillRect(ox + e.x * s + s * 0.17, oy + e.y * s, s * 0.66 * (def.tier / 4), s * 0.1);
    }
    // Player
    const px = ox + w.px * s, py = oy + w.py * s;
    const FR = ['#8a5a3c', '#7d8a96', '#5f9aa8', '#c7cdd4', '#3fd0c9'][state.parts.frame - 1];
    const ARC = ['#ffd75e', '#ffb03b', '#5ef2e1', '#7fb8ff', '#e2a6ff'][state.parts.arc - 1];
    g.shadowColor = ARC; g.shadowBlur = s * 0.3;
    drawBot(g, px, py + Math.sin(time / 250) * s * 0.02, s, FR, ARC);
    g.shadowBlur = 0;
  }

  // Overview map for the Map panel.
  function drawMap(canvas, state) {
    const w = state.world, g = canvas.getContext('2d'), s = 4;
    canvas.width = w.w * s; canvas.height = w.h * s;
    g.fillStyle = '#081014'; g.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
      if (!seen(w, x, y)) continue;
      g.fillStyle = AF.TERRAIN[terrainAt(w, x, y)].color; g.fillRect(x * s, y * s, s, s);
      if (w.ruins[key(x, y)] && !w.ruins[key(x, y)].open) { g.fillStyle = '#5ef2e1'; g.fillRect(x * s, y * s, s, s); }
    }
    g.fillStyle = '#e0894a'; g.fillRect((w.base.x - 1) * s, (w.base.y - 1) * s, s * 3, s * 3);
    if (seen(w, w.lair.x, w.lair.y)) { g.fillStyle = '#ff3b5c'; g.fillRect((w.lair.x - 1) * s, (w.lair.y - 1) * s, s * 3, s * 3); }
    g.fillStyle = '#fff'; g.fillRect((w.px - 1) * s, (w.py - 1) * s, s * 3, s * 3);
    const total = w.w * w.h, n = w.fog.split('1').length - 1;
    return Math.round((n / total) * 100);
  }

  AF.World = { generate, move, draw, drawMap, removeEnemy, sendHome, atBase, describeHere, terrainAt };
})();
