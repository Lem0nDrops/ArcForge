/* ArcForge — panels: Workshop (robot upgrades, card forge, deck), Map, Menu, Help. */
(function () {
  const AF = (window.AF = window.AF || {});
  const UI = (AF.UI = { tab: 'robot' });
  const $ = (s) => document.querySelector(s);

  UI.resBar = function (res) {
    return AF.RES_KEYS.map((k) => `<span class="res" title="${AF.RES[k].name}"><i class="chip" style="--c:${AF.RES[k].color}"></i><b>${res[k] || 0}</b><em>${AF.RES[k].name}</em></span>`).join('');
  };

  UI.open = function (tab) { if (tab) UI.tab = tab; $('#panel').hidden = false; UI.render(); };
  UI.close = function () { $('#panel').hidden = true; AF.game.refresh(); };
  UI.isOpen = () => !$('#panel').hidden;

  UI.render = function () {
    const s = AF.game.state, atBase = AF.World.atBase(s);
    const tabs = [['robot', 'Robot'], ['forge', 'Forge'], ['deck', 'Deck'], ['map', 'Map']];
    let body = '';
    if (UI.tab === 'robot') body = robotTab(s, atBase);
    if (UI.tab === 'forge') body = forgeTab(s, atBase);
    if (UI.tab === 'deck') body = deckTab(s, atBase);
    if (UI.tab === 'map') body = `<div class="maptab"><canvas id="bigmap"></canvas><div class="legend">
      <span><i class="chip" style="--c:#fff"></i>You</span><span><i class="chip" style="--c:#e0894a"></i>Home Forge</span>
      <span><i class="chip" style="--c:#5ef2e1"></i>Unsearched ruin</span><span><i class="chip" style="--c:#ff3b5c"></i>Titan's lair</span>
      <p id="explored"></p></div></div>`;
    $('#panel .sheet').innerHTML = `
      <header class="ph">
        <h2>${atBase ? 'Home Forge' : 'Field view'}</h2>
        <nav class="tabs">${tabs.map(([k, n]) => `<button class="tab${UI.tab === k ? ' on' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>
        <button class="btn ghost x" data-act="close-panel" aria-label="Close">Close</button>
      </header>
      <div class="resbar">${UI.resBar(s.res)}</div>
      ${!atBase && UI.tab !== 'map' && UI.tab !== 'deck' ? '<p class="note">Return to the Home Forge to build. You can still plan here.</p>' : ''}
      <div class="pbody">${body}</div>`;
    if (UI.tab === 'map') $('#explored').textContent = `${AF.World.drawMap($('#bigmap'), s)}% of the wasteland explored`;
  };

  function robotTab(s, atBase) {
    const st = AF.stats(s.parts);
    const rows = AF.PART_KEYS.map((k) => {
      const lvl = s.parts[k], P = AF.PARTS[k], max = lvl >= AF.MAX_LVL;
      const cost = AF.UPGRADE_COST[lvl];
      const ok = !max && atBase && AF.canAfford(s.res, cost);
      return `<div class="part">
        <div class="pt-h"><b>${P.name}</b><span class="tier">${P.tiers[lvl - 1]}</span>
          <span class="lv">${Array.from({ length: AF.MAX_LVL }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</span></div>
        <p class="eff">${AF.partEffect(k, lvl)}${max ? '' : ` <span class="next">→ ${P.tiers[lvl]}: ${AF.partEffect(k, lvl + 1)}</span>`}</p>
        ${max ? '<p class="muted">Fully upgraded</p>' : `<div class="buy"><div class="costs">${AF.costHtml(cost, s.res)}</div>
          <button class="btn${ok ? ' primary' : ''}" data-up="${k}" ${ok ? '' : 'disabled'}>Upgrade</button></div>`}
      </div>`;
    }).join('');
    return `<div class="robot-tab">
      <div class="robot-card">${AF.robotSVG(s.parts, { cls: 'big' })}
        <dl class="statlist"><dt>HP</dt><dd>${s.hp} / ${st.maxHp}</dd><dt>Energy</dt><dd>${st.energy} per turn</dd>
          <dt>Hand</dt><dd>${st.hand} cards</dd><dt>Attack</dt><dd>+${st.dmg}</dd><dt>Defense</dt><dd>+${st.block}</dd>
          <dt>Terrain</dt><dd>${AF.TERRAIN_BY_LEGS[st.legs]}</dd></dl></div>
      <div class="parts">${rows}</div></div>`;
  }

  function forgeTab(s, atBase) {
    const st = AF.stats(s.parts);
    const owned = (id) => s.cards.filter((c) => c.id === id).length;
    const ids = Object.keys(AF.CARDS);
    const known = ids.filter((id) => s.known.includes(id)), locked = ids.filter((id) => !s.known.includes(id));
    return `<p class="hint">Forge new cards from materials. New cards go straight into your deck. Blueprints for advanced cards are hidden in ruins and dropped by tougher bots.</p>
      <div class="grid">${known.map((id) => {
        const c = AF.CARDS[id], ok = atBase && AF.canAfford(s.res, c.recipe);
        return AF.cardHtml(AF.cardDef({ id }), { st, footer: `<div class="cf"><div class="costs">${AF.costHtml(c.recipe, s.res)}</div>
          <button class="btn sm${ok ? ' primary' : ''}" data-forge="${id}" ${ok ? '' : 'disabled'}>Forge</button>
          <span class="own">Owned ${owned(id)}</span></div>` });
      }).join('')}
      ${locked.map(() => `<div class="card locked"><b class="nm">Unknown blueprint</b><span class="tx">Search ruins or defeat tougher bots to find it.</span></div>`).join('')}</div>`;
  }

  function deckTab(s, atBase) {
    const st = AF.stats(s.parts), n = AF.deckCards(s).length;
    const sorted = s.cards.slice().sort((a, b) => (b.inDeck - a.inDeck) || a.id.localeCompare(b.id) || (b.plus - a.plus));
    const upOk = atBase && AF.canAfford(s.res, AF.CARD_UPGRADE_COST);
    return `<p class="hint"><b>${n}</b> cards in deck (min ${AF.DECK_MIN}, max ${AF.DECK_MAX}). Tap a card to move it in or out of your deck.
      ${atBase ? `Upgrade a card for ${AF.costHtml(AF.CARD_UPGRADE_COST, s.res)}` : 'Upgrades are done at the Home Forge.'}</p>
      <div class="grid">${sorted.map((c) => AF.cardHtml(AF.cardDef(c), { st, disabled: !c.inDeck, attrs: `data-toggle="${c.uid}" role="button" tabindex="0"`,
        footer: `<div class="cf"><span class="own">${c.inDeck ? 'In deck' : 'In storage'}</span>
          ${c.plus ? '' : `<button class="btn sm" data-cup="${c.uid}" ${upOk ? '' : 'disabled'}>Upgrade</button>`}</div>` })).join('')}</div>`;
  }

  // ---------- Actions ----------
  UI.handle = function (t) {
    const s = AF.game.state;
    const el = t.closest('[data-tab],[data-up],[data-forge],[data-toggle],[data-cup],[data-act]');
    if (!el) return false;
    if (el.dataset.tab) { UI.tab = el.dataset.tab; UI.render(); return true; }
    if (el.dataset.up) {
      const k = el.dataset.up, cost = AF.UPGRADE_COST[s.parts[k]];
      if (!AF.World.atBase(s) || !AF.canAfford(s.res, cost)) return true;
      AF.pay(s.res, cost); s.parts[k]++;
      if (k === 'frame') s.hp = AF.stats(s.parts).maxHp;
      AF.sfx('forge'); AF.game.toast(`${AF.PARTS[k].name} upgraded to ${AF.PARTS[k].tiers[s.parts[k] - 1]}.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.forge) {
      const id = el.dataset.forge, c = AF.CARDS[id];
      if (!AF.World.atBase(s) || !AF.canAfford(s.res, c.recipe)) return true;
      AF.pay(s.res, c.recipe);
      const card = AF.newCard(id);
      card.inDeck = AF.deckCards(s).length < AF.DECK_MAX;
      s.cards.push(card); s.stats.forged++;
      AF.sfx('forge'); AF.game.toast(`Forged ${c.name}.`);
      AF.game.persist(); UI.render(); return true;
    }
    if (el.dataset.cup) {
      const c = s.cards.find((x) => x.uid === el.dataset.cup);
      if (!c || c.plus || !AF.World.atBase(s) || !AF.canAfford(s.res, AF.CARD_UPGRADE_COST)) return true;
      AF.pay(s.res, AF.CARD_UPGRADE_COST); c.plus = true;
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
        <h3>Save code</h3>
        <p class="hint">Your game autosaves in this browser. Copy this code to move your save to another device.</p>
        <textarea id="savecode" readonly rows="3"></textarea>
        <div class="row"><button class="btn" data-act="copy">Copy code</button></div>
        <h3>Load a save code</h3>
        <textarea id="loadcode" rows="3" placeholder="Paste a save code"></textarea>
        <div class="row"><button class="btn" data-act="load">Load</button></div>
        <h3>New world</h3>
        <p class="hint">Starts over with a fresh map. Your current save is replaced.</p>
        <div class="row" id="newrow"><button class="btn danger" data-act="new-ask">Start a new world</button></div>
      </div>`;
    $('#savecode').value = AF.exportCode(AF.game.state);
  };

  UI.help = function () {
    const m = $('#menu');
    m.hidden = false;
    m.querySelector('.sheet').innerHTML = `
      <header class="ph"><h2>How to play</h2><button class="btn ghost x" data-act="close-menu">Close</button></header>
      <div class="pbody help">
        <p><b>Explore.</b> Move with WASD / arrow keys, the on-screen pad, or tap a direction on the map. Step on resource nodes to gather, step on ruins to find blueprints.</p>
        <p><b>Build.</b> Back at the Home Forge (the glowing building) you're fully repaired and can open the Workshop to upgrade robot parts and forge cards.</p>
        <p><b>Parts matter.</b> Arc Core = energy per turn. Frame = HP. Locomotion = which terrain you can cross (Treads for rubble, Hover Jets for water, Spider Legs for mountains). Arms = hand size and gathering. Weapon and Shield boost your attack and defend cards.</p>
        <p><b>Fight.</b> Touch an enemy to battle. Spend energy to play cards. Distance matters: Close, Mid, Far. Claw attacks need Close, blasters reach Mid, rail guns hit anywhere. Watch the enemy's next move and step out of reach to dodge it.</p>
        <p><b>Block</b> soaks damage and resets each turn. Your HP carries between fights, so head home to repair.</p>
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
    if (act === 'copy') {
      const ta = $('#savecode'); ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => AF.game.toast('Save code copied.'), () => AF.game.toast('Select the code and copy it.'));
      return true;
    }
    if (act === 'load') {
      const s = AF.importCode($('#loadcode').value);
      if (!s) { AF.game.toast("That code didn't work. Check it was copied fully."); return true; }
      AF.game.start(s); $('#menu').hidden = true; AF.game.toast('Save loaded.'); return true;
    }
    if (act === 'new-ask') {
      $('#newrow').innerHTML = '<span class="hint">Are you sure?</span><button class="btn danger" data-act="new-yes">Yes, new world</button><button class="btn" data-act="close-menu">Cancel</button>';
      return true;
    }
    if (act === 'new-yes') { AF.game.newWorld(); $('#menu').hidden = true; return true; }
    return false;
  };
})();
