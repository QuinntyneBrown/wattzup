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


def scenery(kit):
    art = Painted(kit, 'peaks')
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
