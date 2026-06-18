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
      className={`rounded-3xl border border-navy-900/8 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(13,27,46,0.08)] hover:-translate-y-1 ${className}`}
    >
      {children}
    </div>
  );
}
