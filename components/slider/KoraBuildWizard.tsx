"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

function ChatBubble({ from, children }: { from: "kora" | "teacher"; children: React.ReactNode }) {
  const isKora = from === "kora";
  return (
    <div className={`flex ${isKora ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isKora ? "bg-orange-50 text-stone-800 rounded-tl-sm" : "bg-gradient-to-br from-orange-500 to-pink-600 text-white rounded-tr-sm",
        ].join(" ")}
      >
        {isKora && (
          <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-0.5">KORA</span>
        )}
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

  useMountReveal(containerRef, ".chat-panel", { stagger: 90, translateY: 16, duration: 420 });

  const isDone = stepIndex >= QUESTIONS.length;
  const current = !isDone ? QUESTIONS[stepIndex] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
      <div
        ref={scrollRef}
        className="chat-panel rounded-2xl border border-stone-100 bg-white p-5 flex flex-col gap-3 max-h-[480px] overflow-y-auto"
        style={{ opacity: 0 }}
      >
        {QUESTIONS.slice(0, stepIndex).map((q) => (
          <div key={q.key} className="flex flex-col gap-2">
            <ChatBubble from="kora">{q.bot(answers)}</ChatBubble>
            <ChatBubble from="teacher">{answers[q.key] || "(skipped)"}</ChatBubble>
          </div>
        ))}
        {!isDone && current && <ChatBubble from="kora">{current.bot(answers)}</ChatBubble>}
        {isDone && <ChatBubble from="kora">Perfect — let me put this together for you.</ChatBubble>}
      </div>

      {!isDone && current ? (
        <div className="chat-panel flex flex-col gap-2" style={{ opacity: 0 }}>
          {current.quickReplies ? (
            <div className="flex flex-wrap gap-2">
              {current.quickReplies.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => submitAnswer(r)}
                  className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
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
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => submitAnswer(draft)}
                className="rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 p-2.5 text-white hover:shadow-md transition-all"
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
              Skip
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleBuild}
          disabled={building}
          className="chat-panel self-end inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          style={{ opacity: 0 }}
        >
          {building ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {building ? "Building your slideshow…" : "Build my slideshow"}
        </button>
      )}

      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
