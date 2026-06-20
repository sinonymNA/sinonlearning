import { createHmac } from "crypto";
import { query } from "./db";

let schemaReady: Promise<void> | null = null;

export function ensureStockSimSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS stock_sim_saves (
        id SERIAL PRIMARY KEY,
        passcode_hash TEXT NOT NULL UNIQUE,
        state JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    ).then(() => undefined);
  }
  return schemaReady;
}

function hashPasscode(passcode: string): string {
  const secret = process.env.STOCK_SIM_SECRET ?? "";
  return createHmac("sha256", secret).update(passcode).digest("hex");
}

export async function saveStockSimGame(passcode: string, state: unknown): Promise<void> {
  await ensureStockSimSchema();
  const hash = hashPasscode(passcode);
  await query(
    `INSERT INTO stock_sim_saves (passcode_hash, state)
     VALUES ($1, $2)
     ON CONFLICT (passcode_hash) DO UPDATE SET state = $2, updated_at = now()`,
    [hash, JSON.stringify(state)]
  );
}

export async function loadStockSimGame(passcode: string): Promise<unknown | undefined> {
  await ensureStockSimSchema();
  const hash = hashPasscode(passcode);
  const { rows } = await query<{ state: unknown }>(
    "SELECT state FROM stock_sim_saves WHERE passcode_hash = $1",
    [hash]
  );
  return rows[0]?.state;
}
