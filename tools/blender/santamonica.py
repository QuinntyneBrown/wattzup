"""The Marvin Braude beach path and Santa Monica's Pacific Park pleasure pier."""
import math

from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin, smooth

PROFILE = ((0,3.7),(500,4.1),(970,3.4),(1450,3.8),(1860,4.2),(2430,3.5),
           (2770,3.2),(3210,2.8),(3790,3.6),(4350,4.4),(5060,5.2),(5750,4.3),
           (6410,3.7),(7190,4.1),(7850,3.4),(8490,3.1),(8800,3.2),(8850,3.2))


def elevation(d):
    for (a,z),(b,w) in zip(PROFILE,PROFILE[1:]):
        if d<=b:
            return z+(w-z)*smooth(a,b,d)
    return PROFILE[-1][1]


def heading(d):
    return .19*math.sin(d/132)+.12*math.sin(d/251)+.34*math.exp(-((d-3220)/85)**2)


def route(course,theme,bc):
    stages=bc.stages(course['plan']); length=stages[-1]['to']
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;z=elevation(d);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+1)-z)))
        mid=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def road(r,st,length,col,bc):
    b=bc.Builder('BraudeConcrete','terrain');b.colours=[]
    for i in range(len(r.s)-1):
        d=r.s[i]['d']
        def band(a,v,z,tint):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,v,z),r.at(i,v,z));b.colours.extend([lin(tint)]*4)
        band(-2.38,2.38,.08,0xC8BFB1 if int(d//13)%3 else 0xBEB8AD)
        if int(d//4)%2==0:band(-.065,.065,.093,0xE9B742)
        if i%3==0:
            p=[r.at(i,v,.086) for v in (-2.38,2.38)]
            b.quad(p[0],(p[0][0]+.035,*p[0][1:]),(p[1][0]+.035,*p[1][1:]),p[1]);b.colours.extend([lin(0x97958A)]*4)
    b.build(col)


def shore(d):
    return 41+11*math.sin(d/277)-18*math.exp(-((d-3260)/145)**2)


def land(r,col,theme,bc):
    b=bc.Builder('BeachAndBluff','terrain');b.colours=[]
    def ground(d,v):
        if v>0:return elevation(d)-.14-(elevation(d)-.38)*smooth(3,shore(d),v)-1.8*smooth(shore(d),shore(d)+26,v)
        return elevation(d)-.14+12.5*smooth(59,110,-v)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));s=r.s[i];v=(y-s['y'])*math.cos(s['h'])-(x-s['x'])*math.sin(s['h'])
        return ground(s['d'],v)
    previous=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];w=shore(d);row=[]
        for v,c in ((-420,0xA49D83),(-105,0xA99977),(-83,0xB59774),(-60,0xD3B891),(-42,0xD7BC91),(-12,0xE3C99E),(-3,0xDDC399),(3,0xE0C395),(w*.69,0xE6C899),(w*.86,0xD5B486),(w,0xB39F87),(w+12,0xA19D90),(w+55,0x8F9F9B)):
            x,y,_=r.at(i,v);row.append(((x,y,ground(d,v)),lin(c)))
        if previous:
            for j in range(len(row)-1):
                corners=(previous[j],row[j],row[j+1],previous[j+1]);b.quad(*(p for p,c in corners));b.colours.extend(c for p,c in corners)
        previous=row
    return b.build(col),height


def scenery(k):
    art=Painted(k);pier=Painted(k,'peaks');foam=pictured(k,'PacificFoam')
    palms=[pictured(k,name) for name in ('FanPalm','LeaningPalm','PairedPalms')]
    golden=lin(0xD6AE6F);wood=lin(0x715340);white=lin(0xE7DDD1)
    def panel(mesh,pts):
        picture(mesh,pts,((0,0),(1,0),(1,1),(0,1)))
    for d in range(-32,8960,19):
        for side in (-1,1):
            if side>0 and k.rng.random()<.87:continue
            v=side*k.rng.uniform(7,29);at,_=site(k,d,v);z=k.height_at(*at(0,0)[:2])-at(0,0)[2]
            tall=k.rng.uniform(9,19);j=k.rng.randrange(3);wide=tall*(.37 if j<2 else .62)
            panel(palms[j],[at(.32*u,u,z+h) for u,h in ((-wide/2,0),(wide/2,0),(wide/2,tall),(-wide/2,tall))])
            shadow=lin(0xB69D7D)
            art.face([at(u,vv,z+.025) for u,vv in ((-.2,-.2),(1,-6),(3,-12),(1.7,-12),(-.23,-1))],(shadow,)*5)
    for d in range(22,8950,68):
        at,h=site(k,d,-k.rng.uniform(38,68));w=k.rng.uniform(10,24);t=k.rng.uniform(4,13)
        art.box(at(0,0,0),(w,10,t),h,lin(k.rng.choice((0xD1B594,0xDBB9A2,0xE2CCB6,0xB7B7AE))))
        art.box(at(0,0,t),(w+1,11,.42),h,white)
        for j in range(int(w//3)):
            for z in range(2,int(t),3):
                art.box(at(-w/2+2+3*j,5.1,z),(1.6,.12,1.4),h,lin(0x7E9498))
    for d in (132,630,1210,1882,2500,3268,4120,5104,6200,7430,8360):
        at,h=site(k,d,12);aqua=lin(0x78BABC)
        for u in (-2,2):
            for v in (-1.25,1.25):art.box(at(u,v,-.9),(.2,.2,2.9),h,wood)
        art.box(at(0,0,1.95),(5.6,4.3,.22),h,white)
        art.box(at(0,0,2.17),(4.45,3.1,1.57),h,aqua)
        art.box(at(0,0,3.74),(4.4,3.07,.87),h,lin(0x547D89))
        for u in (-2.16,-.71,.71,2.16):
            for v in (-1.55,1.55):art.box(at(u,v,3.74),(.13,.12,.9),h,white)
        art.roof(at(0,0,4.6),4.85,3.5,.59,h,lin(0x8F989A))
        for v in (-1.2,.1):
            beam(art,at(-2.7,v,1.96),at(-9.8,v,-.18),.12,wood)
            beam(art,at(-2.7,v,2.95),at(-9.8,v,.81),.08,white)
        for j in range(27):
            f=j/26;art.box(at(-2.7-7.1*f,-.55,1.96-2.14*f),(.28,1.46,.11),h,wood)
    for d in range(-40,8930,9):
        for j in range(3):
            v=shore(d)+j*8+3*math.sin(d/29+j*1.3);q,_=site(k,d,v)
            pts=[q(u,vv,-elevation(d)+.53+j*.035) for u,vv in ((0,0),(9,1.1),(9,2.0),(4,1.9),(0,.8))]
            art.face(pts,(lin(0xD3DBCB),)*5)
    at,h=site(k,8830);deck=6.7
    pier.box(at(0,93,deck),(22,270,.7),h,lin(0xBB9571))
    for v in range(-38,228,6):
        for u in (-9,0,9):
            pier.tube(at(u,v,-6),.43,.37,deck+6,wood,wood,8)
            beam(pier,at(u,v,-2),at(u,v+6,deck),.21,wood)
        for u in (-10.9,10.9):
            pier.box(at(u,v,deck+.7),(.14,.17,1.22),h,white)
            beam(pier,at(u,v,deck+1.85),at(u,v+6,deck+1.85),.085,white)
    for v in range(-41,229):
        pier.box(at(0,v,deck+.70),(21.8,.044,.035),h,wood)
    pier.box(at(-18,87,deck),(50,80,.68),h,lin(0xBB9571))
    centre=at(-21,91,deck+21);radius=16.
    for u in (-27,-15):
        for v in (79,103):beam(pier,at(u,v,deck+.7),centre,.68,lin(0xE3D3AF))
    track=[]
    for i in range(121):
        a=i*math.tau/120
        pt=at(-18+19*math.sin(a),87+36*math.cos(a),deck+6+2.8*math.sin(2*a)+1.2*math.sin(3*a))
        track.append(pt)
        if i:
            for off in (-.54,.54):
                beam(pier,(track[-2][0]+off,*track[-2][1:]),(pt[0]+off,*pt[1:]),.2,lin(0xBF6247))
        if i%4==0:beam(pier,(pt[0],pt[1],at(0,0,deck)[2]),pt,.26,golden)
    for v in (-8,8):pier.box(at(-.5,v,deck+.7),(.32,.34,6.0),h,lin(0x668A9C))
    panel(pictured(k,'HarborSign'),[at(-.7,v,deck+z) for v,z in ((-8,5.7),(8,5.7),(8,13.7),(-8,13.7))])
    pier.box(at(-13,-3,0),(.17,.17,3),h,wood)
    panel(pictured(k,'TrailShield'),[at(-13.14,v,z) for v,z in ((-3.8,1.5),(-2.2,1.5),(-2.2,3.5),(-3.8,3.5))])
    def three(p):return [round(p[0],3),round(p[2],3),round(-p[1],3)]
    return {'efforts':0,'pacificPark':{'wheelCentre':three(centre),'wheelRadius':radius,'track':[three(p) for p in track]}}


THEME={'lay':route,'road_builder':road,'land_builder':land,'terrain':{'sea':True},
       'land':{'mid':0xDBC099},'haze':0xE3C8AA,'sky':[0xE6B999,0xEBD4B8,0xBFD4D8,0x93BBCE,0x6CA2C0],
       'light':[0xFFE1AD,1.6],'fill':[0xD7E0DC,0xBEA58C],'sun_altitude':.18,'sun_azimuth':1.08,
       'palette':{'asphalt':0xBFB7AA,'paint':0xEEE5D8,'yellow':0xDAB249}}
