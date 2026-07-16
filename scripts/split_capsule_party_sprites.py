"""Split the generated Capsule Party 4x4 atlas into trimmed Phaser-ready PNGs."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


SPRITE_NAMES = (
    "space-coin-art",
    "space-raid-art",
    "space-capsule-art",
    "space-shop-art",
    "space-trap-art",
    "space-challenge-art",
    "space-warp-art",
    "grand-cap-art",
    "item-magnet",
    "item-golden-spinner",
    "item-warp-ticket",
    "item-shield",
    "item-turbo-capsule",
    "item-swap-capsule",
    "coin-gold-art",
    "coin-fake-art",
)


def split_atlas(source: Path, output_dir: Path, size: int) -> None:
    atlas = Image.open(source).convert("RGBA")
    output_dir.mkdir(parents=True, exist_ok=True)

    for index, name in enumerate(SPRITE_NAMES):
        row, column = divmod(index, 4)
        left = round(column * atlas.width / 4)
        right = round((column + 1) * atlas.width / 4)
        top = round(row * atlas.height / 4)
        bottom = round((row + 1) * atlas.height / 4)
        sprite = atlas.crop((left, top, right, bottom))

        alpha_box = sprite.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"Atlas cell {index} ({name}) contains no visible pixels")
        sprite = sprite.crop(alpha_box)

        side = max(sprite.width, sprite.height)
        padding = max(8, round(side * 0.08))
        square = Image.new("RGBA", (side + padding * 2, side + padding * 2))
        square.alpha_composite(
            sprite,
            ((square.width - sprite.width) // 2, (square.height - sprite.height) // 2),
        )
        square = square.resize((size, size), Image.Resampling.LANCZOS)
        square.save(output_dir / f"{name}.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--size", type=int, default=128)
    args = parser.parse_args()
    split_atlas(args.source, args.output_dir, args.size)


if __name__ == "__main__":
    main()

