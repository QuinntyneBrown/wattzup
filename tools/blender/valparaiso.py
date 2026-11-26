"""The painted Chilean cerros, El Peral funicular, Piano steps and Pacific mirador."""
import math
from arenberg import beam
from iten_landmarks import site,picture,pictured
from worldkit import Painted,lin
PROFILE=[[0, 70], [800.0, 54.32], [1200.0, 50.96], [2000.0, 35.28], [3200.0, 25.2], [3600.0, 17.36], [5100.0, 42.56], [6450.0, 57.68], [8250.0, 67.76], [10375.0, 73.71], [11175.0, 58.03], [11675.0, 67.83], [12675.0, 81.83], [13075.0, 77.35], [14075.0, 91.35], [15425.0, 98.91], [16425.0, 112.91], [17775.0, 120.47], [18200.0, 121.66], [19000.0, 105.98], [21500.0, 140.98], [23300.0, 161.14], [24650.0, 168.7], [25925.0, 168.7], [26725.0, 153.02]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]
def heading(d):
    return .28*math.sin(d/111)+1.13*math.tanh(3.8*math.sin((d-310)*math.pi/640))+.12*math.sin(d/79)
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('CerroCobbles','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,za,zb in ((-2.68,0,.045,.12),(0,2.68,.12,.045)):
            pts=[r.at(i,a,za),r.at(i+1,a,za),r.at(i+1,b,zb),r.at(i,b,zb)]
            picture(m,pts,[(x*.41,y*.41) for x,y,_ in pts])
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('CerroPaving','terrain');m.colours=[];m.uvs=[]
    def drop(v):return -.13 if abs(v)<8 else (-.22 if v>0 else .15)*(abs(v)-8)
    for i in range(0,len(r.s)-1,4):
        j=min(i+4,len(r.s)-1)
        for a,b in zip((-160,-60,-18,-7,7,18,60),(-60,-18,-7,7,18,60,160)):
            pts=[r.at(i,a,drop(a)),r.at(j,a,drop(a)),r.at(j,b,drop(b)),r.at(i,b,drop(b))]
            picture(m,pts,[(x*.18,y*.18) for x,y,_ in pts])
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return p['z']+drop(v)
    return m.build(col),height

def scenery(k):
    art=Painted(k);homes=pictured(k,'CerroHouses');murals=pictured(k,'CerroMurals');folks=pictured(k,'CerroNeighbours');rim=pictured(k,'PuertoPacifico')
    wood,iron,stone,white,black,yellow,teal,oxide,blue,water=map(lin,(0x77583e,0x46494a,0xa89987,0xe8dbbf,0x353637,0xe7a53c,0x45979a,0xa95342,0x537e96,0x608eaa))
    colours=[lin(c) for c in (0xc74b5e,0xf07843,0xebbd47,0x64ad7a,0x3b9cba,0x596eb1,0xa86aa4)]
    def panel(mesh,pts,idx=0,count=1):
        a=idx/count;b=(idx+1)/count;picture(mesh,pts,((a+.001,0),(b-.001,0),(b-.001,1),(a+.001,1)))
    def house(at,h,u,v,idx,w,high,base):
        side=1 if v>0 else -1
        panel(homes,[at(u+dx,v,base+z) for dx,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))],idx,4)
        depth=4.8;art.box(at(u,v+side*(depth/2+.18),base),(.95*w,depth,high*.67),h,(yellow,teal,oxide,blue)[idx])
        art.roof(at(u,v+side*2.67,base+high*.67),w*.99,depth+.28,1.2,h,iron)
    for j,d in enumerate(range(-80,26830,24)):
        at,h=site(k,d)
        for side in (-1,1):
            art.box(at(10,side*2.86,-.07),(23.8,.28,.2),h,stone)
            if side>0 and (j%4==0 or any(abs(d-v)<95 for v in (5180,10350,14820,26410))):continue
            v=side*(5.0+j%4*.61);house(at,h,9,v,(j+(2 if side<0 else 0))%4,12+j%5,6.4+(j*7)%5,-.1)
            if j%3==0:
                v=side*(28+j%6*4);x,y,z=at(0,v)
                house(at,h,-4,v,(j+1)%4,10,7,k.height_at(x,y)-z)
        if j%3==0:
            p,h=site(k,d,-4.2);art.tube(p(0,0,-.3),.16,.11,7.45,wood,wood,7)
            for v in (0,.32,.79):
                pts=[k.road.pos(d+u,-4.2+v,7.04-.82*math.sin(u/72*math.pi)) for u in (0,18,36,54,72)]
                for a,b in zip(pts,pts[1:]):beam(art,a,b,.047,iron)
            for n in range(3):beam(art,p(0,n*.2,6.6+n*.21),p(13-n*7,9.5,5.4+n*.42),.055,iron)
        if j%11==0:
            panel(murals,[at(u,4.19,z) for u,z in ((-5,.04),(5,.04),(5,3.1),(-5,3.1))],j//11%3,3)
    # Each step has a real horizontal tread and vertical riser; the cycling lane passes beside it.
    for d,piano in ((5200,True),(14844,False)):
        at,h=site(k,d,4.2)
        for j in range(25):
            v=j*.59;z=j*.285
            art.box(at(0,v,z-.35),(4.8,.62,.35),h,white if piano else colours[j%7])
            if piano:
                for n in range(7):
                    art.box(at(-2.15+n*.68,v-.29,z-.16),(.033,.05,.15),h,black)
                    if n%7 not in (2,6):art.box(at(-1.84+n*.68,v-.29,z-.125),(.22,.09,.115),h,black)
            if j%4==0:art.box(at(2.47,v,z-.05),(.09,.09,.95),h,iron)
            beam(art,at(2.47,v,z+.89),at(2.47,v+.59,z+1.175),.075,iron)
        panel(murals,[at(-2.47,v,z) for v,z in ((-.3,0),(14.1,6.94),(14.1,10.2),(-.3,3.26))],1 if piano else 2,3)
    # A pair of inclined rails and timber sleepers passes below the upper wooden station.
    at,h=site(k,10387,12)
    def track(u,v,z=0):return at(u, v,.43*u+z)
    for v in (-2.42,-1.29,1.29,2.42):
        beam(art,track(-29,v,.24),track(29,v,.24),.14,iron)
    for j in range(68):
        u=-29+j*.86
        beam(art,track(u,-3.25,.08),track(u,3.25,.08),.27,wood)
        if j%7==0:
            for v in (-3,3):
                x,y,z=track(u,v,-.05);bottom=min(k.height_at(x,y),z-.3)
                art.tube((x,y,bottom),.23,.19,z-bottom,wood,wood,6)
    art.box(track(30,0,-.3),(7.6,8,4.2),h,oxide);art.roof(track(30,0,3.9),8.2,9,1.8,h,iron)
    for i,(d,v,idx) in enumerate(((14840,-3.8,0),(14857,4.1,1),(26426,4.5,3))):
        at,h=site(k,d,v);panel(folks,[at(0,dx,z) for dx,z in ((-1.55,0),(1.55,0),(1.55,1.97),(-1.55,1.97))],idx,4)
    at,h=site(k,26445,8)
    art.box(at(0,0,-1.18),(27,9.5,1.2),h,stone)
    for j in range(18):
        u=-12.8+j*1.5;art.box(at(u,4.61,0),(.095,.1,1.25),h,iron)
    for z in (.29,.97,1.2):beam(art,at(-13.5,4.61,z),at(13.5,4.61,z),.08,iron)
    # A dock and gantries below the mirador remain in place while the course turns.
    at,h=site(k,26445,130)
    art.box(at(0,0,-28),(180,108,1),h,water)
    for j in range(4):
        u=-42+j*24;ground=-25
        for du in (-3,3):
            beam(art,at(u+du,-3,ground),at(u+du,-3,ground+18),.49,oxide)
        beam(art,at(u-4,-3,ground+17),at(u+14,-3,ground+19),.58,oxide)
        beam(art,at(u,-3,ground+22),at(u+14,-3,ground+19),.28,oxide)
    art.box(at(6,16,-26),(43,7,2.4),h,iron)
    for j in range(8):art.box(at(-10+j*4.4,16,-23.65),(4.1,5.8,2.1),h,(teal,oxide,blue)[j%3])
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def sky(t,z):return 6200+19000*math.cos(t),18000*math.sin(t),z+180
        picture(rim,(sky(a,-5500),sky(b,-5500),sky(b,6500),sky(a,6500)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.68,'terrain':{'sea':False},'land':{'mid':0xa89b8b},'sky':[0xf2d4c0,0xd1dae3,0xb3cbdc,0x96b6ce,0x749cb8],'haze':0xdacbc3,'light':[0xffe4bd,1.55],'fill':[0xd9e4ee,0xa28370],'sun_altitude':.65,'sun_azimuth':-.83}
