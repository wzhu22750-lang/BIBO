#!/usr/bin/env python3
"""Generate BIBU app icons from a 32×32 pixel map."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"
PUBLIC = ROOT / "public"

YELLOW = (255, 242, 56, 255)  # #fff238
INK = (32, 33, 29, 255)  # #20211d
PAPER = (255, 254, 247, 255)  # #fffef7
PINK = (255, 166, 232, 255)  # #ffa6e8
TRANSPARENT = (0, 0, 0, 0)

COLORS = {
    ".": YELLOW,
    " ": TRANSPARENT,
    "K": INK,
    "W": PAPER,
    "P": PINK,
}

# 32×32. Heart sits in the Android adaptive safe zone (~18% inset).
# . yellow  K ink  W paper highlight  P ping spark
PIXELS = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "........................PP......",
    "........................PP......",
    "................................",
    ".......KKWWKK......KKKKKK.......",
    "......KKWWKKKK....KKKKKKKK......",
    "......KKKKKKKKK..KKKKKKKKK......",
    "......KKKKKKKKKKKKKKKKKKKK......",
    "......KKKKKKKKKKKKKKKKKKKK......",
    ".......KKKKKKKKKKKKKKKKKK.......",
    "........KKKKKKKKKKKKKKKK........",
    ".........KKKKKKKKKKKKKK.........",
    "..........KKKKKKKKKKKK..........",
    "...........KKKKKKKKKK...........",
    "............KKKKKKKK............",
    ".............KKKKKK.............",
    "..............KKKK..............",
    "...............KK...............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]

DENSITIES = {
    "mdpi": 1,
    "hdpi": 1.5,
    "xhdpi": 2,
    "xxhdpi": 3,
    "xxxhdpi": 4,
}


def assert_map() -> None:
    assert len(PIXELS) == 32, len(PIXELS)
    for i, row in enumerate(PIXELS):
        assert len(row) == 32, f"row {i} len {len(row)}"
        assert set(row) <= set(COLORS), f"row {i} bad chars {set(row) - set(COLORS)}"


def paint(transparent: bool) -> Image.Image:
    img = Image.new("RGBA", (32, 32), TRANSPARENT if transparent else YELLOW)
    px = img.load()
    for y, row in enumerate(PIXELS):
        for x, ch in enumerate(row):
            if ch == ".":
                if not transparent:
                    px[x, y] = YELLOW
                continue
            px[x, y] = COLORS[ch]
    return img


def scale(src: Image.Image, size: int) -> Image.Image:
    return src.resize((size, size), Image.Resampling.NEAREST)


def circle_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    m = mask.load()
    r = (size - 1) / 2
    cx = cy = r
    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            d = math.hypot(dx, dy)
            if d <= r - 0.5:
                m[x, y] = 255
            elif d <= r + 0.5:
                m[x, y] = int(255 * (r + 0.5 - d))
    return mask


def round_icon(src: Image.Image, size: int) -> Image.Image:
    square = scale(src, size)
    out = Image.new("RGBA", (size, size), TRANSPARENT)
    out.paste(square, (0, 0))
    out.putalpha(circle_mask(size))
    return out


def svg_from_map(transparent: bool = False) -> str:
    rects: list[str] = []
    if not transparent:
        rects.append('<rect width="32" height="32" fill="#fff238"/>')
    for y, row in enumerate(PIXELS):
        x = 0
        while x < 32:
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            w = 1
            while x + w < 32 and row[x + w] == ch:
                w += 1
            hex_color = {
                "K": "#20211d",
                "W": "#fffef7",
                "P": "#ffa6e8",
            }[ch]
            rects.append(f'<rect x="{x}" y="{y}" width="{w}" height="1" fill="{hex_color}"/>')
            x += w
    body = "".join(rects)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" '
        'shape-rendering="crispEdges">'
        f"{body}</svg>\n"
    )


def vector_drawable() -> str:
    """Adaptive foreground: same 32-grid in a 32-unit viewport, 108dp box."""
    paths: dict[str, list[str]] = {"K": [], "W": [], "P": []}
    for y, row in enumerate(PIXELS):
        x = 0
        while x < 32:
            ch = row[x]
            if ch in " .":
                x += 1
                continue
            w = 1
            while x + w < 32 and row[x + w] == ch:
                w += 1
            paths[ch].append(f"M{x},{y}h{w}v1h-{w}z")
            x += w
    fills = {"K": "#20211D", "W": "#FFFEF7", "P": "#FFA6E8"}
    path_xml = []
    for ch in ("K", "W", "P"):
        if not paths[ch]:
            continue
        path_xml.append(
            f'    <path android:fillColor="{fills[ch]}" android:pathData="{"".join(paths[ch])}"/>'
        )
    return f"""<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="32"
    android:viewportHeight="32">
{chr(10).join(path_xml)}
</vector>
"""


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"  {path.relative_to(ROOT)}  {img.size[0]}×{img.size[1]}")


def main() -> None:
    assert_map()
    full = paint(transparent=False)
    fg = paint(transparent=True)

    print("Web")
    save(scale(full, 1024), PUBLIC / "app-icon.png")
    save(scale(full, 180), PUBLIC / "apple-touch-icon.png")
    save(scale(full, 512), PUBLIC / "app-icon-512.png")
    (PUBLIC / "favicon.svg").write_text(svg_from_map(), encoding="utf-8")
    print("  public/favicon.svg")

    print("Android legacy + adaptive PNG")
    for name, factor in DENSITIES.items():
        folder = RES / f"mipmap-{name}"
        launcher = int(48 * factor)
        foreground = int(108 * factor)
        save(scale(full, launcher), folder / "ic_launcher.png")
        save(round_icon(full, launcher), folder / "ic_launcher_round.png")
        save(scale(fg, foreground), folder / "ic_launcher_foreground.png")

    playstore = ROOT / "android" / "app" / "src" / "main" / "ic_launcher-playstore.png"
    save(scale(full, 512), playstore)

    fg_xml = RES / "drawable" / "ic_launcher_foreground.xml"
    fg_xml.write_text(vector_drawable(), encoding="utf-8")
    print(f"  {fg_xml.relative_to(ROOT)}")

    bg = RES / "values" / "ic_launcher_background.xml"
    bg.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        "    <color name=\"ic_launcher_background\">#FFF238</color>\n"
        "</resources>\n",
        encoding="utf-8",
    )
    print(f"  {bg.relative_to(ROOT)}")

    for adaptive in (
        RES / "mipmap-anydpi-v26" / "ic_launcher.xml",
        RES / "mipmap-anydpi-v26" / "ic_launcher_round.xml",
    ):
        adaptive.write_text(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
            "</adaptive-icon>\n",
            encoding="utf-8",
        )
        print(f"  {adaptive.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
