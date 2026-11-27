"""Nevada and California shore highway around Lake Tahoe."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 1896], [2000.0, 1872.6911], [3000.0, 1888.9367], [3450.0, 1892.0622], [4450.0, 1908.3078], [4650.0, 1904.1169], [5150.0, 1912.2397], [6050.0, 1918.4907], [6550.0, 1926.6135], [8550.0, 1884.7046], [13050.0, 1915.9597], [13850.0, 1899.1961], [16100.0, 1914.8237], [16350.0, 1920.4351], [16550.0, 1916.2442], [16800.0, 1921.8556], [17000.0, 1917.6647], [17900.0, 1923.9157], [18150.0, 1929.5271], [19750.0, 1896.0]]

def stage_height(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def elevation(d):
    # The highway stays close to water at Sand Harbor, Zephyr Cove and Tahoe City.
    # Its rollers follow the class grade and climb to the Emerald Bay overlook.
    cove=max(math.exp(-((d-centre)/550)**2) for centre in (3820,7180,15630))
    overlook=26*math.exp(-((d-11240)/900)**2)
    class_grade=.24*(stage_height(d)-1872)
    roller=4.58906*(1+math.sin(d/298))+.9*(1+math.sin(d/137))
    return 1874.8+(class_grade+roller)*(1-cove)+overlook

def heading(d):return .30*math.sin(d/670)+.17*math.sin(d/254)+.10*math.sin(d/116)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

LAKE=1870

def shore(d):
    base=80+17*math.sin(d/135)+28*math.cos(d/390)
    cove=max(math.exp(-((d-c)/230)**2) for c in (3860,7215,15670))
    return base*(1-cove)+24*cove

def ground(d,v):
    z=elevation(d)
    if v<0:return z-.32+max(0,-v-8)*(.29+.11*math.sin(d/126))+.48*math.sin(v*.33)*min(1,max(0,(-v-7)/6))
    if v<7:return z-.32
    f=min(1,max(0,(v-7)/(shore(d)-7)))
    return z-.32+(LAKE-z-2)*f**.82-max(0,v-shore(d))*.14

def road(r,st,length,col,bc):
    m=bc.Builder('ShoreHighway','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        picture(m,[r.at(j,v,.045) for j,v in ((i,-4.65),(i+1,-4.65),(i+1,4.65),(i,4.65))],((0,0),(0,1),(1,1),(1,0)))
    m.build(col)

def land(r,col,theme,bc):
    bed=bc.Builder('TahoeVerge','terrain');water=bc.Builder('TahoeWater','terrain')
    for m in (bed,water):m.colours=[];m.uvs=[]
    last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];s=shore(d);row=[]
        for v in (-240,-42,-10,-5,0,5,8,s*.55,s*.83,s,s+12,s+42):
            x,y,_=r.at(i,v);row.append((x,y,ground(d,v)))
        # The distant water extends in a fixed world direction, so bends never fold the lake over the road.
        wet=[]
        for v in (s*.82,s,s+12,s+42):
            x,y,_=r.at(i,v);wet.append((x,y,LAKE))
        wet.append((wet[-1][0],5000,LAKE))
        if last:
            for j in range(len(row)-1):
                pts=(last[0][j],row[j],row[j+1],last[0][j+1]);picture(bed,pts,[(x/12,y/12) for x,y,z in pts])
            levels=(0,.07,.28,.92,1)
            for j in range(4):
                pts=(last[1][j],wet[j],wet[j+1],last[1][j+1]);picture(water,pts,[(levels[j],0),(levels[j],1),(levels[j+1],1),(levels[j+1],0)])
        last=row,wet
    water.build(col);return bed.build(col),lambda x,y:ground(r.s[r.tree.find((x,y,0))[1]]['d'],0)

def scenery(k):
    blocks=pictured(k,'ShoreGranite');art=Painted(k);pines=pictured(k,'TahoePines');rim=pictured(k,'SierraRim');lodge=pictured(k,'MarinaLodge');sign=pictured(k,'CurveWarning')
    wood,steel,gold,white,stone,bark=map(lin,(0x79634E,0x858A87,0xE8BB46,0xDAD7C8,0xABA79B,0x76553E))
    def pine(x,y,z,w,h,variant):
        u=variant*.25
        for a in (.25,1.82):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
            picture(pines,[(x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)],((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
    def boulder(x,y,z,w,h,dep):
        phase=k.rng.random()*6.28;last=None
        for ring,rise in ((.52,-.69),(.86,-.36),(.96,-.12),(1,.15),(.93,.39),(.76,.65),(.55,.81),(.31,.92),(.03,1)):
            pts=[]
            for j in range(13):
                a=j*math.tau/13+phase;noise=1+.08*math.sin(3*a+phase)
                pts.append((x+ring*w*noise*math.cos(a),y+ring*dep*noise*math.sin(a),z+h*(rise+.05*math.sin(2*a))))
            if last:
                for j in range(13):
                    l=(j+1)%13;corners=(last[j],last[l],pts[l],pts[j]);picture(blocks,corners,[((a+.34*b)/2.4,(c+.29*b)/2.4) for a,b,c in corners])
            last=pts
    for j,d in enumerate(range(-35,19800,8)):
        at,h=site(k,d)
        for v in (-4.24,-.12,.12,4.24):
            pts=[k.road.pos(d+u,v+side,.062) for u,side in ((-4,-.065),(4,-.065),(4,.065),(-4,.065))]
            art.face(pts,((gold if abs(v)<1 else white),)*4)
        if j%2==0 and (math.sin(d/144)>.22 or min(abs(d-i) for i in [120,11240,19380])<90):
            art.box(at(0,5.27,.02),(.19,.2,.82),h,wood)
            beam(art,at(-8.1,5.22,.71),at(8.1,5.22,.71),.12,steel)
        if j%27==0:
            art.box(at(0,5.85,.02),(.115,.12,2.55),h,steel)
            picture(sign,[at(-.03,v,z) for v,z in ((5.23,1.78),(6.49,1.78),(6.49,3.05),(5.23,3.05))],((0,0),(1,0),(1,1),(0,1)))
        for side in (-1,1):
            # Leave windows through the downhill forest at each cove.
            v=k.rng.uniform(8,39)*side
            if side==1 and (j%4 or min(abs(d-i) for i in [120,3820,7180,11240,15630])<115):continue
            x,y,_=at(k.rng.uniform(-6,6),v);ht=k.rng.uniform(12,28);pine(x,y,ground(d,v),ht*.36,ht,j%4)
        if j%2==0:
            v=shore(d)+k.rng.uniform(-11,14);x,y,_=at(0,v);r=k.rng.uniform(.8,3.9);boulder(x,y,ground(d,v)+r*.28,r,r*.86,r*.78)
    for centre in (3870,3910,7310):
        for j in range(65):
            d=centre+k.rng.uniform(-40,40);v=shore(d)+k.rng.uniform(-6,64)
            x,y,_=k.road.pos(d,v);rad=k.rng.uniform(1.1,4.5);boulder(x,y,LAKE+k.rng.uniform(-1.2,.8),rad,.76*rad,rad*.84)
    at,h=site(k,11345,235)
    x,y,_=at(0,0);boulder(x,y,LAKE,49,14,33)
    for i in range(60):
        a=k.rng.uniform(0,math.tau);r=k.rng.uniform(.24,.88);pine(x+44*r*math.cos(a),y+29*r*math.sin(a),LAKE+13*(1-r)+2,8,18,i%4)
    art.box((x+1,y,LAKE+12),(6,4,4),h,stone);art.roof((x+1,y,LAKE+16),6,4,1.5,h,wood)
    for d in (7240,15675):
        s=shore(d);at,h=site(k,d,s+8)
        def dock(u,v,dx,dy):
            x,y,_=at(u,v);art.box((x,y,LAKE+.7),(dx,dy,.32),h,wood)
        dock(0,5,3.8,45)
        for j in range(6):
            u=(j%2*2-1)*7.5;v=j//2*10
            dock(u,v,15,1.56)
            x,y,_=at(u*1.79,v);art.tube((x,y,LAKE-.7),.23,.22,2.6,wood,wood,7,cap=wood)
    at,h=site(k,15697,17)
    z=ground(15697,17)-elevation(15697)
    art.box(at(0,0,z),(35,12,4.7),h,wood);art.roof(at(0,0,z+4.7),35,12,3.7,h,lin(0x435D4D))
    for side in (-1,1):
        picture(lodge,[at(u,side*6.13,z+t) for u,t in ((-18,0),(18,0),(18,8.7),(-18,8.7))],((0,0),(1,0),(1,1),(0,1)))
    for side in (-1,1):
        # Clapboard end walls, sash windows and porch posts meet the illustrated verandah.
        for j in range(22):
            art.box(at(side*17.54,0,z+j*.212),(.13,12.05,.10),h,lin(0x805B43))
        for v in (-3.4,0,3.4):
            art.box(at(side*17.65,v,z+1.25),(.11,2.38,2.2),h,lin(0xB3936C))
            art.box(at(side*17.73,v,z+1.36),(.08,2.15,1.96),h,lin(0x688594))
            art.box(at(side*17.79,v,z+1.35),(.045,.10,1.99),h,wood)
            art.box(at(side*17.79,v,z+2.25),(.045,2.16,.10),h,wood)
    for i in range(96):
        a=i*math.tau/96;b=(i+1)*math.tau/96;u=i%16/16;v=u+1/16
        if i//16%2:u,v=1-u,1-v
        def e(t,z):return 9100+16500*math.cos(t),14800*math.sin(t),z
        picture(rim,(e(a,LAKE-125),e(b,LAKE-125),e(b,LAKE+6400),e(a,LAKE+6400)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.65,'terrain':{'sea':False},'land':{'mid':0x8E876F},'sky':[0xA5CADF,0x85B7DB,0x629BCC,0x518DD3,0x4279BE],'haze':0xBDD2DB,'light':[0xFFF1D1,1.48],'fill':[0xC1E1ED,0x958677],'sun_altitude':.87,'sun_azimuth':-.69}
