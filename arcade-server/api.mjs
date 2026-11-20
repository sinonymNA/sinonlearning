import { GAME_CATALOG, GAME_IDS, MAX_PLAYERS } from "./catalog.mjs";
import { DEFAULT_SET, compatibility, importCsv, itemsFromGameShow, sanitizeLoose, sanitizeQuestion, RECOMMENDED, CONTENT_KEYS } from "./content.mjs";
import { CHARACTERS, PACKS, STARTER_AVATARS, allPackOdds } from "./characters.mjs";
import { DAILY_BONUS, dailyShop, dayKey, dealFor } from "./shop.mjs";
import { ABYSS_PACK_IDS, FISH, FISH_BY_ID, allAbyssPackOdds } from "./characters.mjs";
import * as AB from "./abyss.mjs";
import { PUZZLE_COUNT, TRIES, applyGuess, checkAnswer, coinsFor, dailyPuzzles, publicPuzzle, revealText, stateFor } from "./daily.mjs";
import { GameError, RateLimiter, fail } from "./util.mjs";
import { cleanText } from "./moderation.mjs";
import { BEHAVIORS } from "./bots.mjs";
import { login, signup, startSession } from "./accounts.mjs";
import { buildPool, classReport, mapView, newState, nextQuestion, reconcile, submitAnswer } from "./mastery.mjs";

/** The test lab is open to any signed-in teacher account (no env configuration); guests and students are refused. */
export function isDeveloper(user) {
  return user?.role === "teacher";
}
export const GIFT = { coins: 100, maxPerRoom: 3, dailyCap: 300 };
export const isTeacher = (user) => user?.role === "teacher";

const SAFE_OPTS = (o) => {
  const out = {};
  if (o && typeof o === "object") {
    if (o.draw && typeof o.draw === "object") out.draw = { key: Number(o.draw.key) || 0, from: Math.max(0, Number(o.draw.from) || 0) };
    if (o.tel && typeof o.tel === "object") out.tel = { ci: Math.max(0, Number(o.tel.ci) || 0), st: Number.isInteger(o.tel.st) ? o.tel.st : -1, src: typeof o.tel.src === "string" ? o.tel.src.slice(0, 40) : undefined };
    if (Number.isInteger(o.group) && o.group >= 0 && o.group < 100) out.group = o.group;
    if (Number.isInteger(o.gal) && o.gal >= 0 && o.gal < 100) out.gal = o.gal;
  }
  return out;
};

function authHost(room, ctx) {
  const u = ctx.user;
  if (!u) fail("Sign in as a teacher to control this room.", "forbidden");
  if (u.id !== room.hostUserId && !(room.testMode && room.devUserId === u.id)) fail("Only the teacher who created this room can control it.", "forbidden");
  return u;
}

function limit(service, ctx, key, windowMs, max) {
  if (service.limiter.limited(key, windowMs, max, service.clock())) fail("Slow down a little.", "rate");
}

/** Single entry point used by /api/arcade (and by the automated tests). Throws GameError on failure. */
export async function handle(service, ctx, body) {
  if (!body || typeof body.type !== "string") fail("Malformed message.");
  const { store } = ctx;
  switch (body.type) {
    case "create": {
      if (!isTeacher(ctx.user)) fail("Sign in with a teacher account to host a game.", "forbidden");
      limit(service, ctx, `create:${ctx.user.id}`, 60000, 10);
      let content = DEFAULT_SET;
      if (body.contentSetId && body.contentSetId !== "builtin") {
        const set = await store.getSet(String(body.contentSetId));
        if (!set || set.ownerId !== ctx.user.id) fail("That content set isn't available to you.", "forbidden");
        content = set;
      }
      const room = service.create({
        playlist: body.playlist, hostUserId: ctx.user.id, hostName: ctx.user.name ?? "Teacher", content,
        settings: { teams: body.teams, lateJoin: body.lateJoin, timeScale: 1 },
      });
      return { code: room.code, view: room.view({ mode: "host" }) };
    }
    case "join": {
      limit(service, ctx, `join:${ctx.ip}`, 60000, 240);
      const room = service.need(body.code);
      let owned = [];
      if (ctx.user) owned = (await store.getCollection(ctx.user.id)).map((c) => c.id);
      const p = room.addPlayer({ nickname: body.nickname, avatar: body.avatar, userId: ctx.user?.id ?? null, ownedAvatars: owned });
      return { code: room.code, playerId: p.id, token: p.token, avatar: p.avatar, nickname: p.nickname, view: room.view({ playerId: p.id }) };
    }
    case "poll": {
      const room = service.need(body.code);
      room.metrics.polls++;
      room.tick();
      const opts = SAFE_OPTS(body.opts);
      if (body.host) {
        authHost(room, ctx);
        room.lastActivity = service.clock();
        const mode = body.mode === "dev" && room.testMode && isDeveloper(ctx.user) ? "dev" : "host";
        return { view: room.view({ mode: mode === "dev" ? "dev" : "projector", opts }), mode };
      }
      const p = room.authPlayer(body.playerId, body.token);
      room.touch(p.id);
      return { view: room.view({ playerId: p.id, opts }) };
    }
    case "act": {
      const room = service.need(body.code);
      const p = room.authPlayer(body.playerId, body.token);
      const kind = body.action?.type;
      const heavy = kind === "draw" || kind === "draft";
      limit(service, ctx, `act:${room.code}:${p.id}:${heavy ? kind : "x"}`, heavy ? 2000 : 3000, heavy ? 40 : 18);
      if (JSON.stringify(body.action ?? {}).length > 12000) fail("That message was too large.");
      room.tick();
      const result = room.act(p.id, body.action ?? {});
      return { result, view: room.view({ playerId: p.id, opts: SAFE_OPTS(body.opts) }) };
    }
    case "host": {
      const room = service.need(body.code);
      authHost(room, ctx);
      room.tick();
      if (body.cmd === "content") {
        const id = String(body.args?.setId ?? "builtin");
        let set = DEFAULT_SET;
        if (id !== "builtin") {
          set = await store.getSet(id);
          if (!set || set.ownerId !== ctx.user.id) fail("That content set isn't available to you.", "forbidden");
        }
        room.setContent(set);
      } else if (body.cmd === "gift") {
        // Teacher gift: 100 coins to every SIGNED-IN student currently in the room (guests and bots are skipped).
        if (room.phase === "ended") fail("This session has ended.");
        if ((room.giftCount ?? 0) >= GIFT.maxPerRoom) fail(`You can give coins ${GIFT.maxPerRoom} times per session.`);
        const targets = room.playerList().filter((p) => p.userId && !p.bot);
        if (!targets.length) fail("No signed-in students are in the room yet (guests can't keep coins).");
        const n = (room.giftCount = (room.giftCount ?? 0) + 1);
        let given = 0;
        await Promise.all(targets.map(async (p) => {
          const r = await store.awardCapped({ userId: p.userId, coins: GIFT.coins, key: `${room.id}:gift:${n}`, reason: "gift from teacher", dailyCap: GIFT.dailyCap, group: "gift" });
          if (r.awarded) { given++; p.gift = { id: n, coins: r.coins }; }
        }));
        room.log("teacher_gift", { n, signedIn: targets.length, given });
        room.bump();
        return { view: room.view({ mode: "projector" }), gift: { given, signedIn: targets.length, guests: room.playerList().filter((p) => !p.userId && !p.bot).length, left: GIFT.maxPerRoom - n, coins: GIFT.coins } };
      } else if (body.cmd === "bots") {
        if (room.phase !== "lobby") fail("Add bots from the lobby.");
        const free = MAX_PLAYERS - room.players.size;
        const n = Math.min(free, Math.max(0, Math.floor(Number(body.args?.count) || 0)));
        if (n < 1) fail(free < 1 ? "The room is full." : "Pick how many bots to add.");
        service.addBots(room, n, (SOLO.difficulty[body.args?.difficulty] ?? SOLO.difficulty.medium).behavior);
        room.log("host_added_bots", { count: n });
      } else if (body.cmd === "clearbots") {
        if (room.phase !== "lobby") fail("Remove bots from the lobby.");
        room.bots?.clear();
      } else room.host(String(body.cmd), body.args ?? {});
      room.bump();
      return { view: room.view({ mode: "projector" }) };
    }
    case "chat": {
      const room = service.need(body.code);
      const p = room.authPlayer(body.playerId, body.token);
      limit(service, ctx, `chat:${room.code}:${p.id}`, 8000, 4);
      room.chat(p.id, body.phrase);
      return { ok: true };
    }
    case "solo_create": case "solo_cmd": return handleSolo(service, ctx, body);
    case "info": {
      const room = service.get(body.code);
      return { exists: !!room, phase: room?.phase ?? null, playerCount: room?.players.size ?? 0, lateJoin: room?.settings.lateJoin ?? false };
    }
    default: fail("Unknown message type.");
  }
}

// ---------- economy ----------
export async function handleEconomy(ctx, body) {
  const { store, user } = ctx;
  switch (body.type) {
    case "catalog": {
      const shop = dailyShop();
      return { characters: CHARACTERS, starters: STARTER_AVATARS, packs: allPackOdds(shop.spotlight.characterId), shop };
    }
    case "claim_daily": {
      if (!user) fail("Sign in to claim your daily coins.", "forbidden");
      const day = dayKey();
      const r = await store.awardCapped({ userId: user.id, coins: DAILY_BONUS, key: `daily:${day}`, reason: "daily check-in", dailyCap: DAILY_BONUS, group: "daily" });
      const wallet = await store.getWallet(user.id);
      return { claimed: !!r.awarded, coins: wallet.coins, bonus: DAILY_BONUS };
    }
    case "me": {
      if (!user) return { signedIn: false, ...{ coins: 0, owned: [] } };
      const wallet = await store.getWallet(user.id);
      const owned = await store.getCollection(user.id);
      return { signedIn: true, name: user.name, role: user.role, kind: user.kind ?? "margins", coins: wallet.coins, lifetime: wallet.lifetime, owned };
    }
    case "open_pack": {
      if (!user) fail("Sign in to open packs - guest players can't keep coins or characters.", "forbidden");
      const requestId = String(body.requestId ?? "");
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) fail("Missing request id.");
      const packId = body.packId === undefined ? "basic" : String(body.packId);
      if (!PACKS[packId] || PACKS[packId].game === "abyss") fail("Unknown pack.");
      return store.openPack(user.id, requestId, packId, undefined, dealFor(packId));
    }
    case "delete_my_data": {
      if (!user) fail("Not signed in.", "forbidden");
      if (user.kind === "arcade") await store.deleteAccount(user.accountId);
      else await store.deleteUserData(user.id);
      return { ok: true, loggedOut: user.kind === "arcade" };
    }
    default: fail("Unknown request.");
  }
}

// ---------- teacher content ----------
const aiLimiter = new RateLimiter();
export const AI_LIMIT = { windowMs: 3600_000, max: 12, maxChars: 60_000, minChars: 80 };

export async function handleContent(ctx, body) {
  const { store, user } = ctx;
  if (!isTeacher(user)) fail("Teacher account required.", "forbidden");
  switch (body.type) {
    case "list": {
      const sets = await store.listSets(user.id);
      return { sets: [DEFAULT_SET, ...sets].map((s) => ({ id: s.id, title: s.title, builtin: !!s.builtin, counts: Object.fromEntries(Object.entries(s.items).map(([k, v]) => [k, v.length])), compatibility: compatibility(s) })) };
    }
    case "get": {
      const set = body.id === "builtin" ? DEFAULT_SET : await store.getSet(String(body.id));
      if (!set || (!set.builtin && set.ownerId !== user.id)) fail("Content set not found.", "not_found");
      return { set, compatibility: compatibility(set) };
    }
    case "save": {
      const title = cleanText(body.title, { min: 2, max: 60, label: "Title" });
      // Forgiving: one bad row (too long, flagged, duplicate choices...) must never block saving the rest.
      const { items, dropped, reasons } = sanitizeLoose(body.items);
      const total = Object.values(items).reduce((a, v) => a + v.length, 0);
      if (!total) fail(reasons.length ? `Nothing could be saved. ${reasons.join("; ")}` : "Add at least one item.");
      const saved = await store.saveSet({ id: body.id && body.id !== "builtin" ? String(body.id) : undefined, ownerId: user.id, title, items });
      return { id: saved.id, compatibility: compatibility(saved), dropped, reasons };
    }
    case "delete": await store.deleteSet(String(body.id), user.id); return { ok: true };
    case "import_csv": {
      const kind = String(body.kind);
      if (!["questions", "vocab", "drawPrompts", "telephonePrompts", "imposterWords"].includes(kind)) fail("Unknown content type.");
      const text = String(body.text ?? "");
      if (text.length > 200_000) fail("That CSV is too large.");
      const { items, errors } = importCsv(kind, text);
      return { items, errors: errors.slice(0, 20) };
    }
    case "import_game_show": {
      const id = String(body.id ?? "").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
      if (!id) fail("Paste the game show's play link or ID.");
      const show = await ctx.gameShows?.getById(id);
      if (!show) fail("Game show not found.", "not_found");
      const items = sanitizeLoose(itemsFromGameShow(show.payload)).items;
      return { title: show.title, items, compatibility: compatibility({ items }) };
    }
    case "ai_generate": {
      // Teacher pastes their own notes/vocab/lesson text; our AI turns it into content for every game.
      if (typeof ctx.generate !== "function") fail("AI set-building isn't switched on for this server yet.", "unavailable");
      const text = String(body.text ?? "").trim();
      if (text.length < AI_LIMIT.minChars) fail("Paste a bit more material (a few sentences at least) so the AI has something to work from.");
      if (text.length > AI_LIMIT.maxChars) fail("That's too much for one go. Split it into chunks under 60,000 characters.");
      const grade = cleanText(body.grade || "any grade", { min: 1, max: 40, label: "Grade" });
      // "fill" tops every game up to its recommended amount; "big" aims for double that. Counts already in the set are
      // sent by the client so we only ask for the shortfall, and a sample of existing items so the AI doesn't repeat them.
      const mode = body.mode === "big" ? "big" : "fill";
      const have = body.have && typeof body.have === "object" ? body.have : {};
      const counts = {}, avoid = {};
      for (const k of CONTENT_KEYS) {
        const target = RECOMMENDED[k] * (mode === "big" ? 2 : 1);
        counts[k] = Math.max(0, target - (Math.min(Number(have[k]) || 0, 1000)));
        avoid[k] = (Array.isArray(body.avoid?.[k]) ? body.avoid[k] : []).slice(0, 80).map((x) => String(x).slice(0, 100));
      }
      if (!CONTENT_KEYS.some((k) => counts[k] > 0)) fail("This set already has plenty for every game. Choose \"Big set\" to add even more.");
      if (aiLimiter.limited(`ai:${user.id}`, AI_LIMIT.windowMs, AI_LIMIT.max)) fail("You've used the AI builder a lot this hour. Try again a bit later.", "rate");
      const raw = await ctx.generate({ text, grade, counts, avoid });
      const { items, dropped } = sanitizeLoose(raw);
      const total = Object.values(items).reduce((a, v) => a + v.length, 0);
      if (!total) fail("The AI couldn't make anything usable from that. Try pasting clearer notes.");
      return { items, dropped, requested: counts, compatibility: compatibility({ items }) };
    }
    case "ai_variants": {
      // Mastery Peak: pre-generate sibling questions (same concept, different form) and save them on the set.
      if (typeof ctx.generateVariants !== "function") fail("AI set-building isn't switched on for this server yet.", "unavailable");
      const set = await store.getSet(String(body.id ?? ""));
      if (!set || set.ownerId !== user.id) fail("Content set not found.", "not_found");
      const targets = set.items.questions.map((q, i) => ({ i, q })).filter((x) => !x.q.variants?.length).slice(0, 40);
      if (!targets.length) return { added: 0, remaining: 0 };
      if (aiLimiter.limited(`ai:${user.id}`, AI_LIMIT.windowMs, AI_LIMIT.max)) fail("You've used the AI builder a lot this hour. Try again a bit later.", "rate");
      const raw = await ctx.generateVariants(targets.map(({ i, q }) => ({ i, q: q.q, choices: q.choices, answer: q.answer, concept: q.concept ?? null })));
      let added = 0;
      const questions = set.items.questions.map((q, i) => {
        const got = (Array.isArray(raw) ? raw : []).find((r) => r?.i === i);
        if (!got || !targets.some((t) => t.i === i)) return q;
        try { const clean = sanitizeQuestion({ ...q, variants: got.variants }); if (clean.variants?.length) { added += clean.variants.length; return { ...q, variants: clean.variants }; } } catch { /* keep original */ }
        return q;
      });
      if (!added) fail("The AI couldn't make usable variants. Try again.");
      await store.saveSet({ id: set.id, ownerId: set.ownerId, title: set.title, items: { ...set.items, questions } });
      return { added, remaining: Math.max(0, set.items.questions.filter((q) => !q.variants?.length).length - targets.length) };
    }
    case "compat": return { compatibility: compatibility({ items: sanitizeLoose(body.items).items }) };
    default: fail("Unknown request.");
  }
}

// ---------- developer test lab ----------
export async function handleDev(service, ctx, body) {
  if (!isDeveloper(ctx.user)) fail("Developer access only.", "forbidden");
  const user = ctx.user;
  const labRoom = (code) => {
    const room = service.need(code);
    if (!room.testMode || room.devUserId !== user.id) fail("Not your test room.", "forbidden");
    return room;
  };
  switch (body.type) {
    case "create": {
      const playlist = (Array.isArray(body.playlist) && body.playlist.length ? body.playlist : [GAME_IDS[0]]).filter((g) => GAME_IDS.includes(g));
      const room = service.create({
        playlist, hostUserId: user.id, hostName: "Developer", testMode: true, devUserId: user.id,
        settings: { timeScale: Number(body.timeScale) || 1, teams: Number(body.teams) || 0 },
      });
      const bots = Math.min(39, Math.max(0, Number(body.bots) || 0));
      if (bots) service.addBots(room, bots, BEHAVIORS[body.behavior] !== undefined ? body.behavior : "mixed");
      return { code: room.code };
    }
    case "state": {
      const room = labRoom(body.code);
      room.tick();
      const mem = process.memoryUsage();
      const bots = (room.bots?.list ?? []).map((id) => { const p = room.players.get(id); return p ? { id, nickname: p.nickname, kind: p.bot.kind, offline: p.bot.offline, actions: p.bot.actions, errors: p.bot.errors } : null; }).filter(Boolean);
      return {
        view: room.view({ mode: "dev", opts: SAFE_OPTS(body.opts) }),
        logs: room.logs.slice(-120), bots,
        scores: room.leaderboard(0),
        metrics: { ...room.metrics, players: room.players.size, connected: room.playerList().filter((p) => room.isConnected(p.id)).length, rssMb: Math.round(mem.rss / 1048576), heapMb: Math.round(mem.heapUsed / 1048576), uptimeSec: Math.round(process.uptime()), rooms: service.rooms.size, serverTime: Date.now() },
      };
    }
    case "spawn": { const room = labRoom(body.code); const made = service.addBots(room, Math.min(39, Number(body.count) || 1), BEHAVIORS[body.behavior] !== undefined ? body.behavior : "mixed"); return { spawned: made.length }; }
    case "clear_bots": { const room = labRoom(body.code); room.bots?.clear(); return { ok: true }; }
    case "disconnect": { const room = labRoom(body.code); room.bots?.setOffline(body.ids === "all" || !body.ids ? (body.count ? room.bots.list.slice(0, Number(body.count)) : "all") : body.ids, true); return { ok: true }; }
    case "reconnect": { const room = labRoom(body.code); room.bots?.setOffline("all", false); for (const p of room.playerList()) p.forceOffline = false; return { ok: true }; }
    case "join_self": {
      const room = labRoom(body.code);
      const p = room.addPlayer({ nickname: user.name ? String(user.name).slice(0, 12) : "Dev", avatar: "rk-sun", userId: user.id, ownedAvatars: [] });
      return { playerId: p.id, token: p.token };
    }
    case "set_game": { const room = labRoom(body.code); room.setPlaylist(body.playlist); return { ok: true }; }
    case "host": { const room = labRoom(body.code); room.host(String(body.cmd), body.args ?? {}); return { ok: true }; }
    case "force_offline": { const room = labRoom(body.code); const p = room.players.get(String(body.playerId)); if (p) p.forceOffline = !!body.value; return { ok: true }; }
    default: fail("Unknown dev command.");
  }
}

// ---------- username/password accounts ----------
/** Returns { user?, startSession?: {token, expiresAt}, endSession?: true }. The route layer sets/clears the cookie. */
export async function handleAccount(service, ctx, body) {
  const { store } = ctx;
  switch (body.type) {
    case "signup": {
      limit(service, ctx, `signup:${ctx.ip}`, 3600000, 80);
      const acc = await signup(store, { username: body.username, password: body.password });
      const sess = await startSession(store, acc.id);
      return { user: { name: acc.username, kind: "arcade" }, startSession: sess };
    }
    case "login": {
      limit(service, ctx, `login:${ctx.ip}`, 60000, 40);
      limit(service, ctx, `login-user:${String(body.username).toLowerCase()}`, 60000, 8);
      const acc = await login(store, { username: body.username, password: body.password });
      const sess = await startSession(store, acc.id);
      return { user: { name: acc.username, kind: "arcade" }, startSession: sess };
    }
    case "logout": return { endSession: true };
    case "delete_account": {
      if (ctx.user?.kind !== "arcade") fail("Sign in to your arcade account first.", "forbidden");
      await store.deleteAccount(ctx.user.accountId);
      return { endSession: true };
    }
    default: fail("Unknown request.");
  }
}

// ---------- solo practice (real engine, bot opponents, capped coins) ----------
export const SOLO = {
  bots: { hot_potato: 4, quick_draw: 4, last_one_standing: 9, telephone: 4, imposter: 4, piggy_bank: 7, puffer_party: 4, dacula_dash: 3 },
  difficulty: { easy: { behavior: "sloppy", mult: 0.6 }, medium: { behavior: "average", mult: 1 }, hard: { behavior: "smart", mult: 1.4 } },
  dailyCap: 150,
};

export async function handleSolo(service, ctx, body) {
  switch (body.type) {
    case "solo_create": {
      limit(service, ctx, `solo:${ctx.ip}`, 60000, 60);
      if (!GAME_IDS.includes(body.game)) fail("Pick a game.");
      const diff = SOLO.difficulty[body.difficulty] ? body.difficulty : "medium";
      const room = service.create({ playlist: [body.game], hostUserId: null, hostName: "Practice", settings: { teams: 0, dacula: { minutes: 6, questionSeconds: 12 } }, solo: { game: body.game, difficulty: diff } });
      let owned = [];
      if (ctx.user) owned = (await ctx.store.getCollection(ctx.user.id)).map((c) => c.id);
      const nick = String(body.nickname ?? "").trim() || ctx.user?.name || "Player";
      const p = room.addPlayer({ nickname: nick, avatar: body.avatar, userId: ctx.user?.id ?? null, ownedAvatars: owned });
      service.addBots(room, SOLO.bots[body.game], SOLO.difficulty[diff].behavior);
      room.start();
      return { code: room.code, playerId: p.id, token: p.token, nickname: p.nickname, avatar: p.avatar };
    }
    case "solo_cmd": {
      const room = service.need(body.code);
      if (!room.solo) fail("Not a solo run.", "forbidden");
      const p = room.authPlayer(body.playerId, body.token);
      room.touch(p.id);
      const cmd = String(body.cmd);
      if (!["pause", "resume", "quit"].includes(cmd)) fail("Unknown command.");
      room.host(cmd === "quit" ? "end" : cmd);
      return { view: room.view({ playerId: p.id }) };
    }
    default: fail("Unknown request.");
  }
}
export { GameError, GAME_CATALOG };


// ---------- Mastery Peak ----------
export const PEAK = { reward: 100, perMinute: 90 };
const peakLimiter = new RateLimiter();
const peakLocks = new Map();
/** Serialise one student's requests so double-clicks can't answer the same question twice. */
async function withLock(key, fn) {
  const prev = peakLocks.get(key) ?? Promise.resolve();
  let release; const gate = new Promise((r) => { release = r; });
  const mine = prev.then(() => gate);
  peakLocks.set(key, mine);
  await prev;
  try { return await fn(); } finally { release(); if (peakLocks.get(key) === mine) peakLocks.delete(key); }
}

async function peakSet(store, id) {
  const setId = String(id ?? "");
  if (!setId) fail("Pick a set to climb.");
  const set = setId === "builtin" ? DEFAULT_SET : await store.getSet(setId);
  if (!set) fail("That Mastery Peak set wasn't found. Check the link your teacher gave you.", "not_found");
  const pool = buildPool(set);
  if (!pool.concepts.length) fail("This set has no multiple-choice questions to climb.");
  return { set, setId, pool };
}

export async function handleMastery(ctx, body) {
  const { store, user } = ctx;
  if (!user) fail("Sign in to climb Mastery Peak - your progress is saved to your account.", "forbidden");
  if (peakLimiter.limited(`peak:${user.id}`, 60_000, PEAK.perMinute)) fail("Slow down a little.", "rate");
  const { set, setId, pool } = await peakSet(store, body.setId);
  const header = { setId, title: set.title ?? "Mastery Peak", truncated: pool.truncated };

  if (body.type === "report") {
    if (!isTeacher(user) || (setId !== "builtin" && set.ownerId !== user.id)) fail("Only the teacher who owns this set can see its report.", "forbidden");
    return { ...header, ...classReport(pool, (await store.listMastery(setId)).map((s) => reconcile(pool, s))) };
  }

  return withLock(`${user.id}|${setId}`, async () => {
    const state = reconcile(pool, await store.getMastery(user.id, setId));
    const view = (extra = {}) => ({ ...header, summit: state.summit, step: state.step, concepts: mapView(pool, state), ...extra });
    switch (body.type) {
      case "start": return view();
      case "next": {
        const q = nextQuestion(pool, state);
        await store.saveMastery(user.id, setId, state);
        return view({ question: q.done ? null : q });
      }
      case "answer": {
        const r = submitAnswer(pool, state, body.choice);
        if (r.error) { await store.saveMastery(user.id, setId, state); fail(r.error); }
        let reward = null;
        if (state.summit && !state.rewarded) {
          state.rewarded = true;
          const a = await store.award({ userId: user.id, coins: PEAK.reward, key: `peak:${setId}`, reason: "mastery peak summit" });
          reward = a.awarded ? PEAK.reward : 0;
        }
        await store.saveMastery(user.id, setId, state);
        return view({ result: r, reward });
      }
      case "reset": {
        const fresh = newState(pool); fresh.rewarded = state.rewarded;
        await store.saveMastery(user.id, setId, fresh);
        state.concepts = fresh.concepts; state.summit = false; state.step = 0;
        return view();
      }
      default: fail("Unknown request.");
    }
  });
}


// ---------- Daily Puzzle ----------
// Per-account progress/streak is stored as a small JSON blob under the pseudo set id "daily" (same table as Mastery Peak).
const dailyLimiter = new RateLimiter();
export async function handleDaily(ctx, body) {
  const { store, user } = ctx;
  if (dailyLimiter.limited(`daily:${user?.id ?? ctx.ip ?? "anon"}`, 60_000, 60)) fail("Slow down a little.", "rate");
  const date = dayKey();
  const puzzles = dailyPuzzles(date);
  const pub = puzzles.map(publicPuzzle);
  const publicState = (st) => st && { results: st.results, tries: st.tries, done: st.done, streak: st.streak, best: st.best };
  const load = async () => stateFor(await store.getMastery(user.id, "daily"), date);
  switch (body.type) {
    case "get": {
      if (!user) return { date, puzzles: pub, signedIn: false, tries: TRIES };
      const st = await load();
      // resolved puzzles show their answer so a refresh doesn't lose the explanation
      const reveals = st.results.map((r, i) => (r && !r.ok ? (puzzles[i].reveal ?? revealText(puzzles[i])) : null));
      return { date, puzzles: pub, signedIn: true, tries: TRIES, state: publicState(st), reveals, reward: st.rewarded ? coinsFor(st) : null };
    }
    case "check": {
      const n = Number(body.n);
      if (!Number.isInteger(n) || n < 0 || n >= PUZZLE_COUNT) fail("Unknown puzzle.");
      const answer = String(body.answer ?? "").slice(0, 40);
      if (!user) {
        // guests: stateless check (nothing is awarded, progress lives in their browser)
        const correct = checkAnswer(puzzles[n], answer);
        const giveUp = !correct && Number(body.tries) >= TRIES;
        return { correct, resolved: correct || giveUp, reveal: giveUp ? (puzzles[n].reveal ?? revealText(puzzles[n])) : null };
      }
      const st = await load();
      const r = applyGuess(puzzles, st, n, answer, date);
      if (r.error) fail(r.error);
      let reward = null;
      if (r.finished && !st.rewarded) {
        st.rewarded = true;
        const coins = coinsFor(st);
        const a = await store.awardCapped({ userId: user.id, coins, key: `puzzle:${date}`, reason: "puzzle daily", dailyCap: 20, group: "puzzle" });
        reward = a.awarded ? a.coins : 0;
      }
      await store.saveMastery(user.id, "daily", st);
      return { ...r, state: publicState(st), reward };
    }
    default: fail("Unknown request.");
  }
}


// ---------- Abyss ----------
// Per-account state lives in small JSON blobs (same table as Mastery Peak): abyss:profile, abyss:daily:<date>,
// abyss:archive:<date>, abyss:unlimited. Pearls (currency) + fish (collection) live under the namespaced id `abyss:<user>`
// so they are completely separate from Party coins and characters.
const abyssLimiter = new RateLimiter();
const abyssLocks = new Map();
async function abyssLock(key, fn) {
  const prev = abyssLocks.get(key) ?? Promise.resolve();
  let release; const gate = new Promise((r) => { release = r; });
  const mine = prev.then(() => gate);
  abyssLocks.set(key, mine);
  await prev;
  try { return await fn(); } finally { release(); if (abyssLocks.get(key) === mine) abyssLocks.delete(key); }
}
export const ARCHIVE_DAYS = 14;
const PEARL_CAP = 200;
const pubProfile = (p, date) => ({ themeRuns: p.themeRuns ?? 0, themeBest: p.themeBest ?? {}, streak: AB.liveStreak(p, date), best: p.best, dives: p.dives, bestScore: p.bestScore, bestDepth: p.bestDepth, bestUnlimited: p.bestUnlimited, unlimitedRuns: p.unlimitedRuns, fish: p.fish, totalPoints: p.totalPoints });
const shiftDay = (date, n) => new Date(Date.parse(date) + n * 86400000).toISOString().slice(0, 10);

export async function handleAbyss(ctx, body) {
  const { store, user } = ctx;
  const now = ctx.now ?? Date.now();
  const date = dayKey(now);
  if (abyssLimiter.limited(`abyss:${user?.id ?? ctx.ip ?? "anon"}`, 60_000, 90)) fail("Slow down a little.", "rate");
  const wid = user ? `abyss:${user.id}` : null;
  const loadProfile = async () => ({ ...AB.newProfile(), ...((user && await store.getMastery(user.id, "abyss:profile")) || {}) });
  const runKey = (mode, d, theme) => (mode === "unlimited" ? "abyss:unlimited" : mode === "theme" ? `abyss:theme:${theme}` : `abyss:${mode}:${d}`);

  switch (body.type) {
    case "home": {
      const base = { date, signedIn: !!user, count: AB.PROMPTS.length, daily: AB.DAILY_COUNT, timeLimit: AB.TIME_LIMIT_MS / 1000, tiers: AB.TIER_ORDER.map((t) => AB.TIERS[t]), themes: AB.THEME_META.map((t) => ({ ...t, count: AB.THEME_PROMPTS.filter((p) => p.theme === t.id).length })) };
      if (!user) return base;
      const profile = await loadProfile();
      const today = await store.getMastery(user.id, runKey("daily", date));
      const archive = [];
      for (let i = 1; i <= ARCHIVE_DAYS; i++) {
        const d = shiftDay(date, -i);
        const r = await store.getMastery(user.id, runKey("daily", d)) ?? await store.getMastery(user.id, runKey("archive", d));   // a dive played on the day counts too
        archive.push({ date: d, done: !!r?.done, points: r?.done ? r.points : null, started: !!r && !r.done });
      }
      const wallet = await store.getWallet(wid);
      return { ...base, profile: pubProfile(profile, date), today: today ? AB.publicRun(today) : null, archive, pearls: wallet.coins };
    }

    case "start": {
      const mode = ["daily", "archive", "unlimited", "theme"].includes(body.mode) ? body.mode : fail("Unknown mode.");
      const theme = mode === "theme" ? (AB.THEME_BY_ID[body.theme] ? body.theme : fail("Unknown theme.")) : null;
      let d = date;
      if (mode === "archive") {
        d = String(body.date ?? "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d >= date || d < shiftDay(date, -ARCHIVE_DAYS)) fail("That dive isn't in the archive.");
      }
      const key = runKey(mode, d, theme);
      const fresh = mode === "unlimited" || mode === "theme";
      return abyssLock(`${user?.id ?? "g"}|${key}`, async () => {
        if (user && mode === "archive") {
          const played = await store.getMastery(user.id, runKey("daily", d));   // already dived on the day: just show that result
          if (played?.done) return { run: AB.publicRun(played), question: null, share: AB.shareText(played, d) };
        }
        let run = null;
        if (user) { run = await store.getMastery(user.id, key); if (fresh && (!run || run.done || body.fresh)) run = null; }
        else if (body.run) run = AB.sanitizeRun(body.run);
        if (run && (run.mode !== mode || (mode === "theme" && run.theme !== theme))) run = null;
        if (run && fresh && run.done && !user) run = null;
        if (run?.done && !fresh) return { run: AB.publicRun(run), question: null, share: AB.shareText(run, d), guestRun: user ? undefined : run };
        if (!run) run = AB.newRun(mode, { date: fresh ? null : d, id: fresh ? crypto.randomUUID().slice(0, 12) : null, theme });
        const q = AB.question(run, now);
        if (user) await store.saveMastery(user.id, key, run);
        const fish = user ? (await loadProfile()).fish : null;
        return { run: AB.publicRun(run), question: q, fish, guestRun: user ? undefined : run };
      });
    }

    case "answer": {
      const mode = ["daily", "archive", "unlimited", "theme"].includes(body.mode) ? body.mode : fail("Unknown mode.");
      const theme = mode === "theme" ? (AB.THEME_BY_ID[body.theme] ? body.theme : fail("Unknown theme.")) : null;
      const d = mode === "archive" ? String(body.date ?? "") : date;
      const key = runKey(mode, d, theme);
      return abyssLock(`${user?.id ?? "g"}|${key}`, async () => {
        const run = user ? await store.getMastery(user.id, key) : AB.sanitizeRun(body.run);
        if (!run || run.mode !== mode || (mode === "theme" && run.theme !== theme)) fail("Start the dive first.");
        const r = AB.submit(run, String(body.answer ?? "").slice(0, 80), now, Math.random, { expired: body.expired === true });
        if (r.error) fail(r.error);
        if (r.retry) {   // not on the list: keep the question open, remember the guess
          if (user) await store.saveMastery(user.id, key, run);
          return { retry: true, guess: r.guess, guesses: r.guesses, guessesLeft: r.guessesLeft, question: AB.question(run, now), run: AB.publicRun(run), guestRun: user ? undefined : run };
        }
        let finish = null;
        if (r.done) finish = await abyssFinish({ store, user, wid, run, mode, date: d, loadProfile });
        else AB.question(run, now);
        if (user) await store.saveMastery(user.id, key, run);
        const q = r.done ? null : AB.question(run, now);
        return { result: r.result, done: r.done, run: AB.publicRun(run), question: q, finish, share: r.done ? AB.shareText(run, d) : null, guestRun: user ? undefined : run };
      });
    }

    case "cashout": {
      if (body.mode !== "unlimited") fail("Only Unlimited dives can be cashed out.");
      return abyssLock(`${user?.id ?? "g"}|abyss:unlimited`, async () => {
        const run = user ? await store.getMastery(user.id, "abyss:unlimited") : AB.sanitizeRun(body.run);
        if (!run || run.mode !== "unlimited") fail("Start a dive first.");
        if (run.done) return { run: AB.publicRun(run), finish: null, share: AB.shareText(run, null) };
        AB.finish(run, now);
        const finish = await abyssFinish({ store, user, wid, run, mode: "unlimited", date, loadProfile });
        if (user) await store.saveMastery(user.id, "abyss:unlimited", run);
        return { run: AB.publicRun(run), finish, share: AB.shareText(run, null), guestRun: user ? undefined : run };
      });
    }

    case "report": {
      if (!user) fail("Sign in to report an answer.", "forbidden");
      const promptId = String(body.promptId ?? "");
      if (!AB.getPrompt(promptId)) fail("Unknown prompt.");
      const answer = String(body.answer ?? "").trim().slice(0, 60);
      if (answer.length < 2) fail("Type the answer you want reviewed.");
      const list = (await store.getMastery(user.id, "abyss:reports")) ?? [];
      list.push({ promptId, answer, at: now });
      await store.saveMastery(user.id, "abyss:reports", list.slice(-50));
      return { ok: true };
    }

    case "fish": {
      const base = { packs: allAbyssPackOdds(), fish: FISH.map((f) => ({ ...f })) };
      if (!user) return { signedIn: false, ...base, owned: [], pearls: 0 };
      const [wallet, owned, profile] = await Promise.all([store.getWallet(wid), store.getCollection(wid), loadProfile()]);
      return { signedIn: true, ...base, owned, pearls: wallet.coins, selected: profile.fish };
    }

    case "open_pack": {
      if (!user) fail("Sign in to open fish packs.", "forbidden");
      const requestId = String(body.requestId ?? "");
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) fail("Missing request id.");
      const packId = String(body.packId ?? "");
      if (!ABYSS_PACK_IDS.includes(packId)) fail("Unknown pack.");
      return store.openPack(wid, requestId, packId);
    }

    case "select_fish": {
      if (!user) fail("Sign in to pick a fish.", "forbidden");
      const id = String(body.id ?? "");
      const owned = await store.getCollection(wid);
      if (id && (!FISH_BY_ID.has(id) || !owned.some((o) => o.id === id))) fail("You don't own that fish yet.");
      const profile = await loadProfile();
      profile.fish = id || null;
      await store.saveMastery(user.id, "abyss:profile", profile);
      return { selected: profile.fish };
    }

    default: fail("Unknown request.");
  }
}

async function abyssFinish({ store, user, wid, run, mode, date, loadProfile }) {
  if (!user) return { pearls: 0, guest: true };
  const profile = await loadProfile();
  let pearls = 0, newFish = [];
  if (mode === "daily") {
    const rec = AB.recordDaily(profile, run, date);
    const a = await store.awardCapped({ userId: wid, coins: AB.pearlsForDaily(run.points), key: `dive:${date}`, reason: "pearl daily dive", dailyCap: PEARL_CAP, group: "pearl" });
    pearls = a.awarded ? a.coins : 0;
    for (const id of rec.newFish) { const g = await store.grantCharacter(wid, id, `streak:${id}`); if (g.granted) newFish.push(id); }
  } else if (mode === "theme") {
    AB.recordTheme(profile, run);
    const a = await store.awardCapped({ userId: wid, coins: AB.pearlsForTheme(run.points), key: `theme:${run.id}`, reason: "pearl themed dive", dailyCap: PEARL_CAP, group: "pearl" });
    pearls = a.awarded ? a.coins : 0;
  } else if (mode === "unlimited") {
    AB.recordUnlimited(profile, run);
    const a = await store.awardCapped({ userId: wid, coins: AB.pearlsForUnlimited(run.points), key: `unl:${run.id}`, reason: "pearl unlimited dive", dailyCap: PEARL_CAP, group: "pearl" });
    pearls = a.awarded ? a.coins : 0;
  }
  await store.saveMastery(user.id, "abyss:profile", profile);
  return { pearls, newFish, profile: pubProfile(profile, date) };
}
