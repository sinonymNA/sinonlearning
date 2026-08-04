export function requestIsSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function safeInternalHref(value: string): string {
  const href = value.trim();
  if (!href.startsWith("/") || href.startsWith("//")) return "/apwh";
  return href.slice(0, 300);
}
