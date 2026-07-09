"use client";

import { useState } from "react";
import KoraBuildWizard from "@/components/slider/KoraBuildWizard";
import ContentFillForm from "@/components/slider/ContentFillForm";

type Mode = "questions" | "content";

const TABS: { id: Mode; label: string }[] = [
  { id: "questions", label: "Answer a few questions" },
  { id: "content", label: "Paste your content" },
];

const COPY: Record<Mode, string> = {
  questions: "Answer a few quick questions and KORA will draft a first version of your deck.",
  content: "Already have your own material? Paste it in and KORA will fill it into Slider's slide templates.",
};

export default function SliderBuildTabs() {
  const [mode, setMode] = useState<Mode>("questions");

  return (
    <>
      <p className="mb-6 text-sm text-stone-400">{COPY[mode]}</p>

      <div className="mb-6 inline-flex rounded-xl border border-stone-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === tab.id ? "bg-slider-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "questions" ? <KoraBuildWizard /> : <ContentFillForm />}
    </>
  );
}
