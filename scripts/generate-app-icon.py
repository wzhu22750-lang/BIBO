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

# 启动屏：深海军蓝底 + 中心像素点，对齐 Web 层 SplashScreen 动画的首帧
SPLASH_NAVY = (10, 16, 32, 255)  # #0a1020
SPLASH_DOT = (234, 244, 255, 255)
SPLASH_SIZES = {
    "port": {
        "mdpi": (320, 480),
        "hdpi": (480, 800),
        "xhdpi": (720, 1280),
        "xxhdpi": (960, 1600),
        "xxxhdpi": (1280, 1920),
    },
    "land": {
        "mdpi": (480, 320),
        "hdpi": (800, 480),
        "xhdpi": (1280, 720),
        "xxhdpi": (1600, 960),
        "xxxhdpi": (1920, 1280),
    },
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
    """Monochrome Android notification small icon (white heart on transparent).

    Android renders notification small icons as a single tint (usually white)
    silhouette: only the alpha channel survives, colour is stripped. A full-
    colour artwork would collapse into a shapeless white blob, so we use the
    brand heart glyph (~2/3 of the canvas, per the 24dp status-bar/heads-up
    guideline) on a transparent background.
    """
    glyph = _raster_brand_heart()
    target = round(size * 0.68)
    glyph = glyph.resize((target, target), Image.NEAREST)
    out = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    out.paste(glyph, ((size - target) // 2, (size - target) // 2), glyph)
    return out


def splash_image(w: int, h: int) -> Image.Image:
    """Navy launch background with a centred pixel dot.

    Matches the first frame of the in-app SplashScreen animation so the native
    launch screen transitions into the web animation without a colour flash.
    """
    from PIL import ImageDraw

    canvas = Image.new("RGBA", (w, h), SPLASH_NAVY)
    dot = max(8, int(min(w, h) * 0.033))
    glow = dot * 7
    cx, cy = w // 2, h // 2
    # 柔和径向光晕（与 Web 端 SplashScreen 的 radial-gradient 一致）
    gradient = Image.radial_gradient("L").resize((glow, glow))
    glow_img = Image.new("RGBA", (glow, glow), (4, 188, 240, 0))
    glow_img.putalpha(gradient.point(lambda v: int((255 - v) * 0.38)))
    canvas.alpha_composite(glow_img, (cx - glow // 2, cy - glow // 2))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle(
        (cx - dot // 2, cy - dot // 2, cx + dot // 2 - 1, cy + dot // 2 - 1),
        fill=SPLASH_DOT,
    )
    return canvas


def _raster_brand_heart(grid: int = 24) -> Image.Image:
    """Rasterize the in-app pixel heart path (24x24) into a white image.

    The path only uses M/h/v/H/V/z commands, so a scanline even-odd fill
    over the vertical edges gives a crisp pixel heart.
    """
    path = "M4 3h5v2h2v2h2V5h2V3h5v2h2v8h-2v2h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-2H2V5h2z"
    import re

    tokens = re.findall(r"[MhvVHz]|-?\d+", path)

    def parse() -> list[tuple[float, float, float]]:
        """Return vertical segments as (x, min_y, max_y)."""
        vert: list[tuple[float, float, float]] = []
        x = y = 0.0
        i = 0
        pen = (None, None)

        def num() -> float:
            nonlocal i
            value = float(tokens[i])
            i += 1
            return value

        while i < len(tokens):
            cmd = tokens[i]
            i += 1
            start = (x, y)
            if cmd == "M":
                x, y = num(), num()
                pen = (x, y)
                start = pen
            elif cmd == "h":
                x += num()
            elif cmd == "v":
                y += num()
            elif cmd == "H":
                x = num()
            elif cmd == "V":
                y = num()
            elif cmd == "z":
                x, y = pen
                start = pen
            if x == start[0]:
                vert.append((x, min(y, start[1]), max(y, start[1])))
        return vert

    vert = parse()
    img = Image.new("RGBA", (grid, grid), (255, 255, 255, 0))
    pixels = img.load()
    for cy in range(grid):
        crossings = sorted(
            x
            for x, lo, hi in vert
            if lo <= cy + 0.5 < hi
        )
        for cx in range(grid):
            # Even-odd: inside when a filled run contains the pixel centre.
            inside = False
            for k in range(0, len(crossings) - 1, 2):
                if crossings[k] <= cx + 0.5 < crossings[k + 1]:
                    inside = True
                    break
            if inside:
                pixels[cx, cy] = (255, 255, 255, 255)
    return img


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

    print("Android notification small icon (white heart glyph, monochrome)")
    stale = RES / "drawable" / "ic_stat_bibo.xml"
    if stale.exists():
        stale.unlink()
        print(f"  removed {stale.relative_to(ROOT)}")
    for name, size in NOTIFICATION_ICON_SIZES.items():
        save(notification_icon(full, size), RES / f"drawable-{name}" / "ic_stat_bibo.png")

    print("Android launch splash (navy, matches web splash first frame)")
    for orientation, sizes in SPLASH_SIZES.items():
        for name, (w, h) in sizes.items():
            save(splash_image(w, h), RES / f"drawable-{orientation}-{name}" / "splash.png")
    save(splash_image(480, 320), RES / "drawable" / "splash.png")

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