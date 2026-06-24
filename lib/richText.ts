/**
 * Regex-based (no DOMParser) rich-text helpers. Kept dependency-free and DOM-free so the
 * same functions run both in the browser editor and in the Node.js Comet API route.
 */

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "ul", "ol", "li", "br", "p", "div", "span"]);

function stripScriptsAndComments(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Strips disallowed tags entirely and strips all attributes from allowed tags. */
export function sanitizeRichTextHtml(html: string): string {
  const clean = stripScriptsAndComments(html);
  return clean.replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (match, rawTag) => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
  });
}

export function richTextToPlainText(html: string): string {
  const clean = stripScriptsAndComments(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(clean)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function richTextToMarkdown(html: string): string {
  const clean = stripScriptsAndComments(html)
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<(b|strong)[^>]*>/gi, "**")
    .replace(/<\/(b|strong)>/gi, "**")
    .replace(/<(i|em)[^>]*>/gi, "_")
    .replace(/<\/(i|em)>/gi, "_")
    .replace(/<\/?u[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(clean)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
