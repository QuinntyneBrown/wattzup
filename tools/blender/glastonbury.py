"""Worthy Farm's festival trackway, measured in metres along a closed centreline."""
from bisect import bisect_right
import math
from worldkit import Painted, lin

LENGTH=10515
PROFILE=((0,58),(700,64),(1570,88),(2500,66),(3450,60),(4630,80),(5620,65),
         (6890,72),(7830,99),(8750,76),(9610,68),(10515,58))

def curve(t):
    return (math.cos(t)+.17*math.sin(3*t)+.072*math.sin(6*t),
            .75*math.sin(t)+.15*math.cos(2*t)+.055*math.sin(5*t))

path=[curve(i*math.tau/8192) for i in range(8193)]
chain=[0.]
for a,b in zip(path,path[1:]):chain.append(chain[-1]+math.dist(a,b))
scale=LENGTH/chain[-1]

def position(d):
    s=d%LENGTH/scale
    i=min(len(path)-2,bisect_right(chain,s)-1)
    f=(s-chain[i])/(chain[i+1]-chain[i]);a,b=path[i:i+2]
    return (scale*(a[0]+f*(b[0]-a[0])),scale*(a[1]+f*(b[1]-a[1])),
            math.atan2(b[1]-a[1],b[0]-a[0]))

def elevation(d):
    d%=LENGTH
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);samples=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=position(d)
        turn=position(d+3)[2]-position(d-3)[2]
        samples.append(dict(x=x,y=y,z=elevation(d),h=h,k=math.atan2(math.sin(turn),math.cos(turn))/6,
                            d=d,g=100*(elevation(d+.5)-elevation(d-.5))))
    return samples,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

def land(road,col,theme,bc):
    def height(x,y):
        _,i,gap=road.tree.find((x,y,0));s=road.s[i]
        grade=min(1,max(0,(gap-6)/30))
        return s['z']-.19+grade*(gap*.067+1.4*math.sin(x*.024+y*.018))
    # Follow the verge closely and broaden the spacing towards the distant fields.
    mesh=bc.Builder('Somerset pasture','terrain');mesh.colours=[]
    offsets=(-420,-270,-150,-85,-45,-24,-12,-7,-4,0,4,7,12,24,45,85,150,270,420)
    def row(d):
        x,y,h=position(d)
        return [(x-math.sin(h)*v,y+math.cos(h)*v,height(x-math.sin(h)*v,y+math.cos(h)*v)) for v in offsets]
    prev=row(0)
    for d in range(10,LENGTH+10,10):
        nxt=row(min(d,LENGTH))
        for j,v in enumerate(offsets[:-1]):
            mesh.quad(prev[j],nxt[j],nxt[j+1],prev[j+1])
            noise=math.sin(d*.031+v)+.55*math.sin(d*.091-v*.43)
            colour=(0x8F8657 if abs(v)<14 else 0x819052) if noise>0 else (0x82764C if abs(v)<14 else 0x78894F)
            mesh.colours.extend([lin(colour)]*4)
        prev=nxt
    return mesh.build(col),height

def road_surface(road,st,length,col,theme,bc):
    panels=bc.Builder('Laid trackway panels','terrain');panels.colours=[]
    shoulder=bc.Builder('Churned wheel ruts','terrain');shoulder.colours=[]
    def pt(d,l,z):
        x,y,h=position(d);return x-math.sin(h)*l,y+math.cos(h)*l,elevation(d)+z
    def strip(batch,d,end,a,b,z,tone):
        batch.quad(pt(d,a,z),pt(end,a,z),pt(end,b,z),pt(d,b,z));batch.colours.extend([lin(tone)]*4)
    for i in range(math.ceil(length/3)):
        d=i*3;end=min(d+3,length)
        for side in (-1,1):
            strip(shoulder,d,end,*sorted((side*3.8,side*(6.45+.28*math.sin(i*.27)))),.004,0x66513C)
            strip(shoulder,d,end,*sorted((side*4.45,side*4.72)),.012,0x4D4036)
            if i%21<7:
                strip(shoulder,d,end,*sorted((side*5.02,side*(5.6+.12*math.sin(i)))),.027,0xA2A399)
        # Three parallel removable plates. The dark bedding remains visible at each joint.
        strip(panels,d,end,-3.87,3.87,.025,0x494840)
        for j in range(3):
            lo=-3.83+j*2.56;hi=lo+2.51
            tone=(0x93968C,0xA1A397,0x8D928A,0xA8A99C,0x969A90)[(i*3+j*7)%5]
            strip(panels,d+.035,end-.035,lo,hi,.049,tone)
            for side in (-1,1):
                u=lo+.11 if side<0 else hi-.19
                strip(panels,d+.17,d+.28,u,u+.08,.055,0x474A46)
    panels.build(col);shoulder.build(col)

def scenery(k):
    art=Painted(k);glow=Painted(k,'glint');rng=k.rng
    steel=lin(0x677573);dark=lin(0x303B3D);silver=lin(0xA4AFA8)
    fabric=(0x197789,0x46579B,0xB14C65,0xD69A3B,0x6D9768,0x6B457C,0xC7684D)
    def local(d,off):
        x,y,h=position(d);x-=off*math.sin(h);y+=off*math.cos(h)
        return x,y,k.height_at(x,y),h
    def frame(d,off,angle=0):
        x,y,z,h=local(d,off);h+=angle
        def point(u,v,w):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
        return point,h
    def bar(a,b,width,tone,model=art):
        # Square-section steel member, including the diagonal web of each truss.
        dx,dy,dz=(b[i]-a[i] for i in range(3));n=math.sqrt(dx*dx+dy*dy+dz*dz)
        if n<.001:return
        t=(dx/n,dy/n,dz/n);r=math.hypot(t[0],t[1])
        u=(-t[1]/r,t[0]/r,0) if r>.001 else (1,0,0)
        v=(t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0])
        def ring(p):return [tuple(p[i]+width*(a*u[i]+b*v[i])/2 for i in range(3)) for a,b in ((1,1),(-1,1),(-1,-1),(1,-1))]
        ends=list(map(ring,(a,b)))
        for j in range(4):
            m=(j+1)%4;model.face((ends[0][j],ends[0][m],ends[1][m],ends[1][j]),(tone,)*4)
    prints=Painted(k,'paint');prints.b.name='FestivalPrint';prints.b.uvs=[]
    def graphic(pts,region):
        prints.face(pts,(lin(0xFFFFFF),)*4)
        left,top,right,bottom=region
        prints.b.uvs.extend([(left,bottom),(right,bottom),(right,top),(left,top)])
    def stage(d,off,pyramid,label):
        pt,h=frame(d,off,.36 if off<0 else -.36)
        width=24 if pyramid else 18
        art.box(pt(0,0,.1),(16,width*2,2),h,dark)
        art.box(pt(7.8,0,2),(1.5,width*1.9,12.5),h,dark)
        apex=pt(4,0,26)
        if pyramid:
            for sign in (-1,1):
                corners=[apex,pt(-9,sign*width,2),pt(9,sign*width,2)]
                art.face(corners,(silver,steel,dark))
                bar(apex,pt(-9,sign*width,2),.60,silver)
                bar(apex,pt(-8.3,sign*(width-2),2),.34,dark)
                for i in range(12):
                    f=i/12;g=(i+1)/12
                    bar(pt(4-13*f,sign*width*f,26-24*f),
                        pt(4-12.3*g,sign*(width-2)*g,26-24*g),.16,steel)
            art.face([apex,pt(9,width,2),pt(9,-width,2)],(silver,steel,dark))
        else:
            art.box(pt(0,0,14.1),(18,width*2+3,1.35),h,steel)
            for a in (-8,8):
                for b in (-width,width):bar(pt(a,b,1),pt(a,b,14),.53,silver)
        graphic([pt(6.9,-14,2.15),pt(6.9,14,2.15),pt(6.9,14,11.5),pt(6.9,-14,11.5)],(0,0,1,341/512))
        graphic([pt(-8.1,-8,1.95),pt(-8.1,8,1.95),pt(-8.1,8,4.6),pt(-8.1,-8,4.6)],
                (label/3,342/512,(label+1)/3,425/512))
        for sign in (-1,1):
            y=sign*(width+5)
            art.box(pt(-5,y,1),(1.2,1.2,13),h,steel)
            art.box(pt(-5,y,7),(1.4,8.7,6.7),h,dark)
            for i in range(8):
                colour=lin(fabric[(i+(0 if sign<0 else 3))%7])
                glow.box(pt(-5.82,y+(i-3.5)*.91,7.8+1.15*math.sin(i)),(.14,.89,3.65),h,colour)
        for i in range(13):
            glow.box(pt(-2,(i-6)*1.95,11.8),(.65,.68,.66),h,lin((0xFDB481,0xFF8CB8,0xADDDF2)[i%3]))
            graphic([pt(-5.85,y-3.55,7.45),pt(-5.85,y+3.55,7.45),pt(-5.85,y+3.55,13.45),pt(-5.85,y-3.55,13.45)],(.23,0,.66,341/512))
        for i in range(5):
            art.box(pt(-6,i*3-6,2.15),(1.15,1.65,1.25),h,dark)
    stage(258,-34,True,0);stage(3620,-28,False,1);stage(3860,44,False,2)
    # The four radial legs of the Arcadia spider carry the suspended industrial body.
    pt,h=frame(5790,-27)
    for i in range(6):
        t=i*math.tau/6
        def joint(r,z):return pt(math.cos(t)*r,math.sin(t)*r,z)
        hip,knee,foot=joint(3.8,8),joint(11.8,15),joint(23,.25)
        for a,b,w in ((hip,knee,1.45),(knee,foot,1.05)):
            bar(a,b,w,steel);bar(tuple(x+.5 for x in a),tuple(x+.5 for x in b),.28,dark)
        art.tube(knee,1.2,1.05,1.1,dark,silver,10)
    art.tube(pt(0,0,6.3),3.3,5.8,3.7,dark,steel,12)
    art.tube(pt(0,0,10),5.8,2.7,3.3,steel,dark,12)
    for sign in (-1,1):glow.box(pt(-4.3,sign*1.7,9),(.9,1.3,.8),h,lin(0xF0A14E))
    pt,h=frame(8020,18)
    for i in range(16):
        t=i*math.tau/16
        bar(pt(2.7*math.cos(t),2.7*math.sin(t),.1),pt(2.7*math.cos(t),2.7*math.sin(t),18.5),.15,silver)
        for j in range(12):
            a=t+j*.061;b=a+.061
            corners=(pt(3*math.cos(a),3*math.sin(a),5+j*1.05),pt(3*math.cos(a+.28),3*math.sin(a+.28),5+j*1.05),
                     pt(3*math.cos(b+.28),3*math.sin(b+.28),6.05+j*1.05),pt(3*math.cos(b),3*math.sin(b),6.05+j*1.05))
            art.face(corners,(lin(fabric[i%7]),)*4)
    art.tube(pt(0,0,17.5),4.6,4.6,1.2,steel,silver,20)
    art.tube(pt(0,0,18.7),5,.25,3,lin(0xB45C84),lin(0xE699AF),20)
    # Four tent panels and their contrasting arched rainfly, pegged on each campsite slope.
    for d in range(30,LENGTH,9):
        for side in (-1,1):
            if min(abs(d-s) for s in (140,3515,3720,5692,7901))<60:continue
            groups=4 if 1050<d<2200 or 7100<d<8200 else 1 if rng.random()<.42 else 0
            for row in range(groups):
                pt,h=frame(d+rng.uniform(-3,3),side*(15+row*8+rng.uniform(0,6)),rng.uniform(-.75,.75))
                tone=lin(rng.choice(fabric));fly=lin(rng.choice((0xBAC5AC,0x4A767B,0x899C81,0xA19692)))
                last=None
                for j in range(5):
                    t=j*math.pi/8;r=max(.06,math.cos(t));z=1.75*math.sin(t)
                    ring=[pt(2.1*r*math.cos(i*math.tau/8),1.6*r*math.sin(i*math.tau/8),z) for i in range(8)]
                    if last:
                        for i in range(8):
                            n=(i+1)%8;art.face((last[i],last[n],ring[n],ring[i]),(fly if i in (1,5) else tone,)*4)
                    last=ring
    # Fields of fans around each stage, seen behind the nearer walkers.
    for station,side in ((258,-1),(3620,-1),(3860,1),(5790,-1),(8020,1)):
        for i in range(235):
            d=station-rng.uniform(14,105);off=side*rng.uniform(9.5,39)
            x,y,z,h=local(d,off);a=rng.uniform(.83,1.12)
            top=lin(rng.choice(fabric));skin=lin(rng.choice((0xAF8066,0xD5AA86,0x946A50)))
            art.tube((x,y,z),.18,.18,.73*a,dark,steel,5)
            art.tube((x,y,z+.68*a),.25,.22,.64*a,top,top,6)
            art.tube((x,y,z+1.32*a),.13,.14,.26*a,skin,skin,7)
            if i%4==0:art.tube((x,y,z+1.55*a),.18,.13,.09,top,top,7)
    # Hedgerows divide the campsites. The fixed Tor closes the long view behind them.
    for d in range(0,LENGTH,17):
        for side in (-1,1):
            if (d//180)%5==0:continue
            x,y,z,h=local(d,side*(70+9*math.sin(d/80)))
            art.tube((x,y,z-.28),4.1,3.2,2.5,lin(0x546348),lin(0x6F8151),8)
            if (d//17)%8==0:k.broadleaf(x,y,z,rng.uniform(.78,1.15))
    pt,h=frame(1940,120)
    for i in range(8):
        art.tube(pt(0,0,i*5.2),105-i*11,94-i*11,5.2,lin(0x71834D),lin(0x87965A),36)
    art.box(pt(0,0,41),(6.5,5.4,13),h,lin(0x928878))
    for x in (-3,3):
        for y in (-2.5,2.5):art.box(pt(x,y,41),(.9,.9,15),h,lin(0xA19783))
    # Patchwork pastures extend beyond the campsite. Taller ridges carry clumps of trees.
    for d in range(0,LENGTH,78):
        for side in (-1,1):
            x,y,z,h=local(d,side*(220+45*math.sin(d/260)))
            height=12+7*math.sin(d/180)+5*math.cos(d/81)
            art.tube((x,y,z-7),78,40,height,lin(0x727D54),lin(0x889461),11)
            art.tube((x,y,z-7+height),40,3,5,lin(0x889461),lin(0x889461),11)
            if d%3==0:k.broadleaf(x,y,z-3+height,.86)
    bulbs=Painted(k,'neon-amber');bulbs.b.name='FestivalBulbs'
    for d in list(range(0,251,17))+list(range(3350,3610,17))+list(range(10160,10510,17)):
        a,h=frame(d,-6.8);b,_=frame(d,6.8)
        for end in (a,b):bar(end(0,0,0),end(0,0,6.4),.16,steel)
        start=a(0,0,6.3);end=b(0,0,6.3);prev=start
        for j in range(1,17):
            f=j/16;cord=tuple(start[i]*(1-f)+end[i]*f-(.95*math.sin(math.pi*f) if i==2 else 0) for i in range(3))
            bar(prev,cord,.055,dark);prev=cord
            if j<16:
                x,y,z=cord;bulbs.tube((x,y,z-.24),.092,.13,.21,lin(0xFFF4AE),lin(0xFFFFCD),7)
    for d in range(0,LENGTH,32):
        if min(abs(d-s) for s in (120,3400,5670,7810,10300))>185:continue
        side=1 if d%3 else -1;pt,h=frame(d,side*12)
        colour=lin(rng.choice(fabric))
        art.box(pt(0,0,.15),(5,2.9,2.4),h,colour)
        art.box(pt(0,-side*1.5,.92),(4.4,.12,1.18),h,dark)
        graphic([pt(-2,-side*1.54,2.01),pt(2,-side*1.54,2.01),pt(2,-side*1.54,2.89),pt(-2,-side*1.54,2.89)],(0,427/512,1/3,1))
        art.box(pt(0,-side*1.72,2.25),(5.4,1.24,.23),h,lin(0xE8C590))
        for i in range(6):glow.box(pt(i*.78-1.99,-side*2.3,2.38),(.12,.12,.14),h,lin(0xFFDC94))
        art.tube(pt(4,-side*2,0),.41,.48,1.05,dark,steel,9)
        for u in (-6,6):bar(pt(u,-side*4,.08),pt(u,-side*4,1.32),.09,silver)
        for z in (.4,1.22):bar(pt(-6,-side*4,z),pt(6,-side*4,z),.08,silver)
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road_surface,'land':{'mid':0x80905A},
       'terrain':{'sea':False},'wet':.46,'sky':[0xB0BBC5,0xD5BFA8,0xEACAA2,0xBFB6B1,0x9DABB5],
       'haze':0xD5C6B0,'light':[0xFFE1B4,1.65],'fill':[0xD8E1E2,0x907D61],
       'sun_altitude':.31,'sun_azimuth':2.45,'palette':{'asphalt':0x8C928B,'paint':0xE4DEBB}}
