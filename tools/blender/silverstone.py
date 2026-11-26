"""Hamilton Straight, the Wing and the GP circuit, compressed to Flat Out Efforts."""
from bisect import bisect_right
from pathlib import Path
import math
import json
from worldkit import Painted,lin
from iten_landmarks import pictured,picture,site
from arenberg import beam

LAP=5543.75
PROFILE=((0,151),(520,149),(1220,151),(1770,148),(2440,150),(3300,147),(3830,146),(4630,152),(4970,150),(5250,148),(LAP,151))

def elevation(d):
    t=d%LAP
    for (a,h),(b,v) in zip(PROFILE,PROFILE[1:]):
        if t<=b:return h+(v-h)*(t-a)/(b-a)

def route(course,theme,bc):
    data=json.loads(Path(__file__).with_name('courses').joinpath('silverstone-line.geojson').read_text())
    coords=data['features'][0]['geometry']['coordinates'];origin=coords[70]
    raw=[((x-origin[0])*68550,(y-origin[1])*111195) for x,y in coords]
    stations=[0.]
    for a,b in zip(raw,raw[1:]):stations.append(stations[-1]+math.dist(a,b))
    scale=LAP/stations[-1]
    def sample(d):
        t=(d/scale+3120)%stations[-1];i=bisect_right(stations,t)-1
        f=(t-stations[i])/(stations[i+1]-stations[i]);return tuple((a+f*(b-a))*scale for a,b in zip(raw[i],raw[i+1]))
    def pos(d):
        # Preserve the straights. Smooth the surveyed vertices over a tyre-width at normal bends.
        a,b,c=sample(d-5),sample(d),sample(d+5);return tuple((u+2*v+w)/4 for u,v,w in zip(a,b,c))
    def heading(d):
        a,b=pos(d-2),pos(d+2);return math.atan2(b[1]-a[1],b[0]-a[0])
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=heading(d),g=100*(elevation(d+.5)-elevation(d-.5)),k=math.sin(heading(d+1)-heading(d-1))/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    track=bc.Builder('CircuitAsphalt','terrain');track.colours=[];track.uvs=[]
    edge=bc.Builder('PaintAndRunoff','terrain');edge.colours=[]
    def band(i,a,b,c,lift):
        edge.quad(r.at(i,a,lift),r.at(i+1,a,lift),r.at(i+1,b,lift),r.at(i,b,lift));edge.colours.extend((lin(c),)*4)
    for i,p in enumerate(r.s[:-1]):
        if p['d']<0 or p['d']>=LAP:continue
        j=min(i+3,len(r.s)-1)
        # Survey vertices along an apex are tens of metres apart. Average the approaching
        # change of direction so a kerb and gravel trap remain continuous between them.
        bend=math.sin(r.s[min(j+7,len(r.s)-1)]['h']-r.s[max(0,j-7)]['h'])/(14*bc.STEP)
        d=p['d']
        # The entry and exit strips extend beyond the geometric turn, as at Becketts and Stowe.
        zones=((3150,3350,-1),(3360,3490,1),(3490,3595,-1),(3595,3740,1),(3740,3835,-1),
               (4580,4770,-1),(4770,4920,1),(5420,5510,1))
        kerb_side=next((side for start,end,side in zones if start<=d<end),0)
        # A separate rubbered strip follows the approaching apex across the actual road width.
        racing=3.65*math.tanh(bend*135)
        for a,b,shade in ((-8,racing-1.42,1.),(racing-1.42,racing+1.42,.88),(racing+1.42,8,1.)):
            pts=[r.at(i,a),r.at(i+1,a),r.at(i+1,b),r.at(i,b)];picture(track,pts,((0,0),(1,0),(1,1),(0,1)))
            track.colours[-4:]=[(shade,shade,shade,1)]*4
        for side in (-1,1):
            def ribbon(a,b,c,h=.035):band(i,*sorted((side*a,side*b)),c,h)
            ribbon(7.78,8.03,0xEFEBE0)
            if kerb_side or abs(bend)>.0016:
                if side==(kerb_side or (1 if bend>0 else -1)):
                    ribbon(7.93,10.28,0xBA2C3D if i%2 else 0xF2EEE4,.085)
                    ribbon(10.28,13.7,0x4A8C70)
                else:
                    ribbon(8.1,13.3,0x596664)
                    ribbon(13.4,36,0xB2A79A)
    track.build(col);edge.build(col)

def land(r,col,theme,bc):
    b=bc.Builder('AirfieldGrass','terrain');b.colours=[]
    # A single terrain mesh covers the airfield. Outfield at one corner cannot cover a neighbouring racing surface.
    size=18
    points={}
    for p in r.s[::4]:
        if not 0<=p['d']<=LAP:continue
        ix,iy=math.floor(p['x']/size),math.floor(p['y']/size)
        for i in range(ix-9,ix+10):
            for j in range(iy-9,iy+10):points[(i,j)]=None
    for i,j in points:
        x,y=i*size,j*size
        near=r.tree.find_n((x,y,0),20)
        z=min(r.s[n]['z'] for _,n,_ in near)-.72
        points[(i,j)]=b.v((x,y,z))
    for i,j in points:
        coords=((i,j),(i+1,j),(i+1,j+1),(i,j+1))
        if all(q in points for q in coords):
            b.faces.append(tuple(points[q] for q in coords))
            for a,c in coords:
                tone=.94+.055*math.sin(a*.54+c*.09)+.035*math.cos(c*.42)
                b.colours.append(tuple(v*tone for v in lin(0x879B63)[:3])+(1,))
    return b.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.4

def scenery(k):
    art=Painted(k);sky=Painted(k,'peaks');atlas=pictured(k,'PaddockAtlas');boards=pictured(k,'CircuitBoards')
    metal,iron,white,red=map(lin,(0xACB1B3,0x4B5054,0xE9E8DF,0xB93A41))
    def panel(at,pts,tile,m=atlas):
        n=2 if m==atlas else 3;rows=2 if m==atlas else 3
        u=tile%n/n;v=1-(tile//n+1)/rows
        picture(m,[at(*p) for p in pts],[(u+.002,v+.002),(u+1/n-.002,v+.002),(u+1/n-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)])
    # Continuous pit galleries, with the Wing's rising, folded aluminium roof and painted red fascia.
    at,h=site(k,60,-37)
    art.box(at(0,0,-1),(255,21,10.6),h,metal)
    for i in range(22):
        a=-127+i*11.55;b=a+11.55
        panel(at,[(a,10.55,.1),(b,10.55,.1),(b,10.55,6.5),(a,10.55,6.5)],0)
        panel(at,[(a,10.58,6.45),(b,10.58,6.45),(b,10.58,10.8),(a,10.58,10.8)],1)
    roof=[(-135,15),(-112,20),(-82,13.6),(-39,12),(-8,13.1),(34,17),(64,15.6),(103,12.2),(124,22),(138,26)]
    for (a,z),(b,zz) in zip(roof,roof[1:]):
        for v,w,drop,rise,c in ((-14,2,-1.5,1.1,metal),(2,14,1.1,.12,white)):
            art.face([at(a,v,z+drop),at(b,v,zz+drop),at(b,w,zz+rise),at(a,w,z+rise)],(c,)*4)
        art.face([at(a,14,z-.32),at(b,14,zz-.32),at(b,14,zz+.12),at(a,14,z+.12)],(red,)*4)
        # Solid silver soffit and end cheeks make the folded roof readable from rider height.
        pts=[at(a,13.8,10.5),at(b,13.8,10.5),at(b,13.8,zz-.35),at(a,13.8,z-.35)]
        art.face(pts,(lin(0x879498),lin(0xAEB9BE),white,metal));art.face(pts[::-1],(white,metal,metal,white))
        for endpoint,top in ((a,z),(b,zz)):
            side=[at(endpoint,-13.9,10.4),at(endpoint,-13.9,top-1.5),at(endpoint,14,top),at(endpoint,14,10.4)]
            art.face(side,(iron,metal,white,iron));art.face(side[::-1],(iron,white,metal,iron))
        beam(art,at(a,11,8.2),at(a,14,z),.27,iron)
    # Start line and grid boxes painted flush with Hamilton Straight.
    start,sh=site(k,148,0)
    for i in range(24):
        for row in (0,1):
            v=-7.8+i*.65;u=row*.65
            art.face([start(u+a,v+b,.075) for a,b in ((0,0),(.65,0),(.65,.65),(0,.65))],
                     (white if (i+row)%2 else iron,)*4)
    for i in range(-130,141,7):
        art.box(at(i,22,.06),(6.93,.48,.92),h,white)
    def stand(d,side,span):
        at,h=site(k,d,side);away=1 if side>0 else -1
        for j in range(0,span,9):
            a=j-span/2;b=a+8.98
            panel(at,[(a,-away*5,1.2),(b,-away*5,1.2),(b,away*4,8.1),(a,away*4,8.1)],2)
            art.box(at(a,away*4,0),(.22,.25,11.4),h,iron)
            beam(art,at(a,away*4,10.8),at(a,-away*6,12.5),.23,metal)
            art.face([at(a,-away*7,12.5),at(b,-away*7,12.5),at(b,away*5,11.2),at(a,away*5,11.2)],(white,)*4)
    for d,s,w in ((110,30,144),(1450,37,72),(3220,-43,126),(3600,38,90),(4800,-54,81)):stand(d,s,w)
    at,h=site(k,1453,-25)
    art.box(at(0,0,-.5),(55,13,6.9),h,metal)
    for i in range(-27,27,9):
        panel(at,[(i,6.54,1.5),(i+9,6.54,1.5),(i+9,6.54,6.3),(i,6.54,6.3)],1)
        art.face([at(i,7.2,7.3),at(i+9,7.2,7.3),at(i+4.5,0,9.7)],(white,)*3)
    # Braking boards, gravel walls and screened marshal posts.
    for idx,d in enumerate((540,1380,3120,3260,3520,4580,4625,4670,4850,5480)):
        side=13 if idx%2 else -13;at,h=site(k,d,side)
        art.box(at(0,0,0),(.12,.15,1.7),h,iron)
        panel(at,[(0,-1.2,.65),(0,1.2,.65),(0,1.2,2.05),(0,-1.2,2.05)],idx%9,boards)
        if idx in (2,4,8,9):
            art.box(at(3,side*.46,0),(3.4,2.6,2.4),h,lin(0xD46A31));art.box(at(3,side*.46,2.4),(3.9,3.1,.25),h,iron)
    for d in range(0,5544,14):
        for side in (-1,1):
            at,h=site(k,d,side*(27 if 2800<d<4900 else 19))
            art.tube(at(0,0,-.55),.069,.058,3.85,iron,metal,6)
            for z in (1.24,2.15,3.05):beam(art,at(0,0,z),at(14,0,z+.015),.025,metal)
            if 3090<d<3660 or 4580<d<4930:
                panel(at,[(0,0,-.05),(14,0,-.05),(14,0,1.05),(0,0,1.05)],3)
            elif d%42==0:
                art.box(at(0,side*64,-1),(35,3.25,2.35),h,lin(0x687D4F))
    for i in range(0,5540,67):
        for side in (-1,1):
            at,h=site(k,i,side*(85+26*math.sin(i*.16)))
            if k.road.tree.find((*at(0,0,0)[:2],0))[2]<47:continue
            for j in range(3):
                x,y,z=at(j*3.5,1.2*math.cos(j+i),-1.1)
                art.tube((x,y,z),.39,.26,3.4,iron,iron,6)
                art.tube((x,y,z+2.25),3.2,3.55,2.5,lin(0x495F45),lin(0x637B55),9)
                art.tube((x,y,z+4.75),3.55,.64,2.65,lin(0x637B55),lin(0x809069),9)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':8,
       'land':{'mid':0x8D9A70},'haze':0xBAC0BD,'sky':[0xCFD2CD,0xC1C7CA,0xA5B0B7,0x879AA4,0x788C99],
       'light':[0xF0E7D0,1.32],'fill':[0xD3DCE2,0xABB2A0],'sun_altitude':.49,'sun_azimuth':-.66}
