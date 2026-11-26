"""The Troll's Ladder from Isterdalen past Stigfossen to the summit platform."""
import math
from bisect import bisect_left
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted,lin

PROFILE = [[0, 50.0], [400.0, 62.7883], [800.0, 82.4395], [1200.0, 111.2413], [1600.0, 142.3308], [2000.0, 155.1191], [3200.0, 241.5245], [4000.0, 312.8539], [4400.0, 325.6422], [5600.0, 412.0476], [6400.0, 483.3771], [6800.0, 496.1654], [8000.0, 582.5708], [8800.0, 653.9002], [9200.0, 666.6885], [10400.0, 753.0939], [11200.0, 824.4234], [12000.0, 850.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # Eleven reversals; long traverses between compact steering arcs.
    rack=max(0,min(1,(d-520)/420,(11380-d)/570))
    return .08*math.sin(d/230)+rack*1.41*math.tanh(9*math.sin((d-1320)*math.pi/920))

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    asphalt=bc.Builder('RaumaAsphalt','terrain');asphalt.colours=[];asphalt.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,za,zb in ((-2.9,0,.04,.09),(0,2.9,.09,.04)):
            verts=[r.at(i,a,za),r.at(i+1,a,za),r.at(i+1,b,zb),r.at(i,b,zb)]
            picture(asphalt,verts,[(a,p['d']*.19),(a,r.s[i+1]['d']*.19),(b,r.s[i+1]['d']*.19),(b,p['d']*.19)])
    asphalt.build(col)

def land(r,col,theme,bc):
    turf=bc.Builder('RaumaSlope','terrain');turf.colours=[];turf.uvs=[]
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s]
    bx,by,bz=r.pos(5060);bh=heading(5060)
    def height(x,y):
        j=max(1,min(len(xs)-1,bisect_left(xs,x)));a,b=r.s[j-1:j+1]
        base=a['z']+(b['z']-a['z'])*(x-a['x'])/max(.01,b['x']-a['x'])
        _,idx,dist=r.tree.find((x,y,0));p=r.s[idx]
        cliff=max(0,abs(y+300)-700)*1.28
        fold=math.sin(x*.021+y*.006)*math.cos(y*.023)+.38*math.sin(y*.087+x*.019)
        raw=base+cliff+min(31,dist*.28)*fold
        shoulder=max(0,min(1,(dist-5)/26))
        z=p['z']-.88+(raw-p['z'])*shoulder
        u=(x-bx)*math.cos(bh)+(y-by)*math.sin(bh)
        v=(x-bx)*math.sin(bh)-(y-by)*math.cos(bh)
        if abs(u)<145 and -65<v<270:
            # The gorge passes under the road; a granite escarpment carries the falls.
            ridge=max(0,v-20)*1.31
            notch=max(0,1-abs(u)/15)
            blend=min(1,(145-abs(u))/50,(270-v)/55,(v+65)/25)
            z+=(bz+ridge-8*notch-z)*max(0,blend)*min(1,max(0,(dist-5)/14))
        return z
    last=None
    for x in range(int(min(xs))-310,int(max(xs))+380,10):
        row=[(x,y,height(x,y)) for y in range(int(min(ys))-390,int(max(ys))+396,10)]
        if last:
            for a,b,c,d in zip(last,last[1:],row[1:],row):
                verts=(a,d,c,b);picture(turf,verts,[(x*.11,y*.11) for x,y,_ in verts])
        last=row
    return turf.build(col),height

def scenery(k):
    art=Painted(k);wall=pictured(k,'RaumaGranite');sky=pictured(k,'RaumaPeaks');falls=pictured(k,'Stigfossen');visitors=pictured(k,'RaumaVisitors')
    granite,shadow,rust,metal,glass,snow,foam=map(lin,(0x73797a,0x414b50,0x8c4831,0x4d5458,0x78949c,0xe7e9e5,0xb8d8de))
    def stone(pts):
        w=math.dist(pts[0],pts[1])/3;h=math.dist(pts[1],pts[2])/3
        picture(wall,pts,((0,0),(w,0),(w,h),(0,h)))
    # Individual parapet blocks vary in length and cap height on the exposed edge.
    for j,d in enumerate(range(-45,12090,4)):
        at,h=site(k,d);s=1 if math.sin(h)>0 else -1
        outer=s*3.36;inner=s*2.98;top=.55+.09*math.sin(j*13)
        for v in (outer,inner):
            stone([at(x,v,z) for x,z in ((-1.92,-.4),(1.92,-.4),(1.92,top),(-1.92,top))])
        stone([at(x,v,top) for x,v in ((-1.92,inner),(1.92,inner),(1.92,outer),(-1.92,outer))])
        if j%9==0:
            p=at(0,-s*3.22,-.18);art.tube(p,.075,.07,1.18,shadow,metal,5)
        if j%22==0 and 1200<d<11200:
            v=-s*k.rng.uniform(10,20);x,y,_=at(0,v);z=k.height_at(x,y)
            art.tube((x,y,z-.6),2.9,1.7,3.4,shadow,granite,6,cap=granite)
    # Several water sheets follow a single cliff face; the bridge crosses its lower channel.
    at,h=site(k,5060,0)
    for a,b,za,zb,wa,wb in ((258,172,312,198,11,21),(172,86,198,85,21,15),(86,20,85,-2,15,10),(20,-20,-2,-7,10,14)):
        picture(falls,[at(u,-v,z) for u,v,z in ((-wb/2,b,zb),(wb/2,b,zb),(wa/2,a,za),(-wa/2,a,za))],((0,0),(1,0),(1,1),(0,1)))
        for s in (-1,1):
            stone([at(u,-v,z) for u,v,z in ((s*(wb/2+.2),b+.3,zb),(s*(wb/2+72),b+13,zb),(s*(wa/2+81),a+15,za),(s*(wa/2+.2),a+.3,za))])
    for j in range(18):
        a=j*math.pi/18;b=(j+1)*math.pi/18
        def arch(t,r,v):return at(r*math.cos(t),v,-6+r*math.sin(t))
        for v in (-3.3,3.3):
            stone([arch(a,5.2,v),arch(b,5.2,v),at(6.8*math.cos(b),v,.03),at(6.8*math.cos(a),v,.03)])
        stone([arch(a,5.2,-3.3),arch(b,5.2,-3.3),arch(b,5.2,3.3),arch(a,5.2,3.3)])
    # Snow follows high rock shelves, with a tapered, uneven melt edge.
    for j in range(45):
        d=8800+j*68;s=(-1 if j%2 else 1);at,h=site(k,d,s*(42+(j*17)%81))
        pts=[]
        for u,v in ((-13,0),(-5,-3),(11,-2),(16,1),(6,3),(-7,2)):
            x,y,_=at(u,v);pts.append((x,y,k.height_at(x,y)+.6))
        for n in range(1,len(pts)-1):art.face((pts[0],pts[n],pts[n+1]),(snow,)*3)
    at,h=site(k,11816,-23)
    for j in range(16):
        v=-j*1.6
        art.box(at(0,v,1.5),(5.1,1.64,.4),h,rust)
        for s in (-1,1):
            art.box(at(s*2.48,v,1.86),(.12,1.7,1.16),h,rust)
            beam(art,at(s*2.45,v,3.03),at(s*2.45,v-1.6,3.03),.08,metal)
    for j in range(5):
        v=-j*5
        for u in (-1.9,1.9):
            x,y,_=at(u,v);ground=k.height_at(x,y)
            beam(art,(x,y,min(ground,-1+at(0,0)[2])),at(u,v,1.5),.32,metal)
            beam(art,at(u,v,-1.3),at(u,v-4.8,1.48),.21,rust)
    for j in range(3):
        v=-6-j*7
        picture(visitors,[at(u,v,z) for u,z in ((-1.8,1.9),(1.8,1.9),(1.8,3.9),(-1.8,3.9))],((j/3,0),((j+1)/3,0),((j+1)/3,1),(j/3,1)))
    art.box(at(15,-5,-.8),(15,11,5.6),h,glass)
    art.roof(at(15,-5,4.8),16,12,2.5,h,metal)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%24/24;v=u+1/24
        if j//24%2:u,v=1-u,1-v
        def rim(t,z):return 1850+7900*math.cos(t),7900*math.sin(t),z+480
        picture(sky,(rim(a,-5500),rim(b,-5500),rim(b,4700),rim(a,4700)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.9,'terrain':{'sea':False},'land':{'mid':0x65745c},'sky':[0xbcc8ce,0xa8bac3,0x8c9da7,0x7d929f,0x637987],'haze':0xb6c1c5,'light':[0xe8ece6,1.24],'fill':[0xcdd9df,0x869289],'sun_altitude':.66,'sun_azimuth':-.79}
