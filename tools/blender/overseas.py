"""Seven Mile Bridge, its parallel railway and the timber cottages on Pigeon Key."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import picture,pictured,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))
START,END=410,7780


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        deck=smooth(210,510,d)*(1-smooth(7700,7970,d))
        hump=smooth(3510,4440,d)*(1-smooth(4440,5310,d))
        return 2.3+4.65*deck+15.65*hump
    def heading(d):return .10*(1-smooth(70,610,d))-.053*smooth(6850,7660,d)+.042*smooth(7870,8250,d)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.04


def road(r,st,length,col,bc):
    b=bc.Builder('KeysPavement','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-5.96,5.96,.012,0xB3AFA1),(-5.54,5.54,.039,0x878884),(-.17,-.068,.060,0xD9B25D),(.068,.17,.060,0xD9B25D),(-3.73,-3.60,.061,0xE1E2D6),(3.60,3.73,.061,0xE1E2D6)):
            pts=(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.quad(*pts);b.colours.extend([lin(c)]*4)
        if START<p['d']<END and i%9==0:
            d=p['d'];pts=(r.pos(d,-5.55,.064),r.pos(d+.089,-5.55,.064),r.pos(d+.089,5.55,.064),r.pos(d,5.55,.064));b.quad(*pts);b.colours.extend([lin(0x646762)]*4)
    b.build(col)


def land(r,col,theme,bc):
    water=bc.Builder('KeysFlats','terrain');water.colours=[];water.uvs=[]
    sand=bc.Builder('Mangrove shore','terrain');sand.colours=[]
    def xy(i,v):
        p=r.s[i];x,y,z=r.at(i,v);k=smooth(10,130,abs(v));return x+(p['x']-x)*k,y+(p['y']+v-y)*k
    for i in range(0,len(r.s)-3,3):
        j=i+3;d=r.s[i]['d']
        for a,b in ((-3200,-540),(-540,-130),(-130,-45),(-45,0),(0,48),(48,190),(190,470),(470,3200)):
            points=tuple((*xy(row,v),.035) for row,v in ((i,a),(j,a),(j,b),(i,b)));water.quad(*points)
            for row,v in ((i,a),(j,a),(j,b),(i,b)):
                x,y=xy(row,v);channel=math.exp(-((r.s[row]['d']-4480)/249)**2)
                c=0x43879E if v<-450 else 0x5BB6BB if abs(v)>150 else 0xA8DDD0 if v>0 else 0x89CBC6
                if channel>.54 and abs(v)<540:c=0x569CA6
                water.colours.append(lin(c));water.uvs.append((x/95,y/77))
        if START-4<=d<=END:continue
        r0=29+13*math.sin(d/90);r1=29+13*math.sin(r.s[j]['d']/90)
        for a,b,c in ((-1.2,-.82,0xDCD4AD),(-.82,-.31,0x87916B),(-.31,.31,0xAAA78B),(.31,.82,0x87946C),(.82,1.2,0xDFD6BA)):
            pts=[]
            for row,t,w in ((i,a,r0),(j,a,r1),(j,b,r1),(i,b,r0)):
                x,y=xy(row,t*w);z=r.s[row]['z']-.20-(r.s[row]['z']-.29)*smooth(.71,1.2,abs(t));pts.append((x,y,z))
            sand.quad(*pts);sand.colours.extend([lin(c)]*4)
    water.build(col);sand.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.22
    return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'KeysMangroves');cottages=pictured(k,'PigeonCottages');signs=pictured(k,'KeysMarkers');clouds=pictured(k,'StraitsCumulus')
    concrete=lin(0xBBB9A9);edge=lin(0xD4D1BB);bottom=lin(0x89918A);weathered=lin(0xA49779);rail=lin(0x766F60);rust=lin(0x956B53);steel=lin(0x9BACA9);white=lin(0xEFE8CD)
    def line(start,end,offset,z,width,height,c):
        a,_=site(k,start,offset);b,_=site(k,end,offset);beam(art,a(0,0,z),b(0,0,z),width,height,c)
    def plant(at,variant,w,h,z,yaw):
        u=variant*.5
        for ang in (yaw,yaw+1.42):
            dx=w*.5*math.cos(ang);dy=w*.5*math.sin(ang)
            picture(trees,(at(-dx,-dy,z),at(dx,dy,z),at(dx,dy,z+h),at(-dx,-dy,z+h)),((u+.001,0),(u+.499,0),(u+.499,1),(u+.001,1)))
    for d in range(START,END,12):
        for side in (-1,1):
            a,h=site(k,d,side*5.83)
            for z,w,hi,c in ((-.93,.53,1.0,bottom),(.19,.49,.43,concrete),(.87,.38,.26,edge)):
                line(d,min(d+12,END),side*5.83,z,w,hi,c)
            for j in (0,4,8):art.box(a(j,0,.31),(.56,.35,.53),h,concrete)
        if (d-START)%36==0:
            a,h=site(k,d);z=k.road.pos(d)[2]
            for side in (-1,1):art.box(a(0,side*3.78,-z-.48),(1.5,1.56,z-1.02),h,concrete)
            art.box(a(0,0,-1.66),(2.0,11.7,.86),h,bottom)
    # Concrete railway arches alternate with the later steel spans. A complete bay is missing.
    old=35.5
    for d in range(START,END,24):
        if 6330<=d<6426:continue
        a,h=site(k,d,old);z=-k.road.pos(d)[2];top=z+5.85
        art.box(a(12,0,top),(24.03,5.2,.76),h,weathered)
        for side in (-1,1):
            beam(art,a(0,side*2.54,top+1.61),a(24,side*2.54,top+1.61),.15,.15,rail)
            for j in (0,4,8,12,16,20):art.box(a(j,side*2.54,top+.69),(.14,.16,1.00),h,rail)
        if d<3530:
            for j in range(12):
                def underside(x):return z+.45+4.55*math.sin(math.pi*x/24)**.62
                x=j*2;y=x+2;u=underside(x);v=underside(y)
                for side in (-1,1):
                    pts=(a(x,side*2.55,u),a(y,side*2.55,v),a(y,side*2.55,top),a(x,side*2.55,top))
                    art.face(pts if side<0 else pts[::-1],(weathered,weathered,concrete,concrete))
                pts=(a(x,-2.55,u),a(y,-2.55,v),a(y,2.55,v),a(x,2.55,u));art.face(pts[::-1],(bottom,)*4)
        else:
            for side in (-1,1):
                beam(art,a(0,side*2.5,top-1.48),a(24,side*2.5,top-1.48),.27,.36,rust)
                for j in range(0,24,4):beam(art,a(j,side*2.5,top-.03),a(j+2,side*2.5,top-1.46),.15,.17,rust);beam(art,a(j+2,side*2.5,top-1.46),a(j+4,side*2.5,top-.03),.15,.17,rust)
        art.box(a(0,0,z-.39),(2.2,5.8,5.85),h,weathered)
    def island(d,off,l,w):
        a,h=site(k,d,off);z=-k.road.pos(d)[2]
        for j in range(32):
            def rim(n,r,zz):
                angle=n*math.tau/32;vary=1+.058*math.sin(angle*5+.32)
                return a(l*r*math.cos(angle)*vary,w*r*math.sin(angle)*vary,z+zz)
            for outer,inner,lo,hi,c in ((1.12,.94,.04,.56,lin(0xDED5BA)),(.94,.71,.56,1.10,lin(0x93A77C)),(.71,0,1.10,1.24,lin(0x8B9E70))):
                pts=(rim(j,outer,lo),rim(j+1,outer,lo),rim(j+1,inner,hi),rim(j,inner,hi));art.face(pts,(c,)*4)
        return a,h,z
    a,h,z=island(2944,82,104,52)
    for j,(along,across) in enumerate(((-48,-12),(-29,9),(-6,-14),(14,4),(36,-9),(50,12))):
        ax=lambda u,v,zz:a(along+u,across+v,z+1.14+zz)
        art.box(ax(0,0,-.03),(11.8,6.63,3.31),h,lin(0xCAB480));art.roof(ax(0,0,3.2),12.26,7.02,2.14,h,lin(0xA9ADA4))
        u=(j%2)*.5;picture(cottages,(ax(-5.9,-3.36,.04),ax(5.9,-3.36,.04),ax(5.9,-3.36,3.78),ax(-5.9,-3.36,3.78)),((u,0),(u+.5,0),(u+.5,1),(u,1)))
        art.box(ax(0,-4.52,2.63),(12.1,2.48,.17),h,white)
        for p in (-5.4,-1.8,1.8,5.4):art.box(ax(p,-5.62,0),(.12,.12,2.68),h,white)
    for j in range(26):
        u=k.rng.uniform(-78,78);v=k.rng.uniform(12,30);base=lambda x,y,zz:a(u+x,v+y,z+1+zz)
        plant(base,0 if j%4==0 else 1,3+j%5,6+j%6 if j%4==0 else 3.3,0,k.rng.uniform(0,math.pi))
    for j in range(9):
        u=-63+5*j;zz=z+5.68-.10*j*5
        art.box(a(u,old-82+3+j*1.55,zz),(5.35,3.4,.35),h,weathered);art.box(a(u,old-82+3+j*1.55,z+.02),(.45,2.6,zz-z),h,concrete)
    art.box(a(-21,-48,z+1.05),(29,2.4,.26),h,weathered)
    for d,off,l,w in ((708,140,43,20),(2410,234,61,17),(6910,-218,73,26),(7550,124,41,22)):
        a,h,z=island(d,off,l,w)
        for j in range(18):
            u=k.rng.uniform(-l*.64,l*.64);v=k.rng.uniform(-w*.52,w*.52);plant(lambda x,y,zz:a(u+x,v+y,z+1+zz),1,5+j%3,3+j%2,0,.42+j*.7)
    for d in list(range(-65,START-3,11))+list(range(END+4,8440,11)):
        for side in (-1,1):
            a,h=site(k,d,side*k.rng.uniform(8.1,18.0));i=k.rng.randrange(4);plant(a,0 if i==0 else 1,5+i,9 if i==0 else 3.4+i*.48,-.41,.28+d*.1)
    for j,d in enumerate((113,1551,2904,4462,6351,8055)):
        a,h=site(k,d,-5.24);art.box(a(0,0,0),(.1,.11,2.95),h,steel);u=j%3/3;v=(1-j//3)*.5
        picture(signs,(a(-.10,1.01,1.55),a(-.10,-1.01,1.55),a(-.10,-1.01,2.99),a(-.10,1.01,2.99)),((u,v),(u+1/3,v),(u+1/3,v+.5),(u,v+.5)))
    for j,d in enumerate((460,2310,4190,6390,8040)):
        for side in (-1,1):
            a,h=site(k,d+460,side*(710+49*j));picture(clouds,(a(-280,110,56),a(280,-110,56),a(280,-110,213),a(-280,110,213)),UV)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':5.54,'land':{'mid':0x92A47D},'sky':[0xD6EBD9,0xC5E2E8,0x98CDE6,0x78BCE0,0x58ADD9],'haze':0xB9DADD,'light':[0xFFF1D2,2.27],'fill':[0xD9ECE6,0xB9CAB6],'sun_radius':10,'sun_altitude':.75,'sun_azimuth':.77}
