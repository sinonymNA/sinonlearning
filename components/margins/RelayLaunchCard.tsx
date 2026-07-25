import Link from "next/link";
import { Shuffle, Timer, Users } from "lucide-react";
import { RELAY_MOVES, RELAY_SPRITES } from "@/lib/relayGame";

// Entry point into Relay from the Margins dashboards.
//
// The logo is the button: it anchors the top of the card and the whole card is
// the hit target. It sits on its own row rather than in a left column — the
// wordmark is a wide 3.2:1 lockup, and as a flex sibling it starved the copy
// into a two-words-per-line ribbon on the narrower student dashboard.
//
// Kept on a light surface deliberately: the wordmark is purple-on-white art
// with a red underline and disappears against the saturated gradients used
// elsewhere in Margins (the Scout card, for instance).

interface Props {
  /** Teachers host a room; students join one. */
  role: "teacher" | "student";
}

export default function RelayLaunchCard({ role }: Props) {
  const isTeacher = role === "teacher";
  const href = isTeacher ? "/margins/relay" : "/margins/relay/join";

  return (
    <Link
      href={href}
      aria-label={isTeacher ? "Host a Relay writing game" : "Join a Relay writing game"}
      className="group relative block overflow-hidden rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/70 sm:p-6"
    >
      {/* Soft wash + dot field, echoing the Scout card's treatment without
          competing with the wordmark's own colour. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50/70 via-white to-white" />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, rgb(196 181 253 / 0.55) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          maskImage: "linear-gradient(to bottom right, black, transparent 60%)",
          WebkitMaskImage: "linear-gradient(to bottom right, black, transparent 60%)",
        }}
      />

      <div className="relative">
        {/* Logo row — the button proper, plus the four moves as a promise of
            what a round looks like. */}
        <div className="flex items-center justify-between gap-4">
          <img
            src={RELAY_SPRITES.logo}
            alt="Relay"
            className="h-11 w-auto origin-left transition-transform duration-300 group-hover:scale-[1.04] sm:h-14"
          />
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {RELAY_MOVES.map((m, i) => (
              <img
                key={m.id}
                src={m.sprite}
                alt=""
                aria-hidden
                className="h-8 w-auto opacity-45 transition-opacity duration-300 group-hover:opacity-100"
                style={{ transitionDelay: `${i * 45}ms` }}
              />
            ))}
          </div>
        </div>

        <p className="mt-3.5 text-[15px] font-bold leading-snug text-stone-900">
          {isTeacher ? "Run a live essay relay" : "Join a live essay relay"}
        </p>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-stone-500">
          {isTeacher
            ? "Random teams write one AP essay together — nobody writes the whole thing. KORA scores every essay on the real rubric."
            : "You'll be put in a random team and write one part of an essay, then pick up where a teammate left off."}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
            <Shuffle size={12} className="shrink-0 text-violet-400" /> Random teams
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
            <Timer size={12} className="shrink-0 text-violet-400" /> 4 timed rounds
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
            <Users size={12} className="shrink-0 text-violet-400" />
            {isTeacher ? "2–32 students" : "No account needed"}
          </span>
          <span className="ml-auto text-[14px] font-semibold text-violet-600 transition-transform group-hover:translate-x-0.5">
            {isTeacher ? "Host →" : "Join →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
