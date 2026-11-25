"""Copacabana from the fort to Leme, with the Atlantic on the rider's right."""
import math
from bisect import bisect_right
from worldkit import Painted, lin

LENGTH = 4300
RADIUS = 3850
START = 2.02
HEIGHTS = []


def pose(d, side=0):
    angle = START - d / RADIUS
    x = RADIUS * (math.sin(START) - math.sin(angle))
    y = RADIUS * (math.cos(angle) - math.cos(START))
    return x-math.sin(angle)*side, y+math.cos(angle)*side, angle


def elevation(d):
    index = min(len(HEIGHTS)-2, max(0, math.floor(d)+100))
    return HEIGHTS[index] + (HEIGHTS[index+1]-HEIGHTS[index]) * (d+100-index)


def at(d, side, up=0):
    x, y, _ = pose(d, side)
    return x, y, elevation(d)+up


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    ends = [stage['to'] for stage in stages]
    HEIGHTS.clear()
    HEIGHTS.append(3)
    for d in range(-100, LENGTH+400):
        t = d + .5
        stage = stages[min(len(stages)-1, bisect_right(ends,t))]
        grade = (.005 if stage['kind']=='work' else 0) + .003*math.sin(t/310)*math.cos(t/870+1)
        HEIGHTS.append(HEIGHTS[-1]+grade)
    zero = HEIGHTS[100]-3
    HEIGHTS[:] = [h-zero for h in HEIGHTS]
    samples = []
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        x,y,angle = pose(d)
        samples.append(dict(x=x,y=y,z=elevation(d),h=angle,d=d,k=-1/RADIUS,
                            g=100*(elevation(d+.5)-elevation(d-.5))))
    mean=sum((q['to']-q['from'])*q['level'] for q in stages)/LENGTH
    return samples, stages, LENGTH, mean, 0


def paint(builder, points, tint):
    builder.faces.append(tuple(builder.v(p) for p in points))
    builder.colours.extend([lin(tint)]*len(points))


def strip(builder,d,end,left,right,z,tint):
    paint(builder,[at(d,left,z),at(d,right,z),at(end,right,z),at(end,left,z)],tint)


def ciclovia(road, stages, length, collection, bc):
    lane=bc.Builder('Ciclovia','terrain')
    lane.colours=[]
    for d in range(-80,4480,4):
        strip(lane,d,d+4,2.7,-2.7,0,0xb15d50)
        for side in (-2.60,2.65):
            strip(lane,d,d+4,side,side-.065,.012,0xf5e9ca)
        strip(lane,d,d+1.45,.045,-.045,.013,0xeec86d)
    lane.build(collection)


def beach_width(d):
    return 54+20*math.sin(math.pi*d/LENGTH)+8*math.sin(d/670)


def coast(road, collection, theme, bc):
    land=bc.Builder('Avenida and crescent beach','terrain')
    land.colours=[]
    for d in range(-80,4480,4):
        e=d+4
        strip(land,d,e,29,3.7,-.10,0x65666b)
        strip(land,d,e,4.1,2.7,.03,0xc3b8a5)
        strip(land,d,e,-2.7,-13.2,.02,0xe4d9ba)
        for offset in (8.5,14,20,25.5):
            strip(land,d,d+1.5,offset,offset-.10,-.085,0xdcd6c2)
        for near,far,z,w,c in ((13.2,22,.01,-1.55,0xe5c99e),
                              (22,beach_width(d),-1.55,-2.12,0xe8d0ad),
                              (beach_width(d),beach_width(d)+6,-2.12,-2.45,0xcebbaa),
                              (beach_width(d)+6,beach_width(d)+42,-2.45,-2.72,0x86abad),
                              (beach_width(d)+42,1250,-2.72,-3.6,0x68939c)):
            far_end=far if far in (22,1250) else far+beach_width(e)-beach_width(d)
            near_end=near if near in (13.2,22) else near+beach_width(e)-beach_width(d)
            paint(land,[at(d,-near,z),at(d,-far,w),at(e,-far_end,w),at(e,-near_end,z)],c)
    # Black basalt waves cross the pale Portuguese limestone promenade at a physical scale.
    for row in range(-28,1498):
        start=row*3
        last=None
        for j in range(25):
            side=-2.71-j*.436
            wave=1.1*math.sin((side+3)*1.03)
            pair=(at(start+wave,side,.033),at(start+wave+.78,side,.033))
            if last:
                paint(land,[last[0],pair[0],pair[1],last[1]],0x464641)
            last=pair
    return land.build(collection), lambda x,y: 0


THEME=dict(lay=lay, road_builder=ciclovia, land_builder=coast, road_half_width=2.7,
           terrain={'sea':False}, land={'mid':0x758e89}, haze=0xe4b8a5,
           sky=[0xfbd5af,0xf2b28d,0xbfabba,0x8da6c3,0x7899b5],
           light=[0xffcd99,2.8],fill=[0xf2d2c1,0xafa6a1],
           sun_azimuth=2.8,sun_altitude=.18)


COURTS = (185, 755, 1170, 1910, 2180, 2930, 3470, 4090)


def waterfront(kit, art):
    rng = kit.rng
    def box(d,l,z,a,b,h,c):
        x,y,heading=pose(d,l)
        art.box((x,y,elevation(d)+z),(a,b,h),heading,lin(c))
    def tube(d,l,z,r0,r1,h,c,t,n=10):
        art.tube(at(d,l,z),r0,r1,h,lin(c),lin(t),n,lin(t))
    for d in range(-28,4450,31):
        side=34+rng.uniform(0,5)
        if abs(d-2330)<82:
            continue
        width=rng.uniform(20,30)
        floors=rng.randint(5,14)
        tone=rng.choice((0xd6cec0,0xbbc1bc,0xe3d6b9,0xc8b6a4,0xbac3c8))
        box(d,side+8,-.18,width,16,floors*2.95,tone)
        for f in range(floors):
            h=f*2.95+.45
            box(d,side-.04,h,width*.91,.26,1.65,0x52656c)
            box(d,side-.64,h-.25,width*.99,1.9,.26,0xe0d7c5)
            for j in (-.35,-.12,.15,.35):
                box(d+j*width,side-.22,h,.55,.34,1.72,tone)
        box(d-3,side+7,floors*2.95-.2,8,6,2.1,tone)
    # The hotel's two projecting wings frame the central crown and arcaded ground floor.
    for offset,width,storeys in ((0,46,6),(-48,49,5),(48,49,5)):
        d=2330+offset;front=34 if offset else 32
        box(d,front+8,0,width,16,3.3*storeys,0xf2e6cc)
        for f in range(storeys):
            z=.62+3.3*f
            for j in range(-int(width/2)+3,int(width/2)-1,4):
                box(d+j,front-.06,z,1.65,.18,2.15,0x607274)
                box(d+j,front-.22,z-.15,2.18,.42,.25,0xffeed0)
                if f==0:
                    tube(d+j-1.26,front-.64,0,.29,.24,3.4,0xc4b99f,0xf7e7c7)
            box(d,front-.40,z+2.58,width+1,1.1,.27,0xffefd4)
        top=storeys*3.3
        box(d,front+7,top,width+2,18,.52,0xfaf0dd)
        box(d,front+7,top+.52,width*.58,9,1.55,0xe5dac3)
    for j in range(-67,68,4):
        d=2330+j;front=31.54 if abs(j)<22 else 33.54
        for floor in range(2):
            bottom=.62+floor*3.3
            arch=[at(d-.88,front,bottom),at(d+.88,front,bottom)]
            for q in range(11):
                theta=q*math.pi/10
                arch.append(at(d+.88*math.cos(theta),front,bottom+1.6+.88*math.sin(theta)))
            art.face(arch,[lin(0x506674)]*len(arch))
            art.face(arch[::-1],[lin(0x506674)]*len(arch))
            box(d,front-.04,bottom,.08,.08,2.42,0xf4e6cd)
            box(d,front-.04,bottom+1.55,1.75,.08,.065,0xf4e6cd)
    box(2330,28.6,3.42,19,7.2,.48,0xefe0c4)
    for d in range(2322,2340,4):
        tube(d,25.4,.06,.28,.23,3.38,0xc0b59e,0xffefd4,10)
        tube(d,25.4,3.15,.26,.36,.30,0xe6d3b1,0xfbebce,10)
    # Parked taxis and cars face the avenue. Lamps and benches overlook the bay.
    for k,d in enumerate(range(21,4400,73)):
        if k%6 not in (2,3):
            l=7.5
            colour=(0xf3c44f,0xb7bfc0,0x587279,0xe2ddce)[k%4]
            box(d,l,.28,4.2,1.72,.62,colour)
            box(d-.1,l,.90,2.23,1.52,.57,0x465f67)
            box(d-.12,l,1.45,1.82,1.52,.105,colour)
            for side in (-1,1):
                for end in (-1.3,1.3):
                    box(d+end,l+side*.82,.08,.58,.17,.53,0x393c3c)
        tube(d,-12.6,.03,.115,.085,4.55,0x706e60,0x7e8173,8)
        box(d,-12.27,4.5,.12,.74,.11,0x697268)
        box(d,-11.86,4.46,.40,.62,.13,0xe6d7b3)
        for off in (-.36,.36):
            box(d+2.5+off,-11.45,.04,.10,.63,.47,0x676e65)
        box(d+2.5,-11.45,.48,1.54,.52,.10,0x977653)
        box(d+2.5,-11.7,.62,1.54,.10,.36,0xb38a61)
    # The kiosk counters, chairs and umbrella tables sit clear of the red riding lane.
    for d in (114,442,832,1380,1690,2024,2370,2780,3130,3525,4028):
        tube(d,-9.5,.04,2.35,2.35,1.02,0x947656,0xc7a674,16)
        tube(d,-9.5,1.07,2.48,2.48,.15,0x76624f,0xe3c49c,16)
        for j in range(6):
            a=j*math.tau/6
            tube(d+2*math.cos(a),-9.5+2*math.sin(a),1.15,.09,.09,1.38,0x746a53,0xd6bd83,6)
        tube(d,-9.5,2.52,3.35,.55,1.36,0xd59e36,0xf1cb68,16)
        for i in range(3):
            station=d+5+i*3.5
            tube(station,-9.6,.04,.08,.09,.8,0xb4a064,0xd8be62,6)
            tube(station,-9.6,.84,.58,.58,.08,0xd6ad41,0xf5d35b)
            for chair in (-1,1):
                l=-9.6+chair
                box(station,l,.44,.49,.49,.095,0xf0c53c)
                box(station,l+chair*.22,.48,.49,.07,.45,0xeab539)
                for side in (-.18,.18):
                    box(station+side,l,0,.065,.39,.44,0xd4a739)
    # Court lines lie on the beach terrace; the net mesh and tape occupy the same plane.
    for d in COURTS:
        l=-23.5;z=-1.48
        for end in (-8,8):
            box(d+end,l,z, .065,8,.035,0xcc965a)
        for side in (-4,4):
            box(d,l+side,z,16,.065,.035,0xcc965a)
        for side in (-4.7,4.7):
            tube(d,l+side,z,.105,.09,2.62,0x58816d,0x8ea995,8)
        for row in range(9):
            box(d,l,z+1.48+row*.12,.034,9.35,.026,0x7b725e)
        for j in range(57):
            box(d,l-4.66+j*.165,z+1.47,.03,.023,.99,0x756e60)
        box(d,l,z+2.46,.07,9.45,.10,0xf4e7c7)
    # Coast almond trees have a tiered horizontal crown. Coconut leaflets split away from long fronds.
    for n,d in enumerate(range(-16,4440,22)):
        l=53 + n%6 * 3.5
        if any(abs(d-k)<5 for k in COURTS):
            continue
        x,y,z=at(d,l);trunk=rng.uniform(5.2,8.1)
        if n%5==0:
            tube(d,l,.04,.27,.18,4.2,0x806c56,0x9b815b,8)
            for layer in range(3):
                radius=3.0-layer*.55
                tube(d,l,3.0+layer*1.18,.45,radius,.72,0x476449,0x728355)
                tube(d,l,3.72+layer*1.18,radius,.25,.72,0x728355,0x859260)
            continue
        tube(d,l,.04,.28,.17,trunk,0x8b765b,0x9e8a69)
        for j in range(10):
            angle=j*math.tau/10+rng.uniform(-.16,.16)
            dx,dy=math.cos(angle),math.sin(angle)
            for k in range(7):
                t=k/7;v=(k+1)/7
                def leaf(u,side):
                    r=4.7*u;w=side*.45*math.sin(math.pi*u)
                    return (x+dx*r-dy*w,y+dy*r+dx*w,z+trunk+1.4*math.sin(math.pi*u)-1.1*u-abs(w)*.58)
                for side in (-1,1):
                    pts=[leaf(t,0),leaf(t+.03,side),leaf(v,side*.72),leaf(v,0)]
                    shade=lin(0x638552 if side<0 else 0x4c7047)
                    art.face(pts,[shade]*4);art.face(pts[::-1],[shade]*4)


def scenery(kit):
    waterfront(kit, Painted(kit))
    art=Painted(kit,'peaks')
    # Pão de Açúcar, Morro da Urca and the wooded Leme headland overlap across the bay.
    for d, side, rx, ry, height, seed in ((5200,-330,242,220,440,0),
        (5030,-620,302,190,232,1),(4630,-320,226,190,156,2),(4840,230,365,290,255,3)):
        x,y,_=pose(d,side)
        last=None
        for ring in range(25):
            t=ring/24
            # The steep granite shoulders round into a summit, with long weathered grooves.
            radius=(1-t**1.55)**.63
            row=[];colours=[]
            for j in range(56):
                a=math.tau*j/56
                groove=.021*math.sin(a*16+t*2+seed)+.012*math.sin(a*23-t*3)
                r=radius*(1+.085*math.sin(3*a+seed)+.046*math.sin(7*a+t)+groove)
                row.append((x+rx*r*math.cos(a)-t*rx*.20,y+ry*r*math.sin(a),
                            height*t*(1+.041*radius*math.sin(a*3+seed))))
                forest=.23+.16*math.sin(a*3+seed)+.10*math.sin(a*7+t*3)
                rock=max(0,min(1,(t-forest)*7))
                dark=lin(0x506c58);light=lin(0x978575 if seed==0 else 0x858780)
                variation=.94+.055*math.sin(a*23-t*3)+.035*math.cos(a*16+t)
                colours.append(tuple((dark[q]*(1-rock)+light[q]*rock)*variation for q in range(3))+(1,))
            if last:
                old,oc=last
                for j in range(56):
                    k=(j+1)%56
                    art.face([old[j],old[k],row[k],row[j]],[oc[j],oc[k],colours[k],colours[j]])
            last=(row,colours)
    return {'efforts':0}
