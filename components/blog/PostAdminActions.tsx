"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

export default function PostAdminActions({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/blog/${post.id}`, { method: "DELETE" });
    router.refresh();
  };

  const togglePublished = async () => {
    setBusy(true);
    await fetch(`/api/blog/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.cover_image_url,
        published: !post.published,
      }),
    });
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3 text-xs font-medium text-navy-700/60">
      <Link
        href={`/educational-theory/${post.slug}/edit`}
        className="flex items-center gap-1 transition-colors hover:text-navy-900"
      >
        <Pencil size={13} />
        Edit
      </Link>
      <button
        onClick={togglePublished}
        disabled={busy}
        className="flex items-center gap-1 transition-colors hover:text-navy-900 disabled:opacity-40"
      >
        {post.published ? <EyeOff size={13} /> : <Eye size={13} />}
        {post.published ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={remove}
        disabled={busy}
        className="flex items-center gap-1 text-rose-600/70 transition-colors hover:text-rose-600 disabled:opacity-40"
      >
        <Trash2 size={13} />
        Delete
      </button>
    </div>
  );
}
