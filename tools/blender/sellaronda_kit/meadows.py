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
                tree_mat = "hay" if (s[i]["z"] > 82.0 and rng.random() < 0.24) else ("pine" if rng.random() < 0.68 else "foliage")
                kit.pine(tx, ty, height_at(tx, ty), rng.uniform(0.85, 1.38), tree_mat)
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

    # 7. High-altitude dwarf mugo pine (Pinus mugo / baranci) cushions above the tall-spruce tree line
    for i in range(14, kit.n - 14, 6):
        if s[i]["z"] < 104.0:
            continue
        for side in (-1.0, 1.0):
            if rng.random() > 0.48:
                continue
            mx, my, _ = road.at(i, (kit.kerb + rng.uniform(5.5, 28.0)) * side)
            if road.clear_of_road(mx, my, kit.kerb + 3.5, i):
                mz = height_at(mx, my)
                rad_m = rng.uniform(1.1, 2.3)
                B["pine"].box((mx, my, mz - 0.15), (rad_m, rad_m * 0.85, rng.uniform(0.55, 1.05)), rng.uniform(0.0, math.pi))

    # 8. CAI / AVS red-white-red alpine hiking trail fingerposts & waymarked boulders at footpath crossings
    for cai_m, cai_side in ((1960.0, 1.0), (4840.0, -1.0), (5080.0, 1.0), (7640.0, 1.0), (10040.0, -1.0), (10260.0, 1.0)):
        c_idx = road.index(cai_m)
        cyaw = s[c_idx]["h"] + 0.45 * cai_side
        cx_t, cy_t, _ = road.at(c_idx, (kit.kerb + 2.8) * cai_side)
        cz_t = height_at(cx_t, cy_t)
        B["larch-warm"].box((cx_t, cy_t, cz_t - 0.1), (0.12, 0.12, 2.35), cyaw)
        for arm_z, arm_ang in ((2.05, 0.3), (1.72, -0.5)):
            B["parasol-red"].box((cx_t, cy_t, cz_t + arm_z), (0.95, 0.06, 0.20), cyaw + arm_ang)
            B["paint"].box((cx_t, cy_t, cz_t + arm_z + 0.01), (0.58, 0.07, 0.18), cyaw + arm_ang)
        B["dolomite-pale"].box((cx_t + 1.2, cy_t - 0.8, cz_t - 0.2), (0.95, 0.78, 0.65), cyaw)

    # 9. Gravel twin-track farm lanes leading off the road into the pastures
    for tr_m, tr_side in ((1180.0, 1.0), (3680.0, 1.0), (6680.0, 1.0), (9180.0, -1.0), (10620.0, 1.0)):
        t_idx = road.index(tr_m)
        tyaw = s[t_idx]["h"] + 1.15 * tr_side
        for seg_t in range(4):
            dist_t = kit.kerb + 3.0 + seg_t * 5.2
            gx_t, gy_t, _ = road.at(t_idx, dist_t * tr_side)
            if road.clear_of_road(gx_t, gy_t, kit.kerb + 1.8, t_idx):
                gz_t = height_at(gx_t, gy_t)
                for rut in (-0.85, 0.85):
                    B["gravel"].box((gx_t - math.sin(tyaw) * rut, gy_t + math.cos(tyaw) * rut, gz_t + 0.02), (5.4, 0.55, 0.06), tyaw)
                if seg_t == 0:
                    for gp_lat in (-1.6, 1.6):
                        B["larch-aged"].box((gx_t - math.sin(tyaw) * gp_lat, gy_t + math.cos(tyaw) * gp_lat, gz_t - 0.1), (0.18, 0.18, 1.35), tyaw)
                    B["larch-warm"].box((gx_t - math.sin(tyaw) * 1.6 + math.cos(tyaw - 0.5) * 1.4, gy_t + math.cos(tyaw) * 1.6 + math.sin(tyaw - 0.5) * 1.4, gz_t + 0.35), (2.8, 0.08, 0.72), tyaw - 0.5)

    # 10. Native South Tyrolean Haflinger horses (chestnut coats with flaxen cream manes & tails)
    for hf_m, hf_side in ((1290.0, 1.0), (9210.0, -1.0), (10710.0, 1.0)):
        hf_idx = road.index(hf_m)
        hx0, hy0, _ = road.at(hf_idx, (kit.kerb + 15.0) * hf_side)
        if road.clear_of_road(hx0, hy0, 13.0, hf_idx):
            for h_k in range(3):
                ang = h_k * 2.05 + 0.4
                px_h = hx0 + math.cos(ang) * (3.6 + h_k * 2.2)
                py_h = hy0 + math.sin(ang) * (3.6 + h_k * 2.2)
                pz_h = height_at(px_h, py_h)
                B["larch-warm"].box((px_h, py_h, pz_h + 0.58), (1.68, 0.54, 0.66), ang)
                B["hay"].box((px_h + math.cos(ang) * 0.72, py_h + math.sin(ang) * 0.72, pz_h + 1.02), (0.58, 0.22, 0.48), ang)
                B["hay"].box((px_h - math.cos(ang) * 0.92, py_h - math.sin(ang) * 0.92, pz_h + 0.55), (0.22, 0.18, 0.58), ang)
                for lx_h in (-0.54, 0.54):
                    B["larch-warm"].box((px_h + math.cos(ang) * lx_h, py_h + math.sin(ang) * lx_h, pz_h), (0.16, 0.44, 0.62), ang)

    # 11. Moss-capped limestone glacial erratics nestled in meadow clearings
    for er_i in range(24, kit.n - 24, 42):
        side = -1.0 if (er_i // 42) % 2 == 0 else 1.0
        ex, ey, _ = road.at(er_i, (kit.kerb + 12.5) * side)
        if road.clear_of_road(ex, ey, kit.kerb + 8.0, er_i):
            ez = height_at(ex, ey)
            B["dolomite-pale"].box((ex, ey, ez - 0.4), (2.2, 1.7, 1.45), er_i * 0.37)
            B["foliage"].box((ex, ey, ez + 0.98), (1.75, 1.35, 0.18), er_i * 0.37)

    # 12. Traditional Tyrolean wooden bee-houses (Bienenhäuser) with colourfully painted hive rows
    hive_cols = ("yellow", "ladin-blue", "parasol-red", "foliage")
    for bh_m, bh_side in ((890.0, 1.0), (2780.0, -1.0), (5740.0, 1.0), (11080.0, -1.0)):
        b_idx = road.index(bh_m)
        byaw = s[b_idx]["h"]
        bx_a, by_a, _ = road.at(b_idx, (kit.kerb + 11.0) * bh_side)
        if road.clear_of_road(bx_a, by_a, 10.0, b_idx):
            bz_a = height_at(bx_a, by_a)
            B["larch-warm"].box((bx_a, by_a, bz_a - 0.3), (3.1, 1.8, 2.15), byaw)
            kit.gable(B["larch-aged"], (bx_a, by_a, bz_a + 1.85), 3.5, 2.2, 0.68, byaw)
            for hv_k in range(4):
                hx_c = bx_a + math.cos(byaw) * (-1.05 + hv_k * 0.7) - math.sin(byaw) * (-0.92 * bh_side)
                hy_c = by_a + math.sin(byaw) * (-1.05 + hv_k * 0.7) + math.cos(byaw) * (-0.92 * bh_side)
                B[hive_cols[hv_k]].box((hx_c, hy_c, bz_a + 0.65), (0.52, 0.08, 0.48), byaw)

    return trees
