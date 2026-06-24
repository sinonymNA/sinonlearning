import type { Metadata } from "next";
import StudioLanding from "@/components/studio/StudioLanding";

export const metadata: Metadata = {
  title: "Teacher Studio — Sinon Learning",
  description: "Build slides, worksheets, and activities — free, local, and yours to edit.",
};

export default function StudioPage() {
  return <StudioLanding />;
}
