"""Buenos Aires: a straight sprint down the carriageways of Avenida 9 de Julio."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(length,d));return 22+.005*sum(max(0,min(s['to'],d)-s['from']) for s in stages if s['kind']=='work')+.29*math.sin(d/147)
    def heading(d):return math.radians(2)*math.sin(d/600)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('AvenidaPavement','terrain');b.colours=[]
    # The rider is in a northbound lane. Opposing traffic lies beyond the landscaped BRT median.
    def band(i,a,e,z,c):
        b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-34,69,.002,0xAEAAA4),(-27,-17,.019,0x66666A),(-16,-12,.035,0x84A060),(-12,13,.022,0x606063),(13,16,.078,0xBEB6A2),(16,24,.033,0x925D53),(24,27,.079,0xBFB7A3),(27,52,.022,0x646467),(52,57,.035,0x819D5B),(57,66,.02,0x636469)):
            band(i,a,e,z,c)
        for x in (-12.0,12.9,16.15,23.78,27.09,51.85):band(i,x,x+.10,.09,0xCEC3A0)
        if int(p['d']/6)%2==0:
            for j in range(1,7):
                for base in (-12,27):band(i,base+3.55*j,base+3.55*j+.125,.095,0xD6D4CA)
            band(i,19.96,20.09,.096,0xE5DFCE)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Avenida blocks','terrain');b.colours=[]
    for i in range(0,len(r.s)-3,3):
        b.quad(r.at(i,-570,-.5),r.at(i+3,-570,-.5),r.at(i+3,570,-.5),r.at(i,570,-.5));b.colours.extend([lin(0x9F9C90)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.35
    return None,sample


def scenery(k):
    art=Painted(k);homes=pictured(k,'PortenoFacades');mural=pictured(k,'EvitaSteel');opera=pictured(k,'TeatroColon');trees=pictured(k,'AvenidaTrees');boards=pictured(k,'PortenoBoards')
    stone=lin(0xBEB7A3);trim=lin(0xE1D7BA);glass=lin(0x728A92);steel=lin(0x848B89);red=lin(0xAE4E41);dark=lin(0x414750)
    def sign(mesh,a,u,v,z,w,h,side,uv=UV):
        picture(mesh,(a(u-w/2,v,z),a(u+w/2,v,z),a(u+w/2,v,z+h),a(u-w/2,v,z+h)),uv)
    for side,off in ((-1,-43),(1,79)):
        for n,d in enumerate(range(-70,18120,28)):
            if d%290>259 or (side==-1 and (6690<d<6850 or 9710<d<9890)):continue
            a,h=site(k,d,off);height=15+(n*13%30);w=25+(n%3)
            tint=lin((0xA4A39F,0xB5B1A5,0xAD9580,0x9DA8A8)[n%4])
            art.box(a(0,0,-.22),(w,13,height+.22),h,tint);y=-side*6.53
            if n%3:
                sign(homes,a,0,y,.04,w,height,side)
            else:
                for z in range(3,height-1,4):
                    art.box(a(0,y,z),(w-.72,.12,1.49),h,glass)
                for j in range(-10,12,5):art.box(a(j,y-side*.05,.35),(.47,.19,height-.8),h,stone)
            art.box(a(0,0,height-.21),(w+.38,13.5,.55),h,trim)
            if n%7==0:
                for u in (-4,4):art.box(a(u,y,height),(.19,.21,2.55),h,steel)
                sign(boards,a,0,y,height+1.45,13,4.5,side,((0,0),(.5,0),(.5,.5),(0,.5)))
        for d in range(-45,18120,36):
            if abs(d-9806)<50 and side==-1:continue
            lateral=-14 if side==-1 else 54;a,h=site(k,d,lateral)
            n=k.rng.choice((0,0,1,1,2));w=k.rng.uniform(7,10);height=k.rng.uniform(7.5,13);u=n/3
            for angle in (.41,1.85):
                x=w*.5*math.cos(angle);y=w*.5*math.sin(angle)
                picture(trees,(a(-x,-y,0),a(x,y,0),a(x,y,height),a(-x,-y,height)),((u+.001,0),(u+.332,0),(u+.332,1),(u+.001,1)))
    for d in (132,1260,3250,5150,7020,8640,10830,12460,13658,15850,17455):
        for off in (14.5,25.5):
            a,h=site(k,d,off);art.box(a(0,0,.09),(44,2.66,.36),h,stone)
            for u in range(-20,22,5):
                art.box(a(u,0,.41),(.14,.14,3.28),h,steel)
                art.box(a(u,.80,.43),(4.58,.10,1.53),h,lin(0x8FA6A1))
            art.box(a(0,0,3.62),(45,3.44,.28),h,red)
            for u in (-14,-5,4,13):art.box(a(u,-.42,.82),(3.14,.56,.12),h,steel)
            sign(boards,a,-6,-1.73,2.83,10,.81,1,((.5,.5),(1,.5),(1,1),(.5,1)))
    for d,side in ((3231,1),(13649,1),(17570,-1)):
        for j in range(8):
            a,h=site(k,d+j*1.34,side*(14.55+(j%3)*.54) if side==1 else -13.7)
            skin=lin((0x976C51,0xBF9477,0xAA805E)[j%3])
            for v in (-.09,.09):art.box(a(0,v,.1),(.15,.14,.79),h,dark)
            art.tube(a(0,0,.89),.17,.22,.57,lin((0x736379,0x557F82,0xC19357,0xB76C4F)[j%4]),lin((0x736379,0x557F82,0xC19357,0xB76C4F)[j%4]),8)
            art.tube(a(0,0,1.47),.12,.12,.23,skin,skin,8,skin)
    for d in (105,1155,3189,6720,9790,13638,17552,17710):
        for off in range(-26,66,2):
            a,h=site(k,d,off);art.box(a(0,0,.105),(4.7,1.02,.024),h,lin(0xD4D2C5))
        for off in (-12.7,14.7,25.7,53.7):
            a,h=site(k,d+4.8,off);art.tube(a(0,0,.02),.104,.076,4.15,steel,steel,9)
            art.box(a(0,0,3.49),(.25,.43,1.03),h,dark)
            for j,c in enumerate((0x4C7753,0x795E38,0xD34D3C)):art.box(a(-.14,0,3.59+j*.29),(.04,.25,.22),h,lin(c))
    a,h=site(k,6787,-45)
    art.box(a(0,0,-.22),(37,23,49),h,lin(0xA29E8F))
    art.box(a(0,0,48.76),(27,19,3.9),h,stone)
    sign(mural,a,0,11.55,4.4,35,43,1)
    picture(mural,(a(-18.55,11.4,4.4),a(-18.55,-11.4,4.4),a(-18.55,-11.4,46.8),a(-18.55,11.4,46.8)),UV)
    a,h=site(k,9828,-41)
    art.box(a(0,0,-.25),(67,23,16.8),h,stone);art.roof(a(0,0,16.5),66,24,5.2,h,lin(0x78766F))
    sign(opera,a,0,11.54,-.09,67,18.2,1)
    for u in (-29,-22,22,29):art.box(a(u,12.01,1.23),(.61,.81,12.2),h,trim)
    art.box(a(0,12,13.7),(64,.85,.65),h,trim)
    for n in range(4):art.box(a(0,14.2-n*.55,.04+n*.19),(33,1.65,.20),h,stone)
    a,h=site(k,17720,13.1)
    art.box(a(0,0,-.02),(76,22,.30),h,trim)
    for side in (-1,1):
        for u in (-24,24):
            art.box(a(u,side*6.6,.3),(20,6.9,.20),h,lin(0x68935A))
        for u in range(-32,35,8):
            art.box(a(u,side*10.35,.30),(.22,.22,.71),h,steel)
    for i in range(4):
        for v in (-1,1):
            art.box(a(-12+i*8,v*8,.32),(1.85,.48,.37),h,stone)
    art.box(a(0,0,.1),(20.8,20.8,.35),h,stone);art.box(a(0,0,.45),(11.7,11.7,.58),h,trim)
    levels=((1.03,3.35),(60.9,2.12),(65.2,1.84),(68.03,.05))
    shades=[lin(c) for c in (0xEEE3CA,0xD9CDB4,0xF4EBD4,0xC2BAAB)]
    for (z,r),(ez,er) in zip(levels,levels[1:]):
        for i in range(4):
            corners=((-1,-1),(1,-1),(1,1),(-1,1));u,v=corners[i];x,y=corners[(i+1)%4]
            art.face((a(r*u,r*v,z),a(r*x,r*y,z),a(er*x,er*y,ez),a(er*u,er*v,ez)),(shades[i],)*4)
    for side in (-1,1):
        art.box(a(0,side*2.11,59.25),(.38,.093,.69),h,dark)
        for u in (-5.2,5.2):art.box(a(u,side*5.2,.56),(.55,.43,.22),h,lin(0xE6C77C))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':12.0,'land':{'mid':0xA2A092},'sky':[0xE9D1B6,0xE1D6C5,0xC8D7D9,0xACC5D2,0x91B2C6],'haze':0xCCC0AE,'light':[0xFFDEAA,2.13],'fill':[0xDFDDDA,0xB7A994],'sun_radius':11,'sun_altitude':.27,'sun_azimuth':.80}
