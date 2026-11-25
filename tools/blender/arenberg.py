"""A single 2.4 km sector of the Trouée d’Arenberg, from the old mine to the open forest."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from worldkit import Painted,lin,smooth

ENTRY=320
EXIT=2720


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def heading(d):
        if d<ENTRY:return .46*(1-smooth(2,168,d))
        if d<=EXIT:return 0
        return .25*math.sin((d-EXIT)/490)*smooth(EXIT,EXIT+240,d)
    x,y,z=-bc.LEAD_IN,0,0
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        stage=bc.stage_at(stages,min(length-.001,max(0,d)))
        g=.19*(stage['level']-mean)+.52*math.sin(d/440)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(heading(d+1)-heading(d-1))/2,g=g))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*g/100
    return samples,stages,length,mean,.19


def terrain(road,col,theme,bc):
    b=bc.Builder('Forest floor','terrain');b.colours=[]
    sides=(-210,-45,-13,-5,-3,-2.15,2.15,3,5,13,45,210)
    heights=(.2,.02,.26,.12,-.10,-.10,-.10,-.10,.08,.18,.10,.15)
    colours=(0x73765E,0x616A50,0x616749,0x797651,0x6E614B,0x665B46,0x70634A,0x75694F,0x656B4C,0x667052,0x757B65)
    for i in range(0,len(road.s)-1,4):
        j=min(i+4,len(road.s)-1)
        for n in range(len(sides)-1):
            corners=((i,n),(j,n),(j,n+1),(i,n+1))
            b.faces.append(tuple(b.v(road.at(k,sides[r],heights[r])) for k,r in corners))
            for k,r in corners:
                tint=lin(colours[n])
                shade=.91+.08*math.sin(road.s[k]['d']/19+sides[r]*.31)
                b.colours.append(tuple(q*shade for q in tint[:3])+(1,))
    return b.build(col),lambda x,y:0


THEME={'lay':route,'land_builder':terrain,'terrain':{'sea':False},'land':{'mid':0x687253},'edge':'pave','kerbs':False,
       'wet':.28,'sky':[0xD9DCD8,0xCAD1D0,0xBCC9C9,0xAABABD,0x9AAFB4],'haze':0xCFD3CE,
       'light':[0xEEEBDF,2.65],'fill':[0xD9E2DE,0x879278],'sun_altitude':.60,'sun_azimuth':2.8,
       'palette':{'asphalt':0x696963,'sand':0x726047}}


def beam(art,a,b,width,tint):
    a,b=Vector(a),Vector(b);axis=(b-a).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01:side=Vector((1,0,0))
    side.normalize();up=axis.cross(side).normalized()
    offsets=[(side*u+up*v)*width*.5 for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for i in range(4):
        j=(i+1)%4
        art.face((a+offsets[i],b+offsets[i],b+offsets[j],a+offsets[j]),(tint,)*4)


def headframe(art,x,y,z,scale):
    steel,rust,roof=map(lin,(0x515C5D,0x80695F,0x667173))
    def pt(u,v,h):return (x+u*scale,y+v*scale,z+h*scale)
    for v in (-4.6,4.6):
        for u in (-6,6):
            beam(art,pt(u,v,0),pt(u*.48,v*.74,31),.63*scale,steel)
        beam(art,pt(17,v,0),pt(2,v*.75,29),.73*scale,steel)
        for j in range(4):
            h=j*6.5
            span=5.7-j*.67
            beam(art,pt(-span,v*(1-j*.045),h),pt(span-.66,v*(1-(j+1)*.045),h+6.5),.36*scale,steel)
            beam(art,pt(span,v*(1-j*.045),h),pt(-span+.66,v*(1-(j+1)*.045),h+6.5),.36*scale,steel)
    art.box(pt(0,0,29),(9*scale,10*scale,.72*scale),0,steel)
    for v in (-2.5,2.5):
        for j in range(18):
            a=j*math.tau/18;b=(j+1)*math.tau/18
            def rim(angle):return pt(2.5*math.cos(angle),v,32+2.5*math.sin(angle))
            beam(art,rim(a),rim(b),.32*scale,rust)
            if not j%2:beam(art,pt(0,v,32),rim(a),.13*scale,steel)
        beam(art,pt(0,v,34.3),pt(19,v,5),.11*scale,steel)
    for u in (-4,4):
        for v in (-4,4):beam(art,pt(u,v,29),pt(u,v,36),.24*scale,steel)
    art.roof(pt(0,0,36),10*scale,11*scale,1.25*scale,0,roof)


def bridge(k,art,d):
    i=k.road.index(d);steel=lin(0x6A6A64);brick=lin(0x847768)
    def p(u,v,h):return k.P(i,u,v,h)
    for side in (-1,1):
        art.box(p(0,side*6.1,-.15),(5.2,1.55,5.7),0,brick)
        art.box(p(0,side*6.1,5.55),(5.65,1.83,.46),0,lin(0x979487))
    art.box(p(0,0,5.98),(5.3,21,.68),0,steel)
    for u in (-2.66,2.66):
        for v in range(-6,7):
            art.box(p(u,v,6.07),(.10,.055,.55),0,lin(0x886B58))
        art.box(p(u,0,6.6),(.18,21,.71),0,lin(0x565F60))
        for j in range(-10,11):
            art.box(p(u,j,6.6),(.07,.09,1.49),0,steel)
        art.box(p(u,0,8.0),(.08,21,.10),0,steel)


def forest(k,art,d,side):
    rng=k.rng
    i=k.road.index(d)
    # Canopy tips approach the centre, while the road stays visible to its vanishing point.
    x,y,z=k.road.at(i,side*rng.uniform(4.4,8.0),.06)
    birch=rng.random()<.31
    bark=lin(0xC9C8B9 if birch else 0x695F51);shade=lin(0x807F73 if birch else 0x565247)
    height=rng.uniform(9,16.5);rad=rng.uniform(.13,.24) if birch else rng.uniform(.27,.53)
    art.tube((x,y,z),rad*1.35,rad*.63,height*.73,bark,shade,7)
    if birch:
        for j in range(5):
            h=height*(.11+j*.093)
            art.box((x-rad*.83,y,z+h),(.07,rad*1.17,.13),0,shade)
    for j in range(3):
        a=j*2.08+rng.uniform(-.4,.4)
        dx,dy=3.2*math.cos(a),3.2*math.sin(a)-side*.9
        h=height*(.75+.08*j)
        beam(art,(x,y,z+height*.58),(x+dx,y+dy,z+h),rad*.65,bark)
        green=lin(rng.choice((0x5A6946,0x6C7C53,0x84906B,0x687654)))
        art.tube((x+dx,y+dy,z+h-.5),1.65,2.9,1.2,green,green,8)
        art.tube((x+dx,y+dy,z+h+.7),2.9,.58,1.85,green,green,8,green)
    if ENTRY-80<d<EXIT+150:
        # The second row is visible between foreground trunks and the verge.
        # Different heights and uneven spacing break up the regular avenue.
        bx=x+rng.uniform(-4,4);by=y+side*rng.uniform(4.6,9)
        art.tube((bx,by,z),rad*.72,rad*.45,height*.70,shade,bark,7)
        canopy=lin(rng.choice((0x4C6040,0x566943,0x64764B)))
        art.tube((bx,by,z+height*.52),.6,3.5,height*.26,canopy,canopy,8)
        art.tube((bx,by,z+height*.78),3.5,.33,height*.22,canopy,canopy,8,canopy)
        # Leaf sprays on separate oblique planes break the outline of each crown.
        foliage=Painted(k,'arenberg-foliage')
        for q in range(7):
            angle=q*math.tau/7+rng.uniform(-.29,.29)
            reach=rng.uniform(2.8,4.7)
            cx=x+reach*math.cos(angle)
            cy=y+reach*math.sin(angle)-side*1.45
            cz=z+height*rng.uniform(.70,.91)
            w=rng.uniform(1.2,2.3);h=rng.uniform(1.25,2.85)
            tx,ty=-math.sin(angle)*w,math.cos(angle)*w
            a=(cx-tx,cy-ty,cz);b=(cx+tx,cy+ty,cz+.23)
            c=(cx+tx+.5,cy+ty+.24,cz+h);e=(cx-tx+.5,cy-ty+.24,cz+h)
            foliage.face((a,b,c,e),(canopy,)*4)
            if foliage.b.uvs is None:foliage.b.uvs=[]
            foliage.b.uvs.extend(((0,0),(1,0),(1,1),(0,1)))
        for j in range(3):
            gx=x+rng.uniform(-2.6,2.6);gy=y+side*rng.uniform(.1,4.2)
            leafy=lin(rng.choice((0x647749,0x748151,0x5B6C49)))
            art.tube((gx,gy,z+.02),.72,1.26,.85,leafy,leafy,7)
            art.tube((gx,gy,z+.87),1.26,.16,1.1,leafy,leafy,7,leafy)
    if d%3==0:
        art.tube((x,y+side*3,z),.4,1.8,.9,shade,lin(0x606B49),7,lin(0x63714D))


def scenery(k):
    art=Painted(k)
    brick,glass,iron,cream=map(lin,(0x945F4B,0x596C73,0x656B6C,0xD3D2BD))
    for d,side,scale in ((148,19,1),(204,41,.76),(254,63,.62)):
        x,y,z=k.road.at(k.road.index(d),side)
        headframe(art,x,y,z,scale)
        art.box((x+9,y+8,z),(24,14,8),0,brick)
        art.roof((x+9,y+8,z+8),24,14,3.4,0,lin(0x58676B))
        for j in range(-2,20,3):
            art.box((x+j,y+.93,z+2.1),(1.65,.13,3.4),0,glass)
    bridge(k,art,485)
    for d in range(25,318,19):
        # Colliery fence and bollards lead the eye to the steel lattice.
        x,y,z=k.road.at(k.road.index(d),6.8)
        art.box((x,y,z),(.19,.22,1.54),0,iron)
        art.box((x+8.8,y,z+.72),(17.7,.13,.09),0,iron)
    for d in range(210,int(k.length),8):
        for side in (-1,1):
            if d>EXIT and (d//280)%3==1 and side>0:continue
            forest(k,art,d,side)
    for d in range(260,1060,3):
        for side in (-1,1):
            x,y,z=k.road.at(k.road.index(d),side*3.35)
            art.box((x,y,z),(.085,.10,1.14),0,iron)
            art.box((x+1.4,y,z+.19),(2.85,.075,.07),0,iron)
            art.box((x+1.4,y,z+1.04),(2.85,.09,.10),0,iron)
            for j in range(3):
                art.box((x+.55+j*.75,y,z+.22),(.045,.053,.84),0,iron)
            for j in range(2):
                px=x+k.rng.uniform(-.9,.9);py=y+side*(.65+j*.64)
                skin=lin(k.rng.choice((0xAC8268,0xD3A882,0x96765F)))
                kit=lin(k.rng.choice((0x4C697A,0xA85147,0xD0B666,0x69754C)))
                for u in (-.092,.092):art.tube((px+u,py,z),.072,.094,.76,iron,iron,6)
                art.tube((px,py,z+.75),.16,.22,.6,kit,kit,7)
                art.tube((px,py,z+1.35),.12,.12,.23,skin,skin,7,skin)
                beam(art,(px,py,z+1.2),(px+.29,py-side*.18,z+1.45+j*.19),.095,skin)
    # Shallow irregular puddles interrupt the rutted dark gutter beside the crown.
    for d in range(ENTRY,EXIT,7):
        side=k.rng.choice((-1,1));i=k.road.index(d)
        length=k.rng.uniform(1.4,4.1);wide=k.rng.uniform(.12,.31);left=side*k.rng.uniform(2.55,2.94)
        pts=tuple(k.P(i,length*math.cos(j*math.tau/8),left+wide*math.sin(j*math.tau/8),-.075) for j in range(8))
        art.face(pts,(lin(0x899490),)*8)
    for d in range(ENTRY+9,1040,19):
        i=k.road.index(d);side=k.rng.choice((-1,1));left=side*4.5
        x,y,z=k.P(i,0,left)
        art.tube((x,y,z),.03,.025,3.25,iron,iron,6)
        colours=(0x494747,0xDAC249,0xA25147) if d%2 else (0x455B7F,0xD7D6C4,0xA14D46)
        for j in range(3):
            u,v=j*.42,(j+1)*.42
            quad=tuple((x+t,y+.075*math.sin(t*6),z+h-t*.10) for t,h in ((u,2.45),(v,2.45),(v,3.17),(u,3.17)))
            art.face(quad,(lin(colours[j]),)*4);art.face(quad[::-1],(lin(colours[j]),)*4)
    for d in (352,410,626,754):
        x,y,z=k.P(k.road.index(d),0,-3.41)
        art.box((x,y,z+.30),(4.8,.08,.69),0,lin(0xBEA735))
        words(art,"FLANDRES", (x,y+.051,z+.51),(-1,0,0),(0,0,1),.43,4.2,0x393E3E)
    convoy(k)
    gate(k,art)
    return {'efforts':0}

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



def gate(k,art):
    i=k.road.index(ENTRY)
    black,pale=lin(0x454B4E),lin(0xECE8D5)
    for v in (-3.5,3.5):
        art.box(k.P(i,0,v,0),(.47,.47,4.65),0,black)
    art.box(k.P(i,0,0,4.59),(.5,7.7,1.03),0,black)
    words(art,"TROUÉE D'ARENBERG",k.P(i,-.27,0,4.91),(0,-1,0),(0,0,1),.44,5.55,0xEEEAD9)
    for d in (-2.2,2.2):
        for n in range(5):
            y=d+(n-2)*.26
            cx,cy,cz=k.P(i,-.27,y,4.77)
            poly=[(cx,cy+.104*math.cos(a*math.pi/5)*(1 if a%2==0 else .40),cz+.104*math.sin(a*math.pi/5)*(1 if a%2==0 else .40)) for a in range(10)]
            for j in range(10):
                art.face(((cx,cy,cz),poly[(j+1)%10],poly[j]),(pale,)*3)
    x,y,z=k.road.at(k.road.index(ENTRY-42),-3.6)
    art.box((x,y,z),(.11,.13,2.2),0,black)
    art.box((x,y,z+1.45),(.13,2.8,.79),0,pale)
    words(art,"WALLERS", (x-.081,y,z+1.89),(0,-1,0),(0,0,1),.30,2.55,0x504E45)
    words(art,"ARENBERG",(x-.081,y,z+1.55),(0,-1,0),(0,0,1),.30,2.55,0x504E45)


def tyre(art,x,y,z,radius,width):
    black,rim=lin(0x333536),lin(0x82898B)
    def pt(a,r,w):
        return x+w,y+r*math.cos(a),z+r*math.sin(a)
    for j in range(16):
        a,b=j*math.tau/16,(j+1)*math.tau/16
        art.face((pt(a,radius,-width),pt(b,radius,-width),pt(b,radius,width),pt(a,radius,width)),(black,)*4)
        for face in (-width,width):
            quad=(pt(a,radius,face),pt(b,radius,face),pt(b,radius*.72,face),pt(a,radius*.72,face))
            art.face(quad,(black,)*4);art.face(quad[::-1],(black,)*4)
            if j%2==0:beam(art,(x+face,y,z),pt(a,radius*.77,face),.023,rim)


def convoy(k):
    art=Painted(k,'commissaire')
    blue,black,yellow,red,pale=map(lin,(0x315C80,0x393D41,0xE9C652,0xAA493C,0xD8D9CB))
    for y in (-.70,.71):tyre(art,0,y,.32,.32,.084)
    for y in (-.62,.64):
        beam(art,(0,y,.31),(0,.10,.81),.10,black)
    art.box((0,-.14,.42),(.42,.93,.35),0,black)
    art.box((0,.14,.73),(.49,.59,.27),0,blue)
    art.box((0,-.38,.76),(.39,.56,.125),0,black)
    for side in (-1,1):
        art.box((side*.33,-.47,.51),(.21,.57,.36),0,pale)
        art.box((side*.33,-.68,.60),(.23,.04,.16),0,red)
    art.tube((0,-.21,.86),.17,.21,.47,yellow,blue,8)
    art.tube((0,-.11,1.35),.13,.14,.24,pale,pale,10,pale)
    art.box((0,-.55,1.05),(.29,.10,.42),0,yellow)
    for side in (-1,1):
        beam(art,(side*.18,-.12,1.19),(side*.30,.34,1.04),.08,blue)
    art.box((0,.54,.86),(.38,.24,.20),0,pale)
    art=Painted(k,'team-car')
    body,glass=lin(0xA75746),lin(0x61747D)
    for x in (-.78,.78):
        for y in (-1.2,1.18):
            tyre(art,x,y,.32,.32,.095)
    art.box((0,0,.35),(1.63,3.94,.6),0,body)
    art.box((0,-.27,.95),(1.49,2.37,.54),0,glass)
    art.box((0,-.3,1.49),(1.52,2.43,.11),0,body)
    for x in (-.74,.74):
        for y in (-.91,.31,.86):art.box((x,y,.96),(.055,.075,.52),0,body)
    for x in (-.56,.56):
        art.box((x,1.97,.58),(.39,.06,.17),0,pale)
        art.box((x,-1.98,.60),(.38,.06,.16),0,red)
    # Two spare wheels and a roof rack distinguish a following team car at riding distance.
    for y in (-.85,.54):art.box((0,y,1.62),(1.5,.10,.10),0,black)
    for x in (-.34,.34):
        for y in (-.71,.56):tyre(art,x,y,2.02,.33,.022)
        for a,b in (((-.71,2),(-.16,2.40)),((-.16,2.40),(0,2)),((0,2),(-.71,2)),((0,2),(.40,2.40)),((.40,2.4),(.56,2))):
            beam(art,(x,a[0],a[1]),(x,b[0],b[1]),.047,yellow)
