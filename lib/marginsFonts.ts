import { Patrick_Hand } from "next/font/google";

// Shared handwriting font instance for Margins' "reader's pen" accent —
// circled rubric scores in GradingReport, hand-circled dates in
// HistoryTimeline, ink annotations on EvidenceExhibitCard. One next/font
// instance reused everywhere it's needed, rather than a separate call per
// component (next/font dedupes at the call-site level, not globally).
export const handwriting = Patrick_Hand({ subsets: ["latin"], weight: "400" });
