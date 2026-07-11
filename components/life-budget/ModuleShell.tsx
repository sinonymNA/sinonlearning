"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";

export interface CompletionHighlight {
  label: string;
  value: string;
  sub?: string;
}

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
  completionHighlights?: CompletionHighlight[];
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
  completionHighlights,
}: ModuleShellProps) {
  const allFilled = filledRequired === totalRequired;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visibleHighlights = completionHighlights?.filter((h) => h.value) ?? [];

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: CARD, borderBottom: `1px solid ${BORDER}`,
        padding: isMobile ? "10px 16px" : "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>
          ← Life Budget
        </Link>
        {!isMobile && (
          <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>{moduleLabel}</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span style={{ fontSize: 11, color: FAINT }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Saved</span>}
          {phase === "hook" && !isMobile && (
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
        <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "32px 16px 60px" : "48px 24px 80px" }}>
          {hookContent}
        </div>
      )}

      {/* Work phase — two-column on desktop, stacked on mobile */}
      {phase === "work" && (
        <div style={{
          maxWidth: 960, margin: "0 auto",
          padding: isMobile ? "24px 16px 60px" : "36px 24px 80px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
          gap: 24, alignItems: "start",
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

                {visibleHighlights.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile || visibleHighlights.length === 1 ? "1fr" : "1fr 1fr",
                    gap: 8,
                    margin: "12px 0 16px",
                    textAlign: "left",
                  }}>
                    {visibleHighlights.map((h, i) => (
                      <div key={i} style={{
                        background: "#fff",
                        border: "1px solid #bbf7d0",
                        borderRadius: 8,
                        padding: "10px 14px",
                      }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                          {h.label}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: INK }}>{h.value}</p>
                        {h.sub && <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{h.sub}</p>}
                      </div>
                    ))}
                  </div>
                )}

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

          {/* Sidebar — sticky on desktop, stacked below on mobile */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? undefined : 64,
          }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </main>
  );
}
