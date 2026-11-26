"""Valais summer meadows, old larch villages and the silent lifts above the Rhône."""
import math
from bisect import bisect_left
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 1375], [800.0, 1386.44], [1600.0, 1415.08], [2000.0, 1417.36], [3600.0, 1474.64], [4400.0, 1489.52], [6000.0, 1546.8], [6800.0, 1561.68], [8400.0, 1618.96], [9200.0, 1633.84], [10800.0, 1691.12], [11600.0, 1706.0], [12000.0, 1708.28]]
def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # Traverses turn back on the sunny slope above the Rhône.
    return .11*math.sin(d/283)+1.22*math.tanh(3.2*math.sin((d-690)*math.pi/1220))
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('StationRoad','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,za,zb in ((-3.2,0,.04,.1),(0,3.2,.1,.04)):
            pts=(r.at(i,a,za),r.at(i+1,a,za),r.at(i+1,b,zb),r.at(i,b,zb))
            picture(m,pts,[(x*.37,y*.37) for x,y,_ in pts])
    m.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('AlpineMeadow','terrain');m.colours=[];m.uvs=[]
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s]
    def height(x,y):
        j=max(1,min(len(xs)-1,bisect_left(xs,x)));a,b=r.s[j-1:j+1]
        base=a['z']+(b['z']-a['z'])*(x-a['x'])/max(.01,b['x']-a['x'])
        _,i,dist=r.tree.find((x,y,0));p=r.s[i]
        raw=base+min(18,dist*.061)*(math.sin(x/77)*math.cos(y/89)+.42*math.sin(y/49))
        weight=max(0,min(1,(dist-5)/34))
        return p['z']-.74+(raw-p['z'])*weight
    last=None
    for x in range(int(min(xs))-380,int(max(xs))+385,11):
        row=[(x,y,height(x,y)) for y in range(int(min(ys))-300,int(max(ys))+310,11)]
        if last:
            for a,b,c,d in zip(last,last[1:],row[1:],row):
                pts=(a,d,c,b);picture(m,pts,[(x*.1,y*.1) for x,y,_ in pts])
        last=row
    return m.build(col),height

def scenery(k):
    art=Painted(k);houses=pictured(k,'ValaisTimber');trees=pictured(k,'ValaisPines');rim=pictured(k,'ValaisRange');sign=pictured(k,'ValaisSigns')
    white,stone,slate,wood,iron,glass,earth,leaf,bell=map(lin,(0xdddcd0,0x9a978c,0x687178,0x644b3b,0x545e60,0x859cab,0x75614d,0x79844f,0xb6a06c))
    def panel(mesh,pts,idx,count):
        a=idx/count;b=(idx+1)/count;picture(mesh,pts,((a+.001,0),(b-.001,0),(b-.001,1),(a+.001,1)))
    def tree(at,w,h,idx):
        x,y,_=at(0,0);z=k.height_at(x,y)-at(0,0)[2]-.28
        for c,s in ((1,0),(0,1)):
            panel(trees,[at(c*u,s*u,z+v) for u,v in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],idx,4)
    for j,d in enumerate(range(-80,12100,8)):
        at,h=site(k,d)
        for side in (-1,1):
            pts=[k.road.pos(d+u,side*v,.066) for u,v in ((0,2.96),(8,2.96),(8,3.06),(0,3.06))]
            art.face(pts,(white,)*4)
            if 3200<d<5410 or 7300<d<8440:
                if j%2==0:
                    v=side*(18+(j*13)%55);t,_=site(k,d+3,v);tree(t,5.3+(j%3),11+j%7,j%4)
        if (j%166)<23:
            side=1 if math.sin(h)>0 else -1
            for t in (0,4):
                art.box(at(t,side*3.52,-.35),(3.88,.72,.97),h,stone)
    for idx,(d,v) in enumerate(((175,5),(2360,-5),(4690,-5),(6745,5),(8950,5),(11795,-5))):
        at,h=site(k,d,v)
        panel(sign,[at(0,y,z) for y,z in ((-1.05,0),(1.05,0),(1.05,3.4),(-1.05,3.4))],idx%3,3)
    def chalet(d,v,idx,w,depth,high):
        at,h=site(k,d,v)
        x,y,z=at(0,0);ground=k.height_at(x,y)-z
        base=ground+(1.35 if idx==1 else .01)
        if idx==1:
            for u in (-depth*.34,depth*.34):
                for a in (-w*.34,w*.34):
                    art.tube(at(u,a,ground),.39,.33,.91,stone,stone,7,cap=stone)
                    art.tube(at(u,a,ground+.88),.84,.91,.23,stone,stone,9,cap=stone)
        art.box(at(0,0,base),(depth,w,high*.67),h,wood)
        for s in (-1,1):
            panel(houses,[at(s*(depth/2+.06),y,base+z) for y,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))],idx,4)
            panel(houses,[at(u,s*(w/2+.06),base+z) for u,z in ((-depth/2,0),(depth/2,0),(depth/2,high),(-depth/2,high))],idx,4)
        art.roof(at(0,0,base+high*.68),depth+1.2,w+1.2,high*.29,h,slate)
        if idx==3:
            art.box(at(-depth*.3,-w*.52,base),(2.7,2.7,high+2.8),h,white)
            art.tube(at(-depth*.3,-w*.52,base+high+2.8),2.05,.13,4.8,slate,iron,4,cap=iron)
    for d,v,idx,w,dep,high in ((2375,-14,1,8,7,6.5),(2403,17,0,13,12,9),(2441,-24,2,13,11,11),(2473,-18,0,12,11,8),(8964,-19,3,11,15,9),(8986,17,2,12,11,8),(9029,-27,0,13,10,9),(11797,-53,0,11,12,8)):
        chalet(d,v,idx,w,dep,high)
    # An idle summer chairlift climbs across the road; the seats stay under the sagging cable.
    at,h=site(k,4700)
    def lift(v):
        x,y,_=at(v*.22,v);return x,y,k.height_at(x,y)+10.6
    for v in (-84,-29,26,81):
        x,y,z=lift(v)
        art.tube((x,y,z-10.9),.39,.27,10.55,iron,iron,8,cap=iron)
        art.box((x,y,z-.54),(5.4,.4,.34),h,iron)
    for v0 in (-84,-29,26):
        for side in (-1,1):
            pts=[]
            for j in range(13):
                t=j/12;v=v0+55*t;x,y,z=lift(v);u=side*2.25
                pts.append((x+u*math.cos(h),y+u*math.sin(h),z-.85*math.sin(math.pi*t)))
            for a,b in zip(pts,pts[1:]):beam(art,a,b,.072,iron)
            for a in (pts[3],pts[9]):
                x,y,z=a;art.tube((x,y,z-1.9),.065,.065,1.9,iron,iron,5)
                art.box((x,y,z-2.19),(1.9,.64,.18),h,wood);art.box((x,y+.23,z-2.04),(1.9,.12,.64),h,glass)
    # Terraced vine lines below the last overlook.
    at,h=site(k,11786,95)
    for j in range(22):
        v=j*3.8
        a=at(-38,v);b=at(38,v);za=k.height_at(*a[:2]);zb=k.height_at(*b[:2])
        beam(art,(*a[:2],za+.75),(*b[:2],zb+.75),.53,leaf)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%24/24;v=u+1/24
        if j//24%2:u,v=1-u,1-v
        def sky(t,z):return 2300+8800*math.cos(t),8600*math.sin(t),z+1540
        picture(rim,(sky(a,-5100),sky(b,-5100),sky(b,4800),sky(a,4800)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.2,'terrain':{'sea':False},'land':{'mid':0x869465},'sky':[0xd8e2de,0xbcd6e4,0x9bbfdb,0x7ca6ce,0x6696c3],'haze':0xc8d8dd,'light':[0xffefd0,1.56],'fill':[0xd5e4ed,0x9b967a],'sun_altitude':.81,'sun_azimuth':-.83}
