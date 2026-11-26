"""The Panoramic Highway from Muir Woods to East Peak."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 150], [1700.0, 199.2758], [3200.0, 275.3634], [3325.0, 283.9685], [4825.0, 360.0561], [4950.0, 368.6613], [6450.0, 455.6186], [6575.0, 464.2237], [8475.0, 574.3696], [8600.0, 582.9747], [10006.25, 669.5923], [10131.25, 678.1975], [11537.5, 764.8151], [11662.5, 773.4202], [12149.166666666666, 784.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):return .53*math.sin(d/387)+.31*math.sin(d/157)+.12*math.sin(d/73)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    z=elevation(d);edge=abs(v)-5.3
    if edge<0:return z-.24
    rugged=math.sin(d/28+v*.064)*math.cos(d/57-v*.081)
    slope=.59 if v<0 else -.39-.27*math.sin(d/480)
    return z-.24+edge*slope+min(1,edge/17)*rugged*(1+edge*.045)

def road(r,st,length,col,bc):
    m=bc.Builder('PanoramicRoad','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        w=3.78
        picture(m,[r.at(j,v,.04) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))],((0,0),(0,1),(1,1),(1,0)))
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('MarinRidge','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[]
        for v in (-290,-100,-42,-18,-6,-4,0,4,6,16,38,90,240,450):
            x,y,_=r.at(i,v);row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/8,y/8) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.25

def scenery(k):
    art=Painted(k);woods=pictured(k,'MuirRedwoods');bay=pictured(k,'BayHorizon');sea=pictured(k,'StinsonShore');sign=pictured(k,'MarinSigns');fog=pictured(k,'Inversion')
    bark,wood,oak,rock,cream,roof,glass,red,yellow,iron=map(lin,(0x795245,0x807059,0x626C4D,0x8B8980,0xC9C4AD,0x626959,0x6D8B94,0xB45A45,0xD6AE43,0x5A625C))
    def foliage(x,y,z,w,h,idx,angle):
        for a in (angle,angle+1.52):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a);u=idx*.25
            picture(woods,[(x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)],((u+.002,0),(u+.248,0),(u+.248,1),(u+.002,1)))
    for j,d in enumerate(range(-40,12200,8)):
        at,h=site(k,d)
        for v in (-3.47,-.10,.10,3.47):art.box(at(0,v,.055),(8.03,.10,.012),h,yellow if abs(v)<1 else cream)
        if math.cos(d/125)>.03 or d<400 or abs(d-6950)<100:
            art.box(at(0,4.35,-.2),(.24,.21,1.05),h,wood);beam(art,at(-4.1,4.32,.74),at(4.1,4.32,.74),.105,wood)
        for side in (-1,1):
            if d<3300 or j%7==0 and (side<0 or j%5==0):
                v=side*k.rng.uniform(6.4,23);x,y,_=at(k.rng.uniform(-4,4),v);z=ground(d,v)
                if d<3300:
                    ht=k.rng.uniform(25,47);rad=ht/30;art.tube((x,y,z),rad*1.42,rad*.63,ht*.50,bark,bark,9);idx=j%2
                    for f in range(3):
                        a=f*2.09+j;art.tube((x+rad*.85*math.cos(a),y+rad*.85*math.sin(a),z-.13),rad*.64,rad*.17,3.1,bark,bark,6)
                    foliage(x,y,z,ht*.32,ht,idx,j*.62)
                else:foliage(x,y,z,11,12,2+j%2,j*.36)
            if d>3100 and j%2==0:
                v=side*k.rng.uniform(5.5,15);x,y,_=at(0,v);z=ground(d,v);s=k.rng.uniform(.6,1.7)
                for i in range(3):
                    a=i*2.1+j;end=(x+s*.54*math.cos(a),y+s*.54*math.sin(a),z+s*.83)
                    beam(art,(x,y,z),end,.075,red);art.tube(end,s*.60,s*.28,s*.56,oak,oak,6,cap=oak)
        if d>2900 and j%4==0:
            v=-k.rng.uniform(5.3,15);x,y,_=at(0,v);ht=k.rng.uniform(.65,2.45)
            art.tube((x,y,ground(d,v)-.24),ht*1.1,ht*.55,ht,rock,rock,6,cap=rock)
    # Both main towers and the suspension cable cross a distant arm of the bay.
    at,h=site(k,7180,520);zw=elevation(6950)-108
    def bridge(u,v,z):
        x,y,_=at(u,v);return x,y,zw+z
    art.box(bridge(0,0,12),(360,7,2.2),h,red)
    for u in (-80,80):
        for v in (-4.8,4.8):art.box(bridge(u,v,0),(3.4,2.3,69),h,red)
        for ht in (19,39,59,65):
            beam(art,bridge(u,-4.8,ht),bridge(u,4.8,ht),1.05,red)
    def cable(u):
        if abs(u)<=80:return 27+39*(u/80)**2
        return 66-(abs(u)-80)*.45
    for u in range(-170,170,5):
        for v in (-4.8,4.8):
            beam(art,bridge(u,v,cable(u)),bridge(u+5,v,cable(u+5)),.48,red)
            if u%10==0:beam(art,bridge(u,v,14),bridge(u,v,cable(u)),.21,red)
    # East Peak's glass lookout, deck and radio mast rise above the summit outcrop.
    at,h=site(k,11986,-16);base=ground(11986,-16)-elevation(11986)
    for i in range(22):
        a=i*2.4;r=2+i%5
        art.tube(at(r*math.cos(a),r*math.sin(a),base-.7),2.6,1.9,2+i%3,rock,rock,7,cap=rock)
    art.box(at(0,0,base+2),(7.7,6.7,4.3),h,cream);art.box(at(0,0,base+6.3),(9.6,8.5,.37),h,wood)
    art.box(at(0,0,base+6.67),(6.6,5.75,2.55),h,glass);art.roof(at(0,0,base+9.22),7.4,6.6,1.6,h,roof)
    for side in (-1,1):
        for u in range(-3,4):art.box(at(u,side*2.9,base+6.7),(.105,.11,2.55),h,cream)
        for u in range(-4,5,2):art.box(at(u,side*4.13,base+6.67),(.10,.10,1.02),h,iron)
        beam(art,at(-4.65,side*4.13,base+7.66),at(4.65,side*4.13,base+7.66),.057,iron)
    art.tube(at(-3.7,1.9,base+6.7),.077,.045,10,iron,iron,7)
    for d in (140,4620,6976,11945):
        at,h=site(k,d,5.9)
        for v in (-1,1):art.box(at(0,v,-.40),(.18,.18,2.75),h,wood)
        if d==11945:picture(sign,[at(0,v,z) for v,z in ((-1.14,1.26),(1.14,1.26),(1.14,2.4),(-1.14,2.4))],((1,0),(0,0),(0,1),(1,1)))
    for i in range(96):
        a=math.tau*i/96;b=math.tau*(i+1)/96;u=i%16/16;v=u+1/16
        if i//16%2:u,v=1-u,1-v
        def e(t,z):return 5400+13800*math.cos(t),12500*math.sin(t),z
        picture(bay,(e(a,-750),e(b,-750),e(b,3200),e(a,3200)),((u,0),(v,0),(v,1),(u,1)))
    at,h=site(k,9480,730)
    picture(sea,[at(u,0,z) for u,z in ((-480,-430),(480,-430),(480,-65),(-480,-65))],((0,0),(1,0),(1,1),(0,1)))
    for j,d in enumerate(range(3770,8040,95)):
        at,h=site(k,d,117+j%4*16)
        picture(fog,[at(u,v,-35+q) for u,v,q in ((-108,-52,0),(108,-52,0),(108,98,-18),(-108,98,-18))],((0,0),(1,0),(1,1),(0,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.78,'terrain':{'sea':False},'land':{'mid':0x8E815D},'sky':[0xB8CCD8,0xA9C7DD,0x87AED2,0x699BCC,0x5289C1],'haze':0xC5D4DE,'light':[0xFFEBCA,1.42],'fill':[0xC9DBE3,0x8C826B],'sun_altitude':.79,'sun_azimuth':-.76}
