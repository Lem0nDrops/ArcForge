/* Automata: ArcForge — your automaton's look and the Automaton Studio.
   Build options (chassis, head, eyes, antenna, paint, trim, decal) are cosmetic and unlock with pilot level.
   Part upgrades from the Garage change what it carries (wheels, arms, weapon, shield). */
(function () {
  const AF = (window.AF = window.AF || {});

  AF.BOT_PAINT = [['#f0905a', 'Copper'], ['#9ab4d0', 'Steel'], ['#5cc8d6', 'Teal'], ['#f2f4f8', 'Pearl'], ['#ffcf4a', 'Brass'], ['#e8584a', 'Cherry'],
    ['#6ac86a', 'Moss'], ['#4a7ce8', 'Cobalt'], ['#a070e0', 'Violet'], ['#ff8ac0', 'Bubblegum'], ['#4a4e5a', 'Gunmetal'], ['#c8a060', 'Bronze']];
  AF.BOT_OPTS = {
    chassis: [['round', 'Round', 1], ['boxy', 'Boxy', 1], ['tall', 'Tall', 3], ['bug', 'Beetle', 6]],
    head: [['dome', 'Dome', 1], ['square', 'Square', 1], ['crt', 'Monitor', 4], ['visor', 'Visor', 7]],
    eyes: [['round', 'Round', 1], ['happy', 'Happy', 1], ['visor', 'Bar', 1], ['pixel', 'Pixel', 1], ['angry', 'Fierce', 2], ['heart', 'Heart', 5]],
    antenna: [['ball', 'Bulb', 1], ['bolt', 'Bolt', 1], ['none', 'None', 1], ['dish', 'Dish', 4], ['horns', 'Horns', 8], ['propeller', 'Propeller', 10]],
    decal: [['none', 'None', 1], ['stripe', 'Stripe', 1], ['bolt', 'Lightning', 1], ['star', 'Star', 2], ['number', 'Number', 3], ['flame', 'Flames', 5]],
  };
  AF.BOT_NAMES = ['Sprocket', 'Bolt', 'Widget', 'Pistonette', 'Gizmo', 'Rivet', 'Tinker', 'Clank', 'Dynamo', 'Fuse', 'Cog', 'Nyx', 'Ember', 'Pixel'];
  AF.defaultBot = (con) => Object.assign({ name: 'Rivet', chassis: 'round', head: 'dome', eyes: 'round', antenna: 'ball', paint: 0, trim: 1, decal: 'none', num: 7, named: false },
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

  const S = (AF.Studio = { bot: null, state: null });
  function el() {
    let e = document.querySelector('#studio');
    if (!e) { e = document.createElement('section'); e.id = 'studio'; e.className = 'screen'; e.hidden = true; e.innerHTML = '<div class="cr studio"></div>'; document.body.appendChild(e); }
    return e;
  }
  S.isOpen = () => !el().hidden;
  S.open = function (state, opts) {
    opts = opts || {};
    S.state = state; S.first = !!opts.first; S.onDone = opts.onDone; S.pick = !state.construct; S.con = state.construct || null;
    S.bot = Object.assign(AF.defaultBot(state.construct), state.bot || {});
    el().hidden = false; S.render();
  };
  S.close = function () { el().hidden = true; };
  S.render = function () {
    const s = S.state, b = S.bot, lvl = s.level || 1;
    const row = (k, title) => `<section><h3>${title}</h3><div class="opts">${AF.BOT_OPTS[k].map(([v, n, need]) => {
      const lock = lvl < need;
      return `<button class="opt${b[k] === v ? ' on' : ''}${lock ? ' lock' : ''}" ${lock ? 'disabled' : ''} data-bot="${k}" data-v="${v}" title="${lock ? 'Unlocks at pilot level ' + need : n}">${n}${lock ? ` <small>Lv${need}</small>` : ''}</button>`;
    }).join('')}</div></section>`;
    const pal = (k) => AF.BOT_PAINT.map(([c, n], i) => `<button class="sw${b[k] === i ? ' on' : ''}" data-bot="${k}" data-i="${i}" style="--c:${c}" title="${n}" aria-label="${n}"></button>`).join('');
    el().querySelector('.cr').innerHTML = `
      <div class="cr-side">
        <h2>${S.pick ? 'Choose your Construct' : S.first ? 'Name your automaton' : 'Automaton Studio'}</h2>
        <div class="cr-stage bot-stage"><div class="bot-pre">${AF.robotSVG(s.parts, { core: AF.coreColor(s.look), bot: Object.assign({}, b, { construct: S.con }) })}</div></div>
        <label class="fld">Name<input id="bot-name" maxlength="14" value="${AF.esc(b.name)}" autocomplete="off"></label>
        <div class="row"><button class="btn" data-bot-act="randname">Random name</button><button class="btn" data-bot-act="random">Surprise me</button></div>
        <div class="row">${S.first || S.pick ? '' : '<button class="btn ghost" data-bot-act="cancel">Cancel</button>'}<button class="btn primary" data-bot-act="done">${S.first ? "Let's go!" : 'Save'}</button></div>
      </div>
      <div class="cr-opts">
        <p class="hint">Style is free to change any time. More shapes unlock as your pilot levels up. Garage upgrades add wheels, arms, weapons and shields.</p>
        ${S.pick ? `<section><h3>Choose a Construct</h3><p class="hint">Automata now come in three Constructs. Your automaton gets a fresh 30-card deck built for its type. Cards it can't use are traded in for Bolts.</p>${AF.constructPicker(S.con, AF.coreColor(s.look))}</section>` : `<p class="con-badge"><b>${AF.CONSTRUCTS[s.construct].name}</b> · ${AF.CONSTRUCTS[s.construct].passive}</p>`}
        ${row('chassis', 'Chassis')}${row('head', 'Head')}${row('eyes', 'Eyes')}${row('antenna', 'Antenna')}
        <section><h3>Paint</h3><div class="swatches">${pal('paint')}</div></section>
        <section><h3>Trim</h3><div class="swatches">${pal('trim')}</div></section>
        ${row('decal', 'Decal')}
        ${b.decal === 'number' ? `<label class="fld">Number<input id="bot-num" type="number" min="0" max="99" value="${b.num}"></label>` : ''}
        <section><h3>Core glow</h3><div class="swatches">${AF.LOOK.core.map(([c, n], i) => `<button class="sw${s.look.core === i ? ' on' : ''}" data-bot="core" data-i="${i}" style="--c:${c}" title="${n}"></button>`).join('')}</div></section>
      </div>`;
  };
  S.handle = function (t) {
    const e = t.closest('[data-bot],[data-bot-act],[data-construct]'); if (!e) return false;
    const nm = document.querySelector('#bot-name'); if (nm) S.bot.name = nm.value;
    const num = document.querySelector('#bot-num'); if (num) S.bot.num = Math.max(0, Math.min(99, +num.value || 0));
    const b = S.bot, lvl = S.state.level || 1;
    if (e.dataset.construct) { S.con = e.dataset.construct; const d = AF.defaultBot(S.con); Object.assign(b, { chassis: d.chassis, head: d.head, eyes: d.eyes, antenna: d.antenna, construct: S.con }); AF.sfx('card'); S.render(); return true; }
    if (e.dataset.bot === 'core') { S.state.look.core = +e.dataset.i; }
    else if (e.dataset.bot) b[e.dataset.bot] = e.dataset.i != null ? +e.dataset.i : e.dataset.v;
    const act = e.dataset.botAct;
    if (act === 'randname') b.name = AF.BOT_NAMES[Math.floor(Math.random() * AF.BOT_NAMES.length)];
    if (act === 'random') {
      const pick = (k) => { const ok = AF.BOT_OPTS[k].filter((o) => o[2] <= lvl); return ok[Math.floor(Math.random() * ok.length)][0]; };
      ['chassis', 'head', 'eyes', 'antenna', 'decal'].forEach((k) => (b[k] = pick(k)));
      b.paint = Math.floor(Math.random() * AF.BOT_PAINT.length); b.trim = Math.floor(Math.random() * AF.BOT_PAINT.length);
    }
    if (act === 'cancel') { S.close(); return true; }
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
