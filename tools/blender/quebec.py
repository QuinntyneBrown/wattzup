"""Two measured laps through Québec's lower and upper town and its ramparts."""
import bisect
import math
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin,smooth

LAP=6612.5
PROFILE=((0,15),(370,17),(1080,22),(1720,20),(2050,27),(2260,46),(2540,73),(2730,85),(3390,92),(3970,88),(4630,84),(5160,82),(5557.5,70),(5950,46),(6320,23),(6612.5,15))
STREETS=((-250,-180),(-560,-180),(-610,-90),(-290,-80),(-225,-44),(-370,30),
         (-520,80),(-568,180),(-340,230),(-160,158),(-45,90),(55,124),(140,260),
         (300,290),(440,200),(590,135),(615,55),(460,22),(370,80),(255,75),
         (230,-4),(390,-70),(640,-105),(650,-195),(300,-202),(200,-140),(40,-110),(-128,-125))


def spline(i,t):
    a,b,c,d=[STREETS[(i+j)%len(STREETS)] for j in (-1,0,1,2)]
    return tuple(.5*(2*b[n]+(-a[n]+c[n])*t+(2*a[n]-5*b[n]+4*c[n]-d[n])*t*t+
                       (-a[n]+3*b[n]-3*c[n]+d[n])*t**3) for n in (0,1))


RAW=[spline(i,j/40) for i in range(len(STREETS)) for j in range(40)]+[STREETS[0]]
CHAIN=[0.]
for a,b in zip(RAW,RAW[1:]):CHAIN.append(CHAIN[-1]+math.dist(a,b))
SCALE=LAP/CHAIN[-1]


def height(d):
    d%=LAP
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)


def centre(d):
    s=((d+535)%LAP)/SCALE;i=min(len(RAW)-2,bisect.bisect_right(CHAIN,s)-1)
    a,b=RAW[i:i+2];f=(s-CHAIN[i])/(CHAIN[i+1]-CHAIN[i])
    return tuple((a[n]+(b[n]-a[n])*f)*SCALE for n in (0,1))


def heading(d):
    a,b=centre(d-.5),centre(d+.5)
    return math.atan2(b[1]-a[1],b[0]-a[0])


def pos(d,v=0,up=0):
    x,y=centre(d);h=heading(d)
    return x-v*math.sin(h),y+v*math.cos(h),height(d)+up


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pos(d);h=heading(d);diff=heading(d+.5)-heading(d-.5)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=math.atan2(math.sin(diff),math.cos(diff)),g=100*(height(d+bc.STEP)-z)/bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,.04


def road(r,st,length,col,bc):
    stone=bc.Builder('QuebecSetts','terrain');stone.colours=[];stone.uvs=[]
    curb=bc.Builder('RueSidewalk','terrain');curb.colours=[]
    for i in range(math.ceil(LAP/3)):
        d=i*3;e=min(LAP,d+3);narrow=1-.22*smooth(800,960,d)*(1-smooth(1300,1530,d))
        for a,b,z,c in ((-5.25,5.25,.10,0x9C9991),(-3.8,3.8,.14,0xB9B3A8)):
            pts=((d,a*narrow),(e,a*narrow),(e,b*narrow),(d,b*narrow))
            layer=stone if b<4 else curb
            layer.quad(*[pos(t,v,z) for t,v in pts]);layer.colours.extend([lin(c)]*4)
            if layer is stone:layer.uvs.extend((v/2.7,t/2.7) for t,v in pts)
    stone.build(col);curb.build(col)


def shore(y):return 989+30*math.sin(y/174)


def land(r,col,theme,bc):
    floor=bc.Builder('CitadelEarth','terrain');floor.colours=[]
    water=bc.Builder('SaintLawrence','terrain');water.colours=[];water.uvs=[]
    def ground(x,y):
        _,i,dist=r.tree.find((x,y,0));d=r.s[i]['d']
        z=height(d)-.28-3.4*smooth(0,23,dist)
        ledge=shore(y)-x
        z+= (4-z)*(1-smooth(0,42,ledge))
        return z
    for x in range(-1150,1100,16):
        for y in range(-630,680,16):
            pts=[(x+a,y+b) for a,b in ((0,0),(16,0),(16,16),(0,16))]
            floor.quad(*[(u,v,ground(u,v)-1.4) for u,v in pts])
            for u,v in pts:
                n=int(4*math.sin(u/29+v/37));floor.colours.append(lin(0x899460+n*0x010101))
    for i in range(math.ceil(LAP/4)):
        d=i*4;e=min(LAP,d+4)
        for a,b in ((-18,-6),(-6,6),(6,18)):
            pts=[]
            for t,v in ((d,a),(e,a),(e,b),(d,b)):
                x,y,z=pos(t,v);pts.append((x,y,z-.13 if abs(v)<7 else ground(x,y)-1.35))
            floor.quad(*pts);floor.colours.extend([lin(0xA09784)]*4)
    for y in range(-3300,3300,40):
        p=((shore(y)-4,y,5),(2200,y,5),(2200,y+40,5),(shore(y+40)-4,y+40,5))
        water.quad(*p);water.colours.extend([lin(0x638A95)]*4);water.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
        floor.quad((2130,y,1),(2610,y,28+13*math.sin(y/189)),(2610,y+40,28+13*math.sin((y+40)/189)),(2130,y+40,1))
        floor.colours.extend([lin(0x859781)]*4)
    floor.build(col);water.build(col)
    return None,ground


def scenery(k):
    from bondi import beam
    art=Painted(k);facades=pictured(k,'QuebecHouses');maples=pictured(k,'QuebecMaples')
    masonry=pictured(k,'RampartStone');roofing=pictured(k,'ChateauCopper');deck=pictured(k,'DufferinPlanks')
    stone,slate,green,iron,white,wood,brick,bronze=[lin(c) for c in (0x9C978C,0x6E7880,0x477365,0x34494A,0xDFDCC8,0xA2805A,0x9B6853,0x566559)]
    def site_at(d,v):
        at,h=site(k,d,v);x,y,z=at(0,0);return at,h,k.height_at(x,y)-z
    def panel(at,mesh,x,y,z,w,h,angle,id,cols,rows):
        dx=math.cos(angle)*w/2;dy=math.sin(angle)*w/2;u=id%cols/cols;v=1-(1+id//cols)/rows
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),((u+.001,v+.001),(u+1/cols-.001,v+.001),(u+1/cols-.001,v+1/rows-.001),(u+.001,v+1/rows-.001)))
    def surface(mesh,pts,width,high):
        picture(mesh,pts,((0,0),(width,0),(width,high),(0,high)))
    def building(d,v,w,b,t,id):
        at,h,z=site_at(d,v);z-=.25
        art.box(at(0,0,z),(w,b,t),h,stone)
        for side in (-1,1):
            panel(at,facades,0,side*(b/2+.03),z,w,t,0,id,2,2)
            panel(at,facades,side*(w/2+.03),0,z,b,t,math.pi/2,id,2,2)
        roof=lin((0x71818B,0x936759,0x6D7772)[id])
        art.roof(at(0,0,z+t),w+.53,b+.5,b*.43,h,roof)
        for xx in (-w*.28,w*.24):
            for side in (-1,1):
                art.box(at(xx,side*b*.32,z+t+.58),(1.17,1.34,1.62),h,white)
                art.box(at(xx,side*(b*.32+.69),z+t+.83),(.71,.08,.99),h,iron)
                art.roof(at(xx,side*b*.32,z+t+2.16),1.5,1.60,.67,h,roof)
        art.box(at(w*.29,0,z+t+b*.38),(.74,.78,2.05),h,brick)
    def tree(d,v,id,high):
        at,h,z=site_at(d,v)
        for a in (.43,2.00):panel(at,maples,0,0,z,high*(.74 if id==3 else .96),high,a,id,3,2)
    for d in range(12,6500,52):
        for side in (-1,1):
            if 4410<d<4890 and pos(d,side*12)[0]>pos(d)[0]:continue
            if 1970<d<2540 and side>0:continue
            if 3260<d<3470 or 5480<d<5640:continue
            tree(d,side*(13+d%14),d%3,8+d%5)
    for lo,hi in ((-42,245),(820,1300),(1750,2020),(2640,2890),(3910,4160),(5880,6140)):
        for d in range(lo,hi,14):
            for side in (-1,1):
                if ((lo<0 and side<0) or (1000<d<1150 and side>0) or (d%6==0 and side>0)):continue
                building(d%LAP,side*(9.7+d%5),10.2+d%4,6.6+d%3,7.3+d%3,d%3)
    # A stone merchant square, with the row of houses facing across its paving.
    for j in range(7):building(71+j*12.8,-28,11.2,7.6,8.5+(j%3),j%3)
    at,h,z=site_at(116,-17)
    surface(deck,(at(-30,-8,z+.14),at(50,-8,z+.14),at(50,8,z+.14),at(-30,8,z+.14)),15,4)
    # The Escalier Casse-Cou steps and green iron banisters climb beside the boutiques.
    at,h,z=site_at(1108,8)
    for j in range(31):
        art.box(at(j*.47,0,z),(0.52,4.8,.19*(j+1)),h,stone)
        for side in (-1,1):
            if j%4==0:art.box(at(j*.47,2.25*side,z+.19*j),(.08,.08,1.07),h,green)
            beam(art,at(j*.47,2.25*side,z+.19*j+1.08),at((j+1)*.47,2.25*side,z+.19*(j+1)+1.08),.08,.075,green)
    for d in range(28,6580,64):
        at,h,z=site_at(d,-5.85)
        art.tube(at(0,0,z),.19,.085,3.89,iron,iron,9,iron)
        for x in (-.48,.48):
            beam(art,at(0,0,z+3.22),at(x,0,z+3.61),.065,.065,iron)
            art.tube(at(x,0,z+3.61),.12,.26,.27,white,white,10,white)
            art.tube(at(x,0,z+3.88),.26,.06,.21,white,white,10,white)
    # Château Frontenac stands once on its own cliff through both circuits.
    at,h,z=site_at(2450,57)
    baseline=max(80-height(2450),z)
    def chateau_block(x,y,w,b,t):
        floor=baseline;art.box(at(x,y,floor-4),(w,b,t+4),h,brick)
        for side in (-1,1):
            for j in range(max(1,round(w/9))):
                n=max(1,round(w/9));ww=w/n;xx=x-w/2+(j+.5)*ww
                for krow in range(max(1,round(t/9))):
                    m=max(1,round(t/9));hh=t/m
                    panel(at,facades,xx,y+side*(b/2+.09),floor+krow*hh,ww,hh,0,3,2,2)
            for j in range(max(1,round(b/10))):
                n=max(1,round(b/10));bb=b/n
                for krow in range(max(1,round(t/9))):
                    m=max(1,round(t/9));hh=t/m
                    panel(at,facades,x+side*(w/2+.09),y-b/2+(j+.5)*bb,floor+krow*hh,bb,hh,math.pi/2,3,2,2)
        for side in (-1,1):
            surface(roofing,(at(x-w/2-1,y+side*(b/2+1),floor+t),at(x+w/2+1,y+side*(b/2+1),floor+t),
                             at(x+w/2-2.2,y,floor+t+b*.67),at(x-w/2+2.2,y,floor+t+b*.67)),w/6,b/8)
        art.box(at(x,y,floor+t-.75),(w+.9,b+.9,.83),h,stone)
    chateau_block(0,0,24,27,65)
    chateau_block(-35,1,46,21,29);chateau_block(35,1,46,21,33)
    chateau_block(32,23,25,26,26);chateau_block(-39,19,28,23,24)
    for x,y,high in ((-57,-9,31),(57,-8,34),(-14,-12,48),(14,-12,49),(-52,28,26),(46,32,31)):
        art.tube(at(x,y,baseline),4.7,4.7,high,brick,brick,14,stone)
        art.tube(at(x,y,baseline+high),5.5,.14,14,green,green,14,green)
    art.tube(at(0,0,baseline+81),.26,.15,6.5,iron,iron,8,iron)
    # A terraced masonry foundation ties the château to the rising street.
    for j in range(5):
        zz=baseline-j*7-4
        art.box(at(0,2,zz),(118+j*2.5,67+j*2.5,7.3),h,stone)
        surface(masonry,(at(-59-j*1.25,-32-j*1.25,zz),at(59+j*1.25,-32-j*1.25,zz),
                         at(59+j*1.25,-32-j*1.25,zz+7.3),at(-59-j*1.25,-32-j*1.25,zz+7.3)),25,2)
    # Both carriageways pass through the actual semicircular gate openings.
    for station,span in ((3420,5.45),(5580,5.05)):
        at,h,z=site_at(station,0);z=-.08
        for side in (-1,1):
            art.box(at(0,side*(span+3),z),(5.8,6.2,10.1),h,stone)
            for x in (-2.94,2.94):
                surface(masonry,(at(x,side*span,z),at(x,side*(span+6.15),z),at(x,side*(span+6.15),z+10.1),at(x,side*span,z+10.1)),1.8,3)
            for j in range(8):
                v=side*(span+7.1+j*4.3);art.box(at(0,v,z-1),(3.75,4.5,8.3),h,stone)
                art.box(at(0,v,z+7.3),(4.1,4.7,.4),h,green)
                for yy in (-1.2,1.2):art.box(at(0,v+yy,z+7.7),(3.8,.95,.94),h,stone)
        for j in range(26):
            a=j*math.pi/26;b=(j+1)*math.pi/26;ya=span*math.cos(a);yb=span*math.cos(b)
            za=3.8+span*math.sin(a);zb=3.8+span*math.sin(b)
            for x in (-2.96,2.96):
                picture(masonry,(at(x,ya,z+za),at(x,yb,z+zb),at(x,yb,z+10.15),at(x,ya,z+10.15)),((ya/3,za/3),(yb/3,zb/3),(yb/3,10.15/3),(ya/3,10.15/3)))
            surface(masonry,(at(-2.96,ya,z+za),at(2.96,ya,z+za),at(2.96,yb,z+zb),at(-2.96,yb,z+zb)),2,.18)
        art.box(at(0,0,z+10.15),(6.2,2*span+12.5,.59),h,stone)
        for y in range(-9,10,2):art.box(at(0,y,z+10.74),(5.91,1.08,.9),h,stone)
        art.tube(at(0,-span-4.8,z),2.62,2.62,12.8,stone,stone,14,stone)
        art.tube(at(0,-span-4.8,z+12.8),2.9,.12,4.3,green,green,14,green)
    # Follow the cliff edge with a plank walk and green-and-white Dufferin kiosks.
    side=1 if pos(4630,9)[0]>pos(4630)[0] else -1
    for d in range(4490,4890,3):
        a,e=5.3*side,16.9*side
        surface(deck,(pos(d,a,.21),pos(d+3,a,.21),pos(d+3,e,.21),pos(d,e,.21)),1.4,3.8)
        at,h=site(k,d,e)
        art.box(at(0,0,.20),(.085,.085,1.17),h,green)
        for zz in (.59,1.29):beam(art,pos(d,e,zz),pos(d+3,e,zz),.065,.075,green)
    for d in (4555,4660,4735,4824):
        at,h=site(k,d,11.8*side)
        for j in range(8):
            a=j*math.tau/8;b=(j+1)*math.tau/8;x=3.05*math.cos(a);y=3.05*math.sin(a)
            art.tube(at(x,y,.22),.12,.095,3.11,green,green,8,green)
            e=at(3.45*math.cos(a),3.45*math.sin(a),3.35);f=at(3.45*math.cos(b),3.45*math.sin(b),3.35)
            c=white if j%2 else green
            art.face((e,f,at(0,0,5.57)),(c,)*3)
        art.tube(at(0,0,5.48),.075,.065,2.8,iron,iron,8,iron)
    # Historic cannon silhouettes on the grassy wall walk.
    for d in range(5450,5580,21):
        at,h,z=site_at(d,8)
        art.box(at(0,0,z),(2.05,1.45,.60),h,wood)
        beam(art,at(0,-.75,z+.75),at(0,1.92,z+1.30),.39,.39,bronze)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.8,
       'land':{'mid':0x8D966F},'sky':[0xE3CFBA,0xE4DBCA,0xC3D9E0,0x93C0D6,0x73A6CA],
       'haze':0xCFD2C6,'light':[0xFFDEAB,2.38],'fill':[0xBAD0DA,0xA6997C],
       'sun_radius':7,'sun_altitude':.60,'sun_azimuth':-.92}
