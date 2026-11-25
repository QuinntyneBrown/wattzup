"""Salar de Atacama from the saddle. The distant cordillera is fixed in world space."""
import math
from worldkit import Painted, lin, smooth

# A shallow open basin, crossed on a road oriented towards the Andes.
LAGOONS=((1280,-120,730,110),(8950,160,1350,149),(16750,-185,790,167))

def shore(x,y):
    return min(math.hypot((x-cx)/rx,(y-cy)/ry)+.024*math.sin(x/42+y/38)
               for cx,cy,rx,ry in LAGOONS)

def grade_height(d):
    # The salar is level. The gravel approach rises gently over the eroded alluvial fan.
    return 9*smooth(3450,6000,d)-9*smooth(6000,7750,d)+6*smooth(16860,18110,d)-6*smooth(18110,19500,d)

def lay(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        samples.append(dict(d=d,x=d,y=0,z=grade_height(d),h=0,k=0,g=(grade_height(d+.5)-grade_height(d-.5))*100))
    mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    return samples,st,length,mean,0

def land_height(x,y):
    g=grade_height(x)
    flats=-.20+.12*math.sin(x/87+y/34)+.04*math.cos(y/4+x/17)
    basin=max(0,1-shore(x,y))*5.8
    return g+flats-basin

def terrain(road,col,theme,bc):
    b=bc.Builder('Salt crust, gypsum and flooded coves','terrain');b.colours=[]
    ys=(-1700,-650,-310,-235,-165,-115,-81,-52,-35,-22,-13,-7,0,7,13,22,35,52,81,115,165,235,310,650,1700)
    for x in range(-270,21550,22):
        for a,c in zip(ys,ys[1:]):
            pts=((x,a),(x+22,a),(x+22,c),(x,c))
            colours=[]
            for px,py in pts:
                wet=shore(px,py)
                band=math.sin(px/57+py/43)+math.cos(px/103-py/41)
                hue=(0x93826C if wet<1.04 else (0xC6B6A3 if wet<1.17 else
                    (0xC2A48F if 3700<px<6400 else (0xE3DACA if band>.55 else 0xD7CCBA))))
                colours.append(lin(hue))
            b.quad(*[(px,py,land_height(px,py)) for px,py in pts]);b.colours.extend(colours)
    return b.build(col),land_height

THEME={'lay':lay,'land_builder':terrain,'land':{'mid':0xD8CCBA},'terrain':{'sea':False},
       'edge':'salt','centre':'white','kerbs':False,'sky':[0xB8CAD4,0x729FC7,0x347BB6,0x205B9D,0x1C467E],
       'haze':0xB5B8C4,'light':[0xFFE7C2,3.65],'fill':[0xBDD4F0,0xC4A88D],'sun_altitude':.52,'sun_azimuth':2.63,
       'palette':{'asphalt':0x5E5C62,'promenade':0xAA9988,'sand':0xC9BDA9}}

def volcano(art, cx,cy,r,h,snow,phase):
    """Angular alluvial fans flatten towards the base. Snow follows radial gullies below the summit."""
    rings=[]
    for band,(rad,lift) in enumerate(((1,0),(.81,.075),(.57,.26),(.36,.48),(.21,.69),(.095,.87),(.012,1))):
        ring=[]
        for j in range(45):
            a=math.tau*j/45
            fold=math.sin(7*a+phase)+.54*math.cos(13*a-phase)
            q=r*rad*(1+.07*fold)
            ring.append((cx+q*math.cos(a),cy+q*math.sin(a),-15+h*(lift+.023*math.sin(a*9+phase)*math.sin(math.pi*lift))))
        rings.append(ring)
    hues=[0xAF9390,0x9A7D81,0x8B737C,0x867580,0x978993,0xA59AA2]
    for i in range(6):
        for j in range(45):
            n=(j+1)%45
            f=(rings[i][j],rings[i][n],rings[i+1][n],rings[i+1][j])
            shade=.84+.14*math.sin(j*1.7+phase)+.07*math.cos(j*.8)
            base=lin(hues[i])
            stone=tuple(min(1,c*shade) for c in base[:3])+(1,)
            ice=lin(0xD9DEE2)
            tip=snow and (i>=5 or (i==4 and math.sin(j*1.4+phase)>.1))
            art.face(f,(stone,stone,ice if tip else stone,ice if tip else stone))

def ridge(art,x,y,length,height,seed):
    """Bedded, eroded walls and stepped talus slopes in Valle de la Luna."""
    side=1 if y>0 else -1
    stations=[]
    for j in range(28):
        u=j/27
        crown=(math.sin(math.pi*u)**.74)*(1+.14*math.cos(24*u+seed)+.09*math.sin(63*u))
        cut=7*math.cos(j*1.3+seed)+6*math.sin(j*.55)
        xx=x+(u-.5)*length
        stations.append([(xx,y+side*(depth+cut*f),land_height(xx,y)+height*crown*z)
                         for depth,z,f in ((-19,0,.7),(-8,.21,1),(-5,.26,1),(0,.53,.8),(1,.64,.7),(4,.85,.55),(5,1,.4),(25,.83,.3),(59,0,0))])
    tones=[0xAB735D,0xD5A27D,0xAF6D57,0xC48A68,0x9B6351,0xC88967,0xE0B18E,0xBB876B]
    for j,(a,b) in enumerate(zip(stations,stations[1:])):
        for k,t in enumerate(tones):
            pts=(a[k],b[k],b[k+1],a[k+1]);c=lin(t)
            if side<0:pts=pts[::-1]
            art.face(pts,(c,)*4)

def lagoons(art):
    for cx,cy,rx,ry in LAGOONS:
        rings=[]
        for r in (.01,.72,.93,.98,1.0):
            ring=[]
            for j in range(96):
                a=j*math.tau/96
                w=r*(1+.011*math.sin(11*a)+.013*math.cos(17*a))
                ring.append((cx+rx*w*math.cos(a),cy+ry*w*math.sin(a),-.37))
            rings.append(ring)
        for k,tint in enumerate((0x496C80,0x648C9A,0x7FA6A4,0xA3B8AC)):
            for j in range(96):
                n=(j+1)%96
                art.face((rings[k][j],rings[k+1][j],rings[k+1][n],rings[k][n]),(lin(tint),)*4)

def fauna(art,x,y,scale,angle):
    """Lean vicuña with long legs, a pale bib, an upright neck and pointed ears."""
    g=land_height(x,y)
    def pt(u,v,z):
        return (x+scale*(u*math.cos(angle)-v*math.sin(angle)),y+scale*(u*math.sin(angle)+v*math.cos(angle)),g+z*scale)
    hide,cream,dark=map(lin,(0xB78352,0xD7BE8B,0x72543E))
    for a in (-.44,.44):
        for b in (-.15,.15):
            art.tube(pt(a,b,0),.038*scale,.066*scale,.77*scale,dark,hide,6)
    art.box(pt(0,0,.68),(1.18*scale,.40*scale,.45*scale),angle,hide)
    art.box(pt(.42,0,.75),(.29*scale,.37*scale,.50*scale),angle,cream)
    art.tube(pt(.5,0,1.03),.135*scale,.089*scale,.63*scale,cream,hide,8)
    art.box(pt(.60,0,1.63),(.33*scale,.17*scale,.19*scale),angle,hide)
    for b in (-.065,.065):art.tube(pt(.48,b,1.77),.045*scale,.008*scale,.16*scale,hide,dark,5)

def scenery(k):
    art=Painted(k);far=Painted(k,'peaks');r=k.rng
    for i,(x,y,rad,h) in enumerate(((28500,2900,4200,2570),(30200,-6800,4200,1770),(30700,-12300,5300,1890),(29300,9100,4050,1710),(31500,14200,4900,2060),(25600,-17600,4900,1300))):
        volcano(far,x,y,rad,h,i!=1,.7*i)
    lagoons(art)
    for x,y,l,h in ((-150,190,620,34),(560,194,730,43),(1600,255,1180,48),(3680,-185,720,47),(4220,-103,750,71),(4730,96,790,64),(5250,-89,790,88),(5850,143,820,56),(6600,-165,880,67),(7850,280,680,40),(10400,-225,1300,74),(15500,230,1200,63),(18650,-130,960,71)):
        ridge(art,x,y,l,h,r.uniform(0,5))
    for x in range(-80,21400,12):
        for side in (-1,1):
            s=x+r.uniform(0,10);y=side*r.uniform(8.5,29)
            if shore(s,y)<1:continue
            for j in range(r.randrange(2,6)):
                a=s+r.uniform(-1.4,1.4);b=y+r.uniform(-1.3,1.3);size=r.uniform(.13,.51)
                col=lin(r.choice((0xDED7C6,0xEAE3D3,0xD4C4AC,0xCEBBA3)))
                art.tube((a,b,land_height(a,b)-.05),size,size*.65,size*.59,col,col,5,col)
            if r.random()<.42 and (shore(s,y)<1.38 or 4150<s<5850 or s>8000):
                for j in range(7):
                    a=r.uniform(0,math.tau);w=r.uniform(.12,.29);h=r.uniform(.39,.74);z=land_height(s,y)
                    f=((s-w,y,z),(s+w,y,z),(s+.46*math.cos(a),y+.46*math.sin(a),z+h))
                    co=lin(r.choice((0xC2A766,0xAC9157,0xD7BD77)))
                    art.face(f,(co,)*3);art.face(f[::-1],(co,)*3)
    for x,y in ((2060,13),(2084,21),(2091,18),(8135,-15),(8160,-21),(8580,-18),(11230,29),(17190,15)):
        fauna(art,x,y,r.uniform(.92,1.15),r.uniform(-1.4,1.4))
    return {'efforts':0}
