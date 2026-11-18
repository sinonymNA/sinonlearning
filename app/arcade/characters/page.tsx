import Link from "next/link";
import CollectionClient from "@/components/arcade/CollectionClient";
import { PrefsProvider } from "@/components/arcade/prefs";

export default function Page() {
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-6">Character collection</h1><PrefsProvider><CollectionClient /></PrefsProvider></main>;
}
