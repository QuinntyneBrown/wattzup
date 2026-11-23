"""Detail 4 (sassolungo-marmolada): Sassolungo (3,181 m), Marmolada glacier (3,343 m), Cir & Sassongher."""

from __future__ import annotations

import math

from . import quad_shaded, rock_tower, tri_shaded
from .massif import default_rock_colour_fn


def build_surrounding_peaks(peaks, road, cx: float, cy: float, az_sun: float, colour_fn=None) -> None:
    """Builds the iconic Dolomite ranges ringing the Sella Ronda loop in the fog-free Peaks group."""
    cfn = colour_fn or default_rock_colour_fn(az_sun)

    # 1. Sassolungo / Langkofel Group (3,181 m) rising across the Passo Sella saddle (at=7750 m, outside of loop)
    sella_pt = road.s[road.index(7750.0)]
    ux, uy = sella_pt["x"] - cx, sella_pt["y"] - cy
    ul = max(1.0, math.hypot(ux, uy))
    ux, uy = ux / ul, uy / ul
    px, py = -uy, ux
    yaw_sl = math.atan2(-uy, -ux)

    # Punta Dantersass / Langkofelkarspitze (2,820 m) inside the northern amphitheatre
    rock_tower(peaks, sella_pt["x"] + ux * 1085.0 + px * 85.0, sella_pt["y"] + uy * 1085.0 + py * 85.0, 95.0, 665.0, 95.0, 82.0, 9, yaw_sl, cfn, taper=0.42, flat_cap=False, seed_phase=5.7)

    # Main Sassolungo / Langkofel blade tower (3,181 m)
    sl_x = sella_pt["x"] + ux * 920.0 - px * 160.0
    sl_y = sella_pt["y"] + uy * 920.0 - py * 160.0
    rock_tower(peaks, sl_x, sl_y, 70.0, 865.0, 290.0, 175.0, 14, yaw_sl + 0.25, cfn, taper=0.44, flat_cap=False, seed_phase=0.8)
    # Spigolo Nord (Pichl North Ridge) prow jutting from Sassolungo toward Selva / Val Gardena
    rock_tower(peaks, sl_x - px * 165.0, sl_y - py * 165.0, 72.0, 785.0, 115.0, 95.0, 9, yaw_sl + 0.45, cfn, taper=0.35, flat_cap=False, seed_phase=1.4)
    # Rifugio Emilio Comici (2,154 m) perched on the green terrace at Sassolungo's northern foot
    rock_tower(peaks, sella_pt["x"] + ux * 680.0 - px * 280.0, sella_pt["y"] + uy * 680.0 - py * 280.0, 142.0, 158.0, 16.0, 11.0, 6, yaw_sl, cfn, taper=0.95, flat_cap=True, seed_phase=0.7)

    # Cinque Dita / Fünffingerspitze (2,996 m) + Grohmannspitze (3,126 m) five-pinnacle cluster
    for f_idx, (lat_f, rad_f, top_f, r_f) in enumerate((
        (110.0, 880.0, 725.0, 82.0),
        (195.0, 910.0, 760.0, 88.0),
        (280.0, 945.0, 790.0, 96.0),
        (365.0, 975.0, 735.0, 78.0),
    )):
        fx = sella_pt["x"] + ux * rad_f + px * lat_f
        fy = sella_pt["y"] + uy * rad_f + py * lat_f
        rock_tower(peaks, fx, fy, 75.0, top_f, r_f, r_f * 0.78, 9, yaw_sl, cfn, taper=0.38, flat_cap=False, seed_phase=1.5 + f_idx)

    # Il Pollice / Daumen (2,960 m) detached thumb pinnacle guarding the Forcella notch
    rock_tower(peaks, sella_pt["x"] + ux * 855.0 + px * 62.0, sella_pt["y"] + uy * 855.0 + py * 62.0, 145.0, 688.0, 44.0, 38.0, 8, yaw_sl, cfn, taper=0.25, flat_cap=False, seed_phase=4.8)

    # Forcella del Sassolungo (2,681 m) steep snow couloir between Sassolungo and Cinque Dita
    nx0, ny0 = sella_pt["x"] + ux * 790.0 + px * 10.0, sella_pt["y"] + uy * 790.0 + py * 10.0
    quad_shaded(
        peaks,
        (nx0 - px * 48.0, ny0 - py * 48.0, 135.0),
        (nx0 + px * 48.0, ny0 + py * 48.0, 135.0),
        (nx0 + px * 22.0 + ux * 120.0, ny0 + py * 22.0 + uy * 120.0, 520.0),
        (nx0 - px * 22.0 + ux * 120.0, ny0 - py * 22.0 + uy * 120.0, 520.0),
        cfn,
        340.0,
        snow=True,
    )
    # Rifugio Toni Demetz (2,685 m) perched squarely inside the Forcella del Sassolungo saddle!
    rock_tower(peaks, nx0 + ux * 115.0, ny0 + uy * 115.0, 514.0, 530.0, 11.0, 8.5, 6, yaw_sl, cfn, taper=0.95, flat_cap=True, seed_phase=0.3)

    # Innerkoflerturm (3,098 m) & Dente del Sassolungo / Zahnkofel (3,001 m) sharp bridge needles
    for z_idx, (lat_z, rad_z, top_z) in enumerate(((435.0, 1020.0, 755.0), (498.0, 1075.0, 738.0))):
        zx = sella_pt["x"] + ux * rad_z + px * lat_z
        zy = sella_pt["y"] + uy * rad_z + py * lat_z
        rock_tower(peaks, zx, zy, 68.0, top_z, 68.0, 56.0, 8, yaw_sl - 0.15, cfn, taper=0.28, flat_cap=False, seed_phase=6.2 + z_idx)

    # Steep ice gully between Zahnkofel and Sasso Piatto
    gx0, gy0 = sella_pt["x"] + ux * 1060.0 + px * 515.0, sella_pt["y"] + uy * 1060.0 + py * 515.0
    quad_shaded(
        peaks,
        (gx0 - px * 26.0, gy0 - py * 26.0, 165.0),
        (gx0 + px * 26.0, gy0 + py * 26.0, 165.0),
        (gx0 + px * 10.0 + ux * 85.0, gy0 + py * 10.0 + uy * 85.0, 585.0),
        (gx0 - px * 10.0 + ux * 85.0, gy0 - py * 10.0 + uy * 85.0, 585.0),
        cfn,
        375.0,
        snow=True,
    )

    # Sasso Piatto / Plattkofel (2,969 m): unmistakable broad tilted west-sloping table mountain beyond Cinque Dita
    sp_x = sella_pt["x"] + ux * 1140.0 + px * 560.0
    sp_y = sella_pt["y"] + uy * 1140.0 + py * 560.0
    rock_tower(peaks, sp_x, sp_y, 60.0, 695.0, 280.0, 210.0, 12, yaw_sl - 0.35, cfn, taper=0.72, flat_cap=True, seed_phase=3.4)

    # 2. Marmolada (3,343 m — Queen of the Dolomites) & Ghiacciaio della Marmolada south of Passo Pordoi (at=4950 m)
    pordoi_pt = road.s[road.index(4950.0)]
    mux, muy = pordoi_pt["x"] - cx, pordoi_pt["y"] - cy
    mul = max(1.0, math.hypot(mux, muy))
    mux, muy = mux / mul, muy / mul
    mpx, mpy = -muy, mux
    yaw_mm = math.atan2(-muy, -mux)

    # Punta Penia (3,343 m), Punta Rocca (3,309 m) & Punta Serauta (2,962 m) summit wall
    for lat_m, rad_m, top_m, rx_m, ry_m, ph_m in (
        (-560.0, 1520.0, 880.0, 210.0, 175.0, 3.6),  # Gran Vernel (3,210 m) pyramid
        (-280.0, 1480.0, 940.0, 260.0, 180.0, 0.5),  # Punta Penia (3,343 m)
        (40.0,   1450.0, 905.0, 250.0, 175.0, 1.7),  # Punta Rocca (3,309 m)
        (225.0,  1470.0, 825.0, 110.0, 95.0,  2.3),  # Pizzo Serauta (3,035 m)
        (350.0,  1490.0, 780.0, 220.0, 160.0, 2.8),  # Serauta (2,962 m)
        (610.0,  1540.0, 810.0, 195.0, 145.0, 3.9),  # Cima Ombretta (3,011 m)
    ):
        mx = pordoi_pt["x"] + mux * rad_m + mpx * lat_m
        my = pordoi_pt["y"] + muy * rad_m + mpy * lat_m
        rock_tower(peaks, mx, my, 85.0, top_m, rx_m, ry_m, 12, yaw_mm, cfn, taper=0.56, flat_cap=False, seed_phase=ph_m)

    # High-altitude Marmolada cableway upper station blocks on Punta Rocca (3,265 m) & Serauta (2,950 m)
    for st_lat, st_rad, st_z in ((40.0, 1435.0, 892.0), (350.0, 1470.0, 768.0)):
        rock_tower(peaks, pordoi_pt["x"] + mux * st_rad + mpx * st_lat, pordoi_pt["y"] + muy * st_rad + mpy * st_lat, st_z - 12.0, st_z + 10.0, 16.0, 12.0, 6, yaw_mm, cfn, taper=0.96, flat_cap=True, seed_phase=1.1)

    # Gleaming northern Ghiacciaio della Marmolada icefield draped across the north slope facing Pordoi!
    gl_cols, gl_rows = 8, 5
    gl_grid = []
    for r_i in range(gl_rows + 1):
        v_frac = r_i / gl_rows  # 0 at lower moraine snout, 1 near summit seracs
        rad_g = 1120.0 + 295.0 * v_frac
        z_g = 365.0 + 495.0 * (v_frac ** 1.08)
        row_pts = []
        for c_i in range(gl_cols + 1):
            u_frac = (c_i / gl_cols) - 0.5
            lat_g = u_frac * (680.0 - 150.0 * v_frac) + 20.0
            undul = 14.0 * math.sin(c_i * 1.4 + r_i * 0.9)
            row_pts.append((
                pordoi_pt["x"] + mux * rad_g + mpx * lat_g,
                pordoi_pt["y"] + muy * rad_g + mpy * lat_g,
                z_g + undul,
            ))
        gl_grid.append(row_pts)
    for r_i in range(gl_rows):
        for c_i in range(gl_cols):
            p00, p10 = gl_grid[r_i][c_i], gl_grid[r_i][c_i + 1]
            p11, p01 = gl_grid[r_i + 1][c_i + 1], gl_grid[r_i + 1][c_i]
            quad_shaded(peaks, p00, p10, p11, p01, cfn, 0.5 * (p00[2] + p11[2]), snow=True)

    # Terminal moraine rubble ridge & protruding rocky nunatak ribs splitting Marmolada's northern icefield
    for rib_lat in (-135.0, 145.0):
        rx_n = pordoi_pt["x"] + mux * 1240.0 + mpx * rib_lat
        ry_n = pordoi_pt["y"] + muy * 1240.0 + mpy * rib_lat
        rock_tower(peaks, rx_n, ry_n, 360.0, 615.0, 42.0, 85.0, 7, yaw_mm, cfn, taper=0.45, flat_cap=False, seed_phase=7.1 + rib_lat * 0.01)

    # Dark volcanic-green Cresta di Padon / Porta Vescovo ridge in the foreground between Pordoi and Marmolada
    for pad_lat in (-220.0, 0.0, 220.0):
        px0 = pordoi_pt["x"] + mux * 690.0 + mpx * pad_lat
        py0 = pordoi_pt["y"] + muy * 690.0 + mpy * pad_lat
        rock_tower(peaks, px0, py0, 60.0, 310.0, 175.0, 110.0, 9, yaw_mm, cfn, taper=0.65, flat_cap=False, seed_phase=4.1 + pad_lat * 0.01)

    # 3. Città dei Sassi ("City of Stones") boulder labyrinth along the Passo Sella saddle (7,350 m .. 8,150 m)
    for b_k in range(28):
        d_b = 7320.0 + b_k * 31.0
        b_pt = road.s[road.index(d_b)]
        b_yaw = b_pt["h"] + b_k * 0.77
        # Place giant pale dolomite landslide blocks on the outer Sassolungo meadow flank (left of road)
        lat_off = 19.0 + (b_k % 5) * 14.5
        bx = b_pt["x"] - math.sin(b_pt["h"]) * lat_off
        by = b_pt["y"] + math.cos(b_pt["h"]) * lat_off
        if road.clear_of_road(bx, by, 14.0, road.index(d_b)):
            bz = b_pt["z"] - 1.5 + (b_k % 4) * 1.8
            sz = 4.2 + (b_k % 5) * 2.6
            rock_tower(peaks, bx, by, bz - 3.0, bz + sz, sz * 0.95, sz * 0.72, 6, b_yaw, cfn, taper=0.68, flat_cap=True, seed_phase=b_k * 0.9)

    # 4. Lago Fedaia (2,054 m) turquoise glacial reservoir & Diga del Fedaia concrete dam at the foot of Marmolada
    lake_cx = pordoi_pt["x"] + mux * 970.0 + mpx * 15.0
    lake_cy = pordoi_pt["y"] + muy * 970.0 + mpy * 15.0
    lake_z = 268.0
    turquoise = (0.14, 0.38, 0.48, 1.0)
    dam_grey = (0.62, 0.61, 0.58, 1.0)

    def _flat_quad(p0, p1, p2, p3, col_rgba):
        base_i = len(peaks.verts)
        for p in (p0, p1, p2, p3):
            peaks.verts.append(p)
            peaks.colours.append(col_rgba)
        peaks.faces.append((base_i, base_i + 1, base_i + 2, base_i + 3))

    _flat_quad(
        (lake_cx - mux * 110.0 - mpx * 290.0, lake_cy - muy * 110.0 - mpy * 290.0, lake_z),
        (lake_cx - mux * 110.0 + mpx * 290.0, lake_cy - muy * 110.0 + mpy * 290.0, lake_z),
        (lake_cx + mux * 125.0 + mpx * 260.0, lake_cy + muy * 125.0 + mpy * 260.0, lake_z),
        (lake_cx + mux * 125.0 - mpx * 260.0, lake_cy + muy * 125.0 - mpy * 260.0, lake_z),
        turquoise,
    )
    # Western concrete buttress dam wall retaining Lago Fedaia
    _flat_quad(
        (lake_cx - mux * 95.0 + mpx * 285.0, lake_cy - muy * 95.0 + mpy * 285.0, lake_z - 38.0),
        (lake_cx + mux * 115.0 + mpx * 255.0, lake_cy + muy * 115.0 + mpy * 255.0, lake_z - 38.0),
        (lake_cx + mux * 115.0 + mpx * 255.0, lake_cy + muy * 115.0 + mpy * 255.0, lake_z + 4.0),
        (lake_cx - mux * 95.0 + mpx * 285.0, lake_cy - muy * 95.0 + mpy * 285.0, lake_z + 4.0),
        dam_grey,
    )
    rock_tower(peaks, lake_cx + mux * 120.0 + mpx * 270.0, lake_cy + muy * 120.0 + mpy * 270.0, lake_z, lake_z + 18.0, 18.0, 12.0, 6, yaw_mm, cfn, taper=0.95, flat_cap=True, seed_phase=0.6)

    # 5. Gruppo del Cir (Grande Cir 2,592 m & Piccolo Cir) jagged sawtooth spires north of Passo Gardena (at=10150 m)
    gar_pt = road.s[road.index(10150.0)]
    gux, guy = gar_pt["x"] - cx, gar_pt["y"] - cy
    gul = max(1.0, math.hypot(gux, guy))
    gux, guy = gux / gul, guy / gul
    gpx, gpy = -guy, gux
    for c_k, (lat_c, rad_c, top_c, r_c) in enumerate((
        (-210.0, 620.0, 580.0, 95.0),  # Piccolo Cir
        (-75.0,  660.0, 645.0, 125.0), # Grande Cir (2,592 m)
        (85.0,   640.0, 595.0, 105.0), # Sas da Ciampac
        (230.0,  670.0, 560.0, 92.0),  # Puez spur
    )):
        cx_p = gar_pt["x"] + gux * rad_c + gpx * lat_c
        cy_p = gar_pt["y"] + guy * rad_c + gpy * lat_c
        rock_tower(peaks, cx_p, cy_p, 65.0, top_c, r_c, r_c * 0.72, 9, math.atan2(-guy, -gux), cfn, taper=0.34, flat_cap=False, seed_phase=2.2 + c_k)

    # Puez-Odle high plateau & Piz Duleda (2,909 m) rising behind Gruppo del Cir
    for pz_lat, pz_top in ((-160.0, 725.0), (165.0, 742.0)):
        rock_tower(peaks, gar_pt["x"] + gux * 1180.0 + gpx * pz_lat, gar_pt["y"] + guy * 1180.0 + gpy * pz_lat, 55.0, pz_top, 240.0, 165.0, 10, math.atan2(-guy, -gux), cfn, taper=0.74, flat_cap=True, seed_phase=4.6 + pz_lat * 0.01)

    # 6. Sassongher (2,665 m): dramatic isolated limestone horn towering directly behind Corvara & Colfosco!
    cor_pt = road.s[road.index(260.0)]
    sux2, suy2 = cor_pt["x"] - cx, cor_pt["y"] - cy
    sul2 = max(1.0, math.hypot(sux2, suy2))
    sux2, suy2 = sux2 / sul2, suy2 / sul2
    sx_h = cor_pt["x"] + sux2 * 820.0 - (-suy2) * 180.0
    sy_h = cor_pt["y"] + suy2 * 820.0 - sux2 * 180.0
    rock_tower(peaks, sx_h, sy_h, 35.0, 710.0, 215.0, 175.0, 12, math.atan2(-suy2, -sux2), cfn, taper=0.32, flat_cap=False, seed_phase=5.3)

    # 7. Col Rodella (2,484 m) rocky bluff southwest of Passo Sella (at=7150 m)
    rod_pt = road.s[road.index(7150.0)]
    rux, ruy = rod_pt["x"] - cx, rod_pt["y"] - cy
    rul = max(1.0, math.hypot(rux, ruy))
    rux, ruy = rux / rul, ruy / rul
    rock_tower(peaks, rod_pt["x"] + rux * 540.0, rod_pt["y"] + ruy * 540.0, 65.0, 465.0, 165.0, 130.0, 10, math.atan2(-ruy, -rux), cfn, taper=0.58, flat_cap=True, seed_phase=3.9)
    rock_tower(peaks, rod_pt["x"] + rux * 515.0, rod_pt["y"] + ruy * 515.0, 458.0, 476.0, 14.0, 10.0, 6, 0.3, cfn, taper=0.96, flat_cap=True, seed_phase=0.4)

    # 8. Col di Lana (2,452 m) & Monte Sief ridge east of Arabba / Passo Campolongo (at=2850 m)
    cdl_pt = road.s[road.index(2850.0)]
    lux2, luy2 = cdl_pt["x"] - cx, cdl_pt["y"] - cy
    lul2 = max(1.0, math.hypot(lux2, luy2))
    lux2, luy2 = lux2 / lul2, luy2 / lul2
    lpx2, lpy2 = -luy2, lux2
    for l_off, l_top in ((-140.0, 520.0), (130.0, 490.0)):
        rock_tower(peaks, cdl_pt["x"] + lux2 * 780.0 + lpx2 * l_off, cdl_pt["y"] + luy2 * 780.0 + lpy2 * l_off, 45.0, l_top, 185.0, 145.0, 10, math.atan2(-luy2, -lux2), cfn, taper=0.42, flat_cap=False, seed_phase=2.7 + l_off * 0.01)

    # 9. Distant eastern Dolomite giants on the horizon: Tofana di Rozes (3,225 m), Civetta (3,220 m) & Monte Pelmo (3,168 m)
    for d_at, dist_h, top_h, rx_h, flat_h in (
        (1650.0, 2150.0, 885.0, 340.0, True),   # Tofana di Rozes
        (2050.0, 1780.0, 685.0, 195.0, True),   # Monte Averau & Nuvolau
        (2450.0, 2350.0, 860.0, 290.0, True),   # Monte Pelmo ("Caregon del Padreterno")
        (3350.0, 2450.0, 895.0, 360.0, False),  # Monte Civetta northwest wall
    ):
        h_pt = road.s[road.index(d_at)]
        hux, huy = h_pt["x"] - cx, h_pt["y"] - cy
        hul = max(1.0, math.hypot(hux, huy))
        hux, huy = hux / hul, huy / hul
        rock_tower(peaks, h_pt["x"] + hux * dist_h, h_pt["y"] + huy * dist_h, 40.0, top_h, rx_h, rx_h * 0.72, 10, math.atan2(-huy, -hux), cfn, taper=0.62 if flat_h else 0.44, flat_cap=flat_h, seed_phase=d_at * 0.01)

    # 10. Sasso di Santa Croce / Sas dla Crusc (2,907 m) sheer west-facing Enrosadira wall across Val Badia!
    sc_pt = road.s[road.index(820.0)]
    scux, scuy = sc_pt["x"] - cx, sc_pt["y"] - cy
    scul = max(1.0, math.hypot(scux, scuy))
    scux, scuy = scux / scul, scuy / scul
    rock_tower(peaks, sc_pt["x"] + scux * 1680.0, sc_pt["y"] + scuy * 1680.0, 45.0, 815.0, 410.0, 165.0, 12, math.atan2(-scuy, -scux), cfn, taper=0.82, flat_cap=True, seed_phase=1.9)

    # 11. Cima Cunturines (3,064 m) & Piz Lavarella (3,055 m) northeast of Campolongo
    fn_pt = road.s[road.index(1320.0)]
    fnux, fnuy = fn_pt["x"] - cx, fn_pt["y"] - cy
    fnul = max(1.0, math.hypot(fnux, fnuy))
    fnux, fnuy = fnux / fnul, fnuy / fnul
    fnpx, fnpy = -fnuy, fnux
    for fn_lat, fn_top in ((-190.0, 845.0), (185.0, 835.0)):
        rock_tower(peaks, fn_pt["x"] + fnux * 1850.0 + fnpx * fn_lat, fn_pt["y"] + fnuy * 1850.0 + fnpy * fn_lat, 45.0, fn_top, 235.0, 175.0, 10, math.atan2(-fnuy, -fnux), cfn, taper=0.52, flat_cap=False, seed_phase=3.1 + fn_lat * 0.01)

    # 12. Catinaccio / Rosengarten (King Laurin's Rose Garden, 3,002 m) & Torri del Vajolet west of Canazei!
    cat_pt = road.s[road.index(6120.0)]
    ctux2, ctuy2 = cat_pt["x"] - cx, cat_pt["y"] - cy
    ctul2 = max(1.0, math.hypot(ctux2, ctuy2))
    ctux2, ctuy2 = ctux2 / ctul2, ctuy2 / ctul2
    ctpx2, ctpy2 = -ctuy2, ctux2
    for v_idx, (v_lat, v_top, v_rx) in enumerate(((-220.0, 795.0, 185.0), (0.0, 825.0, 140.0), (195.0, 775.0, 165.0))):
        rock_tower(peaks, cat_pt["x"] + ctux2 * 1650.0 + ctpx2 * v_lat, cat_pt["y"] + ctuy2 * 1650.0 + ctpy2 * v_lat, 45.0, v_top, v_rx, v_rx * 0.68, 9, math.atan2(-ctuy2, -ctux2), cfn, taper=0.34, flat_cap=False, seed_phase=2.4 + v_idx)
