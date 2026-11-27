/* Automata: ArcForge — Admin / developer panel.
   Open with Ctrl+Shift+A, or tap the version number 5 times (title screen or Help). Toggles are saved with the pilot
   (state.admin) so a test save keeps its settings. Nothing here runs unless the panel is used. */
(function () {
  const AF = (window.AF = window.AF || {});
  const A = (AF.Admin = {});
  const $ = (s) => document.querySelector(s);

  // ---------- Switches the game checks ----------
  const on = (k) => { const s = AF.game && AF.game.state; return !!(s && s.admin && s.admin[k]); };
  A.god = () => on('god');            // take no damage, burns and poison do nothing
  A.energy = () => on('energy');      // 99 energy every turn
  A.onehit = () => on('onehit');      // every hit you land deals 999
  A.noclip = () => on('noclip');      // walk over any terrain (water, lava, mountains)
  A.peace = () => on('peace');        // bots don't chase or ambush; disturbances stay quiet
  A.any = () => ['god', 'energy', 'onehit', 'noclip', 'peace'].some(on);

  const TOGGLES = [
    ['god', 'God mode', 'Your automaton takes no damage. Burns and poison do nothing.'],
    ['energy', 'Infinite energy', '99 energy every turn: play your whole hand.'],
    ['onehit', 'One-hit wins', 'Every hit you land deals 999 damage.'],
    ['noclip', 'Walk anywhere', 'Cross water, lava, ice and mountains on any Locomotion.'],
    ['peace', 'Peaceful wilds', 'Roaming bots don\'t chase or ambush you; disturbances stay quiet.'],
  ];

  // ---------- One-shot actions ----------
  const ACTIONS = {
    cards: ['Unlock all cards', (s) => {
      const all = Object.keys(AF.CARDS).filter((id) => !AF.CARDS[id].con || AF.CARDS[id].con === s.construct);
      s.known = Array.from(new Set([...(s.known || []), ...all]));
      const have = new Set(s.cards.map((c) => c.id));
      all.forEach((id) => { if (!have.has(id)) { const c = AF.newCard(id); c.inDeck = false; s.cards.push(c); } });
      return `Learned every blueprint and added one copy of each card (${all.length}) to your collection.`;
    }],
    outfits: ['Unlock all outfits', (s) => { s.owned = Array.from(new Set([...(s.owned || []), ...Object.keys(AF.ITEMS)])); return `All ${Object.keys(AF.ITEMS).length} outfit pieces are in your Wardrobe.`; }],
    ach: ['Unlock all achievements', (s) => { s.ach = s.ach || {}; AF.ACHIEVEMENTS.forEach((a) => (s.ach[a.id] = s.ach[a.id] || Date.now())); return 'Every achievement, card frame, finish and card back is unlocked.'; }],
    rich: ['Max Bolts & materials', (s) => { s.credits = Math.max(s.credits, 999999); Object.keys(AF.RES).forEach((k) => (s.res[k] = Math.max(s.res[k] || 0, 999))); s.pilot.rations = 9; s.pilot.lures = { lure: 9, arclure: 5 }; return '999,999 Bolts, 999 of every material, full rations and lures.'; }],
    parts: ['Max automaton parts', (s) => { AF.PART_KEYS.forEach((k) => (s.parts[k] = AF.PARTS[k].tiers.length)); return 'Every part is at its top tier.'; }],
    level: ['Level up to 20', (s) => { s.level = Math.max(s.level, 20); s.xp = 0; return 'Pilot level 20.'; }],
    heal: ['Restore vitality', (s) => { s.pilot.vit = AF.stats(s).vit || 20; s.pilot.buffs = {}; return 'Vitality restored.'; }],
    reveal: ['Reveal the whole map', (s) => { const w = s.world, mp = AF.World.map(); const f = '1'.repeat(mp.w * mp.h); if ((w.area || 'over') === 'over') w.fog = f; else if (w.store && w.store.over) w.store.over.fog = f; return 'Map revealed.'; }],
    reset: ['Refresh nodes & disturbances', (s) => { s.world.ready = {}; s.world.hot = {}; return 'Every resource node and disturbance is ready again.'; }],
    all: ['★ Unlock everything', (s) => { ['cards', 'outfits', 'ach', 'rich', 'parts', 'level', 'heal', 'reveal'].forEach((k) => ACTIONS[k][1](s)); return 'Everything unlocked.'; }],
  };

  function teleports(s) {
    const mp = AF.World.map(), list = AF.World.TOWNS.map((T) => [`town${T.id}`, AF.TOWN_NAMES[T.id], T.x + Math.floor(T.w / 2), T.y + Math.floor(T.h / 2) + 1]);
    AF.World.REGIONS.slice(1).forEach((R) => list.push([`rg-${R.id}`, R.name, R.cx, R.cy]));
    if (mp.cave) list.push(['cave', 'Sunken Foundry gate', mp.cave[0], mp.cave[1] + 2]);
    if (mp.lair) list.push(['lair', "Titan's lair", mp.lair.x, mp.lair.y - 4]);
    const bt = s.world.bounty && s.world.enemies.find((e) => e.id === s.world.bounty.id);
    if (bt) list.push(['bounty', 'Bounty target', bt.x, bt.y + 1]);
    return list;
  }
  // Find the nearest tile the pilot can stand on.
  function standable(x, y) {
    const mp = AF.World.map(), ok = (xx, yy) => { const c = AF.World.terrainAt(null, xx, yy); return c && AF.TERRAIN[c].legs <= 2 && !mp.solid[yy * mp.w + xx] && !(mp.nodes && mp.nodes[xx + ',' + yy]); };
    for (let r = 0; r < 20; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ok(x + dx, y + dy)) return [x + dx, y + dy];
    return [x, y];
  }

  // ---------- Panel ----------
  function el() {
    let e = $('#admin');
    if (!e) { e = document.createElement('section'); e.id = 'admin'; e.className = 'modal'; e.hidden = true; e.innerHTML = '<div class="sheet admin"></div>'; document.body.appendChild(e); e.addEventListener('click', click); e.addEventListener('change', change); }
    return e;
  }
  A.isOpen = () => !el().hidden;
  A.open = function () { el().hidden = false; A.render(); };
  A.close = function () { el().hidden = true; if (AF.game && AF.game.state) { AF.game.persist(); AF.game.refresh(); if (AF.UI.isOpen()) AF.UI.render(); } };
  A.toggle = () => (A.isOpen() ? A.close() : A.open());
  A.render = function (msg) {
    const s = AF.game && AF.game.state, sh = el().querySelector('.sheet');
    if (!s) { sh.innerHTML = `<header class="ph"><h2>Admin</h2><button class="btn ghost x" data-adm="close">Close</button></header><p class="hint">Load or create a pilot first, then open this panel again.</p>`; return; }
    s.admin = s.admin || {};
    const enemies = Object.entries(AF.ENEMIES).sort((a, b) => a[1].tier - b[1].tier || a[1].name.localeCompare(b[1].name));
    sh.innerHTML = `<header class="ph"><h2>Admin <small class="muted">${AF.esc(s.look.name || 'Pilot')}</small></h2><button class="btn ghost x" data-adm="close">Close</button></header>
      ${msg ? `<p class="adm-msg">${AF.esc(msg)}</p>` : ''}
      <section><h3>Cheats</h3><div class="adm-toggles">${TOGGLES.map(([k, n, d]) => `<label class="adm-tog"><input type="checkbox" data-admt="${k}" ${s.admin[k] ? 'checked' : ''}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div></section>
      <section><h3>Unlock</h3><div class="adm-acts">${Object.entries(ACTIONS).map(([k, [n]]) => `<button class="btn${k === 'all' ? ' primary' : ''}" data-adma="${k}">${n}</button>`).join('')}</div></section>
      <section><h3>Teleport</h3><div class="adm-acts">${teleports(s).map(([k, n]) => `<button class="btn" data-admtp="${k}">${AF.esc(n)}</button>`).join('')}</div></section>
      <section><h3>Fight</h3><div class="adm-row"><select id="adm-foe">${enemies.map(([k, e]) => `<option value="${k}">${AF.esc(e.name)} (${e.boss ? 'boss' : 'tier ' + e.tier}${e.region ? ', ' + e.region : ''})</option>`).join('')}</select><button class="btn primary" data-adm="fight">Start battle</button></div></section>
      <p class="hint">Open this panel with Ctrl+Shift+A, or tap the version number 5 times. Cheats are saved with this pilot.</p>`;
  };
  function click(ev) {
    const t = ev.target.closest('[data-adm],[data-adma],[data-admtp]'); if (!t) return;
    const s = AF.game && AF.game.state;
    if (t.dataset.adm === 'close') return A.close();
    if (!s) return;
    if (t.dataset.adma) { const msg = ACTIONS[t.dataset.adma][1](s); AF.checkAchievements(s); AF.game.persist(); AF.game.refresh(); AF.sfx && AF.sfx('forge'); return A.render(msg); }
    if (t.dataset.admtp) {
      const tp = teleports(s).find((x) => x[0] === t.dataset.admtp); if (!tp) return;
      if ((s.world.area || 'over') !== 'over') AF.World.leaveDungeon(s);
      s.world.inside = null;
      const [x, y] = standable(tp[2], tp[3]); const w = s.world; w.px = x; w.py = y; w.rx = x; w.ry = y + 1; w.dir = 'down';
      AF.Render.snap(); AF.World.validate(s); AF.game.persist(); AF.game.refresh(); A.close(); AF.game.toast(`Teleported to ${tp[1]}.`); return;
    }
    if (t.dataset.adm === 'fight') {
      const type = $('#adm-foe').value, w = s.world; A.close();
      if (!s.flags.robot) s.flags.robot = true;
      AF.game.startBattle({ id: 'admin:' + Date.now(), type, x: w.px, y: w.py, boss: !!AF.ENEMIES[type].boss, admin: true });
    }
  }
  function change(ev) {
    const t = ev.target; if (!t.dataset.admt) return;
    const s = AF.game && AF.game.state; if (!s) return;
    s.admin = s.admin || {}; s.admin[t.dataset.admt] = t.checked; AF.game.persist(); AF.game.refresh();
  }

  // ---------- How to open it ----------
  document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) { e.preventDefault(); A.toggle(); } if (e.key === 'Escape' && A.isOpen()) A.close(); });
  let taps = 0, tapT = 0;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.credit,.ver')) return;
    const now = Date.now(); taps = now - tapT < 900 ? taps + 1 : 1; tapT = now;
    if (taps >= 5) { taps = 0; A.open(); }
  });
})();
