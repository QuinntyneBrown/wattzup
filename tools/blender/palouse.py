"""The Palouse wheat-hill road between a harvest farm, Colfax siding and Steptoe Butte."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import picture,pictured,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))
PROFILE=((0,742),(1100,767),(2600,728),(3800,758),(5500,740),(6900,776),(8200,722),(9800,758),(12400,786),(13500,750),(14900,782),(16000,756),(17620,798),(18153,776))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length))
        for (a,lo),(b,hi) in zip(PROFILE,PROFILE[1:]):
            if d<=b:
                work=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
                return lo+(hi-lo)*smooth(a,b,d)+5.1*math.sin(d/149)+.00045*work
        return PROFILE[-1][1]
    def head(d):return .24*math.sin(d/233)+.20*math.sin(d/549)-.09*math.cos(d/132)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=head(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=head(d+.5)-head(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(head(d+bc.STEP*.5));y+=bc.STEP*math.sin(head(d+bc.STEP*.5))
    return rows,stages,length,mean,.14


def road(r,st,length,col,bc):
    b=bc.Builder('PalouseLanes','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];gravel=4910<d<6030
        stripes=((-4.47,4.47,.01,0xA48D66),(-3.67,3.67,.038,0xAD9A7F),(-2.15,-1.65,.057,0x9F8E79),(1.65,2.15,.057,0x9F8E79)) if gravel else ((-4.44,4.44,.012,0x9A8E72),(-3.65,3.65,.041,0x55575B),(-.16,-.055,.061,0xD9B150),(.055,.16,.061,0xD9B150),(-3.26,-3.15,.061,0xDFDCD0),(3.15,3.26,.061,0xDFDCD0))
        for a,e,z,c in stripes:
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def swells(d,v):
    # Long oblique loess crests drift in and out of phase across the section.
    return (29*math.sin(d/205+v/128)+22*math.sin(d/356-v/108)+15*math.cos(d/99+v/158)+7*math.sin(d/64-v/88))


def height(r,i,v):
    p=r.s[i];d=p['d'];spread=smooth(3.8,128,abs(v))
    return p['z']-.14+(swells(d,v)-swells(d,0)*.52)*spread-16*smooth(10,96,abs(v))+9*smooth(110,510,abs(v))


def land(r,col,theme,bc):
    b=bc.Builder('LoessFields','terrain');b.colours=[]
    offsets=[-2320,-1830,-1430,-1170,-940,-773,-625,-512,-417,-341,-277,-226,-181,-143,-109,-81,-59,-42,-29,-18,-10,-4,0,4,10,18,29,42,59,81,109,143,181,226,277,341,417,512,625,773,940,1170,1430,1830,2320]
    palette=(0x82943B,0xCDB557,0x9DA23D,0xC89949,0x889A45,0xCBD174,0xA98350,0xDCC076,0x798C4E)
    def pt(i,v):
        s=r.s[i];x,y,_=r.at(i,v);f=smooth(12,104,abs(v))
        return x+(s['x']-x)*f,y+(s['y']+v-y)*f,height(r,i,v)
    def tint(i,v,c):
        d=r.s[i]['d'];slope=(swells(d+4,v)-swells(d-4,v))/8;side=(swells(d,v+4)-swells(d,v-4))/8
        shade=.85+.31*slope-.26*side+.044*math.sin(d/225-v/173)
        return tuple(min(1,k*shade) for k in lin(c)[:3])+(1,)
    for i in range(0,len(r.s)-4,4):
        j=i+4;d=r.s[i]['d']
        for l,e in zip(offsets,offsets[1:]):
            mid=(l+e)/2;cell=int(math.floor((d+75*math.sin(mid/103))/243))+3*int(math.floor((mid+39*math.sin(d/106))/128))
            c=palette[cell%len(palette)]
            loc=((i,l),(j,l),(j,e),(i,e));b.quad(*(pt(n,v) for n,v in loc));b.colours.extend(tint(n,v,c) for n,v in loc)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));s=r.s[i];v=(y-s['y'])*math.cos(s['h'])-(x-s['x'])*math.sin(s['h']);return height(r,i,v)
    return None,sample


def scenery(k):
    art=Painted(k);flora=pictured(k,'PalouseCrops');barns=pictured(k,'WhitmanBarn');machines=pictured(k,'PalouseMachines');clouds=pictured(k,'WheatClouds')
    def grounded(d,v):
        at,h=site(k,d,v);x,y,z=at(0,0);base=k.height_at(x,y)-z
        return lambda a,b,c:at(a,b,base+c),h
    def stripe(group,at,side,variant,count,w,h):
        u=variant/count
        dx=w*.5*math.cos(side);dy=w*.5*math.sin(side)
        picture(group,(at(-dx,-dy,0),at(dx,dy,0),at(dx,dy,h),at(-dx,-dy,h)),((u+.001,0),(u+1/count-.001,0),(u+1/count-.001,1),(u+.001,1)))
    def cylinder(at,h,rad,high,col):
        for j in range(18):
            a=j*math.tau/18;b=(j+1)*math.tau/18;x,y=rad*math.cos(a),rad*math.sin(a);u,v=rad*math.cos(b),rad*math.sin(b)
            c=lin(col+int(10*math.cos(a-1))*0x010101)
            art.face((at(x,y,0),at(u,v,0),at(u,v,high),at(x,y,high)),(c,)*4)
            art.face((at(x,y,high),at(u,v,high),at(0,0,high+rad*.48)),(c,)*3)
    def barn(d,v):
        at,h=grounded(d,v);red=lin(0x984939)
        art.box(at(0,0,0),(15,10,4.9),h,red)
        # Gambrel roof has two slopes on each side and a broad upper ridge.
        profile=((-5.45,4.7),(-4.0,7.18),(0,8.54),(4.0,7.18),(5.45,4.7))
        for (a,z),(b,y) in zip(profile,profile[1:]):
            c=lin(0x8E9694 if a<0 else 0xA9A69C);art.face((at(-7.81,a,z),at(7.81,a,z),at(7.81,b,y),at(-7.81,b,y)),(c,)*4)
        for side in (-1,1):
            x=side*7.54
            picture(barns,(at(x,-5.02,0),at(x,5.02,0),at(x,5.02,8.53),at(x,-5.02,8.53)),((.001,0),(.499,0),(.499,1),(.001,1)))
            y=side*5.05
            picture(barns,(at(-7.52,y,.04),at(7.52,y,.04),at(7.52,y,4.94),at(-7.52,y,4.94)),((.501,0),(.999,0),(.999,1),(.501,1)))
        at,h=grounded(d+21,v+9);cylinder(at,h,3.4,11.4,0xAAA69A)
        for i in range(7):
            tree,_=grounded(d-17+i*7,v+19);stripe(flora,tree,.58,2,3,4.1,12+i%3)
    for d,v in ((2810,26),(6980,-76),(14830,52)):barn(d,v)
    for d in range(-60,18280,13):
        for side in (-1,1):
            at,_=grounded(d+k.rng.uniform(-4,4),side*k.rng.uniform(4.9,12.9));j=int(d/442+(side+1))%2;stripe(flora,at,.62 if side>0 else 2.27,j,3,2.8+k.rng.random(),.75+k.rng.random()*.38)
    at,h=grounded(5519,-13.4);stripe(machines,at,.66,0,2,8.4,3.76)
    at,h=grounded(5533,-16.7);stripe(machines,at,.85,1,2,6.8,2.95)
    # Steel grain bins share a concrete headhouse and covered transfer gallery at the rail siding.
    for i in range(5):
        at,h=grounded(8292+i*6.45,23.4);cylinder(at,h,3.43,19.7,0xD8D3BE)
    at,h=grounded(8303,27.5);art.box(at(0,0,-.14),(7.1,5.9,26.8),h,lin(0xC2BDA7));art.box(at(0,0,26.65),(7.65,6.43,2.02),h,lin(0x8B9087));art.box(at(3.6,-3.93,20.5),(34.3,2.8,1.66),h,lin(0x96998C))
    beam(art,at(-2,-2.9,20.4),at(-8,-10,5.3),.63,.81,lin(0x8B9290))
    for j in range(102):
        d=8120+3.8*j;at,h=grounded(d,16.3);art.box(at(0,0,.1),(.32,2.47,.17),h,lin(0x807262))
        for side in (-1,1):
            other,_=grounded(d+3.8,16.3);beam(art,at(0,side*.73,.32),other(0,side*.73,.32),.11,.13,lin(0x777977))
    for d,v in ((8164,29),(8215,39),(8390,25)):
        at,h=grounded(d,v);art.box(at(0,0,0),(16,7,3.5),h,lin(0xC4AC8B));art.roof(at(0,0,3.5),16.6,7.6,1.91,h,lin(0x8F8E81))
    # Steptoe's quartzite summit is one fixed relief above the softer surrounding folds.
    at,h=site(k,12770,927);base=698-k.road.pos(12770)[2];levels=((0,1),(.17,.83),(.38,.63),(.63,.42),(.82,.27),(.94,.13),(1,.022))
    for (lo,a),(hi,b) in zip(levels,levels[1:]):
        for j in range(44):
            def ring(idx,r,q):
                t=idx*math.tau/44;w=1+.08*math.sin(3*t)+.055*math.cos(5*t)
                return at(624*r*w*math.cos(t)+67*q,453*r*w*math.sin(t),base+351*q)
            color=0x8C9164 if lo<.63 else 0x857F66 if lo<.94 else 0x767367
            c=lin(color+int(13*math.cos(j*math.tau/44+1.1))*0x010101)
            art.face((ring(j,a,lo),ring(j+1,a,lo),ring(j+1,b,hi),ring(j,b,hi)),(c,)*4)
    for d,v,w in ((420,855,365),(3210,-901,515),(7900,1300,630),(11432,-985,554),(16400,990,601)):
        at,h=site(k,d,v);picture(clouds,(at(-w*.5,-85,132),at(w*.5,85,132),at(w*.5,85,261),at(-w*.5,-85,261)),UV)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.65,'land':{'mid':0xA6A45D},'sky':[0xF1DFB7,0xDDDCCB,0xA9C9D8,0x89B4D1,0x649CC5],'haze':0xD2C6A8,'light':[0xFFDEA4,2.25],'fill':[0xD3E1EA,0xC3A876],'sun_radius':9,'sun_altitude':.28,'sun_azimuth':-1.12}
