"""Las Vegas Boulevard after midnight, from the Welcome sign to the northern skyline."""
import math
from arenberg import beam
from iten_landmarks import site,picture,pictured
from worldkit import Painted,lin
PROFILE=[[0, 610], [1860, 611], [3840, 613], [4780, 615], [6330, 614], [7700, 612], [9000, 611]]
def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]
def heading(d):return .062*math.sin(d/970)+.022*math.sin(d/270)
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('BoulevardAsphalt','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b in ((-5.8,7.8),(11.3,24.9)):
            pts=[r.at(i,a,.055),r.at(i+1,a,.055),r.at(i+1,b,.055),r.at(i,b,.055)]
            picture(m,pts,[(x*.24,y*.24) for x,y,_ in pts])
    m.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('VegasPavement','terrain');m.colours=[];m.uvs=[]
    for i in range(0,len(r.s)-1,6):
        j=min(i+6,len(r.s)-1)
        for a,b,z in ((-330,-5.8,.02),(-5.8,7.8,-.11),(7.8,11.3,.15),(11.3,24.9,-.11),(24.9,330,.02)):
            pts=[r.at(i,a,z),r.at(j,a,z),r.at(j,b,z),r.at(i,b,z)]
            picture(m,pts,[(x*.15,y*.15) for x,y,_ in pts])
    return m.build(col),lambda x,y:610

def scenery(k):
    art=Painted(k);casinos=pictured(k,'CasinoFronts');hotels=pictured(k,'HotelWindows');boards=pictured(k,'VegasMarquees');palms=pictured(k,'StripPalms');crowd=pictured(k,'StripVisitors');lake=pictured(k,'BellagioWater');sky=pictured(k,'DesertMidnight');neon=pictured(k,'BoulevardNeon');signs=pictured(k,'BoulevardSigns')
    amber,brass,dark,red,cream,slate,blue,green,white=map(lin,(0xf2ad47,0xc8a05c,0x292630,0xb85244,0xdfcdb0,0x4b4656,0x536282,0x426a5d,0xe1d8c1))
    def panel(m,pts,idx=0,n=1):
        a=idx/n;b=(idx+1)/n;picture(m,pts,((a+.001,0),(b-.001,0),(b-.001,1),(a+.001,1)))
    def glow(pts,c):
        neon.faces.append(tuple(neon.v(p) for p in pts));neon.colours.extend((c,)*4);neon.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
    def tower(at,u,v,w,dep,h,base=0):
        for s in (-1,1):
            for pts,rep in (([at(u+x,v+s*w/2,base+z) for x,z in ((-dep/2,0),(dep/2,0),(dep/2,h),(-dep/2,h))],dep),([at(u+s*dep/2,v+y,base+z) for y,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],w)):
                picture(hotels,pts,((0,0),(rep/28,0),(rep/28,h/38),(0,h/38)))
        art.face([at(u+x,v+y,base+h) for x,y in ((-dep/2,-w/2),(dep/2,-w/2),(dep/2,w/2),(-dep/2,w/2))],(slate,)*4)
    for j,d in enumerate(range(-80,9120,20)):
        at,h=site(k,d)
        for v in (-2.4,1,4.4,14.7,18.1,21.5):
            art.box(at(4,v,.064),(3.9,.14,.009),h,white)
        if j%2==0:
            for v in (9.6,-9,29):
                panel(palms,[at(0,v+y,z) for y,z in ((-3.35,.16),(3.35,.16),(3.35,10.8),(-3.35,10.8))],j//2%3,3)
        if j%3==0:
            for s,v in ((-1,-7.3),(1,26.9)):
                panel(crowd,[at(x,v,z) for x,z in ((-3.2,.05),(3.2,.05),(3.2,2.2),(-3.2,2.2))],(j//3+s)%4,4)
        if j%6==0 and all(abs(d-centre)>135 for centre in (1900,3890,4830,6360,8900)):
            for side,v in ((-1,-26),(1,41)):
                idx=(j//6+(1 if side<0 else 0))%4
                for q in range(4):
                    u=-33+q*22
                    panel(casinos,[at(u+x,v,z) for x,z in ((-10.9,.04),(10.9,.04),(10.9,17.5),(-10.9,17.5))],idx,4)
                tower(at,0,v+side*18,19,64,26+j%7*5)
                panel(boards,[at(-22,y,z) for y,z in ((v-5,3.2),(v+5,3.2),(v+5,15.7),(v-5,15.7))],idx,4)
        if j%16==0:
            for v in (-6.15,25.3):
                art.tube(at(0,v,0),.19,.13,7.8,slate,slate,8)
                direction=1 if v<0 else -1
                beam(art,at(0,v,7.4),at(0,v+direction*10,7.4),.22,slate)
                for v2 in (v+direction*5.4,v+direction*8.5):
                    art.box(at(0,v2,6),(.42,.55,1.28),h,dark)
                    glow([at(-.23,v2+y,6.12+z) for y,z in ((-.15,0),(.15,0),(.15,.29),(-.15,.29))],green)
            for b in range(10):
                art.box(at(-8+b*1.1,1,.069),(.42,13.25,.009),h,white)
    for d,v,idx in ((3885,-19,0),(4818,-21,1),(1910,31,2),(4810,34,3),(6395,-20,4),(8890,-20,5)):
        at,h=site(k,d,v)
        art.box(at(0,0,0),(.5,.52,6),h,brass)
        panel(signs,[at(-.31,y,z) for y,z in ((6.4,5.5),(-6.4,5.5),(-6.4,9.3),(6.4,9.3))],idx,6)
    # Luxor and its vertical light beam on the southwest skyline.
    at,h=site(k,470,-99)
    pts=[at(u,v,0) for u,v in ((-39,-39),(39,-39),(39,39),(-39,39))]
    for j in range(4):art.face((pts[j],pts[(j+1)%4],at(0,0,52)),(blue,dark,blue))
    for j in range(3):
        a=j*math.pi/3
        glow([at(math.cos(a)*v,math.sin(a)*v,z) for v,z in ((-.96,52),(.96,52),(2.1,320),(-2.1,320))],lin(0xaebcd6))
    # Manhattan hotel towers with stepped Art Deco crowns.
    at,h=site(k,1925,55)
    for i,(u,v,z) in enumerate(((-24,4,48),(-13,-6,63),(2,1,78),(16,6,51),(29,0,68))):
        tower(at,u,v,11,13,z);tower(at,u,v,7.4,9.5,6.7,z);art.tube(at(u,v,z+6.7),2.1,.13,10,brass,white,4,cap=white)
    # A real lake opening framed by the curved, terraced Bellagio frontage.
    at,h=site(k,3890,-39)
    for j in range(32):
        a=j*math.tau/32;b=(j+1)*math.tau/32
        def shore(t,r):return at(r*math.cos(t)*74,r*math.sin(t)*25,.17)
        picture(lake,(shore(a,.001),shore(b,.001),shore(b,1),shore(a,1)),((0,0),(0,.01),(1,1),(1,0)))
    for i in range(7):
        u=(i-3)*19;v=-37+.0026*u*u
        tower(at,u,v,16,19.4,29)
        panel(casinos,[at(u+x,v+8.14,z) for x,z in ((-9.7,0),(9.7,0),(9.7,29.1),(-9.7,29.1))],3,4)
    # Four tapering lattice legs and three platforms identify the Paris replica.
    at,h=site(k,4853,-45)
    for i in range(10):
        z0=i*8;z1=z0+8;a=12*(1-z0/94)**1.7+1;b=12*(1-z1/94)**1.7+1
        for s1 in (-1,1):
            for s2 in (-1,1):
                beam(art,at(s1*a,s2*a,z0),at(s1*b,s2*b,z1),.65,amber)
                beam(art,at(s1*a,s2*a,z0),at(-s1*b,s2*b,z1),.22,brass)
                beam(art,at(s1*a,s2*a,z0),at(s1*b,-s2*b,z1),.22,brass)
        if i in (2,5,9):art.box(at(0,0,z1-.45),(b*2+2,b*2+2,.93),h,amber)
    art.tube(at(0,0,80),1.08,.13,12,brass,white,8,cap=white)
    at,h=site(k,4805,44)
    for i in range(9):art.tube(at(-22+i*5.4,0,0),.7,.64,8.3,cream,cream,10,cap=cream)
    art.box(at(0,0,8.25),(50,8,1.5),h,cream);art.roof(at(0,0,9.75),50,10,3,h,cream)
    # The Venetian campanile and pedestrian bridge at the intersection.
    at,h=site(k,6380,-37)
    art.box(at(0,0,0),(8.8,8.8,38),h,red);art.box(at(0,0,38),(10,10,6.8),h,cream)
    for s in (-1,1):
        for u in (-3,0,3):art.box(at(u,s*5.04,39),(.96,.1,4.5),h,dark)
    art.tube(at(0,0,44.8),7.35,.15,13.7,green,green,4,cap=brass)
    at,h=site(k,6365)
    art.box(at(0,10.8,7.6),(5.2,45,.8),h,slate)
    for v in range(-11,34,2):
        for u in (-2.5,2.5):
            art.box(at(u,v,8.35),(.11,.13,1.13),h,cream)
            beam(art,at(u,v,9.5),at(u,v+2,9.5),.10,brass)
        if v%4==1:
            panel(crowd,[at(-2.2,v+y,z) for y,z in ((-1.65,8.4),(1.65,8.4),(1.65,10.3),(-1.65,10.3))],v%4,4)
    at,h=site(k,9025,82)
    art.tube(at(0,0),4,2.5,112,cream,cream,10,cap=cream)
    art.tube(at(0,0,112),3.5,9,5,brass,cream,14);art.tube(at(0,0,117),9,7,6.4,slate,cream,14,cap=cream)
    art.tube(at(0,0,123.4),3.5,.25,30,brass,white,9,cap=white)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def e(t,z):return 4500+15000*math.cos(t),14500*math.sin(t),z+610
        picture(sky,(e(a,-2100),e(b,-2100),e(b,7800),e(a,7800)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':5.8,'terrain':{'sea':False},'land':{'mid':0x37303f},'night':True,'sky':[0x28182d,0x1c1828,0x131321,0x0e1020,0x0a0a15],'haze':0x302436,'light':[0xffcfb4,1.05],'fill':[0x9ba7d4,0x715774],'sun_altitude':.74,'sun_azimuth':-.81}
