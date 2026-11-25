"""One reusable timber oval for GCN's Olympic Pursuit Efforts; all lengths are metres."""

import math
from worldkit import Painted, lin

LAP = 250.0
RADIUS = 22.0
STRAIGHT = (LAP - math.tau * RADIUS) / 2
HALF_TURN = math.pi * RADIUS


def pose(distance):
    """Position and tangent on the measurement line, starting halfway down the home straight."""
    d = (distance + STRAIGHT / 2) % LAP
    if d < STRAIGHT:
        return d - STRAIGHT / 2, -RADIUS, 0.0
    d -= STRAIGHT
    if d < HALF_TURN:
        angle = d / RADIUS
        return STRAIGHT / 2 + RADIUS * math.sin(angle), -RADIUS * math.cos(angle), angle
    d -= HALF_TURN
    if d < STRAIGHT:
        return STRAIGHT / 2 - d, RADIUS, math.pi
    angle = math.pi + (d - STRAIGHT) / RADIUS
    return -STRAIGHT / 2 + RADIUS * math.sin(angle), -RADIUS * math.cos(angle), angle


def banking(distance):
    # Centre the periodic phase on each bend. The 29 m transition spans the tangent
    # point equally on either side, so both straights and the finish seam stay smooth.
    bend_centre = STRAIGHT / 2 + HALF_TURN / 2
    phase = (distance - bend_centre + LAP / 4) % (LAP / 2) - LAP / 4
    into = max(0.0, min(1.0, (HALF_TURN / 2 + 14.5 - abs(phase)) / 29.0))
    return math.radians(12 + 30 * into * into * (3 - 2 * into))


def point(d, across, up=0):
    x, y, heading = pose(d)
    z = up + 1.2 + across * math.tan(banking(d))
    return x + across * math.sin(heading), y - across * math.cos(heading), z


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    count = math.ceil((bc.LEAD_IN + length + bc.RUN_OUT) / bc.STEP) + 1
    samples = []
    for i in range(count):
        d = i * bc.STEP - bc.LEAD_IN
        x, y, heading = pose(d)
        samples.append(dict(x=x, y=y, z=point(d, 0)[2], h=heading, k=0, g=0, d=d, bank=math.degrees(banking(d))))
    mean = sum(s["level"] * (s["to"]-s["from"]) for s in stages) / length
    return samples, stages, length, mean, 0


def surface(road, stages, length, col, theme):
    """The single lap is built in scenery; the race centre line traverses it for the whole plan."""
    pass


def land(road, col, theme, bc):
    return None, lambda x, y: 0


THEME = {
    "lay": centre_line, "surface_builder": surface, "land_builder": land,
    "sky": [0xD2D9D8, 0xDFE5E4, 0xE0E5E4, 0xD9E0DF, 0xDCE3E2], "haze": 0xE9EFEF,
    "light": [0xFFF9EB, 1.55], "fill": [0xF4F2EA, 0xD0CBBC], "sun_altitude": 0.88,
    "land": {"mid": 0x849695}, "terrain": {"sea": False},
    "chunks": {"Land": 999},  # One permanent bowl at every lap and draw distance.
}


def scenery(k):
    b = Painted(k)
    pine = [lin(c) for c in (0xD7B47D, 0xD9B982, 0xDCBE89, 0xD2AF7B, 0xDEC293, 0xD3B17B)]
    def strip(d, e, left, right, colour, up=0):
        b.face((point(d, left, up), point(e, left, up), point(e, right, up), point(d, right, up))[::-1], (colour,) * 4)

    # Individual timber lengths have staggered butt joints and narrow darker seams.
    for row in range(44):
        left = -0.85 + row * 0.2
        colour = k.rng.choice(pine)
        for j in range(250):
            # Every board shares its neighbour’s boundary samples, including in the transition.
            if (j + row) % 4 == 0:
                colour = k.rng.choice(pine)
            strip(j, j + 1, left, left + 0.2, colour)
    dark, red, blue = lin(0x262B2C), lin(0xB03A37), lin(0x33568A)
    for j in range(250):
        d, e = j, j + 1
        for left, right, colour in [(-2.6, -0.85, lin(0x449EBF)), (-0.1, 0, dark),
                                    (1.05, 1.15, red), (3.55, 3.65, blue)]:
            strip(d, e, left, right, colour, 0.025)
        # Safety deck, barrier panels and seating risers rise beyond the banking.
        for row in range(7):
            inner = 8.2 + row * 0.95
            def seat(m, off):
                x, y, _ = point(m, off)
                return x, y, 9.1 + row * 0.52
            a, c = seat(d, inner), seat(e, inner)
            b.face((a, seat(d, inner+0.94), seat(e, inner+0.94), c), (lin(0x657370),) * 4)
            b.face((a, c, (c[0],c[1],c[2]-0.5), (a[0],a[1],a[2]-0.5)), (lin(0x465757),) * 4)
        a, c = point(d, 8), point(e, 8)
        board = [0xEDEDE4,0x167A70,0xD9DFD2,0x336C88][(j//5)%4]
        b.face((a, (a[0],a[1],a[2]+1.05), (c[0],c[1],c[2]+1.05), c), (lin(board),)*4)
    for d in (0, LAP / 2):
        strip(d - 0.07, d + 0.07, -0.85, 3.7, red, 0.05)
    # Flat infield, visible from the opposite straight. The apron meets the floor on its inside.
    b.box((0, 0, -2.1), (132, 90, 0.55), 0, lin(0x8EA2A0))
    # The independent roof span leaves sightlines across the infield clear.
    for x in range(-64, 65, 8):
        for y in (-43, 43):
            b.box((x, y, -0.6), (0.45, 0.6, 16), 0, lin(0x919C92))
        b.box((x, 0, 15), (0.36, 87, 0.54), 0, lin(0x83938D))
        for y in (-31, -15, 0, 15, 31):
            b.box((x, y, 14.7), (1.4, 0.6, 0.22), 0, lin(0xFFFBE6))
    # Ceiling has an underside facing the camera.
    b.face(((-72,-46,16),(-72,46,16),(72,46,16),(72,-46,16)), (lin(0xB7C1BA),)*4)
    dress_arena(k, b)
    return {"efforts": 0}


def dress_arena(k, b):
    """The infield, arena enclosure, ringside spectators and overhead fixtures."""
    cream, teal, steel = lin(0xEDE9D9), lin(0x31888A), lin(0x80908C)
    charcoal, rubber = lin(0x354446), lin(0x272C2F)
    for side in (-1, 1):
        # Broad clerestory glazing above warm timber battens on each long wall.
        y = side * 44
        b.box((0, y, -1.6), (143, 0.48, 18), 0, lin(0xD7C5A1))
        for x in range(-68, 69, 4):
            b.box((x, y - side * 0.28, 10.9), (3.8, 0.10, 3.05), 0, lin(0xB9D4D1))
            for slat in (-1.5, -0.5, 0.5, 1.5):
                b.box((x + slat, y - side * 0.27, 2), (0.12, 0.08, 8.7), 0, lin(0xBA9F79))
        b.box((side * 70, 0, -1.6), (0.55, 88, 18), 0, lin(0xCDC2A9))
        # Team pens and benches sit beside the home and back straight, inside the safety apron.
        for x in (-22, -10, 2, 14):
            py = side * 11
            b.box((x, py, -1.55), (9.8, 4.8, 0.10), 0, lin(0x6E8F91))
            b.box((x, py + 2.34, -1.45), (9.7, 0.13, 1.06), 0, teal)
            b.box((x + 4.8, py, -1.45), (0.13, 4.7, 1.05), 0, cream)
            b.box((x, py + 1.65, -0.9), (6, 0.48, 0.12), 0, cream)
            k.person((x-2.6, py, -1.45), side*math.pi/2, ["crowd-1", "crowd-4"])
            for j in range(2):
                track_bike(b, x + j * 1.65, py-0.45, -1.45, teal)
        # Compact officials’ desk and timing cabinets on the infield.
        b.box((side*12, 1, -1.55), (3.2, 1.15, 0.94), 0, cream)
        b.box((side*12, 1.05, -0.5), (0.91, 0.11, 0.55), 0, charcoal)
    # The official's brass lap bell hangs on the infield side of the home pursuit mark.
    x, y = 1.3, -18.6
    brass, lip = lin(0xA07232), lin(0xE7BF64)
    b.box((x, y, -1.55), (0.2, 0.2, 4.25), 0, charcoal)
    b.box((x+0.40, y, 2.59), (0.94, 0.13, 0.16), 0, charcoal)
    b.tube((x+0.77, y, 2.29), 0.11, 0.07, 0.31, brass, brass, 12, lip)
    b.tube((x+0.77, y, 1.93), 0.31, 0.11, 0.36, lip, brass, 12)
    b.tube((x+0.77, y, 1.84), 0.075, 0.06, 0.15, charcoal, brass, 8, brass)
    # Hangers and backing frames for the active timing faces, mirrored at both ends.
    for side in (-1, 1):
        x, y = side * 39, -side * 18
        b.box((x+side*0.18, y, 5.0), (0.30, 13.40, 4.82), 0, charcoal)
        for delta in (-5.2, 5.2):
            b.box((x, y+delta, 9.72), (0.13, 0.13, 6.28), 0, steel)
    colours = [lin(c) for c in (0x1C7776, 0x42638C, 0xC56F56, 0xEAE4D0, 0xEAB85F)]
    skins = [lin(c) for c in (0x99684F, 0xC39A75, 0x9F765F)]
    for row in range(6):
        for j in range(210):
            if k.rng.random() < 0.38:
                continue
            d = (j + 0.5 * (row % 2)) * LAP / 210
            x, y, _ = point(d, 8.5 + row * 0.95)
            base = 9.1 + row * 0.52
            yaw = pose(d)[2]
            b.box((x, y, base + 0.06), (0.38, 0.37, 0.38), yaw, charcoal)
            shirt = k.rng.choice(colours)
            b.tube((x, y, base + 0.43), 0.19, 0.24, 0.47, shirt, shirt, 5)
            skin = k.rng.choice(skins)
            b.tube((x, y, base + 0.91), 0.12, 0.10, 0.25, skin, skin, 6, skin)
    # Rainbow bands read from the opposite straight; gaps preserve the arena's place colours.
    for start in (5, 62, 130, 187):
        for j in range(15):
            d = start+j
            for stripe, colour in enumerate((0x3978B0, 0xB9433F, 0x343638, 0xD7B443, 0x57885F)):
                z = 0.24 + stripe*0.12
                a,c,e,f = point(d,7.97,z), point(d+1,7.97,z), point(d+1,7.97,z+0.12), point(d,7.97,z+0.12)
                b.face((a,f,e,c), (lin(colour),)*4)
    # Large lights in cross-braced roof bays and suspended glass timing boards on the straights.
    for x in range(-60, 61, 8):
        for y in range(-36, 37, 9):
            b.box((x, y, 14.12), (1.6, 0.65, 0.4), 0, charcoal)
            b.face(((x-0.72,y-0.26,14.1),(x-0.72,y+0.26,14.1),(x+0.72,y+0.26,14.1),(x+0.72,y-0.26,14.1)), (cream,)*4)


def track_bike(b, x, y, z, paint):
    """A side view of a pursuit bike on a stand, with deep rims and an open front wheel."""
    for wheel in (-0.51, 0.51):
        for n in range(10):
            angles = (math.tau*n/10, math.tau*(n+1)/10)
            pts = [(x+wheel+radius*math.cos(angle), y, z+0.36+radius*math.sin(angle))
                   for radius, angle in [(0.34,angles[0]),(0.34,angles[1]),(0.22,angles[1]),(0.22,angles[0])]]
            b.face(pts, (lin(0x283035),)*4)
            b.face(pts[::-1], (lin(0x283035),)*4)
    for a,c in [((-0.51,.36),(-.18,.86)), ((-.18,.86),(.06,.38)), ((.06,.38),(-.51,.36)),
                ((-.18,.86),(.4,.79)), ((.4,.79),(.06,.38)), ((.4,.79),(.51,.36))]:
        pts=[(x+a[0],y,z+a[1]),(x+c[0],y,z+c[1]),(x+c[0],y,z+c[1]+.055),(x+a[0],y,z+a[1]+.055)]
        b.face(pts, (paint,)*4)
        b.face(pts[::-1], (paint,)*4)
