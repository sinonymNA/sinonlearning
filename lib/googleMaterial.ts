export type MaterialKind = "doc" | "slides";

export interface ParsedMaterialLink {
  kind: MaterialKind;
  fileId: string;
  embedUrl: string;
}

export function parseGoogleMaterialUrl(input: string): ParsedMaterialLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.hostname.replace(/^www\./, "") !== "docs.google.com") return null;

  const docMatch = url.pathname.match(/^\/document\/d\/([\w-]+)/);
  if (docMatch) {
    return {
      kind: "doc",
      fileId: docMatch[1],
      embedUrl: `https://docs.google.com/document/d/${docMatch[1]}/preview`,
    };
  }

  const slidesMatch = url.pathname.match(/^\/presentation\/d\/([\w-]+)/);
  if (slidesMatch) {
    return {
      kind: "slides",
      fileId: slidesMatch[1],
      embedUrl: `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed`,
    };
  }

  return null;
}
