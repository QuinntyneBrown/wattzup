"""The summit access road above Hawaiʻi's Saddle Road, in metres above sea level."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

VISITOR=8980


def heading(d):
    switch=smooth(6200,10500,d)
    return math.sin(d/430)*(.22+switch*.47)+switch*math.sin(d/172)*.65


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def integrated(a,b):
        return sum(max(0,min(b,s['to'])-max(a,s['from']))*s['level'] for s in stages)
    lowmean=integrated(0,VISITOR)/VISITOR;highmean=integrated(VISITOR,length)/(length-VISITOR)
    def altitude(d):
        t=max(0,min(d,length))
        if t<=VISITOR:return 2170+(2800-2170)*t/VISITOR+.0065*(integrated(0,t)-lowmean*t)
        span=t-VISITOR
        return 2800+(4207-2800)*span/(length-VISITOR)+.0065*(integrated(VISITOR,t)-highmean*span)
    x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=altitude(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=(altitude(d+bc.STEP)-z)*100/bc.STEP))
        mid=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
    return rows,stages,length,mean,.65


def surface(r,st,length,col,bc):
    b=bc.Builder('SummitRoad','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        gravel=VISITOR+64<p['d']<21800
        road=0xAB9481 if gravel else 0x5D6060
        bands=[(-4.25,-3.65,0xA68F7D),(-3.65,3.65,road),(3.65,4.25,0xA68F7D)]
        if not gravel:
            bands.extend(((-3.48,-3.38,0xDEDCCE),(3.38,3.48,0xDEDCCE),(-.145,-.045,0xE6BB64),(.045,.145,0xE6BB64)))
        for j,(a,c,t) in enumerate(bands):
            h=.018 if j>=3 else 0;b.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,c,h),r.at(i,c,h));b.colours.extend([lin(t)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('CinderSlope','terrain');b.colours=[]
    def height(p,off):
        relief=smooth(4.4,40,abs(off));mount=smooth(4000,11000,p['d'])
        return p['z']-.18+relief*(-off*(.10+.35*mount)+min(11,abs(off)*.055)*math.sin(p['d']/103+off/28)+math.sin(off/9+p['d']/33)*.46)
    last=None
    for i in range(0,len(r.s),3):
        p=r.s[i];row=[]
        for off in (-1800,-400,-170,-75,-34,-13,-4,4,15,38,84,176,410,1600):
            x,y,_=r.at(i,off);w=smooth(36,90,abs(off))
            x+=(p['x']-x)*w;y+=(p['y']+off-y)*w
            palette=(0x4F514A,0x646051,0x6F6B59,0x585950) if p['d']<9700 else (0x9E7865,0x8E6858,0xA78369,0x947965)
            tone=palette[int((math.sin(p['d']/183+off*.029)+1)*1.7)]
            row.append(((x,y,height(p,off)),lin(tone)))
        if last:
            for a,c,e,f in zip(last,last[1:],row[1:],row):b.quad(a[0],f[0],e[0],c[0]);b.colours.extend((a[1],f[1],e[1],c[1]))
        last=row
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return height(p,off)
    return None,sample


def cone(art,x,y,z,width,height,phase):
    layers=[]
    for up,radius in ((-.20,1.14),(.06,1.0),(.24,.70),(.57,.40),(.87,.19),(1,.105),(.78,.035)):
        ring=[]
        for n in range(40):
            a=n*math.tau/40
            r=width*radius*(1+.085*math.sin(3*a+phase)+.05*math.cos(7*a+phase))
            ring.append((x+r*math.cos(a)+width*.13*up,y+r*.79*math.sin(a),z+height*(up+.024*math.cos(5*a+phase))))
        layers.append(ring)
    tints=(0x9C7561,0x9D705E,0xAC7963,0x8C6459,0xA8816B,0x795A50)
    for j,(lo,hi) in enumerate(zip(layers,layers[1:])):
        for n in range(40):
            m=(n+1)%40;c=lin(tints[(j+(n//8)%2)%6])
            art.face((lo[n],lo[m],hi[m],hi[n]),(c,c,c,c))


def dome(art,at,u,v,r,z,base):
    stone=lin(0xB9B6AD)
    art.tube(at(u,v,z),r*.94,r*.94,base,lin(0x8D8986),stone,24,stone)
    rings=[]
    for j in range(12):
        theta=j*math.pi/22
        rings.append([at(u+r*math.cos(theta)*math.cos(n*math.tau/32),v+r*math.cos(theta)*math.sin(n*math.tau/32),z+base+r*math.sin(theta)) for n in range(32)])
    for j,(lo,hi) in enumerate(zip(rings,rings[1:])):
        for n in range(32):
            m=(n+1)%32;c=lin((0xD7D8D2,0xE6E6DD,0xCACDC8,0xD9DAD2)[(n//3+j//3)%4])
            if n in (22,23):c=lin(0x606568)
            art.face((lo[n],lo[m],hi[m],hi[n]),(c,)*4)
    for n in (3,11,20,24):
        for j in range(10):beam(art,rings[j][n],rings[j+1][n],.12,.13,lin(0xA8ABA6))


def scenery(k):
    art=Painted(k);far=Painted(k,'peaks');plants=pictured(k,'MamaneTrees');signs=pictured(k,'MaunaSigns')
    for d in range(-75,26120,643):
        for side in (-1,1):
            dist=k.rng.uniform(420,870);x,y,z=k.road.pos(d);summit=d>9400
            if not summit and side>0:continue
            cone(far,x,y+side*dist,z-120,k.rng.uniform(270,560),k.rng.uniform(220,360),d*.013+side)
    # Mauna Loa's broad shield rises above a soft, lower cloud bank.
    x,y,z=k.road.pos(17900);cone(far,x+450,y+3680,2750,3850,1120,4)
    for d in range(-48,10990,9):
        n=2 if 2400<d<8350 else 1
        for j in range(n):
            side=k.rng.choice((-1,1));offset=side*k.rng.uniform(6,36);x,y,_=k.road.pos(d,offset);z=k.height_at(x,y)-.11
            kind=k.rng.choice((0,1)) if n==2 else 3
            if abs(d-VISITOR)<130 and d%3==0:kind=2
            high=k.rng.uniform(2.5,5.6) if kind<2 else k.rng.uniform(.44,1.12)
            width=high*(1.22 if kind<2 else 1.06);a=k.rng.random()*math.pi
            for yaw in (a,a+math.pi/2):
                dx=width*.5*math.cos(yaw);dy=width*.5*math.sin(yaw);u=kind%2*.5;v=(1-kind//2)*.5
                picture(plants,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+high),(x-dx,y-dy,z+high)),((u+.006,v+.006),(u+.494,v+.006),(u+.494,v+.494),(u+.006,v+.494)))
    at,h=site(k,VISITOR+43,-15)
    art.box(at(0,0,-1),(21,8,4.8),h,lin(0x958576));art.roof(at(0,0,3.8),22,9,2.05,h,lin(0x6E6557))
    art.box(at(-7,5,0),(9.6,4.9,3.10),h,lin(0xAA9984));art.roof(at(-7,5,3.1),10,5.1,1.24,h,lin(0x70685A))
    for j in range(6):art.box(at(-8.6+j*3.1,4.025,1.3),(1.65,.085,1.43),h,lin(0x576469))
    for d in range(8850,9050,4):
        a,yaw=site(k,d,4.5);art.tube(a(0,0,0),.20,.055,.68,lin(0xDB7834),lin(0xDC8C4C),8);art.tube(a(0,0,.32),.13,.115,.10,lin(0xEEE4D4),lin(0xE4DDCF),8)
    for d,tile in ((8960,0),(9055,1),(14810,2),(25272,3)):
        a,yaw=site(k,d,-4.33);art.box(a(0,0,-.20),(.11,.13,2.5),yaw,lin(0x9B9481))
        u=tile%2*.5;v=(1-tile//2)*.5
        picture(signs,(a(0,.72,1.23),a(0,-.72,1.23),a(0,-.72,2.36),a(0,.72,2.36)),((u+.004,v+.004),(u+.496,v+.004),(u+.496,v+.496),(u+.004,v+.496)))
    for d in range(-50,26060,19):
        side=k.rng.choice((-1,1));off=side*k.rng.uniform(5,26);x,y,_=k.road.pos(d,off);z=k.height_at(x,y);r=k.rng.uniform(.24,1.46)
        art.tube((x,y,z-.13),r,r*.62,r*.75,lin(0x625C56),lin(0x786E63),7,lin(0x7F756A))
    d = 22052
    # Twin white Keck domes and the angular, cylindrical Subaru enclosure.
    a,yaw=site(k,d,-48)
    _,_,z=a(0,0)
    base=k.height_at(*a(0,0)[:2])-z
    for u in (-15,15):dome(art,a,u,-6,8.3,base-.3,6.9)
    a,yaw=site(k,d+55,-33)
    art.tube(a(0,0,-.50),8.6,8.6,15.8,lin(0x7E8790),lin(0xC1C5C6),20,lin(0xBFC3C3))
    for j in range(9):
        angle=j*math.tau/9
        art.tube(a(8.64*math.cos(angle),8.64*math.sin(angle),1.1),.11,.11,13.76,lin(0x819198),lin(0xAAB4B4),7)
    a,yaw=site(k,25315,-39)
    x,y,z=a(0,0)
    grounding=k.height_at(x,y)-z
    art.tube(a(0,0,grounding-1),8.4,8.4,7.8,lin(0x9DA2A2),lin(0xD1D3C9),32,lin(0xC2C6C5))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':surface,'terrain':{'sea':False},'road_half_width':3.65,
       'land':{'mid':0x9F8170},'sky':[0xC2D3DC,0x9ABBD3,0x609AC8,0x3A75B1,0x28588C],'haze':0xB9C8CC,
       'light':[0xFFE5C6,1.87],'fill':[0xBCDBEF,0xB8977F],'sun_radius':12,'sun_altitude':.45,'sun_azimuth':.68}
