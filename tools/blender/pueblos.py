"""A compressed Andalusian itinerary from olive terraces to the bridge over El Tajo."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

PROFILE=((0,492),(1200,506),(2480,537),(3420,574),(4750,539),(6210,493),(7880,525),
         (9320,597),(10660,654),(11980,613),(13600,585),(15280,588),(15470,597),(15664,631),
         (15800,632),(17000,593),(18300,611),(19700,644),(20910,685),(21377,683))
BRIDGE=15710
LAKE=472


def height(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)
    return PROFILE[-1][1]


def heading(d):
    normal=.37*math.sin(d/190)+.22*math.sin(d/76)+.40*math.sin(d/513)
    approach=1.43*(1-smooth(15565,15665,d))
    return normal*(1-smooth(15225,15345,d)+smooth(15792,15920,d))+approach*smooth(15225,15345,d)


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,.05


def ground(d,v):
    outside=smooth(5,95,abs(v))
    z=height(d)+outside*(7.7*math.sin(d/257+v/97)+5.3*math.sin(v/61))
    zahara=smooth(2950,3380,d)*(1-smooth(3500,3900,d))
    z+=zahara*smooth(10,93,v)*51
    forest=smooth(9600,10300,d)*(1-smooth(11020,11600,d))
    z+=forest*smooth(21,248,abs(v))*(39+56*math.sin(v/210)**2)
    bay=smooth(5600,6020,d)*(1-smooth(6600,7040,d))*smooth(8,54,v)*(1-smooth(224,350,v))
    z+=(LAKE-5-z)*bay
    axis=d-BRIDGE+.53*v+5*math.sin(v/39)
    gorge=(1-smooth(27+4*math.sin(v/29),52+4*math.sin(v/41),abs(axis)))*smooth(14900,15150,d)*(1-smooth(16000,16260,d))
    # A second ravine meets the Tajo under the approach bend. A rider on its
    # stone rim can look across open air at the bridge piers before turning onto them.
    lookout=smooth(15350,15445,d)*(1-smooth(15513,15557,d))*smooth(4.1,12,-v)
    cut=max(gorge,lookout)
    return z-cut*(77+7*math.cos(v/41))-.13


def road(r,st,length,col,bc):
    asphalt=bc.Builder('SierraRoad','terrain');asphalt.colours=[]
    setts=bc.Builder('VillageSetts','terrain');setts.colours=[];setts.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        village=20680<p['d']<21220
        for u,v,z,c in ((-3.94,3.94,.033,0xB6A78D),(-3.43,3.43,.064,0x756F63 if village else 0x555759),(-3.33,-3.24,.073,0xDBD8CF),(3.24,3.33,.073,0xDBD8CF)):
            b=setts if village and abs(u+3.43)<.01 else asphalt
            pts=((i,u),(i+1,u),(i+1,v),(i,v))
            b.quad(*[r.at(n,w,z) for n,w in pts]);b.colours.extend([lin(c)]*4)
            if b is setts:b.uvs.extend((r.s[n]['d']/3.6,w/3.6) for n,w in pts)
    asphalt.build(col);setts.build(col)


def land(r,col,theme,bc):
    layers=[]
    for name in ('OliveEarth','TajoCliff','SierraCrag','ZaharaWater'):
        b=bc.Builder(name,'terrain');b.colours=[];b.uvs=[];layers.append(b)
    bx,by,_=r.pos(BRIDGE)
    vx,vy,_=r.pos(15470)
    span=(bx-vx)**2+(by-vy)**2
    def ravine(x,y,z,d,v):
        if not 14900<d<16250:return z
        t=max(0,min(1,((x-vx)*(bx-vx)+(y-vy)*(by-vy))/span))
        distance=math.hypot(x-vx-t*(bx-vx),y-vy-t*(by-vy))
        cut=smooth(.023,.14,t)*(1-smooth(25,84,distance))
        # Drop the surfaces in the sightline to the river; keep the approach road on its rim.
        rim=smooth(3.7,6.4,abs(v)) if abs(d-BRIDGE)>50 else 1
        return min(z,z+(548-z)*cut*rim)
    def pt(i,v):
        p=r.s[i];x,y,_=r.at(i,v);f=smooth(51,166,abs(v))
        x+=(p['x']-x)*f;y+=(p['y']+v-y)*f
        return (x,y,ravine(x,y,ground(p['d'],v),p['d'],v))
    widths=(-540,-255,-132,-78,-49,-28,-12,-4,4,12,28,49,78,132,205,310,540)
    i=0
    while i<len(r.s)-1:
        d=r.s[i]['d'];j=min(i+(1 if abs(d-BRIDGE)<420 else 4),len(r.s)-1)
        for u,v in zip(widths,widths[1:]):
            pts=[pt(n,w) for n,w in ((i,u),(j,u),(j,v),(i,v))]
            lateral=(u+v)*.5
            gorge=abs(d-BRIDGE+.53*lateral+5*math.sin(lateral/39))<70 and 14900<d<16260
            idx=1 if gorge or (15395<d<15550 and lateral<-4) else 2 if 9540<d<11480 and abs(lateral)>58 else 0
            b=layers[idx];b.quad(*pts);b.colours.extend([lin(0xFFFFFF)]*4)
            b.uvs.extend(((x+.23*y)/(11 if idx else 16),(z+.20*y)/(11 if idx else 16) if idx else y/16) for x,y,z in pts)
        if 5680<d<6930:
            w=layers[3]
            for u,v in ((27,76),(76,160),(160,270)):
                pts=[pt(n,t) for n,t in ((i,u),(j,u),(j,v),(i,v))]
                w.quad(*[(x,y,LAKE) for x,y,_ in pts]);w.colours.extend([lin(0x4A9C9C)]*4);w.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
        i=j
    for b in layers:b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return ground(p['d'],v)
    return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'IberianTrees');front=pictured(k,'PuebloFacades');ashlar=pictured(k,'RondaMasonry')
    pale,tile,iron,ochre,bronze=[lin(c) for c in (0xE7E0CD,0xA56549,0x383D3E,0xBDA177,0x79725D)]
    def place(d,v):
        at,h=site(k,d,v);return at,h,ground(d,v)-height(d)
    def panel(at,mesh,x,y,z,w,h,ang,i,n,m):
        dx=math.cos(ang)*w/2;dy=math.sin(ang)*w/2;u=i%n/n;v=1-(1+i//n)/m
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),
                ((u+.002,v+.002),(u+1/n-.002,v+.002),(u+1/n-.002,v+1/m-.002),(u+.002,v+1/m-.002)))
    def tree(d,v,i,high):
        at,h,z=place(d,v);w=high*(1.23 if i in (0,1,3) else .74)
        for a in (.47,2.03):panel(at,trees,0,0,z,w,high,a,i,3,2)
    # Plant parallel rows on the near terraces and carry the silvery grid up the slopes.
    for station in range(20,21300,28):
        if 3280<station<3650 or 5870<station<6900 or 10190<station<11060 or 15160<station<16010 or station>20400:continue
        side=1 if station%3 else -1
        for row in range(3):tree(station+row*2,side*(12+row*16),row%2,4.8+(station%7)*.22)
    for station in range(9,320,11):
        for side in (-1,1):
            for row in range(5):tree(station+row*2,side*(17+row*12),row%2,4.55+.18*(station%5))
    def house(d,v,w,b,t,i):
        at,h,z=place(d,v);art.box(at(0,0,z-.58),(w,b,t+.58),h,pale)
        for side in (-1,1):
            panel(at,front,0,side*(b/2+.04),z,w,t,0,i,2,2)
            panel(at,front,side*(w/2+.04),0,z,b,t,math.pi/2,i,2,2)
        art.roof(at(0,0,z+t),w+.31,b+.26,1.69,h,tile)
        art.box(at(w*.27,0,z+t+.75),(.62,.60,1.53),h,pale)
    def keep(d,v,t):
        at,h,z=place(d,v)
        art.box(at(0,0,z-.55),(11.3,9.2,t+.55),h,ochre)
        for side in (-1,1):
            panel(at,front,0,side*4.64,z,11.3,t,0,3,2,2)
            panel(at,front,side*5.69,0,z,9.2,t,math.pi/2,3,2,2)
            for x in range(-5,6,2):art.box(at(x,side*4.3,z+t),(1.02,.78,1.08),h,ochre)
            for y in range(-3,4,2):art.box(at(side*5.27,y,z+t),(.81,1.04,1.08),h,ochre)
        art.box(at(-5.74,0,z+t*.58),(.16,1.05,2.35),h,iron)
    for centre in (3458,10709,21028):
        for j in range(38):
            d=centre+(j%9-4)*10.1+3*(j//9)
            v=24+(j//9)*15+(j%2)*2
            if centre==3458:
                v+=24
                d+=45 if j%9>3 else -58
            if centre==10709:v+=31+(j//9)*6
            house(d,v,7.7+j%4,7.3+j%3,5.5+j%4,j%3)
        if centre!=10709:keep(centre+15,94,23 if centre==3458 else 17)
    # The white town sits below a castle on its own exposed limestone crag.
    at,h,z=place(3473,94)
    crag=pictured(k,'ZaharaRock')
    for i in range(20):
        a=i*math.tau/20;b=(i+1)*math.tau/20
        def rock(t,r,zz):return at(r*math.cos(t),r*.74*math.sin(t),z+zz)
        picture(crag,(rock(a,41,-35),rock(b,41,-35),rock(b,9,.2),rock(a,9,.2)),((i/3,0),((i+1)/3,0),((i+1)/3,3.25),(i/3,3.25)))
    # A pale limestone escarpment behind Grazalema, with tilted beds and distinct peaks.
    for j in range(36):
        d=10510+j*12
        for band in range(3):
            at,h,z=place(d,135+band*31)
            high=28+11*math.sin(j*.82)+7*math.sin(j*1.57)+band*18
            p=(at(-8,-12,z-5),at(8,-11,z-4),at(12,13,z+high-2),at(-5,17,z+high+4))
            picture(crag,p,((j/3,0),((j+1)/3,0),((j+1)/3,high/11),(j/3,high/11)))
    for d in range(9950,11080,15):
        for side in (-1,1):
            if 10560<d<10810 and side==1:continue
            tree(d,side*(19+d%45),2 if d%3==0 else 3,9+d%7)
    # Low, jointed parapet along the outside of winding mountain bends.
    for a,b,side in ((70,320,-1),(3350,3520,-1),(6110,6380,1),(10480,10800,-1),(BRIDGE-55,BRIDGE+58,-1)):
        last=None
        for d in range(a,b,4):
            pt=k.road.pos(d,side*4.08,.34)
            if last:beam(art,last,pt,.58,.72,ochre)
            if d%12==a%12:
                at,h,z=place(d,side*4.08);art.box(at(0,0,0),(.72,.7,.9),h,pale)
            last=pt
    # Puente Nuevo deck and its deep masonry spandrels. The upper gallery is supported by
    # two smaller arches; the central arch rises above a narrow river between tall piers.
    at,h=site(k,BRIDGE)
    # Extrude the silhouette of the original side elevation. The arch soffits,
    # recessed upper windows and battered piers then align on both elevations.
    import bpy
    from array import array
    from pathlib import Path
    elevation=pictured(k,'PuenteElevation')
    source=Path(__file__).resolve().parents[2]/'frontend/projects/ride/public/courses/pueblos-puente.webp'
    image=bpy.data.images.load(str(source),check_existing=False)
    w,hpx=image.size[:];pix=array('f',[0])*(w*hpx*4)
    image.pixels.foreach_get(pix)
    nx,ny=185,145
    def filled(i,j):
        if not(0<=i<nx and 0<=j<ny):return False
        return pix[(int((j+.5)*hpx/ny)*w+int((i+.5)*w/nx))*4+3]>.59
    def pt(i,j,v):return at((i/nx-.5)*99,v,-74+j/ny*78)
    for side in (-1,1):
        v=side*6.14
        picture(elevation,(pt(0,0,v),pt(nx,0,v),pt(nx,ny,v),pt(0,ny,v)),((0,0),(1,0),(1,1),(0,1)))
    for j in range(ny):
        for i in range(nx):
            if not filled(i,j):continue
            for di,dj,ia,ja,ib,jb in ((0,-1,i,j,i+1,j),(0,1,i,j+1,i+1,j+1),(-1,0,i,j,i,j+1),(1,0,i+1,j,i+1,j+1)):
                if filled(i+di,j+dj):continue
                pts=(pt(ia,ja,-6.1),pt(ib,jb,-6.1),pt(ib,jb,6.1),pt(ia,ja,6.1))
                picture(ashlar,pts,((0,j/10),(1/nx*14,j/10),(1/nx*14,j/10+1.6),(0,j/10+1.6)))
    bpy.data.images.remove(image)
    art.box(at(0,0,-.85),(98.6,11.95,.84),h,ochre)
    # Visible ledges and the Guadalévin below the light sandstone piers.
    river=pictured(k,'ZaharaWater') if 'ZaharaWater' not in k.B else k.B['ZaharaWater']
    for n in range(-132,131,4):
        drift=2.8*math.sin(n/17)
        a=at(drift-2.1,n,-79.1);b=at(drift+2.1,n,-79.1)
        c=at(drift+2.4,n+4,-79.1);e=at(drift-1.8,n+4,-79.1)
        picture(river,(a,b,c,e),((0,0),(1,0),(1,1),(0,1)))
        river.colours[-4:]=[lin(0x599394)]*4
    for j in range(22):
        d=BRIDGE+58+(j%9)*9+(j//9)*4;v=15+j//9*15
        house(d,v,7.8,7.4,6.2+j%4,j%3)
    # Pinch the reservoir shore into coves, with small islands of hillside scrub at water level.
    for d in range(5980,6530,14):
        tree(d,289+d%59,3,7.5+d%7)
    for j in range(7):
        d=6210+25*j;v=128+9*math.sin(j*.92);at,h=site(k,d,v);zz=LAKE-height(d)
        for n in range(18):
            a=n*math.tau/18;b=(n+1)*math.tau/18
            art.face((at(29*math.cos(a),12*math.sin(a),zz-.1),at(29*math.cos(b),12*math.sin(b),zz-.1),at(0,0,zz+2.5)),(lin(0x829154),lin(0x819057),lin(0x8C955C)))
        panel(at,trees,0,0,zz+2.3,7.3,6.7,1.24,j%2,3,2)
    for d in range(3340,3510,13):
        tree(d,-13-d%19,0,4.8)
    for j in range(9):
        d=3390+j*8;v=33+j%3*5
        house(d,v,7.1,6.35,5.03,j%3)
    for d in range(20700,21140,13):
        for side in (-1,1):
            if 20897<d<20980 and side>0:continue
            house(d,side*(9.3+d%3),10.4,6.5,6.2+d%4,d%3)
            if d%3:tree(d+4,side*5.6,4,2.2)
    at,h,z=place(20944,13.3)
    art.box(at(0,0,z),(7.6,7.3,14.6),h,pale)
    for x in (-2.8,2.8):
        for y in (-2.65,2.65):art.box(at(x,y,z+14.6),(1.54,1.41,5),h,ochre)
    art.box(at(0,0,z+19.6),(8.1,7.75,.71),h,pale)
    art.roof(at(0,0,z+20.3),8.02,7.63,3.5,h,tile)
    art.tube(at(0,0,z+23.7),.13,.1,1.32,iron,iron,8,iron)
    for j in range(4):
        last=None
        for x in range(-2200,23400,76):
            y=(1 if j%2 else -1)*(1000+550*(j//2))
            z=675+77*math.sin(x/590+j)+45*math.sin(x/248-j)+18*math.sin(x/87)+118*math.exp(-((x-10500)/1200)**2)
            pts=((x,y,466),(x,y,z));col=lin((0x918F83,0x8D9589,0xA7A69C,0xAFACA3)[j])
            if last:art.face((last[0],pts[0],pts[1],last[1]),(col,)*4)
            last=pts
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.43,
       'land':{'mid':0xB7A482},'sky':[0xF1E3CA,0xD8E2DF,0xACD1E4,0x79B6DB,0x589FD0],
       'haze':0xD0CBBD,'light':[0xFFF0C7,2.5],'fill':[0xB7D3E0,0xB8A989],
       'sun_radius':7,'sun_altitude':.98,'sun_azimuth':-.8}
