"""Fall aspen groves, mining remains and the Sawatch skyline, in metres along Highway 82."""
import math
import random

from mathutils import Vector
from worldkit import lin


class Batch:
    def __init__(self, kit, name):
        self.mesh = type(kit.B['terrain'])(name, 'terrain')
        self.mesh.colours = []
        self.mesh.uvs = []
        kit.B[name] = self.mesh

    def face(self, points, colour, coordinates=None):
        self.mesh.faces.append(tuple(self.mesh.v(p) for p in points))
        self.mesh.colours.extend([lin(colour)] * len(points))
        self.mesh.uvs.extend(coordinates or [(0.,0.)] * len(points))


def beam(batch, a, b, diameter, tone, sides=7):
    a, b = Vector(a), Vector(b)
    axis = (b-a).normalized()
    v = axis.cross(Vector((0,0,1) if abs(axis.z)<.9 else (1,0,0))).normalized()*(diameter*.5)
    w = axis.cross(v)
    rings = [[point+v*math.cos(i*math.tau/sides)+w*math.sin(i*math.tau/sides) for i in range(sides)] for point in (a,b)]
    for i in range(sides):
        j=(i+1)%sides
        batch.face((rings[0][i],rings[0][j],rings[1][j],rings[1][i]),tone)
    batch.face(rings[1],0x98775D)
    batch.face(tuple(reversed(rings[0])),0x897159)


def forest(k,trees):
    rng=random.Random(2140)
    # Two crossed planes retain a crown's volume around a hairpin. Ground the trunks independently.
    for d in range(-55,10030,7):
        spruce=d>3650 and (d>5620 or rng.random()<.68)
        for side in (-1,1):
            for row in range(3 if d<7200 else 2):
                if d>8400 and rng.random()<(d-8400)/1850:continue
                off=side*(rng.uniform(6.3,14.0) if row==0 else rng.uniform(18,64))
                if side<0 and d<4800 and (12<abs(off)<31 or 1900<d<2580):continue
                if 5050<d<5460 and side<0:continue
                i=k.road.index(d+rng.uniform(-3,3))
                x,y,_=k.road.at(i,off)
                if k.road.tree.find((x,y,0))[2]<5.8:continue
                z=k.height_at(x,y)-.35
                h=rng.uniform(10,21) if spruce else rng.uniform(8.4,15)
                w=h*(.32 if spruce else .36)
                u=.5 if spruce else 0
                a=k.s[i]['h']+rng.uniform(-.42,.42)
                for angle in (a+.4,a+1.93):
                    dx=w*math.cos(angle);dy=w*math.sin(angle)
                    trees.face(((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),
                               0xFFFFFF,[(u+.002,0),(u+.498,0),(u+.498,1),(u+.002,1)])


def boulder(batch,centre,r,high,tone,seed):
    x,y,z=centre;phase=seed*.71
    rings=[]
    for frac,lift in ((.83,-.24),(1,.22),(.72,.68),(.27,.96)):
        ring=[]
        for i in range(7):
            ang=i*math.tau/7+phase
            radius=r*frac*(1+.13*math.sin(ang*3+seed))
            ring.append((x+radius*math.cos(ang),y+radius*.82*math.sin(ang),z+high*(lift+.05*math.sin(ang))))
        if rings:
            for j in range(7):batch.face((rings[-1][j],rings[-1][(j+1)%7],ring[(j+1)%7],ring[j]),tone)
        rings.append(ring)
    batch.face(ring,tone)


def river(k,water,stone):
    rng=random.Random(82)
    last=None
    for d in range(-70,5620,5):
        i=k.road.index(d);p=k.s[i]
        off=-16-8*math.sin(d/130)
        if 1940<d<2560:off=-10-2*math.sin(d/55)
        x,y,_=k.road.at(i,off)
        # The channel drops in steps at the cascade. The shallow lip is white in the current.
        rapid=1 if 1970<d<2510 else .3
        z=p['z']-1.0 if 1940<d<2560 else k.height_at(x,y)+.57
        row=[]
        for side in (-1,0,1):
            width=4.1+1.1*math.cos(d/58)
            xx,yy,_=k.road.at(i,off+side*width)
            row.append((xx,yy,z+side*.022))
        if last:
            for j in (0,1):
                water.face((last[j],row[j],row[j+1],last[j+1]),0x588E91)
            if d%30==0 or (rapid==1 and d%10==0):
                points=[]
                for u,v in ((0,-2.8),(1,-2.2),(2,2.2),(.71,2.6)):
                    xx,yy,_=k.road.pos(d+u,off+v);points.append((xx,yy,z+.12))
                water.face(points,0xD4E3D9)
        last=row
        if d%15==0:
            xx,yy,_=k.road.at(i,off+rng.uniform(-4,4))
            boulder(stone,(xx,yy,z),rng.uniform(.45,1.4),rng.uniform(.41,1.2),rng.choice((0x827D72,0x9A9487,0x77776E)),i)


def cabins(k,logs,art):
    for i,(d,off,length,width,roof) in enumerate(((5250,-12,8,4.8,True),(5277,-24,6.5,4.5,False),(5310,-16,9.3,4.8,True),(5355,-33,5.5,4,False))):
        x,y,z=k.road.pos(d,off)
        z=k.height_at(x,y)
        angle=k.s[k.road.index(d)]['h']+(.2 if i%2 else -.36)
        def local(a,b,h):
            return x+a*math.cos(angle)-b*math.sin(angle),y+a*math.sin(angle)+b*math.cos(angle),z+h
        for j in range(12 if roof else 5):
            colour=(0x8B715A,0x796551,0x776450,0x9A8167)[j%4]
            for side in (-1,1):
                sections=[(-length/2,length/2)]
                if side==1 and j<8:sections=[(-length/2,-1.82),(-.62,length/2)]
                for a,b in sections:beam(logs,local(a-.17,side*width/2,j*.225+.13),local(b+.17,side*width/2,j*.225+.13),.28,colour)
                beam(logs,local(side*length/2,-width/2-.21,j*.225+.19),local(side*length/2,width/2+.21,j*.225+.19),.25,colour)
        if roof:
            art.roof(local(0,0,2.7),length+.74,width+.87,1.63,angle,lin(0x777B78 if i else 0x8F7568))
            for side in (-1,1):
                logs.face((local(side*length/2,-width/2,2.72),local(side*length/2,width/2,2.72),local(side*length/2,0,4.30)),0x8B7059)


def alpine(k,stone,snow,lake,art):
    rng=random.Random(12095)
    for j in range(180):
        d=rng.uniform(9250,15200);off=rng.choice((-1,1))*rng.uniform(6.3,92)
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y);r=rng.uniform(.7,3.4)
        boulder(stone,(x,y,z),r,r*.63,0x91857B if j%2 else 0x77746D,j)
    for start,span,side in ((9050,180,-1),(10230,130,1),(11520,242,-1),(12740,240,1),(13990,260,1),(14860,182,-1)):
        last=None
        for j in range(0,span,3):
            d=start+j;t=j/span;h=math.sin(t*math.pi)**.6*1.35
            profile=[]
            for q,rise in ((5.8,-.05),(6.5,h),(8.2,h+.2),(11.5,h*.45),(14.7,-.2)):
                x,y,_=k.road.pos(d,(q+.28*math.sin(j*.14))*side)
                profile.append((x,y,k.height_at(x,y)+rise))
            if last:
                for q,c in enumerate((0xC7D1D0,0xE8ECE4,0xDFE6E0,0xDCE3DC)):snow.face((last[q],profile[q],profile[q+1],last[q+1]),c)
            last=profile
    # Only the water and low shore sit below the eastern overlook. Both lake basins have a fixed elevation.
    origin=k.road.pos(12080);angle=k.s[k.road.index(12080)]['h']
    for advance,side,length,width in ((460,94,150,100),(985,338,225,130)):
        cx=origin[0]+advance*math.cos(angle)-side*math.sin(angle)
        cy=origin[1]+advance*math.sin(angle)+side*math.cos(angle);z=origin[2]-116
        points=[]
        for j in range(57):
            a=j*math.tau/56;r=1+.13*math.sin(3*a)+.09*math.cos(5*a)
            points.append((cx+r*length*math.cos(a),cy+r*width*math.sin(a),z))
        for l,r in zip(points,points[1:]):
            lake.face(((cx,cy,z),l,r),0x416E89)
    # A fixed ring of original mountain relief stays outside all six road traverses.
    skyline=Batch(k,'SawatchSkyline')
    cx=(max(p['x'] for p in k.s)+min(p['x'] for p in k.s))/2
    cy=(max(p['y'] for p in k.s)+min(p['y'] for p in k.s))/2
    for i in range(32):
        a,b=i*math.tau/32,(i+1)*math.tau/32
        u=i%8/8;v=u+1/8
        if i//8%2:u,v=1-u,1-v
        def pt(angle,z):return cx+6900*math.cos(angle),cy+6900*math.sin(angle),z
        skyline.face((pt(a,2160),pt(b,2160),pt(b,4750),pt(a,4750)),0xFFFFFF,((u,0),(v,0),(v,1),(u,1)))


def landmarks(k,art):
    trees=Batch(k,'AspenGrove');water=Batch(k,'RoaringFork')
    stone=Batch(k,'SawatchRock');snow=Batch(k,'PassSnow');logs=Batch(k,'CabinLogs')
    sign=Batch(k,'DivideSign');lakes=Batch(k,'TwinLakes')
    forest(k,trees);river(k,water,stone);cabins(k,logs,art);alpine(k,stone,snow,lakes,art)
    # The sign faces the approach, upright on two timber posts at the geographic crest.
    d=15169
    for offset in (-3.9,-6.85):
        x,y,z=k.road.pos(d,offset)
        art.box((x,y,z-.32),(.22,.25,3.25),k.s[k.road.index(d)]['h'],lin(0x75634D))
    points=[k.road.pos(d-.19,off,h) for off,h in ((-3.40,1.06),(-7.34,1.06),(-7.34,3.65),(-3.40,3.65))]
    sign.face(points,0xFFFFFF,[(0,0),(1,0),(1,1),(0,1)])
