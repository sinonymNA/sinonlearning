import Link from "next/link";
import SoloMenu from "@/components/arcade/SoloMenu";
import { PrefsProvider } from "@/components/arcade/prefs";

export default function Page() {
  return <PrefsProvider><main className="hb"><p><Link href="/arcade/solo" className="hb-back">◀ SOLO GAMES</Link></p><h1 className="hb-title">PRACTICE</h1><p className="hb-sub">Play any party game on your own against bots. Win coins, open packs, collect characters.</p><SoloMenu /></main></PrefsProvider>;
}
