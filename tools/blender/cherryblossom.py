"""Tidal Basin promenade. Five timed laps share the same shore and monuments."""
import bisect
import math

from worldkit import Painted, lin

LENGTH = 16852.916666666668
LAP = LENGTH / 5
GRADE = [(0, 2), (.17, 1.8), (.37, 3.6), (.59, 2.1), (.77, 3), (.94, 1.9), (1, 2)]


def shoreline(t):
    # The southwest inlet narrows and the festival lawn opens around the northern arc.
    return (560 * math.cos(t) + 50 * math.cos(2*t), 440 * math.sin(t) + 32 * math.sin(3*t))


vertices = [shoreline(i*math.tau/1440) for i in range(1441)]
distances = [0]
for start, end in zip(vertices, vertices[1:]):
    distances.append(distances[-1] + math.dist(start, end))
scale = LAP / distances[-1]


def pose(d, lateral=0):
    chain = (d % LAP) / scale
    i = min(len(vertices)-2, bisect.bisect_right(distances, chain)-1)
    a, b = vertices[i:i+2]
    fraction = (chain-distances[i])/(distances[i+1]-distances[i])
    h = math.atan2(b[1]-a[1], b[0]-a[0])
    return ((a[0]+fraction*(b[0]-a[0]))*scale-lateral*math.sin(h),
            (a[1]+fraction*(b[1]-a[1]))*scale+lateral*math.cos(h), h)


def height(d):
    t = (d % LAP)/LAP
    for (a, z), (b, end) in zip(GRADE, GRADE[1:]):
        if t <= b:
            return z+(end-z)*(t-a)/(b-a)


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    assert abs(stages[-1]['to'] - LENGTH) < .01
    rows = []
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        x, y, h = pose(d)
        turn = pose(d+.5)[2]-pose(d-.5)[2]
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=math.atan2(math.sin(turn),math.cos(turn)),
                         g=100*(height(d+.5)-height(d-.5))))
    mean = sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows, stages, LENGTH, mean, 0


def edge(d, l, z):
    return (*pose(d,l)[:2],z)


def land(road, col, theme, bc):
    ground = bc.Builder('Tidal Basin stone embankment and parkland', 'terrain')
    ground.colours = []
    def quad(vertices, tint):
        ground.quad(*vertices)
        ground.colours.extend((lin(tint),)*4)
    for i in range(math.ceil(LAP/4)):
        d, e = i*4, min(i*4+4,LAP)
        for a,b,za,zb,tint in [(-400,-14,-.20,-.20,0x849C65),(-14,-3.73,-.20,-.09,0x9BAE73),
                                 (3.73,7,-.08,-.08,0xB5ADA2),(7,7.85,.04,.04,0xCCC5BA),
                                 (7.85,7.85,.04,-2,0x908982)]:
            quad([edge(d,a,height(d)+za),edge(e,a,height(e)+za),edge(e,b,height(e)+zb),edge(d,b,height(d)+zb)],tint)
        for near,far,tint in [(7.84,12,0x749699),(12,31,0x91ADB0),(31,80,0x8DAEB4)]:
            quad([edge(d,near,.59),edge(e,near,.59),edge(e,far,.59),edge(d,far,.59)],tint)
        ground.tri(edge(d,80,.59),edge(e,80,.59),(0,0,.59))
        ground.colours.extend((lin(0x8DAEB4),)*3)
    return ground.build(col),lambda x,y:1.75


def roadway(road, stages, length, col, bc):
    surface = bc.Builder('Road','asphalt')
    for d in range(0,math.ceil(LAP),3):
        e = min(d+3,LAP)
        surface.quad(edge(d,-3.78,height(d)),edge(e,-3.78,height(e)),edge(e,3.78,height(e)),edge(d,3.78,height(d)))
    surface.build(col)


THEME = {'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':3.78,
         'terrain':{'sea':False},'land':{'mid':0x87996C},
         'sky':[0xD9E7E7,0xC7E5E9,0xA0D6E8,0x87BBDF,0x6498CC],'haze':0xDCEBE7,
         'light':[0xFFF0DA,2.65],'fill':[0xD4E5EB,0xADA28B],
         'sun_azimuth':.9,'sun_altitude':.64,'palette':{'asphalt':0xA69C91},'chunks':{'Land':3}}


def scenery(k):
    park = Painted(k)
    monuments = Painted(k,'peaks')
    stone, white, shadow = map(lin,(0xDAD6CB,0xFFF5E4,0xADAFA8))
    x,y,heading = pose(760,-33)
    for r,base,h,col in [(37,1.5,1.2,shadow),(34,2.7,1.5,stone),(31,4.2,1.1,white),
                         (24,5.3,11,shadow),(29,16.3,1.1,white),(28,17.4,1.2,stone)]:
        monuments.tube((x,y,base),r,r,h,col,col,60,col)
    for i in range(32):
        t=i*math.tau/32
        cx,cy=x+26*math.cos(t),y+26*math.sin(t)
        for r0,r1,z,h,col in [(1.25,1.25,5.3,.7,stone),(1,.79,6,9.45,white),(1,1.35,15.45,.85,stone)]:
            monuments.tube((cx,cy,z),r0,r1,h,shadow,col,10,col)
    for i in range(16):
        lower,upper=i*math.pi/32,(i+1)*math.pi/32
        monuments.tube((x,y,18.6+11*math.sin(lower)),28*math.cos(lower),28*math.cos(upper),
                       11*(math.sin(upper)-math.sin(lower)),stone,white,60)
    # Portico faces the basin. Eight freestanding Ionic columns stand above broad stairs.
    def front(side, forward, z):
        return (x+side*math.cos(heading)-forward*math.sin(heading),
                y+side*math.sin(heading)+forward*math.cos(heading),z)
    for i in range(12):
        monuments.box(front(0,32-i*.55,1.65+i*.28),(30,12,.29),heading,stone)
    for i in range(8):
        p=front((i-3.5)*3.6,30,5.1)
        monuments.tube(p,.97,.78,11.3,stone,white,14)
    monuments.box(front(0,27,16.4),(30,10,1.3),heading,white)
    monuments.face([front(15,32,17.7),front(-15,32,17.7),front(0,32,22)],(stone,white,white))
    # The two marble colours mark the historic change of stone in the obelisk.
    x,y,_=pose(2990,-103)
    def square(width,z):
        return [(x+dx*width,y+dy*width,z) for dx,dy in [(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5)]]
    for a,b,z,end,tint in [(16.8,15.4,2,47,0xD7D0BC),(15.4,10.5,47,151,0xE8E1CE),(10.5,.02,151,168,0xEBE3CB)]:
        lo,hi=square(a,z),square(b,end)
        for i in range(4):
            j=(i+1)%4
            monuments.face([lo[i],lo[j],hi[j],hi[i]],(lin(tint),)*4)
    # Granite coping joints stay legible at cycling speed on the inside edge.
    for i in range(0,math.ceil(LAP),3):
        x,y,h=pose(i,7.42)
        park.box((x,y,height(i)+.04),(.035,.84,.025),h,lin(0x756E6B))
    # Market tents, low food counters and triangular bunting on the Mall lawn.
    rng=k.rng
    for i in range(22):
        d=2000+i*11
        x,y,h=pose(d,-12-(i%3)*2)
        z=height(d)-.15
        def tent(u,v,w):
            return (x+math.cos(h)*u-math.sin(h)*v,y+math.sin(h)*u+math.cos(h)*v,z+w)
        for u in (-3.1,3.1):
            for v in (-2.6,2.6):
                park.box(tent(u,v,0),(.09,.09,3),h,shadow)
        hem=[tent(u,v,3) for u,v in [(-3.25,-2.8),(3.25,-2.8),(3.25,2.8),(-3.25,2.8)]]
        for j,a in enumerate(hem):
            b=hem[(j+1)%4]
            park.face([a,b,tent(0,0,4.95)],(stone,white,white))
            park.face([(a[0],a[1],a[2]-.28),(b[0],b[1],b[2]-.28),b,a],(shadow,stone,white,white))
        park.box(tent(0,1.4,0),(4.5,1.1,1.03),h,lin(0xBA7D82))
        park.box(tent(0,1.4,1.04),(4.6,1.17,.1),h,lin(0xE7D6BE))
        for j in range(9):
            u=-3+j*.70
            park.face([tent(u,2.82,2.8),tent(u+.6,2.82,2.8),tent(u+.3,2.82,2.3)],
                      (lin(0xDE91A4 if j%2 else 0xCA6C89),)*3)
    # Timber launch and ladders leave room for the paddle boats on their moorings.
    for d in range(1450,1488):
        x,y,h=pose(d,10)
        park.box((x,y,1.02),(.96,4.6,.23),h,lin(0xB1987B if d%3 else 0xAB8D72))
        if d%5==0:
            for lateral in (8,12):
                x,y,h=pose(d,lateral)
                park.tube((x,y,.55),.12,.12,1.25,shadow,stone,7)
    # Discontinuous mirrored bands on the calm surface, shared by all five laps.
    for i in range(1400):
        d=rng.uniform(0,LAP);lateral=rng.uniform(10,68)
        x,y,h=pose(d,lateral)
        near_trees=(d%54<34 and lateral<24)
        tint=rng.choice((0xB6A8AC,0xB5AAA8,0xA4A7A2)) if near_trees else rng.choice((0x9DBABE,0x96B3B7,0x87A9AF))
        park.box((x,y,.602),(rng.uniform(.8,4.8),rng.uniform(.12,.55),.008),h,lin(tint))
    # Foreshortened reflections of the memorial colonnade and the obelisk in the inshore water.
    for station,span,reach in [(760,55,57),(2990,15,90)]:
        for l in range(13,reach,2):
            factor=1-(l-13)/reach*.65
            for j in range(5 if span>20 else 2):
                d=station+(j/(4 if span>20 else 1)-.5)*span*factor+math.sin(l*1.2)*.8
                x,y,h=pose(d,l)
                park.box((x,y,.628),(3.2*factor,.83,.008),h,lin(0xB9C1BA if l%3 else 0xADB9B4))
    return {'efforts':0}
