"""Cape Breton's western coast from Chéticamp through two highland passes to Pleasant Bay."""
import math
import random
from worldkit import Painted, lin, smooth

HEIGHTS = ((0,9),(1300,13),(2500,45),(4200,90),(5800,180),(7600,305),(9200,390),
           (10400,410),(11900,330),(13900,255),(15500,298),(17500,390),(19100,432),
           (19900,382),(21000,255),(22600,100),(23900,20),(25075,8))


def height(d):
    for (a,low),(b,high) in zip(HEIGHTS,HEIGHTS[1:]):
        if d<=b:
            return low+(high-low)*smooth(a,b,d)
    return HEIGHTS[-1][1]


def heading(d):
    coastal=.24*math.sin(d/380)+.14*math.sin(d/170)
    for middle in (3090,5960,7580,15750,18400,19940,21400):
        # Looking back from the switchback reveals the opposing cut and the Gulf.
        coastal+=1.51*(smooth(middle-380,middle-165,d)-smooth(middle-70,middle+55,d))
        coastal-=1.14*(smooth(middle-75,middle+75,d)-smooth(middle+200,middle+408,d))
    return coastal


def relief(d,l):
    z=height(d)
    if abs(l)<5:return z-.16
    coast=1-smooth(8640,9630,d)+smooth(17700,18600,d)
    if l<0:
        width=-l-5
        toe=55+z*.48+20*math.sin(d/245)
        shore=z+(1-z)*smooth(0,toe,width)-max(0,width-toe)*.21
        valley=z-width*(.36+.13*math.cos(d/370))+4*math.sin(width/57)*math.sin(d/390)
        return coast*shore+(1-coast)*valley-.15
    cut=smooth(1450,2050,d)*(1-smooth(22900,23600,d))
    plateau=smooth(8950,9600,d)*(1-smooth(11100,11700,d))
    return z-.16+(l-5)*(.06+cut*(1-plateau)*(.36+.26*math.sin(d/240)))+2.5*smooth(8,18,l)*math.sin(l/32+d/120)


def land(road,col,theme,bc):
    b=bc.Builder('Cape Breton cut faces, plateau and tidal coves','terrain');b.colours=[]
    lanes=(-380,-270,-190,-140,-100,-72,-48,-32,-19,-11,-7,-4.3,0,4.3,6.3,9,14,22,38,67,108,190,310)
    for i in range(0,len(road.s)-1,4):
        j=min(i+4,len(road.s)-1)
        for a,c in zip(lanes,lanes[1:]):
            pts=[];colours=[]
            for n,l in ((i,a),(j,a),(j,c),(i,c)):
                d=road.s[n]['d'];z=relief(d,l);pts.append(road.at(n,l,z-height(d)))
                band=math.sin(d/35+l/15)+.44*math.sin(d/13-l/7)
                if abs(l)<8: tint=0xA29887 if band>.1 else 0x958A77
                elif z<3:tint=0x997F72 if band>0 else 0x726862
                elif 1600<d<23200 and 8<l<18 and not 9000<d<11300:tint=0x8E847B if band>0 else 0x6D6761
                elif 9300<d<11600:tint=0x917C4F if band>0 else 0x6A7046
                else:tint=0x71814A if band>.5 else (0x596F48 if band>-.65 else 0x806E47)
                colours.append(lin(tint))
            b.quad(*pts);b.colours.extend(colours)
    sea=bc.Builder('Gulf of St Lawrence','sea')
    sea.quad((-8000,-24000,0),(37000,-24000,0),(37000,3600,0),(-8000,3600,0));sea.build(col)
    return b.build(col),lambda x,y:0


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=heading(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=heading(d),k=heading(d+.5)-heading(d-.5),g=(height(d+.5)-height(d-.5))*100))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,0


def roadway(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');edge=bc.Builder('RoadPaint','paint');lines=bc.Builder('CentreLine','terrain');lines.colours=[]
    for i in range(len(road.s)-1):
        def stripe(b,a,c,h):
            b.quad(road.at(i,a,h),road.at(i+1,a,h),road.at(i+1,c,h),road.at(i,c,h))
        stripe(asphalt,-4.1,4.1,0)
        for side in (-1,1):
            stripe(edge,side*3.72-.058,side*3.72+.058,.012)
            stripe(lines,side*.155-.064,side*.155+.064,.016)
            yellow=lin(0xE8B742 if i%61>1 else 0xC2A26C);lines.colours.extend((yellow,)*4)
    for b in (asphalt,edge,lines):b.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'terrain':{'sea':True},
       'land':{'mid':0x778151},'sky':[0xDCE5E6,0xC7E0ED,0xA2CDE4,0x87B4D8,0x6497C9],
       'haze':0xB9CDD5,'light':[0xFFEDCD,3.1],'fill':[0xC7DDEC,0xA59573],
       'sun_azimuth':-.84,'sun_altitude':.54,'palette':{'asphalt':0x515351},'chunks':{'Land':2}}


def scenery(k):
    art=Painted(k)
    rng=random.Random(2091)
    def ground(d,l):
        x,y,_=k.road.pos(d,l)
        return x,y,relief(d,l)
    def building(d,l,w,b,h,colour,roof):
        x,y,z=ground(d,l);yaw=heading(d);art.box((x,y,z),(w,b,h),yaw,lin(colour))
        art.roof((x,y,z+h),w,b,b*.36,yaw,lin(roof))
        for j in range(-2,3):
            off=j*w/6
            xx=x+off*math.cos(yaw)+(b*.5+.04)*math.sin(yaw)
            yy=y+off*math.sin(yaw)-(b*.5+.04)*math.cos(yaw)
            art.box((xx,yy,z+h*.47),(w*.09,.16,h*.30),yaw,lin(0x536778))
    for start,end in ((-40,740),(23840,25150)):
        for d in range(start,end,38):
            if 115<d<210:continue
            building(d,rng.uniform(11,25),rng.uniform(9,15),rng.uniform(6,9),rng.uniform(3.1,5.3),
                     rng.choice((0xD9CDB2,0xC2D2C5,0xAA6251,0xE1D9C6)),rng.choice((0x5B635D,0x885544)))
        d=start+240;x,y,_=ground(d,-49)
        art.box((x,y,2.2),(95,8,.63),heading(d),lin(0x867663))
        for offset in range(-44,45,6):
            xx=x+offset*math.cos(heading(d));yy=y+offset*math.sin(heading(d))
            for side in (-3,3):art.tube((xx,yy+side,-1),.29,.27,3.3,lin(0x443D34),lin(0x806C52),6)
    # Saint-Pierre's limestone nave, projecting bell tower, belfry and tall silver spire.
    d=175;building(d,20,33,13,9,0xA9A29A,0x767D83)
    x,y,z=ground(157,18);yaw=heading(157)
    art.box((x,y,z),(7.8,7.8,17),yaw,lin(0xB7B3A7))
    art.box((x,y,z+17),(8.4,8.4,.65),yaw,lin(0xDDDED6))
    art.tube((x,y,z+17.6),3.85,3.1,5.7,lin(0x586168),lin(0xCBD0CD),8)
    art.tube((x,y,z+23.3),3.2,.17,14,lin(0xA0ACB2),lin(0xECEBE3),8)
    art.box((x,y,z+37),(.22,.22,2.0),yaw,lin(0x4B4B45))
    art.box((x,y,z+38),(.2,1.3,.2),yaw,lin(0x4B4B45))
    for d in range(1250,23900,11):
        if 9050<d<11850 or d%750<65:continue
        a=k.road.pos(d,-5.1,.63);b=k.road.pos(d+11,-5.1,.63)
        mid=tuple((u+v)/2 for u,v in zip(a,b))
        art.box(mid,(math.hypot(b[0]-a[0],b[1]-a[1])+.1,.13,.27),
                math.atan2(b[1]-a[1],b[0]-a[0]),lin(0xADACA0))
        art.box(k.road.pos(d,-5.1,-.22),(.17,.21,1.17),heading(d),lin(0x807967))
    for d in range(-60,25220,12):
        for side in (-1,1):
            l=side*rng.uniform(15,91)
            if d<900 or d>23600 or 9450<d<11200 and abs(l)<34:continue
            x,y,z=ground(d,l)
            if z<5:continue
            h=rng.uniform(5.2,13);spruce=9000<d<14200 or rng.random()<.41
            art.tube((x,y,z),h*.027,h*.012,h*.56,lin(0x54483B),lin(0x786951),5)
            if spruce:
                for layer in range(3):
                    r=h*(.23-.045*layer)
                    art.tube((x,y,z+h*(.22+.19*layer)),r,.01,h*(.43-.025*layer),
                             lin(0x284938),lin((0x51704C,0x698357,0x526D4C)[layer]),6)
            else:
                tint=rng.choice((0xC95428,0xD78532,0xBB4831,0xDEAB46,0xAA6538,0x9D923C))
                for j in range(3):
                    dx,dy=rng.uniform(-.16,.16)*h,rng.uniform(-.16,.16)*h
                    art.tube((x+dx,y+dy,z+h*(.39+.08*j)),h*.16,h*.24,h*.22,lin(0x74532F),lin(tint),7)
                    art.tube((x+dx,y+dy,z+h*(.61+.08*j)),h*.24,h*.04,h*.21,lin(tint),lin(tint),7)
    # Flat peat pools catch the sky between broad breaks in the plateau forest.
    for j in range(17):
        d=9750+j*81;l=-rng.uniform(17,48);x,y,z=ground(d,l)
        art.tube((x,y,z+.08),rng.uniform(4,9),rng.uniform(4,9),.09,lin(0x4C6363),lin(0x647B7C),13,lin(0x71898A))
    ridge=Painted(k,'peaks')
    for row in range(3):
        previous=None
        for j in range(300):
            x=j*107-2400;y=1000+row*920+210*math.sin(j*.12+row)
            high=350+row*118+98*math.sin(j*.14+row)+49*math.cos(j*.33)
            section=((x,y-650,-8),(x,y-390,high*.37),(x,y-175,high*.74),(x,y,high))
            if previous:
                for band,tint in enumerate(((0x647654,0x768766,0x899879),(0x869B8C,0x93A79A,0xA5B4A6),(0xA1B2B3,0xAFBCB8,0xB9C5C2))[row]):
                    co=lin(tint);ridge.face((previous[band],section[band],section[band+1],previous[band+1]),(co,)*4)
            previous=section
    return {'efforts':0}
