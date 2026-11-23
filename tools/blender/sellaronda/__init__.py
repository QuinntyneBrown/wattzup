"""Modular Dolomite builders for the Sella Ronda four-pass course."""

from __future__ import annotations

import math

STEP = 4.0
METRES_PER_TURN = 5.0
LEAD_IN = 80.0
RUN_OUT = 200.0
ROAD_HALF = 5.0

PASSES = (
    {
        "id": "campolongo",
        "name": "PASSO CAMPOLONGO",
        "ladin": "Ju de Ćiaulonch",
        "german": "Campolongopass",
        "alt": 1875,
        "at": 2100.0,
        "climb_from": 850.0,
        "descent_to": 3050.0,
        "peak_z": 78.0,
        "hairpins": 6,
    },
    {
        "id": "pordoi",
        "name": "PASSO PORDOI",
        "ladin": "Jëuf de Pordoi",
        "german": "Pordoijoch",
        "alt": 2239,
        "at": 4950.0,
        "climb_from": 3300.0,
        "descent_to": 6050.0,
        "peak_z": 134.0,
        "hairpins": 9,
    },
    {
        "id": "sella",
        "name": "PASSO SELLA",
        "ladin": "Jëuf de Sela",
        "german": "Sellajoch",
        "alt": 2240,
        "at": 7750.0,
        "climb_from": 6250.0,
        "descent_to": 8850.0,
        "peak_z": 138.0,
        "hairpins": 8,
    },
    {
        "id": "gardena",
        "name": "PASSO GARDENA",
        "ladin": "Ju de Frara",
        "german": "Grödnerjoch",
        "alt": 2121,
        "at": 10150.0,
        "climb_from": 9000.0,
        "descent_to": 11250.0,
        "peak_z": 112.0,
        "hairpins": 7,
    },
)

VILLAGES = (
    {"id": "corvara", "name": "Corvara", "ladin": "Corvara in Badia", "alt": 1568, "at": 260.0, "z": 14.0},
    {"id": "arabba", "name": "Arabba", "ladin": "Rèba", "alt": 1602, "at": 3120.0, "z": 22.0},
    {"id": "canazei", "name": "Canazei", "ladin": "Cianacei", "alt": 1465, "at": 6120.0, "z": 36.0},
    {"id": "selva", "name": "Selva", "ladin": "Sëlva", "alt": 1563, "at": 8920.0, "z": 42.0},
)


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


def sella_center_for(samples: list[dict]) -> tuple[float, float]:
    xs = [p["x"] for p in samples]
    ys = [p["y"] for p in samples]
    return (min(xs) + max(xs)) * 0.5, (min(ys) + max(ys)) * 0.5


def quad_shaded(peaks, p0, p1, p2, p3, colour_fn, z_hint: float, snow: bool = False) -> None:
    ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
    vx, vy, vz = p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    ln = max(1e-6, math.sqrt(nx * nx + ny * ny + nz * nz))
    c = colour_fn(nx / ln, ny / ln, nz / ln, z_hint, snow=snow)
    base_idx = len(peaks.verts)
    for p in (p0, p1, p2, p3):
        peaks.verts.append(p)
        peaks.colours.append(c)
    peaks.faces.append((base_idx, base_idx + 1, base_idx + 2, base_idx + 3))


def tri_shaded(peaks, p0, p1, p2, colour_fn, z_hint: float, snow: bool = False) -> None:
    ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
    vx, vy, vz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    ln = max(1e-6, math.sqrt(nx * nx + ny * ny + nz * nz))
    c = colour_fn(nx / ln, ny / ln, nz / ln, z_hint, snow=snow)
    base_idx = len(peaks.verts)
    for p in (p0, p1, p2):
        peaks.verts.append(p)
        peaks.colours.append(c)
    peaks.faces.append((base_idx, base_idx + 1, base_idx + 2))


def rock_tower(peaks, bx: float, by: float, base_z: float, top_z: float, rx: float, ry: float, sides: int, yaw: float, colour_fn, taper: float = 0.62, flat_cap: bool = True, seed_phase: float = 0.0) -> list[tuple[float, float, float]]:
    """Extrudes a faceted Dolomite limestone tower or cliff bastion into the unchunked Peaks builder."""
    ca, sa = math.cos(yaw), math.sin(yaw)
    bands = (
        (0.0, 1.16, False),
        (0.24, 1.0, False),
        (0.58, 0.88, True),
        (0.86, taper + 0.08, False),
        (1.0, taper, flat_cap),
    )
    rings = []
    for frac, sc, _ in bands:
        z = base_z + (top_z - base_z) * frac
        ring = []
        for k in range(sides):
            a = k * math.tau / sides
            rib = 1.0 + 0.11 * math.sin(5 * a + seed_phase) + 0.06 * math.cos(9 * a - seed_phase * 1.7)
            lx = math.cos(a) * rx * sc * rib
            ly = math.sin(a) * ry * sc * rib
            ring.append((bx + lx * ca - ly * sa, by + lx * sa + ly * ca, z))
        rings.append(ring)
    for b_idx in range(len(bands) - 1):
        r0, r1 = rings[b_idx], rings[b_idx + 1]
        z_mid = 0.5 * (r0[0][2] + r1[0][2])
        snow = bands[b_idx + 1][2] and (bands[b_idx + 1][0] - bands[b_idx][0] < 0.36) and flat_cap
        for k in range(sides):
            u = (k + 1) % sides
            quad_shaded(peaks, r0[k], r0[u], r1[u], r1[k], colour_fn, z_mid, snow=snow and (k % 2 == 0))
    top = rings[-1]
    apex = (bx, by, top_z + (8.0 if flat_cap else 38.0))
    for k in range(sides):
        u = (k + 1) % sides
        tri_shaded(peaks, top[k], top[u], apex, colour_fn, top_z, snow=flat_cap and (k % 3 == 0))
    return top
