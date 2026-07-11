"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";

interface ModuleShellProps {
  moduleLabel: string;
  accent: string;
  filledRequired: number;
  totalRequired: number;
  isComplete: boolean;
  onMarkComplete: () => void;
  completing: boolean;
  saving: boolean;
  saved: boolean;
  phase: "hook" | "work";
  hookContent: ReactNode;
  sidebarContent: ReactNode;
  nextHref: string;
  nextLabel: string;
  children: ReactNode;
}

export default function ModuleShell({
  moduleLabel,
  accent,
  filledRequired,
  totalRequired,
  isComplete,
  onMarkComplete,
  completing,
  saving,
  saved,
  phase,
  hookContent,
  sidebarContent,
  nextHref,
  nextLabel,
  children,
}: ModuleShellProps) {
  const allFilled = filledRequired === totalRequired;

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: CARD, borderBottom: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>
          ← Life Budget
        </Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>{moduleLabel}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span style={{ fontSize: 11, color: FAINT }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Saved</span>}
          {phase === "hook" && (
            <span style={{ fontSize: 11, color: FAINT }}>Finish the intro to unlock the form</span>
          )}
          {phase === "work" && (
            isComplete
              ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: GREEN,
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 20, padding: "4px 12px",
                }}>✓ Complete</span>
              )
              : (
                <button
                  onClick={onMarkComplete}
                  disabled={!allFilled || completing}
                  style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "5px 16px", border: "none",
                    cursor: allFilled ? "pointer" : "not-allowed",
                    background: allFilled ? accent : BORDER,
                    color: allFilled ? "#fff" : MUTED,
                    transition: "background 0.2s",
                  }}
                >
                  {completing ? "Saving…" : `Complete (${filledRequired}/${totalRequired})`}
                </button>
              )
          )}
        </div>
      </div>

      {/* Hook phase — full width */}
      {phase === "hook" && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 80px" }}>
          {hookContent}
        </div>
      )}

      {/* Work phase — two-column */}
      {phase === "work" && (
        <div style={{
          maxWidth: 960, margin: "0 auto", padding: "36px 24px 80px",
          display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start",
        }}>

          {/* Main form column */}
          <div>
            {children}

            {/* Bottom complete button */}
            {!isComplete && (
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={onMarkComplete}
                  disabled={!allFilled || completing}
                  style={{
                    fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 40px",
                    border: "none", width: "100%",
                    cursor: allFilled ? "pointer" : "not-allowed",
                    background: allFilled ? accent : BORDER,
                    color: allFilled ? "#fff" : MUTED,
                    transition: "background 0.2s",
                  }}
                >
                  {completing
                    ? "Saving…"
                    : allFilled
                    ? "Mark Complete →"
                    : `Fill required fields (${filledRequired} / ${totalRequired} done)`}
                </button>
              </div>
            )}

            {/* Completion card */}
            {isComplete && (
              <div style={{
                marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 12, padding: "20px 24px", textAlign: "center",
              }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>
                  ✓ Complete!
                </p>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                  Your data is saved. Head to the next module when you&apos;re ready.
                </p>
                <Link
                  href={nextHref}
                  style={{
                    display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff",
                    background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none",
                  }}
                >
                  {nextLabel} →
                </Link>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 64 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </main>
  );
}
