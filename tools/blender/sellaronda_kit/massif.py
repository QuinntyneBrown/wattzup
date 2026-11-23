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
        (0.96, 285.0, False),
        (0.92, 302.0, True),
        (0.90, 395.0, False),
        (0.81, 418.0, True),
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

    # Piz Boè (3,152 m) summit pyramid + Capanna Piz Fassa high-altitude refuge crown block
    apex = (cx + 42.0, cy - 28.0, 795.0)
    rock_tower(peaks, apex[0], apex[1], 782.0, 804.0, 14.0, 11.0, 6, 0.4, cfn, taper=0.92, flat_cap=True, seed_phase=0.2)
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

    # Torri del Sella I-IV (2,533 m - 2,696 m): stepped vertical towers directly above Passo Sella (at=7750 m)
    sella_pt = road.s[road.index(7750.0)]
    sdx, sdy = sella_pt["x"] - cx, sella_pt["y"] - cy
    sdist = max(1.0, math.hypot(sdx, sdy))
    sux, suy = sdx / sdist, sdy / sdist
    spx, spy = -suy, sux
    tower_specs = (
        (-155.0, 815.0, 445.0, 58.0, 46.0, 0.4),   # First Sella Tower (2,533 m)
        (-52.0,  785.0, 492.0, 64.0, 52.0, 1.1),   # Second Sella Tower (2,598 m)
        (58.0,   760.0, 548.0, 74.0, 58.0, 2.0),   # Third Sella Tower (2,696 m)
        (162.0,  790.0, 498.0, 56.0, 48.0, 2.9),   # Fourth Sella Tower (2,605 m)
    )
    for lat, rad_out, h_top, rx_t, ry_t, ph in tower_specs:
        tx = cx + sux * rad_out + spx * lat
        ty = cy + suy * rad_out + spy * lat
        rock_tower(peaks, tx, ty, 130.0, h_top, rx_t, ry_t, 10, math.atan2(suy, sux), cfn, taper=0.68, flat_cap=True, seed_phase=ph)

    # Piz Ciavazes (2,828 m) overhanging southwest wall & Cengia dei Camosci ledge (between Pordoi & Sella, at=6650 m)
    ciav_pt = road.s[road.index(6650.0)]
    cdx, cdy = ciav_pt["x"] - cx, ciav_pt["y"] - cy
    cdist = max(1.0, math.hypot(cdx, cdy))
    cux, cuy = cdx / cdist, cdy / cdist
    cpx, cpy = -cuy, cux
    cx_w = cx + cux * 745.0 - cpx * 45.0
    cy_w = cy + cuy * 745.0 - cpy * 45.0
    rock_tower(peaks, cx_w, cy_w, 115.0, 575.0, 155.0, 120.0, 12, math.atan2(cuy, cux), cfn, taper=0.84, flat_cap=True, seed_phase=2.4)
    # Prominent snow-dusted Cengia dei Camosci shelf cutting horizontally across Piz Ciavazes's south face
    shelf_l = (cx_w + cux * 140.0 - cpx * 135.0, cy_w + cuy * 140.0 - cpy * 135.0, 355.0)
    shelf_r = (cx_w + cux * 140.0 + cpx * 135.0, cy_w + cuy * 140.0 + cpy * 135.0, 355.0)
    shelf_in_r = (cx_w + cux * 95.0 + cpx * 125.0, cy_w + cuy * 95.0 + cpy * 125.0, 372.0)
    shelf_in_l = (cx_w + cux * 95.0 - cpx * 125.0, cy_w + cuy * 95.0 - cpy * 125.0, 372.0)
    quad_shaded(peaks, shelf_l, shelf_r, shelf_in_r, shelf_in_l, cfn, 362.0, snow=True)

    # Val Lasties canyon jaws (at=6250 m) & Le Mëisules / Mesules (2,999 m) northern cliff rampart (at=9550 m)
    last_pt = road.s[road.index(6250.0)]
    ldx, ldy = last_pt["x"] - cx, last_pt["y"] - cy
    ldist = max(1.0, math.hypot(ldx, ldy))
    lux, luy = ldx / ldist, ldy / ldist
    lpx, lpy = -luy, lux
    for jaw_sign, jaw_h in ((-1.0, 495.0), (1.0, 520.0)):
        jx = cx + lux * 720.0 + lpx * (125.0 * jaw_sign)
        jy = cy + luy * 720.0 + lpy * (125.0 * jaw_sign)
        rock_tower(peaks, jx, jy, 105.0, jaw_h, 92.0, 80.0, 10, math.atan2(luy, lux), cfn, taper=0.72, flat_cap=True, seed_phase=3.2 + jaw_sign)

    mes_pt = road.s[road.index(9550.0)]
    mdx, mdy = mes_pt["x"] - cx, mes_pt["y"] - cy
    mdist = max(1.0, math.hypot(mdx, mdy))
    mux, muy = mdx / mdist, mdy / mdist
    mpx, mpy = -muy, mux
    for b_idx, lat_b in enumerate((-180.0, -55.0, 75.0, 195.0)):
        bx = cx + mux * 760.0 + mpx * lat_b
        by = cy + muy * 760.0 + mpy * lat_b
        rock_tower(peaks, bx, by, 120.0, 615.0 - b_idx * 16.0, 95.0, 76.0, 10, math.atan2(muy, mux), cfn, taper=0.80, flat_cap=True, seed_phase=0.9 + b_idx)

    # Cima Pisciadù (2,985 m), Val Setus snow cleft & silver Cascata del Pisciadù waterfall above Colfosco (at=10750 m)
    pis_pt = road.s[road.index(10750.0)]
    pdx, pdy = pis_pt["x"] - cx, pis_pt["y"] - cy
    pdist = max(1.0, math.hypot(pdx, pdy))
    pux, puy = pdx / pdist, pdy / pdist
    ppx, ppy = -puy, pux
    rock_tower(peaks, cx + pux * 735.0 - ppx * 95.0, cy + puy * 735.0 - ppy * 95.0, 110.0, 610.0, 130.0, 105.0, 12, math.atan2(puy, pux), cfn, taper=0.66, flat_cap=False, seed_phase=4.4)
    # Cascata del Pisciadù bright white-silver waterfall ribbon plunging down the lower limestone cliff!
    wf_x, wf_y = cx + pux * 865.0 + ppx * 35.0, cy + puy * 865.0 + ppy * 35.0
    for seg_w in range(4):
        z0 = 115.0 + seg_w * 68.0
        z1 = z0 + 68.0
        in0 = seg_w * 18.0
        in1 = (seg_w + 1) * 18.0
        quad_shaded(
            peaks,
            (wf_x - pux * in0 - ppx * 7.5, wf_y - puy * in0 - ppy * 7.5, z0),
            (wf_x - pux * in0 + ppx * 7.5, wf_y - puy * in0 + ppy * 7.5, z0),
            (wf_x - pux * in1 + ppx * 5.2, wf_y - puy * in1 + ppy * 5.2, z1),
            (wf_x - pux * in1 - ppx * 5.2, wf_y - puy * in1 - ppy * 5.2, z1),
            cfn,
            0.5 * (z0 + z1),
            snow=True,
        )

    # Murfrëit & Piz Miara eastern Sella cliffs towering over Corvara & Campolongo approach (at=1250 m)
    mur_pt = road.s[road.index(1250.0)]
    mdx2, mdy2 = mur_pt["x"] - cx, mur_pt["y"] - cy
    md2 = max(1.0, math.hypot(mdx2, mdy2))
    mux2, muy2 = mdx2 / md2, mdy2 / md2
    mpx2, mpy2 = -muy2, mux2
    for m_k, (lat_m, h_m, rx_m) in enumerate(((-135.0, 545.0, 105.0), (15.0, 580.0, 118.0), (155.0, 535.0, 96.0))):
        rock_tower(peaks, cx + mux2 * 745.0 + mpx2 * lat_m, cy + muy2 * 745.0 + mpy2 * lat_m, 95.0, h_m, rx_m, 82.0, 10, math.atan2(muy2, mux2), cfn, taper=0.76, flat_cap=True, seed_phase=1.8 + m_k)

    # Basal Dolomite talus & scree cones fanning down from the major cliff couloirs
    for cone_at in (1950.0, 4720.0, 5180.0, 6320.0, 7620.0, 9620.0, 10680.0):
        cpt = road.s[road.index(cone_at)]
        ux_c, uy_c = cpt["x"] - cx, cpt["y"] - cy
        ul_c = max(1.0, math.hypot(ux_c, uy_c))
        ux_c, uy_c = ux_c / ul_c, uy_c / ul_c
        px_c, py_c = -uy_c, ux_c
        top_cone = (cx + ux_c * 795.0, cy + uy_c * 795.0, 225.0)
        foot_l = (cx + ux_c * 975.0 - px_c * 88.0, cy + uy_c * 975.0 - py_c * 88.0, 72.0)
        foot_m = (cx + ux_c * 1005.0, cy + uy_c * 1005.0, 66.0)
        foot_r = (cx + ux_c * 975.0 + px_c * 88.0, cy + uy_c * 975.0 + py_c * 88.0, 72.0)
        tri_shaded(peaks, foot_l, foot_m, top_cone, cfn, 145.0, snow=False)
        tri_shaded(peaks, foot_m, foot_r, top_cone, cfn, 145.0, snow=False)
