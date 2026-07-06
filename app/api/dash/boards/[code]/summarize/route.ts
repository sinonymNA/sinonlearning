import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, getBoardPosts, BoardSummarySchema } from "@/lib/dashJam";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. A teacher is looking at a live classroom jamboard full of " +
  "student posts and wants a quick summary. Cluster the posts into a handful of clear themes and write one " +
  "encouraging, specific overall takeaway a teacher could say out loud to the class.";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const ip = getClientIp(_request);
  if (isRateLimited(`dash-jam-summarize:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  const { code } = await params;
  const board = await getBoardByCode(code);
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  const posts = await getBoardPosts(board.id);
  if (posts.length === 0) {
    return NextResponse.json({ error: "Nothing to summarize yet — the board is empty." }, { status: 400 });
  }

  const postLines = posts.map((p, i) => {
    if (p.kind === "image") return `${i + 1}. [image posted by ${p.author_name}]`;
    if (p.kind === "link") return `${i + 1}. [link posted by ${p.author_name}]: ${p.content.linkUrl}`;
    return `${i + 1}. (${p.author_name}): ${p.content.text ?? ""}`;
  });

  const userMessage = [
    `Board title: ${board.title}`,
    `There are ${posts.length} posts on this jamboard:`,
    ...postLines,
    `\nTask: Cluster these posts into 2-5 clear themes (skip themes with only image/link posts if they don't cluster meaningfully), and write one overall takeaway.`,
  ].join("\n");

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      messages: [{ role: "user", content: userMessage }],
      schema: BoardSummarySchema,
    });
    return NextResponse.json({ summary: data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid summary structure." }, { status: 422 });
    }
    console.error("[dash/boards/summarize] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
