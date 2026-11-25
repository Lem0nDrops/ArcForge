/* ArcForge — game data: resources, automaton parts, cards, enemies.
   Everything that defines "content" lives here so you can tweak balance
   or add new cards/enemies without touching game logic. */
(function () {
  const AF = (window.AF = window.AF || {});

  // ---------- Resources ----------
  AF.RES = {
    scrap:    { name: 'Scrap',    color: '#a9b4bd' },
    copper:   { name: 'Copper',   color: '#e0894a' },
    silicon:  { name: 'Silicon',  color: '#9fd8f0' },
    arcite:   { name: 'Arcite',   color: '#c27bff' },
    circuits: { name: 'Circuits', color: '#7ee08a' },
  };
  AF.RES_KEYS = Object.keys(AF.RES);

  // ---------- Automaton parts ----------
  AF.MAX_LVL = 5;
  AF.PARTS = {
    arc:    { name: 'Arc Core',   role: 'Power supply',
              tiers: ['Spark Cell', 'Dynamo', 'Fusion Arc', 'Storm Arc', 'Star Arc'] },
    frame:  { name: 'Frame',      role: 'Body & armor',
              tiers: ['Scrap Frame', 'Steel Frame', 'Alloy Frame', 'Titan Frame', 'Arcsteel Frame'] },
    legs:   { name: 'Locomotion', role: 'Movement',
              tiers: ['Wheels', 'Treads', 'Hover Jets', 'Spider Legs', 'Grav Walkers'] },
    arms:   { name: 'Arms',       role: 'Utility & gathering',
              tiers: ['Grabbers', 'Drill Arms', 'Servo Arms', 'Multi-Tool', 'Nano Arms'] },
    weapon: { name: 'Weapon',     role: 'Attack power',
              tiers: ['Bolt Gun', 'Pulse Rifle', 'Plasma Cannon', 'Ion Lance', 'Arc Cannon'] },
    shield: { name: 'Shield',     role: 'Defense power',
              tiers: ['Plate', 'Barrier', 'Deflector', 'Aegis', 'Arc Aegis'] },
  };
  AF.PART_KEYS = Object.keys(AF.PARTS);

  // Derived automaton stats from part levels.
  AF.baseStats = function (p) {
    return {
      energy: 3 + Math.floor((p.arc - 1) / 2),          // 3,3,4,4,5
      maxHp: 30 + (p.frame - 1) * 12,                   // 30..78
      hand: 5 + (p.arms >= 3 ? 1 : 0) + (p.arms >= 5 ? 1 : 0),
      gather: p.arms,                                   // extra yield per node
      dmg: (p.weapon - 1) * 2,                          // bonus per attack hit
      block: (p.shield - 1) * 2,                        // bonus per block card
      evade: p.legs - 1,                                // bonus block on Move cards
      legs: p.legs,
    };
  };

  // Pass a whole save to include pilot level and gear; pass parts for the automaton alone.
  AF.stats = (a) => (a && a.parts ? AF.fullStats(a) : AF.baseStats(a));

  // What each upgrade does, in words (for the workshop).
  AF.partEffect = function (key, lvl) {
    const s = AF.stats({ arc: lvl, frame: lvl, legs: lvl, arms: lvl, weapon: lvl, shield: lvl });
    switch (key) {
      case 'arc': return `${s.energy} energy per turn`;
      case 'frame': return `${s.maxHp} max HP`;
      case 'legs': return `Crosses ${AF.TERRAIN_BY_LEGS[lvl]}` + (s.evade ? `, Move cards +${s.evade} Block` : '');
      case 'arms': return `Draw ${s.hand} cards, +${lvl - 1} gather` + (lvl >= 2 ? ', mines Arcite' : '');
      case 'weapon': return `+${s.dmg} damage per hit`;
      case 'shield': return `+${s.block} Block per defend card`;
    }
  };

  // Cost to upgrade FROM level n to n+1 (same table for every part).
  AF.UPGRADE_COST = {
    1: { scrap: 8, copper: 4, credits: 1000 },
    2: { scrap: 14, copper: 8, silicon: 4, circuits: 1, credits: 300 },
    3: { scrap: 20, copper: 12, silicon: 8, arcite: 3, circuits: 2, credits: 600 },
    4: { scrap: 30, copper: 18, silicon: 12, arcite: 6, circuits: 4, credits: 1000 },
  };

  // ---------- Terrain ----------
  // legs = minimum Locomotion level needed to enter.
  AF.TERRAIN = {
    water:    { name: 'Water',     legs: 3, color: '#5090e8' },
    sand:     { name: 'Sand',      legs: 1, color: '#f0dc98' },
    grass:    { name: 'Grassland', legs: 1, color: '#88d068' },
    forest:   { name: 'Tall grass', legs: 1, color: '#58a840' },
    rubble:   { name: 'Rubble',    legs: 2, color: '#b8a890' },
    mountain: { name: 'Mountains', legs: 4, color: '#b8905a' },
    path:     { name: 'Rivet Hollow', legs: 1, color: '#e8d8a0' },
    lawn:     { name: 'Rivet Hollow', legs: 1, color: '#90d870' },
  };
  AF.TERRAIN_BY_LEGS = {
    1: 'grass, sand & forest', 2: '+ rubble', 3: '+ water', 4: '+ mountains', 5: 'everything, fast',
  };

  // Resource nodes on the map.
  AF.NODES = {
    scrap:   { res: 'scrap',   amount: [1, 3], respawn: 220, label: 'Scrap pile' },
    copper:  { res: 'copper',  amount: [1, 2], respawn: 260, label: 'Copper vein' },
    silicon: { res: 'silicon', amount: [1, 2], respawn: 280, label: 'Silicon crystals' },
    arcite:  { res: 'arcite',  amount: [1, 1], respawn: 400, label: 'Arcite crystal', arms: 2 },
  };

  // ---------- Cards ----------
  // kind: attack | defend | move | repair | tech
  // range (attacks only): max distance the target can be at. 0=Close, 1=Mid, 2=Far
  // Effects: dmg, hits, block, move ('in'|'out'|'close'), heal, draw, energy,
  //          selfDmg, charge, stun, fortify, tune, bash, salvage, exhaust
  // recipe: resources to forge one copy. bp: needs a blueprint from ruins first.
  // up: overrides for the upgraded (+) version. Default: dmg/block/heal x1.4.
  // con: which Construct can use the card (no con = any automaton). bp = blueprint (must be found or bought first).
  AF.CARDS = {
    // ----- Core cards: every construct -----
    claw:      { name: 'Claw Swipe',    cost: 1, kind: 'attack', range: 0, dmg: 6, recipe: { scrap: 3 } },
    blaster:   { name: 'Blaster Shot',  cost: 1, kind: 'attack', range: 1, dmg: 4, recipe: { scrap: 3, copper: 1 } },
    brace:     { name: 'Brace',         cost: 1, kind: 'defend', block: 5, recipe: { scrap: 3 } },
    advance:   { name: 'Advance',       cost: 1, kind: 'move', move: 'in', draw: 1, recipe: { scrap: 2 }, up: { cost: 0 } },
    retreat:   { name: 'Retreat',       cost: 1, kind: 'move', move: 'out', block: 3, recipe: { scrap: 2 } },
    patch:     { name: 'Patch Kit',     cost: 1, kind: 'repair', heal: 4, exhaust: true, recipe: { scrap: 4 } },
    scan:      { name: 'Scan',          cost: 0, kind: 'tech', draw: 2, exhaust: true, recipe: { silicon: 3 }, up: { draw: 3 } },
    piston:    { name: 'Piston Punch',  cost: 2, kind: 'attack', range: 0, dmg: 12, recipe: { scrap: 6, copper: 3 } },
    rail:      { name: 'Rail Shot',     cost: 2, kind: 'attack', range: 2, dmg: 9, recipe: { scrap: 5, copper: 4, silicon: 2 } },
    scatter:   { name: 'Scatter Burst', cost: 1, kind: 'attack', range: 1, dmg: 3, hits: 2, recipe: { scrap: 4, copper: 2 } },
    salvager:  { name: 'Salvage Claw',  cost: 1, kind: 'attack', range: 0, dmg: 5, salvage: 2, recipe: { scrap: 5 } },
    dash:      { name: 'Thruster Dash', cost: 1, kind: 'move', move: 'close', block: 3, recipe: { scrap: 4, copper: 2 } },
    deflector: { name: 'Deflector',     cost: 1, kind: 'defend', block: 4, draw: 1, bp: true, recipe: { copper: 3, silicon: 2 } },
    magnet:    { name: 'Magnet Pull',   cost: 1, kind: 'attack', range: 2, dmg: 3, move: 'close', bp: true, recipe: { scrap: 4, copper: 3 } },
    weld:      { name: 'Weld Torch',    cost: 2, kind: 'repair', heal: 9, exhaust: true, bp: true, recipe: { scrap: 6, copper: 4, silicon: 2 } },
    nano:      { name: 'Nano Swarm',    cost: 1, kind: 'repair', heal: 3, draw: 1, exhaust: true, bp: true, recipe: { silicon: 3, arcite: 1 } },
    overclock: { name: 'Overclock',     cost: 0, kind: 'tech', energy: 2, selfDmg: 3, bp: true, recipe: { copper: 3, arcite: 1 }, up: { energy: 3 } },
    emp:       { name: 'EMP Pulse',     cost: 2, kind: 'tech', stun: 1, exhaust: true, bp: true, recipe: { silicon: 4, arcite: 2, circuits: 1 }, up: { cost: 1 } },
    tune:      { name: 'Field Tune-Up', cost: 1, kind: 'tech', tune: 2, exhaust: true, bp: true, recipe: { copper: 6, circuits: 1 }, up: { tune: 3 } },

    // ----- The Bulwark: block, hold, punish -----
    counter:   { con: 'bulwark', name: 'Counterstrike',  cost: 1, kind: 'attack', range: 0, dmg: 4, ifBlock: 5, recipe: { scrap: 4, copper: 1 } },
    bash:      { con: 'bulwark', name: 'Shield Bash',    cost: 1, kind: 'attack', range: 0, bash: true, recipe: { scrap: 4, copper: 3 }, up: { cost: 0 } },
    spikes:    { con: 'bulwark', name: 'Spiked Plating', cost: 1, kind: 'defend', block: 5, thorns: 3, recipe: { scrap: 4, copper: 1 } },
    hold:      { con: 'bulwark', name: 'Hold the Line',  cost: 1, kind: 'defend', block: 6, retain: true, recipe: { scrap: 5 } },
    rampart:   { con: 'bulwark', name: 'Rampart Charge', cost: 1, kind: 'move', move: 'in', block: 5, recipe: { scrap: 4 } },
    slam:      { con: 'bulwark', name: 'Bulwark Slam',   cost: 2, kind: 'attack', range: 0, dmg: 8, block: 6, recipe: { scrap: 6, copper: 2 } },
    ironwall:  { con: 'bulwark', name: 'Iron Wall',      cost: 2, kind: 'defend', block: 12, recipe: { scrap: 8, copper: 2 } },
    fortify:   { con: 'bulwark', name: 'Reinforce',      cost: 2, kind: 'tech', fortify: 3, exhaust: true, bp: true, recipe: { scrap: 10, copper: 6, circuits: 1 }, up: { fortify: 5 } },
    aegis:     { con: 'bulwark', name: 'Aegis Field',    cost: 2, kind: 'defend', block: 8, thorns: 5, bp: true, recipe: { copper: 5, silicon: 3, arcite: 1 } },
    unbreak:   { con: 'bulwark', name: 'Unbreakable',    cost: 3, kind: 'defend', block: 20, retain: true, bp: true, recipe: { scrap: 12, copper: 6, circuits: 2 } },
    vengeance: { con: 'bulwark', name: 'Vengeance Ram',  cost: 2, kind: 'attack', range: 0, bash: true, bonus: 6, bp: true, recipe: { scrap: 8, copper: 4, arcite: 2 } },

    // ----- The Sprocket: speed and combo chains -----
    jab:       { con: 'sprocket', name: 'Quick Jab',     cost: 0, kind: 'attack', range: 0, dmg: 3, combo: 1, recipe: { scrap: 3 } },
    flurry:    { con: 'sprocket', name: 'Gear Flurry',   cost: 1, kind: 'attack', range: 0, dmg: 2, hits: 3, recipe: { scrap: 4, copper: 1 } },
    spinkick:  { con: 'sprocket', name: 'Spin Kick',     cost: 1, kind: 'attack', range: 0, dmg: 5, combo: 2, recipe: { scrap: 4, copper: 2 } },
    ratchet:   { con: 'sprocket', name: 'Ratchet Shot',  cost: 1, kind: 'attack', range: 1, dmg: 3, combo: 2, recipe: { scrap: 3, copper: 2 } },
    zip:       { con: 'sprocket', name: 'Zip Step',      cost: 0, kind: 'move', move: 'in', recipe: { scrap: 2 } },
    slipstream:{ con: 'sprocket', name: 'Slipstream',    cost: 1, kind: 'move', move: 'out', block: 3, draw: 1, recipe: { scrap: 3, copper: 1 } },
    revup:     { con: 'sprocket', name: 'Rev Up',        cost: 0, kind: 'tech', energy: 1, draw: 1, exhaust: true, recipe: { copper: 2, silicon: 1 } },
    finisher:  { con: 'sprocket', name: 'Overdrive Finisher', cost: 2, kind: 'attack', range: 0, dmg: 6, combo: 4, recipe: { scrap: 6, copper: 3, silicon: 1 } },
    whirl:     { con: 'sprocket', name: 'Whirlwind',     cost: 2, kind: 'attack', range: 0, dmg: 3, hits: 4, bp: true, recipe: { scrap: 6, copper: 4, arcite: 1 } },
    turbo:     { con: 'sprocket', name: 'Turbo Burst',   cost: 0, kind: 'tech', energy: 2, draw: 1, exhaust: true, bp: true, recipe: { copper: 4, arcite: 1 } },
    chain:     { con: 'sprocket', name: 'Chain Drive',   cost: 1, kind: 'attack', range: 0, dmg: 4, combo: 3, draw: 1, bp: true, recipe: { scrap: 5, copper: 3, circuits: 1 } },

    // ----- The Arcwright: keep away, hit hard from range -----
    arcbolt:   { con: 'arcwright', name: 'Arc Bolt',     cost: 1, kind: 'attack', range: 2, dmg: 4, recipe: { scrap: 3, copper: 1 } },
    volley:    { con: 'arcwright', name: 'Spark Volley', cost: 1, kind: 'attack', range: 2, dmg: 2, hits: 2, recipe: { scrap: 3, copper: 2 } },
    chargeshot:{ con: 'arcwright', name: 'Charged Shot', cost: 2, kind: 'attack', range: 2, dmg: 7, farBonus: 4, recipe: { copper: 4, silicon: 2 } },
    repulse:   { con: 'arcwright', name: 'Repulsor Wave',cost: 1, kind: 'attack', range: 0, dmg: 3, push: true, block: 3, recipe: { scrap: 3, copper: 2 } },
    kite:      { con: 'arcwright', name: 'Kite',         cost: 1, kind: 'move', move: 'out', block: 2, draw: 1, recipe: { scrap: 3 } },
    static:    { con: 'arcwright', name: 'Static Field', cost: 1, kind: 'tech', field: 4, recipe: { copper: 3, silicon: 1 } },
    capacitor: { con: 'arcwright', name: 'Capacitor',    cost: 1, kind: 'tech', charge: 6, recipe: { copper: 4, silicon: 2 }, up: { charge: 9 } },
    lance:     { con: 'arcwright', name: 'Arc Lance',    cost: 3, kind: 'attack', range: 2, dmg: 18, farBonus: 6, bp: true, recipe: { copper: 6, arcite: 4, circuits: 2 } },
    tesla:     { con: 'arcwright', name: 'Tesla Coil',   cost: 2, kind: 'attack', range: 2, dmg: 6, field: 4, bp: true, recipe: { copper: 5, silicon: 3, arcite: 1 } },
    blink:     { con: 'arcwright', name: 'Phase Blink',  cost: 0, kind: 'move', move: 'far', block: 2, bp: true, recipe: { silicon: 4, arcite: 1 } },
  };

  // ----- The three Constructs -----
  // hpMul: max HP multiplier · speed 1-3 (draws, dodge Block, starting distance) · passive: battle rule in battle.js
  AF.CONSTRUCTS = {
    bulwark: { name: 'The Bulwark', short: 'Bulwark', tag: 'Heavy frame · shield plating', hpMul: 1.4, speed: 1, hp: 3, spd: 1, rng: 1,
      text: 'Slow but tanky. Specialises in defense and punishing counterattacks.',
      passive: 'Keeps half its Block between turns. When an attack is fully blocked, strikes back for 3. Defend cards +2 Block. Starts fights one step closer.',
      deck: { claw: 4, counter: 3, bash: 2, slam: 2, blaster: 1, brace: 5, spikes: 3, hold: 2, ironwall: 1, advance: 2, rampart: 2, patch: 2, scan: 1 },
      bot: { name: 'Bastion', chassis: 'boxy', head: 'square', eyes: 'visor', antenna: 'none', paint: 10, trim: 4 } },
    sprocket: { name: 'The Sprocket', short: 'Sprocket', tag: 'Midweight frame · built for speed', hpMul: 0.85, speed: 3, hp: 1, spd: 3, rng: 1,
      text: 'Fragile but hits hard. Chains cards together for big combos.',
      passive: 'Combo: each card played this turn powers up combo cards. Every 3rd card in a turn draws 1. Draws 1 extra card per turn. Move cards +2 Block.',
      deck: { jab: 4, claw: 3, flurry: 2, spinkick: 3, ratchet: 2, finisher: 1, brace: 4, advance: 2, zip: 3, slipstream: 2, retreat: 1, revup: 2, patch: 1 },
      bot: { name: 'Zippy', chassis: 'round', head: 'dome', eyes: 'happy', antenna: 'bolt', paint: 5, trim: 4 } },
    arcwright: { name: 'The Arcwright', short: 'Arcwright', tag: 'Lightweight frame · arc emitters', hpMul: 0.95, speed: 2, hp: 2, spd: 2, rng: 3,
      text: 'Fragile up close, devastating at range.',
      passive: 'Attacks deal +1 at Mid and +3 at Far. Takes +2 damage per hit at Close. Move cards +1 Block.',
      deck: { arcbolt: 5, blaster: 3, volley: 2, chargeshot: 2, repulse: 2, brace: 5, retreat: 3, kite: 3, static: 2, patch: 2, capacitor: 1 },
      bot: { name: 'Volta', chassis: 'tall', head: 'dome', eyes: 'round', antenna: 'ball', paint: 2, trim: 8 } },
  };
  AF.starterDeck = (con) => Object.entries(AF.CONSTRUCTS[con].deck).flatMap(([id, n]) => Array(n).fill(id));
  AF.canUse = (s, id) => !AF.CARDS[id].con || AF.CARDS[id].con === s.construct;
  AF.lockedCards = (s) => Object.keys(AF.CARDS).filter((id) => AF.canUse(s, id) && !s.known.includes(id));
  AF.knownFor = (con) => Object.keys(AF.CARDS).filter((id) => !AF.CARDS[id].bp && (!AF.CARDS[id].con || AF.CARDS[id].con === con));
  AF.DECK_SIZE = 30;
  AF.DECK_MIN = 30;
  AF.DECK_MAX = 30;
  AF.CARD_UPGRADE_COST = { scrap: 5, circuits: 1 };

  // Merge base card + upgrade into an effective definition.
  AF.cardDef = function (inst) {
    const base = AF.CARDS[inst.id];
    if (!inst.plus) return Object.assign({ id: inst.id }, base);
    const d = Object.assign({ id: inst.id }, base);
    if (base.up) Object.assign(d, base.up);
    else {
      let changed = false;
      ['dmg', 'block', 'heal'].forEach((k) => { if (base[k]) { d[k] = Math.ceil(base[k] * 1.4); changed = true; } });
      if (!changed) d.cost = Math.max(0, base.cost - 1);
    }
    d.name = base.name + '+';
    return d;
  };

  AF.RANGE_NAMES = ['Close', 'Mid', 'Far'];
  AF.rangeLabel = (r) => (r === 0 ? 'Close only' : r === 1 ? 'Close–Mid' : 'Any range');

  // Rules text. st = automaton stats (for bonuses), ctx = battle context (charge/tune/block)
  AF.cardText = function (d, st, ctx) {
    st = st || { dmg: 0, block: 0, evade: 0 };
    ctx = ctx || {};
    const out = [];
    const dmgBonus = st.dmg + (ctx.tune || 0);
    if (d.bash) out.push(`Deal damage equal to your Block${ctx.block != null ? ` (${ctx.block + dmgBonus})` : ''}.`);
    const rangeB = st.con === 'arcwright' && ctx.dist != null && d.kind === 'attack' ? [0, 1, 3][ctx.dist] : 0;
    if (d.bonus) out.push(`+${d.bonus} damage.`);
    if (d.dmg) {
      const n = d.dmg + dmgBonus + (ctx.charge || 0) + rangeB + (d.combo ? d.combo * (ctx.combo || 0) : 0) + (d.farBonus && ctx.dist === 2 ? d.farBonus : 0);
      out.push(`Deal ${n} damage${d.hits > 1 ? ` ${d.hits} times` : ''}.`);
    }
    if (d.combo) out.push(`Combo: +${d.combo} per card played this turn${ctx.combo ? ` (${ctx.combo})` : ''}.`);
    if (d.ifBlock) out.push(`+${d.ifBlock} if you have Block.`);
    if (d.farBonus) out.push(`+${d.farBonus} at Far.`);
    if (d.push) out.push('Knock enemy back.');
    if (d.move === 'in') out.push('Move closer.');
    if (d.move === 'out') out.push('Move away.');
    if (d.move === 'close') out.push(d.kind === 'attack' ? 'Pull enemy to Close.' : 'Rush to Close.');
    if (d.move === 'far') out.push('Jump to Far.');
    if (d.block) {
      const b = d.block + (d.kind === 'defend' ? st.block : 0) + (d.kind === 'move' ? st.evade : 0);
      out.push(`Gain ${b} Block.`);
    } else if (d.kind === 'move' && st.evade) out.push(`Gain ${st.evade} Block.`);
    if (d.thorns) out.push(`Thorns ${d.thorns}: hits on you this round deal ${d.thorns} back.`);
    if (d.retain) out.push('Keep all Block next turn.');
    if (d.field) out.push(`Field ${d.field}: enemy takes ${d.field} when it moves closer.`);
    if (d.heal) out.push(`Repair ${d.heal} HP.`);
    if (d.draw) out.push(`Draw ${d.draw}.`);
    if (d.energy) out.push(`Gain ${d.energy} energy.`);
    if (d.selfDmg) out.push(`Take ${d.selfDmg} damage.`);
    if (d.charge) out.push(`Next attack +${d.charge} damage.`);
    if (d.stun) out.push('Enemy skips its next action.');
    if (d.fortify) out.push(`Gain ${d.fortify} Block every turn.`);
    if (d.tune) out.push(`Attacks deal +${d.tune} this battle.`);
    if (d.salvage) out.push(`+${d.salvage} Scrap if this wins.`);
    if (d.exhaust) out.push('Single use per battle.');
    return out.join(' ');
  };

  // ---------- Enemies ----------
  // Intents: hit (needs range), shoot (any range ≤ r), block, aim (+dmg next),
  //          retreat, drain (hit + heal), overcharge (+dmg forever)
  AF.ENEMIES = {
    scrapling: { name: 'Scrapling', tier: 1, hp: 18, start: 1, body: '#b5654a',
      pattern: [{ a: 'hit', dmg: 6, r: 0 }, { a: 'block', block: 5 }, { a: 'hit', dmg: 7, r: 0 }],
      loot: { scrap: [3, 6], copper: [0, 2] } },
    spitter: { name: 'Spark Spitter', tier: 1, hp: 18, start: 2, body: '#c99a2e',
      pattern: [{ a: 'shoot', dmg: 5, r: 2 }, { a: 'retreat' }, { a: 'shoot', dmg: 6, r: 2 }],
      loot: { copper: [2, 4], silicon: [0, 2] } },
    rustbiter: { name: 'Rustbiter', tier: 2, hp: 44, start: 1, body: '#8c3b2b',
      pattern: [{ a: 'hit', dmg: 13, r: 0 }, { a: 'hit', dmg: 7, hits: 2, r: 0 }, { a: 'block', block: 9 }],
      loot: { scrap: [5, 9], copper: [2, 4], circuits: [0, 1] } },
    sniper: { name: 'Drone Sniper', tier: 2, hp: 32, start: 2, body: '#4d7ea8',
      pattern: [{ a: 'aim', dmg: 7 }, { a: 'shoot', dmg: 12, r: 2 }, { a: 'retreat' }],
      loot: { silicon: [2, 4], copper: [1, 3], circuits: [0, 1] } },
    shellback: { name: 'Shellback', tier: 2, hp: 55, start: 1, body: '#5f7a4b',
      pattern: [{ a: 'block', block: 14 }, { a: 'hit', dmg: 12, r: 0 }, { a: 'shoot', dmg: 7, r: 1 }],
      loot: { scrap: [6, 10], silicon: [1, 3], circuits: [0, 2] } },
    wraith: { name: 'Arc Wraith', tier: 3, hp: 75, start: 1, body: '#8a4fd1',
      pattern: [{ a: 'shoot', dmg: 12, r: 1 }, { a: 'drain', dmg: 10, r: 1 }, { a: 'block', block: 12 }, { a: 'shoot', dmg: 18, r: 1 }],
      loot: { arcite: [2, 3], silicon: [2, 4], circuits: [1, 2] } },
    juggernaut: { name: 'Juggernaut', tier: 3, hp: 95, start: 2, body: '#6b6f75',
      pattern: [{ a: 'hit', dmg: 24, r: 0 }, { a: 'block', block: 16 }, { a: 'hit', dmg: 12, hits: 2, r: 0 }, { a: 'shoot', dmg: 11, r: 2 }],
      loot: { scrap: [10, 16], copper: [4, 7], circuits: [1, 3] } },
    titan: { name: 'Titan Core', tier: 4, hp: 240, start: 2, boss: true, body: '#b8323f',
      pattern: [{ a: 'shoot', dmg: 14, r: 2 }, { a: 'hit', dmg: 30, r: 0 }, { a: 'block', block: 22 },
                { a: 'overcharge', dmg: 4 }, { a: 'shoot', dmg: 10, hits: 2, r: 2 }, { a: 'drain', dmg: 18, r: 1 }],
      loot: { arcite: [8, 8], circuits: [6, 6] } },
  };
  // Credits dropped per enemy tier [min, max]
  // Money dropped (in Bolts) and the chance that a bot drops money / each material at all.
  AF.CREDITS_BY_TIER = { 1: [40, 90], 2: [100, 180], 3: [220, 340], 4: [2500, 2500] };
  AF.DROP = { money: 0.6, material: 0.35, gear: { 1: 0.04, 2: 0.07, 3: 0.11 } };

  // ---------- The shared world ----------
  // Every player explores the same map: it's always built from this seed.
  AF.WORLD_SEED = 20261125;

  // ---------- Town: Rivet Hollow ----------
  // x, y, w, h = footprint in town tiles (the town is 34×28). The door is the bottom-middle tile.
  AF.TOWN_NAME = 'Rivet Hollow';
  AF.BUILDINGS = {
    home:     { name: 'Your House',          sign: 'HOME',     x: 2,  y: 3,  w: 5, h: 4, roof: '#d85040', blurb: 'Rest to restore your pilot, and change clothes.' },
    archive:  { name: 'The Archive',         sign: 'ARCHIVE',  x: 8,  y: 2,  w: 6, h: 5, roof: '#7058b8', blurb: '' },
    hall:     { name: 'Town Hall',           sign: 'TOWN HALL', x: 19, y: 2, w: 7, h: 5, roof: '#4878c8', blurb: '' },
    cards:    { name: 'The Deckhouse',       sign: 'CARDS',    x: 28, y: 3,  w: 5, h: 4, roof: '#a050b8', blurb: 'Buy and sell cards and blueprints.' },
    bank:     { name: 'Ironclad Bank',       sign: 'BANK',     x: 2,  y: 9,  w: 5, h: 4, roof: '#4a9a58', blurb: 'Store money and materials safely.' },
    salvage:  { name: 'Salvage Exchange',    sign: 'SALVAGE',  x: 8,  y: 9,  w: 5, h: 4, roof: '#c88a30', blurb: 'Buy and sell card components.' },
    garage:   { name: 'Bolt & Gear Garage',  sign: 'GARAGE',   x: 19, y: 9,  w: 5, h: 4, roof: '#3868b8', blurb: 'Automaton part upgrades, repairs and core paint.' },
    diner:    { name: 'Sparkplug Diner',     sign: 'DINER',    x: 26, y: 9,  w: 5, h: 4, roof: '#e05848', blurb: 'Food, healing and battle buffs for your pilot.' },
    forge:    { name: 'Rivet Forge',         sign: 'FORGE',    x: 3,  y: 19, w: 6, h: 5, roof: '#5a6878', blurb: 'Forge cards, upgrade cards, build your deck.' },
    academy:  { name: 'Pilot Academy',       sign: 'ACADEMY',  x: 10, y: 20, w: 5, h: 4, roof: '#38a898', blurb: 'Permanent pilot skills.' },
    boutique: { name: 'Gearwear Boutique',   sign: 'BOUTIQUE', x: 19, y: 20, w: 5, h: 4, roof: '#e070a8', blurb: 'Clothes, headwear and accessories.' },
    cottage:  { name: "Pip's Cottage",       sign: '',         x: 26, y: 20, w: 4, h: 4, roof: '#c87838', blurb: '' },
  };
  // Buildings that open a panel. The others start a conversation instead.
  AF.SHOPS = ['home', 'cards', 'bank', 'salvage', 'garage', 'diner', 'forge', 'academy', 'boutique'];

  AF.TIERS = { 1: ['scrapling', 'spitter'], 2: ['rustbiter', 'sniper', 'shellback'], 3: ['wraith', 'juggernaut'] };
})();
