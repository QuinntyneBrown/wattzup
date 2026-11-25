"""Girona on the Onyar, the wooded Gavarres climb and the sanctuary terrace."""
import math
from worldkit import Painted, lin, smooth


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    mean = sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    def bearing(d):
        # Broad river bend gives way to shorter turns climbing the Gavarres.
        return .24*math.sin(d/210) + smooth(220,850,d)*(.65*math.sin(d/165)+.24*math.sin(d/74))
    samples = []
    x,y,z = -bc.LEAD_IN,0,0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        stage = bc.stage_at(stages, min(length-.01,max(0,d)))
        grade = (.2 + smooth(310,760,d)*(2.8+.35*(stage["level"]-mean)))*(1-smooth(length-140,length,d))
        h = bearing(d)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(bearing(d+1)-bearing(d-1))/2,g=grade))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
        z += bc.STEP*grade/100
    return samples,stages,length,mean,.35


def bank(d,side):
    river = (1-smooth(270,375,d))*smooth(7,9,side)*(1-smooth(33,35,side))
    slope = smooth(250,700,d)
    return -.22 - river*2.1 + slope*(max(0,-side-6)*.19 - max(0,side-6)*.22)


def land(road,col,theme,bc):
    b = bc.Builder("Gavarres slopes","terrain")
    b.colours = []
    offsets = (-270,-80,-24,-7,-4,4,7,9,33,35,65,150,320)
    for i in range(0,len(road.s)-1,2):
        j = min(i+2,len(road.s)-1)
        for left,right in zip(offsets,offsets[1:]):
            points = [(n,u) for n,u in ((i,left),(j,left),(j,right),(i,right))]
            ids = [b.v(road.at(n,u,bank(road.s[n]["d"],u))) for n,u in points]
            b.faces.append(tuple(ids))
            d = road.s[i]["d"]
            tint = 0x587C79 if left == 9 and d<305 else (0x9D947D if d<300 else 0x78815A)
            base = lin(tint)
            for n,u in points:
                f = .91+.09*math.sin(road.s[n]["d"]/70+u*.27)
                b.colours.append((*[v*f for v in base[:3]],1))
    return b.build(col),lambda x,y:0


THEME = {
    "lay":centre_line, "land_builder":land, "terrain":{"sea":False}, "land":{"mid":0x838965},
    "edge":"verge","centre":"white","kerbs":False,"sun_altitude":.59,"sun_azimuth":-.88,
    "sky":[0xEEDBC0,0xC6D9E1,0x95BDDB,0x75A6CF,0x5A93BE],
    "light":[0xFFE4B6,3.0],"fill":[0xDCE7EE,0x91825E],"haze":0xD9D9C5,
    "palette":{"asphalt":0x575756,"sand":0xA98D66},
}


def scenery(k):
    art = Painted(k)
    stone,tile,window = map(lin,(0xC7B49B,0x996347,0x405053))
    def site(d,side):
        i=k.road.index(d)
        return k.road.at(i,side,bank(k.s[i]["d"],side)),k.s[i]["h"]
    def house(d,side,width,height,colour):
        (x,y,z),yaw = site(d,side)
        art.box((x,y,z),(width,6,height),yaw,colour)
        art.roof((x,y,z+height),width,6,1.6,yaw,tile)
        face = -1 if side>0 else 1
        for floor in range(2,int(height)-1,3):
            for pane in (-.32,0,.32):
                a=pane*width
                u=x+a*math.cos(yaw)-face*3.03*math.sin(yaw)
                v=y+a*math.sin(yaw)+face*3.03*math.cos(yaw)
                art.box((u,v,z+floor),(1.05,.09,1.45),yaw,window)
    ochres = list(map(lin,(0xC99753,0xB76D53,0xDBB878,0xC28364,0xE5D3A4)))
    for d in range(-48,285,8):
        house(d,39,7.9,k.rng.uniform(8,15),k.rng.choice(ochres))
        if d<125: house(d,-13,7.9,k.rng.uniform(8,14),k.rng.choice(ochres))
    (x,y,z),yaw=site(108,59)
    art.box((x,y,z),(33,17,21),yaw,stone)
    art.roof((x,y,z+21),33,17,6,yaw,tile)
    for level,radius,height in ((0,4.8,23),(23,3.9,9),(32,3.1,5),(37,1.4,3)):
        art.tube((x+12,y-4,z+level),radius,radius*.93,height,stone,stone,8,stone)
    for d in range(330,2550,355):
        house(d, -22 if d%2 else 28,14,6.4,stone)
    for d in range(330,int(k.length)-100,16):
        for side in (-1,1):
            if side==1 and d%920<280: continue
            offset=side*k.rng.uniform(8,24)
            (x,y,z),yaw=site(d,offset)
            h=k.rng.uniform(4,7)
            pine = k.rng.random()<.34
            bark,foliage = map(lin,(0x8B5D43 if not pine else 0x766655,k.rng.choice((0x596D48,0x495F3D,0x748251))))
            art.tube((x,y,z),.34,.19,h,bark,bark,6)
            for j in range(3):
                a=j*math.tau/3+yaw
                p=(x+1.25*math.cos(a),y+1.25*math.sin(a),z+h-.4+j*.32)
                art.tube(p,1.75,2.15,1.0,foliage,foliage,7)
                art.tube((p[0],p[1],p[2]+1),2.15,.40,1 if pine else 2.1,foliage,foliage,7,foliage)
    for d in range(400,int(k.length)-90,9):
        if d%200<88:
            c,yaw=site(d,-6.4)
            art.box(c,(9.1,.66,1.05),yaw,stone)
    for d in range(1000,int(k.length),1000):
        c,yaw=site(d,6.2)
        art.box(c,(.57,.38,1.13),yaw,lin(0xE6DFCC))
        art.box((c[0],c[1],c[2]+.84),(.59,.40,.25),yaw,lin(0xA7643A))
    (x,y,z),yaw=site(k.length+26,4)
    pale,portal=map(lin,(0xE4DDCA,0x685440))
    art.box((x,y,z),(16,10,8.3),yaw,pale)
    art.roof((x,y,z+8.3),16,10,2.2,yaw,tile)
    for width,height,proud,tint in ((3.1,4.3,-8.05,stone),(2.35,3.65,-8.14,portal),(1.1,1.2,-8.07,window)):
        up = 6 if tint==window else 0
        art.box((x+proud*math.cos(yaw),y+proud*math.sin(yaw),z+up),(.16,width,height),yaw,tint)
    house(k.length+24,-10,20,7.4,pale)
    return {"efforts":0}
