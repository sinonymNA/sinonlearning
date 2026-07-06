"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Check, Loader2, X, Film, Play, RotateCcw } from "lucide-react";
import type { Beat } from "@/lib/reelTypes";

type BeatStatus = "idle" | "recording" | "saving" | "saved" | "error";
type Phase = "idle" | "countdown" | "playing" | "single" | "done";

// True synced teleprompter. The teacher renders a silent preview, then presses
// play: the video plays while the current beat's script scrolls into focus and
// the mic records — automatically cutting a fresh clip at each beat boundary so
// the worker can mux narration onto the matching beat. Any single beat can be
// re-recorded against its own animation. When no preview exists yet we fall back
// to a plain per-beat recorder.
export default function Teleprompter({
  projectId,
  beats,
  previewReady,
  previewUrl,
  previewWorking,
  onRequestPreview,
  onBeatAudio,
  onClose,
}: {
  projectId: string;
  beats: Beat[];
  previewReady: boolean;
  previewUrl: string | null;
  previewWorking: boolean;
  onRequestPreview: () => void;
  onBeatAudio: (beatId: string, audioId: string) => void;
  onClose: () => void;
}) {
  const [manualMode, setManualMode] = useState(false);

  if (previewReady && previewUrl && !manualMode) {
    return (
      <SyncedTeleprompter
        projectId={projectId}
        beats={beats}
        previewUrl={previewUrl}
        onBeatAudio={onBeatAudio}
        onManual={() => setManualMode(true)}
        onClose={onClose}
      />
    );
  }

  return (
    <Shell onClose={onClose} title="Record narration">
      {manualMode ? (
        <ManualRecorder projectId={projectId} beats={beats} onBeatAudio={onBeatAudio} />
      ) : (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
            <Film size={26} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Render a silent preview first</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
              The synced teleprompter plays your video while you read — your script scrolls in time and
              the mic records each beat automatically.
            </p>
          </div>
          <button
            onClick={onRequestPreview}
            disabled={previewWorking}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {previewWorking ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
            {previewWorking ? "Rendering preview…" : "Render silent preview"}
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="text-[13px] font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            Record without the video preview
          </button>
        </div>
      )}
    </Shell>
  );
}

// ── Synced (video-driven) teleprompter ──

function SyncedTeleprompter({
  projectId,
  beats,
  previewUrl,
  onBeatAudio,
  onManual,
  onClose,
}: {
  projectId: string;
  beats: Beat[];
  previewUrl: string;
  onBeatAudio: (beatId: string, audioId: string) => void;
  onManual: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeBeat, setActiveBeat] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState<Record<string, BeatStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [videoDur, setVideoDur] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const activeBeatRef = useRef(-1); // beat whose recorder is currently open
  const singleTargetRef = useRef<number | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Planned timeline (seconds) scaled to the real video duration so the last
  // beat always ends exactly at video-end (no cumulative drift).
  const planned = beats.map((b) => Math.max(1, Number(b.animationSeconds) || 5));
  const cumStart: number[] = [];
  let acc = 0;
  for (const p of planned) {
    cumStart.push(acc);
    acc += p;
  }
  const totalPlanned = acc || 1;
  const scale = videoDur > 0 ? videoDur / totalPlanned : 1;
  const beatStart = useCallback(
    (i: number) => cumStart[i] * scale,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoDur]
  );
  const beatEnd = useCallback(
    (i: number) => (i + 1 < beats.length ? cumStart[i + 1] : totalPlanned) * scale,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoDur]
  );
  const beatAt = useCallback(
    (t: number) => {
      for (let i = beats.length - 1; i >= 0; i--) if (t >= beatStart(i) - 0.01) return i;
      return 0;
    },
    [beats.length, beatStart]
  );

  const setBeatStatus = (beatId: string, s: BeatStatus) =>
    setStatus((m) => ({ ...m, [beatId]: s }));

  // Scroll the active beat into the center of the script column.
  useEffect(() => {
    rowRefs.current[activeBeat]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeBeat]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function ensureStream(): Promise<boolean> {
    if (streamRef.current) return true;
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      setError("Couldn't access the microphone. Check browser permissions.");
      return false;
    }
  }

  function startRecorderFor(beatId: string) {
    const stream = streamRef.current;
    if (!stream) return;
    const chunks: Blob[] = []; // owned by this recorder — no shared-ref race
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => uploadBeat(beatId, new Blob(chunks, { type: "audio/webm" }));
    rec.start();
    recorderRef.current = rec;
    setBeatStatus(beatId, "recording");
  }

  function stopRecorder(discard = false) {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (!rec) return;
    if (discard) rec.onstop = null;
    rec.stop();
  }

  async function uploadBeat(beatId: string, blob: Blob) {
    if (blob.size === 0) return;
    setBeatStatus(beatId, "saving");
    try {
      const form = new FormData();
      form.append("beatId", beatId);
      form.append("file", blob, `${beatId}.webm`);
      const res = await fetch(`/api/reel/projects/${projectId}/audio`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setBeatStatus(beatId, "error");
        setError(data.error ?? "Could not save a recording.");
        return;
      }
      onBeatAudio(beatId, data.audioId);
      setBeatStatus(beatId, "saved");
    } catch {
      setBeatStatus(beatId, "error");
      setError("Network error saving a recording.");
    }
  }

  function runCountdown(after: () => void) {
    setError(null);
    setPhase("countdown");
    let n = 3;
    setCountdown(n);
    const tick = () => {
      n -= 1;
      if (n <= 0) {
        setCountdown(0);
        after();
      } else {
        setCountdown(n);
        window.setTimeout(tick, 700);
      }
    };
    window.setTimeout(tick, 700);
  }

  async function startPlaythrough() {
    if (!(await ensureStream())) return;
    runCountdown(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = 0;
      setActiveBeat(0);
      activeBeatRef.current = 0;
      singleTargetRef.current = null;
      startRecorderFor(beats[0].id);
      setPhase("playing");
      v.play();
    });
  }

  async function reRecordBeat(i: number) {
    if (phase === "playing" || phase === "single" || phase === "countdown") return;
    if (!(await ensureStream())) return;
    runCountdown(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = beatStart(i);
      setActiveBeat(i);
      activeBeatRef.current = i;
      singleTargetRef.current = i;
      startRecorderFor(beats[i].id);
      setPhase("single");
      v.play();
    });
  }

  function stopSession() {
    const v = videoRef.current;
    v?.pause();
    stopRecorder(); // keep whatever was captured for the current beat
    activeBeatRef.current = -1;
    singleTargetRef.current = null;
    setPhase("done");
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;

    if (phase === "single") {
      const target = singleTargetRef.current;
      if (target != null && t >= beatEnd(target) - 0.02) {
        v.pause();
        stopRecorder();
        singleTargetRef.current = null;
        activeBeatRef.current = -1;
        setPhase("done");
      }
      return;
    }

    if (phase !== "playing") return;
    const i = beatAt(t);
    if (i > activeBeatRef.current) {
      stopRecorder(); // flush + upload the beat that just ended
      startRecorderFor(beats[i].id);
      activeBeatRef.current = i;
      setActiveBeat(i);
    }
  }

  function onEnded() {
    if (phase !== "playing") return;
    stopRecorder(); // upload the final beat
    activeBeatRef.current = -1;
    setPhase("done");
  }

  const recording = phase === "playing" || phase === "single";
  const savedCount = beats.filter((b) => status[b.id] === "saved" || b.audioId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-bold text-slate-900">Synced teleprompter</h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              {savedCount}/{beats.length} recorded
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-2 text-[13px] text-red-600">{error}</div>
        )}

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1.4fr_1fr]">
          {/* Video */}
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-900 p-4 md:border-b-0 md:border-r">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src={previewUrl}
              className="w-full rounded-xl bg-black"
              onLoadedMetadata={(e) => setVideoDur(e.currentTarget.duration || 0)}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
              playsInline
            />
            <div className="flex items-center gap-2.5">
              {!recording && phase !== "countdown" ? (
                <button
                  onClick={startPlaythrough}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                >
                  <Mic size={15} /> {savedCount > 0 ? "Record again from top" : "Play & record"}
                </button>
              ) : phase === "countdown" ? (
                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white">
                  Starting in {countdown}…
                </span>
              ) : (
                <button
                  onClick={stopSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  <Square size={14} /> Stop
                </button>
              )}
              {recording && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Recording beat{" "}
                  {activeBeat + 1}
                </span>
              )}
            </div>
          </div>

          {/* Scrolling script */}
          <div className="flex flex-col overflow-hidden">
            <p className="border-b border-slate-100 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Read aloud
            </p>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {beats.map((b, i) => {
                const isActive = i === activeBeat && recording;
                const st = status[b.id] ?? (b.audioId ? "saved" : "idle");
                return (
                  <div
                    key={b.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isActive
                        ? "border-sky-300 bg-sky-50 shadow-sm"
                        : "border-transparent bg-slate-50/60"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Beat {i + 1}
                      </span>
                      <BeatStatusPill status={st} />
                    </div>
                    <p
                      className={`leading-relaxed transition-all ${
                        isActive ? "text-[17px] text-slate-900" : "text-[14px] text-slate-500"
                      }`}
                    >
                      {b.narration?.trim() || (
                        <span className="italic text-slate-300">No narration written for this beat.</span>
                      )}
                    </p>
                    {!recording && phase !== "countdown" && (
                      <button
                        onClick={() => reRecordBeat(i)}
                        className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-sky-600 hover:text-sky-700"
                      >
                        {st === "saved" ? <RotateCcw size={12} /> : <Play size={12} />}
                        {st === "saved" ? "Re-record this beat" : "Record this beat"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <button
            onClick={onManual}
            className="text-[12px] font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            Record without video
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Done <Check size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BeatStatusPill({ status }: { status: BeatStatus }) {
  if (status === "recording")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Rec
      </span>
    );
  if (status === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <Loader2 size={11} className="animate-spin" /> Saving
      </span>
    );
  if (status === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <Check size={12} /> Saved
      </span>
    );
  if (status === "error")
    return <span className="text-[11px] font-semibold text-red-500">Failed</span>;
  return null;
}

// ── Shell (used by gate + manual) ──

function Shell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Manual per-beat recorder (fallback, no video) ──

function ManualRecorder({
  projectId,
  beats,
  onBeatAudio,
}: {
  projectId: string;
  beats: Beat[];
  onBeatAudio: (beatId: string, audioId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const beat = beats[index];

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => handleStop();
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }

  async function handleStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    setLocalUrls((m) => ({ ...m, [beat.id]: url }));
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("beatId", beat.id);
      form.append("file", blob, `${beat.id}.webm`);
      const res = await fetch(`/api/reel/projects/${projectId}/audio`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save the recording.");
        return;
      }
      onBeatAudio(beat.id, data.audioId);
    } catch {
      setError("Network error saving the recording.");
    } finally {
      setUploading(false);
    }
  }

  const recorded = !!beat.audioId || !!localUrls[beat.id];

  return (
    <>
      <p className="text-[13px] text-slate-500">
        Beat {index + 1} of {beats.length}
      </p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Read aloud</p>
        <p className="mt-2 text-lg leading-relaxed text-slate-800">
          {beat.narration?.trim() || (
            <span className="text-slate-400">No narration written for this beat.</span>
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            <Mic size={15} /> {recorded ? "Re-record" : "Record"}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            <Square size={14} /> Stop
          </button>
        )}
        {uploading && (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Saving…
          </span>
        )}
        {recorded && !uploading && (
          <>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
              <Check size={15} /> Recorded
            </span>
            {localUrls[beat.id] && (
              <audio controls src={localUrls[beat.id]} className="h-8">
                <track kind="captions" />
              </audio>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || recording}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="flex items-center gap-1">
          {beats.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 w-1.5 rounded-full ${
                i === index ? "bg-sky-500" : b.audioId || localUrls[b.id] ? "bg-emerald-400" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(beats.length - 1, i + 1))}
          disabled={index >= beats.length - 1 || recording}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </>
  );
}
