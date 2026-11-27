"""The Tayelet from Gordon Pool to Old Jaffa."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 5.8], [1350.0, 5.5474], [1625.0, 5.8892], [2975.0, 5.6366], [3250.0, 5.9784], [4600.0, 5.7258], [4850.0, 6.0366], [6200.0, 5.784], [6425.0, 6.0636], [7775.0, 5.811], [7975.0, 6.0596], [9325.0, 5.807], [9500.0, 6.0245], [10700.0, 5.8]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):return .13*math.sin(d/384)+.078*math.sin(d/162)+.044*math.cos(d/79)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def shore(d):return 48+9*math.sin(d/152)+6*math.cos(d/318)
def sand(d,v):
    z=elevation(d);f=min(1,max(0,(-v-7)/(shore(d)-7)))
    return z-.19+(0.12-z)*f-max(0,-v-shore(d))*.14

def road(r,st,length,col,bc):
    m=bc.Builder('TayeletPaving','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        d=r.s[i]['d'];end=r.s[i+1]['d'];picture(m,[r.at(j,v,.041) for j,v in ((i,-7),(i+1,-7),(i+1,7),(i,7))],((-7,d),(-7,end),(7,end),(7,d)))
    m.build(col)

def land(r,col,theme,bc):
    bed=bc.Builder('LevantSand','terrain');sea=bc.Builder('LevantSea','terrain');wash=bc.Builder('SeaWash','terrain')
    for m in (bed,sea,wash):m.colours=[];m.uvs=[]
    last=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];s=shore(d);row=[]
        for v in (-s-12,-s,-s*.72,-15,-7,0,8,20,60,180):
            x,y,_=r.at(i,v);row.append((x,y,sand(d,v)))
        water=[(*r.at(i,v)[:2],0) for v in (-s+1,-s-18,-s-85)]
        water.append((water[-1][0],-3200,0))
        surf=[(*r.at(i,v)[:2],.07) for v in (-s-.3,-s-5.8)]
        if last:
            for a,b,c,e in zip(last[0],last[0][1:],row[1:],row):
                pts=(a,e,c,b);picture(bed,pts,[(x*.25,y*.25) for x,y,z in pts])
            for j in range(3):
                pts=(last[1][j],water[j],water[j+1],last[1][j+1]);picture(sea,pts,[(j/3,0),(j/3,1),((j+1)/3,1),((j+1)/3,0)])
            picture(wash,(last[2][0],surf[0],surf[1],last[2][1]),((0,last[3]/10),(0,d/10),(1,d/10),(1,last[3]/10)))
        last=row,water,surf,d
    sea.build(col);wash.build(col)
    return bed.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.19

def scenery(k):
    cafe=pictured(k,'TayeletCafe');art=Painted(k);facade=pictured(k,'TelAvivHotels');palms=pictured(k,'DatePalms');jaffa=pictured(k,'JaffaStone');pool=pictured(k,'GordonPool');sky=pictured(k,'WesternSky')
    cream,stucco,wood,steel,gold,blue,red,stone,leaf=map(lin,(0xE6D4BB,0xC6BBAC,0x977E61,0x656D73,0xF1D7A1,0x567D8D,0xA3594A,0x9F988C,0x757C51))
    def panel(group,pts,idx=0,cols=1):
        u=idx/cols;v=(idx+1)/cols;picture(group,pts,((u+.0005,0),(v-.0005,0),(v-.0005,1),(u+.0005,1)))
    def palm(at,h,w,ht,j):
        for angle in (.03,1.54):
            dx=w*.5*math.cos(angle);dy=w*.5*math.sin(angle);panel(palms,[at(x,y,z) for x,y,z in ((-dx,-dy,0),(dx,dy,0),(dx,dy,ht),(-dx,-dy,ht))],j%4,4)
    for j,d in enumerate(range(-50,10790,17)):
        at,h=site(k,d)
        for v in (-6.66,6.78):art.box(at(0,v,-.05),(17.1,.21,.19),h,cream)
        if j%2==0:
            side=-1 if j%4==0 else 1;at,h=site(k,d,side*6.1);palm(at,h,7.5+k.rng.random()*2,10+j%6,j//2)
            if j%4==0:
                at,h=site(k,d+7,5.8);art.tube(at(0,0,.04),.134,.09,6.8,steel,steel,8)
                for v in (-1,1):
                    beam(art,at(0,0,6.3),at(.26,v*1.15,6.94),.075,steel);art.box(at(.26,v*1.15,6.91),(.66,.31,.095),h,gold)
        if j%3==0:
            at,h=site(k,d+4,-5.8);art.box(at(0,0,.46),(2.25,.62,.13),h,wood);art.box(at(0,-.27,.55),(2.25,.12,.50),h,wood)
            for u in (-.78,.78):art.box(at(u,0,0),(.12,.43,.53),h,steel)
        if d<10040 and j%2==0:
            centre=36+4*math.sin(d/57);at,h=site(k,d,centre);ht=16+(j*7%8)*3.7;w=28+j%6;dep=15
            art.box(at(0,0,-.2),(w,dep,ht),h,stucco)
            for v in (-dep*.5-.04,dep*.5+.04):
                panel(facade,[at(x,v,z) for x,z in ((-w/2,.05),(w/2,.05),(w/2,ht),(-w/2,ht))],j//2%4,4)
            for u in (-w/2-.04,w/2+.04):panel(facade,[at(u,v,z) for v,z in ((-dep/2,0),(dep/2,0),(dep/2,ht),(-dep/2,ht))],(j//2+1)%4,4)
            for f in range(1,int(ht/3.1),2):art.box(at(0,-7.68,f*3.1),(w+.33,.87,.19),h,cream)
        if j%11==0 and d<9800 and not 6360<d<6650:
            at,h=site(k,d,-18);base=sand(d,-18)-elevation(d)
            for u in (-2.4,2.4):
                for v in (-1.8,1.8):art.box(at(u,v,base),(.2,.2,2.52),h,wood)
            art.box(at(0,0,base+2.1),(5.3,4.1,.18),h,wood);art.box(at(0,0,base+2.27),(4.6,3.5,1.80),h,cream)
            art.box(at(-2.34,0,base+3.05),(.11,2.8,.72),h,blue);art.roof(at(0,0,base+4.07),5.3,4.04,.9,h,red)
    # Gordon Pool lies inside the marina, with lane dividers between two pale tile decks.
    at,h=site(k,2133,-25);z=sand(2133,-25)-elevation(2133)
    art.box(at(0,0,z),(52,24,1.16),h,cream)
    panel(pool,[at(u,v,z+1.18) for u,v in ((-24,-10),(24,-10),(24,10),(-24,10))])
    for v in range(-8,10,3):
        for j in range(16):beam(art,at(-24+j*3,v,z+1.22),at(-21+j*3,v,z+1.22),.076,(blue,cream,red,cream)[j%4])
    for d in (2117,2170):
        at,h=site(k,d,-shore(d)-9)
        art.box((at(0,0)[0],at(0,0)[1],.61),(19,2,.37),h,wood)
    for d in (2100,2750,4350,6380,8480):
        for j in range(36):
            at,h=site(k,d+j*2.4,-shore(d)-33-j*.39);x,y,z=at(0,0)
            art.tube((x,y,-.37),2.9,1.75,1.65+(j%3)*.19,stone,stone,7,cap=stone)
    for d in (4240,4280,4330):
        at,h=site(k,d,-22);base=sand(d,-22)-elevation(d)
        for v in (-5,5):
            art.tube(at(v*.67,v*.74,base),.11,.105,2.65,blue,blue,8)
        for n in range(5):beam(art,at(-3.35,-3.7,base+1.65+n*.23),at(3.35,3.7,base+1.65+n*.23),.043 if n<4 else .072,gold if n==4 else cream)
        for v in range(-5,6):beam(art,at(v*.67,v*.74,base+1.65),at(v*.67,v*.74,base+2.59),.030,cream)
        for u in (-8,8):beam(art,at(u,-5,base+.06),at(u,5,base+.06),.06,blue)
    for j,d in enumerate(range(6360,6746,13)):
        at,h=site(k,d,-14);base=sand(d,-14)-elevation(d)
        for u in (-4.9,4.9):
            for v in (-2.7,2.7):art.box(at(u,v,base),(.19,.19,3.3),h,wood)
        for n in range(-6,7):art.box(at(n*.84,0,base+3.35),(.55,6,.16),h,wood)
        at,h=site(k,d,-23);base=sand(d,-23)-elevation(d)
        art.tube(at(0,0,base),.068,.055,2.17,wood,wood,7)
        art.tube(at(0,0,base+2.1),2.16,.17,.88,(cream,red,blue)[j%3],cream,10,cap=cream)
        for v in (-1.1,1.1):art.box(at(0,v,base+.26),(2.06,.72,.15),h,cream)
    for d in (6506,6556):
        at,h=site(k,d,-16);base=sand(d,-16)-elevation(d)
        panel(cafe,[at(-3.7,v,z+base) for v,z in ((-7,0),(7,0),(7,4.6),(-7,4.6))])
    # Static headland and the church and clock towers sit beyond the curving southern path.
    at,h=site(k,10565,-26);art.box(at(0,0,-1.7),(41,58,2.12),h,stone)
    panel(jaffa,[at(0,v,z) for v,z in ((-49,.13),(49,.13),(49,30),(-49,30))])
    at,h=site(k,10588,9);art.box(at(0,0,0),(4.8,4.8,16.4),h,cream);art.box(at(0,0,16.4),(5.34,5.34,.6),h,stucco)
    art.roof(at(0,0,17),5.2,5.2,3,h,red)
    for j in range(96):
        a=math.pi*(1+j/48);b=math.pi*(1+(j+1)/48);u=j/96;v=(j+1)/96
        def e(t,z):return 5200+10800*math.cos(t),11200*math.sin(t),z
        picture(sky,(e(a,-570),e(b,-570),e(b,3800),e(a,3800)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':1.95,'terrain':{'sea':False},'land':{'mid':0xBBAB92},'sky':[0xE8C6A4,0xE2C8B8,0xC7C6CD,0xA4B6CC,0x8CA6C5],'haze':0xDBC8B3,'light':[0xFFE1AC,1.46],'fill':[0xE6D2C6,0xAC998A],'sun_altitude':.31,'sun_azimuth':-1.33}
