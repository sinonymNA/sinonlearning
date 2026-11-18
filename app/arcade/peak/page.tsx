import Link from "next/link";
import PeakClient from "@/components/arcade/PeakClient";
import { PrefsProvider } from "@/components/arcade/prefs";

export const metadata = { title: "Mastery Peak" };

export default function Page() {
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><PrefsProvider><PeakClient /></PrefsProvider></main>;
}
