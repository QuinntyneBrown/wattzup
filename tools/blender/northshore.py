"""North Shore of Oahu from the shops of Haleiwa to the shrimp trucks."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def heading(d):return math.radians(14)*math.sin(d/180)*math.cos(d/1350)
    def height(d):
        d=max(0,min(d,length))
        effort=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 8+2.9*math.sin(d/280)+1.24*math.sin(d/124)+effort*.0008
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('KamHighway','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-5.6,5.6,.012,0xDFBF8E),(-3.78,3.78,.025,0x696861),(-.18,-.068,.04,0xEAC24B),(.068,.18,.04,0xEAC24B),(-3.57,-3.48,.04,0xCECEC1),(3.48,3.57,.04,0xCECEC1)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
            b.uvs.extend(((a/6,p['d']/6),(a/6,r.s[i+1]['d']/6),(e/6,r.s[i+1]['d']/6),(e/6,p['d']/6)))
    b.build(col)


def shore(d):return 31+8*math.sin(d/99)+18*math.cos(d/375)+18*(1-math.exp(-((d-2920)/285)**2))


def land(r,col,theme,bc):
    ground=bc.Builder('Beach and Koolau foothills','terrain');ground.colours=[]
    water=bc.Builder('NorthShoreSea','terrain');water.colours=[];water.uvs=[]
    def pt(i,off,waterline):
        p=r.s[i];x,y,z=r.at(i,off);t=smooth(11,90,abs(off))
        x+=(p['x']-x)*t;y+=(p['y']+off-y)*t
        if off>5:z+=(.25-z)*smooth(6,waterline,off)
        elif off<-6:z+=smooth(24,330,-off)*(87+41*math.sin(p['d']/385)+17*math.cos(p['d']/140))
        return (x,y,z-.15)
    for i in range(0,len(r.s)-3,3):
        j=i+3;sl=shore(r.s[i]['d']);sr=shore(r.s[j]['d'])
        for a,e,colour in ((-540,-260,0x457950),(-260,-88,0x53874E),(-88,-26,0x739752),(-26,-5.3,0x9FA55B),(-5.3,5.3,0xC4AC83),(5.3,9,0xBDAD70),(9,16,0xCEA86E),(16,None,0xDFBD87)):
            es=sl if e is None else e;et=sr if e is None else e;pts=(pt(i,a,sl),pt(j,a,sr),pt(j,et,sr),pt(i,es,sl))
            ground.quad(*pts);base=tuple((colour>>n)&255 for n in (16,8,0))
            for x,y,z in pts:
                v=int(6*math.sin(x*.043+y*.087))
                ground.colours.append(lin((base[0]+v)<<16|(base[1]+v)<<8|(base[2]+v)))
        for a,e,c in ((0,3,0xA4DBCB),(3,12,0x79C9BA),(12,50,0x39A9B0),(50,230,0x278F9F),(230,1000,0x427F91)):
            pts=[]
            for ii,off in ((i,sl+a),(j,sr+a),(j,sr+e),(i,sl+e)):
                x,y,_=pt(ii,off,shore(r.s[ii]['d']));pts.append((x,y,.12))
            water.quad(*pts);water.colours.extend([lin(c)]*4);water.uvs.extend([(x/12,y/12) for x,y,_ in pts])
    ground.build(col);water.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.2
    return None,sample


def scenery(k):
    art=Painted(k);flora=pictured(k,'ShoreFlora');shops=pictured(k,'HaleiwaFronts');trucks=pictured(k,'KahukuTruck');signs=pictured(k,'NorthShoreSigns');ridges=pictured(k,'KoolauRidges');breakers=pictured(k,'OahuBreakers')
    timber=lin(0x88684B);steel=lin(0x868D85);sand=lin(0xE0BF94);white=lin(0xE2E0CF);stone=lin(0x938C7E);dark=lin(0x434640)
    def plant(d,off,n,w,h):
        a,_=site(k,d,off);u=n/3
        for angle in (.30,1.82):
            x=.5*w*math.cos(angle);y=.5*w*math.sin(angle)
            picture(flora,(a(-x,-y,-.28),a(x,y,-.28),a(x,y,h),a(-x,-y,h)),((u+.001,0),(u+.332,0),(u+.332,1),(u+.001,1)))
    for d in range(-55,9040,21):
        for side in (-1,1):
            clear=side==1 and any(abs(d-p)<90 for p in (1350,2890,4520,6575))
            if not clear and not (side==-1 and (55<d<187 or 8440<d<8570)):
                off=side*k.rng.uniform(7,16);n=0 if k.rng.random()<.60 else 1
                plant(d,off,n,k.rng.uniform(5.8,9.3),k.rng.uniform(9,16))
                if d%63==8:plant(d+9,side*6.3,2,3.1,1.65)
        if d%84==29:
            a,h=site(k,d,-6);e,_=site(k,d+84,-6)
            art.tube(a(0,0,-.22),.17,.1,8.7,timber,timber,8);art.box(a(0,0,7.76),(.2,2.4,.15),h,timber)
            for v in (-.94,.94):beam(art,a(0,v,7.94),e(0,v,7.94),.034,.034,dark)
    for d in (-20,48,97,126,157,205,1835,7010):
        a,h=site(k,d,-12);art.box(a(0,0,-.25),(11.9,7.1,4.3),h,lin(0xC4B88A))
        art.roof(a(0,0,4.03),12.2,7.4,1.45,h,lin(0x767C65));art.box(a(0,4.28,3.11),(12.4,2.46,.21),h,lin(0x668777))
        for u in (-5.6,0,5.6):art.box(a(u,5.26,-.15),(.13,.15,3.33),h,white)
        picture(shops,(a(-5.9,3.57,-.14),a(5.9,3.57,-.14),a(5.9,3.57,4.0),a(-5.9,3.57,4.0)),UV)
    for idx,(d,side) in enumerate(((108,1),(2898,1),(4520,1),(8499,-1))):
        a,h=site(k,d,side*6.2)
        for v in (-1.43,1.43):art.box(a(0,v,-.2),(.16,.18,3.32),h,timber)
        u=idx%2*.5;v=(1-idx//2)*.5
        picture(signs,(a(-.11,1.53,1.03),a(-.11,-1.53,1.03),a(-.11,-1.53,3.05),a(-.11,1.53,3.05)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    # The twin segmental concrete arches of Rainbow Bridge and Sunset's steel truss.
    for d,arched in ((1361,True),(6594,False)):
        a,h=site(k,d);length=33
        for side in (-1,1):
            v=side*4.26
            for j in range(15):
                u=-length/2+j*length/14
                high=1.2+2.58*(math.sin(math.pi*j/14) if arched else 1)
                art.box(a(u,v,-.34),(.17,.20,high+.34),h,stone if arched else steel)
                if j<14:
                    u2=u+length/14
                    high2=1.2+2.58*(math.sin(math.pi*(j+1)/14) if arched else 1)
                    beam(art,a(u,v,high),a(u2,v,high2),.29,.28,stone if arched else steel)
                    beam(art,a(u,v,.67),a(u2,v,.67),.11,.12,steel)
                    if not arched:beam(art,a(u,v,high if j%2 else .35),a(u2,v,.35 if j%2 else high2),.13,.13,steel)
        if arched:
            a,h=site(k,d,23)
            art.box(a(0,0,-2.15),(30,41,.46),h,lin(0x398D89))
    for centre in (2940,4538,6630):
        for j in range(3):
            d=centre+j*37;off=shore(d)+11+j*7;a,h=site(k,d,off);z=.27-k.road.pos(d)[2]
            picture(breakers,(a(-20,0,z),a(20,0,z),a(20,0,z+4.4),a(-20,0,z+4.4)),UV)
    a,h=site(k,2948,shore(2948)-3)
    base=.16-k.road.pos(2948)[2]
    art.tube(a(0,0,base),6.8,4.4,4.63,lin(0x544A3E),lin(0x716551),9,lin(0x81755D))
    a,h=site(k,2929,-20);art.box(a(0,0,0),(12,7.3,4.42),h,white);art.roof(a(0,0,4.4),12,7.3,3.1,h,lin(0x758778))
    art.box(a(-4.9,0,3.68),(3.3,3.3,5.5),h,white);art.tube(a(-4.9,0,9.18),2.55,.09,4.18,lin(0x596B62),lin(0x596B62),4)
    for d in (175,2980,6640):
        a,h=site(k,d+122,-259)
        picture(ridges,(a(-375,-90,-13),a(375,90,-13),a(375,90,167),a(-375,-90,167)),UV)
    for n,d in enumerate((8487,8524,8553)):
        a,h=site(k,d,-12-n%2*3);art.box(a(0,0,.56),(6.44,2.62,2.72),h,white);art.box(a(3.30,0,.48),(2.08,2.49,1.93),h,white)
        art.box(a(3.64,1.26,1.53),(1.13,.05,.74),h,lin(0x728E94))
        for side in (-1,1):
            for u in (-2.17,2.97):art.box(a(u,side*1.07,.06),(.87,.38,.83),h,dark)
        picture(trucks,(a(-3.18,1.33,.62),a(3.18,1.33,.62),a(3.18,1.33,3.22),a(-3.18,1.33,3.22)),UV)
        art.box(a(0,1.79,2.58),(3.1,1.17,.13),h,white);art.box(a(0,1.71,1.21),(3.21,.93,.12),h,steel)
        for u in (-4.7,5.8):
            art.box(a(u,3.7,.73),(2.0,.74,.13),h,timber)
            for v in (3,4.4):
                art.box(a(u,v,.41),(2.09,.28,.12),h,timber)
                for x in (-.65,.65):art.box(a(u+x,v,-.1),(.14,.13,.64),h,dark)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.78,'land':{'mid':0xB9AA74},'sky':[0xE9E6D6,0xDFEBEA,0xBCDEEA,0x92CDDF,0x72BDD9],'haze':0xCBDDD8,'light':[0xFFF0C8,2.2],'fill':[0xD7EAF0,0xBEBA94],'sun_radius':11,'sun_altitude':.55,'sun_azimuth':.81}
