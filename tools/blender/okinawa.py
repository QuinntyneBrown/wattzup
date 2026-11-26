"""Okinawa's coral village, Kouri crossing and open limestone arch at Manzamo."""
import math
from bondi import beam
from iten_landmarks import picture,pictured, site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))
BRIDGE=(4975,6935)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def mask(d):return smooth(BRIDGE[0]-250,BRIDGE[0],d)*(1-smooth(BRIDGE[1],BRIDGE[1]+250,d))
    def height(d):
        d=max(0,min(d,length));progress=d/length
        effort=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        shore=9+3.8*math.sin(d/552)+1.55*math.sin(d/182)+effort*.00035+5*progress
        k=mask(d);return shore*(1-k)+(7.8+3.15*math.sin(math.pi*max(0,min(1,(d-BRIDGE[0])/(BRIDGE[1]-BRIDGE[0])))))*k
    def heading(d):return math.radians(20)*math.sin(d/120)*math.cos(d/720)*(1-mask(d))
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('OkinawaAsphalt','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        bridge=BRIDGE[0]<=p['d']<=BRIDGE[1]
        for a,e,z,c in ((-4.65,4.65,.006,0xA3A29A if bridge else 0xBCB69E),(-3.85,3.85,.03,0x676A69),(-.087,.087,.048,0xD49745),(-3.63,-3.53,.047,0xDFE1D4),(3.53,3.63,.047,0xDFE1D4)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def coast(d):return 29+7*math.sin(d/143)+4*math.sin(d/317)+17*math.exp(-((d-11855)/170)**2)


def land(r,col,theme,bc):
    land=bc.Builder('Yanbaru hills and sand','terrain');land.colours=[]
    lagoon=bc.Builder('OkinawaLagoon','terrain');lagoon.colours=[];lagoon.uvs=[]
    def xy(i,off):
        p=r.s[i];x,y,z=r.at(i,off);k=smooth(12,85,abs(off));return x+(p['x']-x)*k,y+(p['y']+off-y)*k,z
    def ground(i,off):
        d=r.s[i]['d'];x,y,z=xy(i,off)
        if off>4.8:z+=(.13-z)*smooth(5,coast(d),off)
        if off<-6:z+=smooth(15,260,-off)*(85+31*math.sin(d/215)+18*math.cos(d/573))
        return x,y,z-.15
    def sea(i,off):
        x,y,_=xy(i,off);return x,y,.04
    for i in range(0,len(r.s)-3,3):
        j=i+3;d=r.s[i]['d'];bridge=BRIDGE[0]<=d<BRIDGE[1];a=coast(d);b=coast(r.s[j]['d'])
        if not bridge:
            for l,e,c in ((-600,-260,0x668659),(-260,-80,0x507854),(-80,-15,0x6B905C),(-15,-4.6,0x8F9F70),(-4.6,4.6,0xB3AB8C),(4.6,9,0xAAA577),(9,16,0xD5C7A4),(16,None,0xE9DEC2)):
                pts=(ground(i,l),ground(j,l),ground(j,b if e is None else e),ground(i,a if e is None else e));land.quad(*pts)
                for x,y,z in pts:
                    v=int(6*math.sin(x*.038+y*.046));land.colours.append(lin(c+v*0x010101))
        for side in ((1,-1) if bridge else (1,)):
            start=0 if bridge else a;end=0 if bridge else b
            for lo,hi,c in ((0,9,0xBFEADF),(9,24,0xA9DECE),(24,85,0x71C7B9),(85,230,0x459FAA),(230,1000,0x367D9C)):
                pts=(sea(i,side*(start+lo)),sea(j,side*(end+lo)),sea(j,side*(end+hi)),sea(i,side*(start+hi)))
                if side<0:pts=pts[::-1]
                lagoon.quad(*pts);lagoon.colours.extend([lin(c)]*4);lagoon.uvs.extend([(x/45,y/45) for x,y,_ in pts])
    land.build(col);lagoon.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.18
    return None,sample


def scenery(k):
    art=Painted(k);plants=pictured(k,'RyukyuPlants');walls=pictured(k,'CoralBlocks');houses=pictured(k,'RyukyuHouses');shisa=pictured(k,'ShisaGuardians');signs=pictured(k,'OkinawaSigns');clouds=pictured(k,'KouriCumulus')
    concrete=lin(0xABAEA4);stone=lin(0xA69D88);steel=lin(0xABB9B4);roof=lin(0xA5523A);green=lin(0x7D9954)
    for d in range(-64,17020,17):
        if BRIDGE[0]<=d<=BRIDGE[1]:continue
        for side in (-1,1):
            if side==1 and any(abs(d-n)<110 for n in (8950,11852,16215)):continue
            a,h=site(k,d,side*k.rng.uniform(6.1,14.2));n=k.rng.randrange(3);u=n/3;high=(k.rng.uniform(7,12) if n==0 else k.rng.uniform(1.7,5))
            for angle in (.28,1.79):
                dx=high*.40*math.cos(angle);dy=high*.40*math.sin(angle)
                picture(plants,(a(-dx,-dy,-.27),a(dx,dy,-.27),a(dx,dy,high),a(-dx,-dy,high)),((u+.001,0),(u+.332,0),(u+.332,1),(u+.001,1)))
        if d%51==-64%51 and not (11720<d<12030):
            a,h=site(k,d,4.52);e,_=site(k,d+16,4.52);art.box(a(0,0,-.13),(.34,.37,1.05),h,concrete)
            beam(art,a(0,0,.66),e(0,0,.66),.16,.21,concrete)
    for d in range(BRIDGE[0],BRIDGE[1],8):
        for side in (-1,1):
            a,h=site(k,d,side*4.49);e,_=site(k,d+8,side*4.49)
            beam(art,a(0,0,-1.36),e(0,0,-1.36),.46,1.48,concrete)
            for n in range(4):
                p,ph=site(k,d+n*2,side*4.49);art.box(p(0,0,.01),(.12,.14,1.11),ph,steel)
            for z in (.38,.73,1.11):beam(art,a(0,0,z),e(0,0,z),.09,.09,steel)
        if (d-BRIDGE[0])%40==0:
            a,h=site(k,d);z=k.road.pos(d)[2]
            art.box(a(0,0,-z-.6),(2.26,3.12,z-1.22),h,concrete);art.box(a(0,0,-1.84),(3.32,8.9,.71),h,concrete)
    for n,d in enumerate((35,114,187,1290,2727,2790,2820,2860,2930,7500,10120,14030)):
        a,h=site(k,d,-12);art.box(a(0,0,-.21),(9.2,6.3,3.5),h,lin(0xB4A78D));art.roof(a(0,0,3.29),9.74,6.88,2.02,h,roof)
        picture(houses,(a(-4.58,3.17,-.04),a(4.58,3.17,-.04),a(4.58,3.17,3.34),a(-4.58,3.17,3.34)),UV)
        for s in (-1,1):
            art.box(a(s*4.2,5.0,-.11),(3.9,.59,1.22),h,stone)
            picture(walls,(a(s*4.2-1.95,5.31,-.07),a(s*4.2+1.95,5.31,-.07),a(s*4.2+1.95,5.31,1.13),a(s*4.2-1.95,5.31,1.13)),UV)
            art.box(a(s*2,5,.02),(.9,.88,1.61),h,stone)
            picture(shisa,(a(s*2-.54,5.14,1.62),a(s*2+.54,5.14,1.62),a(s*2+.54,5.14,2.67),a(s*2-.54,5.14,2.67)),UV)
    for n,d in enumerate((111,2791,5499,8943,11856,16233)):
        a,h=site(k,d,-5.11);art.box(a(0,0,-.06),(.11,.11,2.85),h,steel)
        u=n%2*.5;v=(1-n//2%2)*.5
        picture(signs,(a(-.10,.69,1.77),a(-.10,-.69,1.77),a(-.10,-.69,2.94),a(-.10,.69,2.94)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for n,d in enumerate((8934,8957,8995,11796,12041)):
        a,h=site(k,d,coast(d)+8+n%2*4);z=-k.road.pos(d)[2];r=3.2+n%3*.9
        art.tube(a(0,0,z),r*.54,r*.43,2.25,lin(0x786F5E),lin(0xA09179),9)
        art.tube(a(0,0,z+2.25),r*.43,r,1.35,lin(0x9D8C72),lin(0xB2A48F),9)
        art.tube(a(0,0,z+3.6),r,r*.70,1.45,lin(0xA49781),lin(0x9C9778),9,green)
    for j in range(7):
        a,h=site(k,11845+j*6,coast(11845+j*6)-4);z=.56-k.road.pos(11845+j*6)[2]
        art.tube(a(0,0,z),.046,.046,1.91,stone,stone,8)
        art.tube(a(0,0,z+1.83),1.48,.06,.71,lin(0x6299AC if j%2 else 0xDDC596),lin(0xC2C8B0),10)
    # Build both walls of the arch around a clear gap; the trunk touches the sea.
    a,h=site(k,16245,coast(16245)+16);base=-k.road.pos(16245)[2]
    outline=[(-19,0),(-18,14),(-10,15.5),(-2,15.0),(6.0,13.4),(9.3,10.8),(10.0,5.1),(9.2,0),(7.25,0),(7.03,5.7),(5.1,8.6),(1,9.1),(-2,7.3),(-3.9,0)]
    for i,(u,z) in enumerate(outline):
        u2,z2=outline[(i+1)%len(outline)]
        pts=(a(u,-2.9,base+z),a(u2,-2.9,base+z2),a(u2,2.9,base+z2),a(u,2.9,base+z))
        c=green if i in (1,2,3) else lin(0xA49881);art.face(pts,(c,)*4);art.face(pts[::-1],(c,)*4)
    for side in (-1,1):
        pts=[a(u,side*2.9,base+z) for u,z in outline];art.face(pts if side>0 else pts[::-1],(stone,)*len(pts))
    for d in (190,2900,5710,9090,12010,16340):
        for side in (-1,1):
            a,h=site(k,d+380,side*420)
            picture(clouds,(a(-340,side*105,38),a(340,-side*105,38),a(340,-side*105,146),a(-340,side*105,146)),UV)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.85,'land':{'mid':0x849E6C},'sky':[0xE7F1E7,0xDCEEEB,0xB5DFEB,0x94D1E7,0x78C4E2],'haze':0xC6DFDB,'light':[0xFFF3D4,2.15],'fill':[0xDEEBE4,0xB5C5A9],'sun_radius':10,'sun_altitude':.66,'sun_azimuth':.76}
