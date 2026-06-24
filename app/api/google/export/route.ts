import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { isGoogleExportConfigured } from "@/lib/googleExportAuth";
import { buildDocBlocks, docBlocksToBatchRequests } from "@/lib/googleDocsExport";
import { buildCoreSlideRequests, buildImageRequest, buildNotesRequest, PAGE_SIZE } from "@/lib/googleSlidesExport";
import type { TeacherStudioProject } from "@/lib/studioTypes";

export const dynamic = "force-dynamic";

const MAX_PROJECT_JSON_LENGTH = 200_000;

interface ExportRequestBody {
  accessToken: string;
  target: "docs" | "slides";
  project: TeacherStudioProject;
  includeAnswerKey?: boolean;
}

export async function POST(request: NextRequest) {
  if (!isGoogleExportConfigured()) {
    return NextResponse.json({ error: "Google export isn't set up yet." }, { status: 503 });
  }

  const body = (await request.json()) as Partial<ExportRequestBody>;
  const { accessToken, target, project } = body;
  if (!accessToken || (target !== "docs" && target !== "slides") || !project) {
    return NextResponse.json({ error: "Missing export details." }, { status: 400 });
  }
  if (JSON.stringify(project).length > MAX_PROJECT_JSON_LENGTH) {
    return NextResponse.json({ error: "This project is too large to export right now." }, { status: 400 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  try {
    if (target === "docs") {
      const docs = google.docs({ version: "v1", auth });
      const created = await docs.documents.create({ requestBody: { title: project.title || "Untitled lesson" } });
      const documentId = created.data.documentId;
      if (!documentId) throw new Error("Docs API did not return a document id.");

      const requests = docBlocksToBatchRequests(buildDocBlocks(project, body.includeAnswerKey ?? true));
      if (requests.length > 0) {
        await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
      }
      return NextResponse.json({ url: `https://docs.google.com/document/d/${documentId}/edit` });
    }

    const slides = google.slides({ version: "v1", auth });
    const created = await slides.presentations.create({
      requestBody: { title: project.title || "Untitled lesson", pageSize: PAGE_SIZE },
    });
    const presentationId = created.data.presentationId;
    const defaultSlideId = created.data.slides?.[0]?.objectId;
    if (!presentationId) throw new Error("Slides API did not return a presentation id.");

    const { requests, imageJobs, noteJobs } = buildCoreSlideRequests(project);
    if (defaultSlideId) requests.push({ deleteObject: { objectId: defaultSlideId } });
    await slides.presentations.batchUpdate({ presentationId, requestBody: { requests } });

    for (const job of imageJobs) {
      try {
        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: { requests: [buildImageRequest(job.slideId, job.rect, job.url)] },
        });
      } catch {
        // Best-effort: a bad/unreachable pasted image URL shouldn't sink the whole export.
      }
    }

    if (noteJobs.length > 0) {
      try {
        const presentation = await slides.presentations.get({ presentationId });
        const noteRequests: object[] = [];
        presentation.data.slides?.forEach((slide) => {
          const job = noteJobs.find((j) => j.slideId === slide.objectId);
          const notesId = slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;
          if (job && notesId) noteRequests.push(buildNotesRequest(notesId, job.text));
        });
        if (noteRequests.length > 0) {
          await slides.presentations.batchUpdate({ presentationId, requestBody: { requests: noteRequests } });
        }
      } catch {
        // Best-effort: speaker notes aren't critical to the export succeeding.
      }
    }

    return NextResponse.json({ url: `https://docs.google.com/presentation/d/${presentationId}/edit` });
  } catch (err) {
    const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status;
    if (status === 401) {
      return NextResponse.json({ error: "Your Google sign-in expired. Try exporting again." }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't create the Google file. Please try again." }, { status: 502 });
  }
}
