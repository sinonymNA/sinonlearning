import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import MarginsLogo from "@/components/MarginsLogo";
import LandingHero from "@/components/margins/LandingHero";

export default async function MarginsLandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "teacher" ? "/margins/teacher" : "/margins/student");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <MarginsLogo width={110} />
        <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Sinon Learning ↗
        </Link>
      </header>

      <LandingHero />
    </div>
  );
}
