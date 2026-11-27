"""The R756 over Wicklow Gap, from the Hollywood approach toward Laragh."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 160], [1100, 194], [2240, 239], [3060, 256], [3940, 245], [5100, 291], [6240, 337], [7130, 363], [8200, 427], [8680, 460], [9360, 451], [10150, 475], [11300, 403], [12800, 304], [13900, 229], [14870, 177], [15892.5, 145]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return .36*math.sin(d/393)+.53*math.sin((d-275)/730)+.14*math.sin(d/143)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    base=elevation(d)-.23
    e=max(0,abs(v)-4)
    slope=.12 if v>0 else -.16
    z=base+e*slope+min(1,e/8)*min(17,e*.21)*(math.sin(d/71+v/26)*.32+math.cos(d/140-v/37)*.45)
    # Cut two different basins. The upper is pumped storage; the lower is glacial.
    for a,side,along,across,station,water in ((8680,1,260,110,134,455),(14870,-1,550,130,150,145)):
        r=((d-a)/along)**2+((v*side-station)/across)**2
        if r<1.3:
            w=max(0,min(1,(1.3-r)*2.7));z=z*(1-w)+(water-3.7)*w
    spur=((d-14951)/78)**2+((v+40)/32)**2
    if spur<1.7:
        w=max(0,min(1,(1.7-spur)/.72));z=z*(1-w)+(elevation(14951)-4.2)*w
    if 2940<d<3220 and 8<v<42:z=min(z,252)
    return z
def road(r,st,length,col,bc):
    mesh=bc.Builder('R756Tarmac','terrain');mesh.colours=[];mesh.uvs=[]
    for i in range(len(r.s)-1):
        p=[r.at(j,v,.056) for j,v in ((i,-3.05),(i+1,-3.05),(i+1,3.05),(i,3.05))]
        picture(mesh,p,[(x/5,y/5) for x,y,z in p])
    mesh.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('WicklowPeat','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-500,-300,-235,-180,-140,-105,-75,-46,-23,-11,-4,0,4,11,23,46,75,105,140,180,235,300,500):
            x,y,_=r.at(i,v);row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/8,y/8) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.23
def scenery(k):
    art=Painted(k);plants=pictured(k,'WicklowFlora');water=pictured(k,'WicklowWater')
    rock=pictured(k,'WicklowGranite');vista=pictured(k,'WicklowRidges');signs=pictured(k,'WicklowSigns')
    road,peat,stone,light,iron,white,pine,slate=map(lin,(0x656465,0x68523D,0x96938B,0xC1BBA8,0x666A62,0xDEDACA,0x394F3C,0x6D6B68))
    def patch(mesh,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(mesh,pts,((a,b),(c,b),(c,e),(a,e)))
    def sprite(mesh,at,w,ht,uv):
        patch(mesh,[at(0,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,ht),(w/2,ht))],uv)
    def pool(d,v,l,w,z,jag,phase):
        at,h=site(k,d,v)
        border=[]
        for i in range(44):
            a=i*math.tau/44;rr=1+jag*(math.cos(5*a+phase)*.65+math.sin(3*a-phase)*.35)
            x,y,_=at(l*math.cos(a)*rr,w*math.sin(a)*rr);border.append((x,y,z))
        cx,cy,_=at(0,0)
        for j in range(0,44,2):
            pts=((cx,cy,z),border[j],border[(j+1)%44],border[(j+2)%44])
            picture(water,pts,[(x/10,y/10) for x,y,_ in pts])
        return border
    for j,d in enumerate(range(-48,15965,9)):
        if j%2==0:
            at,h=site(k,d);art.box(at(0,0,.066),(2.6,.104,.012),h,white)
        for side in (-1,1):
            for row in range(2):
                v=side*(k.rng.uniform(3.9,7.1) if row==0 else k.rng.uniform(10,35))
                if 2890<d<3200 and v>9:continue
                offset=k.rng.uniform(-2,2);at,h=site(k,d+offset,v);bottom=ground(d+offset,v)-elevation(d+offset)
                idx=(j+row+side)%3;w=k.rng.uniform(1.5,3.5);ht=w*(.43 if idx<2 else .61)
                sprite(plants,lambda x,y,z:at(x,y,z+bottom),w,ht,(idx/4,0,(idx+1)/4,1))
            if (d<1520 or 12350<d<14150 or d>15240) and j%2==0:
                for row in range(2):
                    v=side*(16+row*17+k.rng.uniform(-4,4));at,h=site(k,d,v);bottom=ground(d,v)-elevation(d)
                    ht=k.rng.uniform(8,14);sprite(plants,lambda x,y,z:at(x,y,z+bottom),ht*.55,ht,(.75,0,1,1))
        if j%3==0:
            v=k.rng.choice((-1,1))*k.rng.uniform(5.9,32);at,h=site(k,d,v);bottom=ground(d,v)-elevation(d)
            r=k.rng.uniform(.31,1.7);p=[at(x*r,y*r,z*r+bottom) for x,y,z in ((-1,-.8,0),(1,-.65,0),(.87,.8,0),(-.64,1,0),(-.6,-.39,.65),(.57,-.53,.85),(.54,.53,.73),(-.37,.54,.6))]
            for f in ((0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)):patch(rock,[p[i] for i in f])
    for d in list(range(90,440,3))+list(range(6110,6450,3))+list(range(14450,14600,3)):
        at,h=site(k,d,-5)
        for row in range(3):
            n=row%2
            art.box(at(.55*n,0,row*.29-.2),(2.93,.98-row*.12,.37),h,lin((0x959289,0xAAA79B,0x8F9087)[(d+row)%3]))
    for j,(d,v,l,w) in enumerate(((2990,17,11,4),(3030,23,16,7),(3073,19,17,6),(3090,33,20,5),(3135,21,13,8))):
        pool(d,v,l,w,252.64,.19,j)
    bank=pool(8680,134,218,87,455,.045,0)
    for a,b in zip(bank,bank[1:]+bank[:1]):
        dx=b[0]-a[0];dy=b[1]-a[1];width=math.hypot(dx,dy)
        art.box(((a[0]+b[0])/2,(a[1]+b[1])/2,452.1),(width+.14,4.1,4.35),math.atan2(dy,dx),stone)
    at,h=site(k,8510,0)
    for i in range(32):
        def lane(n,v):
            x=3.0*n;y=3.3+1.52*n+v;return at(x,y,ground(8510+x,y)-elevation(8510)+.65)
        art.face((lane(i,-2),lane(i+1,-2),lane(i+1,2),lane(i,2)),(road,)*4)
    pool(14870,-150,432,104,145,.14,.9)
    at,h=site(k,14951,-40);base=ground(14951,-40)-elevation(14951)
    art.tube(at(0,0,base),2.83,2.12,25.5,stone,light,14,cap=stone)
    for n in range(16):
        a=n*math.tau/16;b=(n+1)*math.tau/16
        for j in range(5):
            z=j*5.1;e=z+5.1;r=2.86-.71*z/25.5;s=2.86-.71*e/25.5
            p=[at(rad*math.cos(t),rad*math.sin(t),base+height) for t,rad,height in ((a,r,z),(b,r,z),(b,s,e),(a,s,e))]
            patch(rock,p,(0,0,1,1))
    art.tube(at(0,0,base+25.5),2.4,.12,4.9,slate,stone,12)
    for z in (4,12.5,21,23):art.box(at(0,2.20,base+z),(.58,.25,1.39),h,iron)
    for d in range(14440,15260,19):
        v=-278-11*math.sin(d/61);tree,h=site(k,d,v)
        basez=ground(d,v)-elevation(d)
        sprite(plants,lambda x,y,z:tree(x,y,z+basez),7.8,13.1,(.75,0,1,1))
    for u,v in ((7,-5),(-8,-7)):
        art.box(at(u,v,base),(6.5,4.1,3.2),h,stone);art.roof(at(u,v,base+3.2),6.7,4.2,1.85,h,slate)
    # Original race chalk and the bilingual summit/route signs.
    for j,d in enumerate((164,5970,8689,10176,14380)):
        at,h=site(k,d,-4.1);art.tube(at(0,0,-.23),.061,.061,2.3,iron,iron,7)
        sprite(signs,lambda x,y,z:at(x,y,z+1.2),2.38,.98,(0,0,.5,1))
    for j,d in enumerate((95,116,133,6070,10090)):
        pts=[k.road.pos(d+x,v,.091) for x,v in ((-1.15,1.32),(-1.15,-1.32),(1.15,-1.32),(1.15,1.32))]
        patch(signs,pts,(.5,0,1,1))
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def rim(t,z):return 7100+17500*math.cos(t),12500*math.sin(t),z
        patch(vista,(rim(a,-880),rim(b,-880),rim(b,2780),rim(a,2780)),(u,0,v,1))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.9,'terrain':{'sea':False},'land':{'mid':0x7D795E},'sky':[0xCBD0D1,0xCDD1D1,0xB3C1CA,0x9DAFBC,0x829BAF],'haze':0xB5BEBD,'light':[0xF2E3C9,1.17],'fill':[0xD7DFE3,0xAAA799],'sun_altitude':.52,'sun_azimuth':-.76}
