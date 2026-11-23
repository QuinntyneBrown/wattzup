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
            barn_yaw = s[i]["h"] + rng.uniform(-0.45, 0.45)
            _hay_barn(B, kit, bx, by, bz, barn_yaw, rng.uniform(0.85, 1.18))
            # Adjacent Tyrolean Harpfe vertical hay-drying rack & winter firewood stack
            hx = bx + math.cos(barn_yaw) * 5.2
            hy = by + math.sin(barn_yaw) * 5.2
            hz = height_at(hx, hy)
            for post_off in (-2.0, 2.0):
                B["larch-aged"].box((hx + math.cos(barn_yaw) * post_off, hy + math.sin(barn_yaw) * post_off, hz - 0.3), (0.22, 0.22, 3.6), barn_yaw)
            B["hay"].box((hx, hy, hz + 0.55), (3.85, 0.36, 2.25), barn_yaw)
            kit.gable(B["larch-aged"], (hx, hy, hz + 3.15), 4.6, 1.25, 0.55, barn_yaw)

    # 3. Alpine wildflower drifts (buttercup gold, magenta clover/alpenrose, oxeye white & gentian blue)
    flower_mats = ("yellow", "geranium-red", "paint", "ladin-blue")
    for i in range(12, kit.n - 12, 7):
        if s[i]["z"] > 132.0:
            continue
        for side in (1, -1):
            if rng.random() > 0.56:
                continue
            fmat = flower_mats[(i + (1 if side > 0 else 2)) % len(flower_mats)]
            base_off = (kit.kerb + rng.uniform(3.2, 19.0)) * side
            cx_f, cy_f, _ = road.at(i, base_off)
            if not road.clear_of_road(cx_f, cy_f, kit.kerb + 2.4, i):
                continue
            for _ in range(4):
                fx = cx_f + rng.uniform(-2.6, 2.6)
                fy = cy_f + rng.uniform(-2.6, 2.6)
                fz = height_at(fx, fy)
                B[fmat].box((fx, fy, fz - 0.05), (0.38, 0.38, 0.24), rng.uniform(0.0, math.pi))

    # 4. Traditional Ladin split-larch pasture fences (Stangenzaun) bordering mid-elevation meadows
    for fence_start, fence_end, side in ((980.0, 1340.0, 1.0), (6420.0, 6740.0, 1.0), (9120.0, 9440.0, -1.0), (10520.0, 10840.0, 1.0)):
        i0, i1 = road.index(fence_start), road.index(fence_end)
        for idx in range(i0, i1, 2):
            fx, fy, _ = road.at(idx, (kit.kerb + 5.8) * side)
            if not road.clear_of_road(fx, fy, kit.kerb + 4.5, idx):
                continue
            fz = height_at(fx, fy)
            yaw = s[idx]["h"]
            B["larch-aged"].box((fx, fy, fz - 0.15), (0.14, 0.14, 1.25), yaw)
            B["larch-warm"].box((fx + math.cos(yaw) * 4.0, fy + math.sin(yaw) * 4.0, fz + 0.78), (8.2, 0.08, 0.10), yaw)
            B["larch-warm"].box((fx + math.cos(yaw) * 4.0, fy + math.sin(yaw) * 4.0, fz + 0.42), (8.2, 0.08, 0.10), yaw)

    # 5. Grazing brown-and-white Simmental cattle & hollowed larch-trunk water troughs in sunny pastures
    for herd_m, side in ((680.0, 1.0), (1620.0, -1.0), (3480.0, -1.0), (6560.0, 1.0), (9260.0, 1.0), (10960.0, -1.0)):
        h_idx = road.index(herd_m)
        cx_h, cy_h, _ = road.at(h_idx, (kit.kerb + 16.0) * side)
        if not road.clear_of_road(cx_h, cy_h, 14.0, h_idx):
            continue
        # Hollowed larch Brunnentrog spring trough + standpipe
        tz_h = height_at(cx_h, cy_h)
        B["larch-aged"].box((cx_h, cy_h, tz_h - 0.1), (2.6, 0.68, 0.62), s[h_idx]["h"])
        B["lago-turquoise"].box((cx_h, cy_h, tz_h + 0.42), (2.3, 0.46, 0.14), s[h_idx]["h"])
        for cow_k in range(4):
            ang = cow_k * 1.65 + herd_m * 0.01
            kx = cx_h + math.cos(ang) * (4.2 + cow_k * 2.1)
            ky = cy_h + math.sin(ang) * (4.2 + cow_k * 2.1)
            kz = height_at(kx, ky)
            cyaw = ang + 0.8
            B["larch-warm"].box((kx, ky, kz + 0.45), (1.75, 0.68, 0.78), cyaw)
            B["paint"].box((kx, ky, kz + 0.52), (0.68, 0.72, 0.68), cyaw)
            B["paint"].box((kx + math.cos(cyaw) * 0.98, ky + math.sin(cyaw) * 0.98, kz + 0.72), (0.48, 0.44, 0.46), cyaw)
            for lx_o in (-0.58, 0.58):
                B["larch-aged"].box((kx + math.cos(cyaw) * lx_o, ky + math.sin(cyaw) * lx_o, kz - 0.05), (0.18, 0.52, 0.55), cyaw)

    # 6. Traditional Ladin / Tyrolean carved timber wayside crucifixes (Wegkreuze) with shingle hoods
    for wk_m, wk_side in ((1140.0, -1.0), (2620.0, 1.0), (5460.0, -1.0), (6940.0, 1.0), (9320.0, -1.0), (10880.0, 1.0)):
        w_idx = road.index(wk_m)
        wyaw = s[w_idx]["h"]
        wx, wy, _ = road.at(w_idx, (kit.kerb + 3.2) * wk_side)
        wz = height_at(wx, wy)
        B["stone"].box((wx, wy, wz - 0.25), (0.95, 0.95, 0.45), wyaw)
        B["larch-aged"].box((wx, wy, wz + 0.20), (0.16, 0.16, 2.95), wyaw)
        B["larch-aged"].box((wx, wy, wz + 2.15), (0.14, 1.25, 0.16), wyaw)
        kit.gable(B["chalet-wood"], (wx, wy, wz + 2.75), 0.55, 1.45, 0.42, wyaw)
        B["geranium-red"].box((wx, wy, wz + 0.22), (0.42, 0.42, 0.24), wyaw)

    return trees
