"""Shanghai’s Bund, from the floodlit Customs House to Waibaidu Bridge."""
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


LAP=12832.5/3
R=23.
STRAIGHT=LAP/2-math.pi*R
Z=5.2


def shore(x):
    return -41*math.sin(x/287)-175*math.tanh((x-815)/210)


def station(d):
    t=d%LAP
    if t<STRAIGHT:x,y,h=t,0.,0.
    elif t<STRAIGHT+math.pi*R:
        a=(t-STRAIGHT)/R;x,y,h=STRAIGHT+R*math.sin(a),R*(1-math.cos(a)),a
    elif t<2*STRAIGHT+math.pi*R:x,y,h=2*STRAIGHT+math.pi*R-t,2*R,math.pi
    else:
        a=(t-2*STRAIGHT-math.pi*R)/R;x,y,h=-R*math.sin(a),R*(1+math.cos(a)),math.pi+a
    dy=(shore(x+.5)-shore(x-.5))*math.cos(h)+math.sin(h)
    return x,y+shore(x),math.atan2(dy,math.cos(h))


def point(d,l,z=0):
    x,y,h=station(d);return x-math.sin(h)*l,y+math.cos(h)*l,Z+z


def route(config,theme,bc):
    st=bc.stages(config['plan']);length=st[-1]['to'];points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=station(d)
        points.append(dict(d=d,x=x,y=y,z=Z,h=h,k=0,g=0))
    mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    return points,st,length,mean,0


def land(road,col,theme,bc):
    b=bc.Builder('Bund embankment and Pudong shore','terrain');b.colours=[]
    for a in range(-800,3200,10):
        if 1800<a<1930:continue
        for p,q,z,tint in ((-9,12,5.06,0x776E72),(12,18,4.8,0x606063),(18,62,5.05,0x373945),(62,420,4.98,0x4D4B53)):
            pts=[(x,shore(x)+l,z) for x,l in ((a,p),(a+10,p),(a+10,q),(a,q))]
            b.quad(*pts);b.colours.extend([lin(tint)]*4)
        face=((a,shore(a)-9,-.6),(a+10,shore(a+10)-9,-.6),(a+10,shore(a+10)-9,5.08),(a,shore(a)-9,5.08))
        b.quad(*face);b.colours.extend([lin(0x615A55)]*4)
    sea=bc.Builder('Huangpu and Suzhou Creek','sea')
    sea.quad((-6000,-4300,0),(8000,-4300,0),(8000,600,0),(-6000,600,0));sea.build(col)
    return b.build(col),lambda *_:0


def roadway(road,st,length,col,bc):
    b=bc.Builder('Road','terrain');b.colours=[]
    detail=bc.Builder('Granite joints and boulevard paint','terrain');detail.colours=[]
    def strip(builder,u,v,lo,hi,z,tint):
        builder.quad(point(u,lo,z),point(v,lo,z),point(v,hi,z),point(u,hi,z));builder.colours.extend([lin(tint)]*4)
    for i in range(math.ceil(LAP/4)):
        a=i*4;end=min(a+4,LAP);prom=a<STRAIGHT;half=5.65 if prom else 8.8
        strip(b,a,end,-half,half,0,0x8A827E if prom else 0x52515B)
        if prom:
            for row in range(4):
                for tile in range(7):
                    lo=-half+tile*1.68
                    strip(detail,a+row,a+row+.976,lo,min(half,lo+1.65),.021,(0x8B8380,0x928884,0x837F82,0x988D87)[(tile+i*3+row)%4])
        elif i%3==0:
            for lane in (-3.2,3.2):strip(detail,a,end,lane,lane+.12,.024,0xC7C3B0)
    b.build(col);detail.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':5.65,'night':True,'wet':.27,
       'terrain':{'sea':True},'sky':[0x4A4056,0x32364D,0x202A43,0x14203A,0x0A1328],
       'haze':0x3D3A4B,'light':[0x92A8CB,1.18],'fill':[0x8997BB,0x705F68],
       'sun_azimuth':1.78,'sun_altitude':.44,'land':{'mid':0x4B4750},'palette':{'sea':0x253846},'chunks':{'Land':1,'Ground':1}}


def box(art,x,y,z,w,d,h,tint):art.box((x,y,z),(w,d,h),0,lin(tint))


def pearl(art,glow,x,y):
    base=3.5
    pink=lin(0xE66BAB);silver=lin(0x9C8D9E)
    for i in range(3):
        a=math.tau*i/3
        beam(art,(x+43*math.cos(a),y+43*math.sin(a),base),(x+10*math.cos(a),y+10*math.sin(a),97),4.4,4.4,silver)
        beam(glow,(x+42*math.cos(a),y+42*math.sin(a),base+3),(x+10*math.cos(a),y+10*math.sin(a),97),1.05,1.05,lin(0xECA4C4))
    art.tube((x,y,base),9.2,6.5,241,lin(0x9C87A1),silver,16)
    for center,rad,color in ((87,24,0xE566A2),(230,18.5,0xC469AB),(271,7,0xA07BB4)):
        for j in range(12):
            a=-math.pi/2+j*math.pi/12;b=a+math.pi/12
            z=center+rad*math.sin(a)
            lo=max(.07,rad*math.cos(a));hi=max(.07,rad*math.cos(b))
            glow.tube((x,y,z),lo,hi,rad*(math.sin(b)-math.sin(a)),lin(color),lin(color if j%3 else 0xF3BDD1),24)
        glow.tube((x,y,center-.72),rad+.38,rad+.38,1.44,lin(0xFBE1DC),lin(0xFBE1DC),24)
    for i in range(3):
        a=math.tau*i/3;dx=7.4*math.cos(a);dy=7.4*math.sin(a)
        glow.tube((x+dx,y+dy,103),.86,.73,117,pink,lin(0xA883DA),8)
    glow.tube((x,y,248),1.45,.68,45,lin(0xCB91C4),lin(0xEAC5EE),10)
    glow.tube((x,y,293),.70,.12,34,lin(0xEA9CC3),lin(0xEEF0DE),8)


def towers(art,glow):
    pearl(art,glow,1520,-745)
    # A twisting, tapered glazed envelope with a light seam that follows its rotation.
    x,y=1818,-1010;last=None
    for j in range(34):
        f=j/33;z=4+410*f;rad=42-20*f;twist=1.57*f
        ring=[(x+rad*math.cos(a*math.tau/12+twist),y+rad*.85*math.sin(a*math.tau/12+twist),z) for a in range(12)]
        if last:
            for a in range(12):
                n=(a+1)%12;tint=(0x4B6692,0x435578,0x57748F,0x526783)[(a//3)%4]
                art.face((last[a],last[n],ring[n],ring[a]),(lin(tint),)*4)
                if a%3==0:beam(glow,last[a],ring[a],.97,1.1,lin(0x87B8E8))
                if j%3==0:beam(glow,ring[a],ring[n],.49,.50,lin(0x7892B4))
        last=ring
    for i in range(12):beam(glow,last[i],last[(i+1)%12],1.24,1.24,lin(0xD6DDF2))
    # Two legs leave a real trapezoidal opening beneath the Financial Center's lintel.
    x,y=1676,-963
    box(art,x,y,4,46,33,252,0x405373)
    for j in range(12):
        span=17-j*.77;z=256+j*3.33
        for side in (-1,1):
            box(art,x+side*span,y,z,6.5,25.5,3.34,0x58708D)
            beam(glow,(x+side*(span+3.35),y+12.8,z),(x+side*(span+2.67),y+12.8,z+3.34),.86,.86,lin(0x8BCAF0))
    box(glow,x,y,295.9,26,26,3.4,0x9AC7E0)
    for side in (-1,1):beam(glow,(x+side*23,y+16.6,5),(x+side*21,y+16.6,255),.93,1.12,lin(0x78B6E7))
    x,y=1738,-903
    for j in range(18):
        w=53-j*2.2;z=4+j*14.1
        box(art,x,y,z,w,w*.87,14.1,0x725F5C)
        box(glow,x,y,z+12.6,w+1.0,w*.87+1,1.54,0xE1B46D)
        for side in (-1,1):box(glow,x+side*(w/2-.35),y,z,.75,w*.87,1.01,0xBF975C)
    glow.tube((x,y,258),3.9,.38,28,lin(0xD6B37D),lin(0xF1D8A3),8)


def facade(art,glow,x,kind,rng):
    y=shore(x)+74;slope=(shore(x+.5)-shore(x-.5));a=math.atan(slope)
    cs,sn=math.cos(a),math.sin(a)
    def p(u,v,z):return x+u*cs-v*sn,y+u*sn+v*cs,z
    def block(builder,u,v,z,l,w,h,col):builder.box(p(u,v,z),(l,w,h),a,lin(col))
    w=47 if kind!='hotel' else 61;h=26 if kind!='hotel' else 32
    block(art,0,0,5,w,23,h,0xA08A73)
    for i in range(5):
        z=7+i*4.6
        for j in range(10):
            u=(j-4.5)*w*.093
            block(art,u,-11.57,z,2.55,.25,2.95,0x43434C)
            if (i+j)%8!=0:block(glow,u,-11.76,z+.16,2.05,.15,2.58,0xB68C61 if (i+j)%4 else 0xEBC78C)
            block(art,u,-11.85,z+1.37,2.28,.20,.11,0x8D7B68)
        block(glow,0,-11.72,z-.63,w+.28,.38,.24,0xCEAF77)
    for j in range(9):
        u=(j-4)*w*.109
        block(art,u,-11.9,6.3,.72,1.2,19.8,0xBDAB89)
        block(glow,u,-12.53,6.45,.21,.08,18.9,0xE5C47D)
    for z in (5.55,26.39,30.12):block(glow,0,-11.85,z,w+1.2,.48,.4,0xE0C085)
    if kind=='customs':
        block(art,0,0,31,16,14,19,0xAB947C)
        for side in (-1,1):
            block(glow,side*7.42,-7.22,31,.48,.35,19,0xECD49B)
            block(art,0,-7.02,43,13.6,.18,7.3,0x786357)
        centre=p(0,-7.28,45.9)
        for j in range(32):
            def dial(r,k,h=0):
                t=k*math.tau/32;return p(r*math.sin(t),-7.40+h,45.9+r*math.cos(t))
            glow.face((centre,dial(3.35,j+1),dial(3.35,j)),(lin(0xF4DBA0),)*3)
            if j%4==0:beam(art,dial(2.52,j,-.05),dial(3.2,j,-.05),.16,.16,lin(0x544C44))
        beam(art,p(0,-7.55,45.9),p(1.87,-7.55,47.5),.21,.20,lin(0x50483B))
        beam(art,p(0,-7.55,45.9),p(-.85,-7.55,48.55),.18,.17,lin(0x50483B))
        block(glow,0,0,50,16.6,14.6,.7,0xE3C387)
        art.tube(p(0,0,50.6),7.3,3.0,6.4,lin(0x756D64),lin(0xA3947A),8)
        art.tube(p(0,0,57),.28,.15,7.2,lin(0xBFAF8D),lin(0xF5E3BF),6)
    elif kind=='hotel':
        block(art,0,-1.5,36.5,22,16,7.4,0x967F6C)
        for j in (-8,-4,0,4,8):block(glow,j,-9.55,37.4,1.32,.17,4.6,0xE1C797)
        rim=[p(i*12,-1.5+j*9.8,44) for i,j in ((-1,-1),(1,-1),(1,1),(-1,1))]
        tip=p(0,-1.5,64)
        for j in range(4):
            n=(j+1)%4
            glow.face((rim[j],rim[n],tip),(lin(0x338478),lin(0x3C9887),lin(0x71B4A3)))
            beam(glow,rim[j],tip,.18,.24,lin(0x83C8AD))
    elif kind=='dome':
        for j in range(8):
            phi=j*math.pi/16;n=(j+1)*math.pi/16
            art.tube(p(0,0,31+12*math.sin(phi)),12*math.cos(phi),max(.12,12*math.cos(n)),12*(math.sin(n)-math.sin(phi)),lin(0x988A79),lin(0xBEA27D),20)


def truss(art,glow):
    for x in range(1800,1930,5):
        a=point(x,-6.8);b=point(x+5,-6.8)
        for side in (-1,1):
            l=side*6.78
            for h in (.23,1.24,9.62):beam(art,point(x,l,h),point(x+5,l,h),.31,.32,lin(0x688375))
            beam(art,point(x,l,.24),point(x,l,9.64),.26,.31,lin(0x6F8B7C))
            beam(art,point(x,l,.36 if x%10 else 9.53),point(x+5,l,9.53 if x%10 else .36),.27,.31,lin(0x819284))
            beam(glow,point(x,l,.99),point(x+5,l,.99),.036,.072,lin(0x72C18D))
            if x%10==0:beam(glow,point(x,l,2.24),point(x,l,9.38),.048,.062,lin(0x73BA8B))
        beam(art,point(x,-6.7,9.58),point(x+5,6.7,9.58),.22,.22,lin(0x729485))
        if x%10==0:beam(art,point(x,-6.7,9.75),point(x,6.7,9.75),.32,.32,lin(0x799988))


def scenery(k):
    art=Painted(k);near=Painted(k,'glow-window');far=Painted(k,'peaks')
    source=k.B['glow-window']
    k.B['bund-illumination']=type(source)('LandmarkLights','glow-window')
    glow=Painted(k,'bund-illumination');rng=k.rng
    towers(far,glow)
    # Continuous opposite bank anchors the skyline above the river.
    for x in range(-800,3600,50):
        y=-812-65*math.sin(x/340)
        face=((x,y,1.9),(x,y-1700,1.9),(x+50,y-1700,1.9),(x+50,y,1.9))
        far.face(face,(lin(0x4F5156),)*4)
        box(far,x+25,y,0,50.05,1.4,2.45,0x55585B)
        box(glow,x+25,y+.93,2.34,49.5,.25,.14,0xD6AA74)
        if abs(x-1520)>70:
            for r in (0,1):
                h=rng.uniform(16,76)*(1+r);width=rng.uniform(18,45);ty=y-90-r*170
                box(far,x,ty,2,width,width*.82,h,0x535565 if r==0 else 0x464F60)
                for floor in range(6,int(h),7):
                    box(glow,x,ty+width*.41+.08,2+floor,width*.86,.14,.71,rng.choice((0xA59C9F,0xC0AB87,0x8CA6AC)))
    for x in range(25,1760,52):
        if 1180<x<1320:continue
        facade(art,near,x,'customs' if x==545 else 'dome' if x in (389,1013) else 'stone',rng)
    facade(art,near,1270,'hotel',rng)
    truss(art,near)
    for x in range(-6,2060,4):
        if 1797<x<1933:continue
        for h in (.45,.90,1.28):beam(art,point(x,-5.9,h),point(x+4,-5.9,h),.065,.07,lin(0xBFB8A5))
        for off in (0,2):art.tube(point(x+off,-5.90),.073,.064,1.35,lin(0xA19681),lin(0xCCC6B8),6)
        if x%28==22:
            for l in (-7.2,7.45):
                art.tube(point(x,l),.15,.086,5.22,lin(0x625F62),lin(0x7B7477),8)
                near.tube(point(x,l,5.19),.29,.40,.78,lin(0xE6C693),lin(0xFFDF9F),8)
                art.tube(point(x,l,5.98),.45,.10,.27,lin(0x585761),lin(0x6D6870),8)
            if x%84==22:k.light(point(x,1.2),'neon-amber',19,1.02)
        if x%12==2 or 550<x<995:
            for j in range(3 if 550<x<995 else 1):
                d=x+rng.uniform(-1.6,1.7);l=rng.choice((-1,1))*rng.uniform(4.05,5.35)
                u,v,z=point(d,l);h=rng.uniform(.92,1.13)
                skin=lin(rng.choice((0xC09875,0xB48368,0xA87F63,0xCEAA88)))
                top=lin(rng.choice((0xB26761,0xC6AF8E,0x658480,0x566A87,0x9F8193,0x697177)))
                for side in (-1,1):
                    box(art,u+side*.105,v,z,.14,.16,.76*h,0x404251)
                    beam(art,(u+side*.21,v,z+1.28*h),(u+side*.29,v-.14,z+(.91 if j else 1.48)*h),.11,.13,skin)
                art.tube((u,v,z+.75*h),.19,.25,.59*h,top,top,7)
                art.tube((u,v,z+1.33*h),.145,.14,.30*h,skin,skin,7)
                art.tube((u,v,z+1.59*h),.148,.10,.11*h,lin(0x473D3D),lin(0x534540),7)
    for i in range(48):
        x=1440+(i%16)*17+rng.uniform(-5,5);y=shore(x)+9+(i//16)*9
        h=rng.uniform(5.4,9.4)
        art.tube((x,y,5),.29,.19,h*.66,lin(0x666457),lin(0x766F60),6)
        art.tube((x,y,5+h*.46),2.2,3.2,h*.37,lin(0x354F46),lin(0x4D6651),8)
        art.tube((x,y,5+h*.82),3.2,.52,h*.38,lin(0x4D6651),lin(0x5C6B53),8)
    x=1660;y=shore(x)+11
    box(art,x,y,5.1,13,12,1.37,0xAD9E87)
    for j in range(3):
        a=j*math.tau/3;dx,dy=math.cos(a),math.sin(a)
        for off in (-1,1):
            base=(x+7*dx+off*1.3*dy,y+7*dy-off*1.3*dx,6.47)
            peak=(x+1.6*dx+off*.49*dy,y+1.6*dy-off*.49*dx,29.8)
            beam(art,base,peak,1.8,2.15,lin(0xCBC2A9))
        beam(near,(x+7*dx,y+7*dy,6.6),(x+1.6*dx,y+1.6*dy,29.8),.48,.32,lin(0xD8C7A2))
    return {'efforts':0}
