/* ArcForge — townsfolk, dialogue boxes, the story questline and the optional tutorial. */
(function () {
  const AF = (window.AF = window.AF || {});
  const $ = (s) => document.querySelector(s);
  const look = (o) => Object.assign({ name: '', body: 'm', skin: 1, hair: 1, hairColor: 1, top: 0, topColor: 0, bottom: 0, bottomColor: 5, hat: 0, acc: 0, core: 1 }, o);

  // ---------- Townsfolk (x, y in town tiles) ----------
  AF.NPCS = {
    mara: { name: 'Engineer Mara', x: 8, y: 24, dir: 'left', look: look({ body: 'f', skin: 2, hair: 6, hairColor: 5, top: 3, topColor: 6, bottomColor: 0, hat: 3, acc: 4 }) },
    bram: { name: 'Mayor Bram', x: 24, y: 7, dir: 'down', look: look({ skin: 3, hair: 0, hairColor: 9, top: 1, topColor: 0, hat: 8, acc: 2 }) },
    lune: { name: 'Archivist Lune', x: 13, y: 7, dir: 'down', look: look({ body: 'f', skin: 0, hair: 5, hairColor: 7, top: 4, topColor: 4, bottom: 2, bottomColor: 4, acc: 2 }) },
    pip: { name: 'Pip', x: 14, y: 24, dir: 'down', look: look({ skin: 1, hair: 2, hairColor: 3, top: 2, topColor: 3, bottom: 1, bottomColor: 0, hat: 1, acc: 3 }) },
    rook: { name: 'Guard Rook', x: 18, y: 26, dir: 'left', look: look({ skin: 4, hair: 1, hairColor: 0, top: 6, topColor: 2, hat: 4 }) },
    tess: { name: 'Tess', x: 9, y: 16, wander: true, look: look({ body: 'f', skin: 2, hair: 9, hairColor: 6, top: 0, topColor: 8, bottom: 2, bottomColor: 6 }),
      lines: ["I'm gonna be a pilot too someday! My robot will have a JETPACK.", 'Did you know the pond fish glow at night? Mara says it\'s arc runoff.', 'Gus says the Titan used to light up the whole sky.'] },
    gus: { name: 'Old Gus', x: 24, y: 16, wander: true, look: look({ skin: 0, hair: 0, hairColor: 9, top: 2, topColor: 9, hat: 2 }),
      lines: ['Back in my day, the Arc Fountain could power the whole town.', 'Bots out there act on a pattern. Watch what they plan to do next, then stay out of reach.', 'Bank your credits, kid. The wilds take a cut if your robot goes down.'] },
    nell: { name: 'Nell', x: 29, y: 15, wander: true, look: look({ body: 'f', skin: 5, hair: 7, hairColor: 0, top: 1, topColor: 1, acc: 1 }),
      lines: ['The Diner\'s Focus Tea is the only thing keeping me awake.', 'Copper veins show up in the rubble east of here. You\'ll need Treads.', 'The Deckhouse restocks every so often. Check back!'] },
    vik: { name: 'Vik', x: 12, y: 26, wander: true, look: look({ skin: 3, hair: 3, hairColor: 1, top: 0, topColor: 2, bottom: 1, bottomColor: 9 }),
      lines: ['Spark Spitters shoot from far away. Get a Rail Shot or close the gap fast!', 'Ruins have a little blue light while nobody\'s searched them yet.', 'I traded three Scrap for a sandwich once. Worth it.'] },
  };

  // ---------- Quests ----------
  AF.QUESTS = {
    s1: { title: 'A Spark of Your Own', text: 'Engineer Mara has built your first robot. Find her outside the Rivet Forge (south-west).', obj: { type: 'talk' }, next: 's2' },
    s2: { title: "The Mayor's Request", text: 'Mayor Bram is waiting outside Town Hall (north).', obj: { type: 'talk' }, next: 's3' },
    s3: { title: 'Static in the Fields', text: 'Defeat 3 rogue bots outside town, then report to Mayor Bram.', obj: { type: 'win', n: 3 }, turnIn: 'bram', reward: { credits: 400, rations: 2, xp: 80 }, next: 's4' },
    s4: { title: 'Echoes in the Ruins', text: 'Search 2 ruins in the wilds, then bring the data to Archivist Lune.', obj: { type: 'ruin', n: 2 }, turnIn: 'lune', reward: { credits: 300, blueprint: 1, xp: 100, item: 'scout_goggles' }, next: 's5' },
    s5: { title: 'Over the Rubble', text: 'Upgrade to Treads at the Garage and defeat a tougher bot (yellow tag or higher). Report to Mayor Bram.', obj: { type: 'win', n: 1, minTier: 2 }, turnIn: 'bram', reward: { credits: 600, xp: 150, item: 'ranger_jacket' }, next: 's6' },
    s6: { title: "The Titan's Call", text: "Climb to the Titan's lair in the far mountains (Spider Legs needed) and shut the Titan Core down. Then tell Mayor Bram.", obj: { type: 'boss', n: 1 }, turnIn: 'bram', reward: { credits: 5000, xp: 600 }, next: 'end' },
  };
  AF.TUTORIAL = {
    t1: { title: 'First Harvest', text: 'Gather 5 Scrap from scrap piles outside town.', obj: { type: 'gather', res: 'scrap', n: 5 }, reward: { credits: 100, xp: 20, item: 'work_gloves' } },
    t2: { title: 'First Fight', text: 'Win a battle against a rogue bot.', obj: { type: 'win', n: 1 }, reward: { credits: 100, rations: 1, xp: 20 } },
    t3: { title: 'Forged in Fire', text: 'Forge a new card at the Rivet Forge.', obj: { type: 'forge', n: 1 }, reward: { credits: 150, xp: 20 } },
    t4: { title: 'Tune-Up', text: 'Upgrade any robot part at the Bolt & Gear Garage.', obj: { type: 'upgrade', n: 1 }, reward: { credits: 200, xp: 20, item: 'sneakers' } },
    t5: { title: 'Fuel Up', text: 'Buy anything at the Sparkplug Diner.', obj: { type: 'food', n: 1 }, reward: { credits: 100, xp: 20 } },
    t6: { title: 'Safe Keeping', text: 'Deposit money or materials at the Ironclad Bank.', obj: { type: 'deposit', n: 1 }, reward: { credits: 100, xp: 20, item: 'lunchbox' } },
    t7: { title: 'Know Your Deck', text: 'Open your deck with the "Robot & deck" button (or press Q).', obj: { type: 'deck', n: 1 }, reward: { credits: 50, xp: 20 } },
  };

  const Q = (AF.Quests = {});
  Q.fresh = () => ({ story: 's1', prog: 0, ready: false, tut: null, tprog: {}, tdone: [], grad: false });

  function matches(o, type, data) {
    if (o.type !== type) return 0;
    if (type === 'gather') return o.res === data.res ? data.amt : 0;
    if (type === 'win') return !o.minTier || data.tier >= o.minTier ? 1 : 0;
    return 1;
  }

  function giveReward(state, rw) {
    const out = [];
    if (rw.credits) { state.credits += rw.credits; out.push(AF.moneyText(rw.credits)); }
    if (rw.xp) { const n = AF.gainXP(state, rw.xp); out.push(`${n} XP`); }
    if (rw.item) { if (AF.giveItem(state, rw.item)) out.push(`a ${AF.ITEMS[rw.item].name}`); }
    if (rw.rations) { state.pilot.rations += rw.rations; out.push(`${rw.rations} Field Ration${rw.rations > 1 ? 's' : ''}`); }
    if (rw.card) { const c = AF.newCard(rw.card); c.inDeck = AF.deckCards(state).length < AF.DECK_MAX; state.cards.push(c); out.push(`a ${AF.CARDS[rw.card].name} card`); }
    if (rw.blueprint) {
      const locked = Object.keys(AF.CARDS).filter((id) => !state.known.includes(id));
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
    if (npc) { const c = $('#dialog .dlg-face'); c.width = 128; c.height = 128; AF.drawPilotAt(c.getContext('2d'), 64, 250, 240, npc.look, 'down', 0, {}); }
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
      T('Today, {name}, you finally become a pilot. Engineer Mara has been building a robot just for you.'),
      T('Move with the arrow keys or WASD (hold Shift to run), or the pad on a touch screen. Face something and press E, Space or the A button to talk, read, enter, gather or search.'),
      T('Would you like tutorial tasks while you play? Pip will reward you for each one.'),
    ], { choices: [
      { label: 'Yes, show me', fn: () => { state.quests.tut = 'active'; AF.game.toast('Tutorial on. Check your tasks in Robot & deck → Quests.', 5000); after(); } },
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
          N('mara', "There you are, {name}! I was up all night finishing her."),
          N('mara', "Every pilot in Rivet Hollow needs a robot, and this one's yours: scrap frame, a Spark Cell core and a set of trusty wheels."),
          T('Mara flips a switch. The robot\'s core flickers to life and glows in your favourite colour.'),
          N('mara', "She's bonded to you now. She'll follow you anywhere."),
          N('mara', 'Oh! Mayor Bram wanted to see you. He\'s outside Town Hall, up north.'),
        ], { onDone: () => {
          state.flags.robot = true; AF.World.placeRobot(state); AF.sfx('win'); AF.gainXP(state, 20);
          advance(state); AF.game.persist(); AF.game.refresh();
        } });
        return say([N('mara', pick([
          'Bring me materials and I\'ll forge cards for you. Step up to the Forge door and press the action button.',
          'Treads will get you over the rubble east of town. The Garage can fit them.',
          'If your robot takes a beating, the Garage fixes it up for a few Bolts.',
          'Upgraded cards hit harder. I can upgrade them inside the Forge for Scrap and a Circuit.',
        ]))]);
      case 'bram':
        if (s === 's1') return say([N('bram', 'Ah, our newest pilot! Go see Mara at the Rivet Forge first. She has something for you.')]);
        if (s === 's2') return say([
          N('bram', 'So Mara finished your robot! A fine-looking machine.'),
          N('bram', 'You know the story. When the Titan Core went dark, its bots went wild. Lately they\'re getting bolder, prowling right outside our gates.'),
          N('bram', 'Take your robot out and defeat 3 rogue bots. Watch their next move, and step out of reach when they wind up a big hit!'),
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
          N('bram', 'Lune\'s readings point to the Titan\'s lair, deep in the far mountains. Only Spider Legs can climb those cliffs.'),
          N('bram', 'Get your robot ready. When you are... shut that thing down.'),
        ], { onDone: () => { const got = turnIn(state); AF.game.toast(`Reward: ${got}.`, 4500); } })
          : say([N('bram', 'Fit your robot with Treads at the Garage, then take on one of the tougher bots out past the rubble.')]);
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
          'Before the Collapse, every robot drew power from the Titan Core. Now each one carries its own Arc Core.',
          'Ruins still hold blueprints. The Deckhouse sells a few too, if you have the Gears for it.',
          'Legend says the Titan\'s lair is ringed by cliffs no wheel can climb.',
        ]))]);
      case 'pip': {
        const total = Object.keys(AF.TUTORIAL).length;
        if (qs.tut !== 'active') return say([
          N('pip', 'Hi, I\'m Pip! I help new pilots learn the ropes.'),
          N('pip', 'Want some tutorial tasks? I\'ll pay you a little for every one you finish!'),
        ], { choices: [
          { label: 'Sure!', fn: () => { qs.tut = 'active'; AF.game.toast('Tutorial on. See Robot & deck → Quests.'); AF.game.persist(); } },
          { label: 'Not now', fn: () => { qs.tut = 'declined'; AF.game.persist(); } },
        ] });
        if (qs.tdone.length >= total && !qs.grad) return say([
          N('pip', 'You finished EVERY task! You\'re a real pilot now.'),
          N('pip', 'Here, a graduation gift. Capacitors make your next attack hit way harder.'),
        ], { onDone: () => { qs.grad = true; const got = giveReward(state, { credits: 300, card: 'capacitor', xp: 50, item: 'lucky_bolt' }); AF.game.toast(`Graduation gift: ${got}.`, 5000); } });
        if (qs.grad) return say([N('pip', 'Look at you go, {name}! Come back and tell me about your adventures.')]);
        const left = Object.entries(AF.TUTORIAL).filter(([k]) => !qs.tdone.includes(k));
        return say([N('pip', `${qs.tdone.length} of ${total} tasks done! Next up: ${left[0][1].title}. ${left[0][1].text}`)]);
      }
      case 'rook':
        if (!state.flags.robot) return say([N('rook', 'Whoa, hold it! The wilds are crawling with rogue bots. Nobody leaves town without a robot.'), N('rook', 'Go see Engineer Mara outside the Rivet Forge.')]);
        return say([N('rook', pick(['Stay sharp out there. The farther you go from town, the tougher the bots get.', 'Bots with red tags are the nastiest. Steer clear until your robot\'s upgraded.', 'If your robot goes down, the recovery beacon brings you home. You\'ll drop some loot, though.']))]);
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
