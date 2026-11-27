import math,bisect
# Westward from the South Bank. Sweep around Parliament Square, up Whitehall,
# over the northern crossing and back along the South Bank to Westminster.
STREETS=[(-80,0),(730,0),(730,240),(1000,240),(1000,-205),(795,-205),(795,-1220),(650,-1480),(45,-1480),(-180,-1240),(-180,-530),(-25,-400),(-25,-90),(-220,-90),(-220,270),(-12,480),(90,240),(0,0),(620,0)]
def path():
    pts=[STREETS[0]]
    for a,b,c in zip(STREETS,STREETS[1:],STREETS[2:]):
        scale=min(46,math.dist(a,b)*.22,math.dist(b,c)*.22)
        def towards(p):
            n=math.dist(b,p);return tuple(b[i]+(p[i]-b[i])*scale/n for i in (0,1))
        left,right=towards(a),towards(c)
        pts.append(left)
        for j in range(1,17):
            t=j/16
            pts.append(tuple((1-t)**2*left[i]+2*t*(1-t)*b[i]+t*t*right[i] for i in (0,1)))
    pts.append(STREETS[-1])
    ds=[0]
    for a,b in zip(pts,pts[1:]):ds.append(ds[-1]+math.dist(a,b))
    return pts,ds
PTS,DS=path()
def centre(d):
    s=d+80;i=max(0,min(len(DS)-2,bisect.bisect_right(DS,s)-1));a,b=PTS[i:i+2]
    f=(s-DS[i])/(DS[i+1]-DS[i])
    return a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1]),math.atan2(b[1]-a[1],b[0]-a[0])
from arenberg import beam
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin

PROFILE=[[0, 7], [190, 12], [420, 7], [790, 8], [1220, 11], [1950, 12], [2380, 10], [2930, 13], [3550, 10], [4100, 8], [4620, 6], [5110, 7], [5580, 9], [6120, 7], [6450, 8]]
def elev(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];r=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);dh=centre(d+1)[2]-centre(d-1)[2]
        r.append(dict(d=d,x=x,y=y,z=elev(d),h=h,k=math.atan2(math.sin(dh),math.cos(dh))/2,g=100*(elev(d+.5)-elev(d-.5))))
    return r,st,length,sum(s['level']*(s['to']-s['from']) for s in st)/length,1

def road(r,st,length,col,bc):
    for name,sections in (('LondonAsphalt',[(-9.4,4,.05)]),('LondonBusLane',[(4,7.4,.055)]),('LondonPaving',[(-13,-9.4,.18),(7.4,11.4,.18)])):
        mesh=bc.Builder(name,'terrain');mesh.colours=[];mesh.uvs=[]
        for i in range(len(r.s)-1):
            for a,b,z in sections:
                pts=[r.at(j,v,z) for j,v in ((i,a),(i+1,a),(i+1,b),(i,b))]
                picture(mesh,pts,[(x/4,y/4) for x,y,_ in pts])
        mesh.build(col)
def on_land(x,y):
    return x<7 or x>392
def land(r,col,theme,bc):
    mesh=bc.Builder('LondonBanks','terrain');mesh.colours=[];mesh.uvs=[]
    for d in range(-80,6540,6):
        x,y,h=centre(d)
        if not on_land(x,y):continue
        for a,b in ((-85,0),(0,85)):
            pts=[r.pos(t,v,-.15) for t,v in ((d,a),(d+6,a),(d+6,b),(d,b))]
            picture(mesh,pts,[(x/8,y/8) for x,y,_ in pts])
    return mesh.build(col),lambda x,y:elev(r.s[r.tree.find((x,y,0))[1]]['d'])-.16
def scenery(k):
    art=Painted(k);river=pictured(k,'ThamesWater');palace=pictured(k,'WestminsterStone');county=pictured(k,'CountyHall');people=pictured(k,'LondonTourists');clocks=pictured(k,'BigBenFace')
    stone,light,gold,iron,green,cream,coal,red,lamp,bronze,slate,lawn=map(lin,(0xB2966A,0xE4CCA1,0xF1BF64,0x41474A,0x46786C,0xDBD2BB,0x373944,0xB93737,0xFFDC96,0x69675B,0x555B64,0x688054))
    def panel(m,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(m,pts,((a,b),(c,b),(c,e),(a,e)))
    for x in range(-10,410,20):
        for y in range(-1900,920,40):
            pts=((x,y,1),(x+20,y,1),(x+20,y+40,1),(x,y+40,1))
            picture(river,pts,[(a/22,b/22) for a,b,_ in pts])
    # The seven segmental arches spring from independent stone piers above the river.
    for j in range(7):
        cx=25+j*53.2
        for side in (-13.2,11.6):
            for n in range(16):
                u=n/16;v=(n+1)/16
                a=cx+53.2*u;b=cx+53.2*v
                floor=lambda t:2.0+5.1*math.sin(math.pi*t)**.72
                art.face(((a,side,floor(u)),(b,side,floor(v)),(b,side,elev(b)-.15),(a,side,elev(a)-.15)),(green,green,green,light))
                beam(art,(a,side,floor(u)),(b,side,floor(v)),.22,green)
        art.box((cx,-.8,.32),(5.4,26.1,3.9),0,stone)
    for j,d in enumerate(range(-34,6501,4)):
        x,y,h=centre(d);bridge=13<x<407
        if bridge:
            for side in (-12.85,11.24):
                at,_=site(k,d,side)
                for z in (.25,1.21):beam(art,at(0,0,z),k.road.pos(d+4,side,z),.093,green)
                for n in range(4):
                    beam(art,at(n,0,.29),at(n+.48,0,1.13),.055,green)
                    beam(art,at(n+.48,0,1.13),at(n+1,0,.29),.055,green)
        if j%8==0:
            for side in (-12,10.55):
                at,_=site(k,d,side);ht=4.9 if bridge else 5.9
                art.tube(at(0,0,.12),.21,.10,ht,green if bridge else iron,iron,9)
                for arm in ((-.72,0,.72) if bridge else (0,)):
                    beam(art,at(0,0,ht-.87),at(0,arm,ht+.13),.088,green if bridge else iron)
                    art.tube(at(0,arm,ht+.13),.14,.33,.42,lamp,lamp,6)
                    art.tube(at(0,arm,ht+.55),.34,.04,.25,iron,iron,6)
        if j%4==1:
            at,_=site(k,d,9.32 if j%3 else -11.08);idx=(j//4)%4
            panel(people,[at(0,y,z) for y,z in ((1.5,.18),(-1.5,.18),(-1.5,2.12),(1.5,2.12))],(idx/4,0,(idx+1)/4,1))
        if j%3==0:
            at,h=site(k,d)
            for v in (-6.3,-2.6,4):art.box(at(0,v,.068),(3.1,.14,.014),h,cream)
        if not bridge and j%10==0 and (d<100 or 530<d<4100):
            at,h=site(k,d,-24-j%5)
            art.box(at(0,-6,-.15),(38,11.7,14+j%7),h,stone)
            panel(county,[at(x,0,z) for x,z in ((-19,0),(19,0),(19,18+j%7),(-19,18+j%7))],(0,0,1,.5))
        if j%97==3 and not bridge:
            at,h=site(k,d,8.6)
            art.box(at(0,0,.18),(1.05,1.05,2.38),h,red)
            art.box(at(0,-.535,.57),(.75,.025,1.54),h,iron)
            for z in (.9,1.25,1.6,1.94):art.box(at(0,-.558,z),(.81,.04,.055),h,red)
            art.box(at(0,-.56,2.22),(.78,.05,.22),h,cream)
        if 760<d<1470 and j%9==0:
            at,h=site(k,d,19);art.box(at(0,0,0),(34,23,.21),h,lawn)
            if j%27==0:
                art.box(at(0,0,.21),(2.6,2.6,1.8),h,stone);art.tube(at(0,0,2),.63,.39,1.71,bronze,bronze,8);art.tube(at(0,0,3.71),.26,.24,.47,bronze,bronze,8)
    # Parliament Square Gardens has a larger paved plinth and the standing bronze
    # facing the traffic. Railings, trees and a paved walk give the lawn depth.
    at,h=site(k,1246,19)
    art.box(at(0,8,.08),(72,32,.26),h,lawn)
    art.box(at(0,0,.31),(4.3,3.6,.47),h,light)
    art.box(at(0,0,.78),(2.8,2.37,2.2),h,stone)
    for side in (-1,1):
        beam(art,at(side*.22,0,3),at(side*.18,0,4.27),.21,bronze)
        beam(art,at(side*.31,0,4.94),at(side*.57,-.21,4.25),.155,bronze)
    art.tube(at(0,0,4.02),.54,.39,1.08,bronze,bronze,9)
    art.tube(at(0,0,5.1),.24,.25,.43,bronze,bronze,9)
    for x in range(-32,37,4):
        beam(art,at(x,-3,.2),at(x,-3,1.28),.06,iron)
        beam(art,at(x,-3,1.1),at(x+4,-3,1.1),.046,iron)
    for d in (680,1230,2375,4110):
        at,h=site(k,d)
        for x in range(-4,5,2):art.box(at(x,0,.09),(.8,15,.014),h,cream)
        for side in (-10.4,8.4):
            art.tube(at(0,side,.14),.10,.09,3.5,iron,iron,8)
            art.box(at(0,side,2.7),(.35,.4,.95),h,coal)
            art.tube(at(-.19,side,3.19),.13,.13,.13,lamp,lamp,8)
            for n in range(6):
                a=at(-8-n*3,side*.78,.084);b=at(-11-n*3,side*.78+.42*(-1)**n,.084);beam(art,a,b,.047,cream)
    # Elizabeth Tower and the long river elevation are fixed to the west abutment.
    tx,ty=456,25
    for z,w,height,c in ((7,15,3,stone),(10,13.2,41,stone),(51,14.6,2,gold),(53,13.5,9,light),(62,14.5,1.65,gold),(63.7,11.6,6.5,stone)):
        art.box((tx,ty,z),(w,w,height),0,c)
    for n in range(6):
        v=-5.3+n*2.12
        for side in (-1,1):
            art.box((tx+side*6.68,ty+v,16),(.22,.49,32),0,light)
            art.box((tx+v,ty+side*6.68,16),(.49,.22,32),0,light)
    for side in (-1,1):
        for swap in (False,True):
            def face(u,z):
                a=side*6.82;b=u*side
                return (tx+(b if swap else a),ty+(a if swap else b),z)
            panel(clocks,[face(u,z) for u,z in ((-4.2,53.3),(4.2,53.3),(4.2,61.7),(-4.2,61.7))])
    art.tube((tx,ty,70),8.1,3.05,12.4,slate,slate,4)
    art.tube((tx,ty,82.4),3,2.4,4.1,gold,stone,8);art.tube((tx,ty,86.5),3.2,.13,9,slate,gold,8)
    for dx in (-6.5,6.5):
        for dy in (-6.5,6.5):art.tube((tx+dx,ty+dy,63),.83,.06,8.4,stone,gold,6)
    art.box((453,155,6),(33,236,20),0,stone)
    panel(palace,[(433,y,z) for y,z in ((32,6),(282,6),(282,43),(32,43))])
    for y in range(41,288,14):art.tube((433.2,y,26),1.7,.14,10,stone,gold,5)
    for y in range(-550,-325,10):
        art.box((-84,y,6),(29,10.1,18),0,stone)
    panel(county,[(-68,y,z) for y,z in ((-560,6),(-324,6),(-324,44),(-560,44))],(0,.5,1,1))
    for y in (-702,-672):
        beam(art,(-102,y,7),(-79,-687,67),1.48,cream)
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.6,'terrain':{'sea':False},'land':{'mid':0x615E62},'sky':[0xC79888,0xB49BA7,0x8E89A4,0x666B8C,0x474E70],'haze':0x9C929B,'light':[0xFFCF94,1.31],'fill':[0xCDC7D6,0x948B9A],'sun_altitude':.24,'sun_azimuth':-.81}
