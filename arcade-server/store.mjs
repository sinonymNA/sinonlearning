import crypto from "node:crypto";
import { PACKS, rollPack } from "./characters.mjs";
import { GameError } from "./util.mjs";

/** In-memory store with the same interface as lib/arcadeDb.ts (used by tests and when no DATABASE_URL is set). */
export class MemoryStore {
  constructor() { this.wallets = new Map(); this.awards = new Set(); this.collections = new Map(); this.packs = new Map(); this.sets = new Map(); }

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
  async openPack(userId, requestId, packId = "basic", rng) {
    const pack = PACKS[packId];
    if (!pack) throw new GameError("Unknown pack.");
    const rid = `${userId}:${requestId}`;
    if (this.packs.has(rid)) return { ...this.packs.get(rid), repeated: true };
    const w = this.wallets.get(userId) ?? { coins: 0, lifetime: 0 };
    if (w.coins < pack.cost) throw new GameError(`You need ${pack.cost} coins (you have ${w.coins}).`);
    const character = rollPack(packId, rng);
    this.wallets.set(userId, { ...w, coins: w.coins - pack.cost });
    const col = this.collections.get(userId) ?? new Map();
    const before = col.get(character.id) ?? 0;
    col.set(character.id, before + 1);
    this.collections.set(userId, col);
    const result = { character, duplicate: before > 0, coins: w.coins - pack.cost };
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
