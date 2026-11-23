"""Detail 5 (alpine-meadows): Lush pastures, wooden Tabià hay barns, wildflowers, fences & cattle."""

from __future__ import annotations

import math


def _hay_barn(B, kit, x: float, y: float, z: float, yaw: float, scale: float = 1.0) -> None:
    """Builds a traditional Ladin / Dolomite wooden hay barn (Tabià / Kochhütte) on a dry-stone plinth."""
    w, d, h = 5.4 * scale, 4.4 * scale, 2.8 * scale
    # Sloped dry-stone foundation plinth leveling the alpine pasture
    B["stone"].box((x, y, z - 1.6), (w * 0.96, d * 0.96, 2.05), yaw)
    # Sun-darkened horizontal larch log walls slightly overhanging the stone base
    B["larch-aged"].box((x, y, z + 0.45), (w, d, h), yaw)
    # Warm larch loft door & ventilation slat band on the gable front
    B["larch-warm"].box(
        (x - math.sin(yaw) * (d * 0.51), y + math.cos(yaw) * (d * 0.51), z + 0.85),
        (1.35 * scale, 0.08, 1.85 * scale),
        yaw,
    )
    # Shallow split-larch shingle gable roof weighted with pale dolomite stones
    kit.gable(B["chalet-wood"], (x, y, z + 0.45 + h), w + 0.75 * scale, d + 0.75 * scale, 1.45 * scale, yaw)
    for along_s in (-0.32 * w, 0.0, 0.32 * w):
        sx = x + math.cos(yaw) * along_s
        sy = y + math.sin(yaw) * along_s
        B["dolomite-pale"].box((sx, sy, z + 0.45 + h + 1.15 * scale), (0.32, 0.32, 0.18), yaw)


def build_alpine_meadows(B, kit, road, height_at, rng) -> int:
    """Populates the green Dolomite pastures with Tabià hay barns, spruce & European larch groves."""
    s = road.s
    trees = 0

    # 1. Spruce & golden-green larch stands in lower valleys & mid-altitude pastures (below tree line z < 110 m)
    for i in range(8, kit.n - 8, 5):
        if s[i]["z"] > 110.0:
            continue
        for side in (1, -1):
            if rng.random() > 0.50:
                continue
            off = (kit.kerb + rng.uniform(11.0, 48.0)) * side
            tx, ty, _ = road.at(i, off)
            if road.clear_of_road(tx, ty, 13.0, i):
                kit.pine(tx, ty, height_at(tx, ty), rng.uniform(0.85, 1.38), "pine" if rng.random() < 0.68 else "foliage")
                trees += 1

    # 2. Wooden Tabià / Kochhütten hay barns dotting open alpine pastures (48 barns around the four climbs)
    for i in range(28, kit.n - 28, 34):
        if s[i]["z"] < 24.0 or s[i]["z"] > 128.0:
            continue
        side = 1 if (i // 34) % 2 == 0 else -1
        off = (kit.kerb + rng.uniform(16.0, 42.0)) * side
        bx, by, _ = road.at(i, off)
        if road.clear_of_road(bx, by, 15.0, i):
            bz = height_at(bx, by)
            _hay_barn(B, kit, bx, by, bz, s[i]["h"] + rng.uniform(-0.45, 0.45), rng.uniform(0.85, 1.18))

    return trees
