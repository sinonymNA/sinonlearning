"use client";

import { useEffect, useState } from "react";
import { GameSwitch } from "./GameSwitch";
import Avatar from "./Avatar";
import { PrefsButtons, PrefsProvider } from "./prefs";
import { FinalScreen, IntroScreen, ResultsScreen, TeamBoard } from "./screens";
import { Leaderboard } from "./ui";
import { useRoom } from "./useRoom";
import { GAME_CATALOG } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProjectorClient({ code }: { code: string }) {
  return <PrefsProvider><Inner code={code.toUpperCase()} /></PrefsProvider>;
}

/** Big-screen view: public information only (no private roles, secret words or hidden answers). */
function Inner({ code }: { code: string }) {
  const room = useRoom(code, { host: true });
  const { view, stamp, lost } = room;
  const [rot, setRot] = useState(0);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); const t = setInterval(() => setRot((r) => r + 1), 9000); return () => clearInterval(t); }, []);
  const groups = view?.game?.groups ?? [];
  const featured = groups.length ? rot % groups.length : undefined;
  useEffect(() => { room.optsRef.current = { ...room.optsRef.current, group: featured }; }, [featured, room.optsRef]);

  if (lost) return <div className="ar-wrap proj"><div className="ar-panel"><h1 className="ar-h2">Projector unavailable</h1><p>{lost} Open this page while signed in as the teacher who created the room.</p></div></div>;
  if (!view) return <div className="ar-wrap ar-h2">Connecting…</div>;

  return (
    <div className="proj" style={{ padding: "16px 28px 40px" }}>
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-4"><span className="ar-h2">🕹 Classroom Arcade</span><span className="ar-muted font-bold">{view.phase === "playing" ? GAME_CATALOG[view.gameId]?.name : ""}</span></div>
        <div className="flex items-center gap-3"><span className="ar-pill" style={{ fontSize: "1.1em" }}>Join: {origin.replace(/^https?:\/\//, "")}/arcade/join · <b className="tracking-widest">{view.code}</b></span><PrefsButtons /></div>
      </header>
      {view.paused && <div className="ar-banner mb-3" style={{ fontSize: "1.4em" }}>⏸ PAUSED</div>}
      {view.phase === "lobby" && (
        <div className="grid gap-6 text-center">
          <div><p className="ar-muted text-2xl font-bold">Go to <b className="text-[var(--sun)]">{origin.replace(/^https?:\/\//, "")}/arcade/join</b> and enter</p><p className="ar-code" style={{ fontSize: "min(18vw, 12rem)" }}>{view.code}</p></div>
          <div className="ar-panel"><p className="mb-4 text-3xl font-bold">{view.players.length} players ready</p><div className="ar-grid-avatars" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>{view.players.map((p: any, i: number) => <div key={p.id} className="ar-av pop"><div className="float" style={{ animationDelay: `${(i % 8) * 0.12}s` }}><Avatar id={p.avatar} size={84} /></div><span className="nm" style={{ fontSize: "1.1em" }}>{p.nickname}</span></div>)}</div></div>
        </div>
      )}
      {view.phase === "intro" && <IntroScreen view={view} stamp={stamp} />}
      {view.phase === "playing" && (
        <div className="grid gap-4 xl:grid-cols-[3fr_1fr]">
          <GameSwitch view={view} stamp={stamp} send={async () => undefined} optsRef={room.optsRef} projector />
          <div className="grid content-start gap-4"><Leaderboard rows={view.leaderboard ?? []} limit={8} title="Leaderboard" showPoints />{view.teams && <TeamBoard teams={view.teams} />}</div>
        </div>
      )}
      {view.phase === "results" && <ResultsScreen view={view} stamp={stamp} projector />}
      {view.phase === "final" && <FinalScreen view={view} projector />}
      {view.phase === "ended" && <div className="ar-panel text-center ar-h1">Thanks for playing!</div>}
    </div>
  );
}
