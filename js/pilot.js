/* ArcForge — the pilot: appearance catalog, drawing, and the character creator.
   Items with a price are sold at the Boutique; everything else is free from the start. */
(function () {
  const AF = (window.AF = window.AF || {});

  const L = (AF.LOOK = {
    skin: ['#f6d3b3', '#e8b98f', '#c98e62', '#9b6440', '#6e4429', '#4a2c1a'],
    hairColor: ['#1c1410', '#4a2f1c', '#8a5a2b', '#d9a54a', '#ecdcaa', '#b8402e', '#e86aa6', '#5aa0e8', '#7ed67e', '#e8e8ee'],
    color: ['#2f5d8a', '#a83a32', '#3d7a44', '#d98c2b', '#6b4a8a', '#2a2a2e', '#e6e6e6', '#3fb6a8', '#e06a9a', '#7a5a3a'],
    core: [['#ffd75e', 'Solar'], ['#5ef2e1', 'Arc blue'], ['#ff6b5c', 'Ember'], ['#7ee08a', 'Toxic'],
           ['#c27bff', 'Void'], ['#7fb8ff', 'Glacier'], ['#ff9ad5', 'Bubblegum'], ['#ffffff', 'Starlight']],
    hair: [['Buzz'], ['Short'], ['Spiky'], ['Curly'], ['Bob'], ['Long'], ['Ponytail'], ['Bun'], ['Mohawk', 300], ['Twin tails', 300]],
    top: [['Tee'], ['Jacket'], ['Hoodie'], ['Overalls'], ['Lab coat', 400], ['Flight suit', 500], ['Armor vest', 600]],
    bottom: [['Pants'], ['Shorts'], ['Skirt']],
    hat: [['None'], ['Cap'], ['Beanie'], ['Goggles'], ['Hard hat'], ['Bandana'], ['Headphones'],
          ['Antenna band', 250], ['Top hat', 350], ['Wizard hat', 450], ['Crown', 1200]],
    acc: [['None'], ['Scarf'], ['Glasses'], ['Backpack'], ['Tool belt', 300], ['Cape', 550], ['Jetpack', 900]],
  });
  AF.LOOK_SLOTS = [['hair', 'Hair style'], ['top', 'Top'], ['bottom', 'Bottoms'], ['hat', 'Headwear'], ['acc', 'Accessory']];

  AF.defaultLook = function (body) {
    return { name: '', body: body || 'f', skin: 1, hair: body === 'm' ? 1 : 6, hairColor: 2, top: 1, topColor: 7,
      bottom: 0, bottomColor: 5, hat: 0, acc: 0, core: 1 };
  };
  AF.randomLook = function () {
    const pick = (n) => Math.floor(Math.random() * n), free = (k) => L[k].map((v, i) => (v[1] ? -1 : i)).filter((i) => i >= 0);
    const any = (k) => { const f = free(k); return f[pick(f.length)]; };
    const body = Math.random() < 0.5 ? 'm' : 'f';
    return { name: '', body, skin: pick(L.skin.length), hair: any('hair'), hairColor: pick(L.hairColor.length), top: any('top'),
      topColor: pick(L.color.length), bottom: any('bottom'), bottomColor: pick(L.color.length), hat: any('hat'), acc: any('acc'), core: pick(L.core.length) };
  };
  AF.coreColor = (look) => L.core[(look && look.core) || 0][0];
  AF.isUnlocked = (state, slot, i) => !L[slot][i][1] || (state && state.unlocks && state.unlocks.includes(slot + ':' + i));

  // ---------- Vector pilot: shaded chibi, four directions, smooth walk cycle ----------
  // cx = centre x, fy = feet y, H = full height (px). phase advances π per tile walked.
  const mix = (c, amt) => AF.shadeHex(c, amt);
  AF.drawPilotAt = function (g, cx, fy, H, look, dir, phase, opt) {
    opt = opt || {};
    g.save();
    if (dir === 'right') { g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); dir = 'left'; }
    g.translate(cx, fy - H); g.scale(H, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const OL = '#3a2638'; g.strokeStyle = OL; g.lineWidth = 0.022;
    const sk = L.skin[look.skin], hc = L.hairColor[look.hairColor], tc = L.color[look.topColor], bc = L.color[look.bottomColor];
    const f = look.body === 'f', top = L.top[look.top][0], hair = L.hair[look.hair][0], hat = L.hat[look.hat][0], acc = L.acc[look.acc][0];
    const suit = top === 'Flight suit', bottom = suit ? 'Pants' : L.bottom[look.bottom][0], legC = suit ? tc : bc;
    const tucked = ['Cap', 'Beanie', 'Hard hat', 'Bandana', 'Top hat', 'Wizard hat'].includes(hat);
    const style = tucked && ['Spiky', 'Mohawk', 'Bun', 'Curly'].includes(hair) ? 'Short' : hair;
    const moving = !!opt.moving, s1 = Math.sin(phase || 0);
    const bob = moving ? Math.abs(Math.cos(phase || 0)) * 0.025 : Math.sin((opt.t || 0) / 500) * 0.006;
    const side = dir === 'left', back = dir === 'up';
    const core = AF.coreColor(look);
    const P = () => g.beginPath();
    const fillS = (c, stroke) => { g.fillStyle = c; g.fill(); if (stroke !== false) g.stroke(); };
    const rr = (x, y, w, h, r, c, stroke) => { P(); g.roundRect(x, y, w, h, r); fillS(c, stroke); };
    const el = (x, y, rx, ry, c, stroke) => { P(); g.ellipse(x, y, rx, ry, 0, 0, 7); fillS(c, stroke); };
    const grad = (c, y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, mix(c, 28)); gr.addColorStop(1, mix(c, -22)); return gr; };

    // shadow
    g.fillStyle = 'rgba(20,30,40,.22)'; P(); g.ellipse(0, 0.985, side ? 0.17 : 0.2, 0.04, 0, 0, 7); g.fill();
    g.translate(0, -bob);
    const tw = side ? 0.22 : f ? 0.27 : 0.31;
    const bodyCol = top === 'Lab coat' ? '#f3f5f7' : top === 'Armor vest' ? '#8a93a3' : tc;

    // --- behind the body ---
    if (acc === 'Cape') { P(); const sw = moving ? s1 * 0.03 : 0; if (side) { g.moveTo(0.02, 0.5); g.lineTo(0.2 + sw, 0.88); g.lineTo(0.04, 0.9); } else { g.moveTo(-0.15, 0.5); g.lineTo(0.15, 0.5); g.lineTo(0.22, 0.9); g.lineTo(-0.22, 0.9); } g.closePath(); fillS(back ? '#c83246' : '#a82838'); }
    if (acc === 'Jetpack' && !back) { rr(side ? 0.08 : -0.2, 0.47, side ? 0.12 : 0.1, 0.26, 0.04, '#9aa4b0'); if (!side) rr(0.1, 0.47, 0.1, 0.26, 0.04, '#9aa4b0'); }
    if (!side && style === 'Long') rr(-0.23, 0.25, 0.46, back ? 0.42 : 0.36, 0.12, hc);
    if (!side && style === 'Bob') rr(-0.235, 0.25, 0.47, 0.25, 0.1, hc);
    if (style === 'Twin tails') { if (side) el(0.17, 0.42, 0.06, 0.13, hc); else { el(-0.27, 0.42, 0.06, 0.13, hc); el(0.27, 0.42, 0.06, 0.13, hc); } }
    if (back && style === 'Ponytail') { P(); g.moveTo(-0.05, 0.28); g.quadraticCurveTo(0.08, 0.5, 0, 0.62); g.quadraticCurveTo(-0.08, 0.5, -0.05, 0.28); fillS(hc); }

    // --- legs ---
    const leg = (x, lift, far) => {
      const y0 = 0.72, len = 0.23 - lift, c = far ? mix(legC, -25) : legC;
      if (bottom === 'Pants') rr(x - 0.045, y0, 0.09, len, 0.04, grad(c, y0, y0 + len));
      else { rr(x - 0.04, y0, 0.08, len, 0.04, far ? mix(sk, -20) : sk); if (bottom === 'Shorts') rr(x - 0.05, y0, 0.1, 0.09, 0.03, c); }
      el(x + (side ? -0.02 : 0), y0 + len, side ? 0.065 : 0.055, 0.035, '#3a3346');
    };
    if (side) { const sw = moving ? s1 * 0.07 : 0; leg(-sw, moving ? Math.max(0, -s1) * 0.03 : 0, true); leg(sw, moving ? Math.max(0, s1) * 0.03 : 0); }
    else { leg(-0.065, moving ? Math.max(0, s1) * 0.04 : 0); leg(0.065, moving ? Math.max(0, -s1) * 0.04 : 0); }
    if (bottom === 'Skirt') { P(); g.moveTo(-tw / 2, 0.66); g.lineTo(tw / 2, 0.66); g.lineTo(tw / 2 + 0.06, 0.82); g.lineTo(-tw / 2 - 0.06, 0.82); g.closePath(); fillS(grad(legC, 0.66, 0.82)); }

    // --- far arm (side view) ---
    const arm = (sx, ang, far) => {
      g.save(); g.translate(sx, 0.51); g.rotate(ang);
      rr(-0.04, 0, 0.08, 0.16, 0.04, far ? mix(top === 'Armor vest' ? tc : bodyCol, -25) : (top === 'Armor vest' ? tc : bodyCol));
      el(0, 0.19, 0.042, 0.042, far ? mix(sk, -20) : sk);
      g.restore();
    };
    if (side) arm(0.02, moving ? -s1 * 0.6 : 0.1, true);

    // --- torso ---
    const th = top === 'Lab coat' ? 0.33 : 0.27;
    rr(-tw / 2, 0.47, tw, th, 0.08, grad(bodyCol, 0.47, 0.47 + th));
    if (!back && !side) {
      if (top === 'Jacket') { P(); g.moveTo(-0.05, 0.48); g.lineTo(0.05, 0.48); g.lineTo(0, 0.62); g.closePath(); fillS('#f4f4f4', false); P(); g.moveTo(0, 0.6); g.lineTo(0, 0.73); g.stroke(); }
      if (top === 'Hoodie') { rr(-0.08, 0.62, 0.16, 0.07, 0.03, mix(tc, -20), false); P(); g.moveTo(-0.04, 0.49); g.lineTo(-0.04, 0.56); g.moveTo(0.04, 0.49); g.lineTo(0.04, 0.56); g.strokeStyle = '#fff'; g.stroke(); g.strokeStyle = OL; }
      if (top === 'Overalls') { rr(-0.1, 0.58, 0.2, 0.17, 0.04, grad(bc, 0.58, 0.75)); rr(-0.1, 0.47, 0.04, 0.12, 0.02, bc, false); rr(0.06, 0.47, 0.04, 0.12, 0.02, bc, false); el(-0.08, 0.6, 0.012, 0.012, '#f8d048', false); el(0.08, 0.6, 0.012, 0.012, '#f8d048', false); }
      if (top === 'Lab coat') { P(); g.moveTo(-0.05, 0.48); g.lineTo(0.05, 0.48); g.lineTo(0, 0.58); g.closePath(); fillS(tc, false); P(); g.moveTo(0, 0.58); g.lineTo(0, 0.79); g.stroke(); }
      if (top === 'Armor vest') { rr(-0.11, 0.5, 0.22, 0.08, 0.02, '#a2abb9'); rr(-0.11, 0.6, 0.22, 0.08, 0.02, '#a2abb9'); }
      if (suit) { rr(-tw / 2, 0.66, tw, 0.03, 0.01, '#f8d048', false); rr(0.04, 0.52, 0.06, 0.05, 0.01, '#e8e8e8', false); }
      if (acc === 'Tool belt') { rr(-tw / 2, 0.69, tw, 0.04, 0.01, '#7a5030'); rr(0.06, 0.7, 0.05, 0.06, 0.01, '#9aa3ad'); }
      if (acc === 'Backpack') { P(); g.moveTo(-0.09, 0.48); g.lineTo(-0.09, 0.64); g.moveTo(0.09, 0.48); g.lineTo(0.09, 0.64); g.lineWidth = 0.025; g.strokeStyle = '#6a4020'; g.stroke(); g.lineWidth = 0.022; g.strokeStyle = OL; }
      if (acc === 'Jetpack') { el(-0.17, 0.48, 0.04, 0.03, '#b6bec8'); el(0.17, 0.48, 0.04, 0.03, '#b6bec8'); }
    }
    if (back) {
      if (top === 'Hoodie') rr(-0.1, 0.47, 0.2, 0.07, 0.04, mix(tc, -20), false);
      if (acc === 'Backpack') rr(-0.12, 0.49, 0.24, 0.22, 0.05, grad('#8a5a30', 0.49, 0.71));
      if (acc === 'Jetpack') { rr(-0.16, 0.48, 0.13, 0.26, 0.04, '#9aa4b0'); rr(0.03, 0.48, 0.13, 0.26, 0.04, '#9aa4b0'); if (moving) { el(-0.095, 0.79, 0.03, 0.05, '#ffb040', false); el(0.095, 0.79, 0.03, 0.05, '#ffb040', false); } }
      if (acc === 'Cape') rr(-0.15, 0.48, 0.3, 0.38, 0.05, '#c83246');
    }
    if (side) {
      if (acc === 'Backpack') rr(0.09, 0.49, 0.1, 0.2, 0.04, grad('#8a5a30', 0.49, 0.69));
      if (acc === 'Jetpack') rr(0.1, 0.48, 0.1, 0.26, 0.04, '#9aa4b0');
      if (acc === 'Tool belt') rr(-tw / 2, 0.69, tw, 0.04, 0.01, '#7a5030');
    }
    // --- arms ---
    if (side) arm(-0.02, moving ? s1 * 0.6 : -0.05);
    else { const a = moving ? s1 * 0.45 : 0.06; arm(-tw / 2 - 0.02, a + 0.08); arm(tw / 2 + 0.02, -a - 0.08); }
    if (acc === 'Scarf' && !back) { rr(side ? -0.11 : -0.15, 0.45, side ? 0.22 : 0.3, 0.06, 0.03, '#e8862e'); if (!side) rr(0.04, 0.48, 0.06, 0.14, 0.03, '#e8862e'); }

    // --- head (chibi: drawn 1.3× bigger, scaled from the neck) ---
    g.save(); g.translate(side ? -0.02 : 0, 0.46); g.scale(1.3, 1.3); g.translate(side ? 0.02 : 0, -0.46);
    const hx = side ? -0.02 : 0, hy = 0.29, hr = 0.215;
    rr(hx - 0.04, 0.42, 0.08, 0.07, 0.02, mix(sk, -18), false);
    if (!side) { el(-0.205, 0.32, 0.035, 0.05, sk); el(0.205, 0.32, 0.035, 0.05, sk); }
    P(); g.arc(hx, hy, hr, 0, 7); const hg = g.createRadialGradient(hx - 0.06, hy - 0.06, 0.02, hx, hy, hr); hg.addColorStop(0, mix(sk, 22)); hg.addColorStop(1, mix(sk, -12)); fillS(hg);
    // face
    const blink = opt.blink;
    const eye = (x, y) => {
      if (blink) { P(); g.moveTo(x - 0.032, y); g.quadraticCurveTo(x, y + 0.015, x + 0.032, y); g.lineWidth = 0.018; g.strokeStyle = '#2a2230'; g.stroke(); g.lineWidth = 0.022; g.strokeStyle = OL; return; }
      el(x, y, 0.036, 0.054, '#2a2230', false); el(x, y + 0.016, 0.026, 0.026, '#5a4a8a', false); el(x + 0.01, y - 0.018, 0.013, 0.016, '#ffffff', false); el(x - 0.012, y + 0.02, 0.006, 0.006, '#ffffff', false);
    };
    if (!back) {
      if (side) {
        eye(-0.11, 0.31); el(-0.145, 0.375, 0.025, 0.014, 'rgba(255,130,130,.45)', false);
        P(); g.arc(-0.16, 0.395, 0.02, 0.3, Math.PI - 0.3); g.stroke();
        el(0.06, 0.32, 0.03, 0.045, sk);
        if (f) { P(); g.moveTo(-0.13, 0.29); g.lineTo(-0.155, 0.275); g.stroke(); }
      } else {
        eye(-0.08, 0.315); eye(0.08, 0.315);
        el(-0.125, 0.37, 0.03, 0.017, 'rgba(255,130,130,.45)', false); el(0.125, 0.37, 0.03, 0.017, 'rgba(255,130,130,.45)', false);
        P(); g.arc(0, 0.38, 0.03, 0.35, Math.PI - 0.35); g.stroke();
        if (f && !blink) { P(); g.moveTo(-0.1, 0.29); g.lineTo(-0.118, 0.275); g.moveTo(0.1, 0.29); g.lineTo(0.118, 0.275); g.stroke(); }
      }
    }
    // --- hair ---
    g.fillStyle = hc;
    const hairG = () => { const gr = g.createLinearGradient(0, hy - hr, 0, hy + 0.1); gr.addColorStop(0, mix(hc, 30)); gr.addColorStop(1, mix(hc, -15)); return gr; };
    const cap = (thin) => {
      P();
      if (back) { g.arc(hx, hy, hr + 0.005, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(hx + hr * 0.75, hy + 0.15); g.quadraticCurveTo(hx, hy + 0.2, hx - hr * 0.75, hy + 0.15); }
      else if (side) { g.arc(hx, hy, hr + 0.006, Math.PI * 1.02, Math.PI * 2.4); g.quadraticCurveTo(hx + 0.08, hy + 0.05, hx + 0.02, hy - 0.04); g.quadraticCurveTo(hx - 0.08, hy - 0.1, hx - hr, hy - 0.01); }
      else { g.moveTo(-hr, hy + 0.05); g.arc(hx, hy, hr + 0.005, Math.PI, 0); g.lineTo(hr, hy + 0.05); const d = thin ? -0.06 : 0;
        g.quadraticCurveTo(0.16, hy - 0.06 + d, 0.08, hy - 0.03 + d); g.quadraticCurveTo(0.01, hy - 0.12 + d, -0.06, hy - 0.03 + d); g.quadraticCurveTo(-0.15, hy - 0.07 + d, -hr, hy + 0.05); }
      g.closePath(); fillS(hairG());
    };
    switch (style) {
      case 'Buzz': g.globalAlpha = 0.85; cap(true); g.globalAlpha = 1; break;
      case 'Spiky': cap(); if (!back || true) { P(); for (let i = -2; i <= 2; i++) { const x = hx + i * 0.075; g.moveTo(x - 0.05, hy - 0.15); g.lineTo(x, hy - 0.29 + Math.abs(i) * 0.03); g.lineTo(x + 0.05, hy - 0.15); } fillS(hairG()); } break;
      case 'Curly': cap(); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.15); el(hx + Math.cos(a) * hr * 0.92, hy + Math.sin(a) * hr * 0.92, 0.065, 0.065, hc); } break;
      case 'Bob': cap(); if (!back && !side) { rr(-0.245, 0.27, 0.08, 0.22, 0.04, hc); rr(0.165, 0.27, 0.08, 0.22, 0.04, hc); } if (side) rr(0.02, 0.27, 0.17, 0.2, 0.06, hc); break;
      case 'Long': cap(); if (!back && !side) { rr(-0.25, 0.27, 0.08, 0.32, 0.04, hc); rr(0.17, 0.27, 0.08, 0.32, 0.04, hc); } if (side) rr(0.0, 0.27, 0.19, 0.35, 0.08, hc); break;
      case 'Ponytail': cap(); if (side) { P(); g.moveTo(0.17, 0.24); g.quadraticCurveTo(0.33, 0.33, 0.24, 0.5); g.quadraticCurveTo(0.19, 0.38, 0.14, 0.3); fillS(hc); } else if (!back) el(0.22, 0.33, 0.04, 0.09, hc); break;
      case 'Bun': cap(); el(hx, hy - 0.23, 0.075, 0.07, hc); break;
      case 'Mohawk': g.globalAlpha = 0.7; cap(true); g.globalAlpha = 1; rr(hx - 0.035, hy - 0.32, 0.07, 0.24, 0.03, hairG()); break;
      default: cap();
    }
    // --- headwear ---
    const dome = (c, y, r) => { P(); g.arc(hx, y, r, Math.PI, 0); g.closePath(); fillS(grad(c, y - r, y)); };
    switch (hat) {
      case 'Cap': dome(tc, hy - 0.01, 0.222); if (!back) { P(); if (side) g.ellipse(hx - 0.2, hy - 0.01, 0.12, 0.035, 0, 0, 7); else g.ellipse(0, hy - 0.005, 0.2, 0.05, 0, 0, Math.PI); fillS(mix(tc, -25)); } el(hx, hy - 0.225, 0.02, 0.012, mix(tc, 30), false); break;
      case 'Beanie': dome('#d24444', hy - 0.02, 0.225); rr(hx - 0.23, hy - 0.06, 0.46, 0.07, 0.03, '#f2f2f2'); el(hx, hy - 0.26, 0.05, 0.05, '#f2f2f2'); break;
      case 'Goggles': rr(hx - 0.22, hy - 0.1, 0.44, 0.04, 0.02, '#3a3a44'); if (!back) { const lx = side ? [-0.14] : [-0.08, 0.08]; lx.forEach((x) => { el(hx + x, hy - 0.08, 0.06, 0.05, '#58d8ec'); el(hx + x - 0.015, hy - 0.095, 0.015, 0.012, '#ffffff', false); }); } break;
      case 'Hard hat': dome('#f8c834', hy - 0.02, 0.232); rr(hx - 0.26 - (side ? 0.04 : 0), hy - 0.04, 0.52, 0.05, 0.02, '#dfa422'); rr(hx - 0.02, hy - 0.24, 0.04, 0.2, 0.02, '#dfa422', false); break;
      case 'Bandana': dome('#c43a3a', hy - 0.005, 0.222); [[-0.1, -0.1], [0.05, -0.16], [0.12, -0.06]].forEach(([x, y]) => el(hx + x, hy + y, 0.012, 0.012, '#fff', false)); el(hx + 0.2, hy + 0.0, 0.05, 0.03, '#c43a3a'); break;
      case 'Headphones': P(); g.arc(hx, hy, 0.235, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 0.035; g.strokeStyle = '#30303a'; g.stroke(); g.lineWidth = 0.022; g.strokeStyle = OL;
        if (side) rr(hx + 0.02, hy - 0.02, 0.07, 0.12, 0.03, '#e46aa0'); else { rr(hx - 0.27, hy - 0.04, 0.07, 0.13, 0.03, '#e46aa0'); rr(hx + 0.2, hy - 0.04, 0.07, 0.13, 0.03, '#e46aa0'); } break;
      case 'Antenna band': rr(hx - 0.21, hy - 0.11, 0.42, 0.03, 0.01, '#a8b0ba'); P(); g.moveTo(hx - 0.1, hy - 0.11); g.lineTo(hx - 0.14, hy - 0.3); g.moveTo(hx + 0.1, hy - 0.11); g.lineTo(hx + 0.14, hy - 0.3); g.stroke(); el(hx - 0.14, hy - 0.31, 0.03, 0.03, core); el(hx + 0.14, hy - 0.31, 0.03, 0.03, core); break;
      case 'Top hat': el(hx, hy - 0.13, 0.25, 0.045, '#26262e'); rr(hx - 0.14, hy - 0.42, 0.28, 0.3, 0.03, grad('#2e2e38', hy - 0.42, hy - 0.12)); rr(hx - 0.14, hy - 0.2, 0.28, 0.05, 0, '#c43a3a', false); break;
      case 'Wizard hat': el(hx, hy - 0.12, 0.27, 0.05, '#5a44b0'); P(); g.moveTo(hx - 0.17, hy - 0.13); g.quadraticCurveTo(hx, hy - 0.4, hx + 0.12, hy - 0.5); g.quadraticCurveTo(hx + 0.08, hy - 0.3, hx + 0.17, hy - 0.13); g.closePath(); fillS(grad('#6a54c8', hy - 0.5, hy - 0.12)); el(hx + 0.02, hy - 0.25, 0.022, 0.022, '#f8d048', false); break;
      case 'Crown': P(); g.moveTo(hx - 0.15, hy - 0.12); g.lineTo(hx - 0.15, hy - 0.3); g.lineTo(hx - 0.075, hy - 0.2); g.lineTo(hx, hy - 0.33); g.lineTo(hx + 0.075, hy - 0.2); g.lineTo(hx + 0.15, hy - 0.3); g.lineTo(hx + 0.15, hy - 0.12); g.closePath(); fillS(grad('#ffd84a', hy - 0.33, hy - 0.12)); el(hx, hy - 0.16, 0.022, 0.022, '#e04858', false); break;
    }
    if (acc === 'Glasses' && !back) { g.lineWidth = 0.016; g.strokeStyle = '#2a2230'; P(); if (side) g.roundRect(-0.16, 0.28, 0.08, 0.06, 0.02); else { g.roundRect(-0.12, 0.28, 0.09, 0.065, 0.02); g.roundRect(0.03, 0.28, 0.09, 0.065, 0.02); g.moveTo(-0.03, 0.305); g.lineTo(0.03, 0.305); } g.stroke(); g.lineWidth = 0.022; g.strokeStyle = OL; }
    g.restore();
    g.restore();
  };

  // Menu/slot helper: pilot standing in a box of height s whose top-left is (x, y).
  AF.drawPilot = function (g, x, y, s, look, t, dir) {
    const moving = !!dir && !!t;
    AF.drawPilotAt(g, x + s * 0.35, y + s * 0.99, s * 0.97, look, dir || 'down', moving ? t / 180 : 0, { moving, t, blink: t ? (t % 3400) < 140 : false });
  };

  // ---------- Character creator ----------
  // mode: 'new' (pick everything, free items only) or 'boutique' (unlocked items, name locked)
  const C = (AF.Creator = { look: null, mode: 'new', state: null, onDone: null, raf: 0 });

  C.open = function (opts) {
    C.mode = opts.mode; C.state = opts.state || null; C.onDone = opts.onDone; C.onCancel = opts.onCancel;
    C.look = Object.assign({}, opts.look || AF.defaultLook(Math.random() < 0.5 ? 'm' : 'f'));
    document.querySelector('#creator').hidden = false;
    C.render();
    cancelAnimationFrame(C.raf);
    const loop = (t) => { C.drawPreview(t); if (!document.querySelector('#creator').hidden) C.raf = requestAnimationFrame(loop); };
    C.raf = requestAnimationFrame(loop);
  };
  C.close = function () { document.querySelector('#creator').hidden = true; cancelAnimationFrame(C.raf); };

  C.drawPreview = function (t) {
    const cv = document.querySelector('#cr-preview'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const dirs = ['down', 'left', 'up', 'right'], dir = dirs[Math.floor(t / 1800) % 4];
    const sh = Math.min(h * 0.72, w * 1.15);
    AF.drawPilotAt(g, w / 2, h - 18, sh, C.look, dir, t / 170, { moving: true, t, blink: (t % 3400) < 140 });
  };

  const sw = (field, list, isColor) => list.map((c, i) => {
    const col = isColor ? (Array.isArray(c) ? c[0] : c) : null;
    return `<button class="sw${C.look[field] === i ? ' on' : ''}" data-look="${field}" data-i="${i}" style="--c:${col}" aria-label="${field} ${i + 1}"></button>`;
  }).join('');

  C.render = function () {
    const lk = C.look, st = C.state;
    const opt = (slot) => L[slot].map(([name, price], i) => {
      const locked = C.mode === 'boutique' ? !AF.isUnlocked(st, slot, i) : !!price;
      if (locked && C.mode === 'new') return '';
      return `<button class="opt${lk[slot] === i ? ' on' : ''}" data-look="${slot}" data-i="${i}" ${locked ? 'disabled title="Buy it at the Boutique"' : ''}>${name}${locked ? ' · locked' : ''}</button>`;
    }).join('');
    document.querySelector('#creator .cr').innerHTML = `
      <div class="cr-side">
        <h2>${C.mode === 'new' ? 'Create your pilot' : 'Wardrobe'}</h2>
        <div class="cr-stage"><canvas id="cr-preview"></canvas><canvas class="cr-bot spr" data-spr="robot"></canvas></div>
        ${C.mode === 'new' ? `<label class="fld">Pilot name<input id="cr-name" maxlength="16" value="${AF.esc(lk.name)}" placeholder="Name your pilot" autocomplete="off"></label>` : `<p class="cr-name">${AF.esc(lk.name)}</p>`}
        <div class="row">
          ${C.mode === 'new' ? '<button class="btn" data-cr="random">Randomize</button>' : ''}
          <button class="btn ghost" data-cr="cancel">${C.mode === 'new' ? 'Back' : 'Cancel'}</button>
          <button class="btn primary" data-cr="done">${C.mode === 'new' ? 'Start adventure' : 'Save look'}</button>
        </div>
      </div>
      <div class="cr-opts">
        <section><h3>Body</h3><div class="opts"><button class="opt${lk.body === 'm' ? ' on' : ''}" data-look="body" data-v="m">Male</button><button class="opt${lk.body === 'f' ? ' on' : ''}" data-look="body" data-v="f">Female</button></div></section>
        <section><h3>Skin tone</h3><div class="swatches">${sw('skin', L.skin, true)}</div></section>
        <section><h3>Hair</h3><div class="opts">${opt('hair')}</div><div class="swatches">${sw('hairColor', L.hairColor, true)}</div></section>
        <section><h3>Top</h3><div class="opts">${opt('top')}</div><div class="swatches">${sw('topColor', L.color, true)}</div></section>
        <section><h3>Bottoms</h3><div class="opts">${opt('bottom')}</div><div class="swatches">${sw('bottomColor', L.color, true)}</div></section>
        <section><h3>Headwear</h3><div class="opts">${opt('hat')}</div></section>
        <section><h3>Accessory</h3><div class="opts">${opt('acc')}</div></section>
        <section><h3>Robot core color</h3><div class="swatches">${sw('core', L.core, true)}</div><p class="hint">${L.core[lk.core][1]}</p></section>
        <div class="row cr-end"><button class="btn ghost" data-cr="cancel">${C.mode === 'new' ? 'Back' : 'Cancel'}</button>
          <button class="btn primary" data-cr="done">${C.mode === 'new' ? 'Start adventure' : 'Save look'}</button></div>
      </div>`;
    C.paintBot();
  };

  C.paintBot = function () {
    const el = document.querySelector('#creator');
    AF.Pixel.paint(el, { look: C.look, parts: (C.state && C.state.parts) || { arc: 1, frame: 1, legs: 1, arms: 1, weapon: 1, shield: 1 } });
  };

  C.handle = function (t) {
    const el = t.closest('[data-look],[data-cr]');
    if (!el) return false;
    const nameEl = document.querySelector('#cr-name');
    if (nameEl) C.look.name = nameEl.value;
    if (el.dataset.look) {
      if (el.disabled) return true;
      C.look[el.dataset.look] = el.dataset.v || +el.dataset.i;
      C.render(); return true;
    }
    if (el.dataset.cr === 'random') { const n = C.look.name; C.look = AF.randomLook(); C.look.name = n; C.render(); return true; }
    if (el.dataset.cr === 'cancel') { C.close(); C.onCancel && C.onCancel(); return true; }
    if (el.dataset.cr === 'done') {
      C.look.name = (C.look.name || '').trim().slice(0, 16) || 'Pilot';
      C.close(); C.onDone(C.look); return true;
    }
    return false;
  };
})();
