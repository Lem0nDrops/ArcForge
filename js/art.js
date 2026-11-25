/* ArcForge — procedural art. The robot is drawn from its part levels, so every
   upgrade is visible. Swap these for PNG sprites later if you like. */
(function () {
  const AF = (window.AF = window.AF || {});

  const FRAME_COL = ['#8a5a3c', '#7d8a96', '#5f9aa8', '#c7cdd4', '#3fd0c9'];
  const FRAME_DARK = ['#5a3826', '#4f5a64', '#3b6a76', '#8f979f', '#1f8f8a'];
  const ARC_COL = ['#ffd75e', '#ffb03b', '#5ef2e1', '#7fb8ff', '#e2a6ff'];

  AF.robotSVG = function (p, opts) {
    opts = opts || {};
    const f = FRAME_COL[p.frame - 1], fd = FRAME_DARK[p.frame - 1], arc = ARC_COL[p.arc - 1];
    let legs = '';
    switch (p.legs) {
      case 1: legs = `<circle cx="44" cy="98" r="10" fill="#222"/><circle cx="44" cy="98" r="4" fill="#777"/>
                     <circle cx="76" cy="98" r="10" fill="#222"/><circle cx="76" cy="98" r="4" fill="#777"/>`; break;
      case 2: legs = `<rect x="28" y="88" width="64" height="20" rx="10" fill="#2a2a2a"/>
                     ${[38, 52, 66, 80].map((x) => `<circle cx="${x}" cy="98" r="5" fill="#666"/>`).join('')}`; break;
      case 3: legs = `<rect x="30" y="90" width="22" height="8" rx="4" fill="${fd}"/><rect x="68" y="90" width="22" height="8" rx="4" fill="${fd}"/>
                     <ellipse cx="41" cy="104" rx="10" ry="4" fill="#5ef2e1" opacity=".7"/><ellipse cx="79" cy="104" rx="10" ry="4" fill="#5ef2e1" opacity=".7"/>`; break;
      case 4: legs = [[40, 22, 90], [52, 34, 104], [68, 86, 104], [80, 98, 90]].map(([x, x2, y2]) =>
                     `<path d="M${x} 84 L${(x + x2) / 2} ${y2 - 18} L${x2} ${y2 + 6}" stroke="${fd}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join(''); break;
      default: legs = `<path d="M44 84 L38 106 M76 84 L82 106" stroke="${fd}" stroke-width="8" stroke-linecap="round"/>
                     <rect x="28" y="104" width="20" height="5" rx="2" fill="${arc}"/><rect x="72" y="104" width="20" height="5" rx="2" fill="${arc}"/>
                     <ellipse cx="60" cy="112" rx="34" ry="3" fill="${arc}" opacity=".35"/>`;
    }
    const shieldH = 26 + p.shield * 5;
    const shield = `<path d="M20 ${62 - shieldH / 2} q-10 ${shieldH / 2} 0 ${shieldH}" stroke="${p.shield >= 4 ? arc : '#9fb3c2'}" stroke-width="${3 + p.shield}" fill="none" stroke-linecap="round" opacity=".9"/>`;
    const tools = ['<path d="M30 60 l-8 6 m8 -6 l-8 -4" stroke="#ccc" stroke-width="3"/>',
      '<path d="M30 60 l-12 4 l12 4z" fill="#ccc"/>', '<rect x="16" y="58" width="12" height="6" fill="#ccc"/><circle cx="16" cy="61" r="4" fill="#999"/>',
      '<path d="M30 58 h-12 m12 6 h-14 m14 -12 h-10" stroke="#ccc" stroke-width="3"/>', `<circle cx="22" cy="61" r="6" fill="${arc}" opacity=".8"/>`];
    const arm = `<path d="M38 54 L30 60" stroke="${fd}" stroke-width="6" stroke-linecap="round"/>${tools[p.arms - 1]}`;
    const gunLen = 14 + p.weapon * 6;
    const weapon = `<rect x="78" y="56" width="${gunLen}" height="${6 + p.weapon}" rx="2" fill="#3a3f45"/>
      <rect x="${78 + gunLen - 4}" y="55" width="5" height="${8 + p.weapon}" fill="${p.weapon >= 3 ? arc : '#666'}"/>
      <path d="M80 52 L74 58" stroke="${fd}" stroke-width="6" stroke-linecap="round"/>`;
    const body = `<rect x="34" y="40" width="52" height="46" rx="${6 + p.frame}" fill="${f}" stroke="${fd}" stroke-width="3"/>
      ${p.frame >= 3 ? `<path d="M38 76 h44" stroke="${fd}" stroke-width="2"/>` : ''}
      <rect x="44" y="20" width="32" height="22" rx="6" fill="${f}" stroke="${fd}" stroke-width="3"/>
      <rect x="58" y="26" width="16" height="8" rx="3" fill="#0d1b20"/><rect x="66" y="28" width="6" height="4" rx="2" fill="${arc}"/>
      <path d="M52 20 v-8" stroke="${fd}" stroke-width="2"/><circle cx="52" cy="10" r="3" fill="${arc}"/>
      <circle cx="58" cy="60" r="${6 + p.arc * 1.5}" fill="${arc}" opacity=".25"/>
      <circle cx="58" cy="60" r="${4 + p.arc}" fill="${arc}" stroke="#fff" stroke-width="1.5"/>`;
    return `<svg viewBox="0 0 120 120" class="${opts.cls || ''}" aria-label="Your robot">${legs}${shield}${arm}${body}${weapon}</svg>`;
  };

  AF.enemySVG = function (type) {
    const e = AF.ENEMIES[type], c = e.body;
    const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ff3b3b"/><circle cx="${x}" cy="${y}" r="${r / 2}" fill="#ffd0d0"/>`;
    let s = '';
    switch (type) {
      case 'scrapling': s = `<path d="M30 96 l-10 10 M50 96 l-6 12 M70 96 l6 12 M90 96 l10 10" stroke="#444" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="60" cy="82" rx="34" ry="20" fill="${c}"/><path d="M28 74 l-14 -10 l6 -4 M92 74 l14 -10 l-6 -4" stroke="#555" stroke-width="5"/>${eye(48, 76, 6)}${eye(68, 76, 6)}`; break;
      case 'spitter': s = `<rect x="38" y="84" width="44" height="22" rx="4" fill="#3d3d3d"/><rect x="40" y="50" width="40" height="36" rx="8" fill="${c}"/>
        <rect x="14" y="60" width="30" height="10" rx="3" fill="#555"/>${eye(64, 64, 7)}`; break;
      case 'rustbiter': s = `<rect x="30" y="92" width="64" height="18" rx="9" fill="#2a2a2a"/><rect x="28" y="44" width="64" height="50" rx="8" fill="${c}"/>
        <path d="M28 70 h-14 l-6 10 h14 l6 -8" fill="#888"/><path d="M36 86 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8" stroke="#ddd" stroke-width="3" fill="none"/>${eye(46, 60, 7)}${eye(70, 60, 7)}`; break;
      case 'sniper': s = `<ellipse cx="60" cy="108" rx="24" ry="4" fill="#000" opacity=".3"/><circle cx="62" cy="58" r="26" fill="${c}"/>
        <path d="M30 34 h60 M60 34 v-6" stroke="#bbb" stroke-width="4"/><rect x="6" y="56" width="40" height="6" fill="#444"/>${eye(48, 58, 9)}`; break;
      case 'shellback': s = `<path d="M18 96 q42 -80 84 0z" fill="${c}" stroke="#3a4a2e" stroke-width="4"/><path d="M34 80 q26 -40 52 0" stroke="#3a4a2e" stroke-width="3" fill="none"/>
        <rect x="22" y="94" width="76" height="12" rx="6" fill="#333"/>${eye(30, 88, 6)}`; break;
      case 'wraith': s = `<path d="M30 40 q30 -30 60 0 v50 l-10 -10 l-10 12 l-10 -12 l-10 12 l-10 -12 l-10 10z" fill="${c}" opacity=".9"/>
        <circle cx="60" cy="56" r="10" fill="#e2a6ff"/>${eye(48, 46, 5)}${eye(70, 46, 5)}`; break;
      case 'juggernaut': s = `<rect x="22" y="94" width="76" height="20" rx="10" fill="#222"/><rect x="18" y="30" width="84" height="66" rx="6" fill="${c}" stroke="#3a3d42" stroke-width="4"/>
        <rect x="4" y="54" width="30" height="20" rx="4" fill="#444"/><rect x="34" y="42" width="44" height="12" rx="3" fill="#111"/>${eye(46, 48, 5)}${eye(66, 48, 5)}`; break;
      default: s = `<circle cx="60" cy="60" r="50" fill="#2a0f14"/><circle cx="60" cy="60" r="40" fill="${c}"/>
        <circle cx="60" cy="60" r="18" fill="#ffcf5e"/><circle cx="60" cy="60" r="8" fill="#fff"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="57" y="2" width="6" height="16" fill="#555" transform="rotate(${a} 60 60)"/>`).join('')}
        ${eye(40, 40, 6)}${eye(80, 40, 6)}`;
    }
    return `<svg viewBox="0 0 120 120" aria-label="${AF.esc(e.name)}">${s}</svg>`;
  };
})();
