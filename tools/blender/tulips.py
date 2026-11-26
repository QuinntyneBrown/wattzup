"""Dutch bulb country: parcelled polder fields, sloten, willow rows and smock mills."""
import math
from arenberg import beam
from iten_landmarks import site,picture,pictured
from worldkit import Painted,lin

PROFILE=((0,1),(1800,1),(2150,2),(2400,1),(5200,1),(5650,2),(5900,1),(8900,1),(9400,2),(9700,1),(10100,1))
def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return 1

def heading(d):
    # The farm lanes follow the long boundaries, with a dogleg to cross each waterway.
    h=.04
    for at,delta in ((1740,.94),(2320,-.96),(3920,-.72),(4430,.72),(5550,1.16),(5970,-1.16),(7390,-.72),(7830,.72),(9250,.83),(9630,-.83)):
        h+=delta*(.5+.5*math.tanh((d-at)/31))
    return h

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    paving=bc.Builder('PolderLane','terrain');paving.colours=[];paving.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,za,zb in ((-2.45,0,.045,.1),(0,2.45,.1,.045)):
            pts=[r.at(i,a,za),r.at(i+1,a,za),r.at(i+1,b,zb),r.at(i,b,zb)]
            picture(paving,pts,[(x*.27,y*.27) for x,y,_ in pts])
    paving.build(col)

def land(r,col,theme,bc):
    ground=bc.Builder('PolderGrass','terrain');ground.colours=[];ground.uvs=[]
    for i in range(0,len(r.s)-1,4):
        end=min(i+4,len(r.s)-1)
        for a,b in ((-530,-8),(-8,-2.42),(-2.42,2.42),(2.42,8),(8,530)):
            za=-.77 if abs(a)>7 else -.02;zb=-.77 if abs(b)>7 else -.02
            pts=[r.at(i,a,za),r.at(end,a,za),r.at(end,b,zb),r.at(i,b,zb)]
            picture(ground,pts,[(x*.1,y*.1) for x,y,_ in pts])
    return ground.build(col),lambda x,y:.23

def scenery(k):
    art=Painted(k);beds=pictured(k,'BulbBeds');water=pictured(k,'Sloten');trees=pictured(k,'PolderTrees');homes=pictured(k,'BulbFarms');folk=pictured(k,'BulbVisitors');rim=pictured(k,'PolderHorizon');mill=pictured(k,'SmockTimber')
    wood,dark,cream,green,slate=map(lin,(0x80553c,0x32352e,0xe4dfc6,0x5d6d44,0x57636a))
    def billboard(mesh,at,u,v,w,h,cell,count,base=-.5):
        a=cell/count;b=(cell+1)/count
        picture(mesh,[at(u,v+dx,base+z) for dx,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],((a+.001,0),(b-.001,0),(b-.001,1),(a+.001,1)))
    # A field is several straight beds. UVs encode the individual furrows and the variety.
    for j,d in enumerate(range(-100,10200,36)):
        for side in (-1,1):
            q=j//6+(2 if side>0 else 0)
            for n in range(9):
                a=side*(12+n*18);b=a+side*17.1
                pts=[k.road.pos(d+u,v,-.5) for u,v in ((0,a),(36,a),(36,b),(0,b))]
                variety=(q+n//2)%7
                picture(beds,pts,[(variety+.07,0),(variety+.07,36/1.24),(variety+.92,36/1.24),(variety+.92,0)])
            edge=side*(6.3 if side<0 else 9.1);w=3.1 if side<0 else 1.8
            pts=[k.road.pos(d+u,edge+side*v,-.64) for u,v in ((0,0),(36,0),(36,w),(0,w))]
            picture(water,pts,[(x*.12,y*.12) for x,y,_ in pts])
            if (j+side)%3==0:
                at,_=site(k,d+13,side*(10.2 if side<0 else 174))
                idx=(j//3)%4;billboard(trees,at,0,0,5.5 if idx%2==0 else 4.8,6.8 if idx%2==0 else 12,idx,4)
            if j%18==0:
                at,_=site(k,d+8,side*(89+j%45));billboard(homes,at,0,0,28,12,j//18%4,4)
        if j%23==0:
            at,_=site(k,d+10,-3.35);billboard(folk,at,0,0,2.9,1.85,1+j%2,3,-.05)
    for d in (2157,5675,9345):
        at,h=site(k,d,0)
        for s in (-1,1):
            for j in range(5):
                art.box(at(-7+j*3.5,s*2.72,-.12),(.18,.18,1.1),h,cream)
            for z in (.55,.94):beam(art,at(-7,s*2.72,z),at(7,s*2.72,z),.09,cream)
    for d,v in ((4200,-15),(9974,23)):
        at,h=site(k,d,v)
        def ring(z,r,a):return at(r*math.cos(a),r*math.sin(a),z)
        for n in range(12):
            a=n*math.tau/12;b=(n+1)*math.tau/12
            for lo,hi,ra,rb in ((-.7,4.2,4.55,4.1),(4.2,12.8,3.6,2.15),(12.8,14.45,2.4,.55)):
                pts=(ring(lo,ra,a),ring(lo,ra,b),ring(hi,rb,b),ring(hi,rb,a))
                cell=0 if lo<4 or lo>12 else .5
                picture(mill,pts,((cell+.002,0),(cell+.498,0),(cell+.498,1),(cell+.002,1)))
            beam(art,ring(4.2,4.7,a),ring(4.2,4.7,b),.58,wood)
            beam(art,ring(5.4,4.7,a),ring(5.4,4.7,b),.12,cream)
            beam(art,ring(4.3,4.7,a),ring(5.4,4.7,a),.12,cream)
            beam(art,ring(.5,4.0,a),ring(4.1,4.7,a),.17,wood)
    for idx,(u,v) in enumerate(((7635,-35),(7655,-43),(7700,-57))):
        at,h=site(k,u,v);billboard(homes,at,0,0,25,12,idx,4)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def e(t,z):return 4900+14500*math.cos(t),14500*math.sin(t),z
        picture(rim,(e(a,-800),e(b,-800),e(b,8200),e(a,8200)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.45,'terrain':{'sea':False},'land':{'mid':0x81965d},'sky':[0xd6e3de,0xc8dfee,0xa8cde5,0x81b2d7,0x6da4cf],'haze':0xd4e1df,'light':[0xfff2d9,1.62],'fill':[0xd3e6ee,0x96987a],'sun_altitude':.75,'sun_azimuth':-.82}
