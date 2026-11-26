"""The Morfa approach and Ffordd Pen Llech's measured ramp above Tremadog Bay."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))
WALL_START,WALL_END=11084,11220


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    def height(d):
        if d<10840:
            return 13+42*smooth(780,3200,d)+18*smooth(3250,4500,d)-35*smooth(4500,8800,d)+3.4*math.sin(d/280)*(1-smooth(10420,10840,d))
        if d<WALL_START:
            return 38+.08*(d-10840)+11*smooth(10940,WALL_START,d)
        top=38+.08*(WALL_START-10840)+11
        if d<=WALL_END:return top+.3745*(d-WALL_START)
        return top+.3745*(WALL_END-WALL_START)+15*smooth(WALL_END,11386,d)+8*smooth(11750,12870,d)-6*smooth(13520,14265,d)
    def heading(d):
        base=.27*math.sin(d/212)+.17*math.sin(d/561)
        return base*(1-smooth(10870,11075,d)+smooth(11300,11540,d))+2.53*smooth(11198,11222,d)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,st,length,mean,.08


def width(d):return 3.0-1.37*smooth(10530,10850,d)*(1-smooth(11300,11590,d))


def road(r,st,length,col,bc):
    b=bc.Builder('HarlechLane','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        j=i+1;l=width(p['d']);w=width(r.s[j]['d'])
        for a,e,z,c in ((-1.09,1.09,.008,0x878673),(-1,1,.038,0x676D70),(-.83,-.66,.044,0x62696C),(.65,.81,.044,0x62696C)):
            b.quad(r.at(i,l*a,z),r.at(j,w*a,z),r.at(j,w*e,z),r.at(i,l*e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Gwynedd hills','terrain');b.colours=[]
    def pt(i,v):
        d=r.s[i]['d'];x,y,z=r.at(i,v);h=r.s[i]['h'];edge=smooth(5,102,abs(v))
        # The adjoining bank drops toward the dunes after the upper switchback.
        drop=(v<0 and d>11210) or (v>0 and d<11198)
        z+=(max(3,z-5)*-.79 if drop else 26+14*math.sin(d/241))*edge
        z+=5.1*math.sin(d/109+v/55)*edge
        return x,y,z-.14
    for i in range(0,len(r.s)-2,2):
        for l,e,c in ((-190,-65,0x859263),(-65,-22,0x879465),(-22,-6,0x76895F),(-6,6,0x86906E),(6,22,0x78845E),(22,65,0x8F9B70),(65,190,0x8C9A73)):
            pts=(pt(i,l),pt(i+2,l),pt(i+2,e),pt(i,e));b.quad(*pts);b.colours.extend([lin(c)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return pt(i,v)[2]
    return None,sample


def scenery(k):
    art=Painted(k);cottages=pictured(k,'GwyneddCottages');walls=pictured(k,'WelshStone');fans=pictured(k,'HarlechLocals');signs=pictured(k,'GwyneddSigns');vista=pictured(k,'TremadogBay')
    slate=lin(0x666A71);stone=lin(0x9C9B90);moss=lin(0x768061);wood=lin(0x736657)
    def wall(d,e,v,h):
        a,_=site(k,d,v);b,_=site(k,e,v);w=.26
        for side in (-1,1):
            pts=(a(0,side*w,-.08),b(0,side*w,-.08),b(0,side*w,h),a(0,side*w,h))
            picture(walls,pts,((0,0),((e-d)/2.2,0),((e-d)/2.2,h/1.15),(0,h/1.15)))
        art.face((a(0,-w,h),b(0,-w,h),b(0,w,h),a(0,w,h)),(moss,)*4)
    for d in range(-56,14410,8):
        if 11194<d<11224:continue
        for side in (-1,1):
            if (2750<d<4150 or 10330<d<11670 or 13290<d<14040 or (d//96+side)%4==0):
                wall(d,d+8,side*(width(d)+.32),.86+(.24 if side>0 else 0))
    def cottage(d,v,j):
        at,h=site(k,d,v);side=1 if v>0 else -1
        length=7.1+j*.79;high=4.0+(j%3)*.44
        z=-.15;art.box(at(0,side*2.65,z),(length,5.15,high),h,stone)
        art.roof(at(0,side*2.65,z+high),length+.53,5.63,2.20,h,slate)
        art.box(at(length*.32,side*2.74,high+.98),(.67,.75,2.36),h,lin(0x827E72))
        u=j/4
        picture(cottages,(at(-length/2,0,z),at(length/2,0,z),at(length/2,0,z+high),at(-length/2,0,z+high)),((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
    for d in range(-42,14385,11):
        for side in (-1,1):
            village=2980<d<3910 or 10780<d<11336 or 13190<d<13880
            if 11190<d<11235 or (not village and (d+side)%143):continue
            if village and side<0 and d%5==0:continue
            cottage(d,side*(width(d)+(1.3 if village else 5.4)),k.rng.randrange(4))
    for j,d in enumerate((98,3480,10889,11091,11127,11232,13740)):
        at,h=site(k,d,-(width(d)+.62))
        art.box(at(0,0,.03),(.12,.12,2.45),h,wood);u=j%3/3
        pts=(at(-.08,.65,1.47),at(-.08,-.65,1.47),at(-.08,-.65,2.56),at(-.08,.65,2.56))
        picture(signs,pts,((u+.001,0),(u+1/3-.001,0),(u+1/3-.001,1),(u+.001,1)))
    for j in range(19):
        d=11083+j*6.76;side=1 if j%3 else -1;at,h=site(k,d,side*(width(d)+.80));z=.8 if j%3==0 else .01;u=(j%3)/3
        picture(fans,(at(-.51,0,z),at(.51,0,z),at(.51,0,z+1.72),at(-.51,0,z+1.72)),((u+.001,0),(u+.332,0),(u+.332,1),(u+.001,1)))
    # Castle on its rock, standing above the dunes. Twin gate towers flank an actual gateway.
    at,h=site(k,13776,77)
    for i in range(30):
        a=i*math.tau/30;b=(i+1)*math.tau/30
        def rock(t,r,z):return at(r*32*math.cos(t),r*25*math.sin(t),z)
        pts=(rock(a,1.49,-35),rock(b,1.49,-35),rock(b,1,0),rock(a,1,0));art.face(pts,(lin(0x6B7564),lin(0x74786B),lin(0x989387),lin(0x89897C)))
        art.face((rock(a,1,0),rock(b,1,0),at(0,0,0)),(lin(0x8A9273),)*3)
    def tower(x,y,r,high):
        for j in range(20):
            a=j*math.tau/20;b=(j+1)*math.tau/20
            def point(t,z,rad=r):return at(x+rad*math.cos(t),y+rad*math.sin(t),z)
            pts=(point(a,-.2,r*1.12),point(b,-.2,r*1.12),point(b,high),point(a,high))
            picture(walls,pts,((j*.42,0),((j+1)*.42,0),((j+1)*.42,high/1.5),(j*.42,high/1.5)))
            if j%2==0:art.box(point(a,high),(.96,.89,1.04),h+a,stone)
    for x in (-17,17):
        for y in (-11,11):tower(x,y,4.13,14.4 if x>0 else 15.5)
    for y in (-4.62,4.62):tower(-19,y,3.31,18.0)
    for side in (-1,1):
        for j in range(17):
            x=-17+2*j;pts=(at(x,side*11,0),at(x+2,side*11,0),at(x+2,side*11,10.9),at(x,side*11,10.9));picture(walls,pts,((0,0),(1,0),(1,6.3),(0,6.3)))
            art.box(at(x+.46,side*11,10.9),(.97,1.1,1.08),h,stone)
    art.box(at(-19,0,7.44),(4.5,7.95,6.84),h,stone)
    for d,v,span,relief in ((360,624,1400,192),(13750,-540,1570,236)):
        at,h=site(k,d,v);base=2-k.road.pos(d)[2]
        def pt(u,q):return at((u-.5)*span,50*math.cos(u*math.tau)+41*q,base+relief*q)
        for j in range(32):
            a=j/32;b=(j+1)/32
            picture(vista,(pt(a,0),pt(b,0),pt(b,1),pt(a,1)),((a,0),(b,0),(b,1),(a,1)))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':1.63,'land':{'mid':0x87926B},'sky':[0xD9DADA,0xC7D2D6,0xA8B6C1,0x8899AA,0x778A9D],'haze':0xB8C1C8,'light':[0xF1EBDA,1.75],'fill':[0xCED6DE,0x9AA18B],'sun_radius':7,'sun_altitude':.42,'sun_azimuth':.75}
