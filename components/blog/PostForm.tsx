"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import type { BlogPost } from "@/lib/blog";

interface PostFormProps {
  mode: "create" | "edit";
  initialPost?: BlogPost;
}

export default function PostForm({ mode, initialPost }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.cover_image_url ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [published, setPublished] = useState(initialPost?.published ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const body = JSON.stringify({ title, excerpt, content, coverImageUrl, published });
    const res =
      mode === "create"
        ? await fetch("/api/blog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetch(`/api/blog/${initialPost!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/educational-theory/${data.post.slug}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="text-sm font-medium text-navy-900">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Why retrieval practice beats re-reading"
          className="mt-1.5 w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-navy-900">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="A one or two sentence summary for the post list and search results (~160 characters)."
          className="mt-1.5 w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-navy-700/50">{excerpt.length} characters</p>
      </div>

      <div>
        <label className="text-sm font-medium text-navy-900">Cover image URL (optional)</label>
        <input
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1.5 w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-navy-900">Content (Markdown)</label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-700 transition-colors hover:text-teal-600"
          >
            <Eye size={13} />
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>
        <div className={showPreview ? "mt-1.5 grid grid-cols-1 gap-4 lg:grid-cols-2" : "mt-1.5"}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder={"## A heading\n\nWrite your post in Markdown — **bold**, *italics*, [links](https://example.com), lists, and more."}
            className="w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 font-mono text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
          />
          {showPreview && (
            <div className="rounded-lg border border-navy-900/12 bg-cream-50 px-4 py-3">
              <MarkdownContent content={content || "*Nothing to preview yet.*"} />
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-900">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-navy-900/25 text-teal-600 focus:ring-teal-500/50"
        />
        Published (visible on the public blog)
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !excerpt.trim() || !content.trim()}
        className="flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
      >
        <Save size={15} />
        {mode === "create" ? "Publish post" : "Save changes"}
      </button>
    </form>
  );
}
