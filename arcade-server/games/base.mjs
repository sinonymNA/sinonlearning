export class BaseGame {
  constructor(room, players, content) {
    this.room = room;
    this.players = [...players];
    this.content = content;
    this.points = new Map(players.map((id) => [id, 0]));
    this.done = false;
  }
  add(pid, n) { if (this.points.has(pid)) this.points.set(pid, Math.max(0, (this.points.get(pid) ?? 0) + Math.round(n))); }
  here(pid) { return this.room.players.has(pid); }
  connected(pid) { return this.room.isConnected(pid); }
  nick(pid) { return this.room.players.get(pid)?.nickname ?? "(left)"; }
  D(ms) { return this.room.dur(ms); }
  start() {}
  tick() {}
  act() { throw new Error("This game does not accept that action."); }
  view() { return {}; }
  skip() { this.done = true; }
  highlights() { return []; }
}
