/* ArcForge — the world.
   The map is built once from AF.WORLD_SEED, so every player explores the same world.
   Each save only stores what changes: positions, harvested nodes, searched ruins, enemies, explored area. */
(function () {
  const AF = (window.AF = window.AF || {});
  const W = 96, H = 96, VISION = 6, TS = 16;
  const TW = 34, TH = 28, TX = (W >> 1) - 17, TY = (H >> 1) - 14; // town rectangle
  const CH = { w: 'water', s: 'sand', g: 'grass', f: 'forest', r: 'rubble', m: 'mountain', p: 'path', l: 'lawn' };
  const key = (x, y) => x + ',' + y;
  const inTownXY = (x, y) => x >= TX && y >= TY && x < TX + TW && y < TY + TH;
  const DIRS = { '0,1': 'down', '0,-1': 'up', '-1,0': 'left', '1,0': 'right' };

  // ---------- Static map ----------
  let M = null;

  function valueNoise(r, scale) {
    const gw = Math.ceil(W / scale) + 2, gh = Math.ceil(H / scale) + 2;
    const g = Array.from({ length: gw * gh }, () => r());
    const sm = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = sm(fx - ix), ty = sm(fy - iy), v = (i, j) => g[(iy + j) * gw + (ix + i)];
      const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx, b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
      return a + (b - a) * ty;
    };
  }

  function map() {
    if (M) return M;
    for (let k = 0; k < 25; k++) { M = buildMap(AF.WORLD_SEED + k * 101); if (M.reach >= 1600) break; }
    return M;
  }

  function buildMap(seed) {
    const r = AF.rng(seed);
    const n1 = valueNoise(r, 18), n2 = valueNoise(r, 8), m1 = valueNoise(r, 15);
    const cx = W >> 1, cy = H >> 1;
    const t = new Array(W * H), solid = new Uint8Array(W * H), deco = new Array(W * H).fill(null);
    const near = (x, y, pad) => x >= TX - pad && y >= TY - pad && x < TX + TW + pad && y < TY + TH + pad;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy) / (W / 2);
      let e = n1(x, y) * 0.75 + n2(x, y) * 0.25 + 0.2 - d * d * 0.6;
      const m = m1(x, y);
      if (near(x, y, 5)) e = Math.min(Math.max(e, 0.45), 0.6);
      let c;
      if (e < 0.3) c = 'w'; else if (e < 0.34) c = 's';
      else if (e > 0.72) c = 'm'; else if (e > 0.63) c = 'r';
      else if (m > 0.62) c = 'f'; else if (m < 0.3) c = 's'; else c = 'g';
      if (near(x, y, 3)) c = 'g';
      t[y * W + x] = c;
    }
    const I = (x, y) => y * W + x;
    const set = (x, y, c) => { t[I(x, y)] = c; };

    // ----- Rivet Hollow: a hand-built town (local coords 0..33 × 0..27) -----
    const L = (lx, ly) => [TX + lx, TY + ly];
    for (let ly = 0; ly < TH; ly++) for (let lx = 0; lx < TW; lx++) set(...L(lx, ly), 'l');
    const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(...L(x, y), 'p'); };
    path(16, 0, 17, 27); path(0, 13, 33, 14); path(2, 7, 31, 7); path(2, 24, 31, 24); path(12, 15, 21, 18);
    // roads leading out of town
    for (let i = 1; i <= 4; i++) { set(TX + 16, TY - i, 'p'); set(TX + 17, TY - i, 'p'); set(TX + 16, TY + TH - 1 + i, 'p'); set(TX + 17, TY + TH - 1 + i, 'p');
      set(TX - i, TY + 13, 'p'); set(TX - i, TY + 14, 'p'); set(TX + TW - 1 + i, TY + 13, 'p'); set(TX + TW - 1 + i, TY + 14, 'p'); }
    const put = (lx, ly, kind) => { const [x, y] = L(lx, ly); deco[I(x, y)] = kind; if (kind !== 'flowers') solid[I(x, y)] = 1; };
    // border trees with four gateways
    for (let ly = 0; ly < TH; ly++) for (let lx = 0; lx < TW; lx++) {
      const edge = lx === 0 || ly === 0 || lx === TW - 1 || ly === TH - 1;
      const gate = ((ly === 0 || ly === TH - 1) && (lx === 16 || lx === 17)) || ((lx === 0 || lx === TW - 1) && (ly === 13 || ly === 14));
      if (edge && !gate) put(lx, ly, 'tree');
    }
    [[1, 1], [2, 1], [1, 2], [32, 1], [31, 1], [32, 2], [1, 26], [1, 25], [2, 26], [32, 26], [32, 25], [31, 26], [14, 1], [20, 1], [27, 1], [7, 1]].forEach(([a, b]) => put(a, b, 'tree'));
    // pond, fence, fountain, lamps, signs
    for (let ly = 15; ly <= 17; ly++) for (let lx = 3; lx <= 7; lx++) { const [x, y] = L(lx, ly); set(x, y, 'w'); solid[I(x, y)] = 1; }
    for (let lx = 2; lx <= 8; lx++) put(lx, 18, 'fence');
    { const [x, y] = L(16, 16); deco[I(x, y)] = 'fountain'; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) solid[I(x + a, y + b)] = 1; }
    [[15, 8], [18, 8], [15, 23], [18, 23], [11, 15], [22, 15], [25, 12], [8, 12]].forEach(([a, b]) => put(a, b, 'lamp'));
    const signs = {};
    const sign = (lx, ly, text) => { put(lx, ly, 'sign'); const [x, y] = L(lx, ly); signs[key(x, y)] = text; };
    sign(14, 26, 'RIVET HOLLOW — "Every bolt has a story." South: the Rustfields.');
    sign(19, 1, 'North: the Glassdunes. Beware the Spark Spitters.');
    sign(1, 12, 'West: Old Pylon Road.');
    sign(32, 15, 'East: the Rubble Wastes. Treads recommended.');
    sign(23, 18, 'TOWN SQUARE — The Arc Fountain still runs on a sliver of the Titan Core\'s old power.');

    // buildings
    const buildings = [], doors = {};
    for (const [id, b] of Object.entries(AF.BUILDINGS)) {
      const [x, y] = L(b.x, b.y), door = [x + Math.floor(b.w / 2), y + b.h - 1];
      for (let yy = y; yy < y + b.h; yy++) for (let xx = x; xx < x + b.w; xx++) { solid[I(xx, yy)] = 1; deco[I(xx, yy)] = null; }
      doors[key(...door)] = id;
      buildings.push({ id, x, y, w: b.w, h: b.h, door });
    }
    // flowers on open lawn
    for (let ly = 1; ly < TH - 1; ly++) for (let lx = 1; lx < TW - 1; lx++) {
      const [x, y] = L(lx, ly);
      if (t[I(x, y)] === 'l' && !solid[I(x, y)] && r() < 0.09) deco[I(x, y)] = 'flowers';
    }

    // ----- Titan's lair: farthest land tile, ringed by mountains -----
    let best = null;
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++)
      if (t[I(x, y)] !== 'w' && (!best || Math.hypot(x - cx, y - cy) > best.d)) best = { x, y, d: Math.hypot(x - cx, y - cy) };
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(best.x + dx, best.y + dy, Math.max(Math.abs(dx), Math.abs(dy)) === 2 ? 'm' : 'r');

    // ----- Reachability on starting Wheels -----
    const spawn = L(4, 7);
    const passable = (x, y, legs) => x >= 0 && y >= 0 && x < W && y < H && !solid[I(x, y)] && AF.TERRAIN[CH[t[I(x, y)]]].legs <= legs;
    const reach = new Set([key(...spawn)]), q = [spawn];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (passable(nx, ny, 1) && !reach.has(key(nx, ny))) { reach.add(key(nx, ny)); q.push([nx, ny]); }
      }
    }

    // ----- Resource nodes and ruins (fixed for everyone) -----
    const nodes = {}, ruins = [];
    const lair = { x: best.x, y: best.y };
    const free = (x, y) => !near(x, y, 2) && !nodes[key(x, y)] && !ruins.includes(key(x, y)) && !(Math.abs(x - lair.x) <= 2 && Math.abs(y - lair.y) <= 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!free(x, y)) continue;
      const c = CH[t[I(x, y)]], roll = r(), d = Math.hypot(x - cx, y - cy);
      let n = null;
      if ((c === 'grass' || c === 'forest') && roll < 0.012 && d > 22) n = 'scrap';
      else if (c === 'rubble') n = roll < 0.025 ? 'copper' : roll < 0.035 ? 'scrap' : null;
      else if (c === 'sand' && roll < 0.018) n = 'silicon';
      else if (c === 'mountain' && roll < 0.025) n = 'arcite';
      else if (c === 'forest' && roll < 0.004 && d > 26) n = 'arcite';
      if (n) nodes[key(x, y)] = n;
    }
    const starter = ['scrap', 'scrap', 'scrap', 'scrap', 'scrap', 'copper', 'copper', 'copper', 'silicon'];
    let guard = 0;
    while (starter.length && guard++ < 4000) {
      const x = AF.randInt(r, TX - 9, TX + TW + 8), y = AF.randInt(r, TY - 9, TY + TH + 8), c = CH[t[I(x, y)]];
      if (reach.has(key(x, y)) && (c === 'grass' || c === 'sand' || c === 'forest') && free(x, y)) nodes[key(x, y)] = starter.pop();
    }
    guard = 0;
    while (ruins.length < 22 && guard++ < 8000) {
      const x = AF.randInt(r, 2, W - 3), y = AF.randInt(r, 2, H - 3);
      if (t[I(x, y)] !== 'w' && Math.hypot(x - cx, y - cy) > 20 && free(x, y)) ruins.push(key(x, y));
    }

    const mp = { w: W, h: H, t, solid, deco, signs, buildings, doors, nodes, ruins, lair, spawn, reach: reach.size, I };
    // ----- Starting enemies (same for everyone) -----
    mp.enemies0 = [];
    let id = 1;
    for (let i = 0; i < 80; i++) {
      for (let tries = 0; tries < 300; tries++) {
        const x = AF.randInt(r, 1, W - 2), y = AF.randInt(r, 1, H - 2);
        if (!enemyOK(mp, x, y, mp.enemies0) || Math.hypot(x - cx, y - cy) < 23) continue;
        const pool = AF.TIERS[tierFor(Math.hypot(x - cx, y - cy), r)];
        mp.enemies0.push({ id: id++, type: pool[Math.floor(r() * pool.length)], x, y }); break;
      }
    }
    mp.enemies0.push({ id: id++, type: 'titan', x: lair.x, y: lair.y, boss: true });
    return mp;
  }

  function tierFor(d, r) {
    if (d < 25) return 1;
    if (d < 30) return r() < 0.7 ? 1 : 2;
    if (d < 38) return r() < 0.2 ? 1 : r() < 0.85 ? 2 : 3;
    return r() < 0.35 ? 2 : 3;
  }
  const terr = (mp, x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : CH[mp.t[y * W + x]];
  function enemyOK(mp, x, y, list, w) {
    const c = terr(mp, x, y);
    return c && AF.TERRAIN[c].legs <= 2 && !mp.solid[y * W + x] && !(mp.nodes && mp.nodes[x + ',' + y]) && !(mp.ruins && mp.ruins.includes(x + ',' + y)) && !(x >= TX - 2 && y >= TY - 2 && x < TX + TW + 2 && y < TY + TH + 2)
      && !list.some((e) => e.x === x && e.y === y) && !(w && w.rx === x && w.ry === y)
      && !(Math.abs(x - mp.lair.x) <= 2 && Math.abs(y - mp.lair.y) <= 2);
  }

  // ---------- Per-save world state ----------
  function init() {
    const mp = map();
    const w = { px: mp.spawn[0], py: mp.spawn[1], rx: mp.spawn[0], ry: mp.spawn[1], dir: 'down', rdir: 'down',
      ready: {}, opened: {}, enemies: mp.enemies0.map((e) => Object.assign({}, e)), nextId: mp.enemies0.length + 1,
      fog: Array.from({ length: W * H }, (_, i) => (inTownXY(i % W, Math.floor(i / W)) ? '1' : '0')).join('') };
    reveal(w);
    return w;
  }
  function reveal(w) {
    const f = w.fog.split('');
    for (let dy = -VISION; dy <= VISION; dy++) for (let dx = -VISION; dx <= VISION; dx++) {
      const x = w.px + dx, y = w.py + dy;
      if (x >= 0 && y >= 0 && x < W && y < H && dx * dx + dy * dy <= VISION * VISION + 2) f[y * W + x] = '1';
    }
    w.fog = f.join('');
  }

  // ---------- NPC positions (not saved; they wander around their home spot) ----------
  let npcs = null;
  function npcList() {
    if (!npcs) npcs = Object.entries(AF.NPCS).map(([id, n]) => ({ id, x: TX + n.x, y: TY + n.y, hx: TX + n.x, hy: TY + n.y, dir: n.dir || 'down' }));
    return npcs;
  }
  const npcAt = (x, y) => npcList().find((n) => n.x === x && n.y === y);

  // ---------- A turn: the pilot moves, the automaton follows, the world reacts ----------
  const DXY = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  // What's on a tile that blocks walking and can be interacted with.
  function thingAt(state, x, y) {
    const mp = map(), w = state.world, k = key(x, y);
    if (mp.doors[k]) { const id = mp.doors[k]; return { kind: 'door', id, label: AF.SHOPS.includes(id) ? 'Enter' : 'Knock' }; }
    const npc = npcAt(x, y); if (npc) return { kind: 'talk', npc: npc.id, label: 'Talk', tall: true };
    if (mp.signs[k]) return { kind: 'sign', text: mp.signs[k], label: 'Read' };
    if (mp.nodes[k]) { const ready = (w.ready[k] || 0) <= state.steps; return { kind: 'node', k, label: ready ? (mp.nodes[k] === 'scrap' ? 'Pick up' : 'Gather') : 'Depleted' }; }
    if (mp.ruins.includes(k)) return { kind: 'ruin', k, label: w.opened[k] ? 'Searched' : 'Search' };
    if (mp.deco[y * W + x] === 'fountain') return { kind: 'fountain', label: 'Look', tall: true };
    return null;
  }
  // The thing directly in front of the pilot (used for the on-screen prompt).
  function facing(state) {
    if (state.world.inside) return AF.Interiors.facing(state);
    const w = state.world, [dx, dy] = DXY[w.dir] || [0, 1], x = w.px + dx, y = w.py + dy;
    const t = thingAt(state, x, y);
    if (!t) return null;
    if (t.kind === 'fountain') { // fountain is 2×2; put the prompt over its middle
      const mp = map(); let fx = x, fy = y;
      if (mp.deco[y * W + x - 1] === 'fountain' || mp.deco[(y - 1) * W + x - 1] === 'fountain') fx = x - 1;
      return Object.assign(t, { x: fx + 0.5, y: fy });
    }
    return Object.assign(t, { x, y });
  }
  function face(state, dir) { state.world.dir = dir; }

  // A turn: the pilot steps, the automaton follows, the world reacts.
  function move(state, dx, dy) {
    if (state.world.inside) return AF.Interiors.move(state, dx, dy);
    const mp = map(), w = state.world, nx = w.px + dx, ny = w.py + dy, st = AF.stats(state);
    w.dir = DIRS[dx + ',' + dy];
    const c = terr(mp, nx, ny);
    if (!c) return { type: 'blocked', text: 'The edge of the known world.' };
    if (thingAt(state, nx, ny) || mp.solid[ny * W + nx]) return { type: 'bump' };
    if (!state.flags.robot && inTownXY(w.px, w.py) && !inTownXY(nx, ny)) return { type: 'talk', npc: 'rook' };
    const need = AF.TERRAIN[c].legs;
    if (st.legs < need)
      return { type: 'blocked', text: `Your ${AF.PARTS.legs.tiers[st.legs - 1]} can't cross ${AF.TERRAIN[c].name}. Upgrade Locomotion to ${AF.PARTS.legs.tiers[need - 1]} at the Garage.` };
    const foe = w.enemies.find((e) => e.x === nx && e.y === ny);
    if (foe) return { type: 'battle', enemy: foe };

    // move
    const wasInTown = inTownXY(w.px, w.py);
    w.rdir = DIRS[Math.sign(w.px - w.rx) + ',' + Math.sign(w.py - w.ry)] || w.rdir;
    w.rx = w.px; w.ry = w.py; w.px = nx; w.py = ny; state.steps++;
    reveal(w);
    const msgs = [], nowInTown = inTownXY(nx, ny), k = key(nx, ny);
    if (nowInTown && !wasInTown) msgs.push(`Back in ${AF.TOWN_NAME}.`);

    const p = state.pilot;
    if (!nowInTown && state.steps % (12 + (AF.hasPerk(state, 'endurance') ? 4 : 0) + Math.round(AF.stats(state).hunger)) === 0 && p.vit > 0) {
      p.vit--;
      if (p.vit === 0) msgs.push('Your pilot is exhausted: less energy in battle and smaller harvests. Eat something!');
      else if (p.vit === 5) msgs.push('Your pilot is getting hungry.');
    }
    // enemies
    const r = AF.rng(state.seed ^ (state.steps * 2654435761));
    let ambush = null;
    for (const e of w.enemies) {
      if (e.boss) continue;
      const d = Math.abs(e.x - w.px) + Math.abs(e.y - w.py);
      let step = null;
      if (d <= 6 && !nowInTown && r() < 0.55) {
        const sx = Math.sign(w.px - e.x), sy = Math.sign(w.py - e.y);
        step = Math.abs(w.px - e.x) >= Math.abs(w.py - e.y) ? [sx, 0] : [0, sy];
      } else if (r() < 0.25) step = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
      if (!step) continue;
      const tx = e.x + step[0], ty = e.y + step[1];
      if (tx === w.px && ty === w.py && !nowInTown) { ambush = e; continue; }
      if (enemyOK(mp, tx, ty, w.enemies, w)) { e.x = tx; e.y = ty; }
    }
    if (state.steps % 40 === 0 && w.enemies.length < 70) {
      for (let tries = 0; tries < 200; tries++) {
        const x = AF.randInt(r, 1, W - 2), y = AF.randInt(r, 1, H - 2), d = Math.hypot(x - (W >> 1), y - (H >> 1));
        if (d < 24 || Math.abs(x - w.px) + Math.abs(y - w.py) < 10 || !enemyOK(mp, x, y, w.enemies, w)) continue;
        const pool = AF.TIERS[tierFor(d, r)];
        w.enemies.push({ id: w.nextId++, type: pool[Math.floor(r() * pool.length)], x, y }); break;
      }
    }
    // townsfolk wander
    if (nowInTown || wasInTown) for (const n of npcList()) {
      if (!AF.NPCS[n.id].wander || r() > 0.3) continue;
      const [ddx, ddy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)], tx = n.x + ddx, ty = n.y + ddy;
      const cc = terr(mp, tx, ty);
      if (Math.abs(tx - n.hx) > 2 || Math.abs(ty - n.hy) > 2 || mp.solid[ty * W + tx] || !(cc === 'lawn' || cc === 'path') || npcAt(tx, ty)
        || (tx === w.px && ty === w.py) || (tx === w.rx && ty === w.ry) || mp.doors[key(tx, ty)]) continue;
      n.x = tx; n.y = ty; n.dir = DIRS[ddx + ',' + ddy];
    }
    if (ambush) return { type: 'battle', enemy: ambush, ambush: true, text: msgs.join(' ') };
    return msgs.length ? { type: 'msg', text: msgs.join(' ') } : null;
  }

  // Press the interact button: act on whatever is in front of the pilot.
  function interact(state) {
    if (state.world.inside) return AF.Interiors.interact(state);
    const t = facing(state);
    if (!t) return null;
    const mp = map(), w = state.world, st = AF.stats(state), p = state.pilot;
    if (t.kind === 'door') return { type: 'door', id: t.id };
    if (t.kind === 'talk') { const n = npcAt(t.x, t.y); n.dir = { down: 'up', up: 'down', left: 'right', right: 'left' }[w.dir]; return { type: 'talk', npc: t.npc }; }
    if (t.kind === 'sign') return { type: 'sign', text: t.text };
    if (t.kind === 'fountain') return { type: 'msg', text: 'The Arc Fountain hums with warm blue light.' };
    if (t.kind === 'node') {
      const k = t.k, def = AF.NODES[mp.nodes[k]];
      if ((w.ready[k] || 0) > state.steps) return { type: 'msg', text: `${def.label} is depleted. It regrows in ${w.ready[k] - state.steps} steps.` };
      if (def.arms && state.parts.arms < def.arms) return { type: 'msg', text: `${def.label}: too hard for Grabbers. Upgrade Arms to Drill Arms at the Garage.` };
      const r = AF.rng(state.seed + state.steps * 7 + t.x);
      let amt = AF.randInt(r, def.amount[0], def.amount[1]) + (st.gather - 1) + (AF.hasPerk(state, 'scavenger') ? 1 : 0);
      if (p.vit <= 0) amt = Math.max(1, amt - 2);
      AF.gain(state.res, { [def.res]: amt });
      w.ready[k] = state.steps + def.respawn;
      AF.sfx('gather');
      AF.Render.burst(t.x + 0.5, t.y + 0.5, def.res, 12);
      AF.Quests.event(state, 'gather', { res: def.res, amt });
      return { type: 'msg', text: `+${amt} ${AF.RES[def.res].name}` };
    }
    if (t.kind === 'ruin') {
      const k = t.k;
      if (w.opened[k]) return { type: 'msg', text: 'You already searched this ruin.' };
      w.opened[k] = 1;
      const locked = Object.keys(AF.CARDS).filter((id) => !state.known.includes(id));
      const r = AF.rng(AF.WORLD_SEED + t.x * 131 + t.y * 977 + state.steps);
      const cr = AF.randInt(r, 80, 200);
      state.credits += cr;
      AF.sfx('forge'); AF.Render.burst(t.x + 0.5, t.y + 0.3, 'sparkle', 16);
      AF.Quests.event(state, 'ruin', {});
      if (locked.length) { const id = locked[Math.floor(r() * locked.length)]; state.known.push(id); return { type: 'msg', text: `Ruin searched: blueprint for ${AF.CARDS[id].name} and ${AF.moneyText(cr)}!` }; }
      AF.gain(state.res, { circuits: 2, copper: 4 });
      return { type: 'msg', text: `Ruin searched: 2 Circuits, 4 Copper and ${AF.moneyText(cr)}.` };
    }
    return null;
  }

  function removeEnemy(state, id) { state.world.enemies = state.world.enemies.filter((e) => e.id !== id); }
  function sendHome(state) {
    const w = state.world, mp = map();
    w.inside = null; w.px = mp.spawn[0]; w.py = mp.spawn[1]; w.rx = w.px + 1; w.ry = w.py; w.dir = 'down';
    reveal(w); AF.Render.snap();
  }
  // Put the automaton on a free tile next to the pilot.
  function placeRobot(state) {
    const mp = map(), w = state.world;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const x = w.px + dx, y = w.py + dy;
      if (!mp.solid[y * W + x] && !npcAt(x, y)) { w.rx = x; w.ry = y; return; }
    }
  }
  const inTown = (state) => !!state.world.inside || inTownXY(state.world.px, state.world.py);
  function describeHere(state) {
    if (state.world.inside) return AF.BUILDINGS[state.world.inside].name;
    const mp = map(), w = state.world, k = key(w.px, w.py);
    const ahead = mp.doors[key(w.px, w.py - 1)];
    if (ahead) return AF.BUILDINGS[ahead].name;
    if (inTown(state)) return AF.TOWN_NAME;
    if (mp.nodes[k]) return AF.NODES[mp.nodes[k]].label;
    if (mp.ruins.includes(k)) return 'Searched ruin';
    return AF.TERRAIN[terr(mp, w.px, w.py)].name;
  }
  function terrainHere(state) { if (state.world.inside) return 'path'; return terr(map(), state.world.px, state.world.py); }

  function drawMap(canvas, state) {
    const mp = map(), w = state.world, g = canvas.getContext('2d'), s = 3;
    canvas.width = W * s; canvas.height = H * s;
    g.fillStyle = '#20303a'; g.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (w.fog[y * W + x] !== '1') continue;
      g.fillStyle = AF.TERRAIN[CH[mp.t[y * W + x]]].color;
      if (mp.solid[y * W + x] && mp.deco[y * W + x] === 'tree') g.fillStyle = '#3c9a3c';
      g.fillRect(x * s, y * s, s, s);
    }
    g.fillStyle = '#e05848';
    for (const b of mp.buildings) g.fillRect(b.x * s, b.y * s, b.w * s, b.h * s);
    g.fillStyle = '#5ef2e1';
    for (const k of mp.ruins) { if (w.opened[k]) continue; const [x, y] = k.split(',').map(Number); if (w.fog[y * W + x] === '1') g.fillRect(x * s, y * s, s, s); }
    if (w.fog[mp.lair.y * W + mp.lair.x] === '1') { g.fillStyle = '#ff3b5c'; g.fillRect((mp.lair.x - 1) * s, (mp.lair.y - 1) * s, s * 3, s * 3); }
    g.fillStyle = '#ffffff'; g.fillRect((w.px - 1) * s, (w.py - 1) * s, s * 3, s * 3);
    g.strokeStyle = '#202830'; g.strokeRect((w.px - 1) * s + 0.5, (w.py - 1) * s + 0.5, s * 3 - 1, s * 3 - 1);
    return Math.round(((w.fog.split('1').length - 1) / (W * H)) * 100);
  }

  AF.World = { map, init, placeRobot, move, interact, facing, face, drawMap, draw: (c, s, t) => AF.Render.draw(c, s, t), removeEnemy, sendHome, inTown, describeHere, terrainHere, npcList,
    terrainAt: (state, x, y) => terr(map(), x, y) };
})();
