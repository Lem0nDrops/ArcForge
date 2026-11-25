/* ArcForge — boot, title & save slots, input, smooth movement, game loop. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);
  try { AF.muted = localStorage.getItem('arcforge.muted') === '1'; } catch (e) {}

  const game = (AF.game = { state: null, battle: null });
  const input = (AF.input = { held: [], run: false, touch: false, nextStep: 0 });
  const WALK = 190, RUN = 115;

  game.persist = () => game.state && AF.save(game.state);

  game.start = function (state) {
    if (!state.world) state.world = AF.World.init();
    game.state = state; game.battle = null;
    ['#title', '#battle', '#result', '#creator'].forEach((s) => ($(s).hidden = true));
    $('#game').hidden = false;
    AF.Render.snap();
    game.persist(); game.refresh();
    if (!state.flags.intro) setTimeout(() => AF.Quests.intro(state), 500);
  };

  game.toTitle = function () {
    game.persist();
    game.state = null; game.battle = null;
    ['#game', '#battle', '#result', '#panel', '#menu'].forEach((s) => ($(s).hidden = true));
    $('#title').hidden = false;
    renderSlots();
  };

  let toastTimer = 0;
  game.toast = function (text, ms) {
    const t = $('#toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 3800);
  };

  game.refresh = function () {
    const s = game.state; if (!s) return;
    const st = AF.stats(s.parts), maxV = AF.pilotMaxVit(s);
    $('#hp').hidden = !s.flags.robot;
    $('#tracker').innerHTML = AF.Quests.tracker(s);
    $('#tracker').hidden = !$('#tracker').innerHTML;
    $('#hp i').style.width = Math.round((s.hp / st.maxHp) * 100) + '%';
    $('#hp span').textContent = `Robot ${s.hp} / ${st.maxHp}`;
    $('#vit i').style.width = Math.round((s.pilot.vit / maxV) * 100) + '%';
    $('#vit span').textContent = `${s.look.name} ${s.pilot.vit} / ${maxV}`;
    $('#vit').classList.toggle('low', s.pilot.vit <= 5);
    $('#where').textContent = AF.World.describeHere(s);
    $('#hudres').innerHTML = AF.UI.resBar(s);
    $('#ration-btn').textContent = `Eat ration (${s.pilot.rations})`;
    const buffs = Object.entries(s.pilot.buffs).map(([k, n]) => {
      const f = AF.Town.FOOD.buffs.find((x) => x.id === k);
      return f ? `<span>${f.name} · ${n}</span>` : '';
    }).join('');
    $('#hudbuffs').innerHTML = buffs + (s.pilot.vit <= 0 ? '<span class="bad">Exhausted</span>' : '');
  };

  const canAct = () => game.state && !game.battle && !AF.UI.isOpen() && $('#menu').hidden && $('#creator').hidden && !AF.Dialog.open && !$('#game').hidden;

  // ---------- Movement (one tile at a time, chained smoothly while a direction is held) ----------
  const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function step(dir, now) {
    const [dx, dy] = VEC[dir], s = game.state;
    const dur = input.run ? RUN : WALK;
    AF.Render.stepDur = dur;
    const ev = AF.World.move(s, dx, dy);
    if (ev && (ev.type === 'bump' || ev.type === 'blocked')) {
      if (ev.text && now - (input.lastBlockMsg || 0) > 1500) { game.toast(ev.text); input.lastBlockMsg = now; AF.sfx('bump'); }
      input.nextStep = now + 120;
      return;
    }
    input.nextStep = now + dur;
    if (ev && ev.type === 'talk') { input.held = []; AF.Quests.talk(s, ev.npc); }
    if (ev && ev.type === 'msg') game.toast(ev.text);
    if (ev && ev.type === 'battle') { input.held = []; setTimeout(() => game.startBattle(ev.enemy, ev.ambush), Math.max(60, dur - 40)); }
    game.persist(); game.refresh();
  }

  // ---------- Interact (E / Space / Enter / A button) ----------
  game.interact = function () {
    if (!canAct()) return;
    const s = game.state, ev = AF.World.interact(s);
    if (!ev) return;
    AF.sfx('card');
    if (ev.type === 'door') { if (AF.SHOPS.includes(ev.id)) AF.UI.open(null, ev.id); else AF.Quests.door(s, ev.id); }
    else if (ev.type === 'talk') AF.Quests.talk(s, ev.npc);
    else if (ev.type === 'sign') AF.Dialog.show([{ text: ev.text }]);
    else if (ev.type === 'msg') game.toast(ev.text);
    input.held = [];
    game.persist(); game.refresh();
  };

  // ---------- Battle ----------
  game.startBattle = function (enemyRef, ambush) {
    if (game.battle) return;
    game.battle = new AF.Battle(game.state, enemyRef, { ambush });
    $('#battle').hidden = false;
    $('#battle').classList.remove('enter'); void $('#battle').offsetWidth; $('#battle').classList.add('enter');
    AF.BattleUI.start($('#battle .bt'), game.battle, (b, out) => {
      game.persist();
      $('#result .sheet').innerHTML = AF.BattleUI.result(b, out);
      $('#result').hidden = false;
    });
  };
  function closeResult() {
    $('#result').hidden = true; $('#battle').hidden = true;
    game.battle = null; AF.Render.snap(); game.refresh();
  }

  // ---------- Title & save slots ----------
  function renderSlots() {
    const slots = AF.listSlots();
    $('#slots').innerHTML = slots.map((s, i) => {
      const n = i + 1;
      if (!s) return `<div class="slot-card empty"><span class="slot-n">Slot ${n}</span><p class="muted">Empty</p>
        <button class="btn primary" data-slot-new="${n}">New pilot</button></div>`;
      const lv = AF.PART_KEYS.reduce((a, k) => a + s.parts[k], 0);
      const when = s.saved ? new Date(s.saved).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      return `<div class="slot-card"><span class="slot-n">Slot ${n}</span>
        <canvas class="slot-pic" data-pic="${n}" width="144" height="208"></canvas>
        <b class="slot-name">${AF.esc(s.look.name)}</b>
        <span class="muted">${s.stats.wins} wins · parts ${lv}/30${s.won ? ' · Titan beaten' : ''}${when ? ' · ' + when : ''}</span>
        <div class="row" id="slot-row-${n}"><button class="btn primary" data-slot-play="${n}">Play</button>
          <button class="btn ghost" data-slot-del="${n}">Delete</button></div></div>`;
    }).join('');
    slots.forEach((s, i) => {
      const c = document.querySelector(`[data-pic="${i + 1}"]`);
      if (s && c) AF.drawPilot(c.getContext('2d'), 0, 4, 200, s.look, 0);
    });
  }
  function newPilot(n) {
    $('#title').hidden = true;
    AF.Creator.open({ mode: 'new', onDone: (look) => game.start(AF.newGame(look, n)), onCancel: () => { $('#title').hidden = false; renderSlots(); } });
  }

  // ---------- Keyboard ----------
  const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  const ACT = ['e', 'E', ' ', 'Enter', 'z', 'Z'];
  document.addEventListener('keydown', (e) => {
    input.touch = false;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'Shift') input.run = true;
    if (AF.Dialog.open) {
      if (e.target.matches && e.target.matches('[data-choice]') && (e.key === 'Enter' || e.key === ' ')) return;
      if (ACT.includes(e.key)) { e.preventDefault(); if (!e.repeat) AF.Dialog.advance(); }
      return;
    }
    if (e.key === 'Escape') { if (!$('#menu').hidden) $('#menu').hidden = true; else if (AF.UI.isOpen()) AF.UI.close(); return; }
    if (!$('#result').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); closeResult(); return; }
    if (game.battle) {
      if (/^[1-9]$/.test(e.key)) { AF.BattleUI.play(+e.key - 1); return; }
      if (['e', 'E', ' '].includes(e.key) && !e.repeat) { e.preventDefault(); AF.BattleUI.endTurn(); }
      return;
    }
    if (!game.state || $('#game').hidden) return;
    const dir = KEYDIR[e.key];
    if (dir) { e.preventDefault(); if (!input.held.includes(dir)) input.held.push(dir); return; }
    if (ACT.includes(e.key) && !e.repeat && !AF.UI.isOpen() && $('#menu').hidden) { e.preventDefault(); game.interact(); return; }
    if ((e.key === 'q' || e.key === 'Q' || e.key === 'Tab') && !AF.UI.isOpen()) { e.preventDefault(); AF.UI.open('deck'); }
    if (e.key === 'm' || e.key === 'M') AF.UI.isOpen() ? AF.UI.close() : AF.UI.open('map');
    if (e.key === 'r' || e.key === 'R') { game.toast(AF.Town.eatRation(game.state)); game.persist(); game.refresh(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') input.run = false;
    const dir = KEYDIR[e.key];
    if (dir) input.held = input.held.filter((d) => d !== dir);
  });
  window.addEventListener('blur', () => { input.held = []; input.run = false; });

  // ---------- Touch: d-pad, A (interact) and B (hold to run) ----------
  document.querySelectorAll('[data-dir]').forEach((b) => {
    const dir = b.dataset.dir;
    const stop = () => { input.held = input.held.filter((d) => d !== dir); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); input.touch = e.pointerType !== 'mouse'; if (!input.held.includes(dir)) input.held.push(dir); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
  });
  $('#btn-a').addEventListener('pointerdown', (e) => { e.preventDefault(); input.touch = e.pointerType !== 'mouse'; if (AF.Dialog.open) AF.Dialog.advance(); else game.interact(); });
  $('#btn-b').addEventListener('pointerdown', (e) => { e.preventDefault(); input.run = true; $('#btn-b').classList.add('on'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('#btn-b').addEventListener(ev, () => { input.run = false; $('#btn-b').classList.remove('on'); }));

  // Drag on the map like a joystick; tap next to the pilot to interact.
  let drag = null;
  const world = $('#world');
  const dirFrom = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  world.addEventListener('pointerdown', (e) => {
    if (!canAct()) return;
    input.touch = e.pointerType !== 'mouse';
    const r = world.getBoundingClientRect(), w = game.state.world;
    const tile = AF.Render.screenToTile(world, e.clientX - r.left, e.clientY - r.top);
    if (tile && Math.abs(tile.x - w.px) + Math.abs(tile.y - w.py) === 1) {
      const dir = dirFrom(tile.x - w.px, tile.y - w.py);
      const save = w.dir; w.dir = dir;
      if (AF.World.facing(game.state)) { game.interact(); return; }
      w.dir = save;
    }
    const me = AF.Render.tileToScreen(world, w.px + 0.5, w.py + 0.5);
    drag = { id: e.pointerId, cx: me ? me.x + r.left : r.left + r.width / 2, cy: me ? me.y + r.top : r.top + r.height / 2 };
    world.setPointerCapture(e.pointerId);
    upd(e);
  });
  const upd = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.cx, dy = e.clientY - drag.cy;
    input.held = Math.hypot(dx, dy) < 18 ? [] : [dirFrom(dx, dy)];
    input.run = Math.hypot(dx, dy) > 170;
  };
  world.addEventListener('pointermove', upd);
  ['pointerup', 'pointercancel'].forEach((ev) => world.addEventListener(ev, () => { drag = null; input.held = []; input.run = false; }));

  // ---------- Clicks ----------
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (AF.Dialog.open) {
      const ch = t.closest('[data-choice]');
      if (ch) AF.Dialog.choose(+ch.dataset.choice); else if (t.closest('#dialog')) AF.Dialog.advance();
      return;
    }
    if (!$('#creator').hidden && AF.Creator.handle(t)) return;
    if (!$('#menu').hidden && AF.UI.menuHandle(t)) return;
    if (AF.UI.isOpen() && AF.UI.handle(t)) return;
    const play = t.closest('[data-play]');
    if (play && game.battle) { AF.BattleUI.play(+play.dataset.play); return; }
    const slot = t.closest('[data-slot-new],[data-slot-play],[data-slot-del],[data-slot-del-yes],[data-slot-del-no]');
    if (slot) {
      const d = slot.dataset;
      if (d.slotNew) newPilot(+d.slotNew);
      if (d.slotPlay) { const s = AF.loadSlot(+d.slotPlay); if (s) { game.start(s); game.toast(`Welcome back, ${s.look.name}.`); } }
      if (d.slotDel) $(`#slot-row-${d.slotDel}`).innerHTML = `<span class="hint">Delete this pilot forever?</span>
        <button class="btn danger" data-slot-del-yes="${d.slotDel}">Delete</button><button class="btn" data-slot-del-no="1">Keep</button>`;
      if (d.slotDelYes) { AF.deleteSlot(+d.slotDelYes); renderSlots(); }
      if (d.slotDelNo) renderSlots();
      return;
    }
    const act = t.closest('[data-act]');
    if (!act) return;
    switch (act.dataset.act) {
      case 'end': if (game.battle) AF.BattleUI.endTurn(); break;
      case 'close-result': closeResult(); break;
      case 'title-help': AF.UI.help(); break;
      case 'workshop': AF.UI.open('deck'); break;
      case 'map': AF.UI.open('map'); break;
      case 'menu': AF.UI.menu(); break;
      case 'ration': game.toast(AF.Town.eatRation(game.state)); game.persist(); game.refresh(); break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-toggle]')) { e.preventDefault(); e.target.click(); }
  });

  // ---------- Loop ----------
  function frame(now) {
    if (game.state && !$('#game').hidden && $('#battle').hidden) {
      if (canAct() && input.held.length && now >= input.nextStep) step(input.held[input.held.length - 1], now);
      AF.World.draw($('#world'), game.state, now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Boot ----------
  const ready = AF.Render && AF.Quests && AF.Town && AF.Creator && AF.World && AF.World.init && AF.WORLD_SEED && AF.drawPilotAt && AF.BattleUI;
  if (!ready) { $('#boot-error').hidden = false; return; }
  AF.migrateOldSave();
  try { renderSlots(); } catch (e) { $('#boot-error').hidden = false; console.error(e); }
  try {
    $('#title-bot').innerHTML = '<canvas class="spr" data-spr="robot"></canvas>';
    AF.Pixel.paint($('#title-bot'), { parts: { arc: 3, frame: 3, legs: 2, arms: 2, weapon: 3, shield: 2 }, look: { core: 1 } });
  } catch (e) { console.error(e); }
})();
