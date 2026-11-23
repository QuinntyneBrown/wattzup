"""Sella Ronda course builder: the grand Dolomite four-pass loop around the Sella massif.

Built from GCN's Over/Under Intervals on the Passo Sella (28:00, 11.65 km), following Ibiza Sunset Strip's
course pipeline and CourseRenderer group architecture while staying within low-power tablet budgets
(<= 120,000 triangles, <= 140 draw calls, <= 3 MB gzipped, >= 60 FPS).
"""

from __future__ import annotations

import math
import random

import sky
import themes

STEP = 4.0
METRES_PER_TURN = 5.0
LEAD_IN = 80.0
RUN_OUT = 200.0
ROAD_HALF = 5.0

# The four passes of the clockwise Sella Ronda loop (metres along the 11,650 m course, summit elevation m, name, real altitude).
PASSES = (
    {"id": "campolongo", "name": "PASSO CAMPOLONGO", "alt": 1875, "at": 2100.0, "climb_from": 850.0, "descent_to": 3050.0, "peak_z": 78.0, "hairpins": 6},
    {"id": "pordoi", "name": "PASSO PORDOI", "alt": 2239, "at": 4950.0, "climb_from": 3300.0, "descent_to": 6050.0, "peak_z": 134.0, "hairpins": 9},
    {"id": "sella", "name": "PASSO SELLA", "alt": 2240, "at": 7750.0, "climb_from": 6250.0, "descent_to": 8850.0, "peak_z": 138.0, "hairpins": 8},
    {"id": "gardena", "name": "PASSO GARDENA", "alt": 2121, "at": 10150.0, "climb_from": 9000.0, "descent_to": 11250.0, "peak_z": 112.0, "hairpins": 7},
)

# The four Ladin / Dolomite valley villages between the passes.
VILLAGES = (
    {"id": "corvara", "name": "Corvara", "at": 260.0, "z": 14.0},
    {"id": "arabba", "name": "Arabba", "at": 3120.0, "z": 22.0},
    {"id": "canazei", "name": "Canazei", "at": 6120.0, "z": 36.0},
    {"id": "selva", "name": "Selva", "at": 8920.0, "z": 42.0},
)

# Centre of the Sella massif in Blender's XY metres (always on the rider's right along the clockwise loop).
SELLA_CENTER = (0.0, -1420.0)


def smoothstep(a: float, b: float, v: float) -> float:
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def srgb(hex_: int) -> tuple[float, float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin((hex_ >> 16 & 255) / 255), lin((hex_ >> 8 & 255) / 255), lin((hex_ & 255) / 255), 1.0)


def mix(a, b, t: float):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def noise(x: float, y: float) -> float:
    return (
        math.sin(x * 0.019 + 1.1) * math.cos(y * 0.015 - 0.7)
        + 0.5 * math.sin(x * 0.049 - y * 0.043 + 2.3)
        + 0.25 * math.sin(x * 0.121 + y * 0.109)
    ) / 1.75


def box_smooth(values: list[float], radius: int, passes: int = 2) -> list[float]:
    for _ in range(passes):
        acc, out = [0.0], []
        for v in values:
            acc.append(acc[-1] + v)
        n = len(values)
        for i in range(n):
            a, b = max(0, i - radius), min(n, i + radius + 1)
            out.append((acc[b] - acc[a]) / (b - a))
        values = out
    return values


def lay_centre_line(course: dict, theme: dict | None = None):
    """Lays Sella Ronda's clockwise four-pass mountain loop around the central Sella massif, with switchbacks
    climbing Campolongo, Pordoi, Sella and Gardena and sweeping descents into Arabba, Canazei, Selva and Corvara."""
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
    # High-resolution parametric curve reparameterized by exact arc length so step == 4.0 m everywhere.
    dense_n = 24000
    raw_pts: list[tuple[float, float]] = []
    for k in range(dense_n + 1):
        s_nom = -LEAD_IN + (total * k) / dense_n
        u = s_nom / length  # 0 at start, 1 at finish
        # Keep start (-80..140 m) and finish (length-320..length+200 m) straight in Corvara valley.
        u_loop = smoothstep(0.012, 0.972, u)
        phi = math.pi / 2.0 - 5.68 * u_loop  # clockwise sweep (~325 deg) around Sella massif

        # Radial distance from Sella centre: closer on the high cols, wider in the four valleys, ending 170 m outside start.
        base_r = 1420.0 + 175.0 * u_loop - 140.0 * math.cos(4.0 * (phi - math.pi / 2.0))
        # Lateral switchback waves on each pass climb + gentle valley sweeps, faded out at start & finish straights.
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
        px = cx + math.cos(phi) * r
        py = cy + math.sin(phi) * r
        raw_pts.append((px, py))

    # Compute raw arc length between start (s_nom=0) and finish (s_nom=length), then scale XY so road is exact `length`.
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

    # Elevation profile: four distinct Dolomite pass summits + GCN Over/Under kicks on every work interval!
    def pass_elevation(d: float) -> float:
        if d <= 0.0:
            return 14.0
        if d >= length:
            return 14.0
        anchors = [
            (0.0, 14.0),
            (650.0, 18.0),
            (2100.0, 78.0),   # Passo Campolongo (1875 m)
            (3120.0, 22.0),   # Arabba valley (1602 m)
            (4950.0, 134.0),  # Passo Pordoi (2239 m)
            (6120.0, 38.0),   # Canazei valley approach
            (7750.0, 138.0),  # Passo Sella (2240 m)
            (8920.0, 44.0),   # Selva / Plan de Gralba valley
            (10150.0, 112.0), # Passo Gardena (2121 m)
            (11350.0, 16.0),  # Colfosco -> Corvara run-in
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
        # Add punchy uphill kicks during every level-22 over-interval so bike resistance and road gradient surge together.
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
        {"x": xs[i], "y": ys[i], "z": zs[i], "h": hs[i], "k": curv[i], "g": grades[i], "d": i * STEP - LEAD_IN}
        for i in range(n_samples)
    ]
    return samples, st, length, mean, 0.85


def sella_center_for(samples: list[dict]) -> tuple[float, float]:
    """The geometric centre of the laid loop, where the colossal Sella massif rises."""
    xs = [p["x"] for p in samples]
    ys = [p["y"] for p in samples]
    return (min(xs) + max(xs)) * 0.5, (min(ys) + max(ys)) * 0.5


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

            # Inside the loop rises steeply toward the Sella massif's talus aprons; outside drops into valleys then rises.
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


def _build_sella_massif(peaks, cx: float, cy: float, az_sun: float) -> None:
    """The colossal Sella massif at the centre of the loop: vertical grey-gold Hauptdolomit walls, horizontal
    ledge terrace, scree apron, and Piz Boè summit pyramid, vertex-lit with rose-gold Enrosadira."""
    rng = random.Random(13601)
    sun_dx, sun_dy = math.cos(az_sun), math.sin(az_sun)
    base_col = srgb(0xC9C0B2)
    gold_col = srgb(0xF6B38A)
    rose_col = srgb(0xF2846E)
    shade_col = srgb(0x52607A)
    snow_col = srgb(0xEEF2F8)
    scree_col = srgb(0xB5ADA0)

    def rock_colour(nx: float, ny: float, nz: float, z: float, snow: bool = False):
        if snow:
            lit = max(0.0, nx * sun_dx + ny * sun_dy)
            return mix(srgb(0x9BAAC4), mix(snow_col, rose_col, 0.28), 0.35 + 0.65 * lit)
        dot = nx * sun_dx + ny * sun_dy
        alpenglow = smoothstep(180.0, 520.0, z) * smoothstep(-0.15, 0.75, dot)
        warm = mix(gold_col, rose_col, smoothstep(320.0, 680.0, z))
        lit_base = mix(shade_col, base_col, smoothstep(-0.45, 0.35, dot))
        return mix(lit_base, warm, alpenglow * 0.78)

    def quad_shaded(p0, p1, p2, p3, z_hint: float, snow: bool = False):
        ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        vx, vy, vz = p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        ln = max(1e-6, math.sqrt(nx * nx + ny * ny + nz * nz))
        c = rock_colour(nx / ln, ny / ln, nz / ln, z_hint, snow=snow)
        base_idx = len(peaks.verts)
        for p in (p0, p1, p2, p3):
            peaks.verts.append(p)
            peaks.colours.append(c)
        peaks.faces.append((base_idx, base_idx + 1, base_idx + 2, base_idx + 3))

    def tri_shaded(p0, p1, p2, z_hint: float, snow: bool = False):
        ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        vx, vy, vz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
        nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
        ln = max(1e-6, math.sqrt(nx * nx + ny * ny + nz * nz))
        c = rock_colour(nx / ln, ny / ln, nz / ln, z_hint, snow=snow)
        base_idx = len(peaks.verts)
        for p in (p0, p1, p2):
            peaks.verts.append(p)
            peaks.colours.append(c)
        peaks.faces.append((base_idx, base_idx + 1, base_idx + 2))

    # Tiered Sella fortress ring: scree apron -> lower sheer wall -> Cengia ledge -> upper wall -> Piz Boè crown
    sides = 36
    radii = []
    for k in range(sides):
        a = k * math.tau / sides
        flute = 1.0 + 0.14 * math.sin(7 * a + 0.6) + 0.08 * math.cos(13 * a - 1.1) + rng.uniform(-0.04, 0.04)
        radii.append(760.0 * flute)

    tiers = (
        (1.26, 40.0, False),   # Scree foot
        (1.00, 155.0, False),  # Top of scree apron
        (0.95, 390.0, False),  # Sheer lower Dolomia Principale cliff
        (0.82, 415.0, True),   # Snow-dusted horizontal Cengia ledge terrace
        (0.76, 610.0, False),  # Upper Dachstein cliff band
        (0.42, 665.0, True),   # Summit plateau rim
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
            quad_shaded(r_lo[k], r_lo[u], r_hi[u], r_hi[k], z_mid, snow=is_snow)

    # Piz Boè (3,152 m) central summit pyramid above the plateau
    apex = (cx + 45.0, cy - 30.0, 790.0)
    top_ring = rings[-1]
    for k in range(sides):
        u = (k + 1) % sides
        tri_shaded(top_ring[k], top_ring[u], apex, 730.0, snow=(k % 3 == 0))


def build_scenery(road, st: list[dict], length: float, height_at, course: dict, col, Builder, build_sky_fn) -> dict:
    """Dresses the Sella Ronda loop: central Sella massif, pass signs & refuges, spruce & larch groves,
    guardrails, start/finish gates, and an alpenglow Dolomite sky."""
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

    # Sun low in the west-southwest casting golden-rose evening alpenglow across the Sella walls.
    az = math.radians(205.0)

    # 1. Central Sella massif in the always-drawn `Peaks` group (1 draw call for the whole mountain!)
    peaks = Builder("SellaMassif", "peaks")
    peaks.colours = []
    _build_sella_massif(peaks, cx, cy, az)
    peaks.build(col)

    # 2. Guardrails on outside drops along steep switchbacks
    for i in range(4, kit.n - 4):
        if abs(s[i]["k"]) > 1 / 95 or s[i]["z"] > 70.0:
            kit.fence(i, kit.kerb + 0.9, 0.95)

    # 3. Four pass summit refuges and pass signs (Campolongo, Pordoi, Sella, Gardena)
    passes_built = 0
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
        # Brown summit altitude board beside the kerb
        B["dark"].box(kit.P(idx, 7.5, -(kit.kerb + 2.2), 0.0), (0.16, 0.16, 2.8), yaw)
        B["chalet-wood"].box(kit.P(idx, 7.5, -(kit.kerb + 2.2), 1.9), (0.14, 2.8, 1.05), yaw)
        B["paint"].box(kit.P(idx, 7.42, -(kit.kerb + 2.2), 2.02), (0.04, 2.5, 0.8), yaw)
        passes_built += 1

    # 4. Spruce and larch trees in the lower valleys and alpine meadows (below tree line z < 105 m)
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
                tz = height_at(tx, ty)
                kit.pine(tx, ty, tz, rng.uniform(0.85, 1.35), "pine" if rng.random() < 0.7 else "foliage")
                trees += 1

    # 5. Start/finish gates, effort arches, and chevron boards on tight switchbacks
    efforts = kit.gates("accent-2", "flag-0", themes.CROWD)

    # 6. Sun disc & painted alpenglow sky dome
    dist_, radius, alt = 5600.0, 380.0, 920.0
    sx, sy = cx + math.cos(az) * dist_, cy + math.sin(az) * dist_
    disc = B["sun"]
    for q in range(28):
        a0, a1 = q * math.tau / 28, (q + 1) * math.tau / 28
        p0 = (sx - math.sin(az) * math.cos(a0) * radius, sy + math.cos(az) * math.cos(a0) * radius, alt + math.sin(a0) * radius)
        p1 = (sx - math.sin(az) * math.cos(a1) * radius, sy + math.cos(az) * math.cos(a1) * radius, alt + math.sin(a1) * radius)
        disc.tri((sx, sy, alt), p1, p0)
    disc.name = "Sun"

    build_sky_fn(col, az, 0xE8B8B0, colour_at=alpenglow_sky_colour, turns=112, rows=18)

    for b in B.values():
        b.build(col)

    return {
        "sunAzimuth": az,
        "efforts": efforts,
        "passes": passes_built,
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
    """Crisp Dolomite evening sky: deep alpine cobalt zenith grading down to rose-coral Enrosadira on the horizon."""
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
