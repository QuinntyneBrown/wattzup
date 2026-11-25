"""The protected Supercykelsti and the two harbour crossings, from the rider's lane."""
import math
from bisect import bisect_right
from worldkit import Painted, lin

LENGTH=13650
START=-100
PATH=[]
SNAKE=(2380,2780)
INNER=(10280,10660)


def smooth(x):
    v=max(0,min(1,x))
    return v*v*(3-2*v)


def bearing(d):
    heading=1.42+.18*math.sin(d/700)+.24*math.sin(d/380)
    for a,b,amplitude in ((*SNAKE,.94),(*INNER,.33)):
        t=(d-a)/(b-a)
        if 0<t<1:
            heading+=amplitude*math.sin(t*math.tau)*math.sin(t*math.pi)
    return heading


def deck_rise(d):
    return sum(high*smooth((d-a+125)/125)*smooth((b+125-d)/125)
               for (a,b),high in ((SNAKE,4.2),(INNER,2.7)))


def pose(d,side=0,up=0):
    f=min(len(PATH)-1.00001,max(0,d-START))
    i=int(f);t=f-i
    a,b=PATH[i:i+2];h=bearing(d)
    x=a[0]+(b[0]-a[0])*t-math.sin(h)*side
    y=a[1]+(b[1]-a[1])*t+math.cos(h)*side
    return x,y,a[2]+(b[2]-a[2])*t+up


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);ends=[s['to'] for s in stages]
    PATH.clear();x,y,z=0,START,3
    for d in range(START,LENGTH+351):
        PATH.append((x,y,z+deck_rise(d)))
        t=d+.5;h=bearing(t);stage=stages[min(len(stages)-1,bisect_right(ends,t))]
        x+=math.cos(h);y+=math.sin(h)
        z+=(.005 if stage['kind']=='work' else 0)+.003*math.sin(t/310)*math.cos(t/870+1)
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        samples.append(dict(x=x,y=y,z=z,d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),
                            g=100*(pose(d+.5)[2]-pose(d-.5)[2])))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return samples,stages,LENGTH,mean,0


def paint(b,points,shade):
    b.faces.append(tuple(b.v(p) for p in points));b.colours.extend([lin(shade)]*len(points))


def ribbon(b,d,e,left,right,z,shade):
    paint(b,[pose(d,left,z),pose(d,right,z),pose(e,right,z),pose(e,left,z)],shade)


def crossing(d):
    return next((v for v in (SNAKE,INNER) if v[0]<=d<v[1]),None)


def road(road,stages,length,col,bc):
    b=bc.Builder('Raised cycle track','terrain');b.colours=[]
    for d in range(-80,LENGTH+160,4):
        bridge=crossing(d)
        surface=(0xc16543 if bridge==SNAKE else 0x939796 if bridge else 0x686f70)
        ribbon(b,d,d+4,2.85,-2.85,0,surface)
        if not bridge:
            for side in (-2.69,2.79):
                ribbon(b,d,d+4,side,side-.12,.013,0x478baf)
        ribbon(b,d,d+1.3,.046,-.046,.013,0xe5e5d8)
        if d%260 in (128,132,136,140):
            ribbon(b,d,d+4,2.64,-2.64,.009,0x598fab)
            for l in (-1.98,-1.28,-.58,.12,.82,1.52,2.22):
                ribbon(b,d+.2,d+.38,l,l-.12,.018,0xd9e3e0)
    b.build(col)


def ground(road,col,theme,bc):
    b=bc.Builder('Harbour and avenues','terrain');b.colours=[]
    for d in range(-80,LENGTH+160,4):
        bridge=crossing(d)
        water=bool(bridge) or 3920<d<4710 or 6970<d<8160
        water_level=-2.6-deck_rise(d)
        ribbon(b,d,d+4,125,-180,water_level if water else -.42,0x678c95 if water else 0x888c7a)
        if bridge:
            ribbon(b,d,d+4,3.5,2.84,-.02,0xa7a29a)
            ribbon(b,d,d+4,-2.84,-3.5,-.02,0xa7a29a)
            continue
        ribbon(b,d,d+4,3.23,2.85,-.03,0xb9b7a8)
        ribbon(b,d,d+4,14,3.23,-.19,0x757977)
        ribbon(b,d,d+4,22,14,-.10,0xb8b4a6)
        ribbon(b,d,d+4,-2.85,-8.7,-.02,0xc1bdaf)
        if not water: ribbon(b,d,d+4,-8.7,-19,-.15,0x8c9b78)
        if d%12==0:ribbon(b,d,d+3.1,8.75,8.65,-.175,0xdcdacc)
    return b.build(col),lambda x,y:0


THEME=dict(lay=lay,road_builder=road,land_builder=ground,road_half_width=2.85,
           terrain={'sea':False},land={'mid':0x839491},haze=0xc0d0d7,
           sky=[0xdde3df,0xcbd8df,0xabc4d3,0x91b1c6,0x7ca0bd],
           light=[0xffe3b9,2.85],fill=[0xc6d9e9,0xb9b7ac],sun_azimuth=2.6,sun_altitude=.32)


def scenery(kit):
    art=Painted(kit)
    def box(d,l,z,length,width,h,tint):
        art.box(pose(d,l,z),(length,width,h),bearing(d),lin(tint))
    for a,b in (SNAKE,INNER):
        for d in range(a,b,2):
            for side in (-3.17,3.17):
                box(d,side,0,.055,.065,1.19,0x788884)
                box(d+1,side,1.19,2.08,.11,.075,0xc9d1ce)
                for j in (0,.4,.8,1.2,1.6):
                    box(d+j,side,.12,.037,.035,1.04,0x959f9c)
            if d%20==0:
                box(d,0,-7,1.0,2.2,6.82,0x878b83)
                box(d,0,-.47,2.35,6.5,.43,0xa2a399)
    return {'efforts':0}
