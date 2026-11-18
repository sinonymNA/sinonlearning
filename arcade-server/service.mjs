import { Room } from "./room.mjs";
import { GameError, RateLimiter, fail } from "./util.mjs";
import { Bots } from "./bots.mjs";

const IDLE_MS = 4 * 60 * 60 * 1000;     // rooms vanish after 4h idle
const ENDED_MS = 30 * 60 * 1000;        // ended rooms are kept 30 min for results then deleted

export class ArcadeService {
  constructor({ clock = Date.now, onAward = null } = {}) {
    this.rooms = new Map();
    this.clock = clock;
    this.onAward = onAward;
    this.limiter = new RateLimiter();
    this.timer = null;
  }

  create(opts = {}) {
    if (this.rooms.size >= 300) fail("The arcade is busy. Try again in a few minutes.");
    const room = new Room({ clock: this.clock, onAward: this.onAward, ...opts });
    while (this.rooms.has(room.code)) room.code = (new Room({ clock: this.clock, playlist: ["hot_potato"] })).code;
    this.rooms.set(room.code, room);
    return room;
  }

  get(code) { return this.rooms.get(String(code ?? "").toUpperCase().trim()); }
  need(code) { const r = this.get(code); if (!r) fail("Room not found. Check the code.", "not_found"); return r; }

  startTicker(intervalMs = 250) {
    if (this.timer) return;
    this.timer = setInterval(() => this.tickAll(), intervalMs);
    this.timer.unref?.();
  }
  stopTicker() { clearInterval(this.timer); this.timer = null; }

  tickAll() {
    const now = this.clock();
    for (const room of this.rooms.values()) {
      try { room.tick(); } catch (e) { room.log("tick_error", { message: String(e?.message ?? e) }); }
      const idle = now - room.lastActivity;
      if ((room.phase === "ended" && idle > ENDED_MS) || idle > IDLE_MS) this.rooms.delete(room.code);
    }
    this.limiter.sweep(now);
  }

  // ----- bots (developer lab) -----
  addBots(room, count, behavior = "smart") {
    room.bots ??= new Bots(room);
    return room.bots.spawn(count, behavior);
  }
}
export { GameError };
