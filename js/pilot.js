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
    hair: [['Buzz'], ['Short'], ['Spiky'], ['Curly'], ['Bob'], ['Long'], ['Ponytail'], ['Bun'], ['Mohawk', 30], ['Twin tails', 30]],
    top: [['Tee'], ['Jacket'], ['Hoodie'], ['Overalls'], ['Lab coat', 40], ['Flight suit', 50], ['Armor vest', 60]],
    bottom: [['Pants'], ['Shorts'], ['Skirt']],
    hat: [['None'], ['Cap'], ['Beanie'], ['Goggles'], ['Hard hat'], ['Bandana'], ['Headphones'],
          ['Antenna band', 25], ['Top hat', 35], ['Wizard hat', 45], ['Crown', 120]],
    acc: [['None'], ['Scarf'], ['Glasses'], ['Backpack'], ['Tool belt', 30], ['Cape', 55], ['Jetpack', 90]],
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

  // ---------- Pixel sprite: 16×24, four directions, three walk frames ----------
  // dir: 'down' | 'up' | 'left' | 'right'   frame: 0 = standing, 1/2 = steps
  const sprCache = {};
  AF.pilotSprite = function (look, dir, frame) {
    const key = JSON.stringify(look) + dir + frame;
    if (sprCache[key]) return sprCache[key];
    if (dir === 'right') return (sprCache[key] = AF.Pixel.flip(AF.pilotSprite(look, 'left', frame)));
    const P = AF.Pixel, c = P.canvas(18, 26), g = c.getContext('2d');
    g.translate(1, 1);
    const R = (x, y, w, h, col) => P.R(g, x, y, w, h, col);
    const sk = L.skin[look.skin], skD = P.shade(sk, -30), hc = L.hairColor[look.hairColor], hcD = P.shade(hc, -35), hcL = P.shade(hc, 40);
    const tc = L.color[look.topColor], tcD = P.shade(tc, -35), bc = L.color[look.bottomColor], bcD = P.shade(bc, -35);
    const f = look.body === 'f', top = L.top[look.top][0], hair = L.hair[look.hair][0], hat = L.hat[look.hat][0], acc = L.acc[look.acc][0];
    const EYE = '#202028', SHOE = '#383040', suit = top === 'Flight suit', bottom = suit ? 'Pants' : L.bottom[look.bottom][0];
    const legC = suit ? tc : bc, legD = suit ? tcD : bcD;
    const tucked = ['Cap', 'Beanie', 'Hard hat', 'Bandana', 'Top hat', 'Wizard hat'].includes(hat);
    const style = tucked && ['Spiky', 'Mohawk', 'Bun', 'Curly'].includes(hair) ? 'Short' : hair;
    const side = dir === 'left', back = dir === 'up';
    const lift = frame === 1 ? [1, 0] : frame === 2 ? [0, 1] : [0, 0];

    // Behind the body (seen from the back or side)
    if (back || side) {
      if (acc === 'Cape') R(side ? 10 : 3, 13, side ? 3 : 10, 8, '#c03040');
      if (acc === 'Backpack') R(side ? 10 : 4, 13, side ? 3 : 8, 6, '#8a5a30');
      if (acc === 'Jetpack') { R(side ? 10 : 3, 13, side ? 3 : 4, 7, '#a0a8b0'); if (!side) R(9, 13, 4, 7, '#a0a8b0'); if (frame) R(side ? 11 : 4, 20, 2, 2, '#f8a030'); }
    }
    if (!side && (style === 'Long')) R(1, 7, 14, back ? 10 : 9, hc);
    if (style === 'Twin tails') { if (!side) { R(0, 6, 2, 8, hc); R(14, 6, 2, 8, hc); } else R(11, 6, 2, 8, hc); }

    // Legs & shoes
    const legs = (x, w, up) => {
      if (bottom === 'Pants') R(x, 19 - up, w, 4, legC);
      else { R(x, 19 - up, w, 4, sk); if (bottom === 'Shorts') R(x, 19 - up, w, 2, legC); }
      R(x, 23 - up, w, 1, SHOE);
    };
    if (side) { legs(frame === 1 ? 5 : 6, 3, lift[0]); legs(frame === 2 ? 9 : 8, 3, lift[1]); }
    else { legs(5, 3, lift[0]); legs(8, 3, lift[1]); if (bottom === 'Pants') R(8, 19, 1, 3, legD); }
    if (bottom === 'Skirt') { R(4, 17, 8, 3, legC); R(3, 19, 10, 1, legC); R(3, 19, 10, 1, legD); }

    // Torso
    const tx = side ? 5 : f ? 5 : 4, tw = side ? 6 : f ? 6 : 8;
    const body = top === 'Lab coat' ? '#f4f6f8' : top === 'Armor vest' ? '#8890a0' : tc;
    R(tx, 13, tw, top === 'Lab coat' ? 7 : 6, body); R(tx + tw - 1, 13, 1, 6, P.shade(body, -30));
    if (f && !side) R(4, 13, 8, 2, body);
    if (!back && !side) {
      if (top === 'Jacket') { R(7, 13, 2, 5, '#f0f0f0'); R(7, 17, 2, 1, tcD); }
      if (top === 'Hoodie') { R(5, 13, 6, 1, tcD); R(6, 16, 4, 2, tcD); }
      if (top === 'Overalls') { R(5, 15, 6, 4, bc); R(5, 13, 1, 2, bc); R(10, 13, 1, 2, bc); }
      if (top === 'Lab coat') { R(7, 13, 2, 3, tc); R(8, 16, 1, 4, '#c8d0d8'); }
      if (top === 'Armor vest') { R(5, 14, 6, 1, '#606878'); R(5, 16, 6, 1, '#606878'); }
      if (suit) { R(4, 17, 8, 1, '#f8d048'); R(9, 14, 2, 2, '#e8e8e8'); }
      if (acc === 'Tool belt') { R(4, 18, 8, 1, '#7a5030'); R(10, 18, 2, 2, '#9aa3ad'); }
      if (acc === 'Backpack') { R(5, 13, 1, 4, '#6a4020'); R(10, 13, 1, 4, '#6a4020'); }
      if (acc === 'Jetpack') { R(2, 12, 2, 2, '#a0a8b0'); R(12, 12, 2, 2, '#a0a8b0'); }
      if (acc === 'Cape') { R(2, 13, 1, 6, '#c03040'); R(13, 13, 1, 6, '#c03040'); }
    }
    if (back && top === 'Hoodie') R(5, 13, 6, 2, tcD);
    // Arms
    const sleeve = top === 'Armor vest' ? tc : body;
    if (side) { const sw = frame === 1 ? -1 : frame === 2 ? 1 : 0; R(7 + sw, 14, 2, 3, sleeve); R(7 + sw, 17, 2, 1, sk); }
    else {
      const ax = f ? 3 : 2;
      R(ax, 13, 2, 3, sleeve); R(16 - ax - 2, 13, 2, 3, sleeve);
      R(ax, 16 + (frame === 1 ? 1 : 0), 2, 1, sk); R(16 - ax - 2, 16 + (frame === 2 ? 1 : 0), 2, 1, sk);
    }

    // Head
    if (back) { R(3, 3, 10, 10, hc); R(2, 5, 12, 6, hc); R(3, 12, 10, 1, hcD); R(2, 8, 1, 2, sk); R(13, 8, 1, 2, sk); }
    else if (side) {
      R(2, 4, 9, 9, sk); R(1, 8, 1, 2, sk); R(4, 8, 1, 2, EYE); R(3, 11, 2, 1, '#c0605a');
      R(5, 2, 8, 4, hc); R(8, 4, 5, 8, hc); R(2, 3, 5, 2, hc); R(8, 11, 4, 1, hcD); R(9, 8, 1, 2, sk);
      if (f) R(4, 7, 1, 1, EYE);
    } else {
      R(3, 4, 10, 8, sk); R(4, 12, 8, 1, sk); R(2, 7, 1, 2, sk); R(13, 7, 1, 2, sk); R(3, 11, 10, 1, skD);
      R(5, 8, 1, 2, EYE); R(10, 8, 1, 2, EYE); R(7, 11, 2, 1, '#c0605a'); R(4, 10, 1, 1, '#f0a0a0'); R(11, 10, 1, 1, '#f0a0a0');
      if (f) { R(4, 8, 1, 1, EYE); R(11, 8, 1, 1, EYE); }
    }
    // Hair (front/side)
    if (!back) {
      const cap = () => {
        if (side) return;
        R(3, 2, 10, 3, hc); R(2, 3, 12, 3, hc); R(5, 2, 3, 1, hcL);
        R(3, 5, 2, 1, hc); R(6, 5, 1, 1, hc); R(9, 5, 2, 1, hc); R(12, 5, 1, 1, hc); R(2, 6, 1, 2, hc); R(13, 6, 1, 2, hc);
      };
      switch (style) {
        case 'Buzz': if (!side) { R(3, 3, 10, 2, hc); R(2, 4, 1, 2, hc); R(13, 4, 1, 2, hc); } break;
        case 'Spiky': cap(); R(3, 1, 2, 1, hc); R(6, 0, 2, 2, hc); R(10, 1, 2, 1, hc); if (side) { R(6, 0, 2, 2, hc); R(10, 1, 2, 1, hc); } break;
        case 'Curly': if (!side) { R(1, 2, 14, 4, hc); R(2, 1, 4, 1, hc); R(7, 1, 3, 1, hc); R(11, 1, 3, 1, hc); R(1, 6, 2, 4, hc); R(13, 6, 2, 4, hc); } else { R(4, 1, 10, 4, hc); R(10, 5, 4, 6, hc); } break;
        case 'Bob': cap(); if (!side) { R(2, 6, 2, 6, hc); R(12, 6, 2, 6, hc); } break;
        case 'Long': cap(); if (!side) { R(2, 6, 2, 8, hc); R(12, 6, 2, 8, hc); } else R(9, 6, 4, 9, hc); break;
        case 'Ponytail': cap(); if (side) R(12, 5, 3, 6, hc); else R(13, 4, 2, 5, hc); break;
        case 'Bun': cap(); R(6, 0, 4, 2, hc); break;
        case 'Mohawk': if (!side) { R(3, 4, 10, 1, hcD); } R(7, 0, 2, 4, hc); break;
        default: cap();
      }
    } else {
      if (style === 'Ponytail') R(7, 11, 2, 5, hc);
      if (style === 'Bun') R(6, 1, 4, 2, hc);
      if (style === 'Spiky') { R(4, 1, 2, 2, hc); R(7, 0, 2, 3, hc); R(10, 1, 2, 2, hc); }
      if (style === 'Mohawk') R(7, 0, 2, 4, hc);
    }
    // Headwear
    const core = AF.coreColor(look);
    switch (hat) {
      case 'Cap': R(3, 1, 10, 4, tc); R(4, 1, 4, 1, P.shade(tc, 40)); if (dir === 'down') R(3, 5, 10, 1, tcD); if (side) R(0, 4, 4, 1, tcD); if (back) R(4, 4, 8, 1, tcD); break;
      case 'Beanie': R(3, 1, 10, 4, '#d04040'); R(2, 4, 12, 2, '#f0f0f0'); R(7, 0, 2, 1, '#f0f0f0'); break;
      case 'Goggles': R(2, 5, 12, 1, '#404048'); if (dir === 'down') { R(4, 4, 3, 3, '#60e0f0'); R(9, 4, 3, 3, '#60e0f0'); R(4, 4, 1, 1, '#ffffff'); } if (side) R(2, 4, 3, 3, '#60e0f0'); break;
      case 'Hard hat': R(3, 1, 10, 4, '#f8c830'); R(2, 4, 12, 2, '#e0a820'); R(7, 1, 2, 4, '#e0a820'); if (side) R(0, 5, 3, 1, '#e0a820'); break;
      case 'Bandana': R(2, 2, 12, 4, '#c03838'); R(4, 3, 1, 1, '#fff'); R(8, 2, 1, 1, '#fff'); R(11, 4, 1, 1, '#fff'); if (back) R(7, 6, 2, 3, '#c03838'); break;
      case 'Headphones': R(3, 1, 10, 1, '#303038'); if (side) R(8, 6, 3, 4, '#e06098'); else { R(1, 6, 2, 4, '#e06098'); R(13, 6, 2, 4, '#e06098'); } break;
      case 'Antenna band': R(3, 4, 10, 1, '#a0a8b0'); R(4, 1, 1, 3, '#a0a8b0'); R(11, 1, 1, 3, '#a0a8b0'); R(4, 0, 1, 1, core); R(11, 0, 1, 1, core); break;
      case 'Top hat': R(4, -1, 8, 5, '#282830'); R(4, 2, 8, 1, '#c03838'); R(2, 4, 12, 1, '#282830'); break;
      case 'Wizard hat': R(7, -1, 2, 1, '#6048b0'); R(6, 0, 4, 1, '#6048b0'); R(5, 1, 6, 2, '#6048b0'); R(4, 3, 8, 1, '#6048b0'); R(2, 4, 12, 2, '#6048b0'); R(7, 2, 1, 1, '#f8d048'); break;
      case 'Crown': R(4, 1, 8, 2, '#f8d040'); R(4, -1, 1, 2, '#f8d040'); R(7, -1, 2, 2, '#f8d040'); R(11, -1, 1, 2, '#f8d040'); R(7, 1, 2, 1, '#e04050'); break;
    }
    if (!back) {
      if (acc === 'Glasses') { if (side) R(3, 7, 3, 1, '#202028'); else { R(4, 7, 3, 1, '#202028'); R(9, 7, 3, 1, '#202028'); R(7, 8, 2, 1, '#202028'); } }
      if (acc === 'Scarf') { R(side ? 5 : 4, 12, side ? 6 : 8, 2, '#e08830'); if (!side) R(9, 14, 2, 3, '#e08830'); else R(10, 13, 2, 3, '#e08830'); }
    }
    P.outline(c, '#282030');
    return (sprCache[key] = c);
  };

  // Draws the pilot (standing, facing down) scaled to height s, for menus and slots.
  AF.drawPilot = function (g, x, y, s, look, t, dir) {
    const frame = t ? (Math.floor(t / 180) % 4 === 1 ? 1 : Math.floor(t / 180) % 4 === 3 ? 2 : 0) : 0;
    const spr = AF.pilotSprite(look, dir || 'down', dir ? frame : 0), k = s / spr.height;
    g.imageSmoothingEnabled = false;
    g.drawImage(spr, Math.round(x + (s - spr.width * k) / 2), Math.round(y), Math.round(spr.width * k), Math.round(spr.height * k));
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
    const dirs = ['down', 'left', 'up', 'right'], dir = dirs[Math.floor(t / 1600) % 4];
    const sh = Math.max(26, Math.floor(h * 0.72 / 26) * 26);
    AF.drawPilot(g, (w - sh) / 2, h - sh - 6, sh, C.look, t, dir);
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
