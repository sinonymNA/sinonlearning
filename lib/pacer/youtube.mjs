// Turn a pasted YouTube / YouTube Music link into { kind: "v" | "p", id } (a video or a playlist). Nothing is fetched.
const VID = /^[A-Za-z0-9_-]{11}$/, LIST = /^[A-Za-z0-9_-]{10,60}$/;
export function parseYouTubeLink(input) {
  let s = String(input ?? "").trim(); if (!s) return null; if (!/^[a-z]+:\/\//i.test(s)) s = "https://" + s;
  let u; try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const h = u.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, ""), list = u.searchParams.get("list"), v = u.searchParams.get("v");
  const seg = u.pathname.split("/").filter(Boolean);
  if (h === "youtu.be") { if (seg[0] && VID.test(seg[0])) return { kind: "v", id: seg[0] }; return list && LIST.test(list) ? { kind: "p", id: list } : null; }
  if (h !== "youtube.com" && h !== "youtube-nocookie.com") return null;
  if (seg[0] === "playlist" && list && LIST.test(list)) return { kind: "p", id: list };
  if (v && VID.test(v)) return { kind: "v", id: v };
  if (["embed", "shorts", "live", "v"].includes(seg[0]) && seg[1] && VID.test(seg[1])) return { kind: "v", id: seg[1] };
  if (list && LIST.test(list)) return { kind: "p", id: list };
  return null;
}
