import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllProgress, type ModuleProgress } from "@/lib/lifeBudgetDb";
import { LIFE_BUDGET_MODULES } from "@/lib/lifeBudgetModules";

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const GREEN  = "#16a34a";

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
    <main style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Top nav */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>
          ← Simulations
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK, letterSpacing: "0.08em" }}>LIFE BUDGET</span>
        <Link href="/simulations/life-budget/portfolio"
          style={{ fontSize: 12, fontWeight: 600, color: GREEN, textDecoration: "none", border: `1px solid ${GREEN}44`, borderRadius: 20, padding: "5px 14px" }}>
          Download Portfolio →
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Hero card */}
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: "36px 40px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
              Personal Finance Portfolio
            </p>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: INK, marginBottom: 8, letterSpacing: "-0.3px" }}>
              {user.name}
            </h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 420 }}>
              {completedCount === 0
                ? "Start with Module 1. Every number you research here becomes your portfolio."
                : completedCount === LIFE_BUDGET_MODULES.length
                ? "All 10 modules complete. Download your portfolio."
                : `${completedCount} of 10 modules complete — keep going.`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <svg viewBox="0 0 76 76" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="38" cy="38" r="30" fill="none" stroke={BORDER} strokeWidth="5" />
                <circle cx="38" cy="38" r="30" fill="none" stroke={GREEN} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - percent / 100)}`}
                  strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{percent}%</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: INK }}>
                {completedCount}<span style={{ fontSize: 14, fontWeight: 400, color: MUTED }}> / 10</span>
              </p>
              <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>modules done</p>
              <p style={{ fontSize: 12, color: MUTED }}>{LIFE_BUDGET_MODULES.length - completedCount} remaining</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: BORDER, borderRadius: 2, marginBottom: 28, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${percent}%`, background: GREEN, borderRadius: 2, transition: "width 0.6s ease" }} />
        </div>

        {/* Module grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))", gap: 10 }}>
          {LIFE_BUDGET_MODULES.map((mod) => {
            const st = statusOf(mod.slug, progress);
            const p = progress.find((r) => r.module_slug === mod.slug);
            const isTransportation = mod.slug === "transportation";
            const href = isTransportation ? "/simulations/car-deal" : `/simulations/life-budget/${mod.slug}`;

            return (
              <Link
                key={mod.slug}
                href={href}
                style={{
                  display: "block", textDecoration: "none",
                  background: CARD, border: `1px solid ${st === "complete" ? mod.accent + "44" : BORDER}`,
                  borderLeft: `4px solid ${st !== "not-started" ? mod.accent : BORDER}`,
                  borderRadius: 10, padding: "18px 18px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: mod.accent,
                    background: `${mod.accent}14`, borderRadius: 20, padding: "2px 7px",
                  }}>
                    {String(mod.number).padStart(2, "0")}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, borderRadius: 20, padding: "2px 7px",
                    background: st === "complete" ? "#f0fdf4" : st === "in-progress" ? "#fefce8" : BG,
                    color: st === "complete" ? GREEN : st === "in-progress" ? "#a16207" : MUTED,
                    border: `1px solid ${st === "complete" ? "#bbf7d0" : st === "in-progress" ? "#fde68a" : BORDER}`,
                  }}>
                    {st === "complete" ? "✓ Done" : st === "in-progress" ? "In progress" : "Not started"}
                  </span>
                </div>

                <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 3 }}>{mod.title}</p>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{mod.subtitle}</p>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: MUTED }}>{mod.timeEstimate}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: mod.accent }}>
                    {st === "complete" ? "Review →" : st === "in-progress" ? "Continue →" : "Start →"}
                  </span>
                </div>

                {p?.completed_at && (
                  <p style={{ fontSize: 9, color: GREEN, marginTop: 5, fontWeight: 600 }}>
                    Completed {new Date(p.completed_at).toLocaleDateString()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Real research", body: "Every module sends you to actual government databases and financial sites — not made-up numbers." },
            { label: "Your numbers", body: "Your career, your city, your paycheck. No generic averages." },
            { label: "One portfolio", body: "Every module feeds the same document. Download a complete personal finance portfolio when you're done." },
          ].map((item) => (
            <div key={item.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "20px 22px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: GREEN, marginBottom: 5 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{item.body}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
