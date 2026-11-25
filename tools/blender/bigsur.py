"""Highway 1, the open-spandrel arches at Rocky Creek and Bixby Canyon, and McWay Cove."""
import math
from mathutils import Vector
from worldkit import Painted, lin, smooth


# Station at arch crown, deck half-length, clear arch half-span, arch rise, deck elevation.
BRIDGES = ((290, 84, 38, 28, 43), (1480, 130, 55, 61, 80))


def heading(d):
    heading = .22*math.sin(d/400) + .19*math.sin(d/214)
    for start,deck,end in ((70,290,420),(1020,1480,1660),(3020,3350,3580),(5350,5790,6090),(11700,12200,12600)):
        heading -= .96 * (smooth(start-130,start+65,d)-smooth(start+85,deck-58,d)) if deck-start>210 else 0
        heading += .66 * (smooth(deck-120,deck-40,d)-smooth(end,end+150,d))
    # Both concrete structures have a straight deck.
    for mid,half,span,rise,z in BRIDGES:
        blend = 1-smooth(half-1,half+95,abs(d-mid))
        heading += blend*(.50-heading)
    return heading


def height(d):
    base=53+19*math.sin(d/810)+11*math.sin(d/335)+7*math.sin(d/171)
    for mid,half,span,rise,z in BRIDGES:
        blend=1-smooth(half,half+240,abs(d-mid));base+=blend*(z-base)
    return base


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=heading(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=heading(d),k=heading(d+.5)-heading(d-.5),g=(height(d+.5)-height(d-.5))*100))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,0


def terrain(d,l):
    z=height(d)-.13
    if l>5: z+=(l-5)*(.65+.31*math.sin(d/290)+.13*math.cos(d/115))
    elif l < -5:
        v=-l-5
        toe=61+18*math.sin(d/289)+13*math.sin(d/106)
        z+=(1.8-z)*smooth(0,toe,v)
        z-=max(0,v-toe)*.23
    for mid,half,span,rise,deck in BRIDGES:
        # The ravine cuts across Highway 1 and opens out towards the Pacific.
        canyon=1-smooth(half*.20,half+21+max(0,-l)*.34,abs(d-mid+l*.22))
        floor=.65+.016*max(l,0)
        z+=(floor-z)*canyon
    return z


def land(road,col,theme,bc):
    b=bc.Builder('Santa Lucia cliffs and gravel turnouts','terrain');b.colours=[]
    sides=(-154,-112,-88,-70,-54,-40,-29,-20,-14,-9,-6,-4,0,4,6,10,18,32,57,90,130,190)
    for i in range(0,len(road.s)-1,4):
        j=min(i+4,len(road.s)-1)
        for left,right in zip(sides,sides[1:]):
            pts=[];colours=[]
            for n,l in ((i,left),(j,left),(j,right),(i,right)):
                d=road.s[n]['d'];z=terrain(d,l)
                pts.append(road.at(n,l,z-height(d)))
                patches=math.sin(d/48+l/23)+.67*math.sin(d/23-l/12)+.32*math.cos(d/8+l/6)
                if z<3 and l<-17:colour=0xD1B486 if patches>-.2 else 0xBAA17A
                elif l<-12 and z>3:colour=(0x8F816D,0xA08D77,0x7F7967,0x9B8D6F)[int(abs(patches)*3)%4]
                else:colour=0x8D9460 if patches>.45 else (0xBAA36C if patches>-.7 else 0x697952)
                colours.append(lin(colour))
            b.quad(*pts);b.colours.extend(colours)
    sea=bc.Builder('Pacific','sea');sea.quad((-13000,-22000,0),(33000,-22000,0),(33000,6000,0),(-13000,6000,0));sea.build(col)
    return b.build(col),lambda x,y:0


def roadway(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');edge=bc.Builder('RoadPaint','paint');lines=bc.Builder('CentreLine','terrain');lines.colours=[]
    for i in range(len(road.s)-1):
        def stripe(b,a,c,h):
            b.quad(road.at(i,a,h),road.at(i+1,a,h),road.at(i+1,c,h),road.at(i,c,h))
        stripe(asphalt,-4.1,4.1,0)
        for side in (-1,1):
            stripe(edge,side*3.72-.058,side*3.72+.058,.012)
            stripe(lines,side*.155-.064,side*.155+.064,.016)
            yellow=lin(0xE8B742 if i%61>1 else 0xC2A26C);lines.colours.extend((yellow,)*4)
    for b in (asphalt,edge,lines):b.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'terrain':{'sea':True},'land':{'mid':0x909256},
       'sky':[0xCDDCDF,0xB3D4E3,0x92BFDC,0x70A6CD,0x638EB9],'haze':0xBBCCCE,
       'light':[0xFFE3AF,3.1],'fill':[0xCEDFE9,0xAE9874],'sun_azimuth':-.88,'sun_altitude':.55,
       'palette':{'asphalt':0x555651},'chunks':{'Land':2}}

def beam(art,a,b,width,height,colour):
    start,end=Vector(a),Vector(b);axis=(end-start).normalized()
    across=axis.cross(Vector((0,0,1)))
    if across.length<.001:across=Vector((1,0,0))
    across.normalize();up=across.cross(axis).normalized()
    rim=[width*.5*u*across+height*.5*v*up for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for j in range(4):
        n=(j+1)%4
        art.face((start+rim[j],end+rim[j],end+rim[n],start+rim[n]),(colour,)*4)

def sea_stack(art,x,y,rx,ry,h,seed):
    rings=[]
    for rad,z in ((1,-1.2),(.90,.28),(.72,.47),(.57,.72),(.31,.92),(.025,1)):
        row=[]
        for i in range(18):
            a=i*math.tau/18
            delta=1+.09*math.cos(3*a+seed)+.06*math.sin(7*a-seed)
            row.append((x+rx*rad*delta*math.cos(a),y+ry*rad*delta*math.sin(a),
                        z if z<0 else h*(z+.09*math.sin(4*a+seed)*rad)))
        rings.append(row)
    shade=(0x454D4E,0x676E68,0x827F71,0x827B6C,0x797858)
    for j in range(5):
        for i in range(18):
            n=(i+1)%18
            a,b,c,d=rings[j][i],rings[j][n],rings[j+1][n],rings[j+1][i]
            co=lin(shade[j]);art.face((a,b,c,d),(co,)*4)
    art.face(rings[-1],(lin(shade[-1]),)*18)
    # Pale striations and dark joints run along the same strike on the exposed granite.
    for j in (2,5,8,13,16):
        n=(j+1)%18
        a,b,c,d=rings[2][j],rings[2][n],rings[3][n],rings[3][j]
        def lerp(u,v,t):return tuple(u[i]+(v[i]-u[i])*t for i in range(3))
        tint=lin(0xA9AA94 if j%2 else 0x636E69)
        art.face((lerp(a,d,.36),lerp(b,c,.52),lerp(b,c,.57),lerp(a,d,.40)),(tint,)*4)

def bridge(k,art,mid,half,span,rise,z):
    def point(d,l,h):return k.road.pos(mid+d,l,h-z)
    cement=lin(0xD4CBB6);shade=lin(0xAA9F90);lip=lin(0xE1DAC8)
    steps=48
    def arch(t):return z-4.1-rise*t*t
    for side in (-1,1):
        lane=side*3.39
        for j in range(steps):
            t=2*j/steps-1;u=2*(j+1)/steps-1
            beam(art,point(t*span,lane,arch(t)),point(u*span,lane,arch(u)),1.53,2.15,cement)
        for j in range(-5,6):
            t=j/5;d=t*span;foot=arch(t)-.35
            beam(art,point(d,lane,foot),point(d,lane,z-.82),1.05 if j%5 else 2.3,1.4,shade)
            if j%5==0:
                beam(art,point(d,lane,foot-3),point(d,lane,z+1.62),2.2,2.54,cement)
                art.box(point(d,lane,z+1.6),(2.8,2.45,.33),heading(mid),lip)
        for direction in (-1,1):
            for j in range(1,5):
                d=direction*(span+(half-span)*j/4)
                bottom=terrain(mid+d,lane)-.7
                beam(art,point(d,lane,bottom),point(d,lane,z-1.05),1.17,1.68,cement)
        for line,up,w,hue in ((4.2,-.7,1.1,shade),(4.17,.23,.44,cement),(4.17,1.19,.45,lip)):
            beam(art,point(-half,side*line,z+up),point(half,side*line,z+up),w,.39 if up>0 else 1.15,hue)
        for i in range(math.ceil(2*half/2.22)):
            d=-half+i*2.22
            beam(art,point(d,side*4.17,z+.14),point(d,side*4.17,z+1.18),.30,.42,cement)
    for d in range(-int(span),int(span)+1,12):
        beam(art,point(d,-3.39,arch(d/span)),point(d,3.39,arch(d/span)),.78,1.02,shade)


def crown(art,x,y,z,r,h,yaw,tint):
    low=[];rim=[];top=[]
    for i in range(9):
        a=yaw+i*math.tau/9;v=1+.12*math.sin(i*2.56+yaw)
        low.append((x+.61*r*v*math.cos(a),y+.47*r*v*math.sin(a),z-.24*h))
        rim.append((x+r*v*math.cos(a),y+.73*r*v*math.sin(a),z+.12*h*math.cos(a)))
        top.append((x+.50*r*v*math.cos(a),y+.42*r*v*math.sin(a),z+.65*h))
    body=lin(tint);dark=tuple(c*.71 for c in body[:3])+(1.,)
    for j in range(9):
        n=(j+1)%9;art.face((low[j],low[n],rim[n],rim[j]),(dark,dark,body,body))
        art.face((rim[j],rim[n],top[n],top[j]),(dark,body,body,body))
    art.face(top,(body,)*9)


def tree(art,x,y,z,h,seed,redwood=False):
    if redwood:
        art.tube((x,y,z),h*.036,h*.011,h*.92,lin(0x725542),lin(0x92745A),8)
        for i in range(7):
            crown(art,x,y,z+h*(.31+i*.105),h*(.18-i*.023),h*.19,seed+i*.39,0x476B57 if i%3 else 0x52725E)
    else:
        lean=h*.19;beam(art,(x,y,z),(x+lean,y+.3,z+h*.55),h*.095,h*.10,lin(0x7E7262))
        for i in range(5):
            a=seed+i*2.39;u=x+lean+h*(.25+.43*math.cos(a));v=y+h*.37*math.sin(a);w=z+h*(.71+.14*math.sin(2*a))
            beam(art,(x+lean,y+.3,z+h*.49),(u,v,w),h*.066,h*.079,lin(0x827767))
            crown(art,u,v,w,h*.40,h*.25,a,0x597454 if i%2 else 0x4C684E)


def scenery(k):
    art=Painted(k);rng=k.rng
    for args in BRIDGES:bridge(k,art,*args)
    for d in range(24,14050,18):
        if any(abs(d-mid)<half+9 for mid,half,*_ in BRIDGES):continue
        l=rng.choice((-1,1))*rng.uniform(7.5,20)
        x,y,_=k.road.pos(d,l);z=terrain(d,l)
        if (d<490 or 1650<d<1920) and l>0:tree(art,x,y,z,rng.uniform(12,25),rng.uniform(0,6),True)
        elif d%6!=0 or rng.random()<.47:tree(art,x,y,z,rng.uniform(4.2,9.6),rng.uniform(0,6))
        else:crown(art,x,y,z+.75,rng.uniform(1.5,3.8),1.6,rng.uniform(0,6),0x798453)
    for d in range(55,14055,5):
        if d%580>180 or any(abs(d-mid)<half+8 for mid,half,*_ in BRIDGES):continue
        l=-4.73
        a=k.road.pos(d,l,.64);b=k.road.pos(d+5,l,.64)
        beam(art,a,b,.15,.27,lin(0xAFABA0));art.box(k.road.pos(d,l,-.21),(.16,.14,1.1),heading(d),lin(0x8E8374))
        if d%15==0:
            for j in range(7):
                fd=d+3*math.sin(j*2.3);lateral=5.5+.82*math.cos(j*3.1)
                x,y,_=k.road.pos(fd,lateral)
                crown(art,x,y,terrain(fd,lateral)+.21,.18,.14,j,0xD8B645 if j%2 else 0xAF8AAB)
    for d in range(40,14030,91):
        l=-rng.uniform(70,140);x,y,_=k.road.pos(d,l)
        r=rng.uniform(7,18);sea_stack(art,x,y,r,r*rng.uniform(.50,.92),r*rng.uniform(.72,1.55),rng.uniform(0,7))
    # A side canyon opens onto a pale pocket beach below McWay Falls.
    for j in range(33):
        d=5760+j*3.8;l=-49-15*math.sin(j*math.pi/33);x,y,_=k.road.pos(d,l)
        sea_stack(art,x,y,6.7,5.1,7.4+8.6*abs(math.cos(j*.16)),j*.42)
    ridge=Painted(k,'peaks')
    for row in range(2):
        previous=None
        for i in range(158):
            x=i*117-1320;y=950+row*740+145*math.sin(i*.24)
            high=230+row*180+85*math.sin(i*.26)+52*math.cos(i*.53)+28*math.sin(i*.91)
            current=((x,y-430,-16),(x-12,y-290,high*.38),(x+19,y-165,high*.71),(x,y,high))
            if previous:
                for j,tint in enumerate((0x8C9672,0x9C9C7B,0xA8A48A)):
                    co=lin(tint);ridge.face((previous[j],current[j],current[j+1],previous[j+1]),(co,)*4)
            previous=current
    return {'efforts':0}
