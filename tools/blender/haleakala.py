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
    # Small things painted by vertex that only matter close to, in the group drawn near the rider (what is
    # painted into the land, "terrain", is drawn from 950 m).
    "hk-detail": {"color": 0xFFFFFF, "rough": 0.9, "vertex": True},
    # A delineator post: white plastic, with an amber reflector near its top.
    "hk-post": {"color": 0xECEAE2, "rough": 0.7},
    "hk-reflector": {"color": 0xFFB020, "glow": 0.9},
    # The silversword: a globe of silver blades, and the maroon flower stalk of its last summer.
    "hk-silver": {"color": 0xC9D4D2, "rough": 0.45},
    "hk-bloom": {"color": 0x7A2F44, "rough": 0.9},
    "hk-lava": {"color": 0x2A2626, "rough": 1.0},
    "hk-lava-red": {"color": 0x6E3A2C, "rough": 1.0},
    # Upcountry: eucalyptus in grey-green, and the jacarandas of Kula in flower.
    "hk-eucalyptus": {"color": 0x6E8E6A, "rough": 0.9},
    "hk-eucalyptus-dark": {"color": 0x4E7252, "rough": 0.9},
    "hk-jacaranda": {"color": 0x8E6CD8, "rough": 0.9},
    # The subalpine shrubland: pūkiawe and ʻōhelo in dull greens, māmane in flower, tussocks of bleached grass.
    "hk-shrub": {"color": 0x66784E, "rough": 1.0},
    "hk-shrub-dark": {"color": 0x47583C, "rough": 1.0},
    "hk-mamane": {"color": 0xD8C23E, "rough": 0.9},
    "hk-tussock": {"color": 0xBFAE74, "rough": 1.0},
    "hk-wire": {"color": 0x8E8E8A, "rough": 0.6, "double": True},
}

THEME: dict = {
    # Detail 10, thin bright light: the sky a deep blue that pales only at the horizon, the sun high and white.
    "sky": [0xA9CDEE, 0x86BBEA, 0x579DE2, 0x2E78D2, 0x164DAE],
    "haze": 0xB9D3EA,
    "light": [0xFFF6E2, 3.4],
    "fill": [0xCFE0F5, 0x7A6A5A],
    "sun_altitude": 0.62,
    # The shoulders are cinder, the sun a white disc and the chevrons road paint.
    "palette": {"asphalt": 0x38383C, "sand": 0x6E5448, "promenade": 0x5A4C46, "sea": 0x0E5E9A, "sun": 0xFFFBEA, "chevron": 0xF2EEE2},
    "land": {"low": 0x9DB45A, "mid": 0x5E9A3C, "high": 0x8A4A36, "rock": 0x3A3230},
    "terrain": {"sea": True},
    # Detail 9, the road edge: narrow tarmac, a yellow centre line and no barrier, only the shoulder.
    "edge": "corniche",
    "centre": "yellow",
    # A national park's road: no racing kerbs round its hairpins, and a shoulder of rolled cinder, not concrete.
    "kerbs": False,
    # The signs, the town, the fences and the domes are painted into the land: it is cut into 480 m lengths.
    "chunks": {"Land": 2},
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


CRATER_FLOOR = 176.0  # the basin's floor, in metres below the road's top
RIM_RIDE = 520.0  # the road's last stretch runs along the crater's rim for this far, in metres


def crater_rim(s: list[dict]):
    """Where the crater begins: a function of a place giving how far south of the rim it is (negative: not in the
    crater) and the rim's height there. Along the road's last stretch the rim is the road's own southern shoulder,
    so the rider looks down into the basin; before it the rim stands back, and beyond the road's end it swings
    south round the summit's knob, where the observatories stand."""
    end = max(q for q, p in enumerate(s) if p["d"] <= s[-1]["d"] - 80.0)
    last = [p for p in s[: end + 1] if p["d"] >= s[end]["d"] - RIM_RIDE]
    a, b = last[0], last[-1]
    span = b["x"] - a["x"]
    by_x = sorted(last, key=lambda p: p["x"])
    z_hi = max(p["z"] for p in s)

    def rim(x: float, y: float) -> tuple[float, float]:
        u = (x - a["x"]) / span
        if u < 0:
            back = _smooth(0.0, 260.0, -u * abs(span))
            return a["y"] - 14.0 - 150.0 * back - y, a["z"] - 1.5 + 27.5 * back
        if u > 0.9:
            out = _smooth(0.9, 1.2, u)
            return b["y"] - 14.0 - 190.0 * out - y, b["z"] - 1.5 + 27.5 * out
        near = min(by_x, key=lambda p: abs(p["x"] - x))
        return near["y"] - 14.0 - y, near["z"] - 1.5

    return rim
# The cinder cones near the rim: across from the road's middle, south of the rim, height and radius, in metres.
CONES = ((-360.0, 250.0, 62.0, 150.0), (140.0, 310.0, 78.0, 170.0), (520.0, 220.0, 50.0, 130.0), (-760.0, 300.0, 55.0, 140.0))


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
    # The painted cinder of the upper mountain: broad washes of ochre and of violet-grey ash run down the slope
    # across the red, as they do over the crater's cones.
    ochre, ash = _lin(0xB98548), _lin(0x6C6468)
    wash = bc.noise(x * 0.22 + 31.0, y * 0.5 - 12.0)
    drift = bc.noise(x * 0.3 - 57.0, y * 0.18 + 40.0)
    cinder = bc.mix(cinder, ochre, 0.7 * _smooth(0.25, 0.6, wash))
    cinder = bc.mix(cinder, ash, 0.75 * _smooth(0.3, 0.65, drift))
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
    rim_y, x_mid = min(ys) - 46.0, (min(xs) + max(xs)) / 2
    rim = crater_rim(s)

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
            # Detail 3, the summit crater: south of the road's top the rim breaks and the land falls into the basin,
            # with cinder cones standing on its floor.
            south, lip = rim(x, y)
            if south > 0:
                basin = lip + (z_hi - CRATER_FLOOR - lip) * bc.smoothstep(0.0, 300.0, south) + 6.0 * n2 * bc.smoothstep(0.0, 60.0, south)
                for cx, cs, ch, cr in CONES:
                    r = math.hypot(x - (x_mid + cx), (rim_y - y) - cs)
                    # A cone, with the dimple of its vent.
                    basin += ch * max(0.0, 1 - r / cr) - ch * 0.28 * max(0.0, 1 - r / (cr * 0.3))
                h = min(h, basin)
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
            # The reflector is one face, towards the riders coming up: a box each was a fifth of the frame's budget.
            eye.quad(k.P(i, -0.03, off + 0.045, 0.78), k.P(i, -0.03, off - 0.045, 0.78), k.P(i, -0.03, off - 0.045, 0.94), k.P(i, -0.03, off + 0.045, 0.94))
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


def island_peaks(k) -> int:
    """Detail 2, above the clouds: what else stands up through them. Far across the cloud to one side are the two
    great shield volcanoes of the next island, broad and blue with distance, the nearer one snow-capped; to the
    other, lower and nearer, the ragged green ridge of the island's western mountains. From above, their feet are in the cloud; they stand on the sea, so from the
    coast below it they are mountains on the horizon."""
    paint, s = Painted(k, "peaks"), k.s
    zs, xs = [p["z"] for p in s], [p["x"] for p in s]
    level = min(zs) + CLOUD_LEVEL * (max(zs) - min(zs))
    edge = min(s, key=lambda p: abs(p["z"] - level))["y"] + 210.0
    cx = (min(xs) + max(xs)) / 2
    blue, pale, snow, green, ridge = _lin(0x6F92C0), _lin(0x8FAED2), _lin(0xF2F5F8), _lin(0x5E8A7E), _lin(0x7FA69A)
    # The shields: wide and gently sloped, a stepped profile from foot to summit.
    for x, y, r, tall, capped in ((cx + 7600.0, edge + 3400.0, 3300.0, 560.0, True), (cx + 8600.0, edge + 800.0, 3900.0, 500.0, False)):
        paint.tube((x, y, -5.0), r * 1.5, r, level - 55.0, blue, blue, 14)
        paint.tube((x, y, level - 60.0), r, r * 0.55, tall * 0.5, blue, blue, 14)
        paint.tube((x, y, level - 60.0 + tall * 0.5), r * 0.55, r * 0.2, tall * 0.35, blue, pale, 14)
        top = snow if capped else pale
        paint.tube((x, y, level - 60.0 + tall * 0.85), r * 0.2, r * 0.05, tall * 0.15, pale if not capped else snow, top, 14, top)
    # The western mountains: a row of steep summits, cut by valleys.
    for q, (dx, r, tall) in enumerate(((0.0, 1500.0, 330.0), (1300.0, 1100.0, 250.0), (-1200.0, 1250.0, 280.0), (2300.0, 800.0, 170.0), (-2300.0, 900.0, 190.0))):
        x, y = cx - 6800.0 + dx, edge + 3600.0 + 500.0 * math.sin(q * 2.1)
        paint.tube((x, y, -5.0), r * 1.7, r, level - 55.0, green, green, 9)
        paint.tube((x, y, level - 60.0), r, r * 0.3, tall * 0.7, green, ridge, 9)
        paint.tube((x, y, level - 60.0 + tall * 0.7), r * 0.3, r * 0.04, tall * 0.3, ridge, ridge, 9, ridge)
    return 3


def height_share(k, i: int) -> float:
    """How far up the climb sample i is: 0 the shore, 1 the summit."""
    zs = [p["z"] for p in k.s]
    return (k.s[i]["z"] - min(zs)) / (max(zs) - min(zs))


def silversword(k, x: float, y: float, z: float, bloom: bool, r: float | None = None) -> None:
    """One silversword: a globe of narrow silver blades sitting on the cinder, and on a few the tall flower stalk.
    Given a small `r` it is a seedling: a tuft of a few short blades."""
    rng, b = k.rng, k.B["hk-silver"]
    seedling = r is not None
    r = r or rng.uniform(0.55, 0.95)
    for tier, (blades, tilt) in enumerate(((6, 0.5), (4, 1.1)) if seedling else ((10, 0.3), (8, 0.8), (5, 1.25))):
        for q in range(blades):
            a = q * math.tau / blades + tier * 0.35 + rng.uniform(-0.15, 0.15)
            ca, sa = math.cos(a), math.sin(a)
            tip = (x + ca * r * math.cos(tilt), y + sa * r * math.cos(tilt), z + 0.08 + r * math.sin(tilt))
            w = 0.07 if seedling else 0.16
            left, right = (x - sa * w, y + ca * w, z + 0.06), (x + sa * w, y - ca * w, z + 0.06)
            b.tri(left, right, tip)
            b.tri(right, left, tip)
    if bloom:
        # The flower stalk: a spire as tall as a rider's shoulder, thick with maroon heads, on a silver stem.
        tall = rng.uniform(1.4, 2.1)
        k.prism(b, (x, y, z + r * 0.4), 0.09, 0.5, 5, 0.08)
        k.prism(k.B["hk-bloom"], (x, y, z + r * 0.4 + 0.45), 0.3, tall * 0.55, 6, 0.24)
        k.prism(k.B["hk-bloom"], (x, y, z + r * 0.4 + 0.45 + tall * 0.55), 0.24, tall * 0.45, 6, 0.05)


def spent_silversword(paint, rng, x: float, y: float, z: float) -> None:
    """A silversword that has flowered: it flowers once and dies. The rosette lies collapsed and straw-coloured
    on the cinder and the dry stalk still stands in it, grey-brown, its seed gone."""
    straw, dry = _lin(0xB8A67E), _lin(0x6E5A48)
    r = rng.uniform(0.55, 0.85)
    paint.tube((x, y, z - 0.05), r, r * 0.3, 0.3, straw, _lin(0x9A8862), 7)
    tall = rng.uniform(1.2, 1.8)
    paint.tube((x, y, z + 0.2), 0.14, 0.2, tall * 0.5, dry, dry, 5)
    paint.tube((x, y, z + 0.2 + tall * 0.5), 0.2, 0.04, tall * 0.5, dry, _lin(0x8A765E), 5, _lin(0x8A765E))


def silverswords(k) -> int:
    """Detail 4, silverswords: on the bare cinder near the summit and nowhere lower, in loose colonies with wide
    gaps of bare ground between them, a few in flower. Dark lumps of lava lie among them."""
    rng, s, paint = k.rng, k.s, Painted(k)
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
                continue
            if rng.random() < 0.12:
                # One that flowered last year, and round it the seedlings it left.
                spent_silversword(paint, rng, x, y, z)
                for _ in range(rng.randint(2, 5)):
                    sx, sy = x + rng.uniform(-1.8, 1.8), y + rng.uniform(-1.8, 1.8)
                    if k.road.clear_of_road(sx, sy, 7.0, i):
                        silversword(k, sx, sy, k.ground(sx, sy, i, off), False, rng.uniform(0.16, 0.3))
                continue
            silversword(k, x, y, z, rng.random() < 0.14)
            planted += 1
    return planted


def dome(paint, c, r: float, drum: float, slit: float, sides: int = 12, skin: int = 0xF4F5F2) -> None:
    """An observatory: a white drum under a white dome (or one of another `skin`), with the dark slit the telescope
    looks out of."""
    white, shade, dark = _lin(skin), tuple(v * 0.72 for v in _lin(skin)[:3]) + (1.0,), _lin(0x30343A)

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
    paint, rng = Painted(k), k.rng
    # On the summit's knob, beyond the road's end.
    i, side = k.n - 1, 1
    silver = _lin(0xAEB6BC)
    stood = 0
    plan = ((112, 36, 8.0, 6.5), (118, -34, 6.5, 5.5), (60, 52, 5.5, 4.6), (64, -56, 9.0, 7.5), (160, 8, 6.0, 5.2), (140, 74, 4.8, 4.2))
    for along, out, r, drum in plan:
        x, y, _ = k.P(i, along + rng.uniform(-5.0, 5.0), (out + rng.uniform(-5.0, 5.0)) * side)
        z = k.height_at(x, y)
        dome(paint, (x, y, z), r, drum, rng.uniform(0, math.tau))
        # Its low building alongside.
        yaw = rng.uniform(0, math.pi)
        paint.box((x + math.cos(yaw) * (r + 5.0), y + math.sin(yaw) * (r + 5.0), z - 1.5), (r * 1.6, r * 0.9, 5.0), yaw, _lin(0xECECE6))
        stood += 1
    # The solar telescope, the tallest thing on the mountain: a white tower with its dome on top and a low wing.
    x, y, _ = k.P(i, 74.0, 2.0 * side)
    z = k.height_at(x, y)
    white = _lin(0xF4F5F2)
    paint.box((x, y, z - 1.5), (15.0, 15.0, 27.0), 0.2, white)
    paint.box((x + 13.0, y + 4.0, z - 1.5), (14.0, 11.0, 9.5), 0.2, _lin(0xECECE6))
    dome(paint, (x, y, z + 25.5), 8.2, 3.0, 2.4)
    # The air force's telescope: a silver dome on a broad silver drum.
    x, y, _ = k.P(i, 168.0, -52.0 * side)
    z = k.height_at(x, y)
    paint.box((x, y, z - 1.5), (17.0, 17.0, 9.0), 0.4, silver)
    dome(paint, (x, y, z + 7.5), 7.6, 4.0, 0.7, 12, 0xC2CAD0)
    # Two aerials on their masts.
    for along, out in ((96.0, -70.0), (132.0, 44.0)):
        x, y, _ = k.P(i, along, out * side)
        z = k.height_at(x, y)
        paint.box((x, y, z - 1.0), (0.5, 0.5, 19.0), 0.0, _lin(0xD8DADC), 0.5)
        paint.box((x, y, z + 15.0), (3.2, 0.3, 0.3), 0.6, _lin(0xC8322C), 1.0)
    return stood + 2


RANCH = (0.1, 0.5)  # the share of the climb the ranch land lies between
CATTLE = (0x2A2420, 0x6A4028, 0x8A5A38, 0xE8E2D4, 0x3A2A22)


def cow(paint, rng, c, yaw: float) -> None:
    """One of the ranch's cattle: a barrel on four legs, head down to graze or up to watch the riders pass."""
    hide = _lin(CATTLE[rng.randrange(len(CATTLE))])
    cs, sn = math.cos(yaw), math.sin(yaw)

    def at(fwd: float, left: float, up: float):
        return (c[0] + fwd * cs - left * sn, c[1] + fwd * sn + left * cs, c[2] + up)

    # Each pair of legs is one slab: a herd is seen from the road, not from among it.
    for fwd in (0.7, -0.7):
        paint.box(at(fwd, 0, -0.2), (0.16, 0.6, 0.95), yaw, hide, 0.6)
    paint.box(at(0, 0, 0.72), (2.0, 0.72, 0.78), yaw, hide, 0.8)
    grazing = rng.random() < 0.6
    paint.box(at(1.25, 0, 0.25 if grazing else 1.15), (0.6, 0.34, 0.42), yaw, hide, 0.9)
    paint.box(at(1.05, 0, 0.6 if grazing else 0.95), (0.34, 0.3, 0.5), yaw, hide, 0.9)


HORSES = (0x6A3E26, 0x8A5632, 0x2E2622, 0xB9B2A6, 0x4A2E20)


def horse(paint, rng, c, yaw: float) -> None:
    """One of the ranch's horses: longer in the leg than the cattle, neck up, a dark tail."""
    coat = _lin(HORSES[rng.randrange(len(HORSES))])
    cs, sn = math.cos(yaw), math.sin(yaw)

    def at(fwd: float, left: float, up: float):
        return (c[0] + fwd * cs - left * sn, c[1] + fwd * sn + left * cs, c[2] + up)

    for fwd in (0.75, -0.75):
        paint.box(at(fwd, 0, -0.2), (0.14, 0.46, 1.35), yaw, coat, 0.55)
    paint.box(at(0, 0, 1.1), (2.1, 0.56, 0.62), yaw, coat, 0.85)
    grazing = rng.random() < 0.4
    paint.box(at(1.15, 0, 0.75 if grazing else 1.45), (0.36, 0.3, 0.95), yaw, coat, 0.9)
    paint.box(at(1.5, 0, 0.5 if grazing else 2.15), (0.62, 0.24, 0.3), yaw, coat, 0.9)
    paint.box(at(-1.12, 0, 0.75), (0.1, 0.12, 0.85), yaw, _lin(0x1E1A18), 0.9)


def ranch_steads(k) -> dict:
    """Detail 6, ranch land: three homesteads stand back from the road up through the pastures. Each is a white
    board house under a red tin roof with a lanai along its front and a water tank at its end; a gate of two tall
    posts and a crossbeam with the ranch's board stands at the fence where its track leaves the road, and horses
    graze the paddock beside it."""
    paint, rng, s = Painted(k), k.rng, k.s
    white, red, glass, door, timber, tank = _lin(0xF2EFE6), _lin(0xA63A2E), _lin(0x2E3B44), _lin(0x4A6A4E), _lin(0x6A4A30), _lin(0xB9BEC2)
    steads = horses = 0
    for target in (0.17, 0.29, 0.41):
        for i in range(12, k.n - 12):
            if height_share(k, i) < target or any(abs(s[q]["k"]) > 1 / 150 for q in range(i - 8, i + 9)):
                continue
            side = next((sd for sd in (1, -1) if k.room(i, (k.kerb + 34.0) * sd, 26.0)), 0)
            if not side:
                continue
            x, y, _ = k.road.at(i, (k.kerb + 19.0) * side)
            rx, ry, rz = k.road.at(i, 0.0)
            d = math.hypot(rx - x, ry - y)
            out = ((rx - x) / d, (ry - y) / d)
            along = (-out[1], out[0])
            yaw, z = math.atan2(along[1], along[0]), sum(k.height_at(x + dx * along[0], y + dx * along[1]) for dx in (-7.0, 0.0, 7.0)) / 3 + 0.6
            wide, deep, tall = 13.0, 7.0, 3.3
            # On the slope it stands on a footing of lava stone, level under the boards.
            paint.box((x, y, z - 5.0), (wide + 0.5, deep + 0.5, 5.0), yaw, _lin(0x4A423E), 0.8)
            paint.box((x, y, z), (wide, deep, tall), yaw, white, 0.85)
            paint.roof((x, y, z + tall), wide + 0.8, deep + 0.8, 2.1, yaw, red)
            # The lanai: its own low roof on four posts, the door and the windows in its shade.
            fx, fy = x + out[0] * deep / 2, y + out[1] * deep / 2
            paint.box((fx + out[0] * 1.2, fy + out[1] * 1.2, z + 2.55), (wide + 0.4, 2.6, 0.14), yaw, red, 1.0)
            paint.box((fx + out[0] * 1.2, fy + out[1] * 1.2, z - 5.0), (wide, 2.4, 5.0), yaw, timber, 0.7)
            for e in (-0.5, -0.17, 0.17, 0.5):
                paint.box((fx + out[0] * 2.3 + along[0] * e * (wide - 0.4), fy + out[1] * 2.3 + along[1] * e * (wide - 0.4), z - 0.1), (0.14, 0.14, 2.7), yaw, white, 1.0)
            corner = (fx - along[0] * wide / 2, fy - along[1] * wide / 2, 0.0)
            paint.panel(corner, along, out, wide / 2 - 0.5, wide / 2 + 0.5, z, z + 2.1, 0.04, door)
            for a0 in (1.2, 3.6, wide - 4.8, wide - 2.4):
                paint.panel(corner, along, out, a0, a0 + 1.2, z + 0.9, z + 2.1, 0.04, glass)
            paint.tube((x + along[0] * (wide / 2 + 2.4), y + along[1] * (wide / 2 + 2.4), z - 3.0), 1.5, 1.5, 5.6, tank, tank, 8, _lin(0x8E9296))
            # The gate at the fence line, the ranch's board hung from its beam.
            gx, gy, gz = k.road.at(i, (k.kerb + 4.2) * side)
            for e in (-2.6, 2.6):
                paint.box((gx + along[0] * e, gy + along[1] * e, gz - 0.4), (0.28, 0.28, 5.0), yaw, timber, 0.8)
            paint.box((gx, gy, gz + 4.3), (5.9, 0.26, 0.26), yaw, timber, 1.0)
            paint.box((gx, gy, gz + 3.55), (2.6, 0.08, 0.6), yaw, white, 1.0)
            paint.box((gx, gy, gz + 3.7), (1.9, 0.1, 0.16), yaw, red, 1.0)
            # The paddock beside the house.
            for _ in range(rng.randint(3, 5)):
                hx = x - along[0] * rng.uniform(13.0, 30.0) + out[0] * rng.uniform(-6.0, 14.0)
                hy = y - along[1] * rng.uniform(13.0, 30.0) + out[1] * rng.uniform(-6.0, 14.0)
                if k.road.clear_of_road(hx, hy, 9.0, i):
                    horse(paint, rng, (hx, hy, k.height_at(hx, hy)), rng.uniform(0, math.tau))
                    horses += 1
            steads += 1
            break
    return {"ranchHouses": steads, "horses": horses}


AVENUES = (0.2, 0.33)  # the shares of the climb where the Kula road runs under jacarandas


def jacaranda_avenues(k) -> dict:
    """Detail 6, ranch land: Kula's jacarandas. In two places on the way up through the pastures the road runs
    for a couple of hundred metres under an avenue of them, a tree every 20 m on both sides, all flower and no
    leaf, and the verge under each lies purple with what has fallen."""
    near, rng, s, B = Painted(k, "hk-detail"), k.rng, k.s, k.B
    petal = (_lin(0x8E6CD8), _lin(0xA98AE6), _lin(0x7A58C4))
    trees = 0
    for share in AVENUES:
        start = next((i for i in range(8, k.n - 70) if height_share(k, i) >= share and all(abs(s[q]["k"]) < 1 / 150 for q in range(i, i + 56, 4))), None)
        if start is None:
            continue
        for i in range(start, start + 56, 5):
            for side in (1, -1):
                x, y, z = k.road.at(i, (k.kerb + 5.6) * side)
                if not k.road.clear_of_road(x, y, 6.0, i):
                    continue
                z = k.ground(x, y, i, (k.kerb + 5.6) * side)
                tall = rng.uniform(4.6, 6.2)
                k.prism(B["trunk-dark"], (x, y, z - 0.5), 0.3, tall + 0.6, 5, 0.2)
                for q in range(3):
                    a = q * math.tau / 3 + rng.uniform(0, 1.0)
                    lens(B["hk-jacaranda"], (x + math.cos(a) * 1.9, y + math.sin(a) * 1.9, z + tall + rng.uniform(-0.5, 0.6)), rng.uniform(2.6, 3.6), 2.1, rng)
                trees += 1
                # The fallen flower on the verge beneath it.
                for q in range(-1, 2):
                    a, b = k.road.at(i + q, (k.kerb + 0.5) * side, 0.04), k.road.at(i + q + 1, (k.kerb + 0.5) * side, 0.04)
                    c, d = k.road.at(i + q + 1, (k.kerb + 3.4) * side, 0.04), k.road.at(i + q, (k.kerb + 3.4) * side, 0.04)
                    quad = (a, b, c, d)
                    if (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]) < 0:
                        quad = quad[::-1]
                    near.face(quad, (petal[rng.randrange(3)],) * 4)
    return {"jacarandaAvenueTrees": trees}


def ranch_land(k) -> dict:
    """Detail 6, ranch land: on the middle slopes a post-and-wire fence runs along both sides of the road, cattle
    graze the pasture behind it, and eucalyptus stand in lines with a jacaranda in flower among them."""
    paint, rng, s, B = Painted(k), k.rng, k.s, k.B
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    cattle = trees = 0
    for i in range(6, k.n - 6):
        if not RANCH[0] < shares[i // 25] < RANCH[1]:
            continue
        # A post every 12 m and two strands between: by the road only, so in the group drawn near.
        if i % 3 == 0 and abs(s[i]["k"]) < 1 / 60:
            for side in (1, -1):
                off = (k.kerb + 4.2) * side
                x, y, z = k.road.at(i, off)
                x1, y1, z1 = k.road.at(i + 3, off)
                B["wood"].box((x, y, z - 0.5), (0.12, 0.12, 1.75), s[i]["h"])
                for up in (0.6, 1.1):
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


COAST_TO = 0.075  # the share of the climb below which the road is still by the shore


TOWN = (150, 186)  # the samples the plantation town's shops stand along, on the mountain's side of the coast road
SHOPS = (0xE9C46A, 0x8FC1B5, 0xE07A5F, 0xF2E8CF, 0x6FA8DC, 0xD98BA8, 0x9CCB86)


def plantation_town(k) -> dict:
    """Detail 7, the coastal start: the old sugar town the climb sets out from. A row of wooden shops with false
    fronts, each its own paint, stands along the mountain's side of the road under tin awnings; behind the cane
    beyond it is the sugar mill, a long rust-roofed shed with its tall stack."""
    paint, rng, s = Painted(k), k.rng, k.s
    trim, glass, door, tin, post = _lin(0xF7F3E8), _lin(0x2E3B44), _lin(0x5A3A28), _lin(0xA9ADA8), _lin(0xE8E2D4)
    shops = 0
    i = TOWN[0]
    while i < TOWN[1]:
        shore = 1 if math.cos(s[i]["h"]) > 0 else -1
        wide, deep, tall = rng.uniform(6.5, 9.0), 7.0, rng.uniform(3.6, 4.4)
        x, y, _ = k.road.at(i, -(k.kerb + 3.4 + deep / 2) * shore)
        rx, ry, rz = k.road.at(i, 0.0)
        d = math.hypot(rx - x, ry - y)
        out = ((rx - x) / d, (ry - y) / d)
        along = (-out[1], out[0])
        yaw, z = math.atan2(along[1], along[0]), rz + 0.1
        colour = _lin(SHOPS[rng.randrange(len(SHOPS))])
        paint.box((x, y, z - 1.0), (wide, deep, tall + 1.0), yaw, colour, 0.7)
        # The false front, taller than the shop behind it, with a pale cornice.
        fx, fy = x + out[0] * (deep / 2 + 0.1), y + out[1] * (deep / 2 + 0.1)
        paint.box((fx, fy, z + tall - 0.4), (wide, 0.3, rng.uniform(1.5, 2.3)), yaw, colour, 1.0)
        paint.box((fx + out[0] * 0.75, fy + out[1] * 0.75, z + 2.75), (wide, 1.7, 0.12), yaw, tin, 1.0)
        for e in (-1, 1):
            paint.box((fx + out[0] * 1.5 + along[0] * e * (wide / 2 - 0.2), fy + out[1] * 1.5 + along[1] * e * (wide / 2 - 0.2), z - 0.1), (0.14, 0.14, 2.9), yaw, post, 1.0)
        corner = (fx + out[0] * 0.15 - along[0] * wide / 2, fy + out[1] * 0.15 - along[1] * wide / 2, 0.0)
        paint.panel(corner, along, out, wide / 2 - 0.55, wide / 2 + 0.55, z, z + 2.2, 0.04, door)
        paint.panel(corner, along, out, 0.6, wide / 2 - 1.0, z + 0.8, z + 2.2, 0.04, glass)
        paint.panel(corner, along, out, wide / 2 + 1.0, wide - 0.6, z + 0.8, z + 2.2, 0.04, glass)
        paint.panel(corner, along, out, 0.8, wide - 0.8, z + tall + 0.1, z + tall + 0.8, 0.04, trim)
        shops += 1
        i += max(2, int(round((wide + 0.6) / k.step)))
    # The mill, 90 m back from the road beyond the town.
    j = TOWN[1] + 34
    shore = 1 if math.cos(s[j]["h"]) > 0 else -1
    x, y, _ = k.road.at(j, -(k.kerb + 92.0) * shore)
    mill = k.road.clear_of_road(x, y, 40.0, j)
    if mill:
        z, yaw = k.height_at(x, y), s[j]["h"]
        rust, wall, stack = _lin(0x8A4B32), _lin(0xB9B4A6), _lin(0xC9C3B4)
        paint.box((x, y, z - 1.5), (46.0, 20.0, 13.5), yaw, wall, 0.7)
        paint.roof((x, y, z + 12.0), 46.0, 20.0, 5.0, yaw, rust)
        cs, sn = math.cos(yaw), math.sin(yaw)
        paint.box((x + cs * 30.0, y + sn * 30.0, z - 1.5), (16.0, 14.0, 20.0), yaw, _lin(0xA7A294), 0.7)
        paint.roof((x + cs * 30.0, y + sn * 30.0, z + 18.5), 16.0, 14.0, 3.0, yaw, rust)
        paint.tube((x - cs * 30.0, y - sn * 30.0, z - 1.5), 2.3, 1.5, 44.0, stack, _lin(0x8E8A80), 8, _lin(0x3A3836))
    return {"shops": shops, "mill": bool(mill)}


BOARDS = (0xF2E8CF, 0xE8553A, 0x2F9FB8, 0xF2C230, 0x7FC8A0, 0xE890A8)


def beach_park(k) -> dict:
    """Detail 7, the coastal start: the shore side of the coast road is a beach park. Outrigger canoes lie hauled
    up beside the road, each a long bright hull with its float out on two booms; surfboards stand on end in a
    rack; and a yellow lifeguard tower on legs looks out to sea."""
    paint, rng, s = Painted(k, "hk-detail"), k.rng, k.s
    wood, yellow, white, red = _lin(0x6A4A30), _lin(0xF2C230), _lin(0xF4F2EA), _lin(0xD9342E)
    canoes = boards = towers = 0
    for i in range(24, min(TOWN[0] - 6, k.n - 6)):
        if abs(s[i]["k"]) > 1 / 120:
            continue
        shore = 1 if math.cos(s[i]["h"]) > 0 else -1
        yaw = s[i]["h"]
        cs, sn = math.cos(yaw), math.sin(yaw)
        x, y, z = k.road.at(i, (k.kerb + 4.6) * shore)
        if z < 1.2:
            continue
        # Each stands on a pad of sand level with the road: the land beyond the shoulder is lower and out of sight.
        if i % 21 in (3, 11) or i % 42 == 30:
            land = k.height_at(x, y)
            paint.box((x, y, land - 0.6), (8.6, 4.4, z - land + 0.62), yaw, _lin(0xD9C9A0), 0.7)
        if i % 21 == 3:
            # A canoe: the hull, pointed at both ends, its two booms and the float.
            hull = _lin(BOARDS[rng.randrange(1, len(BOARDS))])
            paint.box((x, y, z + 0.05), (7.0, 0.55, 0.5), yaw, hull, 0.75)
            for e in (-1, 1):
                paint.box((x + cs * e * 4.1, y + sn * e * 4.1, z + 0.2), (1.3, 0.34, 0.32), yaw, hull, 0.85)
            ox, oy = -sn * shore * 1.9, cs * shore * 1.9
            for e in (-1.4, 1.4):
                paint.box((x + cs * e + ox / 2, y + sn * e + oy / 2, z + 0.52), (0.08, 1.9, 0.07), yaw, wood, 1.0)
            paint.box((x + ox, y + oy, z + 0.12), (4.2, 0.22, 0.24), yaw, yellow, 0.9)
            canoes += 1
        elif i % 21 == 11:
            # A rack of boards on end.
            paint.box((x, y, z + 0.9), (5.4, 0.1, 0.1), yaw, wood, 1.0)
            for e in (-2.7, 2.7):
                paint.box((x + cs * e, y + sn * e, z - 0.1), (0.12, 0.12, 1.1), yaw, wood, 1.0)
            for q in range(6):
                e = -2.2 + q * 0.88
                tall = rng.uniform(1.9, 2.7)
                colour = _lin(BOARDS[rng.randrange(len(BOARDS))])
                paint.box((x + cs * e, y + sn * e, z + 0.05), (0.52, 0.07, tall * 0.8), yaw, colour, 1.0)
                paint.box((x + cs * e, y + sn * e, z + 0.05 + tall * 0.8), (0.34, 0.07, tall * 0.2), yaw, colour, 0.9)
                boards += 1
        elif i % 42 == 30:
            # The lifeguards' tower.
            for ex in (-1, 1):
                for ey in (-1, 1):
                    paint.box((x + cs * ex * 1.1 - sn * ey * 1.1, y + sn * ex * 1.1 + cs * ey * 1.1, z - 0.2), (0.14, 0.14, 2.4), yaw, wood, 1.0)
            paint.box((x, y, z + 2.1), (3.0, 3.0, 0.14), yaw, wood, 1.0)
            paint.box((x, y, z + 2.24), (2.3, 2.3, 1.9), yaw, yellow, 0.85)
            paint.box((x, y, z + 4.14), (3.1, 3.1, 0.14), yaw, white, 1.0)
            paint.box((x - sn * shore * 1.2, y + cs * shore * 1.2, z + 3.0), (1.3, 0.06, 0.6), yaw, red, 1.0)
            towers += 1
    return {"canoes": canoes, "surfboards": boards, "lifeguardTowers": towers}


def coastal_start(k) -> dict:
    """Detail 7, the coastal start: coconut palms lean along the shore side of the road and stand in ones and twos
    inland, and fields of sugar cane, taller than a rider, fill the flat land on the mountain's side."""
    paint, rng, s = Painted(k), k.rng, k.s
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    cane_lo, cane_hi = _lin(0x7FA046), _lin(0xC9D488)
    palms = fields = 0
    field_from = None
    for i in range(4, k.n - 4):
        if shares[i // 25] > COAST_TO:
            break
        # The sea is to the north: the shore side is whichever side of the road looks that way.
        shore = 1 if math.cos(s[i]["h"]) > 0 else -1
        if rng.random() < 0.3:
            x, y, z = k.road.at(i, (k.kerb + rng.uniform(3.0, 16.0)) * shore)
            if z > 1.0 and k.road.clear_of_road(x, y, 7.0, i):
                k.palm(x, y, k.height_at(x, y))
                palms += 1
        if rng.random() < 0.06:
            x, y, z = k.road.at(i, -(k.kerb + rng.uniform(3.0, 7.0)) * shore)
            if k.road.clear_of_road(x, y, 7.0, i):
                k.palm(x, y, k.height_at(x, y))
                palms += 1
        # Cane: a block of it 3 m tall from 9 m to 46 m behind the kerb, with a track through it now and then.
        if abs(s[i]["k"]) > 1 / 90 or i % 40 > 36 or TOWN[0] - 3 <= i <= TOWN[1] + 3:
            continue
        near, far = [k.road.at(q, -(k.kerb + 9.0) * shore) for q in (i, i + 1)], [k.road.at(q, -(k.kerb + 46.0) * shore) for q in (i, i + 1)]
        if not all(k.road.clear_of_road(p[0], p[1], 8.0, i) for p in far):
            continue
        ground = lambda p: (p[0], p[1], k.height_at(p[0], p[1]) - 0.3)  # noqa: E731
        top = lambda p: (p[0], p[1], k.height_at(p[0], p[1]) + 3.0 + 0.3 * math.sin(p[0] * 0.9 + p[1] * 0.7))  # noqa: E731
        front = (ground(near[0]), ground(near[1]), top(near[1]), top(near[0]))
        roof = (top(near[0]), top(near[1]), top(far[1]), top(far[0]))
        flip = shore > 0
        paint.face(front[::-1] if flip else front, ((cane_lo,) * 2 + (cane_hi,) * 2)[:: -1 if flip else 1])
        paint.face(roof[::-1] if flip else roof, (cane_hi,) * 4)
        if i % 40 == 0 or field_from is None:
            end = (ground(near[0]), top(near[0]), top(far[0]), ground(far[0]))
            paint.face(end if flip else end[::-1], (cane_lo, cane_hi, cane_hi, cane_lo) if flip else (cane_lo, cane_hi, cane_hi, cane_lo)[::-1])
            fields += 1
        field_from = i
    return {"palms": palms, "caneFields": fields}


def crater(k) -> int:
    """Detail 3, the summit crater: beyond what the land holds, the basin runs on for kilometres, a floor of rust,
    ochre and grey cinder with cones on it, to the far rim wall. It is drawn whole, hazed by its distance."""
    paint, s = Painted(k, "peaks"), k.s
    xs, ys, zs = [p["x"] for p in s], [p["y"] for p in s], [p["z"] for p in s]
    rim_y, x_mid, z_hi = min(ys) - 46.0, (min(xs) + max(xs)) / 2, max(zs)
    floor = z_hi - CRATER_FLOOR - 6.0
    haze = _lin(THEME["haze"])
    rust, ochre, grey, dark = _lin(0x8E4A34), _lin(0xB07A48), _lin(0x6A605C), _lin(0x3A3230)

    def tone(x: float, south: float, lift: float = 0.0):
        a = 0.5 + 0.5 * math.sin(x * 0.0031 + south * 0.0022)
        b = 0.5 + 0.5 * math.sin(x * 0.0013 - south * 0.0041 + 1.7)
        c = tuple(rust[q] * (1 - a) + ochre[q] * a for q in range(3))
        c = tuple(c[q] * (1 - b * 0.55) + grey[q] * b * 0.55 for q in range(3))
        c = tuple(c[q] * (1 - lift) + dark[q] * lift for q in range(3))
        # Thin air hazes little: the far wall, three kilometres off, keeps most of its colour.
        far = 0.3 * _smooth(900.0, 3400.0, south)
        return (*(c[q] * (1 - far) + haze[q] * far for q in range(3)), 1.0)

    def at(x: float, south: float, z: float):
        return (x, rim_y - south, z)

    # The floor, from under the land's edge to the far wall, and the wall round it.
    cell, x_lo, reach = 400.0, x_mid - 3600.0, 3200.0
    for ix in range(18):
        for iy in range(8):
            x, south = x_lo + ix * cell, 330.0 + iy * (reach - 330.0) / 8
            x1, south1 = x + cell, south + (reach - 330.0) / 8
            paint.face((at(x, south, floor), at(x, south1, floor), at(x1, south1, floor), at(x1, south, floor)), (tone(x, south), tone(x, south1), tone(x1, south1), tone(x1, south)))
    for ix in range(36):
        x, x1 = x_lo + ix * 200.0, x_lo + (ix + 1) * 200.0
        top = lambda v: z_hi + 30.0 + 46.0 * math.sin(v * 0.0037) + 22.0 * math.sin(v * 0.0113 + 1.0)  # noqa: E731
        paint.face((at(x, reach, floor), at(x, reach + 260.0, top(x)), at(x1, reach + 260.0, top(x1)), at(x1, reach, floor)), (tone(x, reach), tone(x, reach + 260.0, 0.45), tone(x1, reach + 260.0, 0.45), tone(x1, reach)))
    # The far cones.
    cones = ((-1500.0, 900.0, 110.0, 300.0), (-500.0, 1300.0, 150.0, 380.0), (700.0, 1000.0, 120.0, 320.0), (1700.0, 1500.0, 140.0, 360.0), (200.0, 2100.0, 170.0, 420.0), (-2100.0, 1900.0, 130.0, 340.0), (2600.0, 800.0, 90.0, 260.0))
    # Each cone is its own cinder: brick red, black, ochre or ash, darker down in its vent, with a pale skirt of
    # sand where it meets the floor.
    tints = (0xA8432C, 0x2E2828, 0xC08A3C, 0x6E6068, 0x8A3A2A, 0x3A3030, 0xB0703A)
    for n_cone, (cx, cs, ch, cr) in enumerate(cones):
        tint = _lin(tints[n_cone % len(tints)])

        def own(x: float, south: float, lift: float = 0.0, keep: float = 0.8, tint=tint):
            t = tone(x, south, lift)
            far = 0.3 * _smooth(900.0, 3400.0, south)
            shade = 1 - 0.45 * lift
            return (*(t[q] * (1 - keep) + (tint[q] * shade * (1 - far) + haze[q] * far) * keep for q in range(3)), 1.0)

        ring = [(x_mid + cx + math.cos(q * math.tau / 10) * cr, cs + math.sin(q * math.tau / 10) * cr) for q in range(10)]
        lip = [(x_mid + cx + math.cos(q * math.tau / 10) * cr * 0.28, cs + math.sin(q * math.tau / 10) * cr * 0.28) for q in range(10)]
        for q in range(10):
            n = (q + 1) % 10
            # Seen from the north: the ring runs clockwise from above as south grows away from the eye.
            paint.face((at(*ring[n], floor), at(*ring[q], floor), at(*lip[q], floor + ch), at(*lip[n], floor + ch)), (own(*ring[n], 0.0, 0.35), own(*ring[q], 0.0, 0.35), own(*lip[q], 0.15), own(*lip[n], 0.15)))
            paint.face((at(*lip[n], floor + ch), at(*lip[q], floor + ch), at(x_mid + cx, cs, floor + ch * 0.72)), (own(*lip[n], 0.15), own(*lip[q], 0.15), own(x_mid + cx, cs, 0.9)))
    return len(CONES) + len(cones)


SHRUBLAND = (0.4, 0.66)  # the share of the climb the shrubland lies between, thinning out at either end


def shrubland(k) -> int:
    """Between details 6 and 5, the ranch land and the cinder: where the pasture gives out and before the cinder is bare, the mountain wears
    its subalpine shrubland. Low domed shrubs in dull greens stand a few metres apart, a māmane tree in yellow
    flower among them now and then, with tussocks of bleached grass between."""
    rng, s, B = k.rng, k.s, k.B
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    grown = 0
    for i in range(6, k.n - 6):
        share = shares[i // 25]
        thick = _smooth(SHRUBLAND[0], SHRUBLAND[0] + 0.07, share) * (1 - _smooth(SHRUBLAND[1] - 0.1, SHRUBLAND[1], share))
        if thick <= 0:
            continue
        for _ in range(3):
            if rng.random() > 0.36 * thick:
                continue
            side = rng.choice((1, -1))
            off = (k.kerb + rng.uniform(2.8, 34.0)) * side
            x, y, _ = k.road.at(i, off)
            x, y = x + rng.uniform(-2.0, 2.0), y + rng.uniform(-2.0, 2.0)
            if not k.road.clear_of_road(x, y, 7.0, i):
                continue
            z = k.ground(x, y, i, off)
            pick = rng.random()
            if pick < 0.5:
                lens(B["hk-shrub" if rng.random() < 0.6 else "hk-shrub-dark"], (x, y, z + 0.1), rng.uniform(0.8, 1.8), rng.uniform(0.6, 1.1), rng, 5)
            elif pick < 0.86:
                # A tussock: a few blades of dry grass.
                for q in range(4):
                    a = q * math.tau / 4 + rng.uniform(-0.4, 0.4)
                    r = rng.uniform(0.3, 0.5)
                    tip = (x + math.cos(a) * r, y + math.sin(a) * r, z + rng.uniform(0.5, 0.8))
                    left, right = (x - math.sin(a) * 0.14, y + math.cos(a) * 0.14, z), (x + math.sin(a) * 0.14, y - math.cos(a) * 0.14, z)
                    B["hk-tussock"].tri(left, right, tip)
                    B["hk-tussock"].tri(right, left, tip)
            else:
                # A māmane: a small gnarled tree, its crown yellow with flower.
                k.prism(B["trunk-dark"], (x, y, z - 0.3), 0.16, 2.2, 5, 0.1)
                lens(B["hk-shrub"], (x, y, z + 2.0), rng.uniform(1.4, 2.1), 1.3, rng, 6)
                lens(B["hk-mamane"], (x + rng.uniform(-0.5, 0.5), y + rng.uniform(-0.5, 0.5), z + 2.7), rng.uniform(0.8, 1.3), 0.8, rng, 6)
            grown += 1
    return grown


def board(paint, k, i: int, off: float, wide: float, tall: float, up: float, face, border=None, post=None) -> tuple:
    """A sign beside the road at sample i, facing the riders who come up to it: a board `wide` by `tall` with its
    foot `up` off the ground, on a post, with a border round it if one is given. Returns the board's corner, the
    unit vector along it and the one it faces, for whatever is painted on it."""
    h = k.s[i]["h"]
    along, out = (math.sin(h), -math.cos(h)), (-math.cos(h), -math.sin(h))
    x, y, z = k.road.at(i, off)
    corner = (x - along[0] * wide / 2, y - along[1] * wide / 2, 0.0)
    paint.box((x - out[0] * 0.08, y - out[1] * 0.08, z - 0.3), (0.1, 0.1, up + tall * 0.6 + 0.3), h, post or _lin(0x8A8E90), 0.8)
    if border is not None:
        paint.panel(corner, along, out, -0.07, wide + 0.07, z + up - 0.07, z + up + tall + 0.07, 0.02, border)
    paint.panel(corner, along, out, 0.0, wide, z + up, z + up + tall, 0.04, face)
    return corner, along, out, z + up


CARS = (0xE4E4E0, 0xB8342E, 0xA9B0B8, 0x3F7FC8, 0xE8E2D0, 0xD9B03A)
JACKETS = (0xD9483A, 0x2F7FB8, 0xF2C230, 0x3F8A5A, 0x8A4A9A, 0xE8742E, 0x2A3A5A)


def visitor(paint, rng, c, yaw: float) -> None:
    """Somebody out of their car at the summit's cold: long trousers, a bright jacket, a hat."""
    cs, sn = math.cos(yaw), math.sin(yaw)
    h = rng.uniform(0.92, 1.08)
    jacket, legs, skin = _lin(JACKETS[rng.randrange(len(JACKETS))]), _lin(rng.choice((0x2A2E38, 0x4A4438, 0x3A3A40))), _lin(rng.choice((0xE8B894, 0xC68A5E, 0x8A5A3A)))
    for side in (1, -1):
        paint.box((c[0] - sn * 0.11 * side, c[1] + cs * 0.11 * side, c[2]), (0.18, 0.17, 0.86 * h), yaw, legs, 0.6)
        paint.box((c[0] - sn * 0.29 * side, c[1] + cs * 0.29 * side, c[2] + 0.88 * h), (0.13, 0.12, 0.56 * h), yaw, jacket, 0.9)
    paint.box((c[0], c[1], c[2] + 0.84 * h), (0.26, 0.46, 0.62 * h), yaw, jacket, 0.85)
    paint.box((c[0], c[1], c[2] + 1.46 * h), (0.21, 0.2, 0.24 * h), yaw, skin, 1.0)
    paint.box((c[0], c[1], c[2] + 1.66 * h), (0.25, 0.24, 0.1), yaw, _lin(rng.choice((0x2A2A2E, 0xC8322C, 0xE8E2D0))), 1.0)


def car(paint, rng, c, yaw: float) -> None:
    """A parked car: the body, the cabin with its dark glass, four wheels."""
    cs, sn = math.cos(yaw), math.sin(yaw)
    body, glass, tyre = _lin(CARS[rng.randrange(len(CARS))]), _lin(0x1E2A34), _lin(0x18181A)
    suv = rng.random() < 0.5
    paint.box((c[0], c[1], c[2] + 0.3), (4.4, 1.8, 0.7 if suv else 0.6), yaw, body, 0.85)
    top = 0.3 + (0.7 if suv else 0.6)
    paint.box((c[0] - cs * 0.3, c[1] - sn * 0.3, c[2] + top), (2.5 if suv else 2.1, 1.66, 0.62), yaw, glass, 1.0)
    paint.box((c[0] - cs * 0.3, c[1] - sn * 0.3, c[2] + top + 0.62), (2.5 if suv else 2.0, 1.7, 0.08), yaw, body, 1.0)
    for fwd in (1.4, -1.4):
        paint.box((c[0] + cs * fwd, c[1] + sn * fwd, c[2]), (0.66, 1.86, 0.64), yaw, tyre, 1.0)


def pull_outs(k) -> dict:
    """Detail 9, the road edge: a narrow road with no barrier still has places to stop. Every mile or so above
    the ranch land a gravel pull-out widens the downhill shoulder, with a car or three parked on it and their
    people standing at its edge, looking out over the cloud."""
    land, near, rng, s = Painted(k), Painted(k, "hk-detail"), k.rng, k.s
    gravel = _lin(0x8A7A6E)
    shares = [height_share(k, i) for i in range(k.n)]
    laid = cars = people = 0
    last = -400
    for i in range(20, k.n - 40):
        if shares[i] < 0.42 or i - last < 380 or any(abs(s[q]["k"]) > 1 / 200 for q in range(i - 3, i + 12)):
            continue
        # The downhill side: the lower of the two, and clear of the road's other legs.
        lows = {sd: k.height_at(*k.road.at(i + 4, (k.kerb + 22.0) * sd)[:2]) for sd in (1, -1)}
        side = min(lows, key=lows.get)
        if not k.room(i + 4, (k.kerb + 16.0) * side, 20.0):
            continue
        yaw = s[i + 4]["h"]
        for q in range(i, i + 9):
            x, y, z = k.road.at(q, (k.kerb + 5.4) * side)
            floor = k.height_at(*k.road.at(q, (k.kerb + 10.5) * side)[:2])
            land.box((x, y, min(floor, z) - 2.0), (k.step + 0.2, 8.4, z - min(floor, z) + 2.02), s[q]["h"], gravel, 0.95)
        for q in range(rng.randint(1, 3)):
            x, y, z = k.road.at(i + 1 + q * 3, (k.kerb + 5.0) * side)
            car(near, rng, (x, y, z + 0.02), yaw + rng.uniform(-0.08, 0.08))
            cars += 1
            for _ in range(rng.randint(1, 2)):
                px, py, pz = k.P(i + 1 + q * 3, rng.uniform(-1.5, 1.5), (k.kerb + rng.uniform(8.0, 9.0)) * side)
                visitor(near, rng, (px, py, z + 0.02), yaw - side * math.pi / 2 + rng.uniform(-0.5, 0.5))
                people += 1
        laid += 1
        last = i
    return {"pullOuts": laid, "parkedCars": cars, "visitors": people}


def summit_stop(k) -> dict:
    """Details 8 and 3, the summit: where the road ends below the domes there is the summit's car park, full by
    sunrise, and beside it the summit shelter, a low house of glass on a lava-stone base under a shingled roof,
    where people stand out of the wind to look into the crater."""
    land, near, rng, s = Painted(k), Painted(k, "hk-detail"), k.rng, k.s
    tarmac, line, stone, glass, post, roof = _lin(0x6A6466), _lin(0xE8E6DE), _lin(0x5A4E48), _lin(0x6E8E9E), _lin(0xE8E6DE), _lin(0x5A4A40)
    i0 = k.road.index(k.length) - 62  # short of the finish straight and its barriers
    drops = {sd: abs(k.height_at(*k.road.at(i0 + 8, (k.kerb + 12.0) * sd)[:2]) - s[i0 + 8]["z"]) for sd in (1, -1)}
    side = min(drops, key=drops.get)
    for q in range(i0, i0 + 16):
        x, y, z = k.road.at(q, (k.kerb + 7.0) * side)
        floor = min(k.height_at(*k.road.at(q, (k.kerb + 14.0) * side)[:2]), z)
        land.box((x, y, floor - 2.0), (k.step + 0.2, 13.0, z - floor + 2.02), s[q]["h"], tarmac, 0.9)
    cars = people = 0
    for q in range(i0 + 1, i0 + 15):
        x, y, z = k.road.at(q, (k.kerb + 9.5) * side)
        yaw = s[q]["h"] + math.pi / 2
        # A bay's line, and most bays taken.
        lx, ly, _ = k.P(q, k.step / 2, (k.kerb + 9.5) * side)
        near.box((lx, ly, z + 0.02), (5.0, 0.12, 0.02), yaw, line, 1.0)
        if rng.random() < 0.7:
            car(near, rng, (x, y, z + 0.03), yaw + rng.uniform(-0.05, 0.05))
            cars += 1
        if rng.random() < 0.45:
            px, py, _ = k.P(q, rng.uniform(-1.0, 1.0), (k.kerb + rng.uniform(3.0, 5.5)) * side)
            visitor(near, rng, (px, py, z + 0.03), rng.uniform(0, math.tau))
            people += 1
    # The shelter, at the car park's upper end.
    j = i0 + 20
    x, y, z = k.road.at(j, (k.kerb + 9.0) * side)
    h = s[j]["h"]
    ground = min(k.height_at(x, y), z)
    land.box((x, y, ground - 1.0), (9.4, 9.4, z - ground + 1.9), h, stone, 0.8)
    near.box((x, y, z + 0.9), (8.4, 8.4, 2.3), h, glass, 1.0)
    for a in (-1, 1):
        for b in (-1, 0, 1):
            for cx, cy in ((a * 4.2, b * 4.2), (b * 4.2, a * 4.2)):
                near.box((x + math.cos(h) * cx - math.sin(h) * cy, y + math.sin(h) * cx + math.cos(h) * cy, z + 0.9), (0.3, 0.3, 2.3), h, post, 1.0)
    near.roof((x, y, z + 3.2), 10.6, 10.6, 2.2, h, roof)
    return {"summitCars": cars, "summitVisitors": people}


FRUIT = (0xF2C230, 0x5E9A3A, 0xE8842E, 0xD8D23A, 0xB8342E, 0x7A5A2A)
STAND_ROOFS = (0x3F8F9A, 0xB85A3A, 0xE8E2D0, 0x4F8A4A)


def fruit_stands(k) -> dict:
    """Detail 7, the coastal start: the stands of the shore road. In front of the cane, on the mountain's side,
    there stands every 400 m or so a fruit stand: four posts and a tin roof, a plank counter stacked with
    pineapples, coconuts, papayas and hands of bananas, a painted board on the roof's edge, a pickup pulled in
    beside it and somebody buying."""
    near, rng, s = Painted(k, "hk-detail"), k.rng, k.s
    wood, white = _lin(0x8A6A44), _lin(0xF2EEE2)
    stands = 0
    last = -200
    for i in range(75, k.n - 30):  # clear of the start line and its crowd
        if height_share(k, i) > COAST_TO:
            break
        if i - last < 110 or TOWN[0] - 12 <= i <= TOWN[1] + 12 or any(abs(s[q]["k"]) > 1 / 150 for q in range(i - 3, i + 8)):
            continue
        shore = 1 if math.cos(s[i]["h"]) > 0 else -1
        off = -(k.kerb + 4.6) * shore
        x, y, z = k.road.at(i, off)
        if not k.road.clear_of_road(x, y, 6.0, i):
            continue
        h = s[i]["h"]
        cs, sn = math.cos(h), math.sin(h)
        at = lambda fwd, left, up=0.0: (x + cs * fwd - sn * left, y + sn * fwd + cs * left, z + up)  # noqa: E731
        front = shore  # the counter faces the road
        for fwd in (-1.9, 1.9):
            for left in (-1.2, 1.2):
                near.box(at(fwd, left), (0.12, 0.12, 2.5), h, wood, 0.85)
        near.roof(at(0, 0, 2.5), 4.8, 3.6, 0.5, h, _lin(STAND_ROOFS[stands % len(STAND_ROOFS)]))
        near.box(at(0, 1.0 * front), (3.6, 0.8, 0.95), h, wood, 0.9)
        for q in range(6):
            e = -1.5 + q * 0.6
            near.box(at(e, 1.0 * front, 0.95), (0.5, 0.66, rng.uniform(0.22, 0.42)), h, _lin(FRUIT[(q + stands) % len(FRUIT)]), 0.85)
        # Hands of bananas hung from the roof's edge, and the painted board above them.
        for q in range(5):
            near.box(at(-1.4 + q * 0.7, 1.55 * front, 1.9), (0.3, 0.14, 0.5), h, _lin(0xF2C230), 0.9)
        near.box(at(0, 1.85 * front, 2.5), (3.0, 0.07, 0.6), h, white, 1.0)
        near.box(at(0, 1.9 * front, 2.68), (2.2, 0.07, 0.22), h, _lin(FRUIT[(stands + 4) % len(FRUIT)]), 1.0)
        car(near, rng, at(6.4, 0.2, 0.02), h + rng.uniform(-0.1, 0.1))
        for q in range(rng.randint(1, 2)):
            visitor(near, rng, at(-0.8 + q * 1.3, 2.3 * front, 0.02), h - front * math.pi / 2 + rng.uniform(-0.3, 0.3))
        stands += 1
        last = i
    return {"fruitStands": stands}


def hairpin_signs(k) -> int:
    """Detail 1, the switchback road: before each switchback stands the warning for it, a yellow diamond-coloured
    board with the black hairpin arrow bent the way the road turns, and under it the advised speed, 15."""
    paint, s = Painted(k), k.s
    yellow, black = _lin(0xF2C230), _lin(0x1C1C1E)
    stood, turning = 0, False
    for i in range(14, k.n - 10):
        tight = abs(s[i]["k"]) > 1 / 40
        if tight and not turning:
            j, left = i - 9, s[i]["k"] > 0
            if abs(s[j]["k"]) < 1 / 60:
                wide = 1.0
                corner, along, out, z = board(paint, k, j, -(k.kerb + 1.3), wide, 1.0, 1.75, yellow, black)

                def ink(a0: float, a1: float, z0: float, z1: float, corner=corner, along=along, out=out, z=z, left=left) -> None:
                    if left:
                        a0, a1 = wide - a1, wide - a0
                    paint.panel(corner, along, out, a0, a1, z + z0, z + z1, 0.06, black)

                # Up the stem, over the top and back down to the arrow's head.
                ink(0.2, 0.34, 0.14, 0.8)
                ink(0.2, 0.72, 0.68, 0.82)
                ink(0.58, 0.72, 0.42, 0.8)
                ink(0.48, 0.82, 0.3, 0.44)
                ink(0.58, 0.72, 0.2, 0.32)
                # The plaque under it: 15.
                paint.panel(corner, along, out, 0.14, 0.86, z - 0.62, z - 0.1, 0.04, yellow)
                for a0, a1, z0, z1 in ((0.27, 0.34, -0.54, -0.18), (0.46, 0.7, -0.25, -0.18), (0.46, 0.53, -0.36, -0.18), (0.46, 0.7, -0.4, -0.33), (0.63, 0.7, -0.54, -0.33), (0.46, 0.7, -0.54, -0.47)):
                    paint.panel(corner, along, out, a0, a1, z + z0, z + z1, 0.06, black)
                stood += 1
        turning = tight
    return stood


def park_signs(k) -> dict:
    """Details 1 and 9, the switchback road and its edge: the signs of a national park's road. A green board with a
    white border marks every tenth of the climb, as the elevation signs do each thousand feet; yellow diamonds
    warn of nēnē on the road through the shrubland; and where the park begins stands its sign, a brown board on a
    plinth of lava stone, with the entrance station's kiosk just beyond it."""
    paint, s = Painted(k), k.s
    shares = [height_share(k, i) for i in range(k.n)]
    green, white, yellow, black, brown = _lin(0x1F6B45), _lin(0xF2F2EE), _lin(0xF2C21E), _lin(0x1E1E20), _lin(0x5A3A26)
    right = -(k.kerb + 2.4)

    def straight(i: int) -> int:
        while i < k.n - 30 and any(abs(s[q]["k"]) > 1 / 120 for q in range(i - 4, i + 5)):
            i += 5
        return i

    elevation = nene = 0
    for tenth in range(1, 10):
        i = straight(min(range(k.n), key=lambda q: abs(shares[q] - tenth / 10)))
        corner, along, out, z = board(paint, k, i, right, 1.5, 0.75, 1.5, green, white)
        # Its line of lettering, as a pale bar, and the figure under it.
        paint.panel(corner, along, out, 0.2, 1.3, z + 0.46, z + 0.58, 0.06, white)
        paint.panel(corner, along, out, 0.4, 1.1, z + 0.14, z + 0.36, 0.06, white)
        elevation += 1
    for i in range(60, k.n - 60, 190):
        if not 0.38 < shares[i] < 0.9:
            continue
        i = straight(i)
        corner, along, out, z = board(paint, k, i, right, 0.0, 0.0, 1.5, yellow)
        # A diamond, and the goose on it: a body, a neck and a head.
        mid = (corner[0], corner[1])
        pt = lambda a, up, proud=0.05: (mid[0] + along[0] * a + out[0] * proud, mid[1] + along[1] * a + out[1] * proud, z + up)  # noqa: E731
        paint.face((pt(0, 0.0), pt(0.48, 0.48), pt(0, 0.96), pt(-0.48, 0.48)), (yellow,) * 4)
        paint.face((pt(-0.2, 0.36, 0.07), pt(0.16, 0.36, 0.07), pt(0.2, 0.52, 0.07), pt(-0.14, 0.5, 0.07)), (black,) * 4)
        paint.face((pt(0.1, 0.5, 0.07), pt(0.2, 0.5, 0.07), pt(0.24, 0.72, 0.07), pt(0.16, 0.72, 0.07)), (black,) * 4)
        nene += 1
    # The park's sign and its entrance station, where the shrubland begins.
    i = straight(min(range(k.n), key=lambda q: abs(shares[q] - 0.44)))
    x, y, z = k.road.at(i, right - 1.6)
    h = s[i]["h"]
    paint.box((x, y, z - 0.4), (0.9, 4.6, 1.3), h, _lin(0x3A3432), 0.8)
    corner, along, out, base = board(paint, k, i, right - 1.6, 4.0, 1.25, 1.0, brown, None, _lin(0x3A3432))
    paint.panel(corner, along, out, 0.4, 3.6, base + 0.74, base + 0.98, 0.06, white)
    paint.panel(corner, along, out, 0.9, 3.1, base + 0.3, base + 0.5, 0.06, white)
    j = i + 14
    x, y, z = k.road.at(j, right - 1.2)
    paint.box((x, y, z - 0.3), (3.2, 2.6, 2.9), s[j]["h"], _lin(0x6E4E36), 0.8)
    paint.roof((x, y, z + 2.6), 4.6, 3.8, 0.9, s[j]["h"], _lin(0x4A3A30))
    corner = k.road.at(j, right + 0.12)
    hx, hy = math.cos(s[j]["h"]), math.sin(s[j]["h"])
    paint.panel((corner[0] + hx * 0.9, corner[1] + hy * 0.9, 0.0), (-hx, -hy), (-hy, hx), 0.0, 1.8, z + 1.0, z + 2.0, 0.03, _lin(0x27303A))
    return {"elevationSigns": elevation, "neneSigns": nene}


def silversword_garden(k) -> int:
    """Detail 4, silverswords: near the top a garden of them is kept beside the road, as at the park's summit
    stops. A boardwalk runs out from the shoulder between two low rails, a sign stands at its head, and the plants
    grow thick on either side of it, large ones, several in flower."""
    paint, rng, s = Painted(k), k.rng, k.s
    shares = [height_share(k, i) for i in range(k.n)]
    wood, rail, brown, white = _lin(0x9A7E5A), _lin(0x6A543C), _lin(0x5A3A26), _lin(0xF2F2EE)
    i = min(range(k.n), key=lambda q: abs(shares[q] - 0.86))
    while i < k.n - 40 and (any(abs(s[q]["k"]) > 1 / 150 for q in range(i - 6, i + 7)) or not k.room(i, -(k.kerb + 40.0), 16.0)):
        i += 4
    h = s[i]["h"]
    right = (math.sin(h), -math.cos(h))
    x0, y0, z0 = k.road.at(i, -(k.kerb + 2.0))
    planted = 0
    for q in range(14):
        out = q * 2.0
        x, y = x0 + right[0] * out, y0 + right[1] * out
        z = k.height_at(x, y) + 0.25
        paint.box((x, y, z - 0.25), (1.5, 2.02, 0.25), h, wood if q % 2 else tuple(c * 0.9 for c in wood[:3]) + (1.0,), 0.85)
        for side in (1, -1):
            px, py = x + math.cos(h) * 0.82 * side, y + math.sin(h) * 0.82 * side
            if q % 2 == 0:
                paint.box((px, py, z), (0.09, 0.09, 0.95), h, rail, 0.8)
            paint.box((px, py, z + 0.86), (0.07, 2.02, 0.07), h, rail, 1.0)
            # The garden either side of the walk.
            for _ in range(2):
                gx = px + math.cos(h) * rng.uniform(1.2, 7.5) * side + right[0] * rng.uniform(-1.0, 1.0)
                gy = py + math.sin(h) * rng.uniform(1.2, 7.5) * side + right[1] * rng.uniform(-1.0, 1.0)
                silversword(k, gx, gy, k.height_at(gx, gy), rng.random() < 0.3)
                planted += 1
    corner, along, out, base = board(paint, k, i - 1, -(k.kerb + 3.4), 1.3, 0.8, 0.9, brown, None, rail)
    paint.panel(corner, along, out, 0.15, 1.15, base + 0.5, base + 0.64, 0.06, white)
    paint.panel(corner, along, out, 0.15, 0.85, base + 0.2, base + 0.3, 0.06, white)
    return planted


def boulder(k, b, c, r: float) -> None:
    """A lump of lava: an irregular rock, wider than it is tall, sunk a little into the cinder."""
    rng = k.rng
    ring = [(c[0] + math.cos(q * math.tau / 6) * r * rng.uniform(0.7, 1.2), c[1] + math.sin(q * math.tau / 6) * r * rng.uniform(0.7, 1.2), c[2] + r * rng.uniform(0.15, 0.45)) for q in range(6)]
    foot = [(p[0] + (p[0] - c[0]) * 0.15, p[1] + (p[1] - c[1]) * 0.15, c[2] - 0.3) for p in ring]
    top = (c[0] + rng.uniform(-0.3, 0.3) * r, c[1] + rng.uniform(-0.3, 0.3) * r, c[2] + r * rng.uniform(0.6, 0.95))
    for q in range(6):
        n = (q + 1) % 6
        b.quad(foot[q], foot[n], ring[n], ring[q])
        b.tri(ring[q], ring[n], top)


def lava_field(k) -> int:
    """Detail 5, volcanic cinder: above the scrub the slopes are strewn with lava, black and oxidised red, from
    fist-sized clinker to boulders a rider could shelter behind, thickest in the outcrops of old flows."""
    rng, s, B = k.rng, k.s, k.B
    shares = [height_share(k, i) for i in range(0, k.n, 25)]
    strewn = 0
    for i in range(6, k.n - 6):
        if shares[i // 25] < 0.54:
            continue
        outcrop = math.sin(s[i]["d"] * 0.021) > 0.55
        if rng.random() > (0.5 if outcrop else 0.1):
            continue
        side = rng.choice((1, -1))
        off = (k.kerb + rng.uniform(2.6, 30.0)) * side
        cx, cy, _ = k.road.at(i, off)
        for _ in range(rng.randint(2, 5) if outcrop else 1):
            x, y = cx + rng.uniform(-4.0, 4.0), cy + rng.uniform(-4.0, 4.0)
            if not k.road.clear_of_road(x, y, 7.2, i):
                continue
            boulder(k, B["hk-lava" if rng.random() < 0.7 else "hk-lava-red"], (x, y, k.ground(x, y, i, off)), rng.uniform(0.4, 1.1) * (1.9 if outcrop and rng.random() < 0.25 else 1.0))
            strewn += 1
    return strewn


def scenery(k) -> dict:
    posts = reflector_posts(k)
    cloud = cloud_sea(k)
    islands = island_peaks(k)
    swords = silverswords(k)
    domes = science_city(k)
    ranch = ranch_land(k)
    steads = ranch_steads(k)
    ranch.update(steads)
    ranch.update(jacaranda_avenues(k))
    coast = coastal_start(k)
    coast.update(plantation_town(k))
    coast.update(fruit_stands(k))
    coast.update(beach_park(k))
    cones = crater(k)
    lava = lava_field(k)
    signs = park_signs(k)
    signs["hairpinSigns"] = hairpin_signs(k)
    signs.update(pull_outs(k))
    signs.update(summit_stop(k))
    garden = silversword_garden(k)
    shrubs = shrubland(k)
    return {"efforts": k.gates("accent", "flag-1", CROWD), "posts": posts, "cloudTop": round(cloud), "peaksAboveCloud": islands, "silverswords": swords, "domes": domes, **ranch, **coast, "cinderCones": cones, "boulders": lava, "shrubs": shrubs, **signs, "gardenSilverswords": garden}
