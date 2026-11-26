"""From Loch Harport to Glen Brittle, below the Red and Black Cuillin."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from arenberg import beam
PROFILE=((0,10),(420,13),(860,14),(1780,24),(2300,19),(2940,76),(3630,96),(3980,101),(4700,129),(5200,144),(5750,118),(6320,92),(6880,89),(7400,105),(8110,122),(8840,111),(9480,94),(10120,71),(10800,49),(11300,36),(12140,8),(12725,5))
BAYS=(126,920,1710,2580,3910,4740,5710,6350,7240,8170,8856,9810,10940,11960)

def height(d):
    if d<=0:return 10
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return 5

def bend(d):
    return .25*math.sin(d/490)+.21*math.cos(d/254)+.095*math.sin(d/83)+.35*(smooth(1550,2100,d)-smooth(3100,3500,d))-.42*(smooth(5540,5880,d)-smooth(6750,6940,d))

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bend(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=bend(d+.5)-bend(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(bend(d+.5*bc.STEP));y+=bc.STEP*math.sin(bend(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def turnout(d):return max((1-smooth(8,25,abs(d-b)) for b in BAYS),default=0.)

def road(r,st,length,col,bc):
    mat=bc.Builder('SkyeRoad','terrain');mat.colours=[];mat.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        def pts(j):
            d=r.s[j]['d'];return r.at(j,-2.24-.13*math.sin(d/15)),r.at(j,2.24+2.8*turnout(d)+.10*math.cos(d/17))
        a,b=pts(i);c,e=pts(i+1)
        picture(mat,(a,c,e,b),((0,0),(0,1),(1,1),(1,0)))
    mat.build(col)

def ground(d,side):
    z=height(d);r=abs(side)
    texture=math.sin(d/39+side/18)*1.2+math.cos(d/123-side/52)*2.3
    lowbank=smooth(3,64,r)
    shore=(1-smooth(1950,2500,d))+smooth(11300,12100,d)
    if side<0 and shore>.001:
        z+=shore*(.65-z)*smooth(7,68,r)
        z-=shore*4*smooth(35,95,r)
    z+=lowbank*(texture+(.07*r if side>0 else .018*r)*(1-smooth(800,1500,r)))
    z-=2.9*(1-smooth(5,27,abs(d-6332)))*smooth(3,10,-side)
    return z-.25

def land(r,col,theme,bc):
    b=bc.Builder('SkyeMoor','terrain');b.colours=[];b.uvs=[]
    offsets=(-1600,-670,-250,-96,-52,-29,-14,-6,-3,0,3,6,14,29,52,96,250,670,1600)
    last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];line=[]
        for v in offsets:
            x,y,_=r.at(i,v);z=ground(d,v)
            green=.5+.26*math.sin(d/83+v/31)+.17*math.cos(d/35-v/72)
            colr=lin(0x87865A if green>.65 else 0x776849 if green<.32 else 0x7A7952)
            if abs(v)<5:colr=lin(0x858360)
            line.append(((x,y,z),colr))
        if last:
            for a,b0,c,e in zip(last,last[1:],line[1:],line):
                b.quad(a[0],e[0],c[0],b0[0]);b.colours.extend((a[1],e[1],c[1],b0[1]));b.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
        last=line
    def height_at(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=(y-p['y'])*math.cos(p['h'])-(x-p['x'])*math.sin(p['h']);return ground(p['d'],v)
    return b.build(col),height_at

def scenery(k):
    art=Painted(k);flora=pictured(k,'SkyeHeather');loch=pictured(k,'SeaLochs');signs=pictured(k,'PassingPlaces')
    stone,slate,wall,wood=map(lin,(0x78776C,0x505359,0xE4E0CF,0x6A604D))
    def uv(m,pts):picture(m,pts,((0,0),(1,0),(1,1),(0,1)))
    for j,d in enumerate(BAYS):
        at,h=site(k,d+10,4.75);art.tube(at(0,0,-.25),.043,.043,2.68,slate,stone,8)
        def face(a):
            x,y,z=at(0,0,1.96);dx,dy=.52*math.sin(a),-.52*math.cos(a)
            return ((x-dx,y-dy,z),(x,y,z-.52),(x+dx,y+dy,z),(x,y,z+.52))
        uv(signs,face(h))
    # Fixed, folded original reliefs. Their photographed surface carries real depth at the shoulders.
    for name,distance,offset,width,relief,top,observer in (
            ('BlackCuillin',9940,650,2300,95,470,8840),('RedCuillin',5070,-405,1690,70,365,3980),
            ('HarportRelief',1980,-260,830,21,119,1780)):
        m=pictured(k,name);cx,cy,cz=k.road.pos(distance,offset);rx,ry,_=k.road.pos(observer)
        depth=math.hypot(cx-rx,cy-ry);fx,fy=(cx-rx)/depth,(cy-ry)/depth
        for i in range(32):
            def pt(t,v):
                fold=relief*(math.sin(t*math.pi*3.2)*.46+.3*math.sin(t*math.pi*7.4))+(1-v)*39
                across=(t-.5)*width
                taper=smooth(0,.16,t)*smooth(0,.16,1-t)
                return cx+fx*fold-fy*across,cy+fy*fold+fx*across,cz-(45 if name=='HarportRelief' else 82)+v*top*taper
            a=i/32;b=(i+1)/32;picture(m,(pt(a,0),pt(b,0),pt(b,1),pt(a,1)),((a,0),(b,0),(b,1),(a,1)))
    for d,reach in ((820,1050),(12180,1130)):
        at,h=site(k,d,-325)
        pts=[at(u,v,0) for u,v in ((-reach,-950),(reach,-950),(reach,283),(-reach,283))]
        uv(loch,[(x,y,2) for x,y,_ in pts])
    def croft(d,side,chapel=False):
        at,h=site(k,d,side);base=ground(d,side)-height(d)
        length=11 if chapel else 8.7;dep=4.9;ht=3.7 if chapel else 2.8
        art.box(at(0,0,base),(length,dep,ht),h,wall)
        art.roof(at(0,0,base+ht),length+.48,dep+.5,2.3,h,slate)
        for i in (-.31,0,.32):
            art.box(at(i*length,-math.copysign(dep*.5+.027,side),base+.82),(1.04,.11,1.17),h,slate)
        art.box(at(length*.36,.13,base+ht+1.64),(.61,.7,1.53),h,stone)
        if chapel:
            art.box(at(-length*.42,0,base+ht+1.78),(1.13,1.08,2.45),h,wall)
            art.box(at(-length*.42,-.57,base+ht+2.71),(.49,.09,.84),h,slate)
            art.roof(at(-length*.42,0,base+ht+4.23),1.42,1.36,.67,h,slate)
    for d,side,church in ((119,10,True),(151,-13,False),(189,13,False),(223,24,False),(282,-17,False),(11466,-17,False),(12171,14,False),(12256,-15,True)):croft(d,side,church)
    for d in range(2,12780,5):
        for side in (-1,1):
            for off in (k.rng.uniform(3.3,6.4),k.rng.uniform(9,22)):
                if side>0 and turnout(d)>.06 and off<6:continue
                i=k.rng.randrange(4);off*=side;x,y,_=k.road.pos(d,off);z=ground(d,off)-.06
                w=k.rng.uniform(.6,1.6);ht=w*(.56 if i==3 else .85);h=k.rng.uniform(0,math.pi)
                for yaw in (h,h+1.44):
                    dx=w*math.cos(yaw);dy=w*math.sin(yaw);u=i%2*.5;v=(1-i//2)*.5
                    picture(flora,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+ht),(x-dx,y-dy,z+ht)),((u+.003,v+.003),(u+.497,v+.003),(u+.497,v+.497),(u+.003,v+.497)))
    # The burn cuts the bank below the road. The relief sits on the far rock lip.
    pool=pictured(k,'FairyPools');at,h=site(k,6331,-9.7)
    uv(pool,[at(a,v,z) for a,v,z in ((-4,-4,-2.6),(-4,4,-2.6),(1.1,4,1.3),(1.1,-4,1.3))])
    for s in (-1,1):
        at,h=site(k,6338,s*2.68)
        for j in (-3,0,3):art.box(at(j,0,-.21),(.17,.17,1.04),h,wood)
        art.box(at(0,0,.71),(6.4,.13,.15),h,wood)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.24,'terrain':{'sea':False},'land':{'mid':0x797754},'haze':0xBDC1BA,
       'sky':[0xCDCEC6,0xBBC4C4,0xA9B4B9,0x98A6AE,0x87999F],'light':[0xE5E0C9,1.18],'fill':[0xD0D8D5,0xA6A591],'sun_altitude':.41,'sun_azimuth':-.81}
