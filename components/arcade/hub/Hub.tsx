"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GameArt from "../GameArt";
import QuickJoin from "../QuickJoin";
import { PrefsProvider } from "../prefs";
import { api } from "../useRoom";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";
import { HUB_GAMES, RECENT_KEY, shelves, type HubGame, type Recent, type Shelf } from "@/lib/arcadeHub";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
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

/* ---------- shelves: Continue row + one shelf per mood. Quiet on purpose: one line per game, no chips, no looping animation. ---------- */
type Status = { text: string; hot?: boolean };
const rj = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };

/** What each game can tell you at a glance, read from this device's saves plus the server data the hub already loads. */
function useStatuses({ daily, ab, me }: { daily: any; ab: any; me: any }): Record<string, Status> {
  const [local, setLocal] = useState<Record<string, Status>>({});
  useEffect(() => {
    const out: Record<string, Status> = {};
    const pk = rj("packrush:v2")?.st;
    if (pk?.v === 2 && pk.dex) {
      const found = Object.values(pk.dex).reduce((n: number, d: any) => n + d.vars.filter((c: number) => c > 0).length, 0), ready = (pk.missions || []).filter((m: any) => m.p >= m.n).length;
      out.packs = ready ? { text: `${ready} order${ready > 1 ? "s" : ""} ready to claim`, hot: true } : { text: `${found} of 432 found` };
    }
    const c = rj("gridiron:career:v1");
    if (c?.v === 1) out.gridiron = { text: c.phase === "offseason" ? `${c.teamName}: season ${c.season} finished` : `${c.teamName}: season ${c.season}, week ${Math.min(c.week, 7)}` };
    setLocal(out);
  }, []);
  const abToday = ab?.today, dailyDone = !!daily?.state?.done;
  return {
    ...local,
    abyss: { text: !ab?.signedIn ? "Guest play" : !abToday ? "Not played today" : abToday.done ? `Today: ${abToday.depth.toLocaleString("en-US")} m` : "Dive in progress", hot: !!ab?.signedIn && !abToday },
    daily: { text: dailyDone ? "Done for today" : "Ready to play", hot: !dailyDone },
    practice: { text: me?.signedIn ? "Earn up to 80 coins a day" : "Sign in to earn coins" },
  };
}
function useRecent(): Recent[] {
  const [r, setR] = useState<Recent[]>([]);
  useEffect(() => { const j = rj(RECENT_KEY); if (Array.isArray(j)) setR(j.filter((x: any) => x && typeof x.id === "string" && HUB_GAMES.some((g) => g.id === x.id))); }, []);
  return r;
}
function GameCard({ g, status }: { g: HubGame; status?: Status }) {
  return (
    <Link href={g.href} className={`hb-card c-${g.color}`}>
      <span className="hb-card-art" aria-hidden>{g.icon}</span>
      <span className="hb-card-body"><b>{g.name}</b><small>{g.tagline}</small>{status && <em className={status.hot ? "hot" : ""}>{status.hot ? "● " : ""}{status.text}</em>}</span>
      <span className="hb-card-go" aria-hidden>▶</span>
    </Link>
  );
}
function ShelfView({ s, statuses }: { s: Shelf; statuses: Record<string, Status> }) {
  const [open, setOpen] = useState(false), list = open ? [...s.shown, ...s.more] : s.shown;
  return (
    <section className="hb-shelf" aria-labelledby={`shelf-${s.id}`}>
      <div className="hb-shelf-head"><h2 id={`shelf-${s.id}`}>{s.name.toUpperCase()}</h2><span>{s.sub}</span></div>
      <div className="hb-cards">{list.map((g) => <GameCard key={g.id} g={g} status={statuses[g.id]} />)}</div>
      {s.more.length > 0 && <button className="hb-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? "Show fewer" : `See all ${s.shown.length + s.more.length}`}</button>}
    </section>
  );
}
function Shelves({ daily, ab, me, hide = [] }: { daily: any; ab: any; me: any; hide?: string[] }) {
  const statuses = useStatuses({ daily, ab, me }), recent = useRecent(), games = recent.map((r) => HUB_GAMES.find((g) => g.id === r.id)).filter(Boolean).slice(0, 3) as HubGame[];
  return (
    <div className="hb-shelves">
      {games.length > 0 && (
        <section className="hb-shelf hb-cont" aria-labelledby="shelf-continue">
          <div className="hb-shelf-head"><h2 id="shelf-continue">CONTINUE</h2><span>Pick up where you left off</span></div>
          <div className="hb-pills">{games.map((g) => <Link key={g.id} href={g.href} className={`hb-pill c-${g.color}`}><span aria-hidden>{g.icon}</span><b>{g.name}</b>{statuses[g.id] && <small className={statuses[g.id].hot ? "hot" : ""}>{statuses[g.id].text}</small>}</Link>)}</div>
        </section>
      )}
      {shelves(HUB_GAMES.filter((g) => !hide.includes(g.id))).map((s) => <ShelfView key={s.id} s={s} statuses={statuses} />)}
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
      <main className="hb hb-calm">
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
              <small>DAILY PUZZLE</small>
              <b>{doneToday ? `DONE - ${solved}/${total} SOLVED` : "5 QUICK PUZZLES"}</b>
              <span className="hb-pips">{Array.from({ length: total }, (_, i) => <i key={i} className={results[i] ? (results[i].ok ? "ok" : "miss") : ""} />)}</span>
            </span>
            <span className="hb-go">{doneToday ? "VIEW" : "PLAY"} ▶</span>
          </Link>
        </Stagger>

        <Shelves daily={daily} ab={ab} me={me} hide={["daily"]} />   {/* the daily banner above already covers it */}

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

/* ---------- Games page (the Solo tab): the same shelves without the welcome banner ---------- */
export function SoloHub() {
  const { me, daily, ab } = useHubData();
  return (
    <PrefsProvider>
      <main className="hb hb-calm">
        <HubTitle kicker="PICK A MOOD" title="GAMES" sub="Everything saves on its own. Pick something and go." />
        <Shelves daily={daily} ab={ab} me={me} />
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
      <main className="hb hb-calm">
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
