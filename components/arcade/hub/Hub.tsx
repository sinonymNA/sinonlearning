"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "../Avatar";
import GameArt from "../GameArt";
import PotatoSvg from "../PotatoSvg";
import QuickJoin from "../QuickJoin";
import { PrefsProvider } from "../prefs";
import { api } from "../useRoom";
import TiltCard from "./Tilt";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
function useHubData() {
  const [me, setMe] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [ab, setAb] = useState<any>(null);
  useEffect(() => {
    api("/api/arcade/economy", { type: "me" }).then(setMe).catch(() => setMe({ signedIn: false }));
    api("/api/arcade/daily", { type: "get" }).then(setDaily).catch(() => setDaily(null));
    api("/api/arcade/abyss", { type: "home" }).then(setAb).catch(() => setAb(null));
  }, []);
  return { me, daily, ab };
}

const Stagger = ({ i, children, className = "" }: { i: number; children: React.ReactNode; className?: string }) => <div className={`hb-in ${className}`} style={{ animationDelay: `${i * 90}ms` }}>{children}</div>;
export const HubTitle = ({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) => (
  <header className="hb-head">
    <p className="hb-kicker">{kicker}</p>
    <h1 className="hb-title">{title}</h1>
    {sub && <p className="hb-sub">{sub}</p>}
  </header>
);

/* ---------- animated portal art ---------- */
function SoloArt() {
  return (
    <div className="art-solo" aria-hidden>
      <i className="bub b1" /><i className="bub b2" /><i className="bub b3" /><i className="bub b4" />
      <div className="art-float"><Avatar id="f-bubbles" size={118} /></div>
      <span className="art-wave" />
    </div>
  );
}
function MultiArt() {
  return (
    <div className="art-multi" aria-hidden>
      {["rk-sun", "rk-moon", "rk-leaf", "rk-wave"].map((id, i) => <div key={id} className={`kid k${i}`}><Avatar id={id} size={64} /></div>)}
      <div className="art-potato"><PotatoSvg heat={2} size={74} /></div>
    </div>
  );
}
function ShopArt() {
  return (
    <div className="art-shop" aria-hidden>
      <i className="spark s1">✦</i><i className="spark s2">✦</i><i className="spark s3">✧</i>
      <svg viewBox="0 0 120 150" width="104" className="art-pack"><path d="M8 10 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7 V140 l-7 7 l-7 -7 l-7 7 l-7 -7 l-7 7 l-7 -7 l-7 7 l-7 -7 l-7 7 l-7 -7 l-7 7 l-7 -7 l-7 7 Z" fill="#ffc233" stroke="#14163a" strokeWidth="5" strokeLinejoin="round" /><rect x="20" y="26" width="80" height="98" rx="8" fill="#fff8ea" stroke="#14163a" strokeWidth="4" /><path d="M60 52 l8 17 l19 2 l-14 13 l4 19 l-17 -10 l-17 10 l4 -19 l-14 -13 l19 -2Z" fill="#ff5d9e" stroke="#14163a" strokeWidth="4" strokeLinejoin="round" /><rect className="shine" x="-20" y="10" width="14" height="140" fill="#fff" opacity=".5" /></svg>
    </div>
  );
}

/* ---------- Home ---------- */
export function HubHome() {
  const { me, daily, ab } = useHubData();
  const results: any[] = daily?.state?.results ?? [];
  const total = daily?.puzzles?.length ?? 5;
  const solved = results.filter((r) => r?.ok).length;
  const doneToday = !!daily?.state?.done;
  const teacher = me?.role === "teacher";
  return (
    <PrefsProvider>
      <main className="hb">
        <Stagger i={0} className="hb-hero">
          <div className="hb-welcome">
            <p className="hb-kicker">{me?.signedIn ? "WELCOME BACK" : "WELCOME"}</p>
            <h1 className="hb-title">{me?.signedIn ? me.name : "Player One"}</h1>
            <div className="hb-chips">
              <span className="hb-chip">🪙 {me?.signedIn ? me.coins : 0}</span>
              <span className="hb-chip">🦪 {ab?.pearls ?? 0}</span>
              {Math.max(daily?.state?.streak ?? 0, ab?.profile?.streak ?? 0) > 0 && <span className="hb-chip flame">🔥 {Math.max(daily?.state?.streak ?? 0, ab?.profile?.streak ?? 0)}-day streak</span>}
            </div>
          </div>
          <Link href="/arcade/daily" className={`hb-daily ${doneToday ? "done" : ""}`}>
            <span className="hb-daily-art" aria-hidden>🧩</span>
            <span className="hb-daily-body">
              <small>DAILY PUZZLE · NEW EVERY DAY</small>
              <b>{doneToday ? `DONE - ${solved}/${total} SOLVED` : "5 QUICK PUZZLES"}</b>
              <span className="hb-pips">{Array.from({ length: total }, (_, i) => <i key={i} className={results[i] ? (results[i].ok ? "ok" : "miss") : ""} />)}</span>
            </span>
            <span className="hb-go">{doneToday ? "VIEW" : "PLAY"} ▶</span>
          </Link>
        </Stagger>

        <div className="hb-portals">
          <Stagger i={1}><TiltCard href="/arcade/solo" className="hb-portal solo" label="Solo games">
            <SoloArt />
            <div className="hb-portal-text"><small>PLAY ON YOUR OWN</small><h2>SOLO GAMES</h2><p>Abyss, practice against bots, Mastery Peak and the daily puzzle.</p></div>
            <span className="hb-go">ENTER ▶</span>
          </TiltCard></Stagger>
          <Stagger i={2}><TiltCard href="/arcade/multiplayer" className="hb-portal multi" label="Multiplayer games">
            <MultiArt />
            <div className="hb-portal-text"><small>PLAY WITH THE CLASS</small><h2>MULTIPLAYER</h2><p>Join a room with a code. Seven party games, one winner.</p></div>
            <span className="hb-go">ENTER ▶</span>
          </TiltCard></Stagger>
          <Stagger i={3}><TiltCard href="/arcade/shop" className="hb-portal shop" label="Shop">
            <ShopArt />
            <div className="hb-portal-text"><small>SPEND WHAT YOU EARN</small><h2>SHOP</h2><p>Packs, characters and fish. New deals every day.</p></div>
            <span className="hb-go">ENTER ▶</span>
          </TiltCard></Stagger>
        </div>

        <Stagger i={4} className="hb-ticker" >
          <div className="hb-ticker-track" aria-label="Party games">
            {[...GAME_IDS, ...GAME_IDS].map((id: string, i: number) => <span key={i} className="hb-tick" style={{ borderColor: GAME_CATALOG[id].color }}><GameArt id={id} size={30} />{GAME_CATALOG[id].name.toUpperCase()}</span>)}
          </div>
        </Stagger>

        {teacher && (
          <Stagger i={5} className="hb-teacher">
            <span>TEACHER TOOLS</span>
            <Link className="hb-mini" href="/arcade/host">📺 HOST A GAME</Link>
            <Link className="hb-mini" href="/arcade/content">📚 MY CONTENT</Link>
            <Link className="hb-mini" href="/arcade/test-lab">🧪 TEST LAB</Link>
          </Stagger>
        )}
      </main>
    </PrefsProvider>
  );
}

/* ---------- Solo hub ---------- */
export function SoloHub() {
  const { me, daily, ab } = useHubData();
  const abToday = ab?.today;
  const abStatus = !ab?.signedIn ? "Guest play" : !abToday ? "Not played today" : abToday.done ? `Today: ${abToday.depth.toLocaleString("en-US")} m` : "Dive in progress";
  const dailyDone = !!daily?.state?.done;
  const games = [
    { href: "/arcade/abyss", cls: "cyan", art: <Avatar id={ab?.profile?.fish ?? "f-bubbles"} size={92} />, name: "ABYSS", tag: "Daily dive", blurb: "Type rare answers to sink deeper. Daily dives, endless dives, and themed worlds for movies, sports, music, TV and games.", chips: ["⏱ 5 MIN", "🦪 PEARLS"], status: abStatus, good: !!abToday?.done },
    { href: "/arcade/gridiron", cls: "green", art: <span className="big-emoji">🏈</span>, name: "RETRO GRIDIRON", tag: "Pixel football", blurb: "Call the play, read the defence, throw to A B C D, then run it in. Quick games or a two-minute drill.", chips: ["🏈 VS CPU", "⏱ 5 MIN"], status: "Landscape-friendly. No sign-in needed", good: false },
    { href: "/arcade/solo/practice", cls: "pink", art: <GameArt id="hot_potato" size={92} />, name: "PRACTICE", tag: "Vs bots", blurb: "Play any party game alone against bots. Earn coins for packs.", chips: ["🤖 BOTS", "🪙 COINS"], status: me?.signedIn ? "Earn up to 80 coins a day" : "Sign in to earn coins", good: false },
    { href: "/arcade/peak", cls: "violet", art: <span className="big-emoji">⛰️</span>, name: "MASTERY PEAK", tag: "Learn it for real", blurb: "Climb a mountain of ideas. Miss one and it teaches you, then asks again.", chips: ["🧠 LEARN", "🚩 SUMMIT"], status: "Set from your teacher or try the starter", good: false },
    { href: "/arcade/daily", cls: "yellow", art: <span className="big-emoji">🧩</span>, name: "DAILY PUZZLE", tag: "5 puzzles", blurb: "Unscramble, spot the pattern, find the odd one out. Fresh every day.", chips: ["🔥 STREAK", "🪙 COINS"], status: dailyDone ? "Done for today" : "Ready to play", good: dailyDone },
  ];
  return (
    <PrefsProvider>
      <main className="hb">
        <HubTitle kicker="PLAY ON YOUR OWN" title="SOLO GAMES" sub="No room code needed. Pick a game and go." />
        <div className="hb-grid">
          {games.map((g, i) => (
            <Stagger key={g.name} i={i}><TiltCard href={g.href} className={`hb-game ${g.cls}`}>
              <div className="hb-game-art">{g.art}</div>
              <div className="hb-game-body">
                <small>{g.tag.toUpperCase()}</small><h2>{g.name}</h2><p>{g.blurb}</p>
                <div className="hb-tags">{g.chips.map((c) => <span key={c}>{c}</span>)}</div>
                <p className={`hb-status ${g.good ? "good" : ""}`}>{g.good ? "✓ " : "● "}{g.status}</p>
              </div>
              <span className="hb-go">PLAY ▶</span>
            </TiltCard></Stagger>
          ))}
        </div>
      </main>
    </PrefsProvider>
  );
}

/* ---------- Multiplayer hub ---------- */
export function MultiplayerHub() {
  const { me } = useHubData();
  const teacher = me?.role === "teacher";
  return (
    <PrefsProvider>
      <main className="hb">
        <HubTitle kicker="PLAY WITH THE CLASS" title="MULTIPLAYER" sub="Your teacher starts a room. You join with the code on the board." />
        <div className="hb-two">
          <Stagger i={0} className="hb-panel join">
            <small>I HAVE A CODE</small><h2>JOIN A GAME</h2>
            <p>Type the 4 to 6 letter code. No account needed - pick any nickname.</p>
            <QuickJoin />
            <Link href="/arcade/join" className="hb-link">Or open the full join page ▶</Link>
          </Stagger>
          <Stagger i={1} className="hb-panel host">
            <small>FOR TEACHERS</small><h2>HOST A GAME</h2>
            {teacher ? (<>
              <p>Pick the games, your content set, and start a room for up to 40 students.</p>
              <Link href="/arcade/host" className="hb-btn">📺 START A ROOM</Link>
              <div className="hb-row"><Link className="hb-mini" href="/arcade/content">📚 MY CONTENT + AI BUILDER</Link><Link className="hb-mini" href="/arcade/test-lab">🧪 TEST LAB</Link></div>
            </>) : (<>
              <p>Only teacher accounts can start rooms, so students can&apos;t take over a class session.</p>
              <Link href="/margins/login" className="hb-btn">TEACHER SIGN IN</Link>
            </>)}
          </Stagger>
        </div>
        <Stagger i={2} className="hb-section"><h3>THE GAMES</h3></Stagger>
        <div className="hb-grid six">
          {GAME_IDS.map((id: string, i: number) => { const g = GAME_CATALOG[id]; return (
            <Stagger key={id} i={3 + i * 0.5}><div className="hb-gamecard" style={{ ["--gc" as any]: g.color }}>
              <div className="hb-gc-art"><GameArt id={id} size={64} /></div>
              <div><h4>{g.name.toUpperCase()}</h4><p>{g.blurb}</p><span className="hb-tags"><span>⏱ {g.minutes} MIN</span><span>👥 {g.min}+</span></span></div>
            </div></Stagger>); })}
        </div>
        <Stagger i={6} className="hb-steps">
          {["Teacher starts a room", "You type the code", "Play, score and earn coins"].map((t, i) => <span key={t}><b>{i + 1}</b>{t}</span>)}
        </Stagger>
      </main>
    </PrefsProvider>
  );
}
