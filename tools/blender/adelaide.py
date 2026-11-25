"""McLaren Vale vine rows and Hahndorf stonework, baked into spatial chunks for the Willunga road."""

import math

from worldkit import Painted, lin, lens

THEME = {
    "sky": [0xCFDFE6, 0xB7D9ED, 0x90C3EC, 0x67A9E0, 0x4586CA],
    "haze": 0xD9E2DF, "light": [0xFFF3DA, 3.5], "fill": [0xC8DEEC, 0x89704B],
    "sun_altitude": 0.88, "sun_azimuth": -1.2,
    "palette": {"asphalt": 0x515052, "sand": 0xB39A77, "promenade": 0xCEB88D},
    "land": {"low": 0xD1B978, "mid": 0xAC975B, "high": 0xC2A768, "rock": 0x918469},
    "terrain": {"sea": False, "rise": 22}, "edge": "verge", "centre": "white",
    "kerbs": False, "grade": {"perLevel": 1, "roll": 0.45, "rollWave": 750},
    "chunks": {"Land": 2}, "reach": 1050,
}


def scenery(k):
    land = Painted(k)
    wall, roof = lin(0xC7AD88), lin(0x53666A)
    leaf, shade, bark = lin(0x78844F), lin(0x435D3C), lin(0xAD9A77)
    # real-03/04/06: trellises recede up the rolling slopes; vine skirts stay open beneath the wire.
    for i in range(k.road.index(65), k.n - 6, 8):
        yaw = k.s[i]["h"]
        for side in (-1, 1):
            for row in range(5):
                off = side * (13 + row * 4.1)
                if not k.room(i, off, 7):
                    continue
                x, y, _ = k.P(i, 0, off)
                z = k.ground(x, y, i, off)
                land.box((x, y, z + 0.55), (k.step * 6.7, 1.25, 1.02), yaw, k.rng.choice((leaf, shade)))
                for along in (-k.step * 2.7, k.step * 2.7):
                    px, py, _ = k.P(i, along, off)
                    land.box((px, py, z - 0.15), (0.16, 0.16, 2), yaw, bark)
    # real-02/13: open eucalypt crowns on forked pale limbs, with gaps onto the vineyards.
    for i in range(k.road.index(22), k.n - 3, 19):
        off = k.rng.choice((-1, 1)) * k.rng.uniform(6.4, 10.2)
        if not k.room(i, off, 4):
            continue
        x, y, _ = k.P(i, 0, off)
        z = k.ground(x, y, i, off)
        h = k.rng.uniform(5.8, 9.8)
        k.prism(k.B["gum-bark"], (x, y, z - 1), 0.46, h, 6, top_r=0.21)
        for dx, dy in ((-1.8, 0.8), (1.6, 1.2), (0.3, -1.6)):
            # A five-sided tapered branch from the trunk to this crown.
            ring = [(math.cos(j * math.tau / 5), math.sin(j * math.tau / 5)) for j in range(5)]
            base = [(x + u * 0.23, y + v * 0.23, z + h * 0.55) for u, v in ring]
            tip = [(x + dx + u * 0.12, y + dy + v * 0.12, z + h) for u, v in ring]
            for j in range(5):
                n = (j + 1) % 5
                k.B["gum-bark"].quad(base[j], base[n], tip[n], tip[j])
            lens(k.B["gum-leaf"], (x + dx, y + dy, z + h), k.rng.uniform(2.4, 3.8), 1.7, k.rng)
    # real-07/14/15: sandstone walls under corrugated roofs, a slender steeple above the opening.
    for distance, side in ((36, -1), (63, 1), (95, -1), (145, 1)):
        i = k.road.index(distance)
        off = side * 13
        x, y, _ = k.P(i, 0, off)
        z, yaw = k.ground(x, y, i, off), k.s[i]["h"]
        land.box((x, y, z - 0.8), (11, 5.5, 5), yaw, wall)
        land.roof((x, y, z + 4.2), 12, 6.6, 2.3, yaw, roof)
        if distance == 36:
            tx, ty, _ = k.P(i, -5, off)
            land.box((tx, ty, z), (3.5, 3.5, 8.5), yaw, wall)
            k.cone(k.B["gum-roof"], (tx, ty, z + 8.5), 2.6, 6, 4)
        else:
            vx, vy, _ = k.P(i, 0, off - 4 * side)
            land.roof((vx, vy, z + 2.7), 11, 3.2, 0.7, yaw, roof)
            for along in (-4.5, 0, 4.5):
                px, py, _ = k.P(i, along, off - 5 * side)
                land.box((px, py, z - 0.4), (0.14, 0.14, 3.2), yaw, wall)
    return {"efforts": 0}


MATERIALS = {
    "gum-bark": {"color": 0xD3C5A9, "rough": 1},
    "gum-leaf": {"color": 0x6D8064, "rough": 0.95},
    "gum-roof": {"color": 0x535C5C, "rough": 0.8},
}
