# Wilds Region Production Pipeline

Wilds is a content-driven Phaser game. Movement, mobile controls, combat, capture, room transitions, saving, audio, and responsive rendering live in the engine. A region supplies content through one JSON manifest.

## Fast workflow

1. Clone the existing region into a new package:

   ```bash
   npm run wilds:scaffold -- ember-peaks "Ember Peaks"
   ```

2. Edit `components/wilds/regions/ember-peaks.json`. Start with the `creativeBrief`, creature list, rarity progression, room recipe, and questions.

3. Generate prompts directly from the manifest:

   ```bash
   npm run wilds:prompts -- ember-peaks
   ```

4. Generate the three backgrounds and three sprite sheets. Keep the dimensions, row-major order, white background, and spacing from the generated prompts exactly.

5. Place the files under `public/assets/wilds/regions/ember-peaks/` and update only the asset paths in the manifest.

6. Validate everything before touching the game:

   ```bash
   npm run wilds:validate -- ember-peaks
   npm run build
   ```

7. The scaffold command registers the region automatically. It is playable at `/capsule/wilds?region=ember-peaks`. No Phaser scene edits should be necessary.

## Sprite contracts

- Creature sheet: 4 columns, 320x320 per cell, row-major order.
- Scenery sheet: 4 columns, 320x320 per cell, row-major order.
- Pickup sheet: 4 columns, 320x320 per cell, row-major order.
- Backgrounds: 1280x720 with a clear horizontal walkable lane.
- Sprite sheets should use a pure white edge-connected background. The engine removes that matte at runtime.
- Never add names, rarity labels, grid lines, checkerboards, shadows crossing into another cell, or overlapping subjects.

## What lower-cost models may change

- The region manifest
- Region asset files
- The region catalog import
- Question content
- Generated prompt output

They should not edit `ExpeditionScene.ts`, `BootScene.ts`, physics, battle state, capture logic, saving, or responsive layout for ordinary region production.

## Recommended lower-model task prompt

> Create a new Wilds region using `docs/wilds-region-pipeline.md`. Modify only the new region manifest, its asset folder, and the region catalog. Run `npm run wilds:validate -- REGION_ID`, TypeScript, and the production build. Do not modify Phaser engine scenes. Report any asset that does not satisfy the sprite contract instead of compensating in engine code.

## Manifest responsibilities

The manifest controls:

- Creative theme and generation prompts
- Background and sprite-sheet paths
- Sprite crop order and dimensions
- Creature names, rarity, HP, and capture rates
- Rarity colors, glow colors, and display sizes
- Pickup appearance, effects, values, and messages
- Scenery pool and fixed placement slots
- Room names, backgrounds, encounters, weights, rewards, and prompts
- Starting HP, movement lane, exit position, and coin rewards
- Region title copy and victory copy
- Educational question bank and answer keys

Validation rejects broken references and dimensions before they reach Phaser or Railway.
