"""JFK Drive from the conservatory lawns to the Great Highway, in measured metres."""
import math
from worldkit import Painted,lin

LENGTH=6375
PROFILE=((0,72),(520,77),(1010,66),(1680,70),(2100,62),(2460,68),(3040,52),
         (3460,55),(4020,44),(4610,46),(5550,15),(6000,7),(6375,6))
def elevation(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]
def direction(d):
    inland=.31*math.sin(d/221)+.22*math.sin(d/97)+.115*math.sin(d/49)
    def smooth(t):t=min(1,max(0,t));return t*t*(3-2*t)
    # A short bend reveals each landmark on the preceding straight, then passes beside it.
    for at,angle in ((80,.54),(1680,-.43),(3040,.44),(4020,-.43),(5550,-.37)):
        entry=smooth((d-at+65)/50);exit=smooth((d-at-186)/85)
        if entry>0 and exit<1:
            curve=angle*smooth((d-at-20)/62)
            weight=entry*(1-exit);inland=inland*(1-weight)+curve*weight
    coast=smooth((d-5920)/195)
    return inland*(1-coast)+coast*(-.10-1.36*smooth((d-6200)/85))
path=[(-128.,0.)]
for i in range(-127,LENGTH+501):
    h=direction(i-.5);x,y=path[-1];path.append((x+math.cos(h),y+math.sin(h)))
def pos(d,lane=0):
    n=max(0,min(len(path)-2,math.floor(d)+128));f=d+128-n
    x,y=path[n];u,v=path[n+1];h=direction(d)
    return x+(u-x)*f-math.sin(h)*lane,y+(v-y)*f+math.cos(h)*lane
def lay(course,theme,bc):
    stages=bc.stages(course['plan']);samples=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d)
        samples.append(dict(x=x,y=y,z=elevation(d),h=direction(d),k=(direction(d+1)-direction(d-1))/2,
                            d=d,g=100*(elevation(d+.5)-elevation(d-.5))))
    return samples,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

LAKES=((1797,43,77,33),(3150,-40,112,35))
BEACH_X=pos(6250)[0]+42

def land(road,col,theme,bc):
    lakes=[(*pos(d,l),direction(d),length,width,elevation(d)-1.25) for d,l,length,width in LAKES]
    def height(x,y):
        _,idx,gap=road.tree.find((x,y,0));s=road.s[idx];d=s['d']
        shore=BEACH_X
        if x>shore-3:return -.9
        if x>shore-44:return max(.02,(shore-x-3)*.095)
        for cx,cy,h,length,width,level in lakes:
            along=(x-cx)*math.cos(h)+(y-cy)*math.sin(h);across=-(x-cx)*math.sin(h)+(y-cy)*math.cos(h)
            radius=math.hypot(along/length,across/width)
            if radius<.99:return level-1.8
            if radius<1.09:return level+.12+(radius-.99)*5
        return s['z']-.18+min(1,max(0,(gap-9)/24))*(1.9*math.sin(x*.017+y*.032)+min(gap*.03,9))
    b=bc.Builder('Rolling park lawns','terrain');b.colours=[]
    span=(-370,-215,-130,-78,-55,-37,-24,-14,-8,-4,0,4,8,14,24,37,55,78,130,215,370)
    def row(d):
        pts=[]
        for l in span:
            x,y=pos(d,l);pts.append((x,y,height(x,y)))
        return pts
    last=row(-80)
    for d in range(-70,LENGTH+130,10):
        nxt=row(d)
        for i,l in enumerate(span[:-1]):
            b.quad(last[i],nxt[i],nxt[i+1],last[i+1])
            tone=0x82915F if (d//85+i)%4 else 0x829665
            if d>6080:tone=0xCBBE99
            if 3950<d<4260 and 8<l<78:tone=0xB7A573
            b.colours.extend([lin(tone)]*4)
        last=nxt
    return b.build(col),height

def road_surface(road,st,length,col,theme,bc):
    tar=bc.Builder('Road','asphalt');paint=bc.Builder('RoadPaint','paint')
    verges=bc.Builder('Rounded kerbs and footpaths','terrain');verges.colours=[]
    for i in range(road.index(-60),road.index(length+45)):
        def band(b,a,c,h,tone=None):
            b.quad(road.at(i,a,h),road.at(i,c,h),road.at(i+1,c,h),road.at(i+1,a,h))
            if tone:b.colours.extend([lin(tone)]*4)
        band(tar,4.8,-4.8,0)
        if i%4==0:band(paint,.083,-.083,.016)
        for side in (-1,1):
            def sideband(a,b,h,col):band(verges,*sorted((side*a,side*b),reverse=True),h,col)
            sideband(4.8,5.11,.12,0xCBC6B8);sideband(5.11,7.8,.105,0xA79F8E)
            if road.s[i]['d']>5980:band(paint,*sorted((side*4.35,side*4.46),reverse=True),.019)
    tar.build(col);paint.build(col);verges.build(col)

def scenery(k):
    art=Painted(k);rng=k.rng;r=k.road
    crowns=Painted(k,'paint');crowns.b.name='ParkCrowns';crowns.b.uvs=[]
    def frame(d,l):
        x,y=pos(d,l);z=k.height_at(x,y);h=direction(d)
        def pt(u,v,w):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
        return pt,h
    def blob(pt,rx,ry,rz,colour):
        x,y,z=pt;sides=9;last=None
        for j in range(6):
            a=(j/5-.5)*math.pi;ring=[(x+rx*math.cos(a)*math.cos(i*math.tau/sides),
                y+ry*math.cos(a)*math.sin(i*math.tau/sides),z+rz*math.sin(a)) for i in range(sides)]
            if last:
                for i in range(sides):
                    m=(i+1)%sides;art.face((last[i],last[m],ring[m],ring[i]),(colour,)*4)
            last=ring
    def limb(a,b,rad,tip,tone):
        x,y,z=a;hx,hy,hz=b;n=math.hypot(hx-x,hy-y)
        # A ring on the horizontal works on the vertical and leaning timber members.
        def ring(p,r):return [(p[0]+r*math.cos(i*math.tau/7),p[1]+r*math.sin(i*math.tau/7),p[2]) for i in range(7)]
        lo,hi=ring(a,rad),ring(b,tip)
        for i in range(7):
            j=(i+1)%7;art.face((lo[i],lo[j],hi[j],hi[i]),(tone,)*4)
    for d in range(-40,6020,12):
        for side in (-1,1):
            lane=side*rng.uniform(11,48);pt,h=frame(d,lane)
            if d<370 and side<0 or 1530<d<1910 and side>0 or 2870<d<3320 and side<0 or 3870<d<4335 and side>0 or 5420<d<5790 and side>0:continue
            a=rng.uniform(.75,1.34);cypress=d>3900 or rng.random()<.35
            bark=lin(0x6D6959 if cypress else 0xA59883)
            crown=lin(rng.choice((0x485F4F,0x506858,0x526947)) if cypress else rng.choice((0x677B69,0x637867,0x718677)))
            high=(8.5 if cypress else 14)*a
            limb(pt(0,0,-.2),pt(.7,.6,high),.40*a,.24*a,bark)
            if not cypress:
                for j in range(3):
                    art.tube(pt(.12+j*.17,.10+j*.15,2+j*2.8),.37*a,.31*a,.74*a,lin(0xC1B7A4),lin(0xAB9F8D),7)
            for j in range(4):
                ang=j*2.39;u=a*(math.cos(ang)*(3 if cypress else 2.6)+(2.7 if cypress else 0));v=a*math.sin(ang)*2.7
                top=high+(1+j*.48)*a;limb(pt(.4,.4,high*.62),pt(u,v,top),.21*a,.085*a,bark)
                blob(pt(u,v,top),a*(1.9 if cypress else 1.0),a*1.45,a*(.6 if cypress else 1.45),crown)
            for turn in (0,math.pi*.5):
                angle=turn+h+.18*math.sin(d);w=(7.9 if cypress else 5.4)*a
                x,y,z=pt(1.9 if cypress else .6,.35,high*.60);up=(7.2 if cypress else 10.2)*a
                dx=w*math.cos(angle);dy=w*math.sin(angle)
                crowns.face(((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+up),(x-dx,y-dy,z+up)),(lin(0xFFFFFF),)*4)
                u=.505 if cypress else .001;v=.999 if cypress else .485
                crowns.b.uvs.extend([(u,1),(v,1),(v,0),(u,0)])
    # Elongated lakes with a low stone lip and reeds. Water level is constant within each basin.
    for d,l,length,width in LAKES:
        x,y=pos(d,l);h=direction(d);wet=elevation(d)-1.25
        def point(a,r):
            u=r*length*math.cos(a);v=r*width*math.sin(a)
            return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h)
        for j in range(96):
            a=j*math.tau/96;b=(j+1)*math.tau/96
            art.face(((x,y,wet),(*point(a,1.015),wet),(*point(b,1.015),wet)),(lin(0x66877F),)*3)
            art.face(((*point(a,.983),wet+.11),(*point(a,1.04),wet+.28),(*point(b,1.04),wet+.28),(*point(b,.983),wet+.11)),(lin(0x969C86),)*4)
    # Stow Lake bridge has two true open masonry arches. Individual voussoirs continue through its depth.
    pt,h=frame(1797,38)
    for centre in (-5.7,5.7):
        for i in range(18):
            a=i*math.pi/18;b=(i+1)*math.pi/18
            def arch(t,r,v):return pt(centre+r*math.cos(t),v,.3+r*math.sin(t))
            stone=lin(rng.choice((0x8B8975,0xA19D83,0x747763,0x94937D)))
            for v in (-2.2,2.2):
                art.face((arch(a,4.8,v),arch(b,4.8,v),arch(b,5.65,v),arch(a,5.65,v)),(stone,)*4)
                art.face((arch(a,5.65,v),arch(b,5.65,v),pt(centre+5.65*math.cos(b),v,6.55),pt(centre+5.65*math.cos(a),v,6.55)),(stone,)*4)
            art.face((arch(a,4.8,-2.2),arch(a,4.8,2.2),arch(b,4.8,2.2),arch(b,4.8,-2.2)),(stone,)*4)
    art.box(pt(0,0,6.53),(23.2,4.7,.45),h,lin(0x868571))
    for v in (-2.22,2.22):
        for j in range(19):art.box(pt(j*1.21-10.9,v,6.92),(1.18,.43,.56),h,lin(0xA49E83))
    # Conservatory wings and dome have physical depth behind the white ornamental front.
    pt,h=frame(205,-40)
    art.box(pt(4,0,.15),(12,56,4.6),h,lin(0xD3D9CB))
    for side in (-1,1):
        for bay in range(13):
            v=side*(6+bay*1.64)
            blob(pt(4,v,4.61),6.3,1.13,3.63,lin(0xBCC8BB))
    art.tube(pt(3,0,2),6.3,6.3,8.3,lin(0xBFCAC0),lin(0xE2E4D7),24)
    blob(pt(3,0,10),6.35,6.35,5.5,lin(0xC5D1C6))
    for i in range(10):
        pp,_=frame(130+i*15,-11-(i%2)*8)
        art.tube(pp(0,0,0),.32,.26,7.7,lin(0x877B62),lin(0xA09974),10)
        for j in range(10):
            a=j*math.tau/10
            art.face((pp(0,0,8.25),pp(1.9*math.cos(a)-.45*math.sin(a),1.9*math.sin(a)+.45*math.cos(a),8),
                      pp(3.15*math.cos(a),3.15*math.sin(a),6.65),pp(1.9*math.cos(a)+.45*math.sin(a),1.9*math.sin(a)-.45*math.cos(a),7.95)),(lin(0x527952),)*4)
    for d in range(3910,4320,4):
        pt,h=frame(d,8.6)
        art.box(pt(0,0,0),(.18,.19,1.49),h,lin(0x705A42))
        for z in (.53,1.13):art.box(pt(2,0,z),(4.02,.13,.16),h,lin(0x9C8868))
    # Dutch Windmill's taper, gallery rails and timber cap above the Queen Wilhelmina tulip beds.
    pt,h=frame(5670,23)
    art.tube(pt(0,0,0),5.9,3.98,17.2,lin(0xAA9679),lin(0x9A866E),12)
    art.tube(pt(0,0,6.8),6.4,6.4,.48,lin(0x5A5043),lin(0x7D6A56),16)
    art.tube(pt(0,0,17.2),4.5,2.3,3.45,lin(0x555347),lin(0x625849),14)
    for i in range(20):
        a=i*math.tau/20;art.tube(pt(6.12*math.cos(a),6.12*math.sin(a),7.18),.08,.08,1.23,lin(0x705F4C),lin(0xB8AC8E),6)
    for i in range(6):
        q,g=frame(5560+i*18,12+i*.9)
        for j in range(4):
            art.box(q(0,j*1.35,.12),(13.8,1.16,.25),g,lin((0xD55C56,0xEABD49,0xC88CA3,0xE4DDD4)[j]))
            for flower in range(17):
                u=(flower-8)*.73;v=j*1.35+.24*math.sin(flower*2)
                art.tube(q(u,v,.33),.11,.17,.22,lin(0x738345),lin((0xEB6E6B,0xEFD464,0xDC9FBA,0xEBE8DC)[j]),7)
    # Dunes beyond the Great Highway. Repeated narrow foam crests break across the Pacific.
    _,coasty=pos(6375);shore=BEACH_X
    art.box((shore+760,coasty,1),(1500,2300,.18),0,lin(0x728F97))
    for j in range(-22,23):
        y=coasty+j*26;
        if abs(y-pos(6220)[1])>160:blob((shore-22+3*math.sin(j),y,1.8),24,32,2.7,lin(0xC8B995))
        for n in range(4):
            x=shore+15+n*16+3*math.sin(j*.55+n)
            art.box((x,y,1.27),(1.35,24,.17),.08*math.sin(j),lin(0xD5DFD7))
    # The ride crosses the Great Highway before reaching the west-facing beach ramp.
    q,h=frame(6120,0)
    for side in (-1,1):
        art.box(q(0,side*87,-.30),(8.6,164,.28),h,lin(0x666A68))
        for l in range(7,150,7):
            art.box(q(0,side*l,-.01),(.14,3.5,.03),h,lin(0xCDC79D))
    for j in range(160):
        d=rng.uniform(6125,6370);l=rng.choice((-1,1))*rng.uniform(8,62);q,h=frame(d,l)
        for blade in range(4):
            a=rng.random()*math.tau
            art.face((q(-.15,0,0),q(.15,0,0),q(.63*math.cos(a),.63*math.sin(a),rng.uniform(.62,1.24))),(lin(0x97915D),)*3)
    for d in range(30,LENGTH,57):
        q,h=frame(d,-5.85);art.tube(q(0,0,.1),.14,.08,4.9,lin(0x5A625B),lin(0x778077),8)
        art.tube(q(0,0,5),.24,.35,.57,lin(0xD5D3BB),lin(0xDFE1D6),8)
        art.tube(q(0,0,5.57),.41,.06,.25,lin(0x58645A),lin(0x697269),8)
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road_surface,'land':{'mid':0x84936A},'terrain':{'sea':False},
       'wet':.21,'haze':0xB4BFBA,'sky':[0xA5B5B3,0xBAC9C7,0xCAD3CE,0xB7C3C1,0xA7B7B8],
       'light':[0xEFF2E4,1.55],'fill':[0xCEE1DF,0x8D917E],'sun_altitude':.55,'sun_azimuth':1.75,
       'palette':{'asphalt':0x686C68,'paint':0xE9E7CF}}
