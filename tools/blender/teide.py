"""TF-21 and TF-24 through the Las Cañadas caldera."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 2010], [1350.0, 2029.575], [2250.0, 2050.455], [2700.0, 2071.335], [4950.0, 2156.16], [6300.0, 2175.735], [8550.0, 2260.56], [9900.0, 2280.135], [12150.0, 2364.96], [13500.0, 2384.535]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):return .31*math.sin(d/421)+.22*math.sin(d/210)+.102*math.sin(d/91)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    edge=max(0,abs(v)-5.3);z=elevation(d)-.23;cliff=max(0,1-abs(d-2780)/1300)
    slope=(-.43*cliff-.052 if v>0 else .098+.12*math.sin(d/600))
    return z+edge*slope+min(1,edge/15)*(1.2+edge*.05)*math.sin(d/29+v*.072)*math.cos(d/45-v*.055)

def road(r,st,length,col,bc):
    m=bc.Builder('CalderaRoad','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        picture(m,[r.at(j,v,.04) for j,v in ((i,-4.25),(i+1,-4.25),(i+1,4.25),(i,4.25))],((0,0),(0,1),(1,1),(1,0)))
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('Malpais','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[]
        for v in (-520,-210,-75,-28,-8,-4.5,0,4.5,8,24,67,210,490):
            x,y,_=r.at(i,v);row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/8,y/8) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.25

def scenery(k):
    tide=pictured(k,'TradeHorizon');drum=pictured(k,'IzanaDrum');flow=pictured(k,'FrozenLava');art=Painted(k);plants=pictured(k,'CanaryPlants');rim=pictured(k,'PicoTeide');flowers=pictured(k,'Tajinaste');cloud=pictured(k,'CloudSea');roques=pictured(k,'RoqueTuff')
    basalt,rust,pumice,ochre,white,steel,black,cream,green=map(lin,(0x514942,0xA65943,0xC5AE8B,0xA08160,0xECEAE1,0x7D8083,0x33363B,0xC5BAA1,0x7B775B))
    def plant(x,y,z,w,h,idx,a):
        u=idx*.25
        for t in (a,a+1.52):
            dx=w*.5*math.cos(t);dy=w*.5*math.sin(t)
            picture(plants if idx<2 else flowers,[(x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)],((u+.002,0),(u+.248,0),(u+.248,1),(u+.002,1)))
    for j,d in enumerate(range(-40,13560,9)):
        at,h=site(k,d)
        for v in (-4,-.02,4):
            end=4.5 if abs(v)>1 else .34
            pts=[k.road.pos(d+u,v+t,.062) for u,t in ((-4.5,-.068),(end,-.068),(end,.068),(-4.5,.068))]
            art.face(pts,(white,)*4)
        if (j%5<4 and 1800<d<3500 or j%9<4 and 6600<d<7200):
            for n in range(4):
                art.box(at(n*2.23-3.3,5.08,.02),(2.18,.62,.56+.12*(n%2)),h,basalt)
        for side in (-1,1):
            v=side*k.rng.uniform(7.2,36);x,y,_=at(0,v);z=ground(d,v)
            if d<1700:
                ht=k.rng.uniform(10,23);plant(x,y,z,.48*ht,ht,j%2,j*.51)
            elif j%2==0:
                ht=k.rng.uniform(.74,1.7);plant(x,y,z,ht*1.45,ht,3,j*.51)
            if j%4==0 and d>3400:
                v=side*k.rng.uniform(5.6,11);x,y,_=at(0,v);ht=k.rng.uniform(1.6,2.9);plant(x,y,ground(d,v),ht*.45,ht,2,j*.48)
        if 4900<d<5630:
            # Interleaved pumice, scoria and basalt in the La Tarta road cutting.
            for n,c in enumerate((basalt,rust,pumice,basalt,ochre,pumice,basalt)):
                pts=[]
                for along,rise in ((-4.6,n),(4.6,n),(4.6,n+1),(-4.6,n+1)):
                    dd=d+along;v=-9.4-rise*.78;pt=k.road.pos(dd,v)
                    pts.append((pt[0],pt[1],pt[2]+1.4+1.12*rise+1.2*math.sin(dd/48)+.004*(dd-5160)))
                art.face(pts[::-1],(c,)*4)
        if d>6000 and j%2==0:
            v=k.rng.choice((-1,1))*k.rng.uniform(12,65);x,y,_=at(0,v);z=ground(d,v)
            for n in range(3):
                r=k.rng.uniform(1.2,3.5);cx=x+n*1.8;cy=y+math.sin(n*j)*1.4;last=None
                for size,rise in ((.78,-.55),(1,.06),(.73,.43),(.29,.74),(.01,.87)):
                    ring=[]
                    for q in range(8):
                        a=q*math.pi/4+j;scale=size*r*(1+.15*math.cos(q*3+j))
                        ring.append((cx+scale*math.cos(a)*1.45,cy+scale*math.sin(a),z+r*(rise+.15*math.sin(q*2+j))))
                    if last:
                        for q in range(8):
                            m=(q+1)%8;pts=(last[q],last[m],ring[m],ring[q]);picture(flow,pts,[(a*.37+b*.11,c*.31+b*.16) for a,b,c in pts])
                    last=ring
    # Produce an irregular layered profile for Roque Cinchado and the neighbouring pinnacles.
    for j,(d,v,ht,sz) in enumerate(((7994,26,25,6.4),(8043,45,19,5.4),(7953,67,15,5.7),(8090,80,21,5.2),(7908,91,12,4.3))):
        at,h=site(k,d,v);base=ground(d,v)-elevation(d);old=None
        for i,(height,rad) in enumerate(((0,1.15),(.17,.83),(.39,.64),(.63,.49),(.71,.79),(.82,.98),(.94,.83),(1,.39))):
            r=rad*sz if j==0 else sz*(1-.61*height+.15*math.sin(i));ring=[]
            for u in range(12):
                a=u*math.tau/12+.14;w=r*(1+.14*math.sin(3*a+j)+.10*math.cos(5*a+i));ring.append(at(w*math.cos(a)+height*2.4,w*math.sin(a),base+ht*height+.24*math.sin(a+i)))
            if old:
                for u in range(12):
                    n=(u+1)%12;picture(roques,(old[u],old[n],ring[n],ring[u]),((u/3,(i-1)/3),((u+1)/3,(i-1)/3),((u+1)/3,i/3),(u/3,i/3)))
            old=ring
        art.face(ring,(ochre,)*12)
    at,h=site(k,8094,-55);base=ground(8094,-55)-elevation(8094)
    art.box(at(0,0,base),(39,12,5.6),h,cream);art.roof(at(0,0,base+5.6),39,12,2.7,h,rust)
    for i in range(-8,9,2):art.box(at(i*2,6.03,base+1.4),(1.35,.11,2.6),h,black)
    # Izaña telescopes have cylindrical bases with individual shutters following each white dome.
    for j,(d,v,r) in enumerate(((13244,-20,6.1),(13272,-37,5.1),(13210,-43,4.4),(13324,-58,4.8))):
        at,h=site(k,d,v);base=ground(d,v)-elevation(d);art.tube(at(0,0,base),r,r,r*1.45,cream,white,20,cap=steel)
        last=None
        for l in range(8):
            a=l*math.pi/14;ring=[at(r*math.cos(a)*math.cos(n*math.tau/20),r*math.cos(a)*math.sin(n*math.tau/20),base+r*(1.45+math.sin(a))) for n in range(20)]
            if last:
                for n in range(20):
                    c=steel if n==11 else white;art.face((last[n],last[(n+1)%20],ring[(n+1)%20],ring[n]),(c,)*4)
            last=ring
    at,h=site(k,13244,-20);base=ground(13244,-20)-elevation(13244)
    picture(drum,[at(-6.3,v,base+z) for v,z in ((-11,-.1),(11,-.1),(11,16),(-11,16))],((0,0),(1,0),(1,1),(0,1)))
    at,h=site(k,2850,510)
    picture(tide,[at(u,0,z) for u,z in ((-540,-143),(540,-143),(540,122),(-540,122))],((0,0),(1,0),(1,1),(0,1)))
    at,h=site(k,13335,-29);base=ground(13335,-29)-elevation(13335)
    art.box(at(0,0,base),(5.5,5.5,21),h,white);art.tube(at(0,0,base+21),3.7,3.1,3.1,white,white,14,cap=white)
    a,_=site(k,10531,24);b,_=site(k,10890,93)
    for at,ht in ((a,14),(b,32)):
        for v in (-2,2):art.tube(at(0,v,0),.53,.31,ht,steel,steel,8)
        art.box(at(0,0,ht),(2.3,6.6,.65),0,steel)
    beam(art,a(0,0,14.4),b(0,0,32.4),.16,black)
    for j,d in enumerate(range(1850,3980,100)):
        at,h=site(k,d,152+j%3*22)
        picture(cloud,[at(u,v,-37+q) for u,v,q in ((-106,-75,0),(106,-75,0),(106,145,-24),(-106,145,-24))],((0,0),(1,0),(1,1),(0,1)))
    # The cone is fixed beyond the route, so the changing foreground travels against one summit.
    picture(rim,((20500,-6600,1850),(20500,6200,1850),(20500,6200,5520),(20500,-6600,5520)),((0,0),(1,0),(1,1),(0,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.25,'terrain':{'sea':False},'land':{'mid':0x90806C},'sky':[0xA9C7D9,0x77AFD1,0x518DC3,0x3179BA,0x245CA5],'haze':0xA5BCCB,'light':[0xFFF1CE,1.64],'fill':[0xBFD9EA,0x947C69],'sun_altitude':.93,'sun_azimuth':-.82}
