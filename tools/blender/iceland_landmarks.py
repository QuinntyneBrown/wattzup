"""The paired falls, Vatnajökull, Eldhraun and the lagoon in Route 1's native coordinate system."""
import math
import random

from iceland import at, bearing, height
from worldkit import lin


class Batch:
    def __init__(self,kit,name):
        self.mesh=type(kit.B['terrain'])(name,'terrain')
        self.mesh.colours=[]
        kit.B[name]=self.mesh

    def face(self,points,tone,shade=1):
        color=lin(tone)
        self.mesh.faces.append(tuple(self.mesh.v(p) for p in points))
        self.mesh.colours.extend([(color[0]*shade,color[1]*shade,color[2]*shade,1)]*len(points))

    def ring(self,lower,upper,tone):
        for j,p in enumerate(lower):
            k=(j+1)%len(lower)
            self.face((p,lower[k],upper[k],upper[j]),tone,.78+.18*math.cos(j*math.tau/len(lower)-.7))

    def dome(self,d,off,z,length,width,depth,tone,sides=9,tilt=0):
        rings=[]
        for scale,h in ((.75,-.12),(1,.20),(.83,.63),(.37,.94)):
            ring=[]
            for j in range(sides):
                a=j*math.tau/sides;wave=1+.09*math.cos(3*a+d*.01)
                u=length*math.cos(a)*scale*wave
                ring.append(at(d+u,off+width*math.sin(a)*scale*wave,z+h*depth+u*tilt))
            if rings:self.ring(rings[-1],ring,tone)
            rings.append(ring)
        for j in range(sides):
            self.face((rings[-1][j],rings[-1][(j+1)%sides],at(d,off,z+depth)),tone,1.04)


def cliffs_and_falls(rock,water,d,span,tall):
    # A broad amphitheatre faces the approaching rider. The lip projects ahead of its base.
    floor=height(d)-1
    def station(u,v,h):
        return at(d+u*.27+v,-29-u*.75,h)
    last=None
    for i in range(-7,43):
        u=i*4.0
        rim=tall+1.9*math.sin(u*.08)+2.1*math.sin(u*.16)
        towards=4*math.cos(u*.053)+2*math.sin(u*.17)
        row=[station(u,towards+v,floor+rim*f) for v,f in ((-4,0),(1,.12),(-.7,.23),(1,.37),(-2,.52),(2,.71),(-3,.88),(-5,1),(18,1.04),(40,.97))]
        if last:
            for j,c in enumerate((0x475542,0x514943,0x514D49,0x686057,0x524B4B,0x625A54,0x5C5B48,0x74814F,0x69784C)):
                rock.face((last[j],row[j],row[j+1],last[j+1]),c,.93+.09*math.sin(i*.83+j))
        last=row
    # Strands follow a free-falling jet. Its root sits on the rim and its base spreads into spray.
    for i in range(21):
        left=-span/2+i*span/21;right=left+span/21+.07
        last=None
        for j in range(10):
            t=j/9
            def edge(u):
                spread=u*(1+.29*t)
                return station(spread,-11-5*math.sqrt(t)+.32*math.sin(u*2+t*4),floor+(1-t)*(tall+1.45))
            row=(edge(left),edge(right))
            if last:water.face((last[0],last[1],row[1],row[0]),(0xC5DCDA,0xD7E5DF,0xA3C7C8,0xE3E9E1)[i%4])
            last=row
    for i in range(22):
        u=(i-11)*span/20
        water.dome(d-15+.8*math.sin(i),-44-u,floor,3.1,2.4,2.3+.8*math.cos(i),0xC4D6CF,7)


def outlet(rock,ice):
    # A snow cap between dark nunataks narrows into a wide, crevassed outlet at the lagoon.
    prev=None
    for j in range(44):
        t=j/43;d=11370+t*920;off=65+550*t+95*math.sin(t*math.pi)
        row=[]
        for i in range(25):
            u=(i-12)/12;w=83+135*t+27*math.sin(t*math.pi)
            h=42+247*t**1.55+8*(1-u*u)+2.4*math.sin(j*.61+u*9)+1.55*math.cos(u*32+j*.24)
            row.append(at(d+u*w,off+u*w*.19,h))
        if prev:
            for i in range(24):
                tone=(0xC1CFCE,0xBACCCF,0xD2DCDA,0x91B2BE,0xB3C4C8)[(i+j//7)%5]
                ice.face((prev[i],row[i],row[i+1],prev[i+1]),tone)
                if (i*3+j)%13==0:
                    v=prev[i];w=prev[i+1];z=row[i+1]
                    ice.face(((v[0],v[1],v[2]+.1),(w[0],w[1],w[2]+.1),((w[0]*.84+z[0]*.16),(w[1]*.84+z[1]*.16),w[2]+.35)),0x7394A3)
        prev=row


def channels(water):
    for start,end,side,width in ((3520,5170,-1,560),(9680,11980,1,540)):
        last=None
        for d in range(start,end,14):
            near=14+4*math.sin(d/59)+3*math.sin(d/27)
            z=45.8 if side==1 else height(d)-4.12
            row=[at(d,side*x,z) for x in (near,near+6,near+13,50,95,width)]
            if last:
                for i,c in enumerate((0xA0A99E,0x698D91,0x537F88,0x5F8790,0x73949B)):
                    water.face((last[i],row[i],row[i+1],last[i+1]),c)
            last=row
    for branch in range(3):
        prev=None
        for off in range(-440,451,10):
            d=8510+branch*29+off*.35+22*math.sin(off/66+branch*.71)
            w=9+5*math.sin(off/57+branch*.8)
            row=[at(d+u,off,height(8530)-3.85) for u in (-w,0,w)]
            if prev:
                for j in (0,1):water.face((prev[j],row[j],row[j+1],prev[j+1]),0x72999D)
            prev=row


def structures(art):
    for d,off,church in ((178,-22,True),(646,57,False),(1910,71,False),(3600,-41,True),(7050,55,False),(10080,-40,False)):
        angle=bearing(d)+.15;z=height(d)-.46
        for i in range(2 if church else 3):
            u=d+i*13;side=off+i*3;centre=at(u,side,z)
            art.box(centre,(9,5.2,3.8),angle,lin(0xE4DDD0))
            art.roof(at(u,side,z+3.8),9.8,6.1,2.1,angle,lin(0xA4493C))
            for window in (-2.7,0,2.7):
                art.box(at(u+window,side+(2.62 if off<0 else -2.62),z+1.26),(1,.13,1.3),angle,lin(0x53646B))
        if church:
            art.box(at(d-4,off,z),(2.65,3,7.0),angle,lin(0xE5E0D4))
            art.tube(at(d-4,off,z+7),2.05,0,4.7,lin(0x9B4D44),lin(0xA55646),4)
    for side in (-1,1):
        for d in range(8472,8600,4):
            z=height(d)
            art.box(at(d,side*2.31,z-.12),(.13,.16,1.25),bearing(d),lin(0x87908A))
            for h in (.52,1.13):art.box(at(d+2,side*2.31,z+h),(4.06,.14,.12),bearing(d),lin(0xA8ADA5))
            art.box(at(d+2,side*2.31,z-.70),(4.1,.35,.61),bearing(d),lin(0x636D69))


def animals(art,heads,k):
    rng=random.Random(414)
    for herd,group in ((10035,9),(10318,6),(11016,5),(8360,8)):
        for i in range(group):
            d=herd+i*rng.uniform(3,8);off=rng.choice((-1,1))*rng.uniform(7.2,19);z=height(d)-.44
            horse=i%3!=2;scale=1 if horse else .59
            coat=rng.choice((0x755246,0x514842,0xA58566,0xC6AA86)) if horse else 0xD1CABE
            art.dome(d,off,z+.70*scale,1.13*scale,.40*scale,.85*scale,coat)
            for u in (-.7,.70):
                for v in (-.23,.23):art.dome(d+u*scale,off+v*scale,z,.11*scale,.09*scale,.97*scale,0x493E38,6)
            heads.dome(d+1.02*scale,off,z+.55*scale,.56*scale,.27*scale,.68*scale,coat,8,-.4)
            heads.dome(d+1.36*scale,off,z+.40*scale,.38*scale,.22*scale,.40*scale,coat,8,-.22)
            art.dome(d-.97*scale,off,z+.62*scale,.18*scale,.14*scale,.62*scale,0x4F423A,6,-.26)


def landmarks(k,painted):
    rock=Batch(k,'Basalt');glacier=Batch(k,'Glacier');falls=Batch(k,'Falls')
    water=Batch(k,'GlacialWater');bergs=Batch(k,'Icebergs');heads=Batch(k,'Grazers')
    rng=random.Random(2139)
    cliffs_and_falls(rock,falls,1665,7.0,56)
    cliffs_and_falls(rock,falls,2525,28,59)
    outlet(rock,glacier);channels(water);structures(painted);animals(rock,heads,k)
    # The broad ice cap is fixed beyond the outlet. Each moving berg has its own silhouette in front.
    cap=Batch(k,'IceCap');cap.mesh.uvs=[]
    def plate(points,uv):
        cap.face(points,0xFFFFFF);cap.mesh.uvs.extend(uv)
    def ridge(d,across,width,h,base,west,east):
        x,y,z=at(d,across,base)
        plate(((x,y+width/2,z),(x,y-width/2,z),(x,y-width/2,z+h),(x,y+width/2,z+h)),((west,0),(east,0),(east,1),(west,1)))
    ridge(12850,80,4950,1040,-185,0,1)
    # The dark western foothill stays off the carriageway at the first falls.
    x,y,z=at(2780,960,-75)
    plate(((x-1900,y,z),(x+1900,y,z),(x+1900,y,z+510),(x-1900,y,z+510)),((.01,0),(.26,0),(.26,1),(.01,1)))
    def berg(d,side,width,tall,tone):
        # A calved block has a dark submerged foot and a scalloped, broken crown.
        rings=[]
        for scale,lift in ((.78,-.5),(1,.26),(.78,.77),(.40,1)):
            ring=[]
            for j in range(7):
                a=math.tau*j/7
                r=width*scale*(1+.19*math.cos(3*a+d))
                ring.append(at(d+math.cos(a)*r,side+math.sin(a)*r*.66,
                               45.8+tall*lift*(.79+.21*math.sin(a+.6))+.19*math.sin(a*3)))
            if rings:bergs.ring(rings[-1],ring,0x88BCC6 if lift<.5 else tone)
            rings.append(ring)
        for j in range(7):
            bergs.face((ring[j],ring[(j+1)%7],at(d+.11*width,side,45.8+tall*1.12)),0xD8EBE7)
    for d,side in ((10997,10.8),(11033,16.5),(11064,29.5),(11102,38)):
        berg(d,side,5.3,3.4,0xB1DADA)
    # Thin broken surf bands pick out the black strand around the sea stacks.
    for d in range(3770,5020,11):
        off=-19-3*math.sin(d/43)
        water.face(tuple(at(d+u,off+v,height(d+u)-3.88) for u,v in ((0,0),(9,.6),(10,-.38),(1,-.7))),0xE2D9C2)
    # Distant dark ridges close the horizon behind the western black-sand plain.
    for side in (-1,1):
        last=None
        for d in range(-250,10200,55):
            ridge=850+110*math.sin(d/480)+85*math.cos(d/170)
            top=height(d)+97+42*math.sin(d/380+side)+20*math.cos(d/113)+11*math.sin(d/48)
            base=height(d)-6
            row=[at(d,side*(ridge+width),base+(top-base)*fraction) for width,fraction in ((-240,0),(-120,.26),(-40,.61),(0,.90),(65,1),(130,.77))]
            if last:
                for i,tone in enumerate((0x646153,0x626556,0x67645C,0x73706A,0x837E76)):
                    rock.face((last[i],row[i],row[i+1],last[i+1]),tone,.89+.08*math.sin(d/134))
            last=row
    for j in range(48):
        d=9950+j*39+rng.uniform(-13,13);off=rng.uniform(22,165);r=rng.uniform(2.6,10)
        berg(d,off,r*1.25,r*.54,rng.choice((0xA5D1D5,0xDCE6E1,0xBBDDE0,0xB7DBE0)))
    for j in range(1700):
        d=rng.uniform(5450,7240);off=rng.choice((-1,1))*rng.uniform(5,103);r=rng.uniform(.65,3.3)
        rock.dome(d,off,height(d)-1.0,r*1.27,r,r*.77,rng.choice((0x667053,0x777C59,0x787E61,0x59634D,0x545849)),7)
    for d,off,r,h in ((4392,-23,4,17),(4436,-29,6,27),(4480,-48,5,19),(4550,-64,8,23)):
        rock.dome(d,off,height(d)-4.4,r,r*.83,h,0x464A50,6,.24)
    # Columnar basalt at Reynisfjara breaks the flat strand into a stepped cliff.
    for i in range(79):
        d=4330+i*2.7;off=-(62+6*math.sin(i/12));h=4+8*(1+math.sin(i/13))*.5
        xy=at(d,off,height(d)-3.8)
        painted.tube(xy,1.7,1.63,h,lin(0x343740),lin(0x5C6065),6,lin(0x77787A))
