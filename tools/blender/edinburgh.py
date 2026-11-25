"""Old Town's high street rises through the Fringe to Edinburgh Castle."""
import math
import random

from worldkit import Painted, lin

PROFILE=((0,30),(1340,48),(2570,57),(3550,52),(4680,72),(5410,75),(6520,71),(7800,95),(8655,111))


def elevation(d):
    for (a,h),(b,z) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return h+(z-h)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    return 1.2+.24*math.sin(d/278)+.16*math.sin(d/130)+.33*math.tanh((d-3980)/150)-.3*math.tanh((d-4730)/175)


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x,y=0,-bc.LEAD_IN
    rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def pavement(r,stages,length,col,bc):
    stones=bc.Builder('Old Town cambered setts and flags','terrain');stones.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,z,tone in ((-40,-7.6,.22,.22,0x8c8b88),(-7.6,-7.45,.22,-.03,0x646974),(-7.45,0,-.03,.09,0x76777c),(0,7.45,.09,-.03,0x76777c),(7.45,7.6,-.03,.22,0x646974),(7.6,40,.22,.22,0x8c8b88)):
            pts=[r.at(j,l,v) for j,l,v in ((i,b,z),(i,a,h),(i+1,a,h),(i+1,b,z))]
            stones.faces.append(tuple(stones.v(p) for p in pts));stones.colours.extend([lin(tone)]*4)
    stones.build(col)


def land(r,col,theme,bc):
    return None,lambda x,y: r.s[r.tree.find((x,y,0))[1]]['z']-.12


def scenery(k):
    r=k.road;art=Painted(k);rng=random.Random(2116)
    def box(d,l,z,w,depth,h,tint):
        art.box(r.pos(d,l,z),(w,depth,h),bearing(d),lin(tint))
    def cylinder(d,l,z,rad,cap,h,tint,n=12):
        art.tube(r.pos(d,l,z),rad,cap,h,lin(tint),lin(tint),n,lin(tint))
    def beam(a,b,radius,tint):
        delta=tuple(q-p for p,q in zip(a,b));length=math.sqrt(sum(v*v for v in delta))
        if length<.001:return
        v=tuple(x/length for x in delta)
        ref=(0,0,1) if abs(v[2])<.98 else (0,1,0)
        def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
        u=cross(v,ref);norm=math.sqrt(sum(x*x for x in u));u=tuple(x/norm for x in u);w=cross(v,u)
        def ring(p):
            return [tuple(p[i]+radius*(u[i]*math.cos(j*math.tau/8)+w[i]*math.sin(j*math.tau/8)) for i in range(3)) for j in range(8)]
        ra,rb=ring(a),ring(b)
        for j in range(8):art.face((ra[j],ra[(j+1)%8],rb[(j+1)%8],rb[j]),(lin(tint),)*4)
    # Six-storey lands stand tight to the street. Gaps run back between their party walls as closes.
    for j,d in enumerate(range(-72,8560,24)):
        for side in (-1,1):
            if side==-1 and (1370<d<1530 or 4660<d<4900):continue
            if side==1 and 5180<d<5530:continue
            if d>8210 and side==-1:continue
            lane=side*(20+(j%5)*.42)
            h=(4+(j+int(side))%3)*3.13+1.3
            w=21.7 if j%4 else 18.5;tone=(0x918376,0x948d7e,0x847f78,0xb09c84)[j%4]
            box(d,lane,-.3,w,15.2,h,tone)
            art.roof(r.pos(d,lane,h-.28),w+1,16,3.26,bearing(d),lin(0x5b616b))
            for end in (-1,1):
                for step in range(6):
                    box(d+end*(w*.5-.25),lane,h-.3+step*.55,.65,15.9-step*2.5,.64,tone)
            for chimney in (-.29,.31):
                box(d+w*chimney,lane,h+1.38,1.11,.90,3.0,0x776a5c)
                for pot in (-.29,.29):cylinder(d+w*chimney+pot,lane,h+4.3,.135,.19,.60,0xae785e,8)
    def cornice(d,l,z,w,dep):
        for h,over in ((.0,.3),(.21,.56),(.47,.38)):box(d,l,z+h,w+over,dep+over,.26,0xb2a492)
    # Tron Kirk has a tall, narrow clock tower with an octagonal tapering steeple.
    d,l=1455,-24
    box(d,l,.1,28,14,11.4,0x9a8c79);art.roof(r.pos(d,l,11.4),29.5,15.4,6.0,bearing(d),lin(0x535761))
    box(d-9,l+3,.0,6.65,6.5,20,0x948676);cornice(d-9,l+3,19.5,6.7,6.6)
    cylinder(d-9,l+3,20.2,3.5,2.88,6.9,0x817565,8)
    cylinder(d-9,l+3,27.1,2.98,.18,18.6,0x595956,8)
    cylinder(d-9,l+3,45.6,.12,.04,2.3,0x977c54)
    # St Giles' transepts, buttresses, traceried windows and open crown tower.
    d,l=4795,-25
    for along,off,w,dep,h in ((0,0,55,17,14),(2,0,17,35,15),(-15,0,21,21,11.3)):
        box(d+along,l+off,.05,w,dep,h,0x8a847a)
        art.roof(r.pos(d+along,l+off,h-.1),w+.8,dep+.95,5.1,bearing(d),lin(0x575f65))
    for along in range(-24,26,6):
        for side in (-1,1):
            box(d+along,l+side*8.72,1.5,2.6,.22,9.2,0x41494e)
            for bar in (-.6,0,.6):box(d+along+bar,l+side*8.90,1.6,.10,.14,9.25,0xaeaa95)
            box(d+along-2.1,l+side*9.4,.1,.82,2.2,12.1,0xa39a87)
    box(d,l,12,10,10,17,0x898675);cornice(d,l,28.75,10.0,10.0)
    for side in (-1,1):
        for corner in (-1,1):
            cylinder(d+corner*4.8,l+side*4.8,28.8,.79,.09,4.2,0xa49a88,8)
            def rib(t):
                f=1-math.sin(t*math.pi/2)
                return r.pos(d+corner*4.7*f,l+side*4.7*f,30+9.8*math.sin(t*math.pi/2)**.74)
            for n in range(9):beam(rib(n/9),rib((n+1)/9),.38,0xb3a995)
    cylinder(d,l,39.55,1.27,.26,3.9,0xa3987e,8)
    cylinder(d,l,43.35,.11,.06,2.7,0xa39b80)
    # Castle Rock, Half Moon Battery, the Great Hall and upper towers above the Esplanade.
    d,l=8608,29
    cx,cy,cz=r.pos(d,l);yaw=bearing(d);rings=[]
    for radius,z in ((1,-12),(.91,0),(.73,14),(.61,23)):
        ring=[]
        for n in range(31):
            t=n*math.tau/31;wave=1+.11*math.sin(t*9)+.06*math.sin(t*5+.5)
            x=(80*radius*wave)*math.cos(t);y=(50*radius*wave)*math.sin(t)
            ring.append((cx+x*math.cos(yaw)-y*math.sin(yaw),cy+x*math.sin(yaw)+y*math.cos(yaw),cz+z+2.5*math.sin(3*t)))
        rings.append(ring)
    for a,b in zip(rings,rings[1:]):
        for n in range(31):
            t=lin(rng.choice((0x56585a,0x645f5b,0x77736b,0x4e5558)))
            art.face((a[n],a[(n+1)%31],b[(n+1)%31],b[n]),(t,)*4)
    art.face(rings[-1],(lin(0x918975),)*31)
    cylinder(d-29,l-4,12,16.5,17.2,14.3,0x90836f,24)
    for along,off,w,dep,h in ((12,1,34,18,12),(-4,14,22,11,14),(28,-8,15,11,13)):
        box(d+along,l+off,22,w,dep,h,0x988a74)
        art.roof(r.pos(d+along,l+off,22+h),w+1,dep+1,4.5,bearing(d),lin(0x655957))
        for win in range(-int(w/2)+3,int(w/2),4):
            box(d+along+win,l+off-dep*.5-.10,27,1.1,.16,2.0,0x42474b)
    for n in range(30):
        t=n*math.tau/30
        box(d-29+16.7*math.cos(t),l-4+16.7*math.sin(t),26.1,1.5,1.05,1.28,0xa89a80)
    # Temporary stage canopies and backdrops at the booked Fringe pitches.
    for station in (370,2550,2660,4515,5420,7340):
        side=1 if station%3 else -1
        box(station,side*9.65,.22,7.0,3.7,.56,0x47474c)
        for a in (-3,3):
            for offset in (-1.5,1.5):box(station+a,side*9.65+offset,.77,.10,.10,3.34,0x969ca0)
        art.roof(r.pos(station,side*9.65,4.08),7.8,4.5,1.2,bearing(station),lin(0xa82958 if side>0 else 0x355e75))
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=pavement,land_builder=land,road_half_width=7.45,wet=.38,
           terrain={'sea':False},land={'mid':0x596550},sky=[0xd2cbc0,0xc7ccca,0xaebdc8,0x91a7b8,0x8197ad],
           haze=0xc8c9c8,palette={'asphalt':0x57585b,'sea':0x596550},light=[0xffefcf,2.35],
           fill=[0xd1dce6,0x737271],sun_azimuth=2.25,sun_altitude=.66)
