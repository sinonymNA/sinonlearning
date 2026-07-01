import type { Metadata } from "next";
import KoraGameSetup from "@/components/game/KoraGameSetup";

export const metadata: Metadata = {
  title: "KORA Game — Teacher Studio",
};

export default function KoraGamePage() {
  return (
    <div className="min-h-screen bg-cream-50 px-4 py-10 sm:px-6">
      <KoraGameSetup />
    </div>
  );
}
