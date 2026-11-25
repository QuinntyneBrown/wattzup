"""Indianapolis Motor Speedway, three measured laps on one physical oval."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from worldkit import Painted, lin, smooth

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


LAP = 4000
TURN = 225 * math.pi / 2
CHUTE = (LAP - 2000 - 4 * TURN) / 2
SECTIONS = ((500,0),(TURN,1/225),(CHUTE,0),(TURN,1/225),(1000,0),
            (TURN,1/225),(CHUTE,0),(TURN,1/225),(500,0))
HALF = 10.1


def station(d):
    """Plan position, tangent and crossfall. The bricks close the lap on the front straight."""
    d %= LAP
    x=y=h=0.
    for length,curve in SECTIONS:
        u=min(d,length)
        if curve:
            end=h+curve*u
            x+=(math.sin(end)-math.sin(h))/curve
            y+=(math.cos(h)-math.cos(end))/curve
            h=end
        else:
            x+=u*math.cos(h);y+=u*math.sin(h)
        if d<=length:
            bank=math.tan(math.radians(9))*smooth(0.,1.,min(u,length-u)/34) if curve else 0.
            return x,y,h,bank
        d-=length
    return 0.,0.,0.,0.


def pos(d,l,z=0):
    x,y,h,bank=station(d)
    return (x-l*math.sin(h),y+l*math.cos(h),2.5-l*bank+z)


def route(config,theme,bc):
    stages=bc.stages(config['plan']);length=stages[-1]['to'];points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h,bank=station(d)
        points.append(dict(d=d,x=x,y=y,z=2.5,h=h,k=0,g=0))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return points,stages,length,mean,0


def land(road,col,theme,bc):
    b=bc.Builder('Infield and grounds','terrain');b.colours=[]
    for x in range(-1320,1320,80):
        for y in range(-560,1400,80):
            b.quad((x,y,.02),(x+80,y,.02),(x+80,y+80,.02),(x,y+80,.02))
            b.colours.extend([lin(0x669040 if (x//80+y//80)%4 else 0x719B47)]*4)
    return b.build(col),lambda *_:.02


def roadway(road,st,length,col,bc):
    b=bc.Builder('Road','terrain');b.colours=[]
    def strip(d,end,l,r,z,tint):
        b.quad(pos(d,l,z),pos(end,l,z),pos(end,r,z),pos(d,r,z))
        b.colours.extend([lin(tint)]*4)
    for d in range(0,LAP,4):
        for l,r,tint in ((-12,-10,0x8C8983),(-10,-6,0x66686A),(-6,-4,0x606264),(-4,-1.7,0x606163),(-1.7,-1,0x5E6062),(-1,2,0x626465),(2,6,0x636568),(6,10,0x6A6C6D),(10,13,0x858582)):
            strip(d,d+4,l,r,0,tint)
        for edge in (-9.8,9.8):strip(d,d+4,edge,edge+.13,.012,0xEBE9DF)
        if d>3450 or d<470:
            strip(d,d+4,12.8,23,.005,0x999995)
            strip(d,d+4,12.1,12.32,.023,0xD9BE51)
            if d%16==0:strip(d,d+3,18,18.15,.021,0xFAF8EB)
        if station(d)[3]>.05:
            strip(d,d+4,9.82,11,.023,0xCAC8BA if d%16<8 else 0x9C4142)
    for row in range(4):
        for j in range(82):
            l=-10.2+j*.25+(row%2)*.125
            strip(-.45+row*.225,-.24+row*.225,l,l+.235,.047,(0x99533B,0xAF6247,0x814936,0xAA6852)[(j*7+row)%4])
    b.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':HALF,'terrain':{},
       'land':{'mid':0x78994E},'sky':[0xD6E1E8,0xA3C9E7,0x78ABD3,0x568DBF,0x477BB1],
       'haze':0xBECCD5,'light':[0xFFEBCE,2.9],'fill':[0xD6E5F7,0xCAD1B2],
       'sun_azimuth':.82,'sun_altitude':.80,'chunks':{'Land':1}}


def place(art,d,l,z,size,col):
    art.box(pos(d,l,z),size,station(d)[2],lin(col))


def wall_and_fence(art):
    for d in range(0,LAP,8):
        a,b=pos(d,-11.2),pos(d+8,-11.2)
        for z,width,height,col in ((.6,.48,1.23,0xE9E7DD),(.31,.08,.12,0xB4B8B4),(.78,.06,.1,0xB9BDB8)):
            left=.22 if width<.1 else 0
            beam(art,pos(d,-11.2+left,z),pos(d+8,-11.2+left,z),width,height,lin(col))
        beam(art,pos(d,-11.5,1.14),pos(d,-11.85,5.72),.1,.1,lin(0x586367))
        beam(art,pos(d,-11.85,5.7),pos(d,-10.9,6.4),.09,.09,lin(0x586367))
        for l,z in ((-11.6,2.15),(-11.7,3.32),(-11.8,4.52),(-11.85,5.66),(-10.9,6.37)):
            beam(art,pos(d,l,z),pos(d+8,l,z),.032,.032,lin(0x738081))
        if d<520 or d>3470:
            for v in range(0,8,2):
                beam(art,pos(d+v,-11.7,1.4),pos(d+v+3,-11.8,5.5),.023,.023,lin(0x839093))


def grandstand(art,d,rng,inside=False):
    side=1 if inside else -1
    base=29 if inside else 17
    for level in range(2):
        for row in range(6):
            l=side*(base+level*9+row*1.28)
            z=.85+level*8+row*.84
            place(art,d,l,z,(23.9,1.40,.39),0x969C9C)
            for seat in range(15):
                u=d-11+seat*1.53+rng.uniform(-.22,.22)
                shirt=rng.choice((0xBE3837,0x536E8B,0xE3D7B7,0xD3AD43,0x7B8E89,0x374853,0xC37458))
                # Three-quarter facing cards give even the far section distinct necks,
                # sleeves and heads, with fewer faces than cuboid crowds.
                hue=lin(shirt);skin=lin(rng.choice((0xC79674,0x926850,0xC4AB86,0xAD805D)))
                height=rng.uniform(.9,1.13);lean=rng.uniform(-.12,.12)
                def at(a,h):
                    return pos(u+a*.79+lean*h,l+a*.55*side,z+.37+h*height)
                def card(outline,col):
                    pts=[at(a,h) for a,h in outline]
                    normal=(pts[1][0]-pts[0][0])*(pts[2][2]-pts[0][2])-(pts[1][2]-pts[0][2])*(pts[2][0]-pts[0][0])
                    if (normal>0) != (side>0):pts.reverse()
                    art.face(pts,(col,)*len(pts))
                card([(-.27,0),(.25,0),(.36,.5),(.21,.7),(-.19,.7),(-.35,.52)],hue)
                card([(-.14,.7),(.10,.69),(.165,.85),(.10,1.0),(-.12,1.0),(-.17,.87)],skin)
                if seat%4==0:card([(-.17,.94),(.20,.95),(.10,1.06),(-.11,1.08)],lin(0x333B40))
    place(art,d,side*(base+11),15.85,(24.2,23.6,.36),0xB9BDC0)
    face=[pos(d+a,side*(base+11)+b,15.84) for a,b in ((-12,-11.8),(-12,11.8),(12,11.8),(12,-11.8))]
    art.face(face,(lin(0x7D8584),)*4)
    for off in (-11,11):
        beam(art,pos(d+off,side*(base+19),.2),pos(d+off,side*(base+19),15.86),.24,.25,lin(0x777F80))
        beam(art,pos(d+off,side*(base+19),11.9),pos(d+off,side*(base+1),15.80),.17,.18,lin(0x757F82))


def pagoda(art):
    x,y,_=pos(38,53)
    art.box((x,y,1.1),(41,27,9),0,lin(0xCCC8B9))
    for floor in range(9):
        z=9+floor*3.85;w=39-floor*2;deep=25-floor*1.15
        art.box((x,y,z),(w,deep,3.3),0,lin(0x487582))
        for u in range(-int(w/2)+2,int(w/2),4):
            art.box((x+u,y-deep/2-.05,z),(.18,.22,3.26),0,lin(0xC3C9BF))
        art.box((x,y,z+3.25),(w+5.4,deep+4.6,.64),0,lin(0xD9D7CB))
        art.box((x,y,z+3.14),(w+4.1,deep+3.3,.20),0,lin(0x626D6E))
    for i in (-1,0,1):art.tube((x+i*5,y,43),.11,.07,6+(i==0)*3,lin(0x7D8384),lin(0xCACBC4),6)


def scenery(k):
    art=Painted(k);rng=k.rng
    wall_and_fence(art)
    for start,end,inside in ((-535,505,False),(504,855,False),(3010,3451,False),(-395,-155,True)):
        for d in range(start,end,24):grandstand(art,d,rng,inside)
    pagoda(art)
    for d in range(-380,395,12):
        place(art,d,24,.2,(11.96,.43,1.25),0xD5D4CB)
        if d%24==4:
            place(art,d,31,1,(9,6,3.3),0xB7B8B4)
            place(art,d,31,4.25,(10.2,7,.35),0x8E999D)
            place(art,d,27.93,1.12,(6.5,.15,2.7),rng.choice((0x87423D,0x536D81,0xAEA797)))
    # A narrow numbered pylon stands beside the pits. The positions face the approaching rider.
    p=pos(-62,16.7);art.box(p,(2.4,3.3,28),0,lin(0x333D40))
    for j in range(10):
        z=p[2]+26.4-j*2.49
        words(art,str(j+1),(p[0]-1.26,p[1],z),(0,-1,0),(0,0,1),1.48,2.5,0xFDE7B1)
        art.box((p[0],p[1],z-.38),(2.47,3.47,.11),0,lin(0x94968D))
    place(art,0,-12.9,4.1,(5,4,2.2),0xE2DED1)
    place(art,0,-12.2,6.3,(5.8,5,.31),0x525B5D)
    for d in range(80,360,80):place(art,d,-16,6.4,(.95,.6,.51),0x4B5356)
    # Elliptical fairways and sand traps sit behind the infield's low museum.
    for i in range(14):
        x=-560+(i%7)*170;y=160+(i//7)*304+35*math.sin(i)
        for dx,dy,l,w,col,z in ((0,0,66,27,0x85AA59,.09),(36,15,16,8,0xD7C79C,.13)):
            centre=(x+dx,y+dy,z)
            for j in range(20):
                def edge(q):return (centre[0]+l*math.cos(q*math.tau/20),centre[1]+w*math.sin(q*math.tau/20),z)
                art.face((centre,edge(j),edge(j+1)),(lin(col),)*3)
    for x in range(-400,420,22):
        for y in (132,538):
            h=rng.uniform(4.6,8.9)
            art.tube((x,y,.03),.29,.24,h*.7,lin(0x796A50),lin(0x817663),6)
            art.tube((x,y,h*.48),2.1,2.8,h*.4,lin(0x4E7642),lin(0x668949),7)
            art.tube((x,y,h*.86),2.8,.52,h*.43,lin(0x668949),lin(0x78994E),7)
    x,y,_=pos(1850,55);art.box((x,y,.1),(90,26,6.8),0,lin(0xD9D7CA))
    art.box((x,y,6.6),(94,29,.5),0,lin(0xA0A8A9))
    for u in range(-40,42,6):art.box((x+u,y+13.12,1),(4.8,.12,4.8),0,lin(0x506F79))
    for d in (420,1460,2420,3400):
        place(art,d,-13,2.3,(.4,1.5,1.8),0xD7CDC0)
    return {'efforts':0}
