"""Queens Quay waterfront, Martin Goodman Trail and its lakeside parks."""
import math
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin
from arenberg import beam

PROFILE = [[0, 76], [2000.0, 74.574], [2187.5, 74.8528], [2437.5, 74.5746], [2812.5, 74.9072], [3312.5, 74.3507], [3500.0, 74.6295], [3750.0, 74.3512], [6900.0, 77.1453], [7900.0, 76.0323], [8087.5, 76.3111], [8337.5, 76.0328], [11487.5, 78.8269], [11687.5, 78.6043], [11875.0, 78.8831], [13075.0, 77.3075]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # Long gentle changes of bearing follow the finger piers and the edge of each park.
    return .06*math.sin(d/440)+.09*math.sin(d/1130)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;pts=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        pts.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return pts,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def beach(d):
    return max(max(0,1-abs(d-c)/265) for c in (7085,12842))

def shore(d):
    return -12.5-3*math.sin(d/178)-21*beach(d)

def ribbon(r,m,i,left,right,high):
    pts=[]
    for j,edge in ((i,left),(i+1,left),(i+1,right),(i,right)):
        d=r.s[j]['d'];pts.append(r.at(j,edge(d),high))
    picture(m,pts,[(x*.24,y*.24) for x,y,z in pts])

def road(r,st,length,col,bc):
    m=bc.Builder('TrailPaving','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):ribbon(r,m,i,lambda d:-2.8,lambda d:2.8,.06)
    m.build(col)

def land(r,col,theme,bc):
    meshes=[]
    for name in ('QuayGranite','BeachSand','HarbourWater','QuayRoad'):
        m=bc.Builder(name,'terrain');m.colours=[];m.uvs=[];meshes.append(m)
    for i,p in enumerate(r.s[:-1]):
        coast=meshes[1] if beach(p['d'])>.1 else meshes[0]
        ribbon(r,coast,i,shore,lambda d:-2.8,.01)
        ribbon(r,meshes[0],i,lambda d:2.8,lambda d:8,.015)
        ribbon(r,meshes[3],i,lambda d:8,lambda d:29,-.05)
        ribbon(r,meshes[0],i,lambda d:29,lambda d:320,-.08)
        ribbon(r,meshes[2],i,lambda d:-4400,shore,-1.07)
    for m in meshes:m.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']

def scenery(k):
    art=Painted(k);facades=pictured(k,'QuayCondos');trees=pictured(k,'MapleTrees')
    people=pictured(k,'TrailVisitors');sky=pictured(k,'IslandHorizon');planks=pictured(k,'WaveTimber')
    trail=pictured(k,'TrailMarkings');furniture=pictured(k,'BeachFurniture')
    gray,steel,glass,wood,white,rail,iron,red,buff=map(lin,(0xB9B9B1,0x8A9094,0x7098A7,0x9F8468,0xECE9DC,0x858684,0x51636B,0xB35A49,0xC2AB8C))
    def panel(m,pts,idx=0,cols=1):
        u=idx/cols;v=(idx+1)/cols;picture(m,pts,((u+.002,0),(v-.002,0),(v-.002,1),(u+.002,1)))
    def card(m,at,w,h,i):
        panel(m,[at(0,v,z) for v,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],i,4)
    for j,d in enumerate(range(-72,13280,12)):
        at,h=site(k,d)
        for v in (-2.94,2.94):art.box(at(0,v,.01),(11.98,.27,.16),h,gray)
        if j%2==0:art.box(at(0,0,.076),(2.4,.088,.015),h,buff)
        for v in (13.1,14.54,17.1,18.54):
            beam(art,k.road.pos(d-6,v,.03),k.road.pos(d+6,v,.03),.049,rail)
        if j%3==0:
            art.tube(at(0,21,.0),.17,.11,6.6,steel,steel,8)
            beam(art,at(0,21,6.63),at(0,12.34,6.3),.055,iron)
            for v in (13.82,17.82):beam(art,at(-18,v,6.18),at(18,v,6.18),.026,iron)
        if j%9==0:
            panel(trail,[at(x,v,.085) for x,v in ((-1.4,-1.6),(1.4,-1.6),(1.4,-.6),(-1.4,-.6))])
        if j%4==0:
            ht=k.rng.uniform(19,69);w=k.rng.uniform(26,42)
            at,h=site(k,d,42+k.rng.uniform(0,14));art.box(at(0,9,-.07),(w,18,ht),h,gray)
            for v in (-.09,18.1):
                panel(facades,[at(x,v,z) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],j//4%4,4)
            for x in (-w/2-.06,w/2+.06):
                panel(facades,[at(x,v,z) for v,z in ((0,0),(18,0),(18,ht),(0,ht))],j//4%4,4)
        if j%2==0:
            at,h=site(k,d+2,5.9);card(trees,at,k.rng.uniform(6.5,8.8),k.rng.uniform(6,10),j//2%4)
        if j%5==0:
            at,h=site(k,d+6,-5.1);card(people,at,(1.32,2.23,3.42,2.32)[j//5%4],1.8,j//5%4)
        if beach(d)<.06 and not 4750<d<5120:
            at,h=site(k,d,shore(d)+.28)
            for u in (-5.9,0):art.tube(at(u,0,-.03),.068,.058,1.05,iron,steel,7)
            for z in (.49,.96):beam(art,at(-6,0,z),at(6,0,z),.038,steel)
        if beach(d)>.16 and j%2==0:
            for i in range(2):
                at,h=site(k,d+i*5,-8.3-i*6.1-k.rng.uniform(0,5))
                canopy=lin(0xFFC21C if d<10000 else 0xFF71AB)
                art.tube(at(0,0,0),.064,.058,2.95,iron,white,8)
                art.tube(at(0,0,2.58),2.21,.1,.55,canopy,canopy,12,cap=canopy)
                for ang in (-.5,.5):
                    art.box(at(.65,ang,.38),(1.09,.5,.13),h,white)
                    beam(art,at(.09,ang,.38),at(-.27,ang,.93),.19,white)
    for d in (152,2672,4918,7071,7098,9901,12832,12860):
        at,h=site(k,d,-4.7)
        art.box(at(0,0,.48),(2.3,.55,.16),h,wood)
        art.box(at(0,-.34,.82),(2.32,.12,.46),h,wood)
        for u in (-.81,.81):art.box(at(u,0,.03),(.12,.49,.52),h,iron)
    for j,d in enumerate((7062,7073,7082,7095,12820,12837,12852)):
        at,h=site(k,d,-9.4-j%3*2.3)
        foot=lin(0xEEEBDF)
        for side in (-.32,.32):
            beam(art,at(0,side,.12),at(.65,side,.56),.081,foot)
            beam(art,at(.63,side,.51),at(1.31,side,1.06),.09,foot)
        art.box(at(.54,0,.45),(.78,.75,.085),h,foot)
    # Ferry ticket shelter with a blue glazed canopy behind the landing.
    at,h=site(k,9929,-10)
    for u in (-6.5,0,6.5):
        for v in (-2.8,2.8):art.tube(at(u,v,0),.12,.11,3,iron,steel,9)
    art.box(at(0,0,3),(14.6,6.45,.26),h,glass)
    for j,d in enumerate((7012,7038,7066,7078,7096,7123,12789,12807,12831,12852,12871,12897)):
        at,h=site(k,d,-8.4-2*(j%3))
        card(furniture,at,5.3,3.2,0 if d<10000 else 1)
    for j,d in enumerate((155,183,2616,2669,4932,4952,9868,9902,12841)):
        at,h=site(k,d,4.5 if j%2 else -4.9)
        card(furniture,at,3.4 if j%2 else 2.4,1.42 if j%2 else 1.12,3 if j%2 else 2)
    for j in range(540):
        d=4810+j*.42;at,h=site(k,d)
        s=(d-4810)/226;side=shore(d)
        outer=side-1.8-5.1*math.sin(math.pi*s)**2
        def deck(x,v):
            f=(v+3.35)/(outer+3.35);lift=.17+max(0,f)**1.6*(.4+2.15*math.sin(s*math.pi*2)**2)
            return at(x,v,lift)
        for v,w in ((-3.35,(outer-3.35)/2),((outer-3.35)/2,outer)):
            picture(planks,[deck(u,n) for u,n in ((-.19,v),(.19,v),(.19,w),(-.19,w))],((0,0),(1,0),(1,1),(0,1)))
        if j%9==0:
            a=deck(0,outer);art.tube(a,.057,.05,1.13,steel,steel,7)
            beam(art,(a[0],a[1],a[2]+1.12),deck(3.78,outer)[:2]+(a[2]+1.12,),.052,steel)
    # Ferry berth and mooring dolphins in front of the Jack Layton terminal.
    for d in (9875,9925):
        at,h=site(k,d,shore(d))
        art.box(at(0,-8,-.6),(5.3,22,.75),h,wood)
        for v in (-3,-12,-18.5):
            for u in (-3.3,3.3):art.tube(at(u,v,-1.18),.43,.37,2.4,iron,white,9,cap=white)
    for j in range(80):
        a=j*math.tau/80;b=(j+1)*math.tau/80;u=(j%20)/20;v=u+1/20
        if j//20%2:u,v=1-u,1-v
        def e(t,z):return 6300+16100*math.cos(t),13000*math.sin(t),z+76
        picture(sky,(e(a,-2450),e(b,-2450),e(b,10900),e(a,10900)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.8,'terrain':{'sea':False},'land':{'mid':0xABAC9C},'sky':[0xB6D3E3,0xACD0E8,0x81B9E1,0x5695CA,0x427EB7],'haze':0xBED5DF,'light':[0xFFF3DB,1.53],'fill':[0xBDD8EC,0x918D75],'sun_altitude':.86,'sun_azimuth':-.83}
