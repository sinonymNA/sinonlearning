import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { isGoogleExportConfigured } from "@/lib/googleExportAuth";
import { buildAnchoredNotesDocBlocks, buildDocBlocks, buildTableFillRequests, docBlocksToBatchRequests } from "@/lib/googleDocsExport";
import { buildCoreSlideRequests, buildImageRequest, buildNotesRequest, PAGE_SIZE } from "@/lib/googleSlidesExport";
import { buildAnchoredNotesSlideRequests } from "@/lib/anchoredNotesSlidesExport";
import type { TeacherStudioProject } from "@/lib/studioTypes";
import type { AnchoredNotesProject } from "@/lib/anchoredNotesTypes";

export const dynamic = "force-dynamic";

const MAX_PROJECT_JSON_LENGTH = 200_000;

interface ExportRequestBody {
  accessToken: string;
  target: "docs" | "slides" | "anchoredNotesDoc" | "anchoredNotesSlides";
  project: TeacherStudioProject | AnchoredNotesProject;
  includeAnswerKey?: boolean;
}

const VALID_TARGETS = ["docs", "slides", "anchoredNotesDoc", "anchoredNotesSlides"];

export async function POST(request: NextRequest) {
  if (!isGoogleExportConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google export isn't set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (and NEXT_PUBLIC_SITE_URL in production) to your environment to enable it.",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Partial<ExportRequestBody>;
  const { accessToken, target, project } = body;
  if (!accessToken || !target || !VALID_TARGETS.includes(target) || !project) {
    return NextResponse.json({ error: "Missing export details." }, { status: 400 });
  }
  if (JSON.stringify(project).length > MAX_PROJECT_JSON_LENGTH) {
    return NextResponse.json({ error: "This project is too large to export right now." }, { status: 400 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  try {
    if (target === "anchoredNotesDoc") {
      const docs = google.docs({ version: "v1", auth });
      const created = await docs.documents.create({ requestBody: { title: project.title || "Untitled lesson" } });
      const documentId = created.data.documentId;
      if (!documentId) throw new Error("Docs API did not return a document id.");

      const { requests, tableJobs } = docBlocksToBatchRequests(buildAnchoredNotesDocBlocks(project as AnchoredNotesProject));
      if (requests.length > 0) {
        await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
      }
      if (tableJobs.length > 0) {
        try {
          const document = await docs.documents.get({ documentId });
          const fillRequests = buildTableFillRequests(document.data, tableJobs);
          if (fillRequests.length > 0) {
            await docs.documents.batchUpdate({ documentId, requestBody: { requests: fillRequests } });
          }
        } catch {
          // Best-effort: an empty table is still a usable doc if cell-filling fails.
        }
      }
      return NextResponse.json({ url: `https://docs.google.com/document/d/${documentId}/edit` });
    }

    if (target === "docs") {
      const docs = google.docs({ version: "v1", auth });
      const created = await docs.documents.create({ requestBody: { title: project.title || "Untitled lesson" } });
      const documentId = created.data.documentId;
      if (!documentId) throw new Error("Docs API did not return a document id.");

      const { requests } = docBlocksToBatchRequests(buildDocBlocks(project as TeacherStudioProject, body.includeAnswerKey ?? true));
      if (requests.length > 0) {
        await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
      }
      return NextResponse.json({ url: `https://docs.google.com/document/d/${documentId}/edit` });
    }

    if (target === "anchoredNotesSlides") {
      const slides = google.slides({ version: "v1", auth });
      const created = await slides.presentations.create({
        requestBody: { title: project.title || "Untitled lesson", pageSize: PAGE_SIZE },
      });
      const presentationId = created.data.presentationId;
      const defaultSlideId = created.data.slides?.[0]?.objectId;
      if (!presentationId) throw new Error("Slides API did not return a presentation id.");

      const { requests } = buildAnchoredNotesSlideRequests(project as AnchoredNotesProject);
      if (defaultSlideId) requests.push({ deleteObject: { objectId: defaultSlideId } });
      if (requests.length > 0) {
        await slides.presentations.batchUpdate({ presentationId, requestBody: { requests } });
      }
      return NextResponse.json({ url: `https://docs.google.com/presentation/d/${presentationId}/edit` });
    }

    const slides = google.slides({ version: "v1", auth });
    const created = await slides.presentations.create({
      requestBody: { title: project.title || "Untitled lesson", pageSize: PAGE_SIZE },
    });
    const presentationId = created.data.presentationId;
    const defaultSlideId = created.data.slides?.[0]?.objectId;
    if (!presentationId) throw new Error("Slides API did not return a presentation id.");

    const { requests, imageJobs, noteJobs } = buildCoreSlideRequests(project as TeacherStudioProject);
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
