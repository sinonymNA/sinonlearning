"""Reel render worker — a long-running loop that drains the Postgres job queue.

Deploy as a separate Railway service sharing DATABASE_URL with the web app:
    python worker.py

It claims queued reel_render_jobs, renders/muxes with Manim + ffmpeg, and writes
the resulting MP4 back into the job row. Also supports one-shot modes for local
testing:
    python worker.py --once            # process a single queued job then exit
    python worker.py --sample out.mp4  # render the built-in 3-beat sample, no DB
"""

from __future__ import annotations

import sys
import time
import traceback

from db import connect, claim_next_job, get_project, complete_job, fail_job
from render import build_video

POLL_SECONDS = 3


def process_one() -> bool:
    """Claim and process a single job. Returns True if a job was handled."""
    conn = connect()
    try:
        job = claim_next_job(conn)
        if not job:
            return False
        job_id, project_id, kind = job["id"], job["project_id"], job["kind"]
        print(f"[reel_worker] claimed job {job_id} kind={kind} project={project_id}", flush=True)
        try:
            project = get_project(conn, project_id)
            if not project:
                raise RuntimeError("Project not found")
            project["id"] = project_id
            video = build_video(conn, project, kind)
            complete_job(conn, job_id, video, "video/mp4")
            print(f"[reel_worker] done job {job_id} ({len(video)} bytes)", flush=True)
        except Exception as err:  # noqa: BLE001 — surface any render failure to the row
            traceback.print_exc()
            fail_job(conn, job_id, f"{type(err).__name__}: {err}")
        return True
    finally:
        conn.close()


def loop() -> None:
    print("[reel_worker] started; polling for jobs…", flush=True)
    while True:
        try:
            handled = process_one()
        except Exception:  # noqa: BLE001 — never let the loop die on a transient DB error
            traceback.print_exc()
            handled = False
        if not handled:
            time.sleep(POLL_SECONDS)


def render_sample(out_path: str) -> None:
    """Render a fixed 3-beat sample with no DB — proves the Manim pipeline."""
    project = {
        "id": "sample",
        "title": "Sample",
        "beats": [
            {
                "id": "b1",
                "templateId": "titleCard",
                "params": {"headline": "Opportunity Cost", "subtitle": "The hidden price of every choice"},
                "animationSeconds": 4,
            },
            {
                "id": "b2",
                "templateId": "bulletReveal",
                "params": {
                    "heading": "Three things to know",
                    "bullets": ["Every choice has a cost", "The cost is the next-best option", "It's not always money"],
                },
                "animationSeconds": 8,
            },
            {
                "id": "b3",
                "templateId": "imageCaption",
                "params": {"caption": "What did you give up to be here?"},
                "imageId": None,
                "animationSeconds": 5,
            },
        ],
    }

    class _NoConn:
        pass

    video = build_video(_NoConn(), project, "render")
    with open(out_path, "wb") as fh:
        fh.write(video)
    print(f"[reel_worker] wrote sample -> {out_path} ({len(video)} bytes)", flush=True)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--sample":
        render_sample(sys.argv[2])
    elif len(sys.argv) >= 2 and sys.argv[1] == "--once":
        handled = process_one()
        sys.exit(0 if handled else 1)
    else:
        loop()
