import { randomUUID } from "crypto";
import { query } from "./db";
import type { GameShowPayload, GameShowType } from "./gameShowTypes";

export interface GameShow {
  id: string;
  type: GameShowType;
  title: string;
  payload: GameShowPayload;
  created_at: string;
  updated_at: string;
}

interface GameShowRow {
  id: string;
  type: GameShowType;
  title: string;
  payload: GameShowPayload;
  created_at: string;
  updated_at: string;
}

const GAME_SHOW_COLUMNS = "id, type, title, payload, created_at, updated_at";

let schemaReady: Promise<void> | null = null;

export function ensureGameShowSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS game_shows (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    ).then(() => undefined);
  }
  return schemaReady;
}

export async function createGameShow(
  type: GameShowType,
  title: string,
  payload: GameShowPayload
): Promise<GameShow> {
  await ensureGameShowSchema();
  const id = randomUUID();
  const { rows } = await query<GameShowRow>(
    `INSERT INTO game_shows (id, type, title, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING ${GAME_SHOW_COLUMNS}`,
    [id, type, title, JSON.stringify(payload)]
  );
  return rows[0];
}

export async function getGameShowById(id: string): Promise<GameShow | undefined> {
  await ensureGameShowSchema();
  const { rows } = await query<GameShowRow>(
    `SELECT ${GAME_SHOW_COLUMNS} FROM game_shows WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function getGameShowsByIds(ids: string[]): Promise<GameShow[]> {
  if (ids.length === 0) return [];
  await ensureGameShowSchema();
  const { rows } = await query<GameShowRow>(
    `SELECT ${GAME_SHOW_COLUMNS} FROM game_shows WHERE id = ANY($1) ORDER BY created_at DESC`,
    [ids]
  );
  return rows;
}

export async function updateGameShow(
  id: string,
  title: string,
  payload: GameShowPayload
): Promise<GameShow | undefined> {
  await ensureGameShowSchema();
  const { rows } = await query<GameShowRow>(
    `UPDATE game_shows SET title = $2, payload = $3, updated_at = now()
     WHERE id = $1
     RETURNING ${GAME_SHOW_COLUMNS}`,
    [id, title, JSON.stringify(payload)]
  );
  return rows[0];
}
