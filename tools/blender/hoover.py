"""Old US 93 descends to the curved crest; the road then follows the reservoir."""
import math
from worldkit import Painted, lin

LENGTH = 13175
CREST = (4700, 5080)
LAKE = 342
RIVER = 172
PROFILE = ((0,478),(650,461),(1650,431),(2310,419),(3440,393),(4310,377),
           (4660,373),(5110,373),(5920,389),(6810,398),(7610,386),(8710,401),
           (9830,391),(10630,401),(11800,405),(13175,416))

def elevation(d):
    for (a,z),(b,h) in zip(PROFILE, PROFILE[1:]):
        if d<=b:
            return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]

def ease(v):
    v=max(0,min(1,v))
    return v*v*(3-2*v)

def direction(d):
    if d<CREST[0]:
        approach=.38*math.sin(d/224)+.24*math.sin(d/102)
        for centre,sign in ((690,1),(1490,-1),(2380,1),(3230,-1)):
            approach+=1.26*sign*math.exp(-((d-centre)/114)**2)
        # The bypass arch is first seen from the west, looking downstream across its side.
        approach+=.84*math.exp(-((d-4345)/128)**2)
        blend=ease((d-4520)/180)
        return approach*(1-blend)+.69*blend
    if d<=CREST[1]:
        return .69-1.38*(d-CREST[0])/(CREST[1]-CREST[0])
    shore=-.21+.46*math.sin((d-5150)/490)+.25*math.sin((d-5060)/158)
    blend=ease((d-CREST[1])/240)
    return -.69*(1-blend)+shore*blend

points=[(-150.,0.)]
for d in range(-149,LENGTH+401):
    x,y=points[-1];a=direction(d-.5)
    points.append((x+math.cos(a),y+math.sin(a)))

def pos(d,off=0):
    i=max(0,min(len(points)-2,math.floor(d)+150));t=d+150-i
    x,y=points[i];u,v=points[i+1];a=direction(d)
    return x+(u-x)*t-off*math.sin(a), y+(v-y)*t+off*math.cos(a)

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=direction(d),
                         k=direction(d+.5)-direction(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
    return rows,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

def road(r,st,length,col,bc):
    paving=bc.Builder('Road','asphalt');yellow=bc.Builder('CentreLine','yellow');white=bc.Builder('EdgeLines','paint')
    for i in range(len(r.s)-1):
        def stripe(batch,lft,rgt,z):
            batch.quad(r.at(i,lft,z),r.at(i,rgt,z),r.at(i+1,rgt,z),r.at(i+1,lft,z))
        stripe(paving,4.65,-4.65,.015)
        for u in (-.13,.13):stripe(yellow,u+.065,u-.065,.028)
        for u in (-4.29,4.29):stripe(white,u+.06,u-.06,.028)
    for b in (paving,yellow,white):b.build(col)

def surface(batch,vertices,tone):
    base=lin(tone)
    if batch.name=='BlackCanyon':
        from mathutils import Vector
        a,b,c=(Vector(p) for p in vertices[:3]);n=(b-a).cross(c-a).normalized()
        if n.z<0:n=-n
        light=.66+.38*max(0,n.x*-.46+n.y*.55+n.z*.70)
        base=tuple(v*light for v in base[:3])+(1.,)
    batch.quad(*vertices);batch.colours.extend([base]*4)

def land(r,col,theme,bc):
    rock=bc.Builder('BlackCanyon','terrain');rock.colours=[]
    water=bc.Builder('MeadWater','sea');water.colours=[]
    def side(d,sign):
        z=elevation(d);closeness=1-ease(max(CREST[0]-d,d-CREST[1],0)/240)
        at=lambda width,h:(*pos(d,width*sign),h)
        if CREST[0]<=d<=CREST[1]:
            bottom=RIVER if sign==1 else LAKE
            return [at(4.64,z-.08),at(7,z-.08),at(7.5,z-1),at(8,z-2),
                    at(8.4,z-5),at(10,bottom),at(15,bottom-1),at(25,bottom-3)]
        relief=7*math.sin(d/43)+11*math.sin(d/131)
        if sign==-1 and d>CREST[1]:
            return [at(4.64,z-.09),at(6.5,z-.34),at(10,z-2),at(18,z-7),
                    at(32,361+3*math.sin(d/91)),at(40,354),at(52,LAKE),at(65,LAKE-5)]
        if sign==1 and 4070<d<4700:
            opening=ease((d-4070)/170)*ease((4800-d)/100)
            return [at(width,z+height*opening) for width,height in
                    ((4.64,-.08),(6.4,-.4),(10,-2),(18,-7),(35,-20),(65,-42),(115,-93),(205,-152))]
        cut=(1 if sign==1 else .54)*max(.12,.55+.45*math.sin(d/241+sign*.7))
        fissure=math.sin(d*.041+sign)*.50+math.sin(d*.089+3*sign)*.32+math.sin(d*.172)*.18
        return [at(4.64,z-.08),at(6.4,z-.31),at(10+1.3*fissure,z+.4),
                at(17+3.7*fissure,z+(5+4*fissure)*cut),
                at(25+7*fissure,z+(20+10*fissure)*cut),at(44+9*fissure,z+(39+relief+10*fissure)*cut-60*closeness),
                at(108+14*fissure,z+61*cut+1.8*relief+18*fissure-160*closeness),
                at(230+18*fissure,z+86*cut+2*relief+23*fissure-225*closeness)]
    for sign in (-1,1):
        previous=None
        for d in range(-88,LENGTH+205,8):
            row=side(d,sign)
            if previous:
                for i,tone in enumerate((0xAA9579,0xAC916E,0x9A7356,0x805943,0x654B42,0x755247,0x785850)):
                    if sign==-1 and d>CREST[1] and i in (5,6):tone=0xDAD1BB
                    surface(rock,(previous[i],row[i],row[i+1],previous[i+1]),tone)
            previous=row
    previous=None
    for d in range(4650,LENGTH+210,10):
        x,y=pos(d,-10)
        row=[(x,y,LAKE-.04),(x,y-350,LAKE-.04),(x,y-2100,LAKE-.04)]
        if previous:
            for i in (0,1):surface(water,(previous[i],row[i],row[i+1],previous[i+1]),0x255C71)
        previous=row
    cx,cy=pos(4890)
    # Downstream canyon: a narrow channel, alluvial shelves and dark walls.
    for sign in (-1,1):
        previous=None
        for y in range(26,1340,9):
            centre=cx+16*math.sin(y/93)+y*.10
            foot=29+9*math.sin(y/101)
            rim=155+.09*y+22*math.sin(y/81)
            heights=(0,1.2,14,38,77,126,185,227,257)
            row=[]
            for j,(width,h) in enumerate(zip((0,foot,foot+9,foot+24,foot+47,rim*.77,rim,rim+47,rim+92),heights)):
                irregular=math.sin(y/29+j)*5+math.sin(y/11+j*.5)*2.6
                if sign==-1:
                    # A natural opening through the west shoulder exposes the downstream arch.
                    h*=1-.58*ease((y-3)/47)*ease((340-y)/53)
                row.append((centre+sign*(width+(irregular if j>1 else 0)),cy+y,RIVER+h+(irregular*1.1 if j>2 else 0)))
            if previous:
                for j,c in enumerate((0x397279,0x8D8B75,0x766758,0x654E43,0x60463F,0x765344,0x885F4D,0x815C52)):
                    surface(water if j==0 else rock,(previous[j],row[j],row[j+1],previous[j+1]),c)
            previous=row
    # The mineral strand follows a continuous far shore above the water.
    previous=None
    for d in range(4550,LENGTH+601,37):
        x,y=pos(d,-95);y-=450+130*math.sin(d/770)+69*math.sin(d/267)
        row=[(x,y-o,LAKE+h) for o,h in ((0,-1),(8,3),(24,13),(36,16.5),(49,20),(92,47+13*math.sin(d/66)),(201,81+21*math.sin(d/103)),(385,140+43*math.sin(d/181)+23*math.sin(d/49)),(750,158+67*math.sin(d/550)))]
        if previous:
            for j,c in enumerate((0xB0B6A5,0xD7D3BF,0xEAE1CA,0xE2D9C6,0x806456,0x855E50,0x815D54,0x9E776A)):
                surface(rock,(previous[j],row[j],row[j+1],previous[j+1]),c)
        previous=row
    # Continuous outer basin floor joins the middle-distance rock to the
    # panorama even where a view looks out underneath the long bypass span.
    for y in range(1140,3320,40):
        for x in range(-1300,1460,60):
            def ridge(u,v):
                height=184+98*math.sin(u/435+v/590)+57*math.cos(u/152-v/260)
                return (cx+u,cy+v,RIVER+height*.5+(v-1140)*.09)
            surface(rock,(ridge(x,y),ridge(x+60,y),ridge(x+60,y+40),ridge(x,y+40)),0x83685C)
    for b in (rock,water):b.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.15

def beam(batch,a,b,r,colour,sides=6):
    from mathutils import Vector
    a,b=Vector(a),Vector(b);axis=(b-a).normalized()
    v=axis.cross(Vector((0,0,1) if abs(axis.z)<.9 else (1,0,0))).normalized()*r
    u=axis.cross(v);last=None
    for k in range(sides+1):
        angle=k*math.tau/sides
        offset=math.cos(angle)*u+math.sin(angle)*v
        pair=(tuple(a+offset),tuple(b+offset))
        if last:batch.face((last[0],pair[0],pair[1],last[1]),(colour,)*4)
        last=pair

def dam_structures(k,art):
    cx,cy=pos(4890);concrete=lin(0xDDCCB1);shadow=lin(0xAE9678);bronze=lin(0x576354)
    deck=373.; face=Painted(k,'whitewash');face.b.name='DamFace';face.b.uvs=[]
    def panel(batch,pts,c,uv):
        batch.face(pts,(c,)*4);batch.b.uvs.extend(uv)
    # Buttressed curved face thickens at the foot. Individual poured lifts
    # step back from the Colorado-side toe towards the crest.
    for d in range(4700,5080,5):
        for j in range(20):
            a=j/20;b=(j+1)/20
            def side(s,t):
                return (*pos(s,7.5+43*(1-t)**1.55),RIVER+201*t)
            panel(face,(side(d,a),side(d+5,a),side(d+5,b),side(d,b)),concrete,
                  [(d/14,a*14),((d+5)/14,a*14),((d+5)/14,b*14),(d/14,b*14)])
    # Twin arches and their upright spandrel columns cross the river downstream.
    bridge=Painted(k,'peaks');bridge.b.name='BypassArch'
    bx,by=cx+4,cy+306
    for j in range(54):
        u=-170+j*340/54;v=u+340/54
        za=312+119*(1-(u/170)**2);zb=312+119*(1-(v/170)**2)
        for off in (-6.8,6.8):
            beam(bridge,(bx+u,by+off,za),(bx+v,by+off,zb),3.6,concrete,8)
    for u in range(-216,221,20):
        lo=312+119*(1-(u/170)**2) if abs(u)<171 else 305
        for off in (-6.8,6.8):bridge.box((bx+u,by+off,lo),(2.8,3.0,443-lo),0,shadow)
    bridge.box((bx,by,443),(465,22,3.8),0,concrete)
    for off in (-10.8,10.8):bridge.box((bx,by+off,446.7),(465,.6,1.2),0,concrete)
    # Crown mesh is also the landmark for the rider sightline acceptance path.
    crown=Painted(k,'neon-lime');crown.b.name='IntakeCrown'
    clocks=Painted(k,'neon-pink');clocks.b.name='DamClocks';clocks.b.uvs=[]
    for idx,(d,off) in enumerate(((4752,-24),(4794,-79),(5005,-22),(5047,-81))):
        x,y=pos(d,off)
        art.tube((x,y,LAKE-1),8.6,7.1,43,shadow,concrete,24,concrete)
        for j in range(12):
            angle=j*math.tau/12;v=7.45
            art.box((x+v*math.cos(angle),y+v*math.sin(angle),LAKE-1),
                    (1.9,1.37,40.5),angle,lin(0xCEBB9D))
            art.box((x+6.4*math.cos(angle),y+6.4*math.sin(angle),383),
                    (.47,2.50,5.1),angle,lin(0x383C3C))
        cap=crown if idx==2 else art
        for z,r,h in ((381.8,8.5,1.5),(383.3,6.65,5.8),(389.1,7.15,.85),(389.95,5.5,1.4)):
            cap.tube((x,y,z),r,r-.08,h,shadow,concrete,24,concrete)
        for j in range(12):
            ang=math.tau*j/12
            art.box((x+6.62*math.cos(ang),y+6.62*math.sin(ang),383.3),
                    (.45,1.8,4.45),ang,lin(0x536065))
        # The inspection footbridges reach each tower from the crest pavement.
        start=pos(d,-7.5);end=(x,y);mx=(start[0]+x)/2;my=(start[1]+y)/2
        yaw=math.atan2(y-start[1],x-start[0]);l=math.dist(start,end)
        art.box((mx,my,372.1),(l,2.85,.42),yaw,concrete)
        for v in (-1.38,1.38):
            art.box((mx-v*math.sin(yaw),my+v*math.cos(yaw),372.5),(l,.20,.8),yaw,concrete)
        if idx in (0,2):
            a=direction(d);p=lambda u,w:(x+u*math.cos(a)-7.9*math.sin(a),y+u*math.sin(a)+7.9*math.cos(a),w)
            panel(clocks,(p(-1.65,382.4),p(1.65,382.4),p(1.65,385.7),p(-1.65,385.7)),
                  concrete,[(0,0),(1,0),(1,1),(0,1)])
    # Visitors walk between the Deco lamps; one dark base supports each bronze figure.
    for d in range(4708,5085,24):
        for off in (-7,7):
            x,y=pos(d,off);z=elevation(d)+1.22
            art.tube((x,y,z),.16,.08,3.25,bronze,bronze,8)
            art.tube((x,y,z+3.24),.17,.24,.62,lin(0xD5C499),lin(0xFFF1CF),8)
            art.tube((x,y,z+3.86),.26,.20,.13,bronze,bronze,8,bronze)
    plaza=Painted(k,'neon-cyan');plaza.b.name='Terrazzo';plaza.b.uvs=[]
    a=direction(5154)
    def pl(u,v,z):
        x,y=pos(5154,13);return x+u*math.cos(a)-v*math.sin(a),y+u*math.sin(a)+v*math.cos(a),elevation(5154)+z
    art.box(pl(0,0,-12),(23,16,12.4),a,concrete)
    panel(plaza,(pl(-11,-8,.42),pl(11,-8,.42),pl(11,8,.42),pl(-11,8,.42)),concrete,[(0,0),(1,0),(1,1),(0,1)])
    art.tube(pl(0,0,.43),.14,.07,16,shadow,concrete,10)
    for u in (-3.7,3.7):
        art.box(pl(u,0,.42),(2.7,3.1,1.9),a,lin(0x282C2A))
        art.box(pl(u,0,2.3),(1.03,.86,1.25),a,bronze)
        art.tube(pl(u,-.1,3.52),.53,.40,1.05,bronze,lin(0x68776B),8)
        art.tube(pl(u,-.2,4.56),.22,.25,.45,bronze,lin(0x778371),8,bronze)
        for side in (-1,1):
            beam(art,pl(u+side*.3,-.22,3.1),pl(u+side*.37,-.94,3.05),.17,bronze)
            beam(art,pl(u+side*.37,-.94,3.05),pl(u+side*.39,-.94,2.27),.16,bronze)
            wing=[pl(u+side*.38,.26,3.8),pl(u+side*.50,1.35,4.1),
                  pl(u+side*.93,1.02,11.5),pl(u+side*.68,.38,10.1)]
            art.face(wing,(bronze,lin(0x46554A),lin(0x889B86),bronze))
    # Powerhouses, transformers and lattice pylons climb the volcanic walls.
    for side in (-1,1):
        ax,ay=pos(4890+side*108,49);art.box((ax,ay,RIVER),(90,26,20),0,shadow)
        for j in range(9):art.box((ax-40+10*j,ay,RIVER+20),(7,20,.8),0,concrete)
    previous=None
    for d,u,h in ((4380,87,32),(4570,119,38),(4690,180,46),(4930,225,41),(5160,103,42),(5420,112,40),(5760,105,39)):
        x,y=pos(d,u);z=elevation(d)+16+max(0,u-100)*.10
        for sx in (-1,1):
            for sy in (-1,1):
                beam(art,(x+sx*3.5,y+sy*3.5,z),(x+sx*.82,y+sy*.82,z+h),.25,lin(0x686963))
        for j in range(5):
            t=j/5;k2=(j+1)/5;r=3.5*(1-t)+.82*t;r2=3.5*(1-k2)+.82*k2
            for sy in (-1,1):
                for sx in (-1,1):
                    beam(art,(x+sx*r,y+sy*r,z+t*h),(x-sx*r2,y+sy*r2,z+k2*h),.11,lin(0x74736A))
        levels=[(x+v,y,z+h-3) for v in (-7,0,7)]
        beam(art,levels[0],levels[-1],.36,lin(0x62655F))
        if previous:
            for p,q in zip(previous,levels):
                old=p
                for j in range(1,11):
                    t=j/10;pt=tuple(p[i]*(1-t)+q[i]*t-(4.5*math.sin(math.pi*t) if i==2 else 0) for i in range(3))
                    beam(art,old,pt,.062,lin(0x414343),4);old=pt
        previous=levels


def landscape_details(k,art):
    crags=Painted(k,'sail-pink');crags.b.name='CanyonCrags'
    rng=k.rng
    # Deep landscape card, behind the parallax of the canyon and the far shoreline.
    basin=Painted(k,'sail');basin.b.name='BoulderBasin';basin.b.uvs=[]
    cx,cy=pos(6500)
    for j in range(20):
        a=j*math.tau/20;b=(j+1)*math.tau/20
        def far(t,z):return (cx+7700*math.cos(t),cy+7700*math.sin(t),z)
        art_colour=lin(0xffffff)
        basin.face((far(a,-540),far(b,-540),far(b,2240),far(a,2240)),(art_colour,)*4)
        left=(j%5)/5;right=left+.2
        if j//5%2:left,right=1-left,1-right
        basin.b.uvs.extend([(left,0),(right,0),(right,1),(left,1)])
    # Sparse creosote clumps grow from several pale woody stems; loose scree
    # occupies the gaps. Road cuts retain their dry masonry parapets.
    for d in range(-36,LENGTH+38,11):
        if 4670<d<5110:continue
        for side in (-1,1):
            off=side*rng.uniform(6.9,11.9);x,y=pos(d+rng.uniform(-2,2),off);z=elevation(d)-.24
            if side==-1 and d>CREST[1] or side==1 and 4070<d<4700:
                z-=max(0,abs(off)-6.1)*.51
            h=rng.uniform(.29,.66);shade=lin(rng.choice((0x79764A,0x6F724C,0x8B8050,0x6D6841)))
            for n in range(7):
                angle=n*.897+rng.uniform(-.24,.24);spread=rng.uniform(.50,.94)*h
                u=x+spread*math.cos(angle);v=y+spread*math.sin(angle)
                reach=h*rng.uniform(.55,.97)
                beam(art,(x,y,z),(u,v,z+reach),.020,lin(0x8E7C61),4)
                for m in range(2):
                    ox=u+.17*h*math.sin(angle+m*2.9);oy=v-.17*h*math.cos(angle+m*2.9)
                    art.tube((ox,oy,z+reach*.52),h*.13,h*.18,reach*.33,shade,shade,4)
                    art.tube((ox,oy,z+reach*.85),h*.18,.011,reach*.19,shade,lin(0x969465),4)
            for n in range(3):
                x,y=pos(d+rng.uniform(-3,3),side*rng.uniform(5.2,7.9))
                rad=rng.uniform(.08,.37)
                art.tube((x,y,z+.1),rad,.32*rad,rad*.66,lin(0x796456),lin(0xA78E72),5)
        if d<4500 and d%55 in (19,30) or d>5150 and d%55==19:
            # Columns of welded breccia break through the finer talus. Each
            # outcrop has one weathered vertical face and a shorter scree toe.
            side=1 if d>4100 or math.sin(d/132)>.12 else -1
            if not (side==1 and 4010<d<4690):
                a=direction(d);offset=side*rng.uniform(11,24);x,y=pos(d,offset)
                base=elevation(d)-2.4
                for n in range(5):
                    turn=rng.random()*math.tau;rad=rng.uniform(1.1,4.4)
                    ox=x+math.cos(turn)*rad;oy=y+math.sin(turn)*rad
                    h=rng.uniform(3.0,10.5);w=rng.uniform(2.4,6.1)
                    turn=rng.random()*math.tau
                    outline=[rng.uniform(.77,1.2) for _ in range(8)]
                    layers=[]
                    for t,scale,tilt in ((0,1,0),(.37,.93,.18),(.61,.76,-.04),(.83,.59,-.15),(1,.23,-.30)):
                        ring=[]
                        for j,radius in enumerate(outline):
                            angle=turn+j*math.tau/8
                            r0=w*radius*scale*rng.uniform(.86,1.13)
                            ring.append((ox+math.cos(angle)*r0+tilt*w,oy+math.sin(angle)*r0*.82,
                                         base+h*t+rng.uniform(-.13,.13)*h))
                        layers.append(ring)
                    for l,rim in enumerate(layers[:-1]):
                        top=layers[l+1]
                        for j in range(8):
                            i=(j+1)%8;tone=lin(rng.choice((0x956E58,0x846459,0x987568,0x7B6155)))
                            gain=.68+.32*max(0,math.cos(turn+j*math.tau/8-.54))
                            tone=tuple(v*gain for v in tone[:3])+(1.,)
                            crags.face((rim[j],rim[i],top[i]),(tone,)*3)
                            crags.face((rim[j],top[i],top[j]),(tone,)*3)
                    crags.face(layers[-1],(lin(0xB2977C),)*8)
        if d<4500 and (d//125)%3!=0:
            a=direction(d);z=elevation(d);x,y=pos(d,5.3)
            for u in range(-5,6,2):
                vx,vy=pos(d+u,5.3)
                art.box((vx,vy,z-.14),(1.95,.64,.89),a,lin(rng.choice((0x806F62,0x978174,0xA28B76,0x8F7B68))))
            art.box((x,y,z+.72),(10.75,.68,.12),a,lin(0xC0A78A))
    visitor=Painted(k,'neon-amber');visitor.b.name='CrestVisitor'
    for v in (-.095,.095):
        visitor.tube((0,v,0),.075,.097,.84,lin(0x373C4A),lin(0x505B66),7)
    visitor.tube((0,0,.84),.16,.23,.55,lin(0xA15239),lin(0xBC7752),8)
    visitor.tube((0,0,1.39),.12,.14,.26,lin(0xBB8968),lin(0xD9AB88),9)
    visitor.tube((0,0,1.64),.22,.19,.045,lin(0xC9AC7E),lin(0xDCCA9E),12,lin(0xDCCA9E))
    visitor.tube((0,0,1.68),.13,.11,.10,lin(0xBDA27E),lin(0xE0CEAD),10,lin(0xE0CEAD))
    for side in (-1,1):beam(visitor,(0,side*.19,1.31),(.17,side*.24,.91),.066,lin(0xB87F5C))
    haze=Painted(k,'neon-violet');haze.b.name='RoadShimmer'
    for d in range(5600,LENGTH,96):
        for u in (-3,0,3):
            pts=[(*pos(d+t,v),elevation(d+t)+h) for t,v,h in ((0,u-1.28,.055),(0,u+1.28,.055),(9,u+1.2,.09),(9,u-1.2,.09))]
            haze.face(pts,(lin(0xC5C6BF),)*4)
    # Small stationary groups lean over either parapet.
    for d in range(4706,5076,17):
        x,y=pos(d,k.rng.choice((-6.23,6.22)));z=elevation(d)+.22
        top=lin(k.rng.choice((0x8E493B,0x4D7785,0xB49661,0xDED3C1,0x636D52)))
        for side in (-.1,.1):art.tube((x+side,y,z),.075,.09,.84,lin(0x57565A),lin(0x645F5F),7)
        art.tube((x,y,z+.84),.15,.22,.54,top,top,8)
        art.tube((x,y,z+1.38),.13,.14,.25,lin(0xAF805F),lin(0xD1A787),8)

def scenery(k):
    art=Painted(k)
    for d in range(CREST[0],CREST[1]+1,4):
        a=direction(d);z=elevation(d)
        for off in (-7.2,7.2):
            art.box((*pos(d,off),z-.08),(4.05,.65,1.20),a,lin(0xDECDB0))
            art.box((*pos(d,off),z+1.12),(4.05,.76,.13),a,lin(0xE7DCC3))
    dam_structures(k,art)
    landscape_details(k,art)
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0xA87C60},'terrain':{'sea':False},
       'haze':0xCBD2D8,'sky':[0xCCD8DF,0x90B8D7,0x669DC6,0x4384BA,0x3268A5],
       'light':[0xFFF0CF,1.85],'fill':[0xC3D7E4,0xAA825D],'sun_altitude':.96,'sun_azimuth':2.46,
       'palette':{'asphalt':0x555453,'yellow':0xE2B64E,'paint':0xDFDCCD}}
