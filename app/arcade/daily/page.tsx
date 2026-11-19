import Link from "next/link";
import DailyPuzzle from "@/components/arcade/DailyPuzzle";
import { PrefsProvider } from "@/components/arcade/prefs";
export const metadata = { title: "Daily Puzzle | Classroom Arcade" };
export default function Page() {
  return <PrefsProvider><main className="hb narrow"><p><Link href="/arcade/solo" className="hb-back">◀ SOLO GAMES</Link></p><DailyPuzzle /></main></PrefsProvider>;
}
