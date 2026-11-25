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
    UI.ctx = ctx || null;
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
      const b = AF.BUILDINGS[ctx];
      head = `<h2>${b.name}</h2>`;
      body = `<p class="blurb">${b.blurb}</p>` + AF.Town.render(ctx, s);
    } else {
      const tabs = [['quests', 'Quests'], ['pilot', 'Pilot'], ['wardrobe', 'Wardrobe'], ['automaton', AF.esc(AF.botName(s))], ['deck', 'Deck'], ['forge', 'Forge'], ['map', 'Map']];
      head = `<h2>${ctx === 'forge' ? 'Rivet Forge' : 'Party'}</h2>
        <nav class="tabs">${tabs.map(([k, n]) => `<button class="tab${UI.tab === k ? ' on' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>`;
      if (UI.tab === 'quests') body = AF.Quests.logHtml(s);
      if (UI.tab === 'pilot') body = AF.pilotTab(s);
      if (UI.tab === 'wardrobe') body = AF.wardrobeTab(s);
      if (UI.tab === 'deck') AF.Quests.event(s, 'deck', {});
      if (UI.tab === 'automaton') body = UI.robotTab(s, false);
      if (UI.tab === 'forge') body = forgeTab(s, ctx === 'forge');
      if (UI.tab === 'deck') body = deckTab(s, ctx === 'forge');
      if (UI.tab === 'map') body = `<div class="maptab"><canvas id="bigmap"></canvas><div class="legend">
        <span><i class="chip" style="--c:#fff"></i>You</span><span><i class="chip" style="--c:#e05848"></i>Buildings in ${AF.TOWN_NAME}</span>
        <span><i class="chip" style="--c:#5ef2e1"></i>Unsearched ruin</span><span><i class="chip" style="--c:#ff3b5c"></i>Titan's lair</span>
        <p id="explored"></p></div></div>`;
      if (ctx !== 'forge' && UI.tab === 'forge') body = '<p class="note">Forging happens inside the Rivet Forge in town. You can browse recipes here.</p>' + body;
    }
    $('#panel .sheet').innerHTML = `
      <header class="ph">${head}<button class="btn ghost x" data-act="close-panel" aria-label="Close">Close</button></header>
      <div class="resbar">${UI.resBar(s)}</div>
      <div class="pbody">${body}</div>`;
    if (!shop && UI.tab === 'map') $('#explored').textContent = `${AF.World.drawMap($('#bigmap'), s)}% of the wasteland explored`;
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
    const ids = Object.keys(AF.CARDS);
    const known = ids.filter((id) => s.known.includes(id)), locked = ids.filter((id) => !s.known.includes(id));
    return `<p class="hint">Forge new cards from materials. New cards go straight into your deck. Blueprints for advanced cards come from ruins, tougher bots, or the Deckhouse.</p>
      <div class="grid">${known.map((id) => {
        const c = AF.CARDS[id], ok = atForge && AF.canPay(s, c.recipe);
        return AF.cardHtml(AF.cardDef({ id }), { st, footer: `<div class="cf"><div class="costs">${AF.costHtml(c.recipe, s)}</div>
          ${atForge ? `<button class="btn sm${ok ? ' primary' : ''}" data-forge="${id}" ${ok ? '' : 'disabled'}>Forge</button>` : ''}
          <span class="own">Owned ${owned(id)}</span></div>` });
      }).join('')}
      ${locked.map(() => `<div class="card locked"><b class="nm">Unknown blueprint</b><span class="tx">Search ruins, beat tougher bots, or buy it at the Deckhouse.</span></div>`).join('')}</div>`;
  }

  function deckTab(s, atForge) {
    const st = AF.stats(s), n = AF.deckCards(s).length;
    const sorted = s.cards.slice().sort((a, b) => (b.inDeck - a.inDeck) || a.id.localeCompare(b.id) || (b.plus - a.plus));
    const upOk = atForge && AF.canPay(s, AF.CARD_UPGRADE_COST);
    return `<p class="hint"><b>${n}</b> cards in deck (min ${AF.DECK_MIN}, max ${AF.DECK_MAX}). Tap a card to move it in or out of your deck.
      ${atForge ? `Upgrade a card for ${AF.costHtml(AF.CARD_UPGRADE_COST, s)}` : 'Card upgrades are done at the Home Forge.'}</p>
      <div class="grid">${sorted.map((c) => AF.cardHtml(AF.cardDef(c), { st, disabled: !c.inDeck, attrs: `data-toggle="${c.uid}" role="button" tabindex="0"`,
        footer: `<div class="cf"><span class="own">${c.inDeck ? 'In deck' : 'In storage'}</span>
          ${c.plus || !atForge ? '' : `<button class="btn sm" data-cup="${c.uid}" ${upOk ? '' : 'disabled'}>Upgrade</button>`}</div>` })).join('')}</div>`;
  }

  // ---------- Actions ----------
  UI.handle = function (t) {
    const s = AF.game.state;
    if (UI.ctx && UI.ctx !== 'forge' && AF.Town.handle(t, s)) return true;
    const el = t.closest('[data-tab],[data-up],[data-forge],[data-toggle],[data-cup],[data-act],[data-wear],[data-wfilter],[data-preset-save],[data-preset-wear]');
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
      card.inDeck = AF.deckCards(s).length < AF.DECK_MAX;
      s.cards.push(card); s.stats.forged++;
      AF.Quests.event(s, 'forge', {});
      AF.sfx('forge'); AF.game.toast(`Forged ${c.name}.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.cup) {
      const c = s.cards.find((x) => x.uid === el.dataset.cup);
      if (!c || c.plus || UI.ctx !== 'forge' || !AF.canPay(s, AF.CARD_UPGRADE_COST)) return true;
      AF.payCost(s, AF.CARD_UPGRADE_COST); c.plus = true;
      AF.sfx('forge'); AF.game.toast(`${AF.CARDS[c.id].name} upgraded.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.toggle) {
      const c = s.cards.find((x) => x.uid === el.dataset.toggle), n = AF.deckCards(s).length;
      if (!c) return true;
      if (c.inDeck && n <= AF.DECK_MIN) { AF.game.toast(`A deck needs at least ${AF.DECK_MIN} cards.`); return true; }
      if (!c.inDeck && n >= AF.DECK_MAX) { AF.game.toast(`A deck holds at most ${AF.DECK_MAX} cards.`); return true; }
      c.inDeck = !c.inDeck; AF.sfx('card'); AF.game.persist(); UI.render(); return true;
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
        <p><b>Shortcuts.</b> Q opens your deck and quests, M the map, R eats a ration.</p>
        <p><b>Town.</b> ${AF.TOWN_NAME} is safe from enemies. Your House (rest, wardrobe), the Rivet Forge (cards and deck), the Deckhouse (buy/sell cards), the Salvage Exchange (materials), the Garage (part upgrades, repairs, core paint), the Bank (safe storage), the Diner (food and buffs), the Pilot Academy (skills) and the Boutique (outfits).</p>
        <p><b>Quests.</b> Follow the story from the quest tracker at the top-left. Pip by the Academy offers optional tutorial tasks.</p>
        <p><b>Your pilot</b> gets hungry in the wild. At zero vitality you're exhausted: −1 energy in battle and smaller harvests. Rest at home, eat at the Diner or carry Field Rations.</p>
        <p><b>Automaton parts.</b> Arc Core = energy per turn. Frame = HP. Locomotion = terrain (Treads for rubble, Hover Jets for water, Spider Legs for mountains). Arms = hand size and gathering. Weapon and Shield boost your attack and defend cards.</p>
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
