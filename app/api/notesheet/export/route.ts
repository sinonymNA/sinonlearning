import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { NotesheetPlanSchema } from "@/lib/notesheetTypes";
import { renderNotesheetHtml } from "@/lib/notesheetRenderer";

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
  const html = renderNotesheetHtml(planResult.data, mode);

  let pdfBuffer: Buffer;
  try {
    // Dynamic import to avoid module-load issues in Next.js edge/serverless
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
        ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`
        : "/opt/pw-browsers/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const buf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await browser.close();
    pdfBuffer = Buffer.from(buf);
  } catch (err) {
    console.error("[notesheet/export] Playwright error:", err);
    return NextResponse.json(
      { error: "PDF generation failed. Please try again." },
      { status: 500 }
    );
  }

  const filename =
    `${planResult.data.concept.replace(/\s+/g, "_")}_notesheet${mode === "teacher_key" ? "_key" : ""}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
