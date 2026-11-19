import Link from "next/link";
import type { ReactNode } from "react";

/** Link to the Arcade with a rainbow outline that snakes around it (see .rainbow-snake in globals.css). */
export default function ArcadeButton({ children = "Arcade" }: { children?: ReactNode }) {
  return (
    <Link href="/arcade" className="rainbow-snake focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50">
      <span>{children}</span>
    </Link>
  );
}
