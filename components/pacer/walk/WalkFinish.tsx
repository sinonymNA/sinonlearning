"use client";
// After a walk: type the steps Apple Health shows now, and Pacer works out the steps, distance and calories of the workout itself.
import { useMemo, useState } from "react";
import { walkCalories, checkSteps, cadenceNote } from "../../../lib/pacer/walk.mjs";
import type { WalkResult } from "../../../lib/pacer/walkSession";
import { latestKg, uid, type WalkData } from "./store";
import { mmss } from "./WalkBar";

const toNum = (s: string) => { const t = s.replace(/[,\s]/g, ""); return t === "" ? null : Number(t); };

export default function WalkFinish({ result, data, setData, bookTitle, theme, onClose }: { result: WalkResult; data: WalkData; setData: (fn: (d: WalkData) => WalkData) => void; bookTitle: string; theme: string; onClose: () => void }) {
  const [before, setBefore] = useState(data.meta?.stepsBefore != null ? String(data.meta.stepsBefore) : ""), [after, setAfter] = useState("");
  const kg = latestKg(data), mins = result.totalSec / 60, b = toNum(before), a = toNum(after);
  const typed = after.trim() !== "" || before.trim() !== "", problem = typed ? checkSteps({ before: b ?? NaN, after: a ?? NaN, minutes: mins }) : null;
  const usable = typed && !problem && b != null && a != null;
  const calc = useMemo(() => walkCalories({ slowSec: result.slowSec, fastSec: result.fastSec, kg, heightCm: data.heightCm, steps: usable ? (a as number) - (b as number) : null }), [result, kg, data.heightCm, usable, a, b]);
  const save = () => {
    setData((d) => ({ ...d, meta: null, sessions: [{ id: uid(), start: result.startedAt, slowSec: result.slowSec, fastSec: result.fastSec, totalSec: result.totalSec, completed: result.completed, kcal: calc.kcal, steps: calc.steps, distM: calc.distM, basis: calc.basis as "steps" | "time", book: bookTitle }, ...d.sessions] }));
    onClose();
  };
  const mi = data.units === "imperial", dist = mi ? (calc.distM / 1609.344).toFixed(2) + " mi" : (calc.distM / 1000).toFixed(2) + " km";
  return (
    <div className="pc-root pc-sans pw-theme" data-theme={theme}>
    <div className="pc-modal pc-modal-lib pw-finish" role="dialog" aria-label="Walk finished">
      <div className="pc-card">
        <h2>{result.completed ? "Nice work. Walk complete." : "Walk ended"}</h2>
        <p className="mut" style={{ margin: "0 0 10px" }}>{mmss(result.totalSec)} total · {mmss(result.fastSec)} brisk · {mmss(result.slowSec)} easy{bookTitle ? ` · listened to “${bookTitle.slice(0, 40)}”` : ""}</p>
        <div className="pw-grid">
          <label>Steps in Apple Health before<input inputMode="numeric" value={before} onChange={(e) => setBefore(e.target.value)} placeholder="e.g. 4,200" aria-label="Steps before the walk" /></label>
          <label>Steps in Apple Health now<input inputMode="numeric" value={after} onChange={(e) => setAfter(e.target.value)} placeholder="e.g. 7,900" aria-label="Steps after the walk" autoFocus /></label>
        </div>
        <p className="mut small">Open Health, Steps, and use today&apos;s total. It can take a minute to catch up after you stop. Leave both blank to use an estimate from time alone.</p>
        {problem && <p className="pc-err small" role="alert">{problem}</p>}
        <div className="pw-results" role="status">
          <div><b>{calc.kcal}</b><span>{calc.kcal === 1 ? "calorie" : "calories"}</span></div><div><b>{calc.steps.toLocaleString()}</b><span>{calc.basis === "steps" ? "steps" : "steps (est.)"}</span></div><div><b>{dist}</b><span>{calc.basis === "steps" ? "distance" : "distance (est.)"}</span></div>
        </div>
        <p className="mut small">{calc.basis === "steps" ? `Worked out from ${calc.steps.toLocaleString()} steps, your height (${Math.round(data.heightCm)} cm) and weight (${kg.toFixed(1)} kg): about ${calc.kcalFast} brisk and ${calc.kcalSlow} easy. ` : "Estimated from time, assuming a typical easy and brisk pace. "}{calc.cadence ? `${calc.cadence} steps a minute on average. ${cadenceNote(calc.cadence)} ` : ""}It is a rough estimate, not a measurement.{!data.weights.length ? " Add your weight in the Weight tab for a better estimate." : ""}</p>
        <div className="pc-col"><button className="pc-btn pri" onClick={save} disabled={typed && !usable && !!problem}>Save workout</button><button className="pc-btn" onClick={() => { setData((d) => ({ ...d, meta: null })); onClose(); }}>Don&apos;t save</button></div>
      </div>
    </div>
    </div>
  );
}
