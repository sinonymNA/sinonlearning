import { getReferenceExamplesForTask } from "./koraLabDb";

// Turns admin-curated KORA Lab winners into a few-shot reference block that
// production generate() calls append to their own prompt. Both production and
// the Lab call the same generate() functions, so this stays consistent with
// the rest of the registry's zero-drift guarantee — whatever gets appended
// here is exactly what both surfaces send to Claude.

const MAX_REFERENCE_EXAMPLES = 3;
const MAX_OUTPUT_CHARS = 2000;

export async function buildReferenceExamplesBlock(taskType: string): Promise<string> {
  // Reference examples only sharpen the prompt — they are never required for a
  // correct generation. If the Lab DB is unreachable or the table isn't there
  // yet, fall back to an empty block rather than failing the teacher's request:
  // a slightly less calibrated worksheet beats a 502.
  let examples: Awaited<ReturnType<typeof getReferenceExamplesForTask>>;
  try {
    examples = await getReferenceExamplesForTask(taskType, MAX_REFERENCE_EXAMPLES);
  } catch (err) {
    console.warn(`[koraLabReference] Reference examples unavailable for "${taskType}"; continuing without them.`, err);
    return "";
  }
  if (examples.length === 0) return "";

  const parts = examples.map((ex, i) => {
    const winningOutput = ex.winner === "a" ? ex.candidate_a : ex.candidate_b;
    const json = JSON.stringify(winningOutput);
    const truncated = json.length > MAX_OUTPUT_CHARS ? `${json.slice(0, MAX_OUTPUT_CHARS)}…` : json;
    const why = ex.reason ? ` A teacher rated this one highly because: ${ex.reason}` : "";
    return `Reference example ${i + 1}:${why}\n${truncated}`;
  });

  return (
    "\n\nBelow are reference examples of output a teacher has previously rated as high-quality for this exact " +
    "task. Use them only to calibrate tone, structure, and quality bar — never copy their specific content into " +
    "this new, unrelated request; always generate fresh, original content tailored to the current input.\n\n" +
    parts.join("\n\n")
  );
}
