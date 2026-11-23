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
    (1.0, 0x233E7C),
)
ALPENGLOW_AWAY = (
    (0.0, 0xE2B0BC),
    (0.22, 0xB296C2),
    (0.52, 0x627CB8),
    (1.0, 0x233E7C),
)


def enrosadira_colour_fn(az_sun: float):
    """Computes authentic Dolomite Enrosadira vertex colours from surface normal, elevation & horizontal strata."""
    sun_dx, sun_dy, sun_dz = math.cos(az_sun) * 0.94, math.sin(az_sun) * 0.94, 0.34
    pale_dolomite = srgb(0xCEC4B4)
    shadow_indigo = srgb(0x465574)
    apricot_gold = srgb(0xF8B482)
    enrosadira_rose = srgb(0xF27668)
    summit_magenta = srgb(0xD86482)
    glacier_blue = srgb(0x98B4D8)
    glacier_rose = srgb(0xFCE0E2)

    def colour_at(nx: float, ny: float, nz: float, z: float, snow: bool = False):
        dot = nx * sun_dx + ny * sun_dy + nz * sun_dz
        if snow:
            lit = smoothstep(-0.25, 0.80, dot)
            return mix(glacier_blue, glacier_rose, 0.28 + 0.72 * lit)

        # Subtle horizontal Hauptdolomit bedding strata modulation by elevation
        strata = 0.93 + 0.07 * math.sin(z * 0.14) * math.cos(z * 0.037)
        in_sun = smoothstep(-0.18, 0.72, dot)
        high_glow = smoothstep(140.0, 440.0, z) * in_sun
        warm_band = mix(apricot_gold, enrosadira_rose, smoothstep(260.0, 580.0, z))
        warm_band = mix(warm_band, summit_magenta, smoothstep(580.0, 880.0, z) * 0.48)
        rock_lit = mix(shadow_indigo, pale_dolomite, smoothstep(-0.50, 0.30, dot))
        c = mix(rock_lit, warm_band, high_glow * 0.86)
        return (c[0] * strata, c[1] * strata, c[2] * strata, 1.0)

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
    wave = sky.fbm(ux * 2.2 + 1.7, uy * 0.85 - 0.6, 3, 19)
    cover = smoothstep(0.47, 0.73, wave) * smoothstep(0.03, 0.15, h) * (1.0 - smoothstep(0.52, 0.88, h))
    cloud_belly = mix(srgb(0x6E6C96), srgb(0xFF9C7E), 0.30 + 0.70 * sunward)
    c = mix(air, cloud_belly, cover * 0.76)
    # Warm solar aureole just above the western pass horizon
    sun_ang = max(0.0, dx * math.cos(az) * 0.96 + dy * math.sin(az) * 0.96 + dz * 0.18)
    c = mix(c, srgb(0xFFE2B8), (sun_ang ** 18.0) * 0.42)
    c = mix(c, haze, math.exp(-12.5 * h) * 0.46)
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
