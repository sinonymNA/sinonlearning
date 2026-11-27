"use client";
// The Sound panel: read-aloud voice and background music links.
import { useState } from "react";
import { approxWpm, rateFor, MAX_VOICE_WPM } from "../../lib/pacer/voice.mjs";
import { parseYouTubeLink } from "../../lib/pacer/youtube.mjs";
import { HD_VOICES, HD_MB } from "./hdVoice";
import { HD_MAX_WPM, hdRate } from "../../lib/pacer/neural.mjs";
import type { AudioPrefs, Track } from "../../lib/pacer/audioStore";

export type HdInfo = { supported: boolean; state: "none" | "downloading" | "loading" | "ready" | "error"; pct: number; speed: number | null };

export type VoiceOpt = { name: string; label: string; lang: string };

export default function Sound({ audio, setAudio, voices, speechOk, wpm, musicPlaying, hd, onHd, onMusic, onTry, close }: {
  audio: AudioPrefs; setAudio: (fn: (a: AudioPrefs) => AudioPrefs) => void; voices: VoiceOpt[]; speechOk: boolean; wpm: number; musicPlaying: boolean; hd: HdInfo; onHd: (cmd: "download" | "remove") => void;
  onMusic: (cmd: "play" | "pause" | "next" | "prev" | "open") => void; onTry: () => void; close: () => void;
}) {
  const [link, setLink] = useState(""), [err, setErr] = useState<string | null>(null);
  const rate = rateFor(wpm), capped = wpm > MAX_VOICE_WPM;
  const add = () => {
    const t = parseYouTubeLink(link) as Track | null; if (!t) { setErr("That does not look like a YouTube link. Paste a video or playlist link."); return; }
    if (audio.tracks.some((x) => x.id === t.id)) { setErr("That one is already in your list."); return; }
    if (audio.tracks.length >= 30) { setErr("That is plenty! Remove one before adding more."); return; }
    setAudio((a) => ({ ...a, tracks: [...a.tracks, t] })); setLink(""); setErr(null);
  };
  return (
    <div className="pc-modal pc-sound" role="dialog" aria-label="Sound" onClick={close}>
      <div className="pc-card" onClick={(e) => e.stopPropagation()}>
        <h2>Sound</h2>

        <section aria-label="Read aloud">
          <h3>Read aloud</h3>
          {!speechOk && !hd.supported ? <p className="mut">This browser cannot read aloud. Try Safari, Chrome or Edge.</p> : (<>
            <label className="pc-toggle"><input type="checkbox" checked={audio.voiceOn} onChange={(e) => setAudio((a) => ({ ...a, voiceOn: e.target.checked }))} /><span>Read the words out loud as I go</span></label>
            {hd.supported && (<div className="pc-hd" role="group" aria-label="Voice type">
              <label className="pc-toggle"><input type="radio" name="vt" checked={!audio.hd} onChange={() => setAudio((a) => ({ ...a, hd: false }))} /><span>This device&apos;s voices</span></label>
              <label className="pc-toggle"><input type="radio" name="vt" checked={audio.hd} onChange={() => setAudio((a) => ({ ...a, hd: true }))} /><span>HD voice (more natural, one-time download of about {HD_MB} MB)</span></label>
            </div>)}
            {audio.hd && hd.supported ? (<>
              <div className="pc-row"><select className="pc-select wide" value={audio.hdVoice} onChange={(e) => setAudio((a) => ({ ...a, hdVoice: e.target.value }))} aria-label="HD voice" >{HD_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
                {hd.state === "ready" ? <><button className="pc-btn" onClick={onTry}>Hear it</button><button className="pc-btn" onClick={() => onHd("remove")}>Remove voice</button></> : hd.state === "downloading" || hd.state === "loading" ? <span className="mut small" role="status">{hd.state === "downloading" ? `Downloading… ${Math.round(hd.pct * 100)}%` : "Getting it ready…"}</span> : <button className="pc-btn pri" onClick={() => onHd("download")}>{hd.state === "error" ? "Try again" : `Download (${HD_MB} MB)`}</button>}</div>
              {hd.state === "error" && <p className="pc-err small" role="alert">The HD voice could not be loaded. Check your connection (the voice model comes from huggingface.co), then try again. Until then Pacer uses this device&apos;s voice.</p>}
              {hd.state === "ready" && hd.speed !== null && <p className={`small ${hd.speed >= 1.3 ? "mut" : "pc-err"}`} role="status">{hd.speed >= 1.3 ? `Speed check: this device makes speech about ${hd.speed}× faster than it plays, so reading will be smooth.` : hd.speed >= 0.9 ? `Speed check: this device only just keeps up (${hd.speed}×). Expect short waits between sentences, especially at higher speeds.` : `Speed check: this device is too slow for the HD voice (${hd.speed}×), so it will pause often. The device voice will read more smoothly.`}</p>}
              <p className="mut small">Best on Wi-Fi. It runs on your device (the book never leaves it) and speaks a sentence ahead, so an older phone may pause between sentences. Speed follows your wpm setting ({wpm} wpm is {hdRate(wpm)}×, up to about {HD_MAX_WPM} wpm). The voice is Kokoro, an open-source model (Apache 2.0).</p>
            </>) : !speechOk ? <p className="mut">This browser has no built-in voices.</p> : (<>
              <p className="mut small">The voice sets the pace and the highlight follows it. Your speed setting ({wpm} wpm) becomes a voice speed of {rate}× (about {approxWpm(rate)} wpm){capped ? `; voices top out near ${MAX_VOICE_WPM} wpm` : ""}.</p>
              <div className="pc-row"><select className="pc-select wide" value={audio.voiceName} onChange={(e) => setAudio((a) => ({ ...a, voiceName: e.target.value }))} aria-label="Voice"><option value="">Best voice on this device</option>{voices.map((v) => <option key={v.name} value={v.name}>{v.name}{v.label ? ` (${v.label.toLowerCase()})` : ""}</option>)}</select><button className="pc-btn" onClick={onTry}>Hear it</button></div>
              {voices.length > 0 && !voices.some((v) => v.label === "Natural") && <p className="mut small"><b>Want it to sound less robotic?</b> Switch to the HD voice above, or download an Enhanced or Premium voice in your device settings (iPhone and iPad: Settings → Accessibility → Spoken Content → Voices).</p>}
            </>)}
          </>)}
        </section>

        <section aria-label="Rain">
          <h3>Rain</h3>
          <label className="pc-toggle"><input type="checkbox" checked={audio.rain} onChange={(e) => setAudio((a) => ({ ...a, rain: e.target.checked }))} /><span>Rain sound</span></label>
          {audio.rain && (<>
            <div className="pc-chips" role="group" aria-label="Rain strength">{["Light", "Steady", "Heavy"].map((n, i) => <button key={n} className={audio.rainLevel === i ? "on" : ""} onClick={() => setAudio((a) => ({ ...a, rainLevel: i }))}>{n}</button>)}</div>
            <label className="pc-vol"><span>Volume</span><input type="range" min={0} max={100} value={audio.rainVol} onChange={(e) => setAudio((a) => ({ ...a, rainVol: +e.target.value }))} aria-label="Rain volume" /><b>{audio.rainVol}</b></label>
            <label className="pc-toggle"><input type="checkbox" checked={audio.follow} onChange={(e) => setAudio((x) => ({ ...x, follow: e.target.checked }))} /><span>Play only while I read</span></label>
            <p className="mut small">Made on your device, so it works offline and needs no download. {audio.follow ? "It plays while you read and fades when you pause." : "It keeps playing until you turn it off."}</p>
          </>)}
        </section>

        <section aria-label="Background music">
          <h3>Background music</h3>
          <p className="mut small">Paste a YouTube link (a video or a playlist) for focus music. It plays in YouTube&apos;s own player, which has to stay on screen; you can move it to another corner.</p>
          <div className="pc-row"><input className="pc-input" value={link} onChange={(e) => { setLink(e.target.value); setErr(null); }} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube link" inputMode="url" autoCapitalize="off" autoCorrect="off" /><button className="pc-btn" onClick={add}>Add</button></div>
          {err && <p className="pc-err small" role="alert" style={{ margin: "6px 0 0" }}>{err}</p>}
          {audio.tracks.length > 0 && (<>
            <ul className="pc-tracks">{audio.tracks.map((t, i) => (<li key={t.id} className={i === audio.idx ? "on" : ""}>
              <button onClick={() => { setAudio((a) => ({ ...a, idx: i })); onMusic("play"); }} aria-label={`Play ${t.title || (t.kind === "p" ? "playlist" : "video")}`}>{i === audio.idx && musicPlaying ? "♪ " : ""}{t.title || (t.kind === "p" ? "Playlist" : "Video") + " · " + t.id.slice(0, 6)}<small>{t.kind === "p" ? " playlist" : ""}</small></button>
              <button className="pc-x" onClick={() => setAudio((a) => { const tracks = a.tracks.filter((_, k) => k !== i); return { ...a, tracks, idx: Math.min(a.idx, Math.max(0, tracks.length - 1)) }; })} aria-label="Remove this link">✕</button></li>))}</ul>
            <div className="pc-row"><button className="pc-btn round" onClick={() => onMusic("prev")} aria-label="Previous track">⏮</button><button className="pc-btn pri" onClick={() => onMusic(musicPlaying ? "pause" : "play")}>{musicPlaying ? "Pause music" : "Play music"}</button><button className="pc-btn round" onClick={() => onMusic("next")} aria-label="Next track">⏭</button></div>
            <label className="pc-vol"><span>Volume</span><input type="range" min={0} max={100} value={audio.vol} onChange={(e) => setAudio((a) => ({ ...a, vol: +e.target.value }))} aria-label="Music volume" /><b>{audio.vol}</b></label>
            <label className="pc-toggle"><input type="checkbox" checked={audio.follow} onChange={(e) => setAudio((a) => ({ ...a, follow: e.target.checked }))} /><span>Start and pause the music and rain with my reading</span></label>
            <p className="mut small">Tip: keep music quieter than the voice (try 20 to 35) so you can follow the words. On iPhone and iPad the first time you may need to tap play inside the player, and music stops when the screen locks or you switch apps.</p>
          </>)}
        </section>
        <button className="pc-btn" onClick={close}>Done</button>
      </div>
    </div>
  );
}
