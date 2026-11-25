"""A Jamaican coffee road between Mavis Bank, Hagley Gap and the cloud forest."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector,kdtree
from worldkit import Painted,lin,smooth

HALF_WIDTH=2.13
TURNS=((3550,1),(3920,-1),(6750,1),(7030,-1),(9870,1),(10270,-1))


def bearing(d):
    h=.35*math.sin(d/379)+.23*math.sin(d/153)+.10*math.cos(d/81)
    for start,sign in TURNS:h+=sign*2.78*smooth(start,start+62,d)
    return h-.92*math.exp(-((d-12930)/220)**2)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    chain=[i*bc.STEP-bc.LEAD_IN for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1)]
    raw=[]
    for d in chain:
        stage=bc.stage_at(stages,max(0,min(length-.01,d)))
        raw.append((4.9+1.07*(stage['level']-mean)+1.3*math.sin(d/281)) if 0<=d<length else 0)
    grades=bc.box_smooth(raw,max(1,round(24/bc.STEP)))
    x,y,z=-bc.LEAD_IN,0,615;samples=[]
    for d,g in zip(chain,grades):
        h=bearing(d);samples.append(dict(d=d,x=x,y=y,z=z,h=h,g=g,k=bearing(d+.5)-bearing(d-.5)))
        mid=bearing(d+bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid);z+=bc.STEP*g/100
    return samples,stages,length,mean,1.07


def edge(d,side):
    chips=.19*math.sin(d*.43+side*.8)+.12*math.sin(d*.77)
    return side*(HALF_WIDTH+chips*.48)


def road(road,st,length,col,bc):
    t=bc.Builder('Road','asphalt');patch=bc.Builder('Shoulder','terrain');patch.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d'];e=road.s[i+1]['d']
        t.quad(road.at(i,edge(d,-1)),road.at(i+1,edge(e,-1)),road.at(i+1,edge(e,1)),road.at(i,edge(d,1)))
        if (math.sin(d*.32)+math.sin(d*.054))>1.19:
            l=.64+math.sin(d*.13)*.59
            patch.quad(road.at(i,l-.44,.019),road.at(i+1,l-.21,.021),road.at(i+1,l+.47,.019),road.at(i,l+.35,.018))
            patch.colours.extend((lin(0x504B42),lin(0x413E37),lin(0x45413A),lin(0x5F584C)))
        if i%7 in (0,1,2):
            side=1 if (i//7)%2 else -1
            width=.19+.13*math.sin(i*1.3)
            patch.quad(road.at(i,edge(d,side)-side*width,.028),road.at(i+1,edge(e,side)-side*width*.38,.023),
                       road.at(i+1,edge(e,side)+side*.23,.018),road.at(i,edge(d,side)+side*.30,.018))
            patch.colours.extend(lin(c) for c in (0x67604C,0x8F8266,0x94886D,0x6E6A55))
        if i%61==13:
            lane=.95*math.sin(i*1.93)
            border=[road.pos(d+u,lane+v,.037) for u,v in ((-.39,-.21),(.14,-.34),(.62,-.13),(.51,.16),(-.10,.26),(-.47,.09))]
            centre=road.pos(d+.08,lane,.039)
            for j in range(6):
                patch.faces.append(tuple(patch.v(v) for v in (border[j],border[(j+1)%6],centre)))
                patch.colours.extend((lin(0xA08F73),lin(0x736B5B),lin(0x443F38)))
    t.build(col);patch.build(col)


def forest_colour(x,y,z):
    t=math.sin(x/51+y/27)+.67*math.cos(y/23-x/46)+.24*math.sin(x/11)
    return 0x637D48 if t>.75 else (0x526F43 if t>-.3 else (0x5B7555 if z>1000 else 0x737E4E))

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
            weighted+=factor*(p['z']+.53*(y-p['y']))
            total+=factor
        _,j,r=road.tree.find((x,y,0))
        p=road.s[j]
        shape=(7*math.sin(x/79+y/55)+4*math.cos(y/21-x/46))*smooth(13,95,r)
        general = weighted/total + shape
        # Cut the wide grid beneath the complete carriageway even at sharp changes of direction.
        near_road = p['z'] - 3.4 - .09*r
        return near_road + smooth(13,49,r)*(general-near_road)
    b=bc.Builder('Yallahs valley and cloud forest','terrain');b.colours=[]
    cells=set()
    for p in road.s[::12]:
        gx,gy=int(p['x']//22),int(p['y']//22)
        for dx in range(-11,12):
            for dy in range(-15,16):cells.add((gx+dx,gy+dy))
    @lru_cache(maxsize=None)
    def vertex(ix,iy):
        x,y=22*ix,22*iy
        z=height(x,y)
        colour=forest_colour(x,y,z)
        return (x,y,z),lin(colour)
    for ix,iy in sorted(cells):
        corners=[vertex(ix+dx,iy+dy) for dx,dy in ((0,0),(1,0),(1,1),(0,1))]
        b.quad(*(v for v,c in corners));b.colours.extend(c for v,c in corners)
    # Continuous shoulders meet the tarmac; the wider mesh falls below the cut.
    for i in range(len(road.s)-1):
        for side in (-1,1):
            for inner,outer in ((-.15,6.9),(6.9,14.0)):
                corners=[]
                for j,w in ((i,inner),(i+1,inner),(i+1,outer),(i,outer)):
                    d=road.s[j]['d']; l=side*(HALF_WIDTH+w)
                    x,y,z=road.at(j,l)
                    lip=z-.12-.05*max(0,abs(l)-HALF_WIDTH)
                    blend=smooth(6.9,14,w)
                    corners.append((x,y,lip+blend*(height(x,y)-lip+.31)))
                if side<0:corners.reverse()
                b.quad(*corners);b.colours.extend(lin(forest_colour(*v)) for v in corners)
    sea=bc.Builder('Caribbean Sea','sea')
    sea.quad((-12000,-12000,0),(20000,-12000,0),(20000,2000,0),(-12000,2000,0));sea.build(col)
    return b.build(col),height


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


THEME={'lay':route,'land_builder':land,'road_builder':road,'road_half_width':HALF_WIDTH,
       'terrain':{'sea':True},'land':{'mid':0x638756},'sky':[0xD0DDD6,0xB1CED3,0x8EB6C7,0x77A4BB,0x6797B0],
       'haze':0xACC2BD,'light':[0xFFF0C1,2.8],'fill':[0xD1E1D9,0x919575],'wet':.12,
       'sun_altitude':.64,'sun_azimuth':-.85,'palette':{'asphalt':0x5B564E},'chunks':{'Land':2}}


def canopy(art,x,y,z,r,h,a,tint):
    base=[];middle=[];top=[]
    for j in range(8):
        t=a+j*math.tau/8;w=r*(1+.14*math.sin(3*t+.47*a))
        base.append((x+.67*w*math.cos(t),y+.59*w*math.sin(t),z-.16*h))
        middle.append((x+w*math.cos(t),y+.91*w*math.sin(t),z+.30*h))
        top.append((x+.44*w*math.cos(t),y+.40*w*math.sin(t),z+h))
    shade=lin(tint);dark=tuple(c*.71 for c in shade[:3])+(1.,)
    for i in range(8):
        n=(i+1)%8;art.face((base[i],base[n],middle[n],middle[i]),(dark,dark,shade,shade))
        art.face((middle[i],middle[n],top[n],top[i]),(dark,shade,shade,shade))
    art.face(top,(shade,)*8)
    # Small irregular groups of leaves interrupt the smooth edge of each crown.
    for j in range(12):
        t=a+j*2.399;v=(j%4)/4;rr=r*(.65+.29*math.sin(t*3.13)**2)
        u=x+math.cos(t)*rr;w=y+math.sin(t)*rr*.87;zz=z+h*(.10+v)
        long=.21*r;wide=.09*r
        mid=(u,w,zz+.08*h);tip=(u+long*math.cos(t),w+long*math.sin(t),zz-.14*h)
        elbow=(u-wide*math.sin(t),w+wide*math.cos(t),zz+.02*h)
        shoulder=(u+wide*math.sin(t),w-wide*math.cos(t),zz+.01*h)
        light=tuple(min(1,c*(1.12+.23*v)) for c in shade[:3])+(1.,)
        art.face((mid,elbow,tip,shoulder),(light,shade,dark,light))
        art.face((shoulder,tip,elbow,mid),(shade,dark,shade,light))


def fronds(art,x,y,z,h,seed,banana):
    trunk=lin(0x857953 if banana else 0x655F46)
    art.tube((x,y,z),h*.044,h*.025,h,trunk,lin(0x969364),8)
    for j in range(8):
        a=seed+j*2.41;r=h*(.60+.14*math.sin(j*1.3));c,s=math.cos(a),math.sin(a)
        def p(t,width,up):
            return x+c*t*r-s*width,y+s*t*r+c*width,z+h+up*h
        for n in range(4):
            t=n/4;u=(n+1)/4
            def arch(v):return .24*math.sin(v*math.pi)-.13*v
            a0,a1=p(t,0,arch(t)),p(u,0,arch(u))
            leaf=lin((0x4E8048,0x638B52,0x78994D)[(j+n)%3])
            for side in (-1,1):
                w=side*h*(.133 if banana else .089)
                if banana:
                    face=(a0,a1,p(u,w*math.sin(math.pi*u),arch(u)-.037),p(t,w*math.sin(math.pi*t),arch(t)-.037))
                    art.face(face,(leaf,)*4);art.face(face[::-1],(leaf,)*4)
                else:
                    for k in range(3):
                        v=t+(u-t)*k/3;tip=p(v+.09,w*(1-.65*v),arch(v)-.035)
                        face=(p(v,0,arch(v)),p(v+.05,0,arch(v+.05)),tip)
                        art.face(face,(leaf,)*3);art.face(face[::-1],(leaf,)*3)


def tree(art,x,y,z,h,seed,flowers=False):
    trunk=lin(0x746D51);art.tube((x,y,z),h*.045,h*.019,h*.71,trunk,lin(0x827857),7)
    for i in range(4):
        a=seed+i*2.38;xx=x+.27*h*math.cos(a);yy=y+.28*h*math.sin(a);zz=z+h*(.65+.11*math.sin(2*a))
        beam(art,(x,y,z+h*.49),(xx,yy,zz),h*.055,h*.059,trunk)
        canopy(art,xx,yy,zz,.32*h,.23*h,a,0x496D42 if i%2 else 0x587A4B)
        if flowers:
            for j in range(3):canopy(art,xx+math.cos(j*2.6)*h*.17,yy+math.sin(j*2.6)*h*.15,zz+.15*h,.065*h,.048*h,a+j,0xCC6944 if j%2 else 0xBE543C)


def farm(k,art,start,end,side):
    for row in range(6):
        l=side*(7.2+3.5*row);off=side*1.55
        for d in range(start,end,4):
            x,y,z=k.road.pos(d,l);xx,yy,zz=k.road.pos(d+4,l)
            lift=.18+row*.96
            plinth=[k.road.pos(s,v,lift) for s,v in ((d,l-off),(d+4,l-off),(d+4,l+off),(d,l+off))]
            co=lin(0x736E4A if row%2 else 0x79734A);art.face(plinth if side>0 else plinth[::-1],(co,)*4)
            a,b=plinth[:2];aa=(a[0],a[1],a[2]-1.28);bb=(b[0],b[1],b[2]-1.28)
            art.face((a,b,bb,aa),(co,co,lin(0x635B43),lin(0x665C45)));art.face((aa,bb,b,a),(co,)*4)
            canopy(art,x,y,z+lift+.26,1.58,1.07,d*.032,0x416939 if row%2 else 0x4C753F)
            if row==0:
                for j in range(5):
                    u=x+1.02*math.cos(j*1.8);v=y+1.03*math.sin(j*1.8)
                    canopy(art,u,v,z+lift+.84,.23,.10,j,0x679049)
                    art.tube((u-.03,v,z+lift+.68),.059,.060,.14,lin(0xB44037),lin(0xDA5840),6)


def building(k,art,d,l,label,mode):
    x,y,z=k.road.pos(d,l);a=bearing(d);c,s=math.cos(a),math.sin(a)
    def p(u,v,h):return x+c*u-s*v,y+s*u+c*v,z+h
    front=-1 if l>0 else 1;w,depth=(15,7.7) if mode=='works' else (7.3,4.7)
    hue={'works':0xC2C8B5,'church':0xD3CFAC,'shop':0xD5B14E,'home':0x80A89B}[mode]
    art.box(p(0,0,-.65),(w,depth,4.4),a,lin(hue))
    art.roof(p(0,0,3.73),w+.65,depth+.44,1.65,a,lin(0x8B9693 if mode=='works' else 0x9B7263))
    for u in (-w*.31,w*.31):
        art.box(p(u,front*(depth/2+.06),1.13),(1.57,.116,1.66),a,lin(0x587780))
        for off in (-1,1):art.box(p(u+off*.91,front*(depth/2+.08),1.13),(.30,.12,1.72),a,lin(0x528B71))
    art.box(p(0,front*(depth/2+.12),.18),(1.48,.17,2.24),a,lin(0x536657))
    if mode=='church':
        art.box(p(-w*.39,0,3.7),(2.05,2.0,2.58),a,lin(hue))
        art.roof(p(-w*.39,0,6.25),2.36,2.38,1.88,a,lin(0x87756C))
        beam(art,p(-w*.39,0,8),p(-w*.39,0,9.02),.10,.11,lin(0x665F50))
        beam(art,p(-w*.39-.3,0,8.72),p(-w*.39+.3,0,8.72),.10,.11,lin(0x665F50))
    if label:
        art.box(p(0,front*(depth/2+.14),2.78),(w*.87,.17,.80),a,lin(0x47765E))
        words(art,label,p(0,front*(depth/2+.25),2.94),(-front*c,-front*s,0),(0,0,1),.52,w*.80,0xF6DB95)
    if mode in ('shop','works','church'):
        # Incoming riders see the gable before the longer sign on the road-facing side.
        face_x=-w/2-.10
        art.box(p(face_x,0,3.00),(.18,depth*.96,1.07),a,lin(0x31534B))
        words(art,label,p(face_x-.105,0,3.32),(s,-c,0),(0,0,1),.51,depth*.89,0xFFE1A0)
    if mode=='shop':
        for i in range(3):
            art.box(p(0,front*(depth/2+.28),.75+i*.21),(w*.96,.20,.18),a,lin((0xA64237,0xD8A54E,0x427C57)[i]))
        art.box(p(-1,front*(depth/2+.53),1.12),(3.10,1.02,.16),a,lin(0x996F46))
        for j in range(12):
            u=-2.34+.25*j
            art.tube(p(u,front*(depth/2+.60),1.28),.096,.074,.21+.04*(j%3),lin(0x8B563C),lin((0xC5973D,0xA65436,0x6A915B)[j%3]),6)
        art.box(p(0,front*(depth/2+.71),2.61),(w+.34,1.5,.16),a,lin(0xB35645))
    if mode=='works':
        for j in range(6):
            u=-w*.4+j*w*.16
            art.box(p(u,front*(depth/2+.07),1.31),(1.32,.18,.95),a,lin(0x516967))
        for j in range(5):
            q=d+15+j*3.2;x0,y0,z0=k.road.pos(q,l);art.box((x0,y0,z0-.20),(2.96,6.0,.40),a,lin(0xB4AA91))
            art.box((x0,y0,z0+.21),(2.64,5.66,.047),a,lin((0x987454,0xAD906C,0xA18060)[j%3]))


def scenery(k):
    art=Painted(k);rng=k.rng
    for start,end,side in ((140,300,1),(590,780,1),(900,1040,-1),(2560,2690,1),(5140,5320,1),(7420,7540,-1),(11100,11300,1)):
        farm(k,art,start,end,side)
    building(k,art,108,9.1,'MAVIS BANK','works');building(k,art,1540,-7.7,'ROOTS YARD','shop')
    building(k,art,6336,11.5,'HAGLEY GAP','church');building(k,art,8860,-9,'COFFEE & FOOD','shop')
    for base in (140,1460,6180,8890):
        for j in range(7):
            if base==140 and j<5:continue
            building(k,art,base+j*17,rng.choice((-1,1))*(13+2*math.sin(j)),None,'home')
    for d in range(16,14560,13):
        l=rng.choice((-1,1))*rng.uniform(3.8,15.2);x,y,z=k.road.pos(d,l)
        if any(a<d<b for a,b in ((83,154),(585,787),(1500,1575),(6285,6375))):continue
        if abs(l)>9:z=k.height_at(x,y)+.3
        h=rng.uniform(4.4,9.6);a=rng.uniform(0,6);species=rng.randrange(7)
        if species<2:fronds(art,x,y,z,h*.66,a,species==0)
        elif species==2:
            for j in range(6):
                u=x+math.cos(j*2)*.83;v=y+math.sin(j*2)*.67
                beam(art,(u,v,z),(u+.38*math.cos(j),v+.58*math.sin(j),z+h),.15,.15,lin(0x728651))
                canopy(art,u,v,z+h-.47,.65,.61,j,0x6C8857)
        else:tree(art,x,y,z,h,a,species==3)
    # Mid-distance canopy follows the cut and the ravines, with gaps at the village lookouts.
    for d in range(18,14555,6):
        if any(abs(d-c)<38 for c in (108,1540,6336,8860)):continue
        side=-1 if d%4 else 1
        if 12600<d<13250 and side<0:continue
        lateral=side*rng.uniform(10,42)
        x,y,_=k.road.pos(d,lateral);z=k.height_at(x,y)
        height=rng.uniform(5.9,12.7);a=rng.uniform(0,6.28)
        if d%30==0:fronds(art,x,y,z,height*.65,a,True)
        else:
            art.tube((x,y,z),height*.036,height*.02,height*.75,lin(0x6B6951),lin(0x767855),6)
            canopy(art,x,y,z+height*.67,height*.39,height*.31,a,(0x476C49,0x5E8053,0x4F775C)[int(d/6)%3])
    for d in range(5,14540,4):
        l=rng.choice((-1,1))*rng.uniform(2.4,5.7)
        x,y,z=k.road.pos(d,l,-.21)
        for j in range(4):
            a=j*2.39+d;h=.21+.19*(1+math.sin(a));xx=x+.29*math.cos(a);yy=y+.24*math.sin(a)
            face=((xx-.12,yy,z),(xx+.13,yy+.02,z),(xx+.31*math.cos(a),yy+.33*math.sin(a),z+h))
            colour=lin((0x72834E,0x899851,0x53744C)[j%3]);art.face(face,(colour,)*3);art.face(face[::-1],(colour,)*3)
    for d in range(75,14480,15):
        if d%490>132:continue
        for offset in (0,.36):
            a=k.road.pos(d,2.56+offset,-.02);b=k.road.pos(d+15,2.56+offset,-.02)
            beam(art,a,b,.10,.09,lin(0x7E7866))
    distant=Painted(k,'peaks')
    for row,y in enumerate((1040,1980,-1900)):
        prev=None
        for i in range(165):
            x=-1800+i*105
            high=720+row*135+130*math.sin(i*.20)+79*math.sin(i*.47)+40*math.cos(i*.78)
            if row in (0,1):high+=690*math.exp(-((x-10350-row*470)/1090)**2)
            else:high-=600
            sign=1 if y>0 else -1
            pts=((x,y-sign*410,-10),(x+13,y-sign*260,high*.57),(x-13,y-sign*145,high*.82),(x,y,high))
            if prev:
                for j in range(3):
                    face=(prev[j],pts[j],pts[j+1],prev[j+1]);color=lin((0x647F6C,0x748E80,0x849C96)[row])
                    distant.face(face if sign>0 else face[::-1],(color,)*4)
            prev=pts
    for j in range(66):
        x=9000+j*31;y=-1340-250*math.sin(j*.61)
        distant.box((x,y,11),(15+j%5*3,12+j%7*2,8+(j*17)%32),.15,lin(0xA5AEA7))
    return {'efforts':0}
