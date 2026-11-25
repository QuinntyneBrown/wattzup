"""Speed Week on the Utah salt flats, with the Silver Island range to the northwest."""
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


MILE = 1609.344
HALF = 4.95


def route(config,theme,bc):
    stages=bc.stages(config['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        points.append(dict(d=d,x=d,y=0,z=.24,h=0,k=0,g=0))
    return points,stages,length,mean,0


def land(road,col,theme,bc):
    b=bc.Builder('Open salt plain','terrain');b.colours=[]
    # Keep the broad salt polygons out of the scored riding strip. Long shallow faces
    # over the road lose depth precision when the camera looks across kilometres of salt.
    for x in range(-1000,11001,240):
        for a,c in ((-5400,-225),(225,5400)):
            b.quad((x,a,.04),(x+240,a,.04),(x+240,c,.04),(x,c,.04))
            b.colours.extend([lin(0xEEECE5)]*4)
    return b.build(col),lambda *_:.04


def roadway(road,st,length,col,bc):
    roadbed=bc.Builder('Road','asphalt');line=bc.Builder('Black speedway guide','terrain');line.colours=[]
    for i in range(len(road.s)-1):
        for left,right in ((-230,-HALF),(-HALF,HALF),(HALF,230)):
            roadbed.quad(road.at(i,left),road.at(i+1,left),road.at(i+1,right),road.at(i,right))
        line.quad(road.at(i,-.15,.025),road.at(i+1,-.15,.025),road.at(i+1,.15,.025),road.at(i,.15,.025))
        line.colours.extend([lin(0x19191B)]*4)
    roadbed.build(col);line.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':HALF,'terrain':{},
       'land':{'mid':0xEBE9E1},'sky':[0xD6E2ED,0xB0CBDF,0x84AFD5,0x5E99C9,0x437BB2],
       'haze':0xCFD9E2,'light':[0xFFF6DF,3.10],'fill':[0xDFE6ED,0xD0CDC1],
       'sun_azimuth':.67,'sun_altitude':.95,'palette':{'asphalt':0xE4E2DC},'chunks':{'Land':1}}


def sign(art,x,y,z,w,h,word,fill,ink):
    art.box((x,y,z),(.15,w,h),0,lin(fill))
    words(art,word,(x-.105,y,z+h*.26),(0,-1,0),(0,0,1),h*.78,w*.88,ink)


def board(art,mile):
    x=mile*MILE
    for side in (-1,1):art.box((x,side*.57-6.8,.20),(.14,.14,2.25),0,lin(0x786E5F))
    sign(art,x-.09,-6.8,1.02,1.68,1.56,str(mile),0x1E2A32,0xF6F2D9)
    sign(art,x-.09,-6.8,2.57,1.68,.41,'MILE',0xBB473D,0xFFF4DE)


def wheel(art,x,y,z,r,w):
    # A wheel's axis crosses the vehicle. Radial sidewall, rim and hub read separately.
    for side in (-1,1):
        face=y+side*w*.5
        for j in range(12):
            a=j*math.tau/12;b=(j+1)*math.tau/12
            def at(t,rad,v):return (x+math.cos(t)*rad,v,z+math.sin(t)*rad)
            tread=(at(a,r,y-w*.5),at(b,r,y-w*.5),at(b,r,y+w*.5),at(a,r,y+w*.5))
            dark=lin(0x292A29)
            art.face(tread,(dark,)*4)
            ring=(at(a,r,face),at(b,r,face),at(b,r*.54,face+side*.008),at(a,r*.54,face+side*.008))
            art.face(ring if side<0 else ring[::-1],(dark,)*4)
            cap=(at(a,r*.52,face+side*.013),at(b,r*.52,face+side*.013),(x,face+side*.02,z))
            art.face(cap if side<0 else cap[::-1],(lin(0xAAA69C),)*3)


def vehicle(art,x,y,kind,tint):
    body=lin(tint);dark=lin(0x494D50);glass=lin(0x59717C);bright=lin(0xD7DBD6)
    if kind=='liner':
        # A needle nose, bulging cockpit and short tail leave the small wheels nearly enclosed.
        sections=[(-4.7,.045,.12),(-3.2,.41,.39),(-1.0,.66,.58),(1.3,.62,.56),(3.1,.40,.40),(4.05,.14,.28)]
        last=None
        for dx,ry,rz in sections:
            ring=[(x+dx,y+ry*math.cos(j*math.tau/12),.78+rz*math.sin(j*math.tau/12)) for j in range(12)]
            if last:
                for j in range(12):
                    n=(j+1)%12;face=(last[j],ring[j],ring[n],last[n]);art.face(face,(body,)*4);art.face(face[::-1],(body,)*4)
            last=ring
        art.box((x+.35,y,1.03),(1.26,.67,.39),0,glass)
        art.box((x+3,y,.92),(.87,.10,.66),0,body)
        for dx in (-2.4,2.1):
            for side in (-1,1):wheel(art,x+dx,y+side*.44,.57,.30,.13)
    elif kind=='rod':
        art.box((x,y,.57),(3.91,1.32,.60),0,body)
        art.box((x+.52,y,1.16),(1.51,1.22,.69),0,body)
        art.box((x+.52,y-.62,1.40),(1.12,.04,.36),0,glass)
        art.box((x-1.25,y,1.11),(.96,.71,.38),0,dark)
        for j in range(4):art.tube((x-1.48+j*.19,y-.37,1.30),.055,.06,.34,bright,bright,6)
        for dx in (-1.44,1.38):
            for side in (-1,1):wheel(art,x+dx,y+side*.78,.63,.43,.23)
    else:
        length=8.7 if kind=='rv' else 5.5
        art.box((x,y,.64),(length,2.32,2.65 if kind=='rv' else 1.82),0,body)
        art.box((x,y-1.172,1.41),(length*.97,.028,.18),0,lin(0x8E6755))
        for j in range(4 if kind=='rv' else 2):
            art.box((x-length*.35+j*1.45,y-1.19,1.94),(1.13,.04,.70),0,glass)
        art.box((x-length/2-.04,y,1.73),(.09,1.95,.82),0,glass)
        for dx in (-length*.31,length*.31):
            for side in (-1,1):wheel(art,x+dx,y+side*1.11,.70,.46,.24)
        if kind=='rv':art.box((x+.74,y,3.28),(2.35,1.11,.32),0,bright)


def tent(art,x,y,tint,number):
    cloth=lin(tint);metal=lin(0xC4C6C0)
    for sx in (-1,1):
        for sy in (-1,1):art.box((x+sx*2.33,y+sy*1.81,.24),(.075,.075,2.88),0,metal)
    base=[(x+dx,y+dy,3.1) for dx,dy in ((-2.52,-2), (2.52,-2),(2.52,2),(-2.52,2))]
    for i in range(4):
        n=(i+1)%4
        art.face((base[i],base[n],(x,y,4.12)),(cloth,)*3)
        art.face((base[n],base[i],(x,y,4.12)),(cloth,)*3)
    art.box((x,y-1.98,2.78),(5.02,.075,.34),0,cloth)
    words(art,'SALT '+str(number),(x,y-2.04,3.0),(1,0,0),(0,0,1),.29,3.8,0xF6F0DC)


def spectator(art,x,y,shirt,skin,turn):
    fabric=lin(shirt);skin=lin(skin);cap=lin(0xE0D6B9)
    for side in (-1,1):
        art.box((x+.07*side,y+.10*side,.23),(.16,.17,.72),turn,lin(0x4B5460))
    art.tube((x,y,.89),.19,.24,.50,fabric,fabric,8)
    art.tube((x,y,1.43),.13,.13,.25,skin,skin,8)
    art.tube((x,y,1.66),.20,.21,.028,cap,cap,9);art.tube((x,y,1.67),.14,.11,.10,cap,cap,8)


def scenery(k):
    art=Painted(k);rng=k.rng
    for d in (145,8197):
        for side in (-1,1):
            for dx in (-.32,.32):
                art.box((d+dx,side*6.35,.24),(.12,.18,6.15),0,lin(0x8E999E))
            for j in range(8):beam(art,(d-.32,side*6.35,.28+j*.73),(d+.32,side*6.35,1.01+j*.73),.073,.066,lin(0xBCC3C1))
        art.box((d,0,5.50),(.75,13,.83),0,lin(0x33465A))
        sign(art,d-.41,0,5.51,10.26,.78,'BONNEVILLE SPEED WEEK',0x364A5D,0xFFF4D9)
    for i in range(1,6):board(art,i)
    for start,amount in ((130,18),(597,12),(1480,8),(3120,6),(7960,7)):
        for j in range(amount):
            d=start+j*13.1;colour=(0xB34337,0xE0CDA2,0x536F87,0xD3A342)[j%4]
            tent(art,d,11+(j%3)*1.28,colour,j+17)
            vehicle(art,d+1,20+(j%4)*1.6,'rv' if j%2 else 'truck',0xDBD9CE)
            if j%3==0:
                art.box((d+7,13.4,.36),(8.63,2.17,.22),0,lin(0x818987))
                for side in (-1,1):wheel(art,d+7.6,13.4+side*.96,.49,.29,.16)
            vehicle(art,d+7.0,12.5,'liner' if j%2 else 'rod',colour)
            for h in range(5):
                spectator(art,d+rng.uniform(-4.2,4),rng.uniform(6.0,10.3),rng.choice((0x4C7286,0xB64D40,0xE8DEC5,0xC09441)),rng.choice((0xBE8E69,0x936947,0xD2A984)),rng.uniform(-.5,.5))
            for n in range(3):
                art.box((d-5+n*3.52,5.72,.23),(3.46,.099,.82),0,lin((0x365877,0xAB483E,0xD6C6A1)[n]))
    distant=Painted(k,'peaks')
    # Profiles are anchored in map space, with lower, dust-hazed folds behind the northwest range.
    for row in range(3):
        previous=None
        for i in range(105):
            y=-8100+i*155
            x=11500+row*540+210*math.sin(y/1430+row*.9)
            ridge=math.exp(-((y-1250)/3500)**2)
            h=62+row*54+ridge*(390+121*math.sin(y/680+row*.57)+71*math.sin(y/310)+26*math.cos(y/110))
            fold=math.sin(y/260+row)*math.cos(y/850-row*.35)
            shape=((x-990-130*fold,y,.06),(x-480-190*fold,y+70*fold,h*(.24+.10*fold)),(x-180-100*fold,y-23*fold,h*(.63+.08*fold)),(x,y,h))
            if previous:
                for band in range(3):
                    tint=((0x827570,0xA2968C,0x8F8180),(0x96918F,0xABA3A1,0x9E989A),(0xAAA8AB,0xB9B5B3,0xB1ABAB))[row][band]
                    tone=lin(tint)
                    face=(previous[band],previous[band+1],shape[band+1],shape[band])
                    # One rider-facing surface per facet. Duplicate opposite faces make
                    # invalid polygons when the exporter welds their shared vertices.
                    slope=.96+.095*math.sin(y/245+row)+.035*math.sin(y/105+band*.7)
                    shade=lambda value:tuple(v*value for v in tone[:3])+(1.0,)
                    distant.face(face[:3],(shade(slope),shade(slope+.04),shade(slope+.02)))
                    distant.face((face[0],face[2],face[3]),(shade(slope-.025),shade(slope),shade(slope-.04)))
            previous=shape
    # I-80 sits on a low embankment south of the course, with a shelter and pull-off by its near bend.
    for d in range(2610,5120,10):
        offset=-230+125*math.exp(-((d-3810)/260)**2)
        for lane in (-5,5):art.box((d,offset+lane,.26),(10.04,4.45,.25),0,lin(0x797C7A))
        if d%30==0:art.box((d,offset,.52),(4,.16,.05),0,lin(0xC5AD78))
    for j in range(3):
        x=3820+j*9;y=-80-j*2
        for u in (-2,2):
            for v in (-1.6,1.6):art.box((x+u,y+v,.24),(.22,.22,2.82),0,lin(0x8D7861))
        art.roof((x,y,3.02),5.6,4.6,1.04,0,lin(0x847E70))
    sign(art,3790,-10,.75,5.2,1.56,'I-80 REST AREA',0x52775F,0xECE6D3)
    return {'efforts':0}
