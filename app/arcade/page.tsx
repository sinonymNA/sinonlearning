import Link from "next/link";
import QuickJoin from "@/components/arcade/QuickJoin";
import GameArt from "@/components/arcade/GameArt";
import PotatoSvg from "@/components/arcade/PotatoSvg";
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
          <Link className="ar-btn sm lime" href="/arcade/shop/demo">🎁 Pack demo</Link>
          {user?.role === "teacher" && <Link className="ar-btn sm paper" href="/arcade/content">📚 My content</Link>}
          {dev && <Link className="ar-btn sm grape" href="/arcade/test-lab">🧪 Test lab</Link>}
        </nav>
      </header>
      <section className="my-6 grid items-center gap-6 md:grid-cols-[1.25fr_1fr]">
        <div>
          <h1 className="ar-h1" style={{ fontSize: "clamp(3rem, 11vw, 7rem)", lineHeight: 0.9 }}>Don&apos;t<br />hold the<br /><span className="text-[var(--sun)]">potato.</span></h1>
          <p className="mt-5 max-w-lg text-xl ar-muted">Five loud, fast party games for the whole class. Teachers make a room, kids join with a code, and the server keeps everyone honest.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="ar-btn xl" href="/arcade/host">Host a game</Link>
            <Link className="ar-btn xl mint" href="/arcade/join">Join with a code</Link>
          </div>
          <div className="mt-5 max-w-xs"><QuickJoin /></div>
        </div>
        <div className="relative grid place-items-center">
          <div className="potato h2" style={{ fontSize: 0 }}><PotatoSvg heat={2} size={300} /></div>
          <span className="stamp absolute -bottom-2 right-0" style={{ color: "var(--coral)", fontSize: "2.4rem" }}>TICK TICK</span>
        </div>
      </section>
      <section aria-label="Games" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_IDS.map((id: string, i: number) => { const g = GAME_CATALOG[id]; return (
          <article key={id} className={`stage theme-${id} transition-transform hover:-translate-y-1`} style={{ transform: `rotate(${[-1.2, 0.8, -0.6, 1, -0.9][i]}deg)`, padding: 22 }}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-3xl font-bold leading-none" style={{ color: g.color }}>{g.name}</h2><p className="mt-3 font-medium text-white/85">{g.blurb}</p></div><div className="float shrink-0"><GameArt id={id} size={84} /></div></div>
            <p className="mt-4 flex gap-2 text-sm font-bold"><span className="ar-pill">{g.minutes} min</span><span className="ar-pill">{g.min}+ players</span></p>
          </article>); })}
        <article className="ar-card flex flex-col justify-between" style={{ background: "var(--sun)", transform: "rotate(.8deg)", padding: 22 }}><div><h2 className="text-3xl font-bold leading-none">Arcade Party</h2><p className="mt-3 font-semibold">All five back to back. Scores are balanced so no single game decides it, then a podium, awards and a champion.</p></div><Link className="ar-btn mt-5 self-start" href="/arcade/host">Start a party</Link></article>
      </section>
      <p className="ar-muted mt-10 text-sm">Guests can play without an account. Coins and characters need a Sinon account. Nicknames only: no chat, no direct messages, no public profiles.</p>
    </main>
  );
}
