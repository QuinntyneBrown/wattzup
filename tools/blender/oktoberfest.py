"""Munich's Theresienwiese, crowned tents and hillside Hall of Fame."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length));return 522+.005*sum(max(0,min(s['to'],d)-s['from']) for s in stages if s['kind']=='work')+.31*math.sin(d/140)
    def heading(d):return math.radians(8)*math.sin(d/150)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('WiesnStreet','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-15,15,.007,0xAAA294),(-7.6,7.6,.028,0x68696A),(-7.59,-7.47,.049,0xC8C4B6),(7.47,7.59,.049,0xC8C4B6)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Theresienwiese hillside','terrain');b.colours=[]
    def pt(i,side):
        p=r.s[i];x,y,z=r.at(i,side);w=smooth(14,96,abs(side))
        x+=(p['x']-x)*w;y+=(p['y']+side-y)*w
        z+=9.0*math.exp(-((p['d']-5850)/174)**2)*smooth(13,77,max(0,side))
        return x,y,z-.17
    for i in range(0,len(r.s)-3,3):
        for a,e in zip((-490,-140,-26,-9,9,26,75,140),(-140,-26,-9,9,26,75,140,490)):
            b.quad(pt(i,a),pt(i+3,a),pt(i+3,e),pt(i,e));b.colours.extend([lin(0x8A945D if abs(a)>25 else 0xA49B80)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.17
    return None,sample


def scenery(k):
    art=Painted(k);halls=pictured(k,'WiesnHalls');stalls=pictured(k,'WiesnStalls');crowd=pictured(k,'WiesnGuests');statue=pictured(k,'BavariaFigure');band=pictured(k,'Blaskapelle');boards=pictured(k,'BeerHallSigns');flags=pictured(k,'BavarianBunting')
    wood=lin(0x926F48);cream=lin(0xE7D7B0);blue=lin(0x658FAA);bronze=lin(0x6C7668);dark=lin(0x484641);stone=lin(0xB8A485);steel=lin(0x9EA4A1)
    def plate(mesh,a,y,z,width,height,u=0,v=0,span=1):
        picture(mesh,(a(-width/2,y,z),a(width/2,y,z),a(width/2,y,z+height),a(-width/2,y,z+height)),((u,v),(u+span,v),(u+span,v+span),(u,v+span)))
    for n,(d,side) in enumerate(((120,-1),(320,1),(1240,-1),(1893,-1),(2360,1),(3451,-1),(4210,1),(5220,-1),(6740,-1),(7910,1),(8970,-1),(10232,-1))):
        a,h=site(k,d,side*26.5);y=-side*12.1
        art.box(a(0,0,-.24),(45,24,8.6),h,wood);art.roof(a(0,0,8.33),45.2,24.17,6.8,h,lin(0xB39570))
        plate(halls,a,y,-.05,44.9,9.2)
        for u in (-18,-9,0,9,18):art.box(a(u,y-side*.12,-.06),(.28,.3,8.8),h,wood)
        for u in (-16,16):
            art.box(a(u,y-side*1.1,0),(3.4,3.1,11.7),h,cream);art.roof(a(u,y-side*1.1,11.7),3.54,3.31,2.3,h,blue)
        u=(n%2)*.5;v=(1-n//2%2)*.5
        picture(boards,(a(-7,y-side*.4,6.65),a(7,y-side*.4,6.65),a(7,y-side*.4,9.44),a(-7,y-side*.4,9.44)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for d in range(-65,10710,48):
        for side in (-1,1):
            if (side==1 and 5730<d<5910) or any(abs(d-v)<32 for v in (120,1893,3451,7728,10232)):continue
            a,h=site(k,d,side*15.8);art.box(a(0,0,-.15),(7.2,4.18,3.08),h,wood);art.roof(a(0,0,2.9),7.3,4.4,1.39,h,lin(0x8C5849 if d%96 else 0x65878A))
            plate(stalls,a,-side*2.13,-.04,7.16,3.12)
        if d%144==-65%144:
            a,h=site(k,d)
            for side in (-1,1):art.box(a(0,side*9.5,-.1),(.17,.17,7.86),h,wood)
            for j in range(10):
                v=-9.5+j*1.9;z=6.1+.017*v*v
                beam(art,a(0,v,z),a(0,v+1.9,6.1+.017*(v+1.9)**2),.027,.027,dark)
                picture(flags,(a(0,v+.13,z-.88),a(0,v+1.69,z-.88),a(0,v+1.69,z),a(0,v+.13,z)),UV)
    for d in range(-61,10720,6):
        for side in (-1,1):
            if abs(d%560-370)<12:continue
            a,h=site(k,d,side*(8.1+k.rng.uniform(0,1.3)))
            plate(crowd,a,0,.035,k.rng.uniform(3.65,4.65),k.rng.uniform(1.72,2.05))
    for j in range(9):
        a,h=site(k,1880+j*2.35,(-1 if j%2 else 1)*3.8);u=(j%2)/3
        picture(band,(a(0,.79,.04),a(0,-.79,.04),a(0,-.79,2.23),a(0,.79,2.23)),((u+.001,0),(u+.332,0),(u+.332,1),(u+.001,1)))
    a,h=site(k,5840,51)
    art.box(a(0,0,4.8),(8.4,7.72,6.72),h,stone)
    plate(statue,a,-1.8,11.48,11.3,18.35)
    a,h=site(k,5846,74)
    for j in range(17):art.tube(a(-34+j*4.26,-3,8.4),.65,.53,6.83,stone,cream,12)
    art.box(a(0,0,8.4),(71,6.5,.68),h,cream);art.box(a(0,2.87,8.74),(70,.85,6.6),h,stone)
    art.box(a(0,0,15.05),(72,7.3,.97),h,cream);art.roof(a(0,0,16),72,7.4,1.9,h,lin(0x846A54))
    for n in range(5):
        a,h=site(k,10258+9*n,-33-n%2*4);r=6.2-n*.33
        pts=[a(0,r*math.cos(j*math.tau/28),r+1.1+r*math.sin(j*math.tau/28)) for j in range(29)]
        for p,q in zip(pts,pts[1:]):beam(art,p,q,.33,.31,lin((0xD35D47,0xD4B041,0x548C66,0x4D74A5,0x94718B)[n]))
    a,h=site(k,10223,21);art.tube(a(0,0,-.06),5.85,5.85,.49,wood,cream,22)
    for j in range(10):art.tube(a(4.7*math.cos(j*math.tau/10),4.7*math.sin(j*math.tau/10),.42),.055,.052,4.08,cream,cream,8)
    art.tube(a(0,0,4.4),6.08,.62,2.3,lin(0xC6534A),lin(0xE5B25D),22)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':7.6,'land':{'mid':0x92975E},'sky':[0xEBD5B9,0xE6D8C0,0xD6DAD7,0xAFCCD8,0x92BCCE],'haze':0xD0C4AE,'light':[0xFFE3AB,2.13],'fill':[0xDFE0D8,0xB9AA8D],'sun_radius':11,'sun_altitude':.31,'sun_azimuth':.79}
