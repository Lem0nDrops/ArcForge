# ArcForge

An open-world card battler with a handheld-era pixel look. Explore a wasteland, gather materials, forge cards, and upgrade your robot part by part, then take down the Titan Core.

Plain HTML, CSS and JavaScript. No build step, no frameworks. It runs in any browser, on GitHub Pages, and as a desktop app.

## Play it

- **Locally:** double-click `index.html`. That's it.
- **Online:** host it on GitHub Pages (below).

Controls: WASD / arrow keys, the on-screen pad, or tap the map. Walk into people to talk, into doors to enter, into signs to read. Enter / Space / tap continues dialogue. `E` opens your deck, `M` the map, `R` eats a ration. In battle: `1`–`9` play cards, `E` or Space ends your turn.

## Put it on GitHub Pages

1. Create a new repo on GitHub (for example `ArcForge`).
2. **Add file → Upload files**, and drag in everything from this folder, keeping the `css` and `js` folders. Include the hidden `.nojekyll` file if your uploader shows it (it's optional).
3. **Settings → Pages → Build and deployment**, then set Source to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute your game is live at `https://<your-username>.github.io/ArcForge/`.

After uploading an update, give GitHub Pages a few minutes, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). Every file link in `index.html` ends in `?v=0.3.1`. When you change files yourself, bump that number everywhere in `index.html` so players' browsers fetch the new files instead of cached old ones.

Saves are kept in each player's browser. The Menu has a **save code** you can copy to move a save between devices.

## How the game works

| System | What it does |
|---|---|
| **Pilot** | You play a customizable pilot (male/female, skin, hair style and color, top, bottoms, headwear, accessory) and your robot follows you around. Pick your robot's core color too. The pilot gets hungry in the wild; at zero vitality you're exhausted (−1 energy in battle, smaller harvests). |
| **Save slots** | 4 slots for different players, each with its own pilot, world and progress. Saves from v0.1 move into slot 1 automatically. |
| **Art style** | Original pixel art painted in code (`js/pixel.js`): 16×16 tiles, outlined sprites, 4-direction walking, DS-style menus and a two-platform battle scene. |
| **Shared world** | Every player gets the same 96×96 map, built from `AF.WORLD_SEED` in `js/data.js`. Saves only store what changes (position, harvested nodes, searched ruins, enemies, explored area). |
| **Story & tutorial** | A 6-part story questline (Mara → Mayor Bram → Archivist Lune → the Titan Core) and 7 optional tutorial tasks from Pip, each with rewards. Talk to townsfolk by walking into them. Quest log is in Robot & deck → Quests. |
| **Rivet Hollow** | A hand-built town with 12 buildings, 9 townsfolk, signs, a pond and a fountain square. Walk into a door to enter: **Your House** (rest, wardrobe), **Rivet Forge** (forge and upgrade cards, build your deck), **The Deckhouse** (buy/sell cards and blueprints, restocks every 120 steps), **Salvage Exchange** (buy/sell card components), **Bolt & Gear Garage** (part upgrades, repairs, core paint), **Ironclad Bank** (store credits and materials safely), **Sparkplug Diner** (meals, Field Rations, 3-battle buffs), **Pilot Academy** (7 permanent skills), **Gearwear Boutique** (premium outfits plus a wardrobe). |
| **Credits** | Earned from battles, ruins and selling. Lose a fight and you drop 25% of the credits and materials you're carrying; banked items are safe. |
| **World** | 72×72 map from a random seed: grassland, forest, sand, rubble, water, mountains. Fog of war, resource nodes that regrow, ruins with blueprints, roaming enemies that get tougher the farther you go from home. |
| **Robot parts** | Arc Core (energy per turn), Frame (HP), Locomotion (terrain you can cross: Treads → rubble, Hover Jets → water, Spider Legs → mountains), Arms (hand size, gathering, mining Arcite), Weapon (+damage), Shield (+block). Each goes to level 5, and the robot's look changes with every upgrade. |
| **Cards** | 25 cards across Attack, Defend, Move, Repair and Tech. Starter cards can be forged right away. Advanced cards need blueprints from ruins or tougher enemies. Any card can be upgraded to a "+" version. |
| **Battles** | Turn-based, using energy from your Arc Core. Distance matters: Close / Mid / Far. Melee needs Close, blasters reach Mid, rail guns hit anywhere. Enemies show their next move, so you can step out of range to dodge. HP carries between fights, and you repair at the Home Forge. |
| **Goal** | Find the Titan Core's lair (ringed by mountains, so you need Spider Legs) and defeat it. |

## Project layout

```
index.html          screens and script tags
css/style.css       all styling
js/data.js          ★ content: resources, parts, cards, enemies, costs. Balance lives here.
js/state.js         new game, save/load, save codes, sound effects
js/art.js           robot and enemy drawings (SVG, built from part levels)
js/pixel.js         ★ pixel art: tiles, buildings, decorations, bots, robot, pixel font
js/pilot.js         pilot looks catalog, 4-direction pilot sprite, character creator / wardrobe
js/town.js          Rivet Hollow shops: catalogs, prices, shop screens
js/quests.js        ★ townsfolk, dialogue boxes, story quests, tutorial tasks
js/world.js         shared map + hand-built town layout, movement, gathering, rendering
js/battle.js        battle rules and battle screen
js/ui.js            Workshop (robot / forge / deck / map), menu, help
js/main.js          boot, input, game loop
electron-main.js    desktop wrapper (ignored by the web version)
package.json        desktop build config (ignored by the web version)
```

### Add a new card
Add one line to `AF.CARDS` in `js/data.js`:
```js
zap: { name: 'Zap Coil', cost: 1, kind: 'attack', range: 1, dmg: 5, stun: 1, bp: true, recipe: { copper: 3, arcite: 1 } },
```
Available effects: `dmg`, `hits`, `block`, `move` (`'in'`, `'out'`, `'close'`), `heal`, `draw`, `energy`, `selfDmg`, `charge`, `stun`, `fortify`, `tune`, `bash`, `salvage`, `exhaust`. Set `bp: true` to make it a blueprint found in the world.

### Add a new enemy
Add an entry to `AF.ENEMIES`, put its id in `AF.TIERS`, and add a drawing case in `AF.enemySVG` (`js/art.js`). Unknown types fall back to the boss drawing until you do.

### Add clothes or hairstyles
Add an entry to a list in `AF.LOOK` (`js/pilot.js`). Give it a price (`['Mohawk', 30]`) to sell it at the Boutique, then add a drawing case in `AF.drawPilot`.

### Add a shop item
Food, buffs and Academy skills live at the top of `js/town.js` (`T.FOOD`, `T.PERKS`). Material prices are in `T.MARKET`. Building names, signs and positions are in `AF.BUILDINGS` (`js/data.js`).

### Write dialogue or new quests
Everything lives in `js/quests.js`. Add townsfolk to `AF.NPCS` (position in town tiles, a look, and `lines` for chit-chat). Story steps are in `AF.QUESTS`, and each has an objective (`win`, `ruin`, `gather`, `boss`, `forge`, `upgrade`, `food`, `deposit`, `deck`), who you report to, and a reward. Conversations for quest-givers are in `Q.talk`.

### Change the town layout
The town is drawn in `buildMap` in `js/world.js` (paths, trees, pond, lamps, signs). Building positions and colours are in `AF.BUILDINGS` in `js/data.js`.

### Swap in real art
Every tile and sprite comes from a function in `js/pixel.js` (or `AF.pilotSprite` in `js/pilot.js`) that returns a small canvas. Return a loaded PNG instead and the rest of the game won't notice. Battle sprites are pixelated versions of `AF.robotSVG` / `AF.enemySVG` in `js/art.js`.

## Road to Steam (and other stores)

The game already runs as a desktop app:

```bash
npm install
npm start        # opens ArcForge in its own window (F11 = fullscreen)
npm run dist     # builds a Windows / Mac / Linux app folder in dist/
```

Run it on a computer with Node.js installed (a phone can't do this step). Bump the `electron` and `electron-builder` versions in `package.json` to the latest when you get there.

Suggested path:
1. **Now:** GitHub Pages. Share it and get feedback.
2. **itch.io:** zip this folder and upload it as an HTML5 game. It's free and good for early testers.
3. **Steam:** sign up for Steamworks and pay the Steam Direct fee ($100 per game, recouped once the game earns $1,000). Then upload the `npm run dist` output with SteamPipe. For achievements, the overlay and cloud saves, add [steamworks.js](https://www.npmjs.com/package/steamworks.js) to the Electron wrapper.
4. **Before a paid release:** bundle the Pixelify Sans font locally (the desktop build falls back to system fonts when offline), add real art and music, a settings screen, controller support, and Steam Cloud saves.
