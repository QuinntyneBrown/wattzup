"""An original ten-lap downtown Austin night criterium around the Sixth Street venues."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted, lin

LAP=1545
R=22
LONG=515
SHORT=(LAP-2*LONG-2*math.pi*R)/2

def street(d):
    """Position and heading on the same rounded city block for every lap."""
    remaining=d%LAP
    x=y=h=0
    for length in (LONG,SHORT,LONG,SHORT):
        straight=min(remaining,length)
        x+=straight*math.cos(h);y+=straight*math.sin(h);remaining-=straight
        if remaining<1e-8:return x,y,h
        arc=min(remaining,R*math.pi/2);a=h+arc/R
        x+=R*(math.sin(a)-math.sin(h));y+=R*(math.cos(h)-math.cos(a))
        h=a;remaining-=arc
        if remaining<1e-8:return x,y,h
    return x,y,h

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];points=[]
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=street(d)
        points.append(dict(d=d,x=x,y=y,z=0,h=h,k=0,g=0))
    return points,stages,length,mean,0

def place(d,l=0,z=0):
    x,y,h=street(d)
    return (x-l*math.sin(h),y+l*math.cos(h),z)

def road(_road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');paint=bc.Builder('RoadPaint','paint')
    walk=bc.Builder('Promenade','promenade')
    for d in range(0,LAP,3):
        end=min(d+3,LAP)
        def strip(b,l,r,z):
            b.quad(place(d,r,z),place(end,r,z),place(end,l,z),place(d,l,z))
        strip(asphalt,6.65,-6.65,0)
        if d%15<6:strip(paint,.065,-.065,.015)
        for side in (-1,1):
            l,r=sorted((side*6.65,side*15))
            strip(walk,r,l,.13)
        if d%129<8:
            for l in range(-6,7,2):strip(paint,l+.62,l,.019)
    for part in (asphalt,paint,walk):part.build(col)

def land(_road,col,theme,bc):
    b=bc.Builder('Urban ground','terrain');b.colours=[]
    b.quad((-1100,-1100,-.43),(1800,-1100,-.43),(1800,1700,-.43),(-1100,1700,-.43))
    b.colours.extend((lin(0x292834),)*4)
    return b.build(col),lambda x,y:0

THEME={'lay':route,'land_builder':land,'road_builder':road,'night':True,'terrain':{'sea':False},
       'land':{'mid':0x292834},'sky':[0x554252,0x302B48,0x1E223D,0x151A31,0x101427],
       'haze':0x393044,'light':[0xF2BF9B,1.1],'fill':[0xB7B6D4,0x675561],
       'sun_azimuth':2.51,'sun_altitude':.39,'wet':.14,'chunks':{'Land':1,'Ground':1}}

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


def frontage(k,art,glow,d,side,index,hotel=False):
    """Recessed doors, arched sash windows, pilasters and projecting cornices."""
    _,_,h=street(d)
    def loc(u,v,w): return place(d+u,side*v,w)
    def box(u,v,w,along,across,height,colour):
        art.box(loc(u,v,w),(along,across,height),h,lin(colour))
    w=30 if hotel else (17+(index%3)*2)
    top=19 if hotel else (8.3+2.6*(index%2))
    brick=(0xB76F4D,0xB9AA89,0x997767,0xC0AA81,0x9D725A)[index%5]
    if hotel: brick=0xAD7258
    box(0,18.9,0,w,9,top,brick)
    for y in (4.0,top-.42,top):
        box(0,14.31,y,w+.6,.67,.35,0xDAC5A1)
    n=6 if hotel else 4
    for bay in range(n):
        u=((bay+.5)/n-.5)*w;rw=w/n*.59
        box(u,14.29,.15,rw+.7,.3,3.55,0x493C3E)
        box(u,14.08,.27,rw,.12,2.97,0x352B37)
        if bay%2:
            glow.box(loc(u,14,2.21),(rw,.08,.39),h,lin((0xEBA763,0xF79993,0x57C4CE)[index%3]))
        for y in ([5.1,9.1,13.2] if hotel else [5.0]):
            box(u,14.3,y,rw,.19,1.85,0x4A4651)
            box(u,14.16,y+.2,.095,.12,1.62,0xB7A38A)
            for j in range(8):
                angle=math.pi*j/8;end=math.pi*(j+1)/8
                a=loc(u+rw*.52*math.cos(angle),14.1,y+1.82+.87*math.sin(angle))
                b=loc(u+rw*.52*math.cos(end),14.1,y+1.82+.87*math.sin(end))
                beam(art,a,b,.20,.22,lin(0xE2CBA3))
            box(u,14.02,y-.17,rw+.56,.38,.21,0xD9C7A6)
    if hotel:
        for u in (-w/2+.6,0,w/2-.6):
            box(u,13.88,.15,.85,.93,top,0xD5BA98)
        for y in (4.45,8.5):
            box(0,12.4,y,w+1.6,3.5,.26,0xC9BCAA)
            beam(art,loc(-w/2,10.91,y+1.14),loc(w/2,10.91,y+1.14),.11,.11,lin(0x463A3B))
            for j in range(-14,15):box(j,10.91,y+.21,.075,.085,.94,0x493F40)
        blade(art,glow,d-9,side,'DRISKILL',0xB69359,0xFFE0A0,13)

def blade(art,glow,d,side,label,panel,bulb,high):
    x,y,h=street(d);x,y,_=place(d,side*10.8)
    right=(math.sin(h),-math.cos(h),0)
    art.box((x,y,3.8),(.46,1.52,high-3.8),h,lin(panel))
    for j,c in enumerate(label):
        words(glow,c,(x-.25*math.cos(h),y-.25*math.sin(h),high-1.36-j*(high-4.9)/len(label)),right,(0,0,1),1.24,1.19,bulb)

def span(art,glow,d):
    for side in (-1,1):
        foot=place(d,side*7.2,.12);top=place(d,side*7.2,7.4)
        beam(art,foot,top,.13,.13,lin(0x443D43))
    prev=None
    for n in range(13):
        lane=(n-6)*1.2
        pt=place(d,lane,6.2+.022*lane**2)
        if prev:beam(art,prev,pt,.05,.05,lin(0x6D665C))
        prev=pt
        if n%2==0:glow.box(pt,(.11,.12,.12),0,lin(0xFFC983))
    for j in range(10):
        def point(n):
            a=math.pi/2+n*math.pi/5;r=.81 if n%2==0 else .34
            return place(d,r*math.cos(a),5.52+r*math.sin(a))
        beam(glow,point(j),point(j+1),.066,.066,lin(0xFFE0A3))

def towers(art):
    for j,(x,y,w,h) in enumerate(((245,-183,30,88),(315,-232,40,118),(445,-277,47,152),(518,-304,30,96),(593,-197,48,105),(686,-99,36,86),(705,2,37,121),(713,85,30,84))):
        shade=lin((0x43485B,0x505168,0x51586D)[j%3])
        art.box((x,y,0),(w,w*.83,h),0,shade)
        for level in range(7,int(h)-2,4):
            art.box((x,y-w*.421,level),(w*.9,.22,.62),0,lin((0xB09B86,0x929398,0x6C7383)[level%3]))
        if j==2:
            for n in range(8):
                phi=math.tau*n/8
                a=(x+w*.51*math.cos(phi),y+w*.51*math.sin(phi),h)
                b=(x+w*.51*math.cos(phi+.76),y+w*.51*math.sin(phi+.76),h)
                tip=(x+w*.38*math.cos(phi+.38),y+w*.38*math.sin(phi+.38),h+18)
                art.face((a,b,tip),(lin(0xC1CFD8),lin(0x92A9C0),lin(0xD3DFDA)))
                beam(art,a,tip,.45,.45,lin(0xC8D8DF))

def scenery(k):
    art=Painted(k);glow=Painted(k,'glow-window')
    towers(Painted(k,'peaks'))
    for n,d in enumerate(range(12,LAP-10,22)):
        x,y,heading=street(d);_,_,next_heading=street(d+15)
        if abs(next_heading-heading)>.12:continue
        for side in (-1,1):
            if side==1 and 86<d<128:continue
            frontage(k,art,glow,d,side,n+(side+1))
    frontage(k,art,glow,111,1,2,True)
    blade(art,glow,397,-1,'RITZ',0xA54149,0xFFDB9A,12)
    blade(art,glow,448,1,'BLUES',0x335563,0x6DDCE4,10)
    for d in range(36,LAP,86):
        span(art,glow,d)
        for side in (-1,1):
            i=k.road.index(d);k.lamp(i,7.8*side,height=7.6)
    for d in (105,392,448,650,1132):
        k.light(place(d,-7),'glow-window',20,.9)
    return {'efforts':0}
