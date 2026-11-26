"""Castleton, the enclosed limestone gorge of Winnats Pass and the Great Ridge."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 189], [1300, 213], [2500, 199], [4050, 224], [4820, 229], [5540, 246], [6060, 261], [6380, 280], [6860, 327], [7070, 369], [7300, 415], [7520, 435], [8330, 421], [9080, 451], [9860, 478], [10880, 451], [11930, 421], [12980, 408], [13503.3333, 397]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return .50*math.sin(d/580)+.25*math.sin(d/186)+(.31 if 4570<d<7840 else .07)*math.sin(d/97)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def enclosure(d):
    return min(1,max(0,(d-4510)/760),max(0,(7990-d)/510))
def rock_height(d,v):
    e=enclosure(d);half=5.3+(1-e)*23+1.7*math.cos(d/63)
    a=max(0,abs(v)-half);side=1 if v>0 else -1
    slope=(.88+.29*math.sin(d/63+side)+.14*math.sin(d/23-side))*e
    z=a*slope/(1+a/103)
    ridge=31*e*math.exp(-((a-62-18*math.sin(d/140+side))/26)**2)
    z+=ridge+min(a/45,1)*(5*math.sin(d/84+v/37)+7*math.cos(d/139-v/57))
    return elevation(d)-.20+z+(1-e)*max(0,abs(v)-9)*(.085 if v>0 else -.18)
def road(r,st,length,col,bc):
    mesh=bc.Builder('WinnatsLane','terrain');mesh.colours=[];mesh.uvs=[]
    for i in range(len(r.s)-1):
        w=2.65-.31*enclosure(r.s[i]['d'])
        p=[r.at(j,v,.051) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))]
        picture(mesh,p,[(x/6,y/6) for x,y,z in p])
    mesh.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('DerbyshireGrass','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[]
        for v in (-310,-180,-120,-86,-64,-49,-35,-23,-15,-9,-5,-3,0,3,5,9,15,23,35,49,64,86,120,180,310):
            x,y,_=r.at(i,v);row.append((x,y,rock_height(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/8,y/8) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.20
def scenery(k):
    art=Painted(k);cliffs=pictured(k,'WinnatsCrags');vista=pictured(k,'HopeValley');fans=pictured(k,'WinnatsWalkers')
    stone,light,iron,cream,grass,dark,white,slate=map(lin,(0x938F85,0xBEB7A4,0x565B5D,0xE0D6B7,0x749248,0x44423C,0xEAE3D1,0x686964))
    def panel(mesh,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(mesh,pts,((a,b),(c,b),(c,e),(a,e)))
    def crag(d,v,size,height):
        at,h=site(k,d,v);base=rock_height(d,v)-elevation(d);rings=[]
        for z,scale,offset in ((-.25,1.04,0),(.27,.90,.12),(.71,.61,-.08),(1,.35,.10)):
            ring=[]
            for i in range(7):
                a=i*math.tau/7;w=(1+.12*math.sin(i*6.2+d))*size*scale
                ring.append(at(math.cos(a)*w+offset*size,math.sin(a)*w*.59,base+z*height+.1*height*math.sin(a*1.3+d)))
            rings.append(ring)
        for j in range(3):
            for i in range(7):
                n=(i+1)%7;panel(cliffs,(rings[j][i],rings[j][n],rings[j+1][n],rings[j+1][i]),(0,0,min(2,size/5),min(2,height/7)))
        art.face(rings[-1],(stone,)*7)
    for j,d in enumerate(range(4720,7890,30)):
        for side in (-1,1):
            if (j+side)%4:
                v=side*(11+26*(.5+.5*math.sin(j*.35+side)))
                crag(d+k.rng.uniform(-8,8),v,k.rng.uniform(4.3,10),k.rng.uniform(5,15))
            if j%2==0:
                crag(d+2,side*(49+14*math.cos(j*.31)),8+4*math.sin(j+.2),14+7*math.sin(j*.73))
            for l in range(3):
                crag(d+l*2.5,side*k.rng.uniform(3.7,10.8),k.rng.uniform(.18,.7),k.rng.uniform(.27,.87))
    for d in list(range(64,620,3))+list(range(4450,4830,3))+list(range(7850,8240,3))+list(range(12400,13130,3)):
        for side in (-1,1):
            if side<0 and d>12500:continue
            v=side*(4.7+.21*math.sin(d*.031));at,h=site(k,d,v);base=rock_height(d,v)-elevation(d)
            for row in range(3):
                art.box(at((row%2)*.62,0,base+row*.29),(2.92,.92-.13*row,.34),h,lin((0x8B897E,0xA29D8E,0xAFAA98)[(d+row)%3]))
    for d in (4853,7878):
        at,h=site(k,d);art.box(at(0,0,.061),(3.7,5.54,.027),h,dark)
        for n in range(19):art.box(at(-1.72+n*.19,0,.10),(.086,5.36,.064),h,iron)
        for v in (-3.3,3.3):
            for x in (-1.9,1.9):art.box(at(x,v,-.12),(.18,.18,1.45),h,stone)
            for z in (.55,1.05):beam(art,at(-1.9,v,z),at(1.9,v,z),.064,iron)
    for j,d in enumerate(range(70,540,29)):
        at,h=site(k,d,-17-j%3*7)
        art.box(at(0,0,-.35),(12,7.4,5.4),h,light);art.roof(at(0,0,5),12.1,7.7,3.1,h,slate)
        for x in (-4,-1,2,4):art.box(at(x,3.73,2.1),(1.1,.12,1.3),h,iron)
    for j,d in enumerate((6060,6140,6290,6370,6870,7020,7100,7290,7630,9760,9890)):
        v=-3.45 if j%2 else 3.73;at,h=site(k,d,v);idx=j%4;lift=rock_height(d,v)-elevation(d)
        panel(fans,[at(0,y,z+lift) for y,z in ((1.7,0),(-1.7,0),(-1.7,2.02),(1.7,2.02))],(idx/4,0,(idx+1)/4,1))
    # A landslip scar breaks the broad summit of Mam Tor in exposed horizontal beds.
    for j,d in enumerate(range(9580,10110,22)):
        off=232+54*math.sin(j*.11);at,h=site(k,d,off)
        top=82+53*math.sin(j/24*math.pi)
        for row in range(4):
            width=26+7*math.sin(j*.7+row);z=top-row*7
            pts=[at(x,v,w) for x,v,w in ((-width*.5,0,z-4),(width*.5,1,z-6),(width*.5,4,z+1),(-width*.5,3,z+3))]
            panel(cliffs,pts)
        art.face((at(-17,3,top),at(16,3,top+1),at(17,66,top+5),at(-17,66,top+5)),(grass,)*4)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def rim(t,z):return 5800+14500*math.cos(t),9900*math.sin(t),z
        panel(vista,(rim(a,-1000),rim(b,-1000),rim(b,2130),rim(a,2130)),(u,0,v,1))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.4,'terrain':{'sea':False},'land':{'mid':0x779052},'sky':[0xCDD5D4,0xC8D6DD,0xAABDCB,0x829CB7,0x6E8FAE],'haze':0xAABABC,'light':[0xFFEDCC,1.26],'fill':[0xD3E2ED,0xA7AD99],'sun_altitude':.59,'sun_azimuth':-.68}
