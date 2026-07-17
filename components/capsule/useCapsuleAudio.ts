"use client";

import { useRef, useCallback } from "react";
import { AudioManager, type SoundKey } from "@/components/capsule/party/AudioManager";

export function useCapsuleAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const managerRef = useRef<AudioManager | null>(null);

  const play = useCallback((key: SoundKey) => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
        managerRef.current = new AudioManager(ctxRef.current);
      }
      if (ctxRef.current.state === "suspended") ctxRef.current.resume();
      managerRef.current?.play(key);
    } catch { /* ignore — AudioContext may not be available */ }
  }, []);

  return { play };
}
