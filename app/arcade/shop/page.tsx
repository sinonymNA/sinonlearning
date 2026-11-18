import Link from "next/link";
import ShopClient from "@/components/arcade/ShopClient";
import { PrefsProvider } from "@/components/arcade/prefs";

export default function Page() {
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-6">Coin shop</h1><PrefsProvider><ShopClient /></PrefsProvider></main>;
}
