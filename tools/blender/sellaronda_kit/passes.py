"""Detail 2 (four-passes): Passo Campolongo, Pordoi, Sella & Gardena summit signs, monuments & chapels."""

from __future__ import annotations

import math

from . import PASSES


def build_four_passes(B, kit, road, height_at) -> None:
    """Builds trilingual summit signs and summit cairns at all four cols of the Sella Ronda loop."""
    s = road.s
    for p_idx, p in enumerate(PASSES):
        idx = road.index(p["at"])
        yaw = s[idx]["h"]
        # Right-hand summit photo pull-out apron & dressed stone plinth
        B["stone"].box(kit.P(idx, 6.0, -(kit.kerb + 2.6), -0.35), (4.6, 2.4, 0.55), yaw)
        # Twin aged-larch posts
        for along_off in (4.6, 7.4):
            B["larch-aged"].box(kit.P(idx, along_off, -(kit.kerb + 2.5), 0.2), (0.20, 0.20, 3.05), yaw)
        # Main brown road-authority summit sign panel + white trilingual nameplate + altitude plaque
        B["chalet-wood"].box(kit.P(idx, 6.0, -(kit.kerb + 2.5), 1.75), (3.25, 0.16, 1.28), yaw)
        B["paint"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 2.38), (2.95, 0.05, 0.44), yaw)
        B["ladin-blue"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 1.98), (2.95, 0.05, 0.26), yaw)
        B["yellow"].box(kit.P(idx, 6.0, -(kit.kerb + 2.39), 1.78), (1.35, 0.05, 0.16), yaw)
        # Pitched larch shingle weather-hood cap over the summit board
        kit.gable(B["larch-aged"], kit.P(idx, 6.0, -(kit.kerb + 2.5), 3.03), 3.55, 0.68, 0.38, yaw)
        # Opposite-side secondary direction & altitude fingerpost
        B["steel"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 0.0), (0.11, 0.11, 2.75), yaw)
        B["ladin-blue"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 2.35), (1.65, 0.08, 0.34), yaw + 0.35)
        B["paint"].box(kit.P(idx, -4.0, kit.kerb + 2.1, 1.95), (1.55, 0.08, 0.30), yaw - 0.25)

    # Fausto Coppi stone memorial obelisk & Giro d'Italia Cima Coppi pink stele on Passo Pordoi (2,239 m)
    pordoi_idx = road.index(4950.0)
    p_yaw = s[pordoi_idx]["h"]
    mx, my, _ = road.at(pordoi_idx, -(kit.kerb + 6.8))
    mz = height_at(mx, my)
    B["stone"].box((mx, my, mz - 0.6), (5.8, 4.4, 0.85), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 0.25), (2.4, 1.5, 1.35), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 1.60), (1.35, 0.95, 3.10), p_yaw)
    B["dolomite-pale"].box((mx, my, mz + 4.70), (0.85, 0.65, 1.15), p_yaw)
    # Bronze Campionissimo relief plaque & bust silhouette
    B["larch-aged"].box((mx - math.sin(p_yaw) * -0.52, my + math.cos(p_yaw) * -0.52, mz + 2.15), (0.75, 0.14, 0.95), p_yaw)
    # Rose-pink Giro Cima Coppi commemorative totem beside the monument
    gx, gy, _ = road.at(pordoi_idx + 4, -(kit.kerb + 4.5))
    gz = height_at(gx, gy)
    B["dark"].box((gx, gy, gz - 0.2), (0.95, 0.65, 0.35), p_yaw)
    B["accent-2"].box((gx, gy, gz + 0.15), (0.62, 0.22, 2.65), p_yaw + 0.2)
