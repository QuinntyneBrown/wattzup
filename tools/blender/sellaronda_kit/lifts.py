"""Detail 6 (ski-lifts): Cable cars, chairlift pylons, aerial ropes & summer-quiet pistes."""

from __future__ import annotations

import math


def _cable_segment(B, p0: tuple[float, float, float], p1: tuple[float, float, float], thickness: float = 0.09, sag: float = 6.0, steps: int = 8) -> None:
    """Draws a catenary steel cable ribbon between two 3D anchor points."""
    pts = []
    for k in range(steps + 1):
        t = k / steps
        x = p0[0] + (p1[0] - p0[0]) * t
        y = p0[1] + (p1[1] - p0[1]) * t
        z = p0[2] + (p1[2] - p0[2]) * t - sag * 4.0 * t * (1.0 - t)
        pts.append((x, y, z))
    for k in range(steps):
        a, b = pts[k], pts[k + 1]
        B["dark"].quad(a, b, (b[0], b[1], b[2] + thickness), (a[0], a[1], a[2] + thickness))


def build_ski_lifts(B, kit, road, height_at, cx: float, cy: float) -> None:
    """Builds the Funivia Sass Pordoi cliff cableway, chairlift pylons & summer-quiet pistes."""
    s = road.s

    # 1. Funivia Sass Pordoi: iconic single-span cable car leaping from Passo Pordoi (at=4950 m) to Sass Pordoi (2,950 m)
    pordoi_idx = road.index(4985.0)
    p_pt = s[pordoi_idx]
    yaw_p = p_pt["h"]
    # Lower valley station on the inside (right-hand Sella side) of Passo Pordoi
    lx, ly, _ = road.at(pordoi_idx, -(kit.kerb + 22.0))
    lz = height_at(lx, ly)
    B["stone"].box((lx, ly, lz - 2.0), (14.0, 10.5, 5.2), yaw_p)
    B["chalet-plaster"].box((lx, ly, lz + 3.2), (14.4, 10.8, 4.4), yaw_p)
    kit.gable(B["roof-slate"], (lx, ly, lz + 7.6), 14.8, 11.2, 2.2, yaw_p)

    # Upper cantilevered cliff-lip station + Rifugio Maria atop Sass Pordoi's 585 m rim!
    dx, dy = p_pt["x"] - cx, p_pt["y"] - cy
    dl = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / dl, dy / dl
    px_p, py_p = -uy, ux
    tx = cx + ux * 855.0 - px_p * 88.0
    ty = cy + uy * 855.0 - py_p * 88.0
    tz = 582.0
    yaw_top = math.atan2(uy, ux)
    B["stone"].box((tx, ty, tz - 6.0), (16.0, 12.0, 9.5), yaw_top)
    B["chalet-plaster"].box((tx, ty, tz + 3.5), (17.5, 13.0, 5.2), yaw_top)
    B["ladin-blue"].box((tx, ty, tz + 8.7), (18.2, 13.6, 1.4), yaw_top)

    # Twin track & haul cables spanning the sheer cliff + red-and-silver Funivia cabin mid-ascent!
    for off_lat in (-2.1, 2.1):
        a0 = (lx + px_p * off_lat, ly + py_p * off_lat, lz + 6.8)
        a1 = (tx + px_p * off_lat, ty + py_p * off_lat, tz + 6.5)
        _cable_segment(B, a0, a1, thickness=0.16, sag=18.0, steps=10)

    t_cab = 0.44
    cx_cab = lx + (tx - lx) * t_cab - px_p * 2.1
    cy_cab = ly + (ty - ly) * t_cab - py_p * 2.1
    cz_cab = (lz + 6.8) + ((tz + 6.5) - (lz + 6.8)) * t_cab - 18.0 * 4.0 * t_cab * (1.0 - t_cab)
    B["steel"].box((cx_cab, cy_cab, cz_cab - 3.2), (0.35, 0.35, 3.2), yaw_top)
    B["parasol-red"].box((cx_cab, cy_cab, cz_cab - 6.2), (4.6, 2.8, 3.0), yaw_top)
    B["paint"].box((cx_cab, cy_cab, cz_cab - 4.7), (4.7, 2.9, 1.1), yaw_top)
