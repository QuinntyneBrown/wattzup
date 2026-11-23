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

    # 3. Alpine adventure-touring motorbikes (GS / Multistrada style with panniers & headlamp) at pass aprons & valleys
    moto_colours = ("parasol-red", "ladin-blue", "yellow", "paint")
    for m_idx, p in enumerate(PASSES):
        idx = road.index(p["at"] - 18.0)
        yaw = s[idx]["h"] + 1.15
        for slot in range(4):
            mx, my, mz = kit.P(idx, -2.0 + slot * 1.65, kit.kerb + 2.6, 0.0)
            _touring_motorbike(B, mx, my, mz, yaw, moto_colours[(m_idx + slot) % len(moto_colours)], with_rider=(slot == 0))

    for open_d in (520.0, 2850.0, 5820.0, 8680.0, 11180.0):
        idx = road.index(open_d)
        yaw = s[idx]["h"] + math.pi  # oncoming touring motorbike in opposite outer lane verge
        mx, my, mz = road.at(idx, kit.kerb - 0.85)
        _touring_motorbike(B, mx, my, mz, yaw, moto_colours[int(open_d) % len(moto_colours)], with_rider=True)

    # 4. Giro d'Italia & Sellaronda Bike Day painted road-chalk cheers across upper pass ramps
    for p in PASSES:
        for step_back in (420.0, 260.0, 115.0):
            c_idx = road.index(p["at"] - step_back)
            c_yaw = s[c_idx]["h"] + 0.28
            chalk_mat = "accent-2" if int(step_back) == 260 else "paint"
            for bar_k in range(5):
                lat_b = -2.4 + bar_k * 1.15
                bx_p, by_p, bz_p = road.at(c_idx, lat_b, 0.025)
                B[chalk_mat].box((bx_p, by_p, bz_p), (0.34, 0.78, 0.015), c_yaw)


def _touring_motorbike(B, x: float, y: float, z: float, yaw: float, body_mat: str, with_rider: bool = False) -> None:
    ca, sa = math.cos(yaw), math.sin(yaw)
    # Chunky adventure tyres + engine block + beak fairing
    for w_off in (-0.74, 0.74):
        B["dark"].box((x + ca * w_off, y + sa * w_off, z + 0.02), (0.68, 0.18, 0.66), yaw)
    B["steel"].box((x, y, z + 0.34), (1.42, 0.34, 0.52), yaw)
    B[body_mat].box((x + ca * 0.24, y + sa * 0.24, z + 0.78), (0.95, 0.42, 0.38), yaw)
    # Aluminum side panniers + top case + tall touring screen + glowing twin headlamp
    B["steel"].box((x - ca * 0.52, y - sa * 0.52, z + 0.58), (0.56, 0.86, 0.42), yaw)
    B["paint"].box((x + ca * 0.58, y + sa * 0.58, z + 1.06), (0.12, 0.36, 0.38), yaw)
    B["bulb"].box((x + ca * 0.72, y + sa * 0.72, z + 0.88), (0.08, 0.28, 0.16), yaw)
    if with_rider:
        B["dark"].box((x - ca * 0.05, y - sa * 0.05, z + 0.92), (0.44, 0.42, 0.58), yaw)
        B["paint"].box((x + ca * 0.06, y + sa * 0.06, z + 1.50), (0.28, 0.26, 0.28), yaw)
