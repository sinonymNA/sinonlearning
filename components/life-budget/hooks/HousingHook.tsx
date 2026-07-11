"use client";

import { useState } from "react";
import HousingNarrativeLesson from "../lessons/HousingNarrativeLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#7c3aed";

const CITIES = [
  { name: "Atlanta, GA",  rent: 1350, emoji: "🍑" },
  { name: "Austin, TX",   rent: 1500, emoji: "🤠" },
  { name: "Denver, CO",   rent: 1650, emoji: "🏔️" },
  { name: "Seattle, WA",  rent: 2100, emoji: "☕" },
] as const;

type CityName = (typeof CITIES)[number]["name"];

export default function HousingHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [selected, setSelected] = useState<CityName | null>(null);
  const [explored, setExplored] = useState<Set<CityName>>(new Set());

  if (step === "terms") return <HousingNarrativeLesson onReady={onReady} />;

  const click = (name: CityName) => {
    setSelected(name);
    setExplored((prev) => new Set([...prev, name]));
  };

  const city = CITIES.find((c) => c.name === selected);
  const neededNet = city ? city.rent / 0.30 : null;
  const neededGross = neededNet ? neededNet * (1 / 0.72) : null; // rough 28% tax rate

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          City Reality Check
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          The 30% rule says housing shouldn&apos;t exceed 30% of your take-home pay.
          Tap a city to see what salary that actually requires.
        </p>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto" }}>

        {/* City grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {CITIES.map((c) => {
            const isSelected = selected === c.name;
            const wasExplored = explored.has(c.name);
            return (
              <button
                key={c.name}
                onClick={() => click(c.name)}
                style={{
                  padding: "18px 20px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `2px solid ${isSelected ? ACCENT : BORDER}`,
                  background: isSelected ? ACCENT + "0e" : CARD,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 2 }}>{c.name}</p>
                <p style={{ fontSize: 13, color: MUTED }}>Median 1BR: <strong style={{ color: INK }}>${c.rent.toLocaleString()}/mo</strong></p>
                {wasExplored && !isSelected && (
                  <p style={{ fontSize: 11, color: ACCENT, marginTop: 4, fontWeight: 600 }}>✓ explored</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {city && neededNet && neededGross && (
          <div style={{
            background: ACCENT + "08", border: `1px solid ${ACCENT}33`,
            borderRadius: 14, padding: "24px", marginBottom: 24,
            transition: "all 0.3s",
          }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 16 }}>
              {city.emoji} {city.name} — what it really takes
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px", border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Median 1BR Rent
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: INK }}>${city.rent.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/mo</span></p>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px", border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Net Pay Needed
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: INK }}>${Math.ceil(neededNet / 100) * 100}<span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/mo</span></p>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px", border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Gross Salary Needed
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: INK }}>~${Math.round(neededGross / 1000) * 1000 / 1000}K<span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/yr</span></p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              To stay under the 30% rule, you&apos;d need to earn at least <strong>${Math.ceil(neededGross / 1000)}K/year</strong> before taxes just to cover rent alone —
              before utilities, food, or a single other expense.
            </p>

            {explored.size >= 2 && (
              <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginTop: 10 }}>
                Tip: With a roommate, you can cut housing by 40–50% — and unlock cities that would otherwise be out of reach.
              </p>
            )}
          </div>
        )}

        {explored.size >= 1 && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Now find an actual listing in YOUR city and lock in your real numbers.
            </p>
            <button
              onClick={() => setStep("terms")}
              style={{
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: ACCENT, border: "none",
                borderRadius: 10, padding: "14px 36px", cursor: "pointer",
              }}
            >
              Next: Learn the Terms →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
