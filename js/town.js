/* ArcForge — Rivet Hollow, the first town. Shop catalogs and shop screens.
   Each building renders inside the shared #panel modal (see ui.js). */
(function () {
  const AF = (window.AF = window.AF || {});
  const T = (AF.Town = {});

  // ---------- Catalogs ----------
  // Salvage Exchange prices [buy, sell] per unit.
  T.MARKET = { scrap: [40, 10], copper: [60, 20], silicon: [80, 30], arcite: [200, 80], circuits: [280, 120] };
  T.RES_VALUE = { scrap: 3, copper: 5, silicon: 6, arcite: 15, circuits: 20 };
  T.RESTOCK = 120; // steps between Deckhouse restocks

  T.FOOD = {
    meals: [
      { id: 'cheese', name: 'Gear Grilled Cheese', price: 50, vit: 6, text: 'Restores 6 vitality.' },
      { id: 'stew', name: 'Rust Bucket Stew', price: 90, vit: 12, text: 'Restores 12 vitality.' },
      { id: 'platter', name: 'Full Sparkplug Platter', price: 150, vit: 999, text: 'Restores all vitality.' },
    ],
    togo: [
      { id: 'ration', name: 'Field Ration', price: 70, text: 'Carry it with you. Eat anywhere for +8 vitality. Holds 9.' },
    ],
    buffs: [
      { id: 'hotsauce', name: 'Hot Sauce Shot', price: 100, battles: 3, text: 'Attacks deal +2 damage.' },
      { id: 'oatmeal', name: 'Iron Oatmeal', price: 100, battles: 3, text: 'Gain 4 Block at the start of every turn.' },
      { id: 'tea', name: 'Focus Tea', price: 140, battles: 3, text: 'Draw 1 extra card every turn.' },
      { id: 'soda', name: 'Spark Soda', price: 120, battles: 3, text: '+1 energy on your first turn.' },
    ],
  };
  T.RATION_VIT = 8;
  T.RATION_MAX = 9;

  T.PERKS = [
    { id: 'scavenger', name: 'Scavenger', price: 400, text: '+1 material from every resource node.' },
    { id: 'endurance', name: 'Endurance', price: 450, text: '+10 max vitality, and you get hungry more slowly.' },
    { id: 'medic', name: 'Field Medic', price: 500, text: 'Your automaton repairs 5 HP after every win.' },
    { id: 'haggler', name: 'Haggler', price: 500, text: '15% off in every shop.' },
    { id: 'tactician', name: 'Tactician', price: 600, text: 'Draw 1 extra card on your first turn of each battle.' },
    { id: 'salvager', name: 'Salvage Expert', price: 600, text: '+25% money from battles.' },
    { id: 'hunter', name: 'Blueprint Hunter', price: 700, text: 'Blueprints drop more often, even from small bots.' },
  ];
  T.PART_CREDITS = (lvl) => AF.UPGRADE_COST[lvl] ? AF.UPGRADE_COST[lvl].credits : 0;

  // ---------- Helpers ----------
  const price = (s, n) => Math.ceil(n * (AF.hasPerk(s, 'haggler') ? 0.85 : 1) * (1 - AF.stats(s).discount));
  const cr = (n, short) => AF.moneyHtml(n, short);
  const btn = (label, attrs, ok, primary) => `<button class="btn sm${ok && primary ? ' primary' : ''}" ${attrs} ${ok ? '' : 'disabled'}>${label}</button>`;
  T.cardValue = (id) => Math.round(Object.entries(AF.CARDS[id].recipe).reduce((a, [k, n]) => a + T.RES_VALUE[k] * n, 0) * 1.6 + 6) * 10;

  function stock(s) {
    const rot = Math.floor(s.steps / T.RESTOCK);
    s.shop = s.shop && s.shop.rot === rot ? s.shop : { rot, bought: [] };
    const r = AF.rng(s.seed + rot * 977);
    const ids = AF.shuffle(Object.keys(AF.CARDS).filter((id) => AF.canUse(s, id)), r);
    const cards = ids.slice(0, 6);
    const locked = AF.shuffle(AF.lockedCards(s), r).slice(0, 2);
    return { rot, cards, locked, next: (rot + 1) * T.RESTOCK - s.steps };
  }

  // ---------- Screens ----------
  T.render = function (id, s) {
    switch (id) {
      case 'cards': return cardsShop(s);
      case 'salvage': return salvageShop(s);
      case 'garage': return garage(s);
      case 'bank': return bank(s);
      case 'diner': return diner(s);
      case 'academy': return academy(s);
      case 'boutique': return boutique(s);
      case 'home': return home(s);
    }
    return '';
  };

  function cardsShop(s) {
    const st = AF.stats(s), k = stock(s);
    const offers = k.cards.map((id, i) => {
      const p = price(s, T.cardValue(id)), sold = s.shop.bought.includes('c' + i);
      return AF.cardHtml(AF.cardDef({ id }), { st, footer: `<div class="cf">${cr(p, s.credits < p)}
        ${sold ? '<span class="own">Sold out</span>' : btn('Buy', `data-buy-card="${i}"`, s.credits >= p, true)}</div>` });
    }).join('');
    const bps = k.locked.map((id, i) => {
      const p = price(s, 450 + T.cardValue(id) * 2), sold = s.shop.bought.includes('b' + i);
      return `<div class="row-item"><div><b>Blueprint: ${AF.esc(AF.CARDS[id].name)}</b><span class="muted">Learn to forge it at the Home Forge.</span></div>
        <div class="row">${cr(p, s.credits < p)}${sold ? '<span class="own">Sold out</span>' : btn('Buy', `data-buy-bp="${i}"`, s.credits >= p, true)}</div></div>`;
    }).join('') || '<p class="muted">You already know every blueprint.</p>';
    const groups = {};
    s.cards.forEach((c) => { const g = c.id + (c.plus ? '+' : ''); (groups[g] = groups[g] || []).push(c); });
    const deckN = AF.deckCards(s).length;
    const sell = Object.entries(groups).sort().map(([g, list]) => {
      const d = AF.cardDef(list[0]), val = Math.floor(T.cardValue(list[0].id) * (list[0].plus ? 0.6 : 0.4));
      const canSell = list.some((c) => !c.inDeck) || deckN > AF.DECK_MIN;
      return `<div class="row-item"><div><b>${AF.esc(d.name)}</b><span class="muted">Own ${list.length} · ${list.filter((c) => c.inDeck).length} in deck</span></div>
        <div class="row">${cr(val)}${btn('Sell 1', `data-sell-card="${g}"`, canSell)}</div></div>`;
    }).join('');
    return `<h3>Cards for sale</h3><p class="hint">New stock in ${k.next} steps. Bought cards go to storage. Swap them into your deck from Party → Deck.</p>
      <div class="grid">${offers}</div>
      <h3>Blueprints</h3><div class="list">${bps}</div>
      <h3>Sell your cards</h3><p class="hint">Only cards in storage can be sold, so your 30-card deck stays intact.</p><div class="list">${sell}</div>`;
  }

  function salvageShop(s) {
    const rows = AF.RES_KEYS.map((k) => {
      const [b, sl] = T.MARKET[k], bp = price(s, b), have = s.res[k] || 0;
      return `<div class="row-item"><div><b><i class="chip" style="--c:${AF.RES[k].color}"></i>${AF.RES[k].name}</b><span class="muted">You have ${have} · buy ${AF.moneyText(bp)} · sell ${AF.moneyText(sl)}</span></div>
        <div class="row">${btn('Buy 1', `data-mkt="buy:${k}:1"`, s.credits >= bp, true)}${btn('Buy 5', `data-mkt="buy:${k}:5"`, s.credits >= bp * 5, true)}
        ${btn('Sell 1', `data-mkt="sell:${k}:1"`, have >= 1)}${btn('Sell 5', `data-mkt="sell:${k}:5"`, have >= 5)}${btn('Sell all', `data-mkt="sell:${k}:all"`, have >= 1)}</div></div>`;
    }).join('');
    return `<p class="hint">Card components for forging. Short a few Copper? Buy it here. Got too much Scrap? Sell it.</p><div class="list">${rows}</div>`;
  }

  // Boutique stock: 8 clothing pieces that rotate every 250 steps, plus charms that are always in.
  T.STOCK_EVERY = 250;
  T.tryOn = null;
  function boutiqueStock(s) {
    const n = Math.floor((s.steps || 0) / T.STOCK_EVERY);
    const pool = Object.keys(AF.ITEMS).filter((id) => AF.ITEMS[id].price && AF.ITEMS[id].slot !== 'charm');
    return { items: AF.shuffle(pool.slice(), AF.rng(9001 + n * 131)).slice(0, 8), next: T.STOCK_EVERY - ((s.steps || 0) % T.STOCK_EVERY) };
  }
  function shopRow(s, id) {
    const it = AF.ITEMS[id], pr = price(s, it.price), own = AF.owns(s, id), set = it.set && AF.SETS[it.set];
    return `<div class="row-item shop-item${own ? ' owned' : ''}${T.tryOn === id ? ' trying' : ''}" style="--rc:${AF.RARITY[it.rarity].color}">${AF.itemIcon(id)}
      <div><b>${AF.esc(it.name)}</b><span class="muted"><em class="rar">${AF.RARITY[it.rarity].name}</em> · ${AF.EQ_SLOTS[it.slot === 'charm' ? 'charm1' : it.slot]}${set ? ' · ' + set.name + ' set' : ''} · ${AF.itemText(id)}</span></div>
      <div class="row">${it.slot !== 'charm' ? `<button class="btn sm ghost" data-tryon="${id}">${T.tryOn === id ? 'Take off' : 'Try on'}</button>` : ''}${own ? '<span class="own">In wardrobe</span>' : cr(pr, s.credits < pr) + btn('Buy', `data-buygear="${id}"`, s.credits >= pr, true)}</div></div>`;
  }
  function garage(s) {
    const st = AF.stats(s), missing = st.maxHp - s.hp, repairCost = price(s, missing * 4);
    const swatches = AF.LOOK.core.map(([c, n], i) => `<button class="sw${s.look.core === i ? ' on' : ''}" data-core="${i}" style="--c:${c}" aria-label="${n}" title="${n}"></button>`).join('');
    return `<div class="garage-top">
        <div class="row-item"><div><b>Repairs</b><span class="muted">Automaton HP ${s.hp} / ${st.maxHp}</span></div>
          <div class="row">${missing ? cr(repairCost, s.credits < repairCost) + btn('Repair fully', 'data-repair="1"', s.credits >= repairCost, true) : '<span class="own">Good as new</span>'}</div></div>
        <div class="row-item"><div><b>Automaton Studio</b><span class="muted">Restyle ${AF.esc(AF.botName(s))}: chassis, head, eyes, antenna, paint and decals · free</span></div><div class="row"><button class="btn primary" data-act="studio">Open studio</button></div></div>
        <div class="row-item"><div><b>Core paint</b><span class="muted">${AF.LOOK.core[s.look.core][1]} · free</span></div><div class="swatches">${swatches}</div></div>
      </div>
      <h3>Part upgrades</h3>${AF.UI.robotTab(s, true)}`;
  }

  function bank(s) {
    const rows = AF.RES_KEYS.map((k) => {
      const have = s.res[k] || 0, saved = s.bank.res[k] || 0;
      return `<div class="row-item"><div><b><i class="chip" style="--c:${AF.RES[k].color}"></i>${AF.RES[k].name}</b><span class="muted">Carrying ${have} · in vault ${saved}</span></div>
        <div class="row">${btn('Deposit 5', `data-bank="dep:${k}:5"`, have >= 5)}${btn('Deposit all', `data-bank="dep:${k}:all"`, have >= 1, true)}
        ${btn('Withdraw 5', `data-bank="wd:${k}:5"`, saved >= 5)}${btn('Withdraw all', `data-bank="wd:${k}:all"`, saved >= 1)}</div></div>`;
    }).join('');
    return `<p class="hint">If your automaton goes down you lose a quarter of what you're carrying. Anything in the bank is always safe.</p>
      <div class="list">
        <div class="row-item"><div><b>Money</b><span class="muted">Carrying ${AF.moneyText(s.credits)} · in account ${AF.moneyText(s.bank.credits)}</span></div>
          <div class="row">${btn('Deposit 1 Gear', 'data-bank="dep:credits:100"', s.credits >= 100)}${btn('Deposit all', 'data-bank="dep:credits:all"', s.credits >= 1, true)}
          ${btn('Withdraw 1 Gear', 'data-bank="wd:credits:100"', s.bank.credits >= 100)}${btn('Withdraw all', 'data-bank="wd:credits:all"', s.bank.credits >= 1)}</div></div>
        ${rows}</div>`;
  }

  function diner(s) {
    const p = s.pilot, max = AF.pilotMaxVit(s);
    const item = (f, act, extra) => {
      const pr = price(s, f.price);
      return `<div class="row-item"><div><b>${f.name}</b><span class="muted">${f.text}${extra || ''}</span></div>
        <div class="row">${cr(pr, s.credits < pr)}${btn(act, `data-food="${f.id}"`, s.credits >= pr && !(f.vit && p.vit >= max) && !(f.id === 'ration' && p.rations >= T.RATION_MAX), true)}</div></div>`;
    };
    return `<div class="vitbar"><span>Pilot vitality</span><div class="bar me"><i style="width:${Math.round((p.vit / max) * 100)}%;background:linear-gradient(90deg,#d98c2b,#ffd75e)"></i><span>${p.vit} / ${max}</span></div></div>
      <h3>Hot meals</h3><div class="list">${T.FOOD.meals.map((f) => item(f, 'Eat')).join('')}</div>
      <h3>Healing to go</h3><div class="list">${T.FOOD.togo.map((f) => item(f, 'Buy', ` You have ${p.rations}.`)).join('')}</div>
      <h3>Battle buffs</h3><p class="hint">Each lasts 3 battles. Buying one again refreshes it.</p>
      <div class="list">${T.FOOD.buffs.map((f) => item(f, 'Order', p.buffs[f.id] ? ` Active: ${p.buffs[f.id]} battles left.` : '')).join('')}</div>`;
  }

  function home(s) {
    const p = s.pilot, max = AF.pilotMaxVit(s);
    return `<div class="bq-top"><canvas id="bq-preview" class="bq-preview"></canvas><div>
        <div class="vitbar"><span>Pilot vitality</span><div class="bar vit"><i style="width:${Math.round((p.vit / max) * 100)}%"></i><span>${p.vit} / ${max}</span></div></div>
        <div class="row" style="margin-top:10px">${btn('Rest in bed', 'data-rest="1"', p.vit < max, true)}<button class="btn" data-wardrobe="1">Wardrobe</button></div>
        <p class="hint">Resting is free and restores all of your pilot's vitality. Your automaton gets repaired at the Garage.</p></div></div>`;
  }

  function academy(s) {
    return `<p class="hint">Permanent skills for your pilot. They stay with this save forever.</p><div class="list">${T.PERKS.map((k) => {
      const own = AF.hasPerk(s, k.id), pr = price(s, k.price);
      return `<div class="row-item${own ? ' owned' : ''}"><div><b>${k.name}</b><span class="muted">${k.text}</span></div>
        <div class="row">${own ? '<span class="own">Learned</span>' : cr(pr, s.credits < pr) + btn('Train', `data-perk="${k.id}"`, s.credits >= pr, true)}</div></div>`;
    }).join('')}</div>`;
  }

  function boutique(s) {
    const k = boutiqueStock(s), charms = Object.keys(AF.ITEMS).filter((id) => AF.ITEMS[id].price && AF.ITEMS[id].slot === 'charm');
    const have = Object.keys(AF.ITEMS).filter((id) => AF.owns(s, id)).length;
    return `<div class="bq-top"><canvas id="bq-preview" class="bq-preview"></canvas><div>
        <p class="hint">Tap <b>Try on</b> to see a piece on your pilot before you buy. Everything you own lives in your Wardrobe. Collection: <b>${have} / ${Object.keys(AF.ITEMS).length}</b></p>
        <div class="row"><button class="btn primary" data-wardrobe="1">Open wardrobe</button><button class="btn" data-act="salon">Salon: hair & eyes</button></div></div></div>
      <h3>This week's collection</h3><p class="hint">New stock in ${k.next} steps. Rare and epic pieces are only found out in the wilds.</p>
      <div class="list">${k.items.map((id) => shopRow(s, id)).join('')}</div>
      <h3>Charms</h3><p class="hint">Hidden lucky charms. Wear up to two.</p><div class="list">${charms.map((id) => shopRow(s, id)).join('')}</div>`;
  }

  T.afterRender = function (id, s) {
    const c = document.querySelector('#bq-preview'); if (!c) return;
    c.width = 140; c.height = 190;
    const ap = AF.appearance(s);
    if (id === 'boutique' && T.tryOn) ap.outfit = Object.assign({}, ap.outfit, { [AF.ITEMS[T.tryOn].slot]: T.tryOn });
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    AF.drawPilotAt(g, c.width / 2, c.height - 8, c.height * 0.9, ap, 'down', 0, {});
  };

  // ---------- Actions ----------
  T.handle = function (t, s) {
    const el = t.closest('[data-buygear],[data-tryon],[data-buy-card],[data-buy-bp],[data-sell-card],[data-mkt],[data-repair],[data-core],[data-bank],[data-food],[data-perk],[data-unlock],[data-wardrobe],[data-rest]');
    if (!el || el.disabled) return !!el;
    const d = el.dataset, ok = (msg) => { AF.sfx('forge'); if (msg) AF.game.toast(msg); AF.game.persist(); AF.UI.render(); return true; };
    const spend = (n) => { if (s.credits < n) { AF.game.toast('Not enough money.'); return false; } s.credits -= n; return true; };

    if (d.tryon) { T.tryOn = T.tryOn === d.tryon ? null : d.tryon; AF.sfx('card'); AF.UI.render(); return true; }
    if (d.buygear) {
      const it = AF.ITEMS[d.buygear];
      if (AF.owns(s, d.buygear) || !spend(price(s, it.price))) return true;
      AF.giveItem(s, d.buygear);
      if (it.slot !== 'charm') AF.wear(s, d.buygear); else if (!s.equip.charm1 || !s.equip.charm2) AF.wear(s, d.buygear);
      T.tryOn = null; AF.Quests.event(s, 'outfit', {});
      return ok(`${it.name} added to your wardrobe and put on!`);
    }
    if (d.buyCard != null) {
      const k = stock(s), i = +d.buyCard, id = k.cards[i], pr = price(s, T.cardValue(id));
      if (s.shop.bought.includes('c' + i) || !spend(pr)) return true;
      const c = AF.newCard(id); c.inDeck = AF.deckCards(s).length < AF.DECK_MAX; s.cards.push(c); s.shop.bought.push('c' + i);
      return ok(`Bought ${AF.CARDS[id].name}.`);
    }
    if (d.buyBp != null) {
      const k = stock(s), i = +d.buyBp, id = k.locked[i];
      if (!id || s.shop.bought.includes('b' + i) || !spend(price(s, 450 + T.cardValue(id) * 2))) return true;
      s.known.push(id); s.shop.bought.push('b' + i);
      return ok(`Learned the ${AF.CARDS[id].name} blueprint.`);
    }
    if (d.sellCard) {
      const plus = d.sellCard.endsWith('+'), id = d.sellCard.replace('+', '');
      const list = s.cards.filter((c) => c.id === id && !!c.plus === plus);
      const pick = list.find((c) => !c.inDeck) || (AF.deckCards(s).length > AF.DECK_MIN ? list[0] : null);
      if (!pick) return true;
      s.cards = s.cards.filter((c) => c !== pick);
      const val = Math.floor(T.cardValue(id) * (plus ? 0.6 : 0.4)); s.credits += val;
      return ok(`Sold ${AF.CARDS[id].name} for ${AF.moneyText(val)}.`);
    }
    if (d.mkt) {
      const [act, k, q] = d.mkt.split(':'), [b, sl] = T.MARKET[k];
      if (act === 'buy') { const n = +q; if (!spend(price(s, b) * n)) return true; s.res[k] += n; return ok(); }
      const n = q === 'all' ? s.res[k] : Math.min(+q, s.res[k]); s.res[k] -= n; s.credits += n * sl;
      return ok(`Sold ${n} ${AF.RES[k].name} for ${AF.moneyText(n * sl)}.`);
    }
    if (d.repair) {
      const st = AF.stats(s), pr = price(s, (st.maxHp - s.hp) * 4);
      if (!spend(pr)) return true; s.hp = st.maxHp; AF.sfx('heal');
      return ok('Automaton fully repaired.');
    }
    if (d.core != null) { s.look.core = +d.core; return ok('Fresh core paint applied.'); }
    if (d.bank) {
      const [act, k, q] = d.bank.split(':');
      const from = act === 'dep' ? (k === 'credits' ? s.credits : s.res[k]) : (k === 'credits' ? s.bank.credits : s.bank.res[k] || 0);
      const n = q === 'all' ? from : Math.min(+q, from);
      if (n <= 0) return true;
      const sign = act === 'dep' ? 1 : -1;
      if (k === 'credits') { s.credits -= n * sign; s.bank.credits += n * sign; }
      else { s.res[k] -= n * sign; s.bank.res[k] = (s.bank.res[k] || 0) + n * sign; }
      if (act === 'dep') AF.Quests.event(s, 'deposit', {});
      return ok();
    }
    if (d.food) {
      const all = [...T.FOOD.meals, ...T.FOOD.togo, ...T.FOOD.buffs], f = all.find((x) => x.id === d.food), p = s.pilot;
      if (!spend(price(s, f.price))) return true;
      AF.Quests.event(s, 'food', {});
      if (f.vit) { p.vit = Math.min(AF.pilotMaxVit(s), p.vit + f.vit); AF.sfx('heal'); return ok(`${f.name}: delicious.`); }
      if (f.id === 'ration') { p.rations++; return ok('Field Ration packed.'); }
      p.buffs[f.id] = f.battles; return ok(`${f.name}: active for ${f.battles} battles.`);
    }
    if (d.perk) {
      const k = T.PERKS.find((x) => x.id === d.perk);
      if (AF.hasPerk(s, k.id) || !spend(price(s, k.price))) return true;
      s.pilot.perks.push(k.id);
      if (k.id === 'endurance') s.pilot.vit += 10;
      return ok(`Learned ${k.name}.`);
    }
    if (d.rest) { s.pilot.vit = AF.pilotMaxVit(s); AF.sfx('heal'); return ok('You feel rested and ready.'); }
    if (d.wardrobe) { T.tryOn = null; AF.UI.open('wardrobe'); return true; }
    return false;
  };

  // Eat a carried ration from the HUD.
  T.eatRation = function (s) {
    const max = AF.pilotMaxVit(s);
    if (!s.pilot.rations) return 'No rations left. Buy more at the Sparkplug Diner.';
    if (s.pilot.vit >= max) return 'Your pilot is already full.';
    s.pilot.rations--; s.pilot.vit = Math.min(max, s.pilot.vit + T.RATION_VIT); AF.sfx('heal');
    return `Ate a Field Ration (+${T.RATION_VIT} vitality).`;
  };
})();
