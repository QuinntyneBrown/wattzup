"""Highway 101 southbound past Cannon Beach, Newport and the Boardman sea arches."""
import math
from bondi import beam
from worldkit import Painted,lin,smooth
from iten_landmarks import picture,pictured,site

UV=((0,0),(1,0),(1,1),(0,1))
BRIDGE=(9740,10280)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def channel(d):return smooth(9600,9740,d)*(1-smooth(10280,10420,d))
    def height(d):
        d=max(0,min(d,length));work=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        z=20+5.3*math.sin(d/447)+3*math.sin(d/161)+.0019*work
        return z*(1-channel(d))+(25+3.2*math.sin(math.pi*(d-9740)/540))*channel(d)
    def heading(d):return .26*math.sin(d/143)*math.cos(d/1260)*(1-channel(d))
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.14


def road(r,st,length,col,bc):
    b=bc.Builder('BywayPavement','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-6.85,6.85,.007,0x777976),(-5.92,5.92,.029,0x525957),(-.19,-.07,.044,0xE3B659),(.07,.19,.044,0xE3B659),(-3.82,-3.69,.045,0xDEDFD6),(3.69,3.82,.045,0xDEDFD6)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def beach_width(d):
    return 74+18*math.cos(d/395)+71*math.exp(-((d-3250)/390)**2)


def land(r,col,theme,bc):
    coast=bc.Builder('Coastal bluffs','terrain');coast.colours=[]
    water=bc.Builder('PacificSurf','terrain');water.colours=[];water.uvs=[]
    def point(i,v):
        p=r.s[i];x,y,z=r.at(i,v);f=smooth(17,115,abs(v));return x+(p['x']-x)*f,y+(p['y']+v-y)*f,z
    def ground(i,v):
        x,y,z=point(i,v);d=r.s[i]['d']
        if v<0:z+=(.39-z)*smooth(7,32,-v);z-=.35*smooth(33,beach_width(d),-v)
        else:z+=(61+18*math.sin(d/241)+9*math.cos(d/102))*smooth(9,120,v)
        return x,y,z-.13
    for i in range(0,len(r.s)-3,3):
        j=i+3;d=r.s[i]['d'];bridge=9740<=d<10280
        if not bridge:
            for l,e,c in ((None,-32,0xAAA89C),(-32,-20,0x8B9080),(-20,-8,0x738061),(-8,7,0x8B8C74),(7,22,0x768367),(22,74,0x547056),(74,180,0x536A56),(180,640,0x606F62)):
                pts=(ground(i,-beach_width(d) if l is None else l),ground(j,-beach_width(r.s[j]['d']) if l is None else l),ground(j,e),ground(i,e));coast.quad(*pts)
                for x,y,_ in pts:coast.colours.append(lin(c+int(3*math.sin(x*.035+y*.08))*0x010101))
        for side in ((-1,1) if bridge else (-1,)):
            a=0 if bridge else beach_width(d);b=0 if bridge else beach_width(r.s[j]['d'])
            for near,far,c in ((0,19,0xDFE4DD),(19,45,0xADC3BE),(45,110,0x8EA9AA),(110,280,0x77949A),(280,1100,0x6D8C95)):
                pts=tuple((*point(row,side*offset)[:2],.035) for row,offset in ((i,a+near),(j,b+near),(j,b+far),(i,a+far)))
                if side<0:pts=pts[::-1]
                water.quad(*pts);water.colours.extend([lin(c)]*4);water.uvs.extend([(x/77,y/49) for x,y,z in pts])
    coast.build(col);water.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.16
    return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'SitkaSpruce');village=pictured(k,'ShingleTown');signs=pictured(k,'BywaySigns');basalt=pictured(k,'CoastBasalt')
    steel=lin(0x719184);metal=lin(0xA9A9A0);concrete=lin(0xABA89B);dark=lin(0x454943);white=lin(0xE1DED2);red=lin(0x935144)
    def textured_face(pts):
        uv=tuple(((p[0]+.53*p[1])/49,p[2]/59) for p in pts);picture(basalt,pts,uv)
    def stack(d,offset,rx,ry,high,seed):
        at,h=site(k,d,offset);base=-k.road.pos(d)[2];n=19
        def profile(j,scale,z):
            t=j*math.tau/n
            f=1+.09*math.sin(3*t+seed)+.075*math.cos(7*t+.27*seed)
            return at(rx*(scale*f*math.cos(t)+.16*z),ry*scale*f*math.sin(t),base+z*high*(1+.069*math.cos(t*3+seed)))
        tiers=((1,-.015),(.88,.21),(.70,.49),(.49,.76),(.22,.94),(.032,1.0))
        for j in range(n):
            for (aa,z),(bb,w) in zip(tiers,tiers[1:]):
                pts=(profile(j,aa,z),profile(j+1,aa,z),profile(j+1,bb,w),profile(j,bb,w))
                textured_face(pts)
            pts=(profile(j,.032,1),profile(j+1,.032,1),at(rx*.16,0,base+high*1.035));art.face(pts,(lin(0x727A62),)*3)
    stack(3276,-215,61,41,69,1)
    for j,(d,off,rx,ry,h) in enumerate(((3196,-178,8,7,16),(3356,-192,12,10,24),(3420,-240,16,12,14),(14418,-125,22,14,22),(18980,-158,20,16,30),(19050,-206,29,20,37))):stack(d,off,rx,ry,h,j+2)
    a,h=site(k,18927,-124);base=-k.road.pos(18927)[2]
    sections=[(-30,.0,18),(-21,0,23),(-12,.0,25),(-8,7,25),(0,13,23),(7,13.5,22),(14,9,19),(17,0,16),(24,0,11)]
    for (x,lo,hi),(xx,low,high) in zip(sections,sections[1:]):
        for side in (-1,1):
            pts=(a(x,side*6,base+lo),a(xx,side*6,base+low),a(xx,side*6,base+high),a(x,side*6,base+hi))
            textured_face(pts if side<0 else pts[::-1])
        for (l,r,c) in ((hi,high,0x71806A),(lo,low,0x645F57)):
            pts=(a(x,-6,base+l),a(xx,-6,base+r),a(xx,6,base+r),a(x,6,base+l));art.face(pts,(lin(c),)*4)
    for n,d in enumerate(range(-60,19605,9)):
        if 9720<d<10305:continue
        for side in (1,-1):
            if side<0 and (n%3 or any(abs(d-v)<150 for v in (3180,6830,14340,18860))):continue
            for lane in ([9.4,23] if side>0 else [9.3]):
                off=side*(lane+k.rng.uniform(0,4));a,h=site(k,d,off);tree=n%2;u=tree*.5;high=k.rng.uniform(10.2,22)
                for angle in (.26,1.51):
                    dx=.28*high*math.cos(angle);dy=.28*high*math.sin(angle)
                    picture(trees,(a(-dx,-dy,-.54),a(dx,dy,-.54),a(dx,dy,high),a(-dx,-dy,high)),((u+.001,0),(u+.499,0),(u+.499,1),(u+.001,1)))
        a,h=site(k,d,-6.15);e,_=site(k,d+9,-6.15)
        art.box(a(0,0,-.09),(.21,.2,.96),h,metal)
        beam(art,a(0,0,.7),e(0,0,.7),.12,.23,metal)
    for j,d in enumerate((105,145,221,6900,10325,11720,11759,11791,14380)):
        a,h=site(k,d,14);art.box(a(0,0,-.15),(14,7.46,4.0),h,lin(0x93978C));art.roof(a(0,0,3.85),14.4,7.75,2.4,h,dark)
        u=(j%2)*.5;picture(village,(a(-7,-3.76,.02),a(7,-3.76,.02),a(7,-3.76,4.1),a(-7,-3.76,4.1)),((u,0),(u+.5,0),(u+.5,1),(u,1)))
    for j,d in enumerate((111,3215,6861,9912,14371,18894)):
        a,h=site(k,d,-5.77);art.box(a(0,0,0),(.16,.14,3.18),h,concrete)
        u=(j%3)/3;v=(1-j//3)*.5
        picture(signs,(a(-.1,1.23,1.47),a(-.1,-1.23,1.47),a(-.1,-1.23,3.14),a(-.1,1.23,3.14)),((u,v),(u+1/3,v),(u+1/3,v+.5),(u,v+.5)))
    for j in range(34):
        d=3110+j*8.4;a,h=site(k,d,-(60+j%5*10));z=-k.road.pos(d)[2]+.57
        beam(art,a(-3,0,z),a(3+j%5,1.3+.57*(j%3),z+.15),.48,.48,lin(0xB9AB91))
    # A through arch over the central channel, concrete approaches at either end.
    for d in range(9740,10280,10):
        for side in (-1,1):
            a,h=site(k,d,side*6.22);e,_=site(k,d+10,side*6.22)
            beam(art,a(0,0,-1.95),e(0,0,-1.95),.56,2.0,steel)
            for z in (.49,1.04):beam(art,a(0,0,z),e(0,0,z),.11,.10,steel)
            for u in (0,2.5,5,7.5):art.box(a(u,0,0),(.11,.11,1.11),h,steel)
            if 9840<=d<10160:
                def rise(x):return 3.8+36.2*max(0,1-((x-10000)/160)**2)
                z,z2=rise(d),rise(d+10);beam(art,a(0,0,z),e(0,0,z2),.65,.96,steel)
                beam(art,a(0,0,z-2.4),e(0,0,z2-2.4),.49,.60,steel)
                beam(art,a(0,0,z),e(0,0,z2-2.4),.23,.25,steel)
                beam(art,a(0,0,.75),a(0,0,z-2.4),.14,.14,steel)
                if side==1 and d%20==0:beam(art,a(0,0,z),a(0,-12.44,z),.30,.24,steel)
            elif d%50==0:
                base=k.road.pos(d)[2];art.box(a(0,0,-base-.3),(2.2,2.5,base-1.12),h,concrete)
    for d,off,scale in ((6898,-69,1.36),(14404,-70,.93)):
        a,h=site(k,d,off);z=-k.road.pos(d)[2]
        bench=42 if d==14404 else 18
        # A sloping, wooded promontory under the station, from the surf to the lantern terrace.
        for t in range(22):
            def pt(n,r,top):
                angle=n*math.tau/22;return a(math.cos(angle)*54*r,math.sin(angle)*25*r,z+top)
            pts=(pt(t,1.35,-.1),pt(t+1,1.35,-.1),pt(t+1,.72,bench*.80),pt(t,.72,bench*.80));textured_face(pts)
            pts=(pt(t,.72,bench*.80),pt(t+1,.72,bench*.80),pt(t+1,.42,bench),pt(t,.42,bench));art.face(pts,(lin(0x708161),)*4)
            pts=(pt(t,.42,bench),pt(t+1,.42,bench),a(0,0,z+bench));art.face(pts,(lin(0x879177),)*3)
        b=z+bench;w=scale
        for j in range(16):
            angle=j*math.tau/16
            if math.cos(angle)<-.12 and math.sin(angle)>.0:continue
            u=math.cos(angle)*26;v=math.sin(angle)*11;high=3.2+2.8*(1+math.cos(7*angle))
            picture(trees,(a(u-2.3,v,b-1.8),a(u+2.3,v,b-1.8),a(u+2.3,v,b+high),a(u-2.3,v,b+high)),((0,0),(.497,0),(.497,1),(0,1)))
        art.tube(a(0,0,b),3.1*w,1.83*w,16.3*w,white,white,18)
        for sub,r,c in ((16.2,2.2,concrete),(16.7,2.55,dark),(18.9,1.99,dark)):
            art.tube(a(0,0,b+sub*w),r*w,r*w,.43*w,c,c,18,c)
        art.tube(a(0,0,b+17*w),1.56*w,1.56*w,1.9*w,lin(0x87A5AA),lin(0xCDCFAB),14)
        art.tube(a(0,0,b+19.3*w),2.14*w,.14*w,1.53*w,red,red,16)
        for j in range(12):
            t=j*math.tau/12;art.box(a(1.62*w*math.cos(t),1.62*w*math.sin(t),b+17*w),(.11,.11,2*w),h,dark)
        for j in (1,2):
            art.box(a(8*j,3,b-.2),(6.4,5.23,3.39),h,white);art.roof(a(8*j,3,b+3.1),6.74,5.64,2.1,h,red)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':5.92,'land':{'mid':0x74846B},'sky':[0xDDE2DC,0xD1D8D7,0xB7C6CB,0xA1B1BA,0x92A4B0],'haze':0xB6C4C4,'light':[0xF0E8D5,1.78],'fill':[0xDBE4E0,0xAAB6AD],'sun_radius':9,'sun_altitude':.43,'sun_azimuth':.72}
