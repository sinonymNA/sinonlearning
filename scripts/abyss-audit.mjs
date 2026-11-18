// Audits the Abyss prompt bank: ids, all six tiers present, no repeats inside a tier, no answer in two tiers, rules hold.
// Run: npm run abyss:audit
import * as AB from "../arcade-server/abyss.mjs";
const issues = [], ids = new Set();
for (const p of AB.PROMPTS) {
  if (ids.has(p.id)) issues.push(`duplicate id ${p.id}`); ids.add(p.id);
  const all = new Map();
  for (const t of AB.TIER_ORDER) {
    if (!p.tiers[t]?.length) issues.push(`${p.id}: no ${t} answers`);
    const seen = new Set();
    for (const e of p.tiers[t] ?? []) {
      const forms = e.split("=").map((x) => x.trim());
      const name = AB.norm(forms[0]);
      if (!name) issues.push(`${p.id}/${t}: empty answer`);
      if (seen.has(name)) issues.push(`${p.id}/${t}: repeats "${forms[0]}"`); seen.add(name);
      for (const f of forms) { const k = AB.norm(f); if (all.has(k) && all.get(k) !== t) issues.push(`${p.id}: "${f}" is in ${all.get(k)} and ${t}`); if (!all.has(k)) all.set(k, t); }
      if (p.rule) for (const f of forms) { const n = AB.norm(f).replace(/ /g, ""); if (p.rule.startsWith && !n.startsWith(p.rule.startsWith)) issues.push(`${p.id}: "${f}" must start with ${p.rule.startsWith}`); if (p.rule.endsWith && !n.endsWith(p.rule.endsWith)) issues.push(`${p.id}: "${f}" must end with ${p.rule.endsWith}`); }
    }
  }
}
const answers = AB.PROMPTS.reduce((n, p) => n + AB.TIER_ORDER.reduce((m, t) => m + p.tiers[t].length, 0), 0);
console.log(`${AB.PROMPTS.length} prompts, ${answers} answers, ${new Set(AB.PROMPTS.map((p) => p.cat)).size} categories, ${issues.length} issues`);
if (issues.length) { console.log(issues.join("\n")); process.exit(1); }
