"""Builds a Telo Ride map in Blender from a course file (ADR 0034).

A course file (courses/<id>.json) holds the plan of the GCN class the map is modelled after. From it
this script lays one continuous road:

- its length is the class's length: each segment's stretch is duration x cadence aim x 5 m a turn of
  the pedals, so the map's size is relative to the class;
- its elevation follows the target resistance: a level above the course's mean climbs, one below it
  descends, 1 % of gradient a level;
- its turns are dealt from a seed, tighter on the climbs, and never cross the road again.

It then dresses the road in the course's theme and writes, next to each other:

  <out>/<id>.glb          the map the Ride app draws (glTF binary, +Y up, no normals, no textures)
  <out>/<id>.course.json  the road's centre line and the plan's stages along it, which the app rides
  <blend>/<id>.blend      the Blender scene, to open, look over and model further

Run it with Blender, or with Python and the `bpy` module:

  blender --background --python tools/blender/build_course.py -- tools/blender/courses/ibiza.json
  python tools/blender/build_course.py tools/blender/courses/ibiza.json

Options: --out <dir> (default frontend/projects/ride/public/courses), --blend <dir> (default
tools/blender/scenes), --preview <dir> renders stills of the map with Cycles.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

import bpy
import bmesh  # after bpy: the bpy module provides it
from mathutils import Vector, kdtree

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sellaronda  # noqa: E402  (beside this script)
import sky  # noqa: E402  (beside this script)
import themes  # noqa: E402  (beside this script)
from pack_glb import pack as pack_glb  # noqa: E402  (beside this script)

ROOT = Path(__file__).resolve().parents[2]

# --- The road's rules -------------------------------------------------------------------------

STEP = 4.0  # metres between the centre line's samples
METRES_PER_TURN = 5.0  # as the scene driver's: a road bike in a middle gear
GRADE_PER_LEVEL = 1.0  # percent of gradient for each level above the course's mean
LEAD_IN = 80.0  # road before the start line
RUN_OUT = 200.0  # road after the finish line
DEFAULT_ROAD_HALF = 5.0
ROAD_HALF = DEFAULT_ROAD_HALF
CLEAR = 46.0  # the road keeps this far from an earlier stretch of itself
SEA_CLEARANCE = 4.0  # the road's lowest point above the sea
BRIDGE_BED = -9.0  # the land's height under a bridge: below the sea
BRIDGE_CLEAR = 1.6  # a bridge's deck stands this far above the quay it left before the quay stops beside it
START_LINE = 14.0  # the start line and its gate stand this far up the road: the rider starts on the grid behind it


def stages(plan: dict, metres_per_turn: float = METRES_PER_TURN) -> list[dict]:
    """The plan's segments with the seconds and the metres each starts and ends at."""
    out, t, d = [], 0.0, 0.0
    for seg in plan["segments"]:
        length = seg["duration"] * seg["cadenceAim"] / 60.0 * metres_per_turn
        out.append({**seg, "start": t, "from": d, "to": d + length})
        t += seg["duration"]
        d += length
    return out


def stage_at(stages_: list[dict], d: float) -> dict | None:
    for s in stages_:
        if s["from"] <= d < s["to"]:
            return s
    return None


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


class Grid:
    """Points in square cells, to ask how near the road already runs."""

    def __init__(self, cell: float):
        self.cell, self.cells = cell, {}

    def add(self, i: int, x: float, y: float) -> None:
        self.cells.setdefault((int(x // self.cell), int(y // self.cell)), []).append((i, x, y))

    def near(self, x: float, y: float, radius: float, before: int) -> bool:
        cx, cy, r = int(x // self.cell), int(y // self.cell), int(radius // self.cell) + 1
        for gx in range(cx - r, cx + r + 1):
            for gy in range(cy - r, cy + r + 1):
                for i, px, py in self.cells.get((gx, gy), ()):
                    if i < before and (px - x) ** 2 + (py - y) ** 2 < radius * radius:
                        return True
        return False


def deal_turns(stages_: list[dict], total: float, rng: random.Random, weights: dict | None = None, reach: float = 620.0) -> list[float] | None:
    """The road's curvature at each sample, dealt feature by feature so it never meets itself."""
    n = int(math.ceil(total / STEP)) + 1
    weights = weights or {
        "work": (("hairpin", 0.3), ("ess", 0.3), ("sweep", 0.25), ("straight", 0.15)),
        "recover": (("sweep", 0.45), ("ess", 0.2), ("straight", 0.3), ("hairpin", 0.05)),
        "calm": (("sweep", 0.4), ("straight", 0.45), ("ess", 0.15)),
    }

    def feature(kind: str) -> list[tuple[float, float]]:
        """(length, curvature) runs; curvature is positive to the left."""
        side = rng.choice((-1, 1))
        if kind == "straight":
            return [(rng.uniform(50, 150), 0.0)]
        if kind == "sweep":
            r, a = rng.uniform(70, 170), math.radians(rng.uniform(25, 75))
            return [(r * a, side / r)]
        if kind == "hairpin":
            r, a = rng.uniform(30, 42), math.radians(rng.uniform(140, 180))
            return [(rng.uniform(20, 40), 0.0), (r * a, side / r)]
        r, a = rng.uniform(48, 85), math.radians(rng.uniform(40, 70))
        return [(r * a, side / r), (rng.uniform(8, 24), 0.0), (r * a * rng.uniform(0.8, 1.2), -side / r)]

    def walk(state, runs):
        x, y, th = state
        pts, ks = [], []
        for length, k in runs:
            for _ in range(max(1, round(length / STEP))):
                th += k * STEP
                x += math.cos(th) * STEP
                y += math.sin(th) * STEP
                pts.append((x, y))
                ks.append(k)
        return (x, y, th), pts, ks

    lag = int(130 / STEP)
    # Each entry: the state before the feature, and how many samples it laid.
    state = (0.0, 0.0, 0.0)
    points: list[tuple[float, float]] = []
    curv: list[float] = []
    grid = Grid(CLEAR)
    history: list[tuple[tuple[float, float, float], int]] = []

    def lay(runs) -> bool:
        nonlocal state
        new_state, pts, ks = walk(state, runs)
        base = len(points)
        for j, (px, py) in enumerate(pts):
            if grid.near(px, py, CLEAR, base + j - lag):
                return False
        # A feeler ahead: the road must have somewhere to go.
        fx, fy, fth = new_state
        for m in range(1, 9):
            if grid.near(fx + math.cos(fth) * m * 30, fy + math.sin(fth) * m * 30, CLEAR * 0.8, base - lag):
                return False
        # Far from where it started, the road turns for home.
        far = math.hypot(fx, fy)
        if far > reach:
            home = math.atan2(-fy, -fx)
            off = abs((fth - home + math.pi) % (2 * math.pi) - math.pi)
            if off > math.radians(95) and far > math.hypot(state[0], state[1]):
                return False
        history.append((state, len(pts)))
        for j, (px, py) in enumerate(pts):
            grid.add(base + j, px, py)
        points.extend(pts)
        curv.extend(ks)
        state = new_state
        return True

    def undo() -> None:
        nonlocal state
        state, count = history.pop()
        for _ in range(count):
            points.pop()
            curv.pop()
        # Rebuild the grid: undoing is rare.
        grid.cells.clear()
        for i, (px, py) in enumerate(points):
            grid.add(i, px, py)

    lay([(LEAD_IN + 140, 0.0)])
    tries = 0
    while len(points) < n:
        tries += 1
        if tries > 4000:
            return None
        d = len(points) * STEP - LEAD_IN
        # The last 300 m and the run-out are one straight: the finish is seen from far off.
        left_to_lay = total - len(points) * STEP
        if left_to_lay < RUN_OUT + 300:
            if lay([(left_to_lay + 2 * STEP, 0.0)]):
                break
            for _ in range(min(3, len(history) - 1)):
                undo()
            continue
        stage = stage_at(stages_, d)
        kind = stage["kind"] if stage else "calm"
        table = weights.get(kind, weights["calm"])
        laid = False
        for _ in range(16):
            pick, acc, chosen = rng.random(), 0.0, table[-1][0]
            for name, w in table:
                acc += w
                if pick <= acc:
                    chosen = name
                    break
            if lay(feature(chosen)):
                laid = True
                break
        if not laid:
            for _ in range(min(3, len(history) - 1)):
                undo()
    return curv[:n]


def lay_centre_line(course: dict, theme: dict | None = None):
    """The centre line's samples (x, y, z, heading, curvature, grade) in Blender's Z-up metres."""
    theme = theme or {}
    grade_rule = theme.get("grade", {})
    per_level = grade_rule.get("perLevel", GRADE_PER_LEVEL)
    roll, wave, climb = grade_rule.get("roll", 0.0), grade_rule.get("rollWave", 400.0), grade_rule.get("climb", 0.0)
    turns = sum(seg["duration"] * seg["cadenceAim"] / 60.0 for seg in course["plan"]["segments"])
    # A map in the catalogue is raced over its listed distance: its gearing is set so the road is exactly that
    # long, every stage's stretch still in proportion to its seconds and its cadence aim.
    metres_per_turn = course["distanceKm"] * 1000.0 / turns if course.get("distanceKm") else METRES_PER_TURN
    st = stages(course["plan"], metres_per_turn)
    length = st[-1]["to"]
    total = LEAD_IN + length + RUN_OUT
    mean = sum(s["level"] * (s["to"] - s["from"]) for s in st) / length
    reach = theme.get("reach", 620.0) * (math.sqrt(total / 11740.0) if course.get("distanceKm") else 1.0)

    seed = course.get("seed", 1)
    best = None
    # The search over layouts can take minutes; a course file that names its `layout` goes straight to that one.
    pinned = course.get("layout")
    for attempt in [pinned] if pinned is not None else range(200):
        rng = random.Random(seed * 1000 + attempt)
        raw = deal_turns(st, total, rng, theme.get("turns"), max(620.0, reach))
        if raw is None:
            continue
        curv = box_smooth(raw, int(20 / STEP))
        n = len(curv)
        xs, ys, hs = [], [], []
        x = y = th = 0.0
        for k in curv:
            th += k * STEP
            x += math.cos(th) * STEP
            y += math.sin(th) * STEP
            xs.append(x)
            ys.append(y)
            hs.append(th)
        # The eased line must still keep clear of itself.
        grid, ok, lag = Grid(CLEAR), True, int(130 / STEP)
        for i in range(n):
            if grid.near(xs[i], ys[i], CLEAR * 0.72, i - lag):
                ok = False
                break
            grid.add(i, xs[i], ys[i])
        if not ok:
            continue
        # The strip at the start and at the finish looks out to sea: no other stretch of road to its left.
        blocked = 0
        zone = [i for i in range(n) if i * STEP - LEAD_IN < 320 or i * STEP - LEAD_IN > length - 480]
        for i in zone[::3]:
            nx, ny = -math.sin(hs[i]), math.cos(hs[i])
            for j in range(0, n, 3):
                if abs(j - i) * STEP < 200:
                    continue
                dx, dy = xs[j] - xs[i], ys[j] - ys[i]
                if dx * nx + dy * ny > 6 and dx * dx + dy * dy < 300 * 300:
                    blocked += 1
                    break
        if best is None or blocked < best[0]:
            best = (blocked, curv, xs, ys, hs, attempt)
        # Inland, no view of the sea to look for: the first road that keeps clear of itself will do.
        if blocked == 0 or attempt >= (11 if theme else 119) or not (theme or {}).get("terrain", {"sea": True}).get("sea", True):
            break
    if best is None:
        raise RuntimeError("No road found that keeps clear of itself; change the course's seed.")
    _, curv, xs, ys, hs, chosen = best
    if pinned is None:
        print(f'Layout {chosen} chosen: add "layout": {chosen} to the course file to build it again at once.', flush=True)
    n = len(curv)

    # A theme may gather a stage's climb or descent into a ramp at its start (`ramp`: the share of an effort's stretch
    # that climbs, and of a recovery's that descends) and run level for the rest: a hill a rider can see, for the
    # same metres climbed. Docklands' efforts are ramps up onto its harbour bridges.
    ramp = grade_rule.get("ramp", {})
    grades = []
    for i in range(n):
        stage = stage_at(st, i * STEP - LEAD_IN)
        g = (stage["level"] - mean) * per_level if stage else 0.0
        d = i * STEP - LEAD_IN
        share = ramp.get(stage["kind"]) if stage else None
        if share:
            g = g / share if (d - stage["from"]) < (stage["to"] - stage["from"]) * share else 0.0
        if roll and 0 < d < length - 300:
            # Rolling ground between the class's hills, so every map rises and falls along the way.
            g += roll * math.sin(math.tau * d / wave + 0.7) * smoothstep(0, 120, d)
        if climb and stage:
            g += -climb if stage["kind"] == "cool-down" else climb
        grades.append(g)
    grades = box_smooth(grades, int((40 if ramp else 28) / STEP))
    if course.get("climbingMetres"):
        # A catalogue map climbs what it lists: every gradient is scaled alike, so each hill keeps its place
        # and its share of the climbing.
        start, finish = int(LEAD_IN / STEP), int((LEAD_IN + length) / STEP)
        climbed = sum(max(0.0, g) / 100.0 * STEP for g in grades[start + 1 : finish + 1])
        if climbed > 0:
            scale = course["climbingMetres"] / climbed
            grades = [g * scale for g in grades]
            per_level *= scale
    zs, z = [], 0.0
    for g in grades:
        z += g / 100.0 * STEP
        zs.append(z)
    low = min(zs)
    zs = [v - low + theme.get("sea_clearance", SEA_CLEARANCE) for v in zs]
    samples = [
        {"x": xs[i], "y": ys[i], "z": zs[i], "h": hs[i], "k": curv[i], "g": grades[i], "d": i * STEP - LEAD_IN}
        for i in range(n)
    ]
    if theme.get("bridges"):
        # A theme of bridges: from the foot of each effort's ramp, the road is a bridge for as long as it stands
        # `BRIDGE_CLEAR` above where the ramp began. A bridge's samples are marked: no quay is laid beside them, the
        # land beneath them is the harbour's bed, and nothing is stood on them but their own lamps.
        for stage in st:
            if stage["kind"] != "work":
                continue
            i0 = int((stage["from"] + LEAD_IN) / STEP)
            foot = samples[i0]["z"]
            for i in range(i0, min(n, i0 + int(1400 / STEP))):
                if samples[i]["z"] > foot + BRIDGE_CLEAR:
                    samples[i]["bridge"] = True
                elif i > i0 + int(120 / STEP):
                    break
    return samples, st, length, mean, per_level


# --- Meshes -----------------------------------------------------------------------------------


def srgb(hex_: int) -> tuple[float, float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin((hex_ >> 16 & 255) / 255), lin((hex_ >> 8 & 255) / 255), lin((hex_ & 255) / 255), 1.0)


MATERIALS: dict[str, dict] = {
    "asphalt": {"color": 0x3A3842, "rough": 0.92},
    "paint": {"color": 0xF4F0E6, "rough": 0.7},
    "yellow": {"color": 0xF2B21E, "rough": 0.7},
    "kerb-red": {"color": 0xE23A4E, "rough": 0.7},
    "promenade": {"color": 0xD9D2C6, "rough": 0.85},
    "wall": {"color": 0xF6F1EA, "rough": 0.8},
    "stone": {"color": 0xB9A58C, "rough": 0.95},
    "sand": {"color": 0xE6CFA0, "rough": 1.0},
    "terrain": {"color": 0xFFFFFF, "rough": 1.0, "vertex": True},
    "sea": {"color": 0x1F9AA6, "rough": 0.15, "metal": 0.1},
    "trunk": {"color": 0x8A6A48, "rough": 0.9},
    "trunk-dark": {"color": 0x6A4E36, "rough": 0.9},
    "leaf": {"color": 0x3E7E44, "rough": 0.8, "double": True},
    "leaf-dark": {"color": 0x1F5634, "rough": 0.8, "double": True},
    # Last year's fronds, hanging dry under the crown.
    "leaf-dry": {"color": 0xA88A52, "rough": 0.9, "double": True},
    "glint": {"color": 0xFFD9A0, "glow": 2.0},
    "bush": {"color": 0x3F7A46, "rough": 0.9},
    "bougainvillea": {"color": 0xD02A8A, "rough": 0.8},
    "whitewash": {"color": 0xF8F3EA, "rough": 0.85},
    "wood": {"color": 0x8A6440, "rough": 0.8},
    "dark": {"color": 0x18181C, "rough": 0.6},
    "rock": {"color": 0x8C7B6A, "rough": 1.0},
    "skin": {"color": 0xD9A17C, "rough": 0.8},
    "skin-1": {"color": 0xB97A56, "rough": 0.8},
    "skin-2": {"color": 0x7A4A34, "rough": 0.8},
    "hair-0": {"color": 0x1E1612, "rough": 0.9},
    "hair-1": {"color": 0x5A3A22, "rough": 0.9},
    "hair-2": {"color": 0xD8B878, "rough": 0.9},
    # The IBIZA letters: white, their faces dark, on a pale blue plinth.
    "sign-white": {"color": 0xF2F0EA, "rough": 0.7},
    "sign-face": {"color": 0x23262E, "rough": 0.5},
    "sign-plinth": {"color": 0xA9CFE6, "rough": 0.8},
    # The island's white: linen shirts and summer dresses.
    "party-white": {"color": 0xF4EEE4, "rough": 0.9},
    # What is in the glass: it catches the light, so it glows a little.
    "drink-0": {"color": 0xFFB030, "glow": 0.9},
    "drink-1": {"color": 0xFF5A8A, "glow": 0.9},
    "drink-2": {"color": 0xB8F060, "glow": 0.9},
    "club-window": {"color": 0x2C4658, "rough": 0.3},
    "awning": {"color": 0xE8566E, "rough": 0.8, "double": True},
    "awning-white": {"color": 0xF6F1EA, "rough": 0.8, "double": True},
    "glow-door": {"color": 0xFF9A4A, "glow": 1.3},
    "lamp-red": {"color": 0xFF3020, "glow": 2.2},
    "lamp-green": {"color": 0x3AFF7A, "glow": 2.2},
    "neon-pink": {"color": 0xFF4A9A, "glow": 2.0},
    "neon-cyan": {"color": 0x3AE8FF, "glow": 2.0},
    "neon-amber": {"color": 0xF2C230, "glow": 2.0},
    "neon-violet": {"color": 0xB88AFF, "glow": 2.0},
    "neon-lime": {"color": 0xD7FF3A, "glow": 2.0},
    "gold": {"color": 0xFFB82A, "glow": 1.1},
    "confetti": {"color": 0xFFC83A, "glow": 1.0, "double": True},
    "bulb": {"color": 0xFFE0A0, "glow": 2.4},
    "chevron": {"color": 0xFF5AA8, "glow": 0.9},
    "arrow": {"color": 0xF2C230, "rough": 0.6},
    "sail": {"color": 0xFFFFFF, "rough": 0.8, "double": True},
    "sail-pink": {"color": 0xF06A9A, "rough": 0.8, "double": True},
    "sun": {"color": 0xFF7A3A, "glow": 1.3},
    "sky": {"color": 0xF2A77A, "glow": 1.0},
    "island": {"color": 0x5A3F52, "rough": 1.0},
    "peaks": {"color": 0xFFFFFF, "rough": 1.0, "vertex": True},
    "funivia": {"color": 0xFFFFFF, "rough": 0.55, "vertex": True},
    "glider": {"color": 0xFFFFFF, "rough": 0.75, "vertex": True},
    "beam-pink": {"color": 0xFF5AA8, "glow": 2.2, "alpha": 0.2, "double": True},
    "beam-cyan": {"color": 0x5AE8F0, "glow": 2.2, "alpha": 0.2, "double": True},
    "beam-amber": {"color": 0xFFC060, "glow": 2.2, "alpha": 0.2, "double": True},
    "crowd-0": {"color": 0xFF4A9A, "rough": 0.9},
    "crowd-1": {"color": 0x3AC8E8, "rough": 0.9},
    "crowd-2": {"color": 0xF2C230, "rough": 0.9},
    "crowd-3": {"color": 0xFF7A3A, "rough": 0.9},
    "crowd-4": {"color": 0x8A5AE8, "rough": 0.9},
    "crowd-5": {"color": 0x3A4A9A, "rough": 0.9},
}
MATERIALS.update({k: v for k, v in themes.MATERIALS.items() if k not in MATERIALS})
for monument in ("khafre","khufu","menkaure","sphinx","relief"):
    MATERIALS["giza-"+monument] = MATERIALS["terrain"]
MATERIALS["moon"] = themes.MATERIALS["moon"]
NEONS = ["neon-pink", "neon-cyan", "neon-amber", "neon-violet", "neon-lime"]
BEAMS = ["beam-pink", "beam-cyan", "beam-amber"]
CROWD = [f"crowd-{i}" for i in range(6)]
# Across the road, in metres from its centre line: the sea is on the left, the clubs on the right.
SIDEWALK = 2.4  # the left sidewalk's width, kerb to seawall
TERRACE = 9.0  # the right promenade's width, kerb to the clubs' fronts


def material(name: str):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    spec = MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    colour = srgb(spec["color"])
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = spec.get("rough", 0.6)
    bsdf.inputs["Metallic"].default_value = spec.get("metal", 0.0)
    if "glow" in spec:
        bsdf.inputs["Emission Color"].default_value = colour
        bsdf.inputs["Emission Strength"].default_value = spec["glow"]
    if "alpha" in spec:
        bsdf.inputs["Alpha"].default_value = spec["alpha"]
        for attr, value in (("blend_method", "BLEND"), ("surface_render_method", "BLENDED")):
            try:
                setattr(mat, attr, value)
            except (AttributeError, TypeError):
                pass
    if spec.get("vertex"):
        attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "Color"
        mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    mat.use_backface_culling = not spec.get("double", False)
    mat.diffuse_color = colour
    return mat


class Builder:
    """One mesh of one material, gathered face by face."""

    # The collection the map is built into: a part built into it joins the assembly (see `assemble`).
    map_collection = None

    def __init__(self, name: str, mat: str):
        self.name, self.mat = name, mat
        self.verts: list[tuple[float, float, float]] = []
        self.faces: list[tuple[int, ...]] = []
        self.colours: list[tuple[float, float, float, float]] | None = None
        # A UV a vertex, for a part whose material the app draws from it (the windows).
        self.uvs: list[tuple[float, float]] | None = None

    def v(self, p) -> int:
        self.verts.append((p[0], p[1], p[2]))
        return len(self.verts) - 1

    def quad(self, a, b, c, d) -> None:
        self.faces.append((self.v(a), self.v(b), self.v(c), self.v(d)))

    def tri(self, a, b, c) -> None:
        self.faces.append((self.v(a), self.v(b), self.v(c)))

    def box(self, centre, size, yaw: float = 0.0) -> None:
        """A box on its base centre: `size` is (along, across, height)."""
        cx, cy, cz = centre
        hx, hy, h = size[0] / 2, size[1] / 2, size[2]
        c, s = math.cos(yaw), math.sin(yaw)
        base = len(self.verts)
        for z in (cz, cz + h):
            for dx, dy in ((-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)):
                self.verts.append((cx + dx * c - dy * s, cy + dx * s + dy * c, z))
        # No underside: a box stands on something, and nothing looks up at it.
        for f in ((4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
            self.faces.append(tuple(base + i for i in f))

    def build(self, collection):
        if not self.faces:
            return None
        if collection is Builder.map_collection:
            # A part of the map: `assemble` builds the map's meshes from every part.
            PARTS.append(self)
            return None
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts, [], self.faces)
        if self.colours:
            layer = mesh.color_attributes.new("Color", "FLOAT_COLOR", "POINT")
            for i, c in enumerate(self.colours):
                layer.data[i].color = c
        mesh.materials.append(material(self.mat))
        # Faces laid one by one share their corners once welded: half the vertices for the road and the land.
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        collection.objects.link(obj)
        return obj


PARTS: list[Builder] = []
CHUNK = 240.0  # metres of road a chunk of the map holds: the app draws only the chunks near the rider
# The land and the light beams are few triangles a chunk: theirs are four times as long, a quarter as many meshes.
# Materials whose colour is not shaded by height (see `assemble`): the road's own, and what hangs clear of the ground.
UNSHADED = {"asphalt", "paint", "yellow", "kerb-red", "promenade", "sand", "club-window", "awning", "awning-white"}
# Parts the film's staging looks up by name: kept whole in the scene, out of the glb, beside their chunks.
FILM_KEEPS = {"GlowLamp"}
# The ground the road builds: the asphalt, its paint and kerbs, the pavements and the shoulders. Its own group, with
# each vertex's place on the road in its UV (metres left of the centre line, metres from the start line), so the app
# can draw its surface, its wear and the lamps' light on it (L2-166 AC13).
GROUND_PARTS = {"Road", "RoadPaint", "Kerbs", "CentreLine", "Promenade", "Shoulder"}
# The walls of what is built: their own group, with each vertex's place on its wall in its UV (metres along the
# wall, metres above the road beside it), so the app can draw brick courses, a container's ribs or stained plaster
# (L2-166 AC15). The kind of wall rides in the UV too: `WALL_KIND_STEP` metres are added to the height for each kind
# (the exporter keeps no alpha in a vertex's colour). Roofs and floors are kind 0, their UV their place on the map.
WALL_KIND_STEP = 1000.0
# The city on the horizon: one mesh, never cut into chunks and always drawn, its towers walls of a kind of their
# own, whose lit windows the app draws (L2-166 AC17).
SKYLINE_PART, SKYLINE_KIND = "Skyline", 4
# Windows: one flat panel each, in a group of their own, its UV the place on the pane (0 to 1 each way) with 2 added
# across for a lit window and 2 added up for each step of the window's own number, from which the app draws its
# frame, its panes and the room behind them (L2-166 AC18; `Kit.window` in themes.py).
WINDOWS_PART = "Windows"
# Railings and fences: one flat panel a stretch, in a group of their own, its UV the metres along it and the share of
# its height, from which the app draws the posts and the rails (L2-166 AC19; `Kit.fence` in themes.py).
FENCES_PART = "Fences"
# The glow in the air round a light: four corners at the light's own place, in a group of their own, which the app
# spreads to face the eye (L2-166 AC21; `Kit.halo` in themes.py). Its UV is the corner.
HALOS_PART = "Halos"
WALL_KINDS = {"brick": 1, **{f"container-{i}": 2 for i in range(4)}, "whitewash": 3, "chalet-plaster": 3, "tower": 3, "wall": 3, "stone": 5, "dolomite-pale": 5, "larch-aged": 6, "larch-warm": 6, "chalet-wood": 6,
              **{f"facade-{i}": 3 for i in range(6)}, **{f"deco-{i}": 3 for i in range(4)}}
WIDER = {"Land": 4, "Beams": 6, "Glow": 6, "Leaves": 1, "Halos": 4, "Ground": 2}
WHOLE = {"commissaire":"Commissaire","team-car":"TeamCar","sea": "Sea", "sky": "Sky", "sun": "Sun", "moon": "Sun", "island": "Conillera", "peaks": "Peaks", "funivia": "Funivia", "glider": "Glider", "tuk-tuk": "TukTuk", "touring-bike": "TouringBike", "tour-boat": "TourBoat", "commuter": "Commuter", "orange-smoke": "Smoke", "moored-boats": "Boats", "lamp-red": "StartRed", "lamp-green": "StartGreen"}


def group_of(mat: str) -> tuple[str, bool]:
    """The mesh a part's faces join, and whether that mesh is cut into chunks along the road."""
    if mat.startswith("giza-"):
        return mat[5:].capitalize(), False
    if mat == "arenberg-foliage":
        return "Foliage", True
    if mat == "pave":
        return "Pave", True
    if mat == "angliru-concrete":
        return "Ground", True
    if mat in WHOLE:
        return WHOLE[mat], False
    spec = MATERIALS[mat]
    if mat == "elm-shade":
        return "Dapple", True
    if mat in ("canal-front", "elm-leaves"):
        return ("Facades" if mat == "canal-front" else "Elms"), True
    if mat == "confetti":
        return "Confetti", True
    if mat.startswith("gardena-"):
        return mat.split("-")[1].capitalize(), True
    if mat.startswith("galibier-"):
        return mat.split("-")[1].capitalize(), True
    if mat.startswith("furka-"):
        return mat.split("-")[1].capitalize(), True
    if mat.startswith("fuji-"):
        return mat.split("-")[1].capitalize(), True
    if mat.startswith("fishhill-"):
        return mat.split("-")[1].capitalize(), True
    if mat.startswith("fen-"):
        return mat.split("-")[1].capitalize(), True
    if mat in ("etna-clinker","etna-scoria","etna-bitumen"):
        return mat.split("-")[1].capitalize(), True
    if mat == "terrain":
        return "Land", True
    if "alpha" in spec:
        return "Beams", True
    if "glow" in spec:
        return "Glow", True
    return ("Leaves" if spec.get("double") else "Solid"), True


def group_material(name: str):
    """One material a group: every face's colour is in its vertices, so a chunk of a group is one draw call."""
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    attr = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Color"
    mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.2 if name == "Sea" else 0.85
    if name in ("Glow", "Confetti", "Sun", "Sky", "StartRed", "StartGreen", "Beams"):
        mat.node_tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 1.5
    if name == "Beams":
        bsdf.inputs["Alpha"].default_value = 0.22
        for key, value in (("blend_method", "BLEND"), ("surface_render_method", "BLENDED")):
            try:
                setattr(mat, key, value)
            except (AttributeError, TypeError):
                pass
    mat.use_backface_culling = name not in ("Leaves", "Confetti", "Beams")
    return mat


def assemble(road: "Road", col, wider: dict | None = None) -> dict:
    """Builds the map's meshes: each group's faces, welded, coloured by vertex and cut into chunks along the road.
    `wider` overrides how many chunks long a group's meshes are (a theme's `chunks`): a world that paints much
    into its land cuts it shorter, so less of it is drawn at once."""
    per_chunk = int(CHUNK / STEP)
    wide = {**WIDER, **(wider or {})}
    meshes: dict[str, dict] = {}
    film = None
    for part in PARTS:
        if part.name in FILM_KEEPS:
            if film is None:
                film = bpy.data.collections.new("Film")
                bpy.context.scene.collection.children.link(film)
                film.hide_viewport = film.hide_render = True
            data = bpy.data.meshes.new(part.name)
            data.from_pydata(part.verts, [], part.faces)
            film.objects.link(bpy.data.objects.new(part.name, data))
        group, chunked = group_of(part.mat)
        surfaces = {'Laid trackway panels':'FestivalPanels','Churned wheel ruts':'FestivalMud','Somerset pasture':'FestivalGrass'}
        if part.name in ('FestivalPrint','FestivalBulbs'):
            group = part.name
        elif part.name in surfaces:
            group = surfaces[part.name]
        elif part.name == "Desert floor":
            group = "Dunes"
        elif part.name == "Plateau asphalt":
            group = "Tarmac"
        elif part.name == "VelodromeTimber":
            group, chunked = "VelodromeTimber", False
        elif part.name == 'KerioRim':
            group, chunked = part.name, False
        elif part.name in ('Murram', 'ItenFlora','ParkTarmac','LongWater','LondonPlanes','ParkPavilion','ParkVisitors'):
            group, chunked = part.name, True
        elif part.name == 'LandmarkLights':
            group, chunked = 'Glow', False
        elif part.name == 'Manx uplands':
            group, chunked = 'ManxMoor', True
        elif part.name == "SawatchSkyline":
            group, chunked = part.name, False
        elif part.name in ("SawatchGround", "AspenGrove", "RoaringFork", "SawatchRock", "PassSnow", "CabinLogs", "DivideSign", "TwinLakes"):
            group, chunked = part.name, True
        elif part.name == "IceCap":
            group, chunked = part.name, False
        elif part.name in ('IcelandLand','Basalt','Glacier','Falls','GlacialWater','Icebergs','Grazers'):
            group, chunked = part.name, True
        elif part.name in ("Tenements", "RaceBoards"):
            group = part.name
        elif part.name == 'ParkCrowns':
            group = 'ParkCrowns'
        elif part.name == 'Rolling park lawns':
            group = 'ParkLawns'
        elif part.name in ('CanyonStrata','GrandviewTemple','Watchtower','FarRim','ColoradoBend'):
            group = part.name
        elif part.name in ("BlackCanyon","CanyonCrags","MeadWater","BypassArch","IntakeCrown","DamClocks","Terrazzo","DamFace","BoulderBasin","CrestVisitor","RoadShimmer"):
            group=part.name
            chunked=group in ("BlackCanyon","CanyonCrags","MeadWater","RoadShimmer")
        elif part.name in ('StripDancers','StripFestoons','StripBeams','StripFleet','CoveFoam','StripCloth'):
            group,chunked=part.name,True
        elif part.name in GROUND_PARTS:
            group = "Ground"
        elif part.name in ("MaleconStone","FloridaStraits","Portales","OriginalElevations","Nacional","Morro","WallSpray","SaltPuddles","TaxiRed","TaxiTeal","Convertible","CocoTaxi","BiciTaxi","SonTrio","Parada","DominoTable","FruitCart","Manisero","PhotoParty","ZebraCrossing"):
            group = part.name
            chunked = group in ("MaleconStone","Portales","OriginalElevations","WallSpray","SaltPuddles")
        elif part.name in ("PassWarning","PassPlate","CaravanPlate","HerdwickHead","FortGate","FellGround","FellMist","FellVerge","FellFar","ScafellRange","EskdaleVale","ScafellPikes","HerdwickCross"):
            group = part.name
            chunked = group not in ("PassWarning","PassPlate","CaravanPlate","FortGate","FellMist","FellFar","ScafellRange","EskdaleVale","ScafellPikes","HerdwickCross")
        elif part.name in ("YeouidoCity", "BanpoJets", "BanpoNear", "HanCyclists", "HanReflections", "HanWater", "NamsanTower"):
            group = part.name
            chunked = group not in ("YeouidoCity", "HanWater", "NamsanTower", "BanpoNear", "HanCyclists")
        elif part.name in ("HkWindCloud", "HkCraterFloor"):
            group, chunked = part.name, False
        elif part.name in ("HkFlank", "HkRanchHead", "HkCrowns", "HkGardenPlant", "HkSolarDrum"):
            group = part.name
        elif part.name in ("Clifftop", "RockWash", "SaltSpray", "OtwayPlants", "PortLimestone", "Apostle", "LondonArch", "MemorialArch", "SouthernOcean", "CoastSigns"):
            group = part.name
        elif part.name in ("ColTarmac", "ColConifers", "FellGround", "Meltwater", "NorthFace", "ColSigns", "SummitSign", "SixthBorne"):
            group = part.name
        elif part.name == WINDOWS_PART:
            group = "Windows"
        elif part.name == FENCES_PART:
            group = "Fences"
        elif part.name == HALOS_PART:
            group = "Halos"
        elif part.name == SKYLINE_PART:
            group, chunked = "Skyline", False
        elif part.mat in WALL_KINDS and chunked:
            group = "Walls"
        flat = srgb(MATERIALS[part.mat]["color"])
        for face in part.faces:
            name = group
            if group == "Sky":
                # The sky is cut into sectors round the compass, so only those in view are drawn.
                cx = sum(part.verts[i][0] for i in face) / len(face)
                cy = sum(part.verts[i][1] for i in face) / len(face)
                cz = sum(part.verts[i][2] for i in face) / len(face)
                name = f"Sky_{int((math.atan2(cy, cx) % math.tau) / math.tau * SKY_SECTORS) % SKY_SECTORS:03d}"
            if chunked:
                cx = sum(part.verts[i][0] for i in face) / len(face)
                cy = sum(part.verts[i][1] for i in face) / len(face)
                _, j, _ = road.tree.find((cx, cy, 0.0))
                name = f"{group}_{j // (per_chunk * wide.get(group, 1)):03d}"
            mesh = meshes.setdefault(name, {"group": group, "verts": [], "cols": [], "uvs": [], "faces": [], "index": {}})
            ids = []
            walled = group in ("Walls", "Skyline")
            if walled:
                # The wall's own axes: along it (level, square to the way it faces) and up it.
                a, b, c_ = (part.verts[i] for i in face[:3])
                nx = (b[1] - a[1]) * (c_[2] - a[2]) - (b[2] - a[2]) * (c_[1] - a[1])
                ny = (b[2] - a[2]) * (c_[0] - a[0]) - (b[0] - a[0]) * (c_[2] - a[2])
                nz = (b[0] - a[0]) * (c_[1] - a[1]) - (b[1] - a[1]) * (c_[0] - a[0])
                flat_len = math.hypot(nx, ny)
                upright = flat_len > abs(nz)
                tx, ty = (-ny / flat_len, nx / flat_len) if upright else (1.0, 0.0)
                kind = (SKYLINE_KIND if group == "Skyline" else WALL_KINDS[part.mat]) if upright else 0
            for i in face:
                v = part.verts[i]
                c = part.colours[i] if part.colours else flat
                if group == "Solid" and part.mat not in UNSHADED:
                    # Baked into the colour, so it costs the app nothing: dark where a wall meets the ground, lighter
                    # towards its top, where more of the sky reaches it.
                    _, near, _ = road.tree.find((v[0], v[1], 0.0))
                    lift = v[2] - road.s[near]["z"]
                    shade = 0.74 + 0.3 * smoothstep(0.0, 4.5, lift) if lift > 0.2 else (0.62 if lift < -0.3 else 1.0)
                    c = (c[0] * shade, c[1] * shade, c[2] * shade, 1.0)
                key = (round(v[0], 3), round(v[1], 3), round(v[2], 3), round(c[0], 3), round(c[1], 3), round(c[2], 3))
                if group in ("Windows", "Fences", "Halos", "DamClocks", "Terrazzo", "DamFace", "BoulderBasin", "MaleconStone", "Portales","OriginalElevations", "WallSpray", "SaltPuddles", "PassWarning", "PassPlate", "CaravanPlate", "HerdwickHead", "FellMist", "HerdwickCross", "EskdaleVale", "ScafellPikes", "HkCrowns", "HkRanchHead", "Clifftop", "SaltSpray", "OtwayPlants", "SouthernOcean", "PortLimestone", "LondonArch", "Apostle", "CoastSigns", "ColConifers", "FellGround", "NorthFace", "ColSigns", "SummitSign", "SixthBorne", "CanyonStrata", "GrandviewTemple", "FarRim", "ParkCrowns", "FestivalPrint", "Tenements", "RaceBoards", "Relief", "VelodromeTimber", "Foliage", "Facades", "Elms", "Dapple", "StripDancers", "StripFestoons", "StripBeams", "StripFleet", "CoveFoam", "StripCloth", "IceCap", "AspenGrove", "DivideSign", "SawatchSkyline", "ItenFlora", "KerioRim","ParkTarmac","LongWater","LondonPlanes","ParkPavilion","ParkVisitors") or (group == "Ground" and part.uvs is not None):
                    key = (*key, *part.uvs[i])
                if walled:
                    _, near, _ = road.tree.find((v[0], v[1], 0.0))
                    wall_uv = (v[0] * tx + v[1] * ty, v[2] - road.s[near]["z"] + kind * WALL_KIND_STEP) if upright else (v[0], v[1] % 400.0)
                    key = (*key, kind, round(wall_uv[0], 3), round(wall_uv[1], 3))
                at = mesh["index"].get(key)
                if at is None:
                    at = mesh["index"][key] = len(mesh["verts"])
                    mesh["verts"].append(v)
                    mesh["cols"].append(c)
                    if group in ("Windows", "Fences", "Halos", "DamClocks", "Terrazzo", "DamFace", "BoulderBasin", "MaleconStone", "Portales","OriginalElevations", "WallSpray", "SaltPuddles", "PassWarning", "PassPlate", "CaravanPlate", "HerdwickHead", "FellMist", "HerdwickCross", "EskdaleVale", "ScafellPikes", "HkCrowns", "HkRanchHead", "Clifftop", "SaltSpray", "OtwayPlants", "SouthernOcean", "PortLimestone", "LondonArch", "Apostle", "CoastSigns", "ColConifers", "FellGround", "NorthFace", "ColSigns", "SummitSign", "SixthBorne", "CanyonStrata", "GrandviewTemple", "FarRim", "ParkCrowns", "FestivalPrint", "Tenements", "RaceBoards", "Relief", "VelodromeTimber", "Foliage", "Facades", "Elms", "Dapple", "StripDancers", "StripFestoons", "StripBeams", "StripFleet", "CoveFoam", "StripCloth", "IceCap", "AspenGrove", "DivideSign", "SawatchSkyline", "ItenFlora", "KerioRim","ParkTarmac","LongWater","LondonPlanes","ParkPavilion","ParkVisitors"):
                        mesh["uvs"].append(part.uvs[i])
                    if walled:
                        mesh["uvs"].append(wall_uv)
                    if group == "Ground" and part.uvs is not None:
                        mesh["uvs"].append(part.uvs[i])
                    elif group in ("Ground", "Pave", "FestivalPanels", "FestivalMud", "FestivalGrass", "ParkLawns"):
                        _, near, _ = road.tree.find((v[0], v[1], 0.0))
                        p = road.s[near]
                        dx, dy = v[0] - p["x"], v[1] - p["y"]
                        ch, sh = math.cos(p["h"]), math.sin(p["h"])
                        mesh["uvs"].append((-sh * dx + ch * dy, p["d"] + ch * dx + sh * dy))
                ids.append(at)
            if len(set(ids)) == len(ids):
                mesh["faces"].append(tuple(ids))
    triangles = 0
    for name in sorted(meshes):
        m = meshes[name]
        data = bpy.data.meshes.new(name)
        data.from_pydata(m["verts"], [], m["faces"])
        layer = data.color_attributes.new("Color", "FLOAT_COLOR", "POINT")
        layer.data.foreach_set("color", [c for col_ in m["cols"] for c in (col_[0], col_[1], col_[2], 1.0)])
        if m["uvs"]:
            layer = data.uv_layers.new(name="Road")
            at = [0] * len(data.loops)
            data.loops.foreach_get("vertex_index", at)
            layer.data.foreach_set("uv", [c for i in at for c in m["uvs"][i]])
        data.materials.append(group_material(m["group"]))
        data.update()
        col.objects.link(bpy.data.objects.new(name, data))
        triangles += sum(len(f) - 2 for f in m["faces"])
    PARTS.clear()
    return {"meshes": len(meshes), "triangles": triangles}


class Road:
    """Places things by their metres along the road, their metres left of it and their height."""

    def __init__(self, samples: list[dict]):
        self.s = samples
        self.tree = kdtree.KDTree(len(samples))
        for i, p in enumerate(samples):
            self.tree.insert((p["x"], p["y"], 0.0), i)
        self.tree.balance()

    def index(self, d: float) -> int:
        return max(0, min(len(self.s) - 1, round((d + LEAD_IN) / STEP)))

    def at(self, i: int, left: float = 0.0, up: float = 0.0):
        p = self.s[i]
        return (p["x"] - math.sin(p["h"]) * left, p["y"] + math.cos(p["h"]) * left, p["z"] + up)

    def pos(self, d: float, left: float = 0.0, up: float = 0.0):
        """The place `d` metres from the start line, eased between the samples either side."""
        f = max(0.0, min(len(self.s) - 1.001, (d + LEAD_IN) / STEP))
        i = int(f)
        a, b = self.at(i, left, up), self.at(i + 1, left, up)
        t = f - i
        return tuple(a[k] + (b[k] - a[k]) * t for k in range(3))

    def clear_of_road(self, x: float, y: float, radius: float, i: int, lag: float = 60.0) -> bool:
        for _, j, _ in self.tree.find_range((x, y, 0.0), radius):
            if abs(j - i) * STEP > lag:
                return False
        return True


def noise(x: float, y: float) -> float:
    return (
        math.sin(x * 0.021 + 1.3) * math.cos(y * 0.017 - 0.6)
        + 0.5 * math.sin(x * 0.053 - y * 0.047 + 2.1)
        + 0.25 * math.sin(x * 0.131 + y * 0.117)
    ) / 1.75


def smoothstep(a: float, b: float, v: float) -> float:
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def build_road(road: Road, st: list[dict], length: float, col, theme: dict | None = None) -> None:
    if theme and theme.get("road_builder"):
        return theme["road_builder"](road, st, length, col, sys.modules[__name__])
    edge = (theme or {}).get("edge", "seawall")
    white_centre = (theme or {}).get("centre") == "white"
    # A racing circuit's red-and-white kerbs round a bend; a theme whose road is a public one turns them off.
    kerbs = (theme or {}).get("kerbs", True)
    s = road.s
    n = len(s)
    asphalt, paint, red = Builder("Road", "asphalt"), Builder("RoadPaint", "paint"), Builder("Kerbs", "kerb-red")
    yellow, prom, sand = Builder("CentreLine", "yellow"), Builder("Promenade", "promenade"), Builder("Shoulder", "sand")
    wall, chev = Builder("Seawall", "wall"), Builder("EffortChevrons", "chevron")
    kerb = ROAD_HALF + 0.6

    def strip(b: Builder, i: int, l0: float, u0: float, l1: float, u1: float) -> None:
        """A quad from sample i to i+1 between two offsets; `l0` is the further left."""
        b.quad(road.at(i, l0, u0), road.at(i, l1, u1), road.at(i + 1, l1, u1), road.at(i + 1, l0, u0))

    def edges(i: int) -> None:
        """Each theme's road edge beyond the kerbs: verge, pavement, quay, beach, cliff, rail or parapet."""
        if s[i].get("bridge") and s[i + 1].get("bridge"):
            # A bridge: a walkway each side, a parapet a metre high with a flat top, and the deck's edge below it.
            walk, top, deep = kerb + 1.5, 1.05, -1.3
            strip(prom, i, walk, 0.12, kerb, 0.12)
            strip(wall, i, walk, top, walk, 0.12)
            strip(wall, i, walk + 0.3, top, walk, top)
            strip(wall, i, walk + 0.3, deep, walk + 0.3, top)
            strip(prom, i, -kerb, 0.12, -walk, 0.12)
            strip(wall, i, -walk, 0.12, -walk, top)
            strip(wall, i, -walk, top, -(walk + 0.3), top)
            strip(wall, i, -(walk + 0.3), top, -(walk + 0.3), deep)
            if i % 9 == 4:
                # A pier down into the water.
                mid = road.at(i, 0.0)
                wall.box((mid[0], mid[1], -9.0), (2.4, 2 * walk - 1.0, mid[2] + 9.0 + deep), s[i]["h"])
            return
        if edge == "gracht":
            strip(prom, i, 5.2, 0.035, kerb, 0.035)
            strip(prom, i, -kerb, 0.08, -8.6, 0.08)
            return
        if edge == "verge":
            strip(sand, i, kerb + 8.0, -0.25, kerb, 0.12)
            strip(sand, i, kerb + 14.0, -1.6, kerb + 8.0, -0.25)
            strip(sand, i, -kerb, 0.12, -(kerb + 8.0), -0.25)
            strip(sand, i, -(kerb + 8.0), -0.25, -(kerb + 14.0), -1.6)
            return
        if edge in ("pavement", "quay", "beach"):
            strip(prom, i, kerb + 3.0, 0.12, kerb, 0.12)
            strip(prom, i, -kerb, 0.12, -(kerb + 3.0), 0.12)
            if edge == "quay":
                # The quay: wide stone apron, then the quay wall straight down into the harbour.
                strip(prom, i, kerb + 26.0, 0.12, kerb + 3.0, 0.12)
                strip(wall, i, kerb + 26.0, -5.0, kerb + 26.0, 0.12)
            elif edge == "beach":
                strip(wall, i, kerb + 3.3, 0.6, kerb + 3.0, 0.6)
                strip(wall, i, kerb + 3.0, 0.6, kerb + 3.0, 0.12)
                strip(sand, i, kerb + 26.0, -1.6, kerb + 3.3, 0.6)
            else:
                strip(prom, i, kerb + 9.0, 0.12, kerb + 3.0, 0.12)
            strip(prom, i, -(kerb + 3.0), 0.12, -(kerb + 12.0), 0.12)
            strip(sand, i, -(kerb + 12.0), 0.12, -(kerb + 16.0), -2.4)
            if edge == "pavement":
                strip(sand, i, kerb + 13.0, -2.4, kerb + 9.0, 0.12)
            return
        # Mountain and cliff roads: a gravel shoulder, then the land.
        strip(sand, i, kerb + 2.4, 0.0, kerb, 0.12)
        strip(sand, i, -kerb, 0.12, -(kerb + 2.4), 0.0)
        drop = -6.0 if edge == "cliff" else -2.2
        strip(sand, i, kerb + 7.0, drop, kerb + 2.4, 0.0)
        strip(sand, i, -(kerb + 2.4), 0.0, -(kerb + 7.0), -1.6)

    stones = Builder("Crowned five-star sector", "pave") if edge == "pave" else None
    slab = Builder("Grooved concrete", "angliru-concrete") if edge == "angliru" else None
    for i in range(n - 1):
        if stones is not None:
            if 320 <= s[i]["d"] < 2720:
                strip(stones,i,2.12,-.075,1.1,.025)
                strip(stones,i,1.1,.025,0,.08)
                strip(stones,i,0,.08,-1.1,.025)
                strip(stones,i,-1.1,.025,-2.12,-.075)
            else:
                strip(asphalt,i,2.12,0,-2.12,0)
            for side in (-1,1):
                strip(sand,i,side*2.12,-.075,side*3.12,-.105)
            continue
        if edge == 'scheldt':
            strip(asphalt,i,4.9,0,-4.9,0)
            strip(prom,i,11,-.05,4.9,0)
            strip(prom,i,-4.9,0,-9,-.04)
            # Two flanged rails embedded in concrete on the dock side.
            for offset in (3.0,4.435):
                strip(wall,i,offset+.053,.012,offset-.053,.012)
            continue
        if slab is not None:
            on_ramp = s[i]["g"] >= 12
            strip(slab if on_ramp else asphalt, i, 3.12, 0.0, -3.12, 0.0)
            strip(sand, i, 4.7, -.06, 3.12, 0.0)
            strip(sand, i, -3.12, 0.0, -4.7, -.06)
            if on_ramp:
                for u in (0,.5,1,1.5,2,2.5,3,3.5):
                    d=s[i]["d"]+u
                    slab.quad(road.pos(d,-2.98,.011),road.pos(d,2.98,.011),road.pos(d+.04,2.98,.025),road.pos(d+.04,-2.98,.025))
            continue
        if edge == "laterite":
            # Unmarked tarmac meets the dusty red shoulder at grade through the jungle.
            half = 3.65
            strip(asphalt, i, half, 0.0, -half, 0.0)
            strip(sand, i, 7.1, -.06, half, 0.0)
            strip(sand, i, -half, 0.0, -7.1, -.06)
            continue
        strip(asphalt, i, ROAD_HALF, 0.0, -ROAD_HALF, 0.0)
        # The double yellow line down the middle and a white line inside each edge.
        if edge == "gracht":
            # Cycle quays use clinker courses instead of a motorway centre stripe.
            pass
        elif white_centre:
            # A dashed white line down the middle: 3 m painted, 5 m bare.
            if (i % 2) == 0:
                strip(paint, i, 0.08, 0.02, -0.08, 0.02)
        else:
            strip(yellow, i, 0.30, 0.02, 0.14, 0.02)
            strip(yellow, i, -0.14, 0.02, -0.30, 0.02)
        strip(paint, i, ROAD_HALF - 0.3, 0.02, ROAD_HALF - 0.46, 0.02)
        strip(paint, i, -ROAD_HALF + 0.46, 0.02, -ROAD_HALF + 0.3, 0.02)
        bend = kerbs and abs(s[i]["k"]) > 1 / 170
        for side in (1, -1):
            block = red if bend and i % 2 else (paint if bend else prom)
            if side > 0:
                strip(block, i, kerb, 0.12, ROAD_HALF, 0.05)
            else:
                strip(block, i, -ROAD_HALF, 0.05, -kerb, 0.12)
        if edge != "seawall":
            edges(i)
            continue
        # Left: a sidewalk, then the seawall, then the rocks and sand falling to the sea.
        w0, w1 = kerb + SIDEWALK, kerb + SIDEWALK + 0.45
        strip(prom, i, w0, 0.12, kerb, 0.12)
        if (theme or {}).get("own") and 752 <= s[i]["d"] <= 1170:
            # The promenade opens to a metal railing above Caló des Moro.
            post = road.at(i, w0, 0.12)
            wall.box(post, (0.11, 0.12, 1.04), s[i]["h"])
            for height in (0.54, 1.10):
                strip(wall, i, w0, height, w0, height - 0.05)
                strip(wall, i, w0 + 0.07, height, w0, height)
            strip(wall, i, w1, -1.2, w1, 0.12)
        else:
            strip(wall, i, w0, 1.0, w0, 0.12)
            strip(wall, i, w1, 1.0, w0, 1.0)
            strip(wall, i, w1, -1.2, w1, 1.0)
            strip(sand, i, w1 + 9.0, -3.0, w1, -0.4)
        # Right: the promenade the clubs' terraces stand on, then the land.
        strip(prom, i, -kerb, 0.12, -(kerb + TERRACE), 0.12)
        strip(sand, i, -(kerb + TERRACE), 0.12, -(kerb + TERRACE + 8.0), -2.4)

    if stones is not None:
        stones.build(col)

    if slab is not None:
        slab.build(col)

    def chevron(d: float, lane: float) -> None:
        for back in (0.0, 1.5):
            tip, tail = d + 2.2 - back, d - back
            for side in (1, -1):
                a = road.pos(tail, lane + 1.5 * side, 0.03)
                b_ = road.pos(tail - 0.7, lane + 1.5 * side, 0.03)
                c = road.pos(tip - 0.7, lane, 0.03)
                e = road.pos(tip, lane, 0.03)
                chev.quad(a, b_, c, e) if side > 0 else chev.quad(e, c, b_, a)

    # Chevrons up every effort: the road itself says "push".
    for stage in st:
        if edge == "pave" or edge == "scheldt" or edge == "angliru" or stage["kind"] != "work" or (theme or {}).get("effort_chevrons") is False:
            continue
        d = stage["from"] + 12
        while d < stage["to"] - 6:
            chevron(d, -ROAD_HALF / 2)
            chevron(d + 12, ROAD_HALF / 2)
            d += 24

    def chequer(d: float, rows: int) -> None:
        size = 0.5
        across = int(2 * ROAD_HALF / size)
        for r in range(rows):
            for c in range(across):
                if (r + c) % 2:
                    continue
                l0 = ROAD_HALF - c * size
                paint.quad(
                    road.pos(d + r * size, l0, 0.03),
                    road.pos(d + r * size, l0 - size, 0.03),
                    road.pos(d + (r + 1) * size, l0 - size, 0.03),
                    road.pos(d + (r + 1) * size, l0, 0.03),
                )

    # The start line and the grid behind it; the finish line, three rows deep.
    chequer(START_LINE - 0.75, 3)
    chequer(length - 0.75, 3)
    for row in range(5):
        for lane in (-3.4, -1.1, 1.2, 3.5):
            d0 = START_LINE - 3.0 - row * 5.0 - (1.6 if lane in (-1.1, 3.5) else 0.0)
            box_w, box_l, t = 1.9, 2.6, 0.12
            edges = (
                (d0, d0 + t, lane + box_w / 2, lane - box_w / 2),
                (d0 - box_l, d0, lane + box_w / 2, lane + box_w / 2 - t),
                (d0 - box_l, d0, lane - box_w / 2 + t, lane - box_w / 2),
            )
            for a, b_, l0, l1 in edges:
                paint.quad(road.pos(a, l0, 0.03), road.pos(a, l1, 0.03), road.pos(b_, l1, 0.03), road.pos(b_, l0, 0.03))
    for b in (asphalt, paint, yellow, red, prom, sand, wall, chev):
        b.build(col)


def build_terrain(road: Road, col, cell: float = 18.0):
    """The island: land that holds the road's height beside it and falls to the sea away from it."""
    xs = [p["x"] for p in road.s]
    ys = [p["y"] for p in road.s]
    margin = 260.0
    x0, x1, y0, y1 = min(xs) - margin, max(xs) + margin, min(ys) - margin, max(ys) + margin
    nx, ny = int((x1 - x0) / cell) + 1, int((y1 - y0) / cell) + 1
    sand_c, scrub_c, rock_c = srgb(0xE6CFA0), srgb(0x8C8A52), srgb(0x8C7B6A)
    green_c = srgb(0x5E7A46)
    heights, dist = {}, {}
    b = Builder("Terrain", "terrain")
    b.colours = []
    index = {}
    for iy in range(ny):
        for ix in range(nx):
            x, y = x0 + ix * cell, y0 + iy * cell
            near = road.tree.find_n((x, y, 0.0), 8)
            d = near[0][2]
            w_sum = h_sum = 0.0
            for _, j, dj in near:
                w = 1.0 / (dj * dj + 4.0)
                w_sum += w
                # Under a bridge the land is the harbour's bed: the water shows beneath the deck.
                h_sum += w * (BRIDGE_BED if road.s[j].get("bridge") else road.s[j]["z"])
            h_road = h_sum / w_sum
            j0 = near[0][1]
            p0 = road.s[j0]
            # Left of the nearest stretch the land drops to the sea under the seawall; right of it the island rises.
            leftward = (x - p0["x"]) * -math.sin(p0["h"]) + (y - p0["y"]) * math.cos(p0["h"])
            seaward = smoothstep(4.0, 14.0, leftward)
            fall = smoothstep(46.0, 210.0, d) * (1 - seaward) + smoothstep(13.0, 64.0, d) * seaward
            bumps = (noise(x, y) * 6.0 + 3.0) * smoothstep(26.0, 70.0, d) * (1 - fall)
            h = (h_road - 1.4) * (1 - fall) + (-6.0) * fall + bumps
            # Below the small lookout the rock shelf drops directly into the bay.
            cove = smoothstep(700, 790, p0["d"]) * (1 - smoothstep(1110, 1220, p0["d"]))
            if cove and leftward > 8:
                inlet = cove * smoothstep(8, 37, leftward)
                h += (-5.0 - h) * inlet
            if d < 26.0:
                h = min(h, h_road - 1.4)
            heights[(ix, iy)], dist[(ix, iy)] = h, d
    for iy in range(ny):
        for ix in range(nx):
            h, d = heights[(ix, iy)], dist[(ix, iy)]
            x, y = x0 + ix * cell, y0 + iy * cell
            hx = heights.get((ix + 1, iy), h) - heights.get((ix - 1, iy), h)
            hy = heights.get((ix, iy + 1), h) - heights.get((ix, iy - 1), h)
            slope = math.hypot(hx, hy) / (2 * cell)
            land = mix(scrub_c, green_c, 0.5 + 0.5 * noise(x * 2.3, y * 2.3))
            c = mix(sand_c, land, smoothstep(0.8, 3.5, h))
            c = mix(c, rock_c, smoothstep(0.28, 0.6, slope))
            shade = 0.9 + 0.1 * noise(x * 5.1, y * 4.7)
            b.colours.append((c[0] * shade, c[1] * shade, c[2] * shade, 1.0))
            index[(ix, iy)] = b.v((x, y, h))
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            corners = [(ix, iy), (ix + 1, iy), (ix + 1, iy + 1), (ix, iy + 1)]
            if all(dist[c] > 235.0 for c in corners):
                continue
            b.faces.append(tuple(index[c] for c in corners))
    obj = b.build(col)
    sea = Builder("Sea", "sea")
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, 7000.0
    sea.quad((cx - r, cy - r, 0), (cx + r, cy - r, 0), (cx + r, cy + r, 0), (cx - r, cy + r, 0))
    sea.build(col)

    def height_at(x: float, y: float) -> float:
        fx, fy = (x - x0) / cell, (y - y0) / cell
        ix, iy = int(fx), int(fy)
        tx, ty = fx - ix, fy - iy
        g = lambda a, c: heights.get((a, c), -6.0)  # noqa: E731
        return (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty

    return obj, height_at


def build_land(road: Road, col, theme: dict, cell: float = 14.0):
    """A theme's land: it holds the road's height beside it and, away from it, rolls (farmland, town), climbs into
    valley walls (mountains) or, where the theme has a sea, falls to it on the road's left."""
    ter, land = theme["terrain"], theme["land"]
    sea = ter.get("sea", False)
    rise, valley, cliff = ter.get("rise", 8.0), ter.get("valley", False), ter.get("cliff", False)
    xs = [p["x"] for p in road.s]
    ys = [p["y"] for p in road.s]
    margin = 300.0 if sea else 560.0
    cell = cell * max(1.0, math.sqrt(len(road.s) * STEP / 11900.0))
    x0, x1, y0, y1 = min(xs) - margin, max(xs) + margin, min(ys) - margin, max(ys) + margin
    nx, ny = int((x1 - x0) / cell) + 1, int((y1 - y0) / cell) + 1
    low_c, mid_c, high_c, rock_c = (srgb(land[k]) for k in ("low", "mid", "high", "rock"))
    snow_c = srgb(land["snow"]) if "snow" in land else None
    zs = [p["z"] for p in road.s]
    z_lo, z_hi = min(zs), max(zs)
    floor = -6.0 if sea else z_lo - 10.0
    heights, dist = {}, {}
    b = Builder("Terrain", "terrain")
    b.colours = []
    index = {}
    for iy in range(ny):
        for ix in range(nx):
            x, y = x0 + ix * cell, y0 + iy * cell
            near = road.tree.find_n((x, y, 0.0), 8)
            d = near[0][2]
            w_sum = h_sum = 0.0
            for _, j, dj in near:
                w = 1.0 / (dj * dj + 4.0)
                w_sum += w
                # Under a bridge the land is the harbour's bed: the water shows beneath the deck.
                h_sum += w * (BRIDGE_BED if road.s[j].get("bridge") else road.s[j]["z"])
            h_road = h_sum / w_sum
            p0 = road.s[near[0][1]]
            leftward = (x - p0["x"]) * -math.sin(p0["h"]) + (y - p0["y"]) * math.cos(p0["h"])
            n1 = noise(x, y)
            if valley:
                # The valley's walls: the further from the road, the higher, rising to the peaks.
                wall = rise * smoothstep(30.0, 420.0, d) * (0.7 + 0.3 * n1) + abs(n1) * 14.0 * smoothstep(20.0, 80.0, d)
                h = h_road - 1.4 + wall
            else:
                h = h_road - 1.4 + (n1 * 0.5 + 0.5) * rise * smoothstep(24.0, 160.0, d)
            if sea:
                seaward = smoothstep(4.0, 14.0, leftward)
                drop = smoothstep(10.0, 40.0, d) if cliff else smoothstep(13.0, 64.0, d)
                fall = smoothstep(80.0, 240.0, d) * (1 - seaward) + drop * seaward
                h = h * (1 - fall) + (-8.0) * fall
            if ter.get("clear_road") and d < cell * 1.6:
                # Even where two stretches approach on different levels, each terrain triangle
                # meeting the SS242 must stay beneath its lowest road surface.
                close = road.tree.find_range((x, y, 0), cell * 1.6)
                h = min(h, min(road.s[j]["z"] for _, j, _ in close) - 1.6)
            if d < 26.0:
                h = min(h, h_road - 1.4)
            if not sea:
                # At the land's edge it eases down to the ground beyond, so no cliff shows from above.
                edge_ = min(x - x0, x1 - x, y - y0, y1 - y)
                h = floor + (h - floor) * smoothstep(0.0, margin * 0.55, edge_)
            heights[(ix, iy)], dist[(ix, iy)] = h, d
    # Where two stretches of road are equally near, the land would step from one's height to the other's:
    # ease it, away from the road, so the land between them is a slope and not a cliff.
    for _ in range(4):
        eased = {}
        for (ix, iy), h in heights.items():
            if dist[(ix, iy)] < 30.0:
                continue
            around = [heights.get((ix + a, iy + c), h) for a in (-1, 0, 1) for c in (-1, 0, 1)]
            eased[(ix, iy)] = sum(around) / 9.0
        heights.update(eased)
    for iy in range(ny):
        for ix in range(nx):
            h, d = heights[(ix, iy)], dist[(ix, iy)]
            x, y = x0 + ix * cell, y0 + iy * cell
            hx = heights.get((ix + 1, iy), h) - heights.get((ix - 1, iy), h)
            hy = heights.get((ix, iy + 1), h) - heights.get((ix, iy - 1), h)
            slope = math.hypot(hx, hy) / (2 * cell)
            if land.get("stripes"):
                # Fields: wheat and green in long strips, as farmland seen from the road.
                band = (int((x * 0.8 + y * 0.6) // 70) + int((x * -0.6 + y * 0.8) // 160)) % 3
                c = (low_c, mid_c, high_c)[band]
            else:
                c = mix(low_c, mid_c, 0.5 + 0.5 * noise(x * 0.7, y * 0.7))
                c = mix(c, high_c, smoothstep(z_hi * 0.6, z_hi + 60.0, h))
            if sea:
                c = mix(srgb(0xD8C49A), c, smoothstep(-2.0, 2.0, h))
            c = mix(c, rock_c, smoothstep(0.35, 0.8, slope))
            if snow_c:
                c = mix(c, snow_c, smoothstep(z_hi + 70.0, z_hi + 140.0, h))
            shade = 0.92 + 0.08 * noise(x * 1.3, y * 1.1)
            b.colours.append((c[0] * shade, c[1] * shade, c[2] * shade, 1.0))
            index[(ix, iy)] = b.v((x, y, h))
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            corners = [(ix, iy), (ix + 1, iy), (ix + 1, iy + 1), (ix, iy + 1)]
            if sea and all(dist[c] > 300.0 for c in corners):
                continue
            b.faces.append(tuple(index[c] for c in corners))
    obj = b.build(col)
    ground = Builder("Sea" if sea else "Ground", "sea")
    cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, 9000.0
    ground.quad((cx - r, cy - r, 0 if sea else floor), (cx + r, cy - r, 0 if sea else floor), (cx + r, cy + r, 0 if sea else floor), (cx - r, cy + r, 0 if sea else floor))
    ground.build(col)

    def height_at(x: float, y: float) -> float:
        fx, fy = (x - x0) / cell, (y - y0) / cell
        ix, iy = int(fx), int(fy)
        tx, ty = fx - ix, fy - iy
        g = lambda a, c: heights.get((a, c), floor)  # noqa: E731
        return (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty

    return obj, height_at


def palm(B: dict, x: float, y: float, z: float, rng: random.Random, height: float | None = None, lean_to: float | None = None) -> None:
    """A date palm as they stand on the island's terraces: a slender trunk ringed with the scars of old fronds,
    curving as it rises; a thatch of dry fronds under the crown; and a full crown in three tiers, the young fronds
    upright, the middle ones arching out, the old ones hanging. Each frond is a feather: a spine that bends under its
    own weight, with a blade either side folded down from it."""
    height = rng.uniform(6.0, 11.0) if height is None else height
    yaw = rng.uniform(0, math.tau) if lean_to is None else lean_to
    lean = rng.uniform(0.3, 1.8) * height / 9.0
    # The trunk: four lengths, banded light and dark, a little swollen at the foot and under the crown.
    rings, centres = [], []
    for k in range(5):
        t = k / 4
        cx, cy = x + math.cos(yaw) * lean * t * t, y + math.sin(yaw) * lean * t * t
        r = 0.3 * (1 - 0.5 * t) + (0.1 if k == 0 else 0.0) + (0.05 if k == 4 else 0.0)
        centres.append((cx, cy, z - 0.4 + (height + 0.4) * t))
        rings.append([(cx + math.cos(a_) * r, cy + math.sin(a_) * r, z - 0.4 + (height + 0.4) * t) for a_ in (0, 1.571, 3.142, 4.712)])
    for k in range(4):
        bark = B["trunk" if k % 2 else "trunk-dark"]
        for j in range(4):
            bark.quad(rings[k][j], rings[k][(j + 1) % 4], rings[k + 1][(j + 1) % 4], rings[k + 1][j])
    top = centres[-1]

    def frond(b: Builder, a_: float, rise: float, reach: float, sag: float, width: float, fine: bool = True) -> None:
        ca, sa = math.cos(a_), math.sin(a_)
        spine, edge_l, edge_r = [], [], []
        for t, w in ((0.0, 0.1), (0.3, 1.0), (0.65, 0.85), (1.0, 0.08)) if fine else ((0.0, 0.1), (0.45, 1.0), (1.0, 0.08)):
            out = reach * t * math.cos(rise)
            up = reach * t * math.sin(rise) - sag * t * t
            c_ = (top[0] + ca * out, top[1] + sa * out, top[2] + up)
            half = width * w
            spine.append(c_)
            edge_l.append((c_[0] - sa * half, c_[1] + ca * half, c_[2] - half * 0.45))
            edge_r.append((c_[0] + sa * half, c_[1] - ca * half, c_[2] - half * 0.45))
        for k in range(len(spine) - 1):
            b.quad(spine[k], spine[k + 1], edge_l[k + 1], edge_l[k])
            b.quad(spine[k + 1], spine[k], edge_r[k], edge_r[k + 1])

    turn = rng.uniform(0, math.tau)
    # The thatch: dry fronds hanging close to the trunk.
    for j in range(3):
        frond(B["leaf-dry"], turn + j * math.tau / 3 + rng.uniform(-0.3, 0.3), -1.25, rng.uniform(1.3, 1.9), 0.2, 0.34, False)
    # Old fronds hang, the middle tier arches, the young stand up in the heart of the crown.
    for count, rise, sag, reach, kinds in (
        (5, -0.15, 2.3, (3.2, 4.2), ("leaf-dark", "leaf-dark", "leaf")),
        (5, 0.45, 2.6, (3.4, 4.4), ("leaf", "leaf-dark")),
        (3, 1.05, 1.5, (2.4, 3.2), ("leaf", "leaf")),
    ):
        for j in range(count):
            a_ = turn + (j + rng.uniform(-0.25, 0.25)) * math.tau / count + rise
            frond(B[kinds[j % len(kinds)]], a_, rise + rng.uniform(-0.12, 0.12), rng.uniform(*reach), sag * rng.uniform(0.8, 1.2), 0.62, rise == 0.45)


# The letters of the IBIZA sign, each a few slabs: corners in (metres along, metres up), anticlockwise from the front.
SIGN_TALL, SIGN_STROKE, SIGN_WIDE, SIGN_GAP, SIGN_DEEP = 2.4, 0.44, 1.55, 0.34, 0.55


def _rect(u0: float, v0: float, u1: float, v1: float):
    return ((u0, v0), (u1, v0), (u1, v1), (u0, v1))


def sign_letter(letter: str) -> tuple[float, list]:
    """A letter's width and its slabs."""
    h, t, w = SIGN_TALL, SIGN_STROKE, SIGN_WIDE
    mid = h / 2
    if letter == "I":
        return t, [_rect(0, 0, t, h)]
    if letter == "B":
        return w, [
            _rect(0, 0, t, h),
            _rect(t, 0, w - 0.22, t), _rect(t, mid - t / 2, w - 0.3, mid + t / 2), _rect(t, h - t, w - 0.22, h),
            ((w - t, t * 0.55), (w, t * 0.9), (w, mid - t * 0.55), (w - t, mid - t * 0.2)),
            ((w - t, mid + t * 0.2), (w, mid + t * 0.55), (w, h - t * 0.9), (w - t, h - t * 0.55)),
            ((w - 0.22, 0), (w, t * 0.9), (w - t, t * 0.55), (w - 0.22, t)),
            ((w - 0.22, h - t), (w - t, h - t * 0.55), (w, h - t * 0.9), (w - 0.22, h)),
        ]
    if letter == "Z":
        return w, [_rect(0, 0, w, t), _rect(0, h - t, w, h), ((0, t), (t * 1.35, t), (w, h - t), (w - t * 1.35, h - t))]
    if letter == "A":
        top = t * 0.62
        return w + 0.2, [
            ((0, 0), (t * 1.05, 0), ((w + 0.2) / 2 + top / 2, h), ((w + 0.2) / 2 - top / 2, h)),
            ((w + 0.2 - t * 1.05, 0), (w + 0.2, 0), ((w + 0.2) / 2 + top / 2, h), ((w + 0.2) / 2 - top / 2, h)),
            _rect((w + 0.2) * 0.27, 0.62, (w + 0.2) * 0.73, 0.62 + t * 0.8),
        ]
    raise ValueError(letter)


def ibiza_sign(B: dict, kit, at, facing: float) -> None:
    """The letters IBIZA standing on a plinth: taller than a person, white with dark faces, lit from below once the
    sun goes. `at` is the middle of the plinth's foot and `facing` the way the letters look."""
    nx, ny = math.cos(facing), math.sin(facing)
    ux, uy = -ny, nx
    widths = [sign_letter(c)[0] for c in "IBIZA"]
    total = sum(widths) + SIGN_GAP * 4
    plinth_h = 0.5
    B["sign-plinth"].box((at[0], at[1], at[2]), (1.5, total + 1.3, plinth_h), facing)
    u = -total / 2
    for c in "IBIZA":
        width, slabs = sign_letter(c)
        for slab in slabs:
            front = [(at[0] + ux * (u + a) + nx * SIGN_DEEP / 2, at[1] + uy * (u + a) + ny * SIGN_DEEP / 2, at[2] + plinth_h + v) for a, v in slab]
            back = [(q[0] - nx * SIGN_DEEP, q[1] - ny * SIGN_DEEP, q[2]) for q in front]
            face, side = B["sign-face"], B["sign-white"]
            face.faces.append(tuple(face.v(q) for q in front))
            side.faces.append(tuple(side.v(q) for q in reversed(back)))
            for k in range(len(front)):
                j = (k + 1) % len(front)
                side.quad(front[k], back[k], back[j], front[j])
        u += width + SIGN_GAP
    # Lamps in the plinth light the letters, and the paving before them.
    for k in (-1, 0, 1):
        spot = (at[0] + ux * k * total / 3 + nx * 1.0, at[1] + uy * k * total / 3 + ny * 1.0, at[2] + plinth_h + 0.1)
        B["bulb"].box((spot[0] - nx * 0.45, spot[1] - ny * 0.45, at[2] + plinth_h), (0.16, 0.5, 0.07), facing)
        kit.light((spot[0] + nx * 1.5, spot[1] + ny * 1.5, at[2]), "bulb", 7.0, 0.5)


def palm_bunch(B: dict, x: float, y: float, z: float, rng: random.Random) -> None:
    """Palms as they are planted: more often two or three from one bed than one alone, of different heights,
    leaning away from each other."""
    count = rng.choice((1, 1, 1, 2, 2, 3))
    if count == 1:
        palm(B, x, y, z, rng)
        return
    around = rng.uniform(0, math.tau)
    tallest = rng.uniform(8.0, 11.5)
    for k in range(count):
        a_ = around + k * math.tau / count + rng.uniform(-0.4, 0.4)
        out = rng.uniform(0.5, 1.1)
        palm(B, x + math.cos(a_) * out, y + math.sin(a_) * out, z, rng, tallest * (1.0, 0.72, 0.52)[k] * rng.uniform(0.92, 1.08), a_)


SKY_SECTORS = 1
SKY_RADIUS = 8500.0


def build_sky(col, az: float, haze_hex: int, colour_at=sky.sunset_sky_colour, turns: int = 128, rows: int = 20) -> None:
    """The sky as a dome the app carries with the camera, its picture painted in its vertices: finest by the horizon,
    where the eye is."""
    b = Builder("Sky", "sky")
    b.colours = []
    haze = srgb(haze_hex)
    low = math.radians(-4.0)
    elev = [low + (math.pi / 2 - low) * (r / rows) ** 1.7 for r in range(rows + 1)]
    ring = []
    for r, e in enumerate(elev[:-1]):
        first = len(b.verts)
        for t in range(turns):
            a = t * math.tau / turns
            d = (math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))
            b.verts.append((d[0] * SKY_RADIUS, d[1] * SKY_RADIUS, d[2] * SKY_RADIUS))
            b.colours.append(colour_at(d[0], d[1], d[2], az, haze))
        ring.append(first)
    top = len(b.verts)
    b.verts.append((0.0, 0.0, SKY_RADIUS))
    b.colours.append(colour_at(0.0, 0.0, 1.0, az, haze))
    for r in range(len(ring) - 1):
        for t in range(turns):
            u = (t + 1) % turns
            b.faces.append((ring[r] + t, ring[r] + u, ring[r + 1] + u, ring[r + 1] + t))
    for t in range(turns):
        b.faces.append((ring[-1] + t, ring[-1] + (t + 1) % turns, top))
    b.build(col)


def build_scenery(road: Road, st: list[dict], length: float, height_at, course: dict, col) -> dict:
    rng = random.Random(course.get("seed", 1) * 7 + 3)
    s, n = road.s, len(road.s)
    names = (
        "trunk leaf leaf-dark glint bush bougainvillea whitewash wall wood dark stone rock skin club-window awning awning-white arrow sail sail-pink "
        "glow-door lamp-red lamp-green gold confetti bulb paint sun island tower "
        "skin-1 skin-2 hair-0 hair-1 hair-2 party-white drink-0 drink-1 drink-2 trunk-dark leaf-dry "
        "sign-white sign-face sign-plinth"
    ).split() + NEONS + BEAMS + CROWD
    B = {name: Builder("".join(p.title() for p in name.split("-")), name) for name in names}
    B["whitewash"].name, B["dark"].name, B["paint"].name = "Clubs", "Dark", "GatePaint"
    # The kit the themed maps are built with (themes.py): framed windows, railings, the glow round a light and the
    # light it throws, which the app draws and the course file carries.
    kit = themes.Kit(road, st, length, height_at, rng, B, STEP, ROAD_HALF)
    kerb = ROAD_HALF + 0.6
    front = kerb + TERRACE  # the clubs' fronts, right of the road

    def P(i: int, along: float, left: float, up: float = 0.0):
        x, y, z = road.at(i, left, up)
        return (x + math.cos(s[i]["h"]) * along, y + math.sin(s[i]["h"]) * along, z)

    def diamond(b: Builder, c, r: float) -> None:
        top, bot = (c[0], c[1], c[2] + r), (c[0], c[1], c[2] - r)
        ring = [(c[0] + r, c[1], c[2]), (c[0], c[1] + r, c[2]), (c[0] - r, c[1], c[2]), (c[0], c[1] - r, c[2])]
        for q in range(4):
            b.tri(top, ring[q], ring[(q + 1) % 4])
            b.tri(bot, ring[(q + 1) % 4], ring[q])

    def blob(b: Builder, c, r: float) -> None:
        top = (c[0], c[1], c[2] + r)
        ring = [(c[0] + math.cos(a) * r * rng.uniform(0.75, 1.2), c[1] + math.sin(a) * r * rng.uniform(0.75, 1.2), c[2] + rng.uniform(-0.25, 0.25) * r) for a in (0, 1.257, 2.513, 3.77, 5.027)]
        for q in range(5):
            b.tri(top, ring[q], ring[(q + 1) % 5])
            b.tri((c[0], c[1], c[2] - r * 0.8), ring[(q + 1) % 5], ring[q])

    from ibiza_strip import Strip
    strip = Strip(sys.modules[__name__], B)
    people = random.Random(4117)

    def person(c, yaw: float, rng=rng, there: bool = True) -> None:
        """Someone at the party, a drink in their hand: legs or a dress, a body that narrows to the waist, a head
        with hair, one arm up with the glass or holding it at the chest, the other dancing or at their side. Most are
        in the island's white."""
        # The crowd has dice of its own, and takes from the scenery's what the old dancers took: nothing else moves.
        rng.choice(CROWD)
        for _ in range(4):
            rng.random()
        if not there:
            return
        marks=strip.mark(strip.people)
        rng = people
        h = rng.uniform(0.92, 1.08)
        fx, fy = math.cos(yaw), math.sin(yaw)
        sx, sy = -fy, fx

        def at(forward: float, side: float, up: float):
            return (c[0] + fx * forward + sx * side, c[1] + fy * forward + sy * side, c[2] + up * h)

        white = rng.random() < 0.6
        top = B["party-white"] if white else B[rng.choice(CROWD)]
        skin = B[rng.choice(("skin", "skin", "skin-1", "skin-2"))]
        dress = rng.random() < 0.45
        if dress:
            # A summer dress: bare legs under a skirt that flares from the waist.
            for side in (1, -1):
                skin.box(at(0, 0.07 * side, 0), (0.1, 0.1, 0.5 * h), yaw)
            kit.prism(top, at(0, 0, 0.46), 0.25, 0.42 * h, 5, 0.15, yaw)
        else:
            legs = B["party-white"] if white and rng.random() < 0.5 else (B["dark"] if rng.random() < 0.6 else B[rng.choice(CROWD)])
            for side in (1, -1):
                legs.box(at(0, 0.08 * side, 0), (0.13, 0.13, 0.86 * h), yaw)
        # The body: hips to shoulders, wider at the shoulders; the neck; the head and its hair.
        kit.prism(top, at(0, 0, 0.84), 0.17, 0.58 * h, 4, 0.24, yaw + math.pi / 4)
        kit.prism(skin, at(0, 0, 1.42), 0.085, 0.24 * h, 5, 0.105, yaw)
        hair = B[rng.choice(("hair-0", "hair-0", "hair-1", "hair-2"))]
        kit.prism(hair, at(-0.015, 0, 1.6), 0.115, 0.09 * h, 4, 0.07, yaw + math.pi / 4)
        if dress or rng.random() < 0.3:
            # Long hair down the back.
            hair.box(at(-0.1, 0, 1.3), (0.06, 0.2, 0.34 * h), yaw)
        # The arms. One holds the drink: up in a toast, or at the chest between sips.
        hand = rng.choice((1, -1))
        sleeve = skin if dress or rng.random() < 0.6 else top
        toast = rng.random() < 0.45
        drink = B[rng.choice(("drink-0", "drink-1", "drink-2"))]
        if toast:
            lift = rng.uniform(0.5, 0.68)
            sleeve.box(at(0.03, 0.27 * hand, 1.3), (0.09, 0.09, lift * h), yaw)
            glass = at(0.03, 0.27 * hand, 1.3 + lift)
        else:
            sleeve.box(at(0, 0.25 * hand, 1.05), (0.09, 0.09, 0.33 * h), yaw)
            skin.box(at(0.16, 0.22 * hand, 1.05), (0.26, 0.08, 0.08 * h), yaw)
            glass = at(0.29, 0.22 * hand, 1.1)
        kit.prism(drink, glass, 0.04, 0.12, 3, 0.055, yaw)
        # The other arm: in the air with the music, or down at their side.
        if rng.random() < 0.5:
            sleeve.box(at(0, -0.27 * hand, 1.3), (0.09, 0.09, rng.uniform(0.4, 0.62) * h), yaw)
        else:
            sleeve.box(at(0, -0.26 * hand, 0.82), (0.09, 0.09, 0.56 * h), yaw)

        phase=(c[0]*.163+c[1]*.087)%math.tau
        strip.move(marks,'StripDancers',lambda p:(max(0,(p[2]-c[2])/.92),phase))

    def festoon(a, b_, bulbs: int = 9, sag: float = 1.1) -> None:
        marks=strip.mark((B['dark'],B['bulb']))
        dx,dy=b_[0]-a[0],b_[1]-a[1]
        length2=dx*dx+dy*dy
        last = None
        for k in range(bulbs + 1):
            t = k / bulbs
            c = (a[0] + (b_[0] - a[0]) * t, a[1] + (b_[1] - a[1]) * t, a[2] + (b_[2] - a[2]) * t - sag * math.sin(math.pi * t))
            if 0 < k < bulbs:
                diamond(B["bulb"], (c[0], c[1], c[2] - 0.14), 0.13)
            if last:
                B["dark"].quad((last[0], last[1], last[2] + 0.03), (c[0], c[1], c[2] + 0.03), (c[0], c[1], c[2] - 0.03), (last[0], last[1], last[2] - 0.03))
                B["dark"].quad((last[0], last[1], last[2] - 0.03), (c[0], c[1], c[2] - 0.03), (c[0], c[1], c[2] + 0.03), (last[0], last[1], last[2] + 0.03))
            last = c

        def cable(p):
            t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2
            return math.sin(math.pi*min(1,max(0,t))), (a[0]*.31+a[1]*.17)%math.tau
        strip.move(marks,'StripFestoons',cable)

    def beams(origin, yaw: float, count: int = 4) -> None:
        for k in range(count):
            a = yaw + (k - (count - 1) / 2) * 0.55 + rng.uniform(-0.12, 0.12)
            tilt, reach, w = rng.uniform(0.5, 0.95), 150.0, 9.0
            tip = (origin[0] + math.cos(a) * reach * math.cos(tilt), origin[1] + math.sin(a) * reach * math.cos(tilt), origin[2] + reach * math.sin(tilt))
            left = (tip[0] - math.sin(a) * w, tip[1] + math.cos(a) * w, tip[2])
            right = (tip[0] + math.sin(a) * w, tip[1] - math.cos(a) * w, tip[2])
            up = (tip[0], tip[1], tip[2] + w)
            b = B[BEAMS[k % len(BEAMS)]]
            marker=strip.mark((b,))
            b.tri(origin, left, right)
            b.tri(origin, right, up)
            b.tri(origin, up, left)
            strip.move(marker,"StripBeams",lambda p:(0 if p==origin else 1,a))

    def arch(d: float, radius: float, thick: float, deep: float, b: Builder, bulbs: bool = False) -> None:
        """A round arch over the road, feet on the sidewalks."""
        i = road.index(d)
        seg = 22
        for k in range(seg):
            a0, a1 = math.pi * k / seg, math.pi * (k + 1) / seg
            ring = []
            for a in (a0, a1):
                for r in (radius - thick / 2, radius + thick / 2):
                    for along in (-deep / 2, deep / 2):
                        ring.append(P(i, along, math.cos(a) * r, math.sin(a) * r - 0.2))
            # ring: a0[(inner,back),(inner,front),(outer,back),(outer,front)], then a1 the same
            i0b, i0f, o0b, o0f, i1b, i1f, o1b, o1f = ring
            b.quad(i0b, i1b, i1f, i0f)
            b.quad(o0f, o1f, o1b, o0b)
            b.quad(i0b, o0b, o1b, i1b)
            b.quad(i0f, i1f, o1f, o0f)
            if bulbs:
                for along in (-deep / 2 - 0.12, deep / 2 + 0.12):
                    diamond(B["bulb"], P(i, along, math.cos((a0 + a1) / 2) * radius, math.sin((a0 + a1) / 2) * radius - 0.2), 0.16)

    # Palms, in bunches: along the seawall on the left, on the promenade's kerb on the right.
    flora = random.Random(7331)
    i = 3
    while i < n - 2:
        side = 1 if (i // 6) % 2 else -1
        off = (kerb + SIDEWALK + 1.9) if side > 0 else -(kerb + 1.3)
        x, y, z = road.at(i, off + rng.uniform(-0.3, 0.3))
        if road.clear_of_road(x, y, 7.5, i):
            # The palms have dice of their own, and take from the scenery's what the old palm took: nothing else moves.
            for _ in range(30):
                rng.random()
            palm_bunch(B, x, y, z - (1.6 if side > 0 else 0.0), flora)
        i += rng.choice((4, 5, 6))

    # Rocks under the seawall, all the way along.
    for i in range(2, n - 2, 2):
        x, y, z = road.at(i, kerb + SIDEWALK + rng.uniform(1.6, 6.5))
        if road.clear_of_road(x, y, 9.0, i):
            blob(B["rock"], (x, y, z - rng.uniform(0.6, 1.8)), rng.uniform(0.9, 2.1))

    # Whitewashed beach clubs on the right: a terrace under a pergola, glowing doors, neon, a dancing crowd.
    clubs: list[int] = []

    def club(i: int, width: float, dancers: int) -> None:
        yaw = s[i]["h"]
        z = s[i]["z"]
        mid = -(front + 4.0)
        gx, gy, _ = road.at(i, mid)
        base = min(z, height_at(gx, gy)) - 3.0
        floor = z + 0.12
        white, wood = B["whitewash"], B["wood"]
        white.box(P(i, 0, mid, base - z), (width, 8.0, floor + 6.4 - base), yaw)
        white.box(P(i, rng.uniform(-2, 2), mid - 1.0, 6.52), (width * 0.55, 5.4, 2.9), yaw)
        # The terrace: a low wall to the promenade, a pergola over it.
        white.box(P(i, 0, -(front - 4.0), 0.12), (width, 0.35, 0.85), yaw)
        for along in (-width / 2 + 0.4, 0.0, width / 2 - 0.4):
            for off in (front - 3.8, front - 0.4):
                wood.box(P(i, along, -off, 0.12), (0.24, 0.24, 3.5), yaw)
        for off in (front - 3.8, front - 0.4):
            wood.box(P(i, 0, -off, 3.6), (width + 0.6, 0.26, 0.22), yaw)
        slats = int(width / 1.6)
        for k in range(slats + 1):
            wood.box(P(i, -width / 2 + k * width / slats, -(front - 2.1), 3.82), (0.14, 4.6, 0.12), yaw)
        # The upper balcony's pergola.
        for along in (-width / 2 + 0.5, width / 2 - 0.5):
            wood.box(P(i, along, -(front + 0.5), 6.52), (0.2, 0.2, 2.6), yaw)
        wood.box(P(i, 0, -(front + 0.5), 9.1), (width, 0.24, 0.2), yaw)
        for k in range(slats + 1):
            wood.box(P(i, -width / 2 + k * width / slats, -(front + 1.6), 9.3), (0.12, 2.6, 0.1), yaw)
        # Doors glowing warm, and neon shapes on the wall above them.
        doors = max(2, int(width / 5))
        for k in range(doors):
            along = -width / 2 + (k + 0.5) * width / doors
            # An arched doorway glowing warm, under a striped awning.
            off = -(front - 0.07)
            B["glow-door"].box(P(i, along, off, 0.12), (1.5, 0.14, 2.1), yaw)
            # The doorway's glow in the dusk, and its warm light on the terrace before it.
            kit.halo(P(i, along, off + 0.3, 1.6), "glow-door")
            kit.light(P(i, along, off + 2.2, 0), "glow-door", 6.5, 0.55)
            for k2 in range(6):
                a0, a1 = math.pi * k2 / 6, math.pi * (k2 + 1) / 6
                B["glow-door"].tri(
                    P(i, along, off - 0.07, 2.22),
                    P(i, along + math.cos(a0) * 0.75, off - 0.07, 2.22 + math.sin(a0) * 0.75),
                    P(i, along + math.cos(a1) * 0.75, off - 0.07, 2.22 + math.sin(a1) * 0.75),
                )
            for k2 in range(6):
                u0, u1 = along - 1.2 + k2 * 0.4, along - 1.2 + (k2 + 1) * 0.4
                B["awning" if k2 % 2 else "awning-white"].quad(
                    P(i, u0, off, 3.5), P(i, u1, off, 3.5), P(i, u1, off + 1.1, 3.05), P(i, u0, off + 1.1, 3.05)
                )
        # Windows upstairs, a few of them lit.
        panes = max(3, int(width / 3.2))
        for k in range(panes):
            along = -width / 2 + (k + 0.5) * width / panes
            # A window in its frame, under a lintel and over a sill, lit or dark: the app draws the room behind it.
            kit.window(i, along, -(front - 0.06), 4.3, 1.1, 1.5, rng.random() < 0.45, yaw)
        for k in range(rng.choice((2, 3))):
            neon = B[NEONS[(len(clubs) + k) % len(NEONS)]]
            along = -width / 2 + (k + 0.5) * width / 3 + rng.uniform(-0.6, 0.6)
            w, h, t = rng.uniform(1.4, 2.6), rng.uniform(1.0, 1.9), 0.12
            up = 6.7
            off = -(front - 0.1)
            neon.box(P(i, along, off, up), (w, t, t), yaw)
            neon.box(P(i, along, off, up + h), (w, t, t), yaw)
            neon.box(P(i, along - w / 2, off, up), (t, t, h + t), yaw)
            neon.box(P(i, along + w / 2, off, up), (t, t, h + t), yaw)
        # A tall neon sign standing off the corner.
        sign = B[NEONS[(len(clubs) + 3) % len(NEONS)]]
        sign.box(P(i, -width / 2 - 0.4, -(front - 0.5), 3.4), (0.16, 0.9, 3.4), yaw)
        # The sign's glow, and its colour on the terrace and the road before the club.
        sign_glow = NEONS[(len(clubs) + 3) % len(NEONS)]
        kit.halo(P(i, -width / 2 - 0.4, -(front - 0.9), 5.2), sign_glow)
        kit.light(P(i, -width / 2 - 0.4, -(front - 3.0), 0), sign_glow, 9.0, 0.6)
        kit.light(P(i, 0, -(front - 5.0), 0), NEONS[len(clubs) % len(NEONS)], 12.0, 0.45)
        # Bougainvillea spilling over a corner, and bushes in pots.
        for _ in range(5):
            blob(B["bougainvillea"], P(i, width / 2 - rng.uniform(0, 2.2), -(front - rng.uniform(0.2, 0.9)), rng.uniform(3.6, 6.4)), rng.uniform(0.6, 1.1))
        for along in (-width / 2 + 1.2, width / 2 - 1.2):
            B["stone"].box(P(i, along, -(front - 4.6), 0.12), (0.7, 0.7, 0.6), yaw)
            blob(B["bush"], P(i, along, -(front - 4.6), 1.1), 0.6)
        for _ in range(dancers):
            c = P(i, rng.uniform(-width / 2 + 0.8, width / 2 - 0.8), -rng.uniform(front - 3.4, front - 0.9), 0.12)
            person(c, yaw + math.pi / 2 + rng.uniform(-0.5, 0.5))
        # Festoon lights from the pergola across the strip to a pole by the seawall.
        for along in (-width / 3, width / 3):
            pole = P(i, along, kerb + SIDEWALK - 0.3, 0.12)
            B["dark"].box(pole, (0.14, 0.14, 5.6), yaw)
            festoon(P(i, along, -(front - 3.8), 3.9), (pole[0], pole[1], pole[2] + 5.5))
            # The string's bulbs glow together over the road, and light it.
            kit.halo(P(i, along, 0.0, 4.2), "bulb")
            kit.light(P(i, along, 0.0, 0), "bulb", 8.0, 0.4)
        strip.furnishings(lambda along,off,up:P(i,along,-(front-3.55)+off,up+.12),yaw,width)
        clubs.append(i)

    def room_for_club(i: int) -> bool:
        if not all(abs(s[j]["k"]) < 1 / 120 for j in range(max(0, i - 5), min(n, i + 6))):
            return False
        x, y, _ = road.at(i, -(front + 4.0))
        return road.clear_of_road(x, y, 24.0, i, lag=70.0)

    # The strip at the start and at the finish is lined with clubs door to door; between, they come and go.
    i = 2
    while i < n - 8:
        d = s[i]["d"]
        lined = d < 260 or d > length - 420
        if room_for_club(i) and (lined or rng.random() < 0.5):
            width = rng.uniform(13, 19)
            club(i, width, rng.randint(7, 11) if lined else rng.randint(3, 7))
            if len(clubs) % 6 == 0:
                beams(P(i, 0, -(front + 4.0), 9.6), s[i]["h"] + math.pi / 2 + rng.uniform(-0.4, 0.4))
            i += int((width + (rng.uniform(2, 5) if lined else rng.uniform(26, 90))) / STEP) + 1
        else:
            i += 3

    # A railing along the far edge of the promenade wherever no club stands on it, over the drop to the land below.
    taken = set()
    for c in clubs:
        taken.update(range(c - 4, c + 5))
    for i in range(2, n - 3):
        if i not in taken and i + 1 not in taken:
            kit.fence(i, -(kerb + TERRACE - 0.15), 1.1)
    # The IBIZA letters, where the promenade is open and the road runs straight enough to read them coming: one in the
    # first kilometre, one before the finish. They stand across the promenade, turned to face whoever rides up.
    signs = 0
    for lo, hi in ((road.index(220), road.index(1400)), (road.index(length - 1500), road.index(length - 420))):
        for i in range(lo, hi):
            free = all(j not in taken for j in range(i - 4, i + 5))
            straight = abs(math.remainder(s[i + 6]["h"] - s[i - 10]["h"], math.tau)) < 0.12
            if free and straight:
                yaw = s[i]["h"]
                ibiza_sign(B, kit, P(i, 0, -(kerb + 4.6), 0.12), yaw + math.pi - 0.62)
                signs += 1
                break

    # Arrow boards round the outside of every tight bend.
    for i in range(2, n - 2, 2):
        k = s[i]["k"]
        if abs(k) < 1 / 62 or k < 0:
            continue
        # Left bends only: on right bends the outside is the seawall's.
        yaw = s[i]["h"]
        B["arrow"].box(P(i, 0, -(kerb + 0.9), 0.62), (1.9, 0.12, 1.0), yaw)
        B["dark"].box(P(i, 0, -(kerb + 0.9), 0.12), (0.12, 0.12, 0.5), yaw)
        for sign_ in (1, -1):
            a, b_, c_, d_ = (P(i, -0.5, -(kerb + 0.82), 1.12 + 0.4 * sign_), P(i, -0.2, -(kerb + 0.82), 1.12 + 0.4 * sign_), P(i, 0.35, -(kerb + 0.82), 1.12), P(i, 0.05, -(kerb + 0.82), 1.12))
            B["dark"].quad(a, b_, c_, d_)
            B["dark"].quad(d_, c_, b_, a)

    # The start: stone pillars under a wooden pergola, the lights hanging from it, festoons over the grid.
    i0 = road.index(START_LINE)
    yaw0 = s[i0]["h"]
    span = kerb + 1.0
    for side in (1, -1):
        B["stone"].box(P(i0, 0, span * side, 0.0), (1.5, 1.5, 7.2), yaw0)
        B["stone"].box(P(i0, 0, span * side, 0.0), (1.9, 1.9, 0.7), yaw0)
    for along in (-0.7, 0.7):
        B["wood"].box(P(i0, along, 0, 7.2), (0.3, 2 * span + 3.4, 0.36), yaw0)
    for k in range(15):
        B["wood"].box(P(i0, 0, -span - 1.2 + k * (2 * span + 2.4) / 14, 7.56), (3.0, 0.2, 0.2), yaw0)
    for k, lit in ((-1, False), (0, True), (1, False)):
        B["dark"].box(P(i0, -0.9, k * 1.9, 4.3 + (0.0 if k else -0.35)), (0.5, 1.15, 2.9), yaw0)
        B["dark"].box(P(i0, -0.9, k * 1.9, 7.0), (0.1, 0.1, 0.5), yaw0)
        # Every housing holds a red lamp over a green one: the app lights red before the start and green from it.
        for lamp, mat in ((2, B["lamp-red"]), (1, B["rock"]), (0, B["lamp-green"])):
            mat.box(P(i0, -1.2, k * 1.9, 4.5 + lamp * 0.86 + (0.0 if k else -0.35)), (0.12, 0.7, 0.7), yaw0)
    for back in (6, 14, 22, 30):
        ib = road.index(-back)
        festoon(P(ib, 0, span, 6.4), P(ib, 0, -span - 4, 6.4), 16, 1.4)
    for ahead in (10, 22, 34, 46):
        ia = road.index(ahead)
        festoon(P(ia, 0, span, 6.2), P(ia, 0, -(front - 3.8), 4.0), 16, 1.0)

    # The finish: a golden arch strung with bulbs, confetti in the air, barriers and a crowd both sides.
    arch(length, kerb + 1.6, 0.9, 1.4, B["gold"], bulbs=True)
    arch(length + 2.4, kerb + 2.6, 0.5, 0.6, B["gold"], bulbs=True)
    fi = road.index(length)
    for _ in range(420):
        c = P(fi, rng.uniform(-26, 8), rng.uniform(-kerb - 3, kerb + 3), rng.uniform(1.0, 11.0))
        a, r = rng.uniform(0, math.tau), rng.uniform(0.08, 0.2)
        t1 = (c[0] + math.cos(a) * r, c[1] + math.sin(a) * r, c[2] + rng.uniform(-r, r))
        t2 = (c[0] - math.sin(a) * r, c[1] + math.cos(a) * r, c[2] + rng.uniform(0, 2 * r))
        B["confetti"].tri(c, t1, t2)
    d = length - 70.0
    while d < length + 26.0:
        i = road.index(d)
        yaw = s[i]["h"]
        for side in (1, -1):
            if side < 0:
                B["wall"].box(P(i, 0, -(kerb + 0.5), 0.12), (3.6, 0.5, 1.05), yaw)
            for k in range(3):
                off = (kerb + rng.uniform(1.0, 2.1)) if side > 0 else -(kerb + rng.uniform(1.2, 3.2))
                # Four places in nine are taken: each figure is ninety triangles, and the finish is long.
                person(P(i, rng.uniform(-1.8, 1.8), off, 0.12), yaw - math.pi / 2 * side + rng.uniform(-0.4, 0.4), there=k < (2 if int(d / 4) % 3 == 0 else 1))
        d += 4.0
    beams(P(fi, 30, -(front + 2), 8.0), s[fi]["h"] + math.pi / 2, 4)
    beams(P(i0, 70, -(front + 2), 8.0), yaw0 + math.pi / 2, 3)

    # A round neon arch at the foot of every effort, and cyan flags where each recovery begins.
    efforts = 0
    for stage in st:
        if stage["kind"] == "work" and stage["from"] > 1:
            arch(stage["from"], kerb + 1.4, 0.5, 0.7, B[NEONS[efforts % len(NEONS)]])
            arch(stage["from"] + 0.9, kerb + 0.75, 0.16, 0.3, B[NEONS[(efforts + 2) % len(NEONS)]])
            efforts += 1
        elif stage["kind"] == "recover":
            i = road.index(stage["from"])
            for side in (1, -1):
                B["neon-cyan"].box(P(i, 0, (kerb + 0.6) * side, 0.12), (0.1, 0.5, 4.2), s[i]["h"])

    # The DJ terrace on a rock above the strip, mid-course and above the finish: decks, stacks, beams, a crowd.
    for share in (0.37, 0.975):
        i = road.index(length * share)
        off = -(front + 22.0)
        x, y, z = road.at(i, off)
        if not road.clear_of_road(x, y, 26.0, i, lag=90.0):
            continue
        yaw = s[i]["h"]
        base = min(z, height_at(x, y)) - 3.0
        B["stone"].box((x, y, base), (20.0, 16.0, z + 4.0 - base), yaw)
        B["whitewash"].box(P(i, 0, off, 4.0), (18.0, 14.0, 0.5), yaw)
        B["dark"].box(P(i, 0, off - 4.0, 4.5), (4.0, 1.4, 1.2), yaw)
        B["neon-cyan"].box(P(i, 0, off - 3.2, 4.6), (4.2, 0.12, 0.12), yaw)
        B["neon-pink"].box(P(i, 0, off - 3.2, 5.6), (4.2, 0.12, 0.12), yaw)
        person(P(i, 0, off - 5.0, 4.5), yaw + math.pi / 2)
        for along in (-7.0, 7.0):
            B["dark"].box(P(i, along, off - 4.5, 4.5), (1.8, 1.6, 3.6), yaw)
        for _ in range(26):
            person(P(i, rng.uniform(-8, 8), off + rng.uniform(-2.5, 6), 4.5), yaw - math.pi / 2 + rng.uniform(-0.5, 0.5))
        beams(P(i, 0, off - 4.5, 8.2), yaw + math.pi / 2, 6)

    # Yachts at anchor off the beaches, a few under pink sail.
    xs, ys = [p["x"] for p in s], [p["y"] for p in s]
    cx, cy = sum(xs) / n, sum(ys) / n
    reach = max(max(xs) - min(xs), max(ys) - min(ys)) / 2
    yachts = 0
    while yachts < 26:
        a, r = rng.uniform(0, math.tau), reach + rng.uniform(40, 520)
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if height_at(x, y) > -3.0:
            continue
        yaw = rng.uniform(0, math.tau)
        strip.boat(x,y,yaw,pink=yachts%4==0)
        yachts += 1

    # The finale rides into the sunset: the sun sits where the last stretch points, Conillera beside it.
    tail, fin = road.index(length - 220), road.index(length)
    az = math.atan2(s[fin]["y"] - s[tail]["y"], s[fin]["x"] - s[tail]["x"])
    fx, fy = s[fin]["x"], s[fin]["y"]
    dist_, radius, alt = 5200.0, 520.0, 300.0
    sx, sy = fx + math.cos(az) * dist_, fy + math.sin(az) * dist_
    for q in range(32):
        a0, a1 = q * math.tau / 32, (q + 1) * math.tau / 32
        p0 = (sx - math.sin(az) * math.cos(a0) * radius, sy + math.cos(az) * math.cos(a0) * radius, alt + math.sin(a0) * radius)
        p1 = (sx - math.sin(az) * math.cos(a1) * radius, sy + math.cos(az) * math.cos(a1) * radius, alt + math.sin(a1) * radius)
        B["sun"].tri((sx, sy, alt), p1, p0)
    # The glow round the sun: a wider disc behind it that fades into the sky's own colour at its edge.
    halo = Builder("SunHalo", "sun")
    halo.colours = []
    hot, sky_ = srgb(0xFF9458), srgb(0xF0A784)
    hx, hy = sx + math.cos(az) * 40, sy + math.sin(az) * 40
    for q in range(32):
        a0, a1 = q * math.tau / 32, (q + 1) * math.tau / 32
        ring = [(hx - math.sin(az) * math.cos(a) * radius * 1.6, hy + math.cos(az) * math.cos(a) * radius * 1.6, alt + math.sin(a) * radius * 1.6) for a in (a1, a0)]
        base = len(halo.verts)
        halo.verts += [(hx, hy, alt), ring[0], ring[1]]
        halo.colours += [hot, sky_, sky_]
        halo.faces.append((base, base + 1, base + 2))
    halo.build(col)
    # The sky itself: a sunset under a deck of cloud lit from below.
    build_sky(col, az, 0xF2A77A)
    # The sun's path on the water: glints scattered towards it from the finish's shore.
    for _ in range(170):
        out = rng.uniform(120, 2600)
        across = rng.uniform(-1, 1) * (30 + out * 0.07)
        gx, gy = fx + math.cos(az) * out - math.sin(az) * across, fy + math.sin(az) * out + math.cos(az) * across
        if height_at(gx, gy) > -2.0:
            continue
        w, d = rng.uniform(3, 9) * (1 + out / 900), rng.uniform(0.4, 1.0) * (1 + out / 900)
        c, sn = math.cos(az), math.sin(az)
        B["glint"].quad(
            (gx - c * d + sn * w, gy - sn * d - c * w, 0.06),
            (gx + c * d + sn * w, gy + sn * d - c * w, 0.06),
            (gx + c * d - sn * w, gy + sn * d + c * w, 0.06),
            (gx - c * d - sn * w, gy - sn * d + c * w, 0.06),
        )
    ia = az + math.radians(11)
    ix, iy = fx + math.cos(ia) * 3300, fy + math.sin(ia) * 3300
    profile = [(-900, 0), (-760, 90), (-600, 150), (-470, 260), (-330, 230), (-210, 380), (-60, 440), (90, 330), (230, 360), (380, 210), (520, 250), (690, 110), (820, 60), (900, 0)]
    for (u0, h0), (u1, h1) in zip(profile, profile[1:]):
        for depth in (-260, 260):
            a = (ix - math.sin(ia) * u0, iy + math.cos(ia) * u0)
            b_ = (ix - math.sin(ia) * u1, iy + math.cos(ia) * u1)
            off = (math.cos(ia) * depth, math.sin(ia) * depth)
            quad = ((a[0] + off[0], a[1] + off[1], -2), (b_[0] + off[0], b_[1] + off[1], -2), (b_[0], b_[1], h1), (a[0], a[1], h0))
            B["island"].quad(*(quad if depth < 0 else quad[::-1]))
    strip.cove(road,height_at)
    strip.build(col)
    B["island"].name = "Conillera"
    for b in B.values():
        b.build(col)
    return {"sunAzimuth": az, "clubs": len(clubs), "efforts": efforts, "lights": kit.lights, "signs": signs}


def build_themed_scenery(road: Road, st: list[dict], length: float, height_at, course: dict, theme: dict, col) -> dict:
    """Every map but Ibiza's: the theme's scenery (themes.py), and the sun (or the moon) where the finish points."""
    rng = random.Random(course.get("seed", 1) * 7 + 3)

    class Bag(dict):
        def __missing__(self, name):
            b = Builder("".join(p.title() for p in name.split("-")), name)
            self[name] = b
            return b

    B = Bag()
    kit = themes.Kit(road, st, length, height_at, rng, B, STEP, ROAD_HALF)
    facts = themes.SCENERY[course["theme"]](kit)
    facts["lights"] = kit.lights
    s = road.s
    tail, fin = road.index(length - 220), road.index(length)
    az = math.atan2(s[fin]["y"] - s[tail]["y"], s[fin]["x"] - s[tail]["x"])
    # The sun stands over the finish unless the theme says where it is (`sun_azimuth`, radians from Blender's +X).
    az = theme.get("sun_azimuth", az)
    fx, fy = s[fin]["x"], s[fin]["y"]
    alt = theme.get("sun_altitude", 0.1)
    dist_ = 5200.0
    radius = theme.get("disc_radius", 300.0 if theme.get("night") else 420.0)
    radius = theme.get("sun_radius", radius)
    sx, sy, sz = fx + math.cos(az) * dist_, fy + math.sin(az) * dist_, max(160.0, dist_ * alt)
    if theme.get("disc_above_finish"):
        sz = s[fin]["z"] + dist_ * math.tan(alt)
    disc = B["moon" if theme.get("night") else "sun"]
    for q in range(32):
        a0, a1 = q * math.tau / 32, (q + 1) * math.tau / 32
        p0 = (sx - math.sin(az) * math.cos(a0) * radius, sy + math.cos(az) * math.cos(a0) * radius, sz + math.sin(a0) * radius)
        p1 = (sx - math.sin(az) * math.cos(a1) * radius, sy + math.cos(az) * math.cos(a1) * radius, sz + math.sin(a1) * radius)
        disc.tri((sx, sy, sz), p1, p0)
    disc.name = "Sun"
    for b in B.values():
        b.build(col)
    facts.setdefault("clubs", 0)
    facts["sunAzimuth"] = az
    return facts


# --- The files --------------------------------------------------------------------------------


def write_course_json(path: Path, course: dict, samples, st, length, mean, facts, per_level: float = GRADE_PER_LEVEL) -> dict:
    """The centre line in the glb's own axes (+Y up: x, z, -y of Blender's) and the stages along it."""
    climb = sum(max(0.0, samples[i + 1]["z"] - samples[i]["z"]) for i in range(len(samples) - 1) if 0 <= samples[i]["d"] < length)
    az = facts["sunAzimuth"]
    theme = themes.THEMES.get(course.get("theme", ""))
    alt = theme.get("sun_altitude", 0.11) if theme else 0.11
    flat = math.sqrt(1 - alt * alt)
    data = {
        "id": course["id"],
        "name": course["name"],
        "world": course["world"],
        "lengthMetres": round(length, 1),
        "climbingMetres": round(climb),
        "durationSeconds": sum(s["duration"] for s in st),
        "step": STEP,
        "startIndex": int(LEAD_IN / STEP),
        "roadHalfWidth": course.get("roadHalfWidth", (theme or {}).get("road_half_width", ROAD_HALF)),
        "meanLevel": round(mean, 2),
        "gradePerLevel": per_level,
        # The direction the light comes from, as a unit vector in the glb's axes.
        "sun": [round(math.cos(az) * flat, 4), round(alt, 4), round(-math.sin(az) * flat, 4)],
        "stages": [
            {
                "kind": s["kind"],
                "start": s["start"],
                "duration": s["duration"],
                "level": s["level"],
                "cadenceAim": s["cadenceAim"],
                "from": round(s["from"], 1),
                "to": round(s["to"], 1),
            }
            for s in st
        ],
        "points": [v for p in samples for v in (round(p["x"], 2), round(p["z"], 2), round(-p["y"], 2))],
    }
    if "bank" in samples[0]:
        data["bankDegrees"] = [round(p["bank"], 3) for p in samples]
    if "class" in course:
        data["class"] = course["class"]
    if facts.get("cableways"):
        data["cableways"] = facts["cableways"]
    if facts.get("headland"):
        data["headland"] = facts["headland"]
    if facts.get("ligurianCoast"):
        data["ligurianCoast"] = facts["ligurianCoast"]
    if facts.get("gliders"):
        data["gliders"] = facts["gliders"]
    if theme:
        # The sky the app draws, horizon up, the haze the distance fades into, and its lights.
        hexs = lambda v: f"#{v:06x}"  # noqa: E731
        data["sky"] = [hexs(c) for c in theme["sky"]]
        data["haze"] = hexs(theme["haze"])
        data["light"] = {"colour": hexs(theme["light"][0]), "intensity": theme["light"][1]}
        data["fill"] = [hexs(c) for c in theme["fill"]]
        # A map by the sea: the app draws the sheet round the land as water. Inland it is the ground beyond the land.
        if theme["terrain"].get("sea"):
            data["sea"] = True
        if theme.get("night"):
            data["night"] = True
        if "wet" in theme:
            data["wet"] = theme["wet"]
        if "rain" in theme:
            data["rain"] = theme["rain"]
        if facts.get("lights"):
            # Coloured lights that stand still, five numbers each: where (x, z in the glb's axes), the colour as one
            # number (0xRRGGBB), how far it reaches in metres and how strong it is beneath it.
            data["lights"] = [
                v
                for x, y, glow, reach, strength in facts["lights"]
                for v in (round(x, 1), round(-y, 1), MATERIALS[glow]["color"], reach, round(strength, 2))
            ]
        if "lamps" in theme:
            # The street lamps, both sides: where their light falls on the ground (see `Kit.lamp`).
            lamps = theme["lamps"]
            data["lamps"] = {
                "every": lamps["every"] * STEP,
                "first": lamps["start"] * STEP - LEAD_IN,
                "across": round(ROAD_HALF + 0.6 + lamps["off"] - 1.2, 2),
                "height": lamps["height"] - 0.35,
                "colour": hexs(MATERIALS[lamps["glow"]]["color"]),
            }
    path.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")
    return data


def export_glb(path: Path) -> None:
    props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    wanted = {
        "filepath": str(path),
        "export_format": "GLB",
        "export_yup": True,
        "export_apply": True,
        "export_normals": False,
        "export_texcoords": True,
        "export_tangents": False,
        "export_materials": "EXPORT",
        "export_vertex_color": "MATERIAL",
        "export_cameras": False,
        "export_lights": False,
        "export_animations": False,
        "export_skins": False,
        "export_morph": False,
        "use_visible": True,
        "export_all_vertex_colors": False,
    }
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in props})


def add_guides(samples, course: dict) -> None:
    """The centre line as a curve, in a collection the glb leaves out: for whoever opens the scene."""
    guides = bpy.data.collections.new("Guides")
    bpy.context.scene.collection.children.link(guides)
    curve = bpy.data.curves.new("CentreLine", "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("POLY")
    spline.points.add(len(samples) - 1)
    for p, s in zip(spline.points, samples):
        p.co = (s["x"], s["y"], s["z"] + 0.3, 1.0)
    guides.objects.link(bpy.data.objects.new("CentreLine", curve))
    guides.hide_render = True
    guides.hide_viewport = False
    bpy.context.scene["telo_course"] = course["id"]


def light_scene_theme(az: float, theme: dict) -> None:
    """The theme's sky as a gradient from the horizon up, and its sun (or moon) where the finish points."""
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Sky")
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = nodes["Background"]
    coord = nodes.new("ShaderNodeTexCoord")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    ramp = nodes.new("ShaderNodeValToRGB")
    links.new(coord.outputs["Generated"], sep.inputs[0])
    links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bg.inputs["Color"])
    els = ramp.color_ramp.elements
    sky = theme["sky"]
    while len(els) < len(sky) + 1:
        els.new(0.5)
    # The view's direction: its Z runs from 0 at the horizon to 1 overhead. The haze below, the bands above,
    # spaced as the app's sky dome spaces them (up ** 0.55).
    els[0].position, els[0].color = 0.0, srgb(theme["haze"])
    for k, c in enumerate(sky):
        els[k + 1].position = min(0.999, 0.004 + (k / (len(sky) - 1)) ** (1 / 0.55))
        els[k + 1].color = srgb(c)
    bg.inputs[1].default_value = 1.4 if theme.get("night") else 1.0
    scene.world = world
    colour, energy = theme["light"]
    sun = bpy.data.lights.new("SunLight", "SUN")
    c = srgb(colour)
    sun.energy, sun.color, sun.angle = energy * (3.0 if theme.get("night") else 1.3), (c[0], c[1], c[2]), math.radians(2)
    obj = bpy.data.objects.new("SunLight", sun)
    alt = max(0.25, theme.get("sun_altitude", 0.1))
    direction = Vector((-math.cos(az), -math.sin(az), -alt)).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(obj)


def light_scene(az: float) -> None:
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Sunset")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = srgb(0xF2A77A)
    bg.inputs[1].default_value = 0.9
    scene.world = world
    sun = bpy.data.lights.new("SunLight", "SUN")
    sun.energy, sun.color, sun.angle = 3.2, (1.0, 0.74, 0.5), math.radians(3)
    obj = bpy.data.objects.new("SunLight", sun)
    # A sun lamp shines down its own -Z: aim that from the sun towards the island.
    direction = Vector((-math.cos(az), -math.sin(az), -0.2)).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(obj)


def render_previews(out: Path, road: Road, length: float) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = False
    scene.render.resolution_x, scene.render.resolution_y = 960, 540
    cam_data = bpy.data.cameras.new("Preview")
    cam_data.clip_end = 20000
    cam = bpy.data.objects.new("Preview", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    out.mkdir(parents=True, exist_ok=True)
    xs, ys = [p["x"] for p in road.s], [p["y"] for p in road.s]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    shots = {"overview": None, "start": -14.0, "climb": None, "finish": length - 16.0}
    steepest = max(range(len(road.s)), key=lambda i: road.s[i]["g"] if 0 < road.s[i]["d"] < length else -99)
    shots["climb"] = road.s[steepest]["d"] - 60
    for name, d in shots.items():
        if d is None:
            cam.location = (cx - span * 0.25, cy - span * 0.95, span * 0.85)
            target = Vector((cx, cy, 0))
            cam_data.lens = 32
        else:
            i = road.index(d)
            back = road.at(max(0, i - 1), 0.0, 2.2)
            ahead = road.at(min(len(road.s) - 1, i + 8), 0.0, 1.2)
            cam.location, target = back, Vector(ahead)
            cam_data.lens = 22
        cam.rotation_euler = (target - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(out / f"{name}.png")
        bpy.ops.render.render(write_still=True)


def reset_scene() -> None:
    """An empty scene: factory settings in the background, or the open file emptied in a running Blender."""
    if bpy.app.background:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        return
    scene = bpy.context.scene
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(scene.collection.children):
        scene.collection.children.unlink(child)
    for blocks in (bpy.data.collections, bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.lights, bpy.data.cameras, bpy.data.worlds, bpy.data.actions):
        for block in list(blocks):
            blocks.remove(block)
    scene.animation_data_clear()


def rider_mesh(name: str, jersey: int):
    """A cyclist on a bike, low-poly, +X forward: for the film only, never in the glb."""
    b = Builder(name, "dark")
    j = Builder(name + "Jersey", "dark")
    for cx in (-0.55, 0.55):
        ring = []
        for q in range(14):
            a = q * math.tau / 14
            ring.append((cx + math.cos(a) * 0.34, 0.0, 0.34 + math.sin(a) * 0.34))
        for q in range(14):
            p0, p1 = ring[q], ring[(q + 1) % 14]
            b.quad((p0[0], -0.03, p0[2]), (p1[0], -0.03, p1[2]), (p1[0], 0.03, p1[2]), (p0[0], 0.03, p0[2]))
    b.box((0.0, 0.0, 0.55), (1.0, 0.06, 0.06))
    b.box((-0.2, 0.0, 0.34), (0.06, 0.06, 0.55))
    b.box((0.5, 0.0, 0.34), (0.06, 0.06, 0.7))
    j.box((-0.15, 0.0, 0.85), (0.18, 0.32, 0.45))  # hips over the saddle
    torso = [(-0.25, -0.17, 1.05), (-0.25, 0.17, 1.05), (0.35, 0.17, 1.25), (0.35, -0.17, 1.25)]
    top = [(p[0], p[1], p[2] + 0.28) for p in torso]
    for k in range(4):
        j.quad(torso[k], torso[(k + 1) % 4], top[(k + 1) % 4], top[k])
    j.faces.append(tuple(j.v(p) for p in top))
    j.box((0.45, 0.0, 1.38), (0.24, 0.22, 0.24))  # helmet
    for side in (-0.14, 0.14):
        j.box((0.0, side, 0.45), (0.1, 0.1, 0.55))
        j.box((0.4, side, 0.95), (0.08, 0.08, 0.35))
    kit = bpy.data.materials.new(name + "Kit")
    kit.use_nodes = True
    bsdf = next(n for n in kit.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = srgb(jersey)
    bsdf.inputs["Emission Color"].default_value = srgb(jersey)
    bsdf.inputs["Emission Strength"].default_value = 0.4
    riders = bpy.data.collections.get("Riders")
    if riders is None:
        riders = bpy.data.collections.new("Riders")
        bpy.context.scene.collection.children.link(riders)
    frame = b.build(riders)
    body = j.build(riders)
    body.data.materials[0] = kit
    body.parent = frame
    return frame


def set_video_output(scene, path: Path, fps: int) -> None:
    settings = scene.render.image_settings
    if hasattr(settings, "media_type"):
        settings.media_type = "VIDEO"
    settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.fps = fps
    scene.render.filepath = str(path)


def stage_video(path: Path, road: Road, st: list[dict], length: float, seconds: float = 20.0, fps: int = 30, size=(1280, 720), night: bool = False) -> dict:
    """Sets up a 20-second film of the map: an aerial of its turns and hills, then a drone chasing the rider out of
    the start, up the twistiest climb and in to the finish. Render it with `bpy.ops.render.render(animation=True)`."""
    scene = bpy.context.scene
    s, n = road.s, len(road.s)
    frames = int(seconds * fps)
    scene.frame_start, scene.frame_end = 1, frames
    scene.render.engine = "BLENDER_EEVEE"
    try:
        scene.eevee.taa_render_samples = 16
    except AttributeError:
        pass
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = size[0], size[1], 100
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    set_video_output(scene, path, fps)

    cam_data = bpy.data.cameras.new("Film")
    cam_data.clip_start, cam_data.clip_end = 0.5, 20000
    cam_data.lens = 24
    cam = bpy.data.objects.new("Film", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.rotation_mode = "QUATERNION"
    # The sun's disc stands in the sky: it lights nothing and shades nothing.
    disc = bpy.data.objects.get("Sun")
    if disc is not None:
        disc.visible_shadow = False
    lamps = bpy.data.objects.get("GlowLamp")
    if lamps is not None and scene.world and scene.world.name == "Sky" and night:
        # At night the street lamps light the road in the film (the glb's lamps only glow): one light a lamp
        # near the road, as far as EEVEE keeps its frame time.
        data = bpy.data.lights.new("LampLight", "POINT")
        data.energy, data.color, data.shadow_soft_size = 900.0, (1.0, 0.82, 0.55), 0.4
        try:
            data.use_shadow = False
        except AttributeError:
            pass
        mesh = lamps.data
        seen = set()
        for poly in mesh.polygons:
            c = poly.center
            key = (round(c.x / 20), round(c.y / 20))
            if key in seen:
                continue
            seen.add(key)
            light = bpy.data.objects.new("LampLight", data)
            light.location = (c.x, c.y, c.z - 0.6)
            scene.collection.objects.link(light)
    you = rider_mesh("Rider", 0xD7FF3A)
    bots = [rider_mesh(f"Bot{k}", c) for k, c in enumerate((0xFF4A9A, 0x3AC8E8, 0xF2A23A))]

    xs, ys = [p["x"] for p in s], [p["y"] for p in s]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    zmid = sum(p["z"] for p in s) / n
    # The twistiest climb: the 300 m with the most turning and climbing.
    window = int(300 / STEP)
    best, best_i = -1.0, road.index(length * 0.4)
    lo, hi = road.index(400), road.index(length - 700)
    for i in range(lo, max(lo + 1, hi - window), 3):
        score = sum(abs(s[j]["k"]) * STEP for j in range(i, i + window)) + max(0.0, s[i + window]["z"] - s[i]["z"]) * 0.05
        if score > best:
            best, best_i = score, i
    climb_from = s[best_i]["d"]
    shots = [
        ("aerial", 0.0, 4.0, None, None),
        ("start", 4.0, 9.0, -12.0, 170.0),
        ("climb", 9.0, 15.0, climb_from, climb_from + 300.0),
        ("finish", 15.0, seconds, length - 240.0, length - 4.0),
    ]
    prev_q = None
    for f in range(1, frames + 1):
        t = (f - 1) / fps
        name, t0, t1, d0, d1 = next(sh for sh in shots if sh[1] <= t < sh[2] or sh is shots[-1])
        u = (t - t0) / (t1 - t0)
        if name == "aerial":
            a = -1.9 + u * 0.6
            loc = Vector((cx + math.cos(a) * span * 0.8, cy + math.sin(a) * span * 0.8, zmid + span * 0.36))
            target = Vector((cx, cy, zmid))
            d = -12.0
        else:
            ease = u if name != "finish" else 1 - (1 - u) ** 1.6
            d = d0 + (d1 - d0) * ease
            back, up = (16.0, 7.5) if name == "climb" else (11.0, 4.5)
            if name == "finish":
                back, up = 11.0 - 5.0 * u, 4.5 - 2.0 * u
            loc = Vector(road.pos(d - back, 1.5, up))
            target = Vector(road.pos(d + 22.0, 0.0, 1.2))
        q = (target - loc).to_track_quat("-Z", "Y")
        if prev_q is not None and q.dot(prev_q) < 0:
            q.negate()
        prev_q = q
        cam.location = loc
        cam.rotation_quaternion = q
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        for rider, ahead, lane in ((you, 0.0, 0.0), (bots[0], 9.0, -2.2), (bots[1], 17.0, 1.8), (bots[2], -7.0, -2.6)):
            rd = d + ahead
            p0, p1 = Vector(road.pos(rd, -lane, 0.0)), Vector(road.pos(rd + 2.0, -lane, 0.0))
            fwd = p1 - p0
            rider.location = p0
            rider.rotation_euler = (0.0, -math.atan2(fwd.z, fwd.xy.length), math.atan2(fwd.y, fwd.x))
            rider.keyframe_insert("location", frame=f)
            rider.keyframe_insert("rotation_euler", frame=f)
    return {"frames": frames, "climbFrom": round(climb_from)}


def main(argv: list[str] | None = None) -> dict:
    global ROAD_HALF
    if argv is None:
        argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("course", type=Path)
    parser.add_argument("--out", type=Path, default=ROOT / "frontend/projects/ride/public/courses")
    parser.add_argument("--blend", type=Path, default=ROOT / "tools/blender/scenes")
    parser.add_argument("--preview", type=Path, default=None)
    parser.add_argument("--video", type=Path, default=None, help="stage a 20 s film of the map (an .mp4 path) and save its scene beside it")
    parser.add_argument("--render", action="store_true", help="with --video: render the film now")
    args = parser.parse_args(argv)

    global STEP
    course = json.loads(args.course.read_text(encoding="utf-8"))
    theme = themes.THEMES.get(course.get("theme", ""))
    STEP = (theme or {}).get("sample_step", STEP)
    # A theme whose land and scenery are its own (Ibiza's) is a theme in everything else.
    themed = bool(theme) and not theme.get("own")
    ROAD_HALF = (theme or {}).get("road_half_width", DEFAULT_ROAD_HALF)
    if theme:
        for name, colour in theme.get("palette", {}).items():
            MATERIALS[name] = {**MATERIALS[name], "color": colour}
        if not theme["terrain"].get("sea"):
            # Inland the "sea" is the ground beyond the land: matt, not a mirror.
            MATERIALS["sea"] = {**MATERIALS["sea"], "color": theme["land"]["mid"], "rough": 1.0, "metal": 0.0}
    reset_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    col = bpy.data.collections.new("Map")
    scene.collection.children.link(col)
    Builder.map_collection = col
    PARTS.clear()

    if (theme or {}).get("builder") == "sellaronda":
        samples, st, length, mean, per_level = sellaronda.lay_centre_line(course, theme)
    elif (theme or {}).get("lay"):
        # A theme that lays its own road (Cinque Terre's corniche along its coast).
        samples, st, length, mean, per_level = theme["lay"](course, theme, sys.modules[__name__])
    else:
        samples, st, length, mean, per_level = lay_centre_line(course, theme)
    road = Road(samples)
    (theme or {}).get("surface_builder", build_road)(road, st, length, col, theme)
    if (theme or {}).get("builder") == "sellaronda":
        _, height_at = sellaronda.build_terrain(road, col, Builder)
        facts = sellaronda.build_scenery(road, st, length, height_at, course, col, Builder, build_sky)
    elif themed:
        # A theme may build its own land too.
        _, height_at = theme["land_builder"](road, col, theme, sys.modules[__name__]) if theme.get("land_builder") else build_land(road, col, theme)
        facts = build_themed_scenery(road, st, length, height_at, course, theme, col)
    else:
        _, height_at = build_terrain(road, col)
        facts = build_scenery(road, st, length, height_at, course, col)
    built = assemble(road, col, (theme or {}).get("chunks"))
    add_guides(samples, course)

    args.out.mkdir(parents=True, exist_ok=True)
    args.blend.mkdir(parents=True, exist_ok=True)
    if forest := facts.pop("forest", None):
        (args.out / f"{course['id']}-trees.json").write_text(json.dumps(forest, separators=(",", ":")))
    data = write_course_json(args.out / f"{course['id']}.course.json", course, samples, st, length, mean, facts, per_level)
    # Only the map goes into the glb: the guides stay in the scene.
    bpy.data.collections["Guides"].hide_viewport = True
    export_glb(args.out / f"{course['id']}.glb")
    pack_glb(args.out / f"{course['id']}.glb")
    # And its buffers with the meshopt codec, where Node and the app's packages are at hand (meshopt_glb.mjs): a
    # third of the download. Without them the map is left as it is, and loads all the same.
    node = shutil.which("node")
    if node and (ROOT / "frontend/node_modules/meshoptimizer").exists():
        subprocess.run([node, str(ROOT / "tools/blender/meshopt_glb.mjs"), str(args.out / f"{course['id']}.glb")], check=True)
    else:
        print("meshopt_glb.mjs not run: node or frontend/node_modules/meshoptimizer is missing.", flush=True)
    bpy.data.collections["Guides"].hide_viewport = False
    if themed:
        light_scene_theme(facts["sunAzimuth"], theme)
    else:
        light_scene(facts["sunAzimuth"])
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend / f"{course['id']}.blend"), compress=True)
    if args.preview:
        render_previews(args.preview, road, length)
    tris = built["triangles"]
    print(
        f"{course['name']}: {data['lengthMetres']} m, {data['climbingMetres']} m climbed, "
        f"{len(st)} stages, {facts.get('clubs', 0)} clubs, {facts['efforts']} effort gates, {tris} triangles in {built['meshes']} meshes"
    )
    film = {}
    if args.video:
        args.video.parent.mkdir(parents=True, exist_ok=True)
        film = stage_video(args.video, road, st, length, night=bool(theme and theme.get("night")))
        if args.render:
            bpy.ops.render.render(animation=True)
    return {
        "lengthMetres": data["lengthMetres"],
        "climbingMetres": data["climbingMetres"],
        "triangles": tris,
        **film,
        **{k: v for k, v in facts.items() if k not in ("sunAzimuth", "lights", "cableways", "gliders", "headland", "ligurianCoast")},
    }


if __name__ == "__main__":
    main()
