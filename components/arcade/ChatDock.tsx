"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { sfx, usePrefs } from "./prefs";
import { api } from "./useRoom";
import { PHRASES } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TABS = [{ id: "funny", label: "😂 Jokes" }, { id: "cheer", label: "🎉 Cheer" }, { id: "react", label: "🤪 Emoji" }, { id: "game", label: "🎮 This game" }];

/**
 * Quick chat: curated phrases only (no typing). Messages pop up over everyone's screen. `readOnly` = projector
 * (pop-ups only, no button). The server enforces phrases, cooldown and the teacher's on/off switch.
 */
export default function ChatDock({ view, code, creds, readOnly = false }: { view: any; code: string; creds?: { playerId: string; token: string } | null; readOnly?: boolean }) {
  const { prefs } = usePrefs();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("funny");
  const [cool, setCool] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pops, setPops] = useState<any[]>([]);
  const seen = useRef<number | null>(null);
  const enabled = view?.settings?.chat !== false;
  const game = view?.phase === "playing" ? view.gameId : null;

  useEffect(() => {
    const msgs: any[] = view?.chat ?? [];
    if (seen.current === null) { seen.current = msgs.length ? msgs[msgs.length - 1].id : 0; return; }   // don't replay history on first load
    const fresh = msgs.filter((m) => m.id > (seen.current ?? 0));
    if (!fresh.length) return;
    seen.current = fresh[fresh.length - 1].id;
    if (prefs.chatHidden) return;
    setPops((p) => [...p, ...fresh].slice(-4));
    sfx("pop");
    for (const m of fresh) setTimeout(() => setPops((p) => p.filter((x) => x.id !== m.id)), 5200);
  }, [view?.chat, prefs.chatHidden]);

  async function send(id: string) {
    if (!creds || cool) return;
    setCool(true); setOpen(false); setErr(null);
    try { await api("/api/arcade", { type: "chat", code, playerId: creds.playerId, token: creds.token, phrase: id }); }
    catch (e: any) { setErr(e.message); setTimeout(() => setErr(null), 2500); }
    setTimeout(() => setCool(false), 2600);
  }
  const list = PHRASES.filter((p) => (tab === "game" ? p.game === game : p.tab === tab && p.game === "all"));

  return (
    <>
      <div className="chat-pops" aria-live="polite">
        {pops.map((m) => <div key={m.id} className="chat-pop"><Avatar id={m.avatar} size={36} /><div><small>{m.nickname}</small>{m.text}</div></div>)}
      </div>
      {!readOnly && enabled && creds && (
        <>
          {open && (
            <div className="chat-palette" role="dialog" aria-label="Quick chat">
              <div className="mb-2 flex flex-wrap gap-1">{TABS.filter((t) => t.id !== "game" || game).map((t) => <button key={t.id} className={`ar-btn sm ${tab === t.id ? "" : "paper"}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
              <div>{list.map((p) => <button key={p.id} className="phr" disabled={cool} onClick={() => send(p.id)}>{p.text}</button>)}{list.length === 0 && <p className="text-sm opacity-70">Nothing here yet.</p>}</div>
            </div>
          )}
          <button className="ar-btn coral chat-btn" onClick={() => setOpen(!open)} disabled={cool && !open} aria-expanded={open}>{cool ? "💬 …" : "💬 Chat"}</button>
          {err && <div role="alert" className="shake fixed bottom-16 right-4 z-50 rounded-xl border-[3px] border-[var(--ink)] bg-[var(--coral)] px-3 py-1 font-bold text-white">{err}</div>}
        </>
      )}
    </>
  );
}
