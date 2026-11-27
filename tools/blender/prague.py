"""The Royal Way from Prašná brána across the Vltava to Hradčany."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

PROFILE=((0,194),(1300,197),(2400,193),(3640,194),(5120,199),(6120,195),(7990,192),(10000,189),(10600,194),(11080,195),(11540,189),(13400,194),(15100,205),(16480,224),(17500,253),(18600,247),(19700,263),(21000,271),(21525,272))
WATER=182


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    def height(d):
        for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
            if d<=b:return z+(y-z)*smooth(a,b,d)
        return PROFILE[-1][1]
    def heading(d):
        winding=.32*math.sin(d/147)+.19*math.sin(d/61)+.17*math.sin(d/415)
        return winding*(1-smooth(10120,10510,d)+smooth(11130,11560,d))
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,st,length,mean,.06


def width(d):return 3.68+1.35*smooth(10460,10580,d)*(1-smooth(11110,11280,d))


def road(r,st,length,col,bc):
    b=bc.Builder('PragueSetts','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        w=width(p['d']);l=width(r.s[i+1]['d'])
        for a,e,z,c,scale in ((-1.47,1.47,.054,0xD9CBB1,1.15),(-1,1,.079,0x948E89,2.33),(-1.04,-1,.088,0xB3AFA2,.83),(1,1.04,.088,0xB3AFA2,.83)):
            pts=((i,w*a),(i+1,l*a),(i+1,l*e),(i,w*e));b.quad(*[r.at(n,v,z) for n,v in pts]);b.colours.extend([lin(c)]*4);b.uvs.extend((r.s[n]['d']/scale,v/scale) for n,v in pts)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Royal Way terraces','terrain');b.colours=[];w=bc.Builder('VltavaWater','terrain');w.colours=[]
    def z(i,v):
        p=r.s[i];d=p['d']
        bank=1-smooth(10530,10568,d)+smooth(11118,11154,d)
        h=p['z']+(5+4*math.sin(d/331))*smooth(30,150,abs(v))
        if v>0 and d>18500:h-=34*smooth(32,160,v)*smooth(18500,20200,d)
        return WATER-2.5+(h-WATER+2.5)*bank-.18
    def pt(i,v):
        p=r.s[i];x,y,_=r.at(i,v);f=smooth(36,147,abs(v))
        return x+(p['x']-x)*f,y+(p['y']+v-y)*f,z(i,v)
    for i in range(0,len(r.s)-3,3):
        j=i+3
        for a,e,c in ((-730,-120,0x959977),(-120,-35,0xB3A38C),(-35,-6,0xBEB3A3),(-6,6,0xC5B9AC),(6,35,0xBCAD9C),(35,120,0xA49680),(120,730,0x919A79)):
            b.quad(*[pt(n,v) for n,v in ((i,a),(j,a),(j,e),(i,e))]);b.colours.extend([lin(c)]*4)
        if 10480<r.s[i]['d']<11210:
            for a,e in ((-2100,-150),(-150,150),(150,2100)):
                w.quad(*[(*pt(n,v)[:2],WATER) for n,v in ((i,a),(j,a),(j,e),(i,e))]);w.colours.extend([lin(0x698E91)]*4)
    b.build(col);w.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return z(i,v)
    return None,sample


def scenery(k):
    art=Painted(k);houses,arcades,stone,saints,visitors,orloj=[pictured(k,n) for n in ('BohemianHouses','SquareArcades','BohemianStone','BridgeSaints','PragueVisitors','OrlojFace')]
    slate,sand,cream,red,copper,bronze,glass=[lin(x) for x in (0x474B52,0x9E907C,0xDDCDAE,0xAF6650,0x6F9284,0x616958,0x63717A)]
    def panel(at,mesh,x,y,z,w,h,angle,j=0,n=1):
        u=j/n;dx=.5*w*math.cos(angle);dy=.5*w*math.sin(angle)
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),((u+.001,0),(u+1/n-.001,0),(u+1/n-.001,1),(u+.001,1)))
    belfry,tracery,chapel,roofs=[pictured(k,n) for n in ('GothicBelfry','GothicTracery','OldTownHall','HradcanyRoofs')]
    def masonry(pts,u,v):picture(stone,pts,((0,0),(u,0),(u,v),(0,v)))
    def spire(at,x,y,z,r,h,c,n=8):
        for j in range(n):
            a=j*math.tau/n;b=(j+1)*math.tau/n
            art.face((at(x+r*math.cos(a),y+r*math.sin(a),z),at(x+r*math.cos(b),y+r*math.sin(b),z),at(x,y,z+h)),(c,c,slate))
    def tower(d,v,span,top):
        at,h=site(k,d,v);half=span/2;gap=3.72;dep=5.05
        for side in (-1,1):
            art.box(at(0,side*(gap+half)*.5,-.27),(dep*2,half-gap,top*.47+.27),h,slate)
            masonry((at(-dep-.015,side*gap,-.2),at(-dep-.015,side*half,-.2),at(-dep-.015,side*half,top*.47),at(-dep-.015,side*gap,top*.47)),2,5)
        for j in range(20):
            a=j*math.pi/20;b=(j+1)*math.pi/20
            def arch(t,xx):return at(xx,gap*math.cos(t),3.4+5.34*math.sin(t))
            for xx in (-dep,dep):
                pts=(arch(a,xx),arch(b,xx),at(xx,gap*math.cos(b),top*.49),at(xx,gap*math.cos(a),top*.49));masonry(pts,.37,2.3)
            art.face((arch(a,-dep),arch(b,-dep),arch(b,dep),arch(a,dep)),(sand,slate,slate,sand))
        art.box(at(0,0,top*.47),(dep*2,span,top*.53),h,slate)
        masonry((at(-dep-.025,half,top*.47),at(-dep-.025,-half,top*.47),at(-dep-.025,-half,top),at(-dep-.025,half,top)),4,6)
        for y in (-3.0,0,3.0):
            art.box(at(-dep-.1,y,top*.64),(.19,1.37,3.62),h,glass)
            beam(art,at(-dep-.24,y-.79,top*.64+3.57),at(-dep-.24,y,top*.64+4.72),.18,.2,cream)
            beam(art,at(-dep-.24,y+.79,top*.64+3.57),at(-dep-.24,y,top*.64+4.72),.18,.2,cream)
        for z in (top*.53,top*.86,top):art.box(at(0,0,z),(dep*2+.58,span+.48,.39),h,sand)
        art.roof(at(0,0,top+.38),dep*2+.10,span+1.0,top*.44,h,slate)
        for x in (-dep,dep):
            for y in (-half,half):
                art.tube(at(x,y,top-.86),.73,.73,3.15,slate,sand,8,sand);spire(at,x,y,top+2.29,1.02,4.70,slate)
    def house(d,v,j,mesh):
        at,h=site(k,d,v);side=1 if v>0 else -1;length=10.35+j*.71;high=8.42+j*1.45
        art.box(at(0,side*4.4,-6),(length,8.8,high+6),h,cream)
        art.roof(at(0,side*4.4,high-.07),length+.26,8.94,2.46,h,red)
        panel(at,mesh,0,-side*.045,0,length,high,0,j,4)
    for d in range(-47,21640,13):
        square=3520<d<3900;townhall=6050<d<6250;overlook=d>20980
        if 10490<d<11205:continue
        for side in (-1,1):
            if (townhall and side>0) or (overlook and side>0):continue
            v=side*((28 if square else 6.18)+k.rng.uniform(.05,1.1));house(d,v,k.rng.randrange(4),arcades if square else houses)
        if d%3==0 and not overlook:
            side=k.rng.choice((-1,1));at,h=site(k,d,side*(width(d)+1.02))
            panel(at,visitors,0,0,.02,1.80,1.74,1.18,k.rng.randrange(4),4)
    tower(117,0,13.9,24.2);tower(10562,0,15.1,23.6);tower(11123,0,13.5,22.4)
    # Týn's twin towers: each has a high central needle and eight small pinnacles on two tiers.
    def church(d,v,cathedral=False):
        at,h=site(k,d,v);high=42 if cathedral else 30;tone=sand if cathedral else cream
        art.box(at(16,0,-2),(34,16,18),h,tone);art.roof(at(16,0,16),35,17,9.4,h,slate if cathedral else red)
        for side in (-1,1):
            y=side*8.4
            art.box(at(0,y,-2),(6.9,6.9,high+2),h,tone)
            for z in (high*.50,high*.78,high):
                art.box(at(0,y,z),(7.36,7.36,.53),h,sand)
            for yy in (-1.45,1.45):
                art.box(at(-3.49,y+yy,high-6.2),(.12,1.06,4.65),h,glass)
            spire(at,0,y,high+.36,4.48,15 if cathedral else 12.7,slate)
            for stage in (0,1):
                for j in range(4):
                    a=math.pi/4+j*math.pi/2;r=3.93 if stage==0 else 2.1;x=r*math.cos(a);off=r*math.sin(a)
                    spire(at,x,y+off,high+stage*5.1,1.23-stage*.35,5.95-stage*.82,slate)
        # Dress the belfry on all four faces; the rider approaches at an oblique angle.
        for y in (-8.4,8.4):
            for side in (-1,1):
                panel(at,belfry,side*3.52,y,.06,6.91,high-.18,math.pi/2)
                panel(at,belfry,0,y+side*3.52,.06,6.91,high-.18,0)
        for side in (-1,1):
            for j in range(4):panel(at,tracery,3.7+j*8.15,side*8.06,.25,8.25,15.57,0)
        panel(at,tracery,-1.04,0,.06,9.92,15.78,math.pi/2)
        if cathedral:
            art.box(at(21,10,-1),(7,7,49),h,tone);spire(at,21,10,48,4.6,13,copper)
            for x in range(4,33,4):
                for side in (-1,1):beam(art,at(x,side*12.8,1),at(x,side*8.2,15.4),.88,.72,sand)
    church(3715,29)
    at,h=site(k,3674,-12);art.tube(at(0,0,0),4.5,3.7,1.09,sand,sand,18,sand)
    art.box(at(0,0,1.09),(3.6,2.32,2.2),h,bronze);panel(at,saints,0,0,3.24,2.13,3.7,1.56,3,4)
    # Old Town Hall's two clock dials are mounted on the tower beside the lane.
    at,h=site(k,6146,9)
    art.box(at(1.5,2.3,-.60),(7.86,6.86,20.05),h,sand);art.roof(at(1.5,2.3,19.45),8.3,7.46,7.74,h,copper)
    for z in (7.9,13.64,19.54):art.box(at(1.5,2.3,z),(8.2,7.17,.36),h,cream)
    for side in (-1,1):
        panel(at,chapel,1.50+side*3.97,2.3,.025,6.84,19.26,math.pi/2)
        panel(at,chapel,1.50,2.3+side*3.48,.025,7.86,19.27,0)
    panel(at,orloj,-2.53,2.0,1.0,4.42,7.63,-math.pi/2)
    art.box(at(1.34,-1.25,9.0),(2.63,.22,3.87),h,glass)
    for n in (-1,0,1):art.box(at(1.34+n*.78,-1.37,9.03),(.13,.14,3.85),h,cream)
    # The tower adjoins a working town square. Its frontage steps back at the clock.
    for d in range(6058,6251,12):
        house(d,18.3 if 6128<d<6174 else 13.6,(d//12)%4,arcades)
    for d in range(6105,6181,4):
        at,h=site(k,d,5.65+1.3*math.sin(d*.24));panel(at,visitors,0,0,.04,1.91,1.72,1.34,(d//4)%4,4)
    # Continue the fan paving across Old Town Square, including the clock forecourt.
    paving=pictured(k,'PragueSetts')
    for station,plaza_width,depth in ((3670,78,130),(6145,45,103)):
        at,h=site(k,station)
        picture(paving,(at(-depth/2,-plaza_width/2,-.015),at(depth/2,-plaza_width/2,-.015),at(depth/2,plaza_width/2,-.015),at(-depth/2,plaza_width/2,-.015)),((0,0),(depth/2.25,0),(depth/2.25,plaza_width/2.25),(0,plaza_width/2.25)))
    # Each 30 m span leaves open water below its arch. The parapets and statues follow the deck grade.
    for d in range(10566,11106,30):
        at,h=site(k,d);base=WATER-k.road.pos(d)[2]
        for side in (-1,1):
            v=side*6.14
            for j in range(18):
                a=j*math.pi/18;b=(j+1)*math.pi/18
                def arch(t,vv):return at(15-13.47*math.cos(t),vv,base+.5+8.14*math.sin(t))
                masonry((arch(a,v),arch(b,v),at(15-13.47*math.cos(b),v,-.27),at(15-13.47*math.cos(a),v,-.27)),.56,1.28)
                if side==1:art.face((arch(a,-v),arch(b,-v),arch(b,v),arch(a,v)),(sand,)*4)
            masonry((at(0,v,-.33),at(30,v,-.33),at(30,v,1.02),at(0,v,1.02)),9.4,.77)
            art.box(at(15,v,.96),(30,.67,.18),h,sand)
            art.box(at(0,v,0),(1.54,1.38,1.77),h,sand);art.box(at(0,v,1.77),(1.74,1.60,.27),h,cream)
            panel(at,saints,0,v,2.04,1.96,3.09,1.45,(d//30+side)%4,4)
            panel(at,visitors,8,v-side*.91,.02,2.14,1.78,1.17,k.rng.randrange(4),4)
        art.box(at(0,0,base-1.0),(3.18,13.1,-base+.67),h,sand)
    # River quays, weir, red-roofed buildings visible across the water.
    for d in (10528,11149):
        for v in range(-370,371,20):
            if abs(v)<17:continue
            at,h=site(k,d,v);art.box(at(0,0,-10),(7.3,20.3,10),h,sand)
            at,h=site(k,d,v);art.box(at(-10,0,-2),(12.3,18,10.7),h,cream);art.roof(at(-10,0,8.70),13.3,18.3,4.1,h,red)
    at,h=site(k,10810,137);base=WATER-k.road.pos(10810)[2]
    art.box(at(0,0,base-.16),(450,1.3,.36),h,cream)
    for d in range(15820,17370,39):
        side=1 if d%2 else -1;at,h=site(k,d,side*5.64)
        beam(art,at(0,.43*side,3.33),at(0,-.62*side,3.33),.06,.06,bronze)
        art.tube(at(0,-.38*side,2.47),.34,.34,.58,bronze,copper,8,copper)
    church(21260,57,True)
    at,h=site(k,21262,53);art.box(at(22,38,-17),(120,14,26),h,cream);art.roof(at(22,38,9),121,15,4.2,h,red)
    for j in range(45):
        at,h=site(k,20900+j*14,98+12*(j%5));base=k.height_at(*at(0,0)[:2])-at(0,0)[2]
        art.box(at(0,0,base-2),(12,13,8),h,cream);art.roof(at(0,0,base+6),13,14,4.3,h,red)
    at,h=site(k,21223,99)
    art.tube(at(0,0,-11),8.2,8.2,11,cream,cream,18,cream)
    for j in range(16):
        a=j*math.tau/16;b=(j+1)*math.tau/16
        for i in range(7):
            def dome(t,k):
                angle=math.pi*k/14
                return at(8.65*math.cos(angle)*math.cos(t),8.65*math.cos(angle)*math.sin(t),10.3*math.sin(angle))
            art.face((dome(a,i),dome(b,i),dome(b,i+1),dome(a,i+1)),(copper,)*4)
    # The view continues past the palace into red roofs, domes and distant riverbanks.
    ax,ay,az=k.road.pos(21180);tx,ty,_=k.road.pos(21258,55);dx=tx-ax;dy=ty-ay;l=math.hypot(dx,dy);dx/=l;dy/=l
    for j in range(34):
        u=j/34;v=(j+1)/34
        def skyline(t,q):
            side=(t-.5)*1050;return (ax+dx*490-dy*side,ay+dy*490+dx*side,az-90+q*151)
        picture(roofs,(skyline(u,0),skyline(v,0),skyline(v,1),skyline(u,1)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.68,'land':{'mid':0xB3A48C},'sky':[0xE5E7DF,0xD2E0E5,0xB1CEE1,0x8BB4D3,0x7099C2],'haze':0xCED1C6,'light':[0xFFEDD1,2.18],'fill':[0xD3DFE7,0xA99F8A],'sun_radius':7,'sun_altitude':.68,'sun_azimuth':-.87}
