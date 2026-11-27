"""Cactus Forest Drive, a closed sunrise ride through the Sonoran bajada."""
import bisect
import math
from worldkit import Painted, lin, smooth
from iten_landmarks import pictured, picture, site
from arenberg import beam

LAP=10747.916666666666
PROFILE=((0, 902), (520, 913), (1210, 934), (1650, 919), (2010, 925), (2300, 903), (2680, 890), (2940, 909), (3330, 929), (3650, 917), (4050, 945), (4510, 932), (4810, 951), (5250, 929), (5740, 948), (6200, 924), (6730, 936), (7000, 925), (7320, 917), (7900, 927), (8450, 946), (8910, 931), (9320, 950), (9740, 936), (10200, 913))+((LAP,902),)
STREETS=((0,0),(215,3),(460,-22),(700,35),(878,-3),(1050,77),(1320,106),(1510,45),
        (1730,97),(1810,260),(2000,390),(2070,610),(2000,815),(2080,1010),(1910,1230),
        (1700,1290),(1470,1420),(1270,1360),(1070,1510),(820,1510),(570,1380),(340,1390),
        (100,1230),(-180,1180),(-295,1000),(-510,870),(-570,660),(-465,440),(-505,230),
        (-365,125),(-180,80))
def spline(i,t):
    a,b,c,d=[STREETS[(i+j)%len(STREETS)] for j in (-1,0,1,2)]
    return tuple(.5*(2*b[n]+(-a[n]+c[n])*t+(2*a[n]-5*b[n]+4*c[n]-d[n])*t*t+
                       (-a[n]+3*b[n]-3*c[n]+d[n])*t**3) for n in (0,1))


RAW=[spline(i,j/40) for i in range(len(STREETS)) for j in range(40)]+[STREETS[0]]
CHAIN=[0.]
for a,b in zip(RAW,RAW[1:]):CHAIN.append(CHAIN[-1]+math.dist(a,b))
SCALE=LAP/CHAIN[-1]


def height(d):
    d%=LAP
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)


def centre(d):
    s=(d%LAP)/SCALE;i=min(len(RAW)-2,bisect.bisect_right(CHAIN,s)-1)
    a,b=RAW[i:i+2];f=(s-CHAIN[i])/(CHAIN[i+1]-CHAIN[i])
    return tuple((a[n]+(b[n]-a[n])*f)*SCALE for n in (0,1))


def heading(d):
    a,b=centre(d-.5),centre(d+.5)
    return math.atan2(b[1]-a[1],b[0]-a[0])


def pos(d,v=0,up=0):
    x,y=centre(d);h=heading(d)
    return x-v*math.sin(h),y+v*math.cos(h),height(d)+up


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pos(d);h=heading(d);diff=heading(d+.5)-heading(d-.5)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=math.atan2(math.sin(diff),math.cos(diff)),g=100*(height(d+bc.STEP)-z)/bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,.04


def road(r,st,length,col,bc):
    lane=bc.Builder('ForestDrivePavement','terrain');lane.colours=[];lane.uvs=[]
    gravel=bc.Builder('SonoranShoulder','terrain');gravel.colours=[]
    for i in range(math.ceil(LAP/3)):
        d=i*3;e=min(LAP,d+3)
        width=2.72+.16*math.sin(d/53)
        for a,b,z in ((-width,width,.10),(-width-.85,-width,.048),(width,width+.85,.048)):
            slice=((d,a),(e,a),(e,b),(d,b));points=[pos(t,v,z) for t,v in slice]
            if a==-width:picture(lane,points,[(v/4,t/4) for t,v in slice])
            else:
                gravel.quad(*points);gravel.colours.extend([lin(0xA18568)]*4)
    lane.build(col);gravel.build(col)


def land(r,col,theme,bc):
    sand=bc.Builder('SonoranBajada','terrain');sand.colours=[];sand.uvs=[]
    def ground(x,y):
        _,i,dist=r.tree.find((x,y,0));d=r.s[i]['d']%LAP
        z=height(d)-.28
        relief=math.sin(x/143-y/102)*7+math.cos(y/86+x/194)*5
        wash=math.exp(-((d-2692)/15)**2)*(1-smooth(70,130,dist))
        return z+smooth(7,115,dist)*relief-2.55*wash
    xs=[s['x'] for s in r.s];ys=[s['y'] for s in r.s]
    for x in range(int(min(xs))-300,int(max(xs))+320,28):
        for y in range(int(min(ys))-300,int(max(ys))+320,28):
            xy=[(x+u,y+v) for u,v in ((0,0),(28,0),(28,28),(0,28))]
            sand.quad(*[(u,v,ground(u,v)-1.25) for u,v in xy])
            sand.uvs.extend((u/4.7,v/4.7) for u,v in xy)
            for u,v in xy:
                n=math.sin(u/74+v/63)+math.cos(u/34-v/44)
                sand.colours.append(lin(0xB1906A if n>.55 else 0xA68B62 if n<-.35 else 0xB89A74))
    for i in range(math.ceil(LAP/5)):
        d=i*5;e=min(LAP,d+5)
        for a,b in ((-24,-13),(-13,-5),(-5,5),(5,13),(13,24)):
            xy=[pos(t,v) for t,v in ((d,a),(e,a),(e,b),(d,b))]
            sand.quad(*[(x,y,ground(x,y)-.025) for x,y,z in xy])
            sand.uvs.extend((x/4.7,y/4.7) for x,y,_ in xy)
            c=0xC4AA7D if 2662<d<2720 else 0xAC8B68 if abs(a)<6 else 0xAE9169
            sand.colours.extend([lin(c)]*4)
    sand.build(col);return None,ground


def tile(mesh,pts,index,cols,rows):
    u=index%cols/cols;v=1-(index//cols+1)/rows
    picture(mesh,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))


def scenery(k):
    art=Painted(k);rock=pictured(k,'RinconMountains');leaves=pictured(k,'BajadaFlora');boards=pictured(k,'ParkBoards')
    xs=[s['x'] for s in k.s];ys=[s['y'] for s in k.s]
    cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
    # Two continuous ranges. Angular folds rise and fall along the horizon behind the fixed loop.
    for layer in (0,1):
        previous=None
        for n in range(257):
            a=math.tau*n/256
            distance=3100+layer*790+124*math.sin(5*a)+95*math.cos(8*a)
            peak=143+118*math.sin(3*a+.6)**2+65*abs(math.sin(6*a))**3+27*abs(math.sin(17*a+.25))
            ridge=[]
            for j,(rad,high) in enumerate(((-.47,-1.55),(-.15,-.20),(.24,.24),(.54,.62),(.83,1))):
                f=distance+rad*780
                ridge.append((cx+f*math.cos(a),cy+f*math.sin(a),866+high*(peak+layer*156)))
            if previous:
                for j in range(4):
                    c=lin((0xC1A58E,0xAB9993,0x938F98,0x828697)[j] if not layer else (0xC3ABA0,0xAFA1A1,0xA3A0AC,0x989CAB)[j])
                    sh=.88+.12*(1+math.sin(a*17+j*.64))*.5;t=tuple(v*sh for v in c[:3])+(1,)
                    picture(rock,(previous[j],ridge[j],ridge[j+1],previous[j+1]),((0,0),(1,0),(1,1),(0,1)))
                    rock.colours[-4:]=[t,c,c,t]
            previous=ridge
    def saguaro(d,v,h,r,arms,close):
        at,yaw=site(k,d,v);x,y,z=at(0,0);z=k.height_at(x,y)-.11;spin=k.rng.uniform(0,math.tau)
        def trunk(u,w,l,rad0,rad1,high,detail):
            count=20 if detail else 8
            base=[];top=[]
            for j in range(count):
                a=spin+math.tau*j/count;rib=1 if j%2==0 else .89
                base.append((x+u+rad0*rib*math.cos(a),y+w+rad0*rib*math.sin(a),z+l))
                top.append((x+u+rad1*rib*math.cos(a),y+w+rad1*rib*math.sin(a),z+l+high))
            for j in range(count):
                c=lin((0x63734C,0x617044,0x71814F,0x7D8957)[j%4] if detail else 0x687753)
                shade=.69+.31*(1+math.cos(spin+j*math.tau/count+.35))/2
                tint=tuple(s*shade for s in c[:3])+(1,)
                art.face((base[j],base[(j+1)%count],top[(j+1)%count],top[j]),(tint,tint,c,c))
        trunk(0,0,0,r*.78,r,h*.35,close);trunk(0,0,h*.35,r,r*.88,h*.61,close)
        trunk(0,0,h*.96,r*.88,r*.10,h*.04,close)
        for j in range(arms):
            a=spin+j*2.21;out=r*k.rng.uniform(2.2,3.45);ux=out*math.cos(a);vy=out*math.sin(a)
            lift=h*k.rng.uniform(.30,.64);rise=h*k.rng.uniform(.16,.38);arm=r*k.rng.uniform(.49,.73)
            # A low elbow leads into the upright ribbed arm.
            beam(art,(x,y,z+lift),(x+ux*.72,y+vy*.72,z+lift+.14),arm*1.55,lin(0x66774C))
            beam(art,(x+ux*.72,y+vy*.72,z+lift+.14),(x+ux,y+vy,z+lift+.55),arm*1.65,lin(0x68794D))
            trunk(ux,vy,lift+.44,arm,arm*.80,rise,close)
            trunk(ux,vy,lift+.44+rise,arm*.80,arm*.1,arm*.69,close)
        if close:
            # Sunlight from east-southeast lays long tapered shadows across the surrounding gravel.
            length=h*1.83;end=(x-length*.78,y+length*.62)
            def shadow(u,v):return (u,v,k.height_at(u,v)+.006)
            pts=[shadow(x-r*.4,y-r*.55),shadow(*end),shadow(end[0]+r*.37,end[1]+r*.51),shadow(x+r*.4,y+r*.55)]
            art.face(pts,(lin(0x847955),)*4)
    for d in range(7,int(LAP),19):
        for side in (-1,1):
            v=side*k.rng.uniform(7.1,62)
            if (55<d<145 or 2650<d<2725 or 7270<d<7390 or 9690<d<9790) and abs(v)<25:continue
            high=k.rng.uniform(4.2,10.6);saguaro(d,v,high,high*k.rng.uniform(.034,.055),k.rng.randrange(1,5),abs(v)<16)
        if d%3==1:
            saguaro(d,k.rng.choice((-1,1))*k.rng.uniform(72,147),k.rng.uniform(5,11),.38,k.rng.randrange(1,4),False)
    # The close groves show the scale and irregular branching of the mature cactus forest.
    for mark in (80,1210,2680,4810,7320,9740):
        for j in range(24):
            d=mark+9+j*4.7;side=1 if j%3 else -1
            if mark in (80,1210,7320) and side<0 and j<7:continue
            offset=side*(6.1+(j*7%23));high=6.8+(j*17%61)*.097
            saguaro(d,offset,high,.36+.09*(j%3),2+j%4,abs(offset)<15)
    for d in range(0,int(LAP),3):
        v=k.rng.choice((-1,1))*k.rng.uniform(3.5,11);x,y,_=pos(d,v)
        z=k.height_at(x,y);w=k.rng.uniform(.075,.34)
        art.tube((x,y,z-.04),w,w*.55,w*.57,lin(0x997968),lin(0xB4957C),5,lin(0xBA9E86))
    # The hawk's own perch occupies the same fixed station as the moving bird.
    saguaro(1224,-6.1,8.55,.41,3,True)
    for d in range(0,int(LAP),5):
        for side in (-1,1):
            v=side*k.rng.uniform(4.45,44);at,_=site(k,d,v);x,y,z=at(0,0);ground=k.height_at(x,y)-z
            j=k.rng.choices((0,1,2,3),(38,25,23,14))[0]
            high=k.rng.uniform(.65,1.45) if j==0 else k.rng.uniform(1.0,2.7) if j<3 else k.rng.uniform(3.1,5.6)
            w=high*(1.5 if j in (0,3) else .72)
            if any(abs(d-mark)<21 for mark in (98,2692,7335,9752)) and abs(v)<13:continue
            a=k.rng.uniform(.5,1.6)
            for rot in (a,a+math.pi/2):
                dx=w*math.cos(rot)/2;dy=w*math.sin(rot)/2
                tile(leaves,[at(-dx,-dy,ground),at(dx,dy,ground),at(dx,dy,ground+high),at(-dx,-dy,ground+high)],j,3,2)
            if j!=3:
                art.tube(at(.64,1.2,ground-.045),.27,.15,.19,lin(0xA38269),lin(0xB69979),6,lin(0xBC9B7F))
    def board(d,v,w,h,idx):
        at,yaw=site(k,d,v)
        for y0 in (-w*.36,w*.36):art.box(at(0,y0,-.52),(.17,.17,1.32+h),yaw,lin(0x6A5843))
        tile(boards,[at(0,y,z) for y,z in ((w/2,.72),(-w/2,.72),(-w/2,.72+h),(w/2,.72+h))],idx,2,2)
    board(98,-5.35,4.4,2.08,0);board(2653,-4.35,1.28,1.27,1)
    board(7332,-6.05,2,.93,2);board(9748,-6.3,2.45,1.1,3)
    at,yaw=site(k,2692,0)
    for side in (-1,1):
        art.box(at(0,side*3.3,-2.8),(9.4,.64,3.49),yaw,lin(0x988672))
        art.box(at(0,side*3.3,.63),(9.9,.80,.19),yaw,lin(0xBEAA91))
    art.box(at(0,0,-.72),(10.1,6.8,.67),yaw,lin(0x99836D))
    # The pullout and picnic structure sit on the same bench as the roadway.
    at,yaw=site(k,7339,-12.6)
    art.box(at(0,0,-1.0),(38,15,1.03),yaw,lin(0xBBA586))
    for u in (-4.4,4.4):
        for v in (-2.9,2.9):
            art.box(at(u,v,0),(1.18,1.04,3.15),yaw,lin(0x997C62))
            for z in (.36,.77,1.17,1.62,2.06,2.51,2.93):
                art.box(at(u,v,z),(1.21,1.075,.09),yaw,lin(0xAD9274))
    art.roof(at(0,0,3.05),11.6,8.4,1.56,yaw,lin(0x755D48))
    for u in range(-5,6):art.box(at(u,0,2.91),(.24,8.6,.18),yaw,lin(0x6A5544))
    for u in (-2.2,.3):
        for v in (-.57,.57):art.box(at(u,v,.06),(.21,.2,.74),yaw,lin(0x705A45))
    art.box(at(-.95,0,.82),(3.1,1.35,.15),yaw,lin(0x82684F))
    for v in (-1.01,1.01):art.box(at(-.95,v,.44),(3.25,.42,.13),yaw,lin(0x8E7156))
    for d in range(7305,7364,5):
        at0,h0=site(k,d,-4.8);art0=lin(0x806E55)
        art.tube(at0(0,0,-.2),.13,.12,1.04,art0,art0,7)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':2.72,
       'land':{'mid':0xAE906E},'sky':[0xF8AB76,0xEDB3AC,0xC5B7C7,0x8CAAC5,0x557FA6],
       'light':[0xFFD19A,1.65],'haze':0xDBB3A0,'fill':[0xDBCCD3,0xA28866],
       'sun_altitude':.12,'sun_azimuth':-.56,'sun_radius':130}
