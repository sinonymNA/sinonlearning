import { botDoodle } from "./drawing.mjs";
import { wordsContaining } from "./dictionary.mjs";
import { IMPOSTER_FALLBACK_QUESTIONS, DEFAULT_TELEPHONE_PROMPTS } from "./content.mjs";
import { pick, randInt, shuffle } from "./util.mjs";
import { phrasesFor } from "./chat.mjs";

export const BEHAVIORS = {
  smart: { speed: 0.7, accuracy: 0.95, errorRate: 0.05 },
  average: { speed: 1.2, accuracy: 0.7, errorRate: 0.15 },
  sloppy: { speed: 1.9, accuracy: 0.4, errorRate: 0.4 },
  afk: { afk: true, speed: 1, accuracy: 0, errorRate: 0 },
  chaotic: { speed: 0.5, accuracy: 0.5, errorRate: 0.5, chaos: true },
  mixed: null,
};
const MIXED = ["smart", "average", "average", "sloppy", "afk", "smart"];
const NAMES = ["Bolt", "Pixel", "Mango", "Zippy", "Comet", "Noodle", "Turbo", "Echo", "Rocket", "Waffle", "Gizmo", "Pogo", "Sprout", "Jelly", "Orbit", "Bubbles", "Nacho", "Ziggy", "Cosmo", "Fudge", "Tango", "Mochi", "Panda", "Sparky", "Doodle", "Pepper", "Kiwi", "Rumble", "Sunny", "Pickle", "Flash", "Lemon", "Blaze", "Moose", "Cricket", "Rascal", "Wombat", "Cheddar", "Nimbus"];
const VAGUE = ["something fun", "I'm not sure", "probably a thing", "it depends", "good vibes", "a bit of everything", "whatever you like"];
const DESCRIPTIONS = ["a funny blob", "something round with legs", "a triangle party", "a very confused animal", "a strange house", "a happy cloud thing", "a robot maybe"];
const GUESS_WRONG = ["banana", "house", "cloud", "robot", "tree", "pizza"];

export class Bots {
  constructor(room) { this.room = room; this.list = []; }

  spawn(count, behavior = "smart") {
    const made = [];
    const used = new Set([...this.room.players.values()].map((p) => p.nickname));
    for (let i = 0; i < count && this.room.players.size < 40; i++) {
      const name = NAMES.find((n) => !used.has("🤖" + n)) ?? `Bot${this.list.length + i}`;
      used.add("🤖" + name);
      const kind = behavior === "mixed" ? MIXED[i % MIXED.length] : behavior;
      const bot = { kind, ...BEHAVIORS[kind in BEHAVIORS && BEHAVIORS[kind] ? kind : "average"], offline: false, key: null, queue: [], errors: 0, actions: 0 };
      const avatars = ["rk-sun", "rk-moon", "rk-leaf", "rk-wave"];
      const p = this.room.addPlayer({ nickname: "🤖" + name, avatar: avatars[i % 4], bot });
      this.list.push(p.id); made.push(p.id);
    }
    return made;
  }

  setOffline(ids, offline) {
    const targets = ids === "all" ? this.list : ids;
    for (const id of targets) { const p = this.room.players.get(id); if (p?.bot) p.bot.offline = offline; }
    this.room.log(offline ? "bots_disconnect" : "bots_reconnect", { count: targets.length });
    this.room.bump();
  }

  clear() { for (const id of this.list) this.room.removePlayer(id, "lab"); this.list = []; }

  tick(t) {
    const room = this.room;
    if (room.phase !== "playing" || !room.game) return;
    for (const id of this.list) {
      const p = room.players.get(id);
      if (!p || p.bot.offline || p.waiting || !room.game.players.includes(id)) continue;
      const bot = p.bot;
      if (bot.afk) continue;
      let plan = null;
      try { plan = this.plan(room.playlist[room.gameIndex], id, bot, room.game); } catch { plan = null; }
      if (plan && plan.key !== bot.key) { bot.key = plan.key; bot.queue = plan.queue.map((q) => ({ at: t + room.dur(q.delay), run: q.run })); }
      while (bot.queue.length && bot.queue[0].at <= t) {
        const step = bot.queue.shift();
        const action = typeof step.run === "function" ? step.run() : step.run;
        if (!action) continue;
        bot.actions++;
        try { room.act(id, action); } catch (e) { bot.errors++; if (e?.code === "stale") bot.queue.length = 0; }
      }
      if (!bot.chaos && room.settings.chat && randInt(1400) === 0) { try { room.chat(id, pick(phrasesFor(room.playlist[room.gameIndex])).id); } catch { /* cooldown */ } }
      if (bot.chaos && randInt(20) === 0) { try { room.act(id, pick([{ type: "word", word: "zzzz" }, { type: "answer", choice: 99 }, { type: "guess", text: "" }, { type: "vote", target: id }, { type: "nope" }])); } catch { bot.errors++; } }
    }
  }

  // ----- per game brains. They act only through room.act(); hints stand in for a human's knowledge -----
  plan(game, pid, bot, g) {
    const room = this.room;
    const d = (lo, hi) => (lo + randInt(Math.max(1, hi - lo))) * bot.speed;
    switch (game) {
      case "hot_potato": {
        const grp = g.byPlayer.get(pid);
        if (!grp || grp.status !== "live") return null;
        const hearts = grp.hearts.get(pid) ?? 0;
        const mine = hearts > 0 ? grp.holder === pid : randInt(100) < 30;
        if (!mine) return null;
        const key = `hp:${grp.id}:${grp.turn}:${pid}`;
        const seq = grp.sequence;
        if (hearts > 0 && grp.challenge?.kind === "quiz") {
          const c = grp.challenge, n = c.choices.length;
          const pick = () => (randInt(1000) < bot.accuracy * 1000 ? c.answer : (c.answer + 1 + randInt(n - 1)) % n);
          return { key, queue: [{ delay: d(2500, 7000), run: () => ({ type: "answer", index: c.wrong.has(c.answer) ? c.answer : pick(), turn: grp.turn }) }] };
        }
        const startsOnly = hearts > 0 && grp.challenge?.kind === "starts";
        const word = () => {
          const pool = wordsContaining(seq).filter((w) => !grp.used.has(w) && (!startsOnly || w.startsWith(seq.toLowerCase())));
          return pool.length ? pool[randInt(Math.min(pool.length, 400))] : "zzz";
        };
        const q = [];
        let at = d(900, 3200);
        if (randInt(100) < bot.errorRate * 100) { q.push({ delay: at, run: { type: "word", word: seq.toLowerCase() + "q", turn: grp.turn } }); at += d(700, 1500); }
        q.push({ delay: at, run: () => ({ type: "word", word: word(), turn: grp.turn }) });
        return { key, queue: q };
      }
      case "puffer_party": {
        const grp = g.byPlayer.get(pid);
        if (!grp || grp.status !== "live" || grp.holder !== pid) return null;
        const key = `pp:${grp.id}:${grp.turn}:${pid}`;
        const q = [];
        let at = d(1500, 7000);
        if (randInt(100) < bot.errorRate * 100) { q.push({ delay: at, run: { type: "answer", text: "zzzq", turn: grp.turn } }); at += d(900, 2000); }
        q.push({ delay: at, run: () => { const text = g.botPick(grp, bot.accuracy); return text ? { type: "answer", text, turn: grp.turn } : null; } });
        return { key, queue: q };
      }
      case "dacula_dash": {
        const m = g.byPlayer.get(pid);
        if (!m || m.over || m.cur !== pid) return null;
        const key = `dd:${m.id}:${m.turnNo}:${m.phase}:${pid}`;
        if (m.phase === "roll") return { key, queue: [{ delay: d(900, 2600), run: () => ({ type: "roll", turn: m.turnNo, boost: m.p.get(pid).tokens > 0 && randInt(100) < 55 ? 1 : 0 }) }] };
        if (m.phase === "choose") return { key, queue: [{ delay: d(1800, 5200), run: () => { const b = m.bestMove(pid); const o = m.options; if (!b || !o) return null; const pickDest = randInt(100) < bot.accuracy * 100 ? b.dest : [...o.keys()][randInt(o.size)]; return { type: "move", to: pickDest, turn: m.turnNo }; } }] };
        if (m.phase === "question" && m.q) return { key, queue: [{ delay: d(2500, 9000), run: () => { const q = m.q; if (!q) return null; const right = randInt(1000) < bot.accuracy * 1000; const idx = right ? q.correct : (q.correct + 1 + randInt(3)) % 4; return { type: "answer", index: idx, turn: m.turnNo }; } }] };
        return null;
      }
      case "last_one_standing": {
        if (g.phase !== "ready" && g.phase !== "question") return null;
        const key = `los:${g.asked}:${pid}`;
        const ms = room.t() < g.q.openAt ? g.q.openAt - room.t() : 0;
        const answerDelay = Math.round(ms / room.settings.timeScale) + d(700, 6500);
        return { key, queue: [{ delay: answerDelay, run: () => {
          const correct = g.botHint();
          const n = g.q.choices.length;
          const choice = randInt(1000) < bot.accuracy * 1000 ? correct : (correct + 1 + randInt(n - 1)) % n;
          return { type: "answer", choice };
        } }] };
      }
      case "piggy_bank": {
        if (g.phase === "ready" || g.phase === "question") {
          const ms = room.t() < g.q.openAt ? g.q.openAt - room.t() : 0;
          return { key: `pbq:${g.round}:${pid}`, queue: [{ delay: Math.round(ms / room.settings.timeScale) + d(800, 6500), run: () => { const c = g.botHint(); const n = g.q.choices.length; return { type: "answer", choice: randInt(1000) < bot.accuracy * 1000 ? c : (c + 1 + randInt(n - 1)) % n }; } }] };
        }
        if (g.phase === "chest" && !g.picks.has(pid)) {
          return { key: `pbc:${g.round}:${pid}`, queue: [{ delay: d(700, 4500), run: () => {
            const allowed = g.correctSet.has(pid) ? ["safe", "spicy", "wild"] : ["safe", "spicy"];
            const leading = [...g.bank.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] === pid;
            const chest = bot.accuracy > 0.9 ? (leading ? "safe" : allowed.includes("wild") ? "wild" : "spicy") : pick(allowed);
            return { type: "pick", chest };
          } }] };
        }
        return null;
      }
      case "quick_draw": {
        const grp = g.byPlayer.get(pid);
        if (grp && grp.status === "pick" && grp.artist === pid) return { key: `qdp:${grp.key}:${pid}`, queue: [{ delay: d(600, 2500), run: { type: "choose", index: randInt(3) } }] };
        if (!grp || grp.status !== "draw") return null;
        const key = `qd:${grp.key}:${pid}`;
        if (grp.artist === pid) {
          const doodle = botDoodle(pid.charCodeAt(0) + pid.charCodeAt(5));
          return { key, queue: doodle.map((s, i) => ({ delay: 1500 + i * 2500 * bot.speed, run: { type: "draw", segs: [s] } })) };
        }
        const queue = [];
        const wrong = Math.min(3, Math.floor(bot.errorRate * 6));
        for (let i = 0; i < wrong; i++) queue.push({ delay: d(3000, 9000) + i * 2000, run: { type: "guess", text: pick(GUESS_WRONG) } });
        if (randInt(1000) < bot.accuracy * 1000) queue.push({ delay: d(8000, 24000), run: () => ({ type: "guess", text: g.botHint(pid)?.word ?? "x" }) });
        return { key, queue: queue.sort((a, b) => a.delay - b.delay) };
      }
      case "telephone": {
        const rec = g.byPlayer.get(pid);
        if (!rec) return null;
        const grp = rec.g;
        if (grp.status === "vote") {
          const key = `tel:vote:${grp.id}:${pid}`;
          return { key, queue: [{ delay: d(1000, 6000), run: () => ({ type: "vote", chain: pick([...grp.chains.keys()].filter((i) => grp.chains[i].owner !== pid)) }) }] };
        }
        if (grp.status !== "stage") return null;
        const key = `tel:${grp.id}:${grp.stage}:${pid}`;
        if (grp.stage === 1) return { key, queue: [{ delay: d(4000, 14000), run: () => ({ type: "describe", text: pick(DESCRIPTIONS) }) }, { delay: d(14500, 15500), run: { type: "done" } }] };
        const doodle = botDoodle(pid.charCodeAt(1) + grp.stage * 7);
        return { key, queue: [...doodle.map((s, i) => ({ delay: 2000 + i * 3000 * bot.speed, run: { type: "draw", segs: [s] } })), { delay: 14000 * bot.speed + 3000, run: { type: "done" } }] };
      }
      case "imposter": {
        const grp = g.byPlayer.get(pid);
        if (!grp) return null;
        const hint = g.botHint(pid);
        const key = `imp:${grp.id}:${grp.phase}:${grp.turn}:${grp.runoff?.length ?? 0}:${pid}`;
        if (grp.phase === "ask" && g.questioner(grp) === pid) return { key, queue: [{ delay: d(1500, 6000), run: () => ({ type: "question", text: pick(IMPOSTER_FALLBACK_QUESTIONS) + " " + ["(really)", "", "?", "!"][randInt(4)] }) }] };
        if (grp.phase === "answer") {
          return { key, queue: [{ delay: d(2000, 9000), run: () => ({ type: "answer", text: hint.imposter || randInt(100) > bot.accuracy * 100 ? pick(VAGUE) : (pick(hint.related.length ? hint.related : VAGUE)) }) }] };
        }
        if (grp.phase === "vote" || grp.phase === "runoff") {
          return { key, queue: [{ delay: d(1500, 7000), run: () => {
            const pool = (grp.phase === "runoff" ? grp.runoff : grp.members).filter((m) => m !== pid && g.here(m));
            if (!hint.imposter && randInt(100) < bot.accuracy * 80) {
              // crew bots look for the player whose answers share nothing with the topic
              const score = new Map(pool.map((m) => [m, 0]));
              for (const h of grp.history) for (const a of h.answers) if (a.text && score.has(a.id) && hint.related.some((r) => a.text.toLowerCase().includes(r.toLowerCase()))) score.set(a.id, score.get(a.id) + 1);
              const worst = [...score.entries()].sort((a, b) => a[1] - b[1]);
              return { type: "vote", target: worst[0][0] };
            }
            return { type: "vote", target: pick(pool) };
          } }] };
        }
        if (grp.phase === "guess" && hint.imposter) return { key, queue: [{ delay: d(2000, 7000), run: () => ({ type: "guess", text: pick(g.content.items).word }) }] };
        return null;
      }
    }
    return null;
  }
}
export { DEFAULT_TELEPHONE_PROMPTS, shuffle };
