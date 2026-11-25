"""A single 2.4 km sector of the Trouée d’Arenberg, from the old mine to the open forest."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from worldkit import Painted,lin,smooth

ENTRY=320
EXIT=2720


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def heading(d):
        if d<ENTRY:return .20*(1-smooth(-120,225,d))
        if d<=EXIT:return 0
        return .25*math.sin((d-EXIT)/490)*smooth(EXIT,EXIT+240,d)
    x,y,z=-bc.LEAD_IN,0,0
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        stage=bc.stage_at(stages,min(length-.001,max(0,d)))
        g=.19*(stage['level']-mean)+.52*math.sin(d/440)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(heading(d+1)-heading(d-1))/2,g=g))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*g/100
    return samples,stages,length,mean,.19


def terrain(road,col,theme,bc):
    b=bc.Builder('Forest floor','terrain');b.colours=[]
    sides=(-210,-45,-13,-5,-3,-2.15,2.15,3,5,13,45,210)
    heights=(.2,.02,.26,.12,-.10,-.10,-.10,-.10,.08,.18,.10,.15)
    colours=(0x73765E,0x616A50,0x616749,0x797651,0x6E614B,0x665B46,0x70634A,0x75694F,0x656B4C,0x667052,0x757B65)
    for i in range(0,len(road.s)-1,4):
        j=min(i+4,len(road.s)-1)
        for n in range(len(sides)-1):
            corners=((i,n),(j,n),(j,n+1),(i,n+1))
            b.faces.append(tuple(b.v(road.at(k,sides[r],heights[r])) for k,r in corners))
            for k,r in corners:
                tint=lin(colours[n])
                shade=.91+.08*math.sin(road.s[k]['d']/19+sides[r]*.31)
                b.colours.append(tuple(q*shade for q in tint[:3])+(1,))
    return b.build(col),lambda x,y:0


THEME={'lay':route,'land_builder':terrain,'terrain':{'sea':False},'land':{'mid':0x687253},'edge':'pave','kerbs':False,
       'wet':.28,'sky':[0xD9DCD8,0xCAD1D0,0xBCC9C9,0xAABABD,0x9AAFB4],'haze':0xCFD3CE,
       'light':[0xEEEBDF,2.65],'fill':[0xD9E2DE,0x879278],'sun_altitude':.60,'sun_azimuth':2.8,
       'palette':{'asphalt':0x696963,'sand':0x726047}}


def beam(art,a,b,width,tint):
    a,b=Vector(a),Vector(b);axis=(b-a).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01:side=Vector((1,0,0))
    side.normalize();up=axis.cross(side).normalized()
    offsets=[(side*u+up*v)*width*.5 for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for i in range(4):
        j=(i+1)%4
        art.face((a+offsets[i],b+offsets[i],b+offsets[j],a+offsets[j]),(tint,)*4)


def headframe(art,x,y,z,scale):
    steel,rust,roof=map(lin,(0x515C5D,0x80695F,0x667173))
    def pt(u,v,h):return (x+u*scale,y+v*scale,z+h*scale)
    for v in (-4.6,4.6):
        for u in (-6,6):
            beam(art,pt(u,v,0),pt(u*.48,v*.74,31),.63*scale,steel)
        beam(art,pt(17,v,0),pt(2,v*.75,29),.73*scale,steel)
        for j in range(4):
            h=j*6.5
            span=5.7-j*.67
            beam(art,pt(-span,v*(1-j*.045),h),pt(span-.66,v*(1-(j+1)*.045),h+6.5),.36*scale,steel)
            beam(art,pt(span,v*(1-j*.045),h),pt(-span+.66,v*(1-(j+1)*.045),h+6.5),.36*scale,steel)
    art.box(pt(0,0,29),(9*scale,10*scale,.72*scale),0,steel)
    for v in (-2.5,2.5):
        for j in range(18):
            a=j*math.tau/18;b=(j+1)*math.tau/18
            def rim(angle):return pt(2.5*math.cos(angle),v,32+2.5*math.sin(angle))
            beam(art,rim(a),rim(b),.32*scale,rust)
            if not j%2:beam(art,pt(0,v,32),rim(a),.13*scale,steel)
        beam(art,pt(0,v,34.3),pt(19,v,5),.11*scale,steel)
    for u in (-4,4):
        for v in (-4,4):beam(art,pt(u,v,29),pt(u,v,36),.24*scale,steel)
    art.roof(pt(0,0,36),10*scale,11*scale,1.25*scale,0,roof)


def bridge(k,art,d):
    i=k.road.index(d);steel=lin(0x6A6A64);brick=lin(0x847768)
    def p(u,v,h):return k.P(i,u,v,h)
    for side in (-1,1):
        art.box(p(0,side*6.1,-.15),(5.2,1.55,5.7),0,brick)
        art.box(p(0,side*6.1,5.55),(5.65,1.83,.46),0,lin(0x979487))
    art.box(p(0,0,5.98),(5.3,21,.68),0,steel)
    for u in (-2.66,2.66):
        art.box(p(u,0,6.6),(.18,21,.71),0,lin(0x565F60))
        for j in range(-10,11):
            art.box(p(u,j,6.6),(.07,.09,1.49),0,steel)
        art.box(p(u,0,8.0),(.08,21,.10),0,steel)


def forest(k,art,d,side):
    rng=k.rng
    i=k.road.index(d)
    # Canopy tips approach the centre, while the road stays visible to its vanishing point.
    x,y,z=k.road.at(i,side*rng.uniform(4.4,8.0),.06)
    birch=rng.random()<.31
    bark=lin(0xC9C8B9 if birch else 0x695F51);shade=lin(0x807F73 if birch else 0x565247)
    height=rng.uniform(9,16.5);rad=rng.uniform(.13,.24) if birch else rng.uniform(.27,.53)
    art.tube((x,y,z),rad*1.35,rad*.63,height*.73,bark,shade,7)
    if birch:
        for j in range(5):
            h=height*(.11+j*.093)
            art.box((x-rad*.83,y,z+h),(.07,rad*1.17,.13),0,shade)
    for j in range(3):
        a=j*2.08+rng.uniform(-.4,.4)
        dx,dy=3.2*math.cos(a),3.2*math.sin(a)-side*.9
        h=height*(.75+.08*j)
        beam(art,(x,y,z+height*.58),(x+dx,y+dy,z+h),rad*.65,bark)
        green=lin(rng.choice((0x5A6946,0x6C7C53,0x84906B,0x687654)))
        art.tube((x+dx,y+dy,z+h-.5),1.65,2.9,1.2,green,green,8)
        art.tube((x+dx,y+dy,z+h+.7),2.9,.58,1.85,green,green,8,green)
    if d%3==0:
        art.tube((x,y+side*3,z),.4,1.8,.9,shade,lin(0x606B49),7,lin(0x63714D))


def scenery(k):
    art=Painted(k)
    brick,glass,iron,cream=map(lin,(0x945F4B,0x596C73,0x656B6C,0xD3D2BD))
    for d,side,scale in ((148,19,1),(204,41,.76),(254,63,.62)):
        x,y,z=k.road.at(k.road.index(d),side)
        headframe(art,x,y,z,scale)
        art.box((x+9,y+8,z),(24,14,8),0,brick)
        art.roof((x+9,y+8,z+8),24,14,3.4,0,lin(0x58676B))
        for j in range(-2,20,3):
            art.box((x+j,y+.93,z+2.1),(1.65,.13,3.4),0,glass)
    bridge(k,art,485)
    for d in range(240,int(k.length),8):
        for side in (-1,1):
            if d>EXIT and (d//280)%3==1 and side>0:continue
            forest(k,art,d,side)
    for d in range(260,1060,3):
        for side in (-1,1):
            x,y,z=k.road.at(k.road.index(d),side*3.35)
            art.box((x,y,z),(.085,.10,1.14),0,iron)
            art.box((x+1.4,y,z+.19),(2.85,.075,.07),0,iron)
            art.box((x+1.4,y,z+1.04),(2.85,.09,.10),0,iron)
            for j in range(3):
                art.box((x+.55+j*.75,y,z+.22),(.045,.053,.84),0,iron)
            for j in range(2):
                px=x+k.rng.uniform(-.9,.9);py=y+side*(.65+j*.64)
                skin=lin(k.rng.choice((0xAC8268,0xD3A882,0x96765F)))
                kit=lin(k.rng.choice((0x4C697A,0xA85147,0xD0B666,0x69754C)))
                for u in (-.092,.092):art.tube((px+u,py,z),.072,.094,.76,iron,iron,6)
                art.tube((px,py,z+.75),.16,.22,.6,kit,kit,7)
                art.tube((px,py,z+1.35),.12,.12,.23,skin,skin,7,skin)
                beam(art,(px,py,z+1.2),(px+.29,py-side*.18,z+1.45+j*.19),.095,skin)
    gate(k,art)
    return {'efforts':0}

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



def gate(k,art):
    i=k.road.index(ENTRY)
    black,pale=lin(0x454B4E),lin(0xECE8D5)
    for v in (-3.5,3.5):
        art.box(k.P(i,0,v,0),(.47,.47,4.65),0,black)
    art.box(k.P(i,0,0,4.59),(.5,7.7,1.03),0,black)
    words(art,"TROUÉE D'ARENBERG",k.P(i,-.27,0,4.91),(0,-1,0),(0,0,1),.44,5.55,0xEEEAD9)
    for d in (-2.2,2.2):
        for n in range(5):
            y=d+(n-2)*.26
            cx,cy,cz=k.P(i,-.27,y,4.77)
            poly=[(cx,cy+.104*math.cos(a*math.pi/5)*(1 if a%2==0 else .40),cz+.104*math.sin(a*math.pi/5)*(1 if a%2==0 else .40)) for a in range(10)]
            for j in range(10):
                art.face(((cx,cy,cz),poly[(j+1)%10],poly[j]),(pale,)*3)
    x,y,z=k.road.at(k.road.index(ENTRY-42),-3.6)
    art.box((x,y,z),(.11,.13,2.2),0,black)
    art.box((x,y,z+1.45),(.13,2.8,.79),0,pale)
    words(art,"WALLERS", (x-.081,y,z+1.89),(0,-1,0),(0,0,1),.30,2.55,0x504E45)
    words(art,"ARENBERG",(x-.081,y,z+1.55),(0,-1,0),(0,0,1),.30,2.55,0x504E45)
