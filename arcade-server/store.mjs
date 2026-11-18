import crypto from "node:crypto";
import { PACKS, rollPack } from "./characters.mjs";
import { GameError } from "./util.mjs";

/** In-memory store with the same interface as lib/arcadeDb.ts (used by tests and when no DATABASE_URL is set). */
export class MemoryStore {
  constructor() { this.accounts = new Map(); this.sessions = new Map(); this.awardLog = []; this.wallets = new Map(); this.awards = new Set(); this.collections = new Map(); this.packs = new Map(); this.sets = new Map(); }

  // ----- username/password accounts -----
  async createAccount({ username, passwordHash }) {
    const key = username.toLowerCase();
    if ([...this.accounts.values()].some((a) => a.key === key)) throw new GameError("That username is taken.");
    const id = crypto.randomUUID();
    this.accounts.set(id, { id, username, key, passwordHash });
    return { id, username };
  }
  async getAccountByUsername(username) { const key = String(username).toLowerCase(); return [...this.accounts.values()].find((a) => a.key === key) ?? null; }
  async createSession({ tokenHash, accountId, expiresAt }) { this.sessions.set(tokenHash, { accountId, expiresAt }); }
  async getSessionAccount(tokenHash) {
    const s = this.sessions.get(tokenHash);
    if (!s || s.expiresAt < new Date()) return null;
    return this.accounts.get(s.accountId) ?? null;
  }
  async deleteSession(tokenHash) { this.sessions.delete(tokenHash); }
  async deleteAccount(accountId) {
    this.accounts.delete(accountId);
    for (const [k, s] of this.sessions) if (s.accountId === accountId) this.sessions.delete(k);
    await this.deleteUserData(`acct:${accountId}`);
  }

  /** Award with a per-day cap for a reason group (used by solo practice so it can't be farmed). */
  async awardCapped({ userId, coins, key, reason, dailyCap, group = "solo" }) {
    const dedupe = `${userId}:${key}`;
    if (this.awards.has(dedupe)) return { awarded: false, coins: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const used = this.awardLog.filter((a) => a.userId === userId && a.group === group && a.day === today).reduce((n, a) => n + a.coins, 0);
    const allowed = Math.max(0, Math.min(coins, dailyCap - used));
    if (allowed <= 0) return { awarded: false, coins: 0, capped: true };
    this.awards.add(dedupe);
    this.awardLog.push({ userId, group, day: today, coins: allowed });
    const w = this.wallets.get(userId) ?? { coins: 0, lifetime: 0 };
    this.wallets.set(userId, { coins: w.coins + allowed, lifetime: w.lifetime + allowed });
    void reason;
    return { awarded: true, coins: allowed, capped: allowed < coins };
  }

  async getWallet(userId) { return { ...(this.wallets.get(userId) ?? { coins: 0, lifetime: 0 }) }; }

  async award({ userId, coins, key, reason }) {
    const dedupe = `${userId}:${key}`;
    if (this.awards.has(dedupe)) return { awarded: false };
    this.awards.add(dedupe);
    const w = this.wallets.get(userId) ?? { coins: 0, lifetime: 0 };
    this.wallets.set(userId, { coins: w.coins + coins, lifetime: w.lifetime + coins });
    void reason;
    return { awarded: true, coins };
  }

  async getCollection(userId) {
    return [...(this.collections.get(userId) ?? new Map()).entries()].map(([id, count]) => ({ id, count }));
  }

  /** Atomic + idempotent: the same requestId always returns the same result and never charges twice. */
  async openPack(userId, requestId, packId = "basic", rng, deal = {}) {
    const pack = PACKS[packId];
    if (!pack) throw new GameError("Unknown pack.");
    const rid = `${userId}:${requestId}`;
    if (this.packs.has(rid)) return { ...this.packs.get(rid), repeated: true };
    const w = this.wallets.get(userId) ?? { coins: 0, lifetime: 0 };
    const price = deal.price ?? pack.cost;
    if (w.coins < price) throw new GameError(`You need ${price} coins (you have ${w.coins}).`);
    const character = rollPack(packId, rng, deal.spotlight ?? null);
    this.wallets.set(userId, { ...w, coins: w.coins - price });
    const col = this.collections.get(userId) ?? new Map();
    const before = col.get(character.id) ?? 0;
    col.set(character.id, before + 1);
    this.collections.set(userId, col);
    const result = { character, duplicate: before > 0, coins: w.coins - price };
    this.packs.set(rid, result);
    return result;
  }

  async listSets(ownerId) { return [...this.sets.values()].filter((s) => s.ownerId === ownerId).map(({ ...s }) => s); }
  async getSet(id) { return this.sets.get(id) ?? null; }
  async saveSet(set) {
    const id = set.id ?? crypto.randomUUID();
    const prev = this.sets.get(id);
    if (prev && prev.ownerId !== set.ownerId) throw new GameError("Not your content set.", "forbidden");
    const saved = { ...set, id, updatedAt: Date.now() };
    this.sets.set(id, saved);
    return saved;
  }
  async deleteSet(id, ownerId) { const s = this.sets.get(id); if (s && s.ownerId === ownerId) this.sets.delete(id); }
  async deleteUserData(userId) {
    this.wallets.delete(userId); this.collections.delete(userId);
    for (const [id, s] of this.sets) if (s.ownerId === userId) this.sets.delete(id);
    for (const k of [...this.packs.keys()]) if (k.startsWith(userId + ":")) this.packs.delete(k);
  }
}
