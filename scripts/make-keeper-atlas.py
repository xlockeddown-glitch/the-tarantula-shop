#!/usr/bin/env python3
"""Build a 128x128 RGBA keeper atlas: 4 dirs x 4 frames, 32px cells, feet on y=31."""
from pathlib import Path
from PIL import Image

CELL = 32
COLS = 4
ROWS = 4
# feet row in every cell
FOOT = 31

HAIR = (74, 52, 40, 255)
HAIR2 = (58, 36, 24, 255)
SKIN = (210, 168, 122, 255)
SKIN2 = (196, 148, 104, 255)
SHIRT = (122, 122, 118, 255)
SHIRT2 = (92, 92, 88, 255)
PANT = (74, 56, 40, 255)
PANT2 = (58, 42, 32, 255)
SHOE = (42, 34, 24, 255)
EYE = (42, 28, 20, 255)
MOUTH = (138, 64, 48, 255)

DIRS = ["down", "left", "right", "up"]


def put(px, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if 0 <= xx < CELL and 0 <= yy < CELL:
                px[xx, yy] = c


def draw_cell(dir_name: str, frame: int) -> Image.Image:
    im = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    px = im.load()
    step = frame % 2
    bob = 1 if frame in (1, 3) else 0
    # walk offsets: 1 = left foot forward, 3 = right foot forward
    lf = 0
    rf = 0
    if frame == 1:
        lf, rf = -1, 1
    elif frame == 3:
        lf, rf = 1, -1

    # origin: character centered, feet on FOOT
    cx = 16

    # shoes
    if dir_name in ("down", "up"):
        put(px, cx - 4 + lf, FOOT - 2, 3, 3, SHOE)
        put(px, cx + 1 + rf, FOOT - 2, 3, 3, SHOE)
    elif dir_name == "left":
        put(px, cx - 5 + lf, FOOT - 2, 5, 3, SHOE)
        put(px, cx - 1 + rf, FOOT - 2, 5, 3, SHOE)
    else:
        put(px, cx - 4 + lf, FOOT - 2, 5, 3, SHOE)
        put(px, cx + 0 + rf, FOOT - 2, 5, 3, SHOE)

    # legs / pants
    put(px, cx - 3, FOOT - 8, 6, 6, PANT)
    put(px, cx - 3, FOOT - 3, 6, 1, PANT2)
    if dir_name in ("down", "up"):
        put(px, cx - 3 + lf, FOOT - 5, 2, 3, PANT2)
        put(px, cx + 1 + rf, FOOT - 5, 2, 3, PANT2)

    # torso
    ty = FOOT - 16 + bob
    put(px, cx - 4, ty, 8, 8, SHIRT)
    put(px, cx - 4, ty, 8, 1, SHIRT2)
    put(px, cx - 3, ty + 7, 6, 1, SHIRT2)

    # arms
    if dir_name == "left":
        put(px, cx - 6, ty + 2, 2, 5, SKIN)
        put(px, cx + 4, ty + 2 + step, 2, 5, SKIN)
    elif dir_name == "right":
        put(px, cx - 6, ty + 2 + step, 2, 5, SKIN)
        put(px, cx + 4, ty + 2, 2, 5, SKIN)
    else:
        put(px, cx - 6, ty + 2 + (0 if frame != 1 else 1), 2, 5, SKIN)
        put(px, cx + 4, ty + 2 + (0 if frame != 3 else 1), 2, 5, SKIN)

    # head
    hy = FOOT - 22 + bob
    put(px, cx - 3, hy, 6, 6, SKIN)
    put(px, cx - 2, hy + 5, 4, 1, SKIN2)

    if dir_name == "down":
        put(px, cx - 4, hy - 2, 8, 4, HAIR)
        put(px, cx - 4, hy + 1, 2, 2, HAIR)
        put(px, cx + 2, hy + 1, 2, 2, HAIR)
        put(px, cx - 2, hy + 2, 1, 1, EYE)
        put(px, cx + 1, hy + 2, 1, 1, EYE)
        put(px, cx - 1, hy + 4, 2, 1, MOUTH)
    elif dir_name == "up":
        put(px, cx - 4, hy - 2, 8, 6, HAIR)
        put(px, cx - 3, hy + 3, 6, 2, HAIR2)
    elif dir_name == "left":
        put(px, cx - 4, hy - 2, 7, 5, HAIR)
        put(px, cx - 4, hy + 2, 3, 2, HAIR2)
        put(px, cx - 2, hy + 2, 1, 1, EYE)
        put(px, cx - 1, hy + 4, 1, 1, MOUTH)
    else:
        put(px, cx - 3, hy - 2, 7, 5, HAIR)
        put(px, cx + 1, hy + 2, 3, 2, HAIR2)
        put(px, cx + 1, hy + 2, 1, 1, EYE)
        put(px, cx + 0, hy + 4, 1, 1, MOUTH)

    return im


def main():
    atlas = Image.new("RGBA", (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for r, d in enumerate(DIRS):
        for c in range(COLS):
            cell = draw_cell(d, c)
            atlas.paste(cell, (c * CELL, r * CELL), cell)
    out = Path("/workspace/public/game/keeper/atlas.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(out, "PNG")
    # sanity: no opaque magenta, exact size
    assert atlas.size == (128, 128)
    mag = 0
    px = atlas.load()
    for y in range(128):
        for x in range(128):
            r, g, b, a = px[x, y]
            if a > 0 and r > 180 and b > 180 and g < 160:
                mag += 1
    print(f"wrote {out} {atlas.size} magenta={mag}")
    # also write a preview on dark wood so we can inspect
    preview = Image.new("RGBA", (128, 128), (42, 34, 24, 255))
    preview.alpha_composite(atlas)
    preview.save("/workspace/public/game/keeper/atlas-preview.png")


if __name__ == "__main__":
    main()
