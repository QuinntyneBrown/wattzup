"""Berlin Tempelhofer Feld, its runways and ring road."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 48], [900.0, 47.5917], [1175.0, 47.8849], [1400.0, 47.7401], [1900.0, 47.8933], [2350.0, 47.6036], [2527.5, 47.6917], [2752.5, 47.5469], [2930.0, 47.635], [3155.0, 47.4901], [3421.25, 47.6223], [3871.25, 47.3326], [4127.916666666667, 47.5576], [4352.916666666667, 47.4127], [4829.583333333334, 47.8305], [5279.583333333334, 47.5408], [5429.583333333334, 47.7007], [5654.583333333334, 47.5559], [5804.583333333334, 47.7159], [6029.583333333334, 47.571], [6179.583333333334, 47.731], [6404.583333333334, 47.5862], [6554.583333333334, 47.7461], [6779.583333333334, 47.6013], [7060.833333333334, 47.8477], [7398.333333333334, 47.6305], [7679.583333333334, 47.877], [8017.083333333334, 47.6597], [8298.333333333334, 47.9062], [8635.833333333334, 47.689], [8917.083333333334, 47.9354], [9254.583333333334, 47.7182], [9535.833333333334, 47.9646], [9873.333333333334, 47.7474], [10148.333333333334, 48.0406], [10373.333333333334, 47.8958], [10648.333333333334, 48.1891], [10873.333333333334, 48.0442], [11148.333333333334, 48.3375], [11373.333333333334, 48.1926], [11648.333333333334, 48.4859], [11873.333333333334, 48.3411], [12148.333333333334, 48.6343], [12909.166666666668, 48.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # Straights are linked by the former taxiway turns and park perimeter.
    angle=0
    for a,b,turn in ((1810,2180,math.pi),(4000,4490,-math.pi),(6220,6550,math.pi),(8090,8500,-math.pi),(10460,10870,math.pi)):
        f=min(1,max(0,(d-a)/(b-a)));angle+=turn*f
    return angle+.025*math.sin(d/120)*max(0,min(1,(d-6550)/90,(10040-d)/90))

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def width(d):
    # The main concrete strip opens out of the much narrower bituminous taxiways.
    runway=max(max(0,min(1,(d-a)/80,(b-d)/80)) for a,b in ((-300,1880),(4440,6280),(10800,12300)))
    return 4.6+19.3*runway

def road(r,st,length,col,bc):
    m=bc.Builder('RunwaySlabs','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];e=r.s[i+1]['d'];a=width(d);b=width(e)
        picture(m,[r.at(j,v,.042) for j,v in ((i,-a),(i+1,-b),(i+1,b),(i,a))],((-a,d),(-b,e),(b,e),(a,d)))
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('TempelGrass','terrain');m.colours=[];m.uvs=[]
    # Use the field in plan. Intersecting strips would cover a runway on the return leg.
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s]
    for x in range(int(min(xs))-600,int(max(xs))+621,24):
        for y in range(int(min(ys))-460,int(max(ys))+465,24):
            pts=[]
            for u,v in ((0,0),(24,0),(24,24),(0,24)):
                xp=x+u;yp=y+v;idx=r.tree.find((xp,yp,0))[1];pts.append((xp,yp,r.s[idx]['z']-.44))
            picture(m,pts,[(a/14,b/14) for a,b,c in pts])
    return m.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.42

def scenery(k):
    art=Painted(k);terminal=pictured(k,'TerminalBays');grass=pictured(k,'SkylarkGrass');garden=pictured(k,'AllmendeBeds');rim=pictured(k,'BerlinHorizon');sign=pictured(k,'AirfieldSigns')
    stone,iron,glass,grasscol,gold,white,red,wood,blue=map(lin,(0xB9AD96,0x646D6B,0x536B73,0x797D50,0xE8AF47,0xD5D1BC,0xA85449,0x8C7459,0x627E94))
    def panel(m,pts,idx=0,cols=1):
        u=idx/cols;v=(idx+1)/cols;picture(m,pts,((u+.001,0),(v-.001,0),(v-.001,1),(u+.001,1)))
    for j,d in enumerate(range(-42,12970,12)):
        w=width(d);at,h=site(k,d)
        if w>12:
            if j%3==0:
                pts=[k.road.pos(d+u,v,.06) for u,v in ((-6,-.35),(6,-.35),(6,.35),(-6,.35))];art.face(pts,(white,)*4)
            if j%5==0:
                for v in (-w+.7,w-.7,0):art.tube(at(2,v,.073),.12,.084,.032,iron,gold,9,cap=gold)
            if d<210 and j%7==0:
                for v in (-17,-14.4,-11.8,-9.2,-6.6,6.6,9.2,11.8,14.4,17):art.box(at(0,v,.068),(20.3,1.38,.016),h,white)
        else:
            pts=[k.road.pos(d+u,v,.06) for u,v in ((-6,-.072),(6,-.072),(6,.072),(-6,.072))];art.face(pts,(gold,)*4)
        if j%13==0:
            for v in (-w-1,w+1):
                art.tube(at(0,v,-.24),.24,.17,.42,iron,iron,7);art.tube(at(0,v,.17),.094,.081,.12,blue,blue,8,cap=gold)
        if j%47==0:
            at,h=site(k,d,w+2)
            art.box(at(0,0,-.24),(.17,1.54,.65),h,iron)
            panel(sign,[at(-.10,v,z) for v,z in ((-.8,.11),(.8,.11),(.8,.86),(-.8,.86))])
        if 8600<d<10420 or 4000<d<5200:
            at,h=site(k,d,w+4);art.box(at(0,0,-.42),(.15,.15,1.45),h,wood)
            for z in (.52,.92):beam(art,at(-6,0,z),at(6,0,z),.032,iron)
        for side in (-1,1):
            for i in range(2):
                v=side*(w+k.rng.uniform(2.6,22));pt=k.road.pos(d+i*3,v);x,y,_=pt;z=k.height_at(x,y)
                ht=k.rng.uniform(.69,1.32);ww=ht*1.7;a=j*.38;dx=ww*math.cos(a);dy=ww*math.sin(a)
                panel(grass,[(x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+ht),(x-dx,y-dy,z+ht)],(j+i)%2,2)
    # A curved, column-supported apron canopy runs along the faceted terminal elevation.
    centre,h=site(k,2565,-65)
    def apron(u,v,z):
        bend=.00047*u*u;return centre(u,v-bend,z)
    for j in range(28):
        u=-216+j*16
        panel(terminal,[apron(x,0,z) for x,z in ((u,-.1),(u+16,-.1),(u+16,12.8),(u,12.8))],j%4,4)
        pts=[apron(x,v,6.9+(v/6)*.36) for x,v in ((u,0),(u+16,0),(u+16,8),(u,8))];art.face(pts,(iron,)*4);art.face(pts[::-1],(iron,)*4)
        a=apron(u+1,6.6,-.35);art.tube(a,.22,.22,7.65,iron,iron,8)
        beam(art,apron(u,7.9,7.35),apron(u+16,7.9,7.35),.21,iron)
    at,h=site(k,2612,-87)
    art.box(at(0,0,-.5),(24,13,11.5),h,stone);art.tube(at(0,0,11),2.5,2.1,9,stone,iron,12,cap=iron)
    art.tube(at(0,0,20),3.45,3.55,2.7,glass,glass,14,cap=iron);art.tube(at(0,0,22.7),3.72,3.17,.52,iron,iron,14,cap=iron)
    for d in (4924,12678):
        at,h=site(k,d,-width(d)-2.4);art.tube(at(0,0,-.4),.16,.095,8.5,iron,iron,9,cap=iron)
    for j,d in enumerate(range(7032,7400,12)):
        at,h=site(k,d,9+(j%3)*3)
        art.box(at(0,0,-.43),(6,3.1,.66),h,wood)
        for i in range(4):
            for n in (-.77,.77):art.tube(at(-2+i*1.3,n,.21),.49,.35,.55,grasscol,grasscol,6,cap=grasscol)
        if j%3==0:
            panel(garden,[at(-.5,v,z) for v,z in ((-3.8,-.24),(3.8,-.24),(3.8,3.87),(-3.8,3.87))],(j//3)%3,3)
        if j%4==0:
            art.box(at(0,-4.2,.65),(2.4,.82,.14),h,wood)
            for v in (-4.95,-3.45):art.box(at(0,v,.38),(2.41,.45,.12),h,wood)
    # Fernsehturm and church spires are separate silhouettes above the distant roofs.
    at,h=site(k,9760,270);art.tube(at(0,0,-1),1.29,.66,38,stone,white,12)
    art.tube(at(0,0,37),2.9,4.2,2.6,iron,white,14);art.tube(at(0,0,39.6),4.2,2.1,2.7,white,iron,14,cap=iron)
    art.tube(at(0,0,42.3),.49,.11,13.2,red,white,10)
    for i in range(3):
        at,h=site(k,9620+i*88,192+i*16);art.box(at(0,0,0),(4.8,5.1,15),h,stone);art.tube(at(0,0,15),3.8,.12,11,iron,iron,4)
    for j in range(64):
        a=j*math.tau/64;b=(j+1)*math.tau/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def e(t,z):return 1300+6200*math.cos(t),800+6100*math.sin(t),z
        picture(rim,(e(a,-300),e(b,-300),e(b,1670),e(a,1670)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.6,'terrain':{'sea':False},'land':{'mid':0x898966},'sky':[0xBED3DF,0xA6C8E1,0x8AB4D7,0x619BCC,0x4F83B6],'haze':0xB9C9D2,'light':[0xFFF1D4,1.40],'fill':[0xC9DDE6,0x958E7F],'sun_altitude':.65,'sun_azimuth':-.81}
