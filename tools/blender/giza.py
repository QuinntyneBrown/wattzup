"""Plateau Road, a single closed 9.4 km route around the Giza archaeological landscape."""
from bisect import bisect_right
import math
from worldkit import Painted, lin

LENGTH = 9400
PROFILE = [(0,61),(1430,73),(2950,69),(4560,42),(5900,64),(6820,85),(7890,71),(9120,59),(9400,61)]
WAYPOINTS = [(-1090,180),(-680,255),(-315,185),(-90,365),(260,420),(455,645),(722,690),
             (870,450),(777,235),(935,-30),(1180,-295),(960,-565),(640,-660),(450,-915),
             (-155,-1110),(-650,-1035),(-1110,-1110),(-1590,-720),(-1720,-315),(-1490,65)]

def spline(t):
    i=math.floor(t)
    p,q,r,s=[WAYPOINTS[(i+n)%len(WAYPOINTS)] for n in (-1,0,1,2)]
    u=t-i
    return tuple(.5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u**3)
                 for a,b,c,d in zip(p,q,r,s))

raw=[spline(n/64) for n in range(len(WAYPOINTS)*64+1)]
arc=[0]
for a,b in zip(raw,raw[1:]):
    arc.append(arc[-1]+math.dist(a,b))
scale=LENGTH/arc[-1]

def xy(d):
    pos=(d%LENGTH)/scale
    i=min(len(raw)-2,bisect_right(arc,pos)-1)
    t=(pos-arc[i])/(arc[i+1]-arc[i])
    return tuple((a+(b-a)*t)*scale for a,b in zip(raw[i],raw[i+1]))

def elevation(d):
    pos=d%LENGTH
    for (a,h),(b,k) in zip(PROFILE,PROFILE[1:]):
        if pos<=b:return h+(k-h)*(pos-a)/(b-a)
    return PROFILE[0][1]

def heading(d):
    x,y=xy(d-.5);u,v=xy(d+.5)
    return math.atan2(v-y,u-x)

def offset(d,left):
    x,y=xy(d);h=heading(d)
    return x-left*math.sin(h),y+left*math.cos(h)

def lay(course,theme,bc):
    stages=bc.stages(course['plan'])
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=xy(d);a=heading(d+.5)-heading(d-.5)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=heading(d),k=math.atan2(math.sin(a),math.cos(a)),
                         g=100*(elevation(d+.5)-elevation(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows,stages,LENGTH,mean,0

# Each monument stays at one world position regardless of the rider's heading.
KHAFRE=(*offset(566,-195),215,137,True)
KHUFU=(*offset(1720,-166),230,139,False)
MENKAURE=(*offset(560,-574),103,65,False)

def shadow(x,y):
    """Low eastern sun projects the silhouette west along the sand."""
    for cx,cy,width,height,_ in (KHUFU,KHAFRE,MENKAURE):
        half=width*.50
        length=height*4
        t=max(0,min(1,(cx-half-x)/length))
        if cx-half-length <= x <= cx+half and abs(y-cy-t*length*.29)<half*(1-t):
            return .66
    return 1

def terrain(road,col,theme,bc):
    def height(x,y):
        _,j,dist=road.tree.find((x,y,0))
        z=road.s[j]['z'];fade=min(1,max(0,(dist-10)/85))
        dunes=4.4*math.sin(x/122+y/71)+3.6*math.cos(y/166-x/210)+1.2*math.sin(x/31+y/79)
        # Close to the road the native shoulder matches its cross section.
        return z-.25+fade*(dunes-4)
    sand=bc.Builder('Desert floor','terrain');sand.colours=[]
    def quad(points,close):
        for x,y,z in points:
            tone=lin(0xDFBF8C)
            grain=.94+.045*math.sin(x/45+y/81)+.045*math.cos(x/143-y/55)
            f=grain*shadow(x,y)
            sand.colours.append(tuple(v*f for v in tone[:3])+(1,))
        sand.quad(*points)
    # The broad dunes lie under a narrow, accurately graded strip along the road.
    for x in range(-4100,4100,65):
        for y in range(-3600,3600,65):
            quad([(u,v,height(u,v)-2.9) for u,v in ((x,y),(x+65,y),(x+65,y+65),(x,y+65))],False)
    for i in range(road.index(0),road.index(LENGTH),2):
        end=min(i+2,road.index(LENGTH))
        for a,b in ((-45,-18),(-18,-7),(-7,-4.2),(4.2,7),(7,18),(18,45)):
            pts=[]
            for ix,lane in ((i,b),(i,a),(end,a),(end,b)):
                x,y,_=road.at(ix,lane);pts.append((x,y,height(x,y)-max(0,abs(lane)-18)*.11))
            quad(pts,True)
    return sand.build(col),height

def pyramid(b,x,y,z,width,height,cap,rng,ruin=False):
    # Four vertical faces and a sun-catching tread per course. Joints stagger across the faces.
    rows=max(7,round(height/(1.45 if ruin else 1.16)))
    pitch=height/rows
    stone=[lin(v) for v in (0xCDB48A,0xC6AC83,0xDAC29A,0xCDB38A,0xC1A47C,0xD1B990)]
    def corners(r,up):
        return [(x-r,y-r,up),(x+r,y-r,up),(x+r,y+r,up),(x-r,y+r,up)]
    for j in range(rows):
        r=width*.5*(1-j/rows);n=width*.5*(1-(j+1)/rows)
        lo=z+j*pitch
        if cap and j/rows>.74:
            base,top=corners(r,lo),corners(.55,z+height)
            for k in range(4):
                end=(k+1)%4
                b.face((base[k],base[end],top[end],top[k]),(lin(0xE7D9BD),)*4)
            break
        base,lip,inner=corners(r,lo),corners(r,lo+pitch),corners(n,lo+pitch)
        for k in range(4):
            end=(k+1)%4
            a,c=base[k],base[end]
            # Reduced geometry gives the distant masonry visible runs of rough stone.
            count=max(1,round(2*r/(3.2 if ruin else 5.4)))
            for s in range(count):
                f,g=s/count,(s+1)/count
                pts=[(a[0]+t*(c[0]-a[0]),a[1]+t*(c[1]-a[1]),lo+h)
                     for t,h in ((f,0),(g,0),(g,pitch),(f,pitch))]
                colour=rng.choice(stone);sh=tuple(v*.86 for v in colour[:3])+(1,)
                b.face(pts,(sh,sh,colour,colour))
            b.face((lip[k],lip[end],inner[end],inner[k]),(lin(0xD9C298),)*4)

def sphinx(b,x,y,z,yaw):
    """Original ring sections for the lion's recumbent body and the royal head in its nemes."""
    def pt(u,v,w):
        return x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+w
    ochre,cream,brown=lin(0xCDA67B),lin(0xD9B990),lin(0xB58B63)
    def form(sections,tone):
        rings=[]
        for u,v,w,rx,ry in sections:
            rings.append([pt(u+rx*math.cos(i*math.tau/24),v+ry*math.sin(i*math.tau/24),w) for i in range(24)])
        for j,(bottom,top) in enumerate(zip(rings,rings[1:])):
            for i in range(24):
                end=(i+1)%24
                f=.95+.045*math.cos(i*.9+j*.8)
                col=tuple(v*f for v in tone[:3])+(1,)
                b.face((bottom[i],bottom[end],top[end],top[i]),(col,)*4)
        b.face(rings[-1],(tone,)*24)
    form([(-6,0,-1,22,8),(-6,0,2,24,8.5),(-7,0,4.7,24,8.4),(-9,0,6.5,21,7),
          (-12,0,8.4,14,6.6),(-12,0,9.2,9,4.3)],ochre)
    for side in (-1,1):
        v=side*5.2
        form([(14,v,-.6,17,2.55),(14,v,1.35,17,2.45),(13,v,2.60,14,2.1),(10,v,3.2,7,1.9)],cream)
        for toe in (-1,0,1):
            form([(29,v+toe*1.02,0,2.8,.58),(29,v+toe*1.02,.85,2.8,.58),(29,v+toe*1.02,1.48,2.1,.47)],ochre)
    form([(10,0,1,7.8,6.7),(10.4,0,5.5,7.8,6.7),(10.2,0,9.4,6.6,6.0),
          (10.8,0,12.7,4.8,4.4),(12.4,0,14.1,3.2,3.25)],ochre)
    # Fabric flares into the shoulders, with two separate striped lappets framing the cheeks.
    for side in (-1,1):
        for i in range(10):
            a=i/10;c=(i+1)/10
            def rim(t,front):
                return pt((12+3.3*t) if front else 7.1,side*(3.4+2.7*t),17.8-6.8*t)
            b.face((rim(a,False),rim(a,True),rim(c,True),rim(c,False)),(ochre if i%2 else brown,)*4)
            b.face((rim(c,False),rim(c,True),rim(a,True),rim(a,False)),(ochre if i%2 else brown,)*4)
    form([(12.1,0,13.0,2.7,2.5),(12.85,0,13.55,3.35,2.65),(12.85,0,15.1,3.55,3.2),
          (12.4,0,16.5,3.9,3.65),(11.8,0,18.5,4.3,4.0),(11.4,0,20.1,3.9,3.7),
          (11.0,0,20.75,3.55,3.2)],ochre)
    for side in (-1,1):
        form([(15.62,1.55*side,16.52,.49,1.00),(15.64,1.55*side,16.84,.48,.94)],brown)
        form([(15.57,1.55*side,16.85,.58,1.11),(15.52,1.55*side,17.20,.42,1.05)],cream)
    form([(15.9,0,15.52,.42,.62),(16.12,0,16.02,.45,.61),(15.75,0,17.22,.4,.47)],ochre)
    form([(15.82,0,14.27,.38,1.13),(15.93,0,14.62,.4,1.13)],brown)

def road_surface(road,st,length,col,theme,bc):
    tar=bc.Builder('Road','asphalt');kerb=bc.Builder('Plateau kerbstones','terrain')
    drift=bc.Builder('Wind blown sand','terrain');mark=bc.Builder('RoadPaint','paint')
    kerb.colours=[];drift.colours=[]
    for i in range(road.index(0),road.index(LENGTH)):
        d=road.s[i]['d']
        def band(batch,left,right,h0,h1,colour=None):
            pts=[road.at(i,left,h0),road.at(i,right,h1),road.at(i+1,right,h1),road.at(i+1,left,h0)]
            batch.quad(*pts)
            if colour:batch.colours.extend([lin(colour)]*4)
        band(tar,4.2,-4.2,.024,.024)
        if i%4==1:band(mark,.085,-.085,.038,.038)
        for side in (-1,1):
            left,right=sorted((side*4.20,side*4.52),reverse=True)
            band(kerb,left,right,.17,.17,0xCFB994 if i%3 else 0xBFAD8D)
            a,c=road.at(i,side*4.20,.028),road.at(i+1,side*4.20,.028)
            pts=[a,c,(*c[:2],c[2]+.14),(*a[:2],a[2]+.14)]
            kerb.quad(*(pts if side>0 else pts[::-1]));kerb.colours.extend([lin(0xA59072)]*4)
            def reach(s):
                return side*(4.2-.09-.47*max(0,math.sin(s/7.7+side)*math.sin(s/42))**2)
            if side>0: pts=[road.at(i,4.2,.044),road.at(i,reach(d),.036),road.at(i+1,reach(d+4),.036),road.at(i+1,4.2,.044)]
            else: pts=[road.at(i,reach(d),.036),road.at(i,-4.2,.044),road.at(i+1,-4.2,.044),road.at(i+1,reach(d+4),.036)]
            drift.quad(*pts);drift.colours.extend([lin(0xC9AF8A)]*4)
    for b in (tar,kerb,drift,mark):b.build(col)

def scenery(k):
    b=Painted(k);far=Painted(k,'peaks');rng=k.rng
    for x,y,w,h,cap in (KHAFRE,KHUFU,MENKAURE):
        pyramid(far,x,y,k.height_at(x,y)-8,w,h+8,cap,rng)
    for d,l,w,h in ((3075,59,44,20),(3140,81,40,17),(3230,91,42,18)):
        x,y=offset(d,l);pyramid(b,x,y,k.height_at(x,y)-5,w,h+3,False,rng,True)
    for d in range(2810,3340,26):
        x,y=offset(d,rng.uniform(19,42));z=k.height_at(x,y)-1.5
        w=rng.uniform(7,12)
        for layer in range(4):
            b.box((x,y,z+layer*.75),(w-layer*.45,6.5-layer*.3,.78),heading(d)+.12,lin(0xB99D75+layer*0x030302))
    # The face looks obliquely towards the approach. The low temple remains below the head.
    d=4631;x,y=offset(d,-30);z=k.height_at(x,y)-1
    sphinx(b,x,y,z,heading(d)+math.pi*.77)
    for row in range(2):
        for n in range(7):
            tx,ty=offset(d-32+n*5.6,-15-row*12)
            b.box((tx,ty,z-1.5),(4.8,3.1,3.1+1.4*(n%3==0)),heading(d),lin(0xC6A780))
    for at in (160,1465,2985,4614,6850,9140):
        x,y=offset(at,9.6);z=k.height_at(x,y)
        b.box((x,y,z),(3.05,2.5,2.65),heading(at),lin(0xD5BE93))
        b.box((x,y,z+2.58),(3.45,2.95,.27),heading(at),lin(0x8F7959))
        for fac in (-1,1):
            xx,yy=offset(at,9.6+fac*1.26)
            b.box((xx,yy,z+1.05),(1.65,.08,1.04),heading(at),lin(0x525650))
        for n in range(6):
            xx,yy=offset(at-24+n*7,6);b.box((xx,yy,k.height_at(xx,yy)-.1),(2.1,.74,.79),heading(at),lin(0xC7AB85))
        for n in range(4):
            xx,yy=offset(at+n*1.8-6,8.4+n%2*1.5);zz=k.height_at(xx,yy)
            k.person((xx,yy,zz),heading(at)+n,["crowd-3","crowd-5"])
            b.tube((xx,yy,zz+1.65),.22,.23,.04,lin(0xBFA676),lin(0xBAA174),10,lin(0xC7B081))
    # Cairo lies to the east throughout the ride. Bake distant blocks by district and a few slender minarets.
    for n in range(370):
        x=rng.uniform(2250,3100);y=rng.uniform(-3600,3700)
        h=rng.uniform(12,42);base=44
        tone=lin(rng.choice((0xA79C93,0xAF9C90,0xA99B92,0xB5A799)))
        far.box((x,y,base),(rng.uniform(12,44),rng.uniform(14,46),h),.12,tone)
        if n%17==0:
            far.tube((x,y,base+h),2.3,1.7,21,tone,tone,10)
            far.tube((x,y,base+h+20),3.5,3.5,1.5,tone,tone,10,tone)
            far.tube((x,y,base+h+21.5),1.65,.4,14,tone,tone,10,tone)
    return {'efforts':0}

THEME={'lay':lay,'road_builder':road_surface,'land_builder':terrain,'terrain':{'sea':False},
       'land':{'mid':0xD4B888},'sky':[0xECD3AC,0xDDBA9C,0xC3B6B1,0xA1B0BA,0x90A5B8],
       'haze':0xDDC4A7,'light':[0xFFD099,3.0],'fill':[0xCFD1D2,0xC0A486],
       'sun_azimuth':.30,'sun_altitude':.18,'palette':{'asphalt':0x706A61,'paint':0xCEBC9D}}
