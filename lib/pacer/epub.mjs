// EPUB -> chapters of paragraphs, in the browser or in node tests. The caller passes JSZip and a DOMParser class (the browser's, or @xmldom/xmldom in tests). Pure ESM.
const BLOCK = new Set(["p", "div", "section", "article", "blockquote", "li", "ul", "ol", "tr", "table", "pre", "figure", "figcaption", "aside", "header", "footer", "dd", "dt", "dl", "h1", "h2", "h3", "h4", "h5", "h6", "body", "main"]);
const SKIP = new Set(["script", "style", "head", "nav", "svg", "math", "noscript"]);
const lname = (n) => String(n.localName || n.nodeName || "").split(":").pop().toLowerCase();
function walkEls(node, fn) { for (let c = node.firstChild; c; c = c.nextSibling) { if (c.nodeType === 1) { fn(c); walkEls(c, fn); } } }
const els = (doc, name) => { const out = []; walkEls(doc, (e) => { if (lname(e) === name) out.push(e); }); return out; };
const dirOf = (p) => p.slice(0, p.lastIndexOf("/") + 1);
function resolve(base, href) { const parts = (base + decodeURIComponent(href.split("#")[0])).split("/"), out = []; for (const s of parts) { if (s === "..") out.pop(); else if (s !== "." && s !== "") out.push(s); } return out.join("/"); }
/** Paragraphs of one XHTML chapter. Headings come out as kind "h". */
export function xhtmlToParas(doc) {
  const paras = []; let buf = "", kind = "p"; const flush = () => { const t = buf.replace(/\s+/g, " ").trim(); if (t) paras.push({ text: t, kind }); buf = ""; kind = "p"; };
  const walk = (n) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3 || c.nodeType === 4) { buf += c.nodeValue; continue; } if (c.nodeType !== 1) continue; const t = lname(c); if (SKIP.has(t)) continue;
      if (t === "br") { buf += " "; continue; } if (t === "img") { const alt = c.getAttribute && c.getAttribute("alt"); if (alt && alt.length > 3) buf += ` ${alt} `; continue; }
      if (BLOCK.has(t)) { flush(); if (/^h[1-6]$/.test(t)) kind = "h"; walk(c); flush(); } else walk(c);
    }
  };
  const body = els(doc, "body")[0] || doc.documentElement || doc; walk(body); flush(); return paras;
}
const wordsIn = (paras) => paras.reduce((n, p) => n + p.text.split(/\s+/).length, 0);
/** parseEpub(arrayBuffer, { JSZip, DOMParser }) -> { title, author, chapters: [{ title, paras }] } in reading (spine) order. Throws a friendly Error for DRM or broken files. */
export async function parseEpub(buf, { JSZip, DOMParser }) {
  const zip = await JSZip.loadAsync(buf), parse = (s, type = "application/xml") => new DOMParser().parseFromString(s, type), text = async (p) => { const f = zip.file(p) || zip.file(decodeURIComponent(p)); return f ? f.async("string") : null; };
  if (zip.file("META-INF/encryption.xml")) { const enc = await text("META-INF/encryption.xml"); if (enc && /EncryptedData/i.test(enc) && !/IDPF.*font|obfuscation/i.test(enc)) throw new Error("This EPUB is copy-protected (DRM), so it cannot be opened. Try a DRM-free copy or paste the text instead."); }
  const container = await text("META-INF/container.xml"); if (!container) throw new Error("This does not look like a valid EPUB (no container.xml).");
  const root = els(parse(container), "rootfile")[0]; const opfPath = root && root.getAttribute("full-path"); if (!opfPath) throw new Error("This EPUB has no package file."); const opfXml = await text(opfPath); if (!opfXml) throw new Error("This EPUB's package file is missing.");
  const opf = parse(opfXml), base = dirOf(opfPath), manifest = {}; for (const it of els(opf, "item")) manifest[it.getAttribute("id")] = { href: it.getAttribute("href"), type: it.getAttribute("media-type") || "", props: it.getAttribute("properties") || "" };
  const meta = (name) => { const e = els(opf, name)[0]; return e ? (e.textContent || "").trim() : ""; }, title = meta("title") || "Untitled", author = meta("creator");
  // titles for the chapter list: EPUB3 nav, else the NCX
  const titles = {}; const navItem = Object.values(manifest).find((m) => /\bnav\b/.test(m.props)), ncxItem = Object.values(manifest).find((m) => /ncx/.test(m.type));
  try {
    if (navItem) { const nd = parse((await text(resolve(base, navItem.href))) || "", "application/xhtml+xml"), nb = dirOf(resolve(base, navItem.href)); for (const a of els(nd, "a")) { const h = a.getAttribute("href"); if (h) { const k = resolve(nb, h); if (!titles[k]) titles[k] = (a.textContent || "").replace(/\s+/g, " ").trim(); } } }
    else if (ncxItem) { const nd = parse((await text(resolve(base, ncxItem.href))) || ""), nb = dirOf(resolve(base, ncxItem.href)); for (const np of els(nd, "navPoint")) { const c = els(np, "content")[0], l = els(np, "text")[0]; if (c && l) { const k = resolve(nb, c.getAttribute("src") || ""); if (!titles[k]) titles[k] = (l.textContent || "").replace(/\s+/g, " ").trim(); } } }
  } catch { /* titles are a nicety */ }
  const chapters = []; let n = 0;
  for (const ref of els(opf, "itemref")) {
    if (ref.getAttribute("linear") === "no") continue; const m = manifest[ref.getAttribute("idref")]; if (!m || !/x?html/.test(m.type)) continue; if (/\bnav\b/.test(m.props)) continue;
    const path = resolve(base, m.href), raw = await text(path); if (!raw) continue; let doc; try { doc = parse(raw, "application/xhtml+xml"); if (!els(doc, "body").length) throw new Error("no body"); } catch { doc = parse(raw, "text/html"); }
    const paras = xhtmlToParas(doc); if (wordsIn(paras) < 12) continue; n++; const firstH = paras.find((p) => p.kind === "h");
    chapters.push({ title: titles[path] || (firstH && firstH.text.length < 80 ? firstH.text : `Section ${n}`), paras });
  }
  if (!chapters.length) throw new Error("No readable text was found in this EPUB (it may be made of images).");
  return { title, author, chapters };
}
