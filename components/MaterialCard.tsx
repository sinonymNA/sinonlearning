import { FileText, Presentation, ExternalLink } from "lucide-react";
import type { Material } from "@/lib/material";

export default function MaterialCard({ material }: { material: Material }) {
  const Icon = material.kind === "slides" ? Presentation : FileText;
  const embedUrl =
    material.kind === "slides"
      ? `https://docs.google.com/presentation/d/${material.file_id}/embed`
      : `https://docs.google.com/document/d/${material.file_id}/preview`;

  return (
    <div className="group relative h-full overflow-hidden rounded-3xl border border-navy-900/8 bg-white shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition-all duration-300 hover:border-navy-900/12 hover:shadow-[0_16px_40px_rgba(13,27,46,0.1)]">
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-teal-500 via-rose-300 to-amber-400 transition-transform duration-300 group-hover:scale-x-100" />

      <div className="flex items-center justify-between gap-2 border-b border-navy-900/8 bg-cream-100/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={16} className="shrink-0 text-teal-700" />
          <span className="truncate text-sm font-medium text-navy-900">{material.title}</span>
        </div>
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-navy-700/50 transition-colors hover:text-navy-900"
          aria-label={`Open ${material.title} in a new tab`}
        >
          <ExternalLink size={15} />
        </a>
      </div>

      <div className="aspect-[4/3] w-full bg-cream-50">
        <iframe src={embedUrl} className="h-full w-full" loading="lazy" title={material.title} />
      </div>
    </div>
  );
}
