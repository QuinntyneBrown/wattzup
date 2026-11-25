"""The balcony from Soulor to Aubisque, above the Ouzom valley."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted,lin,smooth

TUNNELS=((2870,44),(3380,63))
def bearing(d):
    return .40*math.sin(d/510)+.24*math.sin(d/203)+.18*math.sin(d/94)*smooth(480,1500,d)

def height(d):
    # Relative to the Soulor sign. Descend into the cirque before gaining the final pass.
    return -104*smooth(85,2570,d)+355*smooth(2990,12340,d)+5*math.sin(d/560)*smooth(180,980,d)*(1-smooth(11700,12500,d))

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d)
        if i:
            m=bearing(d-bc.STEP/2);x+=bc.STEP*math.cos(m);y+=bc.STEP*math.sin(m)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=bearing(d+.5)-bearing(d-.5),g=100*(height(d+.5)-height(d-.5))))
    return samples,st,length,mean,0

def cliff(d):
    return smooth(610,1320,d)*(1-smooth(6550,8100,d))

def slope(d,left):
    breadth=max(0,abs(left)-3.8)
    normal=(.19+.07*math.sin(d/306+left/89))*breadth
    crag=cliff(d)
    if left<0:return -.25+normal+crag*(24*(1-math.exp(-breadth/3.8))+breadth*.57)
    return -.22-normal-crag*(18*(1-math.exp(-breadth/5.8))+.42*breadth)

def land(road,col,theme,bc):
    b=bc.Builder('Folded limestone and Pyrenean pasture','terrain');b.colours=[]
    sides=(-330,-155,-86,-41,-24,-13,-8.5,-6,-4.4,-3.6,0,3.6,4.2,6,9,16,28,54,95,203,480)
    for i in range(0,len(road.s)-1,2):
        j=min(i+2,len(road.s)-1)
        for l,r in zip(sides,sides[1:]):
            verts=[];colours=[]
            for n,u in ((i,l),(j,l),(j,r),(i,r)):
                d=road.s[n]['d'];lift=slope(d,u);rough=cliff(d)*min(1,max(0,(abs(u)-3.6)/11))
                lift+=rough*(1.1*math.sin(d/8+u/4)+1.65*math.sin(d/23-u/6))
                verts.append(road.at(n,u,lift))
                rock=cliff(d)>.6 and ((-44<u<-3.7) or (4.3<u<16))
                if rock:
                    f=math.sin(lift*.71-d*.09)+.75*math.cos(d/13+u)
                    tint=0x96978B if f>.75 else (0x777C72 if f<-.6 else 0xA1A196)
                else:
                    f=math.sin(d/182+u/17)+.65*math.sin(d/73-u/13)
                    tint=0x80904D if f>.2 else (0x758849 if f>-.76 else 0x647A45)
                colours.append(lin(tint))
            b.quad(*verts);b.colours.extend(colours)
    return b.build(col),lambda x,y:0

def road(road,st,length,col,bc):
    tarmac=bc.Builder('Road','asphalt');stripe=bc.Builder('RoadPaint','paint')
    for i in range(len(road.s)-1):
        d=road.s[i]['d'];width=4.3-.95*cliff(d)
        def strip(b,l,r,z):
            b.quad(road.at(i,r,z),road.at(i+1,r,z),road.at(i+1,l,z),road.at(i,l,z))
        strip(tarmac,width,-width,0)
        for side in (-1,1):
            if (i+(1 if side<0 else 0))%10!=0:strip(stripe,width*side-.15+.06,width*side-.15-.06,.014)
        if cliff(d)<.42 and i%4==0:strip(stripe,.055,-.055,.016)
    tarmac.build(col);stripe.build(col)

THEME={'lay':route,'land_builder':land,'road_builder':road,'land':{'mid':0x778A4B},'terrain':{'sea':False},
       'sky':[0xCAE1E5,0xA4CCD9,0x83B1CB,0x669ABD,0x487FAA],'haze':0xB8CACC,'light':[0xFBE9C5,3.2],
       'fill':[0xC4DAE3,0x8A9771],'sun_azimuth':2.49,'sun_altitude':.59,'palette':{'asphalt':0x6A6C68}}

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


def sign(k,art,d,l,label,alt):
    x,y,z=k.road.pos(d,l);yaw=bearing(d);cs,sn=math.cos(yaw),math.sin(yaw)
    right=(sn,-cs,0)
    for q in (-1.62,1.62):
        art.box((x+q*right[0],y+q*right[1],z-.55),(.14,.14,3.82),yaw,lin(0x8F978C))
    art.box((x,y,z+1.35),(.16,4.45,1.78),yaw,lin(0x434D4B))
    art.box((x-.09*cs,y-.09*sn,z+1.43),(.08,4.27,1.60),yaw,lin(0xE2E0CB))
    origin=(x-.16*cs,y-.16*sn)
    words(art,label,(*origin,z+2.26),right,(0,0,1),.52,3.98,0x354546)
    words(art,alt,(*origin,z+1.67),right,(0,0,1),.42,3.6,0x465150)

def chalet(k,art,d,l,scale):
    x,y,z=k.road.pos(d,l);yaw=bearing(d);z+=slope(d,l)
    cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return (x+scale*(u*cs-v*sn),y+scale*(u*sn+v*cs),z+scale*h)
    stone,wood,roof=map(lin,(0xABAA91,0x79563E,0x525A59))
    art.box(p(0,0,-1.4),(15*scale,8*scale,4.8*scale),yaw,stone)
    art.box(p(0,0,3.35),(15.3*scale,8.3*scale,1.22*scale),yaw,wood)
    art.roof(p(0,0,4.48),15.8*scale,8.6*scale,3.9*scale,yaw,roof)
    for side in (-1,1):
        for u in (-5.5,-2.7,.2,3.2,5.7):
            art.box(p(u,side*4.07,.75),(1.7*scale,.22,1.65*scale),yaw,wood)
            art.box(p(u,side*4.2,.91),(1.39*scale,.12,1.34*scale),yaw,lin(0x616F72))
    art.box(p(4.1,1.9,4.7),(1.2*scale,1.2*scale,3.1*scale),yaw,stone)

def bicycle(art,c,yaw,scale,tint,spots=False):
    cs,sn=math.cos(yaw),math.sin(yaw);x,y,z=c
    def p(u,v,h):return (x+(u*cs-v*sn)*scale,y+(u*sn+v*cs)*scale,z+h*scale)
    tyre=lin(0x404641);chrome=lin(0x959C91);shirt=lin(tint)
    for u in (-.62,.62):
        for j in range(24):
            a=j*math.tau/24;b=(j+1)*math.tau/24
            v0=p(u+.35*math.cos(a),0,.36+.35*math.sin(a));v1=p(u+.35*math.cos(b),0,.36+.35*math.sin(b))
            beam(art,v0,v1,.042*scale,.041*scale,tyre)
            if j%3==0:beam(art,p(u,0,.36),v0,.011*scale,.011*scale,chrome)
    for a,b in (((-.62,.36),(-.22,.84)),((-.22,.84),(.36,.81)),((.36,.81),(-.02,.35)),((-.02,.35),(-.22,.84)),((-.62,.36),(-.02,.35)),((.36,.81),(.62,.36)),((.36,.81),(.34,.97))):
        beam(art,p(a[0],0,a[1]),p(b[0],0,b[1]),.065*scale,.07*scale,shirt)
    art.box(p(-.23,0,.87),(.26*scale,.105*scale,.075*scale),yaw,tyre)
    beam(art,p(.34,-.14,.97),p(.34,.14,.97),.05*scale,.035*scale,chrome)
    if spots:
        for t in (.16,.43,.78):
            art.tube(p(-.22+.58*t,-.036,.84-.03*t),.027*scale,.027*scale,.026*scale,lin(0xC74943),lin(0xC74943),7,lin(0xC74943))

def tunnel(k,art,d,length):
    # An irregular hollow rock ring crosses the road; it stays open at either end.
    rows=[]
    for n in range(12):
        chain=d+length*n/11
        cx,cy,cz=k.road.pos(chain,0);h=bearing(chain)
        row=[]
        for j in range(17):
            a=j*math.pi/16
            rr=5.25+.14*math.sin(j*6+n*1.4)
            u=math.cos(a)*rr
            row.append((cx-u*math.sin(h),cy+u*math.cos(h),cz+1.15+rr*.9*math.sin(a)))
        rows.append(row)
    rock,shade=lin(0x777D74),lin(0x666B64)
    for q in range(11):
        for j in range(16):
            a,b=rows[q],rows[q+1]
            pts=(a[j],a[j+1],b[j+1],b[j]);art.face(pts,(shade,rock,rock,shade));art.face(pts[::-1],(rock,)*4)
        for j in (0,16):
            a,b=rows[q][j],rows[q+1][j];f=(a,b,(b[0],b[1],b[2]-1.5),(a[0],a[1],a[2]-1.5))
            art.face(f,(rock,)*4);art.face(f[::-1],(shade,)*4)
    for n,r in ((0,rows[0]),(11,rows[-1])):
        chain=d+length*n/11;h=bearing(chain);cx,cy,cz=k.road.pos(chain,0)
        for j in range(16):
            def outer(i):
                a=i*math.pi/16;u=math.cos(a)*(8.6+1.5*math.sin(i*.8))
                return cx-u*math.sin(h),cy+u*math.cos(h),cz+1.05+8.2*math.sin(a)
            f=(r[j],r[j+1],outer(j+1),outer(j))
            art.face(f,(rock,shade,rock,rock));art.face(f[::-1],(rock,)*4)
    for j in range(16):
        a=j*math.pi/16;b=(j+1)*math.pi/16
        def crown(chain,t):
            cx,cy,cz=k.road.pos(chain,0);h=bearing(chain);u=math.cos(t)*8.6
            return cx-u*math.sin(h),cy+u*math.cos(h),cz+1.05+8.2*math.sin(t)
        f=(crown(d,a),crown(d+length,a),crown(d+length,b),crown(d,b));art.face(f,(rock,)*4);art.face(f[::-1],(rock,)*4)

def mountains(k):
    art=Painted(k,'peaks')
    for side in (1,-1):
        last=None
        for d in range(-700,16000,78):
            x=d;y=side*(1050+140*math.sin(d/440))
            high=350+145*math.sin(d/563)+62*math.cos(d/169)+43*math.sin(d/77)
            high+=400*math.exp(-((d-11150)/760)**2)
            rows=((x,y-side*430,-430),(x,y-side*300,high*.14),(x+21,y-side*140,high*.63),(x,y,high))
            if last:
                for j,hue in enumerate((0x788A60,0x8A9681,0xA3A79B)):
                    co=lin(hue);sh=lin((0x718559,0x808E79,0x969D95)[j]);a,b,c,e=last[j],rows[j],rows[j+1],last[j+1]
                    f=(a,b,c,e)
                    art.face(f if side>0 else f[::-1],(co,sh,sh,co))
                    if j==2 and high>460 and d%234!=0:
                        u=tuple(e[i]*.87+a[i]*.13 for i in range(3));v=tuple(c[i]*.92+b[i]*.08 for i in range(3))
                        w=(u[0]+12,u[1]-side*4,u[2]-18);art.face((u,v,w),(lin(0xD3D7CE),)*3)
            last=rows

def scenery(k):
    art=Painted(k);mountains(k);rng=k.rng
    for d in range(465,9130,7):
        if any(a-5<=d<=a+b+5 for a,b in TUNNELS):continue
        l=3.75+.70*(1-cliff(d))
        x,y,z=k.road.pos(d,l)
        yaw=bearing(d)+rng.uniform(-.09,.09)
        size=rng.uniform(.95,1.37)
        art.box((x,y,z-.32),(size,.56,.91),yaw,lin(rng.choice((0x9DA294,0xA8A99C,0xABAD9F))))
        art.box((x,y,z+.54),(size+.04,.59,.14),yaw,lin(0xC1C2AF))
    for d,length in TUNNELS:tunnel(k,art,d,length)
    chalet(k,art,125,-18,1);sign(k,art,118,-5.6,'COL DU SOULOR','1 474 m')
    chalet(k,art,12565,-21,1.28);sign(k,art,12533,-5.7,"COL D'AUBISQUE",'1 709 m')
    for j,(d,l,tint) in enumerate(((12528,9,0xEAC542),(12545,11,0x72AA53),(12562,12,0xE1DED1))):
        x,y,z=k.road.pos(d,l);z+=slope(d,l)
        bicycle(art,(x,y,z+.05),bearing(d)+1.32,4.1,tint,j==2)
    for d in (123,139,152,195,12478,12504,12518,12572,12583):
        l=-7.9 if d<12000 else -9.3;x,y,z=k.road.pos(d,l)
        bicycle(art,(x,y,z+slope(d,l)),bearing(d)+.4,.98,rng.choice((0x8BA142,0xAA6651,0x506D8C)))
    return {'efforts':0}
