"""Route 9 Wind Farm: a straight prairie road over the starter map's original grades."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam


def route(course,theme,bc):
    samples,st,length,mean,per_level=bc.lay_centre_line(course,theme)
    for p in samples:p.update(x=p['d'],y=0.0,h=0.0,k=0.0)
    return samples,st,length,mean,per_level


def road(r,st,length,col,bc):
    b=bc.Builder('RouteNineAsphalt','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        strips=[(-5.1,5.1,.025,0xA19377),(-3.65,3.65,.061,0x5D6060),(-3.53,-3.46,.071,0xE3DCC2),(3.46,3.53,.071,0xE3DCC2)]
        if i%4==0:strips.append((-.061,.061,.073,0xE0BE75))
        for a,e,z,c in strips:
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def lateral(d,v):
    return (2.4*math.sin(d/346+v/177)+6.1*math.sin(v/242))*smooth(8,181,abs(v))+8*smooth(115,245,abs(v))


def land(r,col,theme,bc):
    fields=[bc.Builder('PrairieWheat','terrain'),bc.Builder('CanolaFields','terrain'),bc.Builder('FieldMargin','terrain')]
    for b in fields:b.colours=[];b.uvs=[]
    def ground(d,v):return r.pos(d)[2]+lateral(d,v)-.17
    for d in range(-90,18610,20):
        for j,(a,e) in enumerate(((-1850,-608),(-608,-310),(-310,-113),(-113,-9),(-9,9),(9,113),(113,310),(310,608),(608,1850))):
            idx=2 if j==4 or d%460==10 else int((d//460+j//2+int(j>4))%4==0)
            b=fields[idx];pts=[(x,y,ground(x,y)) for x,y in ((d,a),(d+20,a),(d+20,e),(d,e))];b.quad(*pts)
            for x,y,z in pts:
                warm=int(4*math.sin(x/106+y/78));b.colours.append(lin((0xBC9B65 if idx==0 else 0xB7A659 if idx==1 else 0x999266)+warm*0x010101));b.uvs.append((x/18,y/12))
    for b in fields:b.build(col)
    return None,ground


def scenery(k):
    art=Painted(k);siding=pictured(k,'ElevatorSiding');signs=pictured(k,'PrairieSigns');grass=pictured(k,'WheatHeads')
    white,wood,rust,steel,grain,dark=[lin(c) for c in (0xE9E3CC,0x907755,0xAD5C45,0xA5A29A,0xC6A36A,0x635649)]
    def panel(at,mesh,x,v,z,w,h,angle):
        dx=.5*w*math.cos(angle);dy=.5*w*math.sin(angle)
        picture(mesh,(at(x-dx,v-dy,z),at(x+dx,v+dy,z),at(x+dx,v+dy,z+h),at(x-dx,v-dy,z+h)),((0,0),(1,0),(1,1),(0,1)))
    # Wire loops, crossarms and sag repeat at full scale along the straight.
    for d in range(-72,18580,8):
        for side in (-1,1):
            at,h=site(k,d,side*7.9)
            art.box(at(0,0,-.18),(.15,.14,1.50),0,wood)
            for z in (.50,.93):
                beam(art,at(0,0,z),at(8,0,z+k.road.pos(d+8)[2]-k.road.pos(d)[2]),.026,.028,dark)
    for d in range(-16,18560,45):
        at,h=site(k,d,-10.5);art.tube(at(0,0,-.4),.22,.12,9.36,wood,wood,8,wood)
        art.box(at(0,0,8.28),(.20,3.7,.18),0,wood)
        for v in (-1.43,0,1.43):
            art.tube(at(0,v,8.43),.09,.11,.24,steel,steel,8,white)
            for j in range(4):
                def line(i):
                    x=i*11.25;return at(x,v,8.68+ k.road.pos(d+x)[2]-k.road.pos(d)[2]-.98*math.sin(math.pi*i/4))
                beam(art,line(j),line(j+1),.034,.034,dark)
    # Every rotor centre is a documented station and offset. The frontend animates the blades about that hub.
    for row in range(2):
        for j in range(58):
            d=152+j*320+row*97;v=(1 if j%3 else -1)*(91+row*230+24*math.sin(j*.91))
            at,h=site(k,d,v);base=lateral(d,v)-.17;high=61+(j%4)*3
            art.tube(at(0,0,base-.65),2.05,.92,high+.65,lin(0xACA797),white,12,white)
            art.box(at(0,0,base+high-.11),(5.74,2.52,2.31),0,white)
            art.tube(at(0,0,base-.14),3.3,3.3,.32,steel,white,14,steel)
    # Establish the gravel wind-farm service lane and an opening through its gate.
    at,h=site(k,2506,5);art.face((at(-4.1,0,.12),at(4.1,0,.12),at(11,97,1.8),at(4,97,1.8)),(lin(0xB6A687),)*4)
    at,h=site(k,2498,6.4);art.box(at(0,0,0),(.16,.16,2.17),0,wood);panel(at,signs,0,0,1.0,2.01,.93,-1.48)
    for d in range(76,18410,13):
        side=1 if d%3 else -1;v=side*(5.5+.48*math.sin(d*.37));at,h=site(k,d,v)
        for j in range(2):panel(at,grass,2.3*j,0,-.08,2.5,.95+.17*math.sin(d*.1+j),1.14+j*.54)
    def barn(d,v):
        at,h=site(k,d,v);base=lateral(d,v)-.15;side=1 if v>0 else -1
        art.box(at(0,0,base-.35),(21,12,6.0),0,rust);art.roof(at(0,0,base+5.65),21.5,12.5,4.2,0,lin(0x7E7769))
        for x in (-9,-3,3,9):art.box(at(x,-side*6.04,base),(.20,.15,5.63),0,white)
        art.box(at(1,-side*6.09,base),(4.4,.15,4.28),0,dark)
        for x in (13,20,27):
            art.tube(at(x,3,base-.33),2.96,2.96,8.03,steel,steel,16,white);art.tube(at(x,3,base+7.7),3.12,.22,2.33,steel,white,16,white)
            for z in (1,2.8,4.6,6.4):art.tube(at(x,3,base+z),3.01,3.01,.12,white,white,16)
        for j in range(12):
            x=-34+j*3.85;y=-side*(9+4*math.sin(j*2.1));cx,cy,_=at(x,y);z=k.height_at(cx,cy);n=14
            for i in range(n):
                a=i*math.tau/n;b=(i+1)*math.tau/n
                def point(t,vv):return (cx+1.22*math.cos(t),cy+vv,z+1.18+1.18*math.sin(t))
                art.face((point(a,-.92),point(b,-.92),point(b,.92),point(a,.92)),(grain,grain,wood,grain))
                art.face((point(a,-.93),point(b,-.93),(cx,cy-.93,z+1.18)),(grain,grain,wood))
    for station,v in ((240,-31),(1830,68),(4610,-71),(7280,56),(8770,31),(10050,-65),(15330,46),(17600,-59)):barn(station,v)
    # A wooden prairie elevator with a smaller headhouse, covered loading bay and parallel railway.
    at,h=site(k,12648,25);base=lateral(12648,25)-.17
    art.box(at(0,0,base-.48),(11.6,12.6,26.4),0,rust)
    for side in (-1,1):
        panel(at,siding,side*5.85,0,base,12.6,25.9,math.pi/2)
        panel(at,siding,0,side*6.36,base,11.6,25.9,0)
    art.roof(at(0,0,base+25.9),12,13,4.16,0,dark)
    art.box(at(1.2,0,base+26.3),(5.8,6.4,7.65),0,white);art.roof(at(1.2,0,base+33.95),6.1,6.7,2.61,0,rust)
    for x in (-1.1,1.2,3.08):art.box(at(x,-3.22,base+30.75),(.86,.11,1.58),0,dark)
    art.box(at(10.6,1.4,base),(10,11.8,6.38),0,rust);art.roof(at(10.6,1.4,base+6.38),10.5,12,3.22,0,steel)
    panel(at,signs,-5.91,0,base+16.7,10.66,4.28,-math.pi/2)
    for v in (10.7,12.18):beam(art,at(-165,v,base+.09),at(175,v,base+.09),.12,.18,steel)
    for x in range(-165,174,2):art.box(at(x,11.44,base),(.26,2.64,.14),0,wood)
    for x in (-38,-20,24,42):
        art.box(at(x,11.4,base+1.03),(14.1,2.91,2.6),0,lin(0x9D8672))
        for dx in range(-6,7,3):art.box(at(x+dx,9.90,base+1.03),(.14,.15,2.75),0,steel)
    return {'farms':8,'turbines':116,'efforts':0}
