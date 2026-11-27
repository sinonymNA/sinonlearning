// Per-device audio choices (voice names and music links are not synced: voices differ per device, and links stay private).
export type Track = { kind: "v" | "p"; id: string; title?: string };
export type AudioPrefs = { voiceOn: boolean; voiceName: string; hd: boolean; hdVoice: string; rain: boolean; rainVol: number; rainLevel: number; tracks: Track[]; idx: number; vol: number; follow: boolean };
export const AUDIO_DEFAULTS: AudioPrefs = { voiceOn: false, voiceName: "", hd: false, hdVoice: "en_US-hfc_female-medium", rain: false, rainVol: 40, rainLevel: 1, tracks: [], idx: 0, vol: 35, follow: true };
const KEY = "pacer:audio:v1";
export function loadAudio(): AudioPrefs {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "{}"), tracks: Track[] = Array.isArray(j.tracks) ? j.tracks.filter((t: Track) => t && (t.kind === "v" || t.kind === "p") && /^[A-Za-z0-9_-]{10,60}$/.test(String(t.id))).slice(0, 30).map((t: Track) => ({ kind: t.kind, id: String(t.id), title: typeof t.title === "string" ? t.title.slice(0, 120) : undefined })) : [];
    return { voiceOn: !!j.voiceOn, voiceName: String(j.voiceName || "").slice(0, 200), hd: !!j.hd, rain: !!j.rain, rainVol: Math.max(0, Math.min(100, Math.round(Number(j.rainVol ?? 40)))), rainLevel: Math.max(0, Math.min(2, Math.round(Number(j.rainLevel ?? 1)) || 0)), hdVoice: /^[a-z]{2}_[A-Z]{2}-[a-z0-9_]+-(x_low|low|medium|high)$/.test(String(j.hdVoice)) ? String(j.hdVoice) : "en_US-hfc_female-medium", tracks, idx: Math.max(0, Math.min(tracks.length - 1, Math.round(Number(j.idx)) || 0)), vol: Math.max(0, Math.min(100, Math.round(Number(j.vol ?? 35)))), follow: j.follow !== false };
  } catch { return { ...AUDIO_DEFAULTS }; }
}
export function saveAudio(a: AudioPrefs) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* storage full or blocked */ } }
