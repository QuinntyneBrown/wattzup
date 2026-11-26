"""Two laps through the Hachikō scramble and up Dogenzaka."""
import math
from arenberg import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

LAP = 4075
PROFILE = [(0,19),(590,17),(810,17),(1480,21),(2200,33),(2650,41),(3050,39),(3600,27),(4075,19)]
TAU = math.tau

def altitude(d):
    s=d%LAP
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if s<=b:return z+(h-z)*(s-a)/(b-a)

def heading(d):
    q=LAP/4
    turn=math.floor(d/q)
    t=d/q-turn
    return (turn+smooth(.83,.97,t))*math.pi/2+.08*math.sin(2*math.pi*t)

def route(course,theme,bc):
    # Periodic integral of the bearing. Quarter-turn symmetry closes the circuit exactly.
    positions=[(0.,0.)]
    for i in range(LAP):
        h=heading(i+.5);x,y=positions[-1];positions.append((x+math.cos(h),y+math.sin(h)))
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=d%LAP;j=math.floor(s);f=s-j
        x,y=(positions[j][n]*(1-f)+positions[j+1][n]*f for n in (0,1))
        rows.append(dict(d=d,x=x,y=y,z=altitude(d),h=heading(d),g=(altitude(d+.5)-altitude(d-.5))*100,k=math.sin(heading(d+.5)-heading(d-.5))))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    wet=bc.Builder('TokyoWetRoad','terrain');wet.colours=[];wet.uvs=[]
    kerb=bc.Builder('TokyoStreet','terrain');kerb.colours=[]
    def band(i,a,b,h,c):
        kerb.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,b,h),r.at(i,b,h));kerb.colours.extend((lin(c),)*4)
    for i,p in enumerate(r.s[:-1]):
        d=p['d']
        if not 0<=d<LAP:continue
        width=12+8*(1-smooth(16,65,abs(d-745)))
        picture(wet,[r.at(i,-width),r.at(i+1,-width),r.at(i+1,width),r.at(i,width)],[(0,0),(0,1),(1,1),(1,0)])
        for side in (-1,1):
            a,b=sorted((side*width,side*(width+12)));band(i,a,b,.12,0x444453)
            if abs(d-745)>34:
                band(i,side*width-.18,side*width-.05,.023,0xCDD1CA)
                if i%5<2:band(i,side*5.6-.08,side*5.6+.08,.026,0xBEBDC7)
    wet.build(col);kerb.build(col)

def land(r,col,theme,bc):
    b=bc.Builder('TokyoGround','terrain');b.colours=[]
    b.quad((-2000,-2000,-2),(3000,-2000,-2),(3000,3000,-2),(-2000,3000,-2));b.colours.extend((lin(0x252835),)*4)
    return b.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.4

def scenery(k):
    art=Painted(k);sky=Painted(k,'peaks');front=pictured(k,'TokyoFrontages');screens=pictured(k,'TokyoScreen');logo=pictured(k,'Tokyo109')
    slate,steel,light=map(lin,(0x343541,0x7E8494,0xCED5D5))
    def panel(m,at,vertices,tile=None):
        uv=[(0,0),(1,0),(1,1),(0,1)]
        if tile is not None:uv=[((tile%2+u*.992+.004)/2,(1-tile//2+v*.992+.004)/2) for u,v in uv]
        picture(m,[at(*pt) for pt in vertices],uv)
    def building(d,left,width,height,depth,tile):
        at,h=site(k,d,left);sgn=1 if left>0 else -1
        art.box(at(0,0,-1.2),(width,depth,height+1),h,slate)
        face=-sgn*(depth/2+.04)
        panel(front,at,[(-width/2,face,0),(width/2,face,0),(width/2,face,height),(-width/2,face,height)],tile)
        for direction in (-1,1):
            u=direction*(width/2+.04)
            panel(front,at,[(u,-depth/2,0),(u,depth/2,0),(u,depth/2,height),(u,-depth/2,height)],tile)
        art.box(at(0,0,height-.22),(width+.4,depth+.4,.35),h,steel)
    for i,d in enumerate(range(0,LAP,19)):
        for side in (-1,1):
            if (side>0 and (70<d<205 or 675<d<875 or 1450<d<1550)) or (side<0 and 680<d<800):continue
            width=k.rng.uniform(13,18);depth=k.rng.uniform(7,13)
            building(d,side*(18+depth/2),width,k.rng.uniform(13,33),depth,(i+(side>0))%3+1)
    # The stainless drum projects into the space between the two approaching streets.
    at,h=site(k,1513,16)
    art.tube(at(0,0,-1),8.1,8.1,32,steel,light,48)
    for j in range(1,39):
        art.tube(at(0,0,j*.79),8.14,8.14,.096,slate,steel,48)
    panel(logo,at,[(-8.2,-4.8,24.4),(-8.2,4.8,24.4),(-8.2,4.8,31.5),(-8.2,-4.8,31.5)])
    for d,side,w,ht in ((165,35,72,25),(820,35,55,34),(100,115,42,103),(250,-140,39,126)):
        building(d,side,w,ht,23,0)
    # Faceted QFRONT screen wraps the corner; each section has continuous horizontal UV.
    at,h=site(k,830,22)
    for j in range(9):
        a,b=[(-.52+n*.12) for n in (j,j+1)]
        def edge(v,z):return at(24*math.sin(v),-18*math.cos(v)+4,z)
        picture(screens,[edge(a,7),edge(b,7),edge(b,24),edge(a,24)],[(j/9,0),((j+1)/9,0),((j+1)/9,1),(j/9,1)])
    # JR elevated railway beyond Hachikō plaza and a second visible span behind the scramble.
    for d in (155,782):
        at,h=site(k,d,0)
        art.box(at(0,0,7.2),(7.2,108,1.15),h,steel)
        for u in (-3.3,3.3):
            art.box(at(u,0,8.3),(.22,108,.87),h,slate)
        for v in (-48,-26,26,48):art.box(at(0,v,-.5),(2.1,2.2,8),h,steel)
    # The statue is seated, with pointed ears, upturned muzzle, forelegs and curled tail.
    at,h=site(k,139,13.7);bronze=lin(0x897A5A)
    art.box(at(0,0,.15),(2.1,1.75,1.15),h,lin(0x807F82))
    art.tube(at(0,0,1.3),.46,.30,.89,bronze,bronze,12)
    art.tube(at(-.22,0,2.05),.29,.32,.55,bronze,bronze,12)
    art.box(at(-.52,0,2.31),(.46,.32,.22),h,bronze)
    for v in (-.19,.19):
        art.tube(at(-.22,v,2.56),.14,.01,.26,bronze,bronze,5)
        beam(art,at(-.25,v,1.97),at(-.39,v,1.31),.12,bronze)
    beam(art,at(.32,0,1.49),at(.57,.16,1.85),.17,bronze)
    # Two diagonal zebras, with separate straight strips on the four perimeter crossings.
    at,h=site(k,745,0)
    for angle,length,offset in ((.79,49,0),(-.79,49,0),(0,37,-17),(0,37,17),(math.pi/2,35,-17),(math.pi/2,35,17)):
        cs,sn=math.cos(angle),math.sin(angle)
        for j in range(-int(length/2),int(length/2),2):
            pts=[at(cs*(j+u)-sn*(offset+v),sn*(j+u)+cs*(offset+v),.05) for u,v in ((0,-2.25),(.92,-2.25),(.92,2.25),(0,2.25))]
            art.face(pts,(lin(0xCFD2D6),)*4)
    for d in (712,767,1487):
        for side in (-1,1):
            at,h=site(k,d,side*14);art.tube(at(0,0,0),.14,.10,5.1,steel,steel,8)
            art.box(at(0,0,4.5),(.45,1.24,.49),h,slate)
            for j,c in enumerate((0x52FFAF,0x5A5039,0x5B3540)):art.box(at(-.24,-.4+j*.4,4.57),(.04,.28,.28),h,lin(c))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':12,'land':{'mid':0x333544},
       'sky':[0x3B3454,0x302942,0x211E3B,0x181729,0x101123],'haze':0x514868,'light':[0xC2CCFF,1.05],
       'fill':[0xB8BCE0,0x82759D],'sun_altitude':.32,'sun_azimuth':.8}
