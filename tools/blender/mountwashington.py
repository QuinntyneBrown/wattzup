"""The Mount Washington Auto Road, Great Gulf, rack railway and summit."""
import math
from bondi import beam
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin, smooth

UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    grades={'work':.126,'recover':.089,'warm-up':.067,'cool-down':.080,'steady':.11}
    def altitude(d):
        d=max(0,min(d,length));total=sum(max(0,min(d,s['to'])-s['from'])*grades[s['kind']] for s in stages)
        wall=max(0,min(d,12430)-12100)*.117;return 478+total+wall+2.7*math.sin(d/193)
    def heading(d):return -math.radians(45)*math.sin(d/60)*math.cos(d/162+1)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=altitude(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(altitude(d+bc.STEP)-z)/bc.STEP))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return rows,stages,length,mean,.105


def road(r,st,length,col,bc):
    b=bc.Builder('AutoPavement','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        c=0x6D6862 if 3470<p['d']<3890 else 0x565858
        for l,h,z,c in ((-5.5,5.5,.006,0x998E7D),(-3.82,3.82,.025,c),(-.085,.085,.036,0xD8B565)):
            b.quad(r.at(i,l,z),r.at(i+1,l,z),r.at(i+1,h,z),r.at(i,h,z));b.colours.extend([lin(c)]*4)
        if i%13==0:
            for l,h in ((-3.82,-2.18),(2.45,3.82)):
                b.quad(r.at(i,l,.031),r.at(i+1,l+.31,.031),r.at(i+1,h,.031),r.at(i,h,.031));b.colours.extend([lin(0x736F68)]*4)
    b.build(col)


def land(r,col,theme,bc):
    ground=bc.Builder('Auto slopes','terrain');ground.colours=[];talus=bc.Builder('AlpineTalus','terrain');talus.colours=[]
    offsets=(-520,-210,-115,-62,-29,-13,-5.4,0,5.4,13,29,62,115,210,520)
    def point(i,u):
        p=r.s[i];x,y,z=r.at(i,u);blend=smooth(12,72,abs(u))
        x+=(p['x']-x)*blend;y+=(p['y']+u-y)*blend
        fall=max(0,abs(u)-4.7);z+=fall*(.20 if u<0 else -.60)
        z+=smooth(6,42,abs(u))*(2.6*math.sin(p['d']/103+u*.13)+2.1*math.sin(u*.061));return x,y,z-.17
    for i in range(0,len(r.s)-3,3):
        p=r.s[i];b=talus if p['d']>5540 else ground
        for l,h in zip(offsets,offsets[1:]):
            b.quad(point(i,l),point(i+3,l),point(i+3,h),point(i,h));v=math.sin(p['d']*.018+l*.28)*3
            c=(153,150,130) if b==talus else (103,117,82)
            b.colours.extend([lin(sum(int(max(0,min(255,n+v)))<<shift for n,shift in zip(c,(16,8,0))))]*4)
    ground.build(col);talus.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.18
    return None,sample


def scenery(k):
    art=Painted(k);woods=pictured(k,'AutoForest');gulf=pictured(k,'PresidentialRange');signs=pictured(k,'AutoSigns');walls=pictured(k,'SummitWalls')
    stone=lin(0x929088);lichen=lin(0xA7A58B);brown=lin(0x775842);silver=lin(0xADB1B4);dark=lin(0x4F5356)
    for d in range(-62,6380,10):
        for side in (-1,1):
            for row in range(2):
                off=side*k.rng.uniform(6.6+row*11,14.2+row*24);a,h=site(k,d+k.rng.uniform(-4,4),off)
                which=(0 if k.rng.random()>.24 else 1) if d<2550 else (1 if d<4360 else 2)
                r=k.rng.uniform(3,5.8) if which!=2 else k.rng.uniform(1.3,3.1)
                high=k.rng.uniform(7,14) if which!=2 else k.rng.uniform(1.1,3.3)
                foot=max(0,abs(off)-4.7)*(.18 if off<0 else -.55)
                for angle in (.28,1.85):
                    dx=r*math.cos(angle);dy=r*math.sin(angle);u=which/3
                    picture(woods,(a(-dx,-dy,foot-.36),a(dx,dy,foot-.36),a(dx,dy,foot+high),a(-dx,-dy,foot+high)),((u+.002,0),(u+1/3-.002,0),(u+1/3-.002,1),(u+.002,1)))
    for d in range(4400,12820,9):
        for side in (-1,1):
            off=side*k.rng.uniform(5,20);a,h=site(k,d,off);r=k.rng.uniform(.25,1.45);foot=max(0,abs(off)-4.7)*(.18 if off<0 else -.58)
            art.tube(a(0,0,foot-.18),r,r*.57,r*k.rng.uniform(.64,1.2),stone,lichen,6,lichen)
    for d,n in ((106,0),(1724,1),(3662,1),(6480,1),(10360,2),(12346,3)):
        a,h=site(k,d,-5.06);art.box(a(0,0,0),(.18,.18,2.2),h,brown)
        u=n%2*.5;v=(1-n//2)*.5
        picture(signs,(a(0,1.11,1.15),a(0,-1.11,1.15),a(0,-1.11,2.38),a(0,1.11,2.38)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    # A straight trestle is a separate alignment on the mountainside. The moving stock uses the same endpoints.
    a,h=site(k,8540,19);pitch=.14
    for u in range(-56,59,3):
        z=-2.2+u*pitch
        for v in (-.72,.72):
            art.box(a(u,v,z-.98),(.28,.25,1.02),h,brown)
            beam(art,a(u,v,z),a(u+3,v,z+3*pitch),.105,.11,silver)
        art.box(a(u,0,z-.12),(.36,2,.13),h,brown);beam(art,a(u,0,z+.02),a(u+3,0,z+3*pitch+.02),.13,.13,dark)
        beam(art,a(u,-.72,z-1),a(u+3,-.72,z+3*pitch),.14,.14,brown)
    for d in (6400,10295):
        a,h=site(k,d+74,130)
        picture(gulf,(a(-160,72,-55),a(160,-72,-55),a(160,-72,30),a(-160,72,30)),UV)
    a,h=site(k,12365,-18)
    art.box(a(0,0,0),(26,12,5.4),h,stone);art.roof(a(0,0,5.38),27,13,1.18,h,dark)
    picture(walls,(a(-13,6.13,.05),a(13,6.13,.05),a(13,6.13,5.36),a(-13,6.13,5.36)),UV)
    art.tube(a(-9,4.2,3.4),2.33,2.33,7.3,stone,stone,18,stone);art.tube(a(-9,4.2,10.65),2.5,2.5,1.26,dark,dark,18,silver)
    for j in range(7):
        x=-9+1.75*math.cos(j*.90);y=4.2+1.75*math.sin(j*.90)
        art.tube(a(x,y,11.8),.075,.044,1.05+(j%3)*.5,silver,silver,6,silver)
    a,h=site(k,12400,-9);art.box(a(0,0,0),(12,6,2.45),h,stone);art.roof(a(0,0,2.45),12.6,6.7,2.1,h,dark)
    for u in (-4,-1,2,4):art.box(a(u,3.05,.75),(.71,.08,.86),h,dark)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.82,'land':{'mid':0x8C927B},'sky':[0xDFDECF,0xC7D5DA,0xABC5D2,0x87ADC8,0x6998BB],'haze':0xC4CED0,'light':[0xFFF0CF,1.83],'fill':[0xD2E1EA,0x9B9384],'sun_radius':10,'sun_altitude':.53,'sun_azimuth':.64}
