"use client";

import type { ReactNode } from "react";

const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";

interface SectionStepProps {
  number: number;
  total: number;
  title: string;
  subtitle?: string;
  isUnlocked: boolean;
  accent: string;
  children: ReactNode;
}

export default function SectionStep({
  number,
  total,
  title,
  subtitle,
  isUnlocked,
  accent,
  children,
}: SectionStepProps) {
  const isFirstSection = number === 1;

  return (
    <div style={{ position: "relative" }}>
      {/* Divider above (except first section) */}
      {!isFirstSection && (
        <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "32px 0 28px" }} />
      )}

      {/* Step header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: isUnlocked ? accent : BORDER,
          color: isUnlocked ? "#fff" : MUTED,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, transition: "background 0.3s, color 0.3s",
        }}>
          {isUnlocked ? number : "🔒"}
        </div>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: isUnlocked ? accent : FAINT,
            marginBottom: 3, transition: "color 0.3s",
          }}>
            Step {number} of {total}
          </p>
          <p style={{
            fontSize: 16, fontWeight: 700,
            color: isUnlocked ? INK : FAINT,
            marginBottom: subtitle ? 3 : 0,
            transition: "color 0.3s",
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ fontSize: 13, color: isUnlocked ? MUTED : FAINT, lineHeight: 1.5, transition: "color 0.3s" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content — always rendered for autosave, visually suppressed when locked */}
      <div style={{
        opacity: isUnlocked ? 1 : 0.35,
        pointerEvents: isUnlocked ? "auto" : "none",
        transition: "opacity 0.3s",
        position: "relative",
      }}>
        {children}

        {/* Lock overlay text */}
        {!isUnlocked && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "10px 20px",
              fontSize: 12, fontWeight: 600, color: MUTED,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              Complete the section above to unlock this one
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
