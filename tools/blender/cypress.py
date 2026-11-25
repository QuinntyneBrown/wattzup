"""Cypress Bowl Road climbs east and west across a south-facing North Shore slope."""
import math
from bisect import bisect_right

from worldkit import Painted, lin, smooth

LENGTH = 18125
START = -180
PATH = []
# Each turnout follows a long diagonal traverse. The mountainside lies north, the sound south.
TURNS = ((2470, 320, 1), (5070, 330, -1), (8040, 310, 1),
         (11140, 340, -1), (13910, 315, 1), (16140, 355, -1))
PROFILE = ((0,135),(2670,260),(5650,437),(9320,623),(14540,818),(18125,932))


def heading(d):
    h=.16
    for start,width,direction in TURNS:
        h+=direction*(math.pi-.32)*smooth(start,start+width,d)
    # Ease the lookout approaches towards the basin so a rider can see into it.
    lookout=-.69*math.exp(-((d-5680)/210)**2)+.67*math.exp(-((d-9370)/250)**2)
    return h+.085*math.sin(d/490)+.035*math.sin(d/176)+lookout


def pose(d,left=0,up=0):
    idx=max(0,min(d-START,len(PATH)-1.001))
    i=int(idx);f=idx-i
    a,b=PATH[i:i+2]
    h=heading(d)
    return (a[0]+f*(b[0]-a[0])-left*math.sin(h),
            a[1]+f*(b[1]-a[1])+left*math.cos(h),
            a[2]+f*(b[2]-a[2])+up)


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);ends=[s['to'] for s in stages]
    PATH.clear();x,y,z=0,0,0
    for d in range(START,LENGTH+360):
        PATH.append((x,y,z))
        h=heading(d+.5)
        x+=math.cos(h);y+=math.sin(h)
        stage=stages[min(len(stages)-1,bisect_right(ends,d))]
        bench=max(math.exp(-((d-5650)/125)**4),math.exp(-((d-9320)/135)**4))
        z+=(.022+.0021*stage['level']+.006*math.sin(d/230))*(1-.95*bench)
    initial=PATH[-START][2];scale=797/(PATH[LENGTH-START][2]-initial)
    PATH[:]=[(x,y,135+(z-initial)*scale) for x,y,z in PATH]
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        rows.append(dict(x=x,y=y,z=z,d=d,h=heading(d),k=heading(d+.5)-heading(d-.5),
                         g=100*(pose(d+.5)[2]-pose(d-.5)[2])))
    return rows,stages,LENGTH,sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH,0


def road(rows,stages,length,col,bc):
    b=bc.Builder('Cypress Bowl Road','asphalt')
    paint=bc.Builder('Centre line and shoulders','terrain');paint.colours=[]
    def stripe(d,end,l,r,tint):
        vs=(pose(d,l,.021),pose(d,r,.021),pose(end,r,.021),pose(end,l,.021))
        paint.faces.append(tuple(paint.v(p) for p in vs));paint.colours.extend([lin(tint)]*4)
    for d in range(-80,LENGTH+150,6):
        b.quad(pose(d,5.7),pose(d,-5.7),pose(d+6,-5.7),pose(d+6,5.7))
        for l in (-4.48,4.58):stripe(d,d+6,l,l-.11,0xd9dace)
        for l in (-.045,.16):stripe(d,d+6,l,l-.09,0xc9aa66)
    b.build(col);paint.build(col)


def ground(rows,col,theme,bc):
    b=bc.Builder('North Shore slope and ocean','terrain');b.colours=[]
    def face(vs,colours):
        b.faces.append(tuple(b.v(p) for p in vs));b.colours.extend(lin(c) for c in colours)
    def slope(d,l):
        # The carriageway is cut level across the flank. Its south side falls into the basin.
        span=max(0,abs(l)-6)
        return -.12+span*(.14 if l*math.cos(heading(d))>0 else -.27)+.13*math.sin(d/15)*min(1,span/9)
    for d in range(-80,LENGTH+140,10):
        for sign in (-1,1):
            for a,c,tint in ((5.65,7.3,0x878679),(7.3,12,0x737866),(12,29,0x66755e),(29,87,0x566a58),(87,180,0x526951)):
                vs=[pose(t,s,slope(t,s)) for t,s in ((d,sign*a),(d,sign*c),(d+10,sign*c),(d+10,sign*a))]
                face(vs[::-1] if sign>0 else vs,[tint]*4)
    # Basin below the road. Water and wooded headlands share a stable world-space horizon.
    face([(-24000,-26000,0),(24000,-26000,0),(24000,20000,0),(-24000,20000,0)],[0x809da6]*4)
    return b.build(col),lambda x,y:0


THEME=dict(lay=lay,land_builder=ground,road_builder=road,terrain={'sea':False},land={'mid':0x566a59},
           haze=0xa7b3b4,wet=.46,sky=[0xe3e0cc,0xbecaca,0xabbcc5,0x8da3b3,0x8098ae],
           light=[0xffe5c1,2.28],fill=[0xc3d2d6,0x7a876e],sun_azimuth=3.8,sun_altitude=.49,
           palette={'asphalt':0x52585a})


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    for start,width,_ in TURNS:
        for d in range(start-55,start+width+50,4):
            sign=-1 if math.cos(heading(d))>=0 else 1
            p=pose(d,sign*6.04,-.1)
            art.box(p,(3.94,.63,.43),heading(d),lin(0xa09d90))
            art.box((p[0],p[1],p[2]+.43),(3.94,.37,.48),heading(d),lin(0xafafa1))
        for d in range(start+22,start+width,49):
            l=(-1 if math.cos(heading(d))>=0 else 1)*7.18
            x,y,z=pose(d,l,-.25)
            art.box((x,y,z),(.1,.13,2.55),heading(d),lin(0x7b7970))
            yaw=heading(d)
            art.box((x,y,z+1.76),(.13,.84,.83),yaw,lin(0xe2b34e))
            def chevron(u,h):
                return x-.078*math.cos(yaw)-u*math.sin(yaw),y-.078*math.sin(yaw)+u*math.cos(yaw),z+h
            for direction in (-1,1):
                pts=tuple(chevron(u,h) for u,h in ((-.29,1.83),(-.06,1.83),(.29,2.18),(-.06,2.51),(-.29,2.51),(.05,2.18)))
                art.face(pts if direction>0 else pts[::-1],(lin(0x343930),)*6)
    panorama(kit)
    ski_area(art)
    return {'efforts':0}


def panorama(kit):
    """Fixed shores and North Shore peaks placed in the basin and on the inland ridge."""
    art=Painted(kit,'peaks');rng=kit.rng
    def ridge(cx,cy,w,h,base,height,seed,near,far):
        layers=[]
        for k,scale in enumerate((1,.81,.54,.29)):
            ring=[]
            for i in range(44):
                a=i*math.tau/44
                rough=1+.095*math.sin(3*a+seed)+.067*math.sin(7*a+seed)
                z=base+height*(k/4+.07*math.sin(a*4+seed+k*.42)*min(1,k))
                ring.append((cx+scale*w*math.cos(a)*rough,cy+scale*h*math.sin(a)*rough,z))
            layers.append(ring)
        for k,(a,b) in enumerate(zip(layers,layers[1:])):
            for i in range(44):
                j=(i+1)%44
                tone=lin(near if math.cos(i*math.tau/44+.5)>.13 else far)
                art.face((a[i],a[j],b[j],b[i]),(tone,)*4)
        summit=(cx+w*.04,cy-h*.08,base+height)
        for i in range(44):
            colour=lin(near if i%11<6 else far)
            art.face((layers[-1][i],layers[-1][(i+1)%44],summit),(colour,)*3)
    # A continuous sea surface under the outer shoreline, kept with the distant geometry.
    art.face(((-17000,-15500,-1),(17000,-15500,-1),(17000,8500,-1),(-17000,8500,-1)),(lin(0x7399aa),)*4)
    # Ocean, Stanley Park and the opposite shore, seen from Highview and the lower traverse.
    ridge(2080,-2000,620,360,1,68,1.4,0x425c53,0x50685d)
    ridge(3180,-3560,1580,620,-12,43,3.3,0x80908b,0x839995)
    for i in range(120):
        x=2440+(i%16)*65+rng.uniform(-21,21);y=-2930-(i//16)*66+rng.uniform(-24,24)
        w=rng.uniform(27,51);h=rng.uniform(60,166)*(1.35 if i%7==0 else 1)
        colour=rng.choice((0x829b9c,0x73959b,0xb3b4aa,0x8aa9a7,0xb4b7b3))
        art.box((x,y,4),(w,w*.82,h),.06,lin(colour))
        if i%4==0:art.box((x,y,4+h),(w*.72,w*.6,h*.1),.06,lin(colour))
        for floor in range(16,int(h),18):
            art.box((x,y,4+floor),(w*1.015,w*.84,2),.06,lin(0x70888e))
    # Lions Gate's twin green suspension towers, main cables, hanging rods and narrow deck.
    xx,yy=2220,-1370
    def girder(a,b,r,tint):
        dx,dy,dz=(b[i]-a[i] for i in range(3));h=math.hypot(dx,dy)
        length=math.hypot(h,dz)
        if length<.01:return
        u=(-dy/h,dx/h,0) if h>.001 else (1,0,0)
        v=(-dz*u[1]/length,dz*u[0]/length,(dx*u[1]-dy*u[0])/length)
        def ring(p):return [tuple(p[i]+r*(u[i]*q+v[i]*t) for i in range(3)) for q,t in ((1,1),(-1,1),(-1,-1),(1,-1))]
        a,b=ring(a),ring(b);col=lin(tint)
        for i in range(4):art.face((a[i],a[(i+1)%4],b[(i+1)%4],b[i]),(col,)*4)
    art.box((xx,yy,32),(690,16,6),0,lin(0x56736d))
    for tx in (-156,156):
        for side in (-12,12):girder((xx+tx,yy+side,0),(xx+tx,yy+side,106),3.5,0x436c61)
        for z in (31,71,94):girder((xx+tx,yy-12,z),(xx+tx,yy+12,z),2,0x496c62)
    for side in (-12,12):
        def cable(x):
            return 50+52*(abs(x)/156)**2 if abs(x)<156 else 102-(abs(x)-156)*.34
        for dx in range(-336,336,12):
            girder((xx+dx,yy+side,cable(dx)),(xx+dx+12,yy+side,cable(dx+12)),1.27,0x506f68)
            if dx%24==0:girder((xx+dx,yy+side,37),(xx+dx,yy+side,cable(dx)),.69,0x647c73)
    for i,(x,y,w,h,z) in enumerate(((-1700,-320,790,260,330),(-3140,-480,1000,360,530),
                                      (-5080,-700,1500,620,670),(-7300,-1600,2300,780,890),
                                      (4900,-4650,3000,980,530),(-4900,-5200,3200,1200,780))):
        ridge(x,y,w,h,0,z,i*.62,0x71898b if i<3 else 0x8a9ea1,0x667f7f if i<3 else 0x80949b)
    # Paired pale horn summits beyond the upper forest opening. A broken band of
    # exposed granite interrupts the tree line above the col between the peaks.
    ridge(-455,3260,980,630,640,600,1.6,0x5b736b,0x718379)
    for x,y,w,h,top in ((-525,3160,266,220,1470),(-776,3370,223,194,1440)):
        ridge(x,y,w,h,1020,top-1020,2.63,0x94a2a0,0x677a7b)
        for n in range(18):
            col=lin(0xb0b8b2 if n%4==0 else 0x7d8d88)
            frac=n/25
            a=(x+w*(.77-frac*.74),y-h*.15+n*3,1080+frac*416)
            b=(a[0]+18,a[1]+24,a[2]-21);c=(a[0]-17,a[1]+38,a[2]+14)
            art.face((a,b,c),(col,)*3);art.face((c,b,a),(col,)*3)
    for i,(x,y,w,h,z) in enumerate(((-2550,3850,1350,990,1610),(-2900,4510,1850,910,1640),
                                      (-3330,4740,365,460,1830),(-3670,4880,330,420,1785),
                                      (3700,5290,1650,960,1660),(1560,5600,1590,1180,1780))):
        ridge(x,y,w,h,310,z-310,i*.87,0x6e837a,0x87918a)


def ski_area(art):
    def box(d,l,up,w,depth,h,colour):
        art.box(pose(d,l,up),(w,depth,h),heading(d),lin(colour))
    # Turnout, interpretive stone, a few parked vehicles and timber rails.
    for d in range(5515,5800,5):
        box(d,-11.6,-.35,5.7,12.2,.34,0x81847c)
    for d in range(5540,5790,11):
        box(d,-17.64,-.12,.23,.25,.99,0x746c58)
        box(d,-17.64,.57,11.04,.10,.11,0x918774)
    for d in (5590,5634,5707):
        box(d,-13.6,0,3.94,1.68,.9,0x9caaa6);box(d,-13.6,.9,2.08,1.54,.66,0x566871)
    box(5675,-14.2,.05,2.8,1.1,.95,0x9b9a8d);box(5675,-14.2,1.01,2.4,.96,.08,0x454d4d)
    # Original lodge with steep timber gable, tall gridded glazing, covered entrance and stone chimney.
    d,l=17989,17
    x,y,z=pose(d,l)
    art.box((x,y,z-1),(21,14,8.5),heading(d)+math.pi/2,lin(0xbd8652))
    art.roof((x,y,z+7.5),21,14,7.2,heading(d)+math.pi/2,lin(0x525957))
    box(d,l-6.45,.46,13.8,.38,6.68,0x526b70)
    for i in range(11):box(d-6+i*1.2,l-6.75,.43,.13,.23,6.79,0x9f7045)
    for h in (2.16,4.23,6.15):box(d,l-6.77,h,13.8,.2,.15,0xc29668)
    box(d+5.9,l+2.1,5,2.1,2.2,8.25,0x858578)
    # The entrance faces the approaching rider from the gabled end. The triangular
    # glazing steps up under the bargeboards; mullions and rafters read at riding speed.
    for col in range(-5,6):
        height=9.6-abs(col)*.91
        box(d-7.04,l+col*1.43,.56,.16,1.29,height,0x426775)
        box(d-7.18,l+col*1.43-.63,.54,.22,.13,height+.06,0xba8e56)
        for rail in (2.14,4.23,6.35,8.41):
            if rail<height:box(d-7.19,l+col*1.43,rail,.21,1.34,.12,0xce9a63)
    box(d-8.2,l,.09,3.7,15.7,.38,0x8a867b)
    box(d-8.6,l,3.67,4.4,16.4,.34,0x5a5e58)
    for side in (-6.85,-2.55,2.55,6.85):box(d-10.25,l+side,.45,.35,.35,3.29,0xae8250)
    for offset in range(0,62,6):
        box(17910+offset,9.7,.0,.2,.24,1.02,0x9a8668)
        box(17913+offset,9.7,.76,6.0,.14,.16,0xb19b76)
    # Upper spruce and narrow winding runs climb from the terminal, grounding the machinery.
    for side in (-1,1):
        for j in range(22):
            offset=57+j*4
            x,y,z=pose(17980+j*5,side*offset)
            ground=z-1+offset*.15
            def bank(shift,lift):
                sx,sy,sz=pose(17980+j*5+shift,side*(offset+lift))
                return sx,sy,sz-1+(offset+lift)*.15
            patch=(bank(-6,-13),bank(8,-13),bank(8,14),bank(-6,14))
            art.face(patch,(lin(0x71806d),)*4)
            art.face(patch[::-1],(lin(0x71806d),)*4)
            if j%3:
                art.tube((x,y,ground),2.7,0,10+j%6,lin(0x415b4b),lin(0x586e58),9,lin(0x566854))
    for d in (17985,18033,18087,18118):
        t=(d-17985)/133;l=-15-58*t;h=5.85+11.15*t
        box(d,l,-1,1.03,1.1,h+1,0x64716a)
        box(d,l,h-.24,1.18,6.2,.45,0x40554e)
        if d in (17985,18118):
            box(d,l,h,10.5,6.3,1.9,0x39664f)
            box(d,l,h+1.9,11.2,6.8,.35,0x939e92)
