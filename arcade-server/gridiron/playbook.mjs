import { FIELD } from "./config.mjs";

// Eight offensive plays. Receivers are listed LEFT -> RIGHT, which is also their A/B/C/D button order.
// start: {x: offset from field centre, dy: yards relative to the line of scrimmage (negative = behind it)}.
// route: waypoints as cumulative {dx: yards to the right, dy: yards downfield} from the receiver's start.
// kind: "pass" plays are routes; "screen" plays have a short pass behind the line and the rest block.
const S = (x, dy = 0) => ({ x, dy });
const W = (...pts) => pts.map(([dx, dy]) => ({ dx, dy }));

export const PLAYBOOK = [
  { id: "slants", name: "Slants", blurb: "Quick, short and in. Beats man coverage.", kind: "pass", depth: "short",
    receivers: [{ start: S(-20), route: W([5, 3], [9, 8], [10, 13]) }, { start: S(-12, -0.5), route: W([4, 3], [7, 7], [8, 12]) }, { start: S(12, -0.5), route: W([-4, 3], [-7, 7], [-8, 12]) }, { start: S(20), route: W([-5, 3], [-9, 8], [-10, 13]) }] },
  { id: "verts", name: "Four Verticals", blurb: "Everyone deep. High risk, big yards.", kind: "pass", depth: "deep",
    receivers: [{ start: S(-21), route: W([0, 12], [1, 24], [1, 38]) }, { start: S(-8, -0.5), route: W([0, 10], [-1, 24], [-1, 38]) }, { start: S(8, -0.5), route: W([0, 10], [1, 24], [1, 38]) }, { start: S(21), route: W([0, 12], [-1, 24], [-1, 38]) }] },
  { id: "mesh", name: "Mesh", blurb: "Two shallow crossers rub off defenders.", kind: "pass", depth: "short",
    receivers: [{ start: S(-20), route: W([0, 4], [14, 5], [22, 6]) }, { start: S(-10, -0.5), route: W([0, 12], [-3, 18], [-3, 28]) }, { start: S(10, -0.5), route: W([0, 12], [3, 18], [3, 28]) }, { start: S(20), route: W([0, 4], [-14, 5], [-22, 6]) }] },
  { id: "flood", name: "Flood", blurb: "Three levels to one side.", kind: "pass", depth: "mid",
    receivers: [{ start: S(-20), route: W([0, 4], [-1, 14], [-4, 26]) }, { start: S(-9, -0.5), route: W([-5, 3], [-9, 3.5]) }, { start: S(9, -0.5), route: W([0, 9], [10, 10], [16, 10.5]) }, { start: S(20), route: W([0, 12], [-8, 20], [-18, 24]) }] },
  { id: "curls", name: "Curls", blurb: "Run, stop, turn. Reliable 10 yards.", kind: "pass", depth: "mid",
    receivers: [{ start: S(-20), route: W([0, 11], [1.5, 9]) }, { start: S(-9, -0.5), route: W([0, 12], [-1.5, 10]) }, { start: S(9, -0.5), route: W([0, 12], [1.5, 10]) }, { start: S(20), route: W([0, 11], [-1.5, 9]) }] },
  { id: "outs", name: "Outs", blurb: "Break to the sideline. Stops the clock.", kind: "pass", depth: "mid",
    receivers: [{ start: S(-20), route: W([0, 9], [-9, 10]) }, { start: S(-8, -0.5), route: W([0, 6], [-8, 7]) }, { start: S(8, -0.5), route: W([0, 6], [8, 7]) }, { start: S(20), route: W([0, 9], [9, 10]) }] },
  { id: "post", name: "Post", blurb: "Deep shot at the middle of the field.", kind: "pass", depth: "deep",
    receivers: [{ start: S(-20), route: W([0, 13], [9, 26], [12, 36]) }, { start: S(-8, -0.5), route: W([0, 5], [6, 6], [10, 7]) }, { start: S(8, -0.5), route: W([0, 5], [-6, 6], [-10, 7]) }, { start: S(20), route: W([0, 13], [-9, 26], [-12, 36]) }] },
  { id: "screen", name: "Screen", blurb: "Catch behind the line, run behind blockers.", kind: "screen", depth: "short",
    receivers: [{ start: S(-20), route: W([4, -1], [6, -1.5]) }, { start: S(-9, -0.5), route: W([-1, 3], [-2, 5]) }, { start: S(9, -0.5), route: W([1, 3], [2, 5]) }, { start: S(20), route: W([0, 10], [-3, 18]) }] },
  { id: "dive", name: "Dive", blurb: "Hand it off and hit the gap. Juke the second level.", kind: "run", depth: "short", rbX: 0,
    receivers: [{ start: S(-20), route: W([2, 4], [4, 8]) }, { start: S(-12, -0.5), route: W([1, 3], [2, 7]) }, { start: S(12, -0.5), route: W([-1, 3], [-2, 7]) }, { start: S(20), route: W([-2, 4], [-4, 8]) }] },
  { id: "sweep", name: "Sweep", blurb: "Bounce it outside, follow your blockers, then juke.", kind: "run", depth: "short", rbX: 3,
    receivers: [{ start: S(-20), route: W([4, 3], [9, 6]) }, { start: S(-12, -0.5), route: W([4, 3], [9, 5]) }, { start: S(12, -0.5), route: W([-3, 2], [-6, 6]) }, { start: S(20), route: W([-5, 3], [-9, 7]) }] },
  // ---- Student-designed plays (drawn by a student on paper; names kept exactly as written). Routes are our reading of the drawing.
  { id: "smash", name: "smash", blurb: "Student play. Hitch underneath, corner over the top.", kind: "pass", depth: "mid", student: true,
    receivers: [{ start: S(-20), route: W([0, 7], [0, 6.5]) }, { start: S(-11, -0.5), route: W([0, 8], [-7, 16]) }, { start: S(11, -0.5), route: W([0, 8], [7, 16]) }, { start: S(20), route: W([0, 7], [0, 6.5]) }] },
  { id: "bb", name: "bb", blurb: "Student play. Quick bubble out wide, then run.", kind: "screen", depth: "short", student: true,
    receivers: [{ start: S(-20), route: W([-3, -1], [-5, -1.5]) }, { start: S(-10, -0.5), route: W([0, 6], [-4, 12]) }, { start: S(10, -0.5), route: W([0, 6], [4, 12]) }, { start: S(20), route: W([3, -1], [5, -1.5]) }] },
  { id: "turtle", name: "turtle", blurb: "Student play. Slow and safe: everyone sits down short.", kind: "pass", depth: "short", student: true,
    receivers: [{ start: S(-20), route: W([2, 5], [2, 4]) }, { start: S(-8, -0.5), route: W([0, 4], [-2, 3]) }, { start: S(8, -0.5), route: W([0, 4], [2, 3]) }, { start: S(20), route: W([-2, 5], [-2, 4]) }] },
  { id: "chicken", name: "chicken", blurb: "Student play. Zig-zag routes that make defenders flap.", kind: "pass", depth: "mid", student: true,
    receivers: [{ start: S(-20), route: W([0, 6], [5, 9], [0, 13], [5, 17]) }, { start: S(-9, -0.5), route: W([0, 5], [-4, 8], [0, 12]) }, { start: S(9, -0.5), route: W([0, 5], [4, 8], [0, 12]) }, { start: S(20), route: W([0, 6], [-5, 9], [0, 13], [-5, 17]) }] },
  { id: "turky", name: "turky", blurb: "Student play. Wide receivers fly, inside guys sneak out.", kind: "pass", depth: "deep", student: true,
    receivers: [{ start: S(-20), route: W([-1, 14], [-2, 30]) }, { start: S(-9, -0.5), route: W([0, 4], [-9, 6]) }, { start: S(9, -0.5), route: W([0, 4], [9, 6]) }, { start: S(20), route: W([1, 14], [2, 30]) }] },
  { id: "dagoat", name: "dagoat", blurb: "Student play. Two go routes and two posts. Greatest of all time or bust.", kind: "pass", depth: "deep", student: true,
    receivers: [{ start: S(-20), route: W([0, 14], [-1, 34]) }, { start: S(-9, -0.5), route: W([0, 9], [8, 20], [10, 30]) }, { start: S(9, -0.5), route: W([0, 9], [-8, 20], [-10, 30]) }, { start: S(20), route: W([0, 14], [1, 34]) }] },
  { id: "idk", name: "idk", blurb: "Student play. Nobody knows where they are going, including the defense.", kind: "pass", depth: "mid", student: true,
    receivers: [{ start: S(-20), route: W([4, 5], [-2, 10], [3, 15]) }, { start: S(-9, -0.5), route: W([0, 10], [6, 8]) }, { start: S(9, -0.5), route: W([-3, 4], [4, 12], [6, 22]) }, { start: S(20), route: W([0, 12], [-8, 14]) }] },
  { id: "cutter", name: "cutter", blurb: "Student play. Run a few yards, then cut hard across the field.", kind: "pass", depth: "mid", student: true,
    receivers: [{ start: S(-20), route: W([0, 10], [12, 12]) }, { start: S(-9, -0.5), route: W([0, 7], [-8, 8]) }, { start: S(9, -0.5), route: W([0, 7], [8, 8]) }, { start: S(20), route: W([0, 10], [-12, 12]) }] },
  { id: "turky2", name: "turky2", blurb: "Student play. The sequel: inside guys go deep, wide guys cross.", kind: "pass", depth: "deep", student: true,
    receivers: [{ start: S(-20), route: W([0, 5], [12, 7]) }, { start: S(-9, -0.5), route: W([0, 14], [-2, 32]) }, { start: S(9, -0.5), route: W([0, 14], [2, 32]) }, { start: S(20), route: W([0, 5], [-12, 7]) }] },
];
export const getPlay = (id) => PLAYBOOK.find((p) => p.id === id);

// Defensive packages. The computer picks one each snap: man (DBs shadow receivers), zone (Cover-3 style), blitz (a LB rushes).
export const COVERAGES = ["man", "zone", "blitz"];
/** Zone anchors as {dx from centre, dy from LOS, r radius, deep}. Four DBs + three LBs. */
export const ZONES = [
  { dx: -17, dy: 17, r: 10, deep: true }, { dx: 0, dy: 20, r: 12, deep: true }, { dx: 17, dy: 17, r: 10, deep: true }, { dx: 13, dy: 6, r: 7, deep: false },
  { dx: -9, dy: 7, r: 7, deep: false }, { dx: 0, dy: 8, r: 7, deep: false }, { dx: 9, dy: 7, r: 7, deep: false },
];
export const FORMATION = { olX: [-4, -2, 0, 2, 4], dlX: [-4.5, -1.5, 1.5, 4.5], lbX: [-9, 0, 9] };
export const centreX = FIELD.CX;
