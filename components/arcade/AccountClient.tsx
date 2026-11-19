"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ADJ = ["Fuzzy", "Zippy", "Sunny", "Turbo", "Cosmic", "Bouncy", "Sneaky", "Mighty", "Jolly", "Pixel", "Mellow", "Spicy"];
const ANI = ["Otter", "Panda", "Falcon", "Gecko", "Llama", "Narwhal", "Badger", "Koala", "Moose", "Penguin", "Lynx", "Yeti"];
const randomName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]}${ANI[Math.floor(Math.random() * ANI.length)]}${Math.floor(10 + Math.random() * 90)}`;

export default function AccountClient() {
  const [me, setMe] = useState<any>(null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api("/api/arcade/economy", { type: "me" }).then(setMe);
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api("/api/arcade/account", { type: mode, username, password }); setPassword(""); await load(); }
    catch (e2: any) { setErr(e2.message); }
    setBusy(false);
  }
  async function logout() { await api("/api/arcade/account", { type: "logout" }); await load(); }
  async function del() {
    if (!confirm("Delete your account, coins and characters forever? This can't be undone.")) return;
    await api("/api/arcade/account", { type: "delete_account" }); await load();
  }
  if (!me) return <p className="ar-h2">Loading…</p>;

  if (me.signedIn) {
    const arcade = me.kind === "arcade";
    return (
      <div className="grid max-w-2xl gap-5">
        <div className="ar-panel"><p className="ar-muted font-bold">{arcade ? "Signed in as" : "Signed in with your Sinon account"}</p>
          <p className="ar-h1" style={{ fontSize: "2.6rem" }}>{me.name}</p><p className="mt-2 text-xl font-bold">🪙 {me.coins} coins · {me.owned?.length ?? 0} characters</p></div>
        <div className="flex flex-wrap gap-3"><Link className="ar-btn mint" href="/arcade/solo/practice">Solo practice</Link><Link className="ar-btn" href="/arcade/shop">Open packs</Link><Link className="ar-btn paper" href="/arcade/characters">My characters</Link></div>
        {arcade && <div className="ar-panel grid gap-2"><p className="ar-muted text-sm">Your account only stores your username, a scrambled password, your coins and your characters. Names you type when joining a game are never saved.</p>
          <div className="flex flex-wrap gap-2"><button className="ar-btn sm paper" onClick={logout}>Log out</button><button className="ar-btn sm coral" onClick={del}>Delete my account</button></div></div>}
      </div>
    );
  }

  return (
    <div className="grid max-w-xl gap-5">
      <div className="ar-panel"><p className="font-bold">Make a free account to keep your coins and characters.</p>
        <ul className="mt-2 grid gap-1 text-sm ar-muted"><li>✅ Just a username and a password.</li><li>✅ No email, no real name, no school info.</li><li>✅ You can still type any nickname when you join a game.</li><li>⚠️ We can&apos;t reset forgotten passwords. Write yours down!</li></ul></div>
      <form onSubmit={submit} className="ar-card grid gap-4">
        <div className="flex gap-2" role="tablist"><button type="button" role="tab" aria-selected={mode === "signup"} className={`ar-btn sm ${mode === "signup" ? "" : "paper"}`} onClick={() => setMode("signup")}>Create account</button><button type="button" role="tab" aria-selected={mode === "login"} className={`ar-btn sm ${mode === "login" ? "" : "paper"}`} onClick={() => setMode("login")}>I have an account</button></div>
        <label className="grid gap-1 font-bold">Username
          <div className="flex gap-2"><input className="ar-input" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} autoComplete="username" autoCapitalize="off" placeholder="Not your real name!" required />
            {mode === "signup" && <button type="button" className="ar-btn sm sky" onClick={() => setUsername(randomName())}>🎲 Random</button>}</div></label>
        <label className="grid gap-1 font-bold">Password
          <input className="ar-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required /></label>
        <button className="ar-btn coral xl" disabled={busy || username.length < 3 || password.length < 6}>{busy ? "…" : mode === "signup" ? "Create my account" : "Log in"}</button>
        <p role="alert" className="min-h-6 font-bold text-[var(--coral)]">{err}</p>
      </form>
      <p className="ar-muted text-sm">Teachers: sign in with your Sinon (Margins) account at <Link className="underline" href="/margins/login">/margins/login</Link> to host games.</p>
    </div>
  );
}
