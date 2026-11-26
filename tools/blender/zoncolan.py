"""The Ovaro ascent of Monte Zoncolan and its three summit galleries."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 520], [1150, 557], [2150, 631], [2990, 686], [3900, 817], [4570, 947], [4910, 1022], [5220, 1093], [6300, 1240], [7570, 1408], [8800, 1547], [9700, 1631], [10380, 1684], [10910, 1728], [11400, 1756], [12180, 1802], [12375, 1810]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return (1.12 if d>9000 else .56)*math.tanh(2.40*math.sin((d-410)/365))+.14*math.sin(d/103)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    bench=21 if d<2300 or 9450<d<10250 or d>11800 else 4
    e=max(0,abs(v)-bench)
    fall=-.34 if v<0 else .32
    return elevation(d)-.24+e*fall+min(1,e/15)*(1+e*.035)*math.sin(d/39+v/14)*math.cos(d/73-v/16)

def road(r,st,length,col,bc):
    m=bc.Builder('ZoncolanAsphalt','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        w=2.36 if r.s[i]["d"]>2100 else 3.05;pts=[r.at(j,v,.045) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))]
        picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('CarnicPasture','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-180,-85,-40,-15,-5,-3,0,3,5,15,40,85,150):
            n=max(-32,min(v,32));x,y,_=r.at(i,n);y+=v-n;row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/9,y/9) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.24

def scenery(k):
    art=Painted(k);facades=pictured(k,'CarnicVillages');trees=pictured(k,'CarnicTrees');peaks=pictured(k,'CarnicPeaks');fans=pictured(k,'GiroFans');chalk=pictured(k,'GiroChalk');mural=pictured(k,'ClimberMurals')
    stone,cream,slate,wood,iron,white,pink,red,green=map(lin,(0x968F81,0xD8C7A7,0x615D5B,0x755C49,0x858785,0xE7E2D3,0xC57396,0x984F42,0x537C58))
    def panel(mesh,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(mesh,pts,((a,b),(c,b),(c,e),(a,e)))
    def card(mesh,at,w,ht,a,b):
        panel(mesh,[at(0,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,ht),(w/2,ht))],(a,0,b,1))
    for j,d in enumerate(range(-40,12430,11)):
        for side in (-1,1):
            if d<2210 and j%3==0:
                idx=(j//3+(1 if side>0 else 0))%4;idx=idx if idx!=2 or j%15==0 else 0
                v=side*(9.2+(j%4)*1.8);at,h=site(k,d,v);w=(12,13,13,12)[idx];ht=(8.4,9.3,19,8.6)[idx]
                art.box(at(0,side*2.95,-.14),(w*.82,5.65,ht*(.56 if idx==2 else .66)),h,stone)
                art.roof(at(0,side*2.95,ht*(.56 if idx==2 else .66)-.14),w*.81,5.6,2.3,h,slate if idx==2 else red)
                panel(facades,[at(x,-side*.068,z) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],(idx/4,0,(idx+1)/4,1))
            if 1760<d<8970:
                for row in range(2 if d<8050 else 1):
                    v=side*(k.rng.uniform(4.7,9.5) if row==0 else k.rng.uniform(15,29));at,h=site(k,d+k.rng.uniform(-3,3),v)
                    ht=k.rng.uniform(10,21);idx=(j+row+side)%4;bottom=ground(d,v)-elevation(d)
                    for axis in (0,1):
                        w=ht*(.65 if idx%2 else .48)
                        panel(trees,[at(x if not axis else 0,x if axis else 0,z+bottom) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],(idx/4,0,(idx+1)/4,1))
            if d>8770 and side<0 and not 9390<d<10330 and j%2==0:
                at,h=site(k,d,-2.96)
                art.box(at(0,0,-.3),(.16,.15,1.04),h,iron)
                beam(art,at(0,0,.66),k.road.pos(d+22,-2.96,.66),.098,iron)
        if d>1830 and j%7==0:
            at,h=site(k,d,-2.62)
            for n in range(4):art.box(at(n*.62,0,-.21),(.63,.47,.32+k.rng.uniform(0,.16)),h,stone)
        if d>2650 and j%6==0:
            idx=j%4;v=k.rng.uniform(-.91,.91)
            pts=[k.road.pos(d+x,v+y,.086) for x,y in ((-1.44,1.05),(-1.44,-1.05),(1.44,-1.05),(1.44,1.05))]
            panel(chalk,pts,(idx/4,0,(idx+1)/4,1))
        if d>11460 and j%2==0:
            for side in (-1,1):
                for row in range(2 if d>11980 else 1):
                    v=side*(3.8+row*3.8);at,h=site(k,d+row*2.5,v)
                    idx=(j+row+side)%4;lift=ground(d,v)-elevation(d)
                    card(fans,lambda x,y,z:at(x,y,z+lift),4.24,2.03,idx/4,(idx+1)/4)
    for j,start in enumerate((9730,9890,10062)):
        length=(50,58,72)[j]
        # Barrel vault and stone portals follow the road grade on every four-metre span.
        for off in range(0,length,4):
            d=start+off;e=min(d+4,start+length)
            for n in range(13):
                a=n*math.pi/13;b=(n+1)*math.pi/13
                pts=[k.road.pos(t,3.23*math.cos(v),2.53+3.23*math.sin(v)) for t,v in ((d,a),(e,a),(e,b),(d,b))]
                tint=slate if n%3 else stone;art.face(pts,(tint,)*4)
            for side in (-1,1):
                pts=[k.road.pos(t,side*3.23,z) for t,z in ((d,-.19),(e,-.19),(e,2.53),(d,2.53))]
                art.face(pts,(stone,slate,slate,stone))
                if off%16==4:
                    pts=[k.road.pos(t,side*3.20,z) for t,z in ((d,.47),(e,.47),(e,2.38),(d,2.38))]
                    panel(mural,pts,(j/3,0,(j+1)/3,1))
            if off%12==0:
                at,h=site(k,d);art.box(at(0,0,5.53),(1.2,.41,.088),h,cream)
        for d in (start,start+length):
            at,h=site(k,d)
            for n in range(15):
                a=n*math.pi/15;b=(n+1)*math.pi/15
                pts=[at(-.1,r*math.cos(v),2.53+r*math.sin(v)) for r,v in ((3.21,a),(3.97,a),(3.97,b),(3.21,b))]
                art.face(pts,(stone,cream,cream,stone))
            for side in (-1,1):art.box(at(0,side*3.62,-.3),(1.32,.75,2.93),h,stone)
    for j,d in enumerate(range(11860,12350,26)):
        v=(1 if j%2 else -1)*(9+j%4*2.7);at,h=site(k,d,v);lift=ground(d,v)-elevation(d)
        art.box(at(0,0,lift),(3.4,2.92,1.05),h,[cream,pink,green][j%3]);art.roof(at(0,0,lift+1.04),3.7,3.1,1.28,h,[red,cream,pink][j%3])
    at,h=site(k,12308)
    for side in (-1,1):art.box(at(0,side*3.6,.05),(.63,.61,5.23),h,pink)
    art.box(at(0,0,4.75),(.64,7.9,.92),h,pink)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def rim(t,z):return 4750+16000*math.cos(t),11800*math.sin(t),z
        panel(peaks,(rim(a,-1090),rim(b,-1090),rim(b,4760),rim(a,4760)),(u,0,v,1))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.5,'terrain':{'sea':False},'land':{'mid':0x85925E},'sky':[0xDCE2DF,0xCFE1E8,0xAFD0E0,0x96BCD4,0x80A9CB],'haze':0xB3C4C9,'light':[0xFFEDCB,1.27],'fill':[0xD7E1EB,0xACB39F],'sun_altitude':.65,'sun_azimuth':-.83}
