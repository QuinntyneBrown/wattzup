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

    # Rough Dolomite rubble-stone ground storey + stone-framed timber cellar entrance
    B["stone"].box((rx, ry, base_z - 3.6), (main_w, main_d, 6.8), yaw)
    B["chalet-wood"].box((rx - math.cos(yaw) * (main_w * 0.26) - math.sin(yaw) * -(main_d * 0.5 + 0.08), ry - math.sin(yaw) * (main_w * 0.26) + math.cos(yaw) * -(main_d * 0.5 + 0.08), base_z + 0.1), (1.45, 0.14, 1.95), yaw)
    B["dolomite-pale"].box((rx - math.sin(yaw) * -(main_d * 0.5 + 0.08), ry + math.cos(yaw) * -(main_d * 0.5 + 0.08), base_z + 0.1), (2.35, 0.24, 2.55), yaw)
    B["larch-aged"].box((rx - math.sin(yaw) * -(main_d * 0.5 + 0.14), ry + math.cos(yaw) * -(main_d * 0.5 + 0.14), base_z + 0.15), (1.85, 0.18, 2.25), yaw)
    B["parasol-red"].box((rx + math.cos(yaw) * 1.35 - math.sin(yaw) * -(main_d * 0.5 + 0.16), ry + math.sin(yaw) * 1.35 + math.cos(yaw) * -(main_d * 0.5 + 0.16), base_z + 1.65), (0.58, 0.06, 0.38), yaw)
    B["larch-warm"].box((rx + math.cos(yaw) * 1.65 - math.sin(yaw) * -(main_d * 0.5 + 0.45), ry + math.sin(yaw) * 1.65 + math.cos(yaw) * -(main_d * 0.5 + 0.45), base_z + 0.1), (0.85, 0.45, 0.78), yaw)
    # Crisp Tyrolean whitewashed plaster upper storeys (mapped into Walls group for procedural plaster detail!)
    upper_h = 3.1 * storeys
    B["chalet-plaster"].box((rx, ry, base_z + 3.2), (main_w + 0.3, main_d + 0.3, upper_h), yaw)
    # Top timber gable attic + steep slate roof + masonry chimney
    B["larch-aged"].box((rx, ry, base_z + 3.2 + upper_h - 0.6), (main_w + 0.4, main_d + 0.4, 0.7), yaw)
    kit.gable(B["roof-slate"], (rx, ry, base_z + 3.2 + upper_h), main_w + 1.4, main_d + 1.4, 3.4, yaw)
    B["steel"].box((rx - math.sin(yaw) * -(main_d * 0.5 + 0.45), ry + math.cos(yaw) * -(main_d * 0.5 + 0.45), base_z + 3.35 + upper_h), (main_w + 0.8, 0.08, 0.18), yaw)
    # Traditional wooden alpine rooftop bell-turret (campaniletto) straddling the ridge
    B["larch-warm"].box((rx, ry, base_z + 3.2 + upper_h + 3.1), (1.05, 1.05, 1.55), yaw)
    kit.gable(B["larch-aged"], (rx, ry, base_z + 3.2 + upper_h + 4.65), 1.35, 1.35, 0.72, yaw)
    for fn_s in (-1.0, 1.0):
        B["larch-aged"].box((rx + math.cos(yaw) * (fn_s * main_w * 0.54), ry + math.sin(yaw) * (fn_s * main_w * 0.54), base_z + 3.2 + upper_h + 3.35), (0.16, 0.16, 0.95), yaw)
    # Pitched Tyrolean attic dormers along the road-facing roof slope
    for dm_o in (-0.28 * main_w, 0.28 * main_w):
        dmx = rx + math.cos(yaw) * dm_o - math.sin(yaw) * -(main_d * 0.28)
        dmy = ry + math.sin(yaw) * dm_o + math.cos(yaw) * -(main_d * 0.28)
        B["chalet-plaster"].box((dmx, dmy, base_z + 3.2 + upper_h + 0.55), (1.65, 1.85, 1.35), yaw)
        kit.gable(B["roof-slate"], (dmx, dmy, base_z + 3.2 + upper_h + 1.90), 1.95, 2.05, 0.75, yaw)
    # Flush rooftop solar thermal collector array common on eco-certified Südtirol mountain hotels
    B["ladin-blue"].box(
        (rx - math.cos(yaw) * (main_w * 0.24) - math.sin(yaw) * (main_d * 0.24), ry - math.sin(yaw) * (main_w * 0.24) + math.cos(yaw) * (main_d * 0.24), base_z + 3.2 + upper_h + 1.45),
        (4.2, 2.1, 0.18),
        yaw,
    )
    B["stone"].box(
        (rx + math.cos(yaw) * (main_w * 0.28), ry + math.sin(yaw) * (main_w * 0.28), base_z + 3.2 + upper_h + 1.2),
        (0.95, 0.95, 2.8),
        yaw,
    )
    B["copper-patina"].box(
        (rx + math.cos(yaw) * (main_w * 0.28), ry + math.sin(yaw) * (main_w * 0.28), base_z + 3.2 + upper_h + 4.0),
        (1.18, 1.18, 0.22),
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
    B["gold"].box((sx_d, sy_d, base_z + 3.8), (0.12, 0.95, 0.62), yaw)
    # Cantilevered wrought-iron hotel sign bracket with gilded alpine emblem
    B["dark"].box((sx_d, sy_d, base_z + 3.6), (0.10, 1.35, 0.14), yaw)
    B["gold"].box((sx_d - math.sin(yaw) * -0.45, sy_d + math.cos(yaw) * -0.45, base_z + 2.95), (0.12, 0.68, 0.62), yaw)

    # Projecting Tyrolean corner Erker turret with copper-patina cap on 3-storey flagship pass hotels
    if storeys >= 3:
        ex_t = rx + math.cos(yaw) * (main_w * 0.5) - math.sin(yaw) * -(main_d * 0.5)
        ey_t = ry + math.sin(yaw) * (main_w * 0.5) + math.cos(yaw) * -(main_d * 0.5)
        B["chalet-plaster"].box((ex_t, ey_t, base_z + 2.8), (2.4, 2.4, upper_h + 0.8), yaw + math.pi * 0.25)
        kit.gable(B["copper-patina"], (ex_t, ey_t, base_z + 3.6 + upper_h), 2.8, 2.8, 1.85, yaw)
        sn_x = rx + math.cos(yaw) * (main_w * 0.5 + 3.4)
        sn_y = ry + math.sin(yaw) * (main_w * 0.5 + 3.4)
        B["larch-warm"].box((sn_x, sn_y, base_z + 0.1), (2.8, 2.1, 2.1), yaw)
        B["glow-window"].box((sn_x, sn_y, base_z + 0.65), (2.86, 1.15, 1.15), yaw)

    # Wraparound dark-larch balconies facing the road + overflowing red geranium flowerboxes!
    nx, ny = -math.sin(yaw), math.cos(yaw)
    front_dist = main_d * 0.5 + 0.55
    for st_i in range(storeys):
        bz = base_z + 3.35 + st_i * 3.1
        bx = rx - nx * front_dist
        by = ry - ny * front_dist
        B["larch-aged"].box((bx, by, bz), (main_w - 0.6, 1.15, 0.22), yaw)
        B["larch-warm"].box((bx - nx * 0.48, by - ny * 0.48, bz + 0.22), (main_w - 0.6, 0.14, 0.92), yaw)
        for dv_o in (-0.18 * main_w, 0.18 * main_w):
            B["larch-warm"].box((bx + math.cos(yaw) * dv_o, by + math.sin(yaw) * dv_o, bz + 0.22), (0.08, 1.05, 1.65), yaw)
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
            sh_mat = "pine" if storeys == 2 else "parasol-red"
            for sh_s in (-0.82, 0.82):
                sh_x = rx - nx * (main_d * 0.5 + 0.19) + math.cos(yaw) * (along_w + sh_s)
                sh_y = ry - ny * (main_d * 0.5 + 0.19) + math.sin(yaw) * (along_w + sh_s)
                B[sh_mat].box((sh_x, sh_y, base_z + 4.05 + st_i * 3.1), (0.34, 0.06, 1.48), yaw)


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
        # Timber-framed windbreak glass panels on both windward ends of the panoramic terrace
        for wb_end in (-1.0, 1.0):
            wx_b = tx + math.cos(yaw) * (wb_end * w * 0.42)
            wy_b = ty + math.sin(yaw) * (wb_end * w * 0.42)
            B["larch-aged"].box((wx_b, wy_b, tz + 0.15), (0.14, 4.4, 1.55), yaw)
            B["glacier-ice"].box((wx_b, wy_b, tz + 0.45), (0.08, 4.1, 1.12), yaw)
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
        B["paint"].box((rk_x + math.cos(yaw) * 2.05, rk_y + math.sin(yaw) * 2.05, tz + 0.12), (0.34, 0.34, 1.38), yaw)
        B["neon-lime"].box((rk_x + math.cos(yaw) * 2.05, rk_y + math.sin(yaw) * 2.05, tz + 1.25), (0.36, 0.36, 0.16), yaw)
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
        B["foliage"].box((wd_x - math.cos(yaw) * 1.8, wd_y - math.sin(yaw) * 1.8, tz + 0.1), (0.95, 0.65, 0.92), yaw)
        B["steel"].box((wd_x - math.cos(yaw) * 2.5, wd_y - math.sin(yaw) * 2.5, tz + 0.1), (0.48, 0.48, 0.68), yaw)
        # Pairs of reclined alpine sun loungers facing the Dolomite peaks
        for lg_k in (-1, 1):
            lx_s = tx + math.cos(yaw) * (lg_k * 2.2) - math.sin(yaw) * (1.25 * side)
            ly_s = ty + math.sin(yaw) * (lg_k * 2.2) + math.cos(yaw) * (1.25 * side)
            B["larch-aged"].box((lx_s, ly_s, tz + 0.14), (0.72, 1.65, 0.36), yaw + 0.25)
            B["parasol-red"].box((lx_s, ly_s, tz + 0.48), (0.64, 1.42, 0.12), yaw + 0.25)
        # Carved timber hotel roadside welcome totem & warm entry lantern
        ent_x, ent_y, ent_z = kit.P(idx, -w * 0.48, (kit.kerb + 2.15) * side, -0.1)
        B["stone"].box((ent_x, ent_y, ent_z), (0.85, 0.65, 0.55), yaw)
        B["larch-aged"].box((ent_x, ent_y, ent_z + 0.55), (0.36, 0.92, 2.15), yaw)
        B["paint"].box((ent_x, ent_y, ent_z + 1.55), (0.40, 0.72, 0.68), yaw)
        B["bulb"].box((ent_x, ent_y, ent_z + 2.72), (0.24, 0.24, 0.28), yaw)
        # Folding wooden chalkboard menu A-frame ("APFELSTRUDEL · CANEDERLI · ESPRESSO")
        mn_x, mn_y, mn_z = kit.P(idx, 2.4, (kit.kerb + 2.55) * side, 0.0)
        B["larch-warm"].box((mn_x, mn_y, mn_z), (0.52, 0.72, 1.08), yaw + 0.2)
        B["dark"].box((mn_x, mn_y, mn_z + 0.18), (0.56, 0.58, 0.76), yaw + 0.2)
        for tub_o in (-1.8, 1.8):
            tb_x = tx + math.cos(yaw) * tub_o - math.sin(yaw) * (2.1 * side)
            tb_y = ty + math.sin(yaw) * tub_o + math.cos(yaw) * (2.1 * side)
            B["larch-aged"].box((tb_x, tb_y, tz + 0.12), (0.68, 0.68, 0.58), yaw)
            B["pine"].box((tb_x, tb_y, tz + 0.68), (0.78, 0.78, 0.65), yaw + 0.4)
        # Open-rafter larch pergola shading one end of the sun terrace
        pg_x = tx - math.cos(yaw) * (w * 0.25)
        pg_y = ty - math.sin(yaw) * (w * 0.25)
        for pr_i in range(-1, 2):
            B["larch-warm"].box((pg_x + math.cos(yaw) * (pr_i * 1.35), pg_y + math.sin(yaw) * (pr_i * 1.35), tz + 2.65), (0.14, 3.8, 0.18), yaw)
        B["stone"].box((pg_x, pg_y, tz + 0.12), (1.15, 1.15, 0.48), yaw)
        B["glow-door"].box((pg_x, pg_y, tz + 0.58), (0.72, 0.72, 0.14), yaw + 0.4)
        bar_x = tx + math.cos(yaw) * (w * 0.18) - math.sin(yaw) * (1.5 * side)
        bar_y = ty + math.sin(yaw) * (w * 0.18) + math.cos(yaw) * (1.5 * side)
        B["larch-aged"].box((bar_x, bar_y, tz + 0.12), (2.6, 0.82, 1.12), yaw)
        B["dolomite-pale"].box((bar_x, bar_y, tz + 1.24), (2.75, 0.94, 0.08), yaw)
        rk2_x = tx + math.cos(yaw) * (w * 0.46) - math.sin(yaw) * (-2.1 * side)
        rk2_y = ty + math.sin(yaw) * (w * 0.46) + math.cos(yaw) * (-2.1 * side)
        B["dolomite-pale"].box((rk2_x, rk2_y, tz + 0.05), (1.25, 1.05, 0.62), yaw + 0.5)
        B["yellow"].box((rk2_x, rk2_y, tz + 0.66), (0.55, 0.55, 0.22), yaw)
        B["foliage"].box((rk_x + math.cos(yaw) * 2.05, rk_y + math.sin(yaw) * 2.05, tz + 0.12), (0.34, 0.28, 1.35), yaw)
        B["yellow"].box((rk_x - math.cos(yaw) * 1.95, rk_y - math.sin(yaw) * 1.95, tz + 0.12), (0.18, 0.24, 0.72), yaw)
        # [ANCHOR:rifugi-site]

    # Historic stone-and-larch annex wing beside Hotel Savoia on Passo Pordoi (at=4908 m)
    sv_idx = road.index(4908.0)
    svyaw = road.s[sv_idx]["h"]
    svx, svy, _ = road.at(sv_idx, -(kit.kerb + 13.0))
    svz = max(height_at(svx, svy), road.s[sv_idx]["z"] - 0.5)
    B["stone"].box((svx, svy, svz - 2.0), (8.2, 6.8, 4.8), svyaw)
    kit.gable(B["roof-slate"], (svx, svy, svz + 2.8), 8.8, 7.4, 2.2, svyaw)
    # Mushroom-cap stainless patio heaters on the 2,240 m Pordoi & Sella resort decks
    for ht_m in (4922.0, 7722.0):
        ht_i = road.index(ht_m)
        hx_p, hy_p, hz_p = kit.P(ht_i, 0.0, -(kit.kerb + 5.0), 0.15)
        B["steel"].box((hx_p, hy_p, hz_p), (0.12, 0.12, 2.15), 0.0)
        B["steel"].box((hx_p, hy_p, hz_p + 2.15), (0.78, 0.78, 0.14), 0.0)
    # Rifugio Frara semicircular stone lookout terrace facing Cascata del Pisciadù (at=10118 m)
    fr_i = road.index(10118.0)
    fryaw = road.s[fr_i]["h"]
    frx, fry, _ = road.at(fr_i, -(kit.kerb + 7.2))
    frz = max(height_at(frx, fry), road.s[fr_i]["z"] - 0.3)
    B["stone"].box((frx, fry, frz - 1.4), (5.6, 4.4, 1.55), fryaw)
    B["larch-warm"].box((frx, fry, frz + 0.15), (5.4, 0.16, 0.95), fryaw)
    # Outdoor cedar-rimmed turquoise alpine spa tub at Passo Sella Mountain Resort (at=7712 m)
    sp_r = road.index(7712.0)
    spryaw = road.s[sp_r]["h"]
    spx_r, spy_r, _ = road.at(sp_r, -(kit.kerb + 12.5))
    spz_r = max(height_at(spx_r, spy_r), road.s[sp_r]["z"] - 0.5)
    B["larch-warm"].box((spx_r, spy_r, spz_r), (2.8, 2.8, 0.92), spryaw)
    B["lago-turquoise"].box((spx_r, spy_r, spz_r + 0.84), (2.3, 2.3, 0.12), spryaw)
    # Glazed alpine wintergarden dining veranda on Hotel Boè at Passo Campolongo (at=2076 m)
    hb_i = road.index(2076.0)
    hbyaw = road.s[hb_i]["h"]
    hbx, hby, _ = road.at(hb_i, -(kit.kerb + 10.5))
    hbz = max(height_at(hbx, hby), road.s[hb_i]["z"] - 0.4)
    B["larch-warm"].box((hbx, hby, hbz), (6.4, 3.8, 3.1), hbyaw)
    B["glow-window"].box((hbx, hby, hbz + 0.55), (6.46, 3.86, 2.05), hbyaw)
    # Porphyry-paved forecourt drop-off apron at Hotel Col di Lana on Passo Pordoi (at=4982 m)
    cd_i = road.index(4982.0)
    cdy = road.s[cd_i]["h"]
    B["brick"].box(kit.P(cd_i, 0.0, kit.kerb + 2.8, -0.04), (10.5, 3.2, 0.10), cdy)
    # Historic aged-larch ski-pioneers pavilion on Passo Sella (Milestone 0500!)
    ps_p = road.index(7740.0)
    pspy = road.s[ps_p]["h"] + 0.25
    psx_p, psy_p, _ = road.at(ps_p, -(kit.kerb + 14.5))
    psz_p = max(height_at(psx_p, psy_p), road.s[ps_p]["z"] - 0.5)
    B["stone"].box((psx_p, psy_p, psz_p - 1.5), (7.4, 5.8, 2.0), pspy)
    B["larch-aged"].box((psx_p, psy_p, psz_p + 0.5), (7.6, 6.0, 3.2), pspy)
    kit.gable(B["chalet-wood"], (psx_p, psy_p, psz_p + 3.7), 8.2, 6.6, 1.9, pspy)
    # [ANCHOR:rifugi-global]
