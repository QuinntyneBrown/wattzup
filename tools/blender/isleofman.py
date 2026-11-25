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
    asphalt = bc.Builder('Road', 'asphalt')
    paint = bc.Builder('RoadPaint', 'paint')
    for i, sample in enumerate(road.s[:-1]):
        def band(batch, left, right, up):
            batch.quad(road.at(i, right, up), road.at(i+1, right, up),
                       road.at(i+1, left, up), road.at(i, left, up))
        # Adjacent strips share their edges, so quantisation cannot bury white paint in asphalt.
        for left,right,material in ((3.58,3.45,asphalt),(3.45,3.33,paint),(3.33,.085,asphalt),
                                    (.085,-.085,paint if math.floor(sample['d']/4)%3==0 else asphalt),
                                    (-.085,-3.33,asphalt),(-3.33,-3.45,paint),(-3.45,-3.58,asphalt)):
            band(material,left,right,.025)
    asphalt.build(col)
    paint.build(col)


def land(road, col, theme, bc):
    mesh = bc.Builder('Manx uplands', 'terrain')
    mesh.colours = []
    peak = road.pos(3180, 820)
    def height(x, y):
        _, j, distance = road.tree.find((x, y, 0))
        s = road.s[j]
        side = (x-s['x'])*-math.sin(s['h']) + (y-s['y'])*math.cos(s['h'])
        roll = 15*math.sin(x/430+y/250) + 6*math.sin(y/141-x/107)
        dome = (621.65-s['z']-roll)*math.exp(-((x-peak[0])/740)**2-((y-peak[1])/395)**2)
        coast = smooth(6200, 7300, s['d'])*smooth(20, 590, -side)
        coast = max(coast, smooth(8100, 9100, x))
        return s['z'] - .65 + (roll+dome)*smooth(4, 154, distance) - coast*290
    # A fixed grid keeps the far shore and the summit stationary around bends.
    previous = []
    for y in range(-1600, 1950, 30):
        row = []
        for x in range(-650, 9360, 30):
            _, _, nearest = road.tree.find((x, y, 0))
            z = height(x, y) - 11 * (1 - smooth(25, 69, nearest))
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
        offsets=(3.56, 5, 9, 16, 27, 40, 55, 72)
        for i in range(0,len(road.s)-2,2):
            for inner,outer in zip(offsets, offsets[1:]):
                quad = []
                for j, offset in ((i,inner),(i+2,inner),(i+2,outer),(i,outer)):
                    x,y,z = road.at(j,sign*offset)
                    quad.append((x,y,z-.075 if offset<4 else height(x,y)+.10))
                mesh.quad(*quad)
                mesh.colours.extend([lin(0x737951 if outer<12 else 0x7A7854)]*4)
    return mesh.build(col), height


def scenery(k):
    art = Painted(k)
    # Rural field walls have battered bases and a coping course of upright slate.
    for start, end, side in ((-40,380,-1),(-40,270,1),(580,740,1),(1070,1270,-1)):
        for row in range(4):
            d=start-row*.16
            while d < end:
                length=k.rng.uniform(.36,.79) if row<3 else k.rng.uniform(.22,.37)
                angle=k.road.s[k.road.index(d)]['h'] + k.rng.uniform(-.08,.08)
                base=k.road.pos(d+length*.5,side*(4.12 + k.rng.uniform(-.08,.08)),row*.235-.1)
                tint=lin(k.rng.choice((0x716D64,0x898478,0x817D71,0x7C7A6A)))
                art.box(base,(length-.017,.58-.057*row,k.rng.uniform(.22,.29)),angle,tint)
                d+=length
    from isleofman_landmarks import add
    add(k,art)
    return {'efforts':0}


THEME = {'lay':lay, 'surface_builder':surface, 'land_builder':land,
         'road_half_width':3.58,'terrain':{'sea':False},'land':{'mid':0x697850},
         'sky':[0xD7DFDC,0xC6D0D0,0xADBFC7,0x8199A9,0x6D8495],
         'light':[0xF1E8CE,1.54],'fill':[0xCDD9DF,0x898875],
         'haze':0xC4CFCF,'sun_altitude':.29,'sun_azimuth':-.93,
         'palette':{'asphalt':0x4C4E4C,'paint':0xE4E1D5}}
