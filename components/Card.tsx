import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-navy-900/8 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:border-navy-900/12 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)] hover:-translate-y-1 ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />
      {children}
    </div>
  );
}
