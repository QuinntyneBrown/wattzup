"""Riegelmann Boardwalk course and fixed Atlantic shore landmarks."""
import math

from worldkit import Painted, lin


def gradient(distance):
    return .003 * math.sin(distance / 310) * math.cos(distance / 870 + 1)


def elevation(distance):
    # Integral of the original Coney Island rolling grade, anchored at sea level plus four metres.
    height = 4
    for frequency, phase in ((1/310 + 1/870, 1), (1/310 - 1/870, -1)):
        height += .0015 * (math.cos(phase) - math.cos(frequency * distance + phase)) / frequency
    return height


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    samples = []
    for i in range(math.ceil((bc.LEAD_IN + length + bc.RUN_OUT) / bc.STEP) + 1):
        d = i * bc.STEP - bc.LEAD_IN
        samples.append(dict(x=0, y=d, z=elevation(d), h=math.pi/2, k=0, g=100*gradient(d), d=d))
    mean = sum((stage['to'] - stage['from']) * stage['level'] for stage in stages) / length
    return samples, stages, length, mean, 0


def deck(road, stages, length, collection, bc):
    # Timber foundation beneath the original textured riding surface.
    timber = bc.Builder('Boardwalk deck', 'wood')
    for i in range(len(road.s) - 1):
        timber.quad(road.at(i, 10, -.18), road.at(i, -14, -.18),
                    road.at(i+1, -14, -.18), road.at(i+1, 10, -.18))
    timber.build(collection)


def shore(road, collection, theme, bc):
    beach = bc.Builder('Atlantic shore', 'sand')
    for i in range(len(road.s) - 1):
        beach.quad(road.at(i, 72, -3), road.at(i, 10, -1.6),
                   road.at(i+1, 10, -1.6), road.at(i+1, 72, -3))
    return beach.build(collection), lambda x, y: elevation(y) - 2


THEME = dict(lay=lay, road_builder=deck, land_builder=shore, road_half_width=3.5,
             terrain={'sea': False}, land={'mid': 0xe8d8b4}, haze=0xd8e2ea,
             sky=[0xe2eaef, 0xbfd8eb, 0x8ec4ea, 0x75afd9, 0x689ac7],
             light=[0xfff2dc, 3.0], fill=[0xc6e1f3, 0xc9bfae],
             sun_azimuth=3.5, sun_altitude=.74)


def steel(art, a, b, radius, tint, sides=6):
    """One straight hollow-looking rail section in the same baked batch as the footings."""
    dx, dy, dz = (b[j]-a[j] for j in range(3))
    span = math.hypot(dx, dy)
    length = math.hypot(span, dz)
    if not length:
        return
    nx, ny = (-dy/span, dx/span) if span else (1, 0)
    vx, vy, vz = -ny*dz/length, nx*dz/length, span/length
    ring = []
    for j in range(sides):
        angle = math.tau*j/sides
        c, s = radius*math.cos(angle), radius*math.sin(angle)
        ring.append((c*nx+s*vx, c*ny+s*vy, s*vz))
    for j, normal in enumerate(ring):
        other = ring[(j+1) % sides]
        quad = [tuple(v+w for v,w in zip(point, offset))
                for point,offset in ((a,normal),(a,other),(b,other),(b,normal))]
        art.face(quad, [tint]*4)


def thunderbolt(art):
    # Orange twin running rails and white columns distinguish the steel coaster from the Cyclone.
    base_y = 2720
    foot = elevation(base_y)
    orange, white = lin(0xde6132), lin(0xe8e5db)
    path = [(0, 3), (9, 5), (14, 14), (15, 31), (18, 36), (21, 37),
            (24, 35), (25, 26), (26, 13), (29, 5), (35, 3)]
    for j in range(1, 41):
        t = math.tau * j / 40
        path.append((35 + 12*math.sin(t) + 8*j/40, 3 + 12*(1-math.cos(t))))
    path.extend([(53, 4), (64, 11), (72, 11), (83, 4), (97, 2)])
    for i, ((u, h), (v, k)) in enumerate(zip(path, path[1:])):
        for side in (-.85, .85):
            steel(art, (31+side, base_y+u, foot+h), (31+side, base_y+v, foot+k), .18, orange)
        steel(art, (30.1, base_y+u, foot+h), (31.9, base_y+u, foot+h), .11, white)
        if i % 4 == 0:
            steel(art, (34, base_y+u, foot), (31, base_y+u, foot+h-.24), .35, white)
            art.box((34, base_y+u, foot-.2), (1.6,1.6,.6), 0, lin(0x9c9892))


def scenery(kit):
    art = Painted(kit, 'peaks')
    thunderbolt(art)
    sand = lin(0xdeca9c)
    # Steeplechase Pier extends beyond the seaward rail, carried by paired pile bents.
    pier_y = 4420
    deck_z = elevation(pier_y)
    art.box((-97, pier_y, deck_z-.5), (173, 7, .5), 0, lin(0x998371))
    for x in range(-182, -11, 4):
        for side in (-1, 1):
            y = pier_y + side*3.1
            art.box((x, y, deck_z-5), (.38, .38, 6.1), 0, lin(0x667575))
            art.box((x+2, y, deck_z+1.02), (4.1, .10, .11), 0, lin(0x769690))
    # Sand beneath the far end tapers into the surf.
    art.box((-61, pier_y, deck_z-2.7), (24, 65, .12), 0, sand)
    return {'efforts': 0}
