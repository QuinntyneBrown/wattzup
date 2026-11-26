"""Port Hercule, the climb to Casino Square and the return under the Fairmont."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

SEA=1.8


def heading(d):
    return -math.radians(30)*math.sin(d/60)*math.cos(d/162+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def altitude(d):
        d=max(0,min(length,d));hill=36*(smooth(1980,3240,d)-smooth(3340,4620,d))
        stage=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 5.3+hill+1.5*math.sin(d/550)+stage*.00037
    x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=altitude(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(altitude(d+bc.STEP)-z)/bc.STEP))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn)
    return rows,stages,length,mean,.037


def road(r,st,length,col,bc):
    b=bc.Builder('RaceTarmac','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        kerb=0xC33A3E if i%2 else 0xEEE8DF;asphalt=0x383C42 if 4660<p['d']<4972 else 0x505153
        for a,e,z,c in ((-9,9,-.035,0xA2A5A3),(-5.35,5.35,.008,asphalt),(-5.29,-4.92,.055,kerb),(4.92,5.29,.055,kerb),(-4.85,-4.75,.019,0xE8E7DF),(4.75,4.85,.019,0xE8E7DF)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
        if i%6==0 and (p['d']<380 or 6260<p['d']<6880):
            for side in (-1,1):
                for u,v in ((2.2,2.28),(3.6,3.68)):
                    b.quad(r.at(i,side*u,.024),r.at(i+1,side*u,.024),r.at(i+1,side*v,.024),r.at(i,side*v,.024));b.colours.extend([lin(0xD9D5CB)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Harbour terraces','terrain');b.colours=[];water=bc.Builder('HerculeWater','terrain');water.colours=[]
    previous=None
    for i in range(0,len(r.s),3):
        p=r.s[i]
        row=[]
        for off,rise in ((-410,80),(-165,48),(-75,24),(-27,5),(-12,0),(0,0),(11,0),(18,0),(18.5,-5)):
            x,y,z=r.at(i,off);w=smooth(24,80,abs(off));x+=(p['x']-x)*w;y+=(p['y']+off-y)*w
            row.append(((x,y,z+rise-.14),lin(0x969994 if off>-27 else 0x8D997D)))
        if previous:
            for a,c,e,f in zip(previous,previous[1:],row[1:],row):
                b.quad(a[0],f[0],e[0],c[0]);b.colours.extend([a[1],f[1],e[1],c[1]])
        previous=row
        if i+3<len(r.s):
            a=r.at(i,17);e=r.at(i+3,17);water.quad((a[0],a[1],SEA),(e[0],e[1],SEA),(e[0],e[1]+1400,SEA),(a[0],a[1]+1400,SEA));water.colours.extend([lin(0x327897)]*4)
    b.build(col);water.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.1
    return None,sample


def panel(mesh,coords,tile):
    u=tile%2*.5;v=(1-tile//2)*.5
    picture(mesh,coords,((u+.006,v+.006),(u+.494,v+.006),(u+.494,v+.494),(u+.006,v+.494)))


def yacht(art,a,scale,seed):
    white=lin(0xF2F1E9);glass=lin(0x374A56);teak=lin(0xC49877);steel=lin(0xA5B3B7)
    def at(u,v,w):return a(u*scale,v*scale,w*scale)
    prev=None
    for v,r,up in ((0,3.6,.05),(1.4,4.15,0),(5,4.45,0),(18,4.2,.15),(24,3.4,.38),(29,1.7,.73),(31,.12,1.05)):
        ring=[at(-r*.70,v,-.7+up),at(-r,v,1.48+up),at(-r*.98,v,2.11+up),at(r*.98,v,2.11+up),at(r,v,1.48+up),at(r*.70,v,-.7+up)]
        if prev:
            for j in range(6):
                n=(j+1)%6;t=teak if j==2 else white;art.face((prev[j],ring[j],ring[n],prev[n]),(t,)*4)
        else:art.face(tuple(reversed(ring)),(white,)*6)
        prev=ring
    art.face(tuple(prev),(white,)*6)
    for floor,(start,end,r) in enumerate(((2.5,22,3.48),(5.2,20,2.78),(9,17.8,2.04))):
        z=2.09+floor*1.62
        for side in (-1,1):
            a1=at(side*r,start,z);a2=at(side*r,end,z);a3=at(side*r*.91,end-.6,z+1.38);a4=at(side*r*.91,start+.5,z+1.38)
            art.face((a1,a2,a3,a4),(glass,)*4)
            for j in range(4):beam(art,at(side*r,start+1+j*(end-start-2)/3,z),at(side*r*.94,start+1+j*(end-start-2)/3,z+1.38),.070*scale,.072*scale,white)
        for v in (start,end):
            art.face((at(-r,v,z),at(r,v,z),at(r*.91,v+.18,z+1.38),at(-r*.91,v+.18,z+1.38)),(glass,)*4)
        art.face((at(-r-.30,start-.7,z+1.5),at(r+.3,start-.7,z+1.5),at(r+.3,end+.5,z+1.5),at(-r-.3,end+.5,z+1.5)),(white,)*4)
    for u in (-2.7,2.7):beam(art,at(u,.5,2.6),at(u,4.7,2.6),.055,.07,white)
    beam(art,at(0,14,6.7),at(.1,14.8,10.2),.09,.12,steel)


def scenery(k):
    art=Painted(k);facades=pictured(k,'CircuitFronts');casino=pictured(k,'CasinoFront');fences=pictured(k,'DebrisFence');palms=pictured(k,'RivieraPalms');words=pictured(k,'TrackWords');boards=pictured(k,'CircuitBoards');palace=pictured(k,'PalaceRock')
    k.B['TunnelLamps']=type(k.B['terrain'])('TunnelLamps','terrain');light=Painted(k,'TunnelLamps')
    silver=lin(0xB1BAC0);cream=lin(0xD5C4AB);blue=lin(0x5378A3);roof=lin(0x63716E)
    for d in range(-60,10050,9):
        for side in (-1,1):
            a,h=site(k,d,side*5.57);e,eh=site(k,d+9,side*5.57)
            for z in (.33,.62,.9):beam(art,a(0,0,z),e(0,0,z),.135,.15,silver)
            art.box(a(0,0,.02),(.12,.18,1.02),h,silver)
            if 4660<d<4972:continue
            panel(fences,(a(0,side*.10,1),e(0,side*.10,1),e(0,side*.32,3.1),a(0,side*.32,3.1)),0)
            beam(art,a(0,side*.1,.91),a(0,side*.32,3.15),.05,.05,roof)
        if 4650<=d<4980:
            a,h=site(k,d,0);e,eh=site(k,d+9,0)
            for side in (-1,1):
                for v1,z1,v2,z2 in ((6.5,0,6.5,3.7),(6.5,3.7,5.2,5.4),(5.2,5.4,2.8,6.4),(2.8,6.4,0,6.55)):
                    c=lin(0x72716D if z1<1 else 0x504D49);art.face((a(0,side*v1,z1),e(0,side*v1,z1),e(0,side*v2,z2),a(0,side*v2,z2)),(c,)*4)
                light.box(a(0,side*4.78,5.4),(4.2,.30,.13),h,lin(0xFFF0C7))
                art.box(a(0,side*6.3,1.22),(8.68,.16,1.02),h,lin(0xA84E47))
    for d in range(-64,9950,26):
        a,h=site(k,d,-15);high=k.rng.uniform(10,22);span=25.6
        if not (1490<d<1840 or 3100<d<3420 or 4650<d<4990 or 6300<d<6780):
            art.box(a(0,-3.6,0),(span,7.2,high),h,cream);panel(facades,(a(-span/2,.055,0),a(span/2,.055,0),a(span/2,.055,high),a(-span/2,.055,high)),0)
        if d%3==0:
            a,h=site(k,d,-54);art.box(a(0,0,7),(20,12,high+4.2),h,lin(0xCBAF98))
            panel(facades,(a(-10,6.05,7),a(10,6.05,7),a(10,6.05,11+high),a(-10,6.05,11+high)),0)
        if d<1470 or 6900<d<9760:
            a,h=site(k,d,19.8);x,y,z=a(0,0)
            def sea(u,v,w):return a(u,v,SEA-z+w)
            yacht(art,sea,k.rng.uniform(.70,1.20),d)
        if 1250<d<1940 or 6230<d<6860:
            a,h=site(k,d,-9.0)
            for j in range(6):
                art.box(a(0,-j*.95,j*.60),(25.4,1.25,.62),h,blue)
                panel(facades,(a(-12.7,-j*.95+.66,j*.6+.1),a(12.7,-j*.95+.66,j*.6+.1),a(12.7,-j*.95-.27,j*.6+.97),a(-12.7,-j*.95-.27,j*.6+.97)),2)
            if d%2:
                beam(art,a(-11,-5.7,3.7),a(11,-5.7,4.04),.055,.07,silver)
        if 6300<d<6780:
            a,h=site(k,d,11.8);art.box(a(0,4,0),(25.5,8,5.6),h,cream)
            panel(facades,(a(-12.7,-.06,0),a(12.7,-.06,0),a(12.7,-.06,5.5),a(-12.7,-.06,5.5)),1)
    a,h=site(k,3271,-29)
    picture(casino,(a(-22,0,.1),a(22,0,.1),a(22,0,23.1),a(-22,0,23.1)),((0,0),(1,0),(1,1),(0,1)))
    art.box(a(0,-5,0),(39,9.5,11.5),h,cream)
    for d in (3180,3198,3260,3292,3350,9090,9194,9280):
        a,h=site(k,d,-10.2)
        for angle in (.2,1.75):
            dx=3.6*math.cos(angle);dy=3.6*math.sin(angle)
            picture(palms,(a(-dx,-dy,.1),a(dx,dy,.1),a(dx,dy,8.6),a(-dx,-dy,8.6)),((0,0),(1,0),(1,1),(0,1)))
    for d,tile,side in ((108,0,1),(1625,1,-1),(1644,0,-1),(3260,3,-1),(4683,3,1),(4880,1,-1),(6504,2,1),(6552,1,-1),(6590,2,1),(9304,0,1)):
        a,h=site(k,d,side*5.5)
        panel(boards,(a(-4.3,0,.88),a(4.3,0,.88),a(4.3,0,2.0),a(-4.3,0,2.0)),tile)
    for d in (145,1640,4634,6548,6770):
        a,h=site(k,d,-7.3)
        art.box(a(0,0,0),(3.1,1.6,.75),h,roof)
        for dx in (-.68,.73):
            orange=lin(0xEA7038);helmet=lin(0xEAE8DB)
            art.tube(a(dx,0,.74),.21,.24,.70,orange,orange,7,orange)
            art.tube(a(dx,0,1.44),.16,.13,.30,helmet,helmet,8,helmet)
            beam(art,a(dx-.18,0,1.32),a(dx-.42,.04,1.04),.11,.12,orange)
    for d in (92,1635,6510,6570):
        index=k.road.index(d)
        u=.5 if d in (1635,6570) else 0
        picture(words,(k.road.at(index,-1.7,.029),k.road.at(index,1.7,.029),k.road.at(index+2,1.7,.029),k.road.at(index+2,-1.7,.029)),((u,0),(u+.5,0),(u+.5,1),(u,1)))
    a,h=site(k,9430,79)
    picture(palace,(a(-49,0,-2.7),a(49,0,-2.7),a(49,0,42),a(-49,0,42)),((0,0),(1,0),(1,1),(0,1)))
    # The palace sits above the harbour wall on the ochre limestone rock.
    a,h=site(k,9490,96);far=Painted(k,'peaks')
    for j in range(11):
        x=(j-5)*11;high=31+8*math.cos(x/46)
        far.tube(a(x,0,-3),19,12,high,lin(0x8F8975),lin(0xAEAA91),10,lin(0x849274))
        far.box(a(x,0,high-3),(12.5,11,5.0),h,cream);far.roof(a(x,0,high+2),13,12,1.2,h,lin(0xA96E57))
        if j in (2,5,8):far.tube(a(x,-4,high+1),2.5,2.5,6.2,cream,cream,4,cream)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.95,
       'land':{'mid':0x94978B},'sky':[0xCADFE8,0xA4D1EB,0x76B5E1,0x548FC8,0x326CA5],'haze':0xBACEDD,
       'light':[0xFFEBCA,1.95],'fill':[0xC1DFF2,0x9F9B8B],'sun_radius':10,'sun_altitude':.57,'sun_azimuth':.58}
