// Retro Gridiron play simulator. Pure logic: no DOM, no Date.now, no Math.random. One PlaySim = one snap.
// Coordinates: x across the field (0..53.3), y DOWNFIELD (offense drives toward +y). Units: yards / seconds.
import { FIELD, SIM, OFFENSE, DEFENSE } from "./config.mjs";
import { getPlay, ZONES, FORMATION } from "./playbook.mjs";
import { makeRng } from "./rng.mjs";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const maxSpeedOf = (r) => SIM.SPEED_BASE + SIM.SPEED_PER_RATING * r.speed;
const accelOf = (r) => SIM.ACCEL_BASE + SIM.ACCEL_PER_RATING * (r.accel ?? r.speed);

/** Accelerate `e` toward a target point, honouring its top speed and acceleration. */
function move(e, tx, ty, mult, dt, arrive = true) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  const sp = e.maxSpeed * mult;
  const ramp = arrive ? Math.min(1, d / (e.maxSpeed * 0.14 + 0.01)) : 1;
  const k = d > 1e-6 ? (sp * ramp) / d : 0;
  const wx = dx * k, wy = dy * k;
  const ax = wx - e.vx, ay = wy - e.vy, am = Math.hypot(ax, ay), md = e.accel * dt;
  if (am > md) { e.vx += (ax / am) * md; e.vy += (ay / am) * md; } else { e.vx = wx; e.vy = wy; }
  e.x += e.vx * dt; e.y += e.vy * dt;
}
const brake = (e, dt, f = 14) => { const s = Math.max(0, 1 - f * dt); e.vx *= s; e.vy *= s; e.x += e.vx * dt; e.y += e.vy * dt; };

export const PHASES = ["presnap", "pocket", "windup", "flight", "carry", "dead"];

export class PlaySim {
  /**
   * @param {object} o  { play: id, los: y of the line of scrimmage, seed, coverage: "man"|"zone"|"blitz"|undefined,
   *                      defDelta: ratings offset for the defence, offDelta: offset for the offence, rng }
   */
  constructor(o = {}) {
    this.rng = o.rng || makeRng(o.seed ?? 1);
    this.play = getPlay(o.play || "slants");
    this.los = o.los ?? FIELD.END + 25;
    this.coverage = o.coverage || this.rng.pick(["man", "man", "zone", "zone", "zone", "blitz"]);
    this.defDelta = o.defDelta ?? 0;
    this.offDelta = o.offDelta ?? 0;
    this.t = 0; this.phase = "presnap"; this.events = []; this.result = null;
    this.input = { lateral: 0 };
    this.target = null; this.flight = null; this.carrier = null; this.thrownTo = null; this.catchY = null; this.throwT = null;
    this._acc = 0;
    this._build();
  }

  ev(type, extra = {}) { this.events.push({ t: this.t, type, ...extra }); }
  drainEvents() { const e = this.events; this.events = []; return e; }

  _rate(base, jitter = 0) {
    const o = {};
    for (const k of Object.keys(base)) o[k] = typeof base[k] === "number" ? clamp(base[k] + (jitter ? this.rng.range(-jitter, jitter) : 0), 20, 99) : base[k];
    return o;
  }

  _mk(id, team, role, x, y, rating, extra = {}) {
    const e = { id, team, role, x, y, vx: 0, vy: 0, r: rating, state: "ALIGN", stun: 0, blockedUntil: 0, immuneUntil: 0, cool: 0, ...extra };
    e.maxSpeed = maxSpeedOf(rating); e.accel = accelOf(rating);
    return e;
  }

  _build() {
    const cx = FIELD.CX, los = this.los, d = this.offDelta, dd = this.defDelta;
    // ---- offence
    const qbR = Object.fromEntries(Object.entries(OFFENSE.qb).map(([k, v]) => [k, typeof v === "number" ? clamp(v + d, 20, 99) : v]));
    this.qb = this._mk("QB", "o", "QB", cx, los - 5, { ...qbR, speed: 55, accel: 60 });
    this.wr = this.play.receivers.map((rt, i) => {
      const r = this._rate(OFFENSE.wr[i], 0);
      for (const k of ["speed", "accel", "catching", "route", "agility", "blocking"]) r[k] = clamp(r[k] + d, 20, 99);
      const e = this._mk("WR" + i, "o", "WR", cx + rt.start.x, los + rt.start.dy, r, { label: "ABCD"[i], idx: i });
      e.path = rt.route.map((p, j, a) => { const prev = j ? a[j - 1] : null; return null; });
      let px = e.x, py = e.y; e.path = [];
      for (const p of rt.route) { px = e.x + p.dx; py = e.y + p.dy; e.path.push({ x: clamp(px, 1.2, FIELD.W - 1.2), y: py }); }
      // route dx/dy are cumulative from the start, so recompute from start rather than chaining
      e.path = rt.route.map((p) => ({ x: clamp(e.x + p.dx, 1.2, FIELD.W - 1.2), y: Math.min(FIELD.LEN - 1, e.y + p.dy) }));
      e.wp = 0; e.heading = 0; e.lagUntil = 0;
      return e;
    });
    this.ol = FORMATION.olX.map((x, i) => this._mk("OL" + i, "o", "OL", cx + x, los - 0.95, { speed: 55, accel: 60, blocking: clamp(OFFENSE.ol.blocking + d, 20, 99) }));
    // ---- defence (each defender gets a slightly different ratings sheet)
    const mkD = (id, role, x, y, base, extra) => this._mk(id, "d", role, x, y, (() => { const r = this._rate(base, 6); for (const k of Object.keys(r)) r[k] = clamp(r[k] + dd, 20, 99); return r; })(), extra);
    const man = this.coverage !== "zone";
    this.dl = FORMATION.dlX.map((x, i) => mkD("DL" + i, "DL", cx + x, los + 0.95, DEFENSE.dl, { engage: null }));
    this.lb = FORMATION.lbX.map((x, i) => mkD("LB" + i, "LB", cx + x, los + 4.5, DEFENSE.lb, { zone: ZONES[4 + i] }));
    const dbs = [];
    for (let i = 0; i < 4; i++) {
      const w = this.wr[i];
      const x = man ? w.x : cx + [-17, -4, 17, 8][i];
      const y = man ? los + (i === 0 || i === 3 ? 6.5 : 5.5) : los + [8, 13, 8, 10][i];
      dbs.push(mkD("DB" + i, "DB", x, y, DEFENSE.db, { zone: ZONES[i], cover: man ? i : -1 }));
    }
    this.db = dbs;
    // blitz: the middle linebacker comes, and the DBs stay in man
    if (this.coverage === "blitz") { this.lb[1].blitz = true; this.lb[1].y = los + 2.2; }
    // pass-rush block timers: when a rusher beats his blocker
    const blockers = [this.ol[0], this.ol[1], this.ol[3], this.ol[4]];
    this.dl.forEach((e, j) => {
      const ol = blockers[j]; e.engage = ol;
      const gap = ol.r.blocking - e.r.rush;
      e.breakAt = Math.max(0.9, SIM.BLOCK_BREAK_BASE + gap * SIM.BLOCK_BREAK_RATING_SCALE + this.rng.range(-1, 1) * SIM.BLOCK_BREAK_JITTER);
      e.x = ol.x + (j < 2 ? -0.3 : 0.3) * 0;
    });
    if (this.lb[1].blitz) {
      const e = this.lb[1], ol = this.ol[2]; e.engage = ol;
      e.breakAt = Math.max(0.8, 1.55 + (ol.r.blocking - e.r.rush) * SIM.BLOCK_BREAK_RATING_SCALE + this.rng.range(-1, 1) * 0.4);
    }
    this.defenders = [...this.dl, ...this.lb, ...this.db];
    this.everyone = [this.qb, ...this.wr, ...this.ol, ...this.defenders];
    for (const e of this.defenders) { e.react = SIM.REACTION_BASE + (100 - e.r.awareness) * SIM.REACTION_PER_INAWARE; }
    this.qbHome = { x: cx, y: this.los - SIM.QB_DROP_YARDS };
  }

  /** Start the play. */
  snap() { if (this.phase !== "presnap") return; this.phase = "pocket"; this.ev("snap"); for (const e of this.defenders) e.state = e.role === "DL" ? "BLOCKED" : (this.coverage === "zone" && e.role !== "LB" ? "COVER_ZONE" : e.role === "DB" && e.cover >= 0 ? "COVER_MAN" : "COVER_ZONE"); if (this.lb[1].blitz) this.lb[1].state = "BLOCKED"; }
  setLateral(v) { this.input.lateral = clamp(v || 0, -1, 1); }

  // ---------------------------------------------------------------------------------------------
  // route projection (used for throw leading): where will receiver `w` be T seconds from now?
  projectReceiver(w, T) {
    let x = w.x, y = w.y, left = T * w.maxSpeed * 0.97;
    for (let i = w.wp; i < w.path.length && left > 0; i++) {
      const p = w.path[i], dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d <= left) { x = p.x; y = p.y; left -= d; } else { x += (dx / d) * left; y += (dy / d) * left; left = 0; }
    }
    return { x, y };
  }

  /** How open is receiver `w`? yards to the closest defender (smaller = more covered). */
  separation(w) { let m = 99; for (const e of this.defenders) { if (e.role === "DL") continue; m = Math.min(m, dist(e, w)); } return m; }

  /** Quarterback throws to receiver idx 0..3 (A..D). Returns false if throwing is not possible now. */
  throwTo(idx) {
    if (this.phase !== "pocket" || idx < 0 || idx > 3) return false;
    const w = this.wr[idx];
    this.phase = "windup"; this.windT = SIM.RELEASE_DELAY; this.thrownTo = idx; this.throwT = this.t;
    const qb = this.qb;
    const speed = SIM.BALL_SPEED_BASE + SIM.BALL_SPEED_PER_ARM * qb.r.arm + 0.04 * qb.r.throwSpeed;
    // solve for the interception point: a ball launched after RELEASE_DELAY must meet the receiver's projected position
    let T = 0.6, p = this.projectReceiver(w, T + SIM.RELEASE_DELAY);
    for (let i = 0; i < 8; i++) { p = this.projectReceiver(w, T + SIM.RELEASE_DELAY); T = Math.hypot(p.x - qb.x, p.y - qb.y) / speed; }
    // accuracy: ratings, pressure, a rushed/off-balance throw and flight time all grow the miss radius
    let pressured = false;
    for (const e of this.defenders) if ((e.state === "RUSH") && dist(e, qb) < SIM.PRESSURE_RADIUS) pressured = true;
    let sigma = SIM.PASS_ERR_BASE + (100 - qb.r.accuracy) * SIM.PASS_ERR_PER_INACC;
    sigma *= 0.7 + T * 0.25;
    if (pressured) sigma *= SIM.PRESSURE_ERR_MULT;
    if (this.t < SIM.QB_DROP_TIME) sigma *= 1.35;
    const ex = this.rng.normal() * sigma, ey = this.rng.normal() * sigma;
    this.target = { x: p.x + ex, y: p.y + ey, ideal: p, sigma, pressured };
    this.flight = { t0: 0, dur: Math.max(0.25, T), from: { x: qb.x, y: qb.y }, speed, arc: clamp(Math.hypot(p.x - qb.x, p.y - qb.y) * 0.11, 0.6, 4.5) };
    this.ev("throw", { idx, dur: this.flight.dur });
    return true;
  }

  // ---------------------------------------------------------------------------------------------
  /** Advance by `seconds` of game time in fixed steps. */
  advance(seconds) { this._acc += seconds; let n = 0; while (this._acc >= SIM.DT - 1e-9 && n < 600) { this._acc -= SIM.DT; this.step(SIM.DT); n++; if (this.phase === "dead") { this._acc = 0; break; } } }

  step(dt = SIM.DT) {
    if (this.phase === "presnap" || this.phase === "dead") return;
    this.t += dt;
    for (const e of this.everyone) { e.cool = Math.max(0, e.cool - dt); e.stun = Math.max(0, e.stun - dt); }
    this._receivers(dt); this._line(dt); this._qb(dt); this._defenders(dt);
    if (this.phase === "windup") { this.windT -= dt; if (this.windT <= 0) { this.phase = "flight"; this.flight.t0 = this.t; this.ev("release"); } }
    if (this.phase === "pocket" || this.phase === "windup") this._checkSack();
    if (this.phase === "flight") this._flight(dt);
    if (this.phase === "carry") this._carry(dt);
    for (const e of this.everyone) { if (e !== this.carrier) { e.x = clamp(e.x, 0.4, FIELD.W - 0.4); e.y = clamp(e.y, 0.4, FIELD.LEN - 0.4); } }
  }

  _receivers(dt) {
    for (const w of this.wr) {
      if (w === this.carrier) continue;
      if (this.phase === "carry" && this.carrier && w !== this.carrier) { this._blocker(w, dt); continue; }
      if (w.wp < w.path.length) {
        const p = w.path[w.wp];
        const prevV = Math.atan2(w.vy, w.vx);
        move(w, p.x, p.y, 0.97, dt, false);
        if (Math.hypot(p.x - w.x, p.y - w.y) < 0.7) { w.wp++; }
        const hd = Math.atan2(w.vy, w.vx);
        let turn = Math.abs(hd - prevV); if (turn > Math.PI) turn = 2 * Math.PI - turn;
        w.lastTurn = turn;
      } else {
        // route finished: drift away from the nearest coverage defender
        let n = null, nd = 99;
        for (const e of this.defenders) { if (e.role === "DL") continue; const d = dist(e, w); if (d < nd) { nd = d; n = e; } }
        const tx = n ? w.x + (w.x - n.x) * 0.6 : w.x, ty = n ? w.y + (w.y - n.y) * 0.3 : w.y;
        move(w, clamp(tx, 2, FIELD.W - 2), Math.min(ty, FIELD.LEN - 4), 0.38, dt);
      }
    }
  }

  _line(dt) {
    // blockers hold their men; once a rusher breaks free he comes for the quarterback
    const holding = this.phase === "pocket" || this.phase === "windup" || this.phase === "flight";
    for (const e of [...this.dl, this.lb[1]]) {
      if (!e.engage) continue;
      const ol = e.engage;
      if (e.state === "BLOCKED" && holding) {
        if (this.t >= e.breakAt) { e.state = "RUSH"; this.ev("rushfree", { id: e.id }); }
        else { e.y = Math.max(ol.y + 0.95, e.y - SIM.BLOCKED_ADVANCE_SPEED * dt); e.x += (ol.x - e.x) * Math.min(1, 3 * dt); ol.y = e.y - 0.95; ol.x = e.x; e.vx = e.vy = 0; }
      } else if (e.state === "RUSH") {
        ol.x += (e.x - ol.x) * Math.min(1, 1.5 * dt); ol.y += (e.y - 0.7 - ol.y) * Math.min(1, 1.2 * dt);
      }
    }
    // the unengaged lineman tidies up
    for (const ol of this.ol) {
      if (this.phase === "carry" || this.phase === "dead") continue;
      const taken = [...this.dl, this.lb[1]].some((e) => e.engage === ol);
      if (!taken) { ol.vx = ol.vy = 0; }
    }
  }

  _qb(dt) {
    const q = this.qb;
    if (this.phase === "pocket" || this.phase === "windup") {
      const k = Math.min(1, this.t / SIM.QB_DROP_TIME);
      q.y = this.los - 5 + (this.qbHome.y - (this.los - 5)) * k;
      q.vx = q.vy = 0;
    } else if (this.phase === "flight" || this.phase === "carry") {
      q.vx = q.vy = 0;
    }
  }

  _defenders(dt) {
    const qb = this.qb;
    for (const e of this.defenders) {
      if (this.phase === "carry" || this.phase === "flight" && e.state === "PURSUE") { /* handled below */ }
      if (e.stun > 0) { brake(e, dt, 6); continue; }
      const blocked = this.t < e.blockedUntil; const slow = blocked ? SIM.BLOCK_SLOW : 1;
      if (this.phase === "carry" && this.carrier) { this._pursue(e, dt, slow); continue; }
      if (this.phase === "flight") { this._intercept(e, dt, slow); continue; }
      if (e.state === "BLOCKED") continue;
      if (e.state === "RUSH") { move(e, qb.x, qb.y, 1, dt); continue; }
      if (this.t < e.react) { brake(e, dt); continue; }
      if (e.state === "COVER_MAN") this._man(e, dt, slow);
      else this._zone(e, dt, slow);
    }
  }

  _man(e, dt, slow) {
    const w = this.wr[e.cover];
    if (w.lastTurn > 0.7 && this.t > e.lagUntil + 0.2) e.lagUntil = this.t + (0.07 + (100 - e.r.coverage) * 0.0042) * (74 / Math.max(40, w.r.route));
    if (this.t < e.lagUntil) { move(e, e.x + e.vx, e.y + e.vy, 0.9 * slow, dt); return; }
    const look = 0.12 + (100 - e.r.coverage) * 0.003;
    const tx = w.x + w.vx * look, ty = w.y + w.vy * look + (e.y > w.y + 2.5 ? 1.3 : 0.35);
    move(e, tx, ty, 0.98 * slow, dt);
  }

  _zone(e, dt, slow) {
    const a = e.zone || ZONES[5];
    const ax = FIELD.CX + a.dx, ay = this.los + a.dy;
    let best = null, bd = 99;
    for (const w of this.wr) { const d = Math.hypot(w.x - ax, w.y - ay); if (d < a.r && d < bd) { bd = d; best = w; } }
    if (best) {
      const look = 0.15 + (100 - e.r.awareness) * 0.004;
      move(e, best.x + best.vx * look, Math.max(best.y + best.vy * look + (a.deep ? 1.6 : 0.8), a.deep ? best.y + 1 : -99), 0.95 * slow, dt);
    } else {
      move(e, ax, ay, 0.75 * slow, dt);
    }
  }

  _intercept(e, dt, slow) {
    if (this.t < this.throwT + e.react + (e.role === "DL" ? 0.25 : 0)) { if (e.state === "RUSH") move(e, this.qb.x, this.qb.y, 1, dt); else brake(e, dt, 4); return; }
    e.state = "INTERCEPT";
    const t = this.target; if (!t) return;
    // only men with a realistic chance dive for the ball; everyone else pursues the receiver
    const d = Math.hypot(e.x - t.x, e.y - t.y);
    const w = this.wr[this.thrownTo];
    if (e.role === "DL" && this.t > e.breakAt) move(e, t.x, t.y, 0.8 * slow, dt);
    else if (d < 12 || e.cover === this.thrownTo) move(e, t.x, t.y, 1 * slow, dt);
    else move(e, w.x, w.y, 0.95 * slow, dt);
  }

  _pursue(e, dt, slow) {
    const c = this.carrier; e.state = e.cool > 0 && e.cool > SIM.TACKLE_COOLDOWN - 0.15 ? "TACKLE" : "PURSUE";
    const d = Math.hypot(c.x - e.x, c.y - e.y);
    const lead = Math.min(d / Math.max(4, e.maxSpeed), 1.1) * (0.35 + e.r.awareness / 150);
    move(e, c.x + c.vx * lead, c.y + c.vy * lead, 1.05 * slow, dt);
  }

  _blocker(w, dt) {
    const c = this.carrier;
    let best = null, bd = 16;
    for (const e of this.defenders) {
      if (e.stun > 0 || this.t < e.immuneUntil || this.t < e.blockedUntil) continue;
      if (e.y < c.y - 4) continue;
      const d = Math.hypot(e.x - w.x, e.y - w.y) + Math.max(0, e.y - c.y) * 0.15;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) { move(w, c.x, c.y + 4, 0.8, dt); return; }
    move(w, best.x + best.vx * 0.25, best.y + best.vy * 0.25 - 0.2, 0.92, dt);
    if (Math.hypot(best.x - w.x, best.y - w.y) < SIM.BLOCK_RADIUS && this.t >= best.blockedUntil) {
      best.blockedUntil = this.t + SIM.BLOCK_TIME * (w.r.blocking / 62);
      best.immuneUntil = best.blockedUntil + SIM.BLOCK_TIME * 0.45;
      this.ev("block", { id: best.id });
    }
  }

  _checkSack() {
    const q = this.qb;
    for (const e of this.defenders) {
      if (e.state !== "RUSH" || e.stun > 0) continue;
      if (dist(e, q) < SIM.SACK_RADIUS) { return this._end({ kind: "sack", endX: q.x, endY: q.y, sack: true }); }
    }
    if (this.t >= SIM.MAX_HOLD) this._end({ kind: "sack", endX: q.x, endY: q.y, sack: true, coverageSack: true });
  }

  _flight(dt) {
    const f = this.flight, s = clamp((this.t - f.t0) / f.dur, 0, 1);
    if (s >= 1) this._arrive();
  }

  /** Ball position for rendering (and tests). */
  ballPos() {
    if (this.phase === "flight" || this.phase === "windup") {
      if (this.phase === "windup") return { x: this.qb.x, y: this.qb.y, z: 1.2 };
      const f = this.flight, s = clamp((this.t - f.t0) / f.dur, 0, 1), t = this.target;
      return { x: f.from.x + (t.x - f.from.x) * s, y: f.from.y + (t.y - f.from.y) * s, z: 1.2 + f.arc * 4 * s * (1 - s) };
    }
    if (this.carrier) return { x: this.carrier.x, y: this.carrier.y, z: 0.9 };
    return { x: this.qb.x, y: this.qb.y, z: 1.1 };
  }

  _arrive() {
    const t = this.target, w = this.wr[this.thrownTo];
    const land = { x: t.x, y: t.y };
    const out = land.x < 0.2 || land.x > FIELD.W - 0.2 || land.y > FIELD.LEN - 0.2;
    const rd = dist(w, land);
    // nearest defender who could play the ball
    let dd = 99, dB = null;
    for (const e of this.defenders) { if (e.role === "DL") continue; const d = dist(e, land); if (d < dd) { dd = d; dB = e; } }
    const recReach = rd <= SIM.CATCH_RADIUS && !out;
    const defReach = dd <= SIM.INT_RADIUS && !out;
    this.catchSpot = land;
    if (!recReach && !defReach) return this._incomplete(out ? "out of bounds" : "overthrown", out);
    const recQ = (w.r.catching / 100) * (1 - (rd / SIM.CATCH_RADIUS) * 0.55);
    const defQ = dB ? ((dB.r.coverage * 0.5 + dB.r.awareness * 0.5) / 100) * (1 - (dd / SIM.INT_RADIUS) * 0.55) : 0;
    if (!recReach) { // only a defender in position
      if (this.rng() < defQ * 0.4) return this._intercepted(dB, land);
      return this._incomplete("deflected", false, "deflection");
    }
    if (defReach) {
      const pDef = defQ / (defQ + recQ * 1.15);
      const r = this.rng();
      if (r < pDef * 0.26) return this._intercepted(dB, land);
      if (r < pDef * 0.8) return this._incomplete("broken up", false, "deflection");
    } else if (dd < 2.4) {
      const pBreak = 0.22 * ((dB.r.coverage * 0.5 + dB.r.awareness * 0.5) / 100) * (1 - dd / 2.4);
      if (this.rng() < pBreak) return this._incomplete("broken up", false, "deflection");
    }
    const pDrop = clamp((1 - w.r.catching / 100) * 0.26 + (rd / SIM.CATCH_RADIUS) * 0.08 + (t.pressured ? 0.02 : 0), 0.01, 0.6);
    if (this.rng() < pDrop) return this._incomplete("dropped", false, "drop");
    return this._caught(w, land);
  }

  _incomplete(why, oob = false, kind = "incomplete") {
    this.ev(kind === "drop" ? "drop" : kind === "deflection" ? "deflect" : "incomplete", { why });
    this._end({ kind, why, endX: this.qb.x, endY: this.los, incomplete: true, clockStop: true, oob });
  }
  _intercepted(d, land) {
    this.ev("int", { by: d.id });
    this._end({ kind: "interception", endX: land.x, endY: land.y, interception: true, turnover: true, clockStop: false, by: d.id });
  }
  _caught(w, land) {
    this.phase = "carry"; this.carrier = w; this.catchY = land.y; this.catchX = land.x;
    w.x = land.x; w.y = land.y;
    this.ev("catch", { idx: w.idx, y: land.y });
    for (const e of this.defenders) e.state = "PURSUE";
  }

  _carry(dt) {
    const c = this.carrier, L = this.input.lateral;
    const latMax = SIM.LATERAL_BASE + c.r.agility * SIM.LATERAL_PER_AGILITY;
    const latAcc = (SIM.LATERAL_ACCEL_BASE + c.r.agility * SIM.LATERAL_ACCEL_PER_AGILITY) * (L === 0 ? 1.3 : 1);
    const wantVx = L * latMax, dvx = wantVx - c.vx, mx = latAcc * dt;
    c.vx += Math.abs(dvx) <= mx ? dvx : Math.sign(dvx) * mx;
    const share = Math.min(1, Math.abs(c.vx) / latMax);
    const fwd = c.maxSpeed * SIM.CARRY_SPEED_MULT * (1 - SIM.LATERAL_FORWARD_LOSS * share) * (c.stun > 0 ? 0.4 : 1);
    const dvy = fwd - c.vy, my = c.accel * 0.85 * dt;
    c.vy += Math.abs(dvy) <= my ? dvy : Math.sign(dvy) * my;
    c.x += c.vx * dt; c.y += c.vy * dt;
    // scoring and boundaries
    if (c.y >= FIELD.GOAL_Y) { c.y = FIELD.GOAL_Y; this.ev("td"); return this._end({ kind: "td", td: true, endX: c.x, endY: FIELD.GOAL_Y, caught: true, clockStop: true }); }
    if (c.x <= 0 || c.x >= FIELD.W) { c.x = clamp(c.x, 0, FIELD.W); this.ev("oob"); return this._end({ kind: "oob", endX: c.x, endY: c.y, caught: true, oob: true, clockStop: true }); }
    // tackle attempts
    for (const e of this.defenders) {
      if (e.cool > 0 || e.stun > 0 || this.t < e.blockedUntil) continue;
      if (dist(e, c) > SIM.TACKLE_RADIUS) continue;
      e.cool = SIM.TACKLE_COOLDOWN;
      let gang = 0; for (const o of this.defenders) if (o !== e && o.stun <= 0 && dist(o, c) < 2.4) gang++;
      const p = clamp(SIM.TACKLE_BASE + e.r.tackling * SIM.TACKLE_PER_RATING - c.r.agility * SIM.TACKLE_AGILITY_RESIST + gang * SIM.GANG_BONUS, 0.22, 0.96);
      const r = this.rng();
      if (r < p) { this.ev("tackle", { id: e.id }); return this._end({ kind: "tackle", endX: c.x, endY: c.y, caught: true, tackler: e.id }); }
      if (r < p + (1 - p) * SIM.BROKEN_TACKLE_SHARE) { e.stun = SIM.BROKEN_STUN; c.stun = 0; this.ev("broken", { id: e.id }); }
      else { e.stun = SIM.MISSED_STUN; this.ev("missed", { id: e.id }); }
    }
  }

  _end(res) {
    this.result = { yards: res.endY - this.los, caught: false, td: false, turnover: false, incomplete: false, clockStop: false, oob: false, ...res, elapsed: this.t, playId: this.play.id, coverage: this.coverage };
    this.phase = "dead";
    if (res.kind === "sack") this.ev("sack");
    this.ev("dead", { kind: res.kind });
  }

  // ---------------------------------------------------------------------------------------------
  /** Plain-data view for the renderer. */
  snapshot() {
    const pl = (e) => ({ id: e.id, team: e.team, role: e.role, label: e.label || null, x: e.x, y: e.y, vx: e.vx, vy: e.vy, state: e.state, stun: e.stun > 0, blocked: this.t < e.blockedUntil, ball: e === this.carrier });
    const targets = this.wr.map((w) => ({ idx: w.idx, label: w.label, open: this.separation(w), x: w.x, y: w.y }));
    return {
      t: this.t, phase: this.phase, los: this.los, coverage: this.coverage, players: this.everyone.map(pl), ball: this.ballPos(), targets, thrownTo: this.thrownTo,
      carrierId: this.carrier ? this.carrier.id : null, landing: this.target && (this.phase === "flight" || this.phase === "windup") ? { x: this.target.x, y: this.target.y } : null,
      result: this.result,
    };
  }
}

/** Convenience: run a complete play with a callback deciding throws (used by tests and the opponent simulator). */
export function runPlay(opts, policy) {
  const s = new PlaySim(opts); s.snap();
  let guard = 0;
  while (s.phase !== "dead" && guard++ < 4000) {
    if (policy) policy(s);
    s.step(SIM.DT);
  }
  return s;
}
