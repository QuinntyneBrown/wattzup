"""Sydney Harbour from Circular Quay to the north shore."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 24], [400.0, 17.9104], [600.0, 16.9455], [1000.0, 11.8959], [1200.0, 10.9311], [2000.0, 0.8318], [3050.0, 9.4165], [3850.0, -0.6828], [4250.0, 4.6676], [4450.0, 4.7428], [4650.0, 7.418], [5450.0, 1.4787], [6650.0, 11.2898], [7650.0, 27.2657], [8450.0, 21.3264], [8900.0, 27.3455], [9300.0, 30.6159], [10100.0, 24.6766], [10300.0, 26.3118], [10550.0, 30.3058], [10750.0, 31.941], [11000.0, 35.9349], [11400.0, 30.8853], [11650.0, 36.1793], [12450.0, 24.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    if d < 4580:
        return (.19*math.sin(d/283)+.08*math.sin(d/117))*max(0,min(1,(4580-d)/170))
    if d < 6480:return math.tau*(d-4580)/1900
    if d < 6983:return math.tau
    if d < 8783:return math.tau*(1+(d-6983)/1800)
    if d < 9098:return 2*math.tau+math.pi*(d-8783)/315
    return 2*math.tau+math.pi+.2*math.sin((d-9098)/320)*min(1,(d-9098)/470)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('BradfieldDeck','terrain');m.colours=[];m.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        w=5.6+5.0*max(0,min(1,(p['d']-6270)/165,(7240-p['d'])/165))
        picture(m,[r.at(j,v,.041) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))],((0,0),(1,0),(1,1),(0,1)))
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('PortJackson','terrain');m.colours=[];m.uvs=[]
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s]
    for x in range(int(min(xs))-1000,int(max(xs))+1050,160):
        for y in range(int(min(ys))-950,int(max(ys))+950,160):
            pts=[(x+u,y+v,-17) for u,v in ((0,0),(160,0),(160,160),(0,160))]
            picture(m,pts,[(xx/14,yy/14) for xx,yy,z in pts])
    return m.build(col),lambda x,y:-17

def scenery(k):
    art=Painted(k);city=pictured(k,'CircularQuay');sails=pictured(k,'BennelongSails');gate=pictured(k,'LunaGate');stone=pictured(k,'HarbourGranite')
    steel,lit,deep,sandstone,pale,gold,amber,blue,red=map(lin,(0x596573,0xABB6BB,0x303947,0xA4978D,0xCBC0AA,0xF2DAA2,0xCA904C,0x6085AA,0xAA524F))
    for j,d in enumerate(range(-20,12525,12)):
        at,h=site(k,d);on=6420<d<7075;w=10.6 if on else 5.6
        art.box(at(0,0,-.54),(12.12,w*2,.52),h,deep)
        for side in (-1,1):
            art.box(at(0,side*(w+.27),-.48),(12.14,.72,1.11),h,steel)
            beam(art,at(-6,side*(w+.39),1.03),at(6,side*(w+.39),1.03),.079,lit)
            if j%2==0:
                art.box(at(0,side*(w+.39),.54),(.12,.12,.53),h,steel)
            if j%4==0:
                art.tube(at(0,side*(w+.46),.5),.113,.075,6.1,steel,steel,7)
                beam(art,at(0,side*(w+.46),6.52),at(0,side*(w-1.1),6.88),.081,steel)
                art.box(at(0,side*(w-1.12),6.78),(.49,.41,.11),h,gold)
        for v in ((-6,-3,0,3,6) if on else (0,)):
            art.box(at(0,v,.06),(3.7,.12,.014),h,pale)
        if not on and j%3==0:
            art.box(at(0,7,-1.7),(36.05,2.4,1.76),h,sandstone)
        if j%9==0 and not on:
            art.box(at(0,0,-17),(2.3,5.2,max(.2,at(0,0)[2]+16.6)),h,deep)
    # The five-hundred-metre through arch is shared by both the deck and the north-shore overlook.
    start,end=6480,6983;span=end-start
    def arch(d,side,top=0):
        f=(d-start)/span;rise=86*4*f*(1-f)+top
        at,h=site(k,d,side*13.2)
        return at(0,0,2+rise)
    for i in range(40):
        d=start+span*i/40;e=start+span*(i+1)/40
        for side in (-1,1):
            for top in (0,9.1):beam(art,arch(d,side,top),arch(e,side,top),1.0 if top==0 else .81,steel)
            beam(art,arch(d,side,0 if i%2 else 9.1),arch(e,side,9.1 if i%2 else 0),.43,lit)
            at,h=site(k,d,side*13.2);beam(art,at(0,0,.4),arch(d,side),.30,steel)
            if i%2==0:art.tube(arch(d,side,9.1),.23,.21,.47,(gold,blue,red)[(i//2)%3],gold,6,cap=gold)
        if i%2==0:
            beam(art,arch(d,-1,9.1),arch(d,1,9.1),.56,steel)
            beam(art,arch(d,-1,9.1),arch(e,1,9.1),.29,steel)
    for d in (start-16,end+16):
        for side in (-1,1):
            at,h=site(k,d,side*15.0)
            art.box(at(0,0,-17),(12.1,11.2,51),h,sandstone);art.box(at(0,0,34),(12.8,11.8,2.5),h,pale)
            for dx in (-6.09,6.09):
                picture(stone,[at(dx,v,z) for v,z in ((-5.6,-16.8),(5.6,-16.8),(5.6,34),(-5.6,34))],((0,0),(1,0),(1,1),(0,1)))
            for v in (-5.64,5.64):
                picture(stone,[at(u,v,z) for u,z in ((-6.05,-16.8),(6.05,-16.8),(6.05,34),(-6.05,34))],((0,0),(1,0),(1,1),(0,1)))
            for v in (-3.4,0,3.4):art.box(at(-6.13,v,24),(.18,1.2,5.5),h,deep)
    # Bennelong Point's stepped podium, stepped public approaches and three prominent shell ribs.
    at,h=site(k,2430,-64)
    for j in range(5):art.box(at(0,0,-3+j*.63),(86-j*2.0,38-j*1.7,.65),h,sandstone)
    for s in (.18,1.48):
        dx,dy=33.5*math.cos(s),33.5*math.sin(s)
        picture(sails,[at(x,y,z) for x,y,z in ((-dx,-dy,.08),(dx,dy,.08),(dx,dy,34),(-dx,-dy,34))],((0,0),(1,0),(1,1),(0,1)))
    for j,d in enumerate((90,2300,2520,11958)):
        at,h=site(k,d,-21)
        art.box(at(0,0,-2.4),(68,8.6,2.8),h,sandstone)
        for i in range(50):
            u=k.rng.uniform(-32,32);v=k.rng.uniform(-3.6,3.6);tint=lin((0x665E68,0x737F81,0x685561,0x676F60)[i%4])
            art.tube(at(u,v,.4),.22,.19,.81,tint,tint,6);art.tube(at(u,v,1.22),.12,.115,.21,amber,amber,6,cap=amber)
    at,h=site(k,12159,-15);art.box(at(0,0,-.5),(21,4,.74),h,sandstone)
    picture(gate,[at(0,v,z) for v,z in ((-9,.17),(9,.17),(9,15.9),(-9,15.9))],((0,0),(1,0),(1,1),(0,1)))
    for j in range(64):
        a=math.tau*j/64;b=math.tau*(j+1)/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def e(t,z):return 3500+9000*math.cos(t),8300*math.sin(t),z
        picture(city,(e(a,-230),e(b,-230),e(b,1580),e(a,1580)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':5.6,'terrain':{'sea':False},'land':{'mid':0x33383E},'sky':[0x353947,0x242838,0x1B2032,0x10192A,0x090E1B],'haze':0x323542,'light':[0xFFE2BA,1.21],'fill':[0x9AA9C3,0x776A70],'sun_altitude':.28,'sun_azimuth':-.82}
