"""Two 4.225 km circuits between Sea Point's Atlantic promenade and the inland return."""
import math
from arenberg import beam
from iten_landmarks import pictured,picture
from worldkit import Painted,lin,smooth

LAP=4225.
RADIUS=56.
STRAIGHT=(LAP-2*math.pi*RADIUS)/2
PROFILE=((0,5),(680,4.2),(1130,4.8),(1940,5.2),(2250,7.5),(3020,9.2),(3645,7.4),(LAP,5))


def elevation(d):
    q=d%LAP
    for (a,z),(b,w) in zip(PROFILE,PROFILE[1:]):
        if q<=b:return z+(w-z)*smooth(a,b,q)


def centre(d):
    q=d%LAP
    if q<STRAIGHT:return q,0,0
    q-=STRAIGHT
    if q<math.pi*RADIUS:
        a=q/RADIUS
        return STRAIGHT+RADIUS*math.sin(a),RADIUS*(math.cos(a)-1),-a
    q-=math.pi*RADIUS
    if q<STRAIGHT:return STRAIGHT-q,-2*RADIUS,-math.pi
    a=math.pi+(q-STRAIGHT)/RADIUS
    return RADIUS*math.sin(a),RADIUS*(math.cos(a)-1),-a


def pos(d,side=0,up=0):
    x,y,h=centre(d)
    return x-side*math.sin(h),y+side*math.cos(h),elevation(d)+up


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);dh=centre(d+.5)[2]-centre(d-.5)[2]
        rows.append(dict(x=x,y=y,h=h,d=d,z=elevation(d),k=math.atan2(math.sin(dh),math.cos(dh)),g=100*(elevation(d+1)-elevation(d))))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1


def road(r,st,length,col,bc):
    path=bc.Builder('BeachRoad','terrain');path.colours=[];path.uvs=[]
    stripes=bc.Builder('BeachRoadPaint','terrain');stripes.colours=[]
    for i in range(math.ceil(LAP/2)):
        a=i*2;b=min(LAP,a+2)
        p=[(d,v) for d,v in ((a,-4.7),(b,-4.7),(b,4.7),(a,4.7))]
        picture(path,[pos(d,v,.12) for d,v in p],[(d/5,v/5) for d,v in p])
        for v in (-4.2,0,4.2):
            if v==0 and i%5>1:continue
            pts=[pos(d,u,.15) for d,u in ((a,v-.06),(b,v-.06),(b,v+.06),(a,v+.06))]
            stripes.quad(*pts);stripes.colours.extend([lin(0xEDE9D7 if v==0 else 0xDCB556)]*4)
    path.build(col);stripes.build(col)


def waterline(x):
    return 33+4.8*math.sin(x/138)+3.1*math.sin(x/61)


def land(r,col,theme,bc):
    ground=bc.Builder('AtlanticSeaboard','terrain');ground.colours=[]
    def level(x,y):
        _,i,_=r.tree.find((x,y,0));base=r.s[i]['z']-.15
        return base-(base+1.3)*smooth(23,waterline(x)+8,y)+24*smooth(134,345,-y)
    last=None
    for x in range(-160,2180,8):
        w=waterline(x);row=[]
        for y,c in ((-450,0x78866A),(-260,0x8E9375),(-143,0xAAAD90),(-117,0xB9B8A1),(-100,0xBCC4A6),(-22,0xA6B793),(-6,0xB5BBA2),(0,0xA3AA89),(5,0xA4AF82),(7,0x7F9D64),(14,0x86A86A),(16,0xCBBFA5),(22.5,0xD2C7AD),(24.2,0x938873),(w,0x807867),(w+7,0x6F7265),(w+55,0x627569)):
            row.append(((x,y,level(x,y)),lin(c)))
        if last:
            for j in range(len(row)-1):
                corners=(last[j],row[j],row[j+1],last[j+1]);ground.quad(*(p for p,c in corners));ground.colours.extend(c for p,c in corners)
        last=row
    return ground.build(col),level


def scenery(k):
    rng=k.rng;art=Painted(k);sky=Painted(k,'peaks')
    fronts=pictured(k,'SeaPointFlats');ledges=pictured(k,'TidalRock');pool=pictured(k,'PavilionWater')
    ocean=pictured(k,'CapeAtlantic');trees=pictured(k,'CapePalms');families=pictured(k,'SeaPointFamilies')
    chalk=lin(0xE6E2D6);rail=lin(0x8B9999);green=lin(0x688D5C);timber=lin(0x7F6E55)
    def face(mesh,pts,uv=((0,0),(1,0),(1,1),(0,1))):picture(mesh,pts,uv)
    def z(x):return elevation(max(0,min(STRAIGHT,x)))
    def tile(mesh,pts,index,cols,rows):
        u=index%cols/cols;v=1-(index//cols+1)/rows
        face(mesh,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    # A flat sandstone summit seen beyond the lower, rounded rump and pointed granite core.
    def mountain(cx,cy,width,depth,profile,base,tints):
        previous=None
        for i in range(81):
            t=i/80;x=cx+(t-.5)*width
            j=min(len(profile)-2,int(t*(len(profile)-1)));f=t*(len(profile)-1)-j
            top=profile[j]*(1-f)+profile[j+1]*f
            ridge=top+3*math.sin(i*1.39)+2*math.sin(i*.79)
            row=[]
            for n,(y,kz) in enumerate(((1,0),(.65,.22),(.41,.48),(.18,.68),(.14,.92),(0,1))):
                offset=11*math.sin(i*.83+n*2)+8*math.cos(i*.27)
                row.append((x,cy+depth*y+offset,base+ridge*kz))
            if previous:
                for n in range(len(row)-1):
                    c=lin(tints[n]);shade=tuple(v*(.83+.16*math.cos(i*.9+n)) for v in c[:3])+(1,)
                    sky.face((previous[n],previous[n+1],row[n+1],row[n]),(shade,c,c,shade))
            previous=row
    mountain(500,-2130,3250,560,(85,180,320,525,585,592,587,586,578,565,402,230,110),8,(0x747F70,0x919184,0xA39A89,0xAD9F8E,0xC3B29D))
    mountain(550,-1080,1430,465,(25,116,217,319,349,448,535,390,309,220,132,68,25),5,(0x778B67,0x819568,0x8B916E,0xA89C83,0xC9AD90))
    mountain(1450,-760,1690,362,(18,71,119,180,232,255,263,257,236,202,155,99,42),4,(0x788A5D,0x819562,0x879467,0x929774,0xABA184))
    for i in range(0,2010,6):
        w=waterline(i);b=waterline(i+6)
        face(ocean,[(i,w,-.4),(i+6,b,-.4),(i+6,2000,-.4),(i,2000,-.4)],((i,0),(i+6,0),(i+6,2000-b),(i,2000-w)))
        for j in range(2):
            x=i+rng.uniform(-4,4);y=w+rng.uniform(-4,17);wide=rng.uniform(1.8,5.4);deep=rng.uniform(1.3,3.7)
            ring=[];top=[]
            for n in range(7):
                a=math.tau*n/7;xx=math.cos(a)*wide;yy=math.sin(a)*deep
                ring.append((x+xx,y+yy,-1.25));top.append((x+xx*.77+.25,y+yy*.83,.1+.78*rng.random()))
            for n in range(7):
                m=(n+1)%7;face(ledges,(ring[n],ring[m],top[m],top[n]))
                face(ledges,(top[n],top[m],(x,y,1.12)),((0,0),(1,0),(.5,.93)))
        for y in (16,22):
            art.box((i,y,z(i)-.28),(6,.17,.24),0,chalk)
        if not 1080<i<1260:
            v=23;h=z(i)
            art.box((i,v,h-.38),(.15,.15,1.42),0,rail)
            for t in (.52,1.04):beam(art,(i,v,h+t),(i+6,v,z(i+6)+t),.068,rail)
    # Apartment blocks face the sea. The dark recess below each balcony catches the sky fill.
    for i in range(-40,2005,28):
        x=i+rng.uniform(-4,3);y=-rng.uniform(19,30);h=rng.uniform(12,25);w=rng.uniform(14,25);base=z(x)-.6
        if 900<x<988 or 1250<x<1340:continue
        art.box((x,y,base),(w,12,h),0,chalk);art.box((x,y,base+h),(w+.9,12.7,.4),0,lin(0xB5B6AC))
        tile(fronts,[(x+u,y+6.08,base+up) for u,up in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],i//28%2,2,1)
        for up in range(3,int(h),3):
            art.box((x,y+6.6,base+up),(w*.90,1.28,.23),0,chalk)
    for i in range(10,1930,24):
        x=i+rng.uniform(-4,4);y=rng.uniform(8,13);base=z(x)-.21;tall=rng.uniform(7,12)
        face(trees,[(x+t*.44,y+t,base+up) for t,up in ((-tall*.31,0),(tall*.31,0),(tall*.31,tall),(-tall*.31,tall))])
        if i%3==1:
            art.box((x,16.2,base+.5),(2.35,.55,.135),0,timber)
            art.box((x,16.45,base+.68),(2.35,.1,.48),0,timber)
        if i%4:
            u=rng.uniform(-5,5);v=rng.uniform(17,21);t=rng.randrange(3)
            tile(families,[(x+u+a*.35,v+a,base+h) for a,h in ((-1.2,0),(1.2,0),(1.2,2.05),(-1.2,2.05))],t,3,1)
    # Sea Point Pavilion: ocean-facing deck, actual 50m pool, distinct lanes and stepped terrace.
    x=1160;y=35;deck=3.32
    art.box((x,y,-.8),(82,45,deck+.8),0,lin(0xC9B596))
    face(pool,[(x+u,y+v,deck+.07) for u,v in ((-25,-9),(25,-9),(25,9),(-25,9))])
    for v in (-9.4,9.4):art.box((x,y+v,deck),(51.4,.7,.24),0,chalk)
    for u in (-25.4,25.4):art.box((x+u,y,deck),(.7,18.8,.24),0,chalk)
    for v in range(-6,9,3):
        for u in range(-25,25,2):art.box((x+u+1,y+v,deck+.12),(1.98,.1,.13),0,lin(0xC86452 if u%4 else 0xD9BF69))
    for j in range(4):art.box((x,y+12+j*1.65,deck),(64,1.65,.45+j*.52),0,chalk)
    # Green Point's square tower has diagonal stripes wrapped across each face.
    x=1945;y=14;base=z(x);red=lin(0xC64E43)
    art.box((x,y,base),(6.4,6.4,13.5),0,chalk)
    for side in range(4):
        a=side*math.pi/2;nx=math.cos(a);ny=math.sin(a);tx=-ny;ty=nx
        def wall(u,h):return (x+3.22*nx+u*tx,y+3.22*ny+u*ty,base+h)
        for n in range(-2,5):
            lo=n*5.5+side*.1
            poly=[(-3.2,lo), (3.2,lo+5.5),(3.2,lo+8.1),(-3.2,lo+2.6)]
            for edge,sign in ((0,1),(13.5,-1)):
                old=poly;poly=[]
                for j,b in enumerate(old):
                    aa=old[j-1];inside=(b[1]-edge)*sign>=0;prev=(aa[1]-edge)*sign>=0
                    if inside!=prev:poly.append((aa[0]+(b[0]-aa[0])*(edge-aa[1])/(b[1]-aa[1]),edge))
                    if inside:poly.append(b)
            if len(poly)>2:art.face([wall(u,h) for u,h in poly],(red,)*len(poly))
    art.box((x,y,base+13.5),(7.8,7.8,.62),0,chalk)
    art.tube((x,y,base+14.12),2.6,2.6,2.75,lin(0x56838B),lin(0x94B8B8),16)
    art.tube((x,y,base+16.87),3,.45,1.65,red,red,16)
    for j in range(16):
        a=j*math.tau/16;u=x+2.64*math.cos(a);v=y+2.64*math.sin(a)
        art.tube((u,v,base+14),.075,.075,2.96,red,red,5)
    for dx in (-13,12):
        art.box((x+dx,y+3,base),(13,8,3.3),0,chalk);art.roof((x+dx,y+3,base+3.3),13,8,2,0,lin(0x85949B))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'road_half_width':4.7,
       'land':{'mid':0x99A68A},'haze':0xB9CBD0,'sky':[0xD0DDD7,0xA9CCDA,0x88BBD0,0x61A1C1,0x4585AB],
       'light':[0xFFE5B8,1.58],'fill':[0xC6DADE,0xB4A58A],'sun_altitude':.43,'sun_azimuth':.8}
