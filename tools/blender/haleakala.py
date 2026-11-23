"""Haleakalā: the summit road from the Pacific coast to the crater rim, for build_course.py (ADR 0034).

The map of GCN Training's Maximum Intensity Hill Climb Efforts. themes.py takes this module's theme, materials and
scenery. The scenery works through the ten critical details of `docs/worlds/haleakala/README.md`, from its reference
photographs: each function below names the detail it builds.

The road never descends. It leaves the coast and climbs the volcano's flank in long switchbacks, each leg a traverse
across the slope, through the ranch land, the cloud and the cinder to the summit.
"""

from __future__ import annotations

import math
import random

from worldkit import Painted, lens, lin as _lin, smooth as _smooth

CROWD = [f"crowd-{i}" for i in range(6)]

# name -> colour, roughness, glow: added to themes.MATERIALS.
MATERIALS: dict[str, dict] = {
    # A delineator post: white plastic, with an amber reflector near its top.
    "hk-post": {"color": 0xECEAE2, "rough": 0.7},
    "hk-reflector": {"color": 0xFFB020, "glow": 0.9},
    # The silversword: a globe of silver blades, and the maroon flower stalk of its last summer.
    "hk-silver": {"color": 0xC9D4D2, "rough": 0.45},
    "hk-bloom": {"color": 0x7A2F44, "rough": 0.9},
    "hk-lava": {"color": 0x2A2626, "rough": 1.0},
    # Upcountry: eucalyptus in grey-green, and the jacarandas of Kula in flower.
    "hk-eucalyptus": {"color": 0x6E8E6A, "rough": 0.9},
    "hk-eucalyptus-dark": {"color": 0x4E7252, "rough": 0.9},
    "hk-jacaranda": {"color": 0x8E6CD8, "rough": 0.9},
    "hk-wire": {"color": 0x8E8E8A, "rough": 0.6, "double": True},
}

THEME: dict = {
    # Detail 10, thin bright light: the sky a deep blue that pales only at the horizon, the sun high and white.
    "sky": [0xDCEBF5, 0xA9D0EE, 0x6DAEE6, 0x3A86D8, 0x1E5FBF],
    "haze": 0xCFE2EE,
    "light": [0xFFF6E2, 3.4],
    "fill": [0xCFE0F5, 0x7A6A5A],
    "sun_altitude": 0.62,
    # The shoulders are cinder, the sun a white disc and the chevrons road paint.
    "palette": {"asphalt": 0x38383C, "sand": 0x6E5448, "sea": 0x0E5E9A, "sun": 0xFFFBEA, "chevron": 0xF2EEE2},
    "land": {"low": 0x9DB45A, "mid": 0x5E9A3C, "high": 0x8A4A36, "rock": 0x3A3230},
    "terrain": {"sea": True},
    # Detail 9, the road edge: narrow tarmac, a yellow centre line and no barrier, only the shoulder.
    "edge": "corniche",
    "centre": "yellow",
    # Every stage climbs: a level's share of the gradient, on top of the summit road's own steady climb.
    "grade": {"perLevel": 0.8, "climb": 5.9},
    "sea_clearance": 6.0,
}

HAIRPIN_RADIUS = 26.0  # metres, on the centre line
TRAVERSE = 0.21  # how far off the level a leg heads up the slope, in radians
LEG = (430.0, 880.0)  # a leg's length between hairpins, in metres
COAST_LEG = 760.0  # the road runs along the coast this far before the first hairpin


def lay_centre_line(course: dict, theme: dict, bc):
    """The summit road's centre line, as build_course.lay_centre_line returns it.

    The sea is to the north and the summit to the south. The road sets out east along the coast, then climbs in
    switchbacks: a leg east and a little south, a right-hand hairpin, a leg west and a little south, a left-hand
    hairpin, and so on up. Each leg wavers a little, as a road laid across gullies does."""
    step, lead_in = bc.STEP, bc.LEAD_IN
    st = bc.stages(course["plan"])
    length = st[-1]["to"]
    total = lead_in + length + bc.RUN_OUT
    mean = sum(g["level"] * (g["to"] - g["from"]) for g in st) / length
    grade = theme["grade"]
    n = int(math.ceil(total / step)) + 1
    swing = math.pi - 2 * TRAVERSE
    turn = swing * HAIRPIN_RADIUS

    def laid(rng: random.Random):
        hairpins, d = [], COAST_LEG
        while d < length - 620.0:
            hairpins.append(d)
            d += turn + rng.uniform(*LEG)
        phases = (rng.uniform(0, math.tau), rng.uniform(0, math.tau))

        def heading(d: float) -> float:
            th = -TRAVERSE * bc.smoothstep(260.0, 640.0, d)
            ease = bc.smoothstep(60.0, 240.0, d) * (1 - bc.smoothstep(length - 420.0, length - 300.0, d))
            for q, a in enumerate(hairpins):
                if d > a:
                    th += (-1 if q % 2 == 0 else 1) * swing * min(1.0, (d - a) / turn)
                ease *= 1 - (1 - bc.smoothstep(a + turn, a + turn + 110.0, d)) * bc.smoothstep(a - 110.0, a, d)
            waver = 0.13 * math.sin(math.tau * d / 310.0 + phases[0]) + 0.07 * math.sin(math.tau * d / 127.0 + phases[1])
            return th + ease * waver

        return bc.box_smooth([heading(i * step - lead_in) for i in range(n)], int(12 / step))

    seed = course.get("seed", 1)
    found = None
    for attempt in range(40):
        hs = laid(random.Random(seed * 1000 + attempt))
        xs, ys = [], []
        x = y = 0.0
        for th in hs:
            x += math.cos(th) * step
            y += math.sin(th) * step
            xs.append(x)
            ys.append(y)
        grid, clear, lag = bc.Grid(bc.CLEAR), True, int(130 / step)
        for i in range(n):
            if grid.near(xs[i], ys[i], bc.CLEAR * 0.8, i - lag):
                clear = False
                break
            grid.add(i, xs[i], ys[i])
        if clear:
            found = (xs, ys, hs)
            break
    if found is None:
        raise RuntimeError("No summit road found that keeps clear of itself; change the course's seed.")
    xs, ys, hs = found
    curv = [(hs[min(n - 1, i + 1)] - hs[max(0, i - 1)]) / (2 * step) for i in range(n)]
    grades = []
    for i in range(n):
        d = i * step - lead_in
        stage = bc.stage_at(st, d)
        # Level along the shore before the start line and for the first of the coast road, then the climb.
        steady = grade["climb"] * bc.smoothstep(120.0, 520.0, d)
        grades.append(((stage["level"] - mean) * grade["perLevel"] if stage else 0.0) * bc.smoothstep(120.0, 520.0, d) + steady)
    grades = bc.box_smooth(grades, int(28 / step))
    zs, z = [], 0.0
    for g in grades:
        z += g / 100.0 * step
        zs.append(z)
    low = min(zs) - theme["sea_clearance"]
    samples = [{"x": xs[i], "y": ys[i], "z": zs[i] - low, "h": hs[i], "k": curv[i], "g": grades[i], "d": i * step - lead_in} for i in range(n)]
    return samples, st, length, mean, grade["perLevel"]


def zone_colour(t: float, x: float, y: float, bc) -> tuple:
    """The land's colour by how far up the mountain it is (0 the shore, 1 the summit): the cane and palms of the
    coast, the green ranch land, the scrub where the cloud sits, and above it cinder in red, brown and black."""
    n1, n2 = bc.noise(x * 0.9, y * 0.9), bc.noise(x * 2.7 + 90.0, y * 2.7)
    cane, pasture, lush = _lin(0x9DB45A), _lin(0x6FA53F), _lin(0x4E8A34)
    scrub, red, brown, black = _lin(0x7C8658), _lin(0x8E4A34), _lin(0x5C3E32), _lin(0x2C2828)
    green = bc.mix(pasture, lush, 0.5 + 0.5 * n1)
    c = bc.mix(cane, green, _smooth(0.03, 0.1, t))
    c = bc.mix(c, scrub, _smooth(0.4, 0.56, t + 0.04 * n2))
    cinder = bc.mix(bc.mix(red, brown, 0.5 + 0.5 * n1), black, _smooth(0.2, 0.75, n2))
    return bc.mix(c, cinder, _smooth(0.52, 0.66, t + 0.05 * n1))


def build_land(road, col, theme: dict, bc):
    """The volcano's flank, as build_course.build_land returns it (the mesh and the land's height at a place): one
    long slope from the sea to the summit, fitted to the road, cut by gullies, and holding the road's height beside
    it."""
    # Coarser than a coast's: the legs of the switchbacks lie close, so much of the flank is in view at once.
    cell = 26.0
    s = road.s
    xs, ys, zs = [p["x"] for p in s], [p["y"] for p in s], [p["z"] for p in s]
    x0, x1 = min(xs) - 660.0, max(xs) + 660.0
    y0, y1 = min(ys) - 420.0, max(ys) + 300.0
    nx, ny = int((x1 - x0) / cell) + 1, int((y1 - y0) / cell) + 1
    # The slope the road climbs, south for north: the land is this plane, bent to the road where the road is near.
    my, mz = sum(ys) / len(ys), sum(zs) / len(zs)
    fall = sum((y - my) * (z - mz) for y, z in zip(ys, zs)) / sum((y - my) ** 2 for y in ys)
    z_lo, z_hi = min(zs), max(zs)
    shore = max(ys)

    def plane(y: float) -> float:
        return mz + fall * (y - my)

    heights = {}
    for iy in range(ny):
        for ix in range(nx):
            x, y = x0 + ix * cell, y0 + iy * cell
            near = road.tree.find_n((x, y, 0.0), 16)
            d = near[0][2]
            w_sum = h_sum = 0.0
            for _, j, dj in near:
                w = 1.0 / (dj * dj + 16.0)
                w_sum += w
                h_sum += w * (s[j]["z"] - plane(s[j]["y"]))
            n1, n2 = bc.noise(x * 0.5, y * 0.5), bc.noise(x * 2.1 + 30.0, y * 2.1)
            h = plane(y) + h_sum / w_sum * (1 - bc.smoothstep(70.0, 460.0, d)) - 1.4
            # Gullies down the flank and the lumps of old flows, away from the road.
            h += (n1 * 16.0 + n2 * 5.0) * bc.smoothstep(26.0, 150.0, d)
            # Above the road's top the mountain levels off into the summit; north of the coast it meets the sea.
            h = min(h, z_hi + 26.0 + 8.0 * n1)
            h = h * (1 - bc.smoothstep(24.0, 110.0, y - shore)) - 8.0 * bc.smoothstep(24.0, 110.0, y - shore)
            if d < 9.0:
                h = s[near[0][1]]["z"] - 1.4
            elif d < 26.0:
                h = min(h, s[near[0][1]]["z"] - 1.4)
            heights[(ix, iy)] = max(h, -8.0)
    b = bc.Builder("Terrain", "terrain")
    b.colours = []
    index = {}
    rock_c, sand_c = bc.srgb(theme["land"]["rock"]), bc.srgb(0xD9C9A0)
    for iy in range(ny):
        for ix in range(nx):
            h = heights[(ix, iy)]
            x, y = x0 + ix * cell, y0 + iy * cell
            hx = heights.get((ix + 1, iy), h) - heights.get((ix - 1, iy), h)
            hy = heights.get((ix, iy + 1), h) - heights.get((ix, iy - 1), h)
            slope = math.hypot(hx, hy) / (2 * cell)
            c = zone_colour((h - z_lo) / (z_hi - z_lo), x, y, bc)
            c = bc.mix(c, rock_c, bc.smoothstep(0.5, 0.9, slope) * 0.7)
            c = bc.mix(sand_c, c, bc.smoothstep(0.5, 4.0, h))
            shade = 0.9 + 0.1 * bc.noise(x * 1.3, y * 1.1)
            b.colours.append((c[0] * shade, c[1] * shade, c[2] * shade, 1.0))
            index[(ix, iy)] = b.v((x, y, h))
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            corners = [(ix, iy), (ix + 1, iy), (ix + 1, iy + 1), (ix, iy + 1)]
            if all(heights[c] <= -7.9 for c in corners):
                continue
            b.faces.append(tuple(index[c] for c in corners))
    obj = b.build(col)
    sea = bc.Builder("Sea", "sea")
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, 16000.0
    sea.quad((cx - r, cy - r, 0.0), (cx + r, cy - r, 0.0), (cx + r, cy + r, 0.0), (cx - r, cy + r, 0.0))
    sea.build(col)

    def height_at(x: float, y: float) -> float:
        fx, fy = (x - x0) / cell, (y - y0) / cell
        ix, iy = int(fx), int(fy)
        tx, ty = fx - ix, fy - iy
        g = lambda a, c: heights.get((a, c), -8.0)  # noqa: E731
        return (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty

    return obj, height_at


THEME["lay"] = lay_centre_line
THEME["land_builder"] = build_land


def reflector_posts(k) -> int:
    """Detail 9, the road edge: no wall and no rail, only a white post with an amber reflector on each shoulder
    every 20 m, closer round a hairpin."""
    post, eye = k.B["hk-post"], k.B["hk-reflector"]
    stood = 0
    for i in range(3, k.n - 3):
        tight = abs(k.s[i]["k"]) > 1 / 60
        if i % (2 if tight else 5):
            continue
        yaw = k.s[i]["h"]
        for side in (1, -1):
            off = (k.kerb + 1.5) * side
            post.box(k.P(i, 0, off, -0.2), (0.05, 0.11, 1.25), yaw)
            eye.box(k.P(i, -0.035, off, 0.78), (0.03, 0.09, 0.16), yaw)
            stood += 1
    return stood


CLOUD_LEVEL = 0.58  # how far up the climb the top of the cloud lies, 0 the shore and 1 the summit


def cloud_sea(k) -> float:
    """Detail 2, above the clouds: a sea of cloud lies round the mountain a little over half way up, out to the
    horizon. Its billows are seen only from above: a rider below it rides under an open sky, and one above it looks
    down on it from every switchback. It stands off the slope, so the road never passes through its sheet."""
    paint, s = Painted(k, "peaks"), k.s
    zs, xs = [p["z"] for p in s], [p["x"] for p in s]
    level = min(zs) + CLOUD_LEVEL * (max(zs) - min(zs))
    edge = min(s, key=lambda p: abs(p["z"] - level))["y"] + 210.0
    x_lo, x_hi, cx = min(xs) - 1100.0, max(xs) + 1100.0, (min(xs) + max(xs)) / 2
    white, shadow, haze = _lin(0xFAFBFC), _lin(0xA9BACF), _lin(THEME["haze"])
    cell = 420.0

    def top(x: float, y: float) -> float:
        return level + 34.0 * math.sin(x * 0.0041 + 0.7) * math.cos(y * 0.0052 - 0.4) + 18.0 * math.sin(x * 0.0113 + y * 0.0091)

    def colour(x: float, y: float):
        lift = _smooth(-0.7, 0.7, (top(x, y) - level) / 52.0)
        c = tuple(shadow[q] + (white[q] - shadow[q]) * lift for q in range(3))
        far = _smooth(5200.0, 9800.0, math.hypot(x - cx, y - edge))
        return (*(c[q] + (haze[q] - c[q]) * far for q in range(3)), 1.0)

    for iy in range(int(16500 / cell)):
        for ix in range(int(19200 / cell)):
            x, y = cx - 9600.0 + ix * cell, edge - 6000.0 + iy * cell
            # The mountain stands up through it.
            if x_lo < x + cell / 2 < x_hi and y + cell / 2 < edge:
                continue
            corners = ((x, y), (x + cell, y), (x + cell, y + cell), (x, y + cell))
            paint.face([(px, py, top(px, py)) for px, py in corners], [colour(px, py) for px, py in corners])
    return level


CINDER_FROM = 0.64  # how far up the climb the bare cinder begins


def height_share(k, i: int) -> float:
    """How far up the climb sample i is: 0 the shore, 1 the summit."""
    zs = [p["z"] for p in k.s]
    return (k.s[i]["z"] - min(zs)) / (max(zs) - min(zs))


def silversword(k, x: float, y: float, z: float, bloom: bool) -> None:
    """One silversword: a globe of narrow silver blades sitting on the cinder, and on a few the tall flower stalk."""
    rng, b = k.rng, k.B["hk-silver"]
    r = rng.uniform(0.55, 0.95)
    for tier, (blades, tilt) in enumerate(((10, 0.3), (8, 0.8), (5, 1.25))):
        for q in range(blades):
            a = q * math.tau / blades + tier * 0.35 + rng.uniform(-0.15, 0.15)
            ca, sa = math.cos(a), math.sin(a)
            tip = (x + ca * r * math.cos(tilt), y + sa * r * math.cos(tilt), z + 0.08 + r * math.sin(tilt))
            left, right = (x - sa * 0.16, y + ca * 0.16, z + 0.06), (x + sa * 0.16, y - ca * 0.16, z + 0.06)
            b.tri(left, right, tip)
            b.tri(right, left, tip)
    if bloom:
        k.prism(k.B["hk-bloom"], (x, y, z + r * 0.5), 0.26, rng.uniform(1.4, 2.2), 5, 0.08)


def silverswords(k) -> int:
    """Detail 4, silverswords: on the bare cinder near the summit and nowhere lower, in loose colonies with wide
    gaps of bare ground between them, a few in flower. Dark lumps of lava lie among them."""
    rng, s = k.rng, k.s
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    planted = 0
    for i in range(6, k.n - 6):
        if shares[i // 25] < CINDER_FROM or rng.random() > 0.2:
            continue
        side = rng.choice((1, -1))
        off = (k.kerb + rng.uniform(3.0, 20.0)) * side
        cx, cy, _ = k.road.at(i, off)
        for _ in range(rng.randint(3, 8)):
            x, y = cx + rng.uniform(-5.0, 5.0), cy + rng.uniform(-5.0, 5.0)
            if not k.road.clear_of_road(x, y, 7.0, i):
                continue
            z = k.ground(x, y, i, off)
            if rng.random() < 0.22:
                k.blob(k.B["hk-lava"], (x, y, z + 0.1), rng.uniform(0.35, 0.9))
            else:
                silversword(k, x, y, z, rng.random() < 0.14)
                planted += 1
    return planted


def dome(paint, c, r: float, drum: float, slit: float, sides: int = 12) -> None:
    """An observatory: a white drum under a white dome, with the dark slit the telescope looks out of."""
    white, shade, dark = _lin(0xF4F5F2), _lin(0xC8CED4), _lin(0x30343A)

    def ring(radius: float, up: float):
        return [(c[0] + math.cos(q * math.tau / sides) * radius, c[1] + math.sin(q * math.tau / sides) * radius, c[2] + up) for q in range(sides)]

    rings = [(ring(r, -1.5), shade), (ring(r, drum), white)]
    for step in (1, 2, 3):
        a = step * math.pi / 8
        rings.append((ring(r * math.cos(a), drum + r * math.sin(a)), white))
    open_at = int(slit / math.tau * sides) % sides
    for (lo, lo_c), (hi, hi_c) in zip(rings, rings[1:]):
        for q in range(sides):
            n = (q + 1) % sides
            slot = q == open_at and lo is not rings[0][0]
            paint.face((lo[q], lo[n], hi[n], hi[q]), (dark,) * 4 if slot else (lo_c, lo_c, hi_c, hi_c))
    top, cap = rings[-1][0], (c[0], c[1], c[2] + drum + r)
    for q in range(sides):
        paint.face((top[q], top[(q + 1) % sides], cap), (dark if q == open_at else white,) * 3)


def science_city(k) -> int:
    """Detail 8, the summit observatories: Science City's white domes stand in a cluster on the summit above the
    road's end, with their low white buildings and one silver tower, seen from the switchbacks below."""
    paint, rng, s = Painted(k), k.rng, k.s
    i = min(range(k.n), key=lambda q: abs(s[q]["d"] - (s[-1]["d"] - 330.0)))
    # On the uphill side of the road, where the summit is.
    side = 1 if k.height_at(*k.road.at(i, 90.0)[:2]) > k.height_at(*k.road.at(i, -90.0)[:2]) else -1
    silver = _lin(0xAEB6BC)
    stood = 0
    plan = ((0, 62, 9.0, 7.0), (34, 88, 6.0, 5.0), (-30, 96, 5.0, 4.0), (58, 60, 4.2, 3.6), (-62, 66, 7.0, 6.0), (10, 122, 4.5, 4.0), (86, 96, 3.6, 3.2))
    for along, out, r, drum in plan:
        x, y, _ = k.P(i, along + rng.uniform(-5.0, 5.0), (out + rng.uniform(-5.0, 5.0)) * side)
        z = k.height_at(x, y)
        dome(paint, (x, y, z), r, drum, rng.uniform(0, math.tau))
        # Its low building alongside.
        yaw = rng.uniform(0, math.pi)
        paint.box((x + math.cos(yaw) * (r + 5.0), y + math.sin(yaw) * (r + 5.0), z - 1.5), (r * 1.6, r * 0.9, 5.0), yaw, _lin(0xECECE6))
        stood += 1
    x, y, _ = k.P(i, -92.0, 104.0 * side)
    k_z = k.height_at(x, y)
    paint.box((x, y, k_z - 1.5), (9.0, 9.0, 21.0), 0.4, silver)
    return stood


RANCH = (0.1, 0.5)  # the share of the climb the ranch land lies between
CATTLE = (0x2A2420, 0x6A4028, 0x8A5A38, 0xE8E2D4, 0x3A2A22)


def cow(paint, rng, c, yaw: float) -> None:
    """One of the ranch's cattle: a barrel on four legs, head down to graze or up to watch the riders pass."""
    hide = _lin(CATTLE[rng.randrange(len(CATTLE))])
    cs, sn = math.cos(yaw), math.sin(yaw)

    def at(fwd: float, left: float, up: float):
        return (c[0] + fwd * cs - left * sn, c[1] + fwd * sn + left * cs, c[2] + up)

    for fwd in (0.7, -0.7):
        for left in (0.24, -0.24):
            paint.box(at(fwd, left, -0.2), (0.16, 0.16, 0.95), yaw, hide, 0.6)
    paint.box(at(0, 0, 0.72), (2.0, 0.72, 0.78), yaw, hide, 0.8)
    grazing = rng.random() < 0.6
    paint.box(at(1.25, 0, 0.25 if grazing else 1.15), (0.6, 0.34, 0.42), yaw, hide, 0.9)
    paint.box(at(1.05, 0, 0.6 if grazing else 0.95), (0.34, 0.3, 0.5), yaw, hide, 0.9)


def ranch_land(k) -> dict:
    """Detail 6, ranch land: on the middle slopes a post-and-wire fence runs along both sides of the road, cattle
    graze the pasture behind it, and eucalyptus stand in lines with a jacaranda in flower among them."""
    paint, rng, s, B = Painted(k), k.rng, k.s, k.B
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    cattle = trees = 0
    for i in range(6, k.n - 6):
        if not RANCH[0] < shares[i // 25] < RANCH[1]:
            continue
        # A post every 8 m and three strands between: by the road only, so in the group drawn near.
        if i % 2 == 0 and abs(s[i]["k"]) < 1 / 60:
            for side in (1, -1):
                off = (k.kerb + 4.2) * side
                x, y, z = k.road.at(i, off)
                x1, y1, z1 = k.road.at(i + 2, off)
                B["wood"].box((x, y, z - 0.5), (0.12, 0.12, 1.75), s[i]["h"])
                for up in (0.45, 0.8, 1.15):
                    B["hk-wire"].quad((x, y, z + up - 0.02), (x1, y1, z1 + up - 0.02), (x1, y1, z1 + up + 0.02), (x, y, z + up + 0.02))
        if rng.random() < 0.035:
            side = rng.choice((1, -1))
            off = (k.kerb + rng.uniform(9.0, 40.0)) * side
            cx, cy, _ = k.road.at(i, off)
            for _ in range(rng.randint(2, 6)):
                x, y = cx + rng.uniform(-9.0, 9.0), cy + rng.uniform(-9.0, 9.0)
                if k.road.clear_of_road(x, y, 11.0, i):
                    cow(paint, rng, (x, y, k.ground(x, y, i, off)), rng.uniform(0, math.tau))
                    cattle += 1
        if rng.random() < 0.07:
            side = rng.choice((1, -1))
            off = (k.kerb + rng.uniform(7.0, 30.0)) * side
            x, y, _ = k.road.at(i, off)
            if not k.road.clear_of_road(x, y, 10.0, i):
                continue
            z = k.ground(x, y, i, off)
            if rng.random() < 0.2:
                # A jacaranda: a low spreading crown, all flower.
                k.prism(B["trunk-dark"], (x, y, z - 0.5), 0.3, 4.2, 5, 0.2)
                for _ in range(3):
                    lens(B["hk-jacaranda"], (x + rng.uniform(-2.0, 2.0), y + rng.uniform(-2.0, 2.0), z + rng.uniform(3.6, 4.8)), rng.uniform(2.2, 3.2), 1.9, rng)
            else:
                # A eucalyptus: tall and pale-trunked, its leaves in loose clumps up the stem.
                tall = rng.uniform(11.0, 18.0)
                k.prism(B["trunk"], (x, y, z - 0.5), 0.36, tall * 0.85, 5, 0.14)
                for q in range(3):
                    up = tall * (0.46 + 0.2 * q)
                    lens(B["hk-eucalyptus" if q % 2 else "hk-eucalyptus-dark"], (x + rng.uniform(-1.4, 1.4), y + rng.uniform(-1.4, 1.4), z + up), rng.uniform(2.0, 3.0) * (1 - q * 0.14), 2.6, rng, 6)
            trees += 1
    return {"cattle": cattle, "ranchTrees": trees}


def scenery(k) -> dict:
    posts = reflector_posts(k)
    cloud = cloud_sea(k)
    swords = silverswords(k)
    domes = science_city(k)
    ranch = ranch_land(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD), "posts": posts, "cloudTop": round(cloud), "silverswords": swords, "domes": domes, **ranch}
