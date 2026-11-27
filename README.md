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

After uploading an update, give GitHub Pages a few minutes, then hard-refresh (Ctrl+Shift+R / Cmd+Shift+R). Every file link in `index.html` ends in `?v=0.10.0`. When you change files yourself, bump that number everywhere in `index.html` so players' browsers fetch the new files instead of cached old ones.

Saves are kept in each player's browser. The Menu has a **save code** you can copy to move a save between devices.

## How the game works

| System | What it does |
|---|---|
| **Character art (sprites)** | Characters can be drawn from layered image sprite sheets: a body, hair, beard and one layer per worn item, in 4 directions with an idle and 4 walk frames (`js/sprites.js`). Sheets are listed in `assets/chars/manifest.js`; the format and an AI-art workflow are in `assets/chars/ART-GUIDE.md`, with a `TEMPLATE.png` to trace over. Check art in **`sprite-lab.html`**. Switch in-game with Menu → Character art. Anything without art falls back to the classic code-drawn character. Grey placeholder mannequins are included. |
| **Pilot** | Storybook-painted, about 3 heads tall: chunky shapes, short sturdy limbs, one dark outline and soft painted shading (`js/avatar.js`). **Character creation has no presets.** Everything is set directly: body-shape, build, height and head-size sliders; a smooth skin-tone slider plus an exact colour picker; any hair and eye colour; 16 hairstyles, 8 facial-hair styles, 5 eye styles, 7 brow styles, 5 noses, 6 mouths, 3 ear shapes (round, pointed, long), marks (freckles, scars, war paint, beauty mark), and toggles for lashes, lip colour and rosy cheeks. Preview from the front, side or back, walking or standing. Change it all later at the Salon. The pilot gets hungry in the wild; at zero vitality you're exhausted. |
| **Outfit collecting** | 84 pieces across 10 slots: hat, face, top, bottom, shoes, gloves, back, tool and 2 hidden charms (`js/items.js`). **Everything you wear shows on your pilot** in town, in the wild, in battle and in menus. You pick each starting piece one by one in the creator (`AF.STARTER_POOL`). **Dyes:** any piece can be recoloured (main and detail colour) in the creator or at the Salon, and each piece remembers its colours (`look.dye`). The Wardrobe (`O`) is a collection book: owned vs. undiscovered, completion %, 3 saved outfits. 7 outfit sets give bonuses at 3 and 5 pieces. Duplicates turn into Bolts. |
| **The world** | A 128×128 overworld built from one seed, so it's the same for every player (`js/world.js`). **Rivet Hollow**, a timber-frame village, sits in the south-west. The **Brass Road** runs east over the river to **Brasshaven**, a walled steam-and-spellwork city with a Great Clock, a Wayfarers' Guild, the Gilded Cog Inn, the Arcanum (cards), the Brass Anvil Smithy (upgrades), a branch of the Ironclad Bank and the Velvet & Valve Tailor. Every building has an interior. |
| **The Sunken Foundry** | A hand-built dungeon north of Brasshaven: torch-lit halls, rune crystals, forge pits, 5 strongboxes and 4 new enemies (Cog Spider, Gear Ghoul, Rune Golem and the Clockwork Warden boss). It's dark: your automaton's core and your own light carry you through. The halls refill after a while; the Warden stays down. |
| **Story** | A new chapter between the old quests 5 and 6: The Brass Road → Into the Sunken Foundry → The Clockwork Warden (Guildmaster Sable), then on to the Titan. |
| **Look** | Darker, less cartoony: muted earthy colours, thinner ink lines, more grown-up proportions, facial hair, medieval outfits (hoods, jerkins, chainmail, robes, cloaks, longswords, crossbows, tomes), dusk lighting with lamps and window-glow, and an iron-and-parchment UI. |
| **Constructs** | Chosen when you create a pilot (`AF.CONSTRUCTS` in `js/data.js`). **The Bulwark**: heavy frame, high HP, low speed; keeps half its Block between turns, strikes back for 3 when an attack is fully blocked, +2 Block on defend cards, cards with Thorns and "keep Block". **The Sprocket**: midweight, high speed, low HP; +1 card per turn, combo cards grow stronger with every card played that turn, every 3rd card draws 1. **The Arcwright**: lightweight, medium speed and HP; +1 damage at Mid and +3 at Far, takes +2 per hit at Close, Static Fields zap enemies that close in. Older saves pick a Construct the next time they're loaded. |
| **Deck** | Exactly 30 cards. Each Construct starts with its own 30-card deck; 19 core cards work for everyone, plus 11 cards per Construct. New cards go to storage; swap them in from Party → Deck. |
| **Automaton** | Designed in the character creator's Automaton tab and restyled any time in the Automaton Studio (`js/automaton.js`, drawn in `js/art.js`). All options are open from the start. **Shape:** 7 chassis, 8 heads, 11 eye styles, 6 mouths, 10 toppers. **Gear and finish:** 5 shoulder pieces, 7 back pieces (boiler, exhaust pipes, banner, big cog, wings, gears), 4 limb styles (cable, piston, plated, chain), 5 finishes (clean, polished, matte, worn, rusty) and 10 decals. **Colour:** free pickers for body paint, trim, metal and core glow, with quick swatches. Garage part upgrades still change its wheels, arms, weapon, shield and plating. |
| **Phones, tablets & desktop** | One build adapts to any screen (`css/style.css`, v0.12 responsive layer). **Phone portrait:** the creator preview stays pinned at the top while you scroll the options; Party pages fill the screen with swipeable tabs; cards show two per row. **Phone landscape:** battles put the scene on the left and your hand and End turn on the right; the HUD, D-pad, buttons and dialogue shrink so the map stays visible; the creator and Studio fit the screen height. Notches and rounded corners are respected (safe areas), inputs never trigger iOS zoom, and rotating mid-game just works. **Install it:** open the game in a phone browser and choose *Add to Home Screen* to play full-screen like an app (`manifest.webmanifest`, `assets/icon-*.png`). |
| **Battles: look & feel** | Every fight opens with a cinematic: the screen flashes, letterbox bars open, both sides slide in and a VS banner names the matchup (boss and bounty fights get their own colours). Your opening hand is then dealt card by card from the draw pile, face-down, flipping over as it lands; at the end of a turn your hand flies into the discard pile. Tap the scene to skip the intro. A big glowing **energy orb** and a large **Close / Mid / Far distance track** (the red marker shows where the enemy is) sit right above your hand, with live draw and discard piles. (`js/battle.js`) |
| **Cards** | Redesigned with a frame, a name ribbon, a picture window, a rarity gem and rules text (`js/cards.js`). **Art:** drop images into `assets/cards/` and list them in `assets/cards/manifest.js` (480×288, guide and prompts in `assets/cards/ART-GUIDE.md`); any card without an image shows a painted emblem. **Rarity** (Common → Legendary, looks only): coloured gem, rarity label, and glow — Epic cards pulse, Legendary cards have a spinning gold border. |
| **Card style & achievements** | Party → **Trophies**: pick a frame (9: Ironbound, Polished Brass, Verdigris Copper, Runestone, Clockwork, Wildwood, Obsidian, Gilded, Titan Royal), an animated finish (8: Plain, Holo Shimmer, Embers, Frost, Arc Lightning, Gold Leaf, Prism, Starfield) and a card back (6) for your whole deck, with a live preview. Everything beyond the defaults is unlocked by **19 achievements** (win counts, a flawless win, a 20-damage hit, 5 cards in one turn, disturbances, lures, bounties, forging, upgrading, blueprints, exploring, level 10, outfit collecting, the Warden and the Titan), each with a progress bar. |
| **Encounters** | Far fewer roaming bots (28 instead of 130; `AF.ROAMERS`), and they chase less. Most fights are now chosen: **46 disturbances** glow in the wilds — step in to fight (they stir again after 300 steps); **Bounty Boards** in Rivet Hollow and Brasshaven post 3 jobs every 400 steps — the target is marked with a gold **!** in the world and on the map, the HUD shows how far it is, and finishing pays Bolts, materials and XP; **lures** (Scrap Lure, Arc Lure for a tougher bot) from the Salvage Exchange start a fight wherever you stand (L key or the HUD button). Lure and bounty fights always drop materials. |
| **Gathering mini-games** | Resources sit in **18 named deposits** suited to them (`AF.DEPOSITS`): a small Hollow Junkyard by Rivet Hollow, scrapyards on the scrap fields, copper seams where the rubble meets the crags, silica beds in the dunes, and arcite grottos on the mountain edges — about 70 nodes instead of hundreds scattered everywhere, shown on the map in their resource colour. Gathering is a mini-game (`js/minigame.js`): **Strike** (copper, silicon, arcite) — a needle swings across the vein; hit the glowing seam (gold centre = perfect) with 3 strikes (4 with Drill Arms+), getting faster each swing; harder ores have narrower seams. **Rummage** (scrap) — a scanner sweeps the pile and the best parts glint for a moment; pick 3–4 spots from memory, avoid the spring trap; copper coils and circuit boards hide in there too. A flawless job adds a rare find. Nodes recover slowly (450–900 steps). Leaving before your first swing doesn't use the node up. |
| **Blueprints** | Much rarer and more exciting: 16 ruins (was 34), bounty targets (40%), tier-3 bots (12%), bosses and Foundry chests. Finding one plays a reveal with the card itself. |
| **Townsfolk** | You walk straight through people in town (and shopkeepers), so nobody blocks a doorway or a path. |
| **The world (256×256)** | Four regions (`js/world.js`, `REGIONS`): the **Heartland** (Rivet Hollow, the Brass Road, Brasshaven, the Sunken Foundry), **Frostpeak** (north-east: snowfields, frost pines, glacier ice, peaks), **Mirewood** (south-west: bogs, mire forest, mossy moor) and **the Ashlands** (south-east: ash plains, basalt flows, lava rivers, and the Titan's lair in the far corner). The Frontier Road runs from Brasshaven to **Gearwind Outpost** at the crossroads (Frontier Trading Post, Gearwind Lodge, Waystation Garage, a Bounty Board, Scout Wren and Old Hask), with roads on to each region and a road south from Rivet Hollow into Mirewood. New terrain: snow, frost pines, mire and ash (Wheels); glacier ice, bog and basalt (Treads); lava (impassable). Regional battle backdrops (falling snow, drifting embers, bog mist). Older saves keep their explored map, and a pilot or bot left somewhere impossible is moved. |
| **Bots** | 23 types. New: Cog Runner and Scrap Hexer (Heartland); Frostling, Icewing Drone, Glacier Golem (Frostpeak); Bog Crawler, Spore Drone, Moss Colossus (Mirewood); Cinder Imp, Magma Hound, Furnace Knight (Ashlands). Each region spawns its own bots (`AF.REGION_POOLS`); the outer regions are tier 2–3. Elemental attacks: **chill** (−1 energy next turn), **burn**/**poison** (damage at the start of your next 2 turns, never below 1 HP), **corrode** (strips your Block before the hit); the enemy's intent shows the effect (❄ 🔥 ☣ ⚗). |
| **Resources by region** | 55 deposits over all four regions, each resource on ground that suits it (`AF.DEPOSITS`): scrap in Heartland scrapfields, sunken Mirewood wrecks and Ashlands slag heaps; copper in crag seams, bog-iron shallows and basalt veins; silicon in dunes, Frostpeak crystal beds and obsidian shores; arcite on mountain edges, glacier hearts and lava-lit geodes. The Heartland always gets a starter share. 120 disturbances, 32 ruins and 70 roaming bots spread across the map. |
| **Admin panel** | Hidden developer tools (`js/admin.js`). Open with **Ctrl+Shift+A**, or tap the version number 5 times (title screen or the bottom of the in-game Menu). Cheats (saved with the pilot): god mode, infinite energy, one-hit wins, walk anywhere, peaceful wilds. Unlocks: all cards and blueprints, all outfits, all achievements (frames, finishes, backs), max Bolts and materials, max parts, level 20, restore vitality, reveal the map, refresh nodes and disturbances, or everything at once. Teleport to any town, region, the Foundry gate, the Titan's lair or your bounty target. Fight any bot on demand. An ADMIN tag shows on the HUD while a cheat is on. |
| **Save slots** | 4 slots for different players, each with its own pilot, world and progress. Saves from v0.1 move into slot 1 automatically. |
| **Art style** | Storybook look drawn in code (`js/render.js`, `js/art.js`): bright terrain with inked edges, puffy trees, mushroom-cap houses, bold outlines on everything, big-headed chibi pilot and townsfolk, and a cartoon robot built from its parts. |
| **Interiors** | Every building has a walk-in room with furniture and a keeper (`js/interiors.js`). Shop at the counter, rest in your bed, change clothes at the wardrobe, read books in the Archive. Step onto the door mat to leave. |
| **Money** | Three coins: 100 Bolts = 1 Gear, 100 Gears = 1 Core. Bots only *sometimes* drop money or materials, and resource spots are rarer. |
| **Levels** | Earn XP from bots and quests. Levels add automaton HP, vitality, hand size and energy. |
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
js/pilot.js         pilot looks catalog, classic renderer, character creator (Pilot / Outfit / Automaton tabs)
js/avatar.js        ★ storybook-painted characters (pilot and townsfolk), all faces, hair and worn items
js/town.js          Rivet Hollow shops: catalogs, prices, shop screens
js/quests.js        ★ townsfolk, dialogue boxes, story quests, tutorial tasks
js/world.js         shared map + hand-built town layout, movement, gathering, rendering
js/battle.js        battle rules, animated battle screen (intro, dealing, energy, distance) and effects
js/cards.js         ★ card faces, art slots + painted emblems, rarity, frames, finishes, backs, achievements, Trophies tab
assets/cards/       card art images + manifest.js + ART-GUIDE.md
js/minigame.js      ★ gathering mini-games (Strike, Rummage) and the blueprint reveal
js/admin.js         ★ hidden admin / developer panel (Ctrl+Shift+A)
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
