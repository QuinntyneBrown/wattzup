"""The northwestern SS242 approach to Passo Sella and the Città dei Sassi."""
import math
from arenberg import beam
from gardena import strip
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin,smooth

PROFILE=((0,1625),(510,1646),(1180,1694),(1840,1742),(2460,1776),(3180,1821),
         (3920,1868),(4920,1920),(5680,1957),(6420,2017),(7290,2064),(8120,2113),
         (8970,2148),(9740,2180),(10620,2209),(11170,2230),(11637.5,2244))
BENDS=((870,1.09,75),(1510,-1.27,62),(2503,2.72,31),(3130,-2.64,35),(3890,2.69,38),
       (4530,-2.63,37),(5580,2.65,38),(6360,-2.60,36),(7650,2.67,43),(8320,-2.63,39),
       (9500,.78,68),(10090,-1.12,64),(10870,.83,75))


def elevation(d):
    for (a,z),(b,w) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(w-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    return .22+.08*math.sin(d/288)+sum(change*(1+math.tanh((d-station)/width))*.5 for station,change,width in BENDS)


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d);z=elevation(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+bc.STEP)-z)/bc.STEP))
        mid=bearing(d+bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1


def road(r,st,length,col,bc):
    tar=bc.Builder('SS242 Bitumen','gardena-tarmac');tar.colours=[]
    paint=bc.Builder('Italian edge lines','terrain');paint.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,z in ((-3.85,0,.06,.11),(0,3.85,.11,.06)):strip(tar,r,i,a,b,h,h,z,z,0x545557)
        for v in (-3.74,3.62):strip(paint,r,i,v,v+.13,.082,.082,.082,.082,0xE9E6D7)
        if i%4==1:strip(paint,r,i,-.065,.065,.125,.125,.125,.125,0xDDDACC)
    tar.build(col);paint.build(col)


def land(r,col,theme,bc):
    a=bc.Builder('Sella alpine meadow','gardena-pasture');a.colours=[]
    b=bc.Builder('Sella stone scree','gardena-scree');b.colours=[]
    def floor(x,y):
        _,idx,dist=r.tree.find((x,y,0));p=r.s[idx];v=(y-p['y'])*math.cos(p['h'])-(x-p['x'])*math.sin(p['h'])
        e=max(0,dist-4.1)
        return p['z']-.15+min(e,230)*(.14*math.cos(p['h']-.18)*(1 if v>0 else -1)+.075*math.sin(x/187+y/123))+smooth(15,105,e)*4.8*math.sin(x/55+y/82)
    # A single grid samples the nearest road arm. A tighter ribbon fits the cut at each bend.
    offset=(-410,-200,-105,-55,-29,-15,-7,-3.85,3.85,7,15,29,55,105,200,410)
    prev=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[];limits={}
        for side in (-1,1):
            limits[side]=410
            for rad in (8,15,28,45,65,90,129,168,215,286,345,410):
                x,y,_=r.at(i,side*rad);_,other,dist=r.tree.find((x,y,0))
                if abs(r.s[other]['d']-d)>75 and dist<rad-2:
                    limits[side]=rad*.83;break
        for v in offset:
            s=1 if v>0 else -1;v=s*min(abs(v),limits[s]);x,y,_=r.at(i,v);row.append((x,y,floor(x,y)))
        if prev:
            for j in range(len(row)-1):
                pts=(prev[j],row[j],row[j+1],prev[j+1])
                talus=d>9240 and d<10500 and offset[j]>13
                mesh=b if talus else a;mesh.quad(*pts);mesh.colours.extend([lin(0xB5AD97 if talus else 0x91A060)]*4)
        prev=row
    a.build(col);b.build(col);return None,floor


def scenery(k):
    art=Painted(k);stone=pictured(k,'SellaBlocks');forest=pictured(k,'SellaForest')
    huts=pictured(k,'SellaRifugi');signs=pictured(k,'PassSigns')
    lang=pictured(k,'Langkofel');massif=pictured(k,'SellaPlateau')
    rng=k.rng;wood=lin(0x715139);slate=lin(0x78766C)
    def tile(mesh,pts,i=0,cols=1,rows=1):
        u=i%cols/cols;v=1-(i//cols+1)/rows
        picture(mesh,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    def mount(d,l,v,far,width,height):
        at,_=site(k,d,l);view,_=site(k,d)
        x,y,_=at(far,v);rx,ry,_=view(0,0);dx,dy=x-rx,y-ry;hyp=math.hypot(dx,dy);sx,sy=-dy/hyp,dx/hyp
        bottom=1830
        pts=[(x+sx*t,y+sy*t,bottom+up) for t,up in ((width/2,0),(-width/2,0),(-width/2,height),(width/2,height))]
        return pts
    tile(lang,mount(7290,0,370,1480,2830,1325))
    tile(massif,mount(9740,0,-640,1830,3340,1330))
    for d in range(-18,11450,7):
        for side in (-1,1):
            if d>7900 and rng.random()<.91 or d>5200 and rng.random()<.59:continue
            l=side*rng.uniform(8.4,82);at,h=site(k,d,l);x,y,z=at(0,0)
            if not k.road.clear_of_road(x,y,6,k.road.index(d)):continue
            base=k.height_at(x,y)-z;tall=rng.uniform(5.2,15.8)*(1-.000035*max(d-4100,0));i=rng.randrange(4);w=tall*.71
            for angle in (h+.76,h+2.33):
                sx,sy=math.cos(angle)*w/2,math.sin(angle)*w/2
                tile(forest,[(x-sx,y-sy,z+base),(x+sx,y+sy,z+base),(x+sx,y+sy,z+base+tall),(x-sx,y-sy,z+base+tall)],i,4,1)
    for d in range(35,11640,23):
        for side in (-1,1):
            at,h=site(k,d,side*4.48)
            art.box(at(0,0,-.29),(.14,.18,1.26),h,lin(0xE7E4D6))
            art.box(at(0,0,.68),(.148,.19,.22),h,lin(0x444741))
            art.box(at(-.078,0,.74),(.02,.11,.08),h,lin(0xD97B53))
    for i,(d,change,w) in enumerate(BENDS):
        at,h=site(k,d-16,-5.1)
        art.box(at(0,0,-.4),(.11,.14,2.55),h,slate)
        tile(signs,[at(-.07,v,z) for v,z in ((.56,1.32),(-.56,1.32),(-.56,2.18),(.56,2.18))],1+i%6,2,4)
        for t in range(-39,39,3):
            q,hh=site(k,d+t,(-1 if change>0 else 1)*4.8)
            art.box(q(0,0,-.22),(.11,.15,1.03),hh,slate)
            beam(art,q(0,0,.65),k.road.pos(d+t+3,(-1 if change>0 else 1)*4.8,.65),.156,lin(0xA6A7A1))
    for j,(d,l,w,depth,height) in enumerate(((247,-23,13,8,5.2),(3140,21,9,6,4.1),(4950,-13,10,6,4.0),(4988,-21,7,5,3.8),
                                                (6190,27,12,6,4.1),(7840,-31,9,6,4.6),(11090,27,16,10,6.3),(11612,19,24,12,8.4))):
        at,h=site(k,d,l);x,y,z=at(0,0);base=k.height_at(x,y)-z
        art.box(at(0,0,base-.58),(w,depth,1.49),h,lin(0xA59C86))
        art.box(at(0,0,base+.91),(w,depth,height-.91),h,wood if j<6 else lin(0xD8CDB1))
        art.roof(at(0,0,base+height),w+1.3,depth+1.25,2.25,h,slate)
        for v in (-depth/2-.04,depth/2+.04):
            tile(huts,[at(u,v,base+up) for u,up in ((-w/2,.92),(w/2,.92),(w/2,height),(-w/2,height))],0 if j<6 else 1,3,1)
        if j<6:
            for n in range(7):art.box(at(-w*.31,-depth*.54,base+1.5+n*.32),(.75,.10,.08),h,lin(0xBDA07A))
        else:
            for floor in (2.9,5.4):
                art.box(at(0,-depth*.56,base+floor),(w*.96,1.16,.2),h,wood)
                for n in range(-int(w/2)+1,int(w/2)):
                    art.box(at(n,-depth*.61,base+floor+.11),(.075,.11,.72),h,wood)
                art.box(at(0,-depth*.61,base+floor+.85),(w*.96,.12,.10),h,wood)
    for d in range(4460,5330,3):
        q,_=site(k,d,rng.choice((-1,1))*rng.uniform(5,24));x,y,z=q(0,0);z=k.height_at(x,y)
        n=rng.randrange(3,8)
        for j in range(n):
            u=x+rng.uniform(-.33,.33);v=y+rng.uniform(-.33,.33);h=z+rng.uniform(.07,.24)
            tone=lin(rng.choice((0xEBC851,0xDCCFEA,0xE8E7D2,0xC190BA)))
            art.face(((u-.055,v-.05,h),(u+.061,v-.053,h+.01),(u+.05,v+.057,h),(u-.04,v+.051,h)),(tone,)*4)
    for d in range(9330,10515,4):
        for side in (-1,1):
            if side<0 and rng.random()<.62:continue
            v=side*rng.uniform(7,49);q,_=site(k,d,v);x,y,z=q(0,0);floor=k.height_at(x,y)
            if not k.road.clear_of_road(x,y,4.9,k.road.index(d)):continue
            w=rng.uniform(.76,4.36);h=w*rng.uniform(.62,1.18);phase=rng.uniform(0,math.tau)
            rim=[];top=[]
            for j in range(7):
                a=j*math.tau/7+phase;xx=w*math.cos(a);yy=w*.77*math.sin(a)
                rim.append((x+xx,y+yy,floor-.57));top.append((x+xx*.69+.2*w,y+yy*.69,floor+h*rng.uniform(.68,1)))
            for j in range(7):
                m=(j+1)%7;tile(stone,(rim[j],rim[m],top[m],top[j]))
                picture(stone,(top[j],top[m],(x+.13*w,y,floor+h*1.09)),((0,0),(1,0),(.54,1)))
    at,h=site(k,11608,-5.55)
    for v in (-1.65,1.65):art.box(at(0,v,-.53),(.11,.16,3.7),h,slate)
    tile(signs,[at(-.10,v,z) for v,z in ((2.02,1.38),(-2.02,1.38),(-2.02,3.65),(2.02,3.65))],0,2,4)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'land':{'mid':0x85995F},
       'haze':0xB8CDCC,'sky':[0xCED9CF,0xA5C7D4,0x7CAECB,0x538DB8,0x3B75A3],
       'light':[0xFFE7BE,1.65],'fill':[0xC6D8DF,0xACA087],'sun_altitude':.49,'sun_azimuth':1.02,'road_half_width':3.85}
