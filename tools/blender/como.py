"""The western shore of Lake Como and the opposite shore at Bellagio and Varenna."""
import math
from worldkit import Painted, lin

LENGTH = 12400
PROFILE = [(0,11),(450,12),(920,19),(1480,22),(2100,12),(2520,12),(3480,23),
           (4290,38),(4700,33),(5330,17),(6300,12),(6990,27),(7690,33),
           (8450,17),(9080,13),(9690,28),(10280,29),(10850,12),(11730,21),(12400,14)]


def height(d):
    for (a,lo),(b,hi) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return lo+(hi-lo)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def heading(d):
    return .42*math.sin(d/304-.7)+.25*math.sin(d/122)+.38*math.sin(d/710)


POINTS=[(-100.,0.)]
for metre in range(-100,LENGTH+600):
    angle=heading(metre+.5);x,y=POINTS[-1]
    POINTS.append((x+math.cos(angle),y+math.sin(angle)))


def pose(d,lane=0):
    i=min(len(POINTS)-2,max(0,math.floor(d)+100))
    f=min(1,max(0,d-(i-100)));a,b=POINTS[i:i+2];h=heading(d)
    return (a[0]+(b[0]-a[0])*f-math.sin(h)*lane,a[1]+(b[1]-a[1])*f+math.cos(h)*lane,h)


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    assert abs(stages[-1]['to']-LENGTH)<.01
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=pose(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),
                         g=100*(height(d+.5)-height(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return rows,stages,LENGTH,mean,0


def land(road,col,theme,bc):
    ground=bc.Builder("Terrain","terrain");ground.colours=[]
    def ribbon(rows,cols):
        previous=None
        for points in rows:
            row=[]
            for p,c in zip(points,cols):
                row.append(ground.v(p));ground.colours.append(lin(c))
            if previous:
                for j in range(len(row)-1):ground.faces.append((previous[j],row[j],row[j+1],previous[j+1]))
            previous=row
    def bank():
        for d in range(-80,LENGTH+260,12):
            z=height(d);expansion=23*math.exp(-((d-6760)/100)**2)
            row=[]
            for offset,up in [(-19-expansion,-3),(-15-expansion,.5),(-11-expansion,z-1),(-8,z-.36),
                              (-5,z-.27),(6,z-.27),(14,z+.2),(38,z+8),(80,z+27),(220,z+74),(720,z+143+38*math.sin(d/470))]:
                x,y,_=pose(d,offset);row.append((x,y,up))
            yield row
    ribbon(bank(),[0x687c73,0x8a8c79,0xb2ab8b,0xb7ab8c,0x9a987d,0x9e9f86,0x918960,0x788655,0x5c784e,0x486944,0x748775])
    def mountains():
        for x in range(-3400,16500,45):
            cape=250*math.sin(x/1200)+130*math.sin(x/390)
            y=-1070+cape
            row=[]
            for j,(span,up) in enumerate([(-2900,0),(-2100,670),(-1510,420),(-1000,615),(-700,360),(-330,230),(-90,76),(0,3),(26,-3)]):
                z=up+(.38*up)*(math.sin(x/(310+60*j)+j)+.32*math.cos(x/111+j))
                row.append((x,y+span,z))
            yield row
    ribbon(mountains(),[0x768fa0,0x8f9ea0,0x677e83,0x778785,0x546956,0x526c50,0x5c7857,0x8c9879,0x849486])
    obj=ground.build(col)
    lake=bc.Builder("Sea","sea")
    lake.quad((-8000,-18000,0),(24000,-18000,0),(24000,4000,0),(-8000,4000,0));lake.build(col)
    def ground_at(x,y):
        _,i,_=road.tree.find((x,y,0))
        p=road.s[i]
        l=(x-p["x"])*-math.sin(p["h"])+(y-p["y"])*math.cos(p["h"])
        return p["z"]-.3+max(0,l-14)*.33 if l>-12 else 0
    return obj,ground_at


THEME={"lay":route,"land_builder":land,"edge":"mountain","centre":"white",
       "terrain":{"sea":True},"land":{"mid":0x77936e},
       "sky":[0xe1e6d4,0xc7dce0,0xaccfde,0x92bfd7,0x78a9cd],"haze":0xc4d2ce,
       "light":[0xffe5bc,2.8],"fill":[0xd1e1e6,0x8e917f],"sun_azimuth":-.72,
       "sun_altitude":.50,"palette":{"asphalt":0x484746,"sea":0x206779,"sand":0xb4ac95}}


def scenery(k):
    art=Painted(k);rng=k.rng
    def block(d,l,up,a,b,h,c):
        x,y,yaw=pose(d,l);art.box((x,y,height(d)+up),(a,b,h),yaw,lin(c),.8)
    def tree(d,l,up,size,plane=False):
        x,y,_=pose(d,l);z=height(d)+up
        art.tube((x,y,z),.16*size,.10*size,2.5*size,lin(0x81745e),lin(0x8d8571),6)
        if plane:
            for n in range(4):
                angle=n*1.7+d*.08
                dx,dy=1.03*size*math.cos(angle),1.03*size*math.sin(angle)
                k.blob(k.B["foliage"],(x+dx,y+dy,z+(2.85+(n%2)*.55)*size),1.4*size)
        else:
            art.tube((x,y,z+.55*size),.55*size,.86*size,2.2*size,lin(0x385537),lin(0x45683e),7)
            art.tube((x,y,z+2.75*size),.86*size,.02,2.1*size,lin(0x42613b),lin(0x54764b),7)
    def house(d,l,up,w,depth,floors,colour):
        x,y,yaw=pose(d,l);z=height(d)+up;rise=floors*2.85
        art.box((x,y,z),(w,depth,rise),yaw,lin(colour),.79)
        art.roof((x,y,z+rise),w+.6,depth+.6,1.9,yaw,lin(0xb16949))
        for floor in range(floors):
            for n in range(max(2,round(w/3))):
                along=(n+.5)*w/max(2,round(w/3))-w/2
                side=l-depth/2-.06
                block(d+along,side,up+floor*2.85+.78,1.46,.12,1.48,0x48634e)
                block(d+along,side-.1,up+floor*2.85+.8,.66,.1,1.42,0x40505a)
    colours=[0xedc38a,0xdb8d78,0xe4bd9b,0xf4d9a4,0xcaa095]
    for d in range(-60,LENGTH+150,8):
        # Coping alternates with a transparent painted iron railing along the promenades.
        if (d//180)%3:
            block(d,-7.3,-.19,8.06,.54,.79,0xb4ac97)
            block(d,-7.3,.60,8.03,.68,.10,0xd2c6aa)
        else:
            block(d,-7.3,-.12,.41,.46,1.22,0xb7ab95)
            for up in (.44,.98):block(d,-7.3,up,8.05,.075,.08,0x536665)
            for along in (-3,-1,1,3):block(d+along,-7.3,.18,.055,.055,.82,0x536665)
    for centre in (240,1430,2210,5530,8720,10650):
        for n in range(-8,9):
            d=centre+n*12
            house(d,14+(n%3)*.9,-.2,10+(n%4),7.5,2+n%3,colours[n%5])
            # Plane crowns and pedestrians along the quay are drawn from the promenade atlas.
            if n%4==0:
                for q in range(2):
                    x,y,_=pose(d+q*3,-10.6);z=height(d)
                    art.tube((x,y,z-.35),.09,.09,2.3,lin(0x695d50),lin(0x695d50),5)
                    art.tube((x,y,z+1.92),1.35,.12,.52,lin(0xb9664d),lin(0xe0ac69),8)
        d=centre+74
        block(d,15,0,4.4,4.7,20,0xb39c85)
        for up in (5,11,16.8):block(d,15,up,4.65,4.95,.36,0xe5d4b4)
        for offset in (-1.1,1.1):block(d+offset,12.58,17.4,.88,.13,1.68,0x3c4543)
        x,y,_=pose(d,15);art.tube((x,y,height(d)+20),3.4,.1,5.2,lin(0x665e50),lin(0x958474),4)
    for centre,promontory in ((1390,False),(6760,True)):
        for tier in range(3):
            lane=(-17 if promontory else 20)+(tier*(-3) if promontory else tier*7)
            block(centre,lane,tier*2.3-1.0,63-tier*9,8,2.7,0xb4ae8e)
            block(centre,lane,tier*2.3+1.68,63-tier*9,7.8,.2,0x718549)
            for q in (-2,-1,0,1,2):tree(centre+q*9,lane,tier*2.3+1.8,1.3)
        l=-22 if promontory else 40
        house(centre,l,6,34,12,3,0xe9d3a4)
        for n in range(7):
            block(centre-12+n*4,l-7,6.5,.49,.49,4.0,0xefe1c2)
        block(centre,l-7,10.5,29,2.1,.6,0xddc69b)
        if promontory:
            for side in (-1,1):house(centre+side*13,l,14,5,5,2,0xebd6ae)
    # Across the lake Bellagio's point divides the two arms. Its houses climb away
    # from the landing, distinct from Varenna's narrow frontage below the church.
    for station,reach in ((2130,260),(6120,130),(10580,230)):
        x,y,_=pose(station)
        opposite=-1070+250*math.sin(x/1200)+130*math.sin(x/390)
        for tier in range(4):
            radius=reach*(1-tier*.21)
            art.tube((x,opposite+reach*.55,2+tier*9),radius,max(7,radius-21),9,
                     lin(0x79836a),lin(0x56724f),16)
        for j in range(32):
            dx=(j%12-5.5)*12
            row=j//12
            sy=opposite+reach*1.33-row*16-abs(dx)*.27
            sz=2+row*7
            col=lin(colours[(j+row)%len(colours)])
            art.box((x+dx,sy,sz),(10,8,8+(j%3)*2),-.12,col,.74)
            art.roof((x+dx,sy,sz+8+(j%3)*2),10.8,8.8,2.1,-.12,lin(0xad6851))
        bx,by=x+32,opposite+reach*1.25
        art.box((bx,by,3),(5,5,23),0,lin(0xdbc9a7),.74)
        art.tube((bx,by,26),3.7,.14,6,lin(0x565d58),lin(0x6e776e),4)
    # Quays, gangways and mooring piles give the cross-lake boats actual landing sites.
    for station in (240,2210,6120,10610):
        x,y,h=pose(station,-19)
        art.box((x,y,1),(28,4.8,.66),h,lin(0x93826a),.8)
        for q in (-11,-4,4,11):
            px,py,_=pose(station+q,-21)
            art.tube((px,py,-1),.16,.17,3.8,lin(0x655846),lin(0x907f67),8)
        for q in range(30):
            a=(q+.5)/30
            px,py,_=pose(station-22+a*23,-11-a*8)
            art.box((px,py,(1-a)*(height(station)-.35)+a*1.66),(.86,2.1,.22),h,lin(0xc2ac91),.8)
    # Rock gallery follows the road's grade and curve; lake-facing portals alternate with piers.
    for d in range(4512,4608,4):
        block(d,6.9,-.35,4.10,2.3,8.4,0x777969)
        block(d,0,7.7,4.13,16.1,1.45,0x999781)
        if d%16==0:block(d,-6.65,-.45,1.45,1.45,8.3,0x969582)
    for d in range(30,LENGTH+100,13):
        if any(abs(d-c)<100 for c in (240,1430,2210,4512,5530,6760,8720,10650)):continue
        tree(d,11+rng.uniform(5,38),rng.uniform(.5,6),rng.uniform(.85,1.9),d%3==0)
    return {"efforts":k.gates("accent","accent-2",[f"crowd-{i}" for i in range(6)])}
