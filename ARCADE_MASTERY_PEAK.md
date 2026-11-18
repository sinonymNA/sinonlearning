# Mastery Peak: brainstorm + build plan

Goal: a remediation mode where students keep relearning what they get wrong until they have reached "the peak" for a teacher's content set.

## Straight talk first
- **No game can prove a student "fully understood everything."** What it can do is collect evidence per concept. So "Peak" has to be defined by evidence, not by finishing a level. Proposed rule: a concept is **Secured** when the student answers 3 *different* questions about it correctly in a row (not the same question again), **and** passes one spaced re-check later (same session after other concepts = "Camp", next day = "Summit stamp").
- Memorising the answer to one question is the main way a mastery game gets gamed. That is why the rule is about *variants of a concept*, not repeats of one item.
- Coins per correct answer would teach kids to farm. Reward the **peak** (exclusive character + badge), not each question.

## The mountain
- Each concept in the set is a **camp** on a mountain trail. Concept labels come from the AI set builder (`concept` on each question, already saved; plus `explain`).
- Climb a camp by answering its questions. States per concept: Unseen -> Climbing -> Wobbly (missed recently) -> Secured -> Summit-stamped (passed the spaced re-check).
- **Slip** (wrong answer): the game shows the explanation (teacher-written or AI), then asks a *different* question on the same concept straight away ("catch yourself"), and re-queues the original later (spacing).
- **Falling**: a Secured camp that fails its re-check drops back to Wobbly. The summit only counts when every camp is Summit-stamped. That is the in-theory "fully understood" signal, and the teacher dashboard shows the exact evidence behind it.
- Scheduling: simple Leitner boxes (1 / 3 / 7 session-gaps) with interleaving across concepts. No black-box model needed for v1; can upgrade to Bayesian knowledge tracing later.

## Where AI is actually needed
1. **Tagging + explanations** when the teacher builds a set (done in the AI set builder).
2. **Question variants**: for every question, generate 3-4 sibling questions testing the same concept in a different form (different numbers, worded differently, a scenario instead of recall). Generated **ahead of time and cached on the set**, reviewed by the teacher, not called live per student (cost, latency, safety).
3. **Misconception hints**: when a student picks a specific wrong choice, a one-line "you might be thinking..." (generated with the variants, so also pre-computed).
4. Later: short free-response checks graded by AI. Higher risk, so only after v1.

## Modes
- **Solo Peak** (first build): any student with an arcade account picks a teacher's set (by room code or class code) and climbs at their own pace.
- **Class Expedition** (later): the teacher sees a heat map (concept x students) and the weakest concepts; hot-potato / Last One Standing can pull their questions from "Wobbly" concepts so remediation happens inside normal class games.
- Peak reward: exclusive character per set + a printable "summit" record for the teacher.

## Privacy
Progress is stored against the existing username/password account id only (no names). Guests can try 1 camp but progress isn't saved.

## Build phases
1. Data: `mastery` table (account, set, concept, box, streak, lastSeen) + store methods + tests. 
2. AI: variant generator (`ai_variants` content action, cached on the set, teacher review UI).
3. Engine: scheduler (`arcade-server/mastery.mjs`, pure, unit-tested) + `/api/arcade/mastery`.
4. UI: mountain map, slip/explain flow, Summit screen.
5. Teacher heat map + "pull from Wobbly" for class games.

## Status: v1 built (solo Peak + teacher report + AI variants)
- Engine `arcade-server/mastery.mjs` (pure, tested): camps, secured = 3 *different* correct in a row, spaced re-check (gap = up to 3 other answers), fall-back on a failed re-check, catch-up question after a slip, summit when all camps are stamped.
- API `handleMastery` (`/api/arcade/mastery`): start / next / answer / reset / report. Sign-in required (progress saved per account). The correct answer and the shuffle live only in the saved server state until the student answers. Per-student lock stops double-submits. One-time 100-coin summit reward per set.
- Persistence: `store.getMastery/saveMastery/listMastery` (MemoryStore + Postgres table `arcade_mastery`).
- AI: `ai_variants` content action + `generateVariants` (teacher-only, pre-generated and saved on the set as `variants`; rate-limited with the set builder).
- UI: `/arcade/peak` (`?set=<id>`; `builtin` = starter set), mountain map, explain-and-catch-up flow, summit screen, teacher class report; content manager shows the share link + variants button.
- Honest limits: unlabelled sets get generic "Camp N" groups; teachers should use the AI builder (labels concepts). Variants are AI-written and only sanity-checked (shape/moderation), so teachers should skim them. "Secured + re-checked" is evidence, not proof of understanding. Not built: free-response checks, per-wrong-answer misconception hints, class-game integration ("pull from wobbly"), spaced re-checks across days.
- Not run against the live AI model here (no key in this environment).
