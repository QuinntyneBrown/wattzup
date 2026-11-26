"""The square, reed-covered Semmarine and the ochre defences of Marrakech."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(d):return -.24*math.sin(d/100)*math.cos(d/270+1)+.16*math.sin(d/347)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    z=465;x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(s['level']-mean)*.0015 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        h=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*grade
    return rows,stages,length,mean,.15


def square(d):
    return max(1-smooth(2750,3300,d),smooth(8600,9060,d)*(1-smooth(10100,10700,d)))


def road(r,st,length,col,bc):
    b=bc.Builder('MedinaPaving','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,c,t in ((-3.25,-2.9,0x9C846E),(-2.9,2.9,0xAB9684),(2.9,3.25,0x9C846E)):
            b.quad(r.at(i,a),r.at(i+1,a),r.at(i+1,c),r.at(i,c))
            for idx,v in ((i,a),(i+1,a),(i+1,c),(i,c)):
                d=r.s[idx]['d'];light=1-.24*(1-smooth(.14,.88,abs((d+v*.22)%3.42-1.71))) if 5540<d<7940 else 1
                b.colours.append((*[q*light for q in lin(t)[:3]],1))
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('JemaaSquare','terrain');b.colours=[]
    for i in range(0,len(r.s)-3,3):
        for a,c,t in ((-700,-72,0xAD8978),(-72,-3,0xB09A87),(3,72,0xB29A83),(72,700,0xAE8D75)):
            b.quad(r.at(i,a,-.16),r.at(i+3,a,-.16),r.at(i+3,c,-.16),r.at(i,c,-.16));b.colours.extend([lin(t)]*4)
    b.build(col)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.16
    return None,height


def tile(mesh,pts,n):
    u=(n%2)*.5;v=(1-n//2)*.5
    picture(mesh,pts,((u+.008,v+.008),(u+.492,v+.008),(u+.492,v+.492),(u+.008,v+.492)))


def minaret(k,art,facade):
    at,h=site(k,253,94);stone=lin(0xBC9276)
    art.box(at(0,0,-1),(13,13,55.8),h,stone)
    for z in (21,36,49,54.8):art.box(at(0,0,z),(13.2,13.2,.37),h,lin(0xCCAA8E))
    for j in range(9):
        for side in (-1,1):
            art.box(at(-5.8+j*1.45,side*6.23,55.1),(.76,.69,.86),h,stone)
            art.box(at(side*6.23,-5.8+j*1.45,55.1),(.69,.76,.86),h,stone)
    for v in (-6.56,6.56):
        for z,high in ((22.0,12.8),(37.2,10.9)):
            tile(facade,(at(-6.28,v,z),at(6.28,v,z),at(6.28,v,z+high),at(-6.28,v,z+high)),0)
    for x in (-6.56,6.56):
        for z,high in ((22,12.8),(37.2,10.9)):
            tile(facade,(at(x,-6.28,z),at(x,6.28,z),at(x,6.28,z+high),at(x,-6.28,z+high)),0)
    art.box(at(0,0,55.3),(6.48,6.48,9.0),h,stone)
    art.roof(at(0,0,64.3),6.65,6.65,2.65,h,lin(0x597260))
    art.tube(at(0,0,66.6),.13,.08,6.55,lin(0x99794E),lin(0xE6C184),9)
    for z,r in ((67.8,1.02),(69.5,.76),(70.95,.47)):
        art.tube(at(0,0,z-r*.62),r*.62,r,r*.59,lin(0xAA8957),lin(0xD7BE80),12)
        art.tube(at(0,0,z-.03),r,r*.52,r*.78,lin(0xD7BE80),lin(0xDAB874),12)


def gateway(k,art):
    stone=lin(0xBB8165)
    for d in (11380,12275):
        at,h=site(k,d,0)
        for j in (-1,1):
            art.box(at(0,j*10,-.5),(3.6,11,8.3),h,stone)
            art.box(at(0,j*5.55,-.25),(5.38,3.35,9.9),h,lin(0xC08A6E))
            for n in range(12):
                art.box(at(0,j*(4.2+n*.91),7.8),(3.72,.51,.85),h,stone)
        # Open arch with a curved soffit between its two facades.
        for n in range(28):
            a=math.pi*n/28;b=math.pi*(n+1)/28
            def rim(u,t):return at(u,4.65*math.cos(t),3.88+3.65*math.sin(t))
            for u in (-1.82,1.82):
                p,q=rim(u,a),rim(u,b)
                art.face((p,q,at(u,4.65*math.cos(b),8.9),at(u,4.65*math.cos(a),8.9)),(stone,)*4)
            art.face((rim(-1.82,a),rim(1.82,a),rim(1.82,b),rim(-1.82,b)),(lin(0xA76F58),)*4)


def scenery(k):
    art=Painted(k);ridge=Painted(k,'peaks')
    stalls=pictured(k,'SoukGoods');faces=pictured(k,'MedinaFacades');light=pictured(k,'SoukLanterns');crowd=pictured(k,'SquareFamilies')
    minaret(k,art,faces);gateway(k,art)
    bulbs=lin(0xFFE1A2)
    for side in (-1,1):
        previous=None
        for j in range(58):
            d=j*245-175;at,h=site(k,d,side*1450)
            top=152+85*math.sin(j*.54+.3)+61*math.cos(j*.86)+28*math.sin(j*2.9)
            pt=at(0,0,top);root=at(0,0,-16)
            if previous:ridge.face((previous[1],root,pt,previous[0]),(lin(0xA48D91),lin(0xAC9391),lin(0x978A95),lin(0x9C8995)))
            previous=(pt,root)
    for d in range(-66,13070,17):
        plaza=square(d)
        for side in (-1,1):
            margin=7+plaza*(30+11*math.cos(d/204))+1.5*math.sin(d/98+side)
            at,h=site(k,d,side*margin)
            w=k.rng.uniform(13.2,18.4);hi=k.rng.uniform(5.1,9.7);ochre=lin(k.rng.choice((0xBC8772,0xCA957E,0xAB7968,0xB98B75)))
            art.box(at(0,side*3.9,-.24),(w,7.8,hi+.25),h,ochre)
            tile(faces,(at(-w/2,-side*.08,.04),at(w/2,-side*.08,.04),at(w/2,-side*.08,hi),at(-w/2,-side*.08,hi)),1)
            art.box(at(0,side*3.9,hi),(w+.2,8,.28),h,lin(0xBE967E))
            if (d+side)%3==0:
                tile(faces,(at(-w/2,-side*.08,hi),at(w/2,-side*.08,hi),at(w/2,-side*.08,hi+2.6),at(-w/2,-side*.08,hi+2.6)),2)
                art.box(at(0,side*2.4,hi+2.77),(w,5,.18),h,lin(0x836A59))
            if d>11100:continue
            off=(4.55+plaza*(3.8 if side>0 else 5.5))
            if plaza>.5 and (d//17+side)%4==0:continue
            p,h=site(k,d+2,side*off);width=k.rng.uniform(3.9,6.1)
            kind=3 if plaza>.53 else (0 if (d//17+side)%3==0 else 1) if d<5440 else 2
            tint=(0xD29D60,0xAE8A62,0x9B7157,0xD8C8A1)[kind]
            art.box(p(0,side*.65,.03),(width,1.30,.85),h,lin(0x926F54))
            tile(stalls,(p(-width/2,-side*.08,.12),p(width/2,-side*.08,.12),p(width/2,-side*.08,2.65),p(-width/2,-side*.08,2.65)),kind)
            art.roof(p(0,side*.50,2.60),width+.38,2.04,.44,h,lin(tint))
            for end in (-1,1):art.tube(p(end*width*.48,-side*.36,0),.037,.037,2.67,lin(0x775A49),lin(0x997A60),6)
            if kind==3:
                for n in range(4):art.tube(p(-width*.4+n*width*.27,-side*.48,2.4),.07,.055,.13,bulbs,bulbs,8)
            if kind in (0,1):
                for n in range(6):
                    c=p(-width*.39+n*width*.155,-side*.20,.82);shade=lin((0xEBA644,0xD08A35,0xC08039,0x9F6E41)[n%4])
                    art.tube(c,.35,.03,.46,shade,shade,9)
            if 5540<d<7940 and (d+side)%3==0:
                tile(light,(p(-1.14,-side*.46,2.28),p(1.14,-side*.46,2.28),p(1.14,-side*.46,3.63),p(-1.14,-side*.46,3.63)),3)
            if (d//17+side)%4==2:
                tile(crowd,(p(-1.52,-side*.97,.02),p(1.52,-side*.97,.02),p(1.52,-side*.97,1.82),p(-1.52,-side*.97,1.82)),3)
        if 5540<d<7940:
            p,h=site(k,d,0)
            for n in range(16):
                u=-8+n*1.06;beam(art,p(u,-6.2,4.16),p(u,6.2,4.26),.13,.12,lin(0x947758 if n%4 else 0xAF9270))
            for v in (-4.7,4.7):beam(art,p(-8.6,v,4.03),p(8.6,v,4.03),.17,.18,lin(0x695544))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.2,
       'land':{'mid':0xB9987D},'sky':[0xE8A67D,0xC39796,0x967F9E,0x716E94,0x575F85],'haze':0xCCA18F,
       'light':[0xF3C49A,1.45],'fill':[0xC4AFCD,0xA88C78],'sun_radius':12,'sun_altitude':.13,'sun_azimuth':.78}
