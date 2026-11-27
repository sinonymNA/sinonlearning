import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import { requireUser, noStore } from "@/lib/pacerHttp";
import { getBookData, putBook, deleteBook } from "@/lib/pacerDb";
import { validateBook, LIMITS } from "@/lib/pacer/validate.mjs";
import { isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** The stored (gzipped) book text. The browser unzips it transparently. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const a = await requireUser(req); if ("res" in a) return a.res; const { id } = await params;
  const data = await getBookData(a.user.id, id); if (!data) return NextResponse.json({ error: "Not found." }, { status: 404, headers: noStore });
  return new Response(new Uint8Array(data), { headers: { "Content-Type": "application/json", "Content-Encoding": "gzip", ...noStore } });
}
/** Upload an extracted book: a gzipped JSON body (or plain JSON). Checked, size-limited and saved under the signed-in user only. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const a = await requireUser(req, true); if ("res" in a) return a.res; const { id } = await params;
  if (isRateLimited(`pacer-up:${a.user.id}`, 60 * 60 * 1000, 40)) return NextResponse.json({ error: "Too many uploads. Try again in a little while." }, { status: 429, headers: noStore });
  const len = Number(req.headers.get("content-length") || 0); if (len > LIMITS.maxBookBytes) return NextResponse.json({ error: "That book is too large to save (over 25 MB of text)." }, { status: 413, headers: noStore });
  const buf = Buffer.from(await req.arrayBuffer()); if (buf.length > LIMITS.maxBookBytes) return NextResponse.json({ error: "That book is too large to save." }, { status: 413, headers: noStore });
  let raw: Buffer; try { raw = req.headers.get("content-type")?.includes("gzip") ? gunzipSync(buf, { maxOutputLength: LIMITS.maxInflated }) : buf; } catch { return NextResponse.json({ error: "The upload could not be read." }, { status: 400, headers: noStore }); }
  let json: unknown; try { json = JSON.parse(raw.toString("utf8")); } catch { return NextResponse.json({ error: "The upload is not valid." }, { status: 400, headers: noStore }); }
  const v = validateBook(json); if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400, headers: noStore }); const book = v.book!; if (book.id !== id) return NextResponse.json({ error: "The book id does not match." }, { status: 400, headers: noStore });
  const { gzipSync } = await import("zlib"); const stored = gzipSync(Buffer.from(JSON.stringify(book)), { level: 6 });   // store what was validated, not what was sent
  const pos = Number(req.headers.get("x-pacer-pos") || 0), wpm = Number(req.headers.get("x-pacer-wpm") || 250), at = Number(req.headers.get("x-pacer-at") || 0);
  const r = await putBook(a.user.id, { id, title: book.title, author: book.author, words: book.words, added: book.added }, stored, Number.isFinite(pos) ? pos : 0, Number.isFinite(wpm) ? wpm : 250, Number.isFinite(at) ? at : 0);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 413, headers: noStore });
  return NextResponse.json({ ok: true, bytes: stored.length, words: book.words }, { headers: noStore });
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const a = await requireUser(req, true); if ("res" in a) return a.res; const { id } = await params;
  return NextResponse.json({ ok: await deleteBook(a.user.id, id) }, { headers: noStore });
}
