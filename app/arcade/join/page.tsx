import Link from "next/link";
import JoinPage from "@/components/arcade/JoinPage";
import { PrefsProvider } from "@/components/arcade/prefs";

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <main className="ar-wrap">
      <p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p>
      <h1 className="ar-h1 mb-6 text-center">Join a game</h1>
      <PrefsProvider><JoinPage initialCode={String(code ?? "").toUpperCase().slice(0, 6)} /></PrefsProvider>
    </main>
  );
}
