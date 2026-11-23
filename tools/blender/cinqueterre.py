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

from worldkit import Painted, lin as _lin, smooth as _smooth

CROWD = [f"crowd-{i}" for i in range(6)]

# name -> colour, roughness, glow: added to themes.MATERIALS.
MATERIALS: dict[str, dict] = {
    # The parapet's capstones: paler than the wall they lie on, worn smooth.
    "ct-cap": {"color": 0xB5AD9A, "rough": 0.9},
    # A terrace's tread of dry earth and summer grass, and the vines trained along it.
    "ct-terrace": {"color": 0x9A9460, "rough": 1.0},
    "ct-vine": {"color": 0x5C8A38, "rough": 0.9},
    "ct-vine-gold": {"color": 0x8FA040, "rough": 0.9},
    "ct-maquis": {"color": 0x4F7038, "rough": 1.0},
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
    span = int(360 / step)
    length = s[-1]["d"]
    found = []
    for i in range(span, len(s) - span):
        p = s[i]
        if not 500.0 < p["d"] < length - 900.0 or math.cos(p["h"]) < 0.8:
            continue
        window = s[i - span : i + span + 1]
        if p["y"] < max(q["y"] for q in window) or any(abs(q["k"]) > 1 / 70 for q in s[i - 30 : i + 31]):
            continue
        found.append((p["y"] - sum(q["y"] for q in window) / len(window), i))
    chosen: list[int] = []
    for _, i in sorted(found, reverse=True):
        if all(abs(s[i]["d"] - s[j]["d"]) > 1500.0 for j in chosen):
            chosen.append(i)
        if len(chosen) == len(VILLAGES):
            break
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
    cell = 20.0
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
            # Two rows of vines a step: a low ridge of leaves along the terrace, the outer row turning gold.
            for row, mat in ((0.3, "ct-vine"), (0.68, "ct-vine-gold" if (i // 9 + level) % 3 == 0 else "ct-vine")):
                if i % 5 == 4:
                    continue  # a gap between one plant's run of leaves and the next
                mid = front + TERRACE_DEPTH * row
                b = k.B[mat]
                ridge_i, ridge_j = at(i, mid, hi + 1.25), at(j, mid, hi + 1.25)
                quad(b, at(i, mid - 0.55, hi), at(j, mid - 0.55, hi), ridge_j, ridge_i)
                quad(b, at(j, mid + 0.55, hi), at(i, mid + 0.55, hi), ridge_i, ridge_j)
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


def villages(k) -> int:
    """Details 1 and 6, the pastel tower-houses and the villages seen from the bends above: on each headland's spur
    of rock, tall narrow houses in pink, ochre and yellow stand door to door down to the water, under low roofs of
    tile and slate."""
    paint, rng = Painted(k), k.rng
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
            # Not on the cliff under the road, and not where the rock is too steep to build on.
            fall = max(abs(k.height_at(x + 5.0, y) - z), abs(k.height_at(x, y + 5.0) - z))
            if fall > 7.5 or k.road.tree.find((x, y, 0.0))[2] < 13.5:
                continue
            placed.append((x, y))
            wide, deep = rng.uniform(5.6, 8.2), rng.uniform(6.0, 9.0)
            floors = rng.randint(3, 6)
            yaw = rng.uniform(-0.22, 0.22) + (math.pi / 2 if rng.random() < 0.35 else 0.0)
            tall = floors * 3.05 + fall
            wall = _lin(PASTELS[rng.randrange(len(PASTELS))])
            paint.box((x, y, z - fall - 1.5), (wide, deep, tall + 1.5), yaw, wall)
            paint.roof((x, y, z + floors * 3.05), wide, deep, rng.uniform(0.9, 1.6), yaw, _lin(ROOFS[rng.randrange(len(ROOFS))]))
            houses += 1
        print(f"{site['name']}: {len(placed)} houses below the road {site['z']:.0f} m up, {k.s[site['i']]['d']:.0f} m from the start", flush=True)
    return houses


def scenery(k) -> dict:
    parapet(k)
    stepped = terraces(k)
    houses = villages(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD), "terraced": stepped, "houses": houses}
