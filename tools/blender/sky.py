"""The sky a map carries, as a picture worked out a direction at a time (no bpy here: `preview_sky.py` draws it to a
file without Blender, and `build_sky` in build_course.py paints it into a dome's vertices)."""
import math


def srgb(hex_: int):
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin((hex_ >> 16 & 255) / 255), lin((hex_ >> 8 & 255) / 255), lin((hex_ & 255) / 255), 1.0)


def smoothstep(a: float, b: float, v: float) -> float:
    t = max(0.0, min(1.0, (v - a) / (b - a)))
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def _lattice(ix: int, iy: int, seed: int) -> float:
    n = (ix * 374761393 + iy * 668265263 + seed * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0


def value_noise(x: float, y: float, seed: int = 0) -> float:
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b = _lattice(ix, iy, seed), _lattice(ix + 1, iy, seed)
    c, d = _lattice(ix, iy + 1, seed), _lattice(ix + 1, iy + 1, seed)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy


def fbm(x: float, y: float, octaves: int = 4, seed: int = 0) -> float:
    total, amp, norm = 0.0, 0.5, 0.0
    for o in range(octaves):
        total += amp * value_noise(x, y, seed + o)
        norm += amp
        x, y, amp = x * 2.03 + 11.7, y * 2.03 - 5.3, amp * 0.5
    return total / norm


def ramp(stops, t: float):
    """A colour from `stops` ((place, hex), ...) at `t`, in linear light."""
    t = max(stops[0][0], min(stops[-1][0], t))
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            return mix(srgb(c0), srgb(c1), (t - t0) / (t1 - t0))
    return srgb(stops[-1][1])


SKY_SUNWARD = ((0.0, 0xFFE08A), (0.12, 0xFFB040), (0.28, 0xFF7A2A), (0.46, 0xE0483A), (0.66, 0x9A3A6A), (0.84, 0x55357A), (1.0, 0x262250))
SKY_AWAY = ((0.0, 0xE9A9A4), (0.2, 0xC98AAA), (0.45, 0x8E6AA8), (0.7, 0x5A4A90), (1.0, 0x262250))


def sunset_sky_colour(dx: float, dy: float, dz: float, az: float, haze):
    """The colour of a sunset sky in one direction: the afterglow from the horizon up, hot towards the sun and mauve
    away from it, under a deck of broken cloud whose undersides the low sun lights red and gold, dark where it
    does not reach."""
    h = max(0.0, dz)
    toward = math.cos(math.atan2(dy, dx) - az)
    sunward = ((toward + 1) / 2) ** 1.3
    band = h ** 0.5
    air = mix(ramp(SKY_AWAY, band), ramp(SKY_SUNWARD, band), sunward)
    # The deck: cloud on a flat ceiling, in rows that run across the way to the sun, with gaps between the banks.
    k = 1.0 / (dz + 0.16)
    ux, uy = dx * k, dy * k
    ca, sa = math.cos(az), math.sin(az)
    along, across = ux * ca + uy * sa, -ux * sa + uy * ca
    banks = fbm(along * 0.5 + 3.1, across * 0.34 - 1.7, 3, 7)
    rows = fbm(along * 3.4, across * 1.5, 4, 21)
    puffs = fbm(along * 9.0 + 4.0, across * 5.5, 3, 40)
    density = smoothstep(0.36, 0.62, banks * 0.6 + rows * 0.4 + puffs * 0.14)
    # No cloud in the haze on the horizon; towards the sun a clear slot is left under the deck, where the sky burns.
    cover = density * smoothstep(0.015 + 0.05 * sunward, 0.07 + 0.1 * sunward, h)
    # Each puff's underside catches the sun and the gaps between them are in shade: the deck is mottled.
    belly = smoothstep(0.35, 0.7, puffs * 0.6 + rows * 0.5)
    lit = sunward ** 0.6 * (1 - smoothstep(0.18, 0.95, h)) * (0.45 + 0.75 * belly)
    fire = mix(mix(srgb(0xFF4A14), srgb(0xFF8A1E), belly), srgb(0xFFC860), (1 - density) ** 1.5 * 0.8)
    shade = mix(mix(srgb(0x9A5A78), srgb(0x5A3A5E), h ** 0.5), srgb(0x2A2038), 0.25 + density * 0.6)
    cloud = mix(shade, fire, min(1.0, lit * 1.25))
    c = mix(air, cloud, cover * 0.96)
    # The glow round the sun, and the haze along the horizon that the far land fades into.
    sx, sy, sz = math.cos(az) * 0.994, math.sin(az) * 0.994, 0.11
    near = max(0.0, dx * sx + dy * sy + dz * sz)
    g = near ** 40 * 0.5 * (1 - cover * 0.6) + near ** 6 * 0.08
    c = (c[0] + 1.0 * g, c[1] + 0.6 * g, c[2] + 0.25 * g, 1.0)
    c = mix(c, haze, math.exp(-11 * h) * 0.55 * (1 - 0.6 * sunward))
    return grade(c)


# The app draws the sky through its tone curve (AgX), which pales a bright colour: the picture is painted deeper
# and a little darker than it is to be seen, so that it comes out as the preview shows it.
SKY_DEPTH, SKY_GAIN = 1.75, 0.8


def grade(c):
    luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    return tuple(max(0.0, min(1.0, (luma + (v - luma) * SKY_DEPTH) * SKY_GAIN)) for v in c[:3]) + (1.0,)
