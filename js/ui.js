/* ArcForge — panels: Workshop (forge / deck / automaton / map), town shops, Menu, Help. */
(function () {
  const AF = (window.AF = window.AF || {});
  // ctx = which building the panel was opened from (null = field view from the HUD)
  const UI = (AF.UI = { tab: 'forge', ctx: null });
  const $ = (s) => document.querySelector(s);

  UI.resBar = function (s) {
    return `<span class="res">${AF.moneyHtml(s.credits, false, true)}</span>` +
      AF.RES_KEYS.map((k) => `<span class="res" title="${AF.RES[k].name}"><i class="chip" style="--c:${AF.RES[k].color}"></i><b>${s.res[k] || 0}</b><em>${AF.RES[k].name}</em></span>`).join('');
  };

  UI.open = function (tab, ctx) {
    UI.bld = ctx || null; UI.ctx = ctx ? AF.shopOf(ctx) : null;
    if (tab) UI.tab = tab;
    else if (!UI.ctx || UI.ctx === 'forge') UI.tab = UI.ctx === 'forge' ? 'forge' : 'deck';
    $('#panel').hidden = false; UI.render();
  };
  UI.close = function () { $('#panel').hidden = true; UI.ctx = null; AF.game.refresh(); };
  UI.isOpen = () => !$('#panel').hidden;

  UI.render = function () {
    const s = AF.game.state, ctx = UI.ctx;
    const shop = ctx && ctx !== 'forge';
    let head, body;
    if (shop) {
      const b = AF.BUILDINGS[UI.bld] || AF.BUILDINGS[ctx];
      head = `<h2>${b.name}</h2>`;
      body = `<p class="blurb">${b.blurb}</p>` + AF.Town.render(ctx, s);
    } else {
      const tabs = [['quests', 'Quests'], ['pilot', 'Pilot'], ['wardrobe', 'Wardrobe'], ['automaton', AF.esc(AF.botName(s))], ['deck', 'Deck'], ['forge', 'Forge'], ['trophies', 'Trophies'], ['map', 'Map']];
      head = `<h2>${ctx === 'forge' ? 'Rivet Forge' : 'Party'}</h2>
        <nav class="tabs">${tabs.map(([k, n]) => `<button class="tab${UI.tab === k ? ' on' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>`;
      if (UI.tab === 'quests') body = AF.Quests.logHtml(s);
      if (UI.tab === 'pilot') body = AF.pilotTab(s);
      if (UI.tab === 'wardrobe') body = AF.wardrobeTab(s);
      if (UI.tab === 'trophies') body = AF.trophiesTab(s);
      if (UI.tab === 'deck') AF.Quests.event(s, 'deck', {});
      if (UI.tab === 'automaton') body = UI.robotTab(s, false);
      if (UI.tab === 'forge') body = forgeTab(s, ctx === 'forge');
      if (UI.tab === 'deck') body = deckTab(s, ctx === 'forge');
      if (UI.tab === 'map') body = `<div class="maptab"><canvas id="bigmap"></canvas><div class="legend">
        <span><i class="chip" style="--c:#fff"></i>You</span>${AF.World.area(s) === 'foundry'
          ? '<span><i class="chip" style="--c:#f2c45a"></i>Unopened strongbox</span><span><i class="chip" style="--c:#ff3b5c"></i>The Warden\'s hall</span>'
          : '<span><i class="chip" style="--c:#b8743a"></i>Buildings (Rivet Hollow, Brasshaven)</span><span><i class="chip" style="--c:#3ad0ff"></i>Unsearched ruin</span><span><i class="chip" style="--c:#c27bff"></i>Sunken Foundry</span><span><i class="chip" style="--c:#ff3b5c"></i>Titan\'s lair</span><span><i class="chip" style="--c:#a9b4bd"></i>Scrap · <i class="chip" style="--c:#e0894a"></i>Copper · <i class="chip" style="--c:#9fd8f0"></i>Silicon · <i class="chip" style="--c:#c27bff"></i>Arcite deposits</span><span><i class="chip" style="--c:#e8803a"></i>Disturbance (step in to fight)</span><span><i class="chip" style="--c:#f2c45a"></i>Bounty Board</span><span><i class="chip" style="--c:#ffd24a"></i>Bounty target</span>'}
        <p id="explored"></p></div></div>`;
      if (ctx !== 'forge' && UI.tab === 'forge') body = '<p class="note">Forging happens inside the Rivet Forge in town. You can browse recipes here.</p>' + body;
    }
    $('#panel .sheet').innerHTML = `
      <header class="ph">${head}<button class="btn ghost x" data-act="close-panel" aria-label="Close">Close</button></header>
      <div class="resbar">${UI.resBar(s)}</div>
      <div class="pbody">${body}</div>`;
    if (!shop && UI.tab === 'map') $('#explored').textContent = `${AF.World.drawMap($('#bigmap'), s)}% of ${AF.World.area(s) === 'foundry' ? 'the Sunken Foundry' : 'the wilds'} explored`;
    if (shop) AF.Town.afterRender(ctx, s);
    if (!shop && UI.tab === 'pilot') AF.pilotTabAfter(s);
    if (!shop && UI.tab === 'wardrobe') AF.wardrobeAfter(s);
    AF.Pixel.paint($('#panel'), s);
  };

  // Automaton parts. canUp = true only inside the Garage.
  UI.robotTab = function (s, canUp) {
    const st = AF.stats(s);
    const rows = AF.PART_KEYS.map((k) => {
      const lvl = s.parts[k], P = AF.PARTS[k], max = lvl >= AF.MAX_LVL;
      const cost = AF.UPGRADE_COST[lvl];
      const ok = !max && canUp && AF.canPay(s, cost);
      return `<div class="part">
        <div class="pt-h"><b>${P.name}</b><span class="tier">${P.tiers[lvl - 1]}</span>
          <span class="lv">${Array.from({ length: AF.MAX_LVL }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</span></div>
        <p class="eff">${AF.partEffect(k, lvl)}${max ? '' : ` <span class="next">→ ${P.tiers[lvl]}: ${AF.partEffect(k, lvl + 1)}</span>`}</p>
        ${max ? '<p class="muted">Fully upgraded</p>' : `<div class="buy"><div class="costs">${AF.costHtml(cost, s)}</div>
          ${canUp ? `<button class="btn${ok ? ' primary' : ''}" data-up="${k}" ${ok ? '' : 'disabled'}>Upgrade</button>` : ''}</div>`}
      </div>`;
    }).join('');
    return `${canUp ? '' : '<p class="note">Upgrade parts at the Bolt & Gear Garage in town.</p>'}<div class="robot-tab">
      <div class="robot-card"><h3 class="bot-name">${AF.esc(AF.botName(s))}</h3><canvas class="spr robot-big" data-spr="robot"></canvas><button class="btn primary" data-act="studio">Customize look</button>
        <dl class="statlist"><dt>HP</dt><dd>${s.hp} / ${st.maxHp}</dd><dt>Energy</dt><dd>${st.energy} per turn</dd>
          <dt>Hand</dt><dd>${st.hand} cards</dd><dt>Attack</dt><dd>+${st.dmg}</dd><dt>Defense</dt><dd>+${st.block}</dd>
          <dt>Terrain</dt><dd>${AF.TERRAIN_BY_LEGS[st.legs]}</dd></dl></div>
      <div class="parts">${rows}</div></div>`;
  };

  function forgeTab(s, atForge) {
    const st = AF.stats(s);
    const owned = (id) => s.cards.filter((c) => c.id === id).length;
    const ids = Object.keys(AF.CARDS).filter((id) => AF.canUse(s, id));
    const known = ids.filter((id) => s.known.includes(id)), locked = ids.filter((id) => !s.known.includes(id));
    return `<p class="hint">Forge new cards from materials. New cards go to storage; swap them into your deck in the Deck tab. Blueprints for advanced cards come from ruins, tougher bots, or the Deckhouse.</p>
      <div class="grid">${known.map((id) => {
        const c = AF.CARDS[id], ok = atForge && AF.canPay(s, c.recipe);
        return AF.cardHtml(AF.cardDef({ id }), { st, footer: `<div class="cf"><div class="costs">${AF.costHtml(c.recipe, s)}</div>
          ${atForge ? `<button class="btn sm${ok ? ' primary' : ''}" data-forge="${id}" ${ok ? '' : 'disabled'}>Forge</button>` : ''}
          <span class="own">Owned ${owned(id)}</span></div>` });
      }).join('')}
      ${locked.map(() => `<div class="card locked"><b class="nm">Unknown blueprint</b><span class="tx">Search ruins, beat tougher bots, or buy it at the Deckhouse.</span></div>`).join('')}</div>`;
  }

  // Deck builder: the deck is always exactly 30 cards. Pick a deck card, then a storage card, to swap them.
  UI.swapOut = null;
  const gkey = (c) => `${c.id}|${c.plus ? 1 : 0}`;
  function groups(list) {
    const m = new Map();
    list.forEach((c) => { const k = gkey(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c); });
    const order = { attack: 0, defend: 1, move: 2, repair: 3, tech: 4 };
    return [...m.entries()].sort((a, b) => order[AF.CARDS[a[1][0].id].kind] - order[AF.CARDS[b[1][0].id].kind] || AF.CARDS[a[1][0].id].cost - AF.CARDS[b[1][0].id].cost || a[0].localeCompare(b[0]));
  }
  function deckTab(s, atForge) {
    const st = AF.stats(s), deck = AF.deckCards(s), store = s.cards.filter((c) => !c.inDeck), n = deck.length;
    const upOk = atForge && AF.canPay(s, AF.CARD_UPGRADE_COST), C = AF.CONSTRUCTS[s.construct];
    if (UI.swapOut && !deck.some((c) => gkey(c) === UI.swapOut)) UI.swapOut = null;
    const tile = (k, cs, inDeck) => {
      const c = cs[0], sel = inDeck && UI.swapOut === k, usable = AF.canUse(s, c.id);
      const up = !c.plus && atForge && usable ? `<button class="btn sm" data-cup="${c.uid}" ${upOk ? '' : 'disabled'}>Upgrade</button>` : '';
      return AF.cardHtml(AF.cardDef(c), { st, selected: sel, disabled: !usable, cls: inDeck ? 'in-deck' : 'in-store', reason: usable ? '' : 'Other Construct',
        attrs: `${inDeck ? `data-dsel="${k}"` : `data-sin="${k}"`} role="button" tabindex="0"`,
        footer: `<div class="cf"><span class="cnt">×${cs.length}</span>${up}</div>` });
    };
    const deckG = groups(deck), storeG = groups(store);
    const kinds = {}; deck.forEach((c) => { const k = AF.CARDS[c.id].kind; kinds[k] = (kinds[k] || 0) + 1; });
    const status = n === AF.DECK_SIZE ? `<b class="ok">${n} / ${AF.DECK_SIZE}</b>` : `<b class="bad">${n} / ${AF.DECK_SIZE}</b>`;
    return `<div class="deck-head">${C ? `<span class="con-chip con-${s.construct}">${C.short}</span>` : ''}<span>Deck ${status}</span>
        <span class="mix">${Object.entries(kinds).map(([k, v]) => `<i class="k-${k}">${v} ${k}</i>`).join('')}</span></div>
      <p class="hint">${UI.swapOut ? '<b>Now tap a card in storage to swap it in</b> (or tap the selected card again to cancel).' : n < AF.DECK_SIZE ? 'Your deck is short. Tap storage cards to add them.' : n > AF.DECK_SIZE ? 'Your deck is too big. Tap deck cards to move them to storage.' : 'Decks hold exactly 30 cards. Tap a deck card, then a storage card, to swap them.'}
      ${atForge ? `Upgrade a card for ${AF.costHtml(AF.CARD_UPGRADE_COST, s)}.` : 'Upgrade cards at the Rivet Forge.'}</p>
      <h3>In your deck</h3><div class="grid">${deckG.map(([k, cs]) => tile(k, cs, true)).join('')}</div>
      <h3>Storage <span class="muted">${store.length}</span></h3>${storeG.length ? `<div class="grid${UI.swapOut ? ' swapping' : ''}">${storeG.map(([k, cs]) => tile(k, cs, false)).join('')}</div>` : '<p class="muted">Nothing in storage yet. Forge or buy cards to build your options.</p>'}`;
  }

  // ---------- Actions ----------
  UI.handle = function (t) {
    const s = AF.game.state;
    if (UI.ctx && UI.ctx !== 'forge' && AF.Town.handle(t, s)) return true;
    const cs = t.closest('[data-cstyle]');
    if (cs) { AF.trophiesHandle(AF.game.state, cs); AF.game.persist(); const y = $('#panel .sheet') && $('#panel .sheet').scrollTop; UI.render(); if ($('#panel .sheet')) $('#panel .sheet').scrollTop = y; return true; }
    const el = t.closest('[data-tab],[data-up],[data-forge],[data-dsel],[data-sin],[data-cup],[data-act],[data-wear],[data-wfilter],[data-preset-save],[data-preset-wear]');
    if (!el) return false;
    if (el.dataset.wear || el.dataset.wfilter || el.dataset.presetSave || el.dataset.presetWear) { const y = $('#panel .pbody') && $('#panel .pbody').scrollTop; AF.wardrobeHandle(s, el); AF.game.persist(); AF.game.refresh(); UI.render(); if ($('#panel .pbody')) $('#panel .pbody').scrollTop = y; return true; }
    if (el.dataset.tab) { UI.tab = el.dataset.tab; UI.render(); return true; }
    if (el.dataset.up) {
      const k = el.dataset.up, cost = AF.UPGRADE_COST[s.parts[k]];
      if (UI.ctx !== 'garage' || !cost || !AF.canPay(s, cost)) return true;
      AF.payCost(s, cost); s.parts[k]++;
      if (k === 'frame') s.hp = AF.stats(s).maxHp;
      AF.sfx('forge'); AF.game.toast(`${AF.PARTS[k].name} upgraded to ${AF.PARTS[k].tiers[s.parts[k] - 1]}.`);
      AF.Quests.event(s, 'upgrade', { part: k, lvl: s.parts[k] });
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.forge) {
      const id = el.dataset.forge, c = AF.CARDS[id];
      if (UI.ctx !== 'forge' || !AF.canPay(s, c.recipe)) return true;
      AF.payCost(s, c.recipe);
      const card = AF.newCard(id);
      card.inDeck = AF.deckCards(s).length < AF.DECK_SIZE;
      s.cards.push(card); s.stats.forged++;
      AF.Quests.event(s, 'forge', {});
      AF.sfx('forge'); AF.game.toast(`Forged ${c.name}.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.cup) {
      const c = s.cards.find((x) => x.uid === el.dataset.cup);
      if (!c || c.plus || UI.ctx !== 'forge' || !AF.canPay(s, AF.CARD_UPGRADE_COST)) return true;
      AF.payCost(s, AF.CARD_UPGRADE_COST); c.plus = true; AF.bumpStat(s, 'upgraded');
      AF.sfx('forge'); AF.game.toast(`${AF.CARDS[c.id].name} upgraded.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.dsel || el.dataset.sin) {
      const deck = AF.deckCards(s), n = deck.length;
      if (el.dataset.dsel) {
        if (n > AF.DECK_SIZE) { const c = deck.find((x) => gkey(x) === el.dataset.dsel); if (c) c.inDeck = false; }
        else UI.swapOut = UI.swapOut === el.dataset.dsel ? null : el.dataset.dsel;
      } else {
        const inc = s.cards.find((x) => !x.inDeck && gkey(x) === el.dataset.sin);
        if (!inc) return true;
        if (!AF.canUse(s, inc.id)) { AF.game.toast('That card is built for a different Construct.'); return true; }
        if (n < AF.DECK_SIZE) inc.inDeck = true;
        else if (UI.swapOut) { const out = deck.find((x) => gkey(x) === UI.swapOut); if (out) { out.inDeck = false; inc.inDeck = true; AF.game.toast(`Swapped ${AF.cardDef(out).name} for ${AF.cardDef(inc).name}.`); } UI.swapOut = null; }
        else { AF.game.toast('Tap a card in your deck to swap out first.'); return true; }
      }
      AF.sfx('card'); AF.game.persist(); const y = $('#panel .pbody').scrollTop; UI.render(); $('#panel .pbody').scrollTop = y; return true;
    }
    if (el.dataset.act === 'close-panel') { UI.close(); return true; }
    return false;
  };

  // ---------- Menu ----------
  UI.menu = function () {
    const m = $('#menu');
    m.hidden = false;
    m.querySelector('.sheet').innerHTML = `
      <header class="ph"><h2>Menu</h2><button class="btn ghost x" data-act="close-menu">Close</button></header>
      <div class="pbody menu">
        <button class="btn" data-act="help">How to play</button>
        <button class="btn" data-act="sound">Sound: ${AF.muted ? 'off' : 'on'}</button>
        ${AF.Sprites && AF.Sprites.hasArt() ? `<button class="btn" data-act="charart">Character art: ${AF.Sprites.use() ? 'sprites' : 'classic'}</button>` : ''}
        <button class="btn" data-act="to-title">Save and switch pilot</button>
        <h3>Save code</h3>
        <p class="hint">${AF.esc(AF.game.state.look.name)} autosaves to slot ${AF.game.state.slot}. Copy this code to move the save to another device.</p>
        <textarea id="savecode" readonly rows="3"></textarea>
        <div class="row"><button class="btn" data-act="copy">Copy code</button></div>
        <h3>Load a save code into this slot</h3>
        <textarea id="loadcode" rows="3" placeholder="Paste a save code"></textarea>
        <div class="row"><button class="btn" data-act="load">Load</button></div>
      </div>`;
    $('#savecode').value = AF.exportCode(AF.game.state);
  };

  UI.help = function () {
    const m = $('#menu');
    m.hidden = false;
    m.querySelector('.sheet').innerHTML = `
      <header class="ph"><h2>How to play</h2><button class="btn ghost x" data-act="close-menu">Close</button></header>
      <div class="pbody help">
        <p><b>Move.</b> Arrow keys or WASD, hold Shift to run. On touch screens use the pad (hold B to run), or drag on the map like a joystick. Your automaton follows you.</p>
        <p><b>Interact.</b> Face something and press E, Space, Enter or the A button: talk to people, enter doors, read signs, pick up and gather resources, search ruins. A prompt shows what you can do. Tapping right next to your pilot works too.</p>
        <p><b>Finding fights.</b> A few bots roam the wilds, but most battles are your choice: step into a glowing <b>disturbance</b> (rustling brush, swirling dust, sparking scrap), take a job from a town <b>Bounty Board</b>, or set out a <b>lure</b> from the Salvage Exchange. Bounty and lure fights always drop materials.</p>
        <p><b>Gathering.</b> Resources come from named deposits (scrapyards, copper seams, silica beds, crystal grottos) shown on your map. Face a node and press the action button: <b>strike</b> ore when the needle hits the glowing seam (gold = perfect), or <b>rummage</b> a scrap pile by remembering which spots the scanner made glint. A flawless job finds something rare. Nodes take a long while to recover.</p>
        <p><b>Blueprints</b> are rare: search ruins (marked on the map), hunt bounties and beat tough bots.</p>
        <p><b>Card style.</b> Rarity gems show how rare a card is (it doesn't change its strength). Earn new frames, animated finishes and card backs from achievements in Party → Trophies.</p>
        <p><b>Shortcuts.</b> Q opens your deck and quests, M the map, R eats a ration, L uses a lure.</p>
        <p><b>Town.</b> ${AF.TOWN_NAME} is safe from enemies. Your House (rest, wardrobe), the Rivet Forge (cards and deck), the Deckhouse (buy/sell cards), the Salvage Exchange (materials), the Garage (part upgrades, repairs, core paint), the Bank (safe storage), the Diner (food and buffs), the Pilot Academy (skills) and the Boutique (outfits).</p>
        <p><b>Quests.</b> Follow the story from the quest tracker at the top-left. Pip by the Academy offers optional tutorial tasks.</p>
        <p><b>Your pilot</b> gets hungry in the wild. At zero vitality you're exhausted: −1 energy in battle and smaller harvests. Rest at home, eat at the Diner or carry Field Rations.</p>
        <p><b>Automaton parts.</b> Arc Core = energy per turn. Frame = HP. Locomotion = terrain (Treads for rubble, Hover Jets for water, Spider Legs for mountains). Arms = hand size and gathering. Weapon and Shield boost your attack and defend cards.</p>
        <p><b>Constructs.</b> Your automaton is a Bulwark (tanky, keeps Block, strikes back), a Sprocket (fast, fragile, combo chains) or an Arcwright (hits harder at Mid and Far, weak up close). Each has its own cards. Decks hold exactly 30 cards: in Party → Deck, tap a deck card and then a storage card to swap them.</p>
        <p><b>Fight.</b> Touch an enemy to battle. Spend energy to play cards. Distance matters: Close, Mid, Far. Watch the enemy's next move and step out of reach to dodge it. If your automaton goes down, you lose a quarter of what you're carrying, so bank your valuables.</p>
        <p><b>Goal.</b> Find the Titan Core's lair in the far mountains and shut it down.</p>
      </div>`;
  };

  UI.menuHandle = function (t) {
    const el = t.closest('[data-act]');
    if (!el) return false;
    const act = el.dataset.act;
    if (act === 'close-menu') { $('#menu').hidden = true; return true; }
    if (act === 'help') { UI.help(); return true; }
    if (act === 'sound') { AF.muted = !AF.muted; try { localStorage.setItem('arcforge.muted', AF.muted ? '1' : '0'); } catch (e) {} UI.menu(); return true; }
    if (act === 'charart') { AF.Sprites.setMode(AF.Sprites.use() ? 'classic' : 'sprites'); UI.menu(); AF.game.toast(AF.Sprites.use() ? 'Using sprite art.' : 'Using classic art.'); return true; }
    if (act === 'to-title') { $('#menu').hidden = true; AF.game.toTitle(); return true; }
    if (act === 'copy') {
      const ta = $('#savecode'); ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => AF.game.toast('Save code copied.'), () => AF.game.toast('Select the code and copy it.'));
      return true;
    }
    if (act === 'load') {
      const s = AF.importCode($('#loadcode').value, AF.game.state.slot);
      if (!s) { AF.game.toast("That code didn't work. Check it was copied fully."); return true; }
      AF.game.start(s); $('#menu').hidden = true; AF.game.toast('Save loaded.'); return true;
    }
    return false;
  };
})();
