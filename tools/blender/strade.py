"""White gravel sectors, the Crete Senesi and Siena’s two separate towers."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 164], [400.0, 155.2776], [800.0, 156.1552], [1225.0, 170.6876], [1450.0, 183.7812], [1700.0, 200.3297], [2500.0, 182.8848], [2925.0, 197.4173], [3325.0, 188.6948], [3750.0, 203.2273], [4150.0, 194.5048], [4575.0, 209.0373], [4975.0, 200.3148], [5400.0, 214.8473], [5800.0, 206.1248], [6225.0, 220.6573], [6625.0, 211.9348], [7050.0, 226.4673], [8250.0, 200.3]]

def heading(d): return .47*math.sin(d/420)+.29*math.sin(d/161)+.13*math.cos(d/72)

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    gravel=bc.Builder('WhiteGravel','terrain');gravel.colours=[];gravel.uvs=[]
    brick=bc.Builder('CampoBrick','terrain');brick.colours=[];brick.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        d=p['d'];w=3.02+.22*math.sin(d/27);w+=smooth(7800,8030,d)*7
        picture(gravel if d<7790 else brick,(r.at(i,-w,.042),r.at(i+1,-w,.042),r.at(i+1,w,.042),r.at(i,w,.042)),((0,d/6.2),(0,r.s[i+1]['d']/6.2),(1,r.s[i+1]['d']/6.2),(1,d/6.2)))
    gravel.build(col);brick.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('SenesiFields','terrain');m.colours=[];m.uvs=[];last=None
    def alt(d,v):
        bank=smooth(4,35,abs(v));hill=smooth(24,250,abs(v))
        return height(d)-.17+bank*(1.3+2.1*math.cos(d/88+v/21))+hill*(17*math.sin(v/77+d/242)+12*math.cos(v/129-d/183))
    vs=(-790,-380,-230,-150,-95,-62,-38,-24,-14,-7,-4,0,4,7,14,24,38,62,95,150,230,380,790)
    for i in range(0,len(r.s),2):
        d=r.s[i]['d'];row=[]
        for v in vs:
            x,y,_=r.at(i,v);row.append((x,y,alt(d,v)))
        if last:
            for j,(a,b,c,e) in enumerate(zip(last,last[1:],row[1:],row)):
                pts=(a,e,c,b);picture(m,pts,[(x/7,y/7) for x,y,z in pts])
                # Long arable strips on opposite slopes carry independent crop colours.
                v=vs[j];t=(math.sin(d/311+v/73)+.53*math.cos(v/59-d/237))
                tone=0x9C9D52 if t>.6 else 0xAF985C if t>.04 else 0x84934E
                if 2500<d<3700 and abs(v)>54 and t<-.46:tone=0xC6BD9D
                m.colours[-4:]=[lin(tone)]*4
        last=row
    return m.build(col),lambda x,y:height(r.s[r.tree.find((x,y,0))[1]]['d'])-.17

def scenery(k):
    art=Painted(k);sky=pictured(k,'CreteRidge');sign=pictured(k,'SectorBoards');fans=pictured(k,'SectorTifosi');trees=pictured(k,'ValCypresses');fronts=pictured(k,'SienaFronts')
    olive,forest,shadow,bark,ochre,brick,cream,black,metal=map(lin,(0x839174,0x4C6346,0x344B39,0x685D49,0xB89263,0xA45F46,0xDED4B5,0x4A4945,0xA5A9A2))
    def cypress(at,along,across,ht,w):
        i=int(abs(ht*4+along))%4;u=i/4
        for phi in (.48,2.05):
            dx=w*2.25*math.cos(phi);dy=w*2.25*math.sin(phi)
            picture(trees,[at(along+x,across+y,z) for x,y,z in ((-dx,-dy,-.24),(dx,dy,-.24),(dx,dy,ht),(-dx,-dy,ht))],((u,0),(u+.25,0),(u+.25,1),(u,1)))
    def wall(at,offset,width,ht,tile):
        u=tile/4;picture(fronts,[at(x,offset,z) for x,z in ((-width/2,.02),(width/2,.02),(width/2,ht),(-width/2,ht))],((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
    for j,d in enumerate(range(180,7740,24)):
        side=(-1,1)[j%2];v=side*(6.6+5*(j%4));at,h=site(k,d,v)
        if 1290<d<1830 or 4190<d<4800 or j%4==0:cypress(at,0,0,9.4+j%5,.98+.12*(j%3))
    for j,(d,v) in enumerate(((364,39),(1570,25),(1860,-31),(3048,54),(4818,-28),(6315,37),(7170,43))):
        at,h=site(k,d,v);art.box(at(0,0,-.5),(14,9,7.1),h,ochre);art.roof(at(0,0,6.6),14.3,9.2,2.5,h,brick)
        art.box(at(-8.3,0,-.5),(4,6,5.7),h,ochre);art.roof(at(-8.3,0,5.2),4.2,6.2,1.8,h,brick)
        for v in (-4.53,4.53):wall(at,v,14.01,6.56,0)
        for n in range(6):cypress(at,-13+n*4.1,7,9+n%3,1.05)
        for n in range(8):
            a=(n%4)*4.2-7;b=10+(n//4)*4;art.tube(at(a,b,0),.23,.14,2.7,bark,bark,7)
            art.tube(at(a,b,2.3),1.6,2.1,1.5,shadow,olive,8,cap=olive)
    def panel(at,x,v,z,w,ht,i):
        u=i*.25;picture(sign,[at(x,a,b) for a,b in ((v-w/2,z),(v+w/2,z),(v+w/2,z+ht),(v-w/2,z+ht))],((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
    for n,d in enumerate((144,1561,3133,4622,6402,8169)):
        at,h=site(k,d);art.tube(at(0,-3.55,0),.076,.06,2.18,metal,metal,7)
        panel(at,0,-3.55,1.11,1.31,.96,n%3)
        if n>=4:
            for side in (-1,1):art.box(at(0,side*3.83,0),(.43,.42,4.3),h,cream)
            art.box(at(0,0,4.18),(.59,8.1,.89),h,brick);panel(at,-.31,0,4.2,8.02,.82,3)
            for q in range(-6,13):
                for side in (-1,1):art.box(at(q*2,side*4.55,.12),(1.86,.16,.82),h,brick)
    for j,d in enumerate(list(range(6280,6470,9))+list(range(8080,8210,9))):
        for side in (-1,1):
            at,h=site(k,d,side*(5.3 if d<7000 else 7.3));w=5.7+.2*(j%4);u=(0,1) if (j+side)%2 else (1,0)
            picture(fans,[at(a,0,z) for a,z in ((-w/2,.08),(w/2,.08),(w/2,1.98),(-w/2,1.98))],((u[0],0),(u[1],0),(u[1],1),(u[0],1)))
    # Siena’s two landmarks are separated in both plan and height.
    at,h=site(k,8200,-30)
    art.box(at(0,0,0),(42,16,17),h,brick)
    for v in (-8.04,8.04):wall(at,v,42,17,1)
    for u in range(-20,22,3):art.box(at(u,7.2,17),(1.4,1.2,.95),h,brick)
    art.box(at(13,2,0),(7.2,7.2,73),h,brick)
    art.box(at(13,2,72),(9.1,9.1,3.9),h,cream)
    for a in (-2.9,2.9):
        for b in (-2.9,2.9):art.box(at(13+a,2+b,75.8),(1.22,1.22,7.1),h,cream)
    art.tube(at(13,2,76),1.85,1.14,3.4,black,black,10)
    art.box(at(13,2,82.8),(8,8,1.2),h,cream);art.roof(at(13,2,84),6.8,6.8,2.4,h,brick)
    at,h=site(k,7966,123);art.box(at(0,0,.1),(35,17,18),h,cream)
    for n in range(18):
        tone=black if n%2 else cream;art.box(at(-11,0,17+n*1.77),(5.9,5.9,1.79),h,tone)
    art.roof(at(-11,0,49),6.4,6.4,9.5,h,black)
    for n in range(6):
        r0=8.7*math.cos(n*math.pi/14);r1=8.7*math.cos((n+1)*math.pi/14)
        art.tube(at(5,0,18+n*1.46),r0,r1,1.49,lin(0x777C73),lin(0x90978C),20,cap=cream)
    art.tube(at(5,0,26.8),1.45,1.23,3.8,cream,cream,10,cap=cream)
    for j,d in enumerate(range(7830,8290,21)):
        for side in (-1,1):
            if side==-1 and 8163<d<8244:continue
            at,h=site(k,d,side*(23+2*math.sin(j)));ht=11+j%4
            art.box(at(0,0,0),(20.7,9,ht),h,(ochre,brick,cream)[j%3]);art.roof(at(0,0,ht),20.7,9,1.8,h,brick)
            wall(at,-side*4.55,20.71,ht,2+j%2)
    for j in range(64):
        a=math.tau*j/64;b=math.tau*(j+1)/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def rim(t,z):return 3990+7100*math.cos(t),6850*math.sin(t),z
        for bottom,top,v0,v1 in ((-1850,2850,0,1),(2850,19500,.999,1)):
            picture(sky,(rim(a,bottom),rim(b,bottom),rim(b,top),rim(a,top)),((u,v0),(v,v0),(v,v1),(u,v1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.15,'terrain':{'sea':False},'land':{'mid':0x9B9C6B},'sky':[0xDED3B9,0xCFD1BE,0xA8C2CB,0x8FB5C8,0x7AA5C0],'haze':0xD4C6A7,'light':[0xFFE4B3,1.48],'fill':[0xD1D9D7,0xA49365],'sun_altitude':.38,'sun_azimuth':-.93}
