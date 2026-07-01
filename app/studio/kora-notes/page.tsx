import type { Metadata } from "next";
import KoraNotesGenerator from "@/components/studio/KoraNotesGenerator";

export const metadata: Metadata = {
  title: "Notes from Slideshow — Teacher Studio",
};

export default function KoraNotesPage() {
  return (
    <div className="min-h-screen bg-cream-50 px-4 py-10 sm:px-6">
      <KoraNotesGenerator />
    </div>
  );
}
