"use client";

export default function KoraExportButton({ taskType }: { taskType?: string }) {
  const href = `/api/kora-lab/export${taskType ? `?taskType=${encodeURIComponent(taskType)}` : ""}`;
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/12 bg-white px-4 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-navy-900/5"
    >
      Export JSONL{taskType ? ` — ${taskType}` : " — all tasks"}
    </a>
  );
}
