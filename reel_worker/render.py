"""Rendering + assembly for the Reel worker.

render job: each beat -> a silent Manim clip -> concatenated silent preview MP4.
mux job:   each beat's silent clip + its recorded narration -> per-beat clip
           whose duration = max(animation, narration) -> concatenated final MP4.
"""

from __future__ import annotations

import glob
import os
import subprocess
import tempfile
from typing import Any, Optional

from manim import tempconfig

from db import get_beat_audio, get_image_bytes
import templates

WIDTH, HEIGHT, FPS = 1920, 1080, 30


def _run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"cmd failed: {' '.join(cmd[:3])}…\n{proc.stderr[-1500:]}")


def _ffprobe_duration(path: str) -> float:
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True,
        text=True,
    )
    try:
        return float(proc.stdout.strip())
    except (ValueError, AttributeError):
        return 0.0


def _image_extension(mime: str) -> str:
    return {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }.get(mime, ".png")


def _render_beat_clip(beat: dict[str, Any], image_path: Optional[str], tmpdir: str, index: int) -> str:
    """Render one beat to a silent MP4 via Manim; return its path."""
    name = f"beat_{index}"
    seconds = float(beat.get("animationSeconds") or 5)
    with tempconfig(
        {
            "pixel_width": WIDTH,
            "pixel_height": HEIGHT,
            "frame_rate": FPS,
            "output_file": name,
            "media_dir": os.path.join(tmpdir, "media"),
            "disable_caching": True,
            "verbosity": "ERROR",
            "log_to_file": False,
        }
    ):
        scene = templates.BeatScene()
        scene.beat = beat
        scene.image_path = image_path
        scene.seconds = seconds
        scene.render()

    matches = glob.glob(os.path.join(tmpdir, "media", "**", f"{name}.mp4"), recursive=True)
    if not matches:
        raise RuntimeError(f"Manim produced no output for {name}")
    return matches[0]


def _normalize(src: str, out: str, audio_path: Optional[str]) -> None:
    """Re-encode a beat clip to uniform h264/aac so clips concat cleanly.

    If audio_path is given, extend the video (freeze last frame) to the longer of
    video/audio so animation and narration line up; otherwise attach a silent
    track (keeps every clip's stream layout identical for the concat step)."""
    if audio_path:
        v_dur = _ffprobe_duration(src)
        a_dur = _ffprobe_duration(audio_path)
        pad = max(0.0, a_dur - v_dur)
        vf = f"tpad=stop_mode=clone:stop_duration={pad:.3f}" if pad > 0.05 else "null"
        _run(
            [
                "ffmpeg", "-y",
                "-i", src,
                "-i", audio_path,
                "-filter_complex", f"[0:v]{vf},fps={FPS},format=yuv420p[v]",
                "-map", "[v]", "-map", "1:a",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-c:a", "aac", "-b:a", "160k",
                "-shortest" if a_dur < v_dur else "-t", f"{max(v_dur, a_dur):.3f}",
                out,
            ]
        )
    else:
        _run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"anullsrc=channel_layout=stereo:sample_rate=44100",
                "-i", src,
                "-map", "1:v", "-map", "0:a",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-vf", f"fps={FPS},format=yuv420p",
                "-c:a", "aac", "-b:a", "160k",
                "-shortest",
                out,
            ]
        )


def _concat(clips: list[str], out: str, tmpdir: str) -> None:
    listfile = os.path.join(tmpdir, "concat.txt")
    with open(listfile, "w") as fh:
        for c in clips:
            fh.write(f"file '{c}'\n")
    # +faststart moves the moov atom to the front of the file (a second, fast
    # remux pass — works fine with `-c copy`, no re-encode). Without it the
    # index sits at the end, which combined with byte-range serving makes
    # Safari/iOS refuse to play the video at all instead of just seeking slowly.
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", "-movflags", "+faststart", out])


def _prepare_image(conn, beat: dict[str, Any], tmpdir: str, index: int) -> Optional[str]:
    image_id = beat.get("imageId")
    if not image_id:
        return None
    got = get_image_bytes(conn, image_id)
    if not got:
        return None
    data, mime = got
    path = os.path.join(tmpdir, f"img_{index}{_image_extension(mime)}")
    with open(path, "wb") as fh:
        fh.write(data)
    return path


def build_video(conn, project: dict[str, Any], kind: str) -> bytes:
    """Render (kind='render') or mux (kind='mux') the whole project; return MP4 bytes."""
    beats = project.get("beats") or []
    if not beats:
        raise RuntimeError("Project has no beats to render.")
    project_id = project["id"]

    with tempfile.TemporaryDirectory() as tmpdir:
        normalized: list[str] = []
        for i, beat in enumerate(beats):
            image_path = _prepare_image(conn, beat, tmpdir, i)
            silent = _render_beat_clip(beat, image_path, tmpdir, i)

            audio_path = None
            if kind == "mux":
                got = get_beat_audio(conn, project_id, beat.get("id", ""))
                if got:
                    data, _mime = got
                    audio_path = os.path.join(tmpdir, f"aud_{i}.webm")
                    with open(audio_path, "wb") as fh:
                        fh.write(data)

            norm = os.path.join(tmpdir, f"norm_{i}.mp4")
            _normalize(silent, norm, audio_path)
            normalized.append(norm)

        out = os.path.join(tmpdir, "final.mp4")
        _concat(normalized, out, tmpdir)
        with open(out, "rb") as fh:
            return fh.read()
