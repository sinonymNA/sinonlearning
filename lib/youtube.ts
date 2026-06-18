export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      const match = url.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
      if (match) return match[2];
    }
  } catch {
    return null;
  }

  return null;
}
