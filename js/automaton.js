/* Automata: ArcForge — your automaton's look and the Automaton Studio.
   Build options (chassis, head, eyes, antenna, paint, trim, decal) are cosmetic and unlock with pilot level.
   Part upgrades from the Garage change what it carries (wheels, arms, weapon, shield). */
(function () {
  const AF = (window.AF = window.AF || {});

  AF.BOT_PAINT = [['#f0905a', 'Copper'], ['#9ab4d0', 'Steel'], ['#5cc8d6', 'Teal'], ['#f2f4f8', 'Pearl'], ['#ffcf4a', 'Brass'], ['#e8584a', 'Cherry'],
    ['#6ac86a', 'Moss'], ['#4a7ce8', 'Cobalt'], ['#a070e0', 'Violet'], ['#ff8ac0', 'Bubblegum'], ['#4a4e5a', 'Gunmetal'], ['#c8a060', 'Bronze']];
  // Every option is open from the start: the automaton is yours to style.
  AF.BOT_OPTS = {
    chassis: [['round', 'Round'], ['boxy', 'Boxy'], ['tall', 'Tall'], ['bug', 'Beetle'], ['barrel', 'Barrel'], ['kite', 'Kite'], ['furnace', 'Furnace']],
    head: [['dome', 'Dome'], ['square', 'Square'], ['crt', 'Monitor'], ['visor', 'Visor'], ['helm', 'Great helm'], ['lantern', 'Lantern'], ['bucket', 'Bucket'], ['skull', 'Skull']],
    eyes: [['round', 'Round'], ['happy', 'Happy'], ['visor', 'Bar'], ['pixel', 'Pixel'], ['angry', 'Fierce'], ['heart', 'Heart'], ['lens', 'Cyclops'], ['slit', 'Slit'], ['gear', 'Gear'], ['sleepy', 'Sleepy'], ['cross', 'Cross']],
    mouth: [['smile', 'Smile'], ['flat', 'Flat'], ['grill', 'Grill'], ['fangs', 'Fangs'], ['stache', 'Mustache'], ['none', 'None']],
    antenna: [['ball', 'Bulb'], ['bolt', 'Bolt'], ['none', 'None'], ['dish', 'Dish'], ['horns', 'Horns'], ['propeller', 'Propeller'], ['plume', 'Plume'], ['chimney', 'Chimney'], ['crown', 'Crown'], ['twin', 'Twin bulbs']],
    shoulders: [['none', 'None'], ['pauldrons', 'Pauldrons'], ['spikes', 'Spikes'], ['bolts', 'Bolt plates'], ['lamps', 'Lamps']],
    back: [['none', 'None'], ['boiler', 'Boiler'], ['exhaust', 'Exhaust pipes'], ['banner', 'Banner'], ['cog', 'Big cog'], ['wings', 'Wings'], ['gears', 'Gears']],
    limbs: [['cable', 'Cable'], ['piston', 'Piston'], ['plated', 'Plated'], ['chain', 'Chain']],
    finish: [['clean', 'Clean'], ['polished', 'Polished'], ['matte', 'Matte'], ['worn', 'Worn'], ['rusty', 'Rusty']],
    decal: [['none', 'None'], ['stripe', 'Stripe'], ['bolt', 'Lightning'], ['star', 'Star'], ['number', 'Number'], ['flame', 'Flames'], ['gear', 'Gear'], ['checker', 'Checker'], ['crest', 'Crest'], ['skull', 'Skull']],
  };
  AF.BOT_PARTS = [['chassis', 'Chassis'], ['head', 'Head'], ['eyes', 'Eyes'], ['mouth', 'Mouth'], ['antenna', 'Topper'], ['shoulders', 'Shoulders'], ['back', 'Back'], ['limbs', 'Arms & legs'], ['finish', 'Finish'], ['decal', 'Decal']];
  AF.BOT_COLORS = [['paint', 'Body paint'], ['trim', 'Trim'], ['accent', 'Metal']];
  const hexOf = (v, d) => (typeof v === 'string' && v[0] === '#' ? v : AF.BOT_PAINT[((v == null ? d : v) % AF.BOT_PAINT.length + AF.BOT_PAINT.length) % AF.BOT_PAINT.length][0]);
  AF.botHex = (b, k) => hexOf(b[k], { paint: 0, trim: 1, accent: 10 }[k]);
  AF.BOT_NAMES = ['Sprocket', 'Bolt', 'Widget', 'Pistonette', 'Gizmo', 'Rivet', 'Tinker', 'Clank', 'Dynamo', 'Fuse', 'Cog', 'Nyx', 'Ember', 'Pixel'];
  AF.defaultBot = (con) => Object.assign({ name: 'Rivet', chassis: 'round', head: 'dome', eyes: 'round', mouth: 'smile', antenna: 'ball', shoulders: 'none', back: 'none', limbs: 'cable', finish: 'clean', paint: 0, trim: 1, accent: 10, decal: 'none', num: 7, named: false },
    (AF.CONSTRUCTS[con] && AF.CONSTRUCTS[con].bot) || {}, { construct: con || null });
  AF.botName = (s) => (s.bot && s.bot.name) || 'Rivet';

  // Construct picker (used by the character creator and by older saves).
  const bars = (n) => `<span class="pips3">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  AF.constructPicker = function (sel, core) {
    return `<div class="cons">${Object.entries(AF.CONSTRUCTS).map(([k, C]) => `
      <button class="con${sel === k ? ' on' : ''}" data-construct="${k}">
        <span class="con-pic">${AF.robotSVG({ arc: 2, frame: 2, legs: k === 'bulwark' ? 2 : 1, arms: 2, weapon: 2, shield: k === 'bulwark' ? 3 : 1 }, { core: core || '#3ad0ff', bot: AF.defaultBot(k) })}</span>
        <b>${C.name}</b><small>${C.tag}</small>
        <span class="con-stats"><span>HP</span>${bars(C.hp)}<span>Speed</span>${bars(C.spd)}<span>Range</span>${bars(C.rng)}</span>
        <em>${C.text}</em>
      </button>`).join('')}</div>
      ${sel ? `<p class="con-passive"><b>${AF.CONSTRUCTS[sel].short} passive:</b> ${AF.CONSTRUCTS[sel].passive}</p>` : ''}`;
  };

  // ---------- Shared automaton editor (character creator + Garage Studio) ----------
  // Shapes are buttons; every colour is a free colour picker with a few quick swatches beside it.
  AF.botEditorHTML = function (b, look) {
    const row = ([k, title]) => `<div class="bot-row"><h4>${title}</h4><div class="opts">${AF.BOT_OPTS[k].map(([v, n]) => `<button class="opt${(b[k] || AF.BOT_OPTS[k][0][0]) === v ? ' on' : ''}" data-bot="${k}" data-v="${v}">${n}</button>`).join('')}</div></div>`;
    const color = ([k, title]) => `<label class="pick"><span>${title}</span><input type="color" data-botcol="${k}" value="${AF.botHex(b, k)}"><span class="quick">${AF.BOT_PAINT.map(([c, n], i) => `<button class="sw mini" data-bot="${k}" data-hex="${c}" style="--c:${c}" title="${n}" aria-label="${title}: ${n}"></button>`).join('')}</span></label>`;
    return `<section><h3>Colours</h3><div class="picks">${AF.BOT_COLORS.map(color).join('')}
        <label class="pick"><span>Core glow</span><input type="color" data-botcol="core" value="${AF.coreColor(look)}"><span class="quick">${AF.LOOK.core.map(([c, n]) => `<button class="sw mini" data-bot="core" data-hex="${c}" style="--c:${c}" title="${n}" aria-label="Core glow: ${n}"></button>`).join('')}</span></label></div>
        <p class="hint">The core glow lights your automaton's eyes, core and magic. It's shared with your pilot's gear.</p></section>
      <section><h3>Shape</h3>${AF.BOT_PARTS.slice(0, 5).map(row).join('')}</section>
      <section><h3>Gear &amp; finish</h3>${AF.BOT_PARTS.slice(5).map(row).join('')}
        ${b.decal === 'number' ? `<label class="fld">Number<input id="bot-num" data-botnum type="number" min="0" max="99" value="${b.num}"></label>` : ''}</section>`;
  };
  AF.randomBot = function (b) {
    const any = (k) => { const o = AF.BOT_OPTS[k]; return o[Math.floor(Math.random() * o.length)][0]; };
    AF.BOT_PARTS.forEach(([k]) => (b[k] = any(k)));
    if (Math.random() < 0.5) { b.shoulders = 'none'; } if (Math.random() < 0.5) { b.back = 'none'; } if (Math.random() < 0.6) b.finish = 'clean';
    const hsl = (h, sa, l) => { sa /= 100; l /= 100; const f = (n) => { const k = (n + h / 30) % 12, c = l - sa * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); };
    const h = Math.random() * 360;
    b.paint = hsl(h, 18 + Math.random() * 30, 32 + Math.random() * 20); b.trim = Math.random() < 0.5 ? hsl(38 + Math.random() * 12, 45 + Math.random() * 20, 42 + Math.random() * 12) : hsl((h + 150 + Math.random() * 60) % 360, 20 + Math.random() * 30, 38 + Math.random() * 18); b.accent = hsl(h, 6, 20 + Math.random() * 16);
    b.num = Math.floor(Math.random() * 100);
    return b;
  };
  // Click on an editor control. Returns true when it changed something.
  AF.botEditorClick = function (b, look, e) {
    if (!e || !e.dataset.bot) return false;
    const k = e.dataset.bot;
    if (k === 'core') look.core = e.dataset.hex;
    else b[k] = e.dataset.hex || e.dataset.v;
    return true;
  };
  // Live colour picker / number input (no re-render, so dragging stays smooth).
  AF.botEditorInput = function (b, look, e) {
    if (e.dataset.botcol) { if (e.dataset.botcol === 'core') look.core = e.value; else b[e.dataset.botcol] = e.value; return true; }
    if (e.dataset.botnum != null) { b.num = Math.max(0, Math.min(99, +e.value || 0)); return true; }
    return false;
  };

  const S = (AF.Studio = { bot: null, state: null });
  function el() {
    let e = document.querySelector('#studio');
    if (!e) {
      e = document.createElement('section'); e.id = 'studio'; e.className = 'screen'; e.hidden = true; e.innerHTML = '<div class="cr studio"></div>'; document.body.appendChild(e);
      e.addEventListener('input', (ev) => { if (S.bot && AF.botEditorInput(S.bot, S.state.look, ev.target)) S.preview(); });
    }
    return e;
  }
  S.isOpen = () => !el().hidden;
  S.open = function (state, opts) {
    opts = opts || {};
    S.state = state; S.first = !!opts.first; S.onDone = opts.onDone; S.pick = !state.construct; S.con = state.construct || null;
    S.bot = Object.assign(AF.defaultBot(state.construct), state.bot || {});
    S.core0 = state.look.core;
    el().hidden = false; S.render();
  };
  S.close = function () { if (document.activeElement && el().contains(document.activeElement)) document.activeElement.blur(); el().hidden = true; };
  S.preview = function () { const p = el().querySelector('.bot-pre'); if (p) p.innerHTML = AF.robotSVG(S.state.parts, { core: AF.coreColor(S.state.look), bot: Object.assign({}, S.bot, { construct: S.con }) }); };
  S.render = function () {
    const s = S.state, b = S.bot;
    el().querySelector('.cr').innerHTML = `
      <div class="cr-side">
        <h2>${S.pick ? 'Choose your Construct' : S.first ? 'Name your automaton' : 'Automaton Studio'}</h2>
        <div class="cr-stage bot-stage"><div class="bot-pre"></div></div>
        <label class="fld">Name<input id="bot-name" maxlength="14" value="${AF.esc(b.name)}" autocomplete="off"></label>
        <div class="row"><button class="btn" data-bot-act="randname">Random name</button><button class="btn" data-bot-act="random">Randomize</button></div>
        <div class="row">${S.first || S.pick ? '' : '<button class="btn ghost" data-bot-act="cancel">Cancel</button>'}<button class="btn primary" data-bot-act="done">${S.first ? "Let's go!" : 'Save'}</button></div>
      </div>
      <div class="cr-opts">
        <p class="hint">Style is free to change any time. Garage upgrades add wheels, arms, weapons and shields.</p>
        ${S.pick ? `<section><h3>Choose a Construct</h3><p class="hint">Automata now come in three Constructs. Your automaton gets a fresh 30-card deck built for its type. Cards it can't use are traded in for Bolts.</p>${AF.constructPicker(S.con, AF.coreColor(s.look))}</section>` : `<p class="con-badge"><b>${AF.CONSTRUCTS[s.construct].name}</b> · ${AF.CONSTRUCTS[s.construct].passive}</p>`}
        ${AF.botEditorHTML(b, s.look)}
      </div>`;
    S.preview();
  };
  S.handle = function (t) {
    const e = t.closest('[data-bot],[data-bot-act],[data-construct]'); if (!e) return false;
    const nm = document.querySelector('#bot-name'); if (nm) S.bot.name = nm.value;
    const b = S.bot;
    if (e.dataset.construct) { S.con = e.dataset.construct; const d = AF.defaultBot(S.con); Object.assign(b, { chassis: d.chassis, head: d.head, eyes: d.eyes, antenna: d.antenna, construct: S.con }); AF.sfx('card'); S.render(); return true; }
    AF.botEditorClick(b, S.state.look, e);
    const act = e.dataset.botAct;
    if (act === 'randname') b.name = AF.BOT_NAMES[Math.floor(Math.random() * AF.BOT_NAMES.length)];
    if (act === 'random') AF.randomBot(b);
    if (act === 'cancel') { S.state.look.core = S.core0; S.close(); return true; }
    if (act === 'done') {
      if (S.pick && !S.con) { AF.game.toast('Pick a Construct first.'); return true; }
      if (S.pick) { const refund = AF.setConstruct(S.state, S.con); b.construct = S.con; S.pick = false; if (refund) AF.game.toast(`Old cards for other Constructs traded in for ${AF.moneyText(refund)}.`, 5000); }
      b.name = (b.name || '').trim().slice(0, 14) || 'Sprocket'; b.named = true;
      S.state.bot = b; S.close(); AF.sfx('forge');
      AF.game.persist(); AF.game.refresh(); if (AF.UI.isOpen()) AF.UI.render(); S.onDone && S.onDone();
      return true;
    }
    AF.sfx('card'); S.render();
    return true;
  };
})();
