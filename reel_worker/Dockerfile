# Reel render worker — Manim + ffmpeg, NO LaTeX (templates use Pango Text).
FROM python:3.12-slim

# Runtime system deps for Manim (Cairo + Pango) and ffmpeg for muxing/concat.
# Installed as "manual" so the build-deps purge below never auto-removes them.
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

# pycairo and manimpango are source-only (no wheels), so they must be compiled:
# install the C toolchain + Cairo/Pango dev headers, build the wheels, then purge
# the build deps in the same layer to keep the final image small.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      pkg-config \
      libcairo2-dev \
      libpango1.0-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential pkg-config libcairo2-dev libpango1.0-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# DATABASE_URL is provided by Railway (shared with the web service).
CMD ["python", "worker.py"]
