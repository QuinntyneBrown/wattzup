"""Detail 2 (four-passes): Passo Campolongo, Pordoi, Sella & Gardena summit signs, monuments & chapels."""

from __future__ import annotations

import math

from . import PASSES


def build_four_passes(B, kit, road, height_at) -> None:
    """Builds trilingual summit signs and summit cairns at all four cols of the Sella Ronda loop."""
    s = road.s
    for p_idx, p in enumerate(PASSES):
        idx = road.index(p["at"])
        yaw = s[idx]["h"]
        # Right-hand summit photo pull-out apron & dressed stone plinth
        B["stone"].box(kit.P(idx, 6.0, -(kit.kerb + 2.6), -0.35), (4.6, 2.4, 0.55), yaw)
        # Twin aged-larch posts
        for along_off in (4.6, 7.4):
            B["larch-aged"].box(kit.P(idx, along_off, -(kit.kerb + 2.5), 0.2), (0.20, 0.20, 3.05), yaw)
        # Main brown road-authority summit sign panel + white trilingual nameplate + altitude plaque
        B["chalet-wood"].box(kit.P(idx, 6.0, -(kit.kerb + 2.5), 1.75), (3.25, 0.16, 1.28), yaw)
        B["paint"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 2.38), (2.95, 0.05, 0.44), yaw)
        B["ladin-blue"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 1.98), (2.95, 0.05, 0.26), yaw)
        B["yellow"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 1.78), (1.35, 0.05, 0.16), yaw)
        # Pitched larch shingle weather-hood cap over the summit board
        kit.gable(B["larch-aged"], kit.P(idx, 6.0, -(kit.kerb + 2.5), 3.03), 3.55, 0.68, 0.38, yaw)
        # Opposite-side secondary direction & altitude fingerpost
        B["steel"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 0.0), (0.11, 0.11, 2.75), yaw)
        B["ladin-blue"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 2.35), (1.65, 0.08, 0.34), yaw + 0.35)
        B["paint"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 1.95), (1.55, 0.08, 0.30), yaw - 0.25)

    # Fausto Coppi stone memorial obelisk & Giro d'Italia Cima Coppi pink stele on Passo Pordoi (2,239 m)
    pordoi_idx = road.index(4950.0)
    p_yaw = s[pordoi_idx]["h"]
    mx, my, _ = road.at(pordoi_idx, -(kit.kerb + 6.8))
    mz = height_at(mx, my)
    B["stone"].box((mx, my, mz - 0.6), (5.8, 4.4, 0.85), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 0.25), (2.4, 1.5, 1.35), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 1.60), (1.35, 0.95, 3.10), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 4.70), (0.85, 0.65, 1.15), p_yaw)
    # Bronze Campionissimo relief plaque & bust silhouette
    B["larch-aged"].box((mx - math.sin(p_yaw) * -0.52, my + math.cos(p_yaw) * -0.52, mz + 2.15), (0.75, 0.14, 0.95), p_yaw)
    # Rose-pink Giro Cima Coppi commemorative totem beside the monument
    gx, gy, _ = road.at(pordoi_idx + 4, -(kit.kerb + 4.5))
    gz = height_at(gx, gy)
    B["dark"].box((gx, gy, gz - 0.2), (0.95, 0.65, 0.35), p_yaw)
    B["accent-2"].box((gx, gy, gz + 0.15), (0.62, 0.22, 2.65), p_yaw + 0.2)

    # Cappella di San Maurizio on Passo Gardena (at=10162 m): whitewashed alpine pass chapel with bell-gable
    gar_idx = road.index(10162.0)
    g_yaw = s[gar_idx]["h"] - 0.3
    cx_ch, cy_ch, _ = road.at(gar_idx, -(kit.kerb + 8.5))
    cz_ch = max(height_at(cx_ch, cy_ch), s[gar_idx]["z"] - 0.3)
    B["stone"].box((cx_ch, cy_ch, cz_ch - 1.2), (7.6, 5.2, 1.55), g_yaw)
    B["chalet-plaster"].box((cx_ch, cy_ch, cz_ch + 0.35), (7.2, 4.8, 4.2), g_yaw)
    kit.gable(B["larch-aged"], (cx_ch, cy_ch, cz_ch + 4.55), 7.8, 5.5, 2.85, g_yaw)
    # Timber rooftop belfry turret + golden summit cross + arched oak portal
    bx_t = cx_ch - math.cos(g_yaw) * 2.6
    by_t = cy_ch - math.sin(g_yaw) * 2.6
    B["larch-warm"].box((bx_t, by_t, cz_ch + 6.4), (1.05, 1.05, 2.35), g_yaw)
    kit.gable(B["larch-aged"], (bx_t, by_t, cz_ch + 8.75), 1.35, 1.35, 0.95, g_yaw)
    B["gold"].box((bx_t, by_t, cz_ch + 9.65), (0.10, 0.48, 0.85), g_yaw)
    B["larch-aged"].box((bx_t - math.cos(g_yaw) * 1.02, by_t - math.sin(g_yaw) * 1.02, cz_ch + 0.4), (0.12, 1.25, 2.25), g_yaw)
    B["stone"].box((bx_t - math.cos(g_yaw) * 2.4, by_t - math.sin(g_yaw) * 2.4, cz_ch + 0.2), (0.55, 0.55, 1.45), g_yaw)
    B["larch-warm"].box((bx_t - math.cos(g_yaw) * 2.4, by_t - math.sin(g_yaw) * 2.4, cz_ch + 1.65), (0.62, 0.62, 0.78), g_yaw)

    # Provincial / Regional border steles at the saddles (Bolzano-Belluno, Belluno-Trento, Trento-Bolzano)
    borders = (
        (2108.0, "parasol-red", "gold"),       # Campolongo: Südtirol -> Belluno (Veneto)
        (4958.0, "gold", "ladin-blue"),        # Pordoi: Belluno -> Trentino
        (7758.0, "ladin-blue", "parasol-red"), # Sella: Trentino -> Südtirol
        (10158.0, "parasol-red", "foliage"),   # Gardena: Val Gardena -> Val Badia
    )
    for b_at, crest_a, crest_b in borders:
        b_idx = road.index(b_at)
        b_yaw = s[b_idx]["h"]
        off = kit.kerb + 2.35
        B["stone"].box(kit.P(b_idx, 0.0, off, -0.25), (1.1, 0.9, 0.55), b_yaw)
        B["steel"].box(kit.P(b_idx, 0.0, off, 0.30), (0.12, 0.12, 2.65), b_yaw)
        B["paint"].box(kit.P(b_idx, 0.0, off, 1.95), (0.10, 1.55, 0.92), b_yaw)
        B[crest_a].box(kit.P(b_idx, 0.04, off - 0.36, 2.48), (0.12, 0.42, 0.32), b_yaw)
        B[crest_b].box(kit.P(b_idx, 0.04, off + 0.36, 2.48), (0.12, 0.42, 0.32), b_yaw)
        kit.gable(B["copper-patina"], kit.P(b_idx, 0.0, off, 2.87), 0.28, 1.72, 0.22, b_yaw)

    # Cycling climb countdown markers (km to summit + altitude + gradient %) every 350 m up all 4 climbs
    for p in PASSES:
        d_mark = p["at"] - 350.0
        while d_mark > p["climb_from"] + 80.0:
            m_idx = road.index(d_mark)
            m_yaw = s[m_idx]["h"]
            m_off = -(kit.kerb + 1.45)
            steep_col = "parasol-red" if s[m_idx]["g"] >= 6.5 else ("yellow" if s[m_idx]["g"] >= 4.5 else "foliage")
            B["steel"].box(kit.P(m_idx, 0.0, m_off, -0.15), (0.08, 0.08, 1.85), m_yaw)
            B["paint"].box(kit.P(m_idx, 0.0, m_off, 1.12), (0.07, 0.72, 0.58), m_yaw)
            B["ladin-blue"].box(kit.P(m_idx, -0.02, m_off, 1.52), (0.08, 0.72, 0.18), m_yaw)
            B[steep_col].box(kit.P(m_idx, -0.02, m_off, 1.14), (0.08, 0.68, 0.14), m_yaw)
            d_mark -= 350.0

    # Summit panoramic belvedere platforms with brass Dolomite peak-finder orientation tables
    for p in PASSES:
        bv_idx = road.index(p["at"] + 16.0)
        bv_yaw = s[bv_idx]["h"]
        bx_v, by_v, _ = road.at(bv_idx, kit.kerb + 4.2)
        bz_v = max(height_at(bx_v, by_v), s[bv_idx]["z"] - 0.15)
        B["dolomite-pale"].box((bx_v, by_v, bz_v - 1.2), (6.2, 3.6, 1.35), bv_yaw)
        B["larch-warm"].box((bx_v - math.sin(bv_yaw) * 1.65, by_v + math.cos(bv_yaw) * 1.65, bz_v + 0.15), (6.0, 0.14, 0.98), bv_yaw)
        B["stone"].box((bx_v, by_v, bz_v + 0.15), (0.62, 0.62, 1.02), bv_yaw)
        B["gold"].box((bx_v, by_v, bz_v + 1.17), (0.88, 0.88, 0.08), bv_yaw + 0.4)
        # Chrome panoramic sightseeing binoculars aimed across the Dolomite peaks
        bn_x = bx_v + math.cos(bv_yaw) * 1.85
        bn_y = by_v + math.sin(bv_yaw) * 1.85
        B["steel"].box((bn_x, bn_y, bz_v + 0.15), (0.12, 0.12, 1.38), bv_yaw)
        B["steel"].box((bn_x, bn_y, bz_v + 1.50), (0.48, 0.28, 0.20), bv_yaw + 1.2)

    # Tall orange/yellow-and-black snow-depth poles lining the exposed 240 m saddle of each pass
    for p in PASSES:
        for d_off in range(-120, 121, 30):
            sp_idx = road.index(p["at"] + d_off)
            sp_yaw = s[sp_idx]["h"]
            for side in (-1.0, 1.0):
                px_s, py_s, pz_s = kit.P(sp_idx, 0.0, (kit.kerb + 1.25) * side, -0.1)
                B["yellow"].box((px_s, py_s, pz_s), (0.09, 0.09, 2.85), sp_yaw)
                B["dark"].box((px_s, py_s, pz_s + 0.95), (0.10, 0.10, 0.55), sp_yaw)
                B["parasol-red"].box((px_s, py_s, pz_s + 2.35), (0.10, 0.10, 0.52), sp_yaw)

    # High-altitude meteorological stations (mast, solar panel, sensor housing, anemometer cross) on Pordoi & Sella
    for wx_at in (4998.0, 7798.0):
        w_idx = road.index(wx_at)
        w_yaw = s[w_idx]["h"]
        wx0, wy0, _ = road.at(w_idx, kit.kerb + 7.5)
        wz0 = height_at(wx0, wy0)
        B["stone"].box((wx0, wy0, wz0 - 0.3), (1.4, 1.4, 0.5), w_yaw)
        B["steel"].box((wx0, wy0, wz0 + 0.2), (0.14, 0.14, 5.6), w_yaw)
        B["paint"].box((wx0, wy0, wz0 + 1.8), (0.55, 0.55, 0.68), w_yaw)
        B["ladin-blue"].box((wx0, wy0, wz0 + 3.4), (0.12, 0.95, 0.65), w_yaw + 0.5)
        B["steel"].box((wx0, wy0, wz0 + 5.55), (1.35, 0.08, 0.08), w_yaw)
        B["steel"].box((wx0, wy0, wz0 + 5.55), (0.08, 1.35, 0.08), w_yaw)

    # Giro d'Italia GPM summit timing gantries & white road crest lines at Passo Pordoi & Passo Sella
    for gpm_at in (4950.0, 7750.0):
        g_idx = road.index(gpm_at)
        gyaw = s[g_idx]["h"]
        span = (kit.kerb + 1.6) * 2.0
        for side in (-1.0, 1.0):
            B["steel"].box(kit.P(g_idx, 0.0, (kit.kerb + 1.6) * side, -0.2), (0.28, 0.28, 5.8), gyaw)
        B["accent-2"].box(kit.P(g_idx, 0.0, 0.0, 5.15), (0.34, span + 0.28, 0.72), gyaw)
        B["paint"].box(kit.P(g_idx, 0.0, 0.0, 0.02), (0.42, kit.kerb * 1.85, 0.015), gyaw)

    # Historic carved pale-stone Grande Strada delle Dolomiti road milestone steles (cippi chilometrici) every 250 m
    for d_cippo in range(250, 11500, 250):
        c_idx = road.index(float(d_cippo))
        cyaw = s[c_idx]["h"]
        B["dolomite-pale"].box(kit.P(c_idx, 0.0, kit.kerb + 1.08, -0.15), (0.26, 0.42, 0.92), cyaw)
        B["paint"].box(kit.P(c_idx, -0.02, kit.kerb + 1.08, 0.48), (0.28, 0.36, 0.24), cyaw)
        if d_cippo % 1000 == 0:
            B["dark"].box(kit.P(c_idx, -0.02, kit.kerb + 1.08, 0.72), (0.28, 0.42, 0.08), cyaw)

    # Sacrario Militare del Pordoi: monumental stepped octagonal stone rotunda high on the eastern Pordoi meadow (at=4780 m)
    sac_idx = road.index(4780.0)
    sx_m, sy_m, _ = road.at(sac_idx, -(kit.kerb + 38.0))
    sz_m = height_at(sx_m, sy_m)
    for r_step, w_oct, h_oct in ((0.0, 14.0, 2.2), (2.2, 10.5, 4.8), (7.0, 7.6, 3.2)):
        B["dolomite-pale"].box((sx_m, sy_m, sz_m + r_step - 1.2), (w_oct, w_oct, h_oct), 0.0)
        B["dolomite-pale"].box((sx_m, sy_m, sz_m + r_step - 1.2), (w_oct * 0.94, w_oct * 0.94, h_oct), math.pi * 0.25)

    # Passo Campolongo (1,875 m) carved Ladin timber totem & stone bench
    cam_idx = road.index(2112.0)
    cam_yaw = s[cam_idx]["h"]
    cx_t, cy_t, cz_t = kit.P(cam_idx, 0.0, -(kit.kerb + 3.8), -0.1)
    B["stone"].box((cx_t, cy_t, cz_t), (1.2, 1.2, 0.65), cam_yaw)
    B["larch-aged"].box((cx_t, cy_t, cz_t + 0.65), (0.52, 0.52, 2.85), cam_yaw + 0.3)
    B["gold"].box((cx_t, cy_t, cz_t + 3.50), (0.36, 0.36, 0.42), cam_yaw + 0.3)

    # Passo Sella (2,240 m) stone-pillar mountaineers' summit bell arch
    sel_idx = road.index(7764.0)
    sel_yaw = s[sel_idx]["h"]
    for p_lat in (-1.1, 1.1):
        B["stone"].box(kit.P(sel_idx, p_lat, -(kit.kerb + 3.6), -0.15), (0.58, 0.58, 3.15), sel_yaw)
    B["larch-aged"].box(kit.P(sel_idx, 0.0, -(kit.kerb + 3.6), 2.95), (2.95, 0.48, 0.36), sel_yaw)
    kit.gable(B["larch-warm"], kit.P(sel_idx, 0.0, -(kit.kerb + 3.6), 3.31), 3.35, 0.92, 0.55, sel_yaw)
    B["gold"].box(kit.P(sel_idx, 0.0, -(kit.kerb + 3.6), 2.38), (0.38, 0.38, 0.48), sel_yaw)

    # Passo Gardena / Ju de Frara UNESCO Dolomites World Heritage monolith & corten emblem
    un_idx = road.index(10142.0)
    un_yaw = s[un_idx]["h"]
    ux_m, uy_m, uz_m = kit.P(un_idx, 0.0, kit.kerb + 3.5, -0.2)
    B["dolomite-pale"].box((ux_m, uy_m, uz_m), (1.85, 1.35, 2.45), un_yaw + 0.22)
    B["larch-aged"].box((ux_m, uy_m, uz_m + 1.15), (1.92, 0.65, 0.72), un_yaw + 0.22)
    B["ladin-blue"].box((ux_m, uy_m, uz_m + 1.38), (1.96, 0.38, 0.28), un_yaw + 0.22)

    # Electronic alpine pass-status boards (PASSO APERTO / OFFEN) with green LED bar & solar panel at each climb foot
    for p in PASSES:
        st_idx = road.index(p["climb_from"] - 35.0)
        st_yaw = s[st_idx]["h"]
        off = -(kit.kerb + 2.05)
        B["steel"].box(kit.P(st_idx, 0.0, off, -0.15), (0.14, 0.14, 3.25), st_yaw)
        B["paint"].box(kit.P(st_idx, 0.0, off, 1.75), (0.12, 1.85, 1.15), st_yaw)
        B["dark"].box(kit.P(st_idx, -0.03, off, 2.05), (0.13, 1.62, 0.45), st_yaw)
        B["neon-lime"].box(kit.P(st_idx, -0.05, off, 2.18), (0.14, 1.15, 0.18), st_yaw)
        B["ladin-blue"].box(kit.P(st_idx, 0.0, off, 3.12), (0.55, 0.72, 0.08), st_yaw + 0.3)

    # Cold alpine spring bottle-refill fountains beside all 4 pass summit signs
    for p in PASSES:
        fn_idx = road.index(p["at"] + 10.5)
        fn_yaw = s[fn_idx]["h"]
        fx_s, fy_s, fz_s = kit.P(fn_idx, 0.0, -(kit.kerb + 2.45), -0.1)
        B["stone"].box((fx_s, fy_s, fz_s), (0.52, 0.52, 1.18), fn_yaw)
        B["stone"].box((fx_s + math.cos(fn_yaw) * 0.45, fy_s + math.sin(fn_yaw) * 0.45, fz_s), (0.85, 0.62, 0.48), fn_yaw)
        B["lago-turquoise"].box((fx_s + math.cos(fn_yaw) * 0.45, fy_s + math.sin(fn_yaw) * 0.45, fz_s + 0.44), (0.68, 0.46, 0.08), fn_yaw)
        B["gold"].box((fx_s + math.cos(fn_yaw) * 0.28, fy_s + math.sin(fn_yaw) * 0.28, fz_s + 0.92), (0.24, 0.08, 0.08), fn_yaw)

    # Historic 1909 Grande Strada delle Dolomiti red-porphyry & limestone obelisk on Passo Pordoi
    ob_idx = road.index(4938.0)
    ob_yaw = s[ob_idx]["h"]
    ox, oy, oz = kit.P(ob_idx, 0.0, kit.kerb + 3.8, -0.2)
    B["stone"].box((ox, oy, oz), (2.2, 2.2, 0.75), ob_yaw)
    B["brick"].box((ox, oy, oz + 0.75), (1.15, 1.15, 3.85), ob_yaw)
    kit.gable(B["dolomite-pale"], (ox, oy, oz + 4.60), 1.22, 1.22, 0.95, ob_yaw)

    # Carved larch Dolomite mountaineer sculpture on boulder pedestal at Passo Sella (at=7738 m)
    ms_idx = road.index(7738.0)
    ms_yaw = s[ms_idx]["h"]
    mx_s, my_s, mz_s = kit.P(ms_idx, 0.0, kit.kerb + 3.4, -0.15)
    B["dolomite-pale"].box((mx_s, my_s, mz_s), (1.35, 1.35, 1.10), ms_yaw)
    B["larch-warm"].box((mx_s, my_s, mz_s + 1.10), (0.48, 0.44, 1.85), ms_yaw + 0.4)

    # Historic small stone alpine border sentry hut on Passo Campolongo (at=2122 m)
    dg_idx = road.index(2122.0)
    dg_yaw = s[dg_idx]["h"]
    dx_g, dy_g, dz_g = kit.P(dg_idx, 0.0, kit.kerb + 5.2, -0.4)
    B["stone"].box((dx_g, dy_g, dz_g), (3.4, 2.9, 2.85), dg_yaw)
    kit.gable(B["roof-slate"], (dx_g, dy_g, dz_g + 2.85), 3.9, 3.4, 1.15, dg_yaw)

    # Alpine mountain-rescue SOS solar emergency call pillars on all 4 cols
    for p in PASSES:
        sos_idx = road.index(p["at"] - 8.5)
        syaw = s[sos_idx]["h"]
        sx_o, sy_o, sz_o = kit.P(sos_idx, 0.0, kit.kerb + 1.85, -0.1)
        B["crowd-3"].box((sx_o, sy_o, sz_o), (0.26, 0.26, 2.15), syaw)
        B["paint"].box((sx_o, sy_o, sz_o + 1.35), (0.28, 0.22, 0.36), syaw)
        B["ladin-blue"].box((sx_o, sy_o, sz_o + 2.16), (0.48, 0.48, 0.06), syaw)

    # Timber alpine souvenir & cycling-jersey kiosk on Passo Pordoi (at=4964 m)
    ks_idx = road.index(4964.0)
    ks_yaw = s[ks_idx]["h"]
    kx_p, ky_p, kz_p = kit.P(ks_idx, 0.0, -(kit.kerb + 5.6), -0.2)
    B["larch-warm"].box((kx_p, ky_p, kz_p), (4.6, 3.2, 2.75), ks_yaw)
    B["glow-window"].box((kx_p, ky_p, kz_p + 0.95), (3.6, 3.26, 1.15), ks_yaw)
    kit.gable(B["larch-aged"], (kx_p, ky_p, kz_p + 2.75), 5.2, 3.8, 1.15, ks_yaw)

    # Low Dolomite masonry panoramic terrace wall along Passo Sella facing Sassolungo
    for pw_off in (-18.0, -10.0, -2.0):
        pw_idx = road.index(7750.0 + pw_off)
        B["stone"].box(kit.P(pw_idx, 0.0, kit.kerb + 3.2, -0.4), (7.6, 0.58, 1.15), s[pw_idx]["h"])
        B["dolomite-pale"].box(kit.P(pw_idx, 0.0, kit.kerb + 3.2, 0.75), (7.8, 0.68, 0.14), s[pw_idx]["h"])

    # Alta Via delle Dolomiti n. 2 twin-log trailhead portals at Passo Campolongo & Passo Pordoi
    for av_at in (2072.0, 5012.0):
        av_idx = road.index(av_at)
        avyaw = s[av_idx]["h"] + 1.45
        avx, avy, _ = road.at(av_idx, kit.kerb + 5.8)
        avz = height_at(avx, avy)
        for p_s in (-1.25, 1.25):
            B["larch-aged"].box((avx - math.sin(avyaw) * p_s, avy + math.cos(avyaw) * p_s, avz - 0.2), (0.22, 0.22, 3.15), avyaw)
        B["larch-warm"].box((avx, avy, avz + 2.65), (0.20, 2.95, 0.42), avyaw)

    # Sloped Dolomite stone watershed divide plaques (Spartiacque) at all 4 cols
    for p in PASSES:
        ws_idx = road.index(p["at"] + 3.2)
        ws_yaw = s[ws_idx]["h"]
        B["stone"].box(kit.P(ws_idx, 0.0, -(kit.kerb + 1.95), -0.1), (0.72, 0.58, 0.78), ws_yaw)
        B["ladin-blue"].box(kit.P(ws_idx, 0.0, -(kit.kerb + 1.95), 0.68), (0.64, 0.48, 0.08), ws_yaw)

    # Giro d'Italia Cima Coppi Winners Wall (Albo d'Oro del Pordoi) beside Coppi stele
    ww_idx = road.index(4946.0)
    ww_yaw = s[ww_idx]["h"] + 0.18
    wx_w, wy_w, wz_w = kit.P(ww_idx, 0.0, -(kit.kerb + 7.2), -0.3)
    B["stone"].box((wx_w, wy_w, wz_w), (4.8, 0.48, 1.85), ww_yaw)
    B["accent-2"].box((wx_w, wy_w, wz_w + 1.55), (4.6, 0.52, 0.24), ww_yaw)

    # UNESCO Dolomites geological interpretation pergola on Passo Sella (at=7772 m)
    un_s_idx = road.index(7772.0)
    uns_yaw = s[un_s_idx]["h"]
    ux_s, uy_s, uz_s = kit.P(un_s_idx, 0.0, kit.kerb + 4.4, -0.1)
    B["larch-aged"].box((ux_s, uy_s, uz_s), (2.9, 0.24, 2.35), uns_yaw)
    B["paint"].box((ux_s, uy_s, uz_s + 0.95), (2.5, 0.28, 1.15), uns_yaw)
    kit.gable(B["larch-warm"], (ux_s, uy_s, uz_s + 2.35), 3.4, 1.15, 0.52, uns_yaw)

    # Semicircular Dolomite stone & larch panoramic bench on Passo Gardena's eastern crest (at=10175 m)
    gb_idx = road.index(10175.0)
    for b_seg in (-1, 0, 1):
        ang_b = s[gb_idx]["h"] + b_seg * 0.42
        bx_g, by_g, bz_g = kit.P(gb_idx, b_seg * 1.6, -(kit.kerb + 3.4), -0.1)
        B["stone"].box((bx_g, by_g, bz_g), (1.55, 0.58, 0.48), ang_b)
        B["larch-warm"].box((bx_g, by_g, bz_g + 0.48), (1.60, 0.62, 0.08), ang_b)

    # Timber alpine pass transit shelter on Passo Campolongo (at=2092 m)
    cb_idx = road.index(2092.0)
    cbyaw = s[cb_idx]["h"]
    cbx, cby, cbz = kit.P(cb_idx, 0.0, kit.kerb + 3.4, -0.1)
    B["larch-aged"].box((cbx, cby, cbz), (3.4, 1.65, 2.25), cbyaw)
    kit.gable(B["chalet-wood"], (cbx, cby, cbz + 2.25), 3.9, 2.05, 0.65, cbyaw)

    # Road-surface frost telemetry masts 180 m below each pass crest
    for p in PASSES:
        ic_idx = road.index(p["at"] - 180.0)
        icyaw = s[ic_idx]["h"]
        ix_m, iy_m, iz_m = kit.P(ic_idx, 0.0, kit.kerb + 1.65, -0.1)
        B["steel"].box((ix_m, iy_m, iz_m), (0.09, 0.09, 3.35), icyaw)
        B["ladin-blue"].box((ix_m, iy_m, iz_m + 2.95), (0.45, 0.55, 0.06), icyaw + 0.3)

    # Swivelling panoramic summit telescopes on the 4 pass belvedere platforms
    for p in PASSES:
        tl_idx = road.index(p["at"] + 18.2)
        tlyaw = s[tl_idx]["h"] + 1.45
        tx_b, ty_b, _ = road.at(tl_idx, kit.kerb + 4.8)
        tz_b = max(height_at(tx_b, ty_b), s[tl_idx]["z"] - 0.1)
        B["steel"].box((tx_b, ty_b, tz_b + 0.15), (0.14, 0.14, 1.32), tlyaw)
        B["gold"].box((tx_b, ty_b, tz_b + 1.47), (0.58, 0.18, 0.18), tlyaw)
    # Roadside cyclists' votive niche (Capitello alpino) on Passo Pordoi (at=4964 m)
    vt_idx = road.index(4964.0)
    vtyaw = s[vt_idx]["h"]
    vx_p, vy_p, vz_p = kit.P(vt_idx, 0.0, -(kit.kerb + 3.2), -0.1)
    B["stone"].box((vx_p, vy_p, vz_p), (1.05, 0.85, 0.65), vtyaw)
    B["chalet-plaster"].box((vx_p, vy_p, vz_p + 0.65), (0.92, 0.72, 1.35), vtyaw)
    kit.gable(B["larch-aged"], (vx_p, vy_p, vz_p + 2.00), 1.22, 1.02, 0.45, vtyaw)
    # Rider summit stamp-passport posts at Campolongo, Pordoi, Sella & Gardena
    for p in PASSES:
        ps_i = road.index(p["at"] + 3.2)
        psy = s[ps_i]["h"]
        B["larch-warm"].box(kit.P(ps_i, 0.0, -(kit.kerb + 2.35), -0.05), (0.24, 0.24, 1.18), psy)
        B["parasol-red"].box(kit.P(ps_i, 0.0, -(kit.kerb + 2.35), 1.13), (0.34, 0.30, 0.22), psy)
    # Stepped pale-dolomite ceremonial approach avenue to Sacrario Militare del Pordoi
    for st_step in (18.0, 26.0):
        ax_s, ay_s, _ = road.at(sac_idx, -(kit.kerb + st_step))
        B["dolomite-pale"].box((ax_s, ay_s, height_at(ax_s, ay_s) - 0.35), (4.2, 6.5, 0.55), s[sac_idx]["h"])
    # Live 360-panorama summit webcam masts on Passo Sella & Passo Gardena
    for wc_at in (7742.0, 10146.0):
        wc_i = road.index(wc_at)
        B["steel"].box(kit.P(wc_i, 0.0, kit.kerb + 5.2, -0.1), (0.12, 0.12, 4.6), s[wc_i]["h"])
        B["paint"].box(kit.P(wc_i, 0.0, kit.kerb + 5.2, 4.5), (0.28, 0.28, 0.26), 0.0)
    # Companion Giro legends stone plinths flanking the Coppi plaza on Passo Pordoi
    for lg_o in (-3.2, 3.2):
        lx_p = mx + math.cos(p_yaw) * lg_o
        ly_p = my + math.sin(p_yaw) * lg_o
        B["dolomite-pale"].box((lx_p, ly_p, mz + 0.25), (0.72, 0.58, 1.35), p_yaw)
        B["larch-aged"].box((lx_p, ly_p, mz + 1.60), (0.42, 0.36, 0.38), p_yaw)
    # Low dry-stone enclosure wall around Cappella di San Maurizio on Passo Gardena
    B["stone"].box((cx_ch, cy_ch, cz_ch - 0.55), (10.4, 7.6, 0.92), g_yaw)
    # Alta Via delle Dolomiti n. 2 timber trailhead portal on Passo Pordoi (at=4968 m)
    av_i = road.index(4968.0)
    avyaw = s[av_i]["h"] + 1.57
    avx, avy, avz = kit.P(av_i, 0.0, kit.kerb + 5.8, -0.1)
    for av_s in (-1.15, 1.15):
        B["larch-aged"].box((avx + math.cos(avyaw) * av_s, avy + math.sin(avyaw) * av_s, avz), (0.18, 0.18, 2.75), avyaw)
    kit.gable(B["chalet-wood"], (avx, avy, avz + 2.75), 2.85, 0.65, 0.45, avyaw)
    # Corten & amber-LED cyclist altitude/temperature totem on Passo Sella (at=7754 m)
    tt_i = road.index(7754.0)
    ttyaw = s[tt_i]["h"]
    B["larch-aged"].box(kit.P(tt_i, 0.0, kit.kerb + 2.55, -0.1), (0.28, 0.68, 2.35), ttyaw)
    B["bulb"].box(kit.P(tt_i, -0.02, kit.kerb + 2.55, 1.72), (0.30, 0.52, 0.24), ttyaw)
    # Sculpted wooden alpine eagle crest crowning the Passo Gardena summit sign
    gd_s = road.index(10150.0)
    B["larch-warm"].box(kit.P(gd_s, 6.0, -(kit.kerb + 2.5), 3.42), (0.85, 0.24, 0.42), s[gd_s]["h"])
    # Green laurel & Giro pink floral tribute wreath at the foot of the Coppi obelisk
    B["foliage"].box((mx - math.sin(p_yaw) * -0.95, my + math.cos(p_yaw) * -0.95, mz + 0.26), (0.68, 0.68, 0.16), p_yaw)
    B["accent-2"].box((mx - math.sin(p_yaw) * -0.95, my + math.cos(p_yaw) * -0.95, mz + 0.42), (0.34, 0.34, 0.08), p_yaw)
    # Triassic Dolomite reef geology specimen boulder & plaque on Passo Campolongo (at=2104 m)
    geo_i = road.index(2104.0)
    geoy = s[geo_i]["h"]
    B["dolomite-pale"].box(kit.P(geo_i, 0.0, kit.kerb + 3.6, -0.15), (1.35, 1.05, 1.15), geoy + 0.35)
    B["gold"].box(kit.P(geo_i, -0.05, kit.kerb + 3.1, 0.55), (0.48, 0.12, 0.34), geoy)
    # Slatted timber alpine snow-drift fences on the wind-scoured Passo Sella saddle
    for sf_d in (7695.0, 7708.0, 7805.0, 7818.0):
        sf_i = road.index(sf_d)
        B["larch-aged"].box(kit.P(sf_i, 0.0, kit.kerb + 6.8, -0.1), (9.5, 0.14, 1.45), s[sf_i]["h"] + 0.18)
    # Red-and-white 'ULTIMO KM' summit approach pennants 250 m below each pass
    for p in PASSES:
        uk_i = road.index(p["at"] - 250.0)
        uky = s[uk_i]["h"]
        B["steel"].box(kit.P(uk_i, 0.0, -(kit.kerb + 1.55), -0.1), (0.09, 0.09, 3.25), uky)
        B["parasol-red"].box(kit.P(uk_i, 0.0, -(kit.kerb + 1.25), 2.55), (0.08, 0.65, 0.65), uky)
    # Notched Dolomite wheel-cradle plinths beside the 4 summit signs for solo bike photos
    for p in PASSES:
         idx_s = road.index(p["at"])
         B["dolomite-pale"].box(kit.P(idx_s, 4.0, -(kit.kerb + 1.95), -0.05), (0.85, 0.34, 0.24), s[idx_s]["h"])
    # Gilded bronze devotional relief beside Cappella di San Maurizio's portal
    B["gold"].box((bx_t - math.cos(g_yaw) * 1.05, by_t - math.sin(g_yaw) * 1.05, cz_ch + 1.55), (0.08, 0.42, 0.55), g_yaw)
    # [ANCHOR:passes]
