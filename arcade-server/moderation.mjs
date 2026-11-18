import { GameError } from "./util.mjs";

// Deliberately small, conservative list. Schools should still supervise. Matching is done on
// leet-normalised tokens (whole words) plus a few strong substrings on the squashed text.
const TOKENS = new Set(`ass arse asshole bastard bitch bollocks boob boobs butt crap cum cunt damn dick dildo dumbass fag faggot
fuck fucker fucking hell hoe homo horny jerk kike kill kys nazi negro nigga nigger nude orgasm penis piss porn prick pussy queer
rape rapist retard sex sexy shit slut spic suicide tit tits titty twat vagina whore wtf stfu dyke`.split(/\s+/));
const STRONG = ["fuck", "shit", "nigg", "cunt", "bitch", "whore", "pussy", "dildo", "faggot", "jizz", "retard", "slut", "porn"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

export function normalizeForModeration(text) {
  return String(text).toLowerCase().replace(/[0134578@$!]/g, (c) => LEET[c] ?? c);
}

export function isClean(text) {
  const norm = normalizeForModeration(text);
  const tokens = norm.split(/[^a-z]+/).filter(Boolean);
  if (tokens.some((t) => TOKENS.has(t))) return false;
  const squashed = norm.replace(/[^a-z]/g, "");
  return !STRONG.some((s) => squashed.includes(s));
}

const PII = [/[\w.+-]+@[\w-]+\.[\w.]+/i, /(?:\d[\s().-]?){7,}/, /https?:\/\//i, /\bwww\./i, /\.(com|net|org|io|gg)\b/i];
export const hasPersonalInfo = (text) => PII.some((re) => re.test(text));

export function cleanNickname(raw) {
  const nick = String(raw ?? "").normalize("NFKC").replace(/[^\p{L}\p{N} _.'-]/gu, "").replace(/\s+/g, " ").trim();
  if (nick.length < 2) throw new GameError("Pick a nickname with at least 2 characters.");
  if (!isClean(nick) || hasPersonalInfo(nick)) throw new GameError("Please pick a different nickname (classroom-friendly, no personal info).");
  return nick.slice(0, 16).trim();
}

/** Validate free text typed by a student. Returns trimmed text or throws a GameError. */
export function cleanText(raw, { min = 1, max = 120, label = "Text" } = {}) {
  const text = String(raw ?? "").normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < min) throw new GameError(`${label} is too short.`);
  if (text.length > max) throw new GameError(`${label} is too long (max ${max}).`);
  if (!isClean(text)) throw new GameError("Please keep it classroom-friendly.");
  if (hasPersonalInfo(text)) throw new GameError("Please don't share personal info.");
  return text;
}
