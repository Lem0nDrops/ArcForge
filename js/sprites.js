/* Automata: ArcForge — layered sprite characters.
   Characters are stacked from image sheets: a body, then one layer per worn item (plus hair and beard),
   in 4 directions with walk frames. Which files exist is listed in assets/chars/manifest.js.
   Anything without art falls back gracefully: a missing layer is skipped, and a missing body uses the
   classic code-drawn character. See assets/chars/ART-GUIDE.md for the sheet format. */
(function () {
  const AF = (window.AF = window.AF || {});
  const M = window.AF_SPRITES || {};
  const CFG = Object.assign({
    base: 'assets/chars/', frame: [128, 192], anchor: [64, 186], height: 176,
    dirs: ['down', 'left', 'right', 'up'], walkFrames: 4, shadow: true, enabled: false,
  }, M.config || {});

  // Draw order (lower first). Per-direction overrides: capes cover the back, tools tuck behind when walking away.
  const Z = {
    'cape:back': 0, 'hair:back': 2, 'other:back': 4, body: 10, bottom: 20, shoes: 24, top: 30, gloves: 34, cape: 36,
    beard: 40, face: 44, hair: 50, hat: 60, tool: 70,
  };
  const ZDIR = { up: { cape: 65, tool: 5, 'hair:back': 52 } };
  const HIDES_HAIR = ['hood', 'knight'];

  const S = (AF.Sprites = { cfg: CFG, manifest: M, images: {}, missing: new Set(), loaded: new Set(), tints: {} });
  const LS_KEY = 'arcforge.charart';

  // ---------- mode: 'sprites' or 'classic' ----------
  S.mode = function () {
    let m = null;
    try { m = localStorage.getItem(LS_KEY); } catch (e) {}
    return m || (CFG.enabled ? 'sprites' : 'classic');
  };
  S.setMode = function (m) { try { localStorage.setItem(LS_KEY, m); } catch (e) {} };
  S.hasArt = () => !!(M.body && Object.keys(M.body).length);
  S.use = () => S.hasArt() && S.mode() === 'sprites';

  // ---------- image loading ----------
  S.image = function (src) {
    if (!src) return null;
    let rec = S.images[src];
    if (!rec) {
      rec = S.images[src] = { img: new Image(), ok: false };
      rec.img.onload = () => { rec.ok = true; S.loaded.add(src); S.onload && S.onload(src); };
      rec.img.onerror = () => { S.missing.add(src); };
      rec.img.src = CFG.base + src + (M.version ? '?v=' + M.version : '');
    }
    return rec.ok ? rec.img : null;
  };
  S.preload = function () {
    const all = [];
    const add = (e) => { if (!e) return; if (e.src) all.push(e.src); if (e.back) all.push(e.back); };
    ['body', 'hair', 'beard', 'items', 'styles'].forEach((k) => Object.values(M[k] || {}).forEach(add));
    all.forEach(S.image);
  };

  // Light-grey art is multiplied by a colour (hair colour, skin tone, an item's colours).
  function tinted(img, src, color) {
    if (!color) return img;
    const k = src + '|' + color;
    if (S.tints[k]) return S.tints[k];
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0);
    return (S.tints[k] = c);
  }

  // ---------- which layers a look needs ----------
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const L = () => AF.LOOK;
  function tintColor(entry, look, item) {
    const t = entry.tint;
    if (!t) return null;
    if (t === 'skin') return AF.lookHex ? AF.lookHex(look, 'skin') : L().skin[look.skin || 0];
    if (t === 'hair') return AF.lookHex ? AF.lookHex(look, 'hairColor') : L().hairColor[look.hairColor || 0];
    if (item && item.vis && (t === 'a' || t === 'b')) { const d = look.dye && look.dye[item.id]; return (d && d[t]) || item.vis[t]; }
    if (t[0] === '#') return t;
    return null;
  }
  S.layersFor = function (look) {
    const out = [], outfit = look.outfit || {};
    const push = (slot, entry, item, key) => {
      if (!entry) return;
      const tint = tintColor(entry, look, item);
      if (entry.back) out.push({ slot: slot === 'hair' ? 'hair:back' : slot === 'cape' ? 'cape:back' : 'other:back', src: entry.back, tint, entry, key });
      if (entry.src) out.push({ slot, src: entry.src, tint, entry, key });
    };
    // body: most specific first (f-broad, f, any)
    const bi = look.build == null ? 1 : Math.max(0, Math.min(2, Math.round(+look.build))), bname = (L().build || [])[bi] || 'Average';
    const bodyKey = [(AF.lookShape && AF.lookShape(look) >= 0.5 ? 'f' : look.body || 'm') + '-' + slug(bname), look.body, 'any'].find((k) => M.body && M.body[k]);
    if (bodyKey) push('body', M.body[bodyKey], null, 'body:' + bodyKey);
    // worn items: exact item art first, then a generic style sheet tinted with the item's colours, then a slot default
    let hideHair = false;
    for (const slot of AF.WEAR_SLOTS || []) {
      const id = outfit[slot]; if (!id) continue;
      const it = AF.ITEMS[id], vs = it && it.vis && it.vis.s;
      const entry = (M.items || {})[id] || (vs && (M.styles || {})[slot + ':' + vs]) || (M.styles || {})[slot];
      if (!entry) continue;
      push(slot, entry, it && Object.assign({ id }, it), (M.items || {})[id] ? 'item:' + id : 'style:' + slot + ':' + vs);
      if (slot === 'hat' && (entry.hidesHair || (entry.hidesHair !== false && HIDES_HAIR.includes(vs)))) hideHair = true;
    }
    const hair = L().hair[look.hair || 0], beard = L().beard && L().beard[look.beard || 0];
    if (!hideHair) push('hair', (M.hair || {})[hair] || (M.hair || {})[slug(hair)], null, 'hair:' + hair);
    if (beard && beard !== 'None') push('beard', (M.beard || {})[beard] || (M.beard || {})[slug(beard)], null, 'beard:' + beard);
    return out;
  };

  // ---------- drawing ----------
  S.zOf = function (l, dir) {
    const zd = ZDIR[dir] || {}, ez = l.entry.z;
    if (ez != null && typeof ez === 'number') return ez;
    if (ez && ez[dir] != null) return ez[dir];
    if (zd[l.slot] != null) return zd[l.slot];
    return Z[l.slot] != null ? Z[l.slot] : 30;
  };
  S.sortLayers = (layers, dir) => layers.sort((a, b) => S.zOf(a, dir) - S.zOf(b, dir));
  S.frameFor = function (phase, moving) {
    if (!moving) return 0;
    const n = CFG.walkFrames, p = ((phase || 0) / (Math.PI * 2)) * n;
    return 1 + (((Math.floor(p) % n) + n) % n);
  };
  // Returns false (so the caller can fall back) when the body art isn't ready yet.
  S.draw = function (g, cx, fy, H, look, dir, phase, opt) {
    opt = opt || {};
    const layers = S.layersFor(look);
    const body = layers.find((l) => l.slot === 'body');
    if (!body || !S.image(body.src)) return false;
    const [FW, FH] = CFG.frame, [AX, AY] = CFG.anchor, sc = H / CFG.height;
    const col = S.frameFor(phase, opt.moving);
    S.sortLayers(layers, dir);
    const bi = look.build == null ? 1 : Math.max(0, Math.min(2, Math.round(+look.build))), bname = (L().build || [])[bi] || 'Average';
    const buildScale = M.body && M.body[look.body + '-' + slug(bname)] ? 1 : [0.92, 1, 1.1][bi] || 1;
    if (CFG.shadow && !opt.noShadow) { g.save(); g.fillStyle = 'rgba(8,6,4,.35)'; g.beginPath(); g.ellipse(cx, fy - H * 0.01, H * 0.15, H * 0.028, 0, 0, 7); g.fill(); g.restore(); }
    for (const l of layers) {
      const img = S.image(l.src); if (!img) continue;
      const rows = l.entry.dirs || CFG.dirs;
      let row = rows.indexOf(dir), flip = false;
      if (row < 0 && dir === 'right') { row = rows.indexOf('left'); flip = true; }
      if (row < 0 && dir === 'left') { row = rows.indexOf('right'); flip = true; }
      if (row < 0) row = 0;
      const frames = l.entry.frames || CFG.walkFrames + 1;
      const c = Math.min(col, frames - 1);
      const src = tinted(img, l.src, l.tint);
      g.save();
      g.translate(cx, fy);
      g.scale((flip ? -1 : 1) * buildScale, 1);
      g.drawImage(src, c * FW, row * FH, FW, FH, -AX * sc, -AY * sc, FW * sc, FH * sc);
      g.restore();
    }
    return true;
  };

  // Swap in sprites wherever the game draws a character; keep the classic renderer as the fallback.
  const classic = AF.drawPilotAt;
  AF.drawPilotClassic = classic;
  AF.drawPilotAt = function (g, cx, fy, H, look, dir, phase, opt) {
    if (S.use() && S.draw(g, cx, fy, H, look, dir, phase, opt)) return;
    classic(g, cx, fy, H, look, dir, phase, opt);
  };
  if (S.hasArt()) S.preload();
})();
