"""Queen Kaʻahumanu Highway, its coastal lava bench and the Aliʻi Drive finish."""
import bisect
import math
import sys
from worldkit import Painted, lin, smooth


def bearing(d):
    return (.085 * math.sin(d / 660) + .055 * math.cos(d / 210)
            + .62 * (smooth(6100, 7040, d) - smooth(7520, 8490, d)))


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    mean = sum((s['to'] - s['from']) * s['level'] for s in stages) / length
    z = 125
    joins = []
    for stage in stages:
        grade = (stage['level'] - mean) * .006
        joins.append((stage['from'], stage['to'], z, grade))
        z += grade * (stage['to'] - stage['from'])
    rows = []
    x = y = 0
    for i in range(math.ceil((bc.LEAD_IN + length + bc.RUN_OUT) / bc.STEP) + 1):
        d = i * bc.STEP - bc.LEAD_IN
        a, b, base, grade = next((j for j in joins if d < j[1]), joins[-1])
        rows.append(dict(x=x, y=y, z=base + grade * (max(a, min(b,d)) - a), h=bearing(d),
                         k=bearing(d+.5)-bearing(d-.5), d=d, g=grade*100))
        x += bc.STEP * math.cos(bearing(d + bc.STEP / 2))
        y += bc.STEP * math.sin(bearing(d + bc.STEP / 2))
    return rows, stages, length, mean, .6


def surface(road, stages, length, col, theme):
    bc = sys.modules[type(road).__module__]
    for name, mat, spans in (
        ('Road', 'asphalt', [(-6.1, 6.1, 0, 0x545457)]),
        ('RoadPaint', 'paint', [(-.16,-.045,.023,0xF2B928),(.045,.16,.023,0xF2B928),
                                 (-3.68,-3.55,.02,0xE8E4D4),(3.55,3.68,.02,0xE8E4D4)])):
        mesh = bc.Builder(name, mat)
        mesh.colours = []
        for i in range(len(road.s)-1):
            for a,b,h,c in spans:
                mesh.quad(road.at(i,a,h), road.at(i+1,a,h), road.at(i+1,b,h), road.at(i,b,h))
                mesh.colours.extend([lin(c)] * 4)
        mesh.build(col)


def coast_distance(d):
    return 190 - 156 * smooth(5600, 7090, d)


def land(road, col, theme, bc):
    mesh = bc.Builder('KonaLava','terrain')
    mesh.colours = []
    sea_level = min(p['z'] for p in road.s) - 5
    def height(d, off, base):
        shoulder = smooth(6,21,abs(off))
        folds = 1.8*math.sin(d/53+off/18) + .9*math.cos(d/8-off/14)
        coast = coast_distance(d)
        shore = smooth(coast * .57, coast, off)
        return (base - .26 + shoulder*folds) * (1-shore) + (sea_level-1.2)*shore
    centres = [p['x'] for p in road.s]
    def height_at(x,y):
        i = min(len(centres)-1, bisect.bisect_left(centres,x))
        for _ in range(2):
            p=road.s[i]
            along=(x-p['x'])*math.cos(p['h'])+(y-p['y'])*math.sin(p['h'])
            i=road.index(p['d']+along)
        p = road.s[i]
        offset = (y-p['y'])*math.cos(p['h']) - (x-p['x'])*math.sin(p['h'])
        return height(p['d'],offset,p['z'])
    last = None
    for i in range(0,len(road.s),2):
        p=road.s[i]
        coast=coast_distance(p['d'])
        row=[]
        for off in (-1250,-610,-250,-108,-54,-28,-14,-7,-5,5,7,12,coast*.73,coast,coast+9):
            x,y,_ = road.at(i,off)
            dark = math.sin(x/19+y/12)+math.cos(y/43-x/36)
            tone = 0x554742 if dark>.5 else 0x453D40 if dark>-.43 else 0x39363A
            row.append(((x,y,height(p['d'],off,p['z'])),lin(tone)))
        if last:
            for a,b,c,d in zip(last,last[1:],row[1:],row):
                mesh.quad(a[0],d[0],c[0],b[0])
                mesh.colours.extend((a[1],d[1],c[1],b[1]))
        last=row
    return mesh.build(col),height_at


def roadside(k, art):
    from bondi import words
    dark = lin(0x39373A)
    rust = lin(0x6F493D)
    coral = lin(0xEEE5CB)
    straw = lin(0xB5A577)
    # Plates of smooth lava and jagged clinker alternate along both verges.
    for d in range(0, 9160, 6):
        basalt = math.sin(d/105) > -.15
        side = k.rng.choice((-1,1))
        off = side*k.rng.uniform(7.2,18)
        x,y,z = k.road.pos(d,off)
        z = k.height_at(x,y)-.06
        r = k.rng.uniform(.35,1.7)
        crown = (x+.2*r,y,z+(r*.72 if basalt else .17))
        tone = rust if basalt and k.rng.random()<.32 else dark
        rim = []
        for j in range(6):
            a=j*math.tau/6
            radius=r*k.rng.uniform(.75,1.15)
            rim.append((x+radius*math.cos(a),y+radius*.7*math.sin(a),z-.09))
        for j in range(6):
            art.face((rim[j],rim[(j+1)%6],crown),(dark,tone,tone))
        if not basalt:
            for n in range(3):
                u=x+r*(n-1)*.22
                art.face(((u-.07,y-r*.44,z+.11),(u+.05,y-r*.44,z+.10),
                          (u+.18,y+r*.45,z+.12),(u+.06,y+r*.45,z+.13)),(lin(0x68605C),)*4)
        if d%18 == 0:
            for blade in range(7):
                a=k.rng.uniform(0,math.tau)
                bx,by=x+.6*math.cos(a),y+.42*math.sin(a)
                tip=(bx+.3+ .3*math.cos(a),by+.38*math.sin(a),z+k.rng.uniform(.6,1.35))
                art.face(((bx-.045,by,z),(bx+.045,by,z),tip),(lin(0x726A45),straw,straw))
    # Each dot in these roadside messages is a separate piece of white coral.
    alphabet={'K':('101','110','100','110','101'),'O':('111','101','101','101','111'),
              'N':('1001','1101','1011','1001','1001'),'A':('010','101','111','101','101'),
              'G':('111','100','101','101','111'),'I':('111','010','010','010','111')}
    for start, message in ((1528,'GO'),(1544,'KONA'),(1570,'KAI')):
        for j,char in enumerate(message):
            for row,bits in enumerate(alphabet[char]):
                for col,bit in enumerate(bits):
                    if bit=='1':
                        p=k.road.pos(start+j*2.8+col*.53,-7.2-row*.56)
                        z=k.height_at(p[0],p[1])
                        radius=k.rng.uniform(.20,.28)
                        art.tube((p[0],p[1],z-.12),radius,radius*.65,.22,lin(0xACA58C),coral,5,coral)
    from iten_landmarks import pictured, picture
    crowd = pictured(k,'KonaFans')
    def person(station,off,variant,volunteer):
        yaw=bearing(station)+(.44 if off>0 else -.44)
        x,y,z=k.road.pos(station,off)
        size=k.rng.uniform(1.67,1.89)
        dx,dy=-math.sin(yaw)*size*.50,math.cos(yaw)*size*.50
        base=k.height_at(x,y)-.08
        corners=[(x-dx,y-dy,base),(x+dx,y+dy,base),(x+dx,y+dy,base+size),(x-dx,y-dy,base+size)]
        u=variant*.25
        v=.5 if volunteer else 0
        picture(crowd,corners,[(u,v),(u+.25,v),(u+.25,v+.5),(u,v+.5)])
    for station in range(4868,5025,8):
        p=k.road.pos(station,6.4)
        person(station,6.6,k.rng.randrange(4),True)
        for off in (4.85,5.5):
            p=k.road.pos(station,off)
            art.tube(p,.17,.035,.52,lin(0xD9532B),lin(0xF78245),8)
            art.tube((p[0],p[1],p[2]+.23),.118,.09,.1,coral,coral,8)
    for station in (9548,k.length-4):
        yaw=bearing(station)
        for off in (-6.4,6.4):
            p=k.road.pos(station,off)
            art.box(p,(1,1,5.9),yaw,lin(0x343B43))
        x,y,z=k.road.pos(station,0)
        art.box((x,y,z+4.8),(1.02,13.8,1.14),yaw,lin(0xB43B34))
        right=(math.sin(yaw),-math.cos(yaw),0)
        words(art,'ALIʻI DRIVE' if station==9548 else 'KONA   •   FINISH',(x-.54*math.cos(yaw),y-.54*math.sin(yaw),z+5.04),
              right,(0,0,1),.77,11.9,0xFBF1CF)
    for d in range(9410,int(k.length)+14,3):
        for side in (-1,1):
            off = side*k.rng.uniform(6.8,10.2)
            p=k.road.pos(d,off)
            person(d,off,k.rng.randrange(4),False)
            if k.rng.random()<.7:person(d+1.4,off+side*1.1,k.rng.randrange(4),False)


def scenery(k):
    art=Painted(k)
    peaks=Painted(k,'peaks')
    sea_level=min(p['z'] for p in k.road.s)-5
    # The water extends to the horizon. Its surf line follows the same lava bench as the terrain.
    ocean=Painted(k,'sea')
    # Smooth tumbling breakers wash the dark rocks below the highway.
    for d in range(6980,9920,9):
        off=coast_distance(d)+k.rng.uniform(-3,6)
        x,y,_=k.road.pos(d,off)
        width=k.rng.uniform(2,6)
        ocean.face(((x-width,y,sea_level+.10),(x,y-1.6,sea_level+.55),
                    (x+width,y+.3,sea_level+.14),(x,y+.7,sea_level+.18)),
                   (lin(0x74C1C1),lin(0xE3EEE4),lin(0x8BCACB),lin(0xCADFD9)))
    last=None
    for d in range(-100,int(k.length)+220,28):
        coast=coast_distance(d)
        row=[]
        for edge,tone in ((coast-5,0x4EACAF),(coast+3,0xD8EEE4),(coast+6,0x5AB0B5),
                          (coast+29,0x288FAD),(coast+140,0x187AA3),(coast+3500,0x225D8B)):
            x,y,_=k.road.pos(d,edge)
            row.append(((x,y,sea_level),lin(tone)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                ocean.face((a[0],e[0],c[0],b[0]),(a[1],e[1],c[1],b[1]))
        last=row
    # Two independent profiles stay anchored to the island as riders travel the coast.
    for cx,cy,rx,ry,h,tone in ((9200,-2900,4400,2450,840,0x76797C),
                                (13500,-4200,6100,2900,1540,0x898693)):
        previous=None
        for scale,up in ((1.18,-.75),(1,0),(.75,.2),(.48,.49),(.23,.78),(.07,.96),(0,1)):
            ring=[]
            for j in range(40):
                angle=j*math.tau/40
                cut=1+.045*math.sin(5*angle)+.028*math.cos(9*angle)
                ring.append((cx+rx*scale*cut*math.cos(angle),cy+ry*scale*cut*math.sin(angle),
                             sea_level+h*(up+.025*scale*math.sin(7*angle))))
            if previous:
                for j in range(40):
                    n=(j+1)%40
                    peaks.face((previous[j],previous[n],ring[n],ring[j]),(lin(tone),)*4)
            previous=ring
    for d in range(9200, int(k.length), 29):
        for side in (-1,1):
            x,y,z=k.road.pos(d,side*k.rng.uniform(7.5,12))
            k.palm(x,y,k.height_at(x,y)-.42)
    for d in range(4860,5030,20):
        for off in (7.8,11.3):
            for shift in (0,4.4):
                p=k.road.pos(d+shift,off)
                art.tube(p,.05,.05,2.35,lin(0x7B8586),lin(0xCCD3C9),6)
        x,y,z=k.road.pos(d+2.2,9.55)
        yaw=bearing(d)
        art.box((x,y,z+2.27),(5.3,4.3,.28),yaw,lin(0xCE593D))
        art.roof((x,y,z+2.54),5.3,4.3,1.05,yaw,lin(0xF47745))
        p=k.road.pos(d+2,7)
        art.box(p,(3.8,.8,.8),yaw,lin(0xDFDFD5))
        for n in range(7):
            x,y,z=k.road.pos(d+.45+n*.43,7)
            art.tube((x,y,z+.8),.048,.048,.21,lin(0xD4D7D0),lin(0xF6C654),8,lin(0xF6C654))
    roadside(k, art)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':land,'terrain':{'sea':False},
       'land':{'mid':0x4D4241},'road_half_width':6.1,
       'sky':[0xE0E4D9,0xC3D9DA,0x80BFDF,0x428AC0,0x2966A3],
       'haze':0xB6CAD0,'light':[0xFFEDD1,1.7],'fill':[0xBFD9E2,0xB99E85],
       'sun_altitude':.74,'sun_azimuth':1.0,'sun_radius':48}
