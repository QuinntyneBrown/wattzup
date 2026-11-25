"""Copacabana from the fort to Leme, with the Atlantic on the rider's right."""
import math
from bisect import bisect_right
from worldkit import Painted, lin

LENGTH = 4300
RADIUS = 3850
START = 2.02
STATIONS = []
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


def scenery(kit):
    art=Painted(kit,'peaks')
    # Pão de Açúcar, Morro da Urca and the wooded Leme headland overlap across the bay.
    for d, side, rx, ry, height, seed in ((5200,-330,242,220,440,0),
        (5030,-620,302,190,232,1),(4630,-320,226,190,156,2),(4840,230,365,290,255,3)):
        x,y,_=pose(d,side)
        last=None
        for ring,(radius,up) in enumerate(((1,0),(.86,.23),(.62,.57),(.43,.80),(.28,.95),(.04,1))):
            row=[]
            for j in range(44):
                a=math.tau*j/44
                r=radius*(1+.055*math.sin(a*3+seed)+.025*math.cos(a*7+up))
                row.append((x+rx*r*math.cos(a)-up*rx*.17,y+ry*r*math.sin(a),height*up))
            if last:
                for j in range(44):
                    k=(j+1)%44
                    c=(0x536c61,0x687971,0x827e77,0x938981,0xa09285)[ring-1]
                    art.face([last[j],last[k],row[k],row[j]],[lin(c)]*4)
            last=row
    return {'efforts':0}
