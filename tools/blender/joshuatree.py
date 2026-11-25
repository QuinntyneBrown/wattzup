"""Park Boulevard on the tilted Mojave plain below the Little San Bernardino Mountains."""
import bisect
import math
from worldkit import Painted, lin, smooth


def heading(d):
    return .32*math.sin(d/1400)+.24*math.sin(d/287)+.14*math.cos(d/163)


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    slopes=[]
    z=1216
    for s in stages:
        g=(s['level']-mean)*.006
        slopes.append((s['from'],s['to'],z,g))
        z+=g*(s['to']-s['from'])
    x=y=0;points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        a,b,h,g=next((p for p in slopes if d<p[1]),slopes[-1])
        points.append(dict(x=x,y=y,z=h+(min(b,max(a,d))-a)*g,h=heading(d),k=heading(d+.5)-heading(d-.5),d=d,g=g*100))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return points,stages,length,mean,.6


def land(road,col,theme,bc):
    xs=[p['x'] for p in road.s]
    def height(x,y):
        i=min(len(xs)-1,max(1,bisect.bisect_left(xs,x)))
        a,b=road.s[i-1:i+1]
        t=max(0,min(1,(x-a['x'])/(b['x']-a['x'])))
        axis=a['y']+(b['y']-a['y'])*t;z=a['z']+(b['z']-a['z'])*t
        side=abs(y-axis)
        rough=math.sin(x/103+y/46)*5+math.cos(y/39-x/182)*3+math.sin(y/181+x/317)*9
        return z-.43+rough*smooth(6,138,side)
    b=bc.Builder('Mojave alluvium','terrain');b.colours=[]
    prev=None
    offsets=(-1600,-950,-560,-330,-190,-102,-55,-28,-14,-7,-4,0,4,7,14,28,55,102,190,330,560,950,1600)
    for i in range(0,len(road.s),3):
        line=[]
        for off in offsets:
            x,y,z=road.at(i,off)
            tan=math.sin(x/113+y/88)+.65*math.cos(x/49-y/33)
            c=lin(0xD2B18C if tan>.5 else 0xBE9F7C if tan<-.5 else 0xC9AA86)
            line.append(((x,y,z-.37 if abs(off)<=7 else height(x,y)),c))
        if prev:
            for a,h,c,d in zip(prev,prev[1:],line[1:],line):
                b.quad(a[0],d[0],c[0],h[0]);b.colours.extend((a[1],d[1],c[1],h[1]))
        prev=line
    return b.build(col),height


def pavement(road,st,length,col,bc):
    b=bc.Builder('Road','terrain');b.colours=[]
    bands=((-4.55,-3.6,0xAE977A),(-3.6,-3.42,0xDAD0AD),(-3.42,-.17,0x655F61),(-.17,-.06,0xEABC3F),(-.06,.06,0x615856),(.06,.17,0xEABC3F),(.17,3.42,0x655F61),(3.42,3.6,0xDAD0AD),(3.6,4.55,0xAE977A))
    for i in range(len(road.s)-1):
        for l,r,c in bands:
            b.quad(road.at(i,l),road.at(i+1,l),road.at(i+1,r),road.at(i,r));b.colours.extend([lin(c)]*4)
    b.build(col)


def granite(art,base,size,seed,skull=False):
    """A weather-rounded rectangular joint block. Skull Rock's cavities deform its front surface inward."""
    n,h=(80,38) if skull else (16,9)
    rx,ry,rz=size
    ox,oy,oz=base
    rings=[]
    def blunt(v):
        return math.copysign(abs(v)**.70,v)
    for i in range(h+1):
        lat=-math.pi/2+math.pi*(.001+.998*i/h)
        row=[]
        for j in range(n):
            a=j*math.tau/n
            ux=blunt(math.cos(lat)*math.cos(a));uy=blunt(math.cos(lat)*math.sin(a));uz=blunt(math.sin(lat))
            uneven=1+.06*math.sin(3*a+seed+.7*lat)+.035*math.cos(5*a+3*lat+seed)
            recess=0
            if skull and ux<-.4:
                for cy,cz,wy,wz,depth in ((-.43,.23,.295,.26,.45),(.34,.29,.29,.25,.48),(-.04,-.15,.14,.25,.26)):
                    r=((uy-cy)/wy)**2+((uz-cz)/wz)**2
                    recess+=depth*math.exp(-1.8*r*r)
            x=ox+(ux*uneven+recess)*rx;y=oy+uy*ry*uneven;z=oz+rz*(1+uz*uneven)
            shade=max(.22,.74+.18*uz-.18*uy-.84*recess+.04*math.sin(seed+uy*10+uz*7))
            col=lin(0xDCAD7C if not skull else 0xD4B99A)
            row.append(((x,y,z),tuple(v*shade for v in col[:3])+(1,)))
        rings.append(row)
    for bot,top in zip(rings,rings[1:]):
        for j in range(n):
            k=(j+1)%n
            face=(bot[j],bot[k],top[k],top[j])
            art.face([v[0] for v in face],[v[1] for v in face])


def plants(k):
    b=type(k.B['terrain'])('MojavePlants','terrain');b.colours=[];b.uvs=[];k.B['MojavePlants']=b
    for d in range(-50,23700,14):
        garden=16950<d<18280
        for i in range(6 if garden else 3):
            side=k.rng.choice((-1,1))
            offset=side*k.rng.uniform(6 if i==0 else 24,35 if i==0 else 148)
            if 9760<d<9850 and offset>0 and offset<38:continue
            x,y,_=k.road.pos(d+k.rng.uniform(-6,6),offset);z=k.height_at(x,y)-.07
            which=2 if garden and k.rng.random()<.91 else k.rng.randrange(2)
            tall=k.rng.uniform(.95,2.5) if which==2 else k.rng.uniform(2.9,7.5)
            w=tall*(.44 if which==2 else .54);ang=k.rng.random()*math.pi
            for a in (ang,ang+math.pi/2):
                dx=w*math.cos(a);dy=w*math.sin(a)
                pts=((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+tall),(x-dx,y-dy,z+tall))
                b.faces.append(tuple(b.v(p) for p in pts));b.colours.extend([(1,1,1,1)]*4)
                u=which/3;b.uvs.extend(((u,0),(u+1/3,0),(u+1/3,1),(u,1)))


def scenery(k):
    art=Painted(k);rng=k.rng
    for distance in (640,2900,4270,4460,7110,9808,10030,11550,12400,12650,14620,19010,21100):
        for j in range(30):
            side=1 if distance in (4270,9808,12400) else (-1 if j%3 else 1)
            d=distance+rng.uniform(-85,105)
            off=side*rng.uniform(22,91)
            x,y,_=k.road.pos(d,off);z=k.height_at(x,y)
            if distance==9808 and abs(d-9818)<24 and 0<off<48:continue
            scale=rng.uniform(2.4,9.1)
            granite(art,(x,y,z-.9),(scale*rng.uniform(.9,1.55),scale*rng.uniform(.7,1.2),scale),rng.random()*8)
            if j%3==0:granite(art,(x+scale*.23,y-scale*.15,z+scale*1.38),(scale*.91,scale*.83,scale*.63),rng.random()*8)
    x,y,_=k.road.pos(9818,12.3)
    granite(art,(x,y,k.height_at(x,y)-1.05),(6.7,8.55,6.25),.6,True)
    plants(k)
    from joshuatree_camp import campground, ranges
    campground(k,art);ranges(k,Painted(k,'peaks'))
    return {'efforts':0}


THEME={'lay':route,'road_builder':pavement,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0xC9AC88},
       'road_half_width':3.6,'chunks':{'Land':1},'sky':[0xF2C094,0xEBAE8B,0xC7A9B5,0x93A3C4,0x698DB7],
       'haze':0xCCAD9D,'light':[0xFFE1B6,1.83],'fill':[0xD1C7C5,0xBA9471],'sun_altitude':.16,'sun_azimuth':-.85}
