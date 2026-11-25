"""San Javier's hillside lanes, outdoor escalators and terraced brick neighbourhood."""
import math
from worldkit import Painted, lin

LENGTH = 13583.333333333332
LANDINGS = [1550, 2810, 4930, 6200, 8230, 10350, 11760]
MARKETS = [80, 660, 1570, 2820, 5280, 7470, 10370, 11900]
LEVELS = []


def direction(d):
    return 1.12*math.sin(d/205-.25)+.31*math.sin(d/72)+.23*math.sin(d/890)


POINTS=[(-100.,0.)]
for metre in range(-100,14100):
    x,y=POINTS[-1];h=direction(metre+.5)
    POINTS.append((x+math.cos(h),y+math.sin(h)))


def pose(d,l=0):
    i=max(0,min(len(POINTS)-2,math.floor(d)+100))
    f=max(0,min(1,d-i+100));a,b=POINTS[i:i+2];h=direction(d)
    return a[0]+(b[0]-a[0])*f-math.sin(h)*l,a[1]+(b[1]-a[1])*f+math.cos(h)*l,h


def height(d):
    for a,b,z,g in LEVELS:
        if d<=b:return z+max(0,d-a)*g
    a,b,z,g=LEVELS[-1];return z+(b-a)*g


def route(course,theme,bc):
    stages=bc.stages(course['plan']);LEVELS.clear();z=64
    for stage in stages:
        grade={'warm-up':.024,'recover':.012,'cool-down':.008}.get(stage['kind'],.04+(stage['level']-12)*.003)
        LEVELS.append((stage['from'],stage['to'],z,grade))
        z+=(stage['to']-stage['from'])*grade
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=pose(d)
        rows.append(dict(x=x,y=y,z=height(d),h=h,d=d,k=direction(d+.5)-direction(d-.5),g=100*(height(d+.5)-height(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows,stages,LENGTH,mean,0


def roadway(road,st,length,col,bc):
    mesh=bc.Builder("Road","asphalt")
    for i in range(len(road.s)-1):
        mesh.quad(road.at(i,-3.2),road.at(i+1,-3.2),road.at(i+1,3.2),road.at(i,3.2))
    mesh.build(col)


def floor(d,l):
    return height(d)-.21+max(0,l-6)*.53-max(0,-l-10)*.59


def land(road,col,theme,bc):
    b=bc.Builder("Terrain","terrain");b.colours=[]
    strips=[(-380,0x718556),(-110,0x62774a),(-47,0x9c7155),(-19,0xae7960),(-6,0x948374),
            (-3,0xbba790),(3,0xbba790),(6,0x9e8672),(25,0x976647),(80,0xb17c5e),(325,0x607849)]
    last=None
    for d in range(-80,13840,12):
        row=[]
        for l,c in strips:
            x,y,_=pose(d,l);row.append(b.v((x,y,floor(d,l))));b.colours.append(lin(c))
        if last:
            for q in range(len(row)-1):b.faces.append((last[q],row[q],row[q+1],last[q+1]))
        last=row
    for layer in range(3):
        last=None
        for x in range(-6200,20500,95):
            y=-1650-layer*1200
            z=280+layer*100+95*math.sin(x/613+layer)+57*math.sin(x/180+layer*.5)
            row=[b.v((x,y-70,z)),b.v((x,y+500,-400))]
            b.colours.extend([lin((0x738a7b,0x899d91,0xa6b7ae)[layer])]*2)
            if last:b.faces.append((last[0],row[0],row[1],last[1]))
            last=row
    return b.build(col),lambda x,y:0


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':3.2,
       'terrain':{'sea':False},'land':{'mid':0x8d765e},'haze':0xc2cecb,
       'sky':[0xe5e5ce,0xcbdcde,0xacd5e6,0x91c1df,0x68a7d4],
       'light':[0xffebca,3.0],'fill':[0xc9dce7,0xa3927b],
       'sun_azimuth':-.62,'sun_altitude':.78,'palette':{'asphalt':0xb9aaa0}}


def scenery(k):
    art=Painted(k);rng=k.rng
    def box(d,l,z,a,b,h,c):
        x,y,yaw=pose(d,l);art.box((x,y,z),(a,b,h),yaw,lin(c),.79)
    def segment(d,l,z,end,side,up,width,thick,colour):
        x,y,_=pose(d,l);bx,by,_=pose(end,side)
        dx,dy,dz=bx-x,by-y,up-z;flat=math.hypot(dx,dy) or 1
        ux,uy=-dy/flat*width/2,dx/flat*width/2
        a=[(x+ux,y+uy,z),(x-ux,y-uy,z),(bx-ux,by-uy,up),(bx+ux,by+uy,up)]
        b=[(ax,ay,az+thick) for ax,ay,az in a]
        art.face(b,[lin(colour)]*4)
        for q in range(4):
            j=(q+1)%4;art.face([a[q],a[j],b[j],b[q]],[lin(colour)]*4)
    # Uneven roofs, water tanks, window grilles and proud brick piers make each house legible.
    palette=[0xb96e50,0xa7563f,0xc67f5a,0xbd7653,0xcf8869,0xa75d48,0xe4b691,0xb78876]
    for layer in range(3):
        for side in (-1,1):
            for d in range(-45+layer*5,13710,12 if layer==0 else 18):
                if side<0 and layer==0 and any(abs(d-site)<73 for site in LANDINGS+MARKETS+[11310]):continue
                if side<0 and abs(d-11310)<115:continue
                l=side*(9+layer*19+rng.uniform(-1.1,2))
                if side>0 and layer==0 and any(abs(d-site)<42 for site in LANDINGS):continue
                z=floor(d,l)-1.3;w=rng.uniform(7.1,10.5);depth=rng.uniform(5.1,7.8)
                floors=rng.choice((1,2,2,3));h=floors*2.55+.55
                box(d,l,z,w,depth,h,rng.choice(palette))
                box(d,l,z+h,w+.6,depth+.9,.18,rng.choice((0xa1a8a5,0x7a817c,0x9d8980,0xb1a494)))
                front=l-side*(depth*.5+.065)
                for f in range(floors):
                    for along in (-w*.27,w*.27):
                        box(d+along,front,z+1.78+f*2.55,1.38,.17,1.08,0x343f41)
                        if layer==0:
                            box(d+along,front-side*.1,z+1.72+f*2.55,1.59,.26,.10,0xd4b49d)
                            box(d+along,front-side*.11,z+1.79+f*2.55,.06,.08,1.04,0x81918b)
                if layer==0:
                    for j in range(6):box(d-w*.44+j*w*.17,l,z+h+.17,.07,depth+.7,.045,0x777e7b)
                    for a in (-w*.44,w*.44):
                        box(d+a,front,z,.22,.24,h+.2,0xb9a496)
                        box(d+a,front,z+h+.18,.045,.06,rng.uniform(.35,1.3),0x594b45)
                if d%4==1:
                    x,y,_=pose(d+1,l+1);art.tube((x,y,z+h+.2),.62,.62,.95,lin(0x3d4341),lin(0x59605c),8)
    for d in range(-60,13700,4):
        for side in (-1,1):
            box(d,side*3.34,height(d)-.09,4.04,.25,.21,(0xd7b959,0x7daca7,0xcd765f,0xdfc48d)[(d//16)%4])
    for station in LANDINGS:
        # A roofed 24-metre escalator rises 8 m between two concrete landings.
        for flight in range(2):
            d=station-30+flight*32;z=height(d)-.04+flight*3
            for j in range(53):
                box(d+j*.44,6.7,z+j*.14, .46,1.78,.18,0x696f70 if j%2 else 0x9da4a1)
            for side in (-1,1):
                l=6.7+side*1.06
                segment(d,l,z+.2,d+23,l,z+7.55,.18,.61,0x819da1)
                segment(d,l,z+.83,d+23,l,z+8.15,.17,.11,0x3e4647)
                for u in (0,7.5,15,23):
                    box(d+u,l+side*.42,z+u*.32,.15,.2,3.2,0x585854)
                segment(d-1,6.7+side*.84,z+3.38,d+24,6.7+side*.84,z+11.38,1.82,.17,0xe0883d if side==1 else 0xc5662d)
            box(d-2.3,6.7,z-.35,4.8,3.2,.4,0xaaa99c)
            box(d+25.5,6.7,z+7.16,4.9,3.2,.45,0xb4ad9b)
            for j in range(30):
                box(d+j*.72,9.5,z+j*.245,.75,1.5,.25,(0x4c819d,0xdca34e,0xb97166,0x6ca991)[(j//5)%4])
    for station in MARKETS:
        # The vendor occupies the rear of the promenade; the road stays clear.
        for q in range(4):
            d=station-17+q*9.4;l=-7.2
            box(d,l,height(d)-.55,6.5,4,.57,0xbda48a)
            box(d,l,height(d)+.1,3.5,1.45,1.0,0x936641)
            box(d,l,height(d)+1.10,3.75,1.65,.14,0xd0ad7f)
            for a in (-1.65,1.65):box(d+a,l,height(d)+.05,.11,.12,2.8,0x74664e)
            box(d,l,height(d)+2.83,4.1,3.4,.13,(0xdc9459,0x578f87,0xc65e53,0xd9bd68)[q])
            for j in range(7):
                x,y,_=pose(d-1.1+j*.34,l+.17);art.tube((x,y,height(d)+1.25),.15,.13,.18,lin(0xe4ad4c),lin(0xe9c478),7)
        for span in range(4):
            d=station-32+span*15
            segment(d,-8,height(d)+6,d+6,9,height(d)+6.6,.04,.04,0x5c615b)
            for j in range(14):
                t=j/14;x,y,_=pose(d+6*t,-8+17*t);z=height(d)+6+.6*t
                p=[(x-.27,y,z),(x+.27,y+.4,z+.02),(x+.12,y+.22,z-.62)]
                art.face(p,[lin((0xf2c441,0x477da1,0xd6504e)[j%3])]*3)
                art.face(p[::-1],[lin((0xf2c441,0x477da1,0xd6504e)[j%3])]*3)
    # Downtown lies beyond the nearest roofs rather than moving with each curve.
    for i in range(390):
        x=rng.uniform(-1800,14600);y=rng.uniform(-1600,-550);z=16+max(0,x*.021)
        h=rng.uniform(13,72);w=rng.uniform(6,16)
        art.box((x,y,z),(w,w*.8,h),.06,lin(rng.choice((0x929e9e,0xb1b1a3,0x899a9d))),.74)
    return {"efforts":k.gates("accent","accent-2",[f"crowd-{i}" for i in range(6)])}
