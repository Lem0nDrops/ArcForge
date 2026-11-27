/* Automata: ArcForge — the world.
   Two areas, both built once from AF.WORLD_SEED so every player explores the same world:
     'over'    — the 256×256 overworld in four regions: the Heartland (Rivet Hollow, the Brass Road, Brasshaven),
                 Frostpeak (north-east), Mirewood (south-west) and the Ashlands (south-east, the Titan's lair),
                 with Gearwind Outpost at the crossroads
     'foundry' — the Sunken Foundry, a hand-planned dungeon north of Brasshaven
   Each save only stores what changes. The area you're not in is parked in world.store. */
(function () {
  const AF = (window.AF = window.AF || {});
  const OW = 256, OH = 256;
  // Rivet Hollow (34×28), Brasshaven (26×22) and Gearwind Outpost (24×18) at the crossroads of the four regions
  const T1 = { id: 1, x: 26, y: 54, w: 34, h: 28 }, T2 = { id: 2, x: 92, y: 24, w: 26, h: 22 }, T3 = { id: 3, x: 138, y: 120, w: 24, h: 18 };
  const TOWNS = [T1, T2, T3];
  const townById = (id) => TOWNS.find((T) => T.id === id) || T1;
  const CH = { w: 'water', s: 'sand', g: 'grass', f: 'forest', r: 'rubble', m: 'mountain', p: 'path', l: 'lawn', F: 'dfloor', X: 'dwall',
    n: 'snow', P: 'pine', i: 'ice', b: 'bog', M: 'mire', a: 'ash', B: 'basalt', v: 'lava' };
  // Regions: 0 Heartland, 1 Frostpeak, 2 Mirewood, 3 Ashlands. Centre and radius shape each region's landmass.
  const REGIONS = [
    { id: 'heart', name: 'The Heartland', cx: 64, cy: 66, rad: 66 },
    { id: 'frost', name: 'Frostpeak', cx: 194, cy: 60, rad: 72 },
    { id: 'mire', name: 'Mirewood', cx: 62, cy: 194, rad: 72 },
    { id: 'ash', name: 'The Ashlands', cx: 194, cy: 194, rad: 72 },
  ];
  const key = (x, y) => x + ',' + y;
  const DIRS = { '0,1': 'down', '0,-1': 'up', '-1,0': 'left', '1,0': 'right' };
  const townAt = (x, y) => TOWNS.find((t) => x >= t.x && y >= t.y && x < t.x + t.w && y < t.y + t.h) || null;

  // ---------- Which area are we drawing / moving in? ----------
  const MAPS = {};
  const curArea = () => (AF.game && AF.game.state && AF.game.state.world && AF.game.state.world.area) || 'over';
  function map(state) {
    const a = state && state.world ? state.world.area || 'over' : curArea();
    if (!MAPS[a]) MAPS[a] = a === 'foundry' ? buildFoundry() : buildOverworld();
    return MAPS[a];
  }
  const over = () => (MAPS.over || (MAPS.over = buildOverworld()));

  function valueNoise(r, scale, W, H) {
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

  function buildOverworld() {
    let best = null;
    for (let k = 0; k < 12; k++) { const m = buildOver(AF.WORLD_SEED + k * 101); if (!best || m.reach > best.reach) best = m; if (m.reach >= 16000) break; }
    return best;
  }

  function buildOver(seed) {
    const W = OW, H = OH, r = AF.rng(seed);
    const n1 = valueNoise(r, 22, W, H), n2 = valueNoise(r, 9, W, H), m1 = valueNoise(r, 16, W, H), nb = valueNoise(r, 34, W, H), nl = valueNoise(r, 13, W, H);
    const t = new Array(W * H), solid = new Uint8Array(W * H), deco = new Array(W * H).fill(null), region = new Uint8Array(W * H);
    const I = (x, y) => y * W + x;
    const nearTown = (x, y, pad) => TOWNS.some((T) => x >= T.x - pad && y >= T.y - pad && x < T.x + T.w + pad && y < T.y + T.h + pad);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // wobbly borders between the four regions
      const bx = 130 + (nb(x, y) - 0.5) * 34, by = 132 + (nb(y + 40, x + 40) - 0.5) * 34;
      const rg = x < bx ? (y < by ? 0 : 2) : (y < by ? 1 : 3), R = REGIONS[rg];
      region[I(x, y)] = rg;
      const d = Math.hypot(x - R.cx, y - R.cy) / R.rad, edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      let e = n1(x, y) * 0.75 + n2(x, y) * 0.25 + 0.22 - d * d * 0.62;
      if (edge < 6) e -= (6 - edge) * 0.06;
      const m = m1(x, y);
      if (nearTown(x, y, 6)) e = Math.min(Math.max(e, 0.45), 0.6);
      let c;
      if (rg === 0) { // Heartland: moors, thickets, scrapfields
        if (e < 0.3) c = 'w'; else if (e < 0.34) c = 's'; else if (e > 0.72) c = 'm'; else if (e > 0.63) c = 'r'; else if (m > 0.62) c = 'f'; else if (m < 0.3) c = 's'; else c = 'g';
      } else if (rg === 1) { // Frostpeak: snowfields, frost pines, glaciers, peaks
        if (e < 0.28) c = 'w'; else if (e < 0.35) c = 'i'; else if (e > 0.82) c = 'm'; else if (e > 0.72) c = 'i'; else if (m > 0.58) c = 'P'; else c = 'n';
      } else if (rg === 2) { // Mirewood: bogs, mire forest, mossy moor
        if (e < 0.29) c = 'w'; else if (e < 0.4) c = 'b'; else if (e > 0.84) c = 'm'; else if (m > 0.55) c = 'M'; else if (m < 0.33) c = 'b'; else c = 'g';
      } else { // Ashlands: ash plains, basalt flows, lava rivers
        const lv = Math.abs(nl(x, y) - 0.5);
        if (e < 0.29) c = 'w'; else if (e < 0.34) c = 'a'; else if (e > 0.83) c = 'm'; else if (e > 0.44 && lv < 0.022) c = 'v'; else if (e > 0.7 || m > 0.64) c = 'B'; else c = 'a';
      }
      if (nearTown(x, y, 3)) c = rg === 0 ? 'g' : rg === 1 ? 'n' : rg === 2 ? 'g' : 'a';
      t[I(x, y)] = c;
    }
    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) t[I(x, y)] = c; };
    const signs = {}, buildings = [], doors = {}, bridges = {};
    const put = (x, y, kind, walk) => { deco[I(x, y)] = kind; solid[I(x, y)] = walk ? 0 : 1; };
    const sign = (x, y, text) => { put(x, y, 'sign'); signs[key(x, y)] = text; };
    // A road: a wobbly 2-wide path; water underneath becomes a bridge.
    const road = (ax, ay, bx, by, wob) => {
      let x = ax, y = ay, i = 0;
      const lay = (px, py) => { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= W || qy >= H || townAt(qx, qy)) continue; if (t[I(qx, qy)] === 'v') t[I(qx, qy)] = 'B'; if (t[I(qx, qy)] === 'w') bridges[key(qx, qy)] = 1; set(qx, qy, 'p'); solid[I(qx, qy)] = 0; deco[I(qx, qy)] = null; } };
      while ((x !== bx || y !== by) && i++ < 800) {
        lay(x, y);
        const dx = bx - x, dy = by - y, horiz = Math.abs(dx) > Math.abs(dy) ? (wob && Math.sin(i / 7) > 0.85 && dy ? false : true) : (wob && Math.sin(i / 6) > 0.85 && dx ? true : false);
        if (horiz && dx) x += Math.sign(dx); else if (dy) y += Math.sign(dy); else x += Math.sign(dx);
      }
      lay(bx, by);
    };

    // ----- Rivet Hollow: hand-built (local 0..33 × 0..27) -----
    {
      const T = T1, L = (lx, ly) => [T.x + lx, T.y + ly];
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) set(...L(lx, ly), 'l');
      const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(...L(x, y), 'p'); };
      path(16, 0, 17, 27); path(0, 13, 33, 14); path(2, 7, 31, 7); path(2, 24, 31, 24); path(12, 15, 21, 18);
      const lp = (lx, ly, kind) => { const [x, y] = L(lx, ly); put(x, y, kind, kind === 'flowers'); };
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) {
        const edge = lx === 0 || ly === 0 || lx === T.w - 1 || ly === T.h - 1;
        const gate = ((ly === 0 || ly === T.h - 1) && (lx === 16 || lx === 17)) || ((lx === 0 || lx === T.w - 1) && (ly === 13 || ly === 14));
        if (edge && !gate) lp(lx, ly, 'tree');
      }
      [[1, 1], [2, 1], [1, 2], [32, 1], [31, 1], [32, 2], [1, 26], [1, 25], [2, 26], [32, 26], [32, 25], [31, 26], [14, 1], [20, 1], [27, 1], [7, 1]].forEach(([a, b]) => lp(a, b, 'tree'));
      for (let ly = 15; ly <= 17; ly++) for (let lx = 3; lx <= 7; lx++) { const [x, y] = L(lx, ly); set(x, y, 'w'); solid[I(x, y)] = 1; }
      for (let lx = 2; lx <= 8; lx++) lp(lx, 18, 'fence');
      { const [x, y] = L(16, 16); deco[I(x, y)] = 'fountain'; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) solid[I(x + a, y + b)] = 1; }
      [[15, 8], [18, 8], [15, 23], [18, 23], [11, 15], [22, 15], [25, 12], [8, 12]].forEach(([a, b]) => lp(a, b, 'lamp'));
      [[30, 15], [31, 16], [13, 19], [24, 19]].forEach(([a, b]) => lp(a, b, 'barrel'));
      const ls = (lx, ly, text) => { const [x, y] = L(lx, ly); sign(x, y, text); };
      ls(14, 26, 'RIVET HOLLOW. "Every bolt has a story." South: the Rustfields.');
      ls(19, 1, 'North: the Glassdunes. Beware the Spark Spitters.');
      ls(1, 12, 'West: Old Pylon Road.');
      ls(32, 12, 'East: the Brass Road to BRASSHAVEN. Treads recommended beyond the river.');
      ls(23, 18, 'TOWN SQUARE. The Arc Well still hums with a sliver of the Titan Core\'s old power.');
    }
    // ----- Brasshaven: walled steam-town (local 0..25 × 0..21) -----
    {
      const T = T2, L = (lx, ly) => [T.x + lx, T.y + ly];
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) set(...L(lx, ly), 'l');
      const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(...L(x, y), 'p'); };
      path(0, 9, 25, 10); path(12, 0, 13, 21); path(1, 18, 24, 19); path(10, 11, 15, 17);
      const lp = (lx, ly, kind, walk) => { const [x, y] = L(lx, ly); put(x, y, kind, walk); };
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) {
        const edge = lx === 0 || ly === 0 || lx === T.w - 1 || ly === T.h - 1;
        const gate = ((ly === 0 || ly === T.h - 1) && (lx === 12 || lx === 13)) || ((lx === 0 || lx === T.w - 1) && (ly === 9 || ly === 10));
        if (edge && !gate) lp(lx, ly, 'stonewall');
      }
      { const [x, y] = L(12, 13); deco[I(x, y)] = 'clock'; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) solid[I(x + a, y + b)] = 1; }
      [[11, 8], [14, 8], [11, 11], [14, 11], [9, 17], [16, 17], [5, 11], [20, 11], [3, 20], [22, 20]].forEach(([a, b]) => lp(a, b, 'lamp'));
      [[8, 2], [16, 2], [24, 5], [1, 7], [24, 15], [17, 15]].forEach(([a, b]) => lp(a, b, 'pipes'));
      [[1, 12], [7, 12], [24, 12], [17, 8], [8, 8]].forEach(([a, b]) => lp(a, b, 'crate'));
      [[1, 11], [18, 12]].forEach(([a, b]) => lp(a, b, 'barrel'));
      const ls = (lx, ly, text) => { const [x, y] = L(lx, ly); sign(x, y, text); };
      ls(1, 8, 'BRASSHAVEN. City of steam and spellwork. West: the Brass Road home to Rivet Hollow.');
      ls(14, 1, 'North: THE SUNKEN FOUNDRY. Sealed by order of the Wayfarers\' Guild.');
      ls(16, 12, 'The Great Clock. It has not lost a second in two hundred years.');
    }
    // ----- Gearwind Outpost: a palisade camp at the crossroads (local 0..23 × 0..17) -----
    {
      const T = T3, L = (lx, ly) => [T.x + lx, T.y + ly];
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) set(...L(lx, ly), 'l');
      const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(...L(x, y), 'p'); };
      path(0, 8, 23, 9); path(11, 0, 12, 17); path(8, 10, 15, 13);
      const lp = (lx, ly, kind, walk) => { const [x, y] = L(lx, ly); put(x, y, kind, walk); };
      for (let ly = 0; ly < T.h; ly++) for (let lx = 0; lx < T.w; lx++) {
        const edge = lx === 0 || ly === 0 || lx === T.w - 1 || ly === T.h - 1;
        const gate = ((ly === 0 || ly === T.h - 1) && (lx === 11 || lx === 12)) || ((lx === 0 || lx === T.w - 1) && (ly === 8 || ly === 9));
        if (edge && !gate) lp(lx, ly, 'fence');
      }
      { const [x, y] = L(11, 11); deco[I(x, y)] = 'fountain'; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) solid[I(x + a, y + b)] = 1; }
      [[10, 7], [13, 7], [10, 14], [13, 14], [3, 10], [20, 10]].forEach(([a, b]) => lp(a, b, 'lamp'));
      [[2, 15], [3, 15], [21, 15], [21, 14], [16, 12], [7, 12]].forEach(([a, b]) => lp(a, b, 'crate'));
      [[20, 2], [2, 2]].forEach(([a, b]) => lp(a, b, 'barrel'));
      const ls = (lx, ly, text) => { const [x, y] = L(lx, ly); sign(x, y, text); };
      ls(1, 7, 'GEARWIND OUTPOST. Last warm hearth before the wilds. West: Brasshaven and the Heartland.');
      ls(13, 1, 'North-east: FROSTPEAK. Glaciers, frost pines and things that freeze your joints.');
      ls(10, 16, 'South-west: MIREWOOD. Mind the bogs: Treads at least.');
      ls(22, 10, 'South-east: THE ASHLANDS. Lava rivers and, beyond them, the Titan.');
    }
    // buildings (all towns)
    for (const [id, b] of Object.entries(AF.BUILDINGS)) {
      const T = townById(b.town), x = T.x + b.x, y = T.y + b.y, door = [x + Math.floor(b.w / 2), y + b.h - 1];
      for (let yy = y; yy < y + b.h; yy++) for (let xx = x; xx < x + b.w; xx++) { solid[I(xx, yy)] = 1; deco[I(xx, yy)] = null; }
      doors[key(...door)] = id;
      buildings.push({ id, x, y, w: b.w, h: b.h, door, town: T.id });
      // short path from the door to the nearest road
      for (let k = 1; k <= 4; k++) { const yy = door[1] + k; if (t[I(door[0], yy)] === 'p') break; set(door[0], yy, 'p'); deco[I(door[0], yy)] = null; solid[I(door[0], yy)] = 0; }
    }
    // flowers on open lawn
    for (const T of TOWNS) for (let ly = 1; ly < T.h - 1; ly++) for (let lx = 1; lx < T.w - 1; lx++) {
      const x = T.x + lx, y = T.y + ly;
      if (t[I(x, y)] === 'l' && !solid[I(x, y)] && !deco[I(x, y)] && r() < (T.id === 1 ? 0.07 : T.id === 2 ? 0.03 : 0.02)) deco[I(x, y)] = 'flowers';
    }

    // ----- The Brass Road and the way to the Foundry -----
    road(T1.x + T1.w, T1.y + 13, T2.x - 1, T2.y + 9, true);
    const cave = [T2.x + 12, T2.y - 12];
    road(T2.x + 12, T2.y - 1, cave[0], cave[1] + 1, false);
    // dry rocky ground around the Foundry mouth
    for (let dy = -7; dy <= 4; dy++) for (let dx = -8; dx <= 9; dx++) {
      const x = cave[0] + dx, y = cave[1] + dy;
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || townAt(x, y) || t[I(x, y)] === 'p') continue;
      if (t[I(x, y)] === 'w' || t[I(x, y)] === 's') { set(x, y, Math.abs(dx) + Math.abs(dy) > 9 ? 'g' : 'r'); solid[I(x, y)] = 0; deco[I(x, y)] = null; }
    }
    for (let dy = -3; dy <= 0; dy++) for (let dx = -4; dx <= 5; dx++) {
      const x = cave[0] + dx, y = cave[1] + dy;
      if (dy === 0 && (dx === 0 || dx === 1)) continue;
      set(x, y, Math.abs(dx) >= 3 || dy <= -2 ? 'm' : 'r'); solid[I(x, y)] = 0; deco[I(x, y)] = null;
    }
    set(cave[0], cave[1], 'r'); set(cave[0] + 1, cave[1], 'r');
    deco[I(cave[0], cave[1])] = 'cave'; solid[I(cave[0], cave[1])] = 1; solid[I(cave[0] + 1, cave[1])] = 1;
    sign(cave[0] - 1, cave[1] + 2, 'THE SUNKEN FOUNDRY. Old clockworks still walk its halls. Turn back, or bring a strong automaton.');
    // milestones on the Brass Road
    [[T1.x + T1.w + 6, T1.y + 12, 'The Brass Road. Brasshaven lies east.'], [Math.round((T1.x + T2.x) / 2) + 4, Math.round((T1.y + T2.y) / 2) - 2, 'Halfway Stone. Rivet Hollow ← → Brasshaven']].forEach(([x, y, txt]) => {
      for (let k = 0; k < 4; k++) { const yy = y - k; if (t[I(x, yy)] !== 'p' && t[I(x, yy)] !== 'w' && !townAt(x, yy)) { sign(x, yy, txt); break; } }
    });

    // ----- Roads out to Gearwind Outpost and into the three new regions -----
    const landNear = (tx, ty, rg, ok) => { let best = null; for (let rr = 0; rr < 30 && !best; rr++) for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) { const x = tx + dx, y = ty + dy; if (x < 3 || y < 3 || x >= W - 3 || y >= H - 3 || region[I(x, y)] !== rg) continue; if ((ok || ['n', 'g', 'a', 'M', 'P', 'f', 's'])
      .includes(t[I(x, y)]) && !solid[I(x, y)] && !deco[I(x, y)]) { if (!best) best = [x, y]; } } return best || [tx, ty]; };
    road(T2.x + 13, T2.y + T2.h, T3.x + 11, T3.y - 1, true);                 // the Frontier Road: Brasshaven -> Gearwind
    road(T1.x + 17, T1.y + T1.h, ...landNear(70, 150, 2), true);           // Rivet Hollow south into Mirewood
    const fp = landNear(186, 72, 1), mw = landNear(72, 186, 2), al = landNear(184, 176, 3);
    road(T3.x + T3.w, T3.y + 8, fp[0], fp[1], true);                      // to Frostpeak
    road(T3.x + 11, T3.y + T3.h, mw[0], mw[1], true);                      // to Mirewood
    road(T3.x + T3.w, T3.y + 9, al[0], al[1], true);                      // to the Ashlands
    const landmark = (x, y, text) => { for (let k = 0; k < 6; k++) { const xx = x + k, yy = y - 2; if (xx < W - 1 && t[I(xx, yy)] !== 'p' && t[I(xx, yy)] !== 'w' && t[I(xx, yy)] !== 'v' && !townAt(xx, yy)) { sign(xx, yy, text); break; } } };
    landmark(fp[0], fp[1], 'FROSTPEAK. Ice crystals sing in the wind. Frostlings and Glacier Golems roam the snow.');
    landmark(mw[0], mw[1], 'MIREWOOD. The trees drink the fog. Bog Crawlers corrode armour; Spore Drones poison.');
    landmark(al[0], al[1], 'THE ASHLANDS. Cinder Imps and Magma Hounds set you alight. The Titan sleeps beyond the lava.');

    // ----- Titan's lair: the far reaches of the Ashlands -----
    const c1 = [T1.x + 17, T1.y + 14], c2 = [T2.x + 13, T2.y + 11], c3 = [T3.x + 12, T3.y + 9];
    let lb = null;
    for (let y = 8; y < H - 8; y++) for (let x = 8; x < W - 8; x++) {
      if (region[I(x, y)] !== 3 || !['a', 'B'].includes(t[I(x, y)])) continue;
      const d = Math.hypot(x - c3[0], y - c3[1]);
      if (!lb || d > lb.d) lb = { x, y, d };
    }
    road(...al, lb.x, lb.y - 3, true);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { set(lb.x + dx, lb.y + dy, Math.max(Math.abs(dx), Math.abs(dy)) === 2 ? 'm' : 'B'); deco[I(lb.x + dx, lb.y + dy)] = null; solid[I(lb.x + dx, lb.y + dy)] = 0; }
    set(lb.x, lb.y - 2, 'B'); set(lb.x, lb.y - 3, 'p');
    const lair = { x: lb.x, y: lb.y };

    // ----- Reachability on starting Wheels -----
    const spawn = [T1.x + 4, T1.y + 7];
    const passable = (x, y, legs) => x >= 0 && y >= 0 && x < W && y < H && !solid[I(x, y)] && AF.TERRAIN[CH[t[I(x, y)]]].legs <= legs;
    const reach = new Set([key(...spawn)]), q = [spawn];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (passable(nx, ny, 1) && !reach.has(key(nx, ny))) { reach.add(key(nx, ny)); q.push([nx, ny]); }
      }
    }

    // ----- Resource nodes and ruins -----
    const nodes = {}, ruins = [];
    const free = (x, y) => !nearTown(x, y, 2) && t[I(x, y)] !== 'p' && !deco[I(x, y)] && !solid[I(x, y)] && !nodes[key(x, y)] && !ruins.includes(key(x, y)) && !(Math.abs(x - lair.x) <= 2 && Math.abs(y - lair.y) <= 2) && !(Math.abs(x - cave[0]) <= 5 && y <= cave[1] + 2 && y >= cave[1] - 4);
    // Deposits: resources gather in named sites that suit them (scrapyards on the scrap fields, copper where the
    // rubble meets the crags, silica in the dunes, arcite crystals on the mountain edge), not sprinkled everywhere.
    const deposits = [], nodeSite = {};
    const near = (x, y, ch, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && t[I(xx, yy)] === ch) return true; } return false; };   // ch is a map letter: r rubble, m mountain, g grass
    const edgeOfMountain = (x, y) => CH[t[I(x, y)]] === 'mountain' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = CH[t[I(x + dx, y + dy)]]; return c && c !== 'mountain' && c !== 'water' && !solid[I(x + dx, y + dy)]; });
    // Each resource turns up in more than one region, always on ground that suits it:
    //   scrap   — Heartland scrapfields, sunken wrecks in Mirewood bogs, slag heaps on the ash plains
    //   copper  — where rubble meets the crags, bog-iron in the mire, veins in Ashlands basalt
    //   silicon — Heartland dunes, frost-crystal beds on Frostpeak snow, glass-sand on the ash shore
    //   arcite  — mountain edges everywhere, glacier hearts in Frostpeak, near lava in the Ashlands
    const SITE = {
      scrap: { ok: (x, y, c) => c === 'rubble' || (c === 'sand' && near(x, y, 'r', 3)) || (c === 'bog' && near(x, y, 'M', 3)) || (c === 'ash' && near(x, y, 'B', 3)), cell: (c) => ['rubble', 'sand', 'grass', 'bog', 'ash'].includes(c) },
      copper: { ok: (x, y, c) => (c === 'rubble' && near(x, y, 'm', 4)) || (c === 'bog' && near(x, y, 'w', 3)) || (c === 'basalt' && near(x, y, 'm', 5)), cell: (c) => ['rubble', 'bog', 'basalt'].includes(c) },
      silicon: { ok: (x, y, c) => (c === 'sand' && !near(x, y, 'g', 2)) || (c === 'snow' && near(x, y, 'i', 3)) || (c === 'ash' && near(x, y, 'w', 3)), cell: (c) => ['sand', 'snow', 'ice', 'ash'].includes(c) },
      arcite: { ok: (x, y, c) => edgeOfMountain(x, y) || (c === 'ice' && near(x, y, 'm', 3)) || (c === 'basalt' && near(x, y, 'v', 2)), cell: (c, x, y) => edgeOfMountain(x, y) || c === 'ice' || c === 'basalt' },
    };
    const used = {};
    const siteName = (type, i, x, y) => {
      const rg = REGIONS[region[I(x, y)]].id, N = (AF.DEPOSITS[type].names[rg] || AF.DEPOSITS[type].names.heart), k = type + rg;
      used[k] = (used[k] || 0) + 1; return N[(used[k] - 1) % N.length];
    };
    const spaced = (x, y, gap) => deposits.every((d) => Math.hypot(d.x - x, d.y - y) >= gap);
    const addSite = (type, x, y, n, name) => {
      const site = { type, x, y, name, nodes: [] }, cand = [];
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 1 || yy < 1 || xx >= W - 1 || yy >= H - 1) continue;
        const c = CH[t[I(xx, yy)]];
        if (dx * dx + dy * dy <= 10 && SITE[type].cell(c, xx, yy) && (type === 'arcite' || free(xx, yy)) && !nodes[key(xx, yy)]) cand.push([xx, yy, dx * dx + dy * dy]);
      }
      cand.sort((p1, p2) => p1[2] - p2[2] + (r() - 0.5) * 6);
      for (const [xx, yy] of cand) {
        if (site.nodes.length >= n) break;
        if (site.nodes.some(([ax, ay]) => Math.abs(ax - xx) + Math.abs(ay - yy) < 2)) continue;
        nodes[key(xx, yy)] = type; nodeSite[key(xx, yy)] = deposits.length; site.nodes.push([xx, yy]);
      }
      if (site.nodes.length >= 2) deposits.push(site); else site.nodes.forEach(([xx, yy]) => { delete nodes[key(xx, yy)]; delete nodeSite[key(xx, yy)]; });
    };
    // A small scrapyard just outside Rivet Hollow for your first jobs
    for (let tries = 0; tries < 3000 && !deposits.length; tries++) {
      const x = AF.randInt(r, T1.x - 10, T1.x + T1.w + 9), y = AF.randInt(r, T1.y - 10, T1.y + T1.h + 9), c = CH[t[I(x, y)]], d = Math.hypot(x - c1[0], y - c1[1]);
      if (d > 14 && d < 22 && reach.has(key(x, y)) && (c === 'grass' || c === 'sand') && free(x, y)) addSite('scrap', x, y, 4, 'Hollow Junkyard');
    }
    for (const type of ['copper', 'silicon', 'scrap', 'arcite']) {
      const D = AF.DEPOSITS[type], heartWant = D.heart || 0;
      for (let made = 0, tries = 0; made < D.sites && tries < 40000; tries++) {
        // first the Heartland's share (the starting region always gets enough), then the outer regions
        const heartHave = deposits.filter((dd) => dd.type === type && region[I(dd.x, dd.y)] === 0).length, wantHeart = heartHave < heartWant && tries < 20000;
        const x = wantHeart ? AF.randInt(r, 4, 127) : AF.randInt(r, 4, W - 5), y = wantHeart ? AF.randInt(r, 4, 127) : AF.randInt(r, 4, H - 5), c = CH[t[I(x, y)]], d = Math.hypot(x - c1[0], y - c1[1]);
        if (wantHeart && region[I(x, y)] !== 0) continue;
        if (d < D.minDist || !SITE[type].ok(x, y, c) || !spaced(x, y, 11) || Math.hypot(x - c2[0], y - c2[1]) < 13 || Math.hypot(x - (T3.x + 12), y - (T3.y + 9)) < 14) continue;
        // spread each resource over the regions instead of piling it into one
        const rg = region[I(x, y)], inRg = deposits.filter((dd) => dd.type === type && region[I(dd.x, dd.y)] === rg).length;
        if (rg !== 0 && inRg >= Math.ceil((D.sites - heartWant) / 3) + 1) continue;
        if (rg === 0 && !wantHeart) continue;
        const before = deposits.length;
        addSite(type, x, y, AF.randInt(r, D.per[0], D.per[1]), siteName(type, made, x, y));
        if (deposits.length > before) made++;
      }
    }
    let guard = 0;
    while (ruins.length < AF.RUINS && guard++ < 9000) {
      const x = AF.randInt(r, 2, W - 3), y = AF.randInt(r, 2, H - 3);
      if (t[I(x, y)] !== 'w' && t[I(x, y)] !== 'v' && Math.hypot(x - c1[0], y - c1[1]) > 20 && free(x, y) && ruins.every((k) => { const [a2, b2] = k.split(',').map(Number); return Math.hypot(a2 - x, b2 - y) > 12; })) ruins.push(key(x, y));
    }

    const mp = { area: 'over', w: W, h: H, t, solid, deco, signs, buildings, doors, nodes, deposits, nodeSite, ruins, lair, spawn, cave, bridges, reach: reach.size, I, c1, c2, c3, region, vision: 6 };
    // ----- Starting enemies (same for everyone) -----
    mp.enemies0 = [];
    let id = 1;
    for (let i = 0; i < AF.ROAMERS; i++) {
      for (let tries = 0; tries < 300; tries++) {
        const x = AF.randInt(r, 1, W - 2), y = AF.randInt(r, 1, H - 2);
        if (!enemyOK(mp, x, y, mp.enemies0) || Math.hypot(x - c1[0], y - c1[1]) < 23) continue;
        const pool = poolFor(mp, x, y, r);
        mp.enemies0.push({ id: id++, type: pool[Math.floor(r() * pool.length)], x, y }); break;
      }
    }
    mp.enemies0.push({ id: id++, type: 'titan', x: lair.x, y: lair.y, boss: true });
    // ----- Disturbances: glowing spots you can choose to step into for a fight -----
    mp.hotspots = {};
    const hr = AF.rng(AF.WORLD_SEED * 31 + 7);
    for (let n = 0, tries = 0; n < AF.HOTSPOTS && tries < 20000; tries++) {
      const x = AF.randInt(hr, 2, W - 3), y = AF.randInt(hr, 2, H - 3), c = CH[t[I(x, y)]];
      if (!['grass', 'forest', 'sand', 'rubble', 'snow', 'pine', 'bog', 'mire', 'ash', 'basalt'].includes(c) || !free(x, y) || Math.hypot(x - c1[0], y - c1[1]) < 16 || Math.hypot(x - c2[0], y - c2[1]) < 14 || nearTown(x, y, 8)) continue;
      if (Object.keys(mp.hotspots).some((k) => { const [a, b] = k.split(',').map(Number); return Math.abs(a - x) + Math.abs(b - y) < 7; })) continue;
      mp.hotspots[key(x, y)] = c === 'sand' || c === 'ash' ? 'dust' : c === 'rubble' || c === 'basalt' ? 'sparks' : c === 'snow' ? 'frost' : c === 'bog' ? 'bubbles' : 'rustle'; n++;
    }
    // ----- Bounty Boards in both town squares -----
    mp.boards = {};
    [[T1, 21, 18, 1], [T2, 10, 12, 2], [T3, 8, 11, 3]].forEach(([T, lx, ly, town]) => {
      for (let rad = 0; rad < 5; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        if (mp.boards.done === town) continue;
        const x = T.x + lx + dx, y = T.y + ly + dy, ch = t[I(x, y)];
        if ((ch === 'l' || ch === 'p') && !solid[I(x, y)] && !deco[I(x, y)] && !doors[key(x, y)] && !doors[key(x, y + 1)] && !signs[key(x, y)]) {
          deco[I(x, y)] = 'bounty'; solid[I(x, y)] = 1; mp.boards[key(x, y)] = town; mp.boards.done = town;
        }
      }
    });
    delete mp.boards.done;
    return mp;
  }

  // ---------- The Sunken Foundry (52×40) ----------
  function buildFoundry() {
    const W = 52, H = 40, r = AF.rng(AF.WORLD_SEED + 4242);
    const t = new Array(W * H).fill('X'), solid = new Uint8Array(W * H), deco = new Array(W * H).fill(null);
    const I = (x, y) => y * W + x, floor = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) t[I(x, y)] = 'F'; };
    const rooms = {
      gate: [3, 16, 7, 7], north: [14, 4, 10, 7], south: [14, 26, 10, 8], heart: [28, 14, 10, 10], vault: [28, 31, 9, 6], gallery: [41, 3, 9, 8], warden: [40, 16, 10, 11],
    };
    for (const [x, y, w, h] of Object.values(rooms)) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) floor(xx, yy);
    const hall = (ax, ay, bx, by) => { // 2-wide L corridor
      let x = ax, y = ay;
      while (x !== bx) { floor(x, y); floor(x, y + 1); x += Math.sign(bx - x); }
      while (y !== by) { floor(x, y); floor(x + 1, y); y += Math.sign(by - y); }
      floor(x, y); floor(x + 1, y); floor(x, y + 1); floor(x + 1, y + 1);
    };
    hall(9, 18, 17, 10); hall(9, 21, 17, 26); hall(23, 7, 31, 14); hall(23, 29, 31, 23); hall(31, 23, 31, 31); hall(37, 18, 40, 20); hall(35, 14, 44, 10);
    const spawn = [6, 20], exitStair = [4, 17];
    deco[I(...exitStair)] = 'stairsup'; solid[I(...exitStair)] = 1;
    // walls: torches on north-facing walls, pipes and gears elsewhere
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (t[I(x, y)] !== 'X' || t[I(x, y + 1)] !== 'F') continue;
      const h = (x * 7 + y * 13) % 9;
      if (h === 0 || h === 5) deco[I(x, y)] = 'torch'; else if (h === 3) deco[I(x, y)] = 'wallpipe'; else if (h === 7) deco[I(x, y)] = 'gearwall';
    }
    const place = (x, y, k) => { deco[I(x, y)] = k; solid[I(x, y)] = 1; };
    // magic crystals, forge pits, rubble
    [[30, 16], [36, 16], [30, 22], [36, 22], [45, 5], [16, 30], [47, 25], [42, 25]].forEach(([x, y]) => place(x, y, 'crystal'));
    place(32, 18, 'forgepit'); place(33, 18, 'forgepit'); place(32, 19, 'forgepit'); place(33, 19, 'forgepit');
    [[15, 5], [22, 5], [15, 32], [22, 32], [29, 35], [35, 35], [42, 9], [48, 4]].forEach(([x, y]) => place(x, y, 'barrel'));
    const chests = {};
    [[22, 9, 'north'], [21, 32, 'south'], [35, 35, 'vault'], [48, 9, 'gallery'], [48, 21, 'warden']].forEach(([x, y, room]) => { deco[I(x, y)] = 'chest'; solid[I(x, y)] = 1; chests[key(x, y)] = room; });
    deco[I(35, 35)] = 'chest';
    const mp = { area: 'foundry', w: W, h: H, t, solid, deco, signs: {}, buildings: [], doors: {}, nodes: {}, ruins: [], lair: { x: 45, y: 21 }, spawn, exitStair, chests, rooms, bridges: {}, reach: 0, I, vision: 5 };
    mp.signs[key(10, 16)] = 'Etched in brass: "FOUNDRY OF THE TITAN. ALL HANDS TO THE FORGE."';
    deco[I(10, 16)] = 'plaque';
    // enemies
    mp.enemies0 = []; let id = 1;
    const foes = { north: ['cogspider', 'gearghoul'], south: ['cogspider', 'runegolem'], heart: ['gearghoul', 'cogspider', 'runegolem'], vault: ['runegolem'], gallery: ['gearghoul', 'runegolem'] };
    for (const [room, list] of Object.entries(foes)) {
      const [x0, y0, w, h] = rooms[room];
      for (const type of list) for (let k = 0; k < 60; k++) {
        const x = x0 + 1 + Math.floor(r() * (w - 2)), y = y0 + 1 + Math.floor(r() * (h - 2));
        if (solid[I(x, y)] || mp.enemies0.some((e) => e.x === x && e.y === y)) continue;
        mp.enemies0.push({ id: id++, type, x, y }); break;
      }
    }
    mp.enemies0.push({ id: id++, type: 'warden', x: 45, y: 21, boss: true });
    return mp;
  }

  function tierFor(mp, x, y, r) {
    const rg = mp.region ? mp.region[y * mp.w + x] : 0;
    if (rg === 3) return r() < 0.35 ? 2 : 3;                                  // Ashlands: the toughest
    if (rg) { const R = REGIONS[rg], d = Math.hypot(x - R.cx, y - R.cy); return d < 30 ? (r() < 0.6 ? 3 : 2) : r() < 0.8 ? 2 : 3; }
    const d = Math.hypot(x - mp.c1[0], y - mp.c1[1]), d2 = Math.hypot(x - mp.c2[0], y - mp.c2[1]);
    if (d2 < 20) return r() < 0.6 ? 2 : 1;
    if (d < 28) return 1;
    if (d < 38) return r() < 0.7 ? 1 : 2;
    if (d < 55) return r() < 0.2 ? 1 : r() < 0.85 ? 2 : 3;
    return r() < 0.3 ? 2 : 3;
  }
  // Which bots live here: each region has its own creatures (AF.REGION_POOLS), by tier.
  function regionId(mp, x, y) { return mp.region ? REGIONS[mp.region[y * mp.w + x]].id : 'heart'; }
  function poolFor(mp, x, y, r, tierBump) {
    const tier = Math.min(3, tierFor(mp, x, y, r) + (tierBump || 0)), P = AF.REGION_POOLS[regionId(mp, x, y)] || AF.TIERS;
    return P[tier] || P[3] || P[2] || AF.TIERS[tier];
  }
  const terr = (mp, x, y) => (x < 0 || y < 0 || x >= mp.w || y >= mp.h) ? null : CH[mp.t[y * mp.w + x]];
  function enemyOK(mp, x, y, list, w) {
    const c = terr(mp, x, y);
    return c && AF.TERRAIN[c].legs <= 2 && !mp.solid[y * mp.w + x] && !(mp.nodes && mp.nodes[x + ',' + y]) && !(mp.ruins && mp.ruins.includes(x + ',' + y))
      && !(mp.area === 'over' && TOWNS.some((T) => x >= T.x - 2 && y >= T.y - 2 && x < T.x + T.w + 2 && y < T.y + T.h + 2))
      && !(mp.area === 'over' && mp.t[y * mp.w + x] === 'p' && Math.hypot(x - mp.c1[0], y - mp.c1[1]) < 40)
      && !list.some((e) => e.x === x && e.y === y) && !(w && w.rx === x && w.ry === y)
      && !(Math.abs(x - mp.lair.x) <= 2 && Math.abs(y - mp.lair.y) <= 2);
  }

  // ---------- Per-save world state ----------
  function freshArea(mp) {
    const sp = mp.spawn;
    return { px: sp[0], py: sp[1], rx: sp[0] + 1, ry: sp[1], dir: 'down', rdir: 'down', ready: {}, opened: {},
      enemies: mp.enemies0.map((e) => Object.assign({}, e)), nextId: mp.enemies0.length + 1,
      fog: Array.from({ length: mp.w * mp.h }, (_, i) => (mp.area === 'over' && townAt(i % mp.w, Math.floor(i / mp.w)) === T1 ? '1' : '0')).join('') };
  }
  function init() {
    const w = Object.assign({ area: 'over', store: {}, v: 2 }, freshArea(over()));
    w.rx = w.px; w.ry = w.py;
    reveal(w, over());
    return w;
  }
  const AREA_KEYS = ['px', 'py', 'rx', 'ry', 'dir', 'rdir', 'ready', 'opened', 'enemies', 'nextId', 'fog'];
  function switchArea(state, area, at) {
    const w = state.world, from = w.area || 'over';
    w.store = w.store || {};
    const park = {}; AREA_KEYS.forEach((k) => (park[k] = w[k])); w.store[from] = park;
    const mp = map({ world: { area } });
    let s = w.store[area];
    if (!s) s = freshArea(mp);
    else if (area === 'foundry' && state.steps - (s.left || 0) > 400 && !s.enemies.some((e) => !e.boss)) {
      // the halls fill up again after a while (the Warden stays down)
      const boss = s.enemies.find((e) => e.boss);
      s.enemies = mp.enemies0.filter((e) => !e.boss).map((e) => Object.assign({}, e)).concat(boss ? [boss] : []);
    }
    AREA_KEYS.forEach((k) => (w[k] = s[k]));
    w.area = area; w.inside = null;
    if (at) { w.px = at[0]; w.py = at[1]; w.rx = at[0]; w.ry = at[1] + 1; w.dir = at[2] || 'down'; }
    delete w.store[area];
    if (from === 'foundry') park.left = state.steps;
    reveal(w, mp);
    AF.Render.snap();
  }
  function reveal(w, mp) {
    mp = mp || map({ world: w });
    const V = mp.vision, f = w.fog.split('');
    for (let dy = -V; dy <= V; dy++) for (let dx = -V; dx <= V; dx++) {
      const x = w.px + dx, y = w.py + dy;
      if (x >= 0 && y >= 0 && x < mp.w && y < mp.h && dx * dx + dy * dy <= V * V + 2) f[y * mp.w + x] = '1';
    }
    w.fog = f.join('');
  }

  // ---------- NPC positions (not saved; they wander around their home spot) ----------
  let npcs = null;
  function npcList() {
    if (!npcs) npcs = Object.entries(AF.NPCS).map(([id, n]) => { const T = townById(n.town); return { id, x: T.x + n.x, y: T.y + n.y, hx: T.x + n.x, hy: T.y + n.y, dir: n.dir || 'down' }; });
    return npcs;
  }
  const npcAt = (state, x, y) => (state.world.area || 'over') === 'over' && npcList().find((n) => n.x === x && n.y === y);

  // ---------- Things you can face and use ----------
  const DXY = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  function thingAt(state, x, y) {
    const mp = map(state), w = state.world, k = key(x, y), d = mp.deco[y * mp.w + x];
    if (mp.doors[k]) { const id = mp.doors[k]; return { kind: 'door', id, label: AF.SHOPS.includes(id) || AF.INTERIORS[id] ? 'Enter' : 'Knock' }; }
    const npc = npcAt(state, x, y); if (npc) return { kind: 'talk', npc: npc.id, label: 'Talk', tall: true };
    if (mp.signs[k]) return { kind: 'sign', text: mp.signs[k], label: 'Read' };
    if (mp.nodes[k]) { const ready = (w.ready[k] || 0) <= state.steps; return { kind: 'node', k, label: ready ? (mp.nodes[k] === 'scrap' ? 'Rummage' : 'Mine') : 'Picked clean' }; }
    if (mp.ruins.includes(k)) return { kind: 'ruin', k, label: w.opened[k] ? 'Searched' : 'Search' };
    if (d === 'cave' || (mp.area === 'over' && mp.cave && x === mp.cave[0] + 1 && y === mp.cave[1])) return { kind: 'dungeon', label: 'Enter', tall: true, x: mp.cave[0], y: mp.cave[1] };
    if (d === 'stairsup') return { kind: 'leave', label: 'Climb out' };
    if (d === 'chest') return { kind: 'chest', k, label: w.opened[k] ? 'Empty' : 'Open' };
    if (d === 'fountain' || d === 'clock') return { kind: 'fountain', label: 'Look', tall: true, big: d };
    if (d === 'crystal') return { kind: 'crystal', label: 'Touch' };
    if (d === 'bounty') return { kind: 'bounty', label: 'Bounties', town: mp.boards[k] };
    return null;
  }
  function facing(state) {
    if (state.world.inside) return AF.Interiors.facing(state);
    const w = state.world, mp = map(state), [dx, dy] = DXY[w.dir] || [0, 1], x = w.px + dx, y = w.py + dy;
    const t = thingAt(state, x, y);
    if (!t) return null;
    if (t.kind === 'fountain') { // 2×2 props: prompt over the middle
      let fx = x;
      if (mp.deco[y * mp.w + x - 1] === t.big || mp.deco[(y - 1) * mp.w + x - 1] === t.big) fx = x - 1;
      return Object.assign(t, { x: fx + 0.5, y });
    }
    if (t.kind === 'dungeon') return Object.assign(t, { x: mp.cave[0] + 0.5, y: mp.cave[1] });
    return Object.assign(t, { x, y });
  }
  function face(state, dir) { state.world.dir = dir; }
  const inTownXY = (state, x, y) => (state.world.area || 'over') === 'over' && !!townAt(x, y);

  // A turn: the pilot steps, the automaton follows, the world reacts.
  function move(state, dx, dy) {
    if (state.world.inside) return AF.Interiors.move(state, dx, dy);
    const mp = map(state), w = state.world, nx = w.px + dx, ny = w.py + dy, st = AF.stats(state);
    w.dir = DIRS[dx + ',' + dy];
    const c = terr(mp, nx, ny);
    if (!c) return { type: 'blocked', text: 'The edge of the known world.' };
    const th = thingAt(state, nx, ny);
    if ((th && th.kind !== 'talk') || mp.solid[ny * mp.w + nx]) return { type: 'bump' };   // townsfolk never block: walk right through them
    if (c === 'dwall') return { type: 'bump' };
    if (!state.flags.robot && inTownXY(state, w.px, w.py) && !inTownXY(state, nx, ny)) return { type: 'talk', npc: 'rook' };
    const need = AF.TERRAIN[c].legs;
    if (st.legs < need && !(AF.Admin && AF.Admin.noclip()))
      return { type: 'blocked', text: `Your ${AF.PARTS.legs.tiers[st.legs - 1]} can't cross ${AF.TERRAIN[c].name}. Upgrade Locomotion to ${AF.PARTS.legs.tiers[need - 1]} at a Garage or Smithy.` };
    const foe = w.enemies.find((e) => e.x === nx && e.y === ny);
    if (foe) return { type: 'battle', enemy: foe };

    const wasT = inTownXY(state, w.px, w.py) && townAt(w.px, w.py);
    w.rdir = DIRS[Math.sign(w.px - w.rx) + ',' + Math.sign(w.py - w.ry)] || w.rdir;
    w.rx = w.px; w.ry = w.py; w.px = nx; w.py = ny; state.steps++;
    reveal(w, mp);
    const msgs = [], nowT = inTownXY(state, nx, ny) && townAt(nx, ny);
    const hk = key(nx, ny);
    if (mp.hotspots && mp.hotspots[hk] && hotReady(state, hk) && !(AF.Admin && AF.Admin.peace())) {
      const hr2 = AF.rng(state.seed ^ (state.steps * 977) ^ (nx * 31 + ny));
      const pool = poolFor(mp, nx, ny, hr2);
      const kind = mp.hotspots[hk];
      return { type: 'battle', enemy: { id: 'hot:' + hk, type: pool[Math.floor(hr2() * pool.length)], x: nx, y: ny, hot: hk },
        text: kind === 'dust' ? 'The sand heaves. Something was buried here!' : kind === 'sparks' ? 'The scrap pile sparks and lurches to life!' : 'The brush rustles. Something leaps out!' };
    }
    if (nowT && nowT !== wasT) {
      msgs.push(`${wasT ? '' : 'Welcome to '}${AF.TOWN_NAMES[nowT.id]}.`);
      if (nowT.id === 2) AF.Quests.event(state, 'town2', {});
    }

    const p = state.pilot;
    if (!nowT && state.steps % (12 + (AF.hasPerk(state, 'endurance') ? 4 : 0) + Math.round(AF.stats(state).hunger)) === 0 && p.vit > 0) {
      p.vit--;
      if (p.vit === 0) msgs.push('Your pilot is exhausted: less energy in battle and smaller harvests. Eat something!');
      else if (p.vit === 5) msgs.push('Your pilot is getting hungry.');
    }
    // enemies
    const r = AF.rng(state.seed ^ (state.steps * 2654435761));
    let ambush = null;
    for (const e of w.enemies) {
      if (e.boss || e.bounty) continue;
      const d = Math.abs(e.x - w.px) + Math.abs(e.y - w.py);
      let step = null;
      if (d <= 4 && !nowT && r() < 0.4 && !(AF.Admin && AF.Admin.peace())) {
        const sx = Math.sign(w.px - e.x), sy = Math.sign(w.py - e.y);
        step = Math.abs(w.px - e.x) >= Math.abs(w.py - e.y) ? [sx, 0] : [0, sy];
      } else if (r() < 0.25) step = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
      if (!step) continue;
      const tx = e.x + step[0], ty = e.y + step[1];
      if (tx === w.px && ty === w.py && !nowT) { if (AF.Admin && AF.Admin.peace()) continue; ambush = e; continue; }
      if (enemyOK(mp, tx, ty, w.enemies, w)) { e.x = tx; e.y = ty; }
    }
    if (mp.area === 'over' && state.steps % 60 === 0 && w.enemies.filter((e) => !e.boss && !e.bounty).length < AF.ROAMERS) {
      for (let tries = 0; tries < 200; tries++) {
        const x = AF.randInt(r, 1, mp.w - 2), y = AF.randInt(r, 1, mp.h - 2);
        if (Math.hypot(x - mp.c1[0], y - mp.c1[1]) < 24 || Math.abs(x - w.px) + Math.abs(y - w.py) < 10 || !enemyOK(mp, x, y, w.enemies, w)) continue;
        const pool = poolFor(mp, x, y, r);
        w.enemies.push({ id: w.nextId++, type: pool[Math.floor(r() * pool.length)], x, y }); break;
      }
    }
    // townsfolk wander
    if (nowT || wasT) for (const n of npcList()) {
      if (!AF.NPCS[n.id].wander || r() > 0.3) continue;
      const [ddx, ddy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)], tx = n.x + ddx, ty = n.y + ddy;
      const cc = terr(mp, tx, ty);
      if (Math.abs(tx - n.hx) > 2 || Math.abs(ty - n.hy) > 2 || mp.solid[ty * mp.w + tx] || !(cc === 'lawn' || cc === 'path') || npcAt(state, tx, ty)
        || (tx === w.px && ty === w.py) || (tx === w.rx && ty === w.ry) || mp.doors[key(tx, ty)] || mp.deco[ty * mp.w + tx]) continue;
      n.x = tx; n.y = ty; n.dir = DIRS[ddx + ',' + ddy];
    }
    if (ambush) return { type: 'battle', enemy: ambush, ambush: true, text: msgs.join(' ') };
    return msgs.length ? { type: 'msg', text: msgs.join(' ') } : null;
  }

  // Chest rewards in the Foundry (fixed per chest, gear rolls each time).
  function openChest(state, k) {
    const mp = map(state), room = mp.chests[k], r = AF.rng(AF.WORLD_SEED + k.length * 977 + state.steps);
    const out = [];
    const cash = room === 'warden' ? 4000 : AF.randInt(r, 400, 900);
    state.credits += cash; out.push(AF.moneyText(cash));
    const mats = room === 'warden' ? { arcite: 4, circuits: 4 } : { [['copper', 'silicon', 'circuits', 'arcite'][Math.floor(r() * 4)]]: AF.randInt(r, 2, 4) };
    AF.gain(state.res, mats); out.push(Object.entries(mats).map(([m, n]) => `${n} ${AF.RES[m].name}`).join(', '));
    const gid = AF.rollGear(3, room === 'warden'), gr = AF.giveItem(state, gid);
    out.push(gr && gr.dup ? `${AF.ITEMS[gid].name} (duplicate → ${AF.moneyText(gr.value)})` : `${AF.ITEMS[gid].name}!`);
    if (room === 'warden' || r() < 0.5) { const locked = AF.lockedCards(state); if (locked.length) { const id = locked[Math.floor(r() * locked.length)]; state.known.push(id); out.push(`blueprint: ${AF.CARDS[id].name}`); } }
    AF.Quests.event(state, 'chest', {});
    return out.join(' · ');
  }

  // Press the interact button: act on whatever is in front of the pilot.
  function interact(state) {
    if (state.world.inside) return AF.Interiors.interact(state);
    const t = facing(state);
    if (!t) return null;
    const mp = map(state), w = state.world, st = AF.stats(state), p = state.pilot;
    if (t.kind === 'door') return { type: 'door', id: t.id };
    if (t.kind === 'talk') { const n = npcAt(state, t.x, t.y); n.dir = { down: 'up', up: 'down', left: 'right', right: 'left' }[w.dir]; return { type: 'talk', npc: t.npc }; }
    if (t.kind === 'sign') return { type: 'sign', text: t.text };
    if (t.kind === 'fountain') return { type: 'msg', text: t.big === 'clock' ? 'Brass gears tick behind the clock face. Somewhere inside, steam hisses in time.' : 'The Arc Well hums with a cold blue light.' };
    if (t.kind === 'crystal') return { type: 'msg', text: 'The crystal thrums under your hand. Old magic, still awake.' };
    if (t.kind === 'dungeon') return { type: 'dungeon' };
    if (t.kind === 'bounty') return { type: 'bounty', town: t.town };
    if (t.kind === 'leave') return { type: 'leave' };
    if (t.kind === 'chest') {
      if (w.opened[t.k]) return { type: 'msg', text: 'Empty. Someone (you) got here first.' };
      if (mp.chests[t.k] === 'warden' && w.enemies.some((e) => e.boss)) return { type: 'msg', text: 'The Warden\'s seal holds the lid shut. Defeat the Clockwork Warden first.' };
      w.opened[t.k] = 1; AF.sfx('forge'); AF.Render.burst(t.x + 0.5, t.y + 0.3, 'sparkle', 18);
      return { type: 'msg', text: `Chest: ${openChest(state, t.k)}`, long: true };
    }
    if (t.kind === 'node') {
      const k = t.k, def = AF.NODES[mp.nodes[k]];
      if ((w.ready[k] || 0) > state.steps) return { type: 'msg', text: `${def.label} is picked clean. It recovers in ${w.ready[k] - state.steps} steps.` };
      if (def.arms && state.parts.arms < def.arms) return { type: 'msg', text: `${def.label}: too hard for Grabbers. Upgrade Arms to Drill Arms at a Garage or Smithy.` };
      return { type: 'gather', k, node: mp.nodes[k], x: t.x, y: t.y, site: siteOf(mp, k) };
    }
    if (t.kind === 'ruin') {
      const k = t.k;
      if (w.opened[k]) return { type: 'msg', text: 'You already searched this ruin.' };
      w.opened[k] = 1;
      const locked = AF.lockedCards(state);
      const r = AF.rng(AF.WORLD_SEED + t.x * 131 + t.y * 977 + state.steps);
      const cr = AF.randInt(r, 80, 200);
      state.credits += cr;
      AF.sfx('forge'); AF.Render.burst(t.x + 0.5, t.y + 0.3, 'sparkle', 16);
      AF.Quests.event(state, 'ruin', {});
      if (locked.length) { const id = locked[Math.floor(r() * locked.length)]; state.known.push(id); return { type: 'blueprint', id, text: `You also find ${AF.moneyText(cr)} in the rubble.` }; }
      AF.gain(state.res, { circuits: 2, copper: 4 });
      return { type: 'msg', text: `Ruin searched: 2 Circuits, 4 Copper and ${AF.moneyText(cr)}.` };
    }
    return null;
  }

  function enterDungeon(state) {
    const f = map({ world: { area: 'foundry' } });
    switchArea(state, 'foundry', [f.spawn[0], f.spawn[1], 'down']);
    state.world.rx = f.spawn[0] + 1; state.world.ry = f.spawn[1];
    AF.Quests.event(state, 'dungeon', {});
  }
  function leaveDungeon(state) {
    const o = over();
    switchArea(state, 'over', [o.cave[0], o.cave[1] + 1, 'down']);
    state.world.ry = o.cave[1] + 2;
  }

  function removeEnemy(state, id) { state.world.enemies = state.world.enemies.filter((e) => e.id !== id); }

  // ---------- Gathering (after the mini-game) ----------
  function siteOf(mp, k) { const i = mp.nodeSite && mp.nodeSite[k]; return i != null && mp.deposits[i] ? mp.deposits[i].name : null; }
  // result: { score (0..), flawless } from AF.Mini. Applies the haul and puts the node to rest.
  function finishGather(state, k, result) {
    const mp = map(state), w = state.world, type = mp.nodes[k], def = AF.NODES[type], st = AF.stats(state);
    if (!def) return null;
    let amt = Math.floor(result.score * def.mult + 1e-9);
    if (result.score > 0) amt = Math.max(1, amt) + (st.gather - 1) + (AF.hasPerk(state, 'scavenger') ? 1 : 0);
    if (state.pilot.vit <= 0 && amt > 1) amt--;
    const got = {}; if (amt > 0) got[def.res] = amt;
    for (const [res, n] of Object.entries(result.extra || {})) got[res] = (got[res] || 0) + n;
    if (result.flawless) got[def.bonus] = (got[def.bonus] || 0) + 1;
    AF.gain(state.res, got);
    // A poor job still disturbs the node, but it recovers faster.
    w.ready[k] = state.steps + Math.round(def.respawn * (result.score > 0 ? 1 : 0.35));
    const [x, y] = k.split(',').map(Number);
    if (Object.keys(got).length) { AF.sfx('gather'); AF.Render.burst(x + 0.5, y + 0.5, def.res, 14); AF.Quests.event(state, 'gather', { res: def.res, amt: got[def.res] || 0 }); AF.bumpStat(state, 'gathered'); if (result.flawless) AF.bumpStat(state, 'flawlessGather'); }
    return got;
  }

  // ---------- Disturbances ----------
  function hotReady(state, k) { const h = state.world.hot; return !h || !h[k] || h[k] <= state.steps; }
  function clearHotspot(state, k, cool) { const w = state.world; w.hot = w.hot || {}; w.hot[k] = state.steps + (cool || AF.HOTSPOT_COOLDOWN); }

  // ---------- Bounty Boards ----------
  const DIR8 = (dx, dy) => { const a = Math.atan2(dy, dx) * 180 / Math.PI; return ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'][((Math.round(a / 45) % 8) + 8) % 8]; };
  function bountyOffers(state, town) {
    const n = Math.floor((state.steps || 0) / AF.BOUNTY_EVERY);
    const tiers = town === 3 ? [2, 3, 3] : town === 2 ? [2, 2, 3] : [1, 1, 2];
    const regs = town === 3 ? ['frost', 'mire', 'ash'] : ['heart', 'heart', 'heart'];
    return tiers.map((tier, i) => {
      const r = AF.rng(Math.imul(AF.WORLD_SEED + town * 7919 + n * 104729 + i * 15485863, 2654435761) >>> 0); r(); r();
      const P = AF.REGION_POOLS[regs[i]] || AF.TIERS, pool = P[tier] || P[2], type = pool[Math.floor(r() * pool.length)], [lo, hi] = AF.CREDITS_BY_TIER[tier];
      const mat = ['scrap', 'copper', 'silicon', 'circuits', 'arcite'][Math.min(4, tier + Math.floor(r() * 2))];
      return { i, town, tier, type, region: regs[i], credits: Math.round(hi * (2.2 + r())), xp: AF.XP_BY_TIER[tier] * 2, res: { [mat]: 2 + Math.floor(r() * 3) }, seed: Math.floor(r() * 1e9) };
    });
  }
  function acceptBounty(state, town, i) {
    const w = state.world, mp = over(), o = bountyOffers(state, town)[i];
    if (!o) return 'That bounty is gone.';
    if (w.bounty) return 'You already have a bounty. Finish or drop it first.';
    if ((w.area || 'over') !== 'over') return 'Head back to the overworld first.';
    const T = townById(town), legs = AF.stats(state).legs, r = AF.rng(o.seed);
    // targets from the outpost are out in their own region; town jobs are near town
    const R = o.region && o.region !== 'heart' ? REGIONS.find((g) => g.id === o.region) : null, cx = R ? R.cx : T.x + T.w / 2, cy = R ? R.cy : T.y + T.h / 2;
    for (let tries = 0; tries < 6000; tries++) {
      const a = r() * Math.PI * 2, d = (R ? 6 : 16) + r() * (R ? 40 : 18), x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
      const c = terr(mp, x, y);
      if (!c || (R && regionId(mp, x, y) !== o.region) || AF.TERRAIN[c].legs > legs || !enemyOK(mp, x, y, w.enemies, w) || (mp.hotspots && mp.hotspots[key(x, y)])) continue;
      const id = w.nextId++;
      w.enemies.push({ id, type: o.type, x, y, bounty: true });
      w.bounty = { id, type: o.type, credits: o.credits, xp: o.xp, res: o.res, town, at: state.steps };
      AF.sfx && AF.sfx('card');
      return `Bounty accepted: ${AF.ENEMIES[o.type].name}, last seen to the ${DIR8(x - cx, y - cy)} of ${AF.TOWN_NAMES[town]}. It's marked on your map.`;
    }
    return 'No sign of that one today. Try another bounty.';
  }
  function dropBounty(state) {
    const w = state.world; if (!w.bounty) return '';
    const id = w.bounty.id;
    w.enemies = w.enemies.filter((e) => e.id !== id);
    if (w.store && w.store.over) w.store.over.enemies = w.store.over.enemies.filter((e) => e.id !== id);
    w.bounty = null; return 'Bounty dropped.';
  }
  function completeBounty(state, ref) {
    const w = state.world, b = w.bounty;
    if (!b || b.id !== ref.id) return null;
    state.credits += b.credits; AF.gain(state.res, b.res); const xp = AF.gainXP(state, b.xp);
    AF.bumpStat(state, 'bounties'); w.bounty = null;
    return `${AF.moneyText(b.credits)}, ${Object.entries(b.res).map(([k, n]) => `${n} ${AF.RES[k].name}`).join(', ')}, +${xp} XP`;
  }
  function bountyHint(state) {
    const w = state.world, b = w.bounty; if (!b) return '';
    const e = (w.area || 'over') === 'over' ? w.enemies.find((x) => x.id === b.id) : null;
    if (!e) return `<b>Bounty</b> ${AF.esc(AF.ENEMIES[b.type].name)} · on the overworld`;
    const dx = e.x - w.px, dy = e.y - w.py, d = Math.abs(dx) + Math.abs(dy);
    return `<b>Bounty</b> ${AF.esc(AF.ENEMIES[b.type].name)} · ${d <= 2 ? 'right here!' : `${d} steps ${DIR8(dx, dy)}`}`;
  }

  // ---------- Lures ----------
  function useLure(state, kind) {
    const w = state.world, mp = map(state), L = state.pilot.lures || {};
    if (!L[kind]) return { type: 'msg', text: `No ${AF.LURES[kind].name}s left. The Salvage Exchange sells them.` };
    if (w.inside || inTown(state)) return { type: 'msg', text: 'Lures only work out in the wild.' };
    if (!state.flags.robot) return { type: 'msg', text: 'You need an automaton before you go looking for trouble.' };
    L[kind]--; state.pilot.lures = L;
    const r = AF.rng(state.seed ^ (state.steps * 7331) ^ 99);
    const pool = mp.area === 'foundry' ? ['cogspider', 'gearghoul', 'runegolem'] : poolFor(mp, w.px, w.py, r, AF.LURES[kind].tier || 0);
    return { type: 'battle', enemy: { id: 'lure:' + state.steps, type: pool[Math.floor(r() * pool.length)], x: w.px, y: w.py, lure: kind }, text: `You set out the ${AF.LURES[kind].name}...` };
  }
  function sendHome(state) {
    if ((state.world.area || 'over') !== 'over') switchArea(state, 'over');
    const w = state.world, mp = over();
    w.inside = null; w.px = mp.spawn[0]; w.py = mp.spawn[1]; w.rx = w.px + 1; w.ry = w.py; w.dir = 'down';
    reveal(w, mp); AF.Render.snap();
  }
  function placeRobot(state) {
    const mp = map(state), w = state.world;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const x = w.px + dx, y = w.py + dy;
      if (!mp.solid[y * mp.w + x] && !npcAt(state, x, y) && terr(mp, x, y) !== 'dwall') { w.rx = x; w.ry = y; return; }
    }
  }
  const inTown = (state) => !!state.world.inside || inTownXY(state, state.world.px, state.world.py);
  function townName(state) { const T = inTownXY(state, state.world.px, state.world.py) && townAt(state.world.px, state.world.py); return T ? AF.TOWN_NAMES[T.id] : null; }
  function describeHere(state) {
    if (state.world.inside) return AF.BUILDINGS[state.world.inside].name;
    const mp = map(state), w = state.world, k = key(w.px, w.py);
    if (mp.area === 'foundry') return 'The Sunken Foundry';
    const ahead = mp.doors[key(w.px, w.py - 1)];
    if (ahead) return AF.BUILDINGS[ahead].name;
    const tn = townName(state); if (tn) return tn;
    if (mp.nodes[k]) return siteOf(mp, k) || AF.NODES[mp.nodes[k]].label;
    if (mp.deposits) { const d = mp.deposits.find((dd) => Math.abs(dd.x - w.px) <= 4 && Math.abs(dd.y - w.py) <= 4); if (d) return d.name; }
    if (mp.ruins.includes(k)) return 'Searched ruin';
    if (mp.bridges[k]) return 'Old bridge';
    const rgn = mp.region ? REGIONS[mp.region[w.py * mp.w + w.px]].name : '';
    return AF.TERRAIN[terr(mp, w.px, w.py)].name + (rgn && rgn !== 'The Heartland' ? ' · ' + rgn : '');
  }
  // After a save from a smaller or different world loads: widen the explored-map memory, and if the
  // pilot or any bot now stands somewhere impossible (water, lava, inside a wall), move them.
  function validate(state) {
    const w = state.world; if (!w) return;
    const mp = over(), N = mp.w * mp.h;
    const grow = (f) => { if (!f || f.length === N) return f; const old = Math.round(Math.sqrt(f.length)); let out = ''; for (let y = 0; y < mp.h; y++) out += (y < old ? f.slice(y * old, y * old + old) : '') .padEnd(mp.w, '0'); return out; };
    if ((w.area || 'over') === 'over') w.fog = grow(w.fog); else if (w.store && w.store.over) w.store.over.fog = grow(w.store.over.fog);
    const legs = AF.stats(state).legs;
    const bad = (x, y, lim) => { const c = terr(mp, x, y); return !c || AF.TERRAIN[c].legs > lim || mp.solid[y * mp.w + x]; };
    const fix = (list) => (list || []).filter((e) => e.boss || e.bounty || !bad(e.x, e.y, 2));
    if ((w.area || 'over') === 'over') {
      w.enemies = fix(w.enemies);
      if (!w.inside && bad(w.px, w.py, legs)) sendHome(state);
      const titan = w.enemies.find((e) => e.type === 'titan'); if (titan) { titan.x = mp.lair.x; titan.y = mp.lair.y; }
    } else if (w.store && w.store.over) { w.store.over.enemies = fix(w.store.over.enemies); const titan = w.store.over.enemies.find((e) => e.type === 'titan'); if (titan) { titan.x = mp.lair.x; titan.y = mp.lair.y; } }
  }
  // Tap-to-walk: the shortest walkable route to a tile (or next to it, if the tile itself is blocked).
  function passable(state, x, y) {
    const w = state.world;
    if (w.inside) return !AF.Interiors.solid(w.inside, x, y);
    const mp = map(state), c = terr(mp, x, y);
    if (!c || c === 'dwall' || mp.solid[y * mp.w + x]) return false;
    const th = thingAt(state, x, y); if (th && th.kind !== 'talk') return false;
    if (w.enemies.some((e) => e.x === x && e.y === y)) return false;
    return AF.TERRAIN[c].legs <= AF.stats(state).legs || !!(AF.Admin && AF.Admin.noclip());
  }
  function pathTo(state, tx, ty) {
    const w = state.world, sx = w.px, sy = w.py, LIM = 40;
    if (Math.abs(tx - sx) > LIM || Math.abs(ty - sy) > LIM || (tx === sx && ty === sy)) return null;
    const goalOK = passable(state, tx, ty);
    const k = (x, y) => x + ',' + y, prev = new Map([[k(sx, sy), null]]), q = [[sx, sy]];
    const D = [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];
    let end = null;
    while (q.length && prev.size < 6000) {
      const [x, y] = q.shift();
      if ((x === tx && y === ty) || (!goalOK && Math.abs(x - tx) + Math.abs(y - ty) === 1)) { end = [x, y]; break; }
      for (const [dx, dy, d] of D) {
        const nx = x + dx, ny = y + dy, kk = k(nx, ny);
        if (prev.has(kk) || Math.abs(nx - sx) > LIM || Math.abs(ny - sy) > LIM) continue;
        if (!(nx === tx && ny === ty && goalOK) && !passable(state, nx, ny)) continue;
        prev.set(kk, [x, y, d]); q.push([nx, ny]);
      }
    }
    if (!end) return null;
    const out = []; let cur = end;
    while (true) { const pv = prev.get(k(cur[0], cur[1])); if (!pv) break; out.unshift(pv[2]); cur = [pv[0], pv[1]]; }
    // finish facing the blocked thing you tapped, so a tap on a shop door walks up and faces it
    if (!goalOK && end) { const dx = tx - end[0], dy = ty - end[1]; out.face = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; }
    return out;
  }
  // which music fits where the pilot stands: a building, a town, the Foundry, or the region of the wilds
  function musicZone(state) {
    const w = state.world, mp = map(state);
    if (mp.area === 'foundry') return 'foundry';
    if (w.inside) return 'inside';
    const T = inTownXY(state, w.px, w.py) && townAt(w.px, w.py);
    if (T) return 'town' + T.id;
    return regionId(mp, w.px, w.py);
  }
  function regionName(state) { const mp = map(state), w = state.world; return mp.region && !w.inside ? REGIONS[mp.region[w.py * mp.w + w.px]].name : ''; }
  function terrainHere(state) { if (state.world.inside) return 'path'; return terr(map(state), state.world.px, state.world.py); }

  function drawMap(canvas, state) {
    const mp = map(state), w = state.world, g = canvas.getContext('2d'), s = mp.area === 'over' ? 3 : 6;
    canvas.width = mp.w * s; canvas.height = mp.h * s;
    g.fillStyle = '#141410'; g.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < mp.h; y++) for (let x = 0; x < mp.w; x++) {
      if (w.fog[y * mp.w + x] !== '1') continue;
      g.fillStyle = AF.TERRAIN[CH[mp.t[y * mp.w + x]]].color;
      const d = mp.deco[y * mp.w + x];
      if (d === 'tree') g.fillStyle = '#2e4a2a'; else if (d === 'stonewall') g.fillStyle = '#4a4440';
      g.fillRect(x * s, y * s, s, s);
    }
    g.fillStyle = '#b8743a';
    for (const b of mp.buildings) if (w.fog[b.y * mp.w + b.x] === '1') g.fillRect(b.x * s, b.y * s, b.w * s, b.h * s);
    g.fillStyle = '#3ad0ff';
    for (const k of mp.ruins) { if (w.opened[k]) continue; const [x, y] = k.split(',').map(Number); if (w.fog[y * mp.w + x] === '1') g.fillRect(x * s, y * s, s, s); }
    if (mp.chests) { g.fillStyle = '#f2c45a'; for (const k of Object.keys(mp.chests)) { if (w.opened[k]) continue; const [x, y] = k.split(',').map(Number); if (w.fog[y * mp.w + x] === '1') g.fillRect(x * s, y * s, s, s); } }
    if (mp.cave && w.fog[mp.cave[1] * mp.w + mp.cave[0]] === '1') { g.fillStyle = '#c27bff'; g.fillRect((mp.cave[0] - 1) * s, (mp.cave[1] - 1) * s, s * 4, s * 3); }
    if (w.fog[mp.lair.y * mp.w + mp.lair.x] === '1') { g.fillStyle = '#ff3b5c'; g.fillRect((mp.lair.x - 1) * s, (mp.lair.y - 1) * s, s * 3, s * 3); }
    if (mp.nodes) for (const [k, n] of Object.entries(mp.nodes)) { const [x, y] = k.split(',').map(Number); if (w.fog[y * mp.w + x] !== '1') continue; g.fillStyle = (w.ready[k] || 0) > state.steps ? '#6a6458' : AF.RES[AF.NODES[n].res].color; g.fillRect(x * s, y * s, s, s); }
    if (mp.hotspots) { g.fillStyle = '#e8803a'; for (const k of Object.keys(mp.hotspots)) { const [x, y] = k.split(',').map(Number); if (w.fog[y * mp.w + x] === '1' && hotReady(state, k)) g.fillRect(x * s, y * s, s, s); } }
    if (mp.boards) { g.fillStyle = '#f2c45a'; for (const k of Object.keys(mp.boards)) { const [x, y] = k.split(',').map(Number); if (w.fog[y * mp.w + x] === '1') g.fillRect((x - 1) * s, (y - 1) * s, s * 3, s * 3); } }
    const bt = w.bounty && mp.area === 'over' && w.enemies.find((e) => e.bounty);
    if (bt) { g.fillStyle = '#ffd24a'; g.beginPath(); g.arc((bt.x + 0.5) * s, (bt.y + 0.5) * s, s * 2.4, 0, 7); g.fill(); g.strokeStyle = '#3a2008'; g.lineWidth = 1.5; g.stroke(); }
    g.fillStyle = '#ffffff'; g.fillRect((w.px - 1) * s, (w.py - 1) * s, s * 3, s * 3);
    g.strokeStyle = '#202830'; g.strokeRect((w.px - 1) * s + 0.5, (w.py - 1) * s + 0.5, s * 3 - 1, s * 3 - 1);
    return Math.round(((w.fog.split('1').length - 1) / (mp.w * mp.h)) * 100);
  }

  AF.World = { validate, regionName, musicZone, pathTo, passable, REGIONS, poolFor: (x, y, r) => poolFor(over(), x, y, r || Math.random), finishGather, siteOf: (k) => siteOf(over(), k), clearHotspot, hotReady, bountyOffers, acceptBounty, dropBounty, completeBounty, bountyHint, useLure, map: () => map(), init, placeRobot, move, interact, facing, face, drawMap, draw: (c, s, t) => AF.Render.draw(c, s, t), removeEnemy, sendHome, inTown, describeHere, terrainHere, npcList,
    terrainAt: (state, x, y) => terr(state ? map(state) : map(), x, y), enterDungeon, leaveDungeon, townName, TOWNS, area: (s) => (s.world.area || 'over') };
})();
