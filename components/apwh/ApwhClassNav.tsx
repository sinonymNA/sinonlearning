import Link from "next/link";
import { BookOpenText, LayoutDashboard, Presentation } from "lucide-react";

export default function ApwhClassNav({
  classId,
  active,
  preview = false,
}: {
  classId: string;
  active: "overview" | "margins";
  preview?: boolean;
}) {
  const previewSuffix = preview ? "?preview=student" : "";
  return (
    <nav className="apwh-context-nav" aria-label="AP World class workspace">
      <div>
        <Link className={active === "overview" ? "active" : ""} href={`/apwh/classes/${classId}${previewSuffix}`}>
          <LayoutDashboard size={15} /> Daily Dispatch
        </Link>
        <Link className={active === "margins" ? "active" : ""} href={`/apwh/classes/${classId}/margins${previewSuffix}`}>
          <BookOpenText size={15} /> Margins
        </Link>
      </div>
      <Link href="/tools/source-room/join"><Presentation size={15} /> Live tools</Link>
    </nav>
  );
}
