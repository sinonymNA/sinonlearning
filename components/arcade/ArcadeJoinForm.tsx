"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ArcadeJoinForm({ host = false }: { host?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [hostToken, setHostToken] = useState("");
  const [status, setStatus] = useState("");
  const [room, setRoom] = useState<any>(null);

  async function send(message: any) {
    const res = await fetch("/api/arcade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }) });
    const data = await res.json();
    const error = data.messages?.find((m: any) => m.type === "error");
    if (error) throw new Error(error.message);
    if (data.sessionId) setSessionId(data.sessionId);
    const created = data.messages?.find((m: any) => m.type === "created");
    if (created) { setCode(created.code); setHostToken(created.hostToken); }
    const state = data.messages?.find((m: any) => m.type === "state");
    if (state) setRoom(state);
    return data;
  }

  async function create() { try { setStatus("Creating room…"); await send({ type: "create", game: "hot_potato" }); setStatus("Room ready. Share the code."); } catch (e) { setStatus(e instanceof Error ? e.message : "Could not create room."); } }
  async function join() { try { setStatus("Joining…"); const data = await send({ type: "join", code: code.toUpperCase(), nickname, avatar: "sun" }); const joined = data.messages?.find((m: any) => m.type === "joined"); if (joined) sessionStorage.setItem("arcade-session", JSON.stringify({ sessionId: data.sessionId, reconnectToken: joined.reconnectToken, code: joined.code })); setStatus("Joined the lobby."); } catch (e) { setStatus(e instanceof Error ? e.message : "Could not join room."); } }
  async function start() { try { await send({ type: "start", hostToken }); } catch (e) { setStatus(e instanceof Error ? e.message : "Could not start."); } }

  useEffect(() => { if (!sessionId || !room || room.phase === "results") return; const timer = setInterval(() => send({ type: "poll" }).catch(() => undefined), 1500); return () => clearInterval(timer); }, [sessionId, room?.phase]);

  if (host && room) return <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-7 text-white"><p className="text-sm text-cyan-200">Room code</p><p className="mt-1 text-6xl font-black tracking-[0.2em]">{code}</p><p className="mt-4 text-slate-300">{room.players?.length ?? 0} players in the lobby</p><button onClick={start} className="mt-6 rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">Start Hot Potato</button><pre className="mt-6 overflow-auto rounded-xl bg-black/20 p-3 text-xs text-slate-300">{JSON.stringify(room.players, null, 2)}</pre></div>;
  if (!host && room) return <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-7 text-white"><p className="text-cyan-200">You’re in room <b>{code}</b>.</p><h2 className="mt-3 text-3xl font-black">{room.phase === "playing" ? "Game in progress" : "Waiting for the teacher…"}</h2><div className="mt-6 grid gap-3">{room.players?.map((player: any) => <div key={player.id} className="rounded-xl bg-white/10 px-4 py-3">{player.nickname} · {player.hearts} hearts</div>)}</div></div>;

  return <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-7 text-white">{host ? <><h2 className="text-2xl font-black">Host a room</h2><p className="mt-2 text-slate-300">Create a room and share the code with your class.</p><button onClick={create} className="mt-6 rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950">Create room</button></> : <><h2 className="text-2xl font-black">Join a room</h2><input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" className="mt-5 w-full rounded-xl px-4 py-3 text-slate-900" /><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Six-character code" className="mt-3 w-full rounded-xl px-4 py-3 uppercase text-slate-900" /><button disabled={!nickname || code.length < 4} onClick={join} className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">Join room</button></>}<p className="mt-4 text-sm text-amber-200">{status}</p></div>;
}
