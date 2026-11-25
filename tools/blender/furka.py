"""Gletsch to the Furka summit via the hairpin at Hôtel Belvédère."""
import math
import random
from worldkit import Painted, lin

PROFILE=((0,1757),(1300,1782),(2460,1827),(4110,1883),(5800,1955),(6720,2006),(8290,2085),(10150,2190),(12280,2272),(14460,2320),(16230,2353),(18300,2394),(19720,2429),(20025,2429))

def elevation(distance):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if distance <= b:
            return low + (high-low)*max(0,(distance-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    heading=.55+.13*math.sin(d/455)
    for station,change,width in ((1300,.42,110),(2920,2.60,41),(3920,-2.56,49),(5390,2.75,40),
        (6340,-2.71,39),(6830,2.73,39),(7790,-2.66,41),(9460,2.66,51),(10940,-2.75,43),
        (12364,2.91,43),(13840,-2.50,52),(14650,.68,120),(16080,1.70,74),(17430,-1.78,88)):
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
    if d<460 or d>19630:return -.11+max(0,edge-34)*.085
    # Across each traverse the same geographic side drops into the valley.
    across=l*math.cos(bearing(d)-.6)
    slope=.58 if 13900<d<15230 else .27
    return -.11+edge*(slope if across<0 else -slope)+min(edge*.045,3)*math.sin(d/70+l/16)


def strip(batch,r,i,a,b,h0,h1,k0,k1,tone):
    pts=[r.at(i,b,k0),r.at(i,a,h0),r.at(i+1,a,h1),r.at(i+1,b,k1)]
    batch.faces.append(tuple(batch.v(p) for p in pts))
    batch.colours.extend([lin(tone)]*4)


def road(r,st,length,col,bc):
    tar=bc.Builder('Passstrasse bitumen','furka-tarmac')
    markings=bc.Builder('Swiss road markings','terrain')
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
    grass=bc.Builder('Alpine pasture','furka-pasture');grass.colours=[]
    rock=bc.Builder('Granite slope','furka-scree');rock.colours=[]
    snow=bc.Builder('Snow patches','furka-snow');snow.colours=[]
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
            pasture=d+360*math.sin(d/128+l/24)<9300 and abs(l)>6
            drift=d>15000 and abs(l)>8 and math.sin(d/180+l/32)>.62
            tone=0xe5e5df if drift else 0x797e4e if pasture else 0x8c8982
            batch=snow if drift else grass if pasture else rock
            batch.faces.append(tuple(batch.v(v) for v in (a[j+1],a[j],c[j],c[j+1])));batch.colours.extend([lin(tone)]*4)
        a=c
    grass.build(col);rock.build(col);snow.build(col);return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']


def scenery(k):
    r=k.road
    art=Painted(k)
    rng=random.Random(2122)
    def house(d,l,length,width,height,roof,chapel=False):
        yaw=bearing(d)
        x,y,z=r.pos(d,l,surface(d,l))
        def local(u,v,h):
            return (x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h)
        def box(u,v,h,a,b,c,t):
            art.box(local(u,v,h),(a,b,c),yaw,lin(t))
        box(0,0,-1,length,width,height+1,0xcabfa9 if not chapel else 0xe1dfce)
        art.roof(local(0,0,height),length+.5,width+.4,width*.34,yaw,lin(roof))
        for side in (-1,1):
            for row in range(max(1,int(height/3))):
                for n in range(2,int(length)-1,3):
                    u=n-length/2
                    box(u,side*(width/2+.05),1+row*2.9,.96,.14,1.36,0x44545a)
                    for shutter in (-.72,.72):
                        box(u+shutter,side*(width/2+.08),1+row*2.9,.38,.12,1.40,0x416454)
        if chapel:
            box(length*.34,0,height-1,3.3,3.2,6,0xc7bd9f)
            art.tube(local(length*.34,0,height+5),2.6,.04,6.8,lin(0x363e42),lin(0x65716f),4)
    for d,l,a,b,h,c in ((128,19,16,8,5,0x564b43),(161,-22,44,11,10,0x5d5450),
                         (206,23,17,8,7,0x56595c),(260,-20,22,9,7,0x6b4f42),(349,22,14,8,5,0x514b42)):
        house(d,l,a,b,h,c,d==128)
    # Inside the Belvédère bend a glazed octagonal gallery projects from the stone hotel wing.
    d=12358
    yaw=bearing(d)
    x,y,z=r.pos(d,22,0)
    def hotel(u,v,w):
        return (x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+w)
    def block(u,v,w,a,b,c,t):
        art.box(hotel(u,v,w),(a,b,c),yaw,lin(t))
    block(0,0,-3,29,11,15.1,0xbbb4a1)
    art.roof(hotel(0,0,12.1),29.8,12,4.8,yaw,lin(0x51545a))
    for u in range(-12,13,3):
        for w in (1.2,4.4,7.6,10):
            for side in (-1,1):
                block(u,side*5.54,w,1,.14,1.5,0x415862)
                for t in (-.77,.77):block(u+t,side*5.59,w,.41,.13,1.52,0x496949)
    centre=hotel(-11,-5,0)
    for height,radius,top,thickness,shade in ((-1,6,6,5,0x8d8073),(4,6.4,6.4,.43,0x943e30),(4.43,6,6,2.35,0x718080),(6.78,6.4,6.4,.38,0x894031),(7.16,6.5,2.6,2.45,0x605658)):
        art.tube((centre[0],centre[1],z+height),radius,top,thickness,lin(shade),lin(shade),18,lin(shade))
    for n in range(18):
        angle=n*math.tau/18
        art.box((centre[0]+5.98*math.cos(angle),centre[1]+5.98*math.sin(angle),z+4.4),(.2,.2,2.48),angle,lin(0x893e32))
    rock=Painted(k,'furka-scree')
    for d in range(480,19910,36):
        for l in (-5.05,5.05):
            p=r.pos(d,l,-.12)
            art.box(p,(.19,.23,1.14),bearing(d),lin(0xe5e4d9))
            art.box((p[0],p[1],p[2]+.81),(.21,.25,.2),bearing(d),lin(0xaa413b))
        if d>7400:
            l=rng.choice((-1,1))*rng.uniform(8,45)
            rad=rng.uniform(.47,2.3)
            rock.tube(r.pos(d,l,surface(d,l)-.25),rad,rad*.45,rad*.8,lin(0x787674),lin(0xa6a39b),7,lin(0xaaa7a1))
    for turn in (2920,3920,5390,6340,6830,7790,9460,10940,12364,13840):
        for d in range(turn-74,turn+78,3):
            side=-1 if bearing(d+1)>bearing(d-1) else 1
            art.box(r.pos(d,side*4.84,-.21),(2.94,.56,.94),bearing(d),lin(0x9a9385))
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=4.1,terrain={'sea':False},
           land={'mid':0x747958},sky=[0xcbdce5,0x99c5df,0x72add6,0x518ac3,0x4174af],haze=0xbacada,
           palette={'asphalt':0x595959,'sea':0x759593},light=[0xfff2d9,3.4],fill=[0xd6e7f4,0x89887b],
           sun_azimuth=-.84,sun_altitude=.76)
