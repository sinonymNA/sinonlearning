import { randomUUID, randomBytes } from "crypto";
import { z } from "zod";
import { query } from "./db";

export const BoardSummarySchema = z.object({
  themes: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
      })
    )
    .min(1),
  overall_takeaway: z.string().min(1),
});
export type BoardSummaryOutput = z.infer<typeof BoardSummarySchema>;

export type BoardPostKind = "sticky" | "text" | "image" | "link";

export interface DashBoard {
  id: string;
  code: string;
  host_token: string;
  title: string;
  created_at: string;
}

export interface DashBoardPostContent {
  text?: string;
  color?: string;
  imageUrl?: string;
  linkUrl?: string;
}

export interface DashBoardPost {
  id: string;
  board_id: string;
  kind: BoardPostKind;
  content: DashBoardPostContent;
  author_name: string;
  created_at: string;
}

let schemaReady: Promise<void> | null = null;

export function ensureDashJamSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS dash_boards (
        id UUID PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        host_token TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Class Jamboard',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS dash_board_posts (
          id UUID PRIMARY KEY,
          board_id UUID NOT NULL REFERENCES dash_boards(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          content JSONB NOT NULL,
          author_name TEXT NOT NULL DEFAULT 'Anonymous',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() => undefined);
  }
  return schemaReady;
}

const BOARD_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateBoardCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += BOARD_CODE_ALPHABET[bytes[i] % BOARD_CODE_ALPHABET.length];
  }
  return code;
}

export async function createBoard(title?: string): Promise<DashBoard> {
  await ensureDashJamSchema();
  const id = randomUUID();
  const hostToken = randomBytes(24).toString("hex");
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateBoardCode();
    try {
      const { rows } = await query<DashBoard>(
        `INSERT INTO dash_boards (id, code, host_token, title)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code, host_token, title, created_at`,
        [id, code, hostToken, title?.trim() || "Class Jamboard"]
      );
      return rows[0];
    } catch (err) {
      const isUniqueViolation = (err as { code?: string }).code === "23505";
      if (!isUniqueViolation || attempt === 7) throw err;
    }
  }
  throw new Error("Could not generate a unique board code.");
}

export async function getBoardByCode(code: string): Promise<DashBoard | undefined> {
  await ensureDashJamSchema();
  const { rows } = await query<DashBoard>(
    `SELECT id, code, host_token, title, created_at FROM dash_boards WHERE code = $1`,
    [code.toUpperCase().trim()]
  );
  return rows[0];
}

export async function getBoardPosts(boardId: string): Promise<DashBoardPost[]> {
  await ensureDashJamSchema();
  const { rows } = await query<DashBoardPost>(
    `SELECT id, board_id, kind, content, author_name, created_at
     FROM dash_board_posts WHERE board_id = $1 ORDER BY created_at ASC`,
    [boardId]
  );
  return rows;
}

export async function addBoardPost(params: {
  boardId: string;
  kind: BoardPostKind;
  content: DashBoardPostContent;
  authorName: string;
}): Promise<DashBoardPost> {
  await ensureDashJamSchema();
  const id = randomUUID();
  const { rows } = await query<DashBoardPost>(
    `INSERT INTO dash_board_posts (id, board_id, kind, content, author_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, board_id, kind, content, author_name, created_at`,
    [
      id,
      params.boardId,
      params.kind,
      JSON.stringify(params.content),
      params.authorName.trim() || "Anonymous",
    ]
  );
  return rows[0];
}

export async function deleteBoardPost(boardId: string, postId: string): Promise<boolean> {
  await ensureDashJamSchema();
  const { rowCount } = await query(
    `DELETE FROM dash_board_posts WHERE id = $1 AND board_id = $2`,
    [postId, boardId]
  );
  return (rowCount ?? 0) > 0;
}
