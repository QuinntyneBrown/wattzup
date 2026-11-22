"""Builds a Telo Ride map in Blender from a course file (ADR 0032).

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
import sys
from pathlib import Path

import bpy
import bmesh  # after bpy: the bpy module provides it
from mathutils import Vector, kdtree

ROOT = Path(__file__).resolve().parents[2]

# --- The road's rules -------------------------------------------------------------------------

STEP = 4.0  # metres between the centre line's samples
METRES_PER_TURN = 5.0  # as the scene driver's: a road bike in a middle gear
GRADE_PER_LEVEL = 1.0  # percent of gradient for each level above the course's mean
LEAD_IN = 80.0  # road before the start line
RUN_OUT = 200.0  # road after the finish line
ROAD_HALF = 5.0
CLEAR = 46.0  # the road keeps this far from an earlier stretch of itself
SEA_CLEARANCE = 4.0  # the road's lowest point above the sea
START_LINE = 14.0  # the start line and its gate stand this far up the road: the rider starts on the grid behind it


def stages(plan: dict) -> list[dict]:
    """The plan's segments with the seconds and the metres each starts and ends at."""
    out, t, d = [], 0.0, 0.0
    for seg in plan["segments"]:
        length = seg["duration"] * seg["cadenceAim"] / 60.0 * METRES_PER_TURN
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


def deal_turns(stages_: list[dict], total: float, rng: random.Random) -> list[float] | None:
    """The road's curvature at each sample, dealt feature by feature so it never meets itself."""
    n = int(math.ceil(total / STEP)) + 1
    weights = {
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
        if far > 620:
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


def lay_centre_line(course: dict):
    """The centre line's samples (x, y, z, heading, curvature, grade) in Blender's Z-up metres."""
    st = stages(course["plan"])
    length = st[-1]["to"]
    total = LEAD_IN + length + RUN_OUT
    mean = sum(s["level"] * (s["to"] - s["from"]) for s in st) / length

    seed = course.get("seed", 1)
    best = None
    for attempt in range(200):
        rng = random.Random(seed * 1000 + attempt)
        raw = deal_turns(st, total, rng)
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
            best = (blocked, curv, xs, ys, hs)
        if blocked == 0 or attempt >= 119:
            break
    if best is None:
        raise RuntimeError("No road found that keeps clear of itself; change the course's seed.")
    _, curv, xs, ys, hs = best
    n = len(curv)

    grades = []
    for i in range(n):
        stage = stage_at(st, i * STEP - LEAD_IN)
        grades.append((stage["level"] - mean) * GRADE_PER_LEVEL if stage else 0.0)
    grades = box_smooth(grades, int(28 / STEP))
    zs, z = [], 0.0
    for g in grades:
        z += g / 100.0 * STEP
        zs.append(z)
    low = min(zs)
    zs = [v - low + SEA_CLEARANCE for v in zs]
    samples = [
        {"x": xs[i], "y": ys[i], "z": zs[i], "h": hs[i], "k": curv[i], "g": grades[i], "d": i * STEP - LEAD_IN}
        for i in range(n)
    ]
    return samples, st, length, mean


# --- Meshes -----------------------------------------------------------------------------------


def srgb(hex_: int) -> tuple[float, float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin((hex_ >> 16 & 255) / 255), lin((hex_ >> 8 & 255) / 255), lin((hex_ & 255) / 255), 1.0)


MATERIALS: dict[str, dict] = {
    "asphalt": {"color": 0x24242B, "rough": 0.92},
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
    "leaf": {"color": 0x2F8A4E, "rough": 0.8, "double": True},
    "bush": {"color": 0x3F7A46, "rough": 0.9},
    "bougainvillea": {"color": 0xD02A8A, "rough": 0.8},
    "whitewash": {"color": 0xF8F3EA, "rough": 0.85},
    "wood": {"color": 0x8A6440, "rough": 0.8},
    "dark": {"color": 0x18181C, "rough": 0.6},
    "rock": {"color": 0x8C7B6A, "rough": 1.0},
    "glow-door": {"color": 0xFF9A4A, "glow": 1.3},
    "lamp-red": {"color": 0xFF3020, "glow": 2.2},
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
    "island": {"color": 0x5A3F52, "rough": 1.0},
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

    def __init__(self, name: str, mat: str):
        self.name, self.mat = name, mat
        self.verts: list[tuple[float, float, float]] = []
        self.faces: list[tuple[int, ...]] = []
        self.colours: list[tuple[float, float, float, float]] | None = None

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
        for f in ((3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
            self.faces.append(tuple(base + i for i in f))

    def build(self, collection):
        if not self.faces:
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


def build_road(road: Road, st: list[dict], length: float, col) -> None:
    s = road.s
    n = len(s)
    asphalt, paint, red = Builder("Road", "asphalt"), Builder("RoadPaint", "paint"), Builder("Kerbs", "kerb-red")
    yellow, prom, sand = Builder("CentreLine", "yellow"), Builder("Promenade", "promenade"), Builder("Shoulder", "sand")
    wall, chev = Builder("Seawall", "wall"), Builder("EffortChevrons", "chevron")
    kerb = ROAD_HALF + 0.6

    def strip(b: Builder, i: int, l0: float, u0: float, l1: float, u1: float) -> None:
        """A quad from sample i to i+1 between two offsets; `l0` is the further left."""
        b.quad(road.at(i, l0, u0), road.at(i, l1, u1), road.at(i + 1, l1, u1), road.at(i + 1, l0, u0))

    for i in range(n - 1):
        strip(asphalt, i, ROAD_HALF, 0.0, -ROAD_HALF, 0.0)
        # The double yellow line down the middle and a white line inside each edge.
        strip(yellow, i, 0.30, 0.02, 0.14, 0.02)
        strip(yellow, i, -0.14, 0.02, -0.30, 0.02)
        strip(paint, i, ROAD_HALF - 0.3, 0.02, ROAD_HALF - 0.46, 0.02)
        strip(paint, i, -ROAD_HALF + 0.46, 0.02, -ROAD_HALF + 0.3, 0.02)
        bend = abs(s[i]["k"]) > 1 / 170
        for side in (1, -1):
            block = red if bend and i % 2 else (paint if bend else prom)
            if side > 0:
                strip(block, i, kerb, 0.12, ROAD_HALF, 0.05)
            else:
                strip(block, i, -ROAD_HALF, 0.05, -kerb, 0.12)
        # Left: a sidewalk, then the seawall, then the rocks and sand falling to the sea.
        w0, w1 = kerb + SIDEWALK, kerb + SIDEWALK + 0.45
        strip(prom, i, w0, 0.12, kerb, 0.12)
        strip(wall, i, w0, 1.0, w0, 0.12)
        strip(wall, i, w1, 1.0, w0, 1.0)
        strip(wall, i, w1, -1.2, w1, 1.0)
        strip(sand, i, w1 + 9.0, -3.0, w1, -0.4)
        # Right: the promenade the clubs' terraces stand on, then the land.
        strip(prom, i, -kerb, 0.12, -(kerb + TERRACE), 0.12)
        strip(sand, i, -(kerb + TERRACE), 0.12, -(kerb + TERRACE + 8.0), -2.4)

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
        if stage["kind"] != "work":
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


def build_terrain(road: Road, col, cell: float = 14.0):
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
                h_sum += w * road.s[j]["z"]
            h_road = h_sum / w_sum
            j0 = near[0][1]
            p0 = road.s[j0]
            # Left of the nearest stretch the land drops to the sea under the seawall; right of it the island rises.
            leftward = (x - p0["x"]) * -math.sin(p0["h"]) + (y - p0["y"]) * math.cos(p0["h"])
            seaward = smoothstep(4.0, 14.0, leftward)
            fall = smoothstep(46.0, 210.0, d) * (1 - seaward) + smoothstep(13.0, 64.0, d) * seaward
            bumps = (noise(x, y) * 6.0 + 3.0) * smoothstep(26.0, 70.0, d) * (1 - fall)
            h = (h_road - 1.4) * (1 - fall) + (-6.0) * fall + bumps
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


def palm(trunk: Builder, leaf: Builder, x: float, y: float, z: float, rng: random.Random) -> None:
    height, lean, yaw = rng.uniform(6.0, 9.5), rng.uniform(0.0, 1.4), rng.uniform(0, math.tau)
    rings = []
    for k in range(4):
        t = k / 3
        cx = x + math.cos(yaw) * lean * t * t
        cy = y + math.sin(yaw) * lean * t * t
        r = 0.28 * (1 - 0.45 * t)
        rings.append([(cx + math.cos(a) * r, cy + math.sin(a) * r, z - 0.4 + (height + 0.4) * t) for a in (0, 1.257, 2.513, 3.77, 5.027)])
    for k in range(3):
        for j in range(5):
            trunk.quad(rings[k][j], rings[k][(j + 1) % 5], rings[k + 1][(j + 1) % 5], rings[k + 1][j])
    top = (x + math.cos(yaw) * lean, y + math.sin(yaw) * lean, z + height)
    for j in range(7):
        a = yaw + j * math.tau / 7 + rng.uniform(-0.2, 0.2)
        reach, droop = rng.uniform(2.6, 3.6), rng.uniform(1.0, 2.0)
        ca, sa = math.cos(a), math.sin(a)
        mid = (top[0] + ca * reach * 0.55, top[1] + sa * reach * 0.55, top[2] + 0.45)
        tip = (top[0] + ca * reach, top[1] + sa * reach, top[2] - droop)
        w = 0.5
        l0 = (mid[0] - sa * w, mid[1] + ca * w, mid[2])
        r0 = (mid[0] + sa * w, mid[1] - ca * w, mid[2])
        leaf.tri(top, r0, l0)
        leaf.tri(l0, r0, tip)


def build_scenery(road: Road, st: list[dict], length: float, height_at, course: dict, col) -> dict:
    rng = random.Random(course.get("seed", 1) * 7 + 3)
    s, n = road.s, len(road.s)
    names = (
        "trunk leaf bush bougainvillea whitewash wall wood dark stone rock arrow sail sail-pink "
        "glow-door lamp-red gold confetti bulb paint sun island"
    ).split() + NEONS + BEAMS + CROWD
    B = {name: Builder("".join(p.title() for p in name.split("-")), name) for name in names}
    B["whitewash"].name, B["dark"].name, B["paint"].name = "Clubs", "Dark", "GatePaint"
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

    def person(c, yaw: float) -> None:
        """A dancer in one colour, arms in the air."""
        b = B[rng.choice(CROWD)]
        h = rng.uniform(0.92, 1.08)
        b.box(c, (0.2, 0.3, 0.8 * h), yaw)
        b.box((c[0], c[1], c[2] + 0.8 * h), (0.24, 0.42, 0.58 * h), yaw)
        b.box((c[0], c[1], c[2] + 1.44 * h), (0.23, 0.23, 0.25), yaw)
        for side in (1, -1):
            lift = rng.uniform(0.45, 0.8)
            out = 0.27 + lift * 0.18
            ax, ay = c[0] - math.sin(yaw) * out * side, c[1] + math.cos(yaw) * out * side
            b.box((ax, ay, c[2] + 1.28 * h), (0.1, 0.1, lift), yaw)

    def festoon(a, b_, bulbs: int = 9, sag: float = 1.1) -> None:
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

    def beams(origin, yaw: float, count: int = 4) -> None:
        for k in range(count):
            a = yaw + (k - (count - 1) / 2) * 0.55 + rng.uniform(-0.12, 0.12)
            tilt, reach, w = rng.uniform(0.5, 0.95), 150.0, 9.0
            tip = (origin[0] + math.cos(a) * reach * math.cos(tilt), origin[1] + math.sin(a) * reach * math.cos(tilt), origin[2] + reach * math.sin(tilt))
            left = (tip[0] - math.sin(a) * w, tip[1] + math.cos(a) * w, tip[2])
            right = (tip[0] + math.sin(a) * w, tip[1] - math.cos(a) * w, tip[2])
            up = (tip[0], tip[1], tip[2] + w)
            b = B[BEAMS[k % len(BEAMS)]]
            b.tri(origin, left, right)
            b.tri(origin, right, up)
            b.tri(origin, up, left)

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

    # Palms: along the seawall on the left, on the promenade's kerb on the right.
    i = 3
    while i < n - 2:
        side = 1 if (i // 6) % 2 else -1
        off = (kerb + SIDEWALK + 1.9) if side > 0 else -(kerb + 1.3)
        x, y, z = road.at(i, off + rng.uniform(-0.3, 0.3))
        if road.clear_of_road(x, y, 7.5, i):
            palm(B["trunk"], B["leaf"], x, y, z - (1.6 if side > 0 else 0.0), rng)
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
            B["glow-door"].box(P(i, along, -(front - 0.06), 0.12), (1.5, 0.14, 2.5), yaw)
            B["glow-door"].box(P(i, along, -(front - 0.06), 2.62), (1.1, 0.14, 0.35), yaw)
        for k in range(rng.choice((2, 3))):
            neon = B[NEONS[(len(clubs) + k) % len(NEONS)]]
            along = -width / 2 + (k + 0.5) * width / 3 + rng.uniform(-0.6, 0.6)
            w, h, t = rng.uniform(1.4, 2.6), rng.uniform(1.0, 1.9), 0.12
            up = 4.1
            off = -(front - 0.1)
            neon.box(P(i, along, off, up), (w, t, t), yaw)
            neon.box(P(i, along, off, up + h), (w, t, t), yaw)
            neon.box(P(i, along - w / 2, off, up), (t, t, h + t), yaw)
            neon.box(P(i, along + w / 2, off, up), (t, t, h + t), yaw)
        # A tall neon sign standing off the corner.
        sign = B[NEONS[(len(clubs) + 3) % len(NEONS)]]
        sign.box(P(i, -width / 2 - 0.4, -(front - 0.5), 3.4), (0.16, 0.9, 3.4), yaw)
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
        for lamp in range(3):
            mat = B["lamp-red"] if (lit and lamp == 2) else B["rock"]
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
            for _ in range(3):
                off = (kerb + rng.uniform(1.0, 2.1)) if side > 0 else -(kerb + rng.uniform(1.2, 3.2))
                person(P(i, rng.uniform(-1.8, 1.8), off, 0.12), yaw - math.pi / 2 * side + rng.uniform(-0.4, 0.4))
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
        B["whitewash"].box((x, y, -0.3), (9.0, 2.6, 1.5), yaw)
        B["dark"].box((x, y, 1.2), (0.16, 0.16, 11.0), yaw)
        c, sn = math.cos(yaw), math.sin(yaw)
        sail = B["sail-pink"] if yachts % 4 == 0 else B["sail"]
        sail.tri((x, y, 2.0), (x - c * 4.2, y - sn * 4.2, 2.0), (x, y, 12.0))
        sail.tri((x + c * 0.3, y + sn * 0.3, 2.0), (x + c * 4.0, y + sn * 4.0, 2.0), (x + c * 0.3, y + sn * 0.3, 10.5))
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
    B["island"].name = "Conillera"
    for b in B.values():
        b.build(col)
    return {"sunAzimuth": az, "clubs": len(clubs), "efforts": efforts}


# --- The files --------------------------------------------------------------------------------


def write_course_json(path: Path, course: dict, samples, st, length, mean, facts) -> dict:
    """The centre line in the glb's own axes (+Y up: x, z, -y of Blender's) and the stages along it."""
    climb = sum(max(0.0, samples[i + 1]["z"] - samples[i]["z"]) for i in range(len(samples) - 1) if 0 <= samples[i]["d"] < length)
    az = facts["sunAzimuth"]
    data = {
        "id": course["id"],
        "name": course["name"],
        "world": course["world"],
        "class": course["class"],
        "lengthMetres": round(length, 1),
        "climbingMetres": round(climb),
        "durationSeconds": sum(s["duration"] for s in st),
        "step": STEP,
        "startIndex": int(LEAD_IN / STEP),
        "roadHalfWidth": ROAD_HALF,
        "meanLevel": round(mean, 2),
        "gradePerLevel": GRADE_PER_LEVEL,
        # The direction the light comes from, as a unit vector in the glb's axes.
        "sun": [round(math.cos(az) * 0.994, 4), 0.11, round(-math.sin(az) * 0.994, 4)],
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
        "export_texcoords": False,
        "export_tangents": False,
        "export_materials": "EXPORT",
        "export_vertex_color": "MATERIAL",
        "export_cameras": False,
        "export_lights": False,
        "export_animations": False,
        "export_skins": False,
        "export_morph": False,
        "use_visible": True,
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


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("course", type=Path)
    parser.add_argument("--out", type=Path, default=ROOT / "frontend/projects/ride/public/courses")
    parser.add_argument("--blend", type=Path, default=ROOT / "tools/blender/scenes")
    parser.add_argument("--preview", type=Path, default=None)
    args = parser.parse_args(argv)

    course = json.loads(args.course.read_text(encoding="utf-8"))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    col = bpy.data.collections.new("Map")
    scene.collection.children.link(col)

    samples, st, length, mean = lay_centre_line(course)
    road = Road(samples)
    build_road(road, st, length, col)
    _, height_at = build_terrain(road, col)
    facts = build_scenery(road, st, length, height_at, course, col)
    add_guides(samples, course)

    args.out.mkdir(parents=True, exist_ok=True)
    args.blend.mkdir(parents=True, exist_ok=True)
    data = write_course_json(args.out / f"{course['id']}.course.json", course, samples, st, length, mean, facts)
    # Only the map goes into the glb: the guides stay in the scene.
    bpy.data.collections["Guides"].hide_viewport = True
    export_glb(args.out / f"{course['id']}.glb")
    bpy.data.collections["Guides"].hide_viewport = False
    light_scene(facts["sunAzimuth"])
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend / f"{course['id']}.blend"), compress=True)
    if args.preview:
        render_previews(args.preview, road, length)
    tris = sum(len(p.vertices) - 2 for o in col.objects for p in o.data.polygons)
    print(
        f"{course['name']}: {data['lengthMetres']} m, {data['climbingMetres']} m climbed, "
        f"{len(st)} stages, {facts['clubs']} clubs, {facts['efforts']} effort gates, {tris} triangles"
    )


if __name__ == "__main__":
    main()
