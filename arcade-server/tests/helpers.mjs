import { ArcadeService } from "../service.mjs";
import { MemoryStore } from "../store.mjs";

export function makeRoom({ playlist = ["hot_potato"], n = 6, timeScale = 1, content, settings = {}, userIds = false, onAward = null } = {}) {
  const clock = { now: 1_000_000 };
  const svc = new ArcadeService({ clock: () => clock.now, onAward });
  const room = svc.create({ playlist, settings: { timeScale, ...settings }, hostUserId: "teacher-1", content });
  const players = Array.from({ length: n }, (_, i) => room.addPlayer({ nickname: `Student ${i}`, userId: userIds ? `user-${i}` : null }));
  const advance = (ms, step = 100) => {
    for (let t = 0; t < ms; t += step) {
      clock.now += step;
      for (const p of room.players.values()) if (!p.bot && !p.forceOffline) room.touch(p.id);
      room.tick();
    }
  };
  /** Start the session and run through the intro until the first game is live. */
  const begin = () => { room.start(); advance(5100); return room.game; };
  const act = (p, action) => room.act(p.id ?? p, action);
  const tryAct = (p, action) => { try { return { ok: true, result: room.act(p.id ?? p, action) }; } catch (e) { return { ok: false, error: e.message, code: e.code }; } };
  const view = (p) => room.view({ playerId: p.id ?? p });
  return { svc, room, players, clock, advance, begin, act, tryAct, view };
}

export const teacherCtx = (store = new MemoryStore(), id = "teacher-1") => ({ user: { id, role: "teacher", name: "Ms. Tester", email: "t@example.com" }, ip: "1.1.1.1", store });
export const studentCtx = (store = new MemoryStore(), id = "student-1") => ({ user: { id, role: "student", name: "Stu", email: "s@example.com" }, ip: "2.2.2.2", store });
export const guestCtx = (store = new MemoryStore(), ip = "3.3.3.3") => ({ user: undefined, ip, store });
