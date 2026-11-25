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

  AF.newGame = function (seed) {
    seed = seed || Math.floor(Math.random() * 1e9);
    const parts = { arc: 1, frame: 1, legs: 1, arms: 1, weapon: 1, shield: 1 };
    const known = Object.keys(AF.CARDS).filter((k) => !AF.CARDS[k].bp);
    const state = {
      version: 1,
      seed,
      steps: 0,
      parts,
      hp: AF.stats(parts).maxHp,
      res: { scrap: 6, copper: 2, silicon: 0, arcite: 0, circuits: 0 },
      cards: AF.STARTER_DECK.map((id) => AF.newCard(id)),
      known,
      world: null, // filled by AF.World.generate
      stats: { wins: 0, forged: 0 },
      won: false,
    };
    return state;
  };

  AF.save = function (state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  };
  AF.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.version === 1 ? s : null;
    } catch (e) { return null; }
  };
  AF.clearSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };

  // Save codes let players move a save between devices (or into the desktop build).
  AF.exportCode = (state) => btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  AF.importCode = function (code) {
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      return s && s.version === 1 && s.parts && s.world ? s : null;
    } catch (e) { return null; }
  };

  // ---------- Resource helpers ----------
  AF.canAfford = (res, cost) => Object.keys(cost).every((k) => (res[k] || 0) >= cost[k]);
  AF.pay = function (res, cost) { Object.keys(cost).forEach((k) => (res[k] -= cost[k])); };
  AF.gain = function (res, add) { Object.keys(add).forEach((k) => (res[k] = (res[k] || 0) + add[k])); };

  AF.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Resource chips: "<chip> 5"
  AF.costHtml = function (cost, res) {
    return Object.keys(cost).map((k) => {
      const short = res && (res[k] || 0) < cost[k] ? ' short' : '';
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
