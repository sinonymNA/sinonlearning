import crypto from "node:crypto";

const WORDS = new Set(["action","station","motion","nation","fiction","caption","option","connection","creation","education","rotation","question","attention","direction","condition","solution","tradition","vacation"]);
const SEQUENCES = ["TION","ATION","CTION","MENT","ING","ABLE","OUS"];

function code() { return crypto.randomBytes(3).toString("hex").toUpperCase(); }
function id() { return crypto.randomUUID(); }

export class ArcadeRoom {
  constructor({ game = "hot_potato", playlist = [game], testMode = false } = {}) {
    this.code = code();
    this.hostToken = crypto.randomBytes(24).toString("hex");
    this.game = game;
    this.playlist = playlist;
    this.playlistIndex = 0;
    this.testMode = testMode;
    this.phase = "lobby";
    this.players = new Map();
    this.round = 0;
    this.score = new Map();
    this.startedAt = 0;
    this.deadline = 0;
    this.potato = null;
    this.sequence = null;
    this.usedWords = new Set();
    this.lastAction = new Map();
  }
  host(token) { return token === this.hostToken; }
  addPlayer({ nickname, avatar = "sun", reconnectToken } = {}) {
    if (reconnectToken) {
      const existing = [...this.players.values()].find((p) => p.reconnectToken === reconnectToken);
      if (existing) { existing.connected = true; return existing; }
    }
    if (this.players.size >= 40) throw new Error("Room is full");
    const clean = String(nickname || "Player").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 18) || "Player";
    const player = { id: id(), nickname: clean, avatar: String(avatar).slice(0, 20), reconnectToken: crypto.randomBytes(18).toString("hex"), connected: true, hearts: 3, score: 0, eliminated: false };
    this.players.set(player.id, player); this.score.set(player.id, 0); return player;
  }
  reconnect(token) { return this.addPlayer({ reconnectToken: token }); }
  remove(playerId) { this.players.delete(playerId); }
  start() {
    if (this.players.size < 1) throw new Error("At least one player is required");
    this.phase = "playing"; this.round = 1; this.startedAt = Date.now(); this.beginHotPotato();
  }
  beginHotPotato() {
    const eligible = [...this.players.values()].filter((p) => !p.eliminated);
    if (!eligible.length) return this.end();
    this.sequence = SEQUENCES[Math.floor(Math.random() * SEQUENCES.length)];
    const previous = this.potato?.holderId;
    const choices = eligible.filter((p) => p.id !== previous);
    const holder = (choices.length ? choices : eligible)[Math.floor(Math.random() * (choices.length ? choices : eligible).length)];
    this.potato = { holderId: holder.id, expiresAt: Date.now() + 12000 };
    this.deadline = this.potato.expiresAt;
    this.usedWords = new Set();
  }
  submitWord(playerId, rawWord) {
    if (this.phase !== "playing" || this.game !== "hot_potato") throw new Error("This round is not accepting words");
    const player = this.players.get(playerId);
    if (!player || player.eliminated || this.potato?.holderId !== playerId) throw new Error("Only the potato holder can submit");
    if (this.lastAction.get(playerId) === this.round) throw new Error("Action already submitted");
    const word = String(rawWord || "").toLowerCase().replace(/[^a-z]/g, "");
    if (!word || !word.includes(this.sequence.toLowerCase()) || !WORDS.has(word) || this.usedWords.has(word)) throw new Error("Use a new valid word containing " + this.sequence);
    this.usedWords.add(word); this.lastAction.set(playerId, this.round); player.score += 10; this.score.set(playerId, player.score);
    this.beginHotPotato();
  }
  tick() {
    if (this.phase !== "playing") return;
    if (this.game === "hot_potato" && this.potato && Date.now() >= this.potato.expiresAt) {
      const holder = this.players.get(this.potato.holderId);
      if (holder) { holder.hearts -= 1; holder.score = Math.max(0, holder.score - 5); if (holder.hearts <= 0) holder.eliminated = true; }
      this.round += 1;
      if (this.round > 12 || [...this.players.values()].every((p) => p.eliminated)) this.end(); else this.beginHotPotato();
    }
  }
  end() { this.phase = "results"; this.deadline = 0; this.potato = null; }
  publicState() {
    this.tick();
    return { type: "state", code: this.code, game: this.game, phase: this.phase, round: this.round, deadline: this.deadline, sequence: this.sequence, potatoHolderId: this.potato?.holderId ?? null, players: [...this.players.values()].map(({ reconnectToken, ...p }) => p) };
  }
  privateState(playerId) {
    const p = this.players.get(playerId);
    return { type: "private", playerId, reconnectToken: p?.reconnectToken, isPotatoHolder: this.potato?.holderId === playerId, score: p?.score ?? 0, hearts: p?.hearts ?? 0 };
  }
}

export class ArcadeService {
  constructor() { this.rooms = new Map(); }
  create(settings) { const room = new ArcadeRoom(settings); this.rooms.set(room.code, room); return room; }
  get(code) { return this.rooms.get(String(code || "").toUpperCase()); }
}
