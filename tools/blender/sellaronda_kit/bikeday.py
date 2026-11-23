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


def build_bikeday_life(B, kit, road, height_at, rng) -> list[dict]:
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
            if slot == 2:
                B["dark"].box((mx + 0.85, my - 0.55, mz), (0.34, 0.38, 1.48), yaw + 0.6)
                B["parasol-red"].box((mx + 0.85, my - 0.55, mz + 1.48), (0.26, 0.26, 0.26), yaw + 0.6)

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

    # 5. Soaring thermal paragliders circling above Col Rodella / Passo Sella, Sass Pordoi & Passo Gardena!
    wing_mats = ("parasol-red", "yellow", "ladin-blue", "accent-2", "crowd-1")
    glider_spots = (
        (4820.0,  65.0, 88.0),
        (5120.0, -78.0, 112.0),
        (7560.0,  58.0, 76.0),
        (7860.0,  92.0, 98.0),
        (10080.0, 64.0, 82.0),
        (10290.0,-70.0, 96.0),
    )
    for g_i, (g_at, g_lat, g_up) in enumerate(glider_spots):
        g_idx = road.index(g_at)
        gx_w, gy_w, gz_w = road.at(g_idx, g_lat, g_up)
        gyaw = s[g_idx]["h"] + g_i * 0.9
        wmat = wing_mats[g_i % len(wing_mats)]
        # 5-segment arched parafoil canopy + pilot harness pod
        for seg_p in range(-2, 3):
            drop = abs(seg_p) * 0.55
            px_s = gx_w - math.sin(gyaw) * (seg_p * 2.15)
            py_s = gy_w + math.cos(gyaw) * (seg_p * 2.15)
            B[wmat].box((px_s, py_s, gz_w - drop), (2.45, 2.25, 0.24), gyaw)
        B["dark"].box((gx_w, gy_w, gz_w - 6.2), (0.75, 0.55, 0.95), gyaw)

    # 6. Summit-ramp cheering spectators in alpine jackets & Sellaronda Bike Day feed-station gazebos
    for p_i, p in enumerate(PASSES):
        # Pop-up Bike Day blue/white hydration gazebo 35 m before the summit sign
        gz_idx = road.index(p["at"] - 35.0)
        gz_yaw = s[gz_idx]["h"]
        gx0, gy0, gz0 = kit.P(gz_idx, 0.0, -(kit.kerb + 3.4), 0.0)
        for dx_l in (-1.6, 1.6):
            for dy_l in (-1.6, 1.6):
                B["steel"].box(
                    (gx0 + math.cos(gz_yaw) * dx_l - math.sin(gz_yaw) * dy_l, gy0 + math.sin(gz_yaw) * dx_l + math.cos(gz_yaw) * dy_l, gz0),
                    (0.08, 0.08, 2.35),
                    gz_yaw,
                )
        kit.gable(B["ladin-blue"], (gx0, gy0, gz0 + 2.35), 3.6, 3.6, 0.85, gz_yaw)
        B["paint"].box((gx0, gy0, gz0), (2.6, 0.95, 0.88), gz_yaw)
        # Mechanical neutral-service repair tripod & spare wheel rack beside the feed gazebo
        wk_x = gx0 + math.cos(gz_yaw) * 2.4
        wk_y = gy0 + math.sin(gz_yaw) * 2.4
        B["steel"].box((wk_x, wk_y, gz0), (0.12, 0.12, 1.55), gz_yaw)
        B["ladin-blue"].box((wk_x, wk_y, gz0 + 1.15), (0.98, 0.08, 0.45), gz_yaw)
        B["dark"].box((wk_x - math.cos(gz_yaw) * 0.75, wk_y - math.sin(gz_yaw) * 0.75, gz0), (0.66, 0.66, 0.66), gz_yaw)

        # Cheering hikers / tifosi lining the final 140 m to the pass
        for sp_k in range(8):
            sp_idx = road.index(p["at"] - 145.0 + sp_k * 16.0)
            side = -1.0 if sp_k % 2 == 0 else 1.0
            sx_p, sy_p, sz_p = kit.P(sp_idx, 0.0, (kit.kerb + 1.45) * side, 0.0)
            B["dark"].box((sx_p, sy_p, sz_p), (0.32, 0.36, 0.88), s[sp_idx]["h"])
            B[jerseys[(sp_k + p_i) % len(jerseys)]].box((sx_p, sy_p, sz_p + 0.88), (0.36, 0.44, 0.62), s[sp_idx]["h"])
            B["skin"].box((sx_p, sy_p, sz_p + 1.50), (0.24, 0.24, 0.26), s[sp_idx]["h"])

    # 7. Aero-tucked descending cyclists sweeping down the four pass descents
    for p_i, p in enumerate(PASSES):
        d_desc = p["at"] + 160.0
        k_d = 0
        while d_desc < p["descent_to"] - 90.0:
            d_idx = road.index(d_desc)
            cx_d, cy_d, cz_d = road.at(d_idx, -(kit.kerb - 0.65))
            _road_cyclist(B, cx_d, cy_d, cz_d, s[d_idx]["h"], jerseys[(p_i + k_d) % len(jerseys)], standing=False)
            k_d += 1
            d_desc += 145.0

    # 8. Cycling team support cars with roof-mounted spare road bikes at the 4 pass summit pull-outs
    car_mats = ("ladin-blue", "parasol-red", "yellow", "paint")
    for c_i, p in enumerate(PASSES):
        c_idx = road.index(p["at"] + 28.0)
        cyaw = s[c_idx]["h"] + 0.35
        cx_car, cy_car, cz_car = kit.P(c_idx, 0.0, -(kit.kerb + 4.4), 0.0)
        B["dark"].box((cx_car, cy_car, cz_car), (4.35, 1.82, 0.52), cyaw)
        B[car_mats[c_i]].box((cx_car, cy_car, cz_car + 0.38), (4.45, 1.78, 0.68), cyaw)
        B["dark"].box((cx_car - math.cos(cyaw) * 0.25, cy_car - math.sin(cyaw) * 0.25, cz_car + 1.06), (2.55, 1.62, 0.52), cyaw)
        # Three spare team road bikes upright on the roof rack!
        for rb_lat in (-0.48, 0.0, 0.48):
            rx_b = cx_car - math.sin(cyaw) * rb_lat
            ry_b = cy_car + math.cos(cyaw) * rb_lat
            B["dark"].box((rx_b, ry_b, cz_car + 1.58), (1.42, 0.08, 0.58), cyaw)
            B["yellow"].box((rx_b, ry_b, cz_car + 1.88), (0.92, 0.07, 0.42), cyaw)

    # 9. Fluttering Sellaronda Bike Day teardrop feather flags at climb foot & summit approaches
    feather_mats = ("ladin-blue", "accent-2", "parasol-red", "yellow")
    for f_i, p in enumerate(PASSES):
        for base_d in (p["climb_from"] + 25.0, p["at"] - 85.0, p["at"] - 55.0):
            f_idx = road.index(base_d)
            fyaw = s[f_idx]["h"]
            for side_k, side in enumerate((-1.0, 1.0)):
                fx_f, fy_f, fz_f = kit.P(f_idx, 0.0, (kit.kerb + 1.65) * side, -0.1)
                B["dark"].box((fx_f, fy_f, fz_f), (0.06, 0.06, 3.45), fyaw)
                B[feather_mats[(f_i + side_k) % len(feather_mats)]].box((fx_f, fy_f, fz_f + 1.15), (0.68, 0.05, 2.15), fyaw + 0.22)

    # 10. Mountain hikers with coloured alpine backpacks strolling meadow footpaths off the passes
    for hk_i, hk_at in enumerate((1980.0, 4860.0, 7440.0, 7660.0, 10060.0, 10280.0)):
        h_idx = road.index(hk_at)
        for pair_k in (0, 1):
            hx, hy, _ = road.at(h_idx, (kit.kerb + 6.5 + pair_k * 1.8) * (1.0 if hk_i % 2 == 0 else -1.0))
            hz = height_at(hx, hy)
            hyaw = s[h_idx]["h"] + 0.4
            B["dark"].box((hx, hy, hz), (0.28, 0.34, 0.86), hyaw)
            B[jerseys[(hk_i + pair_k) % len(jerseys)]].box((hx, hy, hz + 0.86), (0.32, 0.40, 0.58), hyaw)
            B["parasol-red"].box((hx - math.cos(hyaw) * 0.20, hy - math.sin(hyaw) * 0.20, hz + 0.92), (0.22, 0.32, 0.46), hyaw)
            B["skin"].box((hx, hy, hz + 1.44), (0.22, 0.22, 0.24), hyaw)

    # Origin-centered animated lead thermal paraglider in WHOLE group "Glider" soaring over Passo Sella!
    from . import srgb as _srgb
    gl = B["glider"]
    gl.colours = []
    def _gbox(cx_g: float, cy_g: float, cz_g: float, sx: float, sy: float, sz: float, col_hex: int):
        c_rgba = _srgb(col_hex)
        base_i = len(gl.verts)
        hx_g, hy_g = sx * 0.5, sy * 0.5
        for z_v in (cz_g, cz_g + sz):
            for dx_v, dy_v in ((-hx_g, -hy_g), (hx_g, -hy_g), (hx_g, hy_g), (-hx_g, hy_g)):
                gl.verts.append((cx_g + dx_v, cy_g + dy_v, z_v))
                gl.colours.append(c_rgba)
        for f_t in ((4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (0, 3, 2, 1)):
            gl.faces.append(tuple(base_i + q for q in f_t))
    for seg_p in range(-3, 4):
        _gbox(0.0, seg_p * 1.95, -abs(seg_p) * 0.46, 2.75, 2.05, 0.24, 0xF05692 if abs(seg_p) < 2 else 0xFFD040)
    _gbox(0.0, 0.0, -6.2, 0.85, 0.58, 0.98, 0x1E222A)

    # Event sports photographers in yellow vests with white telephoto lenses at scenic switchback apexes
    for ph_at in (1920.0, 4480.0, 7240.0, 9880.0):
        ph_idx = road.index(ph_at)
        phyaw = s[ph_idx]["h"] + math.pi
        phx, phy, phz = kit.P(ph_idx, 0.0, kit.kerb + 1.65, 0.0)
        B["dark"].box((phx, phy, phz), (0.36, 0.38, 0.62), phyaw)
        B["yellow"].box((phx, phy, phz + 0.62), (0.36, 0.42, 0.48), phyaw)
        B["skin"].box((phx, phy, phz + 1.10), (0.22, 0.22, 0.24), phyaw)
        B["paint"].box((phx + math.cos(phyaw) * 0.34, phy + math.sin(phyaw) * 0.34, phz + 0.98), (0.42, 0.12, 0.12), phyaw)

    # Two-rider long-wheelbase tandem road bikes joining Sellaronda Bike Day on Pordoi & Sella!
    for td_at in (4760.0, 7580.0):
        td_idx = road.index(td_at)
        tdyaw = s[td_idx]["h"]
        tx0, ty0, tz0 = road.at(td_idx, -(kit.kerb - 0.72))
        ca_t, sa_t = math.cos(tdyaw), math.sin(tdyaw)
        for w_o in (-0.88, 0.88):
            B["dark"].box((tx0 + ca_t * w_o, ty0 + sa_t * w_o, tz0 + 0.02), (0.64, 0.08, 0.64), tdyaw)
        B["parasol-red"].box((tx0, ty0, tz0 + 0.42), (1.68, 0.08, 0.46), tdyaw)
        for r_o in (-0.36, 0.38):
            B["crowd-2"].box((tx0 + ca_t * r_o, ty0 + sa_t * r_o, tz0 + 0.84), (0.46, 0.34, 0.42), tdyaw)
            B["paint"].box((tx0 + ca_t * (r_o + 0.22), ty0 + sa_t * (r_o + 0.22), tz0 + 1.18), (0.24, 0.22, 0.22), tdyaw)

    # Polizia Stradale blue-and-white alpine motorbike marshals stationed at valley road-closure checkpoints
    for cp_m in (420.0, 3265.0, 6260.0, 9060.0):
        cp_idx = road.index(cp_m)
        cpyaw = s[cp_idx]["h"] + 0.55
        mx_p, my_p, mz_p = kit.P(cp_idx, 0.0, kit.kerb + 2.35, 0.0)
        _touring_motorbike(B, mx_p, my_p, mz_p, cpyaw, "ladin-blue", with_rider=True)
        B["parasol-red"].box(kit.P(cp_idx, 2.2, kit.kerb + 2.35, 0.0), (0.25, 1.85, 0.92), s[cp_idx]["h"])
        B["paint"].box(kit.P(cp_idx, 2.2, kit.kerb + 2.35, 0.68), (0.27, 1.85, 0.22), s[cp_idx]["h"])

    # Standing cyclists attacking the punchy Over/Under interval ramps!
    for seg_i, st_seg in enumerate(kit.st):
        if st_seg["kind"] == "work" and st_seg["level"] >= 22:
            at_idx = road.index(st_seg["from"] + 38.0)
            cx_a, cy_a, cz_a = road.at(at_idx, -(kit.kerb - 0.62))
            _road_cyclist(B, cx_a, cy_a, cz_a, s[at_idx]["h"], jerseys[seg_i % len(jerseys)], standing=True)

    # Classic Italian Vespa scooters parked outside village Konditorei / cafés
    for vs_m, vs_s in ((302.0, 1.0), (6072.0, -1.0)):
        v_idx = road.index(vs_m)
        vyaw = s[v_idx]["h"] + 1.15
        for sc_k in range(3):
            vx_s, vy_s, vz_s = kit.P(v_idx, sc_k * 1.15, (kit.kerb + 3.8) * vs_s, 0.0)
            B["dark"].box((vx_s, vy_s, vz_s), (1.18, 0.14, 0.42), vyaw)
            B[("parasol-red", "glacier-ice", "yellow")[sc_k]].box((vx_s, vy_s, vz_s + 0.25), (1.12, 0.36, 0.58), vyaw)
            B["bulb"].box((vx_s + math.cos(vyaw) * 0.48, vy_s + math.sin(vyaw) * 0.48, vz_s + 0.88), (0.12, 0.18, 0.18), vyaw)

    # Giant waving Tricolore & Ladin flags held by tifosi on the final Pordoi & Sella steep ramps
    for tf_at, tf_mat in ((4880.0, "foliage"), (4905.0, "parasol-red"), (7680.0, "ladin-blue"), (7705.0, "accent-2")):
        tf_idx = road.index(tf_at)
        tf_yaw = s[tf_idx]["h"] + 0.35
        tx_f, ty_f, tz_f = kit.P(tf_idx, 0.0, -(kit.kerb + 1.55), 0.0)
        B["paint"].box((tx_f, ty_f, tz_f + 0.9), (0.06, 0.06, 3.2), tf_yaw)
        B[tf_mat].box((tx_f + math.cos(tf_yaw) * 0.8, ty_f + math.sin(tf_yaw) * 0.8, tz_f + 3.1), (1.55, 0.05, 1.05), tf_yaw)

    # Croce Bianca / Weißes Kreuz alpine medical standby ambulance vans at Pordoi & Gardena
    for am_at in (4968.0, 10172.0):
        am_idx = road.index(am_at)
        amyaw = s[am_idx]["h"] - 0.25
        ax_m, ay_m, az_m = kit.P(am_idx, 0.0, kit.kerb + 4.8, 0.0)
        B["dark"].box((ax_m, ay_m, az_m), (4.85, 2.02, 0.55), amyaw)
        B["paint"].box((ax_m, ay_m, az_m + 0.42), (4.95, 1.98, 1.88), amyaw)
        B["parasol-red"].box((ax_m, ay_m, az_m + 1.18), (5.00, 2.02, 0.34), amyaw)
        B["ladin-blue"].box((ax_m + math.cos(amyaw) * 1.4, ay_m + math.sin(amyaw) * 1.4, az_m + 2.30), (0.38, 1.25, 0.18), amyaw)

    # Cyclists refilling water bidons beside the 4 summit spring fountains
    for rf_i, p in enumerate(PASSES):
        rf_idx = road.index(p["at"] + 11.8)
        rx_f, ry_f, rz_f = kit.P(rf_idx, 0.0, -(kit.kerb + 2.15), 0.0)
        _road_cyclist(B, rx_f, ry_f, rz_f, s[rf_idx]["h"] - 0.8, jerseys[(rf_i + 3) % len(jerseys)], standing=True)

    # White Giro / Bike Day tifosi campervans with striped awnings on upper Pordoi & Sella lay-bys
    for cv_m in (4690.0, 7490.0):
        cv_idx = road.index(cv_m)
        cvyaw = s[cv_idx]["h"] + 0.15
        cx_v, cy_v, cz_v = kit.P(cv_idx, 0.0, kit.kerb + 3.8, 0.0)
        B["dark"].box((cx_v, cy_v, cz_v), (6.1, 2.25, 0.55), cvyaw)
        B["paint"].box((cx_v, cy_v, cz_v + 0.45), (6.2, 2.22, 2.35), cvyaw)
        B["ladin-blue"].box((cx_v, cy_v, cz_v + 1.55), (6.24, 2.25, 0.28), cvyaw)
        B["awning"].box((cx_v - math.sin(cvyaw) * -1.85, cy_v + math.cos(cvyaw) * -1.85, cz_v + 2.48), (4.2, 1.65, 0.14), cvyaw)

    # Sociable 3-rider Bike Day club groups spinning along the valley approaches
    for cl_i, cl_m in enumerate((580.0, 3285.0, 6230.0, 8995.0)):
        cl_idx = road.index(cl_m)
        clyaw = s[cl_idx]["h"]
        j_mat = jerseys[cl_i % len(jerseys)]
        for r_slot, (al_o, lat_o) in enumerate(((0.0, -3.6), (-1.4, -4.2), (-2.6, -3.5))):
            px_g, py_g, pz_g = kit.P(cl_idx, al_o, lat_o, 0.0)
            _road_cyclist(B, px_g, py_g, pz_g, clyaw, j_mat, standing=False)

    # Red RFID split-timing mats & yellow timing decoder cases at all 4 pass crests
    for p in PASSES:
        tm_idx = road.index(p["at"] - 2.2)
        tmyaw = s[tm_idx]["h"]
        B["parasol-red"].box(kit.P(tm_idx, 0.0, 0.0, 0.022), (0.68, kit.kerb * 1.88, 0.02), tmyaw)
        B["yellow"].box(kit.P(tm_idx, 0.0, -(kit.kerb + 1.15), 0.0), (0.55, 0.45, 0.42), tmyaw)

    # Family & junior Bike Day cyclists spinning out of Corvara & Selva
    for jr_m in (465.0, 9035.0):
        jr_idx = road.index(jr_m)
        jryaw = s[jr_idx]["h"]
        jx0, jy0, jz0 = road.at(jr_idx, -(kit.kerb - 0.48))
        B["dark"].box((jx0, jy0, jz0 + 0.02), (0.98, 0.07, 0.48), jryaw)
        B["neon-lime"].box((jx0, jy0, jz0 + 0.58), (0.38, 0.28, 0.34), jryaw)
        B["yellow"].box((jx0 + math.cos(jryaw) * 0.20, jy0 + math.sin(jryaw) * 0.20, jz0 + 0.88), (0.22, 0.20, 0.20), jryaw)

    sp_idx = road.index(7710.0)
    sp_x, sp_y, sp_z = road.at(sp_idx, 42.0, 68.0)
    return [{
        "center": [round(sp_x, 2), round(sp_z, 2), round(-sp_y, 2)],
        "radiusX": 68.0,
        "radiusZ": 46.0,
        "liftAmplitude": 7.5,
        "periodSeconds": 46.0,
    }]


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
