import { randomBytes } from "crypto";
import { query, getPool } from "./db";
import { rollMachineChest, type MachineChoice, type CapsuleQuestion, type ChestResult } from "./capsuleData";
import { STARTER_CAP_ID } from "./capsuleData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CapsuleRole = "teacher" | "student";

export interface CapsuleUser {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  role: CapsuleRole;
  coins: number;
  equipped_cap_id: string;
  created_at: string;
}

export interface CapsulePlayer {
  id: string;
  game_code: string;
  user_id: string | null;
  display_name: string;
  cap_id: string;
  gold: number;
  joined_at: string;
}

export interface CapsuleGame {
  code: string;
  host_id: string;
  title: string;
  questions: CapsuleQuestion[];
  status: "waiting" | "active" | "ended";
  current_question: number;
  question_started_at: string | null;
  created_at: string;
}

export interface CapsuleAnswer {
  id: string;
  game_code: string;
  player_id: string;
  question_index: number;
  answer_index: number;
  is_correct: boolean;
  chest_result: ChestResult | null;
  machine_choice: string | null;
  consolation_earned: boolean;
  answered_at: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

export function ensureCapsuleSchema(): Promise<void> {
  if (!schemaReady) schemaReady = _buildSchema();
  return schemaReady;
}

async function _buildSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS capsule_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      coins INTEGER NOT NULL DEFAULT 100,
      equipped_cap_id TEXT NOT NULL DEFAULT '${STARTER_CAP_ID}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS capsule_sessions (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES capsule_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS capsule_user_caps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES capsule_users(id) ON DELETE CASCADE,
      cap_id TEXT NOT NULL,
      obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, cap_id)
    );

    CREATE TABLE IF NOT EXISTS capsule_question_sets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id UUID NOT NULL REFERENCES capsule_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      questions JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS capsule_games (
      code TEXT PRIMARY KEY,
      host_id UUID NOT NULL REFERENCES capsule_users(id),
      title TEXT NOT NULL,
      questions JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'waiting',
      current_question INTEGER NOT NULL DEFAULT 0,
      question_started_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS capsule_players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_code TEXT NOT NULL REFERENCES capsule_games(code) ON DELETE CASCADE,
      user_id UUID REFERENCES capsule_users(id),
      display_name TEXT NOT NULL,
      cap_id TEXT NOT NULL DEFAULT '${STARTER_CAP_ID}',
      gold INTEGER NOT NULL DEFAULT 0,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS capsule_answers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_code TEXT NOT NULL REFERENCES capsule_games(code) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES capsule_players(id) ON DELETE CASCADE,
      question_index INTEGER NOT NULL,
      answer_index INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      chest_result JSONB,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(game_code, player_id, question_index)
    );
  `);
  await query(`ALTER TABLE capsule_answers ADD COLUMN IF NOT EXISTS machine_choice TEXT`);
  await query(`ALTER TABLE capsule_answers ADD COLUMN IF NOT EXISTS consolation_earned BOOLEAN NOT NULL DEFAULT false`);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createCapsuleUser(
  email: string, passwordHash: string, username: string, role: CapsuleRole,
): Promise<CapsuleUser> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleUser>(
    `INSERT INTO capsule_users (email, password_hash, username, role)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, passwordHash, username, role],
  );
  const user = res.rows[0];
  // Give them the starter cap
  await query(
    `INSERT INTO capsule_user_caps (user_id, cap_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [user.id, STARTER_CAP_ID],
  );
  return user;
}

export async function getCapsuleUserByEmail(email: string): Promise<CapsuleUser | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleUser>(
    `SELECT * FROM capsule_users WHERE email = $1`, [email],
  );
  return res.rows[0] ?? null;
}

export async function getCapsuleUserById(id: string): Promise<CapsuleUser | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleUser>(
    `SELECT * FROM capsule_users WHERE id = $1`, [id],
  );
  return res.rows[0] ?? null;
}

export async function getCapsuleUserByUsername(username: string): Promise<CapsuleUser | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleUser>(
    `SELECT * FROM capsule_users WHERE username = $1`, [username],
  );
  return res.rows[0] ?? null;
}

export async function equipCap(userId: string, capId: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(`UPDATE capsule_users SET equipped_cap_id = $1 WHERE id = $2`, [capId, userId]);
}

export async function getUserCaps(userId: string): Promise<string[]> {
  await ensureCapsuleSchema();
  const res = await query<{ cap_id: string }>(
    `SELECT cap_id FROM capsule_user_caps WHERE user_id = $1 ORDER BY obtained_at ASC`,
    [userId],
  );
  return res.rows.map(r => r.cap_id);
}

export async function grantCap(userId: string, capId: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(
    `INSERT INTO capsule_user_caps (user_id, cap_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, capId],
  );
}

export async function spendCoins(userId: string, amount: number): Promise<boolean> {
  await ensureCapsuleSchema();
  const res = await query<{ coins: number }>(
    `UPDATE capsule_users SET coins = coins - $1 WHERE id = $2 AND coins >= $1 RETURNING coins`,
    [amount, userId],
  );
  return res.rows.length > 0;
}

export async function awardCoins(userId: string, amount: number): Promise<void> {
  await ensureCapsuleSchema();
  await query(`UPDATE capsule_users SET coins = coins + $1 WHERE id = $2`, [amount, userId]);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createCapsuleSession(userId: string, expiresAt: Date): Promise<string> {
  await ensureCapsuleSchema();
  const token = randomBytes(32).toString("hex");
  await query(
    `INSERT INTO capsule_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt.toISOString()],
  );
  return token;
}

export async function getCapsuleSessionUser(token: string): Promise<CapsuleUser | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleUser>(
    `SELECT u.* FROM capsule_users u
     JOIN capsule_sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token],
  );
  return res.rows[0] ?? null;
}

export async function deleteCapsuleSession(token: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(`DELETE FROM capsule_sessions WHERE token = $1`, [token]);
}

// ─── Question sets ────────────────────────────────────────────────────────────

export async function createQuestionSet(
  creatorId: string, title: string, questions: CapsuleQuestion[],
) {
  await ensureCapsuleSchema();
  const res = await query<{ id: string; title: string; created_at: string }>(
    `INSERT INTO capsule_question_sets (creator_id, title, questions)
     VALUES ($1, $2, $3) RETURNING id, title, created_at`,
    [creatorId, title, JSON.stringify(questions)],
  );
  return res.rows[0];
}

export async function getQuestionSetsByUser(userId: string) {
  await ensureCapsuleSchema();
  const res = await query<{ id: string; title: string; questions: CapsuleQuestion[]; created_at: string }>(
    `SELECT id, title, questions, created_at FROM capsule_question_sets
     WHERE creator_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return res.rows;
}

export async function getQuestionSet(id: string) {
  await ensureCapsuleSchema();
  const res = await query<{ id: string; creator_id: string; title: string; questions: CapsuleQuestion[]; created_at: string }>(
    `SELECT * FROM capsule_question_sets WHERE id = $1`, [id],
  );
  return res.rows[0] ?? null;
}

// ─── Games ────────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createGame(
  hostId: string, title: string, questions: CapsuleQuestion[],
): Promise<string> {
  await ensureCapsuleSchema();
  let code = generateCode();
  // Retry on collision (extremely unlikely)
  for (let i = 0; i < 5; i++) {
    try {
      await query(
        `INSERT INTO capsule_games (code, host_id, title, questions) VALUES ($1, $2, $3, $4)`,
        [code, hostId, title, JSON.stringify(questions)],
      );
      return code;
    } catch {
      code = generateCode();
    }
  }
  throw new Error("Could not generate unique game code.");
}

export async function getGame(code: string): Promise<CapsuleGame | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleGame>(
    `SELECT * FROM capsule_games WHERE code = $1`, [code],
  );
  return res.rows[0] ?? null;
}

export async function startGame(code: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(
    `UPDATE capsule_games SET status = 'active', current_question = 0, question_started_at = NOW()
     WHERE code = $1 AND status = 'waiting'`,
    [code],
  );
}

export async function advanceQuestion(code: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(
    `UPDATE capsule_games
     SET current_question = current_question + 1, question_started_at = NOW()
     WHERE code = $1`,
    [code],
  );
}

export async function endGame(code: string): Promise<void> {
  await ensureCapsuleSchema();
  await query(`UPDATE capsule_games SET status = 'ended' WHERE code = $1`, [code]);
}

// ─── Players ──────────────────────────────────────────────────────────────────

export async function joinGame(
  gameCode: string, userId: string | null, displayName: string, capId: string,
): Promise<CapsulePlayer> {
  await ensureCapsuleSchema();
  // If user already in game, return existing player
  if (userId) {
    const existing = await query<CapsulePlayer>(
      `SELECT * FROM capsule_players WHERE game_code = $1 AND user_id = $2`,
      [gameCode, userId],
    );
    if (existing.rows[0]) return existing.rows[0];
  }
  const res = await query<CapsulePlayer>(
    `INSERT INTO capsule_players (game_code, user_id, display_name, cap_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [gameCode, userId, displayName, capId],
  );
  return res.rows[0];
}

export async function getPlayers(gameCode: string): Promise<CapsulePlayer[]> {
  await ensureCapsuleSchema();
  const res = await query<CapsulePlayer>(
    `SELECT * FROM capsule_players WHERE game_code = $1 ORDER BY gold DESC, joined_at ASC`,
    [gameCode],
  );
  return res.rows;
}

export async function getPlayerById(id: string): Promise<CapsulePlayer | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsulePlayer>(
    `SELECT * FROM capsule_players WHERE id = $1`, [id],
  );
  return res.rows[0] ?? null;
}

// ─── Answers ──────────────────────────────────────────────────────────────────

export async function getAnswer(
  gameCode: string, playerId: string, questionIndex: number,
): Promise<CapsuleAnswer | null> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleAnswer>(
    `SELECT * FROM capsule_answers
     WHERE game_code = $1 AND player_id = $2 AND question_index = $3`,
    [gameCode, playerId, questionIndex],
  );
  return res.rows[0] ?? null;
}

export async function submitAnswer(
  gameCode: string,
  playerId: string,
  questionIndex: number,
  answerIndex: number,
  isCorrect: boolean,
): Promise<{ answer: CapsuleAnswer; goldDelta: number }> {
  await ensureCapsuleSchema();

  const res = await query<CapsuleAnswer>(
    `INSERT INTO capsule_answers (game_code, player_id, question_index, answer_index, is_correct)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (game_code, player_id, question_index) DO NOTHING
     RETURNING *`,
    [gameCode, playerId, questionIndex, answerIndex, isCorrect],
  );

  return { answer: res.rows[0], goldDelta: 0 };
}

export async function resolveAnswer(
  gameCode: string,
  playerId: string,
  questionIndex: number,
  machine: MachineChoice,
): Promise<{ chestResult: ChestResult; goldDelta: number }> {
  await ensureCapsuleSchema();

  const existing = await getAnswer(gameCode, playerId, questionIndex);
  if (!existing || !existing.is_correct || existing.chest_result !== null) {
    throw new Error("Cannot resolve: answer not found, incorrect, or already resolved.");
  }

  const players = await getPlayers(gameCode);
  const chest = rollMachineChest(machine, playerId, players);
  let goldDelta = 0;

  if (chest.type === "gold") {
    goldDelta = chest.amount;
    await query(`UPDATE capsule_players SET gold = gold + $1 WHERE id = $2`, [chest.amount, playerId]);
  } else if (chest.type === "steal") {
    goldDelta = chest.amount;
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(`UPDATE capsule_players SET gold = GREATEST(0, gold - $1) WHERE id = $2`, [chest.amount, chest.fromId]);
      await client.query(`UPDATE capsule_players SET gold = gold + $1 WHERE id = $2`, [chest.amount, playerId]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else if (chest.type === "lose") {
    goldDelta = -chest.amount;
    await query(`UPDATE capsule_players SET gold = GREATEST(0, gold - $1) WHERE id = $2`, [chest.amount, playerId]);
  } else if (chest.type === "double") {
    const p = await getPlayerById(playerId);
    if (p) {
      goldDelta = p.gold;
      await query(`UPDATE capsule_players SET gold = gold * 2 WHERE id = $1`, [playerId]);
    }
  }

  await query(
    `UPDATE capsule_answers SET chest_result = $1, machine_choice = $2 WHERE id = $3`,
    [JSON.stringify(chest), machine, existing.id],
  );

  return { chestResult: chest, goldDelta };
}

export async function awardConsolation(
  gameCode: string,
  playerId: string,
  questionIndex: number,
): Promise<{ goldDelta: number }> {
  await ensureCapsuleSchema();

  const existing = await getAnswer(gameCode, playerId, questionIndex);
  if (!existing || existing.is_correct || existing.consolation_earned) {
    throw new Error("Cannot award consolation: answer not found, was correct, or already earned.");
  }

  await query(`UPDATE capsule_players SET gold = gold + 3 WHERE id = $1`, [playerId]);
  await query(`UPDATE capsule_answers SET consolation_earned = true WHERE id = $1`, [existing.id]);

  return { goldDelta: 3 };
}

export async function getAnswersForQuestion(
  gameCode: string, questionIndex: number,
): Promise<CapsuleAnswer[]> {
  await ensureCapsuleSchema();
  const res = await query<CapsuleAnswer>(
    `SELECT * FROM capsule_answers WHERE game_code = $1 AND question_index = $2`,
    [gameCode, questionIndex],
  );
  return res.rows;
}
