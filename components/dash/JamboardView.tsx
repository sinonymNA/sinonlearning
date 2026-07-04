"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Image as ImageIcon, Link2, StickyNote, Type, X, Loader2, Sparkles } from "lucide-react";

type BoardPostKind = "sticky" | "text" | "image" | "link";

interface BoardPostContent {
  text?: string;
  color?: string;
  imageUrl?: string;
  linkUrl?: string;
}

interface BoardPost {
  id: string;
  kind: BoardPostKind;
  content: BoardPostContent;
  authorName: string;
  createdAt: string;
}

interface BoardSummary {
  themes: { title: string; summary: string }[];
  overall_takeaway: string;
}

interface Props {
  code: string;
  isHost: boolean;
  hostToken?: string;
  authorName: string;
}

const STICKY_COLORS = ["yellow", "pink", "blue", "green", "orange"] as const;

const STICKY_BG: Record<string, string> = {
  yellow: "bg-amber-200",
  pink: "bg-pink-200",
  blue: "bg-sky-200",
  green: "bg-emerald-200",
  orange: "bg-orange-200",
};

const KIND_OPTIONS: { kind: BoardPostKind; label: string; icon: typeof StickyNote }[] = [
  { kind: "sticky", label: "Sticky", icon: StickyNote },
  { kind: "text", label: "Text", icon: Type },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "link", label: "Link", icon: Link2 },
];

function rotationForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 5) - 2;
}

export default function JamboardView({ code, isHost, hostToken, authorName }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<(BoardPost & { submittedAt: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<BoardPostKind>("sticky");
  const [color, setColor] = useState<(typeof STICKY_COLORS)[number]>("yellow");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function poll() {
      const pollStartedAt = Date.now();
      try {
        const res = await fetch(`/api/dash/boards/${code}`, { cache: "no-store" });
        if (!res.ok) {
          if (active) setError("Board not found.");
          return;
        }
        const data = await res.json();
        if (!active) return;
        setError(null);
        setPosts(data.posts);
        setPendingPosts((prev) => prev.filter((p) => p.submittedAt > pollStartedAt));
        setLoading(false);
      } catch {
        // transient network hiccup — keep showing the last known state
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [code]);

  const seenIdSet = new Set(posts.map((p) => p.id));
  const displayed = [...posts, ...pendingPosts.filter((p) => !seenIdSet.has(p.id))];
  const displayedIdsKey = displayed.map((p) => p.id).join(",");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const currentIds = displayed.map((p) => p.id);
    const freshIds = currentIds.filter((id) => !seenIdsRef.current.has(id));
    if (freshIds.length > 0) {
      requestAnimationFrame(() => {
        const els = freshIds
          .map((id) => container.querySelector<HTMLElement>(`[data-post-id="${CSS.escape(id)}"]`))
          .filter((el): el is HTMLElement => !!el);
        if (els.length === 0) return;
        animate(els, {
          opacity: [0, 1],
          scale: [0.9, 1],
          translateY: [12, 0],
          duration: 380,
          delay: stagger(60),
          easing: "outQuart",
          onComplete: () => {
            els.forEach((el) => {
              el.style.opacity = "";
              el.style.transform = "";
            });
          },
        });
      });
    }
    currentIds.forEach((id) => seenIdsRef.current.add(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedIdsKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setComposerError(null);

    const content: BoardPostContent = {};
    if (kind === "sticky" || kind === "text") {
      if (!text.trim()) {
        setComposerError("Write something first.");
        return;
      }
      content.text = text.trim();
      if (kind === "sticky") content.color = color;
    } else if (kind === "image") {
      if (!url.trim()) {
        setComposerError("Paste an image URL first.");
        return;
      }
      content.imageUrl = url.trim();
    } else if (kind === "link") {
      if (!url.trim()) {
        setComposerError("Paste a link first.");
        return;
      }
      content.linkUrl = url.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/dash/boards/${code}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, content, authorName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComposerError(data.error ?? "Could not post.");
        return;
      }
      setPendingPosts((prev) => [...prev, { ...data.post, submittedAt: Date.now() }]);
      setText("");
      setUrl("");
    } catch {
      setComposerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/dash/boards/${code}/summarize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error ?? "Could not summarize the board.");
        return;
      }
      setSummary(data.summary);
    } catch {
      setSummaryError("Network error. Please try again.");
    } finally {
      setSummarizing(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!hostToken) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await fetch(`/api/dash/boards/${code}/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken }),
      });
    } catch {
      // if this silently failed, the next poll will bring the post back
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2.5 rounded-2xl border border-navy-900/10 bg-white/95 p-3.5 backdrop-blur-xl"
      >
        <div className="flex items-center gap-1.5">
          {KIND_OPTIONS.map(({ kind: k, label, icon: Icon }) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                kind === k
                  ? "bg-green-500/15 text-green-700"
                  : "text-navy-700/60 hover:bg-navy-900/5 hover:text-navy-900"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {(kind === "sticky" || kind === "text") && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={kind === "sticky" ? "Write a sticky note…" : "Write something…"}
            className="w-full resize-none rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-2 text-sm text-navy-900 focus:border-green-500/50 focus:outline-none"
          />
        )}
        {(kind === "image" || kind === "link") && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={kind === "image" ? "Paste an image URL…" : "Paste a link…"}
            className="w-full rounded-lg border border-navy-900/12 bg-cream-50 px-2.5 py-2 text-sm text-navy-900 focus:border-green-500/50 focus:outline-none"
          />
        )}

        {kind === "sticky" && (
          <div className="flex items-center gap-1.5">
            {STICKY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full ${STICKY_BG[c]} transition-transform ${
                  color === c ? "scale-110 ring-2 ring-navy-900/30 ring-offset-1" : "hover:scale-105"
                }`}
              />
            ))}
          </div>
        )}

        {composerError && <p className="text-[12px] text-red-600">{composerError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-lg bg-green-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>

      {isHost && (
        <div className="rounded-2xl border border-green-500/15 bg-green-50/50 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-green-700">
              <Sparkles size={14} className={summarizing ? "animate-pulse" : ""} />
              <span className="text-xs font-semibold">Summarize with KORA</span>
            </div>
            <button
              onClick={handleSummarize}
              disabled={summarizing || displayed.length === 0}
              className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {summarizing ? "Thinking…" : summary ? "Refresh summary" : "Summarize board"}
            </button>
          </div>
          {summaryError && <p className="mt-2 text-[12px] text-red-600">{summaryError}</p>}
          {summary && (
            <div className="mt-3 flex flex-col gap-2">
              {summary.themes.map((theme, i) => (
                <div key={i} className="rounded-xl bg-white/70 p-2.5">
                  <p className="text-[13px] font-semibold text-navy-900">{theme.title}</p>
                  <p className="mt-0.5 text-[12px] text-navy-700/70">{theme.summary}</p>
                </div>
              ))}
              <p className="mt-1 text-[13px] font-medium italic text-green-800">{summary.overall_takeaway}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center text-sm text-navy-700/60">{error}</div>
      )}

      {!error && loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-navy-400" />
        </div>
      )}

      {!error && !loading && (
        <div ref={containerRef} className="flex-1 overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-navy-700/40">
              No posts yet — be the first!
            </div>
          ) : (
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
              {displayed.map((post) => (
                <div
                  key={post.id}
                  data-post-id={post.id}
                  className="mb-3 break-inside-avoid"
                  style={seenIdsRef.current.has(post.id) ? undefined : { opacity: 0 }}
                >
                  <Card post={post} isHost={isHost} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({
  post,
  isHost,
  onDelete,
}: {
  post: BoardPost;
  isHost: boolean;
  onDelete: (id: string) => void;
}) {
  const rotation = rotationForId(post.id);

  const inner = () => {
    if (post.kind === "sticky") {
      return (
        <div
          className={`relative rounded-xl p-3.5 shadow-sm ${STICKY_BG[post.content.color ?? "yellow"]}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <p className="whitespace-pre-wrap text-[13px] text-navy-900/90">{post.content.text}</p>
          <p className="mt-2 text-[11px] font-medium text-navy-900/50">{post.authorName}</p>
        </div>
      );
    }
    if (post.kind === "image" && post.content.imageUrl) {
      return (
        <div className="overflow-hidden rounded-xl border border-navy-900/10 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.content.imageUrl} alt="" className="w-full object-cover" />
          <p className="px-3 py-2 text-[11px] font-medium text-navy-700/50">{post.authorName}</p>
        </div>
      );
    }
    if (post.kind === "link" && post.content.linkUrl) {
      return (
        <a
          href={post.content.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-navy-900/10 bg-white p-3.5 shadow-sm transition-colors hover:border-green-500/40"
        >
          <div className="flex items-center gap-1.5 text-green-700">
            <Link2 size={13} />
            <span className="truncate text-[13px] font-medium">{post.content.linkUrl}</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-navy-700/50">{post.authorName}</p>
        </a>
      );
    }
    return (
      <div className="rounded-xl border border-navy-900/10 bg-white p-3.5 shadow-sm">
        <p className="whitespace-pre-wrap text-[13px] text-navy-800/90">{post.content.text}</p>
        <p className="mt-2 text-[11px] font-medium text-navy-700/50">{post.authorName}</p>
      </div>
    );
  };

  return (
    <div className="group relative">
      {inner()}
      {isHost && (
        <button
          onClick={() => onDelete(post.id)}
          aria-label="Remove post"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/70 text-white opacity-0 transition-opacity hover:bg-navy-900 group-hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
