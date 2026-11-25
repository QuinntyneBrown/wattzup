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
    # Ease the first and last 10 m of the bend so the wheel and view meet it continuously.
    d = (distance + STRAIGHT / 2) % (LAP / 2) - STRAIGHT
    into = max(0.0, min(1.0, d / 10.0, (HALF_TURN - d) / 10.0))
    return math.radians(12 + 30 * into * into * (3 - 2 * into))


def point(d, across, up=0):
    x, y, heading = pose(d)
    z = up + (across + 1.1) * math.tan(banking(d))
    return x + across * math.sin(heading), y - across * math.cos(heading), z


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    count = math.ceil((bc.LEAD_IN + length + bc.RUN_OUT) / bc.STEP) + 1
    samples = []
    for i in range(count):
        d = i * bc.STEP - bc.LEAD_IN
        x, y, heading = pose(d)
        samples.append(dict(x=x, y=y, z=point(d, 0)[2], h=heading, k=0, g=0, d=d))
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
        for j in range(100):
            d = j * 2.5 + (row % 4) * 0.6
            colour = k.rng.choice(pine)
            strip(d, d + 2.5, left, left + 0.2, colour)
            if row % 3 == 0:
                strip(d+0.015, d+2.49, left, left+0.012, lin(0xA98B62), 0.008)
    dark, red, blue = lin(0x262B2C), lin(0xB03A37), lin(0x33568A)
    for j in range(160):
        d, e = j * LAP / 160, (j + 1) * LAP / 160
        for left, right, colour in [(-2.6, -0.85, lin(0x449EBF)), (-0.1, 0, dark),
                                    (1.05, 1.15, red), (3.55, 3.65, blue)]:
            strip(d, e, left, right, colour, 0.025)
        # Safety deck, barrier panels and seating risers rise beyond the banking.
        for row in range(7):
            inner = 8.2 + row * 0.95
            def seat(m, off):
                x, y, _ = point(m, off)
                return x, y, point(m, 8)[2] + 1.1 + row * 0.52
            a, c = seat(d, inner), seat(e, inner)
            b.face((a, seat(d, inner+0.94), seat(e, inner+0.94), c), (lin(0x657370),) * 4)
            b.face((a, c, (c[0],c[1],c[2]-0.5), (a[0],a[1],a[2]-0.5)), (lin(0x465757),) * 4)
        a, c = point(d, 8), point(e, 8)
        board = [0xEDEDE4,0x167A70,0xD9DFD2,0x336C88][(j//5)%4]
        b.face((a, (a[0],a[1],a[2]+1.05), (c[0],c[1],c[2]+1.05), c), (lin(board),)*4)
    for d in (0, LAP / 2):
        strip(d - 0.07, d + 0.07, -0.85, 3.7, red, 0.05)
    # Flat infield, visible from the opposite straight. The apron meets the floor on its inside.
    b.box((0, 0, -1.8), (132, 90, 1.5), 0, lin(0x8EA2A0))
    # The independent roof span leaves sightlines across the infield clear.
    for x in range(-64, 65, 8):
        for y in (-43, 43):
            b.box((x, y, -0.6), (0.45, 0.6, 16), 0, lin(0x919C92))
        b.box((x, 0, 15), (0.36, 87, 0.54), 0, lin(0x83938D))
        for y in (-31, -15, 0, 15, 31):
            b.box((x, y, 14.7), (1.4, 0.6, 0.22), 0, lin(0xFFFBE6))
    # Ceiling has an underside facing the camera.
    b.face(((-72,-46,16),(-72,46,16),(72,46,16),(72,-46,16)), (lin(0xB7C1BA),)*4)
    return {"efforts": 0}
