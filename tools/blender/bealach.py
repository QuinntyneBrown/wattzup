"""The Applecross single-track road above Loch Kishorn."""
import math
from functools import lru_cache

import bpy
from mathutils import Vector, kdtree
from worldkit import Painted, lin, smooth

HAIRPINS = ((6810, 1), (7090, -1), (7350, 1), (7620, -1))
HALF_WIDTH = 1.9


def bearing(d):
    sweep = .22 * math.sin(d / 320) + .15 * math.sin(d / 121)
    lower = sweep - .72 * math.exp(-((d-660)/137)**2)
    heading = lower * (1-smooth(6400, 6700, d)) + .24
    for start, direction in HAIRPINS:
        heading += direction * 2.89 * smooth(start, start+76, d)
    return heading - 1.64 * smooth(8250, 8810, d)


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    distances = [i*bc.STEP-bc.LEAD_IN for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1)]
    gentle, ramp = [], []
    for d in distances:
        stage = bc.stage_at(stages, max(0,min(length-.01,d)))
        grade = (3.8 + .42 * (stage['level']-12) + 1.1*math.sin(d/510))
        grade *= (.28+.72*smooth(250, 1000, d))*(1-.90*smooth(7850,8650,d))
        blend = max(math.exp(-((d-centre)/105)**4) for centre in (6920,7290,7510))
        gentle.append(grade*(1-blend))
        ramp.append(20*blend)
    # Preserve the 20% ramps while scaling the rest of the climb to the summit.
    ridden = [i for i,d in enumerate(distances) if 0<=d<length]
    scale = (62300 / bc.STEP - sum(ramp[i] for i in ridden))/sum(gentle[i] for i in ridden)
    x,y,z = -bc.LEAD_IN,0,3
    samples = []
    for i,d in enumerate(distances):
        g = gentle[i]*scale + ramp[i] if 0<=d<length else 0
        h = bearing(d)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=bearing(d+.5)-bearing(d-.5),g=g))
        mid=bearing(d+bc.STEP/2)
        x+=bc.STEP*math.cos(mid); y+=bc.STEP*math.sin(mid); z+=bc.STEP*g/100
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,.42


def layby(d):
    t = ((d-18)%307)-155
    return 2.5 * (1-smooth(6,22,abs(t)))


def road(road, stages, length, col, bc):
    t=bc.Builder('Single track and passing places','asphalt')
    rough=bc.Builder('Mended patches and central grass','terrain');rough.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d']; end=road.s[i+1]['d']
        t.quad(road.at(i,-HALF_WIDTH),road.at(i+1,-HALF_WIDTH),road.at(i+1,HALF_WIDTH+layby(end)),road.at(i,HALF_WIDTH+layby(d)))
        def strip(a,b,shade):
            rough.quad(road.at(i,a,.014),road.at(i+1,a+.035,.014),road.at(i+1,b,.014),road.at(i,b-.026,.014))
            rough.colours.extend((lin(shade),)*4)
        if math.sin(d*.26)+.64*math.sin(d*.79)>.76:
            strip(-.11,.09+.08*math.cos(d*.32),0x75805F)
        if math.sin(d*.13)+math.sin(d*.052)>1.42:
            a=-1.33+.42*math.sin(d*.35);strip(a,a+.58,0x484846)
    t.build(col);rough.build(col)


def land(road,col,theme,bc):
    samples=road.s[::16]
    tree=kdtree.KDTree(len(samples))
    for i,p in enumerate(samples):tree.insert((p['x'],p['y'],0),i)
    tree.balance()
    def height(x,y):
        near=tree.find_n((x,y,0),8)
        weighted=total=0
        for _,i,r in near:
            p=samples[i]
            factor=1/(36+r*r)**1.55
            weighted+=factor*(p['z']+.41*(y-p['y']))
            total+=factor
        _,j,r=road.tree.find((x,y,0))
        p=road.s[j]
        shape=(7*math.sin(x/79+y/55)+4*math.cos(y/21-x/46))*smooth(13,95,r)
        return weighted/total+shape-2.6*(1-smooth(16,46,r))
    b=bc.Builder('Heather moor and corrie','terrain');b.colours=[]
    cells=set()
    for p in road.s[::12]:
        gx,gy=int(p['x']//22),int(p['y']//22)
        for dx in range(-11,12):
            for dy in range(-15,16):cells.add((gx+dx,gy+dy))
    @lru_cache(maxsize=None)
    def vertex(ix,iy):
        x,y=22*ix,22*iy
        z=height(x,y)
        colour=moor_colour(x,y,z)
        return (x,y,z),lin(colour)
    for ix,iy in sorted(cells):
        corners=[vertex(ix+dx,iy+dy) for dx,dy in ((0,0),(1,0),(1,1),(0,1))]
        b.quad(*(v for v,c in corners));b.colours.extend(c for v,c in corners)
    # Continuous shoulders meet the tarmac; the wider mesh falls below the cut.
    for i in range(len(road.s)-1):
        for side in (-1,1):
            corners=[]
            for j,w in ((i,.1),(i+1,.1),(i+1,1),(i,1)):
                d=road.s[j]['d'];l=side*(HALF_WIDTH+(layby(d) if side==1 else 0)+7*w-.85)
                x,y,z=road.at(j,l)
                blend=smooth(.12,1,w)
                corners.append((x,y,z-.10+blend*(height(x,y)-z+.38)))
            if side<0:corners.reverse()
            b.quad(*corners);b.colours.extend((lin(moor_colour(*corners[0])),)*4)
    sea=bc.Builder('Loch Kishorn and Inner Sound','sea')
    sea.quad((-12000,-12000,0),(20000,-12000,0),(20000,2000,0),(-12000,2000,0));sea.build(col)
    return b.build(col),height


def moor_colour(x,y,z):
    t=math.sin(x/64+y/39)+.65*math.cos(y/24-x/38)+.38*math.sin(y/11+x/17)
    if z>460 and t>1:return 0x857F75
    if t>.83:return 0x846E79
    if t<-.85:return 0x977957
    return 0x8B8A67 if t>0 else 0x767E59


THEME={'lay':route,'land_builder':land,'road_builder':road,'road_half_width':HALF_WIDTH,
       'land':{'mid':0x80825D},'terrain':{'sea':True},'wet':.45,
       'sky':[0xCFD0C6,0xABB6BC,0x96A6B2,0x84949F,0x687A89],'haze':0xA6B1AC,
       'light':[0xF3E2C1,2.5],'fill':[0xC6D2DB,0x8C846D],'sun_azimuth':-.8,'sun_altitude':.34,
       'palette':{'asphalt':0x565658}}

@lru_cache(maxsize=96)
def lettering(text):
    """Original raised sign lettering as triangles. The exported course needs no font."""
    curve=bpy.data.curves.new("Sign master","FONT")
    curve.body=text
    curve.align_x="CENTER"
    curve.resolution_u=2
    obj=bpy.data.objects.new("Sign master",curve)
    bpy.context.scene.collection.objects.link(obj)
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        triangles=[tuple(tuple(mesh.vertices[v].co[:2]) for v in t.vertices) for t in mesh.loop_triangles]
        width=max(x for tri in triangles for x,y in tri)-min(x for tri in triangles for x,y in tri)
        return triangles,width
    finally:
        evaluated.to_mesh_clear()
        bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.curves.remove(curve)


def words(b,text,origin,right,up,size,max_width,tint):
    triangles,width=lettering(text)
    scale=min(size,max_width/width)
    col=lin(tint)
    for tri in triangles:
        points=[tuple(origin[k]+scale*(x*right[k]+y*up[k]) for k in range(3)) for x,y in tri]
        b.face(points,(col,)*3)


def beam(art,a,b,width,height,colour):
    start,end=Vector(a),Vector(b);axis=(end-start).normalized()
    across=axis.cross(Vector((0,0,1)))
    if across.length<.001:across=Vector((1,0,0))
    across.normalize();up=across.cross(axis).normalized()
    rim=[width*.5*u*across+height*.5*v*up for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for j in range(4):
        n=(j+1)%4
        art.face((start+rim[j],end+rim[j],end+rim[n],start+rim[n]),(colour,)*4)


def sign(k,art,d,kind):
    l=5.7 if kind=='passing' else -3.8
    x,y,z=k.road.pos(d,l);h=bearing(d)
    top=z+(2.12 if kind=='passing' else 2.6)
    right=(math.sin(h),-math.cos(h),0);front=(-math.cos(h),-math.sin(h),0)
    def pt(a,b,off=0):
        return(x+right[0]*a+front[0]*off,y+right[1]*a+front[1]*off,top+b)
    for a in ((0,) if kind=='passing' else (-.97,.97)):
        art.tube(pt(a,-3.3),.047,.047,3.5,lin(0x70777A),lin(0xA7A9A0),7)
    if kind=='passing':
        for off,size,tint in ((0,.62,0xE7E8E0),(.012,.55,0x405F75)):
            points=[pt(0,size,off),pt(size,0,off),pt(0,-size,off),pt(-size,0,off)]
            art.face(points,(lin(tint),)*4);art.face(points[::-1],(lin(tint),)*4)
        for txt,b in (('PASSING',.05),('PLACE',-.14)):words(art,txt,pt(0,b,.025),right,(0,0,1),.16,.85,0xF0EFE4)
    else:
        tint=lin(0xE1DBBC);corners=[pt(-1.38,-.86),pt(1.38,-.86),pt(1.38,.67),pt(-1.38,.67)]
        art.face(corners,(tint,)*4);art.face(corners[::-1],(tint,)*4)
        for txt,b,size in (('BEALACH NA BA',.37,.26),('ROAD TO APPLECROSS',.08,.19),('NOT ADVISED FOR',-.22,.16),('LEARNER DRIVERS',-.47,.18),('OR CARAVANS',-.72,.18)):
            words(art,txt,pt(0,b,.018),right,(0,0,1),size,2.48,0x353C38)


def rock(art,x,y,z,r,h,phase,c):
    rings=[]
    for w,lift in ((1,-.28),(.87,.37),(.56,1)):
        rings.append([(x+w*r*math.cos(a+phase),y+w*r*.73*math.sin(a+phase),z+h*(lift+.1*math.sin(3*a+phase))) for a in [j*math.tau/7 for j in range(7)]])
    for row in range(2):
        for j in range(7):
            n=(j+1)%7
            points=(rings[row][j],rings[row][n],rings[row+1][n],rings[row+1][j])
            base=lin(c); t=.66+.15*row+.12*math.sin(j+phase)
            art.face(points,((base[0]*t,base[1]*t,base[2]*t,1),)*4)
    art.face(rings[-1],(lin(c),)*7)


def islands(k):
    art=Painted(k,'peaks')
    for row,(cy,base,amplitude) in enumerate(((-4100,175,73),(-6500,245,310))):
        for j in range(76):
            def at(i):
                x=-2800+i*190
                surface=abs(math.sin(i*.57)+.43*math.sin(i*1.68)) if row else .42+.38*math.sin(i*.26)+.16*math.cos(i*.71)
                return x,cy+190*math.sin(i*.27+row),base+amplitude*surface
            a,b=at(j),at(j+1)
            art.face(((a[0],a[1]+260,-14),(b[0],b[1]+260,-14),b,a),(lin(0x8C9B9D),lin(0x8C9B9D),lin(0x748891),lin(0x758991)))


def scenery(k):
    art=Painted(k);rng=k.rng;islands(k)
    for d in range(173,9000,307):sign(k,art,d,'passing')
    sign(k,art,96,'warning')
    for d in (117,1810,5370,8400):
        for j in range(11):
            a=k.road.pos(d+j*.16,-1.9,.026);b=k.road.pos(d+j*.16,1.9,.026)
            beam(art,a,b,.089,.085,lin(0x828983))
    for base in (40,440,1640,3050,5370):
        for i in range(76):
            d=base+i*1.01;x,y,z=k.road.pos(d,3.47)
            for j in range(2):
                rock(art,x+.32*j,y,z-.19+j*.34,.65,.52,rng.uniform(0,6),rng.choice((0x8A8379,0x94877B,0x7C776B)))
        for j in range(27):
            d=base+90+j*3.8;x,y,z=k.road.pos(d,3.63)
            art.box((x,y,z-.21),(.14,.15,1.28),bearing(d),lin(0x857767))
            for h in (.44,.87):beam(art,(x,y,z+h),k.road.pos(d+3.8,3.63,h),.025,.025,lin(0x74776A))
    for base in (210,690,1180):
        for j in range(8):
            x,y,_=k.road.pos(base+37*(j%4),-74-45*(j//4))
            for a in range(20):
                t=a*math.tau/20;u=(a+1)*math.tau/20
                beam(art,(x+13*math.cos(t),y+13*math.sin(t),.42),(x+13*math.cos(u),y+13*math.sin(u),.42),.52,.57,lin(0x455E60))
                if a%4==0:art.tube((x+13*math.cos(t),y+13*math.sin(t),.4),.27,.25,.47,lin(0x9B6750),lin(0xB98766),7)
    for d in range(180,8900,9):
        l=rng.choice((-1,1))*rng.uniform(3.1,18);x,y,z=k.road.pos(d,l)
        if abs(l)>8:z=k.height_at(x,y)
        phase=rng.uniform(0,6)
        if d>6200 and rng.random()<.54:rock(art,x,y,z-.26,rng.uniform(.45,2.7),rng.uniform(.45,1.7),phase,rng.choice((0x897D72,0x967D70,0x887B74)))
        else:
            for j in range(4):
                a=phase+j*1.47;u=x+j*.23*math.cos(a);v=y+j*.23*math.sin(a)
                tint=lin(rng.choice((0x916D86,0x827487,0x967A5E,0x9A8A61)))
                art.face(((u-.25,v,z-.11),(u+.27,v+.09,z-.15),(u+.18*math.cos(a),v+.19*math.sin(a),z+.43)),(tint,)*3)
    # Torridonian sandstone beds stack behind the upper staircase.
    for i in range(62):
        x,y,_=k.road.pos(6950+i*9,86+14*math.sin(i/7))
        if not k.road.clear_of_road(x,y,38,k.road.index(6950+i*9)):continue
        z=k.height_at(x,y)
        for layer in range(4):
            rock(art,x,y+3.6*layer,z+layer*9,18-layer*1.7,13.5,rng.uniform(0,.4),[0x84746D,0x927C73,0x84726F,0xA18B7F][layer])
    return {'efforts':0}
