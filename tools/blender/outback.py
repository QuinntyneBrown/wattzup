"""The Lasseter Highway from the Erldunda turn to the evening light on Uluru."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import picture,pictured,site
from bondi import beam

UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def elevation(d):
        d=max(0,min(length,d))
        load=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 482+2.75*math.sin(d/883)+1.33*math.sin(d/340)+.00093*load+.00042*d
    def heading(d):return .012*math.sin(d/1123)+.065*smooth(3030,3250,d)-.060*smooth(8390,8660,d)
    x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;z=elevation(d);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,stages,length,mean,.09


def road(r,st,length,col,bc):
    seal=bc.Builder('LasseterSeal','terrain');seal.colours=[]
    for i,p in enumerate(r.s[:-1]):
        strips=[(-3.82,3.82,.016,0x826B56),(-3.59,3.59,.035,0x575655),(-3.32,-3.19,.054,0xDED7C8),(3.19,3.32,.054,0xDED7C8)]
        if int((p['d']+800)/8)%3==0:strips.append((-.063,.063,.056,0xE3DCCB))
        for a,e,z,c in strips:
            seal.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));seal.colours.extend([lin(c)]*4)
    seal.build(col)


def land(r,col,theme,bc):
    earth=bc.Builder('RedSand','terrain');earth.colours=[];earth.uvs=[]
    for i in range(0,len(r.s)-3,3):
        for l,e,colr in ((-1900,-220,0xA79075),(-220,-30,0xB79D72),(-30,-10,0xD8BC8C),(-10,-3.5,0xEFE2CD),(-3.5,3.5,0xD9BE96),(3.5,10,0xF0E4D0),(10,30,0xD7BD91),(30,220,0xBCA47C),(220,1900,0xA99074)):
            pts=[]
            for j,off in ((i,l),(i+3,l),(i+3,e),(i,e)):
                p=r.s[j];x,y,z=r.at(j,off);k=smooth(15,95,abs(off));x+=(p['x']-x)*k;y+=(p['y']+off-y)*k
                z-=.13+.45*smooth(3.5,14,abs(off));z+=k*(1.3*math.sin(x/149+y/82)+.8*math.cos(y/58))
                pts.append((x,y,z))
            earth.quad(*pts);earth.colours.extend([lin(colr)]*4);earth.uvs.extend([(x/17,y/12) for x,y,z in pts])
    earth.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.21
    return None,sample


def scenery(k):
    art=Painted(k);bush=pictured(k,'DesertScrub');front=pictured(k,'StationFront');boards=pictured(k,'LasseterSigns');rocks=pictured(k,'RedCentreRock')
    timber=lin(0x8D7962);white=lin(0xDBD8C7);steel=lin(0xA5A29C);rust=lin(0x99634B);char=lin(0x47433B)
    def rock(d,off,rx,ry,high,kind,phase):
        a,h=site(k,d,off);n=64
        tiers={'mesa':((1,-.01),(.91,.19),(.79,.33),(.73,.78),(.69,.94),(.60,1)),
               'dome':((1,-.01),(.94,.23),(.81,.48),(.61,.74),(.38,.92),(.04,1)),
               'uluru':((1,-.01),(.94,.18),(.90,.43),(.78,.72),(.60,.93),(.34,1.0),(.03,.998))}[kind]
        def pt(i,r,z):
            t=math.tau*i/n
            if kind=='uluru':
                # Broad west shoulder, long sloping eastern nose and furrows in the steep flanks.
                taper=1-.22*max(math.cos(t),0)*z
                f=1+.026*math.sin(t*7)+.038*math.cos(t*12+.3)*(1-abs(z-.54))
                height=high*z*(.93-.105*math.cos(t)+.044*math.sin(2*t+.7))
                return a(rx*(r*math.cos(t)*f*taper-.13*z),ry*r*f*math.sin(t),height-2.5)
            rough=.02 if kind=='mesa' else .046
            f=1+rough*math.sin(5*t+phase)+.019*math.cos(7*t)
            return a(rx*r*f*math.cos(t),ry*r*f*math.sin(t),high*z*(1+(.013 if kind=='mesa' else .061)*math.cos(2*t+phase))-2.5)
        for j in range(n):
            for (r,z),(rr,zz) in zip(tiers,tiers[1:]):
                points=(pt(j,r,z),pt(j+1,r,z),pt(j+1,rr,zz),pt(j,rr,zz))
                shade=.62+.31*(1+math.cos(j*math.tau/n+.65))/2
                if kind=='mesa':shade*=.80
                if kind=='dome':shade*=.88
                picture(rocks,points,tuple(((p[0]+p[1]*.19)/max(76,rx*.55),p[2]/(high*1.18)) for p in points))
                rocks.colours[-4:]=[(shade,shade*.90,shade*.88,1)]*4
            r,z=tiers[-1];pts=(pt(j,r,z),pt(j+1,r,z),a(-.11*rx if kind=='uluru' else 0,0,high-2.5))
            art.face(pts,(lin(0xAB7054 if kind!='mesa' else 0x937A71),)*3)
    rock(5760,-820,460,139,102,'mesa',0)
    for j,(dx,dy,rx,ry,ht) in enumerate(((-280,68,128,111,126),(-167,34,119,96,158),(-65,75,110,100,144),(38,0,98,110,176),(138,84,125,114,130),(252,25,102,96,151),(344,91,88,75,104))):rock(8230+dx,590+dy,rx,ry,ht,'dome',j*.7)
    rock(10680,-640,425,183,176,'uluru',0)
    for n,d in enumerate(range(-67,10845,7)):
        for side in (-1,1):
            for layer in range(3):
                off=side*(k.rng.uniform(5.1,15) if layer==0 else k.rng.uniform(15,60) if layer==1 else k.rng.uniform(60,146))
                a,h=site(k,d+k.rng.uniform(-2.3,2.3),off);variant=(n+layer)%4
                if layer==0 and n%13!=0:variant=2+n%2
                high=(k.rng.uniform(5,8.8) if variant==0 else k.rng.uniform(2.4,5.2) if variant==1 else k.rng.uniform(.45,1.45))
                width=(.49 if variant==0 else .74 if variant==1 else .67)*high;u=variant*.25
                for angle in (.29,1.67):
                    dx=width*math.cos(angle);dy=width*math.sin(angle)
                    picture(bush,(a(-dx,-dy,-.49),a(dx,dy,-.49),a(dx,dy,high-.4),a(-dx,-dy,high-.4)),((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
        if n%7==0:
            for side in (-1,1):
                a,h=site(k,d,side*4.55);art.box(a(0,0,-.14),(.11,.13,1.01),h,white);art.box(a(-.06,0,.66),(.015,.09,.15),h,lin(0xB84D38))
    for d,side in ((135,1),(3671,-1)):
        a,h=site(k,d,side*18);art.box(a(0,0,-.24),(21,8,3.85),h,lin(0xB1A38E));art.roof(a(0,0,3.58),21.8,8.8,1.72,h,rust)
        y=-side*4.07
        picture(front,(a(-10.5,y,-.04),a(10.5,y,-.04),a(10.5,y,4.71),a(-10.5,y,4.71)),UV if side>0 else ((1,0),(0,0),(0,1),(1,1)))
        art.box(a(0,y-side*1.59,3.44),(21.8,3.86,.22),h,rust)
        for u in (-9.1,-3,3,9.1):art.box(a(u,y-side*3.2,-.17),(.16,.16,3.73),h,timber)
        for j in (-1,1):
            u=j*4.3;v=y-side*5.15
            art.box(a(u,v,-.08),(.79,.60,1.43),h,lin(0x57796F));art.box(a(u,v,1.35),(.89,.65,.59),h,white)
            art.box(a(u,v-side*.34,1.53),(.52,.035,.19),h,char)
            beam(art,a(u+.42,v,1.68),a(u+.58,v,.37),.075,.07,char)
    for j,d in enumerate((118,1739,3652,5450,7914,10243)):
        a,h=site(k,d,4.72);u=j%3/3;v=(1-j//3)*.5
        for off in (-.66,.66):art.box(a(0,off,-.12),(.1,.10,2.76),h,steel)
        picture(boards,(a(-.09,1.3,1.27),a(-.09,-1.3,1.27),a(-.09,-1.3,2.86),a(-.09,1.3,2.86)),((u,v),(u+1/3,v),(u+1/3,v+.5),(u,v+.5)))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.59,'land':{'mid':0xAC7E5B},'sky':[0xEBDBBC,0xD1DEE5,0xA5CFEB,0x72AEDA,0x518FC8],'haze':0xCABBA7,'light':[0xFFF0BF,2.44],'fill':[0xE2E1CA,0xBF9F82],'sun_radius':10,'sun_altitude':.71,'sun_azimuth':.77}
