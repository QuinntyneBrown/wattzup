"""Ladbroke Grove on Carnival Monday: terraces, mas bands and the Westway."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length))
        return 28+sum(max(0,min(d,s['to'])-s['from'])*{'warm-up':.005,'work':.025,'recover':-.005,'steady':.005}.get(s['kind'],0) for s in stages)+.56*math.sin(d/113)
    def heading(d):return math.radians(10)*math.sin(d/150)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('GroveTarmac','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-17,17,.004,0x9B9996),(-8.85,8.85,.055,0xC4B7A9),(-6.82,6.82,.072,0xE4E2E0),(-6.65,-6.55,.084,0xE8C655),(6.55,6.65,.084,0xE8C655)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
            b.uvs.extend(((a/5,p['d']/5),(a/5,r.s[i+1]['d']/5),(e/5,r.s[i+1]['d']/5),(e/5,p['d']/5)))
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('London blocks','terrain');b.colours=[]
    for i in range(0,len(r.s)-4,4):
        b.quad(r.at(i,-500,-.4),r.at(i+4,-500,-.4),r.at(i+4,500,-.4),r.at(i,500,-.4));b.colours.extend([lin(0x8B8980)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.35
    return None,sample


def scenery(k):
    art=Painted(k);homes=pictured(k,'GroveTerraces');spectators=pictured(k,'CarnivalPavements');mas=pictured(k,'LondonMas');trees=pictured(k,'PlaneTrees');flags=pictured(k,'CaribbeanFlags');amps=pictured(k,'BassBins')
    cream=lin(0xDDD4C0);stone=lin(0xA29B8D);steel=lin(0x9A9C93);dark=lin(0x353731);black=lin(0x282A28)
    def strip(mesh,vertices,i,count):
        u=i/count;picture(mesh,vertices,((u+.001,0),(u+1/count-.001,0),(u+1/count-.001,1),(u+.001,1)))
    for side in (-1,1):
        for n,d in enumerate(range(-70,6070,8)):
            if 4373<d<4430 or abs((d%580)-420)<13:continue
            a,h=site(k,d,side*16.5);height=10.8+(n//7%3)*.65;face=-side*3.57
            art.box(a(0,0,-.52),(8.05,7.1,height+.53),h,lin((0xE0DCCC,0xDABDA7,0xD9C6BF,0xC5C4B1)[n//4%4]))
            strip(homes,(a(-4.01,face,-.06),a(4.01,face,-.06),a(4.01,face,height),a(-4.01,face,height)),int(n//4%3==1),2)
            art.box(a(0,face,height-.26),(8.14,.51,.33),h,cream)
            art.box(a(0,face-side*.60,3.4),(3.7,1.36,.25),h,cream)
            for u in (-1.8,-.9,0,.9,1.8):art.box(a(u,face-side*1.25,3.6),(.045,.055,.83),h,dark)
            art.box(a(0,face-side*1.25,4.41),(3.7,.062,.065),h,dark)
            if n%5==0:
                y=face-side*1.29
                strip(flags,(a(-1.28,y,3.5),a(1.28,y,3.5),a(1.28,y,4.43),a(-1.28,y,4.43)),n//5%3,3)
            if n%4==0:
                p,_=site(k,d+3,side*11.8);w=k.rng.uniform(3.4,5.05);ht=k.rng.uniform(9.3,13.8)
                for angle in (.32,1.7):
                    x=w*math.cos(angle);y=w*math.sin(angle)
                    picture(trees,(p(-x,-y,0),p(x,y,0),p(x,y,ht),p(-x,-y,ht)),UV)
        for d in range(-55,6050,4):
            if abs((d%580)-420)<12:continue
            a,h=site(k,d,side*7.26);e,_=site(k,d+4,side*7.26)
            for z in (.25,1.12):beam(art,a(0,0,z),e(0,0,z),.048,.065,steel)
            for j in range(5):art.box(a(j*.78,0,.13),(.045,.053,.97),h,steel)
            strip(spectators,(a(-2.06,side*.6,.09),a(2.06,side*.6,.09),a(2.06,side*.6,2.08),a(-2.06,side*.6,2.08)),k.rng.randrange(4),4)
    for d,off in ((1064,2.1),(1073,-2.1),(1086,3.0),(1100,-3),(2139,4.3),(2172,-3.7),(3125,4.5),(3160,-3.9)):
        a,h=site(k,d,off);j=k.rng.randrange(3)
        strip(mas,(a(-.03,1.24,.08),a(-.03,-1.24,.08),a(-.03,-1.24,3.07),a(-.03,1.24,3.07)),j,3)
    for d,side in ((155,-1),(2159,1),(3170,-1),(5570,1)):
        a,h=site(k,d,side*6.3)
        for n in range(3):
            for j in range(3 if n==1 else 2):
                u=n*1.2-1.2
                art.box(a(u,0,.12+j*1.36),(1.21,1.18,1.38),h,black)
                y=-side*.61
                picture(amps,(a(u-.59,y,.16+j*1.36),a(u+.59,y,.16+j*1.36),a(u+.59,y,1.44+j*1.36),a(u-.59,y,1.44+j*1.36)),UV)
    a,h=site(k,4402)
    art.box(a(0,0,6.08),(22,103,1.57),h,lin(0x928D84))
    for u in (-10.1,10.1):art.box(a(u,0,7.64),(.51,104,1.02),h,lin(0xB9B4A6))
    for v in (-18,-9.8,10.2,18):
        for u in (-7.6,7.6):art.box(a(u,v,-.4),(1.85,1.04,6.52),h,stone)
        art.box(a(0,v,5.63),(20,2.16,.76),h,stone)
    for u in range(-9,11,3):art.box(a(u,0,5.9),(.62,99,.45),h,lin(0x77776D))
    for d,side in ((5650,-1),(5590,1),(5680,1)):
        a,h=site(k,d,side*9.1)
        for x in (-2.4,2.4):
            for y in (-1.5,1.5):art.box(a(x,y,0),(.09,.09,2.55),h,steel)
        art.roof(a(0,0,2.58),5,3.3,.85,h,lin(0x3A6881))
        art.box(a(0,-side*1.12,.84),(4.48,.95,.13),h,cream)
        a,h=site(k,d+4,side*6.4);art.tube(a(0,0,.32),.58,.59,.74,dark,dark,12,dark)
        for u in (-.32,0,.32):art.box(a(u,0,1.07),(.036,.92,.036),h,steel)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':6.82,'land':{'mid':0xA1A090},'sky':[0xE8E3D7,0xDEE5E4,0xCBDFE7,0xADCFDD,0x91BDC9],'haze':0xCAD4CE,'light':[0xFFE8BD,2.13],'fill':[0xE5E4DB,0xBBAF96],'sun_radius':11,'sun_altitude':.62,'sun_azimuth':.7}
