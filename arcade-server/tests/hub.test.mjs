import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { HUB_GAMES, MOODS, MAX_VISIBLE, shelves, gameForPath, pushRecent, validateCatalog, wordCount } from "../hub.mjs";

test("the catalog is valid: unique ids and links, known moods, taglines of at most 5 words", () => { assert.deepEqual(validateCatalog(), []); });

test("every hub image icon exists in public/", () => {
  for (const g of HUB_GAMES) if (g.icon.startsWith("/")) assert.ok(fs.existsSync(new URL(`../../public${g.icon}`, import.meta.url)), `${g.icon} is missing: run its logo script`);
});

test("every hub link points at a real page", () => {
  for (const g of HUB_GAMES) assert.ok(fs.existsSync(new URL(`../../app${g.href}/page.tsx`, import.meta.url)), `${g.href} has no page.tsx`);
});

test("shelves: no empty shelf, never more than MAX_VISIBLE shown, the rest sit behind See all, every game is on exactly one shelf", () => {
  const s = shelves(); assert.ok(s.length >= 3 && s.length <= MOODS.length);
  for (const sh of s) { assert.ok(sh.shown.length >= 1 && sh.shown.length <= MAX_VISIBLE, sh.id); assert.equal(sh.shown.length + sh.more.length, HUB_GAMES.filter((g) => g.mood === sh.id).length); }
  assert.deepEqual(s.flatMap((x) => [...x.shown, ...x.more]).map((g) => g.id).sort(), HUB_GAMES.map((g) => g.id).sort());
  const many = Array.from({ length: 5 }, (_, i) => ({ id: "g" + i, href: "/x" + i, name: "G", mood: "brain", tagline: "ok", icon: "x", color: "c", match: [] }));
  const b = shelves(many).find((x) => x.id === "brain"); assert.equal(b.shown.length, MAX_VISIBLE); assert.equal(b.more.length, 2);
});

test("validation catches bad entries (long tagline, unknown mood, duplicates)", () => {
  const bad = [{ id: "a", href: "/a", name: "A", mood: "nope", tagline: "one two three four five six", icon: "x", color: "c", match: [] }, { id: "a", href: "/a", name: "A", mood: "brain", tagline: "fine", icon: "x", color: "c", match: [] }];
  const errs = validateCatalog(bad).join("|"); assert.match(errs, /unknown mood/); assert.match(errs, /over 5 words/); assert.match(errs, /duplicate id/); assert.match(errs, /duplicate href/);
  assert.equal(wordCount("  two   words "), 2);
});

test("gameForPath: game pages and their sub-pages map to the game; hub pages do not; longest prefix wins", () => {
  assert.equal(gameForPath("/arcade/packs"), "packs"); assert.equal(gameForPath("/arcade/abyss/play"), "abyss"); assert.equal(gameForPath("/arcade/solo/practice"), "practice");
  assert.equal(gameForPath("/arcade/room/ABCD"), "class"); assert.equal(gameForPath("/arcade/join"), "class"); assert.equal(gameForPath("/arcade/multiplayer"), "class");
  assert.equal(gameForPath("/arcade"), null); assert.equal(gameForPath("/arcade/solo"), null); assert.equal(gameForPath("/arcade/shop"), null); assert.equal(gameForPath("/arcade/packsfoo"), null);
});

test("recent list: newest first, no duplicates, capped", () => {
  let l = []; for (const [id, t] of [["a", 1], ["b", 2], ["c", 3], ["a", 4], ["d", 5], ["e", 6], ["f", 7]]) l = pushRecent(l, id, t);
  assert.deepEqual(l.map((x) => x.id), ["f", "e", "d", "a", "c"]); assert.equal(l.length, 5); assert.equal(l[3].at, 4);
});
