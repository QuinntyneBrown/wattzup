"""Detail 7 (rifugi-hotels): Stone-and-timber Dolomite rifugi & pass hotels with terraces & flags."""

from __future__ import annotations

import math

from . import PASSES


def _rifugio_complex(B, kit, road, height_at, at_m: float, side: float, main_w: float, main_d: float, storeys: int) -> None:
    idx = road.index(at_m)
    yaw = road.s[idx]["h"] + (0.0 if side < 0 else math.pi)
    off = (kit.kerb + 13.5) * side
    rx, ry, _ = road.at(idx, off)
    rz = height_at(rx, ry)
    road_z = road.s[idx]["z"]
    base_z = max(rz, road_z - 0.8)

    # Rough Dolomite rubble-stone ground storey + deep foundation
    B["stone"].box((rx, ry, base_z - 3.6), (main_w, main_d, 6.8), yaw)
    # Crisp Tyrolean whitewashed plaster upper storeys (mapped into Walls group for procedural plaster detail!)
    upper_h = 3.1 * storeys
    B["chalet-plaster"].box((rx, ry, base_z + 3.2), (main_w + 0.3, main_d + 0.3, upper_h), yaw)
    # Top timber gable attic + steep slate roof + masonry chimney
    B["larch-aged"].box((rx, ry, base_z + 3.2 + upper_h - 0.6), (main_w + 0.4, main_d + 0.4, 0.7), yaw)
    kit.gable(B["roof-slate"], (rx, ry, base_z + 3.2 + upper_h), main_w + 1.4, main_d + 1.4, 3.4, yaw)
    B["stone"].box(
        (rx + math.cos(yaw) * (main_w * 0.28), ry + math.sin(yaw) * (main_w * 0.28), base_z + 3.2 + upper_h + 1.2),
        (0.95, 0.95, 2.8),
        yaw,
    )

    # Dressed Dolomite corner quoin pilasters + traditional painted Tyrolean wall sundial (meridiana)
    for c_sign_x in (-1.0, 1.0):
        for c_sign_y in (-1.0, 1.0):
            qx = rx + math.cos(yaw) * (c_sign_x * main_w * 0.5) - math.sin(yaw) * (c_sign_y * main_d * 0.5)
            qy = ry + math.sin(yaw) * (c_sign_x * main_w * 0.5) + math.cos(yaw) * (c_sign_y * main_d * 0.5)
            B["dolomite-pale"].box((qx, qy, base_z + 3.2), (0.55, 0.55, upper_h), yaw)
    sx_d = rx - math.sin(yaw) * -(main_d * 0.5 + 0.18) + math.cos(yaw) * (main_w * 0.34)
    sy_d = ry + math.cos(yaw) * -(main_d * 0.5 + 0.18) + math.sin(yaw) * (main_w * 0.34)
    B["paint"].box((sx_d, sy_d, base_z + 3.2 + upper_h - 1.55), (1.15, 0.08, 1.15), yaw)
    B["gold"].box((sx_d, sy_d, base_z + 3.2 + upper_h - 1.15), (0.55, 0.10, 0.55), yaw)

    # Wraparound dark-larch balconies facing the road + overflowing red geranium flowerboxes!
    nx, ny = -math.sin(yaw), math.cos(yaw)
    front_dist = main_d * 0.5 + 0.55
    for st_i in range(storeys):
        bz = base_z + 3.35 + st_i * 3.1
        bx = rx - nx * front_dist
        by = ry - ny * front_dist
        B["larch-aged"].box((bx, by, bz), (main_w - 0.6, 1.15, 0.22), yaw)
        B["larch-warm"].box((bx - nx * 0.48, by - ny * 0.48, bz + 0.22), (main_w - 0.6, 0.14, 0.92), yaw)
        # Red pelargonium geranium window/balcony boxes
        for g_idx in range(4):
            along_g = (-0.36 + g_idx * 0.24) * main_w
            gx = bx - nx * 0.56 + math.cos(yaw) * along_g
            gy = by - ny * 0.56 + math.sin(yaw) * along_g
            B["foliage"].box((gx, gy, bz + 0.88), (1.35, 0.28, 0.26), yaw)
            B["geranium-red"].box((gx, gy, bz + 1.08), (1.28, 0.32, 0.24), yaw)

    # Warm mullioned chalet windows along the road-facing facade
    for st_i in range(storeys):
        wz_rel = (base_z - road_z) + 4.05 + st_i * 3.1
        for w_i in range(4):
            along_w = (-0.34 + w_i * 0.23) * main_w
            kit.window(idx, along_w * (-1.0 if side > 0 else 1.0), off - side * (main_d * 0.5 + 0.18), wz_rel, 1.25, 1.55, (w_i + st_i) % 2 == 0, yaw)


def build_rifugi_and_hotels(B, kit, road, height_at) -> None:
    """Builds historic stone-and-timber rifugi and pass hotels across Campolongo, Pordoi, Sella & Gardena."""
    rifugi_sites = (
        (2085.0, -1.0, 16.5, 10.2, 2),  # Passo Campolongo — Hotel Boè
        (2135.0,  1.0, 13.5,  9.0, 2),  # Passo Campolongo — Rifugio Monte Cherz annex
        (4925.0, -1.0, 19.0, 11.4, 3),  # Passo Pordoi — Hotel Savoia
        (4980.0,  1.0, 16.0, 10.0, 2),  # Passo Pordoi — Hotel Col di Lana / Pordoi
        (7725.0, -1.0, 18.5, 11.0, 3),  # Passo Sella — Passo Sella Dolomiti Mountain Resort
        (7785.0,  1.0, 15.0,  9.6, 2),  # Passo Sella — Rifugio Maria Flora
        (10130.0, -1.0, 17.5, 10.5, 2), # Passo Gardena — Rifugio Frara
        (10185.0,  1.0, 14.5,  9.4, 2), # Passo Gardena — Rifugio Cir
        (1460.0,  -1.0, 13.0,  8.6, 2), # Campolongo flank — Rifugio Plan Boè
        (7120.0,   1.0, 14.5,  9.2, 2), # Sella climb — Rifugio Salei / Lupo Bianco
        (9420.0,   1.0, 15.0,  9.6, 2), # Gardena climb — Plan de Gralba / Chalet Gerard
        (10420.0,  1.0, 12.8,  8.4, 2), # Gardena east — Jimmi Hütte under Cir
    )
    for r_i, (at_m, side, w, d, st_cnt) in enumerate(rifugi_sites):
        _rifugio_complex(B, kit, road, height_at, at_m, side, w, d, st_cnt)
        # Panoramic roadside sun terrace between the rifugio and the kerb
        idx = road.index(at_m)
        yaw = road.s[idx]["h"]
        t_off = (kit.kerb + 5.2) * side
        tx, ty, _ = road.at(idx, t_off)
        tz = max(height_at(tx, ty), road.s[idx]["z"] - 0.35)
        B["larch-warm"].box((tx, ty, tz - 1.2), (w * 0.86, 4.6, 1.35), yaw)
        # Wooden picnic tables & red/cream alpine sun parasols
        for p_k in (-1, 0, 1):
            px_t = tx + math.cos(yaw) * (p_k * 4.4)
            py_t = ty + math.sin(yaw) * (p_k * 4.4)
            B["larch-aged"].box((px_t, py_t, tz + 0.15), (2.1, 1.25, 0.78), yaw)
            B["steel"].box((px_t, py_t, tz + 0.15), (0.09, 0.09, 2.55), yaw)
            p_mat = "parasol-red" if (p_k + r_i) % 2 == 0 else "paint"
            kit.gable(B[p_mat], (px_t, py_t, tz + 2.45), 2.85, 2.85, 0.55, yaw + p_k * 0.4)
        # Trio of tall alpine flagpoles (Italian green/red, Ladin blue, Tyrolean red/white)
        flag_mats = ("foliage", "parasol-red", "ladin-blue")
        for f_k, f_mat in enumerate(flag_mats):
            fx = tx + math.cos(yaw) * (-w * 0.44 + f_k * 1.6) - math.sin(yaw) * (-1.8 * side)
            fy = ty + math.sin(yaw) * (-w * 0.44 + f_k * 1.6) + math.cos(yaw) * (-1.8 * side)
            B["paint"].box((fx, fy, tz + 0.1), (0.10, 0.10, 6.4), yaw)
            B[f_mat].box((fx + math.cos(yaw) * 0.72, fy + math.sin(yaw) * 0.72, tz + 5.15), (1.35, 0.06, 0.88), yaw + 0.18)
        # Wooden A-frame Bike Day wheel/saddle rack with parked road bikes beside each rifugio terrace!
        rk_x = tx + math.cos(yaw) * (w * 0.36)
        rk_y = ty + math.sin(yaw) * (w * 0.36)
        B["larch-aged"].box((rk_x, rk_y, tz + 0.12), (3.4, 0.14, 1.18), yaw)
        for bk_i in range(4):
            bx_r = rk_x + math.cos(yaw) * (-1.2 + bk_i * 0.8)
            by_r = rk_y + math.sin(yaw) * (-1.2 + bk_i * 0.8)
            B["dark"].box((bx_r, by_r, tz + 0.15), (0.10, 1.45, 0.65), yaw)
            B[("parasol-red", "ladin-blue", "yellow", "paint")[bk_i]].box((bx_r, by_r, tz + 0.62), (0.09, 0.95, 0.42), yaw)
        # Warm glowing festoon bulb garland strung along the front edge of the sun terrace
        for fb_i in range(5):
            fb_along = (-0.36 + fb_i * 0.18) * w
            fb_x = tx + math.cos(yaw) * fb_along - math.sin(yaw) * (-2.0 * side)
            fb_y = ty + math.sin(yaw) * fb_along + math.cos(yaw) * (-2.0 * side)
            B["bulb"].box((fb_x, fb_y, tz + 2.85), (0.18, 0.18, 0.22), yaw)
        # Stacked winter split-larch firewood shelter beside the terrace
        wd_x = tx - math.cos(yaw) * (w * 0.42)
        wd_y = ty - math.sin(yaw) * (w * 0.42)
        B["larch-warm"].box((wd_x, wd_y, tz + 0.10), (2.4, 0.85, 1.45), yaw)
        kit.gable(B["larch-aged"], (wd_x, wd_y, tz + 1.55), 2.7, 1.15, 0.35, yaw)
        # Pairs of reclined alpine sun loungers facing the Dolomite peaks
        for lg_k in (-1, 1):
            lx_s = tx + math.cos(yaw) * (lg_k * 2.2) - math.sin(yaw) * (1.25 * side)
            ly_s = ty + math.sin(yaw) * (lg_k * 2.2) + math.cos(yaw) * (1.25 * side)
            B["larch-aged"].box((lx_s, ly_s, tz + 0.14), (0.72, 1.65, 0.36), yaw + 0.25)
            B["parasol-red"].box((lx_s, ly_s, tz + 0.48), (0.64, 1.42, 0.12), yaw + 0.25)
