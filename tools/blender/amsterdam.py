"""The Herengracht from the saddle. Place façades and the canal relative to the same quay."""
import math
from worldkit import Painted, lin

BRIDGE_SPACING = 400
FIRST_BRIDGE = 132
WATER = -1.65


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    mean = sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    n = math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1
    samples = []
    x, y = -bc.LEAD_IN, 0
    for i in range(n):
        d = i*bc.STEP-bc.LEAD_IN
        heading = .3*math.sin(d/275)+.1*math.sin(d/106)
        delta = (d-FIRST_BRIDGE+BRIDGE_SPACING/2)%BRIDGE_SPACING-BRIDGE_SPACING/2
        stage = bc.stage_at(stages,min(length-.01,max(0,d-delta)))
        lift = 1.05+(stage["level"]-12)*.105
        t = min(1,abs(delta)/31)
        z = lift*(1+math.cos(math.pi*t))/2
        grade = -100*lift*math.pi/62*math.sin(math.pi*t)*math.copysign(1,delta)
        x += bc.STEP*math.cos(heading)
        y += bc.STEP*math.sin(heading)
        samples.append(dict(x=x,y=y,z=z,d=d,h=heading,k=.3/275*math.cos(d/275)+.1/106*math.cos(d/106),g=grade))
    return samples,stages,length,mean,.105


def quay_land(road,col,theme,bc):
    b = bc.Builder("Canal quays","terrain")
    b.colours=[]
    def point(i,side,z):
        x,y,_=road.at(i,side)
        return x,y,z
    # The water is level, including below each brick arch.
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for a,az,c,cz,tint in [(7.2,.05,7.2,WATER-.2,0x815F4C),(7.2,WATER,35,WATER,0x39594E),
                               (35,WATER-.2,35,.32,0x765540),(35,.32,80,.32,0x928C7E),
                               (-6.2,.08,-65,.08,0x9F9688)]:
            pts=(point(i,a,az),point(j,a,az),point(j,c,cz),point(i,c,cz))
            ids=[b.v(p) for p in pts]
            b.faces.append(tuple(ids if a<=c else ids[::-1]))
            b.colours.extend([lin(tint)]*4)
    return b.build(col),lambda x,y:0


THEME={
    "lay":centre_line,"land_builder":quay_land,"terrain":{"sea":False},"land":{"mid":0x8F9987},"edge":"gracht","kerbs":False,
    "sky":[0xD7E9F0,0xB5D4E9,0x89BADB,0x659FCD,0x4288C1],
    "light":[0xFFF0D4,2.9],"fill":[0xDEEFF8,0x898A76],"haze":0xD1E0E4,
    "sun_altitude":.59,"sun_azimuth":-1.1,"palette":{"asphalt":0x996857,"promenade":0xB2A997},
    "chunks":{"Land":1},
}


def canal_house(k,b,d,side):
    i=k.road.index(d)
    x,y,_=k.road.at(i,side)
    yaw=k.s[i]["h"]
    along=(math.cos(yaw),math.sin(yaw))
    facing=1 if side<0 else -1
    outward=(-along[1]*facing,along[0]*facing)
    def point(u,height,proud=0):
        return (x+u*along[0]+proud*outward[0],y+u*along[1]+proud*outward[1],height)
    brick=lin(k.rng.choice((0x81584C,0x735248,0x8F6654,0xADA58C,0x665956,0xA2745C)))
    trim=lin(0xEAE4D3)
    pane=lin(k.rng.choice((0x516568,0x627074,0x495F61)))
    w=4.3
    h=k.rng.uniform(9,14)
    def rect(l,r,lo,hi,col,proud):
        pts=(point(l,lo,proud),point(r,lo,proud),point(r,hi,proud),point(l,hi,proud))
        b.face(pts if facing<0 else pts[::-1],(col,)*4)
    rect(-w,w,0,h,brick,0)
    # The shared walls run back to the roof, closing the end of each staggered row.
    b.box(point(0,0,-3.7),(2*w,7.25,h-.03),yaw,brick)
    form=k.rng.randrange(3)
    if form==0:
        for row,half in enumerate((w*.82,w*.59,w*.36,w*.15)):
            rect(-half,half,h+row*.65,h+(row+1)*.65,brick,.01)
            rect(-half,half,h+(row+1)*.65-.11,h+(row+1)*.65,trim,.03)
    else:
        last=w
        for row in range(6):
            t=(row+1)/6
            half=.9+(w-.9)*((1-t)**(2.4 if form==1 else .65))
            pts=(point(-last,h+row*.43),point(last,h+row*.43),point(half,h+(row+1)*.43),point(-half,h+(row+1)*.43))
            b.face(pts if facing<0 else pts[::-1],(brick,)*4)
            last=half
        rect(-1.12,1.12,h+2.58,h+2.8,trim,.04)
    for row in range(3):
        base=.65+row*(h-1)/3
        for centre in (-2.7,0,2.7):
            rect(centre-.79,centre+.79,base,base+2.1,trim,.05)
            rect(centre-.65,centre+.65,base+.12,base+1.97,pane,.08)
            rect(centre-.66,centre+.66,base+1.43,base+1.51,trim,.10)
    rect(-w,w,h-.25,h-.06,trim,.08)


def bridge(k,b,d):
    i=k.road.index(d)
    yaw=k.s[i]["h"]
    def pt(u,v,z):
        x,y,_=k.P(i,u,v)
        return x,y,z
    # A shallow central brick arch, viewed obliquely from the near-bank cycle path.
    def crown(side):
        return 2.6-((side-21)/15)**2*1.85
    def soffit(side):
        q=(side-21)/12
        return WATER+.04+2.92*math.sqrt(max(0,1-q*q))
    brick,stone,iron=map(lin,(0x9D6951,0xC5B4A0,0x354D49))
    for j in range(30):
        a=6+j
        c=a+1
        for face in (-3.1,3.1):
            pts=(pt(face,a,soffit(a)),pt(face,c,soffit(c)),pt(face,c,crown(c)),pt(face,a,crown(a)))
            b.face(pts,(brick,)*4);b.face(pts[::-1],(brick,)*4)
            pts=(pt(face,a,soffit(a)),pt(face,c,soffit(c)),pt(face,c,soffit(c)+.16),pt(face,a,soffit(a)+.16))
            b.face(pts,(stone,)*4);b.face(pts[::-1],(stone,)*4)
            if j%2==0:
                b.box(pt(face,a,crown(a)),(.075,.075,1.0),yaw,iron)
            for h in (.55,1.03):
                pts=(pt(face,a,crown(a)+h),pt(face,c,crown(c)+h),pt(face,c,crown(c)+h+.065),pt(face,a,crown(a)+h+.065))
                b.face(pts,(iron,)*4);b.face(pts[::-1],(iron,)*4)
            if j%4==0:
                b.box(pt(face,a,soffit(a)+.18),(.14,.2,.12),yaw,lin(0xFDE8AE))
        pts=(pt(-3.1,a,crown(a)),pt(3.1,a,crown(a)),pt(3.1,c,crown(c)),pt(-3.1,c,crown(c)))
        b.face(pts,(stone,)*4)
        pts=(pt(-3.1,a,soffit(a)),pt(-3.1,c,soffit(c)),pt(3.1,c,soffit(c)),pt(3.1,a,soffit(a)))
        b.face(pts,(brick,)*4)


def elm(k,b,d,offset):
    i=k.road.index(d)
    x,y,z=k.road.at(i,offset)
    bark=lin(0x635B4A)
    b.tube((x,y,z-.4),.22,.14,4.2,bark,bark,6)
    for j in range(3):
        a=j*math.tau/3+k.rng.uniform(-.2,.2)
        base=(x+.85*math.cos(a),y+.85*math.sin(a),z+3.5+j*.45)
        width=k.rng.uniform(2.15,2.95)
        leaf=lin(k.rng.choice((0x76934D,0x6C904F,0x829E56)))
        shade=tuple(c*.72 for c in leaf[:3])+(1,)
        b.tube(base,width*.34,width,1.65,shade,leaf,7)
        b.tube((base[0],base[1],base[2]+1.65),width,width*.22,2.1,leaf,leaf,7,leaf)


def houseboat(k,b,d,offset):
    i=k.road.index(d)
    yaw=k.s[i]["h"]
    def pos(u,v,z):
        x,y,_=k.P(i,u,offset+v)
        return x,y,WATER+z
    body=lin(k.rng.choice((0xD5CEAA,0xB5C1AE,0xE4D9C5)))
    deck,glass=lin(0x886D52),lin(0x52696D)
    b.box(pos(0,0,-.20),(12.8,3.45,.66),yaw,lin(0x43544D))
    b.box(pos(0,0,.44),(13,3.6,.14),yaw,deck)
    b.box(pos(-1.35,0,.56),(9.35,3.16,1.83),yaw,body)
    b.box(pos(-1.35,0,2.36),(9.7,3.45,.17),yaw,lin(0x68716A))
    for side in (-1,1):
        for u in (-4.4,-2.3,-.2,1.9):
            b.box(pos(u,side*1.59,1.16),(1.3,.08,.83),yaw,glass)
    for u in (4.7,5.6):
        b.tube(pos(u,-.95,.58),.18,.25,.38,deck,deck,6)
        b.tube(pos(u,-.95,.96),.32,.12,.54,lin(0x557555),lin(0x86A867),6)


def bollard(k,b,d):
    i=k.road.index(d)
    x,y,z=k.road.at(i,-5.7)
    red=lin(0x8B4D3C)
    b.tube((x,y,z),.125,.09,.91,red,red,7,red)
    # Three St Andrew’s crosses on the side that faces an approaching rider.
    yaw=k.s[i]["h"]
    for row in range(3):
        for incline in (-1,1):
            pts=[]
            for across,thick in ((-.048,-.012),(.048,-.012),(.048,.012),(-.048,.012)):
                pts.append((x-.114*math.cos(yaw)-across*math.sin(yaw),y-.114*math.sin(yaw)+across*math.cos(yaw),z+.46+row*.125+across*incline+thick))
            tint=lin(0xE5D1B4)
            b.face(pts,(tint,)*4);b.face(pts[::-1],(tint,)*4)


def bicycle(b,origin,yaw,commuter=False):
    x,y,z=origin
    cs,sn=math.cos(yaw),math.sin(yaw)
    def pt(u,h,v=0):
        return (x+u*cs-v*sn,y+u*sn+v*cs,z+h)
    rubber,frame,metal=map(lin,(0x343C40,0x536A61,0xABB8AF))
    def bar(a,c,width,col):
        dx,dh=c[0]-a[0],c[1]-a[1]
        length=math.hypot(dx,dh)
        off=(-dh*width/length,dx*width/length)
        pts=tuple(pt(u+sign*off[0],h+sign*off[1]) for (u,h),sign in ((a,1),(a,-1),(c,-1),(c,1)))
        b.face(pts,(col,)*4);b.face(pts[::-1],(col,)*4)
    for wheel in (-.53,.53):
        for q in range(12):
            a=q*math.tau/12
            c=(q+1)*math.tau/12
            bar((wheel+.32*math.cos(a),.35+.32*math.sin(a)),(wheel+.32*math.cos(c),.35+.32*math.sin(c)),.025,rubber)
    for a,c in [((-.53,.35),(-.18,.76)),((-.18,.76),(0,.35)),((0,.35),(-.53,.35)),((0,.35),(.41,.77)),((.41,.77),(.53,.35)),((.41,.77),(.36,1.03)),((-.18,.76),(-.22,.90))]:
        bar(a,c,.031,frame)
    bar((-.35,.91),(-.1,.91),.05,rubber)
    bar((.22,1.05),(.40,1.02),.029,metal)
    if commuter:
        coat,skin=lin(0x8C624A),lin(0xC99A76)
        b.tube(pt(-.18,.91),.155,.18,.52,coat,coat,7)
        b.tube(pt(-.17,1.44),.13,.115,.23,skin,skin,7,skin)
        bar((-.16,1.23),(.30,1.05),.064,coat)
        bar((-.18,.93),(.04,.65),.075,lin(0x42566A))
        bar((.04,.65),(-.02,.39),.062,lin(0x42566A))


def tour_boat(k):
    b=Painted(k,"tour-boat")
    hull,glass,cream=map(lin,(0x586F78,0x7497A2,0xE3D9BD))
    # Draw in local coordinates with the bow along +Y. Course.place supplies its bearing.
    b.box((0,0,-.23),(2.65,9,.70),0,hull)
    b.box((0,0,.43),(2.71,9.1,.14),0,cream)
    b.box((0,-.35,.58),(2.26,6.85,.72),0,glass)
    b.roof((0,-.35,1.30),6.6,2.08,.38,math.pi/2,glass)
    for y in (-3.4,-2,-.6,.8,2.2,2.95):
        for side in (-1,1):
            b.box((1.15*side,y,.57),(.08,.085,.86),0,cream)
        b.box((0,y,1.32),(2.28,.11,.10),0,cream)
    for side in (-1,1):
        pts=((side*1.34,4.48,-.20),(0,5.65,.10),(0,5.65,.36),(side*1.34,4.48,.55))
        b.face(pts,(hull,)*4);b.face(pts[::-1],(hull,)*4)


def scenery(k):
    b=Painted(k)
    for d in range(-55,int(k.length)+40,9):
        canal_house(k,b,d,-10.5)
        canal_house(k,b,d,41.5)
    for d in range(FIRST_BRIDGE,int(k.length),BRIDGE_SPACING):
        bridge(k,b,d)
    for d in range(-35,int(k.length)+55,22):
        if abs((d-FIRST_BRIDGE+200)%400-200)>9:
            elm(k,b,d,6.65)
        if d%3:
            elm(k,b,d+7,37.3)
    for d in range(-19,int(k.length),61):
        if abs((d-FIRST_BRIDGE+200)%400-200)>16:
            houseboat(k,b,d,32.2 if d%2 else 10.2)
    for d in range(3,int(k.length),10):
        bollard(k,b,d)
    for d in range(6,int(k.length),36):
        i=k.road.index(d)
        for j in range(3):
            x,y,z=k.P(i,j*.75,6.66)
            bicycle(b,(x,y,z+.08),k.s[i]["h"]+.78)
    tour_boat(k)
    bicycle(Painted(k,"commuter"),(0,0,0),math.pi/2,True)
    return {"efforts":0}
