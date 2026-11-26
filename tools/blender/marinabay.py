"""Night race around Marina Bay. The city, hotel and observation wheel occupy fixed sites."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    radius=length/(math.tau*.94);z=4.7;x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(s['level']-mean)*.00115 if 0<=d<length else 0
        h=d/radius+.072*math.sin(d/143)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=1/radius+.072/143*math.cos(d/143),g=100*grade))
        half=d+bc.STEP/2;h=half/radius+.072*math.sin(half/143)
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*grade
    return rows,stages,length,mean,.115


def promenade(r,st,length,col,bc):
    b=bc.Builder('BayPavers','terrain');b.colours=[]
    for i in range(len(r.s)-1):
        for a,c,shade in ((-13,-7,0x596276),(-7,-6.84,0xB1A88D),(-6.84,4.8,0x777984),(4.8,5.04,0xB3A78B),(5.04,8.4,0x747B89)):
            b.quad(r.at(i,a),r.at(i+1,a),r.at(i+1,c),r.at(i,c));b.colours.extend([lin(shade)]*4)
    b.build(col)


def shore(r,col,theme,bc):
    b=bc.Builder('BayQuay','terrain');b.colours=[];level=min(p['z'] for p in r.s)-1.6
    for i in range(0,len(r.s)-3,3):
        for a,c,t in ((-910,-12,0x343B47),(8.3,9.4,0x6C6872)):
            b.quad(r.at(i,a,-.17),r.at(i+3,a,-.17),r.at(i+3,c,-.17),r.at(i,c,-.17));b.colours.extend([lin(t)]*4)
        a,b0=r.at(i,9.4,-.17),r.at(i+3,9.4,-.17)
        b.quad(a,b0,(b0[0],b0[1],level-.4),(a[0],a[1],level-.4));b.colours.extend([lin(0x474D5D)]*4)
    b.build(col)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.17
    return None,height


def painted(k,name):
    art=Painted(k);art.b=type(k.B['terrain'])(name,'terrain');art.b.colours=[];k.B[name]=art.b
    return art


def hotel(k,walls,lights):
    at,h=site(k,489,300)
    # Each pair of curved legs converges into a single upper slab beneath the long cantilever.
    for u in (-64,0,64):
        for sign in (-1,1):
            lower=[]
            for j,z in enumerate((0,34,72,111,150,184)):
                sideways=sign*(4+12*(1-z/184)**2)
                ring=[at(u+x,sideways+y,z) for x,y in ((-17,-5),(17,-5),(17,5),(-17,5))]
                if lower:
                    for n in range(4):
                        m=(n+1)%4;walls.face((lower[n],lower[m],ring[m],ring[n]),(lin(0xB4ABAA),)*4)
                lower=ring
        for edge in (-17,17):beam(lights,at(u+edge,-18,2),at(u+edge,-5,184),.60,.60,lin(0xCBDDF4))
    # Round the bow and stern of the SkyPark in plan and light the strip along its soffit.
    shape=[(-117+q*3,-8-7*math.sin(q*math.pi/10)) for q in range(11)]
    shape.extend(((79,-15),(112,-9),(125,-2),(127,1),(113,8),(83,14),(-86,14),(-112,8),(-119,1)))
    lo=[at(u,v,183.4) for u,v in shape];hi=[at(u,v,189+1.7*max(0,u-80)/47) for u,v in shape]
    lights.face(hi,(lin(0x526774),)*len(hi))
    for i in range(len(lo)):
        n=(i+1)%len(lo);lights.face((lo[i],lo[n],hi[n],hi[i]),(lin(0x91AFE6),lin(0x91AFE6),lin(0xBCCBDE),lin(0xBCCBDE)))


def shells(k,lights):
    at,h=site(k,3676,-36)
    for u,v,size in ((-17,0,18),(19,7,22)):
        rings=[]
        for j in range(8):
            a=j*math.pi/15;rr=math.cos(a)
            rings.append([at(u+size*rr*math.cos(q*math.tau/32),v+.75*size*rr*math.sin(q*math.tau/32),size*.68*math.sin(a)) for q in range(32)])
        for j,(lo,hi) in enumerate(zip(rings,rings[1:])):
            for q in range(32):
                n=(q+1)%32;pts=(lo[q],lo[n],hi[n],hi[q]);a=(q+.5)*math.tau/32
                tip=tuple(sum(p[t] for p in pts)/4+off for t,off in enumerate((1.2*math.cos(a+h),1.2*math.sin(a+h),1.4)))
                for w,tint in enumerate((0x817F74,0xAC9A79,0xE7C98D,0x6B706D)):
                    lights.face((pts[w],pts[(w+1)%4],tip),(lin(tint),)*3)
    at,h=site(k,5480,42)
    for j in range(10):
        a=j*math.tau/10;up=14+8*(1+math.cos(a))*.5
        def petal(r,side,z):return at(r*math.cos(a)-side*math.sin(a),r*math.sin(a)+side*math.cos(a),z)
        root=petal(2,0,0);left=petal(12,-4.2,up*.55);right=petal(12,4.2,up*.55);tip=petal(18,0,up);mid=petal(13,0,up*.39)
        for tri,t in (((root,left,mid),0xBBC4F2),((root,mid,right),0xA8B4DE),((left,tip,mid),0xD5DCFC),((mid,tip,right),0xD1C8F1)):
            lights.face(tri,(lin(t),)*3)


def scenery(k):
    art=Painted(k);lights=painted(k,'BayLandmarks');hotelwalls=painted(k,'SkyParkTowers');offices=painted(k,'RafflesWindows')
    mirrors=painted(k,'BayReflections');palms=pictured(k,'BayPalms');people=pictured(k,'BayVisitors');lion=pictured(k,'Merlion')
    level=min(row['z'] for row in k.s)-1.6;sea=Painted(k,'sea')
    hotel(k,hotelwalls,lights);shells(k,lights)
    crowns=painted(k,'SupertreeCrowns')
    for d,off,high in ((7566,-28,29),(7619,-17,34),(7645,-42,39),(7680,-28,31),(7725,-54,42),(7792,-19,27)):
        at,h=site(k,d,off);bark=lin(0x45584A);pink=lin(0xBB6BC8)
        art.tube(at(0,0,-.05),high*.086,high*.047,high*.66,bark,lin(0x696775),14)
        for n in range(24):
            angle=n*math.tau/24
            stem=at(high*.048*math.cos(angle),high*.048*math.sin(angle),high*.47)
            fork=at(high*.125*math.cos(angle+.09),high*.125*math.sin(angle+.09),high*.80)
            beam(crowns,stem,fork,.18,.16,pink)
            for sign in (-1,1):
                end=at(high*.31*math.cos(angle+sign*.13),high*.31*math.sin(angle+sign*.13),high*(.96+.03*math.cos(n)))
                beam(crowns,fork,end,.12,.11,pink)
            nxt=(n+1)*math.tau/24
            beam(crowns,at(high*.27*math.cos(angle),high*.27*math.sin(angle),high*.928),at(high*.27*math.cos(nxt),high*.27*math.sin(nxt),high*.928),.09,.09,pink)
    for d in range(7600,7695,3):
        a=k.road.pos(d,-26,16.5+1.4*math.sin((d-7600)/47))
        b=k.road.pos(d+3,-26,16.5+1.4*math.sin((d+3-7600)/47))
        beam(art,a,b,1.52,.33,lin(0xC6AA7D))
        for side in (-1,1):
            beam(art,(a[0],a[1]+side*.69,a[2]+1.0),(b[0],b[1]+side*.69,b[2]+1.0),.09,.085,lin(0xD8B896))
            beam(art,(a[0],a[1]+side*.69,a[2]),(a[0],a[1]+side*.69,a[2]+1),.07,.07,lin(0xAF9C87))
    at,h=site(k,10180,-57)
    for v in (-6.5,6.5):
        for u in (-21,21):beam(lights,at(u,v,0),at(0,v*.32,45),.82,.90,lin(0xCBCFCF))
    beam(lights,at(0,-7,45),at(0,7,45),1.6,1.6,lin(0xA4B3BC))
    # The water covers the interior of the loop and meets the vertical quay face.
    circle=[]
    for d in range(-65,10865,22):
        x,y,_=k.road.pos(d,9.17);circle.append((x,y,level))
    cx=sum(p[0] for p in circle)/len(circle);cy=sum(p[1] for p in circle)/len(circle)
    for p,q in zip(circle,circle[1:]+circle[:1]):sea.face((p,q,(cx,cy,level)),(lin(0x1E2F49),lin(0x1E2F49),lin(0x101A2F)))
    for j in range(45):
        d=200+j*208;off=-k.rng.uniform(88,246);at,h=site(k,d,off)
        w=k.rng.uniform(16,43);depth=k.rng.uniform(15,34);tall=k.rng.uniform(38,155)
        offices.box(at(0,0,0),(w,depth,tall),h,lin(0xA8AFC5))
        lights.box(at(0,0,tall),(w*1.01,depth*1.01,1),h,lin(k.rng.choice((0x5F8EAF,0xD3BA8A,0x7DBFAF))))
        for q in range(3):
            x,y,_=k.road.pos(d+(q-1)*6,11)
            a,b,c=(x,y,level+.025),(x+math.sin(h)*1.3,y-math.cos(h)*1.3,level+.025),(x-math.sin(h)*tall*.70,y+math.cos(h)*tall*.70,level+.025)
            mirrors.face((a,b,c),(lin(0x69646F),lin(0x556F83),lin(0x233044)))
    for d in range(-55,10800,12):
        at,h=site(k,d,8.07)
        for v in (.46,1.13):beam(art,at(0,0,v),k.road.pos(d+12,8.07,v),.047,.053,lin(0xA8ADA7))
        for u in (0,4,8):art.tube(at(u,0,0),.050,.043,1.15,lin(0x68717A),lin(0xA7ABAD),6)
        if d%36==17:
            p,h=site(k,d,-6.64);art.tube(p(0,0,0),.10,.062,5.65,lin(0x525D69),lin(0x75808B),8)
            art.box(p(0,.45,5.61),(.22,1.14,.10),h,lin(0xD3BE8A));art.box(p(0,.8,5.57),(.29,.54,.074),h,lin(0xFDE7AE))
            p,h=site(k,d+7,-8.8);high=k.rng.uniform(6.0,9.3)
            for ang in (0,1.57):
                dx,dy=high*.44*math.cos(ang),high*.44*math.sin(ang)
                picture(palms,(p(-dx,-dy,0),p(dx,dy,0),p(dx,dy,high),p(-dx,-dy,high)),((0,0),(1,0),(1,1),(0,1)))
        if d%72==29:
            p,h=site(k,d,6.6)
            picture(people,(p(-1.88,0,0),p(1.88,0,0),p(1.88,0,1.9),p(-1.88,0,1.9)),((0,0),(1,0),(1,1),(0,1)))
    # Paired helices follow the bridge deck. Each hoop spans the path in local road coordinates.
    for sign in (-1,1):
        prev=None
        for n in range(129):
            d=5329+n*.85;a=n*math.tau/38+sign*math.pi/2
            p=k.road.pos(d,3.95*math.cos(a),3.83+3.58*math.sin(a))
            if prev:beam(art,prev,p,.13,.13,lin(0x8B9FE8 if sign<0 else 0xD5D9E8))
            if n%8==0:beam(art,p,k.road.pos(d,3.89*math.cos(a+.72),3.83+3.53*math.sin(a+.72)),.047,.047,lin(0x8D889F))
            prev=p
    at,h=site(k,1867,10.9)
    art.tube(at(0,0,-1.4),3.2,2.65,1.72,lin(0x566C77),lin(0x90B6B4),20,lin(0x9EBBBA))
    picture(lion,(at(-2.35,0,.28),at(2.35,0,.28),at(2.35,0,8.74),at(-2.35,0,8.74)),((0,0),(1,0),(1,1),(0,1)))
    last=at(1.49,0,7.1)
    for j in range(1,20):
        t=j/19;p=at(1.49+8.8*t,.32*t,7.1-7.8*t*t);beam(art,last,p,.14+.11*t,.14+.15*t,lin(0xDCE6E5));last=p
    return {'efforts':0}


THEME={'lay':route,'land_builder':shore,'road_builder':promenade,'terrain':{'sea':False},'road_half_width':4.0,
       'land':{'mid':0x303844},'sky':[0x26314F,0x1C2541,0x171F36,0x11192D,0x0D172B],'haze':0x3E4964,
       'light':[0xB8C7E2,1.0],'fill':[0xC4C9E1,0x71819A],'sun_radius':4,'sun_altitude':-.45,'sun_azimuth':1.98}
