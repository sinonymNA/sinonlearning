"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { api } from "./useRoom";
import { CHARACTERS, STARTER_AVATARS } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AvatarPicker({ value, onChange, owned }: { value: string; onChange: (id: string) => void; owned: string[] }) {
  const options = [...STARTER_AVATARS.map((a: any) => ({ id: a.id, name: a.name, locked: false })), ...CHARACTERS.map((c: any) => ({ id: c.id, name: c.name, locked: !owned.includes(c.id) }))];
  return (
    <div role="radiogroup" aria-label="Choose your avatar" className="grid max-h-72 grid-cols-4 gap-2 overflow-auto sm:grid-cols-8">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} disabled={o.locked} onClick={() => onChange(o.id)} title={o.locked ? `${o.name} (unlock in the shop)` : o.name}
          className="grid place-items-center rounded-2xl border-[3px] p-1" style={{ borderColor: value === o.id ? "var(--sun)" : "transparent", background: value === o.id ? "rgba(255,194,51,.25)" : "rgba(255,255,255,.06)", opacity: o.locked ? 0.3 : 1, filter: o.locked ? "grayscale(1)" : undefined, minHeight: 64 }}>
          <Avatar id={o.id} size={48} /><span className="text-[10px] font-bold">{o.locked ? "🔒" : o.name}</span>
        </button>
      ))}
    </div>
  );
}

/** Nickname + avatar form. If `fixedCode` is omitted it also asks for the room code. */
export default function JoinForm({ fixedCode, onJoin, initialCode = "" }: { fixedCode?: string; initialCode?: string; onJoin: (code: string, nickname: string, avatar: string) => Promise<void> }) {
  const [code, setCode] = useState(fixedCode ?? initialCode);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("rk-sun");
  const [owned, setOwned] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/arcade/economy", { type: "me" }).then((me) => { setOwned((me.owned ?? []).map((o: any) => o.id)); setSignedIn(!!me.signedIn); if (me.signedIn && me.name && !nickname) setNickname(String(me.name).split(" ")[0].slice(0, 14)); }).catch(() => undefined);
    try { const n = localStorage.getItem("arcade:nickname"); if (n) setNickname((cur) => cur || n); } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { try { localStorage.setItem("arcade:nickname", nickname); } catch { /* ignore */ } await onJoin(code.trim().toUpperCase(), nickname, avatar); }
    catch (e2: any) { setErr(e2.message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="ar-card grid gap-4" style={{ maxWidth: 640, margin: "0 auto" }}>
      {!fixedCode && (
        <div><label htmlFor="code" className="mb-1 block font-bold">Room code</label>
          <input id="code" className="ar-input uppercase tracking-[.3em]" style={{ fontSize: "1.8rem", textAlign: "center" }} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" autoCapitalize="characters" autoComplete="off" required /></div>
      )}
      <div><label htmlFor="nick" className="mb-1 block font-bold">Nickname</label>
        <input id="nick" className="ar-input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="Pick something fun (no real names needed)" autoComplete="off" required /></div>
      <div className="rounded-2xl bg-[var(--bg)] p-3 text-[var(--paper)]"><p className="mb-2 font-bold">Your avatar</p><AvatarPicker value={avatar} onChange={setAvatar} owned={owned} />
        {!signedIn && <p className="mt-2 text-xs opacity-80">Playing as a guest. Sign in to earn coins and unlock more characters.</p>}</div>
      <button className="ar-btn coral xl" disabled={busy || code.length < 4 || nickname.trim().length < 2}>{busy ? "Joining…" : "Let's play!"}</button>
      <p role="alert" className="min-h-6 text-center font-bold text-[var(--coral)]">{err}</p>
    </form>
  );
}
