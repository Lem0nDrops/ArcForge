# ArcForge

An open-world card battler. Explore a wasteland, gather materials, forge cards, and upgrade your robot part by part, then take down the Titan Core.

Plain HTML, CSS and JavaScript. No build step, no frameworks. It runs in any browser, on GitHub Pages, and as a desktop app.

## Play it

- **Locally:** double-click `index.html`. That's it.
- **Online:** host it on GitHub Pages (below).

Controls: WASD / arrow keys, the on-screen pad, or tap the map. `E` opens the Workshop, `M` the map. In battle: `1`–`9` play cards, `E` or Space ends your turn.

## Put it on GitHub Pages

1. Create a new repo on GitHub (for example `ArcForge`).
2. **Add file → Upload files**, and drag in everything from this folder, keeping the `css` and `js` folders. Include the hidden `.nojekyll` file if your uploader shows it (it's optional).
3. **Settings → Pages → Build and deployment**, then set Source to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute your game is live at `https://<your-username>.github.io/ArcForge/`.

Saves are kept in each player's browser. The Menu has a **save code** you can copy to move a save between devices.

## How the game works

| System | What it does |
|---|---|
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
js/world.js         map generation, movement, gathering, fog, map drawing
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

### Swap in real art
`AF.robotSVG` / `AF.enemySVG` return SVG strings, and map tiles are drawn in `drawTile` in `world.js`. Any of them can be replaced with `<img>` tags or `ctx.drawImage()` PNG sprites without touching the game rules.

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
4. **Before a paid release:** bundle the two Google Fonts locally (the desktop build falls back to system fonts when offline), add real art and music, a settings screen, controller support, and Steam Cloud saves.
