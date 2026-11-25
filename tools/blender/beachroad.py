"""Melbourne's bayside club ride, from St Kilda Pier to Brighton and Ricketts Point."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted,lin,smooth

def bearing(d):
    return -.16+.24*math.sin(d/601)+.12*math.sin(d/245)-sum(.50*math.exp(-((d-q)/126)**2) for q in (160,805,3570,7760,18500))

def height(d):
    return 3.9+1.55*math.sin(d/836)**2+4.4*math.exp(-((d-3710)/610)**2)+2.7*math.exp(-((d-8120)/543)**2)

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            m=bearing(d-bc.STEP/2);x+=bc.STEP*math.cos(m);y+=bc.STEP*math.sin(m)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(height(d+.5)-height(d-.5))))
    return samples,st,length,mean,0


def ground(d,l):
    h=height(d)
    if l>0:return h-.14+max(0,l-14)*(.07+.025*math.sin(d/450))
    b=max(0,-l-6.8); reef = max(math.exp(-((d-centre)/220)**4) for centre in (8040,15980))
    beach=25.4+5.8*math.sin(d/295)-12*reef
    return h-.15-(h-.29)*smooth(0,beach,b)-max(0,b-beach)*.14

def land(road,col,theme,bc):
    b=bc.Builder('Foreshore slopes and Brighton sand','terrain');b.colours=[]
    sides=(-100,-60,-44,-32,-26,-21,-16,-12,-9,-6.8,-3,0,6.8,12,24,65,160,360)
    for i in range(0,len(road.s)-1,4):
        j=min(i+4,len(road.s)-1)
        for a,c in zip(sides,sides[1:]):
            vertices=[];colours=[]
            for n,v in ((i,a),(j,a),(j,c),(i,c)):
                d=road.s[n]['d'];z=ground(d,v);vertices.append(road.at(n,v,z-road.s[n]['z']))
                sharp=math.sin(d/97+v*.21)+.38*math.sin(d/41-v*.32)
                if v<-16:co=0xE3CE9D if sharp>0 else 0xCDB68C
                elif v<-9:co=0xA0A373 if sharp>0 else 0x899465
                else:co=0x8E9C68 if sharp>0 else 0x819263
                colours.append(lin(co))
            b.quad(*vertices);b.colours.extend(colours)
    sea=bc.Builder('Port Phillip Bay','sea')
    sea.quad((-13000,-13000,0),(33000,-13000,0),(33000,900,0),(-13000,900,0));sea.build(col)
    return b.build(col),lambda x,y:0

def road(road,st,length,col,bc):
    t=bc.Builder('Road','asphalt');stripes=bc.Builder('RoadPaint','paint')
    path=bc.Builder('Foreshore shared path','asphalt');race_lane=bc.Builder('Cycle lane turnouts','terrain');race_lane.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d'];end=road.s[i+1]['d']
        def strip(b,l,r,z):b.quad(road.at(i,r,z),road.at(i+1,r,z),road.at(i+1,l,z),road.at(i,l,z))
        strip(t,6.3,-6.3,0)
        if i%4<2:strip(stripes,.075,-.075,.016)
        for side in (-1,1):
            strip(stripes,side*4.57+.064,side*4.57-.064,.016)
            if d%540<50:
                strip(race_lane,side*5.44+.72,side*5.44-.72,.009);race_lane.colours.extend((lin(0x558575),)*4)
        v=-10.7+.95*math.sin(d/101);e=-10.7+.95*math.sin(end/101)
        path.quad(road.at(i,v-1.03,ground(d,v-1.03)-height(d)+.10),road.at(i+1,e-1.03,ground(end,e-1.03)-height(end)+.10),road.at(i+1,e+1.03,ground(end,e+1.03)-height(end)+.10),road.at(i,v+1.03,ground(d,v+1.03)-height(d)+.10))
    for part in (t,path,stripes,race_lane):part.build(col)

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'land':{'mid':0x809460},
       'sky':[0xC1D9DE,0xABCDDB,0x82AED0,0x6B9CC3,0x547FA9],'haze':0xB6CDD2,'light':[0xFBE4B8,2.75],
       'fill':[0xC5DBE1,0xAAAC84],'sun_azimuth':-.34,'sun_altitude':.48,'palette':{'asphalt':0x646B6E}}
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


def box_hut(k,art,d,l,i):
    x,y,_=k.road.pos(d,l);z=ground(d,l);yaw=bearing(d)+math.pi;cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return(x+cs*u-sn*v,y+sn*u+cs*v,z+h)
    palette=(0xC25546,0x4886A3,0xD8AF49,0x53988A,0xA8759B,0xE6C68D,0x7C9C63)
    colour=palette[i%len(palette)];accent=palette[(i*3+2)%len(palette)];width=3.31+.17*math.sin(i)
    def box(u,v,h,a,b,c,t):art.box(p(u,v,h),(a,b,c),yaw,lin(t))
    box(0,0,-.35,width,4.32,.64,0x8B8169)
    box(0,0,.27,width,4.14,2.35,colour)
    # Gable ends face the road and beach, and the roof ridge runs between the two doors.
    art.roof(p(0,0,2.58),4.62,width+.18,1.04,yaw+math.pi/2,lin(0xCBD1BC if i%3 else 0x6D8984))
    box(0,-2.10,.28,2.19,.16,2.08,accent);box(0,-2.20,.29,.045,.04,2.04,0x776F66)
    for j in range(6):
        h=.43+j*.315
        if i%3==0:box(0,-2.20,h,2.08,.07,.12,colour)
        elif i%3==1:box(-.94+j*.36,-2.20,.33,.09,.06,1.92,colour)
        else:box(0,-2.17,h,width-.08,.04,.032,0xA4A290)
    for side in (-1,1):
        beam(art,p(0,-2.3,3.68),p(side*width*.54,-2.3,2.56),.11,.13,lin(0xE3DCC5))
        box(side*width*.47,-2.10,.25,.10,.18,2.35,0xD9D8C1)
    art.box(p(-.18,-2.23,1.29),(.14,.06,.07),yaw,lin(0x645D54))

def pier(k,art,d):
    x,y,_=k.road.pos(d,-4);yaw=bearing(d)+1.04;cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return(x+cs*u-sn*v,y+sn*u+cs*v,h)
    def box(u,v,h,a,b,c,t):art.box(p(u,v,h),(a,b,c),yaw,lin(t))
    for j in range(36):
        v=-j*3.4;box(0,v,2.15,5.7,3.39,.29,0xA69576)
        for side in (-1,1):
            if j%2==0:box(side*2.72,v,-1.2,.24,.26,4.69,0x8F9286)
            for h in (2.92,3.41):box(side*2.72,v,h,.09,3.4,.09,0xE2E1CD)
        if j%4==0:
            foot=p(2.54,v,2.4);elbow=p(2.54,v,6.62)
            beam(art,foot,elbow,.11,.11,lin(0x40514F))
            beam(art,elbow,p(1.9,v,6.91),.09,.09,lin(0x40514F))
            beam(art,p(1.9,v,6.91),p(1.46,v,6.47),.08,.08,lin(0x40514F))
            art.tube(p(1.46,v,6.23),.15,.23,.28,lin(0xE3D9AE),lin(0xCDC49D),8)
    box(0,-122,2.15,16,16,.39,0xB1A085)
    box(0,-122,2.53,7.9,8.5,3.10,0xDBCBA7);art.roof(p(0,-122,5.62),9.4,10,3.1,yaw,lin(0x7E7765))
    for side in (-1,1):
        for j in range(3):
            box(side*4.01,-124.6+2.55*j,3.05,.12,1.37,1.66,0x6A7978)
            box(-2.6+j*2.54,-117.72,3.1,1.4,.13,1.55,0x6A7978)
    box(0,-116.56,4.39,8.8,2.1,.19,0xAA9675)

def pine(art,x,y,z,h):
    art.tube((x,y,z),h*.032,h*.012,h*.96,lin(0x736F5F),lin(0x948F78),7)
    for row in range(8):
        top=h*(.28+row*.095);r=h*(.215-row*.022)
        for j in range(6):
            t=j*math.tau/6+row*.48
            a=(x+r*math.cos(t),y+r*math.sin(t),z+top-.14*r)
            b=(x+r*.74*math.cos(t+.68),y+r*.74*math.sin(t+.68),z+top-.08*r)
            c=(x,y,z+top+1.05*r);shade=lin(0x476F55 if j%2 else 0x52735A)
            art.face((a,b,c),(shade,shade,lin(0x69876C)));art.face((c,b,a),(shade,)*3)

def teatree(art,x,y,z,h,yaw):
    for arm in range(4):
        a=yaw+arm*2.2;tip=(x+h*.52*math.cos(a),y+h*.48*math.sin(a),z+h*.71)
        mid=(x+h*.14*math.cos(a-.6),y+h*.17*math.sin(a-.6),z+h*.46)
        beam(art,(x,y,z),mid,h*.12,h*.13,lin(0x877965));beam(art,mid,tip,h*.075,h*.07,lin(0x958571))
        u,v,w=tip
        for j in range(9):
            t=j*math.tau/9;r=h*(.51+.09*math.sin(j*2.5+arm))
            low=(u+r*math.cos(t),v+r*.80*math.sin(t),w)
            other=(u+h*.52*math.cos(t+.7),v+h*.42*math.sin(t+.7),w)
            cap=(u+.11*h,v+.06*h,w+.26*h);co=lin(0x72856A if (j+arm)%3 else 0x6B7C61)
            art.face((low,other,cap),(co,co,lin(0x8C9E78)));art.face((other,low,(u,v,w-.15*h)),(co,)*3)

def shelves(k,art,d,l,r,level=None):
    x,y,_=k.road.pos(d,l);yaw=bearing(d);top=level if level is not None else .52+.24*math.cos(d)
    for j in range(9):
        a=j*math.tau/9;b=(j+1)*math.tau/9
        def p(t,z,rr):return(x+r*rr*math.cos(t),y+r*.54*rr*math.sin(t),z)
        h=lin(0xB8A680 if j%3 else 0x9F9073);lo=lin(0x857B65)
        art.face(((x,y,top+.17),p(a,top,1),p(b,top,1)),(h,)*3)
        art.face((p(a,top,1),p(a,-.16,1.08),p(b,-.16,1.08),p(b,top,1)),(h,lo,lo,h))

def skyline(k,art):
    for i in range(39):
        d=1050+i*43;x=1430+(i-18)*11.7;y=-580-125*math.sin(i*3.9)
        h=19+62*abs(math.sin(i*5.31))+(53 if i in (8,13,21,25) else 0)
        w=9+8*abs(math.sin(i*34.8));shade=lin((0x87979D,0x778B95,0x8A9395)[i%3])
        art.box((x,y,-1),(w,w*.88,h),i*.33,shade)
        if i%3==0:art.box((x,y,h-1),(w*.63,w*.58,h*.11),i*.33,lin(0x91A0A3))
        if i==13:art.tube((x,y,h),.61,.12,17,shade,shade,6)
        for row in range(11,int(h),7):art.box((x,y-w*.44,row),(w*.91,.22,.66),0,lin(0xA4ABAA))

def scenery(k):
    art=Painted(k);skyline(k,Painted(k,'peaks'));rng=k.rng
    for d in (238,18693):pier(k,art,d)
    for base in (890,5900,14280):
        for i in range(27):
            d=base+i*4.6;box_hut(k,art,d,-18.3-1.3*math.sin(i/11),i)
    for d in range(15,19605,46):
        l=rng.choice((1,-1))*rng.uniform(8.7,17.2);x,y,_=k.road.pos(d,l)
        if l<0 and (any(base-20<d<base+147 for base in (890,5900,14280)) or 7770<d<8010):continue
        if d%7<3:pine(art,x,y,ground(d,l),rng.uniform(10,17))
        else:teatree(art,x,y,ground(d,l),rng.uniform(3.5,6.3),rng.uniform(0,6))
    for d in range(2180,14100,30):
        if d%3200>900:continue
        l=-12.;x,y,_=k.road.pos(d,l);z=ground(d,l)
        art.tube((x,y,z),.092,.069,3.6,lin(0x535D54),lin(0x677069),7)
        art.tube((x,y,z+3.58),.22,.11,.18,lin(0xA9A58F),lin(0x6B7067),8)
    # Eroded platforms run out from the cliff as stepped, overlapping fingers.
    for point in (7870,7995,15890):
        for j in range(12):
            d=point+j*1.12; l=-17-j*2.8
            z=max(.65,ground(d,-17)-.26*j)
            shelves(k,art,d,l,8.6-j*.22,z)
    for base in (7790,15830):
        for j in range(52):
            d=base+j*6;l=-22-rng.uniform(0,17);shelves(k,art,d,l,rng.uniform(4,10))
    return {'efforts':0}
