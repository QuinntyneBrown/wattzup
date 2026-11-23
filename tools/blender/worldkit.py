"""What the worlds that lay their own road and land share (cinqueterre.py, haleakala.py): colours for vertices, an
easing, and shapes painted into the land's group, which the app draws from much further off than the scenery."""

from __future__ import annotations

import math


def lin(hex_: int) -> tuple[float, float, float, float]:
    """A colour for a vertex: sRGB hex to linear, as build_course.srgb."""
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin((hex_ >> 16 & 255) / 255), lin((hex_ >> 8 & 255) / 255), lin((hex_ & 255) / 255), 1.0)


def smooth(a: float, b: float, v: float) -> float:
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


def lens(b, c, r: float, thick: float, rng, sides: int = 7) -> None:
    """A domed mound of leaves, flat underneath and wider than it is tall: an umbrella pine's crown, an olive's."""
    wob = [rng.uniform(0.82, 1.15) for _ in range(sides)]
    def ring(scale: float, up: float):
        return [(c[0] + math.cos(q * math.tau / sides) * r * wob[q] * scale, c[1] + math.sin(q * math.tau / sides) * r * wob[q] * scale, c[2] + up) for q in range(sides)]

    rim, shoulder = ring(1.0, 0.0), ring(0.62, thick * 0.72)
    top, bottom = (c[0], c[1], c[2] + thick), (c[0], c[1], c[2] - thick * 0.12)
    for q in range(sides):
        n = (q + 1) % sides
        b.quad(rim[q], rim[n], shoulder[n], shoulder[q])
        b.tri(top, shoulder[q], shoulder[n])
        b.tri(bottom, rim[n], rim[q])


class Painted:
    """Shapes coloured by vertex in the land's group, which is drawn from much further off than what stands by the
    road: a village is seen across its bay, an observatory from the switchbacks below."""

    def __init__(self, k, mat: str = "terrain"):
        # "peaks" is the group drawn whole, from any distance and without haze: what is always far off.
        self.b = k.B[mat]
        if self.b.colours is None:
            self.b.colours = []

    def face(self, points, colours) -> None:
        self.b.faces.append(tuple(self.b.v(p) for p in points))
        self.b.colours.extend(colours)

    def box(self, c, size, yaw: float, colour, foot: float = 0.72) -> None:
        """A box on its base centre, darker towards its foot; no underside."""
        hx, hy, h = size[0] / 2, size[1] / 2, size[2]
        cs, sn = math.cos(yaw), math.sin(yaw)
        lo = [(c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs, c[2]) for dx, dy in ((-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy))]
        hi = [(p[0], p[1], c[2] + h) for p in lo]
        dark = (colour[0] * foot, colour[1] * foot, colour[2] * foot, 1.0)
        for q in range(4):
            r = (q + 1) % 4
            self.face((lo[q], lo[r], hi[r], hi[q]), (dark, dark, colour, colour))
        self.face(hi, (colour,) * 4)

    def roof(self, c, along: float, across: float, rise: float, yaw: float, colour) -> None:
        """A low pitched roof on a box's top, its ridge along `along`, overhanging the walls a little."""
        cs, sn = math.cos(yaw), math.sin(yaw)

        def p(u, v, w):
            return (c[0] + u * cs - v * sn, c[1] + u * sn + v * cs, c[2] + w)

        a, d = along / 2 + 0.35, across / 2 + 0.35
        shade = (colour[0] * 0.82, colour[1] * 0.82, colour[2] * 0.82, 1.0)
        self.face((p(-a, d, 0), p(a, d, 0), p(a, 0, rise), p(-a, 0, rise)), (colour,) * 4)
        self.face((p(a, -d, 0), p(-a, -d, 0), p(-a, 0, rise), p(a, 0, rise)), (shade,) * 4)
        self.face((p(-a, -d, 0), p(-a, d, 0), p(-a, 0, rise)), (shade,) * 3)
        self.face((p(a, d, 0), p(a, -d, 0), p(a, 0, rise)), (colour,) * 3)

    def panel(self, corner, along, out, a0: float, a1: float, z0: float, z1: float, proud: float, colour) -> None:
        """A flat panel on a wall (a window, a shutter, a door): the wall runs from `corner` along the unit vector
        `along` and faces the unit vector `out`; the panel spans a0..a1 metres along it and z0..z1 up, standing
        `proud` of it."""
        def p(a, z):
            return (corner[0] + along[0] * a + out[0] * proud, corner[1] + along[1] * a + out[1] * proud, z)

        self.face((p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1)), (colour,) * 4)

    def tube(self, c, r0: float, r1: float, h: float, low, high, sides: int = 10, cap=None) -> None:
        """A round tower on its base centre: radius r0 at the foot and r1 at the top, `low` to `high` up its wall,
        closed with a flat top in `cap` if one is given."""
        ring = lambda r, up: [(c[0] + math.cos(q * math.tau / sides) * r, c[1] + math.sin(q * math.tau / sides) * r, c[2] + up) for q in range(sides)]  # noqa: E731
        lo, hi = ring(r0, 0.0), ring(r1, h)
        for q in range(sides):
            n = (q + 1) % sides
            self.face((lo[q], lo[n], hi[n], hi[q]), (low, low, high, high))
        if cap is not None:
            top = (c[0], c[1], c[2] + h)
            for q in range(sides):
                self.face((hi[q], hi[(q + 1) % sides], top), (cap,) * 3)

