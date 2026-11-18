import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { LIMITS } from "../drawing.mjs";

const content = { title: "P", items: { drawPrompts: ["zebra crossing", "volcano", "pineapple", "lighthouse", "dragon", "castle", "rocket"] } };
const pickAll = (g, ctx, i = 0) => { for (const grp of g.groups) if (grp.status === "pick") ctx.act(grp.artist, { type: "choose", index: i }); };
const seg = (k, pts = [10, 10, 50, 50, 90, 20]) => ({ k, t: 0, c: 1, w: 1, p: pts });

test("35 players -> groups of 5 with one artist each; guessers never see the secret word", () => {
  const ctx = makeRoom({ n: 35, playlist: ["quick_draw"], content });
  const g = ctx.begin();
  ctx.advance(2000); pickAll(g, ctx);
  assert.equal(g.groups.length, 7);
  for (const grp of g.groups) {
    assert.equal(grp.status, "draw");
    const word = grp.word;
    for (const m of grp.members) {
      const json = JSON.stringify(ctx.view(m).game);
      if (m === grp.artist) assert.ok(json.includes(word));
      else assert.ok(!json.toLowerCase().includes(word.toLowerCase()), `secret word leaked to guesser`);
    }
    // projector view must not leak either
    assert.ok(!JSON.stringify(ctx.room.view({ mode: "projector" }).game).toLowerCase().includes(word.toLowerCase()));
  }
});

test("only the artist can draw; strokes are validated and size-limited", () => {
  const ctx = makeRoom({ n: 6, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000); pickAll(g, ctx);
  const grp = g.groups[0];
  const guesser = grp.members.find((m) => m !== grp.artist);
  assert.match(ctx.tryAct(guesser, { type: "draw", segs: [seg(1)] }).error, /not the artist/);
  assert.ok(ctx.tryAct(grp.artist, { type: "draw", segs: [seg(1)] }).ok);
  assert.equal(ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 1, t: 9, p: [1, 1, 2, 2] }] }).ok, false);
  assert.equal(ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 1, t: 0, p: [1, 1, 2] }] }).ok, false);
  assert.equal(ctx.tryAct(grp.artist, { type: "draw", segs: Array.from({ length: LIMITS.segsPerAction + 1 }, (_, i) => seg(i)) }).ok, false);
  // coordinates are clamped to the canvas
  ctx.act(grp.artist, { type: "draw", segs: [seg(2, [-50, 9999, 5000, -5])] });
  const last = grp.log.segs.at(-1);
  assert.deepEqual(last.p, [0, 750, 1000, 0]);
});

test("real-time sync: guessers receive only new strokes via cursor, artist actions appear immediately", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000); pickAll(g, ctx);
  const grp = g.groups[0];
  const viewer = grp.members.find((m) => m !== grp.artist);
  ctx.act(grp.artist, { type: "draw", segs: [seg(1), seg(2)] });
  let v = ctx.room.view({ playerId: viewer, opts: {} }).game.group.draw;
  assert.equal(v.segs.length, 2);
  const key = v.key;
  ctx.act(grp.artist, { type: "draw", segs: [seg(3)] });
  v = ctx.room.view({ playerId: viewer, opts: { draw: { key, from: 2 } } }).game.group.draw;
  assert.equal(v.segs.length, 1);
  assert.equal(v.segs[0].k, 3);
  assert.equal(v.total, 3);
  // clear is a log entry so every client replays it
  ctx.act(grp.artist, { type: "draw", segs: [{ k: 4, t: 2 }] });
  v = ctx.room.view({ playerId: viewer, opts: { draw: { key, from: 3 } } }).game.group.draw;
  assert.equal(v.segs[0].t, 2);
});

test("guessing: speed-based points, artist rewarded, duplicates blocked, close guesses flagged privately", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000); pickAll(g, ctx);
  const grp = g.groups[0];
  const [a, b] = grp.members.filter((m) => m !== grp.artist);
  const word = grp.word, firstArtist = grp.artist;
  assert.equal(ctx.tryAct(grp.artist, { type: "guess", text: word }).ok, false, "artist cannot guess");
  const wrong = ctx.tryAct(a, { type: "guess", text: "totally wrong" });
  assert.equal(wrong.result.correct, false);
  const close = (ctx.advance(600), ctx.tryAct(a, { type: "guess", text: word.slice(0, -1) }));
  assert.equal(close.result.close, true);
  ctx.advance(700);
  const early = ctx.tryAct(a, { type: "guess", text: word.toUpperCase() });
  assert.equal(early.result.correct, true);
  assert.equal(ctx.tryAct(a, { type: "guess", text: word }).ok, false, "second correct guess rejected");
  ctx.advance(20000);
  const late = ctx.tryAct(b, { type: "guess", text: word });
  assert.ok(late.result.points < early.result.points, "later guess scores less");
  assert.ok(early.result.points >= 50 && early.result.points <= 100);
  ctx.advance(40000);
  assert.ok(g.points.get(firstArtist) >= 60, "artist earns for correct guesses");
});

test("artists rotate automatically and nobody draws twice in a group; round ends early when everyone guessed", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  const artists = [];
  for (let turn = 0; turn < 5; turn++) {
    ctx.advance(1700); pickAll(g, ctx);
    if (grp.artist && !artists.includes(grp.artist)) artists.push(grp.artist);
    for (const m of grp.members) if (m !== grp.artist) ctx.tryAct(m, { type: "guess", text: grp.word });
    ctx.advance(100);
    assert.equal(grp.status, "reveal", "should end the moment everyone has guessed");
    ctx.advance(4500);
  }
  assert.equal(new Set(artists).size, 5, "every player gets a turn to draw");
  ctx.advance(40000);
  assert.equal(ctx.room.history.length, 1);
});

test("artist who disconnects ends the turn without freezing the group", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000); pickAll(g, ctx);
  const grp = g.groups[0];
  const artist = grp.artist;
  ctx.room.players.get(artist).forceOffline = true;
  ctx.advance(8000);
  assert.notEqual(grp.artist === artist && grp.status === "draw", true);
});

test("full 35-bot Quick Draw round completes with scores", () => {
  const ctx = makeRoom({ n: 0, playlist: ["quick_draw"] });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  ctx.room.start();
  ctx.advance(500000, 250);
  assert.equal(ctx.room.history.length, 1);
  assert.ok(ctx.room.history[0].rows.some((r) => r.points > 0));
});

test("artist chooses one of three words; guessers cannot see the options; auto-pick on timeout", () => {
  const ctx = makeRoom({ n: 4, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000);
  const grp = g.groups[0];
  assert.equal(grp.status, "pick");
  const av = ctx.view(grp.artist).game.group;
  assert.equal(av.options.length, 3);
  const guesser = grp.members.find((m) => m !== grp.artist);
  const gv = JSON.stringify(ctx.view(guesser).game.group);
  for (const w of av.options) assert.ok(!gv.includes(w), "options leaked to a guesser");
  assert.match(ctx.tryAct(guesser, { type: "choose", index: 0 }).error, /not choosing/);
  assert.match(ctx.tryAct(grp.artist, { type: "choose", index: 7 }).error, /Pick one/);
  ctx.act(grp.artist, { type: "choose", index: 2 });
  assert.equal(grp.status, "draw");
  assert.equal(grp.word, av.options[2]);
  // timeout path
  const c2 = makeRoom({ n: 3, playlist: ["quick_draw"], content }); const g2 = c2.begin(); c2.advance(2000);
  c2.advance(6000);
  assert.equal(g2.groups[0].status, "draw");
});

test("paint bucket: a fill is one validated point, synced like any stroke, counted as ink, and capped", () => {
  const ctx = makeRoom({ n: 3, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000); pickAll(g, ctx);
  const grp = g.groups[0];
  const viewer = grp.members.find((m) => m !== grp.artist);
  assert.ok(ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 1, t: 3, c: 4, p: [500, 300] }] }).ok);
  assert.equal(ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 2, t: 3, c: 4, p: [500, 300, 600, 200] }] }).ok, false, "fill must be exactly one point");
  assert.equal(ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 3, t: 3, c: 4 }] }).ok, false);
  assert.equal(ctx.tryAct(viewer, { type: "draw", segs: [{ k: 4, t: 3, c: 1, p: [1, 1] }] }).ok, false, "only the artist can fill");
  ctx.act(grp.artist, { type: "draw", segs: [{ k: 5, t: 3, c: 99, p: [-50, 99999] }] });
  const last = grp.log.segs.at(-1);
  assert.deepEqual([last.t, last.c, last.p], [3, 7, [0, 750]], "colour and point are clamped");
  const draw = ctx.room.view({ playerId: viewer }).game.group.draw;
  assert.equal(draw.segs.filter((s) => s.t === 3).length, 2, "guessers receive the fills");
  for (let i = 0; i < 70; i++) { const r = ctx.tryAct(grp.artist, { type: "draw", segs: [{ k: 100 + i, t: 3, c: 1, p: [10, 10] }] }); if (!r.ok) { assert.match(r.error, /lot of fills/); assert.ok(i >= 55); return; } ctx.clock.now += 50; }
  assert.fail("fill cap not enforced");
});

test("gallery: every finished drawing is saved with its word; the group sees them all at the end; sent once via the cursor", () => {
  const ctx = makeRoom({ n: 4, playlist: ["quick_draw"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  const words = [];
  for (let turn = 0; turn < 4; turn++) {
    ctx.advance(1700); pickAll(g, ctx);
    words.push(grp.word);
    ctx.act(grp.artist, { type: "draw", segs: [seg(turn), seg(turn + 10)] });
    for (const m of grp.members) if (m !== grp.artist) ctx.tryAct(m, { type: "guess", text: grp.word });
    ctx.advance(100); assert.equal(grp.status, "reveal");
    ctx.advance(4500);
  }
  assert.equal(grp.status, "gallery", "after the last turn the group enters the gallery");
  const viewer = grp.members[0];
  const v1 = ctx.room.view({ playerId: viewer, opts: {} }).game.group;
  assert.equal(v1.gallery.length, 4);
  assert.deepEqual(v1.gallery.map((d) => d.word), words, "the gallery says what each drawing was supposed to be");
  assert.ok(v1.gallery.every((d) => d.segs.length >= 2 && d.artistName && d.guessers === 3));
  const v2 = ctx.room.view({ playerId: viewer, opts: { gal: grp.id } }).game.group;
  assert.equal(v2.gallery, undefined, "already-delivered galleries are not re-sent on every poll");
  ctx.advance(40000);
  assert.equal(grp.status, "done");
  assert.equal(ctx.room.history.length, 1);
});

test("everybody gets to draw: turns == group size, for every room size", () => {
  for (const n of [3, 4, 5, 6, 7, 8, 11, 14, 23, 35, 40]) {
    const ctx = makeRoom({ n, playlist: ["quick_draw"], content });
    const g = ctx.begin();
    for (const grp of g.groups) {
      assert.equal(grp.turns, grp.members.length, `n=${n}: every member draws once`);
      assert.ok(grp.members.length <= 5, `n=${n}: groups stay small enough to finish`);
    }
  }
});
