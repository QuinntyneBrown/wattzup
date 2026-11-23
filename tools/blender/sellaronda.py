"""Sella Ronda course builder: the grand Dolomite four-pass loop around the Sella massif."""

from __future__ import annotations

import importlib
import math
import random
import sys
from pathlib import Path

_HERE = str(Path(__file__).resolve().parent)
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import sky
import themes
import sellaronda as sr
from sellaronda import (
    LEAD_IN,
    METRES_PER_TURN,
    PASSES,
    ROAD_HALF,
    RUN_OUT,
    STEP,
    VILLAGES,
    box_smooth,
    mix,
    noise,
    sella_center_for,
    smoothstep,
    srgb,
)
from sellaronda import massif as sr_massif

SELLA_CENTER = (0.0, -1420.0)


def lay_centre_line(course: dict, theme: dict | None = None):
    """Lays Sella Ronda's clockwise four-pass mountain loop around the central Sella massif."""
    importlib.reload(sr)
    st, t_sec, d_acc = [], 0.0, 0.0
    for seg in course["plan"]["segments"]:
        seg_len = seg["duration"] * seg["cadenceAim"] / 60.0 * METRES_PER_TURN
        st.append({**seg, "start": t_sec, "from": d_acc, "to": d_acc + seg_len})
        t_sec += seg["duration"]
        d_acc += seg_len
    length = st[-1]["to"]
    total = LEAD_IN + length + RUN_OUT
    mean = sum(s["level"] * (s["to"] - s["from"]) for s in st) / length

    cx, cy = SELLA_CENTER
    dense_n = 24000
    raw_pts: list[tuple[float, float]] = []
    for k in range(dense_n + 1):
        s_nom = -LEAD_IN + (total * k) / dense_n
        u = s_nom / length
        u_loop = smoothstep(0.012, 0.972, u)
        phi = math.pi / 2.0 - 5.68 * u_loop

        base_r = 1420.0 + 175.0 * u_loop - 140.0 * math.cos(4.0 * (phi - math.pi / 2.0))
        end_fade = smoothstep(-20.0, 220.0, s_nom) * (1.0 - smoothstep(length - 360.0, length - 120.0, s_nom))
        zig = 0.0
        for p in PASSES:
            climb_env = smoothstep(p["climb_from"], p["climb_from"] + 260.0, s_nom) * (
                1.0 - smoothstep(p["at"] - 180.0, p["at"] + 60.0, s_nom)
            )
            desc_env = smoothstep(p["at"] + 80.0, p["at"] + 320.0, s_nom) * (
                1.0 - smoothstep(p["descent_to"] - 220.0, p["descent_to"], s_nom)
            )
            phase = (s_nom - p["climb_from"]) / max(1.0, p["at"] - p["climb_from"]) * p["hairpins"] * math.pi
            zig += climb_env * 88.0 * math.sin(phase)
            d_phase = (s_nom - p["at"]) / max(1.0, p["descent_to"] - p["at"]) * 4.0 * math.pi
            zig += desc_env * 46.0 * math.sin(d_phase)

        r = base_r + zig * end_fade
        raw_pts.append((cx + math.cos(phi) * r, cy + math.sin(phi) * r))

    cum = [0.0]
    for k in range(1, len(raw_pts)):
        cum.append(cum[-1] + math.hypot(raw_pts[k][0] - raw_pts[k - 1][0], raw_pts[k][1] - raw_pts[k - 1][1]))
    i_start = round(LEAD_IN / total * dense_n)
    i_end = round((LEAD_IN + length) / total * dense_n)
    scale_xy = length / max(1.0, cum[i_end] - cum[i_start])
    pts_scaled = [((p[0] - raw_pts[i_start][0]) * scale_xy, (p[1] - raw_pts[i_start][1]) * scale_xy) for p in raw_pts]
    cum_s = [v * scale_xy for v in cum]
    s_zero = cum_s[i_start]

    n_samples = int(math.ceil(total / STEP)) + 1
    xs, ys = [], []
    cursor = 0
    for i in range(n_samples):
        target_arc = s_zero - LEAD_IN + i * STEP
        while cursor < len(cum_s) - 2 and cum_s[cursor + 1] < target_arc:
            cursor += 1
        span = max(1e-6, cum_s[cursor + 1] - cum_s[cursor])
        t_lerp = max(0.0, min(1.0, (target_arc - cum_s[cursor]) / span))
        xs.append(pts_scaled[cursor][0] + (pts_scaled[cursor + 1][0] - pts_scaled[cursor][0]) * t_lerp)
        ys.append(pts_scaled[cursor][1] + (pts_scaled[cursor + 1][1] - pts_scaled[cursor][1]) * t_lerp)

    hs, curv = [], []
    for i in range(n_samples):
        i0, i1 = max(0, i - 1), min(n_samples - 1, i + 1)
        hs.append(math.atan2(ys[i1] - ys[i0], xs[i1] - xs[i0]))
    for i in range(n_samples):
        i0, i1 = max(0, i - 1), min(n_samples - 1, i + 1)
        dh = math.remainder(hs[i1] - hs[i0], math.tau)
        curv.append(dh / max(STEP, (i1 - i0) * STEP))

    def pass_elevation(d: float) -> float:
        if d <= 0.0 or d >= length:
            return 14.0
        anchors = [
            (0.0, 14.0),
            (650.0, 18.0),
            (2100.0, 78.0),
            (3120.0, 22.0),
            (4950.0, 134.0),
            (6120.0, 38.0),
            (7750.0, 138.0),
            (8920.0, 44.0),
            (10150.0, 112.0),
            (11350.0, 16.0),
            (length, 14.0),
        ]
        for (d0, z0), (d1, z1) in zip(anchors, anchors[1:]):
            if d <= d1:
                return z0 + (z1 - z0) * smoothstep(d0, d1, d)
        return 14.0

    raw_z = []
    for i in range(n_samples):
        d = i * STEP - LEAD_IN
        z = pass_elevation(d)
        for s in st:
            if s["kind"] == "work" and s["level"] >= 22 and s["from"] <= d <= s["to"]:
                u_seg = (d - s["from"]) / max(1.0, s["to"] - s["from"])
                z += 9.5 * math.sin(math.pi * u_seg) ** 0.85
        raw_z.append(z)

    zs = box_smooth(raw_z, 6, passes=2)
    grades = []
    for i in range(n_samples):
        i0, i1 = max(0, i - 1), min(n_samples - 1, i + 1)
        grades.append((zs[i1] - zs[i0]) / max(STEP, (i1 - i0) * STEP) * 100.0)

    samples = [
        {"x": xs[i], "y": ys[i], "z": zs[i], "h": hs[i], "k": curv[i], "d": i * STEP - LEAD_IN, "g": grades[i]}
        for i in range(n_samples)
    ]
    return samples, st, length, mean, 0.85


def build_terrain(road, col, Builder, cell: float = 28.0):
    """Builds the alpine meadow and Dolomite scree heightfield around the four-pass loop."""
    xs = [p["x"] for p in road.s]
    ys = [p["y"] for p in road.s]
    cx, cy = sella_center_for(road.s)
    margin = 340.0
    x0, x1 = min(xs) - margin, max(xs) + margin
    y0, y1 = min(ys) - margin, max(ys) + margin
    nx, ny = int((x1 - x0) / cell) + 1, int((y1 - y0) / cell) + 1

    meadow_low = srgb(0x4E7C34)
    meadow_lush = srgb(0x66963E)
    meadow_high = srgb(0x7E964C)
    scree_c = srgb(0xC8BFAE)
    rock_c = srgb(0xCFC4B4)

    heights, dist = {}, {}
    b = Builder("Terrain", "terrain")
    b.colours = []
    index = {}

    for iy in range(ny):
        for ix in range(nx):
            x, y = x0 + ix * cell, y0 + iy * cell
            near = road.tree.find_n((x, y, 0.0), 6)
            d = near[0][2]
            w_sum = h_sum = 0.0
            for _, j, dj in near:
                w = 1.0 / (dj * dj + 6.0)
                w_sum += w
                h_sum += w * road.s[j]["z"]
            h_road = h_sum / w_sum

            r_center = math.hypot(x - cx, y - cy)
            inward = smoothstep(1450.0, 650.0, r_center)
            n1 = noise(x, y)
            slope_up = inward * 145.0 * smoothstep(22.0, 260.0, d)
            outer_roll = (1.0 - inward) * (28.0 * n1 + 22.0) * smoothstep(26.0, 220.0, d)
            h = h_road - 1.2 + slope_up + outer_roll
            if d < 22.0:
                h = min(h, h_road - 1.1)
            heights[(ix, iy)], dist[(ix, iy)] = h, d

    for iy in range(ny):
        for ix in range(nx):
            h, d = heights[(ix, iy)], dist[(ix, iy)]
            x, y = x0 + ix * cell, y0 + iy * cell
            hx = heights.get((ix + 1, iy), h) - heights.get((ix - 1, iy), h)
            hy = heights.get((ix, iy + 1), h) - heights.get((ix, iy - 1), h)
            slope = math.hypot(hx, hy) / (2.0 * cell)
            c = mix(meadow_low, meadow_lush, 0.5 + 0.5 * noise(x * 1.4, y * 1.4))
            c = mix(c, meadow_high, smoothstep(70.0, 145.0, h))
            c = mix(c, scree_c, smoothstep(135.0, 210.0, h))
            c = mix(c, rock_c, smoothstep(0.38, 0.78, slope))
            shade = 0.91 + 0.09 * noise(x * 2.7, y * 2.5)
            b.colours.append((c[0] * shade, c[1] * shade, c[2] * shade, 1.0))
            index[(ix, iy)] = b.v((x, y, h))

    for iy in range(ny - 1):
        for ix in range(nx - 1):
            corners = [(ix, iy), (ix + 1, iy), (ix + 1, iy + 1), (ix, iy + 1)]
            if all(dist[c] > 280.0 for c in corners):
                continue
            b.faces.append(tuple(index[c] for c in corners))

    obj = b.build(col)
    floor_plane = Builder("ValleyFloor", "terrain")
    floor_plane.colours = [meadow_low] * 4
    r_far = 8500.0
    for vx, vy in ((cx - r_far, cy - r_far), (cx + r_far, cy - r_far), (cx + r_far, cy + r_far), (cx - r_far, cy + r_far)):
        floor_plane.v((vx, vy, -6.0))
    floor_plane.faces.append((0, 1, 2, 3))
    floor_plane.build(col)

    def height_at(x: float, y: float) -> float:
        fx, fy = (x - x0) / cell, (y - y0) / cell
        ix, iy = int(fx), int(fy)
        tx, ty = fx - ix, fy - iy
        g = lambda a, c: heights.get((a, c), 0.0)  # noqa: E731
        return (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty

    return obj, height_at


def _try_module(mod_name: str):
    try:
        mod = importlib.import_module(f"sellaronda.{mod_name}")
        return importlib.reload(mod)
    except ModuleNotFoundError:
        return None


def build_scenery(road, st: list[dict], length: float, height_at, course: dict, col, Builder, build_sky_fn) -> dict:
    """Orchestrates all 10 Sella Ronda Dolomite detail modules cleanly within tablet frame budgets."""
    importlib.reload(sr_massif)
    rng = random.Random(course.get("seed", 136) * 7 + 3)
    s = road.s
    cx, cy = sella_center_for(s)

    class Bag(dict):
        def __missing__(self, name):
            b = Builder("".join(p.title() for p in name.split("-")), name)
            self[name] = b
            return b

    B = Bag()
    kit = themes.Kit(road, st, length, height_at, rng, B, STEP, ROAD_HALF)
    az = math.radians(205.0)

    m_alpenglow = _try_module("alpenglow")
    rock_cfn = m_alpenglow.enrosadira_colour_fn(az) if m_alpenglow else None
    sky_cfn = m_alpenglow.alpenglow_sky_colour if m_alpenglow else alpenglow_sky_colour

    # 1. Peaks (whole, fog-free, 1 draw call): Sella massif + surrounding Dolomite giants
    peaks = Builder("SellaMassif", "peaks")
    peaks.colours = []
    sr_massif.build_sella_massif(peaks, road, cx, cy, az, colour_fn=rock_cfn)
    m_peaks = _try_module("peaks")
    if m_peaks:
        m_peaks.build_surrounding_peaks(peaks, road, cx, cy, az, colour_fn=rock_cfn)
    peaks.build(col)

    # 2. Hairpins, retaining walls, guardrails & Tornante plaques
    m_hairpins = _try_module("hairpins")
    if m_hairpins:
        m_hairpins.build_hairpin_furniture(B, kit, road, height_at)
    else:
        for i in range(4, kit.n - 4):
            if abs(s[i]["k"]) > 1 / 95 or s[i]["z"] > 70.0:
                kit.fence(i, kit.kerb + 0.9, 0.95)

    # 3. Four pass summit signs, monuments & chapels
    m_passes = _try_module("passes")
    if m_passes:
        m_passes.build_four_passes(B, kit, road, height_at)

    # 4. Pass rifugi & hotels with sun terraces, parasols & flags
    m_rifugi = _try_module("rifugi")
    if m_rifugi:
        m_rifugi.build_rifugi_and_hotels(B, kit, road, height_at)
    else:
        for p in PASSES:
            idx = road.index(p["at"])
            yaw = s[idx]["h"]
            off = -(kit.kerb + 12.0)
            rx, ry, _ = road.at(idx, off)
            rz = height_at(rx, ry)
            B["stone"].box((rx, ry, rz - 2.5), (15.0, 9.5, 4.8), yaw)
            B["chalet-wood"].box((rx, ry, rz + 2.3), (15.4, 9.9, 3.6), yaw)
            kit.gable(B["roof-slate"], (rx, ry, rz + 5.9), 15.4, 9.9, 3.2, yaw)
            for c_idx in range(4):
                along = -5.4 + c_idx * 3.6
                kit.window(idx, along, off + 5.0, rz - s[idx]["z"] + 3.2, 1.2, 1.5, c_idx % 2 == 0, yaw)
            if not m_passes:
                B["dark"].box(kit.P(idx, 7.5, -(kit.kerb + 2.2), 0.0), (0.16, 0.16, 2.8), yaw)
                B["chalet-wood"].box(kit.P(idx, 7.5, -(kit.kerb + 2.2), 1.9), (0.14, 2.8, 1.05), yaw)
                B["paint"].box(kit.P(idx, 7.42, -(kit.kerb + 2.2), 2.02), (0.04, 2.5, 0.8), yaw)

    # 5. Alpine meadows, Tabià hay barns, wildflowers, spruce & larch
    m_meadows = _try_module("meadows")
    if m_meadows:
        trees = m_meadows.build_alpine_meadows(B, kit, road, height_at, rng)
    else:
        trees = 0
        for i in range(8, kit.n - 8, 5):
            if s[i]["z"] > 108.0:
                continue
            for side in (1, -1):
                if rng.random() > 0.52:
                    continue
                off = (kit.kerb + rng.uniform(10.0, 48.0)) * side
                tx, ty, _ = road.at(i, off)
                if road.clear_of_road(tx, ty, 13.0, i):
                    kit.pine(tx, ty, height_at(tx, ty), rng.uniform(0.85, 1.35), "pine" if rng.random() < 0.7 else "foliage")
                    trees += 1

    # 6. Ski lifts, cable cars, pylons & summer-quiet pistes
    m_lifts = _try_module("lifts")
    if m_lifts:
        m_lifts.build_ski_lifts(B, kit, road, height_at, cx, cy)

    # 7. Valley villages (Corvara, Arabba, Canazei, Selva) with onion-dome churches
    m_villages = _try_module("villages")
    if m_villages:
        m_villages.build_valley_villages(B, kit, road, height_at, rng)

    # 8. Sellaronda Bike Day cyclists, motorbikes, spectators & paragliders
    m_bikeday = _try_module("bikeday")
    if m_bikeday:
        m_bikeday.build_bikeday_life(B, kit, road, height_at, rng)

    # 9. Dusk terrace/village warm light pools (Enrosadira twilight)
    if m_alpenglow and hasattr(m_alpenglow, "emit_dusk_lights"):
        m_alpenglow.emit_dusk_lights(kit, road, height_at)

    # 10. Start/finish gates, effort arches, sun disc & alpenglow sky
    efforts = kit.gates("accent-2", "flag-0", themes.CROWD)

    dist_, radius, alt = 5600.0, 380.0, 920.0
    sx, sy = cx + math.cos(az) * dist_, cy + math.sin(az) * dist_
    disc = B["sun"]
    for q in range(28):
        a0, a1 = q * math.tau / 28, (q + 1) * math.tau / 28
        p0 = (sx - math.sin(az) * math.cos(a0) * radius, sy + math.cos(az) * math.cos(a0) * radius, alt + math.sin(a0) * radius)
        p1 = (sx - math.sin(az) * math.cos(a1) * radius, sy + math.cos(az) * math.cos(a1) * radius, alt + math.sin(a1) * radius)
        disc.tri((sx, sy, alt), p1, p0)
    disc.name = "Sun"

    build_sky_fn(col, az, 0xE8B8B0, colour_at=sky_cfn, turns=112, rows=18)

    for b in B.values():
        b.build(col)

    return {
        "sunAzimuth": az,
        "efforts": efforts,
        "passes": len(PASSES),
        "trees": trees,
        "clubs": 0,
        "lights": kit.lights,
    }


ALPENGLOW_SUNWARD = (
    (0.0, 0xFFD4A8),
    (0.16, 0xF79E7E),
    (0.36, 0xD67A8E),
    (0.62, 0x6E78B4),
    (1.0, 0x284684),
)
ALPENGLOW_AWAY = (
    (0.0, 0xE4B8C0),
    (0.24, 0xB69EC4),
    (0.54, 0x6A84BE),
    (1.0, 0x284684),
)


def alpenglow_sky_colour(dx: float, dy: float, dz: float, az: float, haze):
    h = max(0.0, dz)
    toward = math.cos(math.atan2(dy, dx) - az)
    sunward = ((toward + 1.0) * 0.5) ** 1.4
    band = h ** 0.55
    air = mix(sky.ramp(ALPENGLOW_AWAY, band), sky.ramp(ALPENGLOW_SUNWARD, band), sunward)
    k = 1.0 / (dz + 0.2)
    ux, uy = dx * k, dy * k
    puffs = sky.fbm(ux * 1.8 + 2.1, uy * 1.3 - 0.9, 3, 17)
    cover = smoothstep(0.48, 0.74, puffs) * smoothstep(0.04, 0.16, h) * (1.0 - smoothstep(0.55, 0.92, h))
    cloud = mix(srgb(0x7A789E), srgb(0xFFB294), 0.35 + 0.65 * sunward)
    c = mix(air, cloud, cover * 0.72)
    c = mix(c, haze, math.exp(-12.0 * h) * 0.48)
    return sky.grade(c)
