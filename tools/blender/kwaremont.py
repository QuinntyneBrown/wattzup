"""The 2.2 km Oude Kwaremont drag, Kwaremontplein and the roadside VIP village."""
import bisect
import math
import sys

from bondi import beam, words
from iten_landmarks import picture, pictured
from worldkit import Painted, lin, smooth


def heading(d):
    return (.14*math.sin(d/480)+.17*math.cos(d/199)
            +.63*(smooth(13200,13510,d)-smooth(13660,13910,d))
            -.58*(smooth(14330,14570,d)-smooth(14760,14960,d)))


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=63;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=next((s for s in stages if d<s['to']),stages[-1])
        grade=(stage['level']-mean)*.0055
        if 12800<=d<15000:
            grade=.033+.012*(stage['level']-19)+.056*smooth(13280,13495,d)*(1-smooth(13660,13830,d))
        if d<0 or d>=length:grade=0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        z+=grade*bc.STEP
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,mean,.55


def surface(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__]
    road=bc.Builder('KwaremontSetts','terrain');road.colours=[]
    gutters=bc.Builder('KwaremontGutters','terrain');gutters.colours=[]
    for i in range(len(r.s)-1):
        d=r.s[i]['d']
        paved=12800<=d<15000
        for a,b in ((-3.05,-2.71),(-2.71,-2.03),(-2.03,-.54),(-.54,.54),(.54,2.03),(2.03,2.71),(2.71,3.05)):
            kerb=abs((a+b)*.5)>2.7
            out=road if paved and not kerb else gutters
            tone=0x96938C if paved and not kerb else 0xA69F92 if kerb else 0x828381
            def edge(j,lane):
                return r.at(j,lane,.09*(1-(abs(lane)/3.05)**2) if abs(lane)<2.71 else -.035)
            out.quad(edge(i,a),edge(i+1,a),edge(i+1,b),edge(i,b));out.colours.extend([lin(tone)]*4)
    road.build(col);gutters.build(col)


def terrain(r,col,theme,bc):
    field=bc.Builder('KwaremontFields','terrain');field.colours=[]
    centres=[p['x'] for p in r.s]
    def height(p,off):
        rolls=13*math.sin(p['d']/246+off/151)+5*math.cos(p['d']/109-off/69)
        down=48*smooth(14100,15200,p['d'])*smooth(38,235,off)
        return p['z']-.26+smooth(6,135,abs(off))*rolls-down
    def height_at(x,y):
        i=min(len(centres)-1,bisect.bisect_left(centres,x))
        for _ in range(2):
            p=r.s[i];delta=(x-p['x'])*math.cos(p['h'])+(y-p['y'])*math.sin(p['h'])
            i=r.index(p['d']+delta)
        p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return height(p,off)
    last=None
    for i in range(0,len(r.s),4):
        p=r.s[i];row=[]
        for off in (-1180,-750,-460,-260,-165,-98,-63,-35,-15,-7,-3,-2,0,2,3,7,15,35,63,98,165,260,460,750,1180):
            x,y,_=r.at(i,off)
            patch=(math.floor((p['d']+off*.18)/150)+math.floor(abs(off)/73))%6
            tone=(0x75845C,0x8B885F,0x788451,0x857059,0x81905C,0x667A50)[patch]
            if abs(off)<6:tone=0x70684E
            row.append(((x,y,height(p,off)),lin(tone)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                field.quad(a[0],e[0],c[0],b[0]);field.colours.extend((a[1],e[1],c[1],b[1]))
        last=row
    return field.build(col),height_at


def village(k,art,fronts):
    for i,d in enumerate([120,168,289,530,1910,3380,5670,7950,9300,12100,*range(13315,13712,17),15062,15326,15590]):
        for side in ((1,-1) if 13315<=d<=13712 else ((-1,) if i%2 else (1,))):
            yaw=heading(d);along=(math.cos(yaw),math.sin(yaw))
            face=(side*math.sin(yaw),-side*math.cos(yaw))
            w=k.rng.uniform(9.8,14.6);deep=k.rng.uniform(6.4,8.2);h=k.rng.uniform(5.1,7.1)
            x,y,_=k.road.pos(d,side*(8.6 if 13300<d<13715 else 10.4));z=k.height_at(x,y)
            art.box((x,y,z-.42),(w,deep,h+.42),yaw,lin(0x966E55))
            art.roof((x,y,z+h),w+.3,deep+.3,2.9,yaw,lin(0x6C5C50))
            fx=x+face[0]*(deep*.5+.02);fy=y+face[1]*(deep*.5+.02)
            def at(span,up,proud=0):
                return (fx+along[0]*span+face[0]*proud,fy+along[1]*span+face[1]*proud,z+up)
            variant=(i+side)%4;u=variant%2*.5;v=variant//2*.5
            picture(fronts,(at(-w/2,-.25),at(w/2,-.25),at(w/2,h),at(-w/2,h)),
                    ((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
            # The rider sees the gable before the street front. Give its windows real reveals.
            for end in (-1,1):
                sx=x+along[0]*(w*.5+.018)*end;sy=y+along[1]*(w*.5+.018)*end
                for across in (-1.65,1.65):
                    bx=sx+face[0]*across;by=sy+face[1]*across
                    for sill in (.84,3.42):
                        art.box((bx,by,z+sill),(.11,1.32,1.48),yaw,lin(0xD1C2A7))
                        art.box((bx+along[0]*.07*end,by+along[1]*.07*end,z+sill+.11),
                                (.045,1.06,1.22),yaw,lin(0x526169))
                        art.box((bx+along[0]*.10*end,by+along[1]*.10*end,z+sill+.11),
                                (.03,.045,1.22),yaw,lin(0xE0D4BD))
            art.box(at(w*.28,h+1.3),(1,.76,1.7),yaw,lin(0x886550))
            if 13470<d<13650 and i%3==0:
                art.box(at(0,2.86,.53),(w*.72,1.08,.22),yaw,lin(0x356455))
                art.box(at(-w*.36,.05,1.02),(.08,.08,2.85),yaw,lin(0x3F5547))
                art.box(at(w*.36,.05,1.02),(.08,.08,2.85),yaw,lin(0x3F5547))


def marquees(k,art,bars):
    steel=lin(0x929997);canvas=lin(0xE6E3D6)
    for i,d in enumerate(range(13942,14276,22)):
        yaw=heading(d)
        def pt(along,off,up):
            x,y,z=k.road.pos(d+along,off)
            return (x,y,z-.18+up)
        art.box(pt(0,11.8,0),(20.2,12.6,.48),yaw,lin(0x8C7862))
        for a in (-9.8,0,9.8):
            for off in (6.0,17.6):art.tube(pt(a,off,.47),.075,.065,3.2,steel,steel,8)
        art.box(pt(0,11.8,3.59),(20.4,12.3,.41),yaw,canvas)
        art.roof(pt(0,11.8,4.0),20.5,12.6,2.65,yaw,canvas)
        picture(bars,(pt(-9.8,9.5,.48),pt(9.8,9.5,.48),pt(9.8,9.5,3.65),pt(-9.8,9.5,3.65)),
                ((0,0),(1,0),(1,1),(0,1)))
        art.box(pt(0,7.6,.49),(10.4,.9,1.12),yaw,lin(0x967751))
        for a in (-7.6,7.6):
            art.box(pt(a,6.1,.5),(.75,.6,1.27),yaw,lin(0x343938))
            if i%2==0:art.box(pt(a,6.1,1.82),(.69,.57,.82),yaw,lin(0x202525))


def scenery(k):
    art=Painted(k);trees=pictured(k,'KwaremontTrees')
    village(k,art,pictured(k,'KwaremontFronts'))
    marquees(k,art,pictured(k,'KwaremontBars'))
    for d in range(0,16400,26):
        for side in (-1,1):
            if 13310<d<13725 or (13900<d<14310 and side==1):continue
            off=side*k.rng.uniform(5.7,19);x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.25
            variant=k.rng.randrange(4);u=variant%2*.5;v=variant//2*.5
            h=k.rng.uniform(9.3,15.2);w=h*(.30 if variant<2 else .58)
            angle=heading(d)+k.rng.uniform(-.44,.44)
            dx,dy=w*math.sin(angle),w*math.cos(angle)
            picture(trees,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),
                    ((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    # Field boundaries, furrows and distant farms are visible through gaps after the upper drag.
    for d in range(30,16300,29):
        if 13000<d<15000:continue
        side=1 if int(d/180)%2 else -1
        if d%5==0:continue
        off=side*(15+5*math.sin(d/93))
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y)
        art.box((x,y,z-.30),(22.8,1.4,1.25),heading(d),lin(0x546846))
        art.roof((x,y,z+.93),22.9,1.45,.36,heading(d),lin(0x64784F))
    for start in (40,15200):
        for shift in range(0,219,8):
            for off in range(21,94,3):
                x,y,_=k.road.pos(start+shift,off)
                x1,y1,_=k.road.pos(start+shift+8,off)
                z=k.height_at(x,y);z1=k.height_at(x1,y1)
                art.face(((x,y-.28,z+.04),(x1,y1-.28,z1+.04),(x1,y1+.28,z1+.04),(x,y+.28,z+.04)),
                         (lin(0x755F4F),)*4)
    for d,label in ((12862,'ALLEZ!'),(13583,'ELISE'),(14058,'WOUT'),(14669,'LOTTE'),(14772,'KWAREMONT')):
        yaw=heading(d);x,y,z=k.road.pos(d,0,.125)
        # The letter surface follows the grade so the uphill edge stays above the cobbles.
        slope=k.road.s[k.road.index(d)]['g']/100
        words(art,label,(x,y,z),(math.sin(yaw),-math.cos(yaw),0),
              (math.cos(yaw),math.sin(yaw),slope),1.52,4.7,0xEAE4C7)
    steel=lin(0x9DA4A0)
    for d in range(13270,14860,4):
        for side in (-1,1):
            pts=[k.road.pos(d+step,side*3.48) for step in (0,3.9)]
            for lift in (.19,.98):beam(art,(*pts[0][:2],pts[0][2]+lift),(*pts[1][:2],pts[1][2]+lift),.04,.045,steel)
            for step in (0,.95,1.95,2.95,3.9):
                x,y,z=k.road.pos(d+step,side*3.48)
                art.tube((x,y,z-.1),.022,.022,1.1,steel,steel,5)
    for i,d in enumerate(range(13266,14871,17)):
        # Native course coordinates point left, while the rider's lane points right.
        side=-1 if i%2 else 1
        x,y,z=k.road.pos(d,side*3.84)
        art.tube((x,y,z-.24),.045,.038,3.62,steel,steel,7)
    for d,label in ((12802,'OUDE KWAREMONT'),(13998,'1 KM'),(14990,'KWAREMONT')):
        yaw=heading(d);x,y,z=k.road.pos(d)
        for side in (-1,1):
            art.tube(k.road.pos(d,side*3.63),.085,.085,4.85,steel,steel,8)
        art.box((x,y,z+4.08),(.22,7.5,.76),yaw,lin(0xD3AE36))
        words(art,label,(x-.14*math.cos(yaw),y-.14*math.sin(yaw),z+4.23),(math.sin(yaw),-math.cos(yaw),0),(0,0,1),.49,6.9,0x222822)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':terrain,'terrain':{'sea':False},'land':{'mid':0x77815B},
       'road_half_width':3.05,'sky':[0xE2E1D8,0xD0D5CF,0xBFCAC8,0xA2B2B5,0x829A9D],
       'haze':0xC3C9BE,'light':[0xE9E6D7,1.3],'fill':[0xCCD4D2,0xA7987F],
       'sun_altitude':.45,'sun_azimuth':-.86,'sun_radius':46}
