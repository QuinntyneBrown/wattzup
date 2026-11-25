"""Headland Road: a 32 km eastbound clifftop road, with open water to the south."""

from bisect import bisect_left
import math

from worldkit import Painted, lin


def lay(course, theme, bc):
    samples, stages, length, mean, level = bc.lay_centre_line(course, theme)
    x = y = 0
    for p in samples:
        d = p["d"]
        turn = 0.66 * math.sin(d / 322 + 0.5) + 0.27 * math.sin(d / 93) + 0.14 * math.sin(d / 1100)
        curvature = 0.66 / 322 * math.cos(d / 322 + 0.5) + 0.27 / 93 * math.cos(d / 93) + 0.14 / 1100 * math.cos(d / 1100)
        x += bc.STEP * math.cos(turn)
        y += bc.STEP * math.sin(turn)
        p.update(x=x, y=y, h=turn, k=curvature)
    return samples, stages, length, mean, level


def section(p):
    """A section from the tidal shelf to the distant inland ridge, in metres left of the road."""
    d, z = p["d"], p["z"]
    cove = 9 * math.sin(d / 69) + 3.4 * math.sin(d / 24)
    # A shelf over the water broadens into the lighthouse point and at the lookouts.
    point = 63 * math.exp(-((d - 9880) / 134) ** 2)
    turnout = max((11 * math.exp(-((d - q) / 32) ** 4) for q in LOOKOUTS), default=0)
    brow = -21 - 0.57 * cove - point - turnout
    toe = brow - 17 - z * 0.18
    return [(toe - 50,-4), (toe-14,-0.7), (toe,1.2), (toe+2,4), (toe+5,z*.23),
            (toe+7,z*.26), (toe+10,z*.42), (toe+12,z*.44), (brow-4,z*.78),
            (brow-2,z*.83), (brow-1,z-1.9), (brow,z-.55), (-6,z-.22), (6,z-.22),
            (15,z+1.6), (38,z+9), (100,z+29+5*math.sin(d/87)),
            (340,z+95+33*math.sin(d/403)), (1600,z+185+85*math.sin(d/1070))]


LOOKOUTS = (650, 2430, 6160, 9800, 15960, 21700, 25900, 29900)


def terrain(road, col, theme, bc):
    samples = road.s
    xs = [p["x"] for p in samples]
    cuts = [section(p) for p in samples]
    palette = (0x42646b,0x817c6d,0x424c51,0x797367,0xc0aa87,0x74634e,0xc5ad90,
               0x8a705b,0xd2ad7c,0x886d56,0xb4a27b,0x839151,0x838756,0x808b4d,
               0x8d985d,0x657a48,0x546a4d,0x647968,0x8a9990)
    colours = [bc.srgb(c) for c in palette]
    land = bc.Builder("Terrain","terrain")
    land.colours = []
    previous = None
    for i in list(range(0,len(samples)-1,3))+[len(samples)-1]:
        p = samples[i]
        row = []
        for j,(offset,height) in enumerate(cuts[i]):
            row.append(land.v((p["x"],p["y"] + offset / math.cos(p["h"]),height)))
            shade = .93+.07*math.sin(i*.27+j*.45)+.035*math.cos(i*.13+j)
            land.colours.append(tuple(c*shade for c in colours[j][:3])+(1,))
        if previous:
            for j in range(len(row)-1):
                land.faces.append((previous[j],row[j],row[j+1],previous[j+1]))
        previous=row
    obj=land.build(col)
    sea=bc.Builder("Sea","sea")
    sea.quad((-15000,-30000,0),(xs[-1]+15000,-30000,0),(xs[-1]+15000,2000,0),(-15000,2000,0))
    sea.build(col)

    def height_at(x,y):
        i=min(len(xs)-1,max(0,bisect_left(xs,x)))
        p=samples[i]
        off=(y-p["y"])*math.cos(p["h"])
        edges=cuts[i]
        for (a,za),(b,zb) in zip(edges,edges[1:]):
            if off<=b:
                return za+(zb-za)*max(0,(off-a)/(b-a))
        return edges[-1][1]
    return obj,height_at


def lookout(k,paint,station):
    i=k.road.index(station)
    yaw=k.s[i]["h"]
    # Gravel access tapers at each end. The car stands clear of the travel lane.
    for q in range(i-7,i+7):
        widths=[7+7*math.sin(math.pi*(j-(i-7))/14) for j in (q,q+1)]
        corners=[k.road.at(q,-6,-.045),k.road.at(q+1,-6,-.045),
                 k.road.at(q+1,-widths[1],-.045),k.road.at(q,-widths[0],-.045)]
        paint.face(corners[::-1],[lin(0xa79780)]*4)
    for n in range(2):
        j=i-2+n*4
        col=lin((0x477889,0xb56c52)[n])
        def part(along,left,up,dims,colour):
            paint.box(k.P(j,along,left,up),dims,yaw,colour,.9)
        part(0,-9.5,.25,(4.1,1.72,.62),col)
        part(-.12,-9.5,.85,(2.32,1.48,.65),lin(0x3d5359))
        part(-.12,-9.5,1.49,(2.38,1.5,.11),col)
        for side in (-1,1):
            for end in (-1,1):
                part(end*1.25,-9.5+side*.85,.08,(.63,.14,.49),lin(0x383937))
            part(2.06,-9.5+side*.61,.62,(.06,.39,.17),lin(0xf4dfb3))


def scenery(k):
    paint=Painted(k)
    stone=lin(0xb7a48b)
    for i in range(1,k.n-1):
        d=k.s[i]["d"]
        if any(abs(d-q)<33 for q in LOOKOUTS):
            continue
        x,y,z=k.road.at(i,-7.5)
        yaw=k.s[i]["h"]
        if (i//66)%3==0:
            paint.box((x,y,z-.19),(4.10,.54,.93),yaw,stone,.75)
            paint.box((x,y,z+.74),(4.02,.65,.12),yaw,lin(0xcbb696),.85)
        else:
            k.B["rail"].box((x,y,z+.59),(4.10,.13,.26),yaw)
            if i%2==0:k.B["dark"].box((x,y,z-.14),(.15,.16,.98),yaw)
    for station in LOOKOUTS:
        lookout(k,paint,station)
    # Small battered ledges and honey-yellow gorse steer the eye around the turn.
    for i in range(3,k.n-3,2):
        p=k.s[i]
        off=k.rng.uniform(9,44)
        x,y,_=k.road.at(i,off)
        z=k.height_at(x,y)
        for j in range(3):
            dx,dy=k.rng.uniform(-1,1),k.rng.uniform(-.7,.7)
            k.blob(k.B["bush"],(x+dx,y+dy,z+.43),k.rng.uniform(.5,1.1))
            if j==1:
                for q in range(3):
                    r=k.rng.uniform(.12,.26)
                    paint.tube((x+dx+k.rng.uniform(-.5,.5),y+dy+k.rng.uniform(-.4,.4),z+.88),r,r*.6,.15,
                               lin(0xc8a444 if i%7 else 0x9c7184),lin(0xe5c151 if i%7 else 0xb28aa1),5)
    i=k.road.index(9880)
    x,y,_=k.road.at(i,-34)
    z=k.height_at(x,y)
    white,black=lin(0xe8dfc9),lin(0x393f42)
    paint.tube((x,y,z-2),5.2,4.65,4,lin(0x938778),white,16)
    paint.tube((x,y,z+2),4.2,2.6,23,white,white,20)
    paint.tube((x,y,z+25),3.2,3.8,1,black,white,16)
    paint.tube((x,y,z+26),2.35,2.35,3,lin(0x6f939a),lin(0xc2ccbf),12)
    for q in range(16):
        a=q*math.tau/16
        paint.tube((x+3.55*math.cos(a),y+3.55*math.sin(a),z+26),.08,.08,1,black,black,5)
        if q%2==0:
            paint.tube((x+2.31*math.cos(a),y+2.31*math.sin(a),z+26),.11,.11,3,black,black,5)
    paint.tube((x,y,z+29),2.9,.12,2,black,black,16)
    paint.tube((x,y,z+31),.15,.04,1.1,black,black,6)
    for up in (4,10,16,21):
        paint.box((x-3.6+(up-4)*.06,y,z+up),(.28,.87,1.4),0,black,.9)
    surf=[]
    for i in range(0,k.n,8):
        p=k.s[i]
        toe=section(p)[2][0]
        surf.append([round(p["d"],1),round(p["x"],2),round(-p["y"]-(toe-4)/math.cos(p["h"]),2)])
    return {"efforts":k.gates("accent","accent-2",[f"crowd-{i}" for i in range(6)]),
            "headland":{"lookouts":list(LOOKOUTS),"surf":surf}}
