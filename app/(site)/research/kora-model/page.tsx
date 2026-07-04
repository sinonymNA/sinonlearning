import type { Metadata } from "next";
import KoraModelPage from "@/components/kora/KoraModelPage";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "KORA — Sinon Learning",
  description:
    "KORA is the first AI model purpose-built for teachers — not to replace them, but to remove everything that gets in the way of teaching.",
  alternates: { canonical: `${SITE_URL}/research/kora-model` },
};

export default function Page() {
  return <KoraModelPage />;
}
