import { GAME_CATALOG, GAME_IDS, MAX_PLAYERS, AVATARS, TEAMS } from "./catalog.mjs";
import { cleanNickname } from "./moderation.mjs";
import { GAMES } from "./games/index.mjs";
import { GameError, fail, roomCode, secretToken, shuffle, uid, clamp } from "./util.mjs";
import { DEFAULT_SET, contentFor } from "./content.mjs";
import { CHAT_COOLDOWN_MS, PHRASE_BY_ID } from "./chat.mjs";

export { AVATARS, TEAMS };

const INTRO_MS = 5000;
const RESULTS_MS = 9000;
const CONNECT_MS = 9000;

/**
 * A single classroom session. Everything is server-authoritative: games only ever see time
 * through room.t() (which freezes while paused) and only change state via validated actions.
 */
export class Room {
  constructor({ playlist = ["hot_potato"], settings = {}, hostUserId = null, hostName = "Teacher", content = null,
    clock = Date.now, testMode = false, devUserId = null, onAward = null, solo = null } = {}) {
    this.id = uid();
    this.code = roomCode();
    this.clock = clock;
    this.createdAt = clock();
    this.hostUserId = hostUserId;
    this.hostName = hostName;
    this.testMode = testMode;
    this.solo = solo; // { game, difficulty } for practice runs against bots
    this.devUserId = devUserId;
    this.onAward = onAward;
    this.content = content ?? DEFAULT_SET;
    this.settings = {
      timeScale: clamp(Number(settings.timeScale) || 1, 0.02, 1),
      teams: clamp(Number(settings.teams) || 0, 0, 6),
      lateJoin: settings.lateJoin !== "closed",
      chat: settings.chat !== false && settings.chat !== "off",
    };
    this.chatLog = []; this.chatSeq = 0;
    this.playlist = this.cleanPlaylist(playlist);
    this.phase = "lobby"; // lobby | intro | playing | results | final | ended
    this.players = new Map();
    this.gameIndex = -1;
    this.game = null;
    this.phaseEndsAt = 0;
    this.pausedAt = 0;
    this.pausedTotal = 0;
    this.totals = new Map(); // cumulative normalised points
    this.history = []; // finished game result summaries
    this.logs = [];
    this.version = 0;
    this.lastActivity = clock();
    this.sessionAwards = new Map();
    this.metrics = { actions: 0, rejected: 0, ticks: 0, tickMsMax: 0, tickMsAvg: 0, polls: 0 };
    this.bots = null; // set by bots.mjs when test lab spawns bots
  }

  // ---------- time ----------
  t() { return (this.pausedAt || this.clock()) - this.pausedTotal; }
  dur(ms) { return Math.max(40, Math.round(ms * this.settings.timeScale)); }
  get paused() { return !!this.pausedAt; }
  log(type, data = {}) {
    this.logs.push({ at: Math.round(this.t()), type, ...data });
    if (this.logs.length > 600) this.logs.splice(0, this.logs.length - 600);
  }

  cleanPlaylist(list) {
    const arr = (Array.isArray(list) ? list : [list]).filter((g) => GAME_IDS.includes(g));
    if (!arr.length) fail("Pick at least one game.");
    return arr.slice(0, 12);
  }

  // ---------- players ----------
  isConnected(pid) {
    const p = this.players.get(pid);
    if (!p) return false;
    if (p.bot) return !p.bot.offline;
    return !p.forceOffline && this.clock() - p.lastSeen < CONNECT_MS;
  }
  touch(pid) { const p = this.players.get(pid); if (p) p.lastSeen = this.clock(); }
  playerList() { return [...this.players.values()]; }
  activePlayers() { return this.playerList().filter((p) => !p.waiting); }

  addPlayer({ nickname, avatar, userId = null, bot = null, ownedAvatars = null } = {}) {
    if (this.phase === "ended") fail("This session has ended.");
    if (this.players.size >= MAX_PLAYERS) fail("The room is full (40 players).");
    if (this.phase !== "lobby" && !this.settings.lateJoin) fail("This session is not accepting late joiners.");
    const nick = bot ? String(nickname).slice(0, 16) : cleanNickname(nickname);
    const lower = nick.toLowerCase();
    let final = nick, n = 2;
    while ([...this.players.values()].some((p) => p.nickname.toLowerCase() === final.toLowerCase())) final = `${nick.slice(0, 13)} ${n++}`;
    void lower;
    let av = AVATARS.includes(avatar) ? avatar : "rk-sun";
    if (!bot && av.startsWith("c-") && !(ownedAvatars ?? []).includes(av)) av = "rk-sun";
    const p = {
      id: uid(), nickname: final, avatar: av, userId, token: secretToken(), bot, lastSeen: this.clock(), joinedAt: this.t(),
      waiting: this.phase !== "lobby", team: null, forceOffline: false,
    };
    this.players.set(p.id, p);
    this.totals.set(p.id, 0);
    this.log("join", { player: p.nickname, late: p.waiting });
    this.bump();
    return p;
  }

  authPlayer(playerId, token) {
    const p = this.players.get(playerId);
    if (!p || !token || p.token !== token) fail("Player session not found. Rejoin with the room code.", "auth");
    return p;
  }

  removePlayer(pid, reason = "removed") {
    const p = this.players.get(pid);
    if (!p) return;
    this.players.delete(pid);
    this.totals.delete(pid);
    this.log("remove", { player: p.nickname, reason });
    this.bump();
  }

  bump() { this.version++; }

  /** Quick chat: only curated phrases (see chat.mjs). Never free text. */
  chat(pid, phraseId) {
    const p = this.players.get(pid);
    if (!p) fail("You are not in this room.", "auth");
    if (!this.settings.chat) fail("The teacher turned quick chat off.");
    if (this.phase === "ended") fail("This session has ended.");
    const phrase = PHRASE_BY_ID.get(String(phraseId));
    const game = this.phase === "playing" ? this.playlist[this.gameIndex] : null;
    if (!phrase || (phrase.game !== "all" && phrase.game !== game)) fail("Pick one of the quick chat phrases.");
    const now = this.clock();
    if (now - (p.lastChat ?? -1e9) < CHAT_COOLDOWN_MS) fail("Hold on a second before sending another!", "rate");
    p.lastChat = now;
    this.touch(pid);
    this.chatLog.push({ id: ++this.chatSeq, pid, text: phrase.text, at: now });
    if (this.chatLog.length > 40) this.chatLog.shift();
    this.bump();
    return { ok: true };
  }

  // ---------- lifecycle ----------
  setPlaylist(list) { if (this.phase !== "lobby") fail("Change the playlist from the lobby."); this.playlist = this.cleanPlaylist(list); this.bump(); }
  setContent(set) { if (this.phase !== "lobby") fail("Change content from the lobby."); this.content = set ?? DEFAULT_SET; this.bump(); }

  start() {
    if (this.phase !== "lobby") fail("The session already started.");
    const count = this.activePlayers().length;
    for (const g of this.playlist) {
      if (count < GAME_CATALOG[g].min) fail(`${GAME_CATALOG[g].name} needs at least ${GAME_CATALOG[g].min} players (you have ${count}).`);
    }
    this.assignTeams();
    this.gameIndex = -1;
    this.history = [];
    for (const p of this.players.values()) this.totals.set(p.id, 0);
    this.log("session_start", { playlist: this.playlist, players: count });
    this.nextGame();
  }

  assignTeams() {
    const n = this.settings.teams;
    for (const p of this.players.values()) p.team = null;
    if (!n) return;
    shuffle(this.activePlayers()).forEach((p, i) => { p.team = i % n; });
  }

  nextGame() {
    this.gameIndex++;
    if (this.gameIndex >= this.playlist.length) return this.finishSession();
    const gameId = this.playlist[this.gameIndex];
    // everyone who is here now plays the next game, including late joiners
    for (const p of this.players.values()) { p.waiting = false; }
    const needed = GAME_CATALOG[gameId].min;
    if (this.activePlayers().length < needed) { this.log("skip_game", { gameId, reason: "not enough players" }); return this.nextGame(); }
    this.game = null;
    this.phase = "intro";
    this.phaseEndsAt = this.t() + this.dur(INTRO_MS);
    this.introGame = gameId;
    this.log("intro", { gameId });
    this.bump();
  }

  launchGame() {
    const gameId = this.introGame;
    const players = this.activePlayers().map((p) => p.id);
    const Game = GAMES[gameId];
    this.game = new Game(this, players, contentFor(gameId, this.content));
    this.phase = "playing";
    this.phaseEndsAt = 0;
    this.log("game_start", { gameId, players: players.length });
    this.game.start?.();
    this.bump();
  }

  finishGame(reason = "complete") {
    const game = this.game;
    if (!game) return;
    const gameId = this.playlist[this.gameIndex];
    const pts = new Map(game.players.filter((id) => this.players.has(id)).map((id) => [id, game.points.get(id) ?? 0]));
    const ref = GAME_CATALOG[gameId].ref;
    const max = Math.max(ref, ...pts.values());
    const rows = [...pts.entries()].map(([id, points]) => {
      const norm = Math.min(1000, Math.round((1000 * points) / max));
      this.totals.set(id, (this.totals.get(id) ?? 0) + norm);
      return { id, points, norm };
    }).sort((a, b) => b.points - a.points || b.norm - a.norm);
    const result = {
      gameId, name: GAME_CATALOG[gameId].name, reason,
      rows: rows.map((r) => ({ ...r, nickname: this.players.get(r.id)?.nickname ?? "(left)", avatar: this.players.get(r.id)?.avatar })),
      highlights: game.highlights?.() ?? [],
      awards: (game.awards?.() ?? []).filter((a) => this.players.has(a.pid)).map((a) => ({ ...a, nickname: this.players.get(a.pid).nickname, avatar: this.players.get(a.pid).avatar })),
    };
    this.history.push(result);
    this.awardCoins(rows, gameId);
    this.log("game_end", { gameId, reason, top: result.rows.slice(0, 3).map((r) => r.nickname) });
    this.phase = "results";
    this.phaseEndsAt = this.t() + this.dur(RESULTS_MS);
    this.bump();
  }

  awardSolo(rows, gameId) {
    const human = this.playerList().find((p) => !p.bot);
    if (!human) return;
    const place = rows.findIndex((r) => r.id === human.id) + 1;
    const base = [30, 22, 16, 11, 8][place - 1] ?? 5;
    const mult = { easy: 0.6, medium: 1, hard: 1.4 }[this.solo.difficulty] ?? 1;
    human.soloPlace = place; human.soloTotal = rows.length;
    if (!human.userId || !this.onAward) { human.coinsEarned = null; return; }
    const coins = Math.max(1, Math.round(base * mult));
    Promise.resolve(this.onAward({ userId: human.userId, coins, key: `${this.id}:solo`, reason: `solo ${gameId} place ${place}`, dailyCap: 150 }))
      .then((r) => { human.coinsEarned = r?.coins ?? 0; human.coinsCapped = !!r?.capped; this.bump(); })
      .catch(() => { human.coinsEarned = 0; });
  }

  awardCoins(rows, gameId) {
    if (this.solo) return this.awardSolo(rows, gameId);
    if (!this.onAward || rows.length < 3) return;
    rows.forEach((row, i) => {
      const p = this.players.get(row.id);
      if (!p?.userId) return;
      let coins = 10 + (i === 0 ? 20 : i < 3 ? 12 : i < Math.ceil(rows.length / 4) ? 6 : 0);
      const used = this.sessionAwards.get(p.userId) ?? 0;
      coins = Math.min(coins, Math.max(0, 150 - used));
      if (coins <= 0) return;
      this.sessionAwards.set(p.userId, used + coins);
      this.onAward({ userId: p.userId, coins, key: `${this.id}:${this.gameIndex}`, reason: `${gameId} placement ${i + 1}` });
    });
  }

  finishSession() {
    this.game = null;
    this.phase = "final";
    this.phaseEndsAt = 0;
    this.log("session_final");
    this.bump();
  }

  // ---------- host controls ----------
  host(cmd, args = {}) {
    switch (cmd) {
      case "start": this.start(); break;
      case "pause": if (this.phase === "ended") fail("Session ended."); if (!this.pausedAt) { this.pausedAt = this.clock(); this.log("pause"); } break;
      case "resume": if (this.pausedAt) { this.pausedTotal += this.clock() - this.pausedAt; this.pausedAt = 0; this.log("resume"); } break;
      case "skip": this.skip(); break;
      case "remove": this.removePlayer(String(args.playerId), "teacher"); break;
      case "end": this.phase = "ended"; this.game = null; this.log("ended_by_teacher"); break;
      case "playlist": this.setPlaylist(args.playlist); break;
      case "settings": if (this.phase !== "lobby") fail("Settings lock once the session starts."); this.settings.teams = clamp(Number(args.teams) || 0, 0, 6); this.settings.lateJoin = args.lateJoin !== "closed"; if (args.chat !== undefined) this.settings.chat = args.chat !== false && args.chat !== "off"; break;
      case "chat": this.settings.chat = !!args.on; if (!args.on) this.chatLog = []; break;
      case "restart": if (this.phase !== "final" && this.phase !== "results") fail("Nothing to restart yet."); this.resetToLobby(); break;
      default: fail("Unknown teacher command.");
    }
    this.bump();
  }

  resetToLobby() {
    this.phase = "lobby"; this.game = null; this.gameIndex = -1; this.history = [];
    for (const p of this.players.values()) { p.waiting = false; p.team = null; this.totals.set(p.id, 0); }
  }

  skip() {
    if (this.phase === "intro") this.phaseEndsAt = this.t();
    else if (this.phase === "results") this.phaseEndsAt = this.t();
    else if (this.phase === "playing") { this.log("skip"); this.game.skip(); }
    else fail("Nothing to skip right now.");
  }

  // ---------- tick ----------
  tick() {
    if (this.pausedAt) return;
    const started = performance.now();
    const now = this.t();
    if (this.phase === "intro" && now >= this.phaseEndsAt) this.launchGame();
    else if (this.phase === "playing") {
      this.game.tick(now);
      if (this.game.done) this.finishGame();
    } else if (this.phase === "results" && now >= this.phaseEndsAt) this.nextGame();
    if (this.bots) this.bots.tick(now);
    const ms = performance.now() - started;
    this.metrics.ticks++;
    this.metrics.tickMsMax = Math.max(this.metrics.tickMsMax, ms);
    this.metrics.tickMsAvg += (ms - this.metrics.tickMsAvg) / Math.min(this.metrics.ticks, 200);
  }

  // ---------- player actions ----------
  act(pid, action) {
    const p = this.players.get(pid);
    if (!p) fail("You are not in this room.", "auth");
    this.touch(pid);
    this.metrics.actions++;
    this.lastActivity = this.clock();
    if (this.pausedAt) fail("The teacher paused the game.");
    if (this.phase !== "playing" || !this.game) fail("No game is running right now.");
    if (p.waiting || !this.game.players.includes(pid)) fail("You'll join the next game.");
    try {
      const out = this.game.act(pid, action, this.t());
      this.bump();
      return out ?? { ok: true };
    } catch (e) {
      this.metrics.rejected++;
      throw e;
    }
  }

  // ---------- views ----------
  leaderboard(limit = 12) {
    const rows = this.playerList().map((p) => ({
      id: p.id, nickname: p.nickname, avatar: p.avatar, team: p.team,
      total: this.totals.get(p.id) ?? 0, points: this.game?.points.get(p.id) ?? 0, connected: this.isConnected(p.id),
    }));
    rows.sort((a, b) => b.total + b.points / 10 - (a.total + a.points / 10) || a.nickname.localeCompare(b.nickname));
    return limit ? rows.slice(0, limit) : rows;
  }

  teamBoard() {
    if (!this.settings.teams) return null;
    return TEAMS.slice(0, this.settings.teams).map((t) => {
      const members = this.playerList().filter((p) => p.team === t.id);
      const total = members.reduce((a, p) => a + (this.totals.get(p.id) ?? 0), 0);
      return { ...t, members: members.length, total: members.length ? Math.round(total / members.length) : 0 };
    }).sort((a, b) => b.total - a.total);
  }

  /** Public view (projector/teacher) or private view for a specific player. */
  view({ playerId = null, mode = "player", opts = {} } = {}) {
    const now = this.t();
    const timer = this.phase === "intro" || this.phase === "results" ? { ms: Math.max(0, this.phaseEndsAt - now) } : null;
    const base = {
      code: this.code, v: this.version, phase: this.phase, paused: this.paused, serverTime: this.clock(),
      host: { name: this.hostName }, playlist: this.playlist, gameIndex: this.gameIndex,
      settings: this.settings, content: { title: this.content.title },
      players: this.playerList().map((p) => ({
        id: p.id, nickname: p.nickname, avatar: p.avatar, connected: this.isConnected(p.id), waiting: p.waiting, team: p.team,
        total: this.totals.get(p.id) ?? 0, points: this.game?.points.get(p.id) ?? 0, bot: p.bot ? true : undefined,
      })),
      timer,
      chat: this.settings.chat ? this.chatLog.slice(-6).map((m) => ({ id: m.id, pid: m.pid, text: m.text, nickname: this.players.get(m.pid)?.nickname ?? "", avatar: this.players.get(m.pid)?.avatar })) : [],
      solo: this.solo ? { game: this.solo.game, difficulty: this.solo.difficulty } : undefined,
      teams: this.teamBoard(),
    };
    if (this.phase === "intro") base.next = { gameId: this.introGame, ...GAME_CATALOG[this.introGame], index: this.gameIndex, of: this.playlist.length };
    if (this.phase === "results" || this.phase === "final") {
      base.results = this.history[this.history.length - 1] ?? null;
      base.leaderboard = this.leaderboard(0);
      if (this.phase === "final") base.history = this.history.map((h) => ({ gameId: h.gameId, name: h.name, top: h.rows.slice(0, 3) }));
    }
    if (this.phase === "playing" && this.game) {
      base.gameId = this.playlist[this.gameIndex];
      base.game = this.game.view(mode === "player" ? playerId : null, opts, mode);
      base.leaderboard = this.leaderboard(10);
    }
    if (playerId && this.players.has(playerId)) {
      const p = this.players.get(playerId);
      base.me = { solo: this.solo ? { place: p.soloPlace ?? null, of: p.soloTotal ?? null, coins: p.coinsEarned ?? null, capped: !!p.coinsCapped, signedIn: !!p.userId } : undefined, id: p.id, nickname: p.nickname, avatar: p.avatar, team: p.team, waiting: p.waiting, total: this.totals.get(p.id) ?? 0, points: this.game?.points.get(p.id) ?? 0, signedIn: !!p.userId };
    }
    return base;
  }
}
export { GameError };
