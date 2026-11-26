"""The Strasbourg Christkindelsmärik at blue hour."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 145], [400.0, 143.5174], [1200.0, 144.5843], [1600.0, 143.6778], [2000.0, 144.4992], [2200.0, 144.4779], [2600.0, 145.2993], [2800.0, 145.2781], [3600.0, 143.4649], [4200.0, 144.6971], [4600.0, 144.6545], [4850.0, 145.7079], [5650.0, 143.8948], [5900.0, 144.9482], [6300.0, 144.9057], [6900.0, 146.1378], [7700.0, 144.3247], [7950.0, 145.3781], [8150.0, 145.7888], [8550.0, 145.7462], [8950.0, 146.5677], [9750.0, 146.4826], [10150.0, 145.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):return .31*math.sin(d/377)+.21*math.sin(d/117)+.11*math.cos(d/64)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    path=bc.Builder('MarketSetts','terrain');path.colours=[];path.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];w=3.6+max(0,1-abs(d-1900)/155)*7+max(0,1-abs(d-7240)/187)*11
        picture(path,(r.at(i,-w,.04),r.at(i+1,-w,.04),r.at(i+1,w,.04),r.at(i,w,.04)),((0,d/4),(0,r.s[i+1]['d']/4),(1,r.s[i+1]['d']/4),(1,d/4)))
    path.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('GrandIle','terrain');m.colours=[];last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[r.at(i,v,-4.9 if 9500<d<10150 and v>5 else -.12) for v in (-720,-25,0,5,9,29,54,90,720)]
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                m.quad(a,e,c,b);m.colours.extend((lin(0x504A55),)*4)
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.12

def scenery(k):
    art=Painted(k);fronts=pictured(k,'AlsaceFronts');chalets=pictured(k,'AlsaceChalets');cathedral=pictured(k,'CathedralStone');fir=pictured(k,'KleberFir');water=pictured(k,'IllWater')
    brown,slate,iron,gold,red,cream,blue,stone,wood=map(lin,(0x694942,0x343642,0x3A3841,0xFFE2A1,0xA64741,0xCABDAC,0x687FCC,0x9E816F,0x916344))
    def wall(mesh,at,offset,w,z0,z1,i,cols):
        u=i/cols;v=(i+1)/cols
        picture(mesh,[at(x,offset,z) for x,z in ((-w/2,z0),(w/2,z0),(w/2,z1),(-w/2,z1))],((u+.0005,0),(v-.0005,0),(v-.0005,1),(u+.0005,1)))
    for j,d in enumerate(range(-42,10212,12)):
        canal=9510<d<10145;square=max(0,1-abs(d-7240)/155)*11+max(0,1-abs(d-1900)/145)*7
        for side in (-1,1):
            if canal and side==1:continue
            if side==1 and 1890<d<2010:continue
            dep=6.0;v=side*(8.0+square+dep/2);at,h=site(k,d,v);ht=9.5+((j+side)*7%5)
            art.box(at(0,0,.1),(11.89,dep,ht),h,brown);art.roof(at(0,0,ht+.10),11.93,dep,3.2,h,slate)
            wall(fronts,at,-side*(dep/2+.035),11.94,.08,ht+.12,(j*7+side)%4,4)
            if j%4==0:
                art.tube(at(0,-side*(dep/2+1.6),.12),.071,.055,3.55,iron,iron,7)
                art.tube(at(0,-side*(dep/2+1.6),3.65),.20,.27,.54,gold,gold,6,cap=iron)
        if j%3==0 and not canal and square<4:
            at,h=site(k,d)
            def light(v):return at(0,v,5.95+.024*v*v)
            for v in range(-7,7):
                beam(art,light(v),light(v+1),.027,iron)
                for n in (0,.48):art.tube(light(v+n),.051,.047,.13,gold,gold,5,cap=gold)
            for c in (-3.2,0,3.2):
                pts=[]
                for n in range(10):
                    a=n*math.pi/5+math.pi/2;r=.62 if n%2==0 else .24
                    pts.append(at(0,c+r*math.cos(a),5.63+r*math.sin(a)))
                for a,b in zip(pts,pts[1:]+pts[:1]):beam(art,a,b,.055,blue if 5050<d<5550 else gold)
        if 3360<d<3860 or 7110<d<7360 or j%13==0 and d<9000:
            side=1 if j%2==0 else -1;v=side*(5.55+square);at,h=site(k,d,v)
            art.box(at(0,0,.10),(5.15,2.85,2.45),h,wood);art.roof(at(0,0,2.5),5.6,3.5,.99,h,brown)
            wall(chalets,at,-side*1.45,5.14,.13,2.57,j%4,4)
            for a in (-2.55,2.55):art.tube(at(a,-side*1.45,.1),.085,.077,2.51,brown,wood,6)
            for a in range(-2,3):art.tube(at(a,-side*1.65,2.55),.059,.055,.11,gold,gold,5)
    # The west front stands across the square, its nave rising behind the portal screen.
    at,h=site(k,1961,25)
    art.box(at(12,0,0),(81,31,28),h,stone);art.roof(at(12,0,28),81,31,10,h,slate)
    picture(cathedral,[at(-30,v,z) for v,z in ((-24,.2),(24,.2),(24,93),(-24,93))],((0,0),(1,0),(1,1),(0,1)))
    at,h=site(k,7252,-10.3)
    art.tube(at(0,0,0),2.4,2.35,.49,wood,wood,14,cap=wood)
    for a in (.12,1.68):
        dx=7.8*math.cos(a);dy=7.8*math.sin(a)
        picture(fir,[at(x,y,z) for x,y,z in ((-dx,-dy,.4),(dx,dy,.4),(dx,dy,27),(-dx,-dy,27))],((0,0),(1,0),(1,1),(0,1)))
    for d in range(9510,10146,8):
        at,h=site(k,d)
        picture(water,[at(x,v,-3.0) for x,v in ((-4.4,6),(4.4,6),(4.4,72),(-4.4,72))],((0,0),(1,0),(1,1),(0,1)))
        art.box(at(0,5.12,-3.3),(8.25,.81,4.20),h,stone)
    for d,v in ((9908,15),(9908,53),(10054,40)):
        at,h=site(k,d,v);art.box(at(0,0,-3.45),(8.4,8.4,16),h,stone);art.roof(at(0,0,12.57),8.4,8.4,6.1,h,slate)
        for u in (-2.3,2.3):art.box(at(u,-4.26,7.9),(.86,.17,2.03),h,iron)
    at,h=site(k,9908,34);art.box(at(0,0,.10),(7.4,60,1.2),h,stone)
    for u in (-3.4,3.4):art.box(at(u,0,1.3),(.40,60,.79),h,stone)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.6,'terrain':{'sea':False},'land':{'mid':0x534B58},'sky':[0x555775,0x333E65,0x23345A,0x1D2C50,0x15223F],'haze':0x555575,'light':[0xFFE1A5,1.13],'fill':[0xB2C1E0,0x807183],'sun_altitude':.21,'sun_azimuth':-.95}
