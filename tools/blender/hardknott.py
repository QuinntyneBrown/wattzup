"""The Hardknott and Wrynose fells, with one continuous surface beneath the folded lane."""
import math
from worldkit import Painted,lin

LENGTH=10300
TURNS=((1030,33),(2290,-31),(3440,26),(4550,-27),(5510,25),(6450,-22),(7130,19),(7420,-15),(7710,16),(8340,-24),(9130,28))
PROFILE=((0, 64), (750, 79), (1410, 97), (1760, 132), (2630, 158), (3260, 210), (3650, 226), (4280, 263), (5030, 279), (5280, 298), (6050, 310), (6800, 321), (7040, 336), (7200, 344), (7270, 363), (7330, 372), (7420, 399), (7530, 410), (7620, 435), (7890, 451), (8340, 393), (8910, 325), (9270, 263), (9860, 201), (10300, 175))

def watercourse(y, eastern):
    if eastern:
        return -796+42*math.sin(y/83)+19*math.cos(y/29),72+.025*(y-1290)
    return -270+46*math.sin(y/103)+18*math.cos(y/54),35+.028*(y+260)

def height_at_station(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]

def bearing(d):
    angle=.13+.073*math.sin(d/83)+.049*math.cos(d/49)
    for centre,r in TURNS:
        arc=(math.pi-.24)*abs(r)
        t=min(1,max(0,(d-centre)/arc+.5))
        angle+=math.copysign(math.pi-.24,r)*t
    return angle

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d)
        if i:
            angle=bearing(d-bc.STEP/2);x+=math.cos(angle)*bc.STEP;y+=math.sin(angle)*bc.STEP
        rows.append(dict(x=x,y=y,z=height_at_station(d),d=d,h=h,k=(bearing(d+.5)-bearing(d-.5)),g=100*(height_at_station(d+.5)-height_at_station(d-.5))))
    return rows,stages,length,sum(s['level']*(s['to']-s['from']) for s in stages)/length,0

def road(r,st,length,col,theme,bc):
    asphalt=bc.Builder("Road","asphalt");tufts=bc.Builder("Centre turf","terrain");tufts.colours=[]
    for i,row in enumerate(r.s[:-1]):
        width=2.12+.18*math.sin(row['d']/39)+.62*min(1,abs(row['k'])*18)
        asphalt.quad(r.at(i,width,.012),r.at(i,-width,.012),r.at(i+1,-width,.012),r.at(i+1,width,.012))
        cover=math.sin(row['d']/21)+.42*math.sin(row['d']/11)
        if cover>.33 and abs(row['k'])<.03:
            spread=.09*cover
            tufts.quad(r.at(i,spread,.025),r.at(i,-spread,.025),r.at(i+1,-spread,.025),r.at(i+1,spread,.025))
            tufts.colours.extend([lin(0x74804D)]*4)
    asphalt.build(col);tufts.build(col)

def land(road,col,theme,bc):
    floor=bc.Builder('FellGround','terrain');floor.colours=[];floor.uvs=[];rows=road.s
    # Interpolate the elevation of consecutive traverses at this easting. Extending
    # the ends of each traverse avoids a vertical jump at its hairpin apex.
    from bisect import bisect_left
    centre_stations=[0]+[d for d,_ in TURNS]+[LENGTH]
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
        z=(1-blend)*(p['z']-1.2-.15*dist)+blend*(base-3+relief*(3*math.sin(x/24+y/51)+4*math.sin(y/66-x/150)))
        eastern=y>900
        low,high=(1260,1930) if eastern else (-310,545)
        if low-160<y<high+160:
            sx,level=watercourse(y,eastern);offset=abs(x-sx)
            amount=min(1,max(0,(dist-20)/45))*max(0,min(1,(y-low+160)/160,(high+160-y)/160))
            mix=amount*max(0,min(1,(265-offset)/170))
            floor=level-1.1+max(0,offset-5)*.092
            z=z*(1-mix)+floor*mix
        return z
    # Flatten the fort spur above Eskdale to the gate platform, then blend it
    # back into the intersecting fells. Keep the lane's own cutting intact.
    ground_height=height
    ox,oy,oz=road.pos(3300,11);direction=bearing(3300)
    def height(x,y):
        z=ground_height(x,y)
        dx,dy=x-ox,y-oy
        u=dx*math.cos(direction)+dy*math.sin(direction)
        v=-dx*math.sin(direction)+dy*math.cos(direction)
        mix=max(0,min(1,(u+10)/8,(58-u)/9,(v+9)/7,(46-v)/8))
        if mix:
            _,i,dist=road.tree.find((x,y,0))
            mix*=min(1,max(0,(dist-3.7)/4))
        return z*(1-mix)+(oz+.65+.023*u+.008*v)*mix
    step = 9
    xs = range(int(min(s['x'] for s in rows))-450, int(max(s['x'] for s in rows))+450, step)
    ys = range(int(min(s['y'] for s in rows))-420, int(max(s['y'] for s in rows))+440, step)
    previous = None
    for y in ys:
        current = [(x, y, height(x,y)) for x in xs]
        if previous:
            for i, (left, right) in enumerate(zip(current,current[1:])):
                x, _, z = left
                noise = math.sin(x/33+y/17) + math.sin(x/13-y/19)
                browning=185+70*math.sin(x/170+y/95)+15*noise
                rock=math.sin(x/41)+.73*math.cos(y/28)+.28*math.sin((x+y)/11)
                if z<142:
                    tone=0x708856 if noise<0 else 0x83955F
                elif z>browning and rock>1.1:
                    tone=0x787A72 if noise<0 else 0x828078
                elif z>browning:
                    tone=0x817B51 if noise<0 else 0x969064
                else:
                    tone=0x697A45 if noise<0 else 0x7C8654
                floor.quad(previous[i], previous[i+1], right, left)
                floor.colours.extend([lin(tone)]*4)
                floor.uvs.extend([(xx/12,yy/12+zz/45) for xx,yy,zz in (previous[i],previous[i+1],right,left)])
        previous = current
    floor.build(col)
    shoulders = bc.Builder("FellVerge", "terrain")
    shoulders.colours = []
    for side in (-1,1):
        last = None
        for i,p in enumerate(rows):
            row = []
            for offset in (1.96,3.4,7,13):
                x,y,z = road.at(i,side*offset)
                row.append((x,y,z-.18 if offset<4 else height(x,y)+(.25 if offset==7 else -.3)))
            if last:
                for j in range(3):
                    corners = [last[j],row[j],row[j+1],last[j+1]]
                    shoulders.quad(*(corners if side==1 else corners[::-1]))
                    shoulders.colours.extend([lin(0x777956 if j==0 else 0x737F52)]*4)
            last = row
    shoulders.build(col)
    # Extend the native height field beneath the distant ranges. The coarse outer
    # triangles meet the same edge heights as the fine terrace grid.
    horizon=bc.Builder("FellFar","terrain");horizon.colours=[]
    edges=[[(x,ys[0]) for x in xs],[(xs[-1],y) for y in ys],[(x,ys[-1]) for x in reversed(xs)],[(xs[0],y) for y in reversed(ys)]]
    for edge in edges:
        old=[(x,y,height(x,y)-.12) for x,y in edge]
        for extension in (42,130,270,480,760,1100,1550,2200,3200,4700):
            row=[]
            for x,y in edge:
                dx,dy=x-100,y-810;length=math.hypot(dx,dy)
                xx=x+extension*dx/length;yy=y+extension*dy/length
                base=45+55*(1+math.sin(xx/490)*math.cos(yy/386))+17*math.sin(xx/149+yy/164)
                f=1-math.exp(-extension/190)
                z=height(x,y)*(1-f)+base*f
                row.append((xx,yy,z-.22))
            for j in range(len(row)-1):
                corners=(old[j],row[j],row[j+1],old[j+1]);horizon.quad(*corners)
                for xx,yy,zz in corners:
                    shade=0x73805B if math.sin(xx/169)+math.cos(yy/195)>.2 else 0x7D865F
                    horizon.colours.append(lin(shade))
            old=row
    horizon.build(col)

    river=bc.Builder("Esk and Duddon","terrain");river.colours=[]
    for low,high,eastern in ((-298,538,False),(1268,1925,True)):
        old=None
        for y in range(low,high,3):
            x,z=watercourse(y,eastern)
            width=3+.7*math.cos(y/37);row=((x-width,y,z),(x+width,y,z))
            if old:
                river.quad(old[0],old[1],row[1],row[0]);river.colours.extend([lin(0x829D9B)]*4)
            old=row
    river.build(col)
    return None,height

def scenery(k):
    from mathutils import Vector
    rng=k.rng;road=k.road;art=Painted(k)
    slate=(0x777B71,0x656864,0x84857D,0x666A60,0x8C8A7B)
    def anchored(d,off):
        x,y,z=road.pos(d,off)
        if abs(off)>3.5:
            amount=max(0,min(1,(abs(off)-3.4)/3.6))
            z=(z-.18)*(1-amount)+(k.height_at(x,y)+.13)*amount
        return x,y,z
    def local(d,off):
        x,y,z=anchored(d,off);h=bearing(d)
        return lambda u,v,w:(x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w),h
    def rock(p,at,yaw,length,width,high,colour):
        cs,sn=math.cos(yaw),math.sin(yaw);rings=[]
        for z,shrink in ((-.06,.82),(.22,1),(.76,.9),(1,.64)):
            row=[]
            for u,v in ((-.50,-.30),(-.33,-.5),(.39,-.48),(.5,-.21),(.46,.38),(.25,.52),(-.39,.45),(-.49,.19)):
                dx=(u+.025*rng.uniform(-1,1))*length*shrink;dy=v*width*shrink
                row.append((at[0]+cs*dx-sn*dy,at[1]+sn*dx+cs*dy,at[2]+z*high))
            if rings:
                c=lin(colour);dark=tuple(e*.78 if i<3 else 1 for i,e in enumerate(c))
                for j,n in enumerate(row):
                    l=(j+1)%8;p.face((rings[-1][j],rings[-1][l],row[l],n),(dark,dark,c,c))
            rings.append(row)
        p.face(rings[-1],(lin(colour),)*8)
    def wall(ax,ay,bx,by,step=1.25,height=1):
        count=max(1,round(math.hypot(bx-ax,by-ay)/step));angle=math.atan2(by-ay,bx-ax)
        for level in range(3):
            for j in range(count):
                t=(j+.48+.17*(level%2))/count
                x=ax+(bx-ax)*t;y=ay+(by-ay)*t;_,_,gap=road.tree.find((x,y,0))
                if gap<3.3:continue
                z=k.height_at(x,y)-.10
                rock(art,(x,y,z+level*.30*height),angle,step*rng.uniform(.97,1.11),(.74-.10*level)*height,.40*height,rng.choice(slate))
    # Boundary walls follow short runs of the outside bank, away from the inside turning radius.
    for start,end,side in ((8,144,1),(905,985,-1),(1400,1555,-1),(1765,1840,1),(3150,3210,1),(5200,5300,1),(6975,7025,-1),(7365,7398,-1),(7810,7875,-1),(9490,9570,1)):
        for d in range(start,end,6):
            ax,ay,_=anchored(d,side*5.5);bx,by,_=anchored(d+6,side*5.5)
            wall(ax,ay,bx,by,1.1,.98)
    # An original four-sided Roman fort, with a gateway gap and internal stone buildings.
    origin,h=local(3300,11);gateway=Painted(k,'accent');gateway.b.name='FortGate'
    def ruin(u,v,du,dv,size=1):
        length=math.hypot(du,dv);count=max(1,round(length/1.1));angle=h+math.atan2(dv,du)
        for j in range(count):
            t=(j+.5)/count
            px,py,_=origin(u+du*t,v+dv*t,0)
            for level in range(3+(j%4==0)):
                rock(art,(px,py,k.height_at(px,py)+level*.24-.06),angle,1.18,.78*size,.32,rng.choice(slate))
    for u,v,du,dv in ((0,-4,0,2),(0,2,0,27),(0,29,5,5),(5,34,39,0),(44,34,5,-5),(49,29,0,-29),(49,0,-5,-4),(44,-4,-44,0),
                              (7,5,10,0),(17,5,0,8),(17,13,-10,0),(7,13,0,-5),
                              (21,6,14,0),(35,6,0,7),(35,13,-14,0),(21,13,0,-4),
                              (12,20,19,0),(31,20,0,6),(31,26,-19,0),(12,26,0,-4)):
        ruin(u,v,du,dv)
    for v in (-2.3,2.3):
        x,y,_=origin(0,v,0)
        for j in range(4):rock(gateway,(x,y,k.height_at(x,y)-.1+j*.29),h,1.85,1.22,.36,rng.choice(slate))
    # Short returns beside the double gateway and the raised granary partitions.
    for v in (-2.3,2.3):ruin(0,v,4.2,0)
    for u in (14,17.8,21.6,25.4,29.2):ruin(u,20,0,4.8,.65)
    boards=[k.B[name] for name in ('paint','whitewash','yellow')]
    for board,name in zip(boards,('PassWarning','PassPlate','CaravanPlate')):
        board.name=name;board.uvs=[]
    centre,h=local(105,-3)
    for v in (-.32,.32):art.box(centre(.05,v,-.3),(.075,.075,3.18),h,lin(0x8D9190))
    for board,bottom,top,width in zip(boards,(1.95,1.45,.94),(3.1,1.92,1.42),(1.2,1.33,1.49)):
        board.quad(centre(-.03,width/2,bottom),centre(-.03,-width/2,bottom),centre(-.03,-width/2,top),centre(-.03,width/2,top))
        board.uvs.extend([(0,0),(1,0),(1,1),(0,1)])
    for j in range(13):
        q,h=local(135+j*.13,0);art.box(q(0,0,.025),(.078,4.10,.045),h,lin(0xA4A9A8))
    for d in range(-35,10425,4):
        off=rng.choice((-1,1))*rng.uniform(6.5,78);x,y,z=anchored(d,off)
        _,_,gap=road.tree.find((x,y,0))
        if gap<6:continue
        r=rng.uniform(.25,1.45) if d<6100 else rng.uniform(.45,3.15)
        rock(art,(x,y,z-.25*r),rng.uniform(-3,3),r*1.9,r,r*.68,rng.choice(slate))
    sheep=Painted(k,'wood');sheep.b.name='HerdwickHead';sheep.b.uvs=[]
    crossing=Painted(k,'neon-cyan');crossing.b.name='HerdwickCross';crossing.b.uvs=[]
    def fleece(batch,q,offset,radii,colour,phase=0,weight=0):
        rows=[]
        for i in range(7):
            lat=math.pi*(i/6-.5);row=[]
            for j in range(10):
                a=j*math.tau/10
                row.append(q(offset[0]+radii[0]*math.cos(lat)*math.cos(a),offset[1]+radii[1]*math.cos(lat)*math.sin(a),offset[2]+radii[2]*math.sin(lat)))
            if rows:
                for j in range(10):
                    n=(j+1)%10
                    pts=(rows[-1][j],rows[-1][n],row[n],row[j]);batch.face(pts,(lin(colour),)*4)
                    if batch in (sheep,crossing):batch.b.uvs.extend([(weight,phase)]*4)
            rows.append(row)
    for d,side in ((515,1),(1724,-1),(3010,-1),(5240,1),(5304,-1),(6020,1),(7450,-1),(9660,1)):
        for j in range(5):
            station=d+j*4
            distance=side*(2.7 if d==5304 and j==0 else rng.uniform(5.2,14))
            x,y,z=anchored(station,distance);a=bearing(station)+rng.uniform(-1.6,1.6)
            def q(u,v,w):return (x+u*math.cos(a)-v*math.sin(a),y+u*math.sin(a)+v*math.cos(a),z+w)
            grey=rng.choice((0x93928A,0xA4A59B,0x7F807B,0xB0ADA1))
            fleece(art,q,(0,0,.71),(.73,.37,.40),grey)
            for f in (-.44,.41):
                for v in (-.21,.21):
                    art.tube(q(f,v,0),.067,.08,.56,lin(0x5F5D58),lin(0xA19E92),7)
            phase=rng.random()
            fleece(sheep,q,(.66,0,.62),(.25,.17,.24),0xE5E2D3,phase,.7)
            fleece(sheep,q,(.80,0,.51),(.18,.14,.12),0xD5CEBA,phase,1)
            for v in (-.16,.16):fleece(sheep,q,(.60,v,.75),(.13,.11,.056),0xB9B5A9,phase,.48)
    # One ewe walks across the lane; leg weights distinguish diagonal pairs.
    def ewe(u,v,w):return (u,v,w+.012)
    fleece(crossing,ewe,(0,0,.69),(.71,.35,.38),0x898C84)
    fleece(crossing,ewe,(.66,0,.78),(.26,.18,.25),0xE9E5D7)
    fleece(crossing,ewe,(.83,0,.69),(.16,.14,.12),0xC8C3AF)
    for v in (-.19,.19):fleece(crossing,ewe,(.6,v,.9),(.12,.13,.06),0xA6A499)
    for u in (-.44,.42):
        for v in (-.20,.20):
            phase=.5 if u*v<0 else 0
            fleece(crossing,ewe,(u,v,.29),(.077,.069,.28),0x88897E,phase,1)
    # Fell farmsteads belong to enclosed green fields on the valley floor.
    for x,y in ((-194,110),(-358,242),(-184,350),(-721,1370),(-870,1510),(-720,1790)):
        for j in range(2):
            u=x+j*11;v=y+j*7;base=k.height_at(u,v)
            art.box((u,v,base-.7),(10,5.8,4.1),.12,lin(0xCDCABD))
            art.roof((u,v,base+3.4),10,5.8,2.1,.12,lin(0x5C6265))
            for w in (-3.4,-1,1.6,3.7):art.box((u+w,v-2.88,base+1),(1,.14,1.35),.12,lin(0x455A60))
        for j in range(2):
            yy=y-20+54*j;wall(x-20,yy,x+75,yy,2.7,.70)
    highland=Painted(k,'peaks');highland.b.name='ScafellRange'
    # Model the Scafell group and the surrounding Borrowdale volcanic ridges in fixed space.
    for cx,cy,rx,ry,high in ((-2950,1970,1950,1210,690),(-2780,2600,1190,1280,795),
                              (-1900,3060,1140,980,810),(-940,3270,1450,1230,777),
                              (1270,3100,1410,1350,624),(2600,1450,1560,1520,730),
                              (2420,-540,1360,994,558),(-1320,-2370,1660,1360,520)):
        high*=.61
        old=None
        for n in range(15,0,-1):
            f=n/15;row=[]
            for j in range(65):
                a=j*math.tau/64
                spur=1+.18*math.sin(3*a+cy)+.12*math.cos(7*a+cx)+.05*math.sin(11*a)
                z=-45+high*(1-f**1.3)+83*math.sin(5*a+cx)*math.sin(f*math.pi)+51*math.cos(8*a)*f*(1-f)+21*math.sin(13*a+f*4)*math.sin(f*math.pi)
                row.append((cx+rx*f*spur*math.cos(a),cy+ry*f*spur*math.sin(a),z))
            if old:
                for j in range(64):
                    c=lin(0x67767D if n<7 else 0x748175)
                    dark=lin(0x536572 if n<7 else 0x687568)
                    highland.face((old[j],old[j+1],row[j+1],row[j]),(dark,dark,c,c))
            old=row
        for j in range(64):highland.face((old[j],old[j+1],(cx,cy,high-23)),(lin(0x65757D),)*3)
    # Far vistas are fixed in map space. Their near geometric foothills supply parallax.
    for material,name,cx,cy,span,bottom,top in (
            ('lamp-red','EskdaleVale',-2050,600,5400,-660,1080),
            ('lamp-green','ScafellPikes',2300,1420,5900,-610,1260)):
        panorama=k.B[material];panorama.name=name;panorama.uvs=[]
        dx,dy=cx-140,cy-920;distance=math.hypot(dx,dy);ux,uy=-dy/distance,dx/distance
        panorama.quad((cx+ux*span/2,cy+uy*span/2,bottom),(cx-ux*span/2,cy-uy*span/2,bottom),
                      (cx-ux*span/2,cy-uy*span/2,top),(cx+ux*span/2,cy+uy*span/2,top))
        panorama.uvs.extend([(0,0),(1,0),(1,1),(0,1)])
    clouds=k.B['cypress'];clouds.name='FellMist';clouds.uvs=[]
    for cx,cy,cz,width in ((-2450,1940,540,1270),(-1760,2530,545,1230),(-720,2950,585,1610),
                           (1600,2570,475,1260),(2020,910,430,1080),(-2100,600,380,940)):
        towards=math.atan2(cy-830,cx-120)+math.pi/2
        dx=width*math.cos(towards)/2;dy=width*math.sin(towards)/2
        clouds.quad((cx-dx,cy-dy,cz-36),(cx+dx,cy+dy,cz-36),(cx+dx,cy+dy,cz+115),(cx-dx,cy-dy,cz+115))
        clouds.uvs.extend([(0,0),(1,0),(1,1),(0,1)])
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0x768151},'terrain':{'sea':False},
       'haze':0xBCC2BA,'sky':[0xB5C3C5,0xCDD1CA,0xABB8BC,0x82939E,0x657B8D],
       'light':[0xFFF1D3,1.32],'fill':[0xDBDFD6,0x929580],'sun_altitude':.48,'sun_azimuth':2.4,
       'palette':{'asphalt':0x535454}}
