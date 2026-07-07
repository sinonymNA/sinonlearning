"""Postgres access for the Reel render worker.

Shares the same DATABASE_URL / tables as the Next.js app (lib/reelDb.ts). The
worker only ever touches reel_render_jobs, reel_projects, reel_images, reel_audio.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import psycopg
from psycopg.rows import dict_row


def _dsn() -> str:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set")
    return dsn


def connect() -> psycopg.Connection:
    # autocommit off; each helper commits explicitly.
    return psycopg.connect(_dsn(), row_factory=dict_row)


def reap_stale_jobs(conn: psycopg.Connection, max_rendering_seconds: int = 600) -> int:
    """Fail jobs stuck in 'rendering' past the cutoff (mirrors reelDb.reapStaleJobs).

    A worker that crashes mid-render leaves its claimed job hung forever, which
    would keep the editor polling. Sweeping these on each poll self-heals it.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reel_render_jobs
            SET status = 'failed', error = 'Render timed out.', updated_at = now()
            WHERE status = 'rendering'
              AND updated_at < now() - make_interval(secs => %s)
            """,
            (max_rendering_seconds,),
        )
        count = cur.rowcount
    conn.commit()
    return count


def claim_next_job(conn: psycopg.Connection) -> Optional[dict[str, Any]]:
    """Atomically claim the oldest queued job (mirrors reelDb.claimNextJob)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reel_render_jobs SET status = 'rendering', updated_at = now()
            WHERE id = (
              SELECT id FROM reel_render_jobs WHERE status = 'queued'
              ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
            )
            RETURNING id, project_id, kind
            """
        )
        row = cur.fetchone()
    conn.commit()
    return row


def get_project(conn: psycopg.Connection, project_id: str) -> Optional[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, title, beats, theme_id FROM reel_projects WHERE id = %s", (project_id,)
        )
        return cur.fetchone()


def get_image_bytes(conn: psycopg.Connection, image_id: str) -> Optional[tuple[bytes, str]]:
    with conn.cursor() as cur:
        cur.execute("SELECT data, mime_type FROM reel_images WHERE id = %s", (image_id,))
        row = cur.fetchone()
    if not row:
        return None
    return bytes(row["data"]), row["mime_type"]


def get_beat_audio(
    conn: psycopg.Connection, project_id: str, beat_id: str
) -> Optional[tuple[bytes, str]]:
    """Latest recorded narration clip for a beat, if any."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT data, mime_type FROM reel_audio
            WHERE project_id = %s AND beat_id = %s
            ORDER BY created_at DESC LIMIT 1
            """,
            (project_id, beat_id),
        )
        row = cur.fetchone()
    if not row:
        return None
    return bytes(row["data"]), row["mime_type"]


def complete_job(conn: psycopg.Connection, job_id: str, output: bytes, mime: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reel_render_jobs
            SET status = 'done', output = %s, output_mime = %s, error = NULL, updated_at = now()
            WHERE id = %s
            """,
            (output, mime, job_id),
        )
    conn.commit()


def fail_job(conn: psycopg.Connection, job_id: str, error: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE reel_render_jobs SET status = 'failed', error = %s, updated_at = now() WHERE id = %s",
            (error[:2000], job_id),
        )
    conn.commit()
