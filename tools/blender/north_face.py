"""Col du Granit's switchbacks and the glacier-scoured mountain beneath them."""
import math

from worldkit import lin


# Signed hairpin radii and station metres on the original race profile.
TURNS = ((1050, 35), (2370, -41), (3745, 34), (4960, -36), (6360, 33),
         (7690, -38), (9050, 41), (10370, -34), (11485, 33), (12590, -37),
         (13910, 43), (15190, -46))


def bearing(d):
    heading = 0.11 + 0.075 * math.sin(d / 195)
    for station, radius in TURNS:
        half = math.pi * abs(radius) / 2
        turn = min(1, max(0, (d - station + half) / (2 * half)))
        heading += math.copysign(math.pi - 0.20, radius) * turn
    return heading


def lay(course, theme, bc):
    rows, stages, length, mean, per_level = bc.lay_centre_line(course, theme)
    x = y = 0
    for row in rows:
        d = row["d"]
        h = bearing(d + bc.STEP / 2)
        row.update(x=x, y=y, h=bearing(d), k=bearing(d + .5) - bearing(d - .5))
        x += bc.STEP * math.cos(h)
        y += bc.STEP * math.sin(h)
    return rows, stages, length, mean, per_level


def land(road, col, theme, bc):
    # One continuous height field serves all the traverses. A cutting under every
    # carriageway keeps the uphill bank out of the rider's lane inside a hairpin.
    floor = bc.Builder("North face fells", "terrain")
    floor.colours = []
    rows = road.s
    def height(x, y):
        _, i, dist = road.tree.find((x, y, 0))
        p = rows[i]
        if dist < 15:
            return p['z'] - 1.2 - dist * .26
        sign = 1 if y > p['y'] else -1
        other = road.tree.find_range((x, y, 0), min(dist + 210, 320))
        across = [(s, j) for _, j, s in other if abs(rows[j]['d'] - p['d']) > 210 and (rows[j]['y']-y)*sign > 0]
        if across:
            s, j = min(across)
            t = dist / (s + dist)
            base = (1-t)*p['z'] + t*rows[j]['z']
        else:
            base = p['z'] + sign*(dist-15)*.55
        relief = min(1, (dist - 15)/48)
        return base - 4 + relief*(5*math.sin(x/24+y/51) + 9*math.sin(y/66-x/150))
    step = 11
    xs = range(int(min(s['x'] for s in rows))-215, int(max(s['x'] for s in rows))+220, step)
    ys = range(int(min(s['y'] for s in rows))-275, int(max(s['y'] for s in rows))+270, step)
    previous = None
    for y in ys:
        current = [(x, y, height(x,y)) for x in xs]
        if previous:
            for i, (left, right) in enumerate(zip(current,current[1:])):
                x, _, z = left
                noise = math.sin(x/33+y/17) + math.sin(x/13-y/19)
                tundra = 450 + 65*noise
                tone = (0x565F51 if noise < 0 else 0x65705B) if z<tundra else (0x777A79 if noise<0 else 0x868888)
                floor.quad(previous[i], previous[i+1], right, left)
                floor.colours.extend([lin(tone)]*4)
        previous = current
    floor.build(col)
    shoulders = bc.Builder("Crushed granite shoulders", "terrain")
    shoulders.colours = []
    for side in (-1,1):
        last = None
        for i,p in enumerate(rows):
            row = []
            for offset in (2.9,4.6,8,13):
                x,y,z = road.at(i,side*offset)
                row.append((x,y,z-.18 if offset<5 else height(x,y)+(.25 if offset==8 else -.3)))
            if last:
                for j in range(3):
                    corners = [last[j],row[j],row[j+1],last[j+1]]
                    shoulders.quad(*(corners if side==1 else corners[::-1]))
                    shoulders.colours.extend([lin(0x878781 if j==0 else 0x747976)]*4)
            last = row
    shoulders.build(col)
    stream = bc.Builder("Meltwater", "terrain")
    stream.colours = []
    drift = bc.Builder("Gully snowfields", "terrain")
    drift.colours = []
    for d in (6150, 9120, 11380, 13230, 14620):
        side = 1 if math.cos(bearing(d)) > 0 else -1
        for batch, start, end, span, tint in ((drift,18,97,5.9,0xD0D9E1),
                                                (stream,5,86,.88,0x7BBDC8)):
            last = None
            for reach in range(start, end+1):
                along = d+62 + 2.8*math.sin(reach/9)+.24*reach
                offset = side*reach
                width = span * (.8+.2*math.sin(reach/4))
                row = []
                for bank in (-1,1):
                    x,y,_ = road.pos(along+bank*width,offset)
                    row.append((x,y,height(x,y)+(1.9 if batch is stream else 1.55)))
                if last:
                    batch.quad(*last, row[1], row[0])
                    batch.colours.extend([lin(tint)]*4)
                last = row
    stream.build(col)
    drift.build(col)
    return None, height
