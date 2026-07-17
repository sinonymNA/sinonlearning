"""Split transparent Capsule Party UI sheets into tightly cropped game assets."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "capsule" / "party" / "source"
OUTPUT = ROOT / "public" / "assets" / "capsule" / "party" / "presentation"


def tight_crop(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("Asset cell contains no visible pixels")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def split_grid(source_name: str, columns: int, rows: int, names: list[str]) -> None:
    source = Image.open(SOURCE / source_name).convert("RGBA")
    if len(names) != columns * rows:
        raise ValueError("The number of output names must match the grid")

    cell_width = source.width // columns
    cell_height = source.height // rows
    for index, name in enumerate(names):
        column = index % columns
        row = index // columns
        left = column * cell_width
        top = row * cell_height
        right = source.width if column == columns - 1 else (column + 1) * cell_width
        bottom = source.height if row == rows - 1 else (row + 1) * cell_height
        asset = tight_crop(source.crop((left, top, right, bottom)))
        asset.save(OUTPUT / f"{name}.png", optimize=True)
        print(f"{name}: {asset.width}x{asset.height}")


def split_regions(source_name: str, regions: list[tuple[str, tuple[int, int, int, int]]]) -> None:
    source = Image.open(SOURCE / source_name).convert("RGBA")
    for name, bounds in regions:
        asset = tight_crop(source.crop(bounds))
        asset.save(OUTPUT / f"{name}.png", optimize=True)
        print(f"{name}: {asset.width}x{asset.height}")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)

    logo = tight_crop(Image.open(SOURCE / "capsule-party-logo-alpha.png").convert("RGBA"), 20)
    logo.save(OUTPUT / "capsule-party-logo.png", optimize=True)

    # The presentation objects intentionally have different silhouettes and
    # widths, so use explicit isolation regions instead of equal grid cells.
    split_regions(
        "presentation-kit-alpha.png",
        [
            ("banner-ribbon", (10, 120, 610, 500)),
            ("panel-briefing", (610, 100, 1090, 520)),
            ("plaque-reward", (1090, 160, 1536, 500)),
            ("button-primary", (10, 560, 585, 900)),
            ("button-secondary", (585, 560, 1090, 900)),
            ("hud-player", (1090, 560, 1536, 900)),
        ],
    )
    split_regions(
        "reward-icons-alpha.png",
        [
            ("reward-coin-stack", (40, 0, 380, 345)),
            ("reward-coin", (395, 0, 755, 350)),
            ("reward-capsule", (780, 0, 1110, 350)),
            ("reward-grand-cap", (1110, 0, 1536, 350)),
            ("reward-trap", (40, 340, 380, 690)),
            ("reward-shield", (400, 340, 750, 690)),
            ("reward-turbo", (770, 340, 1110, 690)),
            ("reward-warp", (1110, 340, 1536, 690)),
            ("reward-magnet", (40, 680, 380, 1024)),
            ("reward-raid", (400, 680, 750, 1024)),
            ("reward-correct", (770, 680, 1110, 1024)),
            ("reward-incorrect", (1110, 680, 1536, 1024)),
        ],
    )


if __name__ == "__main__":
    main()

