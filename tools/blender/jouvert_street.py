"""J'Ouvert's pavement bands, wall stains, bunting and Frederick Street wiring."""
import math
from worldkit import lin


def aprons(k):
    b=type(k.B['terrain'])('JouvertAprons','terrain');b.colours=[];b.uvs=[];k.B['JouvertAprons']=b
    rng=k.rng
    for d in range(-40,6320,4):
        for side in (-1,1):
            if (side>0 and 4780<d<4960) or rng.random()<.33:continue
            devils=1250<d<1600
            which=rng.choice((1,3)) if devils and rng.random()<.76 else rng.choice((0,2))
            h=rng.uniform(1.55,1.96);half=h*.46
            dist=d+rng.uniform(-1.3,1.3);off=side*rng.uniform(4.35,6.5)
            x,y,z=k.road.pos(dist,off,.14 if abs(off)>4.8 else 0)
            yaw=k.road.s[k.road.index(dist)]['h']+math.pi/2+side*rng.uniform(.05,.67)
            dx=half*math.cos(yaw);dy=half*math.sin(yaw)
            pts=((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h))
            b.faces.append(tuple(b.v(point) for point in pts));b.colours.extend([(1,1,1,1)]*4)
            u=which/4;b.uvs.extend(((u,0),(u+.25,0),(u+.25,1),(u,1)))


def street_colour(k,art):
    road=k.road
    def sheet(pts,c):
        art.face(pts,[lin(c)]*len(pts));art.face(pts[::-1],[lin(c)]*len(pts))
    for d in range(-10,6280,38):
        side=1 if d%3 else -1
        h=5.4
        for j in range(4):
            a=road.pos(d+j*9.5,side*6.3,h-.42*math.sin(j*math.pi/4))
            b=road.pos(d+(j+1)*9.5,side*6.3,h-.42*math.sin((j+1)*math.pi/4))
            sheet((a,b,(b[0],b[1],b[2]+.034),(a[0],a[1],a[2]+.034)),0x49434E)
        if d%3:
            for j in range(8):
                station=d+j*.93
                a=road.pos(station,side*6.32,5.34);b=road.pos(station+.59,side*6.32,5.28)
                tip=road.pos(station+.37,side*6.17,4.76)
                sheet((a,b,tip),(0xC15351,0xF3CC73,0x528D9A)[j%3])
        # Red, white and black Trinidad and Tobago flags hang from shop balconies.
        if d%4==0:
            for i,(a,b,c) in enumerate(((0,.30,0xBD393E),(.30,.37,0xD8CEC0),(.37,.58,0x393344),(.58,.65,0xD8CEC0),(.65,1,0xBD393E))):
                pts=[road.pos(d+u+.22*v,side*(6.86+.05*u),3.41+v*.71) for u,v in ((a,0),(b,0),(b,1),(a,1))]
                sheet(pts,c)
        # Pigment spatters on the retaining walls in the band sections.
        if 1250<d<1610 or 2490<d<2920:
            for j in range(8):
                dist=d+k.rng.uniform(0,27);off=side*6.85;z=k.rng.uniform(.4,1.7)
                art.box(road.pos(dist,off,z),(.76,.31,.62),road.s[road.index(dist)]['h'],lin(0x8A7771))
                pts=[road.pos(dist+.20*math.cos(i*math.tau/9),off-side*.169,z+.31+.19*math.sin(i*math.tau/9)) for i in range(9)]
                sheet(pts,(0xB74E88,0x498F94,0xBAA362)[j%3])
