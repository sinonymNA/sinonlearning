"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MarkdownContent from "@/components/blog/MarkdownContent";
import type { TextbookPage } from "@/lib/textbooks";

type Direction = "next" | "prev" | null;

function PageFace({ content, pageNumber, total }: { content: string; pageNumber?: number; total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-navy-900/10 bg-cream-50 shadow-[0_8px_30px_rgba(13,27,46,0.12)]">
      <div className="flex-1 overflow-y-auto p-8 sm:p-10">
        <MarkdownContent content={content || "*This page is blank.*"} />
      </div>
      {pageNumber !== undefined && (
        <div className="border-t border-navy-900/8 px-6 py-2 text-center text-xs text-navy-700/40">
          Page {pageNumber} of {total}
        </div>
      )}
    </div>
  );
}

export default function TextbookFlipBook({ pages }: { pages: TextbookPage[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(null);

  const total = pages.length;
  const current = pages[index];
  const next = pages[index + 1];
  const prev = pages[index - 1];

  if (total === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-navy-900/15 text-sm text-navy-700/50 sm:aspect-[4/3]">
        This textbook doesn&rsquo;t have any pages yet.
      </div>
    );
  }

  const goNext = () => {
    if (direction || index >= total - 1) return;
    setDirection("next");
  };

  const goPrev = () => {
    if (direction || index <= 0) return;
    setDirection("prev");
  };

  const onFlipComplete = () => {
    setIndex((i) => (direction === "next" ? i + 1 : direction === "prev" ? i - 1 : i));
    setDirection(null);
  };

  const settledPage = direction === "next" ? next : direction === "prev" ? prev : current;
  const flipBackPage = direction === "next" ? next : prev;

  return (
    <div>
      <div
        className="relative aspect-[4/3] w-full sm:aspect-[3/2]"
        style={{ perspective: "2200px" }}
      >
        {settledPage && (
          <PageFace content={settledPage.content} pageNumber={settledPage.page_number} total={total} />
        )}

        {direction && (
          <motion.div
            key={`${direction}-${index}`}
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: direction === "next" ? "left center" : "right center",
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: direction === "next" ? -180 : 180 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            onAnimationComplete={onFlipComplete}
          >
            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
              <PageFace content={current.content} pageNumber={current.page_number} total={total} />
            </div>
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <PageFace
                content={flipBackPage?.content ?? ""}
                pageNumber={flipBackPage?.page_number}
                total={total}
              />
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={!!direction || index <= 0}
          className="flex items-center gap-1.5 rounded-full border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:border-teal-500/40 disabled:opacity-30"
        >
          <ChevronLeft size={15} />
          Previous
        </button>
        <span className="text-xs font-medium text-navy-700/50">
          Page {current.page_number} of {total}
        </span>
        <button
          onClick={goNext}
          disabled={!!direction || index >= total - 1}
          className="flex items-center gap-1.5 rounded-full border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:border-teal-500/40 disabled:opacity-30"
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
