"""Cypress Bowl Road climbs east and west across a south-facing North Shore slope."""
import math
from bisect import bisect_right

from worldkit import Painted, lin, smooth

LENGTH = 18125
START = -180
PATH = []
# Each turnout follows a long diagonal traverse. The mountainside lies north, the sound south.
TURNS = ((2470, 320, 1), (5070, 330, -1), (8040, 310, 1),
         (11140, 340, -1), (13910, 315, 1), (16140, 355, -1))
PROFILE = ((0,135),(2670,260),(5650,437),(9320,623),(14540,818),(18125,932))


def heading(d):
    h=.16
    for start,width,direction in TURNS:
        h+=direction*(math.pi-.32)*smooth(start,start+width,d)
    return h+.085*math.sin(d/490)+.035*math.sin(d/176)


def pose(d,left=0,up=0):
    idx=max(0,min(d-START,len(PATH)-1.001))
    i=int(idx);f=idx-i
    a,b=PATH[i:i+2]
    h=heading(d)
    return (a[0]+f*(b[0]-a[0])-left*math.sin(h),
            a[1]+f*(b[1]-a[1])+left*math.cos(h),
            a[2]+f*(b[2]-a[2])+up)


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);ends=[s['to'] for s in stages]
    PATH.clear();x,y,z=0,0,0
    for d in range(START,LENGTH+360):
        PATH.append((x,y,z))
        h=heading(d+.5)
        x+=math.cos(h);y+=math.sin(h)
        stage=stages[min(len(stages)-1,bisect_right(ends,d))]
        z+=.022+.0021*stage['level']+.006*math.sin(d/230)
    initial=PATH[-START][2];scale=797/(PATH[LENGTH-START][2]-initial)
    PATH[:]=[(x,y,135+(z-initial)*scale) for x,y,z in PATH]
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        rows.append(dict(x=x,y=y,z=z,d=d,h=heading(d),k=heading(d+.5)-heading(d-.5),
                         g=100*(pose(d+.5)[2]-pose(d-.5)[2])))
    return rows,stages,LENGTH,sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH,0


def road(rows,stages,length,col,bc):
    b=bc.Builder('Cypress Bowl Road','asphalt')
    paint=bc.Builder('Centre line and shoulders','terrain');paint.colours=[]
    def stripe(d,end,l,r,tint):
        vs=(pose(d,l,.021),pose(d,r,.021),pose(end,r,.021),pose(end,l,.021))
        paint.faces.append(tuple(paint.v(p) for p in vs));paint.colours.extend([lin(tint)]*4)
    for d in range(-80,LENGTH+150,6):
        b.quad(pose(d,5.7),pose(d,-5.7),pose(d+6,-5.7),pose(d+6,5.7))
        for l in (-4.48,4.58):stripe(d,d+6,l,l-.11,0xd9dace)
        for l in (-.045,.16):stripe(d,d+6,l,l-.09,0xc9aa66)
    b.build(col);paint.build(col)


def ground(rows,col,theme,bc):
    b=bc.Builder('North Shore slope and ocean','terrain');b.colours=[]
    def face(vs,colours):
        b.faces.append(tuple(b.v(p) for p in vs));b.colours.extend(lin(c) for c in colours)
    def slope(d,l):
        # The carriageway is cut level across the flank. Its south side falls into the basin.
        span=max(0,abs(l)-6)
        return -.12+span*(.14 if l*math.cos(heading(d))>0 else -.27)+.13*math.sin(d/15)*min(1,span/9)
    for d in range(-80,LENGTH+140,10):
        for sign in (-1,1):
            for a,c,tint in ((5.65,7.3,0x878679),(7.3,12,0x737866),(12,29,0x66755e),(29,87,0x566a58),(87,180,0x526951)):
                vs=[pose(t,s,slope(t,s)) for t,s in ((d,sign*a),(d,sign*c),(d+10,sign*c),(d+10,sign*a))]
                face(vs,[tint]*4)
    # Basin below the road. Water and wooded headlands share a stable world-space horizon.
    face([(-24000,-26000,0),(24000,-26000,0),(24000,20000,0),(-24000,20000,0)],[0x809da6]*4)
    return b.build(col),lambda x,y:0


THEME=dict(lay=lay,land_builder=ground,road_builder=road,terrain={'sea':False},land={'mid':0x566a59},
           haze=0xa7b3b4,wet=.46,sky=[0xe3e0cc,0xbecaca,0xabbcc5,0x8da3b3,0x8098ae],
           light=[0xffe5c1,2.28],fill=[0xc3d2d6,0x7a876e],sun_azimuth=3.8,sun_altitude=.49,
           palette={'asphalt':0x52585a})


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    for start,width,_ in TURNS:
        for d in range(start-55,start+width+50,4):
            sign=-1 if math.cos(heading(d))>=0 else 1
            p=pose(d,sign*6.04,-.1)
            art.box(p,(3.94,.63,.43),heading(d),lin(0xa09d90))
            art.box((p[0],p[1],p[2]+.43),(3.94,.37,.48),heading(d),lin(0xafafa1))
        for d in range(start+22,start+width,49):
            l=(-1 if math.cos(heading(d))>=0 else 1)*7.18
            x,y,z=pose(d,l,-.25)
            art.box((x,y,z),(.1,.13,2.55),heading(d),lin(0x7b7970))
            art.box((x,y,z+1.76),(.13,.84,.83),heading(d),lin(0xe2b34e))
    return {'efforts':0}
