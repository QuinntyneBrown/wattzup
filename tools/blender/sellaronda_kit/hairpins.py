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
