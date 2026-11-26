"""The Silverado Trail with trellised rows, stone cellars and a mission winery."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length))
        total=0
        for s in stages:
            portion=max(0,min(d,s['to'])-s['from'])
            total+=portion*{'work':.012,'recover':-.006}.get(s['kind'],0)
        return 74+total+1.4*math.sin(d/240)+.52*math.sin(d/113)
    def heading(d):return math.radians(18)*math.sin(d/130)*math.cos(d/740)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('SilveradoTarmac','terrain');b.colours=[];b.uvs=[]
    stripes=((-6.4,6.4,.005,0xCEAE75),(-5.65,5.65,.025,0x8D9093),(-.16,-.055,.04,0xFFCA4E),(.055,.16,.04,0xFFCA4E),(-3.62,-3.51,.04,0xF5EFCF),(3.51,3.62,.04,0xF5EFCF))
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in stripes:
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z))
            b.colours.extend([lin(c)]*4);b.uvs.extend(((a/6,p['d']/6),(a/6,r.s[i+1]['d']/6),(e/6,r.s[i+1]['d']/6),(e/6,p['d']/6)))
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Vaca and Mayacamas ranges','terrain');b.colours=[]
    offsets=(-1500,-820,-530,-340,-230,-150,-75,-28,-6,6,28,75,150,230,340,530,820,1500)
    def pt(i,off):
        p=r.s[i];x,y,z=r.at(i,off);t=smooth(16,160,abs(off))
        x+=(p['x']-x)*t;y+=(p['y']+off-y)*t
        k=abs(off);d=p['d']
        z+=.008*k+smooth(145,560,k)*(123+53*math.sin(d/340+off*.0025)+24*math.sin(d/145-off*.007))+smooth(500,1380,k)*(92+52*math.cos(d/681))
        return x,y,z-.28
    for i in range(0,len(r.s)-4,4):
        for a,e in zip(offsets,offsets[1:]):
            face=(pt(i,a),pt(i+4,a),pt(i+4,e),pt(i,e));b.quad(*face)
            for side,(x,y,z) in zip((a,a,e,e),face):
                v=int(10*math.sin(x*.016+y*.03)+6*math.cos(y*.07))
                tint=(186,159,91) if abs(side)>155 else (159,144,83)
                b.colours.append(lin((tint[0]+v)<<16|(tint[1]+v)<<8|(tint[2]+v)))
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.22
    return None,sample


def scenery(k):
    art=Painted(k);vines=pictured(k,'TrellisedVines');oak=pictured(k,'ValleyOaks');flowers=pictured(k,'NapaFlowers')
    facades=pictured(k,'WineryStone');boards=pictured(k,'WinerySigns')
    stone=lin(0xAB9980);stucco=lin(0xE2D5AD);tile=lin(0xAA5B3D);wood=lin(0x786449);iron=lin(0x464744)
    def driveway(d,side):
        return any(abs(d-p)<29 and side==s for p,s in ((3149,-1),(4661,1),(7878,-1)))
    def crossed(mesh,a,width,height,z=0):
        for h in (.1,1.67):
            x=width*.5*math.cos(h);y=width*.5*math.sin(h)
            picture(mesh,(a(-x,-y,z),a(x,y,z),a(x,y,z+height),a(-x,-y,z+height)),UV)
    for side in (-1,1):
        for d in range(-70,8350,10):
            if driveway(d,side):continue
            for row in range(12):
                off=side*(8.7+row*4.25)
                if ((3090<d<3200 or 7810<d<7960) and side==-1 and row<10):continue
                a,_=site(k,d+.9*(row%3),off);e,_=site(k,d+9.6+.9*(row%3),off)
                height=1.54+.15*math.sin(row*1.4+d*.11);z=-.15+abs(off)*.008
                picture(vines,(a(0,0,z),e(0,0,z),e(0,0,z+height),a(0,0,z+height)),UV)
                if row<2 and d%20==0:art.box(a(0,0,z),(.10,.12,height+.15),0,wood)
            if d%20==0:
                a,_=site(k,d,side*7.5);crossed(flowers,a,4.1,.72)
            if d%90==20:
                a,_=site(k,d+8,side*(8.4+k.rng.random()*8));crossed(oak,a,k.rng.uniform(10,18),k.rng.uniform(9,13))
    def house(a,h,l,w,height,wall,roof):
        art.box(a(0,0,-.18),(l,w,height+.18),h,wall);art.roof(a(0,0,height),l,w,height*.47,h,roof)
    a,h=site(k,3151,-19);house(a,h,22,10,6.1,stone,lin(0x705A4C))
    picture(facades,(a(-11,5.03,-.04),a(11,5.03,-.04),a(11,5.03,6.06),a(-11,5.03,6.06)),UV)
    art.box(a(0,8,-.1),(26,6.1,.28),h,stone)
    for u in (-8,0,8):
        art.tube(a(u,8,.20),.06,.055,2.65,iron,iron,8)
        art.tube(a(u,8,2.57),2.14,.08,.65,lin(0xE4B976),lin(0xAD754A),10)
        art.tube(a(u,8,.81),.73,.75,.12,wood,wood,10)
        for v in (-1.1,1.1):
            art.box(a(u,v+8,.16),(.57,.55,.47),h,wood)
    for d,side in ((110,1),(3150,-1),(4656,1),(7872,-1)):
        a,h=site(k,d,side*9)
        for u in (-4.6,4.6):
            art.box(a(u,0,-.15),(.94,.94,2.21),h,stone);art.box(a(u,0,2.06),(1.16,1.1,.22),h,stucco)
            for j in range(7):
                art.box(a(u+(1 if u<0 else -1)*j*.44,side*j*.30,.08),(.055,.055,1.4+.20*math.cos(j*.4)),h,iron)
        sign,h=site(k,d+9,side*7.5)
        art.box(sign(0,0,0),(.17,.17,2.86),h,wood)
        picture(boards,(sign(0,1.32,1.0),sign(0,-1.32,1.0),sign(0,-1.32,2.6),sign(0,1.32,2.6)),UV)
    a,h=site(k,7887,-23)
    house(a,h,27,10,5.0,stucco,tile)
    for u in range(-12,14,4):
        art.box(a(u,7.0,-.2),(.62,.72,4.04),h,stucco)
    art.roof(a(0,6,3.8),28,4.5,.93,h,tile)
    # Four corner piers leave the actual bell opening clear against the light.
    for x in (-1.94,1.94):
        for y in (-1.94,1.94):
            art.box(a(-11+x,y,4.67),(.72,.71,8.44),h,stucco)
    art.box(a(-11,0,4.9),(4.66,4.66,3.3),h,stucco)
    art.box(a(-11,0,12.22),(4.61,4.61,1.0),h,stucco)
    art.roof(a(-11,0,13.19),4.92,4.9,1.33,h,tile)
    beam(art,a(-12.7,0,11.93),a(-9.3,0,11.93),.19,.26,wood)
    art.tube(a(-11,0,9.76),.75,.29,1.32,lin(0x786647),lin(0xB39963),12)
    art.tube(a(-11,0,11.07),.12,.1,.86,iron,iron,8)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':5.65,'land':{'mid':0xAAA05E},'sky':[0xEBD9B8,0xE3D8BF,0xD8DEDB,0xB0CFDB,0x8AB9CF],'haze':0xD7C9A5,'light':[0xFFE0AC,2.11],'fill':[0xE4E3D6,0xC2AA7A],'sun_radius':12,'sun_altitude':.30,'sun_azimuth':.85}
