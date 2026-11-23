"""Cinque Terre: the corniche above the Ligurian Sea, for build_course.py (ADR 0034).

The map of GCN Training's 3 Mins On, 2 Mins Off. themes.py takes this module's theme, materials and scenery, so the
world's whole look is here. The scenery works through the ten critical details of `docs/worlds/cinqueterre/README.md`,
from its reference photographs: each function below names the detail it builds.

Budget (L2-166 AC12): what stands by the road is in the chunked groups and drawn only near the rider; what is seen
across a bay (the far headlands and their villages) is a few hundred triangles in the `Peaks` group, drawn whole.
"""

from __future__ import annotations

import math
import random

from worldkit import Painted, lens, lin as _lin, smooth as _smooth

CROWD = [f"crowd-{i}" for i in range(6)]

# name -> colour, roughness, glow: added to themes.MATERIALS.
MATERIALS: dict[str, dict] = {
    # Small things painted by vertex that only matter close to: balcony rails, nets, handrails. Unlike what is
    # painted into the land ("terrain", drawn to 950 m), this is in the group drawn near the rider.
    "ct-detail": {"color": 0xFFFFFF, "rough": 0.9, "vertex": True},
    # The parapet's capstones: paler than the wall they lie on, worn smooth.
    "ct-cap": {"color": 0xB5AD9A, "rough": 0.9},
    # A terrace's tread of dry earth and summer grass, and the vines trained along it.
    "ct-terrace": {"color": 0x9A9460, "rough": 1.0},
    "ct-vine": {"color": 0x5C8A38, "rough": 0.9},
    "ct-vine-gold": {"color": 0x8FA040, "rough": 0.9},
    "ct-maquis": {"color": 0x4F7038, "rough": 1.0},
    # The maquis: umbrella pines, olives silver in the light, agaves blue-grey, prickly pears, the broom's yellow.
    "ct-pine": {"color": 0x3F6B3A, "rough": 0.9},
    "ct-pine-dark": {"color": 0x2F5530, "rough": 0.9},
    "ct-olive": {"color": 0x8C9C78, "rough": 0.9},
    "ct-agave": {"color": 0x7E9C92, "rough": 0.8},
    "ct-pear": {"color": 0x6E9A4E, "rough": 0.8},
    "ct-broom": {"color": 0xE2C23A, "rough": 0.9},
}

THEME: dict = {
    # Detail 10, golden Italian light: a clear afternoon, the sky pale and warm at the horizon and a deep azure
    # overhead, the sun high enough to cut sharp shadows and warm enough to gild the stone.
    "sky": [0xF7E9CF, 0xBFE0EE, 0x86C2E8, 0x4E9BDB, 0x2A72C0],
    "haze": 0xC6DEE9,
    "light": [0xFFE3B2, 3.1],
    "fill": [0xCFE4F5, 0x8A7A5E],
    "sun_altitude": 0.34,
    # The sun is a pale gold disc, not Ibiza's red one, and the chevrons at the foot of an effort are road paint.
    "palette": {"asphalt": 0x4C4A48, "sand": 0xA5997C, "sea": 0x0F5F8A, "stone": 0x978E79, "sun": 0xFFF2CC, "chevron": 0xF2EEE2},
    "land": {"low": 0xA39A6E, "mid": 0x6F8A48, "high": 0x55733C, "rock": 0x8A847A},
    # Detail 10, golden light: evening. The sun is low in the west over the sea, behind a rider heading down the
    # coast, so it lies gold on the facades, the terrace walls and the cliffs ahead, and the shadows run on in front.
    "sun_azimuth": math.radians(162),
    # A provincial road, not a circuit: no red-and-white kerbs round its bends.
    "kerbs": False,
    # The villages, the boats and the path are painted into the land, so it is cut into 480 m lengths, not 960 m:
    # by a hairpin, half as much of it is drawn.
    "chunks": {"Land": 2},
    "terrain": {"sea": True, "cliff": True, "rise": 48.0, "far": 8.0},
    "edge": "corniche",
    "centre": "white",
    "grade": {"perLevel": 0.8},
    "sea_clearance": 40.0,
}

# The coast: the corniche runs east along it with the sea on its left, to the north, swinging out round the
# headlands and in round the ravines. On each long effort it climbs the hillside by a pair of hairpins.
HAIRPIN_RADIUS = 26.0  # metres, on the centre line
SWITCHBACK_LEG = 170.0  # the leg between a pair of hairpins, heading back west above the road it left
SWITCHBACK_STRAIGHT = (240.0, 280.0)  # the road runs straight this far before a pair and after it
SWITCHBACK_STAGE = 900.0  # an effort at least this long climbs by a pair


def lay_centre_line(course: dict, theme: dict, bc):
    """The corniche's centre line, as build_course.lay_centre_line returns it: the samples (x, y, z, heading,
    curvature, grade, distance), the stages, the length, the mean level and the gradient a level.

    The heading is a sum of three: the coast's own slow turns, eased flat round each pair of hairpins; the swing of
    the road round headlands and ravines; and the hairpins, a right-hander up the hillside and a left-hander back.
    Its swing never passes a right angle, so apart from the legs between hairpins the road always makes ground east
    and the sea is always on its left."""
    step, lead_in = bc.STEP, bc.LEAD_IN
    st = bc.stages(course["plan"])
    length = st[-1]["to"]
    total = lead_in + length + bc.RUN_OUT
    mean = sum(g["level"] * (g["to"] - g["from"]) for g in st) / length
    per_level = theme["grade"]["perLevel"]
    n = int(math.ceil(total / step)) + 1
    turn = math.pi * HAIRPIN_RADIUS
    before, after = SWITCHBACK_STRAIGHT
    pairs = [g["from"] + 0.3 * (g["to"] - g["from"]) for g in st if g["kind"] == "work" and g["to"] - g["from"] >= SWITCHBACK_STAGE]
    zones = [(a - before, a, a + turn, a + turn + SWITCHBACK_LEG, a + 2 * turn + SWITCHBACK_LEG, a + 2 * turn + SWITCHBACK_LEG + after) for a in pairs]

    def heading_fn(rng: random.Random):
        phases = [rng.uniform(0, math.tau) for _ in range(3)]
        coast = [rng.uniform(-0.4, 0.4) for _ in zones]

        def heading(d: float) -> float:
            # The coast's own direction: each pair of hairpins has its own, eased from one to the next.
            base = 0.0
            if zones:
                if d <= zones[0][0]:
                    base = coast[0] * bc.smoothstep(0.0, zones[0][0], d)
                elif d >= zones[-1][5]:
                    base = coast[-1] * (1 - bc.smoothstep(zones[-1][5], length - 420.0, d))
                else:
                    for q, zone in enumerate(zones):
                        if zone[0] <= d <= zone[5]:
                            base = coast[q]
                        elif q + 1 < len(zones) and zone[5] < d < zones[q + 1][0]:
                            base = coast[q] + (coast[q + 1] - coast[q]) * bc.smoothstep(zone[5], zones[q + 1][0], d)
            # The swing round headlands and ravines: still at the start, the finish and each pair of hairpins.
            swing = 0.82 * math.sin(math.tau * d / 1400.0 + phases[0]) + 0.5 * math.sin(math.tau * d / 560.0 + phases[1]) + 0.24 * math.sin(math.tau * d / 230.0 + phases[2])
            ease = bc.smoothstep(40.0, 260.0, d) * (1 - bc.smoothstep(length - 620.0, length - 380.0, d))
            hairpins = 0.0
            for zone in zones:
                ease *= 1 - bc.smoothstep(zone[0] - 220.0, zone[0], d) * (1 - bc.smoothstep(zone[5], zone[5] + 220.0, d))
                if zone[1] < d <= zone[2]:
                    hairpins = -math.pi * (d - zone[1]) / turn
                elif zone[2] < d <= zone[3]:
                    hairpins = -math.pi
                elif zone[3] < d < zone[4]:
                    hairpins = -math.pi * (1 - (d - zone[3]) / turn)
            return base + ease * 1.02 * math.tanh(swing / 1.02) + hairpins

        return heading

    seed = course.get("seed", 1)
    laid = None
    for attempt in range(40):
        heading = heading_fn(random.Random(seed * 1000 + attempt))
        hs = bc.box_smooth([heading(i * step - lead_in) for i in range(n)], int(12 / step))
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
            laid = (xs, ys, hs)
            break
    if laid is None:
        raise RuntimeError("No corniche found that keeps clear of itself; change the course's seed.")
    xs, ys, hs = laid
    curv = [(hs[min(n - 1, i + 1)] - hs[max(0, i - 1)]) / (2 * step) for i in range(n)]
    grades = []
    for i in range(n):
        stage = bc.stage_at(st, i * step - lead_in)
        grades.append((stage["level"] - mean) * per_level if stage else 0.0)
    grades = bc.box_smooth(grades, int(28 / step))
    zs, z = [], 0.0
    for g in grades:
        z += g / 100.0 * step
        zs.append(z)
    low = min(zs) - theme["sea_clearance"]
    samples = [{"x": xs[i], "y": ys[i], "z": zs[i] - low, "h": hs[i], "k": curv[i], "g": grades[i], "d": i * step - lead_in} for i in range(n)]
    return samples, st, length, mean, per_level


# The five villages, in the order a rider heading east meets them.
VILLAGES = ("Monterosso", "Vernazza", "Corniglia", "Manarola", "Riomaggiore")
SPUR_REACH = 150.0  # how far a village's rock spur runs out from the road towards the sea, in metres


def village_sites(s: list[dict]) -> list[dict]:
    """Where the villages stand: on the headlands, the places the road swings furthest out to sea, spread along the
    coast. Each is the sample of the road above it and the middle of its spur."""
    step = s[1]["d"] - s[0]["d"]
    length = s[-1]["d"]
    chosen: list[int] = []
    # The boldest headlands first, well apart; then, until there are five, lesser ones closer together.
    for reach, apart in ((360.0, 1500.0), (240.0, 1150.0), (160.0, 850.0)):
        span = int(reach / step)
        found = []
        for i in range(span, len(s) - span):
            p = s[i]
            if not 500.0 < p["d"] < length - 900.0 or math.cos(p["h"]) < 0.8:
                continue
            window = s[i - span : i + span + 1]
            if p["y"] < max(q["y"] for q in window) or any(abs(q["k"]) > 1 / 70 for q in s[i - 30 : i + 31]):
                continue
            found.append((p["y"] - sum(q["y"] for q in window) / len(window), i))
        for _, i in sorted(found, reverse=True):
            if len(chosen) < len(VILLAGES) and all(abs(s[i]["d"] - s[j]["d"]) > apart for j in chosen):
                chosen.append(i)
    return [{"name": VILLAGES[q], "i": i, "x": s[i]["x"], "y": s[i]["y"], "z": s[i]["z"]} for q, i in enumerate(sorted(chosen))]


def spur_height(site: dict, x: float, y: float) -> float:
    """The height of a village's spur of rock at a place: a ridge running out from under the road and down to a
    point above the water, or far below the sea where the spur is not."""
    out = y - site["y"]
    # Level with the road where the village's top row of houses stands beside it, then down to the water.
    top = site["z"] - 2.6
    ridge = top + (7.0 - top) * _smooth(36.0, SPUR_REACH - 30.0, out)
    side = 1 - _smooth(34.0, 84.0, abs(x - site["x"]) * (1.0 + 0.3 * math.sin(out * 0.05)))
    return -8.0 + (ridge + 8.0) * side * (1 - _smooth(SPUR_REACH - 22.0, SPUR_REACH, out)) * _smooth(-6.0, 6.0, out)


def seaward(k, i: int) -> int:
    """Which side of the road the sea is on at sample i: 1 for the left, -1 on a leg between hairpins."""
    return 1 if math.cos(k.s[i]["h"]) >= 0 else -1


def build_land(road, col, theme: dict, bc):
    """The coast's land, as build_course.build_land returns it (the mesh and the land's height at a place).

    North of the road the land falls to the sea in a cliff, the higher the road the longer the fall. Between the legs
    of a pair of hairpins it slopes from one to the other. South of the road the mountain climbs away inland."""
    cell = 24.0  # coarser than 20 m: the land is half of what a frame draws here
    s = road.s
    xs, ys = [p["x"] for p in s], [p["y"] for p in s]
    x0, x1 = min(xs) - 520.0, max(xs) + 520.0
    y0, y1 = min(ys) - 660.0, max(ys) + 240.0
    nx, ny = int((x1 - x0) / cell) + 1, int((y1 - y0) / cell) + 1
    # The coast road at each place along the coast: the seaward-most stretch of road there, and the most inland.
    width = 16.0
    bins = int((x1 - x0) / width) + 1
    hi, lo = [None] * bins, [None] * bins
    for p in s:
        for b in range(max(0, int((p["x"] - 24.0 - x0) / width)), min(bins, int((p["x"] + 24.0 - x0) / width) + 1)):
            if hi[b] is None or p["y"] > hi[b]:
                hi[b] = p["y"]
            if lo[b] is None or p["y"] < lo[b]:
                lo[b] = p["y"]
    first = next(b for b in range(bins) if hi[b] is not None)
    last = next(b for b in range(bins - 1, -1, -1) if hi[b] is not None)
    for b in range(bins):
        src = min(max(b, first), last)
        hi[b], lo[b] = hi[src], lo[src]
    hi, lo = bc.box_smooth(hi, 2), bc.box_smooth(lo, 2)

    def along(values, x: float) -> float:
        f = min(max((x - x0) / width, 0.0), bins - 1.001)
        b = int(f)
        return values[b] + (values[b + 1] - values[b]) * (f - b)

    sites = village_sites(s)
    land = theme["land"]
    low_c, mid_c, high_c, rock_c = (bc.srgb(land[name]) for name in ("low", "mid", "high", "rock"))
    wet_c, pale_c = bc.srgb(0x4E4A44), bc.srgb(0xA8A090)
    heights, zone = {}, {}
    for iy in range(ny):
        for ix in range(nx):
            x, y = x0 + ix * cell, y0 + iy * cell
            near = road.tree.find_n((x, y, 0.0), 16)
            d = near[0][2]
            w_sum = h_sum = 0.0
            for _, j, dj in near:
                w = 1.0 / (dj * dj + 16.0)
                w_sum += w
                h_sum += w * s[j]["z"]
            h_road = h_sum / w_sum - 1.4
            n1, n2 = bc.noise(x * 0.6, y * 0.6), bc.noise(x * 2.3 + 40.0, y * 2.3)
            out = y - along(hi, x)
            inland = along(lo, x) - y
            if out > 0:
                # The cliff: from the road's shoulder down to the water, its face broken by ledges.
                run = 10.0 + 0.7 * max(h_road, 0.0)
                t = bc.smoothstep(6.0, 6.0 + run, out)
                h = h_road * (1 - t) - 8.0 * t + n2 * 0.1 * max(h_road, 0.0) * math.sin(math.pi * t)
                # A village's spur of rock stands out from the cliff.
                for site in sites:
                    if abs(x - site["x"]) < 120.0:
                        h = max(h, spur_height(site, x, y))
            else:
                # Between the legs of the road the land slopes from one to the other; inland the mountain climbs
                # to its ridge and falls away behind it.
                u = max(inland, 0.0)
                mountain = 175.0 * (0.74 + 0.26 * n1) * bc.smoothstep(10.0, 430.0, u) * (1 - 0.45 * bc.smoothstep(470.0, 660.0, u))
                h = h_road + mountain + abs(n2) * 9.0 * bc.smoothstep(20.0, 90.0, u) + 2.0 * bc.smoothstep(26.0, 60.0, d) * (1 - bc.smoothstep(0.0, 30.0, u))
            if d < 9.0:
                h = s[near[0][1]]["z"] - 1.4
            elif d < 26.0:
                h = min(h, s[near[0][1]]["z"] - 1.4)
            # The coast ends in a cape at either end of the map.
            h = -8.0 + (h + 8.0) * bc.smoothstep(0.0, 260.0, min(x - x0, x1 - x))
            heights[(ix, iy)] = h
            zone[(ix, iy)] = out
    b = bc.Builder("Terrain", "terrain")
    b.colours = []
    index = {}
    for iy in range(ny):
        for ix in range(nx):
            h = heights[(ix, iy)]
            x, y = x0 + ix * cell, y0 + iy * cell
            hx = heights.get((ix + 1, iy), h) - heights.get((ix - 1, iy), h)
            hy = heights.get((ix, iy + 1), h) - heights.get((ix, iy - 1), h)
            slope = math.hypot(hx, hy) / (2 * cell)
            c = bc.mix(low_c, mid_c, 0.5 + 0.5 * bc.noise(x * 0.7, y * 0.7))
            c = bc.mix(c, high_c, bc.smoothstep(60.0, 200.0, h) * 0.8 + 0.2 * bc.smoothstep(-0.2, 0.6, bc.noise(x * 1.9, y * 1.9)))
            # Rock where it is steep, in bands of strata down the cliff, dark and wet at the water.
            strata = 0.5 + 0.5 * math.sin(h * 0.42 + bc.noise(x * 1.5, y * 1.5) * 2.4)
            rock = bc.mix(rock_c, pale_c, strata * 0.6)
            c = bc.mix(c, rock, max(bc.smoothstep(0.45, 0.85, slope), bc.smoothstep(4.0, 16.0, zone[(ix, iy)]) * 0.85))
            c = bc.mix(wet_c, c, bc.smoothstep(-1.0, 3.5, h))
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
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, 14000.0
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


def parapet(k) -> None:
    """Detail 3, the corniche road: a low wall of coursed stone follows the seaward edge through every bend, and
    both edges round a hairpin, under worn capstones, with a squat pier every 32 m and a slot at its foot now and
    then to let the rain off the road."""
    face, cap = k.B["stone"], k.B["ct-cap"]
    inner, outer, top = k.kerb + 0.8, k.kerb + 1.25, 0.78
    for i in range(k.n - 1):
        j = i + 1
        tight = abs(k.s[i]["k"]) > 1 / 60
        for side in (1, -1):
            if not tight and side != seaward(k, i):
                continue

            def at(q: int, left: float, up: float = 0.0, side=side):
                return k.road.at(q, left * side, up)

            def quad(b, p0, p1, p2, p3, side=side):
                # Seen from outside it whichever side of the road it stands on.
                b.quad(p0, p1, p2, p3) if side > 0 else b.quad(p1, p0, p3, p2)

            # A drain: for one sample in eleven the wall stands on a lintel, clear of the ground.
            foot = 0.22 if i % 11 == 5 else 0.0
            quad(face, at(i, inner, foot), at(j, inner, foot), at(j, inner, top), at(i, inner, top))
            quad(face, at(i, outer, top), at(j, outer, top), at(j, outer, -0.4), at(i, outer, -0.4))
            # The capstones overhang the wall a little either side.
            lo, hi, a, b = top, top + 0.09, inner - 0.05, outer + 0.05
            quad(cap, at(i, a, lo), at(j, a, lo), at(j, a, hi), at(i, a, hi))
            quad(cap, at(i, a, hi), at(j, a, hi), at(j, b, hi), at(i, b, hi))
            quad(cap, at(i, b, hi), at(j, b, hi), at(j, b, lo), at(i, b, lo))
            if i % 8 == 0:
                face.box(k.P(i, 0, (inner + outer) / 2 * side, -0.2), (0.7, 0.7, 1.22), k.s[i]["h"])
                cap.box(k.P(i, 0, (inner + outer) / 2 * side, 1.02), (0.82, 0.82, 0.1), k.s[i]["h"])


# The terraces: how far behind the kerb the first wall stands, each step's depth and each wall's height, in metres.
TERRACE_FOOT, TERRACE_DEPTH, TERRACE_RISE = 2.4, 6.4, 2.3


def terrace_levels(k, i: int) -> int:
    """How many terraces step up the hillside beside sample i: vineyards come in stretches of a few hundred metres,
    three to six steps high, with open hillside between them."""
    d = i * k.step
    band = math.sin(d / 310.0 + 0.8) + 0.6 * math.sin(d / 127.0 + 2.1)
    if band < -0.35:
        return 0
    return 3 + int((band + 0.35) * 1.9) % 4


GROVE = (20, 44)  # how many samples from a village's middle its lemon groves lie between, on either side
GROVE_SPOTS: list[tuple[int, int, int]] = []  # where terraces() left a step free of vines: sample, level, side


def in_grove(k, i: int) -> bool:
    return any(GROVE[0] <= abs(i - site["i"]) <= GROVE[1] for site in village_sites(k.s))


def lemon_groves(k) -> int:
    """Detail 8, Mediterranean scrub and olives: the terraces nearest each village grow lemons, not vines. Round
    dark-green trees stand in rows on the steps with their yellow fruit showing, and a pair of tall black
    cypresses marks where each grove begins and ends."""
    paint, rng, s = Painted(k), k.rng, k.s
    trunk, leaf, deep, fruit, cypress = _lin(0x5A4634), _lin(0x3F7A32), _lin(0x2C5A26), _lin(0xF2D23A), _lin(0x24402A)
    trees = 0
    for i, level, side in GROVE_SPOTS:
        off = k.kerb + TERRACE_FOOT + (level + rng.uniform(0.4, 0.6)) * TERRACE_DEPTH
        x, y, z = k.road.at(i, off * side, (level + 1) * TERRACE_RISE)
        ends = any(abs(i - site["i"]) in (GROVE[0] + 1, GROVE[1] - 2) for site in village_sites(s))
        if ends and level == 0:
            for dx in (-1.3, 1.3):
                cx, cy = x + math.cos(s[i]["h"]) * dx, y + math.sin(s[i]["h"]) * dx
                paint.tube((cx, cy, z - 0.2), 0.4, 1.0, 1.6, cypress, cypress, 6)
                paint.tube((cx, cy, z + 1.4), 1.0, 0.12, rng.uniform(6.5, 8.5), cypress, _lin(0x2F5236), 6, _lin(0x2F5236))
            trees += 2
            continue
        r = rng.uniform(1.5, 1.9)
        paint.tube((x, y, z - 0.2), 0.16, 0.14, 1.3, trunk, trunk, 3)
        paint.tube((x, y, z + 1.0), r * 0.55, r, 0.9, deep, leaf, 5)
        paint.tube((x, y, z + 1.9), r, r * 0.35, 1.3, leaf, leaf, 5, leaf)
        for _ in range(2):
            # The lemons, on the side that looks down to the road.
            a = s[i]["h"] - side * math.pi / 2 + rng.uniform(-1.0, 1.0)
            paint.box((x + math.cos(a) * r * 0.92, y + math.sin(a) * r * 0.92, z + rng.uniform(1.3, 2.2)), (0.3, 0.3, 0.3), a, fruit, 1.0)
        trees += 1
    return trees


def terraces(k) -> int:
    """Detail 4, terraced vineyards: dry-stone walls step up the hillside above the road, a strip of earth behind
    each, and on each strip two rows of vines trained along the slope."""
    wall, tread, slope = k.B["stone"], k.B["ct-terrace"], k.B["ct-maquis"]
    s = k.s
    built = 0
    for i in range(3, k.n - 4):
        j = i + 1
        # The hillside is on the side away from the sea.
        side = -seaward(k, i)
        if side != -seaward(k, j):
            continue

        def at(q: int, off: float, up: float = 0.0, side=side):
            return k.road.at(q, off * side, up)

        def quad(b, p0, p1, p2, p3, side=side):
            b.quad(p0, p1, p2, p3) if side < 0 else b.quad(p1, p0, p3, p2)

        levels = min(terrace_levels(k, i), terrace_levels(k, j))
        bend = max(abs(s[i]["k"]), abs(s[j]["k"]))
        top = 0
        for level in range(levels):
            front = k.kerb + TERRACE_FOOT + level * TERRACE_DEPTH
            back = front + TERRACE_DEPTH
            # On the inside of a tight bend the steps would fold over one another; near another stretch of the
            # road they would stand in it.
            if bend * back > 0.55 or not k.room(i, back * side, 12.0):
                break
            lo, hi = level * TERRACE_RISE - (0.4 if level == 0 else 0.0), (level + 1) * TERRACE_RISE
            quad(wall, at(j, front, lo), at(i, front, lo), at(i, front, hi), at(j, front, hi))
            quad(tread, at(i, front, hi), at(i, back, hi), at(j, back, hi), at(j, front, hi))
            if in_grove(k, i):
                # A lemon grove's step: no vines; lemon_groves() plants it.
                if i % 3 == 0 and level < 3:
                    GROVE_SPOTS.append((i, level, side))
                top = level + 1
                continue
            # Two rows of vines a step: a low ridge of leaves along the terrace, the outer row turning gold.
            for row, mat in ((0.3, "ct-vine"), (0.68, "ct-vine-gold" if (i // 9 + level) % 3 == 0 else "ct-vine")):
                if i % 5 == 4:
                    continue  # a gap between one plant's run of leaves and the next
                mid = front + TERRACE_DEPTH * row
                b = k.B[mat]
                ridge_i, ridge_j = at(i, mid, hi + 1.25), at(j, mid, hi + 1.25)
                # Only the face that looks down to the road: the vineyard is always above the rider, and the
                # backs of the rows were a fifth of what a frame draws by a hairpin.
                quad(b, at(i, mid - 0.55, hi), at(j, mid - 0.55, hi), ridge_j, ridge_i)
            top = level + 1
        if top:
            # Behind the last step the hillside carries on up in scrub, to the land beyond.
            back = k.kerb + TERRACE_FOOT + top * TERRACE_DEPTH
            fi, fj = at(i, back + 30.0), at(j, back + 30.0)
            zi = max(k.height_at(fi[0], fi[1]), s[i]["z"] + top * TERRACE_RISE + 4.0)
            zj = max(k.height_at(fj[0], fj[1]), s[j]["z"] + top * TERRACE_RISE + 4.0)
            quad(slope, at(i, back, top * TERRACE_RISE), (fi[0], fi[1], zi), (fj[0], fj[1], zj), at(j, back, top * TERRACE_RISE))
            built += 1
    return built


# The houses' plaster: pinks, ochres, yellows and creams, a terracotta red and a pale green now and then.
PASTELS = (0xE8A08C, 0xE9B384, 0xF0CF82, 0xF3DDA6, 0xE98F7C, 0xF2C7A0, 0xD9776A, 0xF6E6C4, 0xE7B8A8, 0xC9D3A6, 0xEBC27A, 0xDD8E6E)
ROOFS = (0xB5674A, 0xA85C44, 0x8C8A86, 0x9A948C)
# Persiane, the louvred shutters: the dark Ligurian green on most houses, brown or grey-blue on a few.
SHUTTERS = (0x2F6B4A, 0x2F6B4A, 0x2F6B4A, 0x35755A, 0x6A4A32, 0x4A6272)
PANE = 0x27303A
DOORS = (0x2F5A42, 0x5A3A26, 0x3A4A5A, 0x6A2E28)
WASHING = (0xF4F2EC, 0xF4F2EC, 0xE8D8B8, 0xC8423A, 0x3F78B8, 0xE8B83A, 0x8AB8D8, 0xE89AA8)
FLOOR = 3.05  # a storey's height, in metres


GERANIUMS = (0xD8342E, 0xE0527A, 0xF2F0E8, 0xE8742E)


def windows(paint, rng, c, size, yaw: float, floors: int, hidden=(0.0, 1.0), near=None) -> None:
    """A house's windows, painted on its walls: on each storey a pane between a pair of open shutters, or the
    shutters closed over it; one window in eleven above the street has a balcony, an iron rail and geraniums. The
    wall that looks the way of `hidden` (out to sea, unless told otherwise), which no
    rider sees, has none."""
    hx, hy = size[0] / 2, size[1] / 2
    cs, sn = math.cos(yaw), math.sin(yaw)
    near = near or paint  # what a balcony is painted with: the group drawn near, if the caller has one
    corners = [(c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs) for dx, dy in ((-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy))]
    shutter, pane = _lin(SHUTTERS[rng.randrange(len(SHUTTERS))]), _lin(PANE)
    for q in range(4):
        a, b = corners[q], corners[(q + 1) % 4]
        wide = math.hypot(b[0] - a[0], b[1] - a[1])
        along = ((b[0] - a[0]) / wide, (b[1] - a[1]) / wide)
        out = (along[1], -along[0])
        if out[0] * hidden[0] + out[1] * hidden[1] > 0.5:
            continue
        columns = max(1, int(wide / 3.1))
        door_at = rng.randrange(columns)
        for storey in range(floors):
            for column in range(columns):
                mid = (column + 0.5) * wide / columns
                z = c[2] + storey * FLOOR + 1.05
                if storey == 0 and column == door_at:
                    # The street door, under a pale stone lintel.
                    paint.panel(a, along, out, mid - 0.62, mid + 0.62, c[2] - 0.1, c[2] + 2.42, 0.05, _lin(0xD8CDB4))
                    paint.panel(a, along, out, mid - 0.5, mid + 0.5, c[2] - 0.1, c[2] + 2.25, 0.09, _lin(DOORS[rng.randrange(len(DOORS))]))
                    continue
                if storey and rng.random() < 0.16:
                    # Washing on a line under the sill: a sheet, a shirt, a towel.
                    left = mid - 1.3
                    for _ in range(rng.randint(2, 4)):
                        w, drop = rng.uniform(0.35, 0.8), rng.uniform(0.45, 0.95)
                        paint.panel(a, along, out, left, left + w, z - 0.2 - drop, z - 0.2, 0.32, _lin(WASHING[rng.randrange(len(WASHING))]))
                        left += w + 0.12
                if storey and rng.random() < 0.09:
                    # A balcony: a stone slab on the wall, an iron rail round it with geraniums along the top, and
                    # behind it the window cut down to the floor as a door.
                    floor = c[2] + storey * FLOOR + 0.1
                    bx, by = a[0] + along[0] * mid + out[0] * 0.5, a[1] + along[1] * mid + out[1] * 0.5
                    near.box((bx, by, floor - 0.14), (2.3, 1.0, 0.14), math.atan2(along[1], along[0]), _lin(0xCFC6B2), 0.8)
                    iron, byaw = _lin(0x2A2A2E), math.atan2(along[1], along[0])

                    def on(u: float, v: float, up: float, a=a, along=along, out=out, floor=floor):
                        return (a[0] + along[0] * u + out[0] * v, a[1] + along[1] * u + out[1] * v, floor + up)

                    # Solid, so it reads from along the street: the rail, its ends and bars, and the flower box.
                    near.box(on(mid, 0.97, 0.9), (2.3, 0.06, 0.06), byaw, iron, 1.0)
                    for end in (-1.12, 1.12):
                        near.box(on(mid + end, 0.5, 0.9), (0.06, 1.0, 0.06), byaw, iron, 1.0)
                    for bar in range(5):
                        at = mid - 1.12 + bar * 2.24 / 4
                        near.panel(a, along, out, at - 0.03, at + 0.03, floor, floor + 0.9, 0.97, iron)
                    near.box(on(mid, 1.08, 0.62), (2.0, 0.26, 0.46), byaw, _lin(GERANIUMS[rng.randrange(len(GERANIUMS))]), 0.6)
                    paint.panel(a, along, out, mid - 0.85, mid + 0.85, floor, z + 1.5, 0.05, shutter)
                    paint.panel(a, along, out, mid - 0.42, mid + 0.42, floor, z + 1.46, 0.09, pane)
                    continue
                paint.panel(a, along, out, mid - 0.85, mid + 0.85, z, z + 1.5, 0.05, shutter)
                if rng.random() < 0.72:
                    paint.panel(a, along, out, mid - 0.42, mid + 0.42, z + 0.04, z + 1.46, 0.09, pane)


def villages(k) -> int:
    """Details 1 and 6, the pastel tower-houses and the villages seen from the bends above: on each headland's spur
    of rock, tall narrow houses in pink, ochre and yellow stand door to door down to the water, under low roofs of
    tile and slate."""
    paint, near, rng = Painted(k), Painted(k, "ct-detail"), k.rng
    houses = 0
    for site in village_sites(k.s):
        placed: list[tuple[float, float]] = []
        for _ in range(900):
            if len(placed) >= 58:
                break
            x = site["x"] + rng.uniform(-72.0, 72.0)
            y = site["y"] + rng.uniform(16.0, SPUR_REACH - 16.0)
            z = k.height_at(x, y)
            if z < 3.5 or any(math.hypot(x - px, y - py) < 7.4 for px, py in placed):
                continue
            # Vernazza's castle and church have their own ground.
            if site["name"] == "Vernazza" and any(math.hypot(x - site["x"] - lx, y - site["y"] - ly) < reach for lx, ly, reach in (*LANDMARKS[1:], (*castle_place(k, site), 36.0), *piazza_ground(k, site))):
                continue
            # Each of the other villages keeps the ground of its parish church.
            if site["name"] != "Vernazza" and math.hypot(x - parish_place(k, site)[0], y - parish_place(k, site)[1]) < 24.0:
                continue
            # Not on the cliff under the road, and not where the rock is too steep to build on.
            fall = max(abs(k.height_at(x + 5.0, y) - z), abs(k.height_at(x, y + 5.0) - z))
            if fall > 7.5 or k.road.tree.find((x, y, 0.0))[2] < 13.5:
                continue
            placed.append((x, y))
            wide, deep = rng.uniform(5.6, 8.2), rng.uniform(6.0, 9.0)
            floors = rng.randint(3, 6)
            yaw = rng.uniform(-0.22, 0.22) + (math.pi / 2 if rng.random() < 0.35 else 0.0)
            tall = floors * FLOOR + fall
            wall = _lin(PASTELS[rng.randrange(len(PASTELS))])
            paint.box((x, y, z - fall - 1.5), (wide, deep, tall + 1.5), yaw, wall)
            paint.roof((x, y, z + floors * FLOOR), wide, deep, rng.uniform(0.9, 1.6), yaw, _lin(ROOFS[rng.randrange(len(ROOFS))]))
            windows(paint, rng, (x, y, z), (wide, deep), yaw, floors, near=near)
            # A chimney or two on the roof, each under its little tiled cap.
            for _ in range(rng.randint(0, 2)):
                cx, cy = x + rng.uniform(-wide, wide) * 0.3, y + rng.uniform(-deep, deep) * 0.3
                paint.box((cx, cy, z + floors * FLOOR + 0.2), (0.55, 0.55, 1.5), yaw, wall, 0.9)
                paint.box((cx, cy, z + floors * FLOOR + 1.7), (0.8, 0.8, 0.14), yaw, _lin(ROOFS[0]), 1.0)
            houses += 1
        print(f"{site['name']}: {len(placed)} houses below the road {site['z']:.0f} m up, {k.s[site['i']]['d']:.0f} m from the start", flush=True)
    return houses


def village_streets(k) -> int:
    """Details 1 and 6, the tower-houses and the villages: a village does not stop at the road. Along its inland
    side, behind the boats, a row of tall houses stands shoulder to shoulder on the first terrace's wall, fronts to
    the street, so the road through each of the five is a street with houses on both hands."""
    paint, near, rng, s = Painted(k), Painted(k, "ct-detail"), k.rng, k.s
    houses = 0
    for site in village_sites(s):
        i = site["i"] - 17
        while i < site["i"] + 17:
            # Not in a bend, and not where an effort's arch stands across the road.
            if not 6 < i < k.n - 6 or abs(s[i]["k"]) > 1 / 90 or any(abs(s[i]["d"] - g[edge]) < 16.0 for g in k.st for edge in ("from", "to")):
                i += 2
                continue
            inland, yaw = -seaward(k, i), s[i]["h"]
            wide, deep, floors = rng.uniform(6.2, 8.6), 6.0, rng.randint(3, 5)
            raised = TERRACE_RISE if terrace_levels(k, i) else 0.0
            x, y, z = k.road.at(i, (k.kerb + TERRACE_FOOT + 0.25 + deep / 2) * inland, raised)
            if not k.room(i, (k.kerb + TERRACE_FOOT + deep + 4.0) * inland, 10.0):
                i += 2
                continue
            wall = _lin(PASTELS[rng.randrange(len(PASTELS))])
            paint.box((x, y, z - raised - 0.5), (wide, deep, floors * FLOOR + raised + 0.5), yaw, wall)
            paint.roof((x, y, z + floors * FLOOR), wide, deep, rng.uniform(0.9, 1.5), yaw, _lin(ROOFS[rng.randrange(len(ROOFS))]))
            # The back wall, against the hillside, has no windows.
            windows(paint, rng, (x, y, z), (wide, deep), yaw, floors, (-math.sin(yaw) * inland, math.cos(yaw) * inland), near)
            houses += 1
            i += max(2, int(round((wide + 0.3) / k.step)))
    return houses


def umbrella_pine(k, x: float, y: float, z: float, lean: float) -> None:
    """A stone pine: a bare trunk leaning out, forking under a wide flat crown."""
    rng, B = k.rng, k.B
    tall = rng.uniform(7.5, 11.5)
    top = (x + math.cos(lean) * tall * 0.18, y + math.sin(lean) * tall * 0.18, z + tall)
    k.prism(B["trunk-dark"], (x, y, z - 0.6), 0.34, tall * 0.62 + 0.6, 5, 0.24)
    fork = (x + (top[0] - x) * 0.5, y + (top[1] - y) * 0.5, z + tall * 0.62)
    for q in range(3):
        a = lean + q * math.tau / 3
        tip = (top[0] + math.cos(a) * 1.5, top[1] + math.sin(a) * 1.5, top[2] - 0.5)
        B["trunk-dark"].tri((fork[0] - 0.16, fork[1], fork[2]), (fork[0] + 0.16, fork[1], fork[2]), tip)
        B["trunk-dark"].tri((fork[0] + 0.16, fork[1], fork[2]), (fork[0] - 0.16, fork[1], fork[2]), tip)
    lens(B["ct-pine"], top, rng.uniform(3.4, 4.8), 2.6, rng)
    lens(B["ct-pine-dark"], (top[0] + rng.uniform(-1.6, 1.6), top[1] + rng.uniform(-1.6, 1.6), top[2] - 0.7), rng.uniform(2.4, 3.4), 2.0, rng)


def olive(k, x: float, y: float, z: float) -> None:
    """An olive: a short twisted trunk under two or three mounds of silver-green."""
    rng, B = k.rng, k.B
    k.prism(B["trunk"], (x, y, z - 0.4), 0.3, 1.9, 5, 0.2)
    # Two mounds, a third on one tree in four, five-sided: the olives were the heaviest thing on the hillside.
    for _ in range(3 if rng.random() < 0.25 else 2):
        lens(B["ct-olive"], (x + rng.uniform(-1.1, 1.1), y + rng.uniform(-1.1, 1.1), z + rng.uniform(2.2, 3.2)), rng.uniform(1.7, 2.4), 1.3, rng, 5)


def agave(k, x: float, y: float, z: float) -> None:
    """An agave: a rosette of blue-grey blades, each a long thin triangle."""
    rng, b = k.rng, k.B["ct-agave"]
    blades, r = rng.randint(7, 9), rng.uniform(0.8, 1.3)
    for q in range(blades):
        a = q * math.tau / blades + rng.uniform(-0.2, 0.2)
        ca, sa = math.cos(a), math.sin(a)
        tip = (x + ca * r, y + sa * r, z + r * rng.uniform(0.5, 1.0))
        left, right = (x - sa * 0.16, y + ca * 0.16, z + 0.05), (x + sa * 0.16, y - ca * 0.16, z + 0.05)
        b.tri(left, right, tip)
        b.tri(right, left, tip)


def prickly_pear(k, x: float, y: float, z: float) -> None:
    """A prickly pear: flat green pads stacked on one another."""
    rng, b = k.rng, k.B["ct-pear"]
    for _ in range(rng.randint(4, 6)):
        a, up = rng.uniform(0, math.tau), rng.uniform(0.2, 1.5)
        cx, cy = x + rng.uniform(-0.6, 0.6), y + rng.uniform(-0.6, 0.6)
        ca, sa = math.cos(a) * 0.38, math.sin(a) * 0.38
        pad = ((cx - ca, cy - sa, z + up), (cx + ca, cy + sa, z + up), (cx + ca * 0.7, cy + sa * 0.7, z + up + 0.75), (cx - ca * 0.7, cy - sa * 0.7, z + up + 0.75))
        b.quad(*pad)
        b.quad(*reversed(pad))


def maquis(k) -> int:
    """Detail 8, Mediterranean scrub and olives: umbrella pines lean out over the parapet, agaves and prickly pears
    grow at its foot and along the bank, broom flowers yellow, and olives stand on the open hillside between the
    vineyards."""
    rng, B, s = k.rng, k.B, k.s
    planted = 0
    for i in range(6, k.n - 6):
        sea = seaward(k, i)
        if abs(s[i]["k"]) > 1 / 60:
            continue
        # The seaward verge, beyond the parapet.
        if rng.random() < 0.07:
            x, y, z = k.road.at(i, (k.kerb + rng.uniform(2.6, 4.2)) * sea)
            umbrella_pine(k, x, y, z - 0.5, s[i]["h"] + math.pi / 2 * sea + rng.uniform(-0.5, 0.5))
            planted += 1
        if rng.random() < 0.16:
            x, y, z = k.road.at(i, (k.kerb + rng.uniform(1.7, 2.6)) * sea, 0.0)
            (agave if rng.random() < 0.6 else prickly_pear)(k, x + rng.uniform(-1.5, 1.5), y + rng.uniform(-1.5, 1.5), z - 0.25)
            planted += 1
        # The hillside, where no vineyard is: olives, broom, scrub and the odd pine.
        if terrace_levels(k, i) == 0:
            for _ in range(2):
                off = -(k.kerb + rng.uniform(4.0, 44.0)) * sea
                x, y, _ = k.road.at(i, off)
                x, y = x + rng.uniform(-2.0, 2.0), y + rng.uniform(-2.0, 2.0)
                if not k.road.clear_of_road(x, y, 9.0, i):
                    continue
                z = k.ground(x, y, i, off)
                pick = rng.random()
                if pick < 0.3:
                    olive(k, x, y, z)
                elif pick < 0.5:
                    k.blob(B["ct-broom"], (x, y, z + 0.5), rng.uniform(0.6, 1.1))
                elif pick < 0.85:
                    k.blob(B["ct-maquis"], (x, y, z + 0.4), rng.uniform(0.8, 1.9))
                else:
                    umbrella_pine(k, x, y, z, rng.uniform(0, math.tau))
                planted += 1
    return planted


# A gozzo's paint: the hull, and the strake under its gunwale.
BOATS = ((0x2F6FB0, 0xF2EEE2), (0xF2EEE2, 0xC23A32), (0xC23A32, 0xF2EEE2), (0x2E8A6A, 0xF2C230), (0xF2EEE2, 0x2F6FB0), (0xE8B830, 0x2F6FB0))


def roadside_garden(k) -> dict:
    """Detail 8, Mediterranean scrub: what is planted rather than wild. On the open hillside between the vineyards
    and the villages, cypresses stand by the road in twos and threes, slim and near black, and oleander grows
    along the inland verge in mounds of dark leaf flowering pink, white or red."""
    near, rng, s = Painted(k, "ct-detail"), k.rng, k.s
    dark, tip = _lin(0x1F3A26), _lin(0x35583A)
    leaf = _lin(0x3E6A3A)
    flowers = (_lin(0xE8709A), _lin(0xF4EEF0), _lin(0xD0344A))
    sites = [site["i"] for site in village_sites(s)]
    cypresses = oleanders = 0
    for i in range(8, k.n - 8):
        if terrace_levels(k, i) or in_grove(k, i) or abs(s[i]["k"]) > 1 / 70 or any(abs(i - q) < 34 for q in sites):
            continue
        inland = -seaward(k, i)
        if rng.random() < 0.045:
            for q in range(rng.randint(2, 3)):
                off = (k.kerb + rng.uniform(4.6, 5.6)) * inland
                x, y, _ = k.P(i, q * 2.6, off)
                if not k.road.clear_of_road(x, y, 7.0, i):
                    continue
                z = k.ground(x, y, i, off)
                tall = rng.uniform(8.0, 12.5)
                near.tube((x, y, z - 0.6), 0.16, 0.16, 1.6, _lin(0x4A3A2A), _lin(0x4A3A2A), 5)
                near.tube((x, y, z + 0.8), 1.05, 0.55, tall * 0.55, dark, dark, 6)
                near.tube((x, y, z + 0.8 + tall * 0.55), 0.55, 0.05, tall * 0.45, dark, tip, 6)
                cypresses += 1
        elif rng.random() < 0.11:
            off = (k.kerb + rng.uniform(2.2, 3.2)) * inland
            x, y, _ = k.road.at(i, off)
            z = k.ground(x, y, i, off)
            r, bloom = rng.uniform(1.0, 1.5), flowers[rng.randrange(3)]
            near.tube((x, y, z - 0.3), r, r * 0.55, r * 1.5, leaf, leaf, 6, leaf)
            for q in range(6):
                a, up = q * math.tau / 6 + rng.uniform(0, 0.8), rng.uniform(0.5, 1.0)
                rr = r * (1 - 0.45 * up) * 0.95
                near.box((x + math.cos(a) * rr, y + math.sin(a) * rr, z - 0.3 + r * 1.5 * up - 0.15), (0.42, 0.42, 0.3), a, bloom, 0.8)
            oleanders += 1
    return {"cypresses": cypresses, "oleanders": oleanders}


def gozzo(paint, rng, c, yaw: float) -> None:
    """A Ligurian gozzo hauled out: a double-ended wooden boat about 5 m long, bright below and with a strake of
    another colour under the gunwale, thwarts across it, standing on its keel between chocks."""
    hull, strake = (_lin(h) for h in BOATS[rng.randrange(len(BOATS))])
    wood, dark = _lin(0x9A7448), _lin(0x4A3A2C)
    half, beam, deep = rng.uniform(2.3, 2.9), rng.uniform(0.8, 0.95), 0.85
    cs, sn = math.cos(yaw), math.sin(yaw)

    def at(a: float, out: float, up: float):
        return (c[0] + a * cs - out * sn, c[1] + a * sn + out * cs, c[2] + up)

    def face(points, colour, flip: bool = False) -> None:
        # One face, one winding: the build welds coincident faces, so a doubled face would lose a side.
        paint.face(points[::-1] if flip else points, ((*colour[:3], 1.0),) * len(points))

    stations = []
    for q in range(9):
        t = -1 + q / 4
        w = beam * (1 - abs(t) ** 2.6)
        sheer = deep + 0.3 * t * t
        stations.append((t * half, w, sheer))
    for (a0, w0, h0), (a1, w1, h1) in zip(stations, stations[1:]):
        for side in (1, -1):
            out = side > 0
            face([at(a0, 0, 0.0), at(a1, 0, 0.0), at(a1, w1 * 0.8 * side, 0.3), at(a0, w0 * 0.8 * side, 0.3)], tuple(c * 0.8 for c in hull), out)
            face([at(a0, w0 * 0.8 * side, 0.3), at(a1, w1 * 0.8 * side, 0.3), at(a1, w1 * side, h1 - 0.16), at(a0, w0 * side, h0 - 0.16)], hull, out)
            face([at(a0, w0 * side, h0 - 0.16), at(a1, w1 * side, h1 - 0.16), at(a1, w1 * side, h1), at(a0, w0 * side, h0)], strake, out)
            # The inside of the planking, seen over the far gunwale.
            face([at(a0, w0 * 0.84 * side, 0.34), at(a1, w1 * 0.84 * side, 0.34), at(a1, w1 * 0.97 * side, h1), at(a0, w0 * 0.97 * side, h0)], wood, not out)
        # The bottom boards, seen from above.
        face([at(a0, -w0 * 0.85, 0.34), at(a1, -w1 * 0.85, 0.34), at(a1, w1 * 0.85, 0.34), at(a0, w0 * 0.85, 0.34)], tuple(c * 0.8 for c in wood))
    # A thwart across every other station, and the stem and sternpost standing up past the sheer.
    for a, w, h in stations[2:7:2]:
        face([at(a - 0.13, -w, h - 0.2), at(a + 0.13, -w, h - 0.2), at(a + 0.13, w, h - 0.2), at(a - 0.13, w, h - 0.2)], dark)
    for end in (-1, 1):
        paint.box(at(end * (half - 0.04), 0, 0.0), (0.12, 0.1, deep + 0.62), yaw, strake)
    for a in (-half * 0.5, half * 0.5):
        for side in (1, -1):
            paint.box(at(a, 0.6 * side, 0.0), (0.25, 0.45, 0.3), yaw, dark)


NETS = (0x2F8F8A, 0xB8643A, 0x3F6FB8, 0xC9A24A)


def fishing_gear(k, paint, i: int) -> None:
    """What lies between the hauled-up boats: a net hung to dry between two poles, a stack of fish boxes or pots,
    and a few orange floats on the ground."""
    rng, s = k.rng, k.s
    x, y, z = k.road.at(i, -(k.kerb + 1.5) * seaward(k, i))
    rx, ry, _ = k.road.at(i, 0.0)
    d = math.hypot(rx - x, ry - y)
    out = ((rx - x) / d, (ry - y) / d)
    along = (-out[1], out[0])
    yaw = s[i]["h"]
    wood, float_c = _lin(0x6E5A40), _lin(0xE8622A)
    if rng.random() < 0.6:
        net = _lin(NETS[rng.randrange(len(NETS))])
        dark = tuple(v * 0.6 for v in net[:3]) + (1.0,)
        for e in (-1.7, 1.7):
            paint.box((x + along[0] * e, y + along[1] * e, z - 0.1), (0.1, 0.1, 2.3), yaw, wood, 1.0)
        corner = (x - along[0] * 1.7, y - along[1] * 1.7, 0.0)
        # It hangs in folds from a sagging line, longest in the middle, light and dark by turns.
        folds = 9
        for q in range(folds):
            t = (q + 0.5) / folds
            sag = math.sin(math.pi * t)
            paint.panel(corner, along, out, 0.1 + q * 3.2 / folds, 0.1 + (q + 1) * 3.2 / folds, z + 1.3 - 0.75 * sag + rng.uniform(-0.1, 0.1), z + 2.12 - 0.3 * sag, 0.02 + 0.04 * (q % 2), dark if q % 2 else net)
    else:
        for q in range(rng.randint(3, 5)):
            box = _lin((0x3F6FB8, 0xD9B46A, 0x7A8A6A)[q % 3])
            paint.box((x + along[0] * (q % 2 - 0.5) * 0.9, y + along[1] * (q % 2 - 0.5) * 0.9, z + (q // 2) * 0.36), (0.8, 0.55, 0.34), yaw + rng.uniform(-0.15, 0.15), box, 0.9)
    for q in range(rng.randint(2, 4)):
        e = rng.uniform(-1.6, 1.6)
        paint.box((x + along[0] * e + out[0] * 0.5, y + along[1] * e + out[1] * 0.5, z), (0.32, 0.32, 0.32), rng.uniform(0, 1.5), float_c, 0.8)


def boats(k) -> int:
    """Detail 7, fishing boats: by each village the gozzi are hauled up off the water and stand along the street,
    bow to stern on the inland side of the road, each in its own paint."""
    paint, near, rng = Painted(k), Painted(k, "ct-detail"), k.rng
    hauled = 0
    for site in village_sites(k.s):
        for step in range(-9, 10):
            i = site["i"] + step * 2
            if not 4 < i < k.n - 4 or abs(k.s[i]["k"]) > 1 / 80:
                continue
            if rng.random() < 0.3:
                # Between the boats, the fishermen's gear.
                fishing_gear(k, near, i)
                continue
            x, y, z = k.road.at(i, -(k.kerb + 1.2) * seaward(k, i))
            gozzo(paint, rng, (x, y, z + 0.02), k.s[i]["h"] + rng.uniform(-0.06, 0.06))
            hauled += 1
    return hauled


# Vernazza's castle and church, from the village's place on the road: across, out to sea, and the ground each keeps.
LANDMARKS = ((36.0, 66.0, 17.0), (-32.0, 56.0, 19.0), (-32.0, 40.0, 9.0))


def parish_place(k, site: dict) -> tuple[float, float]:
    """Where a village's parish church stands: on the seaward side of the road as a rider comes into the village."""
    j = max(site["i"] - 12, 2)
    x, y, _ = k.road.at(j, 27.0 * seaward(k, j))
    return x, y


def parishes(k) -> int:
    """Detail 6, Riomaggiore and Corniglia (and Monterosso and Manarola): each village has its parish church by
    the road where a rider comes in, as Vernazza has Santa Margherita. The nave stands on a footing of rock with
    a rose window in its gable; the bell tower beside it is banded in dark and pale stone, the Ligurian way, under
    a low pyramid of tiles. Each village's is its own colour."""
    paint, s = Painted(k), k.s
    dark, pale, tile, rock, glass = _lin(0x4A4A4E), _lin(0xE8E2D2), _lin(0xB5674A), _lin(0x7A705E), _lin(PANE)
    naves = {"Monterosso": 0xE8D8B0, "Corniglia": 0xD9C9A8, "Manarola": 0xE2C48E, "Riomaggiore": 0xE6B8A0}
    built = 0
    for site in village_sites(s):
        if site["name"] == "Vernazza":
            continue
        j = max(site["i"] - 12, 2)
        x, y = parish_place(k, site)
        yaw, z = s[j]["h"], s[j]["z"] - 2.5
        low = min(k.height_at(x + dx, y + dy) for dx in (-9, 9) for dy in (-9, 9))
        cs, sn = math.cos(yaw), math.sin(yaw)
        wall = _lin(naves[site["name"]])
        paint.box((x, y, min(low, z) - 3.0), (27.0, 13.0, z - min(low, z) + 3.2), yaw, rock, 0.55)
        paint.box((x, y, z), (20.0, 9.5, 9.0), yaw, wall, 0.8)
        paint.roof((x, y, z + 9.0), 20.0, 9.5, 2.8, yaw, tile)
        # The gable towards the oncoming rider: a door, and the rose window over it.
        out, along = (-cs, -sn), (-sn, cs)
        corner = (x + out[0] * 10.0 - along[0] * 4.75, y + out[1] * 10.0 - along[1] * 4.75, 0.0)
        for band in range(9):
            if band % 2:
                paint.panel(corner, along, out, 0.0, 9.5, z + band, z + band + 1.0, 0.03, dark)
        paint.panel(corner, along, out, 3.75, 5.75, z, z + 3.4, 0.07, _lin(0x5A3A26))
        paint.panel(corner, along, out, 3.65, 5.85, z + 5.2, z + 7.4, 0.07, pale)
        paint.panel(corner, along, out, 4.0, 5.5, z + 5.55, z + 7.05, 0.1, glass)
        # The campanile at the nave's far end, banded.
        bx, by = x + cs * 12.5, y + sn * 12.5
        for band in range(8):
            paint.box((bx, by, z + band * 3.0), (5.0, 5.0, 3.0), yaw, dark if band % 2 else pale, 0.9)
        for q in range(4):
            a = yaw + q * math.pi / 2
            o, al = (math.cos(a), math.sin(a)), (math.sin(a), -math.cos(a))
            c = (bx + o[0] * 2.5 - al[0] * 0.8, by + o[1] * 2.5 - al[1] * 0.8, 0.0)
            paint.panel(c, al, o, 0.0, 1.6, z + 20.0, z + 23.0, 0.05, glass)
        paint.tube((bx, by, z + 24.0), 3.9, 0.2, 4.2, tile, _lin(0xC9785A), 4, _lin(0xC9785A))
        built += 1
    return built


def piazza_ground(k, site: dict) -> list[tuple[float, float, float]]:
    """The ground the piazza keeps clear of houses, as LANDMARKS gives it: from the village's middle."""
    out = []
    for i in range(site["i"], site["i"] + 11, 2):
        x, y, _ = k.road.at(i, (k.kerb + 6.0) * seaward(k, i))
        out.append((x - site["x"], y - site["y"], 11.0))
    return out


def castle_place(k, site: dict) -> tuple[float, float]:
    """Where the Doria castle stands, from the village's middle: on the seaward side of the road just past it,
    close enough that no house row stands between it and the rider."""
    j = min(site["i"] + 13, k.n - 2)
    x, y, _ = k.road.at(j, 31.0 * seaward(k, j))
    return x - site["x"], y - site["y"]


def vernazza(k) -> bool:
    """Detail 5, Vernazza harbour: above the houses of the second village stand the round tower of the Doria castle
    on the spur's seaward end, on its square keep, and the church of Santa Margherita by the water with its
    octagonal bell tower under a small dome."""
    sites = village_sites(k.s)
    if len(sites) < 2:
        return False
    site, paint = sites[1], Painted(k)
    stone, pale, dark = _lin(0x9C9280), _lin(0xC4B9A0), _lin(0x6E6656)
    ochre, cream, tile = _lin(0xD9B46A), _lin(0xE8D8B0), _lin(0xB5674A)

    def ground(x: float, y: float) -> float:
        return max(k.height_at(x, y), 2.0)

    # The castle: a keep with a crenellated wall, and the round tower rising out of it.
    x, y = (site[q] + o for q, o in zip("xy", castle_place(k, site)))
    low = max(ground(x + dx, y + dy) for dx in (-8, 8) for dy in (-8, 8))
    # It stands on its crag, the keep's wall-walk level with the road, so the tower clears the roofs between.
    z = max(low, k.s[site["i"] + 13]["z"] - 4.0)
    if z - 14.0 > low - 3.0:
        rock = _lin(0x7A705E)
        paint.box((x, y, low - 4.0), (27.0, 23.0, z - 14.0 - low + 4.5), 0.1, rock, 0.55)
        paint.box((x + 3.0, y - 2.0, low - 4.0), (33.0, 28.0, (z - 14.0 - low) * 0.5 + 4.0), 0.5, _lin(0x6A6252), 0.5)
    paint.box((x, y, z - 14.0), (20.0, 17.0, 20.0), 0.3, stone, 0.6)
    for q in range(12):
        a = q * math.tau / 12
        paint.box((x + math.cos(a + 0.3) * 9.0, y + math.sin(a + 0.3) * 7.6, z + 6.0), (1.5, 1.5, 1.3), a + 0.3, pale, 0.9)
    paint.tube((x - 2.0, y + 1.0, z + 6.0), 4.6, 4.1, 17.0, stone, pale, 12, dark)
    for q in range(8):
        a = q * math.tau / 8
        paint.box((x - 2.0 + math.cos(a) * 3.9, y + 1.0 + math.sin(a) * 3.9, z + 23.0), (1.1, 1.1, 1.2), a, pale, 0.9)
    # The church: a long nave end-on to the sea, and the bell tower at its landward end.
    x, y = site["x"] - 32.0, site["y"] + 56.0
    z = max(ground(x + dx, y + dy) for dx in (-6, 6) for dy in (-12, 12))
    yaw = math.pi / 2 + 0.12
    paint.box((x, y, z - 12.0), (25.0, 11.0, 23.0), yaw, cream, 0.6)
    paint.roof((x, y, z + 11.0), 25.0, 11.0, 3.2, yaw, tile)
    bx, by = x + math.cos(yaw) * -15.0, y + math.sin(yaw) * -15.0
    paint.box((bx, by, z - 12.0), (6.0, 6.0, 34.0), yaw, ochre, 0.6)
    paint.tube((bx, by, z + 22.0), 3.3, 3.3, 7.0, ochre, cream, 8)
    for q in range(8):
        # The belfry's openings, dark between its piers.
        a = (q + 0.5) * math.tau / 8
        out, along = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
        corner = (bx + out[0] * 3.05 - along[0] * 0.7, by + out[1] * 3.05 - along[1] * 0.7, 0.0)
        paint.panel(corner, along, out, 0.0, 1.4, z + 23.5, z + 27.5, 0.08, _lin(PANE))
    paint.tube((bx, by, z + 29.0), 3.5, 2.2, 1.6, tile, tile, 8)
    paint.tube((bx, by, z + 30.6), 2.2, 0.0, 2.6, tile, _lin(0xC9785A), 8)
    return True


PARASOLS = (0xF2C230, 0xD9483A, 0xF6F2E6, 0x2F7FB8, 0xE8853A)


def piazza(k) -> int:
    """Detail 5, Vernazza harbour: the piazza. On the seaward side of the road before the castle a paved terrace
    stands out over the houses below, behind its own low wall, set with café tables under parasols, each a
    different colour, and a few people at them."""
    sites = village_sites(k.s)
    if len(sites) < 2:
        return 0
    paint, rng, s = Painted(k), k.rng, k.s
    site = sites[1]
    paving, wall, pole, table = _lin(0xC9BFA8), _lin(0x978E79), _lin(0xE8E4DA), _lin(0x6A4A30)
    set_out = 0
    for i in range(site["i"] + 1, site["i"] + 10):
        if abs(s[i]["k"]) > 1 / 70:
            continue
        sea, yaw = seaward(k, i), s[i]["h"]
        x, y, z = k.road.at(i, (k.kerb + 5.6) * sea)
        # The terrace's slab, and the wall along its outer edge.
        paint.box((x, y, z - 6.0), (k.step + 0.1, 8.4, 6.12), yaw, paving, 0.6)
        ox, oy, _ = k.road.at(i, (k.kerb + 9.7) * sea)
        paint.box((ox, oy, z + 0.1), (k.step + 0.1, 0.4, 0.95), yaw, wall, 0.9)
        if i % 2:
            continue
        for off in (3.6, 7.4):
            px, py, _ = k.road.at(i, (k.kerb + off + rng.uniform(-0.4, 0.4)) * sea)
            colour = _lin(PARASOLS[rng.randrange(len(PARASOLS))])
            paint.box((px, py, z + 0.1), (0.07, 0.07, 2.5), yaw, pole, 1.0)
            paint.tube((px, py, z + 2.15), 1.65, 0.08, 0.7, colour, tuple(v * 0.8 for v in colour[:3]) + (1.0,), 8)
            paint.box((px + 0.5, py + 0.3, z + 0.1), (0.8, 0.8, 0.74), yaw + 0.4, table, 0.9)
            if rng.random() < 0.6:
                hiker(paint, rng, (px - 0.6, py - 0.5, z + 0.12), rng.uniform(0, math.tau), False)
            set_out += 1
    return set_out


APES = (0x8FC1D8, 0x6FA06A, 0xF2EEE2, 0xD9B46A, 0xC8553A)
PRODUCE = (0xF2D23A, 0xE8742E, 0xC8322C, 0x6FA03A, 0x7A3A6A)


def street_life(k) -> dict:
    """Details 1 and 6, the villages: what goes on in the street. Between the boats on the inland pavement stand
    an Ape here and there, the three-wheeled van of every Ligurian village, its bed loaded with crates; a
    greengrocer's stall under a striped awning against a house wall; pots of flowers by the doors; and people,
    in ones and twos."""
    near, rng, s = Painted(k, "ct-detail"), k.rng, k.s
    dark, wood, white, red, pot = _lin(0x1E1E22), _lin(0x7A5A3A), _lin(0xF4F2EA), _lin(0xC8322C), _lin(0xB5674A)
    apes = stalls = people = 0
    for site in village_sites(s):
        for step in range(-8, 9):
            i = site["i"] + step * 2 + 1
            if not 4 < i < k.n - 4 or abs(s[i]["k"]) > 1 / 80:
                continue
            inland, yaw = -seaward(k, i), s[i]["h"]
            cs, sn = math.cos(yaw), math.sin(yaw)
            x, y, z = k.road.at(i, (k.kerb + 1.35) * inland)
            pick = rng.random()
            if pick < 0.16:
                # An Ape: the cab, the bed and its load, three small wheels.
                paint_c = _lin(APES[rng.randrange(len(APES))])
                near.box((x + cs * 0.75, y + sn * 0.75, z + 0.28), (1.15, 1.2, 1.3), yaw, paint_c, 0.85)
                near.box((x + cs * 0.9, y + sn * 0.9, z + 0.95), (0.7, 1.22, 0.5), yaw, _lin(0x2E3B44), 1.0)
                near.box((x - cs * 0.65, y - sn * 0.65, z + 0.42), (1.6, 1.25, 0.42), yaw, paint_c, 0.9)
                for q in range(3):
                    near.box((x - cs * (0.15 + q * 0.5), y - sn * (0.15 + q * 0.5), z + 0.84), (0.44, 0.9, 0.3), yaw, _lin(PRODUCE[rng.randrange(len(PRODUCE))]), 0.9)
                for fwd, left in ((1.1, 0.0), (-0.95, 0.52), (-0.95, -0.52)):
                    near.box((x + cs * fwd - sn * left, y + sn * fwd + cs * left, z), (0.4, 0.14, 0.4), yaw, dark, 1.0)
                apes += 1
            elif pick < 0.28:
                # The greengrocer's stall, against the wall behind the pavement.
                bx, by, _ = k.road.at(i, (k.kerb + 1.75) * inland)
                near.box((bx, by, z), (2.4, 0.85, 0.8), yaw, wood, 0.9)
                for q in range(5):
                    e = -0.96 + q * 0.48
                    near.box((bx + cs * e, by + sn * e, z + 0.8), (0.42, 0.7, 0.22), yaw, _lin(PRODUCE[q % len(PRODUCE)]), 0.85)
                for q in range(4):
                    e = -1.05 + q * 0.7
                    near.box((bx + cs * e, by + sn * e, z + 2.15), (0.7, 1.5, 0.07), yaw, red if q % 2 else white, 1.0)
                for e in (-1.3, 1.3):
                    fx, fy, _ = k.road.at(i, (k.kerb + 1.1) * inland)
                    near.box((fx + cs * e, fy + sn * e, z), (0.06, 0.06, 2.15), yaw, white, 1.0)
                stalls += 1
            elif pick < 0.5:
                for q in range(rng.randint(1, 2)):
                    hiker(near, rng, (x + cs * q * 0.8, y + sn * q * 0.8, z + 0.02), yaw + rng.uniform(-1.6, 1.6), rng.random() < 0.4)
                    people += 1
            elif pick < 0.75:
                # Pots by a door: terracotta, and what grows in them.
                bx, by, _ = k.road.at(i, (k.kerb + 1.95) * inland)
                for q in range(rng.randint(2, 3)):
                    e = (q - 1) * 0.7
                    near.box((bx + cs * e, by + sn * e, z), (0.42, 0.42, 0.45), yaw, pot, 0.85)
                    near.box((bx + cs * e, by + sn * e, z + 0.45), (0.6, 0.6, rng.uniform(0.35, 0.9)), yaw + 0.5, _lin(rng.choice((0x3F7A32, 0xD8342E, 0xE0527A, 0x5C8A38))), 0.75)
    return {"apes": apes, "stalls": stalls, "villagers": people}


def vendemmia(k) -> dict:
    """Detail 4, terraced vineyards: the harvest. It is early autumn, so here and there along the terraces people
    are picking: two or three at the edge of the first or second step, crates of grapes, purple and green,
    stacked on the wall's edge beside them, and at each row's end the chestnut post the wires run from."""
    near, rng, s = Painted(k, "ct-detail"), k.rng, k.s
    crate, post = _lin(0xD9B46A), _lin(0x6A4A30)
    grapes = (_lin(0x5A2E6A), _lin(0x9AB83A), _lin(0x7A3A7A))
    pickers = crates = 0
    for i in range(30, k.n - 30, 61):
        i += rng.randrange(12)
        if min(terrace_levels(k, q) for q in range(i - 1, i + 5)) < 2 or in_grove(k, i) or any(abs(s[q]["k"]) > 1 / 120 for q in range(i - 2, i + 5)):
            continue
        inland, level = -seaward(k, i), 0  # the first step: a higher one is out of sight from the road
        front = k.kerb + TERRACE_FOOT + level * TERRACE_DEPTH
        up = (level + 1) * TERRACE_RISE
        if not k.room(i, (front + TERRACE_DEPTH) * inland, 12.0):
            continue
        for q in range(rng.randint(2, 3)):
            # At the wall's edge, where a rider below can see them: further back the step hides them.
            x, y, z = k.P(i, -2.0 - q * rng.uniform(1.6, 2.6), (front + 0.45) * inland, up)
            hiker(near, rng, (x, y, z + 0.02), s[i]["h"] + inland * math.pi / 2 + rng.uniform(-0.5, 0.5), False)
            pickers += 1
        # The crates on the wall's edge, where they are carried down from.
        for q in range(rng.randint(3, 5)):
            x, y, z = k.P(i, 1.0 + (q % 3) * 0.75, (front + 0.5) * inland, up + (q // 3) * 0.34)
            near.box((x, y, z), (0.62, 0.42, 0.3), s[i]["h"], crate, 0.9)
            near.box((x, y, z + 0.3), (0.54, 0.34, 0.1), s[i]["h"], grapes[rng.randrange(3)], 1.0)
            crates += 1
        for row in (0.3, 0.68):
            for q in (i - 1, i + 4):
                x, y, z = k.road.at(q, (front + TERRACE_DEPTH * row) * inland, up)
                near.box((x, y, z - 0.05), (0.1, 0.1, 1.6), s[q]["h"], post, 1.0)
    return {"pickers": pickers, "grapeCrates": crates}


def vineyard_works(k) -> dict:
    """Detail 4, terraced vineyards: what the growers built to work them. On the first terrace now and then stands
    a casotto, a tool hut of the same dry stone under a single pitch of tiles; and here and there a trenino, the
    vineyard monorail, climbs straight up the steps on its posts, with its little red tractor and crate car parked
    somewhere along it."""
    paint, rng, s = Painted(k), k.rng, k.s
    stone, tile, door = _lin(0x8E8570), _lin(0xB5674A), _lin(0x3A2E24)
    steel, red, crate = _lin(0x7A7E82), _lin(0xC8322C), _lin(0xD9B46A)
    huts = rails = 0
    for i in range(20, k.n - 20, 14):
        i += rng.randrange(8)
        side = -seaward(k, i)
        levels = min(terrace_levels(k, q) for q in range(i - 2, i + 4))
        back = k.kerb + TERRACE_FOOT + levels * TERRACE_DEPTH
        if levels < 3 or any(abs(s[q]["k"]) > 1 / 120 for q in range(i - 3, i + 4)) or not k.room(i, back * side, 12.0):
            continue
        yaw = s[i]["h"]
        if rng.random() < 0.2:
            x, y, z = k.road.at(i, (k.kerb + TERRACE_FOOT + 3.6) * side, TERRACE_RISE)
            paint.box((x, y, z - 0.1), (3.4, 2.8, 2.3), yaw, stone, 0.75)
            # The roof falls towards the road; the door faces it.
            out = (-math.sin(yaw) * -side, math.cos(yaw) * -side)
            along = (math.cos(yaw), math.sin(yaw))
            lo = [(x + along[0] * a + out[0] * 1.7, y + along[1] * a + out[1] * 1.7, z + 2.2) for a in (-1.95, 1.95)]
            hi = [(x + along[0] * a - out[0] * 1.6, y + along[1] * a - out[1] * 1.6, z + 2.95) for a in (-1.95, 1.95)]
            roof = (lo[0], lo[1], hi[1], hi[0])
            paint.face(roof if side < 0 else roof[::-1], (tile,) * 4)
            corner = (x - along[0] * 0.45 + out[0] * 1.4, y - along[1] * 0.45 + out[1] * 1.4, 0.0)
            paint.panel(corner, along if side > 0 else (-along[0], -along[1]), out, 0.0 if side > 0 else -0.9, 0.9 if side > 0 else 0.0, z, z + 1.8, 0.04, door)
            huts += 1
        elif rng.random() < 0.45:
            # The rail: steeply up the first wall from the shoulder, then one straight run half a metre clear of
            # every step's edge, a square steel beam on a post every two metres.
            fwd = (math.cos(yaw) * 0.07, math.sin(yaw) * 0.07)
            run = levels * TERRACE_DEPTH

            def beam(a, b) -> None:
                for sign in (1, -1):
                    q0, q1 = (a[0] + fwd[0] * sign, a[1] + fwd[1] * sign, a[2] + 0.07), (b[0] + fwd[0] * sign, b[1] + fwd[1] * sign, b[2] + 0.07)
                    r0, r1 = (q0[0], q0[1], q0[2] - 0.14), (q1[0], q1[1], q1[2] - 0.14)
                    face = (q0, q1, r1, r0)
                    paint.face(face if sign * side < 0 else face[::-1], ((steel[0] * 0.6, steel[1] * 0.6, steel[2] * 0.6, 1.0),) * 4)
                top = [(p[0] + fwd[0] * sg, p[1] + fwd[1] * sg, p[2] + 0.07) for p, sg in ((a, -1), (a, 1), (b, 1), (b, -1))]
                paint.face(top if side > 0 else top[::-1], (steel,) * 4)

            foot = k.road.at(i, (k.kerb + 1.5) * side, 0.5)
            lip = k.road.at(i, (k.kerb + TERRACE_FOOT) * side, TERRACE_RISE + 0.5)
            head = k.road.at(i, back * side, (levels + 1) * TERRACE_RISE + 0.5)
            beam(foot, lip)
            beam(lip, head)
            x, y, z = k.road.at(i, (k.kerb + 1.5) * side, 0.0)
            paint.box((x, y, z - 0.2), (0.07, 0.07, 0.7), yaw, steel, 0.8)
            for q in range(int(run / 2.0)):
                t = (q + 0.5) * 2.0 / run
                x, y, z = k.road.at(i, (k.kerb + TERRACE_FOOT + run * t) * side, 0.0)
                tread = z + (int(run * t / TERRACE_DEPTH) + 1) * TERRACE_RISE
                paint.box((x, y, tread - 0.1), (0.07, 0.07, lip[2] + (head[2] - lip[2]) * t - tread + 0.1), yaw, steel, 0.8)
            # The tractor and its crate car, parked part of the way up.
            t = rng.uniform(0.1, 0.8)
            cx, cy, cz = (lip[q] + (head[q] - lip[q]) * t for q in range(3))
            ux, uy = (head[0] - lip[0]) / run, (head[1] - lip[1]) / run
            paint.box((cx, cy, cz + 0.07), (0.7, 1.1, 0.8), yaw, red, 0.8)
            paint.box((cx - ux * 1.6, cy - uy * 1.6, cz + 0.07 - 1.6 * (head[2] - lip[2]) / run), (0.8, 1.6, 0.6), yaw, crate, 0.8)
            rails += 1
    return {"huts": huts, "monorails": rails}


def sea_rocks(k) -> dict:
    """Detail 2, the Ligurian Sea below: the water is not empty to the horizon. Off each headland stand a few
    stacks of dark rock with white water round their feet, and off two of them an islet under scrub with a white
    lighthouse on it, its lantern red. Drawn whole from any distance, as the boats are."""
    paint, rng, s = Painted(k, "peaks"), k.rng, k.s
    xs, ys = [p["x"] for p in s], [p["y"] for p in s]
    shore = max(ys) + SPUR_REACH
    haze, sea = _lin(THEME["haze"]), _lin(THEME["palette"]["sea"])
    rock, pale, scrub, white, red, foam = _lin(0x5E564A), _lin(0x8E8472), _lin(0x5C7A44), _lin(0xF4F2EA), _lin(0xC8322C), _lin(0xE6F0F2)

    def far(colour, out: float):
        t = 0.45 * _smooth(500.0, 2600.0, out)
        return (*(colour[q] + (haze[q] - colour[q]) * t for q in range(3)), 1.0)

    def surf(x: float, y: float, r: float, out: float, sides: int = 8) -> None:
        inner = [(x + math.cos(q * math.tau / sides) * r, y + math.sin(q * math.tau / sides) * r, 0.3) for q in range(sides)]
        outer = [(x + math.cos(q * math.tau / sides) * r * 1.5, y + math.sin(q * math.tau / sides) * r * 1.5, 0.3) for q in range(sides)]
        edge = far(tuple(foam[c] * 0.35 + sea[c] * 0.65 for c in range(3)), out)
        for q in range(sides):
            n = (q + 1) % sides
            paint.face((inner[q], outer[q], outer[n], inner[n]), (far(foam, out), edge, edge, far(foam, out)))

    stacks = islets = 0
    span = max(xs) - min(xs)
    for q in range(11):
        x, out = min(xs) + span * (q + rng.uniform(0.2, 0.8)) / 11, rng.uniform(150.0, 520.0)
        y = shore + out
        if q in (3, 8):
            # The islet and its light.
            out += 380.0
            y = shore + out
            paint.tube((x, y, -2.0), 46.0, 30.0, 13.0, far(rock, out), far(pale, out), 9)
            paint.tube((x, y, 11.0), 30.0, 9.0, 8.0, far(scrub, out), far(scrub, out), 9, far(scrub, out))
            paint.tube((x + 6.0, y - 4.0, 15.0), 2.1, 1.6, 15.0, far(white, out), far(white, out), 8)
            paint.tube((x + 6.0, y - 4.0, 30.0), 2.3, 0.3, 3.2, far(red, out), far(red, out), 8, far(red, out))
            surf(x, y, 47.0, out, 9)
            islets += 1
            continue
        for _ in range(rng.randint(1, 3)):
            sx, sy, r, tall = x + rng.uniform(-45.0, 45.0), y + rng.uniform(-30.0, 30.0), rng.uniform(5.0, 13.0), rng.uniform(7.0, 24.0)
            paint.tube((sx, sy, -1.0), r, r * rng.uniform(0.25, 0.5), tall, far(rock, out), far(pale, out), 6, far(pale, out))
            surf(sx, sy, r * 1.05, out, 6)
            stacks += 1
    return {"seaStacks": stacks, "islets": islets}


def on_the_water(k) -> int:
    """Detail 2, the Ligurian Sea below: the water a rider sees is the water far out, over the parapet, so that is
    where the boats are. The ferries that run between the five villages, white with a blue band, trail long wakes
    along the coast; yachts stand out to sea under white sails; and small fishing boats lie nearer in. They are
    drawn whole from any distance, paler the further out."""
    paint, rng, s = Painted(k, "peaks"), k.rng, k.s
    xs, ys = [p["x"] for p in s], [p["y"] for p in s]
    shore = max(ys) + SPUR_REACH
    haze = _lin(THEME["haze"])
    white, blue, foam, hull = _lin(0xF6F6F2), _lin(0x2F5FA8), _lin(0xDCEAF0), _lin(0x3A4A5A)

    def far(colour, out: float):
        t = 0.55 * _smooth(400.0, 2600.0, out)
        return (*(colour[q] + (haze[q] - colour[q]) * t for q in range(3)), 1.0)

    def slab(c, yaw: float, size, colour, out: float) -> None:
        paint.box(c, size, yaw, far(colour, out), 0.85)

    afloat = 0
    for q in range(34):
        x, out = rng.uniform(min(xs) - 400.0, max(xs) + 400.0), rng.uniform(260.0, 2400.0)
        y = shore + out
        kind = rng.random()
        if kind < 0.24:
            # A ferry along the coast, and its wake behind it.
            yaw = 0.0 if rng.random() < 0.5 else math.pi
            cs = math.cos(yaw)
            slab((x, y, 0.0), yaw, (30.0, 7.5, 3.0), white, out)
            slab((x, y, 3.0), yaw, (30.2, 7.7, 0.7), blue, out)
            slab((x - cs * 2.0, y, 3.7), yaw, (20.0, 6.5, 2.6), white, out)
            slab((x - cs * 5.0, y, 6.3), yaw, (7.0, 5.0, 2.2), white, out)
            tail, wide = x - cs * 15.0, 3.0
            end = (x - cs * rng.uniform(260.0, 420.0), 16.0)
            wake = [(tail, y - wide, 0.25), (tail, y + wide, 0.25), (end[0], y + end[1], 0.25), (end[0], y - end[1], 0.25)]
            paint.face(wake if cs < 0 else wake[::-1], (far(foam, out),) * 2 + (far(_lin(0x8FB4C8), out),) * 2)
        elif kind < 0.62:
            # A yacht: a slim hull, a mainsail and a jib.
            yaw = rng.uniform(0, math.tau)
            cs, sn = math.cos(yaw), math.sin(yaw)
            long_, tall = rng.uniform(9.0, 15.0), rng.uniform(13.0, 20.0)
            slab((x, y, 0.0), yaw, (long_, 3.0, 1.3), white, out)
            mast = (x + cs * long_ * 0.1, y + sn * long_ * 0.1)
            for sail in ([(mast[0], mast[1], 1.6), (mast[0] - cs * long_ * 0.5, mast[1] - sn * long_ * 0.5, 2.2), (mast[0], mast[1], tall)], [(mast[0] + cs * 0.3, mast[1] + sn * 0.3, 1.8), (mast[0] + cs * long_ * 0.42, mast[1] + sn * long_ * 0.42, 1.6), (mast[0] + cs * 0.3, mast[1] + sn * 0.3, tall * 0.86)]):
                paint.face(sail, (far(white, out),) * 3)
                paint.face([(p[0] + sn * 0.05, p[1] - cs * 0.05, p[2]) for p in sail][::-1], (far(_lin(0xDADAD4), out),) * 3)
        else:
            # A fishing boat: a dark hull and a small white wheelhouse.
            yaw = rng.uniform(0, math.tau)
            slab((x, y, 0.0), yaw, (8.0, 3.0, 1.4), rng.choice((hull, blue, _lin(0xA8322C))), out)
            slab((x - math.cos(yaw) * 1.6, y - math.sin(yaw) * 1.6, 1.4), yaw, (2.4, 2.2, 1.8), white, out)
        afloat += 1
    return afloat


def road_furniture(k) -> dict:
    """Detail 3, the corniche road: what stands along a Ligurian provincial road. A white kilometre stone with a
    red cap every 500 m on the inland shoulder; a wayside shrine every couple of kilometres, a little stone house
    with a blue niche and a tiled roof; and at each hairpin a round traffic mirror on a red-and-white pole,
    looking back down the road."""
    paint, s = Painted(k), k.s
    white, red, stone, blue, tile, glass = _lin(0xF2F0E8), _lin(0xC8322C), _lin(0x9C9280), _lin(0x3F6FB8), _lin(0xB5674A), _lin(0xBFD4E2)
    sites = [site["i"] for site in village_sites(s)]
    stones = shrines = mirrors = 0

    def quiet(i: int) -> bool:
        return 8 < i < k.n - 8 and abs(s[i]["k"]) < 1 / 80 and all(abs(i - v) > 24 for v in sites)

    for metres in range(500, int(s[-1]["d"]), 500):
        i = min(range(k.n), key=lambda q: abs(s[q]["d"] - metres))
        if not quiet(i):
            continue
        inland, yaw = -seaward(k, i), s[i]["h"]
        x, y, z = k.road.at(i, (k.kerb + 0.75) * inland)
        paint.box((x, y, z - 0.1), (0.3, 0.42, 0.72), yaw, white, 0.85)
        paint.box((x, y, z + 0.62), (0.31, 0.43, 0.2), yaw, red, 1.0)
        stones += 1
        if metres % 2000 == 1000:
            # The shrine, a few metres on, its niche open to the road.
            j = i + 3
            x, y, z = k.road.at(j, (k.kerb + 1.5) * inland)
            yaw = s[j]["h"]
            paint.box((x, y, z - 0.1), (1.1, 0.8, 1.9), yaw, stone, 0.8)
            paint.roof((x, y, z + 1.8), 1.1, 0.8, 0.45, yaw, tile)
            out = (math.sin(yaw) * inland, -math.cos(yaw) * inland)
            along = (-out[1], out[0])
            corner = (x + out[0] * 0.4 - along[0] * 0.3, y + out[1] * 0.4 - along[1] * 0.3, 0.0)
            paint.panel(corner, along, out, 0.0, 0.6, z + 0.85, z + 1.6, 0.03, blue)
            paint.panel(corner, along, out, 0.22, 0.38, z + 0.9, z + 1.35, 0.06, white)
            shrines += 1
    # A mirror where each hairpin begins, on the outside of the bend.
    turning = False
    for i in range(10, k.n - 10):
        tight = abs(s[i]["k"]) > 1 / 40
        if tight and not turning:
            outside = -1 if s[i]["k"] > 0 else 1
            j = i + 6
            x, y, z = k.road.at(j, (k.kerb + 0.45) * outside)
            h = s[i - 4]["h"]
            for band in range(5):
                paint.box((x, y, z - 0.1 + band * 0.5), (0.09, 0.09, 0.5), h, red if band % 2 else white, 1.0)
            out, along = (-math.cos(h), -math.sin(h)), (math.sin(h), -math.cos(h))
            ring = [(x + out[0] * 0.08 + along[0] * math.cos(q * math.tau / 10) * r, y + out[1] * 0.08 + along[1] * math.cos(q * math.tau / 10) * r, z + 2.75 + math.sin(q * math.tau / 10) * r) for r in (0.42, 0.34) for q in range(10)]
            centre = (x + out[0] * 0.1, y + out[1] * 0.1, z + 2.75)
            for q in range(10):
                n = (q + 1) % 10
                paint.face((ring[q], ring[n], ring[10 + n], ring[10 + q]), (red,) * 4)
                paint.face((ring[10 + q], ring[10 + n], centre), (glass, glass, white))
            mirrors += 1
        turning = tight
    return {"kmStones": stones, "shrines": shrines, "mirrors": mirrors}


SHIRTS = (0xD9483A, 0x2F7FC4, 0xF0B429, 0x3E9A62, 0xF2EEE2, 0xE8762C, 0x7A4FB0, 0x25A0A0)
SKIN = (0xE8B48C, 0xC88A5E, 0x8A5A3C, 0xF0C8A4)


def hiker(paint, rng, c, yaw: float, gear: bool = True) -> None:
    """A walker on the path: boots and shorts, a bright shirt, a rucksack, a sun hat and a pair of poles. Without
    `gear`, somebody at work or at a table: no rucksack and no poles."""
    cs, sn = math.cos(yaw), math.sin(yaw)
    h = rng.uniform(0.92, 1.08)
    shirt, pack = _lin(SHIRTS[rng.randrange(len(SHIRTS))]), _lin(SHIRTS[rng.randrange(len(SHIRTS))])
    skin, shorts, hat = _lin(SKIN[rng.randrange(len(SKIN))]), _lin(rng.choice((0x3A4048, 0x6A6A52, 0x2A3A5A))), _lin(rng.choice((0xE8DCC0, 0xF2EEE2, 0x8A7A5A)))

    def at(fwd: float, left: float, up: float):
        return (c[0] + fwd * cs - left * sn, c[1] + fwd * sn + left * cs, c[2] + up * h)

    stride = rng.uniform(0.12, 0.26)
    for side in (1, -1):
        paint.box(at(stride * side, 0.1 * side, 0.0), (0.16, 0.14, 0.46 * h), yaw, skin, 0.35)
        paint.box(at(stride * side * 0.5, 0.1 * side, 0.46), (0.2, 0.17, 0.4 * h), yaw, shorts, 1.0)
        paint.box(at(-stride * side * 0.6, 0.27 * side, 0.86), (0.11, 0.1, 0.54 * h), yaw, skin, 1.0)
        if gear:
            # A pole, planted a little ahead.
            paint.box(at(0.32 - stride * side, 0.36 * side, 0.0), (0.03, 0.03, 1.05 * h), yaw, _lin(0x2A2A2E), 1.0)
    paint.box(at(0, 0, 0.84), (0.24, 0.42, 0.58 * h), yaw, shirt, 0.85)
    if gear:
        paint.box(at(-0.2, 0, 0.9), (0.2, 0.34, 0.52 * h), yaw, pack, 0.8)
    paint.box(at(0, 0, 1.44), (0.21, 0.2, 0.24 * h), yaw, skin, 1.0)
    paint.box(at(0, 0, 1.66), (0.36, 0.36, 0.05), yaw, hat, 1.0)


def footpath(k) -> dict:
    """Detail 9, the coastal footpath and its hikers: about every 900 m the Sentiero Azzurro meets the road. A
    flight of stone steps climbs the first terrace wall, a wooden fingerpost with red-and-white boards stands at
    its foot, and walkers come and go along the inland side of the road in twos and threes."""
    paint, rng, s = Painted(k), k.rng, k.s
    stone, tread, wood, white, red = _lin(0x978E79), _lin(0xB4AB96), _lin(0x7A5A3A), _lin(0xF2EEE2), _lin(0xC8322C)
    sites = [site["i"] for site in village_sites(s)]
    crossings = walkers = 0

    def clear(i: int) -> bool:
        return 12 < i < k.n - 12 and all(abs(s[q]["k"]) < 1 / 90 for q in range(i - 8, i + 9)) and all(abs(i - v) > 30 for v in sites)

    def party(i: int, size: int) -> int:
        inland, yaw = -seaward(k, i), s[i]["h"] + (math.pi if rng.random() < 0.5 else 0.0)
        for q in range(size):
            x, y, z = k.P(i, q * rng.uniform(1.1, 1.9), (k.kerb + rng.uniform(0.7, 1.5)) * inland)
            hiker(paint, rng, (x, y, z + 0.02), yaw + rng.uniform(-0.12, 0.12))
        return size

    for i in range(100, k.n - 40, 225):
        while i < k.n - 40 and not clear(i):
            i += 9
        if i >= k.n - 40:
            continue
        inland, yaw = -seaward(k, i), s[i]["h"]
        if terrace_levels(k, i) and terrace_levels(k, i + 2):
            # Ten steps up the face of the first wall, a metre wide, each a block standing on the shoulder.
            for step in range(10):
                x, y, z = k.P(i, step * 0.5, (k.kerb + TERRACE_FOOT - 0.55) * inland)
                paint.box((x, y, z - 0.2), (0.5, 1.1, 0.2 + (step + 1) * TERRACE_RISE / 10), yaw, tread if step % 2 else stone, 0.8)
            # Above the steps the path runs on along the top of the wall behind a chestnut handrail, with the
            # trail's red-and-white blaze painted on the wall, and walkers on it.
            front = (k.kerb + TERRACE_FOOT + 0.3) * inland
            run = 0
            for q in range(i + 3, min(i + 29, k.n - 3)):
                if not (terrace_levels(k, q) and terrace_levels(k, q + 1)) or abs(s[q]["k"]) > 1 / 90 or in_grove(k, q):
                    break
                a, b = k.road.at(q, front, TERRACE_RISE), k.road.at(q + 1, front, TERRACE_RISE)
                paint.box((a[0], a[1], a[2] - 0.05), (0.1, 0.1, 1.1), s[q]["h"], wood, 1.0)
                span, h = math.hypot(b[0] - a[0], b[1] - a[1]), math.atan2(b[1] - a[1], b[0] - a[0])
                for up in (0.55, 0.98):
                    paint.box(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + up), (span, 0.07, 0.08), h, wood, 1.0)
                run += 1
            if run > 8:
                for q in (i + 7, i + 8, i + 17):
                    if q < i + 3 + run - 1:
                        x, y, z = k.road.at(q, (k.kerb + TERRACE_FOOT + 1.1) * inland, TERRACE_RISE)
                        hiker(paint, rng, (x, y, z + 0.02), s[q]["h"] + (math.pi if q % 2 else 0.0))
                        walkers += 1
            x, y, z = k.road.at(i - 1, (k.kerb + TERRACE_FOOT - 0.04) * inland, 1.25)
            paint.box((x, y, z), (0.55, 0.06, 0.16), yaw, white, 1.0)
            paint.box((x, y, z - 0.16), (0.55, 0.06, 0.16), yaw, red, 1.0)
        # The fingerpost, with a board each way.
        x, y, z = k.P(i, -1.2, (k.kerb + 1.7) * inland)
        paint.box((x, y, z - 0.2), (0.11, 0.11, 2.5), yaw, wood, 0.8)
        for up, turn in ((1.95, 0.0), (1.68, math.pi)):
            reach = 0.5 * (1 if turn == 0.0 else -1)
            bx, by = x + math.cos(yaw) * reach, y + math.sin(yaw) * reach
            paint.box((bx, by, z + up), (0.9, 0.06, 0.2), yaw, white, 1.0)
            paint.box((bx + math.cos(yaw) * reach * 0.75, by + math.sin(yaw) * reach * 0.75, z + up - 0.005), (0.24, 0.075, 0.21), yaw, red, 1.0)
        crossings += 1
        walkers += party(i + 4, rng.randint(2, 4))
    for i in range(40, k.n - 40, 60):
        j = i + rng.randrange(40)
        if rng.random() < 0.55 and clear(j):
            walkers += party(j, rng.randint(1, 3))
    return {"crossings": crossings, "walkers": walkers}


def scenery(k) -> dict:
    parapet(k)
    GROVE_SPOTS.clear()
    stepped = terraces(k)
    lemons = lemon_groves(k)
    houses = villages(k)
    houses += village_streets(k)
    plants = maquis(k)
    hauled = boats(k)
    path = footpath(k)
    harbour = vernazza(k)
    parasols = piazza(k)
    churches = parishes(k)
    street = street_life(k)
    street.update(roadside_garden(k))
    works = vineyard_works(k)
    works.update(vendemmia(k))
    afloat = on_the_water(k)
    rocks = sea_rocks(k)
    furniture = road_furniture(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD), "terraced": stepped, "lemonTrees": lemons, "houses": houses, "plants": plants, "boats": hauled, **path, "castle": harbour, "parasols": parasols, "parishChurches": churches, **street, **works, "afloat": afloat, **rocks, **furniture}
