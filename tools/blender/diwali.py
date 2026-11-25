"""Marine Drive during Diwali, from Nariman Point to the north of Back Bay."""
import math
from worldkit import Painted, lin

PROFILE=((0,4),(1270,4),(2680,6),(4840,4),(6460,5),(9210,4),(10163.33,5))
HALF=7.2


def elevation(d):
    for (a,h),(b,k) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return h+(k-h)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    # The inside of the northbound sweep is the Arabian Sea, on the rider's left.
    return 1.03+1.76*(.5+.5*math.tanh((d-4480)/2350))+.075*math.sin(d/610)


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    x=0;y=-bc.LEAD_IN;rows=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;t=bearing(d+.5*bc.STEP)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(t);y+=bc.STEP*math.sin(t)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def face(builder,points,tint):
    builder.faces.append(tuple(builder.v(p) for p in points))
    builder.colours.extend([lin(tint)]*len(points))


def road(r,stages,length,col,bc):
    pavement=bc.Builder('Marine Drive carriageway','asphalt')
    paint=bc.Builder('Marine Drive lane markings','terrain');paint.colours=[]
    for i in range(len(r.s)-1):
        pavement.quad(r.at(i,HALF),r.at(i,-HALF),r.at(i+1,-HALF),r.at(i+1,HALF))
        for off in (-6.96,-3.45,0,3.45,6.96):
            if abs(off)<6 and i%3:continue
            face(paint,[r.at(k,s,.022) for k,s in ((i,off+.065),(i,off-.065),(i+1,off-.065),(i+1,off+.065))],0xbcaf99)
    pavement.build(col);paint.build(col)


def shore(r,col,theme,bc):
    b=bc.Builder('Marine Drive sea wall and promenade','terrain');b.colours=[]
    for i in range(len(r.s)-1):
        for a,c,h,z,tint in ((-110,-7.2,.19,.19,0x755f60),(-7.2,-7.18,.19,-.02,0x9c9995),(7.18,7.25,-.02,.2,0xc6c0ac),(7.25,15.8,.2,.24,0x948b7d),(15.8,15.86,.24,.89,0x726e70),(15.86,16.77,.89,.89,0xbcaa90),(16.77,16.91,.89,-1.8,0x5c5353),(16.91,22,-1.8,-2.4,0x60575d),(22,1500,-2.4,-2.42,0x16273c)):
            face(b,[r.at(k,l,v) for k,l,v in ((i,c,z),(i,a,h),(i+1,a,h),(i+1,c,z))],tint)
    return b.build(col),lambda x,y:4


def scenery(k):
    art=Painted(k);r=k.road;rng=k.rng
    def box(d,l,z,along,across,high,color):
        art.box(r.pos(d,l,z),(along,across,high),bearing(d),lin(color))
    def glow(d,l,z,size,material='bulb'):
        k.B[material].box(r.pos(d,l,z),size,bearing(d))
    # Streetlights read individually nearby and as an unbroken yellow necklace across the water.
    for d in range(-64,10360,32):
        i=r.index(d);k.lamp(i,7.8,'bulb',7.4);k.light(r.pos(d,5.9,0),'bulb',14,.86)
        if d%64==0:k.lamp(i,-8.05,'glow-lamp',7.7)
        for n in range(5):
            y=d+n*6.4;box(y,7.32,.14,3.1,.18,.15,0x383539)
        if (d//32)%3==1:
            k.palm(*r.pos(d,-10.3,.18))
            for n in range(12):
                theta=n*.93
                glow(d+.33*math.cos(theta),-10.3+.32*math.sin(theta),.82+.29*n,(.092,.092,.09))
    # Reinforced-concrete breakwater armour. Four tapered limbs share a hub, with varied rotations.
    for d in range(-60,10270,4):
        yaw=rng.random()*math.tau
        station=d+rng.uniform(-.65,.65);lateral=17.8+rng.random()*3.3
        bx,by,bz=r.pos(station,lateral,-.75-rng.random()*.74)
        for j in range(4):
            t=yaw+j*math.tau/3
            dx,dy,dz=(0,0,1.45) if j==3 else (1.21*math.cos(t),1.21*math.sin(t),-.51)
            origin=(bx,by,bz);tip=(bx+dx,by+dy,bz+dz)
            # A tapered triangular prism, built perpendicular to the arm.
            norm=math.hypot(dx,dy);u=(1,0,0) if norm<.01 else (-dy/norm,dx/norm,0)
            n=math.sqrt(dx*dx+dy*dy+dz*dz);v=(-dz*u[1]/n,dz*u[0]/n,(dx*u[1]-dy*u[0])/n)
            def ring(c,rad):
                return [tuple(c[q]+rad*(u[q]*math.cos(a*math.tau/3)+v[q]*math.sin(a*math.tau/3)) for q in range(3)) for a in range(3)]
            a,b=ring(origin,.55),ring(tip,.37)
            for q in range(3):
                col=lin((0x797479,0x686469,0x847d79)[q]);art.face((a[q],a[(q+1)%3],b[(q+1)%3],b[q]),(col,)*4)
            art.face(b,(lin(0x92897e),)*3)
    # Cream and pastel five-storey blocks, horizontal bands, projecting rounded balconies,
    # central stair towers and sunshades. Taller offices collect at the two ends of the bay.
    for j,d in enumerate(range(-70,10280,39)):
        floors=4+j%4
        facade=(0xe2ceac,0xc8bda7,0xd9b6a3,0xd2c6a3,0xb7c6be)[j%5]
        box(d,-26,.2,34,15,floors*3.13,facade)
        for end in (-1,1):
            x,y,z=r.pos(d+end*13.1,-18.7,.2)
            art.tube((x,y,z),3.45,3.45,3.13*floors,lin(0xc7ac91),lin(facade),14)
        for floor in range(floors):
            h=.34+floor*3.13
            box(d,-17.82,h+.12,33,1.72,.31,0xe2cfaf)
            box(d,-17.21,h+.5,32.7,.26,.41,0xc4b8a1)
            for n in (-12.2,-8.4,-4.4,0,4.4,8.4,12.2):
                if rng.random()<.26:glow(d+n,-18.41,h+1.72,(1.52,.09,1.18),'glow-door')
                else:box(d+n,-18.41,h+1.07,1.56,.1,1.26,0x54535a)
            if j%3!=1:
                for end in (-1,1):
                    x,y,z=r.pos(d+end*13.1,-18.7,h+.13)
                    art.tube((x,y,z),3.9,3.9,.26,lin(0x9d8d79),lin(0xdfd3b7),14,lin(0xd9c8b0))
        box(d,-17.74,.25,1.13,.76,3.13*floors+1.9,0xe3d1aa)
        if j%4==0:box(d,-17.6,.25,.36,.9,3.13*floors+2.65,0xd3bb91)
        if j%2==0:
            x,y,z=r.pos(d+8,-19.4,.2);art.roof((x,y,z+3.6),7,3.3,.16,bearing(d),lin(0x9b684e))
        if d<1450 or d>8500:
            h=rng.uniform(33,98);off=-rng.uniform(82,135)
            box(d,off,.1,22,19,h,0x49505e)
            for floor in range(4,int(h)-2,5):
                for col in (-7,-2,3,8):
                    if rng.random()<.69:glow(d+col,off+9.55,floor,(1.67,.12,.84),'glow-door')
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=shore,road_half_width=HALF,night=True,wet=.23,
           terrain={'sea':True},land={'mid':0x38333d},haze=0x302c40,
           palette={'asphalt':0x343139,'sea':0x182a45},sky=[0x503846,0x2b2a43,0x181d32,0x0d142a,0x080e20],
           light=[0xffd19b,1.16],fill=[0xaaa9b6,0x645464],sun_azimuth=2.6,sun_altitude=.42)
