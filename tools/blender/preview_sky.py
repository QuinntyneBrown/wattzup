"""Draws a map's painted sky to a PNG without Blender, to tune it: the view towards the sun, and the view away.

    python tools/blender/preview_sky.py out.png
"""
import math
import sys

from PIL import Image

import sky

# As the rider sees it: the picture is 89 degrees wide and its sky ends some 15 degrees over the horizon.
W, H, FOV = 640, 150, math.radians(89)


def view(az: float, look: float, pitch: float = 0.0) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    haze = sky.srgb(0xE58A5C)
    f = (W / 2) / math.tan(FOV / 2)
    for y in range(H):
        for x in range(W):
            cx, cy, cz = (x - W / 2) / f, 1.0, (H * 0.82 - y) / f
            n = math.sqrt(cx * cx + cy * cy + cz * cz)
            cx, cy, cz = cx / n, cy / n, cz / n
            cy, cz = cy * math.cos(pitch) - cz * math.sin(pitch), cy * math.sin(pitch) + cz * math.cos(pitch)
            dx = cy * math.cos(look) + cx * math.sin(look)
            dy = cy * math.sin(look) - cx * math.cos(look)
            c = sky.sunset_sky_colour(dx, dy, max(cz, -0.05), az, haze)
            px[x, y] = tuple(int(255 * (v ** (1 / 2.2))) for v in c[:3])
    return img


out = Image.new("RGB", (W * 2, H * 2))
for i, turn in enumerate((0.0, 0.6, math.pi / 2, math.pi)):
    out.paste(view(0.0, turn), ((i % 2) * W, (i // 2) * H))
out.save(sys.argv[1])
