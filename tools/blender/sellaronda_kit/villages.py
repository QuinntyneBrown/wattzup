"""Detail 8 (valley-villages): Corvara, Arabba, Canazei & Selva with Tyrolean onion-dome churches."""

from __future__ import annotations

import math


def _onion_dome_church(B, kit, x: float, y: float, z: float, yaw: float, dome_mat: str = "copper-patina", spire: bool = False) -> None:
    """Builds a classic Dolomite parish church with whitewashed nave, belfry clock tower & bulbous Zwiebelturm onion dome."""
    for bl_o in (-6.0, -2.0, 2.0, 6.0):
        B["granite"].box((x + math.cos(yaw) * bl_o - math.sin(yaw) * -8.2, y + math.sin(yaw) * bl_o + math.cos(yaw) * -8.2, z - 0.8), (0.28, 0.28, 1.15), yaw)
    # Low whitewashed churchyard perimeter wall + shingle coping around the parish church
    B["chalet-plaster"].box((x, y, z - 1.4), (22.5, 15.0, 2.15), yaw)
    B["larch-aged"].box((x, y, z + 0.75), (22.8, 15.3, 0.16), yaw)
    gx_ch = x - math.sin(yaw) * -7.5
    gy_ch = y + math.cos(yaw) * -7.5
    B["larch-aged"].box((gx_ch, gy_ch, z + 0.75), (2.4, 0.45, 2.05), yaw)
    kit.gable(B["chalet-wood"], (gx_ch, gy_ch, z + 2.80), 2.85, 1.15, 0.65, yaw)
    for cr_o in (-6.5, -4.5):
        B["dark"].box((x + math.cos(yaw) * cr_o - math.sin(yaw) * 5.6, y + math.sin(yaw) * cr_o + math.cos(yaw) * 5.6, z + 0.6), (0.14, 0.52, 1.15), yaw)
    # Whitewashed nave + pitched slate roof
    B["stone"].box((x, y, z - 2.0), (16.5, 9.2, 2.6), yaw)
    B["chalet-plaster"].box((x, y, z + 0.6), (16.2, 8.8, 7.2), yaw)
    B["glow-window"].box((x - math.cos(yaw) * 8.15, y - math.sin(yaw) * 8.15, z + 5.1), (0.14, 1.85, 1.85), yaw)
    kit.gable(B["roof-slate"], (x, y, z + 7.8), 16.8, 9.4, 3.8, yaw)
    ax_p = x + math.cos(yaw) * 9.4
    ay_p = y + math.sin(yaw) * 9.4
    B["chalet-plaster"].box((ax_p, ay_p, z + 0.4), (4.2, 5.8, 5.6), yaw)
    kit.gable(B["roof-slate"], (ax_p, ay_p, z + 6.0), 4.6, 6.2, 2.1, yaw)

    # Tall square campanile bell tower rising beside the chancel
    tx = x + math.cos(yaw) * 6.4 - math.sin(yaw) * 3.8
    ty = y + math.sin(yaw) * 6.4 + math.cos(yaw) * 3.8
    B["dolomite-pale"].box((tx, ty, z - 1.6), (4.65, 4.65, 3.2), yaw)
    B["chalet-plaster"].box((tx, ty, z - 1.5), (4.4, 4.4, 19.5), yaw)
    # Dark arched belfry openings & gold-rimmed clock faces on all 4 sides
    B["dark"].box((tx, ty, z + 14.8), (4.52, 1.45, 2.2), yaw)
    B["dark"].box((tx, ty, z + 14.8), (1.45, 4.52, 2.2), yaw)
    B["gold"].box((tx, ty, z + 12.6), (4.54, 1.15, 1.15), yaw)
    B["gold"].box((tx, ty, z + 12.6), (1.15, 4.54, 1.15), yaw)

    if spire:
        # Pointed Gothic alpine shingle spire (Arabba style)
        kit.gable(B[dome_mat], (tx, ty, z + 18.0), 4.8, 4.8, 7.6, yaw)
        kit.gable(B[dome_mat], (tx, ty, z + 18.0), 4.8, 4.8, 7.6, yaw + math.pi * 0.5)
        B["gold"].box((tx, ty, z + 25.4), (0.22, 0.22, 1.8), yaw)
    else:
        # Bulbous Tyrolean octagonal Zwiebelturm onion dome!
        tiers = (
            (18.0, 3.4, 1.2),
            (19.2, 5.2, 1.9),
            (21.1, 4.6, 1.7),
            (22.8, 2.4, 1.5),
            (24.3, 1.1, 2.4),
        )
        for z_off, w_oct, h_oct in tiers:
            B[dome_mat].box((tx, ty, z + z_off), (w_oct, w_oct, h_oct), yaw)
            B[dome_mat].box((tx, ty, z + z_off), (w_oct * 0.92, w_oct * 0.92, h_oct), yaw + math.pi * 0.25)
        B["dark"].box((tx, ty, z + 22.9), (2.55, 0.85, 1.15), yaw)
        B["gold"].box((tx, ty, z + 26.7), (0.45, 0.45, 0.45), yaw)
        B["gold"].box((tx, ty, z + 27.15), (0.14, 0.85, 1.45), yaw)


def _village_chalet(B, kit, road, idx: int, side: float, off_extra: float, w: float, d: float, storeys: int, height_at) -> None:
    yaw = road.s[idx]["h"] + (0.0 if side < 0 else math.pi)
    off = (kit.kerb + off_extra) * side
    cx_v, cy_v, _ = road.at(idx, off)
    if not road.clear_of_road(cx_v, cy_v, kit.kerb + 5.5, idx):
        return
    cz_v = max(height_at(cx_v, cy_v), road.s[idx]["z"] - 0.6)
    B["stone"].box((cx_v, cy_v, cz_v - 2.4), (w, d, 3.0), yaw)
    B["larch-warm"].box((cx_v + math.cos(yaw) * (w * 0.52), cy_v + math.sin(yaw) * (w * 0.52), cz_v + 0.6), (0.42, d * 0.55, 1.45), yaw)
    # Traditional projecting Ladin stone bread-oven apse (forn da pan) on older chalets
    if idx % 3 == 0:
        ox = cx_v + math.cos(yaw) * (w * 0.5 + 0.9)
        oy = cy_v + math.sin(yaw) * (w * 0.5 + 0.9)
        B["chalet-plaster"].box((ox, oy, cz_v - 0.6), (1.85, 2.25, 2.15), yaw)
        kit.gable(B["larch-aged"], (ox, oy, cz_v + 1.55), 2.15, 2.55, 0.65, yaw)
    B["chalet-plaster"].box((cx_v, cy_v, cz_v + 0.6), (w + 0.2, d + 0.2, storeys * 2.95), yaw)
    B["geranium-red"].box((cx_v - math.sin(yaw) * -(d * 0.5 + 0.35), cy_v + math.cos(yaw) * -(d * 0.5 + 0.35), cz_v + 3.65), (w * 0.72, 0.35, 0.26), yaw)
    B["larch-aged"].box((cx_v, cy_v, cz_v + 0.6 + (storeys - 0.35) * 2.95), (w + 0.35, d + 0.35, 1.15), yaw)
    kit.gable(B["chalet-wood"], (cx_v, cy_v, cz_v + 0.6 + storeys * 2.95), w + 1.2, d + 1.2, 2.6, yaw)
    B["chalet-plaster"].box((cx_v + math.cos(yaw) * (w * 0.25), cy_v + math.sin(yaw) * (w * 0.25), cz_v + 1.6 + storeys * 2.95), (0.78, 0.78, 2.1), yaw)
    B["paint"].box((cx_v - math.sin(yaw) * -(d * 0.5 + 0.14), cy_v + math.cos(yaw) * -(d * 0.5 + 0.14), cz_v + 2.65), (1.15, 0.08, 0.42), yaw)
    B["parasol-red"].box((cx_v - math.sin(yaw) * -(d * 0.5 + 0.12), cy_v + math.cos(yaw) * -(d * 0.5 + 0.12), cz_v + 0.65), (1.10, 0.08, 1.85), yaw)
    for st_i in range(storeys):
        wz_rel = (cz_v - road.s[idx]["z"]) + 1.45 + st_i * 2.95
        for w_k in (-1, 1):
            kit.window(idx, w_k * (w * 0.26), off - side * (d * 0.5 + 0.16), wz_rel, 1.15, 1.4, (st_i + w_k) % 2 == 0, yaw)


def build_valley_villages(B, kit, road, height_at, rng) -> None:
    """Builds Corvara & Arabba (and Canazei & Selva once added) in the four valley saddles."""
    # 1. Corvara in Badia (1,568 m, around 260 m & finish run-in around 11,420 m)
    c_idx = road.index(275.0)
    cx0, cy0, _ = road.at(c_idx, -(kit.kerb + 20.0))
    _onion_dome_church(B, kit, cx0, cy0, height_at(cx0, cy0), road.s[c_idx]["h"] + 0.2, dome_mat="copper-patina", spire=False)
    for d_m in (150.0, 210.0, 265.0, 330.0, 395.0, 11360.0, 11440.0, 11520.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 11.5, 8.6, 2 + (int(d_m) % 2), height_at)

    # 2. Arabba / Rèba (1,602 m, around 3,120 m between Campolongo & Pordoi)
    a_idx = road.index(3135.0)
    ax0, ay0, _ = road.at(a_idx, kit.kerb + 21.0)
    _onion_dome_church(B, kit, ax0, ay0, height_at(ax0, ay0), road.s[a_idx]["h"] - 0.25, dome_mat="parasol-red", spire=True)
    for d_m in (2990.0, 3055.0, 3115.0, 3185.0, 3245.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.0, 11.0, 8.4, 2, height_at)

    # 3. Canazei / Cianacei (1,465 m approach saddle around 6,120 m between Pordoi & Sella)
    cz_idx = road.index(6130.0)
    zx0, zy0, _ = road.at(cz_idx, -(kit.kerb + 21.5))
    _onion_dome_church(B, kit, zx0, zy0, height_at(zx0, zy0), road.s[cz_idx]["h"] + 0.15, dome_mat="copper-patina", spire=False)
    for d_m in (5990.0, 6055.0, 6115.0, 6180.0, 6240.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 12.2, 8.8, 3 if side < 0 else 2, height_at)
            # Painted Val di Fassa decorative ochre & red facade frieze band
            fx_f, fy_f, _ = road.at(idx, (kit.kerb + 9.0) * side)
            if road.clear_of_road(fx_f, fy_f, kit.kerb + 5.5, idx):
                fz_f = max(height_at(fx_f, fy_f), road.s[idx]["z"] - 0.6)
                B["yellow"].box((fx_f, fy_f, fz_f + 3.45), (12.3, 0.14, 0.28), road.s[idx]["h"])
                B["parasol-red"].box((fx_f, fy_f, fz_f + 3.74), (12.3, 0.15, 0.14), road.s[idx]["h"])

    # 4. Selva di Val Gardena / Sëlva (1,563 m approach around 8,920 m between Sella & Gardena)
    sv_idx = road.index(8930.0)
    sx0, sy0, _ = road.at(sv_idx, kit.kerb + 21.0)
    _onion_dome_church(B, kit, sx0, sy0, height_at(sx0, sy0), road.s[sv_idx]["h"] - 0.2, dome_mat="parasol-red", spire=False)
    for d_m in (8800.0, 8865.0, 8925.0, 8985.0, 9045.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 11.8, 8.6, 2 + (int(d_m) % 2), height_at)

    # Trilingual white/brown Italian & Ladin municipal town-entry boards at all 4 villages
    for entry_m in (125.0, 2965.0, 5965.0, 8775.0):
        e_idx = road.index(entry_m)
        e_yaw = road.s[e_idx]["h"]
        B["steel"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 0.0), (0.10, 0.10, 2.35), e_yaw)
        B["paint"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 1.65), (0.08, 1.65, 0.72), e_yaw)
        B["chalet-wood"].box(kit.P(e_idx, 0.0, -(kit.kerb + 1.8), 1.25), (0.08, 1.65, 0.34), e_yaw)

    # Glacial valley streams & larch timber-truss pedestrian/roadside bridges in all 4 valley villages
    for stream_m in (235.0, 3090.0, 6085.0, 8895.0):
        st_idx = road.index(stream_m)
        st_yaw = road.s[st_idx]["h"]
        # Turquoise torrent channel crossing beneath the valley road + larch timber bridge parapets
        for side in (-1.0, 1.0):
            sx_t, sy_t, _ = road.at(st_idx, (kit.kerb + 14.0) * side)
            sz_t = min(height_at(sx_t, sy_t), road.s[st_idx]["z"] - 1.4)
            B["dolomite-pale"].box((sx_t, sy_t, sz_t - 0.3), (6.4, 24.0, 0.45), st_yaw)
            B["lago-turquoise"].box((sx_t, sy_t, sz_t + 0.08), (4.2, 24.0, 0.18), st_yaw)
            for bk_s in (-2.4, 2.4):
                B["stone"].box((sx_t + math.cos(st_yaw) * bk_s, sy_t + math.sin(st_yaw) * bk_s, sz_t - 0.2), (0.65, 22.0, 1.35), st_yaw)
            B["larch-warm"].box(kit.P(st_idx, 0.0, (kit.kerb + 0.95) * side, 0.0), (8.6, 0.32, 1.18), st_yaw)
            B["larch-aged"].box(kit.P(st_idx, 0.0, (kit.kerb + 0.95) * side, 1.18), (9.0, 0.44, 0.16), st_yaw)
            B["geranium-red"].box(kit.P(st_idx, 0.0, (kit.kerb + 1.12) * side, 1.05), (5.6, 0.34, 0.28), st_yaw)
            for fl_o in (-2.6, 0.0, 2.6):
                B["geranium-red"].box(kit.P(st_idx, fl_o, (kit.kerb + 0.95) * side, 1.32), (1.45, 0.36, 0.24), st_yaw)

    # Castel Wolkenstein medieval cliff fortress overlooking Selva di Val Gardena (at=9020 m)
    cw_idx = road.index(9020.0)
    cw_yaw = road.s[cw_idx]["h"]
    cwx, cwy, _ = road.at(cw_idx, kit.kerb + 46.0)
    cwz = height_at(cwx, cwy) + 14.0
    B["stone"].box((cwx, cwy, cwz - 16.0), (14.0, 9.5, 22.0), cw_yaw + 0.3)
    B["dolomite-pale"].box((cwx + 4.2, cwy - 2.0, cwz + 4.0), (5.2, 5.2, 9.5), cw_yaw + 0.3)
    kit.gable(B["parasol-red"], (cwx + 4.2, cwy - 2.0, cwz + 13.5), 5.6, 5.6, 2.8, cw_yaw + 0.3)

    # Octagonal stone village square fountains (Fontana / Brunnen) in Corvara, Arabba, Canazei & Selva
    for fnt_m, f_side in ((285.0, -1.0), (3145.0, 1.0), (6140.0, -1.0), (8940.0, 1.0)):
        f_idx = road.index(fnt_m)
        fx_v, fy_v, _ = road.at(f_idx, (kit.kerb + 7.5) * f_side)
        fz_v = max(height_at(fx_v, fy_v), road.s[f_idx]["z"] - 0.2)
        B["dolomite-pale"].box((fx_v, fy_v, fz_v - 0.3), (2.6, 2.6, 1.05), 0.0)
        B["lago-turquoise"].box((fx_v, fy_v, fz_v + 0.68), (2.1, 2.1, 0.14), 0.0)
        B["stone"].box((fx_v, fy_v, fz_v + 0.75), (0.42, 0.42, 1.45), 0.0)
        B["gold"].box((fx_v, fy_v, fz_v + 1.85), (0.78, 0.78, 0.08), 0.0)

    # Overhead Sellaronda Bike Day street welcome banners spanning Corvara, Arabba, Canazei & Selva!
    for ban_m in (195.0, 3040.0, 6045.0, 8850.0):
        bn_idx = road.index(ban_m)
        bn_yaw = road.s[bn_idx]["h"]
        span_w = (kit.kerb + 2.2) * 2.0
        for side in (-1.0, 1.0):
            B["larch-aged"].box(kit.P(bn_idx, 0.0, (kit.kerb + 2.2) * side, -0.2), (0.18, 0.18, 6.4), bn_yaw)
        B["ladin-blue"].box(kit.P(bn_idx, 0.0, 0.0, 5.25), (0.16, span_w - 0.6, 0.92), bn_yaw)
        B["paint"].box(kit.P(bn_idx, 0.0, 0.0, 5.48), (0.20, span_w * 0.62, 0.44), bn_yaw)

    # 5. Colfosco / Calfosch (1,645 m, around 10,980 m) with iconic hillside San Vigilio church!
    cf_idx = road.index(10980.0)
    cfx, cfy, _ = road.at(cf_idx, kit.kerb + 22.0)
    _onion_dome_church(B, kit, cfx, cfy, height_at(cfx, cfy), road.s[cf_idx]["h"] - 0.18, dome_mat="copper-patina", spire=False)
    for d_m in (10890.0, 10955.0, 11035.0, 11105.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 13.5, 11.2, 8.4, 2, height_at)

    # 6. Plan de Gralba (1,800 m junction around 8,620 m between Passo Sella & Selva/Gardena)
    for d_m in (8550.0, 8620.0, 8690.0):
        idx = road.index(d_m)
        for side in (-1.0, 1.0):
            _village_chalet(B, kit, road, idx, side, 14.0, 12.6, 9.0, 3 if side > 0 else 2, height_at)

    # Val Gardena traditional woodcarver (Scultori Gardenesi) ground-floor display vitrines & guild brackets in Selva
    for wc_m, wc_side in ((8865.0, -1.0), (8925.0, 1.0), (8985.0, -1.0)):
        w_idx = road.index(wc_m)
        wyaw = road.s[w_idx]["h"]
        wx_s, wy_s, _ = road.at(w_idx, (kit.kerb + 8.6) * wc_side)
        wz_s = max(height_at(wx_s, wy_s), road.s[w_idx]["z"] - 0.3)
        B["larch-warm"].box((wx_s, wy_s, wz_s), (3.8, 1.4, 2.55), wyaw)
        B["glow-window"].box((wx_s, wy_s, wz_s + 0.65), (3.2, 1.46, 1.35), wyaw)
        B["gold"].box((wx_s, wy_s, wz_s + 2.35), (0.14, 1.85, 0.55), wyaw)

    # Covered wooden SAD / Dolomiti Bus alpine transit shelters in Corvara, Arabba, Canazei & Selva
    for bus_m, b_side in ((355.0, 1.0), (3210.0, -1.0), (6210.0, 1.0), (9015.0, -1.0)):
        b_idx = road.index(bus_m)
        byaw = road.s[b_idx]["h"]
        bx_b, by_b, bz_b = kit.P(b_idx, 0.0, (kit.kerb + 2.9) * b_side, -0.1)
        B["stone"].box((bx_b, by_b, bz_b), (3.8, 1.9, 0.18), byaw)
        B["larch-aged"].box((bx_b, by_b, bz_b + 0.18), (3.6, 1.7, 2.25), byaw)
        B["paint"].box((bx_b, by_b, bz_b + 0.95), (1.15, 1.76, 0.85), byaw)
        kit.gable(B["chalet-wood"], (bx_b, by_b, bz_b + 2.43), 4.1, 2.2, 0.65, byaw)
        B["ladin-blue"].box((bx_b + math.cos(byaw) * 2.15, by_b + math.sin(byaw) * 2.15, bz_b + 0.18), (0.14, 0.65, 1.95), byaw)
        # Shingled wooden Ufficio Turistico noticeboard beside the village bus stop
        nb_x, nb_y, nb_z = kit.P(b_idx, 4.2, (kit.kerb + 2.4) * b_side, -0.05)
        B["larch-aged"].box((nb_x, nb_y, nb_z), (1.85, 0.22, 2.25), byaw)
        B["paint"].box((nb_x, nb_y, nb_z + 0.95), (1.55, 0.26, 0.95), byaw)
        kit.gable(B["larch-warm"], (nb_x, nb_y, nb_z + 2.25), 2.25, 0.72, 0.42, byaw)

    # Village Konditorei / Caffè striped awnings & sidewalk tables in Corvara & Selva
    for cf_m, cf_s in ((295.0, 1.0), (8910.0, -1.0)):
        k_idx = road.index(cf_m)
        kyaw = road.s[k_idx]["h"]
        kx_c, ky_c, kz_c = kit.P(k_idx, 0.0, (kit.kerb + 6.8) * cf_s, 0.0)
        B["awning"].box((kx_c, ky_c, kz_c + 2.85), (7.6, 2.4, 0.28), kyaw)
        for tb_o in (-2.2, 0.0, 2.2):
            B["paint"].box(kit.P(k_idx, tb_o, (kit.kerb + 6.2) * cf_s, 0.0), (0.85, 0.85, 0.76), kyaw)

    # Dry-stone walled alpine kitchen gardens (orti alpini) in Arabba & Canazei
    for g_m, g_s in ((3020.0, -1.0), (3160.0, 1.0), (6020.0, 1.0), (6160.0, -1.0)):
        g_idx = road.index(g_m)
        gyaw = road.s[g_idx]["h"]
        gx_o, gy_o, _ = road.at(g_idx, (kit.kerb + 7.2) * g_s)
        gz_o = max(height_at(gx_o, gy_o), road.s[g_idx]["z"] - 0.4)
        B["stone"].box((gx_o, gy_o, gz_o - 0.3), (5.4, 3.6, 0.55), gyaw)
        for row_o in (-1.2, 0.0, 1.2):
            B["foliage"].box((gx_o + math.cos(gyaw) * row_o, gy_o + math.sin(gyaw) * row_o, gz_o + 0.25), (0.85, 2.9, 0.32), gyaw)

    # Village church-square white zebra crossings & blue pedestrian signboards
    for zb_m in (272.0, 3132.0, 6128.0, 8928.0):
        z_idx = road.index(zb_m)
        zyaw = road.s[z_idx]["h"]
        for st_k in range(-4, 5):
            B["paint"].box(kit.P(z_idx, 0.0, st_k * 0.98, 0.02), (2.6, 0.46, 0.015), zyaw)
        B["steel"].box(kit.P(z_idx, -1.8, -(kit.kerb + 1.2), 0.0), (0.09, 0.09, 2.35), zyaw)
        B["ladin-blue"].box(kit.P(z_idx, -1.8, -(kit.kerb + 1.2), 1.95), (0.08, 0.62, 0.62), zyaw)

    # Volunteer Alpine Fire-Brigade halls (Vigili del Fuoco / Freiwillige Feuerwehr) with hose towers in Arabba & Selva
    for fw_m, fw_s in ((3225.0, 1.0), (8820.0, -1.0)):
        f_idx = road.index(fw_m)
        fyaw = road.s[f_idx]["h"]
        fx_h, fy_h, _ = road.at(f_idx, (kit.kerb + 13.5) * fw_s)
        fz_h = max(height_at(fx_h, fy_h), road.s[f_idx]["z"] - 0.5)
        B["chalet-plaster"].box((fx_h, fy_h, fz_h - 1.5), (10.5, 8.2, 6.2), fyaw)
        kit.gable(B["roof-slate"], (fx_h, fy_h, fz_h + 4.7), 11.2, 8.8, 2.2, fyaw)
        B["larch-warm"].box((fx_h + math.cos(fyaw) * 4.2, fy_h + math.sin(fyaw) * 4.2, fz_h + 4.2), (2.8, 2.8, 5.4), fyaw)
        for bay_o in (-2.2, 1.2):
            B["parasol-red"].box((fx_h + math.cos(fyaw) * bay_o, fy_h + math.sin(fyaw) * bay_o, fz_h + 0.1), (2.4, 8.35, 2.95), fyaw)

    # Traditional elevated Ladin larch granary cribs in Corvara & Colfosco
    for gr_m, gr_s in ((175.0, -1.0), (11065.0, 1.0)):
        g_idx = road.index(gr_m)
        gyaw = road.s[g_idx]["h"]
        gx_g, gy_g, _ = road.at(g_idx, (kit.kerb + 16.5) * gr_s)
        gz_g = height_at(gx_g, gy_g)
        B["dolomite-pale"].box((gx_g, gy_g, gz_g - 0.4), (3.4, 3.0, 1.15), gyaw)
        B["larch-aged"].box((gx_g, gy_g, gz_g + 0.75), (3.9, 3.5, 2.45), gyaw)
        kit.gable(B["chalet-wood"], (gx_g, gy_g, gz_g + 3.20), 4.4, 4.0, 1.25, gyaw)

    # Alpine Noleggio Bici / Bike Service shopfronts with display bikes in Corvara & Canazei
    for bs_m, bs_s in ((320.0, -1.0), (6095.0, 1.0)):
        b_idx = road.index(bs_m)
        byaw = road.s[b_idx]["h"]
        bx_s, by_s, bz_s = kit.P(b_idx, 0.0, (kit.kerb + 5.8) * bs_s, 0.0)
        B["ladin-blue"].box((bx_s, by_s, bz_s + 2.65), (5.8, 1.65, 0.36), byaw)
        for db_o in (-1.6, 0.0, 1.6):
            B["dark"].box(kit.P(b_idx, db_o, (kit.kerb + 5.2) * bs_s, 0.0), (1.35, 0.12, 0.62), byaw + 0.3)
            B["yellow"].box(kit.P(b_idx, db_o, (kit.kerb + 5.2) * bs_s, 0.42), (0.92, 0.10, 0.42), byaw + 0.3)

    # Guide Alpine / Catores limestone commemorative steles in Corvara & Selva church squares
    for gd_m, gd_s in ((268.0, -1.0), (8938.0, 1.0)):
        g_idx = road.index(gd_m)
        gx_a, gy_a, gz_a = kit.P(g_idx, 0.0, (kit.kerb + 6.4) * gd_s, -0.1)
        B["dolomite-pale"].box((gx_a, gy_a, gz_a), (0.95, 0.72, 2.25), road.s[g_idx]["h"])
        B["gold"].box((gx_a, gy_a, gz_a + 1.35), (0.99, 0.44, 0.44), road.s[g_idx]["h"])

    # Traditional octagonal Tyrolean Musikpavillon village bandstands in Corvara & Selva
    for mp_m, mp_s in ((380.0, -1.0), (8965.0, 1.0)):
        m_idx = road.index(mp_m)
        mx_p, my_p, _ = road.at(m_idx, (kit.kerb + 15.0) * mp_s)
        if road.clear_of_road(mx_p, my_p, 11.0, m_idx):
            mz_p = height_at(mx_p, my_p)
            B["stone"].box((mx_p, my_p, mz_p - 0.8), (6.4, 6.4, 1.35), 0.0)
            B["larch-warm"].box((mx_p, my_p, mz_p + 0.55), (5.8, 0.18, 0.95), 0.0)
            for col_a in range(4):
                ca_p, sa_p = math.cos(col_a * math.pi * 0.5 + 0.4), math.sin(col_a * math.pi * 0.5 + 0.4)
                B["larch-aged"].box((mx_p + ca_p * 2.6, my_p + sa_p * 2.6, mz_p + 0.55), (0.24, 0.24, 3.15), 0.0)
            kit.gable(B["copper-patina"], (mx_p, my_p, mz_p + 3.70), 7.2, 7.2, 2.15, 0.0)

    # Ornate alpine village promenade street-clock pillars in Corvara & Canazei
    for ck_m in (290.0, 6110.0):
        c_idx = road.index(ck_m)
        cx_k, cy_k, cz_k = kit.P(c_idx, 0.0, kit.kerb + 2.2, 0.0)
        B["copper-patina"].box((cx_k, cy_k, cz_k), (0.24, 0.24, 3.65), 0.0)
        B["paint"].box((cx_k, cy_k, cz_k + 3.65), (0.18, 0.78, 0.78), road.s[c_idx]["h"])
        B["gold"].box((cx_k, cy_k, cz_k + 4.43), (0.22, 0.22, 0.32), 0.0)

    # Slatted-larch South Tyrolean ecological waste-sorting shelters at village outskirts
    for ec_m in (410.0, 3255.0, 6250.0, 9052.0):
        e_idx = road.index(ec_m)
        eyaw = road.s[e_idx]["h"]
        ex_c, ey_c, ez_c = kit.P(e_idx, 0.0, -(kit.kerb + 3.4), -0.1)
        B["larch-warm"].box((ex_c, ey_c, ez_c), (3.2, 1.5, 1.55), eyaw)
        for lid_k, lid_c in enumerate(("ladin-blue", "yellow", "foliage")):
            B[lid_c].box(kit.P(e_idx, -0.9 + lid_k * 0.9, -(kit.kerb + 3.4), 1.46), (0.72, 1.15, 0.14), eyaw)

    # Glowing green Farmacia / Apotheke projecting cross signs in Corvara, Arabba, Canazei & Selva
    for fm_m, fm_s in ((248.0, 1.0), (3112.0, -1.0), (6108.0, -1.0), (8908.0, 1.0)):
        f_idx = road.index(fm_m)
        fyaw = road.s[f_idx]["h"]
        fx_p, fy_p, fz_p = kit.P(f_idx, 0.0, (kit.kerb + 6.4) * fm_s, 3.65)
        B["neon-lime"].box((fx_p, fy_p, fz_p), (0.14, 0.82, 0.26), fyaw)
        B["neon-lime"].box((fx_p, fy_p, fz_p - 0.28), (0.14, 0.26, 0.82), fyaw)

    # Comun / Municipio civic halls with triple municipal flags in Corvara & Canazei
    for mu_m, mu_s in ((225.0, -1.0), (6152.0, 1.0)):
        m_idx = road.index(mu_m)
        myaw = road.s[m_idx]["h"]
        mx_c, my_c, _ = road.at(m_idx, (kit.kerb + 14.2) * mu_s)
        if road.clear_of_road(mx_c, my_c, 10.0, m_idx):
            mz_c = max(height_at(mx_c, my_c), road.s[m_idx]["z"] - 0.4)
            B["stone"].box((mx_c, my_c, mz_c - 1.8), (13.0, 9.2, 2.8), myaw)
            B["chalet-plaster"].box((mx_c, my_c, mz_c + 1.0), (13.2, 9.4, 6.4), myaw)
            kit.gable(B["roof-slate"], (mx_c, my_c, mz_c + 7.4), 13.8, 10.0, 2.8, myaw)
            for fl_i, fl_m in enumerate(("ladin-blue", "foliage", "parasol-red")):
                B[fl_m].box((mx_c + math.cos(myaw) * (-1.4 + fl_i * 1.4), my_c + math.sin(myaw) * (-1.4 + fl_i * 1.4), mz_c + 4.4), (0.95, 9.6, 0.62), myaw)

    # Larch-timber village park swing frames & slides in Corvara & Selva
    for pg_m, pg_s in ((392.0, 1.0), (8975.0, -1.0)):
        p_idx = road.index(pg_m)
        px_g, py_g, _ = road.at(p_idx, (kit.kerb + 14.0) * pg_s)
        if road.clear_of_road(px_g, py_g, 10.0, p_idx):
            pz_g = height_at(px_g, py_g)
            B["larch-warm"].box((px_g, py_g, pz_g + 2.25), (3.8, 0.18, 0.18), 0.3)
            for sw_x in (-1.7, 1.7):
                B["larch-aged"].box((px_g + sw_x * 0.9, py_g, pz_g), (0.18, 1.45, 2.35), 0.3)
            B["parasol-red"].box((px_g, py_g + 1.8, pz_g), (0.68, 2.4, 1.35), 0.3)

    # Gilded Bäckerei / Panificio pretzel brackets in Arabba & Selva
    for bk_m, bk_s in ((3122.0, -1.0), (8918.0, 1.0)):
        b_idx = road.index(bk_m)
        bx_p, by_p, bz_p = kit.P(b_idx, 0.0, (kit.kerb + 6.5) * bk_s, 3.25)
        B["gold"].box((bx_p, by_p, bz_p), (0.12, 0.72, 0.52), road.s[b_idx]["h"])

    # Alpine volunteer fire-station halls with red apparatus doors & timber hose-drying towers
    for fw_m, fw_s in ((165.0, 1.0), (8820.0, 1.0)):
        f_idx = road.index(fw_m)
        fyaw = road.s[f_idx]["h"]
        fx_h, fy_h, _ = road.at(f_idx, (kit.kerb + 15.5) * fw_s)
        if road.clear_of_road(fx_h, fy_h, 11.0, f_idx):
            fz_h = height_at(fx_h, fy_h)
            B["chalet-plaster"].box((fx_h, fy_h, fz_h - 0.8), (11.2, 8.2, 5.2), fyaw)
            B["parasol-red"].box((fx_h - math.sin(fyaw) * -(4.2 * fw_s), fy_h + math.cos(fyaw) * -(4.2 * fw_s), fz_h), (7.6, 0.18, 3.2), fyaw)
            B["larch-aged"].box((fx_h + math.cos(fyaw) * 4.4, fy_h + math.sin(fyaw) * 4.4, fz_h), (2.8, 2.8, 11.5), fyaw)
            B["gold"].box((fx_h + math.cos(fyaw) * 4.4, fy_h + math.sin(fyaw) * 4.4, fz_h + 6.5), (2.9, 0.45, 0.85), fyaw)
            kit.gable(B["roof-slate"], (fx_h, fy_h, fz_h + 4.4), 11.8, 8.8, 2.1, fyaw)
    # Stadio del Ghiaccio glulam-timber arena roof in Corvara (at=435 m)
    ic_i = road.index(435.0)
    icyaw = road.s[ic_i]["h"]
    icx, icy, _ = road.at(ic_i, kit.kerb + 28.0)
    if road.clear_of_road(icx, icy, 16.0, ic_i):
        icz = height_at(icx, icy)
        B["larch-warm"].box((icx, icy, icz - 1.5), (22.0, 15.0, 5.2), icyaw)
        kit.gable(B["steel"], (icx, icy, icz + 3.7), 23.2, 16.2, 2.4, icyaw)
    # Traditional Val di Fassa semicircular exterior stone bread ovens in Canazei
    for ov_m in (6055.0, 6180.0):
        ov_i = road.index(ov_m)
        ovyaw = road.s[ov_i]["h"]
        ovx, ovy, _ = road.at(ov_i, -(kit.kerb + 9.2))
        ovz = max(height_at(ovx, ovy), road.s[ov_i]["z"] - 0.3)
        B["chalet-plaster"].box((ovx, ovy, ovz), (1.85, 1.55, 1.95), ovyaw)
        kit.gable(B["larch-aged"], (ovx, ovy, ovz + 1.95), 2.15, 1.85, 0.55, ovyaw)
    # Stepped Cordevole torrent check-dam weirs in Arabba (at=3090 m)
    ar_w = road.index(3090.0)
    for wr_s in (-1.0, 1.0):
        wx_a, wy_a, _ = road.at(ar_w, (kit.kerb + 19.0) * wr_s)
        wz_a = min(height_at(wx_a, wy_a), road.s[ar_w]["z"] - 1.2)
        B["stone"].box((wx_a, wy_a, wz_a - 0.4), (4.4, 0.85, 0.95), road.s[ar_w]["h"])
        B["paint"].box((wx_a, wy_a, wz_a + 0.35), (3.8, 1.15, 0.14), road.s[ar_w]["h"])
    # Village bike-rental & alpine sport shopfronts with display bikes outside
    for sp_m, sp_s in ((212.0, -1.0), (3058.0, 1.0), (6058.0, 1.0), (8868.0, 1.0)):
        sp_i = road.index(sp_m)
        spyaw = road.s[sp_i]["h"]
        spx, spy, spz = kit.P(sp_i, 0.0, (kit.kerb + 7.2) * sp_s, 0.0)
        B["ladin-blue"].box((spx, spy, spz + 2.45), (3.4, 1.35, 0.22), spyaw)
        B["parasol-red"].box((spx, spy, spz + 0.15), (2.4, 0.95, 0.72), spyaw)
    # Historic Ladin timber watermill (Mulin) beside the Colfosco stream (at=10935 m)
    ml_i = road.index(10935.0)
    mlyaw = road.s[ml_i]["h"]
    mlx, mly, _ = road.at(ml_i, kit.kerb + 16.5)
    if road.clear_of_road(mlx, mly, 11.0, ml_i):
        mlz = height_at(mlx, mly)
        B["stone"].box((mlx, mly, mlz - 1.2), (5.8, 4.6, 2.0), mlyaw)
        B["larch-aged"].box((mlx, mly, mlz + 0.8), (6.0, 4.8, 2.8), mlyaw)
        kit.gable(B["chalet-wood"], (mlx, mly, mlz + 3.6), 6.6, 5.4, 1.6, mlyaw)
        B["larch-warm"].box((mlx - math.sin(mlyaw) * 2.55, mly + math.cos(mlyaw) * 2.55, mlz + 0.2), (2.6, 0.28, 2.6), mlyaw)
    # Solar digital speed-feedback signs ("RILEVAMENTO VELOCITÀ") at the 4 village entries
    for radar_m in (138.0, 2978.0, 5978.0, 8788.0):
        rd_i = road.index(radar_m)
        rdyaw = road.s[rd_i]["h"]
        B["steel"].box(kit.P(rd_i, 0.0, -(kit.kerb + 1.65), 0.0), (0.09, 0.09, 2.55), rdyaw)
        B["dark"].box(kit.P(rd_i, 0.0, -(kit.kerb + 1.65), 1.75), (0.10, 0.72, 0.88), rdyaw)
        B["neon-lime"].box(kit.P(rd_i, -0.02, -(kit.kerb + 1.65), 2.02), (0.12, 0.48, 0.34), rdyaw)
    # Ladin Tourismusverein / Ufficio Turistico blue-'i' kiosks in the 4 valley villages
    for ti_m, ti_s in ((312.0, 1.0), (3165.0, -1.0), (6165.0, -1.0), (8955.0, -1.0)):
        ti_i = road.index(ti_m)
        tiyaw = road.s[ti_i]["h"]
        tix, tiy, tiz = kit.P(ti_i, 0.0, (kit.kerb + 3.2) * ti_s, 0.0)
        B["ladin-blue"].box((tix, tiy, tiz), (0.42, 0.88, 2.15), tiyaw)
        B["paint"].box((tix, tiy, tiz + 1.55), (0.45, 0.42, 0.42), tiyaw)
    # Summer Gelateria sidewalk counters & cream parasols in Corvara & Canazei
    for gl_v in (268.0, 6122.0):
        gv_i = road.index(gl_v)
        gvy = road.s[gv_i]["h"]
        gvx, gvy_p, gvz = kit.P(gv_i, 0.0, -(kit.kerb + 5.2), 0.0)
        B["accent-2"].box((gvx, gvy_p, gvz), (2.2, 0.95, 1.05), gvy)
        kit.gable(B["paint"], (gvx, gvy_p, gvz + 2.45), 2.8, 2.8, 0.55, gvy)
    # Trilingual Ladin 'BËGNODÜS / A RIVEDERCI' farewell totems at village exits
    for ex_m in (405.0, 3250.0, 6246.0, 9048.0):
        ex_i = road.index(ex_m)
        exy = road.s[ex_i]["h"]
        B["larch-warm"].box(kit.P(ex_i, 0.0, kit.kerb + 2.05, 0.0), (0.28, 0.85, 2.45), exy)
        B["ladin-blue"].box(kit.P(ex_i, 0.0, kit.kerb + 2.05, 1.85), (0.32, 0.72, 0.42), exy)
    # Historic Fodom Ladin stone-and-larch Granà house in Arabba (at=3025 m)
    gr_i = road.index(3025.0)
    gry = road.s[gr_i]["h"]
    grx, gry_p, _ = road.at(gr_i, -(kit.kerb + 15.0))
    if road.clear_of_road(grx, gry_p, 11.0, gr_i):
        grz = height_at(grx, gry_p)
        B["stone"].box((grx, gry_p, grz - 1.4), (8.4, 6.8, 3.2), gry)
        B["larch-aged"].box((grx, gry_p, grz + 1.8), (8.8, 7.2, 3.4), gry)
        kit.gable(B["chalet-wood"], (grx, gry_p, grz + 5.2), 9.4, 7.8, 2.0, gry)
    # Ciasa de Cultura Ladin heritage pavilion in Corvara (at=342 m)
    cl_i = road.index(342.0)
    cly = road.s[cl_i]["h"]
    clx, cly_p, _ = road.at(cl_i, -(kit.kerb + 15.5))
    if road.clear_of_road(clx, cly_p, 11.0, cl_i):
        clz = height_at(clx, cly_p)
        B["chalet-plaster"].box((clx, cly_p, clz - 0.8), (10.4, 7.6, 5.4), cly)
        B["ladin-blue"].box((clx, cly_p, clz + 2.8), (10.6, 7.8, 0.55), cly)
        kit.gable(B["larch-aged"], (clx, cly_p, clz + 4.6), 11.2, 8.4, 2.2, cly)
    # Red-and-yellow Poste Italiane / Südtiroler Post pillar boxes in the 4 valley villages
    for pt_m in (228.0, 3138.0, 6155.0, 8934.0):
        pti = road.index(pt_m)
        B["parasol-red"].box(kit.P(pti, 0.0, -(kit.kerb + 2.15), 0.0), (0.36, 0.32, 1.25), road.s[pti]["h"])
        B["yellow"].box(kit.P(pti, 0.0, -(kit.kerb + 2.15), 0.95), (0.38, 0.34, 0.18), road.s[pti]["h"])
    # Avisio riverside larch promenade pergola in Canazei (at=6092 m)
    av_p = road.index(6092.0)
    avy = road.s[av_p]["h"]
    avx, avy_p, _ = road.at(av_p, kit.kerb + 9.5)
    avz = max(height_at(avx, avy_p), road.s[av_p]["z"] - 0.4)
    B["larch-warm"].box((avx, avy_p, avz + 2.35), (8.5, 2.2, 0.22), avy)
    for ap_o in (-3.8, 0.0, 3.8):
        B["larch-aged"].box((avx + math.cos(avy) * ap_o, avy_p + math.sin(avy) * ap_o, avz), (0.18, 2.0, 2.35), avy)
    # Pranives ice-arena timber hall in Selva di Val Gardena (at=9005 m)
    pr_i = road.index(9005.0)
    pry = road.s[pr_i]["h"]
    prx, pry_p, _ = road.at(pr_i, kit.kerb + 27.0)
    if road.clear_of_road(prx, pry_p, 15.0, pr_i):
        prz = height_at(prx, pry_p)
        B["chalet-plaster"].box((prx, pry_p, prz - 1.4), (19.5, 13.5, 4.8), pry)
        kit.gable(B["roof-slate"], (prx, pry_p, prz + 3.4), 20.6, 14.6, 2.2, pry)
    # Porphyry-edged village pedestrian crossing aprons in all 4 valley towns
    for ped_m in (260.0, 3120.0, 6120.0, 8920.0):
        pi = road.index(ped_m)
        B["brick"].box(kit.P(pi, 0.0, 0.0, 0.012), (3.2, kit.kerb * 1.92, 0.015), road.s[pi]["h"])
    # Green clean-mobility public charging pillars in Corvara & Canazei
    for ev_m in (302.0, 6172.0):
        evi = road.index(ev_m)
        B["foliage"].box(kit.P(evi, 0.0, kit.kerb + 2.4, 0.0), (0.42, 0.34, 1.55), road.s[evi]["h"])
        B["neon-lime"].box(kit.P(evi, 0.0, kit.kerb + 2.4, 1.35), (0.44, 0.36, 0.12), road.s[evi]["h"])
    # Grand Fassan fresco-accented historic hotel in Canazei (at=6025 m)
    lp_i = road.index(6025.0)
    lpy = road.s[lp_i]["h"]
    lpx, lpy_p, _ = road.at(lp_i, -(kit.kerb + 15.5))
    if road.clear_of_road(lpx, lpy_p, 11.0, lp_i):
        lpz = height_at(lpx, lpy_p)
        B["chalet-plaster"].box((lpx, lpy_p, lpz - 1.0), (14.5, 10.2, 9.2), lpy)
        B["gold"].box((lpx, lpy_p, lpz + 5.6), (14.7, 10.4, 0.85), lpy)
        kit.gable(B["roof-slate"], (lpx, lpy_p, lpz + 8.2), 15.4, 11.0, 3.0, lpy)
    # Pale-dolomite village square memorial columns in Corvara & Arabba
    for vm_m, vm_s in ((272.0, -1.0), (3132.0, 1.0)):
        vmi = road.index(vm_m)
        vmx, vmy, vmz = kit.P(vmi, 0.0, (kit.kerb + 9.2) * vm_s, 0.0)
        B["dolomite-pale"].box((vmx, vmy, vmz), (0.95, 0.95, 3.45), 0.0)
    # Shingled spring-water fountains in Plan de Gralba & Colfosco
    for cf_f in (8612.0, 10972.0):
        cfi = road.index(cf_f)
        cfx_f, cfy_f, cfz_f = kit.P(cfi, 0.0, kit.kerb + 5.8, 0.0)
        B["stone"].box((cfx_f, cfy_f, cfz_f), (1.85, 1.85, 0.85), 0.0)
        kit.gable(B["larch-aged"], (cfx_f, cfy_f, cfz_f + 2.15), 2.35, 2.35, 0.75, 0.0)
    # Classic dark-iron promenade streetlamps in Corvara & Selva
    for sl_v in (180.0, 240.0, 310.0, 8840.0, 8910.0, 8980.0):
        sli = road.index(sl_v)
        B["dark"].box(kit.P(sli, 0.0, kit.kerb + 1.45, 0.0), (0.12, 0.12, 4.2), road.s[sli]["h"])
        B["bulb"].box(kit.P(sli, 0.0, kit.kerb + 1.15, 4.15), (0.28, 0.28, 0.26), road.s[sli]["h"])
    # Historic Livinallongo stone heritage fort wall overlooking Arabba (at=2985 m)
    ft_i = road.index(2985.0)
    ftx, fty, _ = road.at(ft_i, kit.kerb + 38.0)
    if road.clear_of_road(ftx, fty, 20.0, ft_i):
        ftz = height_at(ftx, fty) + 6.0
        B["stone"].box((ftx, fty, ftz - 8.0), (13.0, 6.5, 11.5), road.s[ft_i]["h"] + 0.2)
    # Striped Ladin farmers'-market Speck & mountain-cheese stalls in Corvara & Canazei
    for mk_m in (282.0, 6136.0):
        mki = road.index(mk_m)
        mkx, mky, mkz = kit.P(mki, 0.0, -(kit.kerb + 10.2), 0.0)
        B["larch-warm"].box((mkx, mky, mkz), (2.8, 1.4, 0.95), road.s[mki]["h"])
        kit.gable(B["awning"], (mkx, mky, mkz + 2.15), 3.1, 1.8, 0.55, road.s[mki]["h"])
    # Piazza Nives timber-and-stone village pavilion in Selva di Val Gardena (at=8902 m)
    nv_i = road.index(8902.0)
    nvy = road.s[nv_i]["h"]
    nvx, nvy_p, _ = road.at(nv_i, -(kit.kerb + 14.5))
    if road.clear_of_road(nvx, nvy_p, 10.5, nv_i):
        nvz = height_at(nvx, nvy_p)
        B["stone"].box((nvx, nvy_p, nvz - 0.8), (9.2, 6.8, 1.4), nvy)
        B["larch-warm"].box((nvx, nvy_p, nvz + 0.6), (8.8, 6.4, 3.2), nvy)
        kit.gable(B["copper-patina"], (nvx, nvy_p, nvz + 3.8), 9.6, 7.2, 1.85, nvy)
    # Pale-dolomite churchyard steps ascending toward San Vigilio in Colfosco
    for st_k in (8.0, 12.0):
        B["dolomite-pale"].box(kit.P(cf_idx, 0.0, kit.kerb + st_k, -0.1), (3.4, 3.2, 0.45), road.s[cf_idx]["h"])
    # [ANCHOR:villages]
