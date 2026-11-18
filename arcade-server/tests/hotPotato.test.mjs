import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { sequenceBank, countMatches, wordsContaining, isWord } from "../dictionary.mjs";
import { HotPotato } from "../games/hotPotato.mjs";

// existing tests type words; the new challenge tests below switch kinds explicitly
HotPotato.forceKind = "letters";

const freshWord = (g, grp) => wordsContaining(grp.sequence).find((w) => !grp.used.has(w));

test("sequence bank only contains prompts with many valid answers", () => {
  const bank = sequenceBank();
  for (const [level, list] of Object.entries(bank)) {
    assert.ok(list.length > 5, level);
    for (const s of list) assert.ok(countMatches(s) >= 60, `${s} has too few answers`);
  }
});

test("35 players are split into groups of 4-7 and exactly one holds each potato", () => {
  const { room, begin } = makeRoom({ n: 35 });
  const g = begin();
  assert.equal(g.groups.length, 5);
  for (const grp of g.groups) { assert.ok(grp.members.length >= 5 && grp.members.length <= 7); assert.ok(grp.members.includes(grp.holder)); assert.equal(grp.hearts.size, grp.members.length); for (const h of grp.hearts.values()) assert.equal(h, 3); }
  void room;
});

test("dictionary validation: rejects fake words, wrong letters, repeats and non-holders; accepts real words", () => {
  const { room, players, begin, tryAct } = makeRoom({ n: 6 });
  const g = begin();
  const grp = g.groups[0];
  const holder = grp.holder;
  const other = grp.members.find((m) => m !== holder);
  assert.match(tryAct(holder, { type: "word", word: grp.sequence.toLowerCase() + "xq" }).error, /dictionary/);
  assert.match(tryAct(holder, { type: "word", word: "banana" + (grp.sequence === "AN" ? "" : "") + "zzq" }).error, /letters|dictionary/);
  assert.match(tryAct(holder, { type: "word", word: "a" }).error, /short/);
  assert.match(tryAct(other, { type: "word", word: freshWord(g, grp) }).error, /not holding/);
  const word = freshWord(g, grp);
  const seq = grp.sequence;
  const r = tryAct(holder, { type: "word", word });
  assert.ok(r.ok, r.error);
  assert.ok(isWord(word) && word.includes(seq.toLowerCase()));
  assert.ok(g.points.get(holder) >= 10);
  // duplicates: the same word cannot be reused later by anyone
  assert.ok(grp.used.has(word));
  grp.sequence = word.slice(0, 2).toUpperCase();
  grp.holder = holder; // force same player to try again with a repeated word
  assert.match(tryAct(holder, { type: "word", word }).error, /already used/);
  void room; void players;
});

test("double-submit of the same turn is rejected (stale turn token)", () => {
  const { begin, tryAct } = makeRoom({ n: 6 });
  const g = begin();
  const grp = g.groups[0];
  const holder = grp.holder, turn = grp.turn, word = freshWord(g, grp);
  assert.ok(tryAct(holder, { type: "word", word, turn }).ok);
  const second = tryAct(holder, { type: "word", word: freshWord(g, grp), turn });
  assert.equal(second.ok, false);
});

test("transfers are random, never to self, and avoid the previous holder when others are eligible", () => {
  const { begin, tryAct, room } = makeRoom({ n: 5 });
  const g = begin();
  const grp = g.groups[0];
  const received = new Map();
  let prevHolder = null;
  for (let i = 0; i < 300; i++) {
    grp.fuseAt = room.t() + 1e9; // keep the fuse out of the way
    const holder = grp.holder;
    const word = wordsContaining(grp.sequence).find((w) => !grp.used.has(w));
    assert.ok(tryAct(holder, { type: "word", word, turn: grp.turn }).ok);
    assert.notEqual(grp.holder, holder, "potato must move");
    if (prevHolder) assert.notEqual(grp.holder, prevHolder, "must not pass straight back");
    received.set(grp.holder, (received.get(grp.holder) ?? 0) + 1);
    prevHolder = holder;
  }
  assert.equal(received.size, 5, "every player should eventually receive the potato");
  for (const n of received.values()) assert.ok(n > 20, "distribution should be roughly even");
});

test("hidden fuse: expiry time never appears in any view; heat is coarse", () => {
  const { begin, room, players } = makeRoom({ n: 6 });
  const g = begin();
  const grp = g.groups[0];
  const json = JSON.stringify(room.view({ playerId: grp.members[0] }));
  assert.ok(!json.includes(String(grp.fuseAt)) && !/fuse|expires/i.test(json));
  assert.ok([0, 1, 2, 3].includes(room.view({ playerId: grp.members[0] }).game.group.heat));
  void players;
});

test("potato explodes server-side: holder loses a heart, eliminated players become ghosts who can assist", () => {
  const { begin, room, advance, tryAct } = makeRoom({ n: 4 });
  const g = begin();
  const grp = g.groups[0];
  const victim = grp.holder;
  grp.hearts.set(victim, 1);
  grp.fuseAt = room.t() + 500;
  advance(700);
  assert.equal(grp.status, "boom");
  assert.equal(grp.hearts.get(victim), 0);
  const late = tryAct(victim, { type: "word", word: "station" });
  assert.equal(late.ok, false);
  advance(4700);
  assert.equal(grp.status, "live");
  assert.ok(!g.alive(grp).includes(victim));
  assert.notEqual(grp.holder, victim);
  // ghost participation: valid words buy a little time and earn points
  const before = grp.bonusMs;
  const word = wordsContaining(grp.sequence).find((w) => !grp.used.has(w));
  const r = tryAct(victim, { type: "word", word });
  assert.ok(r.ok, r.error);
  assert.ok(grp.bonusMs > before);
  assert.equal(grp.holder === victim, false, "ghosts never receive the potato");
  assert.ok(g.points.get(victim) >= 4);
});

test("a late word after expiry is rejected and triggers the explosion", () => {
  const { begin, room, tryAct, clock } = makeRoom({ n: 4 });
  const g = begin();
  const grp = g.groups[0];
  const holder = grp.holder;
  const word = freshWord(g, grp);
  clock.now += (grp.fuseAt - room.t()) + 10;
  const r = tryAct(holder, { type: "word", word });
  assert.equal(r.ok, false);
  assert.match(r.error, /exploded|late/i);
  assert.equal(grp.hearts.get(holder), 2);
});

test("a disconnected holder does not freeze the group", () => {
  const { begin, room, advance } = makeRoom({ n: 5 });
  const g = begin();
  const grp = g.groups[0];
  const stuck = grp.holder;
  room.players.get(stuck).forceOffline = true;
  grp.fuseAt = room.t() + 1e9;
  advance(3000);
  assert.notEqual(grp.holder, stuck);
});

test("teacher vocabulary: class words are accepted even if not in the dictionary and earn a bonus", () => {
  const content = { title: "Bio", items: { vocab: ["mitochondria", "xylemzz", "ribosome"] } };
  const { begin, room, tryAct } = makeRoom({ n: 4, content });
  const g = begin();
  const grp = g.groups[0];
  grp.sequence = "ZZ";
  const holder = grp.holder;
  const r = tryAct(holder, { type: "word", word: "xylemzz" });
  assert.ok(r.ok, r.error);
  assert.equal(r.result.vocab, true);
  void room;
});

test("a full 35-bot game finishes: hearts drop, survivors are awarded, results are produced", () => {
  const { room, svc, advance } = makeRoom({ n: 0 });
  svc.addBots(room, 35, "mixed");
  room.start();
  advance(240000, 250);
  assert.equal(room.history.length, 1);
  const res = room.history[0];
  assert.equal(res.rows.length, 35);
  assert.ok(res.rows[0].points > 0);
  assert.equal(res.rows[0].norm, 1000);
  assert.ok(res.rows.some((r) => r.points >= 25), "someone should have scored");
});

test("live typing: spectators see the holder's draft (moderated); only the holder can draft; draft clears on pass", () => {
  const { begin, room, tryAct } = makeRoom({ n: 5 });
  const g = begin(); const grp = g.groups[0];
  const other = grp.members.find((m) => m !== grp.holder);
  tryAct(other, { type: "draft", text: "sneaky" });
  assert.equal(room.view({ playerId: other }).game.group.draft, "");
  tryAct(grp.holder, { type: "draft", text: "Sta-t!!1" });
  assert.equal(room.view({ playerId: other }).game.group.draft, "sta-t");
  tryAct(grp.holder, { type: "draft", text: "shit" });
  assert.equal(room.view({ playerId: other }).game.group.draft, "•••");
  grp.fuseAt = room.t() + 1e9;
  const w = wordsContaining(grp.sequence).find((x) => !grp.used.has(x));
  assert.ok(tryAct(grp.holder, { type: "word", word: w }).ok);
  assert.equal(room.view({ playerId: other }).game.group.draft, "");
});

test("boom guess: spectators score by how close they tap to the real explosion; once per round; holder can't", () => {
  const { begin, room, tryAct, clock, advance } = makeRoom({ n: 5 });
  const g = begin(); const grp = g.groups[0];
  const [a, b, c] = grp.members.filter((m) => m !== grp.holder);
  assert.match(tryAct(grp.holder, { type: "boom" }).error, /holding/);
  grp.fuseAt = room.t() + 6000;
  clock.now += 5400; assert.ok(tryAct(a, { type: "boom" }).ok);   // 0.6s early => 15
  assert.match(tryAct(a, { type: "boom" }).error, /already/);
  grp.boomGuesses.set(b, grp.fuseAt - 2000);                      // 2.0s early => 8
  grp.boomGuesses.set(c, grp.fuseAt - 9000);                      // far too early => 0
  advance(900);
  assert.equal(grp.status, "boom");
  assert.equal(g.points.get(a) >= 15, true);
  const res = room.view({ playerId: a }).game.group.boomResults;
  assert.deepEqual(res.map((r) => r.pts), [15, 8]);
  assert.ok(!res.some((r) => r.id === c));
  assert.ok(g.awards().some((x) => x.id === "boom"));
});

test("quick-pass bonus and end-of-game awards are produced", () => {
  const { begin, room, tryAct } = makeRoom({ n: 4 });
  const g = begin(); const grp = g.groups[0];
  grp.fuseAt = room.t() + 1e9;
  const holder = grp.holder;
  const w = wordsContaining(grp.sequence).find((x) => !grp.used.has(x) && x.length >= 7) ?? wordsContaining(grp.sequence)[0];
  const r = tryAct(holder, { type: "word", word: w });
  assert.equal(r.result.quick, true);
  const awards = g.awards();
  assert.ok(awards.find((a) => a.id === "wordsmith" && a.pid === holder));
  g.done = true; room.tick();
  assert.ok(room.history.at(-1).awards.length >= 1);
  assert.ok(room.history.at(-1).awards[0].nickname);
});

test("hot hands: nobody can sit on the potato - after 12 s it jumps to someone else, the holder loses points and the fuse shrinks", () => {
  const { begin, room, advance } = makeRoom({ n: 5 });
  const g = begin(); const grp = g.groups[0];
  const first = grp.holder;
  grp.surpriseAt = 0;
  grp.fuseAt = room.t() + 60000;                       // plenty of fuse so only the hold limit matters
  g.points.set(first, 20);
  const fuseBefore = grp.fuseAt;
  advance(11000);
  assert.equal(grp.holder, first, "still theirs inside the limit");
  assert.ok(room.view({ playerId: first }).game.group.holdIn > 0);
  advance(1500);
  assert.notEqual(grp.holder, first, "potato jumped");
  assert.equal(grp.lastPass.stalled, true);
  assert.equal(grp.lastPass.from, first);
  assert.equal(grp.lastPass.to, grp.holder);
  assert.equal(g.points.get(first), 15, "5 point penalty");
  assert.ok(grp.fuseAt < fuseBefore, "fuse got shorter");
  assert.notEqual(grp.prev, grp.holder);
  // the new holder gets a fresh hold clock
  assert.ok(room.view({ playerId: grp.holder }).game.group.holdIn > 10000);
  // a pass inside the window resets the clock and avoids the penalty
  const ok = wordsContaining(grp.sequence).find((w) => !grp.used.has(w));
  const holder = grp.holder; advance(3000);
  assert.ok(room.act(holder, { type: "word", word: ok }).ok);
  assert.equal(g.stats.stalls, 1);
});

const withKind = (kind, fn) => { const old = HotPotato.forceKind; HotPotato.forceKind = kind; try { return fn(); } finally { HotPotato.forceKind = old; } };

test("brain pass: holder must answer a class question; wrong answers cost fuse + points; the answer never leaks", () => {
  withKind("quiz", () => {
    const { begin, act, tryAct, view, players, room } = makeRoom({ n: 5 });
    const g = begin(); const grp = g.groups[0];
    assert.equal(grp.challenge.kind, "quiz");
    const holder = grp.holder;
    const v = view(holder).game.group;
    assert.equal(v.challenge.kind, "quiz");
    assert.ok(v.challenge.choices.length >= 3);
    for (const m of players) assert.ok(!JSON.stringify(view(m).game).includes('"answer"'), "answer index must never be in a view");
    assert.match(tryAct(holder, { type: "word", word: "banana" }).error, /Brain Pass/);
    const other = players.find((p) => p.id !== holder);
    assert.match(tryAct(other, { type: "answer", index: 0 }).error, /not holding/);
    const wrong = grp.challenge.choices.findIndex((_, i) => i !== grp.challenge.answer);
    const fuse = grp.fuseAt, pts = g.points.get(holder);
    const r = tryAct(holder, { type: "answer", index: wrong });
    assert.equal(r.code, "wrong");
    assert.ok(grp.fuseAt < fuse); assert.ok(g.points.get(holder) <= pts);
    assert.match(tryAct(holder, { type: "answer", index: wrong }).error, /already tried/);
    const turn = grp.turn;
    const ok = tryAct(holder, { type: "answer", index: grp.challenge.answer, turn });
    assert.equal(ok.ok, true); assert.ok(ok.result.brain);
    assert.notEqual(grp.holder, holder); assert.equal(grp.lastPass.brain, true);
    void act; void room;
  });
});

test("starts-with challenge: a word that only contains the letters is rejected", () => {
  withKind("starts", () => {
    const { begin, tryAct } = makeRoom({ n: 5 });
    const g = begin(); const grp = g.groups[0];
    assert.equal(grp.challenge.kind, "starts");
    const seq = grp.sequence.toLowerCase();
    const inside = wordsContaining(grp.sequence).find((w) => !w.startsWith(seq));
    if (inside) assert.match(tryAct(grp.holder, { type: "word", word: inside }).error, /START/);
    const good = wordsContaining(grp.sequence).find((w) => w.startsWith(seq) && w !== seq);
    if (good) assert.equal(tryAct(grp.holder, { type: "word", word: good }).ok, true);
  });
});

test("surprise toss: mid-round the potato can jump on its own with no penalty", () => {
  withKind("letters", () => {
    const { begin, advance } = makeRoom({ n: 5 });
    const g = begin(); const grp = g.groups[0];
    grp.surpriseAt = g.room.t() + 1000; // force one
    const holder = grp.holder, pts = g.points.get(holder);
    advance(1500);
    assert.equal(grp.lastPass?.surprise, true);
    assert.notEqual(grp.holder, holder);
    assert.equal(g.points.get(holder), pts, "surprise is not a penalty");
  });
});
