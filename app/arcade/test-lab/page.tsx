import Link from "next/link";
import TestLab from "@/components/arcade/TestLab";
import { PrefsProvider } from "@/components/arcade/prefs";
import { getArcadeUser } from "@/lib/arcadeAuth";
// @ts-ignore - plain ESM
import { isDeveloper } from "../../../arcade-server/api.mjs";

export const dynamic = "force-dynamic";

/** Private developer lab. The page is gated here AND every /api/arcade/dev call is re-authorised on the server. */
export default async function Page() {
  const user = await getArcadeUser();
  if (!isDeveloper(user)) {
    return <main className="ar-wrap"><div className="ar-card max-w-xl"><h1 className="text-2xl font-bold">Not available</h1><p className="mt-2">The developer test lab is private.</p><Link className="ar-btn mt-4" href="/arcade">Back to the arcade</Link></div></main>;
  }
  return <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-6">🧪 Developer test lab</h1><PrefsProvider><TestLab /></PrefsProvider></main>;
}
