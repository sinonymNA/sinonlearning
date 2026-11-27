"use client";
// The walk with no book: a big timer. (With a book, the same banner sits above the reader.)
import { useState } from "react";
import { walk, useWalk, type WalkResult } from "../../../lib/pacer/walkSession";
import WalkBar, { PocketLock } from "./WalkBar";

export default function WalkRunner({ theme, onEnd }: { theme: string; onEnd: (r: WalkResult | null) => void }) {
  const snap = useWalk(), [locked, setLocked] = useState(false);
  return (
    <div className="pc-root pc-sans pw-runner" data-theme={theme}>
      <WalkBar snap={snap} big onPause={() => walk.pause()} onResume={() => walk.resume()} onSkip={() => walk.skip()} onEnd={() => onEnd(walk.end())} onLock={() => setLocked(true)} />
      {locked && <PocketLock onUnlock={() => setLocked(false)} />}
    </div>
  );
}
