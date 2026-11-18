// @ts-nocheck - the arcade engine is plain ESM; this adapter mirrors arcade-server/store.mjs
import { query, transaction } from "./db";
import { PACKS, rollPack } from "../arcade-server/characters.mjs";
import { GameError } from "../arcade-server/util.mjs";

let ready: Promise<void> | null = null;

export function ensureArcadeSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS arcade_wallets (
        user_id TEXT PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0), lifetime INTEGER NOT NULL DEFAULT 0)`);
      await query(`CREATE TABLE IF NOT EXISTS arcade_awards (
        user_id TEXT NOT NULL, award_key TEXT NOT NULL, coins INTEGER NOT NULL, reason TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, award_key))`);
      await query(`CREATE TABLE IF NOT EXISTS arcade_collection (
        user_id TEXT NOT NULL, character_id TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1,
        first_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, character_id))`);
      await query(`CREATE TABLE IF NOT EXISTS arcade_pack_opens (
        user_id TEXT NOT NULL, request_id TEXT NOT NULL, character_id TEXT NOT NULL, duplicate BOOLEAN NOT NULL,
        coins_after INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, request_id))`);
      await query(`CREATE TABLE IF NOT EXISTS arcade_content_sets (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL, items JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await query(`CREATE INDEX IF NOT EXISTS arcade_content_owner_idx ON arcade_content_sets (owner_id)`);
    })();
  }
  return ready;
}

export class PgStore {
  async getWallet(userId: string) {
    await ensureArcadeSchema();
    const { rows } = await query(`SELECT coins, lifetime FROM arcade_wallets WHERE user_id = $1`, [userId]);
    return rows[0] ?? { coins: 0, lifetime: 0 };
  }

  async award({ userId, coins, key, reason }) {
    await ensureArcadeSchema();
    return transaction(async (run) => {
      const ins = await run(`INSERT INTO arcade_awards (user_id, award_key, coins, reason) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING 1`, [userId, key, coins, reason ?? ""]);
      if (!ins.rows.length) return { awarded: false };
      await run(`INSERT INTO arcade_wallets (user_id, coins, lifetime) VALUES ($1,$2,$2)
        ON CONFLICT (user_id) DO UPDATE SET coins = arcade_wallets.coins + $2, lifetime = arcade_wallets.lifetime + $2`, [userId, coins]);
      return { awarded: true, coins };
    });
  }

  async getCollection(userId: string) {
    await ensureArcadeSchema();
    const { rows } = await query(`SELECT character_id AS id, count FROM arcade_collection WHERE user_id = $1`, [userId]);
    return rows;
  }

  async openPack(userId: string, requestId: string, packId = "basic", rng?: () => number) {
    await ensureArcadeSchema();
    const pack = PACKS[packId];
    if (!pack) throw new GameError("Unknown pack.");
    return transaction(async (run) => {
      await run(`INSERT INTO arcade_wallets (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
      // row lock serialises concurrent requests from the same user (double clicks, retries)
      const wallet = await run(`SELECT coins FROM arcade_wallets WHERE user_id = $1 FOR UPDATE`, [userId]);
      const prior = await run(`SELECT character_id, duplicate, coins_after FROM arcade_pack_opens WHERE user_id = $1 AND request_id = $2`, [userId, requestId]);
      const { CHARACTERS } = await import("../arcade-server/characters.mjs");
      if (prior.rows.length) {
        const r = prior.rows[0];
        return { character: CHARACTERS.find((c) => c.id === r.character_id), duplicate: r.duplicate, coins: r.coins_after, repeated: true };
      }
      const coins = wallet.rows[0].coins;
      if (coins < pack.cost) throw new GameError(`You need ${pack.cost} coins (you have ${coins}).`);
      const character = rollPack(packId, rng);
      const had = await run(`SELECT count FROM arcade_collection WHERE user_id = $1 AND character_id = $2`, [userId, character.id]);
      await run(`UPDATE arcade_wallets SET coins = coins - $2 WHERE user_id = $1`, [userId, pack.cost]);
      await run(`INSERT INTO arcade_collection (user_id, character_id) VALUES ($1,$2)
        ON CONFLICT (user_id, character_id) DO UPDATE SET count = arcade_collection.count + 1`, [userId, character.id]);
      const duplicate = had.rows.length > 0;
      await run(`INSERT INTO arcade_pack_opens (user_id, request_id, character_id, duplicate, coins_after) VALUES ($1,$2,$3,$4,$5)`, [userId, requestId, character.id, duplicate, coins - pack.cost]);
      return { character, duplicate, coins: coins - pack.cost };
    });
  }

  async listSets(ownerId: string) {
    await ensureArcadeSchema();
    const { rows } = await query(`SELECT id, owner_id, title, items FROM arcade_content_sets WHERE owner_id = $1 ORDER BY updated_at DESC`, [ownerId]);
    return rows.map((r) => ({ id: r.id, ownerId: r.owner_id, title: r.title, items: r.items }));
  }
  async getSet(id: string) {
    await ensureArcadeSchema();
    const { rows } = await query(`SELECT id, owner_id, title, items FROM arcade_content_sets WHERE id = $1`, [id]);
    return rows[0] ? { id: rows[0].id, ownerId: rows[0].owner_id, title: rows[0].title, items: rows[0].items } : null;
  }
  async saveSet(set) {
    await ensureArcadeSchema();
    const id = set.id ?? crypto.randomUUID();
    const existing = await this.getSet(id);
    if (existing && existing.ownerId !== set.ownerId) throw new GameError("Not your content set.", "forbidden");
    await query(`INSERT INTO arcade_content_sets (id, owner_id, title, items) VALUES ($1,$2,$3,$4)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, items = EXCLUDED.items, updated_at = now()`, [id, set.ownerId, set.title, JSON.stringify(set.items)]);
    return { ...set, id };
  }
  async deleteSet(id: string, ownerId: string) {
    await ensureArcadeSchema();
    await query(`DELETE FROM arcade_content_sets WHERE id = $1 AND owner_id = $2`, [id, ownerId]);
  }
  async deleteUserData(userId: string) {
    await ensureArcadeSchema();
    await transaction(async (run) => {
      for (const t of ["arcade_wallets", "arcade_awards", "arcade_collection", "arcade_pack_opens"]) await run(`DELETE FROM ${t} WHERE user_id = $1`, [userId]);
      await run(`DELETE FROM arcade_content_sets WHERE owner_id = $1`, [userId]);
    });
  }
}
