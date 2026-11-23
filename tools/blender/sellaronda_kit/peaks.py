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

    # Main Sassolungo / Langkofel blade tower (3,181 m)
    sl_x = sella_pt["x"] + ux * 920.0 - px * 160.0
    sl_y = sella_pt["y"] + uy * 920.0 - py * 160.0
    rock_tower(peaks, sl_x, sl_y, 70.0, 865.0, 290.0, 175.0, 14, yaw_sl + 0.25, cfn, taper=0.44, flat_cap=False, seed_phase=0.8)

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
        (-280.0, 1480.0, 940.0, 260.0, 180.0, 0.5),  # Punta Penia (3,343 m)
        (40.0,   1450.0, 905.0, 250.0, 175.0, 1.7),  # Punta Rocca (3,309 m)
        (350.0,  1490.0, 780.0, 220.0, 160.0, 2.8),  # Serauta (2,962 m)
    ):
        mx = pordoi_pt["x"] + mux * rad_m + mpx * lat_m
        my = pordoi_pt["y"] + muy * rad_m + mpy * lat_m
        rock_tower(peaks, mx, my, 85.0, top_m, rx_m, ry_m, 12, yaw_mm, cfn, taper=0.56, flat_cap=False, seed_phase=ph_m)

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

    # Dark volcanic-green Cresta di Padon / Porta Vescovo ridge in the foreground between Pordoi and Marmolada
    for pad_lat in (-220.0, 0.0, 220.0):
        px0 = pordoi_pt["x"] + mux * 690.0 + mpx * pad_lat
        py0 = pordoi_pt["y"] + muy * 690.0 + mpy * pad_lat
        rock_tower(peaks, px0, py0, 60.0, 310.0, 175.0, 110.0, 9, yaw_mm, cfn, taper=0.65, flat_cap=False, seed_phase=4.1 + pad_lat * 0.01)
