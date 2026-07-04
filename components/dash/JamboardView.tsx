"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { motion, useMotionValue, type PanInfo } from "framer-motion";
import { Patrick_Hand } from "next/font/google";
import { Image as ImageIcon, Link2, StickyNote, Type, X, Loader2, Sparkles } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const handwriting = Patrick_Hand({ subsets: ["latin"], weight: "400" });

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
  x: number;
  y: number;
  z: number;
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
  return (Math.abs(hash) % 9) - 4;
}

function clampCoord(n: number): number {
  return Math.min(85, Math.max(0, n));
}

export default function JamboardView({ code, isHost, hostToken, authorName }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<(BoardPost & { submittedAt: number })[]>([]);
  const [ownerTokens, setOwnerTokens] = useLocalStorageState<Record<string, string>>(
    `dash:jam:${code}:owners`,
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<BoardPostKind>("sticky");
  const [color, setColor] = useState<(typeof STICKY_COLORS)[number]>("yellow");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const draggingIdsRef = useRef<Set<string>>(new Set());
  const pendingPositionsRef = useRef<Record<string, { x: number; y: number; z: number; updatedAt: number }>>(
    {}
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, kind]);

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
        if (draggingIdsRef.current.size === 0) {
          setPosts((prev) =>
            (data.posts as BoardPost[]).map((serverPost) => {
              const pending = pendingPositionsRef.current[serverPost.id];
              if (pending && pending.updatedAt > pollStartedAt) {
                return { ...serverPost, x: pending.x, y: pending.y, z: pending.z };
              }
              return serverPost;
            })
          );
          for (const id of Object.keys(pendingPositionsRef.current)) {
            if (pendingPositionsRef.current[id].updatedAt <= pollStartedAt) {
              delete pendingPositionsRef.current[id];
            }
          }
        }
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

  async function persistPosition(postId: string, x: number, y: number, z: number) {
    pendingPositionsRef.current[postId] = { x, y, z, updatedAt: Date.now() };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, x, y, z } : p)));
    try {
      await fetch(`/api/dash/boards/${code}/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x,
          y,
          z,
          ownerToken: ownerTokens[postId],
          hostToken: isHost ? hostToken : undefined,
        }),
      });
    } catch {
      // next poll reconciles if this silently failed
    }
  }

  function currentMaxZ(): number {
    return Math.max(0, ...posts.map((p) => p.z));
  }

  function handleDragStart(postId: string) {
    draggingIdsRef.current.add(postId);
  }

  function handleDragEnd(postId: string, info: PanInfo) {
    draggingIdsRef.current.delete(postId);
    const rect = containerRef.current?.getBoundingClientRect();
    const post = posts.find((p) => p.id === postId);
    if (!rect || !post) return;
    const dxPct = (info.offset.x / rect.width) * 100;
    const dyPct = (info.offset.y / rect.height) * 100;
    persistPosition(postId, clampCoord(post.x + dxPct), clampCoord(post.y + dyPct), currentMaxZ() + 1);
  }

  function handleTap(postId: string, canDrag: boolean) {
    if (!canDrag) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    persistPosition(postId, post.x, post.y, currentMaxZ() + 1);
  }

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
      setOwnerTokens((prev) => ({ ...prev, [data.post.id]: data.ownerToken }));
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

  const composerIsNote = kind === "sticky" || kind === "text";

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

        {composerIsNote && (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={kind === "sticky" ? "Write a sticky note…" : "Write something…"}
            className={`bg-grain w-full resize-none overflow-hidden rounded-lg border-none px-3 py-2.5 text-lg leading-snug text-navy-900 outline-none placeholder:text-navy-700/35 ${handwriting.className} ${
              kind === "sticky" ? STICKY_BG[color] : "bg-cream-100"
            }`}
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
        <div ref={containerRef} className="relative min-h-[1600px] flex-1 overflow-y-auto overflow-x-hidden">
          {displayed.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-navy-700/40">
              No posts yet — be the first!
            </div>
          ) : (
            displayed.map((post) => {
              const canDrag = isHost || !!ownerTokens[post.id];
              return (
                <DraggableCard
                  key={post.id}
                  post={post}
                  isHost={isHost}
                  canDrag={canDrag}
                  containerRef={containerRef}
                  revealed={seenIdsRef.current.has(post.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onTap={handleTap}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  post,
  isHost,
  canDrag,
  containerRef,
  revealed,
  onDragStart,
  onDragEnd,
  onTap,
  onDelete,
}: {
  post: BoardPost;
  isHost: boolean;
  canDrag: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  revealed: boolean;
  onDragStart: (postId: string) => void;
  onDragEnd: (postId: string, info: PanInfo) => void;
  onTap: (postId: string, canDrag: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <div
      data-post-id={post.id}
      className="absolute"
      style={{
        left: `${post.x}%`,
        top: `${post.y}%`,
        zIndex: post.z,
        opacity: revealed ? undefined : 0,
      }}
    >
      <motion.div
        drag={canDrag}
        dragMomentum={false}
        dragElastic={0.05}
        dragConstraints={containerRef}
        style={{ x, y }}
        whileDrag={{ scale: 1.06, boxShadow: "0 22px 40px -10px rgba(13,27,46,0.35)" }}
        onDragStart={() => onDragStart(post.id)}
        onDragEnd={(_e, info) => {
          onDragEnd(post.id, info);
          x.set(0);
          y.set(0);
        }}
        onTap={canDrag ? undefined : () => onTap(post.id, canDrag)}
        className={canDrag ? "cursor-grab active:cursor-grabbing" : ""}
      >
        <Card post={post} isHost={isHost} onDelete={onDelete} />
      </motion.div>
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
          className={`bg-grain relative w-56 rounded-sm p-4 shadow-[0_10px_20px_-6px_rgba(13,27,46,0.25)] ${STICKY_BG[post.content.color ?? "yellow"]}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-5 w-5"
            style={{
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              background: "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.2))",
            }}
          />
          <p className={`whitespace-pre-wrap text-lg leading-snug text-navy-900/90 ${handwriting.className}`}>
            {post.content.text}
          </p>
          <p className="mt-2 text-[11px] font-medium text-navy-900/50">{post.authorName}</p>
        </div>
      );
    }
    if (post.kind === "image" && post.content.imageUrl) {
      return (
        <div className="w-64 overflow-hidden rounded-xl border border-navy-900/10 bg-white shadow-[0_10px_20px_-6px_rgba(13,27,46,0.2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.content.imageUrl} alt="" className="w-full object-cover" draggable={false} />
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
          className="block w-60 rounded-xl border border-navy-900/10 bg-white p-3.5 shadow-[0_10px_20px_-6px_rgba(13,27,46,0.2)] transition-colors hover:border-green-500/40"
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
      <div
        className={`bg-grain relative w-56 rounded-sm bg-cream-100 p-4 shadow-[0_10px_20px_-6px_rgba(13,27,46,0.25)]`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-5 w-5"
          style={{
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            background: "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.2))",
          }}
        />
        <p className={`whitespace-pre-wrap text-lg leading-snug text-navy-800/90 ${handwriting.className}`}>
          {post.content.text}
        </p>
        <p className="mt-2 text-[11px] font-medium text-navy-700/50">{post.authorName}</p>
      </div>
    );
  };

  return (
    <div className="group relative">
      {inner()}
      {isHost && (
        <button
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={() => onDelete(post.id)}
          aria-label="Remove post"
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/70 text-white opacity-0 transition-opacity hover:bg-navy-900 group-hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
