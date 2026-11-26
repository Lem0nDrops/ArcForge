# Automata: ArcForge

An open-world card battler set in a dark medieval-steampunk world with a little old magic. Dress up your pilot and collect outfits, build and name your own automaton, explore a wasteland, forge cards, and take down the Titan Core.

Plain HTML, CSS and JavaScript. No build step, no frameworks. It runs in any browser, on GitHub Pages, and as a desktop app.

## Play it

- **Locally:** double-click `index.html`. That's it.
- **Online:** host it on GitHub Pages (below).

Controls: WASD / arrow keys to walk (hold Shift to run). Face something and press E, Space or Enter to interact: talk, enter doors, read signs, gather resources, search ruins. `Q` opens your deck and quests, `I` your pilot, `O` your wardrobe, `M` the map, `R` eats a ration. On touch screens: the pad, A to interact, hold B to run, or drag on the map like a joystick. In battle: `1`–`9` play cards, `E` or Space ends your turn.

## Put it on GitHub Pages

1. Create a new repo on GitHub (for example `ArcForge`).
2. **Add file → Upload files**, and drag in everything from this folder, keeping the `css`, `js` and `assets` folders. Include the hidden `.nojekyll` file if your uploader shows it (it's optional).
3. **Settings → Pages → Build and deployment**, then set Source to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute your game is live at `https://<your-username>.github.io/ArcForge/`.

After uploading an update, give GitHub Pages a few minutes, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). Every file link in `index.html` ends in `?v=0.8.0`. When you change files yourself, bump that number everywhere in `index.html` so players' browsers fetch the new files instead of cached old ones.

Saves are kept in each player's browser. The Menu has a **save code** you can copy to move a save between devices.

## How the game works

| System | What it does |
|---|---|
| **Pilot** | A big-headed chibi drawn entirely from what you wear (`js/pilot.js`). Pick body, skin, 10 hairstyles, hair color, 5 eye styles and eye color, plus a starter outfit (Scavenger, Tinker or Dreamer). Change hair and eyes later at the Boutique's Salon. The pilot gets hungry in the wild; at zero vitality you're exhausted. |
| **Outfit collecting** | 84 pieces across 10 slots: hat, face, top, bottom, shoes, gloves, back, tool and 2 hidden charms (`js/items.js`). **Everything you wear shows on your pilot** in town, in the wild, in battle and in menus. Most pieces also give stats. The Wardrobe (`O`) is a collection book: owned vs. undiscovered, completion %, 3 saved outfit presets. 7 outfit sets (Wastelander, Forgehand, Skyrunner, Pastel Pop, Archivist, Diner Crew, Arcknight) give bonuses at 3 and 5 pieces. Duplicates turn into Bolts. |
| **The world** | A 128×128 overworld built from one seed, so it's the same for every player (`js/world.js`). **Rivet Hollow**, a timber-frame village, sits in the south-west. The **Brass Road** runs east over the river to **Brasshaven**, a walled steam-and-spellwork city with a Great Clock, a Wayfarers' Guild, the Gilded Cog Inn, the Arcanum (cards), the Brass Anvil Smithy (upgrades), a branch of the Ironclad Bank and the Velvet & Valve Tailor. Every building has an interior. |
| **The Sunken Foundry** | A hand-built dungeon north of Brasshaven: torch-lit halls, rune crystals, forge pits, 5 strongboxes and 4 new enemies (Cog Spider, Gear Ghoul, Rune Golem and the Clockwork Warden boss). It's dark: your automaton's core and your own light carry you through. The halls refill after a while; the Warden stays down. |
| **Story** | A new chapter between the old quests 5 and 6: The Brass Road → Into the Sunken Foundry → The Clockwork Warden (Guildmaster Sable), then on to the Titan. |
| **Look** | Darker, less cartoony: muted earthy colours, thinner ink lines, more grown-up proportions, facial hair, medieval outfits (hoods, jerkins, chainmail, robes, cloaks, longswords, crossbows, tomes), dusk lighting with lamps and window-glow, and an iron-and-parchment UI. |
| **Constructs** | Chosen when you create a pilot (`AF.CONSTRUCTS` in `js/data.js`). **The Bulwark**: heavy frame, high HP, low speed; keeps half its Block between turns, strikes back for 3 when an attack is fully blocked, +2 Block on defend cards, cards with Thorns and "keep Block". **The Sprocket**: midweight, high speed, low HP; +1 card per turn, combo cards grow stronger with every card played that turn, every 3rd card draws 1. **The Arcwright**: lightweight, medium speed and HP; +1 damage at Mid and +3 at Far, takes +2 per hit at Close, Static Fields zap enemies that close in. Older saves pick a Construct the next time they're loaded. |
| **Deck** | Exactly 30 cards. Each Construct starts with its own 30-card deck; 19 core cards work for everyone, plus 11 cards per Construct. New cards go to storage; swap them in from Party → Deck. |
| **Automaton** | Your robot companion is now an *automaton* you name yourself (default Sprocket). The Automaton Studio (`js/automaton.js`) sets chassis, head, eyes, antenna, paint, trim, decal and core glow; more shapes unlock with pilot level. Garage part upgrades still change its wheels, arms, weapon, shield and plating. Open the studio from the Garage or Party → your automaton's tab. |
| **Save slots** | 4 slots for different players, each with its own pilot, world and progress. Saves from v0.1 move into slot 1 automatically. |
| **Art style** | Storybook look drawn in code (`js/render.js`, `js/art.js`): bright terrain with inked edges, puffy trees, mushroom-cap houses, bold outlines on everything, big-headed chibi pilot and townsfolk, and a cartoon robot built from its parts. |
| **Interiors** | Every building has a walk-in room with furniture and a keeper (`js/interiors.js`). Shop at the counter, rest in your bed, change clothes at the wardrobe, read books in the Archive. Step onto the door mat to leave. |
| **Money** | Three coins: 100 Bolts = 1 Gear, 100 Gears = 1 Core. Bots only *sometimes* drop money or materials, and resource spots are rarer. |
| **Levels** | Earn XP from bots and quests. Levels add automaton HP, vitality, hand size and energy, and unlock automaton styles. |
| **Movement & interaction** | Smooth, constant-speed walking with running. Nothing happens by bumping: you face something and press the action button, and a prompt shows what you can do. |
| **Battles** | Fully animated: cards deal in and fly out, your robot lunges or fires bolts, hits flash and shake, damage numbers pop, shields glow, heals sparkle, enemies telegraph and act on their own turn, and defeated bots burst apart. |
| **Shared world** | Every player gets the same 96×96 map, built from `AF.WORLD_SEED` in `js/data.js`. Saves only store what changes (position, harvested nodes, searched ruins, enemies, explored area). |
| **Story & tutorial** | A 6-part story questline (Mara → Mayor Bram → Archivist Lune → the Titan Core) and 7 optional tutorial tasks from Pip, each with rewards. Talk to townsfolk by walking into them. Quest log is in Party → Quests. |
| **Rivet Hollow** | A hand-built town with 12 buildings, 9 townsfolk, signs, a pond and a fountain square. Walk into a door to enter: **Your House** (rest, wardrobe), **Rivet Forge** (forge and upgrade cards, build your deck), **The Deckhouse** (buy/sell cards and blueprints, restocks every 120 steps), **Salvage Exchange** (buy/sell card components), **Bolt & Gear Garage** (part upgrades, repairs, core paint), **Ironclad Bank** (store credits and materials safely), **Sparkplug Diner** (meals, Field Rations, 3-battle buffs), **Pilot Academy** (7 permanent skills), **Gearwear Boutique** (8 rotating outfit pieces with try-on, charms, and the Salon). |
| **Losing** | Lose a fight and you drop 25% of the money and materials you're carrying; banked items are safe. |
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
js/items.js         ★ money tiers, levels & XP, gear catalog, equipment & bag
js/interiors.js     ★ building rooms: layouts, keepers, furniture actions
js/art.js           robot and enemy drawings (SVG, built from part levels)
js/render.js        ★ the world renderer: terrain, buildings, props, lights, particles, prompts
js/pilot.js         pilot looks catalog, 4-direction shaded pilot with walk cycle, character creator
js/town.js          Rivet Hollow shops: catalogs, prices, shop screens
js/quests.js        ★ townsfolk, dialogue boxes, story quests, tutorial tasks
js/world.js         shared map + hand-built town layout, movement, gathering, rendering
js/battle.js        battle rules, animated battle screen and effects
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
Props and buildings are painted once into cached images in `js/render.js` (`treeImg`, `buildingImg`, `nodeImg`, …). Swap any of them for a loaded PNG and the rest of the game won't notice. Robots and enemies come from `AF.robotSVG` / `AF.enemySVG` in `js/art.js`, and the pilot from `AF.drawPilotAt` in `js/pilot.js`.

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
4. **Before a paid release:** bundle the Fredoka and Nunito fonts locally (the desktop build falls back to system fonts when offline), add real art and music, a settings screen, controller support, and Steam Cloud saves.
