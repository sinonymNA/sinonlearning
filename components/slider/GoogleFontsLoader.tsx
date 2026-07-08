"use client";

import { useEffect } from "react";
import { buildGoogleFontsHref } from "@/lib/sliderFonts";

const HREF = buildGoogleFontsHref();

// Loads every Google font used by a preset or custom theme once per page, so
// the live editor/theme-picker preview renders in the real typeface instead
// of the browser's fallback.
export default function GoogleFontsLoader() {
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
  return null;
}
