"""Four 700m parade passes on Marquês de Sapucaí, with the shared Apoteose finish."""
import bisect
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture
from arenberg import beam

RUNWAY=700.
LAP=5600/3
R=(LAP-2*RUNWAY)/(2*math.pi)
PROFILE=((0,5.8),(280,6.1),(700,5.9),(790,6.4),(1000,8.6),(1390,7.6),(1650,6.2),(LAP,5.8))


def height(d):
    d%=LAP
    for (a,z),(b,w) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(w-z)*smooth(a,b,d)


def centre(d):
    q=d%LAP
    if q<RUNWAY:return q,0,0
    q-=RUNWAY
    if q<math.pi*R:
        a=q/R
        return RUNWAY+R*math.sin(a),R*(1-math.cos(a)),a
    q-=math.pi*R
    if q<RUNWAY:return RUNWAY-q,2*R,math.pi
    a=math.pi+(q-RUNWAY)/R
    return R*math.sin(a),R*(1-math.cos(a)),a


def pos(d,v=0,up=0):
    x,y,h=centre(d);return x-v*math.sin(h),y+v*math.cos(h),height(d)+up


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);z=height(d);dh=centre(d+.5)[2]-centre(d-.5)[2]
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=math.atan2(math.sin(dh),math.cos(dh)),g=100*(height(d+bc.STEP)-z)/bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1


def road(r,st,length,col,bc):
    paved=bc.Builder('SapucaiConcrete','terrain');paved.colours=[];paved.uvs=[]
    for i in range(math.ceil(LAP/2)):
        d=i*2;e=min(LAP,d+2);q=d%LAP
        wide=7.3+8*(1-smooth(700,754,q)+smooth(LAP-53,LAP,q))
        uv=[(t,v) for t,v in ((d,-wide),(e,-wide),(e,wide),(d,wide))]
        picture(paved,[pos(t,v,.1) for t,v in uv],[(v/5,t/5) for t,v in uv])
    paved.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('SapucaiGround','terrain');b.colours=[]
    def ground(x,y):
        _,i,radius=r.tree.find((x,y,0));z=r.s[i]['z']-.3
        return z+smooth(80,170,radius)*2*math.sin(x/74+y/58)
    for x in range(-200,955,12):
        for y in range(-210,399,12):
            vs=[(x+u,y+v) for u,v in ((0,0),(12,0),(12,12),(0,12))]
            b.quad(*[(u,v,ground(u,v)-.28) for u,v in vs]);b.colours.extend([lin(0x504D55)]*4)
    b.build(col);return None,ground


def tile(mesh,vertices,index,cols,rows):
    u=index%cols/cols;v=1-(index//cols+1)/rows
    picture(mesh,vertices,((u+.003,v+.003),(u+1/cols-.003,v+.003),(u+1/cols-.003,v+1/rows-.003),(u+.003,v+1/rows-.003)))


def scenery(k):
    art=Painted(k);peaks=Painted(k,'peaks')
    spectators=pictured(k,'RioArquibancadas');wings=pictured(k,'Alas');details=pictured(k,'EscolaPaint')
    lamps=pictured(k,'SapucaiLamps')
    def p(d,v,z=0):return (d,v,height(d)+z)
    def squad(d,v,z,index,width,high,angle):
        dx=width*.5*math.cos(angle);dy=width*.5*math.sin(angle)
        tile(wings,[p(d-dx,v-dy,z),p(d+dx,v+dy,z),p(d+dx,v+dy,z+high),p(d-dx,v-dy,z+high)],index,3,2)
    def glow(pts,tint):
        picture(lamps,pts,((0,0),(1,0),(1,1),(0,1)));lamps.colours[-4:]=[lin(tint)]*4
    for side in (-1,1):
        for sector,d in enumerate(range(11,666,34)):
            w=30.5
            for t in range(8):
                v=side*(16+t*1.55);z=1.0+t*.95
                art.box(p(d,v,-.15),(w,1.66,z+.15),0,lin(0x747780))
                # Four spectators' rows per 6m bay, broken by public stair aisles.
                for n in range(4):
                    start=d-w/2+n*7.55
                    vs=[p(start+x,v-side*.6,z+up) for x,up in ((0,0),(7.42,0),(7.42,1.45),(0,1.45))]
                    tile(spectators,vs,(sector+t+n+(side+1))%4,2,2)
            for n in range(16):
                art.box(p(d+w/2+1.15,side*(15.4+n*.72),-.15),(2.3,.83,.64+n*.45),0,lin(0x92939A))
            art.box(p(d,side*16.1,.4),(33.9,.24,.88),0,lin(0x878C97))
            for j in range(7):
                art.box(p(d-14+j*4.8,side*16.0,1.2),(.08,.1,.83),0,lin(0xA5A6A2))
            art.box(p(d,side*16.0,2.0),(33.8,.085,.09),0,lin(0xA7A8A1))
            if sector%3==0:
                # Elevated covered hospitality boxes with separate balconies and open bays.
                art.box(p(d,side*29,7.5),(30.2,7.1,3.3),0,lin(0x535966))
                art.box(p(d,side*27.7,10.8),(31.4,9.5,.48),0,lin(0xC0BFC0))
                for j in range(6):art.box(p(d-13+j*5.1,side*25,7.78),(.28,.3,3.0),0,lin(0xB4B5B1))
        for d in range(10,693,51):
            v=side*22;col=lin(0x9697A0)
            art.tube(p(d,v,0),.32,.18,18.8,col,col,8)
            beam(art,p(d,v,18.1),p(d,v-side*3.3,19.0),.23,col)
            for j in range(5):
                x=d-1.8+j*.9
                for z in (18.8,19.55):
                    art.box(p(x,v-side*3.35,z-.45),(.87,.58,.65),0,lin(0x535562))
                    glow([p(x+dx,v-side*3.68,z+up) for dx,up in ((-.35,-.27),(.35,-.27),(.35,.23),(-.35,.23))],0xFFF0D2)
    # The Praça da Apoteose's two slender arches merge into the deep central suspended scallop.
    arch=Painted(k,'peaks')
    for i in range(100):
        def section(t):
            y=-31+62*t
            outer=1+24.5*(max(0,math.sin(math.pi*t)))**.84
            inner=max(.30,outer-1.5-8.2*math.exp(-((t-.5)/.094)**2))
            return y,outer,inner
        a,b=section(i/100),section((i+1)/100)
        for x in (698.9,701.1):
            face=(p(x,a[0],a[2]),p(x,b[0],b[2]),p(x,b[0],b[1]),p(x,a[0],a[1]))
            arch.face(face[::-1] if x<700 else face,(lin(0xE8E7DB),)*4)
        for idx,tint in ((1,0xF2ECDB),(2,0xA6A7AD)):
            arch.face((p(698.9,a[0],a[idx]),p(701.1,a[0],a[idx]),p(701.1,b[0],b[idx]),p(698.9,b[0],b[idx])),(lin(tint),)*4)
    for side in (-1,1):
        art.box(p(700,side*30.5,-.5),(5.3,3.4,1.2),0,lin(0x9C9BA1))
    gold=lin(0xDEB45D);blue=lin(0x38778F);ruby=lin(0xA84D69)
    for j,(d,v,body,accent) in enumerate(((112,-10,blue,gold),(362,-9.8,gold,blue),(500,10,ruby,gold))):
        art.box(p(d,v,.32),(13.2,5.6,1.45),0,body)
        for n in range(3):
            z=1.72+n*1.16
            art.box(p(d+n*.33,v,z),(12.8-n*2.3,5.7-n*.9,.94),0,accent if n%2==0 else body)
            glow([p(d+x,v+3*(1 if v<0 else -1),z+.24+up) for x,up in ((-6,0),(6,0),(6,.09),(-6,.09))],0xE2B16E)
        side=1 if v<0 else -1
        for u in (-4.3,4.3):
            tile(details,[p(d+u+x,v+side*2.85,.53+z) for x,z in ((-1.35,0),(1.35,0),(1.35,1.05),(-1.35,1.05))],0,1,1)
        # An original giant macaw rises above the decks, with a curved neck, heavy bill and paired swept wings.
        at=lambda u,w,z:p(d+u,v+w,z)
        art.tube(at(0,0,4.93),1.65,1.26,2.6,accent,body,18)
        art.tube(at(-.53,0,7.41),.84,.98,1.72,body,accent,16)
        art.tube(at(-.9,0,9.00),1.0,.69,1.12,accent,accent,15)
        art.tube(at(-1.65,0,8.85),.62,.29,.84,lin(0x66544A),gold,10)
        for s in (-1,1):
            art.tube(at(-1.2,s*.70,9.44),.18,.18,.18,lin(0x393641),lin(0x393641),8)
            for n in range(7):
                u=n*.41
                feather=(at(-.3+u*.24,s*.86,7.3),at(2.3+u,s*(1.7+.15*n),9.6+.26*n),
                         at(3.3+u,s*(2.05+.17*n),10.1+.25*n),at(2.55+u,s*(1.86+.14*n),8.57+.17*n))
                art.face(feather,(body,accent,gold,body));art.face(feather[::-1],(body,accent,gold,body))
        for q in (-1,1):squad(d+q*3.8,v,2.7,0,2.2,2.55,1.1+q*.26)
    # The near ranks are individually spaced; farther outfit rows stay in the same geometry batch.
    for d in range(53,635,4):
        for s in (-1,1):
            if any(abs(d-f)<9 for f in (112,362,500)):continue
            index=4 if 410<d<510 else (0,1,5)[(d//31+(s+1))%3]
            for row in range(3):
                v=s*(6.6+row*2.55+k.rng.uniform(-.35,.35))
                squad(d+k.rng.uniform(-.6,.6),v,.12,index,3.15 if index in (1,4,5) else 2.15,2.13+k.rng.uniform(-.12,.22),k.rng.uniform(.83,1.55))
    # Rio beyond the stadium: hills cut against the night sky, with irregular clusters of house lights.
    for side in (-1,1):
        old=None
        for n in range(76):
            x=-370+n*21;y=side*(290+30*math.sin(n*.19))
            high=54+36*math.cos(n*.14)+23*math.sin(n*.30)+11*math.sin(n*.61)
            b=(x,y,0);t=(x,y,high)
            if old:peaks.face((old[0],b,t,old[1]),(lin(0x24273A),lin(0x262A40),lin(0x34374D),lin(0x39394D)))
            old=b,t
            for i in range(7):
                u=x+k.rng.uniform(-8,8);h=k.rng.uniform(12,max(13,high-4));v=y-side*1.2
                glow([(u,v,h),(u+1.3,v,h),(u+1.3,v,h+.87),(u,v,h+.87)],k.rng.choice((0xDDAD6A,0xD9C9A0,0xC48268)))
        # Urban connector outside the east stands, with repeated house fronts and occasional lit windows.
    for d in range(976,1590,18):
        for v in (-12,16):
            x,y,z=pos(d,v);h=k.rng.uniform(6,15);tone=lin(k.rng.choice((0x504957,0x64616B,0x66606E)))
            art.box((x,y,z-.6),(14,8,h),0,tone)
            for u in (-4,0,4):
                for lift in (2.2,5.5):
                    glow([(x+u,y+4.04,z+lift),(x+u+1.05,y+4.04,z+lift),(x+u+1.05,y+4.04,z+lift+1.44),(x+u,y+4.04,z+lift+1.44)],0xD6BA85)
    for i in range(1700):
        d=k.rng.uniform(0,700);v=k.rng.uniform(-15,15);w=k.rng.uniform(.014,.062)
        art.face((p(d-w,v,.126),p(d+w,v,.126),p(d+w*.6,v+w*1.8,.126)),(lin(k.rng.choice((0xC6818C,0x83A4BC,0xDBC587,0xB9A5C2))),)*3)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':15.3,
       'land':{'mid':0x52515E},'sky':[0x403A56,0x313048,0x22283D,0x181D32,0x111429],
       'light':[0xFFDFB8,1.65],'haze':0x686076,'fill':[0xDFD8E1,0x8B7184],
       'night':True,'sun_altitude':.48,'sun_azimuth':2.2,'sun_radius':72}
