/* ArcForge — boot, screens, input, game loop. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);
  try { AF.muted = localStorage.getItem('arcforge.muted') === '1'; } catch (e) {}

  const game = (AF.game = { state: null, battle: null, lastStep: 0 });

  game.persist = () => AF.save(game.state);

  game.start = function (state) {
    if (!state.world) state.world = AF.World.generate(state.seed);
    game.state = state;
    game.battle = null;
    $('#title').hidden = true; $('#battle').hidden = true; $('#result').hidden = true;
    $('#game').hidden = false;
    game.persist(); game.refresh();
  };
  game.newWorld = function () {
    game.start(AF.newGame());
    game.toast('Welcome to the wasteland. Gather Scrap and Copper nearby, then upgrade at the Home Forge.', 6000);
  };

  let toastTimer = 0;
  game.toast = function (text, ms) {
    const t = $('#toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms || 3800);
  };

  game.refresh = function () {
    const s = game.state; if (!s) return;
    const st = AF.stats(s.parts), atBase = AF.World.atBase(s);
    $('#hp i').style.width = Math.round((s.hp / st.maxHp) * 100) + '%';
    $('#hp span').textContent = `HP ${s.hp} / ${st.maxHp}`;
    $('#where').textContent = AF.World.describeHere(s);
    $('#hudres').innerHTML = AF.UI.resBar(s.res);
    $('#workshop-btn').textContent = atBase ? 'Workshop' : 'Robot & deck';
    $('#forge-cta').hidden = !atBase;
  };

  // ---------- World movement ----------
  game.step = function (dx, dy) {
    if (!game.state || game.battle || AF.UI.isOpen() || !$('#menu').hidden) return;
    const now = performance.now();
    if (now - game.lastStep < 95) return;
    game.lastStep = now;
    const ev = AF.World.move(game.state, dx, dy);
    if (ev && ev.type === 'blocked') { AF.sfx('bump'); game.toast(ev.text); }
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

  // ---------- Input ----------
  const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
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
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (k && game.state && !$('#game').hidden) { e.preventDefault(); game.step(k[0], k[1]); return; }
    if ((e.key === 'e' || e.key === 'E') && game.state && !game.battle && !AF.UI.isOpen()) AF.UI.open(AF.World.atBase(game.state) ? 'robot' : 'deck');
    if ((e.key === 'm' || e.key === 'M') && game.state && !game.battle) AF.UI.isOpen() ? AF.UI.close() : AF.UI.open('map');
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
    if (!$('#menu').hidden && AF.UI.menuHandle(t)) return;
    if (AF.UI.isOpen() && AF.UI.handle(t)) return;
    const play = t.closest('[data-play]');
    if (play && game.battle) { if (game.battle.play(+play.dataset.play)) afterBattleAction(); return; }
    const act = t.closest('[data-act]');
    if (!act) return;
    switch (act.dataset.act) {
      case 'end': if (game.battle) { game.battle.endTurn(); afterBattleAction(); } break;
      case 'close-result': closeResult(); break;
      case 'continue': game.start(AF.load()); game.toast('Welcome back.'); break;
      case 'new': game.newWorld(); break;
      case 'title-help': AF.UI.help(); break;
      case 'workshop': AF.UI.open(AF.World.atBase(game.state) ? 'robot' : 'deck'); break;
      case 'forge-cta': AF.UI.open('robot'); break;
      case 'map': AF.UI.open('map'); break;
      case 'menu': AF.UI.menu(); break;
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

  // ---------- Title ----------
  $('#title-bot').innerHTML = AF.robotSVG({ arc: 3, frame: 3, legs: 2, arms: 2, weapon: 3, shield: 2 });
  if (AF.load()) $('#continue').hidden = false;
})();
