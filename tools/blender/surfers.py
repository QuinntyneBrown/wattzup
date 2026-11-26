"""The Esplanade, Cavill Avenue and the Gold Coast beachfront."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 5], [800.0, 2.0628], [1200.0, 1.6342], [1600.0, 0.5816], [2000.0, 0.569], [2400.0, -0.4836], [3200.0, -0.0928], [3450.0, 0.6793], [4250.0, 1.0701], [4500.0, 1.8422], [5300.0, 2.233], [5550.0, 3.0051], [6350.0, 3.3959], [6600.0, 4.168], [7400.0, 2.0628], [8200.0, 2.4536], [8450.0, 3.2257], [9250.0, 3.6165], [9500.0, 4.3886], [10300.0, 4.7794], [10550.0, 5.5515], [11350.0, 5.9423], [11600.0, 6.7144], [12400.0, 7.1052], [13200.0, 5.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    inland=.59*max(0,1-abs(d-11980)/380)
    return .065*math.sin(d/613)+.041*math.sin(d/193)+inland

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    asphalt=bc.Builder('EsplanadeRoad','terrain');asphalt.colours=[];asphalt.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        picture(asphalt,[r.at(j,v,.042) for j,v in ((i,-4.2),(i+1,-4.2),(i+1,4.2),(i,4.2))],((0,0),(1,0),(1,1),(0,1)))
    asphalt.build(col)

def land(r,col,theme,bc):
    sand=bc.Builder('GoldSand','terrain');sand.colours=[];sand.uvs=[];sea=bc.Builder('PacificSwell','terrain');sea.colours=[];sea.uvs=[];last=None
    for i in range(0,len(r.s),3):
        p=r.s[i];row=[]
        for v in (260,33,8,0,-9,-16,-26,-47,-62,-71,-96,-140,-800):
            z=-.13 if v>=-16 else max(-3.86,(v+16)*.07)
            x,y,h=r.at(i,v,z);row.append((x,y,h))
        if last:
            for j,(a,b,c,e) in enumerate(zip(last,last[1:],row[1:],row)):
                pts=(a,e,c,b);picture(sand if j<9 else sea,pts,[(x/9,y/9) for x,y,h in pts])
        last=row
    sand.build(col);sea.build(col);return None,lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.13

def scenery(k):
    art=Painted(k);sides=pictured(k,'GoldBalconies');green=pictured(k,'ForeshorePalms');rim=pictured(k,'PacificRim');arch=pictured(k,'CavillArch')
    cream,concrete,rail,glass,slate,red,yellow,blue=map(lin,(0xE9E7D7,0xB4BAB5,0x8A999B,0x91B9C5,0x53666B,0xC24C43,0xE4B646,0x486D87))
    def tower(d,v,w,dep,ht,i):
        at,h=site(k,d,v);art.box(at(0,0,.04),(w,dep,ht),h,glass);u=i/4
        for z0 in range(0,math.ceil(ht),16):
            z1=min(ht,z0+16)
            for side in (-1,1):
                for pts in ([at(x,side*(dep/2+.036),z) for x,z in ((-w/2,z0),(w/2,z0),(w/2,z1),(-w/2,z1))],[at(side*(w/2+.036),y,z) for y,z in ((-dep/2,z0),(dep/2,z0),(dep/2,z1),(-dep/2,z1))]):
                    picture(sides,pts,((u,0),(u+.249,0),(u+.249,1),(u,1)))
        art.box(at(0,0,ht),(w+.49,dep+.49,.54),h,cream)
    for j,d in enumerate(range(-60,13270,43)):
        if 12660<d<13100 or 2330<d<2430:continue
        w=18+(j*5)%9;dep=15+j%5;ht=24+(j*23)%52
        tower(d,18+dep/2,w,dep,ht,j%4)
        if j%2==0:tower(d+17,65,20,18,55+j*11%71,(j+1)%4)
    # The tapered Q1 crown and slender mast stay fixed behind the foreshore.
    tower(2422,36,24,22,124,1);at,h=site(k,2422,36)
    for v in (-11.07,11.07):art.face([at(x,v,z) for x,z in ((-12,124),(12,124),(12,144),(-12,131))],(glass,glass,cream,glass))
    for u,z in ((-12,131),(12,144)):
        beam(art,at(u,-11,124),at(u,-11,z),.34,cream);beam(art,at(u,-11,z),at(u,11,z),.34,cream)
    beam(art,at(-12,-11,131),at(12,-11,144),.33,cream)
    art.tube(at(10,0,125),.64,.22,31,rail,yellow,10);art.tube(at(10,0,156),.22,.024,13,yellow,cream,8)
    for j,d in enumerate(range(-20,13250,15)):
        at,h=site(k,d)
        for v in (-4.33,4.33):art.box(at(0,v,.02),(15,.22,.16),h,concrete)
        art.box(at(0,-7.1,.05),(15,3.3,.11),h,concrete);art.box(at(0,7,.05),(15,4.9,.11),h,concrete)
        art.box(at(0,0,.052),(4.2,.105,.014),h,cream)
        if j%2==0:
            for v,t,ht,w in ((-10.4,j%2+(j//2)%2,9.7+j%4,6.7),(-14.8,2+j%2,3.1+j%2,4.4)):
                for phi in (.45,2.02):
                    dx=w/2*math.cos(phi);dy=w/2*math.sin(phi);u=t/4
                    picture(green,[at(x,v+y,z) for x,y,z in ((-dx,-dy,-.13),(dx,dy,-.13),(dx,dy,ht),(-dx,-dy,ht))],((u,0),(u+.25,0),(u+.25,1),(u,1)))
        if j%5==0:
            v=3.24;paint=lin((0x688696,0xC7C2AF,0xB75550,0x55746F)[j%4])
            art.box(at(0,v,.28),(4,1.56,.63),h,paint);art.box(at(.04,v,.91),(2.12,1.42,.48),h,glass);art.box(at(.04,v,1.4),(1.91,1.34,.11),h,paint)
            for x in (-1.28,1.28):
                for side in (-1,1):art.box(at(x,v+side*.78,.13),(.54,.12,.41),h,slate)
        if 12630<d<13110:
            for v in (5.78,7.21):art.box(at(0,v,.177),(15,.085,.021),h,rail)
            if j%3==0:
                art.tube(at(0,9.3,.16),.093,.066,5.92,rail,rail,8)
                beam(art,at(0,9.3,6.02),at(0,6.5,6.02),.044,slate);beam(art,at(0,6.5,6.02),at(45,6.5,6.02),.02,slate)
    at,h=site(k,6662,-10.8)
    for post in (-1,1):
        beam(art,at(post*5.4,-1,.14),at(post*6.8,0,6.5),.14,rail)
        beam(art,at(post*5.4,1,.14),at(post*6.8,0,6.5),.108,rail)
    for rise in (0,.71):
        for j in range(18):
            def pin(n):
                x=-6.5+13*n/18;return at(x,0,5.02+rise+.60*(1-(x/6.5)**2))
            beam(art,pin(j),pin(j+1),.106,rail)
            if j%2==0:beam(art,pin(j),at(-6.5+13*j/18,0,pin(j)[2]-at(0,0)[2]+.71),.064,rail)
    picture(arch,[at(x,.07,z) for x,z in ((-6.5,5.0),(6.5,5.0),(6.5,6.35),(-6.5,6.35))],((0,0),(1,0),(1,1),(0,1)))
    for d in (4450,9068,9168):
        at,h=site(k,d,-25);art.tube(at(0,0,-.62),.077,.059,3.88,cream,cream,8)
    at,h=site(k,9078,-18)
    for x in (-1.45,1.45):
        for v in (-1.21,1.21):art.box(at(x,v,-.4),(.16,.16,2),h,cream)
    art.box(at(0,0,1.62),(3.5,3.0,1.63),h,yellow);art.box(at(0,0,2.54),(3.53,3.03,.67),h,glass);art.roof(at(0,0,3.25),4.1,3.55,.63,h,red)
    at,h=site(k,12914,11.5);art.box(at(0,0,.12),(38,3.7,.45),h,concrete)
    for x in range(-15,16,6):art.box(at(x,0,.57),(.16,.16,3.5),h,rail)
    art.box(at(0,0,4.03),(37,4.2,.26),h,cream)
    for j in range(64):
        a=math.tau*j/64;b=math.tau*(j+1)/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def edge(t,z):return 6500+11200*math.cos(t),9300*math.sin(t),z
        for z0,z1,t0,t1 in ((-1600,3300,0,1),(3300,21700,.999,1)):picture(rim,(edge(a,z0),edge(b,z0),edge(b,z1),edge(a,z1)),((u,t0),(v,t0),(v,t1),(u,t1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.2,'terrain':{'sea':False},'land':{'mid':0xC1BA94},'sky':[0xDBD9CB,0xB8D4DE,0x8DBFDA,0x75B0D3,0x5C9CC8],'haze':0xBED1D1,'light':[0xFFE0B0,1.45],'fill':[0xCBDEE5,0xBDAA88],'sun_altitude':.46,'sun_azimuth':-.94}
