"""The Torricelle, Adige and Verona amphitheatre finish."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 86], [700, 110], [2400, 203], [4200, 273], [5100, 251], [6310, 186], [8500, 107], [10000, 66], [11430, 63], [12800, 62], [14400, 67], [16720, 61], [19000, 65], [21850, 60], [24000, 61]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return (.48*math.sin(d/443)+.18*math.sin(d/181))*min(1,max(0,(23760-d)/230),max(0,min(1,(abs(d-11460)-75)/120)))

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    if abs(d-11460)<53:
        return elevation(d)-7.5
    if abs(d-11460)<78:
        return elevation(d)-.22-(78-abs(d-11460))*.29
    hill=max(0,min(1,(9600-d)/1400))
    edge=max(0,abs(v)-6)
    return elevation(d)-.24+hill*edge*(.18 if v>0 else -.28)+hill*min(1,edge/12)*math.sin(d/67+v/18)

def road(r,st,length,col,bc):
    stone=bc.Builder('VeronaMarble','terrain');tarmac=bc.Builder('TorricelleRoad','terrain')
    for m in (stone,tarmac):m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        m=tarmac if r.s[i]['d']<10340 else stone
        w=3.45;pts=[r.at(j,v,.045) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))]
        picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    tarmac.build(col);stone.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('VeronaLand','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-180,-85,-40,-15,-5,-3,0,3,5,15,40,85,150):
            n=max(-32,min(v,32));x,y,_=r.at(i,n);y+=v-n;row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/9,y/9) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.24

def scenery(k):
    art=Painted(k);fronts=pictured(k,'VeronaFacades');crowd=pictured(k,'VeronaTifosi');hills=pictured(k,'TorricelleVista')
    masonry=pictured(k,'ArenaStone');water=pictured(k,'AdigeWater');paving=pictured(k,'ListonPaving');finish=pictured(k,'VeronaSigns')
    rose,brick,cream,wood,iron,green,pink=map(lin,(0xC79783,0xA76B50,0xE0D2AE,0x7D6249,0x555A59,0x516C41,0xCD577B))
    def panel(m,pts,u,v):picture(m,pts,((u,0),(v,0),(v,1),(u,1)))
    def stone_face(pts):
        picture(masonry,pts,[(x*.21+z*.18,y*.21+z*.22) for x,y,z in pts])
    def arch(at,wide,depth,spring,rise,colour,segments=13):
        # Voussoirs retain the open span. Darker undersides give the arcade depth.
        inner=wide/2;outer=inner+.54
        for j in range(segments):
            a=math.pi*j/segments;b=math.pi*(j+1)/segments
            def pt(t,r,v):return at(r*math.cos(t),v,spring+rise*r/inner*math.sin(t))
            c=tuple(ch*(.90+.10*((j*5)%7)/6) for ch in colour[:3])+(1,)
            for v in (-depth/2,depth/2):
                stone_face((pt(a,inner,v),pt(a,outer,v),pt(b,outer,v),pt(b,inner,v)))
            stone_face((pt(a,inner,-depth/2),pt(b,inner,-depth/2),pt(b,inner,depth/2),pt(a,inner,depth/2)))
    def cypress(at,h):
        for z,r,up in ((0,.16,1.4),(.7,.75,h*.42),(h*.42,1.0,h*.38),(h*.78,.48,h*.22)):
            art.tube(at(0,0,z),r,max(.035,r*(.06 if z>h*.7 else .7)),up,green if z else wood,green,7,cap=green)
    for j,d in enumerate(range(-30,23890,18)):
        if d<8800:
            for side in (-1,1):
                if j%3==0:
                    v=side*(5.6+j%7);at,h=site(k,d,v);z=ground(d,v)-elevation(d)
                    cypress(lambda x,y,a:at(x,y,a+z),6+j%5)
            if j%2==0:
                at,h=site(k,d,14)
                for off in (0,3.6,7.2):
                    for q in (-6,6):art.box(at(q,off,1),(0.1,.12,1.75),h,wood)
                    art.box(at(0,off,1.47),(11.9,.72,.55),h,green)
        if 10300<d<23680 and abs(d-11460)>95 and abs(d-21890)>75 and not 16698<d<16840:
            for side in (-1,1):
                v=side*(18 if d>21400 else 12.4);at,h=site(k,d,v);idx=(j+side)%4;w=17.8;high=(8.2,10.1,12.3,9.5)[idx]
                art.box(at(0,side*3.1,-.32),(w,6.2,high),h,(rose,cream,brick,cream)[idx])
                art.roof(at(0,side*3.1,high-.32),w,6.4,1.15,h,brick)
                panel(fronts,[at(x,-side*.05,z) for x,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))],idx/4,(idx+1)/4)
                panel(fronts,[at(-w/2-.04,y,z) for y,z in ((side*6,0),(0,0),(0,high),(side*6,high))],idx/4,(idx+1)/4)
        if d>19500 and j%2==0:
            for side in (-1,1):
                at,h=site(k,d,side*4.7)
                art.box(at(0,0,.08),(11,.09,1.01),h,pink)
                for dx in (-5.4,0,5.4):
                    art.box(at(dx,0,-.15),(.078,.1,1.47),h,iron)
                    art.box(at(dx,0,-.08),(.095,.8,.11),h,iron)
                idx=j%3;panel(crowd,[at(x,side*.49,z) for x,z in ((-4,0),(4,0),(4,2.23),(-4,2.23))],idx/3,(idx+1)/3)
    # The river lies below the bridge deck. It continues around the bend to each bank.
    at,h=site(k,11460)
    for v in range(-400,401,8):
        def flow(y,edge):
            x=15*math.sin(y/94)+edge*(46+3*math.sin(y/51));return at(x,y,-6.4)
        pts=(flow(v,-1),flow(v,1),flow(v+8,1),flow(v+8,-1));picture(water,pts,[(x/8,y/8) for x,y,z in pts])
    at,h=site(k,6350,-74)
    for x in range(-150,170,10):
        y=24*math.sin(x/131)
        pts=[at(x+dx,y+v,-26) for dx,v in ((0,-12),(10,-12),(10,12),(0,12))]
        picture(water,pts,[(a/8,b/8) for a,b,z in pts])
    at,h=site(k,11460)
    for j in range(5):
        u=-40.8+j*20.4
        arch(lambda x,y,z:at(u+x,y,z-6.3),18.9,7.2,.9,4.9,brick if j in (1,2) else cream)
        for side in (-1,1):
            art.box(at(u,side*3.44,-.65),(20.45,.62,1.53),h,rose)
            art.box(at(u,side*3.44,.84),(20.45,.76,.16),h,cream)
        art.box(at(u-10.2,0,-6.6),(1.5,7.55,6.05),h,cream)
    at,h=site(k,11523,5.8);art.box(at(0,0,-.2),(6,5.2,11.2),h,brick);art.roof(at(0,0,11),6.5,5.5,2,h,brick)
    # Stone embankments and contiguous riverside houses face the bridge.
    at,h=site(k,11460)
    for side in (-1,1):
        for j in range(-8,9):
            v=j*13.8
            if abs(v)<10:continue
            u=side*(66+2*math.sin(v/37))
            w=13.5;high=7.3+(j%4)*1.6;idx=(abs(j)+side)%4
            art.box(at(u,v,-1.5),(6.5,w,high+1.5),h,(rose,cream,brick,cream)[idx])
            art.roof(at(u,v,high),6.7,w,1.24,h,brick)
            panel(fronts,[at(u-side*3.29,v+y,z) for y,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))],idx/4,(idx+1)/4)
            art.box(at(side*54,v,-6.4),(1.65,14,6.25),h,rose)
    # Lamberti shaft, clock and octagonal bell chamber over the market.
    at,h=site(k,16801,26)
    art.box(at(0,0,-.3),(6.35,6.35,27),h,brick)
    for j in range(12):art.box(at(0,0,j*1.55+.7),(6.39,6.39,.36),h,cream)
    art.box(at(0,0,26.7),(7.1,7.1,3.25),h,cream)
    for dx in (-2.4,2.4):
        for dy in (-2.4,2.4):art.box(at(dx,dy,29.9),(.63,.63,4.8),h,cream)
    art.tube(at(0,0,34.7),4,3.8,1,cream,rose,8,cap=cream)
    art.tube(at(0,0,35.7),3.7,3.5,4.5,brick,cream,8,cap=cream)
    art.tube(at(0,0,40.2),4,.19,7.5,brick,brick,8,cap=iron)
    for j in range(9):
        at,h=site(k,16698+j*9,6.8);art.tube(at(0,0,0),.073,.055,2.38,wood,wood,6)
        art.tube(at(0,0,2.15),2.1,.2,.81,cream,rose,8,cap=cream)
    for j in range(8):
        at,h=site(k,16710+j*12,-13)
        art.box(at(0,0,.5),(2.9,1.58,.21),h,wood)
        for y in (-.8,.8):beam(art,at(0,y,.66),at(0,y,2.77),.045,iron)
        art.roof(at(0,0,2.65),3.9,2.5,.66,h,cream if j%2 else rose)
    # The southern archway straddles the racing line; the second arch opens onto the Liston.
    at,h=site(k,21903)
    for v in (0,8):
        arch(lambda x,y,z:at(y,v+x,z),7.05,3.2,3.18,4.8,rose)
        art.box(at(0,v,8.53),(3.38,8.08,1.49),h,brick)
    for v in (-3.94,3.97,11.95):art.box(at(0,v,-.2),(3.6,1.14,8.9),h,brick)
    for j in range(17):art.box(at(0,-3.8+j*.98,10.02),(3.44,.54,.75),h,brick)
    panel(finish,[at(-1.74,v,z) for v,z in ((4.76,8.4),(3.18,8.4),(3.18,9.98),(4.76,9.98))],0,.25)
    for d in range(22000,23380,13):
        at,h=site(k,d,-8.3);art.tube(at(0,0,-.2),.10,.08,2.69,wood,wood,6)
        art.tube(at(0,0,2.45),1.95,.11,.64,cream,cream,8,cap=cream)
        for x in (-1,1):art.box(at(x,0,.37),(.69,.59,.13),h,wood)
    for d in range(21935,22260,16):
        at,h=site(k,d,17)
        art.tube(at(0,0,-.1),.32,.20,3.65,wood,wood,8)
        art.tube(at(0,0,2.98),1.65,3.15,2.9,green,green,10)
        art.tube(at(0,0,5.81),3.13,.54,2.2,green,green,10,cap=green)
    at,h=site(k,21970,12)
    art.tube(at(0,0,-.16),4.6,4.6,.61,rose,cream,26,cap=cream)
    art.tube(at(0,0,.47),4,4,.09,green,green,26,cap=green)
    art.tube(at(0,0,.57),.65,.44,2.3,cream,cream,12,cap=cream)
    # Arena long axis follows the finish straight. Leave an open entrance at the near end.
    at,h=site(k,23998);radius=66;short=48;n=54
    def rim(t,rx,ry,z):return at(rx*math.cos(t),ry*math.sin(t),z)
    for j in range(n):
        t=math.tau*(j-.5)/n;u=math.tau*(j+.5)/n;m=(t+u)/2
        a=rim(t,radius,short,0);b=rim(u,radius,short,0);length=math.dist(a[:2],b[:2])
        tx=(b[0]-a[0])/length;ty=(b[1]-a[1])/length
        def bay(x,y,z):
            c=rim(m,radius,short,z);return c[0]+x*tx-y*ty,c[1]+x*ty+y*tx,c[2]
        entrance=abs(math.sin(m))<.14 and math.cos(m)<0
        art.box(bay(-length/2,0,-.25),(1.26,2.78,7.1),math.atan2(ty,tx),rose)
        arch(bay,length-1.34,2.62,3.55,2.65,rose)
        art.box(bay(0,0,6.71),(length+0.25,2.84,.85),math.atan2(ty,tx),cream)
        arch(lambda x,y,z:bay(x,y,z+7.55),length-1.32,2.42,1.48,2.42,cream)
        art.box(bay(-length/2,0,7.52),(1.22,2.45,4.3),math.atan2(ty,tx),rose)
        art.box(bay(0,0,11.85),(length+.23,2.68,.72),math.atan2(ty,tx),cream)
        # The surviving Ala is a taller isolated fragment of the outer wall.
        if 4<=j<=7:
            arch(lambda x,y,z:bay(x,y,z+12.6),length-1.24,1.81,.83,2.75,rose)
            art.box(bay(-length/2,0,12.57),(1.32,1.86,4.0),math.atan2(ty,tx),rose)
            art.box(bay(0,0,16.55),(length+.13,1.89,.53),math.atan2(ty,tx),cream)
        if entrance:continue
        for row in range(13):
            rx=39+row*1.95;ry=23+row*1.78;z=.3+row*.82
            corners=(rim(t,rx,ry,z),rim(u,rx,ry,z),rim(u,rx+1.97,ry+1.81,z),rim(t,rx+1.97,ry+1.81,z))
            stone_face(corners)
            stone_face((corners[0],corners[1],rim(u,rx,ry,z-.79),rim(t,rx,ry,z-.79)))
            if row%3==1 and (j+row)%7!=0:
                lo=((j+row)%3)/3
                panel(crowd,[rim(a,rx+.49,ry+.49,z+b) for a,b in ((t+.004,0),(u-.004,0),(u-.004,1.77),(t+.004,1.77))],lo,lo+1/3)
    for side in (-1,1):art.box(at(0,side*4.4,-.2),(.55,.55,5.7),h,pink)
    panel(finish,[at(0,v,z) for v,z in ((4.65,4.28),(-4.65,4.28),(-4.65,5.57),(4.65,5.57))],.25,1)
    # Scarf holders and companions flank the last metres inside the arena.
    for d in (23954,23966,23979,23990,23999):
        for side in (-1,1):
            at2,h2=site(k,d,side*4.9);idx=(d+side)%3
            panel(crowd,[at2(x,0,z) for x,z in ((-1.85,0),(1.85,0),(1.85,1.83),(-1.85,1.83))],idx/3,(idx+1)/3)
    for d in range(19400,24150,16):
        pts=[k.road.pos(a,v,-.04) for a,v in ((d,-26),(d+16,-26),(d+16,26),(d,26))]
        picture(paving,pts,[(x/5,y/5) for x,y,z in pts])
    for j in range(80):
        a=j*math.tau/80;b=(j+1)*math.tau/80;u=j%20/20;v=u+.05
        if j//20%2:u,v=1-u,1-v
        def skyline(t,z):return 10200+19900*math.cos(t),17400*math.sin(t),z
        panel(hills,(skyline(a,-5700),skyline(b,-5700),skyline(b,1800),skyline(a,1800)),u,v)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.45,'terrain':{'sea':False},'land':{'mid':0x9A946F},'sky':[0xDEE0D8,0xC4D7E2,0xA4C6DC,0x86B0CE,0x6B9CC2],'haze':0xD3D6CC,'light':[0xFFF3DA,1.4],'fill':[0xDBE2EA,0xB7A782],'sun_altitude':.79,'sun_azimuth':-.79}
