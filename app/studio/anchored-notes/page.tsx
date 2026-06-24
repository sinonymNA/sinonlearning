"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBlankAnchoredProject } from "@/lib/anchoredNotesDefaults";
import { saveAnchoredProject } from "@/lib/anchoredNotesStorage";
import {
  SAMPLE_LESSON_CONTENT,
  SAMPLE_LESSON_COURSE,
  SAMPLE_LESSON_GRADE,
  SAMPLE_LESSON_NUMBER,
  SAMPLE_LESSON_TITLE,
  SAMPLE_LESSON_UNIT,
} from "@/lib/anchoredNotesSample";

function NewAnchoredNotesRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const sample = params.get("sample") === "1";
    const project = createBlankAnchoredProject(
      sample
        ? {
            title: SAMPLE_LESSON_TITLE,
            course: SAMPLE_LESSON_COURSE,
            lessonNumber: SAMPLE_LESSON_NUMBER,
            unit: SAMPLE_LESSON_UNIT,
            gradeLevel: SAMPLE_LESSON_GRADE,
            rawContent: SAMPLE_LESSON_CONTENT,
          }
        : {}
    );
    saveAnchoredProject(project);
    router.replace(`/studio/anchored-notes/${project.id}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-navy-700/60">Setting up your Anchored Notes…</p>
    </div>
  );
}

export default function NewAnchoredNotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-navy-700/60">Setting up your Anchored Notes…</p>
        </div>
      }
    >
      <NewAnchoredNotesRedirect />
    </Suspense>
  );
}
