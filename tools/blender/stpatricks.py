"""O’Connell Street on parade day, from the Luas tracks to the Liffey."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 8], [2125.0, 11.2527], [2375.0, 12.1754], [3500.0, 10.6575], [3750.0, 11.5801], [4687.5, 10.3152], [4937.5, 11.2378], [5875.0, 9.9729], [6125.0, 10.8956], [6875.0, 9.8836], [7125.0, 10.8063], [7875.0, 9.7943], [8125.0, 10.717], [8687.5, 9.958], [8937.5, 10.8807], [9500.0, 10.1217], [9750.0, 11.0444], [12006.25, 8.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):return .082*math.sin(d/730)+.033*math.sin(d/245)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    pavement=bc.Builder('DublinWetRoad','terrain');pavement.colours=[];pavement.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        picture(pavement,(r.at(i,-9,.025),r.at(i+1,-9,.025),r.at(i+1,9,.025),r.at(i,9,.025)),((0,p['d']/7),(0,r.s[i+1]['d']/7),(1,r.s[i+1]['d']/7),(1,p['d']/7)))
    pavement.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('DublinGround','terrain');m.colours=[];prev=None
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];z=elevation(d);river=11802<d<11966
        row=[r.at(i,v,(-5.8 if river else -.08)) for v in (-860,-32,-10,10,32,860)]
        if prev:
            for a,b,c,e in zip(prev,prev[1:],row[1:],row):
                m.quad(a,e,c,b);m.colours.extend((lin(0x536A73 if river else 0x959590),)*4)
        prev=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.08

def scenery(k):
    art=Painted(k);facades=pictured(k,'DublinShops')
    pale,granite,iron,bronze,chrome,curb,dark,green,white,orange=map(lin,(0xC8BFAE,0x989B99,0x44494A,0x415349,0xB7C1C2,0xADAAA3,0x41464A,0x237549,0xE2DED0,0xDF873D))
    for i,p in enumerate(k.s[:-1]):
        d=p['d'];bridge=11802<d<11966
        def strip(a,b,z,c):
            art.face((k.road.at(i,a,z),k.road.at(i+1,a,z),k.road.at(i+1,b,z),k.road.at(i,b,z)),(c,)*4)
        strip(-6.24,-6.14,.057,chrome);strip(-4.81,-4.71,.057,chrome)
        for side in (-1,1):
            strip(side*8.95,side*14.5,.21,curb)
            if bridge:strip(side*12.8,side*13.7,1.22,pale)
        if not bridge and i%16<13:strip(-2.72,-2.02,.15,granite)
    for j,d in enumerate(range(-45,12070,19)):
        at,h=site(k,d);bridge=11802<d<11966
        for side in (-1,1):
            if bridge:
                for u in range(0,19,2):
                    art.tube(at(u,side*13.1,.18),.285,.21,.97,pale,granite,6)
                continue
            if not (side==1 and 4265<d<4380):
                width=18.97;dep=7+(j%4);height=13+(j*7)%6;v=side*(17.3+dep/2)
                art.box(at(0,v,.08),(width,dep,height),h,granite)
                col=(j*7+side)%4;u=col/4
                picture(facades,[at(a,side*17.27,z) for a,z in ((-width/2,.23),(width/2,.23),(width/2,height),( -width/2,height))],((u+.0008,0),(u+.2492,0),(u+.2492,1),(u+.0008,1)))
                art.box(at(0,side*17.29,height-.16),(width,.42,.34),h,pale)
            if j%2==0:
                art.tube(at(0,side*9.55,.2),.14,.10,5.3,iron,iron,8)
                art.tube(at(0,side*9.55,5.48),.31,.20,.53,white,pale,8,cap=iron)
            if j%3==0:
                art.tube(at(6,side*12.1,.15),.28,.15,4.2,granite,dark,7)
                for n in range(4):
                    a=n*1.57+j;t=at(6+math.cos(a)*2.5,side*12.1+math.sin(a)*2.4,6.15)
                    beam(art,at(6,side*12.1,2.9),t,.14,granite)
                    art.tube(t,1.1,1.8,1.55,lin(0x788165),lin(0x96A17A),6,cap=lin(0xA8AF89))
            if j%2==0 and any(abs(d-x)<145 for x in (120,2180,4290,6580,8710,11790)):
                for u in range(0,18,3):
                    for z in (.36,1.19):beam(art,at(u,side*8.25,z),at(u+2.89,side*8.25,z),.048,chrome)
                    for s in (0,.46,.92,1.38,1.84,2.3,2.76):
                        beam(art,at(u+s,side*8.25,.19),at(u+s,side*8.25,1.18),.035,chrome)
            if j%4==0:
                art.tube(at(0,side*10.8,.22),.085,.065,8.6,dark,dark,7)
        if bridge:continue
        if j%4==0:
            beam(art,at(0,-10.8,8.79),at(0,10.8,8.79),.025,dark)
            for t in range(19):
                v=t-9;z=8.33+.004*v*v
                art.face((at(0,v-.43,z),at(0,v+.43,z),at(.05,v,z-.71)),((green,white,orange)[t%3],)*3)
        if j%9==0:beam(art,at(0,-5.47,6.6),at(171,-5.47,6.6),.022,iron)
    at,h=site(k,2234,4.1)
    art.tube(at(0,0,.12),4.1,3.8,.24,granite,pale,28,cap=pale)
    for z,r0,r1,l in ((.36,1.5,1.39,13),(13.36,1.39,.98,38),(51.36,.98,.51,40),(91.36,.51,.075,28.7)):
        art.tube(at(0,0,z),r0,r1,l,lin(0x919CA0),lin(0xD2D8D8),24,cap=chrome)
    at,h=site(k,4321,22)
    art.box(at(0,3,0),(84,13,14),h,pale)
    for x in range(-39,40,4):
        for z in (2.4,6.1,10.3):
            art.box(at(x,-3.56,z),(1.67,.15,2.38),h,dark)
            art.box(at(x,-3.7,z-.11),(2.03,.40,.21),h,granite)
    for v,z,dep in ((-9,.16,3.8),(-8.6,.43,3.5),(-8.2,.69,3.1)):
        art.box(at(0,v,z),(33,dep,.27),h,pale)
    for i in range(6):
        u=-13.5+i*5.4
        art.tube(at(u,-8.65,.92),.78,.66,7.9,pale,granite,16)
        art.box(at(u,-8.65,8.76),(1.86,1.86,.45),h,pale)
        for dx in (-.73,.73):art.tube(at(u+dx,-8.65,8.65),.26,.26,.58,granite,pale,8)
    art.box(at(0,-7.15,9.18),(34,6.15,1.27),h,pale)
    art.face((at(-17,-10.25,10.44),at(17,-10.25,10.44),at(0,-10.25,14.3)),(granite,pale,pale))
    for u in (-15,0,15):art.tube(at(u,-8,12.25),.055,.04,5.8,iron,iron,6)
    at,h=site(k,4320,-16.3);art.box(at(0,0,4.23),(1.2,1.1,.22),h,iron)
    art.tube(at(0,.5,4.46),.48,.44,.91,iron,iron,10)
    # Freestanding bronze figure on a stepped drum above the bridge approach.
    at,h=site(k,11813,4.6)
    for z,rad,ht,tint in ((.14,2.65,.38,granite),(.52,2.24,.86,pale),(1.38,1.59,3.12,granite),(4.5,1.83,.43,pale)):
        art.tube(at(0,0,z),rad,rad*.91,ht,tint,tint,12,cap=tint)
    art.tube(at(0,0,4.92),.66,.43,2.14,bronze,bronze,10)
    art.tube(at(0,0,7.0),.24,.22,.42,bronze,bronze,10,cap=bronze)
    beam(art,at(0,.38,6.68),at(.51,.68,6.26),.14,bronze)
    for d in (6525,8731):
        at,h=site(k,d,-13.2)
        for j in range(4):art.box(at(0,-j*.89,.2),(22,.9,(j+1)*.52),h,lin(0x627879))
        art.box(at(11,0,.22),(3.7,3.1,2.5),h,iron)
        for dx in (-.6,.6):beam(art,at(11+dx,-.3,2.74),at(11,0,4.02),.072,iron)
        art.box(at(11,0,3.99),(.61,.94,.43),h,dark)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':9,'terrain':{'sea':False},'land':{'mid':0x969899},'sky':[0xCAD1D1,0xB9C7CC,0xB4C5D2,0xABC1D1,0x91ACBF],'haze':0xBAC4C7,'light':[0xF2DFC4,1.34],'fill':[0xBFCFD7,0xA39E92],'sun_altitude':.57,'sun_azimuth':-.92}
