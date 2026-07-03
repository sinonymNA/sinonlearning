import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { NotesheetPlanSchema } from "@/lib/notesheetTypes";
import NotesheetDocument from "@/lib/notesheetPdf";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-export:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: { plan: unknown; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const planResult = NotesheetPlanSchema.safeParse(body.plan);
  if (!planResult.success) {
    return NextResponse.json({ error: "Invalid plan data." }, { status: 400 });
  }

  const mode = body.mode === "teacher_key" ? "teacher_key" : "student";

  let pdfBuffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(NotesheetDocument, { plan: planResult.data, mode }) as any;
    const buffer = await renderToBuffer(element);
    pdfBuffer = Buffer.from(buffer);
  } catch (err) {
    console.error("[notesheet/export] PDF render error:", err);
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 }
    );
  }

  const filename = `${planResult.data.concept.replace(/\s+/g, "_")}_notesheet${mode === "teacher_key" ? "_key" : ""}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
