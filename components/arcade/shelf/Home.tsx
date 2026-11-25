"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Shelf Stocker home screen: a swinging shop sign, a display stack you can tap, PLAY, the Daily Delivery, level picker, shop decorating, department progress and stats.
// Whatever you have bought in the decor shop shows here (awning, sign style, plant, pet, rug).
import { useEffect, useRef } from "react";
import Link from "next/link";
import { itemUrl, iconUrl, coinUrl, plantUrl, petUrl } from "./sprites";
import { play } from "./audio";
import { DEPTS } from "../../../arcade-server/shelf/index.mjs";

type Props = { profile: any; level: number; dept: number; resume: { sub: string } | null; dailyDone: boolean; dailySub: string; streak: number; onPlay: () => void; onDaily: () => void; onLevels: () => void; onDecor: () => void; onHelp: () => void; onSettings: () => void };
const DISPLAY: ["shirt" | "book", number][] = [["book", 0], ["shirt", 6], ["book", 2], ["shirt", 0], ["shirt", 2]];
const ICONS = ["hanger", "books", "cart", "toy", "jar", "shoe", "gift", "bag", "lock"];

export default function Home({ profile, level, dept, resume, dailyDone, dailySub, streak, onPlay, onDaily, onLevels, onDecor, onHelp, onSettings }: Props) {
  const stack = useRef<HTMLDivElement>(null), busy = useRef(false), eq = profile.decor?.equipped || {};
  const hop = (i: number, sound = true) => {
    const el = stack.current?.children[DISPLAY.length - 1 - i] as HTMLElement | undefined; if (!el || el.getAnimations().length) return;
    el.animate([{ transform: "translateY(0) scale(1,1)" }, { transform: "translateY(-26px) scale(.95,1.07)", offset: 0.35 }, { transform: "translateY(0) scale(1.08,.88)", offset: 0.72 }, { transform: "translateY(0) scale(1,1)" }], { duration: 520, easing: "cubic-bezier(.3,1.4,.5,1)" });
    if (sound) { play("pick"); window.setTimeout(() => play("put", 1), 300); }
  };
  useEffect(() => { const id = window.setInterval(() => { if (!busy.current && !document.hidden) hop(Math.floor(Math.random() * DISPLAY.length), false); }, 2600); return () => clearInterval(id); }, []);   // the display stack comes to life now and then
  const starsIn = (d: number) => { let n = 0; for (let l = d * 10 + 1; l <= d * 10 + 10; l++) n += profile.stars[l] || 0; return n; };
  return (
    <main className="sh-home" aria-label="Shelf Stocker home">
      {eq.awning && eq.awning !== "none" && <div className={`sh-awning ${eq.awning}`} aria-hidden />}
      <Link href="/arcade" className="sh-btn round sh-hl" aria-label="Back to the arcade">←</Link>
      <button className="sh-btn round sh-hr" onClick={onSettings} aria-label="Settings">⚙</button>
      <header className="sh-signwrap"><div className={`sh-sign sign-${eq.sign || "wood"}`}><i className="rope l" /><i className="rope r" /><h1>SHELF<br />STOCKER</h1><p>Stock the shelves. Sort everything.</p></div></header>
      <section className="sh-display" aria-hidden>
        {eq.rug && eq.rug !== "none" && <div className={`sh-rug ${eq.rug}`} />}
        {eq.plant && eq.plant !== "none" && <img className={`sh-hplant ${eq.plant}`} src={plantUrl()} alt="" draggable={false} />}
        <div className="sh-dbay"><div ref={stack} className="sh-dstack">{DISPLAY.map(([kind, v], i) => <img key={i} src={itemUrl(kind, v)} alt="" draggable={false} onClick={() => { busy.current = true; hop(i); window.setTimeout(() => { busy.current = false; }, 900); }} />)}</div></div>
        {eq.pet && eq.pet !== "none" && <img className="sh-hpet" src={petUrl(eq.pet)} alt="" draggable={false} onClick={() => play("coin")} />}
      </section>
      <nav className="sh-hmenu" aria-label="Menu">
        <button className="sh-btn go big sh-play" onClick={onPlay}><b>{resume ? "CONTINUE" : "PLAY"}</b><small>{resume ? resume.sub : `Level ${level} · ${DEPTS[dept].name}`}</small></button>
        <div className="sh-three">
          <button className={`sh-btn sh-daily ${dailyDone ? "done" : ""}`} onClick={onDaily}><b>DAILY</b><small>{dailyDone ? "Done today ✓" : dailySub}</small>{streak > 0 && <em className="sh-streak">🔥 {streak}</em>}</button>
          <button className="sh-btn" onClick={onLevels}><b>LEVELS</b><small>{DEPTS.length} departments</small></button>
          <button className="sh-btn sh-decorbtn" onClick={onDecor}><b>DECORATE</b><small><img src={coinUrl()} alt="" draggable={false} /> {profile.coins}</small></button>
        </div>
        <div className="sh-depts" role="list">{DEPTS.map((d: any, i: number) => <div key={d.id} role="listitem" aria-label={`${d.name}, ${starsIn(i)} of 30 stars`} className={`sh-dept ${i === dept ? "here" : ""}`}><img src={iconUrl(ICONS[i])} alt="" draggable={false} /><span className="bar"><i style={{ width: `${(starsIn(i) / 30) * 100}%` }} /></span></div>)}</div>
        <p className="sh-deptcap"><b>{DEPTS[dept].name}</b> · ★ {starsIn(dept)}/30 · <button className="sh-link" onClick={onHelp}>how to play</button></p>
        <div className="sh-hstats"><span><b>★ {Object.values(profile.stars as Record<string, number>).reduce((a, b) => a + b, 0)}</b> stars</span><span><b>{profile.solved}</b> stocked</span><span><b>{Object.keys(profile.perfect || {}).length}</b> perfect</span></div>
      </nav>
    </main>
  );
}
