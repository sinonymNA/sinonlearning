import Link from "next/link";
import HostSetup from "@/components/arcade/HostSetup";
import { getArcadeUser } from "@/lib/arcadeAuth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getArcadeUser();
  return (
    <main className="ar-wrap">
      <p className="mb-3"><Link href="/arcade" className="font-bold underline">← Arcade</Link></p>
      <h1 className="ar-h1 mb-6">Host a game</h1>
      {user?.role === "teacher" ? <HostSetup /> : (
        <div className="ar-card max-w-xl"><h2 className="text-2xl font-bold">Teacher sign-in required</h2>
          <p className="mt-2">Only signed-in teacher accounts can host rooms, so students can&apos;t start sessions or control yours.{user ? " You're signed in as a student." : ""}</p>
          <Link className="ar-btn mt-4" href="/margins/login">Sign in with a Margins teacher account</Link></div>
      )}
    </main>
  );
}
