// One audio element and one speech queue shared by the reader's HD voice, so that starting the walk from a tap can "unlock" them for the reader that opens a moment later.
// (iPhone and iPad only let sound start from a tap, and the reader mounts after a short wait for the book to load.)
import { SILENT_WAV } from "./neural.mjs";
let el: HTMLAudioElement | null = null;
export const narrationAudio = (): HTMLAudioElement => (el ??= new Audio());
/** Call inside a tap. Plays a silent clip on the shared audio element and queues a silent utterance. */
export function unlockNarration() {
  try { const a = narrationAudio(); a.src = SILENT_WAV; void a.play().catch(() => {}); } catch { /* */ }
  try { if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); } } catch { /* */ }
}
