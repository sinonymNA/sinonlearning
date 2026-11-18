"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { GameSwitch } from "./GameSwitch";
import JoinForm from "./JoinForm";
import { PrefsButtons, PrefsProvider } from "./prefs";
import { FinalScreen, IntroScreen, LobbyScreen, ResultsScreen } from "./screens";
import { Banner, Leaderboard } from "./ui";
import { useRoom } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function RoomClient({ code }: { code: string }) {
  return <PrefsProvider><Inner code={code.toUpperCase()} /></PrefsProvider>;
}

function Inner({ code }: { code: string }) {
  const room = useRoom(code);
  const { view, stamp, creds, ready, lost, offline } = room;
  const [wasIn, setWasIn] = useState(false);
  useEffect(() => { if (creds) setWasIn(true); }, [creds]);

  if (!ready) return <div className="ar-wrap ar-h2">Loading…</div>;

  if (!creds || lost) {
    return (
      <div className="ar-wrap">
        <p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p>
        <h1 className="ar-h1 mb-2 text-center">Join room {code}</h1>
        {lost && wasIn && <p className="mb-4 text-center font-bold text-[var(--sun)]">{lost}</p>}
        <JoinForm fixedCode={code} onJoin={async (_c, n, a) => { await room.join(n, a); }} />
      </div>
    );
  }
  if (!view) return <div className="ar-wrap ar-h2 text-center">Connecting to the room…</div>;
  const me = view.me;
  const meId = creds.playerId;

  return (
    <>
      <header className="ar-topbar">
        <div className="flex min-w-0 items-center gap-2"><Avatar id={me?.avatar ?? creds.avatar} size={40} /><div className="min-w-0"><div className="truncate font-bold">{me?.nickname ?? creds.nickname}</div><div className="text-xs opacity-80">Room {view.code}{me?.team != null && view.teams ? ` · ${view.teams.find((t: any) => t.id === me.team)?.name}` : ""}</div></div></div>
        <div className="flex items-center gap-3"><span className="ar-pill" title="Arcade total plus this game's points">⭐ {(me?.total ?? 0) + (me?.points ?? 0)}</span><PrefsButtons /></div>
      </header>
      {offline && <Banner>📡 Connection lost - trying to reconnect…</Banner>}
      {view.paused && <Banner>⏸ Your teacher paused the game</Banner>}
      <main className="ar-wrap">
        {view.phase === "lobby" && <LobbyScreen view={view} meId={meId} />}
        {view.phase === "intro" && <IntroScreen view={view} stamp={stamp} />}
        {view.phase === "playing" && (me?.waiting
          ? <div className="grid gap-4"><div className="ar-panel text-center ar-h2">⏳ A game is in progress. You'll jump in for the next one!</div><Leaderboard rows={view.leaderboard ?? []} meId={meId} /></div>
          : <GameSwitch view={view} stamp={stamp} send={room.send} meId={meId} optsRef={room.optsRef} />)}
        {view.phase === "results" && <ResultsScreen view={view} stamp={stamp} meId={meId} />}
        {view.phase === "final" && <FinalScreen view={view} meId={meId} />}
        {view.phase === "ended" && <div className="ar-panel text-center"><h2 className="ar-h1">Session ended</h2><p className="mt-2 text-lg">Thanks for playing!</p><Link className="ar-btn mt-4" href="/arcade/shop">Visit the shop</Link></div>}
        {view.phase === "playing" && !me?.waiting && view.leaderboard && view.game?.kind !== "last_one_standing" && <div className="mt-6"><Leaderboard rows={view.leaderboard} meId={meId} limit={5} title="Live leaderboard" showPoints /></div>}
      </main>
    </>
  );
}
