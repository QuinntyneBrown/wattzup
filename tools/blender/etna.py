"""The south approach to Mount Etna, with the Silvestri craters and the Sapienza refuge."""
import math
import random
from worldkit import Painted, lin

PROFILE=((0,1125),(1200,1208),(2280,1299),(3550,1382),(4760,1464),(5850,1545),(7330,1638),(8380,1716),(9425,1784),(10740,1853),(12180,1904),(12885,1923))


def elevation(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    # Paired hairpins reverse the contour traverse, then return the rider to the summit approach.
    h=1.25+.26*math.sin(d/460)+.09*math.sin(d/133)
    for a,b,t in ((1880,2270,2.54),(3500,3920,-2.55),(4910,5320,2.52),(6950,7300,-2.52),(9210,9540,2.4)):
        h+=.5*t*(math.tanh((d-a)/43)-math.tanh((d-b)/44))
    return h


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x,y=0,0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def surface(d,l):
    edge=max(abs(l)-9.4,0)
    if edge==0:return -.08
    undulation=(.5+.5*math.sin(d/39+l*.11))*(.65+.35*math.sin(d*.053))
    if l>0:return -.08-edge*(.12+.07*math.sin(d/320))-min(edge*.07,3)*undulation
    if 10430<d<11230 or 11940<d<12470:return -.08+max(0,edge-57)*.11
    return -.08+edge*(.10+.035*math.sin(d/580))+min(edge*.12,3.1)*undulation


def road(r,st,length,col,bc):
    b=bc.Builder('SP92 dark bitumen, central markings and basalt kerbs','terrain');b.colours=[]
    asphalt=bc.Builder('SP92 bitumen','etna-bitumen');asphalt.colours=[]
    for i in range(len(r.s)-1):
        for a,c,h,k,t in ((-6.1,-5.65,.15,.15,0x777270),(-5.65,-5.52,.15,.01,0x555554),(-5.52,-5.38,.035,.035,0xe2dfd4),(-5.38,-.075,.034,.092,0x48474a),(-.075,.075,.092,.092,0xcdccc6 if i%3 else 0x48474a),(.075,5.38,.092,.034,0x48474a),(5.38,5.52,.035,.035,0xe2dfd4),(5.52,5.65,.01,.15,0x555554),(5.65,6.1,.15,.15,0x777270)):
            pts=[r.at(j,l,z) for j,l,z in ((i,c,k),(i,a,h),(i+1,a,h),(i+1,c,k))]
            batch=asphalt if t==0x48474a else b
            batch.faces.append(tuple(batch.v(p) for p in pts));batch.colours.extend([lin(t)]*4)
    b.build(col);asphalt.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Basalt clinker','etna-clinker');b.colours=[]
    red=bc.Builder('Rust-coloured scoria','etna-scoria');red.colours=[]
    lanes=(-160,-97,-56,-33,-18,-9.4,-5.9,5.9,9.4,18,33,56,97,160)
    def row(i):
        d=r.s[i]['d'];return [r.at(i,l,surface(d,l)) for l in lanes]
    a=row(0)
    for i in range(1,len(r.s)):
        c=row(i);d=r.s[i]['d']
        for j,l in enumerate(lanes[:-1]):
            scoria=7650<d<9550 and abs(l)>17
            tone=(0x864b36 if scoria else 0x454341) if abs(l)>18 else 0x56504b
            batch=red if scoria else b
            batch.faces.append(tuple(batch.v(v) for v in (a[j+1],a[j],c[j],c[j+1])));batch.colours.extend([lin(tone)]*4)
        a=c
    b.build(col);red.build(col);return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']


def scenery(k):
    r=k.road;art=Painted(k);clinker=Painted(k,'etna-clinker');scoria=Painted(k,'etna-scoria');rng=random.Random(2118)
    def box(d,l,z,w,depth,h,tint):art.box(r.pos(d,l,z),(w,depth,h),bearing(d),lin(tint))
    def tube(d,l,z,ra,rb,h,tone,n=8):art.tube(r.pos(d,l,z),ra,rb,h,lin(tone),lin(tone),n,lin(tone))
    # Individual pieces break the flow ridges into angular blocks, grounded on the authored section.
    for d in range(-14,12880,9):
        for side in (-1,1):
            off=side*rng.uniform(7.2,36)
            if 10370<d<11260 and side<0 or 8020<d<8740 and side<0:continue
            z=surface(d,off)-.16;radius=rng.uniform(.55,2.9);a=[]
            for j in range(7):
                t=j*math.tau/7;w=radius*rng.uniform(.66,1.1);a.append((math.cos(t)*w,math.sin(t)*w))
            x,y,h=r.pos(d,off,z);rh=radius*rng.uniform(.48,.85)
            lo=[(x+u,y+v,h-.17) for u,v in a];hi=[(x+u*.67+.16,y+v*.72,h+rh*rng.uniform(.65,1.13)) for u,v in a]
            for j in range(7):
                n=(j+1)%7;c=lin(rng.choice((0x29292c,0x333234,0x484440,0x50413b)))
                clinker.face((lo[j],lo[n],hi[n],hi[j]),(c,)*4)
            c=lin(0x504a46);clinker.face(hi,(c,)*7)
    # Broom carries bright small flowers above dark woody stems; birches only take root on old lava.
    for d in range(25,7560,25):
        off=rng.choice((-1,1))*rng.uniform(9,28);z=surface(d,off)
        if d%125==0:
            tube(d,off,z,.20,.14,3.7,0xb0ad99)
            for j in range(3):tube(d+.2*j,off+j*.24,z+2+j*.43,1.2,.52,1.9,0x71804e,8)
        else:
            for j in range(4):
                a=d+rng.uniform(-.7,.7);l=off+rng.uniform(-.7,.7)
                tube(a,l,z,.12,.41,.76,0x62663d,6);tube(a,l,z+.65,.45,.19,.29,0xd3aa30,6)
    # The partly buried roof is left behind on the lower flank.
    box(620,-18,surface(620,-18)-1.1,7,5,1.55,0x9a8b77)
    art.roof(r.pos(620,-18,surface(620,-18)+.44),7.5,5.8,1.6,bearing(620),lin(0x845849))
    # Bowl profiles turn inward from the rim to a dark floor.
    for d,l,rx,ry,depth in ((8495,-78,63,47,19),(8690,-124,95,72,30),(8320,98,56,41,17)):
        x,y,z=r.pos(d,l,surface(d,l));yaw=bearing(d);rings=[]
        for ratio,h in ((1.55,-7),(1,depth),(.79,depth*.71),(.30,depth*.07),(.08,-1)):
            ring=[]
            for n in range(48):
                a=n*math.tau/48;w=1+.06*math.sin(a*5)+.03*math.cos(a*7)
                u=rx*ratio*w*math.cos(a);v=ry*ratio*w*math.sin(a)
                wx=x+u*math.cos(yaw)-v*math.sin(yaw);wy=y+u*math.sin(yaw)+v*math.cos(yaw)
                height=z+h+2.1*math.sin(a*3)
                if ratio==1.55:
                    near=r.s[r.tree.find((wx,wy,0))[1]]
                    lane=-(wx-near['x'])*math.sin(near['h'])+(wy-near['y'])*math.cos(near['h'])
                    height=min(height,near['z']+surface(near['d'],lane)-1.4)
                ring.append((wx,wy,height))
            rings.append(ring)
        for layer,(a,b) in enumerate(zip(rings,rings[1:])):
            for n in range(48):
                c=lin(rng.choice(((0x944c31,0xa65b3a,0x854930) if layer<2 else (0x693b30,0x714236,0x573b36))))
                scoria.face((a[n],a[(n+1)%48],b[(n+1)%48],b[n]),(c,)*4)
        scoria.face(rings[-1],(lin(0x51332c),)*48)
    # Summit terrace, businesses and a refuge with a timber upper storey and stone base.
    for d,l,w,dep,h in ((10890,-34,46,15,8),(10820,-20,15,10,4.8),(10950,-26,21,13,5.4),(11010,-31,27,14,6),(12190,-25,30,13,6.8)):
        box(d,l,-.15,w,dep,h*.53,0x8d877d);box(d,l,h*.53-.15,w,dep,h*.47,0x9a6a4b)
        art.roof(r.pos(d,l,h-.16),w+1.2,dep+1.7,3.9,bearing(d),lin(0x735b54))
        for j in range(-int(w/2)+3,int(w/2)-1,4):
            for z in (.9,h*.57):box(d+j,l+dep/2+.11,z,1.57,.2,1.9,0x454e4e)
        for j in range(-int(w/2)+4,int(w/2),6):
            box(d+j,l+dep/2+1,.0,.29,.29,h*.53,0x76604d)
        box(d,l+dep/2+.8,h*.53,w+1,2.1,.32,0x675247)
    for d in range(10640,11100,15):
        l=-12-(d%4)*3
        box(d,l,.06,4.04,1.72,.85,0x625f64 if d%3 else 0x9b6152)
        box(d,l,.91,2.17,1.57,.62,0x666c70)
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=5.52,terrain={'sea':False},land={'mid':0x484644},sky=[0xc7cfcd,0xb8d2e1,0x8bbce0,0x69a6da,0x5087bc],haze=0xbac4ca,palette={'asphalt':0x4b4a4b,'sea':0x8098aa},light=[0xffecc6,3.5],fill=[0xd5dfeb,0x75685b],sun_azimuth=-.72,sun_altitude=.92)
