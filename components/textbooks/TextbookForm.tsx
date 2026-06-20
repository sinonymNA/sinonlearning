"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Textbook } from "@/lib/textbooks";

interface TextbookFormProps {
  mode: "create" | "edit";
  initialTextbook?: Textbook;
}

export default function TextbookForm({ mode, initialTextbook }: TextbookFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTextbook?.title ?? "");
  const [subject, setSubject] = useState(initialTextbook?.subject ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialTextbook?.cover_image_url ?? "");
  const [published, setPublished] = useState(initialTextbook?.published ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const body = JSON.stringify({ title, subject, coverImageUrl, published });
    const res =
      mode === "create"
        ? await fetch("/api/textbooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetch(`/api/textbooks/${initialTextbook!.slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/textbooks/${data.textbook.slug}/edit`);
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
          placeholder="Introduction to American History"
          className="mt-1.5 w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-navy-900">Subject (optional)</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="History"
          className="mt-1.5 w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
        />
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

      <label className="flex items-center gap-2 text-sm text-navy-900">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-navy-900/25 text-teal-600 focus:ring-teal-500/50"
        />
        Published (visible on the public textbooks page)
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
      >
        <Save size={15} />
        {mode === "create" ? "Create textbook" : "Save changes"}
      </button>
    </form>
  );
}
