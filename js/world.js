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
      if ((c === 'grass' || c === 'forest') && roll < 0.03 && d > 22) n = 'scrap';
      else if (c === 'rubble') n = roll < 0.07 ? 'copper' : roll < 0.1 ? 'scrap' : null;
      else if (c === 'sand' && roll < 0.05) n = 'silicon';
      else if (c === 'mountain' && roll < 0.07) n = 'arcite';
      else if (c === 'forest' && roll < 0.008 && d > 26) n = 'arcite';
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
    return c && AF.TERRAIN[c].legs <= 2 && !mp.solid[y * W + x] && !(x >= TX - 2 && y >= TY - 2 && x < TX + TW + 2 && y < TY + TH + 2)
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

  // ---------- A turn: the pilot moves, the robot follows, the world reacts ----------
  function move(state, dx, dy) {
    const mp = map(), w = state.world, nx = w.px + dx, ny = w.py + dy, st = AF.stats(state.parts);
    w.dir = DIRS[dx + ',' + dy];
    const c = terr(mp, nx, ny);
    if (!c) return { type: 'blocked', text: 'The edge of the known world.' };
    const k = key(nx, ny);
    if (mp.doors[k]) return { type: 'door', id: mp.doors[k] };
    const npc = npcAt(nx, ny);
    if (npc) { npc.dir = { down: 'up', up: 'down', left: 'right', right: 'left' }[w.dir]; return { type: 'talk', npc: npc.id }; }
    if (mp.signs[k]) return { type: 'sign', text: mp.signs[k] };
    if (mp.solid[ny * W + nx]) return { type: 'bump', text: mp.deco[ny * W + nx] === 'fountain' ? 'The Arc Fountain hums with warm blue light.' : '' };
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
    const msgs = [], nowInTown = inTownXY(nx, ny);
    if (nowInTown && !wasInTown) msgs.push(`Back in ${AF.TOWN_NAME}.`);

    const p = state.pilot;
    if (!nowInTown && state.steps % (AF.hasPerk(state, 'endurance') ? 16 : 12) === 0 && p.vit > 0) {
      p.vit--;
      if (p.vit === 0) msgs.push('Your pilot is exhausted: less energy in battle and smaller harvests. Eat something!');
      else if (p.vit === 5) msgs.push('Your pilot is getting hungry.');
    }
    const node = mp.nodes[k];
    if (node) {
      const def = AF.NODES[node];
      if ((w.ready[k] || 0) > state.steps) msgs.push(`${def.label} is depleted. It regrows in ${w.ready[k] - state.steps} steps.`);
      else if (def.arms && state.parts.arms < def.arms) msgs.push(`${def.label}: too hard for Grabbers. Upgrade Arms to Drill Arms at the Garage.`);
      else {
        const r = AF.rng(state.seed + state.steps * 7);
        let amt = AF.randInt(r, def.amount[0], def.amount[1]) + (st.gather - 1) + (AF.hasPerk(state, 'scavenger') ? 1 : 0);
        if (p.vit <= 0) amt = Math.max(1, amt - 2);
        AF.gain(state.res, { [def.res]: amt });
        w.ready[k] = state.steps + def.respawn;
        msgs.push(`Gathered ${amt} ${AF.RES[def.res].name}.`);
        AF.sfx('gather');
        AF.Quests.event(state, 'gather', { res: def.res, amt });
      }
    }
    if (mp.ruins.includes(k) && !w.opened[k]) {
      w.opened[k] = 1;
      const locked = Object.keys(AF.CARDS).filter((id) => !state.known.includes(id));
      const r = AF.rng(AF.WORLD_SEED + nx * 131 + ny * 977 + state.steps);
      const cr = AF.randInt(r, 8, 20);
      state.credits += cr;
      if (locked.length) {
        const id = locked[Math.floor(r() * locked.length)];
        state.known.push(id);
        msgs.push(`Ruin searched: blueprint for ${AF.CARDS[id].name} and ${cr} credits!`);
      } else { AF.gain(state.res, { circuits: 2, copper: 4 }); msgs.push(`Ruin searched: 2 Circuits, 4 Copper and ${cr} credits.`); }
      AF.sfx('forge');
      AF.Quests.event(state, 'ruin', {});
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

  function removeEnemy(state, id) { state.world.enemies = state.world.enemies.filter((e) => e.id !== id); }
  function sendHome(state) {
    const w = state.world, mp = map();
    w.px = mp.spawn[0]; w.py = mp.spawn[1]; w.rx = w.px + 1; w.ry = w.py; w.dir = 'down';
    reveal(w); snap = null;
  }
  // Put the robot on a free tile next to the pilot.
  function placeRobot(state) {
    const mp = map(), w = state.world;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const x = w.px + dx, y = w.py + dy;
      if (!mp.solid[y * W + x] && !npcAt(x, y)) { w.rx = x; w.ry = y; return; }
    }
  }
  const inTown = (state) => inTownXY(state.world.px, state.world.py);
  function describeHere(state) {
    const mp = map(), w = state.world, k = key(w.px, w.py);
    const ahead = mp.doors[key(w.px, w.py - 1)];
    if (ahead) return AF.BUILDINGS[ahead].name;
    if (inTown(state)) return AF.TOWN_NAME;
    if (mp.nodes[k]) return AF.NODES[mp.nodes[k]].label;
    if (mp.ruins.includes(k)) return 'Searched ruin';
    return AF.TERRAIN[terr(mp, w.px, w.py)].name;
  }
  function terrainHere(state) { return terr(map(), state.world.px, state.world.py); }

  // ---------- Drawing ----------
  let staticLayer = null;
  function buildStatic() {
    const mp = map(), P = AF.Pixel, C = P.COL;
    const cv = P.canvas(W * TS, H * TS), g = cv.getContext('2d');
    const R = (x, y, w, h, c) => P.R(g, x, y, w, h, c);
    const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = CH[mp.t[y * W + x]], px = x * TS, py = y * TS;
      g.drawImage(P.tile(c, hash(x, y) % 4), px, py);
      const nb = (dx, dy) => terr(mp, x + dx, y + dy);
      if (c === 'water') {
        if (nb(0, -1) && nb(0, -1) !== 'water') { R(px, py, 16, 1, '#f0fbff'); R(px, py + 1, 16, 1, C.w2); }
        if (nb(0, 1) && nb(0, 1) !== 'water') { R(px, py + 15, 16, 1, '#f0fbff'); R(px, py + 14, 16, 1, C.w2); }
        if (nb(-1, 0) && nb(-1, 0) !== 'water') { R(px, py, 1, 16, '#f0fbff'); R(px + 1, py, 1, 16, C.w2); }
        if (nb(1, 0) && nb(1, 0) !== 'water') { R(px + 15, py, 1, 16, '#f0fbff'); R(px + 14, py, 1, 16, C.w2); }
      } else if (c === 'mountain') {
        if (nb(0, 1) && nb(0, 1) !== 'mountain') { R(px, py + 10, 16, 6, C.m2); R(px, py + 10, 16, 1, C.m4); for (let i = 1; i < 16; i += 4) R(px + i, py + 11, 1, 5, C.m4); }
        if (nb(0, -1) && nb(0, -1) !== 'mountain') R(px, py, 16, 2, C.m3);
        if (nb(-1, 0) && nb(-1, 0) !== 'mountain') R(px, py, 1, 16, C.m4);
        if (nb(1, 0) && nb(1, 0) !== 'mountain') R(px + 15, py, 1, 16, C.m4);
      } else if (c === 'path') {
        const edge = (n) => n && n !== 'path';
        if (edge(nb(0, -1))) R(px, py, 16, 1, C.p2);
        if (edge(nb(0, 1))) R(px, py + 15, 16, 1, C.p2);
        if (edge(nb(-1, 0))) R(px, py, 1, 16, C.p2);
        if (edge(nb(1, 0))) R(px + 15, py, 1, 16, C.p2);
      } else if (c === 'forest' && nb(0, 1) !== 'forest') R(px, py + 15, 16, 1, C.t2);
    }
    // decorations and buildings
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = mp.deco[y * W + x]; if (!d) continue;
      if (d === 'fountain') g.drawImage(P.fountain(), x * TS - 1, y * TS - 1);
      else g.drawImage(P.deco(d), x * TS - 1, y * TS - 1);
    }
    for (const b of mp.buildings) {
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(b.x * TS + 3, b.y * TS + 4, b.w * TS, b.h * TS);
      g.drawImage(P.building(b.id), b.x * TS - 1, b.y * TS - 1);
    }
    // lair marker
    const lx = mp.lair.x * TS, ly = mp.lair.y * TS;
    R(lx - 16, ly - 16, 48, 48, 'rgba(60,20,30,.25)');
    staticLayer = cv;
  }

  let snap = null, buf = null;
  function draw(canvas, state, time) {
    if (!staticLayer) buildStatic();
    const mp = map(), w = state.world, P = AF.Pixel, g = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1, cw = canvas.clientWidth, chh = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(chh * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr); }
    // zoom: whole-pixel scale so a screen shows roughly 15×11 tiles (more on big screens)
    const Z = Math.max(2, Math.min(5, Math.floor(Math.min((cw * dpr) / (15 * TS), (chh * dpr) / (11 * TS)))));
    const vw = Math.ceil(canvas.width / Z), vh = Math.ceil(canvas.height / Z);
    if (!buf || buf.width !== vw || buf.height !== vh) buf = P.canvas(vw, vh);
    const b = buf.getContext('2d'); b.imageSmoothingEnabled = false;
    if (!snap || Math.abs(snap.px - w.px) > 3 || Math.abs(snap.py - w.py) > 3) snap = { px: w.px, py: w.py, rx: w.rx, ry: w.ry };
    const ease = (a, t2) => { const d = t2 - a; return Math.abs(d) < 0.02 ? t2 : a + d * 0.28; };
    snap.px = ease(snap.px, w.px); snap.py = ease(snap.py, w.py); snap.rx = ease(snap.rx, w.rx); snap.ry = ease(snap.ry, w.ry);
    const camX = Math.round(snap.px * TS + 8 - vw / 2), camY = Math.round(snap.py * TS + 8 - vh / 2);
    b.fillStyle = AF.Pixel.COL.w1; b.fillRect(0, 0, vw, vh);
    const sx = Math.max(0, camX), sy = Math.max(0, camY), ex = Math.min(W * TS, camX + vw), ey = Math.min(H * TS, camY + vh);
    if (ex > sx && ey > sy) b.drawImage(staticLayer, sx, sy, ex - sx, ey - sy, sx - camX, sy - camY, ex - sx, ey - sy);

    // sprites, sorted by row so lower things draw in front
    const sprites = [], tx0 = Math.floor(camX / TS) - 1, ty0 = Math.floor(camY / TS) - 1, tx1 = tx0 + vw / TS + 3, ty1 = ty0 + vh / TS + 3;
    const inView = (x, y) => x >= tx0 && x <= tx1 && y >= ty0 && y <= ty1;
    const at = (img, x, y, oy) => b.drawImage(img, Math.round(x * TS - camX - 1), Math.round(y * TS - camY - 1 - (oy || 0)));
    for (const [k, n] of Object.entries(mp.nodes)) {
      const [x, y] = k.split(',').map(Number); if (!inView(x, y)) continue;
      const ready = (w.ready[k] || 0) <= state.steps;
      sprites.push([y - 0.1, () => { b.globalAlpha = ready ? 1 : 0.35; at(P.node(n), x, y); b.globalAlpha = 1; }]);
    }
    for (const k of mp.ruins) { const [x, y] = k.split(',').map(Number); if (inView(x, y)) sprites.push([y - 0.1, () => at(P.ruin(!!w.opened[k]), x, y)]); }
    const f2 = Math.floor(time / 400) % 2;
    for (const e of w.enemies) {
      if (!inView(e.x, e.y)) continue;
      const spr = P.enemy(e.type, f2);
      sprites.push([e.y, () => e.boss ? b.drawImage(spr, Math.round(e.x * TS - camX - 8), Math.round(e.y * TS - camY - 14)) : at(spr, e.x, e.y)]);
    }
    for (const n of npcList()) if (inView(n.x, n.y)) sprites.push([n.y, () => at(AF.pilotSprite(AF.NPCS[n.id].look, n.dir, 0), n.x, n.y, 8)]);
    const moving = Math.abs(snap.px - w.px) + Math.abs(snap.py - w.py) > 0.03, wf = moving ? 1 + (Math.floor(time / 140) % 2) : 0;
    if (state.flags.robot) {
      const rm = Math.abs(snap.rx - w.rx) + Math.abs(snap.ry - w.ry) > 0.03;
      sprites.push([snap.ry, () => at(P.robot(state.parts, AF.coreColor(state.look), w.rdir, rm ? Math.floor(time / 140) % 2 : Math.floor(time / 500) % 2), snap.rx, snap.ry, 1)]);
    }
    sprites.push([snap.py + 0.01, () => at(AF.pilotSprite(state.look, w.dir, wf), snap.px, snap.py, 8)]);
    sprites.sort((a, c) => a[0] - c[0]).forEach((s) => s[1]());

    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
    g.drawImage(buf, 0, 0, vw * Z, vh * Z);
  }

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

  AF.World = { map, init, placeRobot, move, draw, drawMap, removeEnemy, sendHome, inTown, describeHere, terrainHere, npcList,
    terrainAt: (state, x, y) => terr(map(), x, y) };
})();
