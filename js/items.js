/* ArcForge — money (3 tiers), pilot levels & XP, gear (inventory + equipment) and combined stats. */
(function () {
  const AF = (window.AF = window.AF || {});

  // ---------- Money: 100 Bolts = 1 Gear, 100 Gears = 1 Core. Stored as Bolts. ----------
  AF.COINS = [
    { key: 'core', name: 'Cores', one: 'Core', value: 10000, color: '#ffcf3a', rim: '#c8901a' },
    { key: 'gear', name: 'Gears', one: 'Gear', value: 100, color: '#d8dee8', rim: '#8a94a6' },
    { key: 'bolt', name: 'Bolts', one: 'Bolt', value: 1, color: '#e09a5a', rim: '#9a5a2a' },
  ];
  AF.CREDIT_COLOR = '#ffcf3a';
  const split = (n) => { n = Math.max(0, Math.floor(Math.abs(n))); return AF.COINS.map((c) => { const k = Math.floor(n / c.value); n -= k * c.value; return [c, k]; }); };
  AF.moneyText = function (n) {
    const parts = split(n).filter(([, k]) => k);
    if (!parts.length) return '0 Bolts';
    return (n < 0 ? '-' : '') + parts.map(([c, k]) => `${k} ${k === 1 ? c.one : c.name}`).join(' ');
  };
  // Compact coin chips: ● 3 ● 25 ● 40
  AF.moneyHtml = function (n, short, showZero) {
    const parts = split(n).filter(([, k], i, a) => k || (showZero && i === a.length - 1));
    const list = parts.length ? parts : [[AF.COINS[2], 0]];
    return `<span class="money${short ? ' short' : ''}" title="${AF.moneyText(n)}">${n < 0 ? '−' : ''}${list.map(([c, k]) => `<span class="coin"><i style="--c:${c.color};--r:${c.rim}"></i>${k}</span>`).join('')}</span>`;
  };

  // ---------- Levels ----------
  AF.MAX_LEVEL = 50;
  AF.xpNeed = (L) => Math.round(40 * Math.pow(L, 1.6));
  AF.XP_BY_TIER = { 1: 12, 2: 30, 3: 70, 4: 600 };
  AF.levelPerks = (L) => ({ hp: (L - 1) * 3, vit: L - 1, hand: (L >= 5 ? 1 : 0) + (L >= 15 ? 1 : 0), energy: L >= 10 ? 1 : 0 });
  AF.gainXP = function (s, n) {
    const st = AF.stats(s);
    n = Math.round(n * (1 + st.xp));
    s.xp += n;
    let ups = 0;
    while (s.level < AF.MAX_LEVEL && s.xp >= AF.xpNeed(s.level)) { s.xp -= AF.xpNeed(s.level); s.level++; ups++; }
    if (ups) {
      const nst = AF.stats(s);
      s.hp = nst.maxHp; s.pilot.vit = AF.pilotMaxVit(s);
      const p = AF.levelPerks(s.level), extra = s.level === 5 || s.level === 15 ? ' +1 card in hand!' : s.level === 10 ? ' +1 energy per turn!' : '';
      setTimeout(() => { AF.sfx('win'); AF.game && AF.game.toast(`Level up! You're now level ${s.level}. Automaton HP and pilot vitality refilled.${extra}`, 5000); }, 400);
      if (AF.game && AF.game.levelFx) AF.game.levelFx();
    }
    return n;
  };

  // ---------- Wearables: every piece shows on your pilot, and most give stats ----------
  AF.RARITY = {
    common: { name: 'Common', color: '#9aa4b4' }, uncommon: { name: 'Uncommon', color: '#3ec46e' },
    rare: { name: 'Rare', color: '#3aa0ff' }, epic: { name: 'Epic', color: '#b46aff' },
  };
  AF.EQ_SLOTS = { hat: 'Hat', face: 'Face', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', gloves: 'Gloves', cape: 'Back', tool: 'Tool', charm1: 'Charm', charm2: 'Charm' };
  AF.WEAR_SLOTS = ['hat', 'face', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'tool'];
  const I = (name, slot, rarity, price, stats, s, a, b, set) => ({ name, slot, rarity, price, stats, vis: s ? { s, a, b } : null, set });
  // price in Bolts (0 = not sold: starter, quest or drop only)
  AF.ITEMS = {
    // hats
    leather_cap: I('Leather Cap', 'hat', 'common', 150, { block: 1 }, 'cap', '#9a6438', '#5a3a20'),
    red_bandana: I('Red Bandana', 'hat', 'common', 120, { luck: 0.03 }, 'bandana', '#d83a3a', '#ffffff', 'waste'),
    beanie_blue: I('Cozy Beanie', 'hat', 'common', 150, { hunger: 2 }, 'beanie', '#3a7cf0', '#ffffff'),
    ribbon_bow: I('Ribbon Bow', 'hat', 'common', 180, { money: 0.03 }, 'bow', '#ff6aa8', '#ffffff', 'pastel'),
    chef_hat: I("Chef's Toque", 'hat', 'common', 200, { vit: 3 }, 'chef', '#ffffff', '#e4e4ea', 'chef'),
    hardhat: I('Forge Hard Hat', 'hat', 'uncommon', 600, { hp: 4 }, 'hardhat', '#f8c834', '#d89a1a', 'forge'),
    miner_helmet: I("Miner's Helmet", 'hat', 'uncommon', 700, { gather: 1 }, 'miner', '#e86a2a', '#fff2a0'),
    aviator_cap: I('Aviator Cap', 'hat', 'uncommon', 700, { speed: 0.05 }, 'aviator', '#9a6438', '#e8d8b0', 'sky'),
    beret: I("Archivist's Beret", 'hat', 'uncommon', 500, { xp: 0.05 }, 'beret', '#6a52a8', '#3a2a5a', 'scholar'),
    cowboy_hat: I('Ranger Hat', 'hat', 'uncommon', 800, { speed: 0.05, luck: 0.03 }, 'cowboy', '#b07a44', '#5a3a20'),
    flower_crown: I('Flower Crown', 'hat', 'uncommon', 600, { vit: 4 }, 'flowers', '#ff7a9a', '#5ccf5a'),
    headphones: I('Headphones', 'hat', 'uncommon', 550, { xp: 0.04 }, 'headphones', '#e46aa0', '#30303a'),
    pilot_visor: I('Pilot Visor', 'hat', 'rare', 2200, { hp: 8, dmg: 1 }, 'visorcap', '#2a3a5a', '#5ef2e1'),
    top_hat: I('Gentleman Top Hat', 'hat', 'rare', 2500, { money: 0.1 }, 'tophat', '#26262e', '#c43a3a'),
    wizard_hat: I('Sparkwizard Hat', 'hat', 'rare', 2800, { xp: 0.1 }, 'wizard', '#6a54c8', '#f8d048'),
    arc_helm: I('Arc Helm', 'hat', 'epic', 0, { hp: 10, block: 1 }, 'knight', '#4a6aa8', '#5ef2e1', 'arc'),
    titan_helm: I('Titan Helm', 'hat', 'epic', 0, { hp: 15, block: 2 }, 'knight', '#c8a060', '#ff5a5a'),
    crown: I('Royal Crown', 'hat', 'epic', 0, { luck: 0.1, money: 0.1 }, 'crown', '#ffd84a', '#e04858'),
    // face
    glasses: I('Round Glasses', 'face', 'common', 150, { xp: 0.03 }, 'glasses', '#2a2230', '#bfe8ff'),
    bandit_mask: I('Dust Mask', 'face', 'common', 180, { hunger: 3 }, 'mask', '#8a7a6a', '#5a4a3a', 'waste'),
    scout_goggles: I('Scout Goggles', 'face', 'uncommon', 600, { luck: 0.08 }, 'goggles', '#58d8ec', '#3a3a44', 'sky'),
    welding_goggles: I('Welding Goggles', 'face', 'uncommon', 650, { block: 1 }, 'goggles', '#ff9a30', '#3a3a44', 'forge'),
    heart_shades: I('Heart Shades', 'face', 'uncommon', 500, { money: 0.05 }, 'hearts', '#ff4a8a', '#ffffff', 'pastel'),
    eyepatch: I('Pirate Patch', 'face', 'uncommon', 450, { dmg: 1 }, 'eyepatch', '#2a2230', '#2a2230'),
    monocle: I('Brass Monocle', 'face', 'rare', 2000, { xp: 0.1, luck: 0.03 }, 'monocle', '#d8a840', '#e8f6ff', 'scholar'),
    // tops
    basic_tee: I('Basic Tee', 'top', 'common', 0, {}, 'tee', '#4a8cf0', '#ffffff', 'starter'),
    padded_vest: I('Padded Vest', 'top', 'common', 200, { hp: 5 }, 'vest', '#8a6a4a', '#f2ece0'),
    scrap_vest: I('Scrap Vest', 'top', 'common', 250, { hp: 4 }, 'vest', '#b08a5a', '#6a8a9a', 'waste'),
    hoodie_orange: I('Comfy Hoodie', 'top', 'common', 250, { vit: 2 }, 'hoodie', '#ff8a3a', '#ffffff'),
    striped_sweater: I('Striped Sweater', 'top', 'common', 300, { hunger: 2 }, 'sweater', '#e8584a', '#ffffff'),
    overalls_denim: I('Tinker Overalls', 'top', 'common', 0, { gather: 1 }, 'overalls', '#3a6ab0', '#f6d860'),
    ranger_jacket: I('Ranger Jacket', 'top', 'uncommon', 800, { hp: 4, speed: 0.08 }, 'jacket', '#3d8a4a', '#f0e8c8'),
    chef_apron: I("Chef's Apron", 'top', 'uncommon', 650, { hunger: 6, vit: 5 }, 'apron', '#ffffff', '#e05848', 'chef'),
    forge_apron: I('Leather Apron', 'top', 'uncommon', 700, { hp: 6 }, 'apron', '#8a5a34', '#e8d8c8', 'forge'),
    pastel_dress: I('Pastel Dress', 'top', 'uncommon', 700, { money: 0.05, vit: 3 }, 'dress', '#ffb0d4', '#ffffff', 'pastel'),
    scholar_coat: I('Archivist Coat', 'top', 'uncommon', 800, { xp: 0.06 }, 'coat', '#5a4a8a', '#e8d8a8', 'scholar'),
    lab_coat: I('Lab Coat', 'top', 'uncommon', 700, { xp: 0.05 }, 'coat', '#f4f6f8', '#5ac8d8'),
    flight_jacket: I('Flight Jacket', 'top', 'rare', 2400, { hp: 6, speed: 0.06 }, 'jacket', '#8a5a34', '#f2e6c8', 'sky'),
    arc_plate: I('Arc Plate', 'top', 'rare', 3000, { hp: 14, block: 1 }, 'armor', '#5a74b0', '#5ef2e1', 'arc'),
    storm_coat: I('Stormweave Coat', 'top', 'epic', 0, { hp: 10, dmg: 2, speed: 0.1 }, 'coat', '#3a3a8a', '#9ad8ff'),
    // bottoms
    basic_pants: I('Basic Pants', 'bottom', 'common', 0, {}, 'pants', '#3a3e52', '#2a2c3a', 'starter'),
    denim_shorts: I('Denim Shorts', 'bottom', 'common', 0, { speed: 0.03 }, 'shorts', '#3a6ab0', '#2a4a80'),
    pleated_skirt: I('Pleated Skirt', 'bottom', 'common', 0, {}, 'skirt', '#3a3a6a', '#ffffff'),
    cargo_pants: I('Cargo Pants', 'bottom', 'common', 250, { hp: 2 }, 'cargo', '#6a6a4a', '#4a4a32', 'waste'),
    work_pants: I('Work Pants', 'bottom', 'common', 250, { hp: 2 }, 'pants', '#5a4a3a', '#3a2a20', 'forge'),
    frilly_skirt: I('Frilly Skirt', 'bottom', 'common', 300, { money: 0.03 }, 'skirt', '#ff9ac8', '#ffffff', 'pastel'),
    slacks: I('Archivist Slacks', 'bottom', 'common', 300, { xp: 0.03 }, 'pants', '#3a2a5a', '#2a1a3a', 'scholar'),
    checker_pants: I('Checkered Pants', 'bottom', 'common', 250, { vit: 2 }, 'checker', '#f2f2f2', '#2a2a30', 'chef'),
    flight_pants: I('Flight Pants', 'bottom', 'uncommon', 600, { speed: 0.04 }, 'cargo', '#a8865a', '#6a4a2a', 'sky'),
    arc_greaves: I('Arc Greaves', 'bottom', 'epic', 0, { hp: 6, block: 1 }, 'greaves', '#5a74b0', '#5ef2e1', 'arc'),
    // shoes
    basic_shoes: I('Basic Shoes', 'shoes', 'common', 0, {}, 'sneakers', '#4a4e58', '#e8e8e8', 'starter'),
    sneakers: I('Comfy Sneakers', 'shoes', 'common', 160, { speed: 0.1 }, 'sneakers', '#e8584a', '#ffffff'),
    dust_boots: I('Dust Boots', 'shoes', 'common', 250, { hunger: 2 }, 'boots', '#8a6a4a', '#5a3a20', 'waste'),
    ribbon_shoes: I('Ribbon Shoes', 'shoes', 'common', 280, { money: 0.03 }, 'flats', '#ff6aa8', '#ffffff', 'pastel'),
    loafers: I('Loafers', 'shoes', 'common', 280, { xp: 0.03 }, 'flats', '#5a3a20', '#8a5a34', 'scholar'),
    clogs: I('Kitchen Clogs', 'shoes', 'common', 200, { hunger: 3 }, 'flats', '#ffffff', '#e05848', 'chef'),
    steel_boots: I('Steel-toe Boots', 'shoes', 'uncommon', 600, { block: 1 }, 'boots', '#4a4e58', '#9aa2b0', 'forge'),
    trail_boots: I('Trail Boots', 'shoes', 'uncommon', 750, { speed: 0.12, hunger: 4 }, 'boots', '#6a4a2a', '#c8a070'),
    arc_sabatons: I('Arc Sabatons', 'shoes', 'epic', 0, { speed: 0.1, block: 1 }, 'boots', '#5a74b0', '#5ef2e1', 'arc'),
    rocket_boots: I('Rocket Boots', 'shoes', 'epic', 0, { speed: 0.3 }, 'rocket', '#e8584a', '#ffd84a', 'sky'),
    // gloves
    mittens: I('Cozy Mittens', 'gloves', 'common', 150, { vit: 2 }, 'gloves', '#e8584a', '#ffffff'),
    work_gloves: I('Work Gloves', 'gloves', 'common', 180, { gather: 1 }, 'gloves', '#d0a870', '#8a6a40', 'forge'),
    power_gauntlets: I('Power Gauntlets', 'gloves', 'uncommon', 900, { dmg: 1 }, 'gauntlets', '#7a86a0', '#ff9a30'),
    spark_gloves: I('Spark Gloves', 'gloves', 'rare', 2600, { dmg: 2, luck: 0.05 }, 'gloves', '#3a3a8a', '#5ef2e1'),
    arc_gauntlets: I('Arc Gauntlets', 'gloves', 'epic', 0, { dmg: 2, block: 1 }, 'gauntlets', '#5a74b0', '#5ef2e1', 'arc'),
    // back
    patch_scarf: I('Patchwork Scarf', 'cape', 'common', 200, { luck: 0.04 }, 'scarf', '#d08a4a', '#8a5a34', 'waste'),
    backpack: I('Explorer Pack', 'cape', 'common', 300, { gather: 1 }, 'backpack', '#9a6034', '#d0a870'),
    hero_cape: I('Hero Cape', 'cape', 'uncommon', 800, { hp: 4 }, 'cape', '#c83246', '#ffd860'),
    glider_wings: I('Glider Wings', 'cape', 'rare', 3200, { speed: 0.12 }, 'wings', '#f2ead0', '#9a6438', 'sky'),
    jetpack: I('Jetpack', 'cape', 'rare', 3500, { speed: 0.15 }, 'jetpack', '#a0aab8', '#ff9a30'),
    arc_cape: I('Arc Cape', 'cape', 'epic', 0, { dmg: 1, hp: 6 }, 'cape', '#34448a', '#5ef2e1', 'arc'),
    // tools (held)
    wrench: I('Trusty Wrench', 'tool', 'common', 0, {}, 'wrench', '#a8b0bc', '#6a7280', 'starter'),
    spatula: I('Golden Spatula', 'tool', 'uncommon', 600, { vit: 5 }, 'spatula', '#d8d8e0', '#e0a020', 'chef'),
    lantern: I('Brass Lantern', 'tool', 'uncommon', 700, { luck: 0.06 }, 'lantern', '#d8a840', '#fff2a0', 'scholar'),
    forge_hammer: I('Forge Hammer', 'tool', 'uncommon', 900, { dmg: 1, hp: 3 }, 'hammer', '#8a8e98', '#9a6438', 'forge'),
    spark_staff: I('Spark Staff', 'tool', 'rare', 2800, { dmg: 1, xp: 0.08 }, 'staff', '#9a6438', '#c27bff'),
    arc_blade: I('Arc Blade', 'tool', 'epic', 0, { dmg: 3 }, 'sword', '#bfe8ff', '#5ef2e1', 'arc'),
    // charms (not visible)
    lunchbox: I('Lunchbox Charm', 'charm', 'common', 250, { vit: 6 }),
    lucky_bolt: I('Lucky Bolt Charm', 'charm', 'uncommon', 800, { luck: 0.12 }),
    scholar_pendant: I("Scholar's Pendant", 'charm', 'uncommon', 900, { xp: 0.2 }),
    merchant_ring: I("Merchant's Ring", 'charm', 'rare', 2400, { discount: 0.1, money: 0.15 }),
    magnet_band: I('Magnet Bracelet', 'charm', 'rare', 2800, { money: 0.25 }),
    focus_lens: I('Focus Lens', 'charm', 'rare', 3200, { hand: 1 }),
    core_amulet: I('Core Amulet', 'charm', 'epic', 0, { energy: 1 }),
  };
  // Outfit sets: wear 3 or 5 pieces of a set for a bonus.
  AF.SETS = {
    waste: { name: 'Wastelander', b3: { gather: 1 }, b5: { luck: 0.1 } },
    forge: { name: 'Forgehand', b3: { hp: 5 }, b5: { block: 1, dmg: 1 } },
    sky: { name: 'Skyrunner', b3: { speed: 0.1 }, b5: { xp: 0.1, speed: 0.1 } },
    pastel: { name: 'Pastel Pop', b3: { money: 0.1 }, b5: { xp: 0.15 } },
    scholar: { name: 'Archivist', b3: { xp: 0.1 }, b5: { hand: 1 } },
    chef: { name: 'Diner Crew', b3: { hunger: 8 }, b5: { vit: 10 } },
    arc: { name: 'Arcknight', b3: { dmg: 2 }, b5: { energy: 1 } },
  };
  AF.STARTER_OUTFITS = {
    scavenger: { name: 'Scavenger', items: ['red_bandana', 'scrap_vest', 'cargo_pants', 'dust_boots'] },
    tinker: { name: 'Tinker', items: ['overalls_denim', 'basic_pants', 'basic_shoes', 'work_gloves', 'wrench'] },
    dreamer: { name: 'Dreamer', items: ['beanie_blue', 'striped_sweater', 'pleated_skirt', 'basic_shoes'] },
  };
  AF.BASE_WARDROBE = ['basic_tee', 'basic_pants', 'basic_shoes', 'denim_shorts', 'pleated_skirt', 'wrench'];

  const STAT_TEXT = {
    hp: (v) => `+${v} automaton HP`, block: (v) => `+${v} Block per defend card`, dmg: (v) => `+${v} damage per hit`, energy: (v) => `+${v} energy per turn`,
    hand: (v) => `+${v} card in hand`, gather: (v) => `+${v} material per harvest`, luck: (v) => `+${Math.round(v * 100)}% drop chance`,
    xp: (v) => `+${Math.round(v * 100)}% XP`, money: (v) => `+${Math.round(v * 100)}% money from battles`, speed: (v) => `+${Math.round(v * 100)}% walk speed`,
    hunger: (v) => `Hungry ${v} steps slower`, vit: (v) => `+${v} max vitality`, discount: (v) => `${Math.round(v * 100)}% off in shops`,
  };
  AF.statText = (st) => Object.entries(st).map(([k, v]) => STAT_TEXT[k](v)).join(' · ') || 'Just for style';
  AF.itemText = (id) => AF.statText(AF.ITEMS[id].stats);
  AF.itemValue = (id) => { const it = AF.ITEMS[id]; return it.price || { common: 200, uncommon: 800, rare: 2500, epic: 8000 }[it.rarity]; };
  AF.slotOf = (id) => AF.ITEMS[id].slot;

  // Owning an item adds it to your collection forever. Duplicates turn into Bolts.
  AF.owns = (s, id) => s.owned.includes(id);
  AF.giveItem = function (s, id) {
    if (!AF.ITEMS[id]) return false;
    if (AF.owns(s, id)) { const v = Math.floor(AF.itemValue(id) * 0.3); s.credits += v; return { dup: true, value: v }; }
    s.owned.push(id); return true;
  };
  AF.equippedIds = (s) => Object.values(s.equip).filter((id) => id && AF.ITEMS[id]);
  AF.wear = function (s, id) {
    const sl = AF.slotOf(id);
    const key = sl === 'charm' ? (s.equip.charm1 === id || s.equip.charm2 === id ? null : !s.equip.charm1 ? 'charm1' : !s.equip.charm2 ? 'charm2' : 'charm1') : sl;
    if (sl === 'charm' && key === null) { if (s.equip.charm1 === id) s.equip.charm1 = null; else s.equip.charm2 = null; return; }
    s.equip[key] = s.equip[key] === id ? null : id;
  };
  // Everything the drawing code needs: base features + what's worn.
  AF.appearance = function (s) { const o = {}; AF.WEAR_SLOTS.forEach((k) => { if (s.equip[k]) o[k] = s.equip[k]; }); return Object.assign({}, s.look, { outfit: o }); };

  AF.setCounts = function (s) {
    const c = {}; AF.equippedIds(s).forEach((id) => { const st = AF.ITEMS[id].set; if (st && AF.SETS[st]) c[st] = (c[st] || 0) + 1; }); return c;
  };

  AF.rollGear = function (tier, boss) {
    const pool = (r) => Object.keys(AF.ITEMS).filter((id) => AF.ITEMS[id].rarity === r && AF.ITEMS[id].set !== 'starter' && !AF.STARTER_ONLY.includes(id));
    let r;
    if (boss) r = 'epic';
    else {
      const w = { 1: [0.7, 0.27, 0.03, 0], 2: [0.4, 0.45, 0.13, 0.02], 3: [0.15, 0.45, 0.3, 0.1] }[tier], x = Math.random();
      r = x < w[0] ? 'common' : x < w[0] + w[1] ? 'uncommon' : x < w[0] + w[1] + w[2] ? 'rare' : 'epic';
    }
    const p = pool(r); return p[Math.floor(Math.random() * p.length)];
  };
  AF.STARTER_ONLY = ['overalls_denim', 'denim_shorts', 'pleated_skirt'];

  // ---------- Combined stats: automaton parts + pilot level + worn items + set bonuses ----------
  AF.fullStats = function (s) {
    const st = AF.baseStats(s.parts), lp = AF.levelPerks(s.level || 1);
    Object.assign(st, { luck: 0, xp: 0, money: 0, speed: 0, hunger: 0, vit: lp.vit, discount: 0 });
    st.maxHp += lp.hp; st.hand += lp.hand; st.energy += lp.energy;
    const add = (stats) => { for (const [k, v] of Object.entries(stats)) { if (k === 'hp') st.maxHp += v; else st[k] = (st[k] || 0) + v; } };
    AF.equippedIds(s).forEach((id) => add(AF.ITEMS[id].stats));
    for (const [set, n] of Object.entries(AF.setCounts(s))) { if (n >= 3) add(AF.SETS[set].b3); if (n >= 5) add(AF.SETS[set].b5); }
    st.hand = Math.min(st.hand, 9); st.energy = Math.min(st.energy, 7);
    return st;
  };

  // ---------- Icons ----------
  AF.itemIcon = function (id, locked) {
    const it = AF.ITEMS[id], v = it.vis || { a: AF.RARITY[it.rarity].color, b: '#ffffff' };
    const a = locked ? '#5a6070' : v.a, b = locked ? '#3a4050' : v.b;
    const sh = {
      hat: `<path d="M7 26 Q7 9 20 9 Q33 9 33 26 Z" fill="${a}"/><rect x="4" y="24" width="32" height="6" rx="3" fill="${b}"/>`,
      face: `<circle cx="13" cy="21" r="7" fill="${b}"/><circle cx="27" cy="21" r="7" fill="${b}"/><path d="M6 21 a7 7 0 0 1 14 0 M20 21 a7 7 0 0 1 14 0 M20 20 h0" stroke="${a}" stroke-width="3" fill="none"/>`,
      top: `<path d="M10 10 L16 7 Q20 11 24 7 L30 10 L35 18 L29 21 L29 34 L11 34 L11 21 L5 18 Z" fill="${a}"/><path d="M16 7 Q20 13 24 7" fill="${b}"/>`,
      bottom: `<path d="M11 6 H29 L31 34 H22 L20 16 L18 34 H9 Z" fill="${a}"/><rect x="11" y="6" width="18" height="5" fill="${b}"/>`,
      shoes: `<path d="M8 14 L19 14 L19 24 L33 27 Q36 29 34 33 L7 33 Z" fill="${a}"/><rect x="7" y="29" width="28" height="4" fill="${b}"/>`,
      gloves: `<path d="M12 34 L12 16 Q12 12 15 12 L15 20 L15 9 Q15 6 18 6 Q21 6 21 9 L21 19 L21 8 Q21 5 24 5 Q27 5 27 8 L27 20 L27 12 Q27 9 30 10 Q32 11 31 14 L29 34 Z" fill="${a}"/><rect x="11" y="29" width="19" height="5" fill="${b}"/>`,
      cape: `<path d="M12 6 H28 L34 34 Q20 30 6 34 Z" fill="${a}"/><path d="M12 6 H28 L26 10 H14 Z" fill="${b}"/>`,
      tool: `<path d="M8 32 L24 16" stroke="${b}" stroke-width="5" stroke-linecap="round"/><circle cx="27" cy="13" r="8" fill="${a}"/>`,
      charm: `<circle cx="20" cy="23" r="10" fill="${a}"/><circle cx="20" cy="23" r="4.5" fill="#fff" opacity=".7"/><path d="M14 6 L20 13 L26 6" stroke="${a}" stroke-width="3" fill="none"/>`,
    };
    return `<svg viewBox="0 0 40 40" class="iico${locked ? ' locked' : ''}"><g stroke="#1a1420" stroke-width="2" stroke-linejoin="round">${sh[it.slot]}</g></svg>`;
  };

  // ---------- Pilot tab: stats, what's worn, set bonuses ----------
  AF.pilotTab = function (s) {
    const st = AF.stats(s), need = AF.xpNeed(s.level), sets = AF.setCounts(s);
    const slot = (k) => {
      const id = s.equip[k], it = id && AF.ITEMS[id];
      return `<div class="eq-slot${it ? ' full' : ''}" ${it ? `style="--rc:${AF.RARITY[it.rarity].color}"` : ''}><small>${AF.EQ_SLOTS[k]}</small>${it ? `${AF.itemIcon(id)}<b>${AF.esc(it.name)}</b>` : '<span class="muted">—</span>'}</div>`;
    };
    const sum = [['Automaton HP', st.maxHp], ['Energy', st.energy], ['Hand', st.hand], ['Attack', '+' + st.dmg], ['Defense', '+' + st.block], ['Gathering', '+' + (st.gather - 1)],
      ['Drop luck', '+' + Math.round(st.luck * 100) + '%'], ['XP bonus', '+' + Math.round(st.xp * 100) + '%'], ['Money bonus', '+' + Math.round(st.money * 100) + '%'], ['Walk speed', '+' + Math.round(st.speed * 100) + '%'], ['Max vitality', AF.pilotMaxVit(s)]];
    const setRows = Object.entries(sets).map(([k, n]) => `<div class="setrow"><b>${AF.SETS[k].name}</b> ${n} worn · <span class="${n >= 3 ? 'on' : ''}">3: ${AF.statText(AF.SETS[k].b3)}</span> · <span class="${n >= 5 ? 'on' : ''}">5: ${AF.statText(AF.SETS[k].b5)}</span></div>`).join('');
    return `<div class="pilot-tab">
      <div class="pt-card">
        <canvas class="pt-pic" width="200" height="270"></canvas>
        <div class="lvl"><b>${AF.esc(s.look.name)} · Lv ${s.level}</b><span>${s.level >= AF.MAX_LEVEL ? 'Max level' : `${s.xp} / ${need} XP`}</span></div>
        <div class="bar xp"><i style="width:${s.level >= AF.MAX_LEVEL ? 100 : Math.round((s.xp / need) * 100)}%"></i></div>
        <dl class="statlist">${sum.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
      </div>
      <div>
        <h3>Wearing</h3>
        <div class="eq-grid">${Object.keys(AF.EQ_SLOTS).map(slot).join('')}</div>
        <h3>Set bonuses</h3>${setRows || '<p class="hint">Wear 3 or more pieces from the same set for a bonus. See the Wardrobe tab.</p>'}
        <p class="hint">Levels: each gives +3 automaton HP and +1 vitality. Level 5 and 15: +1 card in hand. Level 10: +1 energy.</p>
        <button class="btn primary" data-tab="wardrobe">Open wardrobe</button>
      </div></div>`;
  };
  AF.pilotTabAfter = function (s) {
    const c = document.querySelector('.pt-pic'); if (!c) return;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    const t = performance.now();
    AF.drawPilotAt(g, c.width / 2, c.height - 12, c.height * 0.88, AF.appearance(s), 'down', 0, { t });
  };

  // ---------- Wardrobe tab: the collection book ----------
  AF.WARDROBE_FILTER = 'all';
  AF.wardrobeTab = function (s) {
    const ids = Object.keys(AF.ITEMS), total = ids.length, have = ids.filter((id) => AF.owns(s, id)).length;
    const f = AF.WARDROBE_FILTER;
    const groups = [['hat', 'Hats'], ['face', 'Face'], ['top', 'Tops'], ['bottom', 'Bottoms'], ['shoes', 'Shoes'], ['gloves', 'Gloves'], ['cape', 'Back'], ['tool', 'Tools'], ['charm', 'Charms']];
    const filt = [['all', 'All'], ...groups].map(([k, n]) => `<button class="opt${f === k ? ' on' : ''}" data-wfilter="${k}">${n}</button>`).join('');
    const worn = AF.equippedIds(s);
    const cards = groups.filter(([k]) => f === 'all' || f === k).map(([k, n]) => {
      const list = ids.filter((id) => AF.ITEMS[id].slot === k);
      return `<h3>${n} <span class="muted">${list.filter((id) => AF.owns(s, id)).length} / ${list.length}</span></h3><div class="wgrid">${list.map((id) => {
        const it = AF.ITEMS[id], own = AF.owns(s, id), on = worn.includes(id);
        if (!own) return `<div class="witem locked" title="${it.price ? 'Sold at the Boutique' : 'Found on bots, in quests or ruins'}">${AF.itemIcon(id, true)}<b>???</b><small>${it.price ? 'Boutique' : it.rarity === 'epic' ? 'Rare drop' : 'Find it'}</small></div>`;
        return `<button class="witem${on ? ' on' : ''}" data-wear="${id}" style="--rc:${AF.RARITY[it.rarity].color}">${AF.itemIcon(id)}<b>${AF.esc(it.name)}</b><small>${it.set ? (AF.SETS[it.set] ? AF.SETS[it.set].name + ' · ' : '') : ''}${AF.RARITY[it.rarity].name}</small><em>${AF.itemText(id)}</em>${on ? '<span class="worn">Worn</span>' : ''}</button>`;
      }).join('')}</div>`;
    }).join('');
    const presets = [0, 1, 2].map((i) => {
      const p = s.presets[i];
      return `<div class="preset"><b>Outfit ${i + 1}</b>${p ? `<button class="btn sm primary" data-preset-wear="${i}">Wear</button>` : '<span class="muted">Empty</span>'}<button class="btn sm" data-preset-save="${i}">Save current</button></div>`;
    }).join('');
    const setList = Object.entries(AF.SETS).map(([k, st]) => {
      const pieces = ids.filter((id) => AF.ITEMS[id].set === k), got = pieces.filter((id) => AF.owns(s, id)).length;
      return `<div class="setrow"><b>${st.name}</b> ${got}/${pieces.length} collected · 3: ${AF.statText(st.b3)} · 5: ${AF.statText(st.b5)}</div>`;
    }).join('');
    return `<div class="wardrobe">
      <div class="wd-top"><canvas class="pt-pic wd-pic" width="200" height="270"></canvas>
        <div><div class="collect"><b>Collection</b><span>${have} / ${total}</span><div class="bar xp"><i style="width:${Math.round((have / total) * 100)}%"></i></div></div>
        <p class="hint">Everything you wear shows on your pilot. Tap an item to put it on or take it off. Duplicates you find turn into Bolts.</p>
        <div class="presets">${presets}</div></div></div>
      <div class="opts">${filt}</div>
      ${cards}
      <h3>Outfit sets</h3><div class="sets">${setList}</div></div>`;
  };
  AF.wardrobeAfter = function (s) {
    const c = document.querySelector('.wd-pic'); if (!c) return;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    AF.drawPilotAt(g, c.width / 2, c.height - 12, c.height * 0.88, AF.appearance(s), 'down', 0, {});
  };
  AF.wardrobeHandle = function (s, el) {
    if (el.dataset.wfilter) { AF.WARDROBE_FILTER = el.dataset.wfilter; return true; }
    if (el.dataset.wear) { AF.wear(s, el.dataset.wear); AF.sfx('card'); }
    if (el.dataset.presetSave) { s.presets[+el.dataset.presetSave] = Object.assign({}, s.equip); AF.game.toast('Outfit saved.'); }
    if (el.dataset.presetWear) { const p = s.presets[+el.dataset.presetWear]; if (p) { Object.keys(s.equip).forEach((k) => { s.equip[k] = p[k] && AF.owns(s, p[k]) ? p[k] : null; }); AF.sfx('forge'); } }
    const st = AF.stats(s); s.hp = Math.min(s.hp, st.maxHp); s.pilot.vit = Math.min(s.pilot.vit, AF.pilotMaxVit(s));
    return true;
  };
})();
