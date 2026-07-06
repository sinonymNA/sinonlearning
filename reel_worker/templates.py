"""Manim scene definitions for Reel beat templates.

One Scene class (`BeatScene`) dispatches on the beat's templateId. Everything
uses Pango-based Text (NOT LaTeX) so the render image stays light. Keep these
visually in lockstep with the TS previews (components/reel) — this file is the
source of truth for what the final video looks like.
"""

from __future__ import annotations

from typing import Any, Optional

from manim import (
    Scene,
    Text,
    ImageMobject,
    VGroup,
    Group,
    FadeIn,
    Write,
    LaggedStart,
    UP,
    DOWN,
    LEFT,
    config,
)

# Theme — mirrors REEL_THEME in lib/reelTypes.ts.
BG = "#0f172a"
HEADING = "#f8fafc"
BODY = "#cbd5e1"
ACCENT = "#38bdf8"
FONT = "sans-serif"  # Pango family; Inter falls back to sans-serif if absent


def _s(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value if str(v).strip()]
    return []


class BeatScene(Scene):
    """Renders a single beat. Instance attrs are set before render():
    self.beat (dict), self.image_path (str|None), self.seconds (float).
    """

    beat: dict[str, Any]
    image_path: Optional[str]
    seconds: float

    def construct(self) -> None:
        self.camera.background_color = BG
        template = self.beat.get("templateId")
        params = self.beat.get("params", {}) or {}
        seconds = float(self.seconds)

        if template == "titleCard":
            self._title_card(params, seconds)
        elif template == "bulletReveal":
            self._bullet_reveal(params, seconds)
        elif template == "imageCaption":
            self._image_caption(params, seconds)
        else:
            # Unknown template — render its narration-agnostic caption or blank.
            self._title_card({"headline": _s(params.get("headline")) or "…"}, seconds)

    # ── titleCard ──
    def _title_card(self, params: dict[str, Any], seconds: float) -> None:
        headline = _s(params.get("headline")) or "Untitled"
        subtitle = _s(params.get("subtitle"))
        title = Text(headline, font=FONT, color=HEADING, weight="BOLD", font_size=72)
        group_items = [title]
        if subtitle:
            sub = Text(subtitle, font=FONT, color=BODY, font_size=36)
            sub.next_to(title, DOWN, buff=0.5)
            group_items.append(sub)
        group = VGroup(*group_items).move_to([0, 0, 0])
        self.play(Write(title), run_time=1.2)
        if subtitle:
            self.play(FadeIn(group_items[1], shift=UP * 0.3), run_time=0.8)
        self.wait(max(0.3, seconds - 2.0))

    # ── bulletReveal ──
    def _bullet_reveal(self, params: dict[str, Any], seconds: float) -> None:
        heading = _s(params.get("heading")) or "Key points"
        bullets = _list(params.get("bullets"))
        head = Text(heading, font=FONT, color=ACCENT, weight="BOLD", font_size=54)
        head.to_edge(UP, buff=1.2)
        self.play(FadeIn(head, shift=DOWN * 0.3), run_time=0.7)

        if bullets:
            lines = VGroup()
            for text in bullets[:5]:
                line = Text(f"•  {text}", font=FONT, color=BODY, font_size=40)
                lines.add(line)
            lines.arrange(DOWN, aligned_edge=LEFT, buff=0.55)
            lines.next_to(head, DOWN, buff=0.9)
            self.play(
                LaggedStart(*[FadeIn(m, shift=LEFT * 0.3) for m in lines], lag_ratio=0.5),
                run_time=min(4.0, 0.7 * len(lines) + 0.5),
            )
        self.wait(max(0.3, seconds - 3.0))

    # ── imageCaption ──
    def _image_caption(self, params: dict[str, Any], seconds: float) -> None:
        caption = _s(params.get("caption"))
        items: list[Any] = []
        if self.image_path:
            img = ImageMobject(self.image_path)
            # Fit within the frame with margins.
            max_w = config.frame_width * 0.72
            max_h = config.frame_height * 0.66
            if img.width > max_w:
                img.scale_to_fit_width(max_w)
            if img.height > max_h:
                img.scale_to_fit_height(max_h)
            img.move_to([0, 0.6, 0])
            items.append(img)
            self.add(img)
            # Slow Ken Burns zoom across the beat.
            self.play(img.animate.scale(1.08), run_time=max(1.0, seconds - 1.0), rate_func=lambda t: t)
        cap_items = []
        if caption:
            cap = Text(caption, font=FONT, color=BODY, font_size=34)
            if items:
                cap.next_to(items[0], DOWN, buff=0.5)
            else:
                cap.move_to([0, 0, 0])
            cap_items.append(cap)
            self.play(FadeIn(cap, shift=UP * 0.2), run_time=0.6)
        if not self.image_path:
            self.wait(max(0.3, seconds - 1.0))
        else:
            self.wait(0.4)
