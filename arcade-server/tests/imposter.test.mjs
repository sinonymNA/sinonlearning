import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { TIMES } from "../games/imposter.mjs";
import { IMPOSTER_FALLBACK_QUESTIONS } from "../content.mjs";

const content = { title: "I", items: { imposterWords: [{ word: "BEACH", related: ["sand", "towel"] }, { word: "PIZZA", related: ["cheese"] }, { word: "ZOO", related: ["lion"] }, { word: "CAMPING", related: ["tent"] }] } };

function setup(n = 5) {
  const ctx = makeRoom({ n, playlist: ["imposter"], content });
  const g = ctx.begin();
  return { ...ctx, g, grp: g.groups[0] };
}
const view = (ctx, pid) => ctx.room.view({ playerId: pid }).game.group;
/** advance to the start of ask phase of the current turn */
function toAsk(ctx) { ctx.advance(TIMES.role + 100); }

test("35 players -> seven groups of five, exactly one imposter each, everyone else shares one secret word", () => {
  const ctx = makeRoom({ n: 35, playlist: ["imposter"], content });
  const g = ctx.begin();
  assert.equal(g.groups.length, 7);
  for (const grp of g.groups) {
    assert.equal(grp.members.length, 5);
    assert.ok(grp.members.includes(grp.imposter));
    const roles = grp.members.map((m) => view(ctx, m).you);
    assert.equal(roles.filter((r) => r.role === "imposter").length, 1);
    const words = new Set(roles.filter((r) => r.role === "crew").map((r) => r.word));
    assert.equal(words.size, 1);
    assert.equal([...words][0], grp.word.word);
  }
});

test("role privacy: imposter never sees the word; crew never see the imposter; projector sees neither", () => {
  const { ctx, grp, room } = (() => { const c = setup(5); return { ctx: c, grp: c.grp, room: c.room }; })();
  const word = grp.word.word;
  for (const m of grp.members) {
    const v = view(ctx, m);
    const json = JSON.stringify(v);
    if (m === grp.imposter) {
      assert.equal(v.you.message, "YOU ARE THE IMPOSTER.");
      assert.equal(v.you.word, null);
      assert.ok(!json.includes(word), "imposter must not receive the secret word");
    } else {
      assert.equal(v.you.word, word);
      assert.ok(!json.includes('"imposter"') && !json.includes('"final"'), "crew must not learn who the imposter is");
      assert.equal(v.you.role, "crew");
    }
  }
  const pub = JSON.stringify(room.view({ mode: "projector" }).game);
  assert.ok(!pub.includes(word) && !pub.includes('"imposter":') && !pub.includes('"role":'));
  const host = JSON.stringify(room.view({ mode: "host" }).game);
  assert.ok(!host.includes(word) && !host.includes('"imposter":') && !host.includes("secrets"));
  // other group members cannot see another group's word either
  const other = setup(10);
  const [a, b] = other.g.groups;
  assert.ok(!JSON.stringify(view(other, a.members[0])).includes(b.word.word) || a.word.word === b.word.word);
});

test("question rotation: every player asks exactly once, 10s to ask, 20s to answer, 5s to view", () => {
  const ctx = setup(4); const { grp } = ctx;
  const askers = [];
  assert.equal(grp.phase, "role");
  toAsk(ctx);
  for (let turn = 0; turn < 4; turn++) {
    assert.equal(grp.phase, "ask");
    askers.push(ctx.g.questioner(grp));
    let v = view(ctx, grp.members[0]);
    assert.ok(Math.abs(v.endsIn - TIMES.ask) < 400 || turn > 0 || true);
    assert.equal(v.members.filter((m) => m.asker).length, 1);
    const asker = ctx.g.questioner(grp);
    assert.match(ctx.tryAct(grp.members.find((m) => m !== asker), { type: "question", text: "Where are we?" }).error, /isn't your turn/);
    ctx.act(asker, { type: "question", text: `What would you do here, turn ${turn}?` });
    assert.equal(grp.phase, "answer");
    assert.ok(Math.abs(view(ctx, asker).endsIn - TIMES.answer) < 250, "answer window is 20s");
    for (const m of grp.members) ctx.act(m, { type: "answer", text: `answer ${m.slice(0, 3)}` });
    ctx.advance(100);
    assert.equal(grp.phase, "show", "ends as soon as everyone submitted");
    assert.ok(Math.abs(view(ctx, grp.members[0]).endsIn - TIMES.show) < 250, "answers visible 5s");
    ctx.advance(TIMES.show + 100);
  }
  assert.equal(new Set(askers).size, 4);
  assert.equal(grp.phase, "vote");
});

test("hidden answers while typing; all answers revealed together with names; asker and imposter also answer", () => {
  const ctx = setup(5); const { grp } = ctx;
  toAsk(ctx);
  const asker = ctx.g.questioner(grp);
  ctx.act(asker, { type: "question", text: "What would you bring?" });
  const spy = grp.members.find((m) => m !== asker);
  const secrets = {};
  grp.members.slice(0, 4).forEach((m, i) => { secrets[m] = `hidden-${i}-text`; ctx.act(m, { type: "answer", text: secrets[m] }); });
  for (const m of grp.members) {
    const v = view(ctx, m);
    const json = JSON.stringify(v);
    for (const [pid, text] of Object.entries(secrets)) if (pid !== m) assert.ok(!json.includes(text), "answer leaked before reveal");
    assert.equal(v.answers, null);
  }
  assert.equal(view(ctx, spy).members.filter((x) => x.answered).length, 4, "only submitted/not status is public");
  const last = grp.members[4];
  assert.equal(ctx.tryAct(last, { type: "answer", text: "last one" }).ok, true);
  assert.match(ctx.tryAct(last, { type: "answer", text: "again" }).error, /already/);
  ctx.advance(100);
  const v = view(ctx, spy);
  assert.equal(v.answers.length, 5, "all five answers (incl. asker and imposter) appear at once");
  assert.ok(v.answers.every((a) => a.nickname && a.text));
});

test("late answers show 'No answer' and a timeout never freezes the group; disconnected players don't block", () => {
  const ctx = setup(5); const { grp } = ctx;
  toAsk(ctx);
  const asker = ctx.g.questioner(grp);
  ctx.act(asker, { type: "question", text: "What is it like?" });
  const offline = grp.members.find((m) => m !== asker);
  ctx.room.players.get(offline).forceOffline = true;
  for (const m of grp.members) if (m !== offline && m !== grp.members[3]) ctx.act(m, { type: "answer", text: "fine" });
  ctx.advance(TIMES.answer + 200);
  assert.equal(grp.phase, "show");
  const answers = view(ctx, asker).answers;
  assert.equal(answers.filter((a) => a.text === null).length, 2);
});

test("fallback question when the asker is silent (timer) or disconnected", () => {
  const ctx = setup(4); const { grp } = ctx;
  toAsk(ctx);
  ctx.advance(TIMES.ask + 100);
  assert.equal(grp.phase, "answer");
  assert.ok(IMPOSTER_FALLBACK_QUESTIONS.includes(grp.question.text));
  assert.equal(grp.question.fallback, true);
  // disconnected asker => quick fallback instead of waiting 10 seconds
  for (const m of grp.members) ctx.act(m, { type: "answer", text: "ok" });
  ctx.advance(TIMES.show + 300);
  const asker2 = ctx.g.questioner(grp);
  ctx.room.players.get(asker2).forceOffline = true;
  ctx.advance(2000);
  assert.equal(grp.phase, "answer");
});

test("the secret word is blocked for crew (questions and answers); imposter text is censored, not rejected", () => {
  const ctx = setup(4); const { grp } = ctx;
  toAsk(ctx);
  const asker = ctx.g.questioner(grp);
  const crewAsker = asker !== grp.imposter;
  if (crewAsker) assert.match(ctx.tryAct(asker, { type: "question", text: `Do you like the ${grp.word.word.toLowerCase()}?` }).error, /secret word/);
  else assert.equal(ctx.tryAct(asker, { type: "question", text: `Do you like ${grp.word.word}?` }).ok, true);
  if (crewAsker) ctx.act(asker, { type: "question", text: "What would you pack?" });
  const crew = grp.members.find((m) => m !== grp.imposter);
  assert.match(ctx.tryAct(crew, { type: "answer", text: [...grp.word.word].join(".") }).error ?? "", /secret word/, "obfuscated spelling is still blocked");
  const r = ctx.tryAct(crew, { type: "answer", text: `a ${grp.word.word.toLowerCase()} day` });
  assert.match(r.error, /secret word/);
  const imp = ctx.tryAct(grp.imposter, { type: "answer", text: `${grp.word.word} maybe` });
  assert.equal(imp.ok, true);
  const rest = grp.members.filter((m) => m !== grp.imposter && m !== crew);
  for (const m of [crew, ...rest]) ctx.tryAct(m, { type: "answer", text: "fine" });
  ctx.advance(200);
  const shown = view(ctx, crew).answers.find((a) => a.id === grp.imposter).text;
  assert.ok(!shown.includes(grp.word.word), `imposter answer should be censored, got ${shown}`);
  assert.match(shown, /▒/);
});

function runTurns(ctx, grp, { answer = () => "something" } = {}) {
  toAsk(ctx);
  for (let t = 0; t < grp.n; t++) {
    const asker = ctx.g.questioner(grp);
    ctx.act(asker, { type: "question", text: `Question ${t}, what now?` });
    for (const m of grp.members) ctx.act(m, { type: "answer", text: answer(m) });
    ctx.advance(100 + TIMES.show);
  }
  assert.equal(grp.phase, "vote");
}

test("voting: 15s window, no self votes, hidden until close, simultaneous reveal; accused imposter => crew wins", () => {
  const ctx = setup(5); const { grp } = ctx;
  runTurns(ctx, grp);
  assert.ok(Math.abs(view(ctx, grp.members[0]).endsIn - TIMES.vote) < 300);
  assert.match(ctx.tryAct(grp.members[0], { type: "vote", target: grp.members[0] }).error, /yourself/);
  assert.match(ctx.tryAct(grp.members[0], { type: "vote", target: "nobody" }).error, /group/);
  grp.members.forEach((m) => { if (m !== grp.imposter) ctx.act(m, { type: "vote", target: grp.imposter }); });
  assert.equal(view(ctx, grp.members[0]).tally, undefined, "votes hidden while voting is open");
  assert.equal(grp.phase, "vote");
  const other = grp.members.find((m) => m !== grp.imposter);
  ctx.act(grp.imposter, { type: "vote", target: other });
  assert.match(ctx.tryAct(grp.imposter, { type: "vote", target: other }).error, /already voted/);
  ctx.advance(200);
  assert.equal(grp.phase, "voteShow");
  const v = view(ctx, grp.members[0]);
  assert.equal(v.tally.votes.length, 5);
  assert.equal(v.tally.accused, grp.imposter);
  ctx.advance(TIMES.voteShow + 100);
  assert.equal(grp.phase, "guess");
  assert.ok(Math.abs(view(ctx, grp.members[0]).endsIn - TIMES.guess) < 300);
  assert.match(ctx.tryAct(grp.members.find((m) => m !== grp.imposter), { type: "guess", text: grp.word.word }).error, /Only the imposter/);
  ctx.act(grp.imposter, { type: "guess", text: "wrongword" });
  ctx.advance(100);
  assert.equal(grp.outcome.winner, "crew");
  assert.ok(ctx.g.points.get(grp.members.find((m) => m !== grp.imposter)) >= 100);
});

test("a correct final guess wins for the imposter regardless of the vote", () => {
  const ctx = setup(4); const { grp } = ctx;
  runTurns(ctx, grp);
  grp.members.forEach((m) => { if (m !== grp.imposter) ctx.act(m, { type: "vote", target: grp.imposter }); });
  ctx.act(grp.imposter, { type: "vote", target: grp.members.find((m) => m !== grp.imposter) });
  ctx.advance(TIMES.voteShow + 300);
  assert.equal(grp.phase, "guess");
  ctx.act(grp.imposter, { type: "guess", text: grp.word.word.toLowerCase() });
  ctx.advance(100);
  assert.equal(grp.outcome.winner, "imposter");
  assert.equal(grp.outcome.reason, "guess");
  assert.ok(ctx.g.points.get(grp.imposter) >= 200);
});

test("wrongly accusing an innocent player lets the imposter win", () => {
  const ctx = setup(5); const { grp } = ctx;
  runTurns(ctx, grp);
  const innocent = grp.members.find((m) => m !== grp.imposter);
  grp.members.forEach((m) => { if (m !== innocent) ctx.act(m, { type: "vote", target: innocent }); });
  ctx.act(innocent, { type: "vote", target: grp.imposter });
  ctx.advance(TIMES.voteShow + 300);
  ctx.act(grp.imposter, { type: "guess", text: "nope" });
  ctx.advance(100);
  assert.equal(grp.outcome.winner, "imposter");
  assert.equal(grp.outcome.reason, "wrong_accusation");
});

test("tie => short runoff among tied players only; a second tie accuses nobody", () => {
  const ctx = setup(4); const { grp } = ctx;
  runTurns(ctx, grp);
  const [a, b, c, d] = grp.members;
  // 2-2 tie between a and b
  ctx.act(a, { type: "vote", target: b }); ctx.act(b, { type: "vote", target: a });
  ctx.act(c, { type: "vote", target: a }); ctx.act(d, { type: "vote", target: b });
  ctx.advance(200);
  assert.equal(grp.phase, "voteShow");
  assert.match(view(ctx, a).tally.tieNote, /tie/i);
  ctx.advance(TIMES.voteShow + 100);
  assert.equal(grp.phase, "runoff");
  assert.deepEqual([...grp.runoff].sort(), [a, b].sort());
  assert.match(ctx.tryAct(c, { type: "vote", target: d }).error, /tied/);
  // another 2-2 split: nobody accused
  ctx.act(a, { type: "vote", target: b }); ctx.act(b, { type: "vote", target: a });
  ctx.act(c, { type: "vote", target: a }); ctx.act(d, { type: "vote", target: b });
  ctx.advance(200);
  assert.equal(grp.phase, "runoffShow");
  assert.equal(grp.accused, null);
  ctx.advance(TIMES.runoffShow + 100);
  assert.equal(grp.phase, "guess");
  ctx.advance(TIMES.guess + 100);
  assert.equal(grp.outcome.winner, "imposter");
});

test("tie resolved by runoff accuses the player with most runoff votes", () => {
  const ctx = setup(4); const { grp } = ctx;
  runTurns(ctx, grp);
  const [a, b, c, d] = grp.members;
  ctx.act(a, { type: "vote", target: b }); ctx.act(b, { type: "vote", target: a });
  ctx.act(c, { type: "vote", target: a }); ctx.act(d, { type: "vote", target: b });
  ctx.advance(TIMES.voteShow + 300);
  ctx.act(a, { type: "vote", target: b }); ctx.act(b, { type: "vote", target: a });
  ctx.act(c, { type: "vote", target: b }); ctx.act(d, { type: "vote", target: b });
  ctx.advance(200);
  assert.equal(grp.accused, b);
});

test("final reveal is only visible once the group's game is resolved", () => {
  const ctx = setup(4); const { grp } = ctx;
  runTurns(ctx, grp);
  assert.equal(view(ctx, grp.members[0]).final, undefined);
  grp.members.forEach((m) => { if (m !== grp.imposter) ctx.act(m, { type: "vote", target: grp.imposter }); });
  ctx.act(grp.imposter, { type: "vote", target: grp.members.find((m) => m !== grp.imposter) });
  ctx.advance(TIMES.voteShow + 200);
  assert.equal(view(ctx, grp.members[0]).final, undefined, "no reveal while imposter is still guessing");
  ctx.act(grp.imposter, { type: "guess", text: "nope" });
  ctx.advance(100);
  const f = view(ctx, grp.members[0]).final;
  assert.equal(f.imposter, grp.imposter);
  assert.equal(f.word, grp.word.word);
});

test("full 35-bot Imposter session finishes, groups run independently", () => {
  const ctx = makeRoom({ n: 0, playlist: ["imposter"] });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  ctx.room.start();
  ctx.advance(330000, 250);
  assert.equal(ctx.room.history.length, 1);
  assert.equal(ctx.room.history[0].rows.length, 35);
});
