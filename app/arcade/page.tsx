import Link from "next/link";

const games = [
  { name: "Hot Potato", slug: "hot_potato", icon: "🥔", description: "Pass the potato with valid words before it overheats.", status: "Playable first release" },
  { name: "Quick Draw", slug: "quick_draw", icon: "🎨", description: "Draw secret prompts while your team guesses.", status: "Building next" },
  { name: "Last One Standing", slug: "last_one_standing", icon: "⚡", description: "Answer fast, stay in the arena.", status: "Building next" },
  { name: "Telephone", slug: "telephone", icon: "☎️", description: "Watch drawings and descriptions transform.", status: "Building next" },
  { name: "Imposter", slug: "imposter", icon: "🕵️", description: "Ask, answer, and catch the bluff.", status: "Building next" },
];

export default function ArcadePage() {
  return <main className="min-h-screen bg-[#10152b] px-5 py-12 text-white sm:px-10">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Sinon Learning</p><h1 className="mt-3 text-5xl font-black tracking-tight">Classroom Arcade</h1><p className="mt-4 max-w-2xl text-lg text-slate-300">Fast, original multiplayer games for the whole room. Teachers host. Students join with a code.</p></div>
        <Link href="/arcade/host" className="rounded-2xl bg-amber-300 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-amber-300/20">Host a game</Link>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{games.map((game) => <article key={game.slug} className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-xl"><div className="text-5xl">{game.icon}</div><h2 className="mt-5 text-2xl font-black">{game.name}</h2><p className="mt-2 min-h-12 text-slate-300">{game.description}</p><span className="mt-5 inline-block rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-bold text-cyan-200">{game.status}</span></article>)}</div>
      <div className="mt-10 rounded-3xl border border-violet-300/20 bg-violet-300/10 p-6"><h2 className="text-xl font-bold">Developer test lab</h2><p className="mt-2 text-slate-300">Spawn simulated players, test server rules, and inspect the room before using it with a class.</p><Link href="/arcade/test-lab" className="mt-4 inline-block rounded-xl border border-white/20 px-4 py-2 font-semibold">Open test lab</Link></div>
    </div>
  </main>;
}
