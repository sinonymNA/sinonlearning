# Reel render worker

Renders Reel explainer-video beats with [Manim](https://www.manim.community/) and
assembles them with ffmpeg. Runs as a **separate service** from the Next.js web
app, sharing the same Postgres (`DATABASE_URL`) as a job queue.

**No LaTeX.** Templates use Manim's Pango-based `Text`, so the image only needs
Cairo + Pango + ffmpeg (see `Dockerfile`) — much lighter than a full TeX install.

## How it fits together

1. The web app enqueues a row in `reel_render_jobs` (`kind = 'render' | 'mux'`).
2. This worker polls, claims the oldest queued job (`FOR UPDATE SKIP LOCKED`),
   renders each beat to a silent clip, then:
   - `render`: concatenates them into a silent **preview** MP4.
   - `mux`: pairs each beat's clip with its recorded narration
     (`reel_audio`), extends each beat to `max(animation, narration)` so speech
     and animation line up, then concatenates the **final** MP4.
3. The MP4 bytes are written back into the job row; the browser polls for status
   and streams it from `/api/reel/projects/[id]/video`.

The `templateId → Manim Scene` mapping lives in `templates.py` and must stay
visually in lockstep with the TS previews in `components/reel/`.

## Run locally

```bash
cd reel_worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # needs system ffmpeg + cairo + pango
export DATABASE_URL=postgres://…          # same DB as the web app

python worker.py --sample sample.mp4      # render the built-in 3-beat sample (no DB)
python worker.py --once                   # process one queued job then exit
python worker.py                          # long-running poll loop (production)
```

## Deploy on Railway

Add a second service in the same project pointing at this folder (Dockerfile
build). Give it the shared `DATABASE_URL`. No public port is needed — it only
talks to Postgres. Scale to a single instance (the `SKIP LOCKED` claim also makes
multiple instances safe if you ever need throughput).
