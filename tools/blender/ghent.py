"""The Kuipke, Ghent's 166 m indoor six-day track; all lengths are metres."""

import math
from worldkit import Painted, lin

LAP = 166.0
RADIUS = 15.0
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
    # Centre the periodic phase on each bend. The 18 m transition spans the tangent
    # point equally on either side, so both straights and the finish seam stay smooth.
    bend_centre = STRAIGHT / 2 + HALF_TURN / 2
    phase = (distance - bend_centre + LAP / 4) % (LAP / 2) - LAP / 4
    into = max(0.0, min(1.0, (HALF_TURN / 2 + 9 - abs(phase)) / 18.0))
    return math.radians(13 + 39 * into * into * (3 - 2 * into))


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
    "lay": centre_line, "surface_builder": surface, "land_builder": land, "sample_step": 2,
    "sky": [0x342A23] * 5, "haze": 0x685344,
    "light": [0xFFE2AD, 1.6], "fill": [0xFFE7C2, 0x8F7769], "sun_altitude": 0.84,
    "land": {"mid": 0x342A23}, "terrain": {"sea": False}, "chunks": {"Land": 999},
}


def scenery(k):
    b = Painted(k)
    def strip(d, e, left, right, colour, lift=0):
        corners = [point(d, left, lift), point(e, left, lift),
                   point(e, right, lift), point(d, right, lift)]
        b.face(corners[::-1], (lin(colour),) * 4)
    timbers = [0xBD8E5D, 0xB88B58, 0xCA9F6C, 0xC39763, 0xD1AA77, 0xC69B6D]
    for row in range(51):
        left = -.36 + row * .12
        colour = k.rng.choice(timbers)
        for d in range(166):
            if (d + row * 3) % 6 == 0:
                colour = k.rng.choice(timbers)
            strip(d, d + 1, left, left + .12, colour)
    for d in range(166):
        for left, right, colour in [(-1.5,-.36,0x4298C4),(-.05,.03,0x242224),
                                    (.82,.91,0xCE3228),(3.1,3.18,0x345A8B)]:
            strip(d, d+1, left, right, colour, .021)
        # Inward facing vertical boards follow the track, including its pitch transitions.
        a, c = point(d,5.8), point(d+1,5.8)
        tone = lin([0xB3372B,0xF4D49C,0x304B5E,0xD9BA6B][(d//5)%4])
        b.face((a,(a[0],a[1],a[2]+1.12),(c[0],c[1],c[2]+1.12),c),(tone,)*4)
        for row in range(7):
            inner = 6.1 + .88 * row
            def seat(m, off):
                x,y,z = point(m, off)
                return x,y,point(m,5.8)[2]+1.22+row*.52
            a,c = seat(d,inner),seat(d+1,inner)
            b.face((a,seat(d,inner+.88),seat(d+1,inner+.88),c),(lin(0x58473F),)*4)
            b.face((a,c,(c[0],c[1],c[2]-.52),(a[0],a[1],a[2]-.52)),(lin(0x302628),)*4)
    strip(-.13,.13,-.36,5.75,0xF3E8CE,.035)
    strip(-.034,.034,-.36,5.75,0x282527,.042)
    b.box((0,0,-1.09),(103,71,.52),0,lin(0x93785C))
    for side in (-1,1):
        b.box((0,side*31,-1),(99,.35,19),0,lin(0x362C2C))
        b.box((side*48,0,-1),(.4,63,19),0,lin(0x453735))
    b.face(((-50,-33,18),(-50,33,18),(50,33,18),(50,-33,18)),(lin(0x695D54),)*4)
    steel, light = lin(0x594D47), lin(0xFFF3D0)
    for x in range(-44,45,8):
        for h in (14.1,16.0):
            b.box((x,0,h),(.25,63,.22),0,steel)
        for i,y in enumerate(range(-30,30,3)):
            z0,z1 = (14.3,16) if i%2==0 else (16,14.3)
            b.face(((x,y,z0),(x,y+3,z1),(x,y+3,z1+.14),(x,y,z0+.14)),(steel,)*4)
        for y in (-21,-11,11,21):
            b.box((x,y,13.82),(2.3,.9,.30),0,lin(0x443B38))
            for dx in (-.62,0,.62):
                b.box((x+dx,y,13.73),(.48,.71,.12),0,light)
    # Cafés flank the riders’ cabins. High tables carry amber glasses and white beer heads.
    floor = -.57
    wood, brass = lin(0x663B2D), lin(0xD4A95B)
    for side in (-1,1):
        for x in range(-20,22,7):
            y = side*5.2
            b.box((x,y,floor),(5.3,1.35,1.28),0,wood)
            b.box((x,y,floor+1.28),(5.5,1.5,.14),0,brass)
            for j in range(3):
                tx,ty=x+1.65*j-1.65, y+side*(2.55+j%2)
                b.tube((tx,ty,floor),.18,.085,1.15,wood,wood,8)
                b.tube((tx,ty,floor+1.15),.60,.60,.09,wood,brass,12,brass)
                for n in (-.15,.16):
                    b.tube((tx+n,ty,floor+1.24),.055,.074,.17,brass,brass,8)
                    b.tube((tx+n,ty,floor+1.41),.074,.073,.035,light,light,8,light)
                k.person((tx+.57,ty,floor),side*.9,["crowd-1","crowd-4"])
    return {"laps": int(k.length // LAP), "efforts": 0}
