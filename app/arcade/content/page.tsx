import Link from "next/link";
import ContentManager from "@/components/arcade/ContentManager";
import { getArcadeUser } from "@/lib/arcadeAuth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getArcadeUser();
  return (
    <main className="ar-wrap"><p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p><h1 className="ar-h1 mb-6">Teacher content</h1>
      {user?.role === "teacher" ? <ContentManager /> : <div className="ar-card max-w-xl"><h2 className="text-2xl font-bold">Teacher sign-in required</h2><Link className="ar-btn mt-4" href="/margins/login">Sign in</Link></div>}
    </main>
  );
}
