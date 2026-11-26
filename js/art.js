/* Automata: ArcForge — cartoon automaton and enemy art (SVG, bold outlines).
   The robot is built from its part levels, so every upgrade shows. Swap for PNGs any time. */
(function () {
  const AF = (window.AF = window.AF || {});
  const OL = 'stroke="#16100c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"';

  const ARC_COL = ['#ffd75e', '#ffb03b', '#5ef2e1', '#7fb8ff', '#e2a6ff'];
  const sh = (c, a) => AF.shadeHex(c, a);

  // The automaton: build options (state.bot) choose the look; part levels choose the gear it carries.
  let uid = 0;
  AF.robotSVG = function (p, opts) {
    opts = opts || {};
    const U = 'g' + (++uid);
    const B = Object.assign(AF.defaultBot ? AF.defaultBot() : {}, opts.bot || {});
    const PAL = AF.BOT_PAINT || [['#f0905a']], mu = (c) => (AF.mute ? AF.mute(c, 0.22) : c);
    // Colours: a palette index (older saves) or any '#rrggbb' picked in the Studio. Picked colours are used as-is.
    const pc = (v, d) => (typeof v === 'string' && v[0] === '#' ? v : mu(PAL[((v == null ? d : v) % PAL.length + PAL.length) % PAL.length][0]));
    const fc = pc(B.paint, 0), fl = sh(fc, 30), tc = pc(B.trim, 1), ac = B.accent != null ? pc(B.accent, 10) : '#4a4e5a', acl = sh(ac, 14);
    const fin = B.finish || 'clean', gloss = fin !== 'matte';
    const arc = opts.core || ARC_COL[p.arc - 1], OLc = '#2a2030';
    const grad = `<defs><linearGradient id="${U}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fl}"/><stop offset="1" stop-color="${sh(fc, -18)}"/></linearGradient>
      <radialGradient id="${U}c"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${arc}"/><stop offset="1" stop-color="${sh(arc, -30)}"/></radialGradient></defs>`;
    let legs = '';
    switch (p.legs) {
      case 1: legs = [40, 80].map((x) => `<circle cx="${x}" cy="100" r="13" fill="${ac}" ${OL}/><circle cx="${x}" cy="100" r="5" fill="${tc}" ${OL}/>`).join(''); break;
      case 2: legs = `<rect x="22" y="88" width="76" height="24" rx="12" fill="${ac}" ${OL}/>${[34, 50, 66, 82].map((x) => `<circle cx="${x}" cy="100" r="6" fill="${tc}" ${OL}/>`).join('')}`; break;
      case 3: legs = `<ellipse cx="60" cy="96" rx="34" ry="11" fill="${tc}" ${OL}/><ellipse cx="44" cy="108" rx="7" ry="5" fill="${arc}"/><ellipse cx="76" cy="108" rx="7" ry="5" fill="${arc}"/><ellipse cx="60" cy="110" rx="26" ry="4" fill="${arc}" opacity=".35"/>`; break;
      case 4: legs = [[38, 16, 112], [50, 30, 114], [70, 90, 114], [82, 104, 112]].map(([x, x2, y2]) =>
        `<path d="M${x} 86 Q${(x + x2) / 2} ${y2 - 30} ${x2} ${y2}" fill="none" stroke="${OLc}" stroke-width="9" stroke-linecap="round"/><path d="M${x} 86 Q${(x + x2) / 2} ${y2 - 30} ${x2} ${y2}" fill="none" stroke="${tc}" stroke-width="4" stroke-linecap="round"/>`).join(''); break;
      default: legs = `<rect x="34" y="86" width="16" height="20" rx="6" fill="${fc}" ${OL}/><rect x="70" y="86" width="16" height="20" rx="6" fill="${fc}" ${OL}/>
        <rect x="26" y="102" width="30" height="11" rx="5" fill="${tc}" ${OL}/><rect x="64" y="102" width="30" height="11" rx="5" fill="${tc}" ${OL}/><ellipse cx="60" cy="116" rx="36" ry="3" fill="${arc}" opacity=".5"/>`;
    }
    const sr = 12 + p.shield * 3, shc = p.shield >= 4 ? arc : tc;
    const shield = `<circle cx="22" cy="68" r="${sr}" fill="${shc}" ${OL}/><circle cx="22" cy="68" r="${sr * 0.5}" fill="#ffffff" opacity=".45"/><path d="M22 ${68 - sr * 0.35} l${sr * 0.3} ${sr * 0.35} l-${sr * 0.3} ${sr * 0.35} l-${sr * 0.3} -${sr * 0.35}z" fill="${p.shield >= 3 ? '#ffd860' : sh(tc, -30)}"/>`;
    const tools = [
      `<path d="M14 82 l-6 -4 m6 4 l-6 4" stroke="${OLc}" stroke-width="5" stroke-linecap="round"/>`,
      `<path d="M16 80 l-12 2 l12 5z" fill="#c8ccd8" ${OL}/>`,
      `<rect x="2" y="78" width="14" height="7" rx="3" fill="#c8ccd8" ${OL}/>`,
      `<path d="M16 78 h-12 M16 84 h-14 M16 72 h-9" stroke="${OLc}" stroke-width="4" stroke-linecap="round"/>`,
      `<circle cx="9" cy="81" r="7" fill="${arc}" ${OL}/>`];
    const LS = B.limbs || 'cable';
    const limb = (d) => LS === 'piston' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc}" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>`
      : LS === 'plated' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc}" stroke-width="8" stroke-dasharray="5 2.5"/>`
      : LS === 'chain' ? `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${acl}" stroke-width="5" stroke-dasharray="3 3" stroke-linecap="round"/>`
      : `<path d="${d}" fill="none" stroke="${OLc}" stroke-width="12" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${tc}" stroke-width="6" stroke-linecap="round"/>`;
    const backArm = `${limb('M34 66 Q22 74 18 80')}${tools[p.arms - 1]}`;
    const gl = 16 + p.weapon * 5;
    const weapon = `${limb('M84 66 Q94 70 96 74')}
      <rect x="88" y="66" width="${gl}" height="${11 + p.weapon}" rx="${5 + p.weapon / 2}" fill="${acl}" ${OL}/>
      <rect x="${84 + gl}" y="${66 - 1}" width="8" height="${13 + p.weapon}" rx="3" fill="${p.weapon >= 3 ? arc : tc}" ${OL}/>`;
    // chassis (torso shape)
    const CH = {
      round: `<rect x="32" y="52" width="56" height="40" rx="20" fill="url(#${U}p)" ${OL}/>`,
      boxy: `<rect x="30" y="52" width="60" height="40" rx="7" fill="url(#${U}p)" ${OL}/>`,
      tall: `<path d="M38 50 H82 L88 92 H32 Z" fill="url(#${U}p)" ${OL}/>`,
      bug: `<ellipse cx="60" cy="74" rx="33" ry="22" fill="url(#${U}p)" ${OL}/><path d="M60 54 V94" stroke="${OLc}" stroke-width="2.5"/>`,
      barrel: `<rect x="33" y="50" width="54" height="44" rx="12" fill="url(#${U}p)" ${OL}/><path d="M34 62 H86 M34 82 H86" stroke="${tc}" stroke-width="4"/><path d="M34 62 H86 M34 82 H86" stroke="${OLc}" stroke-width="1" opacity=".5"/>`,
      kite: `<path d="M28 52 H92 L78 94 H42 Z" fill="url(#${U}p)" ${OL}/>`,
      furnace: `<path d="M34 54 Q34 48 40 48 H80 Q86 48 86 54 V94 H34 Z" fill="url(#${U}p)" ${OL}/><rect x="44" y="82" width="32" height="10" rx="2" fill="#2a1a12" ${OL}/><rect x="47" y="85" width="26" height="5" rx="1" fill="#ff8a30" opacity=".85"/>`,
    };
    const plating = p.frame >= 2 ? `<rect x="${B.chassis === 'bug' ? 30 : 28}" y="54" width="14" height="10" rx="4" fill="${tc}" ${OL}/><rect x="${B.chassis === 'bug' ? 76 : 78}" y="54" width="14" height="10" rx="4" fill="${tc}" ${OL}/>` : '';
    const rivets = p.frame >= 3 ? [[38, 86], [82, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${sh(fc, -35)}"/>`).join('') : '';
    const gold = p.frame >= 5 ? `<path d="M40 88 H80" stroke="#ffd860" stroke-width="3" stroke-linecap="round"/>` : '';
    const DEC = {
      none: '', stripe: `<path d="M34 64 L86 80" stroke="${tc}" stroke-width="5" opacity=".9"/>`,
      star: `<path d="M76 60 l2.4 5 5.4.6 -4 3.7 1.1 5.3 -4.9-2.7 -4.9 2.7 1.1-5.3 -4-3.7 5.4-.6z" fill="${tc}" stroke="${OLc}" stroke-width="1.5"/>`,
      number: `<text x="40" y="86" font-family="Fredoka, Arial Black, sans-serif" font-weight="700" font-size="13" fill="${tc}" stroke="${OLc}" stroke-width="1">${(B.num || 7) % 100}</text>`,
      flame: `<path d="M36 90 q4 -14 10 -6 q2 -10 8 -4 q4 -8 8 2 q-6 10 -26 8z" fill="#ff8a30" stroke="${OLc}" stroke-width="1.5"/>`,
      bolt: `<path d="M80 58 l-7 10 h5 l-4 9 9-12 h-5 l4-7z" fill="#ffd860" stroke="${OLc}" stroke-width="1.5"/>`,
      gear: `<circle cx="77" cy="64" r="6.5" fill="none" stroke="${tc}" stroke-width="4" stroke-dasharray="2.6 1.6"/><circle cx="77" cy="64" r="4" fill="${tc}" stroke="${OLc}" stroke-width="1.2"/><circle cx="77" cy="64" r="1.6" fill="${OLc}"/>`,
      checker: `<g opacity=".9">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => (r + c) % 2 ? '' : `<rect x="${70 + c * 5}" y="${58 + r * 5}" width="5" height="5" fill="${tc}"/>`).join('')).join('')}</g><rect x="70" y="58" width="15" height="15" fill="none" stroke="${OLc}" stroke-width="1.2"/>`,
      crest: `<path d="M70 57 H84 V65 Q84 72 77 75 Q70 72 70 65 Z" fill="${tc}" stroke="${OLc}" stroke-width="1.5"/><path d="M77 59 V73 M71 64 H83" stroke="${fc}" stroke-width="2"/>`,
      skull: `<circle cx="77" cy="63" r="5.5" fill="#efe6d4" stroke="${OLc}" stroke-width="1.3"/><rect x="74" y="66" width="6" height="4" rx="1" fill="#efe6d4" stroke="${OLc}" stroke-width="1.2"/><circle cx="75" cy="63" r="1.4" fill="${OLc}"/><circle cx="79" cy="63" r="1.4" fill="${OLc}"/>`,
    };
    const body = `${CH[B.chassis] || CH.round}${plating}${gloss ? `<rect x="42" y="60" width="36" height="24" rx="11" fill="${fl}" opacity="${fin === 'polished' ? 0.6 : 0.45}"/>` : ''}${DEC[B.decal] || ''}
      <circle cx="60" cy="72" r="${8 + p.arc}" fill="${arc}" opacity=".3"/><circle cx="60" cy="72" r="${5 + p.arc * 0.8}" fill="url(#${U}c)" ${OL}/>${rivets}${gold}`;
    // head
    const HD = {
      dome: { box: `<rect x="24" y="10" width="72" height="48" rx="22" fill="url(#${U}p)" ${OL}/>`, scr: `<rect x="34" y="20" width="54" height="30" rx="13" fill="#1e2440" ${OL}/>` },
      square: { box: `<rect x="24" y="10" width="72" height="48" rx="8" fill="url(#${U}p)" ${OL}/>`, scr: `<rect x="33" y="19" width="56" height="31" rx="5" fill="#1e2440" ${OL}/>` },
      crt: { box: `<rect x="22" y="10" width="76" height="50" rx="10" fill="url(#${U}p)" ${OL}/><rect x="80" y="48" width="10" height="6" rx="2" fill="${tc}" ${OL}/>`, scr: `<rect x="30" y="17" width="54" height="34" rx="12" fill="#14203a" ${OL}/><path d="M33 22 Q57 18 81 22" stroke="#ffffff" stroke-width="2" opacity=".25" fill="none"/>` },
      visor: { box: `<path d="M24 34 Q24 8 60 8 Q96 8 96 34 V48 Q96 58 84 58 H36 Q24 58 24 48 Z" fill="url(#${U}p)" ${OL}/>`, scr: `<rect x="26" y="25" width="68" height="20" rx="10" fill="#1e2440" ${OL}/>` },
      helm: { box: `<path d="M24 58 V32 Q24 6 60 6 Q96 6 96 32 V58 Z" fill="url(#${U}p)" ${OL}/><path d="M60 7 V58" stroke="${sh(fc, -30)}" stroke-width="3"/>`, scr: `<rect x="32" y="28" width="58" height="13" rx="3" fill="#141826" ${OL}/>`, slit: true },
      lantern: { box: `<path d="M30 14 Q60 -2 90 14 Z" fill="${tc}" ${OL}/><rect x="26" y="14" width="68" height="44" rx="6" fill="${tc}" ${OL}/>`, scr: `<rect x="31" y="18" width="58" height="36" rx="4" fill="#3a2a14" ${OL}/><rect x="31" y="18" width="58" height="36" rx="4" fill="url(#${U}c)" opacity=".25"/><path d="M50 18 V54 M70 18 V54" stroke="${tc}" stroke-width="3"/>` },
      bucket: { box: `<path d="M27 58 L32 9 H88 L93 58 Z" fill="url(#${U}p)" ${OL}/><path d="M30 20 H90" stroke="${tc}" stroke-width="4"/>`, scr: `<rect x="35" y="25" width="52" height="27" rx="6" fill="#1e2440" ${OL}/>` },
      skull: { box: `<path d="M24 36 Q24 6 60 6 Q96 6 96 36 Q96 48 86 50 V58 H34 V50 Q24 48 24 36 Z" fill="url(#${U}p)" ${OL}/>`, scr: `<path d="M34 24 Q34 20 40 20 H84 Q90 20 90 26 V44 Q90 50 82 50 H42 Q34 50 34 44 Z" fill="#1e2440" ${OL}/>` },
    };
    const H = HD[B.head] || HD.dome;
    const EY = {
      round: `<ellipse cx="52" cy="35" rx="6.5" ry="8.5" fill="${arc}"/><ellipse cx="74" cy="35" rx="6.5" ry="8.5" fill="${arc}"/><circle cx="54" cy="31" r="2.4" fill="#fff"/><circle cx="76" cy="31" r="2.4" fill="#fff"/>`,
      happy: `<path d="M45 37 q7 -10 14 0 M67 37 q7 -10 14 0" stroke="${arc}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      visor: `<rect x="40" y="30" width="44" height="9" rx="4.5" fill="${arc}"/><rect x="44" y="31.5" width="12" height="3" rx="1.5" fill="#fff" opacity=".8"/>`,
      pixel: `<rect x="46" y="28" width="11" height="11" fill="${arc}"/><rect x="68" y="28" width="11" height="11" fill="${arc}"/><rect x="49" y="30" width="3" height="3" fill="#fff"/><rect x="71" y="30" width="3" height="3" fill="#fff"/>`,
      angry: `<ellipse cx="52" cy="36" rx="6.5" ry="6.5" fill="${arc}"/><ellipse cx="74" cy="36" rx="6.5" ry="6.5" fill="${arc}"/><path d="M42 27 L59 32 M84 27 L67 32" stroke="${arc}" stroke-width="3.4" stroke-linecap="round"/>`,
      heart: [52, 74].map((x) => `<path d="M${x} 42 c-9 -6 -9 -14 -3.5 -14 c2 0 3 1.5 3.5 3 c.5-1.5 1.5-3 3.5-3 c5.5 0 5.5 8 -3.5 14z" fill="${arc}"/>`).join(''),
      lens: `<circle cx="63" cy="35" r="11" fill="${sh(arc, -40)}" stroke="${tc}" stroke-width="3"/><circle cx="63" cy="35" r="6.5" fill="${arc}"/><circle cx="66" cy="31" r="2.6" fill="#fff"/>`,
      slit: `<ellipse cx="52" cy="35" rx="7.5" ry="2.6" fill="${arc}"/><ellipse cx="74" cy="35" rx="7.5" ry="2.6" fill="${arc}"/>`,
      gear: [52, 74].map((x) => `<circle cx="${x}" cy="35" r="7" fill="none" stroke="${arc}" stroke-width="3.4" stroke-dasharray="2.4 1.8"/><circle cx="${x}" cy="35" r="3.2" fill="${arc}"/>`).join(''),
      sleepy: [52, 74].map((x) => `<path d="M${x - 7} 34 q7 9 14 0 z" fill="${arc}"/><path d="M${x - 8} 33.5 h16" stroke="${arc}" stroke-width="2.4" stroke-linecap="round"/>`).join(''),
      cross: [52, 74].map((x) => `<path d="M${x - 5} 30 l10 10 M${x + 5} 30 l-10 10" stroke="${arc}" stroke-width="3.6" stroke-linecap="round"/>`).join(''),
    };
    const MO = {
      smile: `<path d="M57 44 q6 5 12 0" fill="none" stroke="${arc}" stroke-width="2.6" stroke-linecap="round"/>`,
      flat: `<path d="M56 46 h14" stroke="${arc}" stroke-width="2.6" stroke-linecap="round"/>`,
      grill: `<rect x="54" y="42" width="18" height="7" rx="2" fill="none" stroke="${arc}" stroke-width="1.8"/><path d="M58.5 42 v7 M63 42 v7 M67.5 42 v7" stroke="${arc}" stroke-width="1.5"/>`,
      fangs: `<path d="M55 43 q8 6 16 0" fill="none" stroke="${arc}" stroke-width="2.4" stroke-linecap="round"/><path d="M58 44.5 l1.5 3.5 1.5-3 M68 44.5 l-1.5 3.5 -1.5-3" fill="${arc}"/>`,
      stache: `<path d="M63 43 q-4 -3 -9 1 q-3 3 -6 0 q2 6 9 3 q4 -1 6 -2 q2 1 6 2 q7 3 9 -3 q-3 3 -6 0 q-5 -4 -9 -1z" fill="${tc}" stroke="${OLc}" stroke-width="1.2"/>`,
      none: '',
    };
    const mk = B.mouth || (B.eyes === 'angry' ? 'flat' : 'smile');
    const mouth = B.eyes === 'visor' || B.head === 'visor' || (H.slit && mk !== 'stache') ? '' : MO[mk] || MO.smile;
    const eyes = B.head === 'helm' ? `<rect x="36" y="32" width="50" height="5" rx="2.5" fill="${arc}" opacity=".9"/>` : B.head === 'visor' ? `<rect x="34" y="30" width="52" height="9" rx="4.5" fill="${arc}" opacity=".9"/><circle cx="${B.eyes === 'happy' ? 50 : 70}" cy="34.5" r="3" fill="#fff"/>` : (EY[B.eyes] || EY.round);
    const cheeks = B.head === 'visor' || H.slit || fin === 'rusty' ? '' : `<ellipse cx="42" cy="46" rx="4" ry="2.4" fill="#ff8aa8" opacity=".3"/><ellipse cx="82" cy="46" rx="4" ry="2.4" fill="#ff8aa8" opacity=".3"/>`;
    const AN = {
      ball: `<path d="M60 12 V0" stroke="${OLc}" stroke-width="4"/><circle cx="60" cy="0" r="5.5" fill="${arc}" ${OL}/>`,
      bolt: `<path d="M60 12 V4" stroke="${OLc}" stroke-width="4"/><path d="M62 -8 l-8 10 h6 l-3 8 9-11 h-6 l3-7z" fill="${arc}" stroke="${OLc}" stroke-width="2"/>`,
      dish: `<path d="M66 12 L74 2" stroke="${OLc}" stroke-width="4"/><path d="M64 -6 Q78 -8 84 6 Z" fill="${tc}" ${OL}/><circle cx="75" cy="0" r="2.5" fill="${arc}"/>`,
      horns: `<path d="M34 16 Q24 4 30 -6 Q36 6 44 12 Z" fill="${tc}" ${OL}/><path d="M86 16 Q96 4 90 -6 Q84 6 76 12 Z" fill="${tc}" ${OL}/>`,
      propeller: `<path d="M60 12 V2" stroke="${OLc}" stroke-width="4"/><ellipse cx="50" cy="0" rx="11" ry="3.5" fill="${tc}" ${OL}/><ellipse cx="70" cy="0" rx="11" ry="3.5" fill="${arc}" ${OL}/><circle cx="60" cy="0" r="3" fill="${OLc}"/>`,
      plume: `<path d="M60 12 Q56 -4 70 -12 Q86 -16 92 -4 Q80 -10 72 -2 Q66 6 66 12 Z" fill="${tc}" ${OL}/><path d="M64 8 Q66 -4 80 -9" fill="none" stroke="${sh(tc, -35)}" stroke-width="1.6"/>`,
      chimney: `<rect x="66" y="-6" width="12" height="18" rx="2" fill="${ac}" ${OL}/><rect x="64" y="-9" width="16" height="5" rx="2" fill="${acl}" ${OL}/><circle cx="74" cy="-16" r="5" fill="#c8c0b4" opacity=".55"/><circle cx="82" cy="-22" r="4" fill="#c8c0b4" opacity=".4"/>`,
      crown: `<path d="M40 12 L42 -4 L51 6 L60 -8 L69 6 L78 -4 L80 12 Z" fill="#e8b84a" ${OL}/><circle cx="60" cy="2" r="2.6" fill="${arc}"/>`,
      twin: `<path d="M46 12 L40 -2 M74 12 L80 -2" stroke="${OLc}" stroke-width="4"/><circle cx="40" cy="-3" r="4.5" fill="${arc}" ${OL}/><circle cx="80" cy="-3" r="4.5" fill="${arc}" ${OL}/>`,
      none: '',
    };
    const ear = B.head === 'crt' ? '' : `<circle cx="${p.frame >= 3 ? 96 : 24}" cy="34" r="5" fill="${tc}" ${OL}/>`;
    const head = `${AN[B.antenna] || ''}${H.box}${gloss ? `<rect x="32" y="13" width="22" height="6" rx="3" fill="#ffffff" opacity="${fin === 'polished' ? 0.7 : 0.45}"/>` : ''}${H.scr}${eyes}${mouth}${cheeks}${ear}`;
    // finish overlays (on top of body and head)
    let finish = '';
    if (fin === 'worn') finish = `<g stroke="#2a2030" stroke-width="1.2" opacity=".45" fill="none"><path d="M38 70 l6 -3 M80 82 l-5 3 l-3 -1 M34 30 l5 2 M86 22 l-4 4"/></g><g fill="#2a1e18" opacity=".18"><ellipse cx="44" cy="90" rx="10" ry="3"/><ellipse cx="82" cy="54" rx="8" ry="3"/></g>`;
    else if (fin === 'rusty') finish = `<g fill="#9a4a1e" opacity=".55">${[[38, 84, 6], [82, 66, 5], [46, 58, 3.5], [88, 40, 5], [30, 20, 4], [74, 14, 3]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}"/>`).join('')}</g><g fill="#c87a3a" opacity=".45">${[[40, 86, 2.4], [84, 67, 2], [89, 42, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    else if (fin === 'polished') finish = `<path d="M30 30 Q34 16 46 12" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6" stroke-linecap="round"/><path d="M36 60 Q40 56 46 55" fill="none" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>`;
    // shoulders and back gear (cosmetic)
    const SHD = {
      none: '',
      pauldrons: [[30, -1], [90, 1]].map(([x, d]) => `<path d="M${x - d * 10} 64 Q${x - d * 10} 50 ${x} 50 Q${x + d * 12} 50 ${x + d * 12} 64 Z" fill="${tc}" ${OL}/><circle cx="${x + d * 2}" cy="57" r="1.8" fill="${sh(tc, -40)}"/>`).join(''),
      spikes: [[30, -1], [90, 1]].map(([x, d]) => `<path d="M${x - d * 9} 64 Q${x - d * 9} 52 ${x} 52 Q${x + d * 10} 52 ${x + d * 10} 64 Z" fill="${ac}" ${OL}/><path d="M${x - d * 4} 54 L${x + d * 2} 40 L${x + d * 5} 53 Z" fill="${tc}" ${OL}/>`).join(''),
      bolts: [[32, -1], [88, 1]].map(([x]) => `<rect x="${x - 7}" y="52" width="14" height="10" rx="3" fill="${acl}" ${OL}/><circle cx="${x - 3}" cy="57" r="1.6" fill="${OLc}"/><circle cx="${x + 3}" cy="57" r="1.6" fill="${OLc}"/>`).join(''),
      lamps: [[30], [90]].map(([x]) => `<rect x="${x - 5}" y="48" width="10" height="12" rx="2" fill="${ac}" ${OL}/><rect x="${x - 3}" y="50" width="6" height="7" rx="1.5" fill="#ffd890"/><circle cx="${x}" cy="53" r="7" fill="#ffd890" opacity=".25"/>`).join(''),
    };
    const BK = {
      none: '',
      boiler: `<rect x="38" y="30" width="44" height="64" rx="16" fill="${ac}" ${OL}/><path d="M39 46 H81 M39 78 H81" stroke="${tc}" stroke-width="4"/><rect x="72" y="18" width="8" height="16" rx="2" fill="${acl}" ${OL}/><circle cx="80" cy="10" r="5" fill="#c8c0b4" opacity=".5"/>`,
      exhaust: [[36], [76]].map(([x]) => `<rect x="${x}" y="24" width="9" height="34" rx="3" fill="${acl}" ${OL}/><rect x="${x - 1.5}" y="21" width="12" height="5" rx="2" fill="${ac}" ${OL}/>`).join('') + `<circle cx="40" cy="14" r="4" fill="#c8c0b4" opacity=".45"/><circle cx="82" cy="12" r="5" fill="#c8c0b4" opacity=".4"/>`,
      banner: `<path d="M96 96 V-8" stroke="${OLc}" stroke-width="5" stroke-linecap="round"/><path d="M96 96 V-8" stroke="#8a6a3a" stroke-width="2.5"/><path d="M97 -6 H120 L114 6 L120 18 H97 Z" fill="${tc}" ${OL}/><circle cx="106" cy="6" r="3" fill="${arc}"/>`,
      cog: `<circle cx="60" cy="70" r="40" fill="none" stroke="${OLc}" stroke-width="14" stroke-dasharray="7 5"/><circle cx="60" cy="70" r="40" fill="none" stroke="${acl}" stroke-width="9" stroke-dasharray="7 5"/><circle cx="60" cy="70" r="35" fill="none" stroke="${OLc}" stroke-width="3"/>`,
      wings: [[-1], [1]].map(([d]) => `<path d="M${60 + d * 14} 64 Q${60 + d * 44} 26 ${60 + d * 62} 34 Q${60 + d * 52} 50 ${60 + d * 56} 60 Q${60 + d * 42} 62 ${60 + d * 44} 76 Q${60 + d * 30} 70 ${60 + d * 14} 74 Z" fill="${tc}" ${OL}/><path d="M${60 + d * 20} 66 L${60 + d * 52} 40 M${60 + d * 20} 70 L${60 + d * 44} 64" stroke="${sh(tc, -35)}" stroke-width="1.6"/>`).join(''),
      gears: `<circle cx="34" cy="54" r="14" fill="none" stroke="${OLc}" stroke-width="9" stroke-dasharray="5 3.5"/><circle cx="34" cy="54" r="14" fill="none" stroke="${tc}" stroke-width="5" stroke-dasharray="5 3.5"/><circle cx="88" cy="46" r="10" fill="none" stroke="${OLc}" stroke-width="8" stroke-dasharray="4 3"/><circle cx="88" cy="46" r="10" fill="none" stroke="${acl}" stroke-width="4" stroke-dasharray="4 3"/>`,
    };
    const shoulders = SHD[B.shoulders] || '', backGear = BK[B.back] || '';
    // Construct signature parts
    let conBack = '', conFront = '', conHead = '';
    if (B.construct === 'bulwark') {
      conFront = [[24, 1], [96, -1]].map(([x, d]) => `<path d="M${x} 66 Q${x} 48 ${x + d * 18} 47 L${x + d * 22} 47 L${x + d * 22} 62 Q${x + d * 12} 70 ${x} 66 Z" fill="${tc}" ${OL}/><circle cx="${x + d * 13}" cy="55" r="2.2" fill="${sh(tc, -40)}"/>`).join('')
        + `<rect x="44" y="84" width="32" height="7" rx="3" fill="${tc}" ${OL}/>`;
      conHead = `<path d="M30 14 Q60 2 90 14" fill="none" stroke="${tc}" stroke-width="5" stroke-linecap="round"/>`;
    } else if (B.construct === 'sprocket') {
      conBack = [[22, 50], [28, 60]].map(([x, y]) => `<g transform="rotate(-35 ${x} ${y})"><rect x="${x - 5}" y="${y - 16}" width="10" height="20" rx="3" fill="${acl}" ${OL}/><ellipse cx="${x}" cy="${y - 18}" rx="4" ry="6" fill="#ff9a30" opacity=".9"/></g>`).join('');
      conHead = `<path d="M50 11 Q62 -6 80 4 Q70 6 66 12 Z" fill="${tc}" ${OL}/>`;
      conFront = `<path d="M36 78 L48 74 M36 84 L50 80" stroke="${tc}" stroke-width="3" stroke-linecap="round"/>`;
    } else if (B.construct === 'arcwright') {
      conBack = `<rect x="27" y="0" width="6" height="58" rx="3" fill="${tc}" ${OL}/>${[14, 26, 38].map((y) => `<ellipse cx="30" cy="${y}" rx="9" ry="3" fill="none" stroke="${arc}" stroke-width="2.5" opacity=".85"/>`).join('')}
        <circle cx="30" cy="-2" r="9" fill="${arc}" opacity=".3"/><circle cx="30" cy="-2" r="5.5" fill="url(#${U}c)" ${OL}/>`;
      conFront = `<path d="M60 62 l-3 6 h4 l-3 7" fill="none" stroke="${arc}" stroke-width="2" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="-4 -14 128 136" class="${opts.cls || ''}" aria-label="${AF.esc(B.name || 'Automaton')}">${grad}${backGear}${conBack}${shield}${backArm}${legs}${body}${shoulders}${conFront}${weapon}${head}${conHead}${finish}</svg>`;
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
      default: s = `<circle cx="60" cy="60" r="54" fill="#3a1420" ${OL}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="55" y="0" width="10" height="18" rx="4" fill="#6a6e7a" ${OL} transform="rotate(${a} 60 60)"/>`).join('')}
        <circle cx="60" cy="60" r="42" fill="${c}" ${OL}/><circle cx="60" cy="66" r="18" fill="#ffcf5e" ${OL}/><circle cx="60" cy="66" r="8" fill="#ffffff"/>${angry(40, 40, 1.3)}${angry(80, 40, 1.3)}`;
    }
    return `<svg viewBox="-4 -4 128 128" aria-label="${AF.esc(e.name)}">${s}</svg>`;
  };
})();
