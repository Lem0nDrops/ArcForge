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
      setTimeout(() => { AF.sfx('win'); AF.game && AF.game.toast(`Level up! You're now level ${s.level}. Robot HP and pilot vitality refilled.${extra}`, 5000); }, 400);
      if (AF.game && AF.game.levelFx) AF.game.levelFx();
    }
    return n;
  };

  // ---------- Gear ----------
  AF.RARITY = {
    common: { name: 'Common', color: '#8a94a6' }, uncommon: { name: 'Uncommon', color: '#2fae62' },
    rare: { name: 'Rare', color: '#3a7cf0' }, epic: { name: 'Epic', color: '#9a4ee0' },
  };
  AF.EQ_SLOTS = { head: 'Head', body: 'Body', hands: 'Hands', feet: 'Feet', acc1: 'Accessory', acc2: 'Accessory' };
  // price in Bolts; 0 = drop only
  AF.ITEMS = {
    leather_cap:     { name: 'Leather Cap', slot: 'head', rarity: 'common', price: 150, stats: { block: 1 } },
    scout_goggles:   { name: 'Scout Goggles', slot: 'head', rarity: 'uncommon', price: 600, stats: { luck: 0.08 } },
    miner_helmet:    { name: "Miner's Helmet", slot: 'head', rarity: 'uncommon', price: 700, stats: { gather: 1 } },
    pilot_visor:     { name: 'Pilot Visor', slot: 'head', rarity: 'rare', price: 2200, stats: { hp: 8, dmg: 1 } },
    titan_helm:      { name: 'Titan Helm', slot: 'head', rarity: 'epic', price: 0, stats: { hp: 15, block: 2 } },
    padded_vest:     { name: 'Padded Vest', slot: 'body', rarity: 'common', price: 200, stats: { hp: 5 } },
    ranger_jacket:   { name: 'Ranger Jacket', slot: 'body', rarity: 'uncommon', price: 800, stats: { hp: 4, speed: 0.08 } },
    chef_apron:      { name: "Chef's Apron", slot: 'body', rarity: 'uncommon', price: 650, stats: { hunger: 6, vit: 5 } },
    arc_plate:       { name: 'Arc Plate Armor', slot: 'body', rarity: 'rare', price: 3000, stats: { hp: 14, block: 1 } },
    storm_coat:      { name: 'Stormweave Coat', slot: 'body', rarity: 'epic', price: 0, stats: { hp: 10, dmg: 2, speed: 0.1 } },
    work_gloves:     { name: 'Work Gloves', slot: 'hands', rarity: 'common', price: 180, stats: { gather: 1 } },
    power_gauntlets: { name: 'Power Gauntlets', slot: 'hands', rarity: 'uncommon', price: 900, stats: { dmg: 1 } },
    spark_gloves:    { name: 'Spark Gloves', slot: 'hands', rarity: 'rare', price: 2600, stats: { dmg: 2, luck: 0.05 } },
    sneakers:        { name: 'Comfy Sneakers', slot: 'feet', rarity: 'common', price: 160, stats: { speed: 0.1 } },
    trail_boots:     { name: 'Trail Boots', slot: 'feet', rarity: 'uncommon', price: 750, stats: { speed: 0.12, hunger: 4 } },
    rocket_boots:    { name: 'Rocket Boots', slot: 'feet', rarity: 'epic', price: 0, stats: { speed: 0.3 } },
    lunchbox:        { name: 'Lunchbox Charm', slot: 'acc', rarity: 'common', price: 250, stats: { vit: 6 } },
    lucky_bolt:      { name: 'Lucky Bolt Charm', slot: 'acc', rarity: 'uncommon', price: 800, stats: { luck: 0.12 } },
    scholar_pendant: { name: "Scholar's Pendant", slot: 'acc', rarity: 'uncommon', price: 900, stats: { xp: 0.2 } },
    merchant_ring:   { name: "Merchant's Ring", slot: 'acc', rarity: 'rare', price: 2400, stats: { discount: 0.1, money: 0.15 } },
    magnet_band:     { name: 'Magnet Bracelet', slot: 'acc', rarity: 'rare', price: 2800, stats: { money: 0.25 } },
    focus_lens:      { name: 'Focus Lens', slot: 'acc', rarity: 'rare', price: 3200, stats: { hand: 1 } },
    core_amulet:     { name: 'Core Amulet', slot: 'acc', rarity: 'epic', price: 0, stats: { energy: 1 } },
  };
  AF.INV_MAX = 30;
  const STAT_TEXT = {
    hp: (v) => `+${v} robot HP`, block: (v) => `+${v} Block per defend card`, dmg: (v) => `+${v} damage per hit`, energy: (v) => `+${v} energy per turn`,
    hand: (v) => `+${v} card in hand`, gather: (v) => `+${v} material per harvest`, luck: (v) => `+${Math.round(v * 100)}% drop chance`,
    xp: (v) => `+${Math.round(v * 100)}% XP`, money: (v) => `+${Math.round(v * 100)}% money from battles`, speed: (v) => `+${Math.round(v * 100)}% walk speed`,
    hunger: (v) => `Get hungry ${v} steps slower`, vit: (v) => `+${v} max vitality`, discount: (v) => `${Math.round(v * 100)}% off in shops`,
  };
  AF.itemText = (id) => Object.entries(AF.ITEMS[id].stats).map(([k, v]) => STAT_TEXT[k](v)).join(' · ');
  AF.itemValue = (id) => { const it = AF.ITEMS[id]; return it.price || { common: 200, uncommon: 800, rare: 2500, epic: 8000 }[it.rarity]; };

  let uidc = 1;
  AF.newItem = (id) => ({ uid: 'i' + Date.now().toString(36) + (uidc++), id });
  AF.giveItem = function (s, id) {
    if (s.inv.length >= AF.INV_MAX) return false;
    s.inv.push(AF.newItem(id)); return true;
  };
  AF.equippedIds = (s) => Object.values(s.equip).filter(Boolean).map((uid) => (s.inv.find((i) => i.uid === uid) || {}).id).filter(Boolean);

  // Random gear drop for an enemy tier
  AF.rollGear = function (tier, boss) {
    const pool = (r) => Object.keys(AF.ITEMS).filter((id) => AF.ITEMS[id].rarity === r);
    let r;
    if (boss) r = 'epic';
    else {
      const w = { 1: [0.7, 0.27, 0.03, 0], 2: [0.4, 0.45, 0.13, 0.02], 3: [0.15, 0.45, 0.3, 0.1] }[tier], x = Math.random();
      r = x < w[0] ? 'common' : x < w[0] + w[1] ? 'uncommon' : x < w[0] + w[1] + w[2] ? 'rare' : 'epic';
    }
    const p = pool(r); return p[Math.floor(Math.random() * p.length)];
  };

  // ---------- Combined stats: robot parts + pilot level + gear ----------
  AF.fullStats = function (s) {
    const st = AF.baseStats(s.parts), lp = AF.levelPerks(s.level || 1);
    Object.assign(st, { luck: 0, xp: 0, money: 0, speed: 0, hunger: 0, vit: lp.vit, discount: 0 });
    st.maxHp += lp.hp; st.hand += lp.hand; st.energy += lp.energy;
    for (const id of AF.equippedIds(s)) {
      for (const [k, v] of Object.entries(AF.ITEMS[id].stats)) {
        if (k === 'hp') st.maxHp += v; else st[k] = (st[k] || 0) + v;
      }
    }
    st.hand = Math.min(st.hand, 9);
    return st;
  };

  // ---------- Gear icons ----------
  AF.itemIcon = function (id) {
    const it = AF.ITEMS[id], c = AF.RARITY[it.rarity].color;
    const shapes = {
      head: `<path d="M8 22 Q8 8 20 8 Q32 8 32 22 Z" fill="${c}"/><rect x="5" y="21" width="30" height="6" rx="3" fill="${c}" opacity=".8"/>`,
      body: `<path d="M10 10 L16 7 Q20 11 24 7 L30 10 L34 18 L29 20 L29 33 L11 33 L11 20 L6 18 Z" fill="${c}"/>`,
      hands: `<path d="M12 33 L12 16 Q12 12 15 12 L15 20 L15 9 Q15 6 18 6 Q21 6 21 9 L21 19 L21 8 Q21 5 24 5 Q27 5 27 8 L27 20 L27 12 Q27 9 30 10 Q32 11 31 14 L29 33 Z" fill="${c}"/>`,
      feet: `<path d="M12 8 L22 8 L22 24 L33 27 Q35 28 34 32 L10 32 Z" fill="${c}"/>`,
      acc: `<circle cx="20" cy="22" r="10" fill="${c}"/><circle cx="20" cy="22" r="4.5" fill="#fff" opacity=".7"/><path d="M14 6 L20 13 L26 6" stroke="${c}" stroke-width="3" fill="none"/>`,
    };
    return `<svg viewBox="0 0 40 40" class="iico"><g stroke="#2a2030" stroke-width="2" stroke-linejoin="round">${shapes[it.slot]}</g></svg>`;
  };

  // ---------- Pilot tab (equipment + inventory) ----------
  AF.pilotTab = function (s) {
    const st = AF.stats(s), need = AF.xpNeed(s.level);
    const slot = (k) => {
      const uid = s.equip[k], it = uid && s.inv.find((i) => i.uid === uid);
      return `<button class="eq-slot${it ? ' full' : ''}" data-unequip="${k}" ${it ? `style="--rc:${AF.RARITY[AF.ITEMS[it.id].rarity].color}"` : 'disabled'}>
        <small>${AF.EQ_SLOTS[k]}</small>${it ? `${AF.itemIcon(it.id)}<b>${AF.esc(AF.ITEMS[it.id].name)}</b>` : '<span class="muted">Empty</span>'}</button>`;
    };
    const bag = s.inv.filter((i) => !Object.values(s.equip).includes(i.uid));
    const sum = [['Robot HP', st.maxHp], ['Energy', st.energy], ['Hand', st.hand], ['Attack', '+' + st.dmg], ['Defense', '+' + st.block], ['Gathering', '+' + (st.gather - 1)],
      ['Drop luck', '+' + Math.round(st.luck * 100) + '%'], ['XP bonus', '+' + Math.round(st.xp * 100) + '%'], ['Money bonus', '+' + Math.round(st.money * 100) + '%'], ['Walk speed', '+' + Math.round(st.speed * 100) + '%'], ['Max vitality', AF.pilotMaxVit(s)]];
    return `<div class="pilot-tab">
      <div class="pt-card">
        <canvas class="pt-pic" width="150" height="214"></canvas>
        <div class="lvl"><b>Level ${s.level}</b><span>${s.level >= AF.MAX_LEVEL ? 'Max level' : `${s.xp} / ${need} XP`}</span></div>
        <div class="bar xp"><i style="width:${s.level >= AF.MAX_LEVEL ? 100 : Math.round((s.xp / need) * 100)}%"></i></div>
        <p class="hint">Earn XP by defeating bots and finishing quests. Each level: +3 robot HP and +1 vitality. Level 5 and 15: +1 card in hand. Level 10: +1 energy.</p>
        <dl class="statlist">${sum.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
      </div>
      <div>
        <h3>Equipment</h3>
        <div class="eq-grid">${Object.keys(AF.EQ_SLOTS).map(slot).join('')}</div>
        <h3>Bag <span class="muted">${s.inv.length} / ${AF.INV_MAX}</span></h3>
        ${bag.length ? `<div class="bag">${bag.map((i) => { const it = AF.ITEMS[i.id]; return `<button class="item" data-equip="${i.uid}" style="--rc:${AF.RARITY[it.rarity].color}">
          ${AF.itemIcon(i.id)}<span><b>${AF.esc(it.name)}</b><small>${AF.RARITY[it.rarity].name} ${AF.EQ_SLOTS[it.slot === 'acc' ? 'acc1' : it.slot]}</small><em>${AF.itemText(i.id)}</em></span></button>`; }).join('')}</div>`
          : '<p class="hint">Your bag is empty. Bots sometimes drop gear, and the Boutique sells some.</p>'}
        <p class="hint">Tap gear to equip it, tap an equipped slot to take it off. Sell spare gear at the Salvage Exchange.</p>
      </div></div>`;
  };
  AF.pilotTabAfter = function (s) {
    const c = document.querySelector('.pt-pic'); if (!c) return;
    const g = c.getContext('2d'); g.clearRect(0, 0, 150, 214); AF.drawPilot(g, 0, 30, 180, s.look, 0);
  };
  AF.equipToggle = function (s, el) {
    if (el.dataset.equip) {
      const it = s.inv.find((i) => i.uid === el.dataset.equip); if (!it) return;
      const slot = AF.ITEMS[it.id].slot;
      const key = slot === 'acc' ? (!s.equip.acc1 ? 'acc1' : !s.equip.acc2 ? 'acc2' : 'acc1') : slot;
      s.equip[key] = it.uid; AF.sfx('forge'); AF.game.toast(`Equipped ${AF.ITEMS[it.id].name}.`);
    } else if (el.dataset.unequip) { s.equip[el.dataset.unequip] = null; AF.sfx('card'); }
    const st = AF.stats(s); s.hp = Math.min(s.hp, st.maxHp); s.pilot.vit = Math.min(s.pilot.vit, AF.pilotMaxVit(s));
  };
})();
