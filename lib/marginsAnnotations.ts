export interface EssayAnnotation {
  quote: string;
  category: string;
  comment: string;
}

export interface AnnotatedRun {
  text: string;
  annotation: EssayAnnotation | null;
}

// Resolves each annotation to a position in the essay by finding its quote as an
// exact, in-order substring match. Annotations whose quote does not literally
// appear (a hallucinated/paraphrased quote) are silently dropped rather than
// mis-rendered — this is the reliability mechanism for the whole highlighting
// feature, since LLMs cannot be trusted to return exact character offsets.
export function buildAnnotatedRuns(essayText: string, annotations: EssayAnnotation[]): AnnotatedRun[] {
  let searchFrom = 0;
  const ranges: { start: number; end: number; annotation: EssayAnnotation }[] = [];

  for (const a of annotations) {
    if (!a.quote) continue;
    const idx = essayText.indexOf(a.quote, searchFrom);
    if (idx === -1) continue;
    ranges.push({ start: idx, end: idx + a.quote.length, annotation: a });
    searchFrom = idx + a.quote.length;
  }

  const runs: AnnotatedRun[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) runs.push({ text: essayText.slice(cursor, r.start), annotation: null });
    runs.push({ text: essayText.slice(r.start, r.end), annotation: r.annotation });
    cursor = r.end;
  }
  if (cursor < essayText.length) runs.push({ text: essayText.slice(cursor), annotation: null });
  return runs;
}
