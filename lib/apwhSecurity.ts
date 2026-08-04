export function requestIsSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  if (fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase();
    const host = request.headers.get("host")?.toLowerCase();
    const requestHost = new URL(request.url).host.toLowerCase();
    return [forwardedHost, host, requestHost].filter(Boolean).includes(originHost);
  } catch {
    return false;
  }
}

export function safeInternalHref(value: string): string {
  const href = value.trim();
  if (!href.startsWith("/") || href.startsWith("//")) return "/apwh";
  return href.slice(0, 300);
}
