"""Detail 9 (cyclists-motorbikes): Sellaronda Bike Day cyclists, touring motorbikes, spectators & paragliders."""

from __future__ import annotations

import math

from . import PASSES


def _road_cyclist(B, x: float, y: float, z: float, yaw: float, jersey_mat: str, standing: bool = False) -> None:
    """Builds a crisp low-poly road bike + cyclist silhouette for roadside pelotons & summit gatherings."""
    ca, sa = math.cos(yaw), math.sin(yaw)
    # Front & rear deep-section wheels + diamond carbon frame
    for w_off in (-0.52, 0.52):
        B["dark"].box((x + ca * w_off, y + sa * w_off, z + 0.02), (0.64, 0.08, 0.64), yaw)
    B["steel"].box((x, y, z + 0.42), (0.98, 0.07, 0.46), yaw)
    # Rider legs, bib shorts, jersey trunk & aero road helmet
    hip_z = z + (0.94 if standing else 0.82)
    B["dark"].box((x - ca * 0.12, y - sa * 0.12, z + 0.48), (0.24, 0.28, 0.44), yaw)
    B[jersey_mat].box((x + ca * 0.08, y + sa * 0.08, hip_z), (0.52, 0.34, 0.42), yaw)
    B["paint"].box((x + ca * 0.34, y + sa * 0.34, hip_z + 0.34), (0.26, 0.22, 0.22), yaw)


def build_bikeday_life(B, kit, road, height_at, rng) -> None:
    """Populates the passes with Sellaronda Bike Day road cyclists and summit photo groups."""
    s = road.s
    jerseys = ("crowd-0", "crowd-1", "crowd-2", "crowd-3", "crowd-4", "ladin-blue", "parasol-red")

    # 1. Climbing strings of recreational Bike Day cyclists along the outer verge of all four pass climbs
    for p in PASSES:
        d = p["climb_from"] + 90.0
        c_num = 0
        while d < p["at"] - 40.0:
            idx = road.index(d)
            yaw = s[idx]["h"]
            # Keep cyclists near the outer shoulder (right-hand side = negative left offset) clear of racing lanes!
            off = -(ROAD_SHOULDER := (kit.kerb - 0.55)) + rng.uniform(-0.35, 0.15)
            cx_c, cy_c, cz_c = road.at(idx, off)
            standing = s[idx]["g"] > 5.8 or (c_num % 3 == 0)
            _road_cyclist(B, cx_c, cy_c, cz_c, yaw, jerseys[c_num % len(jerseys)], standing=standing)
            c_num += 1
            d += rng.uniform(52.0, 96.0)

        # 2. Summit photo cluster: cyclists celebrating & holding a bike aloft beside each pass sign!
        s_idx = road.index(p["at"])
        s_yaw = s[s_idx]["h"] + 1.35
        for k_c in range(4):
            px_c, py_c, pz_c = kit.P(s_idx, 3.2 + k_c * 1.45, -(kit.kerb + 1.85), 0.0)
            _road_cyclist(B, px_c, py_c, pz_c, s_yaw + k_c * 0.3, jerseys[(k_c + 2) % len(jerseys)], standing=True)
