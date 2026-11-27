/* Automata: ArcForge — townsfolk, dialogue boxes, the story questline and the optional tutorial. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);

  // ---------- Townsfolk (x, y in town tiles) ----------
  AF.NPCS = {
    mara: { name: 'Engineer Mara', x: 8, y: 24, dir: 'left', look: AF.npcLook({ body: 'f', skin: 2, hair: 6, hairColor: 5, eyes: 1, eyeColor: 1 }, ['welding_goggles', 'forge_apron', 'work_pants', 'steel_boots', 'work_gloves', 'forge_hammer']) },
    bram: { name: 'Mayor Bram', x: 24, y: 7, dir: 'down', look: AF.npcLook({ build: 2, skin: 3, hair: 0, hairColor: 9, eyes: 2 }, ['top_hat', 'monocle', 'scholar_coat', 'slacks', 'loafers']) },
    lune: { name: 'Archivist Lune', x: 13, y: 7, dir: 'down', look: AF.npcLook({ build: 0, body: 'f', skin: 0, hair: 4, hairColor: 7, eyes: 0, eyeColor: 3 }, ['mage_hood', 'glasses', 'mage_robe', 'slacks', 'loafers', 'tome']) },
    pip: { name: 'Pip', x: 14, y: 24, dir: 'down', look: AF.npcLook({ build: 0, skin: 1, hair: 2, hairColor: 3, eyes: 1, eyeColor: 5 }, ['wanderer_hood', 'linen_tunic', 'breeches', 'dust_boots', 'backpack']) },
    rook: { name: 'Guard Rook', x: 18, y: 26, dir: 'left', look: AF.npcLook({ build: 2, skin: 4, hair: 1, hairColor: 0, eyes: 3 }, ['iron_helm', 'chainmail', 'breeches', 'steel_boots', 'traveler_cloak', 'longsword']) },
    tess: { name: 'Tess', x: 9, y: 16, wander: true, look: AF.npcLook({ body: 'f', skin: 2, hair: 6, hairColor: 6, eyes: 1, eyeColor: 3 }, ['ribbon_bow', 'pastel_dress', 'ribbon_shoes']),
      lines: ["I'm gonna be a pilot too someday! My automaton will have a JETPACK.", 'Did you know the pond fish glow at night? Mara says it\'s arc runoff.', 'Gus says the Titan used to light up the whole sky.'] },
    gus: { name: 'Old Gus', x: 24, y: 16, wander: true, look: AF.npcLook({ build: 0, skin: 0, hair: 0, hairColor: 9, eyes: 2 }, ['cowboy_hat', 'leather_jerkin', 'breeches', 'trail_boots']),
      lines: ['Back in my day, the Arc Fountain could power the whole town.', 'Bots out there act on a pattern. Watch what they plan to do next, then stay out of reach.', 'Bank your credits, kid. The wilds take a cut if your automaton goes down.'] },
    nell: { name: 'Nell', x: 29, y: 15, wander: true, look: AF.npcLook({ body: 'f', skin: 5, hair: 7, hairColor: 0, eyes: 0, eyeColor: 2 }, ['flower_crown', 'chef_apron', 'frilly_skirt', 'clogs']),
      lines: ['The Diner\'s Focus Tea is the only thing keeping me awake.', 'Copper veins show up in the rubble east of here. You\'ll need Treads.', 'The Deckhouse restocks every so often. Check back!'] },
    vik: { name: 'Vik', x: 12, y: 26, wander: true, look: AF.npcLook({ build: 1, skin: 3, hair: 8, hairColor: 1, eyes: 3, eyeColor: 4 }, ['eyepatch', 'flight_jacket', 'flight_pants', 'dust_boots', 'traveler_cloak', 'gear_crossbow']),
      lines: ['Spark Spitters shoot from far away. Get a Rail Shot or close the gap fast!', 'Ruins have a little blue light while nobody\'s searched them yet.', 'I traded three Scrap for a sandwich once. Worth it.'] },
    // Brasshaven (town 2)
    sable: { town: 2, name: 'Guildmaster Sable', x: 5, y: 8, dir: 'down', look: AF.npcLook({ body: 'f', skin: 3, hair: 4, hairColor: 9, eyes: 3, eyeColor: 4 }, ['wanderer_hood', 'leather_jerkin', 'breeches', 'trail_boots', 'shadow_cloak', 'gear_crossbow']) },
    corwin: { town: 2, name: 'Artificer Corwin', x: 21, y: 8, dir: 'down', look: AF.npcLook({ build: 0, skin: 1, hair: 3, hairColor: 9, eyes: 2, beard: 5 }, ['monocle', 'lab_coat', 'slacks', 'loafers', 'power_gauntlets', 'spark_staff']) },
    hollis: { town: 2, name: 'Gatewarden Hollis', x: 13, y: 20, dir: 'down', look: AF.npcLook({ build: 2, skin: 4, hair: 1, hairColor: 0, eyes: 3, beard: 4 }, ['iron_helm', 'chainmail', 'breeches', 'steel_boots', 'hero_cape', 'longsword']) },
    mira: { town: 2, name: 'Mira the Hedge-Witch', x: 8, y: 11, wander: true, look: AF.npcLook({ body: 'f', skin: 0, hair: 4, hairColor: 9, eyes: 2, eyeColor: 3 }, ['wizard_hat', 'archmage_robe', 'pleated_skirt', 'loafers', 'spark_staff']),
      lines: ['The Foundry hums with old rune-work. Gears and spells, braided together. Nasty combination.', 'Crystals down there drink the dark. Touch one and you\'ll feel it.', 'Rune Golems guard themselves before they strike. Hit them when the shield drops.'] },
    tobin: { town: 2, name: 'Tobin the Tinker', x: 18, y: 17, wander: true, look: AF.npcLook({ skin: 2, hair: 2, hairColor: 2, eyes: 0, beard: 1 }, ['leather_cap', 'forge_apron', 'work_pants', 'dust_boots', 'wrench']),
      lines: ['Steam, springs and a little spellwork. That\'s how Brasshaven runs.', 'The Smithy here does the same upgrades as Rivet Hollow\'s Garage. Same prices, better tea.', 'Your account at the Ironclad Bank works here too. Handy, eh?'] },
    // ----- Gearwind Outpost -----
    wren: { town: 3, name: 'Scout Wren', x: 6, y: 10, wander: true, look: AF.npcLook({ body: 'f', skin: 2, hair: 5, hairColor: 2, eyes: 3, eyeColor: 2 }, ['aviator_cap', 'leather_jerkin', 'breeches', 'trail_boots', 'traveler_cloak', 'gear_crossbow']),
      lines: ['Frostpeak bots chill your joints. Fight one and you\'ll have less energy next turn. Bring cheap cards.', 'Mirewood\'s Bog Crawlers corrode your Block clean off. Hit them hard instead of hiding.', 'In the Ashlands, everything burns. Burns tick at the start of your turn, but they can\'t finish you off.', 'Each region has its own deposits. Glacier hearts hold arcite; the bogs hide old copper.'] },
    hask: { town: 3, name: 'Old Hask', x: 18, y: 10, wander: true, look: AF.npcLook({ build: 2, skin: 5, hair: 13, hairColor: 9, eyes: 2, beard: 6 }, ['wanderer_hood', 'padded_vest', 'work_pants', 'steel_boots', 'traveler_cloak']),
      lines: ['I walked the Ashlands once. The Titan\'s lair glows red past the last lava river.', 'Treads get you over ice, bog and basalt. Don\'t go south without them.', 'Gearwind\'s Bounty Board pays the best in the land. The targets are nastier too.'] },
  };

  // ---------- Quests ----------
  AF.QUESTS = {
    s1: { title: 'A Spark of Your Own', text: 'Engineer Mara has built your first automaton. Find her outside the Rivet Forge (south-west).', obj: { type: 'talk' }, next: 's2' },
    s2: { title: "The Mayor's Request", text: 'Mayor Bram is waiting outside Town Hall (north).', obj: { type: 'talk' }, next: 's3' },
    s3: { title: 'Static in the Fields', text: 'Defeat 3 rogue bots outside town, then report to Mayor Bram.', obj: { type: 'win', n: 3 }, turnIn: 'bram', reward: { credits: 400, rations: 2, xp: 80 }, next: 's4' },
    s4: { title: 'Echoes in the Ruins', text: 'Search 2 ruins in the wilds, then bring the data to Archivist Lune.', obj: { type: 'ruin', n: 2 }, turnIn: 'lune', reward: { credits: 300, blueprint: 1, xp: 100, item: 'scout_goggles' }, next: 's5' },
    s5: { title: 'Over the Rubble', text: 'Upgrade to Treads at the Garage and defeat a tougher bot (yellow tag or higher). Report to Mayor Bram.', obj: { type: 'win', n: 1, minTier: 2 }, turnIn: 'bram', reward: { credits: 600, xp: 150, item: 'ranger_jacket' }, next: 'b1' },
    b1: { title: 'The Brass Road', text: 'Follow the Brass Road east to Brasshaven and find Guildmaster Sable outside the Wayfarers\' Guild.', obj: { type: 'talk' }, next: 'b2' },
    b2: { title: 'Into the Sunken Foundry', text: 'Enter the Sunken Foundry north of Brasshaven and open 2 of its old strongboxes. Report to Guildmaster Sable.', obj: { type: 'chest', n: 2 }, turnIn: 'sable', reward: { credits: 1500, xp: 300, item: 'iron_helm' }, next: 'b3' },
    b3: { title: 'The Clockwork Warden', text: 'Defeat the Clockwork Warden in the Foundry\'s deepest hall, then return to Guildmaster Sable.', obj: { type: 'boss', boss: 'warden', n: 1 }, turnIn: 'sable', reward: { credits: 3000, xp: 500, item: 'shadow_cloak' }, next: 's6' },
    s6: { title: "The Titan's Call", text: "Climb to the Titan's lair in the far mountains (Spider Legs needed) and shut the Titan Core down. Then tell Mayor Bram.", obj: { type: 'boss', boss: 'titan', n: 1 }, turnIn: 'bram', reward: { credits: 5000, xp: 600 }, next: 'end' },
  };
  AF.TUTORIAL = {
    t1: { title: 'First Harvest', text: 'Rummage the scrap piles at the Hollow Junkyard, just outside town, for 5 Scrap.', obj: { type: 'gather', res: 'scrap', n: 5 }, reward: { credits: 100, xp: 20, item: 'work_gloves' } },
    t2: { title: 'First Fight', text: 'Win a battle against a rogue bot.', obj: { type: 'win', n: 1 }, reward: { credits: 100, rations: 1, xp: 20 } },
    t3: { title: 'Forged in Fire', text: 'Forge a new card at the Rivet Forge.', obj: { type: 'forge', n: 1 }, reward: { credits: 150, xp: 20 } },
    t4: { title: 'Tune-Up', text: 'Upgrade any automaton part at the Bolt & Gear Garage.', obj: { type: 'upgrade', n: 1 }, reward: { credits: 200, xp: 20, item: 'sneakers' } },
    t5: { title: 'Fuel Up', text: 'Buy anything at the Sparkplug Diner.', obj: { type: 'food', n: 1 }, reward: { credits: 100, xp: 20 } },
    t6: { title: 'Safe Keeping', text: 'Deposit money or materials at the Ironclad Bank.', obj: { type: 'deposit', n: 1 }, reward: { credits: 100, xp: 20, item: 'lunchbox' } },
    t7: { title: 'Know Your Deck', text: 'Open your deck with the "Party" button (or press Q).', obj: { type: 'deck', n: 1 }, reward: { credits: 50, xp: 20 } },
  };

  const Q = (AF.Quests = {});
  Q.fresh = () => ({ story: 's1', prog: 0, ready: false, tut: null, tprog: {}, tdone: [], grad: false });

  function matches(o, type, data) {
    if (o.type !== type) return 0;
    if (type === 'gather') return o.res === data.res ? data.amt : 0;
    if (type === 'win') return !o.minTier || data.tier >= o.minTier ? 1 : 0;
    if (type === 'boss') return !o.boss || o.boss === data.type ? 1 : 0;
    return 1;
  }

  function giveReward(state, rw) {
    const out = [];
    if (rw.credits) { state.credits += rw.credits; out.push(AF.moneyText(rw.credits)); }
    if (rw.xp) { const n = AF.gainXP(state, rw.xp); out.push(`${n} XP`); }
    if (rw.item) { const r = AF.giveItem(state, rw.item); out.push(r && r.dup ? AF.moneyText(r.value) : `${AF.ITEMS[rw.item].name} (new outfit piece)`); }
    if (rw.rations) { state.pilot.rations += rw.rations; out.push(`${rw.rations} Field Ration${rw.rations > 1 ? 's' : ''}`); }
    if (rw.card) { const c = AF.newCard(rw.card); c.inDeck = AF.deckCards(state).length < AF.DECK_MAX; state.cards.push(c); out.push(`a ${AF.CARDS[rw.card].name} card`); }
    if (rw.blueprint) {
      const locked = AF.lockedCards(state);
      if (locked.length) { const id = locked[Math.floor(Math.random() * locked.length)]; state.known.push(id); out.push(`the ${AF.CARDS[id].name} blueprint`); }
    }
    return out.join(', ');
  }

  // Called by the game whenever something quest-worthy happens.
  Q.event = function (state, type, data) {
    data = data || {};
    const qs = state.quests, sq = AF.QUESTS[qs.story];
    if (sq && !qs.ready && sq.obj.n) {
      const add = matches(sq.obj, type, data);
      if (add) {
        qs.prog = Math.min(sq.obj.n, qs.prog + add);
        if (qs.prog >= sq.obj.n) { qs.ready = true; AF.game.toast(`Quest complete: ${sq.title}. Report to ${AF.NPCS[sq.turnIn].name}.`, 5000); }
        else AF.game.toast(`${sq.title}: ${qs.prog} / ${sq.obj.n}`);
      }
    }
    if (qs.tut === 'active') {
      for (const [id, t] of Object.entries(AF.TUTORIAL)) {
        if (qs.tdone.includes(id)) continue;
        const add = matches(t.obj, type, data);
        if (!add) continue;
        qs.tprog[id] = Math.min(t.obj.n, (qs.tprog[id] || 0) + add);
        if (qs.tprog[id] >= t.obj.n) {
          qs.tdone.push(id);
          const got = giveReward(state, t.reward);
          const all = qs.tdone.length === Object.keys(AF.TUTORIAL).length;
          setTimeout(() => AF.game.toast(`Tutorial done: ${t.title}! You got ${got}.${all ? ' Talk to Pip for a graduation gift!' : ''}`, 5000), 600);
        }
      }
    }
  };

  function advance(state) {
    const qs = state.quests, next = AF.QUESTS[qs.story].next;
    qs.story = next; qs.prog = 0; qs.ready = false;
    if (AF.QUESTS[next]) setTimeout(() => AF.game.toast(`New quest: ${AF.QUESTS[next].title}`, 4500), 300);
  }
  function turnIn(state) {
    const sq = AF.QUESTS[state.quests.story], got = giveReward(state, sq.reward || {});
    advance(state);
    return got;
  }

  // ---------- Tracker & log ----------
  Q.tracker = function (state) {
    const qs = state.quests, sq = AF.QUESTS[qs.story];
    if (!sq) return '';
    const prog = sq.obj.n && !qs.ready ? ` (${qs.prog}/${sq.obj.n})` : '';
    return `<b>${sq.title}${prog}</b><span>${qs.ready ? `Report to ${AF.NPCS[sq.turnIn].name}.` : sq.text}</span>`;
  };
  Q.logHtml = function (state) {
    const qs = state.quests, ids = Object.keys(AF.QUESTS), cur = ids.indexOf(qs.story);
    const story = ids.map((id, i) => {
      const q = AF.QUESTS[id], done = qs.story === 'end' || i < cur, active = id === qs.story;
      if (!done && !active) return '';
      return `<div class="row-item q${done ? ' owned' : ''}"><div><b>${q.title}</b><span class="muted">${done ? 'Complete' : qs.ready ? `Report to ${AF.NPCS[q.turnIn].name}.` : q.text + (q.obj.n ? ` (${qs.prog}/${q.obj.n})` : '')}</span></div>${done ? '<span class="own">Done</span>' : '<span class="qtag">Story</span>'}</div>`;
    }).join('');
    let tut = '';
    if (qs.tut === 'active') tut = Object.entries(AF.TUTORIAL).map(([id, t]) => {
      const done = qs.tdone.includes(id);
      return `<div class="row-item q${done ? ' owned' : ''}"><div><b>${t.title}</b><span class="muted">${t.text}${!done && t.obj.n > 1 ? ` (${qs.tprog[id] || 0}/${t.obj.n})` : ''}</span></div><span class="${done ? 'own' : 'qtag t'}">${done ? 'Done' : 'Tutorial'}</span></div>`;
    }).join('');
    else tut = `<p class="hint">${qs.tut === 'declined' ? 'Tutorial tasks are off. Talk to Pip by the Academy if you change your mind.' : qs.grad ? 'You graduated from Pip\'s tutorial!' : ''}</p>`;
    return `<h3>Story</h3><div class="list">${story}${qs.story === 'end' ? '<p class="hint">The Titan Core is quiet. Keep exploring!</p>' : ''}</div><h3>Tutorial</h3><div class="list">${tut}</div>`;
  };

  // ---------- Dialogue box ----------
  const D = (AF.Dialog = { open: false });
  D.show = function (lines, opts) {
    opts = opts || {};
    D.open = true; D.lines = lines; D.i = 0; D.opts = opts;
    $('#toast').classList.remove('show');
    $('#dialog').hidden = false;
    D.render();
  };
  D.render = function () {
    const ln = D.lines[D.i], npc = ln.npc && AF.NPCS[ln.npc], who = npc ? npc.name : ln.who || '';
    const name = AF.game.state ? AF.game.state.look.name : 'Pilot';
    D.full = ln.text.replace(/\{name\}/g, name);
    D.shown = 0;
    $('#dialog').innerHTML = `<div class="dlg">${npc ? '<canvas class="dlg-face"></canvas>' : ''}<div class="dlg-body">${who ? `<b class="who">${AF.esc(who)}</b>` : ''}<p class="txt"></p></div><span class="more">▼</span></div><div class="choices"></div>`;
    if (npc) { const c = $('#dialog .dlg-face'); c.width = 128; c.height = 128; AF.drawPilotAt(c.getContext('2d'), 64, 318, 312, npc.look, 'down', 0, {}); }
    clearInterval(D.timer);
    D.timer = setInterval(() => {
      D.shown += 2;
      $('#dialog .txt').textContent = D.full.slice(0, D.shown);
      if (D.shown >= D.full.length) { clearInterval(D.timer); D.finishLine(); }
    }, 16);
  };
  D.finishLine = function () {
    clearInterval(D.timer); D.shown = D.full.length; $('#dialog .txt').textContent = D.full;
    const last = D.i === D.lines.length - 1;
    if (last && D.opts.choices) {
      $('#dialog .more').hidden = true;
      $('#dialog .choices').innerHTML = D.opts.choices.map((c, i) => `<button class="btn${i === 0 ? ' primary' : ''}" data-choice="${i}">${c.label}</button>`).join('');
      const first = $('#dialog [data-choice]'); if (first) first.focus();
    }
  };
  D.advance = function () {
    if (!D.open) return;
    if (D.shown < D.full.length) { D.finishLine(); return; }
    if (D.i === D.lines.length - 1 && D.opts.choices) return;
    if (D.i < D.lines.length - 1) { D.i++; AF.sfx('card'); D.render(); return; }
    D.close(); if (D.opts.onDone) D.opts.onDone();
  };
  D.choose = function (i) { const c = D.opts.choices[i]; D.close(); if (c && c.fn) c.fn(); };
  D.close = function () { clearInterval(D.timer); D.open = false; $('#dialog').hidden = true; AF.game.persist(); AF.game.refresh(); };

  // ---------- Conversations ----------
  const N = (npc, text) => ({ npc, text });
  const T = (text) => ({ text });
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  Q.intro = function (state) {
    D.show([
      T('Rivet Hollow. A scrappy little town on the edge of the Shattered Wastes.'),
      T('Ten years ago the Titan Core, the great arc reactor beneath the old city, fell silent. Then the bots it once guided turned wild.'),
      T('Today, {name}, you finally become a pilot. Engineer Mara has been building an automaton just for you.'),
      T('Move with the arrow keys or WASD (hold Shift to run), or the pad on a touch screen. Face something and press E, Space or the A button to talk, read, enter, gather or search.'),
      T('Would you like tutorial tasks while you play? Pip will reward you for each one.'),
    ], { choices: [
      { label: 'Yes, show me', fn: () => { state.quests.tut = 'active'; AF.game.toast('Tutorial on. Check your tasks in Party → Quests.', 5000); after(); } },
      { label: 'No thanks', fn: () => { state.quests.tut = 'declined'; after(); } },
    ] });
    function after() { state.flags.intro = true; AF.game.persist(); setTimeout(() => AF.game.toast('Quest: find Engineer Mara outside the Rivet Forge (south-west of here).', 6000), 300); }
  };

  Q.talk = function (state, id) {
    const qs = state.quests, s = qs.story, n = AF.NPCS[id];
    const say = (lines, opts) => D.show(lines, opts);
    switch (id) {
      case 'mara':
        if (s === 's1') return say([
          N('mara', "There you are, {name}! I was up all night finishing it."),
          N('mara', `Every pilot in Rivet Hollow needs an automaton, and this one's yours: ${state.construct ? `a ${AF.CONSTRUCTS[state.construct].short} construct, just like you asked for` : 'a fresh frame'}, a Spark Cell core and a set of trusty wheels.`),
          N('mara', state.construct === 'bulwark' ? "Bulwarks are slow, but they can take a beating and they hit back hard. Let the bots break themselves on your shield." : state.construct === 'sprocket' ? "Sprockets are quick and fragile. Chain your cards together and they'll hit harder and harder each turn." : state.construct === 'arcwright' ? "Arcwrights hate being up close. Keep your distance and blast away. The farther you are, the harder you hit." : 'Every construct fights differently. Learn yours.'),
          T('Mara flips a switch. The automaton\'s core flickers to life and glows in your favourite colour.'),
          ...(state.bot && state.bot.named ? [N('mara', `I built it just the way you drew it up. Say hello to ${AF.botName(state)}!`)] : [N('mara', 'Every automaton needs a name, and a look all its own. Go on, make it yours!')]),
          N('mara', "It's bonded to you now. It'll follow you anywhere."),
        ], { onDone: () => {
          state.flags.robot = true; AF.World.placeRobot(state); AF.sfx('win'); AF.gainXP(state, 20);
          advance(state); AF.game.persist(); AF.game.refresh();
          const next = () => D.show([N('mara', `${AF.botName(state)}! Perfect. You can restyle them any time at the Garage.`), N('mara', 'Oh! Mayor Bram wanted to see you. He\'s outside Town Hall, up north.')]);
          if (state.bot && state.bot.named) next(); else AF.Studio.open(state, { first: true, onDone: next });
        } });
        return say([N('mara', pick([
          'Bring me materials and I\'ll forge cards for you. Step up to the Forge door and press the action button.',
          'Treads will get you over the rubble east of town. The Garage can fit them.',
          'If your automaton takes a beating, the Garage fixes it up for a few Bolts.',
          'Upgraded cards hit harder. I can upgrade them inside the Forge for Scrap and a Circuit.',
        ]))]);
      case 'bram':
        if (s === 's1') return say([N('bram', 'Ah, our newest pilot! Go see Mara at the Rivet Forge first. She has something for you.')]);
        if (s === 's2') return say([
          N('bram', 'So Mara finished your automaton! A fine-looking machine.'),
          N('bram', 'You know the story. When the Titan Core went dark, its bots went wild. Lately they\'re getting bolder, prowling right outside our gates.'),
          N('bram', 'Take your automaton out and defeat 3 rogue bots. Watch their next move, and step out of reach when they wind up a big hit!'),
        ], { onDone: () => advance(state) });
        if (s === 's3') return qs.ready ? say([
          N('bram', 'Excellent work! The fields are quieter already.'),
          N('bram', 'Here\'s your pay, plus a couple of rations from the Diner.'),
          N('bram', 'Archivist Lune thinks the old ruins hold clues about the Titan. Find her outside the Archive.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('bram', `Still hearing static out there. Defeat ${3 - qs.prog} more rogue bot${3 - qs.prog === 1 ? '' : 's'} outside town.`)]);
        if (s === 's4') return say([N('bram', 'Lune\'s waiting outside the Archive, north-west of the square.')]);
        if (s === 's5') return qs.ready ? say([
          N('bram', 'You beat one of the heavy bots? Rivet Hollow is lucky to have you.'),
          N('bram', 'Lune\'s readings point to the Titan\'s lair, deep in the far mountains. But we don\'t know how to shut it down.'),
          N('bram', 'The Wayfarers\' Guild in Brasshaven might. Take the Brass Road east, over the river, and ask for Guildmaster Sable.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('bram', 'Fit your automaton with Treads at the Garage, then take on one of the tougher bots out past the rubble.')]);
        if (s === 'b1' || s === 'b2' || s === 'b3') return say([N('bram', 'Any word from Brasshaven? The Brass Road starts at our east gate.')]);
        if (s === 's6') return qs.ready ? say([
          N('bram', 'The Titan Core... quiet at last? Look! The Arc Fountain is glowing brighter than ever!'),
          N('bram', 'You did it, {name}. Rivet Hollow will tell stories about you for years.'),
          T('THE END... for now. The wastes are still full of secrets. Keep exploring, forging and building.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}. Thanks for playing!`, 6000); } })
          : say([N('bram', 'The Titan\'s lair lies in the far mountains. You\'ll need Spider Legs from the Garage to get in.')]);
        return say([N('bram', 'The town\'s never been safer. Thank you, {name}.')]);
      case 'lune':
        if (s === 's4') return qs.ready ? say([
          N('lune', 'These data logs... the Titan Core was never destroyed. It\'s been rerouting its power into the bots!'),
          N('lune', 'The signal comes from far beyond the rubble wastes. You\'ll need sturdier legs to get anywhere near it.'),
          N('lune', 'Take this blueprint I restored from the logs. Then get Treads fitted and test yourself against a tougher bot. The Mayor will want a report.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('lune', `The ruins hold blueprint fragments and old Titan data logs. Search ${2 - qs.prog} more ruin${2 - qs.prog === 1 ? '' : 's'} (look for the blue glow) and bring me what you find.`)]);
        return say([N('lune', pick([
          'Before the Collapse, every automaton drew power from the Titan Core. Now each one carries its own Arc Core.',
          'Ruins still hold blueprints. The Deckhouse sells a few too, if you have the Gears for it.',
          'Legend says the Titan\'s lair is ringed by cliffs no wheel can climb.',
        ]))]);
      case 'pip': {
        const total = Object.keys(AF.TUTORIAL).length;
        if (qs.tut !== 'active') return say([
          N('pip', 'Hi, I\'m Pip! I help new pilots learn the ropes.'),
          N('pip', 'Want some tutorial tasks? I\'ll pay you a little for every one you finish!'),
        ], { choices: [
          { label: 'Sure!', fn: () => { qs.tut = 'active'; AF.game.toast('Tutorial on. See Party → Quests.'); AF.game.persist(); } },
          { label: 'Not now', fn: () => { qs.tut = 'declined'; AF.game.persist(); } },
        ] });
        if (qs.tdone.length >= total && !qs.grad) return say([
          N('pip', 'You finished EVERY task! You\'re a real pilot now.'),
          N('pip', 'Here, a graduation gift. Capacitors make your next attack hit way harder.'),
        ], { onDone: () => { qs.grad = true; const got = giveReward(state, { credits: 300, card: 'deflector', xp: 50, item: 'lucky_bolt' }); AF.game.toast(`Graduation gift: ${got}.`, 5000); } });
        if (qs.grad) return say([N('pip', 'Look at you go, {name}! Come back and tell me about your adventures.')]);
        const left = Object.entries(AF.TUTORIAL).filter(([k]) => !qs.tdone.includes(k));
        return say([N('pip', `${qs.tdone.length} of ${total} tasks done! Next up: ${left[0][1].title}. ${left[0][1].text}`)]);
      }
      case 'sable':
        if (s === 'b1') return say([
          N('sable', 'You came all the way from Rivet Hollow? Then the Titan stirs again. I felt it in the gears of the Great Clock.'),
          N('sable', 'The Titan was built in the Sunken Foundry, north of our walls. Its makers left their secrets there, and their guardians.'),
          N('sable', 'Bring me proof the Foundry still holds its strongboxes. Open two, and mind the Cog Spiders.'),
        ], { onDone: () => advance(state) });
        if (s === 'b2') return qs.ready ? say([
          N('sable', 'Foundry brass, and a seal I haven\'t seen in fifty years. So the Warden still walks.'),
          N('sable', 'The Clockwork Warden holds the Titan\'s shutdown key. Beat it in the deepest hall and bring the key to me.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('sable', `The Foundry entrance is just north of the city. ${2 - qs.prog} strongbox${2 - qs.prog === 1 ? '' : 'es'} to go.`)]);
        if (s === 'b3') return qs.ready ? say([
          N('sable', 'The Warden\'s key. With this, the Titan Core can be silenced for good.'),
          N('sable', 'Its lair lies in the far mountains, south-east of here. Only Spider Legs will climb those cliffs. Go, Wayfarer.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('sable', 'The Warden waits in the Foundry\'s eastern hall. Strengthen your automaton first. It hits like a falling bell.')]);
        if (AF.QUESTS[s] && ['s1', 's2', 's3', 's4', 's5'].includes(s)) return say([N('sable', 'A traveller from the west? Welcome to Brasshaven. Our Guild takes all sorts.')]);
        return say([N('sable', pick(['The Foundry\'s halls fill up again if you leave them long enough. Good hunting for a Wayfarer.', 'Every Wayfarer leaves a mark on the Guild map. Yours is getting crowded.']))]);
      case 'corwin':
        return say([N('corwin', pick(['Magic and machinery are the same thing, you know. Both are just very old instructions.', 'An Arc Core is a captured spell. Treat yours kindly.', 'The Arcanum sells the best blueprints in the west. Pricey, but worth it.']))]);
      case 'hollis':
        return say([N('hollis', pick(['Brasshaven\'s gates stay open to honest folk. The Foundry\'s, not so much.', 'North of the walls is the Foundry. East and south, the wilds get rough.', 'If you fall in the Foundry, your recovery beacon brings you home to Rivet Hollow.']))]);
      case 'rook':
        if (!state.flags.robot) return say([N('rook', 'Whoa, hold it! The wilds are crawling with rogue bots. Nobody leaves town without an automaton.'), N('rook', 'Go see Engineer Mara outside the Rivet Forge.')]);
        return say([N('rook', pick(['Stay sharp out there. The farther you go from town, the tougher the bots get.', 'Bots with red tags are the nastiest. Steer clear until your automaton is upgraded.', 'If your automaton goes down, the recovery beacon brings you home. You\'ll drop some loot, though.']))]);
      default:
        return say([N(id, pick(n.lines))]);
    }
  };

  Q.door = function (state, id) { // (interiors handle most doors now)
    const notes = {
      archive: [T('The Archive door is locked. A note reads: "Out front. —Lune"')],
      hall: [T('Town Hall is closed for repairs. Mayor Bram is standing outside.')],
      cottage: [T("Pip's Cottage. Nobody's home. Pip is usually near the Pilot Academy.")],
    };
    D.show(notes[id] || [T('It\'s locked.')]);
  };
})();
