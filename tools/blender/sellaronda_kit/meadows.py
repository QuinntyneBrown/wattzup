"""Detail 5 (alpine-meadows): Lush pastures, wooden Tabià hay barns, wildflowers, fences & cattle."""

from __future__ import annotations

import math


def _hay_barn(B, kit, x: float, y: float, z: float, yaw: float, scale: float = 1.0) -> None:
    """Builds a traditional Ladin / Dolomite wooden hay barn (Tabià / Kochhütte) on a dry-stone plinth."""
    w, d, h = 5.4 * scale, 4.4 * scale, 2.8 * scale
    # Sloped dry-stone foundation plinth leveling the alpine pasture
    B["stone"].box((x, y, z - 1.6), (w * 0.96, d * 0.96, 2.05), yaw)
    # Sun-darkened horizontal larch log walls + wooden hay ladder hung under the side eave
    B["larch-aged"].box((x, y, z + 0.45), (w, d, h), yaw)
    B["larch-warm"].box((x + math.cos(yaw) * (w * 0.51), y + math.sin(yaw) * (w * 0.51), z + 1.55 * scale), (0.08, d * 0.78, 0.36 * scale), yaw)
    # Inclined timber hay-loft entry ramp (ponte da tabià) leading to the upper hay door
    B["larch-warm"].box(
        (x - math.sin(yaw) * (d * 0.5 + 1.35 * scale), y + math.cos(yaw) * (d * 0.5 + 1.35 * scale), z - 0.35),
        (1.55 * scale, 2.6 * scale, 1.15 * scale),
        yaw,
    )
    # Warm larch loft door & ventilation slat band on the gable front
    B["larch-warm"].box(
        (x - math.sin(yaw) * (d * 0.51), y + math.cos(yaw) * (d * 0.51), z + 0.85),
        (1.35 * scale, 0.08, 1.85 * scale),
        yaw,
    )
    # Shallow split-larch shingle gable roof weighted with pale dolomite stones
    kit.gable(B["chalet-wood"], (x, y, z + 0.45 + h), w + 0.75 * scale, d + 0.75 * scale, 1.45 * scale, yaw)
    B["larch-aged"].box((x - math.sin(yaw) * (d * 0.56), y + math.cos(yaw) * (d * 0.56), z + 0.35 + h + 1.15 * scale), (0.16, 0.95 * scale, 0.16), yaw)
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
            if (i // 34) % 4 == 0:
                B["larch-warm"].box((hx, hy + 1.1, hz), (1.35, 0.38, 0.46), barn_yaw)

    # 3. Alpine wildflower drifts (buttercup gold, magenta clover/alpenrose, oxeye white & gentian blue)
    flower_mats = ("yellow", "geranium-red", "paint", "ladin-blue", "crowd-4")
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
        mid_f = (i0 + i1) // 2
        stx, sty, _ = road.at(mid_f, (kit.kerb + 5.8) * side)
        if road.clear_of_road(stx, sty, kit.kerb + 4.5, mid_f):
            B["larch-warm"].box((stx, sty, height_at(stx, sty)), (0.65, 1.45, 1.15), s[mid_f]["h"])
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
        B["larch-warm"].box((cx_h - 2.4, cy_h + 1.6, height_at(cx_h - 2.4, cy_h + 1.6)), (0.95, 0.45, 0.95), s[h_idx]["h"])
        kit.gable(B["larch-aged"], (cx_h - 2.4, cy_h + 1.6, height_at(cx_h - 2.4, cy_h + 1.6) + 0.95), 1.25, 0.72, 0.34, s[h_idx]["h"])
        B["lago-turquoise"].box((cx_h, cy_h, tz_h + 0.42), (2.3, 0.46, 0.14), s[h_idx]["h"])
        B["larch-aged"].box((cx_h - math.cos(s[h_idx]["h"]) * 1.15, cy_h - math.sin(s[h_idx]["h"]) * 1.15, tz_h), (0.24, 0.24, 1.35), s[h_idx]["h"])
        for cg_i in range(4):
            B["paint"].box((cx_h + math.cos(cg_i * 1.6) * 1.9, cy_h + math.sin(cg_i * 1.6) * 1.2, tz_h + 0.02), (0.24, 0.24, 0.34), cg_i * 0.4)
        for cow_k in range(4):
            ang = cow_k * 1.65 + herd_m * 0.01
            kx = cx_h + math.cos(ang) * (4.2 + cow_k * 2.1)
            ky = cy_h + math.sin(ang) * (4.2 + cow_k * 2.1)
            kz = height_at(kx, ky)
            cyaw = ang + 0.8
            B["larch-warm"].box((kx, ky, kz + 0.45), (1.75, 0.68, 0.78), cyaw)
            B["paint"].box((kx, ky, kz + 0.52), (0.68, 0.72, 0.68), cyaw)
            B["paint"].box((kx + math.cos(cyaw) * 0.98, ky + math.sin(cyaw) * 0.98, kz + 0.72), (0.48, 0.44, 0.46), cyaw)
            B["gold"].box((kx + math.cos(cyaw) * 0.76, ky + math.sin(cyaw) * 0.76, kz + 0.42), (0.16, 0.16, 0.18), cyaw)
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
        B["larch-warm"].box((wx + math.cos(wyaw) * 1.45, wy + math.sin(wyaw) * 1.45, wz - 0.05), (1.55, 0.46, 0.48), wyaw)

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
        B["stone"].box((cx_t + math.cos(cyaw) * 2.4, cy_t + math.sin(cyaw) * 2.4, cz_t - 0.04), (1.85, 0.95, 0.14), cyaw)

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
                    B["larch-warm"].box((gx_t - math.sin(tyaw) * 2.35, gy_t + math.cos(tyaw) * 2.35, gz_t), (0.85, 0.65, 0.42), tyaw)
                    for mc_o in (-0.20, 0.20):
                        B["steel"].box((gx_t - math.sin(tyaw) * 2.35 + math.cos(tyaw) * mc_o, gy_t + math.cos(tyaw) * 2.35 + math.sin(tyaw) * mc_o, gz_t + 0.42), (0.30, 0.30, 0.58), tyaw)
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
            B["chalet-wood"].box((bx_a + math.cos(byaw) * 1.56, by_a + math.sin(byaw) * 1.56, bz_a + 0.1), (0.08, 0.78, 1.55), byaw)
            for hv_k in range(4):
                hx_c = bx_a + math.cos(byaw) * (-1.05 + hv_k * 0.7) - math.sin(byaw) * (-0.92 * bh_side)
                hy_c = by_a + math.sin(byaw) * (-1.05 + hv_k * 0.7) + math.cos(byaw) * (-0.92 * bh_side)
                B[hive_cols[hv_k]].box((hx_c, hy_c, bz_a + 0.65), (0.52, 0.08, 0.48), byaw)

    # 13. Blooming alpine rose (Rhododendron ferrugineum) shrubs at the rocky timberline (95..128 m)
    for rh_i in range(18, kit.n - 18, 13):
        if not (95.0 <= s[rh_i]["z"] <= 128.0):
            continue
        side = 1.0 if rh_i % 2 == 0 else -1.0
        rx_a, ry_a, _ = road.at(rh_i, (kit.kerb + 7.2) * side)
        if road.clear_of_road(rx_a, ry_a, kit.kerb + 4.5, rh_i):
            rz_a = height_at(rx_a, ry_a)
            B["foliage"].box((rx_a, ry_a, rz_a - 0.1), (1.15, 0.95, 0.48), rh_i * 0.5)
            B["bougainvillea"].box((rx_a, ry_a, rz_a + 0.32), (0.92, 0.78, 0.22), rh_i * 0.5)

    # 14. Traditional conical Tyrolean haystacks (Heumandln) stacked on wooden stakes in mown pastures
    for hm_m, hm_s in ((1080.0, -1.0), (1420.0, 1.0), (6510.0, -1.0), (10580.0, -1.0)):
        hm_idx = road.index(hm_m)
        hmx, hmy, _ = road.at(hm_idx, (kit.kerb + 14.0) * hm_s)
        if road.clear_of_road(hmx, hmy, 12.0, hm_idx):
            for st_i in range(4):
                sx_h = hmx + math.cos(st_i * 1.7) * (3.2 + st_i * 1.6)
                sy_h = hmy + math.sin(st_i * 1.7) * (3.2 + st_i * 1.6)
                sz_h = height_at(sx_h, sy_h)
                B["larch-aged"].box((sx_h, sy_h, sz_h), (0.12, 0.12, 1.95), 0.0)
                B["hay"].box((sx_h, sy_h, sz_h + 0.15), (1.15, 1.15, 1.45), st_i * 0.5)
                kit.gable(B["hay"], (sx_h, sy_h, sz_h + 1.60), 1.25, 1.25, 0.55, st_i * 0.5)

    # 15. Low dry-stone pasture boundary walls (muretti a secco) dividing high grazing alms
    for mw_m, mw_s in ((1880.0, -1.0), (7380.0, -1.0), (10340.0, 1.0)):
        m_idx = road.index(mw_m)
        myaw = s[m_idx]["h"] + 1.05 * mw_s
        for seg_m in range(4):
            wx_m, wy_m, _ = road.at(m_idx, (kit.kerb + 7.5 + seg_m * 4.6) * mw_s)
            if road.clear_of_road(wx_m, wy_m, kit.kerb + 5.0, m_idx):
                wz_m = height_at(wx_m, wy_m)
                B["stone"].box((wx_m, wy_m, wz_m - 0.25), (4.8, 0.62, 0.92), myaw)

    # 16. Split-larch hiker plank footbridges spanning alpine meadow meltwater rills
    for fb_m, fb_s in ((1995.0, 1.0), (4875.0, -1.0), (7675.0, 1.0), (10075.0, -1.0)):
        f_idx = road.index(fb_m)
        fyaw = s[f_idx]["h"] + 0.35
        fx_b, fy_b, _ = road.at(f_idx, (kit.kerb + 8.5) * fb_s)
        fz_b = height_at(fx_b, fy_b)
        B["lago-turquoise"].box((fx_b, fy_b, fz_b - 0.12), (1.4, 4.8, 0.16), fyaw)
        B["larch-warm"].box((fx_b, fy_b, fz_b + 0.08), (3.4, 1.15, 0.14), fyaw)
        B["larch-aged"].box((fx_b - math.sin(fyaw) * 0.52, fy_b + math.cos(fyaw) * 0.52, fz_b + 0.22), (3.4, 0.08, 0.88), fyaw)

    # 17. Flocks of woolly white Tiroler Bergschafe mountain sheep on high-altitude pastures
    for sh_m, sh_s in ((4680.0, 1.0), (7520.0, 1.0), (9980.0, -1.0)):
        sh_idx = road.index(sh_m)
        shx, shy, _ = road.at(sh_idx, (kit.kerb + 14.5) * sh_s)
        if road.clear_of_road(shx, shy, 12.0, sh_idx):
            for s_k in range(5):
                ang = s_k * 1.35 + 0.2
                px_s = shx + math.cos(ang) * (2.4 + s_k * 1.4)
                py_s = shy + math.sin(ang) * (2.4 + s_k * 1.4)
                pz_s = height_at(px_s, py_s)
                B["paint"].box((px_s, py_s, pz_s + 0.18), (0.92, 0.48, 0.46), ang)
                B["dark"].box((px_s + math.cos(ang) * 0.48, py_s + math.sin(ang) * 0.48, pz_s + 0.36), (0.28, 0.24, 0.26), ang)

    # 18. Weathered larch stumps & fallen woodland logs along the lower forest margins
    for lg_i in range(20, kit.n - 20, 55):
        if s[lg_i]["z"] > 95.0:
            continue
        side = 1.0 if (lg_i // 55) % 2 == 0 else -1.0
        lx_f, ly_f, _ = road.at(lg_i, (kit.kerb + 10.5) * side)
        if road.clear_of_road(lx_f, ly_f, kit.kerb + 7.5, lg_i):
            lz_f = height_at(lx_f, ly_f)
            B["larch-warm"].box((lx_f, ly_f, lz_f - 0.08), (0.48, 0.48, 0.55), 0.2)
            B["larch-aged"].box((lx_f + 1.6, ly_f - 0.6, lz_f - 0.05), (3.4, 0.38, 0.36), lg_i * 0.4)

    # 19. Silver-white Stella Alpina / Edelweiss clusters on high rocky limestone turf (> 118 m)
    for ed_i in range(25, kit.n - 25, 19):
        if s[ed_i]["z"] < 118.0:
            continue
        side = -1.0 if ed_i % 2 == 0 else 1.0
        ex_w, ey_w, _ = road.at(ed_i, (kit.kerb + 4.4) * side)
        if road.clear_of_road(ex_w, ey_w, kit.kerb + 2.8, ed_i):
            ez_w = height_at(ex_w, ey_w)
            B["dolomite-pale"].box((ex_w, ey_w, ez_w - 0.1), (0.75, 0.62, 0.34), ed_i * 0.3)
            B["paint"].box((ex_w, ey_w, ez_w + 0.24), (0.32, 0.32, 0.14), ed_i * 0.7)

    # Traditional Ladin pole-centered summer hayricks (covoni) in sunny mown pastures
    for hr_m, hr_s in ((820.0, 1.0), (2690.0, -1.0), (5680.0, 1.0), (10780.0, -1.0)):
        hr_i = road.index(hr_m)
        for rk_o in (0.0, 5.5):
            hx_r, hy_r, _ = road.at(hr_i, (kit.kerb + 14.5 + rk_o) * hr_s)
            if road.clear_of_road(hx_r, hy_r, 10.0, hr_i):
                hz_r = height_at(hx_r, hy_r)
                B["hay"].box((hx_r, hy_r, hz_r - 0.1), (1.85, 1.85, 1.95), rk_o)
                B["larch-aged"].box((hx_r, hy_r, hz_r + 1.85), (0.14, 0.14, 0.65), 0.0)

    # Upright lookout alpine marmots (Marmota marmota) on sunny Pordoi & Sella boulders
    for mm_m, mm_s in ((4740.0, 1.0), (7410.0, 1.0), (7890.0, 1.0), (10090.0, -1.0)):
        m_idx = road.index(mm_m)
        mx_m, my_m, _ = road.at(m_idx, (kit.kerb + 6.2) * mm_s)
        if road.clear_of_road(mx_m, my_m, kit.kerb + 4.0, m_idx):
            mz_m = height_at(mx_m, my_m)
            B["dolomite-pale"].box((mx_m, my_m, mz_m - 0.2), (1.35, 1.05, 0.68), mm_m * 0.1)
            B["larch-warm"].box((mx_m, my_m, mz_m + 0.48), (0.22, 0.20, 0.44), s[m_idx]["h"])

    # Stone-lined alpine spring capture wellheads with shingle hoods
    for spw_m in (1520.0, 3960.0, 6890.0, 9460.0):
        sp_i = road.index(spw_m)
        spx, spy, _ = road.at(sp_i, kit.kerb + 9.5)
        if road.clear_of_road(spx, spy, 7.0, sp_i):
            spz = height_at(spx, spy)
            B["stone"].box((spx, spy, spz - 0.2), (1.35, 1.35, 0.95), s[sp_i]["h"])
            kit.gable(B["larch-aged"], (spx, spy, spz + 0.75), 1.65, 1.65, 0.48, s[sp_i]["h"])

    # Agile Alpine chamois (Rupicapra rupicapra) poised on high rocky turf above Pordoi & Gardena
    for ch_m, ch_s in ((4680.0, 1.0), (5110.0, 1.0), (10020.0, -1.0)):
        c_idx = road.index(ch_m)
        for ch_k in (0, 1):
            cx_g, cy_g, _ = road.at(c_idx, (kit.kerb + 12.0 + ch_k * 2.8) * ch_s)
            if road.clear_of_road(cx_g, cy_g, 9.0, c_idx):
                cz_g = height_at(cx_g, cy_g)
                B["chalet-wood"].box((cx_g, cy_g, cz_g + 0.45), (1.05, 0.34, 0.48), s[c_idx]["h"] + 0.5)
                B["dark"].box((cx_g, cy_g, cz_g), (0.85, 0.28, 0.45), s[c_idx]["h"] + 0.5)

    # High-altitude Swiss stone pine (Pinus cembra / Cirmolo) sentinels along the 106..118 m tree line
    for pc_i in range(20, kit.n - 20, 29):
        if not (106.0 <= s[pc_i]["z"] <= 118.0):
            continue
        px_c, py_c, _ = road.at(pc_i, (kit.kerb + 16.5) * (1.0 if pc_i % 2 == 0 else -1.0))
        if road.clear_of_road(px_c, py_c, 12.0, pc_i):
            kit.pine(px_c, py_c, height_at(px_c, py_c), 1.05, "pine")
            trees += 1

    # Clustered white alpine haylage bales beside lower valley farm lanes
    for bl_m, bl_s in ((940.0, 1.0), (3580.0, 1.0)):
        bl_i = road.index(bl_m)
        for bk in range(3):
            bx_s, by_s, _ = road.at(bl_i, (kit.kerb + 18.0 + bk * 1.65) * bl_s)
            if road.clear_of_road(bx_s, by_s, 12.0, bl_i):
                B["paint"].box((bx_s, by_s, height_at(bx_s, by_s)), (1.28, 1.28, 1.22), bk * 0.4)

    # Low-slung red Alpine slope hay tractors (Reform Metrac style) parked beside mown meadows
    for trk_m, trk_s in ((1080.0, 1.0), (10660.0, 1.0)):
        tk_i = road.index(trk_m)
        tky = s[tk_i]["h"] + 0.6
        tkx, tky_p, _ = road.at(tk_i, (kit.kerb + 16.0) * trk_s)
        if road.clear_of_road(tkx, tky_p, 11.0, tk_i):
            tkz = height_at(tkx, tky_p)
            B["dark"].box((tkx, tky_p, tkz), (2.8, 1.75, 0.55), tky)
            B["parasol-red"].box((tkx, tky_p, tkz + 0.55), (2.4, 1.45, 1.15), tky)
            B["yellow"].box((tkx + math.cos(tky) * 1.55, tky_p + math.sin(tky) * 1.55, tkz + 0.08), (0.55, 2.15, 0.35), tky)

    # Conical dry-stone Dolomite trail cairns (Stoanmandln) on high pasture knolls
    for crn_m in (2020.0, 4880.0, 7680.0, 10080.0):
        ci = road.index(crn_m)
        cx_s, cy_s, _ = road.at(ci, kit.kerb + 8.5)
        if road.clear_of_road(cx_s, cy_s, 6.0, ci):
            cz_s = height_at(cx_s, cy_s)
            B["dolomite-pale"].box((cx_s, cy_s, cz_s - 0.1), (0.85, 0.85, 0.55), 0.2)
            B["dolomite-pale"].box((cx_s, cy_s, cz_s + 0.45), (0.52, 0.52, 0.48), 0.7)
            B["dolomite-pale"].box((cx_s, cy_s, cz_s + 0.93), (0.26, 0.26, 0.38), 1.1)

    # Golden Trollius europaeus (globeflower / botton d'oro) clusters beside moist valley streams
    for gl_m in (250.0, 3105.0, 6100.0, 8910.0):
        gi = road.index(gl_m)
        for gs in (-1.0, 1.0):
            gx_f, gy_f, _ = road.at(gi, (kit.kerb + 8.5) * gs)
            if road.clear_of_road(gx_f, gy_f, 6.0, gi):
                B["gold"].box((gx_f, gy_f, height_at(gx_f, gy_f)), (0.95, 0.95, 0.24), gl_m * 0.1)

    # Pale gravel climbers' footpath weaving into the Città dei Sassi boulders off Passo Sella
    for cs_t in range(4):
        csi = road.index(7515.0 + cs_t * 6.0)
        csx_t, csy_t, _ = road.at(csi, kit.kerb + 5.0 + cs_t * 4.5)
        if road.clear_of_road(csx_t, csy_t, 4.0, csi):
            B["gravel"].box((csx_t, csy_t, height_at(csx_t, csy_t) + 0.02), (4.8, 1.15, 0.06), s[csi]["h"] + 1.1)

    # Roofed larch alpine deer hay-and-salt mangers (Wildfütterung) at the spruce forest margin
    for fk_m in (760.0, 3520.0, 6480.0):
        fki = road.index(fk_m)
        fkx, fky, _ = road.at(fki, -(kit.kerb + 19.0))
        if road.clear_of_road(fkx, fky, 12.0, fki):
            fkz = height_at(fkx, fky)
            B["larch-aged"].box((fkx, fky, fkz), (1.85, 1.15, 1.45), s[fki]["h"])
            kit.gable(B["chalet-wood"], (fkx, fky, fkz + 1.45), 2.35, 1.65, 0.65, s[fki]["h"])

    # Grazing white Tyrolean Bergschaf mountain sheep on the sunny Campolongo alm (at=1995 m)
    sh_i = road.index(1995.0)
    shx0, shy0, _ = road.at(sh_i, kit.kerb + 17.5)
    if road.clear_of_road(shx0, shy0, 12.0, sh_i):
        for sk in range(5):
            sx_s = shx0 + math.cos(sk * 1.3) * (2.5 + sk * 1.4)
            sy_s = shy0 + math.sin(sk * 1.3) * (2.5 + sk * 1.4)
            sz_s = height_at(sx_s, sy_s)
            B["paint"].box((sx_s, sy_s, sz_s + 0.22), (0.92, 0.44, 0.46), sk * 0.8)

    # Seasoned forestry spruce log stacks beside the pasture farm tracks
    for lg_m, lg_s in ((1192.0, 1.0), (6692.0, 1.0), (10632.0, 1.0)):
        lgi = road.index(lg_m)
        lgx, lgy, _ = road.at(lgi, (kit.kerb + 9.5) * lg_s)
        if road.clear_of_road(lgx, lgy, 7.0, lgi):
            B["larch-warm"].box((lgx, lgy, height_at(lgx, lgy)), (3.2, 1.25, 1.18), s[lgi]["h"])

    # Stone-and-larch high pasture dairy Malga huts on Pordoi & Sella alms
    for mg_m, mg_s in ((4360.0, 1.0), (6980.0, 1.0)):
        mgi = road.index(mg_m)
        mgx, mgy, _ = road.at(mgi, (kit.kerb + 24.0) * mg_s)
        if road.clear_of_road(mgx, mgy, 15.0, mgi):
            mgz = height_at(mgx, mgy)
            B["stone"].box((mgx, mgy, mgz - 1.2), (6.8, 5.2, 2.4), s[mgi]["h"])
            B["larch-warm"].box((mgx, mgy, mgz + 1.2), (7.0, 5.4, 2.0), s[mgi]["h"])
            kit.gable(B["chalet-wood"], (mgx, mgy, mgz + 3.2), 7.6, 6.0, 1.45, s[mgi]["h"])

    # Blue-violet Alpine harebell (Campanula scheuchzeri) clusters on mid-climb verges
    for hb_i in range(30, kit.n - 30, 38):
        if not (65.0 <= s[hb_i]["z"] <= 115.0):
            continue
        hbx, hby, _ = road.at(hb_i, kit.kerb + 4.8)
        if road.clear_of_road(hbx, hby, 3.2, hb_i):
            B["ladin-blue"].box((hbx, hby, height_at(hbx, hby) - 0.04), (0.62, 0.62, 0.20), hb_i * 0.4)

    return trees
