/* ArcForge — card battle rules (Battle) and the battle screen (BattleUI).
   Distance matters: Close / Mid / Far. Melee cards need Close, blasters reach Mid,
   long guns hit anywhere. Enemies show their next move, so you can dodge out of reach. */
(function () {
  const AF = (window.AF = window.AF || {});

  function Battle(state, enemyRef, opts) {
    opts = opts || {};
    const def = AF.ENEMIES[enemyRef.type];
    this.state = state; this.ref = enemyRef; this.def = def;
    this.st = AF.stats(state.parts);
    this.p = { hp: Math.min(state.hp, this.st.maxHp), max: this.st.maxHp, block: 0, energy: 0, charge: 0, tune: 0, fortify: 0 };
    this.e = { hp: def.hp, max: def.hp, block: 0, aim: 0, power: 0, stun: 0, i: 0 };
    this.dist = opts.ambush ? Math.max(0, def.start - 1) : def.start;
    this.pile = AF.shuffle(AF.deckCards(state).map((c) => c));
    this.hand = []; this.discard = []; this.gone = [];
    this.salvage = 0; this.turn = 0; this.over = null; this.log = [];
    this.terrain = AF.World.terrainHere(state) || 'grass';
    // Pilot effects: food buffs, academy perks, exhaustion.
    const buffs = state.pilot.buffs, perk = (id) => AF.hasPerk(state, id);
    this.mods = {
      tired: state.pilot.vit <= 0,
      drawEach: buffs.tea ? 1 : 0,
      firstDraw: perk('tactician') ? 1 : 0,
      firstEnergy: buffs.soda ? 1 : 0,
    };
    if (buffs.hotsauce) this.p.tune += 2;
    if (buffs.oatmeal) this.p.fortify += 4;
    if (opts.ambush) this.say(`Ambush! ${def.name} jumped you.`);
    else this.say(`${def.name} engaged.`);
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
    this.p.block = this.p.fortify;
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

  B.hitEnemy = function (n) {
    const soak = Math.min(this.e.block, n);
    this.e.block -= soak; this.e.hp -= n - soak;
    return n - soak;
  };
  B.hitPlayer = function (n) {
    const soak = Math.min(this.p.block, n);
    this.p.block -= soak; this.p.hp -= n - soak;
    if (this.p.hp <= 0) { this.p.hp = 0; this.over = 'lose'; }
    return n - soak;
  };

  B.play = function (handIdx) {
    const inst = this.hand[handIdx];
    if (!inst || this.whyNot(inst)) return false;
    const d = AF.cardDef(inst), st = this.st, p = this.p;
    p.energy -= d.cost;
    const parts = [];

    if (d.move === 'in' || (d.move === 'close' && d.kind !== 'attack')) this.dist = d.move === 'in' ? Math.max(0, this.dist - 1) : 0;
    if (d.move === 'out') this.dist = Math.min(2, this.dist + 1);

    if (d.dmg || d.bash) {
      const base = (d.bash ? p.block : d.dmg) + st.dmg + p.tune + p.charge;
      p.charge = 0;
      let total = 0;
      for (let h = 0; h < (d.hits || 1); h++) total += this.hitEnemy(base);
      parts.push(`${total} damage`);
      AF.sfx('hit');
    }
    if (d.move === 'close' && d.kind === 'attack') this.dist = 0;
    let blk = (d.block || 0) + (d.kind === 'defend' ? st.block : 0) + (d.kind === 'move' ? st.evade : 0);
    if (d.fortify) { p.fortify += d.fortify; blk += d.fortify; }
    if (blk) { p.block += blk; parts.push(`+${blk} Block`); AF.sfx('block'); }
    if (d.heal) { const h = Math.min(d.heal, p.max - p.hp); p.hp += h; parts.push(`repaired ${h}`); AF.sfx('heal'); }
    if (d.energy) p.energy += d.energy;
    if (d.selfDmg) { p.hp = Math.max(1, p.hp - d.selfDmg); }
    if (d.charge) p.charge += d.charge;
    if (d.stun) { this.e.stun = d.stun; parts.push('enemy stunned'); }
    if (d.tune) p.tune += d.tune;
    if (d.salvage) this.salvage += d.salvage;
    if (d.move) parts.push(`now ${AF.RANGE_NAMES[this.dist]}`);

    this.hand.splice(handIdx, 1);
    (d.exhaust ? this.gone : this.discard).push(inst);
    if (d.draw) this.drawCards(d.draw);
    this.say(`${d.name}${parts.length ? ': ' + parts.join(', ') : ''}.`);
    if (!d.dmg && !d.bash && !d.heal && !blk) AF.sfx('card');
    if (this.e.hp <= 0) { this.e.hp = 0; this.over = 'win'; }
    return true;
  };

  B.endTurn = function () {
    if (this.over) return;
    this.discard.push(...this.hand); this.hand = [];
    this.enemyTurn();
    if (!this.over) this.startTurn();
  };

  B.enemyTurn = function () {
    const e = this.e, it = this.intent(), name = this.def.name;
    e.block = 0;
    if (e.stun) { e.stun--; e.i++; this.say(`${name} is stunned and does nothing.`); return; }
    const reach = it.r == null ? 2 : it.r;
    if ((it.a === 'hit' || it.a === 'shoot' || it.a === 'drain') && this.dist > reach) {
      this.dist = Math.max(0, this.dist - 1);
      this.say(`${name} is out of reach and closes in (now ${AF.RANGE_NAMES[this.dist]}).`);
      return; // keeps the same attack queued for next turn
    }
    switch (it.a) {
      case 'hit': case 'shoot': case 'drain': {
        let total = 0;
        for (let h = 0; h < (it.hits || 1); h++) total += this.hitPlayer(it.dmg + e.aim + e.power);
        e.aim = 0;
        if (it.a === 'drain') { e.hp = Math.min(e.max, e.hp + it.dmg); }
        this.say(`${name} ${it.a === 'hit' ? 'strikes' : it.a === 'drain' ? 'drains you' : 'fires'}: ${total} damage${it.a === 'drain' ? `, heals ${it.dmg}` : ''}.`);
        AF.sfx('hit');
        break;
      }
      case 'block': e.block += it.block; this.say(`${name} raises ${it.block} Block.`); break;
      case 'aim': e.aim += it.dmg; this.say(`${name} locks on (+${it.dmg} next attack).`); break;
      case 'retreat': this.dist = Math.min(2, this.dist + 1); e.block += 3; this.say(`${name} backs off to ${AF.RANGE_NAMES[this.dist]}.`); break;
      case 'overcharge': e.power += it.dmg; this.say(`${name} overcharges: attacks +${it.dmg} for the rest of the fight.`); break;
    }
    e.i++;
  };

  B.intentText = function () {
    const it = this.intent(), e = this.e;
    if (e.stun) return { text: 'Stunned', tone: 'calm' };
    const dmg = (it.dmg || 0) + e.aim + e.power, x = it.hits > 1 ? ` ×${it.hits}` : '';
    const reach = it.r == null ? 2 : it.r;
    const out = this.dist > reach;
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

  // Apply the result to the saved game. Returns a summary for the results screen.
  B.finish = function () {
    const s = this.state, out = { result: this.over, loot: {}, blueprint: null, credits: 0 };
    // Food buffs last a set number of battles.
    for (const k of Object.keys(s.pilot.buffs)) { if (--s.pilot.buffs[k] <= 0) delete s.pilot.buffs[k]; }
    if (this.over === 'win') {
      s.hp = this.p.hp;
      if (AF.hasPerk(s, 'medic')) s.hp = Math.min(this.st.maxHp, s.hp + 5);
      for (const [k, [lo, hi]] of Object.entries(this.def.loot)) {
        const n = lo + Math.floor(Math.random() * (hi - lo + 1));
        if (n) out.loot[k] = n;
      }
      if (this.salvage) out.loot.scrap = (out.loot.scrap || 0) + this.salvage;
      AF.gain(s.res, out.loot);
      const [clo, chi] = AF.CREDITS_BY_TIER[this.def.tier];
      out.credits = Math.round((clo + Math.floor(Math.random() * (chi - clo + 1))) * (AF.hasPerk(s, 'salvager') ? 1.25 : 1));
      s.credits += out.credits;
      const locked = Object.keys(AF.CARDS).filter((id) => !s.known.includes(id));
      const hunter = AF.hasPerk(s, 'hunter');
      if ((this.def.tier >= 2 || hunter) && locked.length && Math.random() < (hunter ? 0.5 : 0.3)) {
        out.blueprint = locked[Math.floor(Math.random() * locked.length)];
        s.known.push(out.blueprint);
      }
      s.stats.wins++;
      AF.World.removeEnemy(s, this.ref.id);
      AF.Quests.event(s, 'win', { tier: this.def.tier });
      if (this.def.boss) AF.Quests.event(s, 'boss', {});
      if (this.def.boss) { s.won = true; out.boss = true; }
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
    return `<div class="card k-${d.kind}${o.disabled ? ' off' : ''}${o.selected ? ' sel' : ''}${d.name.endsWith('+') ? ' plus' : ''}" ${o.attrs || ''}>
      <span class="cst">${d.cost}</span>
      <b class="nm">${AF.esc(d.name)}</b>
      <span class="kd">${KIND[d.kind]}${range ? ' · ' : ''}${range}</span>
      <span class="tx">${AF.esc(AF.cardText(d, o.st, o.ctx))}</span>
      ${o.reason ? `<span class="why">${AF.esc(o.reason)}</span>` : ''}
      ${o.footer || ''}
    </div>`;
  };

  // ---------- Battle screen ----------
  const BattleUI = {};
  BattleUI.render = function (root, b) {
    const it = b.intentText(), p = b.p, e = b.e, st = b.state;
    const pct = (a, m) => Math.max(0, Math.round((a / m) * 100));
    const hpCls = (a, m) => (a / m > 0.5 ? '' : a / m > 0.2 ? ' mid' : ' low');
    const scene = { forest: 'grass', grass: 'grass', lawn: 'grass', path: 'grass', sand: 'sand', water: 'sand', rubble: 'rubble', mountain: 'mountain' }[b.terrain] || 'grass';
    const lv = b.def.boss ? 'BOSS' : `Lv${b.def.tier * 5}`;
    const range = [0, 1, 2].map((i) => `<i class="${b.dist === i ? 'on' : ''}">${AF.RANGE_NAMES[i]}</i>`).join('');
    root.innerHTML = `
      <div class="scene sc-${scene}">
        <div class="infobox foe-box">
          <div class="ib-top"><b>${AF.esc(b.def.name)}</b><span>${lv}</span></div>
          <div class="hp"><em>HP</em><div class="hpbar${hpCls(e.hp, e.max)}"><i style="width:${pct(e.hp, e.max)}%"></i></div></div>
          <div class="ib-sub">${e.hp}/${e.max}${e.block ? ` · <span class="blk">Block ${e.block}</span>` : ''}</div>
          <div class="intent t-${it.tone}"><small>Next</small><b>${it.text}</b>${it.sub ? `<span>${it.sub}</span>` : ''}</div>
        </div>
        <div class="foe-wrap d${b.dist}"><div class="plat"></div><canvas class="spr foe-spr${e.stun ? ' stun' : ''}" data-spr="enemy:${b.ref.type}"></canvas></div>
        <div class="me-wrap"><div class="plat"></div><canvas class="spr pilot-spr" data-spr="pilot:up"></canvas><canvas class="spr bot-spr" data-spr="robot"></canvas></div>
        <div class="infobox me-box">
          <div class="ib-top"><b>${AF.esc(st.look.name)}'s robot</b><span>${p.block ? `<span class="blk">Block ${p.block}</span>` : ''}</span></div>
          <div class="hp"><em>HP</em><div class="hpbar${hpCls(p.hp, p.max)}"><i style="width:${pct(p.hp, p.max)}%"></i></div></div>
          <div class="ib-sub"><span>${p.hp}/${p.max}</span>
            <span class="pips" aria-label="Energy ${p.energy}">${Array.from({ length: Math.max(p.energy, b.st.energy) }, (_, i) => `<i class="${i < p.energy ? 'full' : ''}"></i>`).join('')}</span></div>
          <div class="buffs">${p.charge ? `<span>Charge +${p.charge}</span>` : ''}${p.tune ? `<span>Tuned +${p.tune}</span>` : ''}${p.fortify ? `<span>Fortify ${p.fortify}</span>` : ''}${b.mods.tired ? '<span class="bad">Pilot exhausted</span>' : ''}${b.mods.drawEach ? '<span>Focus Tea</span>' : ''}</div>
        </div>
      </div>
      <div class="msgbar"><p>${AF.esc(b.log[0] || '')}</p><div class="range" aria-label="Distance">${range}</div></div>
      <div class="hand">${b.hand.map((inst, i) => {
        const why = b.whyNot(inst);
        return AF.cardHtml(AF.cardDef(inst), { st: b.st, ctx: { charge: p.charge, tune: p.tune, block: p.block }, disabled: !!why, reason: why, attrs: `data-play="${i}" role="button" tabindex="0"` });
      }).join('')}</div>
      <div class="bt-foot">
        <span class="piles">Energy <b>${p.energy}</b> · Draw ${b.pile.length} · Discard ${b.discard.length}${b.gone.length ? ` · Used ${b.gone.length}` : ''}</span>
        <button class="btn primary" data-act="end">End turn</button>
      </div>`;
    AF.Pixel.paint(root, st);
  };

  BattleUI.result = function (b, out) {
    const lootRows = Object.entries(out.loot).map(([k, n]) =>
      `<span class="cost"><i class="chip" style="--c:${AF.RES[k].color}"></i>${n > 0 ? '+' : ''}${n} ${AF.RES[k].name}</span>`).join('');
    if (out.result === 'win') return `
      <h2>${out.boss ? 'The Titan Core falls' : 'Victory'}</h2>
      <p>${out.boss ? 'The lair goes quiet. The wasteland is yours to rebuild. Keep exploring, or start a new world from the menu.' : `${AF.esc(b.def.name)} scrapped.`}</p>
      <div class="loot"><span class="cost"><i class="chip" style="--c:#ffd24a"></i>+${out.credits} Credits</span>${lootRows}</div>
      ${out.blueprint ? `<p class="bp">Blueprint recovered: <b>${AF.esc(AF.CARDS[out.blueprint].name)}</b></p>` : ''}
      <button class="btn primary" data-act="close-result">Continue</button>`;
    return `
      <h2>Robot down</h2>
      <p>Your recovery beacon hauled you and your robot back to ${AF.TOWN_NAME}. Some credits and materials were lost on the way, and your pilot is worn out. Banked items are always safe.</p>
      <div class="loot">${out.credits ? `<span class="cost"><i class="chip" style="--c:#ffd24a"></i>${out.credits} Credits</span>` : ''}${lootRows || (out.credits ? '' : '<span class="muted">Nothing lost.</span>')}</div>
      <button class="btn primary" data-act="close-result">Back to base</button>`;
  };

  AF.BattleUI = BattleUI;
})();
