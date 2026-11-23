"""Detail 3 (hairpin-ribbons): Tight numbered switchbacks, masonry retaining walls, guardrails & signs."""

from __future__ import annotations

import math

from . import PASSES


def build_hairpin_furniture(B, kit, road, height_at) -> None:
    """Builds dry-stone switchback retaining walls visible across slopes below, stone parapets & guardrails."""
    s = road.s
    for i in range(5, kit.n - 5):
        k_val = s[i]["k"]
        abs_k = abs(k_val)
        z_val = s[i]["z"]
        # Guardrails along outer drop-offs and high-altitude stretches
        if abs_k > 1 / 105 or z_val > 68.0:
            outside = 1.0 if k_val < 0 else -1.0
            kit.fence(i, (kit.kerb + 0.88) * outside, 0.95)

        # Every 2 samples (~8 m) on tight switchback bends, build battered Dolomite masonry retaining wall below road!
        if abs_k > 1 / 88 and i % 2 == 0:
            outside = 1.0 if k_val < 0 else -1.0
            yaw = s[i]["h"]
            wx, wy, wz = road.at(i, (kit.kerb + 1.35) * outside)
            B["stone"].box((wx, wy, wz - 4.4), (8.4, 1.35, 4.45), yaw)
            # Low dressed-stone parapet coping & drainage weep-blocks along the apex rim
            if abs_k > 1 / 62 and i % 4 == 0:
                B["dolomite-pale"].box((wx, wy, wz + 0.02), (3.4, 0.52, 0.62), yaw)

    # Detect switchback curvature peaks (Tornante 1..28+) along the four climbs & descents
    tornante_num = 0
    last_i = -30
    for i in range(18, kit.n - 18):
        ak = abs(s[i]["k"])
        if ak > 1 / 78 and ak >= abs(s[i - 2]["k"]) and ak >= abs(s[i + 2]["k"]) and (i - last_i) >= 18:
            tornante_num += 1
            last_i = i
            outside = 1.0 if s[i]["k"] < 0 else -1.0
            yaw = s[i]["h"] + (0.42 if outside > 0 else -0.42)
            off = (kit.kerb + 1.85) * outside
            # Galvanized post + blue/white Italian alpine Tornante plaque
            B["steel"].box(kit.P(i, 0.0, off, -0.2), (0.10, 0.10, 2.25), yaw)
            B["ladin-blue"].box(kit.P(i, 0.0, off, 1.58), (0.08, 1.05, 0.44), yaw)
            B["paint"].box(kit.P(i, 0.0, off, 1.24), (0.09, 1.05, 0.34), yaw)
            # Red/white apex reflector bollards flanking the switchback
            for d_step in (-3, 3):
                j = max(4, min(kit.n - 5, i + d_step))
                B["paint"].box(kit.P(j, 0.0, (kit.kerb + 1.15) * outside, -0.1), (0.14, 0.14, 0.95), s[j]["h"])
                B["kerb-red"].box(kit.P(j, 0.0, (kit.kerb + 1.15) * outside, 0.62), (0.16, 0.16, 0.22), s[j]["h"])

    # Concrete avalanche & rockfall protection half-galleries (gallerie paramassi) on Pordoi & Gardena cliff stretches
    for gal_start, gal_end in ((4560.0, 4648.0), (9660.0, 9740.0)):
        i0, i1 = road.index(gal_start), road.index(gal_end)
        for idx in range(i0, i1 + 1, 2):
            yaw = s[idx]["h"]
            # Uphill (right-hand Sella cliff side = negative left) solid retaining wall
            B["stone"].box(kit.P(idx, 0.0, -(kit.kerb + 1.45), -0.3), (8.4, 1.15, 5.45), yaw)
            # Overhead concrete avalanche roof slab spanning the carriageways
            B["dolomite-pale"].box(kit.P(idx, 0.0, 0.0, 4.95), (8.4, (kit.kerb + 1.65) * 2.0, 0.62), yaw)
            # Valley-side open concrete pillars framing the panoramic view + red/white portal stripes at ends
            B["dolomite-pale"].box(kit.P(idx, 0.0, kit.kerb + 1.15, -0.3), (0.75, 0.75, 5.25), yaw)
            if idx in (i0, i1 - (i1 - i0) % 2):
                B["parasol-red"].box(kit.P(idx, 0.0, kit.kerb + 1.15, 1.2), (0.80, 0.80, 0.55), yaw)

    # 3-board black-and-yellow mountain chevron clusters around tightest curves + stone torrent culvert parapets
    for i in range(22, kit.n - 22, 6):
        if abs(s[i]["k"]) > 1 / 56:
            outside = 1.0 if s[i]["k"] < 0 else -1.0
            yaw = s[i]["h"] + (0.35 if outside > 0 else -0.35)
            off = (kit.kerb + 1.55) * outside
            B["steel"].box(kit.P(i, 0.0, off, -0.1), (0.08, 0.08, 1.75), yaw)
            B["dark"].box(kit.P(i, 0.0, off, 1.15), (0.07, 0.78, 0.58), yaw)
            B["yellow"].box(kit.P(i, -0.02, off, 1.22), (0.08, 0.34, 0.44), yaw)

    for bridge_m in (1280.0, 3840.0, 6820.0, 9380.0):
        b_idx = road.index(bridge_m)
        b_yaw = s[b_idx]["h"]
        for side in (-1.0, 1.0):
            B["stone"].box(kit.P(b_idx, 0.0, (kit.kerb + 0.85) * side, -2.8), (12.0, 0.85, 3.85), b_yaw)
            B["dolomite-pale"].box(kit.P(b_idx, 0.0, (kit.kerb + 0.85) * side, 1.05), (12.4, 0.96, 0.18), b_yaw)
