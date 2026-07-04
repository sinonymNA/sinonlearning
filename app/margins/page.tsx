import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PenLine, Sparkles, Highlighter } from "lucide-react";
import { getCurrentUser } from "@/lib/marginsAuth";
import MarginsLogo from "@/components/MarginsLogo";
import DemoButtons from "@/components/margins/DemoButtons";

const steps = [
  {
    icon: PenLine,
    title: "Write",
    description: "Join your class and write your DBQ, LEQ, or SAQ essay right in the browser.",
  },
  {
    icon: Sparkles,
    title: "KORA grades",
    description: "KORA scores your essay against your teacher's exact rubric, point by point.",
  },
  {
    icon: Highlighter,
    title: "Get annotated feedback",
    description: "See a color-coded, highlighted version of your own essay with notes on every line.",
  },
];

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

      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-lg text-center flex flex-col items-center gap-7">
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-600">
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
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
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

          <DemoButtons />
        </div>

        {/* How it works */}
        <div className="w-full max-w-3xl mt-20">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-8">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-stone-100 bg-white p-6 text-center">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-3">
                  <step.icon size={20} strokeWidth={1.75} />
                </span>
                <p className="font-semibold text-stone-900 text-[15px]">{step.title}</p>
                <p className="mt-1.5 text-[13px] text-stone-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
