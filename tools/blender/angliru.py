"""The Sierra del Aramo above Riosa, ending at the summit of the Angliru."""
import math
from functools import lru_cache
import bpy
from worldkit import Painted, lin, smooth

CRUX=14975


def route(course,theme,bc):
    st=bc.stages(course["plan"])
    length=st[-1]["to"]
    mean=sum((s["to"]-s["from"])*s["level"] for s in st)/length
    def yaw(d):
        return .7*math.sin(d/185)+.48*math.sin(d/420)+.22*math.sin(d/85)
    samples=[]
    x,y,z=-bc.LEAD_IN,0,0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=bc.stage_at(st,min(length-.01,max(0,d)))
        g=(2.7+.47*(stage["level"]-10)+1.1*math.sin(d/540))*(1-.8*smooth(length-750,length,d))
        blend=smooth(CRUX-210,CRUX-75,d)*(1-smooth(CRUX+65,CRUX+210,d))
        g+=blend*(23.5-g)
        h=yaw(d)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(yaw(d+1)-yaw(d-1))/2,g=g))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*g/100
    return samples,st,length,mean,.47


def slope(d,side):
    distance=max(0,abs(side)-5)
    lift=distance*(.22+.11*math.sin(d/590))
    return -.17+(lift if side<0 else -lift)


def land(road,col,theme,bc):
    b=bc.Builder("Aramo pasture","terrain")
    b.colours=[]
    sides=(-270,-110,-55,-24,-9,-4,4,9,22,48,87,240)
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for left,right in zip(sides,sides[1:]):
            pts=[(i,left),(j,left),(j,right),(i,right)]
            b.faces.append(tuple(b.v(road.at(n,u,slope(road.s[n]["d"],u))) for n,u in pts))
            for n,u in pts:
                d=road.s[n]["d"]
                base=lin(0x788755 if d<10500 else 0x879267)
                f=.82+.13*math.sin(d/155+u/43)+.05*math.sin(u/13)
                b.colours.append((*[q*f for q in base[:3]],1))
    return b.build(col),lambda x,y:0


THEME={
    "lay":route,"land_builder":land,"land":{"mid":0x758262},"terrain":{"sea":False},
    "edge":"angliru","kerbs":False,"wet":.45,"haze":0xCBD0CD,"sky":[0xD4D6D3,0xBCC4C7,0x9CA9AF,0x87979F,0x768994],
    "light":[0xE8E6D8,2.4],"fill":[0xD4DDE1,0x77826E],"sun_altitude":.45,
    "palette":{"asphalt":0x545653,"sand":0x887B64},
}
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


def camper(b,x,y,z,yaw):
    cs,sn=math.cos(yaw),math.sin(yaw)
    def pos(u,v,h):
        return x+u*cs-v*sn,y+u*sn+v*cs,z+h
    white,glass = lin(0xF0EBDA),lin(0x4F6573)
    b.box(pos(0,0,.38),(5.5,2.2,2.2),yaw,white)
    b.box(pos(3.1,0,.46),(1.45,2.12,1.65),yaw,white)
    b.box(pos(2.65,0,2.12),(1.55,2.16,.52),yaw,white)
    for side in (-1,1):
        for u in (-1.35,.35,2.9):
            b.box(pos(u,side*1.11,1.35),(1.0,.09,.61),yaw,glass)
        b.box(pos(-.15,side*1.11,.97),(5,.1,.14),yaw,lin(0x417C86))
        for u in (-1.7,2.35):
            b.box(pos(u,side*1.06,0),(.76,.34,.74),yaw,lin(0x323437))


def fan(k,b,x,y,z,yaw,orange):
    rng=k.rng
    tall=rng.uniform(.9,1.12)
    skin=lin(rng.choice((0xB78264,0xE4B696,0x936B55)))
    shirt=lin(rng.choice((0xED6B22,0xF68423,0xCF521F) if orange else (0x446C91,0xF0D768,0xBA5648,0xDDDCCF)))
    # Face the passing riders. Separate shoes, knees, sleeves and raised hands
    # keep the two lines of fans readable in silhouette against the ridge.
    def point(u,v,h):
        return (x+u*math.cos(yaw)-v*math.sin(yaw),
                y+u*math.sin(yaw)+v*math.cos(yaw),z+h*tall)
    shorts=lin(rng.choice((0x454B55,0x546378,0x62605C)))
    for side in (-1,1):
        u=side*.102
        foot=rng.uniform(-.11,.09)
        b.box(point(u,foot,0),(.137,.264,.088),yaw,lin(0x514F4B))
        b.tube(point(u,foot,.08),.061,.081,.39*tall,skin,skin,7)
        b.tube(point(u,0,.45),.083,.102,.35*tall,shorts,shorts,7)
    b.tube(point(0,0,.77),.18,.224,.54*tall,shirt,shirt,8)
    b.tube(point(0,0,1.30),.084,.081,.10*tall,skin,skin,7)
    b.tube(point(0,0,1.39),.12,.105,.20*tall,skin,skin,8,skin)
    for side in (-1,1):
        lift=rng.uniform(.18,.55)
        b.box(point(side*.221,0,1.12),(.132,.16,.18),yaw,shirt)
        b.tube(point(side*.253,0,1.15),.059,.05,lift*tall,skin,skin,7,skin)
    if rng.random()<.38:
        b.tube((x,y,z+1.58*tall),.16,.13,.08,shirt,shirt,8,shirt)



def scenery(k):
    art=Painted(k)
    def site(d,side):
        i=k.road.index(d)
        return k.road.at(i,side,slope(d,side)),k.s[i]["h"]
    ridge(k)
    cream,stone,slate=map(lin,(0xE1DBC7,0xA19D8A,0x635F54))
    for d in range(-40,8400,13):
        for side in (-1,1):
            if side>0 and d%850<230:continue
            offset=side*k.rng.uniform(6,21)
            (x,y,z),yaw=site(d,offset)
            h=k.rng.uniform(5.0,9.2)
            art.tube((x,y,z),.38,.25,h,lin(0x756D59),lin(0x817962),7)
            for j in range(4):
                a=j*1.62+yaw
                cx=x+1.8*math.cos(a);cy=y+1.8*math.sin(a)
                green=lin(k.rng.choice((0x4E6943,0x687B4F,0x587549,0x6D8053)))
                art.tube((cx,cy,z+h-.9+j*.4),1.7,2.7,1.28,green,green,8)
                art.tube((cx,cy,z+h+.38+j*.4),2.7,.3,2.4,green,green,8,green)
    for d in range(150,int(k.length)-200,6):
        if d%470<170:
            (x,y,z),yaw=site(d,6)
            art.box((x,y,z),(6.1,.77,.87),yaw,stone)
    for d in [57,98,246,*range(480,13200,390)]:
        (x,y,z),yaw=site(d,7.5 if d<300 else 14)
        animal(art,x,y,z,yaw,k.rng,d%7<2)
    for d in (300,3610,6870):
        (x,y,z),yaw=site(d,-8.5)
        for u,v in ((-2,-2),(-2,2),(2,-2),(2,2)):
            art.tube((x+u,y+v,z),.4,.25,1.2,stone,stone,7,stone)
        art.box((x,y,z+1.2),(5.8,5.8,2.5),0,lin(0x715743))
        art.roof((x,y,z+3.7),5.9,5.9,1.9,0,slate)
    for d in range(13900,15260,4):
        for side in (-1,1):
            off=side*k.rng.uniform(2.35,4.1)
            (x,y,z),yaw=site(d,off)
            fan(k,art,x,y,z,yaw,False)
            if d%60==0:asturias(art,x,y,z,yaw)
        if (d-13900)%112==0:
            (x,y,z),yaw=site(d,-8.2)
            camper(art,x,y,z,yaw)
    for d in range(1000,int(k.length),1000):
        (x,y,z),yaw=site(d,4.6)
        art.box((x,y,z),(.23,1.26,1.15),yaw,cream)
        words(art,str(d//1000)+" km",(x-.14*math.cos(yaw),y-.14*math.sin(yaw),z+.50),
              (math.sin(yaw),-math.cos(yaw),0),(0,0,1),.31,1.12,0x3B443C)
    for d,text in ((520,"RIOSA"),(14185,"CONTADOR"),(14335,"ROGLIČ"),(14864,"VUELTA"),(14240,"VAMOS"),(14825,"CUEÑA"),(14952,"23.5%"),(15070,"ANGLIRU"),(17420,"META")):
        i=k.road.index(d)
        h=k.s[i]["h"]
        words(art,text,k.road.at(i,-.6,.045),(math.sin(h),-math.cos(h),0),
              (math.cos(h),math.sin(h),k.s[i]["g"]/100),1.42,4.4,0xE6DDA9)
    for d,label in ((CRUX-62,"CUEÑA LES CABRES"),(k.length-8,"ALTO DE L’ANGLIRU")):
        (x,y,z),yaw=site(d,-4.5)
        for a in (-1.3,1.3):
            art.box((x-a*math.sin(yaw),y+a*math.cos(yaw),z),(.11,.11,2.9),yaw,slate)
        art.box((x,y,z+1.4),(.15,3.55,1.45),yaw,cream)
        front=(x-.11*math.cos(yaw),y-.11*math.sin(yaw))
        right=(math.sin(yaw),-math.cos(yaw),0)
        words(art,label,(*front,z+2.33),right,(0,0,1),.35,3.25,0x475348)
        words(art,"23.5%" if d<k.length-10 else "1,570 m",(*front,z+1.65),right,(0,0,1),.48,2.6,0x454E45)
    return {"efforts":0}


def ridge(k):
    """Fixed overlapping Aramo ridgelines. Exposed pale limestone breaks through the turf."""
    art=Painted(k,"peaks")
    for side,offset in ((-1,340),(1,610)):
        previous=None
        for d in range(-250,20501,52):
            i=k.road.index(d)
            sample=k.s[i]
            # Use a world-aligned ridge, so it never follows the local direction of a bend.
            x=sample["x"]+max(0,d-k.length)
            y=side*(offset+76*math.sin(d/525))
            base=sample["z"]-105
            high=base+210+78*math.sin(d/354)+38*math.sin(d/107)+16*math.sin(d/34)
            rows=[(x,y-side*110,base),(x,y-side*58,high-56),(x,y-side*18,high-21),(x,y,high)]
            if previous:
                for j in range(3):
                    c=lin((0x808E78,0x9C9F92,0xB2B3A6)[j])
                    shade=tuple(q*(.91+.065*math.sin(d/84)) for q in c[:3])+(1,)
                    quad=(previous[j],rows[j],rows[j+1],previous[j+1])
                    art.face(quad if side>0 else quad[::-1],(shade,c,c,shade))
            previous=rows

def animal(art,x,y,z,yaw,rng,horse):
    scale=rng.uniform(.88,1.14)
    def pt(u,v,h):
        u*=scale;v*=scale
        return x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h*scale
    coat=lin(rng.choice((0x534A42,0xDDDCD2) if horse else (0x9D7150,0xA67E58,0x825F46)))
    for u in (-.63,.64):
        for v in (-.26,.26):
            art.tube(pt(u,v,0),.085,.12,.81*scale,coat,coat,6)
    art.box(pt(0,0,.68),(1.72*scale,.67*scale,.62*scale),yaw,coat)
    art.box(pt(.84,0,.9),(.45,.43,.73 if horse else .45),yaw,coat)
    art.box(pt(1.18,0,1.27 if horse else .87),(.56,.36,.35),yaw,coat)


def asturias(art,x,y,z,yaw):
    pole=lin(0x716F62);blue=lin(0x307DC0);gold=lin(0xE8BB47)
    art.tube((x,y,z),.036,.028,3.4,pole,pole,6)
    def pt(u,h):
        return (x+u*math.cos(yaw)-math.sin(u*4)*.06*math.sin(yaw),
                y+u*math.sin(yaw)+math.sin(u*4)*.06*math.cos(yaw),z+h-u*.06)
    for j in range(6):
        u=j*.2;v=u+.2
        for a,b,col in ((2.52,2.88,blue),(2.88,3.00,gold if j<5 else blue),(3.00,3.35,blue)):
            pts=(pt(u,a),pt(v,a),pt(v,b),pt(u,b))
            art.face(pts,(gold if j==2 else col,)*4);art.face(pts[::-1],(gold if j==2 else col,)*4)
