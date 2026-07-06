"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Film,
  Mic,
  Loader2,
  Search,
  Upload,
  ImageIcon,
  Sparkles,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import ReelLogo from "@/components/ReelLogo";
import BeatPreview from "./BeatPreview";
import Teleprompter from "./Teleprompter";
import { REEL_TEMPLATES, createBeat, getTemplate } from "@/lib/reelTemplates";
import type { Beat, ReelTemplateId } from "@/lib/reelTypes";
import type { ReelProjectRow } from "@/lib/reelDb";
import type { ImageResult } from "@/lib/imageSearch";

type JobPhase = "idle" | "working" | "done" | "failed";

export default function ReelEditor({ project }: { project: ReelProjectRow }) {
  const [title, setTitle] = useState(project.title);
  const [beats, setBeats] = useState<Beat[]>(project.beats.length ? project.beats : [createBeat("titleCard")]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [preview, setPreview] = useState<JobPhase>("idle");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [finalPhase, setFinalPhase] = useState<JobPhase>("idle");
  const [finalNonce, setFinalNonce] = useState(0);
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);

  const [previewElapsed, setPreviewElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [showProduceWarn, setShowProduceWarn] = useState(false);

  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIndex = useRef<number | null>(null);

  const selected = beats[Math.min(selectedIndex, beats.length - 1)];
  const selectedTemplate = getTemplate(selected.templateId);
  const missingImages = beats
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => getTemplate(b.templateId).usesImage && !b.imageId);

  // ── Autosave (debounced PATCH, mirrors SlideEditor) ──
  async function save(next: { title: string; beats: Beat[] }) {
    setSaveState("saving");
    try {
      await fetch(`/api/reel/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save({ title, beats }), 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, beats]);

  // ── Beat mutations ──
  function updateBeat(patch: Partial<Beat>) {
    setBeats((bs) => bs.map((b, i) => (i === selectedIndex ? { ...b, ...patch } : b)));
  }
  function setParam(key: string, value: string | string[]) {
    setBeats((bs) =>
      bs.map((b, i) => (i === selectedIndex ? { ...b, params: { ...b.params, [key]: value } } : b))
    );
  }
  function setBeatAudio(beatId: string, audioId: string) {
    setBeats((bs) => bs.map((b) => (b.id === beatId ? { ...b, audioId } : b)));
  }
  function addBeat(templateId: ReelTemplateId) {
    setBeats((bs) => {
      const next = [...bs, createBeat(templateId)];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }
  function removeBeat(i: number) {
    setBeats((bs) => (bs.length <= 1 ? bs : bs.filter((_, idx) => idx !== i)));
    setSelectedIndex((idx) => Math.max(0, Math.min(idx, beats.length - 2)));
  }
  function moveBeat(from: number, to: number) {
    if (from === to) return;
    setBeats((bs) => {
      const next = [...bs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setSelectedIndex(to);
  }
  function changeTemplate(templateId: ReelTemplateId) {
    // Preserve narration + seconds; reset params to the new template's shape.
    const fresh = createBeat(templateId);
    updateBeat({
      templateId,
      params: fresh.params,
      imageId: fresh.imageId,
      imageQuery: undefined,
    });
  }

  // ── Render polling ──
  async function pollJob(kind: "render" | "mux"): Promise<boolean> {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`/api/reel/projects/${project.id}/render?kind=${kind}`);
      const data = await res.json();
      if (data.status === "done") return true;
      if (data.status === "failed") return false;
    }
    return false;
  }

  // Tick an elapsed-seconds counter while a job runs so a slow worker shows
  // progress instead of an inert spinner.
  useEffect(() => {
    if (preview !== "working") return;
    setPreviewElapsed(0);
    const t = setInterval(() => setPreviewElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [preview]);
  useEffect(() => {
    if (finalPhase !== "working") return;
    setFinalElapsed(0);
    const t = setInterval(() => setFinalElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finalPhase]);

  async function renderPreview() {
    setPreview("working");
    await fetch(`/api/reel/projects/${project.id}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "render" }),
    });
    const ok = await pollJob("render");
    if (ok) {
      setPreview("done");
      setPreviewNonce((n) => n + 1);
    } else {
      setPreview("failed");
    }
  }

  // Beats that would produce a silent/blank stretch in the final video.
  const produceIssues = beats
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => !b.audioId || (getTemplate(b.templateId).usesImage && !b.imageId));

  function onProduceClick() {
    if (produceIssues.length > 0 && !showProduceWarn) {
      setShowProduceWarn(true);
      return;
    }
    setShowProduceWarn(false);
    void produceFinal();
  }

  async function produceFinal() {
    setFinalPhase("working");
    await fetch(`/api/reel/projects/${project.id}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "mux" }),
    });
    const ok = await pollJob("mux");
    if (ok) {
      setFinalPhase("done");
      setFinalNonce((n) => n + 1);
    } else {
      setFinalPhase("failed");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[14px] outline-none focus:border-sky-400 focus:bg-white";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative flex h-16 items-center justify-between gap-2 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Link href="/reel" className="shrink-0">
            <ReelLogo width={92} />
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-md px-2 py-1 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus:bg-slate-50 sm:flex-none"
          />
          <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/reel" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700">
            <ArrowLeft size={13} /> <span className="hidden sm:inline">All videos</span>
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-sky-400 via-sky-600 to-sky-400" />
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[220px_1fr_320px]">
        {/* Filmstrip */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Beats</p>
          {beats.map((b, i) => (
            <div
              key={b.id}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null) moveBeat(dragIndex.current, i);
                dragIndex.current = null;
              }}
              onClick={() => setSelectedIndex(i)}
              className={`group flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "border-sky-300 bg-sky-50 text-sky-800"
                  : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
              }`}
            >
              <GripVertical
                size={13}
                className="shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400"
              />
              <span className="text-[11px] font-bold text-slate-400">{i + 1}</span>
              <span className="flex-1 truncate">{getTemplate(b.templateId).label}</span>
              {b.audioId && <Mic size={12} className="text-emerald-500" />}
            </div>
          ))}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {REEL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => addBeat(t.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 hover:border-sky-300 hover:text-sky-700"
              >
                <Plus size={11} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: preview + render */}
        <div className="flex flex-col gap-4">
          {missingImages.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-800">
                <ImageIcon size={14} /> {missingImages.length} beat{missingImages.length === 1 ? "" : "s"} still
                need an image
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {missingImages.map(({ b, i }) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedIndex(i)}
                    className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[12px] text-amber-800 hover:border-amber-300"
                  >
                    Beat {i + 1}
                    {b.imageQuery ? ` · ${b.imageQuery}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <BeatPreview beat={selected} />

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={renderPreview}
              disabled={preview === "working"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
            >
              {preview === "working" ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
              {preview === "working" ? "Rendering…" : "Render preview"}
            </button>
            <button
              onClick={() => setTeleprompterOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              <Mic size={15} /> Record voice-over
            </button>
            <button
              onClick={onProduceClick}
              disabled={finalPhase === "working"}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition-all hover:shadow-md disabled:opacity-60"
            >
              {finalPhase === "working" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {finalPhase === "working" ? "Producing…" : "Produce final video"}
            </button>
          </div>

          {(preview === "working" || finalPhase === "working") && (
            <p className="text-[13px] text-slate-500">
              {finalPhase === "working"
                ? `Producing your final video — ${finalElapsed}s elapsed.`
                : `Rendering preview — ${previewElapsed}s elapsed.`}{" "}
              {(finalPhase === "working" ? finalElapsed : previewElapsed) > 30
                ? "The render worker may be waking up; this can take a minute."
                : "Beats render on the worker; hang tight."}
            </p>
          )}

          {showProduceWarn && finalPhase !== "working" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-800">
                <AlertTriangle size={14} /> {produceIssues.length} beat
                {produceIssues.length === 1 ? "" : "s"} may be silent or blank
              </p>
              <ul className="mt-1.5 space-y-0.5 text-[12px] text-amber-700">
                {produceIssues.slice(0, 6).map(({ b, i }) => (
                  <li key={b.id}>
                    Beat {i + 1}: {!b.audioId ? "no narration recorded" : "missing image"}
                  </li>
                ))}
                {produceIssues.length > 6 && <li>…and {produceIssues.length - 6} more</li>}
              </ul>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowProduceWarn(false);
                    void produceFinal();
                  }}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-amber-700"
                >
                  Produce anyway
                </button>
                <button
                  onClick={() => setShowProduceWarn(false)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-amber-700 hover:bg-amber-100"
                >
                  Keep editing
                </button>
              </div>
            </div>
          )}

          {preview === "failed" && (
            <p className="text-sm text-red-600">
              Preview render failed — check that the worker service is running, then try again.
            </p>
          )}
          {preview === "done" && (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Silent preview</p>
              <video
                key={`preview-${previewNonce}`}
                controls
                className="w-full rounded-xl border border-slate-200"
                src={`/api/reel/projects/${project.id}/video?kind=render&t=${previewNonce}`}
              />
            </div>
          )}
          {finalPhase === "failed" && (
            <p className="text-sm text-red-600">
              Final render failed — check that the worker service is running, then try again.
            </p>
          )}
          {finalPhase === "done" && (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-emerald-500">Final video</p>
              <video
                key={`final-${finalNonce}`}
                controls
                className="w-full rounded-xl border border-emerald-200"
                src={`/api/reel/projects/${project.id}/video?kind=mux&t=${finalNonce}`}
              />
              <a
                href={`/api/reel/projects/${project.id}/video?kind=mux&t=${finalNonce}`}
                download
                className="mt-2 inline-block text-sm font-semibold text-sky-700 hover:text-sky-800"
              >
                Download MP4 ↓
              </a>
            </div>
          )}
        </div>

        {/* Beat panel */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Template</span>
              <select
                value={selected.templateId}
                onChange={(e) => changeTemplate(e.target.value as ReelTemplateId)}
                className={inputCls}
              >
                {REEL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {beats.length > 1 && (
              <button
                onClick={() => removeBeat(selectedIndex)}
                aria-label="Delete beat"
                className="mt-5 text-slate-300 transition-colors hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Params */}
          {selectedTemplate.params.map((p) => (
            <label key={p.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{p.label}</span>
              {p.kind === "list" ? (
                <ListEditor
                  values={Array.isArray(selected.params[p.key]) ? (selected.params[p.key] as string[]) : [""]}
                  onChange={(v) => setParam(p.key, v)}
                  placeholder={p.placeholder}
                />
              ) : (
                <input
                  value={typeof selected.params[p.key] === "string" ? (selected.params[p.key] as string) : ""}
                  onChange={(e) => setParam(p.key, e.target.value)}
                  placeholder={p.placeholder}
                  className={inputCls}
                />
              )}
            </label>
          ))}

          {selectedTemplate.usesImage && (
            <ImagePicker key={selected.id} beat={selected} onPick={(imageId) => updateBeat({ imageId })} />
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Narration (read aloud)</span>
            <textarea
              rows={3}
              value={selected.narration}
              onChange={(e) => updateBeat({ narration: e.target.value })}
              placeholder="What the teacher says over this beat"
              className={`${inputCls} resize-none`}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              On-screen seconds: {selected.animationSeconds}
            </span>
            <input
              type="range"
              min={2}
              max={20}
              value={selected.animationSeconds}
              onChange={(e) => updateBeat({ animationSeconds: Number(e.target.value) })}
              className="accent-sky-600"
            />
          </label>
        </div>
      </main>

      {teleprompterOpen && (
        <Teleprompter
          projectId={project.id}
          beats={beats}
          previewReady={preview === "done"}
          previewUrl={preview === "done" ? `/api/reel/projects/${project.id}/video?kind=render&t=${previewNonce}` : null}
          previewWorking={preview === "working"}
          onRequestPreview={renderPreview}
          onBeatAudio={setBeatAudio}
          onClose={() => setTeleprompterOpen(false)}
        />
      )}
    </div>
  );
}

function ListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const list = values.length ? values : [""];
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={v}
            onChange={(e) => onChange(list.map((x, idx) => (idx === i ? e.target.value : x)))}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[14px] outline-none focus:border-sky-400 focus:bg-white"
          />
          {list.length > 1 && (
            <button
              onClick={() => onChange(list.filter((_, idx) => idx !== i))}
              aria-label="Remove item"
              className="text-slate-300 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {list.length < 5 && (
        <button
          onClick={() => onChange([...list, ""])}
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-sky-600 hover:text-sky-700"
        >
          <Plus size={12} /> Add
        </button>
      )}
    </div>
  );
}

function ImagePicker({ beat, onPick }: { beat: Beat; onPick: (imageId: string) => void }) {
  const [query, setQuery] = useState(beat.imageQuery ?? "");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runSearch() {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reel/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        return;
      }
      setResults(data.results ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function addByUrl(url: string) {
    setAdding(url);
    setError(null);
    try {
      const res = await fetch("/api/reel/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add that image.");
        return;
      }
      onPick(data.imageId);
      setResults([]);
    } finally {
      setAdding(null);
    }
  }

  async function uploadFile(file: File) {
    setAdding("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/reel/images", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onPick(data.imageId);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <ImageIcon size={12} /> Image
      </span>

      {beat.imageId && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/reel/images/${beat.imageId}`}
            alt=""
            className="max-h-32 w-full rounded-md object-contain"
          />
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder={beat.imageQuery || "Search for an image…"}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-sky-400"
        />
        <button
          onClick={runSearch}
          disabled={busy}
          aria-label="Search images"
          className="rounded-lg bg-sky-600 p-2 text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Upload image"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-sky-300 hover:text-sky-700"
        >
          <Upload size={14} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
          }}
        />
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {results.map((r) => (
            <button
              key={r.url}
              onClick={() => addByUrl(r.url)}
              disabled={!!adding}
              className="group relative overflow-hidden rounded-md border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.thumbnailUrl} alt={r.title} className="aspect-video w-full object-cover" />
              {adding === r.url && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={14} className="animate-spin text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
