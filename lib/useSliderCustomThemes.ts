"use client";

import { useCallback, useEffect, useState } from "react";
import type { SliderTheme } from "./sliderThemes";

// Fetches the current teacher's saved custom themes once per mount, with a
// refresh() to pull the list again right after creating or deleting one.
export function useSliderCustomThemes() {
  const [customThemes, setCustomThemes] = useState<SliderTheme[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/slider/themes");
      if (!res.ok) return;
      const data = await res.json();
      setCustomThemes(data.themes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { customThemes, loading, refresh };
}
