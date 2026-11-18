import Link from "next/link";
import SoloMenu from "@/components/arcade/SoloMenu";
import { PrefsProvider } from "@/components/arcade/prefs";

export default function Page() {
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-2">Solo practice</h1><p className="ar-muted mb-6 text-lg">Play any game on your own against bot opponents. Win coins, open packs, collect characters.</p><PrefsProvider><SoloMenu /></PrefsProvider></main>;
}
