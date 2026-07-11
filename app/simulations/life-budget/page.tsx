import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllProgress, type ModuleProgress } from "@/lib/lifeBudgetDb";
import { LIFE_BUDGET_MODULES } from "@/lib/lifeBudgetModules";

// ── palette ───────────────────────────────────────────────────────────────────

const DESK   = "#ccc0aa";   // warm tan desk surface
const PAPER  = "#faf8f3";   // warm white paper
const RULE   = "#ddd5c8";   // document rule / border
const INK    = "#1c1917";   // primary ink
const MUTED  = "#78716c";   // secondary ink
const STAMP  = "#15803d";   // completion stamp green

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
    <main className="min-h-screen" style={{ background: DESK, color: INK }}>
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8">

        {/* Header */}
        <header className="flex items-center justify-between pb-5 mb-2"
          style={{ borderBottom: `1px solid ${RULE}` }}>
          <Link href="/simulations"
            className="text-xs font-medium tracking-[0.18em] transition"
            style={{ color: MUTED }}>
            ← SIMULATIONS
          </Link>
          <div className="flex items-center gap-2 text-sm font-black tracking-[0.22em]" style={{ color: INK }}>
            <span className="h-2 w-2 rounded-full" style={{ background: STAMP }} />
            LIFE BUDGET
          </div>
          <Link href="/simulations/life-budget/portfolio"
            className="rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-70"
            style={{ borderColor: RULE, color: MUTED, background: PAPER }}>
            Download Portfolio →
          </Link>
        </header>

        {/* Student intro */}
        <section className="py-8" style={{ borderBottom: `1px solid ${RULE}` }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.28em]" style={{ color: STAMP }}>
                PERSONAL FINANCE PORTFOLIO
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: INK }}>
                {user.name}
              </h1>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>
                {completedCount === 0
                  ? "Start with Module 1 — every number you research here becomes your portfolio."
                  : completedCount === LIFE_BUDGET_MODULES.length
                  ? "All 10 modules complete. Download your portfolio."
                  : `${completedCount} of 10 modules complete. Keep going.`}
              </p>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 80 80" className="rotate-[-90deg]">
                  <circle cx="40" cy="40" r="32" fill="none" stroke={RULE} strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={STAMP} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - percent / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black" style={{ color: STAMP }}>{percent}%</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: INK }}>
                  {completedCount}<span className="font-normal text-base" style={{ color: MUTED }}> / 10</span>
                </p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>modules complete</p>
                <p className="text-xs" style={{ color: MUTED }}>{LIFE_BUDGET_MODULES.length - completedCount} remaining</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 rounded-full overflow-hidden" style={{ background: RULE }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: STAMP }} />
          </div>
          <div className="mt-2 flex justify-between">
            {LIFE_BUDGET_MODULES.map((m) => {
              const st = statusOf(m.slug, progress);
              return (
                <div key={m.slug} className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full"
                    style={{
                      background: st === "complete" ? STAMP : st === "in-progress" ? "#b45309" : PAPER,
                      border: `1px solid ${st === "not-started" ? RULE : "transparent"}`,
                    }} />
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
                  className="group flex flex-col rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: PAPER,
                    border: `1px solid ${st === "complete" ? `${mod.accent}55` : RULE}`,
                    boxShadow: st === "complete"
                      ? `0 2px 10px ${mod.accent}22`
                      : "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Top tab */}
                  <div className="h-1 rounded-t-xl"
                    style={{ background: st !== "not-started" ? mod.accent : RULE }} />

                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black tracking-[0.2em] rounded-full px-2 py-0.5"
                        style={{ background: `${mod.accent}18`, color: mod.accent }}>
                        {String(mod.number).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: st === "complete" ? "#f0fdf4" : st === "in-progress" ? "#fffbeb" : "#f5f5f5",
                          color: st === "complete" ? STAMP : st === "in-progress" ? "#b45309" : MUTED,
                          border: `1px solid ${st === "complete" ? "#bbf7d0" : st === "in-progress" ? "#fde68a" : RULE}`,
                        }}>
                        {st === "complete" ? "✓ Done" : st === "in-progress" ? "In Progress" : "Not started"}
                      </span>
                    </div>

                    <h2 className="text-sm font-black leading-tight"
                      style={{ color: st !== "not-started" ? mod.accent : INK }}>
                      {mod.title}
                    </h2>
                    <p className="mt-1 text-[11px] leading-4" style={{ color: MUTED }}>{mod.subtitle}</p>

                    <div className="mt-3 space-y-1">
                      {mod.researchSites.slice(0, 2).map((site) => (
                        <p key={site} className="text-[9px] truncate" style={{ color: "#a8a29e" }}>🔗 {site}</p>
                      ))}
                    </div>

                    {p && !p.completed_at && (
                      <p className="mt-3 text-[9px]" style={{ color: MUTED }}>
                        Last updated {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    )}
                    {p?.completed_at && (
                      <p className="mt-3 text-[9px] font-bold" style={{ color: STAMP }}>
                        ✓ Completed {new Date(p.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="px-4 pb-4" style={{ borderTop: `1px solid ${RULE}` }}>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-[9px]" style={{ color: MUTED }}>Unit {mod.courseUnit} · {mod.timeEstimate}</span>
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
        <section className="pt-8 pb-12" style={{ borderTop: `1px solid ${RULE}` }}>
          <p className="text-[10px] font-bold tracking-[0.2em] mb-4" style={{ color: STAMP }}>HOW THIS WORKS</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Research real sites", body: "Each module sends you to actual government databases, financial calculators, and listing sites — not made-up numbers." },
              { label: "Your numbers, your life", body: "Every decision you make is based on your actual career choice, your city, your health situation. There's no generic answer." },
              { label: "One portfolio", body: "Every module feeds the same document. When you're done, download a complete personal finance portfolio you can actually use after this class." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-5"
                style={{ background: PAPER, border: `1px solid ${RULE}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <p className="text-sm font-bold mb-2" style={{ color: STAMP }}>{item.label}</p>
                <p className="text-xs leading-5" style={{ color: MUTED }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
