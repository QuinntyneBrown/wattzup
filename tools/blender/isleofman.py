"""The A18 rises to the Bungalow before descending toward Creg-ny-Baa and the sea."""
import math
import sys

from worldkit import Painted, lin, smooth

HEIGHTS = [(0, 182), (690, 218), (1810, 297), (2680, 337), (3540, 365),
           (3870, 373), (4420, 388), (5090, 363), (6100, 303), (7410, 253), (8133.333333, 237)]


def bearing(d):
    return (.08 + .29 * math.sin(d / 420) + .16 * math.sin(d / 193)
            + .93 * (smooth(6070, 6200, d) - smooth(6360, 6630, d))
            - .58 * smooth(6750, 7160, d))


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    mean = sum((s['to'] - s['from']) * s['level'] for s in stages) / length
    spans = []
    for (start, bottom), (end, top) in zip(HEIGHTS, HEIGHTS[1:]):
        intervals = []
        for stage in stages:
            a, b = max(stage['from'], start), min(stage['to'], end)
            if b > a:
                resistance = stage['level'] / mean
                weight = resistance if top > bottom else 1 / resistance
                intervals.append((a, b, weight))
        weighted_length = sum((b - a) * weight for a, b, weight in intervals)
        z = bottom
        for a, b, weight in intervals:
            grade = (top - bottom) * weight / weighted_length
            spans.append((a, b, z, grade))
            z += (b - a) * grade
    samples = []
    x = y = 0
    for i in range(math.ceil((length + bc.LEAD_IN + bc.RUN_OUT) / bc.STEP) + 1):
        d = i * bc.STEP - bc.LEAD_IN
        h = bearing(d)
        a, b, base, g = next((span for span in spans if d < span[1]), spans[-1])
        z = base + (max(a, min(d, b)) - a) * g
        samples.append(dict(d=d, x=x, y=y, z=z, h=h, k=bearing(d+.5)-bearing(d-.5), g=g*100))
        x += bc.STEP * math.cos(bearing(d + bc.STEP / 2))
        y += bc.STEP * math.sin(bearing(d + bc.STEP / 2))
    return samples, stages, length, mean, .25


def surface(road, stages, length, col, theme):
    bc = sys.modules[type(road).__module__]
    asphalt = bc.Builder('A18', 'asphalt')
    paint = bc.Builder('A18 markings', 'paint')
    for i, sample in enumerate(road.s[:-1]):
        def band(batch, left, right, up):
            batch.quad(road.at(i, right, up), road.at(i+1, right, up),
                       road.at(i+1, left, up), road.at(i, left, up))
        band(asphalt, 3.58, -3.58, .025)
        if math.floor(sample['d']/4) % 3 == 0:
            band(paint, .065, -.065, .039)
        for sign in (-1, 1):
            band(paint, sign*3.39+.053, sign*3.39-.053, .039)
    asphalt.build(col)
    paint.build(col)


def land(road, col, theme, bc):
    mesh = bc.Builder('Manx uplands', 'terrain')
    mesh.colours = []
    peak = road.pos(2900, 525)
    def height(x, y):
        _, j, distance = road.tree.find((x, y, 0))
        s = road.s[j]
        side = (x-s['x'])*-math.sin(s['h']) + (y-s['y'])*math.cos(s['h'])
        roll = 15*math.sin(x/430+y/250) + 6*math.sin(y/141-x/107)
        dome = 315*math.exp(-((x-peak[0])/890)**2-((y-peak[1])/435)**2)
        coast = smooth(6200, 7300, s['d'])*smooth(20, 1050, -side)
        return s['z'] - .65 + (roll+dome)*smooth(4, 154, distance) - coast*270
    # A fixed grid keeps the far shore and the summit stationary around bends.
    previous = []
    for y in range(-1600, 1950, 30):
        row = []
        for x in range(-650, 9360, 30):
            z = height(x, y)
            mix = .5+.24*math.sin(x/57 + y/71)+.15*math.sin(x/143-y/90)+.11*math.cos(x/35-y/37)
            low, high = lin(0x666D47), lin(0x95805F)
            color = tuple(v*(1-mix)+w*mix for v,w in zip(low, high))
            row.append(((x, y, z), color))
        if previous:
            for a,b,c,d in zip(previous, previous[1:], row[1:], row):
                mesh.quad(a[0], b[0], c[0], d[0])
                mesh.colours.extend((a[1],b[1],c[1],d[1]))
        previous = row
    for sign in (-1,1):
        for i in range(0,len(road.s)-2,2):
            quad = []
            for j, offset in ((i,3.56),(i+2,3.56),(i+2,8),(i,8)):
                x,y,z = road.at(j,sign*offset)
                quad.append((x,y,z-.07 if offset<4 else height(x,y)+.15))
            mesh.quad(*quad)
            mesh.colours.extend([lin(0x777953)]*4)
    return mesh.build(col), height


def scenery(k):
    art = Painted(k)
    # Rural field walls have battered bases and a coping course of upright slate.
    for start, end, side in ((-40,380,-1),(-40,270,1),(580,740,1),(1070,1270,-1)):
        for d in range(start,end,2):
            i = k.road.index(d)
            h = k.road.s[i]['h']
            for row in range(3):
                span = 1.94 if row < 2 else .94
                for n in range(1 if row < 2 else 2):
                    station = d + n + (.48 if row == 1 else 0)
                    p = k.road.pos(station,side*(4.02+.04*row),row*.29-.17)
                    art.box(p,(span,.62-row*.09,.31+k.rng.random()*.10),h,
                            lin(k.rng.choice((0x736F60,0x91877A,0x787B66,0x827967))))
    return {'efforts':0}


THEME = {'lay':lay, 'surface_builder':surface, 'land_builder':land,
         'road_half_width':3.58,'terrain':{'sea':False},'land':{'mid':0x697850},
         'sky':[0xD7DFDC,0xC6D0D0,0xADBFC7,0x8199A9,0x6D8495],
         'light':[0xF1E8CE,1.54],'fill':[0xCDD9DF,0x898875],
         'haze':0xC4CFCF,'sun_altitude':.29,'sun_azimuth':-.93,
         'palette':{'asphalt':0x4C4E4C,'paint':0xE4E1D5}}
