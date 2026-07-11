"use client";

import dynamic from "next/dynamic";

const TakeAStarExperience = dynamic(() => import("./TakeAStarExperience"), {
  ssr: false,
  loading: () => <div className="flex min-h-screen items-center justify-center bg-[#071927] text-sm font-semibold tracking-[.2em] text-amber-100">CHARTING THE SKY…</div>,
});

export default function TakeAStarClient() {
  return <TakeAStarExperience />;
}

