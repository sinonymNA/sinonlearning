"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Check, Loader2, X } from "lucide-react";
import type { Beat } from "@/lib/reelTypes";

// Per-beat voice-over recorder. The teacher reads each beat's narration
// (teleprompter) and records it with the mic; each clip is POSTed to the audio
// route and its id stored back on the beat so the worker can mux it.
export default function Teleprompter({
  projectId,
  beats,
  onBeatAudio,
  onClose,
}: {
  projectId: string;
  beats: Beat[];
  onBeatAudio: (beatId: string, audioId: string) => void;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">
            Record narration — beat {index + 1} of {beats.length}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Teleprompter script */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Read aloud</p>
          <p className="mt-2 text-lg leading-relaxed text-slate-800">
            {beat.narration?.trim() || <span className="text-slate-400">No narration written for this beat.</span>}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">{error}</div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              <Mic size={15} /> {recorded ? "Re-record" : "Record"}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
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

        {/* Navigation */}
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
          {index < beats.length - 1 ? (
            <button
              onClick={() => setIndex((i) => Math.min(beats.length - 1, i + 1))}
              disabled={recording}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40"
            >
              Next <Play size={13} />
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={recording}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              Done <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
