"""The Herengracht from the saddle. Place façades and the canal relative to the same quay."""
import math
from worldkit import Painted, lin

BRIDGE_SPACING = 400
FIRST_BRIDGE = 132
WATER = -1.65


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    mean = sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    n = math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1
    samples = []
    x, y = -bc.LEAD_IN, 0
    for i in range(n):
        d = i*bc.STEP-bc.LEAD_IN
        heading = .3*math.sin(d/275)+.1*math.sin(d/106)
        delta = (d-FIRST_BRIDGE+BRIDGE_SPACING/2)%BRIDGE_SPACING-BRIDGE_SPACING/2
        stage = bc.stage_at(stages,min(length-.01,max(0,d-delta)))
        lift = 1.05+(stage["level"]-12)*.105
        t = min(1,abs(delta)/31)
        z = lift*(1+math.cos(math.pi*t))/2
        grade = -100*lift*math.pi/62*math.sin(math.pi*t)*math.copysign(1,delta)
        x += bc.STEP*math.cos(heading)
        y += bc.STEP*math.sin(heading)
        samples.append(dict(x=x,y=y,z=z,d=d,h=heading,k=.3/275*math.cos(d/275)+.1/106*math.cos(d/106),g=grade))
    return samples,stages,length,mean,.105


def quay_land(road,col,theme,bc):
    b = bc.Builder("Canal quays","terrain")
    b.colours=[]
    def point(i,side,z):
        x,y,_=road.at(i,side)
        return x,y,z
    # The water is level, including below each brick arch.
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for a,az,c,cz,tint in [(7.2,.05,7.2,WATER-.2,0x815F4C),(7.2,WATER,35,WATER,0x39594E),
                               (35,WATER-.2,35,.32,0x765540),(35,.32,80,.32,0x928C7E),
                               (-6.2,.08,-65,.08,0x9F9688)]:
            pts=(point(i,a,az),point(j,a,az),point(j,c,cz),point(i,c,cz))
            ids=[b.v(p) for p in pts]
            b.faces.append(tuple(ids if a<=c else ids[::-1]))
            b.colours.extend([lin(tint)]*4)
    return b.build(col),lambda x,y:0


THEME={
    "lay":centre_line,"land_builder":quay_land,"terrain":{"sea":False},"land":{"mid":0x8F9987},"edge":"gracht","kerbs":False,
    "sky":[0xD7E9F0,0xB5D4E9,0x89BADB,0x659FCD,0x4288C1],
    "light":[0xFFF0D4,2.9],"fill":[0xDEEFF8,0x898A76],"haze":0xD1E0E4,
    "sun_altitude":.59,"sun_azimuth":-1.1,"palette":{"asphalt":0x996857,"promenade":0xB2A997},
    "chunks":{"Land":1},
}


def canal_house(k,b,d,side):
    i=k.road.index(d)
    x,y,_=k.road.at(i,side)
    yaw=k.s[i]["h"]
    along=(math.cos(yaw),math.sin(yaw))
    facing=1 if side<0 else -1
    outward=(-along[1]*facing,along[0]*facing)
    def point(u,height,proud=0):
        return (x+u*along[0]+proud*outward[0],y+u*along[1]+proud*outward[1],height)
    brick=lin(k.rng.choice((0x81584C,0x735248,0x8F6654,0xADA58C,0x665956,0xA2745C)))
    trim=lin(0xEAE4D3)
    pane=lin(k.rng.choice((0x516568,0x627074,0x495F61)))
    w=4.3
    h=k.rng.uniform(9,14)
    def rect(l,r,lo,hi,col,proud):
        pts=(point(l,lo,proud),point(r,lo,proud),point(r,hi,proud),point(l,hi,proud))
        b.face(pts if facing<0 else pts[::-1],(col,)*4)
    rect(-w,w,0,h,brick,0)
    # The shared walls run back to the roof, closing the end of each staggered row.
    b.box(point(0,0,-3.7),(2*w,7.25,h-.03),yaw,brick)
    form=k.rng.randrange(3)
    if form==0:
        for row,half in enumerate((w*.82,w*.59,w*.36,w*.15)):
            rect(-half,half,h+row*.65,h+(row+1)*.65,brick,.01)
            rect(-half,half,h+(row+1)*.65-.11,h+(row+1)*.65,trim,.03)
    else:
        last=w
        for row in range(6):
            t=(row+1)/6
            half=.9+(w-.9)*((1-t)**(2.4 if form==1 else .65))
            pts=(point(-last,h+row*.43),point(last,h+row*.43),point(half,h+(row+1)*.43),point(-half,h+(row+1)*.43))
            b.face(pts if facing<0 else pts[::-1],(brick,)*4)
            last=half
        rect(-1.12,1.12,h+2.58,h+2.8,trim,.04)
    for row in range(3):
        base=.65+row*(h-1)/3
        for centre in (-2.7,0,2.7):
            rect(centre-.79,centre+.79,base,base+2.1,trim,.05)
            rect(centre-.65,centre+.65,base+.12,base+1.97,pane,.08)
            rect(centre-.66,centre+.66,base+1.43,base+1.51,trim,.10)
    rect(-w,w,h-.25,h-.06,trim,.08)


def scenery(k):
    b=Painted(k)
    for d in range(-55,int(k.length)+40,9):
        canal_house(k,b,d,-10.5)
        canal_house(k,b,d,41.5)
    return {"efforts":0}
