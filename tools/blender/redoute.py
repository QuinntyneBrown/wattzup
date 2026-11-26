"""The Amblève valley road and the painted Côte de La Redoute above Remouchamps."""
import bisect
import math
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin, smooth

PROFILE=((0,132),(820,137),(1700,130),(3290,150),(4430,139),(5430,147),(6610,135),
         (8120,154),(9640,142),(11180,147),(11640,154),(12000,163),(12250,184),
         (12570,222),(12900,265),(13180,294),(13390,310),(13700,326),(14300,318),
         (15000,324),(15560,331),(16000,327))


def elevation(d):
    i=max(0,min(len(PROFILE)-2,bisect.bisect_right(PROFILE,(d,math.inf))-1))
    (a,z),(b,w)=PROFILE[i:i+2]
    return z+(w-z)*max(0,min(1,(d-a)/(b-a)))


def heading(d):
    straight=smooth(11950,12300,d)*(1-smooth(13000,13390,d))
    return (1-straight)*(.27*math.sin(d/340)+.24*math.sin(d/850)+.12*math.sin(d/123))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;z=elevation(d);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+bc.STEP)-z)/bc.STEP))
        mid=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1


def road(r,st,length,col,bc):
    asphalt=bc.Builder('ArdennesAsphalt','terrain');asphalt.uvs=[];asphalt.colours=[]
    def edge(i,side):
        d=r.s[i]['d'];width=3.63-.74*smooth(11200,11800,d)
        return r.at(i,side*width,.08),(side*width/4,d/4)
    for i in range(len(r.s)-1):
        pts=[edge(j,s) for j,s in ((i,-1),(i+1,-1),(i+1,1),(i,1))]
        picture(asphalt,[p for p,_ in pts],[uv for _,uv in pts])
    asphalt.build(col)


def land(r,col,theme,bc):
    strip=bc.Builder('AmbleveSlopes','terrain');strip.colours=[]
    def ground(d,v):
        z=elevation(d);a=abs(v)
        valley=math.exp(-((v+260)/148)**2)
        far=math.sin(d/290+v/104)*17+math.cos(d/510-v/201)*12
        hills=smooth(48,330,a)*(45+far)+smooth(380,780,a)*(48+far)
        bench=smooth(8,170,a)*(3+math.sin(d/132)*3)
        return z-.32+bench+hills-valley*smooth(12,160,a)*(z-122+48)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i]
        v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return ground(p['d'],v)
    offsets=(-1250,-800,-540,-415,-330,-292,-272,-250,-222,-190,-143,-90,-48,-21,-8,-4,0,4,8,21,48,90,143,220,390,640,1050)
    last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];line=[]
        for v in offsets:
            x,y,_=r.at(i,v);z=ground(d,v)
            light=math.sin(d/98+v/74)+math.sin(v/45-d/245)
            tone=(0x689352 if light>.4 else 0x739954 if light>-.5 else 0x628647)
            if abs(v)>330:tone=0x657F67 if light>0 else 0x5E775B
            if abs(v)<=4:tone=0x787A6B
            if -292<=v<=-250:tone=0x67878A;z=121
            line.append(((x,y,z),lin(tone)))
        if last:
            for j in range(len(offsets)-1):
                vertices=(last[j],line[j],line[j+1],last[j+1])
                strip.quad(*[p for p,c in vertices]);strip.colours.extend(c for p,c in vertices)
        last=line
    return strip.build(col),height


def tile(mesh,points,index,cols,rows):
    u=index%cols/cols;v=1-(index//cols+1)/rows
    picture(mesh,points,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))


def facade(mesh,at,v,w,h,index,cols=2,rows=2):
    tile(mesh,[at(x,v,z) for x,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],index,cols,rows)


def scenery(k):
    art=Painted(k);walls=pictured(k,'WalloonFrontages');folk=pictured(k,'LiegeCrowd')
    forest=pictured(k,'ArdennesFoliage');paint=pictured(k,'FanLettering');signs=pictured(k,'RedouteBoards')
    def building(d,v,w,depth,high,index,motorhome=False):
        at,h=site(k,d,v);side=1 if v>0 else -1
        art.box(at(0,0,-.35),(w,depth,high+.35),h,lin(0xDEDDD2 if motorhome else 0x9A988A))
        facade(walls,at,-side*(depth/2+.025),w,high,index)
        if motorhome:
            for x in (-w*.31,w*.31):
                for y in (-1,1): art.box(at(x,y*(depth/2),-.15),(.69,.16,.55),h,lin(0x343839))
            art.box(at(0,0,high),(w*.39,depth*.58,.33),h,lin(0xCDCEC8))
        else:
            art.roof(at(0,0,high),w+.45,depth+.65,depth*.56,h,lin(0x51585D))
            art.box(at(w*.31,0,high+depth*.32),(.8,.7,2.3),h,lin(0x857B70))
    for d in range(-25,425,15):
        for side in (-1,1):
            if side==1 and 94<d<150:continue
            building(d+k.rng.uniform(-2,2),side*k.rng.uniform(8,12),k.rng.uniform(9,13),7,k.rng.uniform(4.2,6.5),2)
    at,h=site(k,124,16)
    art.box(at(0,0,-.6),(19,10,8),h,lin(0xABA899))
    art.roof(at(0,0,7.4),20,11,5.3,h,lin(0x4C565E))
    art.box(at(-8,0,0),(6,6,15),h,lin(0xAAA799))
    art.tube(at(-8,0,15),4.35,.08,10,lin(0x515861),lin(0x586167),4)
    art.box(at(-8,0,24.8),(.10,.10,1.3),h,lin(0x43494D))
    art.box(at(-8,0,25.6),(.78,.10,.1),h,lin(0x43494D))
    # Stone railway viaduct: voussoirs bound a genuine semicircular opening in each bay.
    at,h=site(k,259,0);stone=lin(0x8F8B7F)
    for j in range(-3,4):
        v=j*11;art.box(at(0,v+5.5,-2),(4.1,1.7,7),h,stone)
        for n in range(14):
            a,b=n*math.pi/14,(n+1)*math.pi/14
            for x in (-2,2):
                pts=[at(x,v+5*math.cos(t),4.8+5*math.sin(t)) for t in (a,b)]
                art.face((*pts,at(x,v+5*math.cos(b),10.7),at(x,v+5*math.cos(a),10.7)),(stone,)*4)
            art.face(tuple(at(x,v+5*math.cos(t),4.8+5*math.sin(t)) for x,t in ((-2,a),(2,a),(2,b),(-2,b))),(lin(0x777468),)*4)
    art.box(at(0,0,10.7),(4.5,77,.75),h,stone)
    for d in range(425,16100,13):
        for side in (-1,1):
            clearing=side<0 and (5200<d<5700 or d>15000)
            if clearing and k.rng.random()<.86:continue
            v=side*k.rng.uniform(10 if d>13000 else 17,50)
            x,y,_=k.road.pos(d,v);z=k.height_at(x,y)-.28
            t=k.rng.randrange(3);tall=k.rng.uniform(4,7) if t==2 else k.rng.uniform(8,16)
            width=tall*(.53 if t==1 else .82)
            for a in (k.s[k.road.index(d)]['h']+.5,k.s[k.road.index(d)]['h']+2.05):
                dx,dy=width*math.cos(a)/2,width*math.sin(a)/2
                tile(forest,[(x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+tall),(x-dx,y-dy,z+tall)],t,3,2)
    for start,end in ((430,11200),(14500,16000)):
        for d in range(start,end,7):
            for side in (-1,1):
                at,h=site(k,d,side*5.3)
                art.box(at(0,0,-.4),(.12,.12,1.52),h,lin(0x786F59))
                for z in (.45,.89):
                    a,b=at(0,0,z),k.road.pos(d+7,side*5.3)
                    art.face((a,(*b[:2],b[2]+z),(*b[:2],b[2]+z+.024),(*a[:2],a[2]+.024)),(lin(0x768073),)*4)
    for d in range(5370,5525,13):
        at,_=site(k,d,-k.rng.uniform(9,23));facade(forest,at,0,3.9,2,3,3,2)
    for d in range(11450,13020,31):
        for side in (-1,1):
            if k.rng.random()>.4: building(d,side*k.rng.uniform(7.7,10.2),k.rng.uniform(6.1,8.6),2.5,2.9,k.rng.randrange(2),True)
    for d in range(11510,13100,3):
        for side in (-1,1):
            at,h=site(k,d,side*k.rng.uniform(4.0,5.5));facade(folk,at,0,1.05,k.rng.uniform(1.65,1.91),k.rng.randrange(8),4,2)
            if d%9==0:
                art.box(at(0,-side*.52,.04),(.07,.07,1.05),h,lin(0x909795))
                art.box(at(0,-side*.52,.96),(8.98,.055,.065),h,lin(0xA3ABA8))
    for j,d in enumerate(range(12010,13150,11)):
        corners=[k.road.pos(d+u,v) for u,v in ((0,-2.19),(0,2.19),(2,2.19),(2,-2.19))]
        tile(paint,[(x,y,z+.13) for x,y,z in corners],j%8,2,4)
    for d in (11665,12420):
        at,h=site(k,d,-7.5);art.box(at(0,0,0),(5.3,3.1,2.8),h,lin(0xD5C8AB))
        art.roof(at(0,0,2.8),6,4.2,1.3,h,lin(0xC35741));facade(signs,at,1.57,5,2.7,2)
    for d,i in ((106,3),(12593,1),(15576,0)):
        at,h=site(k,d,-5.4)
        art.box(at(0,0,-.2),(3,.48,2.23),h,lin(0x918D7E))
        facade(signs,at,.25,3,2.1,i)
    at,h=site(k,13413,0);concrete=lin(0x959893)
    for v in (-51,-19,19,51):
        art.box(at(0,v,-14),(2.7,3.7,27),h,concrete)
        art.box(at(0,v,12),(5.8,6.4,1.2),h,concrete)
    art.box(at(0,0,13),(10.2,145,1.65),h,concrete)
    for x in (-5,5):art.box(at(x,0,14.6),(.39,145,.76),h,lin(0xA6A8A2))
    return {'efforts':0}


THEME={'lay':route,'road_builder':road,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0x72915B},'road_half_width':3.6,
       'sky':[0xCACCC9,0xCED0CF,0xBCC2C4,0xAAB3B8,0x98A2A9],'haze':0xBCC4C1,'light':[0xE9E8E0,1.25],
       'fill':[0xE0E4E4,0x989F89],'sun_altitude':.61,'sun_azimuth':-.72}
