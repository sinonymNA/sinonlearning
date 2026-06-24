import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { buildCometEditPrompt } from "@/lib/cometEditPrompt";
import { sanitizeCometEdit } from "@/lib/cometEditValidation";
import type { StudioSlide, TeacherGuide, WorksheetSection } from "@/lib/studioTypes";

export const dynamic = "force-dynamic";

const MAX_INSTRUCTION_LENGTH = 500;
const MAX_PROJECT_JSON_LENGTH = 16000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

interface CometEditRequestBody {
  instruction: string;
  project: {
    title: string;
    subject: string;
    gradeLevel: string;
    durationMinutes: number;
    teachingStyle: string;
    slides: StudioSlide[];
    worksheetSections: WorksheetSection[];
    teacherGuide: TeacherGuide;
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live Comet edits aren't set up right now. You can use the quick actions or edit manually below." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(`studio-comet:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
    return NextResponse.json(
      { error: "Comet is busy right now. Please try again in a bit, or use the quick actions instead." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as Partial<CometEditRequestBody>;
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  const project = body.project;

  if (!instruction) {
    return NextResponse.json({ error: "Tell Comet what you'd like to change first." }, { status: 400 });
  }
  if (instruction.length > MAX_INSTRUCTION_LENGTH) {
    return NextResponse.json(
      { error: `That request is too long (max ${MAX_INSTRUCTION_LENGTH} characters).` },
      { status: 400 }
    );
  }
  if (
    !project ||
    !Array.isArray(project.slides) ||
    !Array.isArray(project.worksheetSections) ||
    !project.teacherGuide
  ) {
    return NextResponse.json({ error: "This project is missing content Comet needs." }, { status: 400 });
  }
  if (JSON.stringify(project).length > MAX_PROJECT_JSON_LENGTH) {
    return NextResponse.json(
      { error: "This project is too large for a live edit right now. Try editing a smaller piece by hand." },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildCometEditPrompt(instruction, {
            title: project.title,
            subject: project.subject,
            gradeLevel: project.gradeLevel,
            durationMinutes: project.durationMinutes,
            teachingStyle: project.teachingStyle,
            slides: project.slides,
            worksheetSections: project.worksheetSections,
            teacherGuide: project.teacherGuide,
          }),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      return NextResponse.json(
        { error: "Comet's response wasn't in the right format. You can try rephrasing your request." },
        { status: 502 }
      );
    }

    const result = sanitizeCometEdit(parsed);
    if (!result) {
      return NextResponse.json(
        { error: "Comet generated content that didn't quite fit. You can try rephrasing your request." },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "Comet is busy right now. Please try again in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Comet couldn't make that edit. You can try again or use the quick actions instead." },
      { status: 500 }
    );
  }
}
