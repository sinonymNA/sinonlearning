import Link from "next/link";
import PackDemo from "@/components/arcade/PackDemo";
import { PrefsButtons, PrefsProvider } from "@/components/arcade/prefs";

export default function Page() {
  return (
    <main className="ar-wrap">
      <PrefsProvider>
        <div className="mb-3 flex items-center justify-between"><Link href="/arcade/shop" className="font-bold underline">← Shop</Link><PrefsButtons /></div>
        <h1 className="ar-h1 mb-6">Pack opening demo</h1>
        <PackDemo />
      </PrefsProvider>
    </main>
  );
}
