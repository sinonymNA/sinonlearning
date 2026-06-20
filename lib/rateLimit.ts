const requestLog = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  windowMs: number,
  maxRequests: number
): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > maxRequests;
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
