# Arcade hub: shelves, not a wall of cards

**Goal:** add more games without the front door getting busier. The hub is built from one catalog; students see a handful of things, grouped by mood.

## What students see
- **Home** (`/arcade`): welcome + today's Daily Puzzle banner, a **Continue** row, then mood shelves. **Games** (`/arcade/solo`): the same shelves without the banner.
- **Continue**: small pills for the last (up to 3) games played on this device, newest first, with a live status from that game's own save ("2 orders ready to claim", "Season 2, week 3"). Hidden for new visitors.
- **Shelves** by mood: Chill, Sports, Brain, Party. Each card is one line: icon, name, 5-word tagline, optional status. No chips, no blurbs, no looping animation.
- **See all**: a shelf shows at most 3 cards; extras sit behind "See all N".
- **Calm by default**: hub pages carry `hb-calm`, which turns off the stagger-in, wobbling art, sweeps and the marquee. The first-time intro animation now plays once per device instead of every session.

## Adding a game (the only step)
Add one entry to `arcade-server/hub.mjs` (`HUB_GAMES`): `id`, `href`, `name`, `mood`, `tagline` (**max 5 words**), `minutes`, `icon`, `color`, optional `match` (extra paths that count as playing it). The hub, Home, Games page and Continue row pick it up. `npm run arcade:test` fails if the mood is unknown, the tagline is too long, a link has no page, or ids/links repeat.
- Do not add a new top-level card or tile anywhere else.
- A shelf with more than 3 games is fine (extras go behind "See all"), but ask whether an old game should retire instead.
- Fantasy football (planned) goes on the Sports shelf.

## Continue row plumbing
`AppShell` records `{id, at}` in `localStorage["arcade:recent"]` whenever the path belongs to a catalog game (`gameForPath`). Status lines read each game's own saves (`packrush:v2`, `gridiron:career:v1`) and the server data the hub already loads. Per-device only, nothing about students is sent anywhere.

## Not built yet
- **Teacher class playlist** (teacher picks which 3 to 5 games their class sees). Next step; needs a small settings page and a server-side per-class setting.
- Play counts (anonymous totals per game) to decide which games to polish or retire.
- The Multiplayer page still lists every party game in a grid; it is only reached on purpose, but could get the same treatment.
