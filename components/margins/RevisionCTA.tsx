import Link from "next/link";
import { PenLine } from "lucide-react";

interface Props {
  submissionId: string;
  remaining: number;
}

export default function RevisionCTA({ submissionId, remaining }: Props) {
  if (remaining <= 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
        <p className="text-sm text-stone-400">
          You&rsquo;ve used all your revisions for this assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-6 text-center flex flex-col items-center gap-3">
      <PenLine size={20} className="text-violet-400" />
      <p className="text-sm text-stone-600">
        Ready to make it even stronger? KORA will walk you through your growth areas one at a time.
      </p>
      <Link
        href={`/margins/student/submissions/${submissionId}/revise`}
        className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all"
      >
        Revise this essay
      </Link>
      <p className="text-[12px] text-stone-400">
        {remaining} revision{remaining === 1 ? "" : "s"} left
      </p>
    </div>
  );
}
