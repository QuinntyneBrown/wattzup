"""Bay Street, Parliament Square and the turn north to Prince George Wharf."""
import math
from worldkit import Painted, lin, smooth


def bearing(d):
    return (.08 * math.sin(d / 290) + .53 * smooth(6960, 7210, d)
            - .58 * smooth(7290, 7560, d) + .87 * smooth(11640, 11950, d))


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    mean = sum(s['level'] * (s['to'] - s['from']) for s in stages) / length
    elevation = 4
    sections = []
    for stage in stages:
        grade = (stage['level'] - mean) * .0019
        sections.append((stage['from'], stage['to'], grade, elevation))
        elevation += grade * (stage['to'] - stage['from'])
    x = y = 0
    points = []
    for i in range(math.ceil((length + bc.LEAD_IN + bc.RUN_OUT) / bc.STEP) + 1):
        d = i * bc.STEP - bc.LEAD_IN
        a, b, grade, base = next((s for s in sections if d < s[1]), sections[-1])
        points.append(dict(x=x,y=y,z=base+grade*(max(a,min(b,d))-a),h=bearing(d),
                           k=bearing(d+.5)-bearing(d-.5),d=d,g=grade*100))
        x += bc.STEP * math.cos(bearing(d + bc.STEP / 2))
        y += bc.STEP * math.sin(bearing(d + bc.STEP / 2))
    return points, stages, length, mean, .19


def road(r, stages, length, col, bc):
    for name, material, strips in (
        ('Road','asphalt',[(-4.7,4.7,0,0x49424D)]),
        ('Bay Street sidewalks','terrain',[(-14,-4.95,.15,0x988A86),(-4.95,-4.7,.075,0xB9A99C),
                                            (4.7,4.95,.075,0xB9A99C),(4.95,14,.15,0x988A86)])):
        mesh = bc.Builder(name, material)
        mesh.colours = []
        for i in range(len(r.s)-1):
            for a,b,h,colour in strips:
                mesh.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,b,h),r.at(i,b,h))
                mesh.colours.extend([lin(colour)]*4)
        mesh.build(col)


def scenery(k):
    art = Painted(k)
    def box(d, offset, z, w, depth, height, colour):
        art.box(k.road.pos(d, offset, z), (w, depth, height), bearing(d), lin(colour))
    def roof(d, offset, z, w, depth, height, colour):
        art.roof(k.road.pos(d,offset,z),w,depth,height,bearing(d),lin(colour))
    ivory, teal, pink = 0xE8DCCA, 0x538D88, 0xDA929A
    rng = k.rng
    for side in (-1,1):
        d = -65
        while d < k.length + 80:
            width = rng.uniform(10,17)
            mid = d + width/2
            d += width
            if side==1 and (7140<mid<7390 or mid>11600):
                continue
            tall = rng.choice((6.2,7.0,8.2))
            front = side * rng.uniform(9.1,10.2)
            colour = rng.choice((0xCEAAA0,0xE4BE91,0x90B4AF,0x9BAFBF,0xD9BD97))
            box(mid,front+side*3.5,-.2,width-.16,7,tall+.2,colour)
            roof(mid,front+side*3.5,tall,width,7.2,1.4,0x78777E)
            box(mid,front-side*.97,3.05,width,2.15,.25,ivory)
            box(mid,front-side*1.96,3.94,width,.1,.13,ivory)
            for bay in (-.34,0,.34):
                at = mid + width*bay
                box(at,front-side*.09,.25,2.25,.18,2.45,0x494856)
                box(at,front-side*.13,4.22,1.24,.22,1.7,0x4C5261)
                for j in (-1,1):
                    box(at+j*.94,front-side*.15,4.23,.54,.23,1.72,teal)
                box(at,front-side*1.95,.1,.19,.20,3.91,ivory)
        for d in range(18,int(k.length),68):
            idx=k.road.index(d)
            k.lamp(idx,side*5.9,'bulb',7.4)
            k.light(k.road.pos(d,side*4.3,.16),'bulb',12,.83)
    # Pink chambers around the square have white pilasters, sash windows and pedimented porches.
    for d,off,w in ((7257,24,24),(7293,32,35),(7325,23,23)):
        box(d,off,-.3,w,11,7.9,pink)
        roof(d,off,7.62,w,11.5,2.05,0x777D81)
        for x in range(-int(w/2)+2,int(w/2),4):
            box(d+x,off-5.55,1.1,1.6,.24,2.0,ivory)
            box(d+x,off-5.72,1.18,1.24,.16,1.78,0x566173)
            box(d+x,off-5.6,4.65,1.57,.25,1.95,ivory)
            box(d+x,off-5.76,4.75,1.22,.13,1.66,0x526074)
        for x in (-3.5,-1.2,1.2,3.5):
            art.tube(k.road.pos(d+x,off-7.7,.3),.28,.23,6.69,lin(0xB8A7A1),lin(ivory),9)
        box(d,off-7.2,.1,9.7,4.6,.41,ivory)
        roof(d,off-6.5,6.96,10.2,5,2.0,ivory)
    for z,w,h,c in ((.1,2.6,.3,0xAAA4A0),(.4,1.82,1.1,ivory),(1.5,1.47,.24,ivory)):
        box(7273,11,z,w,w,h,c)
    for z,a,b,h in ((1.74,.65,.35,1.14),(2.88,.36,.46,.53),(3.41,.23,.23,.41)):
        art.tube(k.road.pos(7273,11,z),a,b,h,lin(0xA8A39C),lin(ivory),10)
    for d in list(range(7160,7380,19))+list(range(11760,12630,29)):
        k.palm(*k.road.pos(d,7.8,.13))
    # Layered ship decks, dark glazing ribbons and twin funnels beyond the wharf.
    for d,offset in ((12090,68),(12295,100)):
        box(d,offset,-1,148,20,5.3,0x536775)
        for deck in range(5):
            w=144-deck*8
            box(d,offset,4.3+deck*2.4,w,18-deck*.7,2.24,0xD6D6CE)
            box(d,offset-9+deck*.35,5.1+deck*2.4,w-2,.36,.79,0x546C79)
        for x in (-18,14):
            art.tube(k.road.pos(d+x,offset,16.3),2.9,2.4,4.9,lin(0xAD5B50),lin(0x5F5661),12)
    for start,end in ((-40,300),(2150,2490),(4590,4930),(7040,7150),(9320,9630)):
        for d in range(start,end,12):
            for side in (-1,1):
                for row in range(3):
                    box(d,side*(6.4+row*.73),.2+row*.46,11.8,.77,.39,0x7A7380)
                box(d,side*5.58,.98,11.95,.065,.09,0xAEB4B9)
                for x in (-5.6,0,5.6):
                    box(d+x,side*5.58,.14,.07,.08,1.02,0x99A4A8)
    return {'efforts':0}


THEME=dict(lay=route,road_builder=road,road_half_width=4.7,night=True,wet=.16,
           chunks={'Land':1},terrain={'rise':.3},land={'low':0x64616B,'mid':0x76727A,'high':0x7D7A78,'rock':0x77747A},
           sky=[0x735875,0x54435E,0x34334E,0x242841,0x181D34],haze=0x595169,
           light=[0xFFD7B0,1.25],fill=[0xBAC4DD,0x836A74],sun_altitude=.32,sun_azimuth=1.63)
