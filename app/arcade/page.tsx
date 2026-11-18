import Link from "next/link";
import QuickJoin from "@/components/arcade/QuickJoin";
import Avatar from "@/components/arcade/Avatar";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";
import { getArcadeUser } from "@/lib/arcadeAuth";
// @ts-ignore - plain ESM
import { isDeveloper } from "../../arcade-server/api.mjs";

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  const user = await getArcadeUser();
  const dev = isDeveloper(user);
  return (
    <main className="ar-wrap">
      <header className="flex flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/" className="font-bold underline">← Sinon Learning</Link>
        <nav className="flex flex-wrap gap-2" aria-label="Arcade">
          <Link className="ar-btn sm paper" href="/arcade/characters">🧸 Characters</Link>
          <Link className="ar-btn sm paper" href="/arcade/shop">🪙 Shop</Link>
          {user?.role === "teacher" && <Link className="ar-btn sm paper" href="/arcade/content">📚 My content</Link>}
          {dev && <Link className="ar-btn sm grape" href="/arcade/test-lab">🧪 Test lab</Link>}
        </nav>
      </header>
      <section className="my-8 grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="ar-pill mb-3">Original multiplayer games for the whole class</p>
          <h1 className="ar-h1">Classroom <span className="text-[var(--sun)]">Arcade</span></h1>
          <p className="mt-4 max-w-xl text-xl ar-muted">Five fast party games for up to 40 students. Teachers host with a room code, students join on any device, and every score is decided on the server.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ar-btn xl" href="/arcade/host">🎤 Host a game</Link>
            <Link className="ar-btn xl mint" href="/arcade/join">🎮 Join a game</Link>
          </div>
        </div>
        <div className="ar-panel grid gap-4 text-center">
          <p className="ar-h2">Got a code?</p>
          <div className="mx-auto"><QuickJoin /></div>
          <div className="flex flex-wrap justify-center gap-1">{["c-blip", "c-ember", "c-gizmo", "c-wisp", "rk-sun", "c-nova"].map((id, i) => <div key={id} className="float" style={{ animationDelay: `${i * 0.2}s` }}><Avatar id={id} size={54} /></div>)}</div>
        </div>
      </section>
      <section aria-label="Games" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_IDS.map((id: string) => { const g = GAME_CATALOG[id]; return (
          <article key={id} className="ar-card" style={{ borderTop: `14px solid ${g.color}` }}>
            <div className="text-5xl">{g.icon}</div><h2 className="mt-2 text-2xl font-bold">{g.name}</h2><p className="mt-1 min-h-16 font-medium">{g.blurb}</p>
            <p className="mt-3 flex gap-2 text-sm font-bold"><span className="ar-chip">⏱ {g.minutes} min</span><span className="ar-chip">👥 {g.min}+ players</span></p>
          </article>); })}
        <article className="ar-card" style={{ background: "var(--grape)", color: "#fff" }}><div className="text-5xl">🎉</div><h2 className="mt-2 text-2xl font-bold">Arcade Party</h2><p className="mt-1 font-medium">Play all five in a row. Scores are normalised across games and a final podium crowns the champion.</p><Link className="ar-btn sm mt-4" href="/arcade/host">Start a party</Link></article>
      </section>
      <p className="ar-muted mt-10 text-sm">Guests can play without an account. Coins and characters need a Sinon account. Nicknames only: no chat, no direct messages, no public profiles.</p>
    </main>
  );
}
