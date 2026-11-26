"""The D974 from the lower cedar forest to the observatory on Mont Ventoux."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 1295], [800.0, 1347.977], [1600.0, 1408.202], [2400.0, 1461.18], [3300.0, 1542.522], [4100.0, 1588.252], [5000.0, 1669.595], [5800.0, 1715.324], [7195.0, 1841.406], [8395.0, 1910.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return .91*math.tanh(2.8*math.sin((d-3150)/448))+.17*math.sin(d/171)+.13

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    bench=32 if abs(d-1750)<130 or d>8060 else 7
    e=max(0,abs(v)-bench)
    fall=-.34 if v<0 else .32
    return elevation(d)-.24+e*fall+min(1,e/15)*(1+e*.035)*math.sin(d/39+v/14)*math.cos(d/73-v/16)

def road(r,st,length,col,bc):
    m=bc.Builder('D974Tarmac','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        w=3.1;pts=[r.at(j,v,.045) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))]
        picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('VentouxLimestone','terrain');m.colours=[];m.uvs=[];last=None
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
    art=Painted(k);trees=pictured(k,'VentouxCedars');chalet=pictured(k,'ReynardFacade')
    signs=pictured(k,'VentouxMarkers');chalk=pictured(k,'VentouxChalk');fans=pictured(k,'VentouxFans')
    vista=pictured(k,'Vaucluse');mast=pictured(k,'VentouxStation')
    cream,stone,iron,red,wood,white=map(lin,(0xE6DFC9,0xABAAA3,0x626569,0xAF3936,0x705842,0xECE9DB))
    def panel(m,pts,u,v):picture(m,pts,((u,0),(v,0),(v,1),(u,1)))
    def card(m,at,w,h,u,v):
        panel(m,[at(0,y,z) for y,z in ((w/2,0),(-w/2,0),(-w/2,h),(w/2,h))],u,v)
    for j,d in enumerate(range(-50,8470,8)):
        for side in (-1,1):
            v=side*2.91
            pts=[k.road.pos(d+x,v+off,.071) for x,off in ((-4,-.057),(4,-.057),(4,.057),(-4,.057))]
            art.face(pts,(white,)*4)
            if d<1790 and not (side<0 and abs(d-1760)<70):
                for row in range(2):
                    v=side*k.rng.uniform(5.4+row*10,14+row*19);at,h=site(k,d+k.rng.uniform(-3,3),v)
                    base=ground(d,v)-elevation(d);height=k.rng.uniform(6.0,13);idx=(j+side+row)%4
                    card(trees,lambda x,y,z:at(x,y,z+base),height*.55,height,idx/4,(idx+1)/4)
            elif j%4==0:
                v=side*k.rng.uniform(5.2,15);at,h=site(k,d,v);base=ground(d,v)-elevation(d)
                r=k.rng.uniform(.24,.92);art.tube(at(0,0,base-.15),r,r*.56,r*.73,stone,cream,6,cap=cream)
        if d>2400 and j%7==0:
            idx=(j//7)%4;lane=k.rng.uniform(-1.0,1.0)
            pts=[k.road.pos(d+x,lane+v,.09) for x,v in ((-1.85,1.30),(-1.85,-1.30),(1.85,-1.30),(1.85,1.30))]
            panel(chalk,pts,idx/4,(idx+1)/4)
        if j%7==0 and (d<470 or 6630<d<7130 or d>7950):
            at,h=site(k,d,-4.35 if j%2 else 4.45);idx=j%4
            card(fans,at,3.65,1.96,idx/4,(idx+1)/4)
    # The D974/D164 fork and timber restaurant where the forest ends.
    at,h=site(k,1758,-16)
    art.box(at(0,-4.8,-.22),(26,9.6,5.05),h,wood)
    art.roof(at(0,-4.8,4.76),26,10,3.15,h,wood)
    panel(chalet,[at(x,.04,z) for x,z in ((-13,0),(13,0),(13,7.9),(-13,7.9))],.673,0)
    panel(chalet,[at(-13.02,v,z) for v,z in ((-9.5,0),(0,0),(0,7.8),(-9.5,7.8))],.675,1)
    for x in range(-10,11,3):
        art.box(at(x,2,.51),(1.9,1.04,.16),h,wood)
        for y in (1.2,2.8):art.box(at(x,y,.23),(1.85,.34,.17),h,wood)
    for j,d in enumerate(range(320,8420,1000)):
        at,h=site(k,d,-3.7);card(signs,at,1.02,1.5,0,.25)
    for j,d in enumerate(range(4880,5040,2)):
        at,h=site(k,d,4.75)
        for row in range(3):
            art.box(at((row%2)*.50,0,row*.29-.17),(1.90,.81-row*.13,.34),h,lin((0xADA99A,0xAFAB9D,0xBDB7A9)[(j+row)%3]))
    # A stele over a flight of steps with flowers, bidons and caps left by riders.
    at,h=site(k,6860,7.4)
    for i in range(6):
        art.box(at(0,-2.1+i*.51,-.25),(3.65,.58,.27+i*.22),h,stone)
    art.box(at(0,1.3,.79),(3.8,2,.57),h,cream)
    art.box(at(0,1.3,1.29),(1.04,.46,2.33),h,stone)
    panel(signs,[at(x,1.02,z) for x,z in ((-.92,1.27),(.92,1.27),(.92,3.99),(-.92,3.99))],.607,.248)
    # The portrait and tributes face the arriving riders on the lower side of the steps.
    panel(signs,[at(-.535,v,z) for v,z in ((2.22,1.27),(.38,1.27),(.38,3.99),(2.22,3.99))],.248,.607)
    for i in range(15):
        dx=k.rng.uniform(-1.5,1.5);y=k.rng.uniform(.44,1.02);c=lin((0xAC403A,0xCFAC4B,0x4D718D,0xE6E1D0)[i%4])
        art.tube(at(dx,y,1.34),.074,.06,.23,c,c,7,cap=c)
    # The actual observatory remains on its summit site throughout the climb.
    at,h=site(k,8325,16)
    def block(u,v,z,w,l,high,c):
        corners=[at(u+x,v+y,z) for x,y in ((-w/2,-l/2),(w/2,-l/2),(w/2,l/2),(-w/2,l/2))]
        tops=[(x,y,a+high) for x,y,a in corners]
        for i in range(4):
            n=(i+1)%4
            pts=(corners[i],corners[n],tops[n],tops[i])
            mast.faces.append(tuple(mast.v(p) for p in pts));mast.colours.extend((tuple(t*.70 for t in c[:3])+(1,),)*2+(c,c));mast.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
        mast.faces.append(tuple(mast.v(p) for p in tops));mast.colours.extend((c,)*4);mast.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
    block(0,0,-.45,28,13,6.4,cream);block(0,0,5.9,11.2,9.8,17,cream)
    block(0,0,22.8,12.3,10.6,2.4,iron);block(0,0,25,10.7,9.2,1.8,cream)
    for i in range(10):
        w=2.1-i*.16;block(0,0,26.7+i*3.42,w,w,3.44,red if i%2==0 else white)
    # Open observing deck over the shaft and antenna hardware below the red tip.
    for level in (7.8,12.2,16.5,20.8):
        for dx in (-3.25,0,3.25):block(dx,-4.95,level,1.15,.18,1.9,iron)
    block(0,0,24.7,12.55,10.9,.35,cream)
    for j in range(7):
        block(-5.4+j*1.8,-5.39,23,.16,.2,1.6,cream)
    for j in range(4):block(0,0,30+j*6.2,2.45-j*.32,2.45-j*.32,.27,iron)
    for dx in (-6.1,7.4):
        block(dx,-2,6,.19,.19,5.4,iron)
        for j in range(3):block(dx,-2,9+j*.72,1.6-j*.23,.13,.11,iron)
    # Checker-painted summit retaining wall and observation terrace.
    for j in range(10):block(-19+j*3.6,-9,-.1,3.48,.72,.79,stone)
    for j in range(8):
        block(-11+j*3.1,-6.55,2.1,1.55,.13,1.75,iron)
    for j,d in enumerate((8120,8160,8240)):
        at,h=site(k,d,-6.7);c=lin((0x5E7181,0x933F3C,0xCBC6B7)[j])
        art.box(at(0,0,.30),(4.15,1.7,.65),h,c);art.box(at(-.22,0,.89),(2.14,1.52,.61),h,lin(0x637680))
    at,h=site(k,8260,-4.0);card(signs,at,2.9,2.35,.611,1)
    for j in range(80):
        a=j*math.tau/80;b=(j+1)*math.tau/80;u=j%20/20;v=u+.05
        if j//20%2:u,v=1-u,1-v
        def e(t,z):return 3100+8200*math.cos(t),7800*math.sin(t),z
        panel(vista,(e(a,-4300),e(b,-4300),e(b,6800),e(a,6800)),u,v)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.1,'terrain':{'sea':False},'land':{'mid':0xD4D0C2},'sky':[0xCED7DA,0xAEC6D8,0x80ABCE,0x558BBF,0x376EA6],'haze':0xC8D0CE,'light':[0xFFF1D4,1.48],'fill':[0xCDDEEC,0xB1AA91],'sun_altitude':.87,'sun_azimuth':-.85}
