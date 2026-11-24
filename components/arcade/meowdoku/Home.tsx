"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Meowdoku home screen: title, a cat to say hi to, and the ways to play (Campaign map, Daily Puzzle, Endless, Shop).
import { useEffect, useState } from "react";
import { propUrl, starUrl, yarnUrl, calendarUrl, flameUrl, loopUrl, cloudUrl, sparkUrl } from "./mapArt";
import { catUrl } from "./sprites";

const TIPS = [
  "Hold and swipe to draw a whole line of X's.",
  "Stuck? A hint explains WHY, not just where.",
  "Everyone gets the same Daily Puzzle. Compare notes!",
  "A Sardine gives you a fish back. Save one for Expert.",
  "Cats can't touch, not even at the corners.",
  "Sweep crosses out every spot your cats rule out.",
  "Clean levels earn 3 stars. Speedy ones earn a bolt.",
  "Double-tap puts a cat. Single tap marks an X.",
];

export type HomeProps = {
  logo: string; area: any; areaIndex: number; stars: number; yarn: number; streak: number; level: number; finished: boolean;
  resume: { title: string; sub: string } | null; daily: { name: string; n: number; done: boolean; stars: number }; endlessBest: number;
  onPlay: () => void; onResume: () => void; onDaily: () => void; onEndless: () => void; onShop: () => void; onHelp: () => void; onSettings: () => void; backHref: string;
};

export default function Home(p: HomeProps) {
  const [tip, setTip] = useState(0), [mood, setMood] = useState<"normal" | "happy">("happy"), [petted, setPetted] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setTip((t) => (t + 1) % TIPS.length), 6500); return () => clearInterval(id); }, []);
  useEffect(() => { const id = window.setInterval(() => { setMood("normal"); window.setTimeout(() => setMood("happy"), 220); }, 3800); return () => clearInterval(id); }, []);   // a blink
  const pet = () => { setPetted((v) => v + 1); setMood("happy"); };
  const title = "MEOWDOKU".split("");
  return (
    <main className="hm" aria-label="Meowdoku home">
      <div className="hm-sky" aria-hidden>
        {[0, 1, 2, 3].map((i) => <img key={i} className="hm-cloud" src={cloudUrl()} alt="" draggable={false} style={{ ["--y" as any]: `${6 + i * 11}%`, ["--s" as any]: 2 + (i % 2), ["--t" as any]: `${46 + i * 14}s`, ["--d" as any]: `${-i * 13}s` }} />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <img key={i} className="hm-spark" src={sparkUrl()} alt="" draggable={false} style={{ left: `${8 + ((i * 37) % 84)}%`, top: `${4 + ((i * 23) % 30)}%`, animationDelay: `${i * 0.55}s` }} />)}
      </div>
      <a className="cg-btn round hm-corner l" href={p.backHref} aria-label="Back to arcade">←</a>
      <div className="hm-corner r"><button className="cg-btn round" onClick={p.onHelp} aria-label="How to play">?</button><button className="cg-btn round" onClick={p.onSettings} aria-label="Settings">⚙</button></div>

      <header className="hm-head">
        <img className="hm-logo" src={p.logo} alt="" draggable={false} />
        <h1 aria-label="Meowdoku">{title.map((ch, i) => <span key={i} style={{ animationDelay: `${i * 90}ms` }}>{ch}</span>)}</h1>
        <p className="hm-sub">THE CAT PUZZLE</p>
      </header>

      <section className="hm-scene" aria-hidden>
        <div className="hm-bubble" key={tip}><span>{petted > 4 ? "Purrrrr..." : TIPS[tip]}</span></div>
        <button className="hm-cat" onClick={pet} tabIndex={-1}><img src={catUrl(mood)} alt="" draggable={false} /></button>
        <div className="hm-ground"><div className="hm-props">{[0, 1, 2, 3, 0, 2].map((k, i) => { const q = propUrl(p.areaIndex, k); return <img key={i} src={q.src} alt="" draggable={false} style={{ width: `calc(${q.w}px * 2)` }} />; })}</div></div>
      </section>

      <nav className="hm-menu" aria-label="Ways to play">
        {p.resume ? (<>
          <button className="hm-btn primary" onClick={p.onResume}><span className="t">CONTINUE</span><span className="s">{p.resume.title} · {p.resume.sub}</span></button>
          <button className="hm-btn" onClick={p.onPlay}><span className="t">WORLD MAP</span><span className="s">Level {Math.min(p.level, 100)} · {p.area.name}</span></button>
        </>) : (
          <button className="hm-btn primary" onClick={p.onPlay}><span className="t">{p.level > 1 ? "PLAY" : "START"}</span><span className="s">{p.finished ? "All 100 levels cleared!" : `Level ${p.level} · ${p.area.name}`}</span></button>
        )}
        <div className="hm-two">
          <button className={`hm-btn daily ${p.daily.done ? "done" : ""}`} onClick={p.onDaily}><img src={calendarUrl()} alt="" draggable={false} /><span className="t">DAILY</span><span className="s">{p.daily.done ? "Done today ✓" : `${p.daily.name}`}</span>{p.streak > 0 && <em className="hm-streak"><img src={flameUrl()} alt="" draggable={false} />{p.streak}</em>}</button>
          <button className="hm-btn endless" onClick={p.onEndless}><img src={loopUrl()} alt="" draggable={false} /><span className="t">ENDLESS</span><span className="s">Any size · any level</span></button>
        </div>
        <div className="hm-stats">
          <span title="Stars"><img src={starUrl(true)} alt="" draggable={false} /><b>{p.stars}</b><small>STARS</small></span>
          <button className="hm-shop" onClick={p.onShop} aria-label={`Shop, ${p.yarn} yarn`}><img src={yarnUrl()} alt="" draggable={false} /><b>{p.yarn}</b><small>SHOP</small></button>
          <span title="Best daily streak"><img src={flameUrl()} alt="" draggable={false} /><b>{p.streak}</b><small>STREAK</small></span>
        </div>
      </nav>
    </main>
  );
}
