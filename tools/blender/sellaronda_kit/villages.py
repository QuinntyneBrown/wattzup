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
    # Whitewashed nave + pitched slate roof
    B["stone"].box((x, y, z - 2.0), (16.5, 9.2, 2.6), yaw)
    B["chalet-plaster"].box((x, y, z + 0.6), (16.2, 8.8, 7.2), yaw)
    kit.gable(B["roof-slate"], (x, y, z + 7.8), 16.8, 9.4, 3.8, yaw)

    # Tall square campanile bell tower rising beside the chancel
    tx = x + math.cos(yaw) * 6.4 - math.sin(yaw) * 3.8
    ty = y + math.sin(yaw) * 6.4 + math.cos(yaw) * 3.8
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
    # Traditional projecting Ladin stone bread-oven apse (forn da pan) on older chalets
    if idx % 3 == 0:
        ox = cx_v + math.cos(yaw) * (w * 0.5 + 0.9)
        oy = cy_v + math.sin(yaw) * (w * 0.5 + 0.9)
        B["chalet-plaster"].box((ox, oy, cz_v - 0.6), (1.85, 2.25, 2.15), yaw)
        kit.gable(B["larch-aged"], (ox, oy, cz_v + 1.55), 2.15, 2.55, 0.65, yaw)
    B["chalet-plaster"].box((cx_v, cy_v, cz_v + 0.6), (w + 0.2, d + 0.2, storeys * 2.95), yaw)
    B["larch-aged"].box((cx_v, cy_v, cz_v + 0.6 + (storeys - 0.35) * 2.95), (w + 0.35, d + 0.35, 1.15), yaw)
    kit.gable(B["chalet-wood"], (cx_v, cy_v, cz_v + 0.6 + storeys * 2.95), w + 1.2, d + 1.2, 2.6, yaw)
    B["paint"].box((cx_v - math.sin(yaw) * -(d * 0.5 + 0.14), cy_v + math.cos(yaw) * -(d * 0.5 + 0.14), cz_v + 2.65), (1.15, 0.08, 0.42), yaw)
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
            kit.gable(B["roof-slate"], (fx_h, fy_h, fz_h + 4.4), 11.8, 8.8, 2.1, fyaw)
    # [ANCHOR:villages]
