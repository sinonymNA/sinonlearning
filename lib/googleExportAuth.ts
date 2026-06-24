import { randomBytes } from "crypto";
import { google } from "googleapis";

/**
 * One-shot Google export: a teacher signs in just long enough to create a single
 * Doc/Slides file, we use the access token once, and we never store it. No refresh
 * token, no persisted account, no database — matches Teacher Studio's local-only model.
 */

export const STATE_COOKIE_NAME = "g_oauth_state";

export type GoogleExportTarget = "docs" | "slides";

const SCOPES: Record<GoogleExportTarget, string> = {
  docs: "https://www.googleapis.com/auth/documents",
  slides: "https://www.googleapis.com/auth/presentations",
};

export function isGoogleExportConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/google/callback`;
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri()
  );
}

export function buildAuthState(target: GoogleExportTarget): string {
  return `${randomBytes(16).toString("hex")}.${target}`;
}

export function parseTargetFromState(state: string): GoogleExportTarget | null {
  const target = state.split(".")[1];
  return target === "docs" || target === "slides" ? target : null;
}

export function scopeForTarget(target: GoogleExportTarget): string {
  return SCOPES[target];
}
