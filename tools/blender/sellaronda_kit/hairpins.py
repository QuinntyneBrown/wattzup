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
            # Südtirol timber-clad top beam on Val Badia & Val Gardena stretches
            if (s[i]["d"] < 2600.0 or s[i]["d"] > 8800.0) and i % 2 == 0:
                B["larch-warm"].box(kit.P(i, 2.0, (kit.kerb + 0.88) * outside, 0.88), (8.05, 0.16, 0.12), s[i]["h"])
            if abs_k > 1 / 52 and i % 2 == 0:
                B["yellow"].box(kit.P(i, 2.0, (kit.kerb + 0.86) * outside, 0.12), (8.02, 0.08, 0.18), s[i]["h"])
            if i % 40 == 0:
                B["dolomite-pale"].box(kit.P(i, 0.0, (kit.kerb + 0.92) * outside, -0.15), (0.65, 0.55, 1.12), s[i]["h"])

        # Every 2 samples (~8 m) on tight switchback bends, build battered Dolomite masonry retaining wall below road!
        if abs_k > 1 / 88 and i % 2 == 0:
            outside = 1.0 if k_val < 0 else -1.0
            yaw = s[i]["h"]
            wx, wy, wz = road.at(i, (kit.kerb + 1.35) * outside)
            B["stone"].box((wx, wy, wz - 4.4), (8.4, 1.35, 4.45), yaw)
            if i % 8 == 0:
                B["dolomite-pale"].box((wx - math.sin(yaw) * (0.65 * outside), wy + math.cos(yaw) * (0.65 * outside), wz - 4.6), (1.15, 0.95, 4.55), yaw)
            if i % 24 == 0:
                B["dark"].box((wx - math.sin(yaw) * (0.72 * outside), wy + math.cos(yaw) * (0.72 * outside), wz - 3.8), (0.95, 0.35, 1.35), yaw)
                B["dark"].box((wx - math.sin(yaw) * (0.72 * outside), wy + math.cos(yaw) * (0.72 * outside), wz - 1.35), (0.28, 0.16, 0.42), yaw)
            # Low dressed-stone parapet coping & drainage weep-blocks along the apex rim
            if abs_k > 1 / 62 and i % 4 == 0:
                B["dolomite-pale"].box((wx, wy, wz + 0.02), (3.4, 0.52, 0.62), yaw)
                B["steel"].box((wx, wy, wz + 0.64), (0.14, 0.14, 0.18), yaw)

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
            if tornante_num % 2 == 1:
                B["paint"].box(kit.P(max(4, i - 3), 0.0, -1.8, 0.02), (0.95, 0.65, 0.015), s[max(4, i - 3)]["h"])
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
            B["paint"].box(kit.P(idx, 0.0, -(kit.kerb + 0.78), 0.0), (8.4, 0.24, 0.22), yaw)
            # Overhead concrete avalanche roof slab spanning the carriageways
            B["dolomite-pale"].box(kit.P(idx, 0.0, 0.0, 4.95), (8.4, (kit.kerb + 1.65) * 2.0, 0.62), yaw)
            if idx % 4 == 0:
                B["hay"].box(kit.P(idx, 0.0, -1.2, 5.57), (8.4, kit.kerb * 1.4, 0.35), yaw)
            B["yellow"].box(kit.P(idx, 0.0, 0.0, 0.022), (6.2, 0.22, 0.015), yaw)
            # Valley-side open concrete pillars framing the panoramic view + red/white portal stripes at ends
            B["dolomite-pale"].box(kit.P(idx, 0.0, kit.kerb + 1.15, -0.3), (0.75, 0.75, 5.25), yaw)
            if idx % 4 == 0:
                B["yellow"].box(kit.P(idx, 0.0, kit.kerb + 1.15, 0.95), (0.79, 0.79, 0.36), yaw)
                B["steel"].box(kit.P(idx, 0.0, kit.kerb + 1.95, 5.15), (0.24, 0.85, 0.16), yaw)
            if idx in (i0, i1 - (i1 - i0) % 2):
                B["parasol-red"].box(kit.P(idx, 0.0, kit.kerb + 1.15, 1.2), (0.80, 0.80, 0.55), yaw)
                B["larch-warm"].box(kit.P(idx, 0.0, 0.0, 5.57), (0.85, (kit.kerb + 1.7) * 2.0, 0.34), yaw)
                for hz_k in range(-3, 4):
                    mat_hz = "yellow" if hz_k % 2 == 0 else "dark"
                    B[mat_hz].box(kit.P(idx, -4.15 if idx == i0 else 4.15, hz_k * 1.45, 5.05), (0.16, 1.38, 0.52), yaw)

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
            B["dolomite-pale"].box(kit.P(b_idx, 0.0, (kit.kerb + 0.92) * side, -0.85), (7.2, 0.92, 0.45), b_yaw)
            B["dolomite-pale"].box(kit.P(b_idx, 0.0, (kit.kerb + 0.85) * side, 1.05), (12.4, 0.96, 0.18), b_yaw)
            B["paint"].box(kit.P(b_idx, 0.0, (kit.kerb + 0.38) * side, 0.45), (1.35, 0.08, 0.48), b_yaw)
            for end_o in (-6.2, 6.2):
                B["paint"].box(kit.P(b_idx, end_o, (kit.kerb + 0.85) * side, 1.23), (0.08, 0.28, 0.92), b_yaw)
                B["parasol-red"].box(kit.P(b_idx, end_o, (kit.kerb + 0.85) * side, 1.55), (0.09, 0.28, 0.32), b_yaw)
        # Stepped stone torrent check-dams & white-water cascade on the uphill gully side
        for st_c in range(3):
            off_c = -(kit.kerb + 4.5 + st_c * 4.2)
            cx_d, cy_d, cz_d = road.at(b_idx, off_c, -1.8 + st_c * 1.6)
            B["stone"].box((cx_d, cy_d, cz_d), (5.2, 1.4, 1.65), b_yaw)
            B["glacier-ice"].box((cx_d, cy_d, cz_d + 1.55), (2.4, 1.6, 0.18), b_yaw)

    # Visible down-slope switchback road ribbons snaking across the green slopes below the four high climbs!
    for p in PASSES:
        for tier_k in (0, 1, 2):
            d_rib = p["climb_from"] + 280.0 + tier_k * 360.0
            if d_rib >= p["at"] - 120.0:
                continue
            r_idx = road.index(d_rib)
            ryaw = s[r_idx]["h"] + 0.18 * (1 if tier_k % 2 == 0 else -1)
            # Place visible lower switchback terrace 34..58 m down the valley side (left of road)
            lat_r = 36.0 + tier_k * 11.0
            rx0, ry0, _ = road.at(r_idx, lat_r)
            if not road.clear_of_road(rx0, ry0, 22.0, r_idx):
                continue
            rz0 = min(height_at(rx0, ry0) + 1.2, s[r_idx]["z"] - (11.0 + tier_k * 6.5))
            for seg_s in range(-3, 4):
                sx_r = rx0 + math.cos(ryaw) * (seg_s * 9.5) - math.sin(ryaw) * (math.sin(seg_s * 0.6) * 4.5)
                sy_r = ry0 + math.sin(ryaw) * (seg_s * 9.5) + math.cos(ryaw) * (math.sin(seg_s * 0.6) * 4.5)
                seg_yaw = ryaw + math.cos(seg_s * 0.6) * 0.25
                B["stone"].box((sx_r, sy_r, rz0 - 3.6), (10.2, 6.8, 3.6), seg_yaw)
                if seg_s % 2 == 0:
                    B["dolomite-pale"].box((sx_r - math.sin(seg_yaw) * 3.45, sy_r + math.cos(seg_yaw) * 3.45, rz0 - 3.6), (1.1, 0.85, 3.65), seg_yaw)
                B["asphalt"].box((sx_r, sy_r, rz0), (10.2, 6.4, 0.16), seg_yaw)
                if seg_s == 0:
                    B["yellow"].box((sx_r - math.sin(seg_yaw) * 3.35, sy_r + math.cos(seg_yaw) * 3.35, rz0 + 0.95), (0.65, 0.12, 0.55), seg_yaw)
                B["paint"].box((sx_r - math.sin(seg_yaw) * 2.85, sy_r + math.cos(seg_yaw) * 2.85, rz0 + 0.17), (10.2, 0.18, 0.02), seg_yaw)
                if seg_s in (-2, 0, 2):
                    B["steel"].box((sx_r - math.sin(seg_yaw) * 3.15, sy_r + math.cos(seg_yaw) * 3.15, rz0 + 0.55), (10.2, 0.12, 0.24), seg_yaw)

    # Inner-apex porphyry stone cobble aprons on tight hairpins
    for i in range(16, kit.n - 16, 2):
        if abs(s[i]["k"]) > 1 / 72:
            inside = -1.0 if s[i]["k"] < 0 else 1.0
            B["brick"].box(kit.P(i, 0.0, (kit.kerb + 0.65) * inside, -0.06), (7.8, 1.35, 0.12), s[i]["h"])
            B["bulb"].box(kit.P(i, 0.0, -(kit.kerb - 0.18) * inside, 0.02), (0.14, 0.12, 0.04), s[i]["h"])

    # Uphill cut-dolomite cliff faces with steel rockfall anchor plates on steep Sella-side climbs
    for cut_start, cut_end in ((1580.0, 1740.0), (4180.0, 4380.0), (7180.0, 7340.0), (9480.0, 9620.0)):
        c0, c1 = road.index(cut_start), road.index(cut_end)
        for idx in range(c0, c1, 3):
            cyaw = s[idx]["h"] + (idx % 3 - 1) * 0.08
            B["dolomite-pale"].box(kit.P(idx, 0.0, -(kit.kerb + 2.4), -0.5), (12.2, 2.2, 4.8 + (idx % 4) * 0.9), cyaw)
            B["steel"].box(kit.P(idx, 0.0, -(kit.kerb + 1.28), 2.2), (0.34, 0.08, 0.34), cyaw)
            if idx % 6 == 0:
                B["stone"].box(kit.P(idx, 0.0, -(kit.kerb + 1.15), -0.05), (12.0, 0.45, 0.38), s[idx]["h"])

    # Scenic gravel pull-out lay-bys (piazzole di sosta) with larch benches overlooking the four climbs
    for lay_m in (1720.0, 4420.0, 7040.0, 9820.0):
        l_idx = road.index(lay_m)
        lyaw = s[l_idx]["h"]
        B["gravel"].box(kit.P(l_idx, 0.0, kit.kerb + 2.4, -0.45), (11.0, 3.8, 0.50), lyaw)
        B["stone"].box(kit.P(l_idx, 0.0, kit.kerb + 3.9, -3.2), (11.2, 0.85, 3.2), lyaw)
        B["larch-warm"].box(kit.P(l_idx, -1.8, kit.kerb + 3.4, 0.05), (2.2, 0.55, 0.52), lyaw)
        B["larch-aged"].box(kit.P(l_idx, 2.2, kit.kerb + 3.4, 0.05), (0.48, 0.48, 0.85), lyaw)
        B["chalet-wood"].box(kit.P(l_idx, 3.8, kit.kerb + 3.6, 0.05), (1.45, 0.14, 1.95), lyaw)
        B["dolomite-pale"].box(kit.P(l_idx, -4.2, kit.kerb + 3.6, 0.05), (0.34, 0.34, 1.08), lyaw)

    # Transverse cast-iron alpine snowmelt drainage grates across steep ramps
    for p in PASSES:
        for gr_off in (-520.0, -210.0, 240.0):
            gr_idx = road.index(p["at"] + gr_off)
            B["dark"].box(kit.P(gr_idx, 0.0, 0.0, 0.015), (0.42, kit.kerb * 1.92, 0.02), s[gr_idx]["h"])
            B["steel"].box(kit.P(gr_idx, 0.0, 0.0, 0.02), (0.16, kit.kerb * 1.90, 0.02), s[gr_idx]["h"])
            B["stone"].box(kit.P(gr_idx, 0.0, kit.kerb + 1.45, -1.1), (1.35, 0.65, 1.15), s[gr_idx]["h"])

    # Orange-rimmed convex parabolic traffic mirrors on blind hairpin apexes
    mirror_count = 0
    for i in range(25, kit.n - 25, 14):
        if abs(s[i]["k"]) > 1 / 58 and mirror_count < 16:
            mirror_count += 1
            outside = 1.0 if s[i]["k"] < 0 else -1.0
            myaw = s[i]["h"] + (0.65 if outside > 0 else -0.65)
            moff = (kit.kerb + 1.95) * outside
            B["steel"].box(kit.P(i, 2.0, moff, -0.1), (0.09, 0.09, 2.65), myaw)
            B["parasol-red"].box(kit.P(i, 2.0, moff, 2.15), (0.10, 0.88, 0.88), myaw)
            B["glacier-ice"].box(kit.P(i, 1.97, moff, 2.22), (0.12, 0.72, 0.72), myaw)
            # Yellow alpine winter road-grit chest tucked on the hairpin shoulder
            if mirror_count % 2 == 0:
                B["yellow"].box(kit.P(i, -2.5, (kit.kerb + 1.85) * outside, -0.05), (1.25, 0.88, 0.82), s[i]["h"])
                kit.gable(B["yellow"], kit.P(i, -2.5, (kit.kerb + 1.85) * outside, 0.77), 1.32, 0.94, 0.22, s[i]["h"])
                B["parasol-red"].box(kit.P(i, -1.8, (kit.kerb + 1.85) * outside, 0.15), (0.08, 0.28, 1.15), s[i]["h"])

    # Transverse white optical braking bars approaching steep descent switchbacks
    for p in PASSES:
        for br_d in (p["at"] + 290.0, p["at"] + 620.0):
            br_idx = road.index(br_d)
            byaw = s[br_idx]["h"]
            for b_row in range(4):
                B["paint"].box(kit.P(br_idx, b_row * 2.2, -(kit.kerb * 0.48), 0.02), (0.32, kit.kerb * 0.78, 0.015), byaw)

    # White & blue altitude-contour road threshold markers (1800 m, 2000 m, 2100 m, 2200 m)
    for alt_d in (1650.0, 3950.0, 4450.0, 4810.0, 6950.0, 7450.0, 9580.0, 9980.0):
        a_idx = road.index(alt_d)
        ayaw = s[a_idx]["h"]
        B["paint"].box(kit.P(a_idx, 0.0, -(kit.kerb * 0.45), 0.02), (0.28, kit.kerb * 0.85, 0.015), ayaw)
        B["ladin-blue"].box(kit.P(a_idx, 0.45, -(kit.kerb * 0.45), 0.02), (0.22, kit.kerb * 0.55, 0.015), ayaw)

    # South Tyrolean bio-engineered larch log-crib slope stabilization walls (Krainerwände)
    for kw_start in (1380.0, 6460.0, 9220.0):
        k0 = road.index(kw_start)
        for step_k in range(5):
            idx_k = k0 + step_k * 2
            kyaw = s[idx_k]["h"]
            for row_z in (0.2, 0.85, 1.50):
                B["larch-aged"].box(kit.P(idx_k, 0.0, -(kit.kerb + 1.55 + row_z * 0.25), row_z), (7.8, 0.28, 0.24), kyaw)
            B["foliage"].box(kit.P(idx_k, 0.0, -(kit.kerb + 1.75), 0.55), (7.6, 0.35, 0.95), kyaw)

    # Mid-climb paved ANAS snow-plow turnaround pockets on Pordoi & Sella
    for sp_turn in (4120.0, 6920.0):
        t_idx = road.index(sp_turn)
        tyaw = s[t_idx]["h"]
        B["stone"].box(kit.P(t_idx, 0.0, kit.kerb + 3.2, -1.8), (13.5, 5.2, 1.82), tyaw)
        B["asphalt"].box(kit.P(t_idx, 0.0, kit.kerb + 3.0, 0.02), (13.0, 4.8, 0.06), tyaw)

    # White lane turn-entry arrows ahead of the sharpest climbing switchbacks
    ar_placed = 0
    for i in range(30, kit.n - 30, 18):
        if abs(s[i]["k"]) > 1 / 55 and s[i]["g"] > 2.5 and ar_placed < 14:
            ar_placed += 1
            j_pre = max(6, i - 5)
            ayaw = s[j_pre]["h"]
            B["paint"].box(kit.P(j_pre, 0.0, -2.2, 0.02), (2.2, 0.24, 0.015), ayaw)
            B["paint"].box(kit.P(j_pre, 1.15, -2.2, 0.02), (0.65, 0.65, 0.015), ayaw + math.pi * 0.25)
            B["stone"].box(kit.P(j_pre, -3.0, -(kit.kerb + 0.95), -0.15), (0.95, 0.72, 0.35), ayaw)
            B["dark"].box(kit.P(j_pre, -3.0, -(kit.kerb + 0.95), 0.19), (0.65, 0.48, 0.04), ayaw)

    # Tensioned steel rockfall catch-fences perched above the Pordoi & Gardena cliff cuts
    for rf_m in (4240.0, 4310.0, 9520.0, 9585.0):
        rf_i = road.index(rf_m)
        rfyaw = s[rf_i]["h"]
        B["steel"].box(kit.P(rf_i, 0.0, -(kit.kerb + 3.2), 4.6), (9.5, 0.12, 1.85), rfyaw)
    # White-foaming stepped stone mountain torrent chutes below the 4 climb bridges
    for casc_m in (1280.0, 3840.0, 6820.0, 9380.0):
        cs_i = road.index(casc_m)
        csyaw = s[cs_i]["h"]
        B["glacier-ice"].box(kit.P(cs_i, 0.0, -(kit.kerb + 4.5), -1.8), (2.4, 7.5, 0.35), csyaw)
    # Triangular steep-descent warning signs 120 m past each pass crest
    for p in PASSES:
        pd_i = road.index(p["at"] + 125.0)
        pdyaw = s[pd_i]["h"]
        B["steel"].box(kit.P(pd_i, 0.0, -(kit.kerb + 1.45), -0.1), (0.08, 0.08, 2.15), pdyaw)
        B["parasol-red"].box(kit.P(pd_i, 0.0, -(kit.kerb + 1.45), 1.65), (0.07, 0.68, 0.62), pdyaw)
        B["paint"].box(kit.P(pd_i, -0.02, -(kit.kerb + 1.45), 1.68), (0.08, 0.46, 0.42), pdyaw)
    # Orange ANAS SOS emergency call pillars inside Pordoi & Gardena rockfall galleries
    for sos_m in (4604.0, 9700.0):
        so_i = road.index(sos_m)
        B["crowd-3"].box(kit.P(so_i, 0.0, -(kit.kerb + 0.75), 0.0), (0.28, 0.28, 1.78), s[so_i]["h"])
        B["paint"].box(kit.P(so_i, 0.0, -(kit.kerb + 0.72), 1.25), (0.30, 0.24, 0.34), s[so_i]["h"])
    # Tall yellow snowplough portal clearance wands at Pordoi & Gardena galleries
    for gp_m in (4558.0, 4650.0, 9658.0, 9742.0):
        gp_i = road.index(gp_m)
        B["yellow"].box(kit.P(gp_i, 0.0, kit.kerb + 1.35, 0.0), (0.12, 0.12, 3.45), s[gp_i]["h"])
    # Cantilevered timber overlook walkways on 4 panoramic switchbacks
    for bw_m in (1840.0, 4520.0, 7280.0, 9890.0):
        bwi = road.index(bw_m)
        bwy = s[bwi]["h"]
        B["larch-warm"].box(kit.P(bwi, 0.0, kit.kerb + 1.95, -0.08), (7.6, 1.35, 0.18), bwy)
        B["larch-aged"].box(kit.P(bwi, 0.0, kit.kerb + 2.55, 0.10), (7.6, 0.12, 0.95), bwy)
    # White optical entry bars 25 m ahead of both avalanche rockfall galleries
    for gl_pre in (4535.0, 9635.0):
        gi = road.index(gl_pre)
        for r_k in range(3):
            B["paint"].box(kit.P(gi, r_k * 1.9, 0.0, 0.02), (0.28, kit.kerb * 1.75, 0.015), s[gi]["h"])
    # Tiered stone gabion retaining toes on steep Campolongo & Sella climb embankments
    for gb_m in (1660.0, 4120.0, 7160.0, 9440.0):
        gb_i = road.index(gb_m)
        B["stone"].box(kit.P(gb_i, 0.0, -(kit.kerb + 1.85), -0.1), (8.8, 1.15, 1.25), s[gb_i]["h"])
        B["steel"].box(kit.P(gb_i, 0.0, -(kit.kerb + 1.26), 0.52), (8.82, 0.06, 1.18), s[gb_i]["h"])
    # Amber centreline reflective road studs through the sharpest tornanti
    st_cnt = 0
    for i in range(24, kit.n - 24, 9):
        if abs(s[i]["k"]) > 1 / 52 and st_cnt < 24:
            st_cnt += 1
            B["bulb"].box(kit.P(i, 0.0, 0.0, 0.025), (0.14, 0.14, 0.03), s[i]["h"])
    # Ochre/red ANAS Cantoniera road-maintenance tool huts on Pordoi & Gardena climbs
    for cn_m in (4428.0, 9828.0):
        cni = road.index(cn_m)
        cny = s[cni]["h"]
        cnx, cny_p, _ = road.at(cni, kit.kerb + 7.2)
        if road.clear_of_road(cnx, cny_p, 5.5, cni):
            cnz = height_at(cnx, cny_p)
            B["parasol-red"].box((cnx, cny_p, cnz - 0.5), (4.6, 3.6, 3.1), cny)
            B["paint"].box((cnx, cny_p, cnz + 1.2), (4.66, 1.15, 0.85), cny)
            kit.gable(B["roof-slate"], (cnx, cny_p, cnz + 2.6), 5.1, 4.1, 1.15, cny)
    # Blue 'KEEP RIGHT' Bike Day descent safety signs 380 m past each pass summit
    for p in PASSES:
        kr_i = road.index(p["at"] + 380.0)
        kry = s[kr_i]["h"]
        B["steel"].box(kit.P(kr_i, 0.0, -(kit.kerb + 1.45), -0.1), (0.08, 0.08, 2.05), kry)
        B["ladin-blue"].box(kit.P(kr_i, 0.0, -(kit.kerb + 1.45), 1.58), (0.08, 0.58, 0.58), kry)
    # Solar amber warning beacons ahead of Pordoi & Gardena rockfall gallery portals
    for bc_m in (4545.0, 9645.0):
        bci = road.index(bc_m)
        B["steel"].box(kit.P(bci, 0.0, -(kit.kerb + 1.45), 0.0), (0.09, 0.09, 2.85), s[bci]["h"])
        B["bulb"].box(kit.P(bci, 0.0, -(kit.kerb + 1.45), 2.85), (0.24, 0.24, 0.24), s[bci]["h"])
    # Flexible orange-and-white descent verge delineator wands
    dl_cnt = 0
    for i in range(30, kit.n - 30, 22):
        if s[i]["g"] < -3.8 and dl_cnt < 20:
            dl_cnt += 1
            B["crowd-3"].box(kit.P(i, 0.0, -(kit.kerb + 0.95), 0.0), (0.07, 0.07, 1.15), s[i]["h"])
    # Steel rockfall catch-posts above Campolongo & Sella road cuts
    for rc_m in (1620.0, 1690.0, 7220.0, 7290.0):
        rci = road.index(rc_m)
        B["steel"].box(kit.P(rci, 0.0, -(kit.kerb + 3.1), 4.5), (8.5, 0.12, 1.65), s[rci]["h"])
    # Winter pass-closure swing barriers locked open parallel to the verge in summer
    for p in PASSES:
        wb_i = road.index(p["climb_from"] - 18.0)
        wby = s[wb_i]["h"]
        B["steel"].box(kit.P(wb_i, 0.0, -(kit.kerb + 1.65), 0.0), (0.24, 0.24, 1.15), wby)
        B["parasol-red"].box(kit.P(wb_i, 2.2, -(kit.kerb + 1.65), 0.92), (4.4, 0.12, 0.14), wby)
    # High-visibility yellow cyclist-priority signs at the foot of all 4 climbs
    for p in PASSES:
        cy_s = road.index(p["climb_from"] + 12.0)
        B["steel"].box(kit.P(cy_s, 0.0, -(kit.kerb + 1.55), -0.1), (0.08, 0.08, 2.15), s[cy_s]["h"])
        B["yellow"].box(kit.P(cy_s, 0.0, -(kit.kerb + 1.55), 1.65), (0.08, 0.62, 0.62), s[cy_s]["h"])
    # Triangular 'CADUTA MASSI' rockfall warning signs ahead of the 4 uphill cliff cuts
    for cm_s in (1555.0, 4155.0, 7155.0, 9455.0):
        cmi = road.index(cm_s)
        B["steel"].box(kit.P(cmi, 0.0, -(kit.kerb + 1.45), -0.1), (0.08, 0.08, 2.15), s[cmi]["h"])
        B["parasol-red"].box(kit.P(cmi, 0.0, -(kit.kerb + 1.45), 1.65), (0.07, 0.65, 0.60), s[cmi]["h"])
    # Blue 'LIGHTS ON IN GALLERY' signs 30 m before Pordoi & Gardena galleries
    for gl_s in (4530.0, 9630.0):
        gsi = road.index(gl_s)
        B["steel"].box(kit.P(gsi, 0.0, -(kit.kerb + 1.5), -0.1), (0.08, 0.08, 2.1), s[gsi]["h"])
        B["ladin-blue"].box(kit.P(gsi, 0.0, -(kit.kerb + 1.5), 1.6), (0.08, 0.58, 0.58), s[gsi]["h"])
    # Stepped Dolomite check-weirs above the 4 steep uphill road cuts
    for cw_m in (1650.0, 4280.0, 7260.0, 9550.0):
        cwi = road.index(cw_m)
        B["stone"].box(kit.P(cwi, 0.0, -(kit.kerb + 3.6), 1.5), (2.4, 1.8, 1.4), s[cwi]["h"])
    # Snowplow clearance wands at the portals of Pordoi & Gardena rockfall galleries
    for gw_m in (4558.0, 4632.0, 9658.0, 9722.0):
        gwi = road.index(gw_m)
        B["yellow"].box(kit.P(gwi, 0.0, kit.kerb + 0.55, 0.0), (0.09, 0.09, 2.15), s[gwi]["h"])
    # [ANCHOR:hairpins]
