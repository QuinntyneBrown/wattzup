"""A northbound evening along the Blackpool Promenade, with the tramway on its seaward side."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted,lin


def heading(d):
    return .16*math.sin(d/546)+.055*math.sin(d/212)-.15*math.exp(-((d-1340)/195)**2)


def elevation(d):
    return 5.3+.59*math.sin(d/459)+.21*math.sin(d/134)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=heading(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        samples.append(dict(d=d,x=x,y=y,z=elevation(d),h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,0


def road(road,st,length,col,bc):
    street=bc.Builder('Road','asphalt');paint=bc.Builder('RoadPaint','paint')
    paving=bc.Builder('Promenade','promenade');steel=bc.Builder('Tram rails','terrain');steel.colours=[]
    for i in range(len(road.s)-1):
        d=road.s[i]['d']
        def strip(b,l,r,h):b.quad(road.at(i,r,h),road.at(i+1,r,h),road.at(i+1,l,h),road.at(i,l,h))
        strip(street,5.1,-5.1,0);strip(paving,-5.1,-15,.15);strip(paving,23.5,5.1,.12)
        if i%4<2:strip(paint,.07,-.07,.012)
        for l in (7.8,9.235,11.9,13.335):
            strip(steel,l+.094,l-.094,.138);steel.colours.extend((lin(0x34343E),)*4)
            strip(steel,l+.050,l-.015,.147);steel.colours.extend((lin(0xB1ADB1),)*4)
        if d%447<9:
            for side in range(-4,5,2):strip(paint,side+.74,side,.015)
    for part in (street,paint,paving,steel):part.build(col)


def land(road,col,theme,bc):
    b=bc.Builder('Foreshore and stepped sea defences','terrain');b.colours=[]
    sides=[(-300,-.39,0x44424B),(23.5,-.39,0x44424B),(23.5,.11,0x9B9693)]
    for j in range(12):
        sides.extend(((23.5+j*.92,.10-j*.36,0x9B9693),(24.4+j*.92,.10-j*.36,0x8D8988)))
    sides.extend(((50,-5.2,0x9D8D73),(82,-6.2,0x7E755F),(150,-8.4,0x6F6B60)))
    for i in range(0,len(road.s)-1,5):
        j=min(i+5,len(road.s)-1)
        for (l,h,c),(r,u,cc) in zip(sides,sides[1:]):
            b.quad(road.at(i,l,h),road.at(j,l,h),road.at(j,r,u),road.at(i,r,u))
            b.colours.extend((lin(c),lin(c),lin(cc),lin(cc)))
    sea=bc.Builder('Irish Sea','sea');sea.quad((-12000,-1200,0),(22000,-1200,0),(22000,17000,0),(-12000,17000,0));sea.build(col)
    return b.build(col),lambda x,y:0


THEME={'lay':route,'road_builder':road,'land_builder':land,'night':True,'terrain':{'sea':True},'wet':.64,
       'sky':[0x36374F,0x222C4B,0x17213F,0x101932,0x091221],'haze':0x353748,
       'land':{'mid':0x44434D},'light':[0xA7BADF,1.28],'fill':[0xB7BFE0,0x736A78],
       'sun_altitude':.48,'sun_azimuth':2.64,'palette':{'asphalt':0x4D4C55},'chunks':{'Land':1,'Ground':1}}

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


BULBS=('neon-pink','neon-cyan','neon-amber','neon-violet','neon-lime')


def tower(k):
    art=Painted(k,'peaks');glow=Painted(k,'glow-window')
    x,y,z=k.road.pos(1380,-43);ang=heading(1380)+.07
    def p(u,v,h):return(x+math.cos(ang)*u-math.sin(ang)*v,y+math.sin(ang)*u+math.cos(ang)*v,z+h)
    frame=lin(0x9A443D);red=lin(0xFE6657);bulb=lin(0xFFE1A1)
    levels=[(0,17.8),(13,14.1),(27,11.2),(45,8.2),(66,6.2),(85,4.7),(101,4.1),(114,3.8),(122,4.3)]
    signs=((-1,-1),(1,-1),(1,1),(-1,1))
    for (base,w),(end,v) in zip(levels,levels[1:]):
        for i,(a,b) in enumerate(signs):
            c,e=signs[(i+1)%4]
            beam(art,p(a*w,b*w,base),p(a*v,b*v,end),1.20,1.24,frame)
            beam(art,p(a*w,b*w,base),p(c*v,e*v,end),.53,.48,frame)
            beam(art,p(c*w,e*w,base),p(a*v,b*v,end),.53,.48,frame)
            beam(art,p(a*v,b*v,end),p(c*v,e*v,end),.64,.56,frame)
            beam(glow,p(a*(w+.28),b*(w+.28),base),p(a*(v+.28),b*(v+.28),end),.32,.32,red)
    for h,w in ((10,32),(117,11),(122,13),(129,10),(137,8)):
        art.box(p(0,0,h),(w,w,2.6),ang,frame)
        for i,(a,b) in enumerate(signs):
            c,e=signs[(i+1)%4];beam(glow,p(a*w*.51,b*w*.51,h+1),p(c*w*.51,e*w*.51,h+1),.26,.42,bulb)
    art.tube(p(0,0,123),4.2,2.6,18,frame,red,8);art.tube(p(0,0,141),2.7,.34,13,frame,red,8)
    beam(glow,p(0,0,142),p(0,0,158),.31,.31,bulb)


def pier(k,art,glow,d,wheel):
    x,y,z=k.road.pos(d,20);h=heading(d)-.68;c,s=math.cos(h),math.sin(h)
    def p(u,v,a):return(x+c*u-s*v,y+s*u+c*v,a)
    for j in range(36):
        v=j*4.25
        art.box(p(0,v,4.5),(6.8,4.26,.46),h,lin(0x7D746B))
        for side in (-1,1):
            if j%2==0:art.box(p(side*3.12,v,-.5),(.36,.35,6.3),h,lin(0x66716B))
            beam(art,p(side*3.28,v,6.02),p(side*3.28,v+4.25,6.02),.10,.12,lin(0xC7C7BE))
            if j%3==0:
                art.tube(p(side*3.18,v,4.94),.085,.09,3.8,lin(0x706E70),lin(0xA9A6A1),8)
                k.diamond(k.B['bulb'],p(side*3.18,v,8.93),.32)
    art.box(p(0,150,4.5),(23,24,.8),h,lin(0x807668));art.box(p(0,151,5.2),(12,14,5),h,lin(0xC4B19A))
    art.roof(p(0,151,10.2),14,15,3.8,h,lin(0x876A70))
    if not wheel:return
    centre=p(0,94,22)
    def rim(a):return(centre[0]+c*16.5*math.cos(a),centre[1]+s*16.5*math.cos(a),centre[2]+16.5*math.sin(a))
    for j in range(42):
        a=j*math.tau/42;n=(j+1)*math.tau/42
        beam(glow,rim(a),rim(n),.25,.25,lin(0xFFC77A if j%2 else 0xE76A9D))
        if j%2==0:
            beam(art,centre,rim(a),.12,.17,lin(0xBEAF9B))
            art.box(rim(a),(1.22,1.13,.78),h,lin(0xCC7966))
    for side in (-1,1):beam(art,p(side*7,93,5),centre,.45,.52,lin(0xAC9892))


def frontage(k,art,glow,d,i):
    x,y,z=k.road.pos(d,-15);a=heading(d);c,s=math.cos(a),math.sin(a)
    def p(u,v,up):return(x+c*u-s*v,y+s*u+c*v,z+up)
    w=15+i%3;h=8.3+i%4*1.37
    col=(0xA38475,0x8D777C,0x9B8875,0x9B8172)[i%4]
    art.box(p(0,-3,0),(w,7,h),a,lin(col))
    for j in range(-2,3):
        art.box(p(j*w*.18,.57,4.4),(1.73,.13,2.26),a,lin(0x302F42))
        if i%3:glow.box(p(j*w*.18,.65,4.48),(1.48,.064,1.9),a,lin(0xA08C87 if j%3 else 0xDDB186))
    for j in range(3):
        art.box(p((j-1)*w*.28,.59,.28),(w*.26,.19,2.33),a,lin(0x343344))
        glow.box(p((j-1)*w*.28,.71,.46),(w*.22,.09,1.9),a,lin((0xB08188,0xAA9AA9,0xBFAB88)[(i+j)%3]))
    art.box(p(0,.78,2.72),(w+.3,.4,1.33),a,lin(0x534956))
    name=('ARCADE','FISH & CHIPS','BLACKPOOL ROCK','AMUSEMENTS','CAFE','SOUVENIRS')[i%6]
    words(glow,name,p(0,1.05,3.03),(-c,-s,0),(0,0,1),.75,w*.92,(0xFFD496,0x8CE8F0,0xF499BA)[i%3])
    art.box(p(0,.58,h-.13),(w+.35,.47,.34),a,lin(0xAFA292))
    for j in range(13):k.diamond(k.B[BULBS[i%5]],p(-w*.45+j*w*.075,1.07,2.83),.106)


def scenery(k):
    art=Painted(k);glow=Painted(k,'glow-window');tower(k)
    for i,d in enumerate(range(6,5635,19)):
        if 1350<d<1400:continue
        frontage(k,art,glow,d,i)
    for i,d in enumerate(range(22,5640,36)):
        for l in (-6.4,15.9):
            x,y,z=k.road.pos(d,l);art.tube((x,y,z),.11,.074,7.61,lin(0x777077),lin(0xAAA4AB),8)
        a=k.road.pos(d,-6.4,7.48);b=k.road.pos(d,15.9,7.48)
        k.string(a,b,25,1.23,BULBS[i%5])
        if i%4==0:k.arch(d,6.6,.14,.21,k.B['dark'],BULBS[(i+1)%5])
        if i%5==0:k.light(k.road.pos(d,2.3),BULBS[i%5],16,.69)
        # Interspersed star and fan tableaux stand above the sea wall.
        if i%3!=2:
            points=[k.road.pos(d+math.sin(j*math.pi/5)*(2.2 if j%2==0 else .92),19,5.3+math.cos(j*math.pi/5)*(2.2 if j%2==0 else .92)) for j in range(10)]
            for j in range(10):beam(glow,points[j],points[(j+1)%10],.13,.13,lin((0xF59DBF,0x9FE4DA,0xFFD18C)[i%3]))
    for d in range(0,5640,4):
        foot=k.road.pos(d,23,.11);art.tube(foot,.068,.055,1.09,lin(0x777A7D),lin(0xA0A3A6),6)
        for h in (.59,1.14):beam(art,k.road.pos(d,23,h),k.road.pos(d+4,23,h),.055,.07,lin(0xA2A3A6))
    pier(k,art,glow,610,True);pier(k,art,glow,2170,False)
    for d in (145,581,1320,2140,3190,4920):
        a=heading(d);x,y,z=k.road.pos(d,15.6)
        art.box((x,y,z+.16),(13,2.1,.22),a,lin(0xAFADA6));art.box((x,y,z+3.06),(13.3,2.4,.23),a,lin(0x958D94))
        for offset in (-5.6,0,5.6):
            x,y,z=k.road.pos(d+offset,16.4);art.tube((x,y,z+.22),.08,.08,2.87,lin(0x747782),lin(0xCCC6C2),7)
    x,y,z=k.road.pos(1326,19.3);a=heading(1326)
    art.box((x,y,z+.14),(47,6.1,.045),a,lin(0xCDC6AC))
    for j,phrase in enumerate(('APPLAUSE','A GRAND NIGHT','LAUGHTER','ENCORE','ON THE AIR')):
        d=1309+j*8.2;origin=k.road.pos(d,19.5,.203);a=heading(d)
        words(art,phrase,origin,(math.cos(a),math.sin(a),0),(-math.sin(a),math.cos(a),0),1.01,7.4,0x403C3F)
    return {'efforts':0}
