/* Automata: ArcForge — the pilot avatar.
   A big-headed chibi drawn from base features (body, skin, hair, eyes) plus every item worn.
   Change an item and the character changes with it. */
(function () {
  const AF = (window.AF = window.AF || {});

  const L = (AF.LOOK = {
    skin: ['#fde0c8', '#f2c8a2', '#d9a074', '#b07448', '#7c4c2c', '#523020'],
    hairColor: ['#2a1e1a', '#5a3a24', '#9a5a2a', '#e0a840', '#f4e0a0', '#c83a2a', '#ff7ab8', '#4a8ce8', '#5ac878', '#e8ecf4', '#8a5ad8', '#3a3a4a'],
    eyeColor: ['#3a2a20', '#2a5ad8', '#2a9a5a', '#8a4ad8', '#d8402a', '#e0a020'],
    hair: ['Swoop', 'Spiky', 'Messy', 'Bob', 'Long', 'Ponytail', 'Twin tails', 'Bun', 'Mohawk', 'Curly'],
    eyes: ['Classic', 'Sparkle', 'Sleepy', 'Sharp', 'Dot'],
    core: [['#ffd75e', 'Solar'], ['#5ef2e1', 'Arc blue'], ['#ff6b5c', 'Ember'], ['#7ee08a', 'Toxic'], ['#c27bff', 'Void'], ['#7fb8ff', 'Glacier'], ['#ff9ad5', 'Bubblegum'], ['#ffffff', 'Starlight']],
  });
  AF.defaultLook = (body) => ({ name: '', body: body || 'f', skin: 1, hair: body === 'm' ? 0 : 5, hairColor: 2, eyes: 0, eyeColor: 0, core: 1 });
  AF.randomLook = function () {
    const p = (n) => Math.floor(Math.random() * n), body = Math.random() < 0.5 ? 'm' : 'f';
    return { name: '', body, skin: p(L.skin.length), hair: p(L.hair.length), hairColor: p(L.hairColor.length), eyes: p(L.eyes.length), eyeColor: p(L.eyeColor.length), core: p(L.core.length) };
  };
  // NPC helper: base features + a list of worn item ids.
  AF.npcLook = (o, items) => { const out = {}; (items || []).forEach((id) => { const it = AF.ITEMS[id]; if (it && it.slot !== 'charm') out[it.slot] = id; }); return Object.assign({ name: '', body: 'm', skin: 1, hair: 0, hairColor: 1, eyes: 0, eyeColor: 0, core: 1 }, o, { outfit: out }); };
  AF.coreColor = (look) => L.core[(look && look.core) || 0][0];
  const mix = (c, a) => AF.shadeHex(c, a);

  // ---------- Drawing ----------
  // cx = centre x, fy = feet y, H = height in px. phase advances π per tile walked.
  AF.drawPilotAt = function (g, cx, fy, H, look, dir, phase, opt) {
    opt = opt || {};
    const out = look.outfit || {}, V = (k) => (out[k] && AF.ITEMS[out[k]] && AF.ITEMS[out[k]].vis) || null;
    const hat = V('hat'), face = V('face'), top = V('top') || { s: 'tee', a: '#f2f2f2', b: '#dddddd' }, bot = V('bottom') || { s: 'shorts', a: '#8a8aa0', b: '#6a6a80' };
    const shoes = V('shoes'), gloves = V('gloves'), cape = V('cape'), tool = V('tool');
    g.save();
    if (dir === 'right') { g.translate(cx, 0); g.scale(-1, 1); g.translate(-cx, 0); dir = 'left'; }
    g.translate(cx, fy - H); g.scale(H, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const OL = '#2a1a2a', LW = 0.02; g.strokeStyle = OL; g.lineWidth = LW;
    const sk = L.skin[look.skin || 0], hc = L.hairColor[look.hairColor || 0], ec = L.eyeColor[look.eyeColor || 0];
    const f = look.body === 'f', side = dir === 'left', back = dir === 'up';
    const moving = !!opt.moving, s1 = Math.sin(phase || 0);
    const bob = moving ? Math.abs(Math.cos(phase || 0)) * 0.022 : Math.sin((opt.t || 0) / 520) * 0.006;
    const P = () => g.beginPath();
    const fs = (c, st) => { g.fillStyle = c; g.fill(); if (st !== false) g.stroke(); };
    const rr = (x, y, w, h, r, c, st) => { P(); g.roundRect(x, y, w, h, r); fs(c, st); };
    const el = (x, y, rx, ry, c, st) => { P(); g.ellipse(x, y, rx, ry, 0, 0, 7); fs(c, st); };
    const vg = (c, y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, mix(c, 24)); gr.addColorStop(1, mix(c, -18)); return gr; };
    const core = AF.coreColor(look);

    // shadow
    g.fillStyle = 'rgba(20,16,30,.24)'; P(); g.ellipse(0, 0.985, side ? 0.16 : 0.19, 0.036, 0, 0, 7); g.fill();
    g.translate(0, -bob);
    const tw = side ? 0.2 : f ? 0.24 : 0.27, T0 = 0.535, T1 = 0.77;

    // ----- back layer: capes, wings, packs, long hair -----
    const capeSway = moving ? s1 * 0.03 : Math.sin((opt.t || 0) / 700) * 0.01;
    const drawBack = (front) => {
      if (!cape) return;
      const a = cape.a, b = cape.b;
      if (cape.s === 'cape') {
        if (front) { if (back) { P(); g.moveTo(-0.15, T0); g.lineTo(0.15, T0); g.lineTo(0.2 + capeSway, 0.93); g.quadraticCurveTo(0, 0.96, -0.2 + capeSway, 0.93); g.closePath(); fs(vg(a, T0, 0.93)); rr(-0.15, T0 - 0.01, 0.3, 0.04, 0.02, b); } return; }
        P(); if (side) { g.moveTo(0.02, T0); g.lineTo(0.22 + capeSway, 0.92); g.lineTo(0.06, 0.9); } else { g.moveTo(-0.16, T0); g.lineTo(0.16, T0); g.lineTo(0.22, 0.9); g.lineTo(-0.22, 0.9); } g.closePath(); fs(mix(a, -25));
      } else if (cape.s === 'wings') {
        if (front && !back) return;
        const wing = (dx) => { P(); g.moveTo(dx * 0.06, T0 + 0.04); g.quadraticCurveTo(dx * 0.42, T0 - 0.2 + capeSway, dx * 0.48, T0 + 0.02); g.quadraticCurveTo(dx * 0.36, T0 + 0.1, dx * 0.4, T0 + 0.2); g.quadraticCurveTo(dx * 0.22, T0 + 0.14, dx * 0.06, T0 + 0.12); g.closePath(); fs(vg(a, T0 - 0.2, T0 + 0.2)); P(); g.moveTo(dx * 0.08, T0 + 0.06); g.lineTo(dx * 0.44, T0); g.strokeStyle = b; g.stroke(); g.strokeStyle = OL; };
        if (side) wing(1); else { wing(-1); wing(1); }
      } else if (cape.s === 'backpack') {
        if (front) { if (back) rr(-0.13, T0 + 0.01, 0.26, 0.22, 0.06, vg(a, T0, T0 + 0.22)), rr(-0.1, T0 + 0.1, 0.2, 0.08, 0.03, b); return; }
        if (side) rr(0.08, T0 + 0.01, 0.12, 0.2, 0.05, vg(a, T0, T0 + 0.2));
      } else if (cape.s === 'jetpack') {
        const flame = moving && Math.floor((opt.t || 0) / 80) % 2;
        if (front) { if (back) { rr(-0.17, T0, 0.14, 0.24, 0.05, vg(a, T0, T0 + 0.24)); rr(0.03, T0, 0.14, 0.24, 0.05, vg(a, T0, T0 + 0.24)); if (moving) { el(-0.1, T0 + 0.29, 0.035, 0.05 + flame * 0.02, b, false); el(0.1, T0 + 0.29, 0.035, 0.05 + flame * 0.02, b, false); } } return; }
        if (side) rr(0.08, T0, 0.12, 0.24, 0.05, vg(a, T0, T0 + 0.24)); else { rr(-0.22, T0 - 0.01, 0.08, 0.12, 0.04, a); rr(0.14, T0 - 0.01, 0.08, 0.12, 0.04, a); }
      } else if (cape.s === 'scarf') {
        if (!front && (back || side)) { P(); g.moveTo(0.02, T0 + 0.01); g.quadraticCurveTo(0.2 + capeSway, T0 + 0.06, 0.26 + capeSway * 2, T0 + 0.16); g.lineTo(0.2 + capeSway * 2, T0 + 0.2); g.quadraticCurveTo(0.14, T0 + 0.1, 0.0, T0 + 0.05); g.closePath(); fs(a); }
      }
    };
    drawBack(false);
    const hairStyle = (() => {
      const h = L.hair[look.hair || 0];
      const tucks = hat && ['beanie', 'chef', 'hardhat', 'miner', 'knight', 'bandana', 'aviator', 'tophat', 'wizard', 'cowboy', 'beret', 'visorcap', 'cap'].includes(hat.s);
      return tucks && ['Spiky', 'Mohawk', 'Bun', 'Curly', 'Messy'].includes(h) ? 'Swoop' : h;
    })();
    const hx = side ? -0.02 : 0, hy = 0.285, hr = 0.255;
    if (!side && hairStyle === 'Long') rr(-0.27, hy - 0.04, 0.54, back ? 0.46 : 0.4, 0.14, vg(hc, hy, hy + 0.4));
    if (!side && hairStyle === 'Bob') rr(-0.275, hy - 0.02, 0.55, 0.27, 0.12, vg(hc, hy, hy + 0.27));
    if (hairStyle === 'Twin tails') { const tt = (x) => { P(); g.moveTo(x, hy + 0.02); g.quadraticCurveTo(x + Math.sign(x) * 0.12, hy + 0.2, x + Math.sign(x) * 0.04, hy + 0.36); g.quadraticCurveTo(x - Math.sign(x) * 0.02, hy + 0.2, x, hy + 0.02); fs(hc); }; if (side) tt(0.18); else { tt(-0.25); tt(0.25); } }
    if (back && hairStyle === 'Ponytail') { P(); g.moveTo(-0.05, hy + 0.05); g.quadraticCurveTo(0.1, hy + 0.28, 0, hy + 0.4); g.quadraticCurveTo(-0.1, hy + 0.28, -0.05, hy + 0.05); fs(hc); }

    // ----- legs, bottoms, shoes -----
    const legY = T1 - 0.01, legLen = 0.2;
    const leg = (x, lift, far) => {
      const c = (k) => (far ? mix(k, -22) : k), y1 = legY + legLen - lift;
      const bare = bot.s === 'shorts' || bot.s === 'skirt';
      rr(x - 0.042, legY, 0.084, legLen - lift, 0.035, c(bare ? sk : bot.a));
      if (bot.s === 'shorts') rr(x - 0.05, legY - 0.005, 0.1, 0.07, 0.025, c(bot.a));
      if (bot.s === 'checker' && !far) { g.fillStyle = bot.b; for (let i = 0; i < 3; i++) g.fillRect(x - 0.035 + (i % 2) * 0.035, legY + 0.02 + i * 0.05, 0.035, 0.035); }
      if (bot.s === 'cargo' && !far) rr(x - 0.04, legY + 0.07, 0.05, 0.05, 0.01, c(bot.b));
      if (bot.s === 'greaves') rr(x - 0.05, legY + 0.06, 0.1, 0.1, 0.03, c(bot.b === '#5ef2e1' ? mix(bot.a, 30) : bot.b));
      // shoes
      const sx = x + (side ? -0.025 : 0);
      if (!shoes) { el(sx, y1, 0.045, 0.025, c(sk)); return; }
      if (shoes.s === 'boots') { rr(x - 0.05, y1 - 0.07, 0.1, 0.08, 0.025, c(shoes.a)); el(sx, y1, side ? 0.07 : 0.058, 0.035, c(shoes.a)); rr(x - 0.05, y1 - 0.075, 0.1, 0.025, 0.01, c(shoes.b), false); }
      else if (shoes.s === 'flats') { el(sx, y1, side ? 0.06 : 0.05, 0.028, c(shoes.a)); if (!side) el(sx, y1 - 0.02, 0.018, 0.012, c(shoes.b), false); }
      else if (shoes.s === 'rocket') { el(sx, y1, side ? 0.07 : 0.06, 0.036, c(shoes.a)); rr(x - 0.05, y1 - 0.045, 0.1, 0.025, 0.01, c(shoes.b), false); if (moving) el(x, y1 + 0.05, 0.03, 0.04, '#ffb040', false); }
      else { el(sx, y1, side ? 0.066 : 0.056, 0.033, c(shoes.a)); P(); g.ellipse(sx, y1 + 0.012, side ? 0.064 : 0.054, 0.016, 0, 0, Math.PI); g.fillStyle = c(shoes.b); g.fill(); }
    };
    if (side) { const sw = moving ? s1 * 0.07 : 0; leg(-sw, moving ? Math.max(0, -s1) * 0.03 : 0, true); leg(sw, moving ? Math.max(0, s1) * 0.03 : 0); }
    else { leg(-0.055, moving ? Math.max(0, s1) * 0.035 : 0); leg(0.055, moving ? Math.max(0, -s1) * 0.035 : 0); }
    if (bot.s === 'skirt') { P(); g.moveTo(-tw / 2 + 0.01, T1 - 0.04); g.lineTo(tw / 2 - 0.01, T1 - 0.04); g.lineTo(tw / 2 + 0.06, T1 + 0.08); g.quadraticCurveTo(0, T1 + 0.11, -tw / 2 - 0.06, T1 + 0.08); g.closePath(); fs(vg(bot.a, T1 - 0.04, T1 + 0.1)); P(); g.moveTo(-tw / 2 - 0.05, T1 + 0.07); g.quadraticCurveTo(0, T1 + 0.1, tw / 2 + 0.05, T1 + 0.07); g.strokeStyle = bot.b; g.stroke(); g.strokeStyle = OL; }

    // ----- arms (far arm first in side view) -----
    const sleeveCol = ['vest', 'apron', 'overalls'].includes(top.s) ? top.b : top.s === 'armor' ? '#4a4e5a' : top.a;
    const drawTool = () => {
      if (!tool) return;
      g.save(); g.translate(0, 0.18); g.rotate(-0.5);
      const a = tool.a, b = tool.b;
      switch (tool.s) {
        case 'wrench': rr(-0.018, -0.2, 0.036, 0.22, 0.015, a); P(); g.arc(0, -0.22, 0.045, 0, 7); fs(a); el(0, -0.24, 0.02, 0.025, mix(a, 40), false); break;
        case 'hammer': rr(-0.016, -0.22, 0.032, 0.25, 0.012, b); rr(-0.07, -0.27, 0.14, 0.07, 0.015, vg(a, -0.27, -0.2)); break;
        case 'sword': rr(-0.02, -0.34, 0.04, 0.3, 0.02, vg(a, -0.34, -0.04)); rr(-0.06, -0.06, 0.12, 0.03, 0.01, b); rr(-0.014, -0.04, 0.028, 0.07, 0.01, '#6a4a2a'); break;
        case 'staff': rr(-0.015, -0.34, 0.03, 0.4, 0.015, a); el(0, -0.36, 0.05, 0.05, b); el(-0.015, -0.375, 0.015, 0.015, '#ffffff', false); break;
        case 'lantern': P(); g.moveTo(0, 0.0); g.lineTo(0, -0.04); g.stroke(); rr(-0.045, 0.0, 0.09, 0.1, 0.02, a); rr(-0.03, 0.015, 0.06, 0.07, 0.015, b, false); break;
        case 'spatula': rr(-0.014, -0.18, 0.028, 0.2, 0.01, '#6a4a2a'); rr(-0.045, -0.29, 0.09, 0.12, 0.02, vg(b, -0.29, -0.17)); break;
      }
      g.restore();
    };
    const arm = (x, ang, far, withTool) => {
      g.save(); g.translate(x, T0 + 0.025); g.rotate(ang);
      const sc = far ? mix(sleeveCol, -22) : sleeveCol;
      rr(-0.035, 0, 0.07, top.s === 'tee' || top.s === 'vest' || top.s === 'apron' || top.s === 'overalls' ? 0.075 : 0.13, 0.03, sc);
      if (top.s === 'tee' || top.s === 'vest' || top.s === 'apron' || top.s === 'overalls') rr(-0.03, 0.06, 0.06, 0.08, 0.03, far ? mix(sk, -18) : sk);
      if (withTool) drawTool();
      if (gloves) { if (gloves.s === 'gauntlets') { rr(-0.05, 0.11, 0.1, 0.05, 0.02, gloves.b, false); el(0, 0.17, 0.05, 0.05, far ? mix(gloves.a, -22) : gloves.a); } else el(0, 0.16, 0.042, 0.042, far ? mix(gloves.a, -22) : gloves.a); }
      else el(0, 0.16, 0.038, 0.038, far ? mix(sk, -18) : sk);
      g.restore();
    };
    if (side) arm(0.02, moving ? -s1 * 0.6 : 0.12, true, false);

    // ----- torso & top -----
    const coatLong = top.s === 'coat' || top.s === 'dress';
    const tb = coatLong ? 0.33 : T1 - T0 + 0.01;
    if (top.s === 'dress') { P(); g.moveTo(-tw / 2, T0 + 0.12); g.lineTo(tw / 2, T0 + 0.12); g.lineTo(tw / 2 + 0.08, T0 + 0.32); g.quadraticCurveTo(0, T0 + 0.36, -tw / 2 - 0.08, T0 + 0.32); g.closePath(); fs(vg(top.a, T0, T0 + 0.34)); P(); g.moveTo(-tw / 2 - 0.07, T0 + 0.31); g.quadraticCurveTo(0, T0 + 0.35, tw / 2 + 0.07, T0 + 0.31); g.strokeStyle = top.b; g.lineWidth = 0.025; g.stroke(); g.strokeStyle = OL; g.lineWidth = LW; }
    const bodyCol = top.s === 'apron' || top.s === 'overalls' ? top.b : top.s === 'vest' ? top.b : top.a;
    rr(-tw / 2, T0, tw, top.s === 'dress' ? 0.14 : tb, 0.07, vg(top.s === 'armor' ? '#4a4e5a' : bodyCol, T0, T0 + tb));
    if (!back) {
      switch (top.s) {
        case 'tee': P(); g.arc(0, T0 + 0.005, 0.045, 0.2, Math.PI - 0.2); g.strokeStyle = mix(top.a, -40); g.stroke(); g.strokeStyle = OL; if (top.b && !side) el(0, T0 + 0.11, 0.035, 0.035, top.b, false); break;
        case 'vest': if (!side) { rr(-tw / 2, T0, tw * 0.38, tb, 0.05, vg(top.a, T0, T1)); rr(tw / 2 - tw * 0.38, T0, tw * 0.38, tb, 0.05, vg(top.a, T0, T1)); } else rr(-tw / 2, T0, tw * 0.6, tb, 0.05, top.a); break;
        case 'jacket': if (!side) { rr(-tw / 2, T0, tw * 0.42, tb, 0.06, vg(top.a, T0, T1)); rr(tw / 2 - tw * 0.42, T0, tw * 0.42, tb, 0.06, vg(top.a, T0, T1)); rr(-tw / 2 - 0.005, T0 - 0.01, tw + 0.01, 0.045, 0.02, top.b); } else rr(-tw / 2, T0 - 0.01, tw, 0.045, 0.02, top.b); break;
        case 'hoodie': if (!side) { rr(-0.07, T0 + 0.12, 0.14, 0.07, 0.03, mix(top.a, -18)); P(); g.moveTo(-0.035, T0 + 0.01); g.lineTo(-0.035, T0 + 0.08); g.moveTo(0.035, T0 + 0.01); g.lineTo(0.035, T0 + 0.08); g.strokeStyle = top.b; g.stroke(); g.strokeStyle = OL; } break;
        case 'sweater': g.save(); P(); g.roundRect(-tw / 2, T0, tw, tb, 0.07); g.clip(); g.fillStyle = top.b; for (let y = T0 + 0.05; y < T1; y += 0.07) g.fillRect(-0.2, y, 0.4, 0.025); g.restore(); break;
        case 'apron': case 'overalls': { const c = top.a; rr(-tw * 0.36, T0 + 0.06, tw * 0.72, tb - 0.04, 0.04, vg(c, T0, T1)); if (!side) { rr(-tw * 0.36, T0, 0.03, 0.07, 0.01, c, false); rr(tw * 0.36 - 0.03, T0, 0.03, 0.07, 0.01, c, false); if (top.s === 'overalls') { el(-tw * 0.3, T0 + 0.07, 0.012, 0.012, '#f8d048', false); el(tw * 0.3, T0 + 0.07, 0.012, 0.012, '#f8d048', false); } else rr(-0.04, T0 + 0.13, 0.08, 0.05, 0.015, mix(c, -18)); } break; }
        case 'coat': if (!side) { P(); g.moveTo(0, T0 + 0.02); g.lineTo(0, T0 + tb); g.stroke(); [0.06, 0.13, 0.2].forEach((y) => el(0.03, T0 + y, 0.01, 0.01, top.b, false)); rr(-tw / 2 - 0.005, T0 - 0.01, tw + 0.01, 0.04, 0.02, top.b); } break;
        case 'armor': rr(-tw / 2 + 0.02, T0 + 0.02, tw - 0.04, 0.16, 0.05, vg(top.a, T0, T0 + 0.18)); el(0, T0 + 0.09, 0.03, 0.03, top.b); el(-tw / 2 - 0.02, T0 + 0.03, 0.06, 0.045, vg(top.a, T0 - 0.02, T0 + 0.07)); el(tw / 2 + 0.02, T0 + 0.03, 0.06, 0.045, vg(top.a, T0 - 0.02, T0 + 0.07)); break;
        case 'dress': rr(-tw / 2, T0 + 0.1, tw, 0.035, 0.015, top.b, false); break;
      }
    } else {
      if (top.s === 'hoodie') rr(-0.1, T0 - 0.01, 0.2, 0.07, 0.035, mix(top.a, -18));
      if (top.s === 'armor') { el(-tw / 2 - 0.02, T0 + 0.03, 0.06, 0.045, top.a); el(tw / 2 + 0.02, T0 + 0.03, 0.06, 0.045, top.a); }
    }
    drawBack(true);
    if (cape && cape.s === 'scarf' && !back) { rr(side ? -0.11 : -0.14, T0 - 0.025, side ? 0.22 : 0.28, 0.06, 0.03, cape.a); if (!side) rr(0.04, T0 + 0.01, 0.06, 0.14, 0.03, cape.b); }
    // near arms
    if (side) arm(-0.02, moving ? s1 * 0.6 : -0.08, false, true);
    else { const a = moving ? s1 * 0.45 : 0.06; arm(-tw / 2 - 0.015, a + 0.1, false, false); arm(tw / 2 + 0.015, -a - 0.1, false, !back); }
    if (back && tool) { g.save(); g.translate(-tw / 2 - 0.03, T0 + 0.12); drawTool(); g.restore(); }

    // ----- head (big!) -----
    rr(hx - 0.04, 0.5, 0.08, 0.06, 0.02, mix(sk, -18), false);
    if (!side) { el(hx - hr + 0.01, hy + 0.04, 0.035, 0.05, sk); el(hx + hr - 0.01, hy + 0.04, 0.035, 0.05, sk); }
    P(); g.ellipse(hx, hy, hr, hr * 0.94, 0, 0, 7);
    const hg = g.createRadialGradient(hx - 0.07, hy - 0.06, 0.02, hx, hy, hr); hg.addColorStop(0, mix(sk, 18)); hg.addColorStop(1, mix(sk, -10)); fs(hg);
    // face
    const eyeStyle = L.eyes[look.eyes || 0];
    const eye = (x, y, mirror) => {
      if (opt.blink || eyeStyle === 'Sleepy') {
        if (eyeStyle === 'Sleepy' && !opt.blink) { P(); g.ellipse(x, y + 0.01, 0.034, 0.03, 0, 0, Math.PI); fs('#2a1a2a', false); el(x, y + 0.02, 0.018, 0.014, ec, false); P(); g.moveTo(x - 0.04, y + 0.005); g.lineTo(x + 0.04, y + 0.005); g.lineWidth = 0.016; g.stroke(); g.lineWidth = LW; return; }
        P(); g.moveTo(x - 0.035, y + 0.01); g.quadraticCurveTo(x, y + 0.03, x + 0.035, y + 0.01); g.lineWidth = 0.018; g.stroke(); g.lineWidth = LW; return;
      }
      if (eyeStyle === 'Dot') { el(x, y + 0.01, 0.022, 0.026, '#2a1a2a', false); el(x + 0.007, y + 0.002, 0.008, 0.008, '#fff', false); return; }
      const big = eyeStyle === 'Sparkle', rx = big ? 0.042 : eyeStyle === 'Sharp' ? 0.034 : 0.037, ry = big ? 0.066 : eyeStyle === 'Sharp' ? 0.045 : 0.058;
      el(x, y, rx, ry, '#2a1a2a', false);
      P(); g.ellipse(x, y + ry * 0.3, rx * 0.78, ry * 0.58, 0, 0, 7); fs(ec, false);
      el(x + rx * 0.3, y - ry * 0.4, rx * 0.42, ry * 0.28, '#ffffff', false);
      if (big) el(x - rx * 0.35, y + ry * 0.45, rx * 0.2, rx * 0.2, '#ffffff', false);
      if (eyeStyle === 'Sharp') { P(); g.moveTo(x - 0.05 * mirror, y - 0.075); g.lineTo(x + 0.035 * mirror, y - 0.05); g.lineWidth = 0.022; g.strokeStyle = mix(hc, -20); g.stroke(); g.strokeStyle = OL; g.lineWidth = LW; }
      if (f && eyeStyle !== 'Sharp') { P(); g.moveTo(x + rx * 0.8 * mirror, y - ry * 0.55); g.lineTo(x + rx * 1.35 * mirror, y - ry * 0.85); g.lineWidth = 0.016; g.stroke(); g.lineWidth = LW; }
    };
    if (!back) {
      const ey = hy + 0.045;
      if (side) {
        eye(-0.12, ey, -1); el(-0.15, ey + 0.08, 0.03, 0.017, 'rgba(255,120,140,.45)', false);
        P(); g.arc(-0.17, ey + 0.1, 0.018, 0.3, Math.PI - 0.3); g.stroke(); el(0.07, hy + 0.05, 0.035, 0.05, sk);
      } else {
        eye(-0.09, ey, -1); eye(0.09, ey, 1);
        el(-0.145, ey + 0.075, 0.035, 0.018, 'rgba(255,120,140,.45)', false); el(0.145, ey + 0.075, 0.035, 0.018, 'rgba(255,120,140,.45)', false);
        P(); g.arc(0, ey + 0.085, 0.022, 0.4, Math.PI - 0.4); g.stroke();
      }
      if (eyeStyle !== 'Sharp' && !hat) { g.strokeStyle = mix(hc, -15); g.lineWidth = 0.016; P(); if (side) { g.moveTo(-0.15, ey - 0.08); g.lineTo(-0.09, ey - 0.085); } else { g.moveTo(-0.12, ey - 0.085); g.lineTo(-0.06, ey - 0.09); g.moveTo(0.06, ey - 0.09); g.lineTo(0.12, ey - 0.085); } g.stroke(); g.strokeStyle = OL; g.lineWidth = LW; }
    }
    // face items
    if (face && !back) {
      const a = face.a, b = face.b, ey = hy + 0.045;
      switch (face.s) {
        case 'glasses': g.lineWidth = 0.016; P(); if (side) g.arc(-0.12, ey, 0.05, 0, 7); else { g.arc(-0.09, ey, 0.05, 0, 7); g.moveTo(0.14, ey); g.arc(0.09, ey, 0.05, 0, 7); g.moveTo(-0.04, ey); g.lineTo(0.04, ey); } g.strokeStyle = a; g.stroke(); g.strokeStyle = OL; g.lineWidth = LW; break;
        case 'goggles': rr(hx - hr, ey - 0.03, hr * 2, 0.05, 0.02, b); (side ? [-0.12] : [-0.09, 0.09]).forEach((x) => { el(x, ey, 0.06, 0.055, b); el(x, ey, 0.045, 0.04, a); el(x + 0.015, ey - 0.015, 0.012, 0.01, '#fff', false); }); break;
        case 'hearts': (side ? [-0.12] : [-0.09, 0.09]).forEach((x) => { P(); g.moveTo(x, ey + 0.05); g.bezierCurveTo(x - 0.08, ey - 0.0, x - 0.04, ey - 0.06, x, ey - 0.02); g.bezierCurveTo(x + 0.04, ey - 0.06, x + 0.08, ey, x, ey + 0.05); fs(a); }); if (!side) { P(); g.moveTo(-0.03, ey - 0.01); g.lineTo(0.03, ey - 0.01); g.stroke(); } break;
        case 'eyepatch': P(); g.moveTo(hx - hr, ey - 0.1); g.lineTo(hx + hr, ey + 0.02); g.lineWidth = 0.014; g.stroke(); g.lineWidth = LW; el(side ? -0.12 : 0.09, ey, 0.05, 0.05, a); break;
        case 'mask': P(); g.moveTo(hx - hr * 0.85, ey + 0.04); g.quadraticCurveTo(hx, ey + 0.03, hx + (side ? 0.02 : hr * 0.85), ey + 0.04); g.lineTo(hx + (side ? 0.0 : hr * 0.7), ey + 0.16); g.quadraticCurveTo(hx, ey + 0.21, hx - hr * 0.7, ey + 0.16); g.closePath(); fs(vg(a, ey, ey + 0.2)); break;
        case 'monocle': g.lineWidth = 0.018; P(); g.arc(side ? -0.12 : 0.09, ey, 0.05, 0, 7); g.strokeStyle = a; g.stroke(); P(); g.moveTo(side ? -0.12 : 0.12, ey + 0.05); g.quadraticCurveTo(0.15, ey + 0.15, 0.1, ey + 0.22); g.lineWidth = 0.008; g.stroke(); g.strokeStyle = OL; g.lineWidth = LW; break;
      }
    }
    // ----- hair (front) -----
    const hgr = () => { const gr = g.createLinearGradient(0, hy - hr, 0, hy + 0.12); gr.addColorStop(0, mix(hc, 32)); gr.addColorStop(1, mix(hc, -16)); return gr; };
    const cap = (low) => {
      P();
      if (back) { g.ellipse(hx, hy, hr + 0.012, hr * 0.94 + 0.012, 0, 0, 7); }
      else if (side) { g.ellipse(hx, hy, hr + 0.01, hr * 0.94 + 0.01, 0, Math.PI * 1.0, Math.PI * 2.35); g.quadraticCurveTo(hx + 0.06, hy + 0.05, hx + 0.0, hy - 0.04); g.quadraticCurveTo(hx - 0.1, hy - 0.11, hx - hr - 0.01, hy - 0.0); }
      else {
        const d = low || 0; g.moveTo(-hr - 0.012, hy + 0.06); g.ellipse(hx, hy, hr + 0.012, hr * 0.94 + 0.012, 0, Math.PI, 0); g.lineTo(hr + 0.012, hy + 0.06);
        g.quadraticCurveTo(0.2, hy - 0.04 + d, 0.13, hy - 0.02 + d); g.quadraticCurveTo(0.06, hy - 0.1 + d, -0.02, hy - 0.035 + d); g.quadraticCurveTo(-0.11, hy - 0.1 + d, -0.16, hy - 0.02 + d); g.quadraticCurveTo(-0.22, hy + 0.0, -hr - 0.012, hy + 0.06);
      }
      g.closePath(); fs(hgr());
      if (!back) { g.fillStyle = 'rgba(255,255,255,.28)'; P(); g.ellipse(hx - 0.06, hy - hr * 0.72, 0.08, 0.025, -0.3, 0, 7); g.fill(); }
    };
    switch (hairStyle) {
      case 'Spiky': cap(); P(); for (let i = -2; i <= 2; i++) { const x = hx + i * 0.09; g.moveTo(x - 0.06, hy - 0.18); g.lineTo(x + 0.02, hy - 0.34 + Math.abs(i) * 0.03); g.lineTo(x + 0.06, hy - 0.18); } fs(hgr()); break;
      case 'Messy': cap(); P(); [[-0.16, -0.2], [-0.05, -0.27], [0.08, -0.25], [0.18, -0.17]].forEach(([x, y]) => { g.moveTo(hx + x - 0.05, hy - 0.15); g.quadraticCurveTo(hx + x - 0.06, hy + y, hx + x + 0.04, hy + y - 0.02); g.quadraticCurveTo(hx + x, hy - 0.12, hx + x + 0.06, hy - 0.15); }); fs(hgr()); break;
      case 'Curly': cap(); for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i * 0.125); el(hx + Math.cos(a) * hr * 0.95, hy + Math.sin(a) * hr * 0.9, 0.07, 0.07, hgr()); } break;
      case 'Bob': cap(); if (!back && !side) { rr(-0.285, hy - 0.02, 0.09, 0.25, 0.04, hc); rr(0.195, hy - 0.02, 0.09, 0.25, 0.04, hc); } if (side) rr(0.0, hy - 0.04, 0.22, 0.26, 0.08, hc); break;
      case 'Long': cap(); if (!back && !side) { rr(-0.29, hy - 0.02, 0.09, 0.36, 0.04, hc); rr(0.2, hy - 0.02, 0.09, 0.36, 0.04, hc); } if (side) rr(-0.02, hy - 0.04, 0.25, 0.42, 0.1, vg(hc, hy, hy + 0.4)); break;
      case 'Ponytail': cap(); if (side) { P(); g.moveTo(0.2, hy - 0.06); g.quadraticCurveTo(0.42, hy + 0.04, 0.3, hy + 0.26); g.quadraticCurveTo(0.24, hy + 0.08, 0.16, hy + 0.04); fs(hc); } else if (!back) el(0.27, hy + 0.06, 0.045, 0.11, hc); break;
      case 'Bun': cap(); el(hx, hy - hr - 0.03, 0.085, 0.075, hgr()); break;
      case 'Mohawk': g.globalAlpha = 0.65; cap(-0.07); g.globalAlpha = 1; rr(hx - 0.04, hy - hr - 0.12, 0.08, 0.26, 0.035, hgr()); break;
      case 'Twin tails': cap(); break;
      default: cap();
    }
    // ----- hats -----
    if (hat) {
      const a = hat.a, b = hat.b;
      const dome = (c, y, r, h) => { P(); g.ellipse(hx, y, r, h || r * 0.9, 0, Math.PI, 0); g.closePath(); fs(vg(c, y - r, y)); };
      switch (hat.s) {
        case 'cap': dome(a, hy - 0.03, hr + 0.015); if (!back) { P(); if (side) g.ellipse(hx - 0.22, hy - 0.03, 0.14, 0.04, 0, 0, 7); else g.ellipse(hx, hy - 0.02, hr - 0.01, 0.055, 0, 0, Math.PI); fs(b); } el(hx, hy - hr * 0.95, 0.025, 0.015, b, false); break;
        case 'visorcap': dome(a, hy - 0.03, hr + 0.015); if (!back) { rr(hx - hr * (side ? 0.6 : 0.85), hy - 0.06, hr * (side ? 0.8 : 1.7), 0.06, 0.03, b); } break;
        case 'beanie': dome(a, hy - 0.02, hr + 0.02); rr(hx - hr - 0.02, hy - 0.07, hr * 2 + 0.04, 0.075, 0.035, b); el(hx, hy - hr - 0.05, 0.05, 0.05, b); break;
        case 'bandana': dome(a, hy - 0.0, hr + 0.012); [[-0.12, -0.12], [0.04, -0.19], [0.13, -0.08], [-0.02, -0.05]].forEach(([x, y]) => el(hx + x, hy + y, 0.014, 0.014, b, false)); if (!side) { el(hx + hr - 0.02, hy + 0.0, 0.05, 0.03, a); el(hx + hr + 0.03, hy + 0.03, 0.035, 0.05, a); } break;
        case 'hardhat': case 'miner': dome(a, hy - 0.03, hr + 0.025); rr(hx - hr - 0.04 - (side ? 0.05 : 0), hy - 0.05, (hr + 0.04) * 2, 0.05, 0.02, b === '#fff2a0' ? mix(a, -30) : b); rr(hx - 0.025, hy - hr - 0.03, 0.05, hr * 0.9, 0.02, b === '#fff2a0' ? mix(a, -30) : b, false);
          if (hat.s === 'miner' && !back) { el(hx + (side ? -0.12 : 0), hy - 0.15, 0.05, 0.045, b); } break;
        case 'aviator': dome(a, hy - 0.01, hr + 0.02); if (!back) { rr(hx - hr - 0.03, hy - 0.02, 0.07, 0.17, 0.03, a); if (!side) rr(hx + hr - 0.04, hy - 0.02, 0.07, 0.17, 0.03, a); rr(hx - hr - 0.01, hy - 0.06, hr * 2 + 0.02, 0.04, 0.02, b); } break;
        case 'knight': P(); g.ellipse(hx, hy - 0.01, hr + 0.03, hr + 0.01, 0, 0, 7); fs(vg(a, hy - hr, hy + hr)); if (!back) { P(); g.roundRect(hx - hr * (side ? 0.95 : 0.7), hy - 0.03, hr * (side ? 0.9 : 1.4), 0.17, 0.05); fs(sk); el(side ? -0.12 : -0.09, hy + 0.045, 0.03, 0.045, '#2a1a2a', false); if (!side) el(0.09, hy + 0.045, 0.03, 0.045, '#2a1a2a', false); }
          P(); g.moveTo(hx - 0.03, hy - hr - 0.0); g.quadraticCurveTo(hx + 0.05, hy - hr - 0.2, hx + 0.2, hy - hr - 0.1); g.quadraticCurveTo(hx + 0.08, hy - hr - 0.05, hx + 0.04, hy - hr + 0.02); fs(b); break;
        case 'bow': { const bx = hx + (side ? 0.05 : 0.13), by = hy - hr + 0.03; P(); g.moveTo(bx, by); g.quadraticCurveTo(bx - 0.13, by - 0.12, bx - 0.12, by + 0.05); g.closePath(); fs(a); P(); g.moveTo(bx, by); g.quadraticCurveTo(bx + 0.13, by - 0.12, bx + 0.12, by + 0.05); g.closePath(); fs(a); el(bx, by, 0.03, 0.03, b); break; }
        case 'chef': rr(hx - hr * 0.85, hy - 0.12, hr * 1.7, 0.1, 0.03, b); [[-0.11, -0.25, 0.11], [0.1, -0.25, 0.11], [0, -0.32, 0.13]].forEach(([x, y, r]) => el(hx + x, hy + y, r, r * 0.9, a)); rr(hx - hr * 0.85, hy - 0.12, hr * 1.7, 0.08, 0.03, a); break;
        case 'beret': P(); g.ellipse(hx + 0.03, hy - hr * 0.7, hr + 0.04, 0.1, -0.12, 0, 7); fs(vg(a, hy - hr - 0.1, hy - hr * 0.5)); el(hx + 0.05, hy - hr - 0.08, 0.02, 0.02, b); break;
        case 'cowboy': P(); g.ellipse(hx, hy - 0.08, hr + 0.15, 0.06, 0, 0, 7); fs(vg(a, hy - 0.12, hy - 0.02)); P(); g.roundRect(hx - hr * 0.7, hy - hr - 0.12, hr * 1.4, hr + 0.04, [0.08, 0.08, 0.02, 0.02]); fs(vg(a, hy - hr - 0.12, hy - 0.08)); rr(hx - hr * 0.7, hy - 0.13, hr * 1.4, 0.04, 0.01, b, false); break;
        case 'tophat': el(hx, hy - 0.1, hr + 0.06, 0.05, a); rr(hx - hr * 0.62, hy - hr - 0.22, hr * 1.24, hr + 0.14, 0.03, vg(a, hy - hr - 0.22, hy - 0.1)); rr(hx - hr * 0.62, hy - 0.17, hr * 1.24, 0.045, 0, b, false); break;
        case 'wizard': el(hx, hy - 0.1, hr + 0.1, 0.06, a); P(); g.moveTo(hx - hr * 0.75, hy - 0.11); g.quadraticCurveTo(hx, hy - 0.5, hx + 0.16, hy - 0.62); g.quadraticCurveTo(hx + 0.1, hy - 0.35, hx + hr * 0.75, hy - 0.11); g.closePath(); fs(vg(a, hy - 0.62, hy - 0.1)); el(hx + 0.02, hy - 0.3, 0.025, 0.025, b, false); el(hx - 0.07, hy - 0.18, 0.018, 0.018, b, false); break;
        case 'crown': P(); g.moveTo(hx - 0.16, hy - hr + 0.04); g.lineTo(hx - 0.17, hy - hr - 0.14); g.lineTo(hx - 0.08, hy - hr - 0.05); g.lineTo(hx, hy - hr - 0.18); g.lineTo(hx + 0.08, hy - hr - 0.05); g.lineTo(hx + 0.17, hy - hr - 0.14); g.lineTo(hx + 0.16, hy - hr + 0.04); g.closePath(); fs(vg(a, hy - hr - 0.18, hy - hr + 0.04)); el(hx, hy - hr - 0.02, 0.025, 0.025, b, false); break;
        case 'flowers': [-0.18, -0.09, 0, 0.09, 0.18].forEach((x, i) => { const y = hy - hr * 0.85 + Math.abs(x) * 0.5; el(hx + x, y, 0.045, 0.045, i % 2 ? '#ffd84a' : a); el(hx + x, y, 0.016, 0.016, '#ffffff', false); }); [-0.13, 0.04, 0.14].forEach((x) => el(hx + x, hy - hr * 0.78 + Math.abs(x) * 0.5, 0.03, 0.015, b, false)); break;
        case 'headphones': P(); g.ellipse(hx, hy, hr + 0.03, hr + 0.02, 0, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 0.04; g.strokeStyle = b; g.stroke(); g.lineWidth = LW; g.strokeStyle = OL; if (side) rr(hx + 0.02, hy - 0.02, 0.08, 0.13, 0.035, a); else { rr(hx - hr - 0.05, hy - 0.03, 0.08, 0.14, 0.035, a); rr(hx + hr - 0.03, hy - 0.03, 0.08, 0.14, 0.035, a); } break;
      }
    }
    g.restore();
  };

  // Menu helper: pilot standing in a box of height s with top-left (x, y).
  AF.drawPilot = function (g, x, y, s, look, t, dir) {
    AF.drawPilotAt(g, x + s * 0.36, y + s * 0.99, s * 0.97, look, dir || 'down', dir && t ? t / 180 : 0, { moving: !!(dir && t), t, blink: t ? (t % 3400) < 140 : false });
  };

  // ---------- Character creator (new pilot) and Salon (change hair/face later) ----------
  const C = (AF.Creator = { look: null, mode: 'new', outfit: 'tinker', con: null, raf: 0 });
  C.open = function (opts) {
    C.mode = opts.mode === 'boutique' ? 'salon' : opts.mode; C.state = opts.state || null; C.onDone = opts.onDone; C.onCancel = opts.onCancel;
    C.look = Object.assign(AF.defaultLook(Math.random() < 0.5 ? 'm' : 'f'), opts.look || {});
    if (C.mode === 'new') { C.con = null; C.warn = false; }
    document.querySelector('#creator').hidden = false;
    C.render();
    cancelAnimationFrame(C.raf);
    const loop = (t) => { C.drawPreview(t); if (!document.querySelector('#creator').hidden) C.raf = requestAnimationFrame(loop); };
    C.raf = requestAnimationFrame(loop);
  };
  C.close = function () { document.querySelector('#creator').hidden = true; cancelAnimationFrame(C.raf); };
  C.previewLook = function () {
    const o = {};
    const items = C.mode === 'new' ? AF.STARTER_OUTFITS[C.outfit].items : AF.equippedIds(C.state);
    items.forEach((id) => { const sl = AF.ITEMS[id].slot; if (sl !== 'charm') o[sl] = id; });
    if (C.mode === 'new' && !o.top) o.top = 'basic_tee';
    return Object.assign({}, C.look, { outfit: o });
  };
  C.drawPreview = function (t) {
    const cv = document.querySelector('#cr-preview'); if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const dirs = ['down', 'left', 'up', 'right'], dir = dirs[Math.floor(t / 1800) % 4];
    AF.drawPilotAt(g, w / 2, h - 16, Math.min(h * 0.84, w * 1.3), C.previewLook(), dir, t / 170, { moving: true, t, blink: (t % 3400) < 140 });
  };
  const sw = (field, list) => list.map((c, i) => `<button class="sw${C.look[field] === i ? ' on' : ''}" data-look="${field}" data-i="${i}" style="--c:${Array.isArray(c) ? c[0] : c}" aria-label="${field} ${i + 1}"></button>`).join('');
  const opts = (field, list) => list.map((n, i) => `<button class="opt${C.look[field] === i ? ' on' : ''}" data-look="${field}" data-i="${i}">${n}</button>`).join('');
  C.render = function () {
    const lk = C.look, isNew = C.mode === 'new';
    document.querySelector('#creator .cr').innerHTML = `
      <div class="cr-side">
        <h2>${isNew ? 'Create your pilot' : 'Salon'}</h2>
        <div class="cr-stage"><canvas id="cr-preview"></canvas></div>
        ${isNew ? `<label class="fld">Pilot name<input id="cr-name" maxlength="16" value="${AF.esc(lk.name)}" placeholder="Name your pilot" autocomplete="off"></label>` : `<p class="cr-name">${AF.esc(lk.name)}</p>`}
        <div class="row">${isNew ? '<button class="btn" data-cr="random">Randomize</button>' : ''}<button class="btn ghost" data-cr="cancel">${isNew ? 'Back' : 'Cancel'}</button><button class="btn primary" data-cr="done">${isNew ? 'Start adventure' : 'Save look'}</button></div>
      </div>
      <div class="cr-opts">
        <section><h3>Body</h3><div class="opts"><button class="opt${lk.body === 'm' ? ' on' : ''}" data-look="body" data-v="m">Male</button><button class="opt${lk.body === 'f' ? ' on' : ''}" data-look="body" data-v="f">Female</button></div></section>
        <section><h3>Skin</h3><div class="swatches">${sw('skin', L.skin)}</div></section>
        <section><h3>Hair</h3><div class="opts">${opts('hair', L.hair)}</div><div class="swatches">${sw('hairColor', L.hairColor)}</div></section>
        <section><h3>Eyes</h3><div class="opts">${opts('eyes', L.eyes)}</div><div class="swatches">${sw('eyeColor', L.eyeColor)}</div></section>
        ${isNew ? `<section><h3>Starting outfit</h3><p class="hint">You'll collect many more outfits as you play. Everything you wear shows on your pilot.</p><div class="opts">${Object.entries(AF.STARTER_OUTFITS).map(([k, o]) => `<button class="opt${C.outfit === k ? ' on' : ''}" data-outfit="${k}">${o.name}</button>`).join('')}</div></section>
        <section id="cr-con" class="${C.warn && !C.con ? 'need' : ''}"><h3>Your automaton's Construct</h3>${C.warn && !C.con ? '<p class="warn">Pick one to start your adventure.</p>' : ''}<p class="hint">Engineer Mara will build this for you. It decides your automaton's strengths and your 30-card starting deck. This choice is permanent for this pilot.</p>${AF.constructPicker(C.con, AF.coreColor(lk))}</section>
        <section><h3>Core glow</h3><div class="swatches">${sw('core', L.core)}</div></section>` : ''}
        <div class="row cr-end"><button class="btn ghost" data-cr="cancel">${isNew ? 'Back' : 'Cancel'}</button><button class="btn primary" data-cr="done">${isNew ? 'Start adventure' : 'Save look'}</button></div>
      </div>`;
  };
  C.handle = function (t) {
    const el = t.closest('[data-look],[data-cr],[data-outfit],[data-construct]');
    if (!el) return false;
    const nameEl = document.querySelector('#cr-name'); if (nameEl) C.look.name = nameEl.value;
    if (el.dataset.outfit) { C.outfit = el.dataset.outfit; C.render(); return true; }
    if (el.dataset.construct) { C.con = el.dataset.construct; AF.sfx('card'); C.render(); return true; }
    if (el.dataset.look) { C.look[el.dataset.look] = el.dataset.v || +el.dataset.i; C.render(); return true; }
    if (el.dataset.cr === 'random') { const n = C.look.name; C.look = AF.randomLook(); C.look.name = n; C.outfit = Object.keys(AF.STARTER_OUTFITS)[Math.floor(Math.random() * 3)]; C.con = C.con || Object.keys(AF.CONSTRUCTS)[Math.floor(Math.random() * 3)]; C.render(); return true; }
    if (el.dataset.cr === 'cancel') { C.close(); C.onCancel && C.onCancel(); return true; }
    if (el.dataset.cr === 'done' && C.mode === 'new' && !C.con) { C.warn = true; C.render(); const sec = document.querySelector('#cr-con'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); return true; }
    if (el.dataset.cr === 'done') { C.look.name = (C.look.name || '').trim().slice(0, 16) || 'Pilot'; C.close(); C.onDone(C.look, C.outfit, C.con); return true; }
    return false;
  };
})();
