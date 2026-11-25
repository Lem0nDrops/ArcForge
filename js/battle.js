/* ArcForge — card battle rules (Battle) and the animated battle screen (BattleUI).
   Distance matters: Close / Mid / Far. Melee cards need Close, blasters reach Mid,
   long guns hit anywhere. Enemies show their next move, so you can dodge out of reach.
   play() and enemyTurn() return event objects that the screen turns into animations. */
(function () {
  const AF = (window.AF = window.AF || {});

  function Battle(state, enemyRef, opts) {
    opts = opts || {};
    const def = AF.ENEMIES[enemyRef.type];
    this.state = state; this.ref = enemyRef; this.def = def;
    this.st = AF.stats(state);
    this.p = { hp: Math.min(state.hp, this.st.maxHp), max: this.st.maxHp, block: 0, energy: 0, charge: 0, tune: 0, fortify: 0, combo: 0, thorns: 0, retain: false, field: 0 };
    this.con = state.construct;
    this.e = { hp: def.hp, max: def.hp, block: 0, aim: 0, power: 0, stun: 0, i: 0 };
    this.dist = opts.ambush ? Math.max(0, def.start - 1) : def.start;
    if (this.con === 'bulwark') this.dist = Math.max(0, this.dist - 1);
    this.pile = AF.shuffle(AF.deckCards(state).map((c) => c));
    this.hand = []; this.discard = []; this.gone = [];
    this.salvage = 0; this.turn = 0; this.over = null; this.log = [];
    this.terrain = AF.World.terrainHere(state) || 'grass';
    const buffs = state.pilot.buffs, perk = (id) => AF.hasPerk(state, id);
    this.mods = { tired: state.pilot.vit <= 0, drawEach: buffs.tea ? 1 : 0, firstDraw: perk('tactician') ? 1 : 0, firstEnergy: buffs.soda ? 1 : 0 };
    if (buffs.hotsauce) this.p.tune += 2;
    if (buffs.oatmeal) this.p.fortify += 4;
    this.say(opts.ambush ? `Ambush! ${def.name} jumped you.` : `A wild ${def.name} blocks the way!`);
    this.startTurn();
  }
  const B = Battle.prototype;

  B.say = function (t) { this.log.unshift(t); this.log.length = Math.min(this.log.length, 6); };
  B.intent = function () { return this.def.pattern[this.e.i % this.def.pattern.length]; };
  B.drawCards = function (n) {
    for (let k = 0; k < n; k++) {
      if (!this.pile.length) { this.pile = AF.shuffle(this.discard); this.discard = []; }
      if (!this.pile.length) return;
      this.hand.push(this.pile.pop());
    }
  };
  B.startTurn = function () {
    this.turn++;
    const m = this.mods, first = this.turn === 1;
    const kept = this.p.retain ? this.p.block : this.con === 'bulwark' ? Math.floor(this.p.block / 2) : 0;
    this.p.block = this.p.fortify + kept;
    this.p.retain = false; this.p.thorns = 0; this.p.combo = 0;
    this.p.energy = Math.max(1, this.st.energy - (m.tired ? 1 : 0) + (first ? m.firstEnergy : 0));
    this.drawCards(this.st.hand + m.drawEach + (first ? m.firstDraw : 0));
  };
  B.whyNot = function (inst) {
    const d = AF.cardDef(inst);
    if (this.over) return 'Battle over';
    if (d.cost > this.p.energy) return 'Not enough energy';
    if (d.kind === 'attack' && this.dist > d.range) return `Out of range (${AF.RANGE_NAMES[this.dist]})`;
    return '';
  };
  B.hitEnemy = function (n) { const soak = Math.min(this.e.block, n); this.e.block -= soak; this.e.hp -= n - soak; return { dealt: n - soak, soaked: soak }; };
  B.hitPlayer = function (n) {
    const soak = Math.min(this.p.block, n); this.p.block -= soak; this.p.hp -= n - soak;
    if (this.p.hp <= 0) { this.p.hp = 0; this.over = 'lose'; }
    return { dealt: n - soak, soaked: soak };
  };

  // Returns an event describing what happened, or null if the card can't be played.
  B.play = function (handIdx) {
    const inst = this.hand[handIdx];
    if (!inst || this.whyNot(inst)) return null;
    const d = AF.cardDef(inst), st = this.st, p = this.p;
    const ev = { card: d, hits: [], movedBefore: false, movedAfter: false };
    p.energy -= d.cost;
    const parts = [];
    if (d.move === 'in' || (d.move === 'close' && d.kind !== 'attack')) { this.dist = d.move === 'in' ? Math.max(0, this.dist - 1) : 0; ev.movedBefore = true; }
    if (d.move === 'out') { this.dist = Math.min(2, this.dist + 1); ev.movedBefore = true; }
    if (d.dmg || d.bash) {
      const rangeB = this.con === 'arcwright' && !d.bash ? [0, 1, 3][this.dist] : 0;
      const base = (d.bash ? p.block : d.dmg) + st.dmg + p.tune + p.charge + (d.bonus || 0) + rangeB + (d.combo ? d.combo * p.combo : 0)
        + (d.ifBlock && p.block > 0 ? d.ifBlock : 0) + (d.farBonus && this.dist === 2 ? d.farBonus : 0);
      if (d.combo && p.combo) ev.combo = p.combo;
      p.charge = 0;
      let total = 0;
      for (let h = 0; h < (d.hits || 1); h++) { const r = this.hitEnemy(base); ev.hits.push(r); total += r.dealt; }
      parts.push(`${total} damage`);
      AF.sfx('hit');
    }
    if (d.move === 'close' && d.kind === 'attack') { this.dist = 0; ev.movedAfter = true; }
    if (d.push) { this.dist = Math.min(2, this.dist + 1); ev.movedAfter = true; }
    if (d.move === 'far') { this.dist = 2; ev.movedBefore = true; }
    let blk = (d.block || 0) + (d.kind === 'defend' ? st.block : 0) + (d.kind === 'move' ? st.evade : 0);
    if (d.fortify) { p.fortify += d.fortify; blk += d.fortify; ev.fortify = d.fortify; }
    if (blk) { p.block += blk; ev.block = blk; parts.push(`+${blk} Block`); AF.sfx('block'); }
    if (d.heal) { const h = Math.min(d.heal, p.max - p.hp); p.hp += h; ev.heal = h; parts.push(`repaired ${h}`); AF.sfx('heal'); }
    if (d.energy) { p.energy += d.energy; ev.energy = d.energy; }
    if (d.selfDmg) { const before = p.hp; p.hp = Math.max(1, p.hp - d.selfDmg); ev.selfDmg = before - p.hp; }
    if (d.charge) { p.charge += d.charge; ev.charge = d.charge; }
    if (d.stun) { this.e.stun = d.stun; ev.stun = true; parts.push('enemy stunned'); }
    if (d.tune) { p.tune += d.tune; ev.tune = d.tune; }
    if (d.thorns) { p.thorns += d.thorns; ev.thorns = d.thorns; }
    if (d.retain) { p.retain = true; ev.retain = true; }
    if (d.field) { p.field += d.field; ev.field = d.field; }
    if (d.salvage) this.salvage += d.salvage;
    if (d.move) parts.push(`now ${AF.RANGE_NAMES[this.dist]}`);
    this.hand.splice(handIdx, 1);
    (d.exhaust ? this.gone : this.discard).push(inst);
    p.combo++;
    let draw = d.draw || 0;
    if (this.con === 'sprocket' && p.combo % 3 === 0) { draw++; ev.momentum = true; parts.push('momentum draw'); }
    if (draw) { this.drawCards(draw); ev.draw = draw; }
    this.say(`${d.name}${parts.length ? ': ' + parts.join(', ') : ''}.`);
    if (!d.dmg && !d.bash && !d.heal && !blk) AF.sfx('card');
    if (this.e.hp <= 0) { this.e.hp = 0; this.over = 'win'; }
    return ev;
  };

  // End of the player's turn: discard, enemy acts. Returns the enemy's event.
  B.beginEnemyTurn = function () {
    if (this.over) return null;
    this.discard.push(...this.hand); this.hand = [];
    return this.enemyTurn();
  };
  B.endTurn = function () { // instant version (used by tests and simulations)
    const ev = this.beginEnemyTurn();
    if (!this.over) this.startTurn();
    return ev;
  };

  B.enemyTurn = function () {
    const e = this.e, it = this.intent(), name = this.def.name;
    e.block = 0;
    if (e.stun) { e.stun--; e.i++; this.say(`${name} is stunned and does nothing.`); return { kind: 'stun' }; }
    const reach = it.r == null ? 2 : it.r;
    if ((it.a === 'hit' || it.a === 'shoot' || it.a === 'drain') && this.dist > reach) {
      this.dist = Math.max(0, this.dist - 1);
      this.say(`${name} is out of reach and closes in (now ${AF.RANGE_NAMES[this.dist]}).`);
      const cev = { kind: 'close' };
      if (this.p.field) { const r = this.hitEnemy(this.p.field); cev.zap = r; this.say(`${name} closes in and gets zapped by your field: ${r.dealt} damage.`); if (e.hp <= 0) { e.hp = 0; this.over = 'win'; } }
      return cev;
    }
    let ev = { kind: it.a };
    switch (it.a) {
      case 'hit': case 'shoot': case 'drain': {
        ev = { kind: 'attack', style: it.a, hits: [] };
        let total = 0;
        const frail = this.con === 'arcwright' && this.dist === 0 ? 2 : 0;
        let back = 0;
        for (let h = 0; h < (it.hits || 1) && !this.over; h++) {
          const r = this.hitPlayer(it.dmg + e.aim + e.power + frail); ev.hits.push(r); total += r.dealt;
          if (this.over) break;
          back += this.p.thorns + (this.con === 'bulwark' && r.dealt === 0 && r.soaked > 0 ? 3 : 0);
        }
        if (back && !this.over) { ev.counter = this.hitEnemy(back); if (e.hp <= 0) { e.hp = 0; this.over = 'win'; } }
        e.aim = 0;
        if (it.a === 'drain') { const before = e.hp; e.hp = Math.min(e.max, e.hp + it.dmg); ev.heal = e.hp - before; }
        this.say(`${name} ${it.a === 'hit' ? 'strikes' : it.a === 'drain' ? 'drains you' : 'fires'}: ${total} damage${it.a === 'drain' ? `, heals ${ev.heal}` : ''}${ev.counter ? `. You strike back for ${ev.counter.dealt}` : ''}.`);
        AF.sfx('hit');
        break;
      }
      case 'block': e.block += it.block; ev.n = it.block; this.say(`${name} raises ${it.block} Block.`); break;
      case 'aim': e.aim += it.dmg; ev.n = it.dmg; this.say(`${name} locks on (+${it.dmg} next attack).`); break;
      case 'retreat': this.dist = Math.min(2, this.dist + 1); e.block += 3; this.say(`${name} backs off to ${AF.RANGE_NAMES[this.dist]}.`); break;
      case 'overcharge': e.power += it.dmg; ev.n = it.dmg; this.say(`${name} overcharges: attacks +${it.dmg} for the rest of the fight.`); break;
    }
    e.i++;
    return ev;
  };

  B.intentText = function () {
    const it = this.intent(), e = this.e;
    if (e.stun) return { text: 'Stunned', tone: 'calm' };
    const dmg = (it.dmg || 0) + e.aim + e.power, x = it.hits > 1 ? ` ×${it.hits}` : '';
    const reach = it.r == null ? 2 : it.r, out = this.dist > reach;
    switch (it.a) {
      case 'hit': return { text: `Strike ${dmg}${x}`, sub: out ? 'Out of reach: will close in' : 'Needs Close', tone: out ? 'calm' : 'danger' };
      case 'shoot': return { text: `Fire ${dmg}${x}`, sub: out ? 'Out of reach: will close in' : reach === 2 ? 'Hits at any range' : 'Reaches Close–Mid', tone: out ? 'calm' : 'danger' };
      case 'drain': return { text: `Drain ${dmg}`, sub: out ? 'Out of reach: will close in' : 'Steals HP · Close–Mid', tone: out ? 'calm' : 'danger' };
      case 'block': return { text: `Shield ${it.block}`, sub: 'Defending', tone: 'calm' };
      case 'aim': return { text: 'Aiming', sub: `+${it.dmg} to next attack`, tone: 'warn' };
      case 'retreat': return { text: 'Retreat', sub: 'Backs away, +3 Block', tone: 'calm' };
      case 'overcharge': return { text: 'Overcharge', sub: `+${it.dmg} damage forever`, tone: 'warn' };
    }
  };

  B.finish = function () {
    const s = this.state, out = { result: this.over, loot: {}, blueprint: null, credits: 0 };
    for (const k of Object.keys(s.pilot.buffs)) { if (--s.pilot.buffs[k] <= 0) delete s.pilot.buffs[k]; }
    if (this.over === 'win') {
      s.hp = this.p.hp;
      if (AF.hasPerk(s, 'medic')) s.hp = Math.min(this.st.maxHp, s.hp + 5);
      // Drops are chances, not guarantees. Drop luck from gear raises every chance.
      const st = AF.stats(s), luck = st.luck, boss = !!this.def.boss;
      for (const [k, [lo, hi]] of Object.entries(this.def.loot)) {
        if (!boss && Math.random() > AF.DROP.material + luck) continue;
        const n = Math.max(1, lo + Math.floor(Math.random() * (hi - lo + 1))); out.loot[k] = n;
      }
      if (this.salvage) out.loot.scrap = (out.loot.scrap || 0) + this.salvage;
      AF.gain(s.res, out.loot);
      if (boss || Math.random() < AF.DROP.money + luck) {
        const [clo, chi] = AF.CREDITS_BY_TIER[this.def.tier];
        out.credits = Math.round((clo + Math.floor(Math.random() * (chi - clo + 1))) * (AF.hasPerk(s, 'salvager') ? 1.25 : 1) * (1 + st.money));
        s.credits += out.credits;
      }
      if (boss || Math.random() < AF.DROP.gear[this.def.tier] + luck / 2) {
        const id = AF.rollGear(this.def.tier, boss);
        const r = AF.giveItem(s, id); out.gear = id; if (r && r.dup) out.dup = r.value;
      }
      out.xp = AF.gainXP(s, AF.XP_BY_TIER[this.def.tier]);
      const locked = AF.lockedCards(s), hunter = AF.hasPerk(s, 'hunter');
      if ((this.def.tier >= 2 || hunter) && locked.length && Math.random() < (hunter ? 0.5 : 0.3)) { out.blueprint = locked[Math.floor(Math.random() * locked.length)]; s.known.push(out.blueprint); }
      s.stats.wins++;
      AF.World.removeEnemy(s, this.ref.id);
      AF.Quests.event(s, 'win', { tier: this.def.tier });
      if (this.def.boss) { AF.Quests.event(s, 'boss', {}); s.won = true; out.boss = true; }
      AF.sfx('win');
    } else {
      s.hp = this.st.maxHp;
      for (const k of AF.RES_KEYS) { const lost = Math.floor(s.res[k] * 0.25); if (lost) { out.loot[k] = -lost; s.res[k] -= lost; } }
      out.credits = -Math.floor(s.credits * 0.25); s.credits += out.credits;
      s.pilot.vit = Math.max(0, s.pilot.vit - 6);
      AF.World.sendHome(s);
      AF.sfx('lose');
    }
    return out;
  };
  AF.Battle = Battle;

  // ---------- Card face (shared with the workshop) ----------
  const KIND = { attack: 'Attack', defend: 'Defend', move: 'Move', repair: 'Repair', tech: 'Tech' };
  AF.cardHtml = function (d, o) {
    o = o || {};
    const range = d.kind === 'attack' ? `<span class="rng">${AF.rangeLabel(d.range)}</span>` : '';
    return `<div class="card k-${d.kind}${o.disabled ? ' off' : ''}${o.selected ? ' sel' : ''}${d.name.endsWith('+') ? ' plus' : ''}${o.cls ? ' ' + o.cls : ''}" ${o.attrs || ''}>
      <span class="cst">${d.cost}</span>
      <b class="nm">${AF.esc(d.name)}</b>
      <span class="kd">${KIND[d.kind]}${range ? ' · ' : ''}${range}</span>
      <span class="tx">${AF.esc(AF.cardText(d, o.st, o.ctx))}</span>
      ${o.reason ? `<span class="why">${AF.esc(o.reason)}</span>` : ''}
      ${o.footer || ''}
    </div>`;
  };

  // ---------- Animated battle screen ----------
  const UI = (AF.BattleUI = { busy: false });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => UI.root.querySelector(s);
  function anim(el, cls, ms) { if (!el) return wait(ms); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); return wait(ms).then(() => el.classList.remove(cls)); }

  UI.start = function (root, b, onOver) {
    UI.root = root; UI.b = b; UI.onOver = onOver; UI.busy = true; UI.shown = new Set();
    const scene = { forest: 'grass', grass: 'grass', lawn: 'grass', path: 'grass', sand: 'sand', water: 'sand', rubble: 'rubble', mountain: 'mountain' }[b.terrain] || 'grass';
    root.innerHTML = `
      <div class="scene sc-${scene}">
        <div class="sky"></div>
        <div class="foe-wrap d${b.dist}"><div class="plat"></div><canvas class="spr foe-spr" data-spr="enemy:${b.ref.type}"></canvas></div>
        <div class="me-wrap"><div class="plat"></div><canvas class="spr pilot-spr" data-spr="pilot:up"></canvas><canvas class="spr bot-spr" data-spr="robot"></canvas></div>
        <div class="infobox foe-box"></div>
        <div class="infobox me-box"></div>
        <canvas class="fx"></canvas>
        <div class="banner"></div>
      </div>
      <div class="msgbar"><p></p><div class="range" aria-label="Distance"></div></div>
      <div class="hand"></div>
      <div class="bt-foot"><span class="piles"></span><button class="btn primary" data-act="end">End turn</button></div>`;
    AF.Pixel.paint(root, b.state);
    FX.init($('.fx'), $('.scene'));
    UI.update();
    (async () => { await UI.banner(b.def.boss ? 'Boss battle!' : 'Battle start'); UI.busy = false; UI.update(); })();
  };

  UI.update = function () {
    const b = UI.b, p = b.p, e = b.e, st = b.state, it = b.intentText();
    const pct = (a, m) => Math.max(0, Math.round((a / m) * 100));
    const hpCls = (a, m) => (a / m > 0.5 ? '' : a / m > 0.2 ? ' mid' : ' low');
    $('.foe-box').innerHTML = `
      <div class="ib-top"><b>${AF.esc(b.def.name)}</b><span>${b.def.boss ? 'BOSS' : 'Lv ' + b.def.tier * 5}</span></div>
      <div class="hp"><em>HP</em><div class="hpbar${hpCls(e.hp, e.max)}"><i style="width:${pct(e.hp, e.max)}%"></i></div></div>
      <div class="ib-sub"><span>${e.hp} / ${e.max}</span>${e.block ? `<span class="blk">Block ${e.block}</span>` : ''}</div>
      <div class="intent t-${it.tone}"><small>Next</small><b>${it.text}</b>${it.sub ? `<span>${it.sub}</span>` : ''}</div>`;
    $('.me-box').innerHTML = `
      <div class="ib-top"><b>${AF.esc(AF.botName(st))}</b>${p.block ? `<span class="blk">Block ${p.block}</span>` : '<span></span>'}</div>
      <div class="hp"><em>HP</em><div class="hpbar${hpCls(p.hp, p.max)}"><i style="width:${pct(p.hp, p.max)}%"></i></div></div>
      <div class="ib-sub"><span>${p.hp} / ${p.max}</span><span class="pips" aria-label="Energy ${p.energy}">${Array.from({ length: Math.max(p.energy, b.st.energy) }, (_, i) => `<i class="${i < p.energy ? 'full' : ''}"></i>`).join('')}</span></div>
      <div class="buffs">${p.charge ? `<span>Charge +${p.charge}</span>` : ''}${p.tune ? `<span>Tuned +${p.tune}</span>` : ''}${p.fortify ? `<span>Fortify ${p.fortify}</span>` : ''}${p.combo && b.con === 'sprocket' ? `<span class="combo">Combo ×${p.combo}</span>` : ''}${p.thorns ? `<span>Thorns ${p.thorns}</span>` : ''}${p.retain ? '<span>Holding Block</span>' : ''}${p.field ? `<span>Field ${p.field}</span>` : ''}${b.mods.tired ? '<span class="bad">Pilot exhausted</span>' : ''}${b.mods.drawEach ? '<span>Focus Tea</span>' : ''}</div>`;
    const fw = $('.foe-wrap'); fw.className = `foe-wrap d${b.dist}`;
    $('.foe-spr').classList.toggle('stun', !!e.stun);
    $('.msgbar p').textContent = b.log[0] || '';
    $('.range').innerHTML = [0, 1, 2].map((i) => `<i class="${b.dist === i ? 'on' : ''}">${AF.RANGE_NAMES[i]}</i>`).join('');
    let n = 0;
    $('.hand').innerHTML = b.hand.map((inst, i) => {
      const why = b.whyNot(inst), fresh = !UI.shown.has(inst.uid);
      if (fresh) UI.shown.add(inst.uid);
      return AF.cardHtml(AF.cardDef(inst), { st: b.st, ctx: { charge: p.charge, tune: p.tune, block: p.block, combo: p.combo, dist: b.dist }, disabled: !!why, reason: why,
        cls: fresh ? 'deal' : '', attrs: `data-play="${i}" role="button" tabindex="0" style="--d:${fresh ? n++ * 70 : 0}ms"` });
    }).join('');
    $('.piles').innerHTML = `Energy <b>${p.energy}</b> · Draw ${b.pile.length} · Discard ${b.discard.length}${b.gone.length ? ` · Used ${b.gone.length}` : ''}`;
    $('[data-act=end]').disabled = UI.busy || !!b.over;
  };

  UI.banner = async function (text) {
    const el = $('.banner'); el.textContent = text;
    await anim(el, 'show', 900);
  };

  const center = (sel) => {
    const el = $(sel), s = $('.scene').getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, w: r.width, h: r.height };
  };

  // Player plays card i
  UI.play = async function (i) {
    const b = UI.b;
    if (UI.busy || b.over) return;
    const inst = b.hand[i], cardEl = UI.root.querySelectorAll('.hand .card')[i];
    if (!inst) return;
    if (b.whyNot(inst)) { anim(cardEl, 'nope', 350); return; }
    UI.busy = true;
    cardEl.classList.add('played');
    await wait(200);
    const ev = b.play(i);
    await animPlayer(ev);
    UI.busy = false;
    if (b.over) return UI.finish();
    UI.update();
  };

  UI.endTurn = async function () {
    const b = UI.b;
    if (UI.busy || b.over) return;
    UI.busy = true;
    UI.root.querySelectorAll('.hand .card').forEach((c, i) => { c.style.setProperty('--d', i * 40 + 'ms'); c.classList.add('discard'); });
    await wait(300);
    const ev = b.beginEnemyTurn();
    UI.update();
    await UI.banner(`${b.def.name}'s turn`);
    await animEnemy(ev);
    UI.update();
    if (b.over) { UI.busy = false; return UI.finish(); }
    await wait(150);
    b.startTurn();
    await UI.banner('Your turn');
    UI.busy = false;
    UI.update();
  };

  async function impact(sel, r, color, big) {
    const c = center(sel), el = $(sel);
    anim(el, 'hit', 380);
    FX.burst(c.x, c.y, ['#ffffff', '#ffd84a', color], big ? 22 : 14, big ? 1.4 : 1);
    if (r.dealt > 0) FX.text(c.x, c.y - c.h * 0.35, '-' + r.dealt, '#ff4a4a', big ? 1.3 : 1);
    if (r.soaked > 0) FX.text(c.x + c.w * 0.25, c.y - c.h * 0.1, `Blocked ${r.soaked}`, '#5aa0ff', 0.75);
    if (r.dealt >= 10 || big) anim($('.scene'), 'shake', 320);
    UI.update();
    await wait(200);
  }

  async function animPlayer(ev) {
    const b = UI.b, core = AF.coreColor(b.state.look), d = ev.card;
    if (ev.combo || ev.momentum) { const m = center('.bot-spr'); FX.text(m.x, m.y - m.h * 0.75, ev.momentum ? `Combo ×${ev.combo || b.p.combo} · Momentum!` : `Combo ×${ev.combo}`, '#ff8a20', 0.9); }
    if (ev.thorns || ev.retain || ev.field) { const m = center('.bot-spr'); FX.ring(m.x, m.y, ev.field ? '#5adcff' : '#ffb020'); }
    if (ev.movedBefore) { const c = center('.foe-spr'); FX.burst(c.x, c.y + c.h * 0.4, ['#e8dcc0', '#cbbd9e'], 10, 0.6); UI.update(); await wait(320); }
    if (ev.hits.length) {
      const melee = d.range === 0 || d.bash;
      for (const r of ev.hits) {
        if (melee) { anim($('.bot-spr'), 'lunge', 420); await wait(190); }
        else { const a = center('.bot-spr'), t = center('.foe-spr'); await FX.bolt(a.x + a.w * 0.3, a.y - a.h * 0.05, t.x, t.y, core, 260); }
        await impact('.foe-spr', r, core, d.dmg >= 15);
      }
    }
    if (ev.movedAfter) { UI.update(); await wait(320); }
    const me = center('.bot-spr');
    if (ev.block) { anim($('.bot-spr'), 'shielded', 700); FX.ring(me.x, me.y, '#5aa0ff'); FX.text(me.x, me.y - me.h * 0.45, `+${ev.block} Block`, '#4a90ff'); await wait(260); }
    if (ev.heal) { FX.rise(me.x, me.y, '#5ee07a'); FX.text(me.x, me.y - me.h * 0.45, `+${ev.heal}`, '#30b850'); await wait(260); }
    if (ev.energy) { FX.burst(me.x, me.y, ['#ffd84a', '#fff6a0'], 12, 0.8); FX.text(me.x, me.y - me.h * 0.5, `+${ev.energy} energy`, '#e0a800'); await wait(200); }
    if (ev.charge || ev.tune || ev.fortify) { anim($('.bot-spr'), 'powered', 700); FX.ring(me.x, me.y, core); FX.text(me.x, me.y - me.h * 0.5, ev.charge ? `Charged +${ev.charge}` : ev.tune ? `Tuned +${ev.tune}` : `Fortify ${ev.fortify}`, '#9058c8'); await wait(260); }
    if (ev.selfDmg) { anim($('.bot-spr'), 'hit', 300); FX.text(me.x, me.y - me.h * 0.3, '-' + ev.selfDmg, '#ff4a4a', 0.8); }
    if (ev.stun) { const t = center('.foe-spr'); FX.zap(t.x, t.y - t.h * 0.2); FX.text(t.x, t.y - t.h * 0.5, 'Stunned!', '#c27bff'); anim($('.foe-spr'), 'wobble', 500); await wait(300); }
    if (ev.draw) await wait(80);
    UI.update();
  }

  async function animEnemy(ev) {
    if (!ev) return;
    const b = UI.b, foe = center('.foe-spr');
    switch (ev.kind) {
      case 'stun': FX.text(foe.x, foe.y - foe.h * 0.5, 'Stunned', '#c27bff'); await anim($('.foe-spr'), 'wobble', 500); break;
      case 'close': case 'retreat': FX.burst(foe.x, foe.y + foe.h * 0.4, ['#e8dcc0', '#cbbd9e'], 12, 0.6); UI.update(); FX.text(foe.x, foe.y - foe.h * 0.5, ev.kind === 'close' ? 'Closes in' : 'Backs off', '#506080', 0.8); await wait(420); if (ev.zap) { await wait(150); const f = center('.foe-spr'); FX.burst(f.x, f.y, ['#ffffff', '#5adcff'], 16, 1); await impact('.foe-spr', ev.zap, '#5adcff'); } break;
      case 'attack':
        for (const r of ev.hits) {
          if (ev.style === 'shoot') { const t = center('.bot-spr'), a = center('.foe-spr'); await FX.bolt(a.x - a.w * 0.3, a.y, t.x, t.y, '#ff5a4a', 280); }
          else { anim($('.foe-spr'), 'lunge-left', 420); await wait(190); }
          await impact('.bot-spr', r, '#ff6a4a', r.dealt >= 14);
        }
        if (ev.counter) { const f = center('.foe-spr'); FX.text(f.x, f.y - f.h * 0.7, 'Counter!', '#ffb020', 0.9); await impact('.foe-spr', ev.counter, '#ffb020'); }
        if (ev.heal) { const f = center('.foe-spr'); FX.rise(f.x, f.y, '#c27bff'); FX.text(f.x, f.y - f.h * 0.5, '+' + ev.heal, '#9a48e0'); await wait(300); }
        break;
      case 'block': anim($('.foe-spr'), 'shielded', 700); FX.ring(foe.x, foe.y, '#5aa0ff'); FX.text(foe.x, foe.y - foe.h * 0.5, `+${ev.n} Block`, '#4a90ff'); await wait(500); break;
      case 'aim': { const t = center('.bot-spr'); FX.reticle(t.x, t.y); FX.text(t.x, t.y - t.h * 0.5, 'Locked on!', '#e0a800'); await wait(700); break; }
      case 'overcharge': anim($('.foe-spr'), 'powered', 800); FX.ring(foe.x, foe.y, '#ff4a4a'); FX.text(foe.x, foe.y - foe.h * 0.5, `Overcharge +${ev.n}`, '#ff4a4a'); await wait(600); break;
    }
  }

  UI.finish = async function () {
    const b = UI.b;
    UI.busy = true; UI.update();
    if (b.over === 'win') {
      const c = center('.foe-spr');
      anim($('.foe-spr'), 'defeat', 900);
      await wait(350);
      FX.burst(c.x, c.y, ['#ffffff', '#ffd84a', '#ff8a3a', AF.ENEMIES[b.ref.type].body], 40, 1.8);
      anim($('.scene'), 'shake', 320);
      await wait(600);
    } else {
      anim($('.bot-spr'), 'defeat', 900);
      await wait(900);
    }
    const out = b.finish();
    UI.onOver(b, out);
  };

  UI.result = function (b, out) {
    const lootRows = Object.entries(out.loot).map(([k, n]) =>
      `<span class="cost"><i class="chip" style="--c:${AF.RES[k].color}"></i>${n > 0 ? '+' : ''}${n} ${AF.RES[k].name}</span>`).join('');
    if (out.result === 'win') return `
      <h2>${out.boss ? 'The Titan Core falls' : 'Victory!'}</h2>
      <p>${out.boss ? 'The lair goes quiet. Head back to Rivet Hollow and tell Mayor Bram.' : `${AF.esc(b.def.name)} scrapped.`}</p>
      <div class="loot"><span class="cost xpgain">+${out.xp} XP</span>${out.credits ? `<span class="cost">${AF.moneyHtml(out.credits)}</span>` : ''}${lootRows}</div>
      ${!out.credits && !lootRows && !out.gear ? '<p class="muted">No drops this time.</p>' : ''}
      ${out.gear ? `<p class="gear-drop" style="--rc:${AF.RARITY[AF.ITEMS[out.gear].rarity].color}">${AF.itemIcon(out.gear)}<span>${out.dup ? 'Duplicate' : 'New outfit piece!'} <b>${AF.esc(AF.ITEMS[out.gear].name)}</b><small>${out.dup ? `Already in your wardrobe, turned into ${AF.moneyText(out.dup)}` : AF.itemText(out.gear) + ' · added to your Wardrobe'}</small></span></p>` : ''}
      ${out.bagFull ? '<p class="muted">Gear dropped, but your bag is full.</p>' : ''}
      ${out.blueprint ? `<p class="bp">Blueprint recovered: <b>${AF.esc(AF.CARDS[out.blueprint].name)}</b></p>` : ''}
      <button class="btn primary" data-act="close-result">Continue</button>`;
    return `
      <h2>Automaton down</h2>
      <p>Your recovery beacon hauled you and your automaton back to ${AF.TOWN_NAME}. Some money and materials were lost on the way, and your pilot is worn out. Banked items are always safe.</p>
      <div class="loot">${out.credits ? `<span class="cost">${AF.moneyHtml(out.credits)}</span>` : ''}${lootRows || (out.credits ? '' : '<span class="muted">Nothing lost.</span>')}</div>
      <button class="btn primary" data-act="close-result">Back to town</button>`;
  };

  // ---------- Battle effects layer ----------
  const FX = (AF.BattleFX = { items: [], running: false });
  FX.init = function (cv, scene) {
    FX.cv = cv; FX.scene = scene; FX.items = [];
    if (!FX.running) { FX.running = true; requestAnimationFrame(FX.loop); }
  };
  FX.loop = function (now) {
    const cv = FX.cv;
    if (!cv || !cv.isConnected || document.querySelector('#battle').hidden) { FX.running = false; return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const dt = Math.min(0.05, (now - (FX.last || now)) / 1000); FX.last = now;
    FX.items = FX.items.filter((it) => it.step(g, dt, now) !== false);
    requestAnimationFrame(FX.loop);
  };
  FX.text = function (x, y, str, color, scale) {
    let t = 0;
    FX.items.push({ step(g, dt) {
      t += dt; if (t > 1.1) return false;
      const k = Math.min(1, t * 6), s = (scale || 1) * (0.6 + 0.4 * k) * (t < 0.15 ? 1.25 - t : 1);
      g.save(); g.globalAlpha = t > 0.75 ? (1.1 - t) / 0.35 : 1;
      g.font = `700 ${Math.round(26 * s)}px Fredoka, Nunito, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.95)'; g.strokeText(str, x, y - t * 40); g.fillStyle = color; g.fillText(str, x, y - t * 40);
      g.restore();
    } });
  };
  FX.burst = function (x, y, cols, n, power) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 160) * (power || 1);
      const p = { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.5 + Math.random() * 0.4, c: cols[i % cols.length], r: 2 + Math.random() * 4 };
      FX.items.push({ step(g, dt) {
        p.life -= dt; if (p.life <= 0) return false;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.vx *= 0.97;
        g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.globalAlpha = 1;
      } });
    }
  };
  FX.rise = function (x, y, col) {
    for (let i = 0; i < 14; i++) {
      const p = { x: x + (Math.random() - 0.5) * 70, y: y + Math.random() * 30, life: 0.9 + Math.random() * 0.4, d: Math.random() * 0.3 };
      FX.items.push({ step(g, dt) {
        if ((p.d -= dt) > 0) return; p.life -= dt; if (p.life <= 0) return false; p.y -= 70 * dt;
        g.globalAlpha = Math.min(1, p.life); g.fillStyle = col; g.fillRect(p.x - 2, p.y - 7, 4, 14); g.fillRect(p.x - 7, p.y - 2, 14, 4); g.globalAlpha = 1;
      } });
    }
  };
  FX.ring = function (x, y, col) {
    let t = 0;
    FX.items.push({ step(g, dt) {
      t += dt; if (t > 0.6) return false;
      g.globalAlpha = 1 - t / 0.6; g.strokeStyle = col; g.lineWidth = 6 * (1 - t / 0.6) + 1;
      g.beginPath(); g.ellipse(x, y, 30 + t * 140, 20 + t * 90, 0, 0, 7); g.stroke(); g.globalAlpha = 1;
    } });
  };
  FX.zap = function (x, y) {
    let t = 0;
    FX.items.push({ step(g, dt) {
      t += dt; if (t > 0.5) return false;
      g.strokeStyle = Math.floor(t * 20) % 2 ? '#ffffff' : '#c27bff'; g.lineWidth = 3;
      for (let k = 0; k < 3; k++) { g.beginPath(); let px = x - 40 + k * 40, py = y - 50; g.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (Math.random() - 0.5) * 24; py += 22; g.lineTo(px, py); } g.stroke(); }
    } });
  };
  FX.reticle = function (x, y) {
    let t = 0;
    FX.items.push({ step(g, dt) {
      t += dt; if (t > 0.9) return false;
      const r = 70 - Math.min(1, t * 3) * 30;
      g.globalAlpha = t > 0.7 ? (0.9 - t) / 0.2 : 1; g.strokeStyle = '#ff4a4a'; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(x - r - 12, y); g.lineTo(x - r + 12, y); g.moveTo(x + r - 12, y); g.lineTo(x + r + 12, y); g.moveTo(x, y - r - 12); g.lineTo(x, y - r + 12); g.moveTo(x, y + r - 12); g.lineTo(x, y + r + 12); g.stroke();
      g.globalAlpha = 1;
    } });
  };
  FX.bolt = function (x0, y0, x1, y1, col, ms) {
    return new Promise((res) => {
      let t = 0; const trail = [];
      FX.items.push({ step(g, dt) {
        t += dt * 1000 / ms;
        const k = Math.min(1, t), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 30;
        trail.push([x, y]); if (trail.length > 10) trail.shift();
        trail.forEach(([tx, ty], i) => { g.globalAlpha = (i + 1) / trail.length * 0.6; g.fillStyle = col; g.beginPath(); g.arc(tx, ty, 3 + i * 0.7, 0, 7); g.fill(); });
        g.globalAlpha = 1;
        const gl = g.createRadialGradient(x, y, 0, x, y, 18); gl.addColorStop(0, '#ffffff'); gl.addColorStop(0.35, col); gl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gl; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill();
        if (k >= 1) { res(); return false; }
      } });
    });
  };
})();
