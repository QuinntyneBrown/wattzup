"""Roadside masonry, electric railway, TT footbridge and Creg-ny-Baa on the A18."""
import math
from mathutils import Vector
from worldkit import lin


def frame(k, distance):
    x,y,z=k.road.pos(distance)
    h=k.s[k.road.index(distance)]['h']
    def point(u,v,w=0):
        return (x+u*math.cos(h)-v*math.sin(h), y+u*math.sin(h)+v*math.cos(h),z+w)
    return point,h


def beam(art,a,b,r,colour):
    a,b=Vector(a),Vector(b)
    axis=(b-a).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.001:side=Vector((1,0,0))
    side.normalize()
    up=axis.cross(side)
    corners=[(side*i+up*j)*r*.5 for i,j in ((-1,-1),(1,-1),(1,1),(-1,1))]
    for i,v in enumerate(corners):
        w=corners[(i+1)%4]
        art.face((a+v,b+v,b+w,a+w),(colour,)*4)


def railway(k,art):
    point,h=frame(k,3592)
    steel,dark,timber=map(lin,(0xA1A6A3,0x454D48,0x66584B))
    # Gauge follows the oblique crossing through the Bungalow.
    for g in (-.533,.533):
        beam(art,point(-65*.47+g,-65,.06),point(100*.47+g,100,.06),.09,steel)
    for v in range(-65,100):
        if abs(v)>4:
            # Gravel bed tapers to the moor under the sleepers, away from the tarmac.
            corners=[]
            for vv,uu,up in ((v,-1.35,-.13),(v+1,-1.35,-.13),(v+1,1.35,-.13),(v,1.35,-.13)):
                corners.append(point(.47*vv+uu,vv,up))
            art.face(corners,(lin(0x7E7C72),)*4)
            for sign in (-1,1):
                a,b=corners[0:2] if sign<0 else corners[2:4][::-1]
                outer=[]
                for vv in (v,v+1):
                    x,y,z=point(.47*vv+sign*1.9,vv)
                    outer.append((x,y,min(z-.24,k.height_at(x,y)-.15)))
                art.face((a,b,outer[1],outer[0]),(lin(0x807D70),)*4)
    # The little railway buildings sit beside the crossing, with cream trim and pitched slate roofs.
    for u,v,w,d in ((20,20,7,3.8),(-11,-16,6,4.2)):
        x,y,z=point(u,v)
        art.box((x,y,z-1.0),(w,d,3.4),h,lin(0x8C544B))
        art.roof((x,y,z+2.4),w+.6,d+.6,1.25,h,lin(0x4A5152))
        for j in (-1,1):
            art.box(point(u+j*w*.24,v-d*.5, .64),(1.13,.18,1.05),h,lin(0xD4D0BA))
            art.box(point(u+j*w*.24,v-d*.5-.1,.75),(.91,.09,.84),h,lin(0x526466))
    for v in range(-60,100):
        if abs(v)>4:
            beam(art,point(v*.47-1.0,v,-.08),point(v*.47+1.0,v,.0),.18,timber)
    for v in range(-70,91,20):
        u=v*.47
        art.tube(point(u+2.9,v,-.15),.13,.085,6.1,dark,dark,7)
        beam(art,point(u+2.9,v,5.8),point(u,v,5.45),.09,steel)
        if v<90:beam(art,point(u,v,5.45),point((v+20)*.47,v+20,5.45),.032,dark)


def footbridge(k,art):
    point,h=frame(k,3920)
    steel=lin(0xA9AFA9);dark=lin(0x2F3535)
    for v in (-6.4,6.4):
        for u in (-1.04,1.04):
            beam(art,point(u,v,-.45),point(u,v,5.9),.22,steel)
    art.box(point(0,0,5.35),(2.5,15,.31),h,steel)
    for u in (-1.22,1.22):
        art.box(point(u,0,5.60),(.14,14.7,1.45),h,dark)
    for side in (-1,1):
        for j in range(31):
            v=(7.5+j*.3)*side
            top=5.65-j*.175
            art.box(point(0,v,top-.19),(2.1,.34,.19),h,steel)
            if j%5==0:
                for u in (-1.05,1.05):
                    beam(art,point(u,v,top),point(u,v,top+1),.065,steel)
        for u in (-1.05,1.05):
            beam(art,point(u,7.5*side,6.65),point(u,16.5*side,1.4),.08,steel)


def person(art,point,h,u,v,z,shirt,pose):
    def p(x,y,w):return point(u+x,v+y,z+w)
    dark=lin(0x404648)
    for side in (-1,1):
        beam(art,p(side*.105,0,.12),p(side*.095,.04,.86),.14,dark)
        art.box(p(side*.105,-.055,0),(.17,.30,.13),h,lin(0x46433B))
    art.box(p(0,0,.79),(.43,.27,.60),h,lin(shirt))
    art.tube(p(0,0,1.40),.135,.13,.22,lin(0xB58E77),lin(0xD4AD92),8)
    art.tube(p(0,0,1.60),.14,.10,.07,dark,dark,8)
    for side in (-1,1):
        hand=.92 if not pose else 1.46+(.21 if side==1 else -.18)
        beam(art,p(side*.2,0,1.31),p(side*.31,-.03,1.12),.11,lin(shirt))
        beam(art,p(side*.31,-.03,1.12),p(side*.35,-.10,hand),.085,lin(0xC79E84))


def hotel(k,art):
    point,h=frame(k,6138)
    cream,slate,glass,trim=map(lin,(0xE1DBCA,0x505555,0x4C6668,0xE8E4D2))
    art.box(point(0,-17,-.70),(22,9.2,6.6),h,cream)
    art.roof(point(0,-17,5.9),22.8,10,2.8,h,slate)
    art.box(point(-7,-12.6,-.42),(6.3,4.6,5.8),h,cream)
    art.roof(point(-7,-12.6,5.38),5.2,6.9,2.65,h+math.pi/2,slate)
    for u in (-8,-4,0,4,8):
        v=-10.26 if u==-8 else -12.32
        for z in (.42,3.34):
            art.box(point(u,v,z),(1.6,.15,1.52),h,trim)
            art.box(point(u,v+.09,z+.1),(1.39,.12,1.32),h,glass)
            art.box(point(u,v+.16,z+.1),(.075,.05,1.30),h,trim)
    for u in (-7,6):
        art.box(point(u,-17,7.1),(1.05,.85,2.25),h,lin(0x8C7767))
    art.box(point(0,-12.12,2.19),(9.7,.22,.85),h,lin(0x343E35))
    for row in range(4):
        v=8.9+row*.95;z=row*.52
        art.box(point(-7,v,z-.16),(20,.91,.28),h,lin(0x706F66))
        for j in range(15):
            if k.rng.random()<.22:continue
            person(art,point,h,-16+j*1.25,v,z+.12,k.rng.choice((0x626779,0x946957,0x898C63,0x57758A)),j%4==0)
    for d in range(6020,6220,2):
        p=k.road.pos(d,3.74,-.06)
        art.box(p,(2.06,.48,.24),k.s[k.road.index(d)]['h'],lin(0xDADBCF if d%4 else 0x323933))
    for d in range(6120,6190,3):
        p=k.road.pos(d,-4.65,-.09);angle=k.s[k.road.index(d)]['h']
        art.box(p,(2.1,1.0,1.15),angle,lin(k.rng.choice((0xBB9960,0xB49A63,0xC1A66C))))
    marshal,_=frame(k,6121)
    person(art,marshal,h,0,5.4,0,0xF08035,True)


def grazing(k,art):
    for centre in (760,1740,1845,2235,2980,4400,5360,7130,7460):
        for j in range(k.rng.randrange(5,12)):
            d=centre+k.rng.uniform(-45,50)
            x,y,_=k.road.pos(d,k.rng.choice((-1,1))*k.rng.uniform(9,48))
            z=k.height_at(x,y)
            h=k.rng.uniform(0,math.tau)
            def pt(u,v,w):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
            fleece=lin(k.rng.choice((0xD6D2B6,0xD0CCB1,0xC9BEA6)))
            dark=lin(0x58544A)
            for u in (-.36,.35):
                for v in (-.19,.19): art.tube(pt(u,v,0),.055,.072,.46,dark,dark,5)
            def fleece_body(u0,v0,w0,long,wide,high,tint):
                rings=[]
                for pos,scale in ((-1,.23),(-.72,.8),(0,1),(.68,.87),(1,.24)):
                    ring=[]
                    for n in range(8):
                        angle=n*math.tau/8
                        ring.append(pt(u0+pos*long,v0+math.cos(angle)*wide*scale,w0+math.sin(angle)*high*scale))
                    rings.append(ring)
                shade=tuple(value*.77 for value in tint[:3])+(1,)
                for a,b in zip(rings,rings[1:]):
                    for n in range(8):
                        q=(n+1)%8
                        art.face((a[n],b[n],b[q],a[q]),(shade if n>=4 else tint,)*4)
                for cap in (rings[0],rings[-1]):art.face(cap,(tint,)*8)
            fleece_body(0,0,.62,.60,.29,.30,fleece)
            fleece_body(.54,0,.42,.18,.14,.18,dark)
            for side in (-1,1):art.box(pt(.49,side*.15,.53),(.11,.15,.065),h,fleece)
    x,y,_=k.road.pos(3180,820)
    for off,high in ((0,17),(23,11)):
        base=k.height_at(x+off,y)
        art.tube((x+off,y,base),.7,.24,high,lin(0x696D6B),lin(0x969A98),6)


def add(k,art):
    lower_lanes(k,art)
    railway(k,art)
    footbridge(k,art)
    hotel(k,art)
    grazing(k,art)
    # A single tidal surface east of the fell, hidden wherever the land rises above sea level.
    shade=lin(0x819FA7)
    corners=((6000,-4900,0),(13500,-4900,0),(13500,1250,0),(6000,1250,0))
    art.face(corners,(shade,)*4)


def lower_lanes(k, art):
    """Fieldstone boundaries, wind-shaped hawthorn and ash on the approach below the open fell."""
    rng = k.rng
    def crown(x, y, z, rx, ry, rz, tint):
        sides = 8
        rings = []
        angle = rng.random() * math.tau
        for radius, up in ((.54,-.74),(1,-.13),(.84,.42),(.4,.86)):
            ring = []
            for j in range(sides):
                a = angle + math.tau*j/sides
                reach = radius*rng.uniform(.85,1.12)
                ring.append((x+math.cos(a)*rx*reach, y+math.sin(a)*ry*reach, z+rz*(up+rng.uniform(-.13,.13))))
            rings.append(ring)
        for level,(lower,upper) in enumerate(zip(rings,rings[1:])):
            for j in range(sides):
                q=(j+1)%sides
                shade=(.72+.08*level)*rng.uniform(.94,1.07)
                c=tuple(value*shade for value in tint[:3])+(1,)
                art.face((lower[j],lower[q],upper[q],upper[j]),(c,c,tint,tint))
        art.face(rings[-1],(tint,)*sides)
    for d in range(-28,1360,6):
        for side in (-1,1):
            if (410<d<650 and side==1) or (710<d<900 and side==-1):continue
            p=k.road.pos(d,side*5.6);z=k.height_at(p[0],p[1])
            tint=lin(rng.choice((0x65704C,0x647548,0x747650,0x65794D)))
            crown(p[0],p[1],z+.77,3.7,1.85,.98,tint)
            if rng.random()>.36:continue
            x,y,_=k.road.pos(d+rng.uniform(-2,2),side*rng.uniform(8,16))
            z=k.height_at(x,y)
            height=rng.uniform(4.7,8.5)
            wood=lin(0x675F4E)
            art.tube((x,y,z),.20,.10,height*.59,wood,wood,7)
            for j in range(4):
                a=j*math.tau/4+rng.uniform(-.4,.4)
                branch=height*rng.uniform(.16,.36)
                tip=(x+math.cos(a)*branch,y+math.sin(a)*branch,z+height*rng.uniform(.63,.89))
                beam(art,(x,y,z+height*.36),tip,.18,wood)
                crown(*tip,height*.33,height*.29,height*.24,lin(rng.choice((0x586C48,0x597247,0x64794D,0x70804F))))
