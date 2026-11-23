"""Detail 10 (alpenglow-light): Rose-gold Dolomite Enrosadira rock illumination, sky clouds & dusk glow."""

from __future__ import annotations

import math

import sky
from . import PASSES, VILLAGES, mix, smoothstep, srgb

ALPENGLOW_SUNWARD = (
    (0.0, 0xFFD0A0),
    (0.14, 0xF89474),
    (0.34, 0xD86E88),
    (0.60, 0x6472B0),
    (1.0, 0x1E3876),
)
ALPENGLOW_AWAY = (
    (0.0, 0xE2B0BC),
    (0.22, 0xB296C2),
    (0.52, 0x5E78B6),
    (1.0, 0x1E3876),
)


def enrosadira_colour_fn(az_sun: float):
    """Computes authentic Dolomite Enrosadira vertex colours from surface normal, elevation & horizontal strata."""
    sun_dx, sun_dy, sun_dz = math.cos(az_sun) * 0.94, math.sin(az_sun) * 0.94, 0.34
    pale_dolomite = srgb(0xCEC4B4)
    shadow_indigo = srgb(0x425272)
    apricot_gold = srgb(0xF8B482)
    enrosadira_rose = srgb(0xF27668)
    summit_magenta = srgb(0xD86482)
    glacier_blue = srgb(0x98B4D8)
    glacier_rose = srgb(0xFCE0E2)

    def colour_at(nx: float, ny: float, nz: float, z: float, snow: bool = False):
        dot = nx * sun_dx + ny * sun_dy + nz * sun_dz
        if snow:
            lit = smoothstep(-0.25, 0.80, dot)
            alt_warm = smoothstep(340.0, 820.0, z)
            ice_shadow = mix(srgb(0x6C9EC4), glacier_blue, alt_warm)
            ice_sun = mix(srgb(0xE8F2FA), glacier_rose, 0.35 + 0.65 * alt_warm)
            zenith_cool = srgb(0x88A8DC)
            return mix(mix(ice_shadow, zenith_cool, max(0.0, nz) * 0.28), ice_sun, 0.24 + 0.76 * lit)

        # Subtle horizontal Hauptdolomit bedding strata modulation by elevation
        # Vertical dark meltwater seepage streaks characteristic of overhanging Dolomite walls
        az_face = math.atan2(ny, nx)
        seep = 1.0 - 0.10 * (1.0 - abs(nz)) * max(0.0, math.sin(az_face * 19.0) * math.cos(az_face * 7.0))
        strata = (0.93 + 0.07 * math.sin(z * 0.14) * math.cos(z * 0.037)) * seep
        in_sun = smoothstep(-0.18, 0.72, dot)
        high_glow = smoothstep(118.0, 425.0, z) * in_sun
        cassian_peach = srgb(0xFAD0A8)
        warm_band = mix(cassian_peach, apricot_gold, smoothstep(160.0, 310.0, z))
        warm_band = mix(warm_band, enrosadira_rose, smoothstep(290.0, 580.0, z))
        warm_band = mix(warm_band, summit_magenta, smoothstep(580.0, 880.0, z) * 0.48)
        # Deepen vertical dihedral clefts facing away from the sun while boosting upward sky fill on ledges
        sky_bounce = 0.88 + 0.16 * max(0.0, nz)
        rock_lit = mix(shadow_indigo, pale_dolomite, smoothstep(-0.42, 0.32, dot))
        rock_lit = mix(srgb(0x6E7462), rock_lit, smoothstep(85.0, 155.0, z))
        grazing = math.exp(-((dot - 0.18) / 0.24) ** 2) * smoothstep(240.0, 560.0, z)
        c = mix(rock_lit, warm_band, high_glow * 0.90)
        c = mix(c, apricot_gold, grazing * 0.22)
        return (c[0] * strata * sky_bounce, c[1] * strata * sky_bounce, c[2] * strata * sky_bounce, 1.0)

    return colour_at


def alpenglow_sky_colour(dx: float, dy: float, dz: float, az: float, haze):
    """Evening Dolomite sky with lenticular mountain-wave clouds lit coral-gold from underneath."""
    h = max(0.0, dz)
    toward = math.cos(math.atan2(dy, dx) - az)
    sunward = ((toward + 1.0) * 0.5) ** 1.35
    band = h ** 0.54
    air = mix(sky.ramp(ALPENGLOW_AWAY, band), sky.ramp(ALPENGLOW_SUNWARD, band), sunward)
    k = 1.0 / (dz + 0.19)
    ux, uy = dx * k, dy * k
    # Elongated lenticular wave clouds + high cirrus streaks
    wave = 0.88 * sky.fbm(ux * 2.2 + 1.7, uy * 0.85 - 0.6, 3, 19) + 0.12 * math.sin(ux * 9.5 + uy * 3.2)
    cover = smoothstep(0.47, 0.73, wave) * smoothstep(0.03, 0.15, h) * (1.0 - smoothstep(0.52, 0.88, h))
    rim_edge = math.exp(-((wave - 0.52) / 0.06) ** 2) * sunward
    rim_edge = cover * (1.0 - cover) * 4.0
    cloud_belly = mix(srgb(0x5E5E8C), srgb(0xFF9E80), 0.28 + 0.72 * sunward)
    cloud_belly = mix(cloud_belly, srgb(0xFFE4CC), rim_edge * sunward * 0.32)
    cloud_belly = mix(cloud_belly, srgb(0xFFD6A8), rim_edge * 0.55)
    cirrus = sky.fbm(ux * 4.6 - 1.2, uy * 0.45 + 3.1, 2, 31)
    cirrus_mask = smoothstep(0.56, 0.82, cirrus) * smoothstep(0.22, 0.52, h) * (1.0 - smoothstep(0.68, 0.95, h))
    c = mix(air, cloud_belly, cover * 0.76)
    c = mix(c, srgb(0xF8B8C6), cirrus_mask * (0.22 + 0.26 * sunward))
    # Warm solar aureole just above the western pass horizon
    sun_ang = max(0.0, dx * math.cos(az) * 0.96 + dy * math.sin(az) * 0.96 + dz * 0.18)
    c = mix(c, srgb(0xFFE2B8), (sun_ang ** 18.0) * 0.42)
    # Subtle vertical alpine ice-crystal sun pillar rising above the WSW sun disc
    az_diff = math.remainder(math.atan2(dy, dx) - az, math.tau)
    pillar = math.exp(-((az_diff / 0.055) ** 2)) * smoothstep(0.02, 0.14, h) * (1.0 - smoothstep(0.18, 0.44, h))
    c = mix(c, srgb(0xFFD8B0), pillar * 0.24)
    # Subtle radial crepuscular fan beams above the western Dolomite saddles
    ray_theta = math.atan2(h - 0.12, az_diff)
    rays = (0.5 + 0.5 * math.sin(ray_theta * 11.0)) * math.exp(-((az_diff / 0.42) ** 2)) * smoothstep(0.02, 0.28, h) * (1.0 - smoothstep(0.32, 0.65, h))
    c = mix(c, srgb(0xFFC89E), rays * 0.14)
    # Anti-solar Belt of Venus (Cintura di Venere) rose-lilac band above steel-blue earth shadow in the east!
    anti = max(0.0, -toward) ** 1.6
    venus = math.exp(-((h - 0.11) / 0.075) ** 2) * anti
    earth_sh = smoothstep(0.09, 0.0, h) * anti
    c = mix(c, srgb(0x465884), earth_sh * 0.42)
    c = mix(c, srgb(0xEE9CB4), venus * 0.38)
    c = mix(c, mix(haze, srgb(0xFFCEA4), sunward * 0.42), math.exp(-12.5 * h) * 0.46)
    return sky.grade(c)


def emit_dusk_lights(kit, road, height_at) -> None:
    """Places warm amber dusk terrace & church-square light pools + soft Halos at the 4 cols & 4 villages."""
    for p in PASSES:
        for delta, side in ((-22.0, -1.0), (30.0, 1.0)):
            idx = road.index(p["at"] + delta)
            off = (kit.kerb + 4.8) * side
            lx, ly, lz = road.at(idx, off, 3.2)
            kit.light((lx, ly, lz), "glow-window", 26.0, 0.65)
            kit.halo((lx, ly, lz), "glow-window")

    for v in VILLAGES:
        for delta, side in ((-45.0, -1.0), (15.0, 1.0), (65.0, -1.0)):
            idx = road.index(v["at"] + delta)
            off = (kit.kerb + 4.2) * side
            lx, ly, lz = road.at(idx, off, 3.6)
            kit.light((lx, ly, lz), "glow-lamp", 24.0, 0.55)
            kit.halo((lx, ly, lz), "glow-lamp")

    # Warm golden architectural floodlights on the 5 parish churches + Cappella di San Maurizio
    for ch_at, ch_off in ((275.0, -20.0), (3135.0, 21.0), (6130.0, -21.5), (8930.0, 21.0), (10162.0, -8.5), (10980.0, 22.0)):
        c_idx = road.index(ch_at)
        cx_l, cy_l, cz_l = road.at(c_idx, ch_off, 12.0)
        kit.light((cx_l, cy_l, cz_l), "gold", 30.0, 0.72)
        kit.halo((cx_l, cy_l, cz_l), "gold")

    # Warm amber ceiling lamps lighting the road inside the Pordoi & Gardena rockfall galleries!
    for gal_a, gal_b in ((4568.0, 4644.0), (9668.0, 9736.0)):
        d_g = gal_a
        while d_g <= gal_b:
            g_idx = road.index(d_g)
            gx_l, gy_l, gz_l = road.at(g_idx, 0.0, 4.75)
            kit.light((gx_l, gy_l, gz_l), "bulb", 18.0, 0.95)
            kit.halo((gx_l, gy_l, gz_l), "bulb")
            d_g += 24.0

    # Discreet warm uplight on the 4 trilingual pass summit photo signboards
    for p in PASSES:
        s_idx = road.index(p["at"] + 6.0)
        sx_l, sy_l, sz_l = road.at(s_idx, -(kit.kerb + 2.4), 2.4)
        kit.light((sx_l, sy_l, sz_l), "glow-window", 12.0, 0.45)

    # Warm dusk shopfront & Konditorei glow in Corvara, Canazei & Selva
    for sf_at, sf_off in ((295.0, 6.8), (6095.0, 5.8), (8865.0, -8.6), (8925.0, 8.6)):
        sf_idx = road.index(sf_at)
        vx_l, vy_l, vz_l = road.at(sf_idx, sf_off, 2.2)
        kit.light((vx_l, vy_l, vz_l), "glow-window", 16.0, 0.50)

    # Warm village stream-bridge lantern pools
    for br_at in (235.0, 3090.0, 6085.0, 8895.0):
        b_idx = road.index(br_at)
        bx_l, by_l, bz_l = road.at(b_idx, 0.0, 2.2)
        kit.light((bx_l, by_l, bz_l), "bulb", 15.0, 0.48)

    # Dedicated golden memorial uplight on the Fausto Coppi obelisk at Passo Pordoi
    cp_idx = road.index(4950.0)
    cpx_l, cpy_l, cpz_l = road.at(cp_idx, -(kit.kerb + 6.8), 2.8)
    kit.light((cpx_l, cpy_l, cpz_l), "gold", 16.0, 0.70)
    kit.halo((cpx_l, cpy_l, cpz_l), "gold")

    # Warm dusk terrace light pools at the 4 mid-climb flank huts
    for fl_at, fl_side in ((1460.0, -1.0), (7120.0, 1.0), (9420.0, 1.0), (10420.0, 1.0)):
        f_idx = road.index(fl_at)
        fx_l, fy_l, fz_l = road.at(f_idx, (kit.kerb + 5.2) * fl_side, 3.0)
        kit.light((fx_l, fy_l, fz_l), "glow-window", 22.0, 0.58)
        kit.halo((fx_l, fy_l, fz_l), "glow-window")

    # Monumental golden evening floodlight halos on Sacrario del Pordoi & Castel Wolkenstein
    for mn_at, mn_off, mn_z in ((4780.0, -(kit.kerb + 38.0), 8.5), (9020.0, kit.kerb + 46.0, 22.0)):
        m_i = road.index(mn_at)
        mx_h, my_h, _ = road.at(m_i, mn_off)
        kit.halo((mx_h, my_h, height_at(mx_h, my_h) + mn_z), "gold")
    # Warm dusk light pools beneath the 4 village Bike Day overhead banners
    for bn_m in (195.0, 3040.0, 6045.0, 8850.0):
        b_i = road.index(bn_m)
        bx_u, by_u, bz_u = road.at(b_i, 0.0, 5.1)
        kit.light((bx_u, by_u, bz_u), "glow-lamp", 20.0, 0.52)
    # Warm chalet & square light pools at Plan de Gralba & Colfosco
    for hm_at, hm_s in ((8620.0, 1.0), (10960.0, -1.0), (11030.0, 1.0)):
        hm_i = road.index(hm_at)
        hx_l, hy_l, hz_l = road.at(hm_i, (kit.kerb + 4.5) * hm_s, 3.4)
        kit.light((hx_l, hy_l, hz_l), "glow-lamp", 22.0, 0.54)
        kit.halo((hx_l, hy_l, hz_l), "glow-lamp")
    # Warm festival light pools under the 4 Bike Day summit hydration gazebos
    for p in PASSES:
        gz_i = road.index(p["at"] - 35.0)
        gx_l, gy_l, gz_l = road.at(gz_i, -(kit.kerb + 3.4), 2.4)
        kit.light((gx_l, gy_l, gz_l), "bulb", 16.0, 0.55)
    # Warm woodcarver vitrine light pools in Selva di Val Gardena
    for wc_at, wc_s in ((8865.0, -1.0), (8925.0, 1.0), (8985.0, -1.0)):
        wi = road.index(wc_at)
        wx_l, wy_l, wz_l = road.at(wi, (kit.kerb + 7.2) * wc_s, 2.2)
        kit.light((wx_l, wy_l, wz_l), "glow-window", 14.0, 0.48)
    # [ANCHOR:alpenglow-lights]


def build_valley_mist(B, road, height_at) -> None:
    """Lays delicate dusk valley-mist ribbons down in the four deep valley hollows off the road."""
    for v in VILLAGES:
        v_idx = road.index(v["at"] + 90.0)
        v_yaw = road.s[v_idx]["h"]
        for side in (-1.0, 1.0):
            mx, my, _ = road.at(v_idx, 56.0 * side)
            if road.clear_of_road(mx, my, 32.0, v_idx):
                mz = height_at(mx, my) + 4.5
                ca, sa = math.cos(v_yaw), math.sin(v_yaw)
                p0 = (mx - ca * 55.0 - sa * 18.0, my - sa * 55.0 + ca * 18.0, mz)
                p1 = (mx + ca * 55.0 - sa * 18.0, my + sa * 55.0 + ca * 18.0, mz)
                p2 = (mx + ca * 55.0 + sa * 18.0, my + sa * 55.0 - ca * 18.0, mz + 0.6)
                p3 = (mx - ca * 55.0 + sa * 18.0, my - sa * 55.0 - ca * 18.0, mz + 0.6)
                B["beam-amber"].quad(p0, p1, p2, p3)
    for hg_at in (8620.0, 10980.0):
        hi = road.index(hg_at)
        hyaw = road.s[hi]["h"]
        hx_m, hy_m, _ = road.at(hi, 48.0)
        if road.clear_of_road(hx_m, hy_m, 28.0, hi):
            hz_m = height_at(hx_m, hy_m) + 3.8
            ca_h, sa_h = math.cos(hyaw), math.sin(hyaw)
            B["beam-amber"].quad(
                (hx_m - ca_h * 38.0 - sa_h * 12.0, hy_m - sa_h * 38.0 + ca_h * 12.0, hz_m),
                (hx_m + ca_h * 38.0 - sa_h * 12.0, hy_m + sa_h * 38.0 + ca_h * 12.0, hz_m),
                (hx_m + ca_h * 38.0 + sa_h * 12.0, hy_m + sa_h * 38.0 - ca_h * 12.0, hz_m + 0.5),
                (hx_m - ca_h * 38.0 + sa_h * 12.0, hy_m - sa_h * 38.0 - ca_h * 12.0, hz_m + 0.5),
            )
