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

  AF.newGame = function (look, slot, seed) {
    seed = seed || Math.floor(Math.random() * 1e9);
    const parts = { arc: 1, frame: 1, legs: 1, arms: 1, weapon: 1, shield: 1 };
    const known = Object.keys(AF.CARDS).filter((k) => !AF.CARDS[k].bp);
    return AF.upgradeSave({
      version: 3, slot: slot || 1, flags: { robot: false, intro: false }, quests: AF.Quests.fresh(), seed, steps: 0, parts,
      hp: AF.stats(parts).maxHp,
      res: { scrap: 6, copper: 2, silicon: 0, arcite: 0, circuits: 0 },
      cards: AF.STARTER_DECK.map((id) => AF.newCard(id)),
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
    s.flags = s.flags || { robot: false, intro: false };
    s.quests = s.quests || AF.Quests.fresh();
    s.look = s.look || Object.assign(AF.defaultLook('f'), { name: 'Pilot' });
    if (s.credits == null) s.credits = 30;
    s.pilot = Object.assign({ vit: 20, perks: [], buffs: {}, rations: 2 }, s.pilot || {});
    s.bank = s.bank || { credits: 0, res: {} };
    s.unlocks = s.unlocks || [];
    s.stats = Object.assign({ wins: 0, forged: 0 }, s.stats || {});
    s.slot = s.slot || 1;
    return s;
  };

  AF.save = function (state) {
    try { state.saved = Date.now(); localStorage.setItem(slotKey(state.slot), JSON.stringify(state)); return true; } catch (e) { return false; }
  };
  AF.loadSlot = function (n) {
    try {
      const raw = localStorage.getItem(slotKey(n));
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.version >= 1 && s.version <= 3 ? AF.upgradeSave(Object.assign(s, { slot: n })) : null;
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
      if (!s || !s.parts || !(s.version >= 1 && s.version <= 3)) return null;
      s.slot = slot;
      return AF.upgradeSave(s);
    } catch (e) { return null; }
  };

  AF.pilotMaxVit = (s) => 20 + (s.pilot.perks.includes('endurance') ? 10 : 0);
  AF.hasPerk = (s, id) => s.pilot.perks.includes(id);

  // ---------- Resource helpers ----------
  AF.canAfford = (res, cost) => Object.keys(cost).every((k) => (res[k] || 0) >= cost[k]);
  AF.pay = function (res, cost) { Object.keys(cost).forEach((k) => (res[k] -= cost[k])); };
  AF.gain = function (res, add) { Object.keys(add).forEach((k) => (res[k] = (res[k] || 0) + add[k])); };

  // Costs may include credits as well as materials.
  AF.canPay = (s, cost) => Object.keys(cost).every((k) => (k === 'credits' ? s.credits : (s.res[k] || 0)) >= cost[k]);
  AF.payCost = function (s, cost) { Object.keys(cost).forEach((k) => { if (k === 'credits') s.credits -= cost[k]; else s.res[k] -= cost[k]; }); };
  AF.CREDIT_COLOR = '#ffd24a';

  AF.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Resource chips: "<chip> 5"
  // res can be a resource object or a full game state (then credits are checked too).
  AF.costHtml = function (cost, res) {
    const have = (k) => !res ? Infinity : res.res ? (k === 'credits' ? res.credits : res.res[k] || 0) : (res[k] || 0);
    return Object.keys(cost).map((k) => {
      const short = have(k) < cost[k] ? ' short' : '';
      const c = k === 'credits' ? AF.CREDIT_COLOR : AF.RES[k].color, n = k === 'credits' ? 'Cr' : AF.RES[k].name;
      return `<span class="cost${short}"><i class="chip" style="--c:${c}"></i>${cost[k]} ${n}</span>`;
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
