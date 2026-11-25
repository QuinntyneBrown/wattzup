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
    def atlas(name):
        mesh=type(k.B['terrain'])(name,'terrain')
        mesh.colours=[];mesh.uvs=[];k.B[name]=mesh
        return mesh
    shops=atlas('BayStreetShops')
    stands=atlas('BayStreetStands')
    def panel(mesh, start, end, offset, base, top, u, span):
        corners=[k.road.pos(pos,offset,z) for pos,z in ((start,base),(end,base),(end,top),(start,top))]
        mesh.faces.append(tuple(mesh.v(q) for q in corners))
        mesh.colours.extend([(1,1,1,1)]*4)
        mesh.uvs.extend(((u,0),(u+span,0),(u+span,1),(u,1)))
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
            near,far=mid-width/2,mid+width/2-.16
            panel(shops, near if side<0 else far, far if side<0 else near, front-side*.11,.16,tall,
                  rng.randrange(4)/4,.25)
            for bay in (-.42,0,.42):
                box(mid+bay*width,front-side*1.95,.1,.19,.20,3.91,ivory)
            for rail in range(int(width)):
                box(mid-width/2+rail+.5,front-side*1.96,3.24,.055,.07,.69,ivory)
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
    # Victoria sits on a chair above a broad skirt, with sceptre, small crown and armrests.
    for y in (-.39,.39):
        box(7273.14,11+y,2.24,.72,.1,.8,0xC3B9AB)
        box(7272.91,11+y,2.85,.59,.15,.17,0xCEC4B5)
    box(7273.38,11,2.55,.21,.92,1.14,0xADAAA4)
    art.tube(k.road.pos(7272.77,10.58,2.64),.029,.024,1.25,lin(0xB5AEA3),lin(ivory),6)
    art.tube(k.road.pos(7273,11,3.79),.19,.16,.15,lin(0xBDB6A9),lin(ivory),8)
    for d in list(range(7160,7380,19))+list(range(11760,12630,29)):
        k.palm(*k.road.pos(d,7.8,.13))
    # A quay edge, bollards and mooring ropes meet the water behind the palms.
    for d in range(11650,int(k.length)+20,15):
        box(d,51,-2,16,81,1.85,0x487A89)
        box(d,10,-.28,15.1,3.0,.48,0xA89A87)
        art.tube(k.road.pos(d,11,.12),.18,.22,.56,lin(0x414751),lin(0x666873),8)
    # Layered ship decks, dark glazing ribbons and twin funnels beyond the wharf.
    for d,offset in ((12090,68),(12295,100)):
        box(d,offset,-1,148,20,5.3,0x536775)
        for deck in range(5):
            w=144-deck*8
            box(d,offset,4.3+deck*2.4,w,18-deck*.7,2.24,0xD6D6CE)
            box(d,offset-9+deck*.35,5.1+deck*2.4,w-2,.36,.79,0x546C79)
        # The hull narrows to a raked bow, with a continuous row of cabin windows.
        stations=((70,9.9),(81,8.1),(91,4.7),(96,.25))
        for (a,wa),(b,wb) in zip(stations,stations[1:]):
            for side in (-1,1):
                art.face(tuple(k.road.pos(d+u,offset+side*v,z) for u,v,z in
                         ((a,wa,-.6),(b,wb,-.35),(b+1,wb,4.4),(a+1,wa,4.4))),
                         (lin(0x3E5666),lin(0x485B6C),lin(0xD6D3C6),lin(0xBBC2BE)))
        for cabin in range(-61,68,3):
            for level in (5.0,7.35,9.72):
                box(d+cabin,offset-9.36+(level-5)*.135,level,1.37,.25,.61,0x879AA2)
        for x in (-18,14):
            art.tube(k.road.pos(d+x,offset,16.3),2.9,2.4,4.9,lin(0xAD5B50),lin(0x5F5661),12)
    for start,end in ((-40,300),(2150,2490),(4590,4930),(7040,7150),(9320,9630)):
        for d in range(start,end,12):
            for side in (-1,1):
                near,far=d-5.83,d+5.83
                panel(stands,near if side<0 else far,far if side<0 else near,side*6.63,.43,3.13,0,1)
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
