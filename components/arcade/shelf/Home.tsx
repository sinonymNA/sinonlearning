"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Shelf Stocker home screen: a swinging shop sign, a display stack you can tap, PLAY / CONTINUE, department progress and stats.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { itemUrl, iconUrl } from "./sprites";
import { sfx, tone } from "../prefs";
import { DEPTS } from "../../../arcade-server/shelf/index.mjs";

type Props = { profile: any; level: number; dept: number; resume: { sub: string } | null; onPlay: () => void; onLevels: () => void; onHelp: () => void; onSettings: () => void };
const DISPLAY: ["shirt" | "book", number][] = [["book", 0], ["shirt", 6], ["book", 2], ["shirt", 0], ["shirt", 2]];

export default function Home({ profile, level, dept, resume, onPlay, onLevels, onHelp, onSettings }: Props) {
  const stack = useRef<HTMLDivElement>(null), busy = useRef(false);
  const hop = (i: number, sound = true) => {
    const el = stack.current?.children[DISPLAY.length - 1 - i] as HTMLElement | undefined; if (!el || el.getAnimations().length) return;
    el.animate([{ transform: "translateY(0) scale(1,1)" }, { transform: "translateY(-26px) scale(.95,1.07)", offset: 0.35 }, { transform: "translateY(0) scale(1.08,.88)", offset: 0.72 }, { transform: "translateY(0) scale(1,1)" }], { duration: 520, easing: "cubic-bezier(.3,1.4,.5,1)" });
    if (sound) { tone(360 + i * 70, 0.07, "triangle", 0.1); window.setTimeout(() => tone(150, 0.08, "sine", 0.16), 300); }
  };
  useEffect(() => { const id = window.setInterval(() => { if (!busy.current && !document.hidden) hop(Math.floor(Math.random() * DISPLAY.length), false); }, 2600); return () => clearInterval(id); }, []);   // the display stack comes to life now and then
  const starsIn = (d: number) => { let n = 0; for (let l = d * 10 + 1; l <= d * 10 + 10; l++) n += profile.stars[l] || 0; return n; };
  const icons = ["hanger", "books", "cart"];
  return (
    <main className="sh-home" aria-label="Shelf Stocker home">
      <Link href="/arcade" className="sh-btn round sh-hl" aria-label="Back to the arcade">←</Link>
      <button className="sh-btn round sh-hr" onClick={onSettings} aria-label="Settings">⚙</button>
      <header className="sh-signwrap"><div className="sh-sign"><i className="rope l" /><i className="rope r" /><h1>SHELF<br />STOCKER</h1><p>Stock the shelves. Sort everything.</p></div></header>
      <section className="sh-display" aria-hidden>
        <div className="sh-dbay"><div ref={stack} className="sh-dstack">{DISPLAY.map(([kind, v], i) => <img key={i} src={itemUrl(kind, v)} alt="" draggable={false} onClick={() => { busy.current = true; hop(i); window.setTimeout(() => { busy.current = false; }, 900); sfx("pop"); }} />)}</div></div>
      </section>
      <nav className="sh-hmenu" aria-label="Menu">
        <button className="sh-btn go big sh-play" onClick={onPlay}><b>{resume ? "CONTINUE" : "PLAY"}</b><small>{resume ? resume.sub : `Level ${level} · ${DEPTS[dept].name}`}</small></button>
        <div className="sh-two"><button className="sh-btn" onClick={onLevels}>LEVELS</button><button className="sh-btn" onClick={onHelp}>HOW TO PLAY</button></div>
        <div className="sh-depts" role="list">{DEPTS.map((d: any, i: number) => <div key={d.id} role="listitem" className={`sh-dept ${i === dept ? "here" : ""}`}><img src={iconUrl(icons[i])} alt="" draggable={false} /><b>{d.name}</b><span className="bar"><i style={{ width: `${(starsIn(i) / 30) * 100}%` }} /></span><small>★ {starsIn(i)}/30</small></div>)}</div>
        <div className="sh-hstats"><span><b>★ {Object.values(profile.stars as Record<string, number>).reduce((a, b) => a + b, 0)}</b> stars</span><span><b>{profile.solved}</b> levels stocked</span></div>
      </nav>
    </main>
  );
}
