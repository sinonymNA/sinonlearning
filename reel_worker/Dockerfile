# Reel render worker — Manim + ffmpeg, NO LaTeX (templates use Pango Text).
FROM python:3.12-slim

# System deps for Manim (Cairo + Pango) and ffmpeg for muxing/concat.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      libcairo2 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libgdk-pixbuf-2.0-0 \
      fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# DATABASE_URL is provided by Railway (shared with the web service).
CMD ["python", "worker.py"]
