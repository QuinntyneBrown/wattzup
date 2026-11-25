"""The worlds' themes for build_course.py (ADR 0034): each map's palette, sky, land, road edge and scenery.

Ibiza Sunset Strip keeps its own scenery in build_course.py; every other course names a theme here. A theme
is data (colours, the sky the app draws, the shape of the land) and one function that dresses the road with
the world's concept (`frontend/projects/world/src/world-<name>.ts`, `docs/class-worlds.md`) as geometry.

The scenery functions take a `Kit`: the road, the builders by material, the land's height and a seeded random
source, so the same course file always builds the same map.
"""

from __future__ import annotations

import math
import random

# Materials the themes add to build_course.MATERIALS: name -> colour, roughness, glow.
MATERIALS: dict[str, dict] = {
    "verge": {"color": 0x6E8F3E, "rough": 1.0},
    "gravel": {"color": 0x9A8F80, "rough": 1.0},
    "pine": {"color": 0x2D5A38, "rough": 0.9},
    "foliage": {"color": 0x4E7F34, "rough": 0.9},
    "cypress": {"color": 0x2A4A2A, "rough": 0.9},
    "hay": {"color": 0xE0B85A, "rough": 1.0},
    "barn": {"color": 0xA8332A, "rough": 0.9},
    "roof-grey": {"color": 0x5A5A60, "rough": 0.8},
    "roof-tile": {"color": 0xB4532E, "rough": 0.9},
    "roof-slate": {"color": 0x3E4450, "rough": 0.8},
    "metal": {"color": 0xC8CCD2, "rough": 0.4, "metal": 0.6},
    "turbine": {"color": 0xF2F3F5, "rough": 0.5},
    "fence": {"color": 0x7A5A3A, "rough": 0.9},
    "facade-0": {"color": 0xE8C8A0, "rough": 0.9},
    "facade-1": {"color": 0xD9A27A, "rough": 0.9},
    "facade-2": {"color": 0xC9D6C0, "rough": 0.9},
    "facade-3": {"color": 0xF0E0B8, "rough": 0.9},
    "facade-4": {"color": 0xB8C8D8, "rough": 0.9},
    "facade-5": {"color": 0xE6B4B0, "rough": 0.9},
    "window": {"color": 0x2A3440, "rough": 0.3, "double": True},
    "glow-window": {"color": 0xFFC878, "glow": 1.6, "double": True},
    "glow-lamp": {"color": 0xFFE2A8, "glow": 3.0},
    "brick": {"color": 0x7A3E2E, "rough": 0.95},
    "container-0": {"color": 0xC0392B, "rough": 0.7},
    "container-1": {"color": 0x2E6DA4, "rough": 0.7},
    "container-2": {"color": 0xE0A32E, "rough": 0.7},
    "container-3": {"color": 0x3E8E5A, "rough": 0.7},
    "crane": {"color": 0xE8B020, "rough": 0.6},
    "tower": {"color": 0x1C2030, "rough": 0.5, "metal": 0.3},
    "deco-0": {"color": 0xF7C6D9, "rough": 0.8},
    "deco-1": {"color": 0xB8F0E6, "rough": 0.8},
    "deco-2": {"color": 0xFFF1C4, "rough": 0.8},
    "deco-3": {"color": 0xD6C8FF, "rough": 0.8},
    "limestone": {"color": 0xD8D2C4, "rough": 1.0},
    "granite": {"color": 0x7C7E84, "rough": 1.0},
    "snow": {"color": 0xF4F7FA, "rough": 0.7},
    "chalet-wood": {"color": 0x6E4528, "rough": 0.9},
    "dolomite-pale": {"color": 0xCFC5B6, "rough": 0.92},
    "dolomite-gold": {"color": 0xF5B488, "rough": 0.9},
    "dolomite-rose": {"color": 0xF0826C, "rough": 0.9},
    "dolomite-shade": {"color": 0x52607A, "rough": 0.95},
    "larch-aged": {"color": 0x4A3222, "rough": 0.92},
    "larch-warm": {"color": 0x8A5A36, "rough": 0.86},
    "chalet-plaster": {"color": 0xF2EDE4, "rough": 0.88},
    "geranium-red": {"color": 0xD92B3A, "rough": 0.82},
    "glacier-ice": {"color": 0xD8ECFA, "rough": 0.45},
    "lago-turquoise": {"color": 0x2F9CA8, "rough": 0.28},
    "parasol-red": {"color": 0xC82834, "rough": 0.78},
    "copper-patina": {"color": 0x3E7C6E, "rough": 0.55, "metal": 0.35},
    "ladin-blue": {"color": 0x2E74B8, "rough": 0.78},
    "steel": {"color": 0x9AA2AC, "rough": 0.42, "metal": 0.65},
    "accent-2": {"color": 0xF05692, "rough": 0.72},
    "parapet": {"color": 0x9A958C, "rough": 1.0},
    "rail": {"color": 0xB8BEC4, "rough": 0.4, "metal": 0.7},
    "flag-0": {"color": 0xE23A4E, "rough": 0.8, "double": True},
    "flag-1": {"color": 0xF2C230, "rough": 0.8, "double": True},
    "flag-2": {"color": 0x2E7AD8, "rough": 0.8, "double": True},
    "flag-3": {"color": 0xF4F0E6, "rough": 0.8, "double": True},
    "umbrella": {"color": 0xE8503A, "rough": 0.8, "double": True},
    "lighthouse": {"color": 0xF4F0E6, "rough": 0.8},
    "car-0": {"color": 0xFF5AA8, "rough": 0.3, "metal": 0.4},
    "car-1": {"color": 0x3AE8FF, "rough": 0.3, "metal": 0.4},
    "car-2": {"color": 0xF4F0E6, "rough": 0.3, "metal": 0.4},
    "accent": {"color": 0xD7FF3A, "glow": 1.6},
    "accent-2": {"color": 0x3AE8FF, "glow": 1.6},
    "moon": {"color": 0xE8EEFF, "glow": 1.5},
}
FACADES = [f"facade-{i}" for i in range(6)]
CONTAINERS = [f"container-{i}" for i in range(4)]
DECOS = [f"deco-{i}" for i in range(4)]
FLAGS = [f"flag-{i}" for i in range(4)]
CARS = [f"car-{i}" for i in range(3)]

# Each theme: the sky the app draws (horizon up), the haze, the sun's and the fill light's colours, the land, the
# road's edge, the turns and the gradient. `palette` recolours the shared materials.
THEMES: dict[str, dict] = {
    # Ibiza Sunset Strip, the first map: its land and its scenery are its own (build_terrain and build_scenery in
    # build_course.py, `own`), and the rest is a theme's: the sunset the app draws, the bends its stages are dealt, the
    # hills its efforts climb, and what the course file tells the app of its lights.
    "ibiza": {
        "own": True,
        "sky": [0xFFC27A, 0xF7A070, 0xE0708A, 0x7A4F9A, 0x2F2A5E],
        "haze": 0xF2A77A,
        "light": [0xFF9A5A, 2.6],
        "fill": [0xFFD9C0, 0x6A5A7A],
        "sun_altitude": 0.11,
        "terrain": {"sea": True},
        "centre": "yellow",
        # A coast road: an effort winds up onto a headland through esses and a hairpin, a recovery sweeps back down
        # to the strip, and the calm stretches between are the strip itself, with a bend in it.
        "turns": {"work": (("ess", 0.4), ("hairpin", 0.18), ("sweep", 0.3), ("straight", 0.12)),
                  "recover": (("sweep", 0.5), ("ess", 0.3), ("straight", 0.2)),
                  "calm": (("sweep", 0.45), ("straight", 0.35), ("ess", 0.2))},
        # The hills: each effort climbs in the first half of its stretch and holds the headland's height; each
        # recovery drops off it in its first quarter. Steeper for a level than the flat maps, and the ground
        # between rolls a little, so the strip itself is never dead level.
        "grade": {"perLevel": 0.855, "ramp": {"work": 0.5, "recover": 0.25}, "roll": 3.3, "rollWave": 620.0},
    },
    "prairie": {
        "sky": [0xFFE0A8, 0xF8C987, 0xD8C49A, 0x93B0D0, 0x5578B0],
        "haze": 0xF0D4A0,
        "light": [0xFFC890, 2.8],
        "fill": [0xFFE6C8, 0x7A6A48],
        "sun_altitude": 0.14,
        "palette": {"asphalt": 0x3A3A40, "sand": 0x9AA050, "promenade": 0x8E9A4A, "sea": 0x8A8A48},
        "land": {"low": 0xC8A84E, "mid": 0x9AA850, "high": 0x7E9A46, "rock": 0x8A7A5A, "stripes": True},
        "terrain": {"sea": False, "rise": 10.0, "far": 2.0},
        "edge": "verge",
        "centre": "yellow",
        "turns": {"work": (("sweep", 0.45), ("straight", 0.3), ("ess", 0.2), ("hairpin", 0.05)),
                  "recover": (("sweep", 0.4), ("straight", 0.5), ("ess", 0.1)),
                  "calm": (("sweep", 0.35), ("straight", 0.6), ("ess", 0.05))},
        "grade": {"perLevel": 0.35, "roll": 3.0, "rollWave": 900.0},
        "reach": 1100.0,
    },
    "oldtown": {
        "sky": [0xF4E6CC, 0xD6E2EE, 0xA8C8E8, 0x6EA0DA, 0x3E74C0],
        "haze": 0xE2E4E0,
        "light": [0xFFF0D8, 3.0],
        "fill": [0xDCE8F4, 0x7A6A5A],
        "sun_altitude": 0.55,
        "palette": {"asphalt": 0x6A625C, "promenade": 0xB8AC98, "sand": 0x8E8676, "sea": 0x5E7A46},
        "land": {"low": 0x6E8A4A, "mid": 0x5E7E42, "high": 0x4E6E3A, "rock": 0x8A7E6A},
        "terrain": {"sea": False, "rise": 18.0, "far": 4.0},
        "edge": "pavement",
        "centre": "white",
        "turns": {"work": (("ess", 0.45), ("hairpin", 0.15), ("sweep", 0.15), ("straight", 0.25)),
                  "recover": (("ess", 0.35), ("straight", 0.4), ("sweep", 0.25)),
                  "calm": (("straight", 0.5), ("ess", 0.3), ("sweep", 0.2))},
        "grade": {"perLevel": 0.5, "roll": 3.5, "rollWave": 520.0},
        "reach": 1100.0,
    },
    "coast": {
        "sky": [0xFFC89A, 0xF6A87E, 0xC88AA0, 0x6A78B0, 0x2E3E78],
        "haze": 0xE8B494,
        "light": [0xFFB078, 2.8],
        "fill": [0xFFE0C8, 0x4A5A6A],
        "sun_altitude": 0.08,
        "palette": {"asphalt": 0x2E2E34, "sand": 0x7E8A4E, "promenade": 0x9A9282, "sea": 0x1E5E8E},
        "land": {"low": 0xC8B88A, "mid": 0x7E9448, "high": 0x5E7A3A, "rock": 0x7A6E62},
        "terrain": {"sea": True, "rise": 34.0, "far": 6.0, "cliff": True},
        "edge": "cliff",
        "centre": "yellow",
        "turns": {"work": (("hairpin", 0.2), ("ess", 0.35), ("sweep", 0.3), ("straight", 0.15)),
                  "recover": (("sweep", 0.5), ("ess", 0.25), ("straight", 0.25)),
                  "calm": (("sweep", 0.5), ("straight", 0.35), ("ess", 0.15))},
        "grade": {"perLevel": 0.6, "roll": 4.0, "rollWave": 900.0},
        "reach": 1100.0,
        "sea_clearance": 22.0,
    },
    "docklands": {
        "sky": [0x2A2448, 0x1C1C3C, 0x12142C, 0x0A0C1E, 0x05060F],
        "haze": 0x1E2040,
        "light": [0x9AB0FF, 0.9],
        "fill": [0x5A6AA8, 0x2A1E3A],
        "sun_altitude": 0.5,
        "palette": {"asphalt": 0x1E1F26, "promenade": 0x4A4C56, "sand": 0x3A3C44, "sea": 0x18304E,
                    "wall": 0x5A5C66, "chevron": 0x3AE8FF},
        "land": {"low": 0x2E3038, "mid": 0x34363E, "high": 0x3A3C44, "rock": 0x2A2C32},
        "terrain": {"sea": True, "rise": 3.0, "far": 1.0},
        "edge": "quay",
        "centre": "white",
        "turns": {"work": (("ess", 0.4), ("sweep", 0.25), ("hairpin", 0.1), ("straight", 0.25)),
                  "recover": (("straight", 0.45), ("sweep", 0.35), ("ess", 0.2)),
                  "calm": (("straight", 0.55), ("sweep", 0.3), ("ess", 0.15))},
        # The harbour bridges: each effort climbs a ramp over the first two fifths of its stretch and runs level across
        # the bridge; each recovery comes down off it in its first seventh. No rolling ground: the quays are flat.
        "grade": {"perLevel": 0.45, "ramp": {"work": 0.4, "recover": 0.15}},
        # Each of those climbs is a bridge: the quay stops, the road crosses water on piers between parapets.
        "bridges": True,
        "reach": 1100.0,
        "night": True,
        # After rain: how much of the ground holds water, 0 to 1. The app darkens it and mirrors the lamps in it.
        "wet": 0.55,
        # And it is still raining a little: how hard, 0 to 1. The app draws the rain falling through the lamplight.
        "rain": 0.5,
        # Street lamps on both kerbs: every this many samples from this one, this far behind the kerb, this tall.
        "lamps": {"every": 6, "start": 3, "off": 0.7, "height": 7.0, "glow": "glow-lamp"},
    },
    "dolomites": {
        "sky": [0xEAF2F8, 0xC6DDF0, 0x96C0E6, 0x5E98D6, 0x2E66B8],
        "haze": 0xD4E2EE,
        "light": [0xFFF4E0, 3.2],
        "fill": [0xD8E8F8, 0x4A6A3A],
        "sun_altitude": 0.6,
        "palette": {"asphalt": 0x34343A, "sand": 0x6E8A46, "promenade": 0x8A8478, "sea": 0x4E7A3A},
        "land": {"low": 0x6E9A48, "mid": 0x5A8A3E, "high": 0x8A8A70, "rock": 0xCFC6B4, "snow": 0xF2F5F8},
        "terrain": {"sea": False, "rise": 150.0, "far": 30.0, "valley": True},
        "edge": "guardrail",
        "centre": "white",
        "turns": {"work": (("hairpin", 0.4), ("ess", 0.3), ("sweep", 0.2), ("straight", 0.1)),
                  "recover": (("sweep", 0.45), ("ess", 0.25), ("hairpin", 0.1), ("straight", 0.2)),
                  "calm": (("sweep", 0.45), ("straight", 0.35), ("ess", 0.2))},
        "grade": {"perLevel": 0.6, "roll": 4.0, "rollWave": 1200.0, "climb": 2.5},
        "reach": 1100.0,
    },
    "vicecity": {
        "sky": [0xFFB070, 0xFF7A8A, 0xD04A9A, 0x6A2E8A, 0x24164A],
        "haze": 0xE87A8A,
        "light": [0xFF9A7A, 2.4],
        "fill": [0xFFB8D0, 0x4A2A5A],
        "sun_altitude": 0.06,
        "palette": {"asphalt": 0x26222E, "promenade": 0xE8D8C8, "sand": 0xF0D8A8, "sea": 0x2E6E9E,
                    "chevron": 0xFF4A9A, "wall": 0xF4E8DC},
        "land": {"low": 0xF0D8A8, "mid": 0xE8CC98, "high": 0x8AA058, "rock": 0xB8A080},
        "terrain": {"sea": True, "rise": 4.0, "far": 1.0},
        "edge": "beach",
        "centre": "yellow",
        "turns": {"work": (("sweep", 0.4), ("ess", 0.3), ("straight", 0.2), ("hairpin", 0.1)),
                  "recover": (("sweep", 0.4), ("straight", 0.45), ("ess", 0.15)),
                  "calm": (("straight", 0.55), ("sweep", 0.35), ("ess", 0.1))},
        "grade": {"perLevel": 0.4, "roll": 2.2, "rollWave": 640.0},
        "reach": 1100.0,
    },
    "granite": {
        "sky": [0xFFD8B0, 0xF2BCA8, 0xB8B4C8, 0x7E96C0, 0x3E5A9A],
        "haze": 0xE2CCC0,
        "light": [0xFFC8A0, 2.6],
        "fill": [0xE0D8E8, 0x4A4A52],
        "sun_altitude": 0.1,
        "palette": {"asphalt": 0x2E2E34, "sand": 0x6A6A62, "promenade": 0x8A867E, "sea": 0x5A6248},
        "land": {"low": 0x5E8040, "mid": 0x7A8A5E, "high": 0x9A9A94, "rock": 0x7C7E84, "snow": 0xF4F6FA},
        "terrain": {"sea": False, "rise": 120.0, "far": 24.0, "valley": True},
        "edge": "parapet",
        "centre": "white",
        "turns": {"work": (("hairpin", 0.5), ("ess", 0.25), ("sweep", 0.15), ("straight", 0.1)),
                  "recover": (("hairpin", 0.3), ("sweep", 0.35), ("ess", 0.2), ("straight", 0.15)),
                  "calm": (("sweep", 0.4), ("hairpin", 0.2), ("straight", 0.4))},
        "grade": {"perLevel": 0.5, "roll": 2.0, "rollWave": 600.0, "climb": 6.0},
        "reach": 1100.0,
    },
    "sellaronda": {
        "own": True,
        "builder": "sellaronda",
        "sky": [0xFFD0A0, 0xF89474, 0xD86E88, 0x6472B0, 0x233E7C],
        "haze": 0xE8B4AE,
        "light": [0xFFBA8C, 2.98],
        "fill": [0xCADAF8, 0x5E544A],
        "sun_altitude": 0.155,
        "palette": {"asphalt": 0x36363E, "sand": 0x62863C, "promenade": 0x8E887E, "sea": 0x4E7838, "chevron": 0x3AE8FF},
        "land": {"low": 0x4E7C34, "mid": 0x66963E, "high": 0x8A8A70, "rock": 0xCFC4B4, "snow": 0xF2F5FA},
        "terrain": {"sea": False},
        "edge": "guardrail",
        "centre": "white",
    },
}


# What a window's panel holds beyond its opening, in metres: each side, the sill beneath and the lintel above.
WINDOW_SURROUND = (0.18, 0.14, 0.24)


class Kit:
    """What a theme's scenery is built with."""

    def __init__(self, road, st, length, height_at, rng, builders, step, road_half):
        self.road, self.s, self.st, self.length = road, road.s, st, length
        self.height_at, self.rng, self.B = height_at, rng, builders
        # Coloured lights that stand still (a neon sign, a bridge's lit stays): where each throws its light on the
        # ground. The course file carries them and the app lights what is near (see `light`).
        self.lights: list[tuple] = []
        self.n, self.step, self.half = len(road.s), step, road_half
        self.kerb = road_half + 0.6
        # A longer map spreads more scenery over its larger land.
        self.scale = max(1.0, length / 11460.0)

    # --- Placing -------------------------------------------------------------------------------

    def P(self, i: int, along: float, left: float, up: float = 0.0):
        x, y, z = self.road.at(i, left, up)
        h = self.s[i]["h"]
        return (x + math.cos(h) * along, y + math.sin(h) * along, z)

    def ground(self, x: float, y: float, i: int, off: float) -> float:
        """The land's height at a place `off` metres beside sample i: the verge near the road, the land beyond."""
        z = self.s[i]["z"]
        if abs(off) < 10.0:
            return z
        return max(self.height_at(x, y), z - 6.0) if abs(off) < 20.0 else self.height_at(x, y)

    def straight(self, i: int, span: int = 5, limit: float = 1 / 120) -> bool:
        return all(abs(self.s[j]["k"]) < limit for j in range(max(0, i - span), min(self.n, i + span + 1)))

    def room(self, i: int, off: float, radius: float, lag: float = 70.0) -> bool:
        x, y, _ = self.road.at(i, off)
        return self.road.clear_of_road(x, y, radius, i, lag=lag)

    def centre(self):
        xs, ys = [p["x"] for p in self.s], [p["y"] for p in self.s]
        return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(max(xs) - min(xs), max(ys) - min(ys)) / 2

    # --- Shapes --------------------------------------------------------------------------------

    def prism(self, b, c, r: float, h: float, sides: int = 6, top_r: float | None = None, yaw: float = 0.0) -> None:
        top_r = r if top_r is None else top_r
        lo = [(c[0] + math.cos(yaw + a * math.tau / sides) * r, c[1] + math.sin(yaw + a * math.tau / sides) * r, c[2]) for a in range(sides)]
        hi = [(c[0] + math.cos(yaw + a * math.tau / sides) * top_r, c[1] + math.sin(yaw + a * math.tau / sides) * top_r, c[2] + h) for a in range(sides)]
        for a in range(sides):
            b.quad(lo[a], lo[(a + 1) % sides], hi[(a + 1) % sides], hi[a])
        if top_r > 0:
            b.faces.append(tuple(b.v(p) for p in hi))

    def cone(self, b, c, r: float, h: float, sides: int = 6, jitter: float = 0.0) -> None:
        rng = self.rng
        ring = [(c[0] + math.cos(a * math.tau / sides) * r * (1 + rng.uniform(-jitter, jitter)), c[1] + math.sin(a * math.tau / sides) * r * (1 + rng.uniform(-jitter, jitter)), c[2]) for a in range(sides)]
        top = (c[0], c[1], c[2] + h)
        for a in range(sides):
            b.tri(ring[a], ring[(a + 1) % sides], top)

    def blob(self, b, c, r: float) -> None:
        rng = self.rng
        top = (c[0], c[1], c[2] + r)
        ring = [(c[0] + math.cos(a) * r * rng.uniform(0.75, 1.2), c[1] + math.sin(a) * r * rng.uniform(0.75, 1.2), c[2] + rng.uniform(-0.25, 0.25) * r) for a in (0, 1.257, 2.513, 3.77, 5.027)]
        for q in range(5):
            b.tri(top, ring[q], ring[(q + 1) % 5])
            b.tri((c[0], c[1], c[2] - r * 0.8), ring[(q + 1) % 5], ring[q])

    def diamond(self, b, c, r: float) -> None:
        top, bot = (c[0], c[1], c[2] + r), (c[0], c[1], c[2] - r)
        ring = [(c[0] + r, c[1], c[2]), (c[0], c[1] + r, c[2]), (c[0] - r, c[1], c[2]), (c[0], c[1] - r, c[2])]
        for q in range(4):
            b.tri(top, ring[q], ring[(q + 1) % 4])
            b.tri(bot, ring[(q + 1) % 4], ring[q])

    def gable(self, b, c, along: float, across: float, rise: float, yaw: float) -> None:
        """A pitched roof on a box's top: the ridge runs along `along`."""
        cs, sn = math.cos(yaw), math.sin(yaw)

        def p(u, v, w):
            return (c[0] + u * cs - v * sn, c[1] + u * sn + v * cs, c[2] + w)

        a, d = along / 2 + 0.3, across / 2 + 0.4
        l0, l1, r0, r1 = p(-a, d, 0), p(a, d, 0), p(-a, -d, 0), p(a, -d, 0)
        t0, t1 = p(-a, 0, rise), p(a, 0, rise)
        b.quad(l0, l1, t1, t0)
        b.quad(r1, r0, t0, t1)
        b.tri(r0, l0, t0)
        b.tri(l1, r1, t1)

    def panel(self, b, i: int, along: float, off: float, up: float, w: float, h: float) -> None:
        """A flat panel on a wall facing the road (a window, a sign): two triangles, seen from both sides."""
        b.quad(self.P(i, along - w / 2, off, up), self.P(i, along + w / 2, off, up), self.P(i, along + w / 2, off, up + h), self.P(i, along - w / 2, off, up + h))

    def window(self, i: int, along: float, off: float, up: float, w: float, h: float, lit: bool, yaw: float) -> None:
        """A window on a wall facing the road: one flat panel the app draws as a frame, panes and the room behind,
        under a lintel and over a sill. The panel is `WINDOW_SURROUND` larger than the opening for those."""
        b = self.B.setdefault("windows", type(self.B["tower"])("Windows", "window"))
        if b.uvs is None:
            b.uvs = []
        # The window's own number, the same every build: which room is behind it.
        number = (i * 7919 + int(along * 13) * 31 + int(up * 7)) % 500
        side, sill, lintel = WINDOW_SURROUND
        base = len(b.verts)
        for da, du, u, v in ((-w / 2 - side, -sill, 0, 0), (w / 2 + side, -sill, 1, 0), (w / 2 + side, h + lintel, 1, 1), (-w / 2 - side, h + lintel, 0, 1)):
            b.verts.append(self.P(i, along + da, off, up + du))
            b.uvs.append((u + (2 if lit else 0), v + 2 * number))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def light(self, at, glow: str, reach: float, strength: float) -> None:
        """A coloured light at `at`, in a glowing material's colour: it lights the ground, and what stands on it,
        out to `reach` metres, `strength` strong beneath it against a street lamp's 1."""
        self.lights.append((at[0], at[1], glow, reach, strength))

    def door(self, i: int, along: float, off: float, up: float, w: float, h: float, lit: bool) -> None:
        """A loading door on a wall facing the road: one flat panel the app draws as a steel frame and a roller
        shutter, shut if it is dark and part-way up on a lit bay if it is lit. Its UV is a window's with 4 added
        across (see `window`)."""
        b = self.B.setdefault("windows", type(self.B["tower"])("Windows", "window"))
        if b.uvs is None:
            b.uvs = []
        number = (i * 7919 + int(along * 13) * 31 + 5) % 500
        base = len(b.verts)
        for da, du, u, v in ((-w / 2, 0, 0, 0), (w / 2, 0, 1, 0), (w / 2, h, 1, 1), (-w / 2, h, 0, 1)):
            b.verts.append(self.P(i, along + da, off, up + du))
            b.uvs.append((u + 4 + (2 if lit else 0), v + 2 * number))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def halo(self, at, glow: str) -> None:
        """The glow in the air round a light: four corners at one place, which the app spreads to face the eye. Its
        UV is the corner, 0 or 1 each way; its colour the light's."""
        b = self.B.setdefault("halos:" + glow, type(self.B["tower"])("Halos", glow))
        if b.uvs is None:
            b.uvs = []
        base = len(b.verts)
        for u, v in ((0, 0), (1, 0), (1, 1), (0, 1)):
            b.verts.append(tuple(at))
            b.uvs.append((u, v))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def fence(self, i: int, off: float, height: float) -> None:
        """A railing from this sample of the road to the next: one flat panel, whose posts and rails the app draws.
        Its UV is the metres along the road and the share of its height."""
        b = self.B.setdefault("fences", type(self.B["tower"])("Fences", "rail"))
        if b.uvs is None:
            b.uvs = []
        base = len(b.verts)
        for j, up, v in ((i, 0.0, 0.0), (i + 1, 0.0, 1.0), (i + 1, height, 1.0), (i, height, 0.0)):
            b.verts.append(self.road.at(j, off, 0.12 + up))
            b.uvs.append((j * self.step, up / height))
        b.faces.append((base, base + 1, base + 2, base + 3))

    def windows(self, b, i: int, along_c: float, off: float, width: float, floors: int, up0: float, floor_h: float, yaw: float, every: float = 2.6) -> None:
        cols = max(1, int(width / every))
        for f in range(floors):
            for k in range(cols):
                along = along_c - width / 2 + (k + 0.5) * width / cols
                self.panel(b, i, along, off, up0 + f * floor_h, 1.1, floor_h * 0.5)

    def person(self, c, yaw: float, mats) -> None:
        b = self.B[self.rng.choice(mats)]
        h = self.rng.uniform(0.92, 1.08)
        b.box(c, (0.2, 0.3, 0.8 * h), yaw)
        b.box((c[0], c[1], c[2] + 0.8 * h), (0.24, 0.42, 0.58 * h), yaw)
        b.box((c[0], c[1], c[2] + 1.44 * h), (0.23, 0.23, 0.25), yaw)
        for side in (1, -1):
            lift = self.rng.uniform(0.3, 0.8)
            out = 0.27 + lift * 0.18
            ax, ay = c[0] - math.sin(yaw) * out * side, c[1] + math.cos(yaw) * out * side
            b.box((ax, ay, c[2] + 1.28 * h), (0.1, 0.1, lift), yaw)

    def string(self, a, b_, bulbs: int, sag: float, bulb: str | None = "bulb", flags: bool = False) -> None:
        last = None
        for k in range(bulbs + 1):
            t = k / bulbs
            c = (a[0] + (b_[0] - a[0]) * t, a[1] + (b_[1] - a[1]) * t, a[2] + (b_[2] - a[2]) * t - sag * math.sin(math.pi * t))
            if 0 < k < bulbs:
                if flags:
                    f = self.B[FLAGS[k % len(FLAGS)]]
                    f.tri((c[0], c[1], c[2]), (c[0] + 0.3, c[1] + 0.3, c[2]), (c[0] + 0.15, c[1] + 0.15, c[2] - 0.55))
                elif bulb:
                    self.diamond(self.B[bulb], (c[0], c[1], c[2] - 0.14), 0.13)
            if last:
                d = self.B["dark"]
                d.quad((last[0], last[1], last[2] + 0.03), (c[0], c[1], c[2] + 0.03), (c[0], c[1], c[2] - 0.03), (last[0], last[1], last[2] - 0.03))
                d.quad((last[0], last[1], last[2] - 0.03), (c[0], c[1], c[2] - 0.03), (c[0], c[1], c[2] + 0.03), (last[0], last[1], last[2] + 0.03))
            last = c

    def arch(self, d: float, radius: float, thick: float, deep: float, b, bulbs: str | None = None) -> None:
        i = self.road.index(d)
        seg = 22
        for k in range(seg):
            a0, a1 = math.pi * k / seg, math.pi * (k + 1) / seg
            ring = []
            for a in (a0, a1):
                for r in (radius - thick / 2, radius + thick / 2):
                    for along in (-deep / 2, deep / 2):
                        ring.append(self.P(i, along, math.cos(a) * r, math.sin(a) * r - 0.2))
            i0b, i0f, o0b, o0f, i1b, i1f, o1b, o1f = ring
            b.quad(i0b, i1b, i1f, i0f)
            b.quad(o0f, o1f, o1b, o0b)
            b.quad(i0b, o0b, o1b, i1b)
            b.quad(i0f, i1f, o1f, o0f)
            if bulbs:
                for along in (-deep / 2 - 0.12, deep / 2 + 0.12):
                    am = (a0 + a1) / 2
                    self.diamond(self.B[bulbs], self.P(i, along, math.cos(am) * radius, math.sin(am) * radius - 0.2), 0.16)

    # --- Props ---------------------------------------------------------------------------------

    def pine(self, x, y, z, scale: float = 1.0, mat: str = "pine") -> None:
        rng = self.rng
        h = rng.uniform(8, 14) * scale
        self.prism(self.B["trunk"], (x, y, z - 0.5), 0.25 * scale, h * 0.3 + 0.5, 5)
        for k in range(3):
            base = z + h * (0.22 + k * 0.22)
            self.cone(self.B[mat], (x, y, base), (2.6 - k * 0.7) * scale, h * 0.42, 7, 0.12)

    def broadleaf(self, x, y, z, scale: float = 1.0) -> None:
        rng = self.rng
        h = rng.uniform(4.5, 7.0) * scale
        self.prism(self.B["trunk"], (x, y, z - 0.5), 0.3 * scale, h * 0.6 + 0.5, 5, 0.2 * scale)
        for _ in range(3):
            self.blob(self.B["foliage"], (x + rng.uniform(-1.2, 1.2) * scale, y + rng.uniform(-1.2, 1.2) * scale, z + h * rng.uniform(0.75, 1.0)), rng.uniform(1.8, 2.6) * scale)

    def cypress(self, x, y, z) -> None:
        h = self.rng.uniform(9, 13)
        self.prism(self.B["trunk"], (x, y, z - 0.4), 0.2, 1.4, 5)
        self.prism(self.B["cypress"], (x, y, z + 0.8), 0.9, h * 0.55, 7, 1.0)
        self.cone(self.B["cypress"], (x, y, z + 0.8 + h * 0.55), 1.0, h * 0.45, 7)

    def palm(self, x, y, z) -> None:
        rng = self.rng
        height, lean, yaw = rng.uniform(7.0, 11.0), rng.uniform(0.0, 1.4), rng.uniform(0, math.tau)
        top = (x + math.cos(yaw) * lean, y + math.sin(yaw) * lean, z + height)
        self.prism(self.B["trunk"], (x, y, z - 0.4), 0.28, height + 0.4, 5, 0.16)
        for j in range(7):
            a = yaw + j * math.tau / 7 + rng.uniform(-0.2, 0.2)
            reach, droop = rng.uniform(2.6, 3.6), rng.uniform(1.0, 2.0)
            ca, sa = math.cos(a), math.sin(a)
            mid = (top[0] + ca * reach * 0.55, top[1] + sa * reach * 0.55, top[2] + 0.45)
            tip = (top[0] + ca * reach, top[1] + sa * reach, top[2] - droop)
            l0 = (mid[0] - sa * 0.5, mid[1] + ca * 0.5, mid[2])
            r0 = (mid[0] + sa * 0.5, mid[1] - ca * 0.5, mid[2])
            self.B["leaf"].tri(top, r0, l0)
            self.B["leaf"].tri(l0, r0, tip)

    def lamp(self, i: int, off: float, glow: str = "glow-lamp", height: float = 6.0) -> None:
        yaw = self.s[i]["h"]
        base = self.P(i, 0, off, 0.12)
        # A steel column, slimmer towards its top; a thin arm out over the road; a dark housing at its end with the
        # lit glass on its underside.
        self.prism(self.B["dark"], base, 0.1, height, 5, 0.06)
        arm = -1.2 if off > 0 else 1.2
        self.B["dark"].box(self.P(i, 0, off + arm / 2, height - 0.08), (0.07, abs(arm) + 0.2, 0.07), yaw)
        self.B["dark"].box(self.P(i, 0, off + arm, height - 0.2), (0.62, 0.3, 0.14), yaw)
        lo = height - 0.21
        self.B[glow].quad(self.P(i, -0.25, off + arm - 0.11, lo), self.P(i, -0.25, off + arm + 0.11, lo), self.P(i, 0.25, off + arm + 0.11, lo), self.P(i, 0.25, off + arm - 0.11, lo))
        self.B[glow].quad(self.P(i, 0.25, off + arm - 0.11, lo), self.P(i, 0.25, off + arm + 0.11, lo), self.P(i, -0.25, off + arm + 0.11, lo), self.P(i, -0.25, off + arm - 0.11, lo))
        self.halo(self.P(i, 0, off + arm, height - 0.4), glow)

    def turbine(self, x, y, z, yaw: float) -> None:
        h = self.rng.uniform(55, 70)
        self.prism(self.B["turbine"], (x, y, z - 1), 1.6, h + 1, 8, 0.9)
        hub = (x + math.cos(yaw) * 2.0, y + math.sin(yaw) * 2.0, z + h + 1.2)
        self.B["turbine"].box((x, y, z + h - 0.4), (4.5, 2.0, 2.2), yaw)
        spin = self.rng.uniform(0, math.tau)
        nx, ny = -math.sin(yaw), math.cos(yaw)
        for k in range(3):
            a = spin + k * math.tau / 3
            ux, uz = math.cos(a), math.sin(a)
            tip = (hub[0] + nx * ux * 30, hub[1] + ny * ux * 30, hub[2] + uz * 30)
            w = (-uz * 1.4, ux * 1.4)
            p0 = (hub[0] + nx * w[0], hub[1] + ny * w[0], hub[2] + w[1])
            p1 = (hub[0] - nx * w[0], hub[1] - ny * w[0], hub[2] - w[1])
            self.B["turbine"].tri(p0, p1, tip)
            self.B["turbine"].tri(p1, p0, tip)

    def peaks(self, count: int, near: float, far: float, height: tuple[float, float], mat: str, snow: str | None, base_z: float) -> None:
        cx, cy, reach = self.centre()
        rng = self.rng
        for k in range(count):
            a = k * math.tau / count + rng.uniform(-0.15, 0.15)
            r = reach + rng.uniform(near, far)
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
            h = rng.uniform(*height)
            w = h * rng.uniform(0.9, 1.5)
            sides = 9
            ring = [(x + math.cos(q * math.tau / sides) * w * rng.uniform(0.7, 1.2), y + math.sin(q * math.tau / sides) * w * rng.uniform(0.7, 1.2), base_z) for q in range(sides)]
            top = (x + rng.uniform(-0.1, 0.1) * w, y + rng.uniform(-0.1, 0.1) * w, base_z + h)
            mid = [(p[0] + (top[0] - p[0]) * 0.55 + rng.uniform(-0.06, 0.06) * w, p[1] + (top[1] - p[1]) * 0.55 + rng.uniform(-0.06, 0.06) * w, base_z + h * rng.uniform(0.5, 0.62)) for p in ring]
            for q in range(sides):
                self.B[mat].quad(ring[q], ring[(q + 1) % sides], mid[(q + 1) % sides], mid[q])
                (self.B[snow] if snow else self.B[mat]).tri(mid[q], mid[(q + 1) % sides], top)

    def skyline(self, count: int, near: float, far: float, glow: str = "glow-window") -> None:
        cx, cy, reach = self.centre()
        rng = self.rng
        # The towers are one part of their own, `Skyline`: the app draws their lit windows on them (build_course.py).
        towers = self.B.setdefault("skyline", type(self.B["tower"])("Skyline", "tower"))
        for k in range(count):
            a = rng.uniform(0, math.tau)
            r = reach + rng.uniform(near, far)
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
            h, w = rng.uniform(50, 210), rng.uniform(18, 34)
            yaw = a + math.pi / 2
            towers.box((x, y, -2), (w, w * rng.uniform(0.6, 1.0), h), yaw)
            # A lower wing against some, so the skyline steps.
            if rng.random() < 0.4:
                towers.box((x + math.cos(yaw) * w * 0.8, y + math.sin(yaw) * w * 0.8, -2), (w * 0.7, w * 0.6, h * rng.uniform(0.35, 0.7)), yaw)

    def guardrail(self, left: float, start: int = 2, posts: bool = True) -> None:
        for i in range(start, self.n - 2):
            self.B["rail"].quad(self.road.at(i, left, 0.55), self.road.at(i + 1, left, 0.55), self.road.at(i + 1, left, 0.85), self.road.at(i, left, 0.85))
            self.B["rail"].quad(self.road.at(i, left, 0.85), self.road.at(i + 1, left, 0.85), self.road.at(i + 1, left, 0.55), self.road.at(i, left, 0.55))
            if posts and i % 1 == 0:
                self.B["dark"].box(self.road.at(i, left, -0.3), (0.14, 0.14, 1.0), self.s[i]["h"])

    def gates(self, accent: str, accent2: str, crowd, finish_mat: str = "gold", bulbs: str = "bulb") -> int:
        """The start pylons and lights, the finish arch and crowds, an arch at every effort and flags at every recovery."""
        B, kerb, P = self.B, self.kerb, self.P
        i0 = self.road.index(14.0)
        yaw0 = self.s[i0]["h"]
        span = kerb + 1.0
        for side in (1, -1):
            B["dark"].box(P(i0, 0, span * side, 0.0), (1.0, 1.0, 7.0), yaw0)
            B[accent].box(P(i0, 0, span * side, 6.6), (1.2, 1.2, 0.4), yaw0)
        B["dark"].box(P(i0, 0, 0, 6.2), (0.8, 2 * span + 1.0, 1.4), yaw0)
        B[accent].box(P(i0, -0.45, 0, 6.4), (0.1, 2 * span - 1.0, 1.0), yaw0)
        for k, lit in ((-1, False), (0, True), (1, False)):
            B["dark"].box(P(i0, -0.9, k * 1.9, 3.6), (0.5, 1.15, 2.5), yaw0)
            for lamp in range(3):
                mat = B["lamp-red"] if (lit and lamp == 2) else B["rock"]
                mat.box(P(i0, -1.2, k * 1.9, 3.8 + lamp * 0.76), (0.12, 0.62, 0.62), yaw0)
        self.arch(self.length, kerb + 1.6, 0.9, 1.4, B[finish_mat], bulbs=bulbs)
        self.arch(self.length + 2.4, kerb + 2.6, 0.5, 0.6, B[finish_mat], bulbs=bulbs)
        fi = self.road.index(self.length)
        rng = self.rng
        for _ in range(300):
            c = P(fi, rng.uniform(-26, 8), rng.uniform(-kerb - 3, kerb + 3), rng.uniform(1.0, 11.0))
            a, r = rng.uniform(0, math.tau), rng.uniform(0.08, 0.2)
            B["confetti"].tri(c, (c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, c[2]), (c[0] - math.sin(a) * r, c[1] + math.cos(a) * r, c[2] + r))
        for zone_from, zone_to in ((-40.0, 40.0), (self.length - 90.0, self.length + 26.0)):
            d = zone_from
            while d < zone_to:
                i = self.road.index(d)
                yaw = self.s[i]["h"]
                for side in (1, -1):
                    B["wall"].box(P(i, 0, (kerb + 0.5) * side, 0.12), (3.6, 0.4, 1.05), yaw)
                    for _ in range(2):
                        self.person(P(i, rng.uniform(-1.8, 1.8), (kerb + rng.uniform(1.2, 3.0)) * side, 0.12), yaw - math.pi / 2 * side + rng.uniform(-0.4, 0.4), crowd)
                d += 4.0
        efforts = 0
        for stage in self.st:
            if stage["kind"] == "work" and stage["from"] > 1:
                self.arch(stage["from"], kerb + 1.4, 0.5, 0.7, B[accent if efforts % 2 == 0 else accent2])
                efforts += 1
            elif stage["kind"] == "recover":
                i = self.road.index(stage["from"])
                for side in (1, -1):
                    B[accent2].box(P(i, 0, (kerb + 0.6) * side, 0.12), (0.1, 0.5, 4.2), self.s[i]["h"])
        # Arrow boards on the outside of every tight bend.
        for i in range(2, self.n - 2, 2):
            k = self.s[i]["k"]
            if abs(k) < 1 / 62:
                continue
            side = -1 if k > 0 else 1
            yaw = self.s[i]["h"]
            off = (kerb + 1.0) * side
            # A chevron board on two legs, turned to face the rider coming: yellow, with three black chevrons that
            # point the way the road bends.
            B["arrow"].box(P(i, 0, off, 0.7), (0.08, 1.9, 0.95), yaw)
            for leg in (-0.7, 0.7):
                B["dark"].box(P(i, 0, off + leg, 0.0), (0.08, 0.08, 0.7), yaw)
            turn = -side
            for n_ in range(3):
                # A black arrowhead: its point the way the road bends.
                back = off + ((n_ - 1) * 0.58 - 0.2) * turn
                # Drawn twice, wound each way and a hair apart, so one of the two faces the rider.
                for along, order in ((-0.06, (0, 1, 2)), (-0.07, (2, 1, 0))):
                    corners = (P(i, along, back + 0.42 * turn, 1.175), P(i, along, back, 1.52), P(i, along, back, 0.83))
                    B["dark"].tri(*(corners[j] for j in order))
        return efforts


CROWD = [f"crowd-{i}" for i in range(6)]


# --- The worlds ------------------------------------------------------------------------------------


def prairie(k: Kit) -> dict:
    """Open farmland at golden hour: wheat and green fields, a wind farm, red barns and silos, fences and bales."""
    B, s, rng = k.B, k.s, k.rng
    # Fence posts and a wire down both verges.
    for i in range(2, k.n - 2, 3):
        for side in (1, -1):
            off = (k.kerb + 4.5) * side
            x, y, z = k.road.at(i, off)
            if k.road.clear_of_road(x, y, 6.0, i):
                B["fence"].box((x, y, z - 0.8), (0.14, 0.14, 2.0), s[i]["h"])
        if i + 3 < k.n:
            for side in (1, -1):
                off = (k.kerb + 4.5) * side
                a, b_ = k.road.at(i, off, 0.9), k.road.at(i + 3, off, 0.9)
                if k.road.clear_of_road(a[0], a[1], 6.0, i):
                    B["fence"].quad(a, b_, (b_[0], b_[1], b_[2] + 0.08), (a[0], a[1], a[2] + 0.08))
    # Farms: a red barn, a silo, round bales; and windbreaks of trees.
    i, farms = 10, 0
    while i < k.n - 10:
        side = rng.choice((1, -1))
        off = (k.kerb + rng.uniform(22, 40)) * side
        if k.straight(i, 4, 1 / 90) and k.room(i, off, 30.0):
            yaw = s[i]["h"]
            x, y, _ = k.road.at(i, off)
            z = k.height_at(x, y)
            w, d_ = rng.uniform(14, 20), rng.uniform(9, 12)
            B["barn"].box(k.P(i, 0, off, z - s[i]["z"] - 1.0), (w, d_, 6.0), yaw)
            k.gable(B["roof-grey"], k.P(i, 0, off, z - s[i]["z"] + 5.0), w, d_, 3.6, yaw)
            B["paint"].box(k.P(i, 0, off - 0.1 * side - d_ / 2 * side, z - s[i]["z"]), (3.2, 0.2, 3.6), yaw)
            sx, sy, _ = k.P(i, w / 2 + 4, off, 0)
            k.prism(B["metal"], (sx, sy, z - 1), 2.6, 16, 10)
            k.cone(B["metal"], (sx, sy, z + 15), 2.7, 2.4, 10)
            for _ in range(rng.randint(3, 7)):
                bx, by, _ = k.P(i, rng.uniform(-w, w), off + rng.uniform(-14, -6) * side, 0)
                k.prism(B["hay"], (bx, by, k.height_at(bx, by) + 0.9), 0.9, 1.4, 8, yaw=rng.uniform(0, 3))
            for t in range(6):
                tx, ty, _ = k.P(i, -w / 2 - 6 - t * 5, off + rng.uniform(-3, 3), 0)
                if k.road.clear_of_road(tx, ty, 12.0, i):
                    k.broadleaf(tx, ty, k.height_at(tx, ty), rng.uniform(1.1, 1.4))
            farms += 1
            i += rng.randint(40, 90)
        else:
            i += 6
    # The wind farm: turbines on the ridges around the fields, all facing the westerly.
    cx, cy, reach = k.centre()
    wind = rng.uniform(0, math.tau)
    turbines = 0
    for _ in range(int(400 * k.scale)):
        if turbines >= int(22 * k.scale):
            break
        a, r = rng.uniform(0, math.tau), rng.uniform(80, reach + 220)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        near = k.road.tree.find((x, y, 0.0))
        if near[2] < 70:
            continue
        k.turbine(x, y, k.height_at(x, y), wind)
        turbines += 1
    # Tree clumps scattered on the fields.
    for _ in range(int(140 * k.scale)):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, reach + 200)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if k.road.tree.find((x, y, 0.0))[2] > 18:
            k.broadleaf(x, y, k.height_at(x, y), rng.uniform(0.9, 1.4))
    # A grain elevator by the start, painted with the route's number.
    i0 = k.road.index(-30)
    off = -(k.kerb + 18)
    B["paint"].box(k.P(i0, 0, off, -1), (10, 10, 26), s[i0]["h"])
    k.gable(B["roof-grey"], k.P(i0, 0, off, 25), 10, 10, 4, s[i0]["h"])
    B["barn"].box(k.P(i0, 0, off + 5.1, 17), (6, 0.2, 5), s[i0]["h"])
    efforts = k.gates("accent", "accent-2", CROWD)
    return {"efforts": efforts, "farms": farms, "turbines": turbines}


def oldtown(k: Kit) -> dict:
    """A cobbled European old town on race day: tall pastel houses door to door, bunting, a cathedral, cafés."""
    B, s, rng = k.B, k.s, k.rng
    front = k.kerb + 3.2  # the pavements' width: houses stand at their back
    houses = 0
    for side in (1, -1):
        i = 2
        while i < k.n - 4:
            if not k.straight(i, 2, 1 / 45):
                i += 2
                continue
            width = rng.uniform(6.0, 9.0)
            off = (front + 5.0) * side
            if not k.room(i, off, 11.0, 50.0):
                i += 2
                continue
            yaw = s[i]["h"]
            floors = rng.randint(3, 5)
            fh = 3.2
            base = min(s[i]["z"], k.height_at(*k.road.at(i, off)[:2])) - 3.0
            B[FACADES[(houses + i) % len(FACADES)]].box(k.P(i, 0, off, base - s[i]["z"]), (width, 10.0, floors * fh + 0.8 - (base - s[i]["z"])), yaw)
            k.gable(B["roof-tile"], k.P(i, 0, off, floors * fh + 0.8), 10.0, width, 3.0, yaw + math.pi / 2)
            wall = off - 5.05 * side
            k.windows(B["window"], i, 0, wall, width, floors - 1, 3.6, fh, yaw, 2.4)
            B["dark"].box(k.P(i, rng.uniform(-1.5, 1.5), wall, 0.12), (1.3, 0.2, 2.4), yaw)
            if rng.random() < 0.25:
                for c in range(2):
                    ux, uy, uz = k.P(i, -1.5 + c * 3, off - 6.6 * side, 0.12)
                    B["dark"].box((ux, uy, uz), (0.08, 0.08, 2.4), yaw)
                    k.cone(B["umbrella"], (ux, uy, uz + 2.0), 1.4, 0.6, 8)
            houses += 1
            if rng.random() < 0.3 and i + 3 < k.n:
                a = k.P(i, 0, wall, floors * fh * 0.7)
                b_ = k.P(i, 0, -wall, floors * fh * 0.7)
                k.string(a, b_, 14, 0.9, flags=True)
            i += int(width / k.step) + 1
    # Street lamps on the kerbs.
    for i in range(4, k.n - 4, 6):
        k.lamp(i, (k.kerb + 0.6) * (1 if (i // 6) % 2 else -1), "glow-lamp", 5.0)
    # The cathedral on the square midway: a nave, a crossing and two towers with spires.
    placed = 0
    for share in (0.5, 0.42, 0.58, 0.3, 0.7):
        i = k.road.index(k.length * share)
        off = -(front + 34.0)
        if not k.room(i, off, 34.0, 120.0):
            off = -off
            if not k.room(i, off, 34.0, 120.0):
                continue
        yaw = s[i]["h"]
        z = s[i]["z"]
        B["limestone"].box(k.P(i, 0, off, -3), (46, 18, 24), yaw)
        k.gable(B["roof-slate"], k.P(i, 0, off, 21), 46, 18, 9, yaw)
        for t in (-7, 7):
            tx = k.P(i, -26, off + t * 0.0 + t, -3)
            B["limestone"].box(tx, (8, 8, 52), yaw)
            k.cone(B["roof-slate"], (tx[0], tx[1], tx[2] + 52), 5.4, 20, 4)
        B["glow-window"].box(k.P(i, -30.1, off, 26), (0.2, 4.0, 4.0), yaw)
        placed += 1
        break
    # Hills of the countryside beyond the walls, with cypresses.
    cx, cy, reach = k.centre()
    for _ in range(int(160 * k.scale)):
        a, r = rng.uniform(0, math.tau), rng.uniform(60, reach + 220)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if k.road.tree.find((x, y, 0.0))[2] > 30:
            k.cypress(x, y, k.height_at(x, y))
    efforts = k.gates("accent", "flag-1", CROWD, "gold", "bulb")
    return {"efforts": efforts, "houses": houses, "cathedral": placed}


def coast(k: Kit) -> dict:
    """A clifftop road above the sea at sunset: a guard rail over the drop, gorse and pines, a lighthouse, cottages."""
    B, s, rng = k.B, k.s, k.rng
    k.guardrail(k.kerb + 1.6)
    # Stone walls on the landward side, broken by gates.
    for i in range(2, k.n - 2):
        if (i // 12) % 4 == 3:
            continue
        a, b_ = k.road.at(i, -(k.kerb + 3.0)), k.road.at(i + 1, -(k.kerb + 3.0))
        B["stone"].quad(a, b_, (b_[0], b_[1], b_[2] + 1.1), (a[0], a[1], a[2] + 1.1))
        B["stone"].quad((a[0], a[1], a[2] + 1.1), (b_[0], b_[1], b_[2] + 1.1), b_, a)
    # Gorse and pines on the headland, rocks at the cliff edge.
    for i in range(3, k.n - 3, 3):
        x, y, z = k.road.at(i, k.kerb + rng.uniform(3, 8))
        if k.road.clear_of_road(x, y, 9.0, i):
            k.blob(B["rock"], (x, y, z - rng.uniform(1.5, 3.5)), rng.uniform(1.0, 2.6))
        off = -(k.kerb + rng.uniform(6, 30))
        x, y, _ = k.road.at(i, off)
        if k.road.clear_of_road(x, y, 9.0, i):
            if rng.random() < 0.35:
                k.pine(x, y, k.ground(x, y, i, off), rng.uniform(0.8, 1.2))
            else:
                k.blob(B["bush"], (x, y, k.ground(x, y, i, off) + 0.3), rng.uniform(0.7, 1.5))
                if rng.random() < 0.4:
                    k.blob(B["arrow"], (x + 0.6, y, k.ground(x, y, i, off) + 0.7), 0.5)
    # White cottages now and then.
    i = 20
    cottages = 0
    while i < k.n - 20:
        off = -(k.kerb + rng.uniform(16, 26))
        if k.straight(i, 3, 1 / 70) and k.room(i, off, 14.0) and rng.random() < 0.35:
            yaw = s[i]["h"]
            x, y, _ = k.road.at(i, off)
            z = k.height_at(x, y)
            B["whitewash"].box((x, y, z - 2), (11, 6, 6.8), yaw)
            k.gable(B["roof-slate"], (x, y, z + 4.8), 11, 6, 2.6, yaw)
            B["glow-window"].box(k.P(i, -2, off + 3.05, z - s[i]["z"] + 1.4), (1.0, 0.1, 1.1), yaw)
            B["glow-window"].box(k.P(i, 2, off + 3.05, z - s[i]["z"] + 1.4), (1.0, 0.1, 1.1), yaw)
            cottages += 1
            i += 40
        else:
            i += 5
    # The lighthouse on the point nearest the sea, mid-course.
    best = None
    for i in range(k.n // 4, 3 * k.n // 4, 4):
        x, y, _ = k.road.at(i, k.kerb + 30)
        h = k.height_at(x, y)
        if k.road.clear_of_road(x, y, 18.0, i) and h > 2 and (best is None or h > best[0]):
            best = (h, x, y)
    if best:
        h, x, y = best
        k.prism(B["lighthouse"], (x, y, h - 2), 3.4, 26, 12, 2.4)
        k.prism(B["kerb-red"], (x, y, h + 8), 3.05, 5, 12, 2.85)
        k.prism(B["dark"], (x, y, h + 24), 2.6, 0.6, 12)
        k.prism(B["glow-lamp"], (x, y, h + 24.6), 1.8, 2.6, 12)
        k.cone(B["kerb-red"], (x, y, h + 27.2), 2.3, 2.4, 12)
    # The sea stacks offshore.
    cx, cy, reach = k.centre()
    for _ in range(int(120 * k.scale)):
        a, r = rng.uniform(0, math.tau), reach + rng.uniform(60, 600)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if k.height_at(x, y) < -4:
            k.prism(B["rock"], (x, y, -6), rng.uniform(5, 12), rng.uniform(14, 34), 7, rng.uniform(2, 6))
    efforts = k.gates("accent", "accent-2", CROWD)
    return {"efforts": efforts, "cottages": cottages, "lighthouse": best is not None}


def docklands(k: Kit) -> dict:
    """A harbour city after dark: brick warehouses with lit windows and neon, cranes and containers on the quay."""
    B, s, rng = k.B, k.s, k.rng
    # Lamps both sides, every 24 m: the course file tells the app where their light falls.
    lamps = THEMES["docklands"]["lamps"]
    for i in range(lamps["start"], k.n - 3, lamps["every"]):
        for side in (1, -1):
            k.lamp(i, (k.kerb + lamps["off"]) * side, lamps["glow"], lamps["height"])
    # Warehouses on the right.
    i, sheds = 2, 0
    front = k.kerb + 3.0
    while i < k.n - 6:
        off = -(front + 8.0)
        on_bridge = any(s[j].get("bridge") for j in range(max(i - 5, 0), min(i + 6, k.n)))
        if not on_bridge and k.straight(i, 4, 1 / 70) and k.room(i, off, 18.0, 60.0):
            yaw = s[i]["h"]
            width = rng.uniform(16, 26)
            floors = rng.randint(3, 6)
            base = min(s[i]["z"], k.height_at(*k.road.at(i, off)[:2])) - 3.0
            B["brick"].box(k.P(i, 0, off, base - s[i]["z"]), (width, 16, floors * 3.6 + 1.0 - (base - s[i]["z"])), yaw)
            wall = off + 8.05
            for f in range(floors):
                cols = int(width / 3.0)
                for c in range(cols):
                    lit = rng.random() < 0.45
                    along = -width / 2 + (c + 0.5) * width / cols
                    if f == 0 and lit and c % 2 == 0:
                        # A lit ground-floor window or door throws its light on the pavement before it.
                        k.light(k.P(i, along, wall + 1.8, 0), "glow-window", 5.5, 0.4)
                    if f == 0 and c % 3 == 1:
                        # A loading door in every third bay of the ground floor.
                        k.door(i, along, wall + 0.06, 0.12, 2.5, 3.1, lit)
                    else:
                        k.window(i, along, wall + 0.06, 1.4 + f * 3.6, 1.4, 1.9, lit, yaw)
            # On the roof, what shapes it against the sky: a water tank or a plant room, and a chimney.
            top = floors * 3.6 + 1.0
            spot = (i * 37) % 5
            where = k.P(i, (spot - 2) * width * 0.16, off + ((i * 13) % 7 - 3) * 1.4, top)
            if spot % 2:
                k.prism(B["fence"], where, 1.5, 3.2, 6)
            else:
                B["wall"].box(where, (4.5, 3.2, 2.4), yaw)
            B["brick"].box(k.P(i, -width / 2 + 2.0, off - 5.0, top), (1.1, 1.1, 3.4), yaw)
            neon = ("neon-pink", "neon-cyan", "neon-amber", "neon-violet")[sheds % 4]
            B[neon].box(k.P(i, rng.uniform(-width / 4, width / 4), wall + 0.1, floors * 3.6 - 1.2), (width * 0.5, 0.14, 0.3), yaw)
            B[neon].box(k.P(i, -width / 2 + 0.4, wall + 0.4, 3.0), (0.2, 0.2, floors * 3.6 - 3.5), yaw)
            # The sign's light on the pavement and the road before it.
            k.light(k.P(i, 0, wall + 3.0, 0), neon, 13.0, 0.75)
            k.light(k.P(i, -width / 2 + 0.4, wall + 1.6, 0), neon, 7.0, 0.7)
            sheds += 1
            i += int((width + rng.uniform(4, 14)) / k.step) + 1
        else:
            i += 3
    # The quay on the left: cranes, container stacks and moored ships.
    cranes = 0
    for i in range(8, k.n - 8, 3):
        off = k.kerb + rng.uniform(14, 24)
        x, y, z = k.road.at(i, off)
        if not k.road.clear_of_road(x, y, 14.0, i) or any(s[j].get("bridge") for j in range(max(i - 4, 0), min(i + 5, k.n))):
            continue
        yaw = s[i]["h"]
        if rng.random() < 0.06 and cranes < 26:
            for along in (-4, 4):
                for across in (-4, 4):
                    B["crane"].box(k.P(i, along, off + across, -1), (0.6, 0.6, 30), yaw)
            B["crane"].box(k.P(i, 0, off + 8, 29), (3.0, 58, 3.0), yaw + math.pi / 2 * 0 + 0)
            B["crane"].box(k.P(i, 0, off, 32), (9, 9, 6), yaw)
            B["lamp-red"].box(k.P(i, 0, off + 36, 32), (0.6, 0.6, 0.6), yaw)
            cranes += 1
        elif rng.random() < 0.14:
            for tier in range(rng.randint(1, 4)):
                B[rng.choice(CONTAINERS)].box(k.P(i, 0, off, tier * 2.6 - 0.2), (12.0, 2.45, 2.6), yaw)
    # The quay is a working one: a railing between the pavement and the apron, bollards at the water's edge, drums
    # and crates, parked lorries and floodlight masts. Dealt from its own numbers, so the rest of the map stands
    # where it stood.
    deal = random.Random(k.n * 31 + 7)
    lorries = masts = 0
    for i in range(6, k.n - 8):
        yaw = s[i]["h"]
        # Nothing of the quay's stands on a bridge, or within a few metres of its ends.
        if any(s[j].get("bridge") for j in range(i - 3, i + 4)):
            continue
        # The railing: a post a sample and two rails on to the next, with a gap for a gate now and then.
        if (i // 14) % 5 != 2:
            k.fence(i, k.kerb + 3.0, 1.15)
        # A mooring bollard every 24 m, a pace in from the edge.
        if i % 6 == 0:
            k.prism(B["dark"], k.P(i, 0, k.kerb + 25.55, 0.12), 0.27, 0.62, 5, 0.2)
        if not k.road.clear_of_road(*k.road.at(i, k.kerb + 12)[:2], 16.0, i):
            continue
        roll = deal.random()
        off = k.kerb + deal.uniform(5.0, 11.5)
        if roll < 0.04:
            # Oil drums stood together, some on their sides' colours.
            for _ in range(deal.randint(2, 6)):
                c = k.P(i, deal.uniform(-1.4, 1.4), off + deal.uniform(-1.2, 1.2), 0.12)
                k.prism(B[deal.choice(("container-0", "container-1", "dark", "container-3"))], c, 0.29, 0.88, 6)
        elif roll < 0.08:
            # Crates on pallets, stacked one, two or three high.
            for n_ in range(deal.randint(1, 3)):
                along = n_ * 1.5 - 1.0
                for tier in range(deal.randint(1, 3)):
                    B["fence"].box(k.P(i, along, off, 0.26 + tier * 1.02), (1.2, 1.0, 1.0), yaw + deal.uniform(-0.12, 0.12))
                B["trunk"].box(k.P(i, along, off, 0.12), (1.25, 1.05, 0.14), yaw)
        elif roll < 0.095 and i % 2 == 0:
            # A lorry parked along the quay: cab, chassis, a container on its trailer, its wheels.
            lorries += 1
            away = math.pi if deal.random() < 0.5 else 0.0
            turn = -1 if away else 1
            B[deal.choice(CONTAINERS)].box(k.P(i, -1.2 * turn, off, 1.32), (12.0, 2.45, 2.6), yaw)
            B["dark"].box(k.P(i, -0.6 * turn, off, 0.72), (13.6, 1.0, 0.6), yaw)
            B[deal.choice(("whitewash", "container-1", "container-0", "crane"))].box(k.P(i, 6.6 * turn, off, 0.62), (2.3, 2.4, 2.7), yaw)
            B["window"].box(k.P(i, 7.72 * turn, off, 2.05), (0.08, 2.1, 0.95), yaw)
            for along in (6.4, 0.2, -1.2, -5.2, -6.6):
                for side in (1.05, -1.05):
                    B["dark"].box(k.P(i, along * turn, off + side, 0.12), (1.0, 0.32, 1.0), yaw)
        elif i % 30 == 15:
            # A floodlight mast over the apron.
            masts += 1
            base = k.kerb + 13.0
            B["dark"].box(k.P(i, 0, base, 0.12), (0.34, 0.34, 17.0), yaw)
            B["dark"].box(k.P(i, 0, base, 17.0), (0.3, 3.2, 0.3), yaw)
            for side in (-1.3, -0.45, 0.45, 1.3):
                B["glow-lamp"].box(k.P(i, 0.25, base + side, 16.55), (0.5, 0.6, 0.4), yaw)
            for side in (-0.9, 0.9):
                k.halo(k.P(i, 0.3, base + side, 16.5), "glow-lamp")
    # Ships at anchor in the harbour, lit.
    cx, cy, reach = k.centre()
    ships = 0
    for _ in range(300):
        if ships >= 14:
            break
        a, r = rng.uniform(0, math.tau), reach + rng.uniform(40, 500)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if k.height_at(x, y) > -4:
            continue
        yaw = rng.uniform(0, math.tau)
        L = rng.uniform(40, 90)
        B["dark"].box((x, y, -1), (L, L * 0.16, 6), yaw)
        B["whitewash"].box((x - math.cos(yaw) * L * 0.35, y - math.sin(yaw) * L * 0.35, 5), (L * 0.18, L * 0.14, 8), yaw)
        for c in range(int(L / 13)):
            u = -L / 2 + 8 + c * 12
            B[rng.choice(CONTAINERS)].box((x + math.cos(yaw) * u, y + math.sin(yaw) * u, 5), (11, L * 0.14, 2.6), yaw)
        B["glow-window"].box((x - math.cos(yaw) * L * 0.35, y - math.sin(yaw) * L * 0.35, 11), (L * 0.185, L * 0.145, 0.6), yaw)
        ships += 1
    k.skyline(int(110 * k.scale), 180, 1100)
    efforts = k.gates("neon-cyan", "neon-pink", CROWD, "gold", "bulb")
    # The harbour bridges: over each one's deck, two pylons with stay cables fanned down to the deck either side of
    # them, the cables strung with light. Each bridge takes its light's colour in turn.
    spans, start = [], None
    for i in range(k.n):
        if s[i].get("bridge") and start is None:
            start = i
        elif not s[i].get("bridge") and start is not None:
            spans.append((start, i - 1))
            start = None
    out = k.kerb + 2.6
    for n_, (i0, i1) in enumerate(spans):
        if i1 - i0 < 40:
            continue
        neon = ("neon-cyan", "neon-pink", "neon-amber", "neon-violet")[n_ % 4]
        for share in (0.3, 0.7):
            i = i0 + int((i1 - i0) * share)
            yaw, deck = s[i]["h"], s[i]["z"]
            top = 38.0
            for side in (1, -1):
                # A leg from the sea's bed to the pylon's head, slimmer above the deck.
                B["tower"].box(k.P(i, 0, out * side, -9.0 - deck), (2.6, 1.8, deck + 9.0 + 1.0), yaw)
                B["tower"].box(k.P(i, 0, out * side, 1.0), (1.7, 1.2, top - 1.0), yaw)
                k.halo(k.P(i, 0, out * side, top + 0.6), neon)
                # The stays: from the head down to the deck's edge, every 16 m out to 96 m each way.
                head = k.P(i, 0, out * side, top - 1.0)
                for reach in range(4, 28, 4):
                    for way in (1, -1):
                        j = i + reach * way
                        if j < i0 or j > i1:
                            continue
                        foot = k.road.at(j, out * side, 1.0)
                        for lift, order in ((0.0, (0, 1, 2, 3)), (0.02, (3, 2, 1, 0))):
                            quad = (
                                (head[0], head[1], head[2] + lift),
                                (foot[0], foot[1], foot[2] + lift),
                                (foot[0], foot[1], foot[2] + 0.16 + lift),
                                (head[0], head[1], head[2] + 0.16 + lift),
                            )
                            B[neon].quad(*(quad[q] for q in order))
            # The stays' light on the deck: a pool every 16 m as far as they reach.
            for reach in range(-24, 28, 4):
                if i0 <= i + reach <= i1:
                    k.light(k.road.at(i + reach, 0.0), neon, 15.0, 0.55 - 0.012 * abs(reach))
            # The head beam and a beam under the deck tie the two legs.
            B["tower"].box(k.P(i, 0, 0, top - 3.0), (1.6, 2 * out + 1.2, 2.2), yaw)
            B["tower"].box(k.P(i, 0, 0, -3.2), (2.2, 2 * out + 1.8, 1.8), yaw)
    return {"efforts": efforts, "warehouses": sheds, "cranes": cranes, "ships": ships, "lorries": lorries, "masts": masts}


def dolomites(k: Kit) -> dict:
    """An alpine valley under pale limestone peaks: meadows, larch and spruce, wooden chalets, a guard rail."""
    B, s, rng = k.B, k.s, k.rng
    k.guardrail(k.kerb + 1.4)
    # Spruce forest on the slopes, thick away from the road.
    cx, cy, reach = k.centre()
    for _ in range(int(900 * k.scale)):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, reach + 240)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        d = k.road.tree.find((x, y, 0.0))[2]
        if d < 14 or (d < 60 and rng.random() < 0.6):
            continue
        z = k.height_at(x, y)
        k.pine(x, y, z, rng.uniform(0.9, 1.5))
    # Chalets in the meadows beside the road: stone below, wood above, wide low roofs and flower boxes.
    i, chalets = 12, 0
    while i < k.n - 12:
        side = rng.choice((1, -1))
        off = (k.kerb + rng.uniform(14, 26)) * side
        if k.straight(i, 3, 1 / 80) and k.room(i, off, 16.0) and rng.random() < 0.45:
            yaw = s[i]["h"]
            x, y, _ = k.road.at(i, off)
            z = k.height_at(x, y)
            B["whitewash"].box((x, y, z - 3), (12, 9, 6.0), yaw)
            B["chalet-wood"].box((x, y, z + 3), (12.4, 9.4, 4.2), yaw)
            k.gable(B["roof-slate"], (x, y, z + 7.2), 12.4, 9.4, 3.0, yaw)
            k.windows(B["window"], i, 0, off - 4.75 * side, 10, 2, z - s[i]["z"] + 0.8, 3.0, yaw, 3.0)
            B["bougainvillea"].box(k.P(i, 0, off - 4.9 * side, z - s[i]["z"] + 3.8), (10, 0.5, 0.4), yaw)
            chalets += 1
            i += rng.randint(30, 70)
        else:
            i += 5
    # The pale peaks all round, snow on their tops.
    base = min(p["z"] for p in s) - 4
    k.peaks(26, 800, 1700, (420, 900), "limestone", "snow", base)
    k.peaks(14, 1900, 2900, (700, 1200), "limestone", "snow", base)
    efforts = k.gates("accent", "flag-0", CROWD)
    # A summit sign and a chapel on the highest bend.
    top = max(range(k.n), key=lambda j: s[j]["z"])
    yaw = s[top]["h"]
    off = -(k.kerb + 10)
    B["whitewash"].box(k.P(top, 0, off, -1), (6, 9, 6), yaw)
    k.gable(B["roof-slate"], k.P(top, 0, off, 5), 9, 6, 3, yaw + math.pi / 2)
    B["whitewash"].box(k.P(top, -4, off, -1), (2.6, 2.6, 12), yaw)
    k.cone(B["roof-slate"], k.P(top, -4, off, 11), 1.9, 4.5, 4)
    return {"efforts": efforts, "chalets": chalets}


def vicecity(k: Kit) -> dict:
    """A neon beachfront city at a magenta sunset: art deco hotels with neon trim, palms, convertibles, the beach."""
    B, s, rng = k.B, k.s, k.rng
    front = k.kerb + 6.0
    # Palms down the beach side and the hotel side.
    i = 3
    while i < k.n - 2:
        for side, off in ((1, k.kerb + 3.4), (-1, -(k.kerb + 1.4))):
            x, y, z = k.road.at(i, off + rng.uniform(-0.3, 0.3))
            if k.road.clear_of_road(x, y, 7.5, i):
                k.palm(x, y, z - (0.6 if side > 0 else 0.0))
        i += rng.choice((4, 5, 6))
    # Art deco hotels: pastel, stepped tops, neon bands and a vertical name sign.
    i, hotels = 2, 0
    while i < k.n - 6:
        off = -(front + 7.0)
        if k.straight(i, 4, 1 / 80) and k.room(i, off, 18.0, 60.0):
            yaw = s[i]["h"]
            width = rng.uniform(16, 24)
            floors = rng.randint(3, 7)
            base = min(s[i]["z"], k.height_at(*k.road.at(i, off)[:2])) - 3.0
            body = B[DECOS[hotels % len(DECOS)]]
            hgt = floors * 3.4 + 1
            body.box(k.P(i, 0, off, base - s[i]["z"]), (width, 14, hgt - (base - s[i]["z"])), yaw)
            body.box(k.P(i, 0, off, hgt), (width * 0.6, 10, 3.2), yaw)
            body.box(k.P(i, 0, off, hgt + 3.2), (width * 0.3, 7, 2.6), yaw)
            wall = off + 7.05
            neon = ("neon-pink", "neon-cyan", "neon-violet", "neon-amber")[hotels % 4]
            for f in range(1, floors):
                B[neon].box(k.P(i, 0, wall, f * 3.4 + 0.1), (width, 0.14, 0.14), yaw)
            k.windows(B["glow-window"], i, 0, wall, width - 2, floors - 1, 1.6, 3.4, yaw, 2.8)
            B[neon].box(k.P(i, -width / 2 + 2.0, wall + 0.6, 4.0), (0.5, 0.3, hgt - 2), yaw)
            B["glow-door"].box(k.P(i, 0, wall, 0.12), (4.0, 0.2, 2.6), yaw)
            # A convertible at the kerb.
            if rng.random() < 0.6:
                car = B[rng.choice(CARS)]
                car.box(k.P(i, rng.uniform(-4, 4), -(k.kerb + 2.4), 0.12), (4.6, 1.9, 0.75), yaw)
                car.box(k.P(i, rng.uniform(-1, 1), -(k.kerb + 2.4), 0.87), (1.8, 1.7, 0.3), yaw)
            hotels += 1
            i += int((width + rng.uniform(3, 10)) / k.step) + 1
        else:
            i += 3
    # Lifeguard towers and umbrellas on the beach.
    for i in range(6, k.n - 6, 7):
        off = k.kerb + rng.uniform(10, 20)
        x, y, z = k.road.at(i, off)
        if not k.road.clear_of_road(x, y, 10.0, i):
            continue
        gz = k.height_at(x, y)
        if rng.random() < 0.12:
            yaw = s[i]["h"]
            for dx in (-1, 1):
                for dy in (-1, 1):
                    B["wood"].box((x + dx, y + dy, gz - 0.5), (0.2, 0.2, 3.0), yaw)
            B[rng.choice(DECOS)].box((x, y, gz + 2.5), (3.2, 3.2, 2.4), yaw)
            k.cone(B["neon-pink"], (x, y, gz + 4.9), 2.4, 1.0, 4)
        elif rng.random() < 0.5:
            B["dark"].box((x, y, gz - 0.3), (0.08, 0.08, 2.4), 0)
            k.cone(B["umbrella" if rng.random() < 0.5 else "deco-1"], (x, y, gz + 1.8), 1.5, 0.6, 8)
    k.skyline(40, 400, 1300, "neon-pink")
    efforts = k.gates("neon-pink", "neon-cyan", CROWD)
    return {"efforts": efforts, "hotels": hotels}


def granite(k: Kit) -> dict:
    """A high mountain pass at first light: hairpins up bare granite, stone parapets, last larches, snow patches."""
    B, s, rng = k.B, k.s, k.rng
    # Parapet blocks on the outside of the road, with gaps.
    for i in range(2, k.n - 2):
        if i % 3 == 2:
            continue
        for side in (1, -1):
            off = (k.kerb + 0.9) * side
            B["parapet"].box(k.P(i, 0, off, -0.2), (2.8, 0.6, 1.0), s[i]["h"])
    # Boulders and scree beside the road; larches below the tree line.
    zs = [p["z"] for p in s]
    tree_line = min(zs) + (max(zs) - min(zs)) * 0.55
    cx, cy, reach = k.centre()
    for _ in range(int(1400 * k.scale)):
        a, r = rng.uniform(0, math.tau), rng.uniform(0, reach + 220)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        d = k.road.tree.find((x, y, 0.0))[2]
        if d < 12:
            continue
        z = k.height_at(x, y)
        if z < tree_line and rng.random() < 0.6:
            k.pine(x, y, z, rng.uniform(0.7, 1.1), "cypress")
        elif rng.random() < 0.5:
            k.blob(B["granite"], (x, y, z), rng.uniform(1.2, 4.5))
        elif z > tree_line and rng.random() < 0.4:
            snow = B["snow"]
            r0 = rng.uniform(4, 12)
            snow.quad((x - r0, y - r0 * 0.6, z + 0.3), (x + r0, y - r0 * 0.5, z + 0.3), (x + r0 * 0.8, y + r0 * 0.6, z + 0.3), (x - r0 * 0.7, y + r0 * 0.5, z + 0.3))
    # Marker posts with red tops at every bend, the snow poles of a high pass.
    for i in range(2, k.n - 2, 5):
        for side in (1, -1):
            p = k.P(i, 0, (k.kerb + 2.0) * side, 0.0)
            B["paint"].box(p, (0.12, 0.12, 1.6), s[i]["h"])
            B["kerb-red"].box((p[0], p[1], p[2] + 1.6), (0.13, 0.13, 0.4), s[i]["h"])
    base = min(zs) - 4
    k.peaks(22, 1000, 1900, (300, 620), "granite", "snow", base)
    k.peaks(12, 2100, 3100, (600, 1000), "granite", "snow", base)
    efforts = k.gates("accent", "flag-1", CROWD)
    # The col: a stone refuge and the pass sign at the top.
    top = max(range(k.n), key=lambda j: s[j]["z"])
    yaw = s[top]["h"]
    off = -(k.kerb + 12)
    B["stone"].box(k.P(top, 0, off, -2), (14, 9, 7), yaw)
    k.gable(B["roof-slate"], k.P(top, 0, off, 5), 14, 9, 3.5, yaw)
    B["glow-window"].box(k.P(top, 0, off + 4.55, 1.4), (1.2, 0.1, 1.2), yaw)
    B["dark"].box(k.P(top, 6, -(k.kerb + 2.5), 0), (0.2, 0.2, 3.2), yaw)
    B["paint"].box(k.P(top, 6, -(k.kerb + 2.5), 2.2), (0.12, 3.2, 1.2), yaw)
    return {"efforts": efforts}


SCENERY = {
    "prairie": prairie,
    "oldtown": oldtown,
    "coast": coast,
    "docklands": docklands,
    "dolomites": dolomites,
    "vicecity": vicecity,
    "granite": granite,
}

# Cinque Terre keeps its theme, its materials and its scenery in a module of its own (cinqueterre.py).
import cinqueterre as _cinqueterre  # noqa: E402  (beside this script)

MATERIALS.update(_cinqueterre.MATERIALS)
THEMES["cinqueterre"] = _cinqueterre.THEME
SCENERY["cinqueterre"] = _cinqueterre.scenery

# Haleakalā likewise (haleakala.py).
import haleakala as _haleakala  # noqa: E402  (beside this script)

MATERIALS.update(_haleakala.MATERIALS)
THEMES["haleakala"] = _haleakala.THEME
SCENERY["haleakala"] = _haleakala.scenery


import bonneville as _bonneville

THEMES["bonneville"] = _bonneville.THEME
SCENERY["bonneville"] = _bonneville.scenery
