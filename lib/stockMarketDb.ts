import { query } from "./db";

let schemaReady: Promise<void> | null = null;

export function ensureStockMarketSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS stock_portfolios (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL UNIQUE,
        cash_balance NUMERIC(14,2) NOT NULL DEFAULT 100000.00,
        spy_baseline NUMERIC(14,4),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS stock_positions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id   UUID NOT NULL REFERENCES stock_portfolios(id) ON DELETE CASCADE,
        ticker         TEXT NOT NULL,
        shares         NUMERIC(14,4) NOT NULL DEFAULT 0,
        avg_cost_basis NUMERIC(14,4) NOT NULL,
        UNIQUE(portfolio_id, ticker)
      );

      CREATE TABLE IF NOT EXISTS stock_transactions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id    UUID NOT NULL REFERENCES stock_portfolios(id) ON DELETE CASCADE,
        ticker          TEXT NOT NULL,
        action          TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
        shares          NUMERIC(14,4) NOT NULL,
        price_per_share NUMERIC(14,4) NOT NULL,
        total_amount    NUMERIC(14,2) NOT NULL,
        executed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE stock_portfolios ADD COLUMN IF NOT EXISTS spy_baseline NUMERIC(14,4);
    `).then(() => undefined);
  }
  return schemaReady;
}

export interface Portfolio {
  id: string;
  user_id: string;
  cash_balance: string;
  spy_baseline: string | null;
  created_at: string;
}

export interface Position {
  id: string;
  portfolio_id: string;
  ticker: string;
  shares: string;
  avg_cost_basis: string;
}

export interface StockTransaction {
  id: string;
  portfolio_id: string;
  ticker: string;
  action: "buy" | "sell";
  shares: string;
  price_per_share: string;
  total_amount: string;
  executed_at: string;
}

export interface LeaderboardEntry {
  name: string;
  total_at_cost: string;
  position_count: string;
}

export async function getOrCreatePortfolio(
  userId: string,
  spyPrice?: number
): Promise<Portfolio> {
  await ensureStockMarketSchema();
  const { rows } = await query<Portfolio>(
    "SELECT * FROM stock_portfolios WHERE user_id = $1",
    [userId]
  );
  if (rows[0]) return rows[0];
  const { rows: created } = await query<Portfolio>(
    `INSERT INTO stock_portfolios (user_id, spy_baseline) VALUES ($1, $2) RETURNING *`,
    [userId, spyPrice ?? null]
  );
  return created[0];
}

export async function getPositions(portfolioId: string): Promise<Position[]> {
  await ensureStockMarketSchema();
  const { rows } = await query<Position>(
    `SELECT * FROM stock_positions
     WHERE portfolio_id = $1 AND shares > 0
     ORDER BY ticker ASC`,
    [portfolioId]
  );
  return rows;
}

export async function executeTrade(
  portfolioId: string,
  ticker: string,
  action: "buy" | "sell",
  shares: number,
  pricePerShare: number
): Promise<{ ok: boolean; error?: string }> {
  await ensureStockMarketSchema();
  const totalAmount = parseFloat((shares * pricePerShare).toFixed(2));

  if (action === "buy") {
    const { rows } = await query<{ cash_balance: string }>(
      `UPDATE stock_portfolios
       SET cash_balance = cash_balance - $1
       WHERE id = $2 AND cash_balance >= $1
       RETURNING cash_balance`,
      [totalAmount, portfolioId]
    );
    if (rows.length === 0) {
      return { ok: false, error: "Insufficient funds." };
    }
    await query(
      `INSERT INTO stock_positions (portfolio_id, ticker, shares, avg_cost_basis)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (portfolio_id, ticker) DO UPDATE SET
         avg_cost_basis = (stock_positions.shares * stock_positions.avg_cost_basis + $3 * $4)
                          / (stock_positions.shares + $3),
         shares = stock_positions.shares + $3`,
      [portfolioId, ticker, shares, pricePerShare]
    );
  } else {
    const { rows } = await query<{ shares: string }>(
      `UPDATE stock_positions
       SET shares = shares - $1
       WHERE portfolio_id = $2 AND ticker = $3 AND shares >= $1
       RETURNING shares`,
      [shares, portfolioId, ticker]
    );
    if (rows.length === 0) {
      return { ok: false, error: `Not enough shares of ${ticker} to sell.` };
    }
    await query(
      `UPDATE stock_portfolios SET cash_balance = cash_balance + $1 WHERE id = $2`,
      [totalAmount, portfolioId]
    );
  }

  await query(
    `INSERT INTO stock_transactions
       (portfolio_id, ticker, action, shares, price_per_share, total_amount)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [portfolioId, ticker, action, shares, pricePerShare, totalAmount]
  );

  return { ok: true };
}

export async function getTransactionHistory(
  portfolioId: string,
  limit = 50
): Promise<StockTransaction[]> {
  await ensureStockMarketSchema();
  const { rows } = await query<StockTransaction>(
    `SELECT * FROM stock_transactions
     WHERE portfolio_id = $1
     ORDER BY executed_at DESC
     LIMIT $2`,
    [portfolioId, limit]
  );
  return rows;
}

export async function getLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  await ensureStockMarketSchema();
  const { rows } = await query<LeaderboardEntry>(
    `SELECT
       u.name,
       (p.cash_balance + COALESCE(SUM(pos.shares * pos.avg_cost_basis), 0))::TEXT AS total_at_cost,
       COUNT(pos.id)::TEXT AS position_count
     FROM stock_portfolios p
     JOIN margins_users u ON u.id = p.user_id
     LEFT JOIN stock_positions pos ON pos.portfolio_id = p.id AND pos.shares > 0
     GROUP BY p.id, u.name, p.cash_balance
     ORDER BY total_at_cost DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
