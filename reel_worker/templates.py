"""Manim scene definitions for Reel beat templates.

One Scene class (`BeatScene`) dispatches on the beat's templateId. Everything
uses Pango-based Text (NOT LaTeX) so the render image stays light. Keep these
visually in lockstep with the TS previews (components/reel) — this file is the
source of truth for what the final video looks like.
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np

from manim import (
    Scene,
    Text,
    ImageMobject,
    VGroup,
    Group,
    RoundedRectangle,
    Line,
    Arrow,
    Dot,
    FadeIn,
    Write,
    Create,
    GrowArrow,
    LaggedStart,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    ORIGIN,
    config,
)

# Theme palette — mirrors REEL_THEMES in lib/reelTypes.ts exactly (same ids,
# hex values, font family names). The fonts referenced here are bundled into
# this worker's Docker image (reel_worker/fonts/, installed via fc-cache in
# the Dockerfile), so this is real typography baked into the rendered video,
# not just a browser-preview affordance.
THEMES: dict[str, dict[str, str]] = {
    "cream-rose": {
        "background": "#F8F2E6",
        "heading": "#0D1B2E",
        "body": "#8B7D87",
        "accent": "#B0567A",
        "panel": "#F0E6D3",
        "font_heading": "Inter",
        "font_body": "Inter",
    },
    "warm-academic": {
        "background": "#F3E9D8",
        "heading": "#7C2D12",
        "body": "#57534E",
        "accent": "#C2410C",
        "panel": "#EAD9BE",
        "font_heading": "Fraunces",
        "font_body": "Inter",
    },
    "handwritten": {
        "background": "#FDFBF6",
        "heading": "#2D3142",
        "body": "#6B7280",
        "accent": "#6FA287",
        "panel": "#E7EFE9",
        "font_heading": "Patrick Hand",
        "font_body": "Patrick Hand",
    },
}
DEFAULT_THEME_ID = "cream-rose"


def _s(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value if str(v).strip()]
    return []


class BeatScene(Scene):
    """Renders a single beat. Instance attrs are set before render():
    self.beat (dict), self.image_path (str|None), self.seconds (float),
    self.theme_id (str|None) — the project's chosen look.
    """

    beat: dict[str, Any]
    image_path: Optional[str]
    seconds: float
    theme_id: Optional[str]

    def construct(self) -> None:
        theme = THEMES.get(getattr(self, "theme_id", None) or DEFAULT_THEME_ID, THEMES[DEFAULT_THEME_ID])
        self.bg = theme["background"]
        self.heading = theme["heading"]
        self.body = theme["body"]
        self.accent = theme["accent"]
        self.panel = theme["panel"]
        self.font_heading = theme["font_heading"]
        self.font_body = theme["font_body"]

        self.camera.background_color = self.bg
        template = self.beat.get("templateId")
        params = self.beat.get("params", {}) or {}
        seconds = float(self.seconds)

        if template == "titleCard":
            self._title_card(params, seconds)
        elif template == "bulletReveal":
            self._bullet_reveal(params, seconds)
        elif template == "imageCaption":
            self._image_caption(params, seconds)
        elif template == "labeledDiagram":
            self._labeled_diagram(params, seconds)
        elif template == "beforeAfter":
            self._before_after(params, seconds)
        elif template == "timeline":
            self._timeline(params, seconds)
        elif template == "simpleGraph":
            self._simple_graph(params, seconds)
        else:
            # Unknown template — render its narration-agnostic caption or blank.
            self._title_card({"headline": _s(params.get("headline")) or "…"}, seconds)

    # ── titleCard ──
    def _title_card(self, params: dict[str, Any], seconds: float) -> None:
        headline = _s(params.get("headline")) or "Untitled"
        subtitle = _s(params.get("subtitle"))
        title = Text(headline, font=self.font_heading, color=self.heading, weight="BOLD", font_size=72)
        group_items = [title]
        if subtitle:
            sub = Text(subtitle, font=self.font_body, color=self.body, font_size=36)
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
        head = Text(heading, font=self.font_heading, color=self.accent, weight="BOLD", font_size=54)
        head.to_edge(UP, buff=1.2)
        self.play(FadeIn(head, shift=DOWN * 0.3), run_time=0.7)

        if bullets:
            lines = VGroup()
            for text in bullets[:5]:
                line = Text(f"•  {text}", font=self.font_body, color=self.body, font_size=40)
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
            cap = Text(caption, font=self.font_body, color=self.body, font_size=34)
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

    # ── labeledDiagram ──
    def _labeled_diagram(self, params: dict[str, Any], seconds: float) -> None:
        center_text = _s(params.get("centerLabel")) or "Core idea"
        labels = _list(params.get("labels"))[:4]

        if self.image_path:
            center = ImageMobject(self.image_path)
            center.scale_to_fit_height(2.4)
            self.add(center)
        else:
            box = RoundedRectangle(corner_radius=0.2, width=4.2, height=1.4, color=self.accent)
            box.set_fill(self.accent, opacity=0.12)
            label = Text(center_text, font=self.font_heading, color=self.heading, weight="BOLD", font_size=40)
            label.move_to(box.get_center())
            center = VGroup(box, label)
            self.play(FadeIn(center), run_time=0.6)
        center.move_to(ORIGIN)

        corners = [
            [-4.6, 2.3, 0],
            [4.6, 2.3, 0],
            [-4.6, -2.3, 0],
            [4.6, -2.3, 0],
        ]
        for i, text in enumerate(labels):
            pos = corners[i]
            node = Text(text, font=self.font_body, color=self.body, font_size=32)
            node.move_to(pos)
            arrow = Arrow(
                start=center.get_center(),
                end=node.get_center(),
                color=self.accent,
                buff=1.4,
                stroke_width=4,
                max_tip_length_to_length_ratio=0.12,
            )
            shift = 0.3 * np.sign(np.array(pos, dtype=float))
            self.play(GrowArrow(arrow), FadeIn(node, shift=shift), run_time=0.6)
        self.wait(max(0.3, seconds - (1.0 + 0.6 * len(labels))))

    # ── beforeAfter ──
    def _before_after(self, params: dict[str, Any], seconds: float) -> None:
        def panel(title: str, body: str, x: float):
            box = RoundedRectangle(corner_radius=0.2, width=5.0, height=3.2, color=self.accent)
            box.set_fill(self.panel, opacity=0.9)
            box.move_to([x, 0, 0])
            t = Text(title or "", font=self.font_heading, color=self.accent, weight="BOLD", font_size=40)
            t.move_to(box.get_top() + DOWN * 0.9)
            b = Text(body or "", font=self.font_body, color=self.body, font_size=28)
            b.move_to(box.get_center() + DOWN * 0.2)
            return VGroup(box, t, b)

        left = panel(_s(params.get("leftTitle")) or "Before", _s(params.get("leftBody")), -3.6)
        right = panel(_s(params.get("rightTitle")) or "After", _s(params.get("rightBody")), 3.6)
        arrow = Arrow(start=[-1.0, 0, 0], end=[1.0, 0, 0], color=self.accent, stroke_width=6)
        arrow_label = _s(params.get("arrowLabel"))

        self.play(FadeIn(left, shift=RIGHT * 0.3), run_time=0.6)
        self.play(GrowArrow(arrow), run_time=0.5)
        if arrow_label:
            lab = Text(arrow_label, font=self.font_body, color=self.body, font_size=24)
            lab.next_to(arrow, UP, buff=0.2)
            self.play(FadeIn(lab), run_time=0.4)
        self.play(FadeIn(right, shift=LEFT * 0.3), run_time=0.6)
        self.wait(max(0.3, seconds - 2.4))

    # ── timeline ──
    def _timeline(self, params: dict[str, Any], seconds: float) -> None:
        events = _list(params.get("events"))[:5]
        line = Line([-6, 0, 0], [6, 0, 0], color=self.accent, stroke_width=5)
        self.play(Create(line), run_time=1.0)
        n = max(1, len(events))
        for i, ev in enumerate(events):
            x = -5.0 + (10.0 * i / (n - 1)) if n > 1 else 0.0
            dot = Dot([x, 0, 0], color=self.heading, radius=0.09)
            above = i % 2 == 0
            label_part, _, detail_part = ev.partition(":")
            head = Text(label_part.strip(), font=self.font_heading, color=self.accent, weight="BOLD", font_size=28)
            grp_items = [head]
            if detail_part.strip():
                det = Text(detail_part.strip(), font=self.font_body, color=self.body, font_size=22)
                det.next_to(head, DOWN, buff=0.15)
                grp_items.append(det)
            grp = VGroup(*grp_items)
            grp.move_to([x, 1.5 if above else -1.5, 0])
            self.play(FadeIn(dot), FadeIn(grp, shift=(UP if above else DOWN) * 0.2), run_time=0.5)
        self.wait(max(0.3, seconds - (1.0 + 0.5 * n)))

    # ── simpleGraph ──
    def _simple_graph(self, params: dict[str, Any], seconds: float) -> None:
        origin = [-5.0, -2.8, 0]
        x_axis = Arrow(start=origin, end=[5.0, -2.8, 0], color=self.accent, stroke_width=4, buff=0)
        y_axis = Arrow(start=origin, end=[-5.0, 3.0, 0], color=self.accent, stroke_width=4, buff=0)
        self.play(Create(x_axis), Create(y_axis), run_time=0.8)

        x_label = _s(params.get("xLabel"))
        y_label = _s(params.get("yLabel"))
        if x_label:
            xl = Text(x_label, font=self.font_body, color=self.body, font_size=26)
            xl.next_to(x_axis.get_end(), DOWN, buff=0.2)
            self.add(xl)
        if y_label:
            yl = Text(y_label, font=self.font_body, color=self.body, font_size=26)
            yl.next_to(y_axis.get_end(), RIGHT, buff=0.2)
            self.add(yl)

        trend = (_s(params.get("trend")) or "up").lower()
        if "down" in trend:
            trend_line = Line([-4.0, 2.2, 0], [4.0, -2.2, 0], color=self.accent, stroke_width=6)
        elif "flat" in trend:
            trend_line = Line([-4.0, 0.0, 0], [4.0, 0.0, 0], color=self.accent, stroke_width=6)
        else:
            trend_line = Line([-4.0, -2.2, 0], [4.0, 2.2, 0], color=self.accent, stroke_width=6)
        self.play(Create(trend_line), run_time=1.0)

        caption = _s(params.get("caption"))
        if caption:
            cap = Text(caption, font=self.font_heading, color=self.heading, font_size=30)
            cap.to_edge(DOWN, buff=0.4)
            self.play(FadeIn(cap, shift=UP * 0.2), run_time=0.5)
        self.wait(max(0.3, seconds - 2.5))
