"""Detail 1 (sella-massif): Central Sella group limestone fortress, Sass Pordoi, Sella Towers, Piz Boè."""

from __future__ import annotations

import math
import random

from . import mix, quad_shaded, rock_tower, smoothstep, srgb, tri_shaded


def default_rock_colour_fn(az_sun: float):
    sun_dx, sun_dy = math.cos(az_sun), math.sin(az_sun)
    base_col = srgb(0xC9C0B2)
    gold_col = srgb(0xF6B38A)
    rose_col = srgb(0xF2846E)
    shade_col = srgb(0x52607A)
    snow_col = srgb(0xEEF2F8)

    def colour_at(nx: float, ny: float, nz: float, z: float, snow: bool = False):
        if snow:
            lit = max(0.0, nx * sun_dx + ny * sun_dy)
            return mix(srgb(0x9BAAC4), mix(snow_col, rose_col, 0.28), 0.35 + 0.65 * lit)
        dot = nx * sun_dx + ny * sun_dy
        alpenglow = smoothstep(175.0, 520.0, z) * smoothstep(-0.15, 0.75, dot)
        warm = mix(gold_col, rose_col, smoothstep(320.0, 680.0, z))
        lit_base = mix(shade_col, base_col, smoothstep(-0.45, 0.35, dot))
        return mix(lit_base, warm, alpenglow * 0.78)

    return colour_at


def build_sella_massif(peaks, road, cx: float, cy: float, az_sun: float, colour_fn=None) -> None:
    """Builds the central Sella group plateau, Piz Boè (3,152 m), and Sass Pordoi (2,950 m) southern table-cliff."""
    rng = random.Random(13601)
    cfn = colour_fn or default_rock_colour_fn(az_sun)

    sides = 40
    radii = []
    for k in range(sides):
        a = k * math.tau / sides
        flute = 1.0 + 0.14 * math.sin(7 * a + 0.6) + 0.08 * math.cos(13 * a - 1.1) + rng.uniform(-0.035, 0.035)
        radii.append(755.0 * flute)

    tiers = (
        (1.26, 40.0, False),
        (1.00, 155.0, False),
        (0.95, 390.0, False),
        (0.82, 415.0, True),
        (0.76, 610.0, False),
        (0.42, 665.0, True),
    )
    rings = []
    for scale_r, z_lvl, _ in tiers:
        ring = []
        for k in range(sides):
            a = k * math.tau / sides
            rk = radii[k] * scale_r
            jitter_z = z_lvl + (18.0 * math.sin(9 * a + z_lvl * 0.02) if z_lvl > 100 else 0.0)
            ring.append((cx + math.cos(a) * rk, cy + math.sin(a) * rk, jitter_z))
        rings.append(ring)

    for t_idx in range(len(tiers) - 1):
        r_lo, r_hi = rings[t_idx], rings[t_idx + 1]
        z_mid = 0.5 * (tiers[t_idx][1] + tiers[t_idx + 1][1])
        is_snow = tiers[t_idx + 1][2] and (tiers[t_idx + 1][1] - tiers[t_idx][1] < 40.0)
        for k in range(sides):
            u = (k + 1) % sides
            quad_shaded(peaks, r_lo[k], r_lo[u], r_hi[u], r_hi[k], cfn, z_mid, snow=is_snow)

    # Piz Boè (3,152 m) summit pyramid + Capanna Piz Fassa crown block
    apex = (cx + 42.0, cy - 28.0, 795.0)
    top_ring = rings[-1]
    for k in range(sides):
        u = (k + 1) % sides
        tri_shaded(peaks, top_ring[k], top_ring[u], apex, cfn, 735.0, snow=(k % 3 == 0))

    # Sass Pordoi (2,950 m — "Terrace of the Dolomites"): colossal flat-topped bastion jutting toward Passo Pordoi
    pordoi_pt = road.s[road.index(4950.0)]
    dx, dy = pordoi_pt["x"] - cx, pordoi_pt["y"] - cy
    dist_p = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / dist_p, dy / dist_p
    px_perp, py_perp = -uy, ux
    sp_x = cx + ux * 740.0 - px_perp * 90.0
    sp_y = cy + uy * 740.0 - py_perp * 90.0
    yaw_sp = math.atan2(uy, ux)
    rock_tower(peaks, sp_x, sp_y, 125.0, 585.0, 145.0, 195.0, 14, yaw_sp, cfn, taper=0.86, flat_cap=True, seed_phase=1.2)

    # Forcella Pordoi (2,848 m) steep scree & snow couloir beside Sass Pordoi
    fc_x = cx + ux * 705.0 + px_perp * 115.0
    fc_y = cy + uy * 705.0 + py_perp * 115.0
    chute_lo_l = (fc_x - px_perp * 38.0 + ux * 110.0, fc_y - py_perp * 38.0 + uy * 110.0, 145.0)
    chute_lo_r = (fc_x + px_perp * 38.0 + ux * 110.0, fc_y + py_perp * 38.0 + uy * 110.0, 145.0)
    chute_hi_r = (fc_x + px_perp * 16.0 - ux * 30.0, fc_y + py_perp * 16.0 - uy * 30.0, 515.0)
    chute_hi_l = (fc_x - px_perp * 16.0 - ux * 30.0, fc_y - py_perp * 16.0 - uy * 30.0, 515.0)
    quad_shaded(peaks, chute_lo_l, chute_lo_r, chute_hi_r, chute_hi_l, cfn, 340.0, snow=True)
