"""Brooklyn's park drive, twice around a single landscape on the original GCN clock."""
import math

from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

LAP = 6200
PROFILE = ((0,28),(500,29),(1240,31),(1700,30),(2080,36),(2450,49),(2860,59),(3320,53),
           (4060,40),(4650,31),(5130,24),(5720,24),(6200,28))
WATER = 22.1


def height(d):
    d %= LAP
    for (a, z), (b, y) in zip(PROFILE, PROFILE[1:]):
        if d <= b:
            return z + (y-z) * smooth(a,b,d)


def heading(d):
    angle = math.tau*d/LAP
    return angle + .41*math.sin(2*angle) + .17*math.sin(4*angle+.25)


# Integrating a unit tangent keeps chainage in metres. Opposite halves cancel exactly.
CENTRE = [(0.,0.)]
for station in range(LAP):
    x,y = CENTRE[-1]
    a = heading(station+.5)
    CENTRE.append((x+math.cos(a),y+math.sin(a)))


def pos(d, left=0, up=0):
    s=d%LAP
    i=int(s)
    a=heading(s)
    x,y=CENTRE[i]
    return (x+(s-i)*math.cos(a)-left*math.sin(a),
            y+(s-i)*math.sin(a)+left*math.cos(a), height(d)+up)


def route(course, theme, bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        x,y,z=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=(heading(d+1)-heading(d-1))/2,
                         g=100*(height(d+bc.STEP)-z)/bc.STEP))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return rows,stages,length,mean,.02


def ground(d,v):
    shore=smooth(4730,4910,d)*(1-smooth(5820,5960,d))*smooth(7,28,v)*(1-smooth(140,245,v))
    return (height(d)+2*math.sin(d/147+v/71)*smooth(7,65,abs(v)))*(1-shore)+(WATER-1.5)*shore


def land(r,col,theme,bc):
    b=bc.Builder('BrooklynLawn','terrain')
    b.colours=[]
    bands=(-290,-160,-85,-39,-17,-5,5,13,26,38,79,120,154,245,315)
    for d in range(0,LAP,10):
        for u,v in zip(bands,bands[1:]):
            pts=((d,u),(d+10,u),(d+10,v),(d,v))
            b.quad(*(pos(t,s,ground(t,s)-height(t)-.06) for t,s in pts))
            for t,s in pts:
                n=int(3*math.sin(t/44+s/23)+3*math.cos(s/29+t/51))
                b.colours.append(lin(0x809654+n*0x010101))
    b.build(col)
    def sample(x,y):
        i=min(range(0,LAP,40),key=lambda t:(CENTRE[t][0]-x)**2+(CENTRE[t][1]-y)**2)
        a=heading(i)
        d=i+(x-CENTRE[i][0])*math.cos(a)+(y-CENTRE[i][1])*math.sin(a)
        v=-(x-CENTRE[i][0])*math.sin(a)+(y-CENTRE[i][1])*math.cos(a)
        return ground(d%LAP,v)-.06
    return None,sample


def road(r,st,length,col,bc):
    b=bc.Builder('BrooklynDrive','terrain')
    b.colours=[]
    def strip(d,e,u,v,z,c):
        b.quad(pos(d,u,z),pos(e,u,z),pos(e,v,z),pos(d,v,z))
        b.colours.extend([lin(c)]*4)
    for d in range(0,LAP,4):
        e=d+4
        strip(d,e,-6,6,.032,0xADA698)
        strip(d,e,-5.6,5.6,.06,0x4F5559)
        for v in (-3.62,3.50):strip(d,e,v,v+.10,.073,0xD8D6C7)
        if d%12==0:strip(d,d+2,-.08,.05,.075,0xCFC3A0)
        if d%160==0:
            for j in range(3):strip(d+j*.41,d+j*.41+.22,-5.22,-3.94,.076,0xDEDCCB)
    b.build(col)


def scenery(k):
    from themes import CROWD
    art=Painted(k)
    trees=pictured(k,'BrooklynCanopy')
    front=pictured(k,'AudubonFacade')
    signs=pictured(k,'BrooklynSigns')
    water_mesh=pictured(k,'Lullwater')
    stone,bronze,green,iron,wood=[lin(c) for c in (0xD8CEB4,0x485A4E,0x345D45,0x343F3F,0x947052)]
    def panel(at,mesh,x,y,z,w,h,angle,uv=(0,0,1,1)):
        dx=math.cos(angle)*w/2
        dy=math.sin(angle)*w/2
        l,b,r,t=uv
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),
                ((l,b),(r,b),(r,t),(l,t)))
    def box(at,h,x,y,z,w,b,t,c):
        art.box(at(x,y,z),(w,b,t),h,c)
    def trunk(d,v,id,high):
        at,h=site(k,d,v)
        bottom=ground(d,v)-height(d)
        l=(id%3)/3
        b=(1-id//3)/2
        uv=(l+.001,b+.001,l+1/3-.001,b+.5-.001)
        for angle in (.84,2.40):panel(at,trees,0,0,bottom,high*1.10,high,angle,uv)
    for d in range(2,LAP,10):
        for side in (-1,1):
            v=side*k.rng.uniform(9,35)
            if side>0 and any(a<d<b for a,b in ((1130,1420),(2750,2990),(3970,4190),(4840,5870))):
                continue
            trunk(d,v,k.rng.choice((0,1,2,4,5)),k.rng.uniform(12,22))
    for d in range(4900,5825,43):
        trunk(d,154+(d%17),3,16+d%7)
    for d in range(4800,5890,19):trunk(d,168+d%55,d%6,18+d%9)
    for d in range(1100,1410,22):trunk(d,105+d%17,d%3,17+d%5)
    # Cast-iron single lanterns with flared feet, green slatted benches and park signs.
    for d in range(18,LAP,57):
        at,h=site(k,d,-6.8)
        for z,lo,hi,rise,c in ((0,.29,.16,.59,iron),(.59,.12,.085,3.5,iron),(4.09,.12,.32,.45,stone),(4.54,.34,.045,.25,iron)):
            art.tube(at(0,0,z),lo,hi,rise,c,c,8,c)
        if d%3==0:continue
        for x in (-.78,.78):
            for y in (-.21,.21):box(at,h,x,y+1,0,.095,.09,.45,iron)
        for y in (.82,1,1.18):box(at,h,0,y,.45,2.08,.15,.075,green)
        for z in (.69,.87):box(at,h,0,.76,z,2.08,.08,.13,green)
    for d in (112,1270,2880,4100,5160,5760):
        at,h=site(k,d,7)
        box(at,h,0,0,0,.13,.13,2.16,iron)
        box(at,h,0,0,1.39,.17,1.38,.85,green)
        panel(at,signs,-.096,0,1.395,1.38,.85,-math.pi/2,(.002,.502,.498,.998))
    # Grand Army Plaza's triumphal arch. Its opening goes through the entire stone vault.
    at,h=site(k,2901,14)
    arch_radius=6.15
    for y in (-8.7,8.7):
        box(at,h,0,y,0,8.9,6.0,.93,stone)
        box(at,h,0,y,.93,7.9,5.3,16.25,stone)
        for yy in (-1.72,1.72):
            for x in (-4.0,4.0):art.tube(at(x,y+yy,.94),.59,.48,12,stone,stone,12,stone)
        box(at,h,-4.18,y,5.6,.42,3.1,4.2,bronze)
        for row in range(19):
            z=1.5+row*.78
            box(at,h,-3.968,y,z,.045,5.26,.065,lin(0xB5AB96))
        for j in range(5):
            yy=y+(j-2)*.51
            art.tube(at(-4.56,yy,6.1+abs(j-2)*.18),.28,.17,1.41,bronze,bronze,9,bronze)
            art.tube(at(-4.57,yy,7.46+abs(j-2)*.18),.16,.14,.33,bronze,bronze,9,bronze)
            beam(art,at(-4.54,yy,7.17),at(-4.87,yy+.43,7.88),.13,.14,bronze)
    for j in range(27):
        a=math.pi*j/27
        b=math.pi*(j+1)/27
        def q(x,t):return at(x,arch_radius*math.cos(t),10.4+arch_radius*math.sin(t))
        for x in (-3.94,3.94):
            art.face((q(x,a),q(x,b),at(x,arch_radius*math.cos(b),17.2),at(x,arch_radius*math.cos(a),17.2)),(stone,)*4)
        art.face((q(-3.94,a),q(3.94,a),q(3.94,b),q(-3.94,b)),(lin(0xA99E89),)*4)
    for z,w,t in ((16.95,23.2,.80),(17.75,21.9,2.20),(19.95,23.3,.66)):
        box(at,h,0,0,z,9,w,t,stone)
    for y in (-3.1,-1.05,1.05,3.1):
        box(at,h,-.2,y,22.55,2.25,.64,.84,bronze)
        beam(art,at(-.88,y,23.07),at(-1.59,y,24.32),.51,.45,bronze)
        box(at,h,-1.71,y,24.0,.78,.39,.47,bronze)
        for x in (-.92,.70):
            for yy in (-.20,.20):beam(art,at(x,y+yy,22.65),at(x-.39,y+yy,20.64),.20,.17,bronze)
    box(at,h,1.55,0,20.61,2.5,3.4,2.9,bronze)
    for y in range(-10,11):
        box(at,h,-4.52,y,17.16,.23,.30,.41,lin(0xAEA38E))
    for j in range(28):
        angle=math.pi*j/27
        y=6.40*math.cos(angle)
        z=10.4+6.4*math.sin(angle)
        box(at,h,-3.99,y,z,.23,.51,.37,lin(0xC0B69F))
    # Park Slope brownstone stoops, recessed sash windows and projecting cornices.
    for j in range(40):
        d=2590+j*11
        at,h=site(k,d,-41-j%3)
        tall=11.5+j%4
        brick=lin((0x866252,0x9F7055,0x76594E,0xB08264)[j%4])
        box(at,h,0,0,-1,10.1,11.8,tall+1,brick)
        box(at,h,0,0,tall,10.65,12.2,.58,iron)
        for x in (-3.25,0,3.25):
            for z in (2.3,5.9,9.5):
                box(at,h,x,5.94,z,1.41,.16,2.0,lin(0x48555C))
                box(at,h,x,6.03,z-.12,1.62,.34,.14,stone)
        for s in range(5):box(at,h,2.8,6.2+s*.36,-.1,1.95,.4,1.42-s*.25,brick)
    # Smorgasburg tents have peaked canvas, narrow legs, counters and produce crates.
    for j in range(29):
        d=3930+(j%15)*13
        v=13+(j//15)*10+(j%3)
        at,h=site(k,d,v)
        cloth=lin((0xF0E9D9,0x9E493D,0x4F7498,0xEEE6D6,0xAC8755)[j%5])
        for x in (-2.8,2.8):
            for y in (-2.15,2.15):box(at,h,x,y,0,.075,.075,2.55,iron)
        corners=[at(x,y,2.52) for x,y in ((-3,-2.4),(3,-2.4),(3,2.4),(-3,2.4))]
        for a,b in zip(corners,corners[1:]+corners[:1]):art.face((a,b,at(0,0,4.07)),(cloth,)*3)
        box(at,h,0,-1.49,0,5.1,.99,.92,wood)
        index=1+j%3
        u=(index%2)/2
        v=(1-index//2)/2
        panel(at,signs,0,-2.42,1.90,3.6,.72,0,(u+.002,v+.002,u+.498,v+.498))
        for stripe in range(9):
            box(at,h,-2.48+stripe*.61,-2.37,2.30,.30,.12,.22,cloth if stripe%2 else stone)
        for jx in range(-2,3):box(at,h,jx,-1.51,.93,.67,.65,.31,lin((0xAF4638,0x7D945A,0xD6A548)[jx%3]))
        for n in range(5):k.person(at((n%3-1)*1.15, -3.7-(n%2)*1.1,0),h+.31*n,CROWD)
    for d in (3990,4120):
        at,h=site(k,d,26)
        box(at,h,0,0,.6,6.8,2.6,2.34,lin(0xA56348));box(at,h,2.8,0,.6,2,2.3,1.93,stone)
        box(at,h,0,-1.32,1.30,4.1,.08,1.23,iron)
    for d in range(1160,1410,17):
        at,h=site(k,d,15+d%35)
        box(at,h,0,0,ground(d,15+d%35)-height(d)+.08,2.8,2.2,.04,lin((0xC58177,0xB5C4B1,0xA8AFD0)[d%3]))
        k.person(at(.3,1.2,.06),h,CROWD)
    # The water elevation stays level through the Lullwater. Willow reflections break up the far shore.
    for d in range(4810,5910,5):
        def lake(t,v):return pos(t,v,WATER-height(t))
        def width(t):return smooth(4810,4940,t)*(1-smooth(5810,5910,t))
        pts=[]
        for t,side in ((d,-1),(d+5,-1),(d+5,1),(d,1)):
            pts.append(lake(t,83+side*(52+3*math.sin(t/43))*width(t)))
        picture(water_mesh,pts,((0,0),(1,0),(1,1),(0,1)))
        water_mesh.colours[-4:]=[lin(0x64857B),lin(0x678982),lin(0x375D55),lin(0x42675E)]
    at,h=site(k,5760,75)
    z=WATER-height(5760)
    box(at,h,0,0,z-.3,47,17,1.5,stone)
    box(at,h,0,0,z+1.2,42,12,9.8,stone)
    art.roof(at(0,0,z+11),43,13,2.1,h,lin(0x974F3F))
    panel(at,front,0,-6.12,z+1.18,42.4,11.86,0)
    # Reflection lies flat on the water between the facade and rider.
    picture(front,(at(-21.2,-6.3,z+.07),at(21.2,-6.3,z+.07),at(21.2,-18,z+.07),at(-21.2,-18,z+.07)),((0,0),(1,0),(1,1),(0,1)))
    for x in range(-21,22,2):box(at,h,x,-8,z+1.20,.24,.24,1.1,stone)
    box(at,h,0,-8,z+2.29,44,.38,.25,stone)
    at,h=site(k,5210,85)
    for x in (-2.4,2.4):
        for y in range(-26,26,2):
            zz=WATER-height(5210)+1.8+3.0*(1-(y/26)**2)
            box(at,h,x,y,zz,.38,2.4,.8,green)
            box(at,h,x,y,zz+.82,.10,.1,1.0,iron)
            box(at,h,x,y,zz+1.8,.14,2.42,.13,green)
            if x<0:box(at,h,0,y,zz+.69,4.8,2.3,.18,wood)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},
       'road_half_width':5.6,'land':{'mid':0x839957},'sky':[0xEBDDBF,0xE5E4D4,0xC7DFDF,0x9DC8D9,0x79B5D1],
       'haze':0xD8D9BC,'light':[0xFFEBBD,2.3],'fill':[0xBDD4DE,0x939477],
       'sun_radius':7,'sun_altitude':.72,'sun_azimuth':-.82}
