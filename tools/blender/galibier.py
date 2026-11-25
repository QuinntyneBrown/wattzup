"""The Galibier road above Plan Lachat, with an open summit fork above the tunnel."""
import math
import random
from worldkit import Painted, lin

PROFILE=((0, 1700), (1420, 1756), (3100, 1818), (4930, 1895), (6720, 1971), (8450, 2025), (10270, 2102), (11520, 2160), (13890, 2260), (15770, 2342), (18420, 2454), (20100, 2494), (22360, 2541), (24000, 2590), (25820, 2642), (26050, 2642))

def elevation(distance):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if distance <= b:
            return low + (high-low)*max(0,(distance-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    heading=.76+.14*math.sin(d/510)
    for station,change,width in ((970,-.68,125),(2530,1.52,104),(3890,-1.61,85),(5540,2.42,52),
        (6840,-2.69,43),(7910,2.70,43),(9350,-2.45,48),(11250,.84,90),(12440,-.94,92),
        (14600,2.58,48),(16120,-2.53,47),(18190,.45,110),(18545,-1.03,72),(19770,2.62,40),
        (21260,-2.78,47),(22640,1.38,77),(23910,-1.58,81),(24950,.95,76)):
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
    if d<390 or d>25740 or 22190<d<22470:return -.11+max(0,edge-34)*.085
    # Across each traverse the same geographic side drops into the valley.
    across=l*math.cos(bearing(d)-.6)
    slope=.58 if 21800<d<24700 else .27
    if 18370<d<18640 and l>0:return -.11+max(0,edge-37)*.24
    return -.11+edge*(slope if across<0 else -slope)+min(edge*.045,3)*math.sin(d/70+l/16)


def strip(batch,r,i,a,b,h0,h1,k0,k1,tone):
    pts=[r.at(i,b,k0),r.at(i,a,h0),r.at(i+1,a,h1),r.at(i+1,b,k1)]
    batch.faces.append(tuple(batch.v(p) for p in pts))
    batch.colours.extend([lin(tone)]*4)


def road(r,st,length,col,bc):
    tar=bc.Builder('Passstrasse bitumen','galibier-tarmac')
    markings=bc.Builder('Swiss road markings','terrain')
    tar.colours=[];markings.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,k in ((-4.1,0,.006,.095),(0,4.1,.095,.006)):
            strip(tar,r,i,a,b,h,h,k,k,0x555354)
        for left in ((-3.97,3.84) if i%6!=4 else ()):
            strip(markings,r,i,left,left+.13,.025,.025,.025,.025,0xe3e2d6)
        if i%4==1 and r.s[i]["d"]<15300:
            strip(markings,r,i,-.08,.08,.105,.105,.105,.105,0xdad8ca)
    tar.build(col);markings.build(col)


def land(r,col,theme,bc):
    grass=bc.Builder('Alpine pasture','galibier-pasture');grass.colours=[]
    rock=bc.Builder('Granite slope','galibier-scree');rock.colours=[]
    snow=bc.Builder('Snow patches','galibier-snow');snow.colours=[]
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
            pasture=d+780*math.sin(d/245+l/20)<14300 and abs(l)>6
            drift=d>16600 and abs(l)>8 and math.sin(d/180+l/32)>.62
            tone=0xe5e5df if drift else 0x797e4e if pasture else 0x8c8982
            batch=snow if drift else grass if pasture else rock
            batch.faces.append(tuple(batch.v(v) for v in (a[j+1],a[j],c[j],c[j+1])));batch.colours.extend([lin(tone)]*4)
        a=c
    grass.build(col);rock.build(col);snow.build(col);return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']



def scenery(k):
    r=k.road
    art=Painted(k)
    rng=random.Random(2123)
    def box(d,l,z,a,b,c,t):
        art.box(r.pos(d,l,z),(a,b,c),bearing(d),lin(t))
    # Plan Lachat's chalets share thick masonry bases and long overhanging timber roofs.
    for d,l,w,b,h in ((134,-17,19,8,5.5),(157,18,11,8,4.1),(183,22,20,10,5),(237,-21,14,9,5),(311,24,13,8,4),(444,-17,13,7,4)):
        z=surface(d,l)
        box(d,l,z-.3,w,b,h*.55,0xbcafa0)
        box(d,l,z+h*.55-.3,w,b,h*.45+.3,0x805b42)
        art.roof(r.pos(d,l,z+h),w+1.6,b+1.4,2.6,bearing(d),lin(0x5d605c))
        for n in range(-int(w/2)+2,int(w/2),3):
            for side in (-1,1):
                box(d+n,l+side*(b/2+.06),z+2.25,.94,.14,1.34,0x3d565e)
    for turn in (5540,6840,7910,9350,14600,16120,19770,21260):
        side= -1 if bearing(turn+3)>bearing(turn-3) else 1
        for d in range(turn-77,turn+85,3):
            box(d,side*4.72,-.26,2.94,.65,.94,0x989486)
    for d in range(9400,25770,19):
        l=rng.choice((-1,1))*rng.uniform(8,45);rad=rng.uniform(.3,1.4)
        art.tube(r.pos(d,l,surface(d,l)-.22),rad,rad*.61,rad*.68,lin(0x615d5d),lin(0x928d84),6,lin(0xa09a90))
    drift=Painted(k,'galibier-snow')
    for start,end,side,high in ((16640,16890,-1,1.75),(17780,18240,1,2.6),(18200,18520,-1,2.8),(18520,18815,1,3.1),(20090,20475,-1,2.7),(22830,23060,1,2.25),(25390,25615,1,2.2)):
        prev=None
        for d in range(start,end,4):
            h=high*math.sin(math.pi*(d-start)/(end-start))**.4*(.88+.12*math.sin(d/17))
            row=[r.pos(d,side*l,z) for l,z in ((4.7,-.18),(4.93,h*.88),(5.8,h+.16),(7.3,h*.73),(9.8,-.14))]
            if prev:
                for j,t in enumerate((0xb3bfd0,0xeaf1f1,0xf2f1e8,0xc8d2da)):
                    drift.face((prev[j],row[j],row[j+1],prev[j+1]),(lin(t),)*4)
            prev=row
    # The rider follows the col branch. A second strip enters the cut stone portal.
    entrance=18512
    yaw=bearing(entrance)
    cx,cy,cz=r.pos(entrance,19,-.22)
    def tunnel(u,v,z):
        return cx+u*math.cos(yaw)-v*math.sin(yaw),cy+u*math.sin(yaw)+v*math.cos(yaw),cz+z
    for i in range(19):
        a=math.pi*i/19;b=math.pi*(i+1)/19
        for front,back,outer,inner,t in ((0,0,4.35,3.04,0x97928d),(0,6.2,3.04,3.04,0x55514e)):
            t=t+0x040404*(i%3)
            art.face((tunnel(front,inner*math.cos(a),2+inner*math.sin(a)),tunnel(front,inner*math.cos(b),2+inner*math.sin(b)),tunnel(back,outer*math.cos(b),2+outer*math.sin(b)),tunnel(back,outer*math.cos(a),2+outer*math.sin(a))),(lin(t),)*4)
    for v in (-3.71,3.71):art.box(tunnel(2.5,v,-.2),(5,1.35,2.35),yaw,lin(0x928d88))
    # Close the bore far behind the ring; its silhouette is an arch in the daylight.
    art.box(tunnel(6,0,-.15),(.24,6.45,5.24),yaw,lin(0x242529))
    for j in range(12):
        u=-48+j*4;v=-15*(max(0,-u)/48)**1.45
        art.box(tunnel(u,v,-.13),(4.5,6.6,.12),yaw,lin(0x535557))
    for d in range(900,25700,1000):
        box(d,5.05,-.18,.42,.4,.95,0xdacfc0)
        art.tube(r.pos(d,5.05,.76),.31,.23,.31,lin(0xa53235),lin(0xc34e48),8,lin(0xbf4141))
    # Rounded Desgrange column and summit's rough stone sign plinth.
    for d,l,h,radius in ((22397,-8.7,4.5,1.13),(25868,-9,3.3,2.15)):
        base=r.pos(d,l,-.23)
        art.box(base,(radius*3.1,radius*2.7,.45),bearing(d),lin(0xa69e8a))
        art.tube(r.pos(d,l,.21),radius*1.12,radius*.90,h,lin(0x928b79),lin(0xc7bda4),12 if d<23000 else 7,lin(0xb9ac91))
        art.tube(r.pos(d,l,.21+h),radius*.9,radius*.66,.48,lin(0xc1b79f),lin(0xd8ceb4),12 if d<23000 else 7,lin(0xc4b79d))
    return {'efforts':0}

THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=4.1,terrain={'sea':False},
           land={'mid':0x787959},sky=[0xc3d9e7,0x94bee0,0x6598d4,0x467bc1,0x3565ac],haze=0xb3c8dc,
           palette={'asphalt':0x545453,'sea':0x798f94},light=[0xfff6e3,3.45],fill=[0xd3e5f5,0x888473],
           sun_azimuth=-.91,sun_altitude=.86)
