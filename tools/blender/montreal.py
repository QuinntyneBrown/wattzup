"""Rue Sainte-Catherine and the festival at Place des Arts, Montréal."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    rows=[];x=y=0;z=25
    def heading(d): return -math.radians(4)*math.sin(d/300)*math.cos(d/810+1)
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;stage=next((s for s in stages if d<s['to']),stages[-1]);grade=(.3 if stage['kind']=='work' else 0)+.1*math.sin(d/76);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=grade))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=grade*bc.STEP/100
    return rows,stages,length,mean,.003


def road(r,st,length,col,bc):
    b=bc.Builder('FestivalAsphalt','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-100,100,-.22,0x999293),(-24,24,.005,0xA5A09A),(-6.6,6.6,.02,0x575761),(-6.73,-6.58,.07,0xC9C5B9),(6.58,6.73,.07,0xC9C5B9)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
        if i%43==0:
            for side in range(-6,7,2):
                b.quad(r.at(i,side,.038),r.at(i+1,side,.038),r.at(i+1,side+.63,.038),r.at(i,side+.63,.038));b.colours.extend([lin(0xD9C8AF)]*4)
    b.build(col)


def tile(mesh,points,index):
    u=(index%2)*.5;v=(1-index//2)*.5
    picture(mesh,points,((u+.006,v+.006),(u+.494,v+.006),(u+.494,v+.494),(u+.006,v+.494)))


def scenery(k):
    art=Painted(k);front=pictured(k,'MontrealFront');printwork=pictured(k,'JazzPrint');crowd=pictured(k,'FestAudience');band=pictured(k,'JazzBand');trees=pictured(k,'SummerTrees');ridge=pictured(k,'RoyalRidge')
    steel=lin(0x626977);char=lin(0x242634);cream=lin(0xE2D0B6);blue=lin(0x2F6986);red=lin(0xD94464);pink=lin(0xE376A5);warm=lin(0xFFD28C)
    def building(d,off,w,high,index):
        a,h=site(k,d,off);s=1 if off>0 else -1;deep=9 if high<23 else 17
        art.box(a(0,s*deep/2,0),(w,deep,high),h,lin(0x626577))
        tile(front,(a(-s*w/2,0,0),a(s*w/2,0,0),a(s*w/2,0,high),a(-s*w/2,0,high)),index)
        for ss in (-1,1):
            end=ss*(w/2+.025)
            tile(front,(a(end,s*.02,0),a(end,s*deep,0),a(end,s*deep,high),a(end,s*.02,high)),index)
        art.box(a(0,s*deep/2,high),(w+.32,deep+.34,.29),h,steel)
    def crowdrow(d,side,n):
        for j in range(n):
            a,h=site(k,d+8.8*j,side)
            width=k.rng.uniform(6.5,8.8);sgn=1 if (j%2) else -1
            picture(crowd,(a(-width*.5*sgn,0,0),a(width*.5*sgn,0,0),a(width*.5*sgn,0,2.15),a(-width*.5*sgn,0,2.15)),UV)
    def truss(a,x,y,height):
        thick=.62
        for v in (-thick,thick):
            beam(art,a(x+v,y,0),a(x+v,y,height),.13,.13,steel)
        for n in range(math.floor(height)):
            beam(art,a(x-thick,y,n),a(x+thick,y,n+1),.085,.085,steel)
            beam(art,a(x+thick,y,n),a(x-thick,y,n+1),.085,.085,steel)
    for d in range(-55,9810,21):
        for s in (-1,1):
            if not (s<0 and (1660<d<1900 or 3180<d<3440 or 6700<d<6880) or s>0 and 9060<d<9200):
                building(d,s*k.rng.uniform(12.1,16.2),k.rng.uniform(17,20.8),k.rng.uniform(9,18),0)
            if d%42==-55%42 and not(9020<d<9250 and s>0):
                building(d+13,s*k.rng.uniform(36,56),k.rng.uniform(20,31),k.rng.uniform(24,55),1)
        a,h=site(k,d,7.95)
        art.tube(a(0,0,0),.12,.072,5.75,char,char,8,char)
        tile(printwork,(a(-.70,0,2.7),a(.70,0,2.7),a(.70,0,5.12),a(-.70,0,5.12)),0)
        for v in (-6.95,6.95):
            p,_=site(k,d,v);art.tube(p(0,0,.08),.13,.13,.025,red,red,8,red)
        if d%63==-55%63:
            a,h=site(k,d,-9.1)
            for angle in (.12,1.69):
                dx=3.35*math.cos(angle);dy=3.35*math.sin(angle)
                picture(trees,(a(-dx,-dy,.06),a(dx,dy,.06),a(dx,dy,7.4),a(-dx,-dy,7.4)),UV)
    for d in (1809,6832):
        a,h=site(k,d,-18.4);art.box(a(0,-4.8,0),(24,9.6,1.4),h,char);art.box(a(0,-4.8,10.7),(25.8,11.3,.65),h,char)
        art.box(a(0,-9,1.4),(22.9,.5,8.5),h,lin(0x393045))
        for x in (-11.2,11.2):
            truss(a,x,0,10.75);truss(a,x,-8.9,10.75)
            for i in range(5):art.box(a(x,-.2,5.2+i*.81),(1.6,1.06,.75),h,char)
        for j in range(-5,6):
            beam(art,a(j*2,0,10.3),a(j*2+2,0,9.63),.09,.09,steel)
            art.tube(a(j*2.0,-.1,9.46),.22,.19,.36,red if j%2 else blue,warm,8,warm)
        picture(band,(a(-6.5,-1.4,1.45),a(6.5,-1.4,1.45),a(6.5,-1.4,4.48),a(-6.5,-1.4,4.48)),UV)
        for row in range(3):crowdrow(d-43+row*1.5,-8.4-row*2.32,9)
    building(3355,-34,57,17,3)
    for d in range(3190,3430,32):
        a,h=site(k,d,-20)
        beam(art,a(0,0,0),a(0,0,5.8),.37,.45,cream);beam(art,a(0,0,5.8),a(0,-4.6,9.7),.34,.4,cream)
        art.box(a(0,-4.45,9.62),(1.1,.65,.28),h,warm)
    for d in range(4750,5080,3):
        a,h=site(k,d,0)
        for j in range(-6,7):
            v=j*1.65;up=5.1+1.6*(abs(j)/6)**2
            if j<6:beam(art,a(0,v,up),a(0,v+1.65,5.1+1.6*(abs(j+1)/6)**2),.018,.018,char)
            art.tube(a(0,v,up-.21),.14,.18,.26,pink if j%3 else red,pink,9,pink)
    for d in (110,148,6740,6788,6823):
        building(d,9.4,6.4,3.7,2);a,h=site(k,d,-8)
        for j in (-2,0,2):
            art.tube(a(j,0,0),.08,.09,.82,char,char,8,char);art.tube(a(j,0,.82),.52,.52,.08,cream,cream,14,cream)
    for d in (4913,6791):
        a,h=site(k,d,-7.4)
        for j in range(7):
            art.box(a(j*.95,0,0),(.35,.5,.89),h,steel)
            beam(art,a(j*.95,.68,.58),a(j*.95+.52,.68,.99),.08,.08,blue)
        tile(printwork,(a(0,-1.5,2.7),a(2,-1.5,2.7),a(2,-1.5,4.0),a(0,-1.5,4.0)),2)
    a,h=site(k,9190,156)
    picture(ridge,(a(-81,24,-1),a(81,-24,-1),a(81,-24,37),a(-81,24,37)),UV)
    far=Painted(k,'peaks');a,h=site(k,9190,181)
    for j in range(-8,9):
        height=15+12*math.cos(j*.17);far.tube(a(j*10,15,-10),19.5,13,height,lin(0x63755F),lin(0x435C50),12,lin(0x486954))
    far.box(a(0,15,30),(1.1,1.1,11),h,cream);far.box(a(0,15,37),(5.3,1.1,1.1),h,cream)
    return {'efforts':0}


THEME={'lay':route,'road_builder':road,'terrain':{'sea':False},'road_half_width':6.6,'land':{'mid':0xA69A92,'low':0x8F9987,'high':0x70816A,'rock':0x897D78},'sky':[0xEDBF9A,0xC7A9B2,0xA093AC,0x777FA6,0x596B95],'haze':0xBAA6AB,'light':[0xFFD3A5,1.85],'fill':[0xD4D4EC,0xA29188],'sun_radius':12,'sun_altitude':.28,'sun_azimuth':.8}
