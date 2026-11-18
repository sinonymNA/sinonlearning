"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GameArt from "./GameArt";
import { AvatarPicker } from "./JoinForm";
import { api, saveCreds } from "./useRoom";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
const LEVELS = [{ id: "easy", label: "Easy", mult: "×0.6", note: "Bots make lots of mistakes" }, { id: "medium", label: "Medium", mult: "×1", note: "A fair fight" }, { id: "hard", label: "Hard", mult: "×1.4", note: "Bots are sharp and fast" }];
const BASE = [30, 22, 16, 11, 8];

export default function SoloMenu() {
  const router = useRouter();
  const [game, setGame] = useState("hot_potato");
  const [level, setLevel] = useState("medium");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("rk-sun");
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/api/arcade/economy", { type: "me" }).then(setMe).catch(() => setMe({ signedIn: false, owned: [] }));
    try { const n = localStorage.getItem("arcade:nickname"); if (n) setNickname(n); } catch { /* ignore */ }
  }, []);

  async function start() {
    setBusy(true); setErr(null);
    try {
      try { localStorage.setItem("arcade:nickname", nickname); } catch { /* ignore */ }
      const d = await api("/api/arcade", { type: "solo_create", game, difficulty: level, nickname: nickname || undefined, avatar });
      saveCreds(d.code, { playerId: d.playerId, token: d.token, nickname: d.nickname, avatar: d.avatar });
      router.push(`/arcade/room/${d.code}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }
  const owned = (me?.owned ?? []).map((o: any) => o.id);
  const mult = { easy: 0.6, medium: 1, hard: 1.4 }[level] ?? 1;

  return (
    <div className="grid gap-6">
      <div className={`ar-panel flex flex-wrap items-center justify-between gap-3`}>
        {me?.signedIn ? <p className="font-bold">🪙 {me.coins} coins · playing as <b>{me.name}</b></p> : <p className="font-bold">Playing as a guest - you can practice, but only accounts earn coins.</p>}
        {!me?.signedIn && <Link className="ar-btn sm mint" href="/arcade/account">Make a free account</Link>}
      </div>
      <section aria-label="Pick a game" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_IDS.map((id: string) => { const g = GAME_CATALOG[id]; const on = game === id; return (
          <button key={id} aria-pressed={on} onClick={() => setGame(id)} className={`stage theme-${id} text-left`} style={{ outline: on ? "5px solid var(--sun)" : undefined, outlineOffset: 3, padding: 18, cursor: "pointer", color: "#fff" }}>
            <div className="flex items-start justify-between gap-2"><div><div className="text-2xl font-bold" style={{ color: g.color }}>{g.name}</div><p className="mt-1 text-sm font-medium opacity-90">{g.blurb}</p></div><GameArt id={id} size={64} /></div>
          </button>); })}
      </section>
      <section className="ar-panel grid gap-3"><h2 className="ar-h2">Difficulty</h2>
        <div className="grid gap-3 sm:grid-cols-3">{LEVELS.map((l) => <button key={l.id} aria-pressed={level === l.id} onClick={() => setLevel(l.id)} className={`ar-btn ${level === l.id ? "" : "paper"}`} style={{ flexDirection: "column", alignItems: "flex-start", height: "auto", padding: 14, textAlign: "left" }}><span className="text-xl">{l.label} <span className="opacity-70">{l.mult} coins</span></span><span className="text-sm font-medium">{l.note}</span></button>)}</div>
        <p className="ar-muted text-sm">Coins by finishing place: {BASE.map((b, i) => `${["1st", "2nd", "3rd", "4th", "5th"][i]} ${Math.max(1, Math.round(b * mult))}`).join(" · ")}, then {Math.max(1, Math.round(5 * mult))}. You can earn up to 150 coins a day from practice runs (a Classic pack and then some!). Playing with friends in a class room isn&apos;t capped.</p></section>
      <section className="ar-card grid gap-3"><label className="grid gap-1 font-bold">Nickname for this run (anything you like)<input className="ar-input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="Player" /></label>
        <div className="rounded-2xl bg-[var(--bg)] p-3 text-[var(--paper)]"><p className="mb-2 font-bold">Your avatar</p><AvatarPicker value={avatar} onChange={setAvatar} owned={owned} /></div>
        <button className="ar-btn coral xl" disabled={busy} onClick={start}>{busy ? "Starting…" : `Start ${GAME_CATALOG[game].name} (${level})`}</button>
        <p role="alert" className="min-h-6 font-bold text-[var(--coral)]">{err}</p></section>
    </div>
  );
}
