"""An 8.6 km dusk sprint round the sheltered water of Dubai Marina."""
import math
import random

from worldkit import Painted, lin


def elevation(d):
    profile=((0,3),(1650,3),(3430,4),(5640,6),(6050,3),(8600,3))
    for (a,h),(b,z) in zip(profile,profile[1:]):
        if d<=b:return h+(z-h)*max(0,(d-a)/(b-a))
    return 3


def lay(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    # An elongated basin with broad sweeping ends. Set its perimeter from the class.
    a,b=340,1920
    perimeter=sum(math.hypot(a*math.sin(i*math.tau/4096),b*math.cos(i*math.tau/4096)) for i in range(4096))*math.tau/4096
    a*=length/perimeter;b*=length/perimeter
    start=-.63
    def speed(t):return math.hypot(a*math.sin(t),b*math.cos(t))
    t=start-bc.LEAD_IN/speed(start)
    rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        heading=math.atan2(b*math.cos(t),-a*math.sin(t))
        rows.append(dict(x=a*math.cos(t),y=b*math.sin(t),z=elevation(d),d=d,h=heading,
                         k=(a*b)/(speed(t)**3),g=100*(elevation(d+.5)-elevation(d-.5))))
        t+=bc.STEP/speed(t+bc.STEP/(2*speed(t)))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def walkway(r,stages,length,col,bc):
    stone=bc.Builder('Marina Walk limestone paving','terrain');stone.colours=[]
    for i in range(len(r.s)-1):
        for j,(left,right) in enumerate(((11.8,10.7),(10.7,5.7),(5.7,5.37),(5.37,-5.37),(-5.37,-5.7),(-5.7,-18.8))):
            tint=(0xb29c82,0xc1ae9a,0x795e4d,0xd1bb9d,0x795e4d,0xb8a28f)[j]
            pts=[r.at(q,l,.02) for q,l in ((i,right),(i,left),(i+1,left),(i+1,right))]
            stone.faces.append(tuple(stone.v(p) for p in pts))
            stone.colours.extend([lin(tint)]*4)
        for left,right in ((10.65,5.72),(5.34,-5.34),(-5.72,-18.8)):
            pts=[r.pos(r.s[i]['d']+dt,l,.032) for dt,l in ((0,right),(0,left),(.037,left),(.037,right))]
            stone.faces.append(tuple(stone.v(p) for p in pts));stone.colours.extend([lin(0xa69380)]*4)
    stone.build(col)


def shore(r,col,theme,bc):
    sea=bc.Builder('Dubai Marina sheltered canal','sea')
    base=bc.Builder('Podium foundations','terrain');base.colours=[]
    for i in range(len(r.s)-1):
        def point(j,l,z):
            x,y,_=r.at(j,l)
            return (x,y,z)
        a,b=point(i,11.8,.35),point(i+1,11.8,.35)
        sea.tri((0,0,.35),a,b)
        for left,right,h,z in ((11.8,11.8,-.4,r.s[i]['z']+.09),(-18.8,-18.8,-.4,r.s[i]['z']+.02),(-450,-18.8,.0,.0)):
            pts=(point(i,left,h),point(i,right,z),point(i+1,right,z),point(i+1,left,h))
            base.faces.append(tuple(base.v(p) for p in pts));base.colours.extend([lin(0x897c79)]*4)
    sea.build(col)
    return base.build(col),lambda x,y:3.0


def scenery(k):
    r=k.road;art=Painted(k);rng=random.Random(2115)
    def box(d,l,z,w,h,high,tint):
        i=r.index(d);art.box(r.pos(d,l,z),(w,h,high),k.s[i]['h'],lin(tint))
    # Stainless rails and paired glazing stanchions follow the radius of the quay.
    for d in range(-64,8690,4):
        i=r.index(d);yaw=k.s[i]['h']
        box(d,11.25,0,.105,.11,1.21,0x8e9394)
        for h in (.36,.73,1.16):box(d+2,11.25,h,4.12,.075,.075,0xaeb5b7)
        if d%32==0:
            box(d,-8.65,.02,2.3,2.15,.79,0xaf9c87)
            k.palm(*r.pos(d,-8.65,.72))
            k.light(r.pos(d,-8.65,.10),'glow-door',10,.64)
        if d%24==0:
            k.lamp(i,9.6,'bulb',5.1);k.light(r.pos(d,8.65,.03),'bulb',12,.72)
    # Terraced cafés have an opening arcade, recessed shop windows and shaded seating.
    for n,d in enumerate(range(-36,8650,39)):
        yaw=k.s[r.index(d)]['h']
        box(d,-24.4,-.2,36,14.2,7.8,0x96877e)
        box(d,-18.1,3.5,35.6,5.4,.34,0xe6d2ad)
        box(d,-16.2,3.8,36,.28,.45,0xa59586)
        for a in (-13.2,-7,0,7,13.2):
            box(d+a,-17.18,.25,4.85,.17,2.90,0xa47755)
            k.B['glow-window'].box(r.pos(d+a,-16.96,1.10),(3.95,.08,1.61),yaw)
            box(d+a,-14.75,.04,.26,.34,3.45,0xd3c1a3)
        if n%3==0:
            for a in (-10,-2,8):
                k.prism(k.B['trunk'],r.pos(d+a,-11.4,.12),.09,.75,6)
                k.prism(k.B['whitewash'],r.pos(d+a,-11.4,.86),.63,.10,10)
                for side in (-1,1):
                    box(d+a+.93*side,-11.4,.04,.46,.44,.43,0x885e48)
                    box(d+a+1.13*side,-11.4,.45,.075,.44,.40,0xca9868)
        # Apartments with glazed residential bands and scattered lit rooms rise above the podium.
        width=rng.uniform(18,28);floors=rng.randrange(15,36);off=-rng.uniform(42,72)
        glass=rng.choice((0x394758,0x5e626d,0x526274,0x585969))
        box(d,off,.1,width,16,3.15*floors,glass)
        for floor in range(floors):
            z=1+3.15*floor
            box(d,off+8.25,z,width+.4,.56,.24,0x959092)
            for a in (-.34,-.12,.12,.34):
                if rng.random()<.56:
                    k.B['glow-window'].box(r.pos(d+width*a,off+8.12,z+.58),(1.66,.10,1.25),yaw)
    # Floating fingers and their warm guide lamps leave room for moored boats.
    for d in range(36,8640,86):
        i=r.index(d)
        box(d,26.4,-2.24,2.47,29.4,.44,0x8a6855)
        for l in (16,27,39):
            box(d,l,-2.16,.28,.28,.82,0x56505a)
            k.B['bulb'].box(r.pos(d,l,-1.36),(.18,.18,.17),k.s[i]['h'])
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=walkway,land_builder=shore,night=True,wet=.08,
           terrain={'sea':True},land={'mid':0x46445b},haze=0x67556b,
           palette={'asphalt':0xb9a387,'sea':0x263e52},sky=[0xe99668,0xaa6c85,0x635578,0x413c63,0x26274b],
           light=[0xffcc9e,1.28],fill=[0xb7afcb,0x675d66],sun_azimuth=2.5,sun_altitude=.23)
