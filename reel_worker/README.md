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

The web app and this worker are **two services in the same Railway project**,
sharing one Postgres database as the job queue. Step by step:

1. **New service → same repo.** In the project that already hosts the Next.js
   app, add a second service from this same GitHub repo.
2. **Set the root directory to `reel_worker`.** Service → *Settings → Root
   Directory* = `reel_worker`. Railway then reads `reel_worker/railway.json`
   and `reel_worker/Dockerfile` (config-as-code — no manual build settings).
3. **Share `DATABASE_URL`.** Add a variable reference so the worker uses the
   **same** database as the web app, e.g. `DATABASE_URL =
   ${{Postgres.DATABASE_URL}}` (or reference the web service's variable).
   The worker touches only the shared `reel_*` tables the web app creates.
4. **No public networking.** The worker has no HTTP port — it only polls
   Postgres. Leave it without a generated domain.
5. **One instance.** `railway.json` pins `numReplicas: 1`. The `FOR UPDATE SKIP
   LOCKED` claim makes multiple instances safe if you ever need throughput, but
   one is right for launch.

`railway.json` also sets an `ON_FAILURE` restart policy, so a crashed render
process is restarted automatically; the web app's stale-job reaper releases any
job that was mid-render when it died.

### Verify the deploy

- Worker logs should print `[reel_worker] started; polling for jobs…`.
- In the app, open a Reel project and click **Render preview** — a
  `reel_render_jobs` row goes `queued → rendering → done` and the silent
  preview appears. That confirms the shared-DB job loop end to end.
