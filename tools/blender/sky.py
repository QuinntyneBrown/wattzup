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
# Away from the sun: the earth's own shadow lies blue-grey along the horizon, and over it the pink band of the last
# light, before the violet of the coming night.
SKY_AWAY = ((0.0, 0x66688E), (0.2, 0x74699A), (0.33, 0xE38CA4), (0.5, 0xA06CA8), (0.72, 0x5A4A90), (1.0, 0x262250))


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
    thick = banks * 0.6 + rows * 0.4 + puffs * 0.14
    density = smoothstep(0.36, 0.62, thick)
    # No cloud in the haze on the horizon; towards the sun a clear slot is left under the deck, where the sky burns.
    cover = density * smoothstep(0.012 + 0.018 * sunward, 0.04 + 0.04 * sunward, h)
    # Each puff's underside catches the sun and the gaps between them are in shade: the deck is mottled.
    belly = smoothstep(0.35, 0.7, puffs * 0.6 + rows * 0.5)
    # The sun reaches a bank's thin edges and not its heart: the banks are dark, rimmed with fire.
    heart = smoothstep(0.5, 0.68, thick)
    lit = sunward ** 0.6 * (1 - smoothstep(0.18, 0.95, h)) * (0.45 + 0.75 * belly) * (1 - 0.85 * heart)
    fire = mix(mix(srgb(0xFF4A14), srgb(0xFF8A1E), belly), srgb(0xFFC860), (1 - density) ** 1.5 * 0.8)
    shade = mix(mix(srgb(0x9A5A78), srgb(0x5A3A5E), h ** 0.5), srgb(0x2A2038), 0.25 + density * 0.6)
    shade = mix(shade, srgb(0x3A1E3A), heart * 0.7 * sunward)
    cloud = mix(shade, fire, min(1.0, lit * 1.25))
    c = mix(air, cloud, cover * 0.96)
    # The glow round the sun, and the haze along the horizon that the far land fades into.
    sx, sy, sz = math.cos(az) * 0.994, math.sin(az) * 0.994, 0.11
    near = max(0.0, dx * sx + dy * sy + dz * sz)
    g = near ** 40 * 0.5 * (1 - cover * 0.6) + near ** 6 * 0.08
    # Its corona: what was a disc behind the sun is in the sky's own picture, and fades with no edge.
    g += near ** 240 * 0.55 + near ** 14 * 0.16 * (1 - cover * 0.5)
    c = (c[0] + 1.0 * g, c[1] + 0.6 * g, c[2] + 0.25 * g, 1.0)
    # Shafts of light: the sun, behind the banks on the horizon, throws rays up through the gaps between them and
    # their shadows between the rays, fanned out from where it stands and fading as they climb.
    turn = math.atan2(dy, dx) - az
    off = math.remainder(turn, math.tau) * math.cos(min(1.2, math.asin(max(-1.0, min(1.0, dz)))))
    rise = math.asin(max(-1.0, min(1.0, dz))) - math.asin(sz)
    spread = math.hypot(off, rise)
    if 0.02 < spread < 1.2 and rise > -0.06:
        fan = math.atan2(rise, off)
        shaft = value_noise(fan * 3.2 + 20.0, 0.0, 61) * 0.7 + value_noise(fan * 7.0 + 3.0, 0.0, 62) * 0.3
        reach = smoothstep(0.05, 0.22, spread) * math.exp(-spread * 1.5) * (1 - cover * 0.45)
        ray = (smoothstep(0.38, 0.66, shaft) - 0.45) * reach
        c = (c[0] * (1 + 0.95 * ray) + 0.1 * max(0.0, ray), c[1] * (1 + 0.8 * ray) + 0.05 * max(0.0, ray), c[2] * (1 + 0.45 * ray), 1.0)
    c = mix(c, haze, math.exp(-24 * h) * 0.5 * (1 - 0.6 * sunward))
    return grade(c)


# The app draws the sky through its tone curve (AgX), which pales a bright colour: the picture is painted deeper
# and a little darker than it is to be seen, so that it comes out as the preview shows it.
SKY_DEPTH, SKY_GAIN, SKY_CONTRAST = 1.75, 0.85, 1.45


def grade(c):
    # Its darks deeper too: the curve lifts them, and a bank of cloud would come out as pale as the sky behind it.
    c = tuple(max(0.0, v) ** SKY_CONTRAST for v in c[:3])
    luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    return tuple(max(0.0, min(1.0, (luma + (v - luma) * SKY_DEPTH) * SKY_GAIN)) for v in c[:3]) + (1.0,)
