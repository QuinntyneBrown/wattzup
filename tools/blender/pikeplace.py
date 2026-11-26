"""Pike Place at dawn, from the steel public-market clock to the Elliott Bay piers."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))
PROFILE=((0,31),(620,36),(1680,27),(2400,39),(3390,33),(4540,45),(5200,38),(6430,44),(7690,21),(8170,11),(9720,38),(10438,31))


def route(c,t,bc):
    st=bc.stages(c['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    def height(d):
        d=max(0,min(length,d))
        for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
            if d<=b:
                w=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in st)
                return z+(y-z)*smooth(a,b,d)+1.03*math.sin(d/129)+.00047*w
        return 31
    def head(d):return .14*math.sin(d/165)+.11*math.cos(d/318)-.21*smooth(7270,7540,d)+.18*smooth(8170,8390,d)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=head(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=head(d+.5)-head(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(head(d+bc.STEP*.5));y+=bc.STEP*math.sin(head(d+bc.STEP*.5))
    return rows,st,length,mean,.08


def road(r,st,length,col,bc):
    b=bc.Builder('MarketBrick','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for l,e,z,c in ((-6.31,6.31,.014,0xB8ADA1),(-4.98,4.98,.063,0xBC9688),(-5.03,-4.82,.118,0xCBBEAB),(4.82,5.03,.118,0xCBBEAB)):
            q=((i,l),(i+1,l),(i+1,e),(i,e));pts=[r.at(n,v,z) for n,v in q];b.quad(*pts);b.colours.extend([lin(c)]*4);b.uvs.extend((r.s[n]['d']/3.18,v/2.1) for n,v in q)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Market terraces','terrain');b.colours=[]
    w=bc.Builder('ElliottWater','terrain');w.colours=[]
    def pt(i,v):
        p=r.s[i];x,y,z=r.at(i,v);f=smooth(16,110,abs(v));x+=(p['x']-x)*f;y+=(p['y']+v-y)*f
        if v>0:z+=(1.18-z)*smooth(14,112,v)
        else:z+=(8+6*math.sin(p['d']/330))*smooth(17,132,-v)
        return x,y,z-.16
    for i in range(0,len(r.s)-3,3):
        j=i+3
        for a,e,c in ((-250,-30,0x8C8982),(-30,18,0xAC9D8C),(18,55,0x9D9883),(55,108,0x979283),(108,117,0xA6A293)):
            pts=(pt(i,a),pt(j,a),pt(j,e),pt(i,e));b.quad(*pts);b.colours.extend([lin(c)]*4)
        for a,e,c in ((105,190,0x7299A5),(190,720,0x809BA6),(720,2850,0x8D9EA9)):
            pts=[(*pt(n,v)[:2],.13) for n,v in ((i,a),(j,a),(j,e),(i,e))];w.quad(*pts);w.colours.extend([lin(c)]*4)
    b.build(col);w.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];return pt(i,(y-p['y'])*math.cos(p['h'])-(x-p['x'])*math.sin(p['h']))[2]
    return None,sample


def scenery(k):
    art=Painted(k);fronts=pictured(k,'SeattleMarket');displays=pictured(k,'ArcadeCounters');shoppers=pictured(k,'MarketShoppers');signs=pictured(k,'MarketLettering');clock=pictured(k,'PublicMarketClock');bay=pictured(k,'OlympicRidge')
    green=lin(0x466852);cream=lin(0xD3C6AA);brick=lin(0xA07461);steel=lin(0x59605B);red=lin(0xAD5347)
    def cross(d,v,w,h,z,mesh=signs,j=0,count=4):
        at,_=site(k,d,v);u=j/count
        picture(mesh,(at(0,w/2,z),at(0,-w/2,z),at(0,-w/2,z+h),at(0,w/2,z+h)),((u+.001,0),(u+1/count-.001,0),(u+1/count-.001,1),(u+.001,1)))
    def person(at,x,v,z,j,ang):
        u=j/6;dx=.48*math.cos(ang);dy=.48*math.sin(ang)
        picture(shoppers,(at(x-dx,v-dy,z),at(x+dx,v+dy,z),at(x+dx,v+dy,z+1.76),at(x-dx,v-dy,z+1.76)),((u+.001,0),(u+1/6-.001,0),(u+1/6-.001,1),(u+.001,1)))
    for d in range(-44,10520,22):
        for side in (-1,1):
            if (d>6920 and side>0) or (5080<d<5360 and side<0) or (d+33)%264<23:continue
            at,h=site(k,d,side*8.6);j=k.rng.randrange(4);high=7.65+1.03*j
            art.box(at(0,side*4.86,0),(21.8,9.68,high),h,cream if j%3 else brick)
            u=j*.25
            picture(fronts,(at(-10.94,0,.02),at(10.94,0,.02),at(10.94,0,high),at(-10.94,0,high)),((u+.002,0),(u+.248,0),(u+.248,1),(u+.002,1)))
            art.box(at(0,side*4.04,high-.10),(22.18,10.03,.38),h,green)
            for x in (-8.5,-3.2,2.4,8.3):art.box(at(x,-side*1.7,.07),(.15,.17,3.1),h,green)
            for j in range(11):
                x=-10+j*1.98;pts=(at(x,0,3.82),at(x+2.02,0,3.82),at(x+2.02,-side*2.2,3.13),at(x,-side*2.2,3.13));art.face(pts,((green if j%2 else cream),)*4)
            for j in range(3):person(at,-8.5+j*6.2,-side*k.rng.uniform(1.63,3.0),.08,k.rng.randrange(6),.64+j*.48)
    # Both the open steel grid and its legible neon artwork clear the rider's lane.
    at,h=site(k,128)
    for side in (-1,1):
        art.box(at(0,side*6.95,0),(.28,.28,10.94),h,steel)
        art.box(at(1.5,side*6.95,0),(.18,.18,10.64),h,steel)
        beam(art,at(0,side*6.95,5.4),at(1.5,side*6.95,10.4),.12,.12,steel)
    for z in (5.39,7.28,9.26,10.64):beam(art,at(.2,-6.95,z),at(.2,6.95,z),.092,.092,steel)
    cross(127.6,0,13.64,5.32,5.31,clock,0,1)
    for d in (104,141,1774,3372,5220,7560):
        at,h=site(k,d)
        for j in range(7):art.box(at(0,(j-3)*1.28,.073),(2.2,.73,.015),h,lin(0xDBD3BE))
    def stall(d,v,index):
        at,h=site(k,d,v);side=1 if v>0 else -1
        art.box(at(1.9,side*2.8,.02),(14.6,6.13,3.95),h,green)
        art.box(at(1.1,side*.23,.15),(13.91,1.73,.96),h,lin(0x928371))
        u=index*.5
        pts=(at(-5.1,-side*.72,.82),at(8.8,-side*.72,.82),at(8.8,-side*.72,3.19),at(-5.1,-side*.72,3.19))
        picture(displays,pts,((u+.001,0),(u+.499,0),(u+.499,1),(u+.001,1)))
        lid=(at(-5.4,-side*.64,1.03),at(9,-side*.64,1.03),at(9,side*1.13,1.42),at(-5.4,side*1.13,1.42))
        picture(displays,lid,((u+.01,.04),(u+.49,.04),(u+.49,.57),(u+.01,.57)))
        art.box(at(.65,-side*.68,3.79),(15.4,2.85,.27),h,green)
        for j in (-3.9,.4,5.0):
            beam(art,at(j,-side*.64,3.79),at(j,-side*.64,3.19),.044,.044,steel);art.box(at(j,-side*.64,3.12),(.68,.58,.16),h,lin(0xF8DA91))
    for d,side,j in ((1815,1,0),(1831,1,0),(1847,1,0),(3398,-1,1),(3414,-1,1),(3430,-1,1),(3600,1,1)):stall(d,6.62*side,j)
    for d,j,v in ((1810,1,6.63),(3396,0,-6.92),(3428,0,-6.94),(5248,2,-9.6),(10160,3,8.45)):cross(d,v,5.7,1.46,3.72,signs,j,4)
    # A real opening between parallel brick walls forms the alley, with the hanging sign above it.
    at,h=site(k,5253,-6.99)
    for side in (-1,1):
        art.box(at(side*3.66,-12.7,0),(2.3,25.1,8.9),h,brick)
        for n in range(5):art.box(at(side*2.42,-2.8-4.7*n,3.8),(.15,1.74,2.12),h,lin(0x576169))
    beam(art,at(-2.65,-.9,4.8),at(2.65,-.9,4.8),.12,.11,steel)
    picture(signs,(at(-2.5,-.74,3.58),at(2.5,-.74,3.58),at(2.5,-.74,4.89),at(-2.5,-.74,4.89)),((.502,0),(.748,0),(.748,1),(.502,1)))
    # Piers follow the low waterfront while their sheds stay below the market terraces.
    for d in range(7180,10360,360):
        at,h=site(k,d,118);base=1.35-k.road.pos(d)[2]
        art.box(at(0,20,base),(18,68,.67),h,lin(0x907A65));art.box(at(0,12,base+.62),(13.2,42,4.9),h,lin(0xA3A399));art.roof(at(0,12,base+5.52),14.0,43.2,2.0,h,lin(0x777D7F))
    # Glass towers have differentiated crowns; the Space Needle stands clear above the shore.
    for j in range(19):
        d=9840+j*37;v=-182-23*(j%5);at,h=site(k,d,v);base=3.1;high=18+8*((j*13)%9);w=11+j%5
        art.box(at(0,0,base),(w,10+j%7,high),h,lin((0x7F98A2,0x899FA8,0x788A96)[j%3]))
        for level in range(2,int(high),6):art.box(at(0,0,base+level),(w+.25,10.28+j%7,.3),h,lin(0xA9B4B5))
        if j%3==0:art.box(at(0,0,base+high),(w*.7,7,3.75),h,steel)
    at,h=site(k,10220,114);base=2-k.road.pos(10220)[2]
    for j in range(3):
        a=j*math.tau/3;beam(art,at(4.2*math.cos(a),4.2*math.sin(a),base),at(0,0,base+41),.71,.61,steel)
    for j in range(28):
        a=j*math.tau/28;b=(j+1)*math.tau/28
        def ring(t,r,z):return at(r*math.cos(t),r*math.sin(t),base+z)
        for r,s,z,y,c in ((1.42,7.9,40,42.8,0xCDD3C9),(7.9,6.3,42.8,45.1,0x879CA2),(6.3,1.20,45.1,46.3,0xCFCEC1)):
            art.face((ring(a,r,z),ring(b,r,z),ring(b,s,y),ring(a,s,y)),(lin(c),)*4)
    beam(art,at(0,0,base+46),at(0,0,base+52),.19,.18,steel)
    for d,v,w in ((7850,620,1780),(10140,760,1920)):
        at,h=site(k,d,v);base=-k.road.pos(d)[2]-.5
        def pt(u,q):return at((u-.5)*w,48*math.cos(u*math.tau)+26*q,base+125*q)
        for j in range(36):
            a=j/36;b=(j+1)/36;picture(bay,(pt(a,0),pt(b,0),pt(b,1),pt(a,1)),((a,0),(b,0),(b,1),(a,1)))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.9,'land':{'mid':0x9DA298},'sky':[0xF6D6AC,0xE2C4AC,0xC4CAD0,0xA0BACE,0x87ACC7],'haze':0xCEC3B6,'light':[0xFFE1B9,2.15],'fill':[0xD0DFEB,0xB2A18F],'sun_radius':8,'sun_altitude':.31,'sun_azimuth':-.84}
