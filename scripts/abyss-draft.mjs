// Drafts NEW Abyss prompts with the model so a human can review them before they go in the bank.
//   ANTHROPIC_API_KEY=... node scripts/abyss-draft.mjs "Name a type of knot" "Name a famous bridge" > drafts.json
// Output is JSON in the same shape as arcade-server/data/abyssPrompts*.mjs. NOTHING is added to the bank automatically:
// review every answer and tier, paste the good ones into a prompts file, then run `npm run abyss:audit` and `npm run arcade:test`.
// (Not run in the build environment: needs a key. Treat model output as a draft, never as truth.)
import Anthropic from "@anthropic-ai/sdk";
const topics = process.argv.slice(2);
if (!topics.length) { console.error('Usage: node scripts/abyss-draft.mjs "Name a ..." ["Name a ..."]'); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY is not set."); process.exit(1); }
const client = new Anthropic();
const SYSTEM = `You write prompts for a rarity-scored trivia game. For each open question give MANY correct answers (60-120) split into six tiers by how likely a typical player is to think of them:
bubble (the 5-8 most obvious), clever (3-5 'I'll be clever' answers many others also try), shoal (15-30 ordinary-knowledge answers), reef (20-40 noticeably less familiar), trench (15-30 specialist), pearl (5-15 standout deep cuts).
Every answer must be genuinely correct for the question (no invented items). Aliases use "name=alias". Answers are lowercase. Return ONLY JSON: [{"id":"kebab-id","cat":"Category","prompt":"Name ...","tiers":{"bubble":"a|b","clever":"...","shoal":"...","reef":"...","trench":"...","pearl":"..."}}]`;
const out = [];
for (const topic of topics) {
  const msg = await client.messages.create({ model: "claude-sonnet-4-6", max_tokens: 8000, system: SYSTEM, messages: [{ role: "user", content: `Question: ${topic}` }] });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim().replace(/^```json\s*|```$/g, "");
  try { out.push(...JSON.parse(text)); } catch { console.error(`Could not parse the model's answer for "${topic}"`); }
}
console.log(JSON.stringify(out, null, 2));
