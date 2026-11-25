"""Three circuits around the fixed Concorde and Charles de Gaulle islands."""
import math
from worldkit import Painted, lin, smooth
from mathutils import Vector

LENGTH = 10462.5
LAP = LENGTH/3
RADIUS = 31
TURN = math.pi*RADIUS
AVENUE = (LAP-2*TURN)/2
LINE = 400


def position(d):
    s=(d+LINE)%LAP
    if s<AVENUE:
        return s,-RADIUS,0
    if s<AVENUE+TURN:
        t=(s-AVENUE)/RADIUS
        return AVENUE+RADIUS*math.sin(t),-RADIUS*math.cos(t),t
    if s<2*AVENUE+TURN:
        return 2*AVENUE+TURN-s,RADIUS,math.pi
    t=(s-2*AVENUE-TURN)/RADIUS
    return -RADIUS*math.sin(t),RADIUS*math.cos(t),math.pi+t


def height(x):
    return 31*smooth(0,AVENUE,x)


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    assert stages[-1]['to']==LENGTH
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=position(d)
        before=position(d-.5);after=position(d+.5)
        angle=after[2]-before[2]
        samples.append(dict(d=d,x=x,y=y,z=height(x),h=h,k=math.atan2(math.sin(angle),math.cos(angle)),g=100*(height(after[0])-height(before[0]))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return samples,stages,LENGTH,mean,0


def land(road,col,theme,bc):
    b=bc.Builder('Paved avenue and square margins','terrain');b.colours=[]
    for x in range(-280,1990,8):
        for a,c,tint in ((-280,-61,0xB5AD95),(-61,-40,0xC4B99F),(-40,40,0x999792),(40,61,0xC4B99F),(61,280,0xB7AB98)):
            b.quad((x,a,height(x)-.12),(x+8,a,height(x+8)-.12),(x+8,c,height(x+8)-.12),(x,c,height(x)-.12))
            b.colours.extend((lin(tint),)*4)
    return b.build(col),lambda x,y:height(x)-.12


def roadway(road,st,length,col,bc):
    roadbed=bc.Builder('Road','asphalt')
    # One paved surface serves all three timed laps, with physical UVs separate from stage distances.
    for d in range(0,math.ceil(LAP),3):
        def edge(s,l):
            x,y,h=position(s)
            return (x-math.sin(h)*l,y+math.cos(h)*l,height(x))
        end=min(d+3,LAP)
        roadbed.quad(edge(d,-7.75),edge(end,-7.75),edge(end,7.75),edge(d,7.75))
    for x in range(0,math.ceil(AVENUE),4):
        end=min(x+4,AVENUE)
        roadbed.quad((x,-RADIUS+7.73,height(x)-.027),(end,-RADIUS+7.73,height(end)-.027),
                     (end,RADIUS-7.73,height(end)-.027),(x,RADIUS-7.73,height(x)-.027))
    roadbed.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':7.75,
       'terrain':{'sea':False},'land':{'mid':0xB6AC92},
       'sky':[0xF3BE93,0xEDB7AE,0xCCAEC2,0xA6A9C8,0x8A9FBE],'haze':0xE7C6AB,
       'light':[0xFFCE8C,2.8],'fill':[0xCAD6E5,0x9C9479],
       'sun_azimuth':.45,'sun_altitude':.29,'palette':{'asphalt':0x998D81},'chunks':{'Land':2}}


def beam(art,a,b,r,tint,sides=4):
    start,end=Vector(a),Vector(b);axis=(end-start).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.001:side=Vector((1,0,0))
    side.normalize();up=axis.cross(side)
    ring=[r*(side*math.cos(j*math.tau/sides)+up*math.sin(j*math.tau/sides)) for j in range(sides)]
    c=lin(tint)
    for j,q in enumerate(ring):
        n=ring[(j+1)%sides];art.face((start+q,start+n,end+n,end+q),(c,)*4)


def scenery(k):
    art=Painted(k);city=Painted(k,'peaks');rng=k.rng
    def box(x,y,z,sx,sy,sz,tint,part=art):
        part.box((x,y,z),(sx,sy,sz),0,lin(tint))
    # The main vault is built from successive courses whose openings close towards the keystone.
    # Separate front and rear piers leave a lateral passage open below their impost.
    z=height(AVENUE);stone=0xC8BBA4;warm=0xD7C9AB;shade=0xAB9B85
    for sign in (-1,1):
        cy=sign*15
        for side in (-1,1):
            x=AVENUE+side*7.4
            box(x,cy,z,6,14,18,stone,city)
            box(x,cy,z,7,15,1.7,shade,city)
            box(x,cy,z+1.7,6.5,14.6,1,warm,city)
            box(x,cy,z+8,6.4,9.7,.7,warm,city)
            box(x,cy,z+9,6.25,7.4,8.0,shade,city)
            for j in range(11):
                dx=x+side*3.25
                city.tube((dx,cy+(j%5-2)*1.13,z+9+(j//5)*2.0),.64,.48,2.65,lin(shade),lin(warm),6,lin(stone))
        box(AVENUE,cy,z+18,21,14,3.2,stone,city)
    for course in range(16):
        a=course*.56;inner=math.sqrt(max(0,8.9**2-a*a))
        span=22-inner
        for sign in (-1,1):
            box(AVENUE,sign*(inner+span/2),z+21.1+a,21,span,.59,stone if course%3 else warm,city)
    for at,w,depth,h,c in ((30,45,22,2,warm),(32,44,21,5,stone),(37,46.4,22.5,1.6,shade),(38.5,45,22,1.2,warm),(39.7,43.5,20.3,5.2,stone),(44.8,46.2,22.3,.95,warm)):
        box(AVENUE,0,z+at,depth,w,h,c,city)
    for face in (-1,1):
        for i in range(25):
            y=(i-12)*1.62
            box(AVENUE+face*10.7,y,z+33.3,.55,1.17,2.55,shade,city)
        for i in range(9):
            box(AVENUE+face*10.3,(i-4)*4.65,z+40.7,.43,3.85,2.6,warm,city)
    # Concorde island. Four tapering faces lead to the gilded pyramidion.
    for high,low,top,rise,tint in ((0,3.9,3.9,1.0,shade),(1,2.9,2.8,2.3,stone),(3.3,2.0,1.08,20.5,0xCDA778),(23.8,1.10,0,2.1,0xDBB764)):
        art.tube((0,0,high),low,top,rise,lin(tint),lin(tint),4,lin(tint))
    for y in (-15,15):
        for h,r0,r1,top,c in ((0,4.8,4.8,.63,0xC2A790),(.62,4.45,4.45,.08,0x89A9A3),(.67,.85,.54,2.2,0x566F64),(2.6,1.1,2.24,.45,0x597C6D),(3,.48,.3,1.1,0xA99A64),(4,.58,1.12,.31,0x668476)):
            art.tube((0,y,h),r0,r1,top,lin(c),lin(c),24,lin(c))
        for j in range(6):
            a=j*math.tau/6;beam(art,(math.cos(a),y+math.sin(a),2.8),(math.cos(a)*3,y+math.sin(a)*3,1.0),.057,0xB6D0C6)
    # A fixed Eiffel Tower in the Seine-side haze, with spreading feet, decks and tapering lattice.
    ex,ey=-240,-330
    levels=((0,26),(46,13),(92,8),(142,4),(208,1.4))
    for (h0,r0),(h1,r1) in zip(levels,levels[1:]):
        for sx,sy in ((-1,-1),(1,-1),(1,1),(-1,1)):
            a=(ex+sx*r0,ey+sy*r0,h0);b=(ex+sx*r1,ey+sy*r1,h1)
            beam(city,a,b,1.25,0x8A8177)
            beam(city,a,(ex-sx*r1,ey+sy*r1,h1),.48,0x9B8C7F)
        box(ex,ey,h1,2*r1+2,2*r1+2,1.8,0x8E8378,city)
    beam(city,(ex,ey,207),(ex,ey,234),.77,0x998B7B)
    return streets(k,art,city,box)


def streets(k,art,city,box):
    rng=k.rng
    steel=0x576269
    for side in (-1,1):
        # Continuous Parisian street wall, with short cross-street gaps between blocks.
        x=18
        while x<AVENUE-25:
            w=rng.uniform(17,32); cx=x+w/2;z=height(cx);y=side*62
            if int(x//104)!=int((x+w)//104):x+=8
            floors=rng.choice((4,5,5,6));body=4.4+floors*2.95
            shade=rng.choice((0xDDCCAC,0xCBBAA2,0xE2D5B9,0xC9B8A5))
            box(cx,y,z,w,16,body,shade);front=side*53.9
            for j in range(max(3,int(w/3))):
                wx=x+2.0+j*3.05
                box(wx,front,z+.26,2.45,.24,3.4,0x4C5051)
                box(wx,front-side*.54,z+3.28,2.62,1.18,.18,0xA56952 if j%3 else 0xDAB989)
                for floor in range(floors):
                    h=z+5.1+floor*2.95
                    box(wx,front,h,1.25,.26,1.89,0x65666B)
                    box(wx,front-side*.11,h-.16,1.73,.51,.19,0xE4D4BA)
                    if floor in (1,floors-1):
                        box(wx,front-side*.39,h+.42,1.7,.11,.075,0x555453)
                        for off in (-.71,0,.71):
                            box(wx+off,front-side*.39,h-.04,.05,.055,.5,0x545451)
            box(cx,y,z+body,w+1,16.8,.42,0xE9D5B2)
            art.roof((cx,y,z+body+.4),w+1,17,3.7,0,lin(0x747985))
            for j in range(3,int(w)-2,6):
                box(x+j,side*57,z+body+1.15,1.38,1.1,1.66,0xC8C2B6)
                box(x+j,side*56.35,z+body+1.3,.82,.1,.92,0x6C7780)
            if int(x)//24%3==0:
                for i in range(3):
                    tx=cx+(i-1)*3
                    art.tube((tx,side*48,z),.09,.09,1.62,lin(steel),lin(steel),5)
                    art.tube((tx,side*48,z+1.59),1.30,.12,.58,lin(0xA45547),lin(0xDF9B7B),8)
            x+=w
        for x in range(8,int(AVENUE)-5,12):
            y=side*50.5;z=height(x)
            art.tube((x,y,z-.2),.35,.22,4.8,lin(0x787663),lin(0xACAA8C),7)
            for v in (-1,1):
                beam(art,(x,y,z+2.55),(x+v*1.4,y,z+5.45),.16,0x898975)
            art.box((x,y,z+4.25),(7.7,4.8,4.1),0,lin(rng.choice((0x637D57,0x758959,0x718457))))
            art.box((x,y,z+8.30),(7.2,4.3,.48),0,lin(0x8D9A65))
        for x in range(6,int(AVENUE)-5,28):
            y=side*40.8;z=height(x)
            art.tube((x,y,z),.22,.10,5.3,lin(0x475655),lin(0x6A7164),8)
            for v in (-1,1):
                beam(art,(x,y,z+4.8),(x+v*.69,y,z+5.55),.07,0x52615D)
                art.tube((x+v*.69,y,z+5.5),.21,.31,.53,lin(0xD5BD8C),lin(0xF4DDA9),6,lin(0xE9CE9B))
        for x in range(0,int(AVENUE),3):
            y=side*39.0;z=height(x);nextz=height(x+3)
            for h in (.42,1.07):
                beam(art,(x,y,z+h),(x+3,y,nextz+h),.043,0x879393)
            beam(art,(x,y,z),(x,y,z+1.10),.048,0x687475)
            if 50<x<LINE+100:
                tint=(0xD1BA57,0x6E8397,0xC1AAA0,0x8A9777)[int(x//12)%4]
                box(x+1.5,y-side*.08,z+.18,2.87,.11,.69,tint)
        # Close spectators have distinct heads and shoulders; the rear rows are merged with stand seating.
        for x in range(5,int(AVENUE)-4,2):
            for j in range(2 if x<LINE+100 else 1):
                xx=x+rng.random()*.9;y=side*(40+j*1.1+rng.random()*.5);z=height(xx)+j*.38
                tone=rng.choice((0x997050,0xB67C5E,0xCA9775,0xE4B38F,0x77533E))
                shirt=rng.choice((0xC8BEA6,0xC38266,0x6D8D9C,0xC15D4E,0x6E8868,0xA29BB3))
                art.tube((xx,y,z),.13,.18,.86,lin(0x4C5054),lin(0x5C6062),5)
                art.tube((xx,y,z+.80),.17,.22,.63,lin(shirt),lin(shirt),6)
                art.tube((xx,y,z+1.45),.13,.105,.24,lin(tone),lin(tone),6,lin(tone))
                if x%10==5:beam(art,(xx,y,z+1.26),(xx+.34,y-side*.21,z+1.80),.055,tone)
        for x in range(85,LINE+50,28):
            for tier in range(4):
                box(x,side*(43+tier*.95),height(x)+tier*.4,22,1.04,.32,0x866D6A)
    for x in range(25,LINE+140,3):
        y=-RADIUS+8.0;z=height(x)
        for h in (.4,1.08):beam(art,(x,y,z+h),(x+3,y,height(x+3)+h),.042,0x879393)
        beam(art,(x,y,z),(x,y,z+1.09),.048,0x687475)
    # Finish photo gantry and the distance boards stay fixed across the three laps.
    z=height(LINE)
    for y in (-RADIUS-8.1,-RADIUS+8.1):
        box(LINE,y,z,1.35,.86,6.05,0x665E52)
    box(LINE,-RADIUS,z+5.9,1.65,17.4,1.55,0xE7C74B)
    for i in range(26):
        for j in range(2):
            if (i+j)%2==0:
                box(LINE-.85,-RADIUS-7.85+i*.61,z+6.0+j*.28,.045,.61,.28,0x36393A)
    for rem in (300,200,100,50):
        x=LINE-rem;z=height(x);y=-RADIUS-7.95
        box(x,y,z,.14,.18,2.25,steel)
        box(x,y,z+1.64,.18,1.54,.83,0xD9C7A1)
        for j in range(rem//100 or 1):box(x-.11,y+(j-1)*.33,z+1.85,.06,.13,.41,0x776B59)
    return {'efforts':0}
