"""Festival night on Via Laietana and in the squares of Barcelona’s Gothic Quarter."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(distance):
    # scene-bend.ts counts clockwise, while Blender counts anticlockwise from +X.
    return -math.radians(12)*math.sin(distance/120)*math.cos(distance/(2.7*120)+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=2.4;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(s['level']-mean)*.00082 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn);z+=bc.STEP*grade
    return rows,stages,length,mean,.082



def width(d):
    return 8.1-3.65*(smooth(8430,8550,d)-smooth(9780,9910,d))


def pavement(r,st,length,col,bc):
    mesh=bc.Builder('CatalanRoad','terrain');mesh.colours=[]
    for i,p in enumerate(r.s[:-1]):
        w=width(p['d'])
        bands=[(-35,-w,.12,0x574641),(-w,-w+.16,.10,0xABA197),(-w+.16,w-.16,0,0x514949),(w-.16,w,.10,0xABA197),(w,35,.12,0x574641)]
        if w>7.8 and i%3==0:bands.extend(((-2.85,-2.75,.014,0xAE9E8D),(2.75,2.85,.014,0xAE9E8D)))
        if 9<i%77<12:
            for j in range(-int(w)+1,int(w)):bands.append((j-.30,j+.27,.019,0xAF9E90))
        for a,b,z,tint in bands:
            mesh.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z));mesh.colours.extend([lin(tint)]*4)
    mesh.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Festival plaza','terrain');b.colours=[]
    for i in range(0,len(r.s)-5,5):
        b.quad(r.at(i,-820,-.22),r.at(i+5,-820,-.22),r.at(i+5,820,-.22),r.at(i,820,-.22));b.colours.extend([lin(0x4A3941)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.22
    return None,sample


def panel(mesh,at,u,v,z,w,h,tile,yaw=0):
    dx=math.cos(yaw)*w/2;dy=math.sin(yaw)*w/2;a=(tile%2)*.5;b=(1-tile//2)*.5
    picture(mesh,(at(u-dx,v-dy,z),at(u+dx,v+dy,z),at(u+dx,v+dy,z+h),at(u-dx,v-dy,z+h)),((a+.005,b+.005),(a+.495,b+.005),(a+.495,b+.495),(a+.005,b+.495)))


def flag(art,at,u,v,z,length,drop):
    for j in range(9):
        tint=lin(0xE7AA33 if j%2==0 else 0xA82428)
        a=z-j*drop/9;b=z-(j+1)*drop/9
        art.face((at(u,v,a),at(u+length,v+.13,a-.09),at(u+length,v+.14,b-.09),at(u,v,b)),(tint,)*4)


def civic(art,stone,k,d,side,palau):
    at,h=site(k,d,side*25);w=34;high=15.8;ivory=lin(0xB9A083)
    art.box(at(0,side*7,-.20),(w,14,high+.2),h,ivory)
    panel(stone,at,0,-side*.13,.07,w,high,3 if palau else 0)
    for u in (-14,-9,-4,4,9,14):art.box(at(u,-side*.41,.12),(.66,.84,high+.4),h,ivory)
    art.box(at(0,-side*.4,high),(w+1,1.25,.7),h,ivory)
    if not palau:
        for u in (-6,-2,2,6):art.tube(at(u,-side*1.5,.2),.41,.34,7.6,ivory,ivory,10)
        art.roof(at(0,-side*.92,7.85),16.4,4.05,2.3,h,ivory)
    flag(art,at,-1.1,-side*.85,high-3,2.2,3)


def cathedral(art,facade,k,d):
    at,h=site(k,d,38);pale=lin(0x6C625C)
    art.box(at(0,7.6,-.16),(23,14,12.5),h,pale)
    for u in (-10,10):
        art.tube(at(u,4,10),2.1,1.6,7.4,pale,pale,8)
    picture(facade,(at(-13.1,0,.07),at(13.1,0,.07),at(13.1,0,33.6),at(-13.1,0,33.6)),((0,0),(1,0),(1,1),(0,1)))


def scenery(k):
    art=Painted(k);stone=pictured(k,'LaietanaStone');people=pictured(k,'FestivalAudience');facade=pictured(k,'GothicFront')
    metal=lin(0x474048);edges=lin(0xB5A18F);amber=lin(0xFFD095)
    for d in range(-64,13020,23):
        plaza=abs(d-6790)<105;gothic=8450<d<9850;w=width(d)
        for side in (-1,1):
            front=w+4.75+(14 if plaza else 0);a,h=site(k,d,side*front)
            high=k.rng.uniform(12.9,17.8) if gothic else k.rng.uniform(17.3,25);span=k.rng.uniform(21.85,22.8)
            landmark=plaza or side>0 and abs(d-9377)<57
            if not landmark:
                art.box(a(0,side*3.7,-.2),(span,7.4,high+.18),h,lin(k.rng.choice((0x82776E,0x988074,0x847575))))
                panel(stone,a,0,-side*.065,.04,span,high,0 if (d//23+side)%3 else 1)
                art.box(a(0,-side*.18,high-.4),(span+.35,.72,.48),h,edges)
                if d%3!=0:flag(art,a,-1.6,-side*.41,high*.55,2.45,2.3)
            a,h=site(k,d,side*(w+.65))
            for j in (-8.2,-2.8,2.6,8):
                panel(people,a,j,side*.60,.15,5.4,2.28,2+(int(j+12)+d)%2)
            for z in (.47,.95):beam(art,a(-11,-side*.22,z),a(11,-side*.22,z),.04,.04,metal)
            for j in (-10,-5,0,5,10):art.box(a(j,-side*.22,.1),(.056,.058,.92),h,metal)
            if d%2==0:
                art.tube(a(-8,side*.12,.1),.135,.085,6.34,metal,metal,8)
                beam(art,a(-8,side*.1,6.3),a(-8,-side*1.9,6.04),.09,.09,metal)
                art.box(a(-8,-side*1.9,5.9),(.45,.52,.16),h,amber)
        if d%3==0:
            a,h=site(k,d,0)
            for j in range(15):
                v=-w+(j+.5)*2*w/15;z=7.4-.68*math.cos(v/w*1.5)
                t=lin(0xCE392E if j%3==0 else 0xE5B64C)
                art.face((a(0,v-.29,z),a(0,v+.29,z),a(.06,v,z-.64)),(t,)*3)
    civic(art,stone,k,6790,-1,False);civic(art,stone,k,6806,1,True);cathedral(art,facade,k,9377)
    a,h=site(k,6797,-10.7);panel(people,a,0,0,.13,9.3,10.2,0,1.04)
    for d in (4530,4588,4640,4702):
        a,h=site(k,d,-5.1);panel(people,a,0,0,.1,3.4,2.15,1,1.07)
    # Montjuïc's wooded saddle and low castle walls against the piromusical.
    far=Painted(k,'peaks');a,h=site(k,12940,40)
    old=None
    for v in range(-800,861,36):
        peak=17+39*math.exp(-((v+125)/255)**2)+5*math.sin(v/62)
        q=(a(175,v,-6),a(175,v,peak))
        if old:
            tint=lin(0x302B3C);far.face((old[0],q[0],q[1],old[1]),(tint,)*4)
        old=q
    far.box(a(173,-132,52),(12,48,3.8),h,lin(0x4E4047))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':pavement,'terrain':{'sea':False},'road_half_width':7.85,
       'land':{'mid':0x54434A},'sky':[0x514350,0x352E48,0x201E37,0x13162C,0x101326],'haze':0x4B3B48,
       'light':[0xFFCA9F,1.67],'fill':[0xBBA6B6,0x967367],'sun_radius':6,'sun_altitude':.21,'sun_azimuth':.55}
