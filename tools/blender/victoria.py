"""Tsim Sha Tsui waterfront from the Kowloon railway clock tower."""
import math
from arenberg import beam
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin

PROFILE=[[0, 5], [1200, 6], [2400, 5], [3380, 6], [5100, 5], [7180, 7], [8200, 6], [9400, 6]]
def elev(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]
def heading(d):
    return .055*math.sin(d/330)+.085*math.sin(d/810)
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);rows.append(dict(d=d,x=x,y=y,z=elev(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elev(d+.5)-elev(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum(s['level']*(s['to']-s['from']) for s in st)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('KowloonTiles','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        for lo,hi in ((-7.2,8.2),):
            pts=[r.at(n,v,.05) for n,v in ((i,lo),(i+1,lo),(i+1,hi),(i,hi))]
            picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('HarbourGround','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-200,-32,-14,-7,3,8,10,40,140):
            x,y,z=r.at(i,v);z-=.14+min(7,max(0,v-8)*2.5)
            row.append((x,y,z))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/6,y/6) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elev(r.s[r.tree.find((x,y,0))[1]]['d'])-.15

def scenery(k):
    art=Painted(k);sea=pictured(k,'VictoriaWater');facades=pictured(k,'KowloonFronts');people=pictured(k,'HarbourVisitors')
    marks=pictured(k,'StarPlaques');back=pictured(k,'VictoriaPeak');windows=pictured(k,'CentralWindows')
    bronze,cream,brick,grey,iron,lamp,green=map(lin,(0x867251,0xDBBE88,0xAB7451,0x797679,0x696E77,0xFFE4A3,0x42655F))
    def panel(m,pts,u,v):picture(m,pts,((u,0),(v,0),(v,1),(u,1)))
    for j,d in enumerate(range(-45,9470,5)):
        at,h=site(k,d,8.05)
        beam(art,at(0,0,-.12),at(0,0,1.23),.068,iron)
        for z in (.28,.62,1.21):beam(art,at(0,0,z),k.road.pos(d+5,8.05,z),.065 if z>1 else .033,cream if z>1 else iron)
        if j%6==0:
            at,h=site(k,d,-5.9)
            art.tube(at(0,0,-.15),.13,.065,5.3,iron,grey,9)
            for v in (-.73,.73):
                beam(art,at(0,0,4.48),at(0,v,5.42),.079,iron)
                art.tube(at(0,v,5.33),.29,.20,.26,lamp,lamp,9,cap=lamp)
        if j%6==1:
            v=(5.8 if j%4 else -4.8);at,h=site(k,d,v)
            idx=(j//6)%4;w=3.4
            panel(people,[at(0,y,z) for y,z in ((w/2,0),(-w/2,0),(-w/2,1.96),(w/2,1.96))],idx/4,(idx+1)/4)
        if j%8==0 and 2950<d<4100:
            at,h=site(k,d,3.38)
            pts=[at(x,v,.077) for x,v in ((-.73,.67),(-.73,-.67),(.73,-.67),(.73,.67))]
            panel(marks,pts,.50,.75)
        if j%8==0 and (d<510 or d>2600):
            at,h=site(k,d,-17);idx=(j//8)%4;high=(10,16,12,21)[idx]
            art.box(at(0,-4.8,-.4),(36,9.6,high),h,grey)
            panel(facades,[at(x,.08,z) for x,z in ((-18,0),(18,0),(18,high),(-18,high))],idx/4,(idx+1)/4)
            if j%24==0:
                at,h=site(k,d,-6.3)
                art.box(at(0,0,.42),(2.8,.78,.21),h,bronze)
                art.box(at(0,-.33,.57),(2.8,.17,.57),h,bronze)
    # Railway tower: cream masonry plinth and cornices against the red brick shaft.
    at,h=site(k,177,-9.8)
    for z,w,deep,high,c in ((-.22,7,7,1.4,cream),(1.16,5.8,5.8,18.6,brick),(19.75,6.35,6.35,.8,cream),(20.51,5.4,5.4,5.2,brick),(25.68,5.95,5.95,.58,cream),(26.23,4.62,4.62,.53,cream)):
        art.box(at(0,0,z),(w,deep,high),h,c)
    for dx in (-2.67,2.67):
        for v in (-2.67,2.67):art.box(at(dx,v,1.0),(.32,.32,18.9),h,cream)
    for side in (-1,1):
        for z in (4,8,12,16):
            art.box(at(0,side*2.92,z),(.96,.10,2.95),h,iron)
        panel(marks,[at(x,side*2.73,z) for x,z in ((-1.8,20.9),(1.8,20.9),(1.8,24.5),(-1.8,24.5))],0,.25)
        panel(marks,[at(side*2.73,v,z) for v,z in ((1.8,20.9),(-1.8,20.9),(-1.8,24.5),(1.8,24.5))],0,.25)
    for dx in (-1.6,1.6):
        for v in (-1.6,1.6):art.box(at(dx,v,26.75),(.56,.56,2.5),h,cream)
    art.roof(at(0,0,29.1),4.7,4.7,1.57,h,green);beam(art,at(0,0,30.6),at(0,0,34.3),.074,bronze)
    # Two-storey ferry pier and the lit covered boarding galleries.
    at,h=site(k,1689,19)
    art.box(at(0,0,-1.95),(57,15,2.32),h,grey)
    for z in (.33,3.4,6.3):art.box(at(0,0,z),(57.6,16.5,.34),h,cream)
    for x in range(-27,28,4):
        for side in (-1,1):
            art.box(at(x,side*7.15,.59),(.26,.26,5.8),h,green)
            beam(art,at(x,side*7.16,3.62),at(x+3.8,side*7.16,6.15),.09,cream)
            beam(art,at(x,side*7.16,6.15),at(x+3.8,side*7.16,3.62),.09,cream)
            art.box(at(x,side*7.25,1.58),(3.6,.09,.13),h,green)
    art.roof(at(0,0,6.62),58,16,2.05,h,green)
    # Bronze footwork, bent knees, extended lead arm and open trailing hand on a stone block.
    at,h=site(k,3413,6.6);art.box(at(0,0,-.13),(3.65,2.45,1.02),h,grey)
    def limb(a,b,r):beam(art,at(*a),at(*b),r,bronze)
    hip=(0,0,1.88);chest=(-.14,.10,2.58)
    limb(hip,chest,.31)
    for knee,foot in (((-.52,.14,1.53),(-.77,.28,.91)),((.44,-.20,1.46),(.84,-.26,.92))):
        limb(hip,knee,.195);limb(knee,foot,.143);art.box(at(foot[0]-.07,foot[1],.88),(.38,.18,.11),h,bronze)
    for shoulder,elbow,hand in (((-.18,-.13,2.53),(-.52,-.22,2.43),(-.86,-.34,2.58)),((-.08,.30,2.52),(.14,.47,2.34),(.24,.35,2.69))):
        limb(shoulder,elbow,.12);limb(elbow,hand,.10)
        art.tube(at(*hand),.086,.067,.12,bronze,bronze,7,cap=bronze)
    art.tube(at(-.22,.07,2.65),.155,.135,.29,bronze,bronze,10,cap=bronze)
    # Far towers are fixed to the opposite shore. Preserve individual crown and brace silhouettes.
    for j,(d,v,w,dep,high,style) in enumerate(((6700,620,54,50,201,0),(7010,610,57,55,278,1),(7210,576,46,44,226,2),(7350,620,62,51,154,0),(7580,690,50,55,195,0),(7920,660,48,44,236,3),(8310,680,46,44,164,0),(8900,610,52,47,201,0),(9210,649,56,49,188,1))):
        at,h=site(k,d,v);wide=w
        for n in range(3 if style==1 else 1):
            low=0 if n==0 else high+(n-1)*9
            height=high if n==0 else 9
            a=wide/2-n*3;b=dep/2-n*3
            corners=((-a,-b),(a,-b),(a,b),(-a,b))
            for z in range(4):
                A=corners[z];B=corners[(z+1)%4]
                panel(windows,[at(A[0],A[1],low),at(B[0],B[1],low),at(B[0],B[1],low+height),at(A[0],A[1],low+height)],(j%4)/4,(j%4+1)/4)
        if style==2:
            for n in range(3):
                z=n*high/3
                for sign in (-1,1):beam(art,at(sign*w/2,-dep/2,z),at(-sign*w/2,-dep/2,z+high/3),1.0,cream)
        if style in (2,3):beam(art,at(0,0,high),at(1,0,high+42),.84,lamp)
    for d in range(-90,9510,20):
        pts=[k.road.pos(x,v,-4.7) for x,v in ((d,8.2),(d+20,8.2),(d+20,1350),(d,1350))]
        picture(sea,pts,[(x/18,y/18) for x,y,z in pts])
    for j in range(64):
        a=j*math.tau/64;b=(j+1)*math.tau/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def rim(t,z):return 4300+11000*math.cos(t),8400*math.sin(t),z
        panel(back,(rim(a,-1450),rim(b,-1450),rim(b,3050),rim(a,3050)),u,v)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.5,'terrain':{'sea':False},'land':{'mid':0x363745},'sky':[0x646071,0x3D4059,0x292F48,0x1A2339,0x101A2D],'haze':0x4F4B60,'light':[0xD7DCF0,1.14],'fill':[0xA2A8CB,0x897B84],'sun_altitude':.52,'sun_azimuth':-.90,'night':True}
