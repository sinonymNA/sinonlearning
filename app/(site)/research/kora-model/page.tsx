import type { Metadata } from "next";
import KoraModelPage from "@/components/kora/KoraModelPage";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "KORA — Teacher-Centered Intelligence | Sinon Learning",
  description:
    "KORA is Sinon's teacher-centered AI system: powered by Claude, structured around instructional intent, and designed to keep educators in control.",
  alternates: { canonical: `${SITE_URL}/research/kora-model` },
};

export default function Page() {
  return <KoraModelPage />;
}
