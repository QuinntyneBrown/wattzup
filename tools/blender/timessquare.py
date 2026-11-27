"""The Broadway bow tie and New Year's Eve viewing pens."""
import math
from worldkit import Painted,lin
from iten_landmarks import pictured,picture,site
from arenberg import beam

PROFILE = [[0, 17], [800.0, 16.371], [1200.0, 16.1846], [1625.0, 16.2584], [2075.0, 16.5526], [2475.0, 16.1741], [2925.0, 16.3243], [3325.0, 15.9459], [3775.0, 16.0961], [4175.0, 15.7176], [4675.0, 16.2845], [5125.0, 16.4347], [5625.0, 17.0016], [6075.0, 17.1518], [6575.0, 17.7187], [6975.0, 17.3402], [7400.0, 17.4141], [7800.0, 17.0356], [8300.0, 17.4425], [8700.0, 17.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    # Broadway crosses the grid at a shallow angle and straightens toward the ball.
    ease=lambda a,b:min(1,max(0,(d-a)/(b-a)))
    return .14*ease(1750,2060)-.32*ease(2940,3190)+.29*ease(3650,4020)-.11*ease(5480,5910)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    mesh=bc.Builder('BroadwayAsphalt','terrain');mesh.colours=[];mesh.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];e=r.s[i+1]['d']
        picture(mesh,[r.at(j,v,.052) for j,v in ((i,-9.5),(i+1,-9.5),(i+1,9.5),(i,9.5))],((-9.5,d),(-9.5,e),(9.5,e),(9.5,d)))
    mesh.build(col)

def land(r,col,theme,bc):
    mesh=bc.Builder('BroadwaySidewalk','terrain');mesh.colours=[];mesh.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b in ((-220,-9.5),(9.5,220)):
            pts=[r.at(j,v,.12) for j,v in ((i,a),(i+1,a),(i+1,b),(i,b))]
            picture(mesh,pts,[(x/4,y/4) for x,y,z in pts])
    return mesh.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']

def scenery(k):
    art=Painted(k);glass=pictured(k,'MidtownFacades');ads=pictured(k,'BroadwayLED')
    crowds=pictured(k,'WinterCrowds');cops=pictured(k,'PlazaOfficers');signs=pictured(k,'PlazaSigns')
    grey,steel,night,paint,gold,blue,red=map(lin,(0x484957,0x56616B,0x202532,0xCCC3B0,0xB29A54,0x42648A,0xDF393E))
    def panel(m,pts,idx=0,nx=1,ny=1):
        u=idx%nx/nx;v=1-(idx//nx+1)/ny
        picture(m,pts,((u+.003,v+.003),(u+1/nx-.003,v+.003),(u+1/nx-.003,v+1/ny-.003),(u+.003,v+1/ny-.003)))
    def front(m,at,v,a,b,lo,hi,i,nx=1,ny=1):
        panel(m,[at(x,v,z) for x,z in ((a,lo),(b,lo),(b,hi),(a,hi))],i,nx,ny)
    def cutout(m,at,w,h,i):
        panel(m,[at(0,v,z) for v,z in ((-w/2,.13),(w/2,.13),(w/2,h+.13),(-w/2,h+.13))],i,4)
    for j,d in enumerate(range(-80,9020,22)):
        for sign in (-1,1):
            plaza=max(0,1-abs(d-3395)/210)
            side=sign*(21+plaza*(26 if sign<0 else 8)+k.rng.uniform(-2,4));at,h=site(k,d,side)
            high=k.rng.uniform(29,82);wide=k.rng.uniform(18.7,21.6)
            art.box(at(0,sign*7,.11),(wide,14,high),h,night)
            front(glass,at,-sign*.06,-wide/2,wide/2,.18,high,(j+sign)%4,4)
            if j%2==0 or 1250<d<2600 or d>6600:
                bottom=4.7+j%3;top=bottom+11+(j*7)%16;v=-sign*.46
                front(ads,at,v,-wide/2+.23,wide/2-.23,bottom,top,(j*5+sign)%8,4,2)
                if j%3==0:
                    panel(ads,[at(-wide/2,v,z) if q==0 else at(-wide/2,sign*6,z) for q,z in ((0,bottom),(1,bottom),(1,top),(0,top))],(j*5+sign)%8,4,2)
                if j%4==1:front(ads,at,v,-wide*.43,wide*.43,top+1,top+11,(j+2)%8,4,2)
            # Shoulder barriers support the raised blue rails, between the lane and spectators.
            at,h=site(k,d,sign*8.9)
            art.box(at(0,0,.73),(11,.11,.21),h,blue)
            for u in (-4.1,4.1):
                beam(art,at(u,-.4,.12),at(u,.15,.97),.075,steel);beam(art,at(u,.5,.12),at(u,-.15,.97),.075,steel)
            if j%3==0:
                front(signs,at,-sign*.1,-1.22,1.22,.67,.97,0,3)
            if j%24==0 or 4730<d<5750 and j%3==0:
                at,h=site(k,d+3,sign*8.1);cutout(cops,at,2.4,1.87,j%4)
            for i in range(3 if d>4700 else 2):
                off=sign*(10.7+i*1.3+k.rng.uniform(0,.7));at,h=site(k,d+3.6+i*6,off)
                cutout(crowds,at,3.25+k.rng.uniform(0,.7),1.79+k.rng.uniform(0,.21),(j+i+(sign+1))%4)
            if j%5==0:
                at,h=site(k,d,sign*13);art.tube(at(0,0,.08),.18,.09,5.4,steel,steel,9)
                art.box(at(0,-sign*.7,5.4),(.5,1.6,.16),h,grey)
        at,h=site(k,d)
        if j%5==0:
            for v in range(-8,9,2):art.box(at(5,v,.072),(3.65,.79,.023),h,paint)
        else:
            for v in (-3.05,3.05):art.box(at(0,v,.073),(4.7,.15,.019),h,paint)
    # The NYE pens are full in successive blocks. Face the front row into the cleared lane.
    for i,d in enumerate(range(-42,8740,4)):
        for side in (-1,1):
            if d%124<12:continue
            offset=side*(9.9+k.rng.uniform(0,.75))
            at,h=site(k,d,offset)
            def spectator(u,v,z):return at(v*.88,u+v*.43*side,z)
            cutout(crowds,spectator,k.rng.uniform(3.1,4.6),k.rng.uniform(1.65,2.04),(i+side)%4)
            if 4830<d<5340 and i%9==0:
                at,h=site(k,d+1.8,side*7.9);cutout(cops,at,2.6,1.91,(i//9)%2)
    # The red amphitheatre faces the pedestrian plaza at Duffy Square.
    at,h=site(k,3425,-23)
    for j in range(23):
        art.box(at(j*.59,0,.11),(.62,13.3,.21*(j+1)),h,red)
        panel(signs,[at(j*.59-.325,v,z) for v,z in ((-6.64,.19+j*.21),(6.64,.19+j*.21),(6.64,.28+j*.21),(-6.64,.28+j*.21))],2,3)
    for v in (-6.8,6.8):
        beam(art,at(0,v,1.04),at(13.2,v,5.73),.09,steel)
    # One Times Square's narrow front faces the race, with setbacks and a rooftop mast.
    at,h=site(k,8652,3)
    for z,w,dep,height in ((.1,17,29,26),(26.1,16,25,24),(50.1,14.5,22,14)):
        art.box(at(0,0,z),(dep,w,height),h,night)
        panel(ads,[at(-dep/2-.12,v,a) for v,a in ((w/2,z+.5),(-w/2,z+.5),(-w/2,z+height-.5),(w/2,z+height-.5))],int(z)%8,4,2)
    art.tube(at(0,0,64),.25,.15,14,steel,steel,10)
    for v in (-6.6,6.6):
        art.box(at(0,v,64),(.25,.25,3.5),h,grey)
    panel(signs,[at(-13.2,v,z) for v,z in ((9.5,62.8),(-9.5,62.8),(-9.5,69.8),(9.5,69.8)) ],1,3)
    return {'efforts':0}

THEME={'night':True,'lay':route,'road_builder':road,'land_builder':land,'road_half_width':9.5,'terrain':{'sea':False},'land':{'mid':0x363844},'sky':[0x302C40,0x201F35,0x151727,0x10111F,0x080A16],'haze':0x40374B,'light':[0xCEDFFF,.58],'fill':[0x9D9CBF,0x514052],'sun_altitude':.76,'sun_azimuth':-.94}
