"use client";

import { useEffect, useState } from "react";

function readStored<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => readStored(key, initial));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota/storage errors
    }
  }, [key, state]);

  return [state, setState] as const;
}
