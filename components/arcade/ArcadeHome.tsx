"use client";

import Link from "next/link";
import GameArt from "./GameArt";
import DailyPuzzle from "./DailyPuzzle";
import QuickJoin from "./QuickJoin";
import { GAME_CATALOG, GAME_IDS } from "@/lib/arcadeCatalog";

const MODES = [
  { href: "/arcade/abyss", icon: "🌊", name: "Abyss", note: "Rare answers, deeper dives", cls: "sky" },
  { href: "/arcade/join", icon: "🎮", name: "Join a game", note: "Got a code?", cls: "sun" },
  { href: "/arcade/solo", icon: "🕹️", name: "Solo practice", note: "Beat the bots", cls: "mint" },
  { href: "/arcade/peak", icon: "⛰️", name: "Mastery Peak", note: "Climb to the top", cls: "grape" },
  { href: "/arcade/shop", icon: "🛍️", name: "Today's shop", note: "New deals daily", cls: "coral" },
  { href: "/arcade/characters", icon: "🧸", name: "Collection", note: "Your characters", cls: "lime" },
];

export default function ArcadeHome({ teacher, dev }: { teacher: boolean; dev: boolean }) {
  const modes = [
    ...(teacher ? [{ href: "/arcade/host", icon: "📺", name: "Host a game", note: "Start a room", cls: "sun" }, { href: "/arcade/content", icon: "📚", name: "My content", note: "Sets + AI builder", cls: "paper" }] : []),
    ...MODES,
    ...(dev ? [{ href: "/arcade/test-lab", icon: "🧪", name: "Test lab", note: "Bots + load", cls: "paper" }] : []),
  ];
  return (
    <main className="home-grid">
      <div className="home-left"><DailyPuzzle /></div>
      <div className="home-right">
        <div className="ar-panel home-join" style={{ animationDelay: "80ms" }}><QuickJoin /></div>
        <div className="mode-grid">
          {modes.map((m, i) => (
            <Link key={m.href} href={m.href} className={`mode-tile ${m.cls}`} style={{ animationDelay: `${140 + i * 70}ms` }}>
              <span className="mode-icon">{m.icon}</span><span className="mode-name">{m.name}</span><span className="mode-note">{m.note}</span>
            </Link>
          ))}
        </div>
        <div className="game-strip" aria-label="Games">
          {GAME_IDS.map((id: string, i: number) => (
            <div key={id} className="game-chip" style={{ animationDelay: `${600 + i * 60}ms`, borderColor: GAME_CATALOG[id].color }} title={GAME_CATALOG[id].name}>
              <GameArt id={id} size={34} /><span>{GAME_CATALOG[id].name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
