"""Higashiyama, the Lake Biwa canal and the cherry trees of Tetsugaku-no-michi."""
import bisect
import math
import sys

from bondi import beam
from iten_landmarks import pictured, picture
from worldkit import lin, Painted, smooth


def heading(d):
    return .17*math.sin(d/305)+.10*math.cos(d/119)+.16*(smooth(3000,3200,d)-smooth(3500,3660,d))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=73;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=next((s for s in stages if d<s['to']),stages[-1])
        grade=(stage['level']-mean)*.0019 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=grade*100))
        z+=grade*bc.STEP;x+=math.cos(heading(d+bc.STEP/2))*bc.STEP;y+=math.sin(heading(d+bc.STEP/2))*bc.STEP
    return rows,stages,length,mean,.19


def surface(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__]
    path=bc.Builder('KyotoGravel','terrain');path.colours=[]
    curbs=bc.Builder('CanalCoping','terrain');curbs.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,h,c,m in ((-1.56,1.56,0,0xC6BAA0,path),(-1.82,-1.56,.022,0xA7A399,curbs),
                          (1.56,1.82,.022,0xAAA69D,curbs),(2.31,2.67,.027,0x93918A,curbs),
                          (7.53,7.93,.047,0x96978E,curbs)):
            m.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,b,h),r.at(i,b,h));m.colours.extend([lin(c)]*4)
        for side in (-1,1):
            # Expansion seams break the coping into individual flagstones.
            for shift in (0,.98,1.96,2.94):
                d=p['d']+shift
                curbs.quad(r.pos(d,side*1.56,.028),r.pos(d+.027,side*1.56,.028),
                           r.pos(d+.027,side*1.82,.028),r.pos(d,side*1.82,.028))
                curbs.colours.extend([lin(0x777770)]*4)
    path.build(col);curbs.build(col)


def terrain(r,col,theme,bc):
    land=bc.Builder('KyotoGardens','terrain');land.colours=[]
    centres=[s['x'] for s in r.s]
    def height(p,off):
        if 2.55<=off<=7.73:return p['z']-2.39
        hills=smooth(42,460,abs(off))*(16+14*math.sin(p['d']/286+off/155)+8*math.cos(off/91))
        if off<-70:hills+=smooth(70,750,-off)*(130+74*math.cos(p['d']/455))
        return p['z']-.13+hills
    def height_at(x,y):
        i=min(len(centres)-1,bisect.bisect_left(centres,x))
        for _ in range(2):
            p=r.s[i];along=(x-p['x'])*math.cos(p['h'])+(y-p['y'])*math.sin(p['h'])
            i=r.index(p['d']+along)
        p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return height(p,off)
    last=None
    for i in range(0,len(r.s),2):
        p=r.s[i];row=[]
        for off in (-1000,-650,-380,-190,-82,-40,-18,-8,-3,-1,1,2.45,2.6,3.2,7.1,7.72,7.8,8.2,11,18,35,89,210,500):
            x,y,_=r.at(i,off);shade=math.sin(p['d']/119+off*.083)
            c=0x638653 if shade>.3 else 0x788E60 if shade>-.24 else 0x566F51
            if abs(off)<2.5:c=0xA6A184
            row.append(((x,y,height(p,off)),lin(c)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                land.quad(a[0],e[0],c[0],b[0]);land.colours.extend((a[1],e[1],c[1],b[1]))
        last=row
    return land.build(col),height_at


def canal(k):
    walls=pictured(k,'KyotoCanal');water=pictured(k,'KyotoWater')
    for i,p in enumerate(k.road.s[:-1]):
        def at(end,off,z):return k.road.at(i+end,off,z)
        for upper,lower in ((2.54,3.08),(7.75,7.15)):
            picture(walls,(at(0,lower,-2.35),at(1,lower,-2.35),at(1,upper,.01),at(0,upper,.01)),
                    ((0,0),(1,0),(1,1),(0,1)))
        picture(water,(at(0,3,-1.43),at(1,3,-1.43),at(1,7.3,-1.43),at(0,7.3,-1.43)),
                ((0,0),(1,0),(1,1),(0,1)))


def bridge(k,art,d):
    yaw=heading(d)
    stone=lin(0x9A9D95)
    for side in (-1,1):
        for off in (2.65,4.5,6.3,7.66):
            x,y,z=k.road.pos(d+side*1.24,off)
            art.box((x,y,z+.11),(.27,.30,1.0),yaw,stone)
        a=k.road.pos(d+side*1.24,2.49,.99);b=k.road.pos(d+side*1.24,7.9,.99)
        beam(art,a,b,.23,.20,lin(0xA7AAA0))
        a=k.road.pos(d+side*1.24,2.49,.56);b=k.road.pos(d+side*1.24,7.9,.56)
        beam(art,a,b,.13,.14,lin(0x90968C))
    for off in (2.77,7.63):
        x,y,z=k.road.pos(d,off)
        art.box((x,y,z-1.56),(2.90,.52,1.58),yaw,lin(0x737A71))
    art.box(k.road.pos(d,5.15,-.17),(2.8,6.19,.34),yaw,stone)


def gate(k,art,station,off,upper):
    x,y,z=k.road.pos(station,off);yaw=heading(station)+.54
    wood=lin(0x51473B);dark=lin(0x433D34);tile=lin(0x5A615F)
    cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return (x+u*cs-v*sn,y+u*sn+v*cs,z+h)
    def roof(span,depth,eaves,rise):
        # Eaves sag between the ridge and the upturned corners of the end tiles.
        for side in (-1,1):
            for j in range(12):
                u=-span+span*j/6;v=u+span/6
                def top(a,t):
                    h=eaves+rise*(1-t)**1.53+.52*(abs(a)/span)**4*t
                    return p(a,side*depth*t,h)
                for t,t1 in ((0,.36),(.36,.72),(.72,1)):
                    art.face((top(u,t),top(v,t),top(v,t1),top(u,t1)),(tile,)*4)
                beam(art,top(u,1),top(v,1),.15,.23,dark)
        beam(art,p(-span*.91,0,eaves+rise+.06),p(span*.91,0,eaves+rise+.06),.29,.25,tile)
    width=7.2 if upper else 4.8
    for u in (-width,0,width):
        for v in (-2.0,2.0):
            art.tube(p(u,v,-.18),.60,.59,.47,lin(0x969990),lin(0xABAAA0),10)
            art.tube(p(u,v,.27),.40,.38,5.7 if upper else 3.9,wood,dark,12)
    h=5.6 if upper else 4.05
    for v in (-2.05,2.05):
        beam(art,p(-width-.63,v,h-.1),p(width+.63,v,h-.1),.6,.46,wood)
        beam(art,p(-width-.83,v,h-.55),p(width+.83,v,h-.55),.32,.24,dark)
    roof(width+1.58,3.48,h+.48,1.8)
    if upper:
        art.box(p(0,0,h+1.6),(11.9,4.2,1.75),yaw,wood)
        for u in range(-5,6):
            art.box(p(u,-2.14,h+1.83),(.62,.08,1.22),yaw,lin(0x252F2D))
        roof(7.8,3.76,h+3.53,2.61)
    for side in (-1,1):
        art.box(p(side*(width+5.2),.2,-.16),(9.5,.54,2.26),yaw,lin(0xDBD6C4))
        art.roof(p(side*(width+5.2),.2,2.1),9.5,.64,.46,yaw,tile)


def scenery(k):
    art=Painted(k);canal(k)
    cherries=pictured(k,'KyotoSakura');shops=pictured(k,'KyotoShops')
    for d in range(-50,10500,12):
        for side in (0,1):
            if 64<d<165 and side==0 or 10030<d<10112 and side==0:continue
            off=k.rng.uniform(-5.2,-2.6) if not side else k.rng.uniform(8.5,10.3)
            x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.17
            h=k.rng.uniform(5.5,8.1);half=h*k.rng.uniform(.63,.86)
            variant=k.rng.randrange(4);u=variant%2*.5;v=variant//2*.5
            angle=heading(d)+k.rng.uniform(-.38,.38);dx,dy=half*math.sin(angle),half*math.cos(angle)
            picture(cherries,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),
                    ((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for d in (162,587,1400,2345,3312,3850,4680,5452,6390,7500,8230,9200,10082):
        bridge(k,art,d)
    for i,d in enumerate(range(135,10440,56)):
        if 9850<d<10180:continue
        off=k.rng.choice((11.8,-7.2)) if not 7310<d<7700 else (-6.6 if i%2 else 11.8)
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y);yaw=heading(d)
        w=k.rng.uniform(6.7,9.1);depth=4.4;h=k.rng.uniform(3.35,4.6)
        art.box((x,y,z-.22),(w,depth,h+.22),yaw,lin(0x806854));art.roof((x,y,z+h),w+.5,depth+.8,1.8,yaw,lin(0x62696A))
        side=1 if off>0 else -1
        fx=x+side*math.sin(yaw)*2.23;fy=y-side*math.cos(yaw)*2.23
        dx,dy=w*.5*math.cos(yaw),w*.5*math.sin(yaw)
        u=i%2*.5;v=i//2%2*.5
        picture(shops,((fx-dx,fy-dy,z-.12),(fx+dx,fy+dy,z-.12),(fx+dx,fy+dy,z+h),(fx-dx,fy-dy,z+h)),
                ((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    gate(k,art,124,-10.8,True);gate(k,art,10083,-10.4,False)
    ridge=pictured(k,'Higashiyama')
    for start in range(-900,11700,1800):
        a=k.road.pos(max(0,min(10400,start)),-620);b=k.road.pos(max(0,min(10400,start+1800)),-620)
        if start<0:a=(a[0]+start,a[1],a[2])
        if start+1800>10400:b=(b[0]+start+1800-10400,b[1],b[2])
        picture(ridge,((a[0],a[1],24),(b[0],b[1],24),(b[0],b[1],432),(a[0],a[1],432)),((0,0),(1,0),(1,1),(0,1)))
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':terrain,'terrain':{'sea':False},'land':{'mid':0x6D865A},
       'road_half_width':1.55,'sky':[0xF6E7D9,0xECE7DD,0xCCDDE0,0xA6C4D3,0x88ACC2],
       'haze':0xD9DFD6,'light':[0xFFEFDE,1.52],'fill':[0xD4DFDC,0xB3A184],
       'sun_altitude':.53,'sun_azimuth':-.75,'sun_radius':57}
