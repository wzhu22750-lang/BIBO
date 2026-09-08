#!/usr/bin/env python3
"""Generate BIBU app icons from scripts/app-icon-source.png (full-bleed artwork).

The source art is a complete icon (opaque, square-ish). It is used:
  - Web / legacy Android: full-bleed, resized.
  - Android adaptive foreground: scaled down to FIT_FRACTION of the 108dp
    canvas (safe zone is 72/108 = 66.7%) and centred, so launcher masks
    never clip the artwork. The yellow ic_launcher_background shows around it.
"""

from __future__ import annotations

import base64
import io
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"
PUBLIC = ROOT / "public"
SOURCE = ROOT / "scripts" / "app-icon-source.png"

MINT = (133, 249, 207, 255)  # #85facf
TRANSPARENT = (0, 0, 0, 0)

# Adaptive icon: content must stay inside the central 66.7% safe zone.
FIT_FRACTION = 0.72

DENSITIES = {
    "mdpi": 1,
    "hdpi": 1.5,
    "xhdpi": 2,
    "xxhdpi": 3,
    "xxxhdpi": 4,
}

# Android notification small-icon density sizes (24dp base, as documented in
# the platform guidelines for a single-color status-bar/heads-up glyph).
NOTIFICATION_ICON_SIZES = {
    "mdpi": 24,
    "hdpi": 36,
    "xhdpi": 48,
    "xxhdpi": 72,
    "xxxhdpi": 96,
}


def square_crop(src: Image.Image) -> Image.Image:
    """Crop to the largest centred square."""
    w, h = src.size
    side = min(w, h)
    return src.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))


def scale(src: Image.Image, size: int) -> Image.Image:
    return src.resize((size, size), Image.Resampling.LANCZOS)


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


def squircle_icon(src: Image.Image, size: int) -> Image.Image:
    from PIL import ImageDraw
    square = scale(src, size)
    out = Image.new("RGBA", (size, size), TRANSPARENT)
    out.paste(square, (0, 0))
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    r = max(4, int(size * 0.22))
    draw.rounded_rectangle((0, 0, size, size), radius=r, fill=255)
    out.putalpha(mask)
    return out


def adaptive_foreground(src: Image.Image, size: int) -> Image.Image:
    """Full-bleed art scaled to the safe zone, centred on mint background."""
    target = round(size * FIT_FRACTION)
    canvas = Image.new("RGBA", (size, size), MINT)
    content = scale(src, target)
    canvas.paste(content, ((size - target) // 2, (size - target) // 2))
    return canvas


def notification_icon(src: Image.Image, size: int) -> Image.Image:
    """Notification icon synchronized with the launcher artwork."""
    return squircle_icon(src, size)


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"  {path.relative_to(ROOT)}  {img.size[0]}×{img.size[1]}")


def svg_with_png(src: Image.Image, px: int = 64) -> str:
    """Favicon SVG that embeds a tiny PNG of the artwork (data URI)."""
    small = scale(src, px)
    buf = io.BytesIO()
    small.save(buf, "PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n'
        f'  <image href="data:image/png;base64,{b64}" width="32" height="32"/>\n'
        "</svg>\n"
    )


def main() -> None:
    src = Image.open(SOURCE).convert("RGBA")
    full = square_crop(src)  # opaque, full-bleed artwork

    print("Web")
    save(scale(full, 1024), PUBLIC / "app-icon.png")
    save(scale(full, 180), PUBLIC / "apple-touch-icon.png")
    save(scale(full, 512), PUBLIC / "app-icon-512.png")
    (PUBLIC / "favicon.svg").write_text(svg_with_png(full), encoding="utf-8")
    print("  public/favicon.svg")

    print("Android notification icon (synchronized with launcher art)")
    stale = RES / "drawable" / "ic_stat_bibo.xml"
    if stale.exists():
        stale.unlink()
        print(f"  removed {stale.relative_to(ROOT)}")
    for name, size in NOTIFICATION_ICON_SIZES.items():
        save(notification_icon(full, size), RES / f"drawable-{name}" / "ic_stat_bibo.png")

    print("Android legacy + adaptive PNG")
    for name, factor in DENSITIES.items():
        folder = RES / f"mipmap-{name}"
        launcher = int(48 * factor)
        foreground = int(108 * factor)
        save(squircle_icon(full, launcher), folder / "ic_launcher.png")
        save(round_icon(full, launcher), folder / "ic_launcher_round.png")
        save(adaptive_foreground(full, foreground), folder / "ic_launcher_foreground.png")

    playstore = ROOT / "android" / "app" / "src" / "main" / "ic_launcher-playstore.png"
    save(scale(full, 512), playstore)

    (RES / "values" / "ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#85FACF</color>\n'
        '</resources>\n',
        encoding="utf-8",
    )
    # Values background colour + vector-backed drawable background for
    # adaptive icons (only rewritten when present).
    bg_drawable = RES / "drawable" / "ic_launcher_background.xml"
    if bg_drawable.exists():
        bg_drawable.write_text(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
            '    android:width="108dp"\n'
            '    android:height="108dp"\n'
            '    android:viewportWidth="108"\n'
            '    android:viewportHeight="108">\n'
            '    <path\n'
            '        android:fillColor="#85FACF"\n'
            '        android:pathData="M0,0h108v108h-108z" />\n'
            '</vector>\n',
            encoding="utf-8",
        )
        print("  android/app/src/main/res/drawable/ic_launcher_background.xml")

    # The vector heart foreground is no longer used; adaptive icons now point
    # at the regenerated @mipmap/ic_launcher_foreground bitmaps.
    for fg_xml in (RES / "drawable" / "ic_launcher_foreground.xml", RES / "drawable-v24" / "ic_launcher_foreground.xml"):
        if fg_xml.exists():
            fg_xml.unlink()
            print(f"  removed {fg_xml.relative_to(ROOT)}")

    for adaptive in (
        RES / "mipmap-anydpi-v26" / "ic_launcher.xml",
        RES / "mipmap-anydpi-v26" / "ic_launcher_round.xml",
    ):
        adaptive.write_text(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
            "</adaptive-icon>\n",
            encoding="utf-8",
        )
        print(f"  {adaptive.relative_to(ROOT)}")


if __name__ == "__main__":
    main()