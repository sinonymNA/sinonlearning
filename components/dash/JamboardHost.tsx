"use client";

import { useEffect, useState } from "react";
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
}

export default function JamboardHost({ session, onSessionCreated }: Props) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session || creating) return;
    setCreating(true);
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
      .finally(() => setCreating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-navy-700/60">{error}</div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-navy-700/40">
        Setting up your jamboard…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <JamboardView code={session.code} isHost hostToken={session.hostToken} authorName="Teacher" />
    </div>
  );
}
