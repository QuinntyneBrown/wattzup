"""Col du Granit's switchbacks and the glacier-scoured mountain beneath them."""
import math

from worldkit import lin


# Signed hairpin radii and station metres on the original race profile.
TURNS = ((1050, 35), (2370, -41), (3745, 34), (4960, -36), (6360, 33),
         (7690, -38), (9050, 41), (10370, -34), (11485, 33), (12590, -37),
         (13910, 43), (15190, -46))


def bearing(d):
    heading = 0.11 + 0.075 * math.sin(d / 195)
    for station, radius in TURNS:
        half = math.pi * abs(radius) / 2
        turn = min(1, max(0, (d - station + half) / (2 * half)))
        heading += math.copysign(math.pi - 0.20, radius) * turn
    return heading


def lay(course, theme, bc):
    rows, stages, length, mean, per_level = bc.lay_centre_line(course, theme)
    x = y = 0
    for row in rows:
        d = row["d"]
        h = bearing(d + bc.STEP / 2)
        row.update(x=x, y=y, h=bearing(d), k=bearing(d + .5) - bearing(d - .5))
        x += bc.STEP * math.cos(h)
        y += bc.STEP * math.sin(h)
    return rows, stages, length, mean, per_level


def land(road, col, theme, bc):
    # One continuous height field serves all the traverses. A cutting under every
    # carriageway keeps the uphill bank out of the rider's lane inside a hairpin.
    floor = bc.Builder("North face fells", "terrain")
    floor.name="FellGround";floor.uvs=[];floor.colours = []
    rows = road.s
    # Interpolate the elevation of consecutive traverses at this easting. Extending
    # the ends of each traverse avoids a vertical jump at its hairpin apex.
    from bisect import bisect_left
    centre_stations=[0]+[d for d,_ in TURNS]+[16100]
    traverses=[]
    for a,b in zip(centre_stations,centre_stations[1:]):
        points=sorted(rows[road.index(a):road.index(b)+1],key=lambda p:p['x'])
        traverses.append(([p['x'] for p in points],points))
    sections={}
    def section(x):
        if x in sections:return sections[x]
        levels=[]
        for xs,points in traverses:
            j=max(1,min(len(xs)-1,bisect_left(xs,x)))
            a,b=points[j-1:j+1];t=min(1,max(0,(x-a['x'])/max(.001,b['x']-a['x'])))
            levels.append((a['y']+(b['y']-a['y'])*t,a['z']+(b['z']-a['z'])*t))
        levels.sort()
        if x==int(x):sections[x]=levels
        return levels
    def height(x,y):
        levels=section(x)
        j=max(1,min(len(levels)-1,bisect_left(levels,(y,-1e9))))
        a,b=levels[j-1:j+1]
        if y<a[0]:base=a[1]-.38*(a[0]-y)
        elif y>b[0]:base=b[1]+.28*(y-b[0])
        else:base=a[1]+(b[1]-a[1])*(y-a[0])/max(1,b[0]-a[0])
        _,i,dist=road.tree.find((x,y,0))
        p=rows[i];blend=min(1,max(0,(dist-8)/13))
        relief=min(1,max(0,(dist-15)/35))
        return (1-blend)*(p['z']-1.2-.15*dist)+blend*(base-3+relief*(3*math.sin(x/24+y/51)+4*math.sin(y/66-x/150)))
    step = 11
    xs = range(int(min(s['x'] for s in rows))-215, int(max(s['x'] for s in rows))+220, step)
    ys = range(int(min(s['y'] for s in rows))-275, int(max(s['y'] for s in rows))+270, step)
    previous = None
    for y in ys:
        current = [(x, y, height(x,y)) for x in xs]
        if previous:
            for i, (left, right) in enumerate(zip(current,current[1:])):
                x, _, z = left
                noise = math.sin(x/33+y/17) + math.sin(x/13-y/19)
                tundra = 450 + 65*noise
                tone = (0x565F51 if noise < 0 else 0x65705B) if z<tundra else (0x777A79 if noise<0 else 0x868888)
                floor.quad(previous[i], previous[i+1], right, left)
                floor.colours.extend([lin(tone)]*4)
                floor.uvs.extend([(xx/12,yy/12+zz/45) for xx,yy,zz in (previous[i],previous[i+1],right,left)])
        previous = current
    floor.build(col)
    shoulders = bc.Builder("Crushed granite shoulders", "terrain")
    shoulders.colours = []
    for side in (-1,1):
        last = None
        for i,p in enumerate(rows):
            row = []
            for offset in (2.9,4.6,8,13):
                x,y,z = road.at(i,side*offset)
                row.append((x,y,z-.18 if offset<5 else height(x,y)+(.25 if offset==8 else -.3)))
            if last:
                for j in range(3):
                    corners = [last[j],row[j],row[j+1],last[j+1]]
                    shoulders.quad(*(corners if side==1 else corners[::-1]))
                    shoulders.colours.extend([lin(0x878781 if j==0 else 0x747976)]*4)
            last = row
    shoulders.build(col)
    stream = bc.Builder("Meltwater", "terrain")
    stream.colours = []
    drift = bc.Builder("Gully snowfields", "terrain")
    drift.colours = []
    for d in (6150, 9120, 11380, 13230, 14620):
        side = 1 if math.cos(bearing(d)) > 0 else -1
        for batch, start, end, span, tint in ((drift,18,97,5.9,0xD0D9E1),
                                                (stream,5,86,.88,0x7BBDC8)):
            last = None
            for reach in range(start, end+1):
                along = d+62 + 2.8*math.sin(reach/9)+.24*reach
                offset = side*reach
                width = span * (.8+.2*math.sin(reach/4))
                row = []
                for bank in (-1,1):
                    x,y,_ = road.pos(along+bank*width,offset)
                    row.append((x,y,height(x,y)+(1.9 if batch is stream else 1.55)))
                if last:
                    batch.quad(*last, row[1], row[0])
                    batch.colours.extend([lin(tint)]*4)
                last = row
    # The near tongue of the gully follows the road briefly before it drains
    # under the shoulder. Its white margins and wet stone are visible together.
    for d in (6220,9132,11378):
        last=None
        for u in range(5,75,2):
            lateral=5.25+u*.16
            pts=[]
            for j,v in enumerate((-3.2,-.78,-.45,.45,.78,3.4)):
                x,y,z=road.pos(d+u,lateral+v)
                # The raised granite shelf meets the shoulder without sinking
                # into the interpolated terrain near the head of the gully.
                base=max(height(x,y)+.35,z+.035*u-.24)
                pts.append((x,y,base+(0.08 if j in (2,3) else .38+.19*math.sin(.15*u+j))))
            if last:
                for j in range(5):
                    batch=stream if j==2 else drift
                    batch.quad(last[j],pts[j],pts[j+1],last[j+1])
                    tone=0x85C4CB if j==2 else 0xD6E3E9 if j in (0,4) else 0x858688
                    batch.colours.extend([lin(tone)]*4)
            last=pts
    stream.build(col)
    drift.build(col)
    mountains(road,bc,col)
    return None, height


def road_surface(r, stages, length, col, bc):
    asphalt = bc.Builder("ColTarmac", "asphalt")
    marks = bc.Builder("Worn bitumen seams", "terrain")
    marks.colours = []
    for i in range(len(r.s)-1):
        for a,b,ha,hb in ((3.05,0,.01,.065),(0,-3.05,.065,.01)):
            asphalt.quad(r.at(i,a,ha),r.at(i,b,hb),r.at(i+1,b,hb),r.at(i+1,a,ha))
        if i%97 in (16,17,18,19):
            offset = 1.22+.13*math.sin(i)
            marks.quad(r.at(i,offset,.061),r.at(i,offset-.05,.061),r.at(i+1,offset+.1,.061),r.at(i+1,offset+.15,.061))
            marks.colours.extend([lin(0x3D4145)]*4)
    asphalt.build(col)
    marks.build(col)


def mountains(road, bc, col):
    peaks = bc.Builder("NorthFace", "terrain")
    peaks.colours=[]; peaks.uvs=[]
    xs=[p['x'] for p in road.s]; ys=[p['y'] for p in road.s]
    # Each face is fixed to the valley floor. The road traverses between the two
    # spurs before reaching the saddle between the last pair of summits.
    for side,edge in ((-1,min(xs)),(1,max(xs))):
        for distance in (185,740):
            previous = None
            for v in range(int(min(ys))-780,int(max(ys))+1060,24):
                base_x=edge+side*(distance+53*math.sin(v/147)+26*math.sin(v/52))
                _, idx, _=road.tree.find((base_x,v,0))
                base=road.s[idx]['z']-95
                crag=265+100*math.sin(v/203+side)+100*abs(math.sin(v/112))+40*math.cos(v/30)
                crag += 190 if distance>500 else 0
                line=[]
                for j,f in enumerate((0,.15,.21,.37,.46,.62,.72,.85,.94,1)):
                    x=base_x+side*(f*(115 if distance<500 else 240) + (12+30*f)*math.sin(v/110+f)+13*math.cos(v/31+2*f)+9*math.sin(j*2.2+v/62))
                    z=(-320 if j==0 else base+f*crag + 8*math.sin(v/72+3*j)*f)
                    line.append((x,v,z))
                if previous:
                    for j in range(len(line)-1):
                        verts=(previous[j],line[j],line[j+1],previous[j+1])
                        peaks.quad(*verts)
                        t=(0xBDBEC6,0xCDD3DF,0xC5C9D8,0xF0CCD0,0xFFDDAC)
                        tone=t[4 if j==8 else 3 if j==7 and math.sin(v/116)>.1 else j%3]
                        peaks.colours.extend([lin(tone)]*4)
                        peaks.uvs.extend([(y/630+x/1500,z/380) for x,y,z in verts])
                previous=line
    peaks.build(col)


def scenery(k):
    from worldkit import Painted
    art=Painted(k);r=k.road;rng=k.rng
    def frame(d,l):
        x,y,z=r.pos(d,l);h=bearing(d)
        def at(u,v,w):
            return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
        return at,h
    trees=k.B["cypress"];trees.name="ColConifers";trees.uvs=[]
    # Below the treeline the crowns have separate whorls and straight bare trunks.
    for d in range(-40,7390,9):
        if d>3100 and rng.random()<(d-3000)/4900:continue
        for sign in (-1,1):
            off=sign*rng.uniform(9,66)
            x,y,_=r.pos(d,off); _,_,dist=r.tree.find((x,y,0))
            if dist<8:continue
            z=k.height_at(x,y)-.65
            height=rng.uniform(7,17);radius=height*rng.uniform(.145,.22)
            larch=rng.random()<.44
            art.tube((x,y,z),.025*height,.085,height*.93,lin(0x56473D),lin(0xA68F76),7)
            for ang in (bearing(d)+.30,bearing(d)+1.83):
                dx=-math.sin(ang)*height*.34;dy=math.cos(ang)*height*.34
                trees.quad((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+height),(x-dx,y-dy,z+height))
                u=0 if larch else .5
                trees.uvs.extend([(u+.006,.003),(u+.494,.003),(u+.494,.997),(u+.006,.997)])
    for d in range(50,16100,6):
        side=rng.choice((-1,1));offset=side*rng.uniform(5.8,24)
        x,y,_=r.pos(d,offset);_,_,dist=r.tree.find((x,y,0))
        if dist<5.4:continue
        z=k.height_at(x,y)
        stone=rng.choice((0x666F77,0x898E95,0xA6A4A4,0x707B83));radius=rng.uniform(.22,1.8)
        art.tube((x,y,z-.35*radius),radius*.83,radius,.66*radius,lin(0x525962),lin(stone),6)
        art.tube((x,y,z+.31*radius),radius,radius*.45,.42*radius,lin(stone),lin(0xA4A4A5),6,lin(stone))
        if d<10900:
            for j in range(4):
                u=x+.7*math.sin(j*2.4);v=y+.72*math.cos(j*2.4)
                for blade in range(3):
                    az=blade*.93+j
                    art.face(((u-.08,v,z),(u+.08,v+.05,z),(u+.25*math.sin(az),v+.23*math.cos(az),z+.76)),(lin(0x687451),lin(0x657150),lin(0x9B9A68)))
    for d in range(1200,16120,15):
        side=-1 if math.cos(bearing(d))>0 else 1
        q,h=frame(d,side*3.67)
        art.tube(q(0,0,-.22),.12,.12,1.08,lin(0xACABA2),lin(0xECE6DA),8)
        art.tube(q(0,0,.86),.123,.121,.29,lin(0x963E3A),lin(0xB64C43),8)
        is_bend=any(abs(d-turn)<98 for turn,_ in TURNS)
        if not is_bend and not (11800<d<12800):continue
        for u in range(0,15,3):
            f,angle=frame(d+u,side*3.72)
            for layer in range(4):
                for j in range(2):
                    tone=rng.choice((0x838382,0x999694,0xA3A09A,0x6E737A))
                    art.box(f((j-.5)*1.46+.27*(layer%2),0,-.16+layer*.188),(1.39,.52,.177),angle,lin(tone))
            # Seen from the traverses below, the same blocks retain the road bench.
            for layer in range(6):
                art.box(f(0,side*.05,-.22-(layer+1)*.73),(2.96,.63,.71),angle,lin(0x67686B if layer%2 else 0x777A80))
    # A chimney, shuttered windows, stone cairn and board identify the inhabited saddle.
    q,h=frame(16012,-9)
    art.box(q(0,0,-4),(14,8.5,8.2),h,lin(0xB7A99C))
    art.roof(q(0,0,4.2),14.6,9,2.8,h,lin(0x62565A))
    for j in (-4.9,-1.7,1.7,4.9):
        art.box(q(j,4.31,1.56),(1.05,.09,1.34),h,lin(0x575D64))
        for offset in (-.78,.78):
            art.box(q(j+offset,4.36,1.53),(.39,.11,1.40),h,lin(0x80514B))
    art.box(q(-5.4,1.2,5.4),(.87,.9,2.4),h,lin(0x8C837F))
    for j in range(7):
        art.tube(q(-11+.11*math.sin(j),4+.13*math.cos(j),-.35+j*.38),1.7-j*.21,1.5-j*.21,.45,lin(0x706A6C),lin(0xACA8A5),7)
    # The faces use a shared atlas with the measured grade of the next kilometre.
    signs=k.B['paint'];signs.name='ColSigns';signs.uvs=[]
    summit=k.B['yellow'];summit.name='SummitSign';summit.uvs=[]
    borne=k.B['accent'];borne.name='SixthBorne';borne.uvs=[]
    def panel(q,u,span,bottom,top,tile):
        batch = summit if tile==17 else borne if tile==6 else signs
        pts=(q(u,span/2,bottom),q(u,-span/2,bottom),q(u,-span/2,top),q(u,span/2,top))
        batch.quad(*pts)
        a=tile%4/4; b=1-(tile//4+1)/8
        batch.uvs.extend([(a+.001,b+.001),(a+.249,b+.001),(a+.249,b+.124),(a+.001,b+.124)])
    for km in range(17):
        q,h=frame(km*1000+1,-3.75)
        art.box(q(0,0,-.5),(.5,.95,1.68),h,lin(0xDDD7C6))
        art.box(q(0,0,1.18),(.5,.95,.23),h,lin(0xD5AD52))
        panel(q,-.26,.93,.18,1.39,km)
    q,h=frame(15993,-4.4)
    for v in (-1.6,1.6):
        art.box(q(0,v,-.55),(.18,.18,3.55),h,lin(0x777474))
    art.box(q(0,0,1.08),(.23,4.6,1.9),h,lin(0xE3DFCF))
    panel(q,-.13,4.55,1.12,2.93,17)
    for i,d in enumerate((3480,6060,7650,9150,11280,12510,15800)):
        a,b=r.pos(d,1.22,.072),r.pos(d,-1.22,.072)
        c,e=r.pos(d+3.1,-1.22,.072),r.pos(d+3.1,1.22,.072)
        signs.quad(a,b,c,e)
        t=18+i%3;u=t%4/4;v=1-(t//4+1)/8
        signs.uvs.extend([(u,v),(u+.25,v),(u+.25,v+.125),(u,v+.125)])
    return {'efforts':0}
