#!/usr/bin/env python3
"""8 customer bodies, 32px, RGBA, feet on y=31. Layout 4x2 = 128x64."""
from pathlib import Path
from PIL import Image

CELL = 32
FOOT = 31

LOOKS = [
    # hair, shirt, pant, skin, accent
    ((58, 36, 24, 255), (164, 72, 48, 255), (42, 34, 28, 255), (210, 168, 122, 255), (196, 92, 62, 255)),
    ((90, 70, 48, 255), (72, 92, 64, 255), (48, 42, 36, 255), (196, 148, 104, 255), (120, 140, 88, 255)),
    ((42, 28, 20, 255), (200, 188, 168, 255), (74, 56, 40, 255), (224, 184, 140, 255), (138, 64, 48, 255)),
    ((160, 96, 48, 255), (90, 48, 36, 255), (42, 32, 24, 255), (210, 168, 122, 255), (200, 120, 64, 255)),  # fox-ish
    ((32, 28, 36, 255), (56, 72, 104, 255), (36, 36, 44, 255), (196, 148, 104, 255), (80, 100, 140, 255)),
    ((74, 52, 40, 255), (180, 164, 120, 255), (74, 56, 40, 255), (210, 168, 122, 255), (122, 90, 56, 255)),
    ((24, 20, 18, 255), (48, 44, 40, 255), (32, 28, 24, 255), (180, 132, 96, 255), (90, 70, 48, 255)),
    ((90, 48, 36, 255), (120, 88, 72, 255), (52, 40, 32, 255), (224, 184, 140, 255), (164, 72, 48, 255)),
]


def put(px, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if 0 <= xx < CELL and 0 <= yy < CELL:
                px[xx, yy] = c


def draw_look(look) -> Image.Image:
    hair, shirt, pant, skin, accent = look
    im = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    px = im.load()
    cx = 16
    put(px, cx - 4, FOOT - 2, 3, 3, (42, 34, 24, 255))
    put(px, cx + 1, FOOT - 2, 3, 3, (42, 34, 24, 255))
    put(px, cx - 3, FOOT - 8, 6, 6, pant)
    put(px, cx - 4, FOOT - 16, 8, 8, shirt)
    put(px, cx - 4, FOOT - 16, 8, 1, accent)
    put(px, cx - 6, FOOT - 14, 2, 5, skin)
    put(px, cx + 4, FOOT - 14, 2, 5, skin)
    put(px, cx - 3, FOOT - 22, 6, 6, skin)
    put(px, cx - 4, FOOT - 24, 8, 4, hair)
    put(px, cx - 4, FOOT - 21, 2, 2, hair)
    put(px, cx + 2, FOOT - 21, 2, 2, hair)
    put(px, cx - 2, FOOT - 20, 1, 1, (42, 28, 20, 255))
    put(px, cx + 1, FOOT - 20, 1, 1, (42, 28, 20, 255))
    put(px, cx - 1, FOOT - 18, 2, 1, accent)
    return im


def main():
    atlas = Image.new("RGBA", (128, 64), (0, 0, 0, 0))
    for i, look in enumerate(LOOKS):
        cell = draw_look(look)
        atlas.paste(cell, ((i % 4) * CELL, (i // 4) * CELL), cell)
    out = Path("/workspace/public/game/customers/atlas.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(out, "PNG")
    print(f"wrote {out} {atlas.size}")


if __name__ == "__main__":
    main()
