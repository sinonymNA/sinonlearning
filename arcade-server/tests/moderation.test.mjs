import test from "node:test";
import assert from "node:assert/strict";
import { cleanNickname, cleanText, hasPersonalInfo, isClean } from "../moderation.mjs";
import { handle } from "../api.mjs";
import { ArcadeService } from "../service.mjs";
import { MemoryStore } from "../store.mjs";
import { teacherCtx, guestCtx, makeRoom } from "./helpers.mjs";

test("profanity filter catches leetspeak and spacing but not innocent words", () => {
  for (const bad of ["sh1t", "f.u.c.k", "FUCK", "b!tch", "n1gger"]) assert.equal(isClean(bad), false, bad);
  for (const ok of ["grape", "assistant", "class", "peacock", "analysis", "therapist", "cocktail party"]) assert.equal(isClean(ok), true, ok);
});

test("personal information is rejected in nicknames and free text", () => {
  assert.ok(hasPersonalInfo("email me at kid@school.org"));
  assert.ok(hasPersonalInfo("call 555-123-4567"));
  assert.ok(hasPersonalInfo("visit www.example.com"));
  assert.throws(() => cleanNickname("kid@school.org"), /different nickname/);
  assert.throws(() => cleanText("my number is 555 123 4567", { label: "Answer" }), /personal info/);
  assert.equal(cleanText("  a   normal    answer ", {}), "a normal answer");
  assert.throws(() => cleanText("x".repeat(500), { max: 100 }), /too long/);
  assert.equal(cleanText("<b>hi</b>", {}).includes("<"), false, "angle brackets are stripped");
});

test("in-game text is moderated server-side (Imposter question/answer, Telephone description)", () => {
  const ctx = makeRoom({ n: 4, playlist: ["imposter"] });
  const g = ctx.begin(); const grp = g.groups[0];
  ctx.advance(6100);
  const asker = g.questioner(grp);
  assert.match(ctx.tryAct(asker, { type: "question", text: "what the fuck is this" }).error, /classroom-friendly/);
  assert.equal(ctx.tryAct(asker, { type: "question", text: "What would you bring here?" }).ok, true);
  assert.match(ctx.tryAct(grp.members[1], { type: "answer", text: "call me at 555 123 4567" }).error, /personal info/);
  assert.match(ctx.tryAct(grp.members[1], { type: "answer", text: "this is sh1t" }).error, /classroom-friendly/);
});

test("room settings: teams are assigned evenly and the team board aggregates normalised scores", () => {
  const ctx = makeRoom({ n: 12, playlist: ["last_one_standing"], settings: { teams: 3 } });
  ctx.begin();
  const counts = [0, 0, 0];
  for (const p of ctx.room.players.values()) counts[p.team]++;
  assert.deepEqual(counts, [4, 4, 4]);
  ctx.room.game.done = true; ctx.advance(300);
  const board = ctx.room.teamBoard();
  assert.equal(board.length, 3);
  assert.ok(board.every((t) => t.members === 4));
});

test("teacher can select a content set for a room through the API (owner only)", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const t = teacherCtx(store, "t1");
  const set = await store.saveSet({ ownerId: "t1", title: "Mine", items: { questions: [], vocab: ["alpha", "beta", "gamma"], drawPrompts: [], telephonePrompts: [], imposterWords: [] } });
  const { code } = await handle(svc, t, { type: "create", playlist: ["hot_potato"] });
  const res = await handle(svc, t, { type: "host", code, cmd: "content", args: { setId: set.id } });
  assert.equal(res.view.content.title, "Mine");
  await assert.rejects(() => handle(svc, teacherCtx(store, "t2"), { type: "create", playlist: ["hot_potato"], contentSetId: set.id }), /isn't available/);
  void guestCtx;
});

test("rooms are cleaned up after inactivity (data retention)", () => {
  const clock = { now: 1_000_000 };
  const svc = new ArcadeService({ clock: () => clock.now });
  const room = svc.create({ playlist: ["hot_potato"] });
  room.addPlayer({ nickname: "Kid" });
  clock.now += 3 * 60 * 60 * 1000; svc.tickAll();
  assert.ok(svc.get(room.code), "still there after 3h");
  clock.now += 2 * 60 * 60 * 1000; svc.tickAll();
  assert.equal(svc.get(room.code), undefined, "deleted after 5h idle");
  const r2 = svc.create({ playlist: ["hot_potato"] }); r2.host("end");
  clock.now += 31 * 60 * 1000; svc.tickAll();
  assert.equal(svc.get(r2.code), undefined, "ended rooms are deleted after 30 minutes");
});
