"""Seoul's south-bank cycleway, with Banpo's double-deck bridge and the northern skyline."""
import math
from worldkit import Painted, lin

PROFILE = ((0,6),(1250,8),(2200,6),(3020,3),(3720,7),(4620,4),(5280,7),(6390,6),(7530,9),(8709,6))
PALETTE = (0x979AFF,0xDC8AFF,0xEF8BBC,0xFFA569,0x8FDDB0,0x78C9FF)
BRIDGES = ((1680,0x709FE4),(3095,0xFFC787),(4795,0xC894EF),(7090,0x88B3FF),(8535,0xEBA766))


def height(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:
            return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]


def approach(x):
    return sum(shift*(x-centre)*math.exp(-((x-centre)/100)**2) for centre,shift in ((4500,.66),(6215,.40)))


def shore_y(x):
    return 95*math.sin(x/480)+36*math.sin(x/175)+12*math.sin(x/83)+approach(x)


def heading(x):
    return math.atan(.198*math.cos(x/480)+.206*math.cos(x/175)+.145*math.cos(x/83)+(approach(x+.5)-approach(x-.5)))


# Tabulate metres along the curved riverbank; the workout determines total ridden distance.
X = [-100.]
for _ in range(9200):
    X.append(X[-1]+math.cos(heading(X[-1])))


def path(d,lane=0):
    scaled=d+100
    i=max(0,min(len(X)-2,math.floor(scaled)))
    x=X[i]+(scaled-i)*(X[i+1]-X[i]);a=heading(x)
    return x-math.sin(a)*lane,shore_y(x)+math.cos(a)*lane


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=path(d);h=heading(x)
        rows.append(dict(x=x,y=y,z=height(d),d=d,h=h,k=(heading(x+1)-heading(x-1))/2,g=100*(height(d+.5)-height(d-.5))))
    return rows,stages,length,sum(s['level']*(s['to']-s['from']) for s in stages)/length,0


def road(r,st,length,col,theme,bc):
    asphalt=bc.Builder('Road','asphalt');yellow=bc.Builder('CentreLine','yellow');edge=bc.Builder('RoadPaint','paint')
    for i,s in enumerate(r.s[:-1]):
        def band(b,a,h,z):
            b.quad(r.at(i,h,z),r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,h,z))
        band(asphalt,-3.25,3.25,.006)
        if int(s['d']//8)%4!=3:
            band(yellow,-.065,.065,.023)
        for side in (-1,1):
            band(edge,side*3.03-.045,side*3.03+.045,.025)
    # Wheel rings, the two frame triangles and a direction arrow are painted flat
    # on the pavement. Their orientation follows the path at each marking.
    for d in range(55,8750,86):
        for lane,sign in ((-1.55,1),(1.55,-1)):
            def mark(u,v):
                x,y=path(d+sign*u,lane+sign*v)
                return (x,y,height(d+sign*u)+.039)
            def line(a,b,width=.058):
                dx,dy=b[0]-a[0],b[1]-a[1];size=math.hypot(dx,dy)
                u=-dy/size*width/2;v=dx/size*width/2
                edge.quad(mark(a[0]+u,a[1]+v),mark(a[0]-u,a[1]-v),mark(b[0]-u,b[1]-v),mark(b[0]+u,b[1]+v))
            for cx in (-.59,.59):
                for j in range(14):
                    a=j*math.tau/14;b=(j+1)*math.tau/14
                    line((cx+.35*math.cos(a),-.14+.31*math.sin(a)),(cx+.35*math.cos(b),-.14+.31*math.sin(b)))
            for a,b in (((-.59,-.14),(-.21,.35)),((-.21,.35),(0,-.14)),((-.59,-.14),(0,-.14)),((0,-.14),(.36,.32)),((-.21,.35),(.36,.32)),((.59,-.14),(.35,.46)),((.35,.46),(.16,.47)),((1.9,0),(3.3,0)),((3.3,0),(2.85,.32)),((3.3,0),(2.85,-.32))):
                line(a,b,.08)
    for batch in (asphalt,yellow,edge):batch.build(col)


def land(r,col,theme,bc):
    ground=bc.Builder('HanBank','terrain');ground.colours=[]
    water=bc.Builder('HanWater','sea');water.colours=[]
    def ribbon(batch,row,previous,colours):
        for j,c in enumerate(colours):
            batch.quad(previous[j],row[j],row[j+1],previous[j+1]);batch.colours.extend([lin(c)]*4)
    previous=None
    for d in range(-90,8945,6):
        z=height(d)
        cross=((-280,z+7),(-90,z+2),(-18,z-.15),(-5,z-.1),(3.3,z-.1),(7,z-.13),(10,z-.3),(11,z-.75),(12,z-.78),(13,z-1.22),(14,z-1.25),(15,z-1.76),(17,z-1.8),(22,-.35))
        row=[(*path(d,off),up) for off,up in cross]
        x,y=path(d,22);wet=[(x,y,-.15),(x,950,-.15)]
        if previous:
            ribbon(ground,row,previous,(0x213833,0x33513C,0x354C3D,0x594248,0x5D595A,0x69696C,0x777477,0x555460,0x777477,0x555460,0x777477,0x555460,0x666677))
            ribbon(water,wet,oldwet,(0x123251,))
        previous=row;oldwet=wet
    ground.build(col);water.build(col)
    return None,lambda x,y: r.s[r.tree.find((x,y,0))[1]]['z']-.15


def scenery(k):
    architecture=Painted(k,'terrain')
    lights=Painted(k,'neon-cyan');city=Painted(k,'peaks')
    reflection=Painted(k,'neon-violet');reflection.b.name='HanReflections'
    cyclist=Painted(k,'wood');cyclist.b.name='HanCyclists'
    fountainTip=Painted(k,'neon-lime');fountainTip.b.name='BanpoNear'
    towerArt=Painted(k,'paint');towerArt.b.name='NamsanTower'
    def box(batch,x,y,z,dx,dy,dz,c,yaw=0):
        batch.box((x,y,z),(dx,dy,dz),yaw,lin(c))
    def shaft(batch,x,y,z,base,top,h,c,n=12):
        batch.tube((x,y,z),base,top,h,lin(c),lin(c),n,lin(c))
    city.b.name='YeouidoCity'
    jets=Painted(k,'neon-pink');jets.b.name='BanpoJets'
    for station,tint in BRIDGES:
        batches=[architecture.b,lights.b,reflection.b,jets.b,fountainTip.b]
        starts=[len(batch.verts) for batch in batches]
        x,y=path(station);floor=height(station)+10
        box(architecture,x,y+390,floor,20,970,1.55,0x686779)
        box(architecture,x,y+390,floor+1.52,22,970,.34,0x9D94A3)
        for side in (-1,1):
            box(lights,x+side*10.7,y+390,floor+1.42,.24,970,.31,tint)
        for i in range(-1,13):
            py=y+32+i*70
            for dx in (-6.4,6.4):
                shaft(architecture,x+dx,py,-.5,2.9,2.35,floor+1,0x807A79)
                box(architecture,x+dx,py,floor-1.9,6,10,2,0x989090)
            box(lights,x-5,py,floor-.22,2.5,1,.16,0xFFE1A4)
            # Girder seams, bearing caps and warm vertical light on the concrete.
            for dx in (-8,-3,3,8):
                box(architecture,x+dx,py+30,floor-.41,.4,59,.42,0x626373)
            for dx in (-6.4,6.4):
                box(lights,x+dx-2.56,py,1,.08,1.12,max(2,floor-3),tint)
                for z in (3.1,6.0,8.8):
                    if z<floor-2:box(architecture,x+dx,py,z,5.2,5.25,.11,0x6E6C76)
            # Illuminated column faces continue as broken vertical streaks in the water.
            if py>y+32:
                for j in range(8):
                    box(reflection,x-1.8* j,py,.011,1.1+j*.53,1.5+j*.37,.025,tint)
        if station==4795:
            box(architecture,x,y+390,floor-4.8,14,970,.95,0x676979)
            for idx in range(92):
                by=y+22+idx*8.4;c=lin(PALETTE[(idx//2)%len(PALETTE)])
                for step in range(12):
                    def strip(t,side):
                        return (x-10.8-20*t,by+side*(.23+.42*t),floor+1+12*t-(floor+13)*t*t)
                    t=step/12;u=(step+1)/12
                    (fountainTip if idx==0 else jets).face((strip(t,-1),strip(u,-1),strip(u,1),strip(t,1)),(c,)*4)
            # Banpo crosses the riding direction diagonally. The southern approach sees
            # the coloured jets recede in depth rather than stacking up edge-on.
            for batch,first in zip(batches,starts):
                for i in range(first,len(batch.verts)):
                    px,py,pz=batch.verts[i]
                    batch.verts[i]=(px+.67*(py-y),py,pz)
    def reflected_path(source,foot,colour,steps):
        sx,sy=source;ex,ey=foot
        dx,dy=ex-sx,ey-sy;span=math.hypot(dx,dy)
        ux,uy=-dy/span,dx/span
        for idx in range(steps):
            t=(idx+.5)/steps;jitter=k.rng.uniform(-1.7,1.7)*(1+t)
            x=sx+dx*t+ux*jitter;y=sy+dy*t+uy*jitter
            width=(.25+3.1*t)*k.rng.uniform(.5,1.5)
            length=(.34+t)*k.rng.uniform(.65,1.4)
            def corner(w,l):
                return (x+w*ux+l*dx/span,y+w*uy+l*dy/span,.035)
            reflection.face((corner(-width,-length),corner(width,-length),corner(width,length),corner(-width,length)),(lin(colour),)*4)
    for idx in range(26):
        x,y=path(4795);by=y+22+idx*8.4
        hit=(x-30+.67*(by-y),by)
        reflected_path(hit,(hit[0]-55,by-14),PALETTE[(idx//2)%len(PALETTE)],14)
    # The gold 63 Building steps inward; Parc1's corner columns and diagonals are red.
    def tower(x,y,h,w,c,frame=None):
        box(city,x,y,0,w,w*.72,h,c)
        for z in range(5,int(h)-1,6):
            box(city,x,y-w*.361,z,w*.94,.28,.75,0xC9AB7C if c==0x8A663E else 0x83B2C8)
        for level in range(7,int(h)-3,8):
            for col in range(1,int(w//3.4)):
                if k.rng.random()<.37:continue
                dx=-w*.48+col*3.4
                window_colour=k.rng.choice((0xC5D4C8,0xF4CE99,0xB3D8F1,0xE6CAAA))
                box(city,x+dx,y-w*.365,level,1.45,.27,1.65,window_colour)
                box(city,x-w*.502,y+dx*.63,level,.24,1.2,1.65,window_colour)
        if frame:
            for sign in (-1,1):
                box(city,x+sign*w*.47,y-w*.365,0,2.2,1.2,h+3,frame)
            for z in range(3,int(h)-24,24):
                for sign in (-1,1):
                    face=[(x+sign*w*.47,y-w*.38,z),(x+sign*w*.47,y-w*.38,z+2),(x,y-w*.38,z+25),(x,y-w*.38,z+23)]
                    city.face(face,(lin(frame),)*4)
    for x,y,h,w,c in ((690,490,176,46,0x886B45),(865,510,222,45,0x40374C),(935,538,185,42,0x40374C),(1070,565,155,42,0x4B5D70),(1130,555,140,35,0x41516A),(1180,580,127,38,0x47516A)):
        x0=x;x+=460;y+=168
        tower(x,y,h,w,c,0xFE665E if x0 in (865,935) else None)
        for strip in range(3):
            reflected_path((x+strip*5,y-12),(x*.24+strip*9,155+strip*6),0xEAC277 if x0==690 else (0xF68D97 if x0<1000 else 0x95D2F3),83)
        if x0==690:
            for j in range(5):box(city,x,y,h+j*3,w-j*5,30-j*3,3.2,0xD3A46E)
    # Riverfront apartments and their lit windows give the landmark towers a shore.
    for i in range(85):
        x=330+i*105
        y=810+85*math.sin(i*.41)
        w=k.rng.uniform(20,49);h=k.rng.uniform(13,49)
        box(city,x,y,-.8,125,60,4,0x344650)
        box(city,x,y,2,w,23,h,0x485261)
        for floor in range(5,int(h),5):
            for j in range(1,int(w//5)):
                if k.rng.random()>.45:
                    box(city,x-w/2+j*5,y-11.7,floor,2.1,.28,1.06,0xD1B990)
        for j in range(4):
            box(city,x+j*24-39,y-29,2.8,1.9,1,1.4,0xF6CD7E)
    # Fixed Namsan ridgeline and the tower's three observation decks.
    mx,my=8210,1320
    for j in range(70):
        x=mx-1250+j*38
        z=15+154*math.exp(-((x-mx)/355)**2)+18*math.sin(j*.41)**2
        u=x+38;v=15+154*math.exp(-((u-mx)/355)**2)+18*math.sin((j+1)*.41)**2
        # A wooded ridge rolls up from the embankment to the tower.
        for f,g in ((0,.34),(.34,.70),(.70,1)):
            lower=lin(0x27394A if f==0 else 0x344858)
            upper=lin(0x445766 if g==1 else 0x3A4E60)
            city.face(((x,my-(1-f)*112,z*f),(u,my-(1-f)*112,v*f),
                       (u,my-(1-g)*112,v*g),(x,my-(1-g)*112,z*g)),(lower,lower,upper,upper))
    base=174
    shaft(towerArt,mx,my,base,3.8,1.8,94,0xEBCAC1)
    for r,z,h in ((8.2,88,5),(9,93,4),(6.8,97,7),(4.8,104,5)):
        shaft(towerArt,mx,my,base+z,r,r*.96,h,0xFDB9D1 if z%2 else 0xFCDBAC)
    shaft(towerArt,mx,my,base+109,1.4,.1,40,0xEB8AB1)
    for d in range(12,8870,28):
        z=height(d);x,y=path(d,-4.55);a=heading(x)
        shaft(architecture,x,y,z-.2,.11,.065,6.4,0x777D89,7)
        box(architecture,x,y,z+6.1,.26,1.65,.14,0x979BA4,a)
        box(lights,x,y+.66,z+6.06,.27,.5,.08,0xFFE6AF,a)
        x,y=path(d+9,5)
        shaft(architecture,x,y,z-.21,.13,.12,.92,0x4D555C,8)
        shaft(lights,x,y,z+.52,.13,.13,.18,0xFFDBB3,8)
        if d%84==12:
            x,y=path(d,-9)
            box(architecture,x,y,z+.32,2.25,.55,.12,0x9C7562,a)
            box(architecture,x,y-.19,z+.64,2.25,.12,.4,0x997567,a)
            for dx in (-.82,.82):box(architecture,x+dx,y,z-.13,.12,.47,.51,0x666A75,a)
    park_life(k, architecture, cyclist, lights)
    return {'efforts':0}


THEME={'lay':lay,'land_builder':land,'road_builder':road,'night':True,'land':{'mid':0x39453D},
       'terrain':{'sea':True},'haze':0x253852,'sky':[0x15192F,0x243956,0x566080,0x433A55,0x191E39],
       'light':[0xBACDEC,.9],'fill':[0x70839F,0x514556],'sun_altitude':.42,'sun_azimuth':.68,
       'palette':{'asphalt':0x754C57,'yellow':0xE7BA5B,'paint':0xBDADAC}}


def park_life(k, art, cyclists, lights):
    """Rental racks, active riders, picnickers and tree-lined sections alongside the path."""
    from mathutils import Vector
    rng=k.rng

    def strut(batch,a,b,r,c,n=6):
        a,b=Vector(a),Vector(b);axis=(b-a).normalized()
        u=axis.cross(Vector((0,0,1)) if abs(axis.z)<.92 else Vector((1,0,0))).normalized()*r
        v=axis.cross(u)
        for i in range(n):
            t=i*math.tau/n;s=(i+1)*math.tau/n
            e=u*math.cos(t)+v*math.sin(t);f=u*math.cos(s)+v*math.sin(s)
            batch.face((a+e,a+f,b+f,b+e),(lin(c),)*4)
    def frame(d,off,yaw=0):
        x,y=path(d,off);a=heading(x)+yaw;z=height(d)-(.12 if abs(off)>3.25 else -.015)
        def at(u,v,w):return (x+u*math.cos(a)-v*math.sin(a),y+u*math.sin(a)+v*math.cos(a),z+w)
        return at,a
    def bike(at,a,batch,rider=False):
        for x in (-.54,.54):
            for n in range(12):
                t=n*math.tau/12;s=(n+1)*math.tau/12
                end=at(x+.345*math.cos(t),0,.365+.345*math.sin(t))
                strut(batch,end,at(x+.345*math.cos(s),0,.365+.345*math.sin(s)),.031,0x252737,5)
                if n%3==0:strut(batch,end,at(x,0,.365),.009,0xBFCBCD,4)
        for (u,z),(v,h) in (((-.54,.365),(-.18,.82)),((-.54,.365),(0,.38)),((-.18,.82),(0,.38)),((0,.38),(.33,.80)),((-.18,.82),(.30,.68)),((.54,.365),(.30,.88)),((.30,.88),(.25,1.05))):
            strut(batch,at(u,0,z),at(v,0,h),.04,0x55C896)
        strut(batch,at(.25,-.21,1.05),at(.25,.21,1.05),.027,0xB1B7B6)
        batch.box(at(-.18,0,.83),(.23,.15,.06),a,lin(0x30333C))
        if rider:
            shirt=rng.choice((0xEAA89F,0x85B9D4,0x9CC77C,0xDDC980))
            for side in (-1,1):
                knee=.18 if side>0 else -.02
                strut(batch,at(-.18,side*.095,.96),at(knee,side*.115,.65),.079,0x34364C)
                strut(batch,at(knee,side*.115,.65),at(.04,side*.13,.38+side*.085),.06,0xA78172)
                strut(batch,at(-.02,side*.15,1.32),at(.25,side*.17,1.06),.045,0xC7A186)
            strut(batch,at(-.18,0,.96),at(-.03,0,1.34),.165,shirt,9)
            batch.tube(at(.02,0,1.34),.10,.115,.2,lin(0xBA9176),lin(0xDBB298),8)
            batch.tube(at(.02,0,1.52),.13,.09,.09,lin(shirt),lin(0xF7ECE2),9)
    # One origin-centred model supplies all the moving bike instances.
    bike(lambda x,y,z:(x,y,z),0,cyclists,True)
    for d in (106,1485,2980,4590,6510,8420):
        for j in range(5):
            at,a=frame(d+j*1.45,-5.7,.95);bike(at,a,art)
            art.box(at(.56,0,0),(.28,.22,.48),a,lin(0x648E85))
    for d in range(50,8750,41):
        for side in range(2):
            off=rng.uniform(-26,-12) if side==0 else rng.uniform(-52,-36)
            at,a=frame(d+rng.uniform(-8,8),off)
            h=rng.uniform(4.8,8.5)
            strut(art,at(0,0,-.2),at(.10,0,h*.78),.20,0x4D444B,7)
            for b in range(4):
                t=b*math.tau/4+rng.uniform(-.4,.4)
                dx,dy=math.cos(t)*1.5,math.sin(t)*1.5
                strut(art,at(.05,0,h*.40),at(dx,dy,h*.79),.09,0x554B4A)
                pt=at(dx,dy,h*.64+rng.uniform(-.45,.45))
                shade=lin(rng.choice((0x345548,0x416655,0x354E48,0x4D6857)))
                art.tube(pt,.48,1.8,1.05,lin(0x253B37),shade,8)
                art.tube((pt[0],pt[1],pt[2]+1.05),1.8,.54,1.55,shade,shade,8,shade)
    for d in (225,1440,1510,3010,4640,6450,8360,8460):
        for j in range(5):
            at,a=frame(d+j*2.8,-7.6-rng.random()*5)
            sitting=j%3==0
            h=.47 if sitting else .82
            shirt=lin(rng.choice((0xDC827D,0x799DB7,0xDED187,0x9C92B3)))
            for side in (-1,1):
                strut(art,at(0,.12*side,h),at(.3 if sitting else .03,.12*side,.03),.071,0x394357)
            art.tube(at(0,0,h),.15,.21,.47,shirt,shirt,8)
            art.tube(at(0,0,h+.47),.105,.14,.25,lin(0xB78F78),lin(0xDDB59B),8)
            art.tube(at(0,0,h+.68),.15,.12,.11,lin(0x514044),lin(0x453540),8)
