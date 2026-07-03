import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const MAX_BYTES = 10 * 1024 * 1024;

function extractTextFromXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const textNodes = doc.getElementsByTagName("a:t");
  const parts: string[] = [];
  for (let i = 0; i < textNodes.length; i++) {
    const text = textNodes[i].textContent?.trim();
    if (text) parts.push(text);
  }
  return parts.join(" ");
}

async function extractPptxSlides(buffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? "0");
      const nb = parseInt(b.match(/\d+/)?.[0] ?? "0");
      return na - nb;
    });

  const slides: string[] = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("string");
    const text = extractTextFromXml(xml);
    if (text) slides.push(text);
  }
  return slides;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-upload:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

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

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["pptx", "pdf"].includes(ext ?? "")) {
    return NextResponse.json(
      { error: "Only .pptx and .pdf files are supported." },
      { status: 415 }
    );
  }

  const buffer = await file.arrayBuffer();

  if (ext === "pdf") {
    return NextResponse.json(
      { error: "PDF text extraction is not yet supported. Please use .pptx." },
      { status: 415 }
    );
  }

  let slides: string[];
  try {
    slides = await extractPptxSlides(buffer);
  } catch (err) {
    console.error("[notesheet/upload] PPTX parse error:", err);
    return NextResponse.json({ error: "Could not read the PPTX file." }, { status: 422 });
  }

  if (slides.length === 0) {
    return NextResponse.json(
      { error: "No readable text found in the presentation." },
      { status: 422 }
    );
  }

  const rawText = slides.map((s, i) => `[Slide ${i + 1}]\n${s}`).join("\n\n");

  return NextResponse.json({ slides, slideCount: slides.length, rawText });
}
