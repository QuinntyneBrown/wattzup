"""Park Drive, an anticlockwise Manhattan lap from the southern carriage stand."""
import bisect
import math
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted, lin, smooth

LENGTH = 6450
HEIGHT = ((0,0),(300,1),(800,9),(1250,2),(1900,14),(2450,16),(3100,17),
          (3680,29),(4310,13),(4670,16),(5140,21),(5620,4),(5990,6),(6450,0))
# Centreline drawn as an arc-length parameterised closed spline. x points east and y north.
ANCHORS = ((-160,-1190),(160,-1160),(350,-920),(290,-610),(420,-280),(370,0),
           (390,440),(300,920),(150,1230),(-90,1285),(-310,1080),(-365,750),
           (-280,490),(-360,140),(-280,-160),(-355,-410),(-230,-690),(-290,-985))


@lru_cache(maxsize=1)
def centreline():
    pts = []
    for i in range(len(ANCHORS)):
        a,b,c,d = [ANCHORS[(i+j)%len(ANCHORS)] for j in (-1,0,1,2)]
        for j in range(80):
            t = j/80
            pts.append(tuple(.5*(2*B+(-A+C)*t+(2*A-5*B+4*C-D)*t*t+(-A+3*B-3*C+D)*t**3)
                             for A,B,C,D in zip(a,b,c,d)))
    pts.append(pts[0])
    lengths = [0]
    for a,b in zip(pts,pts[1:]):
        lengths.append(lengths[-1]+math.dist(a,b))
    scale = LENGTH/lengths[-1]
    return [s*scale for s in lengths],[(x*scale,y*scale) for x,y in pts]


def position(d):
    lengths,pts = centreline()
    at = d%LENGTH
    i = bisect.bisect_right(lengths,at)-1
    f = (at-lengths[i])/(lengths[i+1]-lengths[i])
    return tuple(a+(b-a)*f for a,b in zip(pts[i],pts[i+1]))


def heading(d):
    a,b = position(d-1),position(d+1)
    return math.atan2(b[1]-a[1],b[0]-a[0])


def elevation(d):
    at = d%LENGTH
    for (a,b),(c,e) in zip(HEIGHT,HEIGHT[1:]):
        if at <= c:
            return b+(e-b)*smooth(a,c,at)
    return 0


def route(course,theme,bc):
    stages = bc.stages(course['plan'])
    assert stages[-1]['to'] == LENGTH
    samples = []
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        x,y = position(d)
        turn = heading(d+.5)-heading(d-.5)
        samples.append(dict(d=d,x=x,y=y,z=elevation(d),h=heading(d),k=math.atan2(math.sin(turn),math.cos(turn)),
                            g=100*(elevation(d+.5)-elevation(d-.5))))
    mean = sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return samples,stages,LENGTH,mean,0


def reservoir(d):
    return smooth(2010,2200,d)*(1-smooth(3160,3330,d))


def surface(d,l):
    shore = reservoir(d)*smooth(12,19,l)
    base = elevation(d)-.20+smooth(6.6,32,abs(l))*(1.7*math.sin(d/87+l/19)+.014*abs(l))
    return base+(10.5-base)*shore


def land(road,col,theme,bc):
    terrain = bc.Builder('Park lawns and reservoir basin','terrain')
    terrain.colours = []
    lateral = [-240,-110,-54,-24,-10,-6.7,0,6.7,10,13,18,24,54,110,240]
    for d in range(0,LENGTH,10):
        for l,r in zip(lateral,lateral[1:]):
            verts = []
            for at,side in ((d,l),(d+10,l),(d+10,r),(d,r)):
                x,y,_ = road.pos(at,side)
                verts.append((x,y,surface(at,side)))
            shade = math.sin(d/42+(r+l)/19)
            colour = lin(0x899052 if shade>.4 else 0x899957 if shade>-.5 else 0x7A8B50)
            terrain.quad(*verts)
            terrain.colours.extend((colour,)*4)
    def ground(x,y):
        _,i,_ = road.tree.find((x,y,0));s = road.s[i]
        l = -(x-s['x'])*math.sin(s['h'])+(y-s['y'])*math.cos(s['h'])
        return surface(s['d'],l)
    return terrain.build(col),ground


def roadway(road,st,length,col,bc):
    asphalt = bc.Builder('Road','asphalt')
    paint = bc.Builder('RoadPaint','paint')
    cinder = bc.Builder('Reservoir cinder path','terrain');cinder.colours=[]
    for i,s in enumerate(road.s[:-1]):
        d = s['d']
        if d<0 or d>=length:
            continue
        def strip(mesh,a,b,h):
            mesh.quad(road.at(i,a,h),road.at(i+1,a,h),road.at(i+1,b,h),road.at(i,b,h))
        strip(asphalt,-6.5,6.5,0)
        strip(paint,3.16,3.29,.016)
        if i%6<3:
            strip(paint,-1.6,-1.50,.018)
        if 1980<d<3370:
            strip(cinder,7.3,11.6,-.045);cinder.colours.extend((lin(0xAE8564),)*4)
    asphalt.build(col);paint.build(col);cinder.build(col)


THEME = {'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':6.5,
         'terrain':{'sea':False},'land':{'mid':0x899957},
         'sky':[0xF5CBB9,0xE4C7C9,0xB6C2D8,0x9DB6D1,0x779DC0],'haze':0xEBCDBF,
         'light':[0xFFD7A5,2.65],'fill':[0xD6E3F0,0xA39474],
         'sun_azimuth':.48,'sun_altitude':.32,'palette':{'asphalt':0x595756},'chunks':{'Land':2}}


def beam(art,a,b,r,tint,sides=5):
    a,b = Vector(a),Vector(b)
    axis = (b-a).normalized()
    side = axis.cross(Vector((0,0,1)))
    if side.length < .001:
        side = Vector((1,0,0))
    side.normalize()
    up = axis.cross(side)
    ring = [r*(side*math.cos(j*math.tau/sides)+up*math.sin(j*math.tau/sides)) for j in range(sides)]
    c = lin(tint)
    for j,v in enumerate(ring):
        w = ring[(j+1)%sides]
        art.face((a+v,a+w,b+w,b+v),(c,)*4)


def scenery(k):
    art = Painted(k)
    skyline = Painted(k,'peaks')
    rng = k.rng
    def verge(d,l,up=0):
        x,y,_ = k.road.pos(d,l)
        return x,y,surface(d,l)+up
    def flat(pts,tint):
        art.face(pts,(lin(tint),)*len(pts))
    def disk(x,y,z,r,h,tint,n=24):
        art.tube((x,y,z),r,r,h,lin(tint),lin(tint),n,lin(tint))
    def box(d,l,size,tint,h=0):
        art.box(verge(d,l,h),size,heading(d),lin(tint))
    # A white pedestrian and a bicycle mark alternate in the two travel lanes.
    for d in range(20,LENGTH,140):
        def stroke(at,l,a,b):
            beam(art,k.road.pos(at+a[0],l+a[1],.025),k.road.pos(at+b[0],l+b[1],.025),.055,0xE7E3D5)
        for l in (-3.8,4.6):
            if l<0:
                for c in (-.66,.72):
                    for j in range(12):
                        a=j*math.tau/12;b=(j+1)*math.tau/12
                        stroke(d,l,(c+.37*math.cos(a),.37*math.sin(a)),(c+.37*math.cos(b),.37*math.sin(b)))
                for a,b in (((-.66,0),(-.17,.48)),((-.17,.48),(.27,-.13)),((.27,-.13),(-.66,0)),((.27,-.13),(.72,0))):
                    stroke(d,l,a,b)
            else:
                for a,b in (((-.7,-.3),(-.15,.05)),((-.15,.05),(-.65,.39)),((-.15,.05),(.44,0)),((.33,0),(.06,-.36)),((.33,0),(.55,.33))):
                    stroke(d,l,a,b)
                x,y,z=k.road.pos(d+.69,l,.025);disk(x,y,z,.14,.02,0xE7E3D5,8)
    # The cinder path follows the water independently of the asphalt, behind a spear-topped rail.
    iron = 0x343E3B
    for d in range(2075,3260,3):
        base = verge(d,11.9)
        top = (base[0],base[1],base[2]+1.24)
        beam(art,base,top,.053,iron)
        for i in range(1,7):
            at = d+i*3/7;x,y,z = verge(at,11.9)
            art.tube((x,y,z),.025,.022,1.20,lin(iron),lin(iron),4)
            art.tube((x,y,z+1.18),.067,0,.12,lin(iron),lin(iron),4)
        for h in (.24,1.05):
            beam(art,verge(d,11.9,h),verge(d+3,11.9,h),.036,iron)
    water_z=11.95
    for d in range(2080,3250,10):
        def lakeside(at):
            spread=math.sin(math.pi*max(0,min(1,(at-2080)/1170)))**.6
            return 18.5,20+172*spread
        ia,oa=lakeside(d);ib,ob=lakeside(d+10)
        def water(at,l):
            x,y,_=k.road.pos(at,l);return x,y,water_z
        flat((water(d,ia),water(d+10,ib),water(d+10,ob),water(d,oa)),0x8EAFB7)
        # Broken mirror bands at the far bank share the dawn colours of its trees and towers.
        for i in range(3):
            q=rng.uniform(.45,.95)
            at=d+rng.uniform(0,7);l=ia+(oa-ia)*q
            x,y,_=water(at,l)
            art.box((x,y,water_z+.015),(rng.uniform(1,5),rng.uniform(.3,2),.008),
                    heading(d),lin(rng.choice((0xA8B7C0,0xB8AEAE,0x98A9A5))))
    fx,fy,_=verge(2535,37)
    for j in range(19):
        ang=j*math.tau/19;r=1.4+1.3*(j%3);h=6.8-j%4
        last=(fx,fy,water_z+.2)
        for n in range(1,6):
            u=n/5;pt=(fx+r*math.cos(ang)*u*u,fy+r*math.sin(ang)*u*u,water_z+.2+4*h*u*(1-u))
            beam(art,last,pt,.11 if n<4 else .06,0xD9E8E3);last=pt
    # Bethesda's winged bronze angel over the bowls on the lower red-brick terrace.
    d=1098;x,y,z=verge(d,19);h=heading(d)
    art.box((x,y,z-.35),(47,30,.44),h,lin(0xB98068))
    for i in range(6):
        art.box(verge(d-19-i*.55,19,.12+i*.19),(.72,18,.22),h,lin(0xC8B19D))
    disk(x,y,z+.10,7.6,.52,0xBB9984,40);disk(x,y,z+.59,7.12,.045,0x8BAAA8,40)
    for high,br,tr,rise,t in ((.6,1.2,.68,2.3,0x74756C),(2.6,1.1,3,.58,0x73786E),(3, .66,.49,1.35,0x68746B),(4.22,.54,1.57,.46,0x6F796C),(4.63,.39,.22,1.53,0x47695F)):
        art.tube((x,y,z+high),br,tr,rise,lin(t),lin(t),20,lin(t))
    disk(x,y,z+6.18,.24,.41,0x47695F,10)
    for side in (-1,1):
        for j in range(8):
            t=j/7;beam(art,(x,y,z+5.78),(x+.18+side*(.92+.55*t),y+.35*t,z+6.65-.62*t),.14-.045*t,0x55796D)
        beam(art,(x,y,z+5.79),(x+side*.66,y-.24,z+5.45),.13,0x49695C)
    for at in range(1040,1156,4):
        box(at,8.1,(.45,.62,1.13),0xBCAB94)
        box(at+2,8.1,(4,.42,.19),0xD3B79D,.87)
    # Elms branch outwards over the drive. Build different crowns as clumps with shaded undersides.
    for side in (-1,1):
        for d in range(0,LENGTH,17):
            l=side*rng.uniform(8.7,18)
            if side==1 and (1010<d<1190 or 1970<d<3330):
                continue
            x,y,z=verge(d+rng.uniform(-4,4),l)
            tall=rng.uniform(8,14)
            art.tube((x,y,z-.3),.4,.18,tall*.53,lin(0x524B40),lin(0x766B55),7)
            for j in range(3):
                a=rng.uniform(-.3,.3)+math.tau*j/3
                spread=rng.uniform(2.6,4.8)
                end=(x+spread*math.cos(a),y+spread*math.sin(a),z+tall*.76)
                beam(art,(x,y,z+tall*.41),end,.19,0x685E4D)
                tint=rng.choice((0x84965F,0x718C54,0xA3A66A,0xAC9B56,0xB29F65))
                art.tube(end,1.4,3.2,1.72,lin(0x526B4B),lin(tint),8)
                art.tube((end[0],end[1],end[2]+1.7),3.2,1.25,2.15,lin(tint),lin(tint),8,lin(tint))
    for d in range(5,LENGTH,38):
        side=1 if d%76==5 else -1;l=7.4*side
        x,y,z=verge(d,l)
        art.tube((x,y,z),.23,.115,.52,lin(iron),lin(iron),8)
        art.tube((x,y,z+.5),.105,.072,3.0,lin(iron),lin(iron),8)
        art.tube((x,y,z+3.5),.16,.29,.53,lin(0xC9C3A3),lin(0xF1DAB9),6,lin(0xB8A58D))
        art.tube((x,y,z+4),.34,.06,.24,lin(iron),lin(iron),6)
        if d%114==5:
            for slat in range(4):
                box(d+4,l+(slat-1.5)*.11,(1.85,.09,.065),0x876D51,.45)
            for end in (-.7,.7):
                box(d+4+end,l,(.09,.52,.46),iron)
            for h in (.64,.83):
                box(d+4,l+side*.28,(1.85,.074,.13),0x897052,h)
    # The San Remo pair share a setback base and distinct octagonal lanterns.
    sx,sy,_=verge(3165,145)
    def tower(x,y,z,w,depth,h,tint):
        skyline.box((x,y,z),(w,depth,h),0,lin(tint))
        for side in (-1,1):
            for i in range(2,int(h),6):
                skyline.box((x,y+side*(depth/2+.045),z+i),(w*.86,.12,.9),0,lin(0xA19C97))
    tower(sx,sy,11,55,22,32,0xC5AC97)
    for dx in (-18,18):
        tower(sx+dx,sy,43,14,15,34,0xD4BCA6)
        skyline.tube((sx+dx,sy,77),6.4,5.2,8,lin(0xB7A48D),lin(0xDECCAC),8,lin(0xD7BEA1))
        skyline.tube((sx+dx,sy,85),5.5,1.4,10,lin(0x749088),lin(0xA3ADA0),8,lin(0x9EAA9C))
        skyline.tube((sx+dx,sy,95),.7,0,4,lin(0x7A827F),lin(0xB7AC94),6)
    # Billionaires' Row, with a square grid tower, stepped glass slabs and the slender spire.
    px,py=position(0)
    for j in range(42):
        x=px+(j-21)*33;y=py-360-rng.uniform(0,150)
        tall=rng.uniform(38,88) if j not in (8,14,17,24,30) else (195 if j==17 else rng.uniform(120,182))
        wide=rng.uniform(16,34);tint=rng.choice((0xA9A3A1,0x93A6B0,0xC3AA9D,0xB1AEB3))
        tower(x,y,0,wide,23,tall,tint)
        if j in (14,24):
            tower(x+2,y,tall,wide*.72,17,22,tint)
            skyline.tube((x+2,y,tall+22),1,.23,30,lin(tint),lin(0xC5C1B9),5)
    return {'efforts':0}
