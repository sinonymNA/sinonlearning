import { randomUUID } from "crypto";
import { z } from "zod";
import { query } from "./db";
import type { VaultCustomSet } from "./vaultGame";

export interface VaultSet {
  id: string;
  title: string;
  questions: VaultCustomSet["questions"];
  created_at: string;
}

type VaultSetRow = VaultSet;

const questionSchema = z.object({
  id: z.string().min(1).max(160),
  subject: z.string().min(1).max(160),
  concept: z.string().min(1).max(240),
  prompt: z.string().min(1).max(3000),
  choices: z.array(z.string().min(1).max(1000)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(3000),
  misconception: z.string().min(1).max(3000),
  repairPrompt: z.string().min(1).max(2000),
  repairChoices: z.tuple([z.string().min(1).max(1000), z.string().min(1).max(1000)]),
  repairAnswer: z.number().int().min(0).max(1),
});

const setSchema = z.object({
  title: z.string().trim().min(1).max(120),
  questions: z.array(questionSchema).min(3).max(100),
});

let schemaReady: Promise<void> | null = null;

export function ensureVaultSetSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS vault_sets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        questions JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    ).then(() => undefined);
  }
  return schemaReady;
}

export function validateVaultSet(input: unknown) {
  return setSchema.safeParse(input);
}

export async function createVaultSet(input: VaultCustomSet): Promise<VaultSet> {
  await ensureVaultSetSchema();
  const id = randomUUID();
  const { rows } = await query<VaultSetRow>(
    `INSERT INTO vault_sets (id, title, questions)
     VALUES ($1, $2, $3)
     RETURNING id, title, questions, created_at`,
    [id, input.title, JSON.stringify(input.questions)]
  );
  return rows[0];
}

export async function getVaultSetById(id: string): Promise<VaultSet | undefined> {
  await ensureVaultSetSchema();
  const { rows } = await query<VaultSetRow>(
    `SELECT id, title, questions, created_at FROM vault_sets WHERE id = $1`,
    [id]
  );
  return rows[0];
}
