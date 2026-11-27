/* Automata: ArcForge — automaton art (dieselpunk with arc-lit seams) and enemy art (SVG).
   The robot is built from its part levels, so every upgrade shows. Swap for PNGs any time. */
(function () {
  const AF = (window.AF = window.AF || {});
  const OL = 'stroke="#16100c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';

  const ARC_COL = ['#ffd75e', '#ffb03b', '#5ef2e1', '#7fb8ff', '#e2a6ff'];
  const sh = (c, a) => AF.shadeHex(c, a);

  // The automaton (v0.17 "dieselpunk + arc seams"): heavy riveted plate, pistons and hoses, a small armoured
  // head sunk between the shoulders, lenses instead of cartoon eyes, worn paint, and arc energy glowing through
  // the panel seams. Build options (state.bot) choose the look; part levels choose the gear it carries.
  let uid = 0;
  AF.robotSVG = function (p, opts) {
    opts = opts || {};
    const U = 'g' + (++uid);
    const B = Object.assign(AF.defaultBot ? AF.defaultBot() : {}, opts.bot || {});
    const PAL = AF.BOT_PAINT || [['#f0905a']], mu = (c) => (AF.mute ? AF.mute(c, 0.3) : c);
    const pc = (v, d) => (typeof v === 'string' && v[0] === '#' ? v : mu(PAL[((v == null ? d : v) % PAL.length + PAL.length) % PAL.length][0]));
    // paint is knocked back toward a dirty industrial tone; trim reads as brass/steel fittings
    const fc = sh(pc(B.paint, 0), -8), fl = sh(fc, 22), fd = sh(fc, -34), tc = pc(B.trim, 1), td = sh(tc, -38), ac = B.accent != null ? pc(B.accent, 10) : '#4a4e5a', acl = sh(ac, 16), acd = sh(ac, -30);
    const fin = B.finish || 'clean';
    const arc = opts.core || ARC_COL[p.arc - 1], OLc = '#140e0a';
    const O = `stroke="${OLc}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`, Ow = (w) => `stroke="${OLc}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const grime = { clean: 0.28, polished: 0.14, matte: 0.38, worn: 0.5, rusty: 0.55 }[fin] || 0.3;
    const defs = `<defs>
      <linearGradient id="${U}p" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${fl}"/><stop offset=".45" stop-color="${fc}"/><stop offset="1" stop-color="${fd}"/></linearGradient>
      <linearGradient id="${U}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acl}"/><stop offset=".5" stop-color="${ac}"/><stop offset="1" stop-color="${acd}"/></linearGradient>
      <linearGradient id="${U}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(tc, 25)}"/><stop offset="1" stop-color="${td}"/></linearGradient>
      <linearGradient id="${U}d" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#1a1008" stop-opacity="0"/><stop offset="1" stop-color="#1a1008" stop-opacity="${grime}"/></linearGradient>
      <radialGradient id="${U}c"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="${arc}"/><stop offset="1" stop-color="${sh(arc, -45)}"/></radialGradient>
      <filter id="${U}f" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`;
    // glowing arc light: a soft blurred copy under a crisp copy, gently pulsing
    const glow = (shapes, k) => `<g filter="url(#${U}f)" opacity="${k || 0.9}"><animate attributeName="opacity" values="${(k || 0.9) * 0.55};${k || 0.9};${(k || 0.9) * 0.55}" dur="2.6s" repeatCount="indefinite"/>${shapes}</g>${shapes}`;
    const rv = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 1.5}" fill="${acl}" stroke="${OLc}" stroke-width=".8"/>`;
    const rivRow = (x0, x1, y, n) => Array.from({ length: n }, (_, i) => rv(x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y)).join('');
    const PAINT = `url(#${U}p)`, METAL = `url(#${U}m)`, TRIM = `url(#${U}t)`, DIRT = `url(#${U}d)`;

    // ---------- locomotion ----------
    let legs = '';
    switch (p.legs) {
      case 1: // heavy wheels under armoured fenders
        legs = [36, 84].map((x) => `<circle cx="${x}" cy="100" r="14" fill="#1e1a18" ${O}/><circle cx="${x}" cy="100" r="9" fill="${METAL}" ${O}/>${[0, 60, 120, 180, 240, 300].map((a) => rv(x + Math.cos(a * Math.PI / 180) * 6, 100 + Math.sin(a * Math.PI / 180) * 6, 1.2)).join('')}<circle cx="${x}" cy="100" r="2.6" fill="${arc}"/>
          <path d="M${x - 17} 98 Q${x - 17} 82 ${x} 82 Q${x + 17} 82 ${x + 17} 98 L${x + 13} 98 Q${x + 13} 87 ${x} 87 Q${x - 13} 87 ${x - 13} 98 Z" fill="${PAINT}" ${O}/>`).join('')
          + `<rect x="48" y="86" width="24" height="10" rx="2" fill="${METAL}" ${O}/>`; break;
      case 2: // tank treads with road wheels and a drive sprocket
        legs = `<path d="M18 96 Q18 86 28 86 H92 Q102 86 102 96 V104 Q102 114 92 114 H28 Q18 114 18 104 Z" fill="#221c18" ${O}/>
          <path d="M20 90 H100 M20 110 H100" stroke="#4a403a" stroke-width="3" stroke-dasharray="3 2.5"/>
          ${[32, 48, 64, 80].map((x) => `<circle cx="${x}" cy="102" r="6.5" fill="${METAL}" ${O}/><circle cx="${x}" cy="102" r="2" fill="${OLc}"/>`).join('')}
          <circle cx="94" cy="98" r="7" fill="${TRIM}" ${O}/><circle cx="94" cy="98" r="7" fill="none" stroke="${OLc}" stroke-width="2.5" stroke-dasharray="2 2"/>
          <rect x="22" y="84" width="76" height="6" rx="2" fill="${PAINT}" ${O}/>${rivRow(28, 92, 87, 6)}`; break;
      case 3: // hover sled on arc thrusters
        legs = `<path d="M24 88 H96 L88 102 H32 Z" fill="${PAINT}" ${O}/><path d="M24 88 H96 L88 102 H32 Z" fill="${DIRT}"/>
          ${[40, 80].map((x) => `<rect x="${x - 9}" y="98" width="18" height="8" rx="2" fill="${METAL}" ${O}/>`).join('')}
          ${glow([40, 80].map((x) => `<ellipse cx="${x}" cy="110" rx="8" ry="4" fill="${arc}"/>`).join('') + `<ellipse cx="60" cy="116" rx="30" ry="3" fill="${arc}" opacity=".45"/>`, 0.95)}${rivRow(30, 90, 92, 5)}`; break;
      case 4: // spider legs: piston thighs, knuckled joints, claw feet
        legs = [[36, 12, 114, 22], [46, 28, 116, 30], [74, 92, 116, 30], [84, 108, 114, 22]].map(([x, x2, y2, kx]) => {
          const kxp = x < 60 ? x - kx : x + kx, ky = 74;
          return `<path d="M${x} 88 L${kxp} ${ky} L${x2} ${y2}" fill="none" stroke="${OLc}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M${x} 88 L${kxp} ${ky} L${x2} ${y2}" fill="none" stroke="${tc}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="${kxp}" cy="${ky}" r="4" fill="${METAL}" ${O}/><path d="M${x2 - 4} ${y2} l4 -5 l4 5" fill="${ac}" ${O}/>`;
        }).join('') + `<ellipse cx="60" cy="92" rx="22" ry="7" fill="${METAL}" ${O}/>`; break;
      default: // stompy piston legs with heavy feet
        legs = [44, 76].map((x) => `<rect x="${x - 8}" y="84" width="16" height="14" rx="2" fill="${PAINT}" ${O}/><rect x="${x - 4}" y="96" width="8" height="8" fill="${METAL}" ${O}/>
          <path d="M${x - 15} 116 V108 Q${x - 15} 103 ${x - 9} 103 H${x + 9} Q${x + 15} 103 ${x + 15} 108 V116 Z" fill="${TRIM}" ${O}/>${rv(x - 9, 110)}${rv(x + 9, 110)}`).join('');
    }

    // ---------- arms ----------
    const LS = B.limbs || 'cable';
    const limb = (d) => LS === 'piston' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="13" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${acl}" stroke-width="8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2" opacity=".3" stroke-linecap="round"/>`
      : LS === 'plated' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc}" stroke-width="9" stroke-dasharray="5 2" stroke-linecap="butt"/>`
      : LS === 'chain' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${acl}" stroke-width="5.5" stroke-dasharray="3 2.5" stroke-linecap="round"/>`
      : `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="11" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#3a3430" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc}" stroke-width="7" stroke-dasharray="1.6 2.4" stroke-linecap="butt" opacity=".8"/>`;
    // shoulder hub: a big riveted bearing the arm hangs from
    const hub = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="${METAL}" ${O}/><circle cx="${x}" cy="${y}" r="2.4" fill="${OLc}"/>`;
    const tools = [
      `<path d="M16 80 l-9 -5 l-2 4 l7 4 M16 82 l-9 5 l1 4 l8 -6" fill="${METAL}" ${O}/>`,                                                          // claw
      `<path d="M17 76 L1 81 L17 86 Z" fill="${METAL}" ${O}/><path d="M14 77.5 L6 81 M14 84.5 L6 81" stroke="${OLc}" stroke-width="1"/>`,           // drill
      `<rect x="2" y="77" width="15" height="8" rx="1.5" fill="${METAL}" ${O}/><circle cx="4" cy="81" r="3" fill="${tc}" ${O}/>`,                    // cutter
      `<path d="M17 75 h-12 M17 81 h-15 M17 87 h-10" stroke="${OLc}" stroke-width="4.5" stroke-linecap="round"/><path d="M17 75 h-12 M17 81 h-15 M17 87 h-10" stroke="${acl}" stroke-width="2" stroke-linecap="round"/>`,
      `<rect x="8" y="76" width="10" height="10" rx="2" fill="${METAL}" ${O}/>${glow(`<circle cx="6" cy="81" r="5" fill="${arc}"/>`)}`];
    const backArm = `${limb('M32 52 Q22 64 18 80')}${hub(32, 52)}${tools[p.arms - 1] || tools[0]}`;
    // shield: a heavy riveted round plate, arc-lit at higher levels
    const sr = 12 + p.shield * 2.6;
    const shield = `<circle cx="20" cy="70" r="${sr}" fill="${TRIM}" ${O}/><circle cx="20" cy="70" r="${sr - 4}" fill="none" stroke="${td}" stroke-width="1.5"/>${Array.from({ length: 8 }, (_, i) => rv(20 + Math.cos(i * Math.PI / 4) * (sr - 2), 70 + Math.sin(i * Math.PI / 4) * (sr - 2), 1.1)).join('')}
      <circle cx="20" cy="70" r="${sr * 0.32}" fill="${METAL}" ${O}/>${p.shield >= 3 ? glow(`<circle cx="20" cy="70" r="${sr * 0.18}" fill="${arc}"/>`) : ''}<path d="M${20 - sr * 0.7} ${70 - sr * 0.55} Q20 ${70 - sr} ${20 + sr * 0.7} ${70 - sr * 0.55}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".3"/>`;
    // weapon arm: a piston-fed cannon; longer and arc-charged as it levels
    const gl = 18 + p.weapon * 5, gy = 62;
    const weapon = `${limb('M88 52 Q96 58 96 66')}${hub(88, 52)}
      <rect x="86" y="${gy}" width="${gl}" height="${12 + p.weapon}" rx="2" fill="${METAL}" ${O}/><path d="M88 ${gy + 3} H${84 + gl}" stroke="#fff" stroke-width="1.4" opacity=".3"/>
      ${Array.from({ length: Math.min(4, p.weapon) }, (_, i) => `<rect x="${92 + i * 5}" y="${gy - 2}" width="3" height="${16 + p.weapon}" fill="${td}" ${Ow(1)}/>`).join('')}
      <rect x="${84 + gl}" y="${gy - 2}" width="9" height="${16 + p.weapon}" rx="1.5" fill="${TRIM}" ${O}/>
      ${p.weapon >= 3 ? glow(`<rect x="${86 + gl}" y="${gy + 3}" width="5" height="${6 + p.weapon}" rx="1" fill="${arc}"/>`) : `<rect x="${86 + gl}" y="${gy + 3}" width="5" height="${6 + p.weapon}" rx="1" fill="#1a1410"/>`}`;

    // ---------- chassis: a big top-heavy hull ----------
    const CH = {
      round: (f) => `<path d="M28 52 Q28 40 42 40 H78 Q92 40 92 52 V80 Q92 92 78 92 H42 Q28 92 28 80 Z" fill="${f}" ${O}/>`,
      boxy: (f) => `<path d="M32 40 H88 L94 46 V86 L88 92 H32 L26 86 V46 Z" fill="${f}" ${O}/>`,
      tall: (f) => `<path d="M22 42 H98 L86 92 H34 Z" fill="${f}" ${O}/>`,
      bug: (f) => `<path d="M60 38 Q96 40 94 70 Q92 92 60 94 Q28 92 26 70 Q24 40 60 38 Z" fill="${f}" ${O}/>`,
      barrel: (f) => `<rect x="28" y="40" width="64" height="52" rx="9" fill="${f}" ${O}/>`,
      kite: (f) => `<path d="M20 42 H100 L78 94 H42 Z" fill="${f}" ${O}/>`,
      furnace: (f) => `<path d="M30 46 Q30 40 36 40 H84 Q90 40 90 46 V92 H30 Z" fill="${f}" ${O}/>`,
    };
    const hull = CH[B.chassis] || CH.round;
    const seams = { // panel lines the arc light leaks through
      round: 'M60 41 V58 M60 74 V91 M29 66 H46 M74 66 H91', boxy: 'M60 41 V58 M60 74 V91 M27 66 H46 M74 66 H93', tall: 'M60 43 V58 M60 74 V91 M26 60 H46 M74 60 H94',
      bug: 'M60 39 V58 M60 74 V93 M30 62 Q38 64 46 66 M74 66 Q82 64 90 62', barrel: 'M29 54 H91 M29 80 H46 M74 80 H91 M60 41 V58', kite: 'M60 43 V58 M60 74 V93 M28 56 H46 M74 56 H92', furnace: 'M60 41 V58 M31 62 H46 M74 62 H89',
    }[B.chassis] || 'M60 41 V58 M60 74 V91 M29 66 H46 M74 66 H91';
    const seamStroke = (w, c, o) => `<path d="${seams}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o == null ? 1 : o}"/>`;
    const extra = {
      barrel: `<path d="M29 54 H91 M29 80 H91" stroke="${td}" stroke-width="4"/>${rivRow(32, 88, 54, 7)}${rivRow(32, 88, 80, 7)}`,
      furnace: `<rect x="42" y="80" width="36" height="10" rx="1" fill="#1a100a" ${O}/>${glow(`<rect x="45" y="83" width="30" height="5" fill="#ff8a30"/>`, 0.8)}<path d="M48 80 V90 M54 80 V90 M60 80 V90 M66 80 V90 M72 80 V90" stroke="${OLc}" stroke-width="1.6"/>`,
      bug: `<path d="M60 38 Q72 60 60 94 M60 38 Q48 60 60 94" fill="none" stroke="${fd}" stroke-width="1.4" opacity=".6"/>`,
      boxy: `${rivRow(34, 86, 44, 6)}${rivRow(34, 86, 88, 6)}`,
    }[B.chassis] || '';
    const plating = p.frame >= 2 ? [[30, 1], [90, -1]].map(([x, d]) => `<path d="M${x} 44 L${x + d * 14} 44 L${x + d * 14} 60 L${x} 64 Z" fill="${TRIM}" ${O}/>${rv(x + d * 4, 48)}${rv(x + d * 10, 48)}`).join('') : '';
    const rivets = p.frame >= 3 ? `${rivRow(34, 86, 89, 6)}` : '';
    const brass = p.frame >= 5 ? `<path d="M36 41.5 H84" stroke="#d8a848" stroke-width="2.4" stroke-linecap="round"/><path d="M38 90.5 H82" stroke="#d8a848" stroke-width="2.4" stroke-linecap="round"/>` : '';
    const DEC = {
      none: '', stripe: `<path d="M30 76 L52 54 M36 82 L58 60" stroke="#e8c040" stroke-width="3.2" opacity=".75"/><path d="M33 79 L55 57" stroke="#1a1410" stroke-width="3.2" opacity=".6"/>`,
      star: `<path d="M80 52 l2 4.2 4.5.5 -3.4 3.1 .9 4.4 -4-2.3 -4 2.3 .9-4.4 -3.4-3.1 4.5-.5z" fill="${tc}" opacity=".85" stroke="${OLc}" stroke-width="1"/>`,
      number: `<text x="34" y="88" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="11" fill="${tc}" opacity=".85" stroke="${OLc}" stroke-width=".6">${String((B.num || 7) % 100).padStart(2, '0')}</text>`,
      flame: `<path d="M32 90 q3 -12 8 -5 q2 -9 7 -3 q3 -7 7 2 q-5 8 -22 6z" fill="#d86a28" opacity=".85" stroke="${OLc}" stroke-width="1"/>`,
      bolt: `<path d="M82 48 l-6 9 h4.5 l-3.5 8 8-11 h-4.5 l3.5-6z" fill="#e8c040" stroke="${OLc}" stroke-width="1"/>`,
      gear: `<circle cx="80" cy="54" r="5.5" fill="none" stroke="${tc}" stroke-width="3.4" stroke-dasharray="2.2 1.5"/><circle cx="80" cy="54" r="3.2" fill="${tc}" stroke="${OLc}" stroke-width="1"/><circle cx="80" cy="54" r="1.2" fill="${OLc}"/>`,
      checker: `<g opacity=".85">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => (r + c) % 2 ? '' : `<rect x="${74 + c * 4}" y="${48 + r * 4}" width="4" height="4" fill="${tc}"/>`).join('')).join('')}</g><rect x="74" y="48" width="12" height="12" fill="none" stroke="${OLc}" stroke-width="1"/>`,
      crest: `<path d="M74 47 H86 V54 Q86 60 80 62 Q74 60 74 54 Z" fill="${tc}" stroke="${OLc}" stroke-width="1.2"/><path d="M80 49 V60 M75 53 H85" stroke="${fd}" stroke-width="1.6"/>`,
      skull: `<circle cx="80" cy="52" r="4.6" fill="#d8ccb4" stroke="${OLc}" stroke-width="1"/><rect x="77.5" y="55" width="5" height="3.4" rx=".8" fill="#d8ccb4" stroke="${OLc}" stroke-width="1"/><circle cx="78.4" cy="52" r="1.2" fill="${OLc}"/><circle cx="81.6" cy="52" r="1.2" fill="${OLc}"/>`,
    };
    // the arc core: a reactor behind a riveted porthole grille
    const cr = 8 + p.arc * 0.9;
    const core = `<circle cx="60" cy="66" r="${cr + 4}" fill="${METAL}" ${O}/>${glow(`<circle cx="60" cy="66" r="${cr}" fill="url(#${U}c)"/>`, 1)}
      <path d="M${60 - cr} 66 H${60 + cr} M60 ${66 - cr} V${66 + cr}" stroke="${OLc}" stroke-width="2.2" opacity=".75"/><circle cx="60" cy="66" r="${cr}" fill="none" stroke="${OLc}" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => rv(60 + Math.cos(i * Math.PI / 3 + 0.5) * (cr + 2), 66 + Math.sin(i * Math.PI / 3 + 0.5) * (cr + 2), 1.1)).join('')}`;
    const body = `${hull(PAINT)}${extra}${glow(seamStroke(1.8, arc), 0.85)}${seamStroke(0.6, '#ffffff', 0.5)}${hull(DIRT).replace(O, 'stroke="none"')}
      <path d="M34 42.5 H86" stroke="#ffffff" stroke-width="1.4" opacity="${fin === 'polished' ? 0.55 : 0.28}" stroke-linecap="round"/>${plating}${DEC[B.decal] || ''}${core}${rivets}${brass}`;

    // ---------- head: small, armoured, sunk between the shoulders ----------
    const HX0 = 42, HX1 = 78, HY0 = 14, HY1 = 44, EYY = 28;
    const HD = {
      dome: { box: `<path d="M${HX0} ${HY1} V30 Q${HX0} ${HY0} 60 ${HY0} Q${HX1} ${HY0} ${HX1} 30 V${HY1} Z" fill="${PAINT}" ${O}/>${rv(46, 22)}${rv(74, 22)}`, plate: `<rect x="46" y="23" width="28" height="11" rx="2" fill="#0e0c10" ${O}/>` },
      square: { box: `<path d="M${HX0 + 3} ${HY0} H${HX1 - 3} L${HX1} ${HY0 + 3} V${HY1} H${HX0} V${HY0 + 3} Z" fill="${PAINT}" ${O}/>${rv(45.5, 18)}${rv(74.5, 18)}${rv(45.5, 40)}${rv(74.5, 40)}`, plate: `<rect x="47" y="22" width="26" height="13" rx="1" fill="#0e0c10" ${O}/>` },
      crt: { box: `<rect x="${HX0 - 2}" y="${HY0}" width="${HX1 - HX0 + 4}" height="${HY1 - HY0}" rx="3" fill="${PAINT}" ${O}/><rect x="74" y="36" width="5" height="5" rx="1" fill="${TRIM}" ${O}/>`, plate: `<circle cx="60" cy="${EYY + 1}" r="11" fill="${METAL}" ${O}/><circle cx="60" cy="${EYY + 1}" r="8.5" fill="#0e0c10" ${O}/>`, round: true },
      visor: { box: `<path d="M${HX0} ${HY1} V32 Q${HX0} ${HY0} 60 ${HY0} Q${HX1} ${HY0} ${HX1} 32 V${HY1} Z" fill="${PAINT}" ${O}/>`, plate: `<rect x="${HX0 - 1}" y="24" width="${HX1 - HX0 + 2}" height="9" rx="1.5" fill="#0e0c10" ${O}/>`, bar: true },
      helm: { box: `<path d="M${HX0} ${HY1} V28 Q${HX0} ${HY0 - 2} 60 ${HY0 - 2} Q${HX1} ${HY0 - 2} ${HX1} 28 V${HY1} Z" fill="${PAINT}" ${O}/><path d="M60 ${HY0 - 1} V${HY1}" stroke="${fd}" stroke-width="2.4"/>${rivRow(46, 74, 38, 5)}`, plate: `<rect x="45" y="25" width="30" height="5" rx="1" fill="#0e0c10" ${O}/>`, bar: true },
      lantern: { box: `<path d="M${HX0 + 2} ${HY0 + 2} Q60 ${HY0 - 8} ${HX1 - 2} ${HY0 + 2} Z" fill="${TRIM}" ${O}/><rect x="${HX0}" y="${HY0 + 2}" width="${HX1 - HX0}" height="${HY1 - HY0 - 2}" rx="2" fill="${TRIM}" ${O}/>`,
        plate: `<rect x="45" y="19" width="30" height="22" rx="1" fill="#1a100a" ${O}/>${glow(`<circle cx="60" cy="30" r="7" fill="url(#${U}c)"/>`, 1)}<path d="M52 19 V41 M60 19 V41 M68 19 V41" stroke="${td}" stroke-width="2.4"/>`, noEyes: true },
      bucket: { box: `<path d="M${HX0 + 1} ${HY1} L${HX0 + 4} ${HY0} H${HX1 - 4} L${HX1 - 1} ${HY1} Z" fill="${PAINT}" ${O}/><path d="M${HX0 + 3} 20 H${HX1 - 3}" stroke="${td}" stroke-width="3"/>`, plate: `<rect x="47" y="24" width="26" height="11" rx="1" fill="#0e0c10" ${O}/>` },
      skull: { box: `<path d="M${HX0} 32 Q${HX0} ${HY0} 60 ${HY0} Q${HX1} ${HY0} ${HX1} 32 Q${HX1} 37 74 38 V${HY1} H46 V38 Q${HX0} 37 ${HX0} 32 Z" fill="${PAINT}" ${O}/>`, plate: `<path d="M46 25 Q46 22 50 22 H70 Q74 22 74 25 V31 Q74 34 70 34 H50 Q46 34 46 31 Z" fill="#0e0c10" ${O}/>` },
    };
    const H = HD[B.head] || HD.dome;
    const ex = [53, 67];
    const EY = {
      round: glow(ex.map((x) => `<circle cx="${x}" cy="${EYY}" r="2.8" fill="${arc}"/>`).join('')) + ex.map((x) => `<circle cx="${x}" cy="${EYY}" r="4.3" fill="none" stroke="${acl}" stroke-width="1.4"/>`).join(''),
      happy: glow(ex.map((x) => `<path d="M${x - 4} ${EYY + 1} Q${x} ${EYY - 2.5} ${x + 4} ${EYY + 1}" fill="none" stroke="${arc}" stroke-width="1.8" stroke-linecap="round"/>`).join('')),
      visor: glow(`<rect x="48" y="${EYY - 1.6}" width="24" height="3.2" rx="1" fill="${arc}"/>`),
      pixel: glow(ex.map((x) => `<rect x="${x - 2.6}" y="${EYY - 2.6}" width="5.2" height="5.2" fill="${arc}"/>`).join('')),
      angry: glow(ex.map((x, i) => `<path d="M${x - 4} ${EYY - (i ? -1.6 : 1.6)} L${x + 4} ${EYY + (i ? -1.6 : 1.6)}" stroke="${arc}" stroke-width="2.4" stroke-linecap="round"/>`).join('')),
      heart: glow(ex.map((x) => `<path d="M${x} ${EYY + 3} c-5 -3.4 -5 -7 -2 -7 c1 0 1.6.8 2 1.6 c.4-.8 1-1.6 2-1.6 c3 0 3 3.6 -2 7z" fill="${arc}"/>`).join('')),
      lens: `<circle cx="60" cy="${EYY}" r="6" fill="${METAL}" ${O}/>` + glow(`<circle cx="60" cy="${EYY}" r="3.6" fill="${arc}"/>`) + `<path d="M56.5 ${EYY - 2} L60 ${EYY} M63.5 ${EYY - 2} L60 ${EYY} M60 ${EYY + 4} L60 ${EYY}" stroke="${OLc}" stroke-width=".8" opacity=".6"/>`,
      slit: glow(ex.map((x) => `<rect x="${x - 4.5}" y="${EYY - 0.9}" width="9" height="1.8" rx=".9" fill="${arc}"/>`).join('')),
      gear: ex.map((x) => `<circle cx="${x}" cy="${EYY}" r="4" fill="none" stroke="${acl}" stroke-width="2.2" stroke-dasharray="1.6 1.2"/>`).join('') + glow(ex.map((x) => `<circle cx="${x}" cy="${EYY}" r="2" fill="${arc}"/>`).join('')),
      sleepy: glow(ex.map((x) => `<path d="M${x - 3.6} ${EYY} A3.6 3.6 0 0 0 ${x + 3.6} ${EYY} Z" fill="${arc}"/>`).join('')) + ex.map((x) => `<path d="M${x - 5} ${EYY - 0.4} H${x + 5}" stroke="${acl}" stroke-width="2"/>`).join(''),
      cross: glow(ex.map((x) => `<path d="M${x - 3.5} ${EYY} H${x + 3.5} M${x} ${EYY - 3.5} V${EYY + 3.5}" stroke="${arc}" stroke-width="1.5"/><circle cx="${x}" cy="${EYY}" r="2.6" fill="none" stroke="${arc}" stroke-width="1"/>`).join('')),
    };
    let eyes = H.noEyes ? '' : EY[B.eyes] || EY.round;
    if (H.bar && !H.noEyes) eyes = glow(B.head === 'helm' ? `<rect x="46" y="${EYY - 2.2}" width="28" height="2" rx="1" fill="${arc}"/>` : `<rect x="44" y="${EYY - 1.2}" width="32" height="3.2" rx="1" fill="${arc}"/>`) + (B.head === 'visor' ? `<circle cx="${B.eyes === 'happy' ? 51 : 68}" cy="${EYY + 0.4}" r="2.2" fill="#fff" opacity=".9"/>` : '');
    if (H.round && !H.noEyes) eyes = `<g transform="translate(60 ${EYY + 1}) scale(.72) translate(-60 ${-EYY})">${eyes}</g>`;
    // jaw / mouth: vents and grilles rather than smiles
    const MY = 37.6;
    const MO = {
      smile: `<path d="M52 ${MY} Q60 ${MY + 2.5} 68 ${MY}" fill="none" stroke="${OLc}" stroke-width="1.6"/><path d="M54 ${MY + 2} H66" stroke="${OLc}" stroke-width="1" opacity=".6"/>`,
      flat: `<rect x="52" y="${MY - 1}" width="16" height="2.4" rx=".6" fill="#0e0c10"/>`,
      grill: `<rect x="51" y="${MY - 2.5}" width="18" height="6" rx="1" fill="#0e0c10" ${Ow(1)}/><path d="M55 ${MY - 2.5} v6 M59 ${MY - 2.5} v6 M63 ${MY - 2.5} v6 M67 ${MY - 2.5} v6" stroke="${acl}" stroke-width="1.2"/>`,
      fangs: `<path d="M48 ${MY - 2} H72 L70 ${MY + 4} H50 Z" fill="${METAL}" ${Ow(1.4)}/><path d="M52 ${MY - 2} l1.5 4 1.5-4 M57 ${MY - 2} l1.5 4 1.5-4 M62 ${MY - 2} l1.5 4 1.5-4 M67 ${MY - 2} l1.5 4 1.5-4" fill="#d8ccb4" stroke="${OLc}" stroke-width=".7"/>`,
      stache: `<path d="M60 ${MY - 2} q-3 -2 -7 1 q-2.5 2.4 -5 0 q1.6 4.6 7 2.4 q3 -.8 5 -1.6 q2 .8 5 1.6 q5.4 2.2 7 -2.4 q-2.5 2.4 -5 0 q-4 -3 -7 -1z" fill="${TRIM}" stroke="${OLc}" stroke-width="1"/>`,
      none: '',
    };
    const mouth = H.noEyes || B.head === 'helm' ? '' : (MO[B.mouth || 'smile'] || MO.smile);
    const finishHead = `<path d="M${HX0 + 3} ${HY0 + 5} Q50 ${HY0 + 1} 58 ${HY0 + 1}" fill="none" stroke="#fff" stroke-width="1.4" opacity="${fin === 'polished' ? 0.6 : 0.3}" stroke-linecap="round"/>`;
    // headgear sits on the smaller head: draw the old toppers scaled to fit
    const fit = (svg) => (svg ? `<g transform="translate(60 ${HY0 + 1}) scale(.55) translate(-60 -10)">${svg}</g>` : '');
    const AN = {
      ball: `<path d="M60 12 V-2" stroke="${OLc}" stroke-width="4"/><path d="M60 12 V-2" stroke="${acl}" stroke-width="2"/>${glow(`<circle cx="60" cy="-4" r="4.5" fill="${arc}"/>`)}<circle cx="60" cy="-4" r="5.5" fill="none" stroke="${OLc}" stroke-width="2.2"/>`,
      bolt: `<path d="M60 12 V4" stroke="${OLc}" stroke-width="4"/>${glow(`<path d="M62 -8 l-8 10 h6 l-3 8 9-11 h-6 l3-7z" fill="${arc}"/>`)}`,
      dish: `<path d="M66 12 L74 2" stroke="${OLc}" stroke-width="4"/><path d="M64 -6 Q78 -8 84 6 Z" fill="${METAL}" ${O}/><circle cx="75" cy="0" r="2.5" fill="${arc}"/>`,
      horns: `<path d="M34 16 Q24 4 30 -6 Q36 6 44 12 Z" fill="${METAL}" ${O}/><path d="M86 16 Q96 4 90 -6 Q84 6 76 12 Z" fill="${METAL}" ${O}/>`,
      propeller: `<path d="M60 12 V2" stroke="${OLc}" stroke-width="4"/><ellipse cx="49" cy="0" rx="11" ry="3" fill="${METAL}" ${O}/><ellipse cx="71" cy="0" rx="11" ry="3" fill="${METAL}" ${O}/><circle cx="60" cy="0" r="3" fill="${OLc}"/>`,
      plume: `<path d="M60 12 Q56 -4 70 -12 Q86 -16 92 -4 Q80 -10 72 -2 Q66 6 66 12 Z" fill="${tc}" ${O}/>`,
      chimney: `<rect x="66" y="-8" width="12" height="20" rx="1" fill="${METAL}" ${O}/><rect x="64" y="-11" width="16" height="5" rx="1" fill="${TRIM}" ${O}/><circle cx="74" cy="-18" r="5" fill="#8a8480" opacity=".5"/><circle cx="82" cy="-25" r="4" fill="#8a8480" opacity=".35"/>`,
      crown: `<path d="M40 12 L42 -4 L51 6 L60 -8 L69 6 L78 -4 L80 12 Z" fill="#c89a3a" ${O}/><circle cx="60" cy="2" r="2.6" fill="${arc}"/>`,
      twin: `<path d="M46 12 L40 -2 M74 12 L80 -2" stroke="${OLc}" stroke-width="4"/>${glow(`<circle cx="40" cy="-3" r="4" fill="${arc}"/><circle cx="80" cy="-3" r="4" fill="${arc}"/>`)}`,
      none: '',
    };
    const head = `${fit(AN[B.antenna] || '')}${H.box}${H.plate}${eyes}${mouth}${finishHead}`;
    // the collar plate the head sinks into
    const collar = `<path d="M41 42.5 H79 L84 49 H36 Z" fill="${METAL}" ${O}/>${rivRow(43, 77, 46, 5)}`;
    // ---------- finish ----------
    let finish = '';
    const chips = (pts, col, o) => `<g fill="${col}" opacity="${o}">${pts.map(([x, y, r]) => `<path d="M${x} ${y} l${r} ${-r * 0.4} l${r * 0.5} ${r * 0.9} l${-r * 1.2} ${r * 0.3} z"/>`).join('')}</g>`;
    if (fin === 'worn' || fin === 'clean' || fin === 'matte') finish = chips([[34, 50, 3], [86, 58, 2.5], [44, 86, 3], [76, 84, 2], [46, 18, 2], [72, 40, 2]], '#c8c0b0', fin === 'worn' ? 0.55 : 0.22);
    if (fin === 'worn') finish += `<g stroke="#140e0a" stroke-width="1" opacity=".5" fill="none"><path d="M36 70 l6 -3 M82 80 l-5 3 l-3 -1 M48 24 l4 2"/></g>`;
    if (fin === 'rusty') finish = `<g fill="#7a3a16" opacity=".6">${[[36, 84, 6], [84, 64, 5], [44, 54, 3.5], [76, 20, 3.5], [48, 40, 3], [90, 46, 4]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}"/>`).join('')}</g><g fill="#b8682a" opacity=".5">${[[38, 86, 2.2], [85, 65, 1.8], [90, 47, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <path d="M40 92 v6 M80 92 v8" stroke="#7a3a16" stroke-width="1.6" opacity=".5"/>`;
    if (fin === 'polished') finish = `<path d="M32 48 Q34 44 40 43" fill="none" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>`;
    // ---------- shoulders and back gear (cosmetic) ----------
    const SHD = {
      none: '',
      pauldrons: [[30, -1], [90, 1]].map(([x, d]) => `<path d="M${x - d * 9} 56 Q${x - d * 10} 40 ${x + d * 2} 40 Q${x + d * 13} 41 ${x + d * 13} 56 Z" fill="${TRIM}" ${O}/><path d="M${x - d * 7} 50 H${x + d * 11}" stroke="${td}" stroke-width="1.6"/>${rv(x + d * 2, 45)}`).join(''),
      spikes: [[30, -1], [90, 1]].map(([x, d]) => `<path d="M${x - d * 9} 56 Q${x - d * 9} 42 ${x} 42 Q${x + d * 11} 42 ${x + d * 11} 56 Z" fill="${METAL}" ${O}/><path d="M${x - d * 3} 44 L${x + d * 3} 28 L${x + d * 6} 43 Z" fill="${METAL}" ${O}/>`).join(''),
      bolts: [[30, -1], [90, 1]].map(([x]) => `<rect x="${x - 8}" y="42" width="16" height="11" rx="1.5" fill="${METAL}" ${O}/>${rv(x - 4, 47.5, 1.8)}${rv(x + 4, 47.5, 1.8)}`).join(''),
      lamps: [[30], [90]].map(([x]) => `<rect x="${x - 5}" y="38" width="10" height="12" rx="1" fill="${METAL}" ${O}/>${glow(`<rect x="${x - 3}" y="40" width="6" height="7" rx="1" fill="#ffd890"/>`, 0.8)}`).join(''),
    };
    const BK = {
      none: '',
      boiler: `<rect x="40" y="22" width="40" height="66" rx="14" fill="${METAL}" ${O}/><path d="M41 38 H79 M41 70 H79" stroke="${td}" stroke-width="4"/><rect x="72" y="8" width="8" height="18" rx="1" fill="${METAL}" ${O}/><circle cx="78" cy="0" r="5" fill="#8a8480" opacity=".5"/>`,
      exhaust: [[34], [77]].map(([x]) => `<rect x="${x}" y="16" width="9" height="34" rx="1" fill="${METAL}" ${O}/><rect x="${x - 1.5}" y="13" width="12" height="5" rx="1" fill="${TRIM}" ${O}/>`).join('') + `<circle cx="38" cy="6" r="4" fill="#8a8480" opacity=".45"/><circle cx="82" cy="4" r="5" fill="#8a8480" opacity=".4"/>`,
      banner: `<path d="M98 96 V-6" stroke="${OLc}" stroke-width="5" stroke-linecap="round"/><path d="M98 96 V-6" stroke="#6a5a3a" stroke-width="2.5"/><path d="M99 -4 H120 L114 8 L120 20 H99 Z" fill="${tc}" ${O}/><circle cx="108" cy="8" r="3" fill="${arc}"/>`,
      cog: `<circle cx="60" cy="64" r="40" fill="none" stroke="${OLc}" stroke-width="14" stroke-dasharray="7 5"/><circle cx="60" cy="64" r="40" fill="none" stroke="${acd}" stroke-width="9" stroke-dasharray="7 5"/>`,
      wings: [[-1], [1]].map(([d]) => `<path d="M${60 + d * 16} 56 L${60 + d * 58} 26 L${60 + d * 54} 40 L${60 + d * 60} 44 L${60 + d * 50} 56 L${60 + d * 54} 62 L${60 + d * 16} 70 Z" fill="${METAL}" ${O}/><path d="M${60 + d * 20} 60 L${60 + d * 54} 34 M${60 + d * 20} 64 L${60 + d * 50} 56" stroke="${td}" stroke-width="1.4"/>`).join(''),
      gears: `<circle cx="32" cy="46" r="14" fill="none" stroke="${OLc}" stroke-width="9" stroke-dasharray="5 3.5"/><circle cx="32" cy="46" r="14" fill="none" stroke="${tc}" stroke-width="5" stroke-dasharray="5 3.5"/><circle cx="88" cy="40" r="10" fill="none" stroke="${OLc}" stroke-width="8" stroke-dasharray="4 3"/><circle cx="88" cy="40" r="10" fill="none" stroke="${acl}" stroke-width="4" stroke-dasharray="4 3"/>`,
    };
    const shoulders = SHD[B.shoulders] || '', backGear = BK[B.back] || '';
    // ---------- construct signature parts ----------
    let conBack = '', conFront = '', conHead = '';
    if (B.construct === 'bulwark') { // slab shoulder armour and a ram plate
      conFront = [[24, 1], [96, -1]].map(([x, d]) => `<path d="M${x} 58 Q${x} 40 ${x + d * 18} 39 L${x + d * 22} 39 L${x + d * 22} 54 Q${x + d * 12} 62 ${x} 58 Z" fill="${TRIM}" ${O}/>${rv(x + d * 13, 46, 1.8)}`).join('')
        + `<rect x="42" y="84" width="36" height="7" rx="1" fill="${TRIM}" ${O}/>${rivRow(46, 74, 87.5, 4)}`;
      conHead = `<path d="M${HX0 - 2} ${HY0 + 6} Q60 ${HY0 - 6} ${HX1 + 2} ${HY0 + 6}" fill="none" stroke="${OLc}" stroke-width="6" stroke-linecap="round"/><path d="M${HX0 - 2} ${HY0 + 6} Q60 ${HY0 - 6} ${HX1 + 2} ${HY0 + 6}" fill="none" stroke="${tc}" stroke-width="3.4" stroke-linecap="round"/>`;
    } else if (B.construct === 'sprocket') { // rocket boosters and a fin
      conBack = [[22, 44], [30, 54]].map(([x, y]) => `<g transform="rotate(-35 ${x} ${y})"><rect x="${x - 5}" y="${y - 16}" width="10" height="20" rx="1.5" fill="${METAL}" ${O}/>${glow(`<ellipse cx="${x}" cy="${y - 18}" rx="3.6" ry="5.5" fill="#ff9a30"/>`)}</g>`).join('');
      conHead = `<path d="M56 ${HY0 + 1} Q64 ${HY0 - 10} 76 ${HY0 - 4} Q70 ${HY0 - 2} 66 ${HY0 + 2} Z" fill="${TRIM}" ${O}/>`;
      conFront = `<path d="M33 76 L45 72 M33 82 L47 78" stroke="${tc}" stroke-width="2.6" stroke-linecap="round"/>`;
    } else if (B.construct === 'arcwright') { // a coil mast crackling with arc light
      conBack = `<rect x="27" y="-4" width="6" height="52" rx="1" fill="${METAL}" ${O}/>${glow([8, 20, 32].map((y) => `<ellipse cx="30" cy="${y}" rx="8" ry="2.6" fill="none" stroke="${arc}" stroke-width="2"/>`).join(''), 0.9)}
        ${glow(`<circle cx="30" cy="-6" r="5" fill="url(#${U}c)"/>`, 1)}<circle cx="30" cy="-6" r="5.5" fill="none" stroke="${OLc}" stroke-width="2"/>`;
      conFront = glow(`<path d="M50 54 l-3 5 h3.5 l-2.5 6" fill="none" stroke="${arc}" stroke-width="1.6" stroke-linecap="round"/>`, 0.8);
    }
    return `<svg viewBox="-4 -14 128 136" class="${opts.cls || ''}" aria-label="${AF.esc(B.name || 'Automaton')}">${defs}${backGear}${conBack}${shield}${backArm}${legs}${body}${conFront}${head}${collar}${fit(conHead ? '' : '')}${conHead}${shoulders}${weapon}${finish}</svg>`;
  };
  AF.botSVG = (s, cls) => AF.robotSVG(s.parts, { core: AF.coreColor(s.look), bot: Object.assign({}, s.bot, { construct: s.construct }), cls });
  AF.botKey = (s) => JSON.stringify(s.parts) + AF.coreColor(s.look) + JSON.stringify(s.bot || {}) + s.construct;

  AF.enemySVG = function (type) {
    const e = AF.ENEMIES[type], c = AF.mute ? AF.mute(e.body, 0.25) : e.body;
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
      case 'cogspider': s = `${[[30, 70, 6, 100], [36, 64, 14, 92], [90, 70, 114, 100], [84, 64, 106, 92], [40, 74, 22, 108], [80, 74, 98, 108]].map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 - 26} ${x2} ${y2}" fill="none" stroke="#1a1410" stroke-width="7" stroke-linecap="round"/><path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 - 26} ${x2} ${y2}" fill="none" stroke="#8a6a32" stroke-width="3" stroke-linecap="round"/>`).join('')}
        <g transform="translate(60 66)">${[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => `<rect x="-4" y="-34" width="8" height="10" fill="${c}" ${OL} transform="rotate(${a})"/>`).join('')}<circle r="28" fill="${c}" ${OL}/><circle r="10" fill="#2a2018" ${OL}/></g>
        <circle cx="50" cy="56" r="5" fill="#ff5a2a"/><circle cx="62" cy="52" r="4" fill="#ff5a2a"/><circle cx="72" cy="57" r="5" fill="#ff5a2a"/>`; break;
      case 'gearghoul': s = `<path d="M30 112 Q24 70 38 46 Q60 22 82 46 Q96 70 90 112 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 Z" fill="#2a2a2e" ${OL}/>
        <path d="M36 50 Q60 12 84 50 Q74 64 60 64 Q46 64 36 50 Z" fill="${c}" ${OL}/>
        <rect x="40" y="70" width="40" height="26" rx="6" fill="#3a3a34" ${OL}/>${[46, 56, 66].map((x) => `<rect x="${x}" y="74" width="7" height="18" rx="2" fill="#6a8a5a"/>`).join('')}
        <path d="M20 60 Q8 74 16 92" fill="none" stroke="#5a5a52" stroke-width="8" stroke-linecap="round"/><path d="M100 60 Q112 74 104 92" fill="none" stroke="#5a5a52" stroke-width="8" stroke-linecap="round"/>
        <circle cx="50" cy="46" r="5" fill="#9aff7a"/><circle cx="70" cy="46" r="5" fill="#9aff7a"/>`; break;
      case 'runegolem': s = `<rect x="26" y="96" width="30" height="18" rx="5" fill="#3a3a42" ${OL}/><rect x="64" y="96" width="30" height="18" rx="5" fill="#3a3a42" ${OL}/>
        <path d="M22 40 L40 22 H80 L98 40 L94 98 H26 Z" fill="${c}" ${OL}/><rect x="4" y="44" width="22" height="46" rx="8" fill="${c}" ${OL}/><rect x="94" y="44" width="22" height="46" rx="8" fill="${c}" ${OL}/>
        <path d="M50 50 L60 40 L70 50 L60 76 Z M46 64 H74" fill="none" stroke="#7ae0ff" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="42" y="26" width="36" height="10" rx="4" fill="#1a1a24"/><rect x="46" y="28" width="10" height="6" rx="2" fill="#7ae0ff"/><rect x="64" y="28" width="10" height="6" rx="2" fill="#7ae0ff"/>`; break;
      case 'warden': s = `<rect x="22" y="100" width="76" height="16" rx="6" fill="#2a2420" ${OL}/>
        <path d="M14 58 L30 30 H90 L106 58 L100 104 H20 Z" fill="${c}" ${OL}/>
        <circle cx="60" cy="68" r="22" fill="#e0d4b0" ${OL}/>${[...Array(12)].map((_, i) => `<circle cx="${60 + Math.cos(i * Math.PI / 6) * 17}" cy="${68 + Math.sin(i * Math.PI / 6) * 17}" r="1.6" fill="#2a2018"/>`).join('')}
        <path d="M60 68 L60 54 M60 68 L70 72" stroke="#2a2018" stroke-width="3" stroke-linecap="round"/>
        <path d="M34 30 L40 6 L50 24 L60 2 L70 24 L80 6 L86 30 Z" fill="#a07a3a" ${OL}/><circle cx="60" cy="16" r="4" fill="#ff4a2a"/>
        <rect x="0" y="50" width="18" height="46" rx="6" fill="#6a5028" ${OL}/><rect x="102" y="50" width="18" height="46" rx="6" fill="#6a5028" ${OL}/>
        <rect x="40" y="36" width="12" height="8" rx="3" fill="#ff4a2a"/><rect x="68" y="36" width="12" height="8" rx="3" fill="#ff4a2a"/>`; break;
      // ----- new bots -----
      case 'cogrunner': s = `<circle cx="60" cy="96" r="18" fill="#3a3430" ${OL}/><circle cx="60" cy="96" r="10" fill="none" stroke="#8a8274" stroke-width="5" stroke-dasharray="5 4"/>
        <path d="M30 70 Q30 40 60 38 Q90 40 90 70 Q90 84 60 84 Q30 84 30 70 Z" fill="${c}" ${OL}/><path d="M86 56 l22 -8 l-4 12 z" fill="#d8c08a" ${OL}/><path d="M10 64 h18 M6 74 h20" stroke="#d8c08a" stroke-width="4" stroke-linecap="round" opacity=".7"/>${angry(52, 62, 1.1)}${angry(72, 62, 1.1)}`; break;
      case 'hexer': s = `<path d="M30 112 L40 60 H80 L90 112 Z" fill="#3a2e4a" ${OL}/><path d="M40 60 Q60 14 80 60 Z" fill="${c}" ${OL}/><path d="M48 18 L60 -2 L72 18" fill="${c}" ${OL}/>
        <rect x="44" y="44" width="32" height="14" rx="6" fill="#1a1426" ${OL}/><circle cx="53" cy="51" r="3.5" fill="#c890ff"/><circle cx="67" cy="51" r="3.5" fill="#c890ff"/>
        <path d="M92 50 L104 26" stroke="#8a6a3a" stroke-width="5" stroke-linecap="round"/><circle cx="105" cy="22" r="8" fill="#c890ff" ${OL}/><circle cx="105" cy="22" r="14" fill="#c890ff" opacity=".25"/>`; break;
      case 'frostling': s = `${[34, 86].map((x) => `<rect x="${x - 8}" y="92" width="16" height="22" rx="6" fill="#4a6a7a" ${OL}/>`).join('')}
        <path d="M22 96 L28 42 L46 30 L60 16 L74 30 L92 42 L98 96 Z" fill="${c}" ${OL}/><path d="M46 30 L52 4 L60 16 L68 2 L74 30" fill="#d8f0ff" ${OL}/>
        <path d="M28 60 h64" stroke="#d8f0ff" stroke-width="3" opacity=".6"/>${angry(48, 52, 1.15)}${angry(72, 52, 1.15)}<path d="M50 74 l5 6 l5 -6 l5 6 l5 -6" fill="none" stroke="#16100c" stroke-width="3"/>`; break;
      case 'icewing': s = `<path d="M60 56 L4 30 L22 58 L2 70 L44 70 Z" fill="#d8f0ff" ${OL}/><path d="M60 56 L116 30 L98 58 L118 70 L76 70 Z" fill="#d8f0ff" ${OL}/>
        <ellipse cx="60" cy="64" rx="22" ry="20" fill="${c}" ${OL}/><path d="M60 84 L54 104 L60 98 L66 104 Z" fill="#4a7a9a" ${OL}/><circle cx="60" cy="62" r="9" fill="#16242e" ${OL}/><circle cx="60" cy="62" r="4.5" fill="#7ae0ff"/>`; break;
      case 'glacier': s = `<path d="M12 112 L18 46 L36 22 L60 14 L86 22 L104 46 L108 112 Z" fill="${c}" ${OL}/><path d="M36 22 L42 0 L54 16 L64 -2 L74 16 L86 22" fill="#e8f8ff" ${OL}/>
        <path d="M18 70 L44 64 L60 76 L80 62 L104 68" fill="none" stroke="#d8f0ff" stroke-width="4" opacity=".7"/>${[[8, 70], [112, 70]].map(([x, y]) => `<path d="M${x} ${y - 16} L${x + (x < 60 ? -6 : 6)} ${y + 18} L${x + (x < 60 ? 12 : -12)} ${y + 20} Z" fill="#a8d8f0" ${OL}/>`).join('')}
        ${angry(46, 46, 1.3)}${angry(74, 46, 1.3)}<rect x="44" y="84" width="32" height="10" rx="3" fill="#16242e"/>`; break;
      case 'bogcrawler': s = `${[18, 34, 86, 102].map((x, i) => `<path d="M${x} 84 q${i < 2 ? -10 : 10} 12 ${i < 2 ? -6 : 6} 26" fill="none" stroke="#2a3020" stroke-width="6" stroke-linecap="round"/>`).join('')}
        <ellipse cx="60" cy="74" rx="46" ry="28" fill="${c}" ${OL}/><path d="M24 64 q16 -14 36 -6 q20 -10 36 6" fill="none" stroke="#7a8a4a" stroke-width="5"/>${[[38, 60], [80, 58], [58, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#8aa04a" ${OL}/>`).join('')}
        <path d="M30 88 q-10 8 -4 18 M90 88 q10 8 4 18" fill="none" stroke="#6a8a3a" stroke-width="4"/>${angry(46, 78, 1)}${angry(74, 78, 1)}<path d="M50 94 h20" stroke="#16100c" stroke-width="3"/><circle cx="60" cy="100" r="3" fill="#a8d060"/>`; break;
      case 'sporedrone': s = `<path d="M60 80 L60 104" stroke="#3a3a2a" stroke-width="4"/><ellipse cx="60" cy="56" rx="40" ry="28" fill="${c}" ${OL}/>
        ${[[34, 40], [58, 32], [84, 42], [44, 60], [76, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#c8d870" ${OL}/>`).join('')}<ellipse cx="60" cy="82" rx="24" ry="6" fill="#3a3a2a" ${OL}/>
        ${[[30, 96], [52, 106], [74, 100], [92, 108]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#c8d870" opacity=".7"/>`).join('')}${angry(50, 64, 0.9)}${angry(70, 64, 0.9)}`; break;
      case 'mossgiant': s = `${[30, 90].map((x) => `<rect x="${x - 12}" y="88" width="24" height="26" rx="8" fill="#3a4a2a" ${OL}/>`).join('')}
        <path d="M14 92 Q8 30 60 14 Q112 30 106 92 Z" fill="${c}" ${OL}/><path d="M14 60 q20 -22 46 -10 q26 -14 46 10 q-10 -40 -46 -44 q-36 4 -46 44" fill="#6a8a3a" ${OL}/>
        ${[[30, 36], [72, 26], [94, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#d8a0c8" ${OL}/>`).join('')}<path d="M20 70 q-14 18 -6 40 M100 70 q14 18 6 40" fill="none" stroke="#4a6a2a" stroke-width="5"/>
        ${angry(46, 62, 1.25)}${angry(74, 62, 1.25)}<path d="M44 80 q16 8 32 0" fill="none" stroke="#16100c" stroke-width="3.5"/>`; break;
      case 'cinderimp': s = `<path d="M60 12 Q72 30 66 38 Q84 32 82 56 Q96 70 84 92 Q72 112 60 112 Q48 112 36 92 Q24 70 38 56 Q36 32 54 38 Q48 28 60 12 Z" fill="${c}" ${OL}/>
        <path d="M60 30 Q68 44 64 50 Q76 52 74 70 Q78 86 60 96 Q42 86 46 70 Q44 52 56 50 Q52 44 60 30 Z" fill="#ffb040"/><path d="M60 56 Q66 68 60 84 Q54 68 60 56 Z" fill="#fff2a0"/>
        <path d="M34 40 L22 20 L40 32 M86 40 L98 20 L80 32" fill="#3a1a0a" ${OL}/>${angry(50, 62, 1)}${angry(70, 62, 1)}`; break;
      case 'magmahound': s = `${[28, 46, 78, 96].map((x) => `<rect x="${x - 6}" y="86" width="12" height="26" rx="5" fill="#3a2420" ${OL}/>`).join('')}
        <path d="M14 84 Q10 54 36 50 L72 46 Q90 30 110 40 Q118 52 106 64 L96 66 Q100 84 86 90 H24 Z" fill="${c}" ${OL}/>
        <path d="M30 60 l10 8 l12 -6 l12 8 l12 -6" fill="none" stroke="#ffb040" stroke-width="4" stroke-linejoin="round"/><path d="M14 70 q-12 -6 -12 -22 q8 8 14 6" fill="#ff7a20" ${OL}/>
        <path d="M78 40 L84 22 L92 38" fill="#3a2420" ${OL}/>${angry(98, 50, 1.1)}<path d="M100 64 l4 6 l4 -6" fill="#fff" stroke="#16100c" stroke-width="2"/>`; break;
      case 'furnaceknight': s = `${[36, 84].map((x) => `<rect x="${x - 10}" y="92" width="20" height="22" rx="5" fill="#3a2a24" ${OL}/>`).join('')}
        <rect x="20" y="42" width="80" height="56" rx="12" fill="${c}" ${OL}/><rect x="34" y="54" width="52" height="34" rx="6" fill="#1a0c08" ${OL}/><rect x="38" y="60" width="44" height="22" rx="4" fill="#ff7a20"/>
        ${[44, 54, 64, 74].map((x) => `<path d="M${x} 60 v22" stroke="#1a0c08" stroke-width="3"/>`).join('')}<path d="M30 42 Q30 8 60 6 Q90 8 90 42 Z" fill="#5a3a30" ${OL}/><rect x="40" y="22" width="40" height="8" rx="3" fill="#ff7a20" ${OL}/>
        <path d="M100 60 l18 -40" stroke="#8a8274" stroke-width="7" stroke-linecap="round"/><path d="M104 22 l20 -10 l-6 18 z" fill="#d8c8b8" ${OL}/>`; break
      default: s = `<circle cx="60" cy="60" r="54" fill="#3a1420" ${OL}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="55" y="0" width="10" height="18" rx="4" fill="#6a6e7a" ${OL} transform="rotate(${a} 60 60)"/>`).join('')}
        <circle cx="60" cy="60" r="42" fill="${c}" ${OL}/><circle cx="60" cy="66" r="18" fill="#ffcf5e" ${OL}/><circle cx="60" cy="66" r="8" fill="#ffffff"/>${angry(40, 40, 1.3)}${angry(80, 40, 1.3)}`;
    }
    return `<svg viewBox="-4 -4 128 128" aria-label="${AF.esc(e.name)}">${s}</svg>`;
  };
})();
