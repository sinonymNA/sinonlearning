import { GAME_CATALOG, GAME_IDS } from "./catalog.mjs";
import { DEFAULT_SET, compatibility, importCsv, itemsFromGameShow, sanitizeItems } from "./content.mjs";
import { CHARACTERS, STARTER_AVATARS, packOdds } from "./characters.mjs";
import { GameError, fail } from "./util.mjs";
import { cleanText } from "./moderation.mjs";
import { BEHAVIORS } from "./bots.mjs";

/** The test lab is open to any signed-in teacher account (no env configuration); guests and students are refused. */
export function isDeveloper(user) {
  return user?.role === "teacher";
}
export const isTeacher = (user) => user?.role === "teacher";

const SAFE_OPTS = (o) => {
  const out = {};
  if (o && typeof o === "object") {
    if (o.draw && typeof o.draw === "object") out.draw = { key: Number(o.draw.key) || 0, from: Math.max(0, Number(o.draw.from) || 0) };
    if (o.tel && typeof o.tel === "object") out.tel = { ci: Math.max(0, Number(o.tel.ci) || 0), st: Number.isInteger(o.tel.st) ? o.tel.st : -1, src: typeof o.tel.src === "string" ? o.tel.src.slice(0, 40) : undefined };
    if (Number.isInteger(o.group) && o.group >= 0 && o.group < 100) out.group = o.group;
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
      } else room.host(String(body.cmd), body.args ?? {});
      room.bump();
      return { view: room.view({ mode: "projector" }) };
    }
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
    case "catalog": return { characters: CHARACTERS, starters: STARTER_AVATARS, odds: packOdds("basic") };
    case "me": {
      if (!user) return { signedIn: false, ...{ coins: 0, owned: [] } };
      const wallet = await store.getWallet(user.id);
      const owned = await store.getCollection(user.id);
      return { signedIn: true, name: user.name, role: user.role, coins: wallet.coins, lifetime: wallet.lifetime, owned };
    }
    case "open_pack": {
      if (!user) fail("Sign in to open packs - guest players can't keep coins or characters.", "forbidden");
      const requestId = String(body.requestId ?? "");
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) fail("Missing request id.");
      return store.openPack(user.id, requestId, "basic");
    }
    case "delete_my_data": {
      if (!user) fail("Not signed in.", "forbidden");
      await store.deleteUserData(user.id);
      return { ok: true };
    }
    default: fail("Unknown request.");
  }
}

// ---------- teacher content ----------
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
      const items = sanitizeItems(body.items);
      const total = Object.values(items).reduce((a, v) => a + v.length, 0);
      if (!total) fail("Add at least one item.");
      const saved = await store.saveSet({ id: body.id && body.id !== "builtin" ? String(body.id) : undefined, ownerId: user.id, title, items });
      return { id: saved.id, compatibility: compatibility(saved) };
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
      const items = sanitizeItems(itemsFromGameShow(show.payload));
      return { title: show.title, items, compatibility: compatibility({ items }) };
    }
    case "compat": return { compatibility: compatibility({ items: sanitizeItems(body.items) }) };
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
export { GameError, GAME_CATALOG };
