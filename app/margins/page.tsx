import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import MarginsLogo from "@/components/MarginsLogo";

export default async function MarginsLandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "teacher" ? "/margins/teacher" : "/margins/student");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <MarginsLogo className="text-xl" />
        <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Sinon Learning ↗
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center flex flex-col items-center gap-7">
          <span className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-medium text-rose-600">
            AP World History Modern · DBQ · LEQ · SAQ
          </span>
          <h1 className="font-display text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            Practice writing.<br />Get real, honest feedback.
          </h1>
          <p className="text-stone-500 text-[15px] leading-relaxed max-w-md">
            Teachers build classes and assignments with real College Board rubrics.
            Students write their essays right here. KORA grades against the rubric and
            hands back a color-coded, annotated essay — a draft grade, always reviewed by your teacher.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
            <Link
              href="/margins/signup"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Get started
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/margins/login"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
