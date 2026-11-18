import Link from "next/link";
import AccountClient from "@/components/arcade/AccountClient";

export default function Page() {
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-6">Your account</h1><AccountClient /></main>;
}
