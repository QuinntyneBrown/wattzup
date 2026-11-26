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


def cove(x):
    return 13*math.exp(-((x-713)/103)**2)


def waterline(x):
    return 33+4.8*math.sin(x/138)+3.1*math.sin(x/61)-cove(x)


def land(r,col,theme,bc):
    ground=bc.Builder('AtlanticSeaboard','terrain');ground.colours=[]
    def level(x,y):
        _,i,_=r.tree.find((x,y,0));base=r.s[i]['z']-.15
        return base-(base+1.3)*smooth(23-cove(x)*.75,waterline(x)+6,y)+24*smooth(134,345,-y)
    last=None
    for x in range(-160,2180,8):
        w=waterline(x);row=[]
        for y,c in ((-450,0x78866A),(-260,0x8E9375),(-143,0xAAAD90),(-117,0xB9B8A1),(-100,0xBCC4A6),(-22,0xA6B793),(-6,0xB5BBA2),(0,0xA3AA89),(5,0xA4AF82),(7,0x7F9D64),(14-cove(x)*.51,0x86A86A),(16-cove(x)*.54,0xCBBFA5),(22.5-cove(x)*.75,0xD2C7AD),(24.2-cove(x)*.75,0x938873),(w,0x807867),(w+7,0x6F7265),(w+55,0x627569)):
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
    def road_height(x):return elevation(max(0,min(STRAIGHT,x)))
    def tile(mesh,pts,index,cols,rows):
        u=index%cols/cols;v=1-(index//cols+1)/rows
        face(mesh,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    # A flat sandstone summit seen beyond the lower, rounded rump and pointed granite core.
    def mountain(mesh,cx,cy,width,depth,peak,profile):
        # Project the original relief portrait onto the foothills, upper cliff and ridge.
        previous=None
        for i,crest in enumerate(profile):
            t=i/(len(profile)-1);x=cx+(t-.5)*width;row=[]
            for j,(reach,rise) in enumerate(((1.,0.),(.69,.19),(.46,.39),(.28,.57),(.17,.72),(.10,.91),(0.,1.))):
                gully=(13*math.sin(i*.65+j*.47)+7*math.sin(i*.26))*math.sin(math.pi*rise)
                row.append(((x,cy+depth*reach+gully,-4+peak*crest*rise),(1-t,crest*rise)))
            if previous:
                for j in range(len(row)-1):
                    pts=(previous[j],previous[j+1],row[j+1],row[j])
                    picture(mesh,[p for p,uv in pts],[uv for p,uv in pts])
            previous=row
    mountain(pictured(k,'LionsHead'),480,-1070,1400,390,555,(0.0114, 0.0492, 0.0833, 0.1098, 0.1136, 0.1061, 0.1136, 0.1364, 0.1515, 0.1742, 0.197, 0.2083, 0.2235, 0.2386, 0.25, 0.2689, 0.2841, 0.3144, 0.3295, 0.3826, 0.4242, 0.4621, 0.4886, 0.5, 0.5152, 0.5379, 0.5644, 0.6061, 0.6742, 0.7614, 0.875, 0.9432, 0.9886, 0.9811, 0.9508, 0.9167, 0.8902, 0.8182, 0.7386, 0.7235, 0.6818, 0.6212, 0.5985, 0.5795, 0.553, 0.5114, 0.4811, 0.4583, 0.4394, 0.4242, 0.4053, 0.3864, 0.3712, 0.3636, 0.3561, 0.3182, 0.2992, 0.2803, 0.2614, 0.2348, 0.2121, 0.197, 0.1818, 0.178, 0.1742, 0.178, 0.178, 0.1705, 0.1667, 0.1477, 0.1326, 0.1174, 0.1098, 0.0985, 0.0833, 0.0644, 0.053, 0.0417, 0.0227, 0.0114, 0.0038))
    mountain(pictured(k,'TableMountain'),-950,-1800,2495,490,704,(0.2909, 0.3045, 0.3636, 0.4227, 0.4409, 0.4864, 0.5182, 0.75, 0.7818, 0.8091, 0.8545, 0.8727, 0.9, 0.8864, 0.9182, 0.9545, 0.9636, 0.9591, 0.9682, 0.9636, 0.95, 0.9455, 0.9455, 0.9409, 0.9409, 0.9409, 0.9364, 0.9364, 0.9364, 0.9364, 0.9273, 0.9273, 0.9318, 0.9273, 0.9227, 0.9227, 0.9227, 0.9227, 0.9182, 0.9182, 0.9182, 0.9136, 0.9227, 0.9318, 0.9273, 0.9227, 0.9182, 0.9136, 0.8955, 0.85, 0.8227, 0.8182, 0.8136, 0.8182, 0.8182, 0.8227, 0.8045, 0.7955, 0.8318, 0.8818, 0.8955, 0.9182, 0.9318, 0.9273, 0.8909, 0.7909, 0.7591, 0.7545, 0.7318, 0.6864, 0.6455, 0.6318, 0.5955, 0.5091, 0.5045, 0.4909, 0.4818, 0.4591, 0.3909, 0.3182, 0.2727))
    mountain(pictured(k,'SignalHill'),1540,-930,1480,335,255,(0.0728, 0.106, 0.1391, 0.1722, 0.2053, 0.245, 0.2781, 0.3444, 0.3907, 0.4371, 0.4834, 0.5298, 0.5695, 0.6159, 0.6424, 0.6689, 0.6887, 0.7086, 0.7285, 0.7417, 0.7483, 0.7616, 0.7748, 0.8013, 0.8146, 0.8278, 0.8477, 0.8609, 0.894, 0.9205, 0.9139, 0.9272, 0.947, 0.9603, 0.9735, 0.9603, 0.9536, 0.9536, 0.9272, 0.9205, 0.9139, 0.9205, 0.9073, 0.894, 0.8808, 0.8609, 0.8411, 0.8344, 0.8079, 0.7881, 0.7815, 0.7815, 0.7682, 0.755, 0.7351, 0.7483, 0.755, 0.7616, 0.755, 0.7417, 0.7285, 0.7086, 0.6755, 0.6556, 0.6358, 0.6093, 0.5828, 0.5497, 0.5298, 0.5033, 0.4702, 0.4371, 0.4106, 0.3709, 0.3311, 0.3046, 0.2715, 0.2318, 0.1722, 0.1126, 0.0596))
    # Saunders' exposed rock shelf forms a pocket of clear seawater immediately behind the wall.
    for i in range(49):
        x=668+i*1.65; y=16.2+2.4*math.sin(i*.31)
        if 694<x<707:y+=3.4
        for j in range(3):
            xx=x+rng.uniform(-.6,.6);yy=y+j*3.4
            z=2.1+1.31*math.sin(i*.42+j*.93)+rng.uniform(-.20,.45)
            a=rng.uniform(1.6,2.8);b=rng.uniform(1.15,2.1)
            pts=[(xx-a,yy-b,z-.18),(xx+a*.61,yy-b*.80,z+.19),(xx+a,yy+b*.55,z+.31),(xx-a*.48,yy+b,z)]
            face(ledges,pts)
            for n in range(4):
                m=(n+1)%4
                face(ledges,((pts[n][0],pts[n][1],-.3),(pts[m][0],pts[m][1],-.3),pts[m],pts[n]))
    for i in range(0,2010,6):
        w=waterline(i);b=waterline(i+6)
        face(ocean,[(i,w,-.4),(i+6,b,-.4),(i+6,2000,-.4),(i,2000,-.4)],((i,0),(i+6,0),(i+6,2000-b),(i,2000-w)))
        for j in range(2):
            x=i+rng.uniform(-4,4);y=w+rng.uniform(-4,14);wide=rng.uniform(1.8,5.4);deep=rng.uniform(1.3,3.7)
            ring=[];top=[]
            for n in range(7):
                a=math.tau*n/7;xx=math.cos(a)*wide;yy=math.sin(a)*deep
                ring.append((x+xx,y+yy,-1.25));top.append((x+xx*.77+.25,y+yy*.83,.72+1.28*rng.random()))
            for n in range(7):
                m=(n+1)%7;face(ledges,(ring[n],ring[m],top[m],top[n]))
                face(ledges,(top[n],top[m],(x,y,1.92)),((0,0),(1,0),(.5,.93)))
        for y in (() if 1080<i<1200 or 674<i<742 else (16,22)):
            art.box((i,y-cove(i)*.68,road_height(i)-.28),(6,.17,.24),0,chalk)
        if not (1080<i<1260 or 674<i<742):
            v=23-cove(i)*.75;h=road_height(i)
            art.box((i,v,h-.38),(.15,.15,1.42),0,rail)
            for t in (.52,1.04):beam(art,(i,v,h+t),(i+6,v,road_height(i+6)+t),.068,rail)
    # Apartment blocks face the sea. The dark recess below each balcony catches the sky fill.
    for i in range(-40,2005,28):
        x=i+rng.uniform(-4,3);y=-rng.uniform(19,30);h=rng.uniform(12,25);w=rng.uniform(14,25);base=road_height(x)-.6
        if 900<x<988 or 1250<x<1340:continue
        art.box((x,y,base),(w,12,h),0,chalk);art.box((x,y,base+h),(w+.9,12.7,.4),0,lin(0xB5B6AC))
        tile(fronts,[(x+u,y+6.08,base+up) for u,up in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],i//28%2,2,1)
        for up in range(3,int(h),3):
            art.box((x,y+6.6,base+up),(w*.90,1.28,.23),0,chalk)
    # Beach Road's inland return looks past a foreground of villas and trees to the ridges.
    for x in range(-10,1960,33):
        if 1000<x<1170 or 190<x<445:continue
        y=-142-rng.uniform(2,15);base=k.height_at(x,y)-.28
        w=rng.uniform(17,26);h=rng.uniform(7,13.6)
        art.box((x,y,base),(w,9,h),0,lin(0xDED8C7))
        art.box((x,y,base+h),(w+.8,9.8,.36),0,chalk)
        tile(fronts,[(x+u,y+4.55,base+v) for u,v in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],(x//33)%2,2,1)
        for dx in (-.32,.32):
            art.box((x+w*dx,y+5.1,base+3.7),(w*.25,1.28,.32),0,chalk)
    for x in range(-18,1960,18):
        y=-123-rng.uniform(2,10);base=k.height_at(x,y);tall=rng.uniform(4.9,8.6)
        face(trees,[(x+a,y+.26*a,base+v) for a,v in ((-tall*.31,0),(tall*.31,0),(tall*.31,tall),(-tall*.31,tall))])
    for i in range(10,1930,24):
        x=i+rng.uniform(-4,4);y=rng.uniform(8,13)-cove(x)*.22;base=road_height(x)-.21;tall=rng.uniform(7,12)
        face(trees,[(x+t*.44,y+t,base+up) for t,up in ((-tall*.31,0),(tall*.31,0),(tall*.31,tall),(-tall*.31,tall))])
        if 1098<i<1185 or 680<i<740:continue
        if i%3==1:
            art.box((x,16.2,base+.5),(2.35,.55,.135),0,timber)
            art.box((x,16.45,base+.68),(2.35,.1,.48),0,timber)
        if i%4:
            u=rng.uniform(-5,5);v=rng.uniform(17,21);t=rng.randrange(3)
            tile(families,[(x+u+a*.35,v+a,base+h) for a,h in ((-1.2,0),(1.2,0),(1.2,2.05),(-1.2,2.05))],t,3,1)
    # Sea Point Pavilion: ocean-facing deck, actual 50m pool, distinct lanes and stepped terrace.
    x=1140;y=18.8;deck=4.94
    art.box((x,y+1.1,-.8),(70,28,deck+.8),0,lin(0xC9B596))
    face(pool,[(x+u,y+v,deck+.07) for u,v in ((-25,-9),(25,-9),(25,9),(-25,9))])
    for v in (-9.4,9.4):art.box((x,y+v,deck),(51.4,.7,.24),0,chalk)
    for u in (-25.4,25.4):art.box((x+u,y,deck),(.7,18.8,.24),0,chalk)
    for v in range(-6,9,3):
        for u in range(-25,25,2):art.box((x+u+1,y+v,deck+.12),(1.98,.1,.13),0,lin(0xC86452 if u%4 else 0xD9BF69))
    for j in range(4):art.box((x,y+12+j*1.65,deck),(64,1.65,.45+j*.52),0,chalk)
    for j in range(6):
        v=y-8+j*3.0
        art.box((x,v,deck+.085),(49.6,.18,.03),0,lin(0x33687D))
    for u in (-26.8,26.8):
        for j in range(6):art.box((x+u,y-7.5+j*3,deck+.15),(.72,.63,.52),0,chalk)
    for u in (-19,18):
        art.box((x+u,y-10.3,deck+1.2),(1.15,.86,.24),0,lin(0xB45E43))
        for dx in (-.48,.48):
            beam(art,(x+u+dx,y-10.6,deck),(x+u+dx,y-10.4,deck+2.2),.08,rail)
    # Green Point's square tower has diagonal stripes wrapped across each face.
    x=1988;y=22;base=road_height(x);red=lin(0xC64E43)
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
