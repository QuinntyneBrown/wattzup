"""The championship street circuit through Glasgow, in metres with 48 linked grid turns."""
from bisect import bisect_right
import math
from worldkit import Painted, lin

LENGTH=13100
PROFILE=((0,25),(1380,40),(2540,55),(3540,31),(4820,49),(6180,27),(7680,57),(9240,39),(10700,52),(12100,38),(13100,25))
# Grid junctions are rounded into circular corners. The finish straight crosses the lap seam.
GRID=[(3,0),(3,2),(5,2),(5,0),(7,0),(7,3),(8,3),(8,4),(6,4),(6,6),(9,6),(9,5),(11,5),(11,3),
      (13,3),(13,1),(12,1),(12,-1),(10,-1),(10,-3),(12,-3),(12,-6),(10,-6),(10,-7),(8,-7),(8,-5),
      (7,-5),(7,-3),(5,-3),(5,-4),(3,-4),(3,-6),(4,-6),(4,-8),(2,-8),(2,-7),(0,-7),(0,-5),(-2,-5),
      (-2,-6),(-5,-6),(-5,-4),(-6,-4),(-6,-2),(-4,-2),(-4,-1),(-3,-1),(-3,0)]
RADIUS=16
perimeter=sum(math.dist(p,GRID[i-1]) for i,p in enumerate(GRID))
unit=(LENGTH+len(GRID)*RADIUS*(2-math.pi/2))/perimeter
streets=[(x*unit,y*unit) for x,y in GRID]
pieces=[];ends=[]

def make_grid():
    for i,(x,y) in enumerate(streets):
        prev=streets[i-1];nx,ny=streets[(i+1)%len(streets)]
        h=math.atan2(y-prev[1],x-prev[0]);out=math.atan2(ny-y,nx-x)
        sign=1 if math.sin(out-h)>0 else -1
        entry=(x-RADIUS*math.cos(h),y-RADIUS*math.sin(h))
        centre=(entry[0]-sign*RADIUS*math.sin(h),entry[1]+sign*RADIUS*math.cos(h))
        pieces.append((True,*centre,h,sign))
        ends.append((ends[-1] if ends else 0)+math.pi*RADIUS/2)
        pieces.append((False,x+RADIUS*math.cos(out),y+RADIUS*math.sin(out),out,0))
        ends.append(ends[-1]+math.dist((x,y),(nx,ny))-2*RADIUS)
make_grid()

def position(d):
    # The last 115 m of the home straight lead from the start to the east end of the square.
    at=(d-115)%LENGTH
    i=min(len(pieces)-1,bisect_right(ends,at));u=at-(ends[i-1] if i else 0)
    turn,x,y,h,sign=pieces[i]
    if not turn:return x+u*math.cos(h),y+u*math.sin(h),h,0
    h+=sign*u/RADIUS
    return x+sign*RADIUS*math.sin(h),y-sign*RADIUS*math.cos(h),h,sign/RADIUS

def elevation(d):
    d%=LENGTH
    for (a,h),(b,k) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return h+(k-h)*(d-a)/(b-a)
    return PROFILE[0][1]

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);samples=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h,k=position(d)
        samples.append(dict(x=x,y=y,z=elevation(d),h=h,k=k,d=d,g=100*(elevation(d+.5)-elevation(d-.5))))
    mean=sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH
    return samples,stages,LENGTH,mean,0

def land(road,col,theme,bc):
    return None,lambda x,y:road.s[road.tree.find((x,y,0))[1]]['z']-.02

def road_surface(road,st,length,col,theme,bc):
    tar=bc.Builder('Road','asphalt');paint=bc.Builder('RoadPaint','paint')
    pavement=bc.Builder('Kerbstones and sandstone pavement','terrain');pavement.colours=[]
    def band(batch,i,left,right,z,colour=None):
        pts=(road.at(i,left,z),road.at(i,right,z),road.at(i+1,right,z),road.at(i+1,left,z))
        batch.quad(*pts)
        if colour:batch.colours.extend([lin(colour)]*4)
    for i in range(road.index(0),road.index(length)):
        d=road.s[i]['d']
        band(tar,i,5.2,-5.2,0)
        if i%3==0:band(paint,i,.075,-.075,.021)
        for side in (-1,1):
            a,b=sorted((side*5.2,side*13.5),reverse=True)
            band(pavement,i,a,b,.14,0x827E79)
            a,b=sorted((side*5.2,side*5.55),reverse=True)
            band(pavement,i,a,b,.154,0xC2BCAB if i%3 else 0xACA89C)
            a,b=sorted((side*4.87,side*4.91),reverse=True)
            band(paint,i,a,b,.016)
            if i%17==0:band(paint,i,3.9,2.4,.02)
        # Stop bars and broken Give Way paint before the apex of a junction.
        if abs(position(d+9)[3])>.01 and abs(position(d+5)[3])<.01:
            for n in range(4):
                a,c=road.at(i,1+n*.92,.029),road.at(i,1.58+n*.92,.029)
                x,y,h,_=position(d);vx,vy=.24*math.cos(h),.24*math.sin(h)
                paint.quad(c,a,(a[0]+vx,a[1]+vy,a[2]),(c[0]+vx,c[1]+vy,c[2]))
    for b in (tar,paint,pavement):b.build(col)

def scenery(k):
    art=Painted(k);rng=k.rng;r=k.road
    def block(d,l,z,w,dep,h,colour):
        art.box(r.pos(d,l,z),(w,dep,h),position(d)[2],lin(colour))
    # The grass islands, warm gravel and black railings of George Square.
    for d in range(-110,97,12):
        block(d,24,.1,12,38,.18,0x9A907C)
        block(d,24,.30,11.8,27,.12,0x62794D)
    for d,l in ((-89,16),(-30,32),(9,20),(72,28)):
        x,y,z=r.pos(d,l,.41)
        art.box((x,y,z),(4.3,4.1,.62),0,lin(0x9F9990))
        art.box((x,y,z+.62),(3.1,2.95,.50),0,lin(0xB6B0A5))
        art.box((x,y,z+1.12),(2.4,2.25,2.8),0,lin(0x908C82))
        art.tube((x,y,z+3.9),.72,.55,6.8 if d==-30 else 1.42,lin(0xA8A297),lin(0xBCB4A6),12)
        h=z+(10.7 if d==-30 else 5.32)
        art.tube((x,y,h),.46,.32,1.5,lin(0x39483E),lin(0x465147),8)
        art.tube((x,y,h+1.45),.22,.18,.43,lin(0x48564C),lin(0x455346),8)
    frontage_art=Painted(k,'asphalt');frontage_art.b.name='Tenements';frontage_art.b.uvs=[]
    # Multiple independently shaped tenement frontages per street; keep intersections open.
    stones=(0xBC805F,0xB9876F,0xBCAC91,0xCDBA99,0xA9735B,0xAF9F89)
    for d in range(200,12955,23):
        _,_,yaw,bend=position(d)
        if abs(bend)>.01 or abs(position(d+15)[3])>.01 or abs(position(d-15)[3])>.01:continue
        for sign in (-1,1):
            if 6150<d<6320 and sign<0:continue
            frontage=rng.uniform(18.2,23.6);height=rng.choice((12.4,15.6,18.8))
            off=sign*rng.uniform(14.1,16.2);x,y,z=r.pos(d,off)
            if not r.clear_of_road(x,y,13,r.index(d),65):continue
            colour=rng.choice(stones)
            block(d,off+sign*4.8,-.5,frontage,9.6,height+.5,colour)
            for h in (3.62,height-.3,height+.15):
                block(d,off+sign*4.8,h,frontage+.32,10.03,.28,0x8F8375)
            art.roof((x-sign*5*math.sin(yaw),y+sign*5*math.cos(yaw),z+height+.45),frontage,10.2,2.7,yaw,lin(0x514F51))
            atlas=rng.randrange(4)
            def facade(along,lift):
                return (x+along*math.cos(yaw)+sign*.34*math.sin(yaw),
                        y+along*math.sin(yaw)-sign*.34*math.cos(yaw),z+lift)
            face=[facade(-frontage/2,.16),facade(frontage/2,.16),
                  facade(frontage/2,height),facade(-frontage/2,height)]
            frontage_art.face(face,(lin(0xFFFFFF),)*4)
            u,v=(atlas+.001)/4,(atlas+.999)/4
            if sign<0:u,v=v,u
            frontage_art.b.uvs.extend([(u,1),(v,1),(v,0),(u,0)])
            block(d+frontage*.30,off+sign*5,height+1.12,1.5,1.35,2.9,0x866E62)
    # City Chambers stands across the east end of the square with a tower and projecting pavilions.
    # Its architectural elevation is placed against this volume by the race's lazy renderer.
    cx=streets[0][0]+44;cy=14;base=elevation(110)+.12
    art.box((cx+13,cy,base),(26,94,18),0,lin(0x998F82))
    art.roof((cx+13,cy,base+17.8),95,27,4.5,math.pi/2,lin(0x596066))
    for offset,high in ((-40,26),(0,41),(40,26)):
        art.box((cx+7,cy+offset,base+16),(11,12,high-16),0,lin(0xA49888))
        art.tube((cx+7,cy+offset,base+high),5.2,2.3,4.8,lin(0x5B6969),lin(0x87938B),12)
    # Royal Exchange Square: a columned Ionic portico behind the equestrian monument.
    at=6252
    def local(u,v,h):return r.pos(at+u,-19+v,h)
    yaw=position(at)[2]
    for depth,w,h in ((0,28,.28),(.8,27,.55),(1.6,26,.82)):
        art.box(local(0,-7-depth,h-.24),(w,14,.28),yaw,lin(0xB2ACA1))
    art.box(local(0,-15,.62),(30,14,11.3),yaw,lin(0xB9B2A5))
    for n in range(8):
        x,y,z=local(-12+n*3.43,-3,.86)
        art.tube((x,y,z),.68,.58,8.6,lin(0xA8A496),lin(0xD0C9BA),14)
        art.box((x,y,z+8.55),(1.62,1.62,.68),yaw,lin(0xC4BCAD))
    art.box(local(0,-4.3,10.2),(29,4.6,1.3),yaw,lin(0xBFB5A5))
    art.roof(local(0,-9.6,11.5),13.1,29,4.6,yaw+math.pi/2,lin(0xAAA194))
    mount(art,r,at-14,-12.4)
    # Steel barriers backed by rainbow panels near the finish and at championship viewing areas.
    for start,end in ((-190,170),(1320,1490),(3460,3670),(6090,6285),(9120,9370),(12680,12890)):
        for d in range(start,end,3):
            for side in (-1,1):
                l=side*5.65
                block(d,l,.15,2.80,.11,.88,0xD0D4CE)
                for j,tone in enumerate((0x4180B6,0xB74145,0x3F4246,0xCCA13C,0x4F885B)):
                    block(d,l-side*.064,.36+j*.085,2.65,.036,.08,tone)
                block(d,l,.99,2.94,.10,.075,0x737B7D)
                block(d+1.4,l,.1,.07,.13,.96,0x7C8181)
    for d in range(236,12915,105):
        x,y,z=r.pos(d,2.85,.023)
        art.tube((x,y,z),.36,.36,.017,lin(0x393C3C),lin(0x3D4141),14,lin(0x505456))
        for j in (-.17,0,.17):
            block(d+j,2.85,.046,.023,.45,.011,0x333737)
    return {'efforts':0}

def mount(art,r,station,side):
    """Wellington’s bronze horse, rider and the traffic cone on the raised stone plinth."""
    yaw=position(station)[2]+.62;x,y,z=r.pos(station,side,.14)
    bronze,light,stone=lin(0x384A43),lin(0x536158),lin(0x938C82)
    def pt(u,v,h):
        return x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h
    def oval(u,v,h,a,b,c,tone):
        rings=[]
        for band in range(9):
            angle=-math.pi/2+band*math.pi/8
            rings.append([pt(u+a*math.cos(angle)*math.cos(i*math.tau/14),
                             v+b*math.cos(angle)*math.sin(i*math.tau/14),h+c*math.sin(angle)) for i in range(14)])
        for low,high in zip(rings,rings[1:]):
            for i in range(14):
                j=(i+1)%14;art.face((low[i],low[j],high[j],high[i]),(tone,)*4)
    for base,w,l,h in ((0,5.6,2.8,.45),(.45,4.9,2.45,.4),(.85,4.45,2.1,2.1),(2.95,4.85,2.45,.32)):
        art.box(pt(0,0,base),(w,l,h),yaw,stone)
    for leg in (-1,1):
        for foot in (-1,1):
            oval(leg*.77,foot*.27,4.02,.13,.12,.78,bronze)
            oval(leg*.77+.04,foot*.27,3.38,.19,.12,.10,bronze)
    oval(0,0,4.74,1.25,.42,.54,bronze);oval(.87,0,5.18,.49,.32,.74,light)
    oval(1.21,0,5.71,.53,.24,.26,bronze);oval(-1.16,0,4.53,.14,.16,.59,bronze)
    for v in (-.13,.13):oval(1.05,v,5.99,.07,.055,.16,light)
    oval(-.14,0,5.73,.31,.26,.50,bronze);oval(-.07,0,6.34,.18,.16,.22,light)
    for v in (-.34,.34):oval(-.12,v,5.13,.18,.12,.43,bronze)
    art.tube(pt(-.07,0,6.50),.24,.038,.54,lin(0xE76C2F),lin(0xE5672B),12)
    art.tube(pt(-.07,0,6.72),.154,.124,.08,lin(0xDDDCD0),lin(0xE7E5D9),12)

THEME={'lay':lay,'land_builder':land,'road_builder':road_surface,'land':{'mid':0x74716D},
       'terrain':{'sea':False},'wet':.86,'rain':.46,'sky':[0x9FA7AE,0xAEB4B9,0x9DA4AA,0x949DA6,0x858F99],
       'haze':0xA5ADB1,'light':[0xE9EDF2,1.35],'fill':[0xD5DEE3,0x8C8A82],'sun_altitude':.75,
       'palette':{'asphalt':0x505456,'paint':0xDDDAD1},'sun_azimuth':-.65}
