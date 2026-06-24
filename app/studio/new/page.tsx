"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBlankProject } from "@/lib/studioDefaults";
import { getStudioTemplateById, instantiateTemplate } from "@/lib/studioTemplates";
import { saveProject } from "@/lib/studioStorage";
import type { StudioDocType } from "@/lib/studioTypes";

function NewProjectRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const mode = params.get("mode");

    if (mode === "template") {
      const templateId = params.get("templateId") ?? "";
      const template = getStudioTemplateById(templateId);
      if (!template) {
        router.replace("/studio/templates");
        return;
      }
      const project = instantiateTemplate(template, {
        topic: params.get("topic") ?? "",
        subject: params.get("subject") ?? "",
        gradeLevel: params.get("gradeLevel") ?? "",
      });
      saveProject(project);
      router.replace(`/studio/${project.id}`);
      return;
    }

    const type = (params.get("type") as StudioDocType) || "lesson";
    const project = createBlankProject(type);
    saveProject(project);
    router.replace(`/studio/${project.id}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-navy-700/60">Setting up your project…</p>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-navy-700/60">Setting up your project…</p>
        </div>
      }
    >
      <NewProjectRedirect />
    </Suspense>
  );
}
