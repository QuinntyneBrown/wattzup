"""A three-lap Cornish fishing harbour, composed in slate, wet granite and pale sea."""
import math
from bisect import bisect_right

from worldkit import Painted, lin

LAP=2400
PROFILE=((0,34),(210,28),(570,5),(1260,5),(1450,11),(1730,37),(1970,45),(2180,41),(2400,34))
# The first few turns descend to the bay; a long quay runs east, then the lane climbs inland.
CORNERS=((-440,215),(-422,146),(-408,134),(-392,76),(-353,62),(-343,2),
         (-298,-37),(-180,-42),(-40,-64),(100,-49),(241,-38),(315,-15),
         (335,27),(298,51),(329,81),(300,116),(307,161),(259,196),
         (155,237),(50,243),(-41,278),(-133,288),(-254,250),(-345,265))
POINTS=[]
ARC=[0]
for n,b in enumerate(CORNERS):
    a=CORNERS[n-1];c=CORNERS[(n+1)%len(CORNERS)];e=CORNERS[(n+2)%len(CORNERS)]
    for j in range(45):
        t=j/45
        point=tuple(.5*((2*b[q])+(-a[q]+c[q])*t+(2*a[q]-5*b[q]+4*c[q]-e[q])*t*t+
                     (-a[q]+3*b[q]-3*c[q]+e[q])*t**3) for q in range(2))
        if POINTS:ARC.append(ARC[-1]+math.dist(POINTS[-1],point))
        POINTS.append(point)
ARC.append(ARC[-1]+math.dist(POINTS[-1],POINTS[0]));POINTS.append(POINTS[0])
SCALE=LAP/ARC[-1]


def elevation(d):
    t=d%LAP
    for (a,z),(b,end) in zip(PROFILE,PROFILE[1:]):
        if a<=t<=b:
            f=(t-a)/(b-a);return z+(end-z)*f*f*(3-2*f)
    return PROFILE[0][1]


def centre(d):
    distance=(d%LAP)/SCALE
    i=max(0,min(len(POINTS)-2,bisect_right(ARC,distance)-1))
    f=(distance-ARC[i])/(ARC[i+1]-ARC[i]);a,b=POINTS[i:i+2]
    return tuple((a[q]+(b[q]-a[q])*f)*SCALE for q in range(2))


def angle(d):
    a,b=centre(d-1),centre(d+1);return math.atan2(b[1]-a[1],b[0]-a[0])


def pose(d,left=0,up=0):
    x,y=centre(d);h=angle(d)
    return (x-math.sin(h)*left,y+math.cos(h)*left,elevation(d)+up)


def lay(course,theme,bc):
    st=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((bc.LEAD_IN+3*LAP+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        turn=(angle(d+.5)-angle(d-.5)+math.pi)%math.tau-math.pi
        rows.append(dict(x=x,y=y,z=z,h=angle(d),k=turn,g=100*(elevation(d+.5)-elevation(d-.5)),d=d))
    mean=sum((q['to']-q['from'])*q['level'] for q in st)/(3*LAP)
    return rows,st,3*LAP,mean,0


def road(road,st,length,col,bc):
    # All three laps use the same physical surface.
    b=bc.Builder('Wet slate lane','asphalt')
    for d in range(0,LAP,4):
        b.quad(pose(d,2.75),pose(d,-2.75),pose(d+4,-2.75),pose(d+4,2.75))
    b.build(col)


def ground(road,col,theme,bc):
    b=bc.Builder('Harbour hillside','terrain');b.colours=[]
    def face(points,tint):
        b.faces.append(tuple(b.v(p) for p in points));b.colours.extend([lin(tint)]*len(points))
    for d in range(0,LAP,4):
        quay=510<=d<1350
        for l,r,up,far,c in ((3.75,2.74,.04,-.015,0x999a8d),(21,3.75,.77,.04,0x788572),
                              (85,21,7,.77,0x687a61),(-2.74,-5.2,-.015,.045,0x898c84),
                              (-5.2,-7,.045,.02,0xa5a092),(-7,-15,-3.30,-3.68,0xc2b695),(-15,-23,-3.68,-5.12,0xa9a78c),
                              (-23,-110,-5.12,-5.9,0x80aaa1)):
            if not quay and l<=-7:up,far,c=-.27,-2,0x6b7a65
            def bank(station,side,height):
                # On the tight return above the shops the inside radius is shorter
                # than the full hillside. Stop the slope before it crosses the road below.
                if side==85:
                    neck=max(0,1-abs(station-1235)/145)
                    side-=53*neck
                    height-=4.25*neck
                return pose(station,side,height)
            face([bank(d,l,up),bank(d,r,far),bank(d+4,r,far),bank(d+4,l,up)],c)
        if quay:
            face([pose(d,-7,.03),pose(d,-7,-3.3),pose(d+4,-7,-3.3),pose(d+4,-7,.03)],0x64716b)
    # The bay and the hills are seen past the steep lanes.
    extent=2600
    face([(-extent,-extent,.29),(extent,-extent,.29),(extent,extent,.29),(-extent,extent,.29)],0x739a95)
    return b.build(col),lambda x,y:.29


THEME=dict(lay=lay,land_builder=ground,road_builder=road,road_half_width=2.75,
           terrain={'sea':False},land={'mid':0x758780},haze=0xbac5c6,wet=.42,
           sky=[0xd6d9cf,0xb9c6c8,0xa5b5c0,0x95a5b0,0x8496a4],
           light=[0xf5e5c3,2.1],fill=[0xc9d6df,0x9eaa96],sun_azimuth=2.7,sun_altitude=.44,
           palette={'asphalt':0x65696a})


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    def box(d,l,z,a,b,h,tint):
        art.box(pose(d,l,z),(a,b,h),angle(d),lin(tint))
    for d in range(0,LAP,2):
        for l in (-2.93,2.93):
            box(d,l,-.12,1.96,.35,.21,rng.choice((0x98998f,0x8c928b,0x95958c)))
    for d in range(510,1350,2):
        for row in range(4):
            s=d+(row%2)*.76
            box(s,-6.88,-3.2+row*.75,1.94,.36,.725,
                rng.choice((0x747970,0x82847a,0x87877a)) if row>1 else rng.choice((0x565f59,0x646b60)))
        box(d,-6.88,-.15,1.97,.65,.25,0xa0a093)
    # Keep the lighthouse fixed on the seaward end of the granite arm.
    for i in range(38):
        x,y,_=pose(1200,-7-i*2.8)
        art.box((x,y,.22),(5,4.1,3.3),angle(1200),lin(0x777b72))
        art.box((x,y,3.52),(5.17,4.15,.20),angle(1200),lin(0xa5a398))
    x,y,_=pose(1200,-109)
    for z,r1,r2,h,c in ((3.7,2.25,1.18,9.7,0xe6e4d5),(13.4,1.52,1.55,.45,0x46504d),
                          (13.85,.99,.99,1.65,0xa7c4c0),(15.5,1.38,.17,.97,0x4f5c58)):
        art.tube((x,y,z),r1,r2,h,lin(c),lin(c),16,lin(c))
    village(art, rng)
    return {'efforts':0}


GLYPHS = {
    'A':('010','101','111','101','101'), 'B':('110','101','110','101','110'),
    'C':('011','100','100','100','011'), 'E':('111','100','110','100','111'),
    'F':('111','100','110','100','100'), 'H':('101','101','111','101','101'),
    'I':('111','010','010','010','111'), 'K':('101','110','100','110','101'),
    'P':('110','101','110','100','100'), 'R':('110','101','110','101','101'),
    'S':('011','100','010','001','110'), 'T':('111','010','010','010','010'),
    'Y':('101','101','010','010','010'), ' ':('000',)*5,
}


def village(art, rng):
    """Small terraces at the turns frame long quiet stretches of open bay."""
    slate=(0x4a5459,0x576266,0x51575b)
    wash=(0xe7e3d5,0xd6dad2,0xe7d5b7,0xe7e6da,0xceadaa,0xc2cfc7)
    doors=(0x476c79,0x567167,0x895c51,0x51616b)

    def cottage(d,l,base,w,depth,h,shop=None):
        x,y,z=pose(d,l,base)
        yaw=angle(d)+(math.pi if l<0 else 0)
        along=(math.cos(yaw),math.sin(yaw)); left=(-along[1],along[0])
        def point(u,v,up):
            return x+u*along[0]+v*left[0],y+u*along[1]+v*left[1],z+up
        def block(u,v,up,width,deep,height,tint):
            art.box(point(u,v,up),(width,deep,height),yaw,lin(tint))
        front=-depth/2
        block(0,0,-1.25,w,depth,h+1.25,rng.choice(wash))
        art.roof(point(0,0,h),w,depth,depth*.35,yaw,lin(rng.choice(slate)))
        block(-w*.3,0,h+.4,.77,.66,depth*.34+.67,0xa7a59a)
        for u in (-w*.3-.19,-w*.3+.19):
            art.tube(point(u,0,h+depth*.34+1.07),.12,.135,.41,lin(0x976d57),lin(0xb38a70),8)
        colour=rng.choice(doors)
        def front_panel(u,up,width,height,tint,proud):
            art.panel(point(0,front,0),along,(-left[0],-left[1]),u-width/2,u+width/2,z+up,z+up+height,proud,lin(tint))
        def window(u,up,width,height):
            front_panel(u,up,width+.18,height+.18,0xe4e0d3,.035)
            front_panel(u,up+.09,width,height,0x526778,.055)
            front_panel(u,up+.08,.055,height,0xd6d8d2,.072)
            front_panel(u,up+height*.54,width,.06,0xd6d8d2,.072)
            block(u,front-.11,up-.06,width+.35,.24,.1,0x959b96)
        for u in (-w*.29,w*.29):
            window(u,h-1.95,1.03,1.32)
        if shop:
            front_panel(0,-.05,w-.18,3.16,colour,.08)
            for u in (-w*.285,w*.285):
                front_panel(u,.43,w*.29,1.62,0x8aadae,.102)
                front_panel(u,.51,.09,1.54,0xe5dfc9,.13)
            front_panel(0,2.18,w-.32,.76,0x374c50,.11)
            scale=min(.106,(w-.72)/(len(shop)*4))
            for i,char in enumerate(shop):
                for row,bits in enumerate(GLYPHS[char]):
                    for col,bit in enumerate(bits):
                        if bit=='1':
                            front_panel((i*4+col-len(shop)*2+1)*scale,2.29+(4-row)*scale,scale*1.01,scale*1.01,0xf7e9c9,.14)
            block(w*.32,front-1.03,.0,.64,.12,.91,0x42484a)
            for row in range(3):
                block(w*.32,front-1.11,.31+row*.16,.37-.045*row,.02,.024,0xeee3c5)
        else:
            window(w*.24,.62,1.22,1.34)
        front_panel(-.13*w if not shop else 0,-.02,1.01,2.03,colour if not shop else 0x473e37,.15)
        block(-.13*w if not shop else 0,front-.28,-.08,1.26,.58,.15,0x93968e)
        # Sash windows in the gable end are visible coming around the bend.
        for end in (-1,1):
            corner=point(end*w/2,0,0)
            for up in (.73,h-1.94):
                for proud,width,tint in ((.025,1.05,0xd6d5cb),(.041,.87,0x657781)):
                    art.panel(corner,left,(along[0]*end,along[1]*end),-width/2,width/2,z+up,z+up+1.16,proud,lin(tint))

    for start,count,side in ((12,20,1),(75,8,-1),(320,8,1),(575,7,1),
                             (818,9,1),(1004,18,1),(1350,8,1),(1644,16,1),(1710,6,-1),(1970,7,1)):
        for i in range(count):
            d=start+8.5*i
            shop={9:'PASTY',10:'CAFE',11:'FISH',12:'BAKERY',13:'ICE'}.get(i) if start==1004 else None
            cottage(d,side*(8.15+.55*math.sin(i)),.14,7.6,5.7,rng.uniform(4.8,5.65),shop)
            if side>0 and i%2==0:
                cottage(d+3,23+i%3,1.41,7.8,6.7,rng.uniform(5.9,7))
    # Iron ladders, mooring bollards, slatted lobster pots and wet strands on the exposed beach.
    for d in range(524,1340,27):
        def block(l,up,a,b,h,col,shift=0):
            art.box(pose(d+shift,l,up),(a,b,h),angle(d),lin(col))
        for up,r,h in ((0,.15,.47),(.47,.22,.09)):
            art.tube(pose(d,-6.41,up),r,r,h,lin(0x363c38),lin(0x55574d),8,lin(0x55574d))
        if d%3==2:
            for shift in (-.29,.29):
                block(-7.18,-3.22,.07,.07,3.51,0x514f45,shift)
            for j in range(9):block(-7.2,-2.93+j*.37,.66,.07,.06,0x66685a)
        if d%4==0:
            for k in range(3):
                location=-5.7+.33*k
                block(location,.04,.85,.53,.38,0x886f47,k*.72)
                for rib in range(6):
                    block(location,.057,.033,.55,.39,0x4b5142,k*.72-.36+rib*.14)
        for j in range(4):
            block(-12-j*4.2,-3.48-j*.08,.79+j*.23,.27,.07,0x6e7053,j*1.19)

    # Lay the worn double yellows directly against the granite. Leave resurfaced sections unpainted.
    for d in range(0,LAP,2):
        if not (42<d<200 or 533<d<709 or 977<d<1188 or 1625<d<1790):continue
        for l in (-2.52,-2.36):
            if (d+int(l*30))%97 in (3,4,5):continue
            points=(pose(d,l,.026),pose(d,l-.075,.026),pose(d+2,l-.075,.026),pose(d+2,l,.026))
            art.face(points,(lin(0xc8ad68),)*4)
    # Small local cars parked beside the road, with glazing, lamps and visible tyres.
    for d,l,colour in ((108,-3.91,0x667776),(601,4.35,0x9a6154),(1056,4.38,0x536471),(1717,-4.1,0x968f75)):
        def car(u,v,z,a,b,h,c):
            art.box(pose(d+u,l+v,z),(a,b,h),angle(d),lin(c))
        car(0,0,.29,3.84,1.51,.68,colour)
        car(-.11,0,.96,2.11,1.34,.71,0x58696d)
        car(-.16,0,1.63,1.86,1.34,.11,colour)
        for side in (-1,1):
            car(-.05,side*.675,.94,.1,.05,.71,colour)
            for u in (-1.11,1.07):car(u,side*.72,.09,.55,.15,.47,0x383d3b)
            car(1.92,side*.48,.63,.035,.29,.18,0xdedbc6)
            car(-1.92,side*.53,.66,.035,.25,.18,0x995143)
    # Two spaniels beside their owners, with a low body, drooping ears and raised tail.
    for d,l in ((641,-5.15),(1126,-5.2)):
        for u,v,z,a,b,h,c in ((0,0,.27,.68,.24,.28,0x956344),(.29,0,.47,.24,.24,.25,0x966640),
                              (.46,0,.48,.19,.16,.1,0x72513d),(-.37,0,.47,.23,.09,.09,0x966343),
                              (.23,.14,.4,.13,.05,.2,0x754d35),(.23,-.14,.4,.13,.05,.2,0x754d35)):
            art.box(pose(d+u,l+v,z),(a,b,h),angle(d),lin(c))
        for u in (-.23,.22):
            for v in (-.09,.09):art.box(pose(d+u,l+v,.035),(.1,.08,.28),angle(d),lin(0x79563f))
    # Low folded headlands and a broken line of glints sitting on the open sea.
    for cx,cy,width,length,top in ((-860,-260,290,290,44),(830,-260,380,330,51),(1070,-520,390,340,66)):
        crown=[];foot=[]
        for i in range(19):
            t=i*math.tau/19
            crown.append((cx+width*math.cos(t),cy+length*math.sin(t),top*(.63+.18*math.sin(3*t)+.13*math.cos(5*t))))
            foot.append((cx+width*1.075*math.cos(t),cy+length*1.075*math.sin(t),.25))
        for i in range(19):
            j=(i+1)%19
            art.face((foot[i],foot[j],crown[j],crown[i]),(lin(0x64706e),lin(0x667672),lin(0x91958a),lin(0x818579)))
            art.face((crown[i],crown[j],(cx,cy,top+8)),(lin(0x788668),lin(0x788967),lin(0x7f916d)))
    for i in range(580):
        d=rng.uniform(540,1330);x,y,_=pose(d,-rng.uniform(87,420));w=rng.uniform(.7,7)
        art.face(((x-w,y,.32),(x+w,y-.21,.32),(x+w*.36,y+.18,.32)),(lin(rng.choice((0x8db1a9,0x9cbcb0,0xa3c0b9))),)*3)
