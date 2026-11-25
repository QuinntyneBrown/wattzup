"""Fixed Kamariny oval, highland farm rows and Iten market structures."""
import math
from worldkit import Painted,lin
from arenberg import beam


def site(k, distance, offset=0):
    p=k.road.pos(distance,offset)
    h=k.s[k.road.index(distance)]['h'];cs,sn=math.cos(h),math.sin(h)
    def at(u,v,w=0):return (p[0]+u*cs-v*sn,p[1]+u*sn+v*cs,p[2]+w)
    return at,h


def farms(k,art):
    for d in range(4010,7020,73):
        for side in (-1,1):
            offset=side*k.rng.uniform(27,66)
            at,h=site(k,d,offset)
            length=k.rng.uniform(36,65);width=k.rng.uniform(18,38)
            corners=[at(u,v) for u,v in ((0,0),(length,0),(length,width*side),(0,width*side))]
            field=lin(k.rng.choice((0x63784A,0x7D894A,0x706D47,0x8D8550)))
            def ground(pt,up):
                x,y,_=pt;return (x,y,k.height_at(x,y)+up)
            art.face([ground(c,.36) for c in (corners if side>0 else corners[::-1])],(field,)*4)
            for n in range(2,int(width)-1,2):
                pts=[ground(at(u,(n+v)*side),.61) for u,v in ((0,0),(length,0),(length,1.1),(0,1.1))]
                leaves=lin(k.rng.choice((0x637F39,0x748943,0x506D36)))
                art.face(pts if side>0 else pts[::-1],(leaves,)*4)
    herder,h=site(k,5640,-7.3)
    wood=lin(0x766347);skin=lin(0x76543E)
    beam(art,herder(0,0,.05),herder(.03,0,.90),.15,lin(0x485355))
    beam(art,herder(.22,.06,.04),herder(.14,0,.91),.145,lin(0x485355))
    art.box(herder(.09,0,.8),(.43,.28,.64),h,lin(0x96704C))
    art.tube(herder(.10,0,1.45),.126,.124,.225,skin,skin,7)
    art.tube(herder(.10,0,1.65),.19,.14,.08,wood,wood,8)
    beam(art,herder(.28,0,1.35),herder(.46,-.10,1.08),.104,lin(0x896640))
    beam(art,herder(.46,-.10,1.08),herder(.55,-.17,1.21),.085,skin)
    beam(art,herder(.58,-.19,-.08),herder(.53,-.15,1.82),.047,wood)
    # Taller maize beside the farm gate, with paired blades and tassels.
    at,_=site(k,5650,8)
    for j in range(7):
        for i in range(29):
            x,y,_=at(i*.69,j*1.3);z=k.height_at(x,y)
            top=k.rng.uniform(1.0,1.6)
            art.tube((x,y,z),.026,.017,top,lin(0x718048),lin(0x98A65B),4)
            for sign in (-1,1):
                leaves=((x,y,z+top*.40),(x+.27,y+sign*.44,z+top*.80),(x+.12,y+sign*.76,z+top*.58))
                art.face(leaves,(lin(0x687B43),lin(0x8F9950),lin(0x7A8C46)))


def track(k,art):
    gate,gate_bearing=site(k,8759,8.5)
    for v in (-2.14,2.14):
        art.box(gate(.11,v,-.55),(.14,.14,2.82),gate_bearing,lin(0x6F6250))
    ground,h=site(k,8760,57)
    def at(u,v,w):return ground(u,v,w-6)
    def outline(radius):
        ring=[]
        for centre,phi in ((43,-math.pi/2),(-43,math.pi/2)):
            for i in range(41):
                a=phi+math.pi*i/40;ring.append((centre+radius*math.cos(a),radius*math.sin(a)))
        return ring+[ring[0]]
    base=[at(x,y,.18) for x,y in outline(32)]
    art.face(base[:-1],(lin(0x7C974E),)*(len(base)-1))
    for lo,hi,tint,z in ((31.9,40.3,0xAD5F39,.30),(33.3,33.42,0xBA8056,.33),(36.3,36.42,0xBA8056,.33),(39.8,40.1,0xD6AA7A,.34),(31.93,32.14,0xD9B181,.34)):
        a,b=outline(lo),outline(hi)
        for j in range(len(a)-1):
            pts=(at(*a[j],z),at(*a[j+1],z),at(*b[j+1],z),at(*b[j],z))
            art.face(pts[::-1],(lin(tint),)*4)
    # The old stand's timber planks, sloping corrugated canopy and open front.
    def stand(u,v,w):
        # The covered stand runs across the west end of the oval, facing the infield.
        return at(-87-(v-43),u+8,w)
    for n in range(6):
        v=43+n*.98;z=.32+n*.46
        art.box(stand(5,v,z),(31,.92,.19),h+math.pi/2,lin(0x8E7048))
        art.box(stand(5,v-.44,z-.26),(31,.11,.36),h+math.pi/2,lin(0x5C6E56))
    for u in (-11,-5,1,7,13,21):
        for v,high in ((42.4,6.3),(49,5.3)):
            art.box(stand(u,v,-.45),(.20,.20,high+.45),h,lin(0x665642))
        beam(art,stand(u,42.1,6.2),stand(u,49.4,5.25),.21,lin(0x665642))
    roof=(stand(-12,41.4,6.42),stand(22,41.4,6.42),stand(22,50,5.21),stand(-12,50,5.21))
    art.face(roof,(lin(0x738C86),)*4);art.face(roof[::-1],(lin(0x515D58),)*4)
    art.box(stand(5,41.5,5.76),(34,.18,.65),h+math.pi/2,lin(0x557F6B))
    for u in range(-11,23):
        beam(art,stand(u,41.5,6.43),stand(u,49.9,5.23),.044,lin(0xA1AB9D))
    for u in (-41,41):
        for v in (-3.7,3.7):art.box(at(u,v,.12),(.12,.12,2.5),h,lin(0xDBDAC0))
        art.box(at(u,0,2.56),(.15,7.5,.14),h,lin(0xDBDAC0))


def market(k,art):
    colors=(0x78877C,0xBE965D,0xA76854,0x70A4A4,0xD2BA8E,0x7A9C76)
    for j,d in enumerate(range(12640,13120,14)):
        for side in (-1,1):
            if k.rng.random()<.23:continue
            at,h=site(k,d,side*k.rng.uniform(9,14))
            width=k.rng.uniform(6.3,11.0);depth=k.rng.uniform(4.2,6.3)
            high=k.rng.uniform(2.5,3.4);tone=lin(colors[(j+(side+1))%len(colors)])
            art.box(at(0,0,-1.5),(width,depth,high+1.5),h,tone)
            art.roof(at(0,0,high),width+.7,depth+.95,.64,h,lin(k.rng.choice((0x919391,0x877A6D,0x9C8270))))
            front=-side*(depth/2+.04)
            for u in (-width*.28,width*.28):
                art.box(at(u,front,.52),(width*.27,.11,1.39),h,lin(0x425455))
                art.box(at(u,front-side*.08,1.95),(width*.31,.18,.11),h,lin(0xC1BBB0))
            art.box(at(0,front,.02),(1.18,.13,2.06),h,lin(0x45433A))
            art.box(at(0,front,high-.61),(width*.88,.16,.51),h,lin(k.rng.choice((0x724A3F,0x3B676A,0x42684D))))
            if j%3==0:
                art.box(at(0,front-side*.91,2.38),(width*.91,2.0,.14),h,lin(0xAF926F))
                for u in (-width*.42,width*.42):
                    art.box(at(u,front-side*1.74,-.28),(.10,.10,2.68),h,lin(0x6E6654))
    # A striped fourteen-seat matatu at the loading bay, with repeated windows and rear lamps.
    at,h=site(k,12849,-6.15)
    art.box(at(0,0,.3),(5.54,1.92,.99),h,lin(0xD1C4A3))
    art.box(at(0,0,1.25),(5.47,1.95,.15),h,lin(0xD6AA36))
    art.box(at(0,0,1.41),(5.38,1.89,.83),h,lin(0xDDD5BF))
    for side in (-1,1):
        for n in range(5):art.box(at(-2.08+n*.98,side*.953,1.50),(.78,.05,.55),h,lin(0x536E71))
        for u in (-1.7,1.7):art.box(at(u,side*.88,.05),(.67,.22,.63),h,lin(0x383B36))
    art.box(at(-2.70,0,1.52),(.09,1.40,.50),h,lin(0x596F72))
    for v in (-.74,.74):art.box(at(-2.79,v,.75),(.08,.21,.29),h,lin(0x963F30))
    carrier=lin(0x4F4C40)
    for d in range(12360,13216,44):
        at,_=site(k,d,-5.3)
        art.tube(at(0,0,-.45),.14,.09,7.2,lin(0x65584A),lin(0x8D7756),7)
        art.box(at(0,0,6.3),(.15,2.3,.12),h,carrier)
        if d<13170:
            nxt,_=site(k,d+44,-5.3)
            for v in (-.94,.94):
                a=at(0,v,6.43);b=nxt(0,v,6.43)
                mid=tuple((x+y)*.5 for x,y in zip(a,b));mid=(mid[0],mid[1],mid[2]-.48)
                beam(art,a,mid,.028,carrier);beam(art,mid,b,.028,carrier)


def add(k):
    art=Painted(k)
    for d in range(-40,17860,6):
        for side in (-1,1):
            if 12600<d<13150:continue
            x,y,_=k.road.pos(d+k.rng.uniform(-2,2),side*k.rng.uniform(3.6,7.7))
            z=k.height_at(x,y)
            shade=lin(k.rng.choice((0xA29856,0x848B4E,0x939053,0x9D8C53)))
            for j in range(3):
                dx=k.rng.uniform(-.23,.23);dy=k.rng.uniform(-.20,.20)
                h=k.rng.uniform(.17,.57)
                art.face(((x+dx-.054,y+dy,z),(x+dx+.054,y+dy,z),(x+dx*1.62,y+dy*1.64,z+h)),(shade,)*3)
    farms(k,art)
    track(k,art)
    market(k,art)


def pictured(k,name):
    mesh=type(k.B['terrain'])(name,'terrain')
    mesh.colours=[];mesh.uvs=[];k.B[name]=mesh
    return mesh


def picture(mesh,vertices,uv):
    mesh.faces.append(tuple(mesh.v(p) for p in vertices))
    mesh.colours.extend([(1,1,1,1)]*4)
    mesh.uvs.extend(uv)


def vegetation(k):
    trees=pictured(k,'ItenFlora')
    for d in range(-64,17940,17):
        if 8530<d<8960 or 12600<d<13170:continue
        for row in range(1+int(k.rng.random()<.27)):
            side=k.rng.choice((-1,1))
            lateral=side*(k.rng.uniform(6.6,37) if row==0 else k.rng.uniform(50,130))
            if side<0 and d>15800 and k.rng.random()<.86:continue
            x,y,_=k.road.pos(d+k.rng.uniform(-6,6),lateral)
            z=k.height_at(x,y)-.10
            succulent=k.rng.random()<.23
            tall=k.rng.uniform(3.9,7.4) if succulent else k.rng.uniform(4.2,9.1)
            half=tall*(.35 if succulent else .77)
            yaw=k.rng.random()*math.pi
            u=.5 if succulent else 0
            uv=((u,0),(u+.5,0),(u+.5,1),(u,1))
            for ang in (yaw,yaw+math.pi/2):
                dx=math.cos(ang)*half;dy=math.sin(ang)*half
                picture(trees,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+tall),(x-dx,y-dy,z+tall)),uv)
    horizon=pictured(k,'KerioRim')
    here=k.road.pos(16750)
    picture(horizon,((here[0]-3900,here[1]-2650,840),(here[0]+4000,here[1]-2650,840),
                     (here[0]+4000,here[1]-2650,3620),(here[0]-3900,here[1]-2650,3620)),((0,0),(1,0),(1,1),(0,1)))
