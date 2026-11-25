/* ArcForge — cartoon robot and enemy art (SVG, bold outlines).
   The robot is built from its part levels, so every upgrade shows. Swap for PNGs any time. */
(function () {
  const AF = (window.AF = window.AF || {});
  const OL = 'stroke="#2a2030" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';

  const FRAME = [['#f0905a', '#ffc49a'], ['#9ab4d0', '#d4e4f4'], ['#5cc8d6', '#b8f0f4'], ['#f2f4f8', '#ffffff'], ['#ffcf4a', '#fff0b0']];
  const ARC_COL = ['#ffd75e', '#ffb03b', '#5ef2e1', '#7fb8ff', '#e2a6ff'];

  AF.robotSVG = function (p, opts) {
    opts = opts || {};
    const [fc, fl] = FRAME[p.frame - 1], arc = opts.core || ARC_COL[p.arc - 1];
    let legs = '';
    switch (p.legs) {
      case 1: legs = [40, 80].map((x) => `<circle cx="${x}" cy="100" r="13" fill="#4a4e5a" ${OL}/><circle cx="${x}" cy="100" r="5" fill="#c8ccd8" ${OL}/>`).join(''); break;
      case 2: legs = `<rect x="22" y="88" width="76" height="24" rx="12" fill="#4a4e5a" ${OL}/>${[34, 50, 66, 82].map((x) => `<circle cx="${x}" cy="100" r="6" fill="#9aa0ae" ${OL}/>`).join('')}`; break;
      case 3: legs = `<ellipse cx="60" cy="96" rx="34" ry="11" fill="#7a86a0" ${OL}/><ellipse cx="44" cy="108" rx="7" ry="5" fill="${arc}"/><ellipse cx="76" cy="108" rx="7" ry="5" fill="${arc}"/><ellipse cx="60" cy="110" rx="26" ry="4" fill="${arc}" opacity=".35"/>`; break;
      case 4: legs = [[38, 16, 112], [50, 30, 114], [70, 90, 114], [82, 104, 112]].map(([x, x2, y2]) =>
        `<path d="M${x} 86 Q${(x + x2) / 2} ${y2 - 30} ${x2} ${y2}" fill="none" stroke="#2a2030" stroke-width="9" stroke-linecap="round"/><path d="M${x} 86 Q${(x + x2) / 2} ${y2 - 30} ${x2} ${y2}" fill="none" stroke="#7a86a0" stroke-width="4" stroke-linecap="round"/>`).join(''); break;
      default: legs = `<rect x="34" y="86" width="16" height="20" rx="6" fill="${fc}" ${OL}/><rect x="70" y="86" width="16" height="20" rx="6" fill="${fc}" ${OL}/>
        <rect x="26" y="102" width="30" height="11" rx="5" fill="#4a4e5a" ${OL}/><rect x="64" y="102" width="30" height="11" rx="5" fill="#4a4e5a" ${OL}/><ellipse cx="60" cy="116" rx="36" ry="3" fill="${arc}" opacity=".5"/>`;
    }
    const sr = 12 + p.shield * 3, shc = p.shield >= 4 ? arc : '#b8c4d4';
    const shield = `<circle cx="22" cy="68" r="${sr}" fill="${shc}" ${OL}/><circle cx="22" cy="68" r="${sr * 0.5}" fill="#ffffff" opacity=".5"/><path d="M22 ${68 - sr * 0.35} l${sr * 0.3} ${sr * 0.35} l-${sr * 0.3} ${sr * 0.35} l-${sr * 0.3} -${sr * 0.35}z" fill="${p.shield >= 3 ? '#ffd860' : '#8a96a8'}"/>`;
    const tools = [
      `<path d="M14 82 l-6 -4 m6 4 l-6 4" stroke="#2a2030" stroke-width="5" stroke-linecap="round"/>`,
      `<path d="M16 80 l-12 2 l12 5z" fill="#c8ccd8" ${OL}/>`,
      `<rect x="2" y="78" width="14" height="7" rx="3" fill="#c8ccd8" ${OL}/>`,
      `<path d="M16 78 h-12 M16 84 h-14 M16 72 h-9" stroke="#2a2030" stroke-width="4" stroke-linecap="round"/>`,
      `<circle cx="9" cy="81" r="7" fill="${arc}" ${OL}/>`];
    const backArm = `<path d="M34 66 Q22 74 18 80" fill="none" stroke="#2a2030" stroke-width="12" stroke-linecap="round"/><path d="M34 66 Q22 74 18 80" fill="none" stroke="${fc}" stroke-width="6" stroke-linecap="round"/>${tools[p.arms - 1]}`;
    const gl = 16 + p.weapon * 5;
    const weapon = `<path d="M84 66 Q94 70 96 74" fill="none" stroke="#2a2030" stroke-width="12" stroke-linecap="round"/><path d="M84 66 Q94 70 96 74" fill="none" stroke="${fc}" stroke-width="6" stroke-linecap="round"/>
      <rect x="88" y="66" width="${gl}" height="${11 + p.weapon}" rx="${5 + p.weapon / 2}" fill="#5a6070" ${OL}/>
      <rect x="${84 + gl}" y="${66 - 1}" width="8" height="${13 + p.weapon}" rx="3" fill="${p.weapon >= 3 ? arc : '#8a96a8'}" ${OL}/>`;
    const body = `<rect x="32" y="52" width="56" height="40" rx="18" fill="${fc}" ${OL}/>
      <rect x="40" y="58" width="40" height="28" rx="12" fill="${fl}" opacity=".7"/>
      <circle cx="60" cy="72" r="${8 + p.arc}" fill="${arc}" opacity=".35"/><circle cx="60" cy="72" r="${5 + p.arc * 0.8}" fill="${arc}" ${OL}/><circle cx="${57 + p.arc * 0.3}" cy="${69}" r="2.2" fill="#fff"/>`;
    const head = `<path d="M60 12 V2" stroke="#2a2030" stroke-width="4"/><circle cx="60" cy="2" r="5" fill="${arc}" ${OL}/>
      <rect x="24" y="10" width="72" height="48" rx="22" fill="${fc}" ${OL}/><rect x="30" y="14" width="22" height="7" rx="3.5" fill="#ffffff" opacity=".45"/>
      <rect x="34" y="20" width="54" height="30" rx="13" fill="#1e2440" ${OL}/>
      <ellipse cx="52" cy="35" rx="6.5" ry="8.5" fill="${arc}"/><ellipse cx="74" cy="35" rx="6.5" ry="8.5" fill="${arc}"/>
      <circle cx="54" cy="31" r="2.4" fill="#fff"/><circle cx="76" cy="31" r="2.4" fill="#fff"/>
      <path d="M57 44 q6 5 12 0" fill="none" stroke="${arc}" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="42" cy="45" rx="4" ry="2.4" fill="#ff8aa8" opacity=".75"/><ellipse cx="83" cy="45" rx="4" ry="2.4" fill="#ff8aa8" opacity=".75"/>
      <circle cx="${p.frame >= 3 ? 94 : 26}" cy="34" r="5" fill="${fl}" ${OL}/>`;
    return `<svg viewBox="-4 -6 128 128" class="${opts.cls || ''}" aria-label="Your robot">${shield}${backArm}${legs}${body}${weapon}${head}</svg>`;
  };

  AF.enemySVG = function (type) {
    const e = AF.ENEMIES[type], c = e.body;
    const angry = (x, y, s) => `<ellipse cx="${x}" cy="${y}" rx="${5 * s}" ry="${6 * s}" fill="#ffffff" ${OL}/><circle cx="${x - 1 * s}" cy="${y + 1 * s}" r="${2.8 * s}" fill="#ff2a3a"/><path d="M${x - 7 * s} ${y - 9 * s} L${x + 6 * s} ${y - 5 * s}" stroke="#2a2030" stroke-width="${3.5 * s}" stroke-linecap="round"/>`;
    let s = '';
    switch (type) {
      case 'scrapling': s = `${[24, 42, 78, 96].map((x, i) => `<path d="M${x} 90 l${i < 2 ? -8 : 8} 14" stroke="#2a2030" stroke-width="5" stroke-linecap="round"/>`).join('')}
        <path d="M24 76 q-18 -10 -12 -24 q8 6 14 4 z" fill="${c}" ${OL}/><path d="M96 76 q18 -10 12 -24 q-8 6 -14 4 z" fill="${c}" ${OL}/>
        <ellipse cx="60" cy="80" rx="38" ry="22" fill="${c}" ${OL}/><ellipse cx="54" cy="72" rx="20" ry="6" fill="#fff" opacity=".25"/>${angry(48, 78, 1)}${angry(72, 78, 1)}`; break;
      case 'spitter': s = `<rect x="34" y="88" width="52" height="22" rx="8" fill="#5a5e6a" ${OL}/><rect x="32" y="44" width="56" height="48" rx="20" fill="${c}" ${OL}/>
        <rect x="6" y="60" width="34" height="16" rx="8" fill="#6a6e7a" ${OL}/><circle cx="8" cy="68" r="5" fill="#ff9a40" ${OL}/>${angry(66, 64, 1.5)}`; break;
      case 'rustbiter': s = `<rect x="22" y="92" width="78" height="20" rx="10" fill="#3a3e4a" ${OL}/><rect x="22" y="38" width="76" height="58" rx="16" fill="${c}" ${OL}/>
        <rect x="30" y="74" width="60" height="16" rx="6" fill="#2a2030"/><path d="M32 74 l6 7 l6 -7 l6 7 l6 -7 l6 7 l6 -7 l6 7 l6 -7 l6 7" fill="#fff" stroke="#2a2030" stroke-width="2"/>
        <path d="M22 62 h-14 l-6 12 h16" fill="#8a96a8" ${OL}/>${angry(46, 56, 1.2)}${angry(74, 56, 1.2)}`; break;
      case 'sniper': s = `<path d="M30 30 H90 M60 30 V40" stroke="#2a2030" stroke-width="5" stroke-linecap="round"/><ellipse cx="42" cy="28" rx="16" ry="4" fill="#c8ccd8" ${OL}/><ellipse cx="78" cy="28" rx="16" ry="4" fill="#c8ccd8" ${OL}/>
        <circle cx="62" cy="64" r="26" fill="${c}" ${OL}/><rect x="2" y="60" width="40" height="9" rx="4" fill="#4a4e5a" ${OL}/><circle cx="54" cy="64" r="11" fill="#ffffff" ${OL}/><circle cx="52" cy="64" r="5.5" fill="#ff2a3a"/><path d="M42 50 L66 56" stroke="#2a2030" stroke-width="4" stroke-linecap="round"/>`; break;
      case 'shellback': s = `<rect x="22" y="94" width="78" height="14" rx="7" fill="#3a3e4a" ${OL}/><path d="M16 98 Q60 4 104 98 Z" fill="${c}" ${OL}/>
        ${[[40, 50], [60, 34], [80, 50], [50, 74], [72, 74]].map(([x, y]) => `<path d="M${x - 8} ${y + 6} L${x} ${y - 8} L${x + 8} ${y + 6} Z" fill="#c8d4a8" ${OL}/>`).join('')}
        <ellipse cx="22" cy="86" rx="14" ry="12" fill="#8aa86a" ${OL}/>${angry(18, 86, 0.8)}`; break;
      case 'wraith': s = `<path d="M26 44 Q60 0 94 44 V96 l-11 -10 l-11 12 l-12 -12 l-12 12 l-11 -12 l-11 10 Z" fill="${c}" ${OL} opacity=".95"/>
        <circle cx="60" cy="68" r="11" fill="#f2d8ff" ${OL}/><circle cx="60" cy="68" r="5" fill="#c27bff"/>${angry(47, 44, 1)}${angry(73, 44, 1)}`; break;
      case 'juggernaut': s = `<rect x="18" y="96" width="84" height="18" rx="9" fill="#2a2e3a" ${OL}/><rect x="16" y="26" width="88" height="72" rx="18" fill="${c}" ${OL}/>
        <circle cx="10" cy="70" r="14" fill="#8a96a8" ${OL}/><circle cx="110" cy="70" r="14" fill="#8a96a8" ${OL}/><rect x="32" y="40" width="56" height="18" rx="8" fill="#1e2440" ${OL}/>
        <rect x="38" y="44" width="16" height="10" rx="4" fill="#ff2a3a"/><rect x="66" y="44" width="16" height="10" rx="4" fill="#ff2a3a"/><path d="M42 80 h36" stroke="#2a2030" stroke-width="5" stroke-linecap="round"/>`; break;
      default: s = `<circle cx="60" cy="60" r="54" fill="#3a1420" ${OL}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="55" y="0" width="10" height="18" rx="4" fill="#6a6e7a" ${OL} transform="rotate(${a} 60 60)"/>`).join('')}
        <circle cx="60" cy="60" r="42" fill="${c}" ${OL}/><circle cx="60" cy="66" r="18" fill="#ffcf5e" ${OL}/><circle cx="60" cy="66" r="8" fill="#ffffff"/>${angry(40, 40, 1.3)}${angry(80, 40, 1.3)}`;
    }
    return `<svg viewBox="-4 -4 128 128" aria-label="${AF.esc(e.name)}">${s}</svg>`;
  };
})();
