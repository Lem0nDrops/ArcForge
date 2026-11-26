/* Automata: ArcForge — gathering mini-games and the blueprint reveal.
   Strike  (copper, silicon, arcite): a needle swings across the vein; tap when it's in the glowing seam. 3 strikes.
   Rummage (scrap piles): a scanner sweeps the pile and valuable bits glint for a moment; then pick by memory.
   The score becomes materials in AF.World.finishGather; a flawless job adds a rare find. */
(function () {
  const AF = (window.AF = window.AF || {});
  const M = (AF.Mini = { open: false });
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function root() {
    let e = $('#mini');
    if (!e) {
      e = document.createElement('section'); e.id = 'mini'; e.className = 'modal'; e.hidden = true;
      e.innerHTML = '<div class="sheet narrow mini"></div>'; document.body.appendChild(e);
      document.addEventListener('keydown', (ev) => { if (M.open && M.key) M.key(ev); });
    }
    return e;
  }
  const sheet = () => root().querySelector('.sheet');
  M.isOpen = () => M.open;
  function show(html) { root().hidden = false; M.open = true; sheet().innerHTML = html; }
  function close() { root().hidden = true; M.open = false; M.key = null; cancelAnimationFrame(M.raf); }
  M.close = close;

  const RESN = (k) => AF.RES[k].name;
  const gotText = (got) => Object.entries(got).map(([k, n]) => `<span class="cost"><i class="chip" style="--c:${AF.RES[k].color}"></i>+${n} ${RESN(k)}</span>`).join('') || '<span class="muted">Nothing worth keeping.</span>';

  // ---------- Entry point from the world ----------
  M.gather = function (state, ev) {
    const def = AF.NODES[ev.node], st = AF.stats(state);
    const opts = { state, def, type: ev.node, site: ev.site, gather: st.gather, arms: state.parts.arms, tired: state.pilot.vit <= 0,
      finish: (result) => AF.World.finishGather(state, ev.k, result) };
    if (def.game === 'rummage') rummage(opts); else strike(opts);
  };

  function frame(title, sub, body, foot) {
    return `<header class="ph"><h2>${title}</h2><button class="btn ghost x" data-mini="leave">Leave</button></header>
      <div class="mini-body"><p class="hint">${sub}</p>${body}</div><div class="mini-foot">${foot || ''}</div>`;
  }
  function summary(o, result, label) {
    const got = o.finish(result);
    AF.game.persist(); AF.game.refresh();
    const foot = sheet().querySelector('.mini-foot');
    foot.innerHTML = `<div class="mini-sum"><b>${label}</b><div class="loot">${gotText(got || {})}</div>${result.flawless ? `<p class="flaw">Flawless! Rare find: +1 ${RESN(o.def.bonus)}</p>` : ''}</div>
      <button class="btn primary" data-mini="done">Collect</button>`;
    sheet().querySelector('[data-mini=leave]').textContent = 'Close';
    M.after = () => close();
  }

  // ---------- STRIKE ----------
  function strike(o) {
    const res = o.def.res, col = AF.RES[res].color;
    const total = 3 + (o.arms >= 3 ? 1 : 0);
    const zoneW = Math.min(0.42, o.def.zone + 0.03 * (o.gather - 1)), perfW = zoneW * 0.32;
    let speed = o.def.speed * (o.tired ? 1.2 : 1), left = total, score = 0, perfects = 0, hits = 0, p = 0, dir = 1, last = performance.now(), busy = false, centre = 0.5, started = false;
    const newZone = () => { centre = zoneW / 2 + 0.06 + Math.random() * (1 - zoneW - 0.12); };
    newZone();
    const rock = `<svg class="ore" viewBox="0 0 200 120" aria-hidden="true">
      <defs><radialGradient id="mrk" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#8a8276"/><stop offset=".6" stop-color="#4e4840"/><stop offset="1" stop-color="#26221e"/></radialGradient></defs>
      <path d="M18 104 L10 66 L34 26 L82 10 L136 16 L180 42 L192 86 L170 108 Z" fill="url(#mrk)" stroke="#140e0a" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 40 L70 58 L96 50 L128 70 L162 62" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" opacity=".9"/>
      <path d="M56 84 L84 76 L112 92 L146 86" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      ${[[70, 58], [128, 70], [96, 50], [112, 92], [146, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".7"/>`).join('')}
      <g class="cracks" fill="none" stroke="#120c08" stroke-width="3" stroke-linecap="round"></g></svg>`;
    show(frame(`${o.site ? AF.esc(o.site) : o.def.label}`, `${o.def.label}: tap <b>Strike</b> (or press Space) when the needle is in the glowing seam. Gold centre = perfect.`,
      `<div class="strike" data-mini="strike">
        <div class="rockwrap">${rock}<div class="shards"></div><div class="pop"></div></div>
        <div class="meter"><i class="zone" style="--c:${col}"><b></b></i><span class="needle"></span></div>
        <div class="picks">${Array.from({ length: total }, () => '<i></i>').join('')}</div>
      </div>`,
      `<button class="btn primary big" data-mini="strike">Strike!</button>`));
    const zone = sheet().querySelector('.zone'), needle = sheet().querySelector('.needle'), pop = sheet().querySelector('.pop');
    const place = () => { zone.style.left = (centre - zoneW / 2) * 100 + '%'; zone.style.width = zoneW * 100 + '%'; zone.querySelector('b').style.width = (perfW / zoneW) * 100 + '%'; };
    place();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!busy) { p += dir * speed * dt * 0.9; if (p > 1) { p = 1; dir = -1; } if (p < 0) { p = 0; dir = 1; } }
      needle.style.left = p * 100 + '%';
      if (M.open) M.raf = requestAnimationFrame(tick);
    };
    M.raf = requestAnimationFrame(tick);
    const hit = async () => {
      if (busy || left <= 0) return;
      busy = true; started = true;
      const d = Math.abs(p - centre); let grade, pts;
      if (d <= perfW / 2) { grade = 'Perfect!'; pts = 2; perfects++; } else if (d <= zoneW / 2) { grade = 'Good'; pts = 1; } else { grade = 'Miss'; pts = 0; }
      score += pts; if (pts) hits++;
      left--; sheet().querySelectorAll('.picks i')[total - left - 1].classList.add(pts === 2 ? 'perf' : pts ? 'good' : 'miss');
      pop.textContent = grade + (pts ? ` +${pts}` : ''); pop.className = 'pop show ' + (pts === 2 ? 'perf' : pts ? 'good' : 'miss');
      const wrap = sheet().querySelector('.rockwrap'); wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
      if (pts) {
        const cr = sheet().querySelector('.cracks'), x = 40 + Math.random() * 120, y = 30 + Math.random() * 60;
        cr.insertAdjacentHTML('beforeend', `<path d="M${x} ${y} l${-10 + Math.random() * 20} ${8 + Math.random() * 10} l${-8 + Math.random() * 16} ${6 + Math.random() * 10}"/>`);
        const sh = sheet().querySelector('.shards');
        for (let i = 0; i < 8 + pts * 4; i++) { const s = document.createElement('i'); s.style.cssText = `--dx:${(Math.random() - 0.5) * 220}px;--dy:${-40 - Math.random() * 110}px;--c:${i % 3 ? col : '#d8d0c4'}`; sh.appendChild(s); setTimeout(() => s.remove(), 700); }
      }
      AF.sfx(pts ? 'hit' : 'bump');
      await wait(520);
      if (left <= 0) { const flawless = perfects === total; summary(o, { score, flawless }, flawless ? 'Flawless strike!' : hits ? `${hits} of ${total} strikes landed` : 'The vein held firm'); return; }
      speed *= 1.12; newZone(); place(); busy = false;
    };
    M.act = async (a) => {
      if (a === 'strike') hit();
      if (a === 'leave') { if (started && left > 0) { left = 0; summary(o, { score, flawless: false }, 'You stop early'); } else close(); }
      if (a === 'done') close();
    };
    M.key = (ev) => { if ([' ', 'Enter', 'e', 'E'].includes(ev.key)) { ev.preventDefault(); if (left > 0) hit(); else close(); } if (ev.key === 'Escape') M.act('leave'); };
  }

  // ---------- RUMMAGE ----------
  const JUNK = {
    rust: { pts: 0, name: 'Rust', icon: '<path d="M14 30 q8 -14 20 -6 q10 -10 18 4 q6 10 -4 16 h-30 q-10 -4 -4 -14z" fill="#8a4a24" stroke="#140e0a" stroke-width="3"/><circle cx="26" cy="32" r="3" fill="#5a2a14"/><circle cx="40" cy="28" r="2.5" fill="#5a2a14"/>' },
    scrap1: { pts: 1, name: 'Scrap', icon: '<rect x="14" y="20" width="22" height="16" rx="3" fill="#a9b4bd" stroke="#140e0a" stroke-width="3" transform="rotate(-12 25 28)"/><circle cx="44" cy="36" r="7" fill="#8a8680" stroke="#140e0a" stroke-width="3"/>' },
    scrap2: { pts: 2, name: 'Good scrap', icon: '<polygon points="32,10 37,18 46,16 44,26 52,32 44,38 46,48 37,46 32,54 27,46 18,48 20,38 12,32 20,26 18,16 27,18" fill="#c8c0b4" stroke="#140e0a" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="#6a6660" stroke="#140e0a" stroke-width="2.5"/>' },
    copper: { pts: 0, extra: 'copper', name: 'Copper coil', icon: '<ellipse cx="32" cy="32" rx="18" ry="12" fill="none" stroke="#140e0a" stroke-width="9"/><ellipse cx="32" cy="32" rx="18" ry="12" fill="none" stroke="#e0894a" stroke-width="5"/><ellipse cx="32" cy="32" rx="10" ry="6" fill="none" stroke="#e0894a" stroke-width="4"/>' },
    circuits: { pts: 0, extra: 'circuits', name: 'Circuit board', icon: '<rect x="12" y="16" width="40" height="32" rx="3" fill="#2a8a4a" stroke="#140e0a" stroke-width="3"/><path d="M18 24 h12 v8 h10 M18 40 h20 v-6" fill="none" stroke="#d8c060" stroke-width="2.5"/><rect x="38" y="20" width="9" height="9" fill="#1a1a1a"/>' },
    spring: { pts: 0, trap: true, name: 'Spring trap!', icon: '<path d="M16 46 l32 -4 l-32 -6 l32 -4 l-32 -6 l32 -4 l-32 -6" fill="none" stroke="#140e0a" stroke-width="6" stroke-linejoin="round"/><path d="M16 46 l32 -4 l-32 -6 l32 -4 l-32 -6 l32 -4 l-32 -6" fill="none" stroke="#c8c0b4" stroke-width="3" stroke-linejoin="round"/>' },
  };
  function rummage(o) {
    const deck = AF.shuffle(['rust', 'rust', 'rust', 'rust', 'scrap1', 'scrap1', 'scrap1', 'scrap2', 'scrap2', 'copper', 'circuits', 'spring']);
    const total = 3 + (o.gather >= 2 ? 1 : 0) + (o.arms >= 4 ? 1 : 0);
    let picks = total, score = 0, good = 0, phase = 'scan';
    const extra = {};
    show(frame(`${o.site ? AF.esc(o.site) : o.def.label}`, `Watch the scanner: the best parts <b>glint</b> as it passes. Then pick ${total} spots from memory. Mind the spring traps.`,
      `<div class="rummage"><div class="jgrid">${deck.map((_, i) => `<button class="jt" data-jt="${i}" disabled><span class="jf"><svg viewBox="0 0 64 64"><path d="M8 50 q10 -22 24 -16 q16 -18 26 6 v14 z" fill="#5a4a3a" stroke="#140e0a" stroke-width="3"/><circle cx="22" cy="44" r="4" fill="#3a2e24"/><circle cx="42" cy="40" r="3" fill="#3a2e24"/></svg></span><span class="jb"></span></button>`).join('')}<i class="scanline"></i></div>
        <div class="picks rum">${Array.from({ length: total }, () => '<i></i>').join('')}</div></div>`,
      `<span class="mini-tip">Scanning…</span>`));
    const tiles = [...sheet().querySelectorAll('.jt')];
    (async () => {
      const g = sheet().querySelector('.jgrid'); g.classList.add('scanning');
      // the scan line sweeps left to right over 4 columns; valuable tiles glint as it passes (brighter = better)
      for (let col = 0; col < 4; col++) {
        await wait(o.tired ? 300 : 420);
        if (!M.open) return;
        tiles.forEach((t, i) => { const j = JUNK[deck[i]], v = j.pts + (j.extra ? 2 : 0); if (i % 4 === col && v >= 1) { t.classList.add(v >= 2 ? 'glint2' : 'glint1'); setTimeout(() => t.classList.remove('glint1', 'glint2'), 650); } });
      }
      await wait(650);
      if (!M.open) return;
      g.classList.remove('scanning'); phase = 'pick'; tiles.forEach((t) => (t.disabled = false));
      sheet().querySelector('.mini-foot').innerHTML = `<span class="mini-tip">Pick ${picks} more</span>`;
    })();
    const end = (label) => {
      phase = 'done'; tiles.forEach((t) => (t.disabled = true));
      setTimeout(() => tiles.forEach((t, i) => { if (!t.classList.contains('open')) { t.classList.add('peek'); t.querySelector('.jb').innerHTML = `<svg viewBox="0 0 64 64">${JUNK[deck[i]].icon}</svg>`; } }), 400);
      summary(o, { score, extra, flawless: good === total }, label);
    };
    M.pick = (i) => {
      if (phase !== 'pick' || picks <= 0) return;
      const t = tiles[i]; if (t.classList.contains('open')) return;
      const j = JUNK[deck[i]];
      t.classList.add('open'); t.disabled = true; t.querySelector('.jb').innerHTML = `<svg viewBox="0 0 64 64">${j.icon}</svg><small>${j.name}</small>`;
      picks--; const pk = sheet().querySelectorAll('.picks i')[total - picks - 1];
      score += j.pts; if (j.extra) extra[j.extra] = (extra[j.extra] || 0) + 1;
      const val = j.pts + (j.extra ? 2 : 0); if (val > 0) good++;
      pk.classList.add(j.trap ? 'miss' : val >= 2 ? 'perf' : val ? 'good' : 'miss');
      AF.sfx(j.trap ? 'hit' : val ? 'gather' : 'bump');
      if (j.trap) { t.classList.add('trap'); sheet().querySelector('.rummage').classList.add('snap'); return end('Snap! A spring trap ends the dig'); }
      if (picks <= 0) return end(good === total ? 'A perfect haul!' : `${good} of ${total} good finds`);
      sheet().querySelector('.mini-foot').innerHTML = `<span class="mini-tip">Pick ${picks} more</span>`;
    };
    M.act = (a) => {
      if (a === 'leave') { if (phase === 'pick' && picks < total) end('You stop early'); else if (phase !== 'done') close(); else close(); }
      if (a === 'done') close();
    };
    M.key = (ev) => { if (ev.key === 'Escape') M.act('leave'); if (phase === 'done' && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); close(); } };
  }

  // ---------- Blueprint reveal ----------
  AF.blueprintReveal = function (id) {
    const d = AF.cardDef({ id }), rar = AF.cardRarity(id);
    return `<div class="bp-reveal r-${rar}"><small>Blueprint recovered</small><div class="bp-card">${AF.cardHtml(d, { st: AF.game && AF.game.state ? AF.stats(AF.game.state) : null })}</div>
      <p><b>${AF.esc(d.name)}</b> · ${AF.rarityName(rar)}. Forge it at the Rivet Forge or the Brass Anvil.</p></div>`;
  };
  M.reveal = function (id, text) {
    show(`<header class="ph"><h2>A discovery!</h2><button class="btn ghost x" data-mini="done">Close</button></header>
      <div class="mini-body center">${AF.blueprintReveal(id)}${text ? `<p class="hint">${AF.esc(text)}</p>` : ''}</div><div class="mini-foot"><button class="btn primary" data-mini="done">Wonderful</button></div>`);
    AF.sfx('win');
    M.act = (a) => { if (a === 'done' || a === 'leave') close(); };
    M.key = (ev) => { if ([' ', 'Enter', 'Escape'].includes(ev.key)) { ev.preventDefault(); close(); } };
  };

  // clicks inside the overlay
  document.addEventListener('click', (e) => {
    if (!M.open) return;
    const t = e.target.closest('[data-mini],[data-jt]'); if (!t || !root().contains(t)) return;
    e.stopPropagation();
    if (t.dataset.jt != null) M.pick && M.pick(+t.dataset.jt);
    else M.act && M.act(t.dataset.mini);
  }, true);
})();
