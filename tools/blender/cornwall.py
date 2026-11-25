"""A three-lap Cornish fishing harbour, composed in slate, wet granite and pale sea."""
import math
from bisect import bisect_right

from worldkit import Painted, lin

LAP=2400
PROFILE=((0,34),(210,28),(570,5),(1260,5),(1450,11),(1730,37),(1970,45),(2180,41),(2400,34))
# The first few turns descend to the bay; a long quay runs east, then the lane climbs inland.
CORNERS=((-440,215),(-422,146),(-408,134),(-392,76),(-353,62),(-343,2),
         (-298,-37),(-180,-42),(-40,-64),(100,-49),(241,-38),(315,-15),
         (335,27),(298,51),(329,81),(300,116),(307,161),(259,196),
         (155,237),(50,243),(-41,278),(-133,288),(-254,250),(-345,265))
POINTS=[]
ARC=[0]
for n,b in enumerate(CORNERS):
    a=CORNERS[n-1];c=CORNERS[(n+1)%len(CORNERS)];e=CORNERS[(n+2)%len(CORNERS)]
    for j in range(45):
        t=j/45
        point=tuple(.5*((2*b[q])+(-a[q]+c[q])*t+(2*a[q]-5*b[q]+4*c[q]-e[q])*t*t+
                     (-a[q]+3*b[q]-3*c[q]+e[q])*t**3) for q in range(2))
        if POINTS:ARC.append(ARC[-1]+math.dist(POINTS[-1],point))
        POINTS.append(point)
ARC.append(ARC[-1]+math.dist(POINTS[-1],POINTS[0]));POINTS.append(POINTS[0])
SCALE=LAP/ARC[-1]


def elevation(d):
    t=d%LAP
    for (a,z),(b,end) in zip(PROFILE,PROFILE[1:]):
        if a<=t<=b:
            f=(t-a)/(b-a);return z+(end-z)*f*f*(3-2*f)
    return PROFILE[0][1]


def centre(d):
    distance=(d%LAP)/SCALE
    i=max(0,min(len(POINTS)-2,bisect_right(ARC,distance)-1))
    f=(distance-ARC[i])/(ARC[i+1]-ARC[i]);a,b=POINTS[i:i+2]
    return tuple((a[q]+(b[q]-a[q])*f)*SCALE for q in range(2))


def angle(d):
    a,b=centre(d-1),centre(d+1);return math.atan2(b[1]-a[1],b[0]-a[0])


def pose(d,left=0,up=0):
    x,y=centre(d);h=angle(d)
    return (x-math.sin(h)*left,y+math.cos(h)*left,elevation(d)+up)


def lay(course,theme,bc):
    st=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((bc.LEAD_IN+3*LAP+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        turn=(angle(d+.5)-angle(d-.5)+math.pi)%math.tau-math.pi
        rows.append(dict(x=x,y=y,z=z,h=angle(d),k=turn,g=100*(elevation(d+.5)-elevation(d-.5)),d=d))
    mean=sum((q['to']-q['from'])*q['level'] for q in st)/(3*LAP)
    return rows,st,3*LAP,mean,0


def road(road,st,length,col,bc):
    # All three laps use the same physical surface.
    b=bc.Builder('Wet slate lane','asphalt')
    for d in range(0,LAP,4):
        b.quad(pose(d,2.75),pose(d,-2.75),pose(d+4,-2.75),pose(d+4,2.75))
    b.build(col)


def ground(road,col,theme,bc):
    b=bc.Builder('Harbour hillside','terrain');b.colours=[]
    def face(points,tint):
        b.faces.append(tuple(b.v(p) for p in points));b.colours.extend([lin(tint)]*len(points))
    for d in range(0,LAP,4):
        quay=510<=d<1350
        for l,r,up,far,c in ((3.75,2.74,.04,-.015,0x999a8d),(21,3.75,.77,.04,0x788572),
                              (85,21,7,.77,0x687a61),(-2.74,-5.2,-.015,.045,0x898c84),
                              (-5.2,-7,.045,.02,0xa5a092),(-7,-32,-3.30,-3.9,0xc2b695),
                              (-32,-110,-3.9,-4.5,0x87a59a)):
            if not quay and l<=-7:up,far,c=-.27,-2,0x6b7a65
            face([pose(d,l,up),pose(d,r,far),pose(d+4,r,far),pose(d+4,l,up)],c)
        if quay:
            face([pose(d,-7,.03),pose(d,-7,-3.3),pose(d+4,-7,-3.3),pose(d+4,-7,.03)],0x64716b)
    # The bay and the hills are seen past the steep lanes.
    extent=2600
    face([(-extent,-extent,.29),(extent,-extent,.29),(extent,extent,.29),(-extent,extent,.29)],0x739a95)
    return b.build(col),lambda x,y:.29


THEME=dict(lay=lay,land_builder=ground,road_builder=road,road_half_width=2.75,
           terrain={'sea':False},land={'mid':0x758780},haze=0xbac5c6,wet=.42,
           sky=[0xd6d9cf,0xb9c6c8,0xa5b5c0,0x95a5b0,0x8496a4],
           light=[0xf5e5c3,2.1],fill=[0xc9d6df,0x9eaa96],sun_azimuth=2.7,sun_altitude=.44,
           palette={'asphalt':0x65696a})


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    def box(d,l,z,a,b,h,tint):
        art.box(pose(d,l,z),(a,b,h),angle(d),lin(tint))
    for d in range(0,LAP,2):
        for l in (-2.93,2.93):
            box(d,l,-.12,1.96,.35,.21,rng.choice((0x98998f,0x8c928b,0x95958c)))
    for d in range(510,1350,2):
        for row in range(4):
            s=d+(row%2)*.76
            box(s,-6.88,-3.2+row*.75,1.94,.36,.725,
                rng.choice((0x747970,0x82847a,0x87877a)) if row>1 else rng.choice((0x565f59,0x646b60)))
        box(d,-6.88,-.15,1.97,.65,.25,0xa0a093)
    # Keep the lighthouse fixed on the seaward end of the granite arm.
    for i in range(38):
        x,y,_=pose(1200,-7-i*2.8)
        art.box((x,y,.22),(5,4.1,3.3),angle(1200),lin(0x777b72))
        art.box((x,y,3.52),(5.17,4.15,.20),angle(1200),lin(0xa5a398))
    x,y,_=pose(1200,-109)
    for z,r1,r2,h,c in ((3.7,2.25,1.18,9.7,0xe6e4d5),(13.4,1.52,1.55,.45,0x46504d),
                          (13.85,.99,.99,1.65,0xa7c4c0),(15.5,1.38,.17,.97,0x4f5c58)):
        art.tube((x,y,z),r1,r2,h,lin(c),lin(c),16,lin(c))
    return {'efforts':0}
