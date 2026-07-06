"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useMountReveal } from "@/lib/marginsMotion";

interface Answers {
  topic?: string;
  audience?: string;
  keyPoints?: string;
  length?: string;
  notes?: string;
}

interface Question {
  key: keyof Answers;
  bot: (a: Answers) => string;
  placeholder?: string;
  optional?: boolean;
  quickReplies?: string[];
}

const QUESTIONS: Question[] = [
  {
    key: "topic",
    bot: () => "Hi, I'm KORA! What's this lesson or slideshow about?",
    placeholder: "e.g. The causes of World War I",
  },
  {
    key: "audience",
    bot: (a) => `Great — a slideshow on ${a.topic}. Who's it for?`,
    placeholder: "e.g. 10th grade World History (optional)",
    optional: true,
  },
  {
    key: "keyPoints",
    bot: () => "What are the key points or sections you want to cover?",
    placeholder: "e.g. Nationalism, alliances, the assassination of Franz Ferdinand, trench warfare...",
  },
  {
    key: "length",
    bot: () => "About how long should the deck be?",
    quickReplies: ["Short (~5 slides)", "Medium (~8 slides)", "Long (~12 slides)"],
  },
  {
    key: "notes",
    bot: () => "Anything else I should know — tone, must-include facts, examples?",
    placeholder: "Optional — leave blank to skip",
    optional: true,
  },
];

function KoraAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slider-400 to-slider-700 text-white shadow-sm shadow-slider-200"
      style={{ width: size, height: size }}
    >
      <Sparkles size={size * 0.5} />
    </span>
  );
}

function ChatBubble({ from, children }: { from: "kora" | "teacher"; children: React.ReactNode }) {
  const isKora = from === "kora";
  return (
    <div className={`flex items-end gap-2 ${isKora ? "justify-start" : "justify-end"}`}>
      {isKora && <KoraAvatar size={28} />}
      <div
        className={[
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
          isKora
            ? "bg-slider-50 text-stone-800 rounded-bl-sm border border-slider-100"
            : "bg-gradient-to-br from-slider-500 to-slider-700 text-white rounded-br-sm shadow-sm shadow-slider-200",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export default function KoraBuildWizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);

  useMountReveal(containerRef, ".chat-panel", { stagger: 90, translateY: 16, duration: 420 });

  const isDone = stepIndex >= QUESTIONS.length;
  const current = !isDone ? QUESTIONS[stepIndex] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    if (latestRef.current) {
      animate(latestRef.current, { opacity: [0, 1], translateY: [10, 0], duration: 320, easing: "outQuart" });
    }
  }, [stepIndex]);

  function submitAnswer(value: string) {
    if (!current) return;
    const trimmed = value.trim();
    if (!trimmed && !current.optional) return;
    setAnswers((a) => ({ ...a, [current.key]: trimmed }));
    setDraft("");
    setStepIndex((i) => i + 1);
  }

  async function handleBuild() {
    setError(null);
    setBuilding(true);
    try {
      const res = await fetch("/api/slider/kora-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not build your slideshow.");
        setBuilding(false);
        return;
      }
      router.push(`/slider/${data.deckId}`);
    } catch {
      setError("Network error. Please try again.");
      setBuilding(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      {/* Progress */}
      <div className="chat-panel flex items-center gap-1.5" style={{ opacity: 0 }}>
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-slider-500" : "bg-stone-200"}`}
          />
        ))}
      </div>

      {/* Chat card */}
      <div className="chat-panel rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden" style={{ opacity: 0 }}>
        <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-3.5 bg-gradient-to-r from-slider-50 to-white">
          <KoraAvatar size={30} />
          <div>
            <p className="text-[13px] font-bold text-stone-800">KORA</p>
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Building your slideshow with you
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex flex-col gap-3 p-5 max-h-[420px] overflow-y-auto">
          {QUESTIONS.slice(0, stepIndex).map((q) => (
            <div key={q.key} className="flex flex-col gap-2.5">
              <ChatBubble from="kora">{q.bot(answers)}</ChatBubble>
              <ChatBubble from="teacher">{answers[q.key] || "(skipped)"}</ChatBubble>
            </div>
          ))}
          <div ref={latestRef} style={{ opacity: 0 }}>
            {!isDone && current && <ChatBubble from="kora">{current.bot(answers)}</ChatBubble>}
            {isDone && <ChatBubble from="kora">Perfect — let me put this together for you.</ChatBubble>}
          </div>
        </div>

        {!isDone && current ? (
          <div className="border-t border-stone-100 p-4 flex flex-col gap-2.5 bg-stone-50/50">
            {current.quickReplies ? (
              <div className="flex flex-wrap gap-2">
                {current.quickReplies.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => submitAnswer(r)}
                    className="rounded-full border border-slider-200 bg-white px-4 py-2 text-sm font-semibold text-slider-700 hover:bg-slider-50 hover:border-slider-300 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer(draft)}
                  placeholder={current.placeholder}
                  autoFocus
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slider-400 focus:ring-2 focus:ring-slider-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => submitAnswer(draft)}
                  className="shrink-0 rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 p-2.5 text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
            {current.optional && (
              <button
                type="button"
                onClick={() => submitAnswer("")}
                className="self-start text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Skip this question
              </button>
            )}
          </div>
        ) : (
          <div className="border-t border-stone-100 p-4 flex justify-end bg-stone-50/50">
            <button
              type="button"
              onClick={handleBuild}
              disabled={building}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all disabled:opacity-60"
            >
              {building ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {building ? "Building your slideshow…" : "Build my slideshow"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
