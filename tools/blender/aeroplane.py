"""An airliner on its way in to land, for a map's sky: built about its own middle with its nose along +x and up +z,
some 37 m long. The app flies it (plane-flight.ts); the map only carries it. No bpy here: it adds faces to builders.

`B` maps "plane-body", "plane-tail", "plane-engine", "plane-window" (its skin) and "plane-red", "plane-green",
"plane-white" (its lights) to builders with `verts`, `faces`, `v`, `quad`, `tri` and `box`.
"""
import math

# The fuselage, nose to tail: (metres along, half its width, half its height, how far its middle is raised).
STATIONS = (
    (18.8, 0.06, 0.06, -0.35),
    (17.7, 0.85, 0.8, -0.25),
    (16.0, 1.55, 1.55, -0.08),
    (13.2, 1.98, 1.98, 0.0),
    (-6.0, 1.98, 1.98, 0.0),
    (-12.0, 1.62, 1.7, 0.3),
    (-16.4, 0.85, 1.0, 0.85),
    (-18.8, 0.14, 0.28, 1.3),
)
SIDES = 8


def _ring(x: float, ry: float, rz: float, lift: float):
    # Eight corners with a flat face each side, for the row of windows.
    return [(x, math.cos(a) * ry, lift + math.sin(a) * rz) for a in (math.pi / 8 + k * math.tau / SIDES for k in range(SIDES))]


def _slab(b, lower: list, thick_root: float, thick_tip: float) -> None:
    """A wing or a tailplane: `lower` is its underside's four corners (root front, root back, tip back, tip front),
    and it is `thick_root` deep at the root and `thick_tip` at the tip."""
    rf, rb, tb, tf = lower
    up = lambda p, t: (p[0], p[1], p[2] + t)  # noqa: E731
    urf, urb, utb, utf = up(rf, thick_root), up(rb, thick_root), up(tb, thick_tip), up(tf, thick_tip)
    for face in ((urf, utf, utb, urb), (rf, rb, tb, tf), (rf, tf, utf, urf), (rb, urb, utb, tb), (tf, tb, utb, utf)):
        b.quad(*face)
        b.quad(*reversed(face))


def _fin(b, base_front: float, base_back: float, top_front: float, top_back: float, foot: float, height: float, half: float = 0.18) -> None:
    for side in (half, -half):
        face = ((base_front, side, foot), (base_back, side, foot), (top_back, side * 0.4, foot + height), (top_front, side * 0.4, foot + height))
        b.quad(*(face if side > 0 else face[::-1]))
    b.quad((base_front, half, foot), (top_front, half * 0.4, foot + height), (top_front, -half * 0.4, foot + height), (base_front, -half, foot))
    b.quad((base_back, -half, foot), (top_back, -half * 0.4, foot + height), (top_back, half * 0.4, foot + height), (base_back, half, foot))
    b.quad((top_front, half * 0.4, foot + height), (top_back, half * 0.4, foot + height), (top_back, -half * 0.4, foot + height), (top_front, -half * 0.4, foot + height))


def build(B: dict) -> None:
    body, tail, engine, window = B["plane-body"], B["plane-tail"], B["plane-engine"], B["plane-window"]
    rings = [_ring(*station) for station in STATIONS]
    for a, b_ in zip(rings, rings[1:]):
        for k in range(SIDES):
            j = (k + 1) % SIDES
            body.quad(a[k], a[j], b_[j], b_[k])
    # The row of windows down each side, and the flight deck's.
    for side in (1, -1):
        y = side * (1.98 * math.cos(math.pi / 8) + 0.03)
        strip = ((13.4, y, 0.28), (-9.5, y, 0.28), (-9.5, y, 0.6), (13.4, y, 0.6))
        window.quad(*(strip if side > 0 else strip[::-1]))
        deck = ((16.9, side * 0.95, 0.42), (15.6, side * 1.5, 0.5), (15.6, side * 1.32, 1.0), (16.7, side * 0.8, 0.82))
        window.quad(*(deck if side > 0 else deck[::-1]))
    # The wings: swept back, rising to their tips, with a winglet; an engine slung under each.
    for side in (1, -1):
        root_front, root_back = (3.8, side * 1.7, -1.25), (-3.2, side * 1.7, -1.25)
        tip_front, tip_back = (-5.0, side * 17.0, 0.35), (-6.9, side * 17.0, 0.35)
        _slab(body, [root_front, root_back, tip_back, tip_front], 0.62, 0.16)
        winglet = ((-5.2, side * 17.0, 0.4), (-6.9, side * 17.0, 0.4), (-7.5, side * 17.5, 2.5), (-6.6, side * 17.5, 2.5))
        tail.quad(*winglet)
        tail.quad(*winglet[::-1])
        # The engine: a nacelle a little narrower at its back, its mouth dark, on a pylon.
        ey, ez = side * 5.7, -2.35
        front = [(4.9, ey + math.cos(a) * 1.12, ez + math.sin(a) * 1.12) for a in (k * math.tau / SIDES for k in range(SIDES))]
        back = [(0.6, ey + math.cos(a) * 0.8, ez + math.sin(a) * 0.8) for a in (k * math.tau / SIDES for k in range(SIDES))]
        for k in range(SIDES):
            j = (k + 1) % SIDES
            engine.quad(front[k], front[j], back[j], back[k])
        window.faces.append(tuple(window.v(p) for p in reversed(front)))
        window.faces.append(tuple(window.v(p) for p in back))
        _slab(body, [(4.0, ey - 0.12, ez + 0.9), (1.4, ey - 0.12, ez + 0.9), (1.4, ey + 0.12, ez + 0.9), (4.0, ey + 0.12, ez + 0.9)], 1.0, 1.0)
        # The tailplane.
        _slab(body, [(-14.3, side * 0.7, 0.95), (-17.2, side * 0.7, 0.95), (-18.3, side * 6.3, 1.25), (-17.1, side * 6.3, 1.25)], 0.3, 0.12)
    # The fin, in the airline's colour.
    _fin(tail, -11.8, -18.0, -17.4, -19.6, 1.55, 6.0)
    # Its lights: red on the left wing's tip, green on the right's, white at the tail, a red beacon under the belly,
    # and the landing lights in the wings' roots, on for the approach.
    B["plane-red"].box((-6.0, 17.2, 0.2), (1.1, 0.7, 0.7))
    B["plane-green"].box((-6.0, -17.2, 0.2), (1.1, 0.7, 0.7))
    B["plane-white"].box((-19.4, 0.0, 1.2), (0.8, 0.6, 0.6))
    B["plane-red"].box((1.0, 0.0, -2.5), (0.9, 0.9, 0.5))
    for side in (1, -1):
        B["plane-white"].box((3.9, side * 2.6, -1.3), (0.5, 0.9, 0.7))
