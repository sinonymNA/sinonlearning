import { NextRequest, NextResponse } from "next/server";
import { lookup } from "dns/promises";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createSliderImage } from "@/lib/sliderDb";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 60;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.split(":").pop();
    if (v4 && isPrivateIPv4(v4)) return true;
  }
  return false;
}

// Blocks the obvious SSRF targets (localhost/private/link-local ranges) by
// resolving the hostname up front. Not airtight against DNS-rebinding (the
// actual fetch() below re-resolves independently), but closes off casual
// probing of internal services via a teacher-supplied image URL.
async function assertSafeImageUrl(urlStr: string): Promise<URL> {
  const parsed = new URL(urlStr);
  if (parsed.protocol !== "https:") {
    throw new Error("Only https:// image URLs are supported.");
  }
  if (parsed.hostname === "localhost") {
    throw new Error("That URL is not allowed.");
  }
  const addresses = await lookup(parsed.hostname, { all: true });
  for (const { address, family } of addresses) {
    if (family === 4 && isPrivateIPv4(address)) throw new Error("That URL is not allowed.");
    if (family === 6 && isPrivateIPv6(address)) throw new Error("That URL is not allowed.");
  }
  return parsed;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`slider-images:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many uploads. Try again in an hour." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPEG, GIF, or WEBP images are supported." }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image exceeds 8 MB limit." }, { status: 413 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await createSliderImage({ uploadedBy: user.id, mimeType: file.type, data: buffer });
    return NextResponse.json({ imageId: image.id });
  }

  let body: { imageUrl?: string; attribution?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const imageUrl = (body.imageUrl ?? "").trim();
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = await assertSafeImageUrl(imageUrl);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Invalid imageUrl." }, { status: 400 });
  }

  let fetchRes: Response;
  try {
    fetchRes = await fetch(parsed.toString(), { signal: AbortSignal.timeout(10000) });
  } catch {
    return NextResponse.json({ error: "Could not fetch that image." }, { status: 502 });
  }
  if (!fetchRes.ok) {
    return NextResponse.json({ error: "Could not fetch that image." }, { status: 502 });
  }

  const fetchedType = (fetchRes.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!ALLOWED_MIME_TYPES.includes(fetchedType)) {
    return NextResponse.json({ error: "That URL is not a supported image type." }, { status: 415 });
  }

  const arrayBuf = await fetchRes.arrayBuffer();
  if (arrayBuf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds 8 MB limit." }, { status: 413 });
  }

  const image = await createSliderImage({
    uploadedBy: user.id,
    mimeType: fetchedType,
    data: Buffer.from(arrayBuf),
    sourceUrl: imageUrl,
    attribution: body.attribution?.trim() || null,
  });
  return NextResponse.json({ imageId: image.id });
}
