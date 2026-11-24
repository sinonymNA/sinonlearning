// The arcade hub catalog. Every place a student can start a game is listed here with a MOOD and a one-line tagline; the hub draws shelves from it.
// Rules (enforced by tests/hub.test.mjs): every game has a valid mood, a tagline of at most 5 words, a real page, and no shelf shows more than MAX_VISIBLE
// cards (extras sit behind "See all"). To add a game: add one entry here. Do not add a new top-level card anywhere else.
export const MAX_VISIBLE = 3;
export const RECENT_MAX = 5;
export const MOODS = [
  { id: "chill", name: "Chill", sub: "Easy to pick up, no pressure" },
  { id: "sports", name: "Sports", sub: "Call the play, win the game" },
  { id: "brain", name: "Brain", sub: "Think it through, learn something" },
  { id: "party", name: "Party", sub: "Against bots now, with your class when a room opens" },
];
/** icon: an emoji, or a path starting with "/" for an image (shown pixelated).
 *  match = extra path prefixes that count as "playing this game" for the Continue row. */
export const HUB_GAMES = [
  { id: "packs", href: "/arcade/packs", name: "Pack Rush", mood: "chill", tagline: "Rip packs, collect cards", minutes: "5+", icon: "🎴", color: "yellow", match: [] },
  { id: "shelf", href: "/arcade/shelf", name: "Shelf Stocker", mood: "chill", tagline: "Stock the shelves, sort everything", minutes: "2+", icon: "🧺", color: "cyan", match: [] },
  { id: "daily", href: "/arcade/daily", name: "Daily Puzzle", mood: "chill", tagline: "Five quick puzzles", minutes: "3", icon: "🧩", color: "yellow", match: [] },
  { id: "gridiron", href: "/arcade/gridiron", name: "Retro Gridiron", mood: "sports", tagline: "Pixel football, call the plays", minutes: "5+", icon: "🏈", color: "green", match: [] },
  { id: "abyss", href: "/arcade/abyss", name: "Abyss", mood: "brain", tagline: "Rare answers, deeper dives", minutes: "5", icon: "🌊", color: "cyan", match: [] },
  { id: "meowdoku", href: "/arcade/meowdoku", name: "Meowdoku", mood: "brain", tagline: "Place cats, no touching", minutes: "3+", icon: "/arcade/meowdoku-logo.png", color: "pink", match: [] },
  { id: "peak", href: "/arcade/peak", name: "Mastery Peak", mood: "brain", tagline: "Climb by learning it", minutes: "10", icon: "⛰️", color: "violet", match: [] },
  { id: "practice", href: "/arcade/solo/practice", name: "Practice", mood: "party", tagline: "Party games against bots", minutes: "3", icon: "🥔", color: "pink", match: [] },
  { id: "class", href: "/arcade/multiplayer", name: "Class Games", mood: "party", tagline: "Join with a room code", minutes: "5-20", icon: "👥", color: "pink", match: ["/arcade/join", "/arcade/room"] },
];
export const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/** Group games into mood shelves: {id,name,sub,shown,more}. Empty shelves are dropped. */
export function shelves(games = HUB_GAMES) {
  return MOODS.map((m) => { const list = games.filter((g) => g.mood === m.id); return { ...m, shown: list.slice(0, MAX_VISIBLE), more: list.slice(MAX_VISIBLE) }; }).filter((s) => s.shown.length);
}
/** Which game (if any) a page path belongs to. Longest matching prefix wins. */
export function gameForPath(path, games = HUB_GAMES) {
  let best = null, len = 0;
  for (const g of games) for (const p of [g.href, ...g.match]) if ((path === p || path.startsWith(p + "/")) && p.length > len) { best = g; len = p.length; }
  return best ? best.id : null;
}
/** Newest first, no duplicates, capped. */
export function pushRecent(list, id, at, max = RECENT_MAX) { return [{ id, at }, ...list.filter((x) => x && x.id !== id)].slice(0, max); }
/** Problems with a catalog (empty = fine). Used by the tests so a bad entry fails CI, not a classroom. */
export function validateCatalog(games = HUB_GAMES) {
  const errs = [], ids = new Set(), hrefs = new Set(), moods = new Set(MOODS.map((m) => m.id));
  for (const g of games) {
    if (ids.has(g.id)) errs.push(`duplicate id ${g.id}`); ids.add(g.id); if (hrefs.has(g.href)) errs.push(`duplicate href ${g.href}`); hrefs.add(g.href);
    if (!moods.has(g.mood)) errs.push(`${g.id}: unknown mood ${g.mood}`); if (wordCount(g.tagline) > 5) errs.push(`${g.id}: tagline over 5 words`); if (!g.name || !g.icon) errs.push(`${g.id}: needs name and icon`);
  }
  return errs;
}
