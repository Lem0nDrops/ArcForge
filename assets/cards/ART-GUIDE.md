# Card art guide

Every card has an art window. Cards with no image show a built-in painted emblem, so add art one card at a time.

## Adding art
1. Save the image as `assets/cards/<card id>.png` (or .jpg / .webp).
2. Add it to `assets/cards/manifest.js` under `cards`, e.g. `claw: 'assets/cards/claw.png',`
3. Reload. The card now shows your image everywhere: battle, deck, forge, shops.

Upgraded cards (Claw Swipe+) use the same art as the base card.

## Size and framing
- **480 × 288 px** (5:3). Larger is fine if it keeps 5:3; it is scaled down.
- Keep the subject centred; the top-left corner sits under the cost gem and the top-right under the rarity gem.
- No text, no border, no card frame: the game draws the frame, name and rules text.
- Dark, painted, medieval-steampunk with a little magic, matching the game's look.

## Prompt template
> Painted storybook illustration, dark medieval steampunk with subtle magic, [SUBJECT], dramatic rim light, muted earthy palette with one glowing accent colour ([ACCENT]), soft painterly brushwork, centred composition, no text, no border, 5:3

Accent colour by card kind: Attack = ember red, Defend = steel blue, Move = teal, Repair = green, Tech = violet.

## Card ids
Base: claw, blaster, brace, advance, retreat, patch, scan, piston, rail, scatter, salvager, dash, deflector, magnet, weld, nano, overclock, emp, tune
Bulwark: counter, bash, spikes, hold, rampart, slam, ironwall, fortify, aegis, unbreak, vengeance
Sprocket: jab, flurry, spinkick, ratchet, zip, slipstream, revup, finisher, whirl, turbo, chain
Arcwright: arcbolt, volley, chargeshot, repulse, kite, static, capacitor, lance, tesla, blink
