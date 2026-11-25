"""Sellaronda Bike Day. The road and larch meadows from Selva to Passo Gardena."""
import math
import random
from worldkit import Painted, lin

PROFILE=((0, 1615), (710, 1650), (1440, 1685), (2310, 1740), (3180, 1798), (4030, 1857), (4910, 1921), (5430, 1959), (6330, 2014), (7130, 2060), (8010, 2098), (8760, 2121), (8975, 2121))

def elevation(distance):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if distance <= b:
            return low + (high-low)*max(0,(distance-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    heading=.97+.12*math.sin(d/285)
    for station,change,width in ((580,.56,80),(1120,-.93,76),(1690,2.58,42),(2330,-2.55,49),
        (3570,1.42,75),(4020,-1.71,62),(4850,2.65,42),(5500,-2.72,40),(6090,2.65,44),
        (6760,-2.58,49),(7390,.81,64),(7940,-.81,81)):
        heading+=change*(1+math.tanh((d-station)/width))/2
    return heading


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    rows = []
    x = y = 0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        h = bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),
                         k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def surface(d,l):
    edge=max(0,abs(l)-5.8)
    fade=max(0,min(1,(d-165)/230,(8660-d)/230))
    return -.12+fade*(-.23*l*math.cos(bearing(d)-1)*min(1,edge/10)+min(edge*.08,4.6)*math.sin(d/50+l/24))+max(0,edge-38)*(1-fade)*.12


def strip(batch,r,i,a,b,h0,h1,k0,k1,tone):
    pts=[r.at(i,b,k0),r.at(i,a,h0),r.at(i+1,a,h1),r.at(i+1,b,k1)]
    batch.faces.append(tuple(batch.v(p) for p in pts))
    batch.colours.extend([lin(tone)]*4)


def road(r,st,length,col,bc):
    tar=bc.Builder('SS243 bitumen','gardena-tarmac')
    markings=bc.Builder('White Italian edge and centre lines','terrain')
    tar.colours=[];markings.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,k in ((-4.1,0,.006,.095),(0,4.1,.095,.006)):
            strip(tar,r,i,a,b,h,h,k,k,0x555354)
        for left in (-3.97,3.84):
            strip(markings,r,i,left,left+.13,.025,.025,.025,.025,0xe3e2d6)
        if i%3==1:
            strip(markings,r,i,-.08,.08,.105,.105,.105,.105,0xdad8ca)
    tar.build(col);markings.build(col)


def land(r,col,theme,bc):
    grass=bc.Builder('Alpine pasture','gardena-pasture');grass.colours=[]
    rock=bc.Builder('Dolomite talus','gardena-scree');rock.colours=[]
    lanes=(-160,-97,-56,-33,-18,-9.4,-4.1,4.1,9.4,18,33,56,97,160)
    def row(i):
        d = r.s[i]['d']
        # Inside a switchback the upper cutting must meet the lower slope between
        # the two arms. Extending both full-width strips covers the lower tarmac.
        limits = {}
        for side in (-1, 1):
            limit = 160
            for radius in range(10, 161, 4):
                x, y, _ = r.at(i, side * radius)
                _, other, distance = r.tree.find((x, y, 0))
                if abs(r.s[other]['d'] - d) > 55 and distance < radius - 1:
                    limit = radius - 2
                    break
            limits[side] = limit
        points = []
        for lateral in lanes:
            side = 1 if lateral > 0 else -1
            offset = side * min(abs(lateral), limits[side])
            x, y, z = r.at(i, offset, surface(d, offset))
            if abs(offset) == limits[side] and limits[side] < 160:
                neighbours = r.tree.find_range((x, y, 0), limits[side] + 9)
                adjacent = [(dist, j) for _, j, dist in neighbours if abs(r.s[j]['d'] - d) > 55]
                if adjacent:
                    _, other = min(adjacent)
                    z = (r.s[i]['z'] + r.s[other]['z']) * 0.5
            points.append((x, y, z))
        return points
    a=row(0)
    for i in range(1,len(r.s)):
        c=row(i);d=r.s[i]['d']
        for j,l in enumerate(lanes[:-1]):
            if l==-4.1:continue
            pasture=abs(l)>8 and not (d>2900 and abs(l)>47 and math.sin(d/380+l/43)>.83)
            tone=0x839c48 if pasture else 0xa6a396
            batch=grass if pasture else rock
            batch.faces.append(tuple(batch.v(v) for v in (a[j+1],a[j],c[j],c[j+1])));batch.colours.extend([lin(tone)]*4)
        a=c
    grass.build(col);rock.build(col);return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']



def scenery(k):
    r=k.road;art=Painted(k);rng=random.Random(2124)
    def box(d,l,z,w,dep,h,t):
        art.box(r.pos(d,l,z),(w,dep,h),bearing(d),lin(t))
    # Rough hewn lower logs, narrow foundations and wide eaves on individual hay barns.
    for d,l,w,dep in ((142,18,11,7),(422,-23,12,8),(1498,-13,9,6),(1528,23,12,7),
                       (2720,27,9,6),(3770,-29,10,7),(5210,-24,9,7),(6260,26,11,7),(7300,-29,8,5)):
        root=surface(d,l)
        box(d,l,root-.42,w,dep,1.16,0xb8af94)
        box(d,l,root+.74,w,dep,3.35,0x624e39)
        for side in (-1,1):
            for j in range(8):
                box(d,l+side*dep/2,root+.77+j*.42,w+.24,.13,.12,0x705b41)
        art.roof(r.pos(d,l,root+4.05),w+1.8,dep+1.5,2.3,bearing(d),lin(0x66594f))
    # Three roadside rifugi with stone lower floors and projecting wooden balconies.
    for d,l,w,dep,h in ((8813,-18,23,11,7.9),(8846,22,29,13,9.2),(8903,-28,31,13,9.2)):
        box(d,l,-.31,w,dep,h,0xdbcbab)
        art.roof(r.pos(d,l,h-.31),w+1.35,dep+1.25,3.25,bearing(d),lin(0x866553))
        for side in (-1,1):
            for floor in (2.4,5.1):
                box(d,l+side*(dep*.5+.48),floor,w,.98,.2,0x69533e)
                box(d,l+side*(dep*.5+.98),floor+.68,w,.12,.22,0x795f42)
                for off in range(-int(w/2)+1,int(w/2),2):
                    box(d+off,l+side*(dep*.5+.98),floor+.1,.14,.14,.73,0x72573c)
    # Fence rails follow the same local meadow surface as their post feet.
    for start,end,side in ((1180,1720,-1),(2950,3400,1),(4880,5150,-1),(6900,7300,1)):
        for d in range(start,end,4):
            l=side*6.3;z=surface(d,l)
            box(d,l,z-.20,.17,.18,1.2,0x745d41)
            for up in (.39,.81):box(d+2,l,z+up,4.02,.12,.11,0x967a55)
    for d in range(580,8580,32):
        for side in (-1,1):
            l=side*4.9;box(d,l,-.17,.18,.22,.92,0xf0ede1)
            box(d,l,.57,.20,.24,.18,0xa34331 if side<0 else 0x464840)
    for d in range(8660,8900,10):box(d,12.4,-.095,6,.12,.03,0xe6ddce)
    return {'efforts':0}

THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=4.1,terrain={'sea':False},
           land={'mid':0x799748},sky=[0xd1e4ef,0x9ed1ee,0x74b4e4,0x5596d1,0x3e81c2],haze=0xbed7df,
           palette={'asphalt':0x58585a,'sea':0x7c9366},light=[0xfff3d8,3.3],fill=[0xd6eafa,0x84936c],
           sun_azimuth=-.86,sun_altitude=.83)
