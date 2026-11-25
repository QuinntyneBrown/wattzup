"""Five laps of the two-bridge Wabash and State Street criterium."""
import math
from worldkit import Painted, lin
from mathutils import Vector

LAP = 1750
LENGTH = LAP * 5
RADIUS = 14
SHORT = 225
LONG = (LAP - 2 * SHORT - math.tau * RADIUS) / 2
WIDTH = SHORT + 2 * RADIUS
RIVER = 525
ORIGIN = 65
GRADE = [(0,2),(385,2),(450,4.1),(493,4.1),(550,2),(810,2),(867,4.1),(906,4.1),(966,2),(1750,2)]


def pose(d, lateral=0):
    t=(d+ORIGIN)%LAP
    x=y=h=0.
    for straight in (LONG,SHORT,LONG,SHORT):
        cs,sn=math.cos(h),math.sin(h)
        travelled=min(t,straight)
        x+=travelled*cs
        y+=travelled*sn
        t-=travelled
        if t<=1e-9:
            break
        angle=min(t/RADIUS,math.pi/2)
        x+=RADIUS*(sn-math.sin(h-angle))
        y+=RADIUS*(math.cos(h-angle)-cs)
        h-=angle
        t-=angle*RADIUS
        if t<=1e-9:
            break
    return x-lateral*math.sin(h),y+lateral*math.cos(h),h


def height(d):
    d%=LAP
    for (a,z),(b,end) in zip(GRADE,GRADE[1:]):
        if d<=b:
            return z+(end-z)*(d-a)/(b-a)


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    assert abs(stages[-1]['to']-LENGTH)<.01
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        x,y,h=pose(d)
        turn=pose(d+.5)[2]-pose(d-.5)[2]
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=math.atan2(math.sin(turn),math.cos(turn)),
                         g=100*(height(d+.5)-height(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows,stages,LENGTH,mean,0


def land(road,col,theme,bc):
    ground=bc.Builder('River and Loop street grid','terrain')
    ground.colours=[]
    def slab(x1,x2,y1,y2,z,c):
        ground.quad((x1,y1,z),(x2,y1,z),(x2,y2,z),(x1,y2,z))
        ground.colours.extend((lin(c),)*4)
    for a,b,z,tint in [(-900,RIVER-25,1.78,0x827E77),(RIVER-25,RIVER+25,-3,0x547E78),
                       (RIVER+25,LONG+900,1.78,0x827E77)]:
        slab(a,b,-1200,1000,z,tint)
    return ground.build(col),lambda x,y:1.78


def roadway(road,st,length,col,bc):
    surface=bc.Builder('Road','asphalt')
    def edge(d,l):
        return (*pose(d,l)[:2],height(d))
    for d in range(0,LAP,3):
        e=min(d+3,LAP)
        surface.quad(edge(d,-6.65),edge(e,-6.65),edge(e,6.65),edge(d,6.65))
    surface.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':6.65,
       'terrain':{'sea':False},'land':{'mid':0x777770},
       'sky':[0xDDDFDF,0xC7DBE2,0xA9CFDF,0x90BED8,0x70A2C3],'haze':0xCBD1CA,
       'light':[0xFFE8C6,2.7],'fill':[0xCFDEE6,0xA19B8D],
       'sun_azimuth':-.85,'sun_altitude':.72,'palette':{'asphalt':0x737271},'chunks':{'Land':5}}


def beam(art,start,end,radius,tint):
    a,b=Vector(start),Vector(end)
    axis=(b-a).normalized()
    normal=axis.cross(Vector((0,0,1)))
    if normal.length<.001:
        normal=Vector((1,0,0))
    normal.normalize()
    cross=axis.cross(normal)
    corners=[radius*(normal*u+cross*v) for u,v in ((-1,-1),(1,-1),(1,1),(-1,1))]
    for j,c in enumerate(corners):
        q=corners[(j+1)%4]
        art.face([a+c,a+q,b+q,b+c],(lin(tint),)*4)


def scenery(k):
    art=Painted(k)
    skyline=Painted(k,'peaks')
    rng=k.rng
    def box(x,y,z,sx,sy,sz,tint,yaw=0,group=art):
        group.box((x,y,z),(sx,sy,sz),yaw,lin(tint))
    green=0x536258
    edge=0x788077
    dark=0x434944
    rust=0x9C7356
    # Built-up flanges enclose a recessed web. Flared knee braces carry the two-track deck.
    for x in range(-55,491,18):
        for y in (-7.45,7.45):
            box(x,y,1.8,1.1,1.2,.39,0x978E80)
            for offset in (-.25,.25):
                box(x+offset,y,2.18,.14,.67,5.42,green)
            box(x,y,2.18,.49,.15,5.42,dark)
            box(x,y,2.75,.74,.82,.19,edge)
            for s in (-1,1):
                beam(art,(x,y,6.1),(x+s*2.1,y,8.24),.115,edge)
                beam(art,(x,y,6.35),(x,y-s*1.8,8.18),.105,green)
            for z in (3.05,4.55,6.8):
                box(x+.34,y-.20,z,.08,.11,.12,rust)
        box(x,0,7.74,.41,16.4,.8,green)
        box(x,0,7.69,.67,16.5,.12,edge)
        for y in (-6.28,-2.9,2.9,6.28):
            box(x+9,y,8.17,18.05,.16,.97,dark)
            box(x+9,y,8.11,18.05,.44,.13,green)
            box(x+9,y,9.14,18.05,.48,.14,edge)
        for j in range(12):
            box(x+j*1.5,0,9.26,.28,13.1,.17,0x746656)
        for y in (-5.0,-3.56,3.56,5.0):
            box(x+9,y,9.43,18.05,.10,.13,0xB5AEA1)
        for y in (-6.95,6.95):
            box(x+9,y,10.24,18,.06,.08,edge)
            for j in (0,6,12):
                box(x+j,y,9.3,.085,.08,.99,green)
    # Wabash station canopy, platform and street stair.
    for y in (-9,9):
        box(230,y,9.18,72,5,.52,0x8A8377)
        box(230,y,13.26,75,5.9,.34,green)
        for x in range(196,266,9):
            box(x,y,9.68,.23,.22,3.57,green)
    for j in range(39):
        box(166+j*.63,11.1,1.88+j*.188,.68,2.05,.19,0xAAA69D)
    for y in (9.98,12.22):
        beam(art,(165,y,2.9),(191,y,10.64),.055,green)
        beam(art,(165,y,2),(191,y,9.7),.095,dark)
    for y in (0,-WIDTH):
        # Closed bascule leaves carry the rider; the nearby superstructure shows the river through its bracing.
        for side in (-1,1):
            lane=y+side*7.1
            box(RIVER,lane,3.75,57,.47,.62,0x604F45)
            box(RIVER,lane,6.2,54,.35,.32,0x934E42)
            for j in range(9):
                x=RIVER-27+j*6
                beam(art,(x,lane,4.20),(x+3,lane,6.24),.13,0x9F6050)
                beam(art,(x+3,lane,6.24),(x+6,lane,4.20),.13,0x805343)
            for x in (RIVER-27,RIVER+27):
                box(x,lane,-2.8,3,2.5,7,0xA19986)
        for j in range(90):
            box(RIVER-24+j*.54,y,4.115,.078,13,.022,0x585954)
        for l in range(-6,7):
            box(RIVER,y+l,4.135,49,.052,.015,0x99988C)
    # Setbacks and regular window bays distinguish Chicago School masonry from modern curtain walls.
    for street in (0,-WIDTH):
        for side in (-1,1):
            for kx in range(-130,771,34):
                if abs(kx-RIVER)<47 or abs(kx-LONG)<42 or abs(kx)<29: continue
                x=kx+rng.uniform(-2,2);y=street+side*33
                floors=rng.choice((6,8,10,14,17))
                tone=rng.choice((0x9E8774,0x918579,0x898580,0xA79E8C,0xB5A38D))
                glass=rng.choice((0x667C86,0x596976,0x61727B))
                box(x,y,1.8,31,35,floors*3.55,tone)
                front=y-side*17.56
                for level in range(floors):
                    z=2.63+level*3.55
                    for bay in range(5):
                        box(x+(bay-2)*5.75,front,z,4.65,.16,2.47,glass)
                    if level%4==0 or level==floors-1:
                        box(x,front,z+2.55,31.6,.65,.37,0xAB9F8D)
                for j in (-1,0,1):
                    box(x+j*8,front-side*.7,5.24,7.7,1.6,.33,0x726C61)
    # Tall towers terminate the side streets. The Willis tower's bundled tubes end at three heights.
    for u in range(3):
        for v in range(3):
            h=[132,158,126,148,191,160,123,180,145][u*3+v]
            box(-195+u*12,-155+v*12,2,12.1,12.1,h,0x52616B,group=skyline)
    for x in (-184,-172):
        skyline.tube((x,-143,172),.6,.17,46,lin(edge),lin(0xC4C1AA),8)
    for offset in (0,43):
        x,y=LONG+8+(offset-20)*.92,-WIDTH-87-offset*.4
        skyline.tube((x,y,1.8),12.7,12.7,78,lin(0x625E58),lin(0x857E70),32)
        for f in range(24):
            for j in range(12):
                t=j*math.tau/12
                skyline.tube((x+12*math.cos(t),y+12*math.sin(t),4.2+f*3.02),
                             3.2,3.1,.52,lin(0x938A75),lin(0xC3B8A1),8,lin(0xB0A691))
    # Steel rails, placards and weighted feet line the outside of the tighter corners.
    for d in range(0,LAP,6):
        x,y,h=pose(d,7.5)
        z=height(d)
        box(x,y,z+.87,5.55,.12,.085,0x9DA3A0,h)
        box(x,y,z+.26,5.45,.10,.08,0x797F7D,h)
        for off in (-2.5,2.5):
            box(x+off*math.cos(h),y+off*math.sin(h),z,.085,.12,.91,0x9CA19F,h)
        if d%18==0:
            box(x,y,z+.32,4.86,.13,.51,rng.choice((0x456B79,0xC7B99F,0xB5684E)),h)
    # A projecting blade faces the oncoming return leg. The marquee carries actual relief lettering.
    x,y,h=pose(1225,-10.4)
    box(x,y,2.0,1.55,4,22.5,0x80362C)
    box(x+.82,y,5.3,.12,3.5,17.85,0xA6402C)
    glyphs={
        'C':('111','100','100','100','111'),'H':('101','101','111','101','101'),
        'I':('111','010','010','010','111'),'A':('010','101','111','101','101'),
        'G':('111','100','101','101','111'),'O':('111','101','101','101','111')}
    for j,letter in enumerate('CHICAGO'):
        top=22.45-j*2.36
        for row,line in enumerate(glyphs[letter]):
            for col,pixel in enumerate(line):
                if pixel=='1':
                    box(x+.91,y+(col-1)*.54,top-row*.36,.12,.50,.32,0xF8D990)
    box(x,y,5.3,7.5,8,.85,0xA54536)
    box(x,y,5.64,7.59,8.09,.36,0xECD7AD)
    for j in range(19):
        box(x+3.82,y+(j-9)*.39,5.40,.09,.11,.10,0xFEE5A5)
    # Crosswalk bars follow the local lane. At Wabash the elevated track throws alternating stripes.
    for d in (117,323,521,811,1009,1240,1438,1598):
        for j in range(13):
            x,y,h=pose(d,(j-6)*.96)
            box(x,y,height(d)+.015,3.4,.48,.019,0xD0CCBD,h)
    for d in range(0,415,3):
        x,y,h=pose(d)
        box(x,y,height(d)+.008,.55,13.15,.009,0x655F59,h+.07)
    for d in (107,326,972,1160,1325,1530):
        x,y,h=pose(d,-2.5)
        art.tube((x,y,height(d)+.019),.49,.49,.027,lin(0x5A5954),lin(0x6A6964),24,lin(0x64635D))
        for j in range(-2,3):
            box(x+j*.13,y,height(d)+.05,.032,.55,.012,0x494A46)
    for d in (135,335,505,700,954,1148,1339,1550):
        x,y,h=pose(d,-8.2);z=height(d)
        box(x,y,z,.2,.2,5.1,0x6D7369)
        for j in range(3):
            box(x,y,z+3.7+j*.35,.36,.45,.34,0x4B4C43,h)
            box(x-.21*math.cos(h),y-.21*math.sin(h),z+3.74+j*.35,.055,.26,.22,
                (0x88AB79,0x83704C,0x9C5C50)[j],h)
        nx,ny,_=pose(d+5,-8.9)
        box(nx,ny,z,.64,.59,1.08,0x557785,h)
        box(nx,ny,z+.7,.66,.6,.32,0xA4B3AB,h)
    for d in (88,160,290,987,1205,1421):
        x,y,h=pose(d,-9.65);z=height(d)
        box(x,y,z+.30,4.3,1.75,.77,0xDCA33E,h)
        box(x,y,z+1.07,2.54,1.48,.62,0x626E70,h)
        box(x,y,z+1.69,2.34,1.49,.12,0xE1AD51,h)
        box(x,y,z+1.82,.58,.43,.22,0xF4D497,h)
        for u in (-1.25,1.25):
            for v in (-.90,.90):
                px=x+u*math.cos(h)-v*math.sin(h);py=y+u*math.sin(h)+v*math.cos(h)
                box(px,py,z+.08,.58,.17,.51,0x414342,h)
    # Side streets close the blocks. Shop glazing and recessed entries are visible around the turn.
    for street_x in (-14,LONG+14):
        for side in (-1,1):
            for n in range(6):
                y=-38-n*35
                x=street_x+side*28
                floors=rng.choice((6,8,10,13))
                wall=rng.choice((0xA3927C,0xB2A28B,0x8E8175,0x878886))
                box(x,y,1.75,25,32,floors*3.55,wall)
                front=x-side*12.57
                for floor in range(floors):
                    for bay in range(5):
                        box(front,y+(bay-2)*5.75,2.85+floor*3.55,.2,4.72,2.35,0x667984)
                    box(front,y,5.31+floor*3.55,.36,32,.21,0xAA9E8D)
                box(front-side*.75,y,5.41,1.58,28,.34,0x675F58)
                for bay in range(5):
                    box(front-side*.12,y+(bay-2)*5.75,2.04,.27,4.65,2.8,0x566C72)
    # A visible bank of towers ends the northern cross street, beyond the physical turning kerb.
    for j in range(13):
        x=LONG-150+j*28; y=-WIDTH-128-(j%3)*12
        if abs(x-LONG)<50:continue
        floors=rng.randrange(12,30); w=19+rng.random()*9
        box(x,y,1.78,w,28,floors*3.3,0x798890,group=skyline)
        for ff in range(1,floors):
            box(x,y+14.1,2+ff*3.3,w,.3,.45,0xA9AC9F,group=skyline)
    # Walkways and kerb joints give the short streets and bridge approaches a continuous edge.
    for d in range(0,LAP,3):
        z=height(d)
        x,y,h=pose(d)
        if abs(x-RIVER)<28:continue
        for side in (-1,1):
            sx,sy,_=pose(d,side*9.48)
            box(sx,sy,z-.085,3.03,5.68,.12,0xB4AD9D if d%15 else 0xABA499,h)
            sx,sy,_=pose(d,side*6.72)
            box(sx,sy,z-.02,2.95,.25,.16,0xCDC3AE,h)
    # Shoreside bridgehouses, lattice above the deck and the counterweight housings.
    for street in (0,-WIDTH):
        for side in (-1,1):
            y=street+side*7.0
            for j in range(10):
                x=RIVER-26+j*5.8
                box(x,y,4.18,.23,.45,3.32,0x825147)
                beam(art,(x,y,7.48),(x+5.8,y,4.25),.14,0x9A6353)
            box(RIVER,y,7.49,57,.49,.33,0x96604E)
            box(RIVER+27,street+side*12,1.8,5,5,6.4,0xB5A68A)
            box(RIVER+27,street+side*12,6.6,5.2,5.2,1.5,0x61767A)
            art.roof((RIVER+27,street+side*12,8.1),6,6,1.5,0,lin(0x788072))
    # The crossing track gives riders a side view of the passing train just beyond the station.
    for y in range(-108,125,12):
        for offset in (-2,2):
            box(360+offset,y,14.25,.28,12.15,.77,green)
        box(360,y,15.1,5.4,12.05,.24,0x807363)
        for offset in (-.76,.76):
            box(360+offset,y,15.35,.12,12,.1,0xA9A799)
        if abs(y)>10 and y%24==0:
            box(360,y,1.8,.52,.54,12.4,green)
    return {'efforts':0}
