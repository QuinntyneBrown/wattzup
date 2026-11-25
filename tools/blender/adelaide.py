"""McLaren Vale vine rows and Hahndorf stonework, baked into spatial chunks for the Willunga road."""

import math

from worldkit import Painted, lin

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
                # Broken lobes along the trimmed crown, shaded low where the leaves overlap.
                previous = None
                for n in range(7):
                    along = k.step * (n - 3)
                    px, py, _ = k.P(i, along, off)
                    base = k.ground(px, py, i, off)
                    top = base + k.rng.uniform(1.45, 1.95)
                    normal = (-math.sin(yaw), math.cos(yaw))
                    ring = [(px + normal[0] * w, py + normal[1] * w, height)
                            for w, height in [(-0.48, base + 0.5), (-0.7, top - 0.36),
                                              (0.04, top), (0.62, top - 0.23), (0.46, base + 0.51)]]
                    if previous:
                        for face in range(4):
                            c = k.rng.choice((leaf, lin(0x6F8843), lin(0x849747)))
                            palette = (shade, shade, c, c) if face in (0, 3) else (c,) * 4
                            land.face((previous[face], ring[face], ring[face+1], previous[face+1]), palette)
                    previous = ring
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
            canopy(k, land, x + dx, y + dy, z + h)
        for strip in range(5):
            bearing = k.rng.uniform(0, math.tau)
            bx, by = x + math.cos(bearing) * 0.36, y + math.sin(bearing) * 0.36
            foot = z + k.rng.uniform(0, h / 2)
            land.face(((bx-0.07,by,foot), (bx+0.07,by,foot+0.1), (bx+0.02,by+0.06,foot+1.5)),
                      (lin(0x968776), lin(0xD7C7B2), lin(0xEEE5D5)))
    # real-07/14/15: sandstone walls under corrugated roofs, a slender steeple above the opening.
    for distance, side in ((115, -1), (43, 1), (69, -1), (165, 1)):
        i = k.road.index(distance)
        off = side * 13
        x, y, _ = k.P(i, 0, off)
        z, yaw = k.ground(x, y, i, off), k.s[i]["h"]
        land.box((x, y, z - 0.8), (11, 5.5, 5), yaw, wall)
        land.roof((x, y, z + 4.2), 12, 6.6, 2.3, yaw, roof)
        # Recessed glazing, lintels, door and individual sandstone courses on the road-facing wall.
        front = off - 2.78 * side
        for along in (-4.1, -2.05, 0, 2.05, 4.1):
            for height, width, tall, colour in [(0.91, 1.17, 1.87, 0xDDC7A6),
                                                (1.02, 0.99, 1.62, 0x384C4B),
                                                (1.78, 1.01, 0.075, 0xE1D1B4)]:
                wx, wy, _ = k.P(i, along, front - (height-0.9)*0.08*side)
                land.box((wx, wy, z+height), (width, 0.07, tall), yaw, lin(colour))
        for row in range(9):
            for block in range(13):
                along = -5.2 + (block + 0.5 * (row % 2)) * 0.8
                if abs(along) > 5.4 or (1 < row * 0.42 < 2.85 and abs(along % 2.05 - 1.0) > 0.42):
                    continue
                bx, by, _ = k.P(i, along, front + 0.015 * side)
                land.box((bx, by, z+row*0.42), (0.75, 0.045, 0.37), yaw,
                         lin(k.rng.choice((0xC8AD87, 0xBCA481, 0xBCA080, 0xCEB890))))
        if distance == 115:
            tx, ty, _ = k.P(i, -5, off)
            land.box((tx, ty, z), (3.5, 3.5, 8.5), yaw, wall)
            k.cone(k.B["gum-roof"], (tx, ty, z + 8.5), 2.6, 8.5, 4)
            for front_along in (-6.78, -3.22):
                px, py, _ = k.P(i, front_along, off)
                land.box((px, py, z + 5.2), (0.07, 1.05, 2.25), yaw, lin(0x4D5048))
                for louvre in range(8):
                    land.box((px, py, z+5.3+louvre*0.24), (0.12, 1.02, 0.07), yaw, wall)
        else:
            vx, vy, _ = k.P(i, 0, off - 4 * side)
            land.roof((vx, vy, z + 2.7), 11, 3.2, 0.7, yaw, roof)
            for along in (-4.5, 0, 4.5):
                px, py, _ = k.P(i, along, off - 5 * side)
                land.box((px, py, z - 0.4), (0.14, 0.14, 3.2), yaw, wall)
    # The expo seen ahead at 320 m also dresses the final approach to the climb.
    for distance in (365, k.length - 2950, k.length - 180):
        expo(k, land, distance)
    ridges_and_grass(k, land)
    road_signs(k, land)
    gulf(k, land)
    return {"efforts": 0}


MATERIALS = {
    "gum-bark": {"color": 0xD3C5A9, "rough": 1},
    "gum-leaf": {"color": 0x6D8064, "rough": 0.95},
    "gum-roof": {"color": 0x535C5C, "rough": 0.8},
}


def expo(k, land, distance):
    """The yellow inflatable bicycle and orange expo canopy in real-11/12."""
    i = k.road.index(distance)
    yaw = k.s[i]["h"]
    orange, gold = lin(0xF36E22), lin(0xFFC833)
    silver, rubber = lin(0xBFC2BE), lin(0x373838)
    road_side = k.half + 1.4
    def at(along, off, up):
        x, y, _ = k.P(i, along, off)
        return (x, y, k.ground(x, y, i, off) + up)

    roof = at(0, -road_side - 3.5, 2.85)
    land.roof(roof, 9, 5.6, 1.55, yaw, orange)
    for along in (-4.3, 0, 4.3):
        for off in (-road_side - 5.8, -road_side - 1.1):
            land.box(at(along, off, -0.2), (0.13, 0.13, 3.3), yaw, silver)
    # The inflatable is a side-on bicycle pitched towards the approach.
    cx, cy, cz = at(2, road_side + 6, 0)
    facing = yaw - 0.68
    def bike(u, v, h):
        return (cx + u * math.cos(facing) - v * math.sin(facing),
                cy + u * math.sin(facing) + v * math.cos(facing), cz + h)

    for centre in (-2.4, 2.4):
        for j in range(22):
            a, b = j * math.tau / 22, (j + 1) * math.tau / 22
            for t in range(6):
                ring = []
                for phi, theta in ((a, t), (b, t), (b, t + 1), (a, t + 1)):
                    th = theta * math.tau / 6
                    r = 1.8 + 0.34 * math.cos(th)
                    ring.append(bike(centre + r * math.cos(phi), 0.34 * math.sin(th), 2.12 + r * math.sin(phi)))
                land.face(ring, (gold,) * 4)
    for a, b in [((-2.4, 2.12), (-1.1, 4.9)), ((-1.1, 4.9), (0, 2.12)),
                 ((0, 2.12), (-2.4, 2.12)), ((0, 2.12), (1.65, 4.8)),
                 ((1.65, 4.8), (-1.1, 4.9)), ((1.65, 4.8), (2.4, 2.12))]:
        length = math.hypot(b[0] - a[0], b[1] - a[1])
        du, dh = (a[1] - b[1]) / length * 0.22, (b[0] - a[0]) / length * 0.22
        for j in range(6):
            corners = []
            for (u, h), n in ((a, j), (b, j), (b, j + 1), (a, j + 1)):
                angle = n * math.tau / 6
                corners.append(bike(u + du * math.cos(angle), 0.22 * math.sin(angle), h + dh * math.cos(angle)))
            land.face(corners, (orange,) * 4)

    # Fans in sun hats, shaded skin under the brim, T-shirts and two separate legs.
    shirts = [lin(c) for c in (0xD1412A, 0x2293AB, 0xF9EFDC, 0xEEA324, 0x558E55)]
    skins = [lin(c) for c in (0xAC7857, 0x82533D, 0xDFAD83)]
    for side in (-1, 1):
        for j in range(28):
            along = -26 + j * 1.85 + k.rng.uniform(-0.4, 0.4)
            off = (road_side + k.rng.uniform(0.3, 1.1)) * side
            x, y, z = at(along, off, 0)
            shirt, skin = k.rng.choice(shirts), k.rng.choice(skins)
            for step in (-0.12, 0.12):
                land.box(at(along + step, off, -0.08), (0.15, 0.2, 0.89), yaw, rubber)
            land.tube((x, y, z + 0.79), 0.19, 0.25, 0.59, shirt, shirt, 6)
            land.tube((x, y, z + 1.38), 0.14, 0.115, 0.27, skin, skin, 6, skin)
            if j % 3:
                straw = lin(0xDEC390)
                land.tube((x, y, z + 1.6), 0.27, 0.15, 0.09, straw, straw, 8, straw)
                land.tube((x, y, z + 1.67), 0.15, 0.13, 0.1, straw, straw, 7, straw)
        for along in range(-29, 31, 3):
            off = road_side * side
            land.box(at(along, off, 0), (0.06, 0.07, 1.12), yaw, silver)
            land.box(at(along + 1.5, off, 0.91), (3, 0.07, 0.08), yaw, silver)
        # A white camper with a darker window band, wheels and a blue esky outside.
        off = (road_side + 8) * side
        land.box(at(12, off, 0.38), (5.8, 2.3, 2.45), yaw, lin(0xF2EEE2))
        for delta in (-1.85, 1.85):
            land.box(at(12 + delta, off, 0), (0.75, 2.33, 0.68), yaw, rubber)
        land.box(at(12.4, off - 1.16 * side, 1.5), (3.7, 0.05, 0.73), yaw, lin(0x556D78))
        land.box(at(10, off - 2.2 * side, 0), (0.6, 0.41, 0.4), yaw, lin(0x307F9A))


def road_signs(k, land):
    """Australian yellow diamond warning signs beside the white edge line (real-01)."""
    for distance in range(100, int(k.length), 290):
        i = k.road.index(distance)
        off = k.half + 1.6
        ground = k.road.at(i, off)
        land.box(ground, (0.07, 0.07, 2.2), k.s[i]["h"], lin(0x919385))
        for depth, r, colour in [(0, 0.71, 0x443B29), (-0.02, 0.65, 0xEBC347)]:
            vertices = [k.P(i, depth, off + lateral, 2.12 + h)
                        for lateral, h in ((0, r), (r, 0), (0, -r), (-r, 0))]
            land.face(vertices[::-1], (lin(colour),) * 4)


def gulf(k, land):
    """Gulf St Vincent beyond the western paddocks, with a pale headland breaking the horizon."""
    cx, cy, span = k.centre()
    edge = cx - span - 350
    z = min(p["z"] for p in k.s) - 6
    sea, haze = lin(0x77AEB8), lin(0xBFCFD0)
    land.face([(edge, cy + span * 2, z), (edge - 2400, cy + span * 2, z),
               (edge - 2400, cy - span * 2, z), (edge, cy - span * 2, z)], (sea, haze, haze, sea))


def canopy(k, land, x, y, z):
    """Overlapping open sprays, blue-grey in shade and sage on the sun-facing crown."""
    for spray in range(8):
        bearing = k.rng.uniform(0, math.tau)
        reach = k.rng.uniform(0.4, 2.7)
        cx, cy = x + math.cos(bearing) * reach, y + math.sin(bearing) * reach
        cz = z + k.rng.uniform(-0.3, 1.5)
        radius = k.rng.uniform(1.15, 2.1)
        rim = []
        for j in range(11):
            angle = j * math.tau / 11
            r = radius * k.rng.uniform(0.69, 1.13)
            rim.append((cx + r * math.cos(angle), cy + r * math.sin(angle), cz + k.rng.uniform(-0.55, 0.2)))
        for j in range(len(rim)):
            a, b = rim[j], rim[(j + 1) % len(rim)]
            top, shade = lin(0x829372), lin(0x425B48)
            edge = lin(k.rng.choice((0x687E60, 0x81906E, 0x60775A)))
            land.face((a, b, (cx, cy, cz + 0.96)), (edge, shade, top))
            land.face((b, a, (cx, cy, cz - 0.45)), (shade, edge, shade))


def ridges_and_grass(k, land):
    """Low broken ridges, broad paddocks and close tufts at three distinct scales."""
    horizon = Painted(k, "peaks")
    cx, cy, extent = k.centre()
    floor = min(p["z"] for p in k.s) - 17
    for band in (0, 1):
        last = None
        for j in range(161):
            angle = j * math.tau / 160
            radius = extent + 380 + band * 380
            height = 88 + 42 * math.sin(angle * 6.0 + band) + 25 * math.cos(angle * 11)
            height += 10 * math.sin(angle * 19.0 + band) + band * 75
            # A saddle west of the road leaves a sightline across the gulf.
            height *= 1 - 0.93 * max(0.0, -math.cos(angle))**14
            x, y = cx + radius * math.cos(angle), cy + radius * math.sin(angle)
            pair = ((x, y, floor), (x, y, floor + height))
            if last:
                base, top = (lin(0xABAA83), lin(0x93987A)) if band == 0 else (lin(0xACC0B6), lin(0xAAB8B0))
                horizon.face((pair[0], last[0], last[1], pair[1]), (base, base, top, top))
            last = pair
    for i in range(4, k.n - 3, 3):
        for side in (-1, 1):
            off = side * k.rng.uniform(k.half + 1.4, k.half + 4.5)
            x, y, _ = k.P(i, 0, off)
            z = k.ground(x, y, i, off)
            for blade in range(5):
                a = k.rng.uniform(0, math.tau)
                dx, dy = math.cos(a), math.sin(a)
                land.face(((x-dy*0.11, y+dx*0.11, z-0.02), (x+dy*0.11, y-dx*0.11, z-0.02),
                           (x+dx*0.19, y+dy*0.19, z+k.rng.uniform(0.24, 0.55))),
                          (lin(0x978348), lin(0xA99551), lin(0xD4BF75)))
