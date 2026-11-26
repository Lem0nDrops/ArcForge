/* Automata: ArcForge — the pilot avatar.
   A detailed adventurer drawn from base features (body, skin, hair, eyes) plus every item worn.
   Change an item and the character changes with it. */
(function () {
  const AF = (window.AF = window.AF || {});

  const L = (AF.LOOK = {
    skin: ['#fde0c8', '#f2c8a2', '#d9a074', '#b07448', '#7c4c2c', '#523020'],
    hairColor: ['#2a1e1a', '#5a3a24', '#9a5a2a', '#e0a840', '#f4e0a0', '#c83a2a', '#ff7ab8', '#4a8ce8', '#5ac878', '#e8ecf4', '#8a5ad8', '#3a3a4a'],
    eyeColor: ['#3a2a20', '#2a5ad8', '#2a9a5a', '#8a4ad8', '#d8402a', '#e0a020'],
    hair: ['Swoop', 'Spiky', 'Messy', 'Bob', 'Long', 'Ponytail', 'Twin tails', 'Bun', 'Mohawk', 'Curly', 'Braid', 'Undercut', 'Top-knot', 'Crop', 'Wavy', 'Locs'],
    eyes: ['Classic', 'Sparkle', 'Sleepy', 'Sharp', 'Dot'],
    beard: ['None', 'Stubble', 'Mustache', 'Goatee', 'Short beard', 'Full beard', 'Long beard', 'Braided beard'],
    build: ['Slim', 'Average', 'Broad'],
    brows: ['Natural', 'Thick', 'Thin', 'Arched', 'Raised', 'Angry', 'None'],
    nose: ['Button', 'Straight', 'Broad', 'Pointed', 'Hooked'],
    mouth: ['Smile', 'Neutral', 'Grin', 'Smirk', 'Frown', 'Open'],
    ears: ['Round', 'Pointed', 'Long'],
    marks: ['None', 'Freckles', 'Scar', 'Cheek scar', 'War paint', 'Beauty mark'],
    core: [['#ffd75e', 'Solar'], ['#5ef2e1', 'Arc blue'], ['#ff6b5c', 'Ember'], ['#7ee08a', 'Toxic'], ['#c27bff', 'Void'], ['#7fb8ff', 'Glacier'], ['#ff9ad5', 'Bubblegum'], ['#ffffff', 'Starlight']],
  });
  AF.defaultLook = (body) => ({ name: '', body: body || 'f', build: 1, skin: 1, hair: body === 'm' ? 0 : 5, hairColor: 2, eyes: 0, eyeColor: 0, core: 1 });
  // Colours can be a list index (older saves, NPCs) or any '#rrggbb' picked in the creator.
  const HEXLIST = { skin: () => L.skin, hairColor: () => L.hairColor, eyeColor: () => L.eyeColor };
  AF.lookHex = function (look, field) {
    const v = look && look[field];
    if (typeof v === 'string' && v[0] === '#') return v;
    const list = HEXLIST[field](); return list[Math.max(0, Math.min(list.length - 1, v || 0))];
  };
  // Body shape 0 (broad-shouldered) .. 1 (narrow-waisted). Older looks only have body 'm'/'f'.
  AF.lookShape = (look) => (look && look.shape != null ? +look.shape : look && look.body === 'f' ? 1 : 0);
  // Skin tone slider 0..1 walks the skin ramp smoothly.
  AF.skinAt = function (t) {
    const r = L.skin, x = Math.max(0, Math.min(1, t)) * (r.length - 1), i = Math.min(r.length - 2, Math.floor(x)), f = x - i;
    const a = r[i], b = r[i + 1], h = (c, k) => parseInt(c.slice(1 + k * 2, 3 + k * 2), 16);
    return '#' + [0, 1, 2].map((k) => Math.round(h(a, k) + (h(b, k) - h(a, k)) * f).toString(16).padStart(2, '0')).join('');
  };
  AF.randomLook = function () {
    const r = Math.random, p = (n) => Math.floor(r() * n), shape = r() < 0.5 ? r() * 0.35 : 0.65 + r() * 0.35, fem = shape >= 0.5;
    const hsl = (h, s, l) => { s /= 100; l /= 100; const f = (n) => { const k = (n + h / 30) % 12, c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); };
    const natural = r() < 0.75;
    return { name: '', body: fem ? 'f' : 'm', shape: +shape.toFixed(2), build: +(r() * 2).toFixed(2), height: +r().toFixed(2), headSize: +(0.3 + r() * 0.4).toFixed(2),
      skin: AF.skinAt(r()), hair: p(L.hair.length), hairColor: natural ? hsl(20 + r() * 25, 30 + r() * 50, 12 + r() * 60) : hsl(r() * 360, 55 + r() * 30, 40 + r() * 25),
      eyes: p(L.eyes.length), eyeColor: hsl(r() * 360, 40 + r() * 40, 30 + r() * 25), core: p(L.core.length),
      beard: !fem && r() < 0.6 ? p(L.beard.length) : 0, brows: p(L.brows.length - 1), nose: p(L.nose.length), mouth: r() < 0.5 ? 0 : p(L.mouth.length),
      ears: r() < 0.8 ? 0 : p(L.ears.length), marks: r() < 0.6 ? 0 : p(L.marks.length), lashes: fem, lips: fem && r() < 0.7, blush: r() < 0.7 };
  };
  // NPC helper: base features + a list of worn item ids.
  AF.npcLook = (o, items) => { const out = {}; (items || []).forEach((id) => { const it = AF.ITEMS[id]; if (it && it.slot !== 'charm') out[it.slot] = id; }); return Object.assign({ name: '', body: 'm', skin: 1, hair: 0, hairColor: 1, eyes: 0, eyeColor: 0, core: 1 }, o, { outfit: out }); };
  AF.coreColor = (look) => { const v = look && look.core; return typeof v === 'string' && v[0] === '#' ? v : L.core[Math.max(0, Math.min(L.core.length - 1, v || 0))][0]; };
  const mix = (c, a) => (typeof c === 'string' ? AF.shadeHex(c, a) : c);
  // Darker, earthier palette: pull every clothing colour toward a weathered brown and drop the brightness.
  const MUTE = {};
  AF.mute = function (c, k) {
    if (!c || c[0] !== '#') return c;
    k = k == null ? 0.32 : k;
    const key = c + k; if (MUTE[key]) return MUTE[key];
    const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255, l = 0.3 * r + 0.59 * gg + 0.11 * b;
    const ch = (v, t) => Math.round(((v * (1 - k) + (l * 0.55 + t * 0.45) * k)) * 0.88);
    const out = '#' + [ch(r, 112), ch(gg, 96), ch(b, 78)].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    return (MUTE[key] = out);
  };

  // ---------- Drawing ----------
  // A detailed, ~3-heads-tall adventurer. Everything worn is drawn on the body, with shading, folds and trim.
  // cx = centre x, fy = feet y, H = height in px. phase advances π per tile walked.
  AF.drawPilotAt = function (g, cx, fy, H, look, dir, phase, opt) {
    opt = opt || {};
    const out = look.outfit || {}, V = (k) => { const v = out[k] && AF.ITEMS[out[k]] && AF.ITEMS[out[k]].vis; return v ? { s: v.s, a: AF.mute(v.a, 0.28), b: AF.mute(v.b, 0.28) } : null; };
    const hat = V('hat'), face = V('face'), shoes = V('shoes'), gloves = V('gloves'), cape = V('cape'), tool = V('tool');
    const top = V('top') || { s: 'tunic', a: '#9a8a6a', b: '#4a3422' }, bot = V('bottom') || { s: 'pants', a: '#4e4232', b: '#2e261c' };
    g.save();
    let flip = 1;
    if (dir === 'right') { g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); dir = 'left'; flip = -1; }
    g.translate(cx, fy - H); g.scale(H, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const OL = '#1a120c', LW = Math.max(0.0055, 0.85 / H);
    g.strokeStyle = OL; g.lineWidth = LW;
    const sk = AF.lookHex(look, 'skin'), skD = mix(sk, -34), hc = AF.mute(AF.lookHex(look, 'hairColor'), 0.22), ec = AF.lookHex(look, 'eyeColor');
    const fem = AF.lookShape(look) >= 0.5, side = dir === 'left', back = dir === 'up', front = !side && !back;
    const moving = !!opt.moving, s1 = Math.sin(phase || 0), t = opt.t || 0;
    // ---- tiny drawing kit ----
    const P = () => g.beginPath();
    const stroke = (c, w, a) => { g.save(); g.strokeStyle = c || OL; g.lineWidth = w || LW; if (a != null) g.globalAlpha = a; g.stroke(); g.restore(); };
    // outlines take a deep shade of the fill (no flat black ink)
    const fs = (c, st) => { g.fillStyle = c; g.fill(); if (st !== false) { g.strokeStyle = typeof c === 'string' ? mix(c, -64) : c && c._b ? mix(c._b, -64) : OL; g.stroke(); g.strokeStyle = OL; } };
    const poly = (pts, c, st) => { P(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); fs(c, st); };
    const rr = (x, y, w, h, r, c, st) => { P(); g.roundRect(x, y, w, h, r); fs(c, st); };
    const el = (x, y, rx, ry, c, st) => { P(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, 7); fs(c, st); };
    const ln = (pts, c, w, a) => { P(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); stroke(c, w, a); };
    const qd = (x0, y0, qx, qy, x1, y1, c, w, a) => { P(); g.moveTo(x0, y0); g.quadraticCurveTo(qx, qy, x1, y1); stroke(c, w, a); };
    const cyl = (c, x0, x1, k) => { if (typeof c !== 'string') return c; const gr = g.createLinearGradient(x0, 0, x1, 0); k = k || 1; gr.addColorStop(0, mix(c, 8 * k)); gr.addColorStop(0.18, mix(c, 24 * k)); gr.addColorStop(0.4, c); gr.addColorStop(0.6, c); gr.addColorStop(0.66, mix(c, -22 * k)); gr.addColorStop(1, mix(c, -36 * k)); gr._b = c; return gr; };
    const vg = (c, y0, y1) => { if (typeof c !== 'string') return c; const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, mix(c, 14)); gr.addColorStop(1, mix(c, -30)); gr._b = c; return gr; };
    const fold = (pts, a) => ln(pts, '#000', LW * 0.9, a == null ? 0.28 : a);
    const hi = (pts, a) => ln(pts, '#fff', LW * 0.9, a == null ? 0.16 : a);
    const metal = (c, x0, x1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, mix(c, 40)); gr.addColorStop(0.3, mix(c, 10)); gr.addColorStop(0.55, mix(c, -25)); gr.addColorStop(0.8, mix(c, 12)); gr.addColorStop(1, mix(c, -40)); gr._b = c; return gr; };

    // ---- proportions ----
    const BI = look.build == null ? 1 : Math.max(0, Math.min(2, Math.round(+look.build))), BS = [0.9, 1, 1.15][BI], BW = [0.86, 1, 1.2][BI], BL = [0.88, 1, 1.16][BI];
    const HY = 0.18, HRX = side ? 0.112 : 0.117, HRY = 0.134;           // head centre and radii
    const SY = 0.34, SW = (fem ? 0.122 : 0.142) * BS;                            // shoulder line, half-width
    const WY = 0.56, WW = (fem ? 0.083 : 0.098) * BW, HIP = 0.6, HW = (fem ? 0.112 : 0.104) * (BW * 0.5 + 0.5); // waist and hip
    const LEG = 0.38, KNEE = 0.19;                                         // hip-to-sole, hip-to-knee
    const tw = side ? 0.62 : 1;                                            // torso squash in profile
    const hx = side ? -0.008 : 0;

    // ground shadow
    g.fillStyle = 'rgba(8,6,4,.38)'; P(); g.ellipse(0, 0.99, side ? 0.13 : 0.16, 0.026, 0, 0, 7); g.fill();
    // ===== rig: two-bone legs and arms, a real walk cycle =====
    const hipY = HIP - 0.01, legW = (fem ? 0.045 : 0.049) * BL, LT = 0.185, LS = 0.178, ANK = 0.028;
    const bareLeg = bot.s === 'shorts' || bot.s === 'skirt';
    const robeLong = top.s === 'robe';
    // capsule between two joints, shaded across its width (lit from the upper left)
    function cap(x0, y0, x1, y1, w0, w1, col) {
      const dx = x1 - x0, dy = y1 - y0, L0 = Math.hypot(dx, dy) || 1e-6, nx = -dy / L0, ny = dx / L0, ang = Math.atan2(dy, dx);
      const bul = 1.06, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, wm = ((w0 + w1) / 2) * bul;
      P(); g.moveTo(x0 + nx * w0, y0 + ny * w0); g.quadraticCurveTo(mx + nx * wm, my + ny * wm, x1 + nx * w1, y1 + ny * w1);
      g.arc(x1, y1, w1, ang + Math.PI / 2, ang - Math.PI / 2, true);
      g.quadraticCurveTo(mx - nx * wm, my - ny * wm, x0 - nx * w0, y0 - ny * w0);
      g.arc(x0, y0, w0, ang - Math.PI / 2, ang + Math.PI / 2, true); g.closePath();
      if (typeof col === 'string') { const s0 = nx < 0 ? 1 : -1, gr = g.createLinearGradient(mx + nx * wm * s0, my + ny * wm * s0, mx - nx * wm * s0, my - ny * wm * s0);
        gr.addColorStop(0, mix(col, 20)); gr.addColorStop(0.42, col); gr.addColorStop(0.6, col); gr.addColorStop(0.66, mix(col, -22)); gr.addColorStop(1, mix(col, -36)); gr._b = col; fs(gr); }
      else fs(col);
    }
    const lerp = (a, b, k) => a + (b - a) * k;
    // gait: phase p for the left leg, p+π for the right
    function legPose(p) {
      if (!moving) return { a1: 0.02, bend: 0.05 };
      const sw = Math.cos(p);
      return { a1: 0.34 * Math.sin(p), bend: 0.07 + 0.62 * Math.max(0, sw) * (0.6 + 0.4 * Math.max(0, Math.sin(p + 0.6))) };
    }
    function legJoints(hipX, pose) {
      const a2 = pose.a1 - pose.bend, fwd = side ? -1 : 0;
      // front/back views can't show the stride, so the swinging knee lifts (foreshortened) instead
      const f1 = side ? pose.a1 : pose.a1 * 1.7, f2 = side ? a2 : f1 - pose.bend * 1.25;
      const kx = hipX + fwd * Math.sin(pose.a1) * LT, ky = hipY + Math.cos(f1) * LT;
      const ax = kx + fwd * Math.sin(a2) * LS, ay = ky + Math.cos(f2) * LS;
      return { kx, ky, ax, ay, a2 };
    }
    const PL = legPose(phase || 0), PR = legPose((phase || 0) + Math.PI);
    const LX = side ? 0 : fem ? 0.048 : 0.054;
    const JL = legJoints(side ? 0.0 : -LX, PL), JR = legJoints(side ? 0.0 : LX, PR);
    const full = hipY + LT + LS, drop = full - Math.max(JL.ay, JR.ay);
    g.translate(0, drop * 0.75 + (moving ? 0.004 : Math.sin(t / 800) * 0.002));

    // ===== back layer (capes, packs, wings) — in back view these go on top later =====
    const sway = moving ? Math.sin((phase || 0) - 1.0) * 0.028 + (side ? 0.025 : 0) : Math.sin(t / 900) * 0.008;
    const hairSw = moving ? Math.sin((phase || 0) - 1.3) * 0.016 + (side ? 0.018 : 0) : Math.sin(t / 1100) * 0.003;
    function backGear(onTop) {
      if (!cape) return;
      const a = cape.a, b = cape.b;
      switch (cape.s) {
        case 'cloak': case 'cape': {
          const long = cape.s === 'cloak' ? 0.94 : 0.86, w0 = SW * tw + 0.015, w1 = (SW + 0.07) * tw;
          if (onTop) { // back view: full drape with folds and hood
            poly([[-w0, SY - 0.01], [w0, SY - 0.01], [w1 + sway, long], [-w1 + sway, long]], vg(a, SY, long));
            for (let i = -2; i <= 2; i++) fold([[i * 0.035, SY + 0.08], [i * 0.05 + sway, long - 0.02]], 0.3);
            if (cape.s === 'cloak' && !hat) { P(); g.ellipse(hx, SY - 0.005, 0.1, 0.06, 0, 0, Math.PI); fs(mix(a, -12)); fold([[-0.07, SY + 0.02], [0, SY + 0.05], [0.07, SY + 0.02]]); }
            rr(-w1 + sway - 0.002, long - 0.02, (w1) * 2, 0.022, 0.006, b, false);
          } else if (side) {
            poly([[0.0, SY - 0.01], [0.06, SY - 0.01], [0.14 + sway * 2, long], [0.02 + sway, long - 0.01]], vg(mix(a, -10), SY, long));
            fold([[0.05, SY + 0.1], [0.1 + sway, long - 0.03]]);
          } else {
            poly([[-w0, SY], [w0, SY], [w1 + 0.01, long - 0.02], [-w1 - 0.01, long - 0.02]], vg(mix(a, -22), SY, long));
          }
          break;
        }
        case 'wings': {
          if (!onTop && back) return;
          const wing = (d) => {
            P(); g.moveTo(d * 0.05, SY + 0.04); g.bezierCurveTo(d * 0.25, SY - 0.12 + sway, d * 0.42, SY - 0.08, d * 0.44, SY + 0.02); g.quadraticCurveTo(d * 0.33, SY + 0.06, d * 0.36, SY + 0.16); g.quadraticCurveTo(d * 0.22, SY + 0.12, d * 0.06, SY + 0.14); g.closePath(); fs(vg(a, SY - 0.1, SY + 0.16));
            for (let i = 0; i < 3; i++) qd(d * 0.08, SY + 0.06 + i * 0.025, d * 0.25, SY - 0.02 + i * 0.03, d * (0.4 - i * 0.03), SY + 0.02 + i * 0.05, mix(b, -10), LW * 1.2, 0.8);
          };
          if (side) wing(1); else { wing(-1); wing(1); }
          break;
        }
        case 'backpack': {
          if (onTop) { rr(-0.1, SY + 0.02, 0.2, 0.2, 0.035, vg(a, SY, SY + 0.22)); rr(-0.08, SY + 0.1, 0.16, 0.08, 0.02, mix(a, -14)); rr(-0.015, SY + 0.1, 0.03, 0.04, 0.006, b); rr(-0.11, SY - 0.005, 0.22, 0.05, 0.02, mix(b, -10)); fold([[-0.07, SY + 0.05], [0.07, SY + 0.05]]); }
          else if (side) { rr(0.04, SY + 0.0, 0.1, 0.21, 0.03, vg(a, SY, SY + 0.21)); rr(0.07, SY + 0.12, 0.08, 0.07, 0.015, mix(a, -14)); }
          break;
        }
        case 'jetpack': {
          const flame = moving && Math.floor(t / 70) % 2;
          if (onTop) { [-1, 1].forEach((d) => { rr(d * 0.065 - 0.045, SY, 0.09, 0.22, 0.04, metal(a, d * 0.065 - 0.045, d * 0.065 + 0.045)); rr(d * 0.065 - 0.035, SY + 0.21, 0.07, 0.03, 0.01, '#2a2622'); if (moving) el(d * 0.065, SY + 0.27 + flame * 0.01, 0.022, 0.035, '#ff9a30', false); }); rr(-0.03, SY + 0.06, 0.06, 0.08, 0.01, b); }
          else if (side) { rr(0.04, SY, 0.09, 0.22, 0.04, metal(a, 0.04, 0.13)); if (moving) el(0.085, SY + 0.26, 0.02, 0.035, '#ff9a30', false); }
          else { [-1, 1].forEach((d) => rr(d * (SW + 0.02) - 0.025, SY - 0.03, 0.05, 0.1, 0.02, metal(a, d * (SW + 0.02) - 0.025, d * (SW + 0.02) + 0.025))); }
          break;
        }
        case 'scarf': if (!onTop && (side || back)) { P(); g.moveTo(0.02, SY - 0.005); g.quadraticCurveTo(0.12 + sway, SY + 0.04, 0.17 + sway * 2, SY + 0.14); g.lineTo(0.13 + sway * 2, SY + 0.16); g.quadraticCurveTo(0.08, SY + 0.07, 0.0, SY + 0.03); g.closePath(); fs(a); } break;
      }
    }
    if (!back) backGear(false);

    // ===== hair behind the head =====
    const hs = (() => {
      const h = L.hair[look.hair || 0];
      const tight = hat && ['beanie', 'chef', 'hardhat', 'miner', 'knight', 'bandana', 'aviator', 'tophat', 'wizard', 'cowboy', 'beret', 'visorcap', 'cap', 'hood', 'kettle'].includes(hat.s);
      return tight && ['Spiky', 'Mohawk', 'Bun', 'Curly', 'Messy'].includes(h) ? 'Swoop' : h;
    })();
    const hairG = (y0, y1) => { const gr = g.createLinearGradient(-0.1, y0, 0.1, y1); gr.addColorStop(0, mix(hc, 26)); gr.addColorStop(0.5, hc); gr.addColorStop(1, mix(hc, -34)); return gr; };
    const strands = (x0, y0, x1, y1, n, len) => { for (let i = 0; i < n; i++) { const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y = y0 + ((y1 - y0) * i) / Math.max(1, n - 1); qd(x, y, x + 0.004, y + len * 0.5, x - 0.004, y + len, mix(hc, -45), LW * 0.8, 0.55); } };
    if (!back && !(hat && hat.s === 'hood')) {
      if (hs === 'Long') { P(); g.moveTo(hx - 0.12, HY - 0.04); g.quadraticCurveTo(hx - 0.15, HY + 0.2, hx - 0.11 + hairSw, HY + 0.33); g.lineTo(hx + 0.11 + hairSw, HY + 0.33); g.quadraticCurveTo(hx + 0.15, HY + 0.2, hx + 0.12, HY - 0.04); g.closePath(); fs(hairG(HY, HY + 0.33)); strands(hx - 0.1, HY + 0.12, hx + 0.1, HY + 0.12, 7, 0.18); }
      if (hs === 'Bob') { P(); g.moveTo(hx - 0.125, HY - 0.03); g.quadraticCurveTo(hx - 0.14, HY + 0.1, hx - 0.105, HY + 0.13); g.lineTo(hx + 0.105, HY + 0.13); g.quadraticCurveTo(hx + 0.14, HY + 0.1, hx + 0.125, HY - 0.03); g.closePath(); fs(hairG(HY, HY + 0.13)); }
      if (hs === 'Twin tails') { const tt = (x) => { P(); g.moveTo(x, HY - 0.02); g.bezierCurveTo(x + Math.sign(x) * 0.09, HY + 0.05, x + Math.sign(x) * 0.07, HY + 0.22, x + Math.sign(x) * 0.02 + hairSw, HY + 0.3); g.bezierCurveTo(x - Math.sign(x) * 0.01, HY + 0.2, x + Math.sign(x) * 0.0, HY + 0.08, x, HY - 0.02); fs(hairG(HY, HY + 0.3)); strands(x + Math.sign(x) * 0.03, HY + 0.06, x + Math.sign(x) * 0.04, HY + 0.08, 3, 0.15); }; if (side) tt(0.1); else { tt(-0.115); tt(0.115); } }
      if (hs === 'Ponytail' && side) { P(); g.moveTo(0.08, HY - 0.07); g.bezierCurveTo(0.2, HY - 0.04, 0.2 + hairSw, HY + 0.12, 0.15 + hairSw * 1.6, HY + 0.24); g.bezierCurveTo(0.11, HY + 0.12, 0.11, HY + 0.0, 0.06, HY - 0.02); fs(hairG(HY, HY + 0.24)); strands(0.14, HY, 0.15, HY + 0.04, 3, 0.15); }
      if (hs === 'Wavy') { P(); g.moveTo(hx - 0.125, HY - 0.04); for (let i = 0; i <= 6; i++) g.quadraticCurveTo(hx - 0.15 + (i % 2) * 0.02, HY + i * 0.05, hx - 0.135 + (i % 2 ? 0.0 : 0.01) + hairSw * i / 6, HY + 0.02 + i * 0.05); g.lineTo(hx + 0.12 + hairSw, HY + 0.32); for (let i = 6; i >= 0; i--) g.quadraticCurveTo(hx + 0.15 - (i % 2) * 0.02 + hairSw * i / 6, HY + i * 0.05, hx + 0.13, HY - 0.02 + i * 0.05); g.closePath(); fs(hairG(HY, HY + 0.32)); strands(hx - 0.1, HY + 0.12, hx + 0.1, HY + 0.12, 6, 0.16); }
      if (hs === 'Locs') for (let i = -4; i <= 4; i++) { if (!i) continue; const x0 = hx + i * 0.028; P(); g.moveTo(x0 - 0.011, HY - 0.02); g.quadraticCurveTo(x0 + hairSw, HY + 0.12, x0 + hairSw * 1.5, HY + 0.24 - Math.abs(i) * 0.012); g.lineTo(x0 + 0.013 + hairSw * 1.5, HY + 0.24 - Math.abs(i) * 0.012); g.quadraticCurveTo(x0 + 0.012 + hairSw, HY + 0.12, x0 + 0.011, HY - 0.02); g.closePath(); fs(hairG(HY, HY + 0.24)); }
      if (hs === 'Braid' && side) { for (let i = 0; i < 7; i++) el(0.07 + i * 0.006 + hairSw * i / 4, HY + 0.02 + i * 0.038, 0.022 - i * 0.0012, 0.024, hairG(HY, HY + 0.3)); }
      if (hs === 'Curly') for (let i = 0; i < 8; i++) { const a2 = Math.PI * (0.05 + i * 0.13); el(hx + Math.cos(a2) * 0.12 * (i < 4 ? 1 : -1), HY + 0.02 + Math.sin(a2) * 0.06, 0.035, 0.035, hairG(HY - 0.03, HY + 0.08)); }
    }

    function leg(hipX, J, far) {
      const c = (k) => (far ? mix(k, -24) : k);
      const legC = bareLeg ? sk : bot.a, shinC = bareLeg || bot.s === 'shorts' ? sk : bot.a;
      const fwd = side ? -1 : 0, footY = J.ay + ANK;
      // shin, then thigh over the knee
      cap(J.kx, J.ky, J.ax, J.ay, legW * 0.78, legW * 0.6, c(shinC));
      cap(hipX, hipY, J.kx, J.ky, legW * 1.02, legW * 0.8, c(legC));
      if (bot.s === 'shorts') { const kx2 = lerp(hipX, J.kx, 0.85), ky2 = lerp(hipY, J.ky, 0.85); cap(hipX, hipY, kx2, ky2, legW * 1.08, legW * 0.92, c(bot.a)); }
      if (!bareLeg) {
        fold([[J.kx - legW * 0.5, J.ky - 0.012], [J.kx + legW * 0.3, J.ky + 0.004]], 0.3);
        fold([[lerp(hipX, J.kx, 0.4) - legW * 0.3, lerp(hipY, J.ky, 0.4)], [lerp(hipX, J.kx, 0.55) + legW * 0.2, lerp(hipY, J.ky, 0.5)]], 0.18);
        if (bot.s === 'cargo' && !far) { const px = lerp(hipX, J.kx, 0.55) - legW * 0.85, py = lerp(hipY, J.ky, 0.55) - 0.02; rr(px, py, legW * 0.8, 0.045, 0.008, mix(bot.a, -10)); ln([[px, py + 0.012], [px + legW * 0.8, py + 0.012]], OL, LW * 0.7, 0.4); }
        if (bot.s === 'checker' && !far) { g.save(); P(); g.rect(Math.min(hipX, J.ax) - legW, hipY, legW * 2 + Math.abs(hipX - J.ax), J.ay - hipY); g.clip(); g.globalAlpha = 0.4; g.fillStyle = bot.b; for (let yy = hipY; yy < J.ay; yy += 0.026) for (let xx = hipX - 0.08 + ((yy / 0.026) % 2) * 0.013; xx < hipX + 0.08; xx += 0.026) g.fillRect(xx, yy, 0.013, 0.013); g.restore(); }
        if (bot.s === 'greaves') { cap(lerp(J.kx, J.ax, 0.1), lerp(J.ky, J.ay, 0.1), lerp(J.kx, J.ax, 0.8), lerp(J.ky, J.ay, 0.8), legW * 0.84, legW * 0.7, c(metal(mix(bot.a, 12), J.kx - legW, J.kx + legW))); el(J.kx, J.ky, legW * 0.85, legW * 0.7, c(metal(mix(bot.a, 20), J.kx - legW, J.kx + legW))); }
      } else qd(J.kx - legW * 0.4, J.ky - 0.004, J.kx, J.ky + 0.01, J.kx + legW * 0.4, J.ky - 0.004, skD, LW, 0.45);
      // boots: cover the lower shin
      const fl = side ? 0.078 : 0.05, toe = side ? fwd : 0;
      const shoeTop = (k) => [lerp(J.kx, J.ax, k), lerp(J.ky, J.ay, k)];
      if (shoes && (shoes.s === 'boots' || shoes.s === 'rocket')) {
        const [bx0, by0] = shoeTop(0.32);
        cap(bx0, by0, J.ax, J.ay, legW * 0.86, legW * 0.72, c(shoes.s === 'rocket' ? metal(shoes.a, bx0 - legW, bx0 + legW) : shoes.a));
        const cuffAng = Math.atan2(J.ay - J.ky, J.ax - J.kx);
        g.save(); g.translate(bx0, by0); g.rotate(cuffAng - Math.PI / 2); rr(-legW * 0.95, -0.012, legW * 1.9, 0.024, 0.008, c(mix(shoes.a, shoes.s === 'rocket' ? -12 : 16))); g.restore();
        if (shoes.s === 'boots' && !far && !side) for (let i = 0; i < 3; i++) { const [lx, ly] = shoeTop(0.45 + i * 0.15); ln([[lx - legW * 0.3, ly], [lx + legW * 0.3, ly + 0.01]], mix(shoes.b, 12), LW * 0.9, 0.7); }
        if (shoes.s === 'rocket') { const [rx, ry] = shoeTop(0.6); ln([[rx - legW * 0.7, ry], [rx + legW * 0.7, ry]], shoes.b, LW * 2.4, 0.9); }
      }
      // foot
      const fc = shoes ? shoes.a : sk, sole = shoes ? mix(shoes.b, -34) : skD;
      if (side) {
        P(); g.moveTo(J.ax + 0.03, footY); g.lineTo(J.ax + toe * fl, footY); g.quadraticCurveTo(J.ax + toe * (fl + 0.008), footY - 0.03, J.ax + toe * fl * 0.35, footY - 0.036); g.quadraticCurveTo(J.ax - 0.0, footY - 0.05, J.ax + 0.03, footY - 0.03); g.closePath(); fs(c(cyl(fc, J.ax - fl, J.ax + 0.03)));
        if (shoes) ln([[J.ax + 0.03, footY - 0.004], [J.ax + toe * fl, footY - 0.004]], c(sole), LW * 2.2);
      } else {
        P(); g.moveTo(J.ax - fl * 0.95, footY); g.quadraticCurveTo(J.ax - fl, footY - 0.045, J.ax - fl * 0.2, footY - 0.042); g.lineTo(J.ax + fl * 0.2, footY - 0.042); g.quadraticCurveTo(J.ax + fl, footY - 0.045, J.ax + fl * 0.95, footY); g.closePath(); fs(c(cyl(fc, J.ax - fl, J.ax + fl)));
        if (shoes) rr(J.ax - fl * 0.95, footY - 0.012, fl * 1.9, 0.014, 0.005, c(sole), false);
        if (shoes && shoes.s === 'flats' && !far) el(J.ax, footY - 0.03, 0.009, 0.006, shoes.b, false);
        if (shoes && shoes.s === 'sneakers' && !far) ln([[J.ax - fl * 0.4, footY - 0.026], [J.ax + fl * 0.4, footY - 0.026]], mix(shoes.b, 18), LW, 0.6);
      }
      if (shoes && shoes.s === 'rocket' && moving) el(J.ax, footY + 0.02, 0.02, 0.028, '#ffb040', false);
    }
    // the leg further from us goes first
    if (side) { const lFar = Math.sin(phase || 0) < 0; leg(0, lFar ? JL : JR, true); leg(0, lFar ? JR : JL, false); }
    else { leg(-LX, JL, false); leg(LX, JR, false); }
    if (bot.s === 'skirt' && !robeLong) {
      P(); g.moveTo(-WW * tw, WY); g.lineTo(WW * tw, WY); g.quadraticCurveTo((HW + 0.06) * tw, HIP + 0.08, (HW + 0.065) * tw, HIP + 0.15); g.quadraticCurveTo(0, HIP + 0.175, -(HW + 0.065) * tw, HIP + 0.15); g.quadraticCurveTo(-(HW + 0.06) * tw, HIP + 0.08, -WW * tw, WY); g.closePath(); fs(vg(bot.a, WY, HIP + 0.16));
      for (let i = -2; i <= 2; i++) fold([[i * 0.03 * tw, WY + 0.02], [i * 0.055 * tw, HIP + 0.15]], 0.25);
      qd(-(HW + 0.06) * tw, HIP + 0.14, 0, HIP + 0.168, (HW + 0.06) * tw, HIP + 0.14, bot.b, LW * 2, 0.8);
    }

    // ===== arms =====
    const sleeveCol = ({ vest: '#a89a7a', overalls: '#9a8e74', apron: '#a89878', jerkin: '#8a7c62', armor: '#4a4038', tee: top.a, dress: top.a })[top.s] || top.a;
    const shortSleeve = ['tee', 'dress'].includes(top.s);
    const wideSleeve = top.s === 'robe';
    const A1 = 0.122, A2 = 0.112;
    function handAt(x, y, ang, far, grip) {
      const c = (k) => (far ? mix(k, -22) : k);
      g.save(); g.translate(x, y); g.rotate(ang);
      if (gloves && gloves.s === 'gauntlets') { cap(0, -0.012, 0, 0.012, 0.03, 0.026, c(metal(gloves.a, -0.03, 0.03))); el(0, 0.03, 0.026, 0.024, c(metal(gloves.a, -0.03, 0.03))); ln([[-0.018, 0.036], [0.018, 0.036]], OL, LW * 0.8, 0.5); }
      else {
        const hc2 = gloves ? gloves.a : sk;
        if (gloves) rr(-0.026, -0.014, 0.052, 0.022, 0.008, c(mix(gloves.b, 8)));
        // palm + fingers (a closed grip or a relaxed hand) and a thumb
        P(); g.moveTo(-0.019, 0.0); g.quadraticCurveTo(-0.024, grip ? 0.03 : 0.04, -0.008, grip ? 0.04 : 0.05); g.quadraticCurveTo(0.012, grip ? 0.044 : 0.052, 0.02, grip ? 0.03 : 0.036); g.quadraticCurveTo(0.024, 0.01, 0.017, 0.0); g.closePath(); fs(c(cyl(hc2, -0.022, 0.022)));
        el(0.02 * (side ? -1 : 1), 0.014, 0.009, 0.014, c(hc2));
        if (!far) { ln([[-0.012, grip ? 0.03 : 0.036], [0.012, grip ? 0.032 : 0.04]], c(mix(hc2, -40)), LW * 0.8, 0.5); }
      }
      g.restore();
    }
    function drawTool(x0, y0, ta) {
      if (!tool) return;
      const a = tool.a, b = tool.b;
      g.save(); g.translate(x0, y0); g.rotate(ta);
      switch (tool.s) {
        case 'sword': rr(-0.012, -0.03, 0.024, 0.06, 0.006, '#3a2818'); rr(-0.045, -0.04, 0.09, 0.016, 0.006, metal(b === '#6a4a2a' ? '#8a7a5a' : b, -0.045, 0.045)); poly([[-0.016, -0.04], [0.016, -0.04], [0.012, -0.33], [0, -0.36], [-0.012, -0.33]], metal('#b8bcc4', -0.016, 0.016)); ln([[0, -0.05], [0, -0.32]], '#fff', LW, 0.35); el(0, 0.035, 0.012, 0.012, '#8a6a32'); break;
        case 'staff': rr(-0.011, -0.42, 0.022, 0.6, 0.01, cyl('#5a3e24', -0.011, 0.011)); el(0, -0.44, 0.032, 0.032, b); el(-0.008, -0.452, 0.01, 0.01, '#fff', false); qd(-0.03, -0.41, 0, -0.38, 0.03, -0.41, '#8a6a32', LW * 2); break;
        case 'hammer': rr(-0.01, -0.25, 0.02, 0.28, 0.006, cyl('#5a3e24', -0.01, 0.01)); rr(-0.055, -0.3, 0.11, 0.065, 0.01, metal(a, -0.055, 0.055)); break;
        case 'wrench': rr(-0.012, -0.22, 0.024, 0.24, 0.01, metal(a, -0.012, 0.012)); P(); g.arc(0, -0.235, 0.035, 0.6, Math.PI * 2 - 0.4); fs(metal(a, -0.035, 0.035)); el(0, -0.255, 0.014, 0.018, '#1a1410', false); break;
        case 'spatula': rr(-0.009, -0.18, 0.018, 0.2, 0.006, '#4a3020'); rr(-0.035, -0.27, 0.07, 0.1, 0.012, metal(b, -0.035, 0.035)); break;
        case 'lantern': ln([[0, 0], [0, 0.03]], '#2a2622', LW * 1.5); rr(-0.03, 0.03, 0.06, 0.085, 0.012, '#2a2622'); rr(-0.022, 0.04, 0.044, 0.06, 0.008, b, false); el(0, 0.07, 0.012, 0.02, '#fff8d0', false); P(); g.moveTo(-0.034, 0.032); g.lineTo(0, 0.012); g.lineTo(0.034, 0.032); fs(a); break;
        case 'tome': rr(-0.045, -0.02, 0.09, 0.11, 0.008, vg(a, -0.02, 0.09)); rr(-0.04, -0.012, 0.012, 0.095, 0.004, '#e8dcc0', false); rr(-0.012, 0.015, 0.035, 0.035, 0.006, b, false); break;
        case 'crossbow': rr(-0.012, -0.12, 0.024, 0.16, 0.006, cyl('#5a3e24', -0.012, 0.012)); qd(-0.09, -0.08, 0, -0.14, 0.09, -0.08, b, LW * 3.5); ln([[-0.09, -0.08], [0, -0.1], [0.09, -0.08]], '#d8d0c0', LW * 0.8); rr(-0.008, -0.17, 0.016, 0.06, 0.004, '#8a8a90'); break;
      }
      g.restore();
    }
    // u: upper-arm swing (forward +), e: elbow bend, d: which side in front/back view (-1 left, +1 right)
    function arm(d, u, e, far, withTool) {
      const c = (k) => (far ? mix(k, -22) : k);
      const sx0 = side ? 0.005 : d * (SW - 0.006), sy0 = SY + 0.016;
      let ex, ey, wx, wy;
      if (side) { ex = sx0 - Math.sin(u) * A1; ey = sy0 + Math.cos(u) * A1; wx = ex - Math.sin(u + e) * A2; wy = ey + Math.cos(u + e) * A2; }
      else { const out = 0.012 + (fem ? 0.0 : 0.004); ex = sx0 + d * out; ey = sy0 + Math.cos(u) * A1; wx = ex + d * (0.004 - e * 0.012); wy = ey + Math.cos(u + e) * A2 * (back ? 1 : 0.98); }
      const holdLong = withTool && tool && ['staff', 'sword', 'crossbow'].includes(tool.s);
      const fAng = Math.atan2(wy - ey, wx - ex) - Math.PI / 2;
      const hx2 = wx + Math.cos(fAng + Math.PI / 2) * 0.012, hy2 = wy + Math.sin(fAng + Math.PI / 2) * 0.012;
      if (holdLong) drawTool(hx2, hy2 + 0.02, tool.s === 'staff' ? 0 : side ? -0.35 : d * 0.25);
      // forearm, then upper arm (with sleeve)
      if (shortSleeve) {
        cap(ex, ey, wx, wy, 0.028 * BL, 0.022 * BL, c(sk));
        cap(sx0, sy0, ex, ey, 0.032 * BL, 0.029 * BL, c(sk));
        cap(sx0, sy0, lerp(sx0, ex, 0.5), lerp(sy0, ey, 0.5), 0.038 * BL, 0.035 * BL, c(sleeveCol));
        qd(ex - 0.012, ey - 0.004, ex, ey + 0.006, ex + 0.012, ey - 0.004, skD, LW, 0.4);
      } else {
        const wide = wideSleeve ? 1.35 : 1;
        cap(ex, ey, wx, wy, 0.03 * BL * (wideSleeve ? 1.1 : 1), 0.026 * BL * wide, c(top.s === 'armor' ? metal('#7a7068', ex - 0.03, ex + 0.03) : sleeveCol));
        cap(sx0, sy0, ex, ey, 0.036 * BL, 0.031 * BL, c(sleeveCol));
        if (['tunic', 'jerkin', 'vest', 'jacket', 'hoodie'].includes(top.s) && !(gloves && gloves.s === 'gauntlets')) { cap(lerp(ex, wx, 0.42), lerp(ey, wy, 0.42), lerp(ex, wx, 0.86), lerp(ey, wy, 0.86), 0.031 * BL, 0.028 * BL, c('#4a3422')); [0.55, 0.75].forEach((k) => { const bx2 = lerp(ex, wx, k), by2 = lerp(ey, wy, k); ln([[bx2 - 0.028 * BL, by2], [bx2 + 0.028 * BL, by2 + 0.004]], c('#8a6a3a'), LW * 1.4, 0.9); }); }
        fold([[ex - 0.02, ey - 0.006], [ex + 0.014, ey + 0.006]], 0.32);
        fold([[lerp(sx0, ex, 0.5) - 0.016, lerp(sy0, ey, 0.5)], [lerp(sx0, ex, 0.5) + 0.012, lerp(sy0, ey, 0.5) + 0.008]], 0.2);
        // cuff
        g.save(); g.translate(lerp(ex, wx, 0.86), lerp(ey, wy, 0.86)); g.rotate(fAng); rr(-0.03 * wide, -0.01, 0.06 * wide, 0.02, 0.007, c(top.s === 'mail' || top.s === 'armor' ? metal(top.a, -0.03, 0.03) : mix(wideSleeve ? top.b : sleeveCol, wideSleeve ? 0 : -16))); g.restore();
        if (top.s === 'mail') { g.save(); P(); g.moveTo(sx0 - 0.04, sy0); g.lineTo(sx0 + 0.04, sy0); g.lineTo(wx + 0.035, wy); g.lineTo(wx - 0.035, wy); g.closePath(); g.clip(); g.globalAlpha = 0.3; for (let yy = sy0; yy < wy; yy += 0.016) for (let xx = Math.min(sx0, wx) - 0.04 + ((yy * 62) % 2) * 0.006; xx < Math.max(sx0, wx) + 0.04; xx += 0.012) { P(); g.arc(xx, yy, 0.006, 0, Math.PI); stroke('#1a1814', LW * 0.6); } g.restore(); }
      }
      handAt(hx2 - Math.cos(fAng + Math.PI / 2) * 0.012, hy2 - Math.sin(fAng + Math.PI / 2) * 0.012, fAng, far, !!withTool && !!tool);
      if (withTool && tool && !holdLong) drawTool(hx2, hy2 + 0.014, tool.s === 'lantern' || tool.s === 'tome' ? 0 : side ? -0.5 : d * 0.45);
      return { sx0, sy0 };
    }
    // arm poses from the gait: each arm swings opposite its leg
    const armPose = (p, holding) => {
      if (holding && tool && ['staff', 'sword', 'crossbow'].includes(tool.s)) return { u: moving ? 0.15 * Math.sin(p) + 0.2 : 0.22, e: 0.75 };
      if (!moving) return { u: 0.03 + Math.sin(t / 800) * 0.015, e: 0.12 + (holding && tool ? 0.25 : 0) };
      const u = -0.5 * Math.sin(p);
      return { u, e: 0.22 + 0.45 * Math.max(0, u) + (holding && tool ? 0.2 : 0) };
    };
    // weight shift: hips sway, shoulders roll, a slight forward lean when walking in profile
    if (moving) {
      g.translate(0, HIP); g.rotate(side ? -0.05 + Math.sin((phase || 0) * 2) * 0.008 : Math.sin(phase || 0) * 0.028); g.translate(side ? 0 : Math.sin(phase || 0) * 0.006, -HIP);
    }
    const nearIsLeft = !(Math.sin(phase || 0) < 0); // the side-view near arm swings with the far leg
    if (side) { const p0 = armPose((phase || 0) + (nearIsLeft ? Math.PI : 0), false); arm(0, -p0.u, p0.e, true, false); }
    if (back) { const pl = armPose(phase || 0, false), pr = armPose((phase || 0) + Math.PI, true); arm(-1, pl.u, pl.e, false, false); arm(1, pr.u, pr.e, false, true); }

    // ===== torso and top =====
    const TX = (v) => v * tw + (side ? 0.0 : 0);
    function torsoPath(y1, flare) {
      P(); g.moveTo(TX(-SW), SY + 0.01);
      g.quadraticCurveTo(TX(-SW - 0.005), SY - 0.012, TX(-SW + 0.03), SY - 0.016);
      g.lineTo(TX(SW - 0.03), SY - 0.016); g.quadraticCurveTo(TX(SW + 0.005), SY - 0.012, TX(SW), SY + 0.01);
      g.quadraticCurveTo(TX(SW - 0.01), SY + 0.12, TX(WW), WY);
      const hsw = y1 > HIP + 0.05 ? (moving ? Math.sin((phase || 0) - 0.8) * 0.014 * (side ? 0.4 : 1) + (side ? 0.016 : 0) : 0) * Math.min(1, (y1 - HIP) / 0.15) : 0;
      g.lineTo(TX(HW + (flare || 0)) + hsw, y1); g.lineTo(TX(-HW - (flare || 0)) + hsw, y1); g.lineTo(TX(-WW), WY);
      g.quadraticCurveTo(TX(-SW + 0.01), SY + 0.12, TX(-SW), SY + 0.01); g.closePath();
    }
    const shirt = ['vest', 'jerkin', 'overalls', 'apron'].includes(top.s) ? '#a89a7a' : null;
    const hemY = { tunic: HIP + 0.07, jerkin: HIP + 0.04, mail: HIP + 0.07, coat: HIP + 0.2, robe: 0.95, dress: HIP + 0.17, apron: HIP + 0.04, armor: HIP + 0.02 }[top.s] || HIP + 0.015;
    const flare = { tunic: 0.025, coat: 0.05, robe: 0.09, dress: 0.08, mail: 0.02 }[top.s] || 0;
    // under-layer: a linen shirt hem peeks out below leather
    if (top.s === 'jerkin' || top.s === 'vest') { torsoPath(HIP + 0.06, 0.02); fs(cyl('#9a8c6c', TX(-SW), TX(SW))); fold([[TX(-0.05), HIP + 0.02], [TX(-0.055), HIP + 0.055]], 0.25); fold([[TX(0.05), HIP + 0.02], [TX(0.055), HIP + 0.055]], 0.25); }
    // base garment
    torsoPath(hemY, flare);
    const baseC = shirt || (top.s === 'armor' ? '#4a4038' : top.a);
    fs(cyl(baseC, TX(-SW), TX(SW)));
    if (!back) {
      // chest/waist folds
      fold([[TX(-0.06), SY + 0.12], [TX(-0.02), SY + 0.15]], 0.2); fold([[TX(0.07), SY + 0.1], [TX(0.04), SY + 0.16]], 0.2);
      hi([[TX(-SW + 0.025), SY + 0.02], [TX(-SW + 0.04), SY + 0.14]], 0.14);
    } else { fold([[0, SY + 0.03], [0, WY - 0.02]], 0.22); fold([[-0.06, SY + 0.05], [-0.05, SY + 0.17]], 0.18); fold([[0.06, SY + 0.05], [0.05, SY + 0.17]], 0.18); }
    const a = top.a, b = top.b;
    switch (top.s) {
      case 'tee': if (front) { P(); g.ellipse(0, SY - 0.01, 0.04, 0.025, 0, 0, Math.PI); stroke(mix(a, -40), LW * 1.3); } break;
      case 'tunic': case 'mail': {
        if (top.s === 'mail') { g.save(); torsoPath(hemY, flare); g.clip(); g.fillStyle = metal(a, TX(-SW), TX(SW)); g.fill(); g.globalAlpha = 0.45; for (let yy = SY; yy < hemY; yy += 0.016) for (let xx = -SW + ((yy * 62) % 2) * 0.006; xx < SW; xx += 0.012) { P(); g.arc(TX(xx), yy, 0.006, 0, Math.PI); stroke('#141210', LW * 0.6); } g.restore(); torsoPath(hemY, flare); stroke(); }
        if (front && top.s === 'tunic') { P(); g.moveTo(-0.035, SY - 0.014); g.lineTo(0, SY + 0.05); g.lineTo(0.035, SY - 0.014); fs(mix(a, -24)); for (let i = 0; i < 3; i++) ln([[-0.012, SY + 0.005 + i * 0.014], [0.012, SY + 0.012 + i * 0.014]], b, LW, 0.8); }
        if (!back) { fold([[TX(-0.06), HIP], [TX(-0.07), hemY - 0.005]], 0.3); fold([[TX(0.02), HIP + 0.005], [TX(0.025), hemY - 0.005]], 0.3); fold([[TX(0.08), HIP], [TX(0.09), hemY - 0.005]], 0.3); }
        rr(TX(-HW - flare), hemY - 0.012, TX(HW + flare) * 2, 0.014, 0.004, mix(top.s === 'mail' ? a : b, -10), false);
        break;
      }
      case 'jerkin': case 'vest': {
        const op = top.s === 'vest' ? 0.025 : 0.0;
        g.save(); torsoPath(hemY, flare); g.clip();
        if (!back) { rr(TX(-SW - 0.02), SY - 0.03, TX(SW) - op * tw + 0.02, hemY - SY + 0.05, 0, cyl(a, TX(-SW), 0), false); rr(op * tw, SY - 0.03, TX(SW) + 0.02, hemY - SY + 0.05, 0, cyl(a, 0, TX(SW)), false); }
        else rr(-SW - 0.02, SY - 0.03, SW * 2 + 0.04, hemY - SY + 0.05, 0, cyl(a, -SW, SW), false);
        g.restore(); torsoPath(hemY, flare); stroke();
        if (front) {
          ln([[-op, SY - 0.01], [-op, hemY]], OL, LW); ln([[op, SY - 0.01], [op, hemY]], OL, LW);
          if (top.s === 'jerkin') for (let i = 0; i < 4; i++) { const yy = SY + 0.03 + i * 0.045; ln([[-0.012, yy], [0.012, yy + 0.015]], '#d8c8a0', LW, 0.8); ln([[0.012, yy], [-0.012, yy + 0.015]], '#d8c8a0', LW, 0.8); }
          [-1, 1].forEach((d) => { for (let i = 0; i < 3; i++) el(d * (op + 0.035), SY + 0.05 + i * 0.05, 0.005, 0.005, '#8a7a5a', false); });
          rr(-0.085, HIP - 0.07, 0.04, 0.035, 0.006, mix(a, -14));
        }
        break;
      }
      case 'hoodie': case 'sweater': {
        if (top.s === 'sweater') { g.save(); torsoPath(hemY, flare); g.clip(); g.fillStyle = b; g.globalAlpha = 0.6; for (let yy = SY + 0.06; yy < hemY; yy += 0.06) g.fillRect(-0.3, yy, 0.6, 0.018); g.restore(); torsoPath(hemY, flare); stroke(); for (let x = -WW; x < WW; x += 0.012) ln([[TX(x), hemY - 0.022], [TX(x), hemY - 0.002]], '#000', LW * 0.6, 0.25); }
        if (top.s === 'hoodie') { if (front) { rr(-0.06, HIP - 0.11, 0.12, 0.06, 0.015, mix(a, -12)); ln([[-0.02, SY], [-0.024, SY + 0.07]], b, LW * 1.2); ln([[0.02, SY], [0.024, SY + 0.07]], b, LW * 1.2); } P(); g.ellipse(hx + (side ? 0.03 : 0), SY - 0.005, side ? 0.06 : 0.085, 0.035, 0, back ? 0 : Math.PI, back ? Math.PI : 0); fs(mix(a, -14)); }
        break;
      }
      case 'overalls': case 'apron': {
        const bibTop = top.s === 'apron' ? SY + 0.04 : SY + 0.06, bw = top.s === 'apron' ? 0.085 : 0.075, low = top.s === 'apron' ? HIP + 0.16 : hemY;
        if (front || side) {
          P(); g.moveTo(TX(-bw), bibTop); g.lineTo(TX(bw), bibTop); g.lineTo(TX(bw + 0.01), WY); g.lineTo(TX(bw + 0.03), low); g.lineTo(TX(-bw - 0.03), low); g.lineTo(TX(-bw - 0.01), WY); g.closePath(); fs(cyl(a, TX(-bw), TX(bw)));
          if (front) { ln([[-bw + 0.01, bibTop], [-SW + 0.04, SY - 0.012]], a, LW * 3); ln([[bw - 0.01, bibTop], [SW - 0.04, SY - 0.012]], a, LW * 3); }
          if (top.s === 'overalls') { el(TX(-bw + 0.015), bibTop + 0.012, 0.007, 0.007, b, false); el(TX(bw - 0.015), bibTop + 0.012, 0.007, 0.007, b, false); rr(TX(-0.03), bibTop + 0.03, 0.06 * tw, 0.04, 0.006, mix(a, -12)); }
          else { rr(TX(-0.04), WY + 0.01, 0.08 * tw, 0.045, 0.008, mix(a, -10)); fold([[TX(-0.04), WY + 0.08], [TX(-0.05), low - 0.01]]); fold([[TX(0.03), WY + 0.08], [TX(0.04), low - 0.01]]); ln([[TX(-bw - 0.03), low - 0.006], [TX(bw + 0.03), low - 0.006]], b, LW * 1.6, 0.8); }
        } else { ln([[-0.06, SY - 0.01], [0.05, WY]], a, LW * 3); ln([[0.06, SY - 0.01], [-0.05, WY]], a, LW * 3); }
        break;
      }
      case 'jacket': case 'coat': {
        if (front) {
          P(); g.moveTo(-0.03, SY - 0.012); g.lineTo(0, SY + 0.07); g.lineTo(0.03, SY - 0.012); fs('#a89a7a');
          P(); g.moveTo(-0.045, SY - 0.015); g.lineTo(-0.008, SY + 0.09); g.lineTo(-0.05, SY + 0.12); g.lineTo(-0.075, SY + 0.0); g.closePath(); fs(mix(top.s === 'coat' ? b : a, -10));
          P(); g.moveTo(0.045, SY - 0.015); g.lineTo(0.008, SY + 0.09); g.lineTo(0.05, SY + 0.12); g.lineTo(0.075, SY + 0.0); g.closePath(); fs(mix(top.s === 'coat' ? b : a, -10));
          ln([[0.004, SY + 0.09], [0.004, hemY]], OL, LW);
          for (let i = 0; i < (top.s === 'coat' ? 4 : 3); i++) el(0.018, SY + 0.11 + i * 0.05, 0.006, 0.006, top.s === 'coat' ? '#b8944a' : mix(a, -30), false);
          if (top.s === 'coat') { fold([[-0.06, HIP + 0.02], [-0.075, hemY - 0.01]], 0.3); fold([[0.06, HIP + 0.02], [0.075, hemY - 0.01]], 0.3); }
          rr(-0.09, WY + 0.01, 0.045, 0.006, 0.002, mix(a, -30), false); rr(0.045, WY + 0.01, 0.045, 0.006, 0.002, mix(a, -30), false);
        } else if (back && top.s === 'coat') ln([[0, WY + 0.04], [0, hemY]], OL, LW);
        break;
      }
      case 'dress': {
        if (front) { P(); g.ellipse(0, SY - 0.006, 0.05, 0.03, 0, 0, Math.PI); fs(mix(a, -20)); rr(-WW * tw, WY - 0.01, WW * 2 * tw, 0.025, 0.006, b); }
        for (let i = -3; i <= 3; i++) fold([[TX(i * 0.02), WY + 0.03], [TX(i * 0.032), hemY - 0.01]], 0.25);
        qd(TX(-HW - flare), hemY - 0.006, 0, hemY + 0.01, TX(HW + flare), hemY - 0.006, b, LW * 2.2, 0.8);
        break;
      }
      case 'robe': {
        if (front) { P(); g.moveTo(-0.04, SY - 0.014); g.lineTo(0, SY + 0.07); g.lineTo(0.04, SY - 0.014); fs(mix(a, -22)); ln([[0, SY + 0.07], [0, hemY]], mix(b, -10), LW * 2.4, 0.9); ln([[-0.045, SY - 0.012], [0, SY + 0.07], [0.045, SY - 0.012]], b, LW * 2, 0.9); }
        for (let i = -3; i <= 3; i++) if (i) fold([[TX(i * 0.025), HIP], [TX(i * 0.045), hemY - 0.01]], 0.28);
        rr(TX(-HW - flare), hemY - 0.018, TX(HW + flare) * 2, 0.02, 0.006, b, false);
        rr(TX(-WW - 0.005), WY - 0.012, TX(WW + 0.005) * 2, 0.03, 0.006, mix(b, -12));
        if (front) { P(); g.moveTo(0.02, WY + 0.015); g.lineTo(0.03, WY + 0.09); g.lineTo(0.045, WY + 0.085); g.lineTo(0.035, WY + 0.015); fs(mix(b, -12)); }
        break;
      }
      case 'armor': {
        P(); g.moveTo(TX(-SW + 0.012), SY + 0.0); g.lineTo(TX(SW - 0.012), SY + 0.0); g.quadraticCurveTo(TX(SW - 0.01), SY + 0.12, TX(WW + 0.008), WY + 0.005); g.lineTo(TX(-WW - 0.008), WY + 0.005); g.quadraticCurveTo(TX(-SW + 0.01), SY + 0.12, TX(-SW + 0.012), SY); g.closePath(); fs(metal(a, TX(-SW), TX(SW)));
        if (front) { ln([[0, SY + 0.01], [0, WY]], '#fff', LW, 0.25); el(0, SY + 0.08, 0.016, 0.016, b); [[-0.08, SY + 0.03], [0.08, SY + 0.03], [-0.06, WY - 0.02], [0.06, WY - 0.02]].forEach(([x, y]) => el(x, y, 0.004, 0.004, '#d8d0c0', false)); }
        for (let i = 0; i < 2; i++) rr(TX(-HW - 0.005), WY + 0.008 + i * 0.03, TX(HW + 0.005) * 2, 0.03, 0.008, metal(mix(a, -10), TX(-HW), TX(HW)));
        break;
      }
    }
    // layered gear: a cross-body strap
    if (['jerkin', 'tunic', 'vest', 'mail', 'jacket'].includes(top.s) && !(cape && (cape.s === 'backpack' || cape.s === 'jetpack'))) {
      const sx1 = TX(back ? SW - 0.035 : -SW + 0.035), ex1 = TX(back ? -WW + 0.005 : WW - 0.005);
      ln([[sx1, SY - 0.008], [ex1, WY - 0.005]], '#2a1c10', LW * 5.2); ln([[sx1, SY - 0.008], [ex1, WY - 0.005]], '#5a3e24', LW * 3.6);
      if (front) { const mx = lerp(sx1, ex1, 0.45), my = lerp(SY, WY, 0.45); rr(mx - 0.012, my - 0.01, 0.024, 0.02, 0.004, '#a88a4a'); }
    }
    // belt (most garments)
    if (!['robe', 'dress', 'armor', 'overalls'].includes(top.s)) {
      const by = Math.min(hemY - 0.02, HIP - 0.03);
      rr(TX(-WW - 0.012), by - 0.01, TX(WW + 0.012) * 2, 0.026, 0.006, '#3a2818');
      if (!back) {
        rr(TX(-0.016), by - 0.012, 0.032 * tw, 0.03, 0.005, '#a88a4a'); rr(TX(-0.008), by - 0.004, 0.016 * tw, 0.014, 0.003, '#3a2818', false);
        rr(TX(WW - 0.02), by + 0.012, 0.035 * tw, 0.045, 0.008, vg('#5a4028', by, by + 0.05)); ln([[TX(WW - 0.02), by + 0.025], [TX(WW + 0.015), by + 0.025]], OL, LW * 0.8, 0.6);
        if (front) { rr(TX(-WW - 0.005), by + 0.012, 0.03, 0.038, 0.008, vg('#4a3422', by, by + 0.05)); P(); g.moveTo(TX(-WW + 0.035), by + 0.012); g.lineTo(TX(-WW + 0.05), by + 0.012); g.lineTo(TX(-WW + 0.044), by + 0.075); g.closePath(); fs('#3a2818'); }
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(TX(-WW - 0.01), by + 0.016, TX(WW + 0.01) * 2, 0.012);
      }
    }
    // shoulder armour pieces
    if (top.s === 'armor') [-1, 1].forEach((d) => { if (side && d < 0) return; P(); g.ellipse(TX(d * (SW - 0.005)), SY + 0.012, 0.05, 0.035, d * 0.25, Math.PI, 0); g.lineTo(TX(d * (SW + 0.04)), SY + 0.04); g.lineTo(TX(d * (SW - 0.05)), SY + 0.035); g.closePath(); fs(metal(a, TX(d * SW) - 0.05, TX(d * SW) + 0.05)); });
    // cloak/cape clasp and drape at the shoulders (front & side)
    if (cape && (cape.s === 'cloak' || cape.s === 'cape') && !back) {
      P(); g.moveTo(TX(-SW - 0.02), SY + 0.06); g.quadraticCurveTo(TX(-SW - 0.01), SY - 0.03, TX(-0.03), SY - 0.02); g.lineTo(TX(0.03), SY - 0.02); g.quadraticCurveTo(TX(SW + 0.01), SY - 0.03, TX(SW + 0.02), SY + 0.06); g.quadraticCurveTo(TX(SW - 0.02), SY + 0.02, 0, SY + 0.025); g.quadraticCurveTo(TX(-SW + 0.02), SY + 0.02, TX(-SW - 0.02), SY + 0.06); g.closePath(); fs(vg(cape.a, SY - 0.03, SY + 0.06));
      if (front) { el(0, SY + 0.02, 0.014, 0.014, metal(cape.b, -0.014, 0.014)); }
      if (front && cape.s === 'cloak') { P(); g.moveTo(TX(-SW - 0.02), SY + 0.06); g.quadraticCurveTo(TX(-SW - 0.04), SY + 0.25, TX(-SW - 0.03), HIP + 0.25); g.lineTo(TX(-SW + 0.005), HIP + 0.24); g.quadraticCurveTo(TX(-SW + 0.0), SY + 0.2, TX(-SW + 0.01), SY + 0.06); g.closePath(); fs(vg(mix(cape.a, -8), SY, HIP + 0.25)); P(); g.moveTo(TX(SW + 0.02), SY + 0.06); g.quadraticCurveTo(TX(SW + 0.04), SY + 0.25, TX(SW + 0.03), HIP + 0.25); g.lineTo(TX(SW - 0.005), HIP + 0.24); g.quadraticCurveTo(TX(SW), SY + 0.2, TX(SW - 0.01), SY + 0.06); g.closePath(); fs(vg(mix(cape.a, -18), SY, HIP + 0.25)); }
    }
    if (cape && cape.s === 'scarf' && !back) { P(); g.ellipse(hx, SY - 0.005, side ? 0.06 : 0.075, 0.03, 0, 0, 7); fs(vg(cape.a, SY - 0.03, SY + 0.03)); fold([[hx - 0.05, SY - 0.005], [hx + 0.05, SY + 0.0]], 0.3); if (front) { rr(0.02, SY + 0.01, 0.035, 0.12, 0.01, vg(cape.a, SY, SY + 0.13)); ln([[0.022, SY + 0.12], [0.053, SY + 0.12]], cape.b, LW * 2); } }
    if (cape && (cape.s === 'backpack') && front) { ln([[-SW + 0.035, SY - 0.01], [-SW + 0.045, WY - 0.02]], mix(cape.a, -20), LW * 3.5); ln([[SW - 0.035, SY - 0.01], [SW - 0.045, WY - 0.02]], mix(cape.a, -20), LW * 3.5); }
    if (cape && cape.s === 'jetpack' && front) { ln([[-SW + 0.04, SY - 0.01], [-0.02, WY - 0.04]], '#3a3632', LW * 3); ln([[SW - 0.04, SY - 0.01], [0.02, WY - 0.04]], '#3a3632', LW * 3); }

    // near arms
    if (side) { const p1 = armPose((phase || 0) + (nearIsLeft ? 0 : Math.PI), true); arm(0, p1.u, p1.e, false, true); }
    else if (!back) {
      const pl = armPose(phase || 0, false), pr = armPose((phase || 0) + Math.PI, true);
      arm(-1, pl.u, pl.e, false, false); arm(1, pr.u, pr.e, false, true);
      // shoulder caps blend the sleeves into the torso
      [-1, 1].forEach((d) => { if (top.s !== 'armor') el(TX(d * (SW - 0.012)), SY + 0.02, 0.036, 0.03, cyl(sleeveCol, TX(d * SW) - 0.036, TX(d * SW) + 0.036), false); });
    }

    // ===== neck and head =====
    el(hx, SY - 0.004, 0.055 * BS, 0.018, 'rgba(0,0,0,.22)', false);
    rr(hx - 0.028, HY + HRY - 0.035, 0.056, 0.06, 0.012, cyl(skD, hx - 0.028, hx + 0.028));
    // ears
    if (front) { el(hx - HRX - 0.004, HY + 0.012, 0.016, 0.026, cyl(sk, hx - HRX - 0.02, hx - HRX + 0.01)); el(hx + HRX + 0.004, HY + 0.012, 0.016, 0.026, cyl(sk, hx + HRX - 0.01, hx + HRX + 0.02)); }
    if (side) el(hx + 0.035, HY + 0.012, 0.018, 0.027, cyl(sk, hx + 0.02, hx + 0.05));
    // skull and jaw
    P();
    if (side) { g.moveTo(hx + 0.08, HY - 0.06); g.quadraticCurveTo(hx + 0.11, HY + 0.05, hx + 0.06, HY + 0.1); g.quadraticCurveTo(hx + 0.02, HY + HRY + 0.005, hx - 0.04, HY + HRY - 0.005); g.quadraticCurveTo(hx - 0.075, HY + HRY - 0.02, hx - 0.085, HY + 0.08); g.lineTo(hx - 0.1, HY + 0.045); g.lineTo(hx - 0.105, HY + 0.035); g.quadraticCurveTo(hx - 0.112, HY - 0.0, hx - 0.1, HY - 0.05); g.quadraticCurveTo(hx - 0.06, HY - HRY - 0.01, hx + 0.02, HY - HRY); g.quadraticCurveTo(hx + 0.075, HY - HRY + 0.01, hx + 0.08, HY - 0.06); }
    else { g.moveTo(hx - HRX, HY - 0.02); g.quadraticCurveTo(hx - HRX, HY - HRY, hx, HY - HRY); g.quadraticCurveTo(hx + HRX, HY - HRY, hx + HRX, HY - 0.02); g.quadraticCurveTo(hx + HRX + 0.002, HY + 0.06, hx + 0.07, HY + 0.1); g.quadraticCurveTo(hx + (fem ? 0.03 : 0.04), HY + HRY + 0.005, hx, HY + HRY + (fem ? 0.0 : 0.004)); g.quadraticCurveTo(hx - (fem ? 0.03 : 0.04), HY + HRY + 0.005, hx - 0.07, HY + 0.1); g.quadraticCurveTo(hx - HRX - 0.002, HY + 0.06, hx - HRX, HY - 0.02); }
    g.closePath();
    { const hg = g.createRadialGradient(hx - 0.03, HY - 0.03, 0.01, hx + 0.01, HY + 0.02, 0.15); hg.addColorStop(0, mix(sk, 14)); hg.addColorStop(0.65, sk); hg.addColorStop(1, mix(sk, -30)); fs(hg); }

    // ===== face =====
    const eyeStyle = L.eyes[look.eyes || 0], EY = HY + 0.03;
    function eye(x, mirror) {
      const sharp = eyeStyle === 'Sharp', big = eyeStyle === 'Sparkle', sleepy = eyeStyle === 'Sleepy';
      const rx = big ? 0.021 : sharp ? 0.02 : 0.018, ry = big ? 0.015 : sharp ? 0.009 : 0.012;
      if (opt.blink) { qd(x - rx, EY, x, EY + 0.006, x + rx, EY, OL, LW * 1.4); return; }
      if (eyeStyle === 'Dot') { el(x, EY, 0.007, 0.009, '#1a120c', false); el(x + 0.002, EY - 0.003, 0.0025, 0.0025, '#fff', false); qd(x - 0.012, EY - 0.012, x, EY - 0.016, x + 0.012, EY - 0.012, OL, LW, 0.6); return; }
      P(); g.ellipse(x, EY, rx, ry, 0, 0, 7); g.fillStyle = '#efe6d8'; g.fill();
      g.save(); P(); g.ellipse(x, EY, rx, ry, 0, 0, 7); g.clip();
      const ir = big ? 0.011 : 0.0095, ix = x - mirror * 0.002 + (side ? -0.006 : 0);
      el(ix, EY + 0.001, ir, ir, ec, false); el(ix, EY + 0.001, ir * 0.5, ir * 0.5, '#0c0806', false);
      el(ix + 0.003, EY - 0.004, ir * 0.32, ir * 0.32, '#ffffff', false); if (big) el(ix - 0.004, EY + 0.004, ir * 0.2, ir * 0.2, '#ffffff', false);
      if (sleepy) { g.fillStyle = mix(sk, -12); g.fillRect(x - rx, EY - ry, rx * 2, ry * 1.1); }
      g.restore();
      // upper lid & lashes
      P(); g.moveTo(x - rx - 0.002, EY + (sharp ? 0.002 * mirror : 0.001)); g.quadraticCurveTo(x, EY - ry * (sleepy ? 0.1 : 1.5), x + rx + 0.002, EY - (sharp ? 0.004 * mirror : 0)); stroke(OL, LW * (fem ? 1.7 : 1.4));
      if (fem) ln([[x + mirror * rx, EY - 0.002], [x + mirror * (rx + 0.008), EY - 0.008]], OL, LW * 1.1);
      qd(x - rx * 0.7, EY + ry + 0.002, x, EY + ry + 0.004, x + rx * 0.7, EY + ry + 0.002, skD, LW * 0.8, 0.5);
    }
    if (!back) {
      const bc = mix(hc, -18);
      if (side) {
        eye(hx - 0.06, -1);
        // nose, mouth, brow in profile
        P(); g.moveTo(hx - 0.1, HY + 0.035); g.lineTo(hx - 0.118, HY + 0.068); g.lineTo(hx - 0.098, HY + 0.074); stroke(OL, LW);
        qd(hx - 0.09, HY + 0.1, hx - 0.075, HY + 0.104, hx - 0.065, HY + 0.098, '#4a2a20', LW * 1.2, 0.8);
        ln([[hx - 0.085, EY - 0.025], [hx - 0.04, EY - 0.03]], bc, LW * (fem ? 2 : 2.8));
        el(hx - 0.055, HY + 0.072, 0.02, 0.01, 'rgba(180,80,60,.15)', false);
      } else {
        eye(hx - 0.046, -1); eye(hx + 0.046, 1);
        // brows
        const sharp = eyeStyle === 'Sharp', bw2 = fem ? 1.8 : 2.8;
        qd(hx - 0.07, EY - 0.022 + (sharp ? -0.004 : 0), hx - 0.048, EY - 0.032, hx - 0.025, EY - 0.024 + (sharp ? 0.006 : 0), bc, LW * bw2);
        qd(hx + 0.07, EY - 0.022 + (sharp ? -0.004 : 0), hx + 0.048, EY - 0.032, hx + 0.025, EY - 0.024 + (sharp ? 0.006 : 0), bc, LW * bw2);
        // nose: bridge shadow + tip
        ln([[hx + 0.006, EY + 0.005], [hx + 0.01, HY + 0.068]], skD, LW * 1.1, 0.55);
        qd(hx - 0.01, HY + 0.072, hx + 0.002, HY + 0.08, hx + 0.013, HY + 0.07, mix(sk, -45), LW * 1.1, 0.75);
        // mouth
        qd(hx - 0.022, HY + 0.1, hx, HY + 0.106, hx + 0.022, HY + 0.099, '#4a2420', LW * 1.3, 0.85);
        if (fem) qd(hx - 0.014, HY + 0.106, hx, HY + 0.114, hx + 0.014, HY + 0.106, 'rgba(170,70,70,.55)', LW * 1.6);
        // cheekbones / jaw shading
        qd(hx + 0.07, HY + 0.04, hx + 0.08, HY + 0.08, hx + 0.05, HY + 0.11, mix(sk, -30), LW * 1.4, 0.3);
      }
      // facial hair
      const beard = L.beard[look.beard || 0];
      if (beard !== 'None') {
        const bcol = mix(hc, -6), cx2 = side ? hx - 0.04 : hx, wd = side ? 0.06 : 0.085, my = HY + 0.092;
        if (beard === 'Stubble') { g.save(); P(); g.ellipse(cx2, HY + 0.1, wd, 0.04, 0, 0, Math.PI); g.fillStyle = bcol; g.globalAlpha = 0.3; g.fill(); g.restore(); }
        if (beard === 'Short beard' || beard === 'Full beard' || beard === 'Long beard' || beard === 'Braided beard') {
          const low = beard === 'Long beard' ? 0.16 : beard === 'Braided beard' ? 0.07 : beard === 'Full beard' ? 0.08 : 0.03;
          P(); g.moveTo(cx2 - wd - 0.018, HY + 0.02); g.quadraticCurveTo(cx2 - wd, HY + HRY + low * 0.6, cx2, HY + HRY + low);
          g.quadraticCurveTo(cx2 + wd, HY + HRY + low * 0.6, cx2 + wd + 0.018, HY + 0.02); g.lineTo(cx2 + wd - 0.005, HY + 0.05);
          g.quadraticCurveTo(cx2 + 0.03, my + 0.005, cx2, my + 0.02); g.quadraticCurveTo(cx2 - 0.03, my + 0.005, cx2 - wd + 0.005, HY + 0.05); g.closePath(); fs(vg(bcol, HY, HY + HRY + low));
          for (let i = -3; i <= 3; i++) qd(cx2 + i * 0.022, my + 0.03, cx2 + i * 0.024, HY + HRY, cx2 + i * 0.016, HY + HRY + low * 0.8, mix(bcol, -35), LW * 0.8, 0.5);
          qd(cx2 - 0.014, HY + 0.103, cx2, HY + 0.108, cx2 + 0.014, HY + 0.103, '#2a1410', LW * 1.2, 0.8);
          if (beard === 'Braided beard') { for (let i = 0; i < 4; i++) el(cx2 + hairSw * i * 0.5, HY + HRY + low + 0.01 + i * 0.026, 0.017 - i * 0.002, 0.016, vg(bcol, HY + HRY, HY + HRY + 0.15)); rr(cx2 - 0.012 + hairSw * 2, HY + HRY + low + 0.105, 0.024, 0.012, 0.004, '#8a6a32', false); }
        }
        if (beard === 'Goatee') { P(); g.moveTo(cx2 - 0.02, HY + 0.11); g.quadraticCurveTo(cx2, HY + HRY + 0.035, cx2 + 0.02, HY + 0.11); g.quadraticCurveTo(cx2, HY + 0.118, cx2 - 0.02, HY + 0.11); fs(vg(bcol, HY + 0.1, HY + HRY + 0.03)); }
        if (beard !== 'Stubble') { P(); g.moveTo(cx2, my - 0.004); g.quadraticCurveTo(cx2 - 0.03, my - 0.012, cx2 - 0.045, my + 0.012); g.quadraticCurveTo(cx2 - 0.022, my + 0.004, cx2, my + 0.008); g.quadraticCurveTo(cx2 + 0.022, my + 0.004, cx2 + 0.045, my + 0.012); g.quadraticCurveTo(cx2 + 0.03, my - 0.012, cx2, my - 0.004); fs(bcol); }
      }
      // face items
      if (face) {
        const fa = face.a, fb = face.b, xs = side ? [hx - 0.06] : [hx - 0.046, hx + 0.046];
        switch (face.s) {
          case 'glasses': xs.forEach((x) => { P(); g.arc(x, EY, 0.022, 0, 7); g.fillStyle = 'rgba(200,220,230,.18)'; g.fill(); stroke(fa, LW * 1.4); }); if (!side) ln([[hx - 0.024, EY - 0.004], [hx + 0.024, EY - 0.004]], fa, LW * 1.3); break;
          case 'goggles': rr(hx - HRX - 0.004, EY - 0.012, HRX * 2 + 0.008, 0.022, 0.008, '#3a2818'); xs.forEach((x) => { el(x, EY, 0.028, 0.024, metal('#9a7a3a', x - 0.028, x + 0.028)); el(x, EY, 0.02, 0.017, fa); el(x + 0.006, EY - 0.006, 0.005, 0.004, 'rgba(255,255,255,.7)', false); }); break;
          case 'hearts': xs.forEach((x) => { P(); g.moveTo(x, EY + 0.02); g.bezierCurveTo(x - 0.035, EY + 0.0, x - 0.02, EY - 0.024, x, EY - 0.008); g.bezierCurveTo(x + 0.02, EY - 0.024, x + 0.035, EY, x, EY + 0.02); fs(fa); }); if (!side) ln([[hx - 0.02, EY - 0.006], [hx + 0.02, EY - 0.006]], OL, LW); break;
          case 'eyepatch': ln([[hx - HRX, EY - 0.05], [hx + HRX, EY + 0.01]], '#1a120c', LW * 1.4); el(side ? hx - 0.06 : hx + 0.046, EY, 0.024, 0.02, '#1e1610'); break;
          case 'monocle': { const x = side ? hx - 0.06 : hx + 0.046; P(); g.arc(x, EY, 0.022, 0, 7); g.fillStyle = 'rgba(220,235,245,.2)'; g.fill(); stroke(metal(fa, x - 0.02, x + 0.02), LW * 1.8); qd(x + 0.02, EY + 0.01, x + 0.04, EY + 0.08, x + 0.03, HY + 0.16, '#a08040', LW * 0.8); break; }
          case 'mask': P(); g.moveTo(hx - HRX + 0.008, EY + 0.025); g.quadraticCurveTo(hx, EY + 0.015, hx + (side ? -0.02 : HRX - 0.008), EY + 0.025); g.lineTo(hx + (side ? -0.03 : 0.07), HY + 0.11); g.quadraticCurveTo(hx, HY + HRY + 0.008, hx - 0.07, HY + 0.11); g.closePath(); fs(vg(fa, EY, HY + HRY)); for (let i = -1; i <= 1; i++) fold([[hx + i * 0.03, EY + 0.04], [hx + i * 0.025, HY + 0.11]], 0.25); break;
        }
      }
    }

    // ===== hair (front) =====
    function hairCap(fringe) {
      P();
      if (back) { g.moveTo(hx - HRX - 0.008, HY + 0.05); g.quadraticCurveTo(hx - HRX - 0.012, HY - HRY - 0.012, hx, HY - HRY - 0.014); g.quadraticCurveTo(hx + HRX + 0.012, HY - HRY - 0.012, hx + HRX + 0.008, HY + 0.05); g.quadraticCurveTo(hx + 0.06, HY + HRY - 0.01, hx, HY + HRY - 0.005); g.quadraticCurveTo(hx - 0.06, HY + HRY - 0.01, hx - HRX - 0.008, HY + 0.05); }
      else if (side) { g.moveTo(hx - 0.095, HY - 0.02); g.quadraticCurveTo(hx - 0.11, HY - HRY - 0.015, hx + 0.0, HY - HRY - 0.016); g.quadraticCurveTo(hx + 0.09, HY - HRY, hx + 0.09, HY + 0.0); g.quadraticCurveTo(hx + 0.095, HY + 0.08, hx + 0.06, HY + 0.1); g.lineTo(hx + 0.04, HY + 0.05); g.quadraticCurveTo(hx + 0.03, HY - 0.02, hx - 0.03, HY - 0.035); g.quadraticCurveTo(hx - 0.07, HY - 0.04, hx - 0.095, HY - 0.02); }
      else {
        g.moveTo(hx - HRX - 0.008, HY + 0.04); g.quadraticCurveTo(hx - HRX - 0.012, HY - HRY - 0.014, hx, HY - HRY - 0.015); g.quadraticCurveTo(hx + HRX + 0.012, HY - HRY - 0.014, hx + HRX + 0.008, HY + 0.04);
        g.lineTo(hx + HRX - 0.01, HY + 0.01);
        const f2 = fringe || 0;
        g.quadraticCurveTo(hx + 0.08, HY - 0.04 + f2, hx + 0.05, HY - 0.02 + f2); g.lineTo(hx + 0.03, HY - 0.05 + f2); g.quadraticCurveTo(hx + 0.0, HY - 0.025 + f2, hx - 0.02, HY - 0.035 + f2); g.lineTo(hx - 0.045, HY - 0.06 + f2); g.quadraticCurveTo(hx - 0.07, HY - 0.025 + f2, hx - HRX + 0.01, HY + 0.0);
        g.lineTo(hx - HRX - 0.008, HY + 0.04);
      }
      g.closePath(); fs(hairG(HY - HRY, HY + 0.05));
      // strand texture and a soft highlight
      for (let i = -3; i <= 3; i++) qd(hx + i * 0.025, HY - HRY + 0.005, hx + i * 0.03 + 0.006, HY - 0.06, hx + i * 0.034, HY - 0.025, mix(hc, -40), LW * 0.8, 0.45);
      qd(hx - 0.06, HY - HRY + 0.03, hx - 0.03, HY - HRY + 0.008, hx + 0.01, HY - HRY + 0.012, '#fff', LW * 2, 0.18);
    }
    const hatHidesHair = hat && ['hood', 'knight'].includes(hat.s);
    if (!hatHidesHair) {
      switch (hs) {
        case 'Spiky': hairCap(0.01); P(); for (let i = -2; i <= 2; i++) { const x = hx + i * 0.04; g.moveTo(x - 0.025, HY - HRY + 0.02); g.lineTo(x + 0.008, HY - HRY - 0.07 + Math.abs(i) * 0.015); g.lineTo(x + 0.026, HY - HRY + 0.02); } fs(hairG(HY - HRY - 0.07, HY - HRY + 0.02)); break;
        case 'Messy': hairCap(0.012); P(); [[-0.07, -0.05], [-0.025, -0.07], [0.025, -0.065], [0.07, -0.045]].forEach(([x, y]) => { g.moveTo(hx + x - 0.025, HY - HRY + 0.02); g.quadraticCurveTo(hx + x - 0.03, HY - HRY + y, hx + x + 0.018, HY - HRY + y - 0.005); g.quadraticCurveTo(hx + x, HY - HRY + 0.0, hx + x + 0.028, HY - HRY + 0.02); }); fs(hairG(HY - HRY - 0.07, HY - HRY + 0.02)); break;
        case 'Curly': hairCap(0.005); for (let i = 0; i < 9; i++) { const a2 = Math.PI * (1.0 + i * 0.125); el(hx + Math.cos(a2) * HRX * 0.95, HY - 0.01 + Math.sin(a2) * HRY * 0.95, 0.03, 0.03, hairG(HY - HRY - 0.03, HY)); } break;
        case 'Bob': hairCap(0.012); if (back) rr(hx - 0.125, HY - 0.03, 0.25, 0.16, 0.05, hairG(HY, HY + 0.13)); if (front) { rr(hx - HRX - 0.012, HY - 0.03, 0.04, 0.16, 0.018, hairG(HY, HY + 0.13)); rr(hx + HRX - 0.028, HY - 0.03, 0.04, 0.16, 0.018, hairG(HY, HY + 0.13)); } if (side) rr(hx + 0.0, HY - 0.06, 0.1, 0.18, 0.04, hairG(HY, HY + 0.12)); break;
        case 'Long': hairCap(0.012); if (back) rr(hx - 0.115, HY - 0.02, 0.23, 0.32, 0.05, hairG(HY, HY + 0.3)); if (front) { rr(hx - HRX - 0.014, HY - 0.03, 0.04, 0.24, 0.018, hairG(HY, HY + 0.2)); rr(hx + HRX - 0.026, HY - 0.03, 0.04, 0.24, 0.018, hairG(HY, HY + 0.2)); } if (side) rr(hx - 0.01, HY - 0.06, 0.11, 0.32, 0.04, hairG(HY, HY + 0.3)); break;
        case 'Ponytail': hairCap(0.01); if (back) { P(); g.moveTo(hx - 0.02, HY + 0.0); g.bezierCurveTo(hx - 0.05, HY + 0.12, hx + 0.03, HY + 0.18, hx, HY + 0.26); g.bezierCurveTo(hx + 0.05, HY + 0.16, hx + 0.03, HY + 0.06, hx + 0.02, HY + 0.0); fs(hairG(HY, HY + 0.26)); } rr(hx - 0.014 + (side ? 0.06 : 0), HY - 0.005, 0.028, 0.016, 0.006, '#6a2a24', false); break;
        case 'Bun': hairCap(0.01); el(hx, HY - HRY - 0.025, 0.04, 0.035, hairG(HY - HRY - 0.06, HY - HRY)); qd(hx - 0.03, HY - HRY - 0.025, hx, HY - HRY - 0.04, hx + 0.03, HY - HRY - 0.02, mix(hc, -40), LW, 0.5); break;
        case 'Mohawk': g.save(); g.globalAlpha = 0.55; hairCap(-0.04); g.restore(); P(); g.moveTo(hx - 0.022, HY - HRY + 0.03); for (let i = 0; i < 5; i++) { g.lineTo(hx - 0.03 + (side ? i * 0.02 : 0), HY - HRY - 0.04 - (i % 2) * 0.02 + i * 0.012 * (side ? 1 : 0)); } g.lineTo(hx + 0.022, HY - HRY + 0.03); g.closePath(); fs(hairG(HY - HRY - 0.07, HY - HRY + 0.03)); break;
        case 'Twin tails': hairCap(0.012); if (back) [-1, 1].forEach((d) => { P(); g.moveTo(hx + d * 0.09, HY - 0.02); g.bezierCurveTo(hx + d * 0.18, HY + 0.05, hx + d * 0.16, HY + 0.22, hx + d * 0.11, HY + 0.3); g.bezierCurveTo(hx + d * 0.09, HY + 0.2, hx + d * 0.09, HY + 0.08, hx + d * 0.06, HY); fs(hairG(HY, HY + 0.3)); }); if (front) [-1, 1].forEach((d) => rr(hx + d * (HRX - 0.005) - 0.012, HY - 0.04, 0.024, 0.02, 0.006, '#6a2a24', false)); break;
        case 'Crop': hairCap(-0.025); break;
        case 'Undercut': g.save(); g.globalAlpha = 0.35; hairCap(-0.05); g.restore(); P(); g.moveTo(hx - 0.075, HY - 0.06); g.quadraticCurveTo(hx - 0.07, HY - HRY - 0.05, hx + 0.02, HY - HRY - 0.045); g.quadraticCurveTo(hx + 0.1, HY - HRY - 0.03, hx + 0.09, HY - 0.07); g.quadraticCurveTo(hx + 0.03, HY - 0.09, hx - 0.03, HY - 0.05); g.closePath(); fs(hairG(HY - HRY - 0.05, HY - 0.05)); for (let i = 0; i < 5; i++) qd(hx - 0.06 + i * 0.03, HY - 0.07, hx - 0.04 + i * 0.03, HY - HRY - 0.03, hx + 0.0 + i * 0.025, HY - HRY - 0.04, mix(hc, -40), LW * 0.8, 0.45); break;
        case 'Top-knot': hairCap(-0.02); el(hx, HY - HRY - 0.035, 0.032, 0.03, hairG(HY - HRY - 0.07, HY - HRY)); rr(hx - 0.024, HY - HRY - 0.012, 0.048, 0.014, 0.005, '#6a2a24', false); break;
        case 'Wavy': hairCap(0.014); if (front) [-1, 1].forEach((d) => { P(); g.moveTo(hx + d * (HRX - 0.01), HY - 0.04); for (let i = 1; i <= 5; i++) g.quadraticCurveTo(hx + d * (HRX + 0.022 - (i % 2) * 0.014) + hairSw * i / 5, HY - 0.04 + i * 0.045 - 0.022, hx + d * (HRX + 0.005) + hairSw * i / 5, HY - 0.04 + i * 0.045); g.lineTo(hx + d * (HRX - 0.03) + hairSw, HY + 0.18); g.quadraticCurveTo(hx + d * (HRX - 0.02), HY + 0.06, hx + d * (HRX - 0.03), HY - 0.02); g.closePath(); fs(hairG(HY, HY + 0.2)); }); if (back) rr(hx - 0.12, HY - 0.02, 0.24, 0.31, 0.06, hairG(HY, HY + 0.3)); break;
        case 'Locs': hairCap(0.01); if (front) [-1, 1].forEach((d) => { for (let i = 0; i < 2; i++) { const x0 = hx + d * (HRX - 0.012 - i * 0.022); P(); g.moveTo(x0 - 0.01, HY - 0.05); g.quadraticCurveTo(x0 + hairSw, HY + 0.06, x0 + hairSw * 1.4, HY + 0.15 - i * 0.03); g.lineTo(x0 + 0.012 + hairSw * 1.4, HY + 0.15 - i * 0.03); g.quadraticCurveTo(x0 + 0.012 + hairSw, HY + 0.06, x0 + 0.01, HY - 0.05); g.closePath(); fs(hairG(HY, HY + 0.15)); } }); if (back) for (let i = -4; i <= 4; i++) { const x0 = hx + i * 0.027; cap(x0, HY, x0 + hairSw * 1.4, HY + 0.24 - Math.abs(i) * 0.01, 0.012, 0.01, hc); } break;
        case 'Braid': hairCap(0.01); if (front) { for (let i = 0; i < 7; i++) el(hx + HRX - 0.005 + i * 0.004 + hairSw * i / 5, HY + 0.06 + i * 0.036, 0.02 - i * 0.0012, 0.022, hairG(HY, HY + 0.3)); rr(hx + HRX + 0.008 + hairSw * 1.3, HY + 0.31, 0.022, 0.012, 0.004, '#6a2a24', false); } if (back) { for (let i = 0; i < 8; i++) el(hx + hairSw * i / 5, HY + 0.08 + i * 0.036, 0.022 - i * 0.0012, 0.022, hairG(HY, HY + 0.35)); } break;
        default: hairCap(0.0);
      }
    }

    // ===== hats =====
    if (hat) {
      const a = hat.a, b = hat.b, TOP = HY - HRY;
      const dome = (c, y, r, h) => { P(); g.ellipse(hx, y, r, h || r * 0.85, 0, Math.PI, 0); g.closePath(); fs(cyl(c, hx - r, hx + r)); };
      const brimF = (y, w, h, c) => { P(); g.ellipse(hx + (side ? -0.03 : 0), y, w, h, 0, 0, 7); fs(vg(c, y - h, y + h)); };
      switch (hat.s) {
        case 'hood': {
          P(); g.moveTo(hx - HRX - 0.03, HY + 0.11); g.quadraticCurveTo(hx - HRX - 0.04, TOP - 0.03, hx + (side ? 0.03 : 0), TOP - 0.035); g.quadraticCurveTo(hx + HRX + 0.04 + (side ? 0.03 : 0), TOP - 0.02, hx + HRX + 0.03 + (side ? 0.02 : 0), HY + 0.11);
          if (!back) { if (side) { g.quadraticCurveTo(hx + 0.02, HY + 0.08, hx - 0.02, HY - 0.04); g.quadraticCurveTo(hx - 0.07, HY - 0.08, hx - HRX - 0.01, HY - 0.02); } else { g.quadraticCurveTo(hx + 0.08, HY + 0.06, hx + 0.085, HY - 0.0); g.quadraticCurveTo(hx + 0.07, HY - 0.085, hx, HY - 0.09); g.quadraticCurveTo(hx - 0.07, HY - 0.085, hx - 0.085, HY - 0.0); g.quadraticCurveTo(hx - 0.08, HY + 0.06, hx - HRX - 0.03, HY + 0.11); } }
          g.closePath(); fs(cyl(a, hx - HRX - 0.04, hx + HRX + 0.04));
          if (!back && !side) { P(); g.moveTo(hx - 0.085, HY - 0.0); g.quadraticCurveTo(hx - 0.07, HY - 0.085, hx, HY - 0.09); g.quadraticCurveTo(hx + 0.07, HY - 0.085, hx + 0.085, HY); stroke('#000', LW * 2.5, 0.35); }
          fold([[hx - 0.05, TOP - 0.01], [hx - 0.09, HY + 0.05]], 0.3); fold([[hx + 0.05, TOP - 0.01], [hx + 0.095, HY + 0.05]], 0.3);
          rr(hx - HRX - 0.035, HY + 0.1, (HRX + 0.035) * 2, 0.05, 0.02, vg(mix(a, -6), HY + 0.1, HY + 0.15));
          break;
        }
        case 'kettle': dome(a, HY - 0.025, HRX + 0.018, HRY + 0.012); P(); g.ellipse(hx, HY - 0.025, HRX + 0.065, 0.024, 0, 0, 7); fs(metal(a, hx - HRX - 0.06, hx + HRX + 0.06)); ln([[hx - 0.03, TOP - 0.005], [hx - 0.05, HY - 0.04]], '#fff', LW * 1.5, 0.3); el(hx, TOP - 0.035, 0.008, 0.006, b, false); break;
        case 'knight': P(); g.ellipse(hx, HY - 0.0, HRX + 0.018, HRY + 0.012, 0, 0, 7); fs(metal(a, hx - HRX, hx + HRX)); if (!back) { rr(hx - (side ? 0.1 : 0.07), EY - 0.01, side ? 0.07 : 0.14, 0.018, 0.006, '#120c08', false); for (let i = 0; i < 4; i++) ln([[hx - (side ? 0.09 : 0.03) + i * 0.012, HY + 0.06], [hx - (side ? 0.09 : 0.03) + i * 0.012, HY + 0.1]], '#120c08', LW * 1.2, 0.7); ln([[hx + (side ? -0.03 : 0), TOP], [hx + (side ? -0.03 : 0), HY + HRY]], '#fff', LW, 0.25); }
          P(); g.moveTo(hx - 0.01, TOP - 0.005); g.quadraticCurveTo(hx + 0.04, TOP - 0.1, hx + 0.12, TOP - 0.05); g.quadraticCurveTo(hx + 0.05, TOP - 0.03, hx + 0.02, TOP + 0.01); fs(b); break;
        case 'cap': case 'visorcap': dome(a, HY - 0.015, HRX + 0.012, HRY * 0.95); if (!back) { P(); if (side) g.ellipse(hx - 0.1, HY - 0.02, 0.06, 0.016, 0, 0, 7); else g.ellipse(hx, HY - 0.012, HRX - 0.01, 0.03, 0, 0, Math.PI); fs(hat.s === 'visorcap' ? b : mix(a, -18)); } el(hx, TOP - 0.008, 0.008, 0.005, b, false); fold([[hx - 0.05, TOP + 0.02], [hx - 0.06, HY - 0.02]], 0.25); break;
        case 'beanie': dome(a, HY - 0.0, HRX + 0.014, HRY + 0.01); rr(hx - HRX - 0.014, HY - 0.035, (HRX + 0.014) * 2, 0.035, 0.012, b); for (let x = -HRX; x < HRX; x += 0.014) ln([[hx + x, HY - 0.032], [hx + x, HY - 0.003]], '#000', LW * 0.7, 0.25); el(hx, TOP - 0.02, 0.022, 0.02, b); break;
        case 'bandana': dome(a, HY - 0.0, HRX + 0.008, HRY + 0.006); [[-0.06, -0.06], [0.02, -0.1], [0.06, -0.04], [-0.01, -0.03]].forEach(([x, y]) => el(hx + x, HY + y, 0.006, 0.006, b, false)); if (!side) { el(hx + HRX - 0.01, HY - 0.0, 0.022, 0.014, a); P(); g.moveTo(hx + HRX - 0.01, HY); g.lineTo(hx + HRX + 0.03, HY + 0.05); g.lineTo(hx + HRX + 0.005, HY + 0.05); g.closePath(); fs(a); } break;
        case 'hardhat': case 'miner': dome(a, HY - 0.015, HRX + 0.016, HRY + 0.006); rr(hx - HRX - 0.03 - (side ? 0.03 : 0), HY - 0.025, (HRX + 0.03) * 2, 0.02, 0.008, mix(a, -14)); ln([[hx, TOP - 0.012], [hx, HY - 0.03]], '#fff', LW * 2, 0.2); if (hat.s === 'miner' && !back) { el(hx + (side ? -0.07 : 0), HY - 0.07, 0.022, 0.02, metal('#8a7a5a', hx - 0.02, hx + 0.02)); el(hx + (side ? -0.07 : 0), HY - 0.07, 0.014, 0.012, b, false); } break;
        case 'aviator': dome(a, HY + 0.005, HRX + 0.012, HRY + 0.01); if (!back) { rr(hx - HRX - 0.016, HY - 0.0, 0.032, 0.11, 0.012, vg(a, HY, HY + 0.11)); if (!side) rr(hx + HRX - 0.016, HY - 0.0, 0.032, 0.11, 0.012, vg(a, HY, HY + 0.11)); rr(hx - HRX - 0.005, HY - 0.03, (HRX + 0.005) * 2, 0.018, 0.008, b); el(hx - 0.04, HY - 0.06, 0.022, 0.018, metal('#9a7a3a', hx - 0.06, hx - 0.02)); el(hx + 0.04, HY - 0.06, 0.022, 0.018, metal('#9a7a3a', hx + 0.02, hx + 0.06)); } break;
        case 'beret': P(); g.ellipse(hx + 0.015, TOP + 0.02, HRX + 0.025, 0.04, -0.12, 0, 7); fs(vg(a, TOP - 0.02, TOP + 0.06)); el(hx + 0.02, TOP - 0.018, 0.006, 0.006, b, false); break;
        case 'cowboy': brimF(HY - 0.03, HRX + 0.075, 0.025, a); P(); g.roundRect(hx - HRX * 0.75, TOP - 0.05, HRX * 1.5, HRY - 0.0, [0.04, 0.04, 0.01, 0.01]); fs(cyl(a, hx - HRX, hx + HRX)); rr(hx - HRX * 0.75, HY - 0.055, HRX * 1.5, 0.016, 0.004, b, false); fold([[hx, TOP - 0.045], [hx, TOP - 0.01]], 0.35); break;
        case 'tophat': brimF(HY - 0.04, HRX + 0.04, 0.018, a); rr(hx - HRX * 0.68, TOP - 0.11, HRX * 1.36, HRY + 0.03, 0.01, cyl(a, hx - HRX, hx + HRX)); rr(hx - HRX * 0.68, HY - 0.075, HRX * 1.36, 0.02, 0, b, false); break;
        case 'wizard': brimF(HY - 0.045, HRX + 0.07, 0.024, a); P(); g.moveTo(hx - HRX * 0.75, HY - 0.05); g.quadraticCurveTo(hx - 0.01, TOP - 0.12, hx + 0.08, TOP - 0.2); g.quadraticCurveTo(hx + 0.04, TOP - 0.06, hx + HRX * 0.75, HY - 0.05); g.closePath(); fs(cyl(a, hx - HRX, hx + HRX)); rr(hx - HRX * 0.74, HY - 0.075, HRX * 1.48, 0.02, 0.005, b, false); el(hx + 0.01, TOP - 0.04, 0.009, 0.009, b, false); break;
        case 'crown': P(); g.moveTo(hx - 0.075, TOP + 0.03); g.lineTo(hx - 0.08, TOP - 0.05); g.lineTo(hx - 0.04, TOP - 0.01); g.lineTo(hx, TOP - 0.07); g.lineTo(hx + 0.04, TOP - 0.01); g.lineTo(hx + 0.08, TOP - 0.05); g.lineTo(hx + 0.075, TOP + 0.03); g.closePath(); fs(metal(a, hx - 0.08, hx + 0.08)); el(hx, TOP + 0.005, 0.01, 0.01, b, false); break;
        case 'bow': { const bx = hx + (side ? 0.03 : 0.06), by2 = TOP + 0.02; P(); g.moveTo(bx, by2); g.quadraticCurveTo(bx - 0.06, by2 - 0.05, bx - 0.055, by2 + 0.025); g.closePath(); fs(a); P(); g.moveTo(bx, by2); g.quadraticCurveTo(bx + 0.06, by2 - 0.05, bx + 0.055, by2 + 0.025); g.closePath(); fs(a); el(bx, by2, 0.012, 0.012, b); break; }
        case 'chef': rr(hx - HRX * 0.85, HY - 0.07, HRX * 1.7, 0.05, 0.01, b); [[-0.05, -0.12, 0.05], [0.045, -0.12, 0.05], [0, -0.155, 0.058]].forEach(([x, y, r]) => el(hx + x, HY + y, r, r * 0.9, cyl(a, hx + x - r, hx + x + r))); rr(hx - HRX * 0.85, HY - 0.07, HRX * 1.7, 0.04, 0.01, a); break;
        case 'flowers': [-0.08, -0.04, 0, 0.04, 0.08].forEach((x, i) => { const y = TOP + 0.02 + Math.abs(x) * 0.5; el(hx + x, y, 0.02, 0.02, i % 2 ? '#b8a05a' : a); el(hx + x, y, 0.007, 0.007, '#f0e6c8', false); }); break;
        case 'headphones': P(); g.ellipse(hx, HY, HRX + 0.012, HRY + 0.01, 0, Math.PI * 1.05, Math.PI * 1.95); stroke(b, LW * 3.5); if (side) rr(hx + 0.015, HY - 0.01, 0.04, 0.06, 0.016, a); else { rr(hx - HRX - 0.022, HY - 0.015, 0.04, 0.065, 0.016, a); rr(hx + HRX - 0.018, HY - 0.015, 0.04, 0.065, 0.016, a); } break;
      }
    }
    // back view: capes and packs drape over the body
    if (back) backGear(true);
    g.restore();
  };

  // Menu helper: pilot standing in a box of height s with top-left (x, y).
  AF.drawPilot = function (g, x, y, s, look, t, dir) {
    AF.drawPilotAt(g, x + s * 0.36, y + s * 0.99, s * 0.97, look, dir || 'down', dir && t ? t / 180 : 0, { moving: !!(dir && t), t, blink: t ? (t % 3400) < 140 : false });
  };

  // ---------- Character creator (new pilot) and Salon (change your look later) ----------
  // No presets: every feature is set directly with sliders, shape buttons and free colour pickers.
  const C = (AF.Creator = { look: null, mode: 'new', tab: 'pilot', kit: null, con: null, bot: null, raf: 0 });
  const root = () => document.querySelector('#creator');
  C.open = function (opts) {
    C.mode = opts.mode === 'boutique' ? 'salon' : opts.mode; C.state = opts.state || null; C.onDone = opts.onDone; C.onCancel = opts.onCancel;
    C.look = JSON.parse(JSON.stringify(Object.assign(AF.defaultLook(Math.random() < 0.5 ? 'm' : 'f'), opts.look || {})));
    if (C.look.shape == null) C.look.shape = AF.lookShape(C.look);
    C.look.dye = C.look.dye || {};
    C.tab = 'pilot';
    if (C.mode === 'new') { C.con = null; C.warn = false; C.kit = Object.assign({}, AF.STARTER_KIT); C.bot = AF.defaultBot(null); C.botTouched = false; }
    const r = root();
    if (!r.dataset.wired) { r.dataset.wired = '1'; r.addEventListener('input', C.onInput); }
    r.hidden = false;
    C.render();
    cancelAnimationFrame(C.raf);
    const loop = (t) => { C.drawPreview(t); if (!root().hidden) C.raf = requestAnimationFrame(loop); };
    C.raf = requestAnimationFrame(loop);
  };
  C.close = function () { root().hidden = true; cancelAnimationFrame(C.raf); };
  C.wornIds = () => (C.mode === 'new' ? Object.values(C.kit).filter(Boolean) : AF.equippedIds(C.state).filter((id) => AF.ITEMS[id].slot !== 'charm'));
  C.previewLook = function () {
    const o = {};
    C.wornIds().forEach((id) => { o[AF.ITEMS[id].slot] = id; });
    if (!o.top) o.top = 'basic_tee';
    return Object.assign({}, C.look, { outfit: o });
  };
  C.drawPreview = function (t) {
    const cv = document.querySelector('#cr-preview'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const dirs = ['down', 'left', 'up', 'right'];
    const dir = C.facing || dirs[Math.floor(t / 1800) % 4], moving = C.walk !== false;
    AF.drawPilotAt(g, w / 2, h - 16, Math.min(h * 0.7, w * 1.1), C.previewLook(), dir, moving ? t / 170 : 0, { moving, t, blink: (t % 3400) < 140 });
  };
  C.botPreview = function () {
    const e = document.querySelector('#cr-bot'); if (!e) return;
    const parts = { arc: 2, frame: 2, legs: C.con === 'bulwark' ? 2 : 1, arms: 2, weapon: 2, shield: C.con === 'bulwark' ? 3 : 1 };
    e.innerHTML = AF.robotSVG(C.mode === 'new' ? parts : C.state.parts, { core: AF.coreColor(C.look), bot: Object.assign({}, C.mode === 'new' ? C.bot : C.state.bot, { construct: C.mode === 'new' ? C.con : C.state.construct }) });
  };

  // controls
  const pct = (v, d) => Math.round((v == null ? d : v) * 100);
  const slider = (field, label, lo, hi, val, scale) => `<label class="slide"><span>${label}</span><small>${lo}</small><input type="range" min="0" max="100" value="${val}" data-lk="${field}" data-scale="${scale || 1}"><small>${hi}</small></label>`;
  const color = (field, label, val) => `<label class="pick"><span>${label}</span><input type="color" data-lkc="${field}" value="${val}"></label>`;
  const opts = (field, list, cur) => list.map((n, i) => `<button class="opt${(cur == null ? 0 : cur) === i ? ' on' : ''}" data-look="${field}" data-i="${i}">${n}</button>`).join('');
  const toggle = (field, label, on) => `<button class="opt tog${on ? ' on' : ''}" data-look="${field}" data-tog="1">${label}: ${on ? 'On' : 'Off'}</button>`;
  const fem = () => AF.lookShape(C.look) >= 0.5;
  // skin slider position from the current colour (closest point on the ramp)
  const skinPos = () => { const v = C.look.skin; if (typeof v !== 'string') return Math.round(((v || 0) / (L.skin.length - 1)) * 100); if (C.skinT != null) return C.skinT; return 50; };

  C.pilotTab = function () {
    const lk = C.look;
    return `
      <section><h3>Body</h3><div class="slides">
        ${slider('shape', 'Body shape', 'Broad', 'Curvy', pct(lk.shape, AF.lookShape(lk)))}
        ${slider('build', 'Build', 'Slim', 'Hefty', pct((lk.build == null ? 1 : lk.build) / 2, 0.5), 2)}
        ${slider('height', 'Height', 'Short', 'Tall', pct(lk.height, 0.5))}
        ${slider('headSize', 'Head size', 'Small', 'Large', pct(lk.headSize, 0.5))}</div></section>
      <section><h3>Skin</h3><div class="slides">${slider('skinT', 'Skin tone', 'Light', 'Deep', skinPos())}</div>
        <div class="picks">${color('skin', 'Exact colour', AF.lookHex(lk, 'skin'))}</div></section>
      <section><h3>Hair</h3><div class="opts">${opts('hair', L.hair, lk.hair)}</div>
        <div class="picks">${color('hairColor', 'Hair colour', AF.lookHex(lk, 'hairColor'))}</div>
        <h4>Facial hair</h4><div class="opts">${opts('beard', L.beard, lk.beard)}</div></section>
      <section><h3>Eyes &amp; brows</h3><div class="opts">${opts('eyes', L.eyes, lk.eyes)}</div>
        <div class="picks">${color('eyeColor', 'Eye colour', AF.lookHex(lk, 'eyeColor'))}</div>
        <h4>Brows</h4><div class="opts">${opts('brows', L.brows, lk.brows)}</div>
        <div class="opts">${toggle('lashes', 'Lashes', lk.lashes == null ? fem() : lk.lashes)}</div></section>
      <section><h3>Face</h3>
        <h4>Nose</h4><div class="opts">${opts('nose', L.nose, lk.nose)}</div>
        <h4>Mouth</h4><div class="opts">${opts('mouth', L.mouth, lk.mouth)}</div>
        <h4>Ears</h4><div class="opts">${opts('ears', L.ears, lk.ears)}</div>
        <h4>Marks</h4><div class="opts">${opts('marks', L.marks, lk.marks)}</div>
        <div class="opts">${toggle('lips', 'Lip colour', lk.lips == null ? fem() : lk.lips)}${toggle('blush', 'Rosy cheeks', lk.blush !== false)}</div></section>`;
  };
  const dyeRow = (id) => {
    const it = AF.ITEMS[id], d = C.look.dye[id] || {}, v = it.vis || {};
    const base = (k) => (AF.mute ? AF.mute(v[k], 0.22) : v[k]);
    return `<div class="dye"><span>${AF.esc(it.name)}</span>${v.a ? `<label class="pick"><span>Main</span><input type="color" data-dye="${id}" data-k="a" value="${d.a || base('a')}"></label>` : ''}${v.b ? `<label class="pick"><span>Detail</span><input type="color" data-dye="${id}" data-k="b" value="${d.b || base('b')}"></label>` : ''}${C.look.dye[id] ? `<button class="btn sm ghost" data-undye="${id}">Original</button>` : ''}</div>`;
  };
  const SLOTNAME = { hat: 'Head', face: 'Face', top: 'Top', bottom: 'Bottoms', shoes: 'Shoes', gloves: 'Gloves', cape: 'Back', tool: 'Tool' };
  C.outfitTab = function () {
    if (C.mode !== 'new') {
      const ids = C.wornIds();
      return `<section><h3>Dye your clothes</h3><p class="hint">Recolour anything you're wearing. Each piece remembers its colours, even after you take it off.</p>${ids.length ? ids.map(dyeRow).join('') : '<p class="muted">You aren\'t wearing anything that can be dyed.</p>'}</section>`;
    }
    return `<section><h3>Starting clothes</h3><p class="hint">Pick each piece you start with, then dye it any colour. You'll find many more outfits as you play, and everything you wear shows on your pilot.</p></section>
      ${Object.entries(AF.STARTER_POOL).map(([slot, list]) => `<section><h3>${SLOTNAME[slot]}</h3><div class="opts">${list.map((id) => `<button class="opt${(C.kit[slot] || null) === id ? ' on' : ''}" data-kit="${slot}" data-id="${id || ''}">${id ? AF.esc(AF.ITEMS[id].name) : 'None'}</button>`).join('')}</div>${C.kit[slot] ? dyeRow(C.kit[slot]) : ''}</section>`).join('')}`;
  };
  C.botTab = function () {
    return `<section id="cr-con" class="${C.warn && !C.con ? 'need' : ''}"><h3>Construct</h3>${C.warn && !C.con ? '<p class="warn">Pick one to start your adventure.</p>' : ''}<p class="hint">Engineer Mara will build this for you. It decides your automaton's strengths and your 30-card starting deck. This choice is permanent for this pilot.</p>${AF.constructPicker(C.con, AF.coreColor(C.look))}</section>
      <section><h3>Name</h3><div class="row"><input id="cr-botname" class="txt" maxlength="14" value="${AF.esc(C.bot.name)}" autocomplete="off"><button class="btn" data-cr="botname">Random name</button><button class="btn" data-cr="botrandom">Randomize look</button></div></section>
      ${AF.botEditorHTML(C.bot, C.look)}`;
  };
  C.render = function () {
    const lk = C.look, isNew = C.mode === 'new';
    const tabs = [['pilot', 'Pilot'], ['outfit', isNew ? 'Outfit' : 'Dye'], ...(isNew ? [['bot', 'Automaton']] : [])];
    const y = document.querySelector('#creator') ? document.querySelector('#creator').scrollTop : 0;
    root().querySelector('.cr').innerHTML = `
      <div class="cr-side">
        <h2>${isNew ? 'Create your pilot' : 'Salon'}</h2>
        <div class="cr-stage${C.tab === 'bot' ? ' botfocus' : ''}"><canvas id="cr-preview"></canvas>${isNew ? '<div id="cr-bot" class="cr-bot"></div>' : ''}
          <div class="cr-turn">${[['down', 'Front'], ['left', 'Side'], ['up', 'Back'], ['', 'Spin']].map(([d, n]) => `<button class="opt sm${(C.facing || '') === d ? ' on' : ''}" data-face="${d}">${n}</button>`).join('')}<button class="opt sm${C.walk === false ? '' : ' on'}" data-walk="1">Walk</button></div></div>
        ${isNew ? `<label class="fld">Pilot name<input id="cr-name" maxlength="16" value="${AF.esc(lk.name)}" placeholder="Name your pilot" autocomplete="off"></label>` : `<p class="cr-name">${AF.esc(lk.name)}</p>`}
        <div class="row"><button class="btn" data-cr="random">Randomize ${C.tab === 'pilot' ? 'look' : C.tab === 'outfit' ? (isNew ? 'outfit' : 'dyes') : 'automaton'}</button><button class="btn ghost" data-cr="cancel">${isNew ? 'Back' : 'Cancel'}</button><button class="btn primary" data-cr="done">${isNew ? 'Start adventure' : 'Save look'}</button></div>
      </div>
      <div class="cr-opts">
        <nav class="cr-tabs">${tabs.map(([k, n]) => `<button class="tab${C.tab === k ? ' on' : ''}" data-crtab="${k}">${n}</button>`).join('')}</nav>
        ${C.tab === 'pilot' ? C.pilotTab() : C.tab === 'outfit' ? C.outfitTab() : C.botTab()}
        <div class="row cr-end"><button class="btn ghost" data-cr="cancel">${isNew ? 'Back' : 'Cancel'}</button><button class="btn primary" data-cr="done">${isNew ? 'Start adventure' : 'Save look'}</button></div>
      </div>`;
    if (document.querySelector('#creator')) document.querySelector('#creator').scrollTop = y;
    C.botPreview();
  };
  // Sliders and colour pickers update live without rebuilding the page.
  C.onInput = function (ev) {
    const e = ev.target, lk = C.look;
    if (e.dataset.lk) {
      const v = +e.value / 100, f = e.dataset.lk;
      if (f === 'skinT') { C.skinT = +e.value; lk.skin = AF.skinAt(v); const pk = root().querySelector('[data-lkc="skin"]'); if (pk) pk.value = lk.skin; return; }
      lk[f] = +(v * +e.dataset.scale).toFixed(2);
      if (f === 'shape') lk.body = v >= 0.5 ? 'f' : 'm';
      return;
    }
    if (e.dataset.lkc) { lk[e.dataset.lkc] = e.value; if (e.dataset.lkc === 'skin') C.skinT = null; return; }
    if (e.dataset.dye) { lk.dye[e.dataset.dye] = Object.assign({}, lk.dye[e.dataset.dye], { [e.dataset.k]: e.value }); return; }
    if (C.mode === 'new' && AF.botEditorInput(C.bot, lk, e)) { C.botTouched = true; C.botPreview(); return; }
    if (e.id === 'cr-botname') C.bot.name = e.value;
  };
  C.handle = function (t) {
    const el = t.closest('[data-look],[data-cr],[data-kit],[data-construct],[data-crtab],[data-face],[data-walk],[data-undye],[data-bot]');
    if (!el || !root().contains(el)) return false;
    const nameEl = document.querySelector('#cr-name'); if (nameEl) C.look.name = nameEl.value;
    const bn = document.querySelector('#cr-botname'); if (bn) C.bot.name = bn.value;
    const lk = C.look;
    if (el.dataset.crtab) { C.tab = el.dataset.crtab; root().scrollTop = 0; C.render(); return true; }
    if (el.dataset.face != null) { C.facing = el.dataset.face || null; C.render(); return true; }
    if (el.dataset.walk) { C.walk = C.walk === false; C.render(); return true; }
    if (el.dataset.kit) { C.kit[el.dataset.kit] = el.dataset.id || null; AF.sfx('card'); C.render(); return true; }
    if (el.dataset.undye) { delete lk.dye[el.dataset.undye]; C.render(); return true; }
    if (el.dataset.construct) {
      C.con = el.dataset.construct; AF.sfx('card');
      if (!C.botTouched) { const d = AF.defaultBot(C.con); Object.assign(C.bot, { chassis: d.chassis, head: d.head, eyes: d.eyes, antenna: d.antenna }); }
      C.render(); return true;
    }
    if (el.dataset.bot) { if (AF.botEditorClick(C.bot, lk, el)) { C.botTouched = true; AF.sfx('card'); C.render(); } return true; }
    if (el.dataset.look) {
      const f = el.dataset.look;
      if (el.dataset.tog) lk[f] = !(f === 'blush' ? lk.blush !== false : lk[f] == null ? fem() : lk[f]);
      else lk[f] = +el.dataset.i;
      C.render(); return true;
    }
    const act = el.dataset.cr;
    if (act === 'botname') { C.bot.name = AF.BOT_NAMES[Math.floor(Math.random() * AF.BOT_NAMES.length)]; C.render(); return true; }
    if (act === 'botrandom') { AF.randomBot(C.bot); C.botTouched = true; C.render(); return true; }
    if (act === 'random') {
      // Randomizes only the tab you're on. The Construct itself is never picked for you.
      if (C.tab === 'pilot') { C.look = Object.assign(AF.randomLook(), { name: lk.name, dye: lk.dye }); C.skinT = null; }
      else if (C.tab === 'outfit') {
        const hue = () => '#' + [0, 1, 2].map(() => Math.floor(40 + Math.random() * 170).toString(16).padStart(2, '0')).join('');
        if (C.mode === 'new') { Object.entries(AF.STARTER_POOL).forEach(([slot, list]) => { C.kit[slot] = list[Math.floor(Math.random() * list.length)]; }); if (!C.kit.top) C.kit.top = 'basic_tee'; }
        C.wornIds().forEach((id) => { if (Math.random() < 0.6) lk.dye[id] = { a: hue(), b: hue() }; else delete lk.dye[id]; });
      } else { AF.randomBot(C.bot); C.botTouched = true; }
      AF.sfx('card'); C.render(); return true;
    }
    if (act === 'cancel') { C.close(); C.onCancel && C.onCancel(); return true; }
    if (act === 'done' && C.mode === 'new' && !C.con) { C.warn = true; C.tab = 'bot'; C.render(); const sec = document.querySelector('#cr-con'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); return true; }
    if (act === 'done') {
      lk.name = (lk.name || '').trim().slice(0, 16) || 'Pilot';
      lk.body = AF.lookShape(lk) >= 0.5 ? 'f' : 'm';
      C.close();
      if (C.mode === 'new') { C.bot.name = (C.bot.name || '').trim().slice(0, 14) || 'Rivet'; C.onDone(lk, C.wornIds(), C.con, C.bot); }
      else C.onDone(lk);
      return true;
    }
    return false;
  };
})();
