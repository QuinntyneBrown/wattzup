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
        flute = 1.0 + 0.14 * math.sin(7 * a + 0.6) + 0.08 * math.cos(13 * a - 1.1) + 0.035 * math.sin(19 * a + 0.4) + rng.uniform(-0.03, 0.03)
        radii.append(755.0 * flute)

    tiers = (
        (1.275, 38.0, False),
        (1.00, 155.0, False),
        (0.96, 285.0, False),
        (0.92, 302.0, True),
        (0.90, 395.0, False),
        (0.81, 418.0, True),
        (0.77, 612.0, False),
        (0.42, 665.0, True),
    )
    rings = []
    for scale_r, z_lvl, _ in tiers:
        ring = []
        for k in range(sides):
            a = k * math.tau / sides
            rk = radii[k] * scale_r
            jitter_z = z_lvl + ((16.5 * math.sin(9 * a + z_lvl * 0.02) + 4.5 * math.cos(17 * a)) if z_lvl > 100 else 0.0)
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
    # Cresta Strenta (3,124 m) high knife-edge ridge spur extending northwest from Piz Boè
    for cs_i in range(3):
        rock_tower(peaks, cx - 55.0 - cs_i * 68.0, cy + 40.0 + cs_i * 48.0, 650.0, 772.0 - cs_i * 18.0, 62.0, 34.0, 7, 0.65, cfn, taper=0.42, flat_cap=False, seed_phase=2.1 + cs_i)

    # Torre Exner (2,496 m): slender detached via-ferrata climbing needle above Passo Gardena (at=10090 m)
    ex_pt = road.s[road.index(10090.0)]
    eux, euy = ex_pt["x"] - cx, ex_pt["y"] - cy
    eul = max(1.0, math.hypot(eux, euy))
    eux, euy = eux / eul, euy / eul
    rock_tower(peaks, cx + eux * 855.0, cy + euy * 855.0, 125.0, 445.0, 36.0, 32.0, 8, math.atan2(euy, eux), cfn, taper=0.38, flat_cap=True, seed_phase=4.9)

    # Vinatzer-Castiglioni south-face pillar & Punta Ciavazes gendarmes (at=6820 m)
    vc_pt = road.s[road.index(6820.0)]
    vux2, vuy2 = vc_pt["x"] - cx, vc_pt["y"] - cy
    vul2 = max(1.0, math.hypot(vux2, vuy2))
    vux2, vuy2 = vux2 / vul2, vuy2 / vul2
    for g_off, g_top in ((-55.0, 485.0), (52.0, 512.0)):
        rock_tower(peaks, cx + vux2 * 830.0 - vuy2 * g_off, cy + vuy2 * 830.0 + vux2 * g_off, 120.0, g_top, 44.0, 38.0, 8, math.atan2(vuy2, vux2), cfn, taper=0.52, flat_cap=True, seed_phase=1.3 + g_off * 0.01)

    # High-altitude CAI huts on the Sella massif: Rifugio Boè (2,873 m) & Rifugio Pisciadù (2,585 m)
    pis_h = road.s[road.index(10750.0)]
    phx, phy = pis_h["x"] - cx, pis_h["y"] - cy
    phl = max(1.0, math.hypot(phx, phy))
    pux, puy = phx / phl, phy / phl
    ppx, ppy = -puy, pux
    rock_tower(peaks, cx - 140.0, cy + 90.0, 658.0, 676.0, 13.0, 10.0, 6, 0.2, cfn, taper=0.95, flat_cap=True, seed_phase=0.5)
    rock_tower(peaks, cx + pux * 685.0 + ppx * 40.0, cy + puy * 685.0 + ppy * 40.0, 485.0, 502.0, 12.0, 9.5, 6, 0.8, cfn, taper=0.95, flat_cap=True, seed_phase=0.9)

    # Piz Gralba (2,972 m) northwest corner fortress above Plan de Gralba (at=8320 m)
    gr_pt = road.s[road.index(8320.0)]
    grux, gruy = gr_pt["x"] - cx, gr_pt["y"] - cy
    grul = max(1.0, math.hypot(grux, gruy))
    grux, gruy = grux / grul, gruy / grul
    rock_tower(peaks, cx + grux * 748.0, cy + gruy * 748.0, 118.0, 598.0, 138.0, 108.0, 11, math.atan2(gruy, grux), cfn, taper=0.78, flat_cap=True, seed_phase=2.9)
    quad_shaded(
        peaks,
        (cx + grux * 845.0 - (-gruy) * 55.0, cy + gruy * 845.0 - grux * 55.0, 596.0),
        (cx + grux * 845.0 + (-gruy) * 55.0, cy + gruy * 845.0 + grux * 55.0, 596.0),
        (cx + grux * 810.0 + (-gruy) * 48.0, cy + gruy * 810.0 + grux * 48.0, 603.0),
        (cx + grux * 810.0 - (-gruy) * 48.0, cy + gruy * 810.0 - grux * 48.0, 603.0),
        cfn,
        600.0,
        snow=True,
    )

    # Sas dla Luesa & Cima del Lago northeastern buttresses above Colfosco (at=11150 m)
    lu_pt = road.s[road.index(11150.0)]
    luux, luuy = lu_pt["x"] - cx, lu_pt["y"] - cy
    luul = max(1.0, math.hypot(luux, luuy))
    luux, luuy = luux / luul, luuy / luul
    lupx, lupy = -luuy, luux
    for lat_lu, top_lu in ((-85.0, 565.0), (88.0, 548.0)):
        rock_tower(peaks, cx + luux * 745.0 + lupx * lat_lu, cy + luuy * 745.0 + lupy * lat_lu, 105.0, top_lu, 96.0, 78.0, 10, math.atan2(luuy, luux), cfn, taper=0.70, flat_cap=True, seed_phase=4.2 + lat_lu * 0.01)

    # Forcella Antersass (2,839 m) high northern snow-saddle notch
    an_pt = road.s[road.index(9950.0)]
    anux, anuy = an_pt["x"] - cx, an_pt["y"] - cy
    anul = max(1.0, math.hypot(anux, anuy))
    anux, anuy = anux / anul, anuy / anul
    anpx, anpy = -anuy, anux
    quad_shaded(
        peaks,
        (cx + anux * 695.0 - anpx * 45.0, cy + anuy * 695.0 - anpy * 45.0, 565.0),
        (cx + anux * 695.0 + anpx * 45.0, cy + anuy * 695.0 + anpy * 45.0, 565.0),
        (cx + anux * 545.0 + anpx * 32.0, cy + anuy * 545.0 + anpy * 32.0, 635.0),
        (cx + anux * 545.0 - anpx * 32.0, cy + anuy * 545.0 - anpy * 32.0, 635.0),
        cfn,
        600.0,
        snow=True,
    )

    # Col Turond lower terraced rock spurs directly above the eastern Passo Pordoi hairpins (at=4250 m)
    ct_pt = road.s[road.index(4250.0)]
    ctux, ctuy = ct_pt["x"] - cx, ct_pt["y"] - cy
    ctul = max(1.0, math.hypot(ctux, ctuy))
    ctux, ctuy = ctux / ctul, ctuy / ctul
    rock_tower(peaks, cx + ctux * 870.0, cy + ctuy * 870.0, 95.0, 385.0, 92.0, 74.0, 9, math.atan2(ctuy, ctux), cfn, taper=0.68, flat_cap=True, seed_phase=3.3)

    # Punta Vallon (2,906 m) eastern summit rising behind the Vallon cirque
    val_pt = road.s[road.index(1750.0)]
    vux, vuy = val_pt["x"] - cx, val_pt["y"] - cy
    vul = max(1.0, math.hypot(vux, vuy))
    vux, vuy = vux / vul, vuy / vul
    vpx, vpy = -vuy, vux
    rock_tower(peaks, cx + vux * 515.0 + vpx * 55.0, cy + vuy * 515.0 + vpy * 55.0, 495.0, 705.0, 88.0, 68.0, 9, math.atan2(vuy, vux), cfn, taper=0.45, flat_cap=False, seed_phase=1.6)
    bec_pt = road.s[road.index(2650.0)]
    bdx, bdy = bec_pt["x"] - cx, bec_pt["y"] - cy
    bdl = max(1.0, math.hypot(bdx, bdy))
    bux, buy = bdx / bdl, bdy / bdl
    rock_tower(peaks, cx + bux * 825.0, cy + buy * 825.0, 115.0, 465.0, 52.0, 42.0, 8, math.atan2(buy, bux), cfn, taper=0.36, flat_cap=False, seed_phase=5.8)

    # Val de Mesdì (Mittagstal) deep snow-floored couloir slicing into the Sella rim above Colfosco (at=10920 m)
    vm_pt = road.s[road.index(10920.0)]
    vmux, vmuy = vm_pt["x"] - cx, vm_pt["y"] - cy
    vmul = max(1.0, math.hypot(vmux, vmuy))
    vmux, vmuy = vmux / vmul, vmuy / vmul
    vmpx, vmpy = -vmuy, vmux
    quad_shaded(
        peaks,
        (cx + vmux * 855.0 - vmpx * 24.0, cy + vmuy * 855.0 - vmpy * 24.0, 145.0),
        (cx + vmux * 855.0 + vmpx * 24.0, cy + vmuy * 855.0 + vmpy * 24.0, 145.0),
        (cx + vmux * 635.0 + vmpx * 12.0, cy + vmuy * 635.0 + vmpy * 12.0, 585.0),
        (cx + vmux * 635.0 - vmpx * 12.0, cy + vmuy * 635.0 - vmpy * 12.0, 585.0),
        cfn,
        365.0,
        snow=True,
    )
    top_ring = rings[-1]
    for k in range(sides):
        u = (k + 1) % sides
        tri_shaded(peaks, top_ring[k], top_ring[u], apex, cfn, 735.0, snow=(k % 3 == 0 or (5 <= k <= 15 and k % 2 == 0)))

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
    # Pale zigzagging CAI 627 scree trail ribbons ascending Forcella Pordoi!
    for zg_i in range(5):
        f0, f1 = zg_i / 5.0, (zg_i + 1) / 5.0
        s0 = -1.0 if zg_i % 2 == 0 else 1.0
        z_a, z_b = 160.0 + f0 * 320.0, 160.0 + f1 * 320.0
        r_a, r_b = 805.0 - f0 * 115.0, 805.0 - f1 * 115.0
        p_a = (cx + ux * r_a + px_perp * (115.0 + s0 * 24.0), cy + uy * r_a + py_perp * (115.0 + s0 * 24.0), z_a)
        p_b = (cx + ux * r_b + px_perp * (115.0 - s0 * 24.0), cy + uy * r_b + py_perp * (115.0 - s0 * 24.0), z_b)
        quad_shaded(peaks, p_a, (p_a[0], p_a[1], p_a[2] + 3.5), (p_b[0], p_b[1], p_b[2] + 3.5), p_b, cfn, 0.5 * (z_a + z_b), snow=False)

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
        (18.0,   792.0, 468.0, 42.0, 36.0, 2.5),   # Campanile / Locomotiva spur on Sella Towers
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

    # Vallon glacial cirque bowl & snow-floored hollow above Boè / Campolongo (at=1750 m)
    val_pt = road.s[road.index(1750.0)]
    vux, vuy = val_pt["x"] - cx, val_pt["y"] - cy
    vul = max(1.0, math.hypot(vux, vuy))
    vux, vuy = vux / vul, vuy / vul
    vpx, vpy = -vuy, vux
    quad_shaded(
        peaks,
        (cx + vux * 690.0 - vpx * 95.0, cy + vuy * 690.0 - vpy * 95.0, 415.0),
        (cx + vux * 690.0 + vpx * 95.0, cy + vuy * 690.0 + vpy * 95.0, 415.0),
        (cx + vux * 545.0 + vpx * 65.0, cy + vuy * 545.0 + vpy * 65.0, 520.0),
        (cx + vux * 545.0 - vpx * 65.0, cy + vuy * 545.0 - vpy * 65.0, 520.0),
        cfn,
        465.0,
        snow=True,
    )

    # Fallen Hauptdolomit talus blocks along the inner scree foot beneath Torri del Sella (7,500..8,000 m)
    for tb_k in range(14):
        d_tb = 7480.0 + tb_k * 38.0
        tb_idx = road.index(d_tb)
        tb_pt = road.s[tb_idx]
        off_in = -(18.0 + (tb_k % 4) * 9.5)
        bx_t = tb_pt["x"] - math.sin(tb_pt["h"]) * off_in
        by_t = tb_pt["y"] + math.cos(tb_pt["h"]) * off_in
        if road.clear_of_road(bx_t, by_t, 12.0, tb_idx):
            sz_t = 3.5 + (tb_k % 4) * 2.2
            rock_tower(peaks, bx_t, by_t, tb_pt["z"] + 2.0, tb_pt["z"] + 4.0 + sz_t, sz_t, sz_t * 0.8, 6, tb_k * 0.7, cfn, taper=0.65, flat_cap=True, seed_phase=tb_k * 1.1)

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

    # Bec de Mezdì (2,967 m) & Piz da Lec southeastern bastions framing Campolongo -> Arabba (at=2650 m)
    bec_pt = road.s[road.index(2650.0)]
    bdx, bdy = bec_pt["x"] - cx, bec_pt["y"] - cy
    bdl = max(1.0, math.hypot(bdx, bdy))
    bux, buy = bdx / bdl, bdy / bdl
    bpx, bpy_ = -buy, bux
    for lat_bm, h_bm in ((-110.0, 595.0), (95.0, 560.0)):
        rock_tower(peaks, cx + bux * 740.0 + bpx * lat_bm, cy + buy * 740.0 + bpy_ * lat_bm, 105.0, h_bm, 108.0, 86.0, 11, math.atan2(buy, bux), cfn, taper=0.64, flat_cap=False, seed_phase=5.1 + lat_bm * 0.01)

    # Piz Selva (2,941 m) & Sas de Mesdì western ramparts looming over Plan de Gralba & Selva (at=8650 m)
    ps_pt = road.s[road.index(8650.0)]
    psx, psy = ps_pt["x"] - cx, ps_pt["y"] - cy
    psl = max(1.0, math.hypot(psx, psy))
    psux, psuy = psx / psl, psy / psl
    pspx, pspy = -psuy, psux
    for lat_ps, h_ps in ((-125.0, 588.0), (105.0, 562.0)):
        rock_tower(peaks, cx + psux * 755.0 + pspx * lat_ps, cy + psuy * 755.0 + pspy * lat_ps, 112.0, h_ps, 112.0, 88.0, 10, math.atan2(psuy, psux), cfn, taper=0.74, flat_cap=True, seed_phase=2.6 + lat_ps * 0.01)

    # Piz da Lech / Boèseekofel (2,910 m) curved limestone peak above Corvara (at=480 m)
    lec_pt = road.s[road.index(480.0)]
    lcx, lcy = lec_pt["x"] - cx, lec_pt["y"] - cy
    lcl = max(1.0, math.hypot(lcx, lcy))
    lcux, lcuy = lcx / lcl, lcy / lcl
    rock_tower(peaks, cx + lcux * 735.0, cy + lcuy * 735.0, 102.0, 578.0, 128.0, 96.0, 11, math.atan2(lcuy, lcux), cfn, taper=0.52, flat_cap=False, seed_phase=3.7)

    # Lingering summer snow-couloir ribbons inside north-facing Sella chimneys (Gardena / Colfosco face)
    for coul_at in (9280.0, 9680.0, 10380.0, 11020.0):
        k_pt = road.s[road.index(coul_at)]
        kux, kuy = k_pt["x"] - cx, k_pt["y"] - cy
        kul = max(1.0, math.hypot(kux, kuy))
        kux, kuy = kux / kul, kuy / kul
        kpx, kpy = -kuy, kux
        quad_shaded(
            peaks,
            (cx + kux * 845.0 - kpx * 12.0, cy + kuy * 845.0 - kpy * 12.0, 175.0),
            (cx + kux * 845.0 + kpx * 12.0, cy + kuy * 845.0 + kpy * 12.0, 175.0),
            (cx + kux * 745.0 + kpx * 5.0,  cy + kuy * 745.0 + kpy * 5.0,  525.0),
            (cx + kux * 745.0 - kpx * 5.0,  cy + kuy * 745.0 - kpy * 5.0,  525.0),
            cfn,
            350.0,
            snow=True,
        )

    # Antersass / Zwischenkofel (2,907 m) central Sella plateau watershed peak
    rock_tower(peaks, cx - 85.0, cy + 215.0, 645.0, 718.0, 82.0, 64.0, 9, 0.55, cfn, taper=0.56, flat_cap=False, seed_phase=0.5)
    # Lech dl Dragon (2,680 m) seasonal turquoise karst tarn on the western Sella terrace
    quad_shaded(
        peaks,
        (cx - 285.0, cy - 115.0, 616.0),
        (cx - 245.0, cy - 115.0, 616.0),
        (cx - 248.0, cy - 78.0, 616.5),
        (cx - 282.0, cy - 78.0, 616.5),
        cfn,
        616.0,
        snow=True,
    )
    # Torre Berger (2,510 m) detached climbing needle beneath Piz Ciavazes
    rock_tower(peaks, cx_w + cux * 155.0 + cpx * 95.0, cy_w + cuy * 155.0 + cpy * 95.0, 132.0, 468.0, 32.0, 26.0, 7, math.atan2(cuy, cux), cfn, taper=0.28, flat_cap=False, seed_phase=4.9)
    # Western prow buttress of Sass Pordoi overlooking the Pordoi -> Canazei switchbacks
    rock_tower(peaks, sp_x - px_perp * 118.0 + ux * 45.0, sp_y - py_perp * 118.0 + uy * 45.0, 130.0, 562.0, 68.0, 56.0, 8, yaw_sp - 0.25, cfn, taper=0.72, flat_cap=True, seed_phase=2.7)
    # Cima de Lech (2,936 m) & Lago del Pisciadù tarn in the upper Val Setus cirque
    rock_tower(peaks, cx + pux * 615.0 + ppx * 92.0, cy + puy * 615.0 + ppy * 92.0, 508.0, 688.0, 74.0, 58.0, 8, math.atan2(puy, pux), cfn, taper=0.48, flat_cap=False, seed_phase=0.8)
    quad_shaded(
        peaks,
        (cx + pux * 645.0 - ppx * 22.0, cy + puy * 645.0 - ppy * 22.0, 506.0),
        (cx + pux * 645.0 + ppx * 18.0, cy + puy * 645.0 + ppy * 18.0, 506.0),
        (cx + pux * 612.0 + ppx * 16.0, cy + puy * 612.0 + ppy * 16.0, 506.5),
        (cx + pux * 612.0 - ppx * 20.0, cy + puy * 612.0 - ppy * 20.0, 506.5),
        cfn,
        506.0,
        snow=True,
    )
    # Rifugio Franz Kostner al Vallon (2,500 m) perched on the eastern Sella terrace above Campolongo
    rock_tower(peaks, cx + vux * 712.0 - vpx * 52.0, cy + vuy * 712.0 - vpy * 52.0, 412.0, 425.0, 12.0, 9.0, 6, math.atan2(vuy, vux), cfn, taper=0.94, flat_cap=True, seed_phase=1.4)
    # Sas dla Luesa (2,642 m) angular spur overlooking upper Val Lasties
    rock_tower(peaks, cx + lux * 655.0 - lpx * 65.0, cy + luy * 655.0 - lpy * 65.0, 385.0, 565.0, 66.0, 52.0, 8, math.atan2(luy, lux), cfn, taper=0.52, flat_cap=True, seed_phase=3.9)
    # Iconic Via Ferrata Brigata Tridentina suspension bridge ribbon spanning Torre Exner -> Pisciadù
    quad_shaded(
        peaks,
        (cx + pux * 805.0 - ppx * 135.0, cy + puy * 805.0 - ppy * 135.0, 472.0),
        (cx + pux * 775.0 - ppx * 112.0, cy + puy * 775.0 - ppy * 112.0, 476.0),
        (cx + pux * 775.0 - ppx * 112.0, cy + puy * 775.0 - ppy * 112.0, 478.2),
        (cx + pux * 805.0 - ppx * 135.0, cy + puy * 805.0 - ppy * 135.0, 474.2),
        cfn,
        475.0,
        snow=True,
    )
    # Piz Rotic (2,973 m) northwest Sella rampart overlooking Plan de Gralba
    rock_tower(peaks, cx + psux * 725.0 + pspx * 185.0, cy + psuy * 725.0 + pspy * 185.0, 120.0, 594.0, 96.0, 78.0, 9, math.atan2(psuy, psux), cfn, taper=0.70, flat_cap=True, seed_phase=3.1)
    # Bright snow-cornice saddle lip crowning Forcella Pordoi (2,848 m)
    quad_shaded(
        peaks,
        (fc_x - px_perp * 22.0 - ux * 32.0, fc_y - py_perp * 22.0 - uy * 32.0, 514.0),
        (fc_x + px_perp * 22.0 - ux * 32.0, fc_y + py_perp * 22.0 - uy * 32.0, 514.0),
        (fc_x + px_perp * 18.0 - ux * 58.0, fc_y + py_perp * 18.0 - uy * 58.0, 526.0),
        (fc_x - px_perp * 18.0 - ux * 58.0, fc_y - py_perp * 18.0 - uy * 58.0, 526.0),
        cfn,
        520.0,
        snow=True,
    )
    # Sentinel limestone pinnacle flanking the lower mouth of Val de Mesdì above Colfosco
    vm_m = road.s[road.index(10920.0)]
    vmx, vmy = vm_m["x"] - cx, vm_m["y"] - cy
    vml = max(1.0, math.hypot(vmx, vmy))
    vmx, vmy = vmx / vml, vmy / vml
    rock_tower(peaks, cx + vmx * 825.0 - (-vmy) * 62.0, cy + vmy * 825.0 - vmx * 62.0, 125.0, 488.0, 38.0, 32.0, 8, math.atan2(vmy, vmx), cfn, taper=0.34, flat_cap=False, seed_phase=5.4)
    # Piz Miara eastern dihedral spur facing Passo Campolongo
    rock_tower(peaks, cx + mux2 * 815.0 + mpx2 * 95.0, cy + muy2 * 815.0 + mpy2 * 95.0, 108.0, 492.0, 56.0, 46.0, 8, math.atan2(muy2, mux2), cfn, taper=0.58, flat_cap=True, seed_phase=2.2)
    # Micheluzzi overhanging south-face pillar on western Piz Ciavazes
    rock_tower(peaks, cx_w + cux * 148.0 - cpx * 78.0, cy_w + cuy * 148.0 - cpy * 78.0, 128.0, 512.0, 44.0, 36.0, 8, math.atan2(cuy, cux), cfn, taper=0.78, flat_cap=True, seed_phase=1.7)
    # Val Culea narrow snow-lined limestone gorge ascending Le Mëisules above Gardena (at=9880 m)
    cul_m = road.s[road.index(9880.0)]
    clux, cluy = cul_m["x"] - cx, cul_m["y"] - cy
    clul = max(1.0, math.hypot(clux, cluy))
    clux, cluy = clux / clul, cluy / clul
    clpx, clpy = -cluy, clux
    quad_shaded(
        peaks,
        (cx + clux * 850.0 - clpx * 14.0, cy + cluy * 850.0 - clpy * 14.0, 165.0),
        (cx + clux * 850.0 + clpx * 14.0, cy + cluy * 850.0 + clpy * 14.0, 165.0),
        (cx + clux * 725.0 + clpx * 6.0, cy + cluy * 725.0 + clpy * 6.0, 555.0),
        (cx + clux * 725.0 - clpx * 6.0, cy + cluy * 725.0 - clpy * 6.0, 555.0),
        cfn,
        360.0,
        snow=True,
    )
    # Piz Beguz (2,974 m) tabular inner-plateau summit northwest of Piz Boè
    rock_tower(peaks, cx - 195.0, cy + 155.0, 648.0, 736.0, 76.0, 62.0, 8, 0.9, cfn, taper=0.64, flat_cap=True, seed_phase=2.8)
    # Angular fallen Dolomite talus boulders on the inner scree bench below Sass Pordoi
    for pb_i in range(5):
        pbi = road.index(4680.0 + pb_i * 48.0)
        pb_pt = road.s[pbi]
        pbx = pb_pt["x"] - math.sin(pb_pt["h"]) * -24.0
        pby = pb_pt["y"] + math.cos(pb_pt["h"]) * -24.0
        if road.clear_of_road(pbx, pby, 14.0, pbi):
            rock_tower(peaks, pbx, pby, pb_pt["z"] + 2.0, pb_pt["z"] + 8.5, 5.2, 4.2, 6, pb_i * 0.9, cfn, taper=0.62, flat_cap=True, seed_phase=pb_i * 1.4)
    # Observation parapet rim crowning Sass Pordoi's 2,950 m summit table
    rock_tower(peaks, sp_x + ux * 95.0, sp_y + uy * 95.0, 584.0, 592.0, 48.0, 82.0, 8, yaw_sp, cfn, taper=0.96, flat_cap=True, seed_phase=0.3)
    # Forcella dei Camosci snow-filled high saddle between Sass Pordoi & Piz Boè
    quad_shaded(
        peaks,
        (sp_x - ux * 115.0 + px_perp * 65.0, sp_y - uy * 115.0 + py_perp * 65.0, 568.0),
        (sp_x - ux * 115.0 + px_perp * 105.0, sp_y - uy * 115.0 + py_perp * 105.0, 568.0),
        (sp_x - ux * 175.0 + px_perp * 95.0, sp_y - uy * 175.0 + py_perp * 95.0, 622.0),
        (sp_x - ux * 175.0 + px_perp * 72.0, sp_y - uy * 175.0 + py_perp * 72.0, 622.0),
        cfn,
        595.0,
        snow=True,
    )
    # La Locomotiva (2,460 m) climbing spur below First Sella Tower
    rock_tower(peaks, cx + sux * 848.0 - spx * 195.0, cy + suy * 848.0 - spy * 195.0, 128.0, 412.0, 36.0, 26.0, 7, math.atan2(suy, sux) - 0.2, cfn, taper=0.72, flat_cap=True, seed_phase=3.5)
    # Twin eastern ridge gendarmes on Cima Pisciadù above Val Setus
    for pg_o in (-28.0, 28.0):
        rock_tower(peaks, cx + pux * 755.0 + ppx * pg_o, cy + puy * 755.0 + ppy * pg_o, 420.0, 568.0, 34.0, 28.0, 7, math.atan2(puy, pux), cfn, taper=0.35, flat_cap=False, seed_phase=4.1 + pg_o * 0.02)
    # Plunge-pool spray fan at the foot of Cascata del Pisciadù
    quad_shaded(
        peaks,
        (wf_x + pux * 12.0 - ppx * 14.0, wf_y + puy * 12.0 - ppy * 14.0, 110.0),
        (wf_x + pux * 12.0 + ppx * 14.0, wf_y + puy * 12.0 + ppy * 14.0, 110.0),
        (wf_x - ppx * 8.0, wf_y - ppy * 8.0, 116.0),
        (wf_x + ppx * 8.0, wf_y + ppy * 8.0, 116.0),
        cfn,
        113.0,
        snow=True,
    )
    # Piz Lech Dlacè / Eisseespitze (3,009 m) 3,000er summit west of Piz Boè
    rock_tower(peaks, cx - 135.0, cy - 88.0, 655.0, 758.0, 68.0, 54.0, 8, 1.2, cfn, taper=0.52, flat_cap=False, seed_phase=3.4)
    # Classic Maria-Kante vertical south arête on Sass Pordoi
    rock_tower(peaks, sp_x + ux * 142.0 + px_perp * 35.0, sp_y + uy * 142.0 + py_perp * 35.0, 138.0, 578.0, 38.0, 32.0, 7, yaw_sp, cfn, taper=0.84, flat_cap=True, seed_phase=1.9)
    # Cima Bamberg (3,001 m) inner plateau summit overlooking Rifugio Boè
    rock_tower(peaks, cx + 18.0, cy + 168.0, 652.0, 752.0, 64.0, 52.0, 8, 0.3, cfn, taper=0.46, flat_cap=False, seed_phase=4.6)
    # Snow-dusted horizontal Cengia ledge across the eastern Murfrëit wall above Corvara
    quad_shaded(
        peaks,
        (cx + mux2 * 845.0 - mpx2 * 140.0, cy + muy2 * 845.0 - mpy2 * 140.0, 342.0),
        (cx + mux2 * 845.0 + mpx2 * 140.0, cy + muy2 * 845.0 + mpy2 * 140.0, 342.0),
        (cx + mux2 * 805.0 + mpx2 * 130.0, cy + muy2 * 805.0 + mpy2 * 130.0, 358.0),
        (cx + mux2 * 805.0 - mpx2 * 130.0, cy + muy2 * 805.0 - mpy2 * 130.0, 358.0),
        cfn,
        350.0,
        snow=True,
    )
    # Sunlit southeastern limestone buttress above Passo Campolongo
    rock_tower(peaks, cx + vux * 795.0 + vpx * 125.0, cy + vuy * 795.0 + vpy * 125.0, 105.0, 505.0, 62.0, 48.0, 8, math.atan2(vuy, vux), cfn, taper=0.66, flat_cap=True, seed_phase=5.2)
    # Irmgard-Kante southwest arête descending from Piz Ciavazes
    rock_tower(peaks, cx_w + cux * 162.0 - cpx * 125.0, cy_w + cuy * 162.0 - cpy * 125.0, 125.0, 495.0, 38.0, 32.0, 7, math.atan2(cuy, cux) - 0.18, cfn, taper=0.72, flat_cap=True, seed_phase=2.3)
    # Val Setus snow-lined exit notch rising into the Pisciadù cirque
    quad_shaded(
        peaks,
        (cx + pux * 835.0 - ppx * 45.0, cy + puy * 835.0 - ppy * 45.0, 210.0),
        (cx + pux * 835.0 - ppx * 25.0, cy + puy * 835.0 - ppy * 25.0, 210.0),
        (cx + pux * 695.0 - ppx * 18.0, cy + puy * 695.0 - ppy * 18.0, 502.0),
        (cx + pux * 695.0 - ppx * 30.0, cy + puy * 695.0 - ppy * 30.0, 502.0),
        cfn,
        355.0,
        snow=True,
    )
    # Overhanging western yellow-dolomite buttress of Piz Gralba
    rock_tower(peaks, cx + psux * 815.0 + pspx * 145.0, cy + psuy * 815.0 + pspy * 145.0, 118.0, 535.0, 52.0, 42.0, 8, math.atan2(psuy, psux), cfn, taper=0.82, flat_cap=True, seed_phase=4.7)
    # Sas da Lec sharp eastern limestone spur overlooking Corvara
    rock_tower(peaks, cx + lcux * 812.0 - (-lcuy) * 75.0, cy + lcuy * 812.0 - lcux * 75.0, 108.0, 498.0, 46.0, 38.0, 8, math.atan2(lcuy, lcux), cfn, taper=0.38, flat_cap=False, seed_phase=1.5)
    # Vallon de Fosses lingering karst snowfield on the northern Sella plateau
    quad_shaded(
        peaks,
        (cx - 45.0, cy + 310.0, 622.0),
        (cx + 35.0, cy + 310.0, 622.0),
        (cx + 25.0, cy + 235.0, 658.0),
        (cx - 35.0, cy + 235.0, 658.0),
        cfn,
        640.0,
        snow=True,
    )
    # [ANCHOR:massif]
