import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { LIMITS } from "../drawing.mjs";

const content = { title: "P", items: { drawPrompts: ["zebra crossing", "volcano", "pineapple", "lighthouse", "dragon", "castle", "rocket"] } };
const seg = (k, pts = [10, 10, 50, 50, 90, 20]) => ({ k, t: 0, c: 1, w: 1, p: pts });

test("35 players -> groups of 5-7 with one artist each; guessers never see the secret word", () => {
  const ctx = makeRoom({ n: 35, playlist: ["quick_draw"], content });
  const g = ctx.begin();
  ctx.advance(2000);
  assert.equal(g.groups.length, 5);
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
  const g = ctx.begin(); ctx.advance(2000);
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
  const g = ctx.begin(); ctx.advance(2000);
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
  const g = ctx.begin(); ctx.advance(2000);
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
  ctx.advance(30000);
  assert.ok(g.points.get(firstArtist) >= 60, "artist earns for correct guesses");
});

test("artists rotate automatically and nobody draws twice in a group; round ends early when everyone guessed", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  const artists = [];
  for (let turn = 0; turn < 5; turn++) {
    ctx.advance(1700);
    if (grp.artist && !artists.includes(grp.artist)) artists.push(grp.artist);
    for (const m of grp.members) if (m !== grp.artist) ctx.tryAct(m, { type: "guess", text: grp.word });
    ctx.advance(100);
    assert.equal(grp.status, "reveal", "should end the moment everyone has guessed");
    ctx.advance(4500);
  }
  assert.equal(new Set(artists).size, 5);
  ctx.advance(10000);
  assert.equal(ctx.room.history.length, 1);
});

test("artist who disconnects ends the turn without freezing the group", () => {
  const ctx = makeRoom({ n: 5, playlist: ["quick_draw"], content });
  const g = ctx.begin(); ctx.advance(2000);
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
  ctx.advance(260000, 250);
  assert.equal(ctx.room.history.length, 1);
  assert.ok(ctx.room.history[0].rows.some((r) => r.points > 0));
});
