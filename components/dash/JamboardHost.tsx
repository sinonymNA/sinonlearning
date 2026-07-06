"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import JamboardView from "./JamboardView";

export interface JamSession {
  code: string;
  boardId: string;
  hostToken: string;
  title: string;
}

interface Props {
  session: JamSession | null;
  onSessionCreated: (session: JamSession) => void;
  resumeBoardId?: string;
}

export default function JamboardHost({ session, onSessionCreated, resumeBoardId }: Props) {
  const creatingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  // Keyed by board id so a stale failure from a previously clicked board
  // never shows for the one currently being resumed.
  const [resumeError, setResumeError] = useState<{ boardId: string; message: string } | null>(null);

  // Resume a specific saved board. Deliberately separate from the create
  // effect: a failed resume (logged out, not the owner, deleted board) must
  // surface as an error, never silently fall back to a fresh empty board.
  useEffect(() => {
    if (!resumeBoardId) return;
    if (session?.boardId === resumeBoardId) return;
    let cancelled = false;
    fetch(`/api/dash/boards/mine/${resumeBoardId}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setResumeError({
            boardId: resumeBoardId,
            message:
              res.status === 401
                ? "You need to be logged in as this dash's owner to resume it."
                : "This dash could not be found — it may have been deleted.",
          });
          return;
        }
        onSessionCreated({
          code: data.code,
          boardId: data.boardId,
          hostToken: data.hostToken,
          title: data.title,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResumeError({ boardId: resumeBoardId, message: "Network error. Could not load this dash." });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeBoardId, session?.boardId]);

  // Anonymous quick-start flow, unchanged: no specific board requested and no
  // session yet — create a fresh throwaway board.
  useEffect(() => {
    if (resumeBoardId || session || creatingRef.current) return;
    creatingRef.current = true;
    fetch("/api/dash/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not create board.");
          return;
        }
        onSessionCreated({
          code: data.code,
          boardId: data.boardId,
          hostToken: data.hostToken,
          title: data.title,
        });
      })
      .catch(() => setError("Network error. Could not create board."))
      .finally(() => {
        creatingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, resumeBoardId]);

  const activeResumeError = resumeError && resumeError.boardId === resumeBoardId ? resumeError : null;
  if (activeResumeError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-navy-700/60">{activeResumeError.message}</p>
        <Link
          href="/dash/mine"
          className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
        >
          Back to My Dashes
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-navy-700/60">{error}</div>
    );
  }

  const waitingForResume = !!resumeBoardId && session?.boardId !== resumeBoardId;
  if (!session || waitingForResume) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-navy-700/40">
        {waitingForResume ? "Loading your dash…" : "Setting up your jamboard…"}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <JamboardView code={session.code} isHost hostToken={session.hostToken} authorName="Teacher" />
    </div>
  );
}
