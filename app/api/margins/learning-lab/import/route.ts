import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { parseLearningLabCsv } from "@/lib/marginsLearningLabImport";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: "Expected a CSV file upload." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "CSV exceeds 2 MB." }, { status: 413 });
  const csv = await file.text();
  const preview = parseLearningLabCsv(csv);
  return NextResponse.json({
    preview,
    publishable: preview.questions.length > 0 && preview.errors.length === 0,
  });
}
