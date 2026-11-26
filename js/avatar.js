/* Automata: ArcForge — "Storybook painted" characters (style A).
   Chunky ~3-heads-tall figures built from solid shapes: short thick limbs that hug the body, clothes that
   cover the joints, one dark outline around the whole figure, and soft painted shading.
   Everything worn is drawn on the figure. Replaces AF.drawPilotAt (same arguments). */
(function () {
  const AF = (window.AF = window.AF || {});
  const L = AF.LOOK;
  const INK = '#1a120c';

  // colour helpers
  const parse = (c) => c[0] === '#' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : (c.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  const tone = (c, a) => { const v = parse(c).map((x) => Math.max(0, Math.min(255, Math.round(a > 0 ? x + (255 - x) * a : x * (1 + a))))); return `rgb(${v[0]},${v[1]},${v[2]})`; };
  const mute = (c) => (AF.mute ? AF.mute(c, 0.22) : c);

  // path builders
  const E = (x, y, rx, ry, rot) => { const p = new Path2D(); p.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2); return p; };
  const POLY = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
  const RR = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };

  AF.drawPilotAt = function (g, cx, fy, H, look, dir, phase, opt) {
    opt = opt || {};
    const out = look.outfit || {};
    const dye = look.dye || {};
    const V = (k) => { const it = out[k] && AF.ITEMS[out[k]]; const v = it && it.vis; if (!v) return null; const d = dye[out[k]] || {}; return { s: v.s, a: d.a || mute(v.a), b: d.b || mute(v.b) }; };
    const hat = V('hat'), face = V('face'), shoes = V('shoes'), gloves = V('gloves'), cape = V('cape'), tool = V('tool');
    const top = V('top') || { s: 'tunic', a: '#9a8a6a', b: '#5a4028' }, bot = V('bottom') || { s: 'pants', a: '#4e4434', b: '#2e261c' };
    let side = dir === 'left' || dir === 'right';
    const back = dir === 'up', front = !side && !back;
    const fs = AF.lookShape(look), fem = fs >= 0.5, bi = Math.max(0, Math.min(2, look.build == null ? 1 : +look.build));
    const B = bi <= 1 ? 0.88 + 0.12 * bi : 1 + 0.14 * (bi - 1);
    const lerp = (a, b) => a + (b - a) * fs;
    const skin = AF.lookHex(look, 'skin'), hairC = typeof look.hairColor === 'string' ? look.hairColor : mute(AF.lookHex(look, 'hairColor')), eyeC = AF.lookHex(look, 'eyeColor');
    const hk = 0.9 + 0.2 * (look.headSize == null ? 0.5 : look.headSize);
    { const hs = 0.92 + 0.16 * (look.height == null ? 0.5 : look.height); H *= hs; }
    const moving = !!opt.moving, t = opt.t || 0, ph = phase || 0, s = moving ? Math.sin(ph) : 0;
    const sway = moving ? Math.sin(ph - 0.9) : Math.sin(t / 900) * 0.25;

    // ---- proportions (unit height: head top 0, soles 1) ----
    const HR = 0.165 * hk, HW = (side ? 0.14 : 0.15) * hk, HY = 0.165 + (hk - 1) * 0.05;
    const SY = 0.33, SW = lerp(0.15, 0.133) * B * (side ? 0.64 : 1), WW = lerp(0.127, 0.106) * B * (side ? 0.72 : 1);
    const long = { robe: 0.97, dress: 0.86, coat: 0.86 }[top.s];
    const hem = long || { tee: 0.66, sweater: 0.68, hoodie: 0.69, jacket: 0.7, armor: 0.7, overalls: 0.7, apron: 0.7 }[top.s] || 0.73;
    const hemW = long ? SW * (top.s === 'robe' ? 1.12 : 1.05) : WW * lerp(1.16, 1.27);
    const WY = 0.52, BELT = Math.min(hem - 0.06, 0.6);
    const legW = 0.072 * B, bootH = shoes && shoes.s === 'boots' ? 0.15 : shoes && shoes.s === 'rocket' ? 0.15 : 0.085, legTop = Math.min(hem, 0.7) - 0.08;
    const armW = 0.06 * B, armLen = 0.3, handR = 0.045 * (B * 0.4 + 0.6);
    const bob = moving ? (1 - Math.abs(Math.cos(ph))) * -0.012 : Math.sin(t / 800) * 0.002;

    const parts = [];
    const add = (z, path, col, o) => parts.push(Object.assign({ z, path, col }, o || {}));
    const det = (z, fn) => parts.push({ z, fn });

    g.save();
    if (dir === 'right') { g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); }
    g.translate(cx, fy - H); g.scale(H, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // ground shadow (doesn't bob)
    g.fillStyle = 'rgba(8,6,4,.36)'; g.beginPath(); g.ellipse(0, 0.995, side ? 0.16 : 0.2, 0.034, 0, 0, 7); g.fill();
    g.translate(0, bob);
    const lw = (k) => Math.max(0.004, (k || 1) * 0.006);
    const line = (pts, c, w, a) => { g.save(); g.globalAlpha = a == null ? 1 : a; g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); };
    const curve = (x0, y0, qx, qy, x1, y1, c, w, a) => { g.save(); g.globalAlpha = a == null ? 1 : a; g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(qx, qy, x1, y1); g.stroke(); g.restore(); };
    const fold = (pts, a) => line(pts, 'rgba(20,12,8,1)', lw(0.9), a == null ? 0.3 : a);
    const dot = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };

    // ================= BACK LAYER =================
    const capeOnTop = back;
    if (cape) {
      const a = cape.a, b = cape.b;
      const cz = capeOnTop ? 10 : 0;
      if (cape.s === 'cloak' || cape.s === 'cape') {
        const bot2 = cape.s === 'cloak' ? 0.93 : 0.82, sw2 = sway * 0.03;
        if (side) add(cz, POLY([[0.0, SY - 0.01], [0.07, SY], [0.16 + Math.abs(s) * 0.03 + sw2, bot2], [0.0, bot2 + 0.01]]), a);
        else add(cz, POLY([[-SW * 1.06, SY + 0.0], [SW * 1.06, SY + 0.0], [SW * 1.45 + sw2, bot2], [0 + sw2, bot2 + 0.02], [-SW * 1.45 + sw2, bot2]]), a, { far: !back });
        if (back) det(10.1, () => { for (let i = -2; i <= 2; i++) fold([[i * 0.05, SY + 0.08], [i * 0.075 + sway * 0.02, bot2 - 0.02]], 0.28); line([[-SW * 1.42, bot2 - 0.012], [SW * 1.42, bot2 - 0.012]], b, lw(2.4), 0.8); });
        if (back && cape.s === 'cloak' && !(hat && hat.s === 'hood')) add(10.2, E(0, SY + 0.005, 0.11, 0.045), tone(a, -0.08));
      } else if (cape.s === 'backpack') {
        if (back) { add(10, RR(-0.12, SY + 0.03, 0.24, 0.27, 0.05), a); add(10.1, RR(-0.1, SY + 0.15, 0.2, 0.1, 0.03), tone(a, -0.12), { inner: true }); det(10.2, () => { line([[-0.1, SY + 0.1], [0.1, SY + 0.1]], b, lw(2), 0.8); dot(0, SY + 0.2, 0.012, b); }); }
        else if (side) add(0, RR(0.03, SY + 0.03, 0.13, 0.25, 0.04), a);
      } else if (cape.s === 'jetpack') {
        const flame = moving && Math.floor(t / 70) % 2;
        if (back) { [-1, 1].forEach((d) => { add(10, RR(d * 0.07 - 0.05, SY + 0.02, 0.1, 0.26, 0.04), a, { mat: 'metal' }); if (moving) add(10.1, E(d * 0.07, SY + 0.33 + flame * 0.01, 0.025, 0.04), '#ffa040', { glow: true }); }); }
        else if (side) add(0, RR(0.04, SY + 0.02, 0.1, 0.26, 0.04), a, { mat: 'metal' });
        else [-1, 1].forEach((d) => add(0, RR(d * (SW + 0.02) - 0.03, SY - 0.05, 0.06, 0.13, 0.02), a, { mat: 'metal' }));
      } else if (cape.s === 'wings') {
        const wing = (d, z) => { const p = new Path2D(); p.moveTo(d * 0.05, SY + 0.05); p.bezierCurveTo(d * 0.28, SY - 0.14 + sway * 0.02, d * 0.46, SY - 0.1, d * 0.48, SY + 0.02); p.quadraticCurveTo(d * 0.36, SY + 0.08, d * 0.39, SY + 0.2); p.quadraticCurveTo(d * 0.24, SY + 0.15, d * 0.06, SY + 0.16); p.closePath(); add(z, p, a); det(z + 0.05, () => { for (let i = 0; i < 3; i++) curve(d * 0.08, SY + 0.07 + i * 0.03, d * 0.26, SY - 0.02 + i * 0.035, d * (0.44 - i * 0.04), SY + 0.03 + i * 0.05, tone(b, -0.1), lw(1.3), 0.8); }); };
        if (side) wing(1, 0); else { wing(-1, cz); wing(1, cz); }
      } else if (cape.s === 'scarf' && (side || back)) {
        add(back ? 10 : 0, POLY([[0.02, SY + 0.0], [0.1 + sway * 0.02, SY + 0.06], [0.16 + sway * 0.04, SY + 0.17], [0.12 + sway * 0.04, SY + 0.19], [0.06, SY + 0.09], [-0.01, SY + 0.04]]), a);
      }
    }

    // ================= HAIR (behind) =================
    const hairName = L.hair[look.hair || 0];
    const hatHides = hat && ['hood', 'knight'].includes(hat.s);
    const tightHat = hat && !['bow', 'flowers', 'headphones', 'crown'].includes(hat.s);
    const hs = tightHat && ['Spiky', 'Mohawk', 'Bun', 'Curly', 'Messy', 'Top-knot', 'Undercut'].includes(hairName) ? 'Crop' : hairName;
    const hsw = sway * 0.02 + (side && moving ? 0.015 : 0);
    if (!hatHides) {
      const hz = back ? 9.2 : 1;
      const longMass = (len, wide) => { if (side) add(hz, POLY([[0.0, HY - HR * 0.6], [HW * 0.9, HY - HR * 0.3], [HW * 0.95 + hsw, HY + len], [-HW * 0.1 + hsw, HY + len + 0.01], [-HW * 0.4, HY + HR * 0.3]]), hairC, { hair: true }); else add(hz, (() => { const p = new Path2D(); p.moveTo(-HW * wide, HY - HR * 0.2); p.quadraticCurveTo(-HW * (wide + 0.1), HY + len * 0.6, -HW * (wide - 0.05) + hsw, HY + len); p.lineTo(HW * (wide - 0.05) + hsw, HY + len); p.quadraticCurveTo(HW * (wide + 0.1), HY + len * 0.6, HW * wide, HY - HR * 0.2); p.closePath(); return p; })(), hairC, { hair: true }); };
      if (hs === 'Long') longMass(0.34, 1.12);
      if (hs === 'Wavy') longMass(0.3, 1.16);
      if (hs === 'Bob') longMass(0.11, 1.12);
      if (hs === 'Locs') longMass(0.27, 1.12);
      if (hs === 'Twin tails') {
        const tail = (d, ox) => { const x0 = (ox || 0) + d * HW * 0.92, p = new Path2D();
          p.moveTo(x0 - d * HW * 0.1, HY - HR * 0.42); p.quadraticCurveTo(x0 + d * HW * 0.42, HY - HR * 0.2, x0 + d * HW * 0.34 + hsw, HY + 0.12);
          p.quadraticCurveTo(x0 + d * HW * 0.3 + hsw, HY + 0.27, x0 + d * HW * 0.12 + hsw * 1.4, HY + 0.33); p.quadraticCurveTo(x0 + d * HW * 0.02 + hsw, HY + 0.2, x0 - d * HW * 0.02, HY + 0.02); p.closePath();
          add(hz, p, hairC, { hair: true }); add(hz + 0.01, E(x0 + d * HW * 0.06, HY - HR * 0.22, HW * 0.1, HR * 0.09), tone(hairC, -0.45), { inner: true }); };
        if (side) tail(1, -0.012 + HW * 0.05); else { tail(-1); tail(1); }
      }
      if (hs === 'Ponytail' && (side || back)) add(hz, POLY([[HW * (side ? 0.6 : -0.15), HY - HR * 0.4], [HW * (side ? 1.2 : 0.15), HY - HR * 0.35], [HW * (side ? 1.1 : 0.12) + hsw, HY + 0.28], [HW * (side ? 0.75 : -0.12) + hsw, HY + 0.3]]), hairC, { hair: true });
      if (hs === 'Braid' && (side || back)) for (let i = 0; i < 6; i++) add(hz, E((side ? HW * 0.75 : 0) + hsw * i / 5, HY + HR * 0.5 + i * 0.045, 0.03 - i * 0.002, 0.03), hairC, { hair: true });
    }

    // ================= LEGS & FEET =================
    const legs = side ? [[-1, -s], [1, s]] : [[-1, 0], [1, 0]];
    legs.forEach(([d, st], i) => {
      const far = side && i === 0;
      const hx = side ? 0 : d * legW * 1.08, ax = side ? -st * 0.12 : hx;
      const lift = side ? Math.max(0, st > 0 ? 0 : -st) * 0.03 : moving ? Math.max(0, d * s) * 0.03 : 0;
      const fyL = 1 - lift, z = far ? 2 : 3;
      const bare = bot.s === 'shorts' || bot.s === 'skirt';
      const legPath = POLY([[hx - legW, legTop], [hx + legW, legTop], [ax + legW * 0.92, fyL - bootH * 0.7], [ax - legW * 0.92, fyL - bootH * 0.7]]);
      add(z, legPath, bare ? skin : bot.a, { far, mat: bare ? 'skin' : 'cloth' });
      if (bot.s === 'shorts') add(z + 0.05, POLY([[hx - legW * 1.08, legTop], [hx + legW * 1.08, legTop], [hx + (ax - hx) * 0.45 + legW * 1.05, legTop + 0.12], [hx + (ax - hx) * 0.45 - legW * 1.05, legTop + 0.12]]), bot.a, { far });
      if (!bare) det(z + 0.06, () => {
        const mx = (hx + ax) / 2, my = (legTop + fyL - bootH) / 2;
        fold([[mx - legW * 0.5, my - 0.01], [mx + legW * 0.3, my + 0.01]], 0.25);
        if (bot.s === 'cargo' && !far) { g.save(); g.fill(RR(mx - legW * 0.95, my - 0.04, legW * 0.85, 0.06, 0.01)); g.fillStyle = tone(bot.a, -0.12); g.fill(RR(mx - legW * 0.95, my - 0.04, legW * 0.85, 0.06, 0.01)); g.restore(); }
        if (bot.s === 'checker' && !far) { g.save(); g.clip(legPath); g.fillStyle = bot.b; g.globalAlpha = 0.45; for (let yy = legTop; yy < fyL; yy += 0.03) for (let xx = mx - 0.1 + (Math.round(yy / 0.03) % 2) * 0.015; xx < mx + 0.1; xx += 0.03) g.fillRect(xx, yy, 0.015, 0.015); g.restore(); }
      });
      if (bot.s === 'greaves') add(z + 0.07, POLY([[hx + (ax - hx) * 0.35 - legW * 1.02, legTop + 0.1], [hx + (ax - hx) * 0.35 + legW * 1.02, legTop + 0.1], [ax + legW * 0.95, fyL - bootH * 0.6], [ax - legW * 0.95, fyL - bootH * 0.6]]), bot.a, { far, mat: 'metal' });
      // footwear
      const bw = 0.085 * (B * 0.5 + 0.5), toe = side ? -bw * 0.95 : 0;
      const fc = shoes ? shoes.a : tone(skin, -0.05);
      const fp = new Path2D(); const top2 = fyL - bootH;
      fp.moveTo(ax - bw * 0.88, top2); fp.lineTo(ax + bw * 0.88, top2); fp.lineTo(ax + bw * 0.98, fyL);
      fp.lineTo(ax - bw * 1.0 + toe, fyL); fp.quadraticCurveTo(ax - bw * 1.12 + toe, fyL - bootH * 0.38, ax - bw * 0.88, fyL - Math.min(bootH, 0.09) * 0.55); fp.closePath();
      add(z + 0.1, fp, fc, { far, mat: shoes && shoes.s === 'rocket' ? 'metal' : 'leather' });
      if (shoes) det(z + 0.15, () => {
        line([[ax - bw * 1.0 + toe, fyL - 0.008], [ax + bw * 0.98, fyL - 0.008]], tone(shoes.b, -0.35), lw(2.4), 0.9);
        if (shoes.s === 'boots') { g.fillStyle = tone(shoes.a, 0.12); g.fill(RR(ax - bw * 0.95, top2 - 0.006, bw * 1.9, 0.03, 0.01)); if (!far && !side) for (let k = 0; k < 3; k++) line([[ax - bw * 0.3, top2 + 0.04 + k * 0.025], [ax + bw * 0.3, top2 + 0.05 + k * 0.025]], tone(shoes.b, 0.1), lw(1), 0.7); }
        if (shoes.s === 'rocket') { line([[ax - bw * 0.85, top2 + 0.05], [ax + bw * 0.85, top2 + 0.05]], shoes.b, lw(2.5)); if (moving) { g.fillStyle = '#ffa040'; g.beginPath(); g.ellipse(ax, fyL + 0.03, 0.025, 0.035, 0, 0, 7); g.fill(); } }
        if (shoes.s === 'flats' && !side) dot(ax, top2 + 0.025, 0.012, shoes.b);
      });
    });
    // skirt over the legs
    if (bot.s === 'skirt' && !long) {
      add(4, POLY([[-WW, BELT - 0.02], [WW, BELT - 0.02], [WW * 1.7 + sway * 0.01, 0.8], [-WW * 1.7 + sway * 0.01, 0.8]]), bot.a);
      det(4.05, () => { for (let i = -2; i <= 2; i++) fold([[i * WW * 0.3, BELT + 0.01], [i * WW * 0.55, 0.79]], 0.25); line([[-WW * 1.66, 0.785], [WW * 1.66, 0.785]], bot.b, lw(2.2), 0.8); });
    }

    // ================= TORSO GARMENT =================
    const torso = (bottom, w2) => {
      const p = new Path2D(), hs2 = bottom > 0.8 ? sway * 0.015 + (side && moving ? 0.02 : 0) : 0;
      p.moveTo(-SW, SY + 0.035); p.quadraticCurveTo(-SW, SY - 0.012, -SW * 0.68, SY - 0.018); p.lineTo(SW * 0.68, SY - 0.018); p.quadraticCurveTo(SW, SY - 0.012, SW, SY + 0.035);
      p.quadraticCurveTo(SW * 0.98, WY - 0.06, WW, WY); p.lineTo(w2 + hs2, bottom); p.quadraticCurveTo(hs2, bottom + 0.012, -w2 + hs2, bottom); p.lineTo(-WW, WY); p.quadraticCurveTo(-SW * 0.98, WY - 0.06, -SW, SY + 0.035); p.closePath();
      return p;
    };
    const shirtC = '#a89a7a';
    const under = ['jerkin', 'vest', 'overalls', 'apron', 'jacket'].includes(top.s);
    const baseCol = under && top.s !== 'jacket' ? shirtC : top.s === 'armor' ? '#4a4038' : top.a;
    const torsoP = torso(hem, hemW);
    add(5, torsoP, baseCol, { mat: top.s === 'mail' ? 'metal' : 'cloth' });
    const a = top.a, b = top.b;
    det(5.05, () => {
      g.save(); g.clip(torsoP);
      if (top.s === 'mail') { g.globalAlpha = 0.4; g.strokeStyle = '#141210'; g.lineWidth = lw(0.7); for (let yy = SY - 0.02; yy < hem; yy += 0.018) for (let xx = -SW - 0.02 + (Math.round(yy / 0.018) % 2) * 0.008; xx < SW + 0.02; xx += 0.016) { g.beginPath(); g.arc(xx, yy, 0.008, 0, Math.PI); g.stroke(); } g.globalAlpha = 1; }
      if (top.s === 'sweater') { g.fillStyle = b; g.globalAlpha = 0.55; for (let yy = SY + 0.07; yy < hem - 0.02; yy += 0.07) g.fillRect(-0.4, yy, 0.8, 0.022); g.globalAlpha = 1; }
      if (!back && !side) { fold([[-WW * 0.4, WY + 0.04], [-hemW * 0.5, hem - 0.01]], 0.25); fold([[WW * 0.45, WY + 0.04], [hemW * 0.55, hem - 0.01]], 0.25); }
      if (back) fold([[0, SY + 0.04], [0, hem - 0.02]], 0.22);
      g.restore();
    });
    // garment-specific layers
    if (top.s === 'jerkin' || top.s === 'vest' || top.s === 'jacket' || top.s === 'coat') {
      const open = top.s === 'vest' ? 0.045 : top.s === 'jerkin' ? 0.0 : 0.035, pBot = top.s === 'coat' ? hem : Math.min(hem - 0.01, 0.7);
      if (front) [-1, 1].forEach((d) => add(5.1, POLY([[d * open, SY - 0.016], [d * SW * 0.68, SY - 0.018], [d * SW, SY + 0.035], [d * WW, WY], [d * hemW * 0.98, pBot], [d * open, pBot]]), top.s === 'coat' || top.s === 'jacket' ? a : a, { inner: true }));
      else if (side) add(5.1, POLY([[-SW * 0.2, SY - 0.016], [SW, SY + 0.035], [WW, WY], [hemW, pBot], [-hemW * 0.6, pBot], [-WW * 0.7, WY]]), a, { inner: true });
      else add(5.1, torso(pBot, hemW), a, { inner: true });
      det(5.15, () => {
        if (!front) return;
        if (top.s === 'jerkin') { for (let k = 0; k < 4; k++) { const yy = SY + 0.03 + k * 0.045; line([[-0.016, yy], [0.016, yy + 0.016]], '#d8c8a0', lw(1.1), 0.85); line([[0.016, yy], [-0.016, yy + 0.016]], '#d8c8a0', lw(1.1), 0.85); } [-1, 1].forEach((d) => { for (let k = 0; k < 3; k++) dot(d * (SW * 0.55), SY + 0.06 + k * 0.06, 0.006, '#9a8a6a'); }); }
        if (top.s === 'jacket' || top.s === 'coat') { [-1, 1].forEach((d) => { g.fillStyle = tone(top.s === 'coat' ? b : a, -0.12); g.fill(POLY([[d * open, SY - 0.016], [d * 0.075, SY - 0.01], [d * 0.065, SY + 0.12], [d * open, SY + 0.09]])); }); for (let k = 0; k < 4; k++) dot(-0.012 + (top.s === 'coat' ? 0 : 0.05), SY + 0.13 + k * 0.06, 0.008, top.s === 'coat' ? '#b8944a' : tone(a, -0.3)); }
        if (top.s === 'coat') { fold([[-0.06, 0.66], [-0.08, hem - 0.02]], 0.3); fold([[0.06, 0.66], [0.08, hem - 0.02]], 0.3); }
      });
    }
    if (top.s === 'overalls' || top.s === 'apron') {
      const ap = top.s === 'apron', bTop = ap ? SY + 0.05 : SY + 0.08, bw = 0.085 * B, low = ap ? hem + 0.08 : Math.min(hem, 0.7);
      if (!back) add(5.1, POLY([[-bw * (side ? 0.6 : 1), bTop], [bw * (side ? 0.6 : 1), bTop], [WW + 0.01, WY], [hemW * (ap ? 1.0 : 0.95), low], [-hemW * (ap ? 1.0 : 0.95), low], [-WW - 0.01, WY]]), a, { inner: !ap });
      det(5.15, () => {
        if (front) { line([[-bw + 0.012, bTop], [-SW * 0.62, SY - 0.014]], a, lw(4)); line([[bw - 0.012, bTop], [SW * 0.62, SY - 0.014]], a, lw(4)); }
        if (back) { line([[-SW * 0.6, SY - 0.01], [WW * 0.6, WY]], a, lw(4)); line([[SW * 0.6, SY - 0.01], [-WW * 0.6, WY]], a, lw(4)); }
        if (front && !ap) { dot(-bw + 0.02, bTop + 0.015, 0.009, b); dot(bw - 0.02, bTop + 0.015, 0.009, b); }
        if (front && ap) { g.fillStyle = tone(a, -0.12); g.fill(RR(-0.05, WY + 0.02, 0.1, 0.06, 0.012)); line([[-hemW, low - 0.01], [hemW, low - 0.01]], b, lw(2), 0.8); fold([[-0.05, 0.62], [-0.07, low - 0.02]], 0.3); fold([[0.05, 0.62], [0.07, low - 0.02]], 0.3); }
      });
    }
    if (top.s === 'tunic' || top.s === 'tee' || top.s === 'mail') det(5.15, () => { if (!front) return; g.fillStyle = tone(baseCol, -0.22); g.fill(POLY([[-0.04, SY - 0.016], [0, SY + (top.s === 'tee' ? 0.03 : 0.06)], [0.04, SY - 0.016]])); if (top.s === 'tunic') for (let k = 0; k < 3; k++) line([[-0.014, SY + 0.005 + k * 0.016], [0.014, SY + 0.013 + k * 0.016]], b, lw(1.2), 0.85); });
    if (top.s === 'hoodie') { det(5.15, () => { if (front) { g.fillStyle = tone(a, -0.12); g.fill(RR(-0.07, 0.56, 0.14, 0.07, 0.02)); line([[-0.025, SY], [-0.03, SY + 0.08]], b, lw(1.4)); line([[0.025, SY], [0.03, SY + 0.08]], b, lw(1.4)); } }); add(5.2, E(side ? 0.03 : 0, SY - 0.01, side ? 0.07 : 0.1, 0.045), tone(a, -0.1), { inner: true }); }
    if (top.s === 'dress') det(5.15, () => { if (front) { g.fillStyle = tone(a, -0.2); g.beginPath(); g.ellipse(0, SY - 0.01, 0.06, 0.035, 0, 0, Math.PI); g.fill(); } line([[-WW, WY - 0.005], [WW, WY - 0.005]], b, lw(3.4)); for (let k = -3; k <= 3; k++) fold([[k * 0.025, WY + 0.03], [k * 0.045, hem - 0.01]], 0.25); line([[-hemW, hem - 0.01], [hemW, hem - 0.01]], b, lw(2.4), 0.85); });
    if (top.s === 'robe') det(5.15, () => { if (front) { g.fillStyle = tone(a, -0.2); g.fill(POLY([[-0.045, SY - 0.016], [0, SY + 0.07], [0.045, SY - 0.016]])); line([[0, SY + 0.07], [0, hem - 0.01]], b, lw(3)); } line([[-WW - 0.005, WY], [WW + 0.005, WY]], tone(b, -0.15), lw(4.5)); for (let k = -3; k <= 3; k++) if (k) fold([[k * 0.03, 0.6], [k * 0.05 + sway * 0.01, hem - 0.02]], 0.28); line([[-hemW, hem - 0.014], [hemW, hem - 0.014]], b, lw(3), 0.9); });
    if (top.s === 'armor') {
      add(5.1, POLY([[-SW * 0.9, SY + 0.0], [SW * 0.9, SY + 0.0], [WW + 0.01, WY + 0.01], [-WW - 0.01, WY + 0.01]]), a, { inner: true, mat: 'metal' });
      det(5.15, () => { if (front) { dot(0, SY + 0.09, 0.02, b); line([[0, SY + 0.02], [0, WY]], 'rgba(255,255,255,.35)', lw(1.2)); } for (let k = 0; k < 2; k++) { g.fillStyle = tone(a, -0.1); g.fill(RR(-hemW, WY + 0.02 + k * 0.045, hemW * 2, 0.045, 0.012)); } });
    }
    // cross-body strap, belt, pouches
    const strap = ['jerkin', 'tunic', 'vest', 'mail', 'jacket'].includes(top.s) && !(cape && (cape.s === 'backpack' || cape.s === 'jetpack'));
    if (strap && !side) det(5.4, () => { const x0 = back ? SW * 0.6 : -SW * 0.6, x1 = back ? -WW * 0.9 : WW * 0.9; line([[x0, SY - 0.012], [x1, BELT - 0.01]], '#2a1c10', lw(5.4)); line([[x0, SY - 0.012], [x1, BELT - 0.01]], '#5a3e24', lw(3.6)); if (front) { g.fillStyle = '#a88a4a'; g.fill(RR((x0 + x1) / 2 - 0.014, (SY + BELT) / 2 - 0.012, 0.028, 0.024, 0.004)); } });
    if (!['robe', 'dress', 'armor', 'overalls'].includes(top.s)) {
      add(5.5, RR(-WW * 1.06, BELT - 0.018, WW * 2.12, 0.038, 0.008), '#3a2818', { inner: true, mat: 'leather' });
      det(5.55, () => {
        if (front) { g.fillStyle = '#a88a4a'; g.fill(RR(-0.02, BELT - 0.022, 0.04, 0.046, 0.006)); g.fillStyle = '#3a2818'; g.fill(RR(-0.009, BELT - 0.01, 0.018, 0.022, 0.003)); }
        const px = side ? WW * 0.2 : WW * 0.72;
        if (!back) { g.fillStyle = '#5a4028'; g.fill(RR(px - 0.025, BELT + 0.016, 0.05, 0.06, 0.012)); g.strokeStyle = '#1e140c'; g.lineWidth = lw(1); g.stroke(RR(px - 0.025, BELT + 0.016, 0.05, 0.06, 0.012)); line([[px - 0.025, BELT + 0.034], [px + 0.025, BELT + 0.034]], '#1e140c', lw(1), 0.6); }
      });
    }
    // cloak mantle over the shoulders (front & side)
    if (cape && (cape.s === 'cloak' || cape.s === 'cape') && !back) {
      const mp = new Path2D(); mp.moveTo(-SW - 0.03, SY + 0.08); mp.quadraticCurveTo(-SW - 0.02, SY - 0.04, -0.04, SY - 0.03); mp.lineTo(0.04, SY - 0.03); mp.quadraticCurveTo(SW + 0.02, SY - 0.04, SW + 0.03, SY + 0.08); mp.quadraticCurveTo(SW - 0.02, SY + 0.03, 0, SY + 0.035); mp.quadraticCurveTo(-SW + 0.02, SY + 0.03, -SW - 0.03, SY + 0.08); mp.closePath();
      add(6, mp, cape.a);
      if (front) add(6.1, E(0, SY + 0.025, 0.018, 0.018), cape.b, { mat: 'metal' });
    }
    if (cape && cape.s === 'scarf' && !back) { add(6, E(side ? 0.0 : 0, SY - 0.01, side ? 0.075 : 0.1, 0.045), cape.a); if (front) add(6.05, RR(0.02, SY + 0.01, 0.045, 0.14, 0.012), cape.a); det(6.1, () => { if (front) line([[0.022, SY + 0.14], [0.063, SY + 0.14]], cape.b, lw(2.5)); fold([[-0.07, SY - 0.01], [0.07, SY]], 0.3); }); }
    if (cape && cape.s === 'backpack' && front) det(6, () => { [-1, 1].forEach((d) => line([[d * SW * 0.62, SY - 0.012], [d * SW * 0.68, WY - 0.03]], tone(cape.a, -0.25), lw(4.5))); });

    // ================= ARMS =================
    const sleeve = top.s === 'armor' ? '#6a6058' : under && top.s !== 'jacket' ? shirtC : top.s === 'dress' || top.s === 'tee' ? top.a : top.a;
    const short = top.s === 'tee' || top.s === 'dress';
    const wide = top.s === 'robe';
    const arms = side ? [[1, -s, true], [-1, s, false]] : [[-1, 0, false], [1, 0, false]];
    const holdsLong = tool && ['staff', 'sword', 'crossbow'].includes(tool.s);
    arms.forEach(([d, sw2, far], i) => {
      const toolHand = side ? i === 1 : d === 1;
      const sx = side ? 0 : d * (SW - armW * 0.55), sy = SY + armW * 0.55;
      let hx = side ? -sw2 * 0.13 : sx + d * armW * 0.42, hy = sy + armLen - (side ? Math.abs(sw2) * 0.02 : 0);
      if (front && moving) hy -= Math.max(0, -d * s) * 0.018;
      if (toolHand && holdsLong) { hx = side ? -0.07 : sx + d * armW * 0.2; hy = sy + armLen * 0.78; }
      const ex = (sx + hx) / 2 + (side ? 0 : d * armW * 0.18), ey = (sy + hy) / 2;
      const w = armW * (wide ? 1.25 : 1);
      const ap = new Path2D(); ap.moveTo(sx - w, sy - w * 0.35); ap.quadraticCurveTo(ex - w * 1.15, ey, hx - w * 0.85, hy); ap.lineTo(hx + w * 0.85, hy); ap.quadraticCurveTo(ex + w * 1.15, ey, sx + w, sy - w * 0.35); ap.closePath();
      const z = side ? (far ? 1.5 : 7) : 7;
      if (short) {
        add(z, ap, skin, { far, mat: 'skin' });
        add(z + 0.02, E(sx, sy + w * 0.35, w * 1.15, w * 1.15), sleeve, { far });
      } else {
        add(z, ap, sleeve, { far, mat: top.s === 'mail' ? 'metal' : 'cloth' });
        det(z + 0.01, () => { fold([[ex - w * 0.6, ey], [ex + w * 0.5, ey + 0.012]], 0.28); if (!['tee', 'dress', 'robe', 'armor', 'mail', 'sweater', 'hoodie', 'coat'].includes(top.s) && !(gloves && gloves.s === 'gauntlets')) { g.fillStyle = far ? '#33241a' : '#4a3422'; g.fill(RR(hx - w * 0.95, hy - 0.075, w * 1.9, 0.07, 0.012)); line([[hx - w * 0.9, hy - 0.055], [hx + w * 0.9, hy - 0.05]], '#8a6a3a', lw(1.4), 0.8); } else { g.fillStyle = tone(wide ? top.b : sleeve, wide ? 0 : -0.15); g.fill(RR(hx - w * 0.92, hy - 0.022, w * 1.84, 0.026, 0.008)); } });
        if (top.s === 'armor') add(z + 0.03, E(sx, sy + 0.005, w * 1.35, w * 1.05), top.a, { far, mat: 'metal' });
      }
      // hand (or glove), then tool
      const hc = gloves ? gloves.a : skin;
      if (gloves && gloves.s === 'gauntlets') add(z + 0.1, RR(hx - handR * 1.1, hy - 0.02, handR * 2.2, handR * 2.2, handR * 0.7), hc, { far, mat: 'metal' });
      else add(z + 0.1, E(hx, hy + handR * 0.55, handR, handR * 1.05), hc, { far, mat: gloves ? 'leather' : 'skin' });
      if (gloves && gloves.s === 'gloves') det(z + 0.11, () => { g.fillStyle = tone(gloves.b, 0.05); g.fill(RR(hx - handR * 1.05, hy - 0.012, handR * 2.1, 0.022, 0.006)); });
      if (toolHand && tool) {
        const tx = hx, ty = hy + handR * 0.55, tz = holdsLong ? z + 0.12 : z + 0.12, ta = tool.a, tb = tool.b;
        switch (tool.s) {
          case 'staff': add(tz, RR(tx - 0.013, ty - 0.58, 0.026, 0.66, 0.012), '#5a3e24', { mat: 'wood' }); add(tz + 0.01, E(tx, ty - 0.6, 0.045, 0.045), '#6a4a2a', { mat: 'wood' }); add(tz + 0.02, E(tx, ty - 0.6, 0.03, 0.03), tb, { glow: true }); break;
          case 'sword': add(tz, POLY([[tx - 0.016, ty - 0.03], [tx + 0.016, ty - 0.03], [tx + 0.012, ty - 0.38], [tx, ty - 0.42], [tx - 0.012, ty - 0.38]]), '#b8bcc4', { mat: 'metal' }); add(tz + 0.01, RR(tx - 0.05, ty - 0.045, 0.1, 0.022, 0.006), '#a07a3a', { mat: 'metal' }); add(tz + 0.01, E(tx, ty + 0.035, 0.014, 0.014), '#8a6a32'); break;
          case 'crossbow': add(tz, RR(tx - 0.014, ty - 0.16, 0.028, 0.2, 0.006), '#5a3e24', { mat: 'wood' }); add(tz + 0.01, POLY([[tx - 0.11, ty - 0.1], [tx, ty - 0.17], [tx + 0.11, ty - 0.1], [tx, ty - 0.145]]), tb, { mat: 'wood' }); break;
          case 'hammer': add(tz, RR(tx - 0.012, ty - 0.27, 0.024, 0.31, 0.008), '#5a3e24', { mat: 'wood' }); add(tz + 0.01, RR(tx - 0.065, ty - 0.33, 0.13, 0.08, 0.012), ta, { mat: 'metal' }); break;
          case 'wrench': add(tz, RR(tx - 0.012, ty - 0.24, 0.024, 0.27, 0.01), ta, { mat: 'metal' }); add(tz + 0.01, (() => { const p = new Path2D(); p.arc(tx, ty - 0.26, 0.04, 0.7, Math.PI * 2 - 0.7 + Math.PI * 0.0); p.closePath(); return p; })(), ta, { mat: 'metal' }); break;
          case 'spatula': add(tz, RR(tx - 0.009, ty - 0.2, 0.018, 0.22, 0.006), '#4a3020', { mat: 'wood' }); add(tz + 0.01, RR(tx - 0.04, ty - 0.3, 0.08, 0.11, 0.014), tb, { mat: 'metal' }); break;
          case 'lantern': add(tz, RR(tx - 0.035, ty + 0.03, 0.07, 0.1, 0.014), '#2a2622', { mat: 'metal' }); add(tz + 0.01, RR(tx - 0.024, ty + 0.042, 0.048, 0.07, 0.01), '#ffd890', { glow: true, inner: true }); break;
          case 'tome': add(tz, RR(tx - 0.05, ty - 0.03, 0.1, 0.12, 0.01), ta, { mat: 'leather' }); det(tz + 0.01, () => { g.fillStyle = '#e8dcc0'; g.fillRect(tx - 0.044, ty - 0.022, 0.012, 0.105); dot(tx + 0.01, ty + 0.03, 0.015, tb); }); break;
        }
      }
    });

    // ================= HEAD =================
    const hxo = side ? -0.012 : 0;
    const headP = E(hxo, HY, side ? HW : HW, HR);
    add(8, headP, skin, { mat: 'skin', head: true });
    // Side view: the nose is its own skin shape that overlaps the face, so the one ink outline wraps around it.
    let C_nose = null;
    const noseKind = L.nose[Math.max(0, Math.min(L.nose.length - 1, look.nose || 0))];
    if (side) {
      // Profile nose: a wedge that grows out of the face curve, from the bridge (eye level) to the tip and back under to the lip.
      const edge = (y) => hxo - HW * Math.sqrt(Math.max(0, 1 - ((y - HY) / HR) ** 2));
      const N = { Button: [0.02, 0.34, 'up'], Straight: [0.03, 0.37, 'line'], Broad: [0.03, 0.38, 'round'], Pointed: [0.044, 0.36, 'line'], Hooked: [0.038, 0.42, 'hook'] }[noseKind] || [0.025, 0.36, 'line'];
      const out = N[0] * hk, yT = HY + HR * 0.08, yTip = HY + HR * N[1], yB = HY + HR * 0.47;
      const xT = edge(yT), xB = edge(yB), tx = edge(yTip) - out;
      const P = new Path2D();
      P.moveTo(xT + 0.014, yT); P.lineTo(xT + 0.001, yT);
      if (N[2] === 'up') P.quadraticCurveTo(xT - out * 0.15, yTip - 0.004, tx, yTip - 0.004);           // short, slightly scooped, tip turned up
      else if (N[2] === 'hook') P.quadraticCurveTo(tx - out * 0.25, yT + (yTip - yT) * 0.35, tx, yTip);     // arched bridge, tip hangs down
      else P.lineTo(tx + out * 0.05, yTip - 0.008);                                                          // straight bridge
      if (N[2] === 'round') P.quadraticCurveTo(tx - out * 0.25, yTip + 0.012, tx + out * 0.45, yTip + 0.02);  // fleshy rounded tip
      else P.quadraticCurveTo(tx - out * 0.08, yTip + 0.008, tx + out * 0.35, yTip + 0.012);
      P.quadraticCurveTo(xB - 0.004, yTip + 0.016, xB + 0.001, yB); P.lineTo(xB + 0.014, yB); P.closePath();
      add(8.3, P, skin, { mat: 'skin' }); // above beard and moustache, so they sit under the nose
      C_nose = { tx, yTip, out };
      det(8.31, () => curve(tx + out * 0.95, yTip + 0.004, tx + out * 1.15, yTip + 0.018, tx + out * 1.4, yTip + 0.01, 'rgba(80,36,24,.45)', lw(1)));
    }
    const pick = (list, v) => list[Math.max(0, Math.min(list.length - 1, v || 0))];
    const earS = pick(L.ears, look.ears), browS = pick(L.brows, look.brows), noseS = pick(L.nose, look.nose), mouthS = pick(L.mouth, look.mouth), markS = pick(L.marks, look.marks);
    const lashes = look.lashes == null ? fem : !!look.lashes, lips = look.lips == null ? fem : !!look.lips;
    // ears: round, pointed or long elven
    const earPath = (d, ex) => {
      if (earS === 'Round') return E(ex, HY + HR * 0.12, HW * 0.13, HR * 0.17);
      const len = earS === 'Long' ? 0.11 : 0.055, up = earS === 'Long' ? 0.07 : 0.045;
      return POLY([[ex - d * HW * 0.02, HY - HR * 0.08], [ex + d * (HW * 0.1 + len), HY - HR * 0.08 - up], [ex + d * HW * 0.1, HY + HR * 0.22], [ex - d * HW * 0.04, HY + HR * 0.3]]);
    };
    if (!side) [-1, 1].forEach((d) => add(7.9, earPath(d, d * HW * 0.98), skin, { mat: 'skin' }));
    else {
      const ex = hxo + HW * 0.32, ey2 = HY + HR * 0.18;
      add(8.02, earS === 'Round' ? E(ex, ey2, HW * 0.15, HR * 0.21) : earPath(1, ex - HW * 0.04), tone(skin, -0.04), { mat: 'skin', inner: true });
      det(8.03, () => curve(ex - HW * 0.05, ey2 - HR * 0.1, ex + HW * 0.08, ey2 - HR * 0.02, ex - HW * 0.02, ey2 + HR * 0.11, tone(skin, -0.35), lw(1.4), 0.8));
    }
    // face
    if (!back) det(8.1, () => {
      const eyeStyle = L.eyes[look.eyes || 0], ey = HY + HR * 0.1, er = 0.021 * hk, dark = '#1e140e';
      const xs = side ? [hxo - HW * 0.55] : [-HW * 0.4, HW * 0.4];
      // marks under everything else on the face
      if (markS === 'Freckles') { g.fillStyle = tone(skin, -0.38); xs.forEach((x) => [[-1, 2.4], [0, 2.9], [1, 2.5], [-0.4, 3.4], [0.6, 3.3]].forEach(([dx, dy]) => { g.globalAlpha = 0.6; g.beginPath(); g.arc(x + dx * er * 0.9, ey + dy * er, er * 0.17, 0, 7); g.fill(); })); g.globalAlpha = 1; }
      if (markS === 'War paint') { g.save(); g.globalAlpha = 0.75; g.fillStyle = '#3a4a8a'; xs.forEach((x) => { g.fillRect(x - er * 1.4, ey + er * 1.8, er * 2.8, er * 0.45); g.fillRect(x - er * 1.4, ey + er * 2.6, er * 2.8, er * 0.45); }); g.restore(); }
      xs.forEach((x, k) => {
        const mir = side ? -1 : k ? 1 : -1;
        if (opt.blink || eyeStyle === 'Sleepy') { curve(x - er, ey + 0.002, x, ey + er * 0.6, x + er, ey + 0.002, dark, lw(1.6)); if (eyeStyle === 'Sleepy' && !opt.blink) { g.fillStyle = dark; g.beginPath(); g.ellipse(x, ey + 0.006, er * 0.8, er * 0.55, 0, 0, Math.PI); g.fill(); } }
        else if (eyeStyle === 'Dot') dot(x, ey, er * 0.55, dark);
        else {
          const big = eyeStyle === 'Sparkle', sharp = eyeStyle === 'Sharp';
          const rx = er * (big ? 0.95 : 0.8), ry = er * (big ? 1.25 : sharp ? 0.8 : 1.05);
          g.fillStyle = tone(eyeC, -0.45); g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
          g.fillStyle = tone(eyeC, 0.05); g.beginPath(); g.ellipse(x, ey + ry * 0.28, rx * 0.65, ry * 0.55, 0, 0, 7); g.fill();
          dot(x, ey + ry * 0.15, rx * 0.4, dark);
          dot(x + rx * 0.3, ey - ry * 0.35, rx * 0.32, 'rgba(255,255,255,.9)'); if (big) dot(x - rx * 0.35, ey + ry * 0.4, rx * 0.16, 'rgba(255,255,255,.8)');
          if (lashes) { line([[x + mir * rx * 0.7, ey - ry * 0.7], [x + mir * rx * 1.4, ey - ry * 1.05]], dark, lw(1.3)); line([[x + mir * rx * 0.2, ey - ry * 0.95], [x + mir * rx * 0.6, ey - ry * 1.4]], dark, lw(1)); }
        }
        // brow
        if (browS !== 'None') {
          const by = ey - er * 2.0, bc = tone(hairC, -0.15), w = { Thick: 3.6, Thin: 1.5, Natural: fem ? 2 : 2.8, Arched: 2, Angry: 3, Raised: 2.2 }[browS];
          if (browS === 'Angry' || eyeStyle === 'Sharp') line([[x - mir * er * 1.3, by - er * 0.45], [x + mir * er * 1.1, by + er * 0.4]], bc, lw(w));
          else if (browS === 'Arched') curve(x - er * 1.25, by + er * 0.35, x - mir * er * 0.1, by - er * 0.7, x + er * 1.25, by + er * 0.3, bc, lw(w));
          else if (browS === 'Raised') curve(x - er * 1.2, by - er * 0.2, x, by - er * 0.9, x + er * 1.2, by - er * 0.25, bc, lw(w));
          else curve(x - er * 1.2, by + er * 0.2, x, by - er * 0.25, x + er * 1.2, by + er * 0.15, bc, lw(w));
        }
      });
      // nose
      const nsh = 'rgba(110,52,34,.4)', ny = HY + HR * 0.36, nx = side ? hxo - HW * 0.98 : HW * 0.05;
      if (side) {
        // nostril and a soft shadow where the nose meets the cheek

      } else if (noseS === 'Button') { g.fillStyle = nsh; g.beginPath(); g.ellipse(nx, ny, er * 0.65, er * 0.42, 0, 0, 7); g.fill(); }
      else if (noseS === 'Broad') { g.fillStyle = nsh; g.beginPath(); g.ellipse(nx, ny + er * 0.1, er * 1.05, er * 0.5, 0, 0, 7); g.fill(); dot(nx - er * 0.45, ny + er * 0.25, er * 0.18, 'rgba(70,30,20,.5)'); dot(nx + er * 0.45, ny + er * 0.25, er * 0.18, 'rgba(70,30,20,.5)'); }
      else { const len = noseS === 'Pointed' ? 1.6 : noseS === 'Hooked' ? 1.4 : 1.2; curve(nx - er * 0.1, ny - er * len, nx + er * (noseS === 'Hooked' ? 0.7 : 0.4), ny - er * 0.2, nx - er * 0.35, ny + er * 0.3, 'rgba(90,40,26,.55)', lw(1.2)); g.fillStyle = nsh; g.beginPath(); g.ellipse(nx, ny + er * 0.2, er * 0.55, er * 0.3, 0, 0, 7); g.fill(); }
      // cheeks
      if (look.blush !== false) { g.fillStyle = 'rgba(200,90,70,.2)'; xs.forEach((x) => { g.beginPath(); g.ellipse(x + (side ? 0.01 : x < 0 ? -0.012 : 0.012), ey + er * 2.3, er * 1.3, er * 0.7, 0, 0, 7); g.fill(); }); }
      // mouth
      const mx = side ? hxo - HW * 0.6 : 0, my = HY + HR * 0.6, mc = 'rgba(70,30,22,.75)';
      if (lips) { g.fillStyle = 'rgba(170,60,60,.42)'; g.beginPath(); g.ellipse(mx, my + er * 0.1, er * 0.75, er * 0.33, 0, 0, 7); g.fill(); }
      if (mouthS === 'Smile') curve(mx - er * 0.8, my - HR * 0.02, mx, my + HR * 0.05, mx + er * 0.8, my - HR * 0.03, mc, lw(1.3));
      else if (mouthS === 'Neutral') line([[mx - er * 0.6, my], [mx + er * 0.6, my]], mc, lw(1.2));
      else if (side && (mouthS === 'Grin' || mouthS === 'Open')) { g.fillStyle = '#4a1a14'; g.beginPath(); g.moveTo(mx - er * 0.75, my - er * 0.15); g.quadraticCurveTo(mx, my + er * (mouthS === 'Open' ? 1.5 : 1.1), mx + er * 0.8, my - er * 0.3); g.closePath(); g.fill(); if (mouthS === 'Grin') { g.fillStyle = '#f4ece0'; g.fillRect(mx - er * 0.45, my - er * 0.12, er * 0.95, er * 0.22); } }
      else if (mouthS === 'Grin') { g.fillStyle = '#4a1a14'; g.beginPath(); g.moveTo(mx - er * 0.95, my - er * 0.15); g.quadraticCurveTo(mx, my + er * 1.3, mx + er * 0.95, my - er * 0.15); g.closePath(); g.fill(); g.fillStyle = '#f4ece0'; g.fillRect(mx - er * 0.7, my - er * 0.1, er * 1.4, er * 0.28); }
      else if (mouthS === 'Smirk') curve(mx - er * 0.7, my + er * 0.1, mx + er * 0.1, my + er * 0.3, mx + er * 0.85, my - er * 0.4, mc, lw(1.3));
      else if (mouthS === 'Frown') curve(mx - er * 0.75, my + er * 0.3, mx, my - er * 0.35, mx + er * 0.75, my + er * 0.3, mc, lw(1.3));
      else if (mouthS === 'Open') { g.fillStyle = '#4a1a14'; g.beginPath(); g.ellipse(mx, my + er * 0.2, er * 0.45, er * 0.55, 0, 0, 7); g.fill(); }
      // scars and beauty marks on top
      if (markS === 'Scar') { const x = xs[xs.length - 1]; line([[x - er * 0.6, ey - er * 2.6], [x + er * 0.8, ey + er * 2.2]], 'rgba(150,60,50,.75)', lw(1.6)); [-1.2, 0, 1.2].forEach((k) => line([[x + er * 0.1 * k - er * 0.35, ey + er * k * 1.1 - er * 0.1], [x + er * 0.1 * k + er * 0.45, ey + er * k * 1.1 - er * 0.3]], 'rgba(150,60,50,.6)', lw(1))); }
      if (markS === 'Cheek scar') line([[xs[0] - er * 1.2, ey + er * 2.0], [xs[0] + er * 0.6, ey + er * 3.2]], 'rgba(150,60,50,.75)', lw(1.6));
      if (markS === 'Beauty mark') dot(mx + er * 1.3, my - er * 0.6, er * 0.16, '#3a2018');
    });
    // beard
    const beard = L.beard && L.beard[look.beard || 0];
    if (beard && beard !== 'None' && !back && !(hat && hat.s === 'knight')) {
      const bc = tone(hairC, -0.04), lenB = { Stubble: 0, Mustache: 0, Goatee: 0.06, 'Short beard': 0.04, 'Full beard': 0.1, 'Long beard': 0.2, 'Braided beard': 0.08 }[beard];
      if (beard === 'Stubble') det(8.15, () => { g.save(); g.globalAlpha = 0.28; g.fillStyle = bc; g.beginPath(); if (side) g.ellipse(hxo - HW * 0.3, HY + HR * 0.6, HW * 0.65, HR * 0.4, 0, 0, Math.PI); else g.ellipse(0, HY + HR * 0.45, HW * 0.92, HR * 0.55, 0, 0, Math.PI); g.fill(); g.restore(); });
      else if (beard === 'Goatee') add(8.2, side ? E(hxo - HW * 0.65, HY + HR * 0.9, HW * 0.18, HR * 0.25) : E(0, HY + HR * 0.92, HW * 0.22, HR * 0.28), bc, { hair: true });
      else if (beard !== 'Mustache') {
        const p = new Path2D();
        if (side) { p.moveTo(hxo - HW * 0.92, HY + HR * 0.4); p.quadraticCurveTo(hxo - HW * 0.98, HY + HR + lenB, hxo - HW * 0.25, HY + HR * 0.95 + lenB); p.quadraticCurveTo(hxo + HW * 0.3, HY + HR * 0.85, hxo + HW * 0.3, HY + HR * 0.3); p.quadraticCurveTo(hxo - HW * 0.25, HY + HR * 0.55, hxo - HW * 0.92, HY + HR * 0.4); }
        else { p.moveTo(-HW * 0.96, HY + HR * 0.12); p.quadraticCurveTo(-HW * 0.88, HY + HR * 1.1 + lenB * 0.7, 0, HY + HR * 1.18 + lenB); p.quadraticCurveTo(HW * 0.88, HY + HR * 1.1 + lenB * 0.7, HW * 0.96, HY + HR * 0.12); p.quadraticCurveTo(HW * 0.62, HY + HR * 0.55, HW * 0.32, HY + HR * 0.5); p.quadraticCurveTo(0, HY + HR * 0.42, -HW * 0.32, HY + HR * 0.5); p.quadraticCurveTo(-HW * 0.62, HY + HR * 0.55, -HW * 0.96, HY + HR * 0.12); p.moveTo(-HW * 0.24, HY + HR * 0.7); p.quadraticCurveTo(0, HY + HR * 0.86, HW * 0.24, HY + HR * 0.7); p.quadraticCurveTo(0, HY + HR * 0.78, -HW * 0.24, HY + HR * 0.7); }
        add(8.2, p, bc, { hair: true, evenodd: true });
        det(8.21, () => { if (!side) for (let k = -2; k <= 2; k++) curve(k * HW * 0.25, HY + HR * 0.85, k * HW * 0.27, HY + HR + lenB * 0.5, k * HW * 0.18, HY + HR + lenB * 0.9, tone(bc, -0.4), lw(0.9), 0.5); });
        if (beard === 'Braided beard') for (let k = 0; k < 3; k++) add(8.22, E((side ? hxo - HW * 0.45 : 0) + sway * 0.006 * k, HY + HR * 1.18 + lenB + 0.02 + k * 0.032, 0.022 - k * 0.002, 0.02), bc, { hair: true });
      }
      if (beard !== 'Stubble') { const mx = side ? hxo - HW * 0.62 : 0; add(8.25, (() => { const p = new Path2D(); p.moveTo(mx, HY + HR * 0.48); p.quadraticCurveTo(mx - HW * 0.32, HY + HR * 0.42, mx - HW * 0.42, HY + HR * 0.66); p.quadraticCurveTo(mx - HW * 0.2, HY + HR * 0.58, mx, HY + HR * 0.6); p.quadraticCurveTo(mx + HW * 0.2, HY + HR * 0.58, mx + HW * 0.42, HY + HR * 0.66); p.quadraticCurveTo(mx + HW * 0.32, HY + HR * 0.42, mx, HY + HR * 0.48); p.closePath(); return p; })(), bc, { hair: true, inner: true }); }
    }
    // face items
    if (face && !back) {
      const xs = side ? [hxo - HW * 0.55] : [-HW * 0.4, HW * 0.4], ey = HY + HR * 0.1;
      det(8.3, () => {
        const fa = face.a, fb = face.b;
        switch (face.s) {
          case 'glasses': xs.forEach((x) => { g.strokeStyle = fa; g.lineWidth = lw(1.8); g.beginPath(); g.arc(x, ey, 0.032, 0, 7); g.stroke(); }); if (!side) line([[-HW * 0.4 + 0.032, ey], [HW * 0.4 - 0.032, ey]], fa, lw(1.6)); break;
          case 'goggles': g.fillStyle = '#3a2818'; g.fill(RR(-HW * 1.02, ey - 0.014, HW * 2.04, 0.028, 0.01)); xs.forEach((x) => { dot(x, ey, 0.04, '#9a7a3a'); dot(x, ey, 0.029, fa); dot(x + 0.01, ey - 0.01, 0.008, 'rgba(255,255,255,.7)'); }); break;
          case 'hearts': xs.forEach((x) => { g.fillStyle = fa; g.beginPath(); g.moveTo(x, ey + 0.03); g.bezierCurveTo(x - 0.05, ey + 0.0, x - 0.03, ey - 0.035, x, ey - 0.012); g.bezierCurveTo(x + 0.03, ey - 0.035, x + 0.05, ey, x, ey + 0.03); g.fill(); }); break;
          case 'eyepatch': line([[-HW, ey - 0.07], [HW, ey + 0.02]], '#1a120c', lw(1.6)); g.fillStyle = '#1e1610'; g.beginPath(); g.ellipse(side ? xs[0] : xs[1], ey, 0.032, 0.028, 0, 0, 7); g.fill(); break;
          case 'monocle': { const x = side ? xs[0] : xs[1]; g.strokeStyle = fa; g.lineWidth = lw(2); g.beginPath(); g.arc(x, ey, 0.032, 0, 7); g.stroke(); curve(x + 0.03, ey + 0.015, x + 0.05, ey + 0.1, x + 0.04, HY + HR + 0.04, fa, lw(0.9)); break; }
          case 'mask': g.fillStyle = fa; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = lw(1.2); g.beginPath();
            if (side) { g.moveTo(hxo - HW * 1.02, ey + 0.028); g.quadraticCurveTo(hxo - HW * 0.2, ey + 0.012, hxo + HW * 0.42, ey + 0.03); g.lineTo(hxo + HW * 0.36, HY + HR * 0.82); g.quadraticCurveTo(hxo - HW * 0.4, HY + HR * 1.02, hxo - HW * 0.98, HY + HR * 0.72); g.quadraticCurveTo(hxo - HW * 1.08, HY + HR * 0.5, hxo - HW * 1.02, ey + 0.028); }
            else { g.moveTo(-HW * 0.95, ey + 0.035); g.quadraticCurveTo(0, ey + 0.02, HW * 0.95, ey + 0.035); g.lineTo(HW * 0.74, HY + HR * 0.85); g.quadraticCurveTo(0, HY + HR * 1.06, -HW * 0.74, HY + HR * 0.85); }
            g.closePath(); g.fill(); g.stroke(); break;
        }
      });
    }
    // ================= HAIR (front) =================
    if (!hatHides) {
      const cap = (fringe, extra) => {
        const p = new Path2D(), f2 = fringe || 0;
        if (back) { p.ellipse(hxo, HY - HR * 0.05, HW * 1.06, HR * 1.04, 0, 0, Math.PI * 2); }
        else if (side) { p.moveTo(hxo - HW * 0.82, HY - HR * 0.25 + f2 * 0.5); p.quadraticCurveTo(hxo - HW * 0.95, HY - HR * 1.12, hxo + HW * 0.15, HY - HR * 1.08); p.quadraticCurveTo(hxo + HW * 1.12, HY - HR * 0.85, hxo + HW * 1.0, HY + HR * 0.35); p.lineTo(hxo + HW * 0.48, HY + HR * 0.25); p.quadraticCurveTo(hxo + HW * 0.32, HY - HR * 0.3 + f2, hxo - HW * 0.82, HY - HR * 0.25 + f2 * 0.5); }
        else { p.moveTo(-HW * 1.05, HY + HR * 0.15); p.quadraticCurveTo(-HW * 1.1, HY - HR * 1.14, 0, HY - HR * 1.1); p.quadraticCurveTo(HW * 1.1, HY - HR * 1.14, HW * 1.05, HY + HR * 0.15); p.quadraticCurveTo(HW * 0.85, HY - HR * 0.4 + f2, HW * 0.3, HY - HR * 0.45 + f2); p.quadraticCurveTo(-HW * 0.25, HY - HR * 0.28 + f2, -HW * 0.72, HY - HR * 0.4 + f2); p.quadraticCurveTo(-HW * 0.98, HY - HR * 0.12, -HW * 1.05, HY + HR * 0.15); }
        p.closePath();
        add(9, p, hairC, { hair: true });
        det(9.01, () => { if (!back) { for (let k = -2; k <= 2; k++) curve(hxo + k * HW * 0.3, HY - HR * 0.95, hxo + k * HW * 0.34 + 0.01, HY - HR * 0.6, hxo + k * HW * 0.36, HY - HR * 0.35 + f2, tone(hairC, -0.4), lw(0.9), 0.45); } curve(hxo - HW * 0.5, HY - HR * 0.82, hxo - HW * 0.15, HY - HR * 1.02, hxo + HW * 0.25, HY - HR * 0.98, 'rgba(255,240,220,1)', lw(2.2), 0.2); });
        if (extra) extra();
      };
      const lock = (d, len) => { if (!front) return; add(9.05, POLY([[d * HW * 1.06, HY - HR * 0.1], [d * HW * 0.75, HY - HR * 0.3], [d * HW * 0.78 + hsw, HY + len], [d * HW * 1.1 + hsw, HY + len - 0.01]]), hairC, { hair: true }); };
      switch (hs) {
        case 'Spiky': cap(0.02, () => {
          // spikes grow out of the skull (radially), swept back in profile
          const pts = [];
          if (side) [[-0.95, -0.55], [-0.75, -1.38, 1], [-0.45, -0.98], [-0.05, -1.5, 1], [0.25, -1.02], [0.7, -1.38, 1], [0.88, -0.75], [1.18, -0.95, 1], [1.0, -0.2]].forEach(([x, y]) => pts.push([hxo + HW * x + (y < -1.2 ? HW * 0.12 : 0), HY + HR * y]));
          else { const n = 5; pts.push([-HW * 1.0, HY - HR * 0.45]); for (let i = 0; i < n; i++) { const a0 = Math.PI * (1.08 + (i / (n - 1)) * 0.84), a1 = a0 + Math.PI * 0.1; pts.push([Math.cos(a0) * HW * 1.42, HY - HR * 0.05 + Math.sin(a0) * HR * 1.42]); if (i < n - 1) pts.push([Math.cos(a1) * HW * 0.96, HY - HR * 0.05 + Math.sin(a1) * HR * 0.96]); } pts.push([HW * 1.0, HY - HR * 0.45]); }
          add(9.05, POLY(pts), hairC, { hair: true }); }); break;
        case 'Messy': cap(0.03, () => {
          // short flicks poking out of the hairline, not separate blobs
          [-0.95, -0.62, -0.28, 0.08, 0.42, 0.78].forEach((t, i) => {
            const a = Math.PI * (1.5 + t * 0.42), bx = hxo + Math.cos(a) * HW * 1.0, by = HY - HR * 0.05 + Math.sin(a) * HR * 1.02, len = 0.045 + (i % 2) * 0.02, tilt = a + (i % 2 ? 0.35 : -0.3);
            add(9.05, POLY([[bx - Math.sin(a) * 0.022, by + Math.cos(a) * 0.022], [bx + Math.cos(tilt) * len, by + Math.sin(tilt) * len], [bx + Math.sin(a) * 0.022, by - Math.cos(a) * 0.022]]), hairC, { hair: true });
          }); }); break;
        case 'Curly': cap(0.0, () => { for (let k = 0; k < 9; k++) { const an = Math.PI * (1.0 + k * 0.125); add(9.05, E(hxo + Math.cos(an) * HW * 0.98, HY - HR * 0.1 + Math.sin(an) * HR * 0.98, HW * 0.24, HR * 0.22), hairC, { hair: true }); } }); break;
        case 'Bob': cap(0.03, () => { lock(-1, 0.1); lock(1, 0.1); }); break;
        case 'Long': cap(0.03, () => { lock(-1, 0.26); lock(1, 0.26); }); break;
        case 'Wavy': cap(0.03, () => { lock(-1, 0.22); lock(1, 0.22); }); break;
        case 'Locs': cap(0.02, () => { if (front) [-1, 1].forEach((d) => { for (let k = 0; k < 2; k++) add(9.05, RR(d * HW * (0.95 - k * 0.2) - 0.012 + hsw, HY - HR * 0.3, 0.024, 0.2 - k * 0.04, 0.012), hairC, { hair: true }); }); }); break;
        case 'Ponytail': cap(0.02, () => { if (front) add(9.05, E(HW * 0.95, HY + HR * 0.2, HW * 0.18, HR * 0.4), hairC, { hair: true }); }); break;
        case 'Twin tails': cap(0.03); break;
        case 'Bun': cap(0.02, () => add(9.05, E(hxo, HY - HR * 1.15, HW * 0.36, HR * 0.3), hairC, { hair: true })); break;
        case 'Top-knot': cap(-0.02, () => { add(9.05, E(hxo, HY - HR * 1.2, HW * 0.26, HR * 0.24), hairC, { hair: true }); add(9.06, RR(hxo - HW * 0.2, HY - HR * 1.02, HW * 0.4, 0.016, 0.006), '#6a2a24', { inner: true }); }); break;
        case 'Mohawk': {
          // stubble on the shaved sides, and a fin of hair that follows the skull from front to back
          det(8.95, () => { g.save(); g.globalAlpha = 0.22; g.fillStyle = hairC; g.beginPath(); g.ellipse(hxo, HY - HR * 0.08, HW * 1.0, HR * 0.98, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill(); g.restore(); });
          if (side) add(9, POLY([[hxo - HW * 0.78, HY - HR * 0.72], [hxo - HW * 0.62, HY - HR * 1.32], [hxo - HW * 0.3, HY - HR * 1.12], [hxo - HW * 0.05, HY - HR * 1.48], [hxo + HW * 0.25, HY - HR * 1.12], [hxo + HW * 0.55, HY - HR * 1.36], [hxo + HW * 0.8, HY - HR * 0.92], [hxo + HW * 1.05, HY - HR * 0.4], [hxo + HW * 0.7, HY - HR * 0.5], [hxo + HW * 0.1, HY - HR * 0.95], [hxo - HW * 0.5, HY - HR * 0.86]]), hairC, { hair: true });
          else add(9, POLY([[-HW * 0.16, HY - HR * 0.8], [-HW * 0.24, HY - HR * 1.32], [-HW * 0.1, HY - HR * 1.22], [0, HY - HR * 1.5], [HW * 0.1, HY - HR * 1.22], [HW * 0.24, HY - HR * 1.32], [HW * 0.16, HY - HR * 0.8], [0, HY - HR * 0.92]]), hairC, { hair: true });
          break; }
        case 'Undercut': {
          // shaved sides (stubble) under a longer top that hugs the skull and sweeps over
          det(8.95, () => { g.save(); g.globalAlpha = 0.28; g.fillStyle = hairC; g.beginPath(); g.ellipse(hxo, HY - HR * 0.1, HW * 1.0, HR * 0.95, 0, Math.PI * 0.98, Math.PI * 2.02); g.fill(); g.restore(); });
          const p = new Path2D();
          if (side) { p.moveTo(hxo - HW * 0.9, HY - HR * 0.42); p.quadraticCurveTo(hxo - HW * 1.05, HY - HR * 1.2, hxo + HW * 0.1, HY - HR * 1.12); p.quadraticCurveTo(hxo + HW * 0.85, HY - HR * 1.0, hxo + HW * 0.92, HY - HR * 0.55); p.quadraticCurveTo(hxo + HW * 0.2, HY - HR * 0.78, hxo - HW * 0.9, HY - HR * 0.42); }
          else { p.moveTo(-HW * 0.86, HY - HR * 0.5); p.quadraticCurveTo(-HW * 0.98, HY - HR * 1.18, 0, HY - HR * 1.16); p.quadraticCurveTo(HW * 0.98, HY - HR * 1.18, HW * 0.86, HY - HR * 0.5); p.quadraticCurveTo(HW * 0.35, HY - HR * 0.82, -HW * 0.2, HY - HR * 0.62); p.quadraticCurveTo(-HW * 0.6, HY - HR * 0.5, -HW * 0.86, HY - HR * 0.5); }
          p.closePath(); add(9, p, hairC, { hair: true });
          det(9.01, () => { if (!back) for (let k = -1; k <= 1; k++) curve(hxo + k * HW * 0.35 - HW * 0.1, HY - HR * 1.05, hxo + k * HW * 0.4 + HW * 0.1, HY - HR * 0.9, hxo + k * HW * 0.45 + HW * 0.25, HY - HR * 0.66, tone(hairC, -0.4), lw(0.9), 0.45); });
          break; }
        case 'Braid': cap(0.03, () => { if (front) for (let k = 0; k < 6; k++) add(9.05, E(HW * 0.95 + hsw * k / 5, HY + HR * 0.25 + k * 0.045, 0.03 - k * 0.002, 0.03), hairC, { hair: true }); }); break;
        case 'Crop': cap(-0.02); break;
        default: cap(0.02);
      }
    }
    // ================= HATS =================
    if (hat) {
      const a = hat.a, b = hat.b, TOP = HY - HR, z = 9.5;
      const dome = (y, rx, ry, col) => { const p = new Path2D(); p.ellipse(hxo, y, rx, ry, 0, Math.PI, 0); p.closePath(); return add(z, p, col || a); };
      const brim = (y, w, h, col, dx) => add(z + 0.05, E(hxo + (side ? (dx == null ? -0.04 : dx) : 0), y, w, h), col || a);
      switch (hat.s) {
        case 'hood': { const p = new Path2D(); p.moveTo(hxo - HW * 1.22, HY + HR * 0.95); p.quadraticCurveTo(hxo - HW * 1.3, TOP - 0.05, hxo + (side ? 0.04 : 0), TOP - 0.055); p.quadraticCurveTo(hxo + HW * 1.3 + (side ? 0.04 : 0), TOP - 0.04, hxo + HW * 1.22 + (side ? 0.03 : 0), HY + HR * 0.95);
          if (front) { p.quadraticCurveTo(HW * 0.95, HY + HR * 0.4, HW * 0.92, HY - HR * 0.1); p.quadraticCurveTo(HW * 0.7, HY - HR * 0.78, 0, HY - HR * 0.82); p.quadraticCurveTo(-HW * 0.7, HY - HR * 0.78, -HW * 0.92, HY - HR * 0.1); p.quadraticCurveTo(-HW * 0.95, HY + HR * 0.4, -HW * 1.22, HY + HR * 0.95); }
          else if (side) { p.quadraticCurveTo(hxo + HW * 0.1, HY + HR * 0.5, hxo - HW * 0.25, HY - HR * 0.3); p.quadraticCurveTo(hxo - HW * 0.7, HY - HR * 0.6, hxo - HW * 1.22, HY + HR * 0.95); }
          p.closePath(); add(z, p, a); add(z + 0.02, RR(hxo - HW * 1.25, HY + HR * 0.85, HW * 2.5 + (side ? 0.03 : 0), 0.07, 0.03), tone(a, -0.08));
          det(z + 0.03, () => { if (front) curve(-HW * 0.92, HY - HR * 0.1, 0, HY - HR * 0.95, HW * 0.92, HY - HR * 0.1, 'rgba(0,0,0,1)', lw(3), 0.3); fold([[hxo - HW * 0.6, TOP], [hxo - HW * 1.05, HY + HR * 0.6]], 0.3); fold([[hxo + HW * 0.6, TOP], [hxo + HW * 1.05, HY + HR * 0.6]], 0.3); });
          break; }
        case 'knight': add(z, E(hxo, HY - 0.005, HW * 1.1, HR * 1.08), a, { mat: 'metal' }); det(z + 0.01, () => { if (!back) { g.fillStyle = '#120c08'; g.fill(RR(hxo - HW * (side ? 1.0 : 0.75), HY + HR * 0.02, HW * (side ? 0.6 : 1.5), 0.026, 0.008)); for (let k = 0; k < 4; k++) line([[hxo - HW * (side ? 0.85 : 0.3) + k * 0.018, HY + HR * 0.4], [hxo - HW * (side ? 0.85 : 0.3) + k * 0.018, HY + HR * 0.7]], '#120c08', lw(1.4), 0.75); } line([[hxo, TOP + 0.01], [hxo, HY + HR * 0.95]], 'rgba(255,255,255,.4)', lw(1.4)); }); add(z + 0.02, (() => { const p = new Path2D(); p.moveTo(hxo - 0.01, TOP); p.quadraticCurveTo(hxo + 0.05, TOP - 0.12, hxo + 0.15, TOP - 0.06); p.quadraticCurveTo(hxo + 0.06, TOP - 0.03, hxo + 0.025, TOP + 0.015); p.closePath(); return p; })(), b); break;
        case 'kettle': dome(HY - HR * 0.15, HW * 1.1, HR * 1.0); brim(HY - HR * 0.15, HW * 1.42, HR * 0.17, a, 0); break;
        case 'cap': case 'visorcap': dome(HY - HR * 0.15, HW * 1.06, HR * 0.96); add(z + 0.05, side ? E(hxo - HW * 0.95, HY - HR * 0.15, HW * 0.45, HR * 0.1) : (() => { const p = new Path2D(); p.ellipse(0, HY - HR * 0.14, HW * 0.92, HR * 0.24, 0, 0, Math.PI); p.closePath(); return p; })(), hat.s === 'visorcap' ? b : tone(a, -0.15)); add(z + 0.06, E(hxo, TOP - 0.005, 0.012, 0.008), b, { inner: true }); break;
        case 'beanie': dome(HY - HR * 0.05, HW * 1.08, HR * 1.08); add(z + 0.05, RR(hxo - HW * 1.08, HY - HR * 0.3, HW * 2.16, HR * 0.3, 0.02), b); add(z + 0.06, E(hxo, TOP - 0.03, 0.03, 0.028), b); break;
        case 'bandana': dome(HY - HR * 0.02, HW * 1.05, HR * 1.04); det(z + 0.01, () => { [[-0.5, -0.5], [0.15, -0.75], [0.55, -0.3], [-0.1, -0.25]].forEach(([x, y]) => dot(hxo + HW * x, HY + HR * y, 0.008, b)); }); if (!side) add(z + 0.02, POLY([[HW * 0.95, HY - HR * 0.1], [HW * 1.3, HY + HR * 0.3], [HW * 1.05, HY + HR * 0.35]]), a); break;
        case 'hardhat': case 'miner': dome(HY - HR * 0.15, HW * 1.1, HR * 1.04); brim(HY - HR * 0.15, HW * 1.32, HR * 0.12, tone(a, -0.12), 0); det(z + 0.06, () => { line([[hxo, TOP - 0.01], [hxo, HY - HR * 0.25]], 'rgba(255,255,255,.35)', lw(2.4)); if (hat.s === 'miner' && !back) { dot(hxo + (side ? -HW * 0.7 : 0), HY - HR * 0.55, 0.03, '#8a7a5a'); dot(hxo + (side ? -HW * 0.7 : 0), HY - HR * 0.55, 0.02, b); } }); break;
        case 'aviator': dome(HY + HR * 0.05, HW * 1.08, HR * 1.08); if (!back) { add(z + 0.02, RR(hxo - HW * 1.12, HY - HR * 0.05, 0.05, HR * 0.95, 0.02), a); if (!side) add(z + 0.02, RR(hxo + HW * 1.12 - 0.05, HY - HR * 0.05, 0.05, HR * 0.95, 0.02), a); det(z + 0.03, () => { [-1, 1].forEach((d) => { if (side && d > 0) return; dot(hxo + d * HW * 0.42 + (side ? HW * 0.05 : 0), HY - HR * 0.42, 0.035, '#9a7a3a'); dot(hxo + d * HW * 0.42 + (side ? HW * 0.05 : 0), HY - HR * 0.42, 0.024, '#5a8a9a'); }); }); } break;
        case 'beret': add(z, E(hxo + 0.02, TOP + 0.03, HW * 1.2, HR * 0.3, -0.12), a); add(z + 0.01, E(hxo + 0.03, TOP - 0.01, 0.01, 0.01), b, { inner: true }); break;
        case 'cowboy': { const by = HY - HR * 0.32, cw = HW * 0.96; add(z, (() => { const p = new Path2D(); p.moveTo(hxo - cw, by); p.quadraticCurveTo(hxo - cw * 1.02, TOP - 0.05, hxo - cw * 0.55, TOP - 0.07); p.quadraticCurveTo(hxo, TOP - 0.03, hxo + cw * 0.55, TOP - 0.07); p.quadraticCurveTo(hxo + cw * 1.02, TOP - 0.05, hxo + cw, by); p.closePath(); return p; })(), a);
          add(z + 0.05, (() => { const p = new Path2D(); p.ellipse(hxo, by, HW * 1.72, HR * 0.24, 0, 0, Math.PI * 2); return p; })(), tone(a, -0.05)); det(z + 0.06, () => { if (!back) curve(hxo - HW * 1.6, by - HR * 0.05, hxo, by + HR * 0.22, hxo + HW * 1.6, by - HR * 0.05, 'rgba(0,0,0,.3)', lw(1.5)); });
          add(z + 0.07, RR(hxo - cw, by - HR * 0.17, cw * 2, 0.022, 0.004), b, { inner: true }); add(z + 0.06, E(hxo, by, HW * 1.72, HR * 0.24), a, { inner: true }); break; }
        case 'tophat': { const by = HY - HR * 0.34, cw = HW * 0.95; add(z, (() => { const p = new Path2D(); p.moveTo(hxo - cw, by); p.lineTo(hxo - cw * 0.92, TOP - 0.17); p.quadraticCurveTo(hxo, TOP - 0.19, hxo + cw * 0.92, TOP - 0.17); p.lineTo(hxo + cw, by); p.closePath(); return p; })(), a);
          add(z + 0.05, E(hxo, by, HW * 1.32, HR * 0.15), a); add(z + 0.06, RR(hxo - cw * 0.98, by - HR * 0.34, cw * 1.96, HR * 0.2, 0.004), b, { inner: true });
          det(z + 0.07, () => line([[hxo - cw * 0.55, TOP - 0.15], [hxo - cw * 0.6, by - HR * 0.4]], 'rgba(255,255,255,.22)', lw(2.4))); break; }
        case 'wizard': { const by = HY - HR * 0.33, cw = HW * 0.98, tip = side ? hxo + HW * 0.9 : hxo + HW * 0.75; add(z, (() => { const p = new Path2D(); p.moveTo(hxo - cw, by); p.quadraticCurveTo(hxo - cw * 0.85, TOP - 0.08, hxo - cw * 0.1, TOP - 0.17); p.quadraticCurveTo(hxo + cw * 0.2, TOP - 0.26, tip, TOP - 0.24 + sway * 0.01); p.quadraticCurveTo(hxo + cw * 0.45, TOP - 0.12, hxo + cw * 0.72, TOP - 0.02); p.quadraticCurveTo(hxo + cw * 0.98, by - HR * 0.3, hxo + cw, by); p.closePath(); return p; })(), a);
          add(z + 0.05, E(hxo, by, HW * 1.62, HR * 0.21), a); add(z + 0.06, RR(hxo - cw * 0.98, by - HR * 0.24, cw * 1.96, 0.028, 0.006), b, { inner: true });
          det(z + 0.07, () => { [[-0.4, -0.05], [0.25, -0.12], [-0.05, -0.18]].forEach(([dx, dy]) => dot(hxo + HW * dx, TOP + dy, 0.009, b)); }); break; }
        case 'crown': add(z, POLY([[hxo - HW * 0.75, TOP + 0.04], [hxo - HW * 0.8, TOP - 0.07], [hxo - HW * 0.38, TOP - 0.01], [hxo, TOP - 0.1], [hxo + HW * 0.38, TOP - 0.01], [hxo + HW * 0.8, TOP - 0.07], [hxo + HW * 0.75, TOP + 0.04]]), a, { mat: 'metal' }); add(z + 0.01, E(hxo, TOP + 0.005, 0.014, 0.014), b, { inner: true }); break;
        case 'bow': { const bx = hxo + (side ? HW * 0.2 : HW * 0.55), by = TOP + 0.03; add(z, POLY([[bx, by], [bx - 0.08, by - 0.06], [bx - 0.08, by + 0.04]]), a); add(z, POLY([[bx, by], [bx + 0.08, by - 0.06], [bx + 0.08, by + 0.04]]), a); add(z + 0.01, E(bx, by, 0.018, 0.018), b); break; }
        case 'chef': { add(z - 0.01, E(hxo, HY - HR * 0.82, HW * 0.98, HR * 0.5), a); [[-0.52, -1.02, 0.58], [0.52, -1.02, 0.58], [0, -1.28, 0.66]].forEach(([x, y, rr]) => add(z, E(hxo + HW * x, HY + HR * y, HW * rr, HR * rr * 0.86), a)); add(z + 0.02, RR(hxo - HW * 1.0, HY - HR * 0.66, HW * 2.0, HR * 0.4, 0.015), a); det(z + 0.03, () => { if (!back) [-0.5, 0, 0.5].forEach((x) => line([[hxo + HW * x, HY - HR * 0.6], [hxo + HW * x, HY - HR * 0.3]], 'rgba(0,0,0,.12)', lw(1.4))); }); break; }
        case 'flowers': [-0.6, -0.3, 0, 0.3, 0.6].forEach((x, k) => { const y = TOP + 0.03 + Math.abs(x) * 0.05; add(z, E(hxo + HW * x, y, 0.026, 0.026), k % 2 ? '#c8a858' : a); add(z + 0.01, E(hxo + HW * x, y, 0.009, 0.009), '#f0e6c8', { inner: true }); }); break;
        case 'headphones': det(z, () => { g.strokeStyle = b; g.lineWidth = lw(5); g.beginPath(); g.ellipse(hxo, HY, HW * 1.1, HR * 1.08, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }); if (side) add(z + 0.01, RR(hxo + HW * 0.1, HY - HR * 0.15, 0.06, 0.09, 0.025), a); else [-1, 1].forEach((d) => add(z + 0.01, RR(d * HW * 1.08 - 0.03, HY - HR * 0.15, 0.06, 0.09, 0.025), a)); break;
      }
    }

    // ================= RENDER =================
    parts.sort((p1, p2) => p1.z - p2.z);
    // pass 1: one dark outline around the whole silhouette
    g.save(); g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 0.024;
    for (const p of parts) if (p.path && !p.inner) { g.fill(p.path, p.evenodd ? 'evenodd' : 'nonzero'); g.stroke(p.path); }
    g.restore();
    // pass 2: painted fills and details, in depth order
    for (const p of parts) {
      if (p.fn) { p.fn(); continue; }
      let col = p.col; if (p.far) col = tone(col, -0.22);
      const fr = p.evenodd ? 'evenodd' : 'nonzero';
      g.save();
      const gr = g.createLinearGradient(-0.3, -0.05, 0.25, 0.75);
      const k = p.mat === 'metal' ? 1.4 : p.mat === 'skin' ? 0.7 : 1;
      gr.addColorStop(0, tone(col, 0.2 * k)); gr.addColorStop(0.45, col); gr.addColorStop(1, tone(col, -0.32 * k));
      g.fillStyle = gr; g.fill(p.path, fr);
      g.clip(p.path, fr);
      // form shadow on the far side and a soft occlusion under overlapping layers
      const sh = g.createLinearGradient(-0.12, 0, 0.3, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(12,8,4,.32)');
      g.fillStyle = sh; g.fillRect(-1, -1, 2, 3);
      if (p.mat === 'metal') { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-1, -1, 0.97, 3); }
      if (p.glow) { g.fillStyle = 'rgba(255,255,240,.35)'; g.fillRect(-1, -1, 2, 3); }
      g.restore();
      if (p.inner) { g.save(); g.strokeStyle = 'rgba(18,10,6,.6)'; g.lineWidth = 0.007; g.stroke(p.path); g.restore(); }
    }
    g.restore();
  };
})();
