/* Automata: ArcForge — card looks: art, rarity, frames, finishes, card backs and the achievements that unlock them.
   Rarity is cosmetic (it never changes a card's numbers). Card art comes from assets/cards/manifest.js;
   any card without an image gets a painted emblem drawn here. */
(function () {
  const AF = (window.AF = window.AF || {});

  // ---------- Rarity (looks only) ----------
  AF.RARITIES = [
    ['common', 'Common', '#9a9488'], ['uncommon', 'Uncommon', '#5aa860'], ['rare', 'Rare', '#4a8ce0'],
    ['epic', 'Epic', '#a060e0'], ['legendary', 'Legendary', '#f0a030'],
  ];
  const RAR = {
    uncommon: ['piston', 'rail', 'scatter', 'salvager', 'dash', 'counter', 'bash', 'spikes', 'hold', 'rampart', 'slam', 'ironwall', 'jab', 'flurry', 'spinkick', 'ratchet', 'zip', 'slipstream', 'revup', 'arcbolt', 'volley', 'chargeshot', 'repulse', 'kite', 'static', 'capacitor'],
    rare: ['deflector', 'magnet', 'weld', 'nano', 'tune', 'fortify', 'finisher'],
    epic: ['overclock', 'emp', 'aegis', 'vengeance', 'turbo', 'chain', 'tesla', 'blink'],
    legendary: ['unbreak', 'whirl', 'lance'],
  };
  AF.cardRarity = (id) => Object.keys(RAR).find((r) => RAR[r].includes(id)) || 'common';
  AF.rarityName = (r) => (AF.RARITIES.find((x) => x[0] === r) || AF.RARITIES[0])[1];

  // ---------- Cosmetics ----------
  AF.CARD_FRAMES = [['iron', 'Ironbound'], ['brass', 'Polished Brass'], ['copper', 'Verdigris Copper'], ['runestone', 'Runestone'], ['clockwork', 'Clockwork'],
    ['verdant', 'Wildwood'], ['obsidian', 'Obsidian'], ['gilded', 'Gilded'], ['royal', 'Titan Royal']];
  AF.CARD_FINISHES = [['none', 'Plain'], ['holo', 'Holo Shimmer'], ['embers', 'Embers'], ['frost', 'Frost'], ['arc', 'Arc Lightning'], ['goldleaf', 'Gold Leaf'], ['prism', 'Prism'], ['starfield', 'Starfield']];
  AF.CARD_BACKS = [['standard', 'Forge Seal'], ['cog', 'Cogwheel'], ['rune', 'Rune Circle'], ['ember', 'Ember Crest'], ['starmap', 'Star Map'], ['royal', 'Royal Titan']];
  const FREE = { frame: 'iron', finish: 'none', back: 'standard' };
  AF.cardStyle = (s) => Object.assign({}, FREE, (s && s.cardStyle) || {});

  // ---------- Achievements ----------
  // each: [id, name, description, unlock {frame|finish|back: key}, test(state) or counter goal]
  AF.ACHIEVEMENTS = [
    { id: 'first_win', name: 'First Spark', text: 'Win your first battle.', unlock: { back: 'cog' }, stat: 'wins', goal: 1 },
    { id: 'wins10', name: 'Scrap Brawler', text: 'Win 10 battles.', unlock: { frame: 'brass' }, stat: 'wins', goal: 10 },
    { id: 'wins50', name: 'Veteran Pilot', text: 'Win 50 battles.', unlock: { finish: 'embers' }, stat: 'wins', goal: 50 },
    { id: 'wins150', name: 'Bot Breaker', text: 'Win 150 battles.', unlock: { frame: 'obsidian' }, stat: 'wins', goal: 150 },
    { id: 'flawless', name: 'Not a Scratch', text: 'Win a battle without losing any HP.', unlock: { finish: 'frost' }, stat: 'flawless', goal: 1 },
    { id: 'bighit', name: 'Heavy Hitter', text: 'Deal 20 or more damage with a single card.', unlock: { finish: 'arc' }, stat: 'bestHit', goal: 20 },
    { id: 'combo5', name: 'Chain Reaction', text: 'Play 5 cards in one turn.', unlock: { frame: 'clockwork' }, stat: 'bestTurn', goal: 5 },
    { id: 'hot10', name: 'Trouble Seeker', text: 'Clear 10 disturbances in the wild.', unlock: { frame: 'verdant' }, stat: 'hotspots', goal: 10 },
    { id: 'lure5', name: 'Bait and Bolt', text: 'Win 5 battles started with a lure.', unlock: { frame: 'copper' }, stat: 'lures', goal: 5 },
    { id: 'bounty1', name: 'Wanted', text: 'Complete a bounty from a Bounty Board.', unlock: { back: 'ember' }, stat: 'bounties', goal: 1 },
    { id: 'bounty10', name: 'Bounty Hunter', text: 'Complete 10 bounties.', unlock: { finish: 'goldleaf' }, stat: 'bounties', goal: 10 },
    { id: 'forge10', name: 'Smith', text: 'Forge 10 cards.', unlock: { back: 'rune' }, stat: 'forged', goal: 10 },
    { id: 'upgrade5', name: 'Tempered', text: 'Upgrade 5 cards.', unlock: { frame: 'runestone' }, stat: 'upgraded', goal: 5 },
    { id: 'blueprints', name: 'Archivist', text: 'Learn every card for your Construct.', unlock: { finish: 'prism' }, test: (s) => s.construct && AF.lockedCards(s).length === 0 },
    { id: 'explorer', name: 'Cartographer', text: 'Explore half of the overworld map.', unlock: { back: 'starmap' }, test: (s) => explored(s) >= 50 },
    { id: 'level10', name: 'Seasoned', text: 'Reach pilot level 10.', unlock: { finish: 'holo' }, test: (s) => s.level >= 10 },
    { id: 'collector', name: 'Fashion Forward', text: 'Collect 30 outfit pieces.', unlock: { back: 'royal' }, test: (s) => (s.owned || []).length >= 30 },
    { id: 'warden', name: 'Foundry Breaker', text: 'Defeat the Clockwork Warden.', unlock: { frame: 'gilded' }, test: (s) => (s.stats.bosses || []).includes('warden') },
    { id: 'titan', name: 'Titanfall', text: 'Defeat the Titan.', unlock: { frame: 'royal', finish: 'starfield' }, test: (s) => !!s.won || (s.stats.bosses || []).includes('titan') },
  ];
  function explored(s) {
    const w = s.world; if (!w) return 0;
    const fog = (w.area || 'over') === 'over' ? w.fog : w.store && w.store.over && w.store.over.fog;
    return fog ? Math.round(((fog.split('1').length - 1) / fog.length) * 100) : 0;
  }
  AF.achProgress = function (s, a) {
    if (a.test) return { done: !!a.test(s), cur: null, goal: null };
    const cur = (s.stats && s.stats[a.stat]) || 0;
    return { done: cur >= a.goal, cur: Math.min(cur, a.goal), goal: a.goal };
  };
  AF.unlockText = (u) => Object.entries(u).map(([k, v]) => {
    const list = k === 'frame' ? AF.CARD_FRAMES : k === 'finish' ? AF.CARD_FINISHES : AF.CARD_BACKS;
    return `${(list.find((x) => x[0] === v) || [v, v])[1]} ${k === 'back' ? 'card back' : k}`;
  }).join(' + ');
  AF.unlocked = function (s, kind, key) {
    if (key === FREE[kind]) return true;
    return AF.ACHIEVEMENTS.some((a) => a.unlock[kind] === key && (s.ach || {})[a.id]);
  };
  // Check every achievement; returns the ones newly earned (and records them).
  AF.checkAchievements = function (s) {
    if (!s || !s.stats) return [];
    s.ach = s.ach || {};
    const fresh = [];
    for (const a of AF.ACHIEVEMENTS) {
      if (s.ach[a.id]) continue;
      if (AF.achProgress(s, a).done) { s.ach[a.id] = Date.now(); fresh.push(a); }
    }
    return fresh;
  };
  AF.bumpStat = (s, k, n) => { s.stats[k] = (s.stats[k] || 0) + (n == null ? 1 : n); };
  AF.maxStat = (s, k, v) => { s.stats[k] = Math.max(s.stats[k] || 0, v); };

  // ---------- Card art: image from the manifest, or a painted emblem ----------
  const KCOL = { attack: '#d8503a', defend: '#3f78d8', move: '#1aa6b4', repair: '#38a860', tech: '#8a54d4' };
  const ICON = {
    claw: 'claw', blaster: 'beam', arcbolt: 'beam', rail: 'rail', ratchet: 'beam', chargeshot: 'orb', lance: 'rail',
    brace: 'shield', deflector: 'shield', ironwall: 'wall', aegis: 'aegis', unbreak: 'wall', hold: 'shield', spikes: 'spikes',
    advance: 'fwd', zip: 'fwd', dash: 'fwd', rampart: 'fwd', retreat: 'back', kite: 'back', blink: 'blink', slipstream: 'back',
    patch: 'wrench', weld: 'torch', nano: 'nano', scan: 'eye',
    piston: 'fist', jab: 'fist', spinkick: 'spin', bash: 'fist', vengeance: 'ram', slam: 'ram', counter: 'counter',
    scatter: 'burst', volley: 'burst', flurry: 'gears', whirl: 'spin', salvager: 'claw', magnet: 'magnet',
    overclock: 'gauge', revup: 'gauge', turbo: 'gauge', emp: 'emp', static: 'bolt', tesla: 'tesla', tune: 'gear', capacitor: 'battery', fortify: 'gear',
    repulse: 'wave', finisher: 'star', chain: 'chain',
  };
  const sh = (c, a) => (AF.shadeHex ? AF.shadeHex(c, a) : c);
  const INK = '#140e0a';
  const icons = {
    claw: (c) => [0, 1, 2].map((i) => `<path d="M${42 + i * 12} 14 Q${58 + i * 12} 36 ${46 + i * 12} 60" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${42 + i * 12} 14 Q${58 + i * 12} 36 ${46 + i * 12} 60" fill="none" stroke="#fff4e0" stroke-width="4.5" stroke-linecap="round"/>`).join('') + `<path d="M36 20 Q52 40 40 62" fill="none" stroke="${c}" stroke-width="2" opacity=".8"/>`,
    beam: (c) => `<path d="M14 40 L84 34 L84 44 Z" fill="${c}" opacity=".45"/><rect x="18" y="35" width="66" height="8" rx="4" fill="#fff6dc" stroke="${INK}" stroke-width="2.5"/><circle cx="88" cy="39" r="12" fill="${c}" stroke="${INK}" stroke-width="3"/><circle cx="88" cy="39" r="6" fill="#fff"/>${[[24, 28], [36, 50], [52, 26], [64, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff4c0"/>`).join('')}`,
    rail: (c) => `<rect x="8" y="33" width="104" height="10" rx="5" fill="${c}" opacity=".35"/><rect x="10" y="36" width="100" height="4" rx="2" fill="#fff"/><path d="M20 30 h80 M20 46 h80" stroke="${c}" stroke-width="2" stroke-dasharray="6 5"/><path d="M96 24 l14 14 l-14 14" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M96 24 l14 14 l-14 14" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>`,
    orb: (c) => `<circle cx="60" cy="38" r="24" fill="${c}" opacity=".3"/><circle cx="60" cy="38" r="16" fill="${c}" stroke="${INK}" stroke-width="3"/><circle cx="60" cy="38" r="8" fill="#fff"/>${[0, 1, 2, 3, 4, 5].map((i) => { const a = i * 1.047; return `<path d="M${60 + Math.cos(a) * 20} ${38 + Math.sin(a) * 20} L${60 + Math.cos(a) * 29} ${38 + Math.sin(a) * 29}" stroke="#fff4c0" stroke-width="2.5" stroke-linecap="round"/>`; }).join('')}`,
    shield: (c) => `<path d="M60 10 L86 18 Q86 48 60 64 Q34 48 34 18 Z" fill="${sh(c, -10)}" stroke="${INK}" stroke-width="3.5"/><path d="M60 16 L80 22 Q80 46 60 58 Z" fill="${sh(c, 25)}" opacity=".6"/><circle cx="60" cy="34" r="7" fill="#d8c08a" stroke="${INK}" stroke-width="2.5"/>${[[42, 22], [78, 22], [60, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#e8d8b0"/>`).join('')}`,
    wall: (c) => `<rect x="26" y="16" width="68" height="44" rx="4" fill="${sh(c, -12)}" stroke="${INK}" stroke-width="3.5"/>${[0, 1, 2].map((r) => [0, 1, 2].map((k) => `<rect x="${29 + k * 21 + (r % 2) * 8}" y="${19 + r * 13}" width="${r % 2 && k === 2 ? 10 : 19}" height="11" rx="1.5" fill="${sh(c, 10 + r * 6)}" stroke="${INK}" stroke-width="1.2"/>`).join('')).join('')}<path d="M26 16 h68" stroke="#fff" stroke-width="2" opacity=".4"/>`,
    aegis: (c) => `<ellipse cx="60" cy="38" rx="40" ry="26" fill="none" stroke="${c}" stroke-width="3" opacity=".7"/><ellipse cx="60" cy="38" rx="32" ry="20" fill="${c}" opacity=".18"/>` + icons.shield(c),
    spikes: (c) => icons.shield(c) + [[34, 18, 22, 10], [86, 18, 98, 10], [34, 34, 20, 34], [86, 34, 100, 34], [60, 64, 60, 72]].map(([x, y, x2, y2]) => `<path d="M${x} ${y - 4} L${x2} ${y2} L${x} ${y + 4} Z" fill="#cfc6b8" stroke="${INK}" stroke-width="2"/>`).join(''),
    fwd: (c) => [0, 1, 2].map((i) => `<path d="M${30 + i * 20} 18 L${50 + i * 20} 38 L${30 + i * 20} 58" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="${0.5 + i * 0.25}"/><path d="M${30 + i * 20} 18 L${50 + i * 20} 38 L${30 + i * 20} 58" fill="none" stroke="${i === 2 ? '#fff' : sh(c, 30)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="${0.5 + i * 0.25}"/>`).join(''),
    back: (c) => [0, 1, 2].map((i) => `<path d="M${90 - i * 20} 18 L${70 - i * 20} 38 L${90 - i * 20} 58" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="${0.5 + i * 0.25}"/><path d="M${90 - i * 20} 18 L${70 - i * 20} 38 L${90 - i * 20} 58" fill="none" stroke="${i === 2 ? '#fff' : sh(c, 30)}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="${0.5 + i * 0.25}"/>`).join('') + `<ellipse cx="96" cy="60" rx="14" ry="4" fill="#d8c8a0" opacity=".4"/>`,
    blink: (c) => `<circle cx="38" cy="40" r="14" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="4 4"/><circle cx="84" cy="36" r="16" fill="${c}" opacity=".35"/><circle cx="84" cy="36" r="9" fill="#fff" stroke="${INK}" stroke-width="2.5"/><path d="M50 40 Q62 28 72 36" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 4" stroke-linecap="round"/>`,
    wrench: (c) => `<g transform="rotate(-35 60 38)"><rect x="54" y="20" width="12" height="44" rx="5" fill="#b8b0a4" stroke="${INK}" stroke-width="3"/><path d="M48 8 h24 v14 h-6 v-6 h-12 v6 h-6 z" fill="#c8c0b4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g><path d="M80 44 h14 M87 37 v14" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M80 44 h14 M87 37 v14" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
    torch: (c) => `<rect x="30" y="38" width="40" height="12" rx="4" fill="#8a7a64" stroke="${INK}" stroke-width="3"/><rect x="68" y="40" width="10" height="8" fill="#5a5048" stroke="${INK}" stroke-width="2"/><path d="M78 44 Q94 34 104 44 Q94 54 78 44 Z" fill="#ffb040" stroke="${INK}" stroke-width="2"/><path d="M80 44 Q92 39 98 44 Q92 49 80 44 Z" fill="#fff4c0"/>${[[96, 30], [104, 56], [90, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#ffd060"/>`).join('')}`,
    nano: (c) => [[40, 26], [58, 18], [76, 28], [50, 44], [70, 46], [86, 40], [60, 58], [36, 52]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${4 + (i % 3)}" fill="${sh(c, 20)}" stroke="${INK}" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>`).join('') + `<path d="M54 34 h12 M60 28 v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    eye: (c) => `<path d="M24 38 Q60 6 96 38 Q60 70 24 38 Z" fill="#f2ead8" stroke="${INK}" stroke-width="3.5"/><circle cx="60" cy="38" r="13" fill="${c}" stroke="${INK}" stroke-width="2.5"/><circle cx="60" cy="38" r="6" fill="${INK}"/><circle cx="64" cy="34" r="2.6" fill="#fff"/><path d="M14 22 Q8 38 14 54 M106 22 Q112 38 106 54" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    fist: (c) => `<path d="M14 32 h22 M10 42 h26 M16 52 h20" stroke="#e8dcc0" stroke-width="3" stroke-linecap="round" opacity=".6"/><rect x="38" y="22" width="40" height="34" rx="9" fill="#a8a094" stroke="${INK}" stroke-width="3.5"/>${[0, 1, 2, 3].map((i) => `<rect x="${76}" y="${23 + i * 8}" width="14" height="8" rx="3.5" fill="#c8c0b4" stroke="${INK}" stroke-width="2.2"/>`).join('')}<rect x="44" y="28" width="22" height="7" rx="3" fill="${c}"/><path d="M96 30 l8 -6 M98 40 h10 M96 50 l8 6" stroke="#fff4c0" stroke-width="3" stroke-linecap="round"/>`,
    ram: (c) => icons.fist(c) + `<circle cx="60" cy="40" r="30" fill="none" stroke="${c}" stroke-width="2" opacity=".5"/>`,
    counter: (c) => `<path d="M30 54 Q60 4 90 54" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M30 54 Q60 4 90 54" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M82 44 L92 56 L78 58" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M82 44 L92 56 L78 58" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` + `<g transform="translate(-14 8) scale(.6)">${icons.shield(c)}</g>`,
    spin: (c) => `<circle cx="60" cy="38" r="26" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="10 6"/><path d="M60 12 A26 26 0 0 1 86 38" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M80 30 L87 39 L94 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="38" r="10" fill="#b8b0a4" stroke="${INK}" stroke-width="3"/>`,
    burst: (c) => [[-22, -14], [-8, -20], [8, -18], [22, -10], [-16, 6], [16, 8]].map(([dx, dy]) => `<path d="M30 52 L${60 + dx} ${38 + dy}" stroke="${c}" stroke-width="2" opacity=".5"/><circle cx="${60 + dx}" cy="${38 + dy}" r="5" fill="#fff6d0" stroke="${INK}" stroke-width="2"/>`).join('') + `<circle cx="30" cy="52" r="8" fill="${c}" stroke="${INK}" stroke-width="2.5"/>`,
    gears: (c) => gear(46, 40, 16, '#b8a88a') + gear(76, 30, 11, sh(c, 10)) + gear(80, 56, 8, '#a8a094'),
    gear: (c) => gear(60, 38, 22, sh(c, 5)) + `<circle cx="60" cy="38" r="7" fill="#fff4d8" stroke="${INK}" stroke-width="2"/>`,
    magnet: (c) => `<path d="M36 14 V40 Q36 62 60 62 Q84 62 84 40 V14 H70 V40 Q70 48 60 48 Q50 48 50 40 V14 Z" fill="#c84a3a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><rect x="36" y="14" width="14" height="10" fill="#d8d0c4" stroke="${INK}" stroke-width="2.5"/><rect x="70" y="14" width="14" height="10" fill="#d8d0c4" stroke="${INK}" stroke-width="2.5"/>${[0, 1].map((i) => `<path d="M${22 - i * 8} ${16 + i * 2} Q${10 - i * 8} 38 ${22 - i * 8} ${60 - i * 2}" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>`).join('')}`,
    gauge: (c) => `<circle cx="60" cy="42" r="26" fill="#2a2420" stroke="${INK}" stroke-width="3.5"/><path d="M38 52 A24 24 0 0 1 82 52" fill="none" stroke="${c}" stroke-width="5"/><path d="M70 30 A24 24 0 0 1 82 52" fill="none" stroke="#ff5a3a" stroke-width="5"/><path d="M60 42 L78 30" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="60" cy="42" r="4" fill="#d8c08a"/>`,
    emp: (c) => [12, 22, 32].map((r, i) => `<circle cx="60" cy="38" r="${r}" fill="none" stroke="${c}" stroke-width="${4 - i}" opacity="${1 - i * 0.25}"/>`).join('') + icons.bolt(c, 0.6),
    bolt: (c, k) => { k = k || 1; return `<g transform="translate(${60 - 60 * k} ${38 - 38 * k}) scale(${k})"><path d="M66 6 L44 42 H58 L50 70 L78 30 H64 L72 6 Z" fill="#fff2a0" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M66 10 L50 40 H60" fill="none" stroke="${c}" stroke-width="2"/></g>`; },
    tesla: (c) => `<rect x="52" y="34" width="16" height="30" rx="3" fill="#8a7a64" stroke="${INK}" stroke-width="3"/>${[40, 46, 52].map((y) => `<rect x="49" y="${y}" width="22" height="3" fill="#c88a40"/>`).join('')}<circle cx="60" cy="26" r="11" fill="#c8c0b4" stroke="${INK}" stroke-width="3"/><path d="M50 22 L34 14 L40 26 L24 22 M70 22 L86 12 L82 26 L98 20" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M50 22 L34 14 L40 26 L24 22 M70 22 L86 12 L82 26 L98 20" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>`,
    battery: (c) => `<rect x="36" y="16" width="48" height="44" rx="6" fill="#3a3430" stroke="${INK}" stroke-width="3.5"/><rect x="52" y="10" width="16" height="8" rx="2" fill="#a8a094" stroke="${INK}" stroke-width="2.5"/>${[0, 1, 2].map((i) => `<rect x="42" y="${48 - i * 13}" width="36" height="9" rx="2" fill="${i < 2 ? c : sh(c, -40)}"/>`).join('')}<path d="M64 20 L54 36 H62 L56 50" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>`,
    wave: (c) => [0, 1, 2].map((i) => `<path d="M${50 + i * 14} ${14 - i * 2} Q${66 + i * 16} 38 ${50 + i * 14} ${62 + i * 2}" fill="none" stroke="${i ? c : '#fff'}" stroke-width="${6 - i * 1.5}" stroke-linecap="round" opacity="${1 - i * 0.25}"/>`).join('') + `<circle cx="36" cy="38" r="10" fill="${c}" stroke="${INK}" stroke-width="3"/>`,
    star: (c) => { const pts = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? 11 : 28, a = (i / 16) * Math.PI * 2 - Math.PI / 2; pts.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(38 + Math.sin(a) * r * 0.9).toFixed(1)}`); } return `<circle cx="60" cy="38" r="30" fill="${c}" opacity=".3"/><polygon points="${pts.join(' ')}" fill="#fff2b0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="38" r="6" fill="#fff"/>`; },
    chain: (c) => [0, 1, 2, 3].map((i) => `<ellipse cx="${30 + i * 20}" cy="${38 + (i % 2 ? -4 : 4)}" rx="12" ry="7" transform="rotate(${i % 2 ? 25 : -25} ${30 + i * 20} ${38 + (i % 2 ? -4 : 4)})" fill="none" stroke="${INK}" stroke-width="7"/><ellipse cx="${30 + i * 20}" cy="${38 + (i % 2 ? -4 : 4)}" rx="12" ry="7" transform="rotate(${i % 2 ? 25 : -25} ${30 + i * 20} ${38 + (i % 2 ? -4 : 4)})" fill="none" stroke="${i === 3 ? c : '#c8c0b4'}" stroke-width="3.5"/>`).join(''),
  };
  function gear(cx, cy, r, col) {
    const teeth = Math.max(8, Math.round(r / 2)), pts = [];
    for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.22; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); }
    return `<polygon points="${pts.join(' ')}" fill="${col}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="${sh(col, -30)}" stroke="${INK}" stroke-width="2"/>`;
  }
  const artCache = {};
  AF.cardArtSVG = function (id, kind) {
    const k = id + ':' + kind;
    if (artCache[k]) return artCache[k].replace(/§U§/g, 'ca' + (++artN));
    const c = KCOL[kind] || '#8a8070', ic = icons[ICON[id]] || icons.star, u = '§U§';
    const svg = `<svg viewBox="0 0 120 72" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
      <radialGradient id="${u}g" cx="50%" cy="48%" r="70%"><stop offset="0" stop-color="${sh(c, 18)}"/><stop offset=".55" stop-color="${sh(c, -38)}"/><stop offset="1" stop-color="#16100c"/></radialGradient>
      <radialGradient id="${u}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3d0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3d0" stop-opacity="0"/></radialGradient></defs>
      <rect width="120" height="72" fill="url(#${u}g)"/>
      <g opacity=".18" stroke="#000" stroke-width="1">${[10, 24, 38, 52, 66].map((y) => `<path d="M0 ${y} q30 -6 60 0 t60 0" fill="none"/>`).join('')}</g>
      <ellipse cx="60" cy="38" rx="40" ry="26" fill="url(#${u}h)"/>
      ${ic(c)}
      <rect width="120" height="72" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="6"/></svg>`;
    artCache[k] = svg;
    return svg.replace(/§U§/g, 'ca' + (++artN));
  };
  let artN = 0;
  AF.cardArtSrc = function (id, kind) {
    const M = window.AF_CARDART; if (!M || M.enabled === false) return null;
    return (M.cards && M.cards[id]) || (M.kinds && M.kinds[kind]) || null;
  };
  // If an image fails to load, show the painted emblem instead.
  AF.cardArtFail = function (img) { const w = img.parentNode; if (w && w.dataset.id) w.insertAdjacentHTML('afterbegin', AF.cardArtSVG(w.dataset.id, w.dataset.kind)); img.remove(); };

  // ---------- Card backs (used by the draw pile and the deal animation) ----------
  AF.cardBackHTML = (back, cls) => `<span class="cback bk-${back || 'standard'} ${cls || ''}"><i></i></span>`;

  // ---------- The card face ----------
  const KIND = { attack: 'Attack', defend: 'Defend', move: 'Move', repair: 'Repair', tech: 'Tech' };
  AF.cardHtml = function (d, o) {
    o = o || {};
    const st = o.style || AF.cardStyle(AF.game && AF.game.state), rar = AF.cardRarity(d.id);
    const range = d.kind === 'attack' ? `<span class="rng">${AF.rangeLabel(d.range)}</span>` : '';
    const src = AF.cardArtSrc(d.id, d.kind);
    const art = src ? `<img src="${src}" alt="" loading="lazy" draggable="false" onerror="AF.cardArtFail(this)">` : AF.cardArtSVG(d.id, d.kind);
    const cls = ['card', 'k-' + d.kind, 'r-' + rar, 'fr-' + st.frame, 'fin-' + st.finish, o.disabled && 'off', o.selected && 'sel', d.name.endsWith('+') && 'plus', o.cls].filter(Boolean).join(' ');
    return `<div class="${cls}" ${o.attrs || ''}>
      <span class="cst">${d.cost}</span>
      <b class="nm">${AF.esc(d.name.replace(/\+$/, ''))}</b>
      <span class="ca" data-id="${d.id}" data-kind="${d.kind}">${art}<i class="fin"></i><span class="gem" title="${AF.rarityName(rar)}"></span></span>
      <span class="kd">${KIND[d.kind]}${range ? ' · ' : ''}${range}</span>
      <span class="tx">${AF.esc(AF.cardText(d, o.st, o.ctx))}</span>
      ${o.reason ? `<span class="why">${AF.esc(o.reason)}</span>` : ''}
      ${o.footer || ''}
      <span class="rar">${AF.rarityName(rar)}</span>
      ${o.back ? AF.cardBackHTML(st.back, 'face-back') : ''}
    </div>`;
  };

  // ---------- Card Style & Achievements tab (Party → Trophies) ----------
  AF.trophiesTab = function (s) {
    AF.checkAchievements(s);
    const st = AF.cardStyle(s), sample = AF.cardDef({ id: s.construct === 'bulwark' ? 'aegis' : s.construct === 'sprocket' ? 'whirl' : 'lance', uid: 'x' });
    const done = AF.ACHIEVEMENTS.filter((a) => (s.ach || {})[a.id]).length;
    const picker = (kind, list, title) => `<section class="cs-row"><h4>${title}</h4><div class="cs-opts">${list.map(([k, n]) => {
      const ok = AF.unlocked(s, kind, k), a = AF.ACHIEVEMENTS.find((x) => x.unlock[kind] === k);
      const swatch = kind === 'back' ? AF.cardBackHTML(k, 'mini') : `<span class="cs-sw ${kind === 'frame' ? 'fr-' + k : 'fin-' + k}"><i class="fin"></i></span>`;
      return `<button class="cs-opt${st[kind] === k ? ' on' : ''}${ok ? '' : ' lock'}" ${ok ? `data-cstyle="${kind}" data-v="${k}"` : 'disabled'} title="${ok ? n : 'Locked: ' + (a ? a.name + ' (' + a.text + ')' : '')}">${swatch}<b>${n}</b>${ok ? '' : `<small>🔒 ${a ? AF.esc(a.name) : ''}</small>`}</button>`;
    }).join('')}</div></section>`;
    return `<div class="trophies">
      <div class="cs-top">
        <div class="cs-preview">${AF.cardHtml(sample, { style: st, st: AF.stats(s) })}<div class="cs-backprev">${AF.cardBackHTML(st.back)}</div></div>
        <div class="cs-pick"><h3>Card style</h3><p class="hint">Changes how every card in your deck looks. Earn more frames, finishes and card backs from achievements.</p>
          ${picker('frame', AF.CARD_FRAMES, 'Frame')}${picker('finish', AF.CARD_FINISHES, 'Finish')}${picker('back', AF.CARD_BACKS, 'Card back')}</div>
      </div>
      <h3>Achievements <span class="muted">${done} / ${AF.ACHIEVEMENTS.length}</span></h3>
      <div class="ach-list">${AF.ACHIEVEMENTS.map((a) => {
        const p = AF.achProgress(s, a), got = (s.ach || {})[a.id];
        return `<div class="ach${got ? ' got' : ''}"><span class="ach-ic">${got ? '★' : '☆'}</span><div><b>${AF.esc(a.name)}</b><p>${AF.esc(a.text)}</p>
          ${!got && p.goal ? `<div class="ach-bar"><i style="width:${Math.round((p.cur / p.goal) * 100)}%"></i><span>${p.cur} / ${p.goal}</span></div>` : ''}
          <small>Unlocks: ${AF.unlockText(a.unlock)}</small></div></div>`;
      }).join('')}</div>
    </div>`;
  };
  AF.trophiesHandle = function (s, el) {
    if (!el.dataset.cstyle) return false;
    s.cardStyle = Object.assign(AF.cardStyle(s), { [el.dataset.cstyle]: el.dataset.v });
    AF.sfx && AF.sfx('card');
    return true;
  };
})();
