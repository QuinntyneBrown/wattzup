"""Northside Drive on the floor of Yosemite Valley."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 1213], [980, 1214], [2900, 1218], [3950, 1214], [4820, 1216], [6110, 1212], [6910, 1213], [8270, 1216], [9640, 1219], [11130, 1222], [12740, 1220], [13150, 1221]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return .13*math.sin(d/378)+.18*math.sin(d/903)+.06*math.sin(d/151)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def river_edge(d):
    return 20+8*math.cos(d/230)+3*math.sin(d/91)
def ground(d,v):
    verge=max(0,abs(v)-4)
    base=elevation(d)-.16+min(2,verge/10)*math.sin(d/47+v/32)*.55
    if 5390<d<8050 and v<0:
        gap=-v-river_edge(d)
        if gap>0:base-=min(4.7,gap*.49,max(0,57-gap)*.31)
    return base
def road(r,st,length,col,bc):
    m=bc.Builder('NorthsideAsphalt','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        p=[r.at(j,v,.055) for j,v in ((i,-3.8),(i+1,-3.8),(i+1,3.8),(i,3.8))]
        picture(m,p,[(x/4,y/4) for x,y,_ in p])
    m.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('ValleyMeadow','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-1000,-440,-180,-98,-74,-56,-42,-30,-22,-13,-5,0,5,13,28,63,130,290,590,1150):
            x,y,_=r.at(i,v);row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                p=(a,e,c,b);picture(m,p,[(x/9,y/9) for x,y,_ in p])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.16

def scenery(k):
    art=Painted(k); granite=pictured(k,'SierraGranite');trees=pictured(k,'YosemiteTrees');signs=pictured(k,'ParkSigns');water=pictured(k,'MercedWater'); visitors=pictured(k,'ParkVisitors')
    wood,iron,pale,rock,cream,green,sand,gold=map(lin,(0x957657,0x4D5951,0xD3C5A8,0x96948C,0xE2D9C4,0x567047,0xCABB94,0xDABD68))
    def quad(mesh,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(mesh,pts,((a,b),(c,b),(c,e),(a,e)))
    # Rings of granite preserve the vertical Nose of El Capitan, and the east dome's abruptly sliced face.
    def monolith(station,offset,rx,depth,height,shape):
        at,h=site(k,station,offset);last=None
        for m,(z,scale) in enumerate(((0,1),(.21,.99),(.46,.97),(.66,.91),(.80,.84),(.90,.71),(.96,.53),(1,.21))):
            row=[]
            for j in range(36):
                a=j*math.tau/36;c=math.cos(a);sn=math.sin(a)
                if shape=='capitan':
                    v=max(-.73,sn)-.31*math.exp(-((c+.25)/.18)**2)*max(0,-sn)
                    delta=.025*math.sin(7*a+.19*m)+.018*math.sin(11*a-.15*m)
                elif shape=='dome':
                    v=max(-.18,sn);delta=.011*math.sin(5*a+.06*m)
                else:
                    v=max(-.57,sn);delta=.046*math.cos(5*a+.24*m)
                along=c*(scale+delta)
                if shape=='dome':along=max(-.30,along)+.08*z
                row.append(at(rx*along,depth*v*(scale+delta),-9+height*(z+.023*math.sin(a*3+.5)*z)))
            if last:
                for j in range(36):
                    i=(j+1)%36;quad(granite,(last[j],last[i],row[i],row[j]),(j/3,(m-1)/3,(j+1)/3,m/3))
            last=row
        art.face(last,(rock,)*len(last))
    monolith(3290,1270,710,280,900,'capitan')
    monolith(12950,1430,625,350,690,'dome')
    for d,v,w,dep,ht in ((4680,-650,440,170,292),(9676,575,570,192,565),(10250,805,535,230,434),(6860,950,720,320,538),(8130,-880,660,310,449)):
        monolith(d,v,w,dep,ht,'wall')
    for station,offset,side,bands in ((4860,-207,-1,[(0,0,92),(85,9,80),(150,18,61)]),(9700,229,1,[(0,0,125),(86,9,114),(148,68,98),(318,80,79)])):
        at,h=site(k,station,offset)
        for (lo,near,w),(hi,far,v) in zip(bands,bands[1:]):
            for n in range(16):
                a=n/8-1;b=(n+1)/8-1
                def ledge(x,z,off,width):return at(x*width,side*(off+6*math.sin(x*7)+4*math.cos(x*14)),z)
                quad(granite,(ledge(a,lo,near,w),ledge(b,lo,near,w),ledge(b,hi,far,v),ledge(a,hi,far,v)),(n/6,lo/130,(n+1)/6,hi/130))
    at,h=site(k,3290,1270)
    for j in range(5):
        x=-170+j*10;z=427+j*7
        art.tube(at(x,-290,z),1.5,1.15,3.1,iron,gold,6)
    for j,d in enumerate(range(-50,13210,9)):
        at,h=site(k,d)
        if j%2==0:art.box(at(0,0,.069),(3.5,.137,.014),h,gold)
        for side in (-1,1):
            art.box(at(0,side*3.59,.067),(9.05,.102,.017),h,cream)
            meadow=((2490<d<3710 or 9270<d<10080 or d>12100) and side==1) or ((4430<d<5210 or 5730<d<7850) and side==-1)
            if not meadow or j%9==0:
                for row in range(1+(1 if not meadow and j%2==0 else 0)):
                    off=side*(k.rng.uniform(8.5,23) if row==0 and not meadow else k.rng.uniform(32,90));a,b=site(k,d+k.rng.uniform(-3,3),off)
                    if meadow and abs(off)<65:continue
                    idx=(j+row+(1 if side>0 else 0))%4;ht=k.rng.uniform(13,27);w=ht*(.54 if idx!=2 else .98)
                    lift=ground(d,off)-elevation(d)
                    for axis in (0,1):
                        quad(trees,[a(x if not axis else 0,x if axis else 0,z+lift) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],(idx/4,0,(idx+1)/4,1))
            if j%5==0:
                v=side*k.rng.uniform(4.8,9);a,b=site(k,d,v);rad=k.rng.uniform(.35,1.12)
                art.tube(a(0,0,-.18),rad,rad*.59,rad*.97,rock,pale,7,cap=rock)
        if 2550<d<3550 or 12000<d<13000:
            a,b=site(k,d,5.6)
            art.box(a(0,0,-.19),(.18,.21,1.39),b,wood)
            for z in (.47,.98):beam(art,a(0,0,z),k.road.pos(d+9,5.6,z+.02),.097,wood)
    for d in range(5460,7980,12):
        a=river_edge(d);b=river_edge(d+12)
        pts=[]
        for t,v in ((d,-a-5),(d+12,-b-5),(d+12,-b-45),(d,-a-45)):
            x,y,z=k.road.pos(t,v);pts.append((x,y,elevation(t)-2.48))
        quad(water,pts)
        beach=[k.road.pos(t,-edge-dist,-drop) for t,edge,dist,drop in ((d,a,0,.14),(d+12,b,0,.14),(d+12,b,6,2.5),(d,a,6,2.5))]
        art.face(beach,(sand,)*4)
    at,h=site(k,6955,-22)
    for n in range(48):
        art.box(at(0,-n,.64),(3.5,1.03,.25),h,wood)
        if n%4==0:
            for x in (-1.6,1.6):
                beam(art,at(x,-n,-3),at(x,-n,2.03),.105,wood)
                beam(art,at(x,-n,1.98),at(x,-n-4,1.98),.085,wood)
    for j,d in enumerate((183,2880,4825,6880,9647,12790)):
        at,h=site(k,d,-4.8)
        for v in (-.95,.95):art.box(at(0,v,-.2),(.16,.18,1.48),h,wood)
        quad(signs,[at(0,v,z) for v,z in ((1.45,.88),(-1.45,.88),(-1.45,2.17),(1.45,2.17))],((j%3)/3,0,(j%3+1)/3,1))
        for n in range(3):
            a,_=site(k,d+5*n+5,-5.2-.27*n);i=(j+n)%4
            quad(visitors,[a(0,v,z) for v,z in ((1.25,0),(-1.25,0),(-1.25,1.84),(1.25,1.84))],(i/4,0,(i+1)/4,1))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.5,'terrain':{'sea':False},'land':{'mid':0x8F9761},'sky':[0xC6D9E4,0xAED2E6,0x83B6D5,0x6799C4,0x5282AE],'haze':0xA9BCCA,'light':[0xFFE9BE,1.32],'fill':[0xCBDDEA,0xA9AA91],'sun_altitude':.71,'sun_azimuth':-.87}
