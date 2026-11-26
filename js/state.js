/* ArcForge — game state, save/load, helpers. */
(function () {
  const AF = (window.AF = window.AF || {});
  const SAVE_KEY = 'arcforge.save.v1';

  // Small seeded random generator (mulberry32) so a world seed always builds the same map.
  AF.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  AF.randInt = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  AF.shuffle = function (arr, r) {
    r = r || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let uidCounter = 1;
  AF.newCard = function (id, plus) {
    return { uid: 'c' + Date.now().toString(36) + (uidCounter++), id, plus: !!plus, inDeck: true };
  };

  // ---------- Save slots ----------
  AF.SLOTS = 4;
  const OLD_KEY = 'arcforge.save.v1';
  const slotKey = (n) => 'arcforge.slot.' + n;

  AF.EMPTY_EQUIP = () => ({ hat: null, face: null, top: null, bottom: null, shoes: null, gloves: null, cape: null, tool: null, charm1: null, charm2: null });
  AF.newGame = function (look, slot, seed, outfit, construct) {
    construct = AF.CONSTRUCTS[construct] ? construct : 'sprocket';
    seed = seed || Math.floor(Math.random() * 1e9);
    const parts = { arc: 1, frame: 1, legs: 1, arms: 1, weapon: 1, shield: 1 };
    const known = AF.knownFor(construct);
    return AF.upgradeSave({
      version: 7, construct, slot: slot || 1, flags: { robot: false, intro: false }, quests: AF.Quests.fresh(), seed, steps: 0, parts,
      hp: Math.round(AF.stats(parts).maxHp * AF.CONSTRUCTS[construct].hpMul),
      res: { scrap: 6, copper: 2, silicon: 0, arcite: 0, circuits: 0 }, credits: 300, level: 1, xp: 0,
      owned: [], equip: AF.EMPTY_EQUIP(), presets: [null, null, null], starter: outfit || 'tinker', bot: AF.defaultBot(construct),
      cards: AF.starterDeck(construct).map((id) => AF.newCard(id)),
      known, world: null, look, created: Date.now(),
      stats: { wins: 0, forged: 0 }, won: false,
    });
  };

  // Fill in anything an older save is missing (v1 saves get a fresh map with the new town).
  AF.upgradeSave = function (s) {
    // Older saves keep their robot, cards and materials but move into the new shared world.
    if (s.version < 3) {
      s.version = 3; s.world = null;
      s.flags = { robot: true, intro: true };
      s.quests = Object.assign(AF.Quests.fresh(), { story: 's2', tut: 'declined' });
    }
    // v4: money became Bolts/Gears/Cores (×10), plus levels and gear.
    if (s.version < 4) {
      s.version = 4;
      if (s.credits != null) s.credits *= 10;
      if (s.bank && s.bank.credits) s.bank.credits *= 10;
    }
    // v5: gear became a wearable collection; the robot became a named automaton.
    if (s.version < 5) {
      s.version = 5;
      const old = s.equip || {}, inv = s.inv || [];
      const byUid = (u) => (inv.find((i) => i.uid === u) || {}).id;
      s.owned = [...new Set(inv.map((i) => i.id).filter((id) => AF.ITEMS[id]))];
      s.equip = AF.EMPTY_EQUIP();
      Object.values(old).forEach((u) => { const id = byUid(u); if (id) AF.wear(s, id); });
      delete s.inv; s.starter = 'tinker';
      const L = s.look || {};
      if (L.eyes == null) Object.assign(L, { hair: Math.min(L.hair || 0, AF.LOOK.hair.length - 1), eyes: 0, eyeColor: 0 });
    }
    s.level = s.level || 1; s.xp = s.xp || 0;
    s.owned = s.owned || []; s.equip = Object.assign(AF.EMPTY_EQUIP(), s.equip || {}); s.presets = s.presets || [null, null, null];
    if (s.starter !== 'given') {
      // Starter clothes: the base wardrobe plus the outfit picked in the creator, worn right away.
      const kit = Array.isArray(s.starter) ? s.starter.filter((id) => AF.ITEMS[id]) : (AF.STARTER_OUTFITS[s.starter] || AF.STARTER_OUTFITS.tinker).items;
      [...AF.BASE_WARDROBE, ...kit].forEach((id) => { if (!s.owned.includes(id)) s.owned.push(id); });
      if (!AF.equippedIds(s).some((id) => AF.ITEMS[id].slot !== 'charm')) {
        kit.forEach((id) => { s.equip[AF.ITEMS[id].slot] = id; });
        if (!s.equip.top) s.equip.top = 'basic_tee';
      }
      s.starter = 'given';
    }
    // v6: Constructs. Older saves pick one the next time they play (see AF.setConstruct).
    if (s.version < 6) { s.version = 6; s.construct = s.construct || null; (s.cards || []).forEach((c) => { if (c.id === 'bulwark') c.id = 'ironwall'; }); }
    // v7: the world was redrawn (bigger map, Brasshaven, the Sunken Foundry). Old positions don't fit, so start fresh in Rivet Hollow.
    if (s.version < 7) { s.version = 7; if (s.world && s.world.v !== 2) s.world = null; }
    s.cards = (s.cards || []).filter((c) => AF.CARDS[c.id]);
    s.bot = Object.assign(AF.defaultBot(s.construct), s.bot || {});
    s.flags = s.flags || { robot: false, intro: false };
    s.quests = s.quests || AF.Quests.fresh();
    s.look = s.look || Object.assign(AF.defaultLook('f'), { name: 'Pilot' });
    if (s.credits == null) s.credits = 300;
    s.pilot = Object.assign({ vit: 20, perks: [], buffs: {}, rations: 2, lures: { lure: 2 } }, s.pilot || {});
    s.stats = Object.assign({ wins: 0, forged: 0 }, s.stats || {}); s.ach = s.ach || {};
    // v8: far fewer roaming bots (battles now also come from disturbances, Bounty Boards and lures).
    if ((s.version || 0) < 8) {
      s.version = 8;
      const w = s.world, list = w && ((w.area || 'over') === 'over' ? w : w.store && w.store.over);
      if (list && list.enemies) { let n = 0; list.enemies = list.enemies.filter((e) => e.boss || e.bounty || n++ < AF.ROAMERS); }
    }
    s.bank = s.bank || { credits: 0, res: {} };
    s.unlocks = s.unlocks || [];
    s.stats = Object.assign({ wins: 0, forged: 0 }, s.stats || {});
    s.slot = s.slot || 1;
    return s;
  };

  AF.SAVE_VERSION = 8;   // bump with every save-format change (loadSlot and save codes accept up to this)
  AF.save = function (state) {
    try { state.saved = Date.now(); localStorage.setItem(slotKey(state.slot), JSON.stringify(state)); return true; } catch (e) { return false; }
  };
  AF.loadSlot = function (n) {
    try {
      const raw = localStorage.getItem(slotKey(n));
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.version >= 1 && s.version <= AF.SAVE_VERSION ? AF.upgradeSave(Object.assign(s, { slot: n })) : null;
    } catch (e) { return null; }
  };
  AF.deleteSlot = function (n) { try { localStorage.removeItem(slotKey(n)); } catch (e) {} };
  AF.listSlots = function () { const out = []; for (let n = 1; n <= AF.SLOTS; n++) out.push(AF.loadSlot(n)); return out; };
  // Move a save from the first version into slot 1.
  AF.migrateOldSave = function () {
    try {
      const raw = localStorage.getItem(OLD_KEY);
      if (!raw) return;
      if (!localStorage.getItem(slotKey(1))) localStorage.setItem(slotKey(1), raw);
      localStorage.removeItem(OLD_KEY);
    } catch (e) {}
  };

  // Save codes let players move a save between devices (or into the desktop build).
  AF.exportCode = (state) => btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  AF.importCode = function (code, slot) {
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!s || !s.parts || !(s.version >= 1 && s.version <= AF.SAVE_VERSION)) return null;
      s.slot = slot;
      return AF.upgradeSave(s);
    } catch (e) { return null; }
  };

  AF.pilotMaxVit = (s) => 20 + (s.pilot.perks.includes('endurance') ? 10 : 0) + AF.stats(s).vit;
  AF.hasPerk = (s, id) => s.pilot.perks.includes(id);

  // ---------- Resource helpers ----------
  AF.canAfford = (res, cost) => Object.keys(cost).every((k) => (res[k] || 0) >= cost[k]);
  AF.pay = function (res, cost) { Object.keys(cost).forEach((k) => (res[k] -= cost[k])); };
  AF.gain = function (res, add) { Object.keys(add).forEach((k) => (res[k] = (res[k] || 0) + add[k])); };

  // Costs may include credits as well as materials.
  AF.canPay = (s, cost) => Object.keys(cost).every((k) => (k === 'credits' ? s.credits : (s.res[k] || 0)) >= cost[k]);
  AF.payCost = function (s, cost) { Object.keys(cost).forEach((k) => { if (k === 'credits') s.credits -= cost[k]; else s.res[k] -= cost[k]; }); };

  AF.shadeHex = function (c, amt) {
    const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    return '#' + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  AF.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Resource chips: "<chip> 5"
  // res can be a resource object or a full game state (then credits are checked too).
  AF.costHtml = function (cost, res) {
    const have = (k) => !res ? Infinity : res.res ? (k === 'credits' ? res.credits : res.res[k] || 0) : (res[k] || 0);
    return Object.keys(cost).map((k) => {
      const short = have(k) < cost[k] ? ' short' : '';
      if (k === 'credits') return `<span class="cost${short}">${AF.moneyHtml(cost[k])}</span>`;
      return `<span class="cost${short}"><i class="chip" style="--c:${AF.RES[k].color}"></i>${cost[k]} ${AF.RES[k].name}</span>`;
    }).join('');
  };

  AF.deckCards = (state) => state.cards.filter((c) => c.inDeck);

  // ---------- Tiny sound effects (WebAudio, no files needed) ----------
  let ctx = null;
  AF.muted = false;
  AF.sfx = function (type) {
    if (AF.muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const presets = {
        step: [180, 0.03, 'square', 0.02], gather: [660, 0.08, 'triangle', 0.06],
        card: [440, 0.06, 'triangle', 0.05], hit: [120, 0.12, 'sawtooth', 0.08],
        block: [300, 0.1, 'square', 0.04], heal: [880, 0.15, 'sine', 0.05],
        win: [990, 0.3, 'triangle', 0.07], lose: [90, 0.4, 'sawtooth', 0.07],
        forge: [520, 0.2, 'square', 0.05], bump: [70, 0.06, 'square', 0.04],
      };
      const [f, d, w, v] = presets[type] || presets.card;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = w; o.frequency.value = f;
      o.frequency.exponentialRampToValueAtTime(Math.max(40, f * (type === 'win' || type === 'heal' ? 1.6 : 0.6)), ctx.currentTime + d);
      g.gain.value = v; g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
    } catch (e) {}
  };
})();

// Give an older save its Construct: new 30-card starter deck in the deck, old cards it can still use go to storage,
// cards for other constructs are traded in for Bolts.
window.AF.setConstruct = function (s, con) {
  const AF = window.AF;
  s.construct = con;
  let refund = 0;
  s.cards = s.cards.filter((c) => { if (AF.canUse(s, c.id)) { c.inDeck = false; return true; } refund += Math.round(AF.Town.cardValue(c.id) * 0.5); return false; });
  s.cards.push(...AF.starterDeck(con).map((id) => AF.newCard(id)));
  s.known = [...new Set([...s.known.filter((id) => AF.CARDS[id] && AF.canUse(s, id)), ...AF.knownFor(con)])];
  s.credits += refund;
  s.hp = AF.stats(s).maxHp;
  return refund;
};
