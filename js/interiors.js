/* ArcForge — building interiors. Every building in Rivet Hollow has a room you can walk around in.
   Rooms are 11×8 tiles: a back wall (rows 0–1), floor (rows 2–6) and a door at the bottom middle. */
(function () {
  const AF = (window.AF = window.AF || {});
  const RW = 11, RH = 8, DOOR = [5, 7];
  const look = (o) => Object.assign({ name: '', body: 'm', skin: 1, hair: 1, hairColor: 1, top: 0, topColor: 0, bottom: 0, bottomColor: 5, hat: 0, acc: 0, core: 1 }, o);
  const LORE = [
    'An old log: "Titan Core output steady at 98%. Every bot in the city hums in sync. A beautiful sound."',
    'A field guide: "Spark Spitters keep their distance. A Rail Shot or a quick Thruster Dash evens the odds."',
    'A diary page: "The night the Titan went quiet, every robot in town froze. By morning, the ones outside had turned wild."',
    'A blueprint sketch of an Arc Core. Someone has scribbled "smaller, safer, ours" in the margin.',
    'A children\'s book: "Rusty the Robot Learns to Share." Somebody has read it many, many times.',
    'A map of the old city. A red circle marks the far mountains: "Titan vault?"',
  ];

  // kind: furniture type (drawn in render.js). act: what the action button does when facing it.
  AF.INTERIORS = {
    home: { floor: 'wood', wall: '#f6e3c4', trim: '#c88a5a', counter: false,
      items: [{ k: 'bed', x: 8, y: 2, w: 2, h: 2, act: 'rest', label: 'Rest' }, { k: 'wardrobe', x: 1, y: 2, act: 'wardrobe', label: 'Change' },
        { k: 'chest', x: 1, y: 5, act: 'pilot', label: 'Gear' }, { k: 'table', x: 4, y: 4, w: 2 }, { k: 'plant', x: 9, y: 6 }, { k: 'rug', x: 4, y: 5, w: 3, flat: true }] },
    forge: { floor: 'stone', wall: '#d8987a', trim: '#7a4a32', keeper: { name: 'Smith Ollie', look: look({ skin: 3, hair: 2, hairColor: 0, top: 3, topColor: 9, bottomColor: 9, hat: 3 }), line: 'Mara built the place, I keep it hot. What are we forging?' },
      items: [{ k: 'anvil', x: 2, y: 5, act: 'shop', label: 'Forge' }, { k: 'furnace', x: 9, y: 2 }, { k: 'barrel', x: 1, y: 2 }, { k: 'barrel', x: 9, y: 6 }] },
    cards: { floor: 'carpet', carpet: '#9a6ac8', wall: '#efe2ff', trim: '#7a4aa8', keeper: { name: 'Dealer Vivi', look: look({ body: 'f', skin: 0, hair: 4, hairColor: 6, top: 1, topColor: 4, bottom: 2, bottomColor: 5, acc: 2 }), line: 'Fresh packs, rare blueprints... take a look!' },
      items: [{ k: 'shelf', x: 1, y: 2 }, { k: 'shelf', x: 2, y: 2 }, { k: 'shelf', x: 8, y: 2 }, { k: 'shelf', x: 9, y: 2 }, { k: 'display', x: 2, y: 5 }, { k: 'display', x: 8, y: 5 }] },
    salvage: { floor: 'planks', wall: '#e8d8b8', trim: '#8a6a40', keeper: { name: 'Trader Bolt', look: look({ skin: 2, hair: 0, hairColor: 2, top: 2, topColor: 3, bottomColor: 9, hat: 5 }), line: 'Buy low, sell high, never sell your last bolt.' },
      items: [{ k: 'crate', x: 1, y: 4 }, { k: 'crate', x: 1, y: 5 }, { k: 'crate', x: 9, y: 5 }, { k: 'heap', x: 9, y: 3 }, { k: 'barrel', x: 1, y: 2 }] },
    garage: { floor: 'concrete', wall: '#c8d8e8', trim: '#3a5a88', keeper: { name: 'Mechanic Gil', look: look({ skin: 4, hair: 1, hairColor: 0, top: 3, topColor: 0, bottomColor: 0, hat: 1 }), line: 'Bring her in! Upgrades, repairs, a fresh coat of core paint.' },
      items: [{ k: 'lift', x: 1, y: 5, w: 2 }, { k: 'toolboard', x: 9, y: 2 }, { k: 'tires', x: 9, y: 5 }, { k: 'barrel', x: 1, y: 2 }] },
    bank: { floor: 'marble', wall: '#e8efe4', trim: '#3a7a4a', keeper: { name: 'Banker Ingot', look: look({ skin: 1, hair: 0, hairColor: 9, top: 1, topColor: 5, bottomColor: 5, hat: 8, acc: 2 }), line: 'Your valuables are safe with Ironclad. Nothing gets past the vault.' },
      items: [{ k: 'vault', x: 9, y: 2, act: 'shop', label: 'Vault' }, { k: 'plant', x: 1, y: 2 }, { k: 'plant', x: 1, y: 6 }, { k: 'bench', x: 8, y: 5, w: 2 }] },
    diner: { floor: 'checker', wall: '#fde8d8', trim: '#c84a3a', keeper: { name: 'Cook Mabel', look: look({ body: 'f', skin: 2, hair: 7, hairColor: 5, top: 0, topColor: 6, bottomColor: 1, acc: 1 }), line: 'Sit, eat! You look like you walked here from the Rustfields.' },
      items: [{ k: 'dtable', x: 2, y: 5 }, { k: 'dtable', x: 8, y: 5 }, { k: 'jukebox', x: 1, y: 2 }, { k: 'fridge', x: 9, y: 2 }] },
    academy: { floor: 'wood', wall: '#e0f2ee', trim: '#2a8a7a', keeper: { name: 'Instructor Sol', look: look({ skin: 5, hair: 3, hairColor: 0, top: 4, topColor: 7, bottomColor: 5, acc: 2 }), line: 'A good pilot keeps learning. Which skill shall we train today?' },
      items: [{ k: 'bookshelf', x: 1, y: 2, act: 'book', label: 'Read' }, { k: 'bookshelf', x: 9, y: 2, act: 'book', label: 'Read' }, { k: 'desk', x: 2, y: 5 }, { k: 'desk', x: 8, y: 5 }] },
    boutique: { floor: 'carpet', carpet: '#f0a8c4', wall: '#fff0f6', trim: '#c84a88', keeper: { name: 'Stylist Faye', look: look({ body: 'f', skin: 1, hair: 9, hairColor: 8, top: 1, topColor: 8, bottom: 2, bottomColor: 4, hat: 9 }), line: 'Darling! Gear that works AND looks fabulous.' },
      items: [{ k: 'rack', x: 1, y: 4 }, { k: 'rack', x: 1, y: 5 }, { k: 'rack', x: 9, y: 5 }, { k: 'mirror', x: 9, y: 2, act: 'wardrobe', label: 'Mirror' }, { k: 'plant', x: 1, y: 2 }] },
    archive: { floor: 'wood', wall: '#ece4f6', trim: '#5a4a8a', counter: false, keeper: { name: 'Page Quill', x: 5, y: 4, look: look({ skin: 0, hair: 4, hairColor: 2, top: 2, topColor: 4, bottom: 1, bottomColor: 9, acc: 2 }), line: 'Shh! Lune is outside, but you may read anything on the shelves.' },
      items: [1, 2, 3, 7, 8, 9].map((x) => ({ k: 'bookshelf', x, y: 2, act: 'book', label: 'Read' })).concat([{ k: 'desk', x: 2, y: 5 }, { k: 'desk', x: 8, y: 5 }]) },
    hall: { floor: 'marble', wall: '#e4ecfa', trim: '#3a5aa8', keeper: { name: 'Clerk Tibbs', look: look({ skin: 2, hair: 1, hairColor: 2, top: 1, topColor: 0, bottomColor: 5, acc: 2 }), line: 'Mayor Bram is out front. He likes to greet folks in person.', talk: true },
      items: [{ k: 'banner', x: 1, y: 2 }, { k: 'banner', x: 9, y: 2 }, { k: 'plant', x: 1, y: 6 }, { k: 'plant', x: 9, y: 6 }, { k: 'bench', x: 2, y: 5, w: 2 }] },
    cottage: { floor: 'wood', wall: '#fff2d8', trim: '#c87838', counter: false,
      items: [{ k: 'bed', x: 8, y: 2, w: 2, h: 2, act: 'flavor', label: 'Look', text: "Pip's bed. There's a robot plush on the pillow." }, { k: 'chest', x: 1, y: 2, act: 'flavor', label: 'Look', text: 'A toy chest full of bolts, springs and one very small wrench.' },
        { k: 'table', x: 4, y: 4, w: 2 }, { k: 'rug', x: 4, y: 5, w: 3, flat: true }, { k: 'plant', x: 1, y: 6 }] },
  };

  const I = (AF.Interiors = { W: RW, H: RH, DOOR });
  I.room = (id) => AF.INTERIORS[id];
  I.keeperPos = (id) => { const r = I.room(id); return r.keeper ? [r.keeper.x || 5, r.keeper.y || 2] : null; };

  // Tiles that block walking: walls, counter, furniture, keeper.
  I.solid = function (id, x, y) {
    const r = I.room(id);
    if (x === DOOR[0] && y === DOOR[1]) return false;
    if (x <= 0 || x >= RW - 1 || y <= 1 || y >= RH - 1) return true;
    if (r.counter !== false && y === 3 && x >= 3 && x <= 7) return true;
    const kp = I.keeperPos(id); if (kp && kp[0] === x && kp[1] === y) return true;
    return !!itemAt(r, x, y, true);
  };
  function itemAt(r, x, y, solidOnly) {
    return r.items.find((it) => !(solidOnly && it.flat) && x >= it.x && x < it.x + (it.w || 1) && y >= it.y && y < it.y + (it.h || 1));
  }

  I.enter = function (state, id) {
    const w = state.world;
    w.out = { px: w.px, py: w.py, rx: w.rx, ry: w.ry };
    w.inside = id; w.px = DOOR[0]; w.py = DOOR[1] - 1; w.rx = DOOR[0] - 1; w.ry = DOOR[1] - 1; w.dir = 'up';
    AF.Render.snap(); AF.sfx('card');
    const r = I.room(id);
    if (r.keeper) setTimeout(() => AF.game.toast(`${r.keeper.name}: "${r.keeper.line}"`, 4000), 250);
  };
  I.exit = function (state) {
    const w = state.world, o = w.out || {};
    w.inside = null; w.px = o.px; w.py = o.py; w.rx = o.rx; w.ry = o.ry; w.dir = 'down';
    AF.Render.snap(); AF.sfx('card');
  };

  I.move = function (state, dx, dy) {
    const w = state.world, id = w.inside, nx = w.px + dx, ny = w.py + dy;
    w.dir = { '0,1': 'down', '0,-1': 'up', '-1,0': 'left', '1,0': 'right' }[dx + ',' + dy];
    if (nx === DOOR[0] && ny === DOOR[1]) { I.exit(state); return { type: 'exit' }; }
    if (I.solid(id, nx, ny)) return { type: 'bump' };
    w.rx = w.px; w.ry = w.py; w.px = nx; w.py = ny;
    return null;
  };

  I.facing = function (state) {
    const w = state.world, id = w.inside, r = I.room(id);
    const [dx, dy] = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[w.dir] || [0, 1];
    const x = w.px + dx, y = w.py + dy, kp = I.keeperPos(id);
    if (x === DOOR[0] && y === DOOR[1]) return { kind: 'exit', label: 'Leave', x, y };
    if (kp && ((kp[0] === x && kp[1] === y) || (r.counter !== false && y === 3 && x >= 3 && x <= 7)))
      return { kind: 'keeper', label: r.keeper.talk ? 'Talk' : AF.SHOPS.includes(id) ? 'Shop' : 'Talk', x: kp[0], y: kp[1], tall: true };
    const it = itemAt(r, x, y, true);
    if (it && it.act) return { kind: 'item', item: it, label: it.label, x: it.x + (it.w || 1) / 2 - 0.5, y: it.y };
    return null;
  };

  I.interact = function (state) {
    const f = I.facing(state), id = state.world.inside, r = I.room(id);
    if (!f) return null;
    if (f.kind === 'exit') { I.exit(state); return { type: 'exit' }; }
    if (f.kind === 'keeper') {
      if (AF.SHOPS.includes(id) && !r.keeper.talk) return { type: 'shop', id };
      return { type: 'say', who: r.keeper.name, look: r.keeper.look, text: r.keeper.line };
    }
    const it = f.item;
    switch (it.act) {
      case 'shop': return { type: 'shop', id };
      case 'rest': return { type: 'shop', id: 'home' };
      case 'wardrobe': return { type: 'wardrobe' };
      case 'pilot': return { type: 'panel', tab: 'pilot' };
      case 'book': return { type: 'say', text: LORE[Math.floor(Math.random() * LORE.length)] };
      case 'flavor': return { type: 'say', text: it.text };
    }
    return null;
  };
})();
