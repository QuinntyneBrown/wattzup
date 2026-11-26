"""Arizona Route 66 from the Painted Desert and Holbrook to Sitgreaves Pass."""
import bisect
import math
from iten_landmarks import pictured,picture,site
from arenberg import beam
from worldkit import Painted,lin,smooth

PROFILE=((0,900),(650,904),(1160,911),(1650,906),(2250,902),(2640,910),(3100,914),(3860,907),
         (4570,919),(5130,924),(5800,917),(6200,927),(6600,947),(7000,966),(7260,975),(7660,992),(8000,986))


def level(d):
    i=max(0,min(len(PROFILE)-2,bisect.bisect_right(PROFILE,(d,math.inf))-1));(a,z),(b,w)=PROFILE[i:i+2]
    return z+(w-z)*max(0,min(1,(d-a)/(b-a)))


def bearing(d):
    return .046*math.sin(d/420)*smooth(600,1450,d)+smooth(5900,6950,d)*(.44*math.sin(d/210)+.19*math.sin(d/84))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d);z=level(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=bearing(d+.5)-bearing(d-.5),g=100*(level(d+bc.STEP)-z)/bc.STEP))
        mid=bearing(d+bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1


def road(r,st,length,col,bc):
    surf=bc.Builder('ArizonaHighway','terrain');surf.colours=[];surf.uvs=[]
    paint=bc.Builder('HighwayStriping','terrain');paint.colours=[]
    for i in range(len(r.s)-1):
        d=r.s[i]['d'];e=r.s[i+1]['d']
        pts=[(j,v) for j,v in ((i,-4.33),(i+1,-4.33),(i+1,4.33),(i,4.33))]
        picture(surf,[r.at(j,v,.094) for j,v in pts],[(v/5.2,r.s[j]['d']/5.2) for j,v in pts])
        for v,w,c in ((-3.86,.095,0xD5CFC0),(3.86,.095,0xD5CFC0),(-.11,.115,0xDBB456),(.11,.115,0xDCB255)):
            if v>0 and w>.1 and d<5950 and int(d//8)%2:continue
            paint.quad(r.at(i,v,.107),r.at(i+1,v,.107),r.at(i+1,v+w,.107),r.at(i,v+w,.107));paint.colours.extend([lin(c)]*4)
    surf.build(col);paint.build(col)


def land(r,col,theme,bc):
    mesh=bc.Builder('PaintedDesert','terrain');mesh.colours=[]
    def ground(d,v):
        a=abs(v);roll=math.sin(d/175+v/65)*3.8+math.cos(d/250-v/113)*2.6
        mountains=smooth(5600,6900,d)*smooth(50,350,a)*(57+30*math.sin(d/144+v/85)+21*math.sin(d/78-v/110))
        return level(d)-.31+smooth(7,105,a)*roll+mountains
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=(y-p['y'])*math.cos(p['h'])-(x-p['x'])*math.sin(p['h']);return ground(p['d'],v)
    offsets=(-1450,-910,-590,-370,-232,-145,-89,-53,-31,-17,-8,-4,0,4,8,17,31,53,89,145,232,370,590,910,1450)
    last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in offsets:
            x,y,_=r.at(i,v);z=ground(d,v)
            n=math.sin(d/88+v/59)+.65*math.sin(d/42-v/74)
            tones=(0xBC7650,0xC28359,0xBF7855) if d<6050 else (0x967D62,0xA28D70,0x947F67)
            tone=0xAC9073 if abs(v)<8 else tones[0 if n>.4 else 1 if n>-.5 else 2]
            row.append(((x,y,z),lin(tone)))
        if last:
            for j in range(len(offsets)-1):
                pts=(last[j],row[j],row[j+1],last[j+1]);mesh.quad(*[p for p,c in pts]);mesh.colours.extend(c for p,c in pts)
        last=row
    return mesh.build(col),height


def tile(mesh,pts,index,cols,rows):
    u=index%cols/cols;v=1-(index//cols+1)/rows
    picture(mesh,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))


def scenery(k):
    art=Painted(k);ridge=Painted(k,'peaks');front=pictured(k,'MotherRoadShops');plants=pictured(k,'ArizonaScrub');signs=pictured(k,'HighwayShields')
    def facade(mesh,at,u,v,z,w,h,index,cols,rows,axis=0):
        c=math.cos(axis);s=math.sin(axis)
        tile(mesh,[at(u+t*c,v+t*s,z+up) for t,up in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],index,cols,rows)
    def mesa(d,v,width,depth,tall):
        at,_=site(k,d,v);count=13;outline=[k.rng.uniform(.78,1.14) for _ in range(count)]
        def ring(scale,high):
            return [at(math.cos(j*math.tau/count)*width*scale*outline[j],math.sin(j*math.tau/count)*depth*scale*outline[j],high) for j in range(count)]
        bottom=ring(1.15,-25);rock=(0xAC765C,0xAE7056,0xBD8063,0x9D6653,0xC98E69,0xA96B51,0xB57D60)
        for n,(s,z) in enumerate(((.88,.18),(.65,.32),(.63,.56),(.58,.59),(.56,.79),(.49,.86),(.46,1))):
            top=ring(s,tall*z)
            for j in range(count):
                tint=lin(rock[n]);share=.77+.21*(1+math.sin(j*math.tau/count+1))/2;c=tuple(a*share for a in tint[:3])+(1,)
                ridge.face((bottom[j],bottom[(j+1)%count],top[(j+1)%count],top[j]),(c,c,tint,tint))
            bottom=top
        ridge.face(bottom,(lin(0xBC896C),)*count)
    for d in range(340,7610,286):
        for side in (-1,1):
            mesa(d+k.rng.uniform(-100,100),side*k.rng.uniform(310,730),k.rng.uniform(96,240),k.rng.uniform(63,146),k.rng.uniform(62,151))
    # Receding buttes on the straight highway's axis, kept across the bend beyond the finish.
    for j in range(6):mesa(8180-40*j,160+j*95,103+j*12,95,138+j*9)
    for d in range(-40,8090,5):
        for side in (-1,1):
            v=side*k.rng.uniform(6.1,68);at,h=site(k,d,v)
            x,y,z=at(0,0);ground=k.height_at(x,y)-z
            j=k.rng.randrange(3);tall=k.rng.uniform(.52,1.7);w=tall*(1.7 if j==0 else 1)
            if 1090<d<1240 or 2580<d<2800 or 3790<d<3950 or 5040<d<5230 or 7180<d<7420:
                if abs(v)<26:continue
            for a in (.78,2.35):facade(plants,at,0,0,ground,w,tall,j,3,2,a)
    previous=None;wood=lin(0x785C45)
    for d in range(-30,8060,42):
        at,h=site(k,d,9.4);art.tube(at(0,0,-.4),.145,.11,8.8,wood,wood,7)
        art.box(at(0,0,7.75),(.17,3,.23),h,wood)
        anchors=[at(0,i,8.11) for i in (-1.3,0,1.3)]
        if previous:
            for a,b in zip(previous,anchors):
                mid=((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2-.65)
                beam(art,a,mid,.025,lin(0x564D42));beam(art,mid,b,.025,lin(0x564D42))
        previous=anchors
    for d in range(15,8070,12):
        at,h=site(k,d,-8.9)
        art.box(at(0,0,-.4),(.14,.14,1.58),h,wood)
        beam(art,at(0,0,.71),k.road.pos(d+12,-8.9,.71),.034,lin(0x786F61))
    for d in (86,545,1560,2765,3950,5350,6720,7740):
        tile(signs,[k.road.pos(d+u,v,.14) for u,v in ((0,3.7),(0,-.04),(6.5,-.04),(6.5,3.7))],0,2,4)
    for d in (112,1130,2602,3872,5145,7290):
        at,h=site(k,d,-5.8);art.box(at(0,0,-.3),(.12,.14,3.15),h,lin(0x888677))
        facade(signs,at,0,0,1.55,1.92,1.25,1,2,4,math.pi/2)
    def parked(d,v,tint,yaw=0):
        at,h=site(k,d,v)
        def p(x,y,z):return at(x*math.cos(yaw)-y*math.sin(yaw),x*math.sin(yaw)+y*math.cos(yaw),z)
        angle=h+yaw;chrome=lin(0xCAC8B8);body=lin(tint)
        art.box(p(0,0,.38),(4.86,1.88,.67),angle,body)
        art.box(p(.14,0,1.06),(2.32,1.61,.61),angle,lin(0x577079));art.box(p(.12,0,1.67),(2.22,1.65,.12),angle,lin(0xECE5CE))
        for x in (-2.46,2.46):art.box(p(x,0,.45),(.17,1.92,.21),angle,chrome)
        for sign in (-1,1):
            art.box(p(.04,sign*.95,.80),(4.79,.051,.073),angle,chrome)
            art.box(p(1.73,sign*.82,.99),(1.2,.13,.34),angle,body)
            for x in (-1.46,1.4):
                art.box(p(x,sign*.91,.12),(.62,.16,.58),angle,lin(0x494A46))
                art.box(p(x,sign*1.01,.24),(.37,.037,.32),angle,lin(0xD8D1BE))
    # Holbrook's concrete cabins: dome doors project below white tapered sides and red bands.
    for j,d in enumerate((1158,1176,1194,1212,1230,1248)):
        v=-17-j%2*4;at,h=site(k,d,v);cream=lin(0xE4DDCA);red=lin(0xA34E40)
        for z,lo,hi,t,tone in ((-.3,4.45,4.35,1.5,cream),(1.2,4.35,3.63,1.55,cream),(2.75,3.63,3.52,.22,red),(2.97,3.52,.56,6.6,cream),(9.57,.56,.15,.95,red)):
            art.tube(at(0,0,z),lo,hi,t,tone,tone,24)
        art.box(at(0,3.92,-.02),(1.72,.8,2.16),h,lin(0x967E64))
        art.box(at(0,4.35,.05),(1.21,.12,1.87),h,lin(0x655747))
        for t in (-1,1):beam(art,at(t*.58,0,10.7),at(-t*.30,0,9.16),.083,wood)
        if j%2==0:parked(d+4,v+6,0x6EB8B1,.55)
    def store(d,v,w,deep,high,idx):
        at,h=site(k,d,v);side=1 if v>0 else -1;face=-side*(deep/2+.035)
        art.box(at(0,0,-.45),(w,deep,high+.45),h,lin((0x78AFA3,0x886746,0x907456,0xBA8862)[idx]))
        facade(front,at,0,face,0,w,high,idx,2,2,0 if v>0 else math.pi)
        art.box(at(0,face-side*1.0,2.64),(w+.65,2.25,.22),h,lin(0xB8A088 if idx else 0xAC5261))
        art.box(at(0,face-side*.9,-.12),(w+.5,2.15,.27),h,lin(0xAD987A))
        for u in (-w*.46,w*.46):art.box(at(u,face-side*1.97,.08),(.15,.15,2.58),h,wood)
        return at,h
    for j,d in enumerate(range(2610,2780,17)):
        for v in (-14,17):store(d+j%3,v,14.7,6.7,4.5+j%3*.45,3 if j%3 else 2)
    for j,d in enumerate(range(7208,7405,16)):
        for v in (-14,16):store(d,v,14.5,7.2,4.4+j%3*.68,2 if j%4 else 3)
    for j,d in enumerate(range(2430,2570,28)):
        at,h=site(k,d,-5.85);art.box(at(0,0,0),(.14,.14,1.82),h,wood);facade(signs,at,0,0,.94,2.1,.97,3+j,2,4,math.pi/2)
    at,h=store(3879,-14,19.6,8.4,5.6,1)
    for u in (-5,1.4):
        art.box(at(u,7.4,0),(1.02,.66,1.76),h,lin(0xB76A52))
        facade(plants,at,u,7.75,.04,1.32,2.61,4 if u<0 else 5,3,2,math.pi)
    diner,h=store(5149,-16,23,9.4,4.65,0)
    for z,c in ((.52,0xB4B8B1),(.77,0xB9C1B6),(3.8,0xDF8A95),(4.06,0x99D0B8)):
        art.box(diner(0,4.77,z),(23.1,.13,.10),h,lin(c))
    for u in (-7,-4,-1,2,5,8):
        art.tube(diner(u,5.7,.05),.10,.09,.58,lin(0xBFBDB0),lin(0xD1CABB),8)
        art.tube(diner(u,5.7,.63),.35,.34,.12,lin(0xB5443E),lin(0xCE5950),12)
    at,h=site(k,5142,-8.5);art.box(at(0,0,-.15),(.31,.27,4.5),h,lin(0xA28B75));facade(signs,at,0,0,3.6,4.4,2.05,2,2,4,1.14)
    for d,v,t in ((2654,-7.5,0xCBAC57),(2702,8.3,0x598A85),(3888,-8,0x9E4945),(5161,-8.5,0x66A79D),(7265,7.1,0x9F5045)):
        parked(d,v,t,.21)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.3,
       'land':{'mid':0xBE805F},'sky':[0xEDC693,0xE6D2B0,0xB6D5DE,0x84B6D0,0x578DB5],
       'light':[0xFFE1AC,1.65],'haze':0xDBBE9D,'fill':[0xDADDD2,0xB49177],
       'sun_altitude':.31,'sun_azimuth':-.86,'sun_radius':125}
