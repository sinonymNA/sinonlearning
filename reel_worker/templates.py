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
    GrowFromCenter,
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


def _col_points(items: list[str], prefix: str) -> list[str]:
    """comparisonList's items reuse one generic slot for two columns via a
    'L:'/'R:' prefix convention — the same trick timeline already uses with
    'label: detail'. Pulls out one side's points, prefix stripped."""
    out = []
    for it in items:
        s = it.strip()
        if s.upper().startswith(prefix):
            out.append(s[len(prefix):].strip())
    return out


def _wrap_lines(text: str, font: str, font_size: int, max_width: float) -> list[str]:
    """Greedily wrap `text` at word boundaries so each line's rendered width
    (measured via a scratch Text at this font/size) fits max_width."""
    words = text.split()
    if not words:
        return []
    lines: list[str] = []
    current = words[0]
    for w in words[1:]:
        candidate = f"{current} {w}"
        if Text(candidate, font=font, font_size=font_size).width <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = w
    lines.append(current)
    return lines


def _fit_text_block(
    text: str,
    font: str,
    color: str,
    max_width: float,
    max_height: float,
    base_size: int,
    weight: Optional[str] = None,
    min_size: int = 16,
    align: Optional[np.ndarray] = None,
    line_buff: float = 0.12,
) -> VGroup:
    """Wrap `text` to fit max_width, shrinking font_size stepwise (floored at
    min_size) until the wrapped block's height also fits max_height. Returns
    a VGroup of line Texts arranged downward, centered unless `align` (e.g.
    LEFT) is given — ready to `.move_to(...)` or `.next_to(...)`.

    Manim's Text never wraps or measures against a target box on its own;
    every template that places text inside a fixed-size shape goes through
    this so long strings shrink/wrap instead of spilling past the box."""
    text = text.strip()
    if not text:
        return VGroup()

    size = base_size
    while True:
        lines = _wrap_lines(text, font, size, max_width)
        kwargs: dict[str, Any] = {"weight": weight} if weight else {}
        line_mobs = [Text(ln, font=font, color=color, font_size=size, **kwargs) for ln in lines]
        group = VGroup(*line_mobs)
        if align is not None:
            group.arrange(DOWN, buff=line_buff, aligned_edge=align)
        else:
            group.arrange(DOWN, buff=line_buff)
        if group.height <= max_height or size <= min_size:
            return group
        size = max(min_size, size - 4)


def _fit_image(path: str, max_w: float, max_h: float) -> ImageMobject:
    """Scale an image to fill the given box in whichever dimension is the
    tighter fit — unlike a shrink-only guard, this scales UP a small image
    too, so it never renders small-and-centered against empty background."""
    img = ImageMobject(path)
    scale = min(max_w / img.width, max_h / img.height)
    img.scale(scale)
    return img


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
        elif template == "statCallout":
            self._stat_callout(params, seconds)
        elif template == "quote":
            self._quote(params, seconds)
        elif template == "comparisonList":
            self._comparison_list(params, seconds)
        elif template == "numberedSteps":
            self._numbered_steps(params, seconds)
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
            max_w = config.frame_width * 0.78
            lines = VGroup()
            for text in bullets[:5]:
                line = _fit_text_block(
                    f"•  {text}", self.font_body, self.body, max_w, 1.4, 40, min_size=24, align=LEFT
                )
                lines.add(line)
            lines.arrange(DOWN, aligned_edge=LEFT, buff=0.4)
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
            # Fit within the frame with margins — scales up small images too.
            max_w = config.frame_width * 0.72
            max_h = config.frame_height * 0.66
            img = _fit_image(self.image_path, max_w, max_h)
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
            center.scale_to_fit_height(2.7)
            self.add(center)
        else:
            box = RoundedRectangle(corner_radius=0.2, width=4.2, height=1.4, color=self.accent)
            box.set_fill(self.accent, opacity=0.12)
            label = _fit_text_block(
                center_text, self.font_heading, self.heading, box.width - 0.6, box.height - 0.4, 40,
                weight="BOLD", min_size=20,
            )
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
            node = _fit_text_block(text, self.font_body, self.body, 3.0, 1.0, 32, min_size=20)
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
            inner_w = box.width - 0.8
            # Budgeted so title + gap + body never exceeds the 3.2-tall box,
            # regardless of how long either string is (wraps, then shrinks).
            t = _fit_text_block(
                title or "", self.font_heading, self.accent, inner_w, 0.8, 40, weight="BOLD", min_size=22
            )
            t.move_to(box.get_top() + DOWN * (0.3 + t.height / 2))
            b = _fit_text_block(body or "", self.font_body, self.body, inner_w, 1.5, 28, min_size=16)
            b.next_to(t, DOWN, buff=0.25)
            return VGroup(box, t, b)

        left = panel(_s(params.get("leftTitle")) or "Before", _s(params.get("leftBody")), -3.6)
        right = panel(_s(params.get("rightTitle")) or "After", _s(params.get("rightBody")), 3.6)
        arrow = Arrow(start=[-1.0, 0, 0], end=[1.0, 0, 0], color=self.accent, stroke_width=6)
        arrow_label = _s(params.get("arrowLabel"))

        self.play(FadeIn(left, shift=RIGHT * 0.3), run_time=0.6)
        self.play(GrowArrow(arrow), run_time=0.5)
        if arrow_label:
            # Width-capped to the gap between the two panels — unconstrained,
            # a longer label spills sideways into both panels' body text.
            lab = _fit_text_block(arrow_label, self.font_body, self.body, 2.1, 1.0, 24, min_size=14)
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
        label_max_w = min(2.6, 11.5 / n)
        for i, ev in enumerate(events):
            x = -5.0 + (10.0 * i / (n - 1)) if n > 1 else 0.0
            dot = Dot([x, 0, 0], color=self.heading, radius=0.09)
            above = i % 2 == 0
            label_part, _, detail_part = ev.partition(":")
            head = _fit_text_block(
                label_part.strip(), self.font_heading, self.accent, label_max_w, 0.5, 28,
                weight="BOLD", min_size=18,
            )
            grp_items = [head]
            if detail_part.strip():
                det = _fit_text_block(
                    detail_part.strip(), self.font_body, self.body, label_max_w, 0.7, 22, min_size=14
                )
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

    # ── statCallout ──
    def _stat_callout(self, params: dict[str, Any], seconds: float) -> None:
        stat = _s(params.get("stat")) or "—"
        label = _s(params.get("label"))
        context = _s(params.get("context"))

        stat_mob = _fit_text_block(
            stat, self.font_heading, self.accent, config.frame_width * 0.82, 2.4, 140,
            weight="BOLD", min_size=60,
        )
        stat_mob.move_to([0, 0.4, 0])
        self.play(GrowFromCenter(stat_mob), run_time=0.9)

        anchor = stat_mob
        used = 0.9
        if label:
            label_mob = _fit_text_block(
                label, self.font_heading, self.heading, config.frame_width * 0.7, 1.0, 40,
                weight="BOLD", min_size=24,
            )
            label_mob.next_to(anchor, DOWN, buff=0.4)
            self.play(FadeIn(label_mob, shift=UP * 0.2), run_time=0.6)
            anchor = label_mob
            used += 0.6
        if context:
            ctx_mob = _fit_text_block(
                context, self.font_body, self.body, config.frame_width * 0.6, 0.9, 26, min_size=16
            )
            ctx_mob.next_to(anchor, DOWN, buff=0.35)
            self.play(FadeIn(ctx_mob), run_time=0.5)
            used += 0.5
        self.wait(max(0.3, seconds - used))

    # ── quote ──
    def _quote(self, params: dict[str, Any], seconds: float) -> None:
        quote_text = _s(params.get("quote")) or "…"
        attribution = _s(params.get("attribution"))
        has_image = bool(self.image_path)
        max_w = config.frame_width * (0.5 if has_image else 0.68)

        body = _fit_text_block(quote_text, self.font_body, self.heading, max_w, 3.0, 44, min_size=26)
        group_items = [body]
        if attribution:
            attr = Text(f"— {attribution}", font=self.font_heading, color=self.accent, weight="BOLD", font_size=28)
            attr.next_to(body, DOWN, buff=0.45)
            attr.align_to(body, RIGHT)
            group_items.append(attr)
        text_group = VGroup(*group_items)

        if has_image:
            img = _fit_image(self.image_path, 3.0, 3.6)
            img.move_to([-4.3, 0, 0])
            text_group.move_to([1.0, 0, 0])
            self.play(FadeIn(img, shift=RIGHT * 0.3), run_time=0.6)
        else:
            text_group.move_to(ORIGIN)

        mark = Text('"', font=self.font_heading, color=self.accent, weight="BOLD", font_size=160)
        mark.set_opacity(0.22)
        mark.move_to(text_group.get_top() + UP * 0.35 + LEFT * (text_group.width / 2 - 0.2))
        self.play(FadeIn(mark), run_time=0.4)
        self.play(Write(body), run_time=min(2.2, 0.5 + 0.05 * len(quote_text)))
        if attribution:
            self.play(FadeIn(group_items[1], shift=UP * 0.2), run_time=0.5)
        self.wait(max(0.3, seconds - 2.6))

    # ── comparisonList ──
    def _comparison_list(self, params: dict[str, Any], seconds: float) -> None:
        left_title = _s(params.get("leftTitle")) or "Left"
        right_title = _s(params.get("rightTitle")) or "Right"
        items = _list(params.get("items"))
        left_pts = _col_points(items, "L:")[:5]
        right_pts = _col_points(items, "R:")[:5]
        col_w = config.frame_width * 0.4

        lt = Text(left_title, font=self.font_heading, color=self.accent, weight="BOLD", font_size=40)
        rt = Text(right_title, font=self.font_heading, color=self.accent, weight="BOLD", font_size=40)
        lt.move_to([-3.6, 2.8, 0])
        rt.move_to([3.6, 2.8, 0])
        self.play(FadeIn(lt, shift=DOWN * 0.2), FadeIn(rt, shift=DOWN * 0.2), run_time=0.6)

        def column(points: list[str], x: float) -> VGroup:
            lines = VGroup(*[
                _fit_text_block(f"•  {pt}", self.font_body, self.body, col_w, 1.0, 30, min_size=20, align=LEFT)
                for pt in points
            ])
            lines.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
            lines.move_to([x, 0.3, 0])
            return lines

        left_lines = column(left_pts, -3.6)
        right_lines = column(right_pts, 3.6)
        run_time = min(4.0, 0.6 * max(len(left_lines), len(right_lines), 1) + 0.4)
        self.play(
            LaggedStart(*[FadeIn(m, shift=LEFT * 0.2) for m in left_lines], lag_ratio=0.5),
            LaggedStart(*[FadeIn(m, shift=RIGHT * 0.2) for m in right_lines], lag_ratio=0.5),
            run_time=run_time,
        )
        self.wait(max(0.3, seconds - (0.6 + run_time)))

    # ── numberedSteps ──
    def _numbered_steps(self, params: dict[str, Any], seconds: float) -> None:
        heading = _s(params.get("heading"))
        steps = _list(params.get("steps"))[:6]
        n = max(1, len(steps))
        used = 0.0

        if heading:
            head = Text(heading, font=self.font_heading, color=self.accent, weight="BOLD", font_size=46)
            head.to_edge(UP, buff=0.8)
            self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.6)
            used += 0.6

        row_h = min(1.1, 5.6 / n)
        start_y = (n - 1) * row_h / 2
        line = Line([-5.6, start_y + row_h / 2, 0], [-5.6, -start_y - row_h / 2, 0], color=self.accent, stroke_width=5)
        line_time = min(1.2, 0.2 * n + 0.3)
        self.play(Create(line), run_time=line_time)
        used += line_time

        for i, step in enumerate(steps):
            y = start_y - i * row_h
            dot = Dot([-5.6, y, 0], color=self.accent, radius=0.16)
            num = Text(str(i + 1), font=self.font_body, color=self.bg, weight="BOLD", font_size=18)
            num.move_to(dot.get_center())
            label = _fit_text_block(
                step, self.font_body, self.body, config.frame_width * 0.58, row_h * 0.85, 30,
                min_size=18, align=LEFT,
            )
            label.move_to([-4.7, y, 0], aligned_edge=LEFT)
            self.play(FadeIn(dot), FadeIn(num), FadeIn(label, shift=RIGHT * 0.2), run_time=0.5)
            used += 0.5
        self.wait(max(0.3, seconds - used))
