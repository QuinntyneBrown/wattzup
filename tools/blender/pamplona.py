"""The dawn encierro: Plaza Consistorial, Mercaderes into Estafeta, and the callejón."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))
TURN=3180
PORTAL=8984


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(length,d))
        variation=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 429+13*smooth(0,960,d)+9*smooth(960,3170,d)+4*smooth(3320,6330,d)+.00038*variation+.44*math.sin(d/312)
    def heading(d):
        gentle=(.09*math.sin(d/182)+.07*math.sin(d/408))*(1-smooth(3100,3150,d)+smooth(3220,3280,d))
        return gentle-math.pi*.5*smooth(TURN-10,TURN+10,d)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;z=height(d);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.04


def width(d):
    return 4.37+7.5*smooth(1440,1510,d)*(1-smooth(1614,1695,d))+2.2*smooth(6940,7090,d)*(1-smooth(7270,7380,d))


def road(r,st,length,col,bc):
    b=bc.Builder('EstafetaSetts','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        a=width(p['d']);e=width(r.s[i+1]['d']);j=i+1
        for left,right,z,c in ((-1.25,1.25,.012,0xA6A398),(-1,1,.06,0xA4ACB3),(-1,-.91,.067,0x949CA2),(.91,1,.067,0x949CA2)):
            loc=((i,left*a),(j,left*e),(j,right*e),(i,right*a));pts=[r.at(n,v,z) for n,v in loc]
            b.quad(*pts);b.colours.extend([lin(c)]*4);b.uvs.extend((r.s[n]['d']/2.96,v/1.48) for n,v in loc)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Old town ground','terrain');b.colours=[]
    for i in range(0,len(r.s)-2,2):
        j=i+2
        for a,e in ((-61,-10),(-10,10),(10,61)):
            pts=(r.at(i,a,-.2),r.at(j,a,-.2),r.at(j,e,-.2),r.at(i,e,-.2));b.quad(*pts);b.colours.extend([lin(0x93918A)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.15
    return None,sample


def scenery(k):
    art=Painted(k);fronts=pictured(k,'EstafetaHouses');crowds=pictured(k,'SanFerminCrowd');hall=pictured(k,'Ayuntamiento');signs=pictured(k,'CallePlaques')
    iron=lin(0x4B5054);stone=lin(0xBCB5A9);timber=lin(0x9D7653);red=lin(0xB32C36)
    def person(at,u,v,z,variant,w=.94,h=1.76):
        a=variant/6
        picture(crowds,(at(u-w/2,v,z),at(u+w/2,v,z),at(u+w/2,v,z+h),at(u-w/2,v,z+h)),((a+.001,0),(a+1/6-.001,0),(a+1/6-.001,1),(a+.001,1)))
    # Separate façades and parapets have real depth, with public balconies projecting above eye level.
    for d in range(-40,8880,13):
        if 3159<d<3212 or 1524<d<1617:continue
        for side in (-1,1):
            at,h=site(k,d,side*(width(d)+2.93));j=k.rng.randrange(4);tall=13.7+(j%3)*1.35
            art.box(at(0,side*3.76,0),(12.95,7.43,tall),h,lin((0xCAB6A4,0xC2A48B,0xB69483,0xCDC5B0)[j]))
            u=j*.25
            picture(fronts,(at(-6.51,0,.03),at(6.51,0,.03),at(6.51,0,tall),at(-6.51,0,tall)),((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
            art.box(at(0,side*2.98,tall-.13),(13.22,6.48,.32),h,lin(0xCCA779))
            for level in (1,2,3):
                z=level*3.32+.18;art.box(at(0,-side*.44,z),(8.74,.88,.13),h,stone)
                beam(art,at(-4.39,-side*.91,z+.93),at(4.39,-side*.91,z+.93),.076,.074,iron)
                for x in (-4.25,-2.1,0,2.1,4.25):art.box(at(x,-side*.88,z+.12),(.055,.058,.83),h,iron)
                if (d+level)%3:person(at,.77,-side*.48,z+.14,(j+level)%6,.86,1.61)
                if (d+level)%5==0:
                    art.box(at(-2.71,-side*.97,z+.12),(1.45,.035,.82),h,red)
    # Rails behind each other keep people off the sprint line; gaps give staff access.
    for d in range(-32,8952,12):
        if abs(d-TURN)<21:continue
        at,h=site(k,d);w=width(d)
        for side in (-1,1):
            festival=(0<d<530 or 1420<d<1740 or 2970<d<3410 or 4860<d<5240 or 6880<d<7520 or 8530<d<8950)
            if festival:
                for rail in (0,.90):
                    if rail and d%84==0:continue
                    v=side*(w+.22+rail)
                    for z in (.43,.90,1.34):beam(art,at(-6,v,z),at(6,v,z),.19,.19,timber)
                    for post in (-5.8,-1.9,2.0):art.box(at(post,v,-.04),(.24,.27,1.62),h,timber)
            for j in range(6 if festival else 2):
                x=-5.4+j*(1.84 if festival else 6.35);v=side*(w+1.38+k.rng.uniform(0,.38));person(at,x,v,0,k.rng.randrange(6),.86+k.rng.random()*.15,1.62+k.rng.random()*.26)
    # Put the town hall at the outer edge of the square facing into the rider's approach.
    at,h=site(k,1589,15);art.box(at(3.35,0,0),(6.54,19.3,12.8),h,lin(0xAC9A80))
    picture(hall,(at(0,10.8,.02),at(0,-10.8,.02),at(0,-10.8,20.7),at(0,10.8,20.7)),UV)
    for z in (4.29,8.23,12.12):art.box(at(-.45,0,z),(1.1,18.73,.23),h,stone)
    for y in (-7.91,-5.17,5.17,7.91):art.box(at(-.14,y,.12),(.43,.48,3.86),h,lin(0xB4A387))
    # Two perpendicular ceramic street plaques identify the measured turn.
    at,h=site(k,3176,6.23)
    for j in range(2):
        uv=((j*.5,0),((j+1)*.5,0),((j+1)*.5,1),(j*.5,1))
        if j==0:pts=(at(-1,0,2.42),at(1,0,2.42),at(1,0,3.40),at(-1,0,3.40))
        else:pts=(at(1,0,2.42),at(1,2,2.42),at(1,2,3.40),at(1,0,3.40))
        picture(signs,pts,uv)
    # An open vaulted passage leads past the stands into a sand-coloured arena.
    at,h=site(k,PORTAL);brick=lin(0xAC7963);mortar=lin(0xCFB79A)
    for side in (-1,1):
        art.box(at(5,side*9.54,0),(10.2,9.2,7.28),h,brick)
        for j in range(7):art.box(at(-.16,side*(5.44+j*1.24),6.14),(.36,1.00,1.13),h,mortar)
    for j in range(20):
        a=math.pi*j/20;b=math.pi*(j+1)/20
        def arch(x,t,r):return at(x,r*math.cos(t),2.38+r*math.sin(t)*.79)
        lo,hi=4.76,5.52
        art.face((arch(-.21,a,lo),arch(-.21,b,lo),arch(-.21,b,hi),arch(-.21,a,hi)),(mortar,)*4)
        art.face((arch(-.21,a,lo),arch(13,a,lo),arch(13,b,lo),arch(-.21,b,lo)),(lin(0x777169),)*4)
        pts=(arch(-.04,a,hi),arch(-.04,b,hi),at(-.04,hi*math.cos(b),7.89),at(-.04,hi*math.cos(a),7.89))
        art.face(pts,(brick,)*4)
    for j in range(60):
        a=j*math.tau/60;b=(j+1)*math.tau/60
        if abs(math.sin((a+b)/2))<.15:continue
        def arena(t,r,z):return at(55+r*math.cos(t),r*math.sin(t),z)
        for tier in range(3):
            r=42+tier*3;z=1.4+tier*1.91
            art.face((arena(a,r,z),arena(b,r,z),arena(b,r+3,z+1.9),arena(a,r+3,z+1.9)),(lin(0xD5C2AF if j%3 else 0xB58276),)*4)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.37,'land':{'mid':0xB3ACA2},'sky':[0xE2D4C4,0xC4CDD5,0xA5B9CD,0x889FBC,0x708BAC],'haze':0xB7BBC4,'light':[0xFAD0A0,1.8],'fill':[0xCED9EA,0x999DA9],'sun_radius':7,'sun_altitude':.22,'sun_azimuth':-.61}
