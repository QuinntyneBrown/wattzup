"""Girona on the Onyar, the wooded Gavarres climb and the sanctuary terrace."""
import math
import bpy
from functools import lru_cache
from worldkit import Painted, lin, smooth


def centre_line(course, theme, bc):
    stages = bc.stages(course["plan"])
    length = stages[-1]["to"]
    mean = sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    def bearing(d):
        # Broad river bend gives way to shorter turns climbing the Gavarres.
        return .24*math.sin(d/210) + .82*smooth(-50,130,d)-.82*smooth(140,340,d) + smooth(220,850,d)*(.65*math.sin(d/165)+.24*math.sin(d/74))
    samples = []
    x,y,z = -bc.LEAD_IN,0,0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        stage = bc.stage_at(stages, min(length-.01,max(0,d)))
        grade = (.2 + smooth(310,760,d)*(2.8+.35*(stage["level"]-mean)))*(1-smooth(length-140,length,d))
        h = bearing(d)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(bearing(d+1)-bearing(d-1))/2,g=grade))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
        z += bc.STEP*grade/100
    return samples,stages,length,mean,.35


def bank(d,side):
    river = (1-smooth(270,375,d))*smooth(7,9,side)*(1-smooth(33,35,side))
    slope = smooth(250,700,d)
    return -.22 - river*2.1 + slope*(max(0,-side-6)*.19 - max(0,side-6)*.22)


def land(road,col,theme,bc):
    b = bc.Builder("Gavarres slopes","terrain")
    b.colours = []
    offsets = (-270,-80,-24,-7,-4,4,7,9,33,35,65,150,320)
    for i in range(0,len(road.s)-1,2):
        j = min(i+2,len(road.s)-1)
        for left,right in zip(offsets,offsets[1:]):
            points = [(n,u) for n,u in ((i,left),(j,left),(j,right),(i,right))]
            ids = [b.v(road.at(n,u,bank(road.s[n]["d"],u))) for n,u in points]
            b.faces.append(tuple(ids))
            d = road.s[i]["d"]
            tint = 0x587C79 if left == 9 and d<305 else (0x9D947D if d<300 else 0x78815A)
            base = lin(tint)
            for n,u in points:
                f = .91+.09*math.sin(road.s[n]["d"]/70+u*.27)
                b.colours.append((*[v*f for v in base[:3]],1))
    return b.build(col),lambda x,y:0


THEME = {
    "lay":centre_line, "land_builder":land, "terrain":{"sea":False}, "land":{"mid":0x838965},
    "edge":"verge","centre":"white","kerbs":False,"sun_altitude":.59,"sun_azimuth":-.88,
    "sky":[0xEEDBC0,0xC6D9E1,0x95BDDB,0x75A6CF,0x5A93BE],
    "light":[0xFFE4B6,3.0],"fill":[0xDCE7EE,0x91825E],"haze":0xD9D9C5,
    "palette":{"asphalt":0x575756,"sand":0xA98D66},
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


def panorama(k):
    hills = Painted(k,"peaks")
    # The Pyrenees occupy a fixed skyline on the far side of the plain. Two
    # nearer ridgelines soften into the haze over the coast beyond the summit.
    for row,offset in enumerate((3800,2300)):
        points=[]
        for j in range(85):
            x=-4500+j*320
            y=offset+200*math.sin(j*.6)
            h=700+row*30+(350 if not row else 140)*abs(math.sin(j*.51)+.42*math.sin(j*1.8))
            points.append((x,y,h))
        for j,(a,b) in enumerate(zip(points,points[1:])):
            ca,cb=lin(0x8D9EAC if row==0 else 0x83948E),lin(0xBAC2BF if row==0 else 0xA5B0A3)
            hills.face(((a[0],a[1],-500),(b[0],b[1],-500),b,a),(ca,ca,cb,cb))
            hills.face((a,b,(b[0],b[1],-500),(a[0],a[1],-500)),(cb,cb,ca,ca))
            if row==0 and max(a[2],b[2])>1060:
                cap=(b[0],b[1]-5,b[2]-115)
                hills.face((a,b,cap),(lin(0xCFD5D5),lin(0xECF0EA),cb))
    (x,y,z),yaw=k.road.at(k.road.index(k.length)),k.s[k.road.index(k.length)]["h"]
    right=(math.sin(yaw),-math.cos(yaw))
    forward=(math.cos(yaw),math.sin(yaw))
    for row in range(3):
        strip=[]
        for j in range(49):
            across=(j-24)*115
            distance=1900+row*640
            px=x+forward[0]*distance+right[0]*across
            py=y+forward[1]*distance+right[1]*across
            strip.append((px,py,z-22+42*math.sin(j*.6+row)+17*math.sin(j*1.3)))
        shade=lin((0x899C86,0xA1ADA0,0xBBC6B5)[row])
        for a,b in zip(strip,strip[1:]):
            pts=(a,b,(b[0],b[1],z-300),(a[0],a[1],z-300))
            hills.face(pts,(shade,)*4);hills.face(pts[::-1],(shade,)*4)


def scenery(k):
    panorama(k)
    art = Painted(k)
    stone,tile,window = map(lin,(0xC7B49B,0x996347,0x405053))
    def site(d,side):
        i=k.road.index(d)
        return k.road.at(i,side,bank(k.s[i]["d"],side)),k.s[i]["h"]
    def house(d,side,width,height,colour):
        (x,y,z),yaw = site(d,side)
        art.box((x,y,z),(width,6,height),yaw,colour)
        art.roof((x,y,z+height),width,6,1.6,yaw,tile)
        face = -1 if side>0 else 1
        for floor in range(2,int(height)-1,3):
            for pane in (-.32,0,.32):
                a=pane*width
                u=x+a*math.cos(yaw)-face*3.03*math.sin(yaw)
                v=y+a*math.sin(yaw)+face*3.03*math.cos(yaw)
                art.box((u,v,z+floor),(1.05,.09,1.45),yaw,window)
    ochres = list(map(lin,(0xC99753,0xB76D53,0xDBB878,0xC28364,0xE5D3A4)))
    for d in range(-48,285,8):
        house(d,39,7.9,k.rng.uniform(8,15),k.rng.choice(ochres))
        if d<125: house(d,-13,7.9,k.rng.uniform(8,14),k.rng.choice(ochres))
    (x,y,z),yaw=site(108,59)
    art.box((x,y,z),(33,17,21),yaw,stone)
    art.roof((x,y,z+21),33,17,6,yaw,tile)
    for level,radius,height in ((0,4.8,23),(23,3.9,9),(32,3.1,5),(37,1.4,3)):
        art.tube((x+12,y-4,z+level),radius,radius*.93,height,stone,stone,8,stone)
    # Medieval walls rise above the quays. The crenellations break the skyline.
    for d in range(38,266,6):
        (x,y,z),yaw=site(d,52)
        art.box((x,y,z),(6.15,1.7,13.8),yaw,stone)
        for along in (-2,0,2):
            art.box((x+math.cos(yaw)*along,y+math.sin(yaw)*along,z+13.8),(.95,1.6,.75),yaw,stone)
    for d in (88,216):
        c,yaw=site(d,52)
        art.tube(c,3.6,3.4,17.4,stone,stone,8,stone)
    for d in range(330,2550,355):
        house(d, -22 if d%2 else 28,14,6.4,stone)
    for d in range(330,int(k.length)-100,9):
        for side in (-1,1):
            if side==1 and d%920<280: continue
            offset=side*k.rng.uniform(7,19)
            (x,y,z),yaw=site(d,offset)
            h=k.rng.uniform(4,7)
            pine = k.rng.random()<.34
            bark,foliage = map(lin,(0x8B5D43 if not pine else 0x766655,k.rng.choice((0x596D48,0x495F3D,0x748251))))
            if pine:
                h *= 1.44
            art.tube((x,y,z),.34,.19,h,bark,bark,6)
            if not pine and d%4:
                peeled=lin(0xAC6348)
                art.tube((x,y,z),.35,.27,h*.48,peeled,peeled,7)
            for j in range(3):
                a=j*math.tau/3+yaw
                p=(x+1.25*math.cos(a),y+1.25*math.sin(a),z+h-.4+j*.32)
                art.tube(p,1.75,2.15,1.0,foliage,foliage,7)
                art.tube((p[0],p[1],p[2]+1),2.15,.40,1 if pine else 2.1,foliage,foliage,7,foliage)
            # A second, less detailed stand adds depth between the roadside trunks.
            (tx,ty,tz),_ = site(d+4,side*k.rng.uniform(23,52))
            art.tube((tx,ty,tz),.4,.24,h*.9,bark,bark,5)
            art.tube((tx,ty,tz+h*.8),3.8,2.9,2.9,foliage,foliage,7,foliage)
    for d in range(400,int(k.length)-90,9):
        if d%200<88:
            c,yaw=site(d,-6.4)
            art.box(c,(9.1,.66,1.05),yaw,stone)
    for d in range(420,int(k.length)-120,23):
        c,yaw=site(d,5.9)
        art.box(c,(.16,.16,.95),yaw,lin(0xE2E0CB))
        art.box((c[0],c[1],c[2]+.74),(.17,.17,.11),yaw,lin(0xAF4638))
    for d in range(1000,int(k.length),1000):
        c,yaw=site(d,6.2)
        art.box(c,(.57,.38,1.13),yaw,lin(0xE6DFCC))
        art.box((c[0],c[1],c[2]+.84),(.59,.40,.25),yaw,lin(0xA7643A))
        right=(math.sin(yaw),-math.cos(yaw),0)
        face=(c[0]-.31*math.cos(yaw),c[1]-.31*math.sin(yaw),c[2]+.38)
        words(art,str(d//1000),face,right,(0,0,1),.26,.34,0x343D37)
        i=k.road.index(d-22)
        h=k.s[i]["h"]
        grade=k.s[i]["g"]/100
        words(art,("SOM-HI!","GIRONA","FORÇA")[d//1000%3],k.road.at(i,-.9,.035),
              (math.sin(h),-math.cos(h),0),(math.cos(h),math.sin(h),grade),1.3,3.8,0xD5C9A8)
    sanctuary(k,art,site)
    return {"efforts":0}


def sanctuary(k,art,site):
    (x,y,z),yaw = site(k.length+24,11)
    cs,sn = math.cos(yaw),math.sin(yaw)
    def pt(forward,left,up):
        return (x+forward*cs-left*sn,y+forward*sn+left*cs,z+up)
    def block(forward,left,up,length,width,height,tint):
        art.box(pt(forward,left,up),(length,width,height),yaw,lin(tint))
    def face(points,tint):
        coords=tuple(pt(*p) for p in points)
        art.face(coords,(lin(tint),)*len(coords))
        art.face(coords[::-1],(lin(tint),)*len(coords))
    # In real-04 the plain façade rises into a broad, clipped gable. Its only
    # opening above the portal is an oculus framed in honey-coloured stone.
    block(0,0,0,18,12,9.6,0xF2EBDD)
    outline=((-6,9.59),(-4.05,12.55),(3.68,12.55),(6,10.05),(6,9.59))
    for forward in (-9.02,9.02):
        face([(forward,l,h) for l,h in outline],0xF2EBDD)
    for (a,b),(c,d) in zip(outline[:3],outline[1:4]):
        face([(-9.32,a,b), (9.32,a,b),(9.32,c,d),(-9.32,c,d)],0xA8795B)
        face([(-9.33,a,b),(-9.33,c,d),(-9.33,c,d-.18),(-9.33,a,b-.18)],0xA79479)
    # Shallow pilasters, base stones and joints cast a thin shadow at the jambs.
    for l in (-5.72,4.9):
        block(-9.07,l,0,.19,.46,9.6,0xE3DCCB)
        block(-9.10,l,0,.27,.66,.38,0xC2B198)
    block(-9.09,0,0,.27,2.05,3.25,0x433930)
    for l in (-1.15,1.15):
        for course in range(8):
            block(-9.22,l,course*.40,.36,.37,.38,0xC7AF90 if course%3 else 0xAD9378)
        block(-9.25,l-.02,3.2,.40,.53,.16,0x8B7763)
    for h,w,tint in ((3.35,2.9,0xCCB99D),(3.55,3.23,0x927F6D),(3.73,2.87,0xE0D2B8)):
        block(-9.25,0,h,.53,w,.16,tint)
    face([(-9.28,-1.13,3.87),(-9.28,1.13,3.87),(-9.28,.55,4.52),(-9.28,0,5.13),(-9.28,-.55,4.52)],0xBCA88A)
    block(-9.33,0,3.96,.07,.42,.66,0x6A594A)
    def disc(h,r,depth,tint):
        for j in range(20):
            a=j*math.tau/20;b=(j+1)*math.tau/20
            face([(depth,0,h),(depth,r*math.cos(a),h+r*math.sin(a)),(depth,r*math.cos(b),h+r*math.sin(b))],tint)
    disc(8.3,.68,-9.13,0xBBAB91)
    disc(8.3,.47,-9.17,0x4A4940)
    for side in (-1,1):
        block(-9.19,side*.15,7.92,.09,.043,.79,0x958B75)
    block(-8.9,0,12.56,.08,.09,1.05,0x635C50)
    block(-8.9,0,13.15,.08,.59,.08,0x635C50)
    block(4,-4.1,9.2,2.2,1.8,4.2,0xBEAB90)
    block(2.88,-4.1,11.68,.08,.88,1.18,0x524940)
    # The adjoining guest house and its iron balconies enclose the far edge.
    block(9,-10,0,8,13,8.1,0xE7E1D3)
    for level in (0,3.2,6.1):
        for l in (-15,-12.4,-9.8,-7.2):
            block(4.95,l,level+.54,.12,.94,1.23,0x564F42)
            if level==3.2:
                block(4.63,l,level+.36,.74,1.6,.14,0xAC9E89)
                for u in (-.64,-.32,0,.32,.64):
                    block(4.26,l+u,level+.5,.045,.045,.67,0x4C4B42)
                block(4.26,l,level+1.17,.06,1.42,.06,0x4C4B42)
    for j in range(4):
        block(-9.6-j*.38,0,-.08*j,.42,3.9+j*.28,.12,0xC6BCA7)
