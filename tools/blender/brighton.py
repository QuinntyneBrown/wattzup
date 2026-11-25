"""Brighton Pride on Madeira Drive, returning along the upper Regency seafront."""
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


LAP=13075/3
RADIUS=37.
STRAIGHT=LAP/2-math.pi*RADIUS
PALETTE=(0xC74653,0xE58950,0xF1CC53,0x438967,0x4A84B2,0x845D98)


def station(d):
    t=d%LAP;turn=math.pi*RADIUS
    if t<STRAIGHT:x,y,h=t,0,0
    elif t<STRAIGHT+turn:
        a=(t-STRAIGHT)/RADIUS;x,y,h=STRAIGHT+RADIUS*math.sin(a),RADIUS*(math.cos(a)-1),-a
    elif t<2*STRAIGHT+turn:x,y,h=2*STRAIGHT+turn-t,-2*RADIUS,-math.pi
    else:
        a=(t-2*STRAIGHT-turn)/RADIUS;x,y,h=-RADIUS*math.sin(a),-RADIUS*(1+math.cos(a)),-math.pi-a
    z=4.25+12.4*smooth(STRAIGHT-100,STRAIGHT+turn+85,t)*(1-smooth(LAP-turn-96,LAP,t))
    return x,y,z,h


def route(config,theme,bc):
    stages=bc.stages(config['plan']);length=stages[-1]['to'];points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z,h=station(d)
        g=(station(d+1)[2]-station(d-1)[2])*.5
        points.append(dict(d=d,x=x,y=y,z=z,h=h,k=0,g=g))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return points,stages,length,mean,0


def place(d,l,z=0):
    x,y,h,a=station(d)
    return x-l*math.sin(a),y+l*math.cos(a),h+z


def land(road,col,theme,bc):
    ground=bc.Builder('Cliff and shingle beach','terrain');ground.colours=[]
    for x in range(-240,2600,8):
        edge=1- max(smooth(-25,95,x)*(1-smooth(STRAIGHT-120,STRAIGHT+12,x)),0)
        level=16.48-12.35*edge
        for left,right,za,zb,colour in ((-280,-20,level,level,0xACAD96),(-20,-16,level,4.14,0xAD9481),(-16,15.8,4.14,4.14,0xBCB4A6),(15.8,22,4.14,3.21,0xAB9D88),(22,43,3.21,1.78,0xA7917F),(43,60,1.78,.28,0x998575),(60,68,.28,-.65,0x8C8173)):
            def point(u,l,z):
                jitter=.30*math.sin(u/51)+.14*math.sin(u/13) if l>=22 else 0
                return u,l+jitter,z
            ground.quad(point(x,left,za),point(x+8,left,za),point(x+8,right,zb),point(x,right,zb))
            cols=lin(colour);tone=1+(.07*math.sin(x*1.43) if left>=22 else 0)
            ground.colours.extend([(cols[0]*tone,cols[1]*tone,cols[2]*tone,1)]*4)
    sea=bc.Builder('English Channel','sea')
    sea.quad((-6300,56,0),(10200,56,0),(10200,11600,0),(-6300,11600,0));sea.build(col)
    return ground.build(col),lambda *_:0


def roadway(road,st,length,col,bc):
    bed=bc.Builder('Road','asphalt');paint=bc.Builder('Seafront markings','terrain');paint.colours=[]
    for q in range(math.ceil(LAP/4)):
        a=q*4;b=min(a+4,LAP)
        bed.quad(place(a,-6.8),place(b,-6.8),place(b,6.8),place(a,6.8))
        if q%4==0:
            paint.quad(place(a,-1.65,.025),place(b,-1.65,.025),place(b,-1.52,.025),place(a,-1.52,.025))
            paint.colours.extend([lin(0xEAE6D9)]*4)
        for l in (-6.15,6.15):
            for stripe in (0,.19):
                v=l+stripe
                paint.quad(place(a,v,.026),place(b,v,.026),place(b,v+.09,.026),place(a,v+.09,.026))
                paint.colours.extend([lin(0xDEBC64)]*4)
    bed.build(col);paint.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':6.8,'terrain':{'sea':True},
       'land':{'mid':0xA8A394},'sky':[0xCFDDE1,0xAFD1E0,0x8AB5D1,0x649AC2,0x5588B9],
       'haze':0xC7D5D7,'light':[0xFFF1DA,3.1],'fill':[0xD8E5E9,0xB2AD9B],
       'sun_azimuth':-.71,'sun_altitude':.79,'palette':{'asphalt':0x777679,'sea':0x588F90},'chunks':{'Land':1}}


def box(a,x,y,z,l,w,h,col):a.box((x,y,z),(l,w,h),0,lin(col))


def arcade(art):
    iron=0x4F786D;light=0x84A698
    for x in range(160,1440,8):
        for y in (-13.4,-18.6):
            art.tube((x,y,4.16),.27,.19,5.7,lin(iron),lin(light),8)
        box(art,x,-13.4,4.16,.73,.63,.42,iron)
        box(art,x,-13.4,9.32,.85,.66,.35,light)
        for i in range(10):
            def spring(j):
                q=math.pi*(1-j/10)
                return (x+4+3.95*math.cos(q),-13.4,7.63+2.97*math.sin(q))
            beam(art,spring(i),spring(i+1),.28,.28,lin(iron))
        box(art,x+4,-16.2,10.72,8.04,6.1,.43,iron)
        for j in range(8):box(art,x+j+.2,-13.22,11.12,.073,.074,1.2,light)
        box(art,x+4,-13.22,12.27,8.03,.16,.15,light)
    x=508
    box(art,x,-15.1,4.12,7.6,6.1,10.6,0x917662)
    for j in (-3,0,3):box(art,x+j,-11.98,7.2,.68,.2,5.2,0x527D76)
    box(art,x,-15.1,14.62,8.5,6.8,.43,0x557469)
    box(art,x,-15.1,15.03,6.2,4.8,3.0,0xC2AF8D)
    art.roof((x,-15.1,18.1),8,6.1,3.45,0,lin(0x536E71))


def pier(art):
    x=1885
    for y in range(10,413,8):
        for u in (-4,4):
            art.tube((x+u,y,-.4),.22,.19,5.46,lin(0x504D47),lin(0x555C5A),7)
        beam(art,(x-4,y,.8),(x+4,y,4.9),.17,.15,lin(0x5C625F))
        box(art,x,y+4,4.96,11,8.08,.53,0x756B61)
        for side in (-1,1):
            box(art,x+side*5.2,y+4,6.30,.12,8.02,.12,0xE2DECC)
            for j in (0,2,4,6):box(art,x+side*5.2,y+j,5.5,.10,.10,.9,0xD4D3C4)
    for y,l,w in ((23,17,12),(80,46,17),(218,75,26)):
        box(art,x,y,5.45,w,l,4.8,0xECE6D4)
        for j in range(-int(l/2)+2,int(l/2)-1,4):
            box(art,x-w/2-.08,y+j,7.0,.16,2.52,2.46,0x77979B)
        art.roof((x,y,10.25),l+2,w+1.8,2.0,math.pi/2,lin(0xA79682))
        for u in (-1,1):
            for v in (-1,1):
                at=(x+u*w*.46,y+v*l*.43,9.95)
                art.tube(at,1.65,1.65,2.0,lin(0xE3DECE),lin(0xF5EEDF),12)
                art.tube((at[0],at[1],11.95),1.90,1.35,1.05,lin(0x938973),lin(0xA79C87),12)
                art.tube((at[0],at[1],13),1.35,.06,1.47,lin(0xA79C87),lin(0xC0AF90),12)
    # The white sign arch and pavilion clock read from the road before the deck turns out to sea.
    for u in (-7,7):box(art,x+u,14,4.6,.38,.5,7.9,0xD8D7C8)
    box(art,x,14,11.72,14.5,.48,1.34,0x586F71)
    words(art,'PALACE PIER',(x,13.71,12.01),(1,0,0),(0,0,1),1.06,12.3,0xF3E8BF)
    for j in range(37):
        y=277+3.35*j
        def ride(q):return (x+5*math.sin(q/5),277+3.35*q,14+6.5*math.sin(q/4.1))
        if j%3==0:beam(art,(ride(j)[0],y,5.3),ride(j),.21,.21,lin(0xB8AB80))
        beam(art,ride(j),ride(j+1),.35,.23,lin(0xB59556))


def regency(art,rng):
    for x in range(110,1975,15):
        h=rng.choice((9.8,12.3,14.1));y=-88.7
        col=rng.choice((0xE2D7BC,0xE8DFC8,0xD3C8B2,0xDFD5C4))
        box(art,x,y,16.55,14.93,11.0,h,col)
        box(art,x,y,16.45+h,15.12,11.5,.53,0xECE5D3)
        for dx in (-4.6,0,4.6):
            box(art,x+dx,y+5.72,16.8,3.15,1.14,h*.68,0xDFD3BE)
            for j in range(round(h/3)):
                box(art,x+dx,y+6.32,17.65+j*2.88,1.73,.12,1.61,0x697C83)
                box(art,x+dx,y+6.43,17.53+j*2.88,1.98,.22,.16,0xEFE6D3)
        box(art,x+5,y,16.8+h,1,.95,1.7,0x998273)


def scenery(k):
    art=Painted(k);rng=k.rng
    arcade(art);pier(art);regency(art,rng)
    # Two running rails, sleepers and a low open-sided station above the shingle.
    for x in range(90,1700,8):
        for l in (18.1,19):box(art,x+4,l,3.72,8.03,.074,.12,0x716E69)
        for j in range(0,8,1):box(art,x+j,18.55,3.61,.17,1.53,.13,0x75685C)
    for x in range(1262,1291,5):
        for l in (16.4,20.6):box(art,x,l,3.86,.15,.15,2.87,0x507765)
    art.roof((1276.5,18.5,6.72),34,5.6,1.0,0,lin(0x728982))
    for x in range(80,2020,80):
        for y in range(32,81,3):
            box(art,x,y,.1,.31,3.07,max(.35,4.3-(y-32)*.078),0x735F4D)
    for i in range(2900):
        x=rng.uniform(0,STRAIGHT);y=rng.uniform(25,54);z=3.21-(y-22)*.073
        a=rng.uniform(.085,.31)
        pts=((x-a,y,z+.08),(x,y-a*.74,z+.12),(x+a,y,z+.11),(x,y+a*.83,z+.10))
        art.face(pts,(lin(rng.choice((0xB8A69B,0x8F8078,0xB0A398,0xBEB2A5))),)*4)
    for x in range(20,int(STRAIGHT),23):
        for y in (-8.5,8.5):
            art.tube((x,y,4.17),.15,.085,6.72,lin(0x4E615F),lin(0x6D7A74),8)
            art.tube((x,y,10.88),.43,.22,.68,lin(0xE7DEC4),lin(0xF7EDD3),6)
            for j,tint in enumerate(PALETTE):
                col=lin(tint);z=9.72-j*.25
                for a in range(3):
                    def pt(q,b):return x+.56*q,y+.24*math.sin(q+x*.1),z+b-.09*q
                    face=(pt(a,0),pt(a+1,0),pt(a+1,-.25),pt(a,-.25))
                    art.face(face,(col,)*4)
    for x in range(30,1770,4):
        for l in (-6.98,7.05):
            box(art,x,l,4.35,3.91,.052,.075,0x9DA3A0)
            box(art,x,l,5.37,3.91,.085,.076,0xB5B8AC)
            for j in (-1.72,-.88,.02,.88,1.72):box(art,x+j,l,4.32,.055,.055,1.05,0x9EA8A4)
        if 465<x<1110 or x%12==2:
            for side in (-1,1):
                for j in range(2 if 465<x<1110 else 1):
                    u=x+rng.uniform(-1.8,1.7);l=side*rng.uniform(7.4,8.43)
                    h=rng.uniform(.9,1.12);skin=lin(rng.choice((0xBF936E,0x966C55,0xCEAA86,0x996D4F)))
                    box(art,u,l,4.23,.31,.24,.78*h,0x4E5B65)
                    shirt=lin(rng.choice((*PALETTE,0xCEC6B3,0x4E687F)))
                    art.tube((u,l,4.23+.75*h),.20,.265,.59*h,shirt,shirt,6)
                    art.tube((u,l,4.23+1.33*h),.14,.14,.30*h,skin,skin,7)
                    if j==0:art.tube((u,l,4.23+1.59*h),.15,.11,.11*h,lin(0x5C4C3E),lin(0x654F3D),7)
    x=2515;y=13
    art.tube((x,y,3.8),1.67,.79,143,lin(0x808480),lin(0x969C99),16)
    art.tube((x,y,92),7.3,9.1,2.7,lin(0x838786),lin(0xA6B9B6),24)
    art.tube((x,y,94.7),9.1,7.4,3.0,lin(0x8DA6AA),lin(0xC1CBC6),24)
    return {'efforts':0}
