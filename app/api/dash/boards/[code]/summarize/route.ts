import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, getBoardPosts, BoardSummarySchema } from "@/lib/dashJam";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. A teacher is looking at a live classroom jamboard full of " +
  "student posts and wants a quick summary. Cluster the posts into a handful of clear themes and write one " +
  "encouraging, specific overall takeaway a teacher could say out loud to the class. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });

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
    `\nReturn JSON matching this schema exactly:`,
    `{"themes":[{"title":string,"summary":string}],"overall_takeaway":string}`,
    `Output only the JSON.`,
  ].join("\n");

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[dash/boards/summarize] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("[dash/boards/summarize] JSON parse failed. Raw:", raw.slice(0, 500));
    return NextResponse.json({ error: "KORA returned an unreadable response." }, { status: 422 });
  }

  const result = BoardSummarySchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json({ error: "KORA returned an invalid summary structure." }, { status: 422 });
  }

  return NextResponse.json({ summary: result.data });
}
