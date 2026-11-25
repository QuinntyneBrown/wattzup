"""The Herengracht from the saddle. Place façades and the canal relative to the same quay."""
import math
from worldkit import Painted, lin, smooth

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
    def bearing(d):
        local=(d-FIRST_BRIDGE+BRIDGE_SPACING/2)%BRIDGE_SPACING-BRIDGE_SPACING/2
        # At cross canals the quay first turns toward the water, then turns inland
        # over the crown. Riders see the arch and its opening on approach.
        return (.3*math.sin(d/275)+.1*math.sin(d/106)
                +.68*smooth(-180,-48,local)-.90*smooth(-40,10,local)+.22*smooth(20,105,local))
    for i in range(n):
        d = i*bc.STEP-bc.LEAD_IN
        heading = bearing(d)
        delta = (d-FIRST_BRIDGE+BRIDGE_SPACING/2)%BRIDGE_SPACING-BRIDGE_SPACING/2
        stage = bc.stage_at(stages,min(length-.01,max(0,d-delta)))
        lift = 1.05+(stage["level"]-12)*.105
        t = min(1,abs(delta)/31)
        z = lift*(1+math.cos(math.pi*t))/2
        grade = -100*lift*math.pi/62*math.sin(math.pi*t)*math.copysign(1,delta)
        x += bc.STEP*math.cos(heading)
        y += bc.STEP*math.sin(heading)
        samples.append(dict(x=x,y=y,z=z,d=d,h=heading,k=(bearing(d+1)-bearing(d-1))/2,g=grade))
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
        # A floating glint and the neighbouring bank's dark green reflection
        # give the level water a sense of depth at low detail.
        for pos in range(8):
            u=9+pos*3.15+.45*math.sin(i*.89+pos)
            if (i+pos)%3==0:
                pts=(point(i,u,WATER+.015),point(min(i+1,j),u+.11,WATER+.015),
                     point(min(i+1,j),u+.16,WATER+.015),point(i,u+.08,WATER+.015))
                b.faces.append(tuple(b.v(p) for p in pts));b.colours.extend([lin(0x79978C)]*4)
        for a,az,c,cz,tint in [(5.2,.035,5.2,WATER-.2,0x815F4C),(5.2,WATER,35,WATER,0x39594E),
                               (35,WATER-.2,35,.32,0x765540),(35,.32,80,.32,0x928C7E),
                               (-3.8,.08,-65,.08,0x9F9688)]:
            pts=(point(i,a,az),point(j,a,az),point(j,c,cz),point(i,c,cz))
            ids=[b.v(p) for p in pts]
            b.faces.append(tuple(ids if a<=c else ids[::-1]))
            b.colours.extend([lin(tint)]*4)
    return b.build(col),lambda x,y:0


THEME={
    "road_half_width":3.4,"lay":centre_line,"land_builder":quay_land,"terrain":{"sea":False},"land":{"mid":0x8F9987},"edge":"gracht","kerbs":False,
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
    w=4.3
    h=k.rng.uniform(9,14)
    sheet=k.B["canal-front"]
    if sheet.uvs is None:
        sheet.uvs=[]
    tile=k.rng.randrange(8)
    form=tile%4
    top=h/.74
    def facade(outline):
        points=[point(u,v,.12) for u,v in outline]
        coords=[((tile%4+.005+.99*(u+w)/(2*w))/4,
                 (1-tile//4+.005+.99*v/top)/2) for u,v in outline]
        if facing>0:
            points.reverse()
            coords.reverse()
        sheet.faces.append(tuple(sheet.v(pos) for pos in points))
        sheet.uvs.extend(coords)
    facade([(-w,0),(w,0),(w,h),(-w,h)])
    b.box(point(0,0,-3.7),(2*w,7.25,h-.03),yaw,brick)
    if form==0:
        widths=[1,.83,.66,.49,.32,.32]
    elif form==1:
        widths=[1,.71,.56,.45,.32,.13]
    elif form==2:
        widths=[1,.74,.47,.42,.40,.11]
    else:
        widths=[1,1,.54,.54,.54,.54]
    rise=(top-h)*(0.53 if form==3 else 1)
    for j,(lo,hi) in enumerate(zip(widths,widths[1:])):
        low,high=h+rise*j/5,h+rise*(j+1)/5
        facade([(-w*lo,low),(w*lo,low),(w*(lo if form==0 else hi),high),(-w*(lo if form==0 else hi),high)])
    # The saddle sees stoops and sills in relief even close to a house.
    for step in range(3):
        b.box(point(-w*.62,step*.16,.55-step*.13),(1.65,1.48-step*.24,.17),yaw,lin(0x978F83))
    b.box(point(0,top*.91,.62),(.22,1.65,.26),yaw,lin(0x544B40))
    for j in range(1,4):
        b.box(point(0,j*h/4,.15),(2*w,.25,.10),yaw,trim)


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
    for side in (12, 14):
        bicycle(b, pt(-2.78, side, crown(side)), yaw + math.pi / 2)


def elm(k,b,d,offset):
    i=k.road.index(d)
    x,y,z=k.road.at(i,offset)
    bark=lin(0x635B4A)
    b.tube((x,y,z-.4),.22,.14,4.2,bark,bark,6)
    leaves=k.B["elm-leaves"]
    if leaves.uvs is None:
        leaves.uvs=[]
    # Project the same leaf silhouette onto the brick so the mortar stays visible.
    if offset < 5:
        shade = k.B["elm-shade"]
        if shade.uvs is None:
            shade.uvs = []
        points = [k.P(i,u,v,.035) for u,v in ((-2.6,-.7),(2.6,-.7),(2.6,4.6),(-2.6,4.6))]
        shade.faces.append(tuple(shade.v(point) for point in points))
        shade.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
    for j in range(7):
        a=j*math.tau/3+.35
        radius=1.45 if j<6 else .2
        cx=x+radius*math.cos(a)
        cy=y+radius*math.sin(a)
        base=z+2.2+(j//3)*1.6
        width=k.rng.uniform(3.1,4.4)
        b.tube((cx,cy,base-.65),.10,.055,1.8,bark,bark,5)
        for angle in (a,a+math.pi/2):
            dx=width/2*math.cos(angle)
            dy=width/2*math.sin(angle)
            pts=((cx-dx,cy-dy,base),(cx+dx,cy+dy,base),(cx+dx,cy+dy,base+width),(cx-dx,cy-dy,base+width))
            leaves.faces.append(tuple(leaves.v(pos) for pos in pts))
            leaves.uvs.extend(((0,0),(1,0),(1,1),(0,1)))


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
    x,y,z=k.road.at(i,-4.05)
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
        canal_house(k,b,d,-8.5)
        canal_house(k,b,d,41.5)
    for d in range(FIRST_BRIDGE,int(k.length),BRIDGE_SPACING):
        bridge(k,b,d)
    for d in range(-35,int(k.length)+55,22):
        if abs((d-FIRST_BRIDGE+200)%400-200)>9:
            elm(k,b,d,4.7)
        if d%3:
            elm(k,b,d+7,37.3)
    for d in range(-19,int(k.length),61):
        if abs((d-FIRST_BRIDGE+200)%400-200)>16:
            houseboat(k,b,d,32.2 if d%2 else 8.4)
    for d in range(3,int(k.length),10):
        bollard(k,b,d)
    for d in range(6,int(k.length),36):
        i=k.road.index(d)
        iron = lin(0x49544C)
        yaw = k.s[i]["h"]
        for along in (-.35, 1.85):
            x,y,z = k.P(i,along,4.88)
            b.tube((x,y,z+.06),.04,.04,.72,iron,iron,6)
        x,y,z = k.P(i,.75,4.88)
        b.box((x,y,z+.76),(2.28,.075,.07),yaw,iron)
        for j in range(3):
            x,y,z=k.P(i,j*.75,4.8)
            bicycle(b,(x,y,z+.08),k.s[i]["h"]+.78)
    # Tall cast-iron lanterns and the open boats occupy the gaps between the trees.
    for d in range(16,int(k.length),58):
        i=k.road.index(d)
        x,y,z=k.road.at(i,4.77)
        iron=lin(0x4C5B51)
        b.tube((x,y,z),.14,.07,3.55,iron,iron,7)
        b.tube((x,y,z+3.55),.16,.27,.43,lin(0xC5BFA4),lin(0xEFE7BD),4)
        b.tube((x,y,z+3.98),.32,.05,.23,iron,iron,4,iron)
        if d%3==1:
            x,y,_=k.road.at(i,12.5)
            yaw=k.s[i]["h"]
            b.box((x,y,WATER-.14),(3.8,1.43,.44),yaw,lin(0x755247))
            for u in (-1.0,.4):
                a,c,_=k.P(i,u,12.5)
                b.box((a,c,WATER+.27),(.29,1.45,.11),yaw,lin(0xBDA07A))
    tour_boat(k)
    bicycle(Painted(k,"commuter"),(0,0,0),math.pi/2,True)
    return {"efforts":0}
