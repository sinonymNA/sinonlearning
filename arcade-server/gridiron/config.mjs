// Retro Gridiron: every tunable number lives here. Units: yards and seconds.
// World coordinates: x runs 0..53.3 across the field (left->right); y runs 0..120 DOWNFIELD (0 = back of our end zone,
// 10 = our goal line, 110 = their goal line, 120 = back of their end zone). The renderer draws "downfield" toward the top.
export const FIELD = { W: 53.3, LEN: 120, END: 10, CX: 26.65, GOAL_Y: 110 };
export const yardlineToY = (yl) => FIELD.END + yl;            // yl = yards from own goal line (0..100)
export const yToYardline = (y) => y - FIELD.END;

export const SIM = {
  DT: 1 / 30,
  QB_DROP_YARDS: 5.5, QB_DROP_TIME: 0.7, GAME_SPEED: 1.2,
  MAX_HOLD: 6.5,                       // seconds the pocket lasts at most (coverage sack)
  BALL_SPEED_BASE: 24, BALL_SPEED_PER_ARM: 0.15, RELEASE_DELAY: 0.18,
  PASS_ERR_BASE: 0.14, PASS_ERR_PER_INACC: 0.03, PRESSURE_ERR_MULT: 1.5, PRESSURE_RADIUS: 3.6,
  SPEED_BASE: 5.2, SPEED_PER_RATING: 0.04,
  ACCEL_BASE: 9, ACCEL_PER_RATING: 0.1,
  CATCH_RADIUS: 3.2, INT_RADIUS: 1.7, CONTEST_RADIUS: 2.2, AIM_ASSIST: 3.4,
  BLOCK_BREAK_BASE: 2.5, BLOCK_BREAK_RATING_SCALE: 0.03, BLOCK_BREAK_JITTER: 0.55, BLOCKED_ADVANCE_SPEED: 0.7,
  SACK_RADIUS: 1.15,
  CARRY_SPEED_MULT: 0.93, LATERAL_BASE: 4.6, LATERAL_PER_AGILITY: 0.03, LATERAL_ACCEL_BASE: 11, LATERAL_ACCEL_PER_AGILITY: 0.1, LATERAL_FORWARD_LOSS: 0.24,
  TACKLE_RADIUS: 1.25, TACKLE_COOLDOWN: 0.45, TACKLE_BASE: 0.6, TACKLE_PER_RATING: 0.0045, TACKLE_AGILITY_RESIST: 0.0035, GANG_BONUS: 0.13,
  BROKEN_TACKLE_SHARE: 0.45, BROKEN_STUN: 0.9, MISSED_STUN: 0.5, BLOCK_SLOW: 0.3, BLOCK_TIME: 0.9, BLOCK_RADIUS: 1.3,
  RUN_DL_BLOCK: 1.6, RUN_LB_BLOCK: 0.6, REACTION_BASE: 0.12, REACTION_PER_INAWARE: 0.006,
};

export const RULES = {
  QUARTER_SECONDS: { quick: 240, twoMinute: 120 },
  SNAP_BURN: { quick: 12, twoMinute: 8 },           // game-clock seconds that run off between plays (in-bounds)
  START_YARDLINE: 25, TOUCHBACK_YARDLINE: 25,
  TD: 6, XP: 1, FG: 3, SAFETY: 2,
  PUNT_MEAN: 40, PUNT_SD: 7,
  FG_RANGE: 56,                                      // max kick distance in yards
};

const R = (v) => v;
export const OFFENSE = {
  qb: { name: "QB", accuracy: 74, arm: 72, throwSpeed: 70 },
  wr: [
    { name: "A", speed: 80, accel: 78, catching: 70, route: 76, agility: 82, blocking: 55 },
    { name: "B", speed: 72, accel: 70, catching: 80, route: 80, agility: 70, blocking: 62 },
    { name: "C", speed: 76, accel: 74, catching: 74, route: 72, agility: 74, blocking: 58 },
    { name: "D", speed: 86, accel: 84, catching: 64, route: 66, agility: 78, blocking: 50 },
  ],
  ol: { blocking: 70 },
};
export const DEFENSE = {
  dl: { rush: 68, tackling: 66, speed: 66, awareness: 62, coverage: 40, agility: 60 },
  lb: { rush: 60, tackling: 70, speed: 70, awareness: 66, coverage: 62, agility: 64 },
  db: { rush: 30, tackling: 66, speed: 76, awareness: 68, coverage: 72, agility: 74 },
};
export const OPPONENT = {
  easy: { off: 58, def: 58, name: "Rookies" }, normal: { off: 70, def: 70, name: "Rivals" }, hard: { off: 82, def: 82, name: "Legends" },
};
export const TEAMS = {
  you: { name: "Pixel Pros", color: "#3b82f6", trim: "#ffffff", short: "PXL" },
  cpu: { name: "Gridlock Bulls", color: "#e5484d", trim: "#ffe08a", short: "GLB" },
};
export { R };
