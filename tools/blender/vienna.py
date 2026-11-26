"""Vienna's Ringstrasse. The same physical circuit carries every lap of the class."""
import math
from arenberg import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin

LAP = 5300
SIDE = LAP / 8
STRAIGHT = 475
TURN = math.pi / 4
RADIUS = (SIDE - STRAIGHT) / TURN
PROFILE = [(0,171),(800,173),(1500,175),(2300,174),(3200,171),(4120,168),(4660,169),(5300,171)]


def centre(d):
    side, s = divmod(d % LAP, SIDE)
    angle = int(side) * TURN
    # Rotate the displacement of each preceding side about the circuit centre.
    span = complex(STRAIGHT + RADIUS * math.sin(TURN), RADIUS * (1 - math.cos(TURN)))
    def rotate(a): return complex(math.cos(a), math.sin(a))
    start = sum(span * rotate(i * TURN) for i in range(int(side)))
    arc = max(0, s - STRAIGHT) / RADIUS
    delta = complex(min(s, STRAIGHT) + RADIUS * math.sin(arc), RADIUS * (1 - math.cos(arc)))
    p = start + rotate(angle) * delta
    return p.real, p.imag, angle + arc


def elevation(d):
    s = d % LAP
    for (a,z),(b,y) in zip(PROFILE, PROFILE[1:]):
        if s <= b: return z + (y-z)*(s-a)/(b-a)


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    rows = []
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i * bc.STEP - bc.LEAD_IN
        x,y,h = centre(d)
        delta = centre(d+.5)[2] - centre(d-.5)[2]
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=math.atan2(math.sin(delta),math.cos(delta)),g=100*(elevation(d+.5)-elevation(d-.5))))
    return rows, stages, length, sum(s['level']*(s['to']-s['from']) for s in stages)/length, 1


def strip(builder, r, d, end, left, right, z):
    points = [r.pos(t,v,z) for t,v in ((d,left),(end,left),(end,right),(d,right))]
    picture(builder, points, [(x/6,y/6) for x,y,_ in points])


def road(r,st,length,col,bc):
    for name, sections in (
        ('RingAsphalt',[(-11,11,.04)]),
        ('RingPaving',[(-20,-11,.12),(11,20,.12)]),
        ('RingCycle',[(11.7,14.6,.14)]),
        ('RingRails',[(v-.046,v+.046,.063) for v in (-7.42,-5.98,-3.92,-2.48)]),
    ):
        m=bc.Builder(name,'terrain');m.colours=[];m.uvs=[]
        for d in range(0,LAP,4):
            for a,b,z in sections: strip(m,r,d,d+4,a,b,z)
        m.build(col)


def land(r,col,theme,bc):
    m=bc.Builder('RingLawns','terrain');m.colours=[];m.uvs=[]
    for d in range(0,LAP,10): strip(m,r,d,d+10,-210,210,-.14)
    return m.build(col), lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.14


def scenery(k):
    art=Painted(k)
    oper=pictured(k,'Staatsoper'); palaces=pictured(k,'RingPalaces'); trees=pictured(k,'RingTrees')
    stone, light, bronze, copper, iron, leaf, slate = map(lin,(0xC8BCA5,0xE7D9BC,0x73684F,0x749182,0x5A5A57,0x76804D,0x645F61))
    def facade(mesh,at,width,height,uv=(0,0,1,1),side=1):
        a,b,c,e=uv; w=side*width/2
        picture(mesh,[at(x,0,z) for x,z in ((-w,0),(w,0),(w,height),(-w,height))],((a,b),(c,b),(c,e),(a,e)))
    def spire(at,x,v,z,height):
        art.tube(at(x,v,z),height*.12,height*.092,height*.55,stone,light,8,cap=stone)
        art.tube(at(x,v,z+height*.55),height*.106,.10,height*.45,copper,iron,8)
    def dome(at,x,v,z,r):
        for level in range(6):
            a=level*math.pi/12;b=(level+1)*math.pi/12
            art.tube(at(x,v,z+r*math.sin(a)),max(.02,r*math.cos(a)),max(.02,r*math.cos(b)),r*(math.sin(b)-math.sin(a)),copper,copper,16)
        art.tube(at(x,v,z+r),.45,.13,2.1,bronze,bronze,8)
    # The park frontage interrupts the blocks. Keep views across the forecourts open.
    landmarks=[(180,-1),(1218,1),(2053,1),(2584,1),(3154,1),(880,-1),(2370,-1),(4730,1)]
    for j,d in enumerate(range(0,LAP,22)):
        for side in (-1,1):
            open_view=any(s==side and abs(d-t)<92 for t,s in landmarks)
            at,h=site(k,d,side*(16.7+(j%3)*.42))
            if not open_view:
                tree=[(0,.22),(.22,.48),(.48,.85),(.85,1)][(j+side)%4]
                width=8+(j*7)%5
                for axis in (0,1):
                    pts=[at(x if axis==0 else 0,x if axis else 0,z) for x,z in ((-width/2,0),(width/2,0),(width/2,11.5),(-width/2,11.5))]
                    picture(trees,pts,((tree[0],0),(tree[1],0),(tree[1],1),(tree[0],1)))
            if j%2==0 and not open_view and not (4400<d<5000 or 570<d<820 or 1740<d<1900):
                at,h=site(k,d,side*(29+j%4))
                ht=15+j%5
                art.box(at(0,side*6,-.3),(40,12,ht),h,stone)
                face=lambda x,v,z:at(x,v-side*.03,z)
                facade(palaces,face,40,ht+3,(.55,.02,.95,.5),side)
        if j%2==0:
            at,h=site(k,d,-10.4)
            beam(art,at(0,0,0),at(0,0,7.2),.084,iron)
            beam(art,at(0,0,6.48),at(0,7.5,6.15),.055,iron)
            for v in (-6.7,-3.2):beam(art,k.road.pos(d,v,6.13),k.road.pos((d+44)%LAP,v,6.13),.018,iron)
        if j%2==1:
            at,h=site(k,d,0)
            for v in (.8,6.2):art.box(at(0,v,.053),(4,.13,.013),h,light)
    at,h=site(k,180,-25)
    facade(oper,at,68,33)
    art.box(at(0,-11,.2),(57,20,19),h,stone)
    art.roof(at(0,-11,19.2),53,20,7.1,h,copper)
    for loc,sign,idx in ((880,-1,1),(2370,-1,0),(1190,1,2),(1265,1,2)):
        at,h=site(k,loc,sign*(34 if idx==2 else 26))
        uv=((0,.50,.49,1),(.51,.50,1,1),(0,0,.51,.5))[idx]
        facade(palaces,at,71,23,uv,sign)
        art.box(at(0,sign*9,.1),(65,16,15),h,stone)
        if idx==2:
            art.tube(at(0,sign*8,15),7,7,6,stone,light,12)
            dome(at,0,sign*8,21,7.1)
    at,h=site(k,1228,22)
    art.box(at(0,0,0),(5,4,1),h,stone);art.tube(at(0,0,1),1.46,1.05,3.4,stone,light,8)
    art.tube(at(0,0,4.4),.91,.46,1.85,bronze,bronze,8);art.tube(at(0,0,6.13),.34,.27,.53,bronze,bronze,8)
    at,h=site(k,2053,32)
    art.box(at(0,8,.1),(91,14,15),h,stone)
    for i in range(6): art.box(at(0,-5+i*.6,i*.36),(40-i*.4,11-i*.6,.38),h,light)
    for x in range(-16,17,4):
        art.tube(at(x,-5.1,2.16),.75,.57,9.6,light,stone,12)
        art.tube(at(x,-5.1,11.76),.95,1,.52,light,light,10)
    art.box(at(0,-3,12.2),(38,8,.91),h,light)
    for v in (-7.1,1.1):art.face([at(-19,v,13.1),at(19,v,13.1),at(0,v,17.8)],(stone,light,light))
    at,h=site(k,2053,17.2)
    art.tube(at(0,0,.12),3.7,3.75,.65,stone,light,22,cap=copper)
    art.tube(at(0,0,.75),1.02,.55,4.8,stone,light,12)
    art.tube(at(0,0,5.55),.57,.35,1.65,light,light,10);art.tube(at(0,0,7.2),.25,.29,.5,bronze,bronze,10)
    beam(art,at(-.63,0,5.7),at(-.63,0,8.21),.046,bronze)
    for d,kind in ((2584,'rathaus'),(3154,'votiv')):
        at,h=site(k,d,32)
        width=73 if kind=='rathaus' else 34
        art.box(at(0,5,0),(width,13,18),h,stone)
        art.roof(at(0,5,18),width,14,7,h,slate)
        spires=((-30,33),(-18,39),(0,76),(18,39),(30,33)) if kind=='rathaus' else ((-12,64),(12,64))
        for x,ht in spires:
            spire(at,x,-2,0,ht)
            for dx in (-2.7,2.7):spire(at,x+dx,-4,ht*.37,ht*.19)
        for x in range(-width//2+3,width//2,4):
            art.box(at(x,-1.64,3),(1.9,.2,7.2),h,iron)
    return {'efforts':0}


THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.5,
       'terrain':{'sea':False},'land':{'mid':0x869759},
       'sky':[0xE2E6E2,0xD8E6EC,0xB8D8EB,0x9EC7E1,0x84B4D5],
       'haze':0xCFD8D8,'light':[0xFFE6BE,1.3],'fill':[0xE3EDF3,0xB5B29C],
       'sun_altitude':.69,'sun_azimuth':-.81}
