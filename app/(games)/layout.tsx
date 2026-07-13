import Link from "next/link";

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/game-shows" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <ellipse cx="22" cy="30" rx="13" ry="6" fill="#1a1a2e" />
              <path d="M9 30 C9 19 35 19 35 30" fill="#e42828" />
              <circle cx="22" cy="22" r="5" fill="#ff6b6b" />
              <line x1="22" y1="6" x2="22" y2="11" stroke="#e42828" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="10" y1="10" x2="14" y2="14" stroke="#e42828" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="34" y1="10" x2="30" y2="14" stroke="#e42828" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="5" y1="22" x2="10" y2="22" stroke="#e42828" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="39" y1="22" x2="34" y2="22" stroke="#e42828" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display font-black leading-none">
              <span className="text-[#0d1e4a]">GAME</span>{" "}
              <span className="text-[#1a52f5]">SHOWS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-700"
          >
            ← Sinon Learning
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
