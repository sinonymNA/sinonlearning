import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { ImportAssignmentSchema } from "@/lib/marginsGradingTypes";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 15;
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ALLOWED_PDF_TYPE = "application/pdf";

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, helping a teacher import an AP World History: Modern " +
  "essay assignment they already have on paper or as a file into the Margins app. This is a TRANSCRIPTION " +
  "task, not a writing task — the assignment already exists in the upload; your job is to read it " +
  "accurately and structure it as JSON, not to invent or improve it. Transcribe only what is actually " +
  "visible in the upload. If a field isn't visible (e.g. no rubric shown, or no source documents included), " +
  "OMIT that field entirely rather than inventing one — an omitted rubric or document list is expected and " +
  "correct when the upload doesn't show one. If the upload clearly includes primary-source excerpts (for a " +
  "DBQ), you MAY transcribe their visible text into \"documents\" — this is copying real text already in " +
  "front of you, not writing new content. Never fabricate rubric point values, criteria, or document text " +
  "that isn't actually visible.";

const USER_MESSAGE =
  "Transcribe the essay assignment shown in the attached file.\n" +
  "Rules:\n" +
  "1. essay_type: determine from the assignment's structure (DBQ = document-based with sources, LEQ = long essay with no documents, SAQ = three short labeled parts a/b/c).\n" +
  "2. title: a short descriptive title for this assignment — invent a plain, neutral one only if none is visible.\n" +
  "3. prompt_text: transcribe the actual essay prompt/question verbatim as closely as legibility allows.\n" +
  "4. rubric: only include if actual point values/criteria are visible in the upload — never invent generic AP rubric language.\n" +
  "5. documents: only include if actual source document text/images are visible in the upload — transcribe their visible text faithfully, never summarize or invent. Omit the rubric and documents fields entirely when they aren't visible.";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-import-assignment:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many import requests. Try again in an hour." }, { status: 429 });
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

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isPdf = file.type === ALLOWED_PDF_TYPE;
  if (!isImage && !isPdf) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, GIF, WEBP, or PDF files are supported." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 15 MB limit." }, { status: 413 });
  }

  const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    // Transcription accuracy matters most here — runs on Opus with adaptive
    // thinking; the larger token budget leaves room for the thinking pass.
    const { data } = await callKoraStructured({
      model: "claude-opus-4-8",
      maxTokens: 8192,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document" as const,
                  source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64Data },
                }
              : {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: file.type as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                    data: base64Data,
                  },
                },
            { type: "text" as const, text: USER_MESSAGE },
          ],
        },
      ],
      schema: ImportAssignmentSchema,
    });
    return NextResponse.json({ assignment: data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA couldn't read that file as an assignment." }, { status: 422 });
    }
    console.error("[margins/import-assignment] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
