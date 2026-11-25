"""Original Ma-2141: port, limestone gorge, 26 climbing reversals and the Nus de sa Corbata."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree
from worldkit import Painted, lin, smooth

KNOT_START=9892
KNOT_RADIUS=32
BRIDGE=KNOT_START+1.5*math.pi*KNOT_RADIUS+KNOT_RADIUS
TURNS=[(1750+i*293+33*math.sin(i*.72),17+4*math.sin(i*.93)) for i in range(26)]


def heading(d):
    if d>=KNOT_START:
        a=min(1.5*math.pi,max(0,(d-KNOT_START)/KNOT_RADIUS))
        return -a+.32*math.sin((d-BRIDGE)/196)*smooth(BRIDGE+90,BRIDGE+210,d)
    h=(.41*math.sin(d/220)-.27*math.sin(d/90))*(1-smooth(1250,1610,d))
    for i,(start,radius) in enumerate(TURNS):
        if d<start:break
        h+=(1 if i%2==0 else -1)*min(math.pi,(d-start)/radius)
    return h


def height(d):
    if d<0:return 4.2
    # Class stages determine the broad grade. The knot gains clearance naturally on its turn.
    lengths=(0,350,2250,9330,9513,11851)
    grades=(.008,.037,.074,.071,.027)
    z=4.2
    for a,b,grade in zip(lengths,lengths[1:],grades):
        z+=max(0,min(d,b)-a)*grade
    return z+1.8*math.sin(d/175)*smooth(350,790,d)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];samples=[];x=-bc.LEAD_IN;y=0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=heading(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=heading(d),k=heading(d+.5)-heading(d-.5),g=(height(d+.5)-height(d-.5))*100))
    return samples,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def land(road,col,theme,bc):
    # Remove the bridge deck from the terrain sampler so the lower road continues freely beneath it.
    ground=[p for p in road.s if abs(p['d']-BRIDGE)>25]
    tree=KDTree(len(ground))
    for i,p in enumerate(ground):tree.insert((p['x'],p['y'],0),i)
    tree.balance()
    def terrain(x,y):
        _,i,dist=tree.find((x,y,0));p=ground[i];d=p['d']
        lateral=(y-p['y'])*math.cos(p['h'])-(x-p['x'])*math.sin(p['h'])
        # One continuous hillside under every leg. Nearest-road lookups alone make a
        # vertical cliff on the bisector between two roads of different elevations.
        coast=3.7+.036*max(0,x-170)+.18*max(0,y-90)
        headland=(63+.63*min(890,max(-110,y))+.033*max(0,y-890)+.025*(x-1500))
        island=smooth(520,1420,x)
        z=coast+(headland-coast)*island
        z+=16*math.sin(x/199+y/229)+10*math.cos(x/105-y/134)
        if x<570:
            z-=(1-smooth(340,570,x))*max(0,80-y)*.23
        if 780<x<1560:
            z+=smooth(780,1030,x)*(1-smooth(1420,1560,x))*min(40,abs(lateral))*.27
        # Lower embankments keep the asphalt and the open arch clear at road crossings.
        verge=p['z']-1.40+max(0,dist-7)*.14
        if d<650 and lateral<-4:
            verge=p['z']-.7-max(0,-lateral-4)*.45
        weight=1-smooth(8,105,dist)
        return max(-24,z+(verge-z)*weight)
    xmin=int(min(p['x'] for p in ground))-220;xmax=int(max(p['x'] for p in ground))+300
    ymin=int(min(p['y'] for p in ground))-260;ymax=int(max(p['y'] for p in ground))+250
    b=bc.Builder('Karst valley, cuttings and saltwater cove','terrain');b.colours=[]
    @lru_cache(maxsize=24000)
    def vertex(x,y):
        z=terrain(x,y);noise=math.sin(x/24+y/19)+.43*math.cos(y/7-x/8)+.22*math.sin(x/5+y/5)
        colour=(0x777C4F if noise<-.65 else 0x939267 if noise<-.05 else 0xB6AA8E if noise<.70 else 0xCFC3AA)
        return (x,y,z),lin(colour)
    cell=9
    for x in range(xmin,xmax,cell):
        for y in range(ymin,ymax,cell):
            points=[vertex(a,c) for a,c in ((x,y),(x+cell,y),(x+cell,y+cell),(x,y+cell))]
            b.quad(*(v[0] for v in points));b.colours.extend(v[1] for v in points)
    sea=bc.Builder('Mediterranean','sea')
    sea.quad((-17000,-19000,0),(23000,-19000,0),(23000,4000,0),(-17000,4000,0));sea.build(col)
    return b.build(col),terrain


def roadway(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');shoulder=bc.Builder('Shoulder','terrain');shoulder.colours=[]
    for i in range(len(road.s)-1):
        asphalt.quad(road.at(i,-3.23),road.at(i+1,-3.23),road.at(i+1,3.23),road.at(i,3.23))
        for sign in (-1,1):
            for a,b,h,tint in ((3.22,4.04,-.015,0xAAA28E),(4.04,6.8,-.65,0xA39C81)):
                if abs(road.s[i]['d']-BRIDGE)<21 and a>4:continue
                verts=(road.at(i,sign*a,-.02 if a<4 else -.015),road.at(i+1,sign*a,-.02 if a<4 else -.015),
                       road.at(i+1,sign*b,h),road.at(i,sign*b,h))
                shoulder.quad(*(verts if sign>0 else verts[::-1]));shoulder.colours.extend((lin(tint),)*4)
    asphalt.build(col);shoulder.build(col)


THEME={'lay':route,'road_half_width':3.23,'land_builder':land,'road_builder':roadway,'terrain':{'sea':True},
       'land':{'mid':0x9A946F},'sky':[0x9DC4DB,0x88BCE2,0x6EABE1,0x5698DD,0x4384D0],
       'haze':0xB4CDD9,'light':[0xFFF4E4,3.0],'fill':[0xD2E3EB,0xB5A484],
       'sun_azimuth':-.93,'sun_altitude':.69,'palette':{'asphalt':0x5A5A58,'sea':0x095A98},'chunks':{'Land':2}}

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



def arch(k,art):
    # Extruded voussoirs form a true opening over the lower road. Vertical spandrels carry the upper lane.
    def pt(u,v,z):
        x,y,_=k.road.pos(BRIDGE+u,v)
        return x,y,z
    soffit=height(BRIDGE)-1.18
    low=height(KNOT_START-KNOT_RADIUS)-1.2
    radius=6.5;spring=soffit-radius-.45
    def block(left,right,base1,base2,top1,top2,tint):
        for side in (-3.85,3.85):
            f=(pt(left,side,base1),pt(right,side,base2),pt(right,side,top2),pt(left,side,top1))
            co=lin(tint);art.face(f,(co,)*4);art.face(f[::-1],(co,)*4)
        f=(pt(left,-3.85,base1),pt(right,-3.85,base2),pt(right,3.85,base2),pt(left,3.85,base1))
        art.face(f,(lin(0x807869),)*4);art.face(f[::-1],(lin(0x807869),)*4)
    for j in range(32):
        a=-18+j*36/32;b=a+36/32
        def base(u):return low if abs(u)>radius else spring+math.sqrt(max(0,radius*radius-u*u))
        block(a,b,base(a),base(b),height(BRIDGE+a)-.15,height(BRIDGE+b)-.15,(0xAA9B81,0xAE9E87,0xB3A68C)[j%3])
    for side in (-3.91,3.91):
        for j in range(21):
            a=j*math.pi/21+.009;b=(j+1)*math.pi/21-.009
            f=[pt(r*math.cos(t),side,spring+r*math.sin(t)) for r,t in ((radius,a),(radius,b),(radius+.61,b),(radius+.61,a))]
            co=lin((0xCEC1A9,0xBFB29A,0xDDD0B7)[j%3]);art.face(f,(co,)*4);art.face(f[::-1],(co,)*4)


def scenery(k):
    art=Painted(k);ridge=Painted(k,'peaks');rng=k.rng
    def at(d,l):
        x,y,_=k.road.pos(d,l)
        return x,y,k.height_at(x,y)
    def house(d,l,w,b,h,paint):
        x,y,z=at(d,l);yaw=heading(d);art.box((x,y,z),(w,b,h),yaw,lin(paint))
        art.roof((x,y,z+h),w,b,1.45,yaw,lin(0xA67554))
        for j in range(-2,3):
            for sign in (-1,1):
                off=w*.166*j;v=sign*(b/2+.045)
                art.box((x+off*math.cos(yaw)-v*math.sin(yaw),y+off*math.sin(yaw)+v*math.cos(yaw),z+h*.40),
                        (w*.09,.12,h*.39),yaw,lin(0x566653))
    for j in range(8):house(35+j*34,10+(j%3)*4,11+j%4,6,4+j%2,0xD8C7A6)
    # Fishing quay, small moored hulls, open blue water and the port's rocky entrance.
    for d in range(40,260,6):
        x,y,_=k.road.pos(d,-20);art.box((x,y,-.4),(6.2,6.5,2.2),heading(d),lin(0xA99A83))
    for d in range(45,325,33):
        x,y,_=k.road.pos(d,-30-d%11);yaw=heading(d)+d*.02
        art.box((x,y,.21),(5.8,1.7,.64),yaw,lin(0xE2DECD));art.box((x,y,.88),(2.5,1.4,.7),yaw,lin(0x7D999D))
        art.tube((x,y,1.1),.045,.028,5.2,lin(0x9B957D),lin(0xC8C4AF),5)
    for d in range(0,11850,5):
        if d<270 or 11540<d<11720:continue
        # The wall changes sides as the climbing road reverses on the face.
        coast=-1 if math.cos(heading(d))>=0 else 1
        for sign in ((-1,1) if abs(d-BRIDGE)<82 else (coast,)):
            a=k.road.pos(d,sign*3.48);b=k.road.pos(d+5,sign*3.48)
            beam(art,(a[0],a[1],a[2]+.32),(b[0],b[1],b[2]+.32),.48,.72,lin(0xAB9E86))
            beam(art,(a[0],a[1],a[2]+.75),(b[0],b[1],b[2]+.75),.56,.14,lin(0xD3C7AA))
            for j in range(3):
                x,y,z=k.road.pos(d+1.1+j*1.32,sign*3.225)
                art.box((x,y,z+(.19 if j%2 else .41)),(.79,.058,.16),heading(d),lin((0xA09680,0xB9AC93,0x998D79)[j]))
    arch(k,art)
    # Karst fins in the shaded defile. Fluted irregular rings taper above a road-width split.
    for d in range(930,1570,9):
        for sign in (-1,1):
            l=sign*(10.4+4*math.sin(d/59)+rng.uniform(0,2.6));x,y,z=at(d,l)
            h=11+7*math.sin(d/83)+rng.uniform(0,13);r=3.1+rng.random()*2.0
            prev=None
            for layer,(width,up) in enumerate(((1.25,-3),(1.05,h*.27),(.91,h*.57),(.67,h*.84),(.14,h))):
                ring=[]
                for j in range(8):
                    a=math.tau*j/8;flute=r*width*(1+.16*math.sin(j*3.2+d))
                    ring.append((x+math.cos(a)*flute+up*.10,y+math.sin(a)*flute,z+up))
                if prev:
                    for j in range(8):
                        co=lin((0xB0A895,0xC2BAA5,0xA7A08E,0xC8C2AC,0x9D9685)[(j+layer//2)%5])
                        art.face((prev[j],prev[(j+1)%8],ring[(j+1)%8],ring[j]),(co,)*4)
                prev=ring
    # Holm oaks, broad maritime pines and silver wild olives share one painted mesh.
    for d in range(35,11850,7):
        l=rng.choice((-1,1))*rng.uniform(8,41);x,y,z=at(d,l)
        if z<1 or abs(d-BRIDGE)<45 or not k.road.clear_of_road(x,y,7,k.road.index(d),80):continue
        if 960<d<1550 and abs(l)<17:continue
        h=rng.uniform(2.1,6.8);r=.45*h
        art.tube((x,y,z),h*.038,h*.024,h*.69,lin(0x615B49),lin(0x86816B),6)
        tint=rng.choice((0x667449,0x5C6941,0x768155,0x536645))
        for j in range(3):
            xx=x+rng.uniform(-.44,.44)*r;yy=y+rng.uniform(-.44,.44)*r
            art.tube((xx,yy,z+h*.52),r*.61,r,h*.19,lin(0x404E38),lin(tint),7)
            art.tube((xx,yy,z+h*.71),r,r*.25,h*.26,lin(tint),lin(tint),7)
    # Coll dels Reis: pass sign, café terrace and cycles resting on their racks.
    house(11670,12,20,8,3.8,0xD5C3A0)
    for d in (11644,11651,11659):
        x,y,z=at(d,8.2);art.tube((x,y,z),.11,.11,1,lin(0x685D48),lin(0x756952),7)
        art.tube((x,y,z+1),1.13,1.13,.09,lin(0xA58B64),lin(0xA58B64),10,lin(0xB9A27A))
    x,y,z=k.road.pos(11654,-4.9);yaw=heading(11654)
    art.box((x,y,z-.25),(.11,.14,2.65),yaw,lin(0x9F9989))
    art.box((x,y,z+1.32),(.13,2.55,.89),yaw,lin(0x824C37))
    origin=(x-.078*math.cos(yaw),y-.078*math.sin(yaw),z+1.77)
    words(art,'Coll dels Reis',origin,(math.sin(yaw),-math.cos(yaw),0),(0,0,1),.27,2.33,0xF0E4CA)
    # Roof-racked team estate in the class's original navy-and-white livery.
    for d in (172,7162,11636):
        x,y,z=k.road.pos(d,-4.55);yaw=heading(d)
        def carpoint(u,v,h):
            return (x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h-.16)
        art.box(carpoint(0,0,.31),(4.6,1.86,.82),yaw,lin(0x243960))
        art.box(carpoint(0,0,.77),(4.60,1.87,.17),yaw,lin(0xE4E4DB))
        art.box(carpoint(-.20,0,1.13),(2.65,1.62,.56),yaw,lin(0x354D5B))
        art.box(carpoint(-.18,0,1.69),(2.79,1.73,.11),yaw,lin(0x26385D))
        for u in (-1.48,1.50):
            for v in (-.90,.90):
                hub=carpoint(u,v,.36)
                for j in range(12):
                    a=j*math.tau/12;b=(j+1)*math.tau/12
                    f=(hub,carpoint(u+.36*math.cos(a),v,.36+.36*math.sin(a)),carpoint(u+.36*math.cos(b),v,.36+.36*math.sin(b)))
                    co=lin(0x282B2B);art.face(f,(co,)*3);art.face(f[::-1],(co,)*3)
        for v in (-.56,0,.56):
            for u in (-.59,.56):
                for j in range(14):
                    a=j*math.tau/14;b=(j+1)*math.tau/14
                    beam(art,carpoint(u+.32*math.cos(a),v,2.13+.32*math.sin(a)),carpoint(u+.32*math.cos(b),v,2.13+.32*math.sin(b)),.036,.036,lin(0x343633))
            for a,b in (((-.59,2.13),(-.07,2.55)),((-.07,2.55),(.10,2.12)),((.10,2.12),(-.59,2.13)),((.10,2.12),(.50,2.52)),((.50,2.52),(-.07,2.55)),((.50,2.52),(.56,2.13))):
                beam(art,carpoint(a[0],v,a[1]),carpoint(b[0],v,b[1]),.035,.035,lin(0xD9DCCF))
    # The thin far roadway follows the same physical bends as the near, detailed asphalt.
    for d in range(1640,10400,7):
        if abs(d-BRIDGE)<28:continue
        f=(k.road.pos(d,-3.18,-.12),k.road.pos(d+7,-3.18,-.12),
           k.road.pos(d+7,3.18,-.12),k.road.pos(d,3.18,-.12))
        ridge.face(f,(lin(0x676760),)*4)
    # Pale headlands enclose both sides of the port. Displaced strata give the cliffs a broken face.
    for row in range(2):
        prev=None
        for j in range(65):
            u=j/64;x=270+u*790;y=-165-row*215-70*math.sin(u*3.5)
            high=(49+row*32+17*math.sin(j*.16)+9*math.cos(j*.41))*math.sin(math.pi*u)**.52
            section=((x,y+18,-4),(x,y+12,high*.19),(x-3,y+9,high*.64),(x,y,high),(x,y-36,high*.86))
            if prev:
                for i,tint in enumerate((0xA69578,0xB8B29D,0xBCB7A1,0x798258)):
                    co=lin(tint);f=(prev[i],section[i],section[i+1],prev[i+1]);ridge.face(f,(co,)*4);ridge.face(f[::-1],(co,)*4)
            prev=section
    # Puig Major is the highest fixed ridge behind the switchbacks.
    for row in range(3):
        prev=None
        for j in range(100):
            x=j*76-1650;y=1600+row*670+210*math.sin(j/8+row)
            high=690+row*135+110*math.sin(j/5.4+row)+57*math.sin(j*.91)+175*math.exp(-((j-47)/5)**2)
            section=((x,y-440,12),(x+8,y-255,high*.48),(x-6,y-111,high*.78),(x,y,high))
            if prev:
                for i,tint in enumerate(((0x8C8E71,0xB7AC91,0xBCB6A2),(0xA1A491,0xB5B4A0,0xC2BEAB),(0xABB2A5,0xB9BDAE,0xC8C8BA))[row]):
                    co=lin(tint);ridge.face((prev[i],section[i],section[i+1],prev[i+1]),(co,)*4)
            prev=section
    return {'efforts':0}
