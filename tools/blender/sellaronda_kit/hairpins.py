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
