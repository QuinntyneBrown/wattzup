"""The farm lanes at Melden and the wet, sunken cobbled climb above the village."""
import bisect
import math
import sys

from bondi import words
from iten_landmarks import picture, pictured
from worldkit import lin, Painted, smooth


def bearing(d):
    return (.19*math.sin(d/224)+.07*math.sin(d/77)
            -.72*(smooth(620,930,d)-smooth(1190,1510,d))
            +.84*(smooth(4740,5090,d)-smooth(5260,5540,d)))


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0
    z=37
    rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=next((s for s in stages if d<s['to']),stages[-1])
        grade=(stage['level']-mean)*.006
        # The main 22% kick sits within the first three-minute low-cadence effort.
        if 1650<=d<2580:
            grade += (.22-grade)*smooth(2170,2310,d)*(1-smooth(2430,2540,d))
        if d<0 or d>=length:grade=0
        rows.append(dict(d=d,x=x,y=y,z=z,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*grade))
        z+=grade*bc.STEP
        x+=math.cos(bearing(d+bc.STEP/2))*bc.STEP
        y+=math.sin(bearing(d+bc.STEP/2))*bc.STEP
    return rows,stages,length,mean,.6


def chute(d):
    return smooth(930,1100,d)*(1-smooth(4970,5170,d))


def width(d):
    return 2.64-1.02*chute(d)


def surface(road,st,length,col,theme):
    bc=sys.modules[type(road).__module__]
    stones=bc.Builder('KoppenbergSetts','terrain')
    lanes=bc.Builder('ConcreteLanes','terrain')
    for mesh in (stones,lanes):mesh.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d']
        cobbled=972<d<5040
        mesh=stones if cobbled else lanes
        def edge(j,f):
            s=road.s[j]
            return road.at(j,f*width(s['d']),.047*(1-abs(f))-.08*abs(f)**4)
        for a,b in ((-1,-.8),(-.8,-.26),(-.26,.26),(.26,.8),(.8,1)):
            color=lin(0x82845D if cobbled and abs(a+b)>1.55 else 0x969594 if cobbled else 0x9A9A92)
            if not cobbled and i%3==0:color=lin(0x929189)
            mesh.quad(edge(i,a),edge(i+1,a),edge(i+1,b),edge(i,b))
            mesh.colours.extend((color,)*4)
    for mesh in (stones,lanes):mesh.build(col)


def land(road,col,theme,bc):
    mesh=bc.Builder('MeldenFields','terrain');mesh.colours=[]
    centres=[p['x'] for p in road.s]
    def height(p,off):
        d=p['d'];distance=abs(off);ch=chute(d)
        bank=smooth(1.57,5,distance)*(2+.74*math.sin(d/35))*ch
        valleys=(9*math.cos(d/146+off/189)+7*math.sin(d/228-off/89)-9
                 -64*smooth(4600,5200,d)*smooth(32,270,off))
        return p['z']-.17+bank+smooth(11,132,distance)*valleys
    def height_at(x,y):
        i=min(len(centres)-1,bisect.bisect_left(centres,x))
        for _ in range(2):
            p=road.s[i]
            delta=(x-p['x'])*math.cos(p['h'])+(y-p['y'])*math.sin(p['h'])
            i=road.index(p['d']+delta)
        p=road.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return height(p,off)
    last=None
    for i in range(0,len(road.s),2):
        p=road.s[i];row=[]
        for off in (-870,-560,-320,-190,-115,-71,-39,-17,-7,-4.2,-2.6,-1.5,0,1.5,2.6,4.2,7,17,39,71,115,190,320,560,870):
            x,y,_=road.at(i,off)
            tilled=abs(off)>35 and int((p['d']+off*.09)//126+abs(off)//88)%4==0
            tone=0x756552 if tilled else 0x688052 if math.cos(p['d']/85+off/64)>.05 else 0x78865A
            if abs(off)<5:tone=0x69704C
            row.append(((x,y,height(p,off)),lin(tone)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                mesh.quad(a[0],e[0],c[0],b[0]);mesh.colours.extend((a[1],e[1],c[1],b[1]))
        last=row
    return mesh.build(col),height_at


def buildings(k,art):
    for station in (94,221,337,645,792,1340,2790,4070,5100,5490):
        side=k.rng.choice((-1,1))
        x,y,_=k.road.pos(station,side*k.rng.uniform(12,25));z=k.height_at(x,y)
        yaw=bearing(station)+.12
        art.box((x,y,z-.35),(14,6.4,4.7),yaw,lin(0x95654F))
        art.roof((x,y,z+4.35),14.5,6.8,3.25,yaw,lin(0x665A53))
        along=(math.cos(yaw),math.sin(yaw));out=(side*math.sin(yaw),-side*math.cos(yaw))
        corner=(x+out[0]*3.22,y+out[1]*3.22,z)
        for u in (-5.1,-2.6,1.5,4.4):
            art.panel(corner,along,out,u-.54,u+.54,.8,2.45,.04,lin(0xD6C5A3))
            art.panel(corner,along,out,u-.40,u+.40,.92,2.32,.06,lin(0x545F63))
    # The single Sint-Martinus tower stands on the Scheldt side of the crest.
    x,y,_=k.road.pos(5475,88)
    z=k.height_at(x,y)
    art.box((x,y,z-.5),(19,9,9.1),0,lin(0x857568))
    art.roof((x,y,z+8.6),19.5,9.3,5,0,lin(0x5E615F))
    artifact=(x-7,y,z)
    art.box(artifact,(6.4,6.4,17.5),0,lin(0x877F73))
    for side in (-1,1):
        for v in (-1.1,1.1):
            art.box((x-7+3.21*side,y+v,z+12.4),(.08,1.15,2.9),0,lin(0x404A47))
    for j in range(4):
        a=(j+.5)*math.pi/2;b=a+math.pi/2
        art.face(((x-7+4.9*math.cos(a),y+4.9*math.sin(a),z+17.5),
                  (x-7+4.9*math.cos(b),y+4.9*math.sin(b),z+17.5),
                  (x-7,y,z+29.8)),(lin(0x51575D),)*3)


def scenery(k):
    art=Painted(k)
    buildings(k,art)
    trees=pictured(k,'KoppenbergTrees')
    for d in range(15,5720,13):
        wood=4450<d<5075
        if not wood and d%4==0:continue
        for side in (-1,1):
            off=side*(k.rng.uniform(4.4,14) if wood else k.rng.uniform(7,12) if d<910 or d>5090 else k.rng.uniform(18,35))
            x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.30
            variant=k.rng.randrange(2)+(2 if wood else 0)
            u=variant%2*.5;v=(variant//2)*.5
            angle=bearing(d)+k.rng.uniform(-.35,.35)
            h=k.rng.uniform(9,15) if wood else k.rng.uniform(14,20)
            w=h*(.58 if wood else .27)
            dx,dy=w*math.sin(angle),w*math.cos(angle)
            picture(trees,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),
                    ((u,1-v-.5),(u+.5,1-v-.5),(u+.5,1-v),(u,1-v)))
    for d in range(3550,3900,19):
        x,y,z=k.road.pos(d,7);z=k.height_at(x,y)
        for u in (-1,1):
            for v in (-1,1):
                art.tube((x+u*2.8,y+v*2.1,z),.05,.04,2.35,lin(0x949991),lin(0xA9AFA4),6)
        art.roof((x,y,z+2.35),6.5,4.8,1.6,bearing(d),lin(0xC7BCA7))
    for d,label in ((975,'KOPPENBERG'),(2280,'22%'),(3675,'1 KM'),(4945,'SOMMET')):
        x,y,z=k.road.pos(d,-3.5);z=k.height_at(x,y);yaw=bearing(d)
        art.box((x,y,z),(.09,.09,1.9),yaw,lin(0x686D68))
        art.box((x,y,z+1.42),(.12,2.1,.71),yaw,lin(0xDCBA44))
        words(art,label,(x-.075*math.cos(yaw),y-.075*math.sin(yaw),z+1.61),
              (math.sin(yaw),-math.cos(yaw),0),(0,0,1),.32,1.9,0x313532)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0x798860},
       'road_half_width':2.2,'sky':[0xDFDFD6,0xD7DCD7,0xBDCDCD,0xA0B6BC,0x829EA8],
       'haze':0xB8C2B9,'light':[0xE8E4D6,1.35],'fill':[0xCFD9DA,0x998876],
       'sun_altitude':.41,'sun_azimuth':1.83,'sun_radius':39}
