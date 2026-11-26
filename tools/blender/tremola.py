"""The Tremola's cobbled terraces between Airolo and the Gotthard hospice."""
import math
from bisect import bisect_left
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE = [[0, 1451.5125], [1350.0, 1514.0175], [2725.0, 1628.005], [4075.0, 1690.51], [5450.0, 1804.4975], [6800.0, 1867.0025], [8175.0, 1980.99], [10875.0, 2106.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    rack=max(0,min(1,(d-400)/490,(10000-d)/540))
    return .14*math.sin(d/180)+rack*1.43*math.tanh(3.9*math.sin((d-440)*math.pi/386))
def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('FanSetts','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];end=r.s[i+1]['d']
        for a,b,ha,hb in ((-3.45,0,.045,.089),(0,3.45,.089,.045)):
            picture(m,[r.at(i,a,ha),r.at(i+1,a,ha),r.at(i+1,b,hb),r.at(i,b,hb)],((a/3.8,d/3.8),(a/3.8,end/3.8),(b/3.8,end/3.8),(b/3.8,d/3.8)))
    m.build(col)

def land(r,col,theme,bc):
    grass=bc.Builder('AlpineGraniteTurf','terrain');grass.colours=[];grass.uvs=[]
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s]
    # Across a hairpin the grade belongs to the mountain rather than either branch
    # of the road. Interpolate the geographic profile before grading the road bench.
    creekx,creeky,creekz=r.pos(4642,0);creekh=heading(4642)
    def height(x,y):
        j=max(1,min(len(xs)-1,bisect_left(xs,x)));a,b=r.s[j-1:j+1]
        base=a['z']+(b['z']-a['z'])*(x-a['x'])/max(.01,b['x']-a['x'])
        _,idx,dist=r.tree.find((x,y,0));q=r.s[idx];rug=math.sin(x/63)*math.cos(y/59)+.4*math.sin(x/17+y/33)
        if q['d']>10100:base=q['z']+max(0,dist-80)*.13
        elif q['d']<400:base=q['z']+max(0,dist-29)*.12
        weight=max(0,min(1,(dist-7)/35))
        blended=base+min(24,dist*.10)*rug
        z=q['z']-.94+(blended-q['z'])*weight
        along=(x-creekx)*math.cos(creekh)+(y-creeky)*math.sin(creekh)
        across=-(x-creekx)*math.sin(creekh)+(y-creeky)*math.cos(creekh)
        if 5<across<145 and abs(along)<20:
            depth=min(1,(across-5)/8,(145-across)/14)*max(0,1-abs(along)/20)
            z=min(z,z+(creekz-2.4-.10*across-z)*depth)
        return z
    step=8;last=None
    for x in range(int(min(xs))-200,int(max(xs))+209,step):
        row=[]
        for y in range(int(min(ys))-320,int(max(ys))+329,step):row.append((x,y,height(x,y)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(grass,pts,[(xx*.125,yy*.125) for xx,yy,zz in pts])
        last=row
    return grass.build(col),height

def scenery(k):
    art=Painted(k);stone=pictured(k,'TerraceStone');summit=pictured(k,'GotthardHospice');lake=pictured(k,'TicinoWater')
    rim=pictured(k,'LeventinaSky');sign=pictured(k,'TremolaSigns');crowd=pictured(k,'GotthardVisitors')
    granite,lichen,iron,white,roof,stucco,ochre,blue,slate=map(lin,(0xADA89F,0x8D8B7F,0x646B6D,0xD9D5CC,0x716C68,0xC9C0AA,0xC3AC7F,0x9AADB6,0x818687))
    def panel(m,pts,idx=0,cols=1):
        u=idx/cols;v=(idx+1)/cols;picture(m,pts,((u+.001,0),(v-.001,0),(v-.001,1),(u+.001,1)))
    def rock(pts):
        w=math.dist(pts[0],pts[1])/2.7;h=math.dist(pts[1],pts[2])/2.7
        picture(stone,pts,((0,0),(w,0),(w,h),(0,h)))
    def frontage(at,w,depth,high,idx):
        panel(summit,[at(-depth/2-.045,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,high),(w/2,high))],idx,4)
        panel(summit,[at(u,-w/2-.05,z) for u,z in ((-depth/2,0),(depth/2,0),(depth/2,high),(-depth/2,high))],idx,4)
    for j,d in enumerate(range(-72,10960,6)):
        signside=1 if math.sin(heading(d))>=0 else -1;at,h=site(k,d)
        for side in (-1,1):
            edge=side*3.6
            rock([k.road.pos(d+x,v,z) for x,v,z in ((-3,edge,-.22),(3,edge,-.22),(3,edge,.105),(-3,edge,.105))])
            outer=edge+side*.33
            pts=[k.road.pos(d+x,v,.095) for x,v in ((-3,edge),(3,edge),(3,outer),(-3,outer))];rock(pts)
            if side==signside:
                wallbase=5.6+2.2*math.cos(d/169)
                rock([k.road.pos(d+x,outer,z) for x,z in ((-3,-wallbase),(3,-wallbase),(3,.1),(-3,.1))])
                if abs(math.cos((d-440)*math.pi/386))>.89 and 800<d<9900:
                    rock([k.road.pos(d+x,outer,z) for x,z in ((-3,.14),(3,.14),(3,.72),(-3,.72))])
                    rock([k.road.pos(d+x,v,.72) for x,v in ((-3,outer),(3,outer),(3,edge),(-3,edge))])
            if j%2==0 or side==signside:
                x,y,z=at(0,outer,.07)
                art.tube((x,y,z),.24,.19,1.03,lichen,granite,7,cap=granite)
                art.tube((x,y,z+1.03),.19,.1,.12,granite,granite,7,cap=granite)
        if j%23==0:
            at,h=site(k,d,-4.9)
            panel(crowd,[at(0,v,z) for v,z in ((-1.45,-.3),(1.45,-.3),(1.45,1.55),(-1.45,1.55))],2,4)
        if j%13==0 and 3500<d<9900:
            side=(-1 if j%2 else 1)*k.rng.uniform(16,35);x,y,_=k.road.pos(d,side);g=k.height_at(x,y)
            art.tube((x,y,g-.23),2.1,1.32,1.88,lichen,granite,6,cap=granite)
    for j,(d,v) in enumerate(((166,4.5),(2380,4.5),(4636,-4.9),(6590,4.9),(8498,-4.9),(10718,-6.3))):
        at,h=site(k,d,v);art.box(at(0,0,-.71),(.14,.14,2.78),h,iron)
        wide=1.64 if j in (0,5) else .92
        panel(sign,[at(-.09,y,z) for y,z in ((wide,1.04),(-wide,1.04),(-wide,2.17),(wide,2.17))],0 if j==0 else 2 if j==5 else 1,3)
    # A masonry arch spans the torrent, with stone voussoirs exposed above the water.
    at,h=site(k,4642,18)
    for i in range(20):
        a=i*math.pi/20;b=(i+1)*math.pi/20
        def arch(t,r,v):return at(r*math.cos(t),v,-5.8+r*math.sin(t))
        for v in (-2.2,2.2):rock([arch(a,6.1,v),arch(b,6.1,v),arch(b,7.3,v),arch(a,7.3,v)])
        rock([arch(a,6.1,-2.2),arch(b,6.1,-2.2),arch(b,6.1,2.2),arch(a,6.1,2.2)])
        for v in (-2.2,2.2):
            ux=7.3*math.cos(a);vx=7.3*math.cos(b)
            rock([arch(a,7.3,v),arch(b,7.3,v),at(vx,v,1.9),at(ux,v,1.9)])
    for j in range(40):
        out=9+j*2.5;x0=1.8*math.sin(out/8)
        pts=[at(x0+x,out+n,-1.25-.1*(out+n+18)) for x,n in ((-3.8,0),(3.8,0),(3.8,2.7),(-3.8,2.7))]
        picture(lake,pts,[(x/4,y/4) for x,y,z in pts])
    # A distant motorway viaduct stands on piers above Airolo's clustered roofs.
    at,h=site(k,6620,180)
    def town(u,v,z):
        x,y,_=at(u,v);return x,y,k.height_at(x,y)+z
    for j in range(24):
        u=(j%8)*9-35;v=(j//8)*11
        art.box(town(u,v,0),(6.2,5,4.9),h,stucco);art.roof(town(u,v,4.9),6.5,5.4,2.0,h,roof)
    for j in range(7):
        a=town(-60+j*18,-22,11.4);b=town(-42+j*18,-22,11.4);beam(art,a,b,1.25,granite)
        art.tube(town(-60+j*18,-22,0),.82,.69,11.4,lichen,granite,7)
    for j,(d,v,w,dep,high) in enumerate(((10733,-26,19,16,13),(10764,-48,23,14,8),(10800,-21,14,12,8))):
        at,h=site(k,d,v);art.box(at(0,0,-1.1),(dep,w,high+1.1),h,stucco)
        frontage(at,w,dep,high,j);art.roof(at(0,0,high),dep+1.6,w+1.3,3.5,h,roof)
    at,h=site(k,10723,41)
    for j in range(48):
        a=j*math.tau/48;b=(j+1)*math.tau/48
        def bank(t,scale,z):return at(scale*(1+.12*math.sin(t*3))*38*math.cos(t),scale*19*math.sin(t),z)
        picture(lake,(bank(a,.002,-.29),bank(b,.002,-.29),bank(b,1,-.29),bank(a,1,-.29)),((0,0),(0,.01),(1,1),(1,0)))
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def e(t,z):return 2300+8200*math.cos(t),8100*math.sin(t),z+1810
        picture(rim,(e(a,-4000),e(b,-4000),e(b,7200),e(a,7200)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.45,'terrain':{'sea':False},'land':{'mid':0x939275},'sky':[0xC8D5DE,0xB7D0E4,0x96BBDD,0x679AC7,0x507FAF],'haze':0xC2D0D9,'light':[0xFFF1D6,1.5],'fill':[0xC8D9EB,0x928775],'sun_altitude':.80,'sun_azimuth':-.92}
