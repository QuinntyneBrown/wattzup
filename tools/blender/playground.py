"""Five circuits of a shared urban park. Distances and landmarks recur at each lap."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

LAP=2645
R=LAP/math.tau
PROFILE=((0,23),(390,27),(830,24),(1310,28),(1810,21),(2290,24),(2645,23))


def height(d):
    d%=LAP
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)
    return 23


def pos(d,left=0,up=0):
    t=d/R
    return ((R-left)*math.sin(t), R-(R-left)*math.cos(t), height(d)+up)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=d/R,k=1/R,g=100*(height(d+bc.STEP)-z)/bc.STEP))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return rows,stages,length,mean,.02


def road(r,st,length,col,bc):
    b=bc.Builder('ParkAsphalt','terrain');b.colours=[]
    def strip(d,e,v,w,z,c):
        b.quad(pos(d,v,z),pos(e,v,z),pos(e,w,z),pos(d,w,z));b.colours.extend([lin(c)]*4)
    for d in range(0,LAP,5):
        e=min(LAP,d+5);strip(d,e,-4.5,4.5,.035,0xB6AC99);strip(d,e,-4.23,4.23,.057,0x555B59)
        for v in (-.105,.075):strip(d,e,v,v+.058,.070,0xE4CB79)
        if d%20==0:strip(d,d+2,3.44,3.52,.074,0xD4D0B9)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Park lawns','terrain');b.colours=[]
    def surface(d,v):
        if v<0:return height(d)+max(0,min(1,(-v-25)/120))*(4+2*math.sin(d/115))
        return height(d)+(23-height(d))*smooth(25,130,v)
    bands=(-350,-155,-70,-32,-16,-4,4,16,32,70,130,210,300,R)
    for d in range(0,LAP,10):
        e=min(d+10,LAP)
        for j,(u,v) in enumerate(zip(bands,bands[1:])):
            q=[]
            for t,s in ((d,u),(e,u),(e,v),(d,v)):
                x,y,_=pos(t,s);q.append((x,y,surface(t,s)-.07))
            b.quad(*q)
            for t,s in ((d,u),(e,u),(e,v),(d,v)):
                warm=int(3*math.sin(t/36+s/18)+2*math.cos(s/29+t/19));b.colours.append(lin(0x849952+warm*0x010101))
    b.build(col)
    def sample(x,y):
        t=math.atan2(x,R-y)%math.tau;return surface(t*R,R-math.hypot(x,y-R))-.07
    return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'PlaygroundTrees');people=pictured(k,'ParkFamilies')
    red,yellow,blue,green,metal,wood=[lin(c) for c in (0xC64F3D,0xE3B84F,0x417A9B,0x567E5F,0x6B7777,0x9D7451)]
    def slab(at,x,y,z,along,across,h,angle,color):art.box(at(x,y,z),(along,across,h),angle,color)
    def tube(at,x,y,z,r,high,c):art.tube(at(x,y,z),r,r,high,c,c,10,c)
    def quad(at,mesh,x,y,z,w,h,angle,j,cols,rows):
        dx=math.cos(angle)*w*.5;dy=math.sin(angle)*w*.5;u=j%cols/cols;v=1-(1+j//cols)/rows
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),((u+.001,v+.001),(u+1/cols-.001,v+.001),(u+1/cols-.001,v+1/rows-.001),(u+.001,v+1/rows-.001)))
    def bench(d,v):
        at,h=site(k,d,v);side=1 if v>0 else -1
        for x in (-.86,.86):
            for y in (-.24,.24):slab(at,x,y,0,.09,.09,.47,h,metal)
            beam(art,at(x,.25*side,.38),at(x,.34*side,.99),.07,.08,metal)
        for i in range(4):slab(at,0,(i-1.5)*.14,.44,2.13,.12,.09,h,wood)
        for z in (.69,.86):slab(at,0,.32*side,z,2.13,.09,.14,h,wood)
    for d in range(17,LAP,69):
        side=1 if (d//69)%3 else -1;v=5.85*side;bench(d,v)
        at,h=site(k,d+3,v);tube(at,0,0,0,.115,4.48,metal)
        for x in (-.68,.68):
            beam(art,at(0,0,4.08),at(x,0,4.64),.075,.075,metal)
            art.tube(at(x,0,4.40),.28,.21,.26,lin(0xF4E4B7),lin(0xE7D8AD),8,metal)
            art.tube(at(x,0,4.65),.32,.055,.17,metal,metal,8,metal)
    for d in range(2,LAP,7):
        for row in range(2):
            side=k.rng.choice((-1,1));v=side*k.rng.uniform(9 if row==0 else 44,39 if row==0 else 95)
            if side>0 and any(a<d<b for a,b in ((405,515),(860,975),(1790,2050),(2255,2370))):continue
            if side<0 and 1290<d<1390:continue
            at,_=site(k,d,v);x,y,z=at(0,0);floor=k.height_at(x,y)-z
            high=k.rng.uniform(8,17);j=k.rng.randrange(6);angle=k.rng.uniform(.9,1.8)
            quad(at,trees,0,0,floor,high*.97,high,angle,j,3,2)
            quad(at,trees,0,0,floor,high*.91,high,angle+math.pi*.50,j,3,2)
    # Two connected play decks, a curved slide and a suspended rope bridge.
    at,h=site(k,451,12)
    art.tube(at(0,0,-.12),16,16,.14,wood,wood,54,lin(0xBA9873))
    for x,c in ((-4.4,red),(4.4,blue)):
        for dx in (-1.55,1.55):
            for y in (-1.55,1.55):tube(at,x+dx,y,0,.115,4,green)
        slab(at,x,0,1.38,3.55,3.55,.23,h,wood)
        for j in range(4):
            a=j*math.pi/2+math.pi/4;b=a+math.pi/2
            art.face((at(x+2.78*math.cos(a),2.78*math.sin(a),3.93),at(x+2.78*math.cos(b),2.78*math.sin(b),3.93),at(x,0,5.36)),(c,c,yellow if j==2 else c))
        for y in (-1.55,1.55):
            beam(art,at(x-1.55,y,2.7),at(x+1.55,y,2.7),.08,.08,blue)
            for i in range(8):tube(at,x-1.35+i*.37,y,1.6,.038,1.1,yellow)
    for j in range(18):
        x=-2.85+j*.32;z=1.51-.43*math.cos(math.pi*x/5.7)
        slab(at,x,0,z,.29,1.12,.12,h,wood)
        for y in (-.58,.58):
            if j%3==0:beam(art,at(x,y,z),at(x,y,z+1),.04,.04,metal)
            beam(art,at(x,y,z+1),at(x+.32,y,z+1+.065*math.sin(x/1.8)),.055,.055,green)
    for j in range(16):
        def chute(n,v,up=0):
            t=n/16;return at(4.3+2.6*math.sin(t*math.pi*.68)+v,-1.62-4.9*t,1.59-1.37*smooth(0,1,t)+up)
        q=(chute(j,-.53),chute(j+1,-.53),chute(j+1,.53),chute(j,.53));art.face(q,(yellow,)*4)
        for v in (-.53,.53):art.face((chute(j,v),chute(j+1,v),chute(j+1,v,.2),chute(j,v,.2)),(red,)*4)
    for j in range(7):slab(at,-4.4,2+j*.34,1.40-j*.2,1.53,.39,.16,h,yellow)
    at,h=site(k,437,8)
    for x in (-3.1,3.1):
        for y in (-1.2,1.2):beam(art,at(x,y,0),at(x,0,3.5),.13,.13,blue)
    beam(art,at(-3.3,0,3.5),at(3.3,0,3.5),.15,.15,red)
    # Wet splash pad with a shade sail, colourful spray stems and flush nozzles.
    at,h=site(k,911,14)
    art.tube(at(0,0,-.14),12,12,.18,blue,blue,64,lin(0x80B9BC))
    for j,(x,y) in enumerate(((-5,0),(4,-3),(5,4),(-3,5))):
        c=(red,yellow,green,blue)[j];tube(at,x,y,.04,.14,2.8,c)
        art.tube(at(x,y,2.76),.87,.21,.32,c,c,18,c)
    corners=[at(-10,4,5.2),at(6,9,6.4),at(0,-7,4.5)]
    art.face(corners,(lin(0x60B6AA),lin(0xB1D6AA),green))
    for x,y,z in ((-10,4,5.2),(6,9,6.4),(0,-7,4.5)):tube(at,x,y,0,.115,z,metal)
    for j in range(8):tube(at,-3+j%4*1.6,-4+j//4*1.7,.03,.17,.06,metal)
    quad(at,people,3,-4,.1,1.9,1.38,1.34,3,4,2)
    # A low stone pond edge with concentric ripples around the fountain nozzle.
    at,h=site(k,1880,48)
    for j in range(72):
        def pt(n,scale,z):
            a=n*math.tau/72;return at(66*scale*math.cos(a),35*scale*math.sin(a),z)
        art.face((at(0,0,.04),pt(j,1,.04),pt(j+1,1,.04)),(lin(0x719DA1),lin(0x81AAA4),lin(0x739B99)))
        art.face((pt(j,1,.04),pt(j+1,1,.04),pt(j+1,1.035,.29),pt(j,1.035,.29)),(lin(0xB4AE95),)*4)
    art.tube(at(0,0,.04),2,1.8,.44,metal,metal,26,metal)
    for j in range(7):
        at,h=site(k,2288+j*9,10+5*(j%3))
        slab(at,0,0,.03,3.4,2.25,.055,h,(red,blue,yellow)[j%3])
        quad(at,people,0,0,.12,2.65,1.21,1.56+j*.2,4,4,2)
    for d,v,j in ((128,6,7),(448,7,6),(463,12,0),(884,9,0),(1318,-6,2),(1341,-7,6),(1864,8,7)):
        at,h=site(k,d,v);quad(at,people,0,0,.01,1.8,1.67,1.22,j,4,2)
    at,h=site(k,2341,28)
    for x in (-4.4,4.4):
        for y in (-3.1,3.1):tube(at,x,y,0,.15,3.1,wood)
    art.roof(at(0,0,3.10),10.4,7.6,2.2,h,green)
    for j in range(36):
        d=1390+j*35;at,h=site(k,d,-130-(j%4)*28);w=11+j%4;high=14+5*(j%6)
        slab(at,0,0,-4,w,12,high,h,lin((0xB79E84,0x9DA8A8,0xC1B39B)[j%3]))
        for x in range(-4,5,3):
            for z in range(2,high-5,3):slab(at,x,6,z,1.4,.15,1.45,h,lin(0x718991))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.23,'land':{'mid':0x87994D},'sky':[0xE2EEEC,0xC4E1EA,0xA2D0E8,0x76B4DE,0x5396CB],'haze':0xCEE0DD,'light':[0xFFF0C8,2.3],'fill':[0xB8D6E2,0x9C9B73],'sun_radius':7,'sun_altitude':.89,'sun_azimuth':-.86}
