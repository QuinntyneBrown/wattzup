"""Bondi to Bronte on the eastern Sydney sandstone headlands."""
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

COVES=((103,251,64),(2235,235,53),(3476,322,62),(5610,238,50))
POOLS=((483,50,20),(6093,37,16))


def curve(d):
    h=.21*math.sin(d/261)+.19*math.sin(d/97)
    for centre,radius,_ in COVES:
        h+=.75*math.sin((d-centre)/radius*1.72)*math.exp(-((d-centre)/radius)**2)
    for where in (397,4432,6010):
        h-=.62*math.exp(-((d-where)/68)**2)
    # Look out toward the swimming pool before the track bends back along the cut.
    for start,apex,end in ((310,399,498),(4310,4420,4545),(5900,6035,6128)):
        h-=.62*(smooth(start,apex,d)-smooth(apex,end,d))
    return h


def height(d):
    z=22+5*math.sin(d/206)+2.8*math.cos(d/92)
    for centre,radius,_ in COVES:z-=13.2*math.exp(-((d-centre)/radius)**2)
    for centre in (483,6093):z-=9.0*math.exp(-((d-centre)/95)**2)
    # Descend to the swimming-club terrace on a long ramp. The pool can be
    # seen across the next headland from the saddle, even behind the safety rail.
    for lo,low,high,end in ((249,433,505,726),(5850,6010,6120,6270)):
        view=smooth(lo,low,d)*(1-smooth(high,end,d))
        z+=(8.2-z)*view
    return z


def route(config,theme,bc):
    stages=bc.stages(config['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x,y=-bc.LEAD_IN,0;samples=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            mid=curve(d-bc.STEP/2);x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=curve(d),k=curve(d+.5)-curve(d-.5),g=(height(d+.5)-height(d-.5))*100))
    return samples,stages,length,mean,0


def sand(d):
    return max(math.exp(-((d-c)/r)**2) for c,r,_ in COVES)


def shore(d):
    return 16+5*math.sin(d/80)+sum(width*math.exp(-((d-c)/r)**2) for c,r,width in COVES)


def ground(d,l):
    z=height(d)
    if l>=-2.2:
        return z-.13+max(0,l-4)*(.30+.17*math.sin(d/190))
    out=-l-2.2
    toe=shore(d)
    # Sand sweeps gradually into the bay. Outside the coves a sandstone lip drops onto a tidal platform.
    ramp=1-smooth(0,toe*1.04,out)
    cliff=1-smooth(toe*.40,toe*.76,out)
    z=.31+(z-.44)*(ramp*sand(d)+cliff*(1-sand(d)))
    for lo,hi in ((322,537),(5915,6155)):
        view=smooth(lo,lo+35,d)*(1-smooth(hi-15,hi+36,d))
        rim=1.10+(height(d)-1.23)*(1-smooth(0,9.5,out))
        z+=(min(z,rim)-z)*view
    return z-.12*max(0,out-toe)-.065*math.sin(d*.17+out*.51)


def land(road,col,theme,bc):
    b=bc.Builder('Bondi headlands and beaches','terrain');b.colours=[]
    for i in range(0,len(road.s)-1,2):
        j=min(i+2,len(road.s)-1)
        bands=(-142,-109,-86,-69,-52,-41,-32,-24,-18,-14,-10,-7,-4.2,-2,0,3,6,11,20,34,58,99,160)
        for left,right in zip(bands,bands[1:]):
            pts=[];cols=[]
            for n,l in ((i,left),(j,left),(j,right),(i,right)):
                d=road.s[n]['d'];z=ground(d,l)
                pts.append(road.at(n,l,z-height(d)))
                tone=math.sin(d/19+l/13)+.45*math.cos(d/7-l/4)
                if l<-4:
                    if sand(d)>.49 or z<1.35:colour=0xE4C293 if z>1.35 else 0xBCA880
                    else:colour=(0xB68C62,0xD1A474,0xC19369,0xAD7E59)[int(abs(z*.83+tone))%4]
                else:colour=0x85965D if tone>.2 else 0x74865B
                cols.append(lin(colour))
            b.quad(*pts);b.colours.extend(cols)
    sea=bc.Builder('Tasman Sea','sea')
    sea.quad((-10000,-16000,0),(15000,-16000,0),(15000,10000,0),(-10000,10000,0));sea.build(col)
    return b.build(col),lambda x,y:0


def boardwalk(d):
    return 1000<d<1300 or 4240<d<4730 or 5790<d<5990


def roadway(road,st,length,col,bc):
    path=bc.Builder('Road','asphalt');timber=bc.Builder('Deck boards and paving joints','terrain');timber.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d']
        path.quad(road.at(i,-2.06),road.at(i+1,-2.06),road.at(i+1,2.06),road.at(i,2.06))
        if boardwalk(d):
            for j in range(16):
                q=d+j*.25
                timber.quad(road.pos(q,-2.09,.025),road.pos(q+.236,-2.09,.025),road.pos(q+.236,2.09,.025),road.pos(q,2.09,.025))
                colour=lin((0x9B876B,0xA29279,0x958775,0xAE9A7F)[(i+7*j)%4]);timber.colours.extend((colour,)*4)
        elif i%2==0:
            timber.quad(road.pos(d,-2.08,.015),road.pos(d+.025,-2.08,.015),road.pos(d+.025,2.08,.015),road.pos(d,2.08,.015))
            timber.colours.extend((lin(0x807F72),)*4)
    path.build(col);timber.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':2.06,'terrain':{'sea':True},
       'land':{'mid':0x809359},'sky':[0xC9DFE5,0xA8D8EA,0x77BEDE,0x4E9CCA,0x387FB4],
       'haze':0xBED7DB,'light':[0xFFECC5,3.5],'fill':[0xD0E4ED,0xA8A180],
       'sun_azimuth':-.69,'sun_altitude':.96,'palette':{'asphalt':0xC8BCA8,'sea':0x289C99},'chunks':{'Land':2}}


def origin(k,d,l,z):
    x,y,_=k.road.pos(d,l);a=curve(d);c,s=math.cos(a),math.sin(a)
    def p(u,v,h):return x+c*u-s*v,y+s*u+c*v,z+h
    return p,a


def pool(k,art,d,length,width,club):
    # The pools sit below the path, against the rock shelf with a straight seaward retaining wall.
    lane=-(shore(d)+width*.53+2)
    p,a=origin(k,d,lane,.89)
    water=lin(0x62BBBB);white=lin(0xE8E3D0);depth=lin(0x3E8385)
    art.box(p(0,0,-.75),(length+2.8,width+2.7,1.01),a,white)
    art.box(p(0,0,.25),(length,width,.065),a,water)
    for side in (-1,1):
        art.box(p(0,side*(width/2+.49),.22),(length+2.2,.83,.58),a,white)
        art.box(p(side*(length/2+.65),0,.24),(1.04,width+2.4,.50),a,white)
    lanes=8 if club else 5
    for j in range(lanes):
        v=-width/2+width*(j+.5)/lanes
        art.box(p(0,v,.319),(length-2.65,.14,.013),a,depth)
        for side in (-1,1):art.box(p(side*(length*.5-1.5),v,.322),(.11,.92,.018),a,depth)
    for side in (-1,1):
        for j in range(4):
            u=side*(length*.5-2-j*.25)
            art.box(p(u,width*.5+.11,.16+j*.13),(.27,1.27,.16),a,white)
    if club:
        # Leave the near side of the big pool open. The clubhouse climbs from the
        # far short end, with wraparound open galleries visible from the clifftop.
        end=length*.53
        for floor in range(3):
            u=end+floor*.71;v=width*.25+floor*.51;up=1.20+floor*2.60
            art.box(p(u,v,up-.10),(7.1,11.6,.33),a,white)
            art.box(p(u+.60,v,up+.22),(4.86,9.7,2.16),a,lin(0xD4D6CF))
            art.box(p(u-1.91,v,up+.49),(.052,9.46,1.59),a,lin(0x486979))
            for j in range(6):
                art.box(p(u-3.24,v-5+j*1.95,up+.08),(.145,.15,2.39),a,white)
                art.box(p(u-1.95,v-4.73+j*1.89,up+.46),(.09,.08,1.66),a,white)
            for rail in (.65,.93):art.box(p(u-3.25,v,up+rail),(.095,11.2,.065),a,lin(0x80949A))
            for side in (-1,1):
                art.box(p(u,v+side*5.49,up+.90),(6.65,.09,.07),a,lin(0x84979B))
                art.box(p(u+.41,v+side*4.88,up+.58),(4.36,.08,1.30),a,lin(0x557888))
            art.box(p(u,v,up+2.45),(7.24,11.8,.22),a,white)
        face=p(end-2.02,width*.25+.85,7.88)
        art.box(p(end-1.94,width*.25+.85,7.31),(.14,7.4,.91),a,lin(0x4C7180))
        words(art,'BONDI ICEBERGS',face,(math.sin(a),-math.cos(a),0),(0,0,1),.64,7.05,0xFFF8DA)
        art.box(p(-length*.31,width*.5+4,.05),(10,6.9,.18),a,lin(0xE3DDCA))
        art.box(p(-length*.31,width*.5+4,.24),(8.66,5.65,.04),a,lin(0x76C1BF))
        for j in range(3):
            art.box(p(-length*.31,width*.5+2.3+j*1.38,.299),(7.9,.10,.018),a,depth)

    else:
        for j in range(3):art.box(p(length*.42+j*.56,width*.22,-.19),(1.45,width*.85,.65+j*.16),a,lin(0xC7A583))


def club(k,art):
    d=2227;l=8;p,a=origin(k,d,l,ground(d,l))
    art.box(p(0,0,-.45),(13,6.2,5.12),a,lin(0xD9B16B))
    art.box(p(0,0,4.67),(13.5,6.6,.32),a,lin(0x597F91))
    for j in (-1,1):art.box(p(j*4,-3.16,.45),(1.4,.13,2.25),a,lin(0x4977A0))
    pos=p(0,-3.21,3.77);words(art,'TAMARAMA S.L.S.C.',pos,(math.cos(a),math.sin(a),0),(0,0,1),.78,11.4,0x355779)
    pos=p(-6.52,0,3.78);words(art,'TAMARAMA',pos,(math.sin(a),-math.cos(a),0),(0,0,1),.61,5.6,0x355779)


def norfolk(art,x,y,z,h,a):
    art.tube((x,y,z),h*.027,h*.009,h,lin(0x766D58),lin(0x827961),7)
    for j in range(6):
        up=h*(.31+j*.11);radius=h*(.25-j*.03);tint=lin(0x3C6151 if j%2 else 0x4D7160)
        for b in range(7):
            t=a+b*math.tau/7+j*.36
            pts=((x,y,z+up+h*.115),(x+radius*math.cos(t-.28),y+radius*math.sin(t-.28),z+up),
                 (x+radius*1.22*math.cos(t),y+radius*1.22*math.sin(t),z+up+.025*h),
                 (x+radius*math.cos(t+.28),y+radius*math.sin(t+.28),z+up))
            art.face(pts,(tint,)*4);art.face(pts[::-1],(tint,)*4)


def headstones(k,art):
    for row in range(8):
        for j in range(57):
            d=4390+j*3.25+row*.61;l=7+row*3.10
            p,a=origin(k,d,l,ground(d,l));tint=lin((0xDCD8C8,0xC4C1B2,0xEAE4CD)[(row+j)%3])
            art.box(p(0,0,-.11),(1.19,.85,.27),a,tint)
            if (j+2*row)%7==0:
                art.box(p(0,0,.14),(.33,.32,1.8),a,tint);art.box(p(0,0,1.38),(1.0,.27,.25),a,tint)
            elif j%5==1:art.tube(p(0,0,.15),.41,.11,1.83,tint,tint,4)
            else:
                art.box(p(0,0,.14),(.85,.27,.91),a,tint)
                art.box(p(0,0,1.04),(.65,.27,.16),a,tint)


def placard(k,art,d,l,caption):
    p,a=origin(k,d,l,ground(d,l));face=-.11
    for v in (-1.22,1.22):art.box(p(0,v,0),(.14,.13,2.26),a,lin(0x6A7D7A))
    art.box(p(0,0,1.05),(.19,3.07,1.17),a,lin(0x416A78))
    art.box(p(face,0,1.12),(.03,2.94,.045),a,lin(0xD6CCA4))
    words(art,caption,p(face-.02,0,1.78),(math.sin(a),-math.cos(a),0),(0,0,1),.42,2.82,0xFAEDD3)


def beachlife(k,art,d,l,seed):
    p,a=origin(k,d,l,ground(d,l))
    # Beach umbrellas have alternating triangular panels; swimmers and towels lie beneath.
    tint=(0xE7A45A,0xBF6351,0x548E98,0xD8BE71)[seed%4]
    art.tube(p(0,0,-.18),.046,.040,2.29,lin(0x9A8263),lin(0xB39A76),6)
    top=p(0,0,2.22)
    for j in range(10):
        r=1.38;u=j*math.tau/10;v=(j+1)*math.tau/10
        pts=(top,p(r*math.cos(u),r*math.sin(u),1.74),p(r*math.cos(v),r*math.sin(v),1.74))
        col=lin(tint if j%2 else 0xE5D6AE)
        art.face(pts,(col,)*3);art.face(pts[::-1],(col,)*3)
    art.box(p(1.28,0,.035),(.75,1.66,.04),a,lin(tint))
    for j in range(2):
        u=1.73+j*.72;v=.83-j*.46;skin=lin((0xB88664,0x93664D,0xC39879)[(j+seed)%3])
        art.tube(p(u,v,.03),.16,.16,.62,skin,skin,6)
        art.tube(p(u,v,.64),.20,.22,.51,lin(tint),lin(tint),7)
        art.tube(p(u,v,1.15),.13,.12,.26,skin,skin,8)


def nearshore(k,art):
    # Sand showing through shallow water makes the bays distinctly turquoise,
    # while the outer sheet retains the Pacific reflections.
    for d in range(-32,6196,8):
        for band in range(4):
            points=[];colours=[]
            for station,j in ((d,band),(d+8,band),(d+8,band+1),(d,band+1)):
                lane=shore(station)+4+j*(10+.9*math.sin(station/36))+2*math.sin(station/22+j)
                x,y,_=k.road.pos(station,-lane);points.append((x,y,.045))
                tints=(0x77C7B8,0x58B9AD,0x43AAA7,0x3C9FA6,0x4596A4)
                colours.append(lin(tints[j]))
            art.face(points[::-1],colours[::-1])
            art.face(points,colours)
    for c,r,w in COVES:
        for j in range(16):
            d=max(2,c-r*.6+r*1.2*j/15)
            l=-(9+(j*13%max(9,int(shore(d)-14))))
            beachlife(k,art,d,l,j)


def scenery(k):
    art=Painted(k);rng=k.rng
    for i,(d,ln,w) in enumerate(POOLS):pool(k,art,d,ln,w,i==0)
    club(k,art);headstones(k,art);nearshore(k,art)
    for d,l,title in ((110,3.42,'BONDI BEACH'),(429,3.72,'ICEBERGS'),(2214,-3.3,'TAMARAMA'),(4493,3.72,'WAVERLEY'),(6079,3.62,'BRONTE BATHS')):
        placard(k,art,d,l,title)
    for i in range(14):
        d=4430+i*7.6;l=6.2+1.2*(i%3);p,a=origin(k,d,l,ground(d,l))
        stone=lin(0xECE7D7)
        art.box(p(0,0,-.22),(1.4,.77,.56),a,stone)
        art.box(p(0,0,.32),(.28,.30,2.17),a,stone)
        art.box(p(0,0,1.86),(1.17,.26,.24),a,stone)
    for d in range(0,6156,4):
        if sand(d)>.79 and not 40<d<213:continue
        lane=-2.30
        art.tube(k.road.pos(d,lane,-.15),.065,.050,1.38,lin(0x76878A),lin(0xD1D5CC),7)
        for h in (.43,.78,1.14):beam(art,k.road.pos(d,lane,h),k.road.pos(d+4,lane,h),.073,.067,lin(0xBBC3BD))
        if boardwalk(d) and d%12==0:
            art.box(k.road.pos(d,lane,-1.60),(.28,.27,1.72),curve(d),lin(0x7D6A56))
    for d in (675,1360,2445,4120,5910):
        for j in range(12):
            p,a=origin(k,d+j*.27,-3.11-j*.39,height(d)-.22-j*.19)
            art.box(p(0,0,-.18),(1.76,.58,.32),a,lin(0xBBA98D))
    for d in range(16,6130,9):
        l=rng.uniform(5.1,30.3)
        if any(abs(d-c)<r for c,r in ((2227,12),(4460,132),(483,34),(6093,30))):continue
        x,y,z=k.road.pos(d,l);z=ground(d,l)
        if d%27==16:norfolk(art,x,y,z,rng.uniform(7.0,12.6),rng.uniform(0,6.28))
        else:
            art.tube((x,y,z-.12),rng.uniform(.88,2.08),.48,rng.uniform(.81,1.82),lin(0x64774C),lin(0x81905C),8)
    # Honey-coloured sedimentary shelves are broken into overhanging strata and rounded erosion pits.
    for d in range(14,6130,6):
        if sand(d)>.52 or any(abs(d-c)<w/2+8 for c,w,_ in POOLS):continue
        for j in range(4):
            l=-shore(d)*(.51+j*.093)
            up=ground(d,l);p,a=origin(k,d,l,up)
            art.box(p(0,0,-.54),(6.3,1.95,.65),a,lin((0xCB9F70,0xAD815D,0xDAB589,0xB58B68)[j]))
            if (d+j)%3==0:art.box(p(1,-.99,-.23),(.80,.055,.24),a,lin(0x906F54))
    # Low apartment blocks and beach shelters stand behind each cove.
    for d in range(42,6080,31):
        if sand(d)<.55:continue
        l=rng.uniform(31,58);p,a=origin(k,d,l,ground(d,l))
        floors=rng.randint(1,4);w=rng.uniform(7,13)
        art.box(p(0,0,-.42),(w,6.8,floors*2.65+.61),a,lin((0xD7C6A9,0xBDAE9B,0xCDC5AD)[floors%3]))
        for floor in range(floors):
            for j in range(4):art.box(p(-w*.38+j*w*.25,-3.45,.80+floor*2.65),(w*.15,.13,1.25),a,lin(0x637C83))
            art.box(p(0,-3.65,.51+floor*2.65),(w+.12,.91,.16),a,lin(0xE1D4BC))
    return {'efforts':0}
