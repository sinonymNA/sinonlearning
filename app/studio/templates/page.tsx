import type { Metadata } from "next";
import TemplateLibrary from "@/components/studio/TemplateLibrary";

export const metadata: Metadata = {
  title: "Template Library — Teacher Studio — Sinon Learning",
  description: "36 ready-made starting points for slides, worksheets, activities, and assessments.",
};

export default function StudioTemplatesPage() {
  return <TemplateLibrary />;
}
