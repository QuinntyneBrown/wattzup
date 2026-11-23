"""Detail 6 (ski-lifts): Cable cars, chairlift pylons, aerial ropes & summer-quiet pistes."""

from __future__ import annotations

import math


def _cable_segment(B, p0: tuple[float, float, float], p1: tuple[float, float, float], thickness: float = 0.09, sag: float = 6.0, steps: int = 8) -> None:
    """Draws a catenary steel cable ribbon between two 3D anchor points."""
    pts = []
    for k in range(steps + 1):
        t = k / steps
        x = p0[0] + (p1[0] - p0[0]) * t
        y = p0[1] + (p1[1] - p0[1]) * t
        z = p0[2] + (p1[2] - p0[2]) * t - sag * 4.0 * t * (1.0 - t)
        pts.append((x, y, z))
    for k in range(steps):
        a, b = pts[k], pts[k + 1]
        B["dark"].quad(a, b, (b[0], b[1], b[2] + thickness), (a[0], a[1], a[2] + thickness))


def build_ski_lifts(B, kit, road, height_at, cx: float, cy: float) -> list[dict]:
    """Builds the Funivia Sass Pordoi cliff cableway, chairlift pylons & summer-quiet pistes."""
    s = road.s

    # 1. Funivia Sass Pordoi: iconic single-span cable car leaping from Passo Pordoi (at=4950 m) to Sass Pordoi (2,950 m)
    pordoi_idx = road.index(4985.0)
    p_pt = s[pordoi_idx]
    yaw_p = p_pt["h"]
    # Lower valley station on the inside (right-hand Sella side) of Passo Pordoi
    lx, ly, _ = road.at(pordoi_idx, -(kit.kerb + 22.0))
    lz = height_at(lx, ly)
    B["stone"].box((lx, ly, lz - 2.0), (14.0, 10.5, 5.2), yaw_p)
    B["chalet-plaster"].box((lx, ly, lz + 3.2), (14.4, 10.8, 4.4), yaw_p)
    kit.gable(B["roof-slate"], (lx, ly, lz + 7.6), 14.8, 11.2, 2.2, yaw_p)

    # Upper cantilevered cliff-lip station + Rifugio Maria atop Sass Pordoi's 585 m rim!
    dx, dy = p_pt["x"] - cx, p_pt["y"] - cy
    dl = max(1.0, math.hypot(dx, dy))
    ux, uy = dx / dl, dy / dl
    px_p, py_p = -uy, ux
    tx = cx + ux * 855.0 - px_p * 88.0
    ty = cy + uy * 855.0 - py_p * 88.0
    tz = 582.0
    yaw_top = math.atan2(uy, ux)
    B["stone"].box((tx, ty, tz - 6.0), (16.0, 12.0, 9.5), yaw_top)
    B["chalet-plaster"].box((tx, ty, tz + 3.5), (17.5, 13.0, 5.2), yaw_top)
    B["ladin-blue"].box((tx, ty, tz + 8.7), (18.2, 13.6, 1.4), yaw_top)
    # Sun-glinting panoramic observation windows on Sass Pordoi's 2,950 m cliff-lip station!
    B["glint"].box((tx + ux * 6.6, ty + uy * 6.6, tz + 5.1), (0.35, 11.8, 2.2), yaw_top)

    # Twin track & haul cables spanning the sheer cliff + red-and-silver Funivia cabin mid-ascent!
    for off_lat in (-2.1, 2.1):
        a0 = (lx + px_p * off_lat, ly + py_p * off_lat, lz + 6.8)
        a1 = (tx + px_p * off_lat, ty + py_p * off_lat, tz + 6.5)
        _cable_segment(B, a0, a1, thickness=0.16, sag=18.0, steps=10)
        for sp_t in (0.25, 0.50, 0.75):
            spx = a0[0] + (a1[0] - a0[0]) * sp_t
            spy = a0[1] + (a1[1] - a0[1]) * sp_t
            spz = a0[2] + (a1[2] - a0[2]) * sp_t - 18.0 * 4.0 * sp_t * (1.0 - sp_t)
            B["crowd-3" if sp_t != 0.50 else "paint"].box((spx, spy, spz - 0.35), (0.72, 0.72, 0.72), yaw_top)

    # Build origin-centered animated Funivia Sass Pordoi cabin in WHOLE group "Funivia"!
    from . import srgb as _srgb
    fun = B["funivia"]
    fun.colours = []
    def _fbox(cz0: float, sx: float, sy: float, sz: float, col_hex: int):
        c_rgba = _srgb(col_hex)
        base_i = len(fun.verts)
        hx, hy = sx * 0.5, sy * 0.5
        for z_v in (cz0, cz0 + sz):
            for dx_v, dy_v in ((-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)):
                fun.verts.append((dx_v, dy_v, z_v))
                fun.colours.append(c_rgba)
        for f_t in ((4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (0, 3, 2, 1)):
            fun.faces.append(tuple(base_i + q for q in f_t))
    _fbox(-3.2, 0.35, 0.35, 3.2, 0x9AA2AC)
    _fbox(-6.4, 4.8, 3.0, 3.2, 0xC82834)
    _fbox(-4.8, 4.9, 3.1, 1.15, 0xF4F0E6)
    cableways_out = [{
        "from": [round(lx - px_p * 2.1, 2), round(lz + 6.8, 2), round(-(ly - py_p * 2.1), 2)],
        "to": [round(tx - px_p * 2.1, 2), round(tz + 6.5, 2), round(-(ty - py_p * 2.1), 2)],
        "sag": 18.0,
        "traverseSeconds": 42.0,
        "dwellSeconds": 5.0,
        "yaw": round(yaw_top, 4),
    }]

    # 2. Four Sellaronda chairlift / gondola pylon lines crossing & flanking the passes
    lift_corridors = (
        (1820.0, 1.0, 5),   # Campolongo / Cherz chairlift
        (2165.0, -1.0, 4),  # Campolongo / Costoratta chairlift
        (3420.0, 1.0, 6),   # Arabba / Fodom gondola line
        (7480.0, 1.0, 6),   # Passo Sella / Forcella del Sassolungo telecabina line
        (7860.0, 1.0, 4),   # Passo Sella / Città dei Sassi chairlift
        (9920.0, 1.0, 6),   # Passo Gardena / Dantercepies gondola line
    )
    for at_m, side_dir, n_pylons in lift_corridors:
        idx = road.index(at_m)
        yaw_l = s[idx]["h"] + 1.38 * side_dir
        clx, cly = math.cos(yaw_l), math.sin(yaw_l)
        base_x, base_y, _ = road.at(idx, -(kit.kerb + 14.0) * side_dir)
        # Curved glulam-timber & dark-glass gondola station hall at lift base
        st_z = height_at(base_x, base_y)
        B["stone"].box((base_x, base_y, st_z - 2.2), (11.5, 7.6, 2.8), yaw_l)
        B["larch-warm"].box((base_x, base_y, st_z + 0.6), (12.2, 8.0, 3.8), yaw_l)
        B["dark"].box((base_x, base_y, st_z + 1.4), (12.4, 8.2, 1.8), yaw_l)
        kit.gable(B["copper-patina"], (base_x, base_y, st_z + 4.4), 12.8, 8.6, 1.35, yaw_l)
        # Compact stone-and-steel electrical substation hut beside each lift terminal
        sub_x, sub_y = base_x - clx * 9.5, base_y - cly * 9.5
        sub_z = height_at(sub_x, sub_y)
        B["chalet-plaster"].box((sub_x, sub_y, sub_z - 0.8), (3.2, 2.8, 3.1), yaw_l)
        B["steel"].box((sub_x, sub_y, sub_z + 0.2), (1.4, 2.88, 1.95), yaw_l)
        kit.gable(B["roof-slate"], (sub_x, sub_y, sub_z + 2.3), 3.6, 3.2, 0.75, yaw_l)
        # Hillside steel avalanche snow-retention bridges high on the flank
        for av_i in range(3):
            ax_b = base_x + clx * (95.0 + av_i * 22.0) - cly * 22.0
            ay_b = base_y + cly * (95.0 + av_i * 22.0) + clx * 22.0
            az_b = height_at(ax_b, ay_b)
            B["steel"].box((ax_b, ay_b, az_b - 0.2), (0.45, 9.5, 2.2), yaw_l + 0.25)

        pylon_tops = []
        for k in range(n_pylons):
            dist_k = k * 46.0
            px_k = base_x + clx * dist_k
            py_k = base_y + cly * dist_k
            pz_k = height_at(px_k, py_k)
            if not road.clear_of_road(px_k, py_k, kit.kerb + 3.5, idx):
                pz_k = s[idx]["z"]
            h_pylon = 12.5 + k * 1.4
            # Concrete foundation pad + inclined tubular steel mast + T-head cross-arm & sheave beams
            B["stone"].box((px_k, py_k, pz_k - 0.8), (1.8, 1.8, 1.1), yaw_l)
            B["steel"].box((px_k, py_k, pz_k + 0.3), (0.62, 0.62, h_pylon), yaw_l)
            B["steel"].box((px_k, py_k, pz_k + h_pylon), (0.55, 4.4, 0.48), yaw_l)
            B["dark"].box((px_k, py_k, pz_k + h_pylon - 0.35), (1.85, 4.6, 0.28), yaw_l)
            # Maintenance steel ladder + yellow tower-number plate on each pylon mast
            B["dark"].box((px_k - clx * 0.38, py_k - cly * 0.38, pz_k + 0.8), (0.08, 0.38, h_pylon - 1.0), yaw_l)
            B["yellow"].box((px_k - clx * 0.36, py_k - cly * 0.36, pz_k + h_pylon * 0.62), (0.10, 0.52, 0.52), yaw_l)
            pylon_tops.append((px_k, py_k, pz_k + h_pylon + 0.15))
            # Summer-quiet grassy piste marker lollipops along the cleared slope below
            if k > 0:
                B["parasol-red"].box((px_k - cly * 7.5, py_k + clx * 7.5, pz_k), (0.10, 0.10, 1.8), yaw_l)
                B["parasol-red"].box((px_k - cly * 7.5, py_k + clx * 7.5, pz_k + 1.65), (0.08, 0.52, 0.52), yaw_l)
                # Summer-rolled orange B-net bundle lashed to piste post
                B["crowd-3"].box((px_k - cly * 8.2, py_k + clx * 8.2, pz_k), (0.36, 0.36, 2.05), yaw_l)
                # Yellow TechnoAlpin snowmaking fan gun on tower mount beside the summer piste
                if k % 2 == 1:
                    sx_g = px_k + cly * 9.0
                    sy_g = py_k - clx * 9.0
                    sz_g = height_at(sx_g, sy_g)
                    B["stone"].box((sx_g, sy_g, sz_g - 0.3), (1.1, 1.1, 0.55), yaw_l)
                    B["ladin-blue"].box((sx_g + 0.65, sy_g - 0.45, sz_g + 0.15), (0.24, 0.24, 1.15), yaw_l)
                    B["steel"].box((sx_g, sy_g, sz_g + 0.25), (0.28, 0.28, 2.4), yaw_l)
                    B["yellow"].box((sx_g, sy_g, sz_g + 2.55), (1.15, 0.88, 0.88), yaw_l + 0.5)
                    B["dark"].box((sx_g + math.cos(yaw_l + 0.5) * 0.58, sy_g + math.sin(yaw_l + 0.5) * 0.58, sz_g + 2.62), (0.12, 0.72, 0.72), yaw_l + 0.5)

        p_perp_x, p_perp_y = -cly, clx
        for k in range(len(pylon_tops) - 1):
            a, b = pylon_tops[k], pylon_tops[k + 1]
            for lat_c in (-1.9, 1.9):
                _cable_segment(
                    B,
                    (a[0] + p_perp_x * lat_c, a[1] + p_perp_y * lat_c, a[2]),
                    (b[0] + p_perp_x * lat_c, b[1] + p_perp_y * lat_c, b[2]),
                    thickness=0.10,
                    sag=1.4,
                    steps=5,
                )
            # Hang lift cabins at mid-span along each pylon bay!
            mx_c = 0.5 * (a[0] + b[0]) + p_perp_x * 1.9
            my_c = 0.5 * (a[1] + b[1]) + p_perp_y * 1.9
            mz_c = 0.5 * (a[2] + b[2]) - 1.4
            B["steel"].box((mx_c, my_c, mz_c - 1.65), (0.12, 0.12, 1.65), yaw_l)
            if at_m < 2300.0:
                # Open 4-seat alpine chairlift carrier with blue weather-bubble hood!
                B["dark"].box((mx_c, my_c, mz_c - 2.55), (0.68, 2.25, 0.55), yaw_l)
                B["ladin-blue"].box((mx_c, my_c, mz_c - 2.00), (0.72, 2.28, 0.45), yaw_l)
            elif abs(at_m - 7480.0) < 50.0:
                # Iconic Forcella del Sassolungo narrow upright "coffin" telecabina cabin!
                cab_mat = ("yellow", "paint", "parasol-red")[k % 3]
                B[cab_mat].box((mx_c, my_c, mz_c - 3.75), (0.98, 0.92, 2.15), yaw_l)
                B["dark"].box((mx_c, my_c, mz_c - 2.55), (1.02, 0.96, 0.58), yaw_l)
            else:
                # Modern 8-passenger rounded alpine gondola cabin
                B["dark"].box((mx_c, my_c, mz_c - 3.35), (2.05, 1.55, 1.72), yaw_l)
                B["parasol-red"].box((mx_c, my_c, mz_c - 3.35), (2.08, 1.58, 0.42), yaw_l)

    # 3. Funifor Arabba - Porta Vescovo heavy twin-cable tramway climbing out of Arabba (at=3210 m) toward Padon!
    ar_idx = road.index(3210.0)
    ar_yaw = s[ar_idx]["h"] - 1.42
    acx, acy = math.cos(ar_yaw), math.sin(ar_yaw)
    abx, aby, _ = road.at(ar_idx, kit.kerb + 26.0)
    abz = height_at(abx, aby)
    B["stone"].box((abx, aby, abz - 2.0), (15.0, 11.0, 5.4), ar_yaw)
    B["chalet-plaster"].box((abx, aby, abz + 3.4), (15.4, 11.4, 4.6), ar_yaw)
    atx, aty, atz = abx + acx * 460.0, aby + acy * 460.0, abz + 225.0
    for w_lat in (-3.2, 3.2):
        _cable_segment(
            B,
            (abx - acy * w_lat, aby + acx * w_lat, abz + 7.2),
            (atx - acy * w_lat, aty + acx * w_lat, atz),
            thickness=0.15,
            sag=11.0,
            steps=8,
        )
    fcx, fcy = abx + acx * 195.0 - acy * 3.2, aby + acy * 195.0 + acx * 3.2
    fcz = abz + 96.0
    B["steel"].box((fcx, fcy, fcz - 2.8), (0.4, 2.8, 2.8), ar_yaw)
    B["dark"].box((fcx, fcy, fcz - 5.9), (5.2, 3.4, 3.1), ar_yaw)
    B["ladin-blue"].box((fcx, fcy, fcz - 4.4), (5.3, 3.5, 0.9), ar_yaw)

    # 4. Summer-parked red PistenBully snowcat groomers beside Pordoi & Gardena lift stations
    for cat_at, cat_side in ((5005.0, -1.0), (9945.0, -1.0)):
        c_idx = road.index(cat_at)
        cyaw = s[c_idx]["h"] + 0.6
        cx_g, cy_g, _ = road.at(c_idx, (kit.kerb + 10.5) * cat_side)
        cz_g = height_at(cx_g, cy_g)
        B["dark"].box((cx_g, cy_g, cz_g - 0.1), (4.2, 3.4, 0.72), cyaw)
        B["parasol-red"].box((cx_g, cy_g, cz_g + 0.62), (2.6, 2.2, 1.35), cyaw)
        B["dark"].box((cx_g + math.cos(cyaw) * 0.35, cy_g + math.sin(cyaw) * 0.35, cz_g + 1.15), (1.45, 2.25, 0.72), cyaw)
        B["steel"].box((cx_g + math.cos(cyaw) * 2.45, cy_g + math.sin(cyaw) * 2.45, cz_g + 0.05), (0.55, 3.9, 0.85), cyaw)

    # 5. Dolomiti Superski / Sellaronda Orange & Green circuit panoramic map boards outside lift terminals
    for map_at in (1805.0, 3405.0, 7465.0, 9905.0):
        m_idx = road.index(map_at)
        myaw = s[m_idx]["h"]
        mx0, my0, _ = road.at(m_idx, -(kit.kerb + 5.2))
        mz0 = height_at(mx0, my0)
        for p_o in (-1.5, 1.5):
            B["larch-aged"].box((mx0 + math.cos(myaw) * p_o, my0 + math.sin(myaw) * p_o, mz0 - 0.2), (0.18, 0.18, 2.95), myaw)
        B["paint"].box((mx0, my0, mz0 + 1.15), (3.2, 0.14, 1.55), myaw)
        B["crowd-3"].box((mx0 - math.cos(myaw) * 0.78, my0 - math.sin(myaw) * 0.78, mz0 + 2.45), (1.45, 0.16, 0.22), myaw)
        B["foliage"].box((mx0 + math.cos(myaw) * 0.78, my0 + math.sin(myaw) * 0.78, mz0 + 2.45), (1.45, 0.16, 0.22), myaw)
        kit.gable(B["larch-aged"], (mx0, my0, mz0 + 2.72), 3.6, 0.75, 0.36, myaw)

    # 6. Colfosco Plans-Frara gondola mid-station angle hall on the Gardena -> Colfosco descent (at=10720 m)
    pf_idx = road.index(10720.0)
    pf_yaw = s[pf_idx]["h"] + 0.35
    pfx, pfy, _ = road.at(pf_idx, kit.kerb + 20.0)
    pfz = height_at(pfx, pfy)
    B["stone"].box((pfx, pfy, pfz - 2.2), (13.5, 8.8, 3.2), pf_yaw)
    B["larch-warm"].box((pfx, pfy, pfz + 1.0), (14.0, 9.2, 3.8), pf_yaw)
    B["dark"].box((pfx, pfy, pfz + 1.8), (14.2, 9.4, 1.6), pf_yaw)
    kit.gable(B["copper-patina"], (pfx, pfy, pfz + 4.8), 14.6, 9.8, 1.4, pf_yaw)

    # 7. Open steel chairlift bullwheel return gantry on the Salei / Col Rodella shoulder (at=7280 m)
    bw_idx = road.index(7280.0)
    bw_yaw = s[bw_idx]["h"]
    bwx, bwy, _ = road.at(bw_idx, kit.kerb + 28.0)
    bwz = height_at(bwx, bwy)
    for leg_x in (-2.4, 2.4):
        B["steel"].box((bwx + math.cos(bw_yaw) * leg_x, bwy + math.sin(bw_yaw) * leg_x, bwz - 0.5), (0.45, 0.45, 5.2), bw_yaw)
    B["steel"].box((bwx, bwy, bwz + 4.7), (5.6, 1.8, 0.65), bw_yaw)
    B["parasol-red"].box((bwx, bwy, bwz + 4.25), (3.8, 3.8, 0.28), bw_yaw)

    # 8. Slatted aged-larch snow-drift fences (barriere fermaneve) on wind-exposed piste ridges
    for sf_m, sf_s in ((4820.0, 1.0), (10020.0, 1.0)):
        sf_idx = road.index(sf_m)
        sf_yaw = s[sf_idx]["h"] + 0.4
        for f_seg in range(3):
            fx_s, fy_s, _ = road.at(sf_idx, (kit.kerb + 18.0 + f_seg * 6.5) * sf_s)
            fz_s = height_at(fx_s, fy_s)
            B["larch-aged"].box((fx_s, fy_s, fz_s - 0.2), (5.2, 0.16, 1.65), sf_yaw)

    # 9. Sellaronda winter ski-trail overpass abutments with Orange & Green circuit shields (Arabba & Plan de Gralba)
    for sk_m in (3340.0, 8655.0):
        sk_idx = road.index(sk_m)
        skyaw = s[sk_idx]["h"]
        for side in (-1.0, 1.0):
            ax_s, ay_s, az_s = kit.P(sk_idx, 0.0, (kit.kerb + 2.8) * side, -0.4)
            B["stone"].box((ax_s, ay_s, az_s), (5.4, 2.2, 3.85), skyaw)
            B["larch-warm"].box((ax_s, ay_s, az_s + 3.85), (5.6, 2.3, 0.95), skyaw)
            B["crowd-3" if side < 0 else "foliage"].box((ax_s, ay_s, az_s + 2.65), (1.45, 2.32, 0.65), skyaw)

    # 10. Banked wooden Sellaronda MTB Track Tour flow-trail berms on the summer pistes
    for mtb_m in (3480.0, 9880.0):
        m_idx = road.index(mtb_m)
        myaw = s[m_idx]["h"] + 0.55
        for bm_k in range(3):
            bx_m, by_m, _ = road.at(m_idx, kit.kerb + 15.0 + bm_k * 8.5)
            bz_m = height_at(bx_m, by_m)
            B["larch-warm"].box((bx_m, by_m, bz_m), (4.6, 1.45, 0.68), myaw + bm_k * 0.4)

    return cableways_out
