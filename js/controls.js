/* Automata: ArcForge — control settings.
   Keyboard: every action can be rebound (two keys each). Touch: pick a floating joystick, a d-pad, or
   tap-to-walk; set the size, which hand the buttons sit under, and how the run button works.
   Saved per device. The game asks AF.Controls.actionOf(key) instead of hard-coding keys. */
(function () {
  const AF = (window.AF = window.AF || {});
  const KEY = 'arcforge.controls';
  const ACTIONS = [
    ['up', 'Move up', ['ArrowUp', 'w']], ['down', 'Move down', ['ArrowDown', 's']], ['left', 'Move left', ['ArrowLeft', 'a']], ['right', 'Move right', ['ArrowRight', 'd']],
    ['interact', 'Interact / talk / end turn', ['e', 'z']], ['run', 'Run (hold)', ['Shift', '']],
    ['deck', 'Party & deck', ['q', 'Tab']], ['pilot', 'Pilot', ['i', '']], ['wardrobe', 'Wardrobe', ['o', '']], ['map', 'Map', ['m', '']],
    ['lure', 'Use a lure', ['l', '']], ['ration', 'Eat a ration', ['r', '']],
  ];
  const DEF_TOUCH = { scheme: 'stick', size: 'm', hand: 'right', run: 'hold', autoRun: true, show: 'auto', opacity: 0.85 };
  const C = (AF.Controls = { ACTIONS, keys: {}, touch: Object.assign({}, DEF_TOUCH) });
  const norm = (k) => (k && k.length === 1 ? k.toLowerCase() : k || '');
  function defaults() { const o = {}; ACTIONS.forEach(([id, , k]) => (o[id] = k.slice())); return o; }
  C.load = function () {
    C.keys = defaults(); C.touch = Object.assign({}, DEF_TOUCH);
    try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); if (o.keys) Object.keys(C.keys).forEach((k) => { if (Array.isArray(o.keys[k])) C.keys[k] = o.keys[k].slice(0, 2); }); if (o.touch) Object.assign(C.touch, o.touch); } catch (e) {}
    C.apply();
  };
  C.save = function () { try { localStorage.setItem(KEY, JSON.stringify({ keys: C.keys, touch: C.touch })); } catch (e) {} C.apply(); };
  // Enter and Space always interact too, so menus and dialogs stay usable whatever is rebound.
  C.actionOf = function (key) {
    const k = norm(key);
    for (const [id] of ACTIONS) if (C.keys[id].some((b) => b && norm(b) === k)) return id;
    if (key === 'Enter' || key === ' ') return 'interact';
    return null;
  };
  C.keyLabel = (k) => ({ ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc' }[k] || (k && k.length === 1 ? k.toUpperCase() : k) || '—');
  C.isTouchUI = () => C.touch.show === 'always' || (C.touch.show === 'auto' && (matchMedia('(hover: none), (pointer: coarse)').matches || AF.input && AF.input.touch));
  C.apply = function () {
    const b = document.body; if (!b) return;
    ['stick', 'dpad', 'tap'].forEach((s) => b.classList.toggle('ctl-' + s, C.touch.scheme === s));
    b.classList.toggle('ctl-lefty', C.touch.hand === 'left');
    b.classList.toggle('ctl-hide', C.touch.show === 'never');
    b.classList.toggle('ctl-always', C.touch.show === 'always');
    b.style.setProperty('--ctl-scale', { s: 0.82, m: 1, l: 1.2, xl: 1.4 }[C.touch.size] || 1);
    b.style.setProperty('--ctl-alpha', C.touch.opacity);
  };

  // ---------- settings screen ----------
  let waiting = null; // [action, slot] while we listen for a new key
  C.render = function (fromTitle) {
    const m = document.querySelector('#menu'); m.hidden = false; C.fromTitle = fromTitle;
    const T = C.touch, opt = (k, v, label) => `<button class="seg${T[k] === v ? ' on' : ''}" data-ctl-set="${k}" data-v="${v}">${label}</button>`;
    m.querySelector('.sheet').innerHTML = `
      <header class="ph"><h2>Controls</h2><button class="btn ghost x" data-ctl="close">Close</button></header>
      <div class="pbody ctlset">
        <h3>Phone &amp; tablet</h3>
        <div class="ctl-row"><span>Move with</span><div class="segs">${opt('scheme', 'stick', 'Joystick')}${opt('scheme', 'dpad', 'D-pad')}${opt('scheme', 'tap', 'Tap to walk')}</div></div>
        <p class="hint">${T.scheme === 'stick' ? 'Touch anywhere on the left of the screen and drag. The stick appears under your thumb.' : T.scheme === 'dpad' ? 'A fixed four-way pad in the corner.' : 'Tap a spot to walk there. Tap next to someone to talk. You can still drag to steer.'}</p>
        <div class="ctl-row"><span>Button size</span><div class="segs">${opt('size', 's', 'Small')}${opt('size', 'm', 'Medium')}${opt('size', 'l', 'Large')}${opt('size', 'xl', 'Huge')}</div></div>
        <div class="ctl-row"><span>Buttons on the</span><div class="segs">${opt('hand', 'right', 'Right')}${opt('hand', 'left', 'Left')}</div></div>
        <div class="ctl-row"><span>Run button</span><div class="segs">${opt('run', 'hold', 'Hold')}${opt('run', 'toggle', 'Toggle')}</div></div>
        <div class="ctl-row"><span>Run when the stick is pushed all the way</span><div class="segs">${opt('autoRun', true, 'On')}${opt('autoRun', false, 'Off')}</div></div>
        <div class="ctl-row"><span>Show on-screen controls</span><div class="segs">${opt('show', 'auto', 'On touch screens')}${opt('show', 'always', 'Always')}${opt('show', 'never', 'Never')}</div></div>
        <label class="slider"><span>Control opacity <b>${Math.round(T.opacity * 100)}%</b></span><input type="range" min="30" max="100" step="5" value="${Math.round(T.opacity * 100)}" data-ctl-opacity="1" aria-label="Control opacity"></label>
        <h3>Keyboard</h3>
        <p class="hint">Click a key to change it, then press the new key. Esc cancels. Enter and Space always interact as well.</p>
        <div class="keymap">${ACTIONS.map(([id, label]) => `<div class="km"><span>${label}</span>${[0, 1].map((i) => `<button class="kb${waiting && waiting[0] === id && waiting[1] === i ? ' wait' : ''}" data-bind="${id}" data-i="${i}">${waiting && waiting[0] === id && waiting[1] === i ? 'Press a key…' : AF.esc(C.keyLabel(C.keys[id][i]))}</button>`).join('')}</div>`).join('')}</div>
        <div class="row"><button class="btn" data-ctl="reset-keys">Reset keys</button><button class="btn" data-ctl="reset-touch">Reset touch</button></div>
        <p class="hint">In battle: number keys 1–9 play cards.</p>
      </div>`;
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ctl],[data-ctl-set],[data-bind]'); if (!t) return;
    e.stopPropagation();
    if (t.dataset.ctl === 'close') { waiting = null; document.querySelector('#menu').hidden = true; if (!C.fromTitle && AF.game && AF.game.state) AF.UI.menu(); return; }
    if (t.dataset.ctl === 'reset-keys') { C.keys = defaults(); waiting = null; }
    if (t.dataset.ctl === 'reset-touch') C.touch = Object.assign({}, DEF_TOUCH);
    if (t.dataset.ctlSet) { const k = t.dataset.ctlSet, v = t.dataset.v; C.touch[k] = v === 'true' ? true : v === 'false' ? false : v; }
    if (t.dataset.bind) waiting = waiting && waiting[0] === t.dataset.bind && waiting[1] === +t.dataset.i ? null : [t.dataset.bind, +t.dataset.i];
    AF.sfx && AF.sfx('click'); C.save(); C.render(C.fromTitle);
  }, true);
  document.addEventListener('input', (e) => { if (!e.target.dataset.ctlOpacity) return; C.touch.opacity = +e.target.value / 100; C.save(); const b = e.target.parentElement.querySelector('b'); if (b) b.textContent = e.target.value + '%'; });
  window.addEventListener('keydown', (e) => {
    if (!waiting) return;
    e.preventDefault(); e.stopPropagation();
    const [id, i] = waiting; waiting = null;
    if (e.key !== 'Escape') {
      // a key can only do one thing: take it off any other action first
      Object.keys(C.keys).forEach((a) => (C.keys[a] = C.keys[a].map((k) => (norm(k) === norm(e.key) ? '' : k))));
      C.keys[id][i] = e.key === 'Backspace' || e.key === 'Delete' ? '' : e.key;
      C.save();
    }
    C.render(C.fromTitle);
  }, true);
  C.waiting = () => !!waiting;

  // ---------- floating joystick ----------
  C.stick = { on: false };
  C.stickStart = function (e, root) {
    const el = document.querySelector('#stick'); if (!el) return;
    const r = root.getBoundingClientRect();
    C.stick = { on: true, id: e.pointerId, x: e.clientX, y: e.clientY, r: 56 * (parseFloat(getComputedStyle(document.body).getPropertyValue('--ctl-scale')) || 1) };
    el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px'; el.hidden = false;
    el.querySelector('i').style.transform = 'translate(-50%,-50%)';
  };
  C.stickMove = function (e) {
    const s = C.stick; if (!s.on || e.pointerId !== s.id) return null;
    let dx = e.clientX - s.x, dy = e.clientY - s.y; const d = Math.hypot(dx, dy);
    const k = d > s.r ? s.r / d : 1; dx *= k; dy *= k;
    const knob = document.querySelector('#stick i'); if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    return { dx, dy, d, full: d >= s.r * 0.92 };
  };
  C.stickEnd = function (e) { if (!C.stick.on || (e && e.pointerId !== C.stick.id)) return false; C.stick.on = false; const el = document.querySelector('#stick'); if (el) el.hidden = true; return true; };

  C.load();
  document.addEventListener('DOMContentLoaded', C.apply);
})();
