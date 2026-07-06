"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Gamepad2,
  CitrusIcon,
  TrendingUp,
  BookOpen,
  Coins,
} from "lucide-react";
import FadeIn from "./FadeIn";
import MarginsLogo from "./MarginsLogo";
import DashLogo from "./DashLogo";
import SliderLogo from "./SliderLogo";
import ReelLogo from "./ReelLogo";

interface MarqueeApp {
  href: string;
  label: string;
  sub: string;
  mark: React.ReactNode;
}

function ScaffoldMark() {
  return (
    <span
      className="font-extrabold tracking-tight text-2xl select-none"
      style={{
        background: "linear-gradient(90deg, #9061F9 0%, #5B21B6 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      [scaffold]
    </span>
  );
}

const apps: MarqueeApp[] = [
  {
    href: "/notesheet",
    label: "Scaffold",
    sub: "Notes generator",
    mark: <ScaffoldMark />,
  },
  {
    href: "/research/kora-model",
    label: "KORA",
    sub: "Teacher-first AI",
    mark: (
      <Image src="/kora-logo.png" alt="KORA" width={88} height={33} style={{ width: 88, height: "auto" }} />
    ),
  },
  {
    href: "/margins",
    label: "Margins",
    sub: "AP writing & grading",
    mark: <MarginsLogo width={100} />,
  },
  {
    href: "/dash",
    label: "Dash",
    sub: "Run the room",
    mark: <DashLogo width={80} />,
  },
  {
    href: "/slider",
    label: "Slider",
    sub: "Slideshow builder",
    mark: <SliderLogo width={90} />,
  },
  {
    href: "/reel",
    label: "Reel",
    sub: "Explainer videos",
    mark: <ReelLogo width={82} />,
  },
  {
    href: "/game-shows",
    label: "Game Show Generator",
    sub: "Review games",
    mark: <Gamepad2 size={30} strokeWidth={1.6} className="text-rose-500" />,
  },
  {
    href: "/simulations/lemonade-stand-economics",
    label: "Lemonade Stand",
    sub: "Market simulator",
    mark: <CitrusIcon size={30} strokeWidth={1.6} className="text-amber-500" />,
  },
  {
    href: "/simulations/stock-market-basics",
    label: "Stock Market",
    sub: "Portfolio game",
    mark: <TrendingUp size={30} strokeWidth={1.6} className="text-emerald-600" />,
  },
  {
    href: "/textbooks",
    label: "Digital Textbooks",
    sub: "Free to read",
    mark: <BookOpen size={30} strokeWidth={1.6} className="text-sky-600" />,
  },
  {
    href: "/curriculum/everyday-economics",
    label: "Everyday Economics",
    sub: "Full course",
    mark: <Coins size={30} strokeWidth={1.6} className="text-violet-600" />,
  },
];

function Tile({ app }: { app: MarqueeApp }) {
  return (
    <div className="shrink-0 px-3">
      <Link
        href={app.href}
        className="group flex h-36 w-52 flex-col items-center justify-center gap-2.5 rounded-2xl border border-navy-900/8 bg-white shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:-rotate-1 hover:scale-[1.04] hover:shadow-[0_18px_40px_rgba(13,27,46,0.12)]"
      >
        <span className="flex h-12 items-center justify-center">{app.mark}</span>
        <span className="text-sm font-semibold text-navy-900">{app.label}</span>
        <span className="-mt-1.5 text-[11px] text-navy-700/50">{app.sub}</span>
      </Link>
    </div>
  );
}

export default function AppMarquee() {
  return (
    <section className="overflow-hidden bg-cream-100 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              Always free
            </p>
            <div className="mx-auto mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400" />
            <h2 className="mt-6 font-display text-3xl font-medium text-navy-900 sm:text-4xl">
              See the cool things we build.
            </h2>
            <p className="mt-4 text-lg text-navy-700/70">
              Every app, free to use — no accounts, no paywalls.
            </p>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={0.1}>
        <div className="marquee-track relative mt-12">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-cream-100 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-cream-100 to-transparent" />

          <div className="animate-marquee flex w-max py-4">
            {[...apps, ...apps].map((app, i) => (
              <Tile key={`${app.label}-${i}`} app={app} />
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
