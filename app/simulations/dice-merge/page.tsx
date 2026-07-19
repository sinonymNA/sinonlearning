import type { Metadata } from "next";
import DiceMergeGame from "@/components/games/dice-merge/DiceMergeGame";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DICE//MERGE - Sinon Learning",
  description: "A fast, replayable dice-merging strategy game with cascades, tools, and level goals.",
  alternates: { canonical: `${SITE_URL}/simulations/dice-merge` },
};

export default function DiceMergePage() {
  return <DiceMergeGame />;
}

