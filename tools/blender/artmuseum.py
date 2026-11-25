"""Benjamin Franklin Parkway: seven timed circuits, a single museum and its east steps."""
import math
from mathutils import Vector
from bisect import bisect_right
from worldkit import Painted,lin,smooth

RADIUS=27.0
TURN=math.pi*RADIUS
RISER=.17
TREAD=.72
FLIGHT=12*TREAD
LANDING=4.0
STAIRS=6*FLIGHT+5*LANDING
TOP=72*RISER
TERRACE=4.0


def stair_height(x):
    x+=TERRACE
    if x>=0:return TOP
    if x<=-STAIRS:return 0
    span=x+STAIRS
    flight=min(5,int(span/(FLIGHT+LANDING)))
    steps=flight*12+min(12,(span-flight*(FLIGHT+LANDING))/TREAD)
    return steps*RISER


def return_bend(t):
    theta=t/RADIUS
    return RADIUS*math.sin(theta),RADIUS*(1-math.cos(theta)),TOP*(1-smooth(TERRACE,TURN,t)),theta


def centre(distance,ends):
    """Work stages meet the same terrace. Recovery lengths set the far turn of each loop."""
    if distance<=ends[0]:
        x=distance-ends[0]
        return x,0,stair_height(x),0
    i=bisect_right(ends,distance)-1
    elapsed=distance-ends[i]
    if elapsed<TURN:return return_bend(elapsed)
    if i==len(ends)-1:return -(elapsed-TURN),2*RADIUS,0,math.pi
    lap=ends[i+1]-ends[i];straight=(lap-2*TURN)/2
    elapsed-=TURN
    if elapsed<straight:return -elapsed,2*RADIUS,0,math.pi
    elapsed-=straight
    if elapsed<TURN:
        theta=elapsed/RADIUS
        return -straight-RADIUS*math.sin(theta),RADIUS*(1+math.cos(theta)),0,math.pi+theta
    x=elapsed-TURN-straight
    return x,0,stair_height(x),0


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    ends=[stage['to'] for stage in stages if stage['kind']=='work']
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        x,y,z,h=centre(d,ends)
        before=centre(d-.1,ends);after=centre(d+.1,ends)
        bend=math.atan2(math.sin(after[3]-before[3]),math.cos(after[3]-before[3]))/.2
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=bend,g=(after[2]-before[2])*500))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,0


def parkland(road,col,theme,bc):
    b=bc.Builder('Parkway lawns','terrain');b.colours=[]
    for x in range(-2280,260,20):
        for y in range(-270,300,26):
            b.quad((x,y,-.18),(x+20,y,-.18),(x+20,y+26,-.18),(x,y+26,-.18))
            tint=lin(0x789052 if (x//20)%3 else 0x758C52)
            b.colours.extend((tint,)*4)
    return b.build(col),lambda x,y:-.18


def road_builder(road,st,length,col,bc):
    """The circuits share the entrance boulevard. Draw the pavement once at each physical location."""
    asphalt=bc.Builder('Road','asphalt')
    paint=bc.Builder('Lane dashes','paint')
    terrace=bc.Builder('Smooth centre of the museum steps','promenade')
    def ribbon(builder,samples,half):
        prev=None
        for x,y,z,h in samples:
            cs,sn=math.cos(h),math.sin(h)
            pair=((x+sn*half,y-cs*half,z),(x-sn*half,y+cs*half,z))
            if prev:builder.quad(prev[0],pair[0],pair[1],prev[1])
            prev=pair
    ends=[s['to'] for s in st if s['kind']=='work']
    x0=-ends[0]-bc.LEAD_IN
    ribbon(asphalt,[(x0,0,0,0),(-STAIRS-TERRACE,0,0,0)],5.8)
    ribbon(asphalt,[(x0,2*RADIUS,0,0),(0,2*RADIUS,0,0)],5.8)
    for a in sorted({round((b-a-2*TURN)/2,4) for a,b in zip(ends,ends[1:])}):
        ribbon(asphalt,[(-a-RADIUS*math.sin(j*math.pi/40),RADIUS*(1+math.cos(j*math.pi/40)),0,math.pi+j*math.pi/40) for j in range(41)],5.8)
    ribbon(asphalt,[return_bend(j*TURN/48) for j in range(49)],5.8)
    xs=sorted({-STAIRS-TERRACE,-TERRACE,0,*[min(-TERRACE,-STAIRS-TERRACE+n*(FLIGHT+LANDING)+off) for n in range(6) for off in (0,FLIGHT)]})
    ribbon(terrace,[(x,0,stair_height(x)+.012,0) for x in xs],.93)
    for y in (0,2*RADIUS):
        for x in range(int(x0),-80 if y==0 else -8,13):
            for lane in (-1.95,1.95):
                paint.box((x,y+lane,.014),(4,.12,.008))
    for b in (asphalt,paint,terrace):b.build(col)


THEME={'lay':route,'land_builder':parkland,'road_builder':road_builder,'land':{'mid':0x778B54},
       'terrain':{'sea':False},'edge':'parkway','kerbs':False,'sky':[0xE2E6DA,0xC9DDE4,0xA9CADB,0x8BB8D4,0x77A9CF],
       'haze':0xD7DDD6,'light':[0xFFF0D0,3.0],'fill':[0xD8E7ED,0x9A9678],'sun_altitude':.59,'sun_azimuth':2.38,
       'palette':{'asphalt':0x707174,'promenade':0xBAAB92}}


def column(art,x,y,z,r,h):
    stone,cap,shade=map(lin,(0xCBAD78,0xD8BF90,0xAF956F))
    art.box((x,y,z),(2.6*r,2.6*r,.42),0,cap)
    art.tube((x,y,z+.42),1.17*r,r,.56,cap,stone,14,stone)
    art.tube((x,y,z+.98),r,r*.87,h-2.0,stone,shade,16)
    art.tube((x,y,z+h-1.02),r*.87,r*1.26,.57,shade,cap,14,cap)
    art.box((x,y,z+h-.45),(2.6*r,2.6*r,.45),0,cap)


def portico(art,x,y,width,h,pillars,floor):
    stone,pale,shadow=map(lin,(0xC5A671,0xDAC18D,0x8D795F))
    for j in range(pillars):
        column(art,x,y+(j/(pillars-1)-.5)*(width-3.0),floor,1.0 if pillars>4 else .81,h)
    art.box((x+2.9,y,floor+h),(7.7,width+2,1.4),0,pale)
    tri=((x-1.02,y-width/2-1,floor+h+1.42),(x-1.02,y+width/2+1,floor+h+1.42),(x-1.02,y,floor+h+6.2))
    art.face(tri,(stone,)*3);art.face(tri[::-1],(stone,)*3)
    # Deep coloured tympanum just inside the stone edge.
    inset=((x-1.06,y-width/2+1.5,floor+h+1.75),(x-1.06,y+width/2-1.5,floor+h+1.75),(x-1.06,y,floor+h+5.45))
    art.face(inset,(shadow,)*3);art.face(inset[::-1],(shadow,)*3)
    art.roof((x+3.2,y,floor+h+1.45),8.0,width+2,4.65,0,lin(0x897A6B))


def museum(art):
    wall,stone,glass,roof=map(lin,(0xBA9A6C,0xCDB58B,0x526575,0x776D64))
    art.box((49,0,TOP-.10),(30,122,16.4),0,wall)
    for wing in (-1,1):
        y=wing*48
        art.box((33,y,TOP-.18),(32,21,16),0,wall)
        art.roof((33,y,TOP+15.8),32,21,3.1,0,roof)
        portico(art,15,y,21,13.8,5,TOP+1)
    portico(art,28,0,34,17.4,8,TOP+1)
    for y in range(-56,57,4):
        art.box((33.9,y,TOP+3),(.16,1.8,4.1),0,glass)
        art.box((33.9,y,TOP+9),(.16,1.8,3.1),0,glass)
        art.box((33.7,y,TOP+7.0),(.47,2.35,.35),0,stone)
    art.box((9,-4,TOP-.32),(26,48,.31),0,stone)
    for flight in range(6):
        for k in range(12):
            x=-STAIRS-TERRACE+flight*(FLIGHT+LANDING)+k*TREAD
            z=(flight*12+k+1)*RISER
            for side in (-1,1):
                art.box((x+TREAD/2,side*8.55,-.12),(TREAD,15.25,z+.12),0,lin(0xA8A397 if k%3 else 0xABA69B))
        if flight<5:
            x=-STAIRS-TERRACE+flight*(FLIGHT+LANDING)+FLIGHT
            for side in (-1,1):
                art.box((x+LANDING/2,side*8.55,-.12),(LANDING,15.25,(flight+1)*12*RISER+.12),0,lin(0xAAA699))


def person(art,x,y,z,scale,colour,raised=False):
    bronze=colour
    def p(u,v,h):return (x+u*scale,y+v*scale,z+h*scale)
    for side in (-1,1):
        art.tube(p(0,side*.12,0),.084*scale,.12*scale,.88*scale,bronze,bronze,7)
    art.tube(p(0,0,.84),.18*scale,.25*scale,.57*scale,colour,bronze,8)
    art.tube(p(0,0,1.43),.115*scale,.135*scale,.25*scale,bronze,bronze,8,bronze)
    for side in (-1,1):
        end=p(-.06,side*(.5 if raised else .32),2.05 if raised else .82)
        beam(art,p(0,side*.19,1.33),end,.14*scale,bronze)
        if raised:art.tube(end,.14*scale,.105*scale,.15*scale,bronze,bronze,8,bronze)


def fountain(art,x,y,washington):
    stone,bronze,water,spray=map(lin,(0xABA89A,0x54645B,0x859D9E,0xB6CFD1))
    r=10.4 if washington else 12.0
    art.tube((x,y,-.10),r,r,.69,stone,stone,32,stone)
    art.tube((x,y,.60),r-.33,r-.33,.05,water,water,32,water)
    if washington:
        for j in range(5):
            size=6.4-j*.74
            art.box((x,y,.65+j*.9),(size,size,.9),0,stone)
        art.box((x,y,5.15),(3.1,2.6,2.8),0,stone)
        # Four legs, elevated head and mounted rider give the monument its silhouette.
        for u in (-1.03,.94):
            for v in (-.32,.32):
                beam(art,(x+u,y+v,7.96),(x+.85*u,y+v,9.18),.23,bronze)
        art.box((x,y,9.14),(2.55,1.02,1.10),0,bronze)
        beam(art,(x+1.0,y,9.64),(x+1.6,y,10.93),.58,bronze)
        art.box((x+1.83,y,10.72),(.68,.42,.43),0,bronze)
        person(art,x-.14,y,9.77,.92,bronze)
    else:
        art.tube((x,y,.62),1.8,1.4,.9,stone,stone,12,stone)
        for j in range(3):
            a=j*math.tau/3
            person(art,x+4.5*math.cos(a),y+4.5*math.sin(a),.65,1.51,bronze)
        for j in range(14):
            a=j*math.tau/14
            for n in range(8):
                t=n/8;t2=(n+1)/8
                def pt(q):
                    radius=2.9+5.7*q
                    return x+radius*math.cos(a),y+radius*math.sin(a),.7+12.5*q*(1-q)
                beam(art,pt(t),pt(t2),.085,spray)
        art.tube((x,y,1.5),.28,.06,6.6,spray,spray,9)


def scenery(k):
    art=Painted(k)
    museum(art)
    fountain(art,-175,16,True)
    fountain(art,-1630,17,False)
    bronze=lin(0x586455)
    art.box((-68,-10.7,-.12),(2.55,2.55,1.34),0,lin(0x8F897B))
    person(art,-68,-10.7,1.22,1.55,bronze,True)
    # The median and rows of mature plane trees run along both carriageways.
    for x in range(-2010,2,19):
        for y in (-13,12,42,67):
            if abs(x+175)<41 or abs(x+1630)<43 or (x>-115 and abs(y)<15):continue
            h=k.rng.uniform(7.1,10.9)
            wood=lin(0xA39B7B)
            art.tube((x,y,-.15),.42,.24,h*.67,wood,wood,8)
            for j in range(3):
                a=j*2.09+k.rng.uniform(-.2,.2)
                dx,dy=2.3*math.cos(a),2.3*math.sin(a)
                beam(art,(x,y,h*.50),(x+dx,y+dy,h*.84),.22,wood)
                leaves=lin(k.rng.choice((0x678650,0x779258,0x80975C,0x647D50)))
                art.tube((x+dx,y+dy,h*.71),1.45,3,1.58,leaves,leaves,9)
                art.tube((x+dx,y+dy,h*.71+1.58),3,.35,1.86,leaves,leaves,9,leaves)
    skyline(art)
    flags(k,art)
    return {'efforts':0}

def beam(art,a,b,width,tint):
    a,b=Vector(a),Vector(b);axis=(b-a).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01:side=Vector((1,0,0))
    side.normalize();up=axis.cross(side).normalized()
    offsets=[(side*u+up*v)*width*.5 for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for i in range(4):
        j=(i+1)%4
        art.face((a+offsets[i],b+offsets[i],b+offsets[j],a+offsets[j]),(tint,)*4)



def skyline(art):
    stone,glass=lin(0xADAA98),lin(0x69848E)
    x,y=-2090,3
    art.box((x,y,0),(57,55,21),0,stone)
    for h,w in ((21,17),(34,13),(47,9),(60,6)):
        art.box((x,y,h),(w,w,13),0,stone)
    art.tube((x,y,73),5,1.9,8,glass,glass,8,glass)
    person(art,x,y,81,2.2,lin(0x596B62))
    for j,(u,v,h) in enumerate(((-76,-90,106),(-85,-48,138),(-112,56,97),(-168,73,126),(-91,96,72))):
        art.box((x+u,y+v,0),(20,22,h),0,glass)
        for z in range(9,h,10):
            art.box((x+u,y+v,z),(20.3,22.3,.48),0,lin(0x91A3A9))
        art.tube((x+u,y+v,h),12,1.1,18 if j%2 else 12,glass,glass,4,glass)


def flags(k,art):
    bands=((0x3B5685,0xE6E2CD,0xAB5149),(0x5D8059,0xEEE4CF,0xA9574C),(0x333F47,0xB35549,0xDDBA62),
           (0x496D96,0xD4B35D,0x496D96),(0xA5574D,0xEBDCC4,0xA5574D),(0x6489A5,0xE4DFCF,0x6489A5))
    metal=lin(0x696E65)
    for j,x in enumerate(range(-1960,-95,33)):
        for side in (-1,1):
            y=side*7.55
            art.tube((x,y,0),.073,.049,6.45,metal,metal,7,metal)
            colours=bands[(j+(side+1))%len(bands)]
            for strip,c in enumerate(colours):
                a,b=strip*.61,(strip+1)*.61
                def p(u,h):return (x+u,y+.11*math.sin(u*4),h-u*.09)
                pts=(p(a,5.15),p(b,5.15),p(b,6.32),p(a,6.32))
                art.face(pts,(lin(c),)*4);art.face(pts[::-1],(lin(c),)*4)
