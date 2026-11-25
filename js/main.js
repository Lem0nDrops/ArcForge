/* ArcForge — boot, title & save slots, input, game loop. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);
  try { AF.muted = localStorage.getItem('arcforge.muted') === '1'; } catch (e) {}

  const game = (AF.game = { state: null, battle: null, lastStep: 0 });

  game.persist = () => game.state && AF.save(game.state);

  game.start = function (state) {
    if (!state.world) state.world = AF.World.init();
    game.state = state;
    game.battle = null;
    ['#title', '#battle', '#result', '#creator'].forEach((s) => ($(s).hidden = true));
    $('#game').hidden = false;
    game.persist(); game.refresh();
    if (!state.flags.intro) setTimeout(() => AF.Quests.intro(state), 400);
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

  // ---------- World movement ----------
  game.step = function (dx, dy) {
    if (!game.state || game.battle || AF.UI.isOpen() || !$('#menu').hidden || !$('#creator').hidden || AF.Dialog.open) return;
    const now = performance.now();
    if (now - game.lastStep < 95) return;
    game.lastStep = now;
    const ev = AF.World.move(game.state, dx, dy);
    if (ev && (ev.type === 'blocked' || ev.type === 'bump')) { AF.sfx('bump'); if (ev.text) game.toast(ev.text); }
    else if (ev && ev.type === 'door') { AF.sfx('card'); if (AF.SHOPS.includes(ev.id)) AF.UI.open(null, ev.id); else AF.Quests.door(game.state, ev.id); }
    else if (ev && ev.type === 'talk') { AF.sfx('card'); AF.Quests.talk(game.state, ev.npc); }
    else if (ev && ev.type === 'sign') { AF.sfx('card'); AF.Dialog.show([{ text: ev.text }]); }
    else AF.sfx('step');
    if (ev && ev.type === 'msg') game.toast(ev.text);
    if (ev && ev.type === 'battle') game.startBattle(ev.enemy, ev.ambush);
    game.persist(); game.refresh();
  };

  // ---------- Battle ----------
  game.startBattle = function (enemyRef, ambush) {
    game.battle = new AF.Battle(game.state, enemyRef, { ambush });
    $('#battle').hidden = false;
    AF.BattleUI.render($('#battle .bt'), game.battle);
  };
  function afterBattleAction() {
    const b = game.battle;
    AF.BattleUI.render($('#battle .bt'), b);
    if (b.over && !b.done) {
      b.done = true;
      const out = b.finish();
      game.persist();
      setTimeout(() => {
        $('#result .sheet').innerHTML = AF.BattleUI.result(b, out);
        $('#result').hidden = false;
      }, 450);
    }
  }
  function closeResult() {
    $('#result').hidden = true; $('#battle').hidden = true;
    game.battle = null; game.refresh();
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
        <canvas class="slot-pic" data-pic="${n}" width="72" height="104"></canvas>
        <b class="slot-name">${AF.esc(s.look.name)}</b>
        <span class="muted">${s.stats.wins} wins · parts ${lv}/30${s.won ? ' · Titan beaten' : ''}${when ? ' · ' + when : ''}</span>
        <div class="row" id="slot-row-${n}"><button class="btn primary" data-slot-play="${n}">Play</button>
          <button class="btn ghost" data-slot-del="${n}">Delete</button></div></div>`;
    }).join('');
    slots.forEach((s, i) => {
      const c = document.querySelector(`[data-pic="${i + 1}"]`);
      if (s && c) AF.drawPilot(c.getContext('2d'), 0, 0, 104, s.look, 0);
    });
  }

  function newPilot(n) {
    $('#title').hidden = true;
    AF.Creator.open({ mode: 'new',
      onDone: (look) => {
        game.start(AF.newGame(look, n));

      },
      onCancel: () => { $('#title').hidden = false; renderSlots(); } });
  }

  // ---------- Input ----------
  const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (AF.Dialog.open) {
      if (e.target.matches && e.target.matches('[data-choice]') && (e.key === 'Enter' || e.key === ' ')) return;
      if (['Enter', ' ', 'e', 'E', 'z', 'Z'].includes(e.key)) { e.preventDefault(); AF.Dialog.advance(); }
      return;
    }
    if (e.key === 'Escape') {
      if (!$('#menu').hidden) $('#menu').hidden = true; else if (AF.UI.isOpen()) AF.UI.close();
      return;
    }
    if (!$('#result').hidden && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); closeResult(); return; }
    if (game.battle && !game.battle.over) {
      if (/^[1-9]$/.test(e.key)) { if (game.battle.play(+e.key - 1)) afterBattleAction(); return; }
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); game.battle.endTurn(); afterBattleAction(); }
      return;
    }
    if (!game.state || $('#game').hidden) return;
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (k) { e.preventDefault(); game.step(k[0], k[1]); return; }
    if ((e.key === 'e' || e.key === 'E') && !AF.UI.isOpen()) AF.UI.open('deck');
    if (e.key === 'm' || e.key === 'M') AF.UI.isOpen() ? AF.UI.close() : AF.UI.open('map');
    if (e.key === 'r' || e.key === 'R') { game.toast(AF.Town.eatRation(game.state)); game.persist(); game.refresh(); }
  });

  // D-pad: press and hold to keep walking.
  let hold = 0;
  document.querySelectorAll('[data-dir]').forEach((b) => {
    const [dx, dy] = b.dataset.dir.split(',').map(Number);
    const stop = () => { clearInterval(hold); hold = 0; };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); stop(); game.lastStep = 0; game.step(dx, dy); hold = setInterval(() => game.step(dx, dy), 170); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
  });

  // Tap the map to step toward that spot.
  $('#world').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) game.step(Math.sign(dx), 0); else game.step(0, Math.sign(dy));
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (AF.Dialog.open) {
      const ch = t.closest('[data-choice]');
      if (ch) AF.Dialog.choose(+ch.dataset.choice); else if (t.closest('#dialog') || t.closest('#world')) AF.Dialog.advance();
      return;
    }
    if (!$('#creator').hidden && AF.Creator.handle(t)) return;
    if (!$('#menu').hidden && AF.UI.menuHandle(t)) return;
    if (AF.UI.isOpen() && AF.UI.handle(t)) return;
    const play = t.closest('[data-play]');
    if (play && game.battle) { if (game.battle.play(+play.dataset.play)) afterBattleAction(); return; }
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
      case 'end': if (game.battle) { game.battle.endTurn(); afterBattleAction(); } break;
      case 'close-result': closeResult(); break;
      case 'title-help': AF.UI.help(); break;
      case 'workshop': AF.UI.open('deck'); break;
      case 'map': AF.UI.open('map'); break;
      case 'menu': AF.UI.menu(); break;
      case 'ration': game.toast(AF.Town.eatRation(game.state)); game.persist(); game.refresh(); break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-toggle],[data-play]')) { e.preventDefault(); e.target.click(); }
  });

  // ---------- Loop ----------
  function frame(t) {
    if (game.state && !$('#game').hidden && $('#battle').hidden) AF.World.draw($('#world'), game.state, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Boot ----------
  // Every script must be from the same version, or the game can't start.
  const ready = AF.Pixel && AF.Quests && AF.Town && AF.Creator && AF.World && AF.World.init && AF.WORLD_SEED && AF.pilotSprite;
  if (!ready) { $('#boot-error').hidden = false; return; }
  AF.migrateOldSave();
  try { renderSlots(); } catch (e) { $('#boot-error').hidden = false; console.error(e); }
  try {
    $('#title-bot').innerHTML = '<canvas class="spr" data-spr="robot"></canvas>';
    AF.Pixel.paint($('#title-bot'), { parts: { arc: 3, frame: 3, legs: 2, arms: 2, weapon: 3, shield: 2 }, look: { core: 1 } });
  } catch (e) { console.error(e); }
})();
