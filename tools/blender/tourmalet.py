"""The D918 from La Mongie to the Col du Tourmalet."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 1463.08], [1200.0, 1520.2], [2000.0, 1587.88], [2400.0, 1627.64], [3200.0, 1647.96], [3600.0, 1672.92], [4000.0, 1706.76], [4400.0, 1731.72], [4800.0, 1765.56], [5600.0, 1779.96], [6000.0, 1822.68], [6400.0, 1856.52], [6800.0, 1899.24], [7200.0, 1933.08], [8000.0, 1947.48], [8400.0, 1978.36], [8800.0, 2012.2], [9200.0, 2051.96], [9600.0, 2100.6], [10400.0, 2115.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # The large reversals make the upper ramps visible across the bowl.
    return .70*math.sin(d/402)+.24*math.sin(d/151)+1.08*math.tanh((d-8300)/72)-1.08*math.tanh((d-8860)/72)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    z=elevation(d);edge=abs(v)-5.3
    if edge<0:return z-.24
    rugged=math.sin(d/28+v*.064)*math.cos(d/57-v*.081)
    slope=.59 if v<0 else -.48-.32*math.sin(d/480)
    if 5700<d<7850 and v>0:slope=-.72
    return z-.24+edge*slope+min(1,edge/17)*rugged*(1+edge*.045)

def road(r,st,length,col,bc):
    m=bc.Builder('PassTarmac','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        w=3.85
        picture(m,[r.at(j,v,.04) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))],((0,0),(0,1),(1,1),(1,0)))
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('TourmaletPasture','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[]
        for v in (-290,-100,-42,-18,-6,-4,0,4,6,16,38,90,240,450):
            near=max(-38,min(v,38));x,y,_=r.at(i,near);y+=v-near;row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/8,y/8) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.25

def scenery(k):
    art=Painted(k);homes=pictured(k,'SkiApartments');fans=pictured(k,'PassSupporters');herd=pictured(k,'PassLivestock')
    chalk=pictured(k,'PaintedNames');markers=pictured(k,'PassBornes');peaks=pictured(k,'PyreneanPeaks')
    stone,slate,white,iron,steel,glass,gray,ochre,yellow,grass=map(lin,(0xA7A49D,0x535965,0xE5E4D9,0x576167,0xB7BABC,0x7E919C,0x898983,0xA59B80,0xF4BF44,0x818451))
    def panel(m,pts,idx=0,cols=1):
        u=idx/cols;v=(idx+1)/cols;picture(m,pts,((u+.004,0),(v-.004,0),(v-.004,1),(u+.004,1)))
    def card(m,at,w,h,i):
        panel(m,[at(0,v,z) for v,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],i,4)
    for j,d in enumerate(range(-45,10465,9)):
        at,h=site(k,d)
        for v in (-3.67,0,3.67):
            n=4.5 if v else 1.65
            pts=[k.road.pos(d+u,v+w,.065) for u,w in ((-n,-.064),(n,-.064),(n,.064),(-n,.064))];art.face(pts,(white,)*4)
        if d>1850 and j%3==0:
            idx=j//3%4;lane=(-1 if j%2 else 1)*1.6
            pts=[k.road.pos(d+x,lane+v,.083) for x,v in ((-1.9,1.45),(-1.9,-1.45),(1.9,-1.45),(1.9,1.45))]
            panel(chalk,pts,idx,4)
        if j%11==0 and d>730:
            v=-k.rng.uniform(5.9,12);x,y,_=k.road.pos(d,v);r=k.rng.uniform(.32,1.25)
            art.tube((x,y,ground(d,v)-.13),r,r*.54,r*.84,gray,stone,7,cap=stone)
        if 1800<d<2680 and j%5==0 or 7850<d and j%2==0:
            for side in (-1,1):
                v=side*k.rng.uniform(4.3,5.3);at,h=site(k,d,v)
                card(fans,at,3.65,1.9,(j+side)%4)
        if 3680<d<4800 and j%3==0:
            v=k.rng.uniform(5.4,12);x,y,_=k.road.pos(d,v);base=ground(d,v)
            at,h=site(k,d,v);raised=lambda u,n,z:(at(u,n,z)[0],at(u,n,z)[1],base+z)
            card(herd,raised,(2.8,2.45,2.53,2.75)[j%4],(1.15,1.62,1.65,1.13)[j%4],j%4)
        if (d<700 or d>9300) and j%4==0:
            at,h=site(k,d,4.5);art.box(at(0,0,-.18),(1.28,.56,.73),h,stone)
    for j,d in enumerate(range(-40,670,44)):
        for side in (-1,1):
            v=side*(17+j%4);at,h=site(k,d,v);high=6+(j%4)*3.1
            art.box(at(0,side*4,-1.3),(36,8,high+1.3),h,gray)
            panel(homes,[at(x,-side*.09,z) for x,z in ((-18,-.4),(18,-.4),(18,high),(-18,high))],j%4,4)
    for d in range(115,570,96):
        at,h=site(k,d,-11)
        art.tube(at(0,0,-.4),.46,.28,9,iron,steel,10)
        beam(art,at(0,-2.7,8.4),at(0,2.7,8.4),.22,steel)
        for v in (-2.1,2.1):beam(art,at(0,v,8.55),k.road.pos(d+96,-11+v,8.55),.047,iron)
    for j,d in enumerate((260,2270,4370,6720,8660,10260)):
        at,h=site(k,d,-4.55);art.box(at(0,0,-.13),(.4,.63,1.05),h,white);art.box(at(0,0,.91),(.42,.65,.17),h,yellow)
        idx=0 if j<2 else 1 if j<4 else j-2
        panel(markers,[at(-.216,v,z) for v,z in ((.305,.08),(-.305,.08),(-.305,1.08),(.305,1.08))],idx,4)
    # The observatory occupies the crown of a ridge, not a screen-facing card.
    at,h=site(k,6840,-210);summit=elevation(6840)+125
    def ridge(u,v,z):
        x,y,_=at(u,v);return x,y,summit+z
    art.tube(ridge(0,0,-112),105,25,112,slate,gray,17,cap=gray)
    art.box(ridge(0,0,0),(34,13,5),h,stone)
    def ellipsoid(at,rx,ry,rz,c):
        for j in range(7):
            a=-math.pi/2+j*math.pi/7;b=a+math.pi/7
            for i in range(16):
                u=i*math.tau/16;v=u+math.tau/16
                point=lambda t,f:at(rx*math.cos(f)*math.cos(t),ry*math.cos(f)*math.sin(t),rz*math.sin(f))
                art.face((point(u,a),point(v,a),point(v,b),point(u,b)),(c,)*4)
    for u,r in ((-11,5.1),(2,3.0),(12,4.25)):
        art.tube(ridge(u,0,5),r,r,2.6,gray,white,16)
        ellipsoid(lambda x,y,z:ridge(u+x,y,7.7+z),r,r,r,white)
    art.tube(ridge(19,0,0),.72,.16,35,iron,white,9)
    # The summit memorial faces across the pass, with open wheels, spokes and bent limbs.
    at,h=site(k,10260,-7.4);art.box(at(0,0,-.28),(5.6,2.5,1.21),h,stone)
    U=lambda u,v,z:at(u,v,z+1)
    for cx in (-1.35,1.35):
        for i in range(30):
            a=i*math.tau/30;b=(i+1)*math.tau/30
            A=U(cx+.91*math.cos(a),0,.94+.91*math.sin(a));B=U(cx+.91*math.cos(b),0,.94+.91*math.sin(b))
            beam(art,A,B,.077,steel)
            if i%2==0:beam(art,U(cx,0,.94),A,.026,iron)
    crank=U(-.07,0,.94);seat=U(-.7,0,2.17);head=U(.93,0,2.18)
    for a,b in ((U(-1.35,0,.94),seat),(seat,crank),(crank,U(-1.35,0,.94)),(seat,head),(head,crank),(head,U(1.35,0,.94)),(head,U(.95,0,2.5))):beam(art,a,b,.092,steel)
    beam(art,U(.95,-.4,2.48),U(.95,.4,2.48),.097,steel)
    hip=U(-.71,0,2.47);shoulder=U(.30,0,3.35)
    beam(art,hip,shoulder,.36,steel)
    ellipsoid(lambda x,y,z:U(.40+x,y,3.76+z),.28,.25,.33,steel)
    for side in (-1,1):
        knee=U(.08 if side>0 else -.73,side*.26,1.86 if side>0 else 1.44)
        beam(art,hip,knee,.18,steel);beam(art,knee,U(-.06+side*.30,side*.26,1.09),.14,steel)
        elbow=U(.49,side*.35,2.86);beam(art,shoulder,elbow,.14,steel);beam(art,elbow,U(.96,side*.35,2.49),.12,steel)
    for j in range(80):
        a=j*math.tau/80;b=(j+1)*math.tau/80;u=j%20/20;v=u+1/20
        if j//20%2:u,v=1-u,1-v
        def e(t,z):return 4400+11300*math.cos(t),9600*math.sin(t),z+1800
        picture(peaks,(e(a,-3450),e(b,-3450),e(b,4550),e(a,4550)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.85,'terrain':{'sea':False},'land':{'mid':0x85885F},'sky':[0xD0D9E0,0xB6CEE2,0x96BADA,0x6497C6,0x477DB3],'haze':0xCBD5DB,'light':[0xFFF1D7,1.44],'fill':[0xC6D9ED,0x998C72],'sun_altitude':.77,'sun_azimuth':-.91}
