"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { BigCountdown, Leaderboard, Podium } from "./ui";
import { api } from "./useRoom";
import { GAME_CATALOG, TEAMS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const HOW_TO: Record<string, string[]> = {
  hot_potato: ["Letters appear (like TION). If you hold the potato, type a word containing them.", "A correct word throws the potato to a RANDOM player. Repeats don't count!", "When the hidden fuse ends, the holder loses a heart. Out of hearts? You can still help cool the potato."],
  quick_draw: ["One person in your group draws a secret word.", "Everyone else types guesses. Faster guesses score more.", "Artists score when their group gets it. Everyone takes turns."],
  last_one_standing: ["Everyone gets the same question at the same time.", "Only the fastest CORRECT players stay on the platform.", "Knocked out? Keep answering in the consolation round."],
  telephone: ["Draw your prompt. Then describe someone else's drawing. Then draw that description.", "You never get your own chain back.", "Watch the big reveal and vote for the funniest."],
  imposter: ["Everyone knows the secret word except ONE imposter.", "Take turns asking questions. Everyone answers at once, then answers are revealed.", "Vote out the imposter. If you ARE the imposter, guess the word at the end!"],
};

export function LobbyScreen({ view, meId }: { view: any; meId?: string }) {
  return (
    <div className="grid gap-5">
      <div className="ar-panel text-center">
        <p className="ar-muted font-bold">You're in room</p>
        <p className="ar-code">{view.code}</p>
        <p className="mt-2 text-lg font-bold">Waiting for {view.host?.name ?? "your teacher"} to start…</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">{view.playlist.map((g: string, i: number) => <span key={i} className="ar-pill">{GAME_CATALOG[g].icon} {GAME_CATALOG[g].name}</span>)}</div>
      </div>
      <div className="ar-panel">
        <p className="mb-3 font-bold">{view.players.length} {view.players.length === 1 ? "player" : "players"} in the lobby</p>
        <div className="ar-grid-avatars">{view.players.map((p: any, i: number) => (
          <div key={p.id} className={`ar-av ${p.connected ? "" : "off"}`}><div className="float" style={{ animationDelay: `${(i % 7) * 0.15}s` }}><Avatar id={p.avatar} size={64} /></div><span className="nm">{p.id === meId ? "You" : p.nickname}</span></div>
        ))}</div>
      </div>
    </div>
  );
}

export function IntroScreen({ view, stamp }: { view: any; stamp: number }) {
  const n = view.next;
  return (
    <div className="ar-panel pop grid gap-4 text-center" style={{ borderColor: n.color }}>
      <p className="ar-muted font-bold">Game {n.index + 1} of {n.of}</p>
      <div className="potato float" style={{ fontSize: "6rem", animation: undefined }} aria-hidden>{n.icon}</div>
      <h2 className="ar-h1" style={{ color: n.color }}>{n.name}</h2>
      <ul className="mx-auto grid max-w-xl gap-2 text-left text-lg font-semibold">{(HOW_TO[n.id ?? n.gameId] ?? []).map((t, i) => <li key={i} className="slide rounded-xl bg-[var(--bg)] px-4 py-2" style={{ animationDelay: `${i * 0.15}s` }}>{i + 1}. {t}</li>)}</ul>
      <p className="font-bold">Starting in</p><BigCountdown ms={view.timer?.ms} stamp={stamp} />
    </div>
  );
}

export function ResultsScreen({ view, stamp, meId, projector }: { view: any; stamp: number; meId?: string; projector?: boolean }) {
  const r = view.results;
  const board = (view.leaderboard ?? []).slice().sort((a: any, b: any) => b.total - a.total);
  const mine = r?.rows.find((x: any) => x.id === meId);
  const more = view.gameIndex + 1 < view.playlist.length;
  return (
    <div className="grid gap-5">
      <div className="ar-panel text-center">
        <p className="ar-muted font-bold">{r?.name} results</p>
        <h2 className="ar-h1">{r?.rows[0] ? `${r.rows[0].nickname} wins!` : "Round over"}</h2>
        <Podium rows={r?.rows ?? []} valueKey="points" />
        {r?.highlights?.map((h: string, i: number) => <p key={i} className="mt-1 font-bold">✨ {h}</p>)}
        {mine && !projector && <p className="mt-3 text-xl font-bold">You scored <span className="text-[var(--sun)]">{mine.points}</span> points → <span className="text-[var(--mint)]">+{mine.norm}</span> to your arcade total</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Leaderboard rows={board} meId={meId} limit={projector ? 10 : 8} title="Arcade total" />
        <div className="ar-panel grid place-items-center text-center"><p className="ar-muted font-bold">{more ? "Next game in" : "Final results in"}</p><BigCountdown ms={view.timer?.ms} stamp={stamp} /></div>
      </div>
      {view.teams && <TeamBoard teams={view.teams} />}
    </div>
  );
}

export function TeamBoard({ teams }: { teams: any[] }) {
  return <div className="ar-panel"><h3 className="mb-2 font-bold">Team scores (average per player)</h3><ul className="grid gap-2">{teams.map((t) => <li key={t.id} className="lb-row" style={{ borderLeft: `10px solid ${t.color}` }}><span className="flex-1">{t.name} <span className="ar-muted text-sm">({t.members})</span></span><b className="tabular-nums">{t.total}</b></li>)}</ul></div>;
}

export function FinalScreen({ view, meId, projector }: { view: any; meId?: string; projector?: boolean }) {
  const board = (view.leaderboard ?? []).slice().sort((a: any, b: any) => b.total - a.total);
  const [wallet, setWallet] = useState<any>(null);
  useEffect(() => { if (!projector) { const t = setTimeout(() => api("/api/arcade/economy", { type: "me" }).then(setWallet).catch(() => undefined), 800); return () => clearTimeout(t); } }, [projector]);
  const me = board.findIndex((r: any) => r.id === meId);
  return (
    <div className="grid gap-5">
      <div className="ar-panel text-center"><p className="ar-muted font-bold">Arcade Party complete!</p><h2 className="ar-h1">🏆 {board[0]?.nickname ?? "Nobody"} takes the crown</h2><Podium rows={board} /></div>
      {me >= 0 && !projector && <div className="ar-card text-center"><p className="text-xl font-bold">You finished #{me + 1} with {board[me].total} points!</p>
        {wallet?.signedIn ? <p className="mt-1 font-bold">🪙 You have {wallet.coins} coins. <Link className="underline" href="/arcade/shop">Open a pack →</Link></p> : <p className="mt-1 font-bold">Guests don&apos;t keep coins. <Link className="underline" href="/margins/login">Sign in</Link> to earn coins and unlock characters.</p>}</div>}
      <div className="grid gap-4 md:grid-cols-2"><Leaderboard rows={board} meId={meId} limit={projector ? 10 : 12} title="Final standings" />
        <div className="grid gap-4">{view.teams && <TeamBoard teams={view.teams} />}
          <div className="ar-panel"><h3 className="mb-2 font-bold">Game winners</h3><ul className="grid gap-1">{view.history?.map((h: any, i: number) => <li key={i}>{GAME_CATALOG[h.gameId].icon} <b>{h.name}</b>: {h.top[0]?.nickname ?? "-"}</li>)}</ul></div></div></div>
    </div>
  );
}
export { TEAMS };
