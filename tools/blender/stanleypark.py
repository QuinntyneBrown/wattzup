"""Stanley Park’s graded seawall, coastal cliffs and Lions Gate suspension bridge."""
import math
from worldkit import Painted,lin
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 12], [800.0, 3.6387], [1200.0, 4.2581], [1600.0, 0.0774], [2450.0, 6.4935], [2850.0, 2.3129], [3275.0, 5.521], [4125.0, 17.0371], [4325.0, 14.9468], [4575.0, 21.3339], [5375.0, 12.9726], [5800.0, 16.1806], [6200.0, 12.0]]

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def heading(d):return .41*math.sin(d/305)+.24*math.cos(d/164)+.09*math.sin(d/90)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    path=bc.Builder('SeawallPath','terrain');path.uvs=[];path.colours=[]
    bands=bc.Builder('SeawallMarkings','terrain');bands.colours=[]
    for i,p in enumerate(r.s[:-1]):
        picture(path,[r.at(i,-2.5),r.at(i+1,-2.5),r.at(i+1,2.5),r.at(i,2.5)],((0,0),(0,1),(1,1),(1,0)))
        for a,b,z,c in ((-.046,.046,.022,0xE3DBBB),(-4.15,-2.5,.035,0x9A9183),(-4.47,-4.15,.29,0xA8A69C)):
            bands.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z));bands.colours.extend((lin(c),)*4)
    path.build(col);bands.build(col)

def land(r,col,theme,bc):
    land=bc.Builder('StanleyLand','terrain');land.colours=[];last=None
    water=bc.Builder('BurrardWater','terrain');water.colours=[];water.uvs=[]
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];h=height(d)
        cliff=4+10*(.5+.5*math.sin(d/175)) + (9 if 4090<d<4770 else 0)
        line=[]
        for v,z,c in ((-105,-1.9,0x4B6868),(-22,-1.8,0x5B6C62),(-12,-1.05,0x555F55),(-6.4,-.6,0x6B6958),(-4.46,h-.33,0x86877D),(2.8,h-.18,0x77795D),(6.2,h+.35,0x72805B),(9.7,h+cliff*.63,0x646C67),(14,h+cliff,0x798273),(33,h+cliff+2,0x495D48),(220,h+cliff+6,0x465B48)):
            if 990<d<1190 and v>2:z=h+.15+max(0,v-28)*.08;c=0x7C9657
            x,y,_=r.at(i,v);line.append(((x,y,z),lin(c)))
        if last:
            for a,b,c,e in zip(last,last[1:],line[1:],line):
                land.quad(a[0],e[0],c[0],b[0]);land.colours.extend((a[1],e[1],c[1],b[1]))
        last=line
    for a in range(-3000,12500,120):
        picture(water,((a,-9000,-1),(a+120,-9000,-1),(a+120,1600,-1),(a,1600,-1)),((0,0),(1,0),(1,1),(0,1)))
    water.build(col)
    return land.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.2

def scenery(k):
    art=Painted(k);cedars=pictured(k,'ParkCedars');poles=pictured(k,'BrocktonPoles');mountains=pictured(k,'NorthShoreRidges');paint=pictured(k,'SeawallPaint')
    green,steel,stone,white,red,bark,black=map(lin,(0x397C6E,0x628F81,0xACA99B,0xEEEAE1,0xA43330,0x7B6050,0x383E3F))
    def tile(m,points,n,cols):
        u=n/cols;picture(m,points,((u+.002,.002),(u+1/cols-.002,.002),(u+1/cols-.002,.998),(u+.002,.998)))
    def tree(at,t,w,ht,z):
        for a in (.61,2.17):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
            tile(cedars,[at(-dx,-dy,z),at(dx,dy,z),at(dx,dy,z+ht),at(-dx,-dy,z+ht)],t,3)
    bluff=pictured(k,'StanleyCliffs')
    for start,end in ((-12,890),(1860,2044),(2625,3190),(4100,4790),(5630,5945)):
        last=None
        for j,d in enumerate(range(start,end,6)):
            at,h=site(k,d,0);ht=6.5+4.2*math.sin(d/48)+2.1*math.sin(d/23)
            v=5.1+.49*math.sin(d/9);line=(at(0,v,-.14),at(0,v+.59,ht*.43),at(0,v+2.5,ht))
            if last:
                for n in (0,1):
                    a,b,c,e=last[n],line[n],line[n+1],last[n+1]
                    picture(bluff,(a,b,c,e),((j*.79,a[2]*.19),((j+1)*.79,b[2]*.19),((j+1)*.79,c[2]*.19),(j*.79,e[2]*.19)))
            last=line
    # Coping and coursed granite follow the local tide-wall height.
    for i,d in enumerate(range(-15,6220,4)):
        at,h=site(k,d,-4.35);floor=height(d)
        art.box(at(0,0,-floor-1),(3.96,.55,floor+1.16),h,(lin(0x797B72),lin(0x878779),lin(0x71746B))[i%3])
        art.box(at(0,0,.08),(3.97,.76,.24),h,stone)
        for row in range(3):
            for j in range(3):
                art.box(at(-1.35+j*1.32+(row%2)*.23,-.30,-(row+1)*.46),(1.27,.08,.41),h,(stone,lin(0x98968A),lin(0x7F837D))[(j+row+i)%3])
    for i,d in enumerate(range(0,6220,11)):
        if not 992<d<1190:
            at,h=site(k,d,9.5+2.4*math.sin(i*.75));tree(at,i%3,6.4+(i%4)*.5,15.6+i%7,2.1)
        at,h=site(k,d+4,22+i%13);tree(at,(i+2)%3,9+i%4,23+i%8,5)
    # The high-water shelf exposes basalt boulders, with dark slick kelp on their seaward sides.
    def rock(at,r,z,ht,seed):
        faces=9;last=None
        for step,rad in ((0,r*.65),(.19,r),(.55,r*.94),(.82,r*.75),(1,r*.48)):
            ring=[at(rad*math.cos(j*math.tau/faces)*(1+.14*math.sin(j+seed)),rad*math.sin(j*math.tau/faces),z+ht*step+.06*math.sin(j*2+seed)) for j in range(faces)]
            if last:
                for j in range(faces):
                    c=lin((0x616258,0x77776B,0x656A64,0x535C58)[(j+seed)%4]);b=(c[0]*.68,c[1]*.72,c[2]*.69,1)
                    art.face((last[j],last[(j+1)%faces],ring[(j+1)%faces],ring[j]),(b,b,c,c))
            last=ring
        art.face(ring,(lin(0x758060),)*faces)
    for i,d in enumerate(range(-4,6230,13)):
        at,h=site(k,d,-(7+i%16));rock(at,.72+(i%5)*.33,-height(d)-1.18,1.46+(i%4)*.52,i)
    at,h=site(k,4504,-19);stack=pictured(k,'SiwashBasalt');last=None
    base=-height(4504)-1.2
    for layer,(z,rad) in enumerate(((base,5.9),(base+2,7.4),(-7,7.0),(-3.8,6.2),(-2.3,6.9),(.8,5.8),(3.4,5.1),(4.6,5.35),(6.2,4.35),(7.3,4.12),(8.7,2.86),(9.1,2.4))):
        ring=[]
        for q in range(18):
            ang=math.tau*q/18;r=rad*(1+.16*math.sin(3*ang+.2*layer)+.08*math.cos(5*ang))
            ring.append(at(-.15*layer+r*math.cos(ang),.09*layer+.89*r*math.sin(ang),z+.45*math.sin(ang*2+.4*layer)))
        if last:
            for q in range(18):
                pair=(last[q],last[(q+1)%18],ring[(q+1)%18],ring[q])
                picture(stack,pair,((q*.21,last[q][2]/5),((q+1)*.21,last[(q+1)%18][2]/5),((q+1)*.21,ring[(q+1)%18][2]/5),(q*.21,ring[q][2]/5)))
        last=ring
    art.face(ring,(lin(0x647553),)*len(ring));tree(at,1,5.4,5.3,9.0)
    # Broad display clearing, varied pole silhouettes and a split-rail visitor boundary.
    for j,(d,v,t,ht) in enumerate(((1097,11,0,6.8),(1104,14,1,8.6),(1111,9,2,6.3),(1121,15,0,7.8),(1129,11,1,6.9))):
        at,h=site(k,d,v);w=ht*.43;art.tube(at(0,0,.08),.27,.2,ht*.83,bark,bark,10)
        tile(poles,[at(-w*.37,w*.34,.1),at(w*.37,-w*.34,.1),at(w*.37,-w*.34,ht),at(-w*.37,w*.34,ht)],t,3)
        art.box(at(0,-3.7,.81),(6,.13,.12),h,bark);art.box(at(-2.87,-3.7,0),(.15,.15,1.18),h,bark)
    # Brockton Point lighthouse: square lantern gallery and the distinctive broad red stripe.
    at,h=site(k,2068,-7.4)
    for z,ht,r0,r1,c in ((0,1.1,2.8,2.8,white),(1.1,3.7,2.42,2.02,white),(4.8,2,2.02,1.82,red),(6.8,1.35,1.82,1.66,white)):
        art.tube(at(0,0,z),r0,r1,ht,c,c,8,cap=c)
    art.box(at(0,0,8.14),(4.05,4.05,.24),h,white)
    art.tube(at(0,0,8.38),1.18,1.18,1.8,black,steel,10);art.tube(at(0,0,10.18),1.57,.1,.91,red,red,10)
    for x in (-1.84,1.84):
        for y in (-1.84,1.84):art.box(at(x,y,8.36),(.08,.08,.96),h,white)
        beam(art,at(x,-1.84,9.26),at(x,1.84,9.26),.065,white)
    # Suspension cables meet the towers 53 m above the road deck; suspenders end at the deck girders.
    at,h=site(k,6013,0);deck=23
    for x in (-4.6,4.6):
        for v in (-225,-18):
            art.box(at(x,v,-4),(1.5,2.05,deck+57),h,green)
        art.box(at(x,-112,deck-1.3),(.74,314,1.82),h,green)
        for v in range(-255,52,6):
            beam(art,at(x,v,deck-.88),at(x,v+6,deck+1.08),.19,steel)
        last=None
        for v in range(-298,61,3):
            if v < -225:z=deck+52-max(0,-225-v)*.58
            elif v > -18:z=deck+52-max(0,v+18)*.58
            else:z=deck+7+45*((v+121.5)/103.5)**2
            point=at(x,v,z)
            if last:beam(art,last,point,.225,green)
            if v%9==2 and z>deck+1:beam(art,at(x,v,deck+.52),point,.071,steel)
            last=point
    art.box(at(0,-113,deck),(9.6,321,.47),h,black)
    for v in (-225,-18):
        for z in range(deck+5,deck+51,9):
            beam(art,at(-4.5,v,z),at(4.5,v,z+8.4),.38,green)
            beam(art,at(4.5,v,z),at(-4.5,v,z+8.4),.38,green)
        art.box(at(0,v,deck+51),(10.5,2.22,1.35),h,green)
    # Fixed mountain panorama across the inlet. Divide it at UV boundaries before chunking.
    for j in range(72):
        a=math.tau*j/72;b=math.tau*(j+1)/72;u=(j%12)/12;v=u+1/12
        if j//12%2:u,v=1-u,1-v
        def rim(angle,z):return 3050+4480*math.cos(angle),4450*math.sin(angle),z
        picture(mountains,(rim(a,-75),rim(b,-75),rim(b,897),rim(a,897)),((u,0),(v,0),(v,1),(u,1)))
    for i,d in enumerate(range(42,6190,85)):
        pts=[k.road.pos(d+a,v,.045) for a,v in ((0,1.02),(0,-1.02),(3.35,-1.02),(3.35,1.02))]
        tile(paint,pts,i%2,2)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.5,'terrain':{'sea':False},'land':{'mid':0x7C866C},
       'sky':[0xC4D3D5,0xB8D2DF,0xA9CCDF,0x92BBD4,0x77AACE],'haze':0xB5C9D0,'light':[0xFFEAD1,1.16],'fill':[0xC1D8E2,0xA5B1A2],
       'sun_altitude':.59,'sun_azimuth':-.84}
