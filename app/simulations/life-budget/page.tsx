import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllProgress, type ModuleProgress } from "@/lib/lifeBudgetDb";
import { LIFE_BUDGET_MODULES } from "@/lib/lifeBudgetModules";

function statusOf(slug: string, progress: ModuleProgress[]) {
  const p = progress.find((r) => r.module_slug === slug);
  if (!p) return "not-started";
  if (p.completed_at) return "complete";
  return "in-progress";
}

function pct(progress: ModuleProgress[]) {
  const completed = LIFE_BUDGET_MODULES.filter(
    (m) => progress.find((p) => p.module_slug === m.slug && p.completed_at)
  ).length;
  return Math.round((completed / LIFE_BUDGET_MODULES.length) * 100);
}

export default async function LifeBudgetHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/margins/login?next=/simulations/life-budget");

  const progress = await getAllProgress(user.id);
  const completedCount = LIFE_BUDGET_MODULES.filter(
    (m) => progress.find((p) => p.module_slug === m.slug && p.completed_at)
  ).length;
  const percent = pct(progress);

  return (
    <main className="min-h-screen" style={{ background: "#0d1117", color: "#e2e8f0" }}>
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#21262d] pb-5 mb-2">
          <Link href="/simulations" className="text-xs font-medium tracking-[0.18em] text-[#64748b] hover:text-[#e2e8f0] transition">
            ← SIMULATIONS
          </Link>
          <div className="flex items-center gap-2 text-sm font-black tracking-[0.22em]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 10px #10b98199" }} />
            LIFE BUDGET
          </div>
          <Link href="/simulations/life-budget/portfolio"
            className="rounded-full border border-[#21262d] px-4 py-1.5 text-xs font-semibold text-[#64748b] hover:border-[#10b981] hover:text-[#10b981] transition">
            Download Portfolio →
          </Link>
        </header>

        {/* Student intro */}
        <section className="py-8 border-b border-[#21262d]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-[#10b981]">PERSONAL FINANCE PORTFOLIO</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{user.name}</h1>
              <p className="mt-2 text-[#64748b] text-sm">
                {completedCount === 0
                  ? "Start with Module 1 — every number you research here becomes your portfolio."
                  : completedCount === LIFE_BUDGET_MODULES.length
                  ? "All 10 modules complete. Download your portfolio."
                  : `${completedCount} of 10 modules complete. Keep going.`}
              </p>
            </div>

            {/* Progress ring / bar */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="rotate-[-90deg]">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#21262d" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - percent / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-[#10b981]">{percent}%</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black">{completedCount}<span className="text-[#64748b] font-normal text-base"> / 10</span></p>
                <p className="text-xs text-[#64748b] mt-1">modules complete</p>
                <p className="text-xs text-[#64748b]">{LIFE_BUDGET_MODULES.length - completedCount} remaining</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
            <div className="h-full rounded-full bg-[#10b981] transition-all duration-700"
              style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[#475569]">
            {LIFE_BUDGET_MODULES.map((m) => {
              const st = statusOf(m.slug, progress);
              return (
                <div key={m.slug} className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full"
                    style={{ background: st === "complete" ? "#10b981" : st === "in-progress" ? "#f59e0b" : "#21262d", border: st === "not-started" ? "1px solid #334155" : "none" }} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Module grid */}
        <section className="py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-3">
            {LIFE_BUDGET_MODULES.map((mod) => {
              const st = statusOf(mod.slug, progress);
              const p = progress.find((r) => r.module_slug === mod.slug);
              const isTransportation = mod.slug === "transportation";

              return (
                <Link
                  key={mod.slug}
                  href={isTransportation ? "/simulations/car-deal" : `/simulations/life-budget/${mod.slug}`}
                  className="group flex flex-col rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    borderColor: st === "complete" ? `${mod.accent}44` : "#21262d",
                    background: st === "complete" ? `${mod.accent}09` : "#161b22",
                    boxShadow: st === "complete" ? `0 0 20px ${mod.accent}11` : "none",
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-1 rounded-t-2xl" style={{ background: st !== "not-started" ? mod.accent : "#21262d" }} />

                  <div className="flex-1 p-4">
                    {/* Number + status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black tracking-[0.2em] rounded-full px-2 py-0.5"
                        style={{ background: `${mod.accent}22`, color: mod.accent }}>
                        {String(mod.number).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: st === "complete" ? "#052e16" : st === "in-progress" ? "rgba(245,158,11,0.12)" : "#1e293b",
                          color: st === "complete" ? "#4ade80" : st === "in-progress" ? "#f59e0b" : "#475569",
                          border: `1px solid ${st === "complete" ? "#166534" : st === "in-progress" ? "rgba(245,158,11,0.3)" : "#334155"}`,
                        }}>
                        {st === "complete" ? "✓ Done" : st === "in-progress" ? "In Progress" : "Not started"}
                      </span>
                    </div>

                    <h2 className="text-sm font-black leading-tight" style={{ color: st !== "not-started" ? mod.accent : "#e2e8f0" }}>
                      {mod.title}
                    </h2>
                    <p className="mt-1 text-[11px] leading-4 text-[#64748b]">{mod.subtitle}</p>

                    {/* Research sites */}
                    <div className="mt-3 space-y-1">
                      {mod.researchSites.slice(0, 2).map((site) => (
                        <p key={site} className="text-[9px] text-[#334155] truncate">🔗 {site}</p>
                      ))}
                    </div>

                    {p && !p.completed_at && (
                      <p className="mt-3 text-[9px] text-[#475569]">
                        Last updated {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    )}
                    {p?.completed_at && (
                      <p className="mt-3 text-[9px] text-[#4ade80]">
                        ✓ Completed {new Date(p.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#475569]">Unit {mod.courseUnit} · {mod.timeEstimate}</span>
                      <span className="text-[10px] font-bold transition group-hover:translate-x-0.5" style={{ color: mod.accent }}>
                        {st === "complete" ? "Review →" : st === "in-progress" ? "Continue →" : "Start →"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How this works */}
        <section className="border-t border-[#21262d] pt-8 pb-12">
          <p className="text-xs font-bold tracking-[0.2em] text-[#10b981] mb-4">HOW THIS WORKS</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Research real sites", body: "Each module sends you to actual government databases, financial calculators, and listing sites — not made-up numbers." },
              { label: "Your numbers, your life", body: "Every decision you make is based on your actual career choice, your city, your health situation. There's no generic answer." },
              { label: "One portfolio", body: "Every module feeds the same document. When you're done, download a complete personal finance portfolio you can actually use after this class." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
                <p className="text-sm font-bold text-[#10b981] mb-2">{item.label}</p>
                <p className="text-xs leading-5 text-[#64748b]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
