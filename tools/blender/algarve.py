"""The Algarve headland road, built from the recorded Get Fit in 40 training stages."""
import math

from worldkit import Painted, lin
from cinqueterre import agave, gozzo, umbrella_pine


def route(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    mean = sum(s["level"] * (s["to"] - s["from"]) for s in stages) / length
    count = math.ceil((bc.LEAD_IN + length + bc.RUN_OUT) / bc.STEP) + 1
    distances = [i * bc.STEP - bc.LEAD_IN for i in range(count)]
    grade = []
    for d in distances:
        stage = bc.stage_at(stages, d)
        grade.append((stage["level"] - mean) * 0.34 if stage else 0)
    grade = bc.box_smooth(grade, int(28 / bc.STEP))
    x = y = z = 0
    samples = []
    for d, g in zip(distances, grade):
        heading = 0.46 * math.sin(d / 163) + 0.25 * math.cos(d / 79)
        # The road follows the indentation inland at each cove. From the
        # approach the rider looks across open water at the far headland.
        for turn in (270, 595):
            heading -= 1.15 * math.exp(-((d-turn)/37)**2)
        x += math.cos(heading) * bc.STEP
        y += math.sin(heading) * bc.STEP
        z += g * bc.STEP / 100
        curvature = 0.46 / 163 * math.cos(d / 163) - 0.25 / 79 * math.sin(d / 79)
        samples.append(dict(x=x, y=y, z=z, h=heading, k=curvature, g=g, d=d))
    lift = 8 - min(s["z"] for s in samples)
    for s in samples:
        s["z"] += lift
    return samples, stages, length, mean, 0.34


def atlantic(road, col, theme, bc):
    water = bc.Builder("Sea", "sea")
    water.quad((-4000, -9000, 0), (22000, -9000, 0), (22000, 9000, 0), (-4000, 9000, 0))
    water.build(col)
    def height(x, y):
        _, index, _ = road.tree.find((x, y, 0))
        return road.s[index]["z"] - 0.18
    return None, height


THEME = {
    "lay": route, "land_builder": atlantic, "terrain": {"sea": True},
    "sky": [0xFAE9C8, 0xC3E2EB, 0x86BEDF, 0x478ED0, 0x2668AF],
    "haze": 0xD1E2E6, "light": [0xFFDAA3, 2.85], "fill": [0xD9EAF4, 0xB09365],
    "sun_altitude": 0.35, "sun_azimuth": 2.6, "kerbs": False, "edge": "corniche", "centre": "white",
    "palette": {"sea": 0x177F9B, "sand": 0xE6C68A, "asphalt": 0x505154, "sun": 0xFFF2CD},
    "land": {"low": 0xBF9862, "mid": 0x82925C, "high": 0x526E43, "rock": 0xD99755},
    "chunks": {"Land": 2},
}


def shore_section(k, i):
    s = k.s[i]
    d, z = s["d"], s["z"]
    lip = 13 + 7 * math.sin(d / 55) + 3 * math.sin(d / 19)
    bay = (1 + math.cos((d - 530) / 105)) / 2
    # From inland to open water. The same vertices meet across bands, to leave the high
    # ledges overhanging while the lower ochre beds recess toward the hillside.
    levels = [(-215, z + 35 + 9 * math.sin(d/96)), (-65, z + 6), (-10, z-0.2),
              (7, z-0.2), (9, z-0.22), (lip+2, z-0.7), (lip+2.3, z*0.84),
              (lip, z*0.78), (lip+3.5, z*0.56), (lip+2.5, z*0.47),
              (lip+5, z*0.24), (lip+6, 1.1), (lip+9+18*bay, 0.35),
              (lip+14+28*bay, 0.16), (lip+18+37*bay, 0.06)]
    return [(*k.road.at(i, off)[:2], height) for off, height in levels]



def bedded_face(b, points, height, underside=False):
    """Clip rock in horizontal beds so the strata run through neighbouring facets."""
    def above(poly, cutoff):
        result=[]
        for a,c in zip(poly,poly[1:]+poly[:1]):
            if a[2]>=cutoff:
                result.append(a)
            if (a[2]<cutoff)!=(c[2]<cutoff):
                t=(cutoff-a[2])/(c[2]-a[2])
                result.append(tuple(a[k]+t*(c[k]-a[k]) for k in range(3)))
        return result
    tints=(0xA97B50,0xC4915C,0xE4BF82,0xD1A36F,0xAE7D4F,0xDFC399)
    bands=[-2]+[height*v for v in (.14,.17,.29,.36,.38,.52,.59,.61,.72,.81,.83,.94,1.12)]
    for j,(lo,hi) in enumerate(zip(bands,bands[1:])):
        poly=above(points,lo)
        if len(poly)<3: continue
        poly=[(x,y,-z) for x,y,z in above([(x,y,-z) for x,y,z in poly],-hi)]
        if len(poly)<3: continue
        col=lin(tints[j%len(tints)])
        cols=[]
        for x,y,z in poly:
            light=(.64 if underside else .94)+.045*math.sin(x*.39+y*.16)+.03*math.sin(z*.92+x*.12)
            cols.append(tuple(value*light for value in col[:3])+(1,))
        b.face(poly,cols)

def rock_arch(b, x, y, height, span, yaw):
    # An open arch with irregular concentric contours, dark inside the bridge and
    # on its underside. Both end faces are visible from successive headlands.
    cs, sn = math.cos(yaw), math.sin(yaw)
    def at(j, inner, depth):
        a = math.pi * j / 14
        width = span * (0.48 if inner else 0.97 + 0.035 * math.sin(j*1.7))
        top = height * (0.76 if inner else 0.94 + 0.045 * math.cos(j*2.3))
        u = width * math.cos(a)
        return x + u*cs-depth*sn, y + u*sn+depth*cs, -0.8 + top*math.sin(a)
    for j in range(14):
        for front in (-1, 1):
            dep = front * span * 0.22
            points = [at(j, False, dep), at(j+1, False, dep), at(j+1, True, dep), at(j, True, dep)]
            bedded_face(b, points if front < 0 else points[::-1], height)
        for inside, shade in [(False,0xE3BD79), (True,0x93683D)]:
            points = [at(j,inside,-span*.22),at(j,inside,span*.22),at(j+1,inside,span*.22),at(j+1,inside,-span*.22)]
            bedded_face(b, points if inside else points[::-1], height, underside=inside)



def benagil(b, centre, yaw, roof):
    """A low sea grotto. The skylight pierces each concentric roof band and opens onto sand."""
    x,y = centre
    cs,sn = math.cos(yaw),math.sin(yaw)
    def ring(angle, rx, ry, height):
        u, v = rx*math.cos(angle), ry*math.sin(angle)
        ripple = 1 + .035*math.sin(3*angle)+.022*math.sin(7*angle)
        return x+ripple*(u*cs-v*sn), y+ripple*(u*sn+v*cs),height
    count=28
    for j in range(count):
        a,e = math.tau*j/count, math.tau*(j+1)/count
        # A three-metre-thick lip has a warm, sunlit upper rim and dark recessed inner walls.
        rings=[(9,6,roof-2),(9.5,6.5,roof),(17,12,roof-1.1),(23,18,roof-3.2),
               (25,19,roof*.67),(25.8,19.8,roof*.51),(26,20,0.25)]
        for row,(first,second) in enumerate(zip(rings,rings[1:])):
            if row >= 4 and math.sin((a+e)/2)>0.55:
                continue
            colour=lin([0x915C31,0xDDB477,0xE3BE83,0xC89556,0xE2B77A,0xB07843][row])
            pts=[ring(a,*first),ring(a,*second),ring(e,*second),ring(e,*first)]
            b.face(pts,(colour,)*4)
            if row>=3:
                b.face(pts[::-1],(lin(0x976C48),)*4)
        sand=lin(0xE9CA90)
        b.face(((x,y,.32),ring(a,25,19,.32),ring(e,25,19,.32)),(sand,)*3)


def lighthouse(b, x, y, z, yaw):
    """The white watch house and red lantern room on the windward cape."""
    white, rim, red, glass = [lin(c) for c in (0xF5EDD6,0xC4BEAD,0xB54133,0x638594)]
    b.box((x-4,y,z-1),(12,8,4.3),yaw,white)
    b.roof((x-4,y,z+3.3),12,8,1.5,yaw,lin(0xB06D4E))
    b.tube((x,y,z),3.65,3.05,11.8,white,white,16,white)
    b.tube((x,y,z+11.8),3.1,3.9,.85,rim,white,16,white)
    b.tube((x,y,z+12.65),2.8,2.8,2.6,glass,glass,12,red)
    for j in range(12):
        a=math.tau*j/12
        b.tube((x+2.8*math.cos(a),y+2.8*math.sin(a),z+12.6),.12,.12,2.65,red,red,5)
    b.tube((x,y,z+15.25),3.25,.48,1.75,red,red,16,red)
    b.tube((x,y,z+17),.1,.06,1.3,rim,rim,6,rim)

def scenery(k):
    b = Painted(k)
    palette = [0x677C56,0x8B975F,0xADC084,0xBC8051,0x96A273,0xE6C185,0xC5884C,
               0xD8AE70,0xA77446,0xD5A367,0xB58452,0xE9CE96,0x6FC1BB,0x43ADA9]
    previous = shore_section(k, 0)
    for i in range(2, k.n, 2):
        section = shore_section(k, i)
        for j, tint in enumerate(palette):
            colour = lin(tint)
            b.face((previous[j],section[j],section[j+1],previous[j+1]), (colour,)*4)
        previous = section
    # Ponta da Piedade is framed beyond the outside of the first tightening bend.
    i = k.road.index(210)
    for along,off,h,w in [(96,13,1.55,23),(140,32,1.25,26)]:
        x,y,z=k.P(i,along,off)
        rock_arch(b,x,y,z*h,w,k.s[i]["h"]+math.pi/2-0.18)
    for d in range(1090, int(k.length), 1300):
        i = k.road.index(d)
        for along, offshore, h, span in ((28,52,18,13),(60,73,24,16)):
            x,y,_ = k.P(i,along,offshore)
            rock_arch(b,x,y,h,span,k.s[i]["h"] + 0.4)
    for d in range(-25, int(k.length), 42):
        i = k.road.index(d)
        side = -k.rng.uniform(10,36)
        x,y,z = k.road.at(i,side)
        umbrella_pine(k,x,y,z,0.22)
        if d % 3:
            x,y,z = k.road.at(i, k.rng.uniform(8,12))
            agave(k,x,y,z)
    for d in range(15, int(k.length), 1700):
        for j in range(18):
            i = k.road.index(d + j*5)
            x,y,z = k.road.at(i,-14-(j%3)*10)
            h = 3.4 + (j%3)*1.45
            yaw = k.s[i]["h"]
            b.box((x,y,z-1), (6.4,5.4,h+1), yaw, lin(0xFBF2DB))
            b.roof((x,y,z+h),6.4,5.4,1.12,yaw,lin(0xBC6945))
            # Blue-painted sills, tiled doorstep, a chimney and shutters on both
            # street walls give the first terrace a readable face from the saddle.
            cs,sn=math.cos(yaw),math.sin(yaw)
            def local(u,v,up):
                return x+u*cs-v*sn, y+u*sn+v*cs, z+up
            blue,white,dark=lin(0x34739B),lin(0xF5E9CE),lin(0x344D54)
            b.box(local(1.6,-.9,h+.2),(.56,.62,1.37),yaw,white)
            b.box(local(1.6,-.9,h+1.55),(.78,.84,.17),yaw,lin(0xBD7750))
            b.box(local(-3.22,.32,.04),(.17,1.14,2.06),yaw,blue)
            b.box(local(-3.29,.32,.08),(.12,.82,1.83),yaw,dark)
            b.box(local(-3.56,.32,-.04),(.76,1.4,.14),yaw,white)
            for v in (-1.64,1.7):
                b.box(local(-3.24,v,1.04),(.13,.94,1.35),yaw,blue)
                b.box(local(-3.33,v,1.19),(.09,.62,.99),yaw,dark)
                b.box(local(-3.40,v,1.04),(.26,1.14,.12),yaw,white)
            for off in (-1.8,0,1.8):
                xx=x+off*math.cos(yaw)-2.73*math.sin(yaw)
                yy=y+off*math.sin(yaw)+2.73*math.cos(yaw)
                b.box((xx,yy,z+1.4),(0.82,0.09,1.2),yaw,lin(0x337DA1))
    i = k.road.index(530)
    x,y,z = k.P(i,80,15)
    benagil(b,(x,y),k.s[i]["h"],z-5)
    i = k.road.index(695)
    x,y,z = k.road.at(i,12)
    lighthouse(b,x,y,z,k.s[i]["h"])
    moored = Painted(k, "moored-boats")
    for d in range(440, int(k.length), 830):
        for j in range(4):
            i = k.road.index(d+j*12)
            x,y,_ = k.road.at(i,44+j*2)
            paint = moored if d == 440 else b
            gozzo(paint,k.rng,(x,y,0.52),k.s[i]["h"]+j*0.5)
    return {"efforts": 0}
