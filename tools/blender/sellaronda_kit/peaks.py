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
