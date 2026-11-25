"""The Full Pyramid from the forest sacbé to the great plaza."""
import math
from worldkit import Painted, lin

LENGTH=12700
PROFILE=[(0,23),(480,25),(1250,27),(2410,24),(3340,22),(4050,23),(5200,31),
         (6860,28),(7910,26),(9020,25),(10880,30),(12000,27),(12700,26)]


def height(d):
    for (a,z),(b,end) in zip(PROFILE,PROFILE[1:]):
        if d<=b:
            return z+(end-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def direction(d):
    straight=max(0,min(1,(12210-d)/350))
    return straight*(.22*math.sin(d/775)+.12*math.sin(d/340)+.31*math.exp(-((d-3240)/100)**2))


# Integrate by actual road length. Sampling positions between metre marks preserves the fixed ruins on bends.
points=[(-100.,0.)]
for metre in range(-100,13000):
    h=direction(metre+.5)
    x,y=points[-1]
    points.append((x+math.cos(h),y+math.sin(h)))


def pose(d,l=0):
    i=min(len(points)-2,max(0,math.floor(d)+100))
    t=d-(i-100);a,b=points[i:i+2]
    h=direction(d)
    return (a[0]+(b[0]-a[0])*t-math.sin(h)*l,
            a[1]+(b[1]-a[1])*t+math.cos(h)*l,h)


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    assert abs(stages[-1]['to']-LENGTH)<.01
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=pose(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=direction(d+.5)-direction(d-.5),
                         g=100*(height(d+.5)-height(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows,stages,LENGTH,mean,0


def rim_radius(d,l):
    return math.hypot((d-3230)/43,(l-34)/29)


def floor_at(d,l):
    r=rim_radius(d,l)
    base=height(d)-.34
    if r<1:
        return base-11.8*(1-min(1,max(0,(r-.75)/.25)))
    return base


def land(road,col,theme,bc):
    ground=bc.Builder('Forest floor, cenote and open plaza','terrain')
    ground.colours=[]
    def vertex(d,l):
        return (*pose(d,l)[:2],floor_at(d,l))
    def slab(corners,c):
        ground.quad(*corners)
        ground.colours.extend((lin(c),)*4)
    d=-80
    while d<12900:
        close=3140<=d<3320
        end=d+(2 if close else 16)
        widths=[-270,-80,-18,-4,0,4,7,12,22,48,80,270]
        if close:widths=[-270,-18,-4,0,4,*range(6,84,2),270]
        for a,b in zip(widths,widths[1:]):
            r=rim_radius((d+end)/2,(a+b)/2)
            if r<.99:
                tint=[0xA7997C,0xC6BBA0,0xAAA087,0xD0C1A0][int(r*47)%4]
            elif d>12200 or 7110<d<8400:
                tint=0x96915D if abs(a)<27 else 0x8C9157
            else:
                tint=0x8B7653 if abs(a)<19 else 0x6B7046
            slab([vertex(d,a),vertex(end,a),vertex(end,b),vertex(d,b)],tint)
        d=end
    # Water spans only the bottom of the depression. No other surface covers the hole.
    cx,cy,_=pose(3230,34)
    for i in range(72):
        a=i*math.tau/72;b=(i+1)*math.tau/72
        def water(t):
            return (*pose(3230+41*math.cos(t),34+27*math.sin(t))[:2],height(3230)-9.6)
        ground.tri((cx,cy,height(3230)-9.6),water(a),water(b))
        ground.colours.extend((lin(0x718A46),lin(0x4F7144),lin(0x4F7144)))
    return ground.build(col),lambda x,y:23


def roadway(road,st,length,col,bc):
    surface=bc.Builder('Road','asphalt')
    for d in range(-80,12900,4):
        def v(s,l):
            return (*pose(s,l)[:2],height(s))
        surface.quad(v(d,-3.35),v(d+4,-3.35),v(d+4,3.35),v(d,3.35))
    surface.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':3.35,
       'terrain':{'sea':False},'land':{'mid':0x889158},
       'sky':[0xDAEAE6,0xB3DCE8,0x8EC7E2,0x72ADD5,0x5496C5],'haze':0xCADACB,
       'light':[0xFFF0CA,3.05],'fill':[0xD3E4E5,0xA7976D],'sun_azimuth':-.8,
       'sun_altitude':.91,'palette':{'asphalt':0xC8C0AB},'chunks':{'Land':8}}


def scenery(k):
    art=Painted(k)
    monument=Painted(k,'peaks')
    rng=k.rng
    def box(group,x,y,z,sx,sy,sz,tint,yaw=0):
        group.box((x,y,z),(sx,sy,sz),yaw,lin(tint))
    # Pitted drums and true stair treads remain legible when the riders pass beside the terraces.
    def column(x,y,z,r,h,group=art):
        bands=max(2,round(h/.62))
        for j in range(bands):
            tint=rng.choice((0xACA78F,0xBFB9A2,0xB1A68D,0xC5BEA5))
            group.tube((x,y,z+j*h/bands),r*(1-.013*j),r*(1-.013*j),h/bands-.026,
                       lin(0x8E8B76),lin(tint),10,lin(tint))
    def temple(station,lateral,width,tiers,total,top):
        x,y,h=pose(station,lateral);z=height(station)-.26
        # Faces and stairs align with the sacbé's final straight.
        stone=(0xB6AD94,0xB1AA92,0xC4B99F,0xBBAF94)
        inset=(width-top)/2/tiers
        for j in range(tiers):
            w=width-2*j*inset
            box(monument,x,y,z+j*total/tiers,w,w,total/tiers-.10,stone[j%4],h)
            box(monument,x,y,z+(j+1)*total/tiers-.34,w+.22,w+.22,.28,0xA1947B,h)
        def at(u,v):
            return x+math.cos(h)*u-math.sin(h)*v,y+math.sin(h)*u+math.cos(h)*v
        for face in range(4):
            a=h+face*math.pi/2;cs,sn=math.cos(a),math.sin(a)
            count=91 if tiers==9 else 47
            run=(width-top)/2+2
            for j in range(count):
                d=width/2+1.6-run*j/count
                box(monument,x+d*cs,y+d*sn,z+total*j/count,run/count+.21,width*.15,total/count+.08,0xC7BFA9,a)
            for side in (-1,1):
                for j in range(24):
                    d=width/2+1.8-run*j/24
                    box(monument,x+d*cs-side*(width*.082)*sn,y+d*sn+side*(width*.082)*cs,
                        z+j*total/24,run/24+.19,.84,total/24+.69,0xB7AD95,a)
        box(monument,x,y,z+total,top*.92,top*.92,4.35,0xC3B69A,h)
        for face in range(4):
            a=h+face*math.pi/2
            box(monument,x+top*.462*math.cos(a),y+top*.462*math.sin(a),z+total+.16,.10,top*.3,3.12,0x514F43,a)
        box(monument,x,y,z+total+4.32,top*.99,top*.99,.62,0xA99D84,h)
        return x,y
    # Keep El Castillo off the racing line: the final rider passes the plaza's edge at its base.
    temple(12749,-6,56,9,24.2,13.4)
    temple(8196,27,44,5,13.6,18)
    for station,count in [(7300,24),(8000,16)]:
        for row in range(4):
            for j in range(count):
                d=station+j*3.65
                x,y,h=pose(d,7.4+row*3.85)
                z=height(d)-.31
                box(art,x,y,z,1.62,1.62,.27,0xB8AE95,h)
                column(x,y,z+.27,.56,3.3 if row%2 else 3.8)
    # Layered blocks with low relief frame the Warriors temple and the approach to the great plaza.
    for station in (7900,8270,12350):
        x,y,h=pose(station,-9);z=height(station)-.31
        for j in range(3):
            box(art,x,y,z+j*.43,14-j*.4,4-j*.38,.43,0xA89B83,h)
        for j in range(12):
            sx,sy,_=pose(station-6+j,-7.48)
            for row in range(2):
                art.tube((sx,sy,z+.29+row*.48),.3,.26,.38,lin(0x897C67),lin(0xC2B294),8,lin(0xB8A58C))
                for off in (-.12,.12):
                    box(art,sx+off,sy+.24,z+.45+row*.48,.09,.05,.09,0x5E594B)
    # Seeded duff, a few bare limestone fragments and cast leaf shadows break up the shaded floor.
    for d in range(0,12200,7):
        if 3100<d<3350 or 7110<d<8400:continue
        for side in (-1,1):
            for n in range(3):
                off=rng.uniform(4.4,14)*side;x,y,h=pose(d+rng.uniform(-2,2),off)
                z=height(d)-.322
                tint=rng.choice((0x786B48,0x7F7650,0x6D7049,0x81784D,0x948863))
                art.tube((x,y,z),rng.uniform(1,2.8),rng.uniform(.9,2.5),.015,lin(tint),lin(tint),6,lin(tint))
    # Staggered facing stones preserve the grooves seen across El Castillo's terraces on approach.
    for d,l,width,tiers,total,top in [(12749,-6,56,9,24.2,13.4),(8196,27,44,5,13.6,18)]:
        cx,cy,h=pose(d,l)
        for tier in range(tiers):
            w=width-(width-top)*tier/tiers
            for face in range(4):
                a=h+face*math.pi/2;cs,sn=math.cos(a),math.sin(a)
                for row in range(3):
                    for j in range(round(w/1.65)):
                        lateral=-w/2+(j+.5+row%2*.38)*1.65
                        if abs(lateral)<width*.09 or abs(lateral)>w/2-.7:continue
                        x=cx+cs*(w/2+.022)-sn*lateral;y=cy+sn*(w/2+.022)+cs*lateral
                        box(monument,x,y,height(d)-.14+tier*total/tiers+row*.64,.06,1.59,.60,
                            rng.choice((0xB7AE97,0xBDB59C,0xAFA78D,0xC3B99E)),a)
                # Both bright nosing and its narrow dark riser run across every second tread.
                count=91 if tiers==9 else 47
                if tier==0:
                    for j in range(0,count,2):
                        reach=w/2+1.72-((width-top)/2+2)*j/count
                        x=cx+cs*reach;y=cy+sn*reach
                        box(monument,x,y,height(d)-.10+total*j/count,.24,width*.146,.10,0xD3CAB5,a)
    # Remnants of the earlier rubble kerb are interrupted with small bare patches along the causeway.
    for d in range(-60,12750,4):
        for side in (-1,1):
            x,y,h=pose(d,side*(3.53+rng.random()*.21))
            for fragment in range(4):
                sx,sy,_=pose(d+fragment*.86,side*(3.48+rng.random()*.24))
                tint=rng.choice((0xB2A78E,0xB4AE9A,0xA59F89,0xC2B8A0))
                art.tube((sx,sy,height(d)-.31),rng.uniform(.35,.57),rng.uniform(.29,.43),rng.uniform(.23,.46),
                         lin(0x8B806D),lin(tint),5,lin(tint))
    for i in range(61):
        t=i*math.tau/61
        d=3230+41*math.cos(t);l=34+28*math.sin(t)
        x,y,h=pose(d,l)
        for j in range(rng.randrange(1,4)):
            high=rng.uniform(1.1,5.4)
            box(art,x+j*.21,y,height(d)-high,.07,.08,high,0x5A6241)
    for i in range(9):
        d=607+i*10;x,y,h=pose(d,-6.8)
        z=height(d)-.31
        for u in (-1.8,1.8):
            for v in (-1.22,1.22):
                box(art,x+u,y+v,z,.12,.12,2.5,0x78664D)
        art.roof((x,y,z+2.5),4.4,3.3,.73,0,lin(0xA48A58))
        box(art,x,y,z+.76,3.7,1.8,.15,0x83684A)
        for j in range(10):
            box(art,x+(j-4.5)*.31,y+1.26,z+1.1,.32,.1,1.31,
                (0xC85851,0xC79141,0x428E87,0xD7BC75,0x885379)[(i+j)%5])
    # Feathered serpent balustrade heads at the north foot of El Castillo and at the Warriors stairs.
    for station,lateral,width in [(12749,-6,56),(8196,27,44)]:
        tx,ty,h=pose(station,lateral)
        for sign in (-1,1):
            nose=width/2+3.9
            x=tx-math.cos(h)*nose-sign*math.sin(h)*width*.082
            y=ty-math.sin(h)*nose+sign*math.cos(h)*width*.082
            z=height(station)-.25
            box(monument,x,y,z,3.25,1.3,.47,0xAA9E84,h)
            box(monument,x-.15,y,z+.47,2.95,1.22,.14,0x776F5B,h)
            box(monument,x+.18,y,z+.68,2.52,1.3,.65,0xB5A68C,h)
            box(monument,x+.71,y,z+1.26,1.45,1.42,.43,0xAA9D85,h)
            for cheek in (-1,1):
                box(monument,x+.39,y+cheek*.68,z+1.24,.34,.10,.23,0x716D5E,h)
                box(monument,x-.66,y+cheek*.53,z+.41,.13,.17,.34,0xC8BEA9,h)
    # Sunlit stones and blotches of bare earth break up the edge of the open plaza.
    for location in (7290,12580):
        for i in range(190):
            d=location+rng.uniform(-185,150);l=rng.choice((-1,1))*rng.uniform(5,57)
            x,y,h=pose(d,l)
            art.tube((x,y,height(d)-.34),rng.uniform(.34,2.2),rng.uniform(.33,2.1),.025,
                     lin(0xA09A71),lin(0xA09A71),6,lin(rng.choice((0xA29970,0xACA07A,0x918B5F))))
    for j in range(30):
        d=3220+24*math.sin(j*2);l=34+15*math.cos(j*1.31)
        x,y,h=pose(d,l)
        box(art,x,y,height(3230)-9.585,.37+rng.random()*2.7,.17,.006,0x90A167,h)
    return {'efforts':0}
