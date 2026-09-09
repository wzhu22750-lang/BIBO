#!/usr/bin/env python3
"""Parse pixel-art path data from characters.ts / wardrobeAssets.tsx, rasterize,
and emit geometry measurements used to build CharacterVisualProfiles."""
import json
import re
import sys
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw

SRC = "src/lib/pet"


def parse_paths(text):
    """Yield (fill, d) pairs in order of appearance."""
    pat = re.compile(r"fill:\s*'([^']+)'\s*,\s*d:\s*'([^']+)'", re.S)
    return pat.findall(text)


def split_blocks(text, header_re):
    """Split file text into (name, chunk) blocks by header regex."""
    heads = [(m.group(1), m.start()) for m in re.finditer(header_re, text)]
    blocks = []
    for i, (name, start) in enumerate(heads):
        end = heads[i + 1][1] if i + 1 < len(heads) else len(text)
        blocks.append((name, text[start:end]))
    return blocks


def parse_d(d):
    """Parse axis-aligned pixel path into list of polygons (each a point list).
    Supports M m H h V v Z z."""
    tokens = re.findall(r"[MmHhVvZz]|-?\d+(?:\.\d+)?", d)
    polys = []
    pts = []
    x = y = 0.0
    sx = sy = 0.0  # subpath start
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t in "Mm":
            nx, ny = float(tokens[i + 1]), float(tokens[i + 2])
            i += 3
            if pts:
                polys.append(pts)
            if t == "M":
                x, y = nx, ny
            else:
                x, y = x + nx, y + ny
            sx, sy = x, y
            pts = [(x, y)]
        elif t in "Hh":
            nx = float(tokens[i + 1])
            i += 2
            x = nx if t == "H" else x + nx
            pts.append((x, y))
        elif t in "Vv":
            ny = float(tokens[i + 1])
            i += 2
            y = ny if t == "V" else y + ny
            pts.append((x, y))
        elif t in "Zz":
            i += 1
            if pts:
                polys.append(pts)
                pts = []
            x, y = sx, sy
        else:
            i += 1
    if pts:
        polys.append(pts)
    return polys


def rasterize(fills, w, h, ox=0, oy=0):
    """fills: list of (color, d). Returns dict color->mask plus union mask."""
    layers = defaultdict(list)
    union = Image.new("L", (w, h), 0)
    ud = ImageDraw.Draw(union)
    for color, d in fills:
        img = Image.new("L", (w, h), 0)
        dr = ImageDraw.Draw(img)
        for poly in parse_d(d):
            pp = [(px + ox, py + oy) for px, py in poly]
            if len(pp) >= 3:
                dr.polygon(pp, fill=255)
        layers[color].append(np.array(img) > 0)
        ud.polygon  # noqa
        union = np.logical_or(np.array(union) > 0, np.array(img) > 0)
        union = Image.fromarray((union * 255).astype(np.uint8))
    masks = {c: np.logical_or.reduce(ms) for c, ms in layers.items()}
    return masks, np.array(union) > 0


def bbox(mask):
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]


def analyze_character(name, fills):
    masks, union = rasterize(fills, 80, 88)
    out = {"id": name}
    out["union_bbox"] = bbox(union)
    # row spans of union
    rows = {}
    for y in range(88):
        xs = np.where(union[y])[0]
        if len(xs):
            rows[y] = [int(xs.min()), int(xs.max()), int(xs.max() - xs.min() + 1)]
    out["rows"] = rows
    # interior black blobs (eyes / nose / mouth): black pixels not touching union border region
    black = masks.get("#171917")
    if black is not None:
        # black pixels fully surrounded by colored (non-black union) pixels => facial features
        colored = union & ~black
        # label colored components
        interior = []
        from scipy import ndimage as ndi  # type: ignore

        lab, n = ndi.label(colored)
        for i in range(1, n + 1):
            comp = lab == i
            bb = bbox(comp)
            if not bb:
                continue
            # color region enclosed by black? check ring around comp within 1px is black
            y0, y1 = max(bb[1] - 1, 0), min(bb[3] + 1, 87)
            x0, x1 = max(bb[0] - 1, 0), min(bb[2] + 1, 79)
            ring = union[y0 : y1 + 1, x0 : x1 + 1] & ~comp[y0 : y1 + 1, x0 : x1 + 1]
            if ring.size and black[y0 : y1 + 1, x0 : x1 + 1][ring].all():
                interior.append(
                    {"bbox": bb, "fill": color_of(masks, comp), "px": int(comp.sum())}
                )
        out["interior_features"] = interior
    return out


def color_of(masks, comp):
    for c, m in masks.items():
        if c == "#171917":
            continue
        if np.logical_and(m, comp).sum() > comp.sum() * 0.5:
            return c
    return "?"


def analyze_asset(name, fills):
    # assets centered near origin; use 96x96 canvas offset by 48,40 (allow tall hats up to y=-30)
    masks, union = rasterize(fills, 96, 104, ox=48, oy=44)
    bb = bbox(union)
    if not bb:
        return {"id": name, "bbox": None}
    return {
        "id": name,
        # convert back to asset-local coords
        "bbox": [bb[0] - 48, bb[1] - 44, bb[2] - 48, bb[3] - 44],
        "w": bb[2] - bb[0] + 1,
        "h": bb[3] - bb[1] + 1,
    }


def main():
    chars = open(f"{SRC}/characters.ts").read()
    assets = open(f"{SRC}/wardrobeAssets.tsx").read()

    result = {"characters": {}, "assets": {}}
    for name, chunk in split_blocks(chars, r"id:\s*'(\w+)'"):
        fills = parse_paths(chunk)
        if fills:
            result["characters"][name] = analyze_character(name, fills)
    for name, chunk in split_blocks(assets, r"(asset_\w+):\s*\(\)"):
        fills = parse_paths(chunk)
        if fills:
            result["assets"][name] = analyze_asset(name, fills)

    json.dump(result, open("scripts/qa/measurements.json", "w"), indent=1)

    # human summary
    for cid, c in result["characters"].items():
        rows = c["rows"]
        ys = sorted(rows)
        widths = [(y, rows[y][2], rows[y][0], rows[y][1]) for y in ys]
        # find neck: min width between y=20 and y=60
        torso = [w for w in widths if 30 <= w[0] <= 64]
        neck = min(torso, key=lambda w: w[1]) if torso else None
        feats = c.get("interior_features", [])
        eyes = [f for f in feats if f["fill"] == "#171917" and f["px"] <= 80]
        print(f"== {cid}: bbox={c['union_bbox']} topY={ys[0]} bottomY={ys[-1]}")
        # ear zone: rows above first 'wide' row

        if neck:
            print(f"   neck: y={neck[0]} width={neck[1]} span={neck[2]}..{neck[3]}")
        if eyes:
            print(f"   dark-features: {[e['bbox'] for e in eyes]}")
    print("\n== assets ==")
    for aid, a in result["assets"].items():
        print(f"{aid}: bbox={a.get('bbox')} {a.get('w')}x{a.get('h')}")


if __name__ == "__main__":
    main()
