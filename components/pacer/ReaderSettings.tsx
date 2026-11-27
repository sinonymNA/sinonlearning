"use client";
import type { Settings } from "../../lib/pacer/store";

const Seg = <T extends string | number>({ value, opts, on }: { value: T; opts: [T, string][]; on: (v: T) => void }) => (
  <div className="pc-seg" role="group">{opts.map(([v, label]) => <button key={String(v)} aria-pressed={value === v} onClick={() => on(v)}>{label}</button>)}</div>
);
/** The settings drawer. */
export default function ReaderSettings({ s, set, close }: { s: Settings; set: (s: Settings) => void; close: () => void }) {
  const up = (p: Partial<Settings>) => set({ ...s, ...p });
  return (
    <aside className="pc-drawer" aria-label="Reader settings">
      <div className="pc-row" style={{ justifyContent: "space-between" }}><h3>Settings</h3><button className="pc-btn" onClick={close}>Done</button></div>
      <div className="pc-field"><span className="lb">Theme</span><Seg value={s.theme} on={(v) => up({ theme: v })} opts={[["paper", "Paper"], ["sepia", "Sepia"], ["night", "Night"], ["contrast", "High contrast"]]} /></div>
      <div className="pc-field"><span className="lb">Font</span><Seg value={s.font} on={(v) => up({ font: v })} opts={[["serif", "Serif"], ["sans", "Sans"], ["mono", "Mono"]]} /></div>
      <div className="pc-field"><label htmlFor="pc-size">Text size: {s.size}px</label><input id="pc-size" type="range" min={16} max={44} value={s.size} onChange={(e) => up({ size: +e.target.value })} /></div>
      <div className="pc-field"><span className="lb">Line width (Pacer and Scroll)</span><Seg value={s.width} on={(v) => up({ width: v })} opts={[["narrow", "Narrow"], ["medium", "Medium"], ["wide", "Wide"]]} /></div>
      <div className="pc-field"><span className="lb">Words at a time (Focus)</span><Seg value={s.chunk} on={(v) => up({ chunk: v })} opts={[[1, "1"], [2, "2"], [3, "3"]]} /><small>Showing 2 or 3 words at once is easier to follow, and it is how fast readers actually read.</small></div>
      <label className="pc-toggle"><input type="checkbox" checked={s.smart} onChange={(e) => up({ smart: e.target.checked })} /><span><b>Smart pauses</b><br /><small>Linger a touch on long words, commas and sentence ends, like a real voice.</small></span></label>
      <label className="pc-toggle"><input type="checkbox" checked={s.dim} onChange={(e) => up({ dim: e.target.checked })} /><span><b>Dim the rest of the page</b><br /><small>Only the paragraph you are in stays bright (Pacer and Scroll).</small></span></label>
      <h3>Training</h3>
      <label className="pc-toggle"><input type="checkbox" checked={s.ramp} onChange={(e) => up({ ramp: e.target.checked })} /><span><b>Warm-up ramp</b><br /><small>Start at your speed and gently climb 10 wpm every 100 words, up to a limit you choose.</small></span></label>
      {s.ramp && <div className="pc-field"><label htmlFor="pc-rmax">Ramp up to {s.rampMax} wpm</label><input id="pc-rmax" type="range" min={150} max={900} step={10} value={s.rampMax} onChange={(e) => up({ rampMax: +e.target.value })} /></div>}
      <div className="pc-field"><span className="lb">Recall check-ins</span><Seg value={s.checks} on={(v) => up({ checks: v })} opts={[[0, "Off"], [250, "250"], [500, "500"], [1000, "1000"]]} /><small>Every so many words Pacer pauses and asks you to retell the last part. Miss it and the speed drops; get three in a row and it climbs.</small></div>
    </aside>
  );
}
