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
    rock_tower(peaks, sp_x - ux * 165.0 - px * 95.0, sp_y - uy * 165.0 - py * 95.0, 75.0, 565.0, 95.0, 78.0, 8, yaw_sl - 0.2, cfn, taper=0.48, flat_cap=False, seed_phase=4.0)

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
            undul = 14.0 * math.sin(c_i * 1.4 + r_i * 0.9) + (11.0 if r_i == gl_rows - 1 else 0.0)
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
    for rib_lat in (-135.0, 5.0, 145.0):
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
    fcir_x, fcir_y = gar_pt["x"] + gux * 615.0 - gpx * 145.0, gar_pt["y"] + guy * 615.0 - gpy * 145.0
    quad_shaded(
        peaks,
        (fcir_x - gpx * 22.0, fcir_y - gpy * 22.0, 165.0),
        (fcir_x + gpx * 22.0, fcir_y + gpy * 22.0, 165.0),
        (fcir_x + gpx * 12.0 + gux * 65.0, fcir_y + gpy * 12.0 + guy * 65.0, 445.0),
        (fcir_x - gpx * 12.0 + gux * 65.0, fcir_y - gpy * 12.0 + guy * 65.0, 445.0),
        cfn,
        305.0,
        snow=True,
    )

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
    rock_tower(peaks, sx_h + (-suy2) * 340.0, sy_h + sux2 * 340.0, 45.0, 565.0, 225.0, 155.0, 10, math.atan2(-suy2, -sux2), cfn, taper=0.76, flat_cap=True, seed_phase=6.1)

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

    # Rifugio Emilio Comici (2,154 m) on the green-and-scree bench beneath Sassolungo's northeast wall
    rock_tower(peaks, sl_x - ux * 245.0 - px * 85.0, sl_y - uy * 245.0 - py * 85.0, 155.0, 170.0, 14.0, 10.0, 6, yaw_sl, cfn, taper=0.95, flat_cap=True, seed_phase=0.6)
    # 13. Odle / Geisler needles (Sass Rigais & Furchetta, 3,025 m) on the northern Val Gardena horizon
    od_pt = road.s[road.index(9150.0)]
    odux, oduy = od_pt["x"] - cx, od_pt["y"] - cy
    odul = max(1.0, math.hypot(odux, oduy))
    odux, oduy = odux / odul, oduy / odul
    odpx, odpy = -oduy, odux
    for od_i, od_lat in enumerate((-210.0, -70.0, 75.0, 215.0)):
        rock_tower(peaks, od_pt["x"] + odux * 1680.0 + odpx * od_lat, od_pt["y"] + oduy * 1680.0 + odpy * od_lat, 55.0, 815.0 - abs(od_i - 1.5) * 28.0, 105.0, 72.0, 8, math.atan2(-oduy, -odux), cfn, taper=0.26, flat_cap=False, seed_phase=3.7 + od_i)
    # Rifugio Friedrich August (2,298 m) on the Col Rodella shoulder overlooking Val di Fassa
    rock_tower(peaks, rod_pt["x"] + rux * 455.0 - (-ruy) * 85.0, rod_pt["y"] + ruy * 455.0 - rux * 85.0, 395.0, 412.0, 13.0, 9.5, 6, math.atan2(-ruy, -rux), cfn, taper=0.95, flat_cap=True, seed_phase=1.3)
    # Eastern Fedaia causeway embankment closing the glacial basin
    _flat_quad(
        (lake_cx - mux * 95.0 - mpx * 285.0, lake_cy - muy * 95.0 - mpy * 285.0, lake_z - 12.0),
        (lake_cx + mux * 115.0 - mpx * 255.0, lake_cy + muy * 115.0 - mpy * 255.0, lake_z - 12.0),
        (lake_cx + mux * 115.0 - mpx * 255.0, lake_cy + muy * 115.0 - mpy * 255.0, lake_z + 3.0),
        (lake_cx - mux * 95.0 - mpx * 285.0, lake_cy - muy * 95.0 - mpy * 285.0, lake_z + 3.0),
        dam_grey,
    )
    # Rifugio Sasso Piatto (2,300 m) at the southwestern foot of Sasso Piatto
    rock_tower(peaks, sp_x - ux * 195.0 + px * 145.0, sp_y - uy * 195.0 + py * 145.0, 295.0, 310.0, 14.0, 10.5, 6, yaw_sl, cfn, taper=0.94, flat_cap=True, seed_phase=2.1)
    # 14. Monte Antelao (3,264 m — "King of the Dolomites") far eastern pyramid beyond Campolongo
    ant_pt = road.s[road.index(2050.0)]
    anux, anuy = ant_pt["x"] - cx, ant_pt["y"] - cy
    anul = max(1.0, math.hypot(anux, anuy))
    anux, anuy = anux / anul, anuy / anul
    rock_tower(peaks, ant_pt["x"] + anux * 2580.0, ant_pt["y"] + anuy * 2580.0, 45.0, 912.0, 330.0, 245.0, 10, math.atan2(-anuy, -anux), cfn, taper=0.30, flat_cap=False, seed_phase=4.4)
    # Col Turond (2,423 m) Vallunga entrance bastion northwest of Passo Gardena
    rock_tower(peaks, gar_pt["x"] + gux * 890.0 - gpx * 360.0, gar_pt["y"] + guy * 890.0 - gpy * 360.0, 55.0, 565.0, 145.0, 115.0, 9, math.atan2(-guy, -gux), cfn, taper=0.62, flat_cap=True, seed_phase=5.7)
    # Diagonal snow-filled couloir ribbon on Sassolungo's eastern wall
    quad_shaded(
        peaks,
        (sl_x - ux * 155.0 + px * 75.0, sl_y - uy * 155.0 + py * 75.0, 265.0),
        (sl_x - ux * 155.0 + px * 92.0, sl_y - uy * 155.0 + py * 92.0, 265.0),
        (sl_x - ux * 85.0 + px * 42.0, sl_y - uy * 85.0 + py * 42.0, 695.0),
        (sl_x - ux * 85.0 + px * 32.0, sl_y - uy * 85.0 + py * 32.0, 695.0),
        cfn,
        480.0,
        snow=True,
    )
    # Summit memorial pinnacle crowning Col di Lana (2,452 m)
    rock_tower(peaks, cdl_pt["x"] + lux2 * 780.0 - lpx2 * 140.0, cdl_pt["y"] + luy2 * 780.0 - lpy2 * 140.0, 518.0, 536.0, 6.5, 6.5, 6, 0.0, cfn, taper=0.45, flat_cap=False, seed_phase=0.1)
    # Croda da Lago & Becco di Mezzodì serrated Cortina horizon ridge (at=1920 m)
    cdl2 = road.s[road.index(1920.0)]
    cdux, cduy = cdl2["x"] - cx, cdl2["y"] - cy
    cdul = max(1.0, math.hypot(cdux, cduy))
    cdux, cduy = cdux / cdul, cduy / cdul
    rock_tower(peaks, cdl2["x"] + cdux * 2240.0, cdl2["y"] + cduy * 2240.0, 45.0, 765.0, 210.0, 145.0, 9, math.atan2(-cduy, -cdux), cfn, taper=0.38, flat_cap=False, seed_phase=3.2)
    # Southern Val di Fassa rib of Punta Grohmann (3,126 m) in the Sassolungo group
    rock_tower(peaks, sella_pt["x"] + ux * 1010.0 + px * 285.0, sella_pt["y"] + uy * 1010.0 + py * 285.0, 75.0, 742.0, 76.0, 62.0, 8, yaw_sl + 0.3, cfn, taper=0.40, flat_cap=False, seed_phase=5.0)
    # Pian dei Fiacconi (2,626 m) moraine-bench refuge below Marmolada's northern icefield
    rock_tower(peaks, pordoi_pt["x"] + mux * 1105.0 - mpx * 165.0, pordoi_pt["y"] + muy * 1105.0 - mpy * 165.0, 352.0, 368.0, 14.0, 10.5, 6, yaw_mm, cfn, taper=0.95, flat_cap=True, seed_phase=1.8)
    # Bright Mittagsscharte snow cleft between the Odle / Geisler needles
    od_m = road.s[road.index(9150.0)]
    omx, omy = od_m["x"] - cx, od_m["y"] - cy
    oml = max(1.0, math.hypot(omx, omy))
    omx, omy = omx / oml, omy / oml
    opx, opy = -omy, omx
    quad_shaded(
        peaks,
        (od_m["x"] + omx * 1620.0 - opx * 18.0, od_m["y"] + omy * 1620.0 - opy * 18.0, 240.0),
        (od_m["x"] + omx * 1620.0 + opx * 18.0, od_m["y"] + omy * 1620.0 + opy * 18.0, 240.0),
        (od_m["x"] + omx * 1675.0 + opx * 9.0, od_m["y"] + omy * 1675.0 + opy * 9.0, 685.0),
        (od_m["x"] + omx * 1675.0 - opx * 9.0, od_m["y"] + omy * 1675.0 - opy * 9.0, 685.0),
        cfn,
        460.0,
        snow=True,
    )
    # Rifugio Viel dal Pan (2,432 m) on the panoramic Padon ridge facing Marmolada
    rock_tower(peaks, pordoi_pt["x"] + mux * 675.0 - mpx * 145.0, pordoi_pt["y"] + muy * 675.0 - mpy * 145.0, 298.0, 314.0, 13.5, 9.5, 6, yaw_mm, cfn, taper=0.95, flat_cap=True, seed_phase=0.4)
    # Cima Ombretta (3,011 m) high shoulder between Punta Penia & Gran Vernel
    rock_tower(peaks, pordoi_pt["x"] + mux * 1540.0 - mpx * 430.0, pordoi_pt["y"] + muy * 1540.0 - mpy * 430.0, 90.0, 815.0, 155.0, 125.0, 9, yaw_mm, cfn, taper=0.48, flat_cap=False, seed_phase=2.9)
    # 15. Sass de Putia / Peitlerkofel (2,875 m) solitary northern Val Badia sentinel (at=11180 m)
    put_pt = road.s[road.index(11180.0)]
    ptux, ptuy = put_pt["x"] - cx, put_pt["y"] - cy
    ptul = max(1.0, math.hypot(ptux, ptuy))
    ptux, ptuy = ptux / ptul, ptuy / ptul
    rock_tower(peaks, put_pt["x"] + ptux * 1950.0, put_pt["y"] + ptuy * 1950.0, 45.0, 792.0, 265.0, 195.0, 11, math.atan2(-ptuy, -ptux), cfn, taper=0.50, flat_cap=True, seed_phase=6.4)
    # Daumenscharte high snow pocket between Il Pollice & First Finger of Cinque Dita
    quad_shaded(
        peaks,
        (sella_pt["x"] + ux * 862.0 + px * 78.0, sella_pt["y"] + uy * 862.0 + py * 78.0, 465.0),
        (sella_pt["x"] + ux * 862.0 + px * 98.0, sella_pt["y"] + uy * 862.0 + py * 98.0, 465.0),
        (sella_pt["x"] + ux * 885.0 + px * 92.0, sella_pt["y"] + uy * 885.0 + py * 92.0, 585.0),
        (sella_pt["x"] + ux * 885.0 + px * 82.0, sella_pt["y"] + uy * 885.0 + py * 82.0, 585.0),
        cfn,
        525.0,
        snow=True,
    )
    # Col de Puez (2,725 m) high karst dome crowning the Puez plateau
    rock_tower(peaks, gar_pt["x"] + gux * 1240.0 + gpx * 15.0, gar_pt["y"] + guy * 1240.0 + gpy * 15.0, 520.0, 778.0, 145.0, 115.0, 9, math.atan2(-guy, -gux), cfn, taper=0.58, flat_cap=False, seed_phase=1.1)
    # 16. Cimon della Pala (3,184 m — "Matterhorn of the Dolomites") on the distant southern horizon (Milestone 0600!)
    pal_pt = road.s[road.index(4520.0)]
    plux, pluy = pal_pt["x"] - cx, pal_pt["y"] - cy
    plul = max(1.0, math.hypot(plux, pluy))
    plux, pluy = plux / plul, pluy / plul
    rock_tower(peaks, pal_pt["x"] + plux * 2480.0, pal_pt["y"] + pluy * 2480.0, 50.0, 885.0, 215.0, 145.0, 9, math.atan2(-pluy, -plux), cfn, taper=0.24, flat_cap=False, seed_phase=1.6)
    # Inner Langkofelkar snow-hollow embraced between Sassolungo & Sasso Piatto
    quad_shaded(
        peaks,
        (sp_x - ux * 110.0 - px * 180.0, sp_y - uy * 110.0 - py * 180.0, 385.0),
        (sp_x - ux * 110.0 - px * 110.0, sp_y - uy * 110.0 - py * 110.0, 385.0),
        (sp_x + ux * 65.0 - px * 125.0, sp_y + uy * 65.0 - py * 125.0, 545.0),
        (sp_x + ux * 65.0 - px * 165.0, sp_y + uy * 65.0 - py * 165.0, 545.0),
        cfn,
        465.0,
        snow=True,
    )
    # Eastern flanking buttress of Puez-Odle visible from Passo Gardena
    rock_tower(peaks, gar_pt["x"] + gux * 1360.0 + gpx * 310.0, gar_pt["y"] + guy * 1360.0 + gpy * 310.0, 55.0, 745.0, 165.0, 125.0, 9, math.atan2(-guy, -gux), cfn, taper=0.46, flat_cap=False, seed_phase=4.8)
    # Sasso delle Dodici outlier peak framing lower Val di Fassa
    dod_pt = road.s[road.index(5880.0)]
    ddux, dduy = dod_pt["x"] - cx, dod_pt["y"] - cy
    ddul = max(1.0, math.hypot(ddux, dduy))
    ddux, dduy = ddux / ddul, dduy / ddul
    rock_tower(peaks, dod_pt["x"] + ddux * 1490.0, dod_pt["y"] + dduy * 1490.0, 48.0, 685.0, 175.0, 130.0, 9, math.atan2(-dduy, -ddux), cfn, taper=0.44, flat_cap=False, seed_phase=2.5)
    # Gleaming proglacial meltwater ribbon feeding Lago Fedaia from Marmolada's ice snout
    _flat_quad(
        (lake_cx + mux * 120.0 - mpx * 12.0, lake_cy + muy * 120.0 - mpy * 12.0, lake_z + 2.0),
        (lake_cx + mux * 120.0 + mpx * 12.0, lake_cy + muy * 120.0 + mpy * 12.0, lake_z + 2.0),
        (pordoi_pt["x"] + mux * 1120.0 + mpx * 8.0, pordoi_pt["y"] + muy * 1120.0 + mpy * 8.0, 365.0),
        (pordoi_pt["x"] + mux * 1120.0 - mpx * 8.0, pordoi_pt["y"] + muy * 1120.0 - mpy * 8.0, 365.0),
        turquoise,
    )
    # 17. Punta Sorapiss (3,205 m) eastern Dolomite cirque crown beyond Cortina (at=1450 m)
    sor_pt = road.s[road.index(1450.0)]
    srux, sruy = sor_pt["x"] - cx, sor_pt["y"] - cy
    srul = max(1.0, math.hypot(srux, sruy))
    srux, sruy = srux / srul, sruy / srul
    rock_tower(peaks, sor_pt["x"] + srux * 2420.0, sor_pt["y"] + sruy * 2420.0, 45.0, 875.0, 295.0, 195.0, 10, math.atan2(-sruy, -srux), cfn, taper=0.58, flat_cap=True, seed_phase=2.8)
    # Campanile Wessely rock needle between Cinque Dita & Punta Grohmann
    rock_tower(peaks, sella_pt["x"] + ux * 932.0 + px * 238.0, sella_pt["y"] + uy * 932.0 + py * 238.0, 120.0, 752.0, 38.0, 32.0, 7, yaw_sl, cfn, taper=0.26, flat_cap=False, seed_phase=6.0)
    # Piccolo Vernel (3,098 m) sharp pyramid beside Gran Vernel
    rock_tower(peaks, pordoi_pt["x"] + mux * 1490.0 - mpx * 675.0, pordoi_pt["y"] + muy * 1490.0 - mpy * 675.0, 85.0, 812.0, 135.0, 110.0, 9, yaw_mm, cfn, taper=0.36, flat_cap=False, seed_phase=4.2)
    # Sas Ciampac (2,672 m) northern crag towering above Colfosco & Edelweiss valley
    rock_tower(peaks, gar_pt["x"] + gux * 740.0 + gpx * 355.0, gar_pt["y"] + guy * 740.0 + gpy * 355.0, 55.0, 628.0, 140.0, 108.0, 9, math.atan2(-guy, -gux), cfn, taper=0.42, flat_cap=False, seed_phase=3.5)
    # 18. Croda Rossa d'Ampezzo / Hohe Gaisl (3,146 m) northeastern skyline massif (at=620 m)
    cr_pt = road.s[road.index(620.0)]
    crux, cruy = cr_pt["x"] - cx, cr_pt["y"] - cy
    crul = max(1.0, math.hypot(crux, cruy))
    crux, cruy = crux / crul, cruy / crul
    rock_tower(peaks, cr_pt["x"] + crux * 2280.0, cr_pt["y"] + cruy * 2280.0, 45.0, 845.0, 275.0, 185.0, 10, math.atan2(-cruy, -crux), cfn, taper=0.46, flat_cap=False, seed_phase=5.6)
    # Il Salame del Sassolungo (2,899 m) detached north-ridge tower
    rock_tower(peaks, sl_x - ux * 125.0 - px * 195.0, sl_y - uy * 125.0 - py * 195.0, 140.0, 682.0, 46.0, 44.0, 9, yaw_sl, cfn, taper=0.74, flat_cap=True, seed_phase=3.8)
    # Sasso Vernale (3,058 m) pyramid on the Ombretta-Marmolada crest
    rock_tower(peaks, pordoi_pt["x"] + mux * 1580.0 - mpx * 515.0, pordoi_pt["y"] + muy * 1580.0 - mpy * 515.0, 95.0, 835.0, 130.0, 105.0, 8, yaw_mm, cfn, taper=0.38, flat_cap=False, seed_phase=1.4)
    # Monte Stevia (2,555 m) flat-topped limestone wall directly above Selva di Val Gardena (at=9020 m)
    stv_pt = road.s[road.index(9020.0)]
    stux, stuy = stv_pt["x"] - cx, stv_pt["y"] - cy
    stul = max(1.0, math.hypot(stux, stuy))
    stux, stuy = stux / stul, stuy / stul
    rock_tower(peaks, stv_pt["x"] + stux * 780.0, stv_pt["y"] + stuy * 780.0, 50.0, 585.0, 210.0, 135.0, 10, math.atan2(-stuy, -stux), cfn, taper=0.78, flat_cap=True, seed_phase=2.1)
    # Spillway gate house centered on the crest of Diga del Fedaia
    rock_tower(peaks, lake_cx + mux * 10.0 + mpx * 270.0, lake_cy + muy * 10.0 + mpy * 270.0, lake_z + 3.0, lake_z + 14.0, 12.0, 8.0, 6, yaw_mm, cfn, taper=0.96, flat_cap=True, seed_phase=0.2)
    # 19. Monte Cristallo (3,221 m) twin-horned Cortina massif (at=1120 m)
    crs_pt = road.s[road.index(1120.0)]
    csux, csuy = crs_pt["x"] - cx, crs_pt["y"] - cy
    csul = max(1.0, math.hypot(csux, csuy))
    csux, csuy = csux / csul, csuy / csul
    rock_tower(peaks, crs_pt["x"] + csux * 2360.0, crs_pt["y"] + csuy * 2360.0, 45.0, 868.0, 285.0, 185.0, 10, math.atan2(-csuy, -csux), cfn, taper=0.42, flat_cap=False, seed_phase=4.0)
    # Rifugio Vicenza / Langkofelhütte (2,253 m) inside the Langkofelkar cirque
    rock_tower(peaks, sp_x - ux * 125.0 - px * 145.0, sp_y - uy * 125.0 - py * 145.0, 382.0, 398.0, 13.0, 9.5, 6, yaw_sl, cfn, taper=0.95, flat_cap=True, seed_phase=0.9)
    # Sasso delle Dieci / Sas dles Diesc (3,026 m) crowning the Fanes wall east of Val Badia
    rock_tower(peaks, sc_pt["x"] + scux * 1760.0 - (-scuy) * 320.0, sc_pt["y"] + scuy * 1760.0 - scux * 320.0, 60.0, 848.0, 195.0, 145.0, 9, math.atan2(-scuy, -scux), cfn, taper=0.48, flat_cap=False, seed_phase=2.6)
    # Seceda (2,519 m) tilted cuesta ridge west of the Odle needles
    sec_pt = road.s[road.index(8950.0)]
    scx2, scy2 = sec_pt["x"] - cx, sec_pt["y"] - cy
    scl2 = max(1.0, math.hypot(scx2, scy2))
    scx2, scy2 = scx2 / scl2, scy2 / scl2
    rock_tower(peaks, sec_pt["x"] + scx2 * 1420.0, sec_pt["y"] + scy2 * 1420.0, 50.0, 612.0, 240.0, 135.0, 9, math.atan2(-scy2, -scx2) - 0.35, cfn, taper=0.68, flat_cap=True, seed_phase=5.1)
    # Tiny Capanna Punta Penia (3,343 m) crowning the highest summit of the Dolomites!
    rock_tower(peaks, pordoi_pt["x"] + mux * 1480.0 - mpx * 280.0, pordoi_pt["y"] + muy * 1480.0 - mpy * 280.0, 938.0, 950.0, 10.5, 8.0, 6, yaw_mm, cfn, taper=0.95, flat_cap=True, seed_phase=0.5)
    # 20. Latemar serrated towers (Diamantiditurm, 2,842 m) beyond Val di Fassa (at=6450 m)
    lat_pt = road.s[road.index(6450.0)]
    ltux, ltuy = lat_pt["x"] - cx, lat_pt["y"] - cy
    ltul = max(1.0, math.hypot(ltux, ltuy))
    ltux, ltuy = ltux / ltul, ltuy / ltul
    rock_tower(peaks, lat_pt["x"] + ltux * 2150.0, lat_pt["y"] + ltuy * 2150.0, 45.0, 775.0, 225.0, 155.0, 9, math.atan2(-ltuy, -ltux), cfn, taper=0.38, flat_cap=False, seed_phase=3.3)
    # Punta Dantersass northern spur projecting from Sassolungo toward Selva
    rock_tower(peaks, sl_x + ux * 95.0 - px * 245.0, sl_y + uy * 95.0 - py * 245.0, 95.0, 645.0, 72.0, 56.0, 8, yaw_sl - 0.3, cfn, taper=0.44, flat_cap=False, seed_phase=5.9)
    # [ANCHOR:peaks]
